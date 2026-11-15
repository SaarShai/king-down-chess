import { afterEach, expect, it, vi } from 'vitest';
import { authStorage } from './auth-storage';
import { memoryStorage } from '../interface/people/fake-server';

afterEach(() => vi.restoreAllMocks());

it('closes sessions and removes flow slots in one non-nested storage lock across adapters', async () => {
  const memory = memoryStorage(); let held = false;
  const store = {
    get length() { expect(held).toBe(true); return memory.length; },
    key(i: number) { expect(held).toBe(true); return memory.key(i); },
    getItem(key: string) { expect(held).toBe(true); return memory.getItem(key); },
    setItem(key: string, value: string) { expect(held).toBe(true); memory.setItem(key, value); },
    removeItem(key: string) { expect(held).toBe(true); memory.removeItem(key); },
  };
  const locks = { request: async <T>(name: string, run: () => Promise<T>) => {
    expect(name).toBe('lock:auth'); expect(held).toBe(false); held = true;
    try { return await run(); } finally { held = false; }
  } };
  const first = authStorage('auth', store, locks), other = authStorage('auth', store, locks);
  const token = (id: string) => 'fixture.' + btoa(JSON.stringify({ session_id: id })) + '.signature';
  const saved = (id: string) => JSON.stringify({ user: { id: 'alice' }, access_token: token(id) });
  await first.storage.setItem('auth', saved('first'));
  await first.storage.setItem('auth-flows-code-verifier', JSON.stringify(['flow_1234', '../not-a-flow']));
  await first.storage.setItem('auth-flow-flow_1234-code-verifier', 'secret');
  await first.storage.setItem('auth-code-verifier', 'secret');
  expect(await first.remove({ userId: 'alice', accessToken: token('first') }, () => { expect(held).toBe(true); })).toBe(token('first'));
  expect(memory.getItem('auth-flow-flow_1234-code-verifier')).toBeNull();
  expect(memory.getItem('auth-flows-code-verifier')).toBeNull();
  expect(memory.getItem('auth-code-verifier')).toBeNull();
  await other.storage.setItem('auth', saved('first'));
  expect(memory.getItem('auth')).toBeNull();
  await other.storage.setItem('auth', saved('second'));
  await other.remove({ userId: 'alice', accessToken: token('second') }, () => {});
  await first.storage.setItem('auth', saved('first'));
  expect(memory.getItem('auth')).toBeNull();
  await first.storage.setItem('auth', saved('third'));
  expect(memory.getItem('auth')).toBe(saved('third'));
});

it('prunes a closed entry after 24 hours on the next closure write', async () => {
  let now = Date.now(); vi.spyOn(Date, 'now').mockImplementation(() => now);
  const store = memoryStorage(), adapter = authStorage('auth', store);
  const close = async (id: string) => {
    await adapter.storage.setItem('auth', JSON.stringify({ user: { id: 'alice' }, access_token: id }));
    await adapter.remove({ userId: 'alice', accessToken: id }, () => {});
  };
  await close('expired');
  expect(JSON.parse(store.getItem('auth-closed-sessions')!)[0].expires).toBe(now + 24 * 60 * 60 * 1000);
  now += 24 * 60 * 60 * 1000 - 1;
  await close('live');
  expect(JSON.parse(store.getItem('auth-closed-sessions')!)).toHaveLength(2);
  now++;
  await close('next');
  expect(JSON.parse(store.getItem('auth-closed-sessions')!).map((entry: { session: string }) => entry.session)).toEqual(['live', 'next']);
});

it('live closed entries still reject writes across adapters with no count limit', async () => {
  const now = Date.now(); vi.spyOn(Date, 'now').mockReturnValue(now);
  const store = memoryStorage(), adapter = authStorage('auth', store), other = authStorage('auth', store);
  for (let i = 0; i < 1001; i++) {
    const accessToken = 'closed-' + i;
    await adapter.storage.setItem('auth', JSON.stringify({ user: { id: 'alice' }, access_token: accessToken }));
    await adapter.remove({ userId: 'alice', accessToken }, () => {});
  }
  expect(JSON.parse(store.getItem('auth-closed-sessions')!)).toHaveLength(1001);
  vi.spyOn(Date, 'now').mockReturnValue(now + 24 * 60 * 60 * 1000 - 1);
  await other.storage.setItem('auth', JSON.stringify({ user: { id: 'alice' }, access_token: 'closed-0' }));
  expect(store.getItem('auth')).toBeNull();
});
