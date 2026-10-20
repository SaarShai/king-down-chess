// Ticket 17-b: the widget on a host like ChatGPT. The harness serves the frame from a second origin with the
// resource's sandbox, allow list and CSP. With ?frame-per-result, each chat result mounts a new frame and the old
// frames stay live, as in ChatGPT.
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Browser, Frame, Page } from 'playwright';
import { launch } from './lib/checks.mjs';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
// harness serves the source page, which shows the app to the test as window.harnessApp; built serves the build.
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, built: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => { folder = await mkdtemp(join(tmpdir(), 'kingdown-real-host-test-'));
  // Normal shared build: at most 601 ms in the M1 style test.
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe', timeout: 30_000 });
  const boardPath = join(folder, 'board.html');
  harness = await startHarness({ boardPath, sourcePage: true }); built = await startHarness({ boardPath });
  browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' }); });
afterAll(async () => { await browser?.close(); await harness?.close(); await built?.close(); await rm(folder, { recursive: true, force: true }); });
const CLASSIC = { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false };
// Node's fetch, not page.request: the offline test takes the browser offline, not the friend.
const tool = async (path: string, name: string, args: Record<string, unknown> = {}) => (await fetch(new URL(path, harness.url), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, arguments: args }) })).json();
const frameAt = async (page: Page, i = 0) => (await (await page.locator('iframe').nth(i).elementHandle())!.contentFrame())!;
const gets = (page: Page) => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
const shown = (frame: Frame) => frame.evaluate(() => { const app = (window as any).harnessApp; return { game: app.memory.view?.game_id, revision: app.memory.view?.revision, board: app.client.state.board_id, page: document.body.dataset.page }; });
// Chrome stops animation frames in a cross-origin frame out of view, as an older widget in a chat is, so these waits poll on a timer.
const POLL = { polling: 100 };
const atRevision = (frame: Frame, revision: number) => frame.waitForFunction(r => (window as any).harnessApp.memory.view?.revision === r, revision, POLL);
/** A page on the fake clock (it flows until a test pauses it), in fullscreen, where the board shows. */
async function open(query = '') {
  const page = await browser.newPage({ viewport: { width: 400, height: 900 } }); page.setDefaultTimeout(5000);
  await page.clock.install(); await page.goto(new URL(query, harness.url).href);
  await page.frameLocator('iframe').first().locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] }));
  return page;
}
/** A friend game that Alice (this page, White) plays against Bob; Alice moves first. */
async function friendGame() {
  const made = await tool('/fixture-tool', 'kingdown_create', { kind: 'friend', colour: 'white', options: CLASSIC });
  const invite = await tool('/fixture-tool', 'kingdown_invite', { game_id: made._meta.view.game_id });
  expect((await tool('/fixture-friend-tool', 'kingdown_join', { code: invite.structuredContent.code })).isError).toBeFalsy();
  return made._meta.view.game_id as string;
}
const boots = (page: Page) => page.evaluate(() => (window as any).harnessBoots as number);
/** Opens the game as the model does, and waits for the newest frame to show it on the board. */
async function showGame(page: Page, game: string) {
  const result = await tool('/fixture-tool', 'kingdown_open', { game_id: game });
  const [frames, booted] = [await page.locator('iframe').count(), await boots(page)];
  await page.evaluate(result => (window as any).harnessShow(result), result);
  // A result that mounts a new frame: the wait starts in its page, not in the blank page before it.
  if (await page.locator('iframe').count() > frames) await page.waitForFunction(n => (window as any).harnessBoots > n, booted, POLL);
  const frame = await frameAt(page, await page.locator('iframe').count() - 1);
  await frame.waitForFunction(id => (window as any).harnessApp?.memory.view?.game_id === id && document.body.dataset.page === 'board' && !document.querySelector<HTMLButtonElement>('#reload')!.disabled, game, POLL);
  return { frame, board: result._meta.board_id as string };
}
const move = (frame: Frame, lan: string) => frame.evaluate(async lan => { const app = (window as any).harnessApp, view = app.memory.view; await app.call('kingdown_move', { game_id: view.game_id, command_id: `alice-${lan}`, expected_revision: view.revision, lan }, true); return app.memory.view.revision as number; }, lan);
const friendMove = async (game: string, revision: number, lan: string) => { const result = await tool('/fixture-friend-tool', 'kingdown_move', { game_id: game, command_id: `bob-${lan}`, expected_revision: revision, lan }); expect(result.isError).toBeFalsy(); return result._meta.view.revision as number; };
const pause = async (page: Page) => page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 1000));
/** Hides the page as a phone does when it sleeps (and as the back-forward cache does), or shows it again. */
const visible = (frame: Frame, shown: boolean) => frame.evaluate(shown => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: !shown }); Object.defineProperty(document, 'visibilityState', { configurable: true, value: shown ? 'visible' : 'hidden' });
  if (!shown) dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
  document.dispatchEvent(new Event('visibilitychange'));
  if (shown) dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
}, shown);

