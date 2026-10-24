import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { errorFingerprint, MAX_ERROR_BODY } from './data';

let target: EventTarget, beacon: ReturnType<typeof vi.fn>, send: ReturnType<typeof vi.fn>;
const fault = (message: string) => new Error(message);
function emit(type: string, value: unknown, fields = { filename: 'https://kingdown.dev/assets/app.js', lineno: 2, colno: 4 }) {
 target.dispatchEvent(Object.assign(new Event(type), type === 'unhandledrejection' ? { reason: value } : { error: value, message: (value as Error)?.message, ...fields }));
}
beforeEach(async () => {
 vi.resetModules(); target = new EventTarget(); beacon = vi.fn(() => true); send = vi.fn(async () => new Response(null, { status: 204 }));
 vi.stubGlobal('document', { querySelector: () => ({ content: '/assets/app.js /assets/worker.js' }) });
 vi.stubGlobal('window', target); vi.stubGlobal('location', { origin: 'https://kingdown.dev', pathname: '/g/private-id', search: '?private=secret', hash: '#private' });
 vi.stubGlobal('navigator', { userAgent: 'Version/18.3 Safari/605.1', sendBeacon: beacon });
 vi.stubGlobal('matchMedia', () => ({ matches: true })); vi.stubGlobal('fetch', send);
 const { installErrorRecorder } = await import('./browser'); installErrorRecorder(); installErrorRecorder();
});
afterEach(() => vi.unstubAllGlobals());

it('never reads a stack, even when its getter throws', async () => {
 const error = new Error('Failed to fetch');
 Object.defineProperty(error, 'stack', { get() { throw new Error('Stack read'); } });
 emit('error', error); emit('unhandledrejection', error);
 expect(beacon).toHaveBeenCalledTimes(2);
 expect(JSON.parse(await (beacon.mock.calls[0][1] as Blob).text()).frames).toEqual(['/assets/app.js:2:4']);
 expect(JSON.parse(await (beacon.mock.calls[1][1] as Blob).text()).frames).toEqual([]);
});

it('installs once, sends only the allowed fields and sends no duplicate', async () => {
 emit('error', fault('Fault person@example.com'));
 emit('error', fault('Fault person@example.com'));
 expect(beacon).toHaveBeenCalledOnce(); expect(send).not.toHaveBeenCalled();
 const [path, blob] = beacon.mock.calls[0] as unknown as [string, Blob];
 expect(path).toBe('/api/client-errors'); expect(blob.size).toBeLessThanOrEqual(MAX_ERROR_BODY);
 const report = JSON.parse(await blob.text());
 expect(Object.keys(report).sort()).toEqual(['browser', 'build', 'fingerprint', 'frames', 'kind', 'message', 'name', 'route', 'size']);
 expect(report).toMatchObject({ kind: 'error', message: 'Unlisted message', frames: ['/assets/app.js:2:4'], route: '/g/:game', browser: 'Safari 18', size: 'phone' });
 expect(report.build).toMatch(/^[a-f0-9]{40}$/);
});
it('sends at most five different faults per page load', () => {
 for (let line = 1; line <= 6; line++) emit('error', fault('Private text'), { filename: 'https://kingdown.dev/assets/app.js', lineno: line, colno: 4 });
 expect(beacon).toHaveBeenCalledTimes(5);
});
it('ignores extension faults, opaque scripts, resize notices and unknown assets', () => {
 for (const filename of ['chrome-extension://extension/a.js', 'https://foreign.example/assets/app.js', 'https://kingdown.dev/assets/unknown.js', '']) emit('error', fault('Fault'), { filename, lineno: 1, colno: 2 });
 emit('error', fault('Script error.')); emit('error', fault('ResizeObserver loop limit exceeded'));
 expect(beacon).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
});
it('records a rejection and the worker location', async () => {
 emit('unhandledrejection', fault('Promise failed'));
 const event = Object.assign(new Event('worker'), { filename: 'https://kingdown.dev/assets/worker.js', lineno: 3, colno: 5, message: 'Worker failed' });
 target.dispatchEvent(new CustomEvent('kingdown-worker-error', { detail: event }));
 expect(beacon).toHaveBeenCalledTimes(2);
 expect(JSON.parse(await (beacon.mock.calls[0][1] as Blob).text())).toMatchObject({ kind: 'rejection', frames: [], message: 'Unlisted message', fingerprint: errorFingerprint('Error', 'Unlisted message', '') });
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
 emit('error', fault('Beacon missing'), { filename: 'https://kingdown.dev/assets/app.js', lineno: 3, colno: 4 }); expect(send).toHaveBeenCalledTimes(2);
});

it('contains a fault in an event getter', () => {
 for (const [kind, key] of [['error', 'error'], ['unhandledrejection', 'reason']]) {
  const event = new Event(kind); Object.defineProperty(event, key, { get() { throw new Error('Event getter failed'); } });
  expect(() => target.dispatchEvent(event)).not.toThrow();
 }
 expect(beacon).not.toHaveBeenCalled();
});

it.each([
 'bad FEN t7/8/8/8/8/8/8/K6X w - - 0 1', 'Player message: Meet me at the station', 'account 123456789',
 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.4 Safari/605.1.15',
 'GET /assets/app.js?room=private-room#private-fragment failed',
])('removes private message text before send: %s', async raw => {
 emit('error', fault(raw));
 const text = await (beacon.mock.calls[0][1] as Blob).text();
 expect(text).not.toContain(raw);
 expect(JSON.parse(text).message).toBe(raw.startsWith('bad FEN ') ? 'bad FEN [value]' : 'Unlisted message');
});

it('removes raw Auth text before send', async () => {
 const { createClient } = await import('@supabase/supabase-js');
 const auth = createClient('http://127.0.0.1:1', 'test-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: async () => new Response(JSON.stringify({ msg: 'Player message: Meet me at the station' }), { status: 400, headers: { 'Content-Type': 'application/json' } }) } });
 const { error } = await auth.auth.signInWithPassword({ email: 'test@example.com', password: 'test' });
 expect(error).toBeTruthy(); emit('error', fault(error!.message));
 expect(JSON.parse(await (beacon.mock.calls[0][1] as Blob).text()).message).toBe('Unlisted message');
});

it.each(['account123456789', 'K6X', 'MeetMeAtTheStation', 'd137864c-e174-4f38-9277-6bdd0a4289dc', 'person@example.com', 'e2e4'])('removes private engine names from the full sent body: %s', async value => {
 let error: Error;
 try { const input = undefined as unknown as Record<string, unknown>; input[value]; } catch (caught) { error = caught as Error; }
 emit('error', error!);
 const body = await (beacon.mock.calls[0][1] as Blob).text();
 expect(body).not.toContain(value);
 const message = ['person@example.com', 'd137864c-e174-4f38-9277-6bdd0a4289dc'].includes(value) ? 'Unlisted message' : 'Cannot read properties of [value] (reading [value])';
 expect(JSON.parse(body)).toMatchObject({ message, fingerprint: errorFingerprint('TypeError', message, '/assets/app.js:2:4') });
});

it('sends one cleaned report for a non-Error rejection', async () => {
 emit('unhandledrejection', 'person@example.com');
 expect(beacon).toHaveBeenCalledOnce();
 const body = await (beacon.mock.calls[0][1] as Blob).text();
 expect(body).not.toContain('person@example.com');
 expect(JSON.parse(body)).toMatchObject({ kind: 'rejection', frames: [], message: 'Unlisted message' });
});
