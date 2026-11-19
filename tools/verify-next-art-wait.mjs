// Play on the first board frame while the art is slow or fails.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { env } from './lib/checks.mjs';

const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const art = /\/(?:interface\/stone-refined-light\.webp|ui\/(?:pieces\/[^/]+\.webp|icons\/[^/]+\.svg)|assets\/[^/]+\.webp|docs\/2d-first-pieces\/[^?]+\.webp|character-runtime\/[^?]+)(?:\?.*)?$/;
const board = '.play-board-host canvas';
const state = page => page.locator(board).evaluate(canvas => {
  const ctx = canvas.getContext('2d'), scale = canvas.width / 960;
  const pixel = (x, y) => Array.from(ctx.getImageData(x * scale, y * scale, 1, 1).data);
  return {
    letters: canvas.letters ?? [], images: canvas.images ?? [],
    light: pixel(42, 554), dark: pixel(154, 554),
  };
});

for (const [name, engine, device] of [
  ['phone', webkit, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }],
  ['desktop', chromium, { viewport: { width: 1280, height: 800 } }],
]) {
  const browser = await engine.launch();
  try {
    for (const cards of ['Off', 'On']) for (const pieces of ['figures', 'symbols']) for (const fault of ['delay', 'failure']) {
      const reducedMotion = cards === 'On' && pieces === 'figures' && fault === 'delay' ? 'no-preference' : 'reduce';
      const context = await browser.newContext({ ...device, colorScheme: 'light', reducedMotion, serviceWorkers: 'block' });
      const label = `${name}-cards-${cards.toLowerCase()}-${pieces}-${fault}`;
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      let release, released = false, timer;
      const hold = new Promise(done => { release = () => { released = true; done(); }; });
      let stoneRequests = 0;
      await page.route(art, async route => {
        if (route.request().resourceType() === 'script') return route.continue();
        if (route.request().url().includes('/interface/stone-refined-light.webp')) stoneRequests++;
        if (fault === 'failure') return route.abort();
        await hold; await route.continue();
      });
      await page.addInitScript(pieces => {
        localStorage.setItem('kingdown.solo-launch-seen', '1');
        localStorage.setItem('kingdown.piece-view', pieces);
        // Count text and images on the real board canvas for each frame.
        const proto = CanvasRenderingContext2D.prototype;
        const board = ctx => ctx.canvas.parentElement?.classList.contains('play-board-host');
        const { clearRect, fillText, drawImage } = proto;
        proto.clearRect = function (...args) {
          if (board(this)) { this.canvas.letters = []; this.canvas.images = []; }
          return clearRect.apply(this, args);
        };
        proto.fillText = function (letter, ...args) {
          if (board(this) && /^[A-Z]$/.test(letter)) {
            const { e: x, f: y } = this.getTransform();
            this.canvas.letters.push({ letter, x, y });
          }
          return fillText.call(this, letter, ...args);
        };
        proto.drawImage = function (image, ...args) {
          if (board(this) && image instanceof HTMLImageElement) this.canvas.images.push(image.src);
          return drawImage.call(this, image, ...args);
        };
      }, pieces);
      const press = locator => name === 'phone' ? locator.tap() : locator.click();
      try {
        await page.goto(new URL('/next.html', env('PLAYABLE_URL')).href, { waitUntil: 'domcontentloaded' });
        await press(page.locator('.home-summary'));
        await press(page.getByRole('group', { name: 'Cards', exact: true }).getByRole('radio', { name: cards, exact: true }));
        timer = setTimeout(release, 5000);
        await press(page.getByRole('button', { name: 'Start game', exact: true }));
        await page.locator('.play-grid:not([inert])').waitFor({ state: 'visible' });
        await page.waitForFunction(() => !document.querySelector('.new-game-panel, .play-versus'));
        assert.ok(await page.locator(board).isVisible(), 'the canvas shows before the board takes input');
        const first = await state(page);
        assert.deepEqual(first.light, [233, 230, 213, 255], 'draw the light square');
        assert.deepEqual(first.dark, [137, 151, 123, 255], 'draw the dark square');
        assert.equal(first.letters.length, 32, 'draw every piece without art');
        assert.ok(stoneRequests, 'the art route applies to the board surface');
        assert.equal(released, false, 'the first frame does not wait for the five-second delay');
        assert.match(await page.locator('.play-state').textContent(), /Your turn/);
        assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')))).rules.hands[0].length > 0, cards === 'On');
        await page.screenshot({ path: join(out, `${label}.png`) });
        await press(page.getByRole('gridcell', { name: 'a2 Light Pawn' }));
        await press(page.getByRole('gridcell', { name: 'a3 empty' }));
        assert.match(await page.locator('.play-square[data-square="16"]').getAttribute('aria-label'), /a3 Light Pawn/);
        if (label === 'phone-cards-on-figures-delay') {
          await page.waitForFunction(board => {
            const canvas = document.querySelector(board), scale = canvas.width / 960;
            return canvas.letters.some(({ letter, x, y }) => letter === 'P' && x === 88 * scale && y === 712 * scale);
          }, board);
          await page.screenshot({ path: join(out, `${label}-move.png`) });
        }
        await press(page.getByRole('button', { name: 'End turn', exact: true }));
        await page.waitForFunction(() => JSON.parse(localStorage.getItem('kingdown.save')).moves.length > 1);
        if (fault === 'delay') {
          await page.waitForFunction(({ board, pieces }) => {
            const canvas = document.querySelector(board), images = canvas?.images ?? [];
            return images.some(src => src.includes('/interface/stone-refined-light.webp')) &&
              images.some(src => pieces === 'figures' ? src.includes('/ui/pieces/') : src.startsWith('data:image/svg+xml'));
          }, { board, pieces });
          await page.screenshot({ path: join(out, `${label}-loaded.png`) });
        } else {
          assert.equal(await page.locator('.play-fault').count(), 0, 'play continues after the art fails');
          // Effects such as Freeze can draw pieces on a separate canvas.
          assert.ok((await state(page)).letters.length > 0, 'pieces remain visible after the reply');
        }
        assert.deepEqual(errors, []);
        console.log(`PASS ${label}`);
      } catch (error) {
        await page.screenshot({ path: join(out, `${label}-check-failed.png`) });
        throw error;
      } finally { clearTimeout(timer); release(); await context.close(); }
    }
  } finally { await browser.close(); }
}
