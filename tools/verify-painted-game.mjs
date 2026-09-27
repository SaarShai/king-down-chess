// Plays real games in the painted 2D look and checks the view keeps up with the game.
// Needs a running build: PLAYABLE_URL=http://127.0.0.1:5189/ node tools/verify-painted-game.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
const url = new URL(process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/');
url.searchParams.set('look', 'painted');
const out = 'docs/painted-game';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
const watch = page => {
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
};
const setSides = (page, white, black) => page.evaluate(([w, b]) => {
  const set = (id, v) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change')); };
  document.getElementById('think').value = '200';
  document.getElementById('skill').value = 'beginner';
  set('white', w); set('black', b);
}, [white, black]);
const plies = page => page.$$eval('#moves li', li => li.map(l => l.textContent.trim().split(/\s+/).slice(1)).flat().length);
try {
  // 1. Computer vs computer: every capture animation must finish and hand the move on.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  watch(page);
  await page.goto(url.href);
  await page.evaluate(() => localStorage.removeItem('kingdown.save'));
  await page.goto(url.href);
  await page.waitForFunction(() => document.getElementById('board').classList.contains('painted') && document.querySelector('#board canvas'));
  await page.click('#new-random');
  await setSides(page, 'ai', 'ai');
  let last = -1, stalls = 0;
  for (let i = 0; i < 90; i++) {
    await page.waitForTimeout(1500);
    const n = await plies(page), over = await page.evaluate(() => document.getElementById('over').open || /wins|draw|Draw|Stalemate/.test(document.getElementById('status').textContent));
    if (over || n >= 60) { console.log(`ok computer game: ${n} plies${over ? ', finished' : ''}`); break; }
    stalls = n === last ? stalls + 1 : 0; last = n;
    assert.ok(stalls < 6, `no progress for 9 s at ply ${n}`);
  }
  const taken = await page.$$eval('#took-w span, #took-b span', s => s.length);
  assert.ok(taken > 0, 'the game included captures');
  await page.screenshot({ path: `${out}/computer-game.png` });
  console.log(`ok ${taken} captures animated`);

  // 1b. Human mouse input: drag a pawn two squares, then click-click a knight or any legal move.
  await setSides(page, 'human', 'ai');
  await page.click('#new-random');
  await page.waitForTimeout(300);
  const at = sq => page.evaluate(sq => window.view.screenOf(sq), sq);
  const e2 = await at(12), e4 = await at(28);
  await page.mouse.move(e2.x, e2.y); await page.mouse.down(); await page.mouse.move(e4.x, e4.y, { steps: 8 }); await page.mouse.up();
  await page.waitForFunction(() => /e2-e4/.test(document.getElementById('moves').textContent), null, { timeout: 5000 });
  await page.waitForFunction(() => document.querySelectorAll('#moves li')[0]?.textContent.trim().split(/\s+/).length >= 3, null, { timeout: 15000 });
  await page.waitForTimeout(2500); // the reply's animation keeps the board busy
  const d2 = await at(11), d3 = await at(19);
  await page.mouse.click(d2.x, d2.y); await page.mouse.click(d3.x, d3.y);
  await page.waitForFunction(() => /d2-d3/.test(document.getElementById('moves').textContent), null, { timeout: 5000 });
  console.log('ok human drag and click-click moves');

  // 2. Human as Black: the board turns round, and Undo during the computer's animation is clean.
  await setSides(page, 'ai', 'human');
  await page.click('#new-random');
  await page.waitForFunction(() => document.querySelectorAll('#moves li').length > 0, null, { timeout: 15000 });
  const a8 = await page.evaluate(() => window.view.screenOf(56)), a1 = await page.evaluate(() => window.view.screenOf(0));
  assert.ok(a8.y > a1.y, 'Black at the bottom when the human plays Black');
  await page.click('#undo');
  await page.waitForTimeout(300);
  console.log('ok flipped board, undo during play');

  // 3. Phone width: the board fits without horizontal scrolling.
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  watch(phone);
  await phone.goto(url.href);
  await phone.waitForFunction(() => document.querySelector('#board canvas')?.clientWidth > 300);
  const fit = await phone.evaluate(() => ({ doc: document.documentElement.scrollWidth, board: document.querySelector('#board canvas').getBoundingClientRect().width }));
  assert.ok(fit.doc <= 390 && fit.board >= 340, JSON.stringify(fit));
  await phone.screenshot({ path: `${out}/phone.png` });
  console.log(`ok phone: board ${Math.round(fit.board)} px`);
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
