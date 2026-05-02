const express  = require('express')
const { z }    = require('zod')
const webpush  = require('web-push')
const prisma   = require('../db')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'admin@cannapont.com'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

const SubSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
})

router.get('/vapid-public-key', (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY ?? null })
})

router.post('/subscribe', requireAuth, async (req, res) => {
  const { endpoint, keys } = SubSchema.parse(req.body)
  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: req.user.id },
  })
  res.json({ ok: true })
})

router.delete('/subscribe', requireAuth, async (req, res) => {
  const { endpoint } = req.body ?? {}
  if (endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: req.user.id } })
  }
  res.json({ ok: true })
})

module.exports = router
