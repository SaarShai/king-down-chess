// Ticket 02: render every sample state at three sizes, check it, and make a contact sheet.
// node docs/specs/chatgpt-mvp/sample/render.mjs [state,...]   (from the worktree root)
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { transform } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../../..');
const out = join(here, 'png');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ts': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2' };
// The worktree root, with the game's public folder at /fonts and /ui (as the game serves them); a .ts file goes out as
// plain JS, an import with no extension finds its .ts file (as Vite resolves the game's imports), and
// import.meta.env.BASE_URL is '/'.
const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (/^\/(fonts|ui)\//.test(path)) path = `/public${path}`;
  path = join(root, path);
  if (!path.startsWith(root)) return res.writeHead(403).end();
  try {
    if (!extname(path)) path += '.ts';
    let body = await readFile(path);
    if (path.endsWith('.ts')) body = (await transform(body.toString(), { loader: 'ts', define: { 'import.meta.env': '{"BASE_URL":"/"}' } })).code;
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch { res.writeHead(404).end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}/docs/specs/chatgpt-mvp/sample/sample.html`;

const SIZES = {
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  panel: { viewport: { width: 400, height: 900 }, deviceScaleFactor: 1 },
};
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const probe = await browser.newPage();
await probe.goto(base);
await probe.waitForFunction(() => window.STATES);
const all = await probe.evaluate(() => window.STATES);
await probe.close();
const states = process.argv[2] ? process.argv[2].split(',') : all;
const faults = [];

for (const [size, opts] of Object.entries(SIZES)) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
  for (const s of states) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(`${base}?s=${s}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.STATES);
    await page.evaluate(() => document.fonts.ready);
    const found = await page.evaluate(() => {
      const f = [];
      const doc = document.scrollingElement;
      if (doc.scrollWidth > innerWidth) f.push(`page scrolls sideways (${doc.scrollWidth} px)`);
      for (const el of document.querySelectorAll('.frame, .chat, .new-game-body, .sheet-body, #game-table')) if (el.scrollWidth > el.clientWidth + 1) f.push(`${el.className} scrolls sideways`);
      const comp = document.querySelector('.composer').getBoundingClientRect();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) {
        if (!n.textContent.trim() || n.parentElement.closest('.composer, svg')) continue;
        const range = document.createRange(); range.selectNodeContents(n);
        for (const r of range.getClientRects()) {
          if (r.width < 1 || r.bottom <= comp.top || r.top >= innerHeight) continue;
          const y = Math.max(r.top, comp.top) + 1, x = r.left + r.width / 2;
          const top = document.elementFromPoint(x, y);
          if (top && !top.closest('.composer')) f.push(`text over the composer: "${n.textContent.trim().slice(0, 30)}"`);
        }
        const r = n.parentElement.getBoundingClientRect();
        if (r.right > innerWidth + 1) f.push(`text past the right edge: "${n.textContent.trim().slice(0, 30)}"`);
      }
      return f;
    });
    for (const e of [...errors, ...found]) faults.push(`${s}-${size}: ${e}`);
    await page.screenshot({ path: join(out, `${s}-${size}.png`) });
    await page.close();
  }
  await ctx.close();
}

// The contact sheet: one row per state, phone, panel and desktop side by side.
const sheet = await browser.newPage({ viewport: { width: 1800, height: 800 } });
const cell = (s, size, w) => `<figure><img src="png/${s}-${size}.png" style="width:${w}px"><figcaption>${s} · ${size}</figcaption></figure>`;
await sheet.setContent(`<base href="${base}"><style>body{margin:0;padding:16px;font:14px system-ui;background:#ddd}h1{font-size:20px;margin:0 0 12px}
  .r{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}figure{margin:0}img{display:block;border:1px solid #999;background:#fff}figcaption{padding:3px 0}</style>
  <h1>King Down in ChatGPT · ticket 02 sample, round 3 (the game's design, the game's board code) · phone 390×844, side panel 400×900, desktop 1440×900</h1>
  ${states.map(s => `<div class="r">${cell(s, 'phone', 220)}${cell(s, 'panel', 220)}${cell(s, 'desktop', 880)}</div>`).join('')}`);
await sheet.waitForLoadState('networkidle');
await sheet.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
await sheet.screenshot({ path: join(here, 'contact-sheet.png'), fullPage: true });
// The compare sheet: the game on main (reference/, from reference/capture.mjs) beside the sample, phone size.
const PAIRS = [['title', 'home', 'Title · inline home card'], ['new-game-computer', 'setup', 'New game · setup'], ['new-game-powers', 'setup-king', "New game, kings' powers · king sheet"],
  ['settings', 'settings', 'Board help · settings'], ['menu', 'play', 'Menu · play'], ['board-powers', 'board', 'Game with powers · board with cards'],
  ['board-select', 'board-rails', 'Queen selected, Show threats on · queen selected (rails)'], ['board-check', 'board-check', 'Check, Show threats on · check, Show threats on'], ['ceremony', 'end', 'Ceremony · end card']];
const cmp = await browser.newPage({ viewport: { width: 1400, height: 800 } });
await cmp.setContent(`<base href="${base}"><style>body{margin:0;padding:16px;font:14px system-ui;background:#ddd}h1{font-size:20px;margin:0 0 12px}
  .r{display:inline-flex;gap:8px;margin:0 18px 18px 0;vertical-align:top;background:#ccc;padding:8px;border-radius:8px}figure{margin:0}img{display:block;width:300px;border:1px solid #999}figcaption{padding:3px 0}</style>
  <h1>Ticket 02 · the game on main (left) and the sample (right) · phone 390×844</h1>
  ${PAIRS.map(([g, m, t]) => `<div class="r"><figure><img src="reference/${g}-phone.png"><figcaption>Game: ${t.split(' · ')[0]}</figcaption></figure><figure><img src="png/${m}-phone.png"><figcaption>Sample: ${t.split(' · ')[1]}</figcaption></figure></div>`).join('')}`);
await cmp.waitForLoadState('networkidle');
await cmp.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
await cmp.screenshot({ path: join(here, 'compare.png'), fullPage: true });
await browser.close();
server.close();
// 256-colour PNGs keep the renders small enough for Git (Pillow's libimagequant, when present).
execFileSync('python3', ['-c', `import sys, glob
from PIL import Image
for f in sys.argv[1:]:
    im = Image.open(f).convert('RGB'); im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(f, optimize=True)`,
  ...states.flatMap(s => Object.keys(SIZES).map(z => join(out, `${s}-${z}.png`))), join(here, 'contact-sheet.png'), join(here, 'compare.png')]);
console.log(`${states.length} states × 3 sizes rendered to ${out}`);
if (faults.length) { console.log(faults.join('\n')); process.exit(1); }
console.log('no faults');
