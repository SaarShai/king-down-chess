import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { controlBounds } from './lib/plugin-control-bounds.mjs';
import { startHarness } from './plugin-ui-harness';
import { LESSONS } from '../src/lessons';
import { lessonMoves, lessonPosition } from '../src/plugin/screens/guide-model';
import { toLan } from '../src/rules/setup';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string;
let harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => { folder = await mkdtemp(join(tmpdir(), 'kingdown-app-test-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open(url = harness.url) {
  const page = await browser.newPage(); page.setDefaultTimeout(5000); await page.goto(url);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  return page;
}
/** Waits until the frame's transport calls match the host's held calls, then one frame: each released reply is drawn. */
async function settled(page: Page) {
  const end = Date.now() + 5000;
  for (;;) {
    const held = await page.evaluate(() => (window as any).harnessHeld ?? 0);
    const done = await page.frameLocator('iframe').locator('html').evaluate((_, held) => (window as any).harnessApp.client.inflight === held, held);
    if (done) break;
    if (Date.now() > end) throw new Error('settled: the frame still waits for a call');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  await page.frameLocator('iframe').locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(undefined))));
}
// Spec J2, D2: the first test, while the shared player has no saved setup and no game.
it('takes a new player from the home card to a draft move and the turn press', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#home-card button').allInnerTexts()).toEqual(['Play now', 'Choose a game']);
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests)).toEqual(['fullscreen']);
    expect(await page.evaluate(() => (window as any).harnessCalls.find((c: any) => c.name === 'kingdown_create').arguments)).toMatchObject({ kind: 'solo', level: 'beginner', options: { arrangement: false } });
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    const box = (await frame.locator('#board canvas').boundingBox())!;
    const tap = (file: number, rank: number) => page.mouse.click(box.x + (32 + (file + .5) * 112) * box.width / 960, box.y + (96 + (7 - rank + .5) * 112) * box.width / 960);
    await tap(4, 1); await tap(4, 2);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move'))).toEqual([]);
    await frame.locator('#end-turn[aria-disabled="false"]').click();
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.actions))).toEqual([['e2-e3']]);
    const game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } });
  } finally { await page.close(); }
});
// These two run before any game waits for the player.
it('opens the Play hall from the inline Choose a game action', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.setViewportSize({ width: 393, height: 600 });
    await frame.locator('#home-games').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests)).toEqual(['fullscreen']);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.screen)).toBe('play');
    // Your games come first in the hall.
    expect(await frame.locator('[data-screen="play"] .new-game-body').evaluate(e => e.scrollTop)).toBe(0);
  } finally { await page.close(); }
});
it('keeps the home card when a chat tool result arrives after the player leaves fullscreen', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-games').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }));
    await frame.locator('#home-card:not([hidden])').waitFor();
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length);
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length > n, reads);
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests)).toEqual(['fullscreen']);
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
    await frame.locator('#home-games').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('keeps a board open without a game on home and stores its ID only in private state', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const result = await (await page.request.post(new URL('/fixture-tool',harness.url).href,{data:{name:'kingdown_open',arguments:{screen:'board'}}})).json();
    expect(result.structuredContent).not.toHaveProperty('board_id');
    expect(result._meta.board_id).toEqual(expect.any(String));
    await page.evaluate(result => (window as any).harnessShow(result,true),result);
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('body').getAttribute('data-page')).toBe('home');
    expect(await page.evaluate(()=>(window as any).harnessWidgetState.privateContent.board_id)).toBe(result._meta.board_id);
    await page.locator('#remount').click();
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('body').getAttribute('data-page')).toBe('home');
  } finally {await page.close();}
});

// Each screen but home shows only in fullscreen (spec Q25). A test that opens a screen directly puts the host there first.
const expand = (page: Page) => page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] }));
// Tests of the hall itself open it directly.
async function quickStart(frame: ReturnType<Page['frameLocator']>) {
  await frame.locator('html').evaluate('(async () => { const setup = await import("/src/plugin/screens/setup.ts"); setup.playNow(); })()');
}
async function hall(page: Page) { await expand(page); await page.frameLocator('iframe').locator('html').evaluate(() => (window as any).harnessApp.navigate('play')); }
it.each(['games', 'profile'] as const)('keeps a valid Resume route after a %s result clears the game behind home', async route => {
  const page = await open(), frame = page.frameLocator('iframe');
  let game_id: string | undefined;
  try {
    await hall(page);
    game_id = await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', level: 'beginner', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } });
      return (window as any).harnessApp.memory.view.game_id as string;
    });
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }));
    await frame.locator('#home-card:not([hidden])').waitFor();
    const result = await page.evaluate(route => (window as any).harnessTool(route === 'profile'
      ? { name: 'kingdown_open', arguments: { screen: 'profile' } }
      : { name: 'kingdown_games', arguments: {} }), route);
    const lists = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length);
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length > n, lists);
    await settled(page);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view)).toBeUndefined();
    await expect.poll(() => page.evaluate(() => (window as any).harnessWidgetState.privateContent.queued)).toBe(route === 'profile' ? 'profile' : 'play');
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => ['kingdown_open', 'kingdown_resume'].includes(c.name)).length);
    await frame.locator('#home-play:not(:disabled)').click();
    await frame.locator(`[data-screen="${route === 'profile' ? 'profile' : 'board'}"]:not([hidden])`).waitFor();
    if (route === 'games') {
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view?.game_id)).toBe(game_id);
      expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => ['kingdown_open', 'kingdown_resume'].includes(c.name)).length)).toBeGreaterThan(reads);
    }
  } finally {
    if (game_id) await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id } });
    await page.close();
  }
});
async function start(page: Page, route = true) {
  await expand(page);
  await page.frameLocator('iframe').locator('html').evaluate((_, route) => {
    const host = window as any;
    host.harnessApp.navigate('play');
    host.startResult = undefined;
    host.harnessApp.start('friend', { colour: 'white' }, { route }).then((view: any) => { host.startResult = view; });
  }, route);
}
it('reads a saved board at mount and shows Retry with the saved failure words', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white' }); });
    // The friend screen opens after the host grants fullscreen. Its state write reaches the host page by postMessage,
    // so the check waits for it before it replaces the saved state.
    await page.waitForFunction(() => (window as any).harnessWidgetState?.privateContent?.screen === 'friend');
    await page.evaluate(() => {
      const host = window as any;
      host.harnessWidgetState = { modelContent: {}, privateContent: { screen: 'play', board_id: host.harnessWidgetState.privateContent.board_id, pending: { name: 'kingdown_create', args: { kind: 'friend' }, error: 'The reply was lost.', error_screen: 'play' } } };
    });
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    expect(await frame.locator('#retry').isVisible()).toBe(true);
    expect(await frame.locator('#error').textContent()).toBe('The reply was lost.');
  } finally { await page.close(); }
});

