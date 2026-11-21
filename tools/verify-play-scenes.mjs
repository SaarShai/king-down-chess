// Check the play scenes at four sizes and two text scales. Find cut and split text, horizontal
// viewport overflow, overlap in bars and dialogs, controls that cannot take a tap, and network requests.
// The page is in a build only with KINGDOWN_TEST_PAGES=1:
//   KINGDOWN_TEST_PAGES=1 npm run check:browser play-scenes
// Save pictures of faults, 320x568 at 150%, and 390x844 and 1280x800 at 100% in PLAYABLE_OUT.
import { env, launch, shot } from './lib/checks.mjs';
import { KNOWN } from './play-scenes-known.mjs';

const SIZES = [[320, 568], [360, 640], [390, 844], [1280, 800]], SCALES = [100, 150];
const ROLES = ['button', 'link', 'switch', 'radio', 'checkbox', 'tab', 'menuitem', 'option', 'slider', 'textbox', 'combobox'];
const SENTINEL = 'kingdown-scene-sentinel';

const base = new URL('play-scenes.html', env('PLAYABLE_URL'));
const browser = await launch();
const faults = [], known = [], used = new Set();
let links;
try {
  for (const [width, height] of SIZES) for (const scale of SCALES) {
    const context = await browser.newContext({
      viewport: { width, height }, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block', hasTouch: width < 1000,
    });
    try {
      if (scale !== 100) await context.addInitScript(scale => new MutationObserver((_, watch) => {
        if (document.documentElement) { document.documentElement.style.fontSize = `${scale}%`; watch.disconnect(); }
      }).observe(document, { childList: true }), scale);
      let state;
      if (!links) {
        // Cache and worker state depends only on the scene, so check it in the first context.
        const origin = await context.newPage();
        links = (await origin.goto(base.href))?.ok() ? await origin.getByRole('link').evaluateAll(list => list.map(a => new URL(a.href).searchParams.get('scene')).filter(Boolean)) : [];
        if (!links.length) throw new Error(`${base.href} has no scenes: build with KINGDOWN_TEST_PAGES=1`);
        await origin.goto(new URL('/manifest.webmanifest', base).href);
        state = seed => origin.evaluate(async ({ name, seed }) => {
          if (seed) await caches.open(name);
          return JSON.stringify([await caches.keys(), (await navigator.serviceWorker.getRegistrations()).map(r => r.scope)]);
        }, { name: SENTINEL, seed });
      }
      for (const scene of links) {
        const where = `${scene} ${width}x${height} ${scale}%`, found = [];
        const picture = `${scene}-${width}x${height}-${scale}`;
        let pictured = false;
        const before = await state?.(true);
        const page = await context.newPage();
        const onRequest = request => {
          const url = new URL(request.url());
          if (url.origin !== base.origin || url.pathname.startsWith('/api/')) found.push(`request to ${url.origin}${url.pathname}`);
        };
        context.on('request', onRequest);
        page.on('pageerror', error => found.push(`page error: ${error.message}`));
        try {
          await page.goto(`${base.href}?scene=${scene}`);
          await page.waitForFunction(scene => document.body.dataset.sceneReady === scene, scene, { timeout: 15_000 });
          found.push(...await page.evaluate(cutText), ...await page.evaluate(layoutFaults, ROLES));
          if (found.length || width === 320 && scale === 150 || scale === 100 && (width === 390 || width === 1280)) {
            await shot(page, picture);
            pictured = true;
          }
          for (const role of ROLES) for (const control of await page.getByRole(role).all()) {
            if (!await control.isVisible() || await control.isDisabled() || await control.evaluate(outsideLayer)) continue;
            const label = `${role} "${(await control.getAttribute('aria-label') ?? await control.innerText()).trim().slice(0, 40)}"`;
            const cut = await control.evaluate(cutBy);
            if (cut) found.push(`${label} is cut by ${cut}`);
            try { await control.click({ trial: true, timeout: 1500 }); }
            catch (error) { found.push(`${label} takes no tap: ${/intercepts pointer events/.test(error.message) ? `${error.message.match(/<\w+[^>]*>/g)?.at(-1) ?? 'an element'} covers it` : error.message.split('\n')[0]}`); }
          }
        } catch (error) { found.push(error.message.split('\n')[0]); }
        const after = await state?.(false);
        if (state && (after !== before || !after.includes(SENTINEL))) found.push(`the origin's caches and service workers change: ${before} before, ${after} after`);
        if (found.length && !pictured) await shot(page, picture).catch(() => {});
        await page.close();
        context.off('request', onRequest);
        const lines = [...new Set(found)], reasons = lines.map(line => KNOWN.get(`${where}: ${line}`));
        lines.forEach((line, i) => reasons[i] && used.add(`${where}: ${line}`));
        if (lines.length) (reasons.every(Boolean) ? known : faults).push(`${where}:\n    ${lines.map((line, i) => reasons[i] ? `${line} (known: ${reasons[i]})` : line).join('\n    ')}`);
      }
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
for (const mark of KNOWN.keys()) if (!used.has(mark)) faults.push(`known mark matches no fault: ${mark}`);
for (const line of known) console.log(`known fault: ${line}`);
if (faults.length) { console.error(`play scenes: ${faults.length} case(s) fail\n  ${faults.join('\n  ')}`); process.exit(1); }
console.log(`play scenes: all ${links.length * SIZES.length * SCALES.length} cases pass`);

/** In the page: a control must be active in this layer and visible without keyboard focus. */
function outsideLayer(node) { const modal = document.querySelector('dialog:modal'); return !!node.closest('[inert], .shell-skip:not(:focus)') || !!modal && !modal.contains(node); }

/** In the page: the box that clips part of this control, if any (a scroll box can show all of it). */
function cutBy(control) {
  let box = control.getBoundingClientRect();
  for (let node = control.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node), edge = node.getBoundingClientRect();
    if (/auto|scroll/.test(style.overflowX + style.overflowY)) { box = edge; continue; }
    if (/hidden|clip/.test(style.overflowX + style.overflowY) && (box.left < edge.left - 1 || box.right > edge.right + 1 || box.top < edge.top - 1 || box.bottom > edge.bottom + 1)) return `${node.tagName.toLowerCase()}.${[...node.classList].join('.')}`;
  }
  return '';
}

/** In the page: horizontal viewport overflow and overlaps between visible text and controls. */
function layoutFaults(roles) {
  const out = [], range = document.createRange(), modal = document.querySelector('dialog:modal');
  const width = document.documentElement.clientWidth;
  const bars = 'header, footer, nav, [role="toolbar"], .home-secondary-actions, .play-opp, .play-own, .play-turn';
  const hidden = '[inert], .kd-sr, .shell-skip:not(:focus), script, style';
  const shown = node => (!modal || modal.contains(node)) && !node.closest(hidden) &&
    node.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  const short = label => label.trim().split('\n', 1)[0].slice(0, 40).trimEnd();
  const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  // A local scroll box can show its contents. Measure only what it shows at the current scroll position.
  const visibleBox = (box, node) => {
    let { left, right, top, bottom } = box;
    for (; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
      const edge = node.getBoundingClientRect();
      if (style.overflowX !== 'visible') { left = Math.max(left, edge.left); right = Math.min(right, edge.right); }
      if (style.overflowY !== 'visible') { top = Math.max(top, edge.top); bottom = Math.min(bottom, edge.bottom); }
    }
    return right - left > 1 && bottom - top > 1 ? { left, right, top, bottom } : null;
  };
  const groups = new Map(), switches = [];
  const add = (host, label, boxes, node = host) => {
    if (boxes.some(box => box.left < -1)) out.push(`${label} crosses the left viewport edge`);
    if (boxes.some(box => box.right > width + 1)) out.push(`${label} crosses the right viewport edge`);
    const group = modal ?? host.closest(bars);
    if (!group || !boxes.length || host.closest('.kd-switch-indicator')) return;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ node, label, boxes });
  };
  const selector = ['button', 'a[href]', 'input:not([type="hidden"])', 'select', 'textarea', ...roles.map(role => `[role="${role}"]`)].join(', ');
  for (const control of document.querySelectorAll(selector)) {
    if (!shown(control)) continue;
    const label = short(control.getAttribute('aria-label') ??
      document.getElementById(control.getAttribute('aria-labelledby'))?.textContent ??
      control.innerText ?? '');
    const box = visibleBox(control.getBoundingClientRect(), control.parentElement);
    if (box) add(control, `control "${label}"`, [box]);
    const mark = control.querySelector('.kd-switch-indicator');
    if (mark) {
      const track = visibleBox(mark.getBoundingClientRect(), mark.parentElement);
      if (track) switches.push({ control, mark, track, label });
    }
  }
  const walk = document.createTreeWalker(modal ?? document.body, NodeFilter.SHOW_TEXT);
  for (let leaf; (leaf = walk.nextNode());) {
    const host = leaf.parentElement, words = leaf.textContent.trim();
    if (!words || !shown(host)) continue;
    range.selectNodeContents(leaf);
    const boxes = [...range.getClientRects()].map(rect => visibleBox({
      left: rect.left, right: rect.right, top: rect.top + rect.height / 4, bottom: rect.bottom - rect.height / 4,
    }, host)).filter(Boolean);
    const label = `text "${short(words)}"`;
    add(host, label, boxes, leaf);
    for (const { control, mark, track, label: name } of switches) {
      if (control.parentElement.contains(host) && !mark.contains(host) && boxes.some(box => overlaps(box, track))) {
        out.push(`${label} goes over switch "${name}"`);
      }
    }
  }
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
      const a = group[i], b = group[j];
      if (a.node.contains(b.node) || b.node.contains(a.node)) continue;
      if (a.boxes.some(box => b.boxes.some(other => overlaps(box, other)))) out.push(`${a.label} overlaps ${b.label}`);
    }
  }
  return out;
}

