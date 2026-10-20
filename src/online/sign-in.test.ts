import { describe, expect, it, vi } from 'vitest';
import { beginAccountSignIn, consumeSignInReturn, type SignInHost } from './sign-in';

const origin = 'https://kingdown.test', key = 'kingdown.account-signin', flow = 'flow_12345678', otherFlow = 'flow_87654321';
const target = '/g/abcdef12-3456-7890-abcd-1234567890ab';
const session = { userId: 'user-a', accessToken: 'token-a' };
const callback = (id = flow, code = 'one-use-code') => `/play/?code=${code}&sb_flow_id=${id}`;
const record = (extra = {}) => ({ flow, target, created: 1_000_000, ...extra });

function tab(path = callback()) {
  const records = new Map<string, string>([['unrelated', 'keep'], ['kingdown.account-page.user-a', 'keep route']]);
  const order: string[] = [];
  const location = { href: new URL(path, origin).href, assign: vi.fn((url: string) => { order.push('leave'); location.href = url; }) };
  const history = { state: { keep: true }, replaceState: vi.fn((_state: unknown, _unused: string, url?: string | URL | null) => {
    order.push(`replace:${url}`); location.href = new URL(String(url), origin).href;
  }) };
  const storage = {
    getItem: vi.fn((name: string) => { order.push('read'); return records.get(name) ?? null; }),
    setItem: vi.fn((name: string, value: string) => { order.push('save'); records.set(name, value); }),
    removeItem: vi.fn((name: string) => { order.push('consume'); records.delete(name); }),
  };
  const client = {
    startAccountSignIn: vi.fn(async () => { order.push('start'); return { url: 'https://provider.test/start', flowId: flow }; }),
    finishAccountSignIn: vi.fn(async (_code: string, _flowId: string) => {
      expect(records.has(key)).toBe(false); expect(location.href).toBe(origin + '/play/');
      order.push('exchange'); return session;
    }),
  };
  const host: SignInHost = { location, history, storage, now: () => 1_000_000, client: vi.fn(async () => { order.push('load'); return client; }) };
  return { host, records, client, order, put: (value: unknown = record()) => records.set(key, JSON.stringify(value)) };
}

