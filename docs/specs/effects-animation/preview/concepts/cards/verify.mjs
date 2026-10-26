import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const url = 'http://127.0.0.1:5291/docs/specs/effects-animation/preview/concepts/cards/';
const out = process.env.CASTING_OUT || '/tmp/kingdown-casting-check';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], checks = [], frames = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.motionConcept?.ready, {}, { timeout: 8000 });
  const state = () => page.evaluate(() => window.motionConcept.getState());
  const seek = n => page.evaluate(p => window.motionConcept.seek(p), n);
  const select = id => page.evaluate(id => window.motionConcept.select(id), id);
  const capture = async name => { await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });frames.push(name); };
  const fit = async laptop => {
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
    for (const name of ['#board', '#hand', '#replay', '#play', '#scrub', '#flip', '#reduced']) {
      const r = await page.locator(name).boundingBox();
      assert(r && r.x >= 0 && r.x + r.width <= (await page.viewportSize()).width + 1, `${name} fits the width`);
      if (laptop) assert(r.y >= 0 && r.y + r.height <= (await page.viewportSize()).height, `${name} fits the laptop height`);
    }
  };
  let s = await state();assert.equal(s.playing, false);assert.equal(s.progress, 1);assert.equal(s.slots, 4);assert.equal(s.remaining, 3);assert.equal(s.shownFen, s.afterFen);
  checks.push('Settled start; four real card slots; one spent; final engine position');
  await fit(true);await capture('desktop-freeze-result');
  for (const dense of [true, false]) {
    if ((await state()).dense !== dense) await page.locator('#dense').setChecked(dense);
    for (const id of ['freeze', 'firewall']) {
      await select(id);s = await state();assert(s.fixtureLegal && s.boardUnchanged);assert.equal(s.shownFen, s.afterFen);
      await seek(0);s = await state();assert.equal(s.remaining, 4);assert.equal(s.spent, 0);assert.equal(s.materialProgress, 0);assert.equal(s.shownFen, s.beforeFen);
      await seek(.06);await capture(`${dense ? 'dense' : 'fixture'}-${id}-prepare`);
      await seek(.21);await capture(`${dense ? 'dense' : 'fixture'}-${id}-release`);
      await seek(1);await capture(`${dense ? 'dense' : 'fixture'}-${id}-result`);
      assert.equal((await state()).shownFen, (await state()).afterFen);
      if (id === 'firewall') assert((await state()).continuationPending);
      checks.push(`${id}, ${dense ? 'dense legal board' : 'shared legal fixture'}: source, material onset, final identity, hand count`);
    }
  }
  await page.locator('#dense').check();await select('freeze');
  await page.locator('[data-treatment=wisp]').click();await seek(.14);await capture('desktop-freeze-wisp');
  const readCanvases = () => page.evaluate(() => ['board', 'source-material'].map(id => document.getElementById(id).toDataURL()));
  const a = await readCanvases();await seek(.4);await seek(.14);const b = await readCanvases();assert.deepEqual(a, b, 'A repeated seek gives identical canvas pixels');
  checks.push('Short wisp comparison; repeated seek gives identical board and source canvas pixels');
  await page.locator('#replay').click();await page.waitForFunction(() => window.motionConcept.getState().progress > .1);
  await page.locator('#play').click();s = await state();assert.equal(s.playing, false);const held = s.progress;
  await page.waitForTimeout(90);assert.equal((await state()).progress, held);
  await page.locator('#play').focus();await page.keyboard.press('Space');await page.waitForFunction(() => window.motionConcept.getState().playing);
  await page.locator('#play').click();await page.locator('#scrub').focus();await page.keyboard.press('Home');assert.equal((await state()).progress, 0);await page.keyboard.press('ArrowRight');assert((await state()).progress > 0);
  await page.selectOption('#speed', '0.5');assert.equal((await state()).speed, .5);
  await page.locator('#flip').click();assert((await state()).flipped);await seek(.3);await capture('desktop-flipped');
  checks.push('Replay; pause holds; keyboard Play and range; slow speed; board flip');
  await page.setViewportSize({ width: 1440, height: 768 });await fit(true);await seek(1);await capture('laptop-1440x768');
  await page.setViewportSize({ width: 390, height: 844 });await fit(true);
  for (const id of ['freeze', 'firewall']) {
    await select(id);await seek(.2);await capture(`phone-${id}-release`);await seek(1);await capture(`phone-${id}-result`);
  }
  await page.locator('#flip').click();await select('freeze');await seek(1);await capture('phone-freeze-white-side');
  checks.push('390 px and 1440 px: no horizontal overflow; laptop stage and controls fit 768 px height; both orientations');
  await page.emulateMedia({ reducedMotion: 'reduce' });await page.waitForFunction(() => window.motionConcept.getState().reduced);s = await state();assert(s.reduced && !s.playing);assert.equal(s.progress, 1);assert.equal(s.shownFen, s.afterFen);assert.equal(s.remaining, 3);
  await page.locator('#replay').click();s = await state();assert.equal(s.playing, false);assert.equal(s.materialProgress, .42);assert.equal(s.shownFen, s.afterFen);await capture('phone-reduced-result');
  await page.emulateMedia({ reducedMotion: 'no-preference' });await page.waitForFunction(() => !window.motionConcept.getState().reduced);assert.equal((await state()).reduced, false);
  await page.locator('#reduced').check();assert((await state()).reduced);await page.locator('#reduced').uncheck();
  checks.push('System reduce change and manual reduced motion give the same stable engine result; no travel');
  await page.selectOption('#speed', '1');
  for (const id of ['freeze', 'firewall']) {
    await select(id);await page.locator('#replay').click();await page.waitForFunction(() => window.motionConcept.getState().playing);
    await page.waitForFunction(() => window.motionConcept.getState().progress === 1 && !window.motionConcept.getState().playing);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const done = await state();assert.equal(done.shownFen, done.afterFen);const frames = done.sceneFrames;
    await page.waitForTimeout(100);assert.equal((await state()).sceneFrames, frames);
  }
  checks.push('Both cards play to the correct result and stop drawing after completion');
  await page.locator('#replay').click();await page.waitForFunction(() => window.motionConcept.getState().playing);
  await page.evaluate(() => { document.querySelector('.stage').style.marginTop = '1500px'; });
  await page.waitForFunction(() => !window.motionConcept.getState().playing);await page.evaluate(() => { document.querySelector('.stage').style.marginTop = ''; });
  const reducedPage = await browser.newPage({ reducedMotion: 'reduce' });await reducedPage.goto(url);await reducedPage.waitForFunction(() => window.motionConcept?.ready);assert(await reducedPage.evaluate(() => window.motionConcept.getState().reduced && window.motionConcept.getState().progress === 1));await reducedPage.close();
  checks.push('System reduced motion is read on initial load');
  const hiddenPage = await browser.newPage();await hiddenPage.goto(url);await hiddenPage.waitForFunction(() => window.motionConcept?.ready);
  await hiddenPage.locator('#replay').click();
  const cdp = await hiddenPage.context().newCDPSession(hiddenPage);
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  await hiddenPage.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true });document.dispatchEvent(new Event('visibilitychange')); });
  assert.equal(await hiddenPage.evaluate(() => window.motionConcept.getState().playing), false);await hiddenPage.close();
  checks.push('Offscreen and hidden state stop playback');
  assert.deepEqual(errors, []);
  await writeFile(`${out}/verification.json`, JSON.stringify({ status: 'pass', checks, frames, errors }, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'pass', checks, frameCount: frames.length, out }, null, 2));
} finally { await browser.close(); }
