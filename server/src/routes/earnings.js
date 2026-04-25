const router = require('express').Router()
const { z }           = require('zod')
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const { notify }      = require('../notify')

const ARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

// GET /api/earnings — resumen de ganancias del creador autenticado
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id

  const now       = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [allCommissions, pendingCommissions, monthCommissions, orders, videos, withdrawals, withdrawnAgg] = await Promise.all([
    prisma.commission.findMany({
      where:   { creatorId: userId },
      include: { video: { select: { title: true } }, order: { select: { total: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.commission.aggregate({
      where: { creatorId: userId, status: 'pending' },
      _sum:  { amount: true },
    }),
    prisma.commission.aggregate({
      where: { creatorId: userId, createdAt: { gte: monthStart } },
      _sum:  { amount: true },
    }),
    prisma.order.count({ where: { buyerId: userId } }),
    prisma.video.count({ where: { creatorId: userId } }),
    prisma.withdrawal.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.withdrawal.aggregate({
      where: { userId },
      _sum:  { amount: true },
    }),
  ])

  const totalEarned   = allCommissions.reduce((a, c) => a + c.amount, 0)
  const pendingPayout = pendingCommissions._sum.amount ?? 0
  const totalWithdrawn = withdrawnAgg._sum.amount ?? 0
  const paidOut       = Math.max(0, totalEarned - pendingPayout - totalWithdrawn)
  const monthEarned   = monthCommissions._sum.amount ?? 0

  // Top videos by earnings
  const videoEarnings = {}
  for (const c of allCommissions) {
    const key = c.videoId
    if (!videoEarnings[key]) videoEarnings[key] = { title: c.video.title, earned: 0, conversions: 0 }
    videoEarnings[key].earned      += c.amount
    videoEarnings[key].conversions += 1
  }
  const topVideos = Object.values(videoEarnings)
    .sort((a, b) => b.earned - a.earned)
    .slice(0, 5)

  // Merge commissions + withdrawals into unified transaction list
  const transactions = [
    ...allCommissions.slice(0, 20).map(c => ({
      id:        c.id,
      type:      'commission',
      label:     c.video.title,
      amount:    c.amount,
      date:      new Date(c.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      createdAt: c.createdAt,
    })),
    ...withdrawals.map(w => ({
      id:        w.id,
      type:      'withdrawal',
      label:     `Retiro via ${w.method === 'cbu' ? 'CBU/CVU' : w.method === 'mercado' ? 'Mercado Pago' : 'USDT'}`,
      amount:    -w.amount,
      date:      new Date(w.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      status:    w.status,
      createdAt: w.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  res.json({
    totalEarned,
    pendingPayout,
    paidOut,
    monthEarned,
    totalOrders:  orders,
    totalVideos:  videos,
    topVideos,
    recentCommissions: allCommissions.slice(0, 20),
    transactions,
  })
})

// POST /api/earnings/withdraw
router.post('/withdraw', requireAuth, async (req, res) => {
  const { amount, method } = z.object({
    amount: z.number().int().positive(),
    method: z.enum(['cbu', 'mercado', 'crypto']),
  }).parse(req.body)

  const userId = req.user.id

  const { _sum } = await prisma.commission.aggregate({
    where: { creatorId: userId, status: 'pending' },
    _sum:  { amount: true },
  })
  const available = _sum.amount ?? 0
  if (amount > available) return res.status(400).json({ error: 'Saldo insuficiente' })

  const withdrawal = await prisma.withdrawal.create({
    data: { userId, amount, method, status: 'pending' },
  })

  await notify(prisma, {
    userId,
    type:      'withdrawal',
    title:     'Solicitud de retiro enviada',
    body:      `Tu retiro de ${ARS(amount)} está siendo procesado. Te acreditamos en 24–48 hs.`,
    actionUrl: '/wallet',
  })

  res.status(201).json(withdrawal)
})

module.exports = router
