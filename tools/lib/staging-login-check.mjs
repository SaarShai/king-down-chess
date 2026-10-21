/** Compiled website password form + real local game API. Auth replies use disposable actors. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { noSidewaysScroll, shot } from './checks.mjs';

export async function checkStagingLogin({ browser, origin, accountOrigin, actors, tokens, tool }) {
  const games = await Promise.all([0, 1].map(async seat => (await tool(seat, 'kingdown_create', {
    kind: 'solo', mode: 'casual', colour: 'white', level: 'beginner', command_id: randomUUID(),
    options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false },
  }))._meta.view));
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const unexpected = []; let attempts = 0;
  // Intercept before the network: this check never sends fixture credentials to staging.
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin) return route.continue();
    if (url.origin === accountOrigin && url.pathname === '/auth/v1/settings') return route.fulfill({ json: { external: { github: true, google: false } } });
    if (url.origin === accountOrigin && url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'password') {
      const body = request.postDataJSON(); attempts++;
      assert.equal(body.email, 'privacy-check@kingdown.example');
      if (body.password === 'wrong-fixture-password') return route.fulfill({ status: 400, json: { code: 'invalid_credentials', message: 'Private fixture failure detail' } });
      assert.equal(body.password, 'fixture-password');
      return route.fulfill({ json: { access_token: tokens[1], refresh_token: 'fixture-refresh', token_type: 'bearer', expires_in: 600,
        user: { id: actors[1], aud: 'authenticated', role: 'authenticated', email: body.email, app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() } } });
    }
    unexpected.push(request.method() + ' ' + url.origin + url.pathname); return route.abort();
  });
  try {
    const page = await context.newPage(); page.setDefaultTimeout(15_000);
    await page.goto(origin + '/g/' + games[0].game_id);
    const email = page.getByLabel('Email', { exact: true }), password = page.getByLabel('Password', { exact: true });
    await password.waitFor(); assert.equal(await email.inputValue(), 'privacy-check@kingdown.example'); assert(await email.getAttribute('readonly') !== null);
    await noSidewaysScroll(page); await shot(page, 'staging-password-form');
    await password.fill('wrong-fixture-password'); await password.press('Enter');
    await page.getByText('Sign-in failed. Check the password and try again.', { exact: true }).waitFor();
    assert.equal(await password.inputValue(), ''); assert.equal(await page.getByText('Private fixture failure detail').count(), 0);
    const refused = page.waitForResponse(response => new URL(response.url()).pathname === '/api/games/' + games[0].game_id);
    await password.fill('fixture-password'); await password.press('Enter');
    const refusal = await refused; assert.equal(refusal.status(), 403); assert.equal((await refusal.json()).code, 'FORBIDDEN');
    await page.getByText('This game is not available to this account. You can open your own games.', { exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/g/' + games[0].game_id, 'Password sign-in preserves the requested private route');
    assert.equal(await page.locator('#board').isVisible(), false, 'B cannot see A private board');
    await shot(page, 'staging-password-private-refusal');
    await page.getByRole('link', { name: 'Open your games', exact: true }).click();
    await page.locator('[data-screen="play"]:not([hidden]) #setup-start:not(:disabled)').waitFor();
    assert.equal(new URL(page.url()).pathname, '/play/', 'An account refusal has a usable exit');
    await page.goto(origin + '/g/' + games[1].game_id);
    await page.locator('#board').waitFor({ state: 'visible' });
    await shot(page, 'staging-password-own-game');
    assert.equal(attempts, 2); assert.deepEqual(unexpected, []);
    console.log('PASS staging-login: fixed account, failed password recovery, normal SDK session, route return, real API private refusal and own-game access; no external request');
  } finally { await context.close(); }
}
