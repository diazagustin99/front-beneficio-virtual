/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>
}

precacheAndRoute(self.__WB_MANIFEST)

interface PushPayload {
  title: string
  body?: string
  icon?: string
  data?: { url?: string }
}

self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }

  const payload = event.data.json() as PushPayload

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      data: payload.data,
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/'

  event.waitUntil(self.clients.openWindow(url))
})
