/** Regression cases for the second merged repair. Uses a dev page and local account replies. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, launch, trapErrors, assertNoErrors } from './lib/checks.mjs';
import { visibleBounds } from './lib/visible-bounds.mjs';
const browser = await launch(), origin = env('PLAYABLE_URL'), out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const save = JSON.parse(readFileSync(new URL('../docs/specs/owner-playtest/board-fixture.json', import.meta.url)));
const sizes = (process.env.R2_SIZES || '360x640,390x844,844x390,1440x900').split(',').map(s => s.split('x').map(Number));
const results = [], failures = [];
const cell = (page, n) => page.locator(`.play-square[data-square="${n}"]`);
const ready = page => page.waitForFunction(() => document.querySelectorAll('.play-square').length === 64 && document.querySelector('.play-board-host')?.style.visibility !== 'hidden' && !document.querySelector('.play-home, .shell-departing'));
const home = async page => { await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('button', { name: 'Back to home', exact: true }).click(); await page.locator('.play-game').waitFor({ state: 'detached' }); await page.waitForTimeout(650); };
const resume = async page => { await page.locator('.home-game-row[data-kind="computer"]').click(); await ready(page); };
const shot = async (page, size, name) => { await page.waitForTimeout(240); await page.screenshot({ path: join(out, `${size.join('x')}-${name}.png`), animations: 'disabled' }); };
async function startManual(page, type = 'cards', side = 'light') {
  await page.goto(new URL('next.html', origin).href);
  await page.evaluate(({ type, side }) => {
    localStorage.removeItem('kingdown.save'); localStorage.setItem('kingdown.game-type', type); localStorage.setItem('kingdown.side', side);
    localStorage.setItem('kingdown.game-options', JSON.stringify({ arrangement: 'manual', pool: ['B', 'N', 'R', 'G'] }));
  }, { type, side });
  await page.reload(); await page.locator('.play-home .kd-button[data-kind="main"]').click();
  await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await page.locator('.play-game[data-state="arrange"]').waitFor(); await ready(page);
}
async function breakRules(page, side = 0) {
  const row = await page.locator('.play-square').evaluateAll((cells, side) => cells.sort((a, b) => Number(a.dataset.square) - Number(b.dataset.square)).slice(side * 56, side * 56 + 8).map(c => c.getAttribute('aria-label').split(' ').slice(2).join(' ')), side);
  // Find one swap that breaks both rules, with a deterministic trial of the eight-piece order.
  let pair;
  for (let a = 0; a < 8 && !pair; a++) for (let b = a + 1; b < 8 && !pair; b++) {
    const order = [...row]; [order[a], order[b]] = [order[b], order[a]];
    const bishops = order.flatMap((p, i) => p === 'Bishop' ? [i] : []);
    if (bishops.length === 2 && (bishops[0] + bishops[1]) % 2 === 0 && Math.abs(order.indexOf('Guard') - order.indexOf('King')) !== 1) pair = [a, b];
  }
  assert(pair, 'the deal admits a swap that breaks both rules');
  for (const i of pair) await cell(page, side * 56 + i).tap();
  assert.match(await page.locator('.play-arrange-rule').innerText(), /Bishops.*guard/s);
}
async function clearBoard(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false, 'no page scroll');
  const layout = await page.locator('.play-game').getAttribute('data-layout');
  if (layout === 'portrait') {
    const reader = await page.locator('.play-detail').boundingBox(), board = await page.locator('.play-board').boundingBox();
    assert(reader.y + reader.height <= board.y + 1, 'the reader stays above the board');
  }
}
const cases = {
  async cards(page, context, size) {
    await context.addInitScript(save => localStorage.setItem('kingdown.save', JSON.stringify(save)), { ...save, rules: { ...save.rules, kings: [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'Darkness' }] } });
    await page.goto(new URL('next.html', origin).href); await resume(page);
    await page.locator('.play-rival-cards').tap();
    await visibleBounds(page, '.play-rival-rows button', true); await shot(page, size, 'opponent-cards');
    const count = await page.locator('.play-rival-rows button').count(); assert.equal(count, 4);
    for (let i = 0; i < count; i++) {
      const name = await page.locator('.play-rival-rows button').nth(i).innerText();
      await page.locator('.play-rival-rows button').nth(i).tap();
      await page.locator('.learn-panel').waitFor(); assert.match(await page.locator('.learn-top').innerText(), new RegExp(name.split('\n')[0]));
      await page.keyboard.press('Escape'); await page.locator('.play-rival-cards').tap();
    }
    await page.keyboard.press('Escape'); await page.locator('.play-opp .play-power').tap();
    await visibleBounds(page, '.play-reader .learn-owner, .play-reader .learn-short'); await shot(page, size, 'opponent-power');
  },
  async manual(page, context, size) {
    for (const type of ['powers', 'cards', 'both']) for (const side of [0, 1]) {
      await startManual(page, type, side ? 'dark' : 'light'); await breakRules(page, side);
      await visibleBounds(page, '.play-headline-line, .play-arrange-rule');
      await visibleBounds(page, '.play-turn button', true); await clearBoard(page);
      if (size[0] === 360) assert.equal(await page.locator('.play-history-strip').isVisible(), false, 'Manual gives its reserve to the warning');
      await shot(page, size, `manual-${type}-${side}-warning`);
      await home(page);
    }
  },
  async saves(page, context, size) {
    if (size[0] !== 360) return;
    for (const type of ['pieces', 'powers', 'cards', 'both']) {
      await startManual(page, type);
      const stale = await context.newPage(); await stale.goto(new URL('next.html', origin).href); await resume(stale);
      await stale.locator('.play-game[data-state="arrange"]').waitFor();
      const row = await page.locator('.play-square').evaluateAll(cells => cells.filter(n => Number(n.dataset.square) < 8).sort((a,b) => Number(a.dataset.square) - Number(b.dataset.square)).map(n => n.getAttribute('aria-label')));
      for (let i = 0; i < 4; i++) { await cell(page, i).tap(); await cell(page, 7 - i).tap(); }
      await page.getByRole('button', { name: 'Ready', exact: true }).tap();
      const saved = await page.evaluate(() => localStorage.getItem('kingdown.save'));
      await stale.getByRole('button', { name: 'Ready', exact: true }).tap();
      assert.equal(await stale.evaluate(() => localStorage.getItem('kingdown.save')), saved, 'stale Ready cannot write over the newer game');
      await home(stale); await resume(stale); await stale.locator('.play-game[data-state="ready"]').waitFor();
      await page.reload(); await resume(page); await page.locator('.play-game[data-state="ready"]').waitFor();
      const current = await page.locator('.play-square').evaluateAll(cells => cells.filter(n => Number(n.dataset.square) < 8).sort((a,b) => Number(a.dataset.square) - Number(b.dataset.square)).map(n => n.getAttribute('aria-label').split(' ').slice(2).join(' ')));
      assert.deepEqual(current, row.reverse().map(s => s.split(' ').slice(2).join(' ')), 'both tabs resume the accepted order');
      await stale.close(); await home(page);
    }
    await startManual(page);
    await page.evaluate(() => { const write = Storage.prototype.setItem; window.saveFails = true; Storage.prototype.setItem = function(key, value) { if (key === 'kingdown.save' && window.saveFails) throw new DOMException('full', 'QuotaExceededError'); return write.call(this, key, value); }; });
    await page.getByRole('button', { name: 'Ready', exact: true }).tap(); await page.locator('.play-game[data-state="ready"]').waitFor();
    await home(page);
    await page.locator('.home-top-new:visible, .home-side-new:visible').first().click();
    await page.locator('.new-game-panel[open]').waitFor();
    assert.equal(await page.locator('.new-game-panel .panel-warning').isVisible(), true, 'the memory game keeps the replacement warning');
    await page.locator('.new-game-panel').getByRole('button', { name: 'Close', exact: true }).click();
    await resume(page); await page.locator('.play-game[data-state="ready"]').waitFor();
    await page.evaluate(() => { window.saveFails = false; });
    await cell(page, 8).tap(); await cell(page, 16).tap();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).back), '', 'the next write saves the confirmed FEN game');
  },
  async online(page, context, size) {
    await page.goto(new URL('next.html', origin).href);
    const template = await page.evaluate(async () => {
      const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts'), { rulesOf } = await import('/src/interface/play/saved.ts');
      const hand = ['Freeze', 'IceWall', 'Haste', 'Flight'], game = new Game('RNBQKBNR', rulesOf('both', [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'Darkness' }], [hand, hand]));
      return { fen: toFen(game.pos), rules: game.rules, history: { initial_fen: toFen(game.pos), actions: [] }, legal: game.legal.map(m => game.context.toLan(game.pos, m)) };
    });
    const now = new Date().toISOString();
    let authFail = false;
    let view = { ...template, game_id: 'r2-online', revision: 1, server_now: now, created_at: now, status: 'playing', seat: 0, turn: 0, action: 'ready', kind: 'friend', speed: 'daily', days_per_move: 3, deadline_at: new Date(Date.now() + 864e5).toISOString(), abort_open: false, rating_policy: 'casual', last_commands: [], opponent: { handle: 'opponent', user_id: 'other', computer: false, deleted: false, icon: null }, draw_offer: 1, kings: template.rules.kings, hands: template.rules.hands };
    await context.addInitScript(() => {
      const now = Math.floor(Date.now() / 1000);
      localStorage.setItem('kingdown.auth', JSON.stringify({ access_token: 'local-check', refresh_token: 'local-check', token_type: 'bearer', expires_at: now + 86400, expires_in: 86400, user: { id: 'r2-tester', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' } }));
    });
    await context.route('**/api/**', route => {
      const req = route.request(), path = new URL(req.url()).pathname;
      const json = value => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
      if (path === '/api/me/settings') return json({ me: { handle: 'tester', icon: null }, settings: {} });
      if (path === '/api/me/games') return json({ games: [{ game_id: view.game_id }], invitations: [] });
      if (path === '/api/me/record') return json({ history: [], record: {}, blocks: [] });
      if (authFail && path.startsWith('/api/games/')) return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'UNAUTHENTICATED', message: 'The fixture session ends.' }) });
      if (path.endsWith('/commands')) { view = { ...view, revision: view.revision + 1, draw_offer: null }; const body = req.postDataJSON(); return json({ type: 'ack', command_id: body.command_id, revision: view.revision, view }); }
      return json(view);
    });
    await page.reload(); await page.locator('.home-game-row[data-game]').first().click(); await ready(page);
    await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true);
    await clearBoard(page); await shot(page, size, 'opponent-draw-offer');
    await page.getByRole('button', { name: 'Keep playing', exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector('.online-actions button'));
    assert.equal(await page.locator('.play-history-strip').isVisible(), true, 'history returns after the draw reply');
    await page.evaluate(() => localStorage.setItem('kingdown.account-command.r2-tester', 'bad receipt')); await page.reload();
    await page.locator('.home-game-row[data-game]').first().click(); await ready(page);
    await page.getByRole('button', { name: 'Check again', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true); await clearBoard(page);
    await shot(page, size, 'check-again');
    await page.getByRole('button', { name: 'Discard send', exact: true }).tap();
    await page.waitForFunction(() => !document.querySelector('.online-actions button'));
    assert.equal(await page.locator('.play-history-strip').isVisible(), true, 'history returns after send recovery');
    view = { ...view, revision: view.revision + 1, server_now: new Date().toISOString(), turn: 1, fen: view.fen.replace(' w ', ' b '), history: { ...view.history, initial_fen: view.history.initial_fen.replace(' w ', ' b ') }, deadline_at: new Date(Date.now() - 1000).toISOString() };
    await page.reload(); await page.locator('.home-game-row[data-game]').first().click(); await ready(page);
    await page.getByRole('button', { name: 'Claim win', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true); await clearBoard(page);
    await shot(page, size, 'claim-win');
    authFail = true; await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.getByRole('button', { name: 'Sign in again', exact: true }).waitFor();
    await visibleBounds(page, '.online-status p'); await visibleBounds(page, '.online-actions button', true); await clearBoard(page);
    await shot(page, size, 'sign-in-again');
    authFail = false;

  },
};
try {
  for (const size of sizes) for (const [name, run] of Object.entries(cases)) {
    if (process.env.R2_CASES && !process.env.R2_CASES.split(',').includes(name)) continue;
    const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(10000); const errors = trapErrors(page, name === 'online' ? [{ pattern: /Failed to load resource: the server responded with a status of 401/, reason: 'The fixture ends the session to show Sign in again.' }] : []);
    try { await run(page, context, size); assertNoErrors(errors); results.push({ name, size, ok: true }); console.log('ok', name, size.join('x')); }
    catch (error) { await shot(page, size, `failure-${name}`); failures.push(`${name} ${size.join('x')}: ${error.message}`); console.error(failures.at(-1)); }
    finally { await context.close(); }
  }
  writeFileSync(join(out, 'r2-results.json'), JSON.stringify({ results, failures }, null, 2));
  assert.equal(failures.length, 0, failures.join('\n'));
} finally { await browser.close(); }
