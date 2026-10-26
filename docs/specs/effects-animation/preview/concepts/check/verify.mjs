import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { samples } from './fixtures.ts';

const output = process.argv[2] ?? fileURLToPath(new URL('./captures/', import.meta.url));
const url = 'http://127.0.0.1:5293/docs/specs/effects-animation/preview/concepts/check/';
await mkdir(output, { recursive: true });
for (const s of samples) {
  assert.equal(s.rules.toLan(s.before, s.entry), 'Rd3-e3');
  assert.equal(s.rules.toLan(s.checked, s.evasion), 'Ke1-f1');
  assert.equal(s.rules.inCheck(s.checked), true);
  assert.equal(s.rules.inCheck({ ...s.checked, turn: 1 }), false);
  assert.equal(s.rules.inCheck(s.resolved), false);
  assert.equal(s.rules.inCheck({ ...s.resolved, turn: 0 }), false);
  assert.equal(s.rules.status(s.resolved), 'playing');
}
const browser = await chromium.launch({ headless: true });
const errors = [], failures = [], checks = [];
const state = page => page.evaluate(() => window.motionConcept.getState());
async function frame(page, progress) {
  const before = (await state(page)).sceneFrames;
  await page.evaluate(p => window.motionConcept.seek(p), progress);
  await page.waitForFunction(n => window.motionConcept.getState().sceneFrames > n, before);
}
async function bounds(page) {
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    board: (() => { const r = document.querySelector('#board').getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; })(),
    controls: [...document.querySelectorAll('button,select,input')].filter(e => !e.disabled).every(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }),
  }));
  assert.equal(result.overflow, false); assert.equal(result.controls, true); return result;
}
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', serviceWorkers: 'block' });
  const page = await context.newPage(); page.setDefaultTimeout(8000);
  page.on('pageerror', error => errors.push(String(error)));
  page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
  await page.goto(url); await page.waitForFunction(() => window.motionConcept?.ready); await page.evaluate(() => document.fonts.ready);
  let s = await state(page); assert.equal(s.playing, false); assert.equal(s.progress, 1); assert.equal(s.id, 'dense');
  assert.deepEqual(s.checkers, [{ sq: 20, king: 4, path: 'straight' }]); assert.equal(s.board.filter(Boolean).length, 28);
  const desktop = await bounds(page); assert.ok(desktop.board.bottom < 900);
  await page.screenshot({ path: `${output}/check-desktop.png` });
  for (const [name, p] of [['checker', .20], ['impression', .58], ['held', 1]]) {
    await frame(page, p); await page.screenshot({ path: `${output}/check-${name}.png` });
  }
  await frame(page, .58); const first = await page.locator('#board').evaluate(c => c.toDataURL());
  await frame(page, 0); await frame(page, .58); const second = await page.locator('#board').evaluate(c => c.toDataURL());
  assert.equal(first, second); checks.push('Repeated seek renders identical canvas pixels.');
  await page.selectOption('#speed', '0.5'); await page.click('#replay');
  await page.waitForFunction(() => window.motionConcept.getState().playing && window.motionConcept.getState().progress > .05);
  await page.click('#play'); s = await state(page); assert.equal(s.playing, false); const paused = s.progress;
  await page.waitForTimeout(100); assert.equal((await state(page)).progress, paused);
  await page.click('#play'); await page.waitForFunction(() => !window.motionConcept.getState().playing);
  assert.equal((await state(page)).progress, 1);
  await page.locator('#scrub').focus(); await page.keyboard.press('Home'); assert.equal((await state(page)).progress, 0);
  await page.keyboard.press('ArrowRight'); assert.ok((await state(page)).progress > 0);
  await page.keyboard.press('End'); assert.equal((await state(page)).progress, 1);
  await page.evaluate(() => document.activeElement.blur()); await page.keyboard.press('Space'); assert.equal((await state(page)).playing, true);
  await page.keyboard.press('Space'); assert.equal((await state(page)).playing, false);
  const durations = {};
  for (const [name, value] of [['normal','1'], ['slow','0.5']]) {
    await page.selectOption('#speed', value);
    const start = performance.now(); await page.click('#replay');
    await page.waitForFunction(() => !window.motionConcept.getState().playing);
    durations[name] = Math.round(performance.now() - start);
  }
  assert.ok(durations.slow > durations.normal * 1.4); checks.push(`Normal/slow replay: ${durations.normal}/${durations.slow} ms including browser input.`);
  await page.click('#resolve');
  s = await state(page); assert.equal(s.mode, 'resolve'); assert.equal(s.inCheck, false); assert.equal(s.resultKing, 'f1'); assert.deepEqual(s.checkers, []);
  assert.equal(s.board[4], 0); assert.equal(s.board[5], samples[0].checked.board[4]);
  await frame(page, .35); await page.screenshot({ path: `${output}/check-withdrawal.png` });
  await frame(page, 1); await page.screenshot({ path: `${output}/check-resolved.png` });
  assert.equal(await page.locator('#state-title').innerText(), 'Check resolved');
  await page.click('#replay'); await frame(page, .20); await page.click('#flip'); assert.equal((await state(page)).flipped, true);
  await frame(page, .58); await page.screenshot({ path: `${output}/check-flipped.png` });
  await page.click('#flip');
  await page.setViewportSize({ width: 1440, height: 800 });
  const laptop = await bounds(page); assert.ok(laptop.board.bottom < 800);
  await page.setViewportSize({ width: 390, height: 844 });
  await frame(page, 1); const phone = await bounds(page);
  await page.screenshot({ path: `${output}/check-phone.png`, fullPage: true });
  await page.click('#flip'); await frame(page, .58); await page.screenshot({ path: `${output}/check-phone-flipped.png`, fullPage: true });
  await page.click('#flip');
  for (const sample of ['open', 'dense']) { await page.selectOption('#sample', sample); assert.equal((await state(page)).id, sample); await bounds(page); }
  await page.locator('#reduced').check(); s = await state(page); assert.equal(s.reduced, true); assert.equal(s.progress, 1); assert.equal(s.playing, false);
  await page.click('#replay'); s = await state(page); assert.equal(s.mode, 'check'); assert.equal(s.progress, 1);
  await page.click('#resolve'); s = await state(page); assert.equal(s.mode, 'resolve'); assert.equal(s.progress, 1); assert.equal(s.playing, false);
  assert.equal(await page.locator('#play').isDisabled(), true); assert.equal(await page.locator('#scrub').isDisabled(), true);
  await page.screenshot({ path: `${output}/check-reduced-resolved.png`, fullPage: true });
  await page.locator('#reduced').uncheck(); await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.motionConcept.getState().reduced);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForFunction(() => !window.motionConcept.getState().reduced);
  await page.setViewportSize({ width: 390, height: 400 }); await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(50); await page.evaluate(() => document.querySelector('#replay').click());
  await page.waitForFunction(() => window.motionConcept.getState().playing);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => !window.motionConcept.getState().playing);
  assert.ok((await state(page)).progress < 1); checks.push('Offscreen playback stops before its final frame.');
  await page.evaluate(() => scrollTo(0,0)); await page.waitForTimeout(50);
  await page.evaluate(() => document.querySelector('#replay').click());
  await page.waitForFunction(() => window.motionConcept.getState().playing);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal((await state(page)).playing, false); checks.push('Simulated hidden-document visibility signal stops playback.');
  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage(); await reducedPage.goto(url); await reducedPage.waitForFunction(() => window.motionConcept?.ready);
  s = await state(reducedPage); assert.equal(s.reduced, true); assert.equal(s.playing, false); assert.equal(s.progress, 1);
  await reducedPage.click('#resolve'); assert.equal((await state(reducedPage)).resultKing, 'f1');
  assert.deepEqual(errors, []); assert.deepEqual(failures, []);
  checks.push('Both fixtures, legal result identity, replay, pause, resume, scrub, keyboard, flip, system reduced motion on load/change and direct reduced results pass.');
  await writeFile(`${output}/check-verification.json`, JSON.stringify({ pass: true, url, checks, dimensions: { desktop, laptop, phone }, consoleErrors: errors, failedResponses: failures }, null, 2));
  console.log(JSON.stringify({ pass: true, checks, artifacts: output }, null, 2));
} finally { await browser.close(); }
