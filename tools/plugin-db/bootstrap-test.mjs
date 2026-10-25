/** Bootstrap only a disposable loopback PostgreSQL database for local/CI checks. */
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { withRoleLock } from './role-lock.mjs';
const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (!connectionString) throw new Error('PLUGIN_TEST_DATABASE_URL must name a disposable database');
const target = new URL(connectionString);
if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) || !target.pathname.endsWith('_test')) throw new Error('Test bootstrap requires a loopback database with a name ending _test');
const pool = new pg.Pool({ connectionString, max: 1 });
const sql = async name => pool.query(await readFile(new URL(`../../${name}`, import.meta.url), 'utf8'));
try {
  await withRoleLock(connectionString, async () => {
    // Stand-ins for what Supabase provides: the roles, auth.users, auth.sessions and auth.uid().
    await pool.query(`create schema if not exists auth;
      create table if not exists auth.users(id uuid primary key);
      alter table auth.users add column if not exists email text, add column if not exists raw_user_meta_data jsonb,
        add column if not exists banned_until timestamptz;
      create table if not exists auth.sessions(id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade, created_at timestamptz not null default now());
      create or replace function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      do $$ begin
        if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
        if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
        if not exists(select from pg_roles where rolname='supabase_auth_admin') then create role supabase_auth_admin nologin; end if;
      end $$;`);
    // Each migration twice: every one must be repeatable.
    for (const name of ['0001_accounts.sql', '0002_matches.sql', '0003_plugin_boards.sql', '0004_plugin_board_recovery.sql', '0005_accounts_v2.sql', '0006_games.sql', '0007_jobs.sql', '0008_accounts_safety.sql', '0009_invite_tries.sql', '0010_game_setup.sql', '0011_matchmaking.sql', '0012_results.sql', '0013_player_settings.sql', '0014_plugin_tool_tries.sql', '0015_remove_email.sql', '0016_web_account_access.sql', '0017_setup_admission.sql', '0018_rating_policy.sql', '0019_client_errors.sql', '0020_deletion_utc.sql']) {
      await sql(`supabase/migrations/${name}`); await sql(`supabase/migrations/${name}`);
    }
    await sql('plugin-deploy/oauth-audience-hook.sql');
    console.log('Disposable PostgreSQL schema ready (migrations 0001-0020); every migration is repeatable');
  });
} finally { await pool.end(); }
