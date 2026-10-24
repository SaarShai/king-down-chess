import { browserFamily, browserFrames, BUILD_ID, errorFingerprint, errorName, errorRoute, MAX_ERROR_BODY, scrub, type ClientErrorReport } from './data';

declare const __KINGDOWN_BUILD__: string;
let installed = false;

/** This module is imported by the website entry only. */
export function installErrorRecorder(): void {
 try {
  if (installed) return;
  installed = true;
  const build = typeof __KINGDOWN_BUILD__ === 'string' ? __KINGDOWN_BUILD__ : '';
  if (!BUILD_ID.test(build)) return;
  const seen = new Set<string>();
  const record = (kind: ClientErrorReport['kind'], value: unknown, event?: ErrorEvent) => {
   try {
    if (seen.size >= 5) return;
    const error = value instanceof Error ? value : undefined;
    const raw = error?.message ?? (kind === 'rejection' ? 'Non-Error rejection' : event?.message ?? 'Worker failed');
    if (/^Script error\.?$/i.test(raw.trim()) && !error?.stack || /ResizeObserver loop/i.test(raw)) return;
    const frames = browserFrames(error?.stack ?? '', location.origin);
    if (!frames.length && kind === 'worker' && event?.filename) frames.push(...browserFrames(`${event.filename}:${event.lineno}:${event.colno}`, location.origin));
    if (!frames.length) return;
    const name = errorName(error?.name), message = scrub(raw), fingerprint = errorFingerprint(name, message, frames[0]);
    if (seen.has(fingerprint)) return;
    const report: ClientErrorReport = { kind, name, message, frames, route: errorRoute(location.pathname), build,
     browser: browserFamily(navigator.userAgent), size: matchMedia('(max-width: 899px)').matches ? 'phone' : 'desktop', fingerprint };
    const body = JSON.stringify(report);
    if (new TextEncoder().encode(body).length > MAX_ERROR_BODY) return;
    seen.add(fingerprint);
    let queued = false;
    try { queued = navigator.sendBeacon?.('/api/client-errors', new Blob([body], { type: 'application/json' })) ?? false; } catch { /* Use fetch if beacon fails. */ }
    if (queued) return;
    void fetch('/api/client-errors', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer' }).catch(() => {});
   } catch { /* A recorder fault must not reach the page. */ }
  };
  window.addEventListener('error', event => { try { record('error', event.error, event); } catch { /* Ignore an invalid event. */ } });
  window.addEventListener('unhandledrejection', event => { try { record('rejection', event.reason); } catch { /* Ignore an invalid event. */ } });
  window.addEventListener('kingdown-worker-error', event => {
   try { const error = (event as CustomEvent<ErrorEvent>).detail; if (error) record('worker', error.error, error); } catch { /* Ignore an invalid event. */ }
  });
 } catch { /* The page works without the recorder. */ }
}
