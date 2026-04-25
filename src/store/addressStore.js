import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAddressStore = create(
  persist(
    (set, get) => ({
      addresses:  [],
      defaultId:  null,

      add: (addr) => {
        const id  = 'addr_' + Date.now()
        const entry = { ...addr, id }
        set(s => ({
          addresses: [...s.addresses, entry],
          defaultId: s.defaultId ?? id,
        }))
        return id
      },

      update: (id, data) => set(s => ({
        addresses: s.addresses.map(a => a.id === id ? { ...a, ...data } : a),
      })),

      remove: (id) => set(s => {
        const rest = s.addresses.filter(a => a.id !== id)
        return {
          addresses: rest,
          defaultId: s.defaultId === id ? (rest[0]?.id ?? null) : s.defaultId,
        }
      }),

      setDefault: (id) => set({ defaultId: id }),

      getDefault: () => {
        const { addresses, defaultId } = get()
        return addresses.find(a => a.id === defaultId) ?? addresses[0] ?? null
      },
    }),
    { name: 'cannapunk-addresses' },
  ),
)
