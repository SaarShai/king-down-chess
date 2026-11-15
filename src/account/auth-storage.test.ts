import { expect, it } from 'vitest';
import { authStorage } from './auth-storage';
import { memoryStorage } from '../interface/people/fake-server';

it('closes sessions and removes flow slots in one non-nested storage lock across adapters', async () => {
  const memory = memoryStorage(); let held = false;
  const store = {
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
