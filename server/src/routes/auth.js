const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const crypto  = require('crypto')
const path    = require('path')
const fs      = require('fs')
const { z }          = require('zod')
const prisma         = require('../db')
const { requireAuth, rateLimit } = require('../middleware/auth')
const { serializeRoles, fixUser } = require('../sqlite')
const { sendWelcome } = require('../mailer')
const { notify } = require('../notify')

const { createUpload, genKey, uploadFile } = require('../storage')
const avatarUpload = createUpload({ maxMB: 2, filter: (_, f, cb) => cb(null, f.mimetype.startsWith('image/')) })

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 15, message: 'Demasiados intentos. Esperá 15 minutos.' })

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user
  return fixUser(safe)
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const schema = z.object({
    name:        z.string().min(2),
    email:       z.string().email(),
    password:    z.string().min(8),
    username:    z.string().regex(/^[a-z0-9_]+$/).min(3).max(20).optional(),
    referredBy:  z.string().optional(),
  })
  const { name, email, password, username: requestedUsername, referredBy } = schema.parse(req.body)

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return res.status(409).json({ error: 'El email ya está registrado' })

  // Use requested username if provided, otherwise derive from name
  const base = requestedUsername
    ?? name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '')
  let finalUsername = base
  let attempt = 0
  while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
    attempt++
    finalUsername = base + attempt
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      name, email, username: finalUsername, passwordHash,
      roles: serializeRoles(['buyer']),
      ...(referredBy ? { referredBy } : {}),
    },
  })

  sendWelcome({ to: email, name }).catch(err => console.error('[Mailer welcome]', err.message))

  // Notificar al referidor si se registró con su link
  if (referredBy) {
    const referrer = await prisma.user.findUnique({ where: { username: referredBy } }).catch(() => null)
    if (referrer) {
      notify(prisma, {
        userId:    referrer.id,
        type:      'referral',
        title:     'Nuevo referido',
        body:      `@${user.username} se registró con tu link de referido`,
        actionUrl: '/referrals',
      }).catch(() => {})
    }
  }

  res.status(201).json({ user: sanitizeUser(user), token: signToken(user) })
})

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const schema = z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  })
  const { email, password } = schema.parse(req.body)

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Credenciales inválidas' })

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' })

  res.json({ user: sanitizeUser(user), token: signToken(user) })
})

// PATCH /api/auth/me/password — cambiar contraseña
router.patch('/me/password', requireAuth, async (req, res) => {
  const { currentPwd, newPwd } = z.object({
    currentPwd: z.string().min(1),
    newPwd:     z.string().min(8),
  }).parse(req.body)

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  const valid = await bcrypt.compare(currentPwd, user.passwordHash)
  if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' })

  const passwordHash = await bcrypt.hash(newPwd, 10)
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } })
  res.status(204).send()
})

// PATCH /api/auth/me — actualizar perfil / roles / payout
router.patch('/me', requireAuth, async (req, res) => {
  const allowed = ['name', 'username', 'bio', 'avatar', 'roles', 'onboardingDone',
                   'payoutCbu', 'payoutMp', 'payoutUsdt']
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  )

  if (data.username) {
    const conflict = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: req.user.id } },
    })
    if (conflict) return res.status(409).json({ error: 'Ese username ya está en uso' })
  }

  if (data.roles) data.roles = serializeRoles(data.roles)

  // Validación de métodos de cobro
  if (data.payoutCbu && data.payoutCbu.trim() !== '') {
    if (!/^\d{22}$/.test(data.payoutCbu.replace(/\s/g, '')))
      return res.status(400).json({ error: 'CBU inválido: debe tener 22 dígitos' })
    data.payoutCbu = data.payoutCbu.replace(/\s/g, '')
  }
  if (data.payoutMp && data.payoutMp.trim() !== '') {
    const val = data.payoutMp.trim()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
    const isAlias = /^[a-z0-9._-]{6,20}$/.test(val)
    if (!isEmail && !isAlias)
      return res.status(400).json({ error: 'Mercado Pago inválido: ingresá un email o alias (6-20 caracteres)' })
    data.payoutMp = val
  }
  if (data.payoutUsdt && data.payoutUsdt.trim() !== '') {
    if (!/^0x[0-9a-fA-F]{40}$/.test(data.payoutUsdt.trim()))
      return res.status(400).json({ error: 'Wallet USDT inválida: debe ser una dirección Polygon/EVM (0x + 40 hex)' })
    data.payoutUsdt = data.payoutUsdt.trim()
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data,
  })
  res.json(sanitizeUser(updated))
})

// POST /api/auth/me/avatar — subida de imagen de perfil
router.post('/me/avatar', requireAuth, avatarUpload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' })
  const key = genKey('avatars', req.file.originalname)
  const url = await uploadFile(req.file.buffer, key, req.file.mimetype)
  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data:  { avatar: url },
  })
  res.json(sanitizeUser(updated))
})

// POST /api/auth/reset-request
router.post('/reset-request', authLimiter, async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body)

  const user = await prisma.user.findUnique({ where: { email } })
  // Siempre 200 para no revelar si el email existe
  if (!user) return res.json({ ok: true })

  const token  = crypto.randomBytes(32).toString('hex')
  const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  await prisma.user.update({
    where: { id: user.id },
    data:  { resetToken: token, resetTokenExpiry: expiry },
  })

  const baseUrl  = process.env.FRONTEND_URL ?? 'http://localhost:5173'
  const resetUrl = `${baseUrl}/reset-password?token=${token}`

  if (process.env.NODE_ENV !== 'production') {
    // En dev devolvemos el link para poder probarlo sin email
    return res.json({ ok: true, __devResetUrl: resetUrl })
  }

  // En prod: nodemailer si está configurado
  try {
    const nodemailer = require('nodemailer')
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    await transporter.sendMail({
      from:    process.env.SMTP_FROM ?? 'noreply@cannapont.com',
      to:      email,
      subject: 'Resetear contraseña — Cannapont',
      html:    `<p>Hacé click para resetear tu contraseña (válido 1 hora):</p><a href="${resetUrl}">${resetUrl}</a>`,
    })
  } catch (e) {
    console.error('[reset-request] email error:', e.message)
  }

  res.json({ ok: true })
})

// POST /api/auth/reset-confirm
router.post('/reset-confirm', authLimiter, async (req, res) => {
  const { token, password } = z.object({
    token:    z.string().min(1),
    password: z.string().min(8),
  }).parse(req.body)

  const user = await prisma.user.findFirst({
    where: {
      resetToken:       token,
      resetTokenExpiry: { gt: new Date() },
    },
  })
  if (!user) return res.status(400).json({ error: 'Token inválido o expirado' })

  const passwordHash = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data:  { passwordHash, resetToken: null, resetTokenExpiry: null },
  })

  res.json({ ok: true })
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
  res.json(sanitizeUser(user))
})

// GET /api/auth/users?q= — buscar usuarios para iniciar conversación
router.get('/users', requireAuth, async (req, res) => {
  const q = String(req.query.q ?? '').trim()
  if (q.length < 2) return res.json([])
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { NOT: { id: req.user.id } },
        { OR: [{ name: { contains: q } }, { username: { contains: q } }] },
      ],
    },
    select: { id: true, name: true, username: true, avatar: true },
    take: 10,
    orderBy: { name: 'asc' },
  })
  res.json(users)
})

module.exports = router
