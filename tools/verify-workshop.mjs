// One-screen Workshop check at five viewports: blank cast, the two boards, the rule book, the properties,
// the name, the appearance, the thermometer, Undo, the keyboard, a refused save, share, Try it and reload.
// The groups after them come back from the old check (commits 84f9e42 and 8c91940), written for the
// one-screen card: the card layout, the game menu, a tap outside, the doors, the keys, the judge's
// reactions, the shelf, a shared link, the edit state after Try it and Share, and Try it. The last groups
// check the review fixes 2, 4, 5, 6, 9, 13, 20, 23, 27, 28 (the line edge) and 29 of 2026-10-06, one group
// per fix, named by its number, and the parts of fixes 1, 8, 12 and 19 that no unit test or other group
// covers. The judge test checks the other part of fix 28 (Why? names the band).
// Two groups check two small faults of workshop-finish/06: Esc in a choices panel and the glow of Surprise me.
// The group motionSetA is the motion seam of workshop-finish/07: the approved Set A reactions on the
// card (A1, A4, A5), measured from the animations that each edit starts and their end times.
// The last groups check the landscape phone layout of workshop-finish/08 (review fix 11): both boards and
// Try it in view at 568x320, each board whole after a scroll at the other sizes, and a refit on a turn.
// Run it with `npm run check:browser workshop`. It reads its server, channel and output folder from the
// shared check module (tools/lib/checks.mjs).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pressMenu } from './app-ui.mjs';
import { assertNoErrors, env, imageIs, insideViewport, launch, minTarget, noOverlap, noRunningAnimations, noSidewaysScroll, shot, textNotCut, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const cast = JSON.parse(readFileSync(new URL('../docs/visual-design/workshop/cast.json', import.meta.url), 'utf8'));
const viewports = [[320, 568], [390, 844], [568, 320], [768, 1024], [1280, 900]];
/** The short landscape layout (workshop.css): a landscape screen at most 500 px high. */
const shortLandscape = (width, height) => width > height && height <= 500;
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

/** New piece: one choice per cast figure; a new design is blank and shows two boards, one model, the empty-card text and an upright meter
 * (in short landscape, no meter: the worth line holds the number). */
async function blankCast(p, width, height) {
  await p.goto(base);
  await ready(p);
  await pressMenu(p, 'Workshop');
  await p.click('[data-door="piece"]');
  assert.equal(await p.locator('[data-new-figure]').count(), cast.length, 'one New piece choice per cast figure');
  await p.click('[data-new-figure="antler-guardian"]');
  await p.waitForLoadState('networkidle');
  await shot(p, `${width}-initial`);
  assert.deepEqual((await saved(p)).squares, [], 'a new design has no squares');
  assert.equal(await p.locator('.ws-board').count(), 2, 'two boards');
  assert.equal(await p.locator('#workshop').locator('.ws-edit-sheet,.ws-die,.ws-card-edit,.ws-plinth,.ws-floor,.ws-rim,input[type="range"]').count(), 0, 'no removed control');
  assert.equal(await p.locator('.ws-model img').count(), 1, 'one model picture');
  // One text for all layouts: the boards are below the card, or beside it in short landscape.
  assert.equal(await p.locator('.ws-worth').innerText(), 'Add moves and takes on the boards.', 'a blank card points to the boards');
  if (shortLandscape(width, height)) assert.equal(await p.locator('.ws-thermometer').isVisible(), false, 'short landscape: no thermometer');
  else {
    const meter = await p.locator('.ws-thermometer').boundingBox();
    assert.ok(meter.height > meter.width, 'the thermometer is upright');
  }
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
  await pressMenu(p, 'Workshop');
  await p.locator('.ws-tile').first().click();
  assert.equal((await saved(p)).look.figure, 'clay-golem', 'a reload keeps the figure');
}

/* ---- The groups that come back from the old check (84f9e42, 8c91940) ---- */

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
  ogre: { squares: step('both'), lines: [], rules: [{ when: ALWAYS, does: { a: 'push', then: 'follow' } }] },
  guard: { squares: step('move'), lines: [], rules: [{ when: ALWAYS, does: { a: 'cannotBeTaken', by: 'allButKing' } }] },
  /** A Guard whose Safe rule works only in the enemy half: it does not hold on d4 and holds on d5. */
  halfGuard: { squares: step('move'), lines: [], rules: [{ when: { on: 'zone', zone: 'enemyHalf' }, does: { a: 'cannotBeTaken', by: 'pawns' } }] },
  /** A piece that shoots and moves to b2 and also moves like a king in the enemy half: "Always" would need a shot and a take on b2. */
  shotKing: { squares: [{ x: 1, y: 1, mark: 'moveShoot' }], lines: [], rules: [{ when: { on: 'zone', zone: 'enemyHalf' }, does: { a: 'movesLike', as: 'king' } }] },
  /** The same rule on a piece with no shot: "Always" adds the king's step to Moves. */
  stepKing: { squares: [{ x: 0, y: 1, mark: 'move' }], lines: [], rules: [{ when: { on: 'zone', zone: 'enemyHalf' }, does: { a: 'movesLike', as: 'king' } }] },
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
  else await p.addInitScript(() => localStorage.setItem('kingdown.first-deal', '1')); // returning title door
  if (init) await p.addInitScript(init);
  await p.goto(base + query);
  await ready(p);
  return p;
}
/** Opens the Workshop from the game menu. */
async function viaMenu(p) {
  await pressMenu(p, 'Workshop');
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

/** The smaller controls of the card in short landscape, as in the approved mockup: [selector, minimum px]. */
const LANDSCAPE_SMALL = [['#workshop .ws-editor .ws-bar button', 36], ['#workshop .ws-name, #workshop .ws-eye, #workshop .ws-take-mode select', 28]];

/** Controls of at least 44 px; in short landscape, the card's header buttons 36 px and its pen, eye and Take-by select 28 px. */
async function targetsFit(p) {
  const { width, height } = p.viewportSize();
  if (!shortLandscape(width, height) || !await p.locator('.ws-piece-card').count()) return minTarget(p, '#workshop button:not(.ws-cell), #workshop select');
  await minTarget(p, '#workshop button:not(.ws-cell, .ws-name, .ws-eye, .ws-editor .ws-bar button), #workshop select:not(.ws-take-mode select)');
  for (const [selector, min] of LANDSCAPE_SMALL) await minTarget(p, selector, min);
}

/** No sideways scroll, large enough controls, no overlap and no cut text on the open Workshop screen. */
async function screenFits(p, what) {
  await noSidewaysScroll(p);
  for (const area of await p.locator('#workshop .ws-scroll, #workshop .ws-workspace').all()) {
    assert.ok(await area.evaluate(e => e.scrollWidth <= e.clientWidth + 1), `${what}: no sideways scroll in the Workshop`);
  }
  await targetsFit(p);
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
  await pressMenu(p, 'Guide');
  await p.waitForSelector('#rules[open]');
  assert.equal(await p.locator('#rules [id*="workshop"], #rules :text("Make your own")').count(), 0, 'the Guide holds no Workshop door');
  await p.context().close();
}

/** A tap outside a dialog or sheet closes it, as Esc does; a drag from inside to outside keeps it open. */
async function tapOutside(browser) {
  const p = await open(browser, { width: 390, height: 844 });
  const drag = async (from, to) => { await p.mouse.move(...from); await p.mouse.down(); await p.mouse.move(...to, { steps: 4 }); await p.mouse.up(); };
  for (const [item, dialog] of [['Settings', '#settings'], ['Guide', '#rules'], ['New game', '#new-game']]) {
    await pressMenu(p, item);
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

/* ---- The review fixes of 2026-10-06: the fix table of docs/visual-design/workshop/REVIEW-2026-10-06.md ---- */

/** Fix 2: a full shelf drops nothing. The player chooses one design to delete, and the new design takes its place. */
async function fix2FullShelf(browser) {
  const p = await open(browser);
  await newPiece(p);
  // 50 designs: copies of the saved new design, oldest last.
  await p.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('kingdown.workshop')).designs[0];
    const seeds = Array.from({ length: 50 }, (_, i) => ({ ...d, id: `seed-${50 - i}`, name: `Seed ${50 - i}`, updated: 1050 - i }));
    localStorage.setItem('kingdown.workshop', JSON.stringify({ v: 1, designs: seeds }));
  });
  const ids = async () => (await designs(p)).map(d => d.id);
  const seeds = await ids();
  await p.click('.ws-back');
  await p.click('[data-door="piece"]');
  await p.click('[data-new-figure="clay-golem"]');
  await p.waitForSelector('.ws-alert:not([hidden]) .ws-alert-del');
  assert.match(await text(p, '.ws-alert p'), /your shelf is full \(50 designs\)/, 'fix 2: a full shelf says so');
  assert.equal(await text(p, '.ws-alert-del'), 'Choose one to delete', 'fix 2: the alert asks "Choose one to delete"');
  assert.deepEqual(await ids(), seeds, 'fix 2: a full shelf drops nothing');
  await p.click('.ws-alert-del');
  await p.waitForSelector(`${sheetOpen} .ws-room-del`);
  assert.equal(await p.locator(`${sheetOpen} .ws-room-del`).count(), 50, 'fix 2: the sheet lists each design');
  await p.click(`${sheetOpen} .ws-room-del[data-id="seed-7"]`);
  const after = await designs(p), mine = after.filter(d => !seeds.includes(d.id));
  assert.deepEqual(mine.map(d => d.name), ['Clay Golem'], 'fix 2: the new design is saved');
  assert.deepEqual(after.filter(d => seeds.includes(d.id)).map(d => d.id), seeds.filter(id => id !== 'seed-7'), 'fix 2: every other design stays');
  assert.equal(await p.isVisible('.ws-alert'), false, 'fix 2: the alert goes');
  assert.equal(await text(p, '.ws-save-state'), 'Saved on this device', 'fix 2: the card says saved');
  await p.context().close();
}

