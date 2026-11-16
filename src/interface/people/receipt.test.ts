import { accountData } from '../../account/data';
import { expect, it, vi } from 'vitest';
import type { Action, View } from '../../match/protocol';
import type { OnlineClient } from '../../online/client';
import { createWebTransport } from '../../online/runtime';
import { actionOf, ReceiptBusy, receiptKey, receiptOf, receiptStore } from './receipt';
import { memoryStorage } from './fake-server';

const GAME = '11111111-1111-4111-8111-111111111111';
const ACTIONS: Action[] = [
  { type: 'turn', actions: ['e2-e4'] }, { type: 'draw', choice: 'offer' }, { type: 'draw', choice: 'accept' }, { type: 'rematch', choice: 'decline' },
  { type: 'resign' }, { type: 'abort' }, { type: 'claim', reason: 'timeout' }, { type: 'computer' },
];

it('keeps the old page key and shape, so each page sends the other page receipt with the same ID', async () => {
  for (const action of ACTIONS) {
    const receipt = receiptOf(GAME, 4, action, 'fixed-id');
    expect(actionOf(receipt)).toEqual(action);
    const storage = memoryStorage();
    await receiptStore('account-a', storage).hold(receipt);
    expect([...storage.records.keys()]).toEqual([receiptKey('account-a')]);
    expect(receiptKey('account-a')).toBe('kingdown.account-command.account-a');
    // The old page reads the receipt and sends its command with the same ID and revision.
    const command = vi.fn(async () => ({ view: { game_id: GAME, revision: 5 } as View }));
    const transport = createWebTransport({ command } as unknown as OnlineClient, 'account-a', storage);
    const saved = transport.pending()!;
    expect(saved).toEqual(receipt);
    await transport.call(saved.name, saved.args, {});
    expect(command).toHaveBeenCalledExactlyOnceWith(GAME, 4, action, 'fixed-id', undefined);
    expect(storage.records.size).toBe(0);
  }
});

it('holds one receipt for each account and drops only its own', async () => {
  const storage = memoryStorage(), store = receiptStore('a', storage);
  const first = receiptOf(GAME, 1, { type: 'resign' }, 'one'), second = receiptOf(GAME, 1, { type: 'abort' }, 'two');
  await store.hold(first); await store.hold(first);
  await expect(store.hold(second)).rejects.toBeInstanceOf(ReceiptBusy);
  await receiptStore('b', storage).hold(second);
  await store.drop(second); expect(store.read()).toEqual(first);
  await store.drop(first); expect(store.read()).toBeUndefined();
  storage.setItem(receiptKey('a'), '{not json'); expect(store.read()).toBe('unreadable');
  await store.drop(); expect(store.read()).toBeUndefined();
});

it('Discard of unreadable bytes keeps a newer receipt from another tab', async () => {
  const storage = memoryStorage(), store = receiptStore('a', storage);
  storage.setItem(receiptKey('a'), '{');
  expect(store.read()).toBe('unreadable');
  const next = receiptOf(GAME, 2, { type: 'resign' }, 'new-tab');
  storage.setItem(receiptKey('a'), JSON.stringify(next));
  await store.drop();
  expect(store.read()).toEqual(next);
});

it('a Send queued before deletion cannot restore account data after cleanup and sign-out', async () => {
  const { peopleController } = await import('./controller');
  const { fixtureService } = await import('../../../tools/plugin-protocol-fixture');
  const { fakeServer } = await import('./fake-server'); const { peopleServer } = await import('./server'); const { onlineClient } = await import('../../online/client');
  const { clearDeletedAccount } = await import('../../account/local');
  const service = fixtureService();
  const memory = memoryStorage(), storage = { ...memory, key: (i: number) => [...memory.records.keys()][i] ?? null, get length() { return memory.records.size; } };
  const queued: (() => Promise<unknown>)[] = [], lockNames: string[] = [];
  const locks = { request: <T>(name: string, run: () => Promise<T>) => { lockNames.push(name); return new Promise<T>((resolve, reject) => queued.push(() => run().then(resolve, reject))); } };
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const view = await service.create('alice', { kind: 'friend', options: { ...(await import('../../match/setup')).DEFAULT_OPTIONS, arrangement: false, kingPowers: false, cards: false } }), link = await service.invite('alice', view.game_id); await service.join('bob', link.token);
    let signedIn = true;
    const api = onlineClient({ token: async () => signedIn ? 'alice' : null, fetch: fakeServer(service).fetch }); const command = vi.spyOn(api, 'command');
    const player = peopleController({ userId: 'alice', storage, server: peopleServer(api), locks }); await player.open(view.game_id);
    player.stage(player.state().draft!.at(12, 28)[0]);
    await queued.shift()!();
    const deleting = receiptStore('alice', storage, locks); await queued.shift()!();
    const clearing = deleting.clearAccount(() => clearDeletedAccount(storage, 'alice'), async () => ({ userId: 'alice', accessToken: 'alice' }));
    await vi.waitFor(() => expect(queued).toHaveLength(1));
    const sending = player.send();
    await vi.waitFor(() => expect(queued).toHaveLength(2)); expect(lockNames.every(name => name === receiptKey('alice'))).toBe(true);
    await queued.shift()!(); await clearing; signedIn = false;
    await queued.shift()!(); expect(await sending).toBe(false); expect(command).not.toHaveBeenCalled();
    // An old tab still cannot write after cleanup, or after a later sign-in cancels deletion.
    const old = receiptStore('alice', storage, locks); await queued.shift()!();
    const late = old.hold(receiptOf(view.game_id, 1, { type: 'resign' }, 'late'));
    const rejected = expect(late).rejects.toThrow('deleted'); await vi.waitFor(() => expect(queued).toHaveLength(1)); await queued.shift()!(); await rejected;
    const fresh = accountData('alice', storage, locks); await queued.shift()!();
    const opening = fresh.confirm(async () => ({ userId: 'alice', accessToken: 'new-session' })); await queued.shift()!(); await opening;
    const stale = old.hold(receiptOf(view.game_id, 1, { type: 'resign' }, 'stale')), staleRejected = expect(stale).rejects.toThrow('deleted'); await vi.waitFor(() => expect(queued).toHaveLength(1)); await queued.shift()!(); await staleRejected;
    expect(storage.getItem(receiptKey('alice'))).toBeNull(); expect(storage.getItem('kingdown.account-game.alice')).toBeNull();
    expect([...memory.records.keys()].filter(key => key.startsWith('kingdown.people-draft.alice.'))).toEqual([]);
  } finally { await service.close(); }
});
