import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser } from 'playwright';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
const record = { totals: { played: 23, won: 12, drawn: 3, lost: 8 }, rating: { rating: 1500.4, rd: 350, volatility: 0.06, provisional: true }, badges: [] };
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-profile-test-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open() {
  const page = await browser.newPage(); page.setDefaultTimeout(5000); await page.goto(harness.url);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  return page;
}
it('reads the profile name, picture, rounded rating and totals from the server', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.request.post(new URL('/fixture-seed', harness.url).href, { data: { actor: 'alice', data: { record } } });
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp; await app.client.call('kingdown_handle', { handle: 'profile_reader', icon: 'beast' }); app.navigate('profile');
    });
    await expect.poll(() => frame.locator('#page-title').textContent()).toBe('profile_reader');
    expect(await frame.locator('#profile-rating b').textContent()).toBe('1500');
    expect(await frame.locator('#profile-rating .q').isVisible()).toBe(true);
    expect(await frame.locator('#profile-totals b').allTextContents()).toEqual(['23', '12', '3', '8']);
    expect(await frame.locator('#profile-picture').getAttribute('src')).toContain('beast-w.webp');
  } finally { await page.close(); }
});
