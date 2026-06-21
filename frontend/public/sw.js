const CACHE_NAME = 'gurav-services-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/G.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Only intercept HTTP/HTTPS GET requests
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  // Network-First with Cache Fallback strategy
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // For SPA route navigation requests, fall back to index.html
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline / Network error', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});
