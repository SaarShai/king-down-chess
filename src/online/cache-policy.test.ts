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
let workers: EventTarget & { controller: any; register: ReturnType<typeof vi.fn> };
let names: Set<string>;
let storage: { keys: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };
const worker = () => Object.assign(new EventTarget(), { state: 'activated', postMessage: vi.fn() });
const change = (controller: unknown) => { workers.controller = controller; workers.dispatchEvent(new Event('controllerchange')); };
const reply = (controller: ReturnType<typeof worker>, extra = {}) => {
  const [request, ports] = controller.postMessage.mock.calls.at(-1)!;
  ports[0].postMessage({ ...request, policy: 'public-build-v1', version: 'build', ...extra });
};
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

beforeEach(() => {
  vi.useFakeTimers(); channels.length = 0;
  workers = Object.assign(new EventTarget(), { controller: worker(), register: vi.fn().mockResolvedValue({ update: vi.fn().mockResolvedValue(undefined) }) });
  names = new Set(['kingdown-old', 'other-app']);
  storage = { keys: vi.fn(async () => [...names]), delete: vi.fn(async (name: string) => names.delete(name)) };
  vi.stubGlobal('window', {}); vi.stubGlobal('navigator', { serviceWorker: workers }); vi.stubGlobal('caches', storage);
  vi.stubGlobal('MessageChannel', class extends Channel { constructor() { super(); channels.push(this); } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('private cache policy', () => {
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
  it.each([false, true])('waits beyond eight seconds for a confirmed first install, then gets fresh proof (claimed: %s)', async claimed => {
    change(null); const installing = worker(); installing.state = 'installing';
    const registration = { installing: installing as ReturnType<typeof worker> | null, active: null as ReturnType<typeof worker> | null, update: vi.fn().mockResolvedValue(undefined) };
    workers.register.mockResolvedValue(registration);
    const send = vi.fn(() => 'sent'), result = withPrivateCachePolicy(send); await flush();
    await vi.advanceTimersByTimeAsync(12000);
    expect(send).not.toHaveBeenCalled(); expect(installing.postMessage).not.toHaveBeenCalled();
    registration.installing = null; registration.active = installing;
    installing.state = 'activating'; installing.dispatchEvent(new Event('statechange'));
    await vi.advanceTimersByTimeAsync(1000); expect(installing.postMessage).not.toHaveBeenCalled();
    installing.state = 'activated'; installing.dispatchEvent(new Event('statechange'));
    if (claimed) change(installing);
    await flush(); expect(installing.postMessage).toHaveBeenCalledOnce(); expect(send).not.toHaveBeenCalled();
    reply(installing); expect(await result).toBe('sent'); expect(send).toHaveBeenCalledOnce();
  });
  it('has a fresh eight-second proof deadline after the first installation', async () => {
    change(null); const installing = worker(); installing.state = 'installing';
    workers.register.mockResolvedValue({ installing, update: vi.fn().mockResolvedValue(undefined) });
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await flush(); await vi.advanceTimersByTimeAsync(12000);
    installing.state = 'activated'; change(installing); installing.dispatchEvent(new Event('statechange'));
    await vi.advanceTimersByTimeAsync(7999); expect(installing.postMessage).toHaveBeenCalledOnce(); expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); await refusal; reply(installing); expect(send).not.toHaveBeenCalled();
  });
  it('bounds a stalled first install at sixty seconds and ignores late activation', async () => {
    change(null); const installing = worker(); installing.state = 'installing';
    workers.register.mockResolvedValue({ installing, update: vi.fn().mockResolvedValue(undefined) });
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    let ended = false; void result.catch(() => { ended = true; }); await flush();
    await vi.advanceTimersByTimeAsync(59999); expect(ended).toBe(false); expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1); await refusal;
    installing.state = 'activated'; installing.dispatchEvent(new Event('statechange')); change(installing); await flush();
    expect(installing.postMessage).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
  });
  it('refuses a redundant first install immediately', async () => {
    change(null); const installing = worker(); installing.state = 'installing';
    workers.register.mockResolvedValue({ installing, update: vi.fn().mockResolvedValue(undefined) });
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await flush(); installing.state = 'redundant'; installing.dispatchEvent(new Event('statechange')); await refusal;
    expect(vi.getTimerCount()).toBe(0); expect(send).not.toHaveBeenCalled();
  });
  it.each([false, true])('keeps the eight-second budget when an active worker exists (controlled: %s)', async controlled => {
    const active = workers.controller, installing = worker(); installing.state = 'installing';
    if (!controlled) change(null);
    workers.register.mockResolvedValue({ active, installing, update: vi.fn().mockResolvedValue(undefined) });
    const send = vi.fn(), result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await vi.advanceTimersByTimeAsync(8000); await refusal;
    expect(active.postMessage).toHaveBeenCalledOnce(); expect(installing.postMessage).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
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
    workers.register.mockResolvedValue({ active, update });
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
    workers.register.mockResolvedValue({ active, update: vi.fn().mockResolvedValue(undefined) });
    const result = withPrivateCachePolicy(send); await flush();
    expect(active.postMessage).toHaveBeenCalledOnce(); reply(active); change(next); await flush();
    expect(send).not.toHaveBeenCalled(); reply(next); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('refuses a silent active registration after a hard reload', async () => {
    change(null); const active = worker(), send = vi.fn();
    workers.register.mockResolvedValue({ active, update: vi.fn().mockResolvedValue(undefined) });
    const result = withPrivateCachePolicy(send), refusal = expect(result).rejects.toBeInstanceOf(CachePolicyUnavailable);
    await flush(); const requests = active.postMessage.mock.calls.length;
    await vi.advanceTimersByTimeAsync(8000); await refusal; expect(requests).toBe(1); reply(active); await flush();
    expect(send).not.toHaveBeenCalled(); expect(storage.delete).not.toHaveBeenCalled();
  });
  it('requires new proof when an uncontrolled active registration retires just after its reply', async () => {
    change(null); const old = worker(), next = worker(), send = vi.fn();
    const registration = { active: old, update: vi.fn().mockResolvedValue(undefined) };
    workers.register.mockResolvedValue(registration);
    const result = withPrivateCachePolicy(send); await flush();
    reply(old); registration.active = next; old.state = 'redundant'; old.dispatchEvent(new Event('statechange'));
    await flush(); expect(send).not.toHaveBeenCalled(); expect(next.postMessage).toHaveBeenCalledOnce();
    reply(next); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('keeps the original deadline while an uncontrolled replacement activates and ignores late events', async () => {
    change(null); const active = worker(); active.state = 'activating';
    workers.register.mockResolvedValue({ active, update: vi.fn().mockResolvedValue(undefined) });
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
    workers.register.mockResolvedValue({ update });
    const result = withPrivateCachePolicy(send); await flush();
    expect(update).toHaveBeenCalledOnce(); expect(controller.postMessage).toHaveBeenCalledOnce();
    expect(send).not.toHaveBeenCalled(); reply(controller); await result; expect(send).toHaveBeenCalledOnce();
  });
  it('retries a failed update on the next send in the same page', async () => {
    const update = vi.fn(), next = worker(), send = vi.fn();
    update.mockImplementationOnce(async () => { throw new Error('offline'); }).mockImplementationOnce(async () => { change(next); });
    workers.register.mockResolvedValue({ update });
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
    change(null); if (mode === 'blocked') workers.register.mockRejectedValue(new Error('blocked')); else vi.stubGlobal('navigator', {});
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
    change(null); workers.register.mockRejectedValue(new Error('blocked'));
    storage.delete.mockImplementation(async (name: string) => { names.delete(name); return false; });
    expect(await withPrivateCachePolicy(() => 'sent')).toBe('sent');
  });
  it('proves a controller that takes over during page cleanup', async () => {
    change(null); workers.register.mockRejectedValue(new Error('blocked')); const controller = worker();
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
