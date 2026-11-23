// Check the play scenes at four portrait and desktop sizes, two landscape phone sizes (game screen; at 667x375 the new-game panel too) and two text scales. Find cut and split text, horizontal
// viewport and scroll box overflow, reader text and controls that a scroll box hides at rest, overlap, card names that another card covers, controls that cannot take a tap, and network requests.
// The page is in a build only with KINGDOWN_TEST_PAGES=1:
//   KINGDOWN_TEST_PAGES=1 npm run check:browser play-scenes
// Check the result sheet at eight sizes and three text sizes.
// Save pictures of faults, 320x568 at 150%, and 390x844 and 1280x800 at 100% in PLAYABLE_OUT.
import { env, launch, shot } from './lib/checks.mjs';
import { KNOWN } from './play-scenes-known.mjs';
import { cutText } from './lib/cut-text.mjs';

// Landscape phones check the game screen and the new-game panel: online-loss cuts its 20-letter test
// name with an ellipsis, as the known mark at 320 px allows.
const gameScreen = scene => /^(online|solo)-/.test(scene) && !['online-loss', 'online-loss-offer'].includes(scene);
const withPanel = scene => gameScreen(scene) || ['new-game', 'setup-friend'].includes(scene);
const SIZES = [[320, 568], [360, 640], [390, 844], [667, 375, withPanel], [568, 320, withPanel], [1280, 800]], SCALES = [100, 150];
const ROLES = ['button', 'link', 'switch', 'radio', 'checkbox', 'tab', 'menuitem', 'option', 'slider', 'textbox', 'combobox'];
const SENTINEL = 'kingdown-scene-sentinel';

