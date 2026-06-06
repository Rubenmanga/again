const CACHE_NAME = 'again-v2'
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install: solo cachear assets verdaderamente estáticos (no páginas HTML)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: limpiar cachés viejos y tomar control inmediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Fetch: network-first para navegación, cache-first para assets estáticos
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar peticiones del mismo origen
  if (url.origin !== self.location.origin) return

  // Navegación (HTML): siempre red primero — nunca cachear páginas
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      )
    )
    return
  }

  // Assets estáticos: cache-first con actualización en red
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (STATIC_ASSETS.includes(url.pathname) && response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})
