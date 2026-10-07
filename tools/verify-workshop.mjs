// One-screen Workshop check at five viewports: blank cast, the two boards, the rule book, the properties,
// the name, the appearance, the thermometer, Undo, the keyboard, a refused save, share, Try it and reload.
// The groups after them come back from the old check (commits 84f9e42 and 8c91940), written for the
// one-screen card: the card layout, the game menu, a tap outside, the doors, the keys, the judge's
// reactions, the shelf, a shared link, the edit state after Try it and Share, and Try it.
// Run it with `npm run check:browser workshop`. It reads its server, channel and output folder from the
// shared check module (tools/lib/checks.mjs).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertNoErrors, env, imageIs, launch, minTarget, noOverlap, noSidewaysScroll, shot, textNotCut, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const cast = JSON.parse(readFileSync(new URL('../docs/visual-design/workshop/cast.json', import.meta.url), 'utf8'));
const viewports = [[320, 568], [390, 844], [568, 320], [768, 1024], [1280, 900]];
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop')).designs[0]);
const mark = async p => (await saved(p)).squares[0].mark;
const cell = (p, mode, x = 1, y = 2) => p.locator(`.ws-board[data-action="${mode}"] .ws-cell[data-x="${x}"][data-y="${y}"]`);
const openDialogs = p => p.locator('#workshop dialog[open]').count();
/** Empties the clipboard, runs `action`, and waits until the page writes the clipboard (the write is async); returns the text. */
async function copied(p, action) {
  await p.evaluate(() => navigator.clipboard.writeText(''));
  await action();
  for (let i = 0; i < 50; i++) {
    const text = await p.evaluate(() => navigator.clipboard.readText());
    if (text) return text;
    await p.waitForTimeout(100);
  }
  return '';
}

/** Waits until the game view is ready. */
async function ready(p) {
  await p.waitForFunction(() => window.view?.ready);
  await p.evaluate(() => window.view.ready());
}

/** New piece: one choice per cast figure; a new design is blank and shows two boards, one model and an upright meter. */
async function blankCast(p, width) {
  await p.goto(base);
  await ready(p);
  await p.click('#workshop-btn');
  await p.click('[data-door="piece"]');
  assert.equal(await p.locator('[data-new-figure]').count(), cast.length, 'one New piece choice per cast figure');
  await p.click('[data-new-figure="antler-guardian"]');
  await p.waitForLoadState('networkidle');
  await shot(p, `${width}-initial`);
  assert.deepEqual((await saved(p)).squares, [], 'a new design has no squares');
  assert.equal(await p.locator('.ws-board').count(), 2, 'two boards');
  assert.equal(await p.locator('#workshop').locator('.ws-edit-sheet,.ws-die,.ws-card-edit,.ws-plinth,.ws-floor,.ws-rim,input[type="range"]').count(), 0, 'no removed control');
  assert.equal(await p.locator('.ws-model img').count(), 1, 'one model picture');
  const meter = await p.locator('.ws-thermometer').boundingBox();
  assert.ok(meter.height > meter.width, 'the thermometer is upright');
  assert.equal(await p.getAttribute('.ws-thermometer', 'role'), 'meter', 'the thermometer is a meter');
}

/** The move and take boards are separate channels; Undo goes back one step; the shoot mode gives move and shoot. */
async function separateChannels(p, width) {
  await p.selectOption('[name="ws-paint"]', 'one');
  if (width === 390) await cell(p, 'move').tap(); else await cell(p, 'move').click();
  assert.equal(await mark(p), 'move', 'move board marks move');
  await cell(p, 'take').click();
  assert.equal(await mark(p), 'both', 'take board adds take');
  await cell(p, 'move').click();
  assert.equal(await mark(p), 'take', 'move board removes move');
  await p.click('.ws-undo');
  assert.equal(await mark(p), 'both', 'Undo restores both');
  await p.selectOption('.ws-take-mode select', 'shoot');
  await cell(p, 'shoot').click();
  await cell(p, 'shoot').click();
  assert.equal(await mark(p), 'moveShoot', 'shoot board gives move and shoot');
  await p.selectOption('.ws-take-mode select', 'take');
  await cell(p, 'take').click();
  await cell(p, 'take').click();
}

