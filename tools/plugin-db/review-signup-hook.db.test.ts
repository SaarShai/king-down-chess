/** The review sign-up hook (approval D8 a) as Supabase Auth calls it, in one transaction that rolls back. */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { describe, expect, it } from 'vitest';

const url = process.env.PLUGIN_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
const refused = { error: { http_code: 403, message: 'Sign up with Google or GitHub.' } };

suite('the review password sign-up hook', () => {
 it('lets in Google, GitHub, Facebook and the listed review address, and refuses every other sign-up', async () => {
  const db = new URL(url!);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(db.hostname) || !db.pathname.endsWith('_test')) throw new Error('Hook tests require a disposable loopback database ending in _test');
  const client = new pg.Client({ connectionString: url }); await client.connect();
  try {
   await client.query('begin');
   await client.query(readFileSync('plugin-deploy/review-signup-hook.sql', 'utf8').replace(/^begin;$/m, '').replace(/^commit;$/m, ''));
   await client.query("insert into kingdown_auth.password_accounts(email) values('review@example.test')");
   await expect(client.query("savepoint upper; insert into kingdown_auth.password_accounts(email) values('Other@example.test')")).rejects.toMatchObject({ code: '23514' });
   await client.query('rollback to savepoint upper');
   await client.query('set local role supabase_auth_admin');
   // The documented payload: metadata, and the user before its row exists.
   const hook = async (provider: string | undefined, email: string, extra: object = {}) => (await client.query('select public.kingdown_before_user_created($1::jsonb) as result', [{
    metadata: { uuid: randomUUID(), time: new Date().toISOString(), name: 'before-user-created', ip_address: '127.0.0.1' },
    user: { id: randomUUID(), aud: 'authenticated', role: '', email, phone: '', app_metadata: provider ? { provider, providers: [provider] } : {}, user_metadata: {}, identities: [], is_anonymous: false, ...extra },
   }])).rows[0].result;
   for (const provider of ['google', 'github', 'facebook']) expect(await hook(provider, 'player@example.test'), provider).toEqual({});
   expect(await hook('email', 'Review@Example.test')).toEqual({});
   expect(await hook('email', 'player@example.test')).toEqual(refused);
   expect(await hook('email', '')).toEqual(refused);
   expect(await hook('phone', '')).toEqual(refused);
   expect(await hook('anonymous', '', { is_anonymous: true })).toEqual(refused);
   expect(await hook(undefined, 'review@example.test')).toEqual(refused);
   await client.query('reset role');
   expect((await client.query(`select has_function_privilege('anon','public.kingdown_before_user_created(jsonb)','EXECUTE') as anon,
    has_function_privilege('authenticated','public.kingdown_before_user_created(jsonb)','EXECUTE') as authenticated,
    has_table_privilege('authenticated','kingdown_auth.password_accounts','SELECT') as list`)).rows[0]).toEqual({ anon: false, authenticated: false, list: false });
  } finally { await client.query('rollback'); await client.end(); }
 });
});
