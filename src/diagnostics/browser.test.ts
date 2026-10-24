import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MAX_ERROR_BODY } from './data';

let target: EventTarget, beacon: ReturnType<typeof vi.fn>, send: ReturnType<typeof vi.fn>;
const fault = (message: string, stack = `Error: fault\n at f (https://kingdown.dev/assets/app.js:2:4)`) => Object.assign(new Error(message), { stack });
function emit(type: string, value: unknown) {
 target.dispatchEvent(Object.assign(new Event(type), type === 'unhandledrejection' ? { reason: value } : { error: value, message: (value as Error)?.message }));
}
beforeEach(async () => {
 vi.resetModules(); target = new EventTarget(); beacon = vi.fn(() => true); send = vi.fn(async () => new Response(null, { status: 204 }));
 vi.stubGlobal('window', target); vi.stubGlobal('location', { origin: 'https://kingdown.dev', pathname: '/g/private-id', search: '?private=secret', hash: '#private' });
 vi.stubGlobal('navigator', { userAgent: 'Version/18.3 Safari/605.1', sendBeacon: beacon });
 vi.stubGlobal('matchMedia', () => ({ matches: true })); vi.stubGlobal('fetch', send);
 const { installErrorRecorder } = await import('./browser'); installErrorRecorder(); installErrorRecorder();
});
afterEach(() => vi.unstubAllGlobals());

it('installs once, sends only the allowed fields and sends no duplicate', async () => {
 emit('error', fault('Fault person@example.com'));
 emit('error', fault('Fault person@example.com'));
 expect(beacon).toHaveBeenCalledOnce(); expect(send).not.toHaveBeenCalled();
 const [path, blob] = beacon.mock.calls[0] as unknown as [string, Blob];
 expect(path).toBe('/api/client-errors'); expect(blob.size).toBeLessThanOrEqual(MAX_ERROR_BODY);
 const report = JSON.parse(await blob.text());
 expect(Object.keys(report).sort()).toEqual(['browser', 'build', 'fingerprint', 'frames', 'kind', 'message', 'name', 'route', 'size']);
 expect(report).toMatchObject({ kind: 'error', message: 'Fault [redacted]', frames: ['/assets/app.js:2:4'], route: '/g/:game', browser: 'Safari 18', size: 'phone' });
 expect(report.build).toMatch(/^[a-f0-9]{40}$/);
});
it('sends at most five different faults per page load', () => {
 for (const word of ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']) emit('error', fault(word));
 expect(beacon).toHaveBeenCalledTimes(5);
});
it('ignores extension faults, opaque scripts, resize notices and values with no own frame', () => {
 emit('error', fault('extension', 'at f (chrome-extension://extension/a.js:1:2)'));
 emit('error', fault('Script error.', '')); emit('error', fault('ResizeObserver loop limit exceeded'));
 emit('unhandledrejection', 'private message'); emit('error', fault('no own', 'at f (https://foreign.example/assets/app.js:1:2)'));
 expect(beacon).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
});
it('records a rejection and the worker location', async () => {
 emit('unhandledrejection', fault('Promise failed'));
 const event = Object.assign(new Event('worker'), { filename: 'https://kingdown.dev/assets/worker.js', lineno: 3, colno: 5, message: 'Worker failed' });
 target.dispatchEvent(new CustomEvent('kingdown-worker-error', { detail: event }));
 expect(beacon).toHaveBeenCalledTimes(2);
 expect(JSON.parse(await (beacon.mock.calls[0][1] as Blob).text()).kind).toBe('rejection');
 expect(JSON.parse(await (beacon.mock.calls[1][1] as Blob).text())).toMatchObject({ kind: 'worker', frames: ['/assets/worker.js:3:5'] });
});
it('uses one keepalive request when beacon is unavailable or refuses', () => {
 beacon.mockReturnValue(false); emit('error', fault('Transport failed'));
 expect(send).toHaveBeenCalledExactlyOnceWith('/api/client-errors', expect.objectContaining({ keepalive: true, credentials: 'omit', referrerPolicy: 'no-referrer' }));
 emit('error', fault('Transport failed')); expect(send).toHaveBeenCalledOnce();
});
it('does not throw or report a transport failure', async () => {
 beacon.mockReturnValue(false); send.mockRejectedValue(new Error('private transport failure'));
 expect(() => emit('error', fault('Page failed'))).not.toThrow();
 await Promise.resolve(); expect(beacon).toHaveBeenCalledOnce(); expect(send).toHaveBeenCalledOnce();
});
it('does not throw when an error has a throwing getter', () => {
 const error = new Error(); Object.defineProperty(error, 'message', { get() { throw new Error('Getter failed'); } });
 expect(() => target.dispatchEvent(Object.assign(new Event('error'), { error }))).not.toThrow();
 expect(beacon).not.toHaveBeenCalled();
});

it('ignores an empty worker event', () => {
 expect(() => target.dispatchEvent(new CustomEvent('kingdown-worker-error'))).not.toThrow();
 expect(beacon).not.toHaveBeenCalled();
});

it('uses fetch when beacon is missing or throws', () => {
 beacon.mockImplementation(() => { throw new Error('Beacon failed'); });
 emit('error', fault('Beacon unavailable')); expect(send).toHaveBeenCalledOnce();
 vi.stubGlobal('navigator', { userAgent: 'Firefox/130.0' });
 emit('error', fault('Beacon missing')); expect(send).toHaveBeenCalledTimes(2);
});

it('contains a fault in an event getter', () => {
 for (const [kind, key] of [['error', 'error'], ['unhandledrejection', 'reason']]) {
  const event = new Event(kind); Object.defineProperty(event, key, { get() { throw new Error('Event getter failed'); } });
  expect(() => target.dispatchEvent(event)).not.toThrow();
 }
 expect(beacon).not.toHaveBeenCalled();
});