const base = new URL('play-scenes.html', env('PLAYABLE_URL'));
const textSize = (context, scale) => scale !== 100 && context.addInitScript(scale => new MutationObserver((_, watch) => {
  if (document.documentElement) { document.documentElement.style.fontSize = `${scale}%`; watch.disconnect(); }
}).observe(document, { childList: true }), scale);
const browser = await launch();
const faults = [], known = [], used = new Set();
let links, cases = 0;
try {
  for (const [width, height, only] of SIZES) for (const scale of SCALES) {
    const context = await browser.newContext({
      viewport: { width, height }, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block', hasTouch: width < 1000,
    });
    try {
      await context.addInitScript(function trackModals() {
        const opened = new WeakMap();
        const showModal = HTMLDialogElement.prototype.showModal;
        let order = 0;
        HTMLDialogElement.prototype.showModal = function () {
          if (!this.matches(':modal')) opened.set(this, ++order);
          return showModal.call(this);
        };
        // Top layer order follows showModal, even when the dialogs are in the reverse order in the DOM.
        window.playSceneModal = () => {
          let top = null;
          for (const dialog of document.querySelectorAll('dialog:modal')) {
            if (!top || (opened.get(dialog) ?? 0) > (opened.get(top) ?? 0)) top = dialog;
          }
          return top;
        };
      });
      await textSize(context, scale);
      let state;
      if (!links) {
        // Cache and worker state depends only on the scene, so check it in the first context.
        const origin = await context.newPage();
        links = (await origin.goto(base.href))?.ok() ? await origin.getByRole('link').evaluateAll(list => list.map(a => new URL(a.href).searchParams.get('scene')).filter(Boolean)) : [];
        if (!links.length) throw new Error(`${base.href} has no scenes: build with KINGDOWN_TEST_PAGES=1`);
        await origin.evaluate(() => {
          const upper = document.createElement('dialog'), lower = document.createElement('dialog');
          document.body.append(upper, lower);
          lower.showModal();
          upper.showModal();
          if (window.playSceneModal() !== upper) throw new Error('The last opened dialog must be on top');
          upper.close();
          if (window.playSceneModal() !== lower) throw new Error('Closing the top dialog must uncover the lower one');
        });
        await origin.goto(new URL('/manifest.webmanifest', base).href);
        state = seed => origin.evaluate(async ({ name, seed }) => {
          if (seed) await caches.open(name);
          return JSON.stringify([await caches.keys(), (await navigator.serviceWorker.getRegistrations()).map(r => r.scope)]);
        }, { name: SENTINEL, seed });
      }
      for (const scene of links.filter(only ?? Boolean)) {
        cases++;
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
          found.push(...await page.evaluate(cutText), ...await page.evaluate(foldFaults, scale === 100), ...await page.evaluate(layoutFaults, ROLES), ...await page.evaluate(coveredCards));
          if (found.length || width === 320 && scale === 150 || scale === 100 && (width === 390 || width === 1280)) {
            await shot(page, picture);
            pictured = true;
          }
          for (const role of ROLES) for (const control of await page.getByRole(role).all()) {
            if (!await control.isVisible() || await control.isDisabled() || await control.evaluate(outsideLayer)) continue;
            const label = `${role} "${(await control.getAttribute('aria-label') ?? await control.innerText()).trim().slice(0, 40)}"`;
            // The piece pool draws the tap target on the label around its screen-reader-only input.
            const poolInput = role === 'checkbox' && await control.evaluate(node => node.matches('.pool-row > input.kd-sr'));
            const target = poolInput ? control.locator('..') : control;
            const cut = await target.evaluate(cutBy);
            if (cut) found.push(`${label} is cut by ${cut}`);
            try { await target.click({ trial: true, timeout: 1500 }); }
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
  // The result sheet at eight sizes and three text sizes: the outcome, the cause, Rematch and the row stay inside the reader,
  // and a rematch offer keeps the height of the card.
  const sheets = ['solo-win', 'online-loss', 'online-loss-offer'];
  for (const [width, height] of [[320, 568], [360, 640], [390, 844], [568, 320], [844, 390], [1024, 768], [1280, 800], [1440, 900]]) for (const scale of [100, 150, 200]) {
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block', hasTouch: width < 1000 });
    await textSize(context, scale);
    const heights = {};
    for (const scene of sheets) {
      cases++;
      const page = await context.newPage(), where = `${scene} ${width}x${height} ${scale}%`;
      try {
        await page.goto(`${base.href}?scene=${scene}`);
        await page.waitForFunction(scene => document.body.dataset.sceneReady === scene, scene, { timeout: 15_000 });
        const sheet = await page.evaluate(() => {
          const edge = document.querySelector('.play-reader').getBoundingClientRect(), out = [];
          for (const node of document.querySelectorAll('.play-result-body h3, .play-result-cause, .play-result-actions button')) {
            const box = node.getBoundingClientRect(), name = `"${node.textContent.trim().slice(0, 20)}"`;
            if (!node.checkVisibility({ visibilityProperty: true })) out.push(`${name} is hidden`);
            else if (box.top < edge.top - 1 || box.bottom > edge.bottom + 1 || box.left < edge.left - 1 || box.right > edge.right + 1) out.push(`${name} leaves the reader`);
          }
          return { out, height: Math.round(document.querySelector('.play-result').getBoundingClientRect().height) };
        });
        heights[scene] = sheet.height;
        faults.push(...sheet.out.map(line => `${where}: ${line}`));
      } catch (error) { faults.push(`${where}: ${error.message.split('\n')[0]}`); }
      await page.close();
    }
    if (heights['online-loss'] !== heights['online-loss-offer']) faults.push(`online-loss-offer ${width}x${height} ${scale}%: a rematch offer changes the card height from ${heights['online-loss']} to ${heights['online-loss-offer']} px`);
    await context.close();
  }
} finally { await browser.close(); }
for (const mark of KNOWN.keys()) if (!used.has(mark)) faults.push(`known mark matches no fault: ${mark}`);
for (const line of known) console.log(`known fault: ${line}`);
if (faults.length) { console.error(`play scenes: ${faults.length} case(s) fail\n  ${faults.join('\n  ')}`); process.exit(1); }
console.log(`play scenes: all ${cases} cases pass (${links.length} scenes)`);

/** In the page: a control must be active in this layer and visible without keyboard focus. */
function outsideLayer(node) { const modal = window.playSceneModal(); return !!node.closest('[inert], .shell-skip:not(:focus)') || !!modal && !modal.contains(node); }

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
  const out = [], range = document.createRange(), modal = window.playSceneModal(), root = modal ?? document.body;
  const width = document.documentElement.clientWidth;
  const regions = [
    'header, footer, nav, [role="toolbar"]',
    '.home-secondary-actions, .home-start, .home-card, .home-seat',
    '.play-opp, .play-own, .play-turn, .play-hand, .play-reader, .play-result',
    '.guide-entry-pane, .turn-steps',
  ].join(', ');
  const hidden = '[inert], .kd-sr, .shell-skip:not(:focus), script, style';
  const shown = node => (!modal || modal.contains(node)) && !node.closest(hidden) &&
    node.checkVisibility({ visibilityProperty: true, opacityProperty: true });
  const short = label => label.trim().split('\n', 1)[0].slice(0, 40).trimEnd();
  const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
  const scrolls = value => value === 'auto' || value === 'scroll';
  for (const node of [root, ...root.querySelectorAll('*')]) {
    if (node.clientWidth && node.scrollWidth > node.clientWidth + 1 && shown(node) && scrolls(getComputedStyle(node).overflowY)) {
      const name = [node.localName, ...node.classList].join('.');
      out.push(`${name} has horizontal overflow (${node.scrollWidth} px of content in ${node.clientWidth} px)`);
    }
  }
  // Two items in the same scroll box can scroll into view together.
  const visibleBox = (box, node, scrollWith) => {
    let { left, right, top, bottom } = box;
    for (; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.overflowX === 'visible' && style.overflowY === 'visible') continue;
      const edge = node.getBoundingClientRect();
      const shared = scrollWith && node.contains(scrollWith);
      if (style.overflowX !== 'visible' && !(shared && scrolls(style.overflowX))) { left = Math.max(left, edge.left); right = Math.min(right, edge.right); }
      if (style.overflowY !== 'visible' && !(shared && scrolls(style.overflowY))) { top = Math.max(top, edge.top); bottom = Math.min(bottom, edge.bottom); }
    }
    return right - left > 1 && bottom - top > 1 ? { left, right, top, bottom } : null;
  };
  const clip = (boxes, edge, scrollWith) => boxes.map(box => visibleBox(box, edge, scrollWith)).filter(Boolean);
  const groups = new Map(), switches = [];
  const add = (host, label, boxes, node = host) => {
    const edge = node === host ? host.parentElement : host;
    const visible = clip(boxes, edge);
    if (visible.some(box => box.left < -1)) out.push(`${label} crosses the left viewport edge`);
    if (visible.some(box => box.top < -1)) out.push(`${label} crosses the top viewport edge`);
    if (visible.some(box => box.right > width + 1)) out.push(`${label} crosses the right viewport edge`);
    if (!boxes.length || host.closest('.kd-switch-indicator')) return;
    const card = host.closest('.play-game[data-hand="hand"] .play-hand .play-card');
    for (let group = modal ?? host.closest(regions); group; group = modal ? null : group.parentElement?.closest(regions)) {
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({ node, label, boxes, edge, card });
    }
  };
  const selector = ['button', 'a[href]', 'input:not([type="hidden"])', 'label.pool-row', 'select', 'textarea', ...roles.map(role => `[role="${role}"]`)].join(', ');
  for (const control of document.querySelectorAll(selector)) {
    if (!shown(control)) continue;
    const label = short(control.getAttribute('aria-label') ??
      document.getElementById(control.getAttribute('aria-labelledby'))?.textContent ??
      control.innerText ?? '');
    const mark = control.querySelector('.kd-switch-indicator');
    add(control, `control "${label}"`, [control.getBoundingClientRect()]);
    if (mark) {
      const tile = control.parentElement;
      const track = visibleBox(mark.getBoundingClientRect(), mark.parentElement, tile);
      if (track) switches.push({ tile, mark, track, label });
    }
  }
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let leaf; (leaf = walk.nextNode());) {
    const host = leaf.parentElement, words = leaf.textContent.trim();
    if (!words || !shown(host)) continue;
    range.selectNodeContents(leaf);
    const boxes = [...range.getClientRects()].map(rect => ({
      left: rect.left, right: rect.right, top: rect.top + rect.height / 4, bottom: rect.bottom - rect.height / 4,
    }));
    const label = `text "${short(words)}"`;
    add(host, label, boxes, leaf);
    for (const { tile, mark, track, label: name } of switches) {
      if (tile.contains(host) && !mark.contains(host) && clip(boxes, host, tile).some(box => overlaps(box, track))) {
        out.push(`${label} goes over switch "${name}"`);
      }
    }
  }
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i++) for (let j = i + 1; j < group.length; j++) {
      const a = group[i], b = group[j];
      if (a.node.contains(b.node) || b.node.contains(a.node)) continue;
      // The painted cards fan out: their button boxes can overlap. Their labels and tap targets still have checks.
      if (a.card && b.card && a.card !== b.card && (a.node === a.card || b.node === b.card)) continue;
      if (!a.boxes.some(box => b.boxes.some(other => overlaps(box, other)))) continue;
      const aBoxes = clip(a.boxes, a.edge, b.node);
      const bBoxes = clip(b.boxes, b.edge, a.node);
      if (aBoxes.some(box => bBoxes.some(other => overlaps(box, other)))) out.push(`${a.label} overlaps ${b.label}`);
    }
  }
  return out;
}

