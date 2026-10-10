// Shared module for the browser checks (checks-and-hooks/05). This header is the reference for check authors.
// Self-test: node tools/check-selftest.mjs (needs no server). Unit test of env: tools/lib/checks.test.ts.
//
// Settings
//   env(name)                 One of the three settings. A set environment variable wins; else the default:
//                               PLAYABLE_URL      http://127.0.0.1:5189/
//                               PLAYABLE_OUT      <outRoot>/by-hand/<check>, <check> is the script name without "verify-"
//                               PLAYABLE_BROWSER  chromium when CLAUDE_CODE_REMOTE is "true", else chrome
//                             An unknown name throws.
//   outRoot                   The parent of the runner's output folders: <system temp folder>/kingdown-check-runs, never
//                             in a checkout. The runner makes one folder a run under it (after-redesign/01).
//   isInside(folder, path)    True when `path` is `folder` or a path inside it, after symbolic links resolve. A part
//                             of `path` that does not exist yet stays as it is. The runner and the sample tool
//                             (docs/specs/web-ux/capture.mjs) refuse an output folder inside the checkout with it.
//   launch(options = {})      Opens the PLAYABLE_BROWSER channel; `options` go to Playwright's chromium.launch.
//
// Errors
//   trapErrors(page, allow = [])
//                             Collects the page errors and console errors of `page`. Each `allow` item is
//                             { pattern, reason }: a message that `pattern` (RegExp or string) matches is allowed.
//                             An item with no reason throws. Returns the list of other errors for that page.
//   assertNoErrors(errors = <all trapped pages>)
//                             Throws and lists the errors when the list is not empty.
//
// Assertions. Each one is async, takes (page, selector, ...) and checks every element that the selector matches.
// A failure throws an Error that names the assertion, the selector, the viewport (WxH) and the box (x y w h).
// A selector that matches no element (no rendered element, for the layout assertions) fails.
//   noSidewaysScroll(page, selector = 'html')     The content is not wider than the element (1 px tolerance).
//   insideViewport(page, selector)                The box is inside the viewport on both axes (1 px tolerance).
//   noOverlap(page, selector)                     No two matches overlap by more than 1 px; a match inside another is not counted.
//   textNotCut(page, selector)                    The content fits the element: no cut and no ellipsis.
//   minTarget(page, selector, min = 44)           The box is at least `min` px wide and `min` px high.
//   noRunningAnimations(page, selector = 'html')  No animation runs on the element or inside it. A paused animation is not running.
//   imageIs(page, selector, name)                 The resolved image path (img source or CSS background) ends with `name`,
//                                                 such as 'ui/workshop/clay-golem-w.webp'. It passes under a relative and an absolute base.
//
// Files
//   shot(page, name, options = {})
//                             Writes a screenshot to PLAYABLE_OUT/<name>.png (or the .jpg or .png name you give) and
//                             returns the path. A name that goes outside PLAYABLE_OUT throws. `options` go to page.screenshot.
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { mkdirSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

/** The parent of the runner's output folders: one fixed system temp folder, outside every checkout. */
export const outRoot = join(tmpdir(), 'kingdown-check-runs');

/** The real path: symbolic links resolve; a part that does not exist yet stays as it is. */
const real = path => { try { return realpathSync(path); } catch { return dirname(path) === path ? path : join(real(dirname(path)), basename(path)); } };

export function isInside(folder, path) {
  const rel = relative(real(resolve(folder)), real(resolve(path)));
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

/** The check's short name: its script name without the folder, the extension and `verify-`. */
const checkName = () => basename(process.argv[1] ?? 'check').replace(/\.[^.]+$/, '').replace(/^verify-/, '');

const defaults = {
  PLAYABLE_URL: () => 'http://127.0.0.1:5189/',
  PLAYABLE_OUT: () => join(outRoot, 'by-hand', checkName()),
  PLAYABLE_BROWSER: () => (process.env.CLAUDE_CODE_REMOTE === 'true' ? 'chromium' : 'chrome'),
};

export function env(name) {
  if (!(name in defaults)) throw new Error(`env: unknown setting ${name}; known: ${Object.keys(defaults).join(', ')}`);
  return process.env[name] || defaults[name]();
}

/** Opens the browser channel that PLAYABLE_BROWSER names. */
export const launch = (options = {}) => chromium.launch({ channel: env('PLAYABLE_BROWSER'), ...options });

/** Measures the viewport and each element that matches the selector. */
const measure = (page, selector) => page.evaluate(sel => {
  const els = [...document.querySelectorAll(sel)];
  return {
    viewport: { w: innerWidth, h: innerHeight },
    items: els.map((e, i) => {
      const r = e.getBoundingClientRect();
      return {
        i, x: r.x, y: r.y, w: r.width, h: r.height,
        scrollW: e.scrollWidth, clientW: e.clientWidth, scrollH: e.scrollHeight, clientH: e.clientHeight,
        within: els.flatMap((o, j) => (o !== e && o.contains(e) ? [j] : [])),
        running: e.getAnimations({ subtree: true }).filter(a => a.playState === 'running').map(a => a.animationName || a.id || 'a script animation'),
        src: e.currentSrc || e.src || getComputedStyle(e).backgroundImage.match(/url\("?(.*?)"?\)/)?.[1] || null,
      };
    }),
  };
}, selector);

const boxText = b => `box x=${Math.round(b.x)} y=${Math.round(b.y)} w=${Math.round(b.w)} h=${Math.round(b.h)}`;
const fail = (name, selector, viewport, box, detail) => {
  throw new Error(`${name}: "${selector}" at viewport ${viewport.w}x${viewport.h}, ${box ? boxText(box) : 'box none'}: ${detail}`);
};

/** The rendered matches (a zero box is not rendered); fails when there is none. */
async function rendered(name, page, selector) {
  const m = await measure(page, selector);
  const items = m.items.filter(b => b.w > 0 || b.h > 0);
  if (!items.length) fail(name, selector, m.viewport, null, 'no rendered element matches');
  return { ...m, items };
}

export async function minTarget(page, selector, min = 44) {
  const m = await rendered('minTarget', page, selector);
  for (const b of m.items) if (b.w < min - 0.5 || b.h < min - 0.5) fail('minTarget', selector, m.viewport, b, `smaller than ${min} px`);
}

export async function noSidewaysScroll(page, selector = 'html') {
  const m = await rendered('noSidewaysScroll', page, selector);
  for (const b of m.items) if (b.scrollW > b.clientW + 1) fail('noSidewaysScroll', selector, m.viewport, b, `content is ${b.scrollW} px wide in ${b.clientW} px`);
}

export async function insideViewport(page, selector) {
  const m = await rendered('insideViewport', page, selector);
  const { w, h } = m.viewport;
  for (const b of m.items) {
    if (b.x < -1 || b.x + b.w > w + 1) fail('insideViewport', selector, m.viewport, b, 'outside the viewport on the x axis');
    if (b.y < -1 || b.y + b.h > h + 1) fail('insideViewport', selector, m.viewport, b, 'outside the viewport on the y axis');
  }
}

export async function noOverlap(page, selector) {
  const m = await rendered('noOverlap', page, selector);
  for (const a of m.items) for (const b of m.items) {
    if (b.i <= a.i || a.within.includes(b.i) || b.within.includes(a.i)) continue;
    const across = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
    const down = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (across > 1 && down > 1) fail('noOverlap', selector, m.viewport, a, `overlaps ${boxText(b)} (matches ${a.i + 1} and ${b.i + 1})`);
  }
}

export async function textNotCut(page, selector) {
  const m = await rendered('textNotCut', page, selector);
  for (const b of m.items) {
    if (b.scrollW > b.clientW + 1 || b.scrollH > b.clientH + 1) fail('textNotCut', selector, m.viewport, b, `content ${b.scrollW}x${b.scrollH} px does not fit in ${b.clientW}x${b.clientH} px`);
  }
}

export async function noRunningAnimations(page, selector = 'html') {
  const m = await measure(page, selector);
  if (!m.items.length) fail('noRunningAnimations', selector, m.viewport, null, 'no element matches');
  for (const b of m.items) if (b.running.length) fail('noRunningAnimations', selector, m.viewport, b, `running: ${b.running.join(', ')}`);
}

/** Passes when the resolved image path (an img source or a CSS background) ends with `name`, such as `ui/workshop/clay-golem-w.webp`. */
export async function imageIs(page, selector, name) {
  const m = await measure(page, selector);
  if (!m.items.length) fail('imageIs', selector, m.viewport, null, 'no element matches');
  const end = `/${name.replace(/^\.?\//, '')}`;
  for (const b of m.items) {
    const path = b.src ? decodeURIComponent(new URL(b.src).pathname) : null;
    if (!path?.endsWith(end)) fail('imageIs', selector, m.viewport, b, `image ${path ?? 'none'} does not end with ${end}`);
  }
}

/** Every list that trapErrors made, so that assertNoErrors() with no argument checks all pages. */
const trapped = [];

/** Collects the page errors and console errors of `page` that no allowed pattern matches. */
export function trapErrors(page, allow = []) {
  for (const a of allow) if (!a.reason?.trim()) throw new Error(`trapErrors: the allowed pattern ${a.pattern} has no reason`);
  const errors = [];
  const add = (kind, text) => { if (!allow.some(a => new RegExp(a.pattern).test(text))) errors.push(`${kind}: ${text}`); };
  page.on('pageerror', e => add('pageerror', e.message));
  page.on('console', m => { if (m.type() === 'error') add('console.error', m.text()); });
  trapped.push(errors);
  return errors;
}

/** Fails when a trapped list (by default, all of them) holds an error. */
export function assertNoErrors(errors = trapped.flat()) {
  if (errors.length) throw new Error(`assertNoErrors: ${errors.length} unexpected error(s):\n  ${errors.join('\n  ')}`);
}

/** Writes a screenshot of `page` as `<name>.png` (or the extension that `name` gives) in PLAYABLE_OUT; refuses a path outside it. */
export async function shot(page, name, options = {}) {
  const out = env('PLAYABLE_OUT');
  const path = join(out, /\.(png|jpe?g)$/.test(name) ? name : `${name}.png`);
  const rel = relative(out, path);
  if (isAbsolute(name) || !rel || rel.startsWith('..') || isAbsolute(rel)) throw new Error(`shot: "${name}" is outside the out folder ${out}`);
  mkdirSync(dirname(path), { recursive: true });
  await page.screenshot({ ...options, path });
  return path;
}
export { tempRepo } from './temp-repo.mjs';
