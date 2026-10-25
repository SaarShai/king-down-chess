import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import type { Browser } from 'playwright';
import { launch, STEP } from './lib/checks.mjs';
import { startHarness } from './plugin-ui-harness';

vi.setConfig({ testTimeout: 120_000 * STEP, hookTimeout: 120_000 * STEP, expect: { poll: { timeout: 1000 * STEP } } });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-preview-size-'));
  // Normal shared build: at most 601 ms in the M1 style test.
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe', timeout: 30_000 });
  harness = await startHarness({ boardPath: join(folder, 'board.html') });
  browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });

it('shows both home button labels in full at 320 px', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url);
    await frame.locator('#home-games:not(:disabled)').waitFor();
    await page.evaluate(async () => { await (window as any).harnessSetContext({ safeAreaInsets: { top: 63, bottom: 84, left: 0, right: 0 }, deviceCapabilities: { touch: true } }); });
    await frame.locator('html').evaluate(() => document.fonts.ready.then(() => {}));
    expect(await frame.locator('.title-actions button span').allTextContents()).toEqual(['Play now', 'Choose a game']);
    const cut = await frame.locator('.title-actions button span').evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
    expect(cut).toEqual([]);
  } finally { await page.close(); }
});

it('keeps coins in the frame and the first name word visible at 320 px with Cards and King powers as Black', async () => {
  const page = await browser.newPage({ viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url);
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await frame.locator('#home-games:not(:disabled)').click();
    await page.evaluate(async () => { await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets: { top: 63, bottom: 84, left: 0, right: 0 }, deviceCapabilities: { touch: true } }); });
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.locator('#setup-options summary').click();
    await frame.locator('#setup-level').fill('2');
    await frame.getByRole('radio', { name: 'Black', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).uncheck();
    await frame.getByRole('checkbox', { name: 'Cards', exact: true }).check();
    await frame.getByRole('checkbox', { name: 'King powers', exact: true }).check();
    await frame.locator('#setup-start').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#status').filter({ hasText: 'Your move.' }).waitFor();
    await frame.locator('#board[data-animating="false"]').waitFor();
    await frame.locator('html').evaluate(() => document.fonts.ready.then(() => {}));
    // Wait for the deal itself before the size checks.
    await frame.locator('#game-table').evaluate(async table => {
      for (let run: Animation[]; (run = table.getAnimations({ subtree: true }).filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {})));
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    });
    expect(await frame.locator('#game-table').evaluate(e => e.getAnimations({ subtree: true }).every(a => a.playState === 'finished'))).toBe(true);
    const sizes = await frame.locator('#game-table').evaluate(e => {
      const box = document.getElementById('app-frame')!.getBoundingClientRect();
      const coins = [...e.querySelectorAll('.coin')].map(coin => {
        const r = coin.getBoundingClientRect();
        return { id: coin.id, width: r.width, height: r.height, inside: r.left >= box.left && r.right <= box.right && r.top >= box.top && r.bottom <= box.bottom };
      });
      const name = e.querySelector('#strip-them b')!, word = document.createRange();
      word.setStart(name.firstChild!, 0); word.setEnd(name.firstChild!, name.textContent!.split(/\s/)[0].length);
      return { coins, nameWidth: name.getBoundingClientRect().width, wordWidth: word.getBoundingClientRect().width };
    });
    expect(sizes.coins).toHaveLength(10);
    expect.soft(sizes.coins.filter(coin => !coin.inside).map(coin => coin.id)).toEqual([]);
    for (const coin of sizes.coins) { expect.soft(coin.width).toBeGreaterThanOrEqual(44); expect.soft(coin.height).toBeGreaterThanOrEqual(44); }
    expect.soft(sizes.nameWidth).toBeGreaterThanOrEqual(40);
    expect(sizes.nameWidth).toBeGreaterThanOrEqual(sizes.wordWidth);
  } finally { await page.close(); }
});
