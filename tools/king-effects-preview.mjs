// Preview of the six kings' board effects (docs/2d-first-pieces/board/king-effects.mjs) for the owner:
//   PLAYABLE_BROWSER=chromium node tools/king-effects-preview.mjs <out-dir> [--quick]
// Writes into <out-dir>:
//   kfx-preview.html      docs/king-effects/preview.html as one self-contained file (art inlined; opens from disk)
//   <king>.mp4, <king>.webp  one loop period (two in the MP4) of each king's panel, at desktop game size on a
//                         2× screen (1.6 px per board unit; the game draws 1.75), 25 frames a second; the WebP loops forever
//   <king>-sheet.png      six frames of that loop, both armies
//   <king>-capture.mp4, .webp, -sheet.png  that king's captures one after another (both armies, a pawn and a
//                         knight; Shadow also Death Touch), at Normal speed
//   pawns-idle.mp4, .webp  the whole board over one loop of the resting pawns' timetable (12.8 s)
//   board.png             the whole board, Spirit (White) against Shadow (Black)
// A fake clock drives every frame, so each recording is exact and loops without a seam. --quick: sheets only;
// --page: only the HTML file.
import { chromium } from 'playwright';
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { extname, join, normalize, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERIOD } from '../docs/2d-first-pieces/board/king-effects.mjs';
import { LOOP as PAWN_LOOP } from '../docs/2d-first-pieces/lance/idle.mjs';

const out = resolve(process.argv[2] ?? 'kfx-shots'), quick = process.argv.includes('--quick'), pageOnly = process.argv.includes('--page');
const docs = fileURLToPath(new URL('../docs/', import.meta.url)), repo = fileURLToPath(new URL('../', import.meta.url));
await mkdir(out, { recursive: true });

