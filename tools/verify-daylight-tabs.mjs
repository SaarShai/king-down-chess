import assert from 'node:assert/strict';
import { CHECK_SITE_ENV, env, launch, shot } from './lib/checks.mjs';
import { newGame, setupTable } from './lib/daylight-home-check.mjs';

const url = new URL('/next.html', env('PLAYABLE_URL'));
const fake = CHECK_SITE_ENV.VITE_SUPABASE_URL;
const button = (where, name) => where.getByRole('button', { name, exact: true });
const home = page => page.locator('.play-home:not(.shell-departing)');
const settings = page => page.locator('dialog.settings-sheet[open]');
const account = page => settings(page).locator('.settings-account');
const signIn = where => button(where, 'Sign in');
const sheet = page => page.locator('dialog.account-sign-in[open]');
const menu = page => page.locator('dialog.game-menu-dialog[open]');
const openSettings = page => home(page).locator('.home-settings-btn').click();
const settingsOrder = ['pieces', 'coords', 'sound', 'vibration', 'motion'];
const soloSave = JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', rules: { kings: [null, null], hands: [[], []] }, pace: 'off' });
// White plays a2-a3; Black then mates with Qd8-h4.
const mateSave = JSON.stringify({ back: '', fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR w KQkq - 0 3', moves: [], white: 'human', black: 'ai', skill: 'club', pace: 'normal', sound: false, rules: { kings: [null, null], hands: [[], []] } });

async function oneDialog(page, dialog) {
  await dialog.waitFor();
  assert.equal(await page.locator('dialog[open]').count(), 1);
  assert.equal(await page.evaluate(() => !!history.state?.layer), true);
}
async function noDialog(page) {
  await page.waitForFunction(() => !history.state?.layer && !document.querySelector('dialog[open]'));
}
async function focusIs(control) {
  await control.page().waitForFunction(selector => document.activeElement?.matches(selector), await control.evaluate(node => '.' + [...node.classList].at(-1)));
}

async function testSite(context, providerReturn) {
  const authPaths = [];
  const providerReplies = [];
  const json = (route, body, status = 200) => route.fulfill({ status, json: body, headers: {
    'access-control-allow-origin': url.origin,
    'access-control-allow-headers': 'authorization, apikey, x-client-info, content-type, prefer, accept-profile, content-profile, x-supabase-api-version',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
  } });
  await context.route('**/*', route => {
    const address = new URL(route.request().url());
    return [url.origin, fake].includes(address.origin) ? route.continue() : route.abort();
  });
  await context.route(fake + '/**', async route => {
    if (route.request().method() === 'OPTIONS') return json(route, {});
    const address = new URL(route.request().url()), path = address.pathname;
    authPaths.push(path);
    const now = Math.floor(Date.now() / 1000), user = {
      id: 'u-tester', aud: 'authenticated', role: 'authenticated', email: 'tester@example.test',
      app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z',
    };
    const session = { access_token: 'local-check', refresh_token: 'local-check', token_type: 'bearer', expires_in: 600, expires_at: now + 600, user };
    if (path.endsWith('/settings')) {
      const { status = 200, delay = 0 } = providerReplies.shift() ?? {};
      if (delay) await new Promise(done => setTimeout(done, delay));
      return json(route, { external: { google: true, github: true, facebook: true, email: true } }, status);
    }
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
    if (path === '/api/games' && route.request().method() === 'POST') {
      const input = route.request().postDataJSON();
      assert.equal(input.open_link, true);
      return json(route, {
        view: { game_id: '11111111-1111-4111-8111-111111111111', status: 'waiting', kind: 'friend', seat: 0, options: input.options },
        invite: { token: 'local-proof-invite' },
      });
    }
    return route.abort();
  });
  return { authPaths, providerReplies, failSettings: () => { settingsStatus = 503; }, restoreSettings: () => { settingsStatus = 200; } };
}

const failures = [];
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
    const { providerReturn, ...browserOptions } = options;
    const context = await browser.newContext({
      viewport, hasTouch: true, isMobile: phone, deviceScaleFactor: phone ? 2 : 1,
      colorScheme: 'light', serviceWorkers: 'block', ...browserOptions,
    });
    try {
      await context.addInitScript(() => localStorage.setItem('kingdown.solo-launch-seen', '1'));
      const fakeSite = await testSite(context, providerReturn);
      const page = await context.newPage(), errors = [];
      page.setDefaultTimeout(7000);
      page.on('pageerror', error => errors.push(error.message));
      await task(page, fakeSite);
      assert.deepEqual(errors, []);
      console.log(`PASS ${channel} ${viewport.width}x${viewport.height} ${name}`);
    } catch (error) {
      failures.push(error);
      console.error(`FAIL ${channel} ${name}`, error);
    } finally { await context.close(); }
  }
  try {
    await run('Home has room for all actions', async page => {
      await page.goto(url.href);
      const sizes = phone ? [[320, 568], [360, 640], [390, 844], [844, 390]] : [[1280, 800], [1920, 1080]];
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        await page.evaluate(async height => {
          document.documentElement.style.setProperty('--safe-top', height === 844 ? '44px' : '0px');
          document.documentElement.style.setProperty('--safe-bottom', height === 844 ? '34px' : '0px');
          await document.fonts.ready;
        }, height);
        const bounds = selector => home(page).locator(selector).boundingBox();
        const bar = await bounds('.home-topbar'), brand = await bounds('.home-brand h1');
        const art = await bounds('.home-hero'), actions = await bounds('.home-start');
        assert(bar && brand && art && actions);
        if (width / height >= 1.25) assert(art.x + art.width <= bar.x && art.x + art.width <= actions.x);
        else assert(bar.y + bar.height <= brand.y && art.y + art.height <= actions.y);
        for (const selector of ['.home-hero-new', '.home-summary', '.home-friend-btn']) {
          const action = await bounds(selector);
          assert(action && action.height >= 44 && action.y + action.height <= height, `${selector} fits ${width}×${height}`);
        }
        await shot(page, `home-${width}x${height}`, { animations: 'disabled' });
      }
    }, { reducedMotion: 'reduce' });

    await run('Home setup, Guide, and settings each have one owner', async page => {
      await page.goto(url.href);
      await button(home(page), 'Play a friend').click();
      const setup = setupTable(page);
      await oneDialog(page, setup);
      assert.equal(await setup.getByRole('radio', { name: 'Friend' }).getAttribute('aria-checked'), 'true');
      await page.goBack();
      await noDialog(page);
      await newGame(page).click();
      await oneDialog(page, setup);
      assert.equal(await setup.getByRole('radio', { name: 'Computer' }).getAttribute('aria-checked'), 'true');
      await page.keyboard.press('Escape');
      await noDialog(page);
      await home(page).locator('.home-guide-btn').click();
      await page.waitForURL('**/next.html#guide');
      // A free action card page names both finish buttons, as the Rules tab does.
      await page.getByRole('tab', { name: 'Cards' }).click();
      await page.locator('.guide-card[data-entry="Freeze"]').click();
      const freezeLimits = await page.locator('.guide-page[data-view="entry"] .learn-limits').textContent();
      assert(freezeLimits.includes('If your king is safe, you can select End turn or Send.') && !freezeLimits.includes('Send or Send'), freezeLimits);
      if (phone) await button(page, 'Back to Cards').click();
      await button(page, 'Back to Home').click();
      await openSettings(page);
      await oneDialog(page, settings(page));
      assert.deepEqual(await settings(page).locator('[data-setting]').evaluateAll(rows => rows.map(row => row.dataset.setting)), settingsOrder);
      assert.deepEqual(await settings(page).locator('.about-inline a').allTextContents(), ['Privacy', 'Terms', 'Support']);
      await capture(page, 'account-settings');
      if (phone) await page.keyboard.press('Escape'); else await page.mouse.click(2, 2);
      await noDialog(page);
      await focusIs(home(page).locator('.home-settings-btn'));
      await page.goto(url.href + '#you');
      await oneDialog(page, settings(page));
      await page.goBack();
      await noDialog(page);
      assert.equal(new URL(page.url()).hash, '#play');
    }, { reducedMotion: 'reduce' });

    await run('Play checks for a new save and starts solo immediately on fresh Home', async page => {
      await page.goto(url.href);
      await home(page).locator('.home-hero-new').evaluate((play, save) => {
        localStorage.setItem('kingdown.save', save);
        play.click();
      }, soloSave);
      const setup = setupTable(page);
      await oneDialog(page, setup);
      await button(setup, 'Start game').click();
      await setup.getByRole('heading', { name: 'Start a new game?' }).waitFor();
      assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.save')), soloSave);
      await page.evaluate(() => localStorage.removeItem('kingdown.save'));
      await page.reload();
      await home(page).locator('.home-hero-new').click();
      await page.waitForSelector('.play-grid:not([inert])');
      await noDialog(page);
      assert.equal(await page.locator('.play-history-strip').isVisible(), false);
      await button(page, 'Menu').click();
      await oneDialog(page, menu(page));
      assert.equal(await button(menu(page), 'History').count(), 0);
      assert.equal(await menu(page).locator('.menu-note').count(), 0);
    }, { reducedMotion: 'reduce' });

    await run('Menu, Guide, History and result actions keep the game route', async page => {
      await page.addInitScript(save => {
        if (!localStorage.getItem('kingdown.save')) localStorage.setItem('kingdown.save', save);
        localStorage.setItem('kingdown.hand', 'ribbon');
      }, soloSave);
      await page.goto(url.href);
      await button(home(page), 'Continue').click();
      await page.waitForSelector('.play-grid:not([inert])');
      await page.locator('.play-board-host').evaluate(board => { window.testBoard = board; });
      assert.equal(await page.locator('.play-game').getAttribute('data-hand'), 'hand');
      const replay = page.locator('.play-turn [data-mode="replay"]');
      assert.equal(await replay.locator('.play-replay-label').textContent(), 'Replay');
      await page.locator('.play-square[data-square="28"]').click();
      const rule = page.locator('.daylight-help-info');
      assert((await rule.boundingBox()).height >= 44);
      assert.equal(await rule.locator('.daylight-help-rule-label').textContent(), 'Rule');
      if (phone) {
        await page.setViewportSize({ width: 360, height: 640 });
        assert.equal(await rule.locator('.daylight-help-rule-label').evaluate(label => label.clientWidth), 1);
        await page.waitForFunction(() => document.querySelector('.play-turn [data-mode="replay"] .play-replay-label')?.clientWidth === 1);
        await page.setViewportSize(viewport);
      }
      const sameBoard = () => page.locator('.play-board-host').evaluate(board => board === window.testBoard);
      const menuButton = button(page.locator('.play-opp'), 'Menu');
      const openMenu = async () => { await menuButton.click(); await oneDialog(page, menu(page)); };
      await openMenu();
      assert.deepEqual(await menu(page).locator('[data-setting]').evaluateAll(rows => rows.map(row => row.dataset.setting)), settingsOrder);
      await capture(page, 'game-menu');
      await button(menu(page), 'Guide').click();
      const guide = page.locator('dialog.guide-dialog[open]');
      await oneDialog(page, guide);
      await guide.locator('.guide-list-pane [data-entry]').first().click();
      await guide.locator('.guide-page[data-view="entry"]').waitFor();
      if (phone) {
        await page.goBack();
        await guide.locator('.guide-page[data-view="section"]').waitFor();
      }
      await page.goBack();
      await noDialog(page);
      await focusIs(menuButton);
      assert(await sameBoard());
      assert.equal(new URL(page.url()).hash, '#game');
      await openMenu();
      await button(menu(page), 'History').click();
      const history = page.locator('dialog.history-dialog[open]');
      await oneDialog(page, history);
      assert.equal(await history.locator('.play-history-turn').count(), 2);
      await button(history, 'Close history').click();
      await noDialog(page);
      await focusIs(menuButton);
      const resign = async () => {
        await openMenu();
        await button(menu(page), 'Resign').click();
        const confirm = page.getByRole('dialog', { name: 'Resign this game?' });
        await oneDialog(page, confirm);
        await button(confirm, 'Resign').click();
        await noDialog(page);
      };
      await resign();
      await button(page.locator('.play-result'), 'Rematch').click();
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save'))?.white === 'ai');
      assert(await sameBoard());
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).back), 'RNBQKBNR');
      await resign();
      await button(page.locator('.play-result'), 'New game').click();
      const setup = setupTable(page);
      await oneDialog(page, setup);
      assert.equal(new URL(page.url()).hash, '#game');
      const previous = await page.evaluate(() => localStorage.getItem('kingdown.save'));
      await button(setup, 'Start game').evaluate((start, save) => {
        start.click();
        localStorage.setItem('kingdown.save', save);
      }, soloSave);
      await noDialog(page);
      await page.getByRole('status').getByText('A saved game changed. Check before starting.').waitFor();
      assert.equal(new URL(page.url()).hash, '#game');
      assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.save')), soloSave);
      await page.evaluate(save => localStorage.setItem('kingdown.save', save), previous);
      await button(page.locator('.play-result'), 'New game').click();
      await oneDialog(page, setup);
      const level = setup.getByRole('radiogroup', { name: 'Computer level' });
      await level.getByRole('radio', { checked: true }).press('End');
      await button(setup, 'Start game').click();
      await page.waitForFunction(() => {
        const save = JSON.parse(localStorage.getItem('kingdown.save'));
        return save?.white === 'human' && save?.skill === 'club' && save.resigned == null;
      });
      await noDialog(page);
      assert.equal(new URL(page.url()).hash, '#game');
    }, { reducedMotion: 'reduce' });

    // A game end closes Menu and the Resign confirm, whose actions are stale (polish item 8).
    for (const open of ['Menu', 'Resign']) await run(`the computer's checkmate closes ${open}`, async page => {
      await page.addInitScript(save => localStorage.setItem('kingdown.save', save), mateSave);
      await page.goto(url.href);
      await button(home(page), 'Continue').click();
      await page.waitForSelector('.play-grid:not([inert])');
      await page.locator('.play-square[data-square="8"]').click();
      await page.locator('.play-square[data-square="16"]').click();
      await button(page.locator('.play-turn'), 'End turn').click();
      await button(page.locator('.play-opp'), 'Menu').click();
      await oneDialog(page, menu(page));
      if (open === 'Resign') {
        await button(menu(page), 'Resign').click();
        await oneDialog(page, page.getByRole('dialog', { name: 'Resign this game?' }));
      }
      assert.equal(await page.locator('.play-result').count(), 0, `${open} opens before the computer replies`);
      await page.locator('.play-result').waitFor({ state: 'attached' });
      await noDialog(page);
      await page.locator('.play-result').getByText('The computer wins').waitFor();
      await capture(page, `mate-${open.toLowerCase()}`);
    });

    await run('Email sign-in replaces and restores settings', async page => {
      await page.goto(url.href);
      await signIn(home(page)).click();
      await oneDialog(page, sheet(page));
      await page.goBack();
      await noDialog(page);
      await openSettings(page);
      await signIn(account(page)).click();
      await button(sheet(page), 'Continue with email').click();
      await oneDialog(page, sheet(page));
      await sheet(page).getByRole('textbox', { name: 'Email' }).fill('tester@example.test');
      await button(sheet(page), 'Send code').click();
      await sheet(page).getByRole('textbox', { name: 'Code' }).fill('123456');
      await button(sheet(page), 'Continue').click();
      await button(account(page), 'Sign out').waitFor();
      await oneDialog(page, settings(page));
      await page.setViewportSize({ width: viewport.width, height: 330 });
      assert(await settings(page).locator('.sheet-body').evaluate(body => {
        const head = body.previousElementSibling, top = head.getBoundingClientRect().top;
        body.scrollTop = body.scrollHeight;
        return body.scrollTop > 0 && head.getBoundingClientRect().top === top;
      }));
      await page.setViewportSize(viewport);
      await button(account(page), 'Blocked players').click();
      const blocks = page.getByRole('dialog', { name: 'Blocked players' });
      await oneDialog(page, blocks);
      await page.goBack();
      await noDialog(page);
      await focusIs(home(page).locator('.home-settings-btn'));
      assert.equal(await signIn(home(page)).isVisible(), false);
      assert.equal(await home(page).locator('.home-settings-btn .profile-portrait').count(), 1);
    }, { reducedMotion: 'reduce' });

    for (const providerReturn of ['ok', 'fail']) {
      await run(`account provider return ${providerReturn}`, async (page, { authPaths }) => {
        await page.goto(url.href);
        await signIn(home(page)).click();
        await button(sheet(page), 'Continue with GitHub').click();
        if (providerReturn === 'ok') await button(account(page), 'Sign out').waitFor();
        else await account(page).getByText('Sign-in does not finish. Try again.').waitFor();
        await oneDialog(page, settings(page));
        assert.equal(authPaths.includes('/auth/v1/token'), providerReturn === 'ok');
        assert.equal(new URL(page.url()).hash, '#play');
      }, { providerReturn, reducedMotion: 'reduce' });

      await run(`friend provider return ${providerReturn}`, async page => {
        await page.goto(url.href);
        await button(home(page), 'Play a friend').click();
        const setup = setupTable(page);
        await button(setup, 'Invite by name').click();
        await button(setup, 'Continue with GitHub').click();
        if (providerReturn === 'ok') await setup.getByRole('textbox', { name: 'Game name' }).waitFor();
        else {
          await home(page).getByText('Sign-in does not finish. Try again.').waitFor();
          assert.equal(await setup.getByRole('textbox', { name: 'Game name' }).count(), 0);
          assert.equal(await button(setup, 'Continue with GitHub').count(), 0);
        }
        await oneDialog(page, setup);
        assert.equal(await setup.getByRole('radio', { name: 'Friend', includeHidden: true, exact: true }).getAttribute('aria-checked'), 'true');
        assert.notEqual(new URL(page.url()).hash, '#person');
      }, { providerReturn, reducedMotion: 'reduce' });
    }
    await run('friend provider return sends the pending link', async page => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'share', { value: undefined });
        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.proofCopy = text; } } });
      });
      await page.goto(url.href);
      await button(home(page), 'Play a friend').click();
      const setup = setupTable(page);
      await button(setup, 'Send invite link').click();
      await button(setup, 'Continue with GitHub').click();
      await page.waitForFunction(() => window.proofCopy?.endsWith('#join=local-proof-invite'));
      await noDialog(page);
      assert.equal(new URL(page.url()).hash, '#play');
    }, { providerReturn: 'ok', reducedMotion: 'reduce' });
  } finally { await browser.close(); }
}
if (failures.length) throw new Error(`${failures.length} cases failed.`);
