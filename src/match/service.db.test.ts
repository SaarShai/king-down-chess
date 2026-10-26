/** Opt-in integration tests; PLUGIN_TEST_DATABASE_URL must name a disposable real PostgreSQL database. */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { DEFAULT_OPTIONS } from './setup';
import { GameService, TURN_DAYS, UNFINISHED } from './service';
import { LocalMatch, loadMatch } from './index';
import { PostgresMatchStore } from './store';
import { PluginService } from '../plugin/service';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { withRoleLock } from '../../tools/plugin-db/role-lock.mjs';
const CLASSIC_OPTIONS = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
const url = process.env.PLUGIN_TEST_DATABASE_URL;
if (url) {
 const target = new URL(url);
 if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || !target.pathname.endsWith('_test')) throw new Error('Database tests require a disposable loopback database ending in _test');
}
const suite = url ? describe : describe.skip;
const HASTE = { kings: 'Flame:Haste,none', fen: '7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1' };
const command = (expected_revision: number, action: object, command_id: string = randomUUID()) => ({ command_id, expected_revision, action });
const turn = (expected_revision: number, ...actions: string[]) => command(expected_revision, { type: 'turn', actions });

suite('PostgreSQL online games (real connections and processes)', () => {
 let own: URL, pools: pg.Pool[], admin: pg.Pool, games: GameService[];
 const users: string[] = [];
 const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
 async function user(handle?: string) {
  const id = randomUUID(); users.push(id);
  await admin.query('insert into auth.users(id) values($1)',[id]);
  if (handle) await admin.query('update public.profiles set handle=$2 where id=$1',[id,`${handle}${id.slice(0,8)}`]);
  return id;
 }
 /** A started friend game: host White, guest Black, joined by short code (revision 1). */
 async function friend(host: string, guest: string, options: object = {}) {
  const created = await games[0].create(host,'setup' in options ? {kind:'solo',colour:'white',...options} : {kind:'friend',options:CLASSIC_OPTIONS,colour:'white',...options});
  if ('setup' in options) {
   await admin.query("update public.games set kind='friend',status='waiting',speed='daily',days_per_move=3,started_at=null,category='daily-3d/powers/no-cards' where id=$1",[created.game_id]);
   await admin.query("update public.game_players set computer=false,action='waiting' where game_id=$1",[created.game_id]);
  }
  const invite = await games[0].invite(host,created.game_id);
  await games[1].join(guest,invite.code.toLowerCase().replace(/^(...)/,'$1-'));
  return created.game_id;
 }
 const seats = async (gameId: string) => (await rows('select g.turn,g.status,array_agg(p.action order by p.seat) as actions from public.games g join public.game_players p on p.game_id=g.id where g.id=$1 group by g.id',[gameId]))[0];
 let a: string, b: string, c: string;
 beforeAll(async () => {
  own = await ownTestDatabase('service');
  pools = [0,1].map(() => new pg.Pool({connectionString:own.href,max:1})); admin = pools[0];
  games = pools.map(pool => new GameService(new PostgresMatchStore(pool)));
  const server = await admin.query('select version() as version'); expect(server.rows[0].version).toMatch(/^PostgreSQL /);
  [a,b,c] = [await user('ann'),await user('bob'),await user('cy')];
 },120000);
 afterAll(async () => {
  if (!admin) return;
  await admin.query('delete from public.games g where created_by=any($1) or exists(select from public.game_players p where p.game_id=g.id and p.user_id=any($1))',[users]);
  await admin.query('delete from auth.users where id=any($1)',[users]);
  await Promise.all(pools.map(pool => pool.end()));
 });

 it('applies a retried command once and refuses the same ID with other input',async () => {
  const game = await games[0].create(a,{kind:'solo',colour:'white'});
  await expect(games[1].view(b,game.game_id)).rejects.toMatchObject({code:'FORBIDDEN'});
  const first = turn(0,game.legal[0]);
  expect((await games[0].command(a,game.game_id,first)).revision).toBe(1);
  expect((await games[1].command(a,game.game_id,first)).revision).toBe(1);
  await expect(games[1].command(a,game.game_id,{...first,action:{type:'turn',actions:[game.legal[1]]}})).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
  await expect(games[0].command(a,game.game_id,turn(1,game.legal[0]))).rejects.toMatchObject({code:'WRONG_TURN'});
  const ai = command(1,{type:'computer'});
  expect((await Promise.all(games.map(service => service.command(a,game.game_id,ai)))).map(view => view.revision)).toEqual([2,2]);
  expect((await rows('select count(*)::int as n from public.game_commands where game_id=$1',[game.game_id]))[0].n).toBe(2);
 },30000);

 it('applies a Daily turn of two actions as one command, all or nothing',async () => {
  const id = await friend(a,b,{setup:HASTE});
  const before = (await rows('select state,snapshot from public.games where id=$1',[id]))[0];
  for (const actions of [['Ra1-a2!H','Zz9-z9'],['Ra1-a2','Ra2-a3']]) // an illegal second action; an action after the turn passed
   await expect(games[0].command(a,id,turn(1,...actions))).rejects.toMatchObject({code:'INVALID_MOVE'});
  expect((await rows('select state,snapshot,revision from public.games where id=$1',[id]))[0]).toEqual({...before,revision:1});
  const done = await games[0].command(a,id,turn(1,'Ra1-a2!H','Ra2-a3'));
  expect([done.revision,done.turn,done.action]).toEqual([2,1,'waiting']);
  expect(done.last_commands.at(-1)).toMatchObject({seq:2,seat:0,action:{type:'turn',actions:['Ra1-a2!H','Ra2-a3']}});
  expect((await rows('select seat,turns_played from public.game_players where game_id=$1 order by seat',[id])).map(p => p.turns_played)).toEqual([1,0]);
 },30000);

 it('keeps every seat action state on the engine turn after each command, Haste included',async () => {
  const id = await friend(a,b,{setup:HASTE});
  expect(await seats(id)).toEqual({turn:0,status:'playing',actions:['ready','waiting']});
  const notices = async () => (await rows('select count(*)::int as n from public.notifications where user_id=$1 and payload->>\'game_id\'=$2',[b,id]))[0].n;
  await expect(games[0].command(a,id,turn(1,'Ra1-a2!H'))).rejects.toMatchObject({code:'INVALID_MOVE'}); // Haste keeps the same side: the turn is not finished
  expect(await seats(id)).toEqual({turn:0,status:'playing',actions:['ready','waiting']});
  expect(await notices()).toBe(0);
  const passed = await games[0].command(a,id,turn(1,'Ra1-a2!H','Ra2-a3'));
  expect(await seats(id)).toEqual({turn:1,status:'playing',actions:['waiting','ready']});
  expect(await notices()).toBe(1);
  expect((await rows(`select count(*)::int as n from public.outbox where kind='turn' and payload->>'game_id'=$1 and payload->>'user_id'=$2`,[id,b]))[0].n).toBe(1);
  const reply = await games[1].view(b,id);
  expect(reply.deadline_at).toBe(passed.deadline_at);
  await games[1].command(b,id,turn(2,reply.legal[0]));
  expect(await seats(id)).toEqual({turn:0,status:'playing',actions:['ready','waiting']});
  await games[0].command(a,id,command(3,{type:'resign'}));
  expect(await seats(id)).toEqual({turn:0,status:'finished',actions:['done','done']});
  expect((await rows('select bool_or(active) as active from public.game_players where game_id=$1',[id]))[0].active).toBe(false);
 },30000);

 it('refuses an unfinished player turn and keeps the computer to one action for each call (W7 ticket 06)',async () => {
  // Solo games: player b's ten code joins in this file reach the code limit.
  const solo = async (colour: string) => (await games[0].create(a,{kind:'solo',colour,setup:HASTE})).game_id;
  const id = await solo('white'), saved = 'select state,snapshot,revision from public.games where id=$1';
  const before = (await rows(saved,[id]))[0];
  await expect(games[0].command(a,id,turn(0,'Ra1-a2!H'))).rejects.toMatchObject({code:'INVALID_MOVE',message:UNFINISHED});
  expect((await rows(saved,[id]))[0]).toEqual(before);
  expect((await rows("select count(*)::int as n from public.game_commands where game_id=$1 and kind='turn'",[id]))[0].n).toBe(0);
  expect(await games[0].command(a,id,turn(0,'Ra1-a2!H','--'))).toMatchObject({revision:1,turn:1,action:'waiting'});
  // A half turn saved before this check (an old board): a pass or the second move alone ends it.
  for (const end of ['--','Ra2-a3']) {
   const old = await solo('white'), match = await loadMatch((await rows('select state from public.games where id=$1',[old]))[0].state);
   try {
    const half = await match.apply({id:'old-board',expectedRevision:(await match.snapshot()).revision,lan:'Ra1-a2!H'});
    await admin.query('update public.games set state=$2,snapshot=$3 where id=$1',[old,await match.exportSave(),half]);
   } finally { await match.close(); }
   expect(await games[0].command(a,old,turn(0,end))).toMatchObject({revision:1,turn:1,action:'waiting'});
  }
  // The computer: a Haste first move is one call, and the next call ends its turn.
  const computer = await solo('black'), choose = vi.spyOn(LocalMatch.prototype,'chooseMove');
  try {
   choose.mockResolvedValueOnce('Ra1-a2!H');
   const first = await games[0].command(a,computer,command(0,{type:'computer'}));
   expect(first).toMatchObject({revision:1,turn:0,action:'waiting'});
   expect(first.last_commands.at(-1)!.action).toEqual({type:'computer',actions:['Ra1-a2!H']});
   expect(await games[0].command(a,computer,command(1,{type:'computer'}))).toMatchObject({revision:2,turn:1,action:'ready'});
  } finally { choose.mockRestore(); }
 },30000);

 it('refuses self-play in the service and in the database',async () => {
  const created = await games[0].create(a,{kind:'friend',options:CLASSIC_OPTIONS,colour:'black'});
  const invite = await games[0].invite(a,created.game_id);
  await expect(games[0].join(a,invite.token)).rejects.toMatchObject({code:'FORBIDDEN'});
  await expect(admin.query('update public.game_players set user_id=$2 where game_id=$1 and seat=0',[created.game_id,a])).rejects.toMatchObject({code:'23505'});
 });

 it('keeps a Daily friend code for 7 days',async () => {
  const created = await games[0].create(a,{kind:'friend',options:CLASSIC_OPTIONS,colour:'white'}), before = Date.now();
  const left = Date.parse((await games[0].invite(a,created.game_id)).expires_at) - before;
  expect(left).toBeGreaterThanOrEqual(7 * 86_400_000 - 1000);
  expect(left).toBeLessThanOrEqual(7 * 86_400_000 + 60_000);
 });

 it('reports invite replacement on reads without changing the game revision or exposing a redeemable token', async () => {
  const game = await games[0].create(a, { kind: 'friend', options: CLASSIC_OPTIONS });
  expect(game.invite_id).toBeNull();
  const first = await games[0].invite(a, game.game_id);
  expect(first.invite_id).toMatch(/^[a-f0-9]{64}$/);
  expect(first.invite_id).not.toBe(first.token);
  expect((await games[1].view(a, game.game_id)).invite_id).toBe(first.invite_id);
  const second = await games[1].invite(a, game.game_id);
  expect(second.invite_id).not.toBe(first.invite_id);
  expect(await games[0].view(a, game.game_id, game.revision)).toMatchObject({ invite_id: second.invite_id, revision: game.revision });
  expect((await games[0].inbox(a)).find(entry => entry.game_id === game.game_id)?.invite_id).toBe(second.invite_id);
  await expect(games[0].view(b, game.game_id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  await expect(games[0].preview(b, second.invite_id)).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  await expect(games[0].preview(b, first.token)).rejects.toMatchObject({ code: 'INVITE_UNAVAILABLE' });
  expect((await games[0].preview(b, second.token)).kind).toBe('friend');
  expect((await rows('select token_hash from public.game_invites where game_id=$1', [game.game_id]))[0].token_hash).toBe(second.invite_id);
 });

 it('gives one seat to one of two joiners and lets the winner retry',async () => {
  const created = await games[0].create(a,{kind:'friend',options:CLASSIC_OPTIONS,colour:'white'});
  const old = await games[0].invite(a,created.game_id), invite = await games[0].invite(a,created.game_id);
  expect(new Date(invite.expires_at).getTime() - Date.now()).toBeLessThanOrEqual(7 * 86_400_000);
  await expect(games[0].join(b,old.token)).rejects.toMatchObject({code:'INVITE_UNAVAILABLE'});
  const results = await Promise.allSettled([games[0].join(b,invite.token),games[1].join(c,invite.code)]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect((results.find(result => result.status === 'rejected') as PromiseRejectedResult).reason.code).toBe('INVITE_UNAVAILABLE');
  const winner = results[0].status === 'fulfilled' ? b : c;
  const view = await games[1].join(winner,invite.token);
  expect([view.seat,view.status,view.revision,view.opponent?.handle]).toEqual([1,'playing',1,(await rows('select handle from public.profiles where id=$1',[a]))[0].handle]);
  expect((await rows('select token_hash,code_hash from public.game_invites where game_id=$1',[created.game_id]))[0]).not.toMatchObject({token_hash:invite.token});
  const expired = await games[0].create(a,{kind:'friend',options:CLASSIC_OPTIONS,colour:'white'}), late = await games[0].invite(a,expired.game_id);
  expect(new Date(late.expires_at).getTime() - Date.now()).toBeGreaterThan(6 * 86_400_000);
  await admin.query("update public.game_invites set expires_at=now()-interval '1 second' where game_id=$1",[expired.game_id]);
  await expect(games[0].join(b,late.token)).rejects.toMatchObject({code:'INVITE_UNAVAILABLE'});
  await expect(games[0].join(b,'not-a-code')).rejects.toMatchObject({code:'INVALID_INPUT'});
 },30000);

 it('refuses a join across a block or against the host’s challenge setting',async () => {
  const tryJoin = async () => { const created = await games[0].create(a,{kind:'friend',options:CLASSIC_OPTIONS}); return games[0].join(b,(await games[0].invite(a,created.game_id)).token); };
  await admin.query("insert into public.relations(user_id,other_id,kind) values($1,$2,'block')",[b,a]);
  await expect(tryJoin()).rejects.toMatchObject({code:'FORBIDDEN'});
  await admin.query('delete from public.relations where user_id=$1',[b]);
  await admin.query("update public.profiles set challenge_from='follows' where id=$1",[a]);
  await expect(tryJoin()).rejects.toMatchObject({code:'FORBIDDEN'});
  await admin.query("insert into public.relations(user_id,other_id,kind) values($1,$2,'follow')",[a,b]);
  expect((await tryJoin()).status).toBe('playing');
  await admin.query("update public.profiles set challenge_from='nobody' where id=$1",[a]);
  await expect(tryJoin()).rejects.toMatchObject({code:'FORBIDDEN'});
  await admin.query("update public.profiles set challenge_from='signed-in' where id=$1",[a]);
  await admin.query('delete from public.relations where user_id=$1',[a]);
 },30000);

 it('ends Daily games on a missed deadline: the sweep, a late command and a claim',async () => {
  const past = (id: string) => admin.query("update public.games set deadline_at=now()-interval '1 minute' where id=$1",[id]);
  // No first turn: cancelled with no result.
  const silent = await friend(a,b);
  expect((await rows('select deadline_kind,deadline_at-now() > interval \'2 days\' as long from public.games where id=$1',[silent]))[0]).toEqual({deadline_kind:'first_turn',long:true});
  await past(silent);
  expect(await games[1].sweep()).toBeGreaterThanOrEqual(1);
  expect(await games[0].sweep()).toBe(0);
  expect((await rows('select status,result,end_reason from public.games where id=$1',[silent]))[0]).toEqual({status:'aborted',result:null,end_reason:'no_start'});
  // Both sides moved: White's next deadline is days per move; missing it loses on time.
  const late = await friend(a,b);
  await games[0].command(a,late,turn(1,(await games[0].view(a,late)).legal[0]));
  await games[1].command(b,late,turn(2,(await games[1].view(b,late)).legal[0]));
  expect((await rows('select deadline_kind from public.games where id=$1',[late]))[0].deadline_kind).toBe('move');
  await past(late);
  await expect(games[0].command(a,late,turn(3,(await games[0].view(a,late)).legal[0]))).rejects.toMatchObject({code:'MATCH_TERMINAL'});
  const ended = await games[1].view(b,late);
  expect([ended.status,ended.result,ended.last_commands.at(-1)?.action]).toEqual(['finished',{winner:1,reason:'timeout'},{type:'expire'}]);
  expect((await rows(`select count(*)::int as n from public.outbox where kind='game_finished' and payload->>'game_id'=$1`,[late]))[0].n).toBe(1);
  expect((await rows('select moves from public.games where id=$1',[late]))[0].moves).toHaveLength(2);
  // A claim by the side not to move ends the game as its own command.
  const claimed = await friend(a,b);
  await expect(games[1].command(b,claimed,command(1,{type:'claim',reason:'timeout'}))).rejects.toMatchObject({code:'NOT_ALLOWED'});
  await past(claimed);
  const claim = await games[1].command(b,claimed,command(1,{type:'claim',reason:'timeout'}));
  expect([claim.status,claim.result?.reason,claim.last_commands.at(-1)?.action.type]).toEqual(['aborted','no_start','claim']);
 },60000);

 it('gives a new game against a person the one turn time, and an older game keeps its own (F-031)',async () => {
  for (const choice of [{speed:'daily'},{speed:'live'},{days_per_move:1},{days_per_move:7}])
   await expect(games[0].create(a,{kind:'friend',options:CLASSIC_OPTIONS,...choice})).rejects.toMatchObject({code:'INVALID_INPUT'});
  // Fresh players: each join by code counts toward the guest's hourly limit of 10.
  const [host,guest] = [await user('turnhost'),await user('turnguest')];
  const id = await friend(host,guest), days = async () => (await rows('select deadline_kind,round(extract(epoch from deadline_at-now())/86400)::int as days from public.games where id=$1',[id]))[0];
  expect(await games[0].view(host,id)).toMatchObject({speed:'daily',days_per_move:TURN_DAYS});
  await games[0].command(host,id,turn(1,(await games[0].view(host,id)).legal[0]));
  await games[1].command(guest,id,turn(2,(await games[1].view(guest,id)).legal[0]));
  expect(await days()).toEqual({deadline_kind:'move',days:TURN_DAYS});
  // A game made before F-031 keeps its stored 1 or 7 days for each move.
  await admin.query('update public.games set days_per_move=7 where id=$1',[id]);
  await games[0].command(host,id,turn(3,(await games[0].view(host,id)).legal[0]));
  expect(await days()).toEqual({deadline_kind:'move',days:7});
  expect((await games[1].view(guest,id)).days_per_move).toBe(7);
 },30000);

 it.each([
  ['first_turn', 'turn'], ['move', 'turn'], ['first_turn', 'claim'], ['move', 'claim'],
 ] as const)('checks the %s deadline after a %s waits for the game lock', async (kind, action) => {
  const host = await user('lockhost'), guest = await user('lockguest'), id = await friend(host, guest);
  const accepted = command(1, { type: 'say', preset: 'hello' });
  await games[0].command(host, id, accepted);
  if (kind === 'move') {
   await games[0].command(host, id, turn(2, (await games[0].view(host, id)).legal[0]));
   await games[1].command(guest, id, turn(3, (await games[1].view(guest, id)).legal[0]));
  }
  const base = await games[0].view(host, id), before = (await rows('select state,snapshot,deadline_kind from public.games where id=$1', [id]))[0];
  expect(before.deadline_kind).toBe(kind);
  const turns = (await rows('select turns_played from public.game_players where game_id=$1 order by seat', [id])).map(p => p.turns_played);
  const notifications = (await rows("select count(*)::int as n from public.notifications where payload->>'game_id'=$1", [id]))[0].n;
  const blocker = new pg.Client({ connectionString: own.href });
  await blocker.connect();
  let pending: Promise<{ view?: Awaited<ReturnType<GameService['command']>>; error?: unknown }> | undefined;
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
   const started = new Date(), deadline = new Date(started.getTime() + 1000);
   vi.setSystemTime(started);
   await admin.query('update public.games set deadline_at=$2 where id=$1', [id, deadline]);
   await blocker.query('begin');
   const pid = (await blocker.query('select pg_backend_pid() as pid')).rows[0].pid;
   await blocker.query('select from public.games where id=$1 for update', [id]);
   const sent = action === 'turn' ? turn(base.revision, base.legal[0]) : command(base.revision, { type: 'claim', reason: 'timeout' });
   pending = games[1].command(action === 'turn' ? host : guest, id, sent).then(view => ({ view }), error => ({ error }));
   // Observe the real lock wait before advancing only the service clock past its stored deadline.
   await expect.poll(async () => (await rows('select exists(select from pg_stat_activity where $1=any(pg_blocking_pids(pid))) as waiting', [pid]))[0].waiting, { timeout: 10_000 }).toBe(true);
   const checkedAt = new Date(deadline.getTime() + 1); vi.setSystemTime(checkedAt);
   await blocker.query('commit');
   const answer = await pending;
   if (action === 'turn') expect(answer).toMatchObject({ error: { code: 'MATCH_TERMINAL' } });
   else expect(answer).toMatchObject({ view: { revision: base.revision + 1, status: kind === 'first_turn' ? 'aborted' : 'finished' } });
   const ended = (await rows('select state,snapshot,status,result,end_reason,revision,finished_at,deadline_at from public.games where id=$1', [id]))[0];
   expect(ended).toEqual({ state: before.state, snapshot: before.snapshot, status: kind === 'first_turn' ? 'aborted' : 'finished', result: kind === 'first_turn' ? null : 'black', end_reason: kind === 'first_turn' ? 'no_start' : 'timeout', revision: base.revision + 1, finished_at: checkedAt, deadline_at: null });
   expect((await rows('select turns_played from public.game_players where game_id=$1 order by seat', [id])).map(p => p.turns_played)).toEqual(turns);
   expect((await rows("select count(*)::int as n from public.notifications where payload->>'game_id'=$1", [id]))[0].n).toBe(notifications);
   expect(await rows('select kind,actor_id,received_at from public.game_commands where game_id=$1 and seq=$2', [id, ended.revision])).toEqual([{ kind: action === 'turn' ? 'expire' : 'claim', actor_id: action === 'turn' ? null : guest, received_at: checkedAt }]);
   expect((await rows('select count(*)::int as n from public.game_commands where game_id=$1 and command_id=$2', [id, sent.command_id]))[0].n).toBe(action === 'turn' ? 0 : 1);
   const finishedEvents = async () => (await rows("select count(*)::int as n from public.outbox where kind='game_finished' and payload->>'game_id'=$1", [id]))[0].n;
   expect(await finishedEvents()).toBe(1);
   vi.setSystemTime(new Date(checkedAt.getTime() + 86_400_000));
   expect(await games[0].command(host, id, accepted)).toMatchObject({ revision: ended.revision, status: ended.status });
   if (action === 'claim') expect(await games[0].command(guest, id, sent)).toMatchObject({ revision: ended.revision, status: ended.status });
   await expect(games[0].command(host, id, { ...accepted, action: { type: 'say', preset: 'thanks' } })).rejects.toMatchObject({ code: 'COMMAND_CONFLICT' });
   expect(await finishedEvents()).toBe(1);
   expect((await games[0].view(host, id)).revision).toBe(ended.revision);
  } finally {
   await blocker.query('rollback'); await blocker.end();
   if (pending) await pending;
   vi.useRealTimers();
  }
 }, 30_000);

 it('keeps the last revision for a turn or the end of a game: a full history ends as a draw (server audit F5)',async () => {
  // The schema stops at revision 1000; these games start just before it. New players: a short code counts 10 joins in one hour.
  const [w,k] = [await user('wil'),await user('kit')];
  const near = async (revision = 999, late = false) => { const id = await friend(w,k); await admin.query(`update public.games set revision=$2${late ? ",deadline_at=now()-interval '1 minute'" : ''} where id=$1`,[id,revision]); return id; };
  const legal = async (actor: string, id: string) => (await games[0].view(actor,id)).legal[0];
  const drawn = await near(998);
  expect(await games[0].command(w,drawn,turn(998,await legal(w,drawn)))).toMatchObject({status:'playing',revision:999});
  await expect(games[0].command(w,drawn,command(999,{type:'say',preset:'hello'}))).rejects.toMatchObject({code:'MATCH_LIMIT'});
  await expect(games[1].command(k,drawn,command(999,{type:'draw',choice:'offer'}))).rejects.toMatchObject({code:'MATCH_LIMIT'});
  expect(await games[1].command(k,drawn,turn(999,await legal(k,drawn)))).toMatchObject({status:'finished',revision:1000,deadline_at:null,result:{winner:null,reason:'draw50'}});
  expect((await rows("select result,end_reason,snapshot->>'status' as engine from public.games where id=$1",[drawn]))[0]).toEqual({result:'draw',end_reason:'draw50',engine:'playing'});
  await expect(games[0].command(w,drawn,command(1000,{type:'claim',reason:'timeout'}))).rejects.toMatchObject({code:'MATCH_TERMINAL'});
  const accepted = await near();
  await admin.query('update public.games set draw_offer=1 where id=$1',[accepted]);
  expect(await games[0].command(w,accepted,command(999,{type:'draw',choice:'accept'}))).toMatchObject({status:'finished',revision:1000,result:{winner:null,reason:'agreement'}});
  const resigned = await near();
  expect(await games[1].command(k,resigned,command(999,{type:'resign'}))).toMatchObject({status:'finished',revision:1000});
  const claimed = await near(999,true), swept = await near(999,true);
  expect(await games[1].command(k,claimed,command(999,{type:'claim',reason:'timeout'}))).toMatchObject({status:'aborted',revision:1000});
  await games[0].sweep();
  expect((await rows('select status,revision from public.games where id=$1',[swept]))[0]).toEqual({status:'aborted',revision:1000});
 },30000);

 it('runs resign, abort, draw offers and presets through the command log',async () => {
  const id = await friend(a,b);
  await expect(games[1].command(b,id,command(1,{type:'draw',choice:'accept'}))).rejects.toMatchObject({code:'NOT_ALLOWED'});
  const offered = await games[0].command(a,id,command(1,{type:'draw',choice:'offer'}));
  expect(offered.draw_offer).toBe(0);
  await expect(games[0].command(a,id,command(2,{type:'draw',choice:'offer'}))).rejects.toMatchObject({code:'NOT_ALLOWED'});
  expect((await games[1].command(b,id,command(2,{type:'draw',choice:'decline'}))).draw_offer).toBeNull();
  const said = await games[1].command(b,id,command(3,{type:'say',preset:'good_luck'}));
  expect(said.last_commands.at(-1)).toMatchObject({seat:1,action:{type:'say',preset:'good_luck'}});
  await expect(games[1].command(b,id,command(4,{type:'say',preset:'good_luck'}))).rejects.toMatchObject({code:'NOT_ALLOWED'});
  await expect(games[1].command(b,id,command(4,{type:'say',preset:'come to my site'}))).rejects.toMatchObject({code:'INVALID_INPUT'});
  await games[0].command(a,id,turn(4,(await games[0].view(a,id)).legal[0]));
  await games[1].command(b,id,turn(5,(await games[1].view(b,id)).legal[0]));
  await expect(games[0].command(a,id,command(6,{type:'abort'}))).rejects.toMatchObject({code:'NOT_ALLOWED'});
  await games[0].command(a,id,command(6,{type:'draw',choice:'offer'}));
  const drawn = await games[1].command(b,id,command(7,{type:'draw',choice:'accept'}));
  expect([drawn.status,drawn.result,drawn.action]).toEqual(['finished',{winner:null,reason:'agreement'},'done']);
  await expect(games[0].command(a,id,turn(8,'e2-e4'))).rejects.toMatchObject({code:'MATCH_TERMINAL'});
  const aborted = await friend(a,b);
  expect((await games[1].command(b,aborted,command(1,{type:'abort'}))).status).toBe('aborted');
  const waiting = await games[0].create(a,{kind:'friend',options:CLASSIC_OPTIONS});
  expect((await games[0].command(a,waiting.game_id,command(0,{type:'abort'}))).status).toBe('aborted');
  const resigned = await games[0].create(a,{kind:'solo',colour:'black'});
  expect((await games[0].command(a,resigned.game_id,command(0,{type:'resign'}))).result).toEqual({winner:0,reason:'resignation'});
 },60000);

 it('updates only the actor seat activity, at most once each 30 seconds', async () => {
  const [host,guest,stranger] = [await user('seen-host'),await user('seen-guest'),await user('seen-cy')];
  const id = await friend(host,guest);
  const tables = await rows("select tablename from pg_tables where schemaname='public' order by tablename");
  // Ignore only this seat's activity time in the full data comparison.
  const snapshot = () => Promise.all(tables.map(async ({ tablename }) => (await rows(`select to_jsonb(t) as row from public."${tablename}" t order by to_jsonb(t)::text`)).map(({ row }) =>
   tablename === 'game_players' && row.game_id === id && row.user_id === host ? { ...row, last_seen_at: null } : row)));
  const players = () => rows('select * from public.game_players where game_id=$1 order by seat', [id]);
  await admin.query("update public.game_players set last_seen_at=now()-interval '1 hour' where game_id=$1", [id]);
  for (let attempt = 0; attempt < 2; attempt++) {
   const before = await snapshot(), seats = await players();
   await games[1].seen(host,id);
   const after = await players();
   expect(after[0].last_seen_at.getTime()).toBeGreaterThan(seats[0].last_seen_at.getTime());
   expect(after).toEqual([{ ...seats[0], last_seen_at: after[0].last_seen_at }, seats[1]]);
   expect(await snapshot()).toEqual(before);
   await games[1].seen(host,id); expect(await players()).toEqual(after); expect(await snapshot()).toEqual(before);
   if (!attempt) await admin.query("update public.game_players set last_seen_at=now()-interval '31 seconds' where game_id=$1 and user_id=$2", [id,host]);
  }
  const before = await snapshot();
  await expect(games[1].seen(stranger,id)).rejects.toMatchObject({code:'FORBIDDEN',status:403});
  await expect(games[1].seen(host,randomUUID())).rejects.toMatchObject({code:'NOT_FOUND',status:404});
  expect(await snapshot()).toEqual(before);
 },30000);

 it('keeps views small and read-only, and lists your turn first',async () => {
  // Fresh players, so games of the other tests do not join the lists.
  const [d,e,f] = [await user('dee'),await user('eve'),await user('fay')];
  const urgent = await friend(f,d), later = await friend(d,e);
  const view = await games[0].command(d,later,turn(1,(await games[0].view(d,later)).legal[0]));
  expect(Buffer.byteLength(JSON.stringify(view))).toBeLessThan(3000);
  expect(view.rules).toBeUndefined(); expect((await games[0].view(d,later)).rules).toBeDefined();
  expect((await games[0].view(d,later)).history?.actions).toHaveLength(1); expect((await games[0].view(d,later,1)).history).toBeUndefined();
  expect((await games[0].view(d,later,1)).last_commands.map(entry => entry.seq)).toEqual([2]);
  // Only these players' games: other test files write to the same database at the same time.
  const mine = [urgent,later], state = async () => (await rows(`select (select sum(revision)::int from public.games where id=any($1)) as revisions,(select max(updated_at) from public.games where id=any($1)) as updated,
   (select count(*)::int from public.game_commands where game_id=any($1)) as commands,(select count(*)::int from public.notifications where user_id=any($2)) as notices,
   (select count(*)::int from public.outbox where payload->>'game_id'=any($3)) as events,(select max(last_seen_at) from public.game_players where game_id=any($1)) as seen`,[mine,[d,e,f],mine]))[0];
  const before = await state();
  await games[1].view(d,later); await games[1].view(d,later,1); await games[1].inbox(d);
  expect(await state()).toEqual(before);
  const solo = await games[0].create(d,{kind:'solo',colour:'white'});
  expect((await games[0].inbox(d)).map(entry => [entry.game_id,entry.action])).toEqual([[solo.game_id,'ready'],[urgent,'waiting'],[later,'waiting']]); // then the nearest deadline
  await games[0].command(f,urgent,turn(1,(await games[0].view(f,urgent)).legal[0]));
  const inbox = await games[0].inbox(d);
  expect(inbox.map(entry => [entry.game_id,entry.action])).toEqual([[urgent,'ready'],[solo.game_id,'ready'],[later,'waiting']]);
  expect(inbox[0]).toMatchObject({seat:1,kind:'friend',options:CLASSIC_OPTIONS,speed:'daily',opponent:{computer:false,deleted:false}});
 },30000);

 it('keeps the opponent’s game when an account is deleted',async () => {
  const gone = await user('gone'), id = await friend(gone,b);
  const open = await games[0].create(gone,{kind:'friend',options:CLASSIC_OPTIONS}); await games[0].invite(gone,open.game_id);
  await games[0].command(gone,id,turn(1,(await games[0].view(gone,id)).legal[0]));
  await admin.query('delete from auth.users where id=$1',[gone]);
  const view = await games[1].view(b,id);
  expect([view.status,view.revision,view.opponent?.deleted,view.opponent?.handle]).toEqual(['playing',2,true,null]);
  expect((await rows('select handle_at_start is not null as kept from public.game_players where game_id=$1 and seat=0',[id]))[0].kept).toBe(true);
  expect((await rows('select count(*)::int as n,count(actor_id)::int as actors from public.game_commands where game_id=$1',[id]))[0]).toEqual({n:2,actors:1});
  expect((await rows('select count(*)::int as n from public.game_invites where game_id=$1',[open.game_id]))[0].n).toBe(0);
  await games[1].command(b,id,turn(2,view.legal[0]));
  await admin.query('delete from public.games where id=any($1)',[[id,open.game_id]]);
 },30000);

 it('allows exactly one writer across independent PostgreSQL connections',async () => {
  const game = await games[0].create(a,{kind:'solo',colour:'white'});
  const outcomes = await Promise.allSettled(games.map((service,index) => service.command(a,game.game_id,turn(0,game.legal[index]))));
  expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect(outcomes.filter(result => result.status === 'rejected').map(result => (result as PromiseRejectedResult).reason.code)).toEqual(['STALE_REVISION']);
  expect((await rows('select revision,(select count(*)::int from public.game_commands where game_id=$1) as commands from public.games where id=$1',[game.game_id]))[0]).toEqual({revision:1,commands:1});
 },30000);

 it('allows exactly one writer across separate Node processes',async () => {
  const game = await games[0].create(a,{kind:'solo',colour:'white'});
  const clients = [0,1].map(() => fork(fileURLToPath(new URL('../../tools/plugin-db/race-client.ts',import.meta.url)),[],{execArgv:['--import','tsx'],stdio:['ignore','ignore','pipe','ipc'],env:{...process.env,PLUGIN_TEST_DATABASE_URL:own.href}}));
  try {
   await Promise.all(clients.map(child => new Promise<void>((resolve,reject) => { child.once('message',() => resolve()); child.once('error',reject); child.once('exit',code => { if (code) reject(new Error(`Race client exited ${code}`)); }); })));
   const answers = clients.map(child => new Promise<any>((resolve,reject) => { child.once('message',resolve); child.once('error',reject); child.once('exit',() => reject(new Error('Race client exited without result'))); }));
   const sent = [0,1].map(index => turn(0,game.legal[index]));
   clients.forEach((child,index) => child.send({actor:a,gameId:game.game_id,command:sent[index]}));
   const results = await Promise.all(answers);
   expect(results.filter(result => result.revision === 1)).toHaveLength(1); expect(results.filter(result => result.code === 'STALE_REVISION')).toHaveLength(1);
   const winner = results.findIndex(result => result.revision === 1);
   expect((await games[1].command(a,game.game_id,sent[winner])).revision).toBe(1);
  } finally { clients.forEach(child => child.kill()); }
 },30000);

 it('rolls back the command, the state and the alerts if the game update fails',async () => {
  const id = await friend(a,b); const sent = turn(1,(await games[0].view(a,id)).legal[0]);
  const trigger = `reject_${id.replaceAll('-','')}`, counts = async () => (await rows('select (select count(*)::int from public.game_commands where game_id=$1) as commands,(select count(*)::int from public.outbox where payload->>\'game_id\'=$2) as events',[id,id]))[0];
  const before = await counts();
  await admin.query(`create function public.${trigger}() returns trigger language plpgsql as $$ begin raise exception 'test update failure'; end $$; create trigger ${trigger} before update on public.games for each row when (old.id='${id}'::uuid) execute function public.${trigger}()`);
  try { await expect(games[0].command(a,id,sent)).rejects.toThrow('test update failure'); }
  finally { await admin.query(`drop trigger ${trigger} on public.games; drop function public.${trigger}()`); }
  expect((await games[1].view(a,id)).revision).toBe(1); expect(await counts()).toEqual(before);
  expect((await games[1].command(a,id,sent)).revision).toBe(2);
 },30000);

 it('reports an incompatible saved engine without writing a command',async () => {
  const game = await games[0].create(a,{kind:'solo',colour:'white'});
  const save = JSON.parse((await rows('select state from public.games where id=$1',[game.game_id]))[0].state); save.engine = 'previous-build';
  await admin.query('update public.games set state=$2 where id=$1',[game.game_id,JSON.stringify(save)]);
  await expect(games[1].command(a,game.game_id,turn(0,game.legal[0]))).rejects.toMatchObject({code:'MATCH_INCOMPATIBLE',status:409});
  expect((await rows('select count(*)::int as n from public.game_commands where game_id=$1',[game.game_id]))[0].n).toBe(0);
 },30000);

 it('runs a Daily friend game with the reviewed runtime role and refuses extra access',async () => {
  const role = `plugin_test_${randomUUID().replaceAll('-','')}`, password = randomUUID();
  const runtimeUrl = new URL(own.href); runtimeUrl.username = role; runtimeUrl.password = password;
  const runtime = new pg.Pool({connectionString:runtimeUrl.href,max:1});
  const locked = (sql: string) => withRoleLock(own.href, () => admin.query(sql));
  await locked(`${(await readFile(new URL('../../plugin-deploy/runtime-role.sql',import.meta.url),'utf8')).replaceAll('kingdown_plugin_runtime',role)}; alter role ${role} password '${password}'`);
  try {
   expect((await runtime.query('select current_user as name,rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0]).toEqual({name:role,rolsuper:false,rolbypassrls:false});
   expect((await runtime.query('select 1 from pg_auth_members where member=(select oid from pg_roles where rolname=current_user)')).rowCount).toBe(0);
   const clientId = randomUUID(), resource = 'https://plugin.example/mcp';
   await admin.query('insert into kingdown_oauth.client_resources(client_id,resource) values($1,$2)',[clientId,resource]);
   try { expect((await runtime.query('select client_id::text from kingdown_oauth.client_resources where client_id=any($1::uuid[]) and resource=$2',[[clientId],resource])).rows).toEqual([{client_id:clientId}]); }
   finally { await admin.query('delete from kingdown_oauth.client_resources where client_id=$1',[clientId]); }
   const store = new PostgresMatchStore(runtime), service = new GameService(store), plugin = new PluginService(store);
   const created = await service.create(a,{kind:'friend',options:CLASSIC_OPTIONS,colour:'white'});
   const board = await plugin.openBoard(a,created.game_id);
   await plugin.selectBoard(a,board,created.game_id);
   expect(await plugin.board(a,board)).toBe(created.game_id);
   const invite = await service.invite(a,created.game_id);
   await service.join(b,invite.code);
   const sent = turn(1,(await service.view(a,created.game_id)).legal[0]);
   expect((await service.command(a,created.game_id,sent)).revision).toBe(2);
   expect((await service.command(a,created.game_id,sent)).revision).toBe(2);
   expect((await service.command(b,created.game_id,command(2,{type:'say',preset:'hello'}))).revision).toBe(3);
   expect((await service.inbox(b)).find(entry => entry.game_id === created.game_id)).toMatchObject({action:'ready'});
   expect(await service.sweep()).toBeGreaterThanOrEqual(0);
   expect((await service.command(b,created.game_id,command(3,{type:'resign'}))).status).toBe('finished');
   for (const statement of [
    'select * from auth.users',
    'delete from kingdown_oauth.client_resources',
    "update public.game_commands set payload='{}'",
    'delete from public.game_commands',
    'delete from public.games',
    'update public.games set created_by=created_by',
    'truncate public.games',
    'select * from public.notifications',
    "update public.outbox set payload='{}'",
    'select * from public.reports',
    'select display_name from public.profiles',
    'select avatar_url from public.profiles',
    'update public.profiles set rating=rating',
    'delete from public.account_deletions',
    'update public.account_deletions set done_at=now()',
    'delete from auth.users',
    "select public.kingdown_access_token_hook('{}'::jsonb)",
   ]) await expect(runtime.query(statement),statement).rejects.toMatchObject({code:'42501'});
  } finally {
   await runtime.end();
   await withRoleLock(own.href, async () => {
    const reader = new pg.Client({connectionString:url}); await reader.connect();
    try {
     await reader.query('begin');
     await reader.query('select from public.profiles left join public.account_deletions on user_id=id limit 1');
     await admin.query("set lock_timeout='1s'");
     await admin.query(`drop owned by ${role}`);
    } finally {
     await reader.query('rollback'); await reader.end();
     await admin.query('reset lock_timeout');
     await admin.query(`drop owned by ${role}; drop role ${role}`);
    }
   });
  }
 },60000);

 it('grants the browser roles nothing on the game tables and only public profile columns',async () => {
  const tables = ['games','game_players','game_commands','game_invites','relations','reports','mod_actions','notifications','notification_prefs','alert_state','outbox','reserved_handles','account_deletions','plugin_boards','plugin_tool_tries'];
  for (const role of ['anon','authenticated']) for (const table of tables)
   expect((await rows('select has_table_privilege($1,$2,$3) as allowed',[role,`public.${table}`,'SELECT,INSERT,UPDATE,DELETE']))[0].allowed,`${role} ${table}`).toBe(false);
  const readable = await rows("select column_name from information_schema.column_privileges where grantee='authenticated' and table_name='profiles' and privilege_type='SELECT' order by column_name");
  expect(readable.map(row => row.column_name)).toEqual(['handle','icon','id','rating']);
  expect((await rows("select relrowsecurity as rls from pg_class where oid='public.outbox'::regclass"))[0].rls).toBe(true);
 });

 it('makes profiles with no real-name default and checks handles',async () => {
  const id = randomUUID(); users.push(id);
  await admin.query("insert into auth.users(id,raw_user_meta_data) values($1,'{\"full_name\":\"Ada Lovelace\",\"avatar_url\":\"https://avatars.githubusercontent.com/u/1\"}')",[id]);
  expect((await rows('select display_name,avatar_url,handle,challenge_from,online_visible_to,quiet_mode,accepting_games from public.profiles where id=$1',[id]))[0])
   .toEqual({display_name:null,avatar_url:null,handle:null,challenge_from:'signed-in',online_visible_to:'mutual',quiet_mode:false,accepting_games:true});
  for (const bad of ['Ada','ab','1ada','ada-','a'.repeat(21)]) await expect(admin.query('update public.profiles set handle=$2 where id=$1',[id,bad]),bad).rejects.toMatchObject({code:'23514'});
  const taken = (await rows('select handle from public.profiles where id=$1',[a]))[0].handle;
  await expect(admin.query('update public.profiles set handle=$2 where id=$1',[id,taken])).rejects.toMatchObject({code:'23505'});
 });
});
