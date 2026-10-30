// Keep content and actions in reach at short screen heights.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { endTurn } from './app-ui.mjs';
import { env, launch, noSidewaysScroll, shot } from './lib/checks.mjs';

const mode = process.argv[2];
const sizes = [[375, 812], [320, 568], [852, 393], [768, 1024], [1280, 800], [320, 200]];
// Title measurements after removal of the local-play note.
const phonePieces = [[37.58, 47.36], [36.33, 50.55], [33.05, 55.67], [50.48, 61.44], [33.95, 50.55], [35.78, 51.83], [35.27, 46.08], [40.92, 55.03], [38.52, 49.91], [33.91, 42.23], [44.53, 55.67], [50.39, 64]];
const titleLayout = {
  '375x812': { hero: [344.28, 197.87, 360, 167.06, 196.75, 418.16, 120], text: [46, 343, 59.69], pieces: phonePieces },
  '320x568': { hero: [71.23, -36.91, 307.19, 112.41, 28.52, 128.98, 37.03], text: [46, 288, 103.38], pieces: phonePieces },
  '852x393': {
    hero: [0, -108.83, 330.11, 108.83, 0, 0, 0], text: [71.57, 673.19, 92.88],
    pieces: [[54.03, 68.08], [52.23, 72.69], [47.52, 80.05], [72.59, 88.33], [48.83, 72.69], [51.47, 74.53], [50.72, 66.25], [58.84, 79.12], [55.39, 71.77], [48.75, 60.72], [64.03, 80.05], [72.45, 92.02]],
  },
  '768x1024': {
    hero: [606.97, 313.10, 737.27, 330.28, 372.48, 669.08, 192], text: [64.51, 606.88, 83.72],
    pieces: [[48.7, 61.38], [47.08, 65.52], [42.83, 72.16], [65.44, 79.62], [44.02, 65.52], [46.38, 67.17], [45.72, 59.72], [53.05, 71.33], [49.92, 64.69], [43.95, 54.73], [57.72, 72.16], [65.31, 82.94]],
  },
  '1280x800': {
    hero: [341.47, 108.88, 672, 253.07, 105.88, 737.73, 211.70], text: [96, 903.11, 124.59],
    pieces: [[65.78, 82.88], [63.58, 88.47], [57.84, 97.44], [88.36, 107.52], [59.44, 88.47], [62.64, 90.72], [61.72, 80.62], [71.62, 96.31], [67.42, 87.36], [59.34, 73.91], [77.94, 97.44], [88.19, 112]],
  },
};
const browser = await launch();
const evidence = [], faults = [];
const check = (value, words) => { try { assert.ok(value, words); } catch (error) { faults.push(error); } };
try {
  for (const [width, height] of sizes) {
    if (mode === 'result' && height === 200) continue;
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: true, serviceWorkers: 'block' });
    const page = await context.newPage();
    await page.clock.install({ time: new Date('2026-10-26T12:00:00Z') });
    if (mode !== 'title') await page.addInitScript(mode => {
      sessionStorage.setItem('kingdown.title-seen', '1');
      const fen = mode === 'result' ? '7k/6pp/8/8/8/R7/8/6MK w - - 0 1' : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
      localStorage.setItem('kingdown.save', JSON.stringify({ back: mode === 'result' ? '' : 'RNBQKBNR', fen, moves: [], white: 'human', black: 'human', sound: false, pace: 'off' }));
    }, mode);
    await page.goto(env('PLAYABLE_URL'));
    await page.waitForFunction(() => window.view?.ready);
    await page.evaluate(() => window.view.ready());
    await page.evaluate(() => document.fonts.ready);
    if (mode === 'result') {
      await page.clock.runFor(100);
      for (const square of [16, 56]) {
        const point = await page.evaluate(square => window.view.screenOf(square), square);
        await page.mouse.click(point.x, point.y);
      }
      await endTurn(page);
      await page.locator('#over').waitFor({ state: 'visible' });
      await page.locator('#over img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
      await page.clock.runFor(100);
      const measure = () => page.evaluate(() => {
        const dialog = document.getElementById('over');
        const rect = selector => dialog.querySelector(selector).getBoundingClientRect().toJSON();
        return { focus: document.activeElement.id, scrollTop: dialog.scrollTop, height: dialog.clientHeight,
          scrollHeight: dialog.scrollHeight, dialog: dialog.getBoundingClientRect().toJSON(),
          art: rect('.over-art'), words: rect('#over-words'), heading: rect('#over-title'),
          rematch: rect('[value="rematch"]') };
      });
      const initial = await measure();
      await shot(page, `${mode}-${width}x${height}`);
      check(initial.scrollTop === 0, `${width}×${height}: the result starts at the top`);
      check(initial.focus === 'over-title', `${width}×${height}: the result heading takes focus`);
      check(initial.art.top >= initial.dialog.top, `${width}×${height}: the king art is in view`);
      check(initial.heading.bottom <= initial.dialog.bottom, `${width}×${height}: the full heading is in view`);
      if (width === 320) {
        await page.locator('#over').evaluate(dialog => { dialog.scrollTop = 0; });
        await page.mouse.move(width / 2, height / 2);
        await page.mouse.wheel(0, 1000);
        await page.waitForFunction(() => document.getElementById('over').scrollTop > 0);
        await shot(page, `${mode}-${width}x${height}-actions`);
        for (const value of ['rematch', 'new', 'close']) {
          const box = await page.locator(`#over [value="${value}"]`).boundingBox();
          check(box.y >= 0 && box.y + box.height <= height, `320×568: scroll reaches ${value}`);
        }
        await page.locator('#over-title').focus();
        for (let n = 0; n < 6; n++) {
          if (await page.locator('#over [value="rematch"]').evaluate(button => button === document.activeElement)) break;
          await page.keyboard.press('Tab');
        }
        check(await page.locator('#over [value="rematch"]').evaluate(button => button === document.activeElement), '320×568: Tab reaches Rematch');
      }
      await noSidewaysScroll(page);
      evidence.push({ width, height, initial, final: await measure() });
      await context.close();
      continue;
    }
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
      const rect = selector => dialog.querySelector(selector).getBoundingClientRect();
      const stage = rect('.title-stage'), floor = rect('.title-floor'), kings = rect('.title-kings'), word = rect('.wordmark');
      return { scrollTop: dialog.scrollTop, scrollHeight: dialog.scrollHeight, height: dialog.clientHeight,
        overflow: getComputedStyle(dialog).overflowY,
        layout: {
          hero: [stage.height, floor.y, floor.width, floor.height, kings.y, kings.width, kings.height],
          text: [parseFloat(getComputedStyle(dialog.querySelector('.wordmark')).fontSize), word.width, word.height],
          pieces: [...dialog.querySelectorAll('.title-lineup img')].map(image => {
            const box = image.getBoundingClientRect();
            return [box.width, box.height];
          }),
        },
        note: dialog.querySelector('[data-account-play]').getBoundingClientRect().toJSON() };
    });
    const initial = await measure();
    await shot(page, `${mode}-${width}x${height}`);
    await noSidewaysScroll(page);
    const expected = titleLayout[`${width}x${height}`];
    if (expected) for (const part of ['hero', 'text', 'pieces']) {
      const actual = initial.layout[part].flat(), baseline = expected[part].flat();
      check(actual.length === baseline.length && actual.every((value, index) => Math.abs(value - baseline[index]) <= 0.02),
        `${width}×${height}: title ${part} matches the login layout; measured ${actual.join(', ')}`);
    }
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
  console.log(`ok ${mode}: ${evidence.length} sizes; content stays in reach`);
} finally { await browser.close(); }
