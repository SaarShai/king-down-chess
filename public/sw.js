/* The build sets the content version and exact public file lists.
 * The local page uses the network first, then the cache when offline or slow.
 * Installation must cache all local files before the worker can take over.
 */
const VERSION = 'dev';
const ALLOWLIST = [];
const PRECACHE = [];
const POLICY = 'public-build-v1';
const CACHE = `kingdown-${VERSION}`;
const PAGE_TIMEOUT_MS = 4000;
const START = new URL('./', self.registration.scope).href;
const INDEX = new URL('index.html', START).href;
const PUBLIC = new Set(ALLOWLIST.map(file => new URL(file, START).href));
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

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const file of PRECACHE) {
      const request = new Request(new URL(file, START), { cache: file.startsWith('assets/') ? 'default' : 'reload' });
      const response = await fetch(request);
      if (!cacheable(request, response)) throw new Error('Unsafe offline response');
      await cache.put(publicKey(request), response);
    }
    await self.skipWaiting();
  })());
});

let purgeInProgress;
function purgeOldCaches() {
  if (!purgeInProgress) purgeInProgress = (async () => {
    const obsolete = key => key.startsWith('kingdown-') && key !== CACHE;
    for (const key of await caches.keys()) if (obsolete(key)) await caches.delete(key);
    // A false delete can mean that another client removes the cache first.
    const cache = await caches.open(CACHE);
    for (const request of await cache.keys()) {
      if (publicKey(request) !== request.url) throw new Error('Forbidden application cache key');
    }
    if ((await caches.keys()).some(obsolete)) throw new Error('Old application cache remains');
  })().finally(() => { purgeInProgress = undefined; });
  return purgeInProgress;
}

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    await purgeOldCaches();
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const { data, source, ports } = event;
  if (data?.type !== 'kingdown-cache-policy' || typeof data.requestId !== 'string' || !data.requestId
    || source?.type !== 'window' || !URL.canParse(source.url) || new URL(source.url).origin !== self.location.origin
    || ports.length !== 1 || typeof ports[0]?.postMessage !== 'function') return;
  event.waitUntil((async () => {
    await purgeOldCaches();
    ports[0].postMessage({ type: 'kingdown-cache-policy', requestId: data.requestId, policy: POLICY, version: VERSION });
  })());
});

/** Network first. Keep a late network write alive after the timeout. */
async function page(request, event) {
  const cache = await caches.open(CACHE).catch(() => null);
  const network = fetch(request).then(async response => {
    if (cache && cacheable(request, response)) {
      try { await cache.put(START, response.clone()); } catch { /* Keep the network response. */ }
    }
    return response;
  });
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
  event.respondWith(key === START ? page(event.request, event) : asset(event.request));
});