/** The rule book and the When pill open inline, with no dialog; a property changes the condition; remove deletes a rule. */
async function inlineProperties(p) {
  await p.click('.ws-add');
  assert.equal(await openDialogs(p), 0, 'the rule book opens with no dialog');
  await p.click('.ws-book-row[data-a="chain"]');
  assert.equal((await saved(p)).rules.length, 1, 'one rule after chain');
  await p.click('.ws-add');
  await p.click('.ws-book-row[data-a="movesLike"]');
  await p.click('.ws-pill[data-pill="when"]');
  assert.equal(await openDialogs(p), 0, 'the When pill opens with no dialog');
  const condition = (await saved(p)).rules[1].when;
  await p.locator('.ws-property-options label').filter({ hasText: 'In the enemy half' }).first().click();
  assert.notDeepEqual((await saved(p)).rules[1].when, condition, 'a property changes the condition');
  await p.locator('.ws-remove').last().click();
  assert.equal((await saved(p)).rules.length, 1, 'remove deletes the rule');
}

/** Rename, then choose a figure and the second army. */
async function nameAndAppearance(p) {
  await p.click('.ws-name');
  await p.fill('.ws-name-in', 'Test Sentinel');
  await p.keyboard.press('Enter');
  assert.equal((await saved(p)).name, 'Test Sentinel', 'rename saves the name');
  await p.click('.ws-eye');
  await p.click('.ws-gallery summary');
  await p.click('.ws-gallery [data-figure="clay-golem"]');
  await p.locator('.ws-army label').filter({ has: p.locator('input[value="1"]') }).click();
  assert.equal((await saved(p)).look.figure, 'clay-golem', 'the chosen figure is saved');
  await p.click('.ws-eye');
}

/** The workspace has no sideways scroll and each board fits the width. */
async function layoutFits(p, width) {
  assert.equal(await p.evaluate(() => document.querySelector('.ws-workspace').scrollWidth > document.querySelector('.ws-workspace').clientWidth + 1), false, 'no sideways scroll');
  for (const board of await p.locator('.ws-board').all()) {
    const r = await board.boundingBox();
    assert.ok(r.x >= 0 && r.x + r.width <= width + 1, 'board fits width');
  }
  await p.locator('.ws-workspace').evaluate(e => { e.scrollTop = 0; });
  await p.waitForLoadState('networkidle');
  await shot(p, `${width}-dashboard`);
}

/** Desktop: arrows and Enter mark a square; a refused save shows the alert; Retry clears it. */
async function keyboardAndRefusedSave(p) {
  await cell(p, 'move', 0, 0).focus();
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('Enter');
  assert.ok((await saved(p)).squares.some(s => s.x === 1 && s.y === 0), 'arrows and Enter mark a square');
  await p.keyboard.press('Control+z');
  await p.evaluate(() => {
    window.originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === 'kingdown.workshop') throw Error('full'); return window.originalSet.call(this, k, v); };
  });
  await cell(p, 'move', 1, 0).click();
  assert.equal(await p.locator('.ws-alert').isVisible(), true, 'a refused save shows the alert');
  await p.evaluate(() => { Storage.prototype.setItem = window.originalSet; });
  await p.click('.ws-alert-retry');
  assert.equal(await p.locator('.ws-alert').isVisible(), false, 'Retry clears the alert');
  await p.click('.ws-undo');
}

/** Try it shows the figure; a share link opens read-only and Keep a copy saves it; a reload keeps the design. */
async function shareTryReload(p) {
  const before = await saved(p);
  await p.click('.ws-share');
  const link = await copied(p, () => p.click('.ws-copy-link'));
  await p.click('.ws-try');
  await p.waitForSelector('.tb-me');
  await imageIs(p, '.tb-me', 'ui/workshop/clay-golem-w.webp');
  await p.click('.ws-back');
  await p.click('.ws-undo');
  assert.equal((await saved(p)).look.army, 0, 'Undo after Try it restores the first army');
  await p.goto(link);
  await p.waitForSelector('.ws-keep-copy');
  assert.equal(await p.locator('.ws-cell:not([disabled])').count(), 0, 'a share link opens read-only');
  await p.click('.ws-keep-copy');
  assert.equal((await saved(p)).name, before.name, 'Keep a copy saves the design');
  await p.reload();
  await ready(p);
  await p.click('#workshop-btn');
  await p.locator('.ws-tile').first().click();
  assert.equal((await saved(p)).look.figure, 'clay-golem', 'a reload keeps the figure');
}

/* ---- The groups that come back from the old check (84f9e42, 8c91940) ---- */

