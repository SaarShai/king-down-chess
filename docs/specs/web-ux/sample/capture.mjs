// Renders the game screen sample in its four states at the five review sizes, makes one contact sheet per
// state, and measures the Verification list of ticket 02 (docs/specs/web-ux/issues/02-game-screen-sample.md)
// on every render. It prints one PASS or FAIL line per check and exits with 1 when a check fails.
//   node docs/specs/web-ux/sample/capture.mjs <out-dir> [--scale 2]   renders, sheets, checks (out-dir outside the repo)
//   node docs/specs/web-ux/sample/capture.mjs --serve [port]           serves the sample to open in a browser
// The server sends only the sample folder and the game's fonts and art (public/fonts, public/ui).
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const PAGE = '/docs/specs/web-ux/sample/index.html';
const SERVED = ['/docs/specs/web-ux/sample/', '/public/fonts/', '/public/ui/'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const STATES = ['idle', 'selected', 'review', 'powers'];
const SIZES = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 720 },
  tablet: { width: 820, height: 1180, touch: true },
  phone: { width: 390, height: 844, touch: true },
  landscape: { width: 844, height: 390, touch: true },
};

function serve(port = 0) {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (!SERVED.some(p => path.startsWith(p)) || !TYPES[extname(path)]) return res.writeHead(404).end();
    try { res.writeHead(200, { 'content-type': TYPES[extname(path)] }).end(await readFile(join(root, path))); }
    catch { res.writeHead(404).end(); }
  });
  return new Promise(done => server.listen(port, '127.0.0.1', () => done(server)));
}

const args = process.argv.slice(2);
if (args[0] === '--serve') {
  const server = await serve(+(args[1] ?? 5199));
  const base = `http://127.0.0.1:${server.address().port}${PAGE}`;
  console.log(`Serving the sample. Open ${base}?state=idle (or selected, review, powers). Ctrl+C stops it.`);
} else {
  const out = args[0] && resolve(args[0]);
  const scale = args.includes('--scale') ? +args[args.indexOf('--scale') + 1] : 1;
  if (!out || !relative(root, out).startsWith('..')) {
    console.error('Usage: node docs/specs/web-ux/sample/capture.mjs <out-dir outside the repo> [--scale 2]');
    process.exit(2);
  }
  await mkdir(out, { recursive: true });
  const server = await serve();
  const base = `http://127.0.0.1:${server.address().port}${PAGE}`;
  const browser = await chromium.launch({ channel: process.env.PLAYABLE_BROWSER ?? 'chrome' });
  const results = {};
  for (const [size, s] of Object.entries(SIZES)) {
    results[size] = {};
    for (const state of STATES) {
      const context = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: scale, hasTouch: !!s.touch, isMobile: !!s.touch });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => errors.push(`failed: ${r.url()}`));
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
      await page.goto(`${base}?state=${state}`);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
      await page.screenshot({ path: `${out}/${state}-${size}.png` });
      results[size][state] = { ...(await page.evaluate(measure)), errors };
      await context.close();
    }
  }
  for (const state of STATES) await sheet(browser, out, state, results);
  await browser.close();
  server.close();
  await writeFile(`${out}/results.json`, JSON.stringify(results, null, 1));
  const failed = report(results);
  console.log(`\nRenders, contact sheets and results.json: ${out}`);
  process.exit(failed ? 1 : 0);
}

