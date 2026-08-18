// Minimal service worker — mainly here so Chrome/Edge treat PoloAI as installable.
// Network-first: always tries to fetch the latest deployed version first (this app changes
// often), and only falls back to the last cached copy if the network request fails outright —
// useful on a spotty pool-deck connection, not meant as a real offline mode (voice tracking and
// shared sync both need a live connection regardless).
const CACHE_NAME = 'poloai-shell-v1';

self.addEventListener('install', (event) => {
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
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
