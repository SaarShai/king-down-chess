// Verify the standalone comparisons without changing real game playback.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, noSidewaysScroll, shot, env } from '../../../tools/lib/checks.mjs';

const server = await createServer({ root: resolve('.'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false } });
await server.listen();
const base = `${server.resolvedUrls.local[0]}docs/specs/effects-animation/preview/comparisons/`;
const browser = await launch();
const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const report = [];
const settleFrame = page => page.evaluate(async () => {
  await document.fonts.ready;
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
});
async function checkMagicFamily(page) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const frames = [];
  for (const [width, height] of [[1280, 720], [390, 844]]) {
    await page.setViewportSize({ width, height });
    for (const sample of ['holy-light', 'mercy', 'Control', 'Mimic']) {
      await page.locator(`#choose-${sample}`).click();
      assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).sample, sample);
      for (const [variant, progress, phase] of [['current', .46, 'peak'], ['proposed', .28, 'formation'], ['proposed', .46, 'peak'], ['proposed', 1, 'settled']]) {
        await page.evaluate(({ variant, progress }) => { window.comparisonStudy.setVariant(variant); window.comparisonStudy.seek(progress); }, { variant, progress });
        await settleFrame(page);
        await noSidewaysScroll(page);
        await shot(page, `magic-${sample}-${variant}-${phase}-${width}`, { fullPage: true });
        frames.push({ sample, variant, progress, width });
      }
      if (width === 1280) {
        for (const selector of ['#board', '.sample-row', '.variant', '.transport', '.timeline', '.motion']) {
          const box = await page.locator(selector).boundingBox();
          assert(box && box.y >= 0 && box.y + box.height <= height, `${sample}: ${selector} fits short desktop`);
        }
      }
    }
  }
  await page.locator('#reduced').check();
  for (const sample of ['holy-light', 'mercy', 'Control', 'Mimic']) {
    await page.locator(`#choose-${sample}`).click();
    const state = await page.evaluate(() => window.comparisonStudy.getState());
    assert.equal(state.reduced, true);
    assert.equal(state.progress, 1);
    assert.equal(state.playing, false);
  }
  return frames;
}
try {
  for (const name of ['board', 'release', 'information', 'magic']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = trapErrors(page);
    page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
    await page.goto(`${base}${name}/index.html`);
    await page.waitForFunction(() => window.comparisonStudy?.ready === true);
    const initial = await page.evaluate(() => window.comparisonStudy.getState());
    assert.notEqual(initial.playing, true, `${name}: starts at rest`);
    const animated = await page.evaluate(() => typeof window.comparisonStudy.seek === 'function');
    for (const variant of ['current', 'proposed']) {
      await page.evaluate(v => window.comparisonStudy.setVariant(v), variant);
      const state = await page.evaluate(() => window.comparisonStudy.getState());
      assert.equal(state.variant, variant, `${name}: changes comparison`);
      assert.equal(state.sample, initial.sample, `${name}: comparison preserves sample`);
      if (animated) {
        for (const progress of [0, .25, .55, 1]) {
          await page.evaluate(p => window.comparisonStudy.seek(p), progress);
          const frame = await page.evaluate(() => window.comparisonStudy.getState());
          assert.equal(frame.playing, false, `${name}: seek pauses`);
          assert(Math.abs(frame.progress - progress) < .003, `${name}: repeatable frame`);
        }
        await page.evaluate(() => window.comparisonStudy.seek(.5));
      }
      await settleFrame(page);
      await noSidewaysScroll(page);
      await shot(page, `${name}-${variant}-desktop`, { fullPage: true });
      await page.setViewportSize({ width: 390, height: 844 });
      await settleFrame(page);
      await noSidewaysScroll(page);
      await shot(page, `${name}-${variant}-phone`, { fullPage: true });
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    if (animated) {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => window.comparisonStudy.getState().reduced === true);
      assert.equal((await page.evaluate(() => window.comparisonStudy.getState())).playing, false, `${name}: reduced motion stops playback`);
      await settleFrame(page);
      await shot(page, `${name}-reduced`, { fullPage: true });
    }
    const familyFrames = name === 'magic' ? await checkMagicFamily(page) : undefined;
    assertNoErrors(errors);
    report.push({ name, initial, animated, variants: ['current', 'proposed'], widths: [1440, 390], familyFrames, errors });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base);
  await noSidewaysScroll(page);
  for (const name of ['board', 'release', 'information', 'magic']) {
    assert.equal(await page.locator(`a[href="./${name}/index.html"]`).count(), 1, `launcher: ${name}`);
  }
  await page.close();
  writeFileSync(join(out, 'comparisons.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log('PASS: four comparison pages, current/proposed, desktop/phone, deterministic timelines, reduced motion and launcher.');
} finally {
  await browser.close();
  await server.close();
}
