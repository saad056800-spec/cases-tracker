// مرساة الميزان — Service Worker
// Minimal app-shell caching: makes the app installable and gives it a bit of
// resilience on a flaky connection. Live data always goes straight to Firebase
// (never cached here), so nothing about your case/session data is affected.

const CACHE_NAME = 'mirsat-almizan-shell-v1';
const SHELL_FILES = [
  './index.html',
  './manifest.json',
  './assets/logo-mizan.png',
  './assets/logo-mizan-square-512.png',
  './assets/logo-mizan-192.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests for the app shell itself.
  // Everything else (Firebase, fonts, CDN scripts, API calls) goes straight to the network.
  if(event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
