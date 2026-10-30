/** Measure real account startup while the server holds an unused offline card for 12 s. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env, trapErrors, assertNoErrors, shot } from './checks.mjs';

export async function checkSigninSpeed({ browser, origin, accountOrigin, actors, tokens, tool, setAccountRequest }) {
  await mkdir(env('PLAYABLE_OUT'), { recursive: true });
  const game = (await tool(0, 'kingdown_create', {
    kind: 'friend', mode: 'casual', colour: 'white', command_id: randomUUID(),
    options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false },
  }))._meta.view;
  const rows = [];
  for (const entry of ['direct', 'home']) for (const mode of ['restore', 'refresh', 'sign-in']) {
    const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
    const user = { id: actors[0], aud: 'authenticated', role: 'authenticated', email: 'browser@example.invalid', app_metadata: { provider: 'github' }, user_metadata: {}, created_at: new Date().toISOString() };
    const session = { access_token: tokens[0], refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 600, expires_at: Math.floor(Date.now() / 1000) + (mode === 'refresh' && entry === 'direct' ? -60 : 600), user };
    if (mode !== 'sign-in') await context.addInitScript(({ origin, session }) => {
      if (location.origin === origin && !localStorage.getItem('kingdown.auth')) localStorage.setItem('kingdown.auth', JSON.stringify(session));
    }, { origin, session });
    const requests = [], auth = [], unexpected = []; let start = Date.now();
    context.on('request', request => requests.push({ path: new URL(request.url()).pathname, at_ms: Date.now() - start }));
    setAccountRequest(async (request, response) => {
      const url = new URL(request.url, accountOrigin);
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Headers', 'authorization, apikey, x-client-info, content-type, prefer, accept-profile, content-profile, x-supabase-api-version');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.setHeader('Cache-Control', 'no-store');
      if (request.method === 'OPTIONS') { response.writeHead(204).end(); return; }
      const json = data => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(data)); };
      if (url.pathname === '/rest/v1/user_data') {
        if (request.method === 'GET') return json([]);
        assert.equal(request.method, 'POST');
        let body = ''; for await (const part of request) body += part;
        const row = JSON.parse(body); assert.equal(row.user_id, actors[0]);
        return json(row);
      }
      if (url.pathname === '/auth/v1/settings') return json({ external: { github: true } });
      if (url.pathname === '/auth/v1/authorize') {
        const target = new URL(url.searchParams.get('redirect_to'));
        assert.equal(target.origin, origin); assert(target.searchParams.get('sb_flow_id'));
        target.searchParams.set('code', 'local-proof-code');
        response.writeHead(302, { Location: target.href }).end(); return;
      }
      if (url.pathname === '/auth/v1/token') {
        const grant = url.searchParams.get('grant_type'); auth.push(grant);
        let body = ''; for await (const part of request) body += part;
        const input = JSON.parse(body);
        if (mode === 'refresh') { assert.equal(grant, 'refresh_token'); assert.equal(input.refresh_token, 'local-test-refresh'); }
        else { assert.equal(mode, 'sign-in'); assert.equal(grant, 'pkce'); assert.equal(input.auth_code, 'local-proof-code'); assert(input.code_verifier); }
        return json({ ...session, expires_at: Math.floor(Date.now() / 1000) + 600 });
      }
      unexpected.push(request.method + ' ' + url.pathname); response.writeHead(404).end();
    });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if ([origin, accountOrigin].includes(url.origin)) return route.continue();
      unexpected.push(route.request().method() + ' ' + url.origin + url.pathname); return route.abort();
    });
    const page = await context.newPage(), errors = trapErrors(page);
    const row = { entry, mode, requests, auth }; rows.push(row);
    try {
      if (entry === 'home') {
        await page.goto(origin + '/');
        await page.waitForFunction(() => {
          void navigator.serviceWorker.getRegistration('/').then(registration => { window.__signinRegistration = registration; });
          return !!window.__signinRegistration?.installing;
        }, null, { timeout: 20_000 });
        if (mode !== 'sign-in') await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.sync'))?.confirmed, null, { timeout: 5000 });
        assert.equal(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration('/'))?.installing), true, 'The offline install is still running at the account link');
        row.installing_before_click = true;
        if (mode === 'refresh') await page.evaluate(() => {
          const session = JSON.parse(localStorage.getItem('kingdown.auth'));
          session.expires_at = Math.floor(Date.now() / 1000) - 60;
          localStorage.setItem('kingdown.auth', JSON.stringify(session));
        });
        requests.length = 0; start = Date.now();
        await page.locator('[data-account-play]:visible').first().click();
        await page.waitForURL(origin + '/play/');
      } else await page.goto(origin + '/play/');
      if (mode === 'sign-in') {
        const provider = page.getByRole('button', { name: 'Continue with GitHub', exact: true });
        await provider.waitFor({ timeout: 20_000 });
        row.options_ms = Date.now() - start;
        await provider.click();
      }
      await page.locator(`#games-list [data-game-id="${game.game_id}"]`).waitFor({ timeout: 20_000 });
      await page.locator('[data-screen="play"]:not([hidden]) #setup-start:not(:disabled)').waitFor({ timeout: 5000 });
      row.elapsed_ms = Date.now() - start;
      if (entry === 'home') row.installing_on_ready = await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration('/'))?.installing);
      console.log(`signin-speed ${env('PLAYABLE_BROWSER')} ${entry} ${mode}: list ready in ${row.elapsed_ms} ms; ${JSON.stringify(requests.filter(row => row.path.startsWith('/api/')))}`);
      assert.equal(await page.evaluate(() => navigator.serviceWorker.getRegistration('/').then(Boolean)), entry === 'home', 'Only home entry starts the offline install');
      assert.deepEqual(auth, mode === 'restore' ? [] : [mode === 'refresh' ? 'refresh_token' : 'pkce']);
      assert.deepEqual(unexpected, []); assertNoErrors(errors);
      await shot(page, `signin-speed-${entry}-${mode}`);
    } finally {
      await writeFile(join(env('PLAYABLE_OUT'), 'signin-speed.json'), JSON.stringify(rows, null, 2));
      await context.close();
    }
  }
  for (const row of rows) {
    assert(row.elapsed_ms < 5000, `Account ${row.entry} ${row.mode} takes ${row.elapsed_ms} ms with an unused offline card held for 12 s (limit 5000 ms)`);
    if (row.entry === 'home') assert.equal(row.installing_on_ready, true, 'The list and controls work while the offline file is still held');
  }
}
