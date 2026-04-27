const router = require('express').Router()
const { z } = require('zod')
const prisma = require('../db')
const { requireAuth } = require('../middleware/auth')

function requireAdmin(req, res, next) {
  const roles = Array.isArray(req.user.roles) ? req.user.roles : String(req.user.roles).split(',')
  if (!roles.includes('admin')) return res.status(403).json({ error: 'Acceso denegado' })
  next()
}

// POST /api/coupons/validate  — cualquier usuario autenticado
router.post('/validate', requireAuth, async (req, res) => {
  const { code, orderTotal } = z.object({
    code:       z.string().min(1),
    orderTotal: z.number().int().positive(),
  }).parse(req.body)

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (!coupon || !coupon.active) return res.status(404).json({ error: 'Cupón inválido o inactivo' })
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ error: 'Cupón vencido' })
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Cupón agotado' })
  if (orderTotal < coupon.minOrder) return res.status(400).json({ error: `Pedido mínimo para este cupón: $${coupon.minOrder.toLocaleString('es-AR')}` })

  const discount = coupon.type === 'percent'
    ? Math.round(orderTotal * coupon.value / 100)
    : Math.min(coupon.value, orderTotal)

  res.json({ coupon, discount, finalTotal: orderTotal - discount })
})

// GET /api/coupons  — admin
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
  res.json(coupons)
})

// POST /api/coupons  — admin
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const body = z.object({
    code:      z.string().min(2).max(20).transform(s => s.toUpperCase()),
    type:      z.enum(['percent', 'fixed']).default('percent'),
    value:     z.number().int().positive(),
    minOrder:  z.number().int().min(0).default(0),
    maxUses:   z.number().int().positive().nullable().default(null),
    expiresAt: z.string().datetime().nullable().default(null),
  }).parse(req.body)

  const coupon = await prisma.coupon.create({ data: body })
  res.status(201).json(coupon)
})

// PATCH /api/coupons/:id  — admin (toggle active)
router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body)
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: { active } })
  res.json(coupon)
})

// DELETE /api/coupons/:id  — admin
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

module.exports = router
