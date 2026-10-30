/** Prove cache safety at each private send. Local play does not use this boundary. */
type CachePhase = 'register' | 'install' | 'controller-activation' | 'proof' | 'active-registration' | 'empty-cache';
type CacheReason = 'deadline' | 'redundant' | 'bad-proof' | 'post-message' | 'cache-remains' | 'exception';
type CacheWorkerState = ServiceWorkerState | 'none' | 'unknown' | 'unavailable';
type CacheFailure = Readonly<{ phase: CachePhase; reason: CacheReason; elapsed_ms: number; controller: CacheWorkerState; active: CacheWorkerState; installing: CacheWorkerState; waiting: CacheWorkerState; register_failed: boolean; update_failed: boolean }>;

export class CachePolicyUnavailable extends Error {
  readonly supportCode?: string;
  constructor(readonly failure?: CacheFailure) {
    const code = failure && `CACHE_${failure.phase}_${failure.reason}`.toUpperCase().replaceAll('-', '_');
    super('Online play is unavailable until the public cache is safe' + (code ? ` [${code}]` : ''));
    this.supportCode = code;
  }
}

const TYPE = 'kingdown-cache-policy';
const POLICY = 'public-build-v1';
const DEADLINE_MS = 8000;
const INSTALL_MS = 60000;
const INSTALL_POLICY = 'public-install-v1';