// 1. One file: bundle preview.mjs, inline every `new URL('<file>', import.meta.url)` asset as a data URL.
const inline = {
  name: 'inline-assets',
  setup(b) {
    b.onLoad({ filter: /\.mjs$/ }, async args => {
      let text = await readFile(args.path, 'utf8');
      const urls = [...text.matchAll(/new URL\('([^']+\.(?:webp|png))',import\.meta\.url\)/g)];
      for (const [whole, rel] of urls) {
        const file = join(dirname(args.path), rel), mime = extname(rel) === '.png' ? 'image/png' : 'image/webp';
        text = text.replace(whole, `new URL(${JSON.stringify(`data:${mime};base64,${(await readFile(file)).toString('base64')}`)})`);
      }
      return { contents: text, loader: 'js' };
    });
  },
};
const bundle = await build({ entryPoints: [join(docs, 'king-effects/preview.mjs')], bundle: true, format: 'esm', write: false, minify: true, plugins: [inline], logLevel: 'silent' });
const page = (await readFile(join(docs, 'king-effects/preview.html'), 'utf8'))
  .replace('<script type="module" src="./preview.mjs"></script>', () => `<script type="module">${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script>`);
await writeFile(join(out, 'kfx-preview.html'), page);
console.log(`kfx-preview.html ${(page.length / 1e6).toFixed(1)} MB`);
if (pageOnly) process.exit(0);

// 2. Recordings from the repo's own page, served from the repo (the title's art is in public/).
const mime = ext => ({ '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' })[ext] ?? 'application/octet-stream';
const server = createServer(async (req, res) => {
  const path = normalize(join(repo, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(repo)) { res.writeHead(403).end(); return; }
  let body; try { body = await readFile(path); } catch { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': mime(extname(path)) }).end(body);
}).listen(0, '127.0.0.1');
await new Promise(r => server.on('listening', r));
const browser = await chromium.launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chrome' });
const errors = [];
try {
  const tab = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  tab.on('pageerror', e => errors.push(e.message));
  tab.on('console', m => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  tab.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push(`${r.status()} ${r.url()}`); });
  await tab.addInitScript(() => {
    let T = 1e6, queue = [];
    performance.now = () => T;
    window.requestAnimationFrame = cb => { queue.push(cb); return queue.length; };
    window.__step = to => { T = to; const q = queue; queue = []; q.forEach(f => f(T)); };
    window.__now = () => T;
  });
  await tab.goto(`http://127.0.0.1:${server.address().port}/docs/king-effects/preview.html?record`);
  await tab.evaluate(() => window.preview.ready);
  await tab.evaluate(() => {
    // Page-side helpers: only one scene draws at a time; each frame is asked for (the scene's own 30 fps
    // timer runs on the real clock), and grab() copies a crop of it.
    window.rec = {
      only(key) { for (const [k, s] of Object.entries(window.preview.scenes)) s.scene.setLively({ kings: k === key, pawns: k === key }); window.preview.scenes[key]?.scene.setResolution(1.75); return true; },
      at(key, t) { window.preview.scenes[key].scene.redraw(); window.__step(t); },
      grab(key, crop, scale) {
        const { canvas } = window.preview.scenes[key], c = document.createElement('canvas'), k = canvas.width / 960;
        c.width = 2 * Math.round(crop.w * scale / 2); c.height = 2 * Math.round(crop.h * scale / 2); // even, for H.264
        c.getContext('2d').drawImage(canvas, crop.x * k, crop.y * k, crop.w * k, crop.h * k, 0, 0, c.width, c.height);
        return c.toDataURL('image/png');
      },
    };
  });
  const SCALE = 1.6, FPS = 25, STEP = 1000 / FPS;
  const CROP = await tab.evaluate(() => window.preview.CROP);
  let clock = await tab.evaluate(() => window.__now() + 16);
  const at = (key, t) => tab.evaluate(([key, t]) => window.rec.at(key, t), [key, t]);
  const grab = (key, crop, scale) => tab.evaluate(([key, crop, scale]) => window.rec.grab(key, crop, scale), [key, crop, scale]);
  async function encode(name, shots, { loop = true, webpScale = 1 } = {}) {
    const dir = join(out, `.frames-${name}`);
    await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true });
    const pngs = [];
    for (const [i, src] of shots.entries()) { const f = join(dir, `${String(i).padStart(4, '0')}.png`); await writeFile(f, Buffer.from(src.split(',')[1], 'base64')); pngs.push(f); }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...(loop ? ['-stream_loop', '1'] : []), '-framerate', String(FPS), '-i', join(dir, '%04d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', join(out, `${name}.mp4`)]);
    // The WebP may be smaller than the MP4 (a whole board stays a few MB).
    const small = webpScale === 1 ? pngs : pngs.map(f => { const s = f.replace(/\.png$/, '-small.png'); execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-vf', `scale=iw*${webpScale}:-2`, s]); return s; });
    execFileSync('img2webp', ['-loop', '0', '-lossy', '-q', '80', '-m', '4', '-d', String(STEP), ...small, '-o', join(out, `${name}.webp`)], { stdio: 'ignore' });
    await rm(dir, { recursive: true, force: true });
  }
  async function sheet(name, rows, title) {
    const png = await tab.evaluate(async ({ rows, title }) => {
      const load = async s => { const i = new Image(); i.src = s; await i.decode(); return i; };
      const imgs = await Promise.all(rows.map(r => Promise.all(r.frames.map(load))));
      const w = imgs[0][0].width, h = imgs[0][0].height, cols = Math.max(...rows.map(r => r.frames.length)), head = 30, label = 34;
      const c = document.createElement('canvas'); c.width = cols * (w + 8); c.height = 40 + rows.length * (h + head + label);
      const g = c.getContext('2d'); g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#222'; g.font = 'bold 26px sans-serif'; g.fillText(title, 8, 28);
      rows.forEach((r, j) => { const y = 40 + j * (h + head + label); g.font = 'bold 22px sans-serif'; g.fillText(r.label, 8, y + 24);
        imgs[j].forEach((img, i) => { g.font = '19px sans-serif'; g.fillText(`${r.times[i]} ms`, i * (w + 8) + 4, y + label + 22); g.drawImage(img, i * (w + 8), y + label + head); }); });
      return c.toDataURL('image/png');
    }, { rows, title });
    await writeFile(join(out, name), Buffer.from(png.split(',')[1], 'base64'));
  }
  const cap = d => `${d[0].toUpperCase()}${d.slice(1)}`;

  // 1. Each king at rest: one exact loop (after the effects have grown in).
  for (const design of Object.keys(PERIOD)) {
    const period = PERIOD[design], count = Math.round(period / STEP);
    await tab.evaluate(key => window.rec.only(key), design);
    await at(design, clock); await new Promise(r => setTimeout(r, 300)); // an effect's own art arrives
    // A full period first (Mud's charcoal king starts 1.5 s late and his tufts lag), so the recording loops.
    const pre = period + 1200;
    for (let t = 0; t <= pre; t += 40) await at(design, clock + t);
    const t0 = clock + pre, shots = [], pick = Array.from({ length: 6 }, (_, i) => Math.floor(i * count / 6));
    for (let i = 0; i < count; i++) { if (quick && !pick.includes(i)) continue; await at(design, t0 + i * STEP); shots.push(await grab(design, CROP, SCALE)); }
    clock = t0 + period + 1000;
    const six = quick ? shots : pick.map(i => shots[i]);
    await sheet(`${design}-sheet.png`, [{ label: 'Ivory (left two) and charcoal (right two)', frames: six, times: pick.map(i => Math.round(i * STEP)) }], `${cap(design)} king at rest, loop ${period / 1000} s`);
    if (!quick) await encode(design, shots);
    console.log(`${design}: ${shots.length} frames${quick ? '' : `, ${design}.mp4, ${design}.webp`}, ${design}-sheet.png`);
  }

  // 2. Each king's captures, one after another (Normal speed): a short pause, the capture, the result.
  for (const design of Object.keys(PERIOD)) {
    const key = `capture-${design}`, list = await tab.evaluate(d => window.preview.capturesFor(d).map(c => c.label), design);
    await tab.evaluate(key => window.rec.only(key), key);
    const shots = [], rows = [];
    for (let c = 0; c < list.length; c++) {
      const duration = await tab.evaluate(([key, design, c]) => {
        // The king rests on his square for 1.2 s first (his effect grows in, as in a game), then takes.
        const { scene } = window.preview.scenes[key], move = window.preview.setUpCapture(scene, window.preview.capturesFor(design)[c], design);
        let t = window.__now() + 16; for (let i = 0; i <= 30; i++) window.rec.at(key, t += 40); scene.play(move); return 1660;
      }, [key, design, c]);
      clock = await tab.evaluate(() => window.__now());
      // After the move the position comes, as in the game; Mud's and Shadow's clips run on to show the
      // effect growing back on the king's new (or, after Death Touch, his own) square.
      const after = design === 'mud' ? 2900 : design === 'shadow' ? 1700 : 600;
      const start = clock, total = 360 + duration + after, row = { label: list[c], frames: [], times: [] };
      const marks = design === 'stratus' ? [0, 800, 1120, 1280, 1400, 1520] : design === 'mud' ? [0, 800, 1040, 1560, 2800, 4480] : [0, 520, 800, 1040, 1280, 1520];
      let synced = false;
      // play() started at `start`; frames from 360 ms before it would be a still, so the clip shows a pause first.
      const box = await tab.evaluate(key => window.preview.boxOf(key), key), scale = box.w > 900 ? 1 : SCALE;
      for (let i = 0; i < 9; i++) shots.push(await grab(key, box, scale));
      for (let t = 0; t <= duration + after; t += STEP) {
        if (!synced && t >= duration) { synced = true; await tab.evaluate(([key, design, c]) => window.preview.afterCapture(window.preview.scenes[key].scene, window.preview.capturesFor(design)[c], design), [key, design, c]); }
        await at(key, start + t);
        if (!quick || marks.some(m => Math.abs(m - t) < STEP / 2)) shots.push(await grab(key, box, scale));
        const m = marks.find(m => Math.abs(m - t) < STEP / 2);
        // The sheet: a knight taken by the ivory king, a pawn by the charcoal one, and Death Touch; Stratus all four.
        if (m != null && (design === 'stratus' || c === 1 || c === 2 || c >= 4)) { row.frames.push(shots.at(-1)); row.times.push(m); }
      }
      if (row.frames.length) rows.push(row);
      clock = start + total;
    }
    await sheet(`${design}-capture-sheet.png`, rows, `${cap(design)} king takes a piece (times from the start of the move)`);
    if (!quick) await encode(`${design}-capture`, shots, { loop: false });
    console.log(`${design} captures: ${list.length}${quick ? '' : `, ${design}-capture.mp4, ${design}-capture.webp`}, ${design}-capture-sheet.png`);
  }

  // 3. The title screen's kings: 8 s at the desktop and the phone size, as the page shows them (screenshots
  // of the stage: its background, floor and the kings' canvases), at 2 px per CSS px.
  await tab.setViewportSize({ width: 1500, height: 1100 });
  for (const id of ['title-desktop', 'title-phone']) {
    await tab.evaluate(() => window.rec.only('none'));
    await tab.waitForFunction(id => window.preview.titleKings[id]?.started === 6, id, { timeout: 20000 });
    const el = tab.locator(`#${id}`); await el.scrollIntoViewIfNeeded();
    // Around the kings and their effects (the desktop stage is wider than they need).
    const clip = await tab.evaluate(id => {
      const box = document.getElementById(id).getBoundingClientRect(), k = document.querySelector(`#${id} .title-kings`).getBoundingClientRect();
      const x0 = Math.max(box.left, k.left - 40), x1 = Math.min(box.right, k.right + 40), y0 = Math.max(box.top, k.top - 70), y1 = Math.min(box.bottom, k.bottom + 40);
      return { x: x0, y: y0, width: 2 * Math.round((x1 - x0) / 2), height: 2 * Math.round((y1 - y0) / 2) };
    }, id);
    const t0 = clock + 1200, count = quick ? 6 : 8 * FPS, shots = [];
    for (let i = 0; i < count; i++) {
      await tab.evaluate(([id, t]) => window.preview.titleKings[id].draw(t), [id, t0 + (quick ? i * 1333 : i * STEP)]);
      shots.push(`data:image/png;base64,${(await tab.screenshot({ clip })).toString('base64')}`);
    }
    clock = t0 + count * STEP + 1000;
    const pick = Array.from({ length: 6 }, (_, i) => Math.floor(i * shots.length / 6));
    await sheet(`${id}-sheet.png`, [{ label: id === 'title-desktop' ? 'Desktop (1440 × 900 window)' : '390 px phone', frames: pick.map(i => shots[i]), times: pick.map(i => Math.round(quick ? i * 1333 : i * STEP)) }], 'The title screen\'s kings at rest');
    if (!quick) await encode(id, shots, { loop: false, webpScale: id === 'title-desktop' ? .5 : 1 });
    console.log(`${id}: ${shots.length} frames${quick ? '' : `, ${id}.mp4, ${id}.webp`}, ${id}-sheet.png`);
  }
  await tab.setViewportSize({ width: 1280, height: 900 });

  // 4. The whole board with resting pawns: one loop of the pawns' timetable.
  {
    const key = 'board', full = { x: 0, y: 0, w: 960, h: 1024 };
    await tab.evaluate(key => window.rec.only(key), key);
    for (let t = 0; t <= 1200; t += 40) await at(key, clock + t);
    const t0 = Math.ceil((clock + 1300) / PAWN_LOOP) * PAWN_LOOP, count = Math.round(PAWN_LOOP / STEP), shots = [];
    for (let i = 0; i < count; i++) { if (quick && i % 40) continue; await at(key, t0 + i * STEP); shots.push(await grab(key, full, .8)); }
    clock = t0 + PAWN_LOOP;
    const acting = await tab.evaluate(() => window.preview.scenes.board.scene.pawns);
    if (!quick) await encode('pawns-idle', shots, { webpScale: .75 });
    await at(key, clock + 40);
    const boardShot = await tab.evaluate(() => window.preview.scenes.board.canvas.toDataURL('image/png'));
    await writeFile(join(out, 'board.png'), Buffer.from(boardShot.split(',')[1], 'base64'));
    console.log(`pawns at rest: ${shots.length} frames over ${PAWN_LOOP / 1000} s (last frame: ${acting.acting} of ${acting.resting} acting)${quick ? '' : ', pawns-idle.mp4, pawns-idle.webp'}, board.png`);
  }
} finally { await browser.close(); server.close(); }
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
