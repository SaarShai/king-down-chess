/** Ticket 06: real game service calls on a separate disposable database. */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GameService } from './service';
import * as matchModule from './index';
import * as setupModule from './setup';
import { createMatch, createPinnedMatch, loadMatch, type LocalMatch } from './index';
import { runDeletions } from '../online/jobs';
import { PostgresMatchStore } from './store';
import { DEFAULT_OPTIONS, type Choice, type Options } from './setup';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
const command = (expected_revision: number, action: object, command_id = randomUUID()) => ({ command_id, expected_revision, action });
const expectHidden = (reply: unknown, choice: Choice) => {
 const text = JSON.stringify(reply, (key, value) => key === 'setup_admission' ? undefined : value);
 for (const secret of [choice.king!.king, choice.king!.power, choice.order, choice.order.toLowerCase()]) expect(text).not.toContain(secret);
};
suite('game setup through PostgreSQL', () => {
 let admin: pg.Pool, runtime: pg.Pool, service: GameService, own: URL, role: string;
 const users: string[] = [];
 let a: string, b: string;
 beforeAll(async () => {
  own = await ownTestDatabase('setup');
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  await admin.query('delete from public.account_deletions where user_id is null');
  role = `setup_${randomUUID().replaceAll('-', '')}`;
  const password = randomUUID(), grants = await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8');
  await withRoleLock(own.href, () => admin.query(`${grants.replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`));
  const login = new URL(own.href); login.username = role; login.password = password;
  runtime = new pg.Pool({ connectionString: login.href, max: 2 }); service = new GameService(new PostgresMatchStore(runtime));
  a = randomUUID(); b = randomUUID(); users.push(a, b);
  for (const id of users) {
   await admin.query('insert into auth.users(id) values($1)', [id]);
   await admin.query('update public.profiles set handle=$2 where id=$1', [id, `setup-${id.slice(0, 8)}`]);
  }
 }, 120_000);
 afterAll(async () => {
  if (!admin) return;
  await admin.query('delete from public.games g where created_by=any($1) or exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))', [users]);
  await admin.query('delete from public.account_deletions where user_id=any($1)', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await runtime?.end();
  await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`));
  await admin.end();
 });
 it('joins setup and locks each ready choice without exposing it to the other seat', async () => {
  const options: Options = { ...DEFAULT_OPTIONS, kingPowers: true, cardPool: ['Flight', 'March', 'Leap', 'Salvation'] };
  const created = await service.create(a, { kind: 'friend', options });
  const invite = await service.invite(a, created.game_id), joined = await service.join(b, invite.token);
  expect(joined).toMatchObject({ status: 'setup', revision: 1, action: 'ready', legal: [] });
  expect(await service.join(b, invite.token)).toMatchObject({ status: 'setup', revision: 1 });
  const army = (await admin.query('select draw from public.games where id=$1', [created.game_id])).rows[0].draw;
  const choice: Choice = { king: { king: 'Flame', power: 'Haste' }, order: [...army].reverse().join('') };
  expect(choice.order).not.toBe(army);
  const sent = command(1, { type: 'choose', choice, ready: true });
  expect(await service.command(a, created.game_id, sent)).toMatchObject({ status: 'setup', revision: 2, action: 'waiting' });
  const hidden = await service.view(b, created.game_id, 1);
  expect(hidden.choices?.[0]).toBeNull(); expect(hidden.kings).toBeUndefined(); expect(hidden.rules).toBeUndefined();
  for (const reply of [hidden, await service.view(b, created.game_id), await service.inbox(b), await service.join(b, invite.token)]) expectHidden(reply, choice);
  expect(hidden.last_commands.at(-1)?.action).toEqual({ type: 'hidden' });
  expect(await service.command(a, created.game_id, sent)).toMatchObject({ revision: 2 });
  await expect(service.command(a, created.game_id, command(2, { type: 'choose', choice, ready: false }))).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  for (const [action, code] of [
   [{ type: 'turn', actions: ['e7-e5'] }, 'NOT_ALLOWED'],
   [{ type: 'choose', choice: { king: { king: 'Shadow', power: 'Darkness' }, order: 'KKKKKKKK' }, ready: true }, 'INVALID_INPUT'],
  ] as const) {
   const error = await service.command(b, created.game_id, command(2, action)).catch(error => ({ ...error, message: error.message }));
   expect(error).toMatchObject({ code }); expectHidden(error, choice);
  }
  const ready = command(2, { type: 'choose', choice: { king: { king: 'Shadow', power: 'Darkness' }, order: army }, ready: true });
  const views = await Promise.all([service.command(b, created.game_id, ready), service.command(b, created.game_id, ready)]);
  expect(views.map(v => [v.status, v.revision])).toEqual([['playing', 3], ['playing', 3]]);
  const white = await service.view(a, created.game_id);
  expect(white.rules?.kings).toEqual([choice.king, { king: 'Shadow', power: 'Darkness' }]);
  expect(white.legal.length).toBeGreaterThan(0);
  expect(await service.command(a, created.game_id, command(3, { type: 'turn', actions: [white.legal[0]] }))).toMatchObject({ revision: 4 });
  expect((await admin.query('select count(*)::int as n from public.game_commands where game_id=$1', [created.game_id])).rows[0].n).toBe(4);
  const aborted = await service.create(a, { kind: 'friend', options });
  await service.join(b, (await service.invite(a, aborted.game_id)).token);
  const draft = (await service.view(b, aborted.game_id)).choices![1]!;
  const privateChoice = { ...choice, order: [...draft.order].reverse().join('') };
  expect(privateChoice.order).not.toBe(draft.order);
  await service.command(b, aborted.game_id, command(1, { type: 'choose', choice: privateChoice, ready: true }));
  const ended = await service.command(a, aborted.game_id, command(2, { type: 'abort' }));
  expect(ended).toMatchObject({ status: 'aborted', ready: [false, true] });
  for (const reply of [ended, await service.view(a, aborted.game_id), await service.view(a, aborted.game_id, 1), await service.inbox(a)]) expectHidden(reply, privateChoice);
  const error = await service.command(a, aborted.game_id, command(3, { type: 'choose', choice: draft, ready: true })).catch(error => ({ ...error, message: error.message }));
  expect(error).toMatchObject({ code: 'MATCH_TERMINAL' }); expectHidden(error, privateChoice);
 }, 30_000);
 it('refuses a computer level without game options', async () => {
  await expect(service.create(a, { kind: 'solo', level: 'strong' })).rejects.toMatchObject({ code: 'INVALID_INPUT', status: 400 });
 });
 it('stops unready choices at revision 100 so setup keeps the revisions of play; Ready still starts the game (server audit F5)', async () => {
  const created = await service.create(a, { kind: 'friend', options: { ...DEFAULT_OPTIONS, kingPowers: true } });
  await service.join(b, (await service.invite(a, created.game_id)).token);
  const host = (await service.view(a, created.game_id)).choices![0]!, guest = (await service.view(b, created.game_id)).choices![1]!;
  await service.command(a, created.game_id, command(1, { type: 'choose', choice: host, ready: true }));
  await admin.query('update public.games set revision=99 where id=$1', [created.game_id]);
  expect(await service.command(b, created.game_id, command(99, { type: 'choose', choice: guest, ready: false }))).toMatchObject({ status: 'setup', revision: 100 });
  await expect(service.command(b, created.game_id, command(100, { type: 'choose', choice: guest, ready: false }))).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  expect(await service.command(b, created.game_id, command(100, { type: 'choose', choice: guest, ready: true }))).toMatchObject({ status: 'playing', revision: 101 });
 }, 30_000);
 it('ends late setup once with no result and refuses a late Ready command', async () => {
  const create = async () => {
   const game = await service.create(a, { kind: 'friend', options: DEFAULT_OPTIONS });
   await service.join(b, (await service.invite(a, game.game_id)).token);
   return game.game_id;
  };
  const swept = await create(), before = await service.view(a, swept);
  await admin.query('insert into public.player_ratings(user_id,rating) values($1,1620),($2,1380) on conflict(user_id) do update set rating=excluded.rating', [a, b]);
  const ratings = (await admin.query('select user_id,rating,rd,volatility,last_game_at from public.player_ratings where user_id=any($1) order by user_id', [[a, b]])).rows;
  const joined = (await admin.query("select received_at from public.game_commands where game_id=$1 and kind='join'", [swept])).rows[0].received_at;
  const deadline = new Date(joined.getTime() + 3 * 86_400_000);
  await service.sweep(new Date(deadline.getTime() - 1));
  expect(await service.view(a, swept)).toMatchObject({ status: 'setup', revision: 1, setup_deadline_at: deadline.toISOString() });
  const totals = await Promise.all([service.sweep(deadline), service.sweep(deadline)]);
  expect(totals.reduce((n, value) => n + value, 0)).toBeGreaterThan(0);
  expect(await service.view(a, swept)).toMatchObject({ status: 'aborted', revision: 2, result: { winner: null, reason: 'no_start' } });
  expect(before.result).toBeUndefined();
  expect((await admin.query("select count(*)::int as n from public.outbox where kind='game_finished' and payload->>'game_id'=$1", [swept])).rows[0].n).toBe(0);
  expect((await admin.query('select user_id,rating,rd,volatility,last_game_at from public.player_ratings where user_id=any($1) order by user_id', [[a, b]])).rows).toEqual(ratings);
  expect((await admin.query('select count(*)::int as n from public.rating_history where game_id=$1', [swept])).rows[0].n).toBe(0);
  const lazy = await create(), row = (await admin.query('select draw from public.games where id=$1', [lazy])).rows[0];
  await admin.query("update public.games set setup_deadline_at=now()-interval '1 minute' where id=$1", [lazy]);
  await expect(service.command(a, lazy, command(1, { type: 'choose', choice: { king: null, order: row.draw }, ready: true }))).rejects.toMatchObject({ code: 'MATCH_TERMINAL' });
  expect(await service.view(b, lazy)).toMatchObject({ status: 'aborted', revision: 2, result: { winner: null, reason: 'no_start' } });
  expect((await admin.query('select user_id,rating,rd,volatility,last_game_at from public.player_ratings where user_id=any($1) order by user_id', [[a, b]])).rows).toEqual(ratings);
  expect((await admin.query('select count(*)::int as n from public.rating_history where game_id=$1', [lazy])).rows[0].n).toBe(0);
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
  const decline = command(5, { type: 'rematch', choice: 'decline' });
  expect(await service.command(b, created.game_id, decline)).toMatchObject({ revision: 6, rematch_offer: null });
  await service.command(b, created.game_id, command(6, { type: 'rematch', choice: 'offer' }));
  const declined = await service.command(b, created.game_id, decline);
  expect(declined).toMatchObject({ revision: 7, rematch_offer: 0 });
  expect(declined.last_commands.filter(entry => entry.action.type === 'rematch' && entry.action.choice === 'decline')).toHaveLength(1);
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
 it('keeps the first-turn deadline of a Daily human rematch with no seat choice', async () => {
  for (const options of [{ ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true }, undefined]) {
   const game = await service.create(a, options ? { kind: 'friend', options } : { kind: 'solo' });
   if (!options) {
    await admin.query("update public.games set kind='friend',status='waiting',speed='daily',days_per_move=3,started_at=null where id=$1", [game.game_id]);
    await admin.query("update public.game_players set computer=false,action='waiting' where game_id=$1", [game.game_id]);
   }
   await service.join(b, (await service.invite(a, game.game_id)).token);
   await service.command(a, game.game_id, command(1, { type: 'resign' }));
   await service.command(a, game.game_id, command(2, { type: 'rematch', choice: 'offer' }));
   const accepted = await service.command(b, game.game_id, command(3, { type: 'rematch', choice: 'accept' }));
   const next = await service.view(b, accepted.rematch_game_id!);
   const started = (await admin.query('select started_at from public.games where id=$1', [next.game_id])).rows[0].started_at;
   const deadline = new Date(started.getTime() + 3 * 86_400_000);
   expect(next).toMatchObject({ status: 'playing', revision: 0, seat: 0, deadline_at: deadline.toISOString() });
   await service.sweep(new Date(deadline.getTime() - 1));
   expect(await service.view(b, next.game_id)).toMatchObject({ status: 'playing', revision: 0 });
   await service.sweep(deadline);
   expect(await service.view(b, next.game_id)).toMatchObject({ status: 'aborted', revision: 1, result: { winner: null, reason: 'no_start' } });
   expect(await service.sweep(deadline)).toBe(0);
  }
 }, 30_000);
 it.each(['white', 'black'] as const)('keeps the player %s in a computer rematch at the move limit', async colour => {
  const seat = colour === 'white' ? 0 : 1, readySeats = seat === 0 ? [false, true] : [true, false];
  const created = await service.create(a, { kind: 'solo', colour, options: { ...DEFAULT_OPTIONS, kingPowers: true }, level: 'strong' });
  expect(created).toMatchObject({ status: 'setup', options: { arrangement: true, kingPowers: true }, ready: readySeats });
  const playing = await service.command(a, created.game_id, command(0, { type: 'choose', choice: created.choices![seat], ready: true }));
  expect(playing).toMatchObject({ status: 'playing', revision: 1, ready: [true, true] });
  await service.command(a, created.game_id, command(1, { type: 'resign' }));
  await admin.query('update public.games set revision=1000 where id=$1', [created.game_id]);
  const sent = command(1000, { type: 'rematch', choice: 'offer' });
  const accepted = await service.command(a, created.game_id, sent);
  expect(await service.command(a, created.game_id, sent)).toEqual(expect.objectContaining({ revision: accepted.revision, rematch_game_id: accepted.rematch_game_id }));
  expect(accepted.rematch_game_id).toEqual(expect.any(String));
  const next = await service.view(a, accepted.rematch_game_id!);
  expect(next).toMatchObject({ status: 'setup', revision: 0, seat, opponent: { computer: true }, ready: readySeats, options: created.options });
  expect(next.fen).toBe('');
  const ready = await service.command(a, next.game_id, command(0, { type: 'choose', choice: next.choices![seat], ready: true }));
  expect(ready).toMatchObject({ status: 'playing', ready: [true, true] });
  expect((await admin.query('select level from public.games where id=$1', [accepted.rematch_game_id])).rows[0].level).toBe('strong');
  const first = seat === 1 ? await service.command(a, next.game_id, command(1, { type: 'computer' })) : ready;
  expect(first).toMatchObject({ status: 'playing', turn: seat, action: 'ready' });
  const moved = await service.command(a, next.game_id, command(first.revision, { type: 'turn', actions: [first.legal[0]] }));
  expect(moved).toMatchObject({ status: 'playing', turn: 1-seat });
  expect(moved.fen).not.toBe(ready.fen);
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
  const draft = command(1, { type: 'choose', choice: { ...choice, order: 'RNBKQBNR' }, ready: false });
  await service.command(a, game.game_id, draft);
  expect((await service.view(b, game.game_id)).choices?.[0]).toBeNull();
  await service.command(a, game.game_id, command(2, { type: 'choose', choice, ready: true }));
  expect(await service.command(a, game.game_id, draft)).toMatchObject({ revision: 3, ready: [true, false], choices: [choice, null] });
  const started = await service.command(b, game.game_id, command(3, { type: 'choose', choice: { king: { king: 'Shadow', power: 'Darkness' }, order: 'RNBKQBNR' }, ready: true }));
  expect(started.fen.split(' ')[0]).toBe('rnbkqbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR');
  const full = await service.view(a, game.game_id);
  expect(full.choices?.map(c => c?.order)).toEqual(['RNBQKBNR', 'RNBKQBNR']);
  expect(full.legal).toContain('e2-e4!H');
  // A Haste card is one turn of two actions: alone, its first move is refused (W7 ticket 06).
  await expect(service.command(a, game.game_id, command(4, { type: 'turn', actions: ['e2-e4!H'] }))).rejects.toMatchObject({ code: 'INVALID_MOVE' });
  const moved = await service.command(a, game.game_id, command(4, { type: 'turn', actions: ['e2-e4!H', 'e4-e5'] }));
  const hasteBit = 1 << full.deal!.indexOf('Haste');
  expect(moved.fen.split(' ')[6].split('/')).toContain(`u${hasteBit}.0`);
  expect(moved.hands).toEqual(full.hands); expect(moved.deal).toEqual(full.deal);
  expect(moved).toMatchObject({ revision: 5, turn: 1 });
  const retried = await service.command(a, game.game_id, draft);
  expect(retried).toMatchObject({ status: 'playing', revision: moved.revision, fen: moved.fen, choices: moved.choices, ready: [true, true] });
  expect(retried.last_commands.filter(entry => entry.action.type === 'choose' && !entry.action.ready)).toHaveLength(1);
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
 it('lets the account-deletion job abort setup with no result', async () => {
  const gone = randomUUID(); users.push(gone);
  await admin.query('insert into auth.users(id) values($1)', [gone]);
  await admin.query('update public.profiles set handle=$2 where id=$1', [gone, `gone-${gone.slice(0,8)}`]);
  const game = await service.create(gone, { kind: 'friend', options: DEFAULT_OPTIONS });
  await service.join(b, (await service.invite(gone, game.game_id)).token);
  await admin.query("insert into public.account_deletions(user_id,run_after) values($1,now()-interval '1 minute')", [gone]);
  expect(await runDeletions(service)).toBe(1);
  expect(await service.view(b, game.game_id)).toMatchObject({ status: 'aborted', result: { winner: null, reason: 'abort' }, opponent: { deleted: true } });
 }, 30_000);
 it('pins validated options and waits for the player without publishing a position', async () => {
  const created = await service.create(a, { kind: 'solo', options: DEFAULT_OPTIONS, level: 'beginner' });
  expect(created).toMatchObject({ status: 'setup', seat: 0, action: 'ready', legal: [] });
  const row = (await admin.query('select options,draw,deal,level,state,snapshot,started_at,engine_fingerprint,setup_admission from public.games where id=$1', [created.game_id])).rows[0];
  expect(row).toMatchObject({ options: DEFAULT_OPTIONS, deal: [], level: 'beginner', state: null, snapshot: null, started_at: null });
  expect(row.draw).toHaveLength(8); expect(row.engine_fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
  expect(row.setup_admission).toEqual({ kings: [], arrangement: true, bishopsOpposite: true, guardAdjacent: true });
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
 it.each([false, true])('finishes an N setup on its archive after cutover (first seat ready: %s)', async firstReady => {
  const engine = 'sha256:bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da';
  const current = await createMatch();
  try { expect(JSON.parse(await current.exportSave()).engine).not.toBe(engine); } finally { await current.close(); }
  let seed = 7;
  const random = vi.spyOn(Math, 'random').mockImplementation(() => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296));
  const factory = vi.spyOn(matchModule, 'createMatch').mockImplementation(setup => createPinnedMatch(setup ?? {}, engine));
  let oracle: LocalMatch | undefined, reloaded: LocalMatch | undefined;
  try {
   const options = { ...DEFAULT_OPTIONS, kingPowers: true };
   const created = await service.create(a, { kind: 'friend', options });
   expect(created).toMatchObject({ status: 'waiting', engine_fingerprint: engine, fen: '', legal: [] });
   expect(created.rules).toBeUndefined(); expect(created.kings).toBeUndefined();
   expect(Object.keys(created.setup_admission!).sort()).toEqual(['arrangement', 'bishopsOpposite', 'guardAdjacent', 'kings']);
   const before = (await admin.query('select draw,deal,setup_admission,state,snapshot from public.games where id=$1', [created.game_id])).rows[0];
   expect(before.state).toBeNull(); expect(before.snapshot).toBeNull();
   const invitation = await service.invite(a, created.game_id);
   if (firstReady) await service.join(b, invitation.token);
   const choice: Choice = { king: { king: 'Flame', power: 'Haste' }, order: [...before.draw].reverse().join('') };
   const first = command(1, { type: 'choose', choice, ready: true });
   if (firstReady) await service.command(a, created.game_id, first);
   // N+1 may change both defaults and admission; neither path may resolve this pending game again.
   factory.mockRejectedValue(new Error('Current engine creation is forbidden after N'));
   const admission = vi.spyOn(setupModule, 'setupAdmission').mockImplementation(() => { throw new Error('Current admission is forbidden after N'); });
   try {
    const next = new GameService(new PostgresMatchStore(runtime));
    if (!firstReady) { await next.join(b, invitation.token); await next.command(a, created.game_id, first); }
    const final = await next.command(b, created.game_id, command(2, { type: 'choose', choice: { king: { king: 'Shadow', power: 'Darkness' }, order: before.draw }, ready: true }));
    expect(final).toMatchObject({ status: 'playing', revision: 3, engine_fingerprint: engine });
    expect(await next.command(a, created.game_id, first)).toMatchObject({ revision: 3, engine_fingerprint: engine });
    const row = (await admin.query('select draw,deal,setup_admission,state,setup from public.games where id=$1', [created.game_id])).rows[0];
    expect({ draw: row.draw, deal: row.deal, setup_admission: row.setup_admission }).toEqual({ draw: before.draw, deal: before.deal, setup_admission: before.setup_admission });
    oracle = await createPinnedMatch(row.setup, engine);
    const initial = await oracle.snapshot(), full = await next.view(a, created.game_id);
    expect(full.rules).toEqual(initial.rules); expect(full.legal).toEqual(initial.legal); expect(full.fen).toBe(initial.fen);
    const move = initial.legal.find(lan => lan.endsWith('!H'))!;
    expect(move).toBeTruthy();
    await oracle.apply({ id: 'expected-1', expectedRevision: 0, lan: move });
    const expected = await oracle.apply({ id: 'expected-2', expectedRevision: 1, lan: '--' });
    const played = await next.command(a, created.game_id, command(3, { type: 'turn', actions: [move, '--'] }));
    expect(played).toMatchObject({ revision: 4, engine_fingerprint: engine, fen: expected.fen, turn: expected.turn, status: 'playing' });
    const save = (await admin.query('select state from public.games where id=$1', [created.game_id])).rows[0].state;
    reloaded = await loadMatch(save);
    expect(await reloaded.snapshot()).toEqual(expected);
    expect((await next.view(a, created.game_id)).history?.actions).toEqual([move, '--']);
    expect(factory).toHaveBeenCalledTimes(1); expect(admission).not.toHaveBeenCalled();
   } finally { admission.mockRestore(); }
  } finally { factory.mockRestore(); random.mockRestore(); await oracle?.close(); await reloaded?.close(); }
 }, 30_000);
 it('refuses unexpected unstamped pending rows instead of assigning current defaults', async () => {
  const created = await service.create(a, { kind: 'friend', options: DEFAULT_OPTIONS });
  const invitation = await service.invite(a, created.game_id);
  await admin.query('update public.games set engine_fingerprint=null,setup_admission=null where id=$1', [created.game_id]);
  await expect(service.join(b, invitation.token)).rejects.toMatchObject({ code: 'MATCH_INCOMPATIBLE' });
  expect((await admin.query('select status,engine_fingerprint,setup_admission,state from public.games where id=$1', [created.game_id])).rows[0]).toEqual({ status: 'waiting', engine_fingerprint: null, setup_admission: null, state: null });
 });
 it('returns an accepted setup receipt before refusing a new choice on an unmapped pending row', async () => {
  const created = await service.create(a, { kind: 'friend', options: DEFAULT_OPTIONS });
  await service.join(b, (await service.invite(a, created.game_id)).token);
  const before = await service.view(a, created.game_id), accepted = command(1, { type: 'choose', choice: before.choices![0], ready: true });
  await service.command(a, created.game_id, accepted);
  await admin.query('update public.games set setup_admission=null where id=$1', [created.game_id]);
  expect(await service.command(a, created.game_id, accepted)).toMatchObject({ revision: 2, status: 'setup' });
  const other = await service.view(b, created.game_id);
  await expect(service.command(b, created.game_id, command(2, { type: 'choose', choice: other.choices![1], ready: true }))).rejects.toMatchObject({ code: 'MATCH_INCOMPATIBLE' });
  expect((await admin.query('select count(*)::int as n from public.game_commands where game_id=$1', [created.game_id])).rows[0].n).toBe(2);
 });
 it('adds setup defaults to a save seeded under 0009 and continues play after two applies of 0010', async () => {
  const server = new URL(own.href); server.pathname = '/postgres';
  const control = new pg.Pool({ connectionString: server.href, max: 1 });
  const name = `kingdown_mvp06_upgrade_${randomUUID().replaceAll('-', '')}_test`, target = new URL(own.href);
  target.pathname = `/${name}`;
  await control.query(`create database ${name}`);
  const db = new pg.Pool({ connectionString: target.href, max: 1 });
  let match: LocalMatch | undefined;
  try {
   await db.query(`create schema auth;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb, banned_until timestamptz);
    create table auth.sessions(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$`);
   await withRoleLock(target.href, async () => {
    for (const file of ['0001_accounts.sql', '0002_matches.sql', '0003_plugin_boards.sql', '0004_plugin_board_recovery.sql', '0005_accounts_v2.sql', '0006_games.sql', '0007_jobs.sql', '0008_accounts_safety.sql', '0009_invite_tries.sql'])
     await db.query(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
   });
   expect((await db.query("select column_name from information_schema.columns where table_schema='public' and table_name in ('games','game_players') and column_name in ('options','draw','deal','level','setup_deadline_at','rematch_offer','rematch_game_id','choice','ready')")).rows).toHaveLength(0);
   await db.query('insert into auth.users(id) values($1)', [a]);
   const gameId = randomUUID(), setup = { backRank: 'RNBQKBNR' };
   match = await createMatch(setup);
   const snapshot = await match.apply({ id: randomUUID(), expectedRevision: 0, lan: 'e2-e4' }), state = await match.exportSave();
   await db.query(`insert into public.games(id,kind,speed,category,colour_rule,engine_fingerprint,setup,rules,status,turn,revision,state,snapshot,created_by,started_at)
    values($1,'solo','live','live/no-powers/no-cards','white',$2,$3,$4,'playing',1,1,$5,$6,$7,now())`, [gameId, JSON.parse(state).engine, setup, snapshot.rules, state, snapshot, a]);
   await db.query(`insert into public.game_players(game_id,seat,user_id,computer,action,turns_played)
    values($1,0,$2,false,'waiting',1),($1,1,null,true,'ready',0)`, [gameId, a]);
   const migration = await readFile(new URL('../../supabase/migrations/0010_game_setup.sql', import.meta.url), 'utf8');
   await db.query(migration); await db.query(migration);
   expect((await db.query('select options,draw,deal,level,setup_deadline_at,rematch_offer,rematch_game_id,state,snapshot from public.games where id=$1', [gameId])).rows[0])
    .toEqual({ options: null, draw: null, deal: null, level: 'club', setup_deadline_at: null, rematch_offer: null, rematch_game_id: null, state, snapshot });
   expect((await db.query('select choice,ready from public.game_players where game_id=$1 order by seat', [gameId])).rows).toEqual([{ choice: null, ready: false }, { choice: null, ready: false }]);
   await db.query(await readFile(new URL('../../supabase/migrations/0017_setup_admission.sql', import.meta.url), 'utf8'));
   const policy = await readFile(new URL('../../supabase/migrations/0018_rating_policy.sql', import.meta.url), 'utf8');
   await db.query(policy); await db.query(policy);
   expect((await db.query('select rating_policy,state,snapshot from public.games where id=$1', [gameId])).rows[0]).toEqual({ rating_policy: 'legacy', state, snapshot });
   const upgraded = new GameService(new PostgresMatchStore(db));
   expect(await upgraded.view(a, gameId)).toMatchObject({ status: 'playing', revision: 1, turn: 1, fen: snapshot.fen });
   expect(await upgraded.command(a, gameId, command(1, { type: 'computer' }))).toMatchObject({ status: 'playing', revision: 2, turn: 0 });
   const white = await upgraded.view(a, gameId);
   expect(await upgraded.command(a, gameId, command(2, { type: 'turn', actions: [white.legal[0]] }))).toMatchObject({ status: 'playing', revision: 3, turn: 1 });
  } finally {
   await match?.close(); await db.end();
   await control.query(`drop database ${name}`); await control.end();
  }
 }, 30_000);
});
