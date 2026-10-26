import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { env } from '../../../tools/lib/checks.mjs';
import { pressMenu } from '../../../tools/app-ui.mjs';

const browser = await chromium.launch({ headless: true });
const results = [], errors = [], external = [];
const ready = async page => {
  await page.waitForFunction(() => !!window.view?.ready);
  await page.evaluate(async () => { await window.view.ready(); await document.fonts.ready; });
};
const settled = page => page.evaluate(async () => {
  await Promise.all(document.getAnimations().filter(a => Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished.catch(() => {})));
  await Promise.all([...document.images].filter(i => i.checkVisibility() && i.getAttribute('src')).map(i => i.decode()));
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
});
const rect = (page, selector) => page.locator(selector).boundingBox();
const fit = async (page, selector, height) => { const r = await rect(page, selector); assert.ok(r && r.y >= 0 && r.y + r.height <= height + 1, selector); return r; };
const tap = async (page, square) => { const p = await page.evaluate(s => window.view.screenOf(s), square); await page.mouse.click(p.x, p.y); await settled(page); };
const enlarge = page => page.evaluate(() => {
  const values = [...document.querySelectorAll('#game-table, #game-table *')].map(e => [e, getComputedStyle(e).fontSize]);
  for (const [e, size] of values) e.style.fontSize = `${2 * parseFloat(size)}px`;
});
const fixture = 'fen=rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR%20w%20-%20-%200%201&players=human,human&title=0';
try {
  for (const [width, height] of [[320,568],[375,812],[852,393],[768,1024],[1280,800]]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', colorScheme: 'light', serviceWorkers: 'block' });
    await context.route('**/*', route => {
      const u = new URL(route.request().url());
      if (['data:', 'blob:'].includes(u.protocol) || ['localhost','127.0.0.1'].includes(u.hostname)) return route.continue();
      external.push(u.origin); return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.goto(env('PLAYABLE_URL')); await ready(page); await settled(page);
    if ([375,768,852].includes(width)) {
      const names = await page.locator('.title-lineup li').evaluateAll(items => items.map(item => {
        const text = item.querySelector('span'), box = text.getBoundingClientRect(), cell = item.getBoundingClientRect();
        return { size: parseFloat(getComputedStyle(text).fontSize), width: box.width, cell: cell.width };
      }));
      assert.ok(names.every(n => n.size >= 11 && n.width <= n.cell + 1), 'Title names fit at 11 px');
    }
    await page.locator('#title-start').click(); await page.locator('#first-lesson').waitFor({ state: 'visible' }); await ready(page);
    assert.equal(await page.locator('#context-text').innerText(), 'Your move.\nTap a piece to read.');
    assert.ok(await page.locator('#first-lesson').isVisible());
    await page.locator('#first-lesson').click(); await page.locator('#return-game').click();
    await pressMenu(page, 'New game');
    assert.equal(await page.locator('#mode-two, #two-powers').count(), 0);
    assert.equal(await page.locator('#design-row').isVisible(), false);
    await page.locator('label:has(#mode-powers)').click();
    assert.match(await page.locator('#new-game-summary').innerText(), /Random army\nWhite: Holy Light.\nBlack: Death Touch./);
    await fit(page, '#new-game-summary', height); await fit(page, '#start-game', height);
    assert.equal(await page.locator('#new-game-friend').getAttribute('href'), '/play/friend');
    await page.locator('#start-game').click(); await ready(page);
    assert.equal(await page.locator('#first-lesson').isVisible(), false);
    assert.ok(!(await page.locator('#context-text').innerText()).includes('Tap a piece to read.'));
    await pressMenu(page, 'Guide'); await settled(page);
    if (width < 400) {
      const action = await fit(page, '.shelf-next', height), note = await fit(page, '.shelf-safe', height), shelf = await rect(page, '.shelf-list');
      assert.ok(action.y < shelf.y && note.y < shelf.y);
    }
    if ([852,1280].includes(width)) {
      const lengths = await page.locator('#rules-notation').evaluate(e => {
        const lines = {}, text = e.firstChild;
        for (let i = 0; i < text.length; i++) { const r = new Range(); r.setStart(text,i); r.setEnd(text,i+1); const y = r.getBoundingClientRect().y; lines[y] = (lines[y] ?? 0) + 1; }
        return Object.values(lines);
      });
      assert.ok(Math.max(...lengths) <= 80, `Notation line: ${Math.max(...lengths)}`);
      results.push({ size: `${width}x${height}`, notation: Math.max(...lengths) });
    }
    await page.keyboard.press('Escape');
    if (width === 320) {
      await pressMenu(page, 'Settings'); await settled(page);
      const title = await rect(page, '#menu-title'), close = await rect(page, '#menu-close');
      assert.ok(title.x + title.width <= close.x - 7, 'Board help keeps a gap');
      assert.equal(await page.locator('#menu-back').getAttribute('aria-label'), 'Back to Menu');
      await page.locator('#menu-close').click();
    }
    if (width < 400 || width === 852) {
      await page.goto(`${env('PLAYABLE_URL')}?${fixture}`); await ready(page); await tap(page, 52);
      const spacing = await page.locator('#context-text > span + span').evaluate(e => parseFloat(getComputedStyle(e).lineHeight));
      assert.ok(spacing >= 19.5); await fit(page, '#context-line', height);
    }
    if (width < 400) {
      await page.goto(`${env('PLAYABLE_URL')}?${fixture}`); await ready(page);
      await tap(page,12); await tap(page,28); await enlarge(page); await settled(page);
      const moves = await rect(page, '#moves-line'), words = await rect(page, '#last-move'), bar = await fit(page, '#table-bar', height);
      assert.ok(moves.height > 48 && words.y + words.height <= moves.y + moves.height && moves.y + moves.height <= bar.y + 1);
      await page.reload(); await ready(page); await pressMenu(page, 'Guide'); await page.locator('.shelf-piece[data-piece="archer"]').click();
      assert.equal(await page.locator('#context-text > span').first().evaluate(e => getComputedStyle(e).fontSize), '16px');
      await enlarge(page); await settled(page);
      const lesson = await rect(page, '#context-line'), row = await rect(page, '#moves-line');
      assert.ok(lesson.y + lesson.height <= row.y + 1, 'Lesson text stays above Moves');
      await fit(page, '#table-bar', height);
      results.push({ size: `${width}x${height}`, enlargedMovesHeight: moves.height, lessonHeight: lesson.height });
    }
    if (width === 375) {
      await page.goto(`${env('PLAYABLE_URL')}?${fixture}`); await ready(page);
      await pressMenu(page, 'Workshop'); await page.locator('#pg-tab-cards').click();
      assert.match(await page.locator('.pg-brushes .info-p').innerText(), /has no target/);
      await fit(page, '.pg-name .lab-note', height);
      await page.locator('[data-act="cardexample"]').click();
      assert.equal(await page.locator('.pg-brushes .info-p').innerText(), 'Tap a blue ring on the board.');
      assert.equal(await page.locator('[data-act="cardexample"]').count(), 0);
    }
    await context.close();
  }
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  await mkdir(env('PLAYABLE_OUT'), { recursive: true });
  await writeFile(`${env('PLAYABLE_OUT')}/measurements.json`, JSON.stringify(results, null, 2));
  console.log('All sample layout and local path checks pass.', JSON.stringify(results));
} finally { await browser.close(); }
