import { it, expect, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { startHarness, waitForSourceApp } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000 });
it('routes a profile game before the selection lane unlocks', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'kingdown-profile-selection-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  const harness = await startHarness({ boardPath, sourcePage: true }), browser = await chromium.launch({ headless: true });
  const page = await browser.newPage(); page.setDefaultTimeout(5000);
  try {
    await page.goto(harness.url); await waitForSourceApp(page);
    const frame = page.frameLocator('iframe');
    await frame.locator('#home-games:not(:disabled)').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } });
      app.navigate('profile');
    });
    await frame.locator('#profile-open button').first().waitFor();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_resume'; });
    await frame.locator('#profile-open button').first().click();
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await frame.locator('html').evaluate(() => {
      const root = window as any; root.selectionStates = [];
      root.harnessApp.store.subscribe((state: { screen: string; writing: boolean }) => root.selectionStates.push({ screen: state.screen, writing: state.writing }));
    });
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const states = await frame.locator('html').evaluate(() => (window as any).selectionStates);
    expect(states).toContainEqual({ screen: 'board', writing: true });
    expect(states).not.toContainEqual({ screen: 'profile', writing: false });
  } finally { await page.close(); await browser.close(); await harness.close(); await rm(folder, { recursive: true, force: true }); }
});