/** The sizes of the card layout group. The short landscape size (568x320) gets its own group with the landscape layout. */
const tall = viewports.filter(([, height]) => height > 500);
const ALWAYS = { on: 'always' };
const step = mark => [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]].map(([x, y]) => ({ x, y, mark }));
/** Pool pieces in Workshop words (src/workshop/model.ts PRESETS), and Rook mixed with Knight, a likely-overpowered design. */
const PIECES = {
  knight: { squares: [[1, 2], [-1, 2], [1, -2], [-1, -2], [2, 1], [-2, 1], [2, -1], [-2, -1]].map(([x, y]) => ({ x, y, mark: 'both' })), lines: [], rules: [] },
  rook: { squares: [], lines: ['n', 'e', 's', 'w'], rules: [] },
  pawn: { squares: [{ x: 0, y: 1, mark: 'move' }, { x: 1, y: 1, mark: 'take' }, { x: -1, y: 1, mark: 'take' }], lines: [],
    rules: [{ when: { on: 'zone', zone: 'startRank' }, does: { a: 'step2' } }, { when: { on: 'reaches', zone: 'lastRank' }, does: { a: 'becomes', into: 'choice' } }] },
  paladin: { squares: [], lines: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'],
    rules: [{ when: ALWAYS, does: { a: 'linesPass', over: 'own' } }, { when: { on: 'takes' }, does: { a: 'removedAfter', what: 'piece' } }, { when: ALWAYS, does: { a: 'cannotTake', what: 'king' } }] },
  beast: { squares: step('both'), lines: [], rules: [{ when: { on: 'takes' }, does: { a: 'chain' } }] },
  likelyOP: { squares: [], lines: ['n', 'e', 's', 'w'], rules: [{ when: { on: 'zone', zone: 'enemyHalf' }, does: { a: 'movesLike', as: 'knight' } }] },
};
/** The query of a share link to a design of PIECES, made as the Share sheet makes it (src/workshop/model.ts designCode). */
const linkTo = (key, name) => `?design=${Buffer.from(JSON.stringify({ kind: 'piece', ...PIECES[key], name, look: { body: 'token', auto: true, glow: null, army: 0, figure: 'antler-guardian' }, letter: 'D' })).toString('base64url')}`;
const designs = p => p.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop') ?? '{"designs":[]}').designs);
const sheetOpen = '#workshop .ws-sheet[open]';
const isOpen = (p, selector) => p.evaluate(s => !!document.querySelector(`${s}[open]`), selector);
const gauge = p => p.getAttribute('.ws-piece-card .ws-gauge', 'aria-valuenow');
const text = (p, selector) => p.locator(selector).first().innerText();