it('serves the widget from a sandboxed second origin with the CSP of its resource', async () => {
  const page = await open();
  try {
    const frame = await frameAt(page), host = new URL(harness.url).origin, origin = new URL(frame.url()).origin;
    expect(origin).not.toBe(host);
    expect(await page.locator('iframe').getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-forms');
    expect(await page.locator('iframe').getAttribute('allow')).toBe('clipboard-write');
    // Neither page can read the other; only messages pass.
    expect(await frame.evaluate(() => { try { return parent.document.title; } catch { return 'blocked'; } })).toBe('blocked');
    const csp = (await fetch(new URL('/board-resource', origin))).headers.get('content-security-policy');
    expect(csp).toContain("default-src 'none'"); expect(csp).toContain(`img-src 'self' data: ${host}`); expect(csp).toContain("frame-src 'none'");
    // The browser applies it: the board art origin is declared for images, not for fetch.
    expect(await frame.evaluate(host => new Promise(resolve => {
      document.addEventListener('securitypolicyviolation', event => resolve(event.effectiveDirective), { once: true });
      fetch(`${host}/harness-mode`).catch(() => {});
    }), host)).toBe('connect-src');
    // Each origin serves only its own pages.
    expect((await fetch(new URL('/board-resource', host))).status).toBe(404);
    expect((await fetch(new URL('/fixture-tool', origin), { method: 'POST', body: '{}' })).status).toBe(404);
  } finally { await page.close(); }
});

it('starts the widget under its CSP when a clock step ends the boot delay', async () => {
  // A clock step runs the boot timer in a DevTools call, where the CSP lets code evaluate strings. If the built widget
  // code starts in that call, zod finds that it may compile parsers, and its first parse of a host message then fails.
  const page = await browser.newPage({ viewport: { width: 400, height: 900 } }); page.setDefaultTimeout(5000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  try {
    await page.addInitScript(() => { (window as any).harnessBootDelay = 300; });
    await page.clock.install(); await page.goto(built.url);
    await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
    await pause(page);
    const booted = await boots(page);
    await page.locator('#remount').click(); await page.waitForFunction(n => (window as any).harnessBoots > n, booted, POLL);
    await page.clock.fastForward(300);
    await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
    expect(errors).toEqual([]);
  } finally { await page.close(); }
});

it('keeps the state a check saves over a frame write that was still in flight', async () => {
  const page = await open();
  try {
    const frame = await frameAt(page);
    // The host gets the check's state first, then a write that the frame sent before it saw that state.
    await frame.evaluate(() => { parent.postMessage({ harness: 'set', values: { harnessWidgetState: { check: true } } }, '*'); (window as any).openai.setWidgetState({ late: 1 }); });
    await page.waitForFunction(() => (window as any).harnessWidgetStates.some((state: any) => state.late === 1) && (window as any).harnessWidgets[0].fence === undefined, undefined, POLL);
    expect(await page.evaluate(() => (window as any).harnessWidgetState)).toEqual({ check: true });
    // After the frame answers the fence, its writes replace the state again.
    await frame.evaluate(() => (window as any).openai.setWidgetState({ late: 2 }));
    await expect.poll(() => page.evaluate(() => (window as any).harnessWidgetState)).toEqual({ late: 2 });
  } finally { await page.close(); }
});

it('keeps two live widgets on one game current, and the older widget writes only its own state', async () => {
  const page = await open('?frame-per-result');
  try {
    const game = await friendGame();
    const older = await showGame(page, game), newer = await showGame(page, game);
    expect(await page.locator('iframe').count()).toBe(3);
    expect(older.board).not.toBe(newer.board);
    // ChatGPT gives each widget its own state: the newer one starts empty and stores its own board.
    await expect.poll(() => page.evaluate(() => (window as any).harnessWidgets.map((w: any) => w.widgetState?.privateContent?.board_id).slice(1))).toEqual([older.board, newer.board]);
    await pause(page);
    const writes = await page.evaluate(() => (window as any).harnessWidgets[1].widgetStates.length);
    // Alice moves in the newer widget; the older one shows the move on its next poll.
    const mine = await move(newer.frame, 'e2-e4');
    await page.clock.fastForward(30_000); await atRevision(older.frame, mine);
    // Bob answers; both widgets show it on their next poll.
    const answer = await friendMove(game, mine, 'e7-e5');
    await page.clock.fastForward(30_000);
    for (const { frame } of [older, newer]) { await atRevision(frame, answer); expect(await shown(frame)).toMatchObject({ game, page: 'board' }); }
    await page.frameLocator('iframe').nth(1).locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await page.frameLocator('iframe').nth(2).locator('#status').filter({ hasText: 'Your move' }).waitFor();
    // The older widget saved its state after each poll, and only into its own record. (A write before the mount result has no board.)
    const widgets = await page.evaluate(() => (window as any).harnessWidgets.map((w: any) => ({ boards: w.widgetStates.map((s: any) => s.privateContent?.board_id).filter(Boolean), reads: w.calls.filter((c: any) => c.name === 'kingdown_get').map((c: any) => c.arguments.board_id) })));
    expect(widgets[1].boards.length).toBeGreaterThan(writes);
    expect(new Set(widgets[1].boards)).toEqual(new Set([older.board])); expect(new Set(widgets[2].boards)).toEqual(new Set([newer.board]));
    expect(new Set(widgets[1].reads)).toEqual(new Set([older.board])); expect(new Set(widgets[2].reads)).toEqual(new Set([newer.board]));
    // The older widget starts another game. That selects its own board only: the newer widget remounts on the friend game.
    await older.frame.evaluate(async options => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options }); }, CLASSIC);
    const solo = (await shown(older.frame)).game;
    expect(solo).not.toBe(game);
    const booted = await boots(page);
    await page.clock.resume(); await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessBoots > n, booted, POLL);
    const remounted = await frameAt(page, 2);
    expect(newer.frame.isDetached()).toBe(true);
    await remounted.waitForFunction(id => (window as any).harnessApp?.memory.view?.game_id === id && document.body.dataset.page === 'board', game, POLL);
    expect(await shown(remounted)).toEqual({ game, revision: answer, board: newer.board, page: 'board' });
    expect((await tool('/fixture-tool', 'kingdown_get', { board_id: newer.board }))._meta.view.game_id).toBe(game);
    expect((await tool('/fixture-tool', 'kingdown_get', { board_id: older.board }))._meta.view.game_id).toBe(solo);
  } finally { await page.close(); }
});

