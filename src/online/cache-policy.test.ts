import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CachePolicyUnavailable, withPrivateCachePolicy } from './cache-policy';

class Port {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  peer!: Port;
  close = vi.fn();
  postMessage(data: unknown) { this.peer.onmessage?.({ data }); }
}
class Channel {
  port1 = new Port(); port2 = new Port();
  constructor() { this.port1.peer = this.port2; this.port2.peer = this.port1; }
}
const channels: Channel[] = [];
let workers: EventTarget & { controller: any; register: ReturnType<typeof vi.fn>; getRegistration: ReturnType<typeof vi.fn> };
let names: Set<string>;
let storage: { keys: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
let warn: ReturnType<typeof vi.spyOn>;
const worker = () => Object.assign(new EventTarget(), { state: 'activated', postMessage: vi.fn() });
const change = (controller: unknown) => { workers.controller = controller; workers.dispatchEvent(new Event('controllerchange')); };
const reply = (controller: ReturnType<typeof worker>, extra = {}) => {
  const [request, ports] = controller.postMessage.mock.calls.at(-1)!;
  ports[0].postMessage({ ...request, policy: request.installing ? 'public-install-v1' : 'public-build-v1', version: 'build', ...extra });
};
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const rootRegistration = () => Object.assign(new EventTarget(), { scope: new URL('/', location.href).href, updateViaCache: 'none', active: Object.assign(workers.controller, { scriptURL: new URL('/sw.js', location.href).href }), installing: null as ReturnType<typeof worker> | null, update: vi.fn().mockResolvedValue(undefined) });

beforeEach(() => {
  vi.useFakeTimers(); channels.length = 0;
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  workers = Object.assign(new EventTarget(), { controller: worker(), getRegistration: vi.fn().mockRejectedValue(new Error('Lookup unavailable')), register: vi.fn().mockResolvedValue(Object.assign(new EventTarget(), { update: vi.fn().mockResolvedValue(undefined) })) });
  names = new Set(['kingdown-old', 'other-app']);
  storage = { keys: vi.fn(async () => [...names]), delete: vi.fn(async (name: string) => names.delete(name)) };
  vi.stubGlobal('window', {}); vi.stubGlobal('location', new URL('https://kingdown.test/')); vi.stubGlobal('navigator', { serviceWorker: workers }); vi.stubGlobal('caches', storage);
  vi.stubGlobal('MessageChannel', class extends Channel { constructor() { super(); channels.push(this); } });
});
afterEach(() => { warn.mockRestore(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('private cache policy', () => {
  it('proves empty caches without installing the offline game on a fresh account visit', async () => {
    change(null); workers.getRegistration.mockResolvedValue(undefined);
    expect(await withPrivateCachePolicy(() => 'sent')).toBe('sent');
    expect(workers.register).not.toHaveBeenCalled(); expect([...names]).toEqual(['other-app']);
    expect(storage.keys).toHaveBeenCalledTimes(2);
  });
  it('proves a registration that another tab starts during empty-cache cleanup', async () => {
    change(null); const active = worker();
    const registration = Object.assign(new EventTarget(), { active, update: vi.fn().mockResolvedValue(undefined) });
    workers.getRegistration.mockResolvedValueOnce(undefined).mockResolvedValue(registration);
    const send = vi.fn(), result = withPrivateCachePolicy(send); await flush();
    expect(send).not.toHaveBeenCalled(); reply(active); await result;
    expect(send).toHaveBeenCalledOnce(); expect(workers.register).not.toHaveBeenCalled();
  });
  it('uses an existing root registration without queuing register behind its pending native update', async () => {
    const registration = rootRegistration(); registration.update.mockImplementation(() => new Promise(() => {}));
    workers.getRegistration.mockResolvedValue(registration); workers.register.mockImplementation(() => new Promise(() => {}));
    const send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error); await flush();
    if (workers.controller.postMessage.mock.calls.length) reply(workers.controller);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await result).not.toBeInstanceOf(CachePolicyUnavailable);
    expect(workers.getRegistration).toHaveBeenCalledWith('/'); expect(workers.register).not.toHaveBeenCalled();
    expect(registration.update).toHaveBeenCalledOnce(); expect(send).toHaveBeenCalledOnce();
  });
  it('registers when the root registration lookup is absent', async () => {
    workers.getRegistration.mockResolvedValue(undefined);
    const result = withPrivateCachePolicy(() => 'sent'); await flush(); reply(workers.controller); expect(await result).toBe('sent');
    expect(workers.getRegistration).toHaveBeenCalledWith('/'); expect(workers.register).toHaveBeenCalledOnce();
  });
  it.each(['throw', 'reject'])('falls back to guarded register when registration lookup errors (%s)', async mode => {
    workers.getRegistration.mockImplementation(() => { if (mode === 'throw') throw new Error('private-lookup-secret'); return Promise.reject(new Error('private-lookup-secret')); });
    const result = withPrivateCachePolicy(() => 'sent'); await flush(); reply(workers.controller); expect(await result).toBe('sent');
    expect(workers.register).toHaveBeenCalledOnce(); expect(warn).not.toHaveBeenCalled();
  });
  it('refuses a late registration lookup without updates or a late send', async () => {
    let finish!: (value: object) => void; workers.getRegistration.mockImplementation(() => new Promise(done => { finish = done; }));
    const registration = rootRegistration(), send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error);
    await vi.advanceTimersByTimeAsync(8000); expect(await result).toMatchObject({ failure: { phase: 'register', reason: 'deadline' } });
    finish(registration); await flush();
    expect(send).not.toHaveBeenCalled(); expect(registration.update).not.toHaveBeenCalled(); expect(workers.register).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['scope', 'script', 'cache'])('repairs an incompatible root registration (%s) before proof', async mismatch => {
    const registration = rootRegistration();
    if (mismatch === 'scope') registration.scope += 'other/';
    if (mismatch === 'script') registration.active.scriptURL += '?other';
    if (mismatch === 'cache') registration.updateViaCache = 'imports';
    workers.getRegistration.mockResolvedValue(registration);
    const result = withPrivateCachePolicy(() => 'sent'); await flush(); reply(workers.controller); expect(await result).toBe('sent');
    expect(workers.register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' }); expect(registration.update).not.toHaveBeenCalled();
  });
  it.each(['silent', 'invalid'])('refuses an unsafe looked-up active worker (%s)', async mode => {
    const registration = rootRegistration(); workers.getRegistration.mockResolvedValue(registration);
    const send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error); await flush();
    if (mode === 'invalid') reply(workers.controller, { policy: 'old' });
    await vi.advanceTimersByTimeAsync(8000);
    expect(await result).toMatchObject({ failure: { phase: 'proof', reason: mode === 'invalid' ? 'bad-proof' : 'deadline' } });
    reply(workers.controller); await flush(); expect(send).not.toHaveBeenCalled(); expect(workers.register).not.toHaveBeenCalled();
  });
  it('records a bounded proof-deadline support code once without sending private data', async () => {
    const send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error);
    await vi.advanceTimersByTimeAsync(8000);
    const failure = { phase: 'proof', reason: 'deadline', elapsed_ms: 8000, controller: 'activated', active: 'none', installing: 'none', waiting: 'none', register_failed: false, update_failed: false };
    expect(await result).toMatchObject({ supportCode: 'CACHE_PROOF_DEADLINE', failure, message: 'Online play is unavailable until the public cache is safe [CACHE_PROOF_DEADLINE]' });
    expect(warn).toHaveBeenCalledExactlyOnceWith('[King Down cache safety] ' + JSON.stringify(failure));
    reply(workers.controller); await flush();
    expect(warn).toHaveBeenCalledOnce(); expect(send).not.toHaveBeenCalled();
    expect(channels[0].port1.close).toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['bad-proof', 'post-message'] as const)('classifies %s without copying raw proof or errors', async reason => {
    if (reason === 'post-message') workers.controller.postMessage.mockImplementation(() => { throw new Error('private-secret-token'); });
    const result = withPrivateCachePolicy(vi.fn()).catch(error => error); await flush();
    if (reason === 'bad-proof') reply(workers.controller, { policy: 'private-secret-token', unexpected: 'https://private.invalid/?token=secret' });
    expect(await result).toMatchObject({ failure: { phase: 'proof', reason } });
    expect(warn).toHaveBeenCalledOnce();
    const logged = warn.mock.calls[0][0] as string;
    expect(logged).not.toMatch(/private|secret|requestId|https?:/);
    expect(Object.keys(JSON.parse(logged.slice('[King Down cache safety] '.length)))).toEqual(['phase', 'reason', 'elapsed_ms', 'controller', 'active', 'installing', 'waiting', 'register_failed', 'update_failed']);
  });
  it('classifies a redundant installation without waiting for the deadline', async () => {
    const installing = worker(); installing.state = 'installing';
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { installing, update: vi.fn().mockResolvedValue(undefined) }));
    const result = withPrivateCachePolicy(vi.fn()).catch(error => error); await flush();
    installing.state = 'redundant'; installing.dispatchEvent(new Event('statechange'));
    expect(await result).toMatchObject({ supportCode: 'CACHE_INSTALL_REDUNDANT', failure: { phase: 'install', reason: 'redundant', installing: 'redundant' } });
    expect(warn).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  });
  it('refuses a failed installation after the browser clears installing without trusting the old controller', async () => {
    const old = workers.controller, next = worker(); next.state = 'installing';
    const registration = Object.assign(new EventTarget(), { active: old, installing: next as ReturnType<typeof worker> | null, update: vi.fn().mockResolvedValue(undefined) });
    workers.register.mockResolvedValue(registration);
    const send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error); await flush();
    registration.installing = null; next.state = 'redundant'; next.dispatchEvent(new Event('statechange')); await flush();
    expect(old.postMessage).not.toHaveBeenCalled();
    expect(await result).toMatchObject({ supportCode: 'CACHE_INSTALL_REDUNDANT' });
    expect(send).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
  it('keeps the install cache when another tab registers between lookup and cleanup', async () => {
    change(null); const next = worker(); next.state = 'installing';
    const registration = Object.assign(new EventTarget(), { installing: next, update: vi.fn().mockResolvedValue(undefined) });
    workers.getRegistration.mockResolvedValueOnce(undefined).mockResolvedValue(registration);
    storage.keys.mockImplementationOnce(async () => { names.add('kingdown-next'); return [...names]; });
    const send = vi.fn(), result = withPrivateCachePolicy(send); await flush();
    expect(storage.delete).not.toHaveBeenCalledWith('kingdown-next'); expect(names.has('kingdown-next')).toBe(true);
    expect(send).not.toHaveBeenCalled(); reply(next, { version: 'next' }); await result;
    expect(names.has('kingdown-next')).toBe(true); expect(send).toHaveBeenCalledOnce();
  });
  it('classifies page cleanup failure without logging the registration or storage error', async () => {
    change(null); workers.register.mockRejectedValue(new Error('private-register-secret')); storage.keys.mockRejectedValue(new Error('private-storage-secret'));
    const result = withPrivateCachePolicy(vi.fn()).catch(error => error);
    expect(await result).toMatchObject({ failure: { phase: 'empty-cache', reason: 'exception', register_failed: true } });
    expect(warn).toHaveBeenCalledOnce(); expect(warn.mock.calls[0][0]).not.toMatch(/private|secret/);
  });
  it('adds no cache warning to a successful send or its downstream failure', async () => {
    const success = withPrivateCachePolicy(() => 42); await flush(); reply(workers.controller); expect(await success).toBe(42);
    const failure = withPrivateCachePolicy(() => { throw new Error('send failed'); });
    const refused = expect(failure).rejects.toThrow('send failed'); await flush(); reply(workers.controller); await refused;
    expect(warn).not.toHaveBeenCalled();
  });
  it.each(['throw', 'reject'])('normalizes state strings and records update %s only as a flag', async mode => {
    workers.controller.state = 'private-state-secret';
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { update: vi.fn(() => {
      if (mode === 'throw') throw new Error('private-update-secret');
      return Promise.reject(new Error('private-update-secret'));
    }) }));
    const result = withPrivateCachePolicy(vi.fn()).catch(error => error);
    await vi.advanceTimersByTimeAsync(8000);
    expect(await result).toMatchObject({ failure: { phase: 'controller-activation', reason: 'deadline', controller: 'unknown', register_failed: false, update_failed: true } });
    expect(warn).toHaveBeenCalledOnce(); expect(warn.mock.calls[0][0]).not.toMatch(/private|secret/);
  });
  it('keeps Node sends unchanged', async () => {
    vi.stubGlobal('window', undefined);
    expect(await withPrivateCachePolicy(() => 42)).toBe(42);
    expect(workers.register).not.toHaveBeenCalled();
  });
  it('uses a fresh request and port for every send, with no saved proof', async () => {
    const send = vi.fn(() => 42), controller = workers.controller;
    for (let i = 0; i < 2; i++) {
      const result = withPrivateCachePolicy(send); await flush();
      expect(send).toHaveBeenCalledTimes(i);
      reply(controller); expect(await result).toBe(42);
    }
    expect(workers.register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' });
    expect(new Set(controller.postMessage.mock.calls.map(([request]: any) => request.requestId)).size).toBe(2);
    expect(channels).toHaveLength(2);
    for (const channel of channels) expect(channel.port1.close).toHaveBeenCalled();
  });
  it.each([{ policy: 'old' }, { requestId: 'stale' }, { type: 'other' }, { version: '' }, { version: 1 }])('refuses an invalid reply %j', async extra => {
    const send = vi.fn(), result = withPrivateCachePolicy(send); const refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await flush(); reply(workers.controller, extra); await refusal; expect(send).not.toHaveBeenCalled();
  });
  it('proves the new controller when it changes before or just after a reply', async () => {
    const send = vi.fn(), first = workers.controller, result = withPrivateCachePolicy(send); await flush();
    const second = worker(); change(second); await flush(); reply(first); expect(send).not.toHaveBeenCalled();
    reply(second); const third = worker(); change(third); await flush(); expect(send).not.toHaveBeenCalled();
    reply(third); await result; expect(send).toHaveBeenCalledTimes(1);
  });
  it('has one deadline across controller changes and ignores late replies', async () => {
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await flush(); await vi.advanceTimersByTimeAsync(7000); change(worker()); await flush();
    await vi.advanceTimersByTimeAsync(1000); await refusal; reply(workers.controller); await flush(); expect(send).not.toHaveBeenCalled();
  });
  it('keeps the send closed when a purge or failed install gives no proof', async () => {
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await vi.advanceTimersByTimeAsync(8000); await refusal;
    expect(workers.controller.postMessage).toHaveBeenCalledOnce(); expect(send).not.toHaveBeenCalled();
  });
  it('bounds registration and never sends after its late completion', async () => {
    let finish!: (value: object) => void; workers.register.mockImplementation(() => new Promise(done => { finish = done; }));
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await vi.advanceTimersByTimeAsync(8000); await refusal; finish({}); await flush(); expect(send).not.toHaveBeenCalled();
  });
  it.each(['first', 'controlled', 'uncontrolled', 'waiting'])('proves public-only writes before the offline install ends: %s', async mode => {
    const active = workers.controller, next = worker(); next.state = mode === 'waiting' ? 'installed' : 'installing';
    if (mode !== 'controlled') change(null);
    const registration = Object.assign(new EventTarget(), { active: mode === 'first' ? null : active,
      installing: mode === 'waiting' ? null : next, waiting: mode === 'waiting' ? next : null, update: vi.fn().mockResolvedValue(undefined) });
    workers.register.mockResolvedValue(registration);
    names.add('kingdown-active'); names.add('kingdown-next');
    const send = vi.fn(() => 'sent'), result = withPrivateCachePolicy(send); await flush();
    expect(send).not.toHaveBeenCalled(); expect(next.postMessage).toHaveBeenCalledOnce();
    expect(active.postMessage).not.toHaveBeenCalled();
    expect(next.postMessage.mock.calls[0][0].installing).toBe(true);
    reply(next, { version: 'next' }); await flush();
    if (mode !== 'first') { expect(send).not.toHaveBeenCalled(); reply(active, { version: 'active' }); }
    expect(await result).toBe('sent');
    expect(next.state).toBe(mode === 'waiting' ? 'installed' : 'installing'); expect(send).toHaveBeenCalledOnce();
    expect([...names].sort()).toEqual((mode === 'first' ? ['other-app', 'kingdown-next'] : ['other-app', 'kingdown-active', 'kingdown-next']).sort());
  });
  it.each(['silent', 'old-policy', 'bad-id', 'post-message'])('refuses an unproved install: %s', async mode => {
    change(null); const next = worker(); next.state = 'installing';
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { installing: next, update: vi.fn().mockResolvedValue(undefined) }));
    if (mode === 'post-message') next.postMessage.mockImplementation(() => { throw new Error('stopped'); });
    const send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error); await flush();
    if (mode === 'old-policy') reply(next, { policy: 'public-build-v1' });
    if (mode === 'bad-id') reply(next, { requestId: 'stale' });
    await vi.advanceTimersByTimeAsync(60000);
    expect(await result).toBeInstanceOf(CachePolicyUnavailable); expect(send).not.toHaveBeenCalled();
    reply(next); await flush(); expect(send).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['silent', 'old-policy', 'bad-id', 'post-message'])('waits for takeover when early proof is unavailable, then requires fresh full proof: %s', async mode => {
    const old = workers.controller, next = worker(); next.state = 'installing';
    const registration = Object.assign(new EventTarget(), { active: old, installing: next as ReturnType<typeof worker> | null, update: vi.fn().mockResolvedValue(undefined) });
    workers.register.mockResolvedValue(registration);
    if (mode === 'post-message') next.postMessage.mockImplementation(() => { throw new Error('old protocol'); });
    const send = vi.fn(), result = withPrivateCachePolicy(send); await flush();
    if (mode === 'old-policy') reply(next, { policy: 'public-build-v1' });
    if (mode === 'bad-id') reply(next, { requestId: 'stale' });
    await vi.advanceTimersByTimeAsync(12000);
    expect(send).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled(); expect(old.postMessage).not.toHaveBeenCalled();
    next.postMessage.mockImplementation(() => {});
    registration.installing = null; registration.active = next; next.state = 'activating'; old.state = 'redundant';
    next.dispatchEvent(new Event('statechange')); change(next); await flush();
    await vi.advanceTimersByTimeAsync(9000); expect(send).not.toHaveBeenCalled(); expect(warn).not.toHaveBeenCalled();
    next.state = 'activated'; next.dispatchEvent(new Event('statechange')); await flush();
    expect(next.postMessage.mock.calls.at(-1)![0].installing).toBeUndefined();
    await vi.advanceTimersByTimeAsync(7000); expect(send).not.toHaveBeenCalled();
    reply(next); await result; expect(send).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  });
  it('proves both the unsafe controller and the pending worker before it sends', async () => {
    const old = workers.controller, next = worker(); next.state = 'installing';
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { active: old, installing: next, update: vi.fn().mockResolvedValue(undefined) }));
    const send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error); await flush();
    reply(next); await flush(); expect(old.postMessage).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(60000); expect(await result).toBeInstanceOf(CachePolicyUnavailable);
    expect(send).not.toHaveBeenCalled(); expect(storage.delete).not.toHaveBeenCalled();
  });
  it('invalidates active proof when an installation appears, then proves both workers afresh', async () => {
    const registration = rootRegistration(); workers.getRegistration.mockResolvedValue(registration);
    const old = workers.controller, next = worker(); next.state = 'installing';
    const send = vi.fn(), result = withPrivateCachePolicy(send); await flush();
    registration.installing = next; registration.dispatchEvent(new Event('updatefound')); await flush();
    expect(old.postMessage).toHaveBeenCalledOnce(); reply(next); await flush(); expect(send).not.toHaveBeenCalled();
    expect(old.postMessage).toHaveBeenCalledTimes(2); reply(old); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('releases silent old proof on takeover and requires fresh proof from the new controller', async () => {
    const old = workers.controller, next = worker(); next.state = 'installing';
    const registration = Object.assign(new EventTarget(), { active: old, installing: next as ReturnType<typeof worker> | null, update: vi.fn().mockResolvedValue(undefined) });
    workers.register.mockResolvedValue(registration);
    const send = vi.fn(), result = withPrivateCachePolicy(send); await flush();
    expect(old.postMessage).not.toHaveBeenCalled(); reply(next); await flush(); expect(old.postMessage).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000); expect(send).not.toHaveBeenCalled();
    registration.installing = null; registration.active = next; next.state = 'activated'; old.state = 'redundant';
    next.dispatchEvent(new Event('statechange')); change(next); await flush();
    expect(send).not.toHaveBeenCalled(); expect(next.postMessage).toHaveBeenCalledTimes(2);
    reply(old); expect(send).not.toHaveBeenCalled(); reply(next); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('keeps one sixty-second deadline across pending replacements and ignores late proof', async () => {
    change(null); const first = worker(), second = worker(); first.state = second.state = 'installing';
    const registration = Object.assign(new EventTarget(), { installing: first, update: vi.fn().mockResolvedValue(undefined) });
    workers.register.mockResolvedValue(registration);
    const send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error); await flush();
    await vi.advanceTimersByTimeAsync(59000);
    registration.installing = second; first.state = 'redundant'; registration.dispatchEvent(new Event('updatefound')); await flush();
    reply(first); expect(send).not.toHaveBeenCalled(); await vi.advanceTimersByTimeAsync(1000);
    expect(await result).toBeInstanceOf(CachePolicyUnavailable); reply(second); await flush(); expect(send).not.toHaveBeenCalled();
  });
  it.each(['keys', 'throw', 'false'])('refuses failed old-cache cleanup during installation: %s', async mode => {
    change(null); const next = worker(); next.state = 'installing';
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { installing: next, update: vi.fn().mockResolvedValue(undefined) }));
    if (mode === 'keys') storage.keys.mockRejectedValue(new Error('blocked'));
    if (mode === 'throw') storage.delete.mockRejectedValue(new Error('blocked'));
    if (mode === 'false') storage.delete.mockResolvedValue(false);
    const send = vi.fn(), result = withPrivateCachePolicy(send).catch(error => error); await flush(); reply(next);
    expect(await result).toBeInstanceOf(CachePolicyUnavailable); expect(send).not.toHaveBeenCalled();
  });
  it('proves a replacement that appears during old-cache cleanup before sending', async () => {
    change(null); const first = worker(), second = worker(); first.state = second.state = 'installing';
    const registration = Object.assign(new EventTarget(), { installing: first, update: vi.fn().mockResolvedValue(undefined) });
    workers.register.mockResolvedValue(registration);
    storage.delete.mockImplementationOnce(async (key: string) => { names.delete(key); registration.installing = second; registration.dispatchEvent(new Event('updatefound')); return true; });
    const send = vi.fn(), result = withPrivateCachePolicy(send); await flush(); reply(first); await flush();
    expect(send).not.toHaveBeenCalled(); expect(second.postMessage).toHaveBeenCalledOnce(); reply(second);
    await result; expect(send).toHaveBeenCalledOnce();
  });
  it('repeats a silent proof only after the replacement controller activates', async () => {
    const old = workers.controller, send = vi.fn(), result = withPrivateCachePolicy(send); await flush();
    expect(old.postMessage).toHaveBeenCalledOnce();
    const next = worker(); next.state = 'activating'; change(next); await flush();
    expect(next.postMessage).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
    next.state = 'activated'; next.dispatchEvent(new Event('statechange')); await flush();
    reply(old); expect(send).not.toHaveBeenCalled(); reply(next); await result;
    expect(channels).toHaveLength(2); expect(send).toHaveBeenCalledOnce();
  });
  it('waits for activation before it requests proof from a new controller', async () => {
    const controller = workers.controller; controller.state = 'activating';
    const send = vi.fn(), result = withPrivateCachePolicy(send); void result.catch(() => {});
    await flush(); expect(controller.postMessage).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
    controller.state = 'activated'; controller.dispatchEvent(new Event('statechange')); await flush();
    expect(controller.postMessage).toHaveBeenCalledOnce(); reply(controller); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('keeps the same deadline while activation waits, and ignores a late state change', async () => {
    const controller = workers.controller; controller.state = 'activating';
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await vi.advanceTimersByTimeAsync(8000); await refusal;
    controller.state = 'activated'; controller.dispatchEvent(new Event('statechange')); await flush();
    expect(controller.postMessage).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
  });
  it('proves the replacement if the controller changes during activation', async () => {
    workers.controller.state = 'activating'; const old = workers.controller;
    const send = vi.fn(), result = withPrivateCachePolicy(send); await flush();
    const next = worker(); change(next); await flush(); reply(next); await result;
    expect(old.postMessage).not.toHaveBeenCalled(); expect(send).toHaveBeenCalledOnce();
  });
  it('waits for the first controller without using ready', async () => {
    change(null); const send = vi.fn(), result = withPrivateCachePolicy(send); await flush(); expect(send).not.toHaveBeenCalled();
    const controller = worker(); change(controller); await flush(); reply(controller); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('proves the active registration on each send after a hard reload', async () => {
    change(null); const active = worker(), update = vi.fn(() => new Promise(() => {}));
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { active, update }));
    const send = vi.fn(() => 'sent');
    for (let i = 0; i < 2; i++) {
      const result = withPrivateCachePolicy(send); await flush();
      expect(active.postMessage).toHaveBeenCalledTimes(i + 1); expect(send).toHaveBeenCalledTimes(i);
      reply(active); expect(await result).toBe('sent');
    }
    expect(update).toHaveBeenCalledTimes(2); expect(storage.delete).not.toHaveBeenCalled();
  });
  it('proves a new controller that claims just after an uncontrolled reply', async () => {
    change(null); const active = worker(), next = worker(), send = vi.fn();
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { active, update: vi.fn().mockResolvedValue(undefined) }));
    const result = withPrivateCachePolicy(send); await flush();
    expect(active.postMessage).toHaveBeenCalledOnce(); reply(active); change(next); await flush();
    expect(send).not.toHaveBeenCalled(); reply(next); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('refuses a silent active registration after a hard reload', async () => {
    change(null); const active = worker(), send = vi.fn();
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { active, update: vi.fn().mockResolvedValue(undefined) }));
    const result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await flush(); const requests = active.postMessage.mock.calls.length;
    await vi.advanceTimersByTimeAsync(8000); await refusal; expect(requests).toBe(1); reply(active); await flush();
    expect(send).not.toHaveBeenCalled(); expect(storage.delete).not.toHaveBeenCalled();
  });
  it('requires new proof when an uncontrolled active registration retires just after its reply', async () => {
    change(null); const old = worker(), next = worker(), send = vi.fn();
    const registration = Object.assign(new EventTarget(), { active: old, update: vi.fn().mockResolvedValue(undefined) });
    workers.register.mockResolvedValue(registration);
    const result = withPrivateCachePolicy(send); await flush();
    reply(old); registration.active = next; old.state = 'redundant'; old.dispatchEvent(new Event('statechange'));
    await flush(); expect(send).not.toHaveBeenCalled(); expect(next.postMessage).toHaveBeenCalledOnce();
    reply(next); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('keeps the original deadline while an uncontrolled replacement activates and ignores late events', async () => {
    change(null); const active = worker(); active.state = 'activating';
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { active, update: vi.fn().mockResolvedValue(undefined) }));
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await vi.advanceTimersByTimeAsync(8000); await refusal;
    active.state = 'activated'; active.dispatchEvent(new Event('statechange')); await flush();
    expect(active.postMessage).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
  it('does not send on a now redundant controller even before controllerchange arrives', async () => {
    const old = workers.controller, send = vi.fn(), result = withPrivateCachePolicy(send); await flush();
    reply(old); old.state = 'redundant'; old.dispatchEvent(new Event('statechange')); await flush();
    expect(send).not.toHaveBeenCalled();
    const next = worker(); change(next); await flush(); reply(next); await result;
    expect(send).toHaveBeenCalledOnce();
  });
  it('starts each update without waiting for it or replacing fresh proof', async () => {
    const update = vi.fn(() => new Promise(() => {})), controller = workers.controller, send = vi.fn();
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { update }));
    const result = withPrivateCachePolicy(send); await flush();
    expect(update).toHaveBeenCalledOnce(); expect(controller.postMessage).toHaveBeenCalledOnce();
    expect(send).not.toHaveBeenCalled(); reply(controller); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('retries a failed update on the next send in the same page', async () => {
    const update = vi.fn(), next = worker(), send = vi.fn();
    update.mockImplementationOnce(async () => { throw new Error('offline'); }).mockImplementationOnce(async () => { change(next); });
    workers.register.mockResolvedValue(Object.assign(new EventTarget(), { update }));
    const first = withPrivateCachePolicy(send), refusal = expect(first).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await vi.advanceTimersByTimeAsync(8000); await refusal; expect(send).not.toHaveBeenCalled();
    const second = withPrivateCachePolicy(send); await flush();
    expect(update).toHaveBeenCalledTimes(2); expect(next.postMessage).toHaveBeenCalledOnce();
    reply(next); await second; expect(send).toHaveBeenCalledOnce();
  });
  it.each(['blocked', 'offline'])('refuses an old silent controller when registration is %s', async reason => {
    workers.register.mockRejectedValue(new Error(reason));
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await vi.advanceTimersByTimeAsync(8000); await refusal; expect(send).not.toHaveBeenCalled(); expect(storage.delete).not.toHaveBeenCalled();
  });
  it.each(['blocked', 'unsupported'])('purges every application cache with no controller (%s)', async mode => {
    change(null); workers.getRegistration.mockRejectedValueOnce(new Error('lookup blocked')).mockResolvedValue(undefined); if (mode === 'blocked') workers.register.mockRejectedValue(new Error('blocked')); else vi.stubGlobal('navigator', {});
    const send = vi.fn(() => 'sent'); expect(await withPrivateCachePolicy(send)).toBe('sent');
    expect([...names]).toEqual(['other-app']); expect(storage.keys).toHaveBeenCalledTimes(2);
  });
  it.each(['keys', 'throw', 'false', 'absent'])('refuses failed page cleanup: %s', async mode => {
    change(null); workers.register.mockRejectedValue(new Error('blocked'));
    if (mode === 'keys') storage.keys.mockRejectedValue(new Error('storage'));
    if (mode === 'throw') storage.delete.mockRejectedValue(new Error('storage'));
    if (mode === 'false') storage.delete.mockResolvedValue(false);
    if (mode === 'absent') vi.stubGlobal('caches', undefined);
    const send = vi.fn(); await expect(withPrivateCachePolicy(send)).rejects.toBeInstanceOf(CachePolicyUnavailable); expect(send).not.toHaveBeenCalled();
  });
  it('allows a concurrent deletion only when the final list proves absence', async () => {
    change(null); workers.getRegistration.mockRejectedValueOnce(new Error('lookup blocked')).mockResolvedValue(undefined); workers.register.mockRejectedValue(new Error('blocked'));
    storage.delete.mockImplementation(async (name: string) => { names.delete(name); return false; });
    expect(await withPrivateCachePolicy(() => 'sent')).toBe('sent');
  });
  it('proves a controller that takes over during page cleanup', async () => {
    change(null); workers.getRegistration.mockRejectedValueOnce(new Error('lookup blocked')).mockResolvedValue(undefined); workers.register.mockRejectedValue(new Error('blocked')); const controller = worker();
    storage.delete.mockImplementation(async (name: string) => { names.delete(name); change(controller); return true; });
    const send = vi.fn(), result = withPrivateCachePolicy(send); await flush(); expect(send).not.toHaveBeenCalled();
    reply(controller); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('refuses a controller that cannot receive a policy request', async () => {
    workers.controller.postMessage.mockImplementation(() => { throw new Error('Worker stopped'); });
    const send = vi.fn(); await expect(withPrivateCachePolicy(send)).rejects.toBeInstanceOf(CachePolicyUnavailable);
    expect(send).not.toHaveBeenCalled();
    expect(channels[0].port1.close).toHaveBeenCalled();
  });
  it('keeps send failures intact', async () => {
    const result = withPrivateCachePolicy(() => { throw new Error('send failed'); });
    const refusal = expect(result).rejects.toThrow('send failed'); await flush(); reply(workers.controller); await refusal;
  });
});