/** Fix 4: Ctrl+Z and Cmd+Z do nothing under a sheet or a choices panel; with none open, they undo. */
async function fix4UndoKeysUnderSheet(browser) {
  const p = await open(browser, { width: 1280, height: 900 });
  await newPiece(p);
  await cell(p, 'move').click();
  await addRule(p, 'movesLike');
  const before = await saved(p);
  const close = () => p.click(`${sheetOpen} .ws-close`), closePanel = () => p.click('.ws-property-close');
  const opens = [
    ['the Share sheet', () => p.click('.ws-share'), close],
    ['the Why? sheet', () => p.click('.ws-why'), close],
    ['the + picker', () => p.click('.ws-add'), closePanel],
    ['the When choices', () => p.click('.ws-pill[data-pill="when"]'), closePanel],
  ];
  for (const [where, show, hide] of opens) {
    await show();
    for (const key of ['Control+z', 'Meta+z']) {
      await p.keyboard.press(key);
      assert.deepEqual(await saved(p), before, `fix 4: ${key} under ${where} leaves the saved design`);
    }
    await hide();
  }
  await p.focus('.ws-why');
  await p.keyboard.press('Control+z');
  assert.equal((await saved(p)).rules.length, 0, 'fix 4: with no sheet, Ctrl+Z undoes the last change');
  await p.keyboard.press('Meta+z');
  assert.equal((await saved(p)).squares.length, 0, 'fix 4: with no sheet, Cmd+Z undoes the change before');
  await p.context().close();
}

