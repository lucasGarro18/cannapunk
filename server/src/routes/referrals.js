const router          = require('express').Router()
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')

// GET /api/referrals
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id

    const commissions = await prisma.commission.findMany({
      where:   { creatorId: userId },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // asc para que joinedAt sea la primera comisión
    })

    const buyerMap = new Map()
    for (const c of commissions) {
      const b = c.order.buyer
      if (!buyerMap.has(b.id)) {
        buyerMap.set(b.id, {
          id:        b.id,
          name:      b.name,
          username:  b.username,
          avatar:    b.avatar,
          joinedAt:  c.createdAt, // primer registro de actividad del referido
          purchases: 0,
          earned:    0,
        })
      }
      buyerMap.get(b.id).purchases += 1
      buyerMap.get(b.id).earned   += c.amount
    }

    const referred       = Array.from(buyerMap.values())
    const totalReferred  = referred.length
    const totalPurchases = commissions.length
    const totalEarned    = commissions.reduce((a, c) => a + c.amount, 0)

    res.json({ totalReferred, totalPurchases, totalEarned, referred })
  } catch (err) {
    console.error('referrals GET:', err)
    res.status(500).json({ error: 'Error al cargar referidos' })
  }
})

module.exports = router
