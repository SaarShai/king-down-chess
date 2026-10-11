/** Ticket 06: real game service calls on a separate disposable database. */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameService } from './service';
import { PostgresMatchStore } from './store';
import { DEFAULT_OPTIONS, type Options } from './setup';
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
  expect(hidden.choices?.[0]).toBeNull(); expect(hidden.kings).toBeUndefined(); expect(hidden.rules).toBeUndefined();
  expect(JSON.stringify(hidden.last_commands)).not.toContain('Flame'); expect(JSON.stringify(hidden.last_commands)).not.toContain('Haste');
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
 it('offers, declines and accepts one rematch with the same features and swapped seats', async () => {
  const options = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true, kingPowers: true };
  const created = await service.create(a, { kind: 'friend', options, colour: 'black' });
  await service.join(b, (await service.invite(a, created.game_id)).token);
  const choose = async (actor: string, rev: number, king: string, power: string) => service.command(actor, created.game_id, command(rev, { type: 'choose', choice: { king: { king, power }, order: 'RNBQKBNR' }, ready: true }));
  await choose(a, 1, 'Shadow', 'Darkness'); await choose(b, 2, 'Spirit', 'Mercy');
  const ended = await service.command(a, created.game_id, command(3, { type: 'resign' }));
  await expect(service.command(b, created.game_id, command(ended.revision, { type: 'rematch', choice: 'accept' }))).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  const offer = command(4, { type: 'rematch', choice: 'offer' });
  expect(await service.command(a, created.game_id, offer)).toMatchObject({ revision: 5, rematch_offer: 1 });
  expect(await service.command(a, created.game_id, offer)).toMatchObject({ revision: 5 });
  await expect(service.command(a, created.game_id, command(5, { type: 'rematch', choice: 'accept' }))).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  expect(await service.command(b, created.game_id, command(5, { type: 'rematch', choice: 'decline' }))).toMatchObject({ revision: 6, rematch_offer: null });
  await service.command(b, created.game_id, command(6, { type: 'rematch', choice: 'offer' }));
  const accept = command(7, { type: 'rematch', choice: 'accept' });
  const views = await Promise.all([service.command(a, created.game_id, accept), service.command(a, created.game_id, accept)]);
  expect(views.map(v => v.revision)).toEqual([8, 8]);
  const row = (await admin.query('select rematch_game_id from public.games where id=$1', [created.game_id])).rows[0];
  expect(row.rematch_game_id).toEqual(expect.any(String));
  expect(views[0]).toMatchObject({ rematch_game_id: row.rematch_game_id });
  const next = await service.view(a, row.rematch_game_id);
  expect(next).toMatchObject({ status: 'setup', revision: 0, seat: 0, action: 'ready' });
  expect(await service.view(b, next.game_id)).toMatchObject({ status: 'setup', seat: 1 });
  expect((await admin.query('select options from public.games where id=$1', [next.game_id])).rows[0].options).toEqual(options);
  expect((await service.inbox(a)).filter(v => v.game_id === next.game_id)).toHaveLength(1);
  await expect(service.command(b, created.game_id, command(8, { type: 'rematch', choice: 'offer' }))).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
 }, 30_000);
 it('starts a computer rematch at once, including a game at the move limit', async () => {
  const created = await service.create(a, { kind: 'solo', options: { ...DEFAULT_OPTIONS, arrangement: false }, level: 'strong' });
  await service.command(a, created.game_id, command(0, { type: 'resign' }));
  await admin.query('update public.games set revision=1000 where id=$1', [created.game_id]);
  const sent = command(1000, { type: 'rematch', choice: 'offer' });
  const accepted = await service.command(a, created.game_id, sent);
  expect(await service.command(a, created.game_id, sent)).toEqual(expect.objectContaining({ revision: accepted.revision, rematch_game_id: accepted.rematch_game_id }));
  expect(accepted.rematch_game_id).toEqual(expect.any(String));
  expect(await service.view(a, accepted.rematch_game_id!)).toMatchObject({ status: 'playing', revision: 0, seat: 1, opponent: { computer: true } });
  expect((await admin.query('select level from public.games where id=$1', [accepted.rematch_game_id])).rows[0].level).toBe('strong');
 }, 30_000);
 it('shows setup choices safely and carries each toggle mix through the first move', async () => {
  for (const [fairy, arrangement, classic] of [[true, true, false], [true, false, false], [false, false, false], [false, false, true]]) for (const cards of [false, true]) for (const kingPowers of [false, true]) {
   const options = { ...DEFAULT_OPTIONS, fairy, arrangement, classic, cards, kingPowers };
   const created = await service.create(a, { kind: 'solo', options });
   expect(created).toMatchObject({ options, draw: expect.any(String), deal: cards ? expect.any(Array) : [], level: 'club' });
   const setup = created;
   let playing = created;
   if (created.status === 'setup') {
    expect(setup.choices![1]).toBeNull(); expect(setup.choices![0]).not.toBeNull();
    playing = await service.command(a, created.game_id, command(0, { type: 'choose', choice: setup.choices![0], ready: true }));
   }
   expect(playing).toMatchObject({ status: 'playing', ready: [true, true], kings: kingPowers ? [{ king: 'Spirit', power: 'Mercy' }, { king: 'Shadow', power: 'Darkness' }] : [null, null] });
   const full = await service.view(a, playing.game_id);
   expect(full.rules?.classicChess).toBe(classic);
   expect(full.rules?.hands[0]).toHaveLength(cards ? 4 : 0); expect(full.rules?.hands[0]).toEqual(full.rules?.hands[1]);
   const moved = await service.command(a, full.game_id, command(full.revision, { type: 'turn', actions: [full.legal.find(lan => !lan.includes('!'))!] }));
   expect(moved.revision).toBe(full.revision + 1); expect(moved.status).toBe('playing');
   expect(moved).toMatchObject({ options, deal: setup.deal, hands: [setup.deal, setup.deal] });
  }
  expect(await service.create(a, { kind: 'random', options: DEFAULT_OPTIONS })).toMatchObject({ kind: 'random', seat: 0, status: 'waiting', options: DEFAULT_OPTIONS });
 }, 60_000);
 it('keeps two legal orders, rejects a card with a spendable power, and keeps card use on one seat', async () => {
  const options: Options = { ...DEFAULT_OPTIONS, pool: ['Q', 'R', 'B', 'N'], cards: true, cardPool: ['Haste', 'Flight', 'March', 'Leap'], kingPowers: true };
  const game = await service.create(a, { kind: 'friend', options });
  await service.join(b, (await service.invite(a, game.game_id)).token);
  const choice = { king: { king: 'Spirit', power: 'Mercy' }, order: 'RNBQKBNR' };
  await expect(service.command(a, game.game_id, command(1, { type: 'choose', choice: { ...choice, king: { king: 'Flame', power: 'Haste' } }, ready: true }))).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await service.command(a, game.game_id, command(1, { type: 'choose', choice, ready: false }));
  expect((await service.view(b, game.game_id)).choices?.[0]).toBeNull();
  await service.command(a, game.game_id, command(2, { type: 'choose', choice, ready: true }));
  const started = await service.command(b, game.game_id, command(3, { type: 'choose', choice: { king: { king: 'Shadow', power: 'Darkness' }, order: 'RNBKQBNR' }, ready: true }));
  expect(started.fen.split(' ')[0]).toBe('rnbkqbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  const full = await service.view(a, game.game_id);
  expect(full.choices?.map(c => c?.order)).toEqual(['RNBQKBNR', 'RNBKQBNR']);
  expect(full.legal).toContain('e2-e4!H');
  const card = await service.command(a, game.game_id, command(4, { type: 'turn', actions: ['e2-e4!H'] }));
  const hasteBit = 1 << full.deal!.indexOf('Haste');
  expect(card.fen.split(' ')[6].split('/')).toContain(`u${hasteBit}.0`);
  expect(card.hands).toEqual(full.hands); expect(card.deal).toEqual(full.deal);
  expect(await service.command(a, game.game_id, command(5, { type: 'turn', actions: ['e4-e5'] }))).toMatchObject({ revision: 6, turn: 1 });
 }, 30_000);
 it('skips setup for a joined game with no seat choice, and lets the computer play at each level', async () => {
  const options = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
  const friend = await service.create(a, { kind: 'friend', options });
  expect(await service.join(b, (await service.invite(a, friend.game_id)).token)).toMatchObject({ status: 'playing', revision: 1, setup_deadline_at: null });
  expect(await service.command(a, friend.game_id, command(1, { type: 'turn', actions: ['e2-e4'] }))).toMatchObject({ turn: 1, revision: 2 });
  for (const level of ['beginner', 'casual', 'club', 'strong']) {
   const game = await service.create(a, { kind: 'solo', colour: 'black', options, level });
   const sent = command(0, { type: 'computer' });
   const moved = await service.command(a, game.game_id, sent);
   expect(moved).toMatchObject({ level, seat: 1, turn: 1, action: 'ready', revision: 1 });
   expect(await service.command(a, game.game_id, sent)).toMatchObject({ revision: 1, fen: moved.fen });
  }
 }, 30_000);
 it('rolls back Ready and its match if the write fails', async () => {
  const game = await service.create(a, { kind: 'solo', options: DEFAULT_OPTIONS });
  const sent = command(0, { type: 'choose', choice: game.choices![0], ready: true }), trigger = `reject_${game.game_id.replaceAll('-', '')}`;
  await admin.query(`create function public.${trigger}() returns trigger language plpgsql as $$ begin raise exception 'test update failure'; end $$; create trigger ${trigger} before update on public.games for each row when (old.id='${game.game_id}'::uuid) execute function public.${trigger}()`);
  try { await expect(service.command(a, game.game_id, sent)).rejects.toThrow('test update failure'); }
  finally { await admin.query(`drop trigger ${trigger} on public.games; drop function public.${trigger}()`); }
  expect(await service.view(a, game.game_id)).toMatchObject({ status: 'setup', revision: 0, ready: [false, true] });
  expect((await admin.query('select state,snapshot from public.games where id=$1', [game.game_id])).rows[0]).toEqual({ state: null, snapshot: null });
  expect(await service.command(a, game.game_id, sent)).toMatchObject({ status: 'playing', revision: 1 });
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
