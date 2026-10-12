import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
const options = { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false };
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-lobby-test-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open() {
  const page = await browser.newPage(); page.setDefaultTimeout(5000); await page.goto(harness.url);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor(); return page;
}
async function start(page: Page, kind: string) {
  return page.frameLocator('iframe').locator('html').evaluate(async (_, input) => {
    const app = (window as any).harnessApp; app.navigate('setup');
    return app.start(input.kind, { options: input.options, colour: 'white' });
  }, { kind, options });
}
it('makes a friend code after create and offers a new code after remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await start(page, 'friend'); await frame.locator('.game-code span').first().waitFor();
    expect(await frame.locator('.game-code span').count()).toBe(6);
    expect(await frame.locator('#friend-expiry').textContent()).toContain('Ends ');
    expect(await frame.locator('#friend-copy').textContent()).toContain('Copy the code');
    const invites = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_invite').length);
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#friend-new').waitFor();
    expect(await frame.locator('.game-code span').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_invite').length)).toBe(invites);
    expect(JSON.stringify(await page.evaluate(() => (window as any).harnessWidgetState))).not.toContain('expires_at');
  } finally { await page.close(); }
});
it('reports a true copy and selects the code when both copy paths refuse', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await start(page, 'friend'); await frame.locator('#friend-copy').waitFor();
    await frame.locator('html').evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => {} } });
    });
    await frame.locator('#friend-copy').click(); expect(await frame.locator('#friend-copy-status').textContent()).toBe('Copied');
    await frame.locator('html').evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } });
      document.execCommand = () => false;
    });
    await frame.locator('#friend-copy').click();
    expect(await frame.locator('#friend-copy-status').textContent()).toBe('Select the code and copy it');
    expect(await frame.locator('html').evaluate(() => getSelection()?.toString().replace(/\s/g, '').length)).toBe(6);
  } finally { await page.close(); }
});
async function buddy(page: Page, name: string, args: Record<string, unknown> = {}) {
  return (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name, arguments: args } })).json();
}
it('previews a lower-case code, declines without taking a seat and then joins', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const created = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'black' });
    const invite = await buddy(page, 'kingdown_invite', { game_id: created._meta.view.game_id });
    const code = invite.structuredContent.code.toLowerCase();
    await frame.locator('#home-play').click(); await frame.locator('#token').fill(`${code.slice(0,3)}-${code.slice(3)}`); await frame.locator('#join').click();
    await frame.locator('#join-confirm').waitFor();
    expect(await frame.locator('#join-preview .row-title').allTextContents()).toEqual(['Your opponent', 'Features']);
    expect(await frame.locator('#join-preview .line').last().textContent()).toContain('You play White.');
    await frame.locator('#join-decline').click();
    expect((await buddy(page, 'kingdown_get', { game_id: created._meta.view.game_id }))._meta.view.status).toBe('waiting');
    await frame.locator('#token').fill(code); await frame.locator('#join').click(); await frame.locator('#join-confirm').waitFor(); await frame.locator('#join-confirm').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect((await buddy(page, 'kingdown_get', { game_id: created._meta.view.game_id }))._meta.view.status).toBe('playing');
    expect(JSON.stringify(await page.evaluate(() => (window as any).harnessWidgetState))).not.toContain(code.toUpperCase());
  } finally { await page.close(); }
});
it('lists another player with features and accepts the open seat', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const created = await buddy(page, 'kingdown_create', { kind: 'random', options, colour: 'white' });
    await frame.locator('#home-play').click(); await frame.locator('#random').click();
    await frame.locator('#lobby-list .accept').first().waitFor();
    expect(await frame.locator('#lobby-list .feats [title="Fairy pieces"]').count()).toBe(1);
    await frame.locator('#lobby-list .accept').first().click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(created._meta.view.game_id);
    expect((await buddy(page, 'kingdown_get', { game_id: created._meta.view.game_id }))._meta.view.status).toBe('playing');
  } finally { await page.close(); }
});
it('offers a computer game after 25 seconds, watches without a board ID and switches', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.clock.install(); await page.clock.pauseAt(new Date());
    const waiting = await start(page, 'random');
    await frame.locator('#wait-computer').waitFor({ state: 'attached' });
    expect(await frame.locator('#wait-computer').isVisible()).toBe(false);
    await page.clock.runFor(25000); await frame.locator('#wait-computer').waitFor(); await frame.locator('#wait-computer').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const solo = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await buddy(page, 'kingdown_accept', { game_id: waiting.game_id });
    await page.clock.runFor(5000); await frame.locator('#over.found[open]').waitFor();
    const background = await page.evaluate(id => (window as any).harnessCalls.findLast((c: any) => c.name === 'kingdown_get' && c.arguments.game_id === id), waiting.game_id);
    expect(background.arguments.board_id).toBeUndefined();
    await frame.locator('#found-switch').click();
    await frame.locator('#over.found[open]').waitFor({ state: 'hidden' });
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(waiting.game_id);
    expect(await frame.locator('html').evaluate(async (_, id) => {
      const result = await (window as any).harnessApp.client.call('kingdown_get', { game_id: id }, { background: true }); return result._meta.view.status;
    }, solo)).toBe('aborted');
  } finally { await page.close(); }
});