/** Fix 20: where the device refuses the clipboard, Copy opens a sheet that holds the text, selected, to copy by hand. */
async function fix20CopyByHand(browser) {
  const p = await open(browser, { init: () => { Clipboard.prototype.writeText = () => Promise.reject(new DOMException('denied', 'NotAllowedError')); delete Navigator.prototype.share; } });
  await newPiece(p);
  await cell(p, 'move').click();
  for (const [action, ends] of [['copy-link', 'is the link'], ['copy', 'ends with the link'], ['send', 'is the link (Send link, no share function)']]) {
    await shareAction(p, action);
    await p.waitForSelector(`${sheetOpen} .ws-copy-box`);
    assert.equal(await text(p, `${sheetOpen} h2`), 'Copy this', `fix 20: ${action} opens "Copy this"`);
    await p.waitForFunction(s => { const t = document.querySelector(s); return document.activeElement === t && t.selectionStart === 0 && t.selectionEnd === t.value.length && t.value.length > 0; }, `${sheetOpen} .ws-copy-box`);
    const value = await p.inputValue(`${sheetOpen} .ws-copy-box`);
    assert.match(action === 'copy' ? value.trim().split('\n').at(-1) : value, /^http:\/\/[^?]+\?design=[\w-]+$/, `fix 20: the text ${ends}`);
    await p.click(`${sheetOpen} .ws-close`);
  }
  await p.context().close();
}

/** Fix 23: in the + picker, a pill's choices and the When choices, ArrowDown moves the choice and Enter commits it, with no mouse. */
async function fix23KeyboardChoices(browser) {
  const p = await open(browser, { width: 1280, height: 900 });
  await newPiece(p);
  await cell(p, 'move').click();
  const panelOpen = () => p.evaluate(() => !document.querySelector('.ws-property-options').hidden);
  // The + picker: Enter opens it, ArrowDown goes to the first row, ArrowDown again to the next, Enter adds that rule.
  await p.focus('.ws-add');
  await p.keyboard.press('Enter');
  const rows = await p.locator('.ws-property-options .ws-book-row:not([disabled])').evaluateAll(bs => bs.map(b => b.dataset.a));
  await p.keyboard.press('ArrowDown');
  assert.equal(await p.evaluate(() => document.activeElement.dataset.a), rows[0], 'fix 23: ArrowDown goes to the first rule of the + picker');
  await p.keyboard.press('ArrowDown');
  assert.equal(await p.evaluate(() => document.activeElement.dataset.a), rows[1], 'fix 23: ArrowDown moves to the next rule');
  await p.keyboard.press('Enter');
  assert.deepEqual((await saved(p)).rules.map(r => r.does.a), [rows[1]], 'fix 23: Enter adds the rule of the + picker');
  assert.equal(await panelOpen(), false, 'fix 23: the + picker closes');
  await p.click('.ws-remove');
  await addRule(p, 'movesLike');
  // A radio choice panel: the focus starts on the chosen row, ArrowDown moves the choice only, and Enter commits it.
  const viaKeys = async (pill, name) => {
    await p.focus(`.ws-pill[data-pill="${pill}"]`);
    await p.keyboard.press('Enter');
    await p.focus(`.ws-property-options input[name="${name}"]:checked`);
    return p.evaluate(n => {
      const all = [...document.querySelectorAll(`.ws-property-options input[name="${n}"]`)].filter(i => !i.disabled && i.checkVisibility());
      return all[(all.findIndex(i => i.checked) + 1) % all.length].value;
    }, name);
  };
  for (const [pill, name, what] of [['as', 'ws-pick', 'a pill choice'], ['when', 'ws-when', 'a When choice']]) {
    const before = await saved(p), next = await viaKeys(pill, name);
    await p.keyboard.press('ArrowDown');
    assert.equal(await panelOpen(), true, `fix 23: ${what}: ArrowDown keeps the panel open`);
    assert.deepEqual(await saved(p), before, `fix 23: ${what}: ArrowDown only moves the choice`);
    await p.keyboard.press('Enter');
    assert.equal(await panelOpen(), false, `fix 23: ${what}: Enter closes the panel`);
    assert.notDeepEqual(await saved(p), before, `fix 23: ${what}: Enter commits the choice`);
    await viaKeys(pill, name);
    assert.equal(await p.inputValue(`.ws-property-options input[name="${name}"]:checked`), next, `fix 23: ${what}: Enter commits the next choice`);
    await p.click('.ws-property-close');
  }
  await p.context().close();
}

/** Fix 27: a press on a dialog's own box (its padding or edge) that ends on the backdrop keeps the dialog open. */
async function fix27PressOnPadding(browser) {
  const p = await open(browser, { width: 390, height: 844 });
  /** The first point inside the dialog's box where a press lands on the dialog itself, not on its content. */
  const ownPoint = dialog => p.evaluate(s => {
    const d = document.querySelector(s), r = d.getBoundingClientRect();
    for (let y = Math.ceil(r.top); y < r.bottom; y++) for (let x = Math.ceil(r.left); x < r.right; x++) if (document.elementFromPoint(x, y) === d) return [x, y];
    return null;
  }, dialog);
  const pressOut = async (dialog, what) => {
    const at = await ownPoint(dialog), box = await p.locator(dialog).boundingBox();
    assert.ok(at, `fix 27: ${what} has a point where a press lands on the dialog itself`);
    await p.mouse.move(...at);
    await p.mouse.down();
    await p.mouse.move(box.x + box.width / 2, Math.max(2, box.y - 12), { steps: 4 });
    await p.mouse.up();
    assert.equal(await isOpen(p, dialog), true, `fix 27: a press on ${what}'s padding released on the backdrop keeps it open`);
  };
  await pressMenu(p, 'Settings');
  await p.waitForSelector('#settings[open]');
  await pressOut('#settings', 'Settings');
  await p.keyboard.press('Escape');
  await newPiece(p);
  await p.click('.ws-share');
  await p.waitForSelector(sheetOpen);
  await pressOut('#workshop .ws-sheet', 'the Share sheet');
  await p.context().close();
}

