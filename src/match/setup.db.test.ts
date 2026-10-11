/** Ticket 06: real game service calls on a separate disposable database. */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameService } from './service';
import { PostgresMatchStore } from './store';
import { DEFAULT_OPTIONS } from './setup';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
const command = (expected_revision: number, action: object, command_id = randomUUID()) => ({ command_id, expected_revision, action });
suite('game setup through PostgreSQL', () => {
 let admin: pg.Pool, runtime: pg.Pool, service: GameService, own: URL, role: string;
 const users: string[] = [];
 let a: string, b: string;
 beforeAll(async () => {
  own = await ownTestDatabase('setup');
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  role = `setup_${randomUUID().replaceAll('-', '')}`;
  const password = randomUUID(), grants = await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8');
  await withRoleLock(own.href, () => admin.query(`${grants.replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`));
  const login = new URL(own.href); login.username = role; login.password = password;
  runtime = new pg.Pool({ connectionString: login.href, max: 2 }); service = new GameService(new PostgresMatchStore(runtime));
  a = randomUUID(); b = randomUUID(); users.push(a, b);
  for (const id of users) await admin.query('insert into auth.users(id) values($1)', [id]);
 }, 120_000);
 afterAll(async () => {
  if (!admin) return;
  await admin.query('delete from public.games where created_by=any($1)', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await runtime?.end();
  await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`));
  await admin.end();
 });
 it('joins setup and locks each ready choice without exposing it to the other seat', async () => {
  const created = await service.create(a, { kind: 'friend', options: { ...DEFAULT_OPTIONS, kingPowers: true } });
  const invite = await service.invite(a, created.game_id), joined = await service.join(b, invite.token);
  expect(joined).toMatchObject({ status: 'setup', revision: 1, action: 'ready', legal: [] });
  expect(await service.join(b, invite.token)).toMatchObject({ status: 'setup', revision: 1 });
  const army = (await admin.query('select draw from public.games where id=$1', [created.game_id])).rows[0].draw;
  const choice = { king: { king: 'Flame', power: 'Haste' }, order: army };
  const sent = command(1, { type: 'choose', choice, ready: true });
  expect(await service.command(a, created.game_id, sent)).toMatchObject({ status: 'setup', revision: 2, action: 'waiting' });
  const hidden = await service.view(b, created.game_id, 1);
  expect(JSON.stringify(hidden)).not.toContain('Flame'); expect(JSON.stringify(hidden)).not.toContain('Haste');
  expect(hidden.last_commands.at(-1)?.action).toEqual({ type: 'hidden' });
  expect(await service.command(a, created.game_id, sent)).toMatchObject({ revision: 2 });
  await expect(service.command(a, created.game_id, command(2, { type: 'choose', choice, ready: false }))).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  await expect(service.command(b, created.game_id, command(2, { type: 'turn', actions: ['e7-e5'] }))).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  await expect(service.command(b, created.game_id, command(2, { type: 'choose', choice: { ...choice, order: 'KKKKKKKK' }, ready: true }))).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  const ready = command(2, { type: 'choose', choice: { king: { king: 'Shadow', power: 'Darkness' }, order: army }, ready: true });
  const views = await Promise.all([service.command(b, created.game_id, ready), service.command(b, created.game_id, ready)]);
  expect(views.map(v => [v.status, v.revision])).toEqual([['playing', 3], ['playing', 3]]);
  const white = await service.view(a, created.game_id);
  expect(white.rules?.kings).toEqual([choice.king, { king: 'Shadow', power: 'Darkness' }]);
  expect(white.legal.length).toBeGreaterThan(0);
  expect(await service.command(a, created.game_id, command(3, { type: 'turn', actions: [white.legal[0]] }))).toMatchObject({ revision: 4 });
  expect((await admin.query('select count(*)::int as n from public.game_commands where game_id=$1', [created.game_id])).rows[0].n).toBe(4);
 }, 30_000);
 it('ends late setup once with no result and refuses a late Ready command', async () => {
  const create = async () => {
   const game = await service.create(a, { kind: 'friend', speed: 'live', options: DEFAULT_OPTIONS });
   await service.join(b, (await service.invite(a, game.game_id)).token);
   return game.game_id;
  };
  const swept = await create(), before = await service.view(a, swept);
  const late = new Date(Date.now() + 3 * 86_400_000 + 1000);
  const totals = await Promise.all([service.sweep(late), service.sweep(late)]);
  expect(totals.reduce((n, value) => n + value, 0)).toBeGreaterThan(0);
  expect(await service.view(a, swept)).toMatchObject({ status: 'aborted', revision: 2, result: { winner: null, reason: 'no_start' } });
  expect(before.result).toBeUndefined();
  expect((await admin.query("select count(*)::int as n from public.outbox where kind='game_finished' and payload->>'game_id'=$1", [swept])).rows[0].n).toBe(1);
  const lazy = await create(), row = (await admin.query('select draw from public.games where id=$1', [lazy])).rows[0];
  await admin.query("update public.games set setup_deadline_at=now()-interval '1 minute' where id=$1", [lazy]);
  await expect(service.command(a, lazy, command(1, { type: 'choose', choice: { king: null, order: row.draw }, ready: true }))).rejects.toMatchObject({ code: 'MATCH_TERMINAL' });
  expect(await service.view(b, lazy)).toMatchObject({ status: 'aborted', revision: 2, result: { winner: null, reason: 'no_start' } });
  expect(await service.sweep()).toBe(0);
 }, 30_000);
 it('stores validated options and waits for the player without an engine match', async () => {
  const created = await service.create(a, { kind: 'solo', options: DEFAULT_OPTIONS, level: 'beginner' });
  expect(created).toMatchObject({ status: 'setup', seat: 0, action: 'ready', legal: [] });
  const row = (await admin.query('select options,draw,deal,level,state,snapshot,started_at from public.games where id=$1', [created.game_id])).rows[0];
  expect(row).toMatchObject({ options: DEFAULT_OPTIONS, deal: [], level: 'beginner', state: null, snapshot: null, started_at: null });
  expect(row.draw).toHaveLength(8);
  expect((await admin.query('select seat,choice,ready from public.game_players where game_id=$1 order by seat', [created.game_id])).rows).toEqual([
   { seat: 0, choice: { king: null, order: row.draw }, ready: false }, { seat: 1, choice: expect.objectContaining({ king: null }), ready: true },
  ]);
  await expect(service.create(a, { kind: 'solo', options: { ...DEFAULT_OPTIONS, pool: ['G'] } })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await expect(service.create(a, { kind: 'solo', options: DEFAULT_OPTIONS, setup: { backRank: 'RNBQKBNR' } })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  const classic = await service.create(a, { kind: 'solo', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true, cards: true } });
  expect(classic).toMatchObject({ status: 'playing', seat: 0, action: 'ready', rules: { classicChess: true } });
  expect(classic.rules?.hands[0]).toHaveLength(4);
  expect(classic.rules?.hands[0]).toEqual(classic.rules?.hands[1]);
 }, 30_000);
 it('adds repeatable setup columns and grants without changing a saved game', async () => {
  const game = await service.create(a, { kind: 'solo', colour: 'white' });
  const migration = await readFile(new URL('../../supabase/migrations/0010_game_setup.sql', import.meta.url), 'utf8');
  await admin.query(migration); await admin.query(migration);
  expect((await runtime.query('select options,draw,deal,level,setup_deadline_at,rematch_offer,rematch_game_id from public.games where id=$1', [game.game_id])).rows[0])
   .toEqual({ options: null, draw: null, deal: null, level: 'club', setup_deadline_at: null, rematch_offer: null, rematch_game_id: null });
  expect((await runtime.query('select choice,ready from public.game_players where game_id=$1 order by seat', [game.game_id])).rows).toEqual([{ choice: null, ready: false }, { choice: null, ready: false }]);
  expect(await service.command(a, game.game_id, command(0, { type: 'turn', actions: [game.legal[0]] }))).toMatchObject({ status: 'playing', revision: 1, turn: 1 });
 }, 30_000);
});
