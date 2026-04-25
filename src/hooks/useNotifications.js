import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationsApi } from '@/services/api'
import { useNotifStore } from '@/store/notifStore'
import { useAuthStore } from '@/store/authStore'

export function useNotifications() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const localNotifs     = useNotifStore(s => s.notifications)

  return useQuery(
    ['notifications'],
    async () => {
      try {
        return await notificationsApi.getAll()
      } catch (err) {
        if (!err.response) return localNotifs   // backend offline → local
        throw err
      }
    },
    {
      enabled:      isAuthenticated,
      initialData:  localNotifs,
      staleTime:    30_000,
      refetchInterval: 60_000,   // refresca cada 60s para simular push
    },
  )
}

export function useMarkRead() {
  const qc        = useQueryClient()
  const markRead  = useNotifStore(s => s.markRead)

  return useMutation(
    async (id) => {
      markRead(id)   // optimistic
      try { await notificationsApi.markRead(id) } catch { /* offline ok */ }
    },
    { onSettled: () => qc.invalidateQueries(['notifications']) },
  )
}

export function useMarkAllRead() {
  const qc          = useQueryClient()
  const markAllRead = useNotifStore(s => s.markAllRead)

  return useMutation(
    async () => {
      markAllRead()   // optimistic
      try { await notificationsApi.markAllRead() } catch { /* offline ok */ }
    },
    { onSettled: () => qc.invalidateQueries(['notifications']) },
  )
}
