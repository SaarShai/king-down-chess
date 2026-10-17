/** Local-only SDK browser checks and a transaction-rolled-back Supabase hook contract test. */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { assertNoErrors, launch, trapErrors } from './lib/checks.mjs';
import pg from 'pg';
const root = resolve(process.argv[2] || 'plugin-server-dist');
const clientId = '11111111-1111-4111-8111-111111111111', actor = '22222222-2222-4222-8222-222222222222', authorizationId = '33333333-3333-4333-8333-333333333333';
const config = { supabaseUrl: 'https://project.supabase.co', publishableKey: 'sb_publishable_browsercheck', clientIds: [clientId] };
const html = (await readFile(resolve(root, 'consent.html'), 'utf8')).replace('__KINGDOWN_CONSENT_CONFIG__', JSON.stringify(config));
const script = await readFile(resolve(root, 'consent.mjs'));
const server = createServer((req, res) => { res.setHeader('Content-Type', req.url.startsWith('/consent.mjs') ? 'text/javascript' : 'text/html'); res.end(req.url.startsWith('/consent.mjs') ? script : html); });
server.listen(0, '127.0.0.1'); await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await launch();
  const signin = await browser.newPage(); trapErrors(signin);
  let signInUrl, exchange;
  await signin.route('https://project.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/authorize')) { signInUrl = url; await route.fulfill({ status: 200, contentType: 'text/html', body: 'Mock social-provider redirect' }); }
    else if (url.pathname.endsWith('/token')) {
      exchange = route.request().postDataJSON();
      const now = Math.floor(Date.now() / 1000);
      await route.fulfill({ json: { access_token: `header.${Buffer.from(JSON.stringify({ exp: now + 3600, sub: actor })).toString('base64url')}.signature`, refresh_token: 'mock-refresh', expires_in: 3600, token_type: 'bearer', user: { id: actor, email: 'player@example.test', is_anonymous: false, app_metadata: {}, user_metadata: {} } } });
    } else await route.fulfill({ json: { authorization_id: authorizationId, redirect_uri: 'https://client.example/callback', client: { id: clientId, name: 'King Down browser check', uri: 'https://client.example', logo_uri: '' }, user: { id: actor, email: 'player@example.test' }, scope: 'openid email' } });
  });
  await signin.goto(`${origin}/authorize?authorization_id=${authorizationId}`);
  await signin.getByRole('button', { name: 'Continue with Google' }).click();
  await signin.waitForURL('https://project.supabase.co/**');
  assert.equal(signInUrl.searchParams.get('provider'), 'google');
  const callback = new URL(signInUrl.searchParams.get('redirect_to')); assert.equal(callback.origin, origin); assert.equal(callback.pathname, '/authorize'); assert.equal(callback.searchParams.get('authorization_id'), authorizationId);
  assert(signInUrl.searchParams.get('code_challenge')); assert.equal(signInUrl.searchParams.get('code_challenge_method'), 's256');
  await signin.goto(`${callback.href}&code=mock-social-code`);
  await signin.getByRole('button', { name: 'Continue', exact: true }).click();
  await signin.getByRole('button', { name: 'Allow connection' }).waitFor();
  assert.equal(exchange.auth_code, 'mock-social-code'); assert(exchange.code_verifier);
  assert.equal(createHash('sha256').update(exchange.code_verifier).digest('base64url'), signInUrl.searchParams.get('code_challenge'));
  assert.equal(new URL(signin.url()).searchParams.get('authorization_id'), authorizationId);
  await signin.close();
  // Approval D8 a: the one review account signs in with a password under the closed form, then sees the same account choice.
  const review = await browser.newPage(); trapErrors(review, [{ pattern: /^Failed to load resource: the server responded with a status of 400 \(Bad Request\)$/, reason: 'The wrong-password case returns 400 on purpose.' }]);
  const grants = [];
  await review.route('https://project.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith('/token')) { await route.fulfill({ json: { authorization_id: authorizationId, redirect_uri: 'https://client.example/callback', client: { id: clientId, name: 'King Down browser check', uri: 'https://client.example', logo_uri: '' }, user: { id: actor, email: 'review@example.test' }, scope: 'openid email' } }); return; }
    const body = route.request().postDataJSON(); grants.push([url.searchParams.get('grant_type'), body.email]);
    if (body.password !== 'test-only-value') { await route.fulfill({ status: 400, json: { code: 'invalid_credentials', message: 'Invalid login credentials' } }); return; }
    const now = Math.floor(Date.now() / 1000);
    await route.fulfill({ json: { access_token: `header.${Buffer.from(JSON.stringify({ exp: now + 3600, sub: actor })).toString('base64url')}.signature`, refresh_token: 'mock-refresh', expires_in: 3600, expires_at: now + 3600, token_type: 'bearer', user: { id: actor, email: 'review@example.test', is_anonymous: false, app_metadata: {}, user_metadata: {} } } });
  });
  await review.goto(`${origin}/authorize?authorization_id=${authorizationId}`);
  await review.getByRole('button', { name: 'Continue with Google' }).waitFor();
  assert(await review.getByLabel('Password').isHidden(), 'The password form starts closed under Google and GitHub');
  await review.getByText('Sign in with email and password', { exact: true }).click();
  await review.getByLabel('Email').fill(' review@example.test '); await review.getByLabel('Password').fill('wrong');
  await review.getByRole('button', { name: 'Sign in', exact: true }).click();
  await review.getByText('The email or the password is not correct. Try again.', { exact: true }).waitFor();
  assert.equal(await review.getByLabel('Password').inputValue(), ''); assert(await review.getByRole('button', { name: 'Sign in', exact: true }).isEnabled());
  await review.getByLabel('Password').fill('test-only-value'); await review.getByRole('button', { name: 'Sign in', exact: true }).click();
  await review.getByText('review@example.test', { exact: true }).waitFor();
  await review.getByRole('button', { name: 'Continue', exact: true }).click();
  await review.getByRole('button', { name: 'Allow connection' }).waitFor();
  await review.getByRole('heading', { name: 'Let ChatGPT use your King Down account?', exact: true }).waitFor();
  assert.deepEqual(await review.locator('#consent li').allTextContents(), [
    'play and continue games against the computer or people',
    'make and join friend games, and find a random player',
    'send game messages, offer draws, resign and ask for rematches',
    'show your rating, badges and past games',
    'change your player name, online status, sounds and other settings',
    'report a player',
  ]);
  assert(!/cannot read the chat|see your email address/.test(await review.locator('#consent').innerText()));
  const privacy = review.getByRole('link', { name: 'Privacy policy', exact: true });
  assert(await privacy.isVisible());
  assert.equal(await privacy.getAttribute('href'), 'https://kingdown.dev/privacy.html');
  assert.equal(await privacy.getAttribute('target'), '_blank');
  assert.equal(await privacy.getAttribute('rel'), 'noopener');
  assert.equal(await review.locator('#scopes').count(), 0);
  assert(!/access tokens|data permissions/.test(await review.locator('#consent').innerText()));
  assert.equal(await review.locator('#client-name').innerText(), 'King Down browser check');
  assert.equal(await review.locator('#account').innerText(), 'review@example.test');
  assert.equal(await review.locator('#redirect').innerText(), 'https://client.example/callback');
  assert.deepEqual(grants, [['password', 'review@example.test'], ['password', 'review@example.test']]);
  assert.equal(new URL(review.url()).searchParams.get('authorization_id'), authorizationId);
  await review.close();
  for (const action of ['approve', 'deny', 'unlisted']) {
    const page = await browser.newPage(); trapErrors(page, action === 'unlisted' ? [{ pattern: /^Failed to load resource: the server responded with a status of 503 \(Service Unavailable\)$/, reason: 'The sign-out failure case returns 503 on purpose.' }] : []); let decision;
    const now = Math.floor(Date.now() / 1000);
    const session = { access_token: `header.${Buffer.from(JSON.stringify({ exp: now + 3600, sub: actor })).toString('base64url')}.signature`, refresh_token: 'mock-refresh', expires_at: now + 3600, expires_in: 3600, token_type: 'bearer', user: { id: actor, email: 'player@example.test', is_anonymous: false, app_metadata: {}, user_metadata: {} } };
    await page.addInitScript(({ session }) => localStorage.setItem('kingdown-plugin-consent', JSON.stringify(session)), { session });
    await page.route('https://project.supabase.co/**', async route => {
      const request = route.request();
      if (new URL(request.url()).pathname.endsWith('/logout')) await route.fulfill({ status: 503, json: { message: 'Temporary sign-out failure' } });
      else if (request.url().endsWith('/consent')) { decision = request.postDataJSON(); await route.fulfill({ json: { redirect_url: `https://client.example/callback?${action === 'approve' ? 'code=mock-code' : 'error=access_denied'}&state=preserved` } }); }
      else await route.fulfill({ json: { authorization_id: authorizationId, redirect_uri: 'https://client.example/callback', client: { id: action === 'unlisted' ? randomUUID() : clientId, name: '<script>Untrusted client</script>', uri: 'https://client.example', logo_uri: '' }, user: { id: actor, email: 'player@example.test' }, scope: 'openid email' } });
    });
    await page.route('https://client.example/**', route => route.fulfill({ contentType: 'text/html', body: 'OAuth callback' }));
    await page.goto(`${origin}/authorize?authorization_id=${authorizationId}`);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByText('<script>Untrusted client</script>', { exact: true }).waitFor();
    assert.equal(await page.locator('script:not([src]):not([type="application/json"])').count(), 0);
    if (action === 'unlisted') {
      assert(await page.getByRole('button', { name: 'Allow connection' }).isDisabled()); assert.equal(decision, undefined);
      await page.getByRole('button', { name: 'Use another account', exact: true }).click();
      await page.getByText('Could not sign out. Try again.', { exact: true }).waitFor();
      assert(await page.getByRole('button', { name: 'Allow connection' }).isDisabled());
      assert(await page.getByRole('button', { name: 'Deny', exact: true }).isEnabled());
    }
    else { await page.getByRole('button', { name: action === 'approve' ? 'Allow connection' : 'Deny', exact: true }).click(); await page.waitForURL('https://client.example/**'); assert.equal(decision.action, action); assert(new URL(page.url()).searchParams.has(action === 'approve' ? 'code' : 'error')); }
    await page.close();
  }
  for (const action of ['continue', 'switch']) {
    const page = await browser.newPage(); trapErrors(page); let details = 0, signedOut = false;
    const now = Math.floor(Date.now() / 1000);
    const session = { access_token: `header.${Buffer.from(JSON.stringify({ exp: now + 3600, sub: actor })).toString('base64url')}.signature`, refresh_token: 'mock-refresh', expires_at: now + 3600, expires_in: 3600, token_type: 'bearer', user: { id: actor, email: 'first@example.test', is_anonymous: false, app_metadata: {}, user_metadata: {} } };
    await page.addInitScript(({ session }) => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1'); localStorage.setItem('kingdown-plugin-consent', JSON.stringify(session));
    }, { session });
    await page.route('https://project.supabase.co/**', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/logout')) { signedOut = true; assert.equal(url.searchParams.get('scope'), 'local'); await route.fulfill({ status: 204 }); }
      else { details++; await route.fulfill({ json: { redirect_url: 'https://client.example/callback?code=existing-grant&state=preserved' } }); }
    });
    await page.route('https://client.example/**', route => route.fulfill({ contentType: 'text/html', body: 'Existing grant callback' }));
    await page.goto(`${origin}/authorize?authorization_id=${authorizationId}`);
    await page.getByText('first@example.test', { exact: true }).waitFor();
    assert.equal(details, 0);
    await page.getByRole('button', { name: action === 'continue' ? 'Continue' : 'Use another account', exact: true }).click();
    if (action === 'continue') { await page.waitForURL('https://client.example/**'); assert.equal(details, 1); assert.equal(signedOut, false); }
    else { await page.getByRole('button', { name: 'Continue with Google' }).waitFor(); assert.equal(signedOut, true); assert.equal(details, 0); assert.equal(new URL(page.url()).searchParams.get('authorization_id'), authorizationId); }
    await page.close();
  }
  const missing = await browser.newPage(); trapErrors(missing); await missing.goto(`${origin}/authorize`); await missing.getByText('This authorization request is unavailable or expired.', { exact: false }).waitFor(); assert(await missing.getByRole('button', { name: 'Allow connection' }).isHidden()); await missing.close();
  assertNoErrors();
  console.log('Consent browser: PKCE social return, review password sign-in (closed form, wrong password, account choice), account choice before existing-grant redirect, local account switch, SDK approve/deny, sign-out failure preserves blocked client, escaped client name, and missing request passed');
} finally { await browser?.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }

