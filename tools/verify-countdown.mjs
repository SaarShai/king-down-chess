// Turn countdowns (src/countdown.ts) in the real page: the ring on the power button, over a piece
// (`?demo=countdown`), by the turn line for a game-wide one, and nothing in a default game. Phone and
// desktop, light and dark. Needs a running build:
//   PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-countdown.mjs   (PLAYABLE_BROWSER=chromium in cloud sessions)
// SHOTS=<dir> also saves a screenshot and a close-up of each case there.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { startGame } from './new-game-ui.mjs';

const base = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const shots = process.env.SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
const sq = name => (name.charCodeAt(1) - 49) * 8 + (name.charCodeAt(0) - 97);
const fen = n => `7k/p7/8/8/8/8/8/R5K1 w - - 0 ${n}`;
/** `q`: an object, or [name, value] pairs for a repeated parameter. */
const url = q => `${base}?${new URLSearchParams(q)}`;

async function open(page, q) {
  await page.goto(url(q));
  await page.waitForFunction(() => window.view && document.querySelector('#board canvas'));
  await page.evaluate(() => window.view.ready());
}
/** The rings matching `sel`, with their labels and boxes. */
const rings = (page, sel) => page.$$eval(sel, es => es.map(e => { const r = e.getBoundingClientRect(); return { label: e.getAttribute('aria-label'), x: r.x, y: r.y, w: r.width, h: r.height }; }));
async function shot(page, name, sel) {
  if (!shots) return;
  await page.screenshot({ path: `${shots}/${name}.png` });
  if (!sel) return;
  const b = await page.$eval(sel, e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const pad = 48, x = Math.max(0, b.x - pad), y = Math.max(0, b.y - pad);
  await page.screenshot({ path: `${shots}/${name}-closeup.png`, clip: { x, y, width: b.w + 2 * pad, height: b.h + 2 * pad } });
}
const noScroll = async page => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll');

try {
  for (const [vw, vh, tag] of [[375, 812, 'phone'], [1280, 800, 'desktop']]) for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: vw, height: vh }, colorScheme: scheme, deviceScaleFactor: shots ? 2 : 1 });
    await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1')); // skip the title screen (main.ts)
    page.on('pageerror', e => { if (!/Failed to fetch/.test(e.message)) errors.push(e.message); });
    page.on('console', m => { if (m.type() === 'error' && !/Failed to fetch/.test(m.text())) errors.push(m.text()); });
    const name = s => `${tag}-${scheme}-${s}`;

    // The default rules: no ring anywhere.
    await open(page, { fen: fen(1), kings: 'flame:haste,none' });
    assert.equal(await page.$$eval('.cd', es => es.length), 0, 'no countdown in a default game');
    assert.equal(await page.$eval('#clocks', e => getComputedStyle(e).display), 'none');

    // The power button: 3 turns, then 1, then none and the button is live.
    for (const [move, n] of [[1, 3], [3, 1]]) {
      await open(page, { kings: 'flame:haste,none', rule: 'fromMove=Haste:4', fen: fen(move) });
      const [r] = await rings(page, '#power-btn .cd');
      assert.equal(r?.label, `Haste usable in ${n} turn${n === 1 ? '' : 's'}`);
      assert.equal(await page.textContent('#power-btn'), 'Use Haste (from move 4)', 'the ring adds no text to the button');
      assert.ok(r.x + r.w <= vw && r.y >= 0, 'the ring is on screen');
      await noScroll(page);
      await shot(page, name(`power-${n}`), '#power-btn');
    }
    await open(page, { kings: 'flame:haste,none', rule: 'fromMove=Haste:4', fen: fen(4) });
    assert.equal((await rings(page, '.cd')).length, 0, 'at 0 the ring is gone');
    assert.equal(await page.isEnabled('#power-btn'), true);

    // Over a piece: the demo shackle on a1's rook, at the top right corner of its square.
    await open(page, { demo: 'countdown', fen: fen(2) });
    const [p] = await rings(page, '#board-marks .cd');
    assert.equal(p?.label, 'Rook unshackled in 3 turns');
    const c = await page.evaluate(s => window.view.screenOf(s), sq('a1')), b1 = await page.evaluate(s => window.view.screenOf(s), sq('b1'));
    const w = b1.x - c.x, mid = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
    assert.ok(mid.x > c.x && mid.x < c.x + w && mid.y < c.y && mid.y > c.y - w, `the ring sits above a1, at its right (${JSON.stringify({ mid, c, w })})`);
    await noScroll(page);
    await shot(page, name('piece-3'), '#board-marks .cd');

    // Game-wide: both sides hold a Rage card (card mode has no screen yet), so one ring by the turn line.
    await open(page, [['rule', 'hands=Rage'], ['rule', 'fromMove=Rage:10'], ['fen', fen(6)]]);
    const g = await rings(page, '#clocks .cd');
    assert.deepEqual(g.map(x => x.label), ['Rage usable in 4 turns']);
    assert.match(await page.textContent('#clocks'), /^Rage$/);
    await noScroll(page);
    await shot(page, name('game-4'), '#clocks');
    console.log(`ok ${tag} ${scheme}`);
    await page.close();
  }

  // New game with `?rule=`: a Flame king with Haste shows it; a move and the computer's reply count one
  // turn; Undo counts it back.
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
  page.on('pageerror', e => { if (!/Failed to fetch/.test(e.message)) errors.push(e.message); });
  await page.goto(base);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}?rule=fromMove=Haste:10`);
  await page.waitForFunction(() => window.view && document.querySelector('#board canvas'));
  await startGame(page, { mode: 'powers', level: 'beginner', side: 'white', kings: ['Flame:Haste', 'Spirit:none'], army: 'classic' });
  await page.waitForFunction(() => document.querySelector('#power-btn .cd')?.getAttribute('aria-label') === 'Haste usable in 9 turns');
  for (const s of ['e2', 'e4']) { const xy = await page.evaluate(q => window.view.screenOf(q), sq(s)); await page.mouse.click(xy.x, xy.y); }
  await page.waitForFunction(() => document.querySelector('#power-btn .cd')?.getAttribute('aria-label') === 'Haste usable in 8 turns', null, { timeout: 20000 });
  await page.waitForFunction(() => !document.getElementById('undo').disabled);
  await page.click('#undo');
  await page.waitForFunction(() => document.querySelector('#power-btn .cd')?.getAttribute('aria-label') === 'Haste usable in 9 turns');
  console.log('ok New game, a turn, Undo');
  assert.deepEqual(errors, []);
  console.log('verify-countdown: all ok');
} finally {
  await browser.close();
}
