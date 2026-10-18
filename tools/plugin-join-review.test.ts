import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { startHarness } from './plugin-ui-harness';
import { watchMotion } from './plugin-motion-observer';
import { DEFAULT_OPTIONS } from '../src/match/setup';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-join-review-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
const options = { ...DEFAULT_OPTIONS, fairy: false, pool: [], arrangement: false, classic: true, cards: false, kingPowers: false };
async function open() {
  const page = await browser.newPage({ reducedMotion: 'no-preference' }); page.setDefaultTimeout(5000);
  await page.goto(harness.url);
  // Wait for source load before the control budget starts. A string keeps the import in the browser.
  await page.frameLocator('iframe').locator('#home-play').evaluate(`(async () => {
    await window.harnessBoot;
    await import('/src/plugin/app.ts');
  })()`);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  return page;
}
const tool = async (page: Page, friend: boolean, name: string, args = {}) => (await page.request.post(new URL(friend ? '/fixture-friend-tool' : '/fixture-tool', harness.url).href, { data: { name, arguments: args } })).json();
const expand = (page: Page) => page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
async function remount(page: Page) {
  const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length);
  await page.locator('#remount').click();
  await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, reads);
  await page.frameLocator('iframe').locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
}
it.each([false, true])('deals a chat game on first display (new widget %s)', async fresh => {
  const page = await open(), frame = page.frameLocator('iframe'); let game_id: string | undefined;
  try {
    const deal = await watchMotion(page, '#game-table .card-coin.is-dealt');
    await expand(page);
    const created = await tool(page, false, 'kingdown_create', { kind: 'solo', colour: 'white', options: { ...options, cards: true } });
    expect(created.isError).toBeFalsy(); game_id = created._meta.view.game_id;
    if (fresh) {
      // Hold the first display until a new widget has no saved page state.
      await page.evaluate(() => { (window as any).harnessWithoutWidgetState = true; (window as any).holdBeforeNext = 'kingdown_get'; });
      await page.evaluate(result => (window as any).harnessShow(result), created);
      await page.waitForFunction(() => Boolean((window as any).releaseBefore));
      await page.evaluate(() => (window as any).releaseBefore());
      await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
      await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_get'; });
      await page.locator('#remount').click();
      await page.waitForFunction(() => Boolean((window as any).releaseBefore));
      await page.evaluate(() => (window as any).releaseBefore());
    } else await page.evaluate(result => (window as any).harnessShow(result), created);
    await frame.locator('#card-w-3').waitFor();
    expect((await deal()).count).toBe(8);
  } finally { if (game_id) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } }); await page.close(); }
});
it('names the current game on Resume after Play now and after the computer reply', async () => {
  const page = await open(), frame = page.frameLocator('iframe'); let game_id: string | undefined;
  try {
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    await frame.locator('#home-card').waitFor({ state: 'visible' });
    expect(await frame.locator('#home-play').textContent()).toBe('Resume Computer · Your move');
    await frame.locator('#home-play').click();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_computer'; });
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp, view = app.memory.view;
      await app.call('kingdown_move', { game_id: view.game_id, command_id: crypto.randomUUID(), expected_revision: view.revision, lan: 'e2-e4' }, true);
    });
    await page.waitForFunction(() => Boolean((window as any).releaseHeld));
    const names = await page.evaluate(() => (window as any).harnessCalls.map((c: any) => c.name) as string[]);
    expect(names.slice(names.lastIndexOf('kingdown_move') + 1)).not.toContain('kingdown_games');
    expect(await frame.locator('#board-menu').isDisabled()).toBe(true);
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#board-menu:not(:disabled)').waitFor();
    await expect.poll(() => frame.locator('html').evaluate(() => { const view = (window as any).harnessApp.memory.view; return view.revision >= 2 && view.action === 'ready'; })).toBe(true);
    const afterReply = await page.evaluate(() => (window as any).harnessCalls.map((c: any) => c.name) as string[]);
    expect(afterReply.slice(afterReply.lastIndexOf('kingdown_move') + 1)).not.toContain('kingdown_games');
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    await frame.locator('#home-card').waitFor({ state: 'visible' });
    expect(await frame.locator('#home-play').textContent()).toBe('Resume Computer · Your move');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); if (game_id) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } }); await page.close(); }
});
it('keeps the home action after the player leaves an ended game for the hall', async () => {
  const page = await open(), frame = page.frameLocator('iframe'); const games: string[] = [];
  try {
    await expand(page);
    for (let i = 0; i < 2; i++) {
      await frame.locator('html').evaluate(async (_, options) => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options }); }, options);
      games.push(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id));
    }
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_resign', { game_id: app.memory.view.game_id }, true, false, true); await app.call('kingdown_get', {}); app.navigate('play'); });
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    await frame.locator('#home-card').waitFor({ state: 'visible' });
    const label = await frame.locator('#home-play').textContent();
    expect(label).toContain('Computer');
    await remount(page);
    expect(await frame.locator('#home-play').textContent()).toBe(label);
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(games[0]);
  } finally { for (const game_id of games) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } }); await page.close(); }
});
it.each(['join', 'accept'])('keeps a newer chat selection after a late %s reply', async action => {
  const page = await open(), frame = page.frameLocator('iframe'); const games: string[] = [];
  try {
    await expand(page);
    const offered = await tool(page, true, 'kingdown_create', { kind: action === 'join' ? 'friend' : 'random', colour: 'black', options });
    expect(offered.isError).toBeFalsy(); games.push(offered._meta.view.game_id);
    if (action === 'join') {
      const invite = await tool(page, true, 'kingdown_invite', { game_id: games[0] });
      const preview = await tool(page, false, 'kingdown_open', { code: invite.structuredContent.code });
      await page.evaluate(result => (window as any).harnessShow(result, true), preview);
      await frame.locator('#join-confirm:not(:disabled)').waitFor();
    } else {
      await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('lobby'));
      await frame.locator('#lobby-list button').filter({ hasText: 'Accept' }).first().waitFor();
    }
    await page.evaluate(name => { (window as any).holdNext = name; }, `kingdown_${action}`);
    await (action === 'join' ? frame.locator('#join-confirm') : frame.locator('#lobby-list button').filter({ hasText: 'Accept' }).first()).click();
    await page.waitForFunction(() => Boolean((window as any).releaseHeld));
    const newer = await tool(page, false, 'kingdown_create', { kind: 'solo', colour: 'white', options });
    games.push(newer._meta.view.game_id);
    await page.evaluate(result => (window as any).harnessShow(result), newer);
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    const board = await frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.board_id);
    expect(board).toEqual(expect.any(String));
    await page.evaluate(() => (window as any).releaseHeld());
    // A bridge call after the held reply drains the app's message queue.
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.client.call('kingdown_settings'); });
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(games[1]);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.board_id)).toBe(board);
    await remount(page);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(games[1]);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); for (const game_id of games) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } }); await page.close(); }
});