// Retry a failed OAuth-discovery configuration without contacting a real Auth server.
const { default: functionHandler } = await import(pathToFileURL(resolve(root, 'server.mjs')).href);
const previousEnv = { ...process.env }, originalFetch = globalThis.fetch; let attempts = 0;
try {
  Object.assign(process.env, { KINGDOWN_PLUGIN_ORIGIN: 'https://plugin.example', KINGDOWN_PLUGIN_DATABASE_URL: process.env.PLUGIN_TEST_DATABASE_URL, SUPABASE_URL: config.supabaseUrl, SUPABASE_PUBLISHABLE_KEY: config.publishableKey, KINGDOWN_PLUGIN_OAUTH_CLIENT_IDS: clientId, KINGDOWN_PLUGIN_OAUTH_READY: '1' });
  globalThis.fetch = async () => { attempts++; throw new Error('Mock transient discovery failure'); };
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = { headersSent: false, writeHead(code) { assert.equal(code, 503); }, end(body) { assert.equal(JSON.parse(body).error, 'King Down server is not configured'); } };
    await functionHandler({}, response);
  }
  assert.equal(attempts, 2); console.log('Compiled function configuration: rejected discovery promise resets for a later request');
} finally { globalThis.fetch = originalFetch; for (const key of Object.keys(process.env)) if (!(key in previousEnv)) delete process.env[key]; Object.assign(process.env, previousEnv); }

