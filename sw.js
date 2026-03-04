// ChessConnect Service Worker v40
// Paste this file as sw.js in your chessconnect-web GitHub repo
// replacing the one you created earlier

const CACHE = 'chessconnect-v40';
const ASSETS = [
  '/chessconnect-web/chess-clock.html',
  '/chessconnect-web/index.html'
];

// Install — cache the clock and home page
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — delete any old caches from previous versions
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — serve from cache first, fall back to network
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