/** In the page: every number the checks need. */
function measure() {
  const vw = innerWidth, vh = innerHeight;
  const shown = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const box = el => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) }; };
  const name = el => el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' ');
  const controls = [...document.querySelectorAll('button, a[href], input, select, summary')].filter(shown);
  const at = text => { const el = controls.find(c => c.textContent.trim() === text); return el ? box(el) : null; };
  const kinds = ['primary', 'secondary', 'quiet', 'icon-btn'];
  // Elements with their own text: the font that text is set in.
  const texts = [...document.querySelectorAll('body *')].filter(el => shown(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
    .map(el => { const cs = getComputedStyle(el); return { text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), px: parseFloat(cs.fontSize), cinzel: cs.fontFamily.includes('Cinzel') }; });
  const board = document.querySelector('.board');
  const b = box(board);
  const crimson = [...document.querySelectorAll('body *')].filter(el => shown(el) && getComputedStyle(el).backgroundColor === 'rgb(132, 44, 33)').map(name);
  return {
    viewport: { w: vw, h: vh },
    scroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
    outside: controls.filter(el => { const r = el.getBoundingClientRect(); return r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5; }).map(name),
    smallest: controls.map(el => ({ name: name(el), ...box(el) })).sort((p, q) => Math.min(p.w, p.h) - Math.min(q.w, q.h)).slice(0, 3),
    hint: at('Hint'), undo: at('Undo'),
    board: { ...b, square: +(b.w * 112 / 960).toFixed(2), frame: +(b.w * 948 / 960).toFixed(2), loaded: board.complete && board.naturalWidth > 0, file: board.currentSrc.split('/').pop() },
    cinzelSmall: texts.filter(t => t.cinzel && t.px < 18),
    cinzelUsed: texts.filter(t => t.cinzel).map(t => `${t.text} ${t.px}px`),
    bodyPx: parseFloat(getComputedStyle(document.body).fontSize),
    paragraphs: [...document.querySelectorAll('p')].filter(shown).map(p => parseFloat(getComputedStyle(p).fontSize)),
    smallText: texts.filter(t => t.px < 14),
    kindless: controls.filter(el => kinds.filter(k => el.classList.contains(k)).length !== 1).map(name),
    kindsUsed: kinds.filter(k => controls.some(el => el.classList.contains(k))),
    crimson,
  };
}

/** One PASS or FAIL line per check, over every render; true when one fails. */
function report(results) {
  const all = Object.entries(results).flatMap(([size, states]) => Object.entries(states).map(([state, m]) => ({ size, state, m, touch: !!SIZES[size].touch })));
  const where = r => `${r.size}/${r.state}`;
  let failed = false;
  const line = (ok, check, detail) => { failed ||= !ok; console.log(`${ok ? 'PASS' : 'FAIL'}  ${check}: ${detail}`); };
  const bad = (rows, fn) => rows.filter(r => !fn(r));
  const list = (rows, fn) => rows.map(r => `${where(r)} ${fn(r)}`).join('; ');

  // A phone shows the board the game draws at phone size (larger markers); the others the large one.
  const phoneBoard = r => r.m.board.file === `${r.state}${['phone', 'landscape'].includes(r.size) ? '-small' : ''}.webp`;
  let b = bad(all, r => !r.m.errors.length && r.m.board.loaded && phoneBoard(r));
  line(!b.length, 'page loads (no error, no missing file, the right board image)', b.length ? list(b, r => r.m.errors.join(', ') || `board ${r.m.board.file}`) : `${all.length} renders`);
  b = bad(all, r => r.m.scroll.w <= r.m.viewport.w && r.m.scroll.h <= r.m.viewport.h);
  line(!b.length, 'no sideways scroll (and no page scroll)', b.length ? list(b, r => `page ${r.m.scroll.w}x${r.m.scroll.h} in ${r.m.viewport.w}x${r.m.viewport.h}`) : 'page = viewport at every size and state');
  b = bad(all, r => !r.m.outside.length);
  line(!b.length, 'every control inside the viewport', b.length ? list(b, r => r.m.outside.join(', ')) : 'yes, at every size and state');
  const touch = all.filter(r => r.touch);
  b = bad(touch, r => Math.min(r.m.smallest[0].w, r.m.smallest[0].h) >= 44);
  line(!b.length, 'touch sizes: every control at least 44 x 44 px', b.length ? list(b, r => r.m.smallest.filter(c => Math.min(c.w, c.h) < 44).map(c => `${c.name} ${c.w}x${c.h}`).join(', '))
    : Object.keys(SIZES).filter(k => SIZES[k].touch).map(k => `${k} smallest ${Math.min(...touch.filter(r => r.size === k).map(r => Math.min(r.m.smallest[0].w, r.m.smallest[0].h)))} px`).join(', '));
  const moved = Object.keys(SIZES).map(size => {
    const rs = all.filter(r => r.size === size), first = rs[0].m;
    const delta = Math.max(...rs.flatMap(r => ['hint', 'undo'].map(k => !r.m[k] || !first[k] ? Infinity : Math.max(Math.abs(r.m[k].x - first[k].x), Math.abs(r.m[k].y - first[k].y), Math.abs(r.m[k].w - first[k].w), Math.abs(r.m[k].h - first[k].h)))));
    return { size, delta, at: first.hint && `Hint ${first.hint.x},${first.hint.y} Undo ${first.undo.x},${first.undo.y}` };
  });
  line(moved.every(m => m.delta === 0), 'Hint and Undo at the same place in all four states', moved.map(m => `${m.size} ${m.delta === Infinity ? 'not found' : `${m.delta} px (${m.at})`}`).join('; '));
  const pick = (size, fn) => all.filter(r => r.size === size).map(fn);
  const sq = Math.min(...pick('phone', r => r.m.board.square)), frame = Math.min(...pick('tablet', r => r.m.board.frame));
  const fill = pick('landscape', r => r.m.board.y <= 0.5 && r.m.board.y + r.m.board.h >= r.m.viewport.h - 0.5);
  line(sq >= 45, '390x844: squares at least 45 px', `${sq} px`);
  line(frame >= 736, '820x1180: board at least 736 px wide', `${frame} px (frame; image ${Math.min(...pick('tablet', r => r.m.board.w))} px, squares ${Math.min(...pick('tablet', r => r.m.board.square))} px)`);
  line(fill.every(Boolean), '844x390: the board fills the height', `board ${pick('landscape', r => `${r.m.board.y}-${+(r.m.board.y + r.m.board.h).toFixed(2)}`)[0]} of 390 px, squares ${Math.min(...pick('landscape', r => r.m.board.square))} px`);
  b = bad(all, r => !r.m.cinzelSmall.length);
  line(!b.length, 'Cinzel only at 18 px and larger', b.length ? list(b, r => r.m.cinzelSmall.map(t => `${t.text} ${t.px}px`).join(', ')) : [...new Set(all.flatMap(r => r.m.cinzelUsed))].join('; '));
  b = bad(all, r => r.m.bodyPx === 16 && r.m.paragraphs.every(px => px === 16) && !r.m.smallText.length);
  line(!b.length, 'body text 16 px (no text under 14 px)', b.length ? list(b, r => `body ${r.m.bodyPx}px, p ${r.m.paragraphs.join('/')}, small ${r.m.smallText.map(t => `${t.text} ${t.px}px`).join(', ')}`) : 'body and every paragraph 16 px');
  b = bad(all, r => !r.m.kindless.length);
  line(!b.length, 'three button kinds plus an icon button', b.length ? list(b, r => r.m.kindless.join(', ')) : `kinds in use: ${[...new Set(all.flatMap(r => r.m.kindsUsed))].join(', ')}`);
  b = bad(all, r => r.m.crimson.length <= 1);
  line(!b.length, 'crimson only for the one main action', b.length ? list(b, r => r.m.crimson.join(', ')) : `at most one per view (${[...new Set(all.flatMap(r => r.m.crimson))].join(', ') || 'none'})`);
  return failed;
}

