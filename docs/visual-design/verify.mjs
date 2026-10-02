// Checks the visual design pass in a real browser: title screen, keyboard play, move announcements,
// Show threats, refusal messages, piece cards and phone tap targets.
// Needs a running build: PLAYABLE_URL=http://127.0.0.1:5189/ PLAYABLE_BROWSER=chromium node docs/visual-design/verify.mjs
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [], checks = [];
const ok = msg => { checks.push(msg); console.log(`ok ${msg}`); };
const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

async function open(query = '', { skipTitle = true, save = null, viewport = { width: 1280, height: 900 }, touch = false } = {}) {
  const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch });
  await ctx.addInitScript(([skip, s]) => {
    if (skip) sessionStorage.setItem('kingdown.title-seen', '1');
    if (s && !sessionStorage.getItem('seeded')) { localStorage.setItem('kingdown.save', JSON.stringify(s)); sessionStorage.setItem('seeded', '1'); }
  }, [skipTitle, save]);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', d => d.accept());
  await page.goto(base + query);
  await page.waitForFunction(() => window.view?.ready);
  return page;
}
const ready = page => page.waitForFunction(() => window.view?.ready).then(() => page.evaluate(() => window.view.ready()));
const tap = async (page, sq) => { const p = await page.evaluate(s => window.view.screenOf(s), sq); await page.mouse.click(p.x, p.y); };
const titleOpen = page => page.evaluate(() => !!document.querySelector('#title-screen[open]'));
const help = page => page.locator('#move-help').innerText();

