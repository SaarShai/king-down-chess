import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createWebAccountAccess } from '../../src/api/account-access';
import { GameService } from '../../src/match/service';
import { PostgresMatchStore } from '../../src/match/store';
import { PluginService } from '../../src/plugin/service';
import { checkPluginDatabase } from '../plugin-db-check.mjs';
import { ownTestDatabase } from './own-test-db';
import { withRoleLock } from './role-lock.mjs';

const read = (file: string) => readFileSync(file, 'utf8');
const baseline = [
 '0001_accounts.sql', '0002_matches.sql', '0003_plugin_boards.sql', '0004_plugin_board_recovery.sql',
 '0005_accounts_v2.sql', '0006_games.sql', '0007_jobs.sql', '0008_accounts_safety.sql',
 '0009_invite_tries.sql', '0010_game_setup.sql', '0011_matchmaking.sql', '0012_results.sql',
 '0013_player_settings.sql', '0014_plugin_tool_tries.sql', '0015_remove_email.sql',
];
const migration = read('supabase/migrations/0016_web_account_access.sql');
const blocks = read('plugin-deploy/runtime-role.sql').match(/^begin;[\s\S]*?^commit;$/gm)!;
const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;

suite('web account access: ordered database upgrade', () => {
 let own: URL, admin: pg.Pool, runtime: pg.Pool, plugin: PluginService, gameId: string, boardId: string;
 const actor = randomUUID(), role = `webaccess_${randomUUID().replaceAll('-', '')}`;
 const snapshot = async () => {
  const rows = [];
  for (const table of ['profiles', 'user_data', 'player_settings', 'games', 'game_players', 'game_commands', 'plugin_boards']) {
   rows.push((await admin.query(`select to_jsonb(t) as row from public.${table} t order by to_jsonb(t)::text`)).rows);
  }
  return rows;
 };
 const apply = async () => {
  await admin.query(migration);
  await withRoleLock(own.href, () => admin.query(blocks[11].replaceAll('kingdown_plugin_runtime', role)));
 };
 const oldPluginWorks = async () => {
  await checkPluginDatabase(runtime);
  expect(await plugin.board(actor, boardId)).toBe(gameId);
  expect(await plugin.view(actor, gameId)).toMatchObject({ game_id: gameId, status: 'playing' });
 };
 beforeAll(async () => {
  own = await ownTestDatabase('webaccess');
  admin = new pg.Pool({ connectionString: own.href, max: 1 });
  // The helper installs all migrations. Reset this copy to test the exact old schema first.
  await withRoleLock(own.href, async () => {
   await admin.query(`drop schema public cascade; drop schema auth cascade; drop schema kingdown_jobs cascade; drop schema kingdown_oauth cascade;
    create schema public; create schema auth;
    grant usage on schema public to anon, authenticated;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb, banned_until timestamptz);
    create table auth.sessions(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
   for (const name of baseline) await admin.query(read(`supabase/migrations/${name}`));
   await admin.query(read('plugin-deploy/oauth-audience-hook.sql'));
   expect(blocks).toHaveLength(12);
   await admin.query(blocks.slice(0, 11).join('\n').replaceAll('kingdown_plugin_runtime', role));
  });
  runtime = new pg.Pool({ connectionString: own.href, max: 1, options: `-c role=${role}` });
  await admin.query('insert into auth.users(id) values($1)', [actor]);
  await admin.query(`insert into public.user_data(user_id,settings,lessons,saved_game)
   values($1,'{"at":1,"v":{"sound":false}}','{"at":2,"v":[1]}','{"at":3,"v":{"save":"old local game"}}')`, [actor]);
  await admin.query(`insert into public.player_settings(user_id,symbols_only,show_threats,last_setup)
   values($1,true,true,'{"colour":"black"}')`, [actor]);
  const store = new PostgresMatchStore(admin);
  gameId = (await new GameService(store).create(actor, { kind: 'solo', colour: 'white' })).game_id;
  boardId = await new PluginService(store).openBoard(actor, gameId);
  plugin = new PluginService(new PostgresMatchStore(runtime));
 }, 120_000);
 afterEach(async () => { await admin.query('rollback; drop table if exists public.web_account_access'); });
 afterAll(async () => {
  await runtime?.end();
  if (admin) {
   try { await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role if exists ${role}`)); }
   finally { await admin.end(); }
  }
 });

 it('upgrades 0001–0015 with 0016 then block 12 and keeps old data and plugin reads', async () => {
  expect((await admin.query("select to_regclass('public.web_account_access') as table")).rows).toEqual([{ table: null }]);
  const before = await snapshot();
  await oldPluginWorks();
  expect(await createWebAccountAccess(runtime)()).toEqual({ enabled: false, expiresAt: 0 });
  await apply();
  expect((await runtime.query('select * from public.web_account_access')).rows).toEqual([{ singleton: true, enabled: false }]);
  await oldPluginWorks();
  expect(await snapshot()).toEqual(before);
 });

 it.each([false, true])('keeps enabled=%s and old rows when the migration and grant run again', async enabled => {
  await apply();
  await admin.query('update public.web_account_access set enabled=$1', [enabled]);
  const before = await snapshot();
  await apply();
  await apply();
  expect((await createWebAccountAccess(runtime)()).enabled).toBe(enabled);
  expect((await admin.query('select enabled from public.web_account_access')).rows).toEqual([{ enabled }]);
  expect(await snapshot()).toEqual(before);
 });

 it('gives the runtime SELECT only, with a SELECT RLS policy', async () => {
  await apply();
  expect((await runtime.query('select current_user as role')).rows).toEqual([{ role }]);
  expect((await runtime.query('select * from public.web_account_access')).rows).toHaveLength(1);
  for (const sql of [
   'insert into public.web_account_access default values',
   'update public.web_account_access set enabled=true',
   'delete from public.web_account_access',
   'truncate public.web_account_access',
  ]) await expect(runtime.query(sql)).rejects.toMatchObject({ code: '42501' });
  expect((await admin.query("select relrowsecurity from pg_class where oid='public.web_account_access'::regclass")).rows).toEqual([{ relrowsecurity: true }]);
  expect((await admin.query("select cmd,roles::text[] as roles,qual,with_check from pg_policies where schemaname='public' and tablename='web_account_access'")).rows)
   .toEqual([{ cmd: 'SELECT', roles: [role], qual: 'true', with_check: null }]);
  await admin.query(`drop policy ${role} on public.web_account_access`);
  expect(await createWebAccountAccess(runtime)()).toEqual({ enabled: false, expiresAt: 0 });
 });

 it.each(['anon', 'authenticated'])('denies direct reads and writes for %s and PUBLIC', async browserRole => {
  await apply();
  for (const sql of [
   'select * from public.web_account_access',
   'insert into public.web_account_access default values',
   'update public.web_account_access set enabled=true',
   'delete from public.web_account_access',
  ]) {
   const client = await admin.connect();
   try {
    await client.query('begin');
    await client.query(`set local role ${browserRole}`);
    await expect(client.query(sql)).rejects.toMatchObject({ code: '42501' });
   } finally { await client.query('rollback'); client.release(); }
  }
  expect((await admin.query(`select privilege_type from pg_class c, lateral aclexplode(c.relacl) a
   where c.oid='public.web_account_access'::regclass and a.grantee=0`)).rows).toEqual([]);
 });

 it('enforces one true singleton and defaults a new row to off', async () => {
  await apply();
  await expect(admin.query('insert into public.web_account_access default values')).rejects.toMatchObject({ code: '23505' });
  await expect(admin.query('insert into public.web_account_access(singleton) values(false)')).rejects.toMatchObject({ code: '23514' });
  await expect(admin.query('insert into public.web_account_access(singleton) values(null)')).rejects.toMatchObject({ code: '23502' });
  await expect(admin.query('update public.web_account_access set enabled=null')).rejects.toMatchObject({ code: '23502' });
  await admin.query('delete from public.web_account_access; insert into public.web_account_access default values');
  expect((await runtime.query('select * from public.web_account_access')).rows).toEqual([{ singleton: true, enabled: false }]);
 });

 it.each(['table', 'row', 'grant'])('closes web access without %s while the old plugin still works', async missing => {
  await apply();
  await admin.query('update public.web_account_access set enabled=true');
  expect((await createWebAccountAccess(runtime)()).enabled).toBe(true);
  if (missing === 'table') await admin.query('drop table public.web_account_access');
  if (missing === 'row') await admin.query('delete from public.web_account_access');
  if (missing === 'grant') await admin.query(`revoke select on public.web_account_access from ${role}`);
  expect(await createWebAccountAccess(runtime)()).toEqual({ enabled: false, expiresAt: 0 });
  await oldPluginWorks();
 });
});
