// Renders the game screen sample in its seven states at the five review sizes and at four phone sizes with
// the browser bars, makes one contact sheet per state, and measures the Verification list of ticket 02
// (docs/specs/web-ux/issues/02-game-screen-sample.md) on every render. It prints one PASS or FAIL line per
// check and exits with 1 when a check fails.
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
const STATES = ['idle', 'hint', 'selected', 'review', 'resign', 'powers', 'armed'];
// The five review sizes, then phones with the browser bars (claude-review §5: 390x664, 375x550) and the
// iPhone SE both ways. `main` sizes go in the first row of a contact sheet.
const SIZES = {
  desktop: { width: 1440, height: 900, main: true },
  laptop: { width: 1280, height: 720, main: true },
  tablet: { width: 820, height: 1180, touch: true, main: true },
  phone: { width: 390, height: 844, touch: true, main: true },
  landscape: { width: 844, height: 390, touch: true, main: true },
  'phone-safari': { width: 390, height: 664, touch: true },
  'se-safari': { width: 375, height: 550, touch: true },
  se: { width: 375, height: 667, touch: true },
  'se-landscape': { width: 667, height: 375, touch: true },
};
// WCAG 1.4.12: the text spacing a reader may set. No content or control may be lost under it.
const SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';

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
  console.log(`Serving the sample. Open ${base}?state=idle (or ${STATES.slice(1).join(', ')}). Ctrl+C stops it.`);
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
  const results = {}, spacing = {};
  for (const [size, s] of Object.entries(SIZES)) {
    results[size] = {}; spacing[size] = {};
    for (const state of STATES) for (const spaced of [false, true]) {
      const context = await browser.newContext({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: spaced ? 1 : scale, hasTouch: !!s.touch, isMobile: !!s.touch });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => errors.push(`failed: ${r.url()}`));
      page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url()}`); });
      await page.goto(`${base}?state=${state}`);
      if (spaced) await page.addStyleTag({ content: SPACING });
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
      await page.waitForTimeout(100);
      if (!spaced) await page.screenshot({ path: `${out}/${state}-${size}.png` });
      (spaced ? spacing : results)[size][state] = { ...(await page.evaluate(measure)), errors };
      await context.close();
    }
  }
  for (const state of STATES) await sheet(browser, out, state, results);
  await browser.close();
  server.close();
  await writeFile(`${out}/results.json`, JSON.stringify({ results, spacing }, null, 1));
  const failed = report(results, spacing);
  console.log(`\nRenders, contact sheets and results.json: ${out}`);
  process.exit(failed ? 1 : 0);
}

/** In the page: every number the checks need. */
function measure() {
  const vw = innerWidth, vh = innerHeight;
  const shown = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const box = el => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) }; };
  const name = el => el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' ');
  const css = el => getComputedStyle(el);
  const controls = [...document.querySelectorAll('button, a[href], input, select, summary')].filter(shown);
  const at = text => { const el = controls.find(c => c.textContent.trim() === text); return el ? box(el) : null; };
  const kinds = ['primary', 'secondary', 'quiet', 'icon-btn'];
  const inside = (r, c) => r.left >= c.left - 0.5 && r.top >= c.top - 0.5 && r.right <= c.right + 0.5 && r.bottom <= c.bottom + 0.5;
  const scrolls = el => /auto|scroll/.test(css(el).overflowX + css(el).overflowY);
  // The padding box: what an element with overflow not visible shows of its content.
  const clipBox = el => { const r = el.getBoundingClientRect(), s = css(el); return { left: r.left + parseFloat(s.borderLeftWidth), top: r.top + parseFloat(s.borderTopWidth), right: r.right - parseFloat(s.borderRightWidth), bottom: r.bottom - parseFloat(s.borderBottomWidth) }; };
  const content = el => { const r = clipBox(el), s = css(el); return { left: r.left + parseFloat(s.paddingLeft), top: r.top + parseFloat(s.paddingTop), right: r.right - parseFloat(s.paddingRight), bottom: r.bottom - parseFloat(s.paddingBottom) }; };
  // A control is lost when an ancestor that does not scroll cuts it, or the screen does. Inside a list that
  // scrolls, the list itself must be whole: the user scrolls to the rest.
  const lost = el => {
    let r = el.getBoundingClientRect();
    for (let a = el.parentElement; a && a !== document.documentElement; a = a.parentElement) {
      const s = css(a);
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      if (scrolls(a)) { r = a.getBoundingClientRect(); continue; }
      if (!inside(r, clipBox(a))) return `cut by .${a.className}`;
    }
    return inside(r, { left: 0, top: 0, right: vw, bottom: vh }) ? '' : 'outside the screen';
  };
  // Elements with their own text: the font that text is set in, and its contrast on what is behind it.
  const rgba = c => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const behind = el => {
    const layers = [];
    for (let a = el; a; a = a.parentElement) layers.push(rgba(css(a).backgroundColor));
    return layers.reverse().reduce((under, c) => ({ r: c.r * c.a + under.r * (1 - c.a), g: c.g * c.a + under.g * (1 - c.a), b: c.b * c.a + under.b * (1 - c.a), a: 1 }), { r: 255, g: 255, b: 255, a: 1 });
  };
  const faded = el => { for (let a = el; a; a = a.parentElement) if (+css(a).opacity < 1) return true; return false; };
  const texts = [...document.querySelectorAll('body *')].filter(el => shown(el) && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()))
    .map(el => {
      const s = css(el), px = parseFloat(s.fontSize), bold = +s.fontWeight >= 700, fg = rgba(s.color), bg = behind(el);
      const ink = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
      const [hi, lo] = [lum(ink), lum(bg)].sort((p, q) => q - p);
      return { text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), px, cinzel: s.fontFamily.includes('Cinzel'),
        ratio: +((hi + 0.05) / (lo + 0.05)).toFixed(2), need: px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5, off: faded(el) };
    });
  const board = document.querySelector('.board');
  const b = box(board);
  const crimson = [...document.querySelectorAll('body *')].filter(el => shown(el) && css(el).backgroundColor === 'rgb(132, 44, 33)').map(name);
  // The main regions of the screen: none may lie over another (content boxes).
  const regions = ['.toolbar', '.strip.opp', '.stage', '.head', '.context', '.movebox', '.strip.you', '.bar']
    .map(sel => document.querySelector(sel)).filter(el => el && shown(el)).map(el => ({ name: el.className.split(' ').join('.'), r: content(el) }));
  const overlaps = [];
  for (const [i, p] of regions.entries()) for (const q of regions.slice(i + 1)) {
    const w = Math.min(p.r.right, q.r.right) - Math.max(p.r.left, q.r.left), h = Math.min(p.r.bottom, q.r.bottom) - Math.max(p.r.top, q.r.top);
    if (w > 0.5 && h > 0.5) overlaps.push(`${p.name} / ${q.name} ${w.toFixed(1)}x${h.toFixed(1)}`);
  }
  const ctx = document.querySelector('.context');
  // The newest move, or the viewed one in review: whole, inside the list and clear of its faded edges.
  const list = [...document.querySelectorAll('.moves')].find(shown);
  let target = null;
  if (list) {
    const t = list.querySelector('[aria-current]') ?? [...list.querySelectorAll('button')].at(-1), l = list.getBoundingClientRect(), fade = 16;
    const across = css(list).display === 'flex' && css(list).flexWrap === 'nowrap', r = t.getBoundingClientRect();
    const clear = across ? { left: l.left + fade, right: l.right - fade, top: l.top, bottom: l.bottom } : { left: l.left, right: l.right, top: l.top + fade, bottom: l.bottom - fade };
    target = { name: name(t), whole: inside(r, clear) && !lost(t) };
  } else target = { name: 'no moves list', whole: true, none: true };
  // Keyboard order on wide screens: down the rail, never back up (a control in a list counts at the list's top).
  const rail = controls.filter(el => !el.disabled && el.getBoundingClientRect().left >= b.x + b.w);
  const ys = rail.map(el => { const s = el.closest('.moves'); return (s ?? el).getBoundingClientRect().top; });
  const backUp = ys.findIndex((y, i) => i && y < ys[i - 1] - 2);
  return {
    viewport: { w: vw, h: vh },
    scroll: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
    lost: controls.map(el => [name(el), lost(el)]).filter(([, why]) => why).map(([n, why]) => `${n} (${why})`),
    smallest: controls.map(el => ({ name: name(el), ...box(el) })).sort((p, q) => Math.min(p.w, p.h) - Math.min(q.w, q.h)).slice(0, 3),
    hint: at('Hint'), undo: at('Undo'),
    board: { ...b, square: +(b.w * 112 / 960).toFixed(2), frame: +(b.w * 948 / 960).toFixed(2), loaded: board.complete && board.naturalWidth > 0, file: board.currentSrc.split('/').pop() },
    context: { fits: ctx.scrollHeight <= ctx.clientHeight + 1 && ctx.scrollWidth <= ctx.clientWidth + 1, reachable: ctx.scrollHeight <= ctx.clientHeight + 1 || scrolls(ctx), need: ctx.scrollHeight, has: ctx.clientHeight },
    overlaps, target,
    order: rail.length && backUp > 0 ? `${name(rail[backUp - 1])} then ${name(rail[backUp])}` : '',
    cinzelSmall: texts.filter(t => t.cinzel && t.px < 18),
    cinzelUsed: texts.filter(t => t.cinzel).map(t => `${t.text} ${t.px}px`),
    bodyPx: parseFloat(css(document.body).fontSize),
    paragraphs: [...document.querySelectorAll('p')].filter(shown).map(p => parseFloat(css(p).fontSize)),
    smallText: texts.filter(t => t.px < 14),
    lowContrast: texts.filter(t => !t.off && t.ratio < t.need).map(t => `${t.text} ${t.ratio}:1`),
    lowestContrast: texts.filter(t => !t.off).sort((p, q) => p.ratio - q.ratio).slice(0, 1).map(t => `${t.text} ${t.ratio}:1`)[0],
    kindless: controls.filter(el => kinds.filter(k => el.classList.contains(k)).length !== 1).map(name),
    kindsUsed: kinds.filter(k => controls.some(el => el.classList.contains(k))),
    crimson,
  };
}

/** One PASS or FAIL line per check, over every render; true when one fails. */
function report(results, spacing) {
  const rows = set => Object.entries(set).flatMap(([size, states]) => Object.entries(states).map(([state, m]) => ({ size, state, m, touch: !!SIZES[size].touch, main: !!SIZES[size].main })));
  const all = rows(results), spaced = rows(spacing), main = all.filter(r => r.main);
  const where = r => `${r.size}/${r.state}`;
  let failed = false;
  const line = (ok, check, detail) => { failed ||= !ok; console.log(`${ok ? 'PASS' : 'FAIL'}  ${check}: ${detail}`); };
  const bad = (rs, fn) => rs.filter(r => !fn(r));
  const list = (rs, fn) => rs.map(r => `${where(r)} ${fn(r)}`).join('; ');
  const sizes = Object.keys(SIZES).length;

  // A phone shows the board the game draws at phone size (larger markers); the others the large one.
  const small = s => s.width < s.height ? s.width <= 600 : s.height <= 500;
  const file = r => `${r.state === 'resign' ? 'idle' : r.state}${small(SIZES[r.size]) ? '-small' : ''}.webp`;
  let b = bad(all, r => !r.m.errors.length && r.m.board.loaded && r.m.board.file === file(r));
  line(!b.length, 'page loads (no error, no missing file, the right board image)', b.length ? list(b, r => r.m.errors.join(', ') || `board ${r.m.board.file}`) : `${all.length} renders: ${STATES.length} states at ${sizes} sizes`);
  b = bad(all, r => r.m.scroll.w <= r.m.viewport.w && r.m.scroll.h <= r.m.viewport.h);
  line(!b.length, 'no sideways scroll (and no page scroll)', b.length ? list(b, r => `page ${r.m.scroll.w}x${r.m.scroll.h} in ${r.m.viewport.w}x${r.m.viewport.h}`) : 'page = viewport at every size and state');
  b = bad(all, r => !r.m.lost.length);
  line(!b.length, 'every control inside the screen and not cut by a box', b.length ? list(b, r => r.m.lost.join(', ')) : 'yes, at every size and state');
  b = bad(all, r => !r.m.overlaps.length);
  line(!b.length, 'no region lies over another', b.length ? list(b, r => r.m.overlaps.join(', ')) : 'toolbar, strips, board, actions, context, moves and bar apart');
  b = bad(all, r => r.m.target.whole);
  line(!b.length, 'the newest move (in review: the viewed move) shows whole', b.length ? list(b, r => r.m.target.name) : [...new Set(all.map(r => r.m.target.name))].join(', '));
  b = bad(all, r => r.m.context.fits);
  line(!b.length, 'the context area shows all its text, with no scroll', b.length ? list(b, r => `needs ${r.m.context.need} px, has ${r.m.context.has}`) : 'every note, card, step and question');
  const touch = all.filter(r => r.touch);
  b = bad(touch, r => Math.min(r.m.smallest[0].w, r.m.smallest[0].h) >= 44);
  line(!b.length, 'touch sizes: every control at least 44 x 44 px', b.length ? list(b, r => r.m.smallest.filter(c => Math.min(c.w, c.h) < 44).map(c => `${c.name} ${c.w}x${c.h}`).join(', '))
    : Object.keys(SIZES).filter(k => SIZES[k].touch).map(k => `${k} ${Math.min(...touch.filter(r => r.size === k).map(r => Math.min(r.m.smallest[0].w, r.m.smallest[0].h)))}`).join(', ') + ' px smallest');
  const moved = Object.keys(SIZES).map(size => {
    const rs = all.filter(r => r.size === size), first = rs[0].m;
    const delta = Math.max(...rs.flatMap(r => ['hint', 'undo'].map(k => !r.m[k] || !first[k] ? Infinity : Math.max(Math.abs(r.m[k].x - first[k].x), Math.abs(r.m[k].y - first[k].y), Math.abs(r.m[k].w - first[k].w), Math.abs(r.m[k].h - first[k].h)))));
    return { size, delta, at: first.hint && `${Math.round(first.hint.x)},${Math.round(first.hint.y)}` };
  });
  line(moved.every(m => m.delta === 0), `Hint and Undo at the same place in all ${STATES.length} states`, moved.map(m => `${m.size} ${m.delta === Infinity ? 'not found' : `${m.delta} px (Hint at ${m.at})`}`).join('; '));
  const pick = (size, fn) => all.filter(r => r.size === size).map(fn);
  const low = (size, k = 'square') => Math.min(...pick(size, r => r.m.board[k]));
  const fills = size => pick(size, r => r.m.board.y <= 0.5 && r.m.board.y + r.m.board.h >= r.m.viewport.h - 0.5).every(Boolean);
  line(low('phone') >= 45, '390x844: squares at least 45 px', `${low('phone')} px`);
  line(low('tablet', 'frame') >= 736, '820x1180: board at least 736 px wide', `frame ${low('tablet', 'frame')} px (image ${low('tablet', 'w')} px, squares ${low('tablet')} px)`);
  line(fills('landscape'), '844x390: the board fills the height', `board ${pick('landscape', r => `${r.m.board.y}-${+(r.m.board.y + r.m.board.h).toFixed(2)}`)[0]} of 390 px, squares ${low('landscape')} px`);
  line(pick('phone-safari', r => r.m.board.w >= r.m.viewport.w - 0.5).every(Boolean), '390x664 (Safari): the board gets the full width', `board ${low('phone-safari', 'w')} px, squares ${low('phone-safari')} px`);
  line(low('se-safari') >= 36.5, '375x550 (Safari): squares about 37 px (36.5 or more)', `${low('se-safari')} px (${[...new Set(pick('se-safari', r => r.m.board.square))].join(' / ')})`);
  line(fills('se-landscape'), '667x375: the board fills the height', `squares ${low('se-landscape')} px`);
  b = bad(all, r => !r.m.cinzelSmall.length);
  line(!b.length, 'Cinzel only at 18 px and larger', b.length ? list(b, r => r.m.cinzelSmall.map(t => `${t.text} ${t.px}px`).join(', ')) : [...new Set(all.flatMap(r => r.m.cinzelUsed))].join('; '));
  b = bad(all, r => r.m.bodyPx === 16 && r.m.paragraphs.every(px => px === 16) && !r.m.smallText.length);
  line(!b.length, 'body text 16 px (no text under 14 px)', b.length ? list(b, r => `body ${r.m.bodyPx}px, p ${r.m.paragraphs.join('/')}, small ${r.m.smallText.map(t => `${t.text} ${t.px}px`).join(', ')}`) : 'body and every paragraph 16 px');
  b = bad(all, r => !r.m.lowContrast.length);
  line(!b.length, 'text contrast 4.5:1 (3:1 for large text; off controls aside)', b.length ? list(b, r => r.m.lowContrast.join(', ')) : `lowest ${[...new Set(all.map(r => r.m.lowestContrast))].sort((p, q) => parseFloat(p.split(' ').at(-1)) - parseFloat(q.split(' ').at(-1)))[0]}`);
  b = bad(all, r => !r.m.kindless.length);
  line(!b.length, 'three button kinds plus an icon button', b.length ? list(b, r => r.m.kindless.join(', ')) : `kinds in use: ${[...new Set(all.flatMap(r => r.m.kindsUsed))].join(', ')}`);
  b = bad(all, r => r.m.crimson.length <= 1);
  line(!b.length, 'crimson only for the one main action', b.length ? list(b, r => r.m.crimson.join(', ')) : `at most one per view (${[...new Set(all.flatMap(r => r.m.crimson))].join(', ') || 'none'})`);
  b = bad(main.filter(r => !r.touch || r.size === 'tablet'), r => !r.m.order);
  line(!b.length, 'keyboard order goes down the rail (desktop, laptop, tablet)', b.length ? list(b, r => r.m.order) : 'toolbar, opponent, actions, context, moves, you');
  // WCAG 1.4.12 on the five review sizes: with the reader's text spacing, nothing is lost.
  b = bad(spaced.filter(r => r.main), r => !r.m.lost.length && !r.m.overlaps.length && r.m.context.reachable && r.m.scroll.w <= r.m.viewport.w);
  line(!b.length, 'with WCAG 1.4.12 text spacing: no control or text lost', b.length ? list(b, r => [...r.m.lost, ...r.m.overlaps, r.m.context.reachable ? '' : 'context cut'].filter(Boolean).join(', '))
    : `${spaced.filter(r => r.main && !r.m.context.fits).length} of ${spaced.filter(r => r.main).length} views scroll their context area`);
  return failed;
}

/** One contact sheet per state: the five sizes, then the phones with browser bars, labelled; idle adds the W11 B trail. */
async function sheet(browser, out, state, results) {
  const k = 0.5, gap = 32;
  const cell = async ([size, s]) => {
    const png = (await readFile(`${out}/${state}-${size}.png`)).toString('base64');
    const m = results[size][state];
    return `<figure style="width:${s.width * k}px"><img src="data:image/png;base64,${png}" style="width:${s.width * k}px;height:${s.height * k}px">
      <figcaption><b>${size[0].toUpperCase() + size.slice(1)} ${s.width}×${s.height}</b><br>squares ${m.board.square.toFixed(1)} px${m.hint ? ` · Hint at ${Math.round(m.hint.x)},${Math.round(m.hint.y)}` : ''}</figcaption></figure>`;
  };
  const row = async filter => (await Promise.all(Object.entries(SIZES).filter(([, s]) => filter(s)).map(cell))).join('');
  const width = Object.values(SIZES).filter(s => s.main).reduce((w, s) => w + s.width * k + gap, gap);
  const trail = state === 'idle' ? `<h2>Last move, decision W11 B: the trail from h6 fades in 1.2 s</h2>
    <img src="data:image/webp;base64,${(await readFile(new URL('./boards/trail.webp', import.meta.url))).toString('base64')}" style="width:916px">
    <p>Left to right: 0.1 s, 0.5 s and 0.9 s after the move, then at rest. At rest the board marks only e6, the square the queen reached (the renders above).</p>` : '';
  const page = await browser.newPage({ viewport: { width, height: 400 } });
  await page.setContent(`<body style="margin:0;padding:${gap}px;background:#d8d2bf;font:15px/1.4 system-ui;color:#2b2621">
    <h1 style="margin:0 0 16px;font-size:20px">Game screen sample · state: ${state}</h1>
    <div class="row">${await row(s => s.main)}</div>
    <h2>Phones with the browser bars, and the iPhone SE</h2>
    <div class="row">${await row(s => !s.main)}</div>${trail}
    <style>.row{display:flex;gap:${gap}px;align-items:flex-start}h2{margin:32px 0 16px;font-size:17px}p{margin:8px 0 0}
      figure{margin:0}img{display:block;box-shadow:0 2px 10px rgba(0,0,0,.25)}figcaption{margin-top:8px}</style></body>`);
  await page.screenshot({ path: `${out}/sheet-${state}.png`, fullPage: true });
  await page.close();
}
