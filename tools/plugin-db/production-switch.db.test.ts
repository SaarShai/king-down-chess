/** Opt-in (PLUGIN_TEST_DATABASE_URL): the production schema switch (ticket 68). Production has 0001-0014 and runtime-role
 * blocks 1-11 of cc1081b2. The old build (cc1081b2) must start on 0014 + 0016-0018, the new build must not deploy before
 * 0017/0018, and 0015 ends the rollback window. The new build also needs the current block 4: its start check reads
 * notifications.id and created_at (35f5fd14), which the cc1081b2 block 4 does not grant. On the test's own copy (the name
 * with "_prodswitch" before "_test"), because the test drops and makes the schema and the role changes grants. */
import { randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GameService } from '../../src/match/service';
import { PostgresMatchStore } from '../../src/match/store';
import { ownTestDatabase } from './own-test-db';
import { withRoleLock } from './role-lock.mjs';
import { checkPluginDatabase } from '../plugin-db-check.mjs';
import { checkPluginDatabase as checkOldPluginDatabase } from './fixtures/plugin-db-check-cc1081b2.mjs';

const read = (file: string) => readFileSync(file, 'utf8');
const migration = (number: string) => read(`supabase/migrations/${readdirSync('supabase/migrations').find(name => name.startsWith(`${number}_`))}`);
const blocks = (file: string) => read(file).match(/^begin;[\s\S]*?^commit;$/gm)!;
const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;

