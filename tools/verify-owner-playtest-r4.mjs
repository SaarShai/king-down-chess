/** The fourth repair: own online actions, one save notice, kept games and stale tabs. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, launch, trapErrors, assertNoErrors } from './lib/checks.mjs';
import { visibleBounds } from './lib/visible-bounds.mjs';
const browser = await launch(), origin = env('PLAYABLE_URL'), out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const fixture = JSON.parse(readFileSync(new URL('../docs/specs/owner-playtest/board-fixture.json', import.meta.url)));
const sizes = (process.env.R4_SIZES || '360x640,390x844,844x390,1440x900').split(',').map(s => s.split('x').map(Number));
const results = [], failures = [], saveLine = 'Your king stays for this visit. It cannot save on this device.';
const cell = (page, n) => page.locator(`.play-square[data-square="${n}"]`);
const ready = page => page.waitForFunction(() => document.querySelectorAll('.play-square').length === 64 && document.querySelector('.play-board-host')?.style.visibility !== 'hidden' && !document.querySelector('.play-home, .shell-departing'));
const home = async page => { await page.getByRole('button', { name: 'Menu', exact: true }).click(); await page.getByRole('button', { name: 'Back to home', exact: true }).click(); await page.locator('.play-home').waitFor(); await page.waitForTimeout(650); };
const resume = async page => { await page.locator('.home-game-row[data-kind="computer"]').click(); await ready(page); };
const shot = async (page, size, name) => { await page.waitForTimeout(240); await page.screenshot({ path: join(out, `${size.join('x')}-${name}.png`), animations: 'disabled' }); };
async function clearBoard(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight), false, 'no page scroll');
  if (await page.locator('.play-game').getAttribute('data-layout') === 'portrait') {
    const detail = await page.locator('.play-detail').boundingBox(), board = await page.locator('.play-board').boundingBox();
    assert(detail.y >= board.y + board.height - 1, `the reader stays below the board: reader top ${detail.y}, board bottom ${board.y + board.height}`);
  }
}
async function ownStep(page, selector, cancel) {
  await page.locator(selector).waitFor();
  assert.equal(await page.locator('.online-actions').count(), 0, 'the own action takes the reader');
  await visibleBounds(page, selector); await visibleBounds(page, '.play-detail button', true);
  await page.getByRole('button', { name: cancel, exact: true }).waitFor(); await clearBoard(page);
}
async function manual(page, type = 'cards') {
  await page.goto(new URL('next.html', origin).href);
  await page.evaluate(type => { localStorage.removeItem('kingdown.save'); localStorage.setItem('kingdown.game-type', type); localStorage.setItem('kingdown.side', 'light'); localStorage.setItem('kingdown.game-options', JSON.stringify({ arrangement: 'manual' })); }, type);
  await page.reload(); await page.locator('.home-top-new:visible, .home-side-new:visible, .home-hero-new:visible').first().click(); await page.getByRole('button', { name: 'Start game', exact: true }).click();
  await page.locator('.play-game[data-state="arrange"]').waitFor(); await ready(page);
}
async function online(page, context, { fen = '1n5k/P7/8/8/8/8/8/7K w - - 0 1', power = false, notice = false, waiting = false } = {}) {
  let view, redeemed = false;
  await context.route('**/src/account/client.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export function connect() { return { onSession() {}, readSession: async () => ({ userId: "tester", accessToken: "fixture" }) }; }' }));
  await context.addInitScript(fail => {
    localStorage.setItem('kingdown.auth', 'fixture');
    if (fail) { const write = Storage.prototype.setItem; Storage.prototype.setItem = function(key, value) { if (key.startsWith('kingdown.people-king.')) throw new DOMException('full', 'QuotaExceededError'); return write.call(this, key, value); }; }
  }, notice);
  await context.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname, json = value => route.fulfill({ contentType: 'application/json', body: JSON.stringify(value) });
    if (path === '/api/me/settings') return json({ me: { handle: 'tester', icon: null }, settings: {} });
    if (path === '/api/me/games') return json({ games: view && (!notice || redeemed) ? [{ game_id: view.game_id }] : [], invitations: [] });
    if (path === '/api/me/record') return json({ history: [], record: {}, blocks: [] });
    if (path === '/api/invites/preview') return json({ code: 'OK', creator: { handle: 'opponent', icon: null }, colour: 'white', options: { kingPowers: true } });
    if (path === '/api/invites/redeem') { redeemed = true; return json(view); }
    return json(view);
  });
  await page.goto(new URL('next.html', origin).href); await page.locator('.play-home').waitFor();
  const template = await page.evaluate(async ({ fen, power, notice }) => {
    const { Game } = await import('/src/game.ts'), { toFen } = await import('/src/rules/setup.ts'), { rulesOf } = await import('/src/interface/play/saved.ts');
    const hand = ['Freeze', 'IceWall', 'Haste', 'Flight'];
    const game = new Game('RNBQKBNR', rulesOf(power || notice ? 'powers' : 'cards', [{ king: 'Frost', power: 'Freeze' }, { king: 'Shadow', power: 'Darkness' }], [hand, hand]));
    game.load(game.context.fromFen(fen));
    return { fen: toFen(game.pos), rules: game.rules, history: { initial_fen: toFen(game.pos), actions: [] }, legal: game.legal.map(m => game.context.toLan(game.pos, m)) };
  }, { fen, power, notice });
  view = { ...template, options: { kingPowers: power || notice, cards: !power && !notice }, game_id: 'r4-online', revision: 1, server_now: new Date().toISOString(), status: waiting ? 'waiting' : 'playing', seat: 0, turn: 0, action: 'ready', kind: 'friend', speed: 'daily', days_per_move: 3, deadline_at: new Date(Date.now() + 864e5).toISOString(), abort_open: false, last_commands: [], opponent: { handle: 'opponent', user_id: 'other', computer: false, deleted: false, icon: null }, draw_offer: notice ? 0 : 1 };
  await page.goto(new URL(`next.html${notice ? '#join=' + 'a'.repeat(43) : ''}`, origin).href);
  if (notice) await page.getByRole('button', { name: 'Join the game', exact: true }).click();
  else await page.locator('.home-game-row[data-game]').first().click();
  if (!waiting) await ready(page); else await page.locator('.online-waiting').waitFor();
  return { set: value => { view = { ...view, ...value }; }, refresh: async () => { await page.evaluate(() => window.dispatchEvent(new Event('online'))); } };
}
const cases = {
  async selected(page, context) {
    await online(page, context); await cell(page, 48).tap();
    await page.locator('.play-headline').filter({ hasText: 'Pawn' }).waitFor();
    assert.equal(await page.locator('.online-actions').count(), 0, 'a selected piece takes the reader');
    await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
  },
  async promotion(page, context, size) {
    await online(page, context); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    await cell(page, 48).tap();
    await cell(page, 56).tap(); await ownStep(page, '.play-b[data-form="compact"] .play-turn-state, .play-b:not([data-form="compact"]) .play-target', 'Cancel action choice');
    if (await page.locator('.play-game').getAttribute('data-form') === 'compact') assert.match(await page.locator('.play-b[data-form="compact"] .play-turn-state').innerText(), /a8/, 'the compact promotion names a8');
    assert.equal(await page.locator('.play-choices button').count() >= 4, true, 'promotion choices show');
    assert.equal(await page.locator('.play-choices button').first().evaluate(el => el === document.activeElement), true, 'the choice receives focus');
    await shot(page, size, 'draw-promotion');
    await page.getByRole('button', { name: 'Cancel action choice', exact: true }).tap(); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    await cell(page, 48).tap(); await cell(page, 56).tap(); await page.locator('.play-choices button').first().tap();
    await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    assert.match(await cell(page, 56).getAttribute('aria-label'), /Queen/);
  },
  async actionChoice(page, context, size) {
    await online(page, context, { fen: '7k/8/8/2r5/2O5/8/8/K7 w - - 0 1' });
    await cell(page, 26).tap(); await cell(page, 34).tap(); await ownStep(page, '.play-b[data-form="compact"] .play-turn-state, .play-b:not([data-form="compact"]) .play-target', 'Cancel action choice');
    if (await page.locator('.play-game').getAttribute('data-form') === 'compact') assert.match(await page.locator('.play-b[data-form="compact"] .play-turn-state').innerText(), /Rook on c5/, 'the compact choice names its target');
    assert.match(await page.locator('.play-headline').innerText(), /Capture or push/);
    await shot(page, size, 'draw-action-choice');
    await page.getByRole('button', { name: 'Cancel action choice', exact: true }).tap(); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    await cell(page, 26).tap(); await cell(page, 34).tap(); await page.locator('.play-choices button').first().tap(); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
  },
  async armedCard(page, context, size) {
    await online(page, context); const source = page.locator('.play-own .play-card').filter({ hasText: 'Freeze' });
    await source.tap(); await ownStep(page, '.play-step', 'Cancel Freeze'); await shot(page, size, 'draw-armed-card');
    await page.getByRole('button', { name: 'Cancel Freeze', exact: true }).tap(); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    await source.tap(); await cell(page, 57).tap(); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    assert.equal(await source.getAttribute('data-spent'), 'true');
  },
  async armedPower(page, context, size) {
    await online(page, context, { power: true }); const source = page.locator('.play-own .play-power');
    await source.tap(); await ownStep(page, '.play-step', 'Cancel Freeze'); await shot(page, size, 'draw-armed-power');
    await page.keyboard.press('Escape'); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    await source.tap(); await cell(page, 57).tap(); await page.getByRole('button', { name: 'Accept draw', exact: true }).waitFor();
    assert.equal(await source.getAttribute('data-spent'), 'true');
  },
  async notice(page, context, size) {
    if (size[0] !== 390) return;
    const server = await online(page, context, { notice: true, fen: '4r2k/8/8/8/8/8/8/4K3 w - - 0 1' });
    await page.locator('.play-detail').getByText(saveLine, { exact: true }).waitFor(); await shot(page, size, 'king-save-notice');
    server.set({ draw_offer: null, revision: 2, last_commands: [{ seq: 2, seat: 1, at: new Date().toISOString(), action: { type: 'draw', choice: 'decline' } }] }); await server.refresh();
    await page.locator('.play-detail').getByText('Your opponent keeps playing.', { exact: true }).waitFor();
    await page.waitForFunction(line => !document.querySelector('.play-detail')?.innerText.includes(line), saveLine);
    assert.equal(await page.locator('.play-check').count() > 0, true, 'the first check line remains');
    await shot(page, size, 'server-notice-check');
  },
  async waitingNotice(page, context, size) {
    if (size[0] !== 390) return;
    const server = await online(page, context, { notice: true, waiting: true });
    await page.locator('.online-waiting').getByText(saveLine, { exact: true }).waitFor();
    server.set({ status: 'playing', revision: 2 }); await server.refresh(); await ready(page);
    assert.equal(await page.locator('.play-detail').getByText(saveLine, { exact: true }).count(), 0, 'the waiting notice is not shown again on the board');
  },
  async kept(page, context, size) {
    if (size[0] !== 360) return;
    await manual(page);
    const kept = await page.evaluate(async () => {
      const { Game } = await import('/src/game.ts'), { DraftTurn } = await import('/src/interface/play/turn.ts'), { rulesOf, snapshot } = await import('/src/interface/play/saved.ts');
      const game = new Game('RNBQKBNR', rulesOf('pieces', [null, null], [[], []]));
      game.play(game.legal.find(m => m.from === 12 && m.to === 28));
      return { ...snapshot(new DraftTurn(game), null, 1), skill: 'beginner', pace: 'off' };
    });
    await page.evaluate(kept => localStorage.setItem('kingdown.save.kept', JSON.stringify(kept)), kept);
    await home(page);
    await page.locator('.home-offer').getByRole('button', { name: 'Open', exact: true }).click();
    await page.locator('dialog[open]').getByRole('button', { name: 'Open', exact: true }).click(); await ready(page);
    assert.notEqual(await page.locator('.play-game').getAttribute('data-state'), 'arrange', 'the kept game opens at its position');
    assert.equal(await page.getByRole('button', { name: 'Ready', exact: true }).count(), 0);
    assert.match(await cell(page, 28).getAttribute('aria-label'), /Pawn/);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).moves), kept.moves, 'the kept moves remain');
    await page.locator('.play-history-toggle').tap(); assert.match(await page.locator('.play-scroll-panel').innerText(), /e2.*e4/);
  },
  async staleResign(page, context, size) {
    if (size[0] !== 360) return;
    await context.addInitScript(save => { if (!localStorage.getItem('kingdown.save')) localStorage.setItem('kingdown.save', JSON.stringify(save)); }, fixture);
    const stale = await context.newPage();
    try {
      await stale.goto(new URL('next.html', origin).href); await resume(stale);
      await manual(page); const before = await page.evaluate(() => ({ save: localStorage.getItem('kingdown.save'), marker: localStorage.getItem('kingdown.arrangement') }));
      await stale.getByRole('button', { name: 'Menu', exact: true }).tap(); await stale.getByRole('button', { name: 'Resign', exact: true }).tap(); await stale.locator('dialog[open]').getByRole('button', { name: 'Resign', exact: true }).tap(); await stale.locator('.play-result').waitFor();
      assert.deepEqual(await page.evaluate(() => ({ save: localStorage.getItem('kingdown.save'), marker: localStorage.getItem('kingdown.arrangement') })), before, 'stale Resign writes no game or marker');
      await page.reload(); await resume(page); await page.locator('.play-game[data-state="arrange"]').waitFor();
    } finally { await stale.close(); }
  },
  async warning(page, context, size) {
    if (size[0] !== 390) return;
    await page.setViewportSize({ width: 390, height: 751 });
    await context.addInitScript(save => { if (!localStorage.getItem('kingdown.save')) localStorage.setItem('kingdown.save', JSON.stringify(save)); }, fixture);
    await page.goto(new URL('next.html', origin).href); await resume(page);
    const other = await context.newPage();
    try {
      await other.goto(new URL('next.html', origin).href); await resume(other); await cell(other, 8).tap(); await cell(other, 16).tap();
      await cell(page, 9).tap(); await cell(page, 17).tap();
      await page.getByRole('button', { name: 'Load the newer game', exact: true }).waitFor({ state: 'attached' }); await page.keyboard.press('Escape');
      await visibleBounds(page, '.play-headline-line'); await visibleBounds(page, '.play-detail button', true); await clearBoard(page); await shot(page, [390, 751], 'newer-tab-warning');
      await page.getByRole('button', { name: 'Load the newer game', exact: true }).click(); await home(page);
      await manual(page, 'both'); await visibleBounds(page, '.play-headline-line, .play-arrange-rule'); await visibleBounds(page, '.play-turn button', true); await clearBoard(page); await shot(page, [390, 751], 'manual');
      await page.getByRole('button', { name: 'Ready', exact: true }).tap(); await page.locator('.play-game[data-state="arrange"]').waitFor({ state: 'detached' });
      await visibleBounds(page, '.play-turn button', true);
      await visibleBounds(page, '.play-history-strip'); await clearBoard(page);
    } finally { await other.close(); }
  },
};
try {
  for (const size of sizes) for (const [name, run] of Object.entries(cases)) {
    if (process.env.R4_CASES && !process.env.R4_CASES.split(',').includes(name)) continue;
    const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: true, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(); page.setDefaultTimeout(4000);
    const errors = trapErrors(page);
    try { await run(page, context, size); assertNoErrors(errors); results.push({ name, size, ok: true }); console.log('ok', name, size.join('x')); }
    catch (error) { await shot(page, size, `failure-${name}`); failures.push(`${name} ${size.join('x')}: ${error.message}`); console.error(failures.at(-1)); }
    finally { await context.close(); }
  }
  writeFileSync(join(out, 'r4-results.json'), JSON.stringify({ results, failures }, null, 2));
  assert.equal(failures.length, 0, failures.join('\n'));
} finally { await browser.close(); }