it('recovers a completed create or find after its reply is lost', async () => {
  for (const kind of ['friend', 'random']) {
    const page = await open(), frame = page.frameLocator('iframe'), name = kind === 'friend' ? 'kingdown_create' : 'kingdown_find';
    try {
      // A player starts on New game, which shows only in fullscreen (spec Q25).
      await expand(page);
      if (kind === 'random') await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white' }); });
      await page.evaluate(name => { (window as any).dropNextReply = name; }, name);
      await frame.locator('html').evaluate((_, kind) => {
        const host = window as any; host.harnessApp.navigate('play');
        host.harnessApp.start(kind, { colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } }).then((view: any) => { host.startResult = view; });
      }, kind);
      await frame.locator('#retry').waitFor();
      const completed = await page.evaluate(() => (window as any).harnessView.game_id);
      await frame.locator('#retry').click();
      await frame.locator(`[data-screen="${kind === 'friend' ? 'friend' : 'wait'}"]:not([hidden])`).waitFor();
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(completed);
      // Retry sends the same command ID again; the server receipt gives back the same game (design §5.2).
      expect(await page.evaluate(name => (window as any).harnessCalls.filter((c: any) => c.name === name).length, name)).toBe(2);
      expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    } finally { await page.close(); }
  }
});
it('recovers a lost Create or Find reply when Save resumes the pending start', async () => {
  for (const kind of ['friend', 'random']) {
    const page = await open(), frame = page.frameLocator('iframe'), name = kind === 'friend' ? 'kingdown_create' : 'kingdown_find';
    try {
      // A player starts on New game, which shows only in fullscreen (spec Q25).
      await expand(page);
      await page.evaluate(name => { (window as any).dropNextReply = name; }, name);
      await frame.locator('html').evaluate((_, kind) => {
        const host = window as any; host.harnessApp.navigate('play');
        host.harnessApp.start(kind, { colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } }).then((view: any) => { host.startResult = view; });
      }, kind);
      await frame.locator('#retry').waitFor();
      const completed = await page.evaluate(() => (window as any).harnessView.game_id);
      await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('settings'); });
      await frame.locator('[data-nav="handle"]').click();
      await frame.locator('#save-handle').click();
      await frame.locator(`[data-screen="${kind === 'friend' ? 'friend' : 'wait'}"]:not([hidden])`).waitFor();
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(completed);
      expect(await page.evaluate(name => (window as any).harnessCalls.filter((c: any) => c.name === name).length, name)).toBe(2);
      expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    } finally { await page.close(); }
  }
});
it('shows the saved failure words and Retry after a remount of a lost Create or Find reply, then finishes it', async () => {
  for (const kind of ['friend', 'random']) {
    const page = await open(), frame = page.frameLocator('iframe'), name = kind === 'friend' ? 'kingdown_create' : 'kingdown_find';
    try {
      // A player starts on New game, which shows only in fullscreen (spec Q25).
      await expand(page);
      await page.evaluate(name => { (window as any).dropNextReply = name; }, name);
      await frame.locator('html').evaluate((_, kind) => {
        const app = (window as any).harnessApp; app.navigate('play');
        void app.start(kind, { colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } });
      }, kind);
      await frame.locator('#retry').waitFor();
      const completed = await page.evaluate(() => (window as any).harnessView.game_id);
      // At a remount, a pending with an error shows its saved words and Retry, and sends nothing by itself (design §5.3).
      await page.locator('#remount').click();
      await frame.locator('#retry:not(:disabled)').waitFor();
      await expect.poll(() => frame.locator('#error').textContent()).toBe('Harness lost reply after commit');
      await frame.locator('#retry').click();
      await frame.locator(`[data-screen="${kind === 'friend' ? 'friend' : 'wait'}"]:not([hidden])`).waitFor();
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(completed);
      expect(await page.evaluate(name => (window as any).harnessCalls.filter((c: any) => c.name === name).length, name)).toBe(2);
      expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    } finally { await page.close(); }
  }
});
it('opens a usable solo board after Retry of a lost Choose reply without a remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).uncheck();
    await frame.getByRole('checkbox', { name: 'King powers', exact: true }).check();
    await page.evaluate(() => { (window as any).dropNextReply = 'kingdown_choose'; });
    await frame.locator('#setup-start').click(); await frame.locator('#retry').waitFor();
    const completed = await page.evaluate(() => (window as any).harnessView.game_id);
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(completed);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').length)).toBe(1);
    await frame.locator('#board').focus();
    await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter');
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
    await frame.locator('#choices button').first().waitFor();
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
  } finally { await page.close(); }
});
it('keeps Start blocked and retries the same solo game after its board read fails', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).uncheck();
    await frame.getByRole('checkbox', { name: 'King powers', exact: true }).check();
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('#setup-start').click();
    await frame.locator('#error').filter({ hasText: 'Harness saved-game read failed' }).waitFor();
    expect(await frame.locator('#setup-start').isDisabled()).toBe(true);
    await frame.locator('#retry').waitFor();
    const completed = await page.evaluate(() => (window as any).harnessView.game_id);
    await frame.locator('#setup-start').evaluate(button => button.click());
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(completed);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').length)).toBe(1);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.close(); }
});
it('blocks Retry and screen actions until both mount reads finish', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const moved = await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white' }); return (window as any).harnessApp.memory.view.game_id as string; });
    await page.evaluate(() => { (window as any).dropNextMoveReply = true; });
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'held-mount-move', expected_revision: 0, lan: 'e2-e4' }, true);
    });
    await frame.locator('#retry').waitFor();
    const board_id = await page.evaluate(() => (window as any).harnessWidgetState.privateContent.board_id);
    const switched = await (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white', board_id } } })).json();
    expect(switched.isError).toBeFalsy();
    const sends = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').length);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_settings'; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    expect(await frame.locator('#retry').isDisabled()).toBe(true);
    expect(await frame.locator('button:visible').evaluateAll(buttons => buttons.every(button => (button as HTMLButtonElement).disabled))).toBe(true);
    await frame.locator('#retry').evaluate(button => button.click());
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').length)).toBe(sends);
    await page.evaluate(() => { (window as any).holdNextGet = true; (window as any).releaseHeld(); });
    await page.waitForFunction(() => typeof (window as any).releaseHeldGet === 'function');
    expect(await frame.locator('#retry').isDisabled()).toBe(true);
    await frame.locator('#retry').evaluate(button => button.click());
    await page.evaluate(() => { (window as any).releaseHeldGet(); });
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').length)).toBe(sends);
    // Finding 8: the pending move stays for its own game; the other board shows no Retry.
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toMatchObject({ name: 'kingdown_move', game_tag: moved.slice(0, 8) });
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(switched._meta.view.game_id);
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseHeldGet?.(); }); await page.close(); }
});
it('refreshes the Play rows after Create and Move from the page', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } });
    });
    const game_id = await page.evaluate(() => (window as any).harnessView.game_id);
    await frame.locator('#page-back').click();
    await frame.locator('#saved-games').evaluate(el => { (el as HTMLDetailsElement).open = true; });
    const row = frame.locator(`#games-list [data-game-id="${game_id}"]`);
    await row.waitFor();
    expect(await row.locator('.line').textContent()).toMatch(/Move 1 ·\sWhite/);
    await row.click(); await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    await frame.locator('html').evaluate(async (_, game_id) => {
      await (window as any).harnessApp.call('kingdown_move', { game_id, command_id: 'play-rows-move', expected_revision: 0, lan: 'e2-e4' }, true);
      (window as any).harnessApp.navigate('play');
    }, game_id);
    await frame.locator('#saved-games').evaluate(el => { (el as HTMLDetailsElement).open = true; });
    await row.locator('.line').filter({ hasText: /Their turn ·\smove 1/ }).waitFor();
    expect(await row.locator('.turn-mark').count()).toBe(0);
    expect(await frame.locator('html').evaluate((_, game_id) => (window as any).harnessApp.memory.games.find((entry: any) => entry.game_id === game_id).revision, game_id)).toBe(1);
  } finally { await page.close(); }
});
it('opens a chat route in host fullscreen with no display request', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests ?? [])).toEqual([]);
  } finally { await page.close(); }
});
it('keeps an inline chat route behind home until Resume requests fullscreen', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('#home-play:not(:disabled)').filter({ hasText: 'Resume' }).waitFor();
    expect(await frame.locator('[data-screen="profile"]').isHidden()).toBe(true);
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests ?? [])).toEqual([]);
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests)).toEqual(['fullscreen']);
  } finally { await page.close(); }
});
it('keeps an inline route through an inline remount with no display request', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('#home-play:not(:disabled)').filter({ hasText: 'Resume' }).waitFor();
    await page.addInitScript(() => {
      const host = window as any; host.profileShownInline = false;
      new MutationObserver(() => {
        const profile = document.querySelector<HTMLElement>('[data-screen="profile"]');
        if (profile && !profile.hidden && !document.getElementById('app-frame')?.hidden) host.profileShownInline = true;
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    });
    await page.locator('#remount').click();
    await frame.locator('#home-play:not(:disabled)').filter({ hasText: 'Resume' }).waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests ?? [])).toEqual([]);
    expect(await frame.locator('html').evaluate(() => (window as any).profileShownInline)).toBe(false);
    await expand(page);
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('keeps the inline route when the host refuses a button request', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('#home-play:not(:disabled)').filter({ hasText: 'Resume' }).waitFor();
    await page.evaluate(() => { (window as any).denyDisplayNext = true; });
    await frame.locator('#home-play').click();
    await frame.locator('#home-error', { hasText: 'expand control' }).waitFor();
    expect(await frame.locator('[data-screen="profile"]').isHidden()).toBe(true);
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
    await frame.locator('#home-play').filter({ hasText: 'Resume' }).click();
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('shows the home card when the player leaves fullscreen, and Resume returns to the game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    // The saved setup decides whether a computer game opens on the seat or on the board.
    const game = frame.locator('[data-screen="seat"]:not([hidden]), [data-screen="board"]:not([hidden])');
    await frame.locator('#setup-start').click(); await game.waitFor(); const screen = await game.getAttribute('data-screen');
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }));
    await frame.locator('#home-card:not([hidden])').waitFor();
    expect(await frame.locator('#app-frame').isHidden()).toBe(true);
    expect((await frame.locator('#home-card').boundingBox())!.height).toBeGreaterThan(100);
    await frame.locator('#home-play').click();
    await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
  } finally { await page.close(); }
});
it('keeps the opponent picked in the Play hall for the session', async () => {
  const page = await open(), frame = page.frameLocator('iframe'), friend = frame.getByRole('radio', { name: 'A friend', exact: true });
  try {
    await hall(page); await friend.locator('..').click();
    await frame.locator('[data-screen="play"] [data-nav="settings"]').click(); await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    await frame.locator('#page-back').click();
    expect(await friend.isChecked()).toBe(true);
  } finally { await page.close(); }
});
it('uses the approved flat face on a disabled control', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#board-menu').evaluate(button => {
      (button as HTMLButtonElement).disabled = true;
      return getComputedStyle(button).backgroundImage;
    })).toBe('none');
  } finally { await page.close(); }
});
it('names the turn on Resume and keeps the open game after a home remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const game = await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      const options = { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false };
      for (let n = 0; n < 2; n++) await app.call('kingdown_create', { kind: 'solo', colour: 'white', options });
      return app.memory.view.game_id;
    });
    await page.route('**/fixture-tool', async route => {
      if (route.request().postDataJSON().name !== 'kingdown_games') return route.continue();
      const response = await route.fetch(), result = await response.json();
      result._meta.games.sort((a: any, b: any) => Number(a.game_id === game) - Number(b.game_id === game));
      await route.fulfill({ json: result });
    });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    expect(await frame.locator('#home-play').textContent()).toContain('Your move');
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#home-play:not(:disabled)').waitFor();
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(game);
  } finally { await page.close(); }
});
it.each([false, true])('reads the selected board after remount with an older game seed: %s', async olderGameSeed => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const create = () => frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } });
      return app.memory.view.game_id;
    });
    if (olderGameSeed) {
      const game_id = await create();
      const seed = await page.evaluate(game_id => (window as any).harnessTool({ name: 'kingdown_open', arguments: { game_id } }), game_id);
      const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
      await page.evaluate(result => (window as any).harnessShow(result, true), seed);
      await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
      await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    }
    const selected = await create();
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_get'; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => Boolean((window as any).releaseBefore));
    expect(await page.evaluate(() => (window as any).harnessView?.game_id)).not.toBe(selected);
    await page.evaluate(() => (window as any).releaseBefore());
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(selected);
    expect(await page.evaluate(() => (window as any).harnessView?.game_id)).toBe(selected);
  } finally {
    await page.evaluate(() => (window as any).releaseBefore?.());
    await page.close();
  }
});
it('keeps the Resume label with the end screen while another game waits', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const game = await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      const options = { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false };
      for (let n = 0; n < 2; n++) await app.call('kingdown_create', { kind: 'solo', colour: 'white', options });
      const game = app.memory.view.game_id;
      await app.call('kingdown_resign', { game_id: game }, true, false, true);
      await app.call('kingdown_get', {});
      return game;
    });
    await frame.locator('[data-screen="end"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    expect(await frame.locator('#home-play').textContent()).toBe('Resume');
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('#home-play').textContent()).toBe('Resume');
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="end"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(game);
  } finally { await page.close(); }
});
it('reads the games list after a move before it offers Next game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const tool = async (friend: boolean, name: string, args = {}) => (await page.request.post(new URL(friend ? '/fixture-friend-tool' : '/fixture-tool', harness.url).href, { data: { name, arguments: args } })).json();
  const options = { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false };
  let current = '', next = '';
  try {
    await expand(page);
    await page.route('**/fixture-tool', async route => {
      if (route.request().postDataJSON().name !== 'kingdown_games') return route.continue();
      const response = await route.fetch(), result = await response.json();
      result._meta.games = result._meta.games.filter((entry: any) => [current, next].includes(entry.game_id));
      await route.fulfill({ json: result });
    });
    const created = await tool(false, 'kingdown_create', { kind: 'friend', colour: 'white', options });
    current = created._meta.view.game_id;
    const invite = await tool(false, 'kingdown_invite', { game_id: current });
    await tool(true, 'kingdown_join', { code: invite.structuredContent.code });
    await page.evaluate(result => (window as any).harnessShow(result, true), created);
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    const offered = await tool(true, 'kingdown_create', { kind: 'friend', colour: 'black', options });
    const code = await tool(true, 'kingdown_invite', { game_id: offered._meta.view.game_id });
    next = (await tool(false, 'kingdown_join', { code: code.structuredContent.code }))._meta.view.game_id;
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length);
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_games'; });
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp, view = app.memory.view;
      await app.call('kingdown_move', { game_id: view.game_id, command_id: crypto.randomUUID(), expected_revision: view.revision, lan: 'e2-e4' }, true);
    });
    await page.waitForFunction(() => Boolean((window as any).releaseBefore));
    expect(await frame.locator('#reload').isDisabled()).toBe(false);
    expect(await frame.locator('#next-game').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length)).toBeGreaterThan(reads);
    await page.evaluate(() => (window as any).releaseBefore());
    await frame.locator('#next-game').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    expect(await frame.locator('#home-play').textContent()).toContain('Their turn');
    await frame.locator('#home-play').click();
    await frame.locator('#next-game').click();
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(next);
  } finally { await page.close(); }
});
it('keeps the opponent picked after a remount in the Play hall', async () => {
  const page = await open(), frame = page.frameLocator('iframe'), friend = frame.getByRole('radio', { name: 'A friend', exact: true });
  try {
    await hall(page); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await page.locator('#remount').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor(); await friend.locator('..').click();
    await frame.locator('[data-screen="play"] [data-nav="settings"]').click(); await frame.locator('#page-back').click();
    expect(await friend.isChecked()).toBe(true);
  } finally { await page.close(); }
});
it('keeps chat preview and code errors in page memory on notification and mount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const tool = async (path: string, name: string, args = {}) => (await page.request.post(new URL(path, harness.url).href, { data: { name, arguments: args } })).json();
  try {
    await expand(page);
    const friend = await tool('/fixture-friend-tool', 'kingdown_create', { kind: 'friend', colour: 'white' });
    const invite = await tool('/fixture-friend-tool', 'kingdown_invite', { game_id: friend._meta.view.game_id });
    const preview = await tool('/fixture-tool', 'kingdown_open', { code: invite.structuredContent.code });
    await page.evaluate(result => (window as any).harnessShow(result), preview);
    for (const remount of [false, true]) {
      if (remount) {
        const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length);
        await page.locator('#remount').click();
        await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, reads);
      }
      await frame.locator('[data-screen="join"]:not([hidden])').waitFor();
      await frame.locator('#page-back:not(:disabled)').waitFor({ state: 'attached' });
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.preview)).toEqual(preview._meta.preview);
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.joinError)).toBeUndefined();
    }
    const error = await tool('/fixture-tool', 'kingdown_open', { code: 'bad?' });
    expect(error.isError).toBe(true);
    await page.evaluate(result => (window as any).harnessShow(result, true), error);
    for (const remount of [false, true]) {
      if (remount) {
        const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length);
        await page.locator('#remount').click();
        await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, reads);
      }
      await frame.locator('[data-screen="join"]:not([hidden])').waitFor();
      await frame.locator('#page-back:not(:disabled)').waitFor({ state: 'attached' });
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.preview)).toBeUndefined();
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.joinError)).toEqual({ code: error._meta.code, message: error.content.map((c: any) => c.text).join(' ') });
    }
  } finally { await page.close(); }
});
// A static field takes text before the mount read ends. The mount then draws its screen from the new page's memory and
// would clear what the player typed, so the code field stays blocked until the Join handlers are ready.
it('reads a friend code again after the join preview remounts', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const tool = async (path: string, name: string, args = {}) => (await page.request.post(new URL(path, harness.url).href, { data: { name, arguments: args } })).json();
  try {
    await expand(page);
    // A saved board makes the mount read it; the test holds that read.
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white' }); });
    const friend = await tool('/fixture-friend-tool', 'kingdown_create', { kind: 'friend', colour: 'white' });
    const invite = await tool('/fixture-friend-tool', 'kingdown_invite', { game_id: friend._meta.view.game_id });
    const code = invite.structuredContent.code.toLowerCase();
    await hall(page);
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click();
    await frame.locator('#token').fill(code); await frame.locator('#join').click();
    await frame.locator('#join-confirm').waitFor();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_get'; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await frame.locator('#join-entry').waitFor();
    const input = frame.locator('#join-code'), filled = input.fill(code);
    await expect.poll(async () => await input.isDisabled() || await input.inputValue() === code).toBe(true);
    await page.evaluate(() => (window as any).releaseHeld());
    await filled; await frame.locator('#join-entry button').click();
    await frame.locator('#join-confirm').waitFor();
    expect(await frame.locator('#join-help').textContent()).toBe('Review this game before you join.');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});
