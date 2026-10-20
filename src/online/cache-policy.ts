/** Prove cache safety at each private send. Local play does not use this boundary. */
export class CachePolicyUnavailable extends Error {
  constructor() { super('Online play is unavailable until the public cache is safe'); }
}

const TYPE = 'kingdown-cache-policy';
const POLICY = 'public-build-v1';
const DEADLINE_MS = 8000;
const FIRST_INSTALL_MS = 60000;

// [DEBUG-U05-startup] Temporary state-only trace shared with the account-status boundary.
let startupRegistration: ServiceWorkerRegistration | undefined;
export function startupCacheDebugState() {
  try {
    const controller = typeof navigator === 'undefined' ? null : navigator.serviceWorker?.controller;
    const absent = startupRegistration ? 'none' : 'unknown';
    return { controller: controller?.state ?? 'none', active: startupRegistration?.active?.state ?? absent, installing: startupRegistration?.installing?.state ?? absent };
  } catch { return { controller: 'unavailable', active: 'unknown', installing: 'unknown' }; }
}

export function withPrivateCachePolicy<T>(send: () => T | PromiseLike<T>): Promise<T> {
  if (typeof window === 'undefined') return Promise.resolve().then(send);
  return new Promise((resolve, reject) => {
    const workers = navigator.serviceWorker;
    const began = performance.now();
    let phase = 'register', reason = 'deadline';
    let ended = false;
    let close = () => {};
    const fail = () => { if (!ended) {
      try { console.warn('[DEBUG-U05-startup] ' + JSON.stringify({ boundary: 'cache', elapsed_ms: Math.round(performance.now() - began), phase, reason, ...startupCacheDebugState() })); } catch { /* Diagnostics cannot change the refusal. */ }
      ended = true; close(); clearTimeout(timer); reject(new CachePolicyUnavailable());
    } };
    let timer = setTimeout(fail, DEADLINE_MS);
    const start = (controller: ServiceWorker | null) => {
      if (ended) return;
      if ((workers?.controller ?? null) !== controller) return false;
      if (controller && controller.state !== 'activated') return false;
      ended = true; close(); clearTimeout(timer);
      // No await can separate the last controller check from the send.
      try { resolve(send()); } catch (error) { reject(error); }
      return true;
    };
    const proof = (controller: ServiceWorker) => new Promise<boolean>((done, bad) => {
      phase = 'proof';
      const channel = new MessageChannel(), requestId = crypto.randomUUID();
      const cleanup = () => { channel.port1.onmessage = null; channel.port1.close(); channel.port2.close(); workers.removeEventListener('controllerchange', changed); controller.removeEventListener('statechange', changed); };
      close = cleanup;
      const changed = () => { cleanup(); done(false); };
      workers.addEventListener('controllerchange', changed);
      controller.addEventListener('statechange', changed);
      channel.port1.onmessage = ({ data }) => {
        cleanup();
        if (data?.type !== TYPE || data.requestId !== requestId || data.policy !== POLICY || typeof data.version !== 'string' || !data.version) { reason = 'bad-proof'; bad(new CachePolicyUnavailable()); }
        else done(true);
      };
      try { controller.postMessage({ type: TYPE, requestId }, [channel.port2]); } catch (error) { reason = 'post-message'; cleanup(); bad(error); }
    });
    void (async () => {
      let registration: ServiceWorkerRegistration | undefined;
      if (workers) {
        try {
          registration = await workers.register('/sw.js', { scope: '/', updateViaCache: 'none' });
          startupRegistration = registration;
          void registration.update().catch(() => {});
        }
        catch { /* With no controller, the page can prove an empty cache. */ }
      }
      if (!ended && registration?.installing && !workers.controller && !registration.active) {
        phase = 'first-install';
        const installing = registration.installing;
        // A first install downloads the public shell before any worker can prove cache safety.
        clearTimeout(timer); timer = setTimeout(fail, FIRST_INSTALL_MS);
        await new Promise<void>((done, bad) => {
          const cleanup = () => { installing.removeEventListener('statechange', changed); workers.removeEventListener('controllerchange', changed); };
          const changed = () => {
            if (installing.state === 'redundant') { reason = 'redundant-install'; cleanup(); bad(new CachePolicyUnavailable()); }
            else if (installing.state === 'activated' || workers.controller) { cleanup(); done(); }
          };
          close = cleanup;
          installing.addEventListener('statechange', changed); workers.addEventListener('controllerchange', changed);
          changed();
        });
        if (ended) return;
        clearTimeout(timer); timer = setTimeout(fail, DEADLINE_MS);
      }
      while (!ended) {
        const controller = workers?.controller ?? null;
        if (controller) {
          // A controller change can precede the end of activation.
          if (controller.state !== 'activated') {
            phase = 'controller-activation';
            await new Promise<void>(done => {
              const cleanup = () => { controller.removeEventListener('statechange', changed); workers.removeEventListener('controllerchange', changed); };
              const changed = () => { if (controller.state === 'activated' || workers.controller !== controller) { cleanup(); done(); } };
              close = cleanup;
              controller.addEventListener('statechange', changed); workers.addEventListener('controllerchange', changed);
              changed();
            });
            continue;
          }
          if (await proof(controller) && start(controller)) return;
        } else if (registration) {
          const active = registration.active;
          if (active?.state === 'activated') {
            if (await proof(active) && registration.active === active && active.state === 'activated' && start(null)) return;
            continue;
          }
          phase = 'controller-activation';
          await new Promise<void>(done => {
            // A hard-reloaded page can stay uncontrolled while its active registration changes.
            const changed = () => { if (workers.controller || registration.active !== active || active?.state === 'activated') { close(); done(); } };
            close = () => { workers.removeEventListener('controllerchange', changed); active?.removeEventListener('statechange', changed); };
            workers.addEventListener('controllerchange', changed);
            active?.addEventListener('statechange', changed);
            changed();
          });
        } else {
          phase = 'emptycache';
          for (const key of await caches.keys()) if (key.startsWith('kingdown-')) await caches.delete(key);
          if ((await caches.keys()).some(key => key.startsWith('kingdown-'))) { reason = 'cache-remains'; throw new CachePolicyUnavailable(); }
          if (start(null)) return;
        }
      }
    })().catch(() => { if (reason === 'deadline') reason = 'exception'; fail(); });
  });
}
