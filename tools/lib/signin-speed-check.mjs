/** Measure real account startup while the server holds an unused offline card for 12 s. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env, trapErrors, assertNoErrors, shot } from './checks.mjs';

export async function checkSigninSpeed({ browser, origin, accountOrigin, actors, tokens, tool }) {
  await mkdir(env('PLAYABLE_OUT'), { recursive: true });
  const game = (await tool(0, 'kingdown_create', {
    kind: 'friend', mode: 'casual', colour: 'white', command_id: randomUUID(),
    options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false },
  }))._meta.view;
  const rows = [];
  for (const mode of ['restore', 'refresh', 'sign-in']) {
    const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
    const user = { id: actors[0], aud: 'authenticated', role: 'authenticated', email: 'browser@example.invalid', app_metadata: { provider: 'github' }, user_metadata: {}, created_at: new Date().toISOString() };
    const session = { access_token: tokens[0], refresh_token: 'local-test-refresh', token_type: 'bearer', expires_in: 600, expires_at: Math.floor(Date.now() / 1000) + (mode === 'refresh' ? -60 : 600), user };
    if (mode !== 'sign-in') await context.addInitScript(({ origin, session }) => {
      if (location.origin === origin && !localStorage.getItem('kingdown.auth')) localStorage.setItem('kingdown.auth', JSON.stringify(session));
    }, { origin, session });
    const requests = [], auth = [], unexpected = [], start = Date.now();
    context.on('request', request => requests.push({ path: new URL(request.url()).pathname, at_ms: Date.now() - start }));
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin === origin) return route.continue();
      if (url.origin === accountOrigin) {
        if (url.pathname === '/auth/v1/settings') return route.fulfill({ json: { external: { github: true } } });
        if (url.pathname === '/auth/v1/authorize') {
          const target = new URL(url.searchParams.get('redirect_to'));
          assert.equal(target.origin, origin); assert(target.searchParams.get('sb_flow_id'));
          target.searchParams.set('code', 'local-proof-code');
          // WebKit cannot fulfill an intercepted request with a redirect status.
          return route.fulfill({ contentType: 'text/html', body: `<script>location.replace(${JSON.stringify(target.href)})</script>` });
        }
        if (url.pathname === '/auth/v1/token') {
          const grant = url.searchParams.get('grant_type'); auth.push(grant);
          const input = request.postDataJSON();
          if (mode === 'refresh') { assert.equal(grant, 'refresh_token'); assert.equal(input.refresh_token, 'local-test-refresh'); }
          else { assert.equal(mode, 'sign-in'); assert.equal(grant, 'pkce'); assert.equal(input.auth_code, 'local-proof-code'); assert(input.code_verifier); }
          return route.fulfill({ json: { ...session, expires_at: Math.floor(Date.now() / 1000) + 600 } });
        }
      }
      unexpected.push(request.method() + ' ' + url.origin + url.pathname); return route.abort();
    });
    const page = await context.newPage(), errors = trapErrors(page);
    const row = { mode, requests, auth }; rows.push(row);
    try {
      await page.goto(origin + '/play/');
      if (mode === 'sign-in') await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).click({ timeout: 5000 });
      await page.locator(`#games-list [data-game-id="${game.game_id}"]`).waitFor({ timeout: 20_000 });
      await page.locator('[data-screen="play"]:not([hidden]) #setup-start:not(:disabled)').waitFor({ timeout: 5000 });
      row.elapsed_ms = Date.now() - start;
      console.log(`signin-speed ${env('PLAYABLE_BROWSER')} ${mode}: list ready in ${row.elapsed_ms} ms; ${JSON.stringify(requests.filter(row => row.path.startsWith('/api/')))}`);
      assert(row.elapsed_ms < 5000, `Account ${mode} takes ${row.elapsed_ms} ms with an unused offline card held for 12 s (limit 5000 ms)`);
      assert.equal(await page.evaluate(() => navigator.serviceWorker.getRegistration('/').then(Boolean)), false, 'Account startup does not install the offline game');
      assert.deepEqual(auth, mode === 'restore' ? [] : [mode === 'refresh' ? 'refresh_token' : 'pkce']);
      assert.deepEqual(unexpected, []); assertNoErrors(errors);
      await shot(page, `signin-speed-${mode}`);
    } finally {
      await writeFile(join(env('PLAYABLE_OUT'), 'signin-speed.json'), JSON.stringify(rows, null, 2));
      await context.close();
    }
  }
}