it('reads the board once when the page comes back from sleep, and never while it sleeps', async () => {
  const page = await open();
  try {
    const game = await friendGame(), { frame } = await showGame(page, game);
    const mine = await move(frame, 'e2-e4');
    await pause(page);
    // A poll is in flight when the phone sleeps: the host holds its reply.
    await page.evaluate(() => { (window as any).holdNextGet = true; });
    await page.clock.fastForward(30_000); await page.waitForFunction(() => !!(window as any).releaseHeldGet);
    await visible(frame, false);
    const asleep = await gets(page);
    // Bob moves while the page sleeps. A minute passes, past the 10 s limit of the held call, which then answers late.
    const answer = await friendMove(game, mine, 'e7-e5');
    await page.clock.fastForward(60_000);
    await page.evaluate(() => (window as any).releaseHeldGet());
    await page.clock.fastForward(60_000);
    expect(await gets(page)).toBe(asleep);
    // The page comes back: one fresh read shows Bob's move, with no error.
    await visible(frame, true);
    await atRevision(frame, answer);
    await page.frameLocator('iframe').locator('#status').filter({ hasText: 'Your move' }).waitFor();
    expect(await gets(page)).toBe(asleep + 1);
    expect(await page.frameLocator('iframe').locator('#error').textContent()).toBe('');
    expect(await page.frameLocator('iframe').locator('#retry').isHidden()).toBe(true);
  } finally { await page.close(); }
});

