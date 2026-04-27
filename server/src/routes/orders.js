const router = require('express').Router()
const { z }  = require('zod')
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const { serializeAddress, fixOrders, fixOrder } = require('../sqlite')
const { notify }      = require('../notify')

const ORDER_INCLUDE = {
  items: {
    include: { product: true },
  },
  buyer:     { select: { id: true, name: true, username: true, avatar: true } },
  deliverer: { select: { id: true, name: true, username: true, avatar: true } },
}

// GET /api/orders — pedidos del usuario autenticado
router.get('/', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where:   { buyerId: req.user.id },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
  res.json(fixOrders(orders))
})

// GET /api/orders/seller — pedidos que contienen productos del vendedor autenticado
router.get('/seller', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      items: { some: { product: { sellerId: req.user.id } } },
    },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
  res.json(fixOrders(orders))
})

// GET /api/orders/delivery — entregas pendientes para repartidor
router.get('/delivery', requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where:   { status: { in: ['processing', 'pickup', 'shipping'] } },
    include: ORDER_INCLUDE,
    orderBy: { createdAt: 'desc' },
  })
  res.json(fixOrders(orders))
})

// GET /api/orders/:id
router.get('/:id', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where:   { id: req.params.id },
    include: ORDER_INCLUDE,
  })
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })
  if (order.buyerId !== req.user.id && order.delivererId !== req.user.id) {
    return res.status(403).json({ error: 'Sin permiso' })
  }
  res.json(fixOrder(order))
})

// POST /api/orders — crear pedido desde el carrito
router.post('/', requireAuth, async (req, res) => {
  const schema = z.object({
    items: z.array(z.object({
      productId: z.string(),
      qty:       z.number().int().positive(),
    })).min(1),
    address:    z.object({
      street: z.string(),
      city:   z.string(),
      zip:    z.string().optional(),
    }),
    referrerId: z.string().optional(),
  })
  const { items, address, referrerId } = schema.parse(req.body)

  // Fetch products and validate stock
  const products = await prisma.product.findMany({
    where: { id: { in: items.map(i => i.productId) } },
  })

  let total = 0
  const orderItems = items.map(({ productId, qty }) => {
    const p = products.find(p => p.id === productId)
    if (!p) throw Object.assign(new Error(`Producto ${productId} no encontrado`), { status: 400 })
    if (p.stock < qty) throw Object.assign(new Error(`Stock insuficiente: ${p.name}`), { status: 400 })
    total += p.price * qty
    return { productId, qty, unitPrice: p.price }
  })

  const order = await prisma.$transaction(async (tx) => {
    // Decrease stock
    for (const { productId, qty } of orderItems) {
      await tx.product.update({
        where: { id: productId },
        data:  { stock: { decrement: qty }, salesCount: { increment: qty } },
      })
    }

    const created = await tx.order.create({
      data: {
        buyerId: req.user.id,
        total,
        address: serializeAddress(address),
        referrerId: referrerId || null,
        items: { create: orderItems },
      },
      include: ORDER_INCLUDE,
    })

    // Create commissions if there's a referrer video
    if (referrerId) {
      const video = await tx.video.findUnique({ where: { id: referrerId } })
      if (video) {
        const commissionAmt = Math.round(total * video.commissionPct / 100)
        await tx.commission.create({
          data: {
            creatorId: video.creatorId,
            videoId:   referrerId,
            orderId:   created.id,
            amount:    commissionAmt,
          },
        })
        // Notify creator
        await tx.notification.create({
          data: {
            userId: video.creatorId,
            type:   'commission',
            title:  'Nueva comisión',
            body:   `Ganaste $${commissionAmt.toLocaleString('es-AR')} por tu video`,
          },
        })
      }
    }

    // Notify buyer
    await tx.notification.create({
      data: {
        userId: req.user.id,
        type:   'order',
        title:  'Pedido confirmado',
        body:   `Tu pedido ${created.id} está en preparación.`,
      },
    })

    return created
  })

  res.status(201).json(order)
})

// PATCH /api/orders/:id/cancel — el comprador cancela su pedido
router.patch('/:id/cancel', requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({
    where:   { id: req.params.id },
    include: { items: { include: { product: true } } },
  })
  if (!order) return res.status(404).json({ error: 'Pedido no encontrado' })
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' })
  if (order.status !== 'processing') {
    return res.status(400).json({ error: 'Solo se pueden cancelar pedidos en preparación' })
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status: 'cancelled' } })

    // Restore stock
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data:  { stock: { increment: item.qty }, salesCount: { decrement: item.qty } },
      })
    }

    // Void pending commissions
    await tx.commission.updateMany({
      where: { orderId: order.id, status: 'pending' },
      data:  { status: 'cancelled' },
    })
  })

  await notify(prisma, {
    userId:    req.user.id,
    type:      'order',
    title:     'Pedido cancelado',
    body:      `Tu pedido ${order.id} fue cancelado exitosamente.`,
    actionUrl: '/orders',
  })

  res.json({ id: order.id, status: 'cancelled' })
})

// PATCH /api/orders/:id/status — repartidor avanza el estado
router.patch('/:id/status', requireAuth, async (req, res) => {
  if (!req.user.roles?.includes('delivery')) {
    return res.status(403).json({ error: 'Se requiere rol repartidor' })
  }

  const { status } = z.object({
    status: z.enum(['pickup', 'shipping', 'delivered']),
  }).parse(req.body)

  const order = await prisma.order.update({
    where:   { id: req.params.id },
    data:    { status, delivererId: req.user.id },
    include: ORDER_INCLUDE,
  })

  if (status === 'delivered') {
    // eslint-disable-next-line no-unused-vars
    // Mark commissions as paid
    await prisma.commission.updateMany({
      where: { orderId: order.id },
      data:  { status: 'paid' },
    })
  }

  res.json(fixOrder(order))
})

module.exports = router
