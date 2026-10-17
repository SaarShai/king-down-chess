import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-wait-recovery-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
it('recovers a joined game after an old waiting entry ends', async () => {
  const page = await browser.newPage(), frame = page.frameLocator('iframe'); page.setDefaultTimeout(5000);
  try {
    const old = await (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name: 'kingdown_create', arguments: {
      kind: 'random', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false }, colour: 'white',
    } } })).json(); expect(old.isError).not.toBe(true);
    await page.goto(harness.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
    // The first Open saves this row; the next mount must read past its later Abort.
    const cancelled = await (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name: 'kingdown_cancel', arguments: { game_id: old._meta.view.game_id } } })).json();
    expect(cancelled.isError).not.toBe(true);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.call('kingdown_games', {}));
    const now = new Date(); await page.clock.install({ time: new Date(now.getTime() - 60000) }); await page.clock.pauseAt(now);
    const waiting = await frame.locator('html').evaluate(async () => (window as any).harnessApp.start('random', {
      options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false }, colour: 'white',
    }));
    await page.clock.runFor(26000); await frame.locator('#wait-computer').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const solo = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await page.locator('iframe').evaluate(el => { (el as HTMLIFrameElement).src = 'about:blank'; });
    await page.mainFrame().childFrames()[0].waitForURL('about:blank');
    await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name: 'kingdown_accept', arguments: { game_id: waiting.game_id } } });
    await page.locator('#remount').click(); await frame.locator('#over.found[open]').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(solo);
  } finally { await page.close(); }
});
