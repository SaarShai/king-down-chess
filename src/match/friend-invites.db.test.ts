/** Friend invitations use a disposable local database and separate connections. */
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { GameService } from './service';
import { PostgresMatchStore } from './store';
import { AccountService } from '../online/accounts';
import { INVITE_NOTICES } from './invite-notices';
import { readFile } from 'node:fs/promises';
import { DEFAULT_OPTIONS } from './setup';
const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
suite('friend invitation transactions', () => {
 let admin: pg.Pool, pools: pg.Pool[], services: GameService[], users: string[];
 beforeAll(async () => {
  const own = await ownTestDatabase('friendinvites');
  pools = [0, 1].map(() => new pg.Pool({ connectionString: own.href, max: 1 })); admin = new pg.Pool({ connectionString: own.href, max: 2 });
  services = pools.map(pool => new GameService(new PostgresMatchStore(pool), 'local-test-invitation-secret-32-characters'));
 }, 120000);
 beforeEach(async () => {
  await admin.query('delete from public.games'); await admin.query('delete from auth.users'); await admin.query('delete from public.reserved_handles');
  users = [randomUUID(), randomUUID(), randomUUID()];
  for (const [i, user] of users.entries()) {
   await admin.query('insert into auth.users(id) values($1)', [user]);
   await admin.query('update public.profiles set handle=$2 where id=$1', [user, ['mira', 'rowan', 'alex'][i]]);
  }
 });
 afterAll(async () => { if (pools) await Promise.all([...pools, admin].map(pool => pool.end())); });
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 const send = (n = 0, command = randomUUID()) => services[n].create(users[0], { kind: 'friend', options: DEFAULT_OPTIONS, recipient_id: users[1] }, command);
 it('creates the game and named invitation in one write and returns the same receipt', async () => {
  const command = randomUUID(), sent = await send(0, command);
  expect(sent.invite_id).toEqual(expect.any(String));
  expect(await send(1, command)).toMatchObject({ game_id: sent.game_id, invite_id: sent.invite_id });
  expect((await admin.query('select recipient_id,state from public.game_invites')).rows).toEqual([{ recipient_id: users[1], state: 'open' }]);
 });
 it('refuses a third pending named invitation and leaves no extra game', async () => {
  await send(); await send();
  await expect(send()).rejects.toMatchObject({ code: 'FRIEND_INVITE_LIMIT', status: 409 });
  expect((await admin.query('select count(*)::int as n from public.games')).rows[0].n).toBe(2);
 });
 const open = (n = 0) => services[n].create(users[0], { kind: 'friend', options: DEFAULT_OPTIONS, open_link: true }, randomUUID());
 const join = (view: { invite_id?: string | null }, n = 0) => services[n].join(users[1], { invite_id: view.invite_id });
 const abort = (view: { game_id: string; revision: number }, n = 0) => services[n].command(users[0], view.game_id, { command_id: randomUUID(), expected_revision: view.revision, action: { type: 'abort' } });
 async function paired(count: number, status = 'setup') {
  const template = await services[0].create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  await admin.query('update public.game_players set user_id=$2 where game_id=$1 and user_id is null', [template.game_id, users[1]]);
  await admin.query("update public.games set status=$2 where id=$1", [template.game_id, status]);
  for (let i = 1; i < count; i++) {
   const id = randomUUID();
   await admin.query("insert into public.games select (jsonb_populate_record(null::public.games,to_jsonb(g)||jsonb_build_object('id',$2::text))).* from public.games g where id=$1", [template.game_id, id]);
   await admin.query("insert into public.game_players select (jsonb_populate_record(null::public.game_players,to_jsonb(p)||jsonb_build_object('game_id',$2::text))).* from public.game_players p where game_id=$1", [template.game_id, id]);
  }
  return template;
 }
 async function race(actions: (() => Promise<unknown>)[]) {
  const blocker = await admin.connect();
  await blocker.query('begin');
  const first = users[0];
  await blocker.query('select pg_advisory_xact_lock(hashtextextended($1,0))', [`account:${first}`]);
  const clients = await Promise.all(pools.map(pool => pool.connect()));
  try { expect(new Set(await Promise.all(clients.map(async c => (await c.query('select pg_backend_pid() as pid')).rows[0].pid))).size).toBe(2); }
  finally { clients.forEach(c => c.release()); }
  const results = Promise.allSettled(actions.map(f => f()));
  try {
   await expect.poll(async () => (await admin.query("select count(*)::int as n from pg_stat_activity where datname=current_database() and wait_event='advisory' and query like 'select pg_advisory_xact_lock(hashtextextended%' ")).rows[0].n, { timeout: 5000 }).toBe(2);
  } finally { await blocker.query('rollback'); blocker.release(); }
  return results;
 }
 async function oneWinner(actions: (() => Promise<unknown>)[], loser: string) {
  const results = await race(actions);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.find(r => r.status === 'rejected')).toMatchObject({ reason: { code: loser } });
  return results;
 }
 it('hides private details from a wrong recipient with a token or ID', async () => {
  const sent = await send(), key = sent.invite!.token;
  for (const action of [() => services[0].preview(users[2], key), () => services[0].join(users[2], key), () => services[0].join(users[2], { invite_id: sent.invite_id }), () => services[0].declineInvite(users[2], sent.invite_id!)]) {
   await expect(action()).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE', message: INVITE_NOTICES.unavailable, details: undefined });
  }
  expect((await rows('select user_id from public.game_players where game_id=$1 and seat=1', [sent.game_id]))[0].user_id).toBeNull();
 });
 it('keeps the recipient and expiry on rotation; reads keep the identity', async () => {
  const sent = await send(), expires = sent.invite!.expires_at;
  expect((await services[0].view(users[0], sent.game_id)).invite_id).toBe(sent.invite_id);
  expect((await services[0].invitations(users[1])).invitations[0]).toMatchObject({ invite_id: sent.invite_id, direction: 'incoming', player: { handle: 'mira' } });
  const rotated = await services[0].invite(users[0], sent.game_id, { rotate: true });
  expect(rotated).toMatchObject({ recipient_id: users[1], expires_at: expires }); expect(rotated.invite_id).not.toBe(sent.invite_id);
  await expect(services[0].join(users[1], sent.invite!.token)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  expect(await services[0].join(users[1], rotated.token)).toMatchObject({ status: 'setup' });
 });
 it('checks recipient settings, follows and blocks in the correct direction', async () => {
  const accounts = new AccountService(services[0].store);
  await accounts.updateSettings(users[0], { challenge_from: 'nobody' });
  const first = await send();
  await accounts.updateSettings(users[1], { challenge_from: 'follows' });
  await expect(join(first)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  await expect(send()).rejects.toMatchObject({ code: 'FORBIDDEN', message: INVITE_NOTICES.permission });
  await accounts.relate(users[0], { kind: 'follow', user_id: users[1] });
  await expect(send()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await accounts.relate(users[1], { kind: 'follow', user_id: users[0] });
  const second = await send();
  for (const who of [0, 1]) {
   await accounts.relate(users[who], { kind: 'block', user_id: users[1-who] });
   await expect(join(second)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
   expect((await services[0].invitations(users[1])).invitations).toHaveLength(0);
   await accounts.unrelate(users[who], { kind: 'block', user_id: users[1-who] });
   await accounts.relate(users[1], { kind: 'follow', user_id: users[0] });
  }
  expect(await join(second)).toMatchObject({ status: 'setup' });
 });
 it('keeps the user ID after a rename and returns current handles', async () => {
  const sent = await send(), accounts = new AccountService(services[0].store);
  await accounts.setHandle(users[1], { handle: 'new-rowan' });
  expect((await services[0].invitations(users[0])).invitations[0].player?.handle).toBe('new-rowan');
  await expect(services[0].friends(users[0], { handle: 'rowan' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  expect((await services[0].friends(users[0], { handle: 'new-rowan' })).friends[0].user_id).toBe(users[1]);
  expect(await join(sent)).toMatchObject({ status: 'setup' });
 });
 it('ends received waiting games and removes invites at actual deletion', async () => {
  const sent = await send();
  await admin.query("insert into public.account_deletions(user_id,requested_at,run_after) values($1,now()-interval '8 days',now()-interval '1 day')", [users[1]]);
  expect((await rows('select kingdown_jobs.delete_account($1) as done', [users[1]]))[0].done).toBe(true);
  expect(await rows('select * from public.game_invites')).toEqual([]);
  expect((await rows('select status,result from public.games where id=$1', [sent.game_id]))[0]).toEqual({ status: 'aborted', result: null });
  await expect(services[0].join(users[2], sent.invite!.token)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
 });
 it('pages invitation rows independently and returns no raw tokens', async () => {
  const first = await send(), second = await send();
  const page = await services[0].invitations(users[1], { limit: 1 });
  expect(page.invitations).toHaveLength(1); expect(page.next_before).toBeTruthy();
  const next = await services[0].invitations(users[1], { limit: 1, before: page.next_before });
  expect(new Set([...page.invitations, ...next.invitations].map(i => i.invite_id))).toEqual(new Set([first.invite_id, second.invite_id]));
  expect(JSON.stringify(page)).not.toContain(first.invite!.token); expect(JSON.stringify(page)).not.toContain(first.invite!.code);
 });
 it('returns distinct recent opponents before follows with a bounded cursor', async () => {
  await paired(2);
  const accounts = new AccountService(services[0].store);
  await accounts.relate(users[0], { kind: 'follow', user_id: users[1] }); await accounts.relate(users[0], { kind: 'follow', user_id: users[2] });
  const first = await services[0].friends(users[0], { limit: 1 });
  expect(first.friends).toEqual([{ user_id: users[1], handle: 'rowan', icon: null, source: 'recent' }]);
  expect((await services[0].friends(users[0], { limit: 1, after: first.next_after })).friends).toEqual([{ user_id: users[2], handle: 'alex', icon: null, source: 'follow' }]);
 });
 it.each(['decline', 'cancel'] as const)('%s races accept: one terminal action wins on separate connections', async action => {
  const sent = await send();
  const results = await race([() => join(sent, 1), () => action === 'decline' ? services[0].declineInvite(users[1], sent.invite_id!) : abort(sent)]);
  const invite = (await rows('select state from public.game_invites'))[0];
  expect(['accepted', action === 'decline' ? 'declined' : 'cancelled']).toContain(invite.state);
  const game = (await rows('select status,result from public.games'))[0];
  expect(game.status).toBe(invite.state === 'accepted' ? 'setup' : 'aborted'); expect(game.result).toBeNull();
  expect(results.filter(r => r.status === 'fulfilled').length).toBeGreaterThanOrEqual(1);
  if (action === 'decline') expect(await services[0].declineInvite(users[1], sent.invite_id!)).toMatchObject({ state: invite.state });
 });
 it('uses database expiry at equality and frees the slot before a sweep', async () => {
  const sent = await send(); await send();
  const real = services[0].store.now.bind(services[0].store);
  const clock = vi.spyOn(services[0].store, 'inviteExpired').mockImplementation(async client => {
   return (await client.query('with exact as (update public.game_invites set expires_at=statement_timestamp() where token_hash=$1 returning expires_at) select expires_at<=statement_timestamp() as expired from exact', [sent.invite_id])).rows[0].expired;
  });
  try { await expect(join(sent)).rejects.toMatchObject({ message: INVITE_NOTICES.expired }); } finally { clock.mockRestore(); }
  await admin.query('update public.game_invites set expires_at=statement_timestamp() where token_hash=$1', [sent.invite_id]);
  expect(await send()).toMatchObject({ status: 'waiting' });
  expect(await real()).toBeInstanceOf(Date);
 });
 it.each(['decline', 'cancel', 'accept'] as const)('%s frees only its own pending slot', async action => {
  const sent = await send(); await send();
  if (action === 'decline') await services[0].declineInvite(users[1], sent.invite_id!);
  if (action === 'cancel') await abort(sent);
  if (action === 'accept') await join(sent);
  await send(); await expect(send()).rejects.toMatchObject({ code: 'FRIEND_INVITE_LIMIT' });
 });
 it('counts setup, playing and reverse games; retains old excess counts', async () => {
  await paired(6); await admin.query("update public.games set kind='friend',status='playing' where id=(select id from public.games limit 1)");
  await expect(send()).rejects.toMatchObject({ code: 'FRIEND_GAME_LIMIT', details: { count: 6, handle: 'rowan' }, message: INVITE_NOTICES.gameLimit(6, 'rowan') });
  await expect(services[0].create(users[1], { kind: 'friend', options: DEFAULT_OPTIONS, recipient_id: users[0] })).rejects.toMatchObject({ code: 'FRIEND_GAME_LIMIT', details: { count: 6, handle: 'mira' } });
 });
 it('keeps reverse pending counts separate and checks pair limit first', async () => {
  await send(); await send();
  await services[0].create(users[1], { kind: 'friend', options: DEFAULT_OPTIONS, recipient_id: users[0] });
  await paired(5);
  await expect(send()).rejects.toMatchObject({ code: 'FRIEND_GAME_LIMIT' });
 });
 it('races two accepts at four games and returns the winner receipt at five', async () => {
  await paired(4); const a = await send(), b = await send();
  const result = await oneWinner([() => join(a), () => join(b, 1)], 'FRIEND_GAME_LIMIT');
  const winner = result[0].status === 'fulfilled' ? a : b, loser = winner === a ? b : a;
  expect(await join(winner)).toMatchObject({ status: 'setup' });
  expect((await rows('select state from public.game_invites where token_hash=$1', [loser.invite_id]))[0].state).toBe('open');
  expect(await services[0].store.pairCount(admin, users[0], users[1])).toBe(5);
 });
 it('races a friend join against rematch acceptance at four games', async () => {
  const finished = await paired(4), sent = await send();
  await admin.query("update public.games set status='finished',result='draw',end_reason='agreement',rematch_offer=0 where id=$1", [finished.game_id]);
  await paired(1);
  await oneWinner([() => join(sent), () => services[1].command(users[1], finished.game_id, { command_id: randomUUID(), expected_revision: 0, action: { type: 'rematch', choice: 'accept' } })], 'FRIEND_GAME_LIMIT');
 });
 it('races random acceptance against friend acceptance at four games', async () => {
  await paired(4); const sent = await send(), random = await services[0].create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  await oneWinner([() => join(sent), () => services[1].accept(users[1], random.game_id, 'casual')], 'FRIEND_GAME_LIMIT');
 });
 it('races two named sends with one pending slot', async () => {
  await send(); await oneWinner([() => send(), () => send(1)], 'FRIEND_INVITE_LIMIT');
  expect((await rows('select count(*)::int as n from public.games'))[0].n).toBe(2);
 });
 it('races two open-link sends with one slot', async () => {
  await open(); await oneWinner([() => open(), () => open(1)], 'OPEN_INVITE_LIMIT');
  expect((await rows('select count(*)::int as n from public.games'))[0].n).toBe(2);
 });
 it('Find skips a capped pair and joins a different person', async () => {
  await paired(5);
  const capped = await services[0].create(users[0], { kind: 'random', options: DEFAULT_OPTIONS });
  const fresh = await services[0].create(users[2], { kind: 'random', options: DEFAULT_OPTIONS });
  expect(await services[1].find(users[1], DEFAULT_OPTIONS)).toMatchObject({ game_id: fresh.game_id, status: 'setup' });
  expect(await services[0].view(users[0], capped.game_id)).toMatchObject({ status: 'waiting' });
 });
 it('uses pending and pair indexes without a time predicate in an index', async () => {
  await paired(4); await send();
  const client = await admin.connect();
  try {
   await client.query('begin'); await client.query('set local enable_seqscan=off');
   const plan = JSON.stringify((await client.query("explain select game_id from public.game_invites where created_by=$1 and recipient_id=$2 and state='open' and expires_at>statement_timestamp()", [users[0], users[1]])).rows);
   expect(plan).toMatch(/game_invites_(named_pending|recipient_inbox)/);
   const pair = JSON.stringify((await client.query("explain select game_id from public.game_players where user_id=$1 and not computer", [users[0]])).rows);
   expect(pair).toContain('game_players_pair');
   const openPlan = JSON.stringify((await client.query("explain select count(*) from public.game_invites i join public.games g on g.id=i.game_id where i.created_by=$1 and i.recipient_id is null and i.state='open' and i.expires_at>statement_timestamp() and g.status='waiting'", [users[0]])).rows);
   expect(openPlan).toMatch(/Index (Only )?Scan/);
   const pairPlan = JSON.stringify((await client.query("explain select count(distinct g.id) from public.game_players a join public.game_players b on b.game_id=a.game_id join public.games g on g.id=a.game_id where a.user_id=$1 and b.user_id=$2 and not a.computer and not b.computer and g.kind<>'solo' and g.status in ('setup','playing')", [users[0], users[1]])).rows);
   expect(pairPlan).toContain('game_players_pair');
   const definitions = JSON.stringify(await rows("select indexdef from pg_indexes where tablename='game_invites'"));
   expect(definitions).not.toMatch(/now\(\)/i);
  } finally { await client.query('rollback'); client.release(); }
 });
 it('backfills deleted accepted users and unused old invites; rejects duplicates', async () => {
  const sent = await send(), unused = await open(); await join(sent);
  const terminal = await services[0].create(users[0], { kind: 'friend', options: DEFAULT_OPTIONS });
  await services[0].invite(users[0], terminal.game_id); await abort(terminal);
  const sql = await readFile(new URL('../../supabase/migrations/0022_friend_invites.sql', import.meta.url), 'utf8');
  await admin.query('delete from auth.users where id=$1', [users[1]]);
  await admin.query('alter table public.game_invites drop column recipient_id cascade, drop column state cascade, drop column closed_at cascade; alter table public.game_invites drop constraint game_invites_one_game');
  // Deletion removes a named row. Recreate an old accepted row whose used_by is already null.
  await admin.query("insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at,used_at) values($1,$2,$3,1,$4,now()+interval '1 day',now())", ['a'.repeat(64), 'b'.repeat(64), sent.game_id, users[0]]);
  await admin.query("insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at) values($1,$2,$3,1,$4,now()+interval '1 day')", ['c'.repeat(64), 'd'.repeat(64), unused.game_id, users[0]]);
  await expect(admin.query(sql)).rejects.toMatchObject({ message: 'Duplicate invitations for one game. Repair the rows before this migration.' }); await admin.query('rollback');
  await admin.query('delete from public.game_invites where token_hash=$1', ['c'.repeat(64)]);
  await admin.query(sql); await admin.query(sql);
  expect(await rows('select state,used_by from public.game_invites where game_id=$1', [sent.game_id])).toEqual([{ state: 'accepted', used_by: null }]);
  expect(await rows('select state from public.game_invites where game_id=$1', [unused.game_id])).toEqual([{ state: 'open' }]);
  expect(await rows('select state from public.game_invites where game_id=$1', [terminal.game_id])).toEqual([{ state: 'cancelled' }]);
  expect((await rows("select relrowsecurity from pg_class where oid='public.game_invites'::regclass"))[0].relrowsecurity).toBe(true);
 });

 it('shares the lookup and invitation write budget across services', async () => {
  for (let i = 0; i < 60; i++) await services[i % 2].friends(users[0], { handle: 'rowan' });
  await expect(open(1)).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  expect(await rows('select * from public.games')).toEqual([]);
 });
 it('keeps an old excess of open links valid and refuses only the next send', async () => {
  const a = await open(), b = await open();
  // A legacy row can exceed the new cap. Do not revoke the old links.
  const legacy = await services[0].create(users[0], { kind: 'friend', options: DEFAULT_OPTIONS });
  await admin.query("insert into public.game_invites(token_hash,code_hash,game_id,seat,created_by,expires_at) values($1,$2,$3,1,$4,now()+interval '1 day')", ['f'.repeat(64), 'e'.repeat(64), legacy.game_id, users[0]]);
  await expect(open()).rejects.toMatchObject({ code: 'OPEN_INVITE_LIMIT', details: { count: 3 } });
  expect(await services[1].join(users[1], a.invite!.token)).toMatchObject({ status: 'setup' });
  expect(await services[1].join(users[2], b.invite!.token)).toMatchObject({ status: 'setup' });
 });

 it('checks rematch offer and accept, then returns the receipt at the pair cap', async () => {
  const ended = await paired(1);
  await admin.query("update public.games set status='finished',result='draw',end_reason='agreement' where id=$1", [ended.game_id]);
  await paired(4);
  const offered = await services[0].command(users[0], ended.game_id, { command_id: randomUUID(), expected_revision: 0, action: { type: 'rematch', choice: 'offer' } });
  const command = { command_id: randomUUID(), expected_revision: offered.revision, action: { type: 'rematch', choice: 'accept' } };
  const accepted = await services[1].command(users[1], ended.game_id, command);
  expect(accepted.rematch_game_id).toBeTruthy();
  expect(await services[1].command(users[1], ended.game_id, command)).toMatchObject({ rematch_game_id: accepted.rematch_game_id });
  const another = await paired(1);
  await admin.query("update public.games set status='finished',result='draw',end_reason='agreement' where id=$1", [another.game_id]);
  await expect(services[0].command(users[0], another.game_id, { command_id: randomUUID(), expected_revision: 0, action: { type: 'rematch', choice: 'offer' } })).rejects.toMatchObject({ code: 'FRIEND_GAME_LIMIT' });
 });
 it('excludes waiting, solo and terminal games from the pair count', async () => {
  const game = await paired(6);
  await admin.query("update public.games set status='waiting' where id=$1", [game.game_id]);
  await admin.query("update public.games set kind='solo' where id=(select id from public.games where status='setup' limit 1)");
  await admin.query("update public.games set status='aborted',end_reason='abort' where id=(select id from public.games where status='setup' and kind<>'solo' limit 1)");
  await admin.query("update public.games set status='finished',end_reason='agreement',result='draw' where id=(select id from public.games where status='setup' and kind<>'solo' limit 1)");
  expect(await services[0].store.pairCount(admin, users[0], users[1])).toBe(2);
 });

 it('keeps expiry visible after the sweep and uses a new game for a new send', async () => {
  const sent = await send();
  await admin.query("update public.game_invites set expires_at=statement_timestamp()-interval '1 second' where game_id=$1", [sent.game_id]);
  expect(await services[0].sweep()).toBe(1);
  await expect(services[0].preview(users[1], sent.invite!.token)).rejects.toMatchObject({ message: INVITE_NOTICES.expired });
  await expect(join(sent)).rejects.toMatchObject({ message: INVITE_NOTICES.expired });
  await expect(services[0].invite(users[0], sent.game_id)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  expect((await send()).game_id).not.toBe(sent.game_id);
 });

});
