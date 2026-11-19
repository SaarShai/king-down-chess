import assert from 'node:assert/strict';
import { CHECK_SITE_ENV, env, launch, shot } from './lib/checks.mjs';
import { newGame, setupTable } from './lib/daylight-home-check.mjs';

const url = new URL('/next.html', env('PLAYABLE_URL'));
const fake = CHECK_SITE_ENV.VITE_SUPABASE_URL;
const account = page => page.locator('.you-page:not(.shell-departing) .you-account');
const signIn = where => where.getByRole('button', { name: 'Sign in', exact: true });
const sheet = page => page.locator('dialog.account-sign-in[open]');
const button = (where, name) => where.getByRole('button', { name, exact: true });
const tab = (page, name) => page.locator(`.shell-nav a[href="#${name}"]`);
const where = (page, name) => page.waitForFunction(name => document.querySelector('.shell-nav [aria-current=page]')?.hash === '#' + name, name);
const layer = page => page.evaluate(() => !!history.state?.layer);

async function tapTab(page, name, safeBottom = false) {
  const { x, y, width, height } = await tab(page, name).boundingBox();
  assert(width >= 44 && height >= 44, `${name} tab has a 44 px target`);
  const point = { x: x + width / 2, y: y + (safeBottom ? height - 2 : height / 2) };
  assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('.shell-nav a')?.hash, point), '#' + name);
  await page.touchscreen.tap(point.x, point.y);
}

async function testSite(context, providerReturn) {
  const authPaths = [];
  const json = (route, body, status = 200) => route.fulfill({ status, json: body, headers: {
    'access-control-allow-origin': url.origin,
    'access-control-allow-headers': 'authorization, apikey, x-client-info, content-type, prefer, accept-profile, content-profile, x-supabase-api-version',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
  } });
  await context.route('**/*', route => {
    const address = new URL(route.request().url());
    return [url.origin, fake].includes(address.origin) ? route.continue() : route.abort();
  });
  await context.route(fake + '/**', route => {
    if (route.request().method() === 'OPTIONS') return json(route, {});
    const address = new URL(route.request().url()), path = address.pathname;
    authPaths.push(path);
    const now = Math.floor(Date.now() / 1000), user = {
      id: 'u-tester', aud: 'authenticated', role: 'authenticated', email: 'tester@example.test',
      app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z',
    };
    const session = { access_token: 'local-check', refresh_token: 'local-check', token_type: 'bearer', expires_in: 600, expires_at: now + 600, user };
    if (path.endsWith('/settings')) return json(route, { external: { google: true, github: true, facebook: true, email: true } });
    if (path.endsWith('/authorize')) {
      const callback = new URL(address.searchParams.get('redirect_to'));
      assert.equal(callback.origin, url.origin);
      assert(callback.searchParams.has('sb_flow_id'));
      callback.searchParams.set(providerReturn === 'fail' ? 'error' : 'code', providerReturn === 'fail' ? 'access_denied' : 'local-proof-code');
      return route.fulfill({ contentType: 'text/html', body: `<script>location.replace(${JSON.stringify(callback.href)})</script>` });
    }
    if (path.endsWith('/token')) {
      const input = route.request().postDataJSON();
      assert.equal(address.searchParams.get('grant_type'), 'pkce');
      assert.equal(input.auth_code, 'local-proof-code');
      assert(input.code_verifier);
      return json(route, session);
    }
    if (path.endsWith('/verify')) return json(route, session);
    if (path.endsWith('/user')) return json(route, user);
    return json(route, path.startsWith('/rest/') && route.request().method() === 'GET' ? [] : {});
  });
  let settingsStatus = 200;
  await context.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/me/settings') return json(route, { settings: {}, me: { handle: 'tester', icon: null } }, settingsStatus);
    if (path === '/api/me/games') return json(route, { games: [], invitations: [] });
    if (path === '/api/me/record') return json(route, { handle: 'tester', icon: null, record: {}, blocks: [], history: [] });
    return route.abort();
  });
  return { authPaths, failSettings: () => { settingsStatus = 503; }, restoreSettings: () => { settingsStatus = 200; } };
}

