// One-screen Workshop check at five viewports: blank cast, the two boards, the rule book, the properties,
// the name, the appearance, the thermometer, Undo, the keyboard, a refused save, share, Try it and reload.
// Run it with `npm run check:browser workshop`. It reads its server, channel and output folder from the
// shared check module (tools/lib/checks.mjs).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertNoErrors, env, imageIs, launch, shot, trapErrors } from './lib/checks.mjs';

const base = env('PLAYABLE_URL');
const cast = JSON.parse(readFileSync(new URL('../docs/visual-design/workshop/cast.json', import.meta.url), 'utf8'));
const viewports = [[320, 568], [390, 844], [568, 320], [768, 1024], [1280, 900]];
const saved = p => p.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop')).designs[0]);
const mark = async p => (await saved(p)).squares[0].mark;
const cell = (p, mode, x = 1, y = 2) => p.locator(`.ws-board[data-action="${mode}"] .ws-cell[data-x="${x}"][data-y="${y}"]`);
const openDialogs = p => p.locator('#workshop dialog[open]').count();

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
  await p.click('.ws-copy-link');
  const link = await p.evaluate(() => navigator.clipboard.readText());
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
  assertNoErrors();
} finally {
  await browser.close();
}
console.log(`Screens: ${env('PLAYABLE_OUT')}`);
