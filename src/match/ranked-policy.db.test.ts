import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ownTestDatabase } from '../../tools/plugin-db/own-test-db';
import { GameService } from './service';
import { PostgresMatchStore, type Game } from './store';
import { DEFAULT_OPTIONS, RANKED_OPTIONS } from './setup';
import type { View } from './protocol';

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
const plain = { ...DEFAULT_OPTIONS, fairy:false, arrangement:false, classic:true };
suite('fixed ranked policy in PostgreSQL', () => {
 let pool: pg.Pool, service: GameService, legacy: GameService;
 const users: string[] = [];
 beforeAll(async () => {
  const own = await ownTestDatabase('ranked');
  pool = new pg.Pool({connectionString:own.href,max:4});
  service = new GameService(new PostgresMatchStore(pool));
  // The pre-transition writer omits this column. Its games retain the legacy treatment.
  class LegacyStore extends PostgresMatchStore {
   override insert(game: Game, client?: pg.PoolClient): Promise<boolean> { game.rating_policy = 'legacy'; return super.insert(game,client); }
  }
  legacy = new GameService(new LegacyStore(pool));
 },120_000);
 // Ranked opens only on the staging server (ticket 67); each case sets its stage.
 beforeEach(() => { vi.stubEnv('KINGDOWN_STAGE', 'staging'); });
 afterEach(() => { vi.unstubAllEnvs(); });
 afterAll(async () => {
  if (!pool) return;
  await pool.query('delete from public.games where created_by=any($1)',[users]);
  await pool.query('delete from auth.users where id=any($1)',[users]);
  await pool.end();
 });
 async function user() {
  const id = randomUUID(); users.push(id);
  await pool.query('insert into auth.users(id) values($1)',[id]);
  await pool.query('update public.profiles set handle=$2 where id=$1',[id,`rank-${id.slice(0,8)}`]);
  return id;
 }
 const act = (actor:string, view:View, action:object, command_id=randomUUID()) => service.command(actor,view.game_id,{command_id,expected_revision:view.revision,action});
 async function ready(a:string,b:string,view:View) {
  for (const actor of [a,b]) {
   const own = await service.view(actor,view.game_id);
   if (own.status === 'setup' && !own.ready![own.seat]) view = await act(actor,own,{type:'choose',choice:own.choices![own.seat],ready:true});
  }
  return view;
 }
 it('fixes the family before draw and separates own tables, automatic matching, Any rules and deliberate accepts', async () => {
  const a = await user(), b = await user(), c = await user();
  const ranked = await service.find(a,undefined,undefined,'ranked-open',false,'ranked');
  expect(ranked).toMatchObject({rating_policy:'ranked-v1',status:'waiting',options:RANKED_OPTIONS,days_per_move:3,speed:'daily'});
  expect(ranked.deal).toHaveLength(4); expect(ranked.setup_admission?.arrangement).toBe(false);
  const casual = await service.find(a,RANKED_OPTIONS,'random','casual-open',true);
  expect(casual.rating_policy).toBe('casual'); expect(casual.game_id).not.toBe(ranked.game_id);
  expect((await service.find(a,undefined,undefined,'ranked-reuse',false,'ranked')).game_id).toBe(ranked.game_id);
  expect((await service.lobby(b)).games.filter(g => [ranked.game_id,casual.game_id].includes(g.game_id)).map(g => g.rating_policy)).toEqual(['ranked-v1','casual']);
  expect((await service.inbox(a)).filter(g => [ranked.game_id,casual.game_id].includes(g.game_id)).map(g => g.rating_policy).sort()).toEqual(['casual','ranked-v1']);
  await expect(service.find(b,undefined,undefined,'bad-any',true,'ranked')).rejects.toMatchObject({code:'INVALID_INPUT'});
  await expect(service.accept(b,ranked.game_id)).rejects.toMatchObject({code:'MATCH_INCOMPATIBLE'});
  await expect(service.accept(b,ranked.game_id,'casual')).rejects.toMatchObject({code:'MATCH_INCOMPATIBLE'});
  const joined = await service.find(b,plain,'white','casual-take',true);
  expect(joined.game_id).toBe(casual.game_id);
  const taken = await service.accept(c,ranked.game_id,'ranked-v1');
  expect(taken.rating_policy).toBe('ranked-v1');
  const bad = {...taken.choices![taken.seat]!,order:[...taken.draw!].reverse().join('')};
  if (bad.order !== taken.draw) await expect(act(c,taken,{type:'choose',choice:bad,ready:true})).rejects.toMatchObject({code:'INVALID_INPUT'});
  await expect(pool.query("update public.games set rating_policy='casual' where id=$1",[ranked.game_id])).rejects.toThrow('fixed at creation');
  await expect(service.find(a,plain,'white','ranked-open')).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
 });
 it('keeps new Casual outcomes and totals without ratings; ranked results reuse the rating transaction once and rematch Casual', async () => {
  const a = await user(), b = await user();
  const casual = await service.create(a,{kind:'random',options:plain});
  await expect(service.accept(b,casual.game_id)).rejects.toMatchObject({code:'MATCH_INCOMPATIBLE'});
  const joined = await service.accept(b,casual.game_id,'casual');
  const finished = await act(b,joined,{type:'resign'});
  expect(finished.rating_policy).toBe('casual');
  expect((await service.view(a,casual.game_id)).outcome).toMatchObject({rating:null,rating_before:null});
  expect((await service.record(a)).totals.played).toBe(1);
  expect((await pool.query('select * from public.rating_history where game_id=$1',[casual.game_id])).rows).toHaveLength(0);
  const open = await service.find(a,undefined,undefined,'rated',false,'ranked');
  let game = await service.find(b,undefined,undefined,'rated-join',false,'ranked');
  expect(game.game_id).toBe(open.game_id); game = await ready(a,b,game);
  const resign = {command_id:randomUUID(),expected_revision:game.revision,action:{type:'resign'}};
  await Promise.all([service.command(b,game.game_id,resign,'web'),service.command(b,game.game_id,resign,'chatgpt')]);
  expect((await pool.query('select * from public.rating_history where game_id=$1',[game.game_id])).rows).toHaveLength(2);
  expect((await service.record(a)).rating.rating).toBeGreaterThan(1500);
  expect((await service.history(a)).games.find(g => g.game_id===game.game_id)?.rating_policy).toBe('ranked-v1');
  const done = await service.view(a,game.game_id), offer = await act(a,done,{type:'rematch',choice:'offer'});
  const accepted = await act(b,offer,{type:'rematch',choice:'accept'});
  expect((await service.view(a,accepted.rematch_game_id!)).rating_policy).toBe('casual');
 });
 it('refuses ranked starts and seats in production and still shows an existing ranked game', async () => {
  const a = await user(), b = await user();
  const ranked = await service.find(a,undefined,undefined,'staging-ranked',false,'ranked');
  vi.stubEnv('KINGDOWN_STAGE', '');
  for (const start of [service.find(b,undefined,undefined,'prod-ranked',false,'ranked'), service.find(a,undefined,undefined,'staging-ranked',false,'ranked'), service.create(b,{kind:'random',mode:'ranked'})])
   await expect(start).rejects.toMatchObject({code:'RANKED_UNAVAILABLE',status:409,message:'Ranked is not available. Play a Casual game.'});
  await expect(service.accept(b,ranked.game_id,'ranked-v1')).rejects.toMatchObject({code:'RANKED_UNAVAILABLE'});
  expect((await service.view(a,ranked.game_id))).toMatchObject({game_id:ranked.game_id,rating_policy:'ranked-v1',status:'waiting'});
  expect((await service.lobby(b)).games.find(g => g.game_id === ranked.game_id)?.rating_policy).toBe('ranked-v1');
  expect((await service.find(b,plain,'white','prod-casual')).rating_policy).toBe('casual');
  expect((await pool.query("select count(*)::int as n from public.games where rating_policy='ranked-v1' and created_by=any($1)",[[a,b]])).rows[0].n).toBe(1);
  expect((await service.cancel(a,ranked.game_id)).status).toBe('aborted');
 });
 it('preserves old receipts, old omitted-policy accepts and old results while rejecting mode changes', async () => {
  const a = await user(), b = await user();
  const old = await legacy.create(a,{kind:'random',options:plain},'old-start');
  await pool.query("update public.game_commands set payload=payload-'mode' where game_id=$1 and kind='start'",[old.game_id]);
  expect((await service.create(a,{kind:'random',options:plain},'old-start')).game_id).toBe(old.game_id);
  await expect(service.create(a,{kind:'random',options:plain,mode:'casual'},'old-start')).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
  let game = await service.accept(b,old.game_id);
  expect(game.rating_policy).toBe('legacy');
  await pool.query("update public.game_commands set command_id='old-join' where game_id=$1 and kind='join'",[game.game_id]);
  expect((await service.find(b,plain,'white','old-join')).game_id).toBe(game.game_id);
  await expect(service.find(b,plain,'white','old-join',false,'casual')).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
  game = await act(b,game,{type:'resign'});
  expect((await pool.query('select * from public.rating_history where game_id=$1',[game.game_id])).rows).toHaveLength(2);
  const history = (await pool.query('select to_jsonb(h) as row from public.rating_history h where game_id=$1 order by user_id',[game.game_id])).rows;
  const migration = await readFile(new URL('../../supabase/migrations/0018_rating_policy.sql',import.meta.url),'utf8');
  await pool.query(migration); await pool.query(migration);
  await service.view(a,game.game_id); await service.history(a);
  expect((await pool.query('select to_jsonb(h) as row from public.rating_history h where game_id=$1 order by user_id',[game.game_id])).rows).toEqual(history);
  const noReceipt = await legacy.create(a,{kind:'random',options:plain},'old-no-receipt');
  await pool.query("delete from public.game_commands where game_id=$1 and kind='start'",[noReceipt.game_id]);
  expect((await service.create(a,{kind:'random',options:plain},'old-no-receipt')).game_id).toBe(noReceipt.game_id);
  await expect(service.create(a,{kind:'random',options:plain,mode:'casual'},'old-no-receipt')).rejects.toMatchObject({code:'COMMAND_CONFLICT'});
 });
});