/** Fix 29: a toast shown on the editor is gone after Back to home. */
async function fix29ToastsClear(browser) {
  const p = await open(browser);
  await newPiece(p);
  await copied(p, () => shareAction(p, 'copy-link'));
  assert.deepEqual([await text(p, '.ws-toast'), await p.locator('.ws-toast.on').count()], ['Link copied.', 1], 'fix 29: the editor shows the toast');
  await p.click('.ws-back');
  await p.waitForSelector('.ws-door');
  assert.equal(await p.locator('.ws-toast.on').count(), 0, 'fix 29: Back to home clears the toast');
  await p.context().close();
}

/** Fix 5: a stroke ends when the player releases the button off the board; the next move over the board paints nothing. */
async function fix5StrokeEndsOffBoard(browser) {
  const p = await open(browser, { width: 1280, height: 900 });
  await newPiece(p);
  const centre = async (x, y) => { const b = await cell(p, 'move', x, y).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const box = await p.locator('.ws-board[data-action="move"]').boundingBox();
  const off = [box.x + box.width / 2, box.y + box.height + 12];
  assert.equal(await p.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.ws-board'), off), false, 'fix 5: the release point is off the boards');
  await p.mouse.move(...await centre(1, 1));
  await p.mouse.down();
  await p.mouse.move(...off);
  await p.mouse.up();
  const after = (await saved(p)).squares;
  assert.ok(after.some(s => s.x === 1 && s.y === 1), 'fix 5: the press paints its square');
  for (const [x, y] of [[2, 2], [-2, 2], [0, 3], [-1, -1]]) await p.mouse.move(...await centre(x, y), { steps: 3 });
  assert.deepEqual((await saved(p)).squares, after, 'fix 5: after a release off the board, the next move over the board paints nothing');
  assert.equal(await isOpen(p, '#workshop'), true, 'fix 5: the Workshop stays open');
  await p.context().close();
}

/** Opens Try it on a design of PIECES from its share link (nothing is saved). */
async function tryLink(p, key, name) {
  await openLink(p, key, name);
  await p.click('.ws-try');
  await p.waitForSelector('.tb-board .tb-sq');
}
const sqLabel = (p, s) => p.getAttribute(`.tb-sq[data-sq="${s}"]`, 'aria-label');

/** Fix 6: in Try it, a square with two actions (take or push) asks which one, and each choice gives its own result. */
async function fix6TwoActionChoice(browser) {
  const p = await open(browser);
  await tryLink(p, 'ogre', 'Try Ogre');
  const result = async kind => {
    await p.click('.tb-sq[data-sq="35"]'); // d4 to d5: the pawn on d6 is next to it
    assert.match(await sqLabel(p, 43), /take or push/, 'fix 6: the pawn on d6 says "take or push"');
    await p.click('.tb-sq[data-sq="43"]');
    assert.equal(await p.isVisible('.tb-ask'), true, 'fix 6: a square with two actions asks which one');
    assert.deepEqual(await p.locator('.tb-ask button').allTextContents(), ['Take', 'Push'], 'fix 6: the choice is Take or Push');
    assert.equal(await text(p, '.tb-say'), 'On d6 it can take or push. Which one?', 'fix 6: the help line asks which one');
    await p.click(`.tb-ask [data-kind="${kind}"]`);
    const out = { said: await text(p, '.tb-live'), d6: await sqLabel(p, 43), d7: await sqLabel(p, 51), asks: await p.isVisible('.tb-ask') };
    await p.click('.ws-reset');
    return out;
  };
  assert.deepEqual(await result('take'), { said: 'Took the enemy pawn on d6.', d6: 'd6, your piece, Try Ogre', d7: 'd7, empty: move here', asks: false }, 'fix 6: Take takes the pawn');
  assert.deepEqual(await result('push'), { said: 'Pushed the enemy pawn from d6 to d7.', d6: 'd6, your piece, Try Ogre', d7: 'd7, enemy pawn: take or push', asks: false }, 'fix 6: Push pushes the pawn');
  await p.context().close();
}

/** Fix 9: in Try it, the arrow keys move the focus, Enter moves the piece, focus lands on the landing square, and the move is announced. */
async function fix9TryKeyboard(browser) {
  const p = await open(browser, { width: 1280, height: 900 });
  await tryLink(p, 'ogre', 'Key Ogre');
  const focused = () => p.evaluate(() => document.activeElement?.dataset.sq);
  const stops = () => p.locator('.tb-sq:not([tabindex="-1"])').count();
  assert.equal(await stops(), 1, 'fix 9: the board is one tab stop');
  await p.focus('.tb-sq[tabindex="0"]');
  assert.equal(await focused(), '27', 'fix 9: the tab stop is the piece on d4');
  for (const [key, sq] of [['ArrowUp', '35'], ['ArrowRight', '36'], ['ArrowLeft', '35']]) {
    await p.keyboard.press(key);
    assert.equal(await focused(), sq, `fix 9: ${key} moves the focus`);
  }
  assert.equal(await text(p, '.tb-count'), 'Move 1', 'fix 9: the arrow keys move no piece');
  await p.keyboard.press('Enter');
  assert.equal(await focused(), '35', 'fix 9: Enter moves the piece and the focus lands on the landing square');
  assert.match(await sqLabel(p, 35), /your piece/, 'fix 9: the piece is on d5');
  assert.equal(await text(p, '.tb-live'), 'Moved to d5.', 'fix 9: the live region announces the move');
  assert.equal(await stops(), 1, 'fix 9: still one tab stop after the move');
  // A take by keys: the choice gets the focus, then the landing square.
  await p.keyboard.press('ArrowUp');
  await p.keyboard.press('Enter');
  assert.equal(await p.evaluate(() => document.activeElement?.closest('.tb-ask') !== null), true, 'fix 9: the focus goes to the choice');
  await p.keyboard.press('Enter');
  assert.equal(await focused(), '43', 'fix 9: after the choice, the focus lands on the landing square');
  assert.equal(await text(p, '.tb-live'), 'Took the enemy pawn on d6.', 'fix 9: the live region announces the take');
  await p.context().close();
}

/** Fix 13: Try it shows a Safe rule in its exact words, says whether it holds now, and says that Try it cannot test it. */
async function fix13SafeRule(browser) {
  const p = await open(browser);
  const untested = 'The other side never moves, so Try it cannot test this rule.';
  await tryLink(p, 'guard', 'Try Guard');
  assert.equal(await text(p, '.tb-safe'), `It cannot be taken by anything but a king. That holds now. ${untested}`, 'fix 13: an Always Safe rule: its words, "holds", "cannot test"');
  assert.equal(await p.locator('.tb-shield').count(), 1, 'fix 13: the piece shows the shield while the rule holds');
  await tryLink(p, 'halfGuard', 'Half Guard');
  assert.equal(await text(p, '.tb-safe'), `In the enemy half, it cannot be taken by pawns. That does not hold now. ${untested}`, 'fix 13: on d4 the enemy-half rule does not hold');
  assert.equal(await p.locator('.tb-shield').count(), 0, 'fix 13: no shield while the rule does not hold');
  await p.click('.tb-sq[data-sq="35"]');
  assert.equal(await text(p, '.tb-safe'), `In the enemy half, it cannot be taken by pawns. That holds now. ${untested}`, 'fix 13: on d5 the enemy-half rule holds');
  assert.equal(await p.locator('.tb-shield').count(), 1, 'fix 13: the shield shows when the rule holds');
  await p.context().close();
}

/** Fix 28, the lines: a slide line on the board is gold with a dark edge, so it reads on the pale squares. */
async function fix28LineEdge(browser) {
  const p = await open(browser);
  await openLink(p, 'rook', 'Line Rook');
  for (const mode of ['move', 'take']) {
    const lines = p.locator(`.ws-board[data-action="${mode}"] .ws-cell.ln`);
    assert.equal(await lines.count(), 12, `fix 28: the ${mode} board draws 4 lines of 3 squares`);
    for (const image of await lines.evaluateAll(cs => cs.map(c => getComputedStyle(c).backgroundImage))) {
      // The colours that show: "transparent" computes as rgba(0, 0, 0, 0), which is not an edge.
      const colours = [...image.matchAll(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/g)].filter(m => m[4] !== '0').map(m => m.slice(1, 4).map(Number));
      const light = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
      assert.ok(colours.some(c => light(c) < 90) && colours.some(c => light(c) > 140), `fix 28: a ${mode} board line has a gold middle and a dark edge: ${image}`);
    }
  }
  await p.context().close();
}

/** Fix 1, the rest: under a refused save, Copy link in the alert copies a link to the unsaved design; a refused delete says so, and the design and the card stay. */
async function fix1RefusedCopyAndDelete(browser) {
  const p = await open(browser);
  await newPiece(p);
  await cell(p, 'move').click();
  const kept = await designs(p);
  await p.evaluate(() => {
    window.originalSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === 'kingdown.workshop') throw Error('full'); return window.originalSet.call(this, k, v); };
  });
  await cell(p, 'take').click();
  await p.waitForSelector('.ws-alert:not([hidden]) .ws-alert-copy');
  const link = await copied(p, () => p.click('.ws-alert-copy'));
  assert.match(link, /\?design=[\w-]+$/, 'fix 1: Copy link in the alert copies the link');
  const code = JSON.parse(Buffer.from(link.split('?design=')[1], 'base64url').toString());
  assert.deepEqual([...new Set(code.squares.map(s => s.mark))], ['both'], 'fix 1: the copied link holds the edit that the device did not save');
  await shareAction(p, 'del');
  await p.click(`${sheetOpen} .ws-yes`);
  const refused = 'Could not delete: this device refused.';
  await p.waitForFunction(t => document.querySelector('#workshop .ws-toast.on')?.textContent === t, refused, { timeout: 3000 }).catch(() => {});
  assert.equal(await p.locator('#workshop .ws-toast.on').count() && await text(p, '#workshop .ws-toast'), refused, 'fix 1: a refused delete says so');
  assert.deepEqual(await designs(p), kept, 'fix 1: a refused delete keeps the design on the device');
  assert.equal(await p.locator('.ws-piece-card').count(), 1, 'fix 1: a refused delete keeps the card open');
  await p.context().close();
}

