// ponytail: minimal service worker for PWA installability + offline shell
const CACHE = 'smono-v4'
const SHELL = ['/', '/index.html']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  if (!e.request.url.startsWith('http')) return
  if (e.request.url.includes('/api/')) return

  const isNavigate = e.request.mode === 'navigate'

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200 && e.request.url.startsWith(self.location.origin)) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      .catch(() =>
        caches.match(e.request).then((cached) => {
          if (cached) return cached
          if (isNavigate) {
            return caches.match('/index.html').then(
              (html) =>
                html ||
                new Response('Offline', {
                  status: 503,
                  headers: { 'Content-Type': 'text/html' },
                })
            )
          }
          // Don't invent a fake 408 for failed GETs — let the page see a network error
          return Response.error()
        })
      )
  )
})

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      let data = { title: 'smono', message: 'You have a new update.', url: '/' }
      try {
        if (event.data) data = { ...data, ...event.data.json() }
      } catch {
        /* ponytail: malformed push payload — show default */
      }

      const ticketId = supportTicketIdFromPush(data)

      // Wake open tabs so SupportInbox can poll even if we skip the banner
      try {
        const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
        for (const client of list) {
          client.postMessage({
            type: 'support_reply',
            ticketId,
            url: data.url || '/',
          })
        }
      } catch {
        /* ignore */
      }

      // User is already reading this thread — skip the banner.
      if (ticketId && viewingSupportTicketId === ticketId) return

      const body = data.message || data.body || ''
      await self.registration.showNotification(data.title || 'smono', {
        body,
        icon: '/mascot.png',
        badge: '/mascot.png',
        tag: data.tag || 'smono-push',
        renotify: true,
        data: { url: data.url || '/', ticketId },
      })
    })()
  )
})

/** Track which support ticket the app is viewing so we don't ping while chatting. */
let viewingSupportTicketId = null

function supportTicketIdFromPush(data) {
  const tag = String(data?.tag || '')
  if (tag.startsWith('support-')) return tag.slice('support-'.length) || null
  try {
    const url = String(data?.url || '')
    const q = url.includes('?') ? new URL(url, self.location.origin).searchParams.get('support') : null
    return q || null
  } catch {
    return null
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'support_viewing') {
    viewingSupportTicketId = event.data.ticketId || null
  }
})

function absoluteUrl(path) {
  if (!path) return self.location.origin + '/'
  if (path.startsWith('http')) return path
  return new URL(path, self.location.origin).href
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const targetUrl = absoluteUrl(data.url || '/')
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const payload = {
        type: 'smono_notification_opened',
        eventId: data.eventId,
        triggerType: data.triggerType,
      }
      for (const client of list) {
        client.postMessage(payload)
        if ('focus' in client) {
          if ('navigate' in client) {
            return client.navigate(targetUrl).then(() => client.focus())
          }
          client.focus()
          return undefined
        }
      }
      return clients.openWindow(targetUrl)
    })
  )
})