// Join shows its own sentence for a refused code; the raw server text is not the page notice on any screen.
it('keeps a refused Join on the join screen', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const tool = async (name: string, args = {}) => (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name, arguments: args } })).json();
  try {
    const friend = await tool('kingdown_create', { kind: 'friend', colour: 'white' });
    const invite = await tool('kingdown_invite', { game_id: friend._meta.view.game_id });
    await hall(page);
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click();
    await frame.locator('#token').fill(invite.structuredContent.code); await frame.locator('#join').click();
    await frame.locator('#join-confirm').waitFor();
    // The creator makes a new code, so the shown code stops working before the tap.
    await tool('kingdown_invite', { game_id: friend._meta.view.game_id });
    await frame.locator('#join-confirm').click();
    await expect.poll(() => frame.locator('#join-message').textContent()).toBe('No game has this code. Check the code with your friend.');
    expect(await frame.locator('#error').textContent()).toBe('');
    await frame.locator('#join-decline').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
    await page.request.post(new URL('/fixture-delete-match', harness.url).href, { data: { game_id: friend._meta.view.game_id } });
  } finally { await page.close(); }
});
it('shows both setup states in the app games rows', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false } });
    });
    const game_id = await page.evaluate(() => (window as any).harnessView.game_id);
    const accepted = await (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name: 'kingdown_accept', arguments: { game_id } } })).json();
    expect(accepted.isError).toBeFalsy();
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
    await frame.locator('#page-back').click();
    await frame.locator('#saved-games').evaluate(el => { (el as HTMLDetailsElement).open = true; });
    const row = frame.locator(`#games-list [data-game-id="${game_id}"]`);
    expect(await row.locator('.line').textContent()).toMatch(/Choose your side ·\sWhite/);
    expect(await row.locator('.turn-mark').textContent()).toBe('Your turn');
    await row.click();
    await frame.locator('[data-screen="seat"]:not([hidden])').waitFor(); await frame.locator('#page-back:not(:disabled)').waitFor({ state: 'attached' });
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp, view = app.memory.view;
      await app.call('kingdown_choose', { game_id: view.game_id, command_id: 'setup-rows-ready', expected_revision: view.revision, king: null, order: view.draw, ready: true }, true);
    });
    await frame.locator('#page-back').click();
    await frame.locator('#saved-games').evaluate(el => { (el as HTMLDetailsElement).open = true; });
    await row.locator('.line').filter({ hasText: 'Waiting for the other player' }).waitFor();
    expect(await row.locator('.turn-mark').count()).toBe(0);
  } finally { await page.close(); }
});
it('updates activity on unchanged replies across the two-minute poll boundary', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind: 'friend', colour: 'white' });
      // The harness postMessage hook sets a host flag in order with the frame's next tool call.
      parent.postMessage({ harness: 'set', values: { harnessNextView: { ...app.memory.view, status: 'playing', speed: 'daily', turn: 1, seat: 0, opponent: { last_seen_ms: 119000 }, server_now: '2026-10-11T12:00:00Z' } } }, '*');
      await app.call('kingdown_get', {});
    });
    const before = await frame.locator('html').evaluate(async () => {
      const { pollDelay } = await new Function('return import("/src/plugin/poll.ts")')();
      return pollDelay((window as any).harnessApp.memory.view, 0, false);
    });
    expect(before).toBe(3000);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      parent.postMessage({ harness: 'set', values: { harnessNextView: { ...app.memory.view, opponent: { last_seen_ms: 121000 }, server_now: '2026-10-11T12:00:02Z' } } }, '*');
      await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true, false);
    });
    expect(await frame.locator('html').evaluate(async () => {
      const { pollDelay } = await new Function('return import("/src/plugin/poll.ts")')(), view = (window as any).harnessApp.memory.view;
      return { delay: pollDelay(view, 0, false), now: view.server_now };
    })).toEqual({ delay: 30000, now: '2026-10-11T12:00:02Z' });
  } finally { await page.close(); }
});
// The start does not wait for the name: Save resends it, and its continuation finishes the start (design §5.2).
it('keeps the start through HANDLE_NEEDED and Back, and Save finishes it', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => { (window as any).requireHandleNext = true; });
    await start(page, false);
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#page-back').textContent()).toBe('‹ Play');
    await frame.locator('#page-back').click();
    expect(await frame.locator('[data-screen="play"]').isVisible()).toBe(true);
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('handle'); });
    await frame.locator('#save-handle').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.status)).toBe('waiting');
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.close(); }
});
it('shows no Retry on New game while Save sends the waiting start again', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => { (window as any).requireHandleNext = true; });
    await start(page, false);
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    await frame.locator('#save-handle').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    expect(await frame.locator('[data-screen="play"]').isVisible()).toBe(true);
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await frame.locator('#error').textContent()).toBe('');
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});
// The continuation of a resent start routes (design §5.2), so the start's own route option no longer matters here.
it.each([true, false])('finishes a start with route=%s through Save, a failed send and Retry', async route => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => { (window as any).requireHandleNext = true; (window as any).failActionAfterHandle = true; });
    await start(page, route);
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    await frame.locator('#save-handle').click();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toContain('Harness action after Save failed');
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('settings'); });
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await frame.locator('#error').textContent()).toBe('');
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('play'); });
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.status)).toBe('waiting');
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.close(); }
});

it('rejects a Retry control clipped by a parent on the horizontal axis', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => { (window as any).failNextAction = true; }); await expand(page);
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; app.navigate('play'); await app.call('kingdown_create', { kind: 'friend' }, true); });
    await frame.locator('#retry').waitFor();
    expect((await frame.locator('#retry').evaluate(controlBounds)).accessible).toBe(true);
    await frame.locator('#retry').evaluate(el => {
      const clip = document.createElement('div'); clip.style.width = '1px'; clip.style.overflowX = 'hidden';
      el.parentElement!.append(clip); clip.append(el);
    });
    expect((await frame.locator('#retry').evaluate(controlBounds)).accessible).toBe(false);
  } finally { await page.close(); }
});
it('keeps the approved home wordmark at 40 px on a 360 px screen', async () => {
  const page = await open();
  try {
    await page.setViewportSize({ width: 360, height: 844 });
    expect(await page.frameLocator('iframe').locator('.wordmark').evaluate(el => getComputedStyle(el).fontSize)).toBe('40px');
  } finally { await page.close(); }
});
it('shows the server character rule beside the Free mark for a bad name', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page); await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; app.navigate('settings'); app.navigate('handle'); });
    expect(await frame.locator('#page-back').textContent()).toBe('‹ Settings');
    expect(await frame.locator('[data-screen="handle"]').textContent()).toContain('Each name is unique.');
    await frame.locator('#handle').fill('a?');
    await frame.locator('#handle-check-error').filter({ hasText: 'Use 3 to 20 characters' }).waitFor();
    expect(await frame.locator('#handle-free').isVisible()).toBe(false);
    expect(await page.evaluate(() => (window as any).harnessCalls.findLast((c: any) => c.name === 'kingdown_handle').arguments)).toEqual({ handle: 'a?', check: true });
  } finally { await page.close(); }
});
it('draws Maester swap marks through the shared board adapter', async () => {
  const page = await browser.newPage(); page.setDefaultTimeout(5000);
  await page.addInitScript(() => {
    (window as any).swapMarks = 0;
    const stroke = CanvasRenderingContext2D.prototype.stroke;
    CanvasRenderingContext2D.prototype.stroke = function(...args: any[]) {
      if (this.strokeStyle === '#7d5ba6') (window as any).swapMarks++;
      return stroke.apply(this, args as []);
    };
  });
  try {
    await page.goto(harness.url); const frame = page.frameLocator('iframe');
    await frame.locator('#home-play:not(:disabled)').waitFor();
    await expand(page);
    const seeded = await (await page.request.post(new URL('/fixture-position?case=swap', harness.url).href)).json();
    await page.evaluate(result => (window as any).harnessShow(result), seeded);
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    const point = await frame.locator('html').evaluate(async () => {
      const { board } = await new Function('return import("/src/plugin/board-view.ts")')();
      await board.ready(); return board.screenOf(27);
    });
    const pane = await page.locator('iframe').boundingBox();
    await page.mouse.click(point.x + pane!.x, point.y + pane!.y);
    await page.frames().find(f => f.url().endsWith('/board-resource'))!.waitForFunction(() => (window as any).swapMarks > 0);
  } finally { await page.close(); }
});
it('declares inline and fullscreen modes in the App handshake', async () => {
  const page = await open();
  try { expect(await page.evaluate(() => (window as any).harnessDeclaredModes)).toEqual(['inline', 'fullscreen']); }
  finally { await page.close(); }
});
it('keeps a failed mount read visible without a pending send', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp; await app.call('kingdown_create', { kind: 'friend' }); app.navigate('play');
    });
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await page.locator('#remount').click();
    await frame.locator('#error').filter({ hasText: 'Harness saved-game read failed' }).waitFor();
    expect(await frame.locator('#retry').isVisible()).toBe(true);
    expect(await frame.locator('#retry').textContent()).toBe('Try again');
  } finally { await page.close(); }
});

it.each(['end', 'friend'])('restores a saved %s route to the board when the game still plays', async screen => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } }); });
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await page.evaluate(screen => { (window as any).harnessWidgetState.privateContent.screen = screen; }, screen);
    await page.locator('#remount').click();
    await frame.locator('body[data-page="board"]').waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.status)).toBe('playing');
    expect(await frame.locator('#over.end-card').isVisible()).toBe(false);
  } finally { await page.close(); }
});

// An older build (PR 57) saved its New game screen as 'setup'. This build has no such screen, so the name reads as no
// saved screen: a fullscreen mount opens the hall. Before the fix the page showed an empty frame with Back.
it('opens the hall for a saved screen that this build does not have', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await page.evaluate(() => { (window as any).harnessWidgetState = { modelContent: {}, privateContent: { screen: 'setup', settings_back: 'setup', queued: 'setup' } }; });
    await page.locator('#remount').click();
    await frame.locator('body[data-page="play"] [data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.locator('[data-screen]:not([hidden])').evaluateAll(screens => screens.map(screen => (screen as HTMLElement).dataset.screen))).toEqual(['play']);
    expect(await frame.locator('#page-back').isVisible()).toBe(false);
    await expect.poll(() => page.evaluate(() => (window as any).harnessWidgetState.privateContent)).toMatchObject({ screen: 'play' });
    expect(await page.evaluate(() => JSON.stringify((window as any).harnessWidgetState.privateContent))).not.toContain('setup');
  } finally { await page.close(); }
});

it('keeps both sides in Moves and restores them after Remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind:'solo', colour:'white', level:'beginner', options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false} });
      const view = app.memory.view;
      await app.call('kingdown_move', {game_id:view.game_id,command_id:'history-move',expected_revision:view.revision,lan:'e2-e4'}, true);
    });
    // Wait for the computer's reply on the board, as the other tests do, not for a bare 1 s poll.
    await frame.locator('#last-move').filter({ hasText: 'Black' }).waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.turn)).toBe(0);
    await frame.locator('#moves-line').click();
    const lines = await frame.locator('#board-sheet .sheet-body p').allTextContents();
    expect(lines).toHaveLength(2); expect(lines[0]).toContain('White pawn e2 to e4.'); expect(lines[1]).toContain('Black');
    await page.keyboard.press('Escape');
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#moves-line:not(:disabled)').click();
    expect(await frame.locator('#board-sheet .sheet-body p').allTextContents()).toEqual(lines);
    expect(await frame.locator('#last-move').textContent()).toContain(lines[1].replace(/^Move \d+\. /, ''));
  } finally { await page.close(); }
});

it('closes board sheets with Escape, returns focus and returns from Settings to the game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', {kind:'solo',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}}); });
    for (const id of ['board-menu','moves-line']) {
      await frame.locator(`#${id}:not(:disabled)`).click(); await frame.locator('#board-sheet[open]').waitFor();
      await page.keyboard.press('Escape'); expect(await frame.locator('#board-sheet').isVisible()).toBe(false);
      expect(await frame.locator(`#${id}`).evaluate(e => document.activeElement === e)).toBe(true);
    }
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Settings',exact:true}).click();
    expect(await frame.locator('#page-back').textContent()).toBe('‹ Game');
    await frame.locator('#page-back').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('.page-sheet').evaluate(e => e.scrollTop)).toBe(0);
  } finally { await page.close(); }
});

it('keeps Tab inside the visible controls of the board Menu', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', {kind:'solo',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}}); });
    await frame.locator('#board-menu:not(:disabled)').click(); await frame.locator('#board-sheet[open]').waitFor();
    const controls = frame.locator('#board-sheet button:not(:disabled):visible'), first = controls.first(), last = controls.last();
    await first.focus(); await page.keyboard.press('Shift+Tab');
    expect(await last.evaluate(e => document.activeElement === e)).toBe(true);
    await page.keyboard.press('Tab');
    expect(await first.evaluate(e => document.activeElement === e)).toBe(true);
  } finally { await page.close(); }
});

it('shows a failed board read once beside Try again and restores the same game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } }); });
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    const message = 'Harness saved-game read failed';
    expect(await frame.locator('#error').textContent()).toContain(message);
    expect(await frame.getByText(message, { exact: true }).count()).toBe(1);
    expect(await frame.locator('#status').textContent()).toBe('Not current');
    expect(await frame.locator('#error').evaluate(e => e.parentElement!.contains(document.getElementById('retry')))).toBe(true);
    await frame.getByRole('button', { name: 'Try again', exact: true }).click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.close(); }
});
it('offers Try again after a failed mount read and restores the same game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', {kind:'solo',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}}); });
    const game = await page.evaluate(() => (window as any).harnessView.game_id);
    await page.evaluate(() => { (window as any).rejectNextGet = true; }); await page.locator('#remount').click();
    await frame.getByRole('button',{name:'Try again',exact:true}).waitFor();
    await frame.getByRole('button',{name:'Try again',exact:true}).click();
    await frame.locator('#retry').waitFor({state:'hidden'});
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(game);
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.close(); }
});

