import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import {
  RiArrowLeftLine, RiSendPlane2Line, RiSearchLine,
  RiMessage3Line, RiCheckLine, RiCheckDoubleLine,
  RiAttachment2, RiEmotionLine, RiCloseLine,
  RiFileTextLine, RiDownloadLine, RiImageLine, RiLoader4Line,
} from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import Avatar from '@/components/ui/Avatar'
import EmojiPicker from '@/components/chat/EmojiPicker'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import {
  useConversations, useMessages, useConversationSocket,
  useStartConversation,
} from '@/hooks/useChat'
import { chatApi } from '@/services/api'
import { useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import clsx from 'clsx'

// ── Helpers ───────────────────────────────────────────────────

function parseContent(raw) {
  if (!raw) return { type: 'text', text: '' }
  if (raw.startsWith('{')) {
    try {
      const p = JSON.parse(raw)
      if (p._t === 'img')  return { type: 'image', url: p.url, name: p.name, caption: p.caption ?? '' }
      if (p._t === 'file') return { type: 'file', url: p.url, name: p.name, size: p.size, mime: p.mime, caption: p.caption ?? '' }
    } catch { /* not media JSON */ }
  }
  return { type: 'text', text: raw }
}

function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function timeLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function dayLabel(dateStr) {
  const d   = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Hoy'
  const yest = new Date(Date.now() - 86_400_000)
  if (d.toDateString() === yest.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

// ── Sub-components ────────────────────────────────────────────

function DateSep({ label }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
      <span className="text-[10px] font-medium px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#52525b' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
    </div>
  )
}

function BubbleContent({ parsed, isMe, onImageClick }) {
  const textColor = isMe ? '#052610' : '#f0f0f5'
  const subColor  = isMe ? 'rgba(5,38,16,0.6)' : '#52525b'

  if (parsed.type === 'image') return (
    <div>
      <div className="overflow-hidden rounded-xl cursor-pointer"
           style={{ maxWidth: 220 }}
           onClick={() => onImageClick(parsed.url)}>
        <img src={parsed.url} alt={parsed.name}
             className="w-full object-cover transition-transform hover:scale-[1.02]"
             style={{ maxHeight: 260, minHeight: 80, background: '#0d0d12' }}
             onError={e => { e.target.style.display='none' }} />
      </div>
      {parsed.caption && (
        <p className="text-sm mt-2 leading-relaxed" style={{ color: textColor }}>{parsed.caption}</p>
      )}
    </div>
  )

  if (parsed.type === 'file') return (
    <a href={parsed.url} target="_blank" rel="noopener noreferrer"
       className="flex items-center gap-2.5 min-w-0"
       style={{ minWidth: 160, maxWidth: 220 }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: isMe ? 'rgba(5,38,16,0.2)' : 'rgba(255,255,255,0.06)' }}>
        <RiFileTextLine size={18} style={{ color: isMe ? '#00e676' : '#a1a1aa' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: textColor }}>{parsed.name}</p>
        <p className="text-[10px] mt-0.5" style={{ color: subColor }}>{fmtSize(parsed.size)}</p>
      </div>
      <RiDownloadLine size={14} style={{ color: subColor, flexShrink: 0 }} />
    </a>
  )

  return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap" style={{ color: textColor }}>{parsed.text}</p>
}

// ── ConversationView ──────────────────────────────────────────
function ConversationView({ conv, onBack }) {
  const { user }                          = useAuthStore()
  const qc                                = useQueryClient()
  const { drafts, setDraft, clearDraft }  = useChatStore()

  const [text, setText]           = useState(drafts[conv.id] ?? '')
  const [messages, setMessages]   = useState([])
  const [typing, setTyping]       = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [attachment, setAttachment] = useState(null)   // { url, name, mime, size, preview, uploading }
  const [lightbox, setLightbox]   = useState(null)

  const bottomRef    = useRef(null)
  const typingTimer  = useRef(null)
  const fileInputRef = useRef(null)
  const textareaRef  = useRef(null)

  const { data: initial = [] } = useMessages(conv.id)

  useEffect(() => {
    setMessages(initial)
    chatApi.markRead(conv.id).catch(() => {})
    qc.invalidateQueries(['conversations'])
  }, [initial, conv.id, qc])

  const onNewMessage = useCallback((msg) => {
    if (msg.__typing)     { setTyping(true);  return }
    if (msg.__stopTyping) { setTyping(false); return }

    setMessages(prev => {
      const idx = prev.findIndex(
        m => m._pending && m.content === msg.content && m.senderId === msg.senderId
      )
      if (idx !== -1) {
        const next = [...prev]; next[idx] = msg; return next
      }
      return [...prev, msg]
    })
    chatApi.markRead(conv.id).catch(() => {})
    qc.invalidateQueries(['conversations'])
  }, [conv.id, qc])

  const { sendMessage, sendTyping, stopTyping } = useConversationSocket(conv.id, onNewMessage)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const other = conv.participants?.find(p => p.userId !== user?.id)?.user

  // ── Input handlers ────────────────────────────────────────

  const handleInput = (e) => {
    const val = e.target.value
    setText(val)
    setDraft(conv.id, val)
    sendTyping()
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(stopTyping, 1500)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const handleEmojiSelect = (emoji) => {
    const el   = textareaRef.current
    const pos  = el?.selectionStart ?? text.length
    const next = text.slice(0, pos) + emoji + text.slice(pos)
    setText(next)
    setDraft(conv.id, next)
    setShowEmoji(false)
    el?.focus()
    setTimeout(() => {
      el?.setSelectionRange(pos + emoji.length, pos + emoji.length)
    }, 0)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const isImg = file.type.startsWith('image/')
    const preview = isImg ? URL.createObjectURL(file) : null
    setAttachment({ uploading: true, name: file.name, mime: file.type, preview })

    try {
      const result = await chatApi.uploadAttachment(file)
      setAttachment({ ...result, preview, uploading: false })
    } catch {
      setAttachment(null)
      toast.error('Error al subir el archivo')
    }
  }

  const removeAttachment = () => {
    if (attachment?.preview) URL.revokeObjectURL(attachment.preview)
    setAttachment(null)
  }

  const handleSend = (e) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed && !attachment) return
    if (attachment?.uploading) return

    let content
    if (attachment) {
      const isImg = attachment.mime?.startsWith('image/')
      content = JSON.stringify({
        _t:   isImg ? 'img' : 'file',
        url:  attachment.url,
        name: attachment.name,
        size: attachment.size,
        mime: attachment.mime,
        ...(trimmed ? { caption: trimmed } : {}),
      })
    } else {
      content = trimmed
    }

    const optimistic = {
      id:        `pending_${Date.now()}`,
      content,
      senderId:  user.id,
      createdAt: new Date().toISOString(),
      sender:    user,
      _pending:  true,
    }
    setMessages(prev => [...prev, optimistic])

    sendMessage(content)
    setText('')
    removeAttachment()
    clearDraft(conv.id)
    stopTyping()

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const canSend = (text.trim().length > 0 || !!attachment) && !attachment?.uploading

  // ── Messages with date separators ────────────────────────
  const rows = useMemo(() => {
    const result = []
    messages.forEach((msg, i) => {
      const prev = messages[i - 1]
      if (!prev || !isSameDay(prev.createdAt, msg.createdAt)) {
        result.push({ type: 'sep', label: dayLabel(msg.createdAt), key: 'sep_' + msg.id })
      }
      result.push({ type: 'msg', msg, key: msg.id })
    })
    return result
  }, [messages])

  return (
    <div className="flex flex-col h-full" style={{ background: '#0b0b0f' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,10,14,0.96)', backdropFilter: 'blur(24px)' }}>
        <button onClick={onBack} className="btn-icon w-8 h-8 md:hidden">
          <RiArrowLeftLine size={17} />
        </button>
        {other && (
          <Link to={`/profile/${other.username}`} className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="relative">
              <Avatar src={other.avatar} name={other.name} size="sm" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: '#00e676', borderColor: '#0a0a0e' }} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate text-white">{other.name}</p>
              <p className="text-[11px] truncate" style={{ color: typing ? '#00e676' : '#52525b' }}>
                {typing ? 'escribiendo...' : `@${other.username}`}
              </p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-[3px]"
           style={{ background: '#0b0b0f' }}>

        {messages.length === 0 && !typing && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                 style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.12)' }}>
              <RiMessage3Line size={28} style={{ color: '#00e676', opacity: 0.5 }} />
            </div>
            <p className="text-sm" style={{ color: '#3d3d46' }}>Empezá la conversación</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {rows.map(row => {
            if (row.type === 'sep') return (
              <motion.div key={row.key}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DateSep label={row.label} />
              </motion.div>
            )

            const { msg } = row
            const isMe       = msg.senderId === user?.id
            const msgIdx     = messages.findIndex(m => m.id === msg.id)
            const prev       = messages[msgIdx - 1]
            const next       = messages[msgIdx + 1]
            const isFirst    = !prev || prev.senderId !== msg.senderId || !isSameDay(prev.createdAt, msg.createdAt)
            const isLast     = !next || next.senderId !== msg.senderId || !isSameDay(next.createdAt, msg.createdAt)
            const parsed     = parseContent(msg.content)
            const isMedia    = parsed.type !== 'text'

            // Bubble shape per position in group
            const ownBR  = isLast  ? '4px'  : '18px'
            const otherBL = isLast ? '4px'  : '18px'
            const ownBL  = isFirst ? '18px' : '6px'
            const otherBR = isFirst? '18px' : '6px'

            return (
              <motion.div key={msg.id}
                layout
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: msg._pending ? 0.7 : 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.17, ease: [0.16, 1, 0.3, 1] }}
                className={clsx('flex items-end gap-1.5', isMe ? 'justify-end pl-10' : 'justify-start pr-10')}
                style={{ marginBottom: isLast ? 6 : 2 }}>

                {/* Avatar (other only, first in group) */}
                {!isMe && (
                  <div className="w-6 flex-shrink-0 self-end mb-0.5">
                    {isLast && <Avatar src={msg.sender?.avatar} name={msg.sender?.name} size="xs" />}
                  </div>
                )}

                <div className={clsx('flex flex-col gap-0.5', isMe ? 'items-end' : 'items-start')}>
                  {/* Sender name (other, first in group) */}
                  {!isMe && isFirst && (
                    <p className="text-[10px] font-medium ml-1" style={{ color: '#52525b' }}>
                      {msg.sender?.name ?? other?.name}
                    </p>
                  )}

                  {/* Bubble */}
                  <div
                    className="group relative"
                    style={isMedia
                      ? {
                          background: isMe ? 'linear-gradient(145deg,#00e676,#00c853)' : '#1c1c26',
                          border: isMe ? 'none' : '1px solid rgba(255,255,255,0.05)',
                          borderRadius: isMe
                            ? `18px ${ownBL} ${ownBR} 18px`
                            : `${otherBR} 18px 18px ${otherBL}`,
                          padding: '6px',
                          maxWidth: 240,
                        }
                      : {
                          background: isMe ? 'linear-gradient(145deg,#00e676,#00c853)' : '#1c1c26',
                          border: isMe ? 'none' : '1px solid rgba(255,255,255,0.05)',
                          borderRadius: isMe
                            ? `18px ${ownBL} ${ownBR} 18px`
                            : `${otherBR} 18px 18px ${otherBL}`,
                          padding: '10px 13px',
                          maxWidth: 320,
                        }
                    }
                  >
                    <BubbleContent parsed={parsed} isMe={isMe} onImageClick={setLightbox} />
                  </div>

                  {/* Timestamp + status */}
                  {isLast && (
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[10px]" style={{ color: '#3d3d46' }}>
                        {timeLabel(msg.createdAt)}
                      </span>
                      {isMe && (
                        msg._pending
                          ? <RiCheckLine size={10} style={{ color: '#3d3d46' }} />
                          : <RiCheckDoubleLine size={11} style={{ color: '#00e676' }} />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing indicator */}
        <AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-end gap-1.5 pr-10">
              <div className="w-6 flex-shrink-0 self-end mb-0.5">
                <Avatar src={other?.avatar} name={other?.name} size="xs" />
              </div>
              <div className="px-3 py-2.5 rounded-[18px_18px_18px_4px]"
                   style={{ background: '#1c1c26', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex gap-[3px] items-center h-3.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                         style={{ background: '#00e676', opacity: 0.7, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Attachment preview */}
      <AnimatePresence>
        {attachment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mx-3 mb-2 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl"
                 style={{ background: '#16161e', border: '1px solid rgba(255,255,255,0.06)' }}>
              {attachment.uploading ? (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(0,230,118,0.08)' }}>
                  <RiLoader4Line size={18} className="animate-spin" style={{ color: '#00e676' }} />
                </div>
              ) : attachment.preview ? (
                <img src={attachment.preview} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
              ) : (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <RiFileTextLine size={18} style={{ color: '#a1a1aa' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{attachment.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#52525b' }}>
                  {attachment.uploading ? 'Subiendo...' : fmtSize(attachment.size)}
                </p>
              </div>
              {!attachment.uploading && (
                <button onClick={removeAttachment} className="btn-icon w-6 h-6 flex-shrink-0">
                  <RiCloseLine size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="relative flex-shrink-0 px-3 pb-3 pt-2"
           style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0d0d12' }}>

        <AnimatePresence>
          {showEmoji && <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />}
        </AnimatePresence>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          {/* Attach */}
          <motion.button type="button" whileTap={{ scale: 0.88 }}
                         onClick={() => fileInputRef.current?.click()}
                         className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                         style={{ background: '#1a1a24', color: '#52525b' }}>
            <RiAttachment2 size={17} />
          </motion.button>
          <input ref={fileInputRef} type="file" className="hidden"
                 accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                 onChange={handleFileSelect} />

          {/* Textarea */}
          <div className="flex-1 relative flex items-end"
               style={{ background: '#1a1a24', borderRadius: 20, border: '1px solid rgba(255,255,255,0.07)' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Mensaje..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-4 py-2.5 text-sm outline-none"
              style={{ color: '#f0f0f5', maxHeight: 120, lineHeight: '1.5',
                       '::placeholder': { color: '#3d3d46' } }}
            />
            {/* Emoji button inside textarea */}
            <motion.button type="button" whileTap={{ scale: 0.85 }}
                           onClick={() => setShowEmoji(v => !v)}
                           className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mr-1 mb-1 transition-colors"
                           style={{ color: showEmoji ? '#00e676' : '#52525b' }}>
              <RiEmotionLine size={17} />
            </motion.button>
          </div>

          {/* Send */}
          <motion.button
            type="submit"
            disabled={!canSend}
            whileTap={canSend ? { scale: 0.88 } : {}}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: canSend ? 'linear-gradient(135deg,#00e676,#00c853)' : '#1a1a24',
              color: canSend ? '#052610' : '#3d3d46',
            }}>
            <RiSendPlane2Line size={16} />
          </motion.button>
        </form>
      </div>

      {/* Image lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}>
            <motion.img
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              src={lightbox}
              className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
            <button onClick={() => setLightbox(null)}
                    className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
              <RiCloseLine size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── ConvList ──────────────────────────────────────────────────
const convStagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const convItem    = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0, transition: { duration: 0.2 } } }

function ConvList({ conversations, activeId, onSelect, userId }) {
  const [filter, setFilter] = useState('')
  const filtered = conversations.filter(c => {
    const other = c.participants?.find(p => p.userId !== userId)?.user
    return !filter
      || other?.name?.toLowerCase().includes(filter.toLowerCase())
      || other?.username?.toLowerCase().includes(filter.toLowerCase())
  })

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d12' }}>
      <div className="px-4 pt-5 pb-3 flex-shrink-0"
           style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <h1 className="text-xl font-bold mb-3 text-white">Mensajes</h1>
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2" size={14}
                        style={{ color: '#3d3d46' }} />
          <input value={filter} onChange={e => setFilter(e.target.value)}
                 placeholder="Buscar..."
                 className="input text-sm w-full"
                 style={{ paddingLeft: '2.1rem', height: '2.1rem', background: '#18181f',
                          border: '1px solid rgba(255,255,255,0.06)', color: '#f0f0f5' }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-16 px-6">
            <RiMessage3Line size={36} className="mx-auto mb-3 opacity-10" />
            <p className="text-sm" style={{ color: '#3d3d46' }}>
              {filter ? 'Sin resultados' : 'Aún no tenés conversaciones'}
            </p>
          </div>
        )}

        <motion.div variants={convStagger} initial="hidden" animate="show">
          {filtered.map(conv => {
            const other    = conv.participants?.find(p => p.userId !== userId)?.user
            const lastMsg  = conv.messages?.[0]
            const me       = conv.participants?.find(p => p.userId === userId)
            const isUnread = lastMsg && (!me?.lastReadAt || new Date(lastMsg.createdAt) > new Date(me.lastReadAt))
            const isActive = conv.id === activeId
            const preview  = lastMsg ? parseContent(lastMsg.content) : null

            return (
              <motion.button
                key={conv.id}
                variants={convItem}
                onClick={() => onSelect(conv)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                whileTap={{ scale: 0.99 }}
                className={clsx('w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
                  isActive && 'bg-white/4')}
                style={isActive
                  ? { borderLeft: '2px solid #00e676' }
                  : { borderLeft: '2px solid transparent' }}
              >
                <div className="relative flex-shrink-0">
                  <Avatar src={other?.avatar} name={other?.name} size="md" />
                  {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{ background: '#00e676', borderColor: '#0d0d12' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={clsx('text-sm truncate', isUnread ? 'font-semibold text-white' : 'font-medium text-gray-400')}>
                      {other?.name ?? 'Usuario'}
                    </p>
                    {lastMsg && (
                      <p className="text-[10px] flex-shrink-0" style={{ color: '#3d3d46' }}>
                        {timeLabel(lastMsg.createdAt)}
                      </p>
                    )}
                  </div>
                  <p className={clsx('text-xs truncate mt-0.5', isUnread ? 'text-gray-400' : 'text-gray-700')}>
                    {preview
                      ? preview.type === 'image' ? '📷 Imagen'
                        : preview.type === 'file' ? `📎 ${preview.name}`
                        : preview.text
                      : 'Iniciá la conversación'}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </motion.div>
      </div>
    </div>
  )
}

// ── ChatPage ──────────────────────────────────────────────────
export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { id: convIdParam }             = useParams()
  const { user }                        = useAuthStore()
  const qc                              = useQueryClient()
  const { data: convs = [] }            = useConversations()
  const { mutate: startConv }           = useStartConversation()
  const [activeConv, setActiveConv]     = useState(null)
  const [mobileView, setMobileView]     = useState('list')

  // Abrir por ID en URL (/chat/:id)
  useEffect(() => {
    if (!convIdParam || convs.length === 0) return
    const found = convs.find(c => c.id === convIdParam)
    if (found && found.id !== activeConv?.id) {
      setActiveConv(found); setMobileView('chat')
    }
  }, [convIdParam, convs, activeConv?.id])

  // Abrir/crear por ?with=userId
  useEffect(() => {
    const withUser = searchParams.get('with')
    if (!withUser || !user) return
    const existing = convs.find(c => c.participants?.some(p => p.userId === withUser))
    if (existing) {
      setActiveConv(existing); setMobileView('chat'); setSearchParams({})
    } else {
      startConv(withUser, {
        onSuccess: (conv) => { setActiveConv(conv); setMobileView('chat'); setSearchParams({}) },
      })
    }
  }, [searchParams, convs, user])

  const handleSelect = (conv) => {
    setActiveConv(conv); setMobileView('chat')
    chatApi.markRead(conv.id).catch(() => {})
    qc.invalidateQueries(['conversations'])
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-3.5rem)] flex"
         style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

      {/* Sidebar */}
      <div className={clsx('w-full md:w-72 flex-shrink-0 flex flex-col md:border-r',
                            mobileView === 'chat' ? 'hidden md:flex' : 'flex')}
           style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <ConvList conversations={convs} activeId={activeConv?.id}
                  onSelect={handleSelect} userId={user?.id} />
      </div>

      {/* Conversation panel */}
      <div className={clsx('flex-1 flex flex-col', mobileView === 'list' ? 'hidden md:flex' : 'flex')}>
        {activeConv ? (
          <ConversationView conv={activeConv} onBack={() => setMobileView('list')} />
        ) : (
          <motion.div
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ background: '#0b0b0f' }}
          >
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
                 style={{ background: 'rgba(0,230,118,0.06)', border: '1px solid rgba(0,230,118,0.1)' }}>
              <RiMessage3Line size={36} style={{ color: '#00e676', opacity: 0.5 }} />
            </div>
            <div>
              <p className="font-semibold text-gray-300">Tus mensajes</p>
              <p className="text-sm mt-1" style={{ color: '#3d3d46' }}>
                Seleccioná una conversación o escribile a alguien desde su perfil
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
