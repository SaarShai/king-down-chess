/** Prove cache safety at each private send. Local play does not use this boundary. */
export class CachePolicyUnavailable extends Error {
  constructor() { super('Online play is unavailable until the public cache is safe'); }
}

const TYPE = 'kingdown-cache-policy';
const POLICY = 'public-build-v1';
const DEADLINE_MS = 8000;
const FIRST_INSTALL_MS = 60000;

export function withPrivateCachePolicy<T>(send: () => T | PromiseLike<T>): Promise<T> {
  if (typeof window === 'undefined') return Promise.resolve().then(send);
  return new Promise((resolve, reject) => {
    const workers = navigator.serviceWorker;
    let ended = false;
    let close = () => {};
    const fail = () => { if (!ended) { ended = true; close(); clearTimeout(timer); reject(new CachePolicyUnavailable()); } };
    let timer = setTimeout(fail, DEADLINE_MS);
    const start = (controller: ServiceWorker | null) => {
      if (ended) return;
      if ((workers?.controller ?? null) !== controller) return false;
      ended = true; close(); clearTimeout(timer);
      // No await can separate the last controller check from the send.
      try { resolve(send()); } catch (error) { reject(error); }
      return true;
    };
    const proof = (controller: ServiceWorker) => new Promise<boolean>((done, bad) => {
      const channel = new MessageChannel(), requestId = crypto.randomUUID();
      const cleanup = () => { channel.port1.onmessage = null; channel.port1.close(); channel.port2.close(); workers.removeEventListener('controllerchange', changed); };
      close = cleanup;
      const changed = () => { cleanup(); done(false); };
      workers.addEventListener('controllerchange', changed);
      channel.port1.onmessage = ({ data }) => {
        cleanup();
        if (data?.type !== TYPE || data.requestId !== requestId || data.policy !== POLICY || typeof data.version !== 'string' || !data.version) bad(new CachePolicyUnavailable());
        else done(true);
      };
      try { controller.postMessage({ type: TYPE, requestId }, [channel.port2]); } catch (error) { cleanup(); bad(error); }
    });
    void (async () => {
      let registration: ServiceWorkerRegistration | undefined;
      if (workers) {
        try {
          registration = await workers.register('/sw.js', { scope: '/', updateViaCache: 'none' });
          void registration.update().catch(() => {});
        }
        catch { /* With no controller, the page can prove an empty cache. */ }
      }
      if (!ended && registration?.installing && !workers.controller && !registration.active) {
        const installing = registration.installing;
        // A first install downloads the public shell before any worker can prove cache safety.
        clearTimeout(timer); timer = setTimeout(fail, FIRST_INSTALL_MS);
        await new Promise<void>((done, bad) => {
          const cleanup = () => { installing.removeEventListener('statechange', changed); workers.removeEventListener('controllerchange', changed); };
          const changed = () => {
            if (installing.state === 'redundant') { cleanup(); bad(new CachePolicyUnavailable()); }
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
          if (registration.active?.state === 'activated') {
            if (await proof(registration.active) && start(null)) return;
            continue;
          }
          await new Promise<void>(done => {
            const changed = () => { close(); done(); };
            close = () => workers.removeEventListener('controllerchange', changed);
            workers.addEventListener('controllerchange', changed);
            if (workers.controller) changed();
          });
        } else {
          for (const key of await caches.keys()) if (key.startsWith('kingdown-')) await caches.delete(key);
          if ((await caches.keys()).some(key => key.startsWith('kingdown-'))) throw new CachePolicyUnavailable();
          if (start(null)) return;
        }
      }
    })().catch(fail);
  });
}
