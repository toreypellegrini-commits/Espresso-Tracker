// Dialed — Extraction Tracker
// Service Worker v1
// Bump the version string below every time you push a new build
// to ensure all users get the update automatically.
const VERSION = 'dialed-v102';
const CACHE_NAME = VERSION;

// Files to cache for offline use
const ASSETS = [
  './',
  './index.html',
  './app.html',
  './css/app.css',
  './js/config.js',
  './js/state.js',
  './js/utils.js',
  './js/db.js',
  './js/auth.js',
  './js/router.js',
  './js/community.js',
  './js/roasts.js',
  './js/shots.js',
  './js/grinders.js',
  './js/insights.js',
  './js/home.js',
  './js/myshots.js',
  './js/pwa.js',
  './js/import.js',
  './js/achievements.js',
  './js/profile.js',
];

// ── INSTALL: cache core assets ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// ── ACTIVATE: clean up old caches ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ── FETCH: network-first for HTML, cache-first for everything else ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      });
    })
  );
});

// ── MESSAGE: allow app to trigger immediate activation ──
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