it.each([false,true])('shows a draw offer and handles a decline before Resign (immediate: %s)', async immediate => {
  const page = await open(), frame = page.frameLocator('iframe');
  const buddy = async (name: string, args: Record<string, unknown>) => (await page.request.post(new URL('/fixture-friend-tool',harness.url).href,{data:{name,arguments:args}})).json();
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { const app=(window as any).harnessApp; await app.start('friend',{colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}}); });
    await frame.locator('#friend-code span').first().waitFor();
    const code = (await frame.locator('#friend-code span').allTextContents()).join('');
    const joined = await buddy('kingdown_join',{code});
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get',{},false,false,true); });
    await frame.locator('#board-menu:not(:disabled)').click(); await frame.locator('#menu-draw').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Offer draw',exact:true}).click();
    await frame.locator('#context-note').filter({hasText:'Draw offered. Waiting for your opponent.'}).waitFor();
    await page.request.post(new URL('/fixture-seed',harness.url).href,{data:{actor:'alice',data:{views:{[joined._meta.view.game_id]:{outcome:{rating_before:1500,rating:1561,provisional:true,badges:[]}}}}}});
    const full=await frame.locator('html').evaluate(async()=>{return (window as any).harnessApp.client.call('kingdown_get');});
    expect(full._meta.view.outcome).toBeUndefined();
    const view = (await buddy('kingdown_get',{game_id:joined._meta.view.game_id}))._meta.view;
    await buddy('kingdown_draw',{game_id:view.game_id,command_id:'decline-offer',expected_revision:view.revision,choice:'decline'});
    if (!immediate) await frame.locator('#context-note').filter({hasText:'Draw offered.'}).waitFor({state:'hidden',timeout:7000});
    await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Resign',exact:true}).click();
    await frame.locator('[data-screen="end"]:not([hidden])').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
  } finally { await page.close(); }
});

it.each([false, true])('keeps one rematch during a held end read and cancels it on leaving %s', async leave => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind:'solo', colour:'white', options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false} }); });
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    const old = await page.evaluate(() => (window as any).harnessView.game_id);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_get'; });
    await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button', { name:'Resign', exact:true }).click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await frame.locator('#over[open]').waitFor(); await page.waitForTimeout(1100);
    await frame.locator('#over').getByRole('button', { name:'Play again', exact:true }).evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
    expect(await sent(page, 'kingdown_rematch')).toBe(0);
    if (leave) await frame.locator('#over').getByRole('button', { name:'New game', exact:true }).click();
    await page.evaluate(() => (window as any).releaseHeld());
    if (leave) { await frame.locator('[data-screen="play"]:not([hidden])').waitFor(); await frame.locator('#setup-start:not(:disabled)').waitFor(); expect(await sent(page, 'kingdown_rematch')).toBe(0); }
    else { await page.waitForFunction(old => (window as any).harnessView.game_id !== old, old); expect(await sent(page, 'kingdown_rematch')).toBe(1); }
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it.each([false, true])('opens a rematch resume only while its end screen stays active (leave %s)', async leave => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind:'solo', colour:'white', options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false} }); });
    await frame.locator('#status').filter({ hasText:'Your move' }).waitFor();
    await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button', { name:'Resign', exact:true }).click();
    await frame.locator('#over[open]').waitFor(); await page.waitForTimeout(1100);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_resume'; });
    await frame.locator('#over').getByRole('button', { name:'Play again', exact:true }).click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    if (leave) await frame.locator('#over').getByRole('button', { name:'New game', exact:true }).click();
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#reload:not(:disabled)').waitFor({state:'attached'});
    await frame.locator(`[data-screen="${leave ? 'play' : 'board'}"]:not([hidden])`).waitFor();
    expect(await frame.locator('body').getAttribute('data-page')).toBe(leave ? 'play' : 'board');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('keeps a failed end read and Retry visible on the board and on Game result', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind:'solo', colour:'white', options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false} }); });
    await frame.locator('#status').filter({ hasText:'Your move' }).waitFor();
    await page.evaluate(() => { (window as any).holdNext = (window as any).dropNextReply = 'kingdown_get'; });
    await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button', { name:'Resign', exact:true }).click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await frame.locator('#over').getByRole('button', { name:'See the board', exact:true }).click();
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('.page-sheet > .page-error #retry').waitFor();
    expect(await frame.locator('#error').isVisible()).toBe(true);
    expect(await frame.locator('#error').textContent()).not.toBe('');
    await frame.locator('#end-result').click();
    await frame.locator('#over[open] #retry').waitFor();
    expect(await frame.locator('#over #error').isVisible()).toBe(true);
    await frame.locator('#over').getByRole('button', { name:'See the board', exact:true }).click();
    await frame.locator('.page-sheet > .page-error #retry').click();
    await frame.locator('#retry').waitFor({state:'hidden'});
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#over[open]').count()).toBe(0);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it.each(['Abort', 'New game'])('opens the draft heading after %s and a held games read', async action => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.setViewportSize({width:390,height:844}); await expand(page);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      for (let i=0; i<6; i++) await app.client.call('kingdown_create', {kind:'friend',colour:'white'});
      await app.call('kingdown_create', { kind:'solo', colour:'white', level:'casual', options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false} });
    });
    await frame.locator('#status').filter({ hasText:'Your move' }).waitFor();
    if (action === 'Abort') {
      await page.evaluate(() => { (window as any).holdNext = 'kingdown_games'; });
      await frame.locator('#board-menu').click(); await frame.locator('#menu-abort').click(); await frame.locator('#board-sheet').getByRole('button', { name:'Abort', exact:true }).click();
    } else {
      await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button', { name:'Resign', exact:true }).click();
      await frame.locator('#over[open]').waitFor(); await frame.locator('#reload:not(:disabled)').waitFor({state:'attached'}); await page.waitForTimeout(1100);
      // The fresh end read has filled the games list. New game must also work with cached rows.
      await frame.locator('#over').getByRole('button', { name:'New game', exact:true }).click();
    }
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    if (action === 'Abort') { await page.waitForFunction(() => !!(window as any).releaseHeld); await page.evaluate(() => (window as any).releaseHeld()); }
    await frame.locator('#games-list [data-game-id]').nth(5).waitFor({state:'attached'});
    await expect.poll(() => frame.locator('#new-game-head').evaluate(e => Math.abs(e.getBoundingClientRect().top - e.closest('.new-game-body')!.getBoundingClientRect().top))).toBeLessThan(2);
    expect(await frame.locator('[data-screen="play"] .new-game-body').evaluate(e => e.scrollTop)).toBeGreaterThan(0);
    expect(await frame.getByRole('radio', {name:'Computer',exact:true}).isChecked()).toBe(true);
    expect(await frame.getByRole('radio', {name:'White',exact:true}).isChecked()).toBe(true);
    expect(await frame.getByRole('radio', {name:'Casual',exact:true}).isChecked()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('keeps Retry on the end card when its fresh result read fails', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind:'solo', colour:'white', options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false} }); });
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('#board-menu').click(); await frame.locator('#menu-resign').click(); await frame.locator('#board-sheet').getByRole('button', { name:'Resign', exact:true }).click();
    await frame.locator('#over[open] #retry').waitFor();
    expect(await frame.locator('#over #error').textContent()).toBe('Harness saved-game read failed');
    await frame.locator('#over #retry').click(); await frame.locator('#over #retry').waitFor({state:'hidden'});
    expect(await frame.locator('#over #error').textContent()).toBe('');
    expect(await frame.locator('html').evaluate(() => !!(window as any).harnessApp.memory.view.rules)).toBe(true);
  } finally { await page.close(); }
});

it('does not repeat a friend abort title or play a ceremony', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => {
      const app=(window as any).harnessApp; await app.call('kingdown_create',{kind:'friend',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}});
      const v=app.memory.view, next=await app.call('kingdown_abort',{game_id:v.game_id,command_id:'words-abort',expected_revision:v.revision},true); app.routeView(next);
    });
    await frame.locator('#over.end-card[open]').waitFor();
    expect(await frame.locator('#over-title').textContent()).toBe('Game aborted');
    expect(await frame.locator('#end-reason').textContent()).toBe('');
    expect(await frame.locator('#board[data-toppling], #board .kd-words, #over.is-win').count()).toBe(0);
  } finally { await page.close(); }
});

it.each([false, true])('keeps Abort confirmation and returns its game draft from seat %s', async seat => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async (_, seat) => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind: 'solo', colour: seat ? 'black' : 'white', level: 'strong', options: { fairy: true, pool: ['Q','O','L','R','B','N','A','G','M','S'], arrangement: seat, classic: false, cards: false, cardPool: ['Freeze','Haste','March','Leap'], kingPowers: seat } });
    }, seat);
    if (seat) { await frame.locator('#seat-menu').click(); await frame.locator('#seat-abort').click(); await frame.locator('#seat-abort-cancel').click(); }
    else { await frame.locator('#board-menu').click(); await frame.locator('#menu-abort').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Keep playing', exact: true }).click(); }
    expect(await frame.locator('[data-screen="play"]').isVisible()).toBe(false);
    if (seat) { await frame.locator('#seat-menu').click(); await frame.locator('#seat-abort').click(); await frame.locator('#seat-abort-confirm').click(); }
    else { await frame.locator('#board-menu').click(); await frame.locator('#menu-abort').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Abort', exact: true }).click(); }
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.getByRole('radio', { name: 'Computer', exact: true }).isChecked()).toBe(true);
    expect(await frame.getByRole('radio', { name: seat ? 'Black' : 'White', exact: true }).isChecked()).toBe(true);
    expect(await frame.getByRole('radio', { name: 'Strong', exact: true }).isChecked()).toBe(true);
    expect(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked()).toBe(seat);
    expect(await frame.getByRole('checkbox', { name: 'King powers', exact: true }).isChecked()).toBe(seat);
    expect(await frame.locator('#over[open], #board[data-toppling], #board .kd-words').count()).toBe(0);
  } finally { await page.close(); }
});

it('recovers a held move at 10 seconds and ignores its late reply', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const code = await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind: 'friend', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } });
      return (await app.client.call('kingdown_invite', { game_id: app.memory.view.game_id })).structuredContent.code;
    });
    await page.request.post(harness.url + 'fixture-friend-tool', { data: { name: 'kingdown_join', arguments: { code } } });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
    const revision = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.revision);
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    const pane = await page.locator('iframe').boundingBox();
    for (const square of [12, 28]) {
      const point = await frame.locator('html').evaluate(async (_, square) => {
        const { board } = await new Function('return import("/src/plugin/board-view.ts")')();
        await board.ready(); return board.screenOf(square);
      }, square);
      await page.mouse.click(point.x + pane!.x, point.y + pane!.y);
    }
    await frame.locator('#end-turn[aria-disabled="false"]').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    const command = await page.evaluate(() => (window as any).harnessCalls.find((c: any) => c.name === 'kingdown_move').arguments.command_id);
    await page.clock.fastForward(10_001);
    expect(await frame.locator('#retry').isVisible()).toBe(true);
    expect(await frame.locator('#retry').isEnabled()).toBe(true);
    expect(await frame.locator('#error').textContent()).toBe('Cannot connect. Check your connection, then try again.');
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.pending.args.command_id)).toBe(command);
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    const calls = await page.evaluate(() => (window as any).harnessCalls.map((c: any) => ({ name: c.name, id: c.arguments?.command_id })));
    const first = calls.findIndex((c: any) => c.id === command);
    expect(calls.slice(first).filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.id)).toEqual([command, command]);
    const recovery = calls.slice(first + 1).filter((c: any) => ['kingdown_get', 'kingdown_move'].includes(c.name)).map((c: any) => c.name);
    // Retry resends the held move with its command ID; it reads nothing first (design §5.3).
    expect(recovery).toEqual(['kingdown_move']);
    // Advance the other seat before the old revision arrives.
    const game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    const bob = await (await page.request.post(harness.url + 'fixture-friend-tool', { data: { name: 'kingdown_get', arguments: { game_id } } })).json();
    expect(bob._meta.view.revision).toBe(revision + 1);
    expect(bob._meta.view.history.actions).toEqual(['e2-e4']);
    await page.request.post(harness.url + 'fixture-friend-tool', { data: { name: 'kingdown_move', arguments: { game_id, command_id: 'bob-once', expected_revision: revision + 1, lan: 'e7-e5' } } });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect(await frame.locator('html').evaluate(() => ({ revision: (window as any).harnessApp.memory.view.revision, pending: (window as any).harnessApp.client.state.pending }))).toEqual({ revision: revision + 2, pending: undefined });
    expect(await frame.locator('#board-menu').isEnabled()).toBe(true);
  } finally { await page.close(); }
});

it('gives one offline sentence on Start and Join', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page);
    await page.context().setOffline(true); await frame.locator('#setup-start').click();
    await expect.poll(() => frame.locator('#error').textContent()).toBe('Cannot connect. Check your connection, then try again.');
    await page.context().setOffline(false);
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('join'); });
    await frame.locator('#join-code').fill('ABC123');
    await page.context().setOffline(true); await frame.locator('#join-entry button').click();
    await expect.poll(() => frame.locator('#join-message').textContent()).toBe('Cannot connect. Check your connection, then try again.');
  } finally { await page.close(); }
});

it('starts a friend game from the Play hall in three taps, with each list under its opponent', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click();
    expect([await frame.locator('#play-open').isVisible(), await frame.locator('#join-form').isVisible()]).toEqual([true, false]);
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click();
    expect([await frame.locator('#play-open').isVisible(), await frame.locator('#join-form').isVisible()]).toEqual([false, true]);
    await frame.locator('#setup-start').click(); await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    await frame.locator('#page-back').click(); await frame.locator('#games-head').click(); await frame.locator('#games-list .menu-row').first().waitFor();
    expect(await frame.locator('#games-head').isVisible()).toBe(true);
  } finally { await page.close(); }
});

it('opens a new chat game after an older foreground read ends', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } });
      await app.call('kingdown_resign', { game_id: app.memory.view.game_id }, true, false, true);
    });
    await frame.locator('#over.end-card[open]').waitFor();
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_get'; });
    await frame.locator('html').evaluate(() => { void (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    const result = await (await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } } } })).json();
    expect(result.isError).toBeFalsy();
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.evaluate(() => (window as any).releaseHeld());
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(result._meta.view.game_id);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('#over.end-card[open]').count()).toBe(0);
  } finally { await page.close(); }
});

