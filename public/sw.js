// ponytail: minimal service worker for PWA installability + offline shell
const CACHE = 'smono-v2'
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
              (html) => html || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } })
            )
          }
          return new Response('', { status: 408, statusText: 'Offline' })
        })
      )
  )
})

self.addEventListener('push', (event) => {
  let data = { title: 'smono', message: 'You have a new update.', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {
    /* ponytail: malformed push payload — show default */
  }
  const body = data.message || data.body || ''
  event.waitUntil(
    self.registration.showNotification(data.title || 'smono', {
      body,
      icon: '/mascot.png',
      badge: '/mascot.png',
      tag: data.tag || 'smono-push',
      renotify: true,
      data: { url: data.url || '/' },
    })
  )
})

function absoluteUrl(path) {
  if (!path) return self.location.origin + '/'
  if (path.startsWith('http')) return path
  return new URL(path, self.location.origin).href
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = absoluteUrl(event.notification.data?.url || '/')
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
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
