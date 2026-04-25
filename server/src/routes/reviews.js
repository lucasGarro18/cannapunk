const router = require('express').Router()
const { z }           = require('zod')
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const { notify }      = require('../notify')

// GET /api/reviews/product/:productId
router.get('/product/:productId', async (req, res) => {
  const reviews = await prisma.review.findMany({
    where:   { productId: req.params.productId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
  })
  res.json(reviews)
})

// POST /api/reviews/product/:productId
router.post('/product/:productId', requireAuth, async (req, res) => {
  const { rating, body, orderId } = z.object({
    rating:  z.number().int().min(1).max(5),
    body:    z.string().max(500).optional(),
    orderId: z.string(),
  }).parse(req.body)

  const userId    = req.user.id
  const productId = req.params.productId

  // Verificar que el usuario compró el producto
  const orderItem = await prisma.orderItem.findFirst({
    where: { orderId, productId, order: { buyerId: userId, status: 'delivered' } },
  })
  if (!orderItem) return res.status(403).json({ error: 'Solo podés reseñar productos que ya recibiste' })

  const existing = await prisma.review.findUnique({ where: { userId_productId: { userId, productId } } })
  if (existing) return res.status(409).json({ error: 'Ya dejaste una reseña para este producto' })

  const review = await prisma.review.create({
    data:    { rating, body, userId, productId, orderId },
    include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
  })

  // Actualizar rating promedio del producto
  const { _avg, _count } = await prisma.review.aggregate({
    where:  { productId },
    _avg:   { rating: true },
    _count: { rating: true },
  })
  await prisma.product.update({
    where: { id: productId },
    data:  { rating: Math.round((_avg.rating ?? 0) * 10) / 10, reviewCount: _count.rating },
  })

  // Notificar al vendedor
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { name: true, sellerId: true } })
  if (product) {
    await notify(prisma, {
      userId:    product.sellerId,
      type:      'sale',
      title:     'Nueva reseña en tu producto',
      body:      `${review.user.name} le dio ${rating} estrellas a "${product.name}"`,
      actionUrl: `/product/${productId}`,
    })
  }

  res.status(201).json(review)
})

module.exports = router
