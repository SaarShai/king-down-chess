/** Bootstrap only a disposable loopback PostgreSQL database for local/CI checks. */
import { readFile } from 'node:fs/promises';
import pg from 'pg';
const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (!connectionString) throw new Error('PLUGIN_TEST_DATABASE_URL must name a disposable database');
const target = new URL(connectionString);
if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || !target.pathname.endsWith('_test')) throw new Error('Test bootstrap requires a loopback database with a name ending _test');
const pool = new pg.Pool({ connectionString, max: 1 });
try {
  await pool.query(`create schema if not exists auth;
    create table if not exists auth.users(id uuid primary key);
    do $$ begin
      if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
      if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
    end $$;`);
  const migration = await readFile(new URL('../../supabase/migrations/0002_matches.sql', import.meta.url), 'utf8');
  await pool.query(migration);
  await pool.query(migration);
  await pool.query("do $$ begin if not exists(select from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin nologin; end if; end $$;");
  await pool.query(await readFile(new URL('../../plugin-deploy/oauth-audience-hook.sql', import.meta.url), 'utf8'));
  console.log('Disposable PostgreSQL match schema ready; migration is repeatable');
} finally { await pool.end(); }
