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
  const local = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const settingsUrl = 'https://web-proof.supabase.co/auth/v1/settings';
  let settings = { external: { github: true, google: false } }, settingsReads = 0;
  await local.route(settingsUrl, route => { settingsReads++; assert.equal(route.request().headers().apikey, 'sb_publishable_local_test'); return route.fulfill({ json: settings }); });
  local.on('request', request => { if (new URL(request.url()).origin !== origin && request.url() !== settingsUrl) requests.push('external request'); if (request.method() !== 'GET') requests.push(request.method() + ' ' + new URL(request.url()).pathname); });
  const page = await local.newPage(); errors.push(trapErrors(page)); page.setDefaultTimeout(15_000);
  async function checkLayout(label) {
    for (const viewport of [{ width: 390, height: 844 }, { width: 390, height: 640 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await insideViewport(page, '#home-account [data-account-play]'); await minTarget(page, '#home-account [data-account-play]');
      await noSidewaysScroll(page); await noOverlap(page, '#home-account, #home-today, #home-review, #moves-line');
      await shot(page, `discovery-${label}-${viewport.width}-${viewport.height}`);
      await page.locator('#home-today').scrollIntoViewIfNeeded();
      await insideViewport(page, '#home-today');
    }
    await page.setViewportSize({ width: 390, height: 844 });
  }
  try {
    await page.goto(origin); await ready(page);
    const titleLink = page.locator('#title-screen [data-account-play]');
    await titleLink.waitFor();
    assert.equal(settingsReads, 0, 'Local board startup does not read provider settings');
    await insideViewport(page, '#title-screen [data-account-play]'); await minTarget(page, '#title-screen [data-account-play]');
    await shot(page, 'discovery-first-390');
    const firstSave = await readSave(page);
    await titleLink.focus(); await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Continue with Google', exact: true }).count(), 0, 'Disabled Google is not offered');
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
    await insideViewport(page, '#menu-sheet [data-account-play]'); await minTarget(page, '#menu-sheet [data-account-play]');
    await shot(page, 'discovery-menu-390');
    await page.locator('#menu-sheet [data-account-play]').press('Enter');
    await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Play on this device', exact: true }).click(); await ready(page);
    assert.equal(await readSave(page), saved, 'The Menu round trip preserves the local game');

    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await local.setOffline(true);
    await page.locator('#home-account [data-account-play]').click();
    assert.equal(new URL(page.url()).pathname, '/');
    assert.match(await page.locator('#home-account [data-account-play]').innerText(), /You are offline/);
    await page.locator('#home-main').click();
    for (const square of [6, 21]) { const point = await page.evaluate(s => window.view.screenOf(s), square); await page.mouse.click(point.x, point.y); }
    await endTurn(page);
    assert.deepEqual(await lanMoves(page), [...SAVE.moves, 'Ng1-f3']);
    await page.reload(); await ready(page);
    assert.deepEqual(await lanMoves(page), [...SAVE.moves, 'Ng1-f3'], 'Cached local play reloads with its saved offline move');
    await page.locator('#menu-btn').click(); await page.locator('#menu-sheet [data-account-play]').click();
    assert.match(await page.locator('#menu-sheet [data-account-play]').innerText(), /You are offline/);
    await shot(page, 'discovery-offline-menu');
    await local.setOffline(false);
    await page.waitForFunction(() => document.querySelector('#menu-sheet [data-account-play] small').textContent.includes('Online only'));
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
    console.log('PASS account-discovery: first title, Home, Menu, keyboard, four sizes, sign-in cancellation, saved local game, offline move/reload, existing account-game resume; no new game or command');
  } finally { await local.close(); }
}
