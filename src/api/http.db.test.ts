/**
 * Opt-in tests of /api and /internal over real HTTP and PostgreSQL, driven by the website client, with session tokens
 * from a local key set. The services run as a copy of the reviewed runtime role. PLUGIN_TEST_DATABASE_URL must name a
 * disposable loopback database; the tests make and use their own copy of it (the name with "_api" before "_test"),
 * because the jobs act on every game in the database.
 */
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { View } from '../match/protocol';
import { GameService } from '../match/service';
import { PostgresMatchStore } from '../match/store';
import { AccountService } from '../online/accounts';
import { onlineClient, type OnlineClient } from '../online/client';
import { fakeSender } from '../online/mail';
import { SafetyService } from '../online/safety';
import { createApiHandler, createInternalHandler, sessionVerifier } from './http';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';

const url = process.env.PLUGIN_TEST_DATABASE_URL, supabase = 'https://project.supabase.co', secret = randomUUID() + randomUUID();
const suite = url ? describe : describe.skip;
const plain = (view: View) => view.legal.find(lan => !lan.includes('!'))!;

suite('website API and jobs on PostgreSQL (runtime role, website sessions)', () => {
 let own: URL, admin: pg.Pool, runtime: pg.Pool, server: Server, address: string, sign: (sub: string) => Promise<string>;
 const role = `api_test_${randomUUID().replaceAll('-', '')}`, users: string[] = [], tag = randomUUID().slice(0, 6), sender = fakeSender();
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 const locked = (sql: string) => withRoleLock(own.href, () => admin.query(sql));
 /** A website identity: a signed-in user with a handle, and the client the website would use. */
 async function player(name: string): Promise<{ id: string; api: OnlineClient; handle: string }> {
  const id = randomUUID(), handle = `${name}-${tag}`; users.push(id);
  await admin.query('insert into auth.users(id,email) values($1,$2)', [id, `${id}@example.com`]);
  await admin.query('update public.profiles set handle=$2 where id=$1', [id, handle]);
  return { id, handle, api: onlineClient({ token: () => sign(id), origin: address, wait: async () => {} }) };
 }
 const internal = (path: string, key = secret) => fetch(`${address}/internal/${path}`, { method: 'POST', headers: { 'X-Kingdown-Internal': key, 'Content-Type': 'application/json' }, body: '{}' });

 beforeAll(async () => {
  own = await ownTestDatabase('api');
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  const password = randomUUID();
  await locked(`${(await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8')).replaceAll('kingdown_plugin_runtime', role)}; alter role ${role} password '${password}'`);
  const runtimeUrl = new URL(own.href); runtimeUrl.username = role; runtimeUrl.password = password;
  runtime = new pg.Pool({ connectionString: runtimeUrl.href, max: 4 });
  const store = new PostgresMatchStore(runtime), games = new GameService(store);
  const pair = await generateKeyPair('ES256'), keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: 'local', alg: 'ES256' }] });
  sign = sub => { const now = Math.floor(Date.now() / 1000); return new SignJWT({ iss: `${supabase}/auth/v1`, aud: 'authenticated', sub, role: 'authenticated', is_anonymous: false, iat: now, exp: now + 600 }).setProtectedHeader({ alg: 'ES256', kid: 'local' }).sign(pair.privateKey); };
  server = createServer(); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  address = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const api = createApiHandler({ games, accounts: new AccountService(store), safety: new SafetyService(store), publicOrigin: address, verify: sessionVerifier(supabase, keys) });
  const jobs = createInternalHandler({ games, publicOrigin: address, secret, sender: () => sender });
  // The same dispatch as the function entry (tools/plugin-server.mjs).
  server.on('request', (req, res) => { void (/^\/internal(\/|$)/.test(req.url!) ? jobs : api)(req, res); });
 }, 60_000);
 afterAll(async () => {
  server?.closeAllConnections(); await new Promise(done => server?.close(done));
  await runtime?.end();
  if (!admin) return;
  await admin.query('delete from public.reports where reporter_id=any($1) or reported_id=any($1)', [users]);
  await admin.query('delete from public.games g where created_by=any($1) or exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))', [users]);
  await admin.query('delete from public.account_deletions where user_id=any($1)', [users]);
  await admin.query('delete from auth.users where id=any($1)', [users]);
  await admin.query('delete from public.outbox'); // this database is the suite's own
  await locked(`drop owned by ${role}; drop role ${role}`);
  await admin.end();
 });

 it('plays a Daily friend game between two website identities, with retries that apply once', async () => {
  const [ann, bob] = [await player('ann'), await player('bob')];
  const { view: created, invite } = await ann.api.create({ kind: 'friend', speed: 'daily', days_per_move: 1, colour: 'white' });
  expect([created.status, created.seat, created.days_per_move, invite!.url]).toEqual(['waiting', 0, 1, `${address}/j/${invite!.token}`]);
  const id = created.game_id;
  const joined = await bob.api.redeem({ code: `${invite!.code.slice(0, 3).toLowerCase()}-${invite!.code.slice(3)}` });
  expect([joined.game_id, joined.seat, joined.status, joined.opponent?.handle]).toEqual([id, 1, 'playing', ann.handle]);
  expect((await ann.api.games()).map(entry => [entry.game_id, entry.action])).toEqual([[id, 'ready']]);
  let view = await ann.api.game(id);
  expect([view.revision, view.rules !== undefined, view.legal.length > 0]).toEqual([1, true, true]);

  // A lost reply: the server applied the turn, the client sends it again with the same ID, and it applies once.
  let lost = true;
  const flaky = onlineClient({ token: () => sign(ann.id), origin: address, wait: async () => {}, fetch: async (...args) => { const response = await fetch(...args); if (lost) { lost = false; throw new TypeError('network'); } return response; } });
  const first = plain(view), ack = await flaky.command(id, 1, { type: 'turn', actions: [first] }, 'ann-1');
  expect([ack.type, ack.command_id, ack.revision, ack.view.turn, ack.view.action]).toEqual(['ack', 'ann-1', 2, 1, 'waiting']);
  expect((await ann.api.command(id, 1, { type: 'turn', actions: [first] }, 'ann-1')).revision).toBe(2);
  expect((await rows("select count(*)::int as n from public.game_commands where game_id=$1 and command_id='ann-1'", [id]))[0].n).toBe(1);
  await expect(ann.api.command(id, 1, { type: 'resign' }, 'ann-1')).rejects.toMatchObject({ code: 'COMMAND_CONFLICT', status: 409 });
  // The turn email to Black is queued in the same transaction.
  expect(await rows("select payload->>'revision' as revision from public.outbox where kind='turn' and payload->>'user_id'=$1 and payload->>'game_id'=$2", [bob.id, id])).toEqual([{ revision: '2' }]);

  const since = await bob.api.game(id, 1);
  expect([since.rules, since.last_commands.map(c => [c.seq, c.seat, c.action.type])]).toEqual([undefined, [[2, 0, 'turn']]]);
  await expect(bob.api.command(id, 1, { type: 'turn', actions: [plain(since)] })).rejects.toMatchObject({ code: 'STALE_REVISION' });
  await expect(ann.api.command(id, 2, { type: 'turn', actions: [first] })).rejects.toMatchObject({ code: 'WRONG_TURN', status: 403 });
  await bob.api.command(id, 2, { type: 'say', preset: 'good_luck' });
  await bob.api.command(id, 3, { type: 'draw', choice: 'offer' });
  view = (await ann.api.command(id, 4, { type: 'draw', choice: 'decline' })).view;
  expect([view.draw_offer, view.last_commands.at(-3)?.action]).toEqual([null, { type: 'say', preset: 'good_luck' }]);
  view = (await bob.api.command(id, 5, { type: 'turn', actions: [plain(await bob.api.game(id))] })).view;
  view = (await ann.api.command(id, 6, { type: 'turn', actions: [plain(await ann.api.game(id))] })).view;
  const done = (await bob.api.command(id, 7, { type: 'resign' })).view;
  expect([done.status, done.result, done.action]).toEqual(['finished', { winner: 0, reason: 'resignation' }, 'done']);
  expect([(await ann.api.game(id)).result, await ann.api.games(), await bob.api.games()]).toEqual([{ winner: 0, reason: 'resignation' }, [], []]);
  await expect(bob.api.game(randomUUID())).rejects.toMatchObject({ code: 'NOT_FOUND' });
  await expect((await player('cy')).api.game(id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
 }, 60_000);

 it('gives a new invitation, joins by link, and allows 10 short-code tries in an hour', async () => {
  const [dan, eve, fay] = [await player('dan'), await player('eve'), await player('fay')];
  const { view, invite } = await dan.api.create({ kind: 'friend', colour: 'white' });
  const again = await dan.api.invite(view.game_id);
  await expect(eve.api.redeem({ token: invite!.token })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  for (let i = 0; i < 10; i++) await expect(eve.api.redeem({ code: 'ZZZZZZ' })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  await expect(eve.api.redeem({ code: again.code })).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  await expect(eve.api.redeem({ code: 'abc' })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  // The link token cannot be guessed, so it is not counted; another player has their own count.
  expect((await eve.api.redeem({ token: again.token })).status).toBe('playing');
  expect((await eve.api.redeem({ token: again.token })).seat).toBe(1); // a retry returns the game
  await expect(fay.api.redeem({ code: again.code })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  await admin.query("update public.invite_code_tries set window_start=now()-interval '61 minutes' where user_id=$1", [eve.id]);
  await expect(eve.api.redeem({ code: 'ZZZZZZ' })).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  expect((await rows('select tries from public.invite_code_tries where user_id=$1', [eve.id]))[0].tries).toBe(1);
  // A block refuses the join both ways.
  const { invite: next } = await fay.api.create({ kind: 'friend' });
  await dan.api.relate('block', { handle: fay.handle });
  await expect(dan.api.redeem({ token: next!.token })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await expect(dan.api.create({ kind: 'friend', days_per_move: 3, speed: 'live' })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
 }, 60_000);

 it('serves the account, relation and report routes for the signed-in player only', async () => {
  const [gus, hal] = [await player('gus'), await player('hal')];
  expect((await gus.api.profile())).toMatchObject({ user_id: gus.id, handle: gus.handle, quiet_mode: false, deletion: null });
  expect((await gus.api.updateProfile({ quiet_mode: true, icon: 'rook' }))).toMatchObject({ quiet_mode: true, icon: 'rook' });
  expect((await gus.api.setHandle(`gus2-${tag}`)).handle).toBe(`gus2-${tag}`);
  await expect(hal.api.setHandle(`gus-${tag}`)).rejects.toMatchObject({ code: 'HANDLE_TAKEN', status: 409 });
  expect((await gus.api.requestDeletion()).deletion).not.toBeNull();
  expect((await gus.api.cancelDeletion()).deletion).toBeNull();
  expect((await gus.api.setNotifications({ turn: { email: false } })).turn).toEqual({ email: false, push: false });
  expect((await gus.api.notifications()).reminder).toEqual({ email: true, push: false });
  const { view, invite } = await gus.api.create({ kind: 'friend' });
  await hal.api.redeem({ token: invite!.token });
  await gus.api.relate('follow', { game_id: view.game_id });
  expect((await gus.api.relations()).map(r => [r.kind, r.handle])).toEqual([['follow', hal.handle]]);
  await gus.api.unrelate('follow', { handle: hal.handle });
  expect(await gus.api.relations()).toEqual([]);
  expect(await hal.api.relations()).toEqual([]);
  // A report reaches the owner's queue with the reporter from the session, never from input.
  const report = await hal.api.report({ target: 'handle', category: 'offensive_handle', game_id: view.game_id, note: 'rude' });
  expect(await rows('select reporter_id,reported_id,content,status from public.reports where id=$1', [report.id])).toEqual([{ reporter_id: hal.id, reported_id: gus.id, content: `gus2-${tag}`, status: 'open' }]);
  await expect(hal.api.report({ target: 'player', category: 'other', handle: gus.handle, reporter_id: gus.id } as never)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  expect((await new SafetyService(new PostgresMatchStore(admin)).queue()).some(row => row.id === report.id)).toBe(true);
 }, 60_000);

 it('runs the jobs through /internal with the secret only', async () => {
  const [ida, jo] = [await player('ida'), await player('jo')];
  const { view, invite } = await ida.api.create({ kind: 'friend', colour: 'white' });
  await jo.api.redeem({ token: invite!.token }); // the turn passes to White: a turn email for Ida
  for (const key of ['', 'wrong', secret.slice(1)]) expect((await internal('tick', key)).status).toBe(403);
  // Ida was here when she made the game; an hour later the 60-second rule lets the email go.
  await admin.query("update public.game_players set last_seen_at=now()-interval '1 hour' where game_id=$1", [view.game_id]);
  const outbox = await internal('outbox');
  expect([outbox.status, (await outbox.json()).sent >= 1]).toEqual([200, true]);
  expect(sender.sent.filter(mail => mail.to === `${ida.id}@example.com`).map(mail => mail.text.includes(`/g/${view.game_id}`))).toEqual([true]);
  expect(await (await internal('reminders')).json()).toEqual({ queued: 0 });
  await admin.query("update public.games set deadline_at=now()-interval '1 minute' where id=$1", [view.game_id]);
  expect(await (await internal('tick')).json()).toEqual({ ended: 1 });
  expect((await jo.api.game(view.game_id)).result).toEqual({ winner: null, reason: 'no_start' });
  expect(await (await internal('daily')).json()).toMatchObject({ deleted: 0, invites: expect.any(Number), outbox: expect.any(Number) });
  expect((await fetch(`${address}/internal/tick`, { headers: { 'X-Kingdown-Internal': secret } })).status).toBe(405);
 }, 60_000);
});
