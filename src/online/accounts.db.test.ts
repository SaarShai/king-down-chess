/** Opt-in integration tests; PLUGIN_TEST_DATABASE_URL must name a disposable real PostgreSQL database.
 * The player-facing services run as a copy of the reviewed runtime role; the owner's run as the admin. */
import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { AccountService } from './accounts';
import { APPEAL, SafetyService } from './safety';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';
const url = process.env.PLUGIN_TEST_DATABASE_URL;
if (url) {
 const target = new URL(url);
 if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || !target.pathname.endsWith('_test')) throw new Error('Database tests require a disposable loopback database ending in _test');
}
const suite = url ? describe : describe.skip;
const DAY = 86_400_000;
const later = (days: number) => new Date(Date.now() + days * DAY);

suite('PostgreSQL accounts and safety (runtime role and owner)', () => {
 const admin = new pg.Pool({ connectionString: url, max: 2 }), role = `accounts_test_${randomUUID().replaceAll('-', '')}`, password = randomUUID();
 const runtimeUrl = new URL(url ?? 'postgresql://x@127.0.0.1/x_test'); runtimeUrl.username = role; runtimeUrl.password = password;
 const runtime = new pg.Pool({ connectionString: runtimeUrl.href, max: 2 }), store = new PostgresMatchStore(runtime);
 const games = new GameService(store), accounts = new AccountService(store), safety = new SafetyService(store), owner = new SafetyService(new PostgresMatchStore(admin));
 const users: string[] = [], tag = randomUUID().slice(0, 6);
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 const locked = (sql: string) => withRoleLock(url!, () => admin.query(sql));
 async function user(handle?: string) {
  const id = randomUUID(); users.push(id);
  await admin.query('insert into auth.users(id) values($1)', [id]);
  if (handle) await admin.query('update public.profiles set handle=$2 where id=$1', [id, `${handle}-${tag}`]);
  return id;
 }
 const handleOf = async (id: string) => (await rows('select handle from public.profiles where id=$1', [id]))[0]?.handle ?? null;
 async function friend(host: string, guest: string) {
  const created = await games.create(host, { kind: 'friend', colour: 'white' });
  await games.join(guest, (await games.invite(host, created.game_id)).token);
  return created.game_id;
 }
 const say = async (actor: string, gameId: string, preset: string) => games.command(actor, gameId, { command_id: randomUUID(), expected_revision: (await games.view(actor, gameId)).revision, action: { type: 'say', preset } });

 beforeAll(async () => {
  await locked(`${(await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8')).replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`);
 });
 afterAll(async () => {
  await runtime.end();
  await admin.query('delete from public.reports where reporter_id=any($1) or reported_id=any($1)', [users]);
  await admin.query('delete from public.mod_actions where user_id=any($1)', [users]);
  await admin.query('delete from public.games g where created_by=any($1) or exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))', [users]);
  await admin.query('delete from public.account_deletions where user_id=any($1)', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await locked(`drop owned by ${role}; drop role ${role}`);
  await admin.end();
 });

 it('checks handles, allows one rename in 90 days and never gives an old or deleted handle again', async () => {
  const [a, b, c] = [await user(), await user(), await user('cy')];
  for (const bad of ['GM_Bob', 'admin-x', 'ab', 'a b c']) await expect(accounts.setHandle(a, { handle: bad }), bad).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await expect(accounts.setHandle(a, `ann-${tag}`)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  const first = await accounts.setHandle(a, { handle: ` Ann-${tag} ` });
  expect([first.handle, first.can_rename_at]).toEqual([`ann-${tag}`, null]);
  await expect(accounts.setHandle(b, { handle: `ann-${tag}` })).rejects.toMatchObject({ code: 'HANDLE_TAKEN' });
  const renamed = await accounts.setHandle(a, { handle: `ann2-${tag}` }); // the first change is free
  expect(new Date(renamed.can_rename_at!).getTime() - later(90).getTime()).toBeLessThan(60_000);
  await expect(accounts.setHandle(a, { handle: `ann3-${tag}` })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  await expect(accounts.setHandle(b, { handle: `ann-${tag}` })).rejects.toMatchObject({ code: 'HANDLE_TAKEN' });
  expect(await rows('select reason,user_id from public.reserved_handles where handle=$1', [`ann-${tag}`])).toEqual([{ reason: 'old', user_id: a }]);
  await admin.query("update public.profiles set handle_changed_at=now()-interval '91 days' where id=$1", [a]);
  expect((await accounts.setHandle(a, { handle: `ann3-${tag}` })).handle).toBe(`ann3-${tag}`);
  // A deleted player's handle stays reserved, with no user.
  await admin.query('delete from auth.users where id=$1', [c]);
  expect(await rows('select reason,user_id from public.reserved_handles where handle=$1', [`cy-${tag}`])).toEqual([{ reason: 'deleted', user_id: null }]);
  await expect(accounts.setHandle(b, { handle: `cy-${tag}` })).rejects.toMatchObject({ code: 'HANDLE_TAKEN' });
  // One handle wanted twice at once; and a handle wanted while its owner leaves it: the lock lets nobody take it.
  const [d, e] = [await user(), await user()];
  const race = await Promise.allSettled([accounts.setHandle(d, { handle: `dee-${tag}` }), accounts.setHandle(e, { handle: `dee-${tag}` })]);
  expect(race.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected']);
  await admin.query("update public.profiles set handle_changed_at=now()-interval '91 days' where id=$1", [a]);
  const leaving = await Promise.allSettled([accounts.setHandle(a, { handle: `ann4-${tag}` }), accounts.setHandle(b, { handle: `ann3-${tag}` })]);
  expect(leaving.map(result => result.status === 'rejected' ? result.reason.code : 'ok')).toEqual(['ok', 'HANDLE_TAKEN']);
 }, 30000);

 it('keeps a handle that its owner leaves while another player asks for it at the same time', async () => {
  const [a, b] = [await user('lv'), await user()], old = (await handleOf(a))!;
  // A fixed order: A changes the handle and holds the commit; B asks for the old handle and waits; then A commits.
  const leaving = await admin.connect(), taking = new pg.Client({ connectionString: url }); await taking.connect();
  try {
   await leaving.query('begin'); await leaving.query('update public.profiles set handle=$2 where id=$1', [a, `lv2-${tag}`]);
   const pid = (await taking.query('select pg_backend_pid() as pid')).rows[0].pid;
   const take = taking.query('update public.profiles set handle=$2 where id=$1', [b, old]).then(() => 'taken', error => error.code);
   for (let i = 0; i < 250 && !(await rows("select from pg_stat_activity where pid=$1 and wait_event_type='Lock'", [pid])).length; i++) await new Promise(resolve => setTimeout(resolve, 20));
   await leaving.query('commit');
   expect([await take, await handleOf(b)]).toEqual(['23505', null]);
  } finally { leaving.release(); await taking.end(); }
 }, 30000);

 it('saves settings and applies them to views: last seen, presets, a block and quiet mode', async () => {
  const [a, b] = [await user('ada'), await user('ben')];
  const set = await accounts.updateSettings(a, { icon: 'flame', online_visible_to: 'everyone' });
  expect(set).toMatchObject({ icon: 'flame', online_visible_to: 'everyone', challenge_from: 'signed-in', quiet_mode: false, accepting_games: true, on_leaderboards: true, deletion: null });
  for (const bad of [{ icon: 'selfie' }, {}, { handle: 'x' }, { quiet_mode: 'yes' }]) await expect(accounts.updateSettings(a, bad), JSON.stringify(bad)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  const id = await friend(a, b);
  const seen = async () => [(await games.view(b, id)).opponent?.last_seen_ms ?? null, (await games.inbox(b)).find(entry => entry.game_id === id)?.opponent?.last_seen_ms ?? null];
  expect((await seen()).every(ms => typeof ms === 'number')).toBe(true);
  await accounts.updateSettings(a, { online_visible_to: 'mutual' });
  expect(await seen()).toEqual([null, null]);
  await accounts.relate(a, { kind: 'follow', game_id: id }); await accounts.relate(b, { kind: 'follow', handle: await handleOf(a) });
  expect((await seen()).every(ms => typeof ms === 'number')).toBe(true);
  await accounts.updateSettings(a, { online_visible_to: 'nobody' });
  expect(await seen()).toEqual([null, null]);
  await accounts.updateSettings(a, { online_visible_to: 'everyone' });
  // Presets: hidden both ways by a block, and from a player in quiet mode; the revision stays, so the list has no gap.
  await say(a, id, 'hello'); await say(b, id, 'good_luck');
  const shown = async (viewer: string) => (await games.view(viewer, id, 0)).last_commands.map(entry => entry.action.type === 'say' ? entry.action.preset : entry.action.type);
  expect([await shown(a), await shown(b)]).toEqual([['join', 'hello', 'good_luck'], ['join', 'hello', 'good_luck']]);
  await accounts.relate(b, { kind: 'block', user_id: a });
  expect([await shown(a), await shown(b)]).toEqual([['join', 'hello', 'hidden'], ['join', 'hidden', 'good_luck']]);
  expect((await games.view(b, id, 0)).last_commands.map(entry => entry.seq)).toEqual([1, 2, 3]);
  expect(await seen()).toEqual([null, null]);
  await accounts.unrelate(b, { kind: 'block', user_id: a });
  await accounts.updateSettings(b, { quiet_mode: true });
  expect([await shown(a), await shown(b)]).toEqual([['join', 'hello', 'good_luck'], ['join', 'hidden', 'good_luck']]);
 }, 30000);

 it('follows and blocks: a block ends follows, refuses a follow and refuses invitations both ways', async () => {
  const [a, b] = [await user('fo'), await user('bo')];
  await accounts.relate(a, { kind: 'follow', handle: (await handleOf(b))!.toUpperCase() });
  await accounts.relate(a, { kind: 'follow', user_id: b }); // twice is once
  await accounts.relate(b, { kind: 'follow', user_id: a });
  expect((await accounts.relations(a)).map(r => [r.kind, r.user_id, r.handle])).toEqual([['follow', b, await handleOf(b)]]);
  await accounts.relate(b, { kind: 'block', user_id: a });
  expect(await rows('select user_id,kind from public.relations where user_id=any($1) order by kind', [[a, b]])).toEqual([{ user_id: b, kind: 'block' }]);
  await expect(accounts.relate(a, { kind: 'follow', user_id: b })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  for (const [host, guest] of [[a, b], [b, a]]) {
   const created = await games.create(host, { kind: 'friend' });
   await expect(games.join(guest, (await games.invite(host, created.game_id)).code)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  }
  await accounts.unrelate(b, { kind: 'block', user_id: a });
  expect((await games.view(b, await friend(a, b))).status).toBe('playing');
  await expect(accounts.relate(a, { kind: 'follow', user_id: a })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await expect(accounts.relate(a, { kind: 'follow', handle: `nobody-${tag}` })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect(accounts.relate(a, { kind: 'follow', handle: 'x', user_id: b })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await expect(accounts.relate(a, { kind: 'mute', user_id: b })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
 }, 30000);

 it('takes reports from the reporter’s own identity and queues them, child safety first, with their evidence', async () => {
  const [a, b, c] = [await user('rep'), await user('bad'), await user('wit')];
  const id = await friend(a, b); await say(b, id, 'good_game');
  const handle = await handleOf(b);
  const message = await safety.report(a, { target: 'message', game_id: id, preset: 'good_game', category: 'harassment', note: 'Line one.\nLine two.' });
  const named = await safety.report(a, { target: 'handle', handle, category: 'offensive_handle' });
  const urgent = await safety.report(c, { target: 'player', user_id: a, category: 'child_safety_or_illegal', intimate_image: true });
  for (const [input, code] of [
   [{ target: 'player', user_id: b, category: 'other', intimate_image: true }, 'INVALID_INPUT'],
   [{ target: 'message', game_id: id, category: 'harassment' }, 'INVALID_INPUT'],
   [{ target: 'player', user_id: b, category: 'other', preset: 'hello' }, 'INVALID_INPUT'],
   [{ target: 'message', game_id: id, preset: 'hello', category: 'harassment' }, 'NOT_FOUND'],
   [{ target: 'player', user_id: a, category: 'other' }, 'INVALID_INPUT'],
   [{ target: 'player', user_id: b, category: 'other', note: 'look \u001b[2J' }, 'INVALID_INPUT'],
   [{ target: 'player', user_id: b, category: 'other', note: 'look \u009b2J' }, 'INVALID_INPUT'], // C1: the same escape in one character
   [{ target: 'player', user_id: b, category: 'other', note: 'look \u202ekool' }, 'INVALID_INPUT'], // bidi: reverses what the owner reads
   [{ target: 'player', user_id: b, category: 'other', reporter_id: c }, 'INVALID_INPUT'],
   [{ target: 'player', game_id: id, category: 'cheating' }, 'INVALID_INPUT'],
  ] as const) await expect(safety.report(a, input), JSON.stringify(input)).rejects.toMatchObject({ code });
  expect(await rows('select id::int,reporter_id,reported_id,target,content,source,status from public.reports where id=any($1) order by id', [[message.id, named.id, urgent.id]])).toEqual([
   { id: message.id, reporter_id: a, reported_id: b, target: 'message', content: 'good_game', source: 'player', status: 'open' },
   { id: named.id, reporter_id: a, reported_id: b, target: 'handle', content: handle, source: 'player', status: 'open' },
   { id: urgent.id, reporter_id: c, reported_id: a, target: 'player', content: await handleOf(a), source: 'player', status: 'open' }]);
  const queue = (await owner.queue()).filter(entry => [message.id, named.id, urgent.id].includes(entry.id as number));
  expect(queue.map(entry => entry.id)).toEqual([urgent.id, message.id, named.id]);
  expect((queue[0].take_down_by as Date).getTime() - new Date(urgent.created_at).getTime()).toBe(48 * 3_600_000);
  expect(queue[1]).toMatchObject({ reported_handle: handle, reporter_handle: await handleOf(a), game_id: id, note: 'Line one.\nLine two.', take_down_by: null });
  await expect(safety.queue()).rejects.toMatchObject({ code: '42501' }); // the runtime role cannot read the queue
 }, 30000);

 it('writes a statement of reasons with each action, applies it, and reverses it on appeal', async () => {
  const [a, b] = [await user('ma'), await user('nasty')];
  const id = await friend(a, b), old = (await handleOf(b))!;
  const report = async (category = 'offensive_handle') => (await safety.report(a, { target: 'handle', user_id: b, category })).id;
  const first = await report();
  await expect(owner.act(first, { action: 'hide', facts: 'The handle insults a group.' })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await expect(owner.act(first, { action: 'rename', facts: 'x', rule: 'y' })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  const { action_id } = await owner.act(first, { action: 'hide', facts: 'Your handle insults a group of people.', rule: 'Terms: handles must not insult anyone.' });
  expect((await rows('select action,statement,by,report_id::int,handle from public.mod_actions where id=$1', [action_id]))[0]).toEqual({ action: 'hide', by: 'owner', report_id: first, handle: old,
   statement: `What happened: Your handle insults a group of people.\nThe rule: Terms: handles must not insult anyone.\n${APPEAL}` });
  expect((await rows(`select payload from public.notifications where user_id=$1 and kind='moderation'`, [b]))[0].payload).toMatchObject({ action_id, action: 'hide' });
  expect((await rows('select status,outcome,reviewed_at is not null as reviewed from public.reports where id=$1', [first]))[0]).toEqual({ status: 'closed', outcome: 'hide', reviewed: true });
  expect([await handleOf(b), (await games.view(a, id)).opponent?.handle]).toEqual([null, null]);
  expect(await rows('select handle_at_start from public.game_players where game_id=$1 and user_id=$2', [id, b])).toEqual([{ handle_at_start: null }]);
  expect(await rows('select reason from public.reserved_handles where handle=$1', [old])).toEqual([{ reason: 'blocked' }]);
  await expect(accounts.setHandle(b, { handle: old })).rejects.toMatchObject({ code: 'HANDLE_TAKEN' });
  expect((await accounts.setHandle(b, { handle: `nice-${tag}` })).handle).toBe(`nice-${tag}`); // the player picks again at once
  await owner.appeal(action_id!, { status: 'open', note: 'The player says it is a family name.' });
  await owner.appeal(action_id!, { status: 'reversed', note: 'It is a family name.' });
  expect(await handleOf(b)).toBe(old);
  expect(await rows('select reason from public.reserved_handles where handle=any($1) order by reason', [[old, `nice-${tag}`]])).toEqual([{ reason: 'old' }]);
  expect((await rows('select appeal_status,appeal_note,ends_at is not null as ended from public.mod_actions where id=$1', [action_id]))[0]).toEqual({ appeal_status: 'reversed', appeal_note: 'It is a family name.', ended: true });
  await expect(owner.appeal(action_id!, { status: 'upheld', note: 'x' })).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
  // A rename gives a handle that the owner chooses; a suspension bans through Supabase Auth until its end; none closes the report.
  await owner.act(await report(), { action: 'rename', handle: `player-${tag}`, facts: 'Your handle insults a group of people.', rule: 'Terms: handles.' });
  expect(await handleOf(b)).toBe(`player-${tag}`);
  const ban = await owner.act(await report('harassment'), { action: 'suspension', days: 7, facts: 'You sent the same preset to harass a player.', rule: 'Terms: no harassment.' });
  const banned = async () => (await rows('select banned_until from auth.users where id=$1', [b]))[0].banned_until;
  expect(Math.abs((await banned()).getTime() - later(7).getTime())).toBeLessThan(60_000);
  await owner.appeal(ban.action_id!, { status: 'reversed', note: 'Wrong player.' });
  expect(await banned()).toBeNull();
  const none = await report('other');
  expect(await owner.act(none, { action: 'none' })).toEqual({ action_id: null });
  expect((await rows('select status,outcome from public.reports where id=$1', [none]))[0]).toEqual({ status: 'closed', outcome: 'none' });
  expect((await owner.show(first)).actions).toHaveLength(3);
 }, 30000);

 it('asks for a deletion with a 7-day grace that a sign-in cancels, and holds a reported player’s data', async () => {
  const [x, y, z] = [await user('del'), await user('held'), await user('rpc')];
  const asked = await accounts.requestDeletion(x);
  expect(new Date(asked.deletion!.run_after).getTime() - new Date(asked.deletion!.requested_at).getTime()).toBe(7 * DAY);
  expect((await accounts.requestDeletion(x)).deletion).toEqual(asked.deletion); // a second request keeps the date
  await admin.query('insert into auth.sessions(user_id) values($1)', [x]); // a new sign-in
  expect((await accounts.profile(x)).deletion).toBeNull();
  expect((await accounts.requestDeletion(x)).deletion).not.toBeNull(); // after a cancel, a new grace
  expect((await accounts.cancelDeletion(x)).deletion).toBeNull();
  // The website's "Delete my account" asks for the same deletion.
  const rpc = async () => { const client = await admin.connect(); try { await client.query('begin'); await client.query("select set_config('request.jwt.claim.sub',$1,true)", [z]); await client.query('select public.delete_my_account()'); await client.query('commit'); } finally { client.release(); } };
  await rpc(); const kept = (await accounts.profile(z)).deletion; await rpc();
  expect([kept?.run_after, (await accounts.profile(z)).deletion]).toEqual([expect.any(String), kept]);
  expect(await rows('select count(*)::int as n from auth.users where id=$1', [z])).toEqual([{ n: 1 }]);
  // An NCA hold on a report against the player: the deletions job skips the player (src/online/jobs.db.test.ts), and the player is not told.
  await accounts.requestDeletion(y);
  const report = await safety.report(x, { target: 'player', user_id: y, category: 'child_safety_or_illegal' });
  const { hold_until } = await owner.hold(report.id, { nca_reference: 'NCA-TEST-1' });
  expect(Math.abs(new Date(hold_until).getTime() - later(365).getTime())).toBeLessThan(60_000);
  expect((await owner.hold(report.id, { nca_reference: 'NCA-TEST-1', days: 30 })).hold_until).toBe(hold_until); // a hold only grows
  expect(Object.keys((await accounts.profile(y)).deletion!)).toEqual(['requested_at', 'run_after']);
 }, 30000);

 it('keeps alert choices with defaults and partial changes', async () => {
  const x = await user();
  expect(await accounts.notificationPrefs(x)).toEqual({ turn: { email: true, push: false }, reminder: { email: true, push: false }, game_finished: { email: false, push: false } });
  await Promise.all([accounts.setNotificationPrefs(x, { turn: { push: true } }), accounts.setNotificationPrefs(x, { turn: { email: false } })]);
  expect((await accounts.setNotificationPrefs(x, { game_finished: { email: true } }))).toEqual({ turn: { email: false, push: true }, reminder: { email: true, push: false }, game_finished: { email: true, push: false } });
  for (const bad of [{ digest: { email: true } }, { turn: { sms: true } }, { turn: { email: 'no' } }]) await expect(accounts.setNotificationPrefs(x, bad), JSON.stringify(bad)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
 });

 it('gives the runtime role what the services need and no more', async () => {
  for (const statement of [
   'select * from public.mod_actions', 'select note from public.reports', 'update public.reports set hold_until=null', 'delete from public.reports',
   "insert into public.reports(source,target,category) values('automatic','player','other')",
   "insert into public.reserved_handles(handle,reason) values('free-me','old')", 'delete from public.reserved_handles',
   'update public.account_deletions set done_at=now()', 'delete from public.account_deletions', 'update public.profiles set rating=1',
   // The grace is a trust boundary: no date written by this role (where false: refused before any row is read).
   'insert into public.account_deletions(user_id,run_after) select gen_random_uuid(),now() where false', 'update public.account_deletions set run_after=now() where false',
   'update public.account_deletions set requested_at=now() where false',
   'select avatar_url from public.profiles', 'select * from auth.sessions', 'update auth.users set banned_until=null',
  ]) await expect(runtime.query(statement), statement).rejects.toMatchObject({ code: '42501' });
 });

 it('runs the owner command line over the same functions', async () => {
  const [a, b] = [await user('cli'), await user('clo')];
  const { id } = await safety.report(a, { target: 'player', user_id: b, category: 'other', note: 'Seen in the CLI.' });
  // A note that came in before the service refused controls: the output escapes them, and the JSON keeps the text.
  const raw = 'Old \u009b2J \u202e\u007f note.', old = Number((await rows(`insert into public.reports(reporter_id,reported_id,target,category,note) values($1,$2,'player','other',$3) returning id`, [a, b, raw]))[0].id);
  const mod = (...args: string[]) => promisify(execFile)(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('../../tools/mod.ts', import.meta.url)), ...args], { env: { ...process.env, KINGDOWN_ADMIN_DATABASE_URL: url } });
  const listed = (await mod('list')).stdout;
  expect(listed).not.toMatch(/[\u007f-\u009f\u202e]/);
  expect(JSON.parse(listed).find((entry: { id: number }) => entry.id === old)).toMatchObject({ note: raw });
  expect(JSON.parse(listed).find((entry: { id: number }) => entry.id === id)).toMatchObject({ category: 'other', note: 'Seen in the CLI.' });
  expect(JSON.parse((await mod('act', String(id), 'warning', '--facts', 'You left games.', '--rule', 'Terms: play on.')).stdout).action_id).toEqual(expect.any(Number));
  expect(JSON.parse((await mod('show', String(id))).stdout)).toMatchObject({ status: 'closed', outcome: 'warning', actions: [{ action: 'warning' }] });
  await expect(mod('act', String(id), 'ban')).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining('INVALID_INPUT') });
 }, 30000);
});
