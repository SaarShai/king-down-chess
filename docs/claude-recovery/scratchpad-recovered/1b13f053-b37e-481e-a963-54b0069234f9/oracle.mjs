// Print the raw end state of the same move under default rules and under ?rules=2017.
import { createRequire } from 'node:module';
const require = createRequire('/Users/za/Documents/king down chess/package.json');
const { chromium } = require('playwright');
const PAWN = '7k/7p/8/3p4/3L4/8/8/K6R w - - 0 1';
const KNIGHT = '7k/7p/8/3n4/3L4/8/8/K6R w - - 0 1';
const sqOf = n => (('abcdefgh'.indexOf(n[0])) | ((+n[1] - 1) << 3));
const browser = await chromium.launch();

async function play(query) {
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://localhost:5223/' + query);
  await page.waitForFunction(() => window.view && document.getElementById('setup').title.length > 5, null, { timeout: 30000 });
  await page.evaluate(() => {
    document.getElementById('white').value = 'human';
    document.getElementById('black').value = 'human';
    document.getElementById('black').dispatchEvent(new Event('change'));
    const d = window.view.debris, orig = d.burst.bind(d);
    window.__bursts = 0; d.burst = (...a) => { window.__bursts++; return orig(...a); };
  });
  for (const name of ['d4', 'd5']) {
    const pt = await page.evaluate(s => window.view.screenOf(s), sqOf(name));
    for (const dy of [0, -18, -34]) {
      await page.mouse.move(pt.x, pt.y + dy);
      await page.waitForTimeout(60);
      if (await page.evaluate(() => document.getElementById('hover').textContent) === name) { await page.mouse.click(pt.x, pt.y + dy); break; }
    }
  }
  // refresh() publishes the FEN/move list before the animation; only the autosave means "settled".
  await page.waitForFunction(() => (JSON.parse(localStorage.getItem('kingdown.save') || '{}').moves || []).length === 1, null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  const s = await page.evaluate(() => ({
    fen: document.getElementById('setup').title,
    moves: document.getElementById('moves').textContent.trim(),
    whiteTook: document.getElementById('took-w').textContent,
    blackTook: document.getElementById('took-b').textContent,
    bursts: window.__bursts,
    scene: [...window.view.pieces].map(([sq, g]) => 'abcdefgh'[sq & 7] + ((sq >> 3) + 1) + ':' + g.userData.code).sort().join(' '),
    infoPaladin: (() => { const el = document.getElementById('info'); return el.textContent; })(),
  }));
  console.log(query || '(default)', JSON.stringify({ ...s, errs }, null, 1));
  await page.context().close();
}

await play('?fen=' + encodeURIComponent(PAWN));
await play('?rules=2017&fen=' + encodeURIComponent(PAWN));
await play('?fen=' + encodeURIComponent(KNIGHT));
await browser.close();