try {
  // 1. Title screen: a first visit leads with the lessons.
  let page = await open('', { skipTitle: false });
  assert.equal(await titleOpen(page), true, 'title on a first visit');
  assert.equal(await page.locator('#title-first').isVisible(), true);
  assert.equal(await page.locator('#title-continue').isVisible(), false, 'no Continue without a saved game');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'title-learn', 'Learn has the focus on a first visit');
  await page.click('#title-learn');
  await page.waitForFunction(() => /Lesson 1 of 6/.test(document.getElementById('turn').textContent));
  assert.equal(await page.locator('#lesson-progress span').count(), 6);
  await page.reload(); await ready(page);
  assert.equal(await titleOpen(page), false, 'once per tab: a reload goes straight to the game');
  ok('title: first visit points to the lessons, Learn starts lesson 1, a reload skips the title');
  await page.context().close();

  // Returning player: Continue resumes the saved game; Play opens New game.
  const save = { back: 'RNBQKBNR', fen: START, moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', sound: false };
  page = await open('', { skipTitle: false, save });
  assert.equal(await page.locator('#title-continue').isVisible(), true);
  assert.match(await page.locator('#title-continue').innerText(), /Continue · move 2/);
  assert.equal(await page.locator('#title-first').isVisible(), false);
  await page.click('#title-continue');
  assert.equal(await titleOpen(page), false);
  assert.match(await page.locator('#moves').innerText(), /e2-e4/);
  await page.context().close();
  page = await open('', { skipTitle: false, save });
  await page.click('#title-play');
  await page.waitForFunction(() => document.getElementById('new-game').open);
  await page.context().close();
  ok('title: Continue resumes the saved game, Play opens New game');

  for (const q of ['?fen=' + encodeURIComponent(START), '?army=RNBQKBNR&moves=e2-e4', '?title=0']) {
    page = await open(q, { skipTitle: false });
    assert.equal(await titleOpen(page), false, `no title for ${q}`);
    await page.context().close();
  }
  ok('title: never over ?fen=, a game link, or ?title=0');

  // 2. Keyboard play and announcements: Tab to the board, arrows and Enter play e2-e4; both sides are announced.
  page = await open('?fen=' + encodeURIComponent(START));
  await ready(page);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'board');
  assert.equal(await page.locator('#board-marks .mk-cursor').count(), 1, 'the cursor shows');
  assert.match(await page.locator('#cursor-say').textContent(), /^e2, white pawn/);
  await page.keyboard.press('Enter');
  assert.match(await page.locator('#cursor-say').textContent(), /e2 selected\. It can go to e3, e4/);
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp');
  assert.match(await page.locator('#cursor-say').textContent(), /^e4, empty, can go here/);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => /e2-e4/.test(document.getElementById('moves').textContent));
  assert.match(await page.locator('#announce').textContent(), /^White pawn e2 to e4\./);
  await page.waitForFunction(() => /^Black /.test(document.getElementById('announce').textContent), null, { timeout: 20000 });
  ok(`keyboard: Tab, arrows and Enter play e2-e4; announced "White pawn e2 to e4." then "${await page.locator('#announce').textContent()}"`);
  // The move list is a row of buttons: Tab reaches them, Enter opens the review.
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save') || '{}').moves?.length === 2); // the reply has finished
  const first = page.locator('#moves [data-ply="1"]');
  await first.focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => /Reviewing after 1\. e2-e4/.test(document.getElementById('turn').textContent));
  await page.keyboard.press('Escape');
  ok('keyboard: a move in the list is a button; Enter opens its review');
  // A mouse tap focuses the board without the cursor, so ← still steps back through the moves.
  await tap(page, 0); await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => /^Reviewing/.test(document.getElementById('turn').textContent));
  assert.equal(await page.locator('#board-marks .mk-cursor').count(), 0);
  await page.keyboard.press('Escape');
  ok('mouse: after a tap on the board, ← still opens the review (no cursor)');
  await page.context().close();

  // 3. Show threats: a rook on d5 attacks the knight on d2 and covers 12 empty squares; its king 3 more.
  page = await open('?fen=' + encodeURIComponent('4k3/8/8/3r4/8/8/3N4/4K3 w - - 0 1'));
  await ready(page);
  assert.equal(await page.locator('#board-marks i').count(), 0, 'off by default');
  await page.click('#settings-btn'); await page.check('#threats'); await page.keyboard.press('Escape');
  assert.equal(await page.locator('#board-marks .mk-threat').count(), 1);
  assert.equal(await page.locator('#board-marks .mk-cover').count(), 15);
  const ring = await page.locator('#board-marks .mk-threat').boundingBox(), d2 = await page.evaluate(() => window.view.screenOf(11));
  assert.ok(Math.abs(ring.x + ring.width / 2 - d2.x) < 2 && Math.abs(ring.y + ring.height / 2 - d2.y) < 2, 'the ring sits on d2');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')).threats), true, 'the choice is saved');
  ok('Show threats: off by default; marks the attacked knight and 15 covered squares; saved');
  await page.context().close();

  // 4. Refusals say why.
  page = await open('?fen=' + encodeURIComponent('4k3/4r3/8/8/8/8/4B3/4K3 w - - 0 1'));
  await ready(page);
  await tap(page, 52); assert.match(await help(page), /That is Black's rook\. White to move/);
  await tap(page, 12); assert.match(await help(page), /This bishop has no legal move/);
  await tap(page, 19); assert.match(await help(page), /that bishop move would leave your king in check/);
  await page.context().close();
  page = await open('?fen=' + encodeURIComponent('4k3/8/8/g7/8/8/8/R3K3 w - - 0 1'));
  await ready(page);
  await tap(page, 0); await tap(page, 32); assert.match(await help(page), /a guard can only be taken by a king/);
  await tap(page, 0); await tap(page, 9); assert.match(await help(page), /the rook cannot reach b2/);
  ok('refusals: enemy piece, no legal move, pinned, guard, unreachable square');
  await page.context().close();

  // 5. Guide cards carry painted art; promotion shows figures.
  page = await open('?fen=' + encodeURIComponent('7k/P7/8/8/8/8/8/K7 w - - 0 1'));
  await ready(page);
  await page.click('#rules-btn');
  const cards = page.locator('#rules-rows .piece-card');
  assert.ok(await cards.count() >= 12);
  const loaded = await page.$$eval('#rules-rows img', imgs => Promise.all(imgs.map(i => i.decode().then(() => i.naturalWidth > 0, () => false))));
  assert.ok(loaded.length >= 12 && loaded.every(Boolean), 'every card figure loads');
  await page.locator('#rules form button').click();
  await tap(page, 48); await tap(page, 56);
  await page.locator('#promo').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#promo-choices img').count(), 4);
  ok(`Guide: ${await cards.count()} piece cards, ${loaded.length} painted figures loaded; promotion shows figures`);
  await page.context().close();

  // 6. Phone: tap targets of at least 44 px, no sideways scroll.
  page = await open('', { viewport: { width: 390, height: 844 }, touch: true, save });
  await ready(page);
  const small = async scope => page.$$eval(`${scope} button, ${scope} select, ${scope} label`, els => els
    .filter(e => e.offsetParent && getComputedStyle(e).visibility !== 'hidden')
    .map(e => ({ id: e.id || e.textContent.trim().slice(0, 24), r: e.getBoundingClientRect() }))
    .filter(({ r }) => r.height < 44 || r.width < 44)
    .map(({ id, r }) => `${id} ${Math.round(r.width)}×${Math.round(r.height)}`));
  assert.deepEqual(await small('#panel'), []);
  for (const [btn, dlg] of [['#new-game-btn', '#new-game'], ['#settings-btn', '#settings'], ['#rules-btn', '#rules']]) {
    await page.click(btn); assert.deepEqual(await small(dlg), [], dlg); await page.keyboard.press('Escape');
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  ok('phone: every visible control in the panel, New game, Settings and Guide is at least 44 px');
  await page.context().close();

  assert.deepEqual(errors, []);
  writeFileSync(new URL('./checks.json', import.meta.url), JSON.stringify({ url: base, checksPassed: checks.length, checks, errors }, null, 2) + '\n');
} finally { await browser.close(); }
