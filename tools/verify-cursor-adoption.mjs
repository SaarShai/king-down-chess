/** Production UI acceptance checks for the adopted Cursor work. Uses an isolated browser profile. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { startGame } from './new-game-ui.mjs';

const url = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const out = process.env.PLAYABLE_OUT || 'docs/cursor-recovery/2026-09-24-0213b442/validation';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
await page.addInitScript(() => localStorage.setItem('kingdown.look', 'clay')); // painted is the default look
const errors = [], checks = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(`${m.text()} ${m.location().url}`); });
await page.addInitScript(() => {
  window.audioContexts = 0;
  const Audio = window.AudioContext;
  window.AudioContext = class extends Audio { constructor(...args) { super(...args); window.audioContexts++; } };
  window.searchRequests = [];
  const WorkerClass = window.Worker;
  window.Worker = class extends WorkerClass {
    postMessage(message, ...rest) { window.searchRequests.push(message.opts); return super.postMessage(message, ...rest); }
  };
});
/** Settings controls sit in a dialog: open it, act, close it if still open. New game: tools/new-game-ui.mjs. */
async function ui(action, sel, ...args) {
  const id = await page.evaluate(sel => document.querySelector(sel).closest('dialog')?.id, sel);
  if (id) await page.click(id === 'new-game' ? '#new-game-btn' : '#settings-btn');
  await page[action](sel, ...args);
  if (id && await page.evaluate(id => document.getElementById(id).open, id)) await page.keyboard.press('Escape');
}
async function ready() {
  await page.waitForFunction(() => window.view?.pieces.size > 0);
  await page.evaluate(() => window.view.ready());
  // Tweens advance at most 50 ms a frame, and headless WebGL draws ~20 fps, so the 400 ms Black-view
  // flip outlasts any fixed wait; screenOf() aims at the settled camera only.
  await page.waitForFunction(() => window.view.tweens.list.length === 0);
}
async function seed(fen, settings = {}, query = '') {
  await page.evaluate(({ fen, settings }) => localStorage.setItem('kingdown.save', JSON.stringify({
    back: '', fen, moves: [], white: 'human', black: 'human', think: 800,
    skill: 'club', coords: true, resigned: null, sound: false, queen: false, ...settings,
  })), { fen, settings });
  await page.goto(url + query); await ready();
}
const point = square => page.evaluate(square => window.view.screenOf(square), square);
async function click(square) { const p = await point(square); await page.mouse.click(p.x, p.y); }
async function played(count) {
  await page.waitForFunction(count => JSON.parse(localStorage.getItem('kingdown.save')).moves.length === count, count);
}
async function drag(from, to) {
  const a = await point(from), b = await point(to);
  await page.mouse.move(a.x, a.y); await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
}
try {
  await page.goto(url); await ready();
  const savedSkill = () => page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).skill);
  /** The level New game shows when it opens. */
  const dialogLevel = async () => {
    await page.click('#new-game-btn');
    const level = await page.evaluate(() => document.querySelector('#new-game input[name="level"]:checked')?.value);
    await page.keyboard.press('Escape');
    return level;
  };
  assert.equal(await dialogLevel(), 'club', 'New game offers the Club computer first');
  assert.equal(await savedSkill(), 'club');
  assert.equal(await page.locator('#clock,#time-w,#time-b,#try-these').count(), 0);
  await startGame(page, { mode: 'two', army: 'classic' }); await ready();
  await page.click('#hint');
  await page.waitForFunction(() => window.view.highlights.hint.length > 0 && !document.querySelector('#hint').disabled);
  assert.equal(await page.locator('#moves').innerText(), '');
  assert.ok(await page.evaluate(() => Array.isArray(window.searchRequests.at(-1).history)));
  await click(12); await click(28); await played(1);
  assert.deepEqual(await page.evaluate(() => window.view.highlights.hint), []);
  checks.push('Hint uses history, marks a legal suggestion without playing, and clears on a move');

  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('kingdown.save'));
    delete s.skill; s.sound = false; s.style = 'voxel';
    localStorage.setItem('kingdown.save', JSON.stringify(s));
  });
  await page.reload(); await ready();
  assert.equal(await savedSkill(), 'strong', 'an old save keeps the Strong computer');
  assert.equal(await page.locator('#sound').isChecked(), false);
  await click(52); await click(36); await played(2);
  assert.equal(await page.evaluate(() => window.audioContexts), 0, 'muted reload must not create an audio context');
  await startGame(page, { mode: 'computer', level: 'casual', army: 'classic' }); await ready(); await ui('check', '#queen');
  await page.reload(); await ready();
  assert.equal(await savedSkill(), 'casual');
  assert.equal(await dialogLevel(), 'casual', 'New game remembers the level');
  assert.equal(await page.locator('#queen').isChecked(), true);
  checks.push('old saves retain Strong; the computer level, auto-queen and effective mute survive reload');

  await page.click('#hint'); await startGame(page, { mode: 'two', army: 'classic' }); await ready();
  await page.waitForTimeout(650);
  assert.deepEqual(await page.evaluate(() => window.view.highlights.hint), []);
  assert.equal(await page.locator('#moves').innerText(), '');
  const camera = await page.evaluate(() => window.view.camera.position.toArray());
  await drag(12, 28); await played(1);
  assert.match(await page.locator('#moves').innerText(), /e2-e4/);
  assert.deepEqual(await page.evaluate(() => window.view.camera.position.toArray()), camera);
  await page.click('#undo'); await played(0);
  checks.push('reset cancels a hint; real piece dragging plays through the normal move path without orbiting');

  await seed('7k/4p3/8/8/8/8/P7/K7 b - - 0 1', { white: 'ai', black: 'human' });
  await drag(52, 36);
  await page.waitForFunction(() => document.querySelector('#moves').textContent.includes('e7-e5'));
  await startGame(page, { mode: 'two', army: 'classic' }); await ready();
  await page.waitForTimeout(700); // a stale computer reply would land here
  assert.equal(await page.locator('#moves').innerText(), '');
  assert.ok(await page.evaluate(() => window.view.controls.enabled));
  checks.push('dragging works from the flipped Black view and a new game cancels the pending computer move');

  const promotion = '7k/P7/8/8/8/8/8/K7 w - - 0 1';
  await seed(promotion); await click(48); await click(56);
  await page.locator('#promo').waitFor({ state: 'visible' });
  await page.click('#cancel-promo'); // Cancel keeps the pawn and frees the board
  assert.equal(await page.locator('#promo').isVisible(), false);
  assert.ok(await page.evaluate(() => window.view.pieces.get(48)?.userData.code === 1 && !document.querySelector('#hint').disabled));
  await click(48); await click(56);
  await page.locator('#promo').waitFor({ state: 'visible' });
  await page.locator('#promo button').filter({ hasText: 'rook' }).click(); await played(1);
  assert.equal(await page.evaluate(() => window.view.pieces.get(56)?.userData.code), 4);
  await seed(promotion, { queen: true }); await click(48); await click(56); await played(1);
  assert.equal(await page.locator('#promo').isVisible(), false);
  assert.equal(await page.evaluate(() => window.view.pieces.get(56)?.userData.code), 5);
  await seed(promotion, { queen: true }, '?rules=2017'); await click(48); await click(56);
  await page.locator('#promo').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#promo button').filter({ hasText: 'paladin' }).count(), 1);
  await page.locator('#promo button').filter({ hasText: 'archer' }).click(); await played(1);
  await page.goto(url); await ready();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).rules.promotionSet), 'anyNonKing');
  await startGame(page, { army: 'classic' }); await ready();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).rules.promotionSet), 'standard');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).rules.ogreMode), 'push');
  checks.push('promotion dialog cancels cleanly; underpromotion works; auto-queen respects promotion sets; old games retain their rules and new games use current defaults');

  for (const [query, archer, beast, promotionText] of [
    ['', /only over a piece/, /any adjacent square/, /queen, rook, bishop, or knight/],
    ['?rules=2017', /1 square orthogonally/, /straight ahead/, /any piece but a king/],
    ['?rules=2021', /ahead or back/, /either forward diagonal/, /any piece but a king/],
  ]) {
    await seed('7k/8/8/8/4A3/8/P7/K7 w - - 0 1', {}, query);
    await page.click('#rules-btn');
    assert.match(await page.locator('#rules-rows .piece-card[data-piece="archer"]').innerText(), archer);
    assert.match(await page.locator('#rules-rows .piece-card[data-piece="beast"]').innerText(), beast);
    assert.match(await page.locator('#rules-lead').innerText(), promotionText);
    await page.locator('#rules form button').click();
  }
  checks.push('guide and promotion text follow current, 2017 and 2021 presets');

  await seed('7k/8/8/2p5/2p5/2A5/8/4K3 w - - 0 1'); // the archer shoots c5 over the c4 pawn
  await click(18); await click(34); await played(1);
  assert.match(await page.locator('#moment').innerText(), /archer shot/);
  await page.reload(); await ready();
  assert.match(await page.locator('#moment').innerText(), /archer shot/);
  await page.click('#undo'); await played(0);
  assert.equal(await page.locator('#moment').innerText(), '');
  await click(18); await click(34); await played(1);
  assert.match(await page.locator('#moment').innerText(), /archer shot/);
  checks.push('move explanations reconstruct from saved history and return after undo/replay');

  await startGame(page, { army: 'COAQNRBK' }); await ready();
  assert.match(await page.locator('#moment').innerText(), /Catapult lab/);
  assert.equal(await page.locator('#setup').innerText(), 'COAQNRBK');
  await page.click('#rules-btn');
  assert.equal(await page.locator('#rules-rows .piece-card[data-piece="catapult"]').count(), 1);
  await page.locator('#rules form button').click();
  await seed('7k/8/8/8/8/8/7r/7K w - - 0 1');
  assert.ok(await page.evaluate(() => document.querySelector('#board').classList.contains('king-in-check')
    && window.view.highlights.check === 7 && window.view.markers.children.some(m => m.material.color.getHex() === 0xe02828)));
  checks.push('lab examples are in the New game army list; current pieces enter the guide; check has a visible king ring');

  await seed('7k/8/4p3/8/4p3/8/4C3/K7 w - - 0 1');
  await click(12); await click(44); await played(1);
  assert.ok(await page.evaluate(() => window.view.pieces.has(12) && window.view.pieces.has(28) && !window.view.pieces.has(44)));
  assert.match(await page.locator('#moment').innerText(), /catapult lobbed/);
  await page.click('#undo'); await played(0);
  await click(12); await click(44);
  await page.waitForFunction(() => document.querySelector('#moves').textContent.includes('Ce2*e6'));
  await page.click('#undo'); await played(0); await page.waitForTimeout(700);
  assert.ok(await page.evaluate(() => window.view.pieces.has(44) && window.view.pieces.has(12)));
  checks.push('Catapult lob keeps the shooter and screen; undo during the arc preserves the restored victim');

  await seed('7k/8/4p3/8/3V4/8/P7/K7 w - - 0 1');
  await click(27); await click(44); await click(43); await played(1);
  assert.ok(await page.evaluate(() => window.view.pieces.has(43) && !window.view.pieces.has(27) && !window.view.pieces.has(44)));
  assert.match(await page.locator('#moves').innerText(), /Vd4xe6-d6/);
  assert.match(await page.locator('#moment').innerText(), /reaver captured, then stepped aside/);
  await page.click('#undo'); await played(0);
  await click(27); await click(44); await click(43);
  await page.waitForFunction(() => document.querySelector('#moves').textContent.includes('Vd4xe6-d6'));
  await page.click('#undo'); await played(0); await page.waitForTimeout(700);
  assert.ok(await page.evaluate(() => window.view.pieces.has(27) && window.view.pieces.has(44) && !window.view.pieces.has(43)));
  checks.push('Reaver capture-then-step uses the real selection path and cancels cleanly on undo');

  await startGame(page, { mode: 'two', army: 'classic' }); await ready();
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(250);
  const a = await point(12), b = await point(28);
  const boardBounds = await page.locator('#board').boundingBox();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
  for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + (b.x-a.x)*i/6, y: a.y + (b.y-a.y)*i/6 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await played(1);
  assert.match(await page.locator('#moves').innerText(), /e2-e4/);
  assert.deepEqual(await page.locator('#board').boundingBox(), boardBounds, 'piece guidance must not move the board under a touch gesture');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && window.view.controls.enabled));
  await page.screenshot({ path: out + '/touch-mobile.png' });
  checks.push('real touch events drag a pawn on the mobile layout without horizontal overflow');
  assert.deepEqual(errors, []);
  writeFileSync(out + '/adoption-browser.json', JSON.stringify({ url, checksPassed: checks.length, checks, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ checksPassed: checks.length, checks, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: out + '/adoption-failure.png' });
  console.error({ completed: checks, errors }); throw error;
} finally { await browser.close(); }
