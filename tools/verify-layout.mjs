// Keep content and actions in reach at short screen heights.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, launch, noSidewaysScroll, shot } from './lib/checks.mjs';

const mode = process.argv[2];
const sizes = [[375, 812], [320, 568], [852, 393], [768, 1024], [1280, 800], [320, 200]];
const browser = await launch();
const evidence = [], faults = [];
const check = (value, words) => { try { assert.ok(value, words); } catch (error) { faults.push(error); } };
try {
  for (const [width, height] of sizes) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: true, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-10-26T12:00:00Z') });
    await page.goto(env('PLAYABLE_URL'));
    await page.waitForFunction(() => window.view?.ready);
    await page.evaluate(() => window.view.ready());
    await page.evaluate(() => document.fonts.ready);
    await page.locator('#title-start').waitFor({ state: 'visible' });
    await page.locator('#title-screen img').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
    await page.clock.runFor(100);
    const measure = () => page.evaluate(() => {
      const dialog = document.getElementById('title-screen');
      return { scrollTop: dialog.scrollTop, scrollHeight: dialog.scrollHeight, height: dialog.clientHeight,
        overflow: getComputedStyle(dialog).overflowY,
        note: dialog.querySelector('[data-account-play] small').getBoundingClientRect().toJSON() };
    });
    const initial = await measure();
    await shot(page, `${mode}-${width}x${height}`);
    await noSidewaysScroll(page);
    check(initial.note.top >= 0, `${width}×${height}: the title starts above its note`);
    if (initial.scrollHeight > initial.height) {
      check(initial.overflow === 'auto', `${width}×${height}: the title permits scroll`);
      if (initial.overflow === 'auto') {
        await page.mouse.move(width / 2, height / 2);
        await page.mouse.wheel(0, 600);
        await page.waitForFunction(() => document.getElementById('title-screen').scrollTop > 0);
        const wheel = await measure();
        check(wheel.note.bottom <= height, `${width}×${height}: wheel scroll shows the note`);
        await page.locator('#title-screen').evaluate(dialog => { dialog.scrollTop = 0; });
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width / 2, y: height - 20 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: width / 2, y: 20 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await page.waitForFunction(() => document.getElementById('title-screen').scrollTop > 0);
        await cdp.detach();
        await page.locator('#title-screen').evaluate(dialog => { dialog.scrollTop = dialog.scrollHeight; });
        await shot(page, `${mode}-${width}x${height}-scroll`);
      }
    } else check(initial.note.bottom <= height, `${width}×${height}: the full note fits`);
    evidence.push({ width, height, initial, final: await measure() });
    await context.close();
  }
  writeFileSync(join(env('PLAYABLE_OUT'), 'layout.json'), JSON.stringify(evidence, null, 2));
  if (faults.length) throw new AggregateError(faults, 'Layout checks fail');
  console.log(`ok ${mode}: six sizes; content stays in reach`);
} finally { await browser.close(); }
