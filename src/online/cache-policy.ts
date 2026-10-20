/** Prove cache safety at each private send. Local play does not use this boundary. */
export class CachePolicyUnavailable extends Error {
  constructor() { super('Online play is unavailable until the public cache is safe'); }
}

const TYPE = 'kingdown-cache-policy';
const POLICY = 'public-build-v1';
const DEADLINE_MS = 8000;
const INSTALL_MS = 60000;

export function withPrivateCachePolicy<T>(send: () => T | PromiseLike<T>): Promise<T> {
  if (typeof window === 'undefined') return Promise.resolve().then(send);
  return new Promise((resolve, reject) => {
    const workers = navigator.serviceWorker;
    let registration: ServiceWorkerRegistration | undefined, installDeadline: number | undefined;
    const pendingInstall = () => registration?.installing ?? registration?.waiting;
    let ended = false;
    let close = () => {};
    const fail = () => { if (!ended) { ended = true; close(); clearTimeout(timer); reject(new CachePolicyUnavailable()); } };
    let timer = setTimeout(fail, DEADLINE_MS);
    const start = (controller: ServiceWorker | null) => {
      if (ended) return;
      if ((workers?.controller ?? null) !== controller) return false;
      if (controller && controller.state !== 'activated') return false;
      if (pendingInstall()) return false;
      ended = true; close(); clearTimeout(timer);
      // No await can separate the last controller check from the send.
      try { resolve(send()); } catch (error) { reject(error); }
      return true;
    };
    const proof = (controller: ServiceWorker) => new Promise<boolean>((done, bad) => {
      const channel = new MessageChannel(), requestId = crypto.randomUUID();
      const cleanup = () => { channel.port1.onmessage = null; channel.port1.close(); channel.port2.close(); workers.removeEventListener('controllerchange', changed); controller.removeEventListener('statechange', changed); registration?.removeEventListener('updatefound', changed); };
      close = cleanup;
      const changed = () => { cleanup(); done(false); };
      workers.addEventListener('controllerchange', changed);
      controller.addEventListener('statechange', changed);
      registration?.addEventListener('updatefound', changed);
      channel.port1.onmessage = ({ data }) => {
        cleanup();
        if (data?.type !== TYPE || data.requestId !== requestId || data.policy !== POLICY || typeof data.version !== 'string' || !data.version) bad(new CachePolicyUnavailable());
        else done(true);
      };
      try { controller.postMessage({ type: TYPE, requestId }, [channel.port2]); } catch (error) { cleanup(); bad(error); }
    });
    void (async () => {
      if (workers) {
        try {
          registration = await workers.register('/sw.js', { scope: '/', updateViaCache: 'none' });
          void registration.update().catch(() => {});
        }
        catch { /* With no controller, the page can prove an empty cache. */ }
      }
      while (!ended) {
        const installing = pendingInstall();
        if (installing) {
          // Public installation has one budget across replacements; every completed wait still needs fresh proof.
          installDeadline ??= performance.now() + INSTALL_MS;
          const remaining = installDeadline - performance.now();
          if (remaining <= 0) { fail(); return; }
          clearTimeout(timer); timer = setTimeout(fail, remaining);
          await new Promise<void>((done, bad) => {
            const cleanup = () => { installing.removeEventListener('statechange', changed); workers.removeEventListener('controllerchange', changed); registration!.removeEventListener('updatefound', changed); };
            const changed = () => {
              const replacement = pendingInstall();
              if ((replacement && replacement !== installing) || installing.state === 'activated') { cleanup(); done(); }
              else if (installing.state === 'redundant') { cleanup(); bad(new CachePolicyUnavailable()); }
            };
            close = cleanup;
            installing.addEventListener('statechange', changed); workers.addEventListener('controllerchange', changed); registration!.addEventListener('updatefound', changed);
            changed();
          });
          if (ended) return;
          clearTimeout(timer); timer = setTimeout(fail, DEADLINE_MS);
          continue;
        }
        const controller = workers?.controller ?? null;
        if (controller) {
          // A controller change can precede the end of activation.
          if (controller.state !== 'activated') {
            await new Promise<void>(done => {
              const cleanup = () => { controller.removeEventListener('statechange', changed); workers.removeEventListener('controllerchange', changed); registration?.removeEventListener('updatefound', changed); };
              const changed = () => { if (controller.state === 'activated' || workers.controller !== controller || pendingInstall()) { cleanup(); done(); } };
              close = cleanup;
              controller.addEventListener('statechange', changed); workers.addEventListener('controllerchange', changed);
              registration?.addEventListener('updatefound', changed);
              changed();
            });
            continue;
          }
          if (await proof(controller) && start(controller)) return;
        } else if (registration) {
          const registered = registration, active = registered.active;
          if (active?.state === 'activated') {
            if (await proof(active) && registered.active === active && active.state === 'activated' && start(null)) return;
            continue;
          }
          await new Promise<void>(done => {
            // A hard-reloaded page can stay uncontrolled while its active registration changes.
            const changed = () => { if (workers.controller || registered.active !== active || active?.state === 'activated' || pendingInstall()) { close(); done(); } };
            close = () => { workers.removeEventListener('controllerchange', changed); active?.removeEventListener('statechange', changed); registered.removeEventListener('updatefound', changed); };
            workers.addEventListener('controllerchange', changed);
            active?.addEventListener('statechange', changed);
            registered.addEventListener('updatefound', changed);
            changed();
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