/** One contact sheet per state: the five sizes side by side at one scale, labelled. */
async function sheet(browser, out, state, results) {
  const k = 0.5, gap = 32;
  const cells = await Promise.all(Object.entries(SIZES).map(async ([size, s]) => {
    const png = (await readFile(`${out}/${state}-${size}.png`)).toString('base64');
    const m = results[size][state];
    return `<figure style="width:${s.width * k}px"><img src="data:image/png;base64,${png}" style="width:${s.width * k}px;height:${s.height * k}px">
      <figcaption><b>${size[0].toUpperCase() + size.slice(1)} ${s.width}×${s.height}</b><br>squares ${m.board.square.toFixed(1)} px${m.hint ? ` · Hint at ${Math.round(m.hint.x)},${Math.round(m.hint.y)}` : ''}</figcaption></figure>`;
  }));
  const width = Object.values(SIZES).reduce((w, s) => w + s.width * k + gap, gap);
  const page = await browser.newPage({ viewport: { width, height: 400 } });
  await page.setContent(`<body style="margin:0;padding:${gap}px;background:#d8d2bf;font:15px/1.4 system-ui;color:#2b2621">
    <h1 style="margin:0 0 16px;font-size:20px">Game screen sample · state: ${state}</h1>
    <div style="display:flex;gap:${gap}px;align-items:flex-start">${cells.join('')}</div>
    <style>figure{margin:0}img{display:block;box-shadow:0 2px 10px rgba(0,0,0,.25)}figcaption{margin-top:8px}</style></body>`);
  await page.screenshot({ path: `${out}/sheet-${state}.png`, fullPage: true });
  await page.close();
}
