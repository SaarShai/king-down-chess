import { createHash, randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GameService } from './service';
import { createMatch } from './index';
import { PostgresMatchStore } from './store';
import { DEFAULT_OPTIONS } from './setup';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { KINGS, type KingName } from '../rules/rules';
import { PluginService } from '../plugin/service';
import { readFile } from 'node:fs/promises';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';
import { checkPluginDatabase } from '../../tools/plugin-db-check.mjs';

vi.setConfig({ testTimeout: 60_000 });
const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
const command = (expected_revision: number, action: object) => ({ command_id: randomUUID(), expected_revision, action });

suite('finished game results in PostgreSQL', () => {
 let admin: pg.Pool, games: GameService[], own: URL;
 const users: string[] = [], pools: pg.Pool[] = [];
 beforeAll(async () => {
  own = await ownTestDatabase('results');
  pools.push(new pg.Pool({ connectionString: own.href, max: 2 }), new pg.Pool({ connectionString: own.href, max: 2 }));
  admin = pools[0]; games = pools.map(pool => new GameService(new PostgresMatchStore(pool)));
 }, 120_000);
 afterAll(async () => {
  await admin.query('delete from public.games where created_by=any($1)', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await Promise.all(pools.map(pool => pool.end()));
 });
 async function user() {
  const id = randomUUID(); users.push(id);
  await admin.query('insert into auth.users(id) values($1)', [id]);
  await admin.query('update public.profiles set handle=$2 where id=$1', [id, `result-${id.slice(0,8)}`]);
  return id;
 }
 async function friend(a: string, b: string, input: object = {}) {
  const game = await games[0].create(a, { kind: 'setup' in input ? 'solo' : 'friend', ...('setup' in input ? {} : { options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } }), ...input });
  if ('setup' in input) {
   await admin.query("update public.games set kind='friend',status='waiting',speed='daily',days_per_move=3,started_at=null,category='daily-3d/no-powers/no-cards' where id=$1", [game.game_id]);
   await admin.query("update public.game_players set computer=false,action='waiting' where game_id=$1", [game.game_id]);
  }
  return games[1].join(b, (await games[0].invite(a, game.game_id)).token);
 }

 it('updates both human ratings and totals once after a retried resignation', async () => {
  const a = await user(), b = await user(), view = await friend(a, b);
  const resign = command(view.revision, { type: 'resign' });
  await Promise.all(games.map(service => service.command(b, view.game_id, resign)));
  const winner = await games[0].record(a), loser = await games[1].record(b);
  expect(winner.rating.rating).toBeGreaterThan(1500);
  expect(loser.rating.rating).toBeLessThan(1500);
  expect(winner.rating.rd).toBeLessThan(350);
  expect(winner.rating.provisional).toBe(true);
  expect(winner.totals).toEqual({ played: 1, won: 1, drawn: 0, lost: 0 });
  expect(loser.totals).toEqual({ played: 1, won: 0, drawn: 0, lost: 1 });
  await games[0].command(b, view.game_id, resign);
  expect((await games[0].record(a)).rating.rating).toBe(winner.rating.rating);
 });
 it('saves both random-game ratings, Stranger Match badges, history and totals', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
   const at = new Date('2026-10-11T12:00:00.000Z'); vi.setSystemTime(at);
   const a = await user(), b = await user(), handles = [a,b].map(actor => `guest-${actor.slice(0,8)}`);
   await admin.query("update public.profiles set handle=$2,icon='knight' where id=$1", [a, handles[0]]);
   await admin.query("update public.profiles set handle=$2,icon='bishop' where id=$1", [b, handles[1]]);
   const open = await games[0].create(a, { kind: 'random', colour: 'black', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true } });
   const token = randomBytes(32).toString('base64url');
   await admin.query("insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at) values($1,$2,$3,0,$4,$5::timestamptz+interval '1 day')",
    [createHash('sha256').update(token).digest('hex'), createHash('sha256').update(randomUUID()).digest('hex'), open.game_id, a, at]);
   const game = await games[1].join(b, token), resign = command(game.revision, { type: 'resign' });
   await games[0].command(b, game.game_id, resign);
   const records = await Promise.all([a,b].map(actor => games[0].record(actor)));
   expect(records[0].rating.rating).toBeCloseTo(1662.2120026057648, 6);
   expect(records[1].rating.rating).toBeCloseTo(1337.7879973942352, 6);
   expect(records[0].totals).toEqual({ played: 1, won: 1, drawn: 0, lost: 0 });
   expect(records[1].totals).toEqual({ played: 1, won: 0, drawn: 0, lost: 1 });
   expect(records[0].badges.map(b => b.badge).sort()).toEqual(['first_win', 'purist', 'stranger_match']);
   expect(records[1].badges.map(b => b.badge)).toEqual(['stranger_match']);
   const ratings = (await admin.query('select user_id,rating,rd,volatility from public.rating_history where game_id=$1', [game.game_id])).rows;
   expect(ratings).toHaveLength(2);
   for (const [index, actor] of [a,b].entries()) {
    const record = records[index];
    expect(ratings.find(r => r.user_id === actor)).toMatchObject({ rating: record.rating.rating, rd: record.rating.rd, volatility: record.rating.volatility });
    expect(record.badges.every(b => b.earned_at === at.toISOString())).toBe(true);
    expect(await games[0].history(actor)).toEqual({ next_before: null, games: [{ game_id: game.game_id, finished_at: at.toISOString(), kind: 'random',
     colour: index === 0 ? 'black' : 'white', result: index === 0 ? 'won' : 'lost', reason: 'resignation',
     opponent: { handle: handles[1-index], icon: index === 0 ? 'bishop' : 'knight', computer: false, deleted: false, level: null },
     features: { fairy: false, arrangement: false, classic: true, cards: false, powers: false, king: index === 0 ? 'Shadow' : 'Spirit', power: null } }] });
   }
   await games[1].command(b, game.game_id, resign);
   expect(await Promise.all([a,b].map(actor => games[0].record(actor)))).toEqual(records);
  } finally { vi.useRealTimers(); }
 });
 it('stores each badge once across two wins and keeps its first date', async () => {
  const a = await user(), b = await user(), first = await friend(a, b);
  await games[0].command(b, first.game_id, command(first.revision, { type: 'resign' }));
  const badges = (await games[0].record(a)).badges;
  expect(badges.map(b => b.badge).sort()).toEqual(['first_win', 'friend_match', 'purist']);
  expect(badges.every(b => Number.isFinite(Date.parse(b.earned_at)))).toBe(true);
  const second = await friend(a, b);
  await games[1].command(b, second.game_id, command(second.revision, { type: 'resign' }));
  expect((await games[0].record(a)).badges).toEqual(badges);
  expect((await games[1].record(b)).badges.map(b => b.badge)).toEqual(['friend_match']);
 });
 it('lists only finished games newest first, with complete pages even at the same date', async () => {
  const a = await user(), b = await user(), stranger = await user(), handle = `guest-${b.slice(0,8)}`;
  await admin.query("update public.profiles set handle=$2,icon='rook' where id=$1", [b, handle]);
  const solo = await games[0].create(a, { kind: 'solo', colour: 'black', level: 'strong', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false } });
  await games[0].command(a, solo.game_id, command(0, { type: 'resign' }));
  const win = await friend(a, b, { colour: 'black' });
  await games[0].command(b, win.game_id, command(win.revision, { type: 'resign' }));
  const draw = await friend(a, b);
  await games[0].command(a, draw.game_id, command(draw.revision, { type: 'draw', choice: 'offer' }));
  await games[0].command(b, draw.game_id, command(draw.revision + 1, { type: 'draw', choice: 'accept' }));
  await games[0].create(a, { kind: 'solo' });
  const aborted = await games[0].create(a, { kind: 'solo' });
  await games[0].command(a, aborted.game_id, command(0, { type: 'abort' }));
  await admin.query('update public.games set finished_at=$2 where id=any($1)', [[win.game_id, draw.game_id], '2026-10-12T12:00:00.000Z']);
  const first = await games[0].history(a, undefined, 1), second = await games[1].history(a, first.next_before!, 1), third = await games[0].history(a, second.next_before!, 1);
  expect([...first.games, ...second.games, ...third.games].map(g => g.game_id)).toEqual([win.game_id, draw.game_id].sort().reverse().concat(solo.game_id));
  expect(third.next_before).toBeNull();
  const entries = (await games[0].history(a)).games;
  expect(entries.find(g => g.game_id === win.game_id)).toMatchObject({ colour: 'black', result: 'won', reason: 'resignation',
   opponent: { handle, icon: 'rook', computer: false, deleted: false, level: null }, features: { classic: true, fairy: false, arrangement: false, cards: false, powers: false, king: 'Shadow', power: null } });
  expect(entries.find(g => g.game_id === solo.game_id)).toMatchObject({ colour: 'black', result: 'lost', opponent: { computer: true, level: 'strong' } });
  expect((await games[0].record(a)).totals).toEqual({ played: 3, won: 1, drawn: 1, lost: 1 });
  expect((await games[0].history(stranger)).games).toEqual([]);
 });
 it('keeps computer games unrated and excludes abort and no start from the record', async () => {
  const a = await user(), b = await user(), start = (await games[0].record(a)).rating;
  const solo = await games[0].create(a, { kind: 'solo', level: 'strong', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false } });
  const fixture = await createMatch({ fen: '7k/8/5KQ1/8/8/8/8/8 w - - 0 1', kings: 'none,none' });
  try { await admin.query('update public.games set state=$2,snapshot=$3 where id=$1', [solo.game_id, await fixture.exportSave(), await fixture.snapshot()]); }
  finally { await fixture.close(); }
  const mate = await games[0].command(a, solo.game_id, command(0, { type: 'turn', actions: ['Qg6-g7'] }));
  expect(mate.result).toEqual({ winner: 0, reason: 'checkmate' });
  const record = await games[0].record(a);
  expect(record.rating).toEqual(start);
  expect(record.totals).toEqual({ played: 1, won: 1, drawn: 0, lost: 0 });
  expect(record.badges.map(b => b.badge).sort()).toEqual(['first_win', 'giant_slayer']);
  const abort = await friend(a, b);
  await games[0].command(a, abort.game_id, command(abort.revision, { type: 'abort' }));
  const setup = await friend(a, b, { options: DEFAULT_OPTIONS });
  await admin.query("update public.games set setup_deadline_at=now()-interval '1 second' where id=$1", [setup.game_id]);
  expect(await games[0].sweep()).toBe(1);
  expect((await games[0].view(a, setup.game_id)).result).toEqual({ winner: null, reason: 'no_start' });
  expect(await games[0].record(a)).toEqual(record);
  expect((await games[0].record(b)).totals.played).toBe(0);
  expect((await games[0].record(b)).badges).toEqual([]);
  expect((await games[0].history(a)).games.map(g => g.game_id)).toEqual([solo.game_id]);
  expect((await admin.query('select count(*)::int as n from public.rating_history where user_id=any($1)', [[a,b]])).rows[0].n).toBe(0);
 });
 it('rates checkmate and an engine draw through the same end path', async () => {
  const a = await user(), b = await user(), game = await friend(a, b);
  for (const [index, lan] of ['f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4'].entries())
   await games[0].command(index % 2 ? b : a, game.game_id, command(index + 1, { type: 'turn', actions: [lan] }));
  expect((await games[0].history(b)).games[0]).toMatchObject({ result: 'won', reason: 'checkmate' });
  expect((await games[0].record(b)).rating.rating).toBeGreaterThan(1500);
  const draw = await friend(a, b, { setup: { fen: '7k/8/8/8/8/4r3/3B4/2K5 w - - 0 1', kings: 'none,none' } });
  const ended = await games[0].command(a, draw.game_id, command(1, { type: 'turn', actions: ['Bd2xe3'] }));
  expect(ended.result).toEqual({ winner: null, reason: 'drawMaterial' });
  expect((await games[0].record(a)).totals).toEqual({ played: 2, won: 0, drawn: 1, lost: 1 });
  expect((await games[0].record(b)).rating.rating).toBeLessThan((await admin.query('select rating from public.rating_history where game_id=$1 and user_id=$2', [game.game_id, b])).rows[0].rating);
 });
 it.each(['claim', 'sweep', 'late command'])('rates a missed move deadline through %s', async path => {
  const a = await user(), b = await user(), game = await friend(a, b);
  await games[0].command(a, game.game_id, command(1, { type: 'turn', actions: ['e2-e4'] }));
  await games[0].command(b, game.game_id, command(2, { type: 'turn', actions: ['e7-e5'] }));
  await admin.query("update public.games set deadline_at=now()-interval '1 second' where id=$1", [game.game_id]);
  if (path === 'claim') await games[1].command(b, game.game_id, command(3, { type: 'claim', reason: 'timeout' }));
  else if (path === 'sweep') { expect(await games[0].sweep()).toBe(1); expect(await games[1].sweep()).toBe(0); }
  else await expect(games[0].command(a, game.game_id, command(3, { type: 'turn', actions: ['Ng1-f3'] }))).rejects.toMatchObject({ code: 'MATCH_TERMINAL' });
  expect((await games[0].history(b)).games[0]).toMatchObject({ result: 'won', reason: 'timeout' });
  expect((await games[0].record(b)).rating.rating).toBeGreaterThan(1500);
  expect((await games[0].record(a)).totals.lost).toBe(1);
 });
 it('keeps both rating updates when two games of one player end at once', async () => {
  const a = await user(), b = await user(), c = await user();
  const first = await friend(a, b), second = await friend(c, a);
  await Promise.all([games[0].command(b, first.game_id, command(1, { type: 'resign' })), games[1].command(c, second.game_id, command(1, { type: 'resign' }))]);
  const record = await games[0].record(a);
  expect(record.rating.rating).toBeGreaterThan(1700);
  expect(record.totals).toEqual({ played: 2, won: 2, drawn: 0, lost: 0 });
  expect(record.badges.map(b => b.badge).sort()).toEqual(['first_win', 'friend_match', 'purist']);
  expect((await admin.query('select count(*)::int as n from public.rating_history where user_id=$1', [a])).rows[0].n).toBe(2);
 });
 it('keeps the latest rated game date when an older end commits last', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
   vi.setSystemTime(new Date('2026-10-11T12:00:00.000Z'));
   const a = await user(), b = await user(), older = await friend(a, b), newer = await friend(a, b);
   vi.setSystemTime(new Date('2026-10-13T12:00:00.000Z'));
   await games[0].command(b, newer.game_id, command(newer.revision, { type: 'resign' }));
   vi.setSystemTime(new Date('2026-10-12T12:00:00.000Z'));
   await games[1].command(b, older.game_id, command(older.revision, { type: 'resign' }));
   const ratings = (await admin.query('select last_game_at from public.player_ratings where user_id=any($1)', [[a,b]])).rows;
   expect(ratings).toHaveLength(2);
   expect(ratings.map(r => r.last_game_at.toISOString())).toEqual(['2026-10-13T12:00:00.000Z', '2026-10-13T12:00:00.000Z']);
   expect((await games[0].record(a)).totals).toEqual({ played: 2, won: 2, drawn: 0, lost: 0 });
  } finally { vi.useRealTimers(); }
 });
 it('earns Royal Collection from six saved king wins', async () => {
  const a = await user(), b = await user();
  const kings: KingName[] = ['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow'];
  for (const [index, king] of kings.entries()) {
   const game = await friend(a, b, { options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true, kingPowers: true } });
   const ready = await games[0].command(a, game.game_id, command(1, { type: 'choose', choice: { king: { king, power: KINGS[king][0] }, order: game.draw }, ready: true }));
   const start = await games[0].command(b, game.game_id, command(ready.revision, { type: 'choose', choice: game.choices![1], ready: true }));
   await games[0].command(b, game.game_id, command(start.revision, { type: 'resign' }));
   expect((await games[0].record(a)).badges.some(b => b.badge === 'royal_collection')).toBe(index === 5);
  }
 });
 it('rolls the result, ratings, badges and receipt back when the final write fails', async () => {
  const a = await user(), b = await user(), game = await friend(a, b), resign = command(1, { type: 'resign' });
  await admin.query(`create function fail_result_write() returns trigger language plpgsql as $$ begin
   if new.payload->>'game_id'='${game.game_id}' and new.kind='game_finished' then raise exception 'test result write' using errcode='23514'; end if; return new; end $$;
   create trigger fail_result_write before insert on public.outbox for each row execute function fail_result_write()`);
  try {
   await expect(games[0].command(b, game.game_id, resign)).rejects.toMatchObject({ code: '23514' });
   expect(await games[0].record(a)).toEqual({ totals: { played: 0, won: 0, drawn: 0, lost: 0 }, rating: { rating: 1500, rd: 350, volatility: 0.06, provisional: true }, badges: [] });
   expect((await games[0].view(a, game.game_id)).revision).toBe(1);
  } finally { await admin.query('drop trigger fail_result_write on public.outbox; drop function fail_result_write()'); }
  await games[0].command(b, game.game_id, resign);
  expect((await games[0].record(a)).totals.won).toBe(1);
  expect((await games[0].record(a)).rating.rating).toBeGreaterThan(1500);
 });
 it('reads history and record through the plugin on a read-only connection and checks page input', async () => {
  const a = await user(), b = await user(), game = await friend(a, b);
  await games[0].command(b, game.game_id, command(1, { type: 'resign' }));
  const pool = new pg.Pool({ connectionString: own.href, max: 1, options: '-c default_transaction_read_only=on' });
  try {
   const plugin = new PluginService(new PostgresMatchStore(pool));
   expect((await plugin.history(a)).games[0].game_id).toBe(game.game_id);
   expect((await plugin.record(a)).totals.won).toBe(1);
   for (const limit of [0, -1, 21, 1.5, Infinity]) await expect(plugin.history(a, undefined, limit)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
   for (const before of ['bad', '2026-10-99T12:00:00.000Z|'+game.game_id, '2026-10-11T12:00:00.000Z|bad']) await expect(plugin.history(a, before)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
   await expect(plugin.record('bad')).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  } finally { await pool.end(); }
 });
 it('keeps the chosen features in history and keeps a deleted opponent marked as deleted', async () => {
  const a = await user(), b = await user();
  const game = await friend(a, b, { options: { ...DEFAULT_OPTIONS, cards: true, kingPowers: true } });
  const host = await games[0].view(a, game.game_id);
  const ready = await games[0].command(a, game.game_id, command(1, { type: 'choose', choice: host.choices![0], ready: true }));
  const start = await games[0].command(b, game.game_id, command(ready.revision, { type: 'choose', choice: game.choices![1], ready: true }));
  await games[0].command(b, game.game_id, command(start.revision, { type: 'resign' }));
  expect((await games[0].history(a)).games[0].features).toEqual({ fairy: true, arrangement: true, classic: false, cards: true, powers: true, king: 'Spirit', power: 'Mercy' });
  expect((await games[0].record(a)).badges.map(b => b.badge).sort()).toEqual(['architect', 'card_sharp', 'crowned', 'fairy_tale', 'first_win', 'friend_match']);
  await admin.query('delete from auth.users where id=$1', [b]);
  expect((await games[0].history(a)).games[0].opponent).toEqual({ handle: null, icon: null, computer: false, deleted: true, level: null });
  expect((await games[0].record(a)).totals.won).toBe(1);
 });
 it('pages 20 games by default without losing dates with microseconds', async () => {
  const a = await user(), ids: string[] = [];
  for (let i = 0; i < 21; i++) {
   const game = await games[0].create(a, { kind: 'solo' }); ids.push(game.game_id);
   await games[0].command(a, game.game_id, command(0, { type: 'resign' }));
  }
  await admin.query("update public.games set finished_at='2026-10-12T12:00:00.123456Z' where id=any($1)", [ids]);
  const first = await games[0].history(a), second = await games[0].history(a, first.next_before!);
  expect(first.games).toHaveLength(20); expect(second.games).toHaveLength(1); expect(second.next_before).toBeNull();
  expect([...first.games, ...second.games].map(g => g.game_id)).toEqual(ids.sort().reverse());
 });
 it('marks a long break as provisional and saves both ratings after the next human game', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
   const at = new Date('2026-10-11T12:00:00.000Z'); vi.setSystemTime(at);
   const a = await user(), b = await user(), game = await friend(a, b);
   await games[0].command(b, game.game_id, command(game.revision, { type: 'resign' }));
   await admin.query('update public.player_ratings set rd=100 where user_id=$1', [a]);
   expect((await games[0].record(a)).rating.provisional).toBe(false);
   await admin.query("update public.player_ratings set rating=1500,rd=65,volatility=0.06,last_game_at=$2::timestamptz-interval '365 days' where user_id=$1", [a, at]);
   await admin.query("update public.player_ratings set rating=1700,rd=90,volatility=0.07,last_game_at=$2::timestamptz-interval '180 days' where user_id=$1", [b, at]);
   expect((await games[0].record(a)).rating.provisional).toBe(true);
   const next = await friend(a, b);
   await games[0].command(a, next.game_id, command(next.revision, { type: 'resign' }));
   const expected = [
    { rating: 1483.7260699008034, rd: 109.04476609507158, volatility: 0.05999670634268343 },
    { rating: 1717.5656641687417, rd: 113.23748651679657, volatility: 0.06999477661395923 },
   ];
   for (const [seat, actor] of [a,b].entries()) {
    const saved = (await admin.query('select rating,rd,volatility,last_game_at from public.player_ratings where user_id=$1', [actor])).rows[0];
    expect(saved.rating).toBeCloseTo(expected[seat].rating, 6);
    expect(saved.rd).toBeCloseTo(expected[seat].rd, 6);
    expect(saved.volatility).toBeCloseTo(expected[seat].volatility, 10);
    expect(saved.last_game_at).toEqual(at);
    expect((await games[0].record(actor)).rating).toEqual({ ...expected[seat], provisional: seat === 1 });
   }
  } finally { vi.useRealTimers(); }
 });
 it('writes results with the runtime role, keeps result rows fixed and gives browser roles no access', async () => {
  const role = `result_test_${randomUUID().replaceAll('-', '')}`, password = randomUUID(), login = new URL(own.href);
  login.username = role; login.password = password;
  const pool = new pg.Pool({ connectionString: login.href, max: 1 });
  const grants = await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8');
  await withRoleLock(own.href, () => admin.query(`${grants.replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`));
  try {
   await checkPluginDatabase(pool);
   const service = new GameService(new PostgresMatchStore(pool)), a = await user(), b = await user(), game = await friend(a, b);
   await service.command(b, game.game_id, command(1, { type: 'resign' }));
   expect((await service.record(a)).rating.rating).toBeGreaterThan(1500);
   expect((await service.history(a)).games[0].game_id).toBe(game.game_id);
   for (const sql of ['update public.rating_history set rating=rating', 'delete from public.rating_history', 'update public.player_badges set earned_at=earned_at', 'delete from public.player_badges'])
    await expect(pool.query(sql)).rejects.toMatchObject({ code: '42501' });
   for (const browser of ['anon', 'authenticated']) for (const table of ['player_ratings', 'rating_history', 'player_badges'])
    expect((await admin.query('select has_table_privilege($1,$2,$3) as allowed', [browser, 'public.'+table, 'SELECT,INSERT,UPDATE,DELETE'])).rows[0].allowed).toBe(false);
  } finally { await pool.end(); await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`)); }
 });
});
