// Applies supabase/migrations/0001_accounts.sql twice to a stand-in for Supabase (Postgres in WASM)
// and checks the profile trigger, Row Level Security, the grants and account deletion.
//   npm install --no-save @electric-sql/pglite && node supabase/check-migration.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const { PGlite } = await import('@electric-sql/pglite').catch(() => {
  console.error('Needs PGlite: npm install --no-save @electric-sql/pglite');
  process.exit(1);
});
const sql = readFileSync(process.argv[2] ?? new URL('./migrations/0001_accounts.sql', import.meta.url), 'utf8');
const db = new PGlite();
const A = '11111111-1111-1111-1111-111111111111', B = '22222222-2222-2222-2222-222222222222', OLD = '33333333-3333-3333-3333-333333333333';

// Mock of what Supabase provides: roles, auth.users, auth.uid(), and the default privileges a
// project with auto-expose ON would have (the migration must not rely on them being off).
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  grant usage on schema public to anon;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
  insert into auth.users values ('${OLD}', 'old@example.com', '{"user_name":"oldtimer","avatar_url":"https://a/old.png"}');
`);

await db.exec(sql);
await db.exec(sql); // idempotent
const one = async (q, p) => (await db.query(q, p)).rows;

// Trigger and backfill.
await db.query(`insert into auth.users values ($1, 'a@example.com', $2)`, [A, { full_name: 'Ada Lovelace', picture: 'https://g/ada.png', name: 'ignored' }]);
await db.query(`insert into auth.users values ($1, 'b@example.com', $2)`, [B, { name: '', user_name: 'bob', avatar_url: 'https://gh/bob.png' }]);
await db.query(`insert into auth.users values ('44444444-4444-4444-4444-444444444444', null, $1)`, [{ full_name: 'x'.repeat(80) }]);
await db.query(`insert into auth.users values ('55555555-5555-5555-5555-555555555555', null, null)`);
const profiles = await one(`select id, display_name, avatar_url, rating from public.profiles order by id`);
assert.deepEqual(profiles.map(p => [p.display_name, p.avatar_url, p.rating]), [
  ['Ada Lovelace', 'https://g/ada.png', 1200],
  ['bob', 'https://gh/bob.png', 1200],
  ['oldtimer', 'https://a/old.png', 1200],
  ['x'.repeat(50), null, 1200],
  [null, null, 1200],
]);
assert.ok(!Object.keys(profiles[0]).includes('email'));
const cols = (await one(`select column_name from information_schema.columns where table_schema='public' and table_name='profiles'`)).map(r => r.column_name);
assert.ok(!cols.includes('email'), 'profiles has no email column');

const as = async (role, sub, q, p) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${sub ?? ''}', false); set role ${role};`);
  try { return (await db.query(q, p)); } finally { await db.exec('reset role'); }
};
const denied = async (role, sub, q, re = /permission denied|row-level security/) => {
  await assert.rejects(as(role, sub, q), re, q);
};

// anon: nothing.
await denied('anon', null, 'select * from public.profiles');
await denied('anon', null, 'select * from public.user_data');
await denied('anon', null, 'select public.delete_my_account()');
await denied('anon', null, `insert into public.user_data (user_id) values ('${A}')`);

// authenticated A
assert.equal((await as('authenticated', A, 'select * from public.profiles')).rows.length, 5, 'signed-in players read profiles');
assert.equal((await as('authenticated', A, `update public.profiles set display_name = 'Ada' where id = '${A}'`)).affectedRows, 1);
assert.equal((await as('authenticated', A, `update public.profiles set display_name = 'Hacked' where id = '${B}'`)).affectedRows, 0, 'cannot rename another player');
await denied('authenticated', A, `update public.profiles set rating = 3000 where id = '${A}'`);
await denied('authenticated', A, `update public.profiles set avatar_url = 'x' where id = '${A}'`);
await denied('authenticated', A, `insert into public.profiles (id) values ('${A}')`);
await denied('authenticated', A, `delete from public.profiles where id = '${A}'`);
await denied('authenticated', A, `update public.profiles set display_name = '' where id = '${A}'`, /check constraint/);

// user_data: PostgREST's upsert shape (on conflict do update set every sent column).
const upsert = (id, col, v) => `insert into public.user_data (user_id, ${col}) values ('${id}', '${JSON.stringify(v)}')
  on conflict (user_id) do update set user_id = excluded.user_id, ${col} = excluded.${col}`;
await as('authenticated', A, upsert(A, 'settings', { at: 1, v: { sound: true } }));
await as('authenticated', A, upsert(A, 'saved_game', { at: 2, v: { moves: ['e2-e4'] } }));
await as('authenticated', B, upsert(B, 'lessons', { at: 3, v: { done: ['Archer'] } }));
await denied('authenticated', A, upsert(B, 'settings', { at: 9, v: {} }));
await denied('authenticated', A, upsert(A, 'unlocks', { at: 9, v: ['all'] }));
await denied('authenticated', A, `update public.user_data set unlocks = '[]' where user_id = '${A}'`);
await denied('authenticated', A, upsert(A, 'saved_game', { at: 9, v: 'x'.repeat(300000) }), /check constraint/);
const mine = (await as('authenticated', A, 'select * from public.user_data')).rows;
assert.equal(mine.length, 1);
assert.deepEqual([mine[0].settings, mine[0].saved_game], [{ at: 1, v: { sound: true } }, { at: 2, v: { moves: ['e2-e4'] } }]);
assert.equal((await as('authenticated', A, `update public.user_data set user_id = '${B}' where user_id = '${A}'`).catch(e => e)).message?.match(/row-level security|duplicate/) ? 1 : 0, 1, 'cannot move a row to another player');
assert.equal((await as('authenticated', A, `update public.user_data set lessons = '{}' where user_id = '${B}'`)).affectedRows, 0);
await denied('authenticated', A, `delete from public.user_data where user_id = '${A}'`);
await denied('authenticated', A, `select public.handle_new_user()`, /permission denied|trigger functions/);
await denied('authenticated', A, `select public.touch_updated_at()`, /permission denied|trigger functions/);

// Deleting A removes A's account, profile and data, and nothing of B's.
await as('authenticated', A, 'select public.delete_my_account()');
assert.equal((await one(`select count(*)::int n from auth.users where id = '${A}'`))[0].n, 0);
assert.equal((await one(`select count(*)::int n from public.profiles where id = '${A}'`))[0].n, 0);
assert.equal((await one(`select count(*)::int n from public.user_data where user_id = '${A}'`))[0].n, 0);
assert.equal((await one(`select count(*)::int n from public.user_data where user_id = '${B}'`))[0].n, 1);
assert.equal((await one(`select count(*)::int n from auth.users`))[0].n, 4);
// Signed in with no uid claim: deletes nothing.
await as('authenticated', null, 'select public.delete_my_account()');
assert.equal((await one(`select count(*)::int n from auth.users`))[0].n, 4);
// updated_at moves on update.
const t0 = (await one(`select updated_at from public.user_data where user_id = '${B}'`))[0].updated_at;
await new Promise(r => setTimeout(r, 20));
await as('authenticated', B, upsert(B, 'settings', { at: 4, v: {} }));
assert.ok((await one(`select updated_at from public.user_data where user_id = '${B}'`))[0].updated_at > t0);
console.log('SQL checks: all passed');