for (const channel of ['webkit', 'chromium']) {
  const phone = channel === 'webkit';
  const browser = await launch({ channel });
  const viewport = phone ? { width: 390, height: 844 } : { width: 1280, height: 800 };
  const capture = async (page, name) => {
    if (phone) {
      await page.evaluate(() => document.fonts.ready.then(() => true));
      await shot(page, name, { animations: 'disabled' });
    }
  };
  async function run(name, task, options = {}) {
    const { providerReturn, returning, ...browserOptions } = options;
    const context = await browser.newContext({
      viewport, hasTouch: true, isMobile: phone, deviceScaleFactor: phone ? 2 : 1,
      colorScheme: 'light', serviceWorkers: 'block', ...browserOptions,
    });
    try {
      if (!returning) await context.addInitScript(() => localStorage.setItem('kingdown.solo-launch-seen', '1'));
      const fakeSite = await testSite(context, providerReturn);
      const page = await context.newPage(), errors = [];
      page.setDefaultTimeout(7000);
      page.on('pageerror', error => errors.push(error.message));
      await task(page, fakeSite);
      assert.deepEqual(errors, []);
      console.log(`PASS ${channel} ${viewport.width}x${viewport.height} ${name}`);
    } finally { await context.close(); }
  }
  try {
    await run('first load and quick tabs', async page => {
      await page.addInitScript(() => { window.requestIdleCallback = () => { window.idleHeld = true; }; });
      await page.goto(url.href, { waitUntil: 'commit' });
      await tab(page, 'guide').waitFor();
      assert(await page.evaluate(() => window.idleHeld));
      await tapTab(page, 'guide');
      await where(page, 'guide');
      assert.equal(await page.locator('.shell-departing').count(), 1);
      await tapTab(page, 'you');
      await where(page, 'you');
      await account(page).getByRole('heading', { name: 'Account' }).waitFor();
    });

    await run('setup and Opponent tabs and Back', async page => {
      await page.goto(url.href);
      await newGame(page).click();
      await capture(page, 'new-game-tabs');
      assert(await layer(page));
      await tapTab(page, 'guide');
      await where(page, 'guide');
      assert.equal(await layer(page), false);
      await page.goBack();
      await where(page, 'play');
      assert.equal(await setupTable(page).count(), 0);

      await newGame(page).click();
      await button(setupTable(page), 'Opponent').click();
      await button(setupTable(page), 'Invite by name').waitFor();
      await capture(page, 'opponent-tabs');
      await tapTab(page, 'you');
      await where(page, 'you');
      await page.goBack();
      await where(page, 'play');
      assert.equal(await setupTable(page).count(), 0);

      await newGame(page).click();
      await tapTab(page, 'play');
      await page.waitForFunction(() => !history.state?.layer);
      assert.equal(await setupTable(page).count(), 0);
      await where(page, 'play');
    }, { reducedMotion: 'reduce' });

    await run('Guide entry Back and scrolled You', async page => {
      await page.goto(url.href);
      await tapTab(page, 'guide');
      await page.locator('.guide-page:not(.shell-departing)').getByText('Pieces', { exact: true }).click();
      await page.locator('.guide-page[data-view="section"] [data-entry]').first().click();
      await page.locator('.guide-page[data-view="entry"]').waitFor();
      await page.goBack();
      await page.locator('.guide-page[data-view="section"]:not(.shell-departing)').waitFor();
      await tapTab(page, 'you');
      await signIn(account(page)).waitFor();
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      assert(await page.evaluate(() => window.scrollY > 0), 'You scrolls down');
      await tapTab(page, 'play');
      await where(page, 'play');
    });

    if (phone) await run('full cells and bottom safe area', async page => {
      await page.goto(url.href);
      await page.evaluate(() => document.documentElement.style.setProperty('--safe-bottom', '34px'));
      for (const name of ['guide', 'you', 'play']) {
        const points = await tab(page, name).evaluate(link => {
          const { left, right, top, bottom } = link.getBoundingClientRect();
          return [left + 1, right - 1].flatMap(x => [top + 1, bottom - 1].map(y => document.elementFromPoint(x, y)?.closest('.shell-nav a')?.hash));
        });
        assert.deepEqual(points, Array(4).fill('#' + name));
        await tapTab(page, name, true);
        await where(page, name);
      }
      await capture(page, 'bottom-safe-area');
    }, { reducedMotion: 'reduce' });

    await run('game result to Home', async page => {
      await page.addInitScript(() => {
        localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', rules: { kings: [null, null], hands: [[], []] }, pace: 'off' }));
      });
      await page.goto(url.href);
      await button(page.locator('.play-home'), 'Continue').click();
      await button(page, 'Menu').click();
      await button(page, 'Resign').click();
      await button(page.locator('dialog[open]'), 'Resign').click();
      await button(page.locator('.play-result'), 'Home').click();
      await where(page, 'play');
      await tapTab(page, 'guide');
      await where(page, 'guide');
      await tapTab(page, 'you');
      await where(page, 'you');
    });

    if (process.env.KINGDOWN_SOLO_LAUNCH === '1') await run('Welcome back notice', async page => {
      await page.addInitScript(() => localStorage.setItem('kingdown.test-returning-player', '1'));
      await page.goto(url.href);
      await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
      assert.equal(await page.locator('.shell-nav').count(), 0);
      await button(page, 'Continue').click();
      await tab(page, 'guide').waitFor();
      await tapTab(page, 'guide');
      await where(page, 'guide');
      await tapTab(page, 'you');
      await where(page, 'you');
    }, { returning: true });

    await run('Home and You sign-in, then email options', async (page, { authPaths }) => {
      await page.goto(url.href);
      const homeSignIn = signIn(page.locator('.play-home'));
      await homeSignIn.waitFor();
      await capture(page, 'home-signed-out');
      await homeSignIn.click();
      await button(sheet(page), 'Continue with email').waitFor();
      await capture(page, 'home-sign-in');
      assert.equal(await setupTable(page).count(), 0);
      assert.equal(await page.locator('.shell-nav').isVisible(), false);
      await page.goBack();
      await sheet(page).waitFor({ state: 'detached' });
      assert(await homeSignIn.evaluate(node => node === document.activeElement));
      await tapTab(page, 'you');
      await signIn(account(page)).waitFor();
      assert.equal(await account(page).evaluate(node => node.previousElementSibling.tagName), 'H1');
      await capture(page, 'you-signed-out');
      await signIn(account(page)).click();
      await button(sheet(page), 'Continue with Google').waitFor();
      await button(sheet(page), 'Continue with Facebook').waitFor();
      await capture(page, 'you-sign-in');
      assert.equal(await setupTable(page).count(), 0);
      await button(sheet(page), 'Continue with email').click();
      await capture(page, 'email-address');
      await sheet(page).getByRole('textbox', { name: 'Email' }).fill('tester@example.test');
      await button(sheet(page), 'Send code').click();
      await sheet(page).getByRole('heading', { name: 'Enter the code' }).waitFor();
      await capture(page, 'email-code');
      assert(authPaths.includes('/auth/v1/otp'));
      await sheet(page).getByRole('textbox', { name: 'Code' }).fill('123456');
      await button(sheet(page), 'Continue').click();
      await button(account(page), 'Sign out').waitFor();
      await sheet(page).waitFor({ state: 'detached' });
      await where(page, 'you');
    }, { reducedMotion: 'reduce' });

    for (const providerReturn of ['ok', 'fail']) await run(`provider return ${providerReturn}`, async (page, { authPaths }) => {
      await page.goto(url.href + (providerReturn === 'fail' ? '#you' : ''));
      await signIn(providerReturn === 'fail' ? account(page) : page.locator('.play-home')).click();
      await button(sheet(page), 'Continue with GitHub').click();
      await page.waitForURL(new URL('/next.html#you', url).href);
      if (providerReturn === 'ok') await button(account(page), 'Sign out').waitFor();
      else await account(page).getByText('Sign-in does not finish. Try again.', { exact: true }).waitFor();
      await where(page, 'you');
      assert.equal(await setupTable(page).count(), 0);
      assert.equal(await sheet(page).count(), 0);
      assert.equal(authPaths.includes('/auth/v1/token'), providerReturn === 'ok');
      if (providerReturn === 'ok') {
        assert.match(await account(page).innerText(), /tester/);
        await capture(page, 'you-signed-in');
        await tapTab(page, 'play');
        assert.equal(await signIn(page.locator('.play-home')).isVisible(), false);
        await capture(page, 'home-signed-in');
      } else {
        await capture(page, 'provider-retry');
        await signIn(account(page)).click();
        await button(sheet(page), 'Continue with GitHub').waitFor();
      }
    }, { providerReturn, reducedMotion: 'reduce' });

    await run('account load fails and retries', async (page, fakeSite) => {
      fakeSite.failSettings();
      await page.addInitScript(() => {
        const now = Math.floor(Date.now() / 1000);
        if (!localStorage.getItem('kingdown.auth')) localStorage.setItem('kingdown.auth', JSON.stringify({
          access_token: 'local-check', refresh_token: 'local-check', token_type: 'bearer', expires_in: 600, expires_at: now + 600,
          user: { id: 'u-tester', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} },
        }));
      });
      await page.goto(url.href + '#you');
      await signIn(account(page)).waitFor();
      assert.match(await account(page).innerText(), /Check your connection and try again/);
      await capture(page, 'account-load-retry');
      await signIn(account(page)).click();
      await button(sheet(page), 'Try again').waitFor();
      await capture(page, 'account-sheet-retry');
      fakeSite.restoreSettings();
      await button(sheet(page), 'Try again').click();
      await button(account(page), 'Sign out').waitFor();
      await sheet(page).waitFor({ state: 'detached' });
    }, { reducedMotion: 'reduce' });
  } finally { await browser.close(); }
}