/** A new page at a size, with the game ready. The title screen shows only when `title` is true; `init` runs before each load. */
async function open(browser, { width = 390, height = 844, title = false, query = '', init = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 721, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  trapErrors(p);
  if (!title) await p.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
  if (init) await p.addInitScript(init);
  await p.goto(base + query);
  await ready(p);
  return p;
}
/** Opens the Workshop from the game menu. */
async function viaMenu(p) {
  await p.click('#workshop-btn');
  await p.waitForSelector('#workshop[open] .ws-door');
}
/** A new piece from the cast: the Workshop home, New piece, then a figure. */
async function newPiece(p) {
  await viaMenu(p);
  await p.click('[data-door="piece"]');
  await p.click('[data-new-figure="antler-guardian"]');
  await p.waitForSelector('.ws-piece-card');
}
/** Opens a share link to a design of PIECES; with `keep`, Keep a copy makes it a design of the player. */
async function openLink(p, key, name, keep = false) {
  await p.goto(base + linkTo(key, name));
  await ready(p);
  await p.waitForSelector('#workshop[open] .ws-piece-card');
  if (!keep) return;
  await p.click('.ws-piece-card .ws-keep-copy');
  await p.waitForSelector('.ws-add');
}
/** Adds a property from the + picker. */
async function addRule(p, a) {
  await p.click('.ws-add');
  await p.click(`.ws-book-row[data-a="${a}"]`);
}
async function rename(p, name) {
  await p.click('.ws-name');
  await p.fill('.ws-name-in', name);
  await p.keyboard.press('Enter');
}
/** Opens the Share sheet and taps one of its actions. */
async function shareAction(p, action) {
  await p.click('.ws-share');
  await p.click(`${sheetOpen} .ws-${action}`);
}

/** No sideways scroll, 44 px controls, no overlap and no cut text on the open Workshop screen. */
async function screenFits(p, what) {
  await noSidewaysScroll(p);
  for (const area of await p.locator('#workshop .ws-scroll, #workshop .ws-workspace').all()) {
    assert.ok(await area.evaluate(e => e.scrollWidth <= e.clientWidth + 1), `${what}: no sideways scroll in the Workshop`);
  }
  await minTarget(p, '#workshop button:not(.ws-cell), #workshop select');
  if (!await p.locator('.ws-piece-card').count()) return;
  for (const row of ['.ws-bar > *', '.ws-card-border > *', '.ws-portrait > *', '.ws-name-row > *', '.ws-footer > *']) await noOverlap(p, `#workshop ${row}`);
  for (const words of ['.ws-name-t', '.ws-worth', '.ws-bottom', '.ws-save-state', '.ws-bar button', '.ws-footer button']) await textNotCut(p, `#workshop ${words}`);
}

/** Layout: the home, New piece, a blank card, a likely-overpowered design with its chip, and an 18-letter name. */
async function cardLayout(browser, width, height) {
  const p = await open(browser, { width, height });
  await viaMenu(p);
  await screenFits(p, 'home');
  await p.click('[data-door="piece"]');
  await screenFits(p, 'New piece');
  await p.click('[data-new-figure="antler-guardian"]');
  await p.waitForSelector('.ws-piece-card');
  await screenFits(p, 'a blank card');
  await openLink(p, 'likelyOP', 'Rook Rider', true);
  assert.equal(await text(p, '.ws-piece-card .ws-learn'), 'Likely overpowered', 'the chip says "Likely overpowered"');
  await screenFits(p, 'a likely-overpowered card');
  await rename(p, 'Thunderclawmonarch');
  assert.equal(await text(p, '.ws-name-t'), 'Thunderclawmonarch', 'the card shows the 18-letter name');
  await screenFits(p, 'an 18-letter name');
  await p.locator('.ws-workspace').evaluate(e => { e.scrollTop = 0; });
  await shot(p, `${width}x${height}-likely-op-long-name`);
  await p.context().close();
}

/** The game menu: New game, Guide, Workshop and Settings in one row, none cut or on top of another; the Guide has no Workshop door. */
async function gameMenu(browser, width, height) {
  const p = await open(browser, { width, height });
  const menu = 'nav.menu button';
  assert.deepEqual((await p.locator(menu).allInnerTexts()).map(t => t.trim()), ['New game', 'Guide', 'Workshop', 'Settings'], 'the menu order');
  await minTarget(p, menu);
  await noOverlap(p, menu);
  await textNotCut(p, 'nav.menu .label');
  const tops = await p.locator(menu).evaluateAll(bs => bs.map(b => Math.round(b.getBoundingClientRect().top)));
  assert.equal(new Set(tops).size, 1, `the menu is one row: tops ${tops}`);
  await shot(p, `${width}x${height}-menu`);
  await p.click('#rules-btn');
  await p.waitForSelector('#rules[open]');
  assert.equal(await p.locator('#rules [id*="workshop"], #rules :text("Make your own")').count(), 0, 'the Guide holds no Workshop door');
  await p.context().close();
}

/** A tap outside a dialog or sheet closes it, as Esc does; a drag from inside to outside keeps it open. */
async function tapOutside(browser) {
  const p = await open(browser, { width: 390, height: 844 });
  const drag = async (from, to) => { await p.mouse.move(...from); await p.mouse.down(); await p.mouse.move(...to, { steps: 4 }); await p.mouse.up(); };
  for (const [button, dialog] of [['#settings-btn', '#settings'], ['#rules-btn', '#rules'], ['#new-game-btn', '#new-game']]) {
    await p.click(button);
    await p.waitForSelector(`${dialog}[open]`);
    const box = await p.locator(dialog).boundingBox();
    await drag([box.x + 30, box.y + 30], [box.x + 30, 4]);
    assert.equal(await isOpen(p, dialog), true, `${dialog}: a drag out keeps it open`);
    // A dialog as tall as the screen has no backdrop above it: tap beside or below it instead.
    const outside = box.y > 30 ? [box.x + box.width / 2, 8] : box.x > 8 ? [3, box.y + 60] : box.y + box.height < 830 ? [box.x + box.width / 2, 840] : null;
    if (outside) { await p.mouse.click(...outside); assert.equal(await isOpen(p, dialog), false, `${dialog}: a tap outside closes it`); }
    else await p.keyboard.press('Escape');
  }
  await newPiece(p);
  await p.click('.ws-share');
  await p.waitForSelector(sheetOpen);
  const sheet = await p.locator(sheetOpen).boundingBox(), heading = await p.locator(`${sheetOpen} h2`).boundingBox();
  const above = [sheet.x + sheet.width / 2, Math.max(4, sheet.y - 20)];
  assert.ok(sheet.y > 24, `the Share sheet leaves a backdrop above it (top ${sheet.y})`);
  await drag([heading.x + 10, heading.y + 5], above);
  assert.equal(await isOpen(p, '#workshop .ws-sheet'), true, 'a drag out of the sheet keeps it open');
  await p.mouse.click(...above);
  assert.equal(await isOpen(p, '#workshop .ws-sheet'), false, 'a tap above the sheet closes it');
  assert.equal(await isOpen(p, '#workshop'), true, 'the Workshop stays open');
  assert.equal(await text(p, '.ws-name-t'), 'Antler Guardian', 'the card and its design stay');
  await p.context().close();
}

/** The doors: the title, the menu and a link open the Workshop; Back returns to the caller; Esc closes a sheet, then the Workshop. */
async function doors(browser) {
  let p = await open(browser, { title: true });
  await p.waitForSelector('#title-screen[open] #title-workshop');
  await p.click('#title-workshop');
  await p.waitForSelector('#workshop[open]');
  assert.equal(await p.evaluate(() => document.activeElement?.id), 'ws-h', 'the title door: focus on the heading');
  await p.click('.ws-back');
  assert.deepEqual([await isOpen(p, '#workshop'), await isOpen(p, '#title-screen')], [false, true], 'Back returns to the title');
  await p.context().close();

  p = await open(browser);
  await viaMenu(p);
  assert.equal(await p.evaluate(() => document.activeElement?.id), 'ws-h', 'the menu door: focus on the heading');
  await p.click('[data-door="piece"]');
  await p.click('[data-new-figure="antler-guardian"]');
  await p.click('.ws-share');
  await p.waitForSelector(sheetOpen);
  assert.equal(await p.evaluate(() => document.activeElement?.id), 'ws-sheet-h', 'a sheet opens with focus on its heading');
  await p.keyboard.press('Escape');
  assert.deepEqual([await isOpen(p, '#workshop .ws-sheet'), await isOpen(p, '#workshop')], [false, true], 'Esc closes the sheet first');
  await p.keyboard.press('Escape');
  assert.equal(await isOpen(p, '#workshop'), false, 'Esc then closes the Workshop');
  await viaMenu(p);
  await p.click('.ws-back');
  assert.equal(await p.locator('dialog[open]').count(), 0, 'Back from the home returns to the game');

  await openLink(p, 'knight', 'Linked Knight');
  assert.equal(await text(p, '.ws-name-t'), 'Linked Knight', 'the link door opens the design');
  await p.click('.ws-back');
  await p.waitForSelector('#workshop[open] .ws-door');
  await p.click('.ws-back');
  assert.equal(await p.locator('dialog[open]').count(), 0, 'Back from a link returns to the game');
  await p.context().close();
}

/** A key pressed in the Workshop does not reach the game: the game state is the same before and after. */
async function keysStayInWorkshop(browser) {
  const p = await open(browser, { width: 1280, height: 900 });
  await p.evaluate(() => { window.highlights = 0; const h = window.view.highlight.bind(window.view); window.view.highlight = a => { window.highlights++; return h(a); }; });
  const game = () => p.evaluate(() => [localStorage.getItem('kingdown.save'), document.getElementById('info')?.textContent, location.search].join('|'));
  const before = await game();
  await newPiece(p);
  await p.click('.ws-share');
  await p.waitForSelector(sheetOpen);
  for (const key of ['z', 'r', 'ArrowLeft', 'ArrowRight', 'Escape']) await p.keyboard.press(key);
  const board = '.ws-board[data-action="move"]';
  await p.focus(`${board} .ws-cell[tabindex="0"]`);
  for (const key of ['ArrowUp', 'ArrowUp', 'ArrowRight']) await p.keyboard.press(key);
  assert.deepEqual(await p.evaluate(b => [document.activeElement.dataset.x, document.activeElement.dataset.y, document.querySelectorAll(`${b} [tabindex="0"]`).length], board), ['1', '2', 1], 'the board takes the arrow keys with one tab stop');
  await p.keyboard.press('Enter');
  assert.equal((await saved(p)).squares.length, 8, 'Enter on the board marks the squares');
  await p.keyboard.press('Escape');
  assert.equal(await isOpen(p, '#workshop'), false, 'Esc closes the Workshop');
  assert.equal(await game(), before, 'the game behind is the same');
  assert.equal(await p.evaluate(() => window.highlights), 0, 'no key reached the game (no highlight redraw)');
  await p.context().close();
}

/** The judge reacts to an edit: Knight plus "Takes again" in at most 6 actions; Rook plus "Takes again" is possibly overpowered, and Undo restores it. */
async function judgeReacts(browser) {
  const p = await open(browser);
  await viaMenu(p);
  let actions = 0;
  const act = async f => { actions++; await f(); };
  await act(() => p.click('[data-door="piece"]'));
  await act(() => p.click('[data-new-figure="antler-guardian"]'));
  await act(() => cell(p, 'move').click());
  await act(() => cell(p, 'take').click());
  assert.deepEqual((await saved(p)).squares.map(s => s.mark), Array(8).fill('both'), 'two taps paint the Knight');
  const g0 = await gauge(p), w0 = await text(p, '.ws-worth');
  await act(() => p.click('.ws-add'));
  await act(() => p.click('.ws-book-row[data-a="chain"]'));
  assert.ok(actions <= 6, `Knight plus "Takes again" in ${actions} actions`);
  assert.notEqual(await gauge(p), g0, 'the gauge changes');
  assert.notEqual(await text(p, '.ws-worth'), w0, 'the worth line changes');
  await shot(p, '390x844-knight-takes-again');

  await openLink(p, 'rook', 'Test Rook', true);
  await p.evaluate(() => { window.said = []; new MutationObserver(() => window.said.push(document.querySelector('.ws-live').textContent)).observe(document.querySelector('.ws-live'), { childList: true, characterData: true, subtree: true }); });
  const rook = [await gauge(p), await text(p, '.ws-worth'), await text(p, '.ws-learn')];
  assert.equal(rook[2], 'Fair', 'the Rook is fair');
  await addRule(p, 'chain');
  assert.equal(await text(p, '.ws-learn'), 'Possibly overpowered', 'the chip says "Possibly overpowered"');
  assert.match(await text(p, '.ws-worth'), /^Estimated worth · [\d½]+ pawns$/, 'the worth line stays beside the chip');
  assert.deepEqual(await p.evaluate(() => window.said), [`About ${(await text(p, '.ws-worth')).replace('Estimated worth · ', '')}. Possibly overpowered.`], 'one announcement');
  await shot(p, '390x844-rook-takes-again');
  await p.click('.ws-add');
  const key = await p.locator('.ws-property-options .ws-key').textContent();
  assert.match(key, /The number is about how many pawns the rule adds to this piece\..*“\?” marks a guess/s, 'the rule book shows the key to its numbers');
  assert.doesNotMatch(await p.locator('.ws-property-options').textContent(), /capital|Cannot be taken\b/, 'the rule book uses plain words');
  assert.notEqual(await p.locator('.ws-book-row[data-a="movesLike"] .ws-book-badge').textContent(), '+0', 'a small change is not shown as 0');
  await shot(p, '390x844-rule-book');
  await p.click('.ws-property-close');
  await p.click('.ws-why');
  await p.waitForSelector(sheetOpen);
  assert.ok((await p.locator(`${sheetOpen} .ws-reasons li`).allTextContents()).some(t => /^Without “takes again”: about [\d½]+ pawns?\.$/.test(t)), 'Why? gives the worth without each part');
  await p.click(`${sheetOpen} .ws-undo-last`);
  assert.deepEqual([await gauge(p), await text(p, '.ws-worth'), await text(p, '.ws-learn')], rook, 'Undo restores the Rook, its gauge and its chip');
  await p.context().close();
}

/** The shelf: open a design, edit it, make a copy, send the link, delete one after its confirm. */
async function shelf(browser) {
  // A device that cannot share: the browser's share sheet does not end in a headless browser.
  const p = await open(browser, { init: () => { delete Navigator.prototype.share; } });
  await newPiece(p);
  await cell(p, 'move').click();
  await p.click('.ws-back');
  await p.waitForSelector('.ws-tile');
  await p.click('.ws-tile');
  await p.waitForSelector('.ws-piece-card');
  await rename(p, 'Shelf Test');
  assert.equal(await text(p, '.ws-name-t'), 'Shelf Test', 'a rename shows on the card at once');
  await shareAction(p, 'dup');
  await p.waitForSelector('.ws-piece-card');
  assert.equal(await text(p, '.ws-name-t'), 'Shelf Test copy', 'Make a copy opens the copy');
  assert.match(await copied(p, () => shareAction(p, 'send')), /\?design=[\w-]+$/, 'Send link copies the link where the device cannot share');
  await shareAction(p, 'del');
  await p.waitForSelector(`${sheetOpen} .ws-yes`);
  assert.equal(await text(p, `${sheetOpen} h2`), 'Delete Shelf Test copy?', 'Delete asks first');
  await p.click(`${sheetOpen} .ws-yes`);
  await p.waitForSelector('.ws-door');
  assert.deepEqual(await p.locator('.ws-tile b').allInnerTexts(), ['Shelf Test'], 'the copy goes and the first design stays');
  assert.deepEqual((await designs(p)).map(d => d.name), ['Shelf Test'], 'the device keeps the first design only');
  await p.context().close();
}

/** A shared link opens read-only with the same verdict; Keep a copy saves it; a reload keeps the design. */
async function sharedLink(browser) {
  let p = await open(browser);
  await openLink(p, 'likelyOP', 'Rook Rider', true);
  const worth = await text(p, '.ws-worth');
  const asText = await copied(p, () => shareAction(p, 'copy'));
  assert.match(asText, /\| Rook Rider \| piece \| .* \| \d+\.\d\d \| likely overpowered \|/, 'Copy as text gives a MATRIX row');
  const link = asText.trim().split('\n').at(-1);
  assert.match(link, /\?design=[\w-]+$/, 'Copy as text ends with the link');
  await p.reload();
  await ready(p);
  await viaMenu(p);
  assert.ok((await p.locator('.ws-tile b').allInnerTexts()).includes('Rook Rider'), 'a reload keeps the design');
  await p.context().close();

  p = await open(browser, { query: link.slice(link.indexOf('?')) });
  await p.waitForSelector('#workshop[open] .ws-piece-card');
  assert.equal(await text(p, '.ws-name-t'), 'Rook Rider', 'the link opens the design');
  assert.equal(await text(p, '.ws-worth'), worth, 'the link shows the same verdict');
  assert.equal(await p.locator('.ws-cell:not([disabled]), .ws-add, .ws-remove, [data-dir]:not([disabled])').count(), 0, 'a shared design has no editing control');
  assert.equal(await p.isDisabled('.ws-name'), true, 'the name is read-only');
  assert.equal(await p.evaluate(() => localStorage.getItem('kingdown.workshop')), null, 'opening a link saves nothing');
  await p.click('.ws-try');
  await p.click('.ws-back');
  assert.equal(await p.evaluate(() => localStorage.getItem('kingdown.workshop')), null, 'Try it on a shared design saves nothing');
  await p.click('.ws-piece-card .ws-keep-copy');
  await p.waitForSelector('.ws-add');
  assert.equal(await p.locator('.ws-cell:not([disabled])').count(), 98, 'Keep a copy makes each cell of both boards editable');
  assert.deepEqual((await designs(p)).map(d => d.name), ['Rook Rider'], 'Keep a copy saves one design');
  assert.equal(await p.evaluate(() => location.search), '', 'the link leaves the address');
  await p.context().close();
}

/** Try it and Share keep the edit state and the undo history, for a square, a property and a figure. */
async function editStateKept(browser, width, height) {
  const p = await open(browser, { width, height });
  const edits = {
    square: () => cell(p, 'move').click(),
    property: () => addRule(p, 'chain'),
    figure: async () => { await p.click('.ws-eye'); await p.click('.ws-appearance .ws-figure-choice[aria-pressed="false"]'); await p.click('.ws-eye'); },
  };
  for (const [what, edit] of Object.entries(edits)) {
    await openLink(p, 'knight', `Undo ${what}`, true);
    const design = async () => { const { updated, ...d } = (await designs(p)).find(d => d.name === `Undo ${what}`); return d; };
    const before = await design(), worth = await text(p, '.ws-worth');
    await edit();
    assert.notDeepEqual(await design(), before, `${width} ${what}: the edit changes the design`);
    assert.match(await copied(p, () => shareAction(p, 'copy-link')), /\?design=[\w-]+$/, `${width} ${what}: Copy link copies the link`);
    await p.click('.ws-try');
    await p.waitForSelector('.tb-board');
    await p.click('.ws-back');
    assert.equal(await text(p, '.ws-name-t'), `Undo ${what}`, `${width} ${what}: the name stays after Try it`);
    assert.equal(await p.isDisabled('.ws-undo'), false, `${width} ${what}: Undo stays after Try it and Share`);
    await p.click('.ws-undo');
    assert.deepEqual(await design(), before, `${width} ${what}: Undo restores the design`);
    assert.equal(await text(p, '.ws-worth'), worth, `${width} ${what}: Undo restores the worth`);
  }
  await p.context().close();
}

/** Try it: the Knight shows its 8 squares; a chain asks "Take again" or "Finish". A Pawn keeps its own words; a Paladin's warning opens "Why this warning?". */
async function tryIt(browser) {
  const p = await open(browser);
  await openLink(p, 'knight', 'Try Knight', true);
  await p.click('.ws-try');
  await p.waitForSelector('.tb-board .tb-sq');
  assert.equal(await p.locator('.tb-sq.mk').count(), 8, 'the Knight marks 8 squares');
  await p.click('.ws-back');
  await addRule(p, 'chain');
  await p.click('.ws-try');
  await p.waitForSelector('.tb-board .tb-sq');
  const where = () => p.evaluate(() => ['.tb-board', '.tb-row'].map(s => Math.round(document.querySelector(s).getBoundingClientRect().top)).join());
  const at0 = await where();
  await p.click('.tb-sq[data-sq="33"]'); // takes the bishop on b5; the pawn on d6 is next
  assert.equal(await p.locator('.tb-sq.mk').count(), 1, 'the next take shows at once');
  assert.equal(await p.isVisible('.tb-finish'), true, 'Finish ends the chain');
  assert.equal(await text(p, '.tb-say'), 'It may take again: tap a marked piece, or tap Finish.', 'the chain asks "Take again" or "Finish"');
  assert.equal(await where(), at0, 'the board and the buttons stay in place');
  await shot(p, '390x844-try-chain');
  await p.click('.tb-sq.mk');
  assert.equal(await text(p, '.tb-count'), 'Move 1', 'a chain is one move');
  await p.click('.tb-finish');
  assert.equal(await text(p, '.tb-count'), 'Move 2', 'Finish ends the move');
  assert.equal(await p.isVisible('.tb-finish'), false, 'Finish goes after the chain');
  assert.equal(await where(), at0, 'the board and the buttons stay in place after the chain');

  await openLink(p, 'pawn', 'Pawn');
  assert.match(await text(p, '.ws-worth'), /· 1 pawn$/, 'a Pawn is worth 1 pawn');
  assert.equal(await text(p, '.ws-learn'), 'The unit of worth', 'a Pawn keeps its own words on the card');
  assert.match(await p.locator('.ws-summary').textContent(), /the unit of worth/i, 'a Pawn keeps its own words for a screen reader');
  await openLink(p, 'paladin', 'Paladin');
  await p.click('.ws-why');
  await p.waitForSelector(sheetOpen);
  assert.equal(await text(p, `${sheetOpen} h2`), 'Why this warning?', 'the Paladin\'s warning opens "Why this warning?"');
  await p.context().close();
}

const browser = await launch();
try {
  for (const [width, height] of viewports) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 721, permissions: ['clipboard-read', 'clipboard-write'] });
    const p = await ctx.newPage();
    p.setDefaultTimeout(10000);
    const errors = trapErrors(p);
    await p.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
    await blankCast(p, width);
    await separateChannels(p, width);
    await inlineProperties(p);
    await nameAndAppearance(p);
    await layoutFits(p, width);
    if (width === 1280) await keyboardAndRefusedSave(p);
    await shareTryReload(p);
    assertNoErrors(errors);
    console.log(`ok ${width}x${height}: blank cast, separate channels, inline properties, name, appearance, thermometer, undo, share, reload and Try it`);
    await ctx.close();
  }
  for (const [width, height] of viewports) await gameMenu(browser, width, height);
  for (const [width, height] of tall) await cardLayout(browser, width, height);
  console.log(`ok the game menu at ${viewports.length} sizes; the card layout at ${tall.length} sizes`);
  await tapOutside(browser);
  await doors(browser);
  await keysStayInWorkshop(browser);
  console.log('ok a tap outside, the doors, the keys stay in the Workshop');
  await judgeReacts(browser);
  await shelf(browser);
  await sharedLink(browser);
  for (const [width, height] of [[390, 844], [1280, 900]]) await editStateKept(browser, width, height);
  await tryIt(browser);
  console.log('ok the judge reacts, the shelf, a shared link, the edit state after Try it and Share, Try it');
  assertNoErrors();
} finally {
  await browser.close();
}
console.log(`Screens: ${env('PLAYABLE_OUT')}`);
