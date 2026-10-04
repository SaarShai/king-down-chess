// Preview of the six kings' board effects (docs/2d-first-pieces/board/king-effects.mjs) for the owner:
//   PLAYABLE_BROWSER=chromium node tools/king-effects-preview.mjs <out-dir> [--quick]
// Writes into <out-dir>:
//   kfx-preview.html      docs/king-effects/preview.html as one self-contained file (art inlined; opens from disk)
//   <king>.mp4, <king>.webp  one loop period (two in the MP4) of each king's panel, at desktop game size on a
//                         2× screen (1.6 px per board unit; the game draws 1.75), 25 frames a second; the WebP loops forever
//   <king>-sheet.png      six frames of that loop, both armies
//   board.png             the whole board, Flame (White) against Shadow (Black)
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

const out = resolve(process.argv[2] ?? 'kfx-shots'), quick = process.argv.includes('--quick'), pageOnly = process.argv.includes('--page');
const docs = fileURLToPath(new URL('../docs/', import.meta.url));
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

// 2. Recordings from the repo's own page, served from docs/.
const mime = ext => ({ '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' })[ext] ?? 'application/octet-stream';
const server = createServer(async (req, res) => {
  const path = normalize(join(docs, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!path.startsWith(docs)) { res.writeHead(403).end(); return; }
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
  await tab.goto(`http://127.0.0.1:${server.address().port}/king-effects/preview.html`);
  await tab.evaluate(() => window.preview.ready);
  const SCALE = 1.6, FPS = 25;
  for (const design of Object.keys(PERIOD)) {
    const period = PERIOD[design], count = quick ? 6 : Math.round(period / 1000 * FPS);
    // Let the effects grow in first (900 ms), then record one exact period.
    const shots = await tab.evaluate(async ({ design, period, count, SCALE, sheet }) => {
      const { scene, canvas } = window.preview.scenes[design], C = window.preview.CROP;
      for (const s of Object.values(window.preview.scenes)) if (s.scene !== scene) s.scene.setLively({ kings: false });
      scene.setResolution(1.75);
      // Each frame is asked for (the scene's own 30 fps timer runs on the real clock).
      const at = t => { scene.redraw(); window.__step(t); };
      const start = window.__now() + 16; at(start);
      await new Promise(r => setTimeout(r, 300)); // an effect's own art (the lava mask) arrives
      for (let t = 0; t <= 1200; t += 40) at(start + t);
      const t0 = start + 1200, list = [];
      for (let i = 0; i < count; i++) {
        at(t0 + i * (sheet ? period / count : 1000 / 25));
        const c = document.createElement('canvas'); c.width = 2 * Math.round(C.w * SCALE / 2); c.height = 2 * Math.round(C.h * SCALE / 2); // even, for H.264
        const k = canvas.width / 960;
        c.getContext('2d').drawImage(canvas, C.x * k, C.y * k, C.w * k, C.h * k, 0, 0, c.width, c.height);
        list.push(c.toDataURL('image/png'));
      }
      for (const s of Object.values(window.preview.scenes)) s.scene.setLively({ kings: true });
      return list;
    }, { design, period, count, SCALE, sheet: quick });
    const dir = join(out, `.frames-${design}`);
    await rm(dir, { recursive: true, force: true }); await mkdir(dir, { recursive: true });
    for (const [i, src] of shots.entries()) await writeFile(join(dir, `${String(i).padStart(4, '0')}.png`), Buffer.from(src.split(',')[1], 'base64'));
    // Six frames across the period, labelled, for a quick look.
    const pick = Array.from({ length: 6 }, (_, i) => Math.floor(i * shots.length / 6));
    const sheet = await tab.evaluate(async ({ srcs, times, title }) => {
      const imgs = await Promise.all(srcs.map(async s => { const i = new Image(); i.src = s; await i.decode(); return i; }));
      const w = imgs[0].width, h = imgs[0].height, head = 34, c = document.createElement('canvas');
      c.width = w * 2 + 12; c.height = 3 * (h + head) + 40;
      const g = c.getContext('2d'); g.fillStyle = '#f4f0e4'; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = '#222'; g.font = 'bold 26px sans-serif'; g.fillText(title, 8, 28);
      imgs.forEach((img, i) => { const x = (i % 2) * (w + 12), y = 40 + Math.floor(i / 2) * (h + head); g.font = '20px sans-serif'; g.fillText(`${times[i]} ms`, x + 4, y + 24); g.drawImage(img, x, y + head); });
      return c.toDataURL('image/png');
    }, { srcs: pick.map(i => shots[i]), times: pick.map(i => Math.round(quick ? i * period / 6 : i * 40)), title: `${design[0].toUpperCase()}${design.slice(1)} king: ivory (left two) and charcoal (right two), loop ${period / 1000} s` });
    await writeFile(join(out, `${design}-sheet.png`), Buffer.from(sheet.split(',')[1], 'base64'));
    if (!quick) {
      const frames = join(dir, '%04d.png');
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-stream_loop', '1', '-framerate', String(FPS), '-i', frames, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', join(out, `${design}.mp4`)]);
      const pngs = shots.map((_, i) => join(dir, `${String(i).padStart(4, '0')}.png`));
      execFileSync('img2webp', ['-loop', '0', '-lossy', '-q', '82', '-m', '4', '-d', String(1000 / FPS), ...pngs, '-o', join(out, `${design}.webp`)], { stdio: 'ignore' });
    }
    await rm(dir, { recursive: true, force: true });
    console.log(`${design}: ${shots.length} frames${quick ? '' : `, ${design}.mp4, ${design}.webp`}, ${design}-sheet.png`);
  }
  // The whole board at desktop game size on a 2× screen.
  const boardShot = await tab.evaluate(() => {
    const { scene, canvas } = window.preview.scenes.board;
    scene.setResolution(1.75); const t = window.__now() + 40;
    for (let ms = 0; ms <= 2400; ms += 40) { scene.redraw(); window.__step(t + ms); }
    return canvas.toDataURL('image/png');
  });
  await writeFile(join(out, 'board.png'), Buffer.from(boardShot.split(',')[1], 'base64'));
  console.log('board.png');
} finally { await browser.close(); server.close(); }
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