it.each(['retry', 'remount'])('keeps the saved New game choices after a lost Play now create reply and %s', async recovery => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_settings', { last_setup: { kind: 'friend', colour: 'white', level: 'strong', king: null, options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: true } } });
    });
    await page.evaluate(() => { (window as any).dropNextReply = 'kingdown_create'; });
    await hall(page);
    await quickStart(frame);
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#setup-start').isDisabled()).toBe(true);
    expect(await frame.locator('#hall-play').count()).toBe(0);
    expect(await frame.locator('#games-start').count()).toBe(0);
    expect(await frame.getByRole('radio', { name: 'Computer', exact: true }).isChecked()).toBe(true);
    expect(await frame.getByRole('radio', { name: 'Beginner', exact: true }).isChecked()).toBe(true);
    expect(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked()).toBe(false);
    expect(await frame.locator('#setup-start').textContent()).not.toMatch(/Strong|Arrangement/);
    if (recovery === 'remount') await page.locator('#remount').click();
    // A remount of a pending with an error shows its saved words and Retry; the player taps Retry (design §5.3).
    await frame.locator('#retry:not(:disabled)').waitFor();
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // Retry resends the same command ID; the server receipt gives back one game (design §5.2).
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').length)).toBe(2);
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await page.evaluate(() => (window as any).harnessView)).toMatchObject({ kind: 'solo', level: 'beginner', options: { arrangement: false } });
    await hall(page);
    expect(await frame.getByRole('radio', { name: 'A friend', exact: true }).isChecked()).toBe(true);
    expect(await frame.locator('input[name="setup-level"][value="strong"]').isChecked()).toBe(true);
    expect(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked()).toBe(true);
    await frame.locator('#setup-start').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(async () => (await (window as any).harnessApp.client.call('kingdown_settings'))._meta.settings.last_setup.kind)).toBe('friend');
  } finally { await page.close(); }
});

it.each(['kingdown_choose', 'kingdown_get'])('shows Retry when Play now times out on %s', async name => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_settings', { last_setup: { kind: 'friend', colour: 'white', level: 'strong', king: null, options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: true } } });
    });
    // Spec J10 a: with games, the home card offers Resume and Your games (N); Play now is in the hall.
    await hall(page);
    await page.clock.install();
    await page.evaluate(name => { (window as any).holdBeforeNext = name; }, name);
    await quickStart(frame);
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    await page.clock.fastForward(10_001);
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('#retry:not(:disabled)').waitFor();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    const pending = await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending);
    expect(pending).toMatchObject({ name, screen: 'play', quick: true });
    if (name === 'kingdown_get') {
      await page.locator('#remount').click();
      await frame.locator('#retry:not(:disabled)').waitFor();
    }
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('[data-screen="seat"]').isHidden()).toBe(true);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').length)).toBe(1);
    if (name === 'kingdown_choose') expect(await page.evaluate(() => (window as any).harnessCalls.findLast((c: any) => c.name === 'kingdown_choose').arguments.command_id)).toBe(pending.args.command_id);
    await hall(page);
    expect(await frame.getByRole('radio', { name: 'A friend', exact: true }).isChecked()).toBe(true);
    expect(await frame.locator('input[name="setup-level"][value="strong"]').isChecked()).toBe(true);
    expect(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

async function friendGame(page: Page) {
  const frame = page.frameLocator('iframe');
  await expand(page);
  const code = await frame.locator('html').evaluate(async () => {
    const app = (window as any).harnessApp;
    await app.call('kingdown_create', { kind: 'friend', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } });
    return (await app.client.call('kingdown_invite', { game_id: app.memory.view.game_id })).structuredContent.code;
  });
  await page.request.post(harness.url + 'fixture-friend-tool', { data: { name: 'kingdown_join', arguments: { code } } });
  await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
}

it('keeps the board current when one poll times out', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNextGet = true; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeldGet);
    await page.clock.fastForward(10_001);
    await page.evaluate(() => (window as any).releaseHeldGet());
    await settled(page);
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get', {since_revision:app.memory.view.revision}, false, true); });
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  } finally { await page.close(); }
});

// The owner's item W6 a: after a remount, the page sends a waiting command again by itself and shows no error.
// These waits use the page's set wait (5 s), as each waitForFunction here does; a 1 s poll failed on the slower CI runner.
const resent = (page: Page) => page.waitForFunction(() => ((window as any).harnessWidgetState?.privateContent?.pending ?? null) === null);
const sentTimes = (page: Page, name: string, times: number) => page.waitForFunction(([name, times]) => (window as any).harnessCalls.filter((c: any) => c.name === name).length === times, [name, times] as const);
it('sends a waiting move again by itself after a remount, with no error, and saves one move', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'remount-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.locator('#remount').click();
    await sentTimes(page, 'kingdown_move', 2);
    await resent(page);
    expect([await frame.locator('#error').textContent(), await frame.locator('#retry').isHidden()]).toEqual(['', true]);
    await page.evaluate(() => (window as any).releaseHeld());
    const game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    const bob = await (await page.request.post(harness.url + 'fixture-friend-tool', { data: { name: 'kingdown_get', arguments: { game_id } } })).json();
    expect(bob._meta.view.history.actions).toEqual(['e2-e4']);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.command_id))).toEqual(['remount-move', 'remount-move']);
  } finally { await page.close(); }
});

// The owner's item W6 a: the button says Start game again while the error and Retry show.
it('shows the line and Retry after a remount only when the second send of a waiting move fails', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'resend-fails', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.evaluate(() => { (window as any).rejectNextMove = 'UNAVAILABLE'; });
    await page.locator('#remount').click();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('Harness definitive rejection');
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.command_id))).toEqual(['resend-fails', 'resend-fails', 'resend-fails']);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

// The server refuses a Find on your own open game after its last start receipt with RATE_LIMITED; Retry cannot change that.
it('ends a command that the server refuses as RATE_LIMITED, with its words and no Retry', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).rejectNextMove = 'RATE_LIMITED'; });
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'limited-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    expect([await frame.locator('#error').textContent(), await frame.locator('#retry').isHidden()]).toEqual(['Harness definitive rejection', true]);
    expect(await page.evaluate(() => (window as any).harnessWidgetState?.privateContent?.pending ?? null)).toBeNull();
  } finally { await page.close(); }
});

it('shows a neutral Start game beside the connection line when a slow start times out', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page);
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    await frame.locator('#setup-start').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(10_001);
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('Cannot connect. Check your connection, then try again.');
    expect([await frame.locator('#setup-start').textContent(), await frame.locator('#setup-start').getAttribute('aria-busy')]).toEqual(['Start game', 'false']);
    await page.evaluate(() => (window as any).releaseHeld());
  } finally { await page.close(); }
});

it('starts no game when the player leaves the hall while a slow start still saves the setup', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page);
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_settings'; });
    await frame.locator('#setup-start').click();
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    // After 5 s the hall exits are free, and no Create has gone out yet.
    await page.clock.fastForward(5_001);
    await frame.locator('[data-screen="play"] [data-nav="profile"]:not(:disabled)').click();
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).releaseBefore());
    await frame.locator('#page-back:not([data-free])').waitFor({ state: 'attached' });
    expect(await sent(page, 'kingdown_create')).toBe(0);
    expect(await frame.locator('body').getAttribute('data-page')).toBe('profile');
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

it('shows the connection sentence with no error name on Settings', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page); await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('settings'); });
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_settings'; });
    await frame.locator('#symbols-only').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(10_001);
    await expect.poll(() => frame.locator('#error').textContent()).toBe('Cannot connect. Check your connection, then try again.');
    await page.evaluate(() => (window as any).releaseHeld());
  } finally { await page.close(); }
});

it.each(['kingdown_settings', 'kingdown_get', 'kingdown_games'])('lets the mount %s read wait past 10 seconds', async held => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    if (held === 'kingdown_get') await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white' }); });
    const expected = await page.evaluate(() => ({ game: (window as any).harnessView?.game_id, revision: (window as any).harnessView?.revision }));
    const listed = await (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name: 'kingdown_games', arguments: {} } })).json();
    await page.clock.install();
    await page.evaluate(name => { (window as any).holdNext = name; }, held);
    await page.locator('#remount').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(20_000);
    expect(await frame.locator('html').evaluate(() => ({ mounting: (window as any).harnessApp.queue.mounting(), reads: (window as any).harnessApp.client.inflight }))).toEqual({ mounting: true, reads: 1 });
    expect(await frame.locator('#home-play').isDisabled()).toBe(true);
    expect(await frame.locator('#setup-start').isDisabled()).toBe(true);
    expect(await frame.locator('#home-error').textContent()).toBe('');
    expect(await frame.locator('#error').textContent()).toBe('');
    if (held === 'kingdown_games') expect(await frame.locator('#games-status').textContent()).toBe('Loading games…');
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#home-play:not(:disabled)').waitFor();
    await settled(page);
    expect(await frame.locator('#home-error').textContent()).toBe('');
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#games-status').textContent()).toBe('');
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.games.map((g: any) => g.game_id))).toEqual(listed._meta.games.map((g: any) => g.game_id));
    if (held === 'kingdown_get') expect(await frame.locator('html').evaluate(() => ({ game: (window as any).harnessApp.memory.view?.game_id, revision: (window as any).harnessApp.memory.view?.revision }))).toEqual(expected);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

// Round 5 helpers: a player opens New game against a friend; the count of calls sent with one name.
async function newGame(page: Page, opponent = 'A friend') {
  const frame = page.frameLocator('iframe');
  await hall(page);
  await frame.getByRole('radio', { name: opponent, exact: true }).locator('..').click();
}
const sent = (page: Page, name: string) => page.evaluate(name => (window as any).harnessCalls.filter((c: any) => c.name === name).length, name);

