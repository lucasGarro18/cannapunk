import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useChatStore = create(
  persist(
    (set) => ({
      drafts: {},

      setDraft: (convId, text) => set(state => ({
        drafts: { ...state.drafts, [convId]: text || undefined },
      })),

      clearDraft: (convId) => set(state => {
        const d = { ...state.drafts }
        delete d[convId]
        return { drafts: d }
      }),

      // Presencia online — no se persiste (ver partialize)
      onlineUsers: [],
      setOnline:      (userId)  => set(s => ({
        onlineUsers: s.onlineUsers.includes(userId) ? s.onlineUsers : [...s.onlineUsers, userId],
      })),
      setOffline:     (userId)  => set(s => ({
        onlineUsers: s.onlineUsers.filter(id => id !== userId),
      })),
      setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),
    }),
    {
      name: 'cannapont-chat',
      partialize: state => ({ drafts: state.drafts }),
    },
  ),
)
