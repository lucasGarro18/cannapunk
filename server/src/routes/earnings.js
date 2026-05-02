const router = require('express').Router()
const { z }           = require('zod')
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const { notify }      = require('../notify')

const ARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

// GET /api/earnings
router.get('/', requireAuth, async (req, res) => {
  const userId     = req.user.id
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    paidComm,
    pendingComm,
    monthComm,
    allComm,
    allWithdrawals,
    completedWithdrawals,
    videoCount,
  ] = await Promise.all([
    // Comisiones ya aprobadas por admin (dinero disponible)
    prisma.commission.aggregate({
      where: { creatorId: userId, status: 'paid' },
      _sum:  { amount: true },
    }),
    // Comisiones pendientes (esperando aprobación admin)
    prisma.commission.aggregate({
      where: { creatorId: userId, status: 'pending' },
      _sum:  { amount: true },
    }),
    // Comisiones de este mes (excluye canceladas)
    prisma.commission.aggregate({
      where: { creatorId: userId, status: { in: ['paid', 'pending'] }, createdAt: { gte: monthStart } },
      _sum:  { amount: true },
    }),
    // Todas las comisiones para historial y top videos
    prisma.commission.findMany({
      where:   { creatorId: userId, status: { in: ['paid', 'pending'] } },
      include: { video: { select: { title: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    // Todos los retiros solicitados (reducen balance disponible)
    prisma.withdrawal.aggregate({
      where: { userId },
      _sum:  { amount: true },
    }),
    // Retiros completados (referencia histórica)
    prisma.withdrawal.aggregate({
      where: { userId, status: 'completed' },
      _sum:  { amount: true },
    }),
    prisma.video.count({ where: { creatorId: userId } }),
  ])

  const paidEarned     = paidComm._sum.amount          ?? 0
  const pendingPayout  = pendingComm._sum.amount        ?? 0
  const monthEarned    = monthComm._sum.amount          ?? 0
  const totalEarned    = paidEarned + pendingPayout               // lifetime (exc. canceladas)
  const totalWithdrawn = allWithdrawals._sum.amount     ?? 0      // todos los retiros solicitados
  const paidOut        = completedWithdrawals._sum.amount ?? 0    // retiros completados
  const balance        = Math.max(0, paidEarned - totalWithdrawn) // disponible para retirar

  // Top videos por ganancias
  const videoEarnings = {}
  for (const c of allComm) {
    const key = c.videoId
    if (!videoEarnings[key]) videoEarnings[key] = { title: c.video?.title ?? 'Sin título', earned: 0, conversions: 0 }
    videoEarnings[key].earned      += c.amount
    videoEarnings[key].conversions += 1
  }
  const topVideos = Object.values(videoEarnings)
    .sort((a, b) => b.earned - a.earned)
    .slice(0, 5)

  // Historial de retiros para el merge
  const withdrawals = await prisma.withdrawal.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
  })

  const transactions = [
    ...allComm.slice(0, 30).map(c => ({
      id:        c.id,
      type:      'commission',
      label:     c.video?.title ?? 'Comisión',
      amount:    c.amount,
      status:    c.status,
      date:      new Date(c.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      createdAt: c.createdAt,
    })),
    ...withdrawals.map(w => ({
      id:        w.id,
      type:      'withdrawal',
      label:     `Retiro via ${w.method === 'cbu' ? 'CBU/CVU' : w.method === 'mercado' ? 'Mercado Pago' : 'USDT'}`,
      amount:    -w.amount,
      status:    w.status,
      date:      new Date(w.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }),
      createdAt: w.createdAt,
    })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  res.json({
    totalEarned,
    balance,           // disponible para retirar = paid commissions - all withdrawals
    pendingPayout,     // comisiones aún no aprobadas por admin
    paidOut,           // retiros completados (cashed out)
    totalWithdrawn,    // total retirado (pending + completed)
    monthEarned,
    totalVideos: videoCount,
    topVideos,
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

  // Balance disponible = comisiones pagadas - todos los retiros solicitados
  const [paidAgg, withdrawnAgg] = await Promise.all([
    prisma.commission.aggregate({
      where: { creatorId: userId, status: 'paid' },
      _sum:  { amount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { userId },
      _sum:  { amount: true },
    }),
  ])

  const available = Math.max(0, (paidAgg._sum.amount ?? 0) - (withdrawnAgg._sum.amount ?? 0))
  if (amount > available) {
    return res.status(400).json({ error: `Saldo insuficiente. Disponible: ${ARS(available)}` })
  }

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
