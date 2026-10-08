// Render a demo's states and check them.
//
//   node docs/specs/web-ux/showcase/kit/capture.mjs <demo-id> [--video] [--states a,b] [--only phone|desktop]
//   node docs/specs/web-ux/showcase/kit/capture.mjs --serve        (serve the showcase and print the URL)
//
// It serves showcase/ on 127.0.0.1 (a free port), opens demos/<id>/index.html?bare=1 at phone size
// (390 x 844, touch) and at desktop size (1440 x 900), and for each name in meta.json "states" calls
// await window.demo.state(name), waits for the animations to end (3 s at most) and saves
// renders/<id>/<state>-<phone|desktop>.png. It checks each page and writes renders/<id>/checks.json.
// Exit code 1 when a check fails. --video records window.demo.play() at phone size: renders/<id>/play-phone.webm.
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SHOWCASE = fileURLToPath(new URL('../', import.meta.url));
const ROOT = fileURLToPath(new URL('../../../../../', import.meta.url));
const { chromium } = createRequire(ROOT + 'package.json')('playwright');

const args = process.argv.slice(2);
const flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const id = args.find((a, i) => !a.startsWith('--') && !['--states', '--only'].includes(args[i - 1]));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.webm': 'video/webm', '.mp4': 'video/mp4', '.ico': 'image/x-icon',
};

/** A static server for showcase/ only. */
export function serve(port = 0) {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(SHOWCASE, path));
    if (!file.startsWith(SHOWCASE.replace(/[\\/]$/, '') + sep) && file !== SHOWCASE.replace(/[\\/]$/, '')) { res.writeHead(403); return res.end(); }
    if (file.endsWith(sep) || path.endsWith('/')) file = join(file, 'index.html');
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('not found'); }
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve(server)));
}

function need() {
  const missing = [];
  if (!existsSync(SHOWCASE + 'assets/pieces')) missing.push('node docs/specs/web-ux/showcase/kit/sync-assets.mjs');
  if (!existsSync(SHOWCASE + 'kit/kd-engine.js')) missing.push('node docs/specs/web-ux/showcase/kit/build-engine.mjs');
  if (missing.length) { console.error(`First run:\n  ${missing.join('\n  ')}`); process.exit(1); }
}

/** meta.json: the fields the presentation reads. Faults stop the run; warnings are printed. */
function checkMeta(meta, demoId) {
  const faults = [], warnings = [];
  const str = k => typeof meta[k] === 'string' && meta[k].trim().length > 0;
  if (meta.id !== demoId) faults.push(`meta.id is "${meta.id}", the folder is "${demoId}"`);
  for (const k of ['title', 'summary']) if (!str(k)) faults.push(`meta.${k} is missing`);
  if (!['direction', 'feature', 'future'].includes(meta.group)) faults.push(`meta.group must be direction, feature or future (it is "${meta.group}")`);
  if (!Array.isArray(meta.states) || !meta.states.length || !meta.states.every(s => typeof s === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(s))) faults.push('meta.states must be a list of names in lower case (a-z, 0-9, -)');
  for (const k of ['problem', 'idea', 'recommendation']) if (!str(k)) warnings.push(`meta.${k} is missing`);
  if (meta.group === 'feature' && !str('feature')) warnings.push('meta.feature is missing');
  if (!Array.isArray(meta.borrows) || !meta.borrows.every(b => b && b.from && b.what)) warnings.push('meta.borrows should be a list of { from, what }');
  if (!Array.isArray(meta.options) || !meta.options.every(o => o && o.key && o.name && o.summary)) warnings.push('meta.options should be a list of { key, name, state, summary }');
  else for (const o of meta.options) if (o.state && !meta.states?.includes(o.state)) faults.push(`option ${o.key}: state "${o.state}" is not in meta.states`);
  for (const k of ['joy', 'ease']) if (!(Number.isInteger(meta[k]) && meta[k] >= 1 && meta[k] <= 5)) warnings.push(`meta.${k} should be 1 to 5`);
  if (!['S', 'M', 'L'].includes(meta.effort)) warnings.push('meta.effort should be S, M or L');
  if (meta.notes && !Array.isArray(meta.notes)) warnings.push('meta.notes should be a list of lines');
  return { faults, warnings };
}

