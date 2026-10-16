/** The review sign-up hook and the password check of the access token hook (approval D8 a) as Supabase Auth calls
 * them, in one transaction that rolls back. */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { describe, expect, it } from 'vitest';

const url = process.env.PLUGIN_TEST_DATABASE_URL;
const suite = url ? describe : describe.skip;
const refused = { error: { http_code: 403, message: 'Sign up with Google or GitHub.' } };
const sql = (file: string) => readFileSync(file, 'utf8').replace(/^begin;$/m, '').replace(/^commit;$/m, '');
async function connect() {
 const db = new URL(url!);
 if (!['127.0.0.1', 'localhost', '[::1]'].includes(db.hostname) || !db.pathname.endsWith('_test')) throw new Error('Hook tests require a disposable loopback database ending in _test');
 const client = new pg.Client({ connectionString: url }); await client.connect(); return client;
}

suite('the review password sign-up hook', () => {
 it('lets in Google, GitHub, Facebook and the listed review address, and refuses every other sign-up', async () => {
  const client = await connect();
  try {
   await client.query('begin');
   await client.query(sql('plugin-deploy/review-signup-hook.sql'));
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

 it('gives a password session only to a listed address, also when a Google or GitHub account adds a password or the session refreshes', async () => {
  const client = await connect();
  try {
   await client.query('begin');
   await client.query('drop schema if exists kingdown_auth cascade');
   await client.query(sql('plugin-deploy/oauth-audience-hook.sql'));
   const now = Math.floor(Date.now() / 1000);
   // The documented payload; Auth puts the account's email address in the claims.
   // signIn: the session's first sign-in method, which Auth keeps in the amr claim, also on each refresh.
   const token = async (method: string, email?: string, signIn?: string) => (await client.query('select public.kingdown_access_token_hook($1::jsonb) as result', [{
    user_id: randomUUID(), authentication_method: method,
    claims: { iss: 'https://project.supabase.co/auth/v1', aud: 'authenticated', exp: now + 3600, iat: now, sub: randomUUID(), role: 'authenticated', aal: 'aal1', session_id: randomUUID(), is_anonymous: false, ...(email === undefined ? {} : { email }), ...(signIn === undefined ? {} : { amr: [{ method: signIn, timestamp: now - 60 }] }) },
   }])).rows[0].result;
   const passwordRefused = { error: { http_code: 403, message: 'Sign in with Google or GitHub.' } };
   await client.query('set local role supabase_auth_admin');
   // Before the list exists, no address gets a password session.
   expect(await token('password', 'review@example.test')).toEqual(passwordRefused);
   await client.query('reset role');
   await client.query(sql('plugin-deploy/review-signup-hook.sql'));
   await client.query("insert into kingdown_auth.password_accounts(email) values('review@example.test')");
   await client.query('set local role supabase_auth_admin');
   expect((await token('password', 'Review@Example.test')).claims).toMatchObject({ email: 'Review@Example.test', aud: 'authenticated' });
   // A Google player who added a password with auth.updateUser, the opponent after step 2.8, and no address at all.
   for (const email of ['player@example.test', 'opponent@example.test', '', undefined]) expect(await token('password', email), String(email)).toEqual(passwordRefused);
   // Every other way in is unchanged.
   for (const method of ['oauth', 'token_refresh', 'oauth_provider/authorization_code']) expect((await token(method, 'player@example.test')).claims, method).toMatchObject({ email: 'player@example.test' });
   // The opponent and the test account sign in while listed. When the owner removes an address, its password session
   // gets no new token (a refresh, or a code for the ChatGPT app); a Google session of the same address keeps its own.
   await client.query('reset role');
   await client.query("insert into kingdown_auth.password_accounts(email) values('opponent@example.test')");
   await client.query('set local role supabase_auth_admin');
   expect((await token('token_refresh', 'opponent@example.test', 'password')).claims).toMatchObject({ email: 'opponent@example.test' });
   await client.query('reset role');
   await client.query("delete from kingdown_auth.password_accounts where email = 'opponent@example.test'");
   await client.query('set local role supabase_auth_admin');
   for (const method of ['token_refresh', 'oauth_provider/authorization_code']) expect(await token(method, 'Opponent@Example.test', 'password'), method).toEqual(passwordRefused);
   for (const signIn of ['oauth', undefined]) expect((await token('token_refresh', 'opponent@example.test', signIn)).claims, String(signIn)).toMatchObject({ email: 'opponent@example.test' });
   expect((await token('token_refresh', 'review@example.test', 'password')).claims).toMatchObject({ email: 'review@example.test' });
  } finally { await client.query('rollback'); await client.end(); }
 });
});
