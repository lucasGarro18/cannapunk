import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { pushApi } from '@/services/api'

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64     = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

function subToPayload(sub) {
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')))),
      auth:   btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')))),
    },
  }
}

// Auto-suscribe al cargar si ya tenía permiso concedido
export function usePushNotifications() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const done            = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || done.current) return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission !== 'granted') return

    done.current = true
    ;(async () => {
      try {
        const { key } = await pushApi.getVapidKey()
        if (!key) return

        const reg      = await navigator.serviceWorker.register('/sw.js')
        await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()
        if (existing) return

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly:      true,
          applicationServerKey: urlBase64ToUint8Array(key),
        })
        await pushApi.subscribe(subToPayload(sub))
      } catch {
        done.current = false
      }
    })()
  }, [isAuthenticated])
}

// Pide permiso y suscribe — llamar desde un botón de UI
export async function requestPushPermission() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  try {
    const { key } = await pushApi.getVapidKey()
    if (!key) return false

    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const existing = await reg.pushManager.getSubscription()
    if (existing) return true

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(key),
    })
    await pushApi.subscribe(subToPayload(sub))
    return true
  } catch {
    return false
  }
}
