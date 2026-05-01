const router = require('express').Router()
const { z }  = require('zod')
const prisma             = require('../db')
const { requireAuth, optionalAuth } = require('../middleware/auth')
const { serializeTags, fixVideos, fixVideo } = require('../sqlite')
const { createUpload, genKey, uploadFile, deleteFile } = require('../storage')

const upload = createUpload({ maxMB: 200 })

const VIDEO_INCLUDE = {
  creator: { select: { id: true, name: true, username: true, avatar: true, roles: true } },
  product: true,
}

// GET /api/videos?page=1&limit=10&q=search
router.get('/', optionalAuth, async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(20, parseInt(req.query.limit) || 10)
  const q     = req.query.q?.trim()

  const where = q ? {
    OR: [
      { title:       { contains: q } },
      { description: { contains: q } },
      { tags:        { contains: q } },
      { creator:     { name: { contains: q } } },
      { creator:     { username: { contains: q } } },
    ],
  } : {}

  const [total, items] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      skip:    (page - 1) * limit,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: VIDEO_INCLUDE,
    }),
  ])

  const pages    = Math.ceil(total / limit)
  const nextPage = page < pages ? page + 1 : null
  res.json({ data: fixVideos(items), total, page, pages, nextPage })
})

// GET /api/videos/creator/:username
router.get('/creator/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) return res.status(404).json({ error: 'Creador no encontrado' })

  const videos = await prisma.video.findMany({
    where:   { creatorId: user.id },
    orderBy: { createdAt: 'desc' },
    include: VIDEO_INCLUDE,
  })
  res.json(fixVideos(videos))
})

// GET /api/videos/product/:productId
router.get('/product/:productId', async (req, res) => {
  const videos = await prisma.video.findMany({
    where:   { productId: req.params.productId },
    orderBy: { views: 'desc' },
    include: VIDEO_INCLUDE,
  })
  res.json(fixVideos(videos))
})

// POST /api/videos/upload — multipart con archivo real
router.post('/upload', requireAuth, upload.single('video'), async (req, res) => {
  const tags = req.body.tags ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  let videoUrl = req.body.videoUrl ?? null
  if (req.file) {
    const key = genKey('videos', req.file.originalname)
    videoUrl  = await uploadFile(req.file.buffer, key, req.file.mimetype)
  }

  let commissionPct = 0
  if (req.body.productId) {
    const p = await prisma.product.findUnique({ where: { id: req.body.productId } })
    if (p) {
      commissionPct = p.commissionPct
      await prisma.product.update({ where: { id: p.id }, data: { videoCount: { increment: 1 } } })
    }
  }

  const video = await prisma.video.create({
    data: {
      title:        req.body.title,
      description:  req.body.description ?? '',
      videoUrl,
      thumbnailUrl: req.body.thumbnailUrl ?? videoUrl,
      productId:    req.body.productId ?? undefined,
      tags:         serializeTags(tags),
      creatorId:    req.user.id,
      commissionPct,
    },
    include: VIDEO_INCLUDE,
  })
  res.status(201).json(fixVideo(video))
})

// POST /api/videos
router.post('/', requireAuth, async (req, res) => {
  const schema = z.object({
    title:        z.string().min(3),
    description:  z.string().optional(),
    thumbnailUrl: z.string().url().optional(),
    videoUrl:     z.string().url().optional(),
    productId:    z.string().optional(),
    tags:         z.array(z.string()).default([]),
  })
  const data  = schema.parse(req.body)

  let commissionPct = 0
  if (data.productId) {
    const p = await prisma.product.findUnique({ where: { id: data.productId } })
    if (p) {
      commissionPct = p.commissionPct
      await prisma.product.update({ where: { id: p.id }, data: { videoCount: { increment: 1 } } })
    }
  }

  const video = await prisma.video.create({
    data: { ...data, tags: serializeTags(data.tags), creatorId: req.user.id, commissionPct },
    include: VIDEO_INCLUDE,
  })
  res.status(201).json(fixVideo(video))
})

// POST /api/videos/:id/like
router.post('/:id/like', requireAuth, async (req, res) => {
  const video = await prisma.video.update({
    where: { id: req.params.id },
    data:  { likes: { increment: 1 } },
  })
  res.json({ likes: video.likes })
})

// POST /api/videos/:id/view
router.post('/:id/view', optionalAuth, async (req, res) => {
  await prisma.video.update({
    where: { id: req.params.id },
    data:  { views: { increment: 1 } },
  })
  res.status(204).send()
})

// DELETE /api/videos/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } })
  if (!video) return res.status(404).json({ error: 'Video no encontrado' })
  if (video.creatorId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' })
  await prisma.video.delete({ where: { id: req.params.id } })
  deleteFile(video.videoUrl) // cleanup async — no bloquea la respuesta
  res.status(204).send()
})

module.exports = router
