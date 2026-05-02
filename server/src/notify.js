const prisma   = require('./db')
const ioModule = require('./io')

let webpush = null
try { webpush = require('web-push') } catch {}

async function notify(db, { userId, type, title, body, actionUrl = null }) {
  const notif = await db.notification.create({
    data: { userId, type, title, body, actionUrl },
  })
  ioModule.emitToUser(userId, 'new_notification', notif)

  if (webpush && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } })
    const payload = JSON.stringify({ title, body, actionUrl, type })
    await Promise.allSettled(
      subs.map(s =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        ).catch(async err => {
          if (err.statusCode === 410) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: s.endpoint } }).catch(() => {})
          }
        })
      )
    )
  }

  return notif
}

module.exports = { notify }
