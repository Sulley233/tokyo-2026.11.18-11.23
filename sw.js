// Cache versioning and client notification
const CACHE_PREFIX = 'tokyo-trip-';
const CACHE_VERSION = 'v1'; // bump this to 'v2' on new releases
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const PRECACHE = [
  '/index.html',
  '/'
];

self.addEventListener('install', evt => {
  evt.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      console.log('SW install: caching', PRECACHE);
      await cache.addAll(PRECACHE);
      console.log('SW install: cache.addAll succeeded');
    } catch (err) {
      console.error('SW install: cache.addAll failed:', err);
      // Rethrow so install fails and we can see the error in devtools
      throw err;
    }
  })());
  self.skipWaiting();
});

self.addEventListener('activate', evt => {
  evt.waitUntil((async () => {
    const keys = await caches.keys();
    // Delete all caches that start with the prefix but are not the current version
    await Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map(k => caches.delete(k)));
    console.log('SW activate: old caches cleared, active:', CACHE_NAME);
    // Notify clients that a new version is active
    const clients = await self.clients.matchAll({type: 'window'});
    for (const client of clients) {
      client.postMessage({type: 'SW_UPDATED', version: CACHE_VERSION});
    }
  })());
  self.clients.claim();
});

self.addEventListener('fetch', evt => {
  const req = evt.request;
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
    evt.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return resp;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }
  evt.respondWith(
    fetch(req).then(resp => resp).catch(() => caches.match(req))
  );
});
