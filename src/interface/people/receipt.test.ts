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
