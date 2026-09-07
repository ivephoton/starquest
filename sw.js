// Caches everything on first visit so the app works with no internet at all.
// Bump CACHE when files change, so an old copy is replaced rather than kept.
const CACHE = 'starquest-v4';
const FILES = [
  './', './index.html', './style.css', './main.js', './content.js',
  './progress.js', './art.js', './audio.js', './data.js',
  './manifest.webmanifest', './icon.svg', './icon-180.png',
  './icon-192.png', './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

// Cache first: the app is fully offline once installed.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
