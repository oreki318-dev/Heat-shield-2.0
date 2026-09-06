/**
 * HeatShield Pro Service Worker (sw.js)
 * High-reliability offline caching, background sync & push notifications.
 */

const CACHE_NAME = 'heatshield-v2.2';
const STATIC_ASSETS = [
  '/',
  '/static/style.css',
  '/static/app.js',
  '/static/manifest.json',
  '/static/icons/icon.svg',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install Event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets could not be cached on install:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-First with Cache Fallback for dynamic feeds, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // For API telemetry requests, try network first, fallback to cached response if offline
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method !== 'GET') {
      return; // Do not intercept non-GET API calls with Cache API
    }
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'Offline', unavailable: true }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // For static assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone())).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise || fetch(event.request);
    })
  );
});

// Push Notification Event Listener
self.addEventListener('push', (event) => {
  let data = { title: 'HeatShield Threat Advisory', body: 'Elevated thermal stress detected in your area.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/static/icons/icon-192.png',
    badge: '/static/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'shelters', title: 'Find AC Shelter' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event Listener
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'shelters') {
    event.waitUntil(clients.openWindow('/#section-shelters'));
  } else {
    event.waitUntil(clients.openWindow('/'));
  }
});
