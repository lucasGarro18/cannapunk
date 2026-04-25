import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useChatStore = create(
  persist(
    (set) => ({
      // Borradores por conversación — persisten al navegar
      drafts: {},

      setDraft: (convId, text) => set(state => ({
        drafts: { ...state.drafts, [convId]: text || undefined },
      })),

      clearDraft: (convId) => set(state => {
        const d = { ...state.drafts }
        delete d[convId]
        return { drafts: d }
      }),
    }),
    {
      name: 'cannapunk-chat',
      partialize: state => ({ drafts: state.drafts }),
    },
  ),
)
