require('dotenv').config()
require('express-async-errors')

const express    = require('express')
const cors       = require('cors')
const http       = require('http')
const { Server } = require('socket.io')
const jwt        = require('jsonwebtoken')
const prisma     = require('./db')
const ioModule   = require('./io')

const authRoutes     = require('./routes/auth')
const productRoutes  = require('./routes/products')
const orderRoutes    = require('./routes/orders')
const videoRoutes    = require('./routes/videos')
const creatorRoutes  = require('./routes/creators')
const earningsRoutes = require('./routes/earnings')
const notifRoutes     = require('./routes/notifications')
const mpRoutes        = require('./routes/mp')
const chatRoutes      = require('./routes/chat')
const referralRoutes  = require('./routes/referrals')
const adminRoutes     = require('./routes/admin')
const reviewRoutes    = require('./routes/reviews')

const app    = express()
const server = http.createServer(app)
const PORT   = process.env.PORT || 4000

const allowedOrigin = process.env.NODE_ENV === 'production'
  ? process.env.CLIENT_URL
  : (origin, cb) => cb(null, true)

app.use(cors({ origin: allowedOrigin, credentials: true }))
app.use(express.json({ limit: '5mb' }))
app.use('/uploads', express.static(require('path').join(__dirname, '../../uploads')))

app.use('/api/auth',          authRoutes)
app.use('/api/products',      productRoutes)
app.use('/api/orders',        orderRoutes)
app.use('/api/videos',        videoRoutes)
app.use('/api/creators',      creatorRoutes)
app.use('/api/earnings',      earningsRoutes)
app.use('/api/notifications', notifRoutes)
app.use('/api/mp',            mpRoutes)
app.use('/api/chat',          chatRoutes)
app.use('/api/referrals',    referralRoutes)
app.use('/api/admin',        adminRoutes)
app.use('/api/reviews',      reviewRoutes)

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.use((err, req, res, next) => {
  if (err?.name === 'ZodError') {
    const msg = err.errors?.[0]?.message ?? 'Datos inválidos'
    return res.status(400).json({ error: msg })
  }
  const status  = err.status || 500
  const message = err.message || 'Error interno del servidor'
  if (status >= 500) console.error(err)
  res.status(status).json({ error: message })
})

// ── Socket.io ────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', credentials: true },
})
ioModule.set(io)

// Middleware de auth para sockets
io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('No autenticado'))
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    next(new Error('Token inválido'))
  }
})

io.on('connection', (socket) => {
  const userId = socket.user.id

  // Unirse a sala personal para recibir mensajes
  socket.join(`user:${userId}`)

  socket.on('join_conversation', (conversationId) => {
    socket.join(`conv:${conversationId}`)
  })

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(`conv:${conversationId}`)
  })

  socket.on('send_message', async ({ conversationId, content }) => {
    if (!content?.trim() || !conversationId) return

    // Verificar que el usuario es participante
    const participant = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    }).catch(() => null)
    if (!participant) return

    const message = await prisma.message.create({
      data: { conversationId, senderId: userId, content: content.trim() },
      include: { sender: { select: { id: true, name: true, username: true, avatar: true } } },
    })

    // Actualizar updatedAt de la conversación
    await prisma.conversation.update({
      where: { id: conversationId },
      data:  { updatedAt: new Date() },
    })

    // Emitir a todos en la sala
    io.to(`conv:${conversationId}`).emit('new_message', message)

    // Notificar a participantes que no están en la sala (badge)
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: userId } },
    })
    for (const p of participants) {
      io.to(`user:${p.userId}`).emit('conversation_updated', { conversationId, message })
    }
  })

  socket.on('typing', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('typing', { userId, conversationId })
  })

  socket.on('stop_typing', ({ conversationId }) => {
    socket.to(`conv:${conversationId}`).emit('stop_typing', { userId, conversationId })
  })
})

// Exportar io para usarlo en otras rutas si hace falta
module.exports.io = io

server.listen(PORT, () => {
  console.log(`🚀 CannaPunk API corriendo en http://localhost:${PORT}`)
})
