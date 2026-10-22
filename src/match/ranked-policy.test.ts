import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameService, MatchServiceError } from './service';
import type { PostgresMatchStore } from './store';
import { createSchema } from './protocol';
import { DEFAULT_OPTIONS, RANKED_OPTIONS, setupAdmission } from './setup';

describe('first ranked admission', () => {
 it('accepts only the server ranked family and the existing always-on king choices', () => {
  expect(createSchema.safeParse({ kind: 'random', mode: 'ranked' }).success).toBe(true);
  expect(createSchema.safeParse({ kind: 'random', mode: 'ranked', options: { ...RANKED_OPTIONS, pool: [...RANKED_OPTIONS.pool].reverse() } }).success).toBe(true);
  const kings = setupAdmission(RANKED_OPTIONS);
  expect(kings.arrangement).toBe(false);
  expect(kings.kings.map(king => king.power).sort()).toEqual(['HolyLight', 'Mercy', 'DeathTouch', 'Darkness', 'March'].sort());
  for (const override of [{kind:'friend'}, {kind:'solo'}, {speed:'live'}, {days_per_move:1}, {colour:'white'}, {level:'club'}, {setup:{preset:'current'}},
   {options:DEFAULT_OPTIONS}, {options:{...RANKED_OPTIONS,arrangement:true}}, {options:{...RANKED_OPTIONS,pool:RANKED_OPTIONS.pool.slice(1)}},
   {options:{...RANKED_OPTIONS,cardPool:RANKED_OPTIONS.cardPool.slice(1)}}]) {
   expect(createSchema.safeParse({ kind:'random',mode:'ranked',...override }).success, JSON.stringify(override)).toBe(false);
  }
 });
});

describe('Ranked by server stage (ticket 67)', () => {
 const actor = '11111111-1111-4111-8111-111111111111', gameId = '22222222-2222-4222-8222-222222222222';
 // The stub store has no handle, so a start that passes the stage check stops at HANDLE_NEEDED.
 const client = { query: vi.fn(async () => ({ rows: [] })) };
 const store = { pool: client, transaction: vi.fn(async (work: (c: typeof client) => unknown) => work(client)), load: vi.fn(async () => ({ id: gameId, kind: 'random', status: 'waiting', rating_policy: 'ranked-v1' })) };
 const service = new GameService(store as unknown as PostgresMatchStore);
 const RANKED_UNAVAILABLE = 'Ranked is not available. Play a Casual game.';
 const code = (work: Promise<unknown>) => work.then(() => 'ok', (error: MatchServiceError) => error.code);
 const starts = () => [service.create(actor, { kind: 'random', mode: 'ranked' }), service.find(actor, undefined, undefined, undefined, false, 'ranked'), service.find(actor, undefined, undefined, 'ranked-once', false, 'ranked')];
 afterEach(() => { vi.unstubAllEnvs(); });

 it('refuses a ranked create, find and accept in production with a stable code', async () => {
  vi.stubEnv('KINGDOWN_STAGE', '');
  for (const start of starts()) await expect(start).rejects.toMatchObject({ code: 'RANKED_UNAVAILABLE', status: 409, message: RANKED_UNAVAILABLE });
  store.transaction.mockClear();
  client.query.mockResolvedValueOnce({ rows: [{ handle: 'player' }] } as never);
  await expect(service.accept(actor, gameId, 'ranked-v1')).rejects.toMatchObject({ code: 'RANKED_UNAVAILABLE' });
 });
 it('keeps Casual open in production', async () => {
  vi.stubEnv('KINGDOWN_STAGE', '');
  expect(await code(service.find(actor, DEFAULT_OPTIONS, 'white', undefined, false, 'casual'))).toBe('HANDLE_NEEDED');
  expect(await code(service.find(actor, DEFAULT_OPTIONS, 'white'))).toBe('HANDLE_NEEDED');
 });
 it('passes Ranked to the normal start checks in staging', async () => {
  vi.stubEnv('KINGDOWN_STAGE', 'staging');
  for (const start of starts()) expect(await code(start)).toBe('HANDLE_NEEDED');
  // With a handle, an accept of a ranked seat reaches the policy check.
  client.query.mockResolvedValueOnce({ rows: [{ handle: 'player' }] } as never);
  expect(await code(service.accept(actor, gameId))).toBe('MATCH_INCOMPATIBLE');
 });
});
