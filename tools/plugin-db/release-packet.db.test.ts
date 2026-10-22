import { readFileSync, readdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ownTestDatabase } from './own-test-db';
import { withRoleLock } from './role-lock.mjs';
import { checkPluginDatabase } from '../plugin-db-check.mjs';

const read = (file: string) => readFileSync(file, 'utf8');
const packet = 'docs/specs/chatgpt-mvp/release/apply-0010-0013.sql';
const body = (sql: string) => sql.replace(/--[^\n]*/g, '').trim().replace(/^begin;\s*/i, '').replace(/\s*commit;$/i, '').trim();
const blocks = read('plugin-deploy/runtime-role.sql').match(/^begin;[\s\S]*?^commit;$/gm)!;
const sources = ['supabase/migrations/0010_game_setup.sql', 'block-7', 'supabase/migrations/0011_matchmaking.sql', 'supabase/migrations/0012_results.sql', 'block-8', 'supabase/migrations/0013_player_settings.sql', 'block-9', 'block-10', 'supabase/migrations/0014_plugin_tool_tries.sql', 'block-11', 'supabase/migrations/0015_remove_email.sql'];

it('keeps the release statements in migration and runtime-role order without drift', () => {
 const sql = read(packet);
 for (const source of sources) {
  const segment = sql.split(`-- SOURCE: ${source}\n`)[1]?.split('-- SOURCE: ')[0];
  expect(segment, source).toBeDefined();
  expect(body(segment!)).toBe(body(source.startsWith('block-') ? blocks[Number(source.slice(6)) - 1] : read(source)));
 }
 expect(sql.match(/^begin;$/gm)).toHaveLength(1);
 expect(sql.match(/^commit;$/gm)).toHaveLength(1);
 const positions = sources.map(source => sql.indexOf(`-- SOURCE: ${source}\n`));
 expect(positions).toEqual([...positions].sort((a, b) => a - b));
});

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;
suite('the SQL Editor release paste', () => {
 let own: URL, admin: pg.Pool, role: string;
 beforeAll(async () => { own = await ownTestDatabase('release19docs'); admin = new pg.Pool({ connectionString: own.href, max: 1 }); }, 120_000);
 beforeEach(async () => {
  await admin.query(`drop schema public cascade; drop schema auth cascade; drop schema kingdown_jobs cascade; drop schema kingdown_oauth cascade;
   create schema public; create schema auth;
   create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb, banned_until timestamptz);
   create table auth.sessions(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  for (const name of readdirSync('supabase/migrations').filter(name => /^000[1-9]_.*\.sql$/.test(name)).sort()) await admin.query(read(`supabase/migrations/${name}`));
  await admin.query(read('plugin-deploy/oauth-audience-hook.sql'));
  role = `release19_${randomUUID().replaceAll('-', '')}`;
  await withRoleLock(own.href, () => admin.query(blocks.slice(0, 6).join('\n').replaceAll('kingdown_plugin_runtime', role)));
  await admin.query('insert into auth.users(id) values($1)', [randomUUID()]);
 }, 120_000);
 afterEach(async () => {
  await admin.query('rollback');
  await withRoleLock(own.href, () => admin.query(`drop owned by ${role}; drop role ${role}`));
 });
 afterAll(async () => { await admin?.end(); });
 const apply = () => admin.query(read(packet).replaceAll('kingdown_plugin_runtime', role)).then(() => undefined);
 const snapshot = async () => (await admin.query(`
  select * from (select 'class' as kind,c.oid as id,to_jsonb(c) as value from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth','kingdown_jobs','kingdown_oauth')
  union all select 'attribute',a.attrelid,to_jsonb(a) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','auth','kingdown_jobs','kingdown_oauth')
  union all select 'constraint',c.oid,to_jsonb(c) from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname in ('public','auth','kingdown_jobs','kingdown_oauth')
  union all select 'policy',p.oid,to_jsonb(p) from pg_policy p join pg_class c on c.oid=p.polrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','kingdown_oauth')
  union all select 'function',p.oid,to_jsonb(p) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','auth','kingdown_jobs','kingdown_oauth')
  union all select 'user',0,to_jsonb(u) from auth.users u
  ) records order by kind,id,value::text`)).rows;
 it.each([
  'drop table public.invite_code_tries',
  'drop trigger on_auth_session_created on auth.sessions',
  'revoke update (cancelled_at) on public.account_deletions from ROLE',
 ])('refuses a missing prerequisite and changes nothing: %s', async missing => {
  await admin.query(missing.replaceAll('ROLE', role));
  const before = await snapshot();
  await expect(apply()).rejects.toThrow(/Release prerequisites:.*0005.*0009.*blocks 3.*6/i);
  await admin.query('rollback');
  expect(await snapshot()).toEqual(before);
 }, 120_000);
 it('applies at 0009 plus role blocks 1–6 and passes every runtime startup probe', async () => {
  await apply();
  await apply();
  expect((await admin.query("select to_regprocedure('kingdown_jobs.user_email(uuid)') as email")).rows).toEqual([{ email: null }]);
  const client = await admin.connect();
  try {
   await client.query('begin'); await client.query(`set local role ${role}`);
   await checkPluginDatabase(client);
   expect((await client.query('select current_user as role')).rows[0].role).toBe(role);
  } finally { await client.query('rollback'); client.release(); }
 });
});