it.each([true, false])('keeps an inline chat join for Resume (good code %s)', async good => {
  const page = await open(), frame = page.frameLocator('iframe'); let game_id: string | undefined;
  try {
    const offered = await tool(page, true, 'kingdown_create', { kind: 'friend', colour: 'black', options });
    expect(offered.isError).toBeFalsy(); game_id = offered._meta.view.game_id;
    const code = good ? (await tool(page, true, 'kingdown_invite', { game_id })).structuredContent.code : 'ZZZZZZ';
    const opened = await tool(page, false, 'kingdown_open', { code });
    expect(!!opened.isError).toBe(!good);
    // The widget stays inline, so Join waits behind the home card until the player taps Resume.
    await page.evaluate(result => (window as any).harnessShow(result, true), opened);
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    await frame.locator('#home-card').waitFor({ state: 'visible' });
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="join"]:not([hidden])').waitFor();
    if (good) {
      await frame.locator('#join-confirm:not([hidden])').waitFor();
      expect(await frame.locator('#join-help').textContent()).toBe('Review this game before you join.');
    } else {
      await expect.poll(() => frame.locator('#join-message').textContent()).not.toBe('');
      expect(await frame.locator('#join-confirm').isHidden()).toBe(true);
    }
  } finally { if (game_id) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } }); await page.close(); }
});
it('keeps the handle field blocked until the mount identity read ends', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('handle'));
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_settings'; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => Boolean((window as any).releaseBefore));
    expect(await frame.locator('#handle').isDisabled()).toBe(true);
    await page.evaluate(() => (window as any).releaseBefore());
    await frame.locator('#handle:not(:disabled)').waitFor();
    await frame.locator('#handle').fill('new-handle');
    expect(await frame.locator('#handle').inputValue()).toBe('new-handle');
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});
it('names a waiting friend game on Resume after a remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe'); let game_id: string | undefined;
  try {
    await expand(page);
    await frame.locator('html').evaluate(async (_, options) => { await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white', options }); }, options);
    game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    await remount(page);
    expect(await frame.locator('#home-play').textContent()).toBe('Resume Waiting for a friend');
  } finally { if (game_id) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } }); await page.close(); }
});
