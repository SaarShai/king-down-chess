// Play on the first board frame while the art is slow or fails.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';
import { env } from './lib/checks.mjs';

const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const art = /\/(?:interface\/(?:stone-refined-light|computer-king-[^/]+)\.webp|ui\/(?:pieces\/[^/]+\.webp|icons\/[^/]+\.svg|(?:cards|emblems)\/[^?]+)|assets\/[^/]+\.webp|docs\/2d-first-pieces\/[^?]+\.webp|character-runtime\/[^?]+)(?:\?.*)?$/;
const rookSheet = /\/(?:assets\/rook-[^/]+|docs\/2d-first-pieces\/rook\/rook)\.webp(?:\?.*)?$/;
const home = new URL('/next.html', env('PLAYABLE_URL')).href;
const board = '.play-board-host canvas';
const state = page => page.locator(board).evaluate(canvas => {
  const ctx = canvas.getContext('2d'), scale = canvas.width / 960;
  const pixel = (x, y) => Array.from(ctx.getImageData(x * scale, y * scale, 1, 1).data);
  return {
    letters: canvas.letters ?? [], images: canvas.images ?? [], frame: canvas.frame ?? 0,
    light: pixel(42, 554), dark: pixel(154, 554),
  };
});

function observeBoard(pieces) {
  localStorage.setItem('kingdown.solo-launch-seen', '1');
  localStorage.setItem('kingdown.piece-view', pieces);
  // Count text and images on the real board canvas for each frame.
  const proto = CanvasRenderingContext2D.prototype;
  const board = ctx => ctx.canvas.parentElement?.classList.contains('play-board-host');
  const { clearRect, fillText, drawImage } = proto;
  proto.clearRect = function (...args) {
    if (board(this)) { this.canvas.letters = []; this.canvas.images = []; this.canvas.frame = (this.canvas.frame ?? 0) + 1; }
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
}

async function checkStreamedRook(browser, device) {
  const context = await browser.newContext({ ...device, colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  const { promise: holdSheet, resolve: releaseSheet } = Promise.withResolvers();
  const { promise: holdStills, resolve: releaseStills } = Promise.withResolvers();
  let bytes;
  const stream = createServer((_, response) => {
    response.writeHead(200, { 'Content-Type': 'image/webp', 'Content-Length': bytes.length, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
    response.write(bytes.subarray(0, 60_000));
    void holdSheet.then(() => response.end(bytes.subarray(60_000)));
  });
  await new Promise(resolve => stream.listen(0, '127.0.0.1', resolve));
  try {
    await page.route(rookSheet, async route => {
      bytes ??= await (await route.fetch()).body();
      assert.ok(bytes.length > 60_000, 'the first chunk is only part of the Rook sheet');
      await route.fulfill({ status: 302, headers: { location: `http://127.0.0.1:${stream.address().port}/rook.webp` } });
    });
    await page.route(/\/ui\/pieces\//, async route => { await holdStills; await route.continue(); });
    await page.route(/\/character-runtime\//, route => route.abort());
    await page.addInitScript(observeBoard, 'figures');
    await page.addInitScript(pattern => {
      localStorage.setItem('kingdown.save', JSON.stringify({ back: 'RNBQKBNR', fen: '', moves: ['e2-e4', 'e7-e5'], white: 'human', black: 'ai', coords: true, link: null, daily: null, resigned: null, skill: 'beginner', sound: false, pace: 'off' }));
      const sheet = new RegExp(pattern);
      const isSheet = image => sheet.test(image.src);
      window.rookImages = [];
      window.incompleteRookDraws = 0;
      window.Image = class extends Image { constructor() { super(); window.rookImages.push(this); } };
      const { drawImage } = CanvasRenderingContext2D.prototype;
      CanvasRenderingContext2D.prototype.drawImage = function (image, ...args) {
        if (image instanceof HTMLImageElement && isSheet(image) && !image.complete) window.incompleteRookDraws++;
        return drawImage.call(this, image, ...args);
      };
      const { decode } = HTMLImageElement.prototype;
      const held = new Promise(resolve => { window.releaseRookDecode = resolve; });
      window.rookDecodes = 0;
      HTMLImageElement.prototype.decode = function () {
        if (/\/ui\/pieces\/rook-[wb]\.webp$/.test(this.src)) { window.rookDecodes++; return held.then(() => decode.call(this)); }
        return decode.call(this);
      };
      window.rookSheet = () => window.rookImages.find(isSheet);
    }, rookSheet.source);

    await page.goto(home, { waitUntil: 'domcontentloaded' });
    await page.locator('.home-continue').click();
    await page.locator('.play-grid:not([inert])').waitFor({ state: 'visible' });
    await page.waitForFunction(() => { const image = window.rookSheet(); return image?.naturalWidth > 0 && !image.complete; });
    const checkLetters = async () => assert.equal((await state(page)).letters.filter(({ letter }) => letter === 'R').length, 4);
    const rook = page.getByRole('gridcell', { name: 'a1 Light Rook', exact: true });
    const redraw = async () => {
      const { frame } = await state(page);
      await rook.click();
      await page.waitForFunction(({ board, frame }) => document.querySelector(board).frame > frame, { board, frame });
    };
    await redraw();
    assert.equal(await page.evaluate(() => window.incompleteRookDraws), 0, 'never draw an incomplete sheet into a sprite');
    await checkLetters();
    await page.screenshot({ path: join(out, 'desktop-stream-rook-partial.png') });

    releaseSheet();
    await page.waitForFunction(() => window.rookSheet()?.complete);
    await redraw();
    await checkLetters();
    releaseStills();
    await page.waitForFunction(() => window.rookDecodes >= 2);
    await redraw();
    await checkLetters();
    await page.evaluate(() => window.releaseRookDecode());
    await page.waitForFunction(board => {
      const { letters, images } = document.querySelector(board);
      return !letters.some(({ letter }) => letter === 'R') && ['w', 'b'].every(side => images.filter(src => src.endsWith(`/ui/pieces/rook-${side}.webp`)).length === 2);
    }, board);
    await page.screenshot({ path: join(out, 'desktop-stream-rook-loaded.png') });
    console.log('PASS desktop-stream-rook: letters through partial sheet, full sheet and pending still decode');
  } finally {
    releaseSheet(); releaseStills();
    await context.close();
    await new Promise(resolve => stream.close(resolve));
  }
}

for (const [name, engine, device] of [
  ['phone', webkit, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }],
  ['desktop', chromium, { viewport: { width: 1280, height: 800 } }],
]) {
  const browser = await engine.launch();
  try {
    if (name === 'desktop') await checkStreamedRook(browser, device);
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
      await page.addInitScript(observeBoard, pieces);
      const press = locator => name === 'phone' ? locator.tap() : locator.click();
      try {
        await page.goto(home, { waitUntil: 'domcontentloaded' });
        await press(page.locator('.home-hero-new'));
        const cardsSwitch = page.getByRole('switch', { name: 'Cards', exact: true });
        if ((await cardsSwitch.getAttribute('aria-checked') === 'true') !== (cards === 'On')) await press(cardsSwitch);
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
            const hasPiece = images.some(src => pieces === 'figures'
              ? src.includes('/ui/pieces/') || src.includes('/character-runtime/assets/')
              : src.startsWith('data:image/svg+xml'));
            return hasPiece && images.some(src => src.includes('/interface/stone-refined-light.webp'));
          }, { board, pieces });
          await page.screenshot({ path: join(out, `${label}-loaded.png`) });
        } else {
          assert.equal(await page.locator('.play-fault').count(), 0, 'play continues after the art fails');
          // Effects such as Freeze can draw pieces on a separate canvas.
          assert.ok((await state(page)).letters.length > 0, 'pieces remain visible after the reply');
          const failed = await page.locator('.play-seat-ring img, .play-card img').evaluateAll(images => images.map(img => [img.complete, img.naturalWidth, img.style.visibility]));
          assert.ok(failed.length && failed.every(([complete, width, visibility]) => complete && width === 0 && visibility === 'hidden'), 'failed decorative pictures are hidden');
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
