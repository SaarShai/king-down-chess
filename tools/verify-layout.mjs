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
    if (mode === 'zoom') await page.addInitScript(() => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1', moves: [], white: 'human', black: 'human', sound: false, pace: 'off' }));
    });
    await page.goto(env('PLAYABLE_URL'));
    await page.waitForFunction(() => window.view?.ready);
    await page.evaluate(() => window.view.ready());
    await page.evaluate(() => document.fonts.ready);
    if (mode === 'zoom') {
      await page.clock.runFor(100);
      const measure = () => page.evaluate(() => {
        const rect = id => document.getElementById(id).getBoundingClientRect().toJSON();
        return { board: rect('board'), end: rect('end-turn'), menu: rect('menu-btn'), scrollY,
          scrollHeight: document.scrollingElement.scrollHeight,
          canvasWidth: document.querySelector('#board canvas').getBoundingClientRect().width };
      });
      const initial = await measure();
      await shot(page, `${mode}-${width}x${height}`);
      if (height === 200) {
        check(initial.canvasWidth >= 280, '320×200: the board stays usable');
        check(initial.scrollHeight > height, '320×200: the page permits scroll');
        if (initial.scrollHeight > height) {
          await page.mouse.move(width / 2, height / 2);
          await page.mouse.wheel(0, 1000);
          await page.waitForFunction(() => scrollY > 0);
          const scrolled = await measure();
          check(scrolled.end.top >= 0 && scrolled.end.bottom <= height, '320×200: scroll reaches End turn');
          check(scrolled.menu.top >= 0 && scrolled.menu.bottom <= height, '320×200: scroll reaches Menu');
          await shot(page, `${mode}-${width}x${height}-actions`);
          await page.click('#menu-btn');
          await page.locator('#menu-sheet').waitFor({ state: 'visible' });
          await page.keyboard.press('Escape');
          await page.locator('#menu-sheet').waitFor({ state: 'hidden' });
        }
      }
      await noSidewaysScroll(page);
      evidence.push({ width, height, initial, final: await measure() });
      await context.close();
      continue;
    }
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
