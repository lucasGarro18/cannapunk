const router = require('express').Router()
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const { fixUser }     = require('../sqlite')
const { notify }      = require('../notify')

const CREATOR_SELECT = {
  id: true, name: true, username: true, avatar: true, bio: true,
  roles: true, createdAt: true,
  _count: { select: { videos: true, followers: true } },
}

// GET /api/creators/top?limit=6
router.get('/top', async (req, res) => {
  const limit = Math.min(50, parseInt(req.query.limit) || 6)

  const creators = await prisma.user.findMany({
    where:   { roles: { contains: 'creator' }, videos: { some: {} } },
    take:    limit,
    orderBy: { videos: { _count: 'desc' } },
    select:  CREATOR_SELECT,
  })

  // Attach computed fields
  const enriched = await Promise.all(creators.map(async (c) => {
    const totalEarned = await prisma.commission.aggregate({
      where:  { creatorId: c.id, status: 'paid' },
      _sum:   { amount: true },
    })
    return {
      ...fixUser(c),
      videoCount:   c._count.videos,
      followers:    c._count.followers,
      totalEarned:  totalEarned._sum.amount ?? 0,
    }
  }))

  res.json(enriched)
})

// GET /api/creators/:username
router.get('/:username', async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { username: req.params.username },
    select: CREATOR_SELECT,
  })
  if (!user) return res.status(404).json({ error: 'Creador no encontrado' })

  const totalEarned = await prisma.commission.aggregate({
    where: { creatorId: user.id, status: 'paid' },
    _sum:  { amount: true },
  })

  res.json({
    ...fixUser(user),
    videoCount:  user._count.videos,
    followers:   user._count.followers,
    totalEarned: totalEarned._sum.amount ?? 0,
  })
})

// POST /api/creators/:username/follow
router.post('/:username/follow', requireAuth, async (req, res) => {
  const target = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' })
  if (target.id === req.user.id) return res.status(400).json({ error: 'No podés seguirte a vos mismo' })

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user.id, followingId: target.id } },
  })

  if (existing) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: req.user.id, followingId: target.id } },
    })
    return res.json({ following: false })
  }

  await prisma.follow.create({ data: { followerId: req.user.id, followingId: target.id } })

  // Notify
  await notify(prisma, {
    userId:    target.id,
    type:      'follower',
    title:     'Nuevo seguidor',
    body:      `@${req.user.username} empezó a seguirte`,
    actionUrl: `/profile/${req.user.username}`,
  })

  res.json({ following: true })
})

module.exports = router
