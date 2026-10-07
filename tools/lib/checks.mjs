// Shared module for the browser checks (checks-and-hooks/05).
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

/** The runner's output root: one fixed system temp folder, outside every checkout. */
export const outRoot = join(tmpdir(), 'kingdown-checks');

/** The check's short name: its script name without the folder, the extension and `verify-`. */
const checkName = () => basename(process.argv[1] ?? 'check').replace(/\.[^.]+$/, '').replace(/^verify-/, '');

const defaults = {
  PLAYABLE_URL: () => 'http://127.0.0.1:5189/',
  PLAYABLE_OUT: () => join(outRoot, checkName()),
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
