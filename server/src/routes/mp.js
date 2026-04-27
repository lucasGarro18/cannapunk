const router  = require('express').Router()
const { z }   = require('zod')
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const { serializeAddress } = require('../sqlite')
const { notify }      = require('../notify')
const { sendOrderConfirmation } = require('../mailer')

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
})

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  buyer: { select: { id: true, name: true, username: true, avatar: true, email: true } },
}

// POST /api/mp/checkout — crea una preferencia y devuelve init_point
router.post('/checkout', requireAuth, async (req, res) => {
  const schema = z.object({
    items: z.array(z.object({
      productId: z.string(),
      qty:       z.number().int().positive(),
    })).min(1),
    address:    z.object({
      fullName: z.string(),
      street:   z.string(),
      city:     z.string(),
      zip:      z.string().optional(),
      province: z.string().optional(),
      phone:    z.string().optional(),
      notes:    z.string().optional(),
    }),
    referrerId: z.string().optional(),
    couponCode: z.string().optional(),
  })

  const { items, address, referrerId, couponCode } = schema.parse(req.body)

  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) } },
  })

  let subtotal = 0
  const mpItems = items.map(({ productId, qty }) => {
    const p = products.find(p => p.id === productId)
    if (!p) throw Object.assign(new Error(`Producto ${productId} no encontrado`), { status: 400 })
    if (p.stock < qty) throw Object.assign(new Error(`Stock insuficiente: ${p.name}`), { status: 400 })
    subtotal += p.price * qty
    return {
      id:          p.id,
      title:       p.name,
      quantity:    qty,
      unit_price:  p.price / 100,  // MP usa pesos con decimales; el schema guarda centavos
      currency_id: 'ARS',
    }
  })

  // Validar cupón si se envió
  let discount = 0
  let resolvedCouponCode = null
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } })
    const valid = coupon && coupon.active
      && (!coupon.expiresAt || coupon.expiresAt > new Date())
      && (coupon.maxUses === null || coupon.usedCount < coupon.maxUses)
      && subtotal >= coupon.minOrder
    if (valid) {
      discount = coupon.type === 'percent'
        ? Math.round(subtotal * coupon.value / 100)
        : Math.min(coupon.value, subtotal)
      resolvedCouponCode = coupon.code
    }
  }
  const total = subtotal - discount

  // Si hay descuento, usar un ítem agregado para que MP cobre el total correcto
  const finalMpItems = discount > 0
    ? [{ id: 'order', title: `CannaPunk — ${items.length} producto(s)`, quantity: 1, unit_price: total / 100, currency_id: 'ARS' }]
    : mpItems

  const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

  const pref = new Preference(mp)
  const prefData = await pref.create({
    body: {
      items:      finalMpItems,
      payer:      { name: address.fullName, phone: { number: address.phone } },
      back_urls: {
        success: `${baseUrl}/orders?payment=success`,
        failure: `${baseUrl}/checkout?payment=failed`,
        pending: `${baseUrl}/orders?payment=pending`,
      },
      auto_return:         'approved',
      notification_url:    `${process.env.API_URL ?? 'http://localhost:3001'}/api/mp/webhook`,
      external_reference:  req.user.id,
    },
  })

  // Guardar orden pendiente para procesarla en el webhook
  await prisma.pendingOrder.create({
    data: {
      mpPrefId:   prefData.id,
      buyerId:    req.user.id,
      items:      JSON.stringify(items),
      address:    serializeAddress(address),
      referrerId: referrerId ?? null,
      couponCode: resolvedCouponCode,
      total,
    },
  })

  res.json({ initPoint: prefData.init_point, prefId: prefData.id })
})

// POST /api/mp/webhook — recibe notificaciones de MercadoPago
router.post('/webhook', async (req, res) => {
  const { type, data } = req.body

  if (type !== 'payment') return res.sendStatus(200)

  try {
    const paymentApi = new Payment(mp)
    const payment    = await paymentApi.get({ id: data.id })

    if (payment.status !== 'approved') return res.sendStatus(200)

    const prefId  = payment.preference_id
    const pending = await prisma.pendingOrder.findUnique({ where: { mpPrefId: prefId } })
    if (!pending) return res.sendStatus(200)

    // Idempotency: si ya existe la orden para este prefId, no re-procesar
    const existing = await prisma.order.findFirst({
      where: { buyer: { id: pending.buyerId }, createdAt: { gte: new Date(Date.now() - 5 * 60_000) } },
    })
    if (existing) return res.sendStatus(200)

    const items = typeof pending.items === 'string' ? JSON.parse(pending.items) : pending.items

    const products = await prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
    })

    const orderItems = items.map(({ productId, qty }) => {
      const p = products.find(p => p.id === productId)
      return { productId, qty, unitPrice: p.price }
    })

    const order = await prisma.$transaction(async (tx) => {
      for (const { productId, qty } of orderItems) {
        await tx.product.update({
          where: { id: productId },
          data:  { stock: { decrement: qty }, salesCount: { increment: qty } },
        })
      }

      const newOrder = await tx.order.create({
        data: {
          buyerId:    pending.buyerId,
          total:      pending.total,
          address:    pending.address,
          referrerId: pending.referrerId ?? null,
          items:      { create: orderItems },
        },
        include: ORDER_INCLUDE,
      })

      if (pending.referrerId) {
        const video = await tx.video.findUnique({ where: { id: pending.referrerId } })
        if (video) {
          const commissionAmt = Math.round(pending.total * video.commissionPct / 100)
          await tx.commission.create({
            data: {
              creatorId: video.creatorId,
              videoId:   pending.referrerId,
              orderId:   newOrder.id,
              amount:    commissionAmt,
            },
          })
          await notify(tx, {
            userId:    video.creatorId,
            type:      'commission',
            title:     'Nueva comisión',
            body:      `Ganaste $${commissionAmt.toLocaleString('es-AR')} por tu video`,
            actionUrl: '/earnings',
          })
        }
      }

      await notify(tx, {
        userId:    pending.buyerId,
        type:      'order',
        title:     'Pedido confirmado',
        body:      'Tu pedido está en preparación. ¡Gracias por tu compra!',
        actionUrl: '/orders',
      })

      if (pending.couponCode) {
        await tx.coupon.update({
          where: { code: pending.couponCode },
          data:  { usedCount: { increment: 1 } },
        }).catch(() => {})
      }

      await tx.pendingOrder.delete({ where: { mpPrefId: prefId } })

      return newOrder
    })

    sendOrderConfirmation({
      to:    order.buyer.email,
      name:  order.buyer.name,
      orderId: order.id,
      items:   order.items,
      total:   order.total,
    }).catch(err => console.error('[Mailer order]', err.message))
  } catch (err) {
    console.error('[MP Webhook]', err)
  }

  res.sendStatus(200)
})

module.exports = router
