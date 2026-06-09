/* ==========================================================================
    LIANER SERVICE WORKER (service-worker.js)
   ========================================================================== */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `lianer-cache-${CACHE_VERSION}`;

// Resurser att cacha vid installation - Baserat på din mappstruktur
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.webmanifest',
  '/css/variables.css',
  '/css/main.css',
  '/css/dashboard.css',
  '/css/tasks.css',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png'
];

// --- INSTALL: Cacha resurser ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Lianer: Cachar resurser');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); //
});

// --- ACTIVATE: Rensa gammal cache ---
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim(); //
});

// --- FETCH: Hantera nätverksstrategier ---
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Cache First för bilder & ikoner
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 2. Network First för HTML
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req));
    return;
  }

  // 3. Stale-While-Revalidate för CSS/JS
  if (/\.(css|js)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }
});

/* ==========================================================================
    CACHING-STRATEGIER
   ========================================================================== */

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) return cached;

  const res = await fetch(req);
  const cache = await caches.open(CACHE_NAME);
  cache.put(req, res.clone());
  return res;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    // Fallback till cache om nätverket är nere
    return cache.match(req);
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);

  const networkFetch = fetch(req).then(res => {
    if (res.ok) cache.put(req, res.clone());
    return res;
  });

  return cached || networkFetch;
}

/* ==========================================================================
    BACKGROUND SYNC
   ========================================================================== */

self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(handleSync()); // waitUntil håller SW vid liv
  }
});

let syncInProgress = false;

async function handleSync() {
  if (syncInProgress) return;
  syncInProgress = true;

  try {
    console.log('Lianer: Bakgrundssynk påbörjad');
    // Här lägger du logiken för att hämta från IndexedDB och skicka till servern
  } catch (err) {
    console.error('Lianer: Synk misslyckades:', err);
    throw err; // Kasta fel så att browsern försöker igen automatiskt
  } finally {
    syncInProgress = false;
  }
}

/* ==========================================================================
    PUSH NOTIFICATIONS
   ========================================================================== */

self.addEventListener('push', event => {
  let data = { title: 'Ny notis från Lianer', body: 'Du har en uppdatering.' };

  if (event.data) {
    try { data = event.data.json(); }
    catch { data.body = event.data.text(); }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: { dateOfArrival: Date.now() }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});