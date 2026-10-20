/** The website client: retries keep the command ID; views follow the revision rules of report part 03, section 4.3. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LoggedCommand, View } from '../match/protocol';
import { merge, onlineClient, OnlineError, watch, type OnlineClient } from './client';

afterEach(() => vi.unstubAllGlobals());

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
 it('keeps the separate notice cursor intact in the private profile read', async () => {
  const page = { notices: [{ id: '9007199254740993', created_at: '2026-10-20T12:00:00Z', kind: 'appeal', action_id: 7, status: 'upheld', text: 'A reason.' }], next_notices_before: null };
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(json(200,page)), api = onlineClient({token:async()=>'jwt',fetch});
  expect(await api.record({notices_before:'9007199254740993'})).toEqual(page);
  expect(fetch.mock.calls[0][0]).toBe('/api/me/record?notices_before=9007199254740993');
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
 it('guards reads, writes and every retry after the token work, even with an injected fetch', async () => {
  const order: string[] = [], ids: string[] = [];
  const controller = Object.assign(new EventTarget(), { state: 'activated', postMessage: vi.fn((request, ports) => {
   order.push('proof'); ids.push(request.requestId);
   ports[0].postMessage({ ...request, policy: 'public-build-v1', version: 'test' });
  }) });
  const workers = Object.assign(new EventTarget(), { controller, register: async () => ({}) });
  vi.stubGlobal('window', {}); vi.stubGlobal('navigator', { serviceWorker: workers });
  const fetch = vi.fn<typeof globalThis.fetch>(async () => { order.push('send'); return json(200, []); });
  const api = onlineClient({ token: async () => { await Promise.resolve(); order.push('token'); return 'jwt'; }, fetch, wait: async () => {} });
  await api.games(); await api.updateProfile({}); await api.seen(gameId);
  fetch.mockImplementationOnce(async () => { order.push('send'); throw new TypeError('lost'); });
  await api.command(gameId, 0, { type: 'resign' }, 'fixed');
  expect(order).toEqual(Array.from({ length: 5 }, () => ['token', 'proof', 'send']).flat());
  expect(new Set(ids).size).toBe(5);
  expect(fetch.mock.calls.slice(3).map(([, init]) => JSON.parse(init!.body as string).command_id)).toEqual(['fixed', 'fixed']);
 });
 it('returns a clear unavailable error without a private send when proof fails', async () => {
  const controller = Object.assign(new EventTarget(), { state: 'activated', postMessage: (request: object, ports: MessagePort[]) => ports[0].postMessage({ ...request, policy: 'old', version: 'old' }) });
  vi.stubGlobal('window', {}); vi.stubGlobal('navigator', { serviceWorker: Object.assign(new EventTarget(), { controller, register: async () => ({}) }) });
  const fetch = vi.fn();
  await expect(onlineClient({ token: async () => 'jwt', fetch }).games()).rejects.toMatchObject({ code: 'UNAVAILABLE', status: 503 });
  await expect(onlineClient({ token: async () => 'jwt', fetch }).seen(gameId)).rejects.toMatchObject({ code: 'UNAVAILABLE', status: 503 });
  expect(fetch).not.toHaveBeenCalled();
 });
 it('sends explicit activity as an encoded POST with no body and accepts 204', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(null, { status: 204 }));
  await expect(onlineClient({ token: async () => 'jwt', fetch }).seen('game/id')).resolves.toBeUndefined();
  expect(fetch).toHaveBeenCalledExactlyOnceWith('/api/games/game%2Fid/seen', { method: 'POST', cache: 'no-store', headers: { Authorization: 'Bearer jwt' } });
 });
 it('uses only GET for full reads, since reads and polling', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => json(200, view(2, [1, 2]))), api = onlineClient({ token: async () => 'jwt', fetch });
  await api.game(gameId); await api.game(gameId, 0);
  const feed = watch(api, gameId, () => {}, { daily: 60_000 });
  try {
   await feed.refresh(); await feed.refresh();
   expect(fetch.mock.calls.map(([url, init]) => [url, init?.method])).toEqual([
    [`/api/games/${gameId}`, 'GET'], [`/api/games/${gameId}?since=0`, 'GET'], [`/api/games/${gameId}`, 'GET'], [`/api/games/${gameId}?since=2`, 'GET'],
   ]);
  } finally { feed.stop(); }
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

it('passes each read signal to the protected fetch', async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => json(200, [])), { signal } = new AbortController();
  const api = onlineClient({ token: async () => 'jwt', fetch });
  await api.games(signal); await api.game(gameId, undefined, signal); await api.game(gameId, 2, signal);
  expect(fetch.mock.calls.map(([path, init]) => [path, init!.signal, init!.cache])).toEqual([
    ['/api/me/games', signal, 'no-store'], [`/api/games/${gameId}`, signal, 'no-store'], [`/api/games/${gameId}?since=2`, signal, 'no-store'],
  ]);
});
it.each([['games', 'token'], ['games', 'policy'], ['game', 'token'], ['game', 'policy']] as const)('does not send an obsolete %s read after the %s wait', async (method, phase) => {
  const abort = new AbortController(), fetch = vi.fn();
  const controller = Object.assign(new EventTarget(), { state: 'activated', postMessage: vi.fn((request: object, ports: MessagePort[]) => {
    abort.abort(); ports[0].postMessage({ ...request, policy: 'public-build-v1', version: 'test' });
  }) });
  const register = vi.fn(async () => ({}));
  vi.stubGlobal('window', {}); vi.stubGlobal('navigator', { serviceWorker: Object.assign(new EventTarget(), { controller, register }) });
  const api = onlineClient({ token: async () => { if (phase === 'token') abort.abort(); return 'jwt'; }, fetch });
  await expect(method === 'games' ? api.games(abort.signal) : api.game(gameId, undefined, abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  expect(fetch).not.toHaveBeenCalled();
  if (phase === 'token') { expect(register).not.toHaveBeenCalled(); expect(controller.postMessage).not.toHaveBeenCalled(); }
  else { expect(register).toHaveBeenCalledTimes(1); expect(controller.postMessage).toHaveBeenCalledTimes(1); }
});

it.each(['list', 'full', 'since'] as const)('rejects a %s read cancelled while its body arrives', async kind => {
  const abort = new AbortController(), response = json(200, kind === 'list' ? [] : view(2, [2]));
  let reading!: () => void, reject!: (reason: unknown) => void;
  const started = new Promise<void>(resolve => { reading = resolve; });
  vi.spyOn(response, 'json').mockImplementation(() => { reading(); return new Promise((_resolve, fail) => { reject = fail; }); });
  const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response), api = onlineClient({ token: async () => 'jwt', fetch });
  const result = kind === 'list' ? api.games(abort.signal) : api.game(gameId, kind === 'since' ? 1 : undefined, abort.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: 'AbortError' });
  await started; abort.abort(); reject(abort.signal.reason);
  await rejected; expect(fetch).toHaveBeenCalledTimes(1);
});
