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
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce', hasTouch: true, serviceWorkers: 'block' });
  await context.addInitScript(king => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    if (!localStorage.getItem('kingdown.game-options')) localStorage.setItem('kingdown.game-options', JSON.stringify({ arrangement: 'manual', pool: ['B', 'N', 'R', 'G'], king }));
    if (!localStorage.getItem('kingdown.game-type')) localStorage.setItem('kingdown.game-type', 'pieces');
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
  await page.locator('dialog.new-game-panel').getByRole('button', { name: 'Send link', exact: true }).click();
  await page.getByRole('button', { name: 'Continue with GitHub', exact: true }).click();
  await Promise.race([page.locator(`[data-account="${handle}"]`).waitFor(), page.waitForFunction(() => !!localStorage.getItem('kingdown.auth'))]);
  if (await page.locator(`[data-account="${handle}"]`).count()) await page.locator(`[data-account="${handle}"]`).click();
  await page.waitForFunction(() => !!localStorage.getItem('kingdown.auth'));
  await page.waitForURL(/next\.html/); await page.locator('dialog.new-game-panel[open]').waitFor();
  await attachApi(page);
  await page.locator('dialog.new-game-panel[open]').getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('dialog.new-game-panel').waitFor({ state: 'detached' });
}
async function attachApi(page) {
  await page.evaluate(async () => {
    const [{ connect }, { AUTH_KEY }, { onlineClient }] = await Promise.all([import('/src/account/client.ts'), import('/src/account/session.ts'), import('/src/online/client.ts')]);
    const auth = connect(AUTH_KEY, { manualCallback: true });
    window.s2api = onlineClient({ token: async () => (await auth.readSession())?.accessToken ?? null });
    await window.s2api.settings();
  });
}
async function setupPanels(page, width, height, wait = false) {
  const before = await row(page, wait ? 1 : 0);
  if (await page.locator('.play-rival-count').count()) {
    assert.equal(await page.locator('.play-rival-count').textContent(), '4', 'the Manual online hand starts at four');
    assert.match(await page.locator('.play-rival-cards').getAttribute('aria-label'), /4 cards left/);
  }
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  const panel = page.locator('.play-reader[data-floating="true"]'); await panel.waitFor();
  assert.equal(await panel.evaluate(n => getComputedStyle(n).borderRadius), '14px');
  await shot(page, `${width}x${height}-${wait ? 'wait' : 'manual'}-menu`);
  const outside = await page.locator('.play-square').evaluateAll(cells => {
    const panel = document.querySelector('.play-reader[data-floating="true"]').getBoundingClientRect();
    const cell = cells.find(n => { const r = n.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2; return x < panel.left || x > panel.right || y < panel.top || y > panel.bottom; });
    return (cell ?? document.querySelector('.play-turn')).getBoundingClientRect().toJSON();
  });
  await page.touchscreen.tap(outside.x + outside.width / 2, outside.y + outside.height / 2);
  assert.equal(await page.locator('.game-menu').count(), 0); assert.deepEqual(await row(page, wait ? 1 : 0), before);
  if (!wait) assert.equal(await cell(page, 0).getAttribute('aria-selected'), 'false', 'the outside input only closes Menu');
  if (await page.locator('.play-game').getAttribute('data-shared-reader') === 'true' && !wait) {
    assert.equal(await page.locator('.play-history-strip').isVisible(), false, 'Manual instructions use the shared area'); return;
  }
  await page.locator('.play-history-toggle').tap(); await page.locator('.play-scroll-panel').waitFor({ state: 'visible' });
  assert.match(await page.locator('.play-panel-body').innerText(), /No action yet/);
  await page.keyboard.press('Escape');
}
async function inviteFromPanel(page, king, cards, named = false) {
  await page.locator('.home-hero-new, .home-top-new:visible, .home-side-new:visible').first().click();
  const panel = page.locator('dialog.new-game-panel[open]');
  await panel.getByRole('radio', { name: 'Person', exact: true }).click();
  await panel.getByRole('checkbox', { name: 'With powers', exact: true }).setChecked(true);
  await panel.getByRole('checkbox', { name: 'With cards', exact: true }).setChecked(false);
  await panel.locator('[data-section="powers"]').click(); await panel.locator(`[data-king="${king.king}"]`).click();
  await panel.getByRole('radio', { name: king.power, exact: true }).click();
  await panel.getByRole('checkbox', { name: 'With cards', exact: true }).setChecked(cards);
  if (cards && king.power === 'Leap') assert.match(await panel.locator('[data-section="powers"]').innerText(), /Mud · March/);
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/games' && r.request().method() === 'POST');
  if (named) {
    await panel.getByRole('button', { name: 'Invite by name', exact: true }).click();
    await panel.getByRole('textbox', { name: 'Game name', exact: true }).fill('test-b');
    await panel.getByRole('button', { name: 'Invite test-b', exact: true }).click();
  } else await panel.getByRole('button', { name: 'Send link', exact: true }).click();
  const made = await (await response).json();
  await panel.waitFor({ state: 'detached' }); return made;
}
try {
  for (const [width, height] of sizes) {
    const { page, context: ctx } = await context({ width, height }, null, width === 390);
    await page.goto(url); await page.locator('.play-home .kd-button[data-kind="main"]').click();
    await page.getByRole('button', { name: 'Start game', exact: true }).click();
    await page.waitForSelector('.play-game[data-state="arrange"]');
    await page.waitForFunction(() => document.querySelector('.play-board-host')?.style.visibility !== 'hidden');
    await page.locator('.play-home').waitFor({ state: 'detached' });
    const dealt = await row(page), computer = await row(page, 1);
    await fits(page); await shot(page, `solo-legal-${width}x${height}`);
    await setupPanels(page, width, height);
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
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Back to home', exact: true }).click();
    await page.locator('.home-hero-new, .home-top-new:visible, .home-side-new:visible').first().click();
    assert.equal(await page.locator('.new-game-panel .panel-warning').isVisible(), true, 'a new game warns about the confirmed arrangement');
    await page.locator('.new-game-panel').getByRole('button', { name: 'Close', exact: true }).click();
    await page.locator('.home-game-row[data-kind="computer"]').click();
    await page.waitForSelector('.play-game[data-state="ready"]'); assert.deepEqual(await row(page), arranged);
    await page.reload(); await page.locator('.home-game-row[data-kind="computer"]').click();
    await page.waitForSelector('.play-game[data-state="ready"]'); assert.deepEqual(await row(page), arranged);
    await firstMove(page); await ctx.close();
  }
  {
    const { page, context: ctx } = await context({ width: 390, height: 844 });
    await ctx.addInitScript(() => localStorage.setItem('kingdown.side', 'dark'));
    await page.goto(url); await page.locator('.play-home .kd-button[data-kind="main"]').click();
    await page.getByRole('button', { name: 'Start game', exact: true }).click();
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
  const a = await context({ width: 390, height: 844 }, { king: 'Mud', power: 'Leap' });
  const b = await context({ width: 1440, height: 900 }, { king: 'Shadow', power: 'Darkness' });
  await signIn(a.page, 'test-a'); await signIn(b.page, 'test-b');
  const created = await inviteFromPanel(a.page, { king: 'Mud', power: 'Leap' }, true);
  const second = await inviteFromPanel(a.page, { king: 'Shadow', power: 'Darkness' }, true, true);
  const id = created.view.game_id, sideA = created.view.seat, sideB = sideA ^ 1;
  await b.page.goto(url + '#join=' + created.invite.token);
  await b.page.getByRole('button', { name: 'Join the game', exact: true }).click();
  await b.page.waitForSelector('.play-game[data-state="arrange"]');
  // Change the next-game preference after joining, then reload the bound game.
  await b.page.evaluate(() => localStorage.setItem('kingdown.game-options', JSON.stringify({ king: { king: 'Spirit', power: 'Mercy' } })));
  await b.page.reload();
  await a.page.goto(url + '#online=' + id);
  for (const page of [a.page, b.page]) await page.waitForSelector('.play-game[data-state="arrange"]');
  const whitePage = sideA === 0 ? a.page : b.page, blackPage = sideA === 1 ? a.page : b.page;
  const white = await row(whitePage), black = await row(blackPage, 1);
  await reverse(whitePage); await reverse(blackPage, 1);
  // Black can confirm first. White keeps its own draft across the other seat's poll update.
  await finish(blackPage).click(); await blackPage.waitForSelector('.play-game[data-state="arrange-wait"]');
  for (const [width, height] of sizes) {
    await blackPage.setViewportSize({ width, height });
    await blackPage.waitForFunction(() => [...document.querySelectorAll('.play-board, .play-turn, .play-turn-state')].every(node => { const r = node.getBoundingClientRect(); return r.x >= -1 && r.y >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }));
    await insideViewport(blackPage, '.play-board, .play-turn, .play-turn-state');
    assert.equal(await blackPage.locator('.play-turn-state').textContent(), 'Ready. Wait for the other player.');
    await setupPanels(blackPage, width, height, true);
    await shot(blackPage, `online-wait-${width}x${height}`);
  }
  await finish(whitePage).click(); await whitePage.waitForSelector('.play-game[data-state="ready"]');
  assert.deepEqual(await row(whitePage), [...white].reverse()); assert.deepEqual(await row(whitePage, 1), [...black].reverse());
  await attachApi(a.page);
  const view = await a.page.evaluate(async id => window.s2api.game(id), id);
  assert.equal(view.status, 'playing');
  assert.deepEqual(view.rules.kings[sideA], { king: 'Mud', power: 'March' });
  assert.deepEqual(view.rules.kings[sideB], { king: 'Shadow', power: 'Darkness' });
  await firstMove(whitePage, true);
  await blackPage.waitForSelector('.play-game[data-state="ready"]');
  // The second invite keeps its different creator choice when it starts later.
  await b.page.goto(url + '#play'); await attachApi(b.page);
  const inbox = await b.page.evaluate(async () => window.s2api.invitations({ limit: 50 }));
  const pending = inbox.invitations.find(row => row.game_id === second.view.game_id); assert(pending);
  await b.page.locator(`[data-invite="${pending.invite_id}"]`).getByRole('button', { name: 'Accept', exact: true }).click();
  await b.page.waitForSelector('.play-game[data-state="arrange"]'); await finish(b.page).click();
  await a.page.goto(url + '#online=' + second.view.game_id); await a.page.waitForSelector('.play-game[data-state="arrange"]');
  await finish(a.page).click(); await a.page.waitForFunction(() => ['ready', 'thinking'].includes(document.querySelector('.play-game')?.dataset.state));
  await attachApi(a.page); const later = await a.page.evaluate(async id => window.s2api.game(id), second.view.game_id);
  assert.deepEqual(later.rules.kings[second.view.seat], { king: 'Shadow', power: 'Darkness' });
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
