/** Opt-in integration tests; PLUGIN_TEST_DATABASE_URL must name a disposable real PostgreSQL database. */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameService } from './service';
import { PostgresMatchStore } from './store';
import { PluginService } from '../plugin/service';
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
 const pools = [new pg.Pool({connectionString:url,max:1}),new pg.Pool({connectionString:url,max:1})], admin = pools[0];
 const games = pools.map(pool => new GameService(new PostgresMatchStore(pool)));
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
  const created = await games[0].create(host,{kind:'friend',colour:'white',...options});
  const invite = await games[0].invite(host,created.game_id);
  await games[1].join(guest,invite.code.toLowerCase().replace(/^(...)/,'$1-'));
  return created.game_id;
 }
 const seats = async (gameId: string) => (await rows('select g.turn,g.status,array_agg(p.action order by p.seat) as actions from public.games g join public.game_players p on p.game_id=g.id where g.id=$1 group by g.id',[gameId]))[0];
 let a: string, b: string, c: string;
 beforeAll(async () => {
  const server = await admin.query('select version() as version'); expect(server.rows[0].version).toMatch(/^PostgreSQL /);
  [a,b,c] = [await user('ann'),await user('bob'),await user('cy')];
 });
 afterAll(async () => {
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
  await games[0].command(a,id,turn(1,'Ra1-a2!H'));
  expect(await seats(id)).toEqual({turn:0,status:'playing',actions:['ready','waiting']}); // Haste keeps the same side
  expect(await notices()).toBe(0);
  const passed = await games[0].command(a,id,turn(2,'Ra2-a3'));
  expect(await seats(id)).toEqual({turn:1,status:'playing',actions:['waiting','ready']});
  expect(await notices()).toBe(1);
  expect((await rows(`select count(*)::int as n from public.outbox where kind='turn' and payload->>'game_id'=$1 and payload->>'user_id'=$2`,[id,b]))[0].n).toBe(1);
  const reply = await games[1].view(b,id);
  expect(reply.deadline_at).toBe(passed.deadline_at);
  await games[1].command(b,id,turn(3,reply.legal[0]));
  expect(await seats(id)).toEqual({turn:0,status:'playing',actions:['ready','waiting']});
  await games[0].command(a,id,command(4,{type:'resign'}));
  expect(await seats(id)).toEqual({turn:0,status:'finished',actions:['done','done']});
  expect((await rows('select bool_or(active) as active from public.game_players where game_id=$1',[id]))[0].active).toBe(false);
 },30000);

 it('refuses self-play in the service and in the database',async () => {
  const created = await games[0].create(a,{kind:'friend',colour:'black'});
  const invite = await games[0].invite(a,created.game_id);
  await expect(games[0].join(a,invite.token)).rejects.toMatchObject({code:'FORBIDDEN'});
  await expect(admin.query('update public.game_players set user_id=$2 where game_id=$1 and seat=0',[created.game_id,a])).rejects.toMatchObject({code:'23505'});
 });

 it('gives one seat to one of two joiners and lets the winner retry',async () => {
  const created = await games[0].create(a,{kind:'friend',speed:'live',colour:'white'});
  const old = await games[0].invite(a,created.game_id), invite = await games[0].invite(a,created.game_id);
  expect(new Date(invite.expires_at).getTime() - Date.now()).toBeLessThanOrEqual(86_400_000);
  await expect(games[0].join(b,old.token)).rejects.toMatchObject({code:'INVITE_UNAVAILABLE'});
  const results = await Promise.allSettled([games[0].join(b,invite.token),games[1].join(c,invite.code)]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect((results.find(result => result.status === 'rejected') as PromiseRejectedResult).reason.code).toBe('INVITE_UNAVAILABLE');
  const winner = results[0].status === 'fulfilled' ? b : c;
  const view = await games[1].join(winner,invite.token);
  expect([view.seat,view.status,view.revision,view.opponent?.handle]).toEqual([1,'playing',1,(await rows('select handle from public.profiles where id=$1',[a]))[0].handle]);
  expect((await rows('select token_hash,code_hash from public.game_invites where game_id=$1',[created.game_id]))[0]).not.toMatchObject({token_hash:invite.token});
  const expired = await games[0].create(a,{kind:'friend',colour:'white'}), late = await games[0].invite(a,expired.game_id);
  expect(new Date(late.expires_at).getTime() - Date.now()).toBeGreaterThan(13 * 86_400_000);
  await admin.query("update public.game_invites set expires_at=now()-interval '1 second' where game_id=$1",[expired.game_id]);
  await expect(games[0].join(b,late.token)).rejects.toMatchObject({code:'INVITE_UNAVAILABLE'});
  await expect(games[0].join(b,'not-a-code')).rejects.toMatchObject({code:'INVALID_INPUT'});
 },30000);

 it('refuses a join across a block or against the host’s challenge setting',async () => {
  const tryJoin = async () => { const created = await games[0].create(a,{kind:'friend'}); return games[0].join(b,(await games[0].invite(a,created.game_id)).token); };
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
  const silent = await friend(a,b,{days_per_move:1});
  expect((await rows('select deadline_kind,deadline_at-now() > interval \'2 days\' as long from public.games where id=$1',[silent]))[0]).toEqual({deadline_kind:'first_turn',long:true});
  await past(silent);
  expect(await games[1].sweep()).toBeGreaterThanOrEqual(1);
  expect(await games[0].sweep()).toBe(0);
  expect((await rows('select status,result,end_reason from public.games where id=$1',[silent]))[0]).toEqual({status:'aborted',result:null,end_reason:'no_start'});
  // Both sides moved: White's next deadline is days per move; missing it loses on time.
  const late = await friend(a,b,{days_per_move:1});
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
  const waiting = await games[0].create(a,{kind:'friend'});
  expect((await games[0].command(a,waiting.game_id,command(0,{type:'abort'}))).status).toBe('aborted');
  const resigned = await games[0].create(a,{kind:'solo',colour:'black'});
  expect((await games[0].command(a,resigned.game_id,command(0,{type:'resign'}))).result).toEqual({winner:0,reason:'resignation'});
 },60000);

 it('keeps views small and read-only, and lists your turn first',async () => {
  // Fresh players, so games of the other tests do not join the lists.
  const [d,e,f] = [await user('dee'),await user('eve'),await user('fay')];
  const urgent = await friend(f,d), later = await friend(d,e,{days_per_move:7});
  const view = await games[0].command(d,later,turn(1,(await games[0].view(d,later)).legal[0]));
  expect(Buffer.byteLength(JSON.stringify(view))).toBeLessThan(3000);
  expect(view.rules).toBeUndefined(); expect((await games[0].view(d,later)).rules).toBeDefined();
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
  expect(inbox[0]).toMatchObject({seat:1,kind:'friend',speed:'daily',opponent:{computer:false,deleted:false}});
 },30000);

 it('keeps the opponent’s game when an account is deleted',async () => {
  const gone = await user('gone'), id = await friend(gone,b);
  const open = await games[0].create(gone,{kind:'friend'}); await games[0].invite(gone,open.game_id);
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
  const clients = [0,1].map(() => fork(fileURLToPath(new URL('../../tools/plugin-db/race-client.ts',import.meta.url)),[],{execArgv:['--import','tsx'],stdio:['ignore','ignore','pipe','ipc'],env:process.env}));
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
  const runtimeUrl = new URL(url!); runtimeUrl.username = role; runtimeUrl.password = password;
  const runtime = new pg.Pool({connectionString:runtimeUrl.href,max:1});
  // One test file at a time grants on a table (src/online/accounts.db.test.ts takes the same lock): two at once fail.
  const locked = async (sql: string) => { await admin.query('select pg_advisory_lock(7007007)'); try { await admin.query(sql); } finally { await admin.query('select pg_advisory_unlock(7007007)'); } };
  await locked((await readFile(new URL('../../plugin-deploy/runtime-role.sql',import.meta.url),'utf8')).replaceAll('kingdown_plugin_runtime',role));
  try {
   await admin.query(`alter role ${role} password '${password}'`);
   expect((await runtime.query('select current_user as name,rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0]).toEqual({name:role,rolsuper:false,rolbypassrls:false});
   expect((await runtime.query('select 1 from pg_auth_members where member=(select oid from pg_roles where rolname=current_user)')).rowCount).toBe(0);
   const clientId = randomUUID(), resource = 'https://plugin.example/mcp';
   await admin.query('insert into kingdown_oauth.client_resources(client_id,resource) values($1,$2)',[clientId,resource]);
   try { expect((await runtime.query('select client_id::text from kingdown_oauth.client_resources where client_id=any($1::uuid[]) and resource=$2',[[clientId],resource])).rows).toEqual([{client_id:clientId}]); }
   finally { await admin.query('delete from kingdown_oauth.client_resources where client_id=$1',[clientId]); }
   const store = new PostgresMatchStore(runtime), service = new GameService(store), plugin = new PluginService(store);
   const created = await service.create(a,{kind:'friend',colour:'white'});
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
   await locked(`drop owned by ${role}; drop role ${role}`);
  }
 },60000);

 it('grants the browser roles nothing on the game tables and only public profile columns',async () => {
  const tables = ['games','game_players','game_commands','game_invites','relations','reports','mod_actions','notifications','notification_prefs','alert_state','outbox','reserved_handles','account_deletions','plugin_boards'];
  for (const role of ['anon','authenticated']) for (const table of tables)
   expect((await rows('select has_table_privilege($1,$2,$3) as allowed',[role,`public.${table}`,'SELECT,INSERT,UPDATE,DELETE']))[0].allowed,`${role} ${table}`).toBe(false);
  const readable = await rows("select column_name from information_schema.column_privileges where grantee='authenticated' and table_name='profiles' and privilege_type='SELECT' order by column_name");
  expect(readable.map(row => row.column_name)).toEqual(['avatar_url','display_name','handle','icon','id','rating']);
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