/** Fix 8, the reason: where "Always" for "also moves like" cannot keep every move and take, the When choices show it disabled with its reason; elsewhere it is open. */
async function fix8AlwaysReason(browser) {
  const p = await open(browser, { width: 1280, height: 900 });
  const always = () => p.locator('.ws-property-options label.ws-choice').filter({ hasText: 'Always (adds it to Moves)' });
  for (const [key, off] of [['shotKing', true], ['stepKing', false]]) {
    await openLink(p, key, key === 'shotKing' ? 'Shot King' : 'Step King', true);
    await p.click('.ws-pill[data-pill="when"]');
    assert.equal(await always().locator('input').isDisabled(), off, `fix 8: ${key}: "Always" is ${off ? '' : 'not '}disabled`);
    const reason = await always().locator('small').count() ? await always().locator('small').innerText() : null;
    assert.equal(reason, off ? 'Its shots and these moves meet on a square, and a square cannot hold both. Keep it as a rule.' : null,
      `fix 8: ${key}: ${off ? 'the disabled "Always" gives its reason' : 'an open "Always" gives no reason'}`);
    await p.click('.ws-property-close');
  }
  await p.context().close();
}

/** Fix 12, the note: Why? with two or more "Without" lines says once that the parts overlap; Why? with one such line does not. */
async function fix12OverlapNote(browser) {
  const p = await open(browser);
  const note = 'Each line is the worth without one part. The parts overlap, so the differences do not add up.';
  for (const [key, lines] of [['likelyOP', 2], ['knight', 1]]) {
    await openLink(p, key, `Why ${key}`);
    await p.click('.ws-why');
    await p.waitForSelector(sheetOpen);
    const withouts = (await p.locator(`${sheetOpen} .ws-reasons li`).allTextContents()).filter(t => t.startsWith('Without'));
    assert.equal(withouts.length, lines, `fix 12: ${key}: Why? has ${lines} "Without" line(s)`);
    assert.equal(await p.locator(`${sheetOpen} p`).filter({ hasText: note }).count(), lines > 1 ? 1 : 0, `fix 12: ${key}: the overlap note shows ${lines > 1 ? 'once' : 'not at all'}`);
    await p.click(`${sheetOpen} .ws-close`);
  }
  await p.context().close();
}

