const router  = require('express').Router()
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const { fixUser }     = require('../sqlite')
const { notify }      = require('../notify')
const { sendCommissionPaid, sendWithdrawalCompleted } = require('../mailer')

const ARS = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function requireAdmin(req, res, next) {
  if (!req.user?.roles?.includes('admin')) {
    return res.status(403).json({ error: 'Acceso restringido a administradores' })
  }
  next()
}

const guard = [requireAuth, requireAdmin]

// GET /api/admin/stats
router.get('/stats', ...guard, async (req, res) => {
  const [users, products, orders, commissions, pendingOrders] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.commission.aggregate({ _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { status: 'pending' }, _sum: { amount: true } }),
  ])
  res.json({
    users,
    products,
    orders,
    totalCommissions: commissions._sum.amount ?? 0,
    pendingCommissions: pendingOrders._sum.amount ?? 0,
  })
})

// GET /api/admin/users?q=&role=&page=
router.get('/users', ...guard, async (req, res) => {
  const { q, role, page = 1 } = req.query
  const take = 20
  const skip = (Number(page) - 1) * take

  const where = {}
  if (q)    where.OR = [
    { name:     { contains: q, mode: 'insensitive' } },
    { username: { contains: q, mode: 'insensitive' } },
    { email:    { contains: q, mode: 'insensitive' } },
  ]
  if (role) where.roles = { contains: role }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, username: true, email: true, avatar: true,
        roles: true, createdAt: true, onboardingDone: true,
        _count: { select: { orders: true, videos: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  res.json({ users: users.map(fixUser), total, page: Number(page), pages: Math.ceil(total / take) })
})

// PATCH /api/admin/users/:id/roles
router.patch('/users/:id/roles', ...guard, async (req, res) => {
  const { roles } = req.body
  if (!Array.isArray(roles)) return res.status(400).json({ error: 'roles debe ser un array' })
  const serialized = roles.join(',')
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data:  { roles: serialized },
    select: { id: true, name: true, username: true, roles: true },
  })
  res.json(fixUser(updated))
})

// GET /api/admin/commissions?status=pending&page=
router.get('/commissions', ...guard, async (req, res) => {
  const { status, page = 1 } = req.query
  const take = 30
  const skip = (Number(page) - 1) * take
  const where = {}
  if (status) where.status = status

  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        video:   { select: { title: true } },
        order:   { select: { total: true, createdAt: true } },
        creator: { select: { id: true, name: true, username: true, payoutCbu: true, payoutMp: true, payoutUsdt: true } },
      },
    }),
    prisma.commission.count({ where }),
  ])

  res.json({ commissions, total, page: Number(page), pages: Math.ceil(total / take) })
})

// PATCH /api/admin/commissions/:id/pay
router.patch('/commissions/:id/pay', ...guard, async (req, res) => {
  const existing = await prisma.commission.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Comisión no encontrada' })
  if (existing.status === 'paid') return res.status(400).json({ error: 'Ya estaba pagada' })

  const commission = await prisma.commission.update({
    where:   { id: req.params.id },
    data:    { status: 'paid', paidAt: new Date(), paidBy: req.user.id },
    include: { creator: { select: { name: true, email: true } } },
  })
  await notify(prisma, {
    userId:    commission.creatorId,
    type:      'commission',
    title:     'Pago acreditado',
    body:      `Tu comisión de ${ARS(commission.amount)} fue acreditada a tu balance`,
    actionUrl: '/wallet',
  })
  sendCommissionPaid({
    to:     commission.creator.email,
    name:   commission.creator.name,
    amount: commission.amount,
  }).catch(err => console.error('[Mailer commissionPaid]', err.message))
  res.json(commission)
})

