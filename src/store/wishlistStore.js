import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      toggle: (product) => {
        const { items } = get()
        const exists = items.some(p => p.id === product.id)
        set({ items: exists
          ? items.filter(p => p.id !== product.id)
          : [...items, product],
        })
        return !exists
      },

      isWishlisted: (productId) => get().items.some(p => p.id === productId),

      remove: (productId) => set(s => ({ items: s.items.filter(p => p.id !== productId) })),

      clear: () => set({ items: [] }),
    }),
    { name: 'cannapunk-wishlist' },
  ),
)
