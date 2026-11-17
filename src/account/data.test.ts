import { expect, it } from 'vitest';
import { accountData } from './data';
import { deletedAccountKey } from './local';
import { memoryStorage } from '../interface/people/fake-server';

it('checks every data read and write under the shared account lock', async () => {
  let held = false;
  const memory = memoryStorage(), storage = { ...memory,
    getItem(key: string) { expect(held).toBe(true); return memory.getItem(key); },
    setItem(key: string, value: string) { expect(held).toBe(true); memory.setItem(key, value); },
  };
  const locks = { request: async <T>(name: string, run: () => Promise<T>) => {
    expect(name).toBe('kingdown.account-command.alice'); held = true;
    try { return await run(); } finally { held = false; }
  } };
  const gate = accountData('alice', storage, locks);
  await gate.write(() => storage.setItem('draft', 'private'));
  await gate.close(() => { expect(held).toBe(true); memory.removeItem('draft'); });
  await expect(gate.write(() => storage.setItem('draft', 'late'))).rejects.toThrow('deleted');
});

it('a new sign-in opens its own generation and keeps every old writer closed', async () => {
  const storage = memoryStorage(), first = { userId: 'alice', accessToken: 'first-session' };
  await accountData('alice', storage).confirm(async () => first);
  const old = accountData('alice', storage);
  await old.close(() => {});
  await expect(accountData('alice', storage).confirm(async () => first)).rejects.toThrow('deleted');
  await accountData('alice', storage).confirm(async () => ({ ...first, accessToken: 'new-session' }));
  await expect(old.write(() => storage.setItem('draft', 'old'))).rejects.toThrow('deleted');
  await accountData('alice', storage).write(() => storage.setItem('draft', 'new'));
  expect(storage.getItem('draft')).toBe('new');
});

it('an old deletion cannot close a later generation even if the session ID returns', async () => {
  const storage = memoryStorage(), first = { userId: 'alice', accessToken: 'first-session' };
  await accountData('alice', storage).confirm(async () => first);
  const old = accountData('alice', storage); await old.write(() => {});
  await accountData('alice', storage).confirm(async () => ({ ...first, accessToken: 'new-session' }));
  await accountData('alice', storage).confirm(async () => first);
  storage.setItem('draft', 'new-private-turn');
  await expect(old.close(() => storage.removeItem('draft'), async () => first)).rejects.toThrow('deleted');
  expect(storage.getItem('draft')).toBe('new-private-turn');
  expect(JSON.parse(storage.getItem(deletedAccountKey('alice'))!).deleted).toBe(false);
});

it('requires the current JSON deletion mark format', async () => {
  const storage = memoryStorage();
  storage.setItem(deletedAccountKey('alice'), 'deleted');
  await expect(accountData('alice', storage).write(() => storage.setItem('draft', 'late'))).rejects.toThrow(SyntaxError);
  expect(storage.getItem('draft')).toBeNull();
});
