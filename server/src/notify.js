const prisma   = require('./db')
const ioModule = require('./io')

/**
 * Crea una notificación en DB y la emite via socket al usuario destino.
 * Usar dentro de transacciones Prisma pasando `tx` en lugar de `prisma`.
 */
async function notify(db, { userId, type, title, body, actionUrl = null }) {
  const notif = await db.notification.create({
    data: { userId, type, title, body, actionUrl },
  })
  // Emitir fuera de la transacción no es problema — peor caso llega un poco tarde
  ioModule.emitToUser(userId, 'new_notification', notif)
  return notif
}

module.exports = { notify }
