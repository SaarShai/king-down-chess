// The initial surface shares one cold-play budget for its response and decode. Retry keeps the save.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { env, launch } from './lib/checks.mjs';
const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const browser = await launch();
const rows = [];
try {
  for (const [width, height] of [[360,640], [390,844], [1440,900]]) for (const setup of ['pieces', 'powers']) for (const fault of ['response', 'decode', 'failure']) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    let release = () => {}, held = false;
    if (fault === 'response' || fault === 'failure') await page.route('**/interface/stone-refined-light.webp', async route => {
      if (fault === 'failure') { await route.fulfill({ status: 200, contentType: 'image/webp', body: 'invalid test image' }); return; }
      held = true; await new Promise(resolve => { release = resolve; }); await route.continue();
    });
    await context.addInitScript(({ setup, fault }) => {
      localStorage.clear(); sessionStorage.clear(); localStorage.setItem('kingdown.solo-launch-seen', '1'); localStorage.setItem('kingdown.game-type', setup); localStorage.setItem('kingdown.pace', 'off');
      const src = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
      Object.defineProperty(HTMLImageElement.prototype, 'src', { ...src, set(value) {
        if (!window.oldStillError && String(value).includes('/ui/pieces/') && this.onerror) window.oldStillError = this.onerror.bind(this);
        src.set.call(this, value);
      } });
      if (fault === 'decode') {
        const decode = HTMLImageElement.prototype.decode;
        HTMLImageElement.prototype.decode = function () {
          if (this.src.endsWith('/interface/stone-refined-light.webp')) return new Promise((resolve, reject) => { window.releaseDecode = () => decode.call(this).then(resolve, reject); });
          return decode.call(this);
        };
      }
    }, { setup, fault });
    try {
      await page.goto(new URL('/next.html', env('PLAYABLE_URL')).href);
      await page.locator('.home-hero-new').click();
      await page.getByRole('button', { name: 'Start game', exact: true }).click();
      await page.getByRole('button', { name: 'Try again', exact: true }).waitFor({ state: 'visible', timeout: 15000 });
      if (fault === 'response') assert.equal(held, true, 'the surface response stays held');
      await page.locator('.play-versus').waitFor({ state: 'detached', timeout: 5000 });
      assert.equal(await page.locator('.play-versus').count(), 0, 'the entry cover ends');
      const saved = await page.evaluate(() => localStorage.getItem('kingdown.save'));
      assert.ok(saved, 'the game stays saved');
      if (width === 360) await page.screenshot({ path: `${out}/${width}-${setup}-${fault}.png` });
      await page.getByRole('button', { name: 'Try again', exact: true }).click();
      await page.waitForFunction(() => {
        const host = document.querySelector('.play-board-host');
        return host && getComputedStyle(host).visibility === 'visible' && !document.querySelector('.play-fault') && document.querySelectorAll('.play-square').length === 64;
      }, null, { timeout: 15000 });
      const current = await page.evaluate(() => localStorage.getItem('kingdown.save'));
      assert.equal(current, saved, 'retry keeps the exact save');
      assert.equal(await page.evaluate(() => typeof window.oldStillError), 'function', 'an old still error is held');
      await page.evaluate(() => window.oldStillError(new Event('error')));
      if (held) release();
      if (fault === 'decode') await page.evaluate(() => window.releaseDecode());
      await page.waitForTimeout(150);
      assert.equal(await page.locator('.play-fault, .play-versus').count(), 0, 'late old work cannot replace the new board');
      // A live keyboard action proves that the old entry key handler is gone.
      await page.locator('.play-square[data-square="12"]').focus(); await page.keyboard.press('ArrowUp');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-square')), '20');
      assert.deepEqual(errors, []);
      rows.push({ width, height, setup, fault, ok: true, errors });
      console.log(`PASS ${width}x${height} ${setup} ${fault}`);
    } catch (error) {
      await page.screenshot({ path: `${out}/${width}-${setup}-${fault}-failed.png` });
      throw error;
    } finally { release(); await context.close(); }
  }
  writeFileSync(`${out}/results.json`, JSON.stringify(rows, null, 2) + '\n');
} finally { await browser.close(); }
