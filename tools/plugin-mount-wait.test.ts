import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { startHarness } from './plugin-ui-harness';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-mount-wait-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });

it.each([false, true])('keeps a held mount read free of errors with symbols %s', async symbols_only => {
  const page = await browser.newPage(); page.setDefaultTimeout(5000);
  const frame = page.frameLocator('iframe');
  try {
    await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name: 'kingdown_settings', arguments: { symbols_only } } });
    await page.goto(harness.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_get'; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await frame.locator('html').evaluate(`import('/src/plugin/board-view.ts').then(module => module.setSettings(window.harnessApp.memory.settings))`);
    expect(await frame.locator('#error').textContent()).toBe('');
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()).catch(() => {}); await page.close(); }
});
