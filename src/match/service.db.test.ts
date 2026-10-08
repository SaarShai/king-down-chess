/** Opt-in integration tests; PLUGIN_TEST_DATABASE_URL must name a disposable real PostgreSQL database. */
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MatchService } from './service';
import { PostgresMatchStore } from './store';
const url = process.env.PLUGIN_TEST_DATABASE_URL;
if (url) {
 const target = new URL(url);
 if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || !target.pathname.endsWith('_test')) throw new Error('Database tests require a disposable loopback database ending in _test');
}
const suite = url ? describe : describe.skip;
suite('PostgreSQL authenticated matches (real connections and processes)', () => {
 const pools = [new pg.Pool({connectionString:url,max:1}),new pg.Pool({connectionString:url,max:1})];
 const services = pools.map(pool => new MatchService(new PostgresMatchStore(pool)));
 const actors = [randomUUID(),randomUUID(),randomUUID()];
 beforeAll(async () => {
  const server = await pools[0].query('select version() as version'); expect(server.rows[0].version).toMatch(/^PostgreSQL /);
  for (const actor of actors) await pools[0].query('insert into auth.users(id) values($1)',[actor]);
 });
 afterAll(async () => { for (const actor of actors) await pools[0].query('delete from auth.users where id=$1',[actor]); await Promise.all(pools.map(pool => pool.end())); });
 it('enforces seats, actual turns, persistent retries and full-payload conflicts',async () => {
  const initial = await services[0].create(actors[0],{});
  await expect(services[1].get(actors[1],initial.matchId)).rejects.toMatchObject({code:'FORBIDDEN'});
  const command = {id:'first',expectedRevision:0,lan:initial.snapshot.legal[0]};
  const moved = await services[0].move(actors[0],initial.matchId,command); expect(moved.snapshot.revision).toBe(1);
  expect((await services[1].move(actors[0],initial.matchId,command)).snapshot.revision).toBe(1);
  await expect(services[1].move(actors[0],initial.matchId,{...command,lan:'other'})).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
  await expect(services[0].move(actors[0],initial.matchId,{id:'wrong-turn',expectedRevision:1,lan:moved.snapshot.legal[0]})).rejects.toMatchObject({code:'WRONG_TURN'});
  const ai = {id:'computer',expectedRevision:1}; const responses = await Promise.all(services.map(service => service.computer(actors[0],initial.matchId,ai)));
  expect(responses.map(response=>response.snapshot.revision)).toEqual([2,2]); expect((await services[1].computer(actors[0],initial.matchId,ai)).snapshot.revision).toBe(2);
 },30000);
 it('authorizes Haste by actual turn after restart, never by ply parity',async () => {
  const initial=await services[0].create(actors[0],{kings:'Flame:Haste,none',fen:'7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1'});
  const first=await services[0].move(actors[0],initial.matchId,{id:'haste',expectedRevision:0,lan:'Ra1-a2!H'});
  expect(first.snapshot.ply).toBe(1); expect(first.snapshot.turn).toBe(0);
  await expect(services[1].computer(actors[0],initial.matchId,{id:'wrong-ai',expectedRevision:1})).rejects.toMatchObject({code:'WRONG_TURN'});
  expect((await services[1].move(actors[0],initial.matchId,{id:'second-haste',expectedRevision:1,lan:'Ra2-a3'})).snapshot.turn).toBe(1);
 },30000);
 it('allows exactly one writer across independent PostgreSQL connections',async () => {
  const initial = await services[0].create(actors[0],{});
  const outcomes = await Promise.allSettled(services.map((service,index) => service.move(actors[0],initial.matchId,{id:`race-${index}`,expectedRevision:0,lan:initial.snapshot.legal[index]})));
  expect(outcomes.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  expect(outcomes.filter(result=>result.status==='rejected').map(result=>(result as PromiseRejectedResult).reason.code)).toEqual(['STALE_REVISION']);
  const row = await pools[0].query('select revision,(select count(*)::int from public.plugin_match_commands where match_id=$1) as commands from public.plugin_matches where id=$1',[initial.matchId]);
  expect(row.rows[0]).toEqual({revision:1,commands:1});
 },30000);
 it('reports incompatible saved versions without committing a retryable command',async () => {
  const initial=await services[0].create(actors[0],{});
  const row=await pools[0].query('select save from public.plugin_matches where id=$1',[initial.matchId]);
  const save=JSON.parse(row.rows[0].save); save.engine='previous-build';
  await pools[0].query('update public.plugin_matches set save=$2 where id=$1',[initial.matchId,JSON.stringify(save)]);
  await expect(services[1].move(actors[0],initial.matchId,{id:'incompatible',expectedRevision:0,lan:initial.snapshot.legal[0]})).rejects.toMatchObject({code:'MATCH_INCOMPATIBLE',status:409});
  expect((await services[1].get(actors[0],initial.matchId)).snapshot.revision).toBe(0);
  expect((await pools[0].query('select count(*)::int as count from public.plugin_match_commands where match_id=$1',[initial.matchId])).rows[0].count).toBe(0);
 },30000);
 it('allows exactly one writer across separate Node processes',async () => {
  const initial = await services[0].create(actors[0],{});
  const clients = [0,1].map(() => fork(fileURLToPath(new URL('../../tools/plugin-db/race-client.ts',import.meta.url)),[],{execArgv:['--import','tsx'],stdio:['ignore','ignore','pipe','ipc'],env:process.env}));
  try {
   await Promise.all(clients.map(child=>new Promise<void>((resolve,reject)=> { child.once('message',()=>resolve()); child.once('error',reject); child.once('exit',code=> { if(code) reject(new Error(`Race client exited ${code}`)); }); })));
   const answers = clients.map(child=>new Promise<any>((resolve,reject)=> { child.once('message',resolve); child.once('error',reject); child.once('exit',()=>reject(new Error('Race client exited without result'))); }));
   clients.forEach((child,index)=>child.send({actor:actors[0],matchId:initial.matchId,command:{id:`process-${index}`,expectedRevision:0,lan:initial.snapshot.legal[index]}}));
   const results = await Promise.all(answers); expect(results.filter(result=>result.revision===1)).toHaveLength(1); expect(results.filter(result=>result.code==='STALE_REVISION')).toHaveLength(1);
   expect((await services[0].get(actors[0],initial.matchId)).snapshot.revision).toBe(1);
   const winner=results.findIndex(result=>result.revision===1);
   expect((await services[1].move(actors[0],initial.matchId,{id:`process-${winner}`,expectedRevision:0,lan:initial.snapshot.legal[winner]})).snapshot.revision).toBe(1);
  } finally { clients.forEach(child=>child.kill()); }
 },30000);
 it('rolls back both command and state if the save update fails',async () => {
  const initial = await services[0].create(actors[0],{}); const command={id:'rollback',expectedRevision:0,lan:initial.snapshot.legal[0]};
  const trigger = `reject_${initial.matchId.replaceAll('-','')}`;
  await pools[0].query(`create function public.${trigger}() returns trigger language plpgsql as $$ begin raise exception 'test update failure'; end $$; create trigger ${trigger} before update on public.plugin_matches for each row when (old.id='${initial.matchId}'::uuid) execute function public.${trigger}()`);
  try { await expect(services[0].move(actors[0],initial.matchId,command)).rejects.toThrow('test update failure'); }
  finally { await pools[0].query(`drop trigger ${trigger} on public.plugin_matches; drop function public.${trigger}()`); }
  expect((await services[1].get(actors[0],initial.matchId)).snapshot.revision).toBe(0);
  expect((await pools[0].query('select * from public.plugin_match_commands where match_id=$1',[initial.matchId])).rowCount).toBe(0);
  expect((await services[1].move(actors[0],initial.matchId,command)).snapshot.revision).toBe(1);
 },30000);
 it('joins a friend seat once, never overwrites it, and supports safe lost-reply retry',async () => {
  const initial = await services[0].create(actors[0],{},'friend');
  await expect(services[0].move(actors[0],initial.matchId,{id:'waiting',expectedRevision:0,lan:initial.snapshot.legal[0]})).rejects.toMatchObject({code:'WAITING'});
  const invite=await services[0].invite(actors[0],initial.matchId);
  await expect(services[0].join(actors[0],invite.token)).rejects.toMatchObject({code:'FORBIDDEN'});
  const results=await Promise.allSettled([services[0].join(actors[1],invite.token),services[1].join(actors[2],invite.token)]);
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  const winner=(results.find(result=>result.status==='fulfilled') as PromiseFulfilledResult<any>).value;
  const joinedActor=results[0].status==='fulfilled'?actors[1]:actors[2];
  expect(winner.playerColor).toBe(1); expect(winner.waiting).toBe(false); expect((await services[1].join(joinedActor,invite.token)).playerColor).toBe(1);
  const white=await services[0].move(actors[0],initial.matchId,{id:'shared-id',expectedRevision:0,lan:initial.snapshot.legal[0]});
  expect((await services[1].move(joinedActor,initial.matchId,{id:'shared-id',expectedRevision:1,lan:white.snapshot.legal[0]})).snapshot.revision).toBe(2);
  const tokenRow=await pools[0].query('select token_hash from public.plugin_match_invites where match_id=$1',[initial.matchId]); expect(tokenRow.rows[0].token_hash).not.toBe(invite.token);
 },30000);
 it('runs the full friend flow with the reviewed runtime role and rejects extra access',async () => {
  const role = `plugin_test_${randomUUID().replaceAll('-', '')}`;
  const password = randomUUID();
  const runtimeUrl = new URL(url!); runtimeUrl.username = role; runtimeUrl.password = password;
  const runtime = new pg.Pool({ connectionString: runtimeUrl.href, max: 1 });
  const sql = (await readFile(new URL('../../plugin-deploy/runtime-role.sql', import.meta.url), 'utf8')).replaceAll('kingdown_plugin_runtime', role);
  await pools[0].query(sql);
  try {
   await pools[0].query(`alter role ${role} password '${password}'`);
   const identity = await runtime.query('select current_user as name,rolsuper,rolbypassrls from pg_roles where rolname=current_user');
   expect(identity.rows[0]).toEqual({ name: role, rolsuper: false, rolbypassrls: false });
   expect((await runtime.query('select 1 from pg_auth_members where member=(select oid from pg_roles where rolname=current_user)')).rowCount).toBe(0);
   const clientId = randomUUID(), resource = 'https://plugin.example/mcp';
   await pools[0].query('insert into kingdown_oauth.client_resources(client_id,resource) values($1,$2)',[clientId,resource]);
   try {
    const allowed = await runtime.query('select client_id::text from kingdown_oauth.client_resources where client_id=any($1::uuid[]) and resource=$2',[[clientId],resource]);
    expect(allowed.rows).toEqual([{ client_id: clientId }]);
   } finally { await pools[0].query('delete from kingdown_oauth.client_resources where client_id=$1',[clientId]); }
   const service = new MatchService(new PostgresMatchStore(runtime));
   const game = await service.create(actors[0],{},'friend');
   const oldInvite = await service.invite(actors[0],game.matchId);
   const invite = await service.invite(actors[0],game.matchId);
   await expect(service.join(actors[1],oldInvite.token)).rejects.toMatchObject({code:'INVITE_UNAVAILABLE'});
   await service.join(actors[1],invite.token);
   const command = {id:'runtime-move',expectedRevision:0,lan:game.snapshot.legal[0]};
   expect((await service.move(actors[0],game.matchId,command)).snapshot.revision).toBe(1);
   expect((await service.move(actors[0],game.matchId,command)).snapshot.revision).toBe(1);
   expect((await service.resume(actors[1]))?.matchId).toBe(game.matchId);
   for (const statement of [
    'select * from auth.users',
    'delete from kingdown_oauth.client_resources',
    "update public.plugin_match_commands set payload='{}'",
    'delete from public.plugin_match_commands',
    'update public.plugin_matches set white_id=white_id',
    'truncate public.plugin_matches',
    "select public.kingdown_access_token_hook('{}'::jsonb)",
   ]) await expect(runtime.query(statement)).rejects.toMatchObject({code:'42501'});
   await service.deleteAccountMatches(actors[0]);
   for (const table of ['plugin_matches','plugin_match_commands','plugin_match_invites']) {
    const rows = await runtime.query(`select count(*)::int as count from public.${table} where ${table==='plugin_matches'?'id':'match_id'}=$1`,[game.matchId]);
    expect(rows.rows[0].count).toBe(0);
   }
  } finally {
   await runtime.end();
   await pools[0].query(`drop owned by ${role}; drop role ${role}`);
  }
 },30000);
 it('grants no browser access to shared authority',async () => {
  for (const role of ['anon','authenticated']) for (const table of ['plugin_matches','plugin_match_commands','plugin_match_invites']) {
   const result=await pools[0].query('select has_table_privilege($1,$2,$3) as allowed',[role,`public.${table}`,'SELECT,INSERT,UPDATE,DELETE']);
   expect(result.rows[0].allowed).toBe(false);
  }
 });
 it('resumes only the caller’s latest seated game after a service restart',async () => {
  const actor=randomUUID(); actors.push(actor); await pools[0].query('insert into auth.users(id) values($1)',[actor]);
  expect(await services[1].resume(actor)).toBeNull();
  const game=await services[0].create(actor,{},'friend');
  const invite=await services[0].invite(actor,game.matchId); await services[0].join(actors[2],invite.token);
  expect((await services[1].resume(actor))?.matchId).toBe(game.matchId);
  expect((await services[1].resume(actors[2]))?.playerColor).toBe(1);
  const newer=await services[0].create(actor,{});
  expect((await services[1].resume(actor))?.matchId).toBe(newer.matchId);
  expect((await services[1].resume(actors[2]))?.matchId).toBe(game.matchId);
 },30000);
 it('expires invitations and explicitly deletes account matches',async () => {
  const initial=await services[0].create(actors[0],{},'friend'); const invite=await services[0].invite(actors[0],initial.matchId);
  await pools[0].query("update public.plugin_match_invites set expires_at=now()-interval '1 second' where match_id=$1",[initial.matchId]);
  await expect(services[0].join(actors[1],invite.token)).rejects.toMatchObject({code:'INVITE_UNAVAILABLE'});
  await services[0].deleteAccountMatches(actors[0]); await expect(services[0].get(actors[0],initial.matchId)).rejects.toMatchObject({code:'NOT_FOUND'});
 });
 it('deleting an auth account cascades matches, commands and invitations',async () => {
  const actor=randomUUID(); actors.push(actor); await pools[0].query('insert into auth.users(id) values($1)',[actor]);
  const initial=await services[0].create(actor,{},'friend'); const invite=await services[0].invite(actor,initial.matchId); await services[1].join(actors[1],invite.token);
  await services[0].move(actor,initial.matchId,{id:'cleanup',expectedRevision:0,lan:initial.snapshot.legal[0]});
  await pools[0].query('delete from auth.users where id=$1',[actor]);
  for (const table of ['plugin_matches','plugin_match_commands','plugin_match_invites']) {
   const result=await pools[0].query(`select count(*)::int as count from public.${table} where ${table==='plugin_matches'?'id':'match_id'}=$1`,[initial.matchId]); expect(result.rows[0].count).toBe(0);
  }
 },30000);
});
