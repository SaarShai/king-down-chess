// Check only the three proposed studies. They do not change game playback.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, noSidewaysScroll, shot, env } from '../../../tools/lib/checks.mjs';

const server = await createServer({ root: resolve('.'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false } });
await server.listen();
const base = `${server.resolvedUrls.local[0]}docs/specs/effects-animation/preview/concepts/`;
const browser = await launch();
const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const report = [];
try {
  for (const name of ['cards', 'promotion', 'check']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = trapErrors(page);
    page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
    await page.goto(`${base}${name}/index.html`);
    await page.waitForFunction(() => window.motionConcept?.ready === true);
    const initial = await page.evaluate(() => window.motionConcept.getState());
    assert.equal(initial.playing, false, `${name}: starts at rest`);
    for (const progress of [0, .18, .45, .7, 1]) {
      await page.evaluate(p => window.motionConcept.seek(p), progress);
      const state = await page.evaluate(() => window.motionConcept.getState());
      assert.equal(state.playing, false, `${name}: seek pauses`);
      assert(Math.abs(state.progress - progress) < .002, `${name}: deterministic seek`);
    }
    await page.evaluate(() => window.motionConcept.seek(.45));
    await noSidewaysScroll(page);
    await shot(page, `${name}-desktop`, { fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await noSidewaysScroll(page);
    await shot(page, `${name}-phone`, { fullPage: true });
    await page.evaluate(() => window.motionConcept.seek(1));
    const result = await page.evaluate(() => window.motionConcept.getState());
    await shot(page, `${name}-result`, { fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.motionConcept.getState().reduced === true);
    assert.equal((await page.evaluate(() => window.motionConcept.getState())).playing, false, `${name}: motion preference stops playback`);
    await noSidewaysScroll(page);
    await shot(page, `${name}-reduced`, { fullPage: true });
    assertNoErrors(errors);
    report.push({ name, initial, result, widths: [1440, 390], seek: true, reduced: true, errors });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(base);
  await noSidewaysScroll(page);
  for (const href of ['cards/index.html', 'promotion/index.html', 'check/index.html']) {
    assert.equal(await page.locator(`a[href="./${href}"]`).count(), 1, `launcher link: ${href}`);
  }
  await page.close();
  writeFileSync(join(out, 'concepts.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log('PASS: three concept pages, five timeline frames, desktop/phone layout, reduced motion and launcher.');
} finally {
  await browser.close();
  await server.close();
}