/** Fix 19, the HOME note: a damaged saved entry gives one note on the home; the good design shows and opens; the device keeps the damaged entry. */
async function fix19DamagedNote(browser) {
  const p = await open(browser);
  await newPiece(p);
  await cell(p, 'move').click();
  const [good] = await designs(p), broken = { kind: 'piece', id: 'broken' };
  for (const [bad, words] of [[[broken], '1 saved entry could not be read. It stays on this device; the other designs work.'],
    [[broken, { ...good, id: 'bad-square', squares: [{ x: 9, y: 0, mark: 'both' }] }], '2 saved entries could not be read. They stay on this device; the other designs work.']]) {
    await p.evaluate(all => localStorage.setItem('kingdown.workshop', JSON.stringify({ v: 1, designs: all })), [good, ...bad]);
    await p.click('.ws-back');
    await p.waitForSelector('#workshop[open] .ws-door');
    assert.deepEqual(await p.locator('#workshop .ws-note').allInnerTexts(), [words], `fix 19: ${bad.length} damaged: the home gives one note`);
    assert.deepEqual(await p.locator('.ws-tile b').allInnerTexts(), [good.name], `fix 19: ${bad.length} damaged: the good design shows`);
    await p.click('.ws-tile');
    await p.waitForSelector('.ws-piece-card');
    await cell(p, 'take').click();
    assert.deepEqual((await designs(p)).map(d => d.id), [good.id, ...bad.map(d => d.id)], `fix 19: ${bad.length} damaged: the good design opens and saves, and the device keeps the damaged entries`);
  }
  await p.context().close();
}

/** Esc in a choices panel (the + picker, a pill, the When) closes only the panel and puts the focus on its opener; a second Esc closes the Workshop. */
async function escInPanel(browser) {
  const p = await open(browser, { width: 1280, height: 900 });
  await newPiece(p);
  await cell(p, 'move').click();
  await addRule(p, 'movesLike');
  const panelOpen = () => p.evaluate(() => !document.querySelector('.ws-property-options').hidden);
  for (const [where, opener] of [['the + picker', '.ws-add'], ['a pill', '.ws-pill[data-pill="as"]'], ['the When', '.ws-pill[data-pill="when"]']]) {
    await p.click(opener);
    assert.equal(await panelOpen(), true, `Esc: ${where} opens`);
    await p.keyboard.press('Escape');
    assert.deepEqual([await panelOpen(), await isOpen(p, '#workshop')], [false, true], `Esc in ${where} closes the panel and keeps the Workshop`);
    assert.equal(await p.evaluate(s => document.activeElement === document.querySelector(s), opener), true, `Esc in ${where} puts the focus on ${opener}`);
    await p.keyboard.press('Escape');
    assert.equal(await isOpen(p, '#workshop'), false, `after ${where}, a second Esc closes the Workshop`);
    await viaMenu(p);
    await p.click('.ws-tile');
    await p.waitForSelector('.ws-add');
  }
  await p.context().close();
}

/** Surprise me adds no glow: five surprises, and no saved design holds one. */
async function surpriseNoGlow(browser) {
  const p = await open(browser);
  await viaMenu(p);
  for (let i = 0; i < 5; i++) {
    await p.click('.ws-surprise');
    await p.waitForSelector('.ws-piece-card');
    await p.click('.ws-back');
    await p.waitForSelector('#workshop[open] .ws-door');
  }
  const glows = (await designs(p)).map(d => d.look.glow);
  assert.equal(glows.length, 5, 'Surprise me saves five designs');
  assert.deepEqual(glows.filter(g => g !== null), [], 'no saved design holds a glow');
  await p.context().close();
}

/* ---- Motion (workshop-finish/07): happy-dom has no document.getAnimations, so the browser is the seam ---- */

