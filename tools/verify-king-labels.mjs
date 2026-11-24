// The shown king names use the display map; saved IDs and art paths stay unchanged.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { env, answerCheckHost } from './lib/checks.mjs';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_PATH || 'playwright');
const out = process.env.KING_LABEL_SHOTS || env('PLAYABLE_OUT'); mkdirSync(out, { recursive: true });
const next = new URL('next.html', env('PLAYABLE_URL')).href;
const sizes = [[360, 640], [390, 844], [430, 932], [768, 1024], [844, 390], [1440, 900]];
const results = [];
async function cleanWords(page) {
  const words = await page.evaluate(() => [document.body.innerText, ...[...document.querySelectorAll('[aria-label], [alt], [title]')].filter(node => node.getClientRects().length).flatMap(node => ['aria-label', 'alt', 'title'].map(attr => node.getAttribute(attr) || ''))].join('\n'));
  assert.doesNotMatch(words, /\b(Stratus|Mud)\b/);
}
async function shot(page, browser, name) {
  await page.waitForTimeout(700); // Wait for the shell view transition before the capture.
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
  await page.screenshot({ path: join(out, `${browser}-${page.viewportSize().width}x${page.viewportSize().height}-${name}.png`) });
}
for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await type.launch({ headless: true });
  try {
    for (const [width, height] of sizes.filter(([w, h]) => name === 'chromium' || w <= 430 || h <= 430)) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      await answerCheckHost(context);
      await context.addInitScript(() => localStorage.setItem('kingdown.solo-launch-seen', '1'));
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(next); await page.locator('.home-hero-new').click();
      const panel = page.locator('dialog.new-game-panel[open]'); await panel.waitFor();
      await panel.getByRole('switch', { name: 'Powers', exact: true }).click();
      await panel.getByRole('button', { name: 'Powers', exact: true }).click();
      assert.deepEqual(await panel.locator('.king-choice').allTextContents(), ['Frost', 'Flame', 'Sky', 'Earth', 'Spirit', 'Shadow']);
      assert.equal(await panel.getByRole('button', { name: 'Sky', exact: true }).getAttribute('data-king'), 'Stratus');
      assert.equal(await panel.getByRole('button', { name: 'Earth', exact: true }).getAttribute('data-king'), 'Mud');
      await panel.getByRole('button', { name: 'Sky', exact: true }).click();
      await panel.locator('.king-grid').scrollIntoViewIfNeeded(); await cleanWords(page); await shot(page, name, 'powers');
      await panel.getByRole('button', { name: 'Close', exact: true }).click();
      await page.getByRole('button', { name: 'Start game', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('.play-game')?.dataset.state === 'ready' && !document.querySelector('.play-versus'));
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.save')));
      assert.deepEqual(saved.rules.kings[0], { king: 'Stratus', power: 'Flight' });
      assert.equal(await page.locator('.play-own .play-power-coin img').getAttribute('src'), '/ui/powers/flight.webp');
      assert.match(await page.locator('.play-own .play-power').innerText(), /Flight/);
      await cleanWords(page); await shot(page, name, 'sky-game');
      await page.goto(next + '#guide');
      await page.locator('[data-section="Kings and powers"]').click();
      assert.equal(await page.getByRole('heading', { name: 'Sky King', exact: true }).count(), 1);
      assert.equal(await page.getByRole('heading', { name: 'Earth King', exact: true }).count(), 1);
      await page.waitForTimeout(700);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode().catch(() => {}))); });
      await page.locator('.king-block[aria-label="Sky King"]').evaluate(block => block.scrollIntoView({ block: 'start', behavior: 'instant' }));
      const skyBox = await page.getByRole('heading', { name: 'Sky King', exact: true }).boundingBox();
      assert(skyBox && skyBox.y >= 0 && skyBox.y + skyBox.height < height - 56, 'The Sky label is in the guide capture.');
      await cleanWords(page); await shot(page, name, 'guide-kings');
      assert.deepEqual(errors, []);
      results.push({ browser: name, width, height, checks: ['powers labels and IDs', 'Sky game and coin', 'saved Stratus ID', 'guide labels', 'visible and accessible text', 'no page errors'] });
      await context.close();
    }
    // The old page still uses the same picker IDs, with the new shown text and titles.
    const context = await browser.newContext({ reducedMotion: 'reduce' }); await answerCheckHost(context);
    const page = await context.newPage(); await page.goto(new URL('index.html', env('PLAYABLE_URL')).href);
    await page.locator('#new-game').evaluate(dialog => dialog.showModal());
    assert.deepEqual(await page.locator('#pick-0 .em-name').allTextContents(), ['Frost', 'Flame', 'Sky', 'Earth', 'Spirit', 'Shadow']);
    assert.match(await page.locator('#pick-0 [data-king="Stratus"]').getAttribute('title'), /^Sky king:/);
    await cleanWords(page); await context.close();
  } finally { await browser.close(); }
}
writeFileSync(join(out, 'checks.json'), JSON.stringify(results, null, 2));
console.log(`PASS: ${results.length} screen and browser cases, plus both old-page pickers.`);
