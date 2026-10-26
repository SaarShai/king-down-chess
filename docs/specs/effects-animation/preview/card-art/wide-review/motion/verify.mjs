// The registered browser runner supplies the browser and output folder.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, noSidewaysScroll, shot, env } from '../../../../../../../tools/lib/checks.mjs';

const root = fileURLToPath(new URL('../../../../../../../', import.meta.url));
const here = fileURLToPath(new URL('.', import.meta.url));
const catalog = JSON.parse(readFileSync(join(here, 'catalog.json'), 'utf8')).cards;
const manifest = JSON.parse(readFileSync(join(here, '../manifest.json'), 'utf8')).cards;
const paintings = new Map(manifest.map(card => [card.id.toLowerCase(), card]));
const ids = catalog.map(card => card.id.toLowerCase());
assert.equal(ids.length, manifest.length, 'motion catalog covers every reviewed artwork');
assert.deepEqual(new Set(ids), new Set(manifest.map(card=>card.id.toLowerCase())), 'all released cards and extras have animations');
assert(new Set(ids).size === ids.length, 'catalog has unique card IDs');
for (const id of ids) assert(paintings.has(id), `source metadata exists for ${id}`);

const out = env('PLAYABLE_OUT');
mkdirSync(join(out, 'frames'), { recursive: true });
const report = { cards: [], controls: {}, layouts: [], errors: [] };
const saveReport = () => writeFileSync(join(out, 'wide-card-motion.json'), `${JSON.stringify(report, null, 2)}\n`);
const saveFrame = (id, name, encoded) => {
  assert(encoded.startsWith('data:image/png;base64,'), `${id}: PNG frame ${name}`);
  writeFileSync(join(out, 'frames', `${id}-${name}.png`), Buffer.from(encoded.split(',')[1], 'base64'));
};
const settle = page => page.evaluate(async () => {
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
});
const state = page => page.evaluate(() => window.wideCardMotion.getState());
const frozen = async (page, label) => {
  const before = await state(page);
  assert.equal(before.playing, false, `${label}: paused`);
  // Observe several 30 fps frame periods after the stop condition has passed.
  await page.waitForTimeout(180);
  const after = await state(page);
  assert.equal(after.time, before.time, `${label}: time stops`);
  assert.equal(after.frames, before.frames, `${label}: drawing stops`);
};

