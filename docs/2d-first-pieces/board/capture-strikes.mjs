// Contact sheets for the Bishop dagger slash and Paladin hammer smash, driven by
// a fake clock so every frame is exact. Run with the 5192 study server up:
//   node docs/2d-first-pieces/board/capture-strikes.mjs
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const dir = new URL('./strikes/', import.meta.url);
const url = process.env.STUDY_URL || 'http://127.0.0.1:5192/board/';
const cases = [
  { name: 'bishop-ivory', layout: 'bishop', from: null, to: 'e2', times: [0, 250, 420, 470, 494, 520, 600, 800, 1150], status: 'Ivory Bishop captured on e2.', counts: ['4', '3'] },
  { name: 'bishop-charcoal', layout: 'bishop', from: 'f5', to: 'c2', times: [0, 250, 420, 470, 494, 520, 600, 800, 1150], status: 'Charcoal Bishop captured on c2.', counts: ['3', '4'] },
  { name: 'paladin-ivory-pawn', layout: 'paladin', from: null, to: 'g4', times: [0, 240, 480, 700, 800, 860, 880, 960, 1100, 1550], status: 'Ivory Paladin captured on g4.', counts: ['6', '5'] },
  { name: 'paladin-charcoal-both', layout: 'paladin', from: 'f5', to: 'f2', times: [0, 240, 480, 700, 800, 860, 880, 960, 1100, 1550], status: /Both the Paladin and the target are removed/, counts: ['5', '5'] }
,
  { name: 'rook-ivory', layout: 'rook', from: null, to: 'c7', times: [0, 350, 540, 620, 700, 820, 900, 980, 1500], status: 'Ivory Rook captured on c7.', counts: ['4', '3'] },
  { name: 'queen-ivory', layout: 'queen', from: null, to: 'g4', times: [0, 200, 400, 600, 780, 900, 1000, 1150, 1400], status: 'Ivory Queen captured on g4.', counts: ['5', '3'] },
  { name: 'king-ivory', layout: 'king', from: null, to: 'c5', times: [0, 400, 560, 660, 720, 800, 900, 1150], status: 'Ivory King captured on c5.', counts: ['4', '3'] },
  { name: 'beast-chain-ivory', layout: 'beast', from: 'd4', to: 'e6', choice: 'Chain d5 → e6 → f5', times: [0, 250, 330, 380, 420, 480, 560, 900, 1880], status: /chained d5 → e6 → f5/, counts: ['5', '2'] }
  ,{ name: 'beast-bite-charcoal', layout: 'beast', from: 'f5', to: 'e4', choice: 'Capture e4', times: [0, 250, 300, 340, 370, 400, 450, 520, 760], status: 'Charcoal Beast captured on e4.', counts: ['4', '5'] }
];
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
  await page.addInitScript(() => {
    let T = 1e6, queue = [];
    performance.now = () => T;
    window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
    window.__step = to => { T = to; const q = queue; queue = []; q.forEach(f => f(T)); };
    window.__now = () => T;
  });
  for (const c of cases) {
    await page.goto(`${url}?position=${c.layout}`);
    await page.waitForFunction(() => !/Loading/.test(document.getElementById('status').textContent));
    await page.evaluate(() => window.__step(window.__now()));
    if (c.from) await page.click(`[data-square=${c.from}]`);
    await page.evaluate(() => window.__step(window.__now()));
    const start = await page.evaluate(() => window.__now());
    if (c.choice) await page.click(`#choices button:has-text("${c.choice}")`); else await page.click(`[data-square=${c.to}]`);
    const centre = sq => ({ x: 32 + ('abcdefgh'.indexOf(sq[0]) + .5) * 112, y: 32 + (8 - Number(sq[1]) + .5) * 112 });
    const a = centre(c.from || 'c4'), b = centre(c.to || c.from), crop = [Math.max(0, Math.min(660, b.x - 150)), Math.max(0, Math.min(660, b.y - 190))];
    const png = await page.evaluate(({ times, start, crop }) => {
      const scene = document.getElementById('scene'), w = 300, h = 300, cols = 5;
      const out = document.createElement('canvas'); out.width = w * cols; out.height = h * Math.ceil(times.length / cols);
      const o = out.getContext('2d');
      times.forEach((t, i) => {
        window.__step(start + t);
        o.drawImage(scene, crop[0], crop[1], w, h, i % cols * w, Math.floor(i / cols) * h, w, h);
        o.fillStyle = '#000'; o.font = '12px sans-serif'; o.fillText(`${t} ms`, i % cols * w + 4, Math.floor(i / cols) * h + 14);
      });
      return out.toDataURL('image/png');
    }, { times: c.times, start, crop });
    assert.ok(png, `${c.name}: frames captured`);
    writeFileSync(new URL(`${c.name}.png`, dir), Buffer.from(png.split(',')[1], 'base64'));
    await page.evaluate(start => window.__step(start + 6000), start);
    const status = await page.textContent('#status');
    if (c.status instanceof RegExp) assert.match(status, c.status); else assert.equal(status, c.status);
    assert.deepEqual([await page.textContent('#white-count'), await page.textContent('#black-count')], c.counts, `${c.name}: counts`);
    console.log(`ok ${c.name}: ${status}`);
  }
  // Undo mid-strike cancels without a late capture, for both new strikes.
  for (const [layout, to, counts] of [['bishop', 'e2', ['4', '4']], ['paladin', 'g4', ['6', '6']]]) {
    await page.goto(`${url}?position=${layout}`);
    await page.waitForFunction(() => !/Loading/.test(document.getElementById('status').textContent));
    await page.evaluate(() => window.__step(window.__now()));
    const start = await page.evaluate(() => window.__now());
    await page.click(`[data-square=${to}]`);
    await page.evaluate(start => window.__step(start + 900), start);
    await page.click('#undo');
    await page.evaluate(start => window.__step(start + 6000), start);
    assert.equal(await page.textContent('#status'), 'Action canceled. The position is unchanged.');
    assert.deepEqual([await page.textContent('#white-count'), await page.textContent('#black-count')], counts);
    console.log(`ok ${layout} undo mid-strike`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
