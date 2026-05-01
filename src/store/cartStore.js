import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create(
  persist(
    (set, get) => ({
      items:      [],
      referrerId: null,

      addItem: (product, referrerId = null) => {
        const { items } = get()
        const existing  = items.find(i => i.product.id === product.id)
        if (existing) {
          set({ items: items.map(i =>
            i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
          )})
        } else {
          set(s => ({
            items: [...s.items, { product, qty: 1 }],
            referrerId: referrerId ?? s.referrerId,
          }))
        }
      },

      removeItem: (productId) => set(state => ({
        items: state.items.filter(i => i.product.id !== productId),
      })),

      updateQty: (productId, qty) => set(state => ({
        items: qty <= 0
          ? state.items.filter(i => i.product.id !== productId)
          : state.items.map(i => i.product.id === productId ? { ...i, qty } : i),
      })),

      clearCart: () => set({ items: [], referrerId: null }),
    }),
    { name: 'cannapont-cart' },
  ),
)