const connectionString = process.env.PLUGIN_TEST_DATABASE_URL;
if (!connectionString) throw new Error('Set PLUGIN_TEST_DATABASE_URL for the disposable PostgreSQL hook test');
const db = new URL(connectionString);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(db.hostname) || !db.pathname.endsWith('_test')) throw new Error('Hook checks require a disposable loopback database ending in _test');
const pool = new pg.Pool({ connectionString }), client = await pool.connect();
try {
  await client.query('begin');
  const roles = await client.query("select rolname from pg_roles where rolname='supabase_auth_admin'");
  if (!roles.rowCount) await client.query('create role supabase_auth_admin nologin');
  const sql = (await readFile(new URL('../plugin-deploy/oauth-audience-hook.sql', import.meta.url), 'utf8')).replace(/^begin;$/m, '').replace(/^commit;$/m, '');
  await client.query(sql);
  await client.query('insert into kingdown_oauth.client_resources(client_id,resource) values($1,$2) on conflict(client_id) do update set resource=excluded.resource', [clientId, 'https://plugin.example/mcp']);
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: 'https://project.supabase.co/auth/v1', aud: 'authenticated', exp: now + 3600, iat: now, sub: actor, role: 'authenticated', aal: 'aal1', session_id: randomUUID(), email: 'player@example.test', phone: '', is_anonymous: false, app_metadata: { provider: 'google', providers: ['google'] }, client_id: clientId, scope: 'openid email', user_metadata: { email: 'player@example.test' } };
  await client.query('set local role supabase_auth_admin');
  async function hook(event) { return (await client.query('select public.kingdown_access_token_hook($1::jsonb) as result', [event])).rows[0].result.claims; }
  const oauth = await hook({ user_id: actor, authentication_method: 'oauth_provider/authorization_code', claims }); assert.deepEqual(oauth, { ...claims, aud: 'https://plugin.example/mcp' });
  assert.deepEqual(await hook({ user_id: actor, authentication_method: 'token_refresh', claims }), oauth);
  const website = { ...claims }; delete website.client_id;
  assert.deepEqual(await hook({ user_id: actor, authentication_method: 'oauth', claims: website }), website);
  assert.deepEqual(await hook({ claims: { ...website, user_metadata: { client_id: clientId } } }), { ...website, user_metadata: { client_id: clientId } });
  for (const overrides of [{ client_id: randomUUID() }, { client_id: 'malformed' }, { is_anonymous: true }, { role: 'service_role' }]) assert.deepEqual(await hook({ claims: { ...claims, ...overrides } }), { ...claims, ...overrides });
  await client.query('reset role');
  const grants = await client.query("select has_function_privilege('anon','public.kingdown_access_token_hook(jsonb)','EXECUTE') as anon,has_function_privilege('authenticated','public.kingdown_access_token_hook(jsonb)','EXECUTE') as authenticated"); assert.deepEqual(grants.rows[0], { anon: false, authenticated: false });
  console.log('Supabase hook: real documented claims payload, OAuth issue/refresh, unchanged website claims, unknown clients, metadata spoof, anonymous/service roles, and auth-admin-only grants passed (transaction rolled back)');
} finally { await client.query('rollback'); client.release(); await pool.end(); }
