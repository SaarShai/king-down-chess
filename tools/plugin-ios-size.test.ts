import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, type Browser } from 'playwright';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });
// Ticket 21 (the iPhone's 45 px board): the built page, because the build gives the seat its table look.
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-ios-size-'));
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe' });
  harness = await startHarness({ boardPath: join(folder, 'board.html') }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
it('sizes the seat and the board from their screens, with no viewport units', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 760 }, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(10_000);
  try {
    await page.goto(harness.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    // A host can keep vh and dvh at an old height (here 350 px); the seat and the board must not depend on them.
    await frame.locator('html').evaluate(() => {
      const stale = (rules: CSSRuleList) => { for (const rule of rules) {
        if (rule instanceof CSSStyleRule) for (const name of [...rule.style]) {
          const value = rule.style.getPropertyValue(name);
          if (/vh\b/.test(value)) rule.style.setProperty(name, value.replace(/(\d*\.?\d+)[dsl]?vh\b/g, (_, n) => `${Number(n) * 3.5}px`), rule.style.getPropertyPriority(name));
        }
        if ('cssRules' in rule) stale((rule as CSSGroupingRule).cssRules);
      } };
      for (const sheet of document.styleSheets) stale(sheet.cssRules);
    });
    // The table fills its screen, and the board is as large as its row allows (on a 393 × 760 page about 265 px).
    const fill = () => frame.locator('html').evaluate(() => {
      const table = [...document.querySelectorAll<HTMLElement>('#game-table, [data-seat-id="game-table"]')].find(e => e.offsetParent)!, rect = (e: Element) => e.getBoundingClientRect();
      const canvas = table.querySelector('canvas')!, board = rect(table.querySelector('#board')!), screen = rect(table.parentElement!);
      return Math.abs(rect(table).height - screen.height) < 1 && Math.abs(rect(canvas).width - Math.min(board.width, board.height * 960 / 1024)) < 2 && rect(canvas).width / rect(document.getElementById('app-frame')!).width;
    });
    await frame.locator('#home-play').click(); await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await expect.poll(fill).toBeGreaterThan(0.6);
    await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await expect.poll(fill).toBeGreaterThan(0.6);
  } finally { await page.close(); }
});
