/** Local entry links use the existing account route without changing either game. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { endTurn, lanMoves, openAccount } from '../app-ui.mjs';
import { assertNoErrors, insideViewport, minTarget, noOverlap, noSidewaysScroll, shot, trapErrors } from './checks.mjs';

const SAVE = { back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'human', sound: false, pace: 'off' };
const ready = async page => { await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready()); };
const readSave = page => page.evaluate(() => localStorage.getItem('kingdown.save'));

export async function checkAccountDiscovery({ browser, context, origin, actors, pool, tool }) {
  const errors = [], requests = [];
  // One server-owned game exists before navigation. No UI action should create a second one.
  const created = (await tool(0, 'kingdown_create', { kind: 'solo', mode: 'casual', colour: 'white', level: 'beginner', command_id: randomUUID(),
    options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } }))._meta.view;
  const counts = async () => (await pool.query('select (select count(*) from public.game_players where user_id=$1) games, (select count(*) from public.game_commands c join public.game_players p on p.game_id=c.game_id where p.user_id=$1) commands', [actors[0]])).rows[0];
  const before = await counts();
  const webkit = browser.browserType().name() === 'webkit';
  const local = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', ...(webkit ? { serviceWorkers: 'block' } : {}) });
  const settingsUrl = 'https://web-proof.supabase.co/auth/v1/settings';
  let settings = { external: { github: true, google: false } }, settingsReads = 0;
  await local.exposeBinding('testProviderSettings', (_source, key) => { settingsReads++; assert.equal(key, 'sb_publishable_local_test'); return settings; });
  await local.addInitScript(url => {
    const nativeFetch = window.fetch;
    window.fetch = (input, init) => {
      if (String(input) === url) return window.testProviderSettings(new Headers(init?.headers).get('apikey'))
        .then(settings => new Response(JSON.stringify(settings), { headers: { 'Content-Type': 'application/json' } }));
      return nativeFetch(input, init);
    };
  }, settingsUrl);
  local.on('request', request => { if (new URL(request.url()).origin !== origin && request.url() !== settingsUrl) requests.push('external request'); if (request.method() !== 'GET') requests.push(request.method() + ' ' + new URL(request.url()).pathname); });
  const page = await local.newPage(); errors.push(trapErrors(page)); page.setDefaultTimeout(15_000);
  async function checkLayout(label) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 390, height: 640 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await insideViewport(page, '#home-account [data-account-play]'); await minTarget(page, '#home-account [data-account-play]');
      await noSidewaysScroll(page); await noOverlap(page, '#home-account, #home-review, #moves-line');
      await shot(page, `discovery-${label}-${viewport.width}-${viewport.height}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
  }
  try {
    // Hold the local app bundle to inspect the first paint before it can open the title.
    let releaseMain, mainRequested;
    const held = new Promise(resolve => { releaseMain = resolve; });
    const requested = new Promise(resolve => { mainRequested = resolve; });
    await page.route(/\/assets\/main-[^/]+\.js$/, async route => { mainRequested(); await held; await route.continue(); }, { times: 1 });
    await page.goto(origin, { waitUntil: 'commit' }); await requested;
    await page.waitForFunction(() => document.querySelector('#game-table'));
    assert.equal(await page.locator('#game-table').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor), 'rgb(242, 233, 214)');
    assert.equal(await page.locator('#title-screen').evaluate(el => el.open), false);
    releaseMain(); await ready(page);
    assert.equal(await page.locator('#home-account .account-play-status').evaluate(el => getComputedStyle(el).display), 'block', 'Empty live region remains rendered');
    const titleLink = page.locator('#title-screen [data-account-play]');
    await titleLink.waitFor();
    for (const link of await page.locator('[data-account-play]').all()) assert.equal(await link.getAttribute('href'), '/play/');
    assert.equal(await titleLink.getAttribute('aria-label'), null);
    assert.equal(await titleLink.innerText(), 'Log in');
    assert.equal(await page.locator('#title-screen .title-copy > p').count(), 0);
    for (const viewport of [{ width: 393, height: 852 }, { width: 1366, height: 768 }]) {
      await page.setViewportSize(viewport);
      await insideViewport(page, '#title-start, #title-screen [data-account-play]');
      await noSidewaysScroll(page);
      await shot(page, `copy-title-${viewport.width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(settingsReads, 0, 'Local board startup does not read provider settings');
    await insideViewport(page, '#title-screen [data-account-play]'); await minTarget(page, '#title-screen [data-account-play]');
    await shot(page, 'discovery-first-390');
    const firstSave = await readSave(page);
    await titleLink.focus(); await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Continue with Google', exact: true }).count(), 0, 'Disabled Google is not offered');
    assert.equal(await page.getByRole('button', { name: 'Sign in to test account', exact: true }).count(), 0, 'Non-staging builds do not offer password sign-in');
    assert.equal(new URL(page.url()).pathname, '/play/');
    assert.equal(await readSave(page), firstSave, 'Opening account play leaves the local save intact');
    assert.equal(await page.evaluate(() => localStorage.getItem('kingdown.first-deal')), null, 'Account entry does not start the local first deal');
    await shot(page, 'discovery-sign-in-390');
    await page.getByRole('link', { name: 'Play on this device', exact: true }).click(); await ready(page);
    assert.equal(await readSave(page), firstSave, 'Cancel sign-in preserves the local save');
    settings = { external: null };
    await titleLink.click(); await page.getByRole('button', { name: 'Try again', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).count(), 0, 'Failed settings never guess a provider');
    await shot(page, 'signin-options-retry');
    settings = { external: { github: true, google: false } };
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Play on this device', exact: true }).click(); await ready(page);

    // Seed once. Do not overwrite the save during reload or offline continuation.
    await page.evaluate(save => { localStorage.setItem('kingdown.save', JSON.stringify(save)); sessionStorage.removeItem('kingdown.title-seen'); }, SAVE);
    await page.reload(); await ready(page); await page.locator('#home-head:visible').waitFor();
    const saved = await readSave(page);
    await checkLayout('home');
    await page.locator('#home-account [data-account-play]').click();
    await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Play on this device', exact: true }).click(); await ready(page);
    assert.equal(await readSave(page), saved, 'The Home round trip preserves the local game');
    await page.locator('#menu-btn').click();
    assert.equal(await page.locator('#menu-sheet').getByRole('link', { name: 'Log in', exact: true }).count(), 1);
    for (const viewport of [{ width: 393, height: 852 }, { width: 1366, height: 768 }]) {
      await page.setViewportSize(viewport);
      for (const selector of ['[data-go="new"]', '#rules-btn', '#resign']) {
        assert.equal(await page.locator(`#menu-sheet ${selector} span`).count(), 0);
      }
      await insideViewport(page, '#menu-sheet'); await noSidewaysScroll(page);
      await shot(page, `copy-menu-${viewport.width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await insideViewport(page, '#menu-sheet [data-account-play]'); await minTarget(page, '#menu-sheet [data-account-play]');
    await shot(page, 'discovery-menu-390');
    await page.locator('#menu-sheet [data-account-play]').click();
    await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Play on this device', exact: true }).click(); await ready(page);
    assert.equal(await readSave(page), saved, 'The Menu round trip preserves the local game');
    await page.locator('#menu-btn').click();
    await page.locator('#menu-sheet [data-account-play]').press('Enter');
    await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Play on this device', exact: true }).click(); await ready(page);
    await page.locator('#home-new').click();
    assert.equal(await page.getByRole('link', { name: 'A friend', exact: true }).count(), 1);
    assert.equal(await page.locator('#new-game-warn').isVisible(), true);
    for (const viewport of [{ width: 393, height: 852 }, { width: 1366, height: 768 }]) {
      await page.setViewportSize(viewport);
      await insideViewport(page, '#new-game-friend, #new-game-warn, #start-game'); await noSidewaysScroll(page);
      await shot(page, `copy-new-game-${viewport.width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.keyboard.press('Escape');
    await page.locator('#home-main').click();
    await page.locator('#menu-btn').click();
    // Hold the animation state to prove a Menu click is not consumed as a board skip.
    await page.evaluate(() => Object.defineProperty(window.view.scene, 'animating', { configurable: true, get: () => true }));
    await page.locator('#menu-sheet [data-go="new"]').click();
    await page.locator('#new-game-btn').click();
    await page.locator('#new-game').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.locator('#menu-btn').focus(); await page.keyboard.press('Enter');
    await page.locator('#menu-sheet [data-account-play]').click();
    await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
    assert.equal(new URL(page.url()).pathname, '/play/');
    await page.getByRole('link', { name: 'Play on this device', exact: true }).click(); await ready(page);
    await page.evaluate(() => sessionStorage.removeItem('kingdown.title-seen'));
    await page.reload(); await ready(page); await page.locator('#home-head:visible').waitFor();

    // WebKit's offline service-worker harness is not stable here; Chromium covers this path.
    if (!webkit) {
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await local.setOffline(true);
      await page.locator('#home-account [data-account-play]').click();
      assert.equal(new URL(page.url()).pathname, '/');
      assert.equal(await page.locator('#home-account .account-play-status').innerText(), 'You are offline. Keep playing on this device.');
      await page.locator('#home-main').click();
      for (const square of [6, 21]) { const point = await page.evaluate(s => window.view.screenOf(s), square); await page.mouse.click(point.x, point.y); }
      await endTurn(page);
      assert.deepEqual(await lanMoves(page), [...SAVE.moves, 'Ng1-f3']);
      await page.reload(); await ready(page);
      assert.deepEqual(await lanMoves(page), [...SAVE.moves, 'Ng1-f3'], 'Cached local play reloads with its saved offline move');
      await page.locator('#menu-btn').click(); await page.locator('#menu-sheet [data-account-play]').click();
      assert.equal(await page.locator('#menu-sheet .account-play-status').innerText(), 'You are offline. Keep playing on this device.');
      await shot(page, 'discovery-offline-menu');
      await local.setOffline(false);
      await page.waitForFunction(() => document.querySelector('#menu-sheet .account-play-status').textContent === '');
    }
    assert.deepEqual(requests, [], 'Navigation and offline play make no external request or server command');
    await page.evaluate(save => { localStorage.setItem('kingdown.save', JSON.stringify(save)); sessionStorage.removeItem('kingdown.title-seen'); }, { ...SAVE, moves: ['f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4'] });
    await page.reload(); await ready(page); await page.locator('#home-review:visible').waitFor();
    await checkLayout('finished');
    settings = { external: null };
    await openAccount(page); await page.locator('[data-act="retry-signin"]').waitFor();
    assert.equal(await page.locator('#account-body [data-provider]').count(), 0, 'Local Account does not offer a failed provider');
    settings = { external: { github: true, google: false } };
    await page.locator('[data-act="retry-signin"]').click();
    await page.locator('#account-body [data-provider="github"]').waitFor();
    assert.equal(await page.locator('#account-body [data-provider="google"]').count(), 0);
    await shot(page, 'signin-local-account');

    // The existing authenticated fixture stays separate from local cloud-save sync.
    const account = await context.newPage(); errors.push(trapErrors(account));
    await account.goto(origin + '/play/');
    await account.locator(`#games-list [data-game-id="${created.game_id}"]`).click();
    await account.locator('[data-screen="board"]:not([hidden])').waitFor();
    assert.equal(new URL(account.url()).pathname, `/g/${created.game_id}`);
    await shot(account, 'discovery-existing-account-game');
    const resumed = (await tool(0, 'kingdown_get', { game_id: created.game_id }))._meta.view;
    assert.equal(resumed.revision, created.revision, 'Resume does not change the account game');
    assert.deepEqual(await counts(), before, 'Entry and resume create no extra game or command');
    for (const list of errors) assertNoErrors(list);
    if (process.env.KINGDOWN_HOSTED_SIGNIN_ORIGIN) {
      const hostedOrigin = process.env.KINGDOWN_HOSTED_SIGNIN_ORIGIN;
      assert.equal(hostedOrigin, 'https://kingdown-staging.vercel.app', 'Hosted sign-in checks are staging only');
      const hosted = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      const unexpected = [];
      await hosted.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (request.method() === 'GET' && (url.origin === hostedOrigin || url.href === 'https://puhspsyjyzaghmgtkzqd.supabase.co/auth/v1/settings')) return route.continue();
        unexpected.push(request.method() + ' ' + url.origin + url.pathname); return route.abort();
      });
      try {
        const fresh = await hosted.newPage(), failures = trapErrors(fresh);
        await fresh.goto(hostedOrigin); await ready(fresh);
        await fresh.locator('#title-screen [data-account-play]').click();
        await fresh.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
        assert.equal(await fresh.getByRole('button', { name: 'Continue with Google', exact: true }).count(), 0);
        await shot(fresh, 'hosted-signin-available-providers');
        await fresh.getByRole('link', { name: 'Play on this device', exact: true }).click(); await ready(fresh);
        await fresh.evaluate(save => { localStorage.setItem('kingdown.save', JSON.stringify(save)); sessionStorage.removeItem('kingdown.title-seen'); }, SAVE);
        await fresh.reload(); await ready(fresh);
        const saved = await readSave(fresh);
        await openAccount(fresh); await fresh.locator('#account-body [data-provider="github"]').waitFor();
        assert.equal(await fresh.locator('#account-body [data-provider="google"]').count(), 0);
        assert.equal(await readSave(fresh), saved, 'Opening hosted Account preserves this context\'s local game');
        await shot(fresh, 'hosted-signin-local-account');
        assert.deepEqual(unexpected, [], 'Hosted inspection makes only allowed GET requests; no sign-in or game command');
        assertNoErrors(failures);
        console.log('PASS hosted sign-in: fresh staging home to account play, GitHub only, local return and local Account; no authorization or writes');
      } finally { await hosted.close(); }
    }
    console.log(`PASS account-discovery: first paint, title, Home, Menu click and keyboard, four sizes, sign-in cancellation, saved local game${webkit ? '' : ', offline move/reload'}, existing account-game resume; no new game or command`);
  } finally { await local.close(); }
}
