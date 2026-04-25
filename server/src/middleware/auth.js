const jwt = require('jsonwebtoken')

function deserializeRoles(rolesVal) {
  if (Array.isArray(rolesVal)) return rolesVal
  if (!rolesVal) return ['buyer']
  return String(rolesVal).split(',').filter(Boolean)
}

// Simple in-memory rate limiter (resets on server restart)
const rateLimitStore = new Map()

function rateLimit({ windowMs = 15 * 60 * 1000, max = 20, message = 'Demasiados intentos. Esperá unos minutos.' } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    entry.count += 1
    if (entry.count > max) {
      return res.status(429).json({ error: message })
    }
    next()
  }
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' })
  }
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    req.user = { ...decoded, roles: deserializeRoles(decoded.roles) }
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try { req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET) } catch {}
  }
  next()
}

module.exports = { requireAuth, optionalAuth, rateLimit }
