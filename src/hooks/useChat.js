import { useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { io } from 'socket.io-client'
import { chatApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { useNotifStore } from '@/store/notifStore'
import { mockCreators } from '@/data/mockData'
import toast from 'react-hot-toast'

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:4000'

let socketInstance = null

function getSocket(token) {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnectionDelay: 1000,
    })
  }
  return socketInstance
}

// ── Mock data builders ────────────────────────────────────────
function buildMockConvs(userId) {
  return mockCreators.slice(0, 2).map((creator, i) => ({
    id: `mock-conv-${i + 1}`,
    updatedAt: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
    participants: [
      {
        userId,
        lastReadAt: new Date(Date.now() - (i + 1) * 3_500_000).toISOString(),
        user: { id: userId, name: 'Vos', username: 'yo', avatar: null },
      },
      {
        userId: creator.id,
        lastReadAt: i === 0 ? null : new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
        user: creator,
      },
    ],
    messages: [{
      id: `mock-msg-last-${i + 1}`,
      content: i === 0 ? '¿Hacés envíos al interior?' : 'Gracias por tu compra! 🙌',
      senderId: i === 0 ? userId : creator.id,
      createdAt: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
    }],
  }))
}

function buildMockMessages(userId) {
  const creator = mockCreators[0]
  return [
    { id: 'mm1', content: 'Hola! ¿En qué te puedo ayudar?', senderId: creator.id, createdAt: new Date(Date.now() - 600_000).toISOString(), sender: creator },
    { id: 'mm2', content: '¿Tienen el producto en stock?', senderId: userId, createdAt: new Date(Date.now() - 300_000).toISOString(), sender: { id: userId, name: 'Vos', username: 'yo', avatar: null } },
    { id: 'mm3', content: 'Sí, disponible! ¿Te hago una reserva?', senderId: creator.id, createdAt: new Date(Date.now() - 180_000).toISOString(), sender: creator },
  ]
}

// ── Hooks ─────────────────────────────────────────────────────

export function useChatSocket() {
  const token     = useAuthStore(s => s.token)
  const qc        = useQueryClient()
  const addNotif  = useNotifStore(s => s.addNotif)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) return
    const socket = getSocket(token)
    socketRef.current = socket

    socket.on('conversation_updated', () => {
      qc.invalidateQueries(['conversations'])
    })

    socket.on('new_notification', (notif) => {
      addNotif(notif)
      qc.setQueryData(['notifications'], (old) => [notif, ...(old ?? [])])
      const icons = { commission: '💰', order: '📦', follower: '👤', sale: '🛍️' }
      toast(notif.body, {
        icon: icons[notif.type] ?? '🔔',
        duration: 5000,
        style: { background: '#1c1c1f', color: '#fff', border: '1px solid rgba(245,158,11,0.3)' },
      })
    })

    return () => {
      socket.off('conversation_updated')
      socket.off('new_notification')
    }
  }, [token, qc, addNotif])

  return socketRef
}

export function useConversations() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const userId          = useAuthStore(s => s.user?.id)

  return useQuery(
    ['conversations'],
    async () => {
      try {
        return await chatApi.getConversations()
      } catch (err) {
        if (!err.response) return buildMockConvs(userId)
        throw err
      }
    },
    { enabled: isAuthenticated, refetchInterval: 15_000, initialData: [] },
  )
}

export function useUnreadCount() {
  const { data: convs = [] } = useConversations()
  const userId = useAuthStore(s => s.user?.id)
  return convs.reduce((total, conv) => {
    const me = conv.participants?.find(p => p.userId === userId)
    if (!me) return total
    const lastMsg = conv.messages?.[0]
    if (!lastMsg) return total
    if (!me.lastReadAt) return total + 1
    return new Date(lastMsg.createdAt) > new Date(me.lastReadAt) ? total + 1 : total
  }, 0)
}

export function useStartConversation() {
  const qc     = useQueryClient()
  const userId = useAuthStore(s => s.user?.id)

  return useMutation(
    async (withUserId) => {
      try {
        return await chatApi.startConversation(withUserId)
      } catch (err) {
        if (!err.response) {
          const other = mockCreators.find(c => c.id === withUserId)
            ?? { id: withUserId, name: 'Usuario', username: 'usuario', avatar: null }
          return {
            id: `mock-conv-new-${Date.now()}`,
            updatedAt: new Date().toISOString(),
            participants: [
              { userId, lastReadAt: null, user: { id: userId, name: 'Vos', username: 'yo', avatar: null } },
              { userId: other.id, lastReadAt: null, user: other },
            ],
            messages: [],
          }
        }
        throw err
      }
    },
    { onSuccess: () => qc.invalidateQueries(['conversations']) },
  )
}

export function useMessages(conversationId) {
  const userId = useAuthStore(s => s.user?.id)

  return useQuery(
    ['messages', conversationId],
    async () => {
      try {
        return await chatApi.getMessages(conversationId)
      } catch (err) {
        if (!err.response) return buildMockMessages(userId)
        throw err
      }
    },
    { enabled: !!conversationId, staleTime: 0 },
  )
}

export function useConversationSocket(conversationId, onNewMessage) {
  const token     = useAuthStore(s => s.token)
  const qc        = useQueryClient()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token || !conversationId) return
    const socket = getSocket(token)
    socketRef.current = socket

    const joinRoom = () => socket.emit('join_conversation', conversationId)
    const onReconnect = () => {
      joinRoom()
      qc.invalidateQueries(['messages', conversationId])
    }

    joinRoom()
    socket.on('new_message',  onNewMessage)
    socket.on('typing',       ({ userId }) => onNewMessage?.({ __typing: true, userId }))
    socket.on('stop_typing',  ({ userId }) => onNewMessage?.({ __stopTyping: true, userId }))
    socket.on('connect',      onReconnect)

    return () => {
      socket.emit('leave_conversation', conversationId)
      socket.off('new_message',  onNewMessage)
      socket.off('typing')
      socket.off('stop_typing')
      socket.off('connect',      onReconnect)
    }
  }, [token, conversationId, onNewMessage, qc])

  const sendMessage = useCallback(async (content) => {
    const socket = socketRef.current
    if (socket?.connected) {
      socket.emit('send_message', { conversationId, content })
    } else {
      // REST fallback cuando el socket no está conectado
      try {
        await chatApi.sendMessage(conversationId, content)
      } catch { /* offline — el mensaje optimista ya se mostró */ }
    }
  }, [conversationId])

  const sendTyping = useCallback(() => {
    socketRef.current?.emit('typing', { conversationId })
  }, [conversationId])

  const stopTyping = useCallback(() => {
    socketRef.current?.emit('stop_typing', { conversationId })
  }, [conversationId])

  return { sendMessage, sendTyping, stopTyping }
}
