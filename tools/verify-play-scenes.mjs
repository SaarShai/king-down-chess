// The play screen scenes (play-scenes.html, src/interface/play/scenes.ts) at four sizes and two text scales. For each:
// no cut or split text, no text over the state and track of a switch in the same tile, no cut control, no control that a different element covers, each control takes a tap (a trial click), and no
// request to /api or to a different host. The page is in a build only with KINGDOWN_TEST_PAGES=1:
//   KINGDOWN_TEST_PAGES=1 npm run check:browser play-scenes
// Pictures at 390x844 and 1280x800 (text scale 100%) go to PLAYABLE_OUT.
import { env, launch, shot } from './lib/checks.mjs';

const SIZES = [[320, 568], [360, 640], [390, 844], [1280, 800]], SCALES = [100, 150];
const ROLES = ['button', 'link', 'switch', 'radio', 'checkbox', 'tab', 'menuitem', 'option', 'slider', 'textbox', 'combobox'];
// Faults that the check found on the head and that the lead decides. Each mark is one case and one fault line:
// "<scene> <size> <scale>: <line>". A case with only marked faults passes and prints them. A mark that matches no
// fault in the run fails the check: remove the mark when the fault is repaired.
const cases = (scenes, sizes, scales = SCALES) => scenes.flatMap(scene => sizes.flatMap(([width, height]) => scales.map(scale => `${scene} ${width}x${height} ${scale}%`)));
const NAME = `"${'w'.repeat(20)}"`, ONLINE = ['online-loss', 'online-loss-offer'];
const KNOWN = new Map([
  [cases(ONLINE, [[320, 568]]), `text ${NAME} is cut by span.play-opponent-name`, 'the bar cuts a 20-letter name with an ellipsis at 320 px (design choice?)'],
].flatMap(([where, line, reason]) => where.map(where => [`${where}: ${line}`, reason])));
const SENTINEL = 'kingdown-scene-sentinel';

const base = new URL('play-scenes.html', env('PLAYABLE_URL'));
const browser = await launch();
const faults = [], known = [], used = new Set();
try {
  const index = await browser.newPage();
  const links = (await index.goto(base.href))?.ok() ? await index.getByRole('link').evaluateAll(list => list.map(a => new URL(a.href).searchParams.get('scene')).filter(Boolean)) : [];
  await index.close();
  if (!links.length) throw new Error(`${base.href} has no scenes: build with KINGDOWN_TEST_PAGES=1`);
  for (const scene of links) for (const [width, height] of SIZES) for (const scale of SCALES) {
    const where = `${scene} ${width}x${height} ${scale}%`, found = [];
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', serviceWorkers: 'block', hasTouch: width < 1000 });
    context.on('request', request => { const url = new URL(request.url()); if (url.origin !== base.origin || url.pathname.startsWith('/api/')) found.push(`request to ${url.origin}${url.pathname}`); });
    // A second page of the origin makes a cache that the scene must leave, then reads the caches and workers again.
    const origin = await context.newPage(), state = () => origin.evaluate(async () => JSON.stringify([await caches.keys(), (await navigator.serviceWorker.getRegistrations()).map(r => r.scope)]));
    await origin.goto(new URL('/manifest.webmanifest', base).href);
    await origin.evaluate(name => caches.open(name), SENTINEL);
    const before = await state();
    const page = await context.newPage();
    page.on('pageerror', error => found.push(`page error: ${error.message}`));
    if (scale !== 100) await page.addInitScript(scale => new MutationObserver((_, watch) => { if (document.documentElement) { document.documentElement.style.fontSize = `${scale}%`; watch.disconnect(); } }).observe(document, { childList: true }), scale);
    try {
      await page.goto(`${base.href}?scene=${scene}`);
      await page.waitForFunction(() => document.body.dataset.sceneReady, null, { timeout: 15_000 });
      if (scale === 100 && (width === 390 || width === 1280)) await shot(page, `${scene}-${width}x${height}`);
      found.push(...await page.evaluate(cutText), ...await page.evaluate(overSwitch));
      for (const role of ROLES) for (const control of await page.getByRole(role).all()) {
        if (!await control.isVisible() || await control.isDisabled() || await control.evaluate(outsideLayer)) continue;
        const label = `${role} "${(await control.getAttribute('aria-label') ?? await control.innerText()).trim().slice(0, 40)}"`;
        const cut = await control.evaluate(cutBy);
        if (cut) found.push(`${label} is cut by ${cut}`);
        try { await control.click({ trial: true, timeout: 1500 }); }
        catch (error) { found.push(`${label} takes no tap: ${/intercepts pointer events/.test(error.message) ? `${error.message.match(/<\w+[^>]*>/g)?.at(-1) ?? 'an element'} covers it` : error.message.split('\n')[0]}`); }
      }
    } catch (error) { found.push(error.message.split('\n')[0]); }
    const after = await state();
    if (after !== before || !after.includes(SENTINEL)) found.push(`the origin's caches and service workers change: ${before} before, ${after} after`);
    await context.close();
    const lines = [...new Set(found)], reasons = lines.map(line => KNOWN.get(`${where}: ${line}`));
    lines.forEach((line, i) => reasons[i] && used.add(`${where}: ${line}`));
    if (lines.length) (reasons.every(Boolean) ? known : faults).push(`${where}:\n    ${lines.map((line, i) => reasons[i] ? `${line} (known: ${reasons[i]})` : line).join('\n    ')}`);
  }
} finally { await browser.close(); }
for (const mark of KNOWN.keys()) if (!used.has(mark)) faults.push(`known mark matches no fault: ${mark}`);
for (const line of known) console.log(`known fault: ${line}`);
if (faults.length) { console.error(`play scenes: ${faults.length} case(s) fail\n  ${faults.join('\n  ')}`); process.exit(1); }
console.log('play scenes: all cases pass');

/** In the page: a control behind an open modal layer, or in inert content, is not a control of this state. */
function outsideLayer(node) { const modal = document.querySelector('dialog:modal'); return !!node.closest('[inert]') || !!modal && !modal.contains(node); }

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

/** In the page: text of a switch tile (the switch's parent) that goes over the switch's state and track: a tap there changes the switch. */
function overSwitch() {
  const out = [], range = document.createRange();
  for (const control of document.querySelectorAll('[role="switch"]')) {
    const mark = control.querySelector('.kd-switch-indicator')?.getBoundingClientRect(), walk = document.createTreeWalker(control.parentElement, NodeFilter.SHOW_TEXT);
    if (!mark?.width || !control.checkVisibility()) continue;
    for (let text; (text = walk.nextNode());) {
      if (!text.textContent.trim() || control.querySelector('.kd-switch-indicator').contains(text)) continue;
      range.selectNodeContents(text);
      if ([...range.getClientRects()].some(r => r.right > mark.left + 1 && r.left < mark.right - 1 && r.bottom > mark.top + 1 && r.top < mark.bottom - 1)) out.push(`text "${text.textContent.trim().slice(0, 40)}" goes over switch "${control.getAttribute('aria-label') ?? control.innerText.trim()}"`);
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
    for (const word of text.textContent.matchAll(/\S+/g)) {
      range.setStart(text, word.index); range.setEnd(text, word.index + word[0].length);
      if (new Set([...range.getClientRects()].filter(r => r.width > 0).map(r => Math.round(r.top / 4))).size > 1) out.push(`word "${word[0]}" breaks over two lines in ${name(host)}`);
    }
  }
  return out;
}
