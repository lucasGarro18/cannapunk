const router          = require('express').Router()
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')

// GET /api/referrals
router.get('/', requireAuth, async (req, res) => {
  const username = req.user.username

  // Usuarios que se registraron con este referido
  const referredUsers = await prisma.user.findMany({
    where:   { referredBy: username },
    select:  { id: true, name: true, username: true, avatar: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  const referredIds = referredUsers.map(u => u.id)

  // Órdenes completadas de esos usuarios (hasta 3 por usuario según las reglas del programa)
  const orders = referredIds.length === 0 ? [] : await prisma.order.findMany({
    where:   { buyerId: { in: referredIds }, status: { not: 'cancelled' } },
    select:  { id: true, buyerId: true, total: true, createdAt: true },
  })

  // Calcular comisión por referido: 5% de las primeras 3 compras
  const COMMISSION_RATE = 0.05
  const MAX_PURCHASES   = 3

  const statsMap = {}
  for (const u of referredUsers) {
    statsMap[u.id] = { ...u, purchases: 0, earned: 0 }
  }
  for (const o of orders) {
    const s = statsMap[o.buyerId]
    if (!s) continue
    if (s.purchases < MAX_PURCHASES) {
      s.earned    += Math.round(o.total * COMMISSION_RATE)
      s.purchases += 1
    }
  }

  const referred       = Object.values(statsMap)
  const totalReferred  = referred.length
  const totalPurchases = referred.reduce((a, u) => a + u.purchases, 0)
  const totalEarned    = referred.reduce((a, u) => a + u.earned, 0)

  res.json({ totalReferred, totalPurchases, totalEarned, referred })
})

module.exports = router