/** In the page: a card name in the hand that another card covers. The fanned card boxes can overlap; their names cannot. */
function coveredCards() {
  const out = [], range = document.createRange(), name = card => card.querySelector('[data-button-label]')?.textContent.trim();
  for (const card of document.querySelectorAll('.play-hand .play-card')) {
    const walk = document.createTreeWalker(card.querySelector('[data-button-label]') ?? card, NodeFilter.SHOW_TEXT);
    letters: for (let text; (text = walk.nextNode());) for (let i = 0; i < text.length; i++) {
      if (!text.data[i].trim()) continue;
      range.setStart(text, i); range.setEnd(text, i + 1);
      const box = range.getBoundingClientRect(), y = box.top + box.height / 2;
      for (const x of [box.left + box.width / 4, box.left + box.width / 2, box.right - box.width / 4]) {
        const other = document.elementFromPoint(x, y)?.closest('.play-card');
        if (other && other !== card) { out.push(`card name "${name(card)}" is covered by card "${name(other)}"`); break letters; }
      }
    }
  }
  return out;
}

/**
 * In the page: text and controls of the reader that a scroll box hides before a scroll. A control and a line of text
 * never show in part. At 100% text (`full`) each line shows; at a larger text size a line can wait below the fold.
 */
function foldFaults(full) {
  const out = [], range = document.createRange(), items = [];
  const name = node => [node.localName, ...node.classList].join('.');
  const areas = ['.play-reader', ...(innerWidth > innerHeight && innerWidth < 1000 ? ['dialog.new-game-panel[open] .setup-controls'] : [])].join(', ');
  for (const reader of document.querySelectorAll(areas)) {
    if (reader.closest('[inert]') || !reader.checkVisibility({ visibilityProperty: true })) continue;
    for (const control of reader.querySelectorAll('button, a[href]')) {
      if (!control.checkVisibility({ visibilityProperty: true })) continue;
      const label = `control "${control.innerText.trim().split('\n', 1)[0]}"`, edge = control.getBoundingClientRect();
      items.push({ node: control, label, boxes: [edge] });
      // A label that wraps in a short control runs out of its box.
      const words = document.createTreeWalker(control, NodeFilter.SHOW_TEXT), lines = [];
      for (let text; (text = words.nextNode());) {
        if (!text.textContent.trim() || text.parentElement.closest('.kd-sr, [aria-hidden="true"]') || !text.parentElement.checkVisibility({ visibilityProperty: true, opacityProperty: true })) continue;
        if (text.parentElement.getBoundingClientRect().width <= 2) continue; // a label for screen readers only
        range.selectNodeContents(text); lines.push(...range.getClientRects());
      }
      if (lines.some(r => r.height >= 2 && (r.top + r.height / 4 < edge.top - 1 || r.bottom - r.height / 4 > edge.bottom + 1))) out.push(`${label} has a label that runs out of its box`);
    }
    const walk = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT);
    for (let text; (text = walk.nextNode());) {
      const host = text.parentElement, words = text.textContent.trim();
      if (!words || host.closest('button, a[href], .kd-sr, [aria-hidden="true"]') || !host.checkVisibility({ visibilityProperty: true })) continue;
      range.selectNodeContents(text);
      // Each line, less a quarter of its height at the top and the bottom, as in cutText.
      const boxes = [...range.getClientRects()].filter(r => r.width >= 2 && r.height >= 2).map(r => ({ top: r.top + r.height / 4, bottom: r.bottom - r.height / 4 }));
      items.push({ node: host, label: `text "${words.slice(0, 40)}"`, boxes, text: true });
    }
  }
  for (const { node, label, boxes, text } of items) {
    for (let box = node.parentElement; box && !box.matches('.play-game'); box = box.matches('dialog') ? null : box.parentElement) {
      if (!/auto|scroll/.test(getComputedStyle(box).overflowY)) continue;
      const edge = box.getBoundingClientRect(), top = edge.top + box.clientTop, bottom = top + box.clientHeight;
      const outside = boxes.filter(b => b.top < top - 1 || b.bottom > bottom + 1);
      if (!outside.length) continue;
      const cut = !text || outside.some(b => b.bottom > top + 1 && b.top < bottom - 1);
      if (cut) out.push(`${label} is cut by the scroll box ${name(box)} at rest`);
      else if (full) out.push(`${label} is below the fold of ${name(box)}`);
      break;
    }
  }
  return out;
}
