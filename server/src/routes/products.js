const router = require('express').Router()
const { z }  = require('zod')
const prisma             = require('../db')
const { requireAuth, optionalAuth } = require('../middleware/auth')
const { createUpload, genKey, uploadFile } = require('../storage')

const imgUpload = createUpload({ maxMB: 5, filter: (_, f, cb) => cb(null, f.mimetype.startsWith('image/')) })

// POST /api/products/upload-image
router.post('/upload-image', requireAuth, imgUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' })
  const key = genKey('images', req.file.originalname)
  const url = await uploadFile(req.file.buffer, key, req.file.mimetype)
  res.json({ url })
})

// GET /api/products?page=1&limit=20&category=&q=
router.get('/', optionalAuth, async (req, res) => {
  const page     = Math.max(1, parseInt(req.query.page)  || 1)
  const limit    = Math.min(50, parseInt(req.query.limit) || 20)
  const category = req.query.category
  const q        = req.query.q
  const sort     = req.query.sort || 'popular'
  const status   = req.query.status || 'active'

  const ORDER_BY = {
    popular:   { salesCount: 'desc' },
    newest:    { createdAt: 'desc' },
    price_asc: { price: 'asc' },
    price_desc:{ price: 'desc' },
    commission:{ commissionPct: 'desc' },
  }

  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined
  const discount = req.query.discount === '1'

  const where = {
    status,
    ...(category && { category }),
    ...(minPrice !== undefined || maxPrice !== undefined ? {
      price: {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      },
    } : {}),
    ...(discount && { originalPrice: { not: null } }),
    ...(q && {
      OR: [
        { name:        { contains: q } },
        { description: { contains: q } },
      ],
    }),
  }

  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: ORDER_BY[sort] ?? ORDER_BY.popular,
      include: { seller: { select: { id: true, name: true, username: true, avatar: true } } },
    }),
  ])

  const pages    = Math.ceil(total / limit)
  const nextPage = page < pages ? page + 1 : null
  res.json({ data: items, total, page, pages, nextPage })
})

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  const limit = parseInt(req.query.limit) || 12
  const items = await prisma.product.findMany({
    where:   { status: 'active', commissionPct: { gt: 0 } },
    take:    limit,
    orderBy: { salesCount: 'desc' },
    include: { seller: { select: { id: true, name: true, username: true, avatar: true } } },
  })
  res.json(items)
})

// GET /api/products/mine — productos del vendedor autenticado
router.get('/mine', requireAuth, async (req, res) => {
  const products = await prisma.product.findMany({
    where:   { sellerId: req.user.id },
    orderBy: { createdAt: 'desc' },
  })
  res.json(products)
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where:   { id: req.params.id },
    include: { seller: { select: { id: true, name: true, username: true, avatar: true } } },
  })
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
  res.json(product)
})

// POST /api/products — vendedor crea producto
router.post('/', requireAuth, async (req, res) => {
  const schema = z.object({
    name:          z.string().min(2),
    description:   z.string().min(5),
    price:         z.number().int().positive(),
    originalPrice: z.number().int().positive().optional(),
    category:      z.string(),
    imageUrl:      z.string().url().optional(),
    commissionPct: z.number().int().min(0).max(30).default(8),
    stock:         z.number().int().min(0).default(10),
  })
  const data = schema.parse(req.body)
  const product = await prisma.product.create({
    data: { ...data, sellerId: req.user.id, status: 'pending' },
  })
  res.status(201).json(product)
})

// PATCH /api/products/:id — vendedor edita su producto
router.patch('/:id', requireAuth, async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
  if (product.sellerId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' })

  const allowed = ['name', 'description', 'price', 'originalPrice', 'category',
                   'imageUrl', 'commissionPct', 'stock', 'status']
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  )
  const updated = await prisma.product.update({ where: { id: req.params.id }, data })
  res.json(updated)
})

// DELETE /api/products/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
  if (product.sellerId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' })
  await prisma.product.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

module.exports = router
