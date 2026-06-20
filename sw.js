/*
  FriendlyFlights — Service Worker
  Strategy:
    - Shell assets (HTML, CSS, JS, icons): Cache-First with network fallback.
      Gives instant loads on repeat visits.
    - API requests (/api/*): Network-Only. Flight prices must be live; never
      serve stale prices from cache.
  On each SW activation the old cache is deleted so stale shell assets are
  always replaced after a deploy.
*/

'use strict';

const CACHE_NAME = 'ff-shell-v1';

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/i18n.js',
  '/destinations.js',
  '/html2canvas.min.js',
  '/icon.svg',
  '/manifest.json',
];

// ── Install: pre-cache the app shell ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS))
  );
  // Activate immediately (don't wait for old tabs to close).
  self.skipWaiting();
});

// ── Activate: delete old caches ───────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for shell, network-only for API ───────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never intercept API calls — prices must be live.
  if (url.pathname.startsWith('/api/')) return;

  // Only handle GET requests.
  if (event.request.method !== 'GET') return;

  // Cache-first strategy for shell assets.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache only successful same-origin responses.
        if (
          response.ok &&
          response.type === 'basic' &&
          url.origin === self.location.origin
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If both cache and network fail for a navigation, return the cached index.
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