it('says it cannot connect after three failed polls offline, and shows the current board when it is online again', async () => {
  const page = await open();
  try {
    const game = await friendGame(), { frame } = await showGame(page, game), widget = page.frameLocator('iframe');
    const mine = await move(frame, 'e2-e4');
    await pause(page);
    // The frame counts the failed board reads after each poll sets its next timer; kingdown_seen does not count.
    await frame.evaluate(() => {
      const w = window as any, send = w.harnessApp.client.call; w.failedReplies = 0;
      w.harnessApp.client.call = async (name: string, args: any, options: any) => {
        try { return await send(name, args, options); }
        catch (error) { if (name === 'kingdown_get') void (async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); w.failedReplies++; })(); throw error; }
      };
    });
    await page.context().setOffline(true);
    const answer = await friendMove(game, mine, 'e7-e5');
    for (let failed = 0; failed < 3; failed++) {
      expect(await widget.locator('#error').textContent()).toBe('');
      await page.clock.fastForward(30_000); await frame.waitForFunction(n => (window as any).failedReplies > n, failed);
    }
    await widget.locator('#error').filter({ hasText: 'Cannot connect. Check your connection, then try again.' }).waitFor();
    expect(await widget.locator('#retry').innerText()).toBe('Try again');
    expect(await widget.locator('#status').innerText()).toBe('Not current');
    expect((await shown(frame)).revision).toBe(mine);
    await page.context().setOffline(false);
    await page.clock.fastForward(30_000);
    await atRevision(frame, answer);
    await widget.locator('#error').filter({ hasText: /^$/ }).waitFor({ state: 'attached' });
    await widget.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    expect(await widget.locator('#retry').isHidden()).toBe(true);
  } finally { await page.close(); }
});

// The lobby, wait and join screens own no App instance; their runners stop on a real page close. A back-forward cache
// restore (pagehide and pageshow with persisted: true) must leave them running, as the board's poll does.
const sleepAndWake = async (frame: Frame) => { await visible(frame, false); await visible(frame, true); };
const lobbyReads = (page: Page) => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_lobby').length);

it('keeps the open-games list polling after the page comes back from the back-forward cache', async () => {
  const page = await open();
  try {
    const frame = await frameAt(page);
    await frame.evaluate(() => (window as any).harnessApp.navigate('lobby'));
    await page.frameLocator('iframe').locator('[data-screen="lobby"]:not([hidden])').waitFor();
    await expect.poll(() => lobbyReads(page)).toBe(1);
    await pause(page);
    await sleepAndWake(frame);
    // The page shows again: one read at once, then the 15 s schedule. A read sets its next timer when its reply comes,
    // so the clock steps until a step finds that timer.
    await expect.poll(() => lobbyReads(page)).toBe(2);
    await expect.poll(async () => { await page.clock.fastForward(15_000); return lobbyReads(page); }).toBe(3);
  } finally { await page.close(); }
});

it('keeps the wait clock running after the page comes back from the back-forward cache', async () => {
  const page = await open(), widget = page.frameLocator('iframe');
  let game: string | undefined;
  try {
    const frame = await frameAt(page);
    game = await frame.evaluate(async options => { const app = (window as any).harnessApp; app.navigate('setup'); await app.start('random', { options, colour: 'white' }); return app.memory.view?.game_id as string; }, CLASSIC);
    await widget.locator('[data-screen="wait"]:not([hidden])').waitFor();
    await pause(page);
    await sleepAndWake(frame);
    // After 25 s the screen offers a computer game while the player waits.
    await page.clock.fastForward(30_000);
    await widget.locator('#wait-computer').waitFor();
    expect(await widget.locator('#wait-time').textContent()).toMatch(/^Waiting 0:3\d\.$/);
  } finally { if (game) await tool('/fixture-tool', 'kingdown_cancel', { game_id: game }); await page.close(); }
});

it('clears the entered join code on leaving Join after the page comes back from the back-forward cache', async () => {
  const page = await open();
  try {
    const frame = await frameAt(page);
    await frame.evaluate(() => (window as any).harnessApp.navigate('join'));
    await page.frameLocator('iframe').locator('#join-code').fill('ABC123');
    expect(await frame.evaluate(() => (window as any).harnessApp.memory.code)).toBe('ABC123');
    await sleepAndWake(frame);
    await frame.evaluate(() => (window as any).harnessApp.navigate('play'));
    await frame.waitForFunction(() => (window as any).harnessApp.memory.code === '', undefined, POLL);
  } finally { await page.close(); }
});