/** In the page: text that a clipping box cuts, and words that break over two lines. A scroll box can show its text. */
function cutText() {
  const out = [], modal = document.querySelector('dialog:modal'), walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), range = document.createRange();
  const name = node => `${node.tagName.toLowerCase()}${node.className && typeof node.className === 'string' ? `.${node.className.trim().split(/\s+/).join('.')}` : ''}`;
  for (let text; (text = walk.nextNode());) {
    const host = text.parentElement, words = text.textContent.trim();
    if (!words || host.closest('[inert], [aria-hidden="true"], script, style') || modal && !modal.contains(host) || !host.checkVisibility({ visibilityProperty: true })) continue;
    range.selectNodeContents(text);
    // Each line, less a quarter of its height at the top and the bottom: a tall font box may pass its line box.
    let lines = [...range.getClientRects()].filter(r => r.width >= 2 && r.height >= 2).map(r => ({ left: r.left, right: r.right, top: r.top + r.height / 4, bottom: r.bottom - r.height / 4 }));
    if (!lines.length) continue;
    for (let node = host; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node), edge = node.getBoundingClientRect();
      if (edge.width <= 2 || edge.height <= 2) break; // a text for screen readers only
      if (/auto|scroll/.test(style.overflowX + style.overflowY)) { lines = [edge]; continue; }
      if (/hidden|clip/.test(style.overflowX + style.overflowY) && lines.some(box => box.left < edge.left - 1 || box.right > edge.right + 1 || box.top < edge.top - 1 || box.bottom > edge.bottom + 1)) { out.push(`text "${words.slice(0, 40)}" is cut by ${name(node)}`); break; }
    }
    // The browser can wrap at a hyphen. Check the parts between legal breaks.
    for (const word of text.textContent.matchAll(/[^\s\u00ad\u2010-]+/g)) {
      range.setStart(text, word.index); range.setEnd(text, word.index + word[0].length);
      if (new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top / 4))).size > 1) out.push(`word "${word[0]}" breaks over two lines in ${name(host)}`);
    }
  }
  return out;
}
