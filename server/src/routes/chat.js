const router          = require('express').Router()
const { z }           = require('zod')
const path            = require('path')
const fs              = require('fs')
const prisma          = require('../db')
const { requireAuth } = require('../middleware/auth')
const ioModule        = require('../io')

// Multer setup para adjuntos de chat
let chatUpload = null
function getUpload() {
  if (chatUpload) return chatUpload
  try {
    const multer = require('multer')
    const dest   = path.join(__dirname, '../../../uploads/chat')
    fs.mkdirSync(dest, { recursive: true })
    const storage = multer.diskStorage({
      destination: (_, __, cb) => cb(null, dest),
      filename:    (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
    })
    chatUpload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }) // 10 MB
  } catch {
    chatUpload = { single: () => (req, res, next) => next() }
  }
  return chatUpload
}

// POST /api/chat/upload — sube adjunto y devuelve URL pública
router.post('/upload', requireAuth, (req, res, next) => {
  getUpload().single('file')(req, res, next)
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Sin archivo' })
  const url = `${process.env.BASE_URL ?? 'http://localhost:4000'}/uploads/chat/${req.file.filename}`
  res.json({ url, name: req.file.originalname, mime: req.file.mimetype, size: req.file.size })
})

const CONV_INCLUDE = {
  participants: {
    include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
  },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { sender: { select: { id: true, name: true } } },
  },
}

// GET /api/chat/conversations
router.get('/conversations', requireAuth, async (req, res) => {
  const convs = await prisma.conversation.findMany({
    where: { participants: { some: { userId: req.user.id } } },
    include: CONV_INCLUDE,
    orderBy: { updatedAt: 'desc' },
  })
  res.json(convs)
})

// POST /api/chat/conversations — iniciar o reutilizar conversación con otro usuario
router.post('/conversations', requireAuth, async (req, res) => {
  const { userId } = z.object({ userId: z.string() }).parse(req.body)
  if (userId === req.user.id) return res.status(400).json({ error: 'No podés chatear con vos mismo' })

  // Busca conversación 1:1 existente
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: req.user.id } } },
        { participants: { some: { userId } } },
      ],
    },
    include: CONV_INCLUDE,
  })
  if (existing) return res.json(existing)

  const conv = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: req.user.id }, { userId }],
      },
    },
    include: CONV_INCLUDE,
  })
  res.status(201).json(conv)
})

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: req.params.id, userId: req.user.id } },
  })
  if (!member) return res.status(403).json({ error: 'Sin acceso' })

  const { cursor, limit = 40 } = req.query
  const messages = await prisma.message.findMany({
    where:   { conversationId: req.params.id },
    orderBy: { createdAt: 'desc' },
    take:    Number(limit),
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { sender: { select: { id: true, name: true, username: true, avatar: true } } },
  })
  res.json(messages.reverse())
})

// POST /api/chat/conversations/:id/messages — enviar mensaje via REST (fallback sin socket)
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  const { content } = z.object({ content: z.string().min(1).max(2000).trim() }).parse(req.body)

  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: req.params.id, userId: req.user.id } },
  })
  if (!member) return res.status(403).json({ error: 'Sin acceso' })

  const message = await prisma.message.create({
    data: { conversationId: req.params.id, senderId: req.user.id, content },
    include: { sender: { select: { id: true, name: true, username: true, avatar: true } } },
  })

  await prisma.conversation.update({
    where: { id: req.params.id },
    data:  { updatedAt: new Date() },
  })

  // Emitir via socket a todos los participantes conectados
  ioModule.emit(`conv:${req.params.id}`, 'new_message', message)

  const others = await prisma.conversationParticipant.findMany({
    where: { conversationId: req.params.id, userId: { not: req.user.id } },
  })
  for (const p of others) {
    ioModule.emitToUser(p.userId, 'conversation_updated', { conversationId: req.params.id, message })
  }

  res.status(201).json(message)
})

// PATCH /api/chat/conversations/:id/read — marcar como leído
router.patch('/conversations/:id/read', requireAuth, async (req, res) => {
  await prisma.conversationParticipant.updateMany({
    where: { conversationId: req.params.id, userId: req.user.id },
    data:  { lastReadAt: new Date() },
  })
  res.json({ ok: true })
})

// DELETE /api/chat/messages/:id — eliminar mensaje propio
router.delete('/messages/:id', requireAuth, async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id } })
  if (!message) return res.status(404).json({ error: 'Mensaje no encontrado' })
  if (message.senderId !== req.user.id) return res.status(403).json({ error: 'Sin permiso' })

  await prisma.message.delete({ where: { id: req.params.id } })
  await prisma.conversation.update({
    where: { id: message.conversationId },
    data:  { updatedAt: new Date() },
  })

  ioModule.emit(`conv:${message.conversationId}`, 'message_deleted', {
    messageId:      req.params.id,
    conversationId: message.conversationId,
  })

  res.json({ ok: true })
})

module.exports = router