/** Runs before each load: records each script animation in the Workshop, one list for each reaction (the animations that one task starts). */
function recordReactions() {
  const animate = Element.prototype.animate;
  let open = false;
  window.reactions = [];
  Element.prototype.animate = function (frames, options) {
    const a = animate.call(this, frames, options);
    if (this.closest('#workshop')) {
      if (!open) { open = true; window.reactions.push([]); queueMicrotask(() => { open = false; }); }
      window.reactions.at(-1).push(a);
    }
    return a;
  };
}
/** Each reaction so far: for each animation, its end time in ms, its play state, a shake flag, and false when it moves the figure and its last frame is not the still transform. */
const reactions = p => p.evaluate(() => window.reactions.map(r => r.map(a => {
  const frames = a.effect.getKeyframes(), end = frames.at(-1).transform;
  const still = !a.effect.target.matches('.ws-fig') || !end || end === 'none' || new DOMMatrix(end).isIdentity;
  return { end: a.effect.getComputedTiming().endTime, state: a.playState, shake: /translateX/.test(frames[0].transform ?? ''), still };
})));
/** Asserts that `action` starts exactly one reaction, that it runs, that each animation ends by `limit` ms, and the figure's at the still transform; returns the reaction. */
async function oneReaction(p, what, action, limit = 600) {
  const before = (await reactions(p)).length;
  await action();
  const all = await reactions(p), r = all.at(-1);
  assert.equal(all.length, before + 1, `${what} starts one reaction`);
  assert.ok(r.length && r.every(a => a.state !== 'idle'), `${what}: the reaction runs (nothing stops it at once)`);
  for (const a of r) {
    assert.ok(a.end <= limit, `${what}: an animation ends at ${a.end} ms, after ${limit} ms`);
    assert.ok(a.still, `${what}: an animation of the figure does not end at the still transform`);
  }
  return r;
}
/** Waits until the reaction ends, then: no animation runs on the card, no fading copy stays, and the figure has its still transform. */
async function endsStill(p, what) {
  await p.waitForTimeout(650);
  await noRunningAnimations(p, '#workshop .ws-model-box');
  assert.equal(await p.locator('.ws-model-box .ws-fig-was, .ws-model-box .ws-ring').count(), 0, `${what}: no temporary element stays`);
  assert.equal(await p.locator('.ws-model-box .ws-fig').evaluate(e => getComputedStyle(e).transform), 'none', `${what}: the figure ends at its still transform`);
}
/** True when each animation of the last reaction is stopped (idle), not finished. */
const lastStopped = p => p.waitForFunction(() => window.reactions.at(-1).every(a => a.playState === 'idle' && !document.getAnimations().includes(a)), null, { timeout: 300 });
const pace = (p, value) => p.evaluate(v => { document.documentElement.dataset.pace = v; }, value);

/** Stories 1 to 3: one reaction per edit, Undo and rename, none on a first render; the next edit stops it; 600 ms (300 at Fast); still at the end; none under reduced motion or Animations Off. */
async function motionSetA(browser) {
  const p = await open(browser, { width: 1280, height: 900, init: recordReactions });
  await newPiece(p);
  assert.equal((await reactions(p)).length, 0, 'the first render of a design starts no reaction');
  await oneReaction(p, 'an edit', () => cell(p, 'move').click());
  await oneReaction(p, 'a second edit', () => cell(p, 'take').click());
  assert.ok(await p.evaluate(() => window.reactions.at(-2).every(a => a.playState === 'idle' && !document.getAnimations().includes(a))), 'a second edit stops the first reaction, and none of its animations stays');
  await endsStill(p, 'an edit');
  await oneReaction(p, 'Undo', () => p.click('.ws-undo'));
  await endsStill(p, 'Undo');
  await oneReaction(p, 'a rename', () => rename(p, 'Motion Test'));
  await endsStill(p, 'a rename');

  // A1 cross-fade: the old figure fades out in a copy that lies over the model.
  await p.click('.ws-eye');
  await p.click('.ws-gallery summary');
  await oneReaction(p, 'a new figure', () => p.click('.ws-gallery [data-figure="clay-golem"]'));
  const [model, copy] = await p.evaluate(() => ['.ws-model-box .ws-model', '.ws-model-box .ws-fig-was'].map(s => { const r = document.querySelector(s)?.getBoundingClientRect(); return r && [r.x, r.y, r.width, r.height].map(Math.round); }));
  assert.deepEqual(copy, model, 'the fading copy lies over the model');
  await endsStill(p, 'a new figure');
  await p.click('.ws-eye');

  // A5: a new "moves like" gives a gold ring, anchored to the model.
  await oneReaction(p, 'a new "moves like"', () => addRule(p, 'movesLike'));
  assert.equal(await p.evaluate(() => document.querySelector('.ws-ring')?.offsetParent === document.querySelector('.ws-model-box .ws-model')), true, 'the gold ring anchors to the model');
  await endsStill(p, 'a new "moves like"');

  // A4: the Rook plus "Takes again" becomes possibly overpowered and shakes.
  await openLink(p, 'rook', 'Test Rook', true);
  const shake = await oneReaction(p, 'overpowered', () => addRule(p, 'chain'));
  assert.ok(shake.some(a => a.shake), 'a design that becomes overpowered shakes');
  await endsStill(p, 'overpowered');

  // Fast halves each reaction.
  await pace(p, 'fast');
  await oneReaction(p, 'an edit at Fast', () => cell(p, 'move', 0, 1).click(), 300);
  await endsStill(p, 'an edit at Fast');
  await pace(p, 'normal');

  // Reduced motion: no reaction; a switch to it stops a running one.
  await p.emulateMedia({ reducedMotion: 'reduce' });
  const count = (await reactions(p)).length;
  await cell(p, 'move', 0, 1).click();
  assert.equal((await reactions(p)).length, count, 'reduced motion: an edit starts no reaction');
  await p.emulateMedia({ reducedMotion: 'no-preference' });
  await oneReaction(p, 'an edit before reduced motion', () => cell(p, 'move', 0, 1).click());
  await p.emulateMedia({ reducedMotion: 'reduce' });
  await lastStopped(p);
  await noRunningAnimations(p, '#workshop');
  await p.emulateMedia({ reducedMotion: 'no-preference' });

  // Animations Off: no reaction; a switch to it stops a running one.
  await pace(p, 'off');
  await cell(p, 'move', 0, 1).click();
  assert.equal((await reactions(p)).length, count + 1, 'Animations Off: an edit starts no reaction');
  await pace(p, 'normal');
  await oneReaction(p, 'an edit before Animations Off', () => cell(p, 'move', 0, 1).click());
  await pace(p, 'off');
  await lastStopped(p);
  await noRunningAnimations(p, '#workshop');
  await p.context().close();
}

/* ---- The landscape phone layout (workshop-finish/08) ---- */

/** The card and board boxes [x, y, width, height] of a new piece, with the scroll at the top, before the landscape
 * layout (measured on build d63c763). The landscape layout must not move them. */
