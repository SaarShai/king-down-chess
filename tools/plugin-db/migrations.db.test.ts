/** Opt-in (PLUGIN_TEST_DATABASE_URL): the migrations run again on a database in use, as supabase/README.md allows.
 * On the test's own copy (the name with "_migrations" before "_test"), because the migrations change the schema. */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { GameService } from '../../src/match/service';
import { PostgresMatchStore } from '../../src/match/store';
import { PluginService } from '../../src/plugin/service';
import { ownTestDatabase } from './own-test-db';

const suite = process.env.PLUGIN_TEST_DATABASE_URL ? describe : describe.skip;

suite('migrations run again on a database in use', () => {
 it('keeps the boards of online games, the profile grants, the sign-up rule and the deletion grace', async () => {
  const own = await ownTestDatabase('migrations'), admin = new pg.Pool({ connectionString: own.href, max: 1 });
  const rows = async (sql: string, params: unknown[] = []) => (await admin.query(sql, params)).rows;
  const users = [randomUUID(), randomUUID()];
  try {
   await admin.query('insert into auth.users(id) values($1)', [users[0]]);
   const store = new PostgresMatchStore(admin), game = await new GameService(store).create(users[0], { kind: 'solo', colour: 'white' });
   const board = await new PluginService(store).openBoard(users[0], game.game_id);
   // The owner's two paths: npm run plugin:db:migrate (0002-0009), then 0001 in the SQL editor.
   execFileSync(process.execPath, ['--import', 'tsx', fileURLToPath(new URL('./migrate.ts', import.meta.url))], { env: { ...process.env, PLUGIN_DATABASE_URL: own.href } });
   await admin.query(await readFile(new URL('../../supabase/migrations/0001_accounts.sql', import.meta.url), 'utf8'));
   expect(await rows('select match_id from public.plugin_boards where id=$1', [board])).toEqual([{ match_id: game.game_id }]);
   expect(await rows(`select confrelid::regclass::text as target from pg_constraint where conrelid='public.plugin_boards'::regclass and conname='plugin_boards_match_id_fkey'`)).toEqual([{ target: 'games' }]);
   // 0005 owns the profile grants and the sign-up rule (no provider name or photo); 0008 owns the deletion (a 7-day grace).
   expect((await rows(`select column_name from information_schema.column_privileges where grantee='authenticated' and table_name='profiles' and privilege_type='SELECT' order by column_name`)).map(row => row.column_name))
    .toEqual(['handle', 'icon', 'id', 'rating']);
   await admin.query(`insert into auth.users(id,raw_user_meta_data) values($1,'{"full_name":"Ada Lovelace","avatar_url":"https://avatars.githubusercontent.com/u/1"}')`, [users[1]]);
   expect(await rows('select display_name,avatar_url from public.profiles where id=$1', [users[1]])).toEqual([{ display_name: null, avatar_url: null }]);
   const client = await admin.connect();
   try { await client.query('begin'); await client.query("select set_config('request.jwt.claim.sub',$1,true)", [users[1]]); await client.query('select public.delete_my_account()'); await client.query('commit'); }
   finally { client.release(); }
   expect(await rows(`select (select count(*)::int from auth.users where id=$1) as accounts,(select count(*)::int from public.account_deletions where user_id=$1 and run_after>now()+interval '6 days') as requests`, [users[1]])).toEqual([{ accounts: 1, requests: 1 }]);
  } finally {
   await admin.query('delete from public.games where created_by=any($1)', [users]);
   await admin.query('delete from public.account_deletions where user_id=any($1)', [users]);
   await admin.query('delete from auth.users where id=any($1)', [users]);
   await admin.end();
  }
 }, 120_000);
});
