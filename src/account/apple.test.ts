import { afterEach, expect, it, vi } from 'vitest';
import { appleSignInEnabled, nativeAppleToken } from './apple';
import { canWriteLocal, clearDeletedAccount, localAccess, selectLocal, KEPT_KEY, OFFERED_KEY } from './local';

afterEach(() => vi.unstubAllGlobals());
it.each([undefined, '', '0', 'true', true])('Apple sign-in stays off for %s', value => {
  expect(appleSignInEnabled({ VITE_KINGDOWN_APPLE_SIGN_IN: value })).toBe(false);
});
it('enables Apple with the one explicit release switch', () => {
  expect(appleSignInEnabled({ VITE_KINGDOWN_APPLE_SIGN_IN: '1' })).toBe(true);
});
it('hashes a fresh nonce for Apple and returns the original nonce only to the session exchange', async () => {
  let hashed = '', state = '';
  const bridge = { authorize: vi.fn(async (input: { nonce: string; state: string }) => { hashed = input.nonce; state = input.state; return { identityToken: 'fixture-token', state }; }) };
  const result = await nativeAppleToken(bridge);
  expect(result.token).toBe('fixture-token'); expect(result.nonce).toMatch(/^[a-f0-9]{64}$/);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(result.nonce))), b => b.toString(16).padStart(2, '0')).join('');
  expect(hashed).toBe(digest); expect(state).not.toBe(result.nonce);
  const next = await nativeAppleToken(bridge); expect(next.nonce).not.toBe(result.nonce);
});
it('rejects a changed state or an empty token and propagates cancel', async () => {
  await expect(nativeAppleToken({ authorize: async () => ({ identityToken: 'fixture', state: 'wrong' }) })).rejects.toThrow('Invalid Apple');
  await expect(nativeAppleToken({ authorize: async ({ state }) => ({ identityToken: '', state }) })).rejects.toThrow('Invalid Apple');
  await expect(nativeAppleToken({ authorize: async () => { throw { code: 'CANCELED' }; } })).rejects.toEqual({ code: 'CANCELED' });
});

function storage(data: Record<string, string>) {
  const map = new Map(Object.entries(data));
  return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); }, removeItem: (key: string) => { map.delete(key); }, key: (i: number) => [...map.keys()][i] ?? null, get length() { return map.size; } };
}
it('clears the deleted owner, its archived copy and drafts, but keeps other accounts', () => {
  const store = storage({ 'kingdown.sync-owner': '{"userId":"alice"}', 'kingdown.save': 'private', 'kingdown.local.alice': 'private', 'kingdown.people-draft.alice.game': 'private', 'kingdown.account-command.alice': 'private', 'kingdown.account-game.alice': 'private', 'kingdown.account-command.bob': 'keep', 'kingdown.people-draft.bob.game': 'keep', 'kingdown.local.bob': 'keep' });
  clearDeletedAccount(store, 'alice');
  expect(JSON.parse(store.getItem('kingdown.sync-owner')!).userId).toBe('anonymous'); expect(store.getItem('kingdown.save')).toBeNull(); expect(store.getItem('kingdown.people-draft.alice.game')).toBeNull();
  expect(store.getItem('kingdown.people-draft.bob.game')).toBe('keep'); expect(store.getItem('kingdown.local.bob')).toBe('keep');
  expect(store.getItem('kingdown.account-command.alice')).toBeNull(); expect(store.getItem('kingdown.account-game.alice')).toBeNull(); expect(store.getItem('kingdown.account-command.bob')).toBe('keep');
});
it('restores another account after deletion and blocks a stale tab from writing the deleted data', () => {
  const copy = JSON.stringify(['{"moves":[],"gameAt":1,"private":"bob"}', null, null]);
  const store = storage({ 'kingdown.sync-owner': '{"userId":"alice","accounts":["alice","bob"]}', 'kingdown.save': 'alice private data', 'kingdown.local.bob': copy });
  const oldTab = { ...store }; localAccess(oldTab);
  clearDeletedAccount(store, 'alice');
  expect(canWriteLocal(oldTab)).toBe(false);
  selectLocal(store, 'bob', () => {});
  expect(JSON.parse(store.getItem('kingdown.save')!).private).toBe('bob');
  expect(store.getItem('kingdown.local.bob')).toBe(copy);
  expect(store.getItem('kingdown.sync-owner')).not.toContain('alice');
});
it('keeps another owner and anonymous play when it clears a deleted account', () => {
  const store = storage({ 'kingdown.sync-owner': '{"userId":"bob","accounts":["alice","bob"]}', 'kingdown.save': 'bob', 'kingdown.local.alice': 'remove' });
  clearDeletedAccount(store, 'alice'); expect(store.getItem('kingdown.save')).toBe('bob'); expect(JSON.parse(store.getItem('kingdown.sync-owner')!).accounts).toEqual(['bob']);
  store.removeItem('kingdown.sync-owner'); clearDeletedAccount(store, 'alice'); expect(store.getItem('kingdown.save')).toBe('bob');
});

it('clears one account with another account copy and an anonymous offer on the same device', () => {
  const store = storage({ 'kingdown.sync-owner': '{"userId":"alice"}', 'kingdown.save': 'alice game',
    [KEPT_KEY]: 'bob game', [KEPT_KEY + '.owner']: 'bob',
    [OFFERED_KEY]: 'anonymous game', [OFFERED_KEY + '.owner']: 'anonymous' });
  clearDeletedAccount(store, 'alice');
  expect(store.getItem('kingdown.save')).toBeNull();
  expect(store.getItem(KEPT_KEY)).toBe('bob game'); expect(store.getItem(KEPT_KEY + '.owner')).toBe('bob');
  expect(store.getItem(OFFERED_KEY)).toBe('anonymous game'); expect(store.getItem(OFFERED_KEY + '.owner')).toBe('anonymous');
});
