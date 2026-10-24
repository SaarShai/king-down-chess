// Local evidence capture. Root can register this script as a by-name browser check.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../../../../../', import.meta.url));
const output = process.env.PLAYABLE_OUT ?? '/tmp/effects-card-game-evidence';
mkdirSync(output, { recursive: true });
const server = await createServer({ root, server: { port: 0, strictPort: false, host: '127.0.0.1' } });
let browser;
try {
  await server.listen();
  const url = new URL('/docs/specs/effects-animation/issues/15-card-integration/evidence/game.html', server.resolvedUrls.local[0]).href;
  browser = await chromium.launch({ channel: process.env.PLAYABLE_BROWSER ?? 'chrome' });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const ids = ['burn', 'freeze', 'firewall', 'earthquake', 'morphp', 'salvation', 'mirrorb', 'haste', 'rally'];
  const results = [];
  for (const width of [430, 390]) for (const flip of [false, true]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(url);
    await page.waitForFunction(() => window.cardGame?.ready);
    await page.evaluate(flip => window.cardGame.flip(flip), flip);
    for (const id of ids) {
      await page.evaluate(id => window.cardGame.select(`card-${id}`), id);
      const steps = ['haste', 'rally', 'firewall', 'mirrorb'].includes(id) ? 2 : 1;
      for (let index = 0; index < steps; index++) {
        await page.evaluate(() => { window.cardGame.running = window.cardGame.step(); });
        const card = await page.evaluate(() => window.cardGame.state().card);
        const duration = await page.evaluate(() => window.cardGame.duration);
        await page.waitForTimeout(duration * (['burn', 'earthquake', 'freeze'].includes(id) ? .73 : .49));
        const during = await page.evaluate(() => window.cardGame.state());
        if (card) assert.ok(during.animating, `${id} ${index}: real scene is active`);
        if (during.card) await page.screenshot({ path: resolve(output, `${width}-${flip ? 'black' : 'white'}-${id}-${index}-action.png`) });
        await page.evaluate(() => window.cardGame.running);
      }
      const result = await page.evaluate(() => window.cardGame.state());
      assert.equal(result.index, steps, `${id}: complete legal turn`);
      assert.equal(result.animating, false);
      assert.deepEqual(result.renderBoard, result.board, `${id}: scene holds the legal final board`);
      assert.equal(result.contacts, id === 'haste' ? 2 : id === 'burn' ? 1 : 0, `${id}: capture contacts`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      results.push({ width, flip, ...result });
      if (width === 430 && !flip && id === 'burn') {
        await page.screenshot({ path: resolve(output, 'early-burn-result.png') });
        writeFileSync(resolve(output, 'GAME_READY.md'), `# Game ready\n\nProduction PaintedView runs Burn through its real scene clock. The legal rook capture ends on d5. One contact fires.\n\nViewport: 430 px. Board: White at bottom.\n\nFEN: ${result.fen}\n\nAction: 430-white-burn-0-action.png\nResult: early-burn-result.png\n\nThis is a local integration sample. It is not owner approval. Root still merges the shared state layer and plugin drop gates.\n`);
      }
    }
    await page.evaluate(() => window.cardGame.dispose());
  }
  assert.deepEqual(errors, []);
  writeFileSync(resolve(output, 'results.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(`Captured ${results.length} real card turns at 430/390 px, both orientations. ${output}`);
} finally {
  await browser?.close();
  await server.close();
}