it('makes one game when Retry resends a Create that the server has not run yet', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await newGame(page);
    const since = Date.now();
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_create'; });
    await frame.locator('#setup-start').click();
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    await page.clock.fastForward(10_001);
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    const first = page.waitForResponse(response => response.url().endsWith('/fixture-tool') && response.request().postDataJSON()?.name === 'kingdown_create');
    await page.evaluate(() => (window as any).releaseBefore());
    await first;
    const ids = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').map((c: any) => c.arguments.command_id));
    expect(ids).toHaveLength(2); expect(ids[1]).toBe(ids[0]);
    const games = (await (await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_games', arguments: {} } })).json())._meta.games;
    expect(games.filter((game: any) => game.kind === 'friend' && Date.parse(game.created_at) >= since)).toHaveLength(1);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

// The device clock and the server clock differ. Retry sends the same Create command ID again; the receipt gives back
// the one game (R11). The clock compare is gone (design §5.2).
it('makes one game when Retry resends a timed-out Create and the device clock is ahead of or behind the server', async () => {
  for (const offset of [60_000, -60_000]) {
    const page = await open(), frame = page.frameLocator('iframe');
    try {
      await newGame(page);
      const before = (await (await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_games', arguments: {} } })).json())._meta.games.map((game: any) => game.game_id);
      await page.clock.install({ time: Date.now() + offset });
      await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
      await frame.locator('#setup-start').click();
      await page.waitForFunction(() => !!(window as any).releaseHeld);
      const made = await page.evaluate(() => (window as any).harnessView.game_id);
      await page.clock.fastForward(10_001);
      await frame.locator('#retry').click();
      await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
      const calls = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').map((c: any) => c.arguments));
      expect(calls).toHaveLength(2);
      expect(calls[0].command_id).toMatch(/^[0-9a-f]{32}$/);
      expect(calls[1]).toEqual(calls[0]);
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(made);
      const after = (await (await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_games', arguments: {} } })).json())._meta.games;
      expect(after.filter((game: any) => !before.includes(game.game_id)).map((game: any) => game.game_id)).toEqual([made]);
    } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
  }
});

// A lost Start reply, then a remount. The start receipt is the recovery: the remount sends nothing and shows the saved
// words with Retry; Retry sends the same command ID, and the receipt gives back the first game. The device clock no
// longer matters (design §5.2/§5.3).
it('makes one game after a lost Start reply and a remount, with the device clock forward or back', async () => {
  for (const step of [300, -60_000]) {
    const page = await open(), frame = page.frameLocator('iframe');
    try {
      await newGame(page);
      const since = Date.now();
      await page.clock.install();
      await page.evaluate(() => { (window as any).dropNextReply = 'kingdown_create'; });
      await frame.locator('#setup-start').click(); await frame.locator('#retry').waitFor();
      const made = await page.evaluate(() => (window as any).harnessView.game_id);
      if (step > 0) await page.clock.fastForward(step); else await page.clock.setSystemTime(await page.evaluate(() => Date.now()) + step);
      await page.locator('#remount').click();
      // A pending with an error shows its saved words and Retry; the remount sends nothing by itself (design §5.3).
      await frame.locator('#retry:not(:disabled)').waitFor();
      expect([await frame.locator('#error').textContent(), await sent(page, 'kingdown_create')], `step ${step}`).toEqual(['Harness lost reply after commit', 1]);
      await frame.locator('#retry').click();
      await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
      const ids = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').map((c: any) => c.arguments.command_id));
      expect(ids, `step ${step}`).toEqual([ids[0], ids[0]]);
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(made);
      expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
      const games = (await (await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_games', arguments: {} } })).json())._meta.games;
      expect(games.filter((game: any) => game.kind === 'friend' && Date.parse(game.created_at) >= since)).toHaveLength(1);
    } finally { await page.close(); }
  }
});

// Round 5: each failed command keeps its error and Retry on the screen where it started.
const CANNOT_CONNECT = 'Cannot connect. Check your connection, then try again.';

it('sends a waiting move again after an inline remount, so the board shows no error later', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'inline-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // An inline remount keeps the board behind the home card without a request.
    await page.evaluate(() => { const host = window as any; host.harnessHostContext = { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }; host.harnessDisplayMode = 'inline'; });
    const settings = await sent(page, 'kingdown_settings');
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, settings);
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('[data-screen="board"]').isHidden()).toBe(true);
    await sentTimes(page, 'kingdown_move', 2);
    await resent(page);
    // Later the player opens the board in fullscreen.
    await expand(page); await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('board'); });
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect([await frame.locator('#error').textContent(), await frame.locator('#retry').isHidden()]).toEqual(['', true]);
    await page.evaluate(() => (window as any).releaseHeld());
    const game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    const bob = await (await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_get', arguments: { game_id } } })).json();
    expect(bob._meta.view.history.actions).toEqual(['e2-e4']);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.command_id))).toEqual(['inline-move', 'inline-move']);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('keeps a timed-out start and its Retry on New game when the player leaves at the wait line', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await newGame(page);
    await page.clock.install({ time: new Date(0) });
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    await frame.locator('#setup-start').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(5_001);
    await frame.locator('[data-screen="play"] [data-nav="settings"]').click();
    await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    // The 10 s command limit ends the Create while the player is on Settings.
    await page.clock.fastForward(5_000);
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    await frame.locator('#page-back').click();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    expect(await frame.locator('#setup-start').textContent()).toBe('Create invite');
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    // Retry resends the same command ID; the receipt gives back one game (design §5.2).
    expect(await sent(page, 'kingdown_create')).toBe(2);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

// A failed start keeps its text and Retry on Play only; another game plays and is free (fault b).
it('keeps a timed-out start on Play and finishes it there while another game plays', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    const friend = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('play'));
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    await frame.locator('#setup-start').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // The 10 s client limit ends the start; its error stays on Play.
    await page.clock.fastForward(10_001);
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    // The player opens another game: its board plays, with no start text.
    await frame.locator('#saved-games').evaluate(el => { (el as HTMLDetailsElement).open = true; });
    await frame.locator(`#games-list [data-game-id="${friend}"]:not(:disabled)`).click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    expect(await frame.locator('#board-menu').isEnabled()).toBe(true);
    // Play keeps the start's text and Retry; Retry sends the same command ID and finishes the start.
    await frame.locator('#page-back').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await expect.poll(() => frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).not.toBe(friend);
    const ids = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create' && c.arguments.command_id).map((c: any) => c.arguments.command_id));
    expect(ids).toHaveLength(2); expect(ids[1]).toBe(ids[0]);
    await expect.poll(() => frame.locator('#error').textContent()).toBe('');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('frees Start on New game after an inline remount sends the waiting move again', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'setup-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.evaluate(() => { const host = window as any; host.harnessHostContext = { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }; host.harnessDisplayMode = 'inline'; });
    const settings = await sent(page, 'kingdown_settings');
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, settings);
    await sentTimes(page, 'kingdown_move', 2);
    await resent(page);
    await hall(page);
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('#setup-start:not(:disabled)').waitFor();
    expect([await frame.locator('#error').textContent(), await frame.locator('#retry').isHidden()]).toEqual(['', true]);
    await page.evaluate(() => (window as any).releaseHeld());
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.command_id))).toEqual(['setup-move', 'setup-move']);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('shows the name reason and Retry on New game after Back from the name page, and sends nothing', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await newGame(page);
    await page.clock.install();
    await page.evaluate(() => { (window as any).requireHandleNext = true; });
    await frame.locator('#setup-start').click();
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    await frame.locator('#page-back').click();
    await page.clock.fastForward(6_000);
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('Pick a name and picture first.');
    expect(await frame.locator('#setup-start').textContent()).toBe('Create invite');
    expect(await sent(page, 'kingdown_create')).toBe(1);
    // Retry sends the start again; here the player has a name now.
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect(await sent(page, 'kingdown_create')).toBe(2);
  } finally { await page.close(); }
});

it('sends no start by itself after a remount on the name page and Back', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await newGame(page);
    await page.evaluate(() => { (window as any).requireHandleNext = true; });
    await frame.locator('#setup-start').click();
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    const settings = await sent(page, 'kingdown_settings');
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, settings);
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    await frame.locator('#page-back:not(:disabled)').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('Pick a name and picture first.');
    expect(await sent(page, 'kingdown_create')).toBe(1);
  } finally { await page.close(); }
});

it('keeps a move in flight free of errors when a chat result arrives during it', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    const current = await page.evaluate(() => ({ game_id: (window as any).harnessView.game_id, board_id: (window as any).harnessWidgetState.privateContent.board_id }));
    const result = await (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name: 'kingdown_open', arguments: { game_id: current.game_id } } })).json();
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent.game_id).toBe(current.game_id);
    expect(result.structuredContent).not.toHaveProperty('board_id');
    expect(result._meta.board_id).toEqual(expect.any(String));
    expect(result._meta.board_id).not.toBe(current.board_id);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'busy-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // The chat result opens Board, then waits for the move before it reads. It shows no error or Retry during that wait.
    const before = await sent(page, 'kingdown_get');
    const writes = await page.evaluate(() => (window as any).harnessWidgetStates.length);
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await page.waitForFunction(n => (window as any).harnessWidgetStates.length > n, writes);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.board_id)).toBe(result._meta.board_id);
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    expect(await frame.locator('#error').textContent()).toBe('');
    await page.evaluate(() => (window as any).releaseHeld());
    await expect.poll(() => page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    expect(await sent(page, 'kingdown_get')).toBeGreaterThan(before);
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('opens the game of a chat result while the end screen of the last game still reads', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    const old = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_abort', arguments: { game_id: old } } });
    // A poll reads the abort and opens the end screen; the end screen then reads the full game, and the host holds that reply.
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true, true);
      parent.postMessage({ harness: 'set', values: { holdNext: 'kingdown_get' } }, '*');
    });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await frame.locator('[data-screen="end"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessCalls.at(-1))).toMatchObject({ name: 'kingdown_get', arguments: { board_id: expect.any(String) } });
    const solo = await (await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_create', arguments: { kind: 'solo', colour: 'black', level: 'beginner', options: { fairy: true, pool: ['R','B','N','G'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false } } } })).json();
    expect(solo.isError).toBeFalsy();
    // The chat result for the new game selects it and reads it while the old game's read still waits.
    await frame.locator('html').evaluate(() => { const client = (window as any).harnessApp.client, call = client.call; client.call = async (...args: any[]) => { const result = await call(...args); if (args[0] === 'kingdown_open') (window as any).resumed = true; return result; }; });
    const { screen, ...summary } = solo.structuredContent;
    await page.evaluate(result => (window as any).harnessShow(result, true), { ...solo, structuredContent: summary });
    await frame.locator('html').evaluate(() => new Promise<void>(resolve => { const check = () => setTimeout((window as any).resumed ? resolve : check, 10); check(); }));
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(solo._meta.view.game_id);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('keeps two failed polls silent, resets the count on a good read, and locks after three failures', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    // White, this player, moves next: the timed poll waits 30 s, so only the reads below run.
    await friendGame(page);
    for (let n = 0; n < 4; n++) await frame.locator('#board').press('ArrowRight');
    await frame.locator('#board').press('ArrowUp'); await frame.locator('#board').press('Enter');
    expect(await frame.locator('#choices button').count()).toBe(2);
    const poll = () => frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true); });
    await page.context().setOffline(true);
    for (let n = 0; n < 2; n++) {
      await poll();
      expect(await frame.locator('#status').textContent()).toBe('White Pawn.');
      expect(await frame.locator('#choices button').count()).toBe(2);
      expect(await frame.locator('#error').textContent()).toBe('');
      expect(await frame.locator('#retry').isVisible()).toBe(false);
    }
    await page.context().setOffline(false); await poll();
    await page.context().setOffline(true);
    await poll(); await poll();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    await poll();
    await frame.locator('#status').filter({hasText:'Not current'}).waitFor();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    expect(await frame.locator('#retry').isVisible()).toBe(true);
    await page.context().setOffline(false);
    await poll();
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
  } finally { await page.context().setOffline(false); await page.close(); }
});

// Design §4: a poll reply never sets a refusal. The server's definitive words for a poll are a stale read, so the
// board's words stay readable and Try again shows. Only a user command gives a refusal.
it('marks the board stale when the server refuses a poll, and sets no refusal', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    const poll = () => frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true); });
    await page.evaluate(() => { (window as any).rejectNextAction = { name: 'kingdown_get', code: 'MATCH_REMOVED', text: 'This game was deleted. Start, resume or join another game.' }; });
    await poll();
    expect([await frame.locator('#error').textContent(), await frame.locator('#status').textContent(), await frame.locator('#retry').textContent(), await frame.locator('#retry').isVisible()]).toEqual(['This game was deleted. Start, resume or join another game.', 'Not current', 'Try again', true]);
  } finally { await page.close(); }
});

it('clears Try again and its sentence on the first good poll after a failed read and failed polls', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    const poll = () => frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true); });
    await page.context().setOffline(true);
    // Menu > Reload fails: Try again shows with the sentence. Three polls fail; then the connection comes back.
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    expect(await frame.locator('#retry').textContent()).toBe('Try again');
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    await poll(); await poll(); await poll();
    await page.context().setOffline(false);
    await poll();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await frame.locator('#error').textContent()).toBe('');
  } finally { await page.context().setOffline(false); await page.close(); }
});

it.each(['a join error', 'a game'])('lets the reads for a chat result with %s wait past 10 seconds', async shown => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const game_id = shown === 'a game' ? await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_create', { kind: 'solo', colour: 'white' }); return app.memory.view.game_id; }) : undefined;
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_open'; });
    await page.evaluate(game_id => (window as any).harnessShow(game_id ? { content: [], structuredContent: { screen: 'board', game_id } } : { isError: true, content: [{ type: 'text', text: 'Invitation expired or used' }], _meta: { code: 'INVITE_UNAVAILABLE' } }), game_id);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(20_000);
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#page-back:not(:disabled)').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#home-error').textContent()).toBe('');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('opens the Your games list at the top from the chat Play action', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.setViewportSize({ width: 393, height: 600 });
    await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white' } } });
    // The host opens the chat Play route fullscreen.
    await expand(page);
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'play' } }));
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests ?? [])).toEqual([]);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.screen)).toBe('play');
    const [head, body] = await Promise.all([frame.locator('#games-head').boundingBox(), frame.locator('[data-screen="play"] .new-game-body').boundingBox()]);
    expect(Math.abs(head!.y - body!.y)).toBeLessThan(24);
  } finally { await page.close(); }
});

it.each(['timeout', 'remount'])('retries Play now with the same command ID after a %s, with one game and no seat screen', async failure => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_settings', { last_setup: { kind: 'friend', colour: 'white', level: 'strong', king: null, options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: true } } });
    });
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_create'; });
    await hall(page);
    await quickStart(frame);
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    if (failure === 'timeout') {
      await page.clock.fastForward(10_001);
      await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
      await frame.locator('#retry:not(:disabled)').waitFor();
      expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
      expect(await frame.locator('#setup-start').isDisabled()).toBe(true);
      expect(await frame.getByRole('radio', { name: 'Beginner', exact: true }).isChecked()).toBe(true);
      expect(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked()).toBe(false);
      await frame.locator('#retry').click();
    } else await page.locator('#remount').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('[data-screen="seat"]').isHidden()).toBe(true);
    // W6 a: a remount sends the waiting Create again by itself, so no error or Retry shows.
    if (failure === 'remount') expect([await frame.locator('#error').textContent(), await frame.locator('#retry').isHidden()]).toEqual(['', true]);
    const first = page.waitForResponse(response => response.url().endsWith('/fixture-tool') && response.request().postDataJSON()?.name === 'kingdown_create');
    await page.evaluate(() => (window as any).releaseBefore()); await first;
    const ids = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').map((c: any) => c.arguments.command_id));
    expect(ids).toHaveLength(2); expect(ids[0]).toMatch(/^[0-9a-f]{32}$/); expect(ids[1]).toBe(ids[0]);
    const game = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(game);
    const games = (await (await page.request.post(harness.url + 'fixture-tool', { data: { name: 'kingdown_games', arguments: {} } })).json())._meta.games;
    expect(games.filter((entry: any) => entry.game_id === game)).toHaveLength(1);
    await hall(page);
    expect(await frame.getByRole('radio', { name: 'A friend', exact: true }).isChecked()).toBe(true);
    expect(await frame.locator('input[name="setup-level"][value="strong"]').isChecked()).toBe(true);
    expect(await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).isChecked()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

it('clears a failed read when Your games resumes a different solo board', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const first = await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp, args = {kind:'solo',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}};
      const first = await app.call('kingdown_create', args);
      await app.call('kingdown_create', args); return first.game_id;
    });
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    await frame.locator('#status').filter({hasText:'Not current'}).waitFor();
    await frame.locator('html').evaluate(async (_, game_id) => {
      const app = (window as any).harnessApp;
      app.navigate('play'); const next = await app.call('kingdown_resume', {game_id}, false, false, false); app.routeView(next);
    }, first);
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await frame.locator('#error').textContent()).toBe('');
    for (let n = 0; n < 4; n++) await frame.locator('#board').press('ArrowRight');
    await frame.locator('#board').press('ArrowUp'); await frame.locator('#board').press('Enter');
    expect(await frame.locator('#choices button').count()).toBe(2);
  } finally { await page.close(); }
});

