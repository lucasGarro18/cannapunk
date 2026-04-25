import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mockProducts } from '@/data/mockData'

// Seed con los 3 primeros mockProducts como si fueran del seller
const SEED_LISTINGS = mockProducts.slice(0, 3).map(p => ({
  ...p,
  status: 'active',
  stock: Math.floor(Math.random() * 30) + 5,
  salesCount: Math.floor(Math.random() * 50) + 2,
}))

export const useSellerStore = create(
  persist(
    (set, get) => ({
      listings: SEED_LISTINGS,

      addListing: (product) => set(s => ({
        listings: [{ ...product, id: 'p_' + Date.now(), status: 'active', stock: product.stock ?? 10, salesCount: 0 }, ...s.listings],
      })),

      updateListing: (id, updates) => set(s => ({
        listings: s.listings.map(p => p.id === id ? { ...p, ...updates } : p),
      })),

      toggleStatus: (id) => set(s => ({
        listings: s.listings.map(p => p.id === id
          ? { ...p, status: p.status === 'active' ? 'paused' : 'active' }
          : p),
      })),

      removeListing: (id) => set(s => ({
        listings: s.listings.filter(p => p.id !== id),
      })),
    }),
    { name: 'cannapunk-seller' },
  ),
)