// PATCH /api/admin/commissions/pay-all — pagar todas las pendientes de un creador
router.patch('/commissions/pay-all', ...guard, async (req, res) => {
  const { creatorId } = req.body
  if (!creatorId) return res.status(400).json({ error: 'creatorId requerido' })

  const pending = await prisma.commission.findMany({
    where:  { creatorId, status: 'pending' },
    select: { id: true, amount: true },
  })
  if (pending.length === 0) return res.status(400).json({ error: 'No hay comisiones pendientes' })

  const totalAmount = pending.reduce((a, c) => a + c.amount, 0)
  const now         = new Date()

  await prisma.commission.updateMany({
    where: { id: { in: pending.map(c => c.id) } },
    data:  { status: 'paid', paidAt: now, paidBy: req.user.id },
  })

  const creator = await prisma.user.findUnique({
    where:  { id: creatorId },
    select: { name: true, email: true },
  })

  await notify(prisma, {
    userId:    creatorId,
    type:      'commission',
    title:     'Pago procesado',
    body:      `${pending.length} comisiones acreditadas por un total de ${ARS(totalAmount)}`,
    actionUrl: '/wallet',
  })

  if (creator) {
    sendCommissionPaid({
      to:     creator.email,
      name:   creator.name,
      amount: totalAmount,
    }).catch(err => console.error('[Mailer commissionPaid]', err.message))
  }

  res.json({ paid: pending.length, totalAmount })
})

// GET /api/admin/orders?status=&page=
router.get('/orders', ...guard, async (req, res) => {
  const { status, page = 1 } = req.query
  const take = 20
  const skip = (Number(page) - 1) * take
  const where = status ? { status } : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, name: true, username: true } },
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ])

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / take) })
})

// GET /api/admin/products?status=pending
router.get('/products', ...guard, async (req, res) => {
  const { status = 'pending' } = req.query
  const products = await prisma.product.findMany({
    where:   { status },
    orderBy: { createdAt: 'desc' },
    include: { seller: { select: { id: true, name: true, username: true, avatar: true } } },
  })
  res.json(products)
})

// PATCH /api/admin/products/:id/approve
router.patch('/products/:id/approve', ...guard, async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data:  { status: 'active' },
  })
  const { notify } = require('../notify')
  await notify(prisma, {
    userId:    product.sellerId,
    type:      'sale',
    title:     'Producto aprobado',
    body:      `"${product.name}" ya está activo en el marketplace.`,
    actionUrl: `/product/${product.id}`,
  })
  res.json(product)
})

// PATCH /api/admin/products/:id/reject
router.patch('/products/:id/reject', ...guard, async (req, res) => {
  const { reason } = req.body
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data:  { status: 'rejected' },
  })
  const { notify } = require('../notify')
  await notify(prisma, {
    userId:    product.sellerId,
    type:      'sale',
    title:     'Producto rechazado',
    body:      reason ? `"${product.name}" fue rechazado: ${reason}` : `"${product.name}" no cumple los requisitos.`,
    actionUrl: '/seller',
  })
  res.json(product)
})

// GET /api/admin/withdrawals?status=pending
router.get('/withdrawals', ...guard, async (req, res) => {
  const { status } = req.query
  const where = status ? { status } : {}
  const withdrawals = await prisma.withdrawal.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, name: true, username: true, avatar: true, payoutCbu: true, payoutMp: true, payoutUsdt: true } } },
  })
  res.json(withdrawals)
})

// PATCH /api/admin/withdrawals/:id/pay
router.patch('/withdrawals/:id/pay', ...guard, async (req, res) => {
  const { id } = req.params
  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } })
  if (!withdrawal) return res.status(404).json({ error: 'Retiro no encontrado' })
  if (withdrawal.status === 'completed') return res.status(400).json({ error: 'Ya está pagado' })

  const updated = await prisma.withdrawal.update({
    where:   { id },
    data:    { status: 'completed' },
    include: { user: { select: { name: true, email: true } } },
  })

  await notify(prisma, {
    userId:    withdrawal.userId,
    type:      'withdrawal',
    title:     'Retiro acreditado',
    body:      `${ARS(withdrawal.amount)} en camino a tu cuenta`,
    actionUrl: '/wallet',
  })

  sendWithdrawalCompleted({
    to:     updated.user.email,
    name:   updated.user.name,
    amount: withdrawal.amount,
    method: withdrawal.method,
  }).catch(err => console.error('[Mailer withdrawal]', err.message))

  res.json(updated)
})

module.exports = router
