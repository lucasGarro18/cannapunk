const router  = require('express').Router()
const { z }   = require('zod')
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const { serializeAddress } = require('../sqlite')
const { notify }      = require('../notify')

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
})

const ORDER_INCLUDE = {
  items: { include: { product: true } },
  buyer: { select: { id: true, name: true, username: true, avatar: true } },
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
  })

  const { items, address, referrerId } = schema.parse(req.body)

  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) } },
  })

  let total = 0
  const mpItems = items.map(({ productId, qty }) => {
    const p = products.find(p => p.id === productId)
    if (!p) throw Object.assign(new Error(`Producto ${productId} no encontrado`), { status: 400 })
    if (p.stock < qty) throw Object.assign(new Error(`Stock insuficiente: ${p.name}`), { status: 400 })
    total += p.price * qty
    return {
      id:          p.id,
      title:       p.name,
      quantity:    qty,
      unit_price:  p.price / 100,  // MP usa pesos con decimales; el schema guarda centavos
      currency_id: 'ARS',
    }
  })

  const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173'

  const pref = new Preference(mp)
  const prefData = await pref.create({
    body: {
      items:      mpItems,
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

    await prisma.$transaction(async (tx) => {
      for (const { productId, qty } of orderItems) {
        await tx.product.update({
          where: { id: productId },
          data:  { stock: { decrement: qty }, salesCount: { increment: qty } },
        })
      }

      const order = await tx.order.create({
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
              orderId:   order.id,
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

      await tx.pendingOrder.delete({ where: { mpPrefId: prefId } })
    })
  } catch (err) {
    console.error('[MP Webhook]', err)
  }

  res.sendStatus(200)
})

module.exports = router
