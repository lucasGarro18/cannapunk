import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const SEED = [
  { id: 'n1', type: 'commission', title: 'Nueva comisión',       body: 'Ganaste $3.600 por tu review de Auriculares Punk Pro',       time: '2m',  read: false, actionUrl: '/earnings'           },
  { id: 'n2', type: 'order',      title: 'Pedido en camino',     body: 'Tu pedido ORD-002 ya está en camino 🚚',                     time: '1h',  read: false, actionUrl: '/orders'             },
  { id: 'n3', type: 'follower',   title: 'Nuevo seguidor',       body: '@mativerde empezó a seguirte',                               time: '3h',  read: false, actionUrl: '/profile/mativerde'  },
  { id: 'n4', type: 'sale',       title: 'Venta desde tu video', body: 'Alguien compró Street Runner V2 con tu link',                time: '5h',  read: true,  actionUrl: '/earnings'           },
  { id: 'n5', type: 'commission', title: 'Nueva comisión',       body: 'Ganaste $5.340 por tu review de Street Runner V2',           time: '1d',  read: true,  actionUrl: '/earnings'           },
  { id: 'n6', type: 'sale',       title: 'Venta desde tu video', body: 'Alguien compró Mochila Tactical EDC con tu link',            time: '2d',  read: true,  actionUrl: '/earnings'           },
  { id: 'n7', type: 'follower',   title: 'Nuevo seguidor',       body: '@lunaneon empezó a seguirte',                                time: '3d',  read: true,  actionUrl: '/profile/lunaneon'   },
]

export const useNotifStore = create(
  persist(
    (set, get) => ({
      notifications: SEED,

      markRead: (id) => set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      })),

      markAllRead: () => set(s => ({
        notifications: s.notifications.map(n => ({ ...n, read: true })),
      })),

      remove: (id) => set(s => ({
        notifications: s.notifications.filter(n => n.id !== id),
      })),

      clearAll: () => set({ notifications: [] }),

      addNotif: (notif) => set(s => ({
        notifications: [
          { id: 'n_' + Date.now(), read: false, time: 'ahora', ...notif },
          ...s.notifications,
        ],
      })),
    }),
    { name: 'cannapont-notifs' },
  ),
)
