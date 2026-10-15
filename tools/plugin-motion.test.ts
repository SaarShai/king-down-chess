import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium, type Browser, type FrameLocator, type Page } from 'playwright';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });
// Each motion moment exists, ends, and under reduced motion shows its final state at once.
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-motion-'));
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe' });
  harness = await startHarness({ boardPath: join(folder, 'board.html') }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open(reduced: boolean) {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, reducedMotion: reduced ? 'reduce' : 'no-preference' }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(15_000);
  await page.goto(harness.url);
  await frame.locator('#home-play:not(:disabled)').click();
  await page.evaluate(async () => { await (window as any).harnessSetContext({ displayMode: 'fullscreen' }); });
  return { page, frame };
}
const tapSquare = async (frame: FrameLocator, name: string) => {
  const box = (await frame.locator('#board canvas').boundingBox())!, s = box.width * 281 / 302 / 8;
  await frame.locator('#board canvas').click({ position: { x: box.width * 11 / 302 + (name.charCodeAt(0) - 97 + .5) * s, y: box.height * 30 / 322.1 + (8 - Number(name[1]) + .5) * s } });
};
async function mate(page: Page, frame: FrameLocator) {
  const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/6K1/8/8/8/8/Q7 w - - 0 1')}`, harness.url).href)).json();
  await page.evaluate(r => (window as any).harnessShow(r), result);
  await frame.locator('#board[aria-busy="false"]').waitFor(); await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  await tapSquare(frame, 'a1'); await page.waitForTimeout(300);
  await tapSquare(frame, 'a8');
}
it.each([false, true])('topples the king on a live win before the end card (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await mate(page, frame);
    if (!reduced) { await frame.locator('#board[data-toppling]').waitFor({ state: 'attached' }); expect(await frame.locator('#over').evaluate(e => (e as HTMLDialogElement).open)).toBe(false); }
    await frame.locator('#over.end-card[open]').waitFor();
    expect(await frame.locator('#board[data-toppling]').count()).toBe(0);
  } finally { await page.close(); }
});
it.each([false, true])('gives a spent card a short gold pulse (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('radio', { name: 'White', exact: true }).locator('..').click();
    for (const [name, on] of [['Fairy pieces', false], ['Arrangement', false], ['Classic chess', false], ['King powers', false], ['Cards', true]] as const) { const box = frame.getByRole('checkbox', { name, exact: true }); if (await box.count()) await box.setChecked(on); }
    await frame.locator('#setup-start').click(); await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    let index = -1;
    for (let i = 0; i < 4 && index < 0; i++) {
      await frame.locator(`#card-w-${i}`).click();
      const use = frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true });
      if (await use.count()) { await use.click(); index = i; } else await frame.locator('#board-sheet .sheet-head button').click();
    }
    expect(index).toBeGreaterThanOrEqual(0);
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move' }).click();
    await frame.locator('#board-sheet #choices button').first().click();
    const coin = frame.locator(`#card-w-${index}`);
    if (!reduced) await coin.and(frame.locator('.is-spending')).waitFor();
    await coin.and(frame.locator('[data-state="used"]:not(.is-spending)')).waitFor({ timeout: reduced ? 1000 : 2000 });
  } finally { await page.close(); }
});
