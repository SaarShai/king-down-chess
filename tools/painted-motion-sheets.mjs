// Frame sheets for the painted look's quiet moves, the selected figure's idle and the board's
// atmosphere (docs/painted-motion/). Serves docs/ itself and drives a fake clock, so every frame is exact:
//   PLAYABLE_BROWSER=chromium node tools/painted-motion-sheets.mjs
// Checks: each gait ends exactly on the still position (pixel-identical), stays under 500 ms, and
// with liveliness off the scene still plays the plain slide.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAITS, GAIT_OF, IDLE } from '../docs/2d-first-pieces/board/gait.mjs';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const out = join(root, 'painted-motion');
mkdirSync(join(out, 'quiet'), { recursive: true });
const types = { 'text/javascript': ['.js', '.mjs'], 'text/html': ['.html'], 'image/webp': ['.webp'], 'image/png': ['.png'], 'application/json': ['.json'], 'text/css': ['.css'] };
const mime = ext => Object.entries(types).find(([, e]) => e.includes(ext))?.[0] ?? 'application/octet-stream';
const server = createServer(async (req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(root)) { res.writeHead(403).end(); return; }
  try { const body = await readFile(path); res.writeHead(200, { 'content-type': mime(extname(path)) }).end(body); } catch { res.writeHead(404).end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.on('listening', r));
const base = `http://127.0.0.1:${server.address().port}/painted-motion/harness.html`;

// One quiet move per figure; each army moves its own way (Charcoal from the top of the board).
const NAMES = { K: 'king', S: 'beast', Q: 'queen', L: 'paladin', M: 'maester', P: 'pawn', A: 'archer', O: 'ogre', N: 'knight', B: 'bishop', R: 'rook', G: 'guard' };
const cases = [
  ['K', ['d4', 'e4'], ['e5', 'd5']], ['G', ['d4', 'e4'], ['e5', 'd5']], ['M', ['d4', 'e4'], ['e5', 'd5']],
  ['O', ['d4', 'e4'], ['e5', 'd5']], ['S', ['d4', 'e5'], ['e5', 'd4']], ['A', ['d4', 'e4'], ['e5', 'd5']],
  ['R', ['b4', 'e4'], ['g5', 'd5']], ['B', ['c3', 'f6'], ['f6', 'c3']], ['Q', ['c4', 'f4'], ['f5', 'c5']],
  ['P', ['d2', 'd4'], ['e7', 'e6']], ['N', ['c3', 'e4'], ['f6', 'd5']], ['L', ['c3', 'f3'], ['f6', 'c6']],
];
const COLS = 9, CW = 260, CH = 250;
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [], report = [];
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 1024 } });
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
  await page.goto(base);
  await page.evaluate(() => window.harness.ready);
  const step = t => page.evaluate(t => window.__step(t), t);
  const pixels = () => page.evaluate(() => { const c = document.getElementById('scene'); return c.toDataURL('image/png'); });

  for (const [t, ...moves] of cases) {
    const name = NAMES[t], gait = GAIT_OF[name];
    const rows = [];
    for (const side of [0, 1]) {
      const [from, to] = moves[side];
      await page.evaluate(([from, t, side]) => window.harness.setup([[from, t, side]], { moves: true, atmosphere: true }), [from, t, side]);
      const start = await page.evaluate(() => window.__now()); await step(start);
      const move = await page.evaluate(([from, to]) => window.harness.play(from, to), [from, to]);
      const squares = Math.max(Math.abs((move.to & 7) - (move.from & 7)), Math.abs((move.to >> 3) - (move.from >> 3)));
      // Knight and Paladin keep their own leap and charge (durations from their motion modules).
      const duration = gait ? GAITS[gait].duration(squares) : null;
      if (gait) assert.ok(duration <= 500, `${name}: ${duration} ms`);
      const span = duration ?? 1000, times = Array.from({ length: COLS }, (_, i) => Math.round(span * i / (COLS - 1)));
      const a = await page.evaluate(sq => window.harness.foot(sq), from), b = await page.evaluate(sq => window.harness.foot(sq), to);
      const crop = { x: Math.max(0, Math.min(960 - CW, (a.x + b.x) / 2 - CW / 2)), y: Math.max(0, Math.min(1024 - CH, Math.max(a.y, b.y) - CH + 40)) };
      if (Math.abs(a.y - b.y) > 120) crop.y = Math.max(0, Math.min(1024 - CH, (a.y + b.y) / 2 - CH / 2 - 30));
      if (Math.abs(a.x - b.x) > CW - 60 || Math.abs(a.y - b.y) > CH - 60) Object.assign(crop, { w: Math.abs(a.x - b.x) + 160, h: Math.abs(a.y - b.y) + 200, x: Math.min(a.x, b.x) - 80, y: Math.min(a.y, b.y) - 150 });
      const row = await page.evaluate(({ times, start, crop, CW, CH }) => {
        const scene = document.getElementById('scene'), w = crop.w ?? CW, h = crop.h ?? CH;
        return times.map(t => { window.__step(start + t); const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d'); const k = Math.min(CW / w, CH / h); g.fillStyle = '#e6e1cf'; g.fillRect(0, 0, CW, CH); g.drawImage(scene, crop.x, crop.y, w, h, (CW - w * k) / 2, (CH - h * k) / 2, w * k, h * k); return c.toDataURL('image/png'); });
      }, { times, start, crop, CW, CH });
      await step(start + (duration ?? 4000) + 50);
      assert.equal(await page.evaluate(() => window.harness.scene.animating), false, `${name}: finished`);
      const ended = await pixels();
      // The last frame equals the plain still of the new position.
      await page.evaluate(([to, t, side]) => window.harness.setup([[to, t, side]], { moves: true, atmosphere: true }), [to, t, side]);
      await step(start + (duration ?? 4000) + 60);
      assert.equal(await pixels(), ended, `${name} ${['ivory', 'charcoal'][side]}: the move ends on the still position`);
      rows.push({ times, row, label: `${['Ivory', 'Charcoal'][side]} ${name} ${from}-${to}` });
      report.push({ piece: name, side: ['ivory', 'charcoal'][side], move: `${from}-${to}`, gait: gait ?? (t === 'N' ? 'leap (unchanged)' : 'charge (unchanged)'), ms: duration });
    }
    const png = await page.evaluate(({ rows, COLS, CW, CH, title }) => new Promise(async done => {
      const head = 26, sheet = document.createElement('canvas'); sheet.width = COLS * CW; sheet.height = rows.length * (CH + head);
      const g = sheet.getContext('2d'); g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, sheet.width, sheet.height);
      for (const [r, { times, row, label }] of rows.entries()) {
        g.fillStyle = '#222'; g.font = 'bold 15px sans-serif'; g.fillText(`${label} · ${title}`, 6, r * (CH + head) + 18);
        for (const [i, src] of row.entries()) {
          const img = new Image(); img.src = src; await img.decode();
          g.drawImage(img, i * CW, r * (CH + head) + head); g.fillStyle = '#000'; g.font = '12px sans-serif'; g.fillText(`${times[i]} ms`, i * CW + 4, r * (CH + head) + head + 14);
          g.strokeStyle = '#0003'; g.strokeRect(i * CW + .5, r * (CH + head) + head + .5, CW - 1, CH - 1);
        }
      }
      done(sheet.toDataURL('image/webp', .86));
    }), { rows, COLS, CW, CH, title: gait ?? (t === 'N' ? 'leap (unchanged)' : 'charge (unchanged)') });
    writeFileSync(join(out, 'quiet', `${name}.webp`), Buffer.from(png.split(',')[1], 'base64'));
    console.log(`ok ${name}: ${gait ?? 'own move'}${gait ? ` ${rows.map(r => r.times.at(-1)).join('/')} ms` : ''}, ends on the still`);
  }

  // Liveliness off (the trial and the trailer): a quiet move is the plain 420 ms slide with no gait.
  await page.evaluate(() => window.harness.setup([['d4', 'K', 0]]));
  let start = await page.evaluate(() => window.__now()); await step(start);
  await page.evaluate(() => window.harness.play('d4', 'e4'));
  await step(start + 300); assert.equal(await page.evaluate(() => window.harness.scene.animating), true);
  await step(start + 430); assert.equal(await page.evaluate(() => window.harness.scene.animating), false, 'plain slide: 420 ms');
  console.log('ok liveliness off: plain slide');

  // Idle: the selected figure breathes; frames over one period. With idle off it stays still.
  const idleFrames = await page.evaluate(async ({ IDLE }) => {
    const h = window.harness, out = [];
    for (const lively of [{ idle: true, atmosphere: true }, { idle: false, atmosphere: true }]) {
      h.setup([['d4', 'K', 0], ['e4', 'Q', 1], ['c4', 'P', 0]], lively); const start = window.__now(); window.__step(start); h.select('d4');
      const shots = [];
      for (let i = 0; i < 7; i++) { await new Promise(r => setTimeout(r, 50)); const t = IDLE.fadeIn + i * IDLE.period / 6; window.__step(start + t); const c = document.createElement('canvas'); c.width = 200; c.height = 230; c.getContext('2d').drawImage(document.getElementById('scene'), 380, 350, 200, 230, 0, 0, 200, 230); shots.push({ t, src: c.toDataURL('image/png') }); }
      out.push(shots);
    }
    return out;
  }, { IDLE });
  assert.notEqual(idleFrames[0][0].src, idleFrames[0][3].src, 'idle: the selected figure moves');
  assert.ok(idleFrames[1].every(f => f.src === idleFrames[1][0].src), 'idle off: the selected figure is still');
  const idlePng = await page.evaluate(frames => new Promise(async done => {
    const sheet = document.createElement('canvas'); sheet.width = frames.length * 200; sheet.height = 230 + 22; const g = sheet.getContext('2d');
    g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, sheet.width, sheet.height); g.fillStyle = '#222'; g.font = 'bold 14px sans-serif'; g.fillText('Selected Ivory King d4: idle breath, one 2.4 s period', 6, 16);
    for (const [i, f] of frames.entries()) { const img = new Image(); img.src = f.src; await img.decode(); g.drawImage(img, i * 200, 22); g.fillStyle = '#000'; g.font = '12px sans-serif'; g.fillText(`${Math.round(f.t)} ms`, i * 200 + 4, 36); }
    done(sheet.toDataURL('image/webp', .86));
  }), idleFrames[0]);
  writeFileSync(join(out, 'idle.webp'), Buffer.from(idlePng.split(',')[1], 'base64'));
  console.log('ok idle: breathes when on, still when off');

  // Atmosphere: the starting armies with it off and on, from White's and from Black's side.
  const army = [...'RNBQKBNR'].flatMap((t, i) => [['abcdefgh'[i] + '1', t, 0], ['abcdefgh'[i] + '2', 'P', 0], ['abcdefgh'[i] + '8', t, 1], ['abcdefgh'[i] + '7', 'P', 1]]);
  army.push(['e4', 'A', 0], ['d5', 'S', 1], ['c3', 'G', 0], ['f6', 'O', 1], ['d3', 'M', 0], ['e6', 'L', 1]);
  for (const flipped of [false, true]) {
    for (const atmosphere of [false, true]) {
      await page.evaluate(([army, atmosphere, flipped]) => window.harness.setup(army, { atmosphere }, flipped), [army, atmosphere, flipped]);
      start = await page.evaluate(() => window.__now()); await step(start + 1);
      const file = join(out, `board-${atmosphere ? 'atmosphere' : 'plain'}${flipped ? '-black' : ''}.webp`);
      const webp = await page.evaluate(() => document.getElementById('scene').toDataURL('image/webp', .9));
      writeFileSync(file, Buffer.from(webp.split(',')[1], 'base64'));
    }
  }
  console.log('ok board stills: plain and atmosphere, both sides');
  // In the game (needs a build: PLAYABLE_URL=http://127.0.0.1:5189/): desktop and 390 px phone, a piece
  // selected, from White's side and from Black's.
  if (process.env.PLAYABLE_URL) {
    for (const [name, viewport, black] of [['desktop', { width: 1280, height: 900 }, false], ['phone', { width: 390, height: 844 }, false], ['phone-black', { width: 390, height: 844 }, true]]) {
      const game = await browser.newPage({ viewport, deviceScaleFactor: name === 'desktop' ? 1 : 2 });
      game.on('pageerror', e => errors.push(`game: ${e.message}`));
      const u = new URL(process.env.PLAYABLE_URL); u.searchParams.set('look', 'painted');
      u.searchParams.set('fen', black ? 'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b - - 1 2' : 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w - - 0 2');
      await game.goto(u.href);
      await game.waitForFunction(() => window.view?.pos?.board[4] > 0);
      if (black) await game.evaluate(() => { const set = (id, v) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change')); }; set('white', 'human'); set('black', 'human'); window.view.flip(true); });
      await game.evaluate(() => window.view.ready());
      const sq = black ? 57 : 6, p = await game.evaluate(sq => window.view.screenOf(sq), sq);
      await game.mouse.click(p.x, p.y); await game.waitForTimeout(900);
      await game.screenshot({ path: join(out, `game-${name}.jpg`), type: 'jpeg', quality: 88 });
      assert.equal(await game.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}: no sideways scroll`);
      await game.close();
    }
    console.log('ok game screenshots: desktop, phone, phone as Black');
  }
  writeFileSync(join(out, 'quiet-moves.json'), JSON.stringify(report, null, 1) + '\n');
  assert.deepEqual(errors, []);
} finally { await browser.close(); server.close(); }
