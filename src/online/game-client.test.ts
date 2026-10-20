import { expect, it, vi } from 'vitest';
import type { View } from '../match/protocol';
import { GameReadError } from '../account-game/client';
import { OnlineError } from './client';
import { webGameClient } from './game-client';

it('passes signals to list and full reads and returns each complete result', async () => {
  const view = { game_id: 'full-id', revision: 3, rules: { kings: [] }, opponent: { handle: 'other' }, server_now: 'now' } as unknown as View;
  const api = { games: vi.fn(async () => []), game: vi.fn(async () => view) }, client = webGameClient(api), { signal } = new AbortController();
  expect(await client.games(signal)).toEqual([]); expect(await client.game('full-id', signal)).toBe(view);
  expect(api.games).toHaveBeenCalledExactlyOnceWith(signal);
  expect(api.game).toHaveBeenCalledExactlyOnceWith('full-id', undefined, signal);
});
it.each(['games', 'game'] as const)('keeps service codes and transport failures for %s', async method => {
  const send = vi.fn().mockRejectedValue(new OnlineError('FORBIDDEN', 403, 'Not your game'));
  const client = webGameClient({ games: send, game: send });
  const read = () => method === 'games' ? client.games() : client.game('full-id');
  await expect(read()).rejects.toEqual(new GameReadError('FORBIDDEN', 'Not your game'));
  const network = new TypeError('offline'); send.mockRejectedValue(network);
  await expect(read()).rejects.toBe(network);
});
it('aborts before send and rejects a reply after cancellation', async () => {
  const abort = new AbortController(), send = vi.fn(async () => { abort.abort(); return []; });
  const client = webGameClient({ games: send, game: vi.fn() });
  await expect(client.games(abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  await expect(client.games(abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  expect(send).toHaveBeenCalledTimes(1);
});