describe('checked account sign-in return', () => {
  it('A05 saves only a checked route, flow and date before it leaves for the provider', async () => {
    const t = tab('/j#ABC234');
    await beginAccountSignIn('github', '/j?next=unchecked#abc-234', t.host);
    expect(t.client.startAccountSignIn).toHaveBeenCalledExactlyOnceWith('github');
    expect(JSON.parse(t.records.get(key)!)).toEqual({ flow, target: '/j#ABC234', created: 1_000_000 });
    expect(t.order).toEqual(['consume', 'load', 'start', 'save', 'leave']);
    expect(t.host.location.assign).toHaveBeenCalledExactlyOnceWith('https://provider.test/start');
  });

  it('A05 clears the callback and consumes once before SDK startup, then replaces to the rebuilt target', async () => {
    const t = tab(); t.put(record({ target: target.toUpperCase().replace('/G/', '/g/') + '?next=unchecked#unchecked' }));
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'signed-in', session, route: { screen: 'game', gameId: target.slice(3) } });
    expect(t.order).toEqual(['replace:/play/', 'read', 'consume', 'load', 'exchange', `replace:${target}`]);
    expect(t.client.finishAccountSignIn).toHaveBeenCalledExactlyOnceWith('one-use-code', flow);
    expect(t.host.history.replaceState).toHaveBeenLastCalledWith({ keep: true }, '', target);
    expect(t.records.has(key)).toBe(false);
    expect([...t.records]).toEqual([['unrelated', 'keep'], ['kingdown.account-page.user-a', 'keep route']]);
    t.host.location.href = origin + callback();
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.client.finishAccountSignIn).toHaveBeenCalledOnce();
  });

  it('A05 leaves a normal entry and an active flow alone', async () => {
    const t = tab('/j#ABC234'); t.put();
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'none' });
    expect(t.order).toEqual([]); expect(t.records.has(key)).toBe(true);
  });

  it.each([
    '/play/?error=access_denied&error_description=private&error_code=cancel&sb_flow_id=' + flow,
    callback() + '&error=access_denied', '/play/#error=access_denied&error_description=private&sb_flow_id=' + flow,
    '/play/?error_description=private',
  ])('A06 consumes and clears a failed provider return: %s', async path => {
    const t = tab(path); t.put();
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.host.location.href).toBe(origin + '/play/'); expect(t.records.has(key)).toBe(false);
    expect(t.host.client).not.toHaveBeenCalled(); expect(t.client.finishAccountSignIn).not.toHaveBeenCalled();
  });

  it('A06 clears the record and address when SDK startup or exchange fails', async () => {
    for (const stage of ['load', 'exchange']) {
      const t = tab(); t.put();
      if (stage === 'load') vi.mocked(t.host.client).mockRejectedValueOnce(new Error('offline'));
      else t.client.finishAccountSignIn.mockRejectedValueOnce(new Error('provider failure'));
      expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
      expect(t.host.location.href).toBe(origin + '/play/'); expect(t.records.has(key)).toBe(false);
      expect(t.host.history.replaceState).toHaveBeenCalledOnce();
    }
  });

  it.each([
    '/play/?code=private', '/play/?sb_flow_id=' + flow, callback(otherFlow), callback('short'), callback(''),
    callback() + '&sb_flow_id=' + flow, callback() + '&sb_flow_id=' + otherFlow, callback() + '&code=second', callback(flow, ''),
    callback() + '#sb_flow_id=' + flow, '/play?code=private&sb_flow_id=' + flow,
    '/play/profile?code=private&sb_flow_id=' + flow, '/j?code=private&sb_flow_id=' + flow,
    callback() + '&access_token=private',
  ])('A07 rejects a missing, crossed, duplicate or wrong-path callback: %s', async path => {
    const t = tab(path); t.put();
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.records.has(key)).toBe(false); expect(t.host.client).not.toHaveBeenCalled();
    expect(t.host.location.href).toBe(origin + '/play/');
  });

  it('A07 rejects matching malformed flow IDs before SDK startup', async () => {
    const t = tab(callback('short')); t.put(record({ flow: 'short' }));
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.order).toEqual(['replace:/play/', 'read', 'consume']);
    expect(t.records.has(key)).toBe(false); expect(t.host.location.href).toBe(origin + '/play/');
    expect(t.host.client).not.toHaveBeenCalled(); expect(t.client.finishAccountSignIn).not.toHaveBeenCalled();
  });

  it.each([
    null, [], {}, record({ flow: '' }), record({ flow: otherFlow }), record({ flow: 3 }), record({ target: null }),
    record({ target: 'https://other.test/play/' }), record({ target: '/' }), record({ target: '/g/bad-id' }),
    record({ target: '/play/%2e%2e/play/' }), record({ created: '1000000' }), record({ extra: 'private' }),
  ])('A07 consumes a malformed record without SDK startup: %j', async value => {
    const t = tab(); t.put(value);
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.records.has(key)).toBe(false); expect(t.host.client).not.toHaveBeenCalled();
  });

  it('A07 rejects missing, bad-JSON and replayed records without a session fallback', async () => {
    const t = tab();
    for (const value of [null, 'bad json']) {
      t.host.location.href = origin + callback();
      if (value) t.records.set(key, value);
      expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    }
    t.host.location.href = origin + callback(); t.put();
    const first = consumeSignInReturn(t.host);
    t.host.location.href = origin + callback();
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(await first).toMatchObject({ status: 'signed-in' });
    expect(t.client.finishAccountSignIn).toHaveBeenCalledOnce();
  });

  it.each([0, 599_999, 600_000])('A08 accepts a record aged %s ms', async age => {
    const t = tab(); t.put(record({ created: 1_000_000 - age }));
    expect(await consumeSignInReturn(t.host)).toMatchObject({ status: 'signed-in' });
  });
  it('A08 returns an expired reason for an old matching record before SDK startup', async () => {
    const t = tab(); t.put(record({ created: 1_000_000 - 600_001 }));
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry', reason: 'expired' });
    expect(t.order).toEqual(['replace:/play/', 'read', 'consume']);
    expect(t.records.has(key)).toBe(false); expect(t.host.location.href).toBe(origin + '/play/');
    expect(t.host.client).not.toHaveBeenCalled(); expect(t.client.finishAccountSignIn).not.toHaveBeenCalled();
  });
  it.each([-1, Infinity, -Infinity, NaN])('A08 rejects a record aged %s ms', async age => {
    const t = tab(); t.put(record({ created: 1_000_000 - age }));
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.host.client).not.toHaveBeenCalled(); expect(t.records.has(key)).toBe(false);
  });
  it('A08 rejects a nonfinite JSON date and a nonfinite clock', async () => {
    const t = tab(); t.records.set(key, `{"flow":"${flow}","target":"/play/","created":1e999}`);
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    t.host.location.href = origin + callback(); t.put(); t.host.now = () => NaN;
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.host.client).not.toHaveBeenCalled();
  });

  it('A09 exchanges two valid tab flows with their own verifier IDs', async () => {
    const a = tab('/play/'), b = tab('/play/');
    b.client.startAccountSignIn.mockResolvedValueOnce({ url: 'https://provider.test/b', flowId: otherFlow });
    await beginAccountSignIn('google', '/j#ABC234', a.host);
    await beginAccountSignIn('github', target, b.host);
    a.host.location.href = origin + callback(flow, 'code-a'); b.host.location.href = origin + callback(otherFlow, 'code-b');
    expect((await consumeSignInReturn(a.host)).status).toBe('signed-in');
    expect((await consumeSignInReturn(b.host)).status).toBe('signed-in');
    expect(a.client.finishAccountSignIn).toHaveBeenCalledExactlyOnceWith('code-a', flow);
    expect(b.client.finishAccountSignIn).toHaveBeenCalledExactlyOnceWith('code-b', otherFlow);
    expect(a.host.location.href).toBe(origin + '/j#ABC234'); expect(b.host.location.href).toBe(origin + target);
  });

  it('A09 refuses crossed and copied callbacks without a verifier fallback', async () => {
    const a = tab(callback(otherFlow)), b = tab(callback(flow)), copied = tab();
    a.put(); b.put(record({ flow: otherFlow }));
    for (const t of [a, b, copied]) {
      expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
      expect(t.host.client).not.toHaveBeenCalled(); expect(t.records.has(key)).toBe(false);
    }
  });

  it.each(['write', 'consume', 'start', 'bad-flow', 'clock', 'provider'])('A10 never leaves after %s failure', async fault => {
    const t = tab('/play/'); t.put();
    if (fault === 'write') t.host.storage.setItem = () => { throw new Error('blocked'); };
    if (fault === 'consume') t.host.storage.removeItem = () => { throw new Error('blocked'); };
    if (fault === 'start') t.client.startAccountSignIn.mockRejectedValueOnce(new Error('offline'));
    if (fault === 'bad-flow') t.client.startAccountSignIn.mockResolvedValueOnce({ url: 'https://provider.test', flowId: '' });
    if (fault === 'clock') t.host.now = () => NaN;
    await expect(beginAccountSignIn(fault === 'provider' ? 'facebook' as 'google' : 'google', target, t.host)).rejects.toThrow();
    expect(t.host.location.assign).not.toHaveBeenCalled();
    if (fault !== 'consume' && fault !== 'provider') expect(t.records.has(key)).toBe(false);
  });

  it.each(['read', 'consume', 'address'])('A10 never exchanges after %s failure and tries to consume the record', async fault => {
    const t = tab(); t.put();
    if (fault === 'read') t.host.storage.getItem = () => { throw new Error('blocked'); };
    if (fault === 'consume') t.host.storage.removeItem = vi.fn(() => { throw new Error('blocked'); });
    if (fault === 'address') t.host.history.replaceState = () => { throw new Error('blocked'); };
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.host.storage.removeItem).toHaveBeenCalledExactlyOnceWith(key);
    expect(t.host.client).not.toHaveBeenCalled();
    if (fault !== 'consume') expect(t.records.has(key)).toBe(false);
  });

  it('A10 clears the address before a blocked storage getter runs', async () => {
    const t = tab(); t.put();
    Object.defineProperty(t.host, 'storage', { get() { throw new Error('blocked'); } });
    expect(await consumeSignInReturn(t.host)).toEqual({ status: 'retry' });
    expect(t.host.location.href).toBe(origin + '/play/'); expect(t.host.client).not.toHaveBeenCalled();
  });
});
