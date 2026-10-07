import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
const base = process.env.PLAYABLE_URL || 'http://127.0.0.1:5189/';
const out = mkdtempSync('/tmp/workshop-cast-');
const cast = JSON.parse(readFileSync('docs/visual-design/workshop/cast.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
try {
  for (const width of [390, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => sessionStorage.setItem('kingdown.title-seen', '1'));
    await page.goto(base); await page.waitForFunction(() => window.view?.ready);
    await page.evaluate(() => window.view.ready());
    await page.click('#workshop-btn'); await page.click('[data-door="piece"]'); assert.equal(await page.locator('[data-new-figure]').count(), 34);
    assert.equal(await page.locator('[data-key], .ws-mix, .ws-surprise').count(), 0);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${out}/${width}-new-piece.png` });
    await page.click('[data-new-figure="owl-archivist"]');
    const blank = await page.evaluate(() => JSON.parse(localStorage.getItem('kingdown.workshop')).designs[0]);
    assert.deepEqual([blank.squares, blank.lines, blank.rules], [[], [], []]);
    assert.equal(blank.look.figure, 'owl-archivist');
    assert.equal(blank.name, 'Owl Archivist');
    await page.reload(); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    await page.click('#workshop-btn'); await page.click('.ws-tile');
    assert.equal(await page.getAttribute('.ws-piece-card .ws-fig', 'src'), './ui/workshop/owl-archivist-w.webp');
    await page.click('.ws-board[data-action="move"] .ws-cell[data-x="1"][data-y="2"]');
    await page.click('.ws-eye');
    await page.click('.ws-gallery summary');
    assert.equal(await page.locator('.ws-gallery [data-figure]').count(), cast.length);
    for (const f of cast) {
      await page.click(`.ws-gallery [data-figure="${f.id}"]`);
      assert.equal(await page.getAttribute('.ws-piece-card .ws-fig', 'src'), `./ui/workshop/${f.id}-w.webp`);
      assert.equal(await page.locator('.ws-gallery').evaluate(e => e.open), true);
    }
    await page.selectOption('.ws-figure-filter select', 'Strong');
    assert.ok(await page.locator('.ws-gallery [data-figure]:visible').count() < cast.length);
    await page.click('.ws-gallery [data-figure="clay-golem"]');
    await page.locator('.ws-army label').filter({ has: page.locator('input[value="1"]') }).click();
    assert.equal(await page.getAttribute('.ws-piece-card .ws-fig', 'src'), './ui/workshop/clay-golem-b.webp');
    await page.click('.ws-undo');
    assert.equal(await page.getAttribute('.ws-piece-card .ws-fig', 'src'), './ui/workshop/clay-golem-w.webp');
    await page.locator('.ws-army label').filter({ has: page.locator('input[value="1"]') }).click();
    await page.selectOption('.ws-figure-filter select', 'All');
    // Both army files must load, including figures outside the visible scroll area.
    const loaded = await page.evaluate(async ids => Promise.all(ids.flatMap(id => ['w', 'b'].map(army => new Promise(resolve => {
      const im = new Image(); im.onload = () => resolve(im.naturalWidth > 0); im.onerror = () => resolve(false); im.src = `/ui/workshop/${id}-${army}.webp`;
    })))), cast.map(f => f.id));
    assert.ok(loaded.every(Boolean));
    await page.locator('.ws-gallery summary').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/${width}-gallery.png` });
    await page.click('.ws-eye');
    await page.click('.ws-share'); await page.click('.ws-copy-link');
    const link = await page.evaluate(() => navigator.clipboard.readText());
    await page.click('.ws-try'); await page.waitForSelector('.tb-me');
    assert.equal(await page.getAttribute('.tb-me', 'src'), './ui/workshop/clay-golem-w.webp');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${out}/${width}-try.png` });
    await page.goto(link); await page.waitForSelector('.ws-piece-card');
    assert.equal(await page.getAttribute('.ws-piece-card .ws-fig', 'src'), './ui/workshop/clay-golem-b.webp');
    await page.screenshot({ path: `${out}/${width}-card.png` });
    await page.goto(base); await page.waitForFunction(() => window.view?.ready); await page.evaluate(() => window.view.ready());
    await page.click('#workshop-btn'); await page.click('.ws-tile');
    assert.equal(await page.getAttribute('.ws-piece-card .ws-fig', 'src'), './ui/workshop/clay-golem-b.webp');
    assert.deepEqual(errors, []);
    console.log(`ok ${width}: all 34 choices, both armies, filters, undo, save/reload, share and Try it`);
    await ctx.close();
  }
} finally { await browser.close(); }
console.log(`Screens: ${out}`);
