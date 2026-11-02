/* The build sets the content version and exact public file lists.
 * The local page uses the network first, then the cache when offline or slow.
 * Installation must cache all local files before the worker can take over.
 */
const VERSION = 'dev';
const ALLOWLIST = [];
const PRECACHE = [];
const POLICY = 'public-build-v1';
const INSTALL_POLICY = 'public-install-v1';
const CACHE = `kingdown-${VERSION}`;
const PAGE_TIMEOUT_MS = 4000;
const PRECACHE_CONCURRENCY = 8;
const START = new URL('./', self.registration.scope).href;
const INDEX = new URL('index.html', START).href;
const PUBLIC = new Set(ALLOWLIST.map(file => new URL(file, START).href));
// The runtime files that load at startup change with a deploy: the manifest and its effect modules.
const FRESH = new Set(PRECACHE.filter(file => file.startsWith('character-runtime/')).map(file => new URL(file, START).href));
const PRIVATE = /^\/(?:api|mcp|authorize|auth|oauth|consent|login|logout|signin|signout|callback|internal|play|g|j|\.well-known)(?:\/|$)|^\/(?:play\.html|consent\.mjs)$/;
const AUTH_QUERY = /^(?:code|state|error|error_code|error_description|sb_flow_id|access_token|refresh_token|id_token|token|token_hash)$/i;
const noStore = headers => /(?:^|,)\s*no-store\s*(?:=|,|$)/i.test(headers.get('Cache-Control') ?? '');

/** Return only a public cache key. Local links share the plain root key. */
function publicKey(request) {
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || PRIVATE.test(url.pathname)
    || request.headers.has('Authorization') || request.cache === 'no-store' || noStore(request.headers)) return null;
  url.hash = '';
  const plain = new URL(url); plain.search = '';
  if (!PUBLIC.has(plain.href)) return null;
  if (plain.href === START || plain.href === INDEX) return START;
  return url.search ? null : plain.href;
}

/** Use this check for every cache write, including installation. */
function cacheable(request, response) {
  const url = new URL(request.url); url.hash = '';
  return publicKey(request) !== null && ![...url.searchParams.keys()].some(key => AUTH_QUERY.test(key))
    && response.ok && response.type === 'basic' && !response.redirected
    && response.url === url.href && !noStore(response.headers);
}

async function checkOwnCache(complete = true) {
  const cache = await caches.open(CACHE);
  const keys = new Set();
  for (const request of await cache.keys()) {
    if (publicKey(request) !== request.url) throw new Error('Forbidden application cache key');
    keys.add(request.url);
  }
  for (const file of complete ? PRECACHE : []) {
    if (!keys.has(publicKey(new Request(new URL(file, START))))) throw new Error('Incomplete offline cache');
  }
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    let next = 0;
    // Limit parallel downloads without a serial wait for each asset.
    await Promise.all(Array.from({ length: Math.min(PRECACHE_CONCURRENCY, PRECACHE.length) }, async () => {
      while (next < PRECACHE.length) {
        const file = PRECACHE[next++];
        const request = new Request(new URL(file, START), { cache: file.startsWith('assets/') ? 'default' : 'reload' });
        const response = await fetch(request);
        if (!cacheable(request, response)) throw new Error('Unsafe offline response');
        await cache.put(publicKey(request), response);
      }
    }));
    // A pending delete can remove the name while this cache object stays open.
    await checkOwnCache();
    await self.skipWaiting();
  })());
});

let activeWorker = self.registration.active;
let purgeInProgress;
function checkActiveWorker() {
  const { installing, waiting, active } = self.registration;
  if (installing || waiting || !active || active !== activeWorker
    || active.scriptURL !== self.location.href || !['activating', 'activated'].includes(active.state)) {
    throw new Error('Worker update in progress');
  }
}

function purgeOldCaches() {
  if (!purgeInProgress) purgeInProgress = (async () => {
    const obsolete = key => key.startsWith('kingdown-') && key !== CACHE;
    // List first. A replacement enters the registration before it opens its cache.
    const names = await caches.keys();
    checkActiveWorker();
    await checkOwnCache();
    for (const key of names) if (obsolete(key)) {
      checkActiveWorker();
      await caches.delete(key);
    }
    // A false delete can mean that another client removes the cache first.
    await checkOwnCache();
    const remaining = await caches.keys();
    checkActiveWorker();
    if (remaining.some(obsolete)) throw new Error('Old application cache remains');
  })().finally(() => { purgeInProgress = undefined; });
  return purgeInProgress;
}

self.addEventListener('activate', event => {
  activeWorker = self.registration.active;
  event.waitUntil((async () => {
    await purgeOldCaches();
    checkActiveWorker();
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const { data, source, ports } = event;
  if (data?.type !== 'kingdown-cache-policy' || typeof data.requestId !== 'string' || !data.requestId
    || source?.type !== 'window' || !URL.canParse(source.url) || new URL(source.url).origin !== self.location.origin
    || ports.length !== 1 || typeof ports[0]?.postMessage !== 'function') return;
  event.waitUntil((async () => {
    if (data.installing === true) {
      // All writes use cacheable(); missing public files do not make private traffic unsafe.
      await checkOwnCache(false);
      ports[0].postMessage({ type: 'kingdown-cache-policy', requestId: data.requestId, policy: INSTALL_POLICY, version: VERSION });
      return;
    }
    await purgeOldCaches();
    checkActiveWorker();
    ports[0].postMessage({ type: 'kingdown-cache-policy', requestId: data.requestId, policy: POLICY, version: VERSION });
  })());
});

/** Network first. Keep the install shell for offline use. */
async function page(request, event) {
  const cache = await caches.open(CACHE).catch(() => null);
  const network = fetch(request);
  event.waitUntil(network.then(() => {}, () => {}));
  let timer;
  const timeout = new Promise(resolve => { timer = setTimeout(resolve, PAGE_TIMEOUT_MS, null); });
  try {
    const first = await Promise.race([network, timeout]);
    if (first) return first;
  } catch { /* Use the cache when offline. */ }
  finally { clearTimeout(timer); }
  return (await cache?.match(START, { ignoreVary: true }).catch(() => undefined)) ?? network;
}

/** Runtime startup files change with each deploy. Use the network first, keep the fresh copy, and use the
 *  install copy only when offline. Frames stay cache first: their names are content hashes. */
async function fresh(request, event) {
  const cache = await caches.open(CACHE).catch(() => null);
  const network = fetch(request);
  event.waitUntil(network.then(() => {}, () => {}));
  try {
    const response = await network;
    if (cache && cacheable(request, response)) {
      try { await cache.put(publicKey(request), response.clone()); } catch { /* Keep the network response. */ }
    }
    return response;
  } catch (error) {
    const hit = await cache?.match(request, { ignoreVary: true }).catch(() => undefined);
    if (hit) return hit;
    throw error;
  }
}

/** Public assets use only their exact URL. */
async function asset(request) {
  const cache = await caches.open(CACHE).catch(() => null);
  // Module requests carry Origin; install requests do not. Ignore only Vary.
  const hit = await cache?.match(request, { ignoreVary: true }).catch(() => undefined);
  if (hit) return hit;
  const response = await fetch(request);
  if (cache && cacheable(request, response)) {
    try { await cache.put(publicKey(request), response.clone()); } catch { /* Keep the network response. */ }
  }
  return response;
}

self.addEventListener('fetch', event => {
  const key = publicKey(event.request);
  if (key === null) return;
  event.respondWith(key === START ? page(event.request, event)
    : FRESH.has(key) ? fresh(event.request, event) : asset(event.request));
});
