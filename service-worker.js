const CACHE_VERSION = 'music-player-v19';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './styles.css',
  './src/library.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];
const SHELL_PATHS = new Set(CORE_ASSETS.map(asset => new URL(asset, self.location.origin).pathname));

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isShellRequest =
    event.request.mode === 'navigate' ||
    (requestUrl.origin === self.location.origin && SHELL_PATHS.has(requestUrl.pathname));

  if (isShellRequest) {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(event.request, response.clone());
        return response;
      } catch {
        return (
          (await caches.match(event.request)) ||
          (await caches.match('./index.html'))
        );
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
