import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, noSidewaysScroll, env } from '../../../../../../tools/lib/checks.mjs';

const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const server = await createServer({ root: resolve('.'), logLevel: 'error', server: { host: '127.0.0.1', port: 5324, strictPort: true, hmr: false } });
let browser;
const report = { viewports: [], captures: [] };
try {
  await server.listen();
  browser = await launch();
  const page = await browser.newPage();
  const errors = trapErrors(page);
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:5324/docs/specs/effects-animation/preview/card-art/crop-review/index.html');
  await page.waitForSelector('html[data-crop-review="ready"]');
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(image => image.decode()));
  });
  const deck = await page.evaluate(async () => (await import('/src/content/cards.ts')).RELEASED_CARDS);
  assert.equal(deck.length, 21, 'released deck count');
  assert.deepEqual(deck.map(card => card.id), ['Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap', 'Salvation', 'MirrorB', 'Firewall', 'EarthQuake', 'Burn', 'FireStarter', 'Control', 'Rally', 'MorphP', 'Mimic', 'Vault', 'Curse', 'SkyLift'], 'all current released IDs');
  assert.deepEqual(await page.locator('[data-card-id]').evaluateAll(rows => rows.map(row => row.dataset.cardId)), deck.map(card => card.id), 'render every released card in deck order');
  assert.equal(await page.locator('[data-kind="painting"] .cf-art > img').count(), 12, '12 released paintings');
  assert.equal(await page.locator('[data-kind="rule"] .cf-art > svg.card-picture').count(), 9, '9 actual rule pictures');
  assert.equal(await page.locator('[data-kind="rule"] .source').count(), 0, 'no invented painting for a rule picture');
  assert.equal(await page.locator('[data-extra]').count(), 2, 'two extra files');
  assert.match(await page.locator('[data-extra="Rescue"]').innerText(), /Not in the released deck/);
  assert.match(await page.locator('[data-extra="Back"]').innerText(), /Hidden-card asset/);
  for (const card of deck) {
    const row = page.locator(`[data-card-id="${card.id}"]`);
    assert.equal(await row.locator('h2').innerText(), card.name, `${card.id}: name`);
    assert.equal(await page.locator(`#jump-index a[href="#${card.id}"]`).count(), 1, `${card.id}: jump link`);
    // Compare with the renderer's output, not a second copy of the SVG or art map.
    assert(await row.locator('.cf-art').evaluate(async (node, id) => {
      const { cardArt } = await import('/src/plugin/card-face.ts');
      const expected = document.createElement('template');
      expected.innerHTML = cardArt(id);
      return node.innerHTML === expected.innerHTML;
    }, card.id), `${card.id}: exact current cardArt output`);
    if (card.art) {
      assert((await row.locator('.source > img').getAttribute('src')).endsWith(card.art), `${card.id}: original asset`);
    }
  }
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await noSidewaysScroll(page);
    const geometry = await page.evaluate(() => ({
      windows: [...document.querySelectorAll('.cf-art')].map(node => {
        const box = node.getBoundingClientRect(), image = node.querySelector('img');
        const style = image && getComputedStyle(image);
        const imageBox = image?.getBoundingClientRect();
        return { id: node.closest('.review-row').id, width: box.width, height: box.height, fit: style?.objectFit, position: style?.objectPosition, opacity: style?.opacity, imageWidth: imageBox?.width, imageHeight: imageBox?.height, imageTop: imageBox && imageBox.top - box.top };
      }),
      sources: [...document.querySelectorAll('.source')].map(node => {
        const box = node.getBoundingClientRect(), band = node.querySelector('.crop-guide > i').getBoundingClientRect(), image = node.querySelector('img');
        return { id: node.closest('.review-row').id, width: box.width, height: box.height, bandWidth: band.width, bandHeight: band.height, bandTop: (band.top - box.top) / box.height, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, link: node.href, image: image.src };
      }),
      imagesLoaded: [...document.images].every(image => image.complete && image.naturalWidth > 0),
      clipped: [...document.querySelectorAll('h1, h2, h3, p, figcaption, .cf-text, #jump-index')].filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent),
    }));
    assert(geometry.imagesLoaded, 'all image assets load');
    assert.deepEqual(geometry.clipped, [], 'text does not overflow');
    assert.equal(geometry.windows.length, 23);
    assert.equal(geometry.sources.length, 14);
    for (const window of geometry.windows) {
      assert(Math.abs(window.width / window.height - 16 / 9) < .01, `${window.id}: 16:9 card window`);
      if (window.fit) {
        assert.equal(window.fit, 'cover', `${window.id}: actual cover style`);
        assert.equal(window.position, window.id === 'Back' ? '50% 30%' : '50% 50%', `${window.id}: actual crop position`);
        if (window.id === 'Back') assert.equal(window.opacity, '0.85', 'back opacity');
      }
    }
    for (const source of geometry.sources) {
      const ratio = source.naturalWidth / source.naturalHeight;
      assert(ratio < 16 / 9, `${source.id}: current source has a vertical cover crop`);
      assert(Math.abs(source.width / source.height - ratio) < .002, `${source.id}: full source keeps its real shape`);
      assert(Math.abs(source.bandWidth / source.bandHeight - 16 / 9) < .01, `${source.id}: guide is 16:9`);
      const window = geometry.windows.find(item => item.id === source.id);
      assert(Math.abs(window.imageWidth / window.imageHeight - ratio) < .002, `${source.id}: game image keeps natural ratio`);
      assert(Math.abs(window.imageTop) < .5, `${source.id}: current game retains the image top`);
      assert(Math.abs(source.bandTop + window.imageTop / window.imageHeight) < .002, `${source.id}: guide begins at actual visible image top`);
      assert(Math.abs(source.bandHeight / source.height - window.height / window.imageHeight) < .002, `${source.id}: guide matches the actual visible image fraction`);
      assert.equal(source.link, source.image, `${source.id}: original link matches file`);
    }
    await page.evaluate(() => scrollTo(0, 0));
    const label = viewport.width === 1280 ? 'desktop' : 'phone';
    await page.screenshot({ path: join(out, `${label}.png`) });
    await page.screenshot({ path: join(out, `${label}-full.png`), fullPage: true });
    report.captures.push(`${label}.png`, `${label}-full.png`);
    if (label === 'desktop') {
      for (const card of deck.filter(card => card.art)) {
        const name = `painting-${card.id}.png`;
        await page.locator(`[data-card-id="${card.id}"]`).screenshot({ path: join(out, name) });
        report.captures.push(name);
      }
      for (const extra of ['Rescue', 'Back']) {
        const name = `extra-${extra}.png`;
        await page.locator(`[data-extra="${extra}"]`).screenshot({ path: join(out, name) });
        report.captures.push(name);
      }
    }
    report.viewports.push({ ...viewport, ...geometry });
  }
  // The guide changes only the source overlay, with a keyboard action.
  await page.locator('#guides').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#guides').isChecked(), false);
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.crop-guide')).opacity === '0');
  assert.equal(await page.locator('.cf-art img').count(), 14, 'guide toggle keeps all current paintings');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#guides').isChecked(), true);
  assert.equal(await page.locator('.crop-guide').first().evaluate(node => getComputedStyle(node).transitionDuration), '0s', 'reduced motion');
  await page.locator('.jump-list summary').click();
  await page.locator('#jump-index a[href="#SkyLift"]').click();
  assert.equal(new URL(page.url()).hash, '#SkyLift', 'jump index navigates');
  assert(await page.locator('#SkyLift h2').evaluate(node => { const box = node.getBoundingClientRect(); return box.top >= 0 && box.bottom <= innerHeight; }), 'jump target is visible');
  assertNoErrors(errors);
  writeFileSync(join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log('card-crops: 21 released IDs, 12 paintings, 9 rule pictures, 2 extra files; desktop and phone geometry, assets, guides, keyboard, jump links and browser errors pass.');
} finally {
  await browser?.close();
  await server.close();
}
