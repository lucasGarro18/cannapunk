const router = require('express').Router()
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  const notifs = await prisma.notification.findMany({
    where:   { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take:    50,
  })
  res.json(notifs)
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user.id },
    data:  { read: true },
  })
  res.status(204).send()
})

// PATCH /api/notifications/read-all
router.patch('/read-all', requireAuth, async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, read: false },
    data:  { read: true },
  })
  res.status(204).send()
})

module.exports = router