// ---- in-page helpers (run in the browser) ----
async function settle() {
  const deadline = performance.now() + 3000;
  const left = () => Math.max(0, deadline - performance.now());
  const timeout = () => new Promise(r => setTimeout(r, left()));
  await Promise.race([document.fonts.ready, timeout()]);
  const pending = [...document.images].filter(i => !i.complete);
  await Promise.race([Promise.all(pending.map(i => new Promise(r => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); }))), timeout()]);
  let slow = false;
  for (;;) {
    const running = document.getAnimations().filter(a => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming?.().endTime));
    if (!running.length) break;
    if (!left()) { slow = true; break; }
    await Promise.race([Promise.all(running.map(a => a.finished.catch(() => {}))), timeout()]);
  }
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return { slow };
}

function inspectPage(phone) {
  const name = el => {
    const label = el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) || el.getAttribute('title') || '';
    return `<${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}> ${label}`.trim();
  };
  const doc = document.documentElement;
  const width = Math.max(doc.scrollWidth, document.body?.scrollWidth ?? 0);
  const out = { sideways: width > innerWidth + 1 ? { scrollWidth: width, viewport: innerWidth } : null, small: [], images: [] };
  if (phone) {
    const sel = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=switch], [role=tab], [role=checkbox], [role=radio], [role=menuitem], [role=option], [role=slider], [tabindex]:not([tabindex="-1"])';
    for (const el of document.querySelectorAll(sel)) {
      if (el.closest('[data-small-ok], [hidden], [inert], [aria-hidden="true"]')) continue;
      const st = getComputedStyle(el), r = el.getBoundingClientRect();
      if (!r.width || !r.height || st.visibility === 'hidden' || +st.opacity === 0) continue;
      // An inline link inside running text is the WCAG 2.5.8 exception.
      if (el.tagName === 'A' && st.display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 20) continue;
      let w = r.width, h = r.height;
      const label = el.closest('label');
      if (label) { const lr = label.getBoundingClientRect(); w = Math.max(w, lr.width); h = Math.max(h, lr.height); }
      if (w < 43.5 || h < 43.5) out.small.push(`${name(el)} (${Math.round(w)} x ${Math.round(h)} px)`);
    }
  }
  for (const img of document.images) if (img.getAttribute('src') && (!img.complete || img.naturalWidth === 0)) out.images.push(img.currentSrc || img.src);

  // Text contrast (WCAG 1.4.3), a warning only: text on solid colours. Text over an image, a gradient or
  // a see-through parent is skipped, and text placed over another element (the board) can read wrong.
  const rgba = c => { const m = /^rgba?\(([^)]+)\)$/.exec(c); if (!m) return null; const v = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return v.length >= 3 ? [v[0], v[1], v[2], v[3] ?? 1] : null; };
  const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const backdrop = el => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const st = getComputedStyle(n);
      if (+st.opacity < 1 || st.backgroundImage !== 'none') return null;
      const bg = rgba(st.backgroundColor);
      if (!bg) return null;
      if (bg[3] > 0) { layers.push(bg); if (bg[3] >= 1) break; }
    }
    return layers.reverse().reduce((under, top) => over(top, under), [255, 255, 255, 1]);
  };
  out.contrast = [];
  const seen = new Set();
  const walker = document.createTreeWalker(document.body ?? document.documentElement, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t; t = walker.nextNode()) {
    const el = t.parentElement, text = t.textContent.trim();
    if (!el || !text || seen.has(el) || el.closest('script, style, noscript, [hidden], :disabled, [aria-disabled="true"]')) continue;
    seen.add(el);
    const st = getComputedStyle(el), r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || st.visibility !== 'visible' || r.bottom < 0 || r.top > innerHeight) continue;
    const fg = rgba(st.color), bg = backdrop(el);
    if (!fg || !bg) continue;
    const [a, b] = [lum(over(fg, bg)), lum(bg)].sort((x, y) => y - x);
    const ratio = (a + 0.05) / (b + 0.05);
    const px = parseFloat(st.fontSize), large = px >= 24 || (px >= 18.66 && +st.fontWeight >= 700);
    const need = large ? 3 : 4.5;
    if (ratio < need) out.contrast.push(`"${text.slice(0, 40)}" ${ratio.toFixed(2)}:1, needs ${need}:1 (${st.color} on rgb(${bg.slice(0, 3).map(Math.round).join(', ')}))`);
  }
  return out;
}

