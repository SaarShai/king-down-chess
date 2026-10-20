import { expect, it, vi } from 'vitest';
import { createWebTransport } from './runtime';
import { OnlineError, type OnlineClient } from './client';
import type { View } from '../match/protocol';

function storage() {
  const records = new Map<string, string>();
  return { records, getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value); }, removeItem: (key: string) => { records.delete(key); } };
}
const args = { game_id: '11111111-1111-4111-8111-111111111111', command_id: 'fixed', expected_revision: 5, actions: ['Ra1-a4!H', 'Ra4-e4'] };
const view = { game_id: args.game_id, revision: 6 } as View;

it('persists the full command before sending, then retries the exact input after a lost reply and reload', async () => {
  const saved = storage();
  const command = vi.fn(async () => {
    expect(JSON.parse([...saved.records.values()][0])).toEqual({ name: 'kingdown_move', args });
    throw new TypeError('Lost reply');
  });
  const api = { command } as unknown as OnlineClient;
  await expect(createWebTransport(api, 'account-a', saved).call('kingdown_move', args, {})).rejects.toThrow('Lost reply');
  const reloaded = createWebTransport(api, 'account-a', saved);
  expect(reloaded.pending()).toEqual({ name: 'kingdown_move', args });
  command.mockImplementationOnce(async () => ({ view }) as never);
  expect((await reloaded.call(reloaded.pending()!.name, reloaded.pending()!.args, {}))._meta?.view).toEqual(view);
  expect(command.mock.calls).toEqual(Array.from({ length: 2 }, () => [args.game_id, 5, { type: 'turn', actions: args.actions }, 'fixed']));
  expect(saved.records.size).toBe(0);
});

it('keeps receipts in their account and refuses another payload until the uncertain command settles', async () => {
  const saved = storage(), command = vi.fn(async () => { throw new TypeError('offline'); });
  const first = createWebTransport({ command } as unknown as OnlineClient, 'account-a', saved);
  await expect(first.call('kingdown_move', args, {})).rejects.toThrow('offline');
  expect(createWebTransport({} as OnlineClient, 'account-b', saved).pending()).toBeUndefined();
  await expect(first.call('kingdown_move', { ...args, actions: ['other'] }, {})).rejects.toThrow('Retry the saved command');
  expect(command).toHaveBeenCalledTimes(1);
});

it('does not send when durable storage fails and clears only a definitive refusal', async () => {
  const command = vi.fn(async () => { throw new OnlineError('STALE_REVISION', 409, 'The game changed'); });
  const saved = storage(), api = { command } as unknown as OnlineClient;
  await expect(createWebTransport(api, 'a', { ...saved, setItem: () => { throw new Error('Storage full'); } }).call('kingdown_move', args, {})).rejects.toThrow('Storage full');
  expect(command).not.toHaveBeenCalled();
  const reply = await createWebTransport(api, 'a', saved).call('kingdown_move', args, {});
  expect(reply).toMatchObject({ isError: true, _meta: { code: 'STALE_REVISION' } });
  expect(saved.records.size).toBe(0);
});

it('uses one stable creation ID and keeps the HTTP game selection local to this page', async () => {
  const saved = storage(), create = vi.fn(async () => ({ view }));
  const client = createWebTransport({ create } as unknown as OnlineClient, 'a', saved);
  const reply = await client.call('kingdown_create', { kind: 'friend', options: {}, command_id: 'creation', board_id: 'old-board' }, {});
  expect(create).toHaveBeenCalledExactlyOnceWith({ kind: 'friend', options: {} }, 'creation');
  expect(reply).toMatchObject({ _meta: { view, board_id: view.game_id } });
  expect(saved.records.size).toBe(0);
});
