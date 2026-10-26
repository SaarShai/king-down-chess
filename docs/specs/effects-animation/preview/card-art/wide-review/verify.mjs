import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { launch, trapErrors, assertNoErrors, noSidewaysScroll, env } from '../../../../../../tools/lib/checks.mjs';

const folder = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8'));
assert.equal(manifest.cards.length, 23, 'final manifest has all 23 cards');
for (const card of manifest.cards) {
  assert.equal(typeof card.proposal, 'string', `${card.id}: final proposal path is present`);
  assert(card.proposal && existsSync(resolve(folder, card.proposal)), `${card.id}: final proposal asset exists`);
}
const out = env('PLAYABLE_OUT');
mkdirSync(out, { recursive: true });
const server = await createServer({ root: resolve('.'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: false } });
let browser;
const report = { viewports: [], captures: [] };
try {
  await server.listen();
  browser = await launch();
  const page = await browser.newPage();
  const errors = trapErrors(page);
  page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  const url = new URL('/docs/specs/effects-animation/preview/card-art/wide-review/index.html', server.resolvedUrls.local[0]);
  await page.goto(url.href);
  await page.waitForSelector('html[data-wide-review="ready"]');
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('#manifest-error').isHidden(), true, 'proposal list loads');
  const deck = await page.evaluate(async () => (await import('/src/content/cards.ts')).RELEASED_CARDS);
  const ids = [...deck.map(card => card.id), 'Rescue', 'Back'];
  assert.equal(deck.length, 21, 'released catalog has 21 cards');
  assert.deepEqual(manifest.cards.map(card => card.id), ids, 'manifest has released order and two extras');
  assert.deepEqual(await page.locator('#card-nav button').evaluateAll(buttons => buttons.map(button => button.dataset.cardId)), ids, 'all 23 named card buttons');
  assert.equal(deck.filter(card => !card.art).length, 9, 'nine current rule illustrations');
  await page.locator('#choose-card summary').click();
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    const rows = [];
    for (const card of manifest.cards) {
      await page.locator(`#card-nav button[data-card-id="${card.id}"]`).click();
      const keep = card.status === 'keep';
      await page.waitForFunction(state => document.querySelector('#proposal-art').dataset.state === state, keep ? 'kept' : 'ready');
      await page.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); });
      await noSidewaysScroll(page);
      assert.equal(await page.locator('#review').getAttribute('data-card-id'), card.id);
      assert.equal(await page.locator('#current-face .cf-text').innerHTML(), await page.locator('#proposal-text').innerHTML(), `${card.id}: same title and rule`);
      assert(await page.locator('#current-face .cf-art').evaluate(async (node, id) => {
        const { cardArt } = await import('/src/plugin/card-face.ts');
        const { art } = await import('/src/account-game/art.ts');
        const expected = document.createElement('template');
        expected.innerHTML = id === 'Back' ? `<img class="back" src="${art('ui/cards/back.webp')}" alt="">` : cardArt(id);
        return node.innerHTML === expected.innerHTML;
      }, card.id), `${card.id}: exact current renderer output`);
      const current = deck.find(row => row.id === card.id);
      if (current && !current.art) assert.equal(await page.locator('#current-face svg.card-picture').count(), 1, `${card.id}: actual rule illustration`);
      const geometry = await page.evaluate(() => {
        const window = document.querySelector('#proposal-art'), image = window.querySelector('img');
        const box = window.getBoundingClientRect(), imageBox = image?.getBoundingClientRect();
        const columns = [...document.querySelectorAll('.comparison > figure')].map(node => { const rect = node.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width }; });
        return { width: box.width, height: box.height, imageWidth: imageBox?.width, imageHeight: imageBox?.height, naturalWidth: image?.naturalWidth, naturalHeight: image?.naturalHeight, fit: image && getComputedStyle(image).objectFit, columns, loaded: [...document.images].every(image => image.complete && image.naturalWidth > 0) };
      });
      assert(geometry.loaded, `${card.id}: visible image assets load`);
      assert(Math.abs(geometry.width / geometry.height - 16 / 9) < .01, `${card.id}: proposal window is 16:9`);
      if (viewport.width === 1280) assert(Math.abs(geometry.columns[0].y - geometry.columns[1].y) < 1, 'desktop columns sit beside each other');
      else assert(geometry.columns[1].y < geometry.columns[0].y, 'phone shows the new proposal first');
      if (keep) {
        assert.equal(await page.locator('#proposal-art').innerHTML(), await page.locator('#current-face .cf-art').innerHTML(), `${card.id}: keep exact game art frame`);
        assert.equal(geometry.fit, 'cover', `${card.id}: keep current image style`);
      } else {
        assert.equal(geometry.fit, 'contain', `${card.id}: full source is contained`);
        assert(Math.abs(geometry.imageWidth - geometry.width) < 1 && Math.abs(geometry.imageHeight - geometry.height) < 1, `${card.id}: image uses a definite 16:9 box`);
        assert(Math.abs(geometry.naturalWidth / geometry.naturalHeight - 16 / 9) < .015, `${card.id}: source is near 16:9`);
        assert.equal(await page.locator('#proposal-source').getAttribute('href'), await page.locator('#proposal-art img').getAttribute('src'), `${card.id}: full-size link uses the displayed source`);
      }
      rows.push({ id: card.id, state: keep ? 'kept' : 'ready', ...geometry });
      if (viewport.width === 1280) {
        const name = `card-${card.id}.png`;
        await page.locator('#review').screenshot({ path: join(out, name) });
        report.captures.push(name);
      }
    }
    await page.locator('#card-nav button[data-card-id="Salvation"]').click();
    await page.waitForFunction(() => document.querySelector('#proposal-art').dataset.state !== 'pending');
    await page.locator('#choose-card summary').click();
    await page.evaluate(() => scrollTo(0, 0));
    const label = viewport.width === 1280 ? 'desktop' : 'phone';
    await page.screenshot({ path: join(out, `${label}-full.png`), fullPage: true });
    report.captures.push(`${label}-full.png`);
    report.viewports.push({ ...viewport, rows });
    await page.locator('#choose-card summary').click();
  }
  await page.locator('#card-nav button[data-card-id="Freeze"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#review').getAttribute('data-card-id'), 'Freeze', 'named card button works with Enter');
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#review').getAttribute('data-card-id'), 'IceWall', 'right arrow moves to next card');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.cardId), 'IceWall', 'arrow keeps focus with selection');
  await page.locator('#previous').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#review').getAttribute('data-card-id'), 'Freeze', 'Previous works with Enter');
  await page.locator('#next').focus();
  await page.keyboard.press('Space');
  assert.equal(await page.locator('#review').getAttribute('data-card-id'), 'IceWall', 'Next works with Space');
  await page.evaluate(() => { location.hash = '#Curse'; });
  await page.waitForFunction(() => document.querySelector('#review').dataset.cardId === 'Curse');
  assert.equal(await page.locator('#card-nav button[data-card-id="Curse"]').getAttribute('aria-pressed'), 'true', 'direct hash selects its named card');
  assert.equal(await page.locator('#position').innerText(), `${ids.indexOf('Curse') + 1} / ${ids.length}`, 'direct hash updates the card position');
  assert.equal(new URL(page.url()).hash, '#Curse', 'selection keeps the requested hash');
  await page.goto(new URL('./all.html', url).href);
  await page.waitForSelector('html[data-all-art="ready"]');
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
  assert.equal(await page.locator('#all-cards article').count(), 21, 'overview includes all released cards');
  assert.equal(await page.locator('#additional-art article').count(), 2, 'overview identifies the two extras');
  assert.deepEqual(await page.locator('.art-card').evaluateAll(rows => rows.map(row => row.dataset.cardId)), ids, 'overview order and identity');
  assert.equal(await page.locator('#Vault h2').innerText(), 'Hop', 'renamed Hop label uses the shared catalog');
  for (const viewport of [{width:1280,height:900},{width:390,height:844}]) {
    await page.setViewportSize(viewport);
    await noSidewaysScroll(page);
    const overview = await page.locator('.art-card').evaluateAll(rows => rows.map(row => {
      const frame=row.querySelector('a'), image=frame.querySelector('img'), box=frame.getBoundingClientRect();
      return {id:row.dataset.cardId,name:row.querySelector('h2').textContent,ratio:box.width/box.height,loaded:image.complete&&image.naturalWidth>0,fit:getComputedStyle(image).objectFit,url:frame.href};
    }));
    for (const row of overview) {
      const card=manifest.cards.find(card=>card.id===row.id);
      assert.equal(row.name,card.name,`${row.id}: overview title`);
      assert(row.loaded,`${row.id}: overview image loads`);
      assert(Math.abs(row.ratio-16/9)<.01,`${row.id}: overview card frame`);
      assert.equal(row.fit,card.status==='keep'?'cover':'contain',`${row.id}: correct image fitting`);
      assert(row.url.endsWith(card.proposal.slice(1)),`${row.id}: full-size image link`);
    }
    const label=viewport.width===1280?'all-desktop.png':'all-phone.png';
    await page.screenshot({path:join(out,label),fullPage:true}); report.captures.push(label);
  }
  await page.goto(new URL('./corrections.html', url).href);
  await page.evaluate(async () => { await Promise.all([...document.images].map(image=>image.decode())); });
  assert.equal(await page.locator('article img').count(),5,'three revised paintings and two Rally concepts');
  await noSidewaysScroll(page);
  await page.screenshot({path:join(out,'corrections-phone.png'),fullPage:true}); report.captures.push('corrections-phone.png');
  assertNoErrors(errors);
  writeFileSync(join(out, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log('card-art-wide: all 23 final assets, current renderer, keep frames, full wide proposals, desktop and phone layout, keyboard, hash links and browser errors pass; 23 card captures and 2 full pages saved.');
} finally {
  await browser?.close();
  await server.close();
}
