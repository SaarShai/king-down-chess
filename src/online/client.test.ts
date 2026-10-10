/** The website client: retries keep the command ID; views follow the revision rules of report part 03, section 4.3. */
import { describe, expect, it, vi } from 'vitest';
import type { LoggedCommand, View } from '../match/protocol';
import { merge, onlineClient, OnlineError, watch, type OnlineClient } from './client';

const gameId = '33333333-3333-4333-8333-333333333333';
const log = (...seqs: number[]): LoggedCommand[] => seqs.map(seq => ({ seq, seat: 0, action: { type: 'resign' }, at: '' }));
const view = (revision: number, seqs: number[], extra: Partial<View> = {}) => ({ game_id: gameId, revision, last_commands: log(...seqs), status: 'playing', speed: 'daily', action: 'waiting', ...extra }) as View;
const json = (status: number, value: unknown) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

describe('online client', () => {
 it('sends the session token and retries a lost command with the same command ID', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>()
   .mockRejectedValueOnce(new TypeError('network'))
   .mockResolvedValueOnce(json(503, { code: 'UNAVAILABLE', message: 'busy' }))
   .mockResolvedValueOnce(json(200, { type: 'ack', command_id: 'x', revision: 3, view: view(3, [3]) }));
  const wait = vi.fn(async () => {}), api = onlineClient({ token: async () => 'jwt', fetch, wait });
  expect((await api.command(gameId, 2, { type: 'resign' })).revision).toBe(3);
  const bodies = fetch.mock.calls.map(([, init]) => JSON.parse(init!.body as string));
  expect(new Set(bodies.map(body => body.command_id)).size).toBe(1);
  expect(bodies[0]).toMatchObject({ expected_revision: 2, action: { type: 'resign' } });
  expect(fetch.mock.calls[0][0]).toBe(`/api/games/${gameId}/commands`);
  expect(new Headers(fetch.mock.calls[0][1]!.headers).get('Authorization')).toBe('Bearer jwt');
  expect(wait.mock.calls).toEqual([[500], [1000]]);
 });
 it('does not retry a refusal, stops after its tries and needs a session', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json(409, { code: 'STALE_REVISION', message: 'The game changed' }));
  const api = onlineClient({ token: async () => 'jwt', fetch, wait: async () => {} });
  await expect(api.command(gameId, 0, { type: 'resign' })).rejects.toMatchObject({ code: 'STALE_REVISION', status: 409 });
  expect(fetch).toHaveBeenCalledTimes(1);
  fetch.mockReset(); fetch.mockRejectedValue(new TypeError('offline'));
  await expect(api.command(gameId, 0, { type: 'resign' }, 'fixed')).rejects.toThrow('offline');
  expect(fetch).toHaveBeenCalledTimes(4);
  await expect(onlineClient({ token: async () => null, fetch }).games()).rejects.toBeInstanceOf(OnlineError);
  expect(fetch).toHaveBeenCalledTimes(4);
 });
 it('drops a view that is not newer, adds the new commands and keeps the rules', () => {
  const local = view(3, [2, 3], { rules: { kings: [] } as never });
  expect(merge(local, view(3, [3]))).toBe('drop');
  expect(merge(local, view(2, [2]))).toBe('drop');
  const next = merge(local, view(5, [4, 5])) as View;
  expect([next.revision, next.last_commands.map(c => c.seq), next.rules]).toEqual([5, [2, 3, 4, 5], { kings: [] }]);
  // A command reply holds the last commands, also ones the client has: no double.
  expect((merge(local, view(4, [2, 3, 4])) as View).last_commands.map(c => c.seq)).toEqual([2, 3, 4]);
  expect(merge(local, view(9, [6, 7, 8, 9]))).toBe('gap');
  expect(merge(undefined, view(9, [9]))).toEqual(view(9, [9]));
 });
 it('fills a gap of more than 50 revisions with a full read', async () => {
  const game = vi.fn<OnlineClient['game']>()
   .mockResolvedValueOnce(view(2, [1, 2], { rules: {} as never }))
   .mockResolvedValueOnce(view(80, Array.from({ length: 50 }, (_, i) => 31 + i)))
   .mockResolvedValueOnce(view(80, [71, 72, 73, 74, 75, 76, 77, 78, 79, 80], { rules: {} as never }));
  const seen: number[] = [], feed = watch({ game } as unknown as OnlineClient, gameId, next => seen.push(next.revision), { live: 10, daily: 60_000 });
  try {
   await vi.waitFor(() => expect(seen).toEqual([2]));
   await feed.refresh();
   expect(game.mock.calls).toEqual([[gameId, undefined], [gameId, 2], [gameId]]);
   expect([seen, feed.view!.last_commands[0].seq]).toEqual([[2, 80], 71]);
   feed.accept(view(80, [80])); expect(seen).toEqual([2, 80]); // a duplicate is dropped
  } finally { feed.stop(); }
 });
});
