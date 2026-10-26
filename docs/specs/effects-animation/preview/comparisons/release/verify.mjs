import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = process.argv[2];
if (!output || !output.startsWith('/')) throw new Error('Set an external absolute output folder.');
const url = 'http://127.0.0.1:5302/docs/specs/effects-animation/preview/comparisons/release/';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [], failures = [], checks = [], samples = ['freeze', 'wall', 'shelter'];
const state = page => page.evaluate(() => window.comparisonStudy.getState());
async function seek(page, ms) {
  const previous = (await state(page)).sceneFrames;
  await page.evaluate(t => window.comparisonStudy.seek(t / window.comparisonStudy.getState().duration), ms);
  await page.waitForFunction(n => window.comparisonStudy.getState().sceneFrames > n, previous);
}
const pixels = page => page.locator('#board').evaluate(c => c.toDataURL());
async function bounds(page) {
  const result = await page.evaluate(() => {
    const r = document.querySelector('#board').getBoundingClientRect();
    const phase = document.querySelector('.board-caption').getBoundingClientRect();
    return { overflow: document.documentElement.scrollWidth > innerWidth, board: { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }, phaseBottom: phase.bottom,
      controls: [...document.querySelectorAll('button,select,input')].every(e => { const b = e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth; }) };
  });
  assert.equal(result.overflow, false); assert.equal(result.controls, true); return result;
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', serviceWorkers: 'block' });
  const page = await context.newPage(); page.setDefaultTimeout(9000);
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
  await page.goto(url); await page.waitForFunction(() => window.comparisonStudy?.ready); await page.evaluate(() => document.fonts.ready);
  let s = await state(page); assert.equal(s.progress, 0); assert.equal(s.playing, false); assert.equal(s.variant, 'current');
  assert.equal(s.proof.length, 3); assert.ok(s.proof.every(p => p.legal && p.status === 'playing' && p.beforeStates.length && !p.afterStates.length));
  await writeFile(`${output}/legal-state-proof.json`, JSON.stringify(s.proof, null, 2));
  const desktop = await bounds(page); assert.ok(desktop.phaseBottom < 900);
  const baseline = [];
  for (const sample of samples) {
    await page.selectOption('#sample', sample); assert.equal((await state(page)).sample, sample);
    await page.click('#current'); await seek(page, 0); const before = await pixels(page);
    await page.click('#proposed'); await seek(page, 0); assert.ok((await pixels(page)) === before, `${sample}: settled material matches`);
    await page.screenshot({ path: `${output}/${sample}-desktop-held.png` });
    for (const variant of ['current', 'proposed']) {
      await page.click(`#${variant}`);
      for (const ms of [249, 250, 405, 560, 715, 870, 1100, 1595, 1814]) {
        await seek(page, ms); s = await state(page);
        assert.ok(Math.abs(s.timestamp - ms) < .0001); assert.equal(s.active, ms < 250);
        assert.equal(await page.locator('#badge').isVisible(), ms < 250, `${sample}/${variant}: badge follows the rule`);
        if (variant === 'current') {
          assert.equal(s.residueFrames, sample === 'shelter' || ms < 250 || ms >= 1595 ? 0 : 1);
          if (sample !== 'shelter' && ms >= 250 && ms < 1595) {
            assert.ok(Math.abs(s.materialFrames[0].progress - Math.min(1, .72 + (ms - 250) / 4800)) < .00001);
          }
          baseline.push({ sample, timestamp: ms, baselineReleaseMs: s.baselineReleaseMs, materialFrames: s.materialFrames });
        }
        if ([405, 560, 715, 1814].includes(ms)) await page.screenshot({ path: `${output}/${sample}-desktop-${variant}-${ms}.png` });
      }
      await seek(page, 560); const first = await pixels(page);
      await seek(page, 1814); await seek(page, 0); await seek(page, 560);
      assert.ok((await pixels(page)) === first, `${sample}/${variant}: seek repeats the same pixels`);
      await seek(page, 1814); const clear = await pixels(page);
      if (variant === 'proposed') { await seek(page, 870); assert.ok((await pixels(page)) === clear, `${sample}: proposed is clear at 620 ms`); }
    }
    await seek(page, 560); const stamp = (await state(page)).timestamp, board = (await state(page)).board;
    const rect = await bounds(page); await page.click('#current'); assert.equal((await state(page)).timestamp, stamp); assert.deepEqual((await state(page)).board, board); assert.deepEqual((await bounds(page)).board, rect.board);
    await page.click('#proposed'); assert.equal((await state(page)).timestamp, stamp);
    await page.click('#flip'); assert.equal((await state(page)).flipped, true); await seek(page, 560);
    await page.screenshot({ path: `${output}/${sample}-desktop-flipped.png` }); await page.click('#flip');
    await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => scrollTo(0,0));
    await seek(page, 560); await bounds(page); await page.screenshot({ path: `${output}/${sample}-phone-release.png`, fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 }); await page.evaluate(() => scrollTo(0,0));
  }
  await writeFile(`${output}/production-timing-proof.json`, JSON.stringify(baseline, null, 2));
  checks.push('All three legal state changes, exact badge loss, shared time/board/scale, production timing, settled equality, release results, flip, and repeat pixel seeks pass.');
  await page.selectOption('#sample', 'freeze'); await page.click('#proposed');
  await page.selectOption('#speed', '0.5'); await page.click('#replay');
  await page.waitForFunction(() => window.comparisonStudy.getState().progress > .04); await page.click('#play');
  const paused = (await state(page)).progress; assert.equal((await state(page)).playing, false);
  await page.waitForTimeout(120); assert.equal((await state(page)).progress, paused);
  await page.click('#play'); await page.waitForFunction(() => !window.comparisonStudy.getState().playing);
  const durations = {};
  for (const [name, speed] of [['normal','1'], ['slow','0.5']]) {
    await page.selectOption('#speed', speed); const start = performance.now(); await page.click('#replay');
    await page.waitForFunction(() => !window.comparisonStudy.getState().playing); durations[name] = Math.round(performance.now() - start);
  }
  assert.ok(durations.slow > durations.normal * 1.65);
  await page.locator('#scrub').focus(); await page.keyboard.press('Home'); assert.equal((await state(page)).progress, 0);
  await page.keyboard.press('ArrowRight'); assert.ok((await state(page)).progress > 0);
  await page.keyboard.press('End'); assert.equal((await state(page)).progress, 1);
  await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('Space'); assert.equal((await state(page)).playing, true);
  await page.keyboard.press('Space'); assert.equal((await state(page)).playing, false);
  for (const sample of samples) {
    await page.selectOption('#sample', sample); await page.locator('#reduced').check();
    assert.equal((await state(page)).active, true); await page.click('#replay');
    s = await state(page); assert.equal(s.reduced, true); assert.equal(s.progress, 1); assert.equal(s.playing, false); assert.equal(s.active, false);
    assert.equal(await page.locator('#play').isDisabled(), true); assert.equal(await page.locator('#scrub').isDisabled(), true); assert.equal(await page.locator('#badge').isVisible(), false);
    await page.locator('#reduced').uncheck();
  }
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForFunction(() => window.comparisonStudy.getState().reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForFunction(() => !window.comparisonStudy.getState().reduced);
  checks.push(`Replay, pause, resume, keyboard scrub, Space, manual and system reduced motion pass. Normal/slow: ${durations.normal}/${durations.slow} ms.`);
  await page.setViewportSize({ width: 390, height: 400 }); await page.evaluate(() => scrollTo(0,0));
  await page.waitForFunction(() => window.comparisonStudy.getState().inView);
  await page.evaluate(() => window.comparisonStudy.replay()); await page.waitForFunction(() => window.comparisonStudy.getState().playing);
  await page.evaluate(() => scrollTo(0,document.documentElement.scrollHeight)); await page.waitForFunction(() => !window.comparisonStudy.getState().playing);
  const off = await state(page); assert.ok(off.progress < 1); const frames = off.sceneFrames;
  await page.waitForTimeout(140); assert.equal((await state(page)).sceneFrames, frames);
  await page.evaluate(() => scrollTo(0,0)); await page.waitForFunction(() => window.comparisonStudy.getState().inView);
  await page.evaluate(() => window.comparisonStudy.replay()); await page.waitForFunction(() => window.comparisonStudy.getState().playing);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal((await state(page)).playing, false); const hiddenFrames = (await state(page)).sceneFrames;
  await page.waitForTimeout(140); assert.ok((await state(page)).sceneFrames <= hiddenFrames + 1);
  checks.push('Offscreen playback stops. Scene frame count stays still. A hidden-document visibility signal stops playback.');
  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage(); await reducedPage.goto(url); await reducedPage.waitForFunction(() => window.comparisonStudy?.ready);
  s = await state(reducedPage); assert.equal(s.reduced, true); assert.equal(s.active, true); assert.equal(s.playing, false);
  await reducedPage.click('#replay'); assert.equal((await state(reducedPage)).active, false);
  const phone = await bounds(reducedPage); await reducedPage.screenshot({ path: `${output}/phone-reduced-result.png`, fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  await writeFile(`${output}/verification.json`, JSON.stringify({ pass: true, url, checks, dimensions: { desktop, phone }, durations, consoleErrors: errors, failedResponses: failures }, null, 2));
  console.log(JSON.stringify({ pass: true, checks, output }, null, 2));
} finally { await browser.close(); }
