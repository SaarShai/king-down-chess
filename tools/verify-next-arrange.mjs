/** The shared Manual board step. Run against `npm run online:local` at PLAYABLE_URL. */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { assertNoErrors, env, insideViewport, launch, trapErrors } from './lib/checks.mjs';
const browser = await launch();
const origin = env('PLAYABLE_URL'), url = new URL('next.html', origin).href;
const out = process.env.ARRANGE_SHOTS || env('PLAYABLE_OUT'); await mkdir(out, { recursive: true });
const sizes = [[390, 844], [360, 640], [844, 390], [1440, 900]];
const conflicts = [];
const cell = (page, sq) => page.locator(`.play-square[data-square="${sq}"]`);
const finish = page => page.locator('.play-turn').getByRole('button', { name: 'Ready', exact: true });
const row = (page, side = 0) => page.locator(`.play-square`).evaluateAll((cells, side) => cells.sort((a, b) => Number(a.dataset.square) - Number(b.dataset.square)).slice(side * 56, side * 56 + 8).map(c => c.getAttribute('aria-label').split(' ').slice(2).join(' ')), side);
const tap = async (page, sq, touch = false) => touch ? cell(page, sq).tap() : cell(page, sq).click();
async function shot(page, name) { await page.screenshot({ path: join(out, name + '.png') }); }
async function fits(page) {
  await insideViewport(page, '.play-board, .play-turn, .play-arrange-rule');
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1), true, 'no page scroll');
}
async function faultSwap(page, side = 0, touch = false) {
  const names = await row(page, side), bishops = names.flatMap((n, i) => n === 'Bishop' ? [i] : []);
  assert.equal(bishops.length, 2);
  const from = bishops[0], to = names.findIndex((name, i) => name !== 'Bishop' && i % 2 !== from % 2);
  await tap(page, side * 56 + from, touch); await tap(page, side * 56 + to, touch);
  assert.equal(await finish(page).getAttribute('aria-disabled'), 'true');
  assert.ok((await page.locator('.play-arrange-rule').innerText()).includes('Bishops must stand on opposite colours.'));
  assert.ok(await page.locator('[data-arrange-fault]').count() >= 2);
  return [from, to];
}
async function keyboardSwap(page, from, to, side = 0) {
  await cell(page, side * 56 + from).focus(); await page.keyboard.press('Enter');
  const key = (to > from) !== !!side ? 'ArrowRight' : 'ArrowLeft';
  for (let i = 0; i < Math.abs(to - from); i++) await page.keyboard.press(key);
  await page.keyboard.press('ArrowUp');
  assert.equal(await page.locator(':focus').getAttribute('data-square'), String(side * 56 + to), 'arrows stay on the own back rank');
  await page.keyboard.press('Space');
}
async function reverse(page, side = 0) {
  for (let i = 0; i < 4; i++) { await tap(page, side * 56 + i); await tap(page, side * 56 + 7 - i); }
  assert.equal(await finish(page).getAttribute('aria-disabled'), 'false');
}
async function firstMove(page, online = false) {
  await page.waitForSelector('.play-game[data-state="ready"]');
  await cell(page, 8).click(); await cell(page, 16).click();
  await page.waitForSelector('.play-game[data-state="draft"]');
  if (online) {
    await page.locator('.play-turn').getByRole('button', { name: 'Send', exact: true }).click();
    await page.waitForSelector('.play-game[data-state="thinking"]');
  } else {
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length), 1);
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.waitForSelector('.play-game[data-state="ready"]');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length), 0);
    await cell(page, 8).click(); await cell(page, 16).click();
    await page.locator('.play-turn').getByRole('button', { name: 'End turn', exact: true }).click();
    await page.waitForSelector('.play-game[data-state="ready"]', { timeout: 30000 });
    assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length) >= 2, 'the first turn and computer reply commit');
  }
}
async function context(viewport, king = null, touch = false) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch: touch, serviceWorkers: 'block' });
  await context.addInitScript(king => {
    localStorage.setItem('kingdown.game-options', JSON.stringify({ arrangement: 'manual', pool: ['B', 'N', 'R', 'G'], king }));
    localStorage.setItem('kingdown.game-type', 'pieces');
  }, king);
  const page = await context.newPage();
  trapErrors(page, [{ pattern: /Failed to load resource: the server responded with a status of 409 \(Conflict\)/, reason: 'Every 409 is checked below: only a stale Ready revision may retry.' }]);
  page.on('response', response => {
    if (response.status() !== 409) return;
    conflicts.push(response.json().then(body => {
      assert.match(new URL(response.url()).pathname, /^\/api\/games\/[^/]+\/commands$/);
      assert.equal(body.code, 'STALE_REVISION');
      assert.equal(response.request().postDataJSON().action.type, 'choose');
    }));
  });
  return { page, context };
}
async function signIn(page, handle) {
  await page.goto(url + '?as=' + handle + '#person');
  await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).click();
  // The loopback auth chooser only contains seeded test accounts.
  await Promise.race([page.locator(`[data-account="${handle}"]`).waitFor(), page.getByRole('heading', { name: 'Play a person', exact: true }).waitFor()]);
  if (await page.locator(`[data-account="${handle}"]`).count()) await page.locator(`[data-account="${handle}"]`).click();
  await page.waitForURL(/next\.html/);
  await page.getByRole('heading', { name: 'Play a person', exact: true }).waitFor();
  await attachApi(page);
  await page.locator('dialog.people-sheet[open]').getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('dialog.people-sheet[open]').waitFor({ state: 'hidden' });
}
async function attachApi(page) {
  await page.evaluate(async () => {
    const [{ connect }, { AUTH_KEY }, { onlineClient }] = await Promise.all([import('/src/account/client.ts'), import('/src/account/session.ts'), import('/src/online/client.ts')]);
    const auth = connect(AUTH_KEY, { manualCallback: true });
    window.s2api = onlineClient({ token: async () => (await auth.readSession())?.accessToken ?? null });
    await window.s2api.settings();
  });
}
try {
  for (const [width, height] of sizes) {
    const { page, context: ctx } = await context({ width, height }, null, width === 390);
    await page.goto(url); await page.locator('.play-home .kd-button[data-kind="main"]').click();
    await page.waitForSelector('.play-game[data-state="arrange"]');
    await page.waitForFunction(() => document.querySelector('.play-board-host')?.style.visibility !== 'hidden');
    await page.locator('.play-home').waitFor({ state: 'detached' });
    const dealt = await row(page), computer = await row(page, 1);
    await fits(page); await shot(page, `solo-legal-${width}x${height}`);
    const [from, to] = await faultSwap(page, 0, width === 390);
    await fits(page); await shot(page, `solo-fault-${width}x${height}`);
    await keyboardSwap(page, from, to);
    assert.deepEqual(await row(page), dealt); assert.equal(await page.locator('[data-arrange-fault]').count(), 0);
    // Menu does not end setup. The saved step starts again from the legal deal.
    if (width === 390) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.keyboard.press('Escape');
      await faultSwap(page); await page.reload();
      await page.locator('.home-game-row[data-kind="computer"]').click();
      await page.waitForSelector('.play-game[data-state="arrange"]'); assert.deepEqual(await row(page), dealt);
    }
    await reverse(page); const arranged = await row(page);
    assert.deepEqual(arranged, [...dealt].reverse()); assert.deepEqual(await row(page, 1), computer);
    await finish(page).click(); await page.waitForSelector('.play-game[data-state="ready"]');
    assert.deepEqual(await row(page), arranged); assert.deepEqual(await row(page, 1), computer);
    await firstMove(page); await ctx.close();
  }
  {
    const { page, context: ctx } = await context({ width: 390, height: 844 });
    await ctx.addInitScript(() => localStorage.setItem('kingdown.side', 'dark'));
    await page.goto(url); await page.locator('.play-home .kd-button[data-kind="main"]').click();
    await page.waitForSelector('.play-game[data-state="arrange"]');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length), 0, 'the computer waits for Dark to arrange');
    const [from, to] = await faultSwap(page, 1); await keyboardSwap(page, from, to, 1);
    await reverse(page, 1); await finish(page).click();
    await page.waitForSelector('.play-game[data-state="ready"]', { timeout: 30000 });
    assert.ok(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length) > 0, 'the computer starts after Ready');
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Resign', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Resign this game?' });
    await dialog.getByRole('button', { name: 'Resign', exact: true }).click();
    await page.waitForSelector('.play-game[data-state="result"]'); await ctx.close();
  }
  const a = await context({ width: 390, height: 844 }, { king: 'Mud', power: 'March' });
  const b = await context({ width: 1440, height: 900 }, { king: 'Shadow', power: 'Darkness' });
  await signIn(a.page, 'test-a'); await signIn(b.page, 'test-b');
  // S1 owns the invite control. Create its Manual invite through the same local REST client.
  const created = await a.page.evaluate(async () => window.s2api.create({ kind: 'friend', open_link: true, colour: 'white', options: { fairy: true, pool: ['B', 'N', 'R', 'G'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: true } }));
  const id = created.view.game_id;
  await b.page.evaluate(async token => window.s2api.redeem({ token }), created.invite.token);
  await a.page.goto(url + '#online=' + id); await b.page.goto(url + '#online=' + id);
  for (const page of [a.page, b.page]) await page.waitForSelector('.play-game[data-state="arrange"]');
  const white = await row(a.page), black = await row(b.page, 1);
  await reverse(a.page); await reverse(b.page, 1);
  // Black can confirm first. White keeps its own draft across the other seat's poll update.
  await finish(b.page).click(); await b.page.waitForSelector('.play-game[data-state="arrange-wait"]');
  for (const [width, height] of sizes) {
    await b.page.setViewportSize({ width, height });
    await b.page.waitForFunction(() => [...document.querySelectorAll('.play-board, .play-turn, .play-turn-state')].every(node => { const r = node.getBoundingClientRect(); return r.x >= -1 && r.y >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }));
    await insideViewport(b.page, '.play-board, .play-turn, .play-turn-state');
    assert.equal(await b.page.locator('.play-turn-state').textContent(), 'Ready. Wait for the other player.');
    await shot(b.page, `online-wait-${width}x${height}`);
  }
  await finish(a.page).click(); await a.page.waitForSelector('.play-game[data-state="ready"]');
  assert.deepEqual(await row(a.page), [...white].reverse()); assert.deepEqual(await row(a.page, 1), [...black].reverse());
  await attachApi(a.page);
  const view = await a.page.evaluate(async id => window.s2api.game(id), id);
  assert.equal(view.status, 'playing');
  assert.deepEqual(view.rules.kings, [{ king: 'Mud', power: 'March' }, { king: 'Shadow', power: 'Darkness' }]);
  await firstMove(a.page, true);
  await b.page.waitForSelector('.play-game[data-state="ready"]');
  await Promise.all(conflicts);
  await a.context.close(); await b.context.close();
  assertNoErrors();
  console.log('ok next-arrange: 4 solo sizes, pointer, touch, keyboard, warning rules, saved restart, Ready, different rows, first move; 2 local online seats, stored kings, Black first, wait at 4 sizes and first move');
} catch (error) {
  let i = 0;
  for (const ctx of browser.contexts()) for (const page of ctx.pages()) {
    await shot(page, `failure-${++i}`).catch(() => {});
    console.error('Page:', page.url(), (await page.locator('body').innerText()).slice(0, 900));
  }
  throw error;
} finally { await browser.close(); }
