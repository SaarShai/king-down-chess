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
  await frame.locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
  await page.evaluate(async () => { const host = window as any; await host.harnessShow(await host.harnessTool({ name: 'kingdown_open', arguments: { screen: 'play' } }), true); });
  return { page, frame };
}
const tapSquare = async (frame: FrameLocator, name: string) => {
  const box = (await frame.locator('#board canvas').boundingBox())!, s = box.width * 281 / 302 / 8;
  await frame.locator('#board canvas').click({ position: { x: box.width * 11 / 302 + (name.charCodeAt(0) - 97 + .5) * s, y: box.height * 30 / 322.1 + (8 - Number(name[1]) + .5) * s } });
};
async function newGame(frame: FrameLocator, toggles: [string, boolean][], start = true) {
  await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
  await frame.getByRole('radio', { name: 'White', exact: true }).locator('..').click();
  for (const [name, on] of toggles) { const box = frame.getByRole('checkbox', { name, exact: true }); if (await box.count()) await box.setChecked(on); }
  if (start) await frame.locator('#setup-start').click();
}
const only = (on: string[]) => ['Fairy pieces', 'Arrangement', 'Classic chess', 'King powers', 'Cards'].map(name => [name, on.includes(name)] as [string, boolean]);
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
    if (!reduced) {
      await frame.locator('#board[data-toppling]').waitFor({ state: 'attached' }); expect(await frame.locator('#over').evaluate(e => (e as HTMLDialogElement).open)).toBe(false);
      await frame.locator('#board .kd-words:not([hidden])').waitFor();
    }
    const start = Date.now(); await frame.locator('#over.end-card[open]').waitFor();
    expect(Date.now() - start).toBeLessThan(1500);
    expect(await frame.locator('#board[data-toppling], #board .kd-words').count()).toBe(0);
  } finally { await page.close(); }
});
it('skips the end ceremony on a tap', async () => {
  const { page, frame } = await open(false);
  try {
    await mate(page, frame); await frame.locator('#board[data-toppling]').waitFor({ state: 'attached' });
    await frame.locator('#status').click(); await frame.locator('#over.end-card[open]').waitFor({ timeout: 300 });
    expect(await frame.locator('#board .kd-words').count()).toBe(0);
  } finally { await page.close(); }
});
it.each([false, true])('gives a spent card a short gold pulse (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await newGame(frame, only(['Cards'])); await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
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

const animations = (frame: FrameLocator, selector: string) => frame.locator(selector).first().evaluate(e => e.getAnimations({ subtree: true }).filter(a => a.playState === 'running').length);
it.each([false, true])('deals the four cards once at a live start (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await newGame(frame, only(['Cards']));
    if (!reduced) await frame.locator('#card-w-3.is-dealt').waitFor({ state: 'attached' });
    await frame.locator('#card-w-3').waitFor();
    expect(await frame.locator('#game-table .card-coin.is-dealt').count()).toBe(reduced ? 0 : 8);
    await expect.poll(() => animations(frame, '#game-table'), { timeout: 1500 }).toBe(0);
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    expect(await frame.locator('#game-table .card-coin.is-dealt').count()).toBe(0);
    expect(await animations(frame, '#game-table')).toBe(0);
  } finally { await page.close(); }
});
it('deals a new card game after the empty hall remounts', async () => {
  const { page, frame } = await open(false);
  try {
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, reads);
    await frame.locator('#setup-start:not(:disabled)').waitFor();
    await newGame(frame, only(['Cards']));
    await frame.locator('#card-w-3.is-dealt').waitFor({ state: 'attached' });
    expect(await frame.locator('#game-table .card-coin.is-dealt').count()).toBe(8);
  } finally { await page.close(); }
});
it.each([false, true])('pulses the checked side once (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/8/8/8/8/8/R5K1 w - - 0 1')}&black=1`, harness.url).href)).json();
    await page.evaluate(r => (window as any).harnessShow(r), result); await frame.locator('#board[aria-busy="false"]').waitFor();
    const bob = async (name: string, args: object) => (await (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name, arguments: args } })).json());
    const id = result.structuredContent.game_id, view = (await bob('kingdown_get', { game_id: id }))._meta.view;
    await bob('kingdown_move', { game_id: id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: view.revision, lan: 'Ra1-a8' });
    await frame.locator('#board-menu').click(); await frame.locator('#reload').click();
    await frame.locator('#status').filter({ hasText: 'Check!' }).waitFor();
    if (!reduced) await frame.locator('#strip-me .portrait.is-checked').waitFor({ state: 'attached', timeout: 500 });
    await expect.poll(() => animations(frame, '#strip-me .portrait'), { timeout: 1500 }).toBe(0);
  } finally { await page.close(); }
});
it.each([false, true])('opens the board after both Ready (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await newGame(frame, only(['Fairy pieces', 'Arrangement'])); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#board[aria-busy="false"]').waitFor(); await frame.locator('#seat-ready:not(:disabled)').waitFor();
    await frame.locator('#board').evaluate(e => { const animate = e.animate.bind(e); (window as any).boardOpening = []; e.animate = (...args) => { (window as any).boardOpening.push(args[1]); return animate(...args); }; });
    await frame.locator('#seat-ready').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('#board').evaluate(() => (window as any).boardOpening)).toEqual(reduced ? [] : [{ duration: 320, easing: 'cubic-bezier(.05,.7,.1,1)' }]);
    await expect.poll(() => animations(frame, '#board'), { timeout: 1000 }).toBe(0);
  } finally { await page.close(); }
});
it.each([false, true])('turns the chosen king over once (reduced motion %s)', async reduced => {
  const { page, frame } = await open(reduced);
  try {
    await newGame(frame, only(['King powers']), false); await frame.locator('#setup-king').click();
    const other = frame.locator('#king-picker button.emblem[aria-pressed="false"]:not(:disabled)').first(), king = await other.getAttribute('data-king');
    await other.click();
    await frame.locator(`#king-picker button.emblem.is-flip[data-king="${king}"]`).waitFor();
    if (!reduced) expect(await animations(frame, '#king-picker button.emblem.is-flip')).toBe(1);
    await expect.poll(() => animations(frame, '#king-picker button.emblem.is-flip'), { timeout: 1000 }).toBe(0);
  } finally { await page.close(); }
});
it('keeps Sound off until the player turns it on', async () => {
  const { page, frame } = await open(false);
  try {
    await frame.locator('#play-settings, [data-nav="settings"]').first().click();
    expect(await frame.locator('#settings-sheet .quiet-line').textContent()).toContain('Sound stays on this device.');
    const sound = frame.getByRole('checkbox', { name: 'Sound', exact: true });
    expect(await sound.isChecked()).toBe(false);
    await sound.check(); expect(await sound.isChecked()).toBe(true);
    expect(await frame.locator('html').evaluate(() => localStorage.getItem('kingdown-sound'))).toBe('on');
  } finally { await page.close(); }
});