// ---- run ----
async function capture(demoId) {
  need();
  const dir = SHOWCASE + `demos/${demoId}/`;
  if (!existsSync(dir + 'index.html')) { console.error(`No demo at demos/${demoId}/index.html`); process.exit(1); }
  let meta;
  try { meta = JSON.parse(readFileSync(dir + 'meta.json', 'utf8')); } catch (e) { console.error(`demos/${demoId}/meta.json: ${e.message}`); process.exit(1); }
  const metaCheck = checkMeta(meta, demoId);
  const only = opt('--only');
  const states = opt('--states')?.split(',') ?? meta.states ?? [];
  const outDir = SHOWCASE + `renders/${demoId}/`;
  mkdirSync(outDir, { recursive: true });

  const server = await serve(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const url = `${base}/demos/${demoId}/index.html?bare=1`;
  const browser = await chromium.launch(process.env.KD_BROWSER ? { channel: process.env.KD_BROWSER } : {});
  const report = { id: demoId, when: new Date().toISOString(), url: `/demos/${demoId}/index.html?bare=1`, meta: metaCheck, pages: [], video: null, ok: true };
  const faults = [...metaCheck.faults.map(f => `meta: ${f}`)];

  const VIEWS = [
    { name: 'phone', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    { name: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  ].filter(v => !only || v.name === only);

  for (const v of VIEWS) {
    const context = await browser.newContext({ viewport: v.viewport, deviceScaleFactor: v.deviceScaleFactor, isMobile: v.isMobile, hasTouch: v.hasTouch });
    const page = await context.newPage();
    const log = { console: [], errors: [], requests: [] };
    page.on('console', m => { if (m.type() === 'error') log.console.push(m.text()); });
    page.on('pageerror', e => log.errors.push(e.message));
    page.on('requestfailed', r => log.requests.push(`${r.failure()?.errorText ?? 'failed'} ${r.url().replace(base, '')}`));
    page.on('response', r => { if (r.status() >= 400) log.requests.push(`${r.status()} ${r.url().replace(base, '')}`); });
    const pageReport = { view: v.name, states: [], console: log.console, errors: log.errors, requests: log.requests };
    report.pages.push(pageReport);
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
      await page.waitForFunction(() => window.demo && typeof window.demo.state === 'function', null, { timeout: 15000 });
      const api = await page.evaluate(() => ['state', 'play', 'reset'].filter(k => typeof window.demo[k] !== 'function'));
      if (api.length) faults.push(`${v.name}: window.demo has no ${api.join(', ')}()`);
    } catch (e) {
      faults.push(`${v.name}: the page did not load or set window.demo (${e.message.split('\n')[0]})`);
      await context.close();
      continue;
    }
    for (const state of states) {
      const entry = { state, file: `${state}-${v.name}.png` };
      pageReport.states.push(entry);
      try {
        await page.evaluate(name => Promise.race([window.demo.state(name), new Promise((_, no) => setTimeout(() => no(new Error('state() took over 20 s')), 20000))]), state);
      } catch (e) { faults.push(`${v.name} ${state}: demo.state() failed: ${e.message.split('\n')[0]}`); }
      const { slow } = await page.evaluate(settle);
      if (slow) entry.warning = 'animations still ran after 3 s';
      await page.screenshot({ path: outDir + entry.file });
      const found = await page.evaluate(inspectPage, v.name === 'phone');
      Object.assign(entry, found);
      if (found.sideways) faults.push(`${v.name} ${state}: sideways scroll (${found.sideways.scrollWidth} px in ${found.sideways.viewport} px)`);
      for (const s of found.small) faults.push(`${v.name} ${state}: control under 44 px: ${s}`);
      for (const s of found.images) faults.push(`${v.name} ${state}: image did not load: ${s.replace(base, '')}`);
    }
    for (const m of log.console) faults.push(`${v.name}: console error: ${m.slice(0, 200)}`);
    for (const m of log.errors) faults.push(`${v.name}: page error: ${m.slice(0, 200)}`);
    for (const m of log.requests) faults.push(`${v.name}: request failed: ${m}`);
    await context.close();
  }

  if (flag('--video')) {
    const tmp = outDir + '.video/';
    rmSync(tmp, { recursive: true, force: true });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, recordVideo: { dir: tmp, size: { width: 390, height: 844 } } });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForFunction(() => window.demo && typeof window.demo.play === 'function', null, { timeout: 15000 });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => { await window.demo.reset?.(); });
      await page.waitForTimeout(400);
      await page.evaluate(() => Promise.race([window.demo.play(), new Promise((_, no) => setTimeout(() => no(new Error('play() took over 60 s')), 60000))]));
      await page.waitForTimeout(800);
    } catch (e) { faults.push(`video: ${e.message.split('\n')[0]}`); }
    const video = page.video();
    await context.close();
    if (video) { renameSync(await video.path(), outDir + 'play-phone.webm'); report.video = 'play-phone.webm'; }
    rmSync(tmp, { recursive: true, force: true });
  }

  await browser.close();
  server.close();
  report.ok = faults.length === 0;
  report.faults = faults;
  writeFileSync(outDir + 'checks.json', JSON.stringify(report, null, 2) + '\n');

  const shots = report.pages.reduce((n, p) => n + p.states.length, 0);
  console.log(`${demoId}: ${shots} renders in renders/${demoId}/${report.video ? ', video play-phone.webm' : ''}`);
  for (const w of metaCheck.warnings) console.log(`  warn  meta: ${w}`);
  for (const p of report.pages) for (const s of p.states) if (s.warning) console.log(`  warn  ${p.view} ${s.state}: ${s.warning}`);
  const low = new Set();
  for (const p of report.pages) for (const s of p.states) for (const c of s.contrast ?? []) low.add(`${p.view}: ${c}`);
  for (const c of low) console.log(`  warn  low text contrast, ${c}`);
  if (faults.length) { for (const f of faults) console.log(`  FAIL  ${f}`); console.log(`FAIL: ${faults.length} fault(s). See renders/${demoId}/checks.json`); process.exit(1); }
  console.log('PASS: no console or page errors, no failed requests, no sideways scroll, phone controls 44 px or more, all images loaded.');
}

const main = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!main) {
  // imported: only serve() is wanted
} else if (flag('--serve')) {
  const server = await serve(Number(opt('--port') ?? 0));
  console.log(`Serving ${SHOWCASE} at http://127.0.0.1:${server.address().port}/  (Ctrl+C stops)`);
} else if (!id) {
  console.error('usage: node docs/specs/web-ux/showcase/kit/capture.mjs <demo-id> [--video] [--states a,b] [--only phone|desktop]\n       node docs/specs/web-ux/showcase/kit/capture.mjs --serve [--port n]');
  process.exit(1);
} else {
  await capture(id);
}