suite('the production schema switch', () => {
 let own: URL, admin: pg.Pool, role: string;
 beforeAll(async () => {
  own = await ownTestDatabase('prodswitch');
  admin = new pg.Pool({ connectionString: own.href, max: 2 });
  // A fresh schema at the production state: 0001-0014 once each, the audience hook, then the cc1081b2 role blocks 1-11.
  await admin.query(`drop schema public cascade; drop schema auth cascade; drop schema kingdown_jobs cascade; drop schema kingdown_oauth cascade;
   create schema public; create schema auth;
   create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb, banned_until timestamptz);
   create table auth.sessions(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  for (let n = 1; n <= 14; n++) await admin.query(migration(String(n).padStart(4, '0')));
  await admin.query(read('plugin-deploy/oauth-audience-hook.sql'));
  role = `prodswitch_${randomUUID().replaceAll('-', '')}`;
  const old = blocks('tools/plugin-db/fixtures/runtime-role-cc1081b2.sql');
  expect(old).toHaveLength(11);
  await withRoleLock(own.href, () => admin.query(old.join('\n').replaceAll('kingdown_plugin_runtime', role)));
 }, 120_000);
 afterAll(async () => {
  if (role) await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role if exists ${role}`));
  await admin?.end();
 });
 /** Run work as the runtime role in one transaction. It commits only when `keep` is true. */
 const asRuntime = async (work: (client: pg.PoolClient) => Promise<void>, keep = false) => {
  const client = await admin.connect();
  try {
   await client.query('begin'); await client.query(`set local role ${role}`);
   expect((await client.query('select current_user as name')).rows[0].name).toBe(role);
   await work(client);
   await client.query(keep ? 'commit' : 'rollback');
  } catch (error) { await client.query('rollback'); throw error; }
  finally { client.release(); }
 };
 const oldCheck = () => asRuntime(client => checkOldPluginDatabase(client));
 const newCheck = () => asRuntime(client => checkPluginDatabase(client));
 const apply = (sql: string) => withRoleLock(own.href, () => admin.query(sql.replaceAll('kingdown_plugin_runtime', role)));

 it('starts both builds before and after 0016, block 12, 0017 and 0018; the new build needs 0017/0018; 0015 ends rollback', async () => {
  const user = randomUUID(), store = new PostgresMatchStore(admin);
  await admin.query('insert into auth.users(id) values($1)', [user]);
  try {
   // (a) Production today: the old start check passes. The new one fails: block 4 of cc1081b2 grants no notifications.id.
   const notices = async () => (await admin.query(`select has_column_privilege($1,'public.notifications','id','select') and has_column_privilege($1,'public.notifications','created_at','select') as allowed`, [role])).rows[0].allowed;
   await oldCheck();
   await expect(newCheck()).rejects.toMatchObject({ code: 'SCHEMA_REQUIRED' });
   expect(await notices()).toBe(false);
   // (e) Without 0017/0018 each new game read and game start fails: never deploy the new build first.
   await expect(store.load(randomUUID())).rejects.toMatchObject({ code: '42703' });
   await expect(new GameService(store).create(user, { kind: 'solo', colour: 'white' })).rejects.toMatchObject({ code: '42703' });

   // (b) The plan's additive release step, in its order.
   const current = blocks('plugin-deploy/runtime-role.sql');
   expect(current[11]).toContain('public.web_account_access');
   for (const sql of [migration('0016'), current[11], migration('0017'), migration('0018')]) await apply(sql);
   // (c) The old build starts. The new build still does not: the plan's order is not enough.
   await oldCheck();
   await expect(newCheck()).rejects.toMatchObject({ code: 'SCHEMA_REQUIRED' });
   // The current block 4 adds the two notification columns. Grants only add, so the old email grant stays.
   expect(current[3]).toContain('grant select (id, user_id, kind, payload, created_at) on public.notifications');
   await apply(current[3]);
   expect(await notices()).toBe(true);
   await oldCheck();
   await newCheck();

   // (d) The old build's game insert (cc1081b2 src/match/store.ts:51-56, as the runtime role) names neither new column.
   const made = await new GameService(store).create(user, { kind: 'solo', colour: 'white' });
   const game = await store.load(made.game_id, { state: true }), id = randomUUID();
   await asRuntime(async client => {
    await client.query(`insert into public.games(id,kind,speed,days_per_move,category,readings,colour_rule,engine_fingerprint,setup,rules,status,turn,revision,state,snapshot,created_by,created_at,started_at,updated_at,options,draw,deal,level,setup_deadline_at,deadline_at,deadline_kind)
     values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$17,$19,$20,$21,$22,$23,$24,$25) on conflict (id) do nothing`,
     [id, game.kind, game.speed, game.days_per_move, game.category, game.readings, game.colour_rule, game.engine_fingerprint, game.setup, game.rules, game.status, game.turn, game.revision, game.state, game.snapshot, game.created_by, game.created_at, game.started_at, game.options, game.draw, game.deal === null ? null : JSON.stringify(game.deal), game.level, game.setup_deadline_at, game.deadline_at, game.deadline_kind]);
    for (const p of game.players) await client.query(`insert into public.game_players(game_id,seat,user_id,computer,handle_at_start,power,action,last_seen_at,choice,ready)
     values($1,$2,$3,$4,(select handle from public.profiles where id=$3),$5,$6,$7,$8,$9)`, [id, p.seat, p.user_id, p.computer, p.power, p.action, p.last_seen_at, p.choice, p.ready]);
   }, true);
   expect((await admin.query('select rating_policy,setup_admission from public.games where id=$1', [id])).rows).toEqual([{ rating_policy: 'legacy', setup_admission: null }]);
   const copy = await store.load(id);
   expect(copy).toMatchObject({ id, rating_policy: 'legacy', setup_admission: null, status: game.status, setup: game.setup });
   expect(copy.players.map(p => p.user_id)).toEqual(game.players.map(p => p.user_id));

   // (f) 0015 removes the email helper: the old start check now fails, the new one passes.
   await apply(migration('0015'));
   await expect(oldCheck()).rejects.toMatchObject({ code: 'SCHEMA_REQUIRED' });
   await newCheck();
  } finally {
   await admin.query('delete from public.games where created_by=$1', [user]);
   await admin.query('delete from auth.users where id=$1', [user]);
  }
 }, 120_000);
});
