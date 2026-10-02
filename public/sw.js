/* King Down Chess service worker: the game plays offline after one visit.
 *
 * `npm run build` writes dist/sw.js from this file, filling VERSION (a hash of every published file)
 * and PRECACHE (what the painted game needs to start). Dev never registers it.
 *
 * Updates: any change to the published files changes VERSION, so the browser installs the new worker
 * on the next visit; it takes over at once and deletes the old cache. The page itself is always asked
 * from the network first, so a returning player gets the new version on that same load; the cached
 * copy is used only when the network fails or is very slow (offline play).
 * The clay look (three.js and its sculpts, ~11 MB) is not downloaded in advance: its files are cached
 * the first time a player opens that look, then work offline too.
 */
const VERSION = 'dev';
const PRECACHE = [];
const CACHE = `kingdown-${VERSION}`;
const PAGE_TIMEOUT_MS = 4000;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('kingdown-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

/** Network first, so a new version shows on the next load; the cached page when offline or stalled. */
async function page(request) {
  const cache = await caches.open(CACHE);
  const network = fetch(request).then(response => {
    if (response.ok) cache.put('./', response.clone());
    return response;
  });
  network.catch(() => {}); // a late failure after the timeout is not an error
  const timeout = new Promise(resolve => setTimeout(resolve, PAGE_TIMEOUT_MS, null));
  try {
    const first = await Promise.race([network, timeout]);
    if (first) return first;
  } catch { /* offline: fall through to the cache */ }
  return (await cache.match('./')) ?? network;
}

/** Hashed and versioned files never change under one VERSION: the cache first, else fetch and keep. */
async function asset(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === 'navigate' ? page(request) : asset(request));
});
