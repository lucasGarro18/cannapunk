self.addEventListener('push', event => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Cannapont', {
      body:    data.body,
      icon:    '/favicon.svg',
      badge:   '/favicon.svg',
      data:    { url: data.actionUrl ?? '/' },
      vibrate: [100, 50, 100],
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow(event.notification.data?.url ?? '/')
    })
  )
})