const BEFORE = {
  '320x568': { card: [16, 64, 288, 289], move: [16, 541, 288, 288], take: [16, 961, 288, 288] },
  '390x844': { card: [16, 64, 358, 283], move: [37, 535, 316, 316], take: [37, 983, 316, 316] },
  '768x1024': { card: [84, 68, 600, 283], move: [50, 539, 316, 316], take: [402, 539, 316, 316] },
  '1280x900': { card: [112, 76, 320, 346], move: [479, 240, 316, 316], take: [841, 240, 316, 316] },
};
const BOARDS = { move: '#workshop .ws-board[data-action="move"]', take: '#workshop .ws-board[data-action="take"]' };
const roundBox = (p, selector) => p.locator(selector).evaluate(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); });
const cellWidths = p => p.locator('#workshop .ws-cell').evaluateAll(cells => [...new Set(cells.map(c => c.getBoundingClientRect().width))]);
/** A new piece at a size, with the fonts and figures loaded and the scroll at the top. */
async function newPieceAt(browser, width, height) {
  const p = await open(browser, { width, height });
  await newPiece(p);
  await p.waitForLoadState('networkidle');
  await p.evaluate(() => document.fonts.ready);
  await p.locator('.ws-workspace').evaluate(e => { e.scrollTop = 0; });
  return p;
}

/** Fix 11: at 568x320 every square of both boards and Try it are in view with no scroll; 27 px cells; no thermometer,
 * mode line or forward line; the card's header buttons 36 px, its pen, eye and Take-by select 28 px, the rest 44 px. */
async function fix11FullGridLandscape(browser) {
  const p = await newPieceAt(browser, 568, 320);
  for (const selector of [BOARDS.move, BOARDS.take, '#workshop .ws-try']) await insideViewport(p, selector);
  assert.deepEqual(await cellWidths(p), [27], '568x320: every cell is 27 px');
  for (const selector of ['.ws-thermometer', '.ws-pattern .ws-mode', '.ws-pattern .ws-fwd']) {
    assert.equal(await p.locator(selector).filter({ visible: true }).count(), 0, `568x320: ${selector} is hidden`);
  }
  await screenFits(p, '568x320 card');
  await shot(p, '568x320-landscape');
  await p.context().close();
}

/** At a tall size: the card and boards keep their boxes; after a scroll to each board the whole board is in view;
 * Try it is in view; no sideways scroll; cells of 24 px or more. */
async function boardsInView(browser, width, height) {
  const p = await newPieceAt(browser, width, height);
  const before = BEFORE[`${width}x${height}`];
  assert.deepEqual(await roundBox(p, '#workshop .ws-piece-card'), before.card, `${width}x${height}: the card box`);
  for (const [mode, selector] of Object.entries(BOARDS)) assert.deepEqual(await roundBox(p, selector), before[mode], `${width}x${height}: the ${mode} board box`);
  for (const selector of Object.values(BOARDS)) {
    await p.locator(selector).scrollIntoViewIfNeeded();
    await insideViewport(p, selector);
  }
  await insideViewport(p, '#workshop .ws-try');
  await noSidewaysScroll(p);
  await noSidewaysScroll(p, '#workshop .ws-workspace');
  await minTarget(p, '#workshop .ws-cell', 24);
  await p.context().close();
}

/** A turn from 320x568 to 568x320 and back refits the cells with no reload. */
async function turnRefits(browser) {
  const p = await newPieceAt(browser, 320, 568);
  const cellsAre = async (px, what) => {
    try { await p.waitForFunction(n => [...document.querySelectorAll('#workshop .ws-cell')].every(c => c.getBoundingClientRect().width === n), px, { timeout: 2000 }); }
    catch { assert.fail(`${what}: the cells are ${(await cellWidths(p)).join(', ')} px, not ${px} px`); }
  };
  await cellsAre(40, '320x568');
  await p.setViewportSize({ width: 568, height: 320 });
  await cellsAre(27, 'a turn to 568x320');
  await insideViewport(p, BOARDS.take);
  await p.setViewportSize({ width: 320, height: 568 });
  await cellsAre(40, 'a turn back to 320x568');
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
    await blankCast(p, width, height);
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
  for (const [width, height] of viewports) await cardLayout(browser, width, height);
  console.log(`ok the game menu and the card layout at ${viewports.length} sizes`);
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
  await fix2FullShelf(browser);
  await fix4UndoKeysUnderSheet(browser);
  await fix20CopyByHand(browser);
  await fix23KeyboardChoices(browser);
  await fix27PressOnPadding(browser);
  await fix29ToastsClear(browser);
  await fix5StrokeEndsOffBoard(browser);
  await fix6TwoActionChoice(browser);
  await fix9TryKeyboard(browser);
  await fix13SafeRule(browser);
  await fix28LineEdge(browser);
  await fix1RefusedCopyAndDelete(browser);
  await fix8AlwaysReason(browser);
  await fix12OverlapNote(browser);
  await fix19DamagedNote(browser);
  console.log('ok the review fixes 1 (Copy link and Delete under a refused save), 2, 4, 5, 6, 8 (the reason of "Always"), 9, 12 (the overlap note), 13, 19 (the home note), 20, 23, 27, 28 (the lines) and 29');
  await escInPanel(browser);
  await surpriseNoGlow(browser);
  console.log('ok Esc in a choices panel, Surprise me adds no glow');
  await motionSetA(browser);
  console.log('ok motion Set A: one reaction per edit, Undo and rename; stops at the next edit, under reduced motion and Off; ends still by 600 ms (300 ms at Fast)');
  await fix11FullGridLandscape(browser);
  for (const [width, height] of viewports) if (!shortLandscape(width, height)) await boardsInView(browser, width, height);
  await turnRefits(browser);
  console.log('ok the landscape layout: fix 11 (the full grid at 568x320), each board in view at the other sizes, a refit on a turn');
  assertNoErrors();
} finally {
  await browser.close();
}
console.log(`Screens: ${env('PLAYABLE_OUT')}`);
