import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://127.0.0.1:5292/docs/specs/effects-animation/preview/concepts/promotion/';
const output = process.argv[3];
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], errors = [];
const check = (name, pass) => { assert.ok(pass, name); checks.push(name); };
const state = page => page.evaluate(() => window.motionConcept.getState());
const seek = (page, progress) => page.evaluate(value => window.motionConcept.seek(value), progress);
const save = async (page, name) => { if (output) await page.screenshot({ path: join(output, name), fullPage: true }); };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(url);
  await page.waitForFunction(() => window.motionConcept?.ready, { timeout: 15000 });
  check('Starts settled without autoplay', (await state(page)).progress === 1 && !(await state(page)).playing);
  const finalImages = [];
  for (const id of ['queen', 'knight']) {
    await page.evaluate(id => window.motionConcept.select(id), id);
    for (const flip of [false, true]) {
      if ((await state(page)).flipped !== flip) await page.locator('#flip').click();
      const anchor = (await state(page)).foot;
      for (const progress of [0, .12, .26, .4, 470 / 840, .8, 1]) {
        await seek(page, progress);
        const result = await state(page);
        check(`${id}/${flip ? 'flipped' : 'normal'}/${progress.toFixed(3)}: actor stays visible`, Math.max(result.pawnOpacity, result.resultOpacity) >= .5);
        check(`${id}/${flip ? 'flipped' : 'normal'}/${progress.toFixed(3)}: fixed transform anchor`, JSON.stringify(result.foot) === JSON.stringify(anchor));
        if (progress === 470 / 840) {
          check(`${id}/${flip ? 'flipped' : 'normal'}: selected identity at transform midpoint`, result.identity === id && result.resultOpacity === 1 && result.pawnOpacity === 0);
          await save(page, `promotion-${id}-${flip ? 'flipped' : 'normal'}-midpoint.png`);
        }
      }
      const result = await state(page);
      check(`${id}/${flip ? 'flipped' : 'normal'}: legal quiet result`, result.fixtureLegal && result.action === `d7-d8=${id === 'queen' ? 'Q' : 'N'}` && result.board[59] === (id === 'queen' ? 5 : 2) && result.board[51] === 0);
      await seek(page, .4);
      const first = await page.locator('canvas').screenshot();
      await seek(page, .8); await seek(page, .4);
      check(`${id}/${flip ? 'flipped' : 'normal'}: deterministic seek pixels`, first.equals(await page.locator('canvas').screenshot()));
      await seek(page, 1);
    }
    await page.locator('#flip').click();
    finalImages.push(await page.locator('canvas').screenshot());
  }
  check('Queen and knight use different artwork', !finalImages[0].equals(finalImages[1]));
  for (const [width, height] of [[1440, 900], [1280, 800], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await seek(page, .32);
    const bounds = await page.evaluate(() => {
      const board = document.querySelector('canvas').getBoundingClientRect(), controls = document.querySelector('aside').getBoundingClientRect(), caption = document.querySelector('.caption').getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth > innerWidth, board: { x: board.x, y: board.y, right: board.right, bottom: board.bottom }, controlsBottom: controls.bottom, captionBottom: caption.bottom };
    });
    check(`${width}: no horizontal overflow`, !bounds.overflow && bounds.board.x >= 0 && bounds.board.right <= width);
    if (width > 760) check(`${width}: board, status and controls fit laptop height`, Math.max(bounds.board.bottom, bounds.controlsBottom, bounds.captionBottom) <= height);
    await save(page, `promotion-${width}-veil.png`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#speed').selectOption('0.4');
  await page.locator('#replay').click();
  await page.waitForFunction(() => window.motionConcept.getState().progress > .08);
  await page.locator('#play').click();
  const paused = await state(page);
  check('Replay starts and Pause stops', !paused.playing && paused.progress > 0 && paused.progress < 1 && paused.speed === .4);
  await page.locator('#scrub').focus();
  await page.keyboard.press('Home');
  check('Keyboard scrub seeks to start', (await state(page)).progress === 0);
  await page.keyboard.press('End');
  check('Keyboard scrub seeks to end', (await state(page)).progress === 1);
  await page.locator('[data-choice=queen]').focus(); await page.keyboard.press('Enter');
  check('Keyboard choice selects queen', (await state(page)).id === 'queen');
  await page.locator('#play').focus(); await page.keyboard.press('Space');
  await page.waitForFunction(() => window.motionConcept.getState().playing);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  check('Hidden event stops playback', !(await state(page)).playing);
  await page.evaluate(() => { delete document.hidden; });
  await page.setViewportSize({ width: 390, height: 400 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector('canvas').getBoundingClientRect().bottom > 0);
  await page.locator('#replay').click({ force: true });
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(() => !window.motionConcept.getState().playing);
  check('Offscreen stops before completion', (await state(page)).progress < 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => window.motionConcept.getState().reduced);
  check('System preference change shows final result', (await state(page)).progress === 1 && !(await state(page)).playing);
  await page.locator('#replay').click(); await seek(page, .1);
  check('Reduced replay and seek keep selected final identity', (await state(page)).identity === 'queen' && (await state(page)).progress === 1);
  check('Reduced playback controls are disabled', await page.locator('#play').isDisabled() && await page.locator('#scrub').isDisabled() && await page.locator('#speed').isDisabled());
  await page.evaluate(() => window.motionConcept.select('knight'));
  check('Reduced choice keeps knight identity', (await state(page)).identity === 'knight');
  await page.evaluate(() => scrollTo(0, 0));
  await save(page, 'promotion-phone-reduced.png');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !window.motionConcept.getState().reduced);
  check('System motion change restores controls', await page.locator('#play').isEnabled());
  await page.locator('#reduced').check();
  check('Manual reduced motion shows final', (await state(page)).reduced && (await state(page)).progress === 1);
  const reducedPage = await browser.newPage({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await reducedPage.goto(url + '?sample=knight');
  await reducedPage.waitForFunction(() => window.motionConcept?.ready);
  check('System reduced motion on load honors knight choice', (await state(reducedPage)).reduced && (await state(reducedPage)).identity === 'knight' && !(await state(reducedPage)).playing);
  check('No browser errors or failed resource responses', errors.length === 0);
  const report = { url, checks: checks.length, passed: checks, errors };
  if (output) await writeFile(join(output, 'promotion-checks.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: checks.length, errors }));
} finally { await browser.close(); }