let server, browser;
try {
  server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false } });
  await server.listen();
  const url = new URL('docs/specs/effects-animation/preview/card-art/wide-review/motion/index.html', server.resolvedUrls.local[0]).href;
  browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'no-preference' });
  const errors = trapErrors(page);
  report.errors = errors;
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  await page.addInitScript(() => {
    const faults = [];
    window.wideCanvasFaults = faults;
    const proto = CanvasRenderingContext2D.prototype;
    for (const name of ['drawImage', 'transform', 'setTransform', 'translate', 'rotate', 'scale', 'rect',
      'fillRect', 'clearRect', 'arc', 'ellipse', 'moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo']) {
      const original = proto[name];
      proto[name] = function (...args) {
        if (args.some(arg => typeof arg === 'number' && !Number.isFinite(arg))) faults.push(`Non-finite ${name}`);
        return original.apply(this, args);
      };
    }
    const alpha = Object.getOwnPropertyDescriptor(proto, 'globalAlpha');
    Object.defineProperty(proto, 'globalAlpha', { ...alpha, set(value) {
      if (!Number.isFinite(value) || value < 0 || value > 1) faults.push(`Invalid alpha ${value}`);
      alpha.set.call(this, value);
    } });
  });
  await page.goto(url);
  await page.waitForFunction(() => window.wideCardMotion?.getState().ready);
  await page.evaluate(() => window.wideCardMotion.setPlaying(false));
  const canonicalRules = await page.evaluate(async () => {
    const [{ RELEASED_CARDS }, { cardText, ruleLine }, { DEFAULT_RULES }] = await Promise.all([
      import('/src/content/cards.ts'), import('/src/powers-ui.ts'), import('/src/rules/rules.ts'),
    ]);
    return { ...Object.fromEntries(RELEASED_CARDS.map(card => [card.id.toLowerCase(), ruleLine(cardText(card.id, DEFAULT_RULES))])), rescue: ruleLine(cardText('Rescue', DEFAULT_RULES)), back: '' };
  });

  for (const id of ids) {
    const metadata = paintings.get(id);
    const selected = await page.evaluate(id => window.wideCardMotion.select(id, false), id);
    assert(selected.ready && selected.id === id && !selected.playing, `${id}: awaitable selection is ready and paused`);
    const contract = await page.evaluate(async ({ id, proposal, expectedName, expectedRule }) => {
      const api = window.wideCardMotion;
      const original = document.getElementById('original'), animated = document.getElementById('animated');
      const pixels = canvas => canvas.getContext('2d').getImageData(0, 0, 512, 288).data;
      const read = () => pixels(animated);
      const diff = (a, b) => {
        let max = 0, changedPixels = 0;
        for (let p = 0; p < a.length; p += 4) {
          let changed = false;
          for (let c = 0; c < 4; c++) { const d = Math.abs(a[p + c] - b[p + c]); max = Math.max(max, d); if (d > 2) changed = true; }
          if (changed) changedPixels++;
        }
        return { max, changedPixels };
      };
      const baseline = pixels(original);
      const headings = [...document.querySelectorAll('.card-title')].map(node => node.textContent);
      const rules = [...document.querySelectorAll('.card-rule')].map(node => node.textContent);
      const labelsMatch = headings.every(text => text === expectedName) && rules.every(text => text === expectedRule)
        && document.title.startsWith(`${expectedName} ·`) && original.getAttribute('aria-label').startsWith(`${expectedName}:`)
        && animated.getAttribute('aria-label').startsWith(`${expectedName}:`);
      const dimensions = [original, animated].every(canvas => canvas.width === 512 && canvas.height === 288);

      // Build a separate source benchmark from the source Image, not the host's prepared canvas.
      const image = new Image();
      image.src = new URL(proposal, new URL('../', location.href)).href;
      await image.decode();
      const benchmark = document.createElement('canvas'); benchmark.width = 512; benchmark.height = 288;
      const bench = benchmark.getContext('2d');
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      if (id === 'freeze' || id === 'march') bench.drawImage(image, 0, 0, 512, 512 / sourceRatio);
      else if (sourceRatio >= 16 / 9) {
        const height = 512 / sourceRatio;
        bench.drawImage(image, 0, (288 - height) / 2, 512, height);
      } else {
        const width = 288 * sourceRatio;
        bench.drawImage(image, (512 - width) / 2, 0, width, 288);
      }
      const sourceDelta = diff(baseline, pixels(benchmark));

      api.setReduced(false); api.setMode('idle'); api.seek(2.1 / 8);
      const first = read(), idle = api.frame();
      api.seek(4.4 / 8); const later = read();
      api.seek(.05); api.seek(2.1 / 8);
      const seekDelta = diff(first, read());
      api.seek(0); const loopStart = read(); api.seek(1); const loopDelta = diff(loopStart, read());
      api.setMode('awaken'); api.seek(0); const awakenStart = diff(baseline, read());
      api.seek(1.1 / 3.2); const awakenMid = read(), awaken = api.frame();
      api.seek(1); const awakenEnd = diff(baseline, read());
      api.setReduced(true); api.seek(.53); const reducedAwaken = diff(baseline, read());
      api.setMode('idle'); api.seek(.79); const reducedIdle = diff(baseline, read());
      const result = { dimensions, labelsMatch, sourceRatio, sourceDelta, seekDelta, loopDelta, awakenStart, awakenEnd,
        reducedAwaken, reducedIdle, idleMotion: diff(baseline, first), awakenMotion: diff(baseline, awakenMid), travel: diff(first, later),
        faults: [...window.wideCanvasFaults], frames: { original: original.toDataURL(), idle, awaken } };
      api.setReduced(false); api.setMode('idle'); api.seek(2.1 / 8);
      return result;
    }, { id, proposal: metadata.proposal, expectedName: metadata.name, expectedRule: canonicalRules[id] });
    const { frames, ...metrics } = contract;
    report.cards.push({ id, name: metadata.name, ...metrics });
    for (const [name, encoded] of Object.entries(frames)) saveFrame(id, name, encoded);
    saveReport();
    assert.equal(contract.dimensions, true, `${id}: both source canvases are 512 × 288`);
    assert.equal(contract.labelsMatch, true, `${id}: names, rules and labels use the current catalog`);
    if (id !== 'freeze' && id !== 'march') assert(Math.abs(contract.sourceRatio - 16 / 9) < .04, `${id}: complete wide source painting`);
    for (const name of ['sourceDelta', 'loopDelta', 'awakenStart', 'awakenEnd', 'reducedAwaken', 'reducedIdle'])
      assert(contract[name].max <= 2, `${id}: ${name} max channel delta ${contract[name].max} exceeds 2`);
    assert.equal(contract.seekDelta.max, 0, `${id}: reverse seek is deterministic`);
    // A few painted details can carry the motion; do not require a large area of the image to change.
    assert(Math.max(contract.idleMotion.changedPixels, contract.awakenMotion.changedPixels) >= 16, `${id}: at least 16 painted pixels move at a midframe`);
    assert(contract.travel.changedPixels >= 16, `${id}: idle material changes between 2.1 and 4.4 seconds`);
    assert.deepEqual(contract.faults, [], `${id}: finite canvas calls and bounded opacity`);
    for (const [width, height] of [[1280, 900], [390, 844]]) {
      await page.setViewportSize({ width, height });
      await settle(page); await noSidewaysScroll(page);
      const layout = await page.evaluate(() => {
        const box = id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        return { original: box('original'), animated: box('animated') };
      });
      for (const name of ['original', 'animated']) {
        const box = layout[name];
        assert(box.width > 0 && box.height > 0, `${id}: ${name} is rendered at ${width}`);
        assert(Math.abs(box.width / box.height - 16 / 9) < .01, `${id}: ${name} keeps 16:9 at ${width}`);
        assert(box.x >= -1 && box.x + box.width <= width + 1, `${id}: ${name} fits at ${width}`);
      }
      if (width === 390) assert(layout.animated.y < layout.original.y, `${id}: animated painting comes first on phone`);
      await shot(page, `${id}-${width}`, { fullPage: true });
      report.layouts.push({ id, width, height, ...layout });
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    console.log(`Checked ${id}: source, loop, seeks, endpoints, motion and desktop/phone framing.`);
  }

  const first = ids[0], next = ids[1] || first;
  await page.evaluate(id => window.wideCardMotion.select(id, false), first);
  await page.locator('#next').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(id => { const s = window.wideCardMotion.getState(); return s.ready && s.id === id; }, next);
  await page.locator('#previous').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(id => { const s = window.wideCardMotion.getState(); return s.ready && s.id === id; }, first);
  await page.locator('#choose-summary').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#chooser').getAttribute('open'), '', 'keyboard opens the card chooser');
  const chosen = ids.includes('vault') ? 'vault' : next;
  await page.locator(`#card-nav button[data-id="${chosen}"]`).focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(id => { const s = window.wideCardMotion.getState(); return s.ready && s.id === id; }, chosen);
  assert.equal(await page.locator('#chooser').getAttribute('open'), null, 'selection closes the chooser');
  if (chosen === 'vault') {
    assert.equal(await page.locator('#animated-title').textContent(), 'Hop', 'Vault stable ID displays Hop');
    assert(!/\bVault\b/.test(await page.locator('.card-rule').first().textContent()), 'Hop rule copy has no stale Vault name');
  }
  await page.locator('#idle').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => { const s = window.wideCardMotion.getState(); return s.playing && s.time > .05; });
  await page.locator('#play').focus(); await page.keyboard.press('Space');
  await frozen(page, 'keyboard pause');
  await page.locator('#scrub').focus(); await page.keyboard.press('Home'); await page.keyboard.press('ArrowRight');
  const scrub = Number(await page.locator('#scrub').inputValue());
  assert.equal((await state(page)).time, scrub / 1000 * 8, 'keyboard range seek sets the displayed time');
  await page.keyboard.press('End'); assert.equal((await state(page)).progress, 1, 'keyboard can seek to the loop end');
  await page.locator('#half-speed').focus(); await page.keyboard.press('Space');
  assert.equal((await state(page)).speed, .5, 'keyboard changes playback speed');
  await page.keyboard.press('Space'); assert.equal((await state(page)).speed, 1, 'normal speed returns');
  await page.locator('#awaken').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.locator('#awaken').getAttribute('aria-pressed'), 'true', 'awakening mode is exposed');
  await page.evaluate(() => window.wideCardMotion.seek(.98));
  await page.locator('#play').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => { const s = window.wideCardMotion.getState(); return !s.playing && s.progress === 1; });
  await frozen(page, 'one-shot completion');
  await page.locator('#replay').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => { const s = window.wideCardMotion.getState(); return s.playing && s.time > 0 && s.time < 1; });
  await page.locator('#reduced').focus(); await page.keyboard.press('Space');
  assert.equal((await state(page)).reduced, true, 'keyboard enables reduced motion');
  for (const id of ['play', 'replay', 'scrub']) assert.equal(await page.locator(`#${id}`).isDisabled(), true, `reduced motion disables ${id}`);
  await frozen(page, 'reduced motion');
  await page.locator('#reduced').focus(); await page.keyboard.press('Space');

  await page.evaluate(() => {
    const api = window.wideCardMotion; api.setMode('idle'); api.setPlaying(true);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await frozen(page, 'hidden event');
  assert.equal(await page.evaluate(() => window.wideCardMotion.setPlaying(true).playing), false, 'hidden page cannot restart');
  await page.evaluate(() => {
    delete document.hidden;
    const spacer = document.createElement('div'); spacer.id = 'check-spacer'; spacer.style.height = '2200px'; document.body.append(spacer);
    window.wideCardMotion.setPlaying(true); window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForFunction(() => {
    const r = document.getElementById('animated').getBoundingClientRect();
    return (r.bottom <= 0 || r.top >= innerHeight) && !window.wideCardMotion.getState().playing;
  });
  await frozen(page, 'actual offscreen painting');
  await page.evaluate(() => { document.getElementById('check-spacer').remove(); window.scrollTo(0, 0); });
  await settle(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.wideCardMotion.getState().reduced);
  await frozen(page, 'system reduced motion');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !window.wideCardMotion.getState().reduced);
  assert.deepEqual(await page.evaluate(() => window.wideCanvasFaults), [], 'all checked drawing calls and opacity are finite');
  assertNoErrors(errors);
  report.controls = { keyboard: true, seek: true, halfSpeed: true, reduced: true, replay: true, oneShotCompletion: true,
    hiddenEventStop: true, actualOffscreenStop: true, stoppedFramesAndTime: true, systemReducedMotion: true };
  saveReport();
  console.log(`PASS: ${ids.length} approved card animations; source and motion contracts, controls, visibility, ${ids.length * 3} canvas frames and ${ids.length * 2} full-page desktop/phone captures.`);
} catch (error) {
  report.failure = error.stack || String(error); saveReport();
  throw error;
} finally {
  try { if (browser) await browser.close(); }
  finally { if (server) await server.close(); }
}