it.each(['offer', 'accept', 'decline'])('disables the end card %s action after a failed read and restores it on recovery', async choice => {
  const page = await open(), frame = page.frameLocator('iframe'), label = choice === 'offer' ? 'Rematch' : choice === 'accept' ? 'Accept' : 'Decline';
  try {
    await friendGame(page);
    const game_id = await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp, v = app.memory.view;
      await app.call('kingdown_resign', {game_id:v.game_id,command_id:'end-read-lock',expected_revision:v.revision}, true); return v.game_id;
    });
    await frame.locator('#over.end-card[open]').waitFor();
    // C4 c: the end card ignores taps for 1 s after a live end.
    await page.waitForTimeout(1100);
    if (choice !== 'offer') {
      const other = (await (await page.request.post(new URL('/fixture-friend-tool',harness.url).href,{data:{name:'kingdown_get',arguments:{game_id}}})).json())._meta.view;
      await page.request.post(new URL('/fixture-friend-tool',harness.url).href,{data:{name:'kingdown_rematch',arguments:{game_id,command_id:'end-read-reply',expected_revision:other.revision,choice:'offer'}}});
      await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    }
    await frame.locator('#over').getByRole('button',{name:label,exact:true}).waitFor();
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    const action = frame.locator('#over').getByRole('button',{name:label,exact:true});
    await expect.poll(() => action.isDisabled()).toBe(true);
    const calls = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_rematch').length);
    await action.evaluate(b => b.click());
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_rematch').length)).toBe(calls);
    await frame.locator('#retry').click();
    await expect.poll(() => action.isEnabled()).toBe(true); await action.click();
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_rematch').length)).toBe(calls + 1);
  } finally { await page.close(); }
});

it('sends the end card Rematch while a failed start keeps its error for Play', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    // A start fails: its error and Retry belong to Play, and the pending command stays.
    await page.evaluate(() => { (window as any).failNextAction = true; });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } }, true); });
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.pending?.error)).toBeTruthy();
    // The opponent resigns, and the poll opens End.
    const game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    const other = (await (await page.request.post(new URL('/fixture-friend-tool',harness.url).href,{data:{name:'kingdown_get',arguments:{game_id}}})).json())._meta.view;
    await page.request.post(new URL('/fixture-friend-tool',harness.url).href,{data:{name:'kingdown_resign',arguments:{game_id,command_id:'end-other-pending',expected_revision:other.revision}}});
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true, true); });
    await frame.locator('#over.end-card[open]').waitFor();
    // C4 c: the end card ignores taps for 1 s after a live end.
    await page.waitForTimeout(1100);
    await frame.locator('#over').getByRole('button',{name:'Rematch',exact:true}).click();
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_rematch').length)).toBe(1);
  } finally { await page.close(); }
});

it.each(['power-w', 'card-w-0'])('keeps focus on %s through a minute tick and updates actions at the deadline', async id => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page); await page.clock.install();
    await page.evaluate(id => {
      const host = window as any, now = Date.now();
      const rules = id === 'power-w' ? {kings:[{king:'Flame',power:'Haste'},null],hands:[[],[]]} : {kings:[{king:'Mud',power:'March'},null],marchUses:0,hands:[['Haste'],[]]};
      host.harnessNextView = {...host.harnessView, kind:'solo', server_now:new Date(now).toISOString(), deadline_at:new Date(now + 180000).toISOString(), rules:{...host.harnessView.rules,...rules}};
    }, id);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    await frame.locator(`#${id}`).focus();
    expect(await frame.locator('#move-time-left').textContent()).toBe('3 min left');
    await page.clock.fastForward(60000);
    expect(await frame.locator('#move-time-left').textContent()).toBe('2 min left');
    expect(await frame.locator(`#${id}`).evaluate(b => document.activeElement === b)).toBe(true);
    await page.keyboard.press('Enter');
    await frame.locator('#board-sheet[open] h2').filter({hasText:id === 'power-w' ? 'Flame King' : 'Haste'}).waitFor();
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      const host = window as any, now = Date.now();
      host.harnessNextView = {...host.harnessView,kind:'friend',turn:1,action:'wait',legal:[],abort_open:false,server_now:new Date(now).toISOString(),deadline_at:new Date(now + 60000).toISOString()};
    });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    await page.context().setOffline(true);
    await page.clock.fastForward(60001);
    expect(await frame.locator('#move-time-left').textContent()).toBe('Time is up');
    expect(await frame.locator('#claim').textContent()).toBe('Claim the win');
  } finally { await page.context().setOffline(false); await page.close(); }
});

it('keeps focus on a power coin through a presence update (an equal-revision poll reply)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => {
      const host = window as any, rules = { kings: [{ king: 'Flame', power: 'Haste' }, null], hands: [[], []] };
      host.harnessNextView = { ...host.harnessView, kind: 'solo', rules: { ...host.harnessView.rules, ...rules } };
    });
    // A full read draws the power coin; then a poll reply at the same revision changes only opponent and server_now.
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    await frame.locator('#power-w').waitFor();
    await frame.locator('#power-w').focus();
    expect(await frame.locator('#power-w').evaluate(b => document.activeElement === b)).toBe(true);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true, true);
    });
    await settled(page);
    // The coin row is not rebuilt, so the keyboard focus stays on the coin (design §3.4, OD A1389).
    expect(await frame.locator('#power-w').evaluate(b => document.activeElement === b)).toBe(true);
  } finally { await page.close(); }
});

it('keeps a lost command through a poll reply that the server refuses', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    const game = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id as string);
    await page.evaluate(() => { (window as any).dropNextMoveReply = true; });
    await frame.locator('html').evaluate(async (_, game_id) => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_move', { game_id, command_id: 'poll-keeps-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true);
    }, game);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toMatchObject({ name: 'kingdown_move', game_tag: game.slice(0, 8) });
    // The server refuses the next poll with a definitive code. A read never clears `pending` (design §4).
    await page.evaluate(() => { (window as any).rejectNextAction = { name: 'kingdown_get', code: 'MATCH_REMOVED', text: 'This game was deleted. Start, resume or join another game.' }; });
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true, true); });
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toMatchObject({ name: 'kingdown_move', game_tag: game.slice(0, 8) });
    // The refused poll never shows its own text: the lost command keeps the line and its Retry (design §3.2 and §4).
    expect(await frame.locator('#error').textContent()).toBe('Harness lost reply after commit');
    expect(await frame.locator('#retry').textContent()).toBe('Retry');
    // The refused read still marks the board stale, with "Not current".
    expect(await frame.locator('#status').textContent()).toBe('Not current');
  } finally { await page.close(); }
});

it('keeps a programmatic write refusal out of the line, while a user command shows its own', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    const game = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id as string);
    // The board's own ask to move the computer is a programmatic write (`user` false): its refusal clears `pending`
    // and stays silent, as before S2 (design §2 and §4).
    await page.evaluate(() => { (window as any).rejectNextAction = { name: 'kingdown_computer', code: 'MATCH_TERMINAL', text: 'This game already ended.' }; });
    await frame.locator('html').evaluate(async (_, game_id) => {
      const app = (window as any).harnessApp, view = app.memory.view;
      await app.call('kingdown_computer', { game_id, command_id: 'program-refusal', expected_revision: view.revision }, true, false, undefined, false, undefined, false);
    }, game);
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    // A user command's refusal becomes the one notice: its words, no Retry (design §2 and §3.2).
    await page.evaluate(() => { (window as any).rejectNextAction = { name: 'kingdown_abort', code: 'MATCH_TERMINAL', text: 'This game already ended.' }; });
    await frame.locator('html').evaluate(async (_, game_id) => {
      const app = (window as any).harnessApp, view = app.memory.view;
      await app.call('kingdown_abort', { game_id, command_id: 'user-refusal', expected_revision: view.revision }, true);
    }, game);
    expect(await frame.locator('#error').textContent()).toBe('This game already ended.');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
  } finally { await page.close(); }
});

it('keeps a failed read board locked until a good read, and offers Try again after a failed remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', {kind:'solo',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}}); });
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    const before = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.fen);
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    await frame.locator('#status').filter({hasText:'Not current'}).waitFor();
    expect(await frame.locator('#board canvas').isVisible()).toBe(true);
    expect(await frame.locator('#retry').innerText()).toBe('Try again');
    for (let n = 0; n < 4; n++) await frame.locator('#board').press('ArrowRight');
    await frame.locator('#board').press('ArrowUp');
    await frame.locator('#board').press('Enter');
    expect(await frame.locator('#choices button').count()).toBe(0);
    expect(await frame.locator('#status').innerText()).toBe('Not current');
    const moves = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').length);
    await frame.locator('#board').press('ArrowUp'); await frame.locator('#board').press('ArrowUp');
    await frame.locator('#board').press('Enter');
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').length)).toBe(moves);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.fen)).toBe(before);
    await frame.locator('#board-menu').click();
    expect(await frame.locator('#menu-resign').isDisabled()).toBe(true);
    expect(await frame.locator('#menu-abort').isDisabled()).toBe(true);
    const sends = await page.evaluate(() => (window as any).harnessCalls.length);
    await frame.locator('#menu-resign').evaluate(b => b.click());
    expect(await page.evaluate(() => (window as any).harnessCalls.length)).toBe(sends);
    await page.keyboard.press('Escape');
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.fen)).toBe(before);
    await frame.locator('#retry').click();
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    await frame.locator('#board-menu').click();
    expect(await frame.locator('#menu-resign').isEnabled()).toBe(true);
    await page.keyboard.press('Escape');
    await frame.locator('#board').press('ArrowDown'); await frame.locator('#board').press('ArrowDown');
    await frame.locator('#board').press('Enter');
    expect(await frame.locator('#choices button').count()).toBe(2);
    await frame.locator('#board').press('ArrowUp'); await frame.locator('#board').press('ArrowUp');
    await frame.locator('#board').press('Enter');
    await frame.locator('#end-turn[aria-disabled="false"]').click();
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').length)).toBeGreaterThan(moves);
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.fen)).not.toBe(before);
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await page.locator('#remount').click();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#game-table').getAttribute('data-empty')).toBe('true');
    expect(await frame.locator('#status').innerText()).toBe('Not current');
    await frame.locator('#retry').click();
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  } finally { await page.close(); }
});

it('lets the board read for a chat result with a game wait past 10 seconds', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    const game_id = await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_create', { kind: 'solo', colour: 'white' }); return app.memory.view.game_id; });
    await page.clock.install();
    // holdBeforeNext takes the next call that starts, so a poll read that is already on its way is not held.
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_get'; });
    await page.evaluate(game_id => (window as any).harnessShow({ content: [], structuredContent: { screen: 'board', game_id } }), game_id);
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    await page.clock.fastForward(20_000);
    await page.evaluate(() => (window as any).releaseBefore());
    await frame.locator('#page-back:not(:disabled)').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

it.each([true, false])('keeps a saved setting when the first settings reply comes late (new result has settings: %s)', async carriesSettings => {
  const page = await open(), frame = page.frameLocator('iframe');
  const tool = async (name: string, args: Record<string, unknown> = {}) => (await page.request.post(new URL('/fixture-tool', harness.url).href, { data: { name, arguments: args } })).json();
  try {
    await tool('kingdown_settings', { symbols_only: false });
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_settings'; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    const chat = await tool('kingdown_open', { screen: 'play' });
    if (!carriesSettings) delete chat._meta.settings;
    await page.evaluate(result => (window as any).harnessShow(result), chat);
    await frame.locator('#home-play:not(:disabled)').waitFor({ state: 'attached' });
    await expand(page);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('settings'));
    await frame.locator('#symbols-only:not(:disabled)').check();
    await frame.locator('#symbols-only:not(:disabled)').waitFor();
    expect((await tool('kingdown_settings'))._meta.settings.symbols_only).toBe(true);
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect(await frame.locator('#symbols-only').isChecked()).toBe(true);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.settings.symbols_only)).toBe(true);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.me)).toMatchObject({ handle: expect.any(String) });
    expect((await tool('kingdown_settings'))._meta.settings.symbols_only).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await tool('kingdown_settings', { symbols_only: false }); await page.close(); }
});