export function withPrivateCachePolicy<T>(send: () => T | PromiseLike<T>): Promise<T> {
  if (typeof window === 'undefined') return Promise.resolve().then(send);
  return new Promise((resolve, reject) => {
    const workers = navigator.serviceWorker;
    const began = performance.now();
    let phase: CachePhase = 'register', rejection: CacheReason = 'exception', registerFailed = false, updateFailed = false;
    let registration: ServiceWorkerRegistration | undefined, installDeadline: number | undefined;
    let observedInstall: ServiceWorker | null | undefined, afterInstall = false;
    const pendingInstall = () => registration?.installing ?? registration?.waiting;
    // Prove the incoming worker first; old workers can wait for takeover within the install budget.
    const workerSet = () => [registration?.installing ?? null, registration?.waiting ?? null, registration?.active ?? null, workers?.controller ?? null];
    const unchanged = (snapshot: (ServiceWorker | null)[]) => workerSet().every((worker, i) => worker === snapshot[i])
      && snapshot.every(worker => !worker || worker.state !== 'redundant');
    let ended = false;
    let close = () => {};
    const fail = (error?: unknown) => { if (!ended) {
      ended = true; close(); clearTimeout(timer);
      const state = (worker: ServiceWorker | null | undefined): CacheWorkerState => !worker ? 'none' : ['parsed', 'installing', 'installed', 'activating', 'activated', 'redundant'].includes(worker.state) ? worker.state : 'unknown';
      let states: Pick<CacheFailure, 'controller' | 'active' | 'installing' | 'waiting'> = { controller: 'unavailable', active: 'unavailable', installing: 'unavailable', waiting: 'unavailable' };
      try { states = { controller: state(workers?.controller), active: registration ? state(registration.active) : 'unknown', installing: registration ? state(registration.installing) : 'unknown', waiting: registration ? state(registration.waiting) : 'unknown' }; } catch { /* A state read cannot prevent the refusal. */ }
      const failure: CacheFailure = { phase, reason: error === undefined ? 'deadline' : rejection, elapsed_ms: Math.round(performance.now() - began), ...states, register_failed: registerFailed, update_failed: updateFailed };
      try { console.warn('[King Down cache safety] ' + JSON.stringify(failure)); } catch { /* Support logging cannot change the refusal. */ }
      reject(new CachePolicyUnavailable(failure));
    } };
    let timer = setTimeout(fail, DEADLINE_MS);
    const start = (controller: ServiceWorker | null, snapshot?: (ServiceWorker | null)[]) => {
      if (ended) return;
      if ((workers?.controller ?? null) !== controller) return false;
      if (controller && controller.state !== 'activated') return false;
      if (snapshot ? !unchanged(snapshot) : pendingInstall()) return false;
      ended = true; close(); clearTimeout(timer);
      // No await can separate the last controller check from the send.
      try { resolve(send()); } catch (error) { reject(error); }
      return true;
    };
    const proof = (controller: ServiceWorker, installing = false) => new Promise<string | false>((done, bad) => {
      phase = installing ? 'install' : 'proof';
      const channel = new MessageChannel(), requestId = crypto.randomUUID();
      const observed = new Set([controller, ...workerSet()].filter((worker): worker is ServiceWorker => worker !== null));
      const cleanup = () => { channel.port1.onmessage = null; channel.port1.close(); channel.port2.close(); workers.removeEventListener('controllerchange', changed); for (const worker of observed) worker.removeEventListener('statechange', changed); registration?.removeEventListener('updatefound', changed); };
      close = cleanup;
      const changed = () => { cleanup(); done(false); };
      workers.addEventListener('controllerchange', changed);
      for (const worker of observed) worker.addEventListener('statechange', changed);
      registration?.addEventListener('updatefound', changed);
      channel.port1.onmessage = ({ data }) => {
        if (data?.type !== TYPE || data.requestId !== requestId || data.policy !== (installing ? INSTALL_POLICY : POLICY) || typeof data.version !== 'string' || !data.version) {
          // An older protocol must wait for installation, then give fresh full proof.
          if (installing) { channel.port1.onmessage = null; return; }
          rejection = 'bad-proof'; cleanup(); bad(new CachePolicyUnavailable());
        } else { cleanup(); done(data.version); }
      };
      try { controller.postMessage({ type: TYPE, requestId, ...(installing && { installing: true }) }, [channel.port2]); } catch (error) { if (!installing) { rejection = 'post-message'; cleanup(); bad(error); } }
    });
    void (async () => {
      if (workers) {
        try {
          let existing: ServiceWorkerRegistration | undefined, lookedUp = false;
          // Lookup does not wait behind a per-scope script-fetch job, unlike register().
          try { existing = await workers.getRegistration('/'); lookedUp = true; } catch { /* Native registration can repair a failed lookup. */ }
          if (ended) return;
          const newest = existing?.installing ?? existing?.waiting ?? existing?.active;
          // Account play needs cache safety, not a new download of the offline game.
          if (lookedUp && !existing && !workers.controller) registration = undefined;
          else registration = existing && existing.scope === new URL('/', location.href).href
            && newest?.scriptURL === new URL('/sw.js', location.href).href && existing.updateViaCache === 'none'
            ? existing : await workers.register('/sw.js', { scope: '/', updateViaCache: 'none' });
          if (ended) return;
          if (registration) void registration.update().catch(() => { updateFailed = true; });
        }
        catch { if (registration) updateFailed = true; else registerFailed = true; /* With no controller, the page can prove an empty cache. */ }
      }
      while (!ended) {
        const installing = pendingInstall();
        if (observedInstall?.state === 'redundant' && (!installing || installing === observedInstall)) { phase = 'install'; rejection = 'redundant'; throw new CachePolicyUnavailable(); }
        if (installing) {
          phase = 'install'; observedInstall = installing;
          // Keep the base install budget across replacements, including silent old workers.
          installDeadline ??= performance.now() + INSTALL_MS;
          const installRemaining = installDeadline - performance.now();
          if (installRemaining <= 0) { fail(); return; }
          clearTimeout(timer); timer = setTimeout(fail, installRemaining); afterInstall = true;
          if (installing.state === 'redundant') { rejection = 'redundant'; throw new CachePolicyUnavailable(); }
          // Every possible controller must prove public-only writes, even before its install ends.
          const snapshot = workerSet(), versions = new Set<string>();
          let proved = true;
          for (const worker of new Set(snapshot.filter((worker): worker is ServiceWorker => worker !== null))) {
            const version = await proof(worker, true);
            if (ended) return;
            if (!version || !unchanged(snapshot)) { proved = false; break; }
            versions.add(`kingdown-${version}`);
          }
          if (!proved) continue;
          phase = 'empty-cache';
          const obsolete = (key: string) => key.startsWith('kingdown-') && !versions.has(key);
          const names = await caches.keys();
          if (ended) return;
          if (!unchanged(snapshot)) continue;
          for (const key of names.filter(obsolete)) {
            if (!unchanged(snapshot)) { proved = false; break; }
            await caches.delete(key);
            if (ended) return;
          }
          if (!proved || !unchanged(snapshot)) continue;
          const remaining = await caches.keys();
          if (ended) return;
          if (!unchanged(snapshot)) continue;
          if (remaining.some(obsolete)) { rejection = 'cache-remains'; throw new CachePolicyUnavailable(); }
          if (start(workers?.controller ?? null, snapshot)) return;
          continue;
        }
        if (afterInstall && observedInstall?.state === 'activated') { clearTimeout(timer); timer = setTimeout(fail, DEADLINE_MS); afterInstall = false; }
        const controller = workers?.controller ?? null;
        if (controller) {
          // A controller change can precede the end of activation.
          if (controller.state !== 'activated') {
            phase = 'controller-activation';
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
          phase = 'active-registration';
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
          phase = 'empty-cache';
          for (const key of await caches.keys()) if (key.startsWith('kingdown-')) {
            // A registration exists before its worker opens an install cache in another tab.
            if (workers) {
              try { registration = await workers.getRegistration('/'); } catch { /* The controller and final checks still apply. */ }
              if (ended) return;
              if (registration || workers.controller) break;
            }
            await caches.delete(key);
            if (ended) return;
          }
          if (registration || workers?.controller) continue;
          if ((await caches.keys()).some(key => key.startsWith('kingdown-'))) { rejection = 'cache-remains'; throw new CachePolicyUnavailable(); }
          // Another tab can register while this page clears old caches.
          if (workers) {
            try { registration = await workers.getRegistration('/'); } catch { /* The controller check still applies. */ }
            if (registration) continue;
          }
          if (start(null)) return;
        }
      }
    })().catch(fail);
  });
}