it('shows the pitch and one start, hides empty saved games, and names a friend invite', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    expect(await frame.getByText('Chess, the way it was never meant to be played.', { exact: true }).isVisible()).toBe(true);
    expect(await frame.locator('#home-line').isHidden()).toBe(true);
    await frame.locator('#home-games').click();
    expect(await frame.locator('#saved-games').isHidden()).toBe(true);
    expect(await frame.locator('#hall-play, #games-start').count()).toBe(0);
    expect(await frame.locator('#setup-start').innerText()).toBe('Start game');
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click();
    expect(await frame.locator('#setup-start').innerText()).toBe('Create invite');
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await frame.getByRole('checkbox', { name: 'Arrangement', exact: true }).locator('..').click();
    await frame.locator('#setup-start').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await hall(page);
    await frame.locator('#saved-games:not([hidden])').waitFor();
    expect(await frame.locator('#saved-games').isVisible()).toBe(true);
    expect(await frame.locator('#saved-games').getAttribute('open')).toBeNull();
    await frame.locator('#games-head').click();
    expect(await frame.locator('#games-list button').first().isVisible()).toBe(true);
  } finally { await page.close(); await isolated.close(); }
});
it('shows one action in an empty open-games list and starts the search', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('lobby'));
    await frame.locator('#lobby-empty:not([hidden])').waitFor();
    expect(await frame.locator('#lobby-empty').innerText()).toBe('No open games yet.');
    expect(await frame.locator('[data-screen="lobby"] button:visible').allInnerTexts()).toEqual(['Find an opponent']);
    await frame.locator('#find-opponent:not(:disabled)').click();
    await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
  } finally { await page.close(); await isolated.close(); }
});
it('shows the game count, resumes a person first, and opens the hall without a new game', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    const person = crypto.randomUUID();
    const make = (game_id: string, computer: boolean, action = 'ready') => ({ game_id, created_at: '2026-10-15T00:00:00Z', updated_at: '2026-10-15T00:00:00Z', kind: computer ? 'solo' : 'friend', status: 'playing', action, level: 'beginner', seat: 0, move: 1, opponent: { computer, handle: computer ? null : 'friend' } });
    await page.request.post(isolated.url + 'fixture-seed', { data: { data: { games: [make(crypto.randomUUID(), true), make(person, false), make(crypto.randomUUID(), false, 'waiting')] } } });
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open' }));
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('#home-games:not(:disabled)').filter({ hasText: 'Your games (3)' }).waitFor();
    expect(await frame.locator('#home-play').innerText()).toBe('Resume\nfriend · Your move');
    await frame.locator('#home-play').click();
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.findLast((c: any) => c.name === 'kingdown_resume')?.arguments.game_id)).toBe(person);
    await frame.locator('#home-games:not(:disabled)').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await frame.locator('[data-screen="play"] .new-game-body').evaluate(e => e.scrollTop)).toBe(0);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').length)).toBe(0);
    await quickStart(frame);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
  } finally { await page.close(); await isolated.close(); }
});
it('opens the hall on a first host fullscreen mount without a display request or a new game', async () => {
  const page = await browser.newPage(), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(5000);
  try {
    await page.addInitScript(() => { (window as any).harnessDisplayMode = 'fullscreen'; });
    await page.goto(harness.url);
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('#setup-start:not(:disabled)').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests ?? [])).toEqual([]);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').length)).toBe(0);
  } finally { await page.close(); }
});

it('keeps the game route when Play now finishes before fullscreen is granted', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => { (window as any).holdDisplayNext = true; });
    await frame.locator('#home-play').click();
    await page.waitForFunction(() => !!(window as any).releaseDisplay && (window as any).harnessCalls.some((c: any) => c.name === 'kingdown_create'));
    await settled(page);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.queued)).toBe('board');
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
    await page.evaluate(() => (window as any).releaseDisplay());
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests)).toEqual(['fullscreen']);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await expand(page);
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
  } finally { await page.evaluate(() => (window as any).releaseDisplay?.()); await page.close(); await isolated.close(); }
});

it('offers Play now after the empty hall collapses', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    await hall(page);
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    await frame.locator('#home-play').filter({ hasText: 'Play now' }).waitFor();
    expect(await frame.locator('#home-games').innerText()).toBe('Choose a game');
    await expand(page);
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  } finally { await page.close(); await isolated.close(); }
});

it.each([true, false])('remounts a saved screen with an inline host, fullscreen support %s', async supported => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
    await page.addInitScript(() => {
      const host = window as any; host.profileShownInline = false;
      new MutationObserver(() => {
        const profile = document.querySelector<HTMLElement>('[data-screen="profile"]');
        if (profile && !profile.hidden && !document.getElementById('app-frame')?.hidden) host.profileShownInline = true;
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    });
    await page.evaluate(supported => { const host = window as any; host.harnessHostContext = { displayMode: 'inline', availableDisplayModes: supported ? ['inline', 'fullscreen'] : ['inline'] }; host.harnessDisplayMode = 'inline'; }, supported);
    const reads = await sent(page, 'kingdown_settings');
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, reads);
    if (supported) {
      await frame.locator('#home-play:not(:disabled)').filter({ hasText: 'Resume' }).waitFor();
      expect(await frame.locator('html').evaluate(() => (window as any).profileShownInline)).toBe(false);
      await frame.locator('#home-play').click();
    }
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});


it.each(['collapse', 'chat'])('uses the person-first Home action for a saved hall from %s', async source => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    const person = crypto.randomUUID();
    const make = (game_id: string, computer: boolean) => ({ game_id, created_at: '2026-10-15T00:00:00Z', updated_at: '2026-10-15T00:00:00Z', kind: computer ? 'solo' : 'friend', status: 'playing', action: 'ready', level: 'beginner', seat: 0, move: 1, opponent: { computer, handle: computer ? null : 'friend' } });
    await page.request.post(isolated.url + 'fixture-seed', { data: { data: { games: [make(crypto.randomUUID(), true), make(person, false)] } } });
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'play' } }));
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('#home-games:not(:disabled)').filter({ hasText: 'Your games (2)' }).waitFor();
    if (source === 'collapse') {
      await expand(page);
      await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
      await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    }
    expect(await frame.locator('#home-play').innerText()).toBe('Resume\nfriend · Your move');
    await frame.locator('#home-play').click();
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.findLast((c: any) => c.name === 'kingdown_resume')?.arguments.game_id)).toBe(person);
  } finally { await page.close(); await isolated.close(); }
});

it('clears the saved Profile route when a new Home result arrives', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    for (const screen of ['profile', 'home']) {
      const result = await page.evaluate(screen => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen } }), screen);
      await page.evaluate(result => (window as any).harnessShow(result, true), result);
      await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.queued ?? null)).toBe(screen === 'profile' ? 'profile' : null);
    }
    await frame.locator('#home-play:not(:disabled)').filter({ hasText: 'Play now' }).waitFor();
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
  } finally { await page.close(); await isolated.close(); }
});

it('refreshes Your games when a new board collapses to Home', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#home-games').innerText()).toBe('Choose a game');
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    await frame.locator('#home-games:not(:disabled)').filter({ hasText: 'Your games (1)' }).waitFor();
    await frame.locator('#home-games').click();
    await frame.locator('#games-list button').waitFor();
    expect(await frame.locator('#games-list button').count()).toBe(1);
  } finally { await page.close(); await isolated.close(); }
});

it('opens the hall on a late first fullscreen notice and keeps an explicit Home return', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
    await expand(page);
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('home'));
    await expand(page);
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests ?? [])).toEqual([]);
  } finally { await page.close(); }
});

it.each([false, true])('resumes at the result after the saved board ends before an inline remount, pending reply %s', async pendingReply => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    if (pendingReply) {
      await page.evaluate(() => { (window as any).dropNextReply = 'kingdown_resign'; });
      await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_resign', { game_id: app.memory.view.game_id, command_id: crypto.randomUUID().replaceAll('-', ''), expected_revision: app.memory.view.revision }, true); });
    }
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    if (!pendingReply) {
      const ended = await page.evaluate(game_id => (window as any).harnessTool({ name: 'kingdown_resign', arguments: { game_id } }), game_id);
      expect(ended.isError).toBeFalsy();
    }
    const reads = await sent(page, 'kingdown_get');
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#home-play:not(:disabled)').filter({ hasText: 'Resume' }).waitFor();
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="end"]:not([hidden])').waitFor();
    expect(await frame.locator('[data-screen="board"]').isHidden()).toBe(true);
  } finally { await page.close(); await isolated.close(); }
});


it('locks Home Play now while a lost hall start waits for Retry', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    await hall(page);
    await page.evaluate(() => { (window as any).dropNextReply = 'kingdown_create'; });
    await quickStart(frame);
    await frame.locator('#retry:not(:disabled)').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline' }));
    await frame.locator('#home-card:not([hidden])').waitFor();
    expect(await frame.locator('#home-play').innerText()).toBe('Play now');
    expect(await frame.locator('#home-play').isDisabled()).toBe(true);
    expect(await frame.locator('#home-games').isDisabled()).toBe(false);
    await frame.locator('#home-games').click();
    await frame.locator('#retry:not(:disabled)').waitFor();
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // Retry resends the same command ID; the server receipt gives back one game (design §5.2).
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create').length)).toBe(2);
  } finally { await page.close(); await isolated.close(); }
});


it.each(['route', 'chat'])('keeps an explicit Home request on the first fullscreen notice from %s', async source => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    if (source === 'route') await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; app.navigate('profile'); app.navigate('home'); });
    else for (const screen of ['profile', 'home']) {
      const result = await page.evaluate(screen => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen } }), screen);
      await page.evaluate(result => (window as any).harnessShow(result, true), result);
      await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.queued ?? null)).toBe(screen === 'profile' ? 'profile' : null);
    }
    await frame.locator('#home-games:not(:disabled)').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen', theme: 'dark', availableDisplayModes: ['inline', 'fullscreen'] }));
    await frame.locator('body[data-theme="dark"]').waitFor();
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests ?? [])).toEqual([]);
  } finally { await page.close(); await isolated.close(); }
});

it('recovers a lost seat Ready before the computer makes the first move after remount', async () => {
  const isolated = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await open(isolated.url), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'black', level: 'beginner', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false } }); });
    await frame.locator('#seat-ready:not(:disabled)').waitFor();
    await page.evaluate(() => { (window as any).dropNextReply = 'kingdown_choose'; });
    await frame.locator('#seat-ready').click();
    await frame.locator('#retry:not(:disabled)').waitFor();
    const command = await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending.args.command_id);
    const reads = await sent(page, 'kingdown_settings');
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, reads);
    // A pending with an error shows its saved words and Retry at the remount; Retry sends it, and Seat finishes (design §5.3).
    await frame.locator('#retry:not(:disabled)').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // The computer's first move is a retained command too, so no command is pending only after the server makes it.
    await page.waitForFunction(() => (window as any).harnessView.turn === (window as any).harnessView.seat);
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.pending?.name ?? null)).toBeNull();
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_choose').map((c: any) => c.arguments.command_id))).toEqual([command, command]);
  } finally { await page.close(); await isolated.close(); }
});

it('opens six Guide lessons and returns to the same game without a write', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } });
    });
    await frame.locator('#board[aria-busy="false"]').waitFor();
    const before = await page.evaluate(() => (window as any).harnessView);
    const calls = await page.evaluate(() => (window as any).harnessCalls.length);
    await frame.locator('#board-menu').click();
    const menu = frame.locator('#board-sheet');
    expect(await menu.locator('.sheet-body > button').last().getAttribute('id')).toBe('menu-resign');
    expect(await menu.locator('#menu-resign').evaluate(el => parseFloat(getComputedStyle(el).marginTop))).toBeGreaterThanOrEqual(16);
    await frame.locator('#menu-guide').click();
    expect(await frame.locator('.shelf-piece').count()).toBe(6);
    expect(await frame.locator('.shelf-piece').first().evaluate(el => getComputedStyle(el).boxShadow)).toBe('none');
    expect(await frame.locator('.shelf-line').first().evaluate(el => getComputedStyle(el).paddingInlineStart)).toBe('8px');
    for (let i = 0; i < 6; i++) {
      await frame.locator(`.shelf-piece[data-lesson="${i}"]`).click();
      await frame.locator('#lesson-board canvas').waitFor();
      const position = lessonPosition(i), move = lessonMoves(i).find(move => LESSONS[i].goal(position, move))!;
      await frame.locator('#lesson-board').press('Enter');
      await frame.locator(`[data-lesson-move=${JSON.stringify(toLan(position, move))}]`).click();
      expect(await frame.locator('#lesson-task').innerText()).toBe(LESSONS[i].done);
      await menu.locator('.sheet-body > button').filter({ hasText: /^Guide$/ }).click();
    }
    await menu.getByRole('button', { name: 'Return to game', exact: true }).click();
    expect(await page.evaluate(() => (window as any).harnessView)).toEqual(before);
    expect(await page.evaluate(calls => (window as any).harnessCalls.slice(calls).filter((c: any) => c.name !== 'kingdown_get'), calls)).toEqual([]);
    expect(await frame.locator('#board-sheet').isVisible()).toBe(false);
  } finally { await page.close(); }
});

it('uses the reading face for a profile name and the setup veil', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('profile'));
    await frame.locator('#profile-status').filter({ hasText: 'Loading' }).waitFor({ state: 'hidden' });
    expect(await frame.locator('#page-title').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Alegreya');
    await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: true, pool: ['A','L','G','M','S','O','N','Q','R','B'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false } });
    });
    expect(await frame.locator('#seat-veil-layer span').evaluate(el => getComputedStyle(el).fontFamily)).toContain('Alegreya');
  } finally { await page.close(); }
});

it('wraps the setup hint on a phone and keeps the icon-only coin', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.setViewportSize({ width: 390, height: 844 }); await hall(page);
    await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: true, pool: ['A','L','G','M','S','O','N','Q','R','B'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: true } });
    });
    await frame.locator('#seat-me-line').filter({ hasText: 'select the coin to change' }).waitFor();
    const line = await frame.locator('#seat-me-line').evaluate(el => {
      const box = el.getBoundingClientRect(), row = el.closest('.player-strip')!.getBoundingClientRect();
      return { whiteSpace: getComputedStyle(el).whiteSpace, fits: el.scrollWidth <= el.clientWidth, inside: box.bottom <= row.bottom };
    });
    expect(line).toEqual({ whiteSpace: 'normal', fits: true, inside: true });
    expect(await frame.locator('#seat-king').innerText()).toBe('');
  } finally { await page.close(); }
});
