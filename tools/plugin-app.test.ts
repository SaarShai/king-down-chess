import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { controlBounds } from './lib/plugin-control-bounds.mjs';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string;
let harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => { folder = await mkdtemp(join(tmpdir(), 'kingdown-app-test-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
async function open() {
  const page = await browser.newPage(); page.setDefaultTimeout(5000); await page.goto(harness.url);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  return page;
}
// Each screen but home shows only in fullscreen (spec Q25). A test that opens a screen directly puts the host there first.
const expand = (page: Page) => page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] }));
async function start(page: Page, route = true) {
  await expand(page);
  await page.frameLocator('iframe').locator('html').evaluate((_, route) => {
    const host = window as any;
    host.harnessApp.navigate('setup');
    host.startResult = undefined;
    host.harnessApp.start('friend', { colour: 'white' }, { route }).then((view: any) => { host.startResult = view; });
  }, route);
}
it('reads a saved board at mount and shows Retry with the saved failure words', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white' }); });
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
        const host = window as any; host.harnessApp.navigate('setup');
        host.harnessApp.start(kind, { colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } }).then((view: any) => { host.startResult = view; });
      }, kind);
      await frame.locator('#retry').waitFor();
      const completed = await page.evaluate(() => (window as any).harnessView.game_id);
      await frame.locator('#retry').click();
      await frame.locator(`[data-screen="${kind === 'friend' ? 'friend' : 'wait'}"]:not([hidden])`).waitFor();
      expect(await frame.locator('html').evaluate(() => (window as any).startResult.game_id)).toBe(completed);
      expect(await page.evaluate(name => (window as any).harnessCalls.filter((c: any) => c.name === name).length, name)).toBe(1);
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
        const host = window as any; host.harnessApp.navigate('setup');
        host.harnessApp.start(kind, { colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } }).then((view: any) => { host.startResult = view; });
      }, kind);
      await frame.locator('#retry').waitFor();
      const completed = await page.evaluate(() => (window as any).harnessView.game_id);
      await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('settings'); });
      await frame.locator('[data-nav="handle"]').click();
      await frame.locator('#save-handle').click();
      await frame.locator(`[data-screen="${kind === 'friend' ? 'friend' : 'wait'}"]:not([hidden])`).waitFor();
      expect(await frame.locator('html').evaluate(() => (window as any).startResult.game_id)).toBe(completed);
      expect(await page.evaluate(name => (window as any).harnessCalls.filter((c: any) => c.name === name).length, name)).toBe(1);
      expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    } finally { await page.close(); }
  }
});
it('recovers a lost Create or Find reply on mount without another send', async () => {
  for (const kind of ['friend', 'random']) {
    const page = await open(), frame = page.frameLocator('iframe'), name = kind === 'friend' ? 'kingdown_create' : 'kingdown_find';
    try {
      // A player starts on New game, which shows only in fullscreen (spec Q25).
      await expand(page);
      await page.evaluate(name => { (window as any).dropNextReply = name; }, name);
      await frame.locator('html').evaluate((_, kind) => {
        const app = (window as any).harnessApp; app.navigate('setup');
        void app.start(kind, { colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } });
      }, kind);
      await frame.locator('#retry').waitFor();
      const completed = await page.evaluate(() => (window as any).harnessView.game_id);
      await page.locator('#remount').click();
      await frame.locator(`[data-screen="${kind === 'friend' ? 'friend' : 'wait'}"]:not([hidden])`).waitFor();
      expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(completed);
      expect(await page.evaluate(name => (window as any).harnessCalls.filter((c: any) => c.name === name).length, name)).toBe(1);
      expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    } finally { await page.close(); }
  }
});
it('opens a usable solo board after Retry of a lost Choose reply without a remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-play').click(); await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
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
    await frame.locator('#home-play').click(); await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
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
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white' }); });
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
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(switched._meta.view.game_id);
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseHeldGet?.(); }); await page.close(); }
});
it('refreshes the Play rows after Create and Move from the page', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } });
    });
    const game_id = await page.evaluate(() => (window as any).harnessView.game_id);
    await frame.locator('#page-back').click();
    const row = frame.locator(`#games-list [data-game-id="${game_id}"]`);
    await row.waitFor();
    expect(await row.locator('.line').textContent()).toMatch(/Move 1 ·\sWhite/);
    await row.click(); await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    await frame.locator('html').evaluate(async (_, game_id) => {
      await (window as any).harnessApp.call('kingdown_move', { game_id, command_id: 'play-rows-move', expected_revision: 0, lan: 'e2-e4' }, true);
      (window as any).harnessApp.navigate('play');
    }, game_id);
    await row.locator('.line').filter({ hasText: /Their turn ·\smove 1/ }).waitFor();
    expect(await row.locator('.turn-mark').count()).toBe(0);
    expect(await frame.locator('html').evaluate((_, game_id) => (window as any).harnessApp.memory.games.find((entry: any) => entry.game_id === game_id).revision, game_id)).toBe(1);
  } finally { await page.close(); }
});
it('opens the Your games list from the inline Your games action', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.setViewportSize({ width: 393, height: 600 });
    await frame.locator('#home-games').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests)).toEqual(['fullscreen']);
    expect(await page.evaluate(() => (window as any).harnessWidgetState.privateContent.screen)).toBe('play');
    const [head, body] = await Promise.all([frame.locator('#games-head').boundingBox(), frame.locator('[data-screen="play"] .new-game-body').boundingBox()]);
    expect(Math.abs(head!.y - body!.y)).toBeLessThan(24);
  } finally { await page.close(); }
});
it('opens a screen from a chat tool call in fullscreen, not inline', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests)).toEqual(['fullscreen']);
  } finally { await page.close(); }
});
it('keeps a screen from a chat tool call behind the home card until the host grants fullscreen', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    await page.evaluate(() => { (window as any).holdDisplayNext = true; });
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await page.waitForFunction(() => typeof (window as any).releaseDisplay === 'function');
    expect(await frame.locator('[data-screen="profile"]').isHidden()).toBe(true);
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
    await page.evaluate(() => (window as any).releaseDisplay());
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('opens the screen that waited for fullscreen when the host remounts the widget', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    await page.evaluate(() => { (window as any).holdDisplayNext = true; });
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await page.waitForFunction(() => typeof (window as any).releaseDisplay === 'function');
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'] }));
    await page.locator('#remount').click();
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('never shows a screen inline when the host refuses fullscreen', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const widget = page.frames().find(f => f !== page.mainFrame())!;
    await widget.evaluate(() => { const host = window as any; host.shownInline = false; new MutationObserver(() => { if (!document.querySelector<HTMLElement>('[data-screen="profile"]')!.hidden) host.shownInline = true; }).observe(document.body, { attributes: true, subtree: true, attributeFilter: ['hidden'] }); });
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    await page.evaluate(() => { (window as any).denyDisplayNext = true; });
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await frame.locator('#home-error', { hasText: 'expand control' }).waitFor();
    expect(await widget.evaluate(() => (window as any).shownInline)).toBe(false);
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
  } finally { await page.close(); }
});
it('keeps the home card when a chat tool result arrives after the player leaves fullscreen', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-play').click(); await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }));
    await frame.locator('#home-card:not([hidden])').waitFor();
    const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'profile' } }));
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length);
    await page.evaluate(result => (window as any).harnessShow(result, true), result);
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length > n, reads);
    expect(await page.evaluate(() => (window as any).harnessDisplayRequests)).toEqual(['fullscreen']);
    expect(await frame.locator('#home-card').isVisible()).toBe(true);
    await frame.locator('#home-play').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('shows the home card when the player leaves fullscreen, and Play returns to the game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#home-play').click(); await frame.locator('#play-new').click(); await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
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
it('keeps the opponent picked on New game for the session', async () => {
  const page = await open(), frame = page.frameLocator('iframe'), friend = frame.getByRole('radio', { name: 'A friend', exact: true });
  try {
    await frame.locator('#home-play').click(); await frame.locator('#play-new').click(); await friend.locator('..').click();
    await frame.locator('#page-back').click(); await frame.locator('#play-open').click(); await frame.locator('[data-screen="lobby"]:not([hidden])').waitFor();
    await frame.locator('#page-back').click(); await frame.locator('#play-new').click();
    expect(await friend.isChecked()).toBe(true);
  } finally { await page.close(); }
});
it('keeps the opponent picked after a remount on the New game screen', async () => {
  const page = await open(), frame = page.frameLocator('iframe'), friend = frame.getByRole('radio', { name: 'A friend', exact: true });
  try {
    await frame.locator('#home-play').click(); await frame.locator('#play-new').click(); await frame.locator('[data-screen="setup"]:not([hidden])').waitFor();
    await page.locator('#remount').click(); await frame.locator('[data-screen="setup"]:not([hidden])').waitFor(); await friend.locator('..').click();
    await frame.locator('#page-back').click(); await frame.locator('#play-new').click();
    expect(await friend.isChecked()).toBe(true);
  } finally { await page.close(); }
});
it('keeps chat preview and code errors in page memory on notification and mount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const tool = async (path: string, name: string, args = {}) => (await page.request.post(new URL(path, harness.url).href, { data: { name, arguments: args } })).json();
  try {
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
it('shows both setup states in the app games rows', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false } });
    });
    const game_id = await page.evaluate(() => (window as any).harnessView.game_id);
    const accepted = await (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name: 'kingdown_accept', arguments: { game_id } } })).json();
    expect(accepted.isError).toBeFalsy();
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
    await frame.locator('#page-back').click();
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
    await row.locator('.line').filter({ hasText: 'Waiting for the other player' }).waitFor();
    expect(await row.locator('.turn-mark').count()).toBe(0);
  } finally { await page.close(); }
});
it('updates activity on unchanged replies across the two-minute poll boundary', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_create', { kind: 'friend', colour: 'white' });
      (parent as any).harnessNextView = { ...app.memory.view, status: 'playing', speed: 'daily', turn: 1, seat: 0, opponent: { last_seen_ms: 119000 }, server_now: '2026-10-11T12:00:00Z' };
      await app.call('kingdown_get', {});
    });
    const before = await frame.locator('html').evaluate(async () => {
      const { pollDelay } = await new Function('return import("/src/plugin/poll.ts")')();
      return pollDelay((window as any).harnessApp.memory.view, 0, false);
    });
    expect(before).toBe(3000);
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      (parent as any).harnessNextView = { ...app.memory.view, opponent: { last_seen_ms: 121000 }, server_now: '2026-10-11T12:00:02Z' };
      await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true, false);
    });
    expect(await frame.locator('html').evaluate(async () => {
      const { pollDelay } = await new Function('return import("/src/plugin/poll.ts")')(), view = (window as any).harnessApp.memory.view;
      return { delay: pollDelay(view, 0, false), now: view.server_now };
    })).toEqual({ delay: 30000, now: '2026-10-11T12:00:02Z' });
  } finally { await page.close(); }
});
it('keeps the start screen through HANDLE_NEEDED, Back, Save and deferred routing', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => { (window as any).requireHandleNext = true; });
    await start(page, false);
    await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#page-back').textContent()).toBe('‹ Play');
    await frame.locator('#page-back').click();
    expect(await frame.locator('[data-screen="setup"]').isVisible()).toBe(true);
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('handle'); });
    await frame.locator('#save-handle').click();
    await frame.locator('html').evaluate(() => new Promise<void>(resolve => {
      const tick = () => (window as any).startResult ? resolve() : setTimeout(tick, 10); tick();
    }));
    expect(await frame.locator('html').evaluate(() => (window as any).startResult.status)).toBe('waiting');
    expect(await frame.locator('[data-screen="setup"]').isVisible()).toBe(true);
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
    expect(await frame.locator('[data-screen="setup"]').isVisible()).toBe(true);
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await frame.locator('#error').textContent()).toBe('');
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('html').evaluate(() => new Promise<void>(resolve => {
      const tick = () => (window as any).startResult ? resolve() : setTimeout(tick, 10); tick();
    }));
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});
it.each([true, false])('keeps route=%s through Save, a failed send and Retry', async route => {
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
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('setup'); });
    await frame.locator('#retry').click();
    await frame.locator('html').evaluate(() => new Promise<void>(resolve => {
      const tick = () => (window as any).startResult ? resolve() : setTimeout(tick, 10); tick();
    }));
    expect(await frame.locator('html').evaluate(() => (window as any).startResult.status)).toBe('waiting');
    expect(await frame.locator(`[data-screen="${route ? 'friend' : 'setup'}"]`).isVisible()).toBe(true);
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

it('restores a saved End route to the board when the game still plays', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: false } }); });
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await page.evaluate(() => { (window as any).harnessWidgetState.privateContent.screen = 'end'; });
    await page.locator('#remount').click();
    await frame.locator('body[data-page="board"]').waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.status)).toBe('playing');
    expect(await frame.locator('#over.end-card').isVisible()).toBe(false);
  } finally { await page.close(); }
});

it('keeps both sides in Moves and restores them after Remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
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
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', {kind:'solo',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}}); });
    for (const id of ['board-menu','moves-line','resign']) {
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
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options: { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false } }); });
    await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    const message = 'Harness saved-game read failed';
    expect(await frame.locator('#error').textContent()).toContain(message);
    expect(await frame.getByText(message, { exact: true }).count()).toBe(1);
    expect(await frame.locator('#status').textContent()).toBe('');
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
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_create', {kind:'solo',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}}); });
    const game = await page.evaluate(() => (window as any).harnessView.game_id);
    await page.evaluate(() => { (window as any).rejectNextGet = true; }); await page.locator('#remount').click();
    await frame.getByRole('button',{name:'Try again',exact:true}).waitFor();
    await frame.getByRole('button',{name:'Try again',exact:true}).click();
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(game);
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.close(); }
});

it.each([false,true])('shows a draw offer and handles a decline before Resign (immediate: %s)', async immediate => {
  const page = await open(), frame = page.frameLocator('iframe');
  const buddy = async (name: string, args: Record<string, unknown>) => (await page.request.post(new URL('/fixture-friend-tool',harness.url).href,{data:{name,arguments:args}})).json();
  try {
    await frame.locator('html').evaluate(async () => { const app=(window as any).harnessApp; await app.start('friend',{colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}}); });
    await frame.locator('#friend-code span').first().waitFor();
    const code = (await frame.locator('#friend-code span').allTextContents()).join('');
    const joined = await buddy('kingdown_join',{code});
    await frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get',{},false,false,true); });
    await frame.locator('#offer-draw:not(:disabled)').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Offer draw',exact:true}).click();
    await frame.locator('#context-note').filter({hasText:'Draw offered. Waiting for your opponent.'}).waitFor();
    await page.request.post(new URL('/fixture-seed',harness.url).href,{data:{actor:'alice',data:{views:{[joined._meta.view.game_id]:{outcome:{rating_before:1500,rating:1561,provisional:true,badges:[]}}}}}});
    const full=await frame.locator('html').evaluate(async()=>{return (window as any).harnessApp.client.call('kingdown_get');});
    expect(full._meta.view.outcome).toBeUndefined();
    const view = (await buddy('kingdown_get',{game_id:joined._meta.view.game_id}))._meta.view;
    await buddy('kingdown_draw',{game_id:view.game_id,command_id:'decline-offer',expected_revision:view.revision,choice:'decline'});
    if (!immediate) await frame.locator('#offer-draw:not([hidden])').waitFor({timeout:7000});
    await frame.locator('#resign').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Resign',exact:true}).click();
    await frame.locator('[data-screen="end"]:not([hidden])').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
  } finally { await page.close(); }
});

it('does not repeat the abort title in the end reason', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => {
      const app=(window as any).harnessApp; await app.call('kingdown_create',{kind:'solo',colour:'white',options:{fairy:false,pool:[],arrangement:false,classic:true,cards:false,cardPool:[],kingPowers:false}});
      const v=app.memory.view; await app.call('kingdown_abort',{game_id:v.game_id,command_id:'words-abort',expected_revision:v.revision},true);
    });
    await frame.locator('#over.end-card[open]').waitFor();
    expect(await frame.locator('#over-title').textContent()).toBe('Game aborted');
    expect(await frame.locator('#end-reason').textContent()).toBe('');
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
    expect(recovery).toEqual(['kingdown_get', 'kingdown_move']);
    // Advance the other seat before the old revision arrives.
    const game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    const bob = await (await page.request.post(harness.url + 'fixture-friend-tool', { data: { name: 'kingdown_get', arguments: { game_id } } })).json();
    expect(bob._meta.view.revision).toBe(revision + 1);
    expect(bob._meta.view.history.actions).toEqual(['e2-e4']);
    await page.request.post(harness.url + 'fixture-friend-tool', { data: { name: 'kingdown_move', arguments: { game_id, command_id: 'bob-once', expected_revision: revision + 1, lan: 'e7-e5' } } });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
    await page.evaluate(() => (window as any).releaseHeld());
    await page.clock.runFor(100);
    expect(await frame.locator('html').evaluate(() => ({ revision: (window as any).harnessApp.memory.view.revision, pending: (window as any).harnessApp.client.state.pending }))).toEqual({ revision: revision + 2, pending: undefined });
    expect(await frame.locator('#board-menu').isEnabled()).toBe(true);
  } finally { await page.close(); }
});

it('gives one offline sentence on Start and Join', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page); await frame.locator('#home-play').click(); await frame.locator('#play-new').click();
    await page.context().setOffline(true); await frame.locator('#setup-start').click();
    await expect.poll(() => frame.locator('#error').textContent()).toBe('Cannot connect. Check your connection, then try again.');
    await page.context().setOffline(false);
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('join'); });
    await frame.locator('#join-code').fill('ABC123');
    await page.context().setOffline(true); await frame.locator('#join-entry button').click();
    await expect.poll(() => frame.locator('#join-message').textContent()).toBe('Cannot connect. Check your connection, then try again.');
  } finally { await page.close(); }
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

it('keeps the board quiet when a poll times out', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNextGet = true; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeldGet);
    await page.clock.fastForward(10_001);
    await page.evaluate(() => (window as any).releaseHeldGet());
    await page.clock.runFor(100);
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
  } finally { await page.close(); }
});

it('shows Retry after a remount while a move waits, and Retry saves one move', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'remount-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.locator('#remount').click();
    await frame.locator('#retry:not(:disabled)').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('Cannot connect. Check your connection, then try again.');
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    await page.evaluate(() => (window as any).releaseHeld());
    const game_id = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    const bob = await (await page.request.post(harness.url + 'fixture-friend-tool', { data: { name: 'kingdown_get', arguments: { game_id } } })).json();
    expect(bob._meta.view.history.actions).toEqual(['e2-e4']);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.command_id))).toEqual(['remount-move', 'remount-move']);
  } finally { await page.close(); }
});

it('drops the wait line when a slow start times out', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await expand(page); await frame.locator('#home-play').click(); await frame.locator('#play-new').click();
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    await frame.locator('#setup-start').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(10_001);
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('Cannot connect. Check your connection, then try again.');
    expect(await frame.locator('#setup-start').textContent()).toBe('Starting your game…');
    await page.evaluate(() => (window as any).releaseHeld());
  } finally { await page.close(); }
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

it('lets the mount reads wait past 10 seconds', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_settings'; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(20_000);
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('#home-error').textContent()).toBe('');
  } finally { await page.close(); }
});

// Round 5 helpers: a player opens New game against a friend; the count of calls sent with one name.
async function newGame(page: Page, opponent = 'A friend') {
  const frame = page.frameLocator('iframe');
  await expand(page); await frame.locator('#home-play').click(); await frame.locator('#play-new').click();
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

// Round 5: each failed command keeps its error and Retry on the screen where it started.
const CANNOT_CONNECT = 'Cannot connect. Check your connection, then try again.';

it('shows Retry on the board after an inline remount while a move waits', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'inline-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // The host remounts the widget inline and refuses the automatic fullscreen request, so the board waits behind the home card.
    await page.evaluate(() => { const host = window as any; host.harnessHostContext = { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }; host.harnessDisplayMode = 'inline'; host.denyDisplayNext = true; });
    const settings = await sent(page, 'kingdown_settings');
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, settings);
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('[data-screen="board"]').isHidden()).toBe(true);
    // Later the player opens the board in fullscreen.
    await expand(page); await frame.locator('html').evaluate(() => { (window as any).harnessApp.navigate('board'); });
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
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
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    await frame.locator('#setup-start').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(5_001);
    await frame.locator('#page-back').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    // The 10 s command limit ends the Create while the player is on Play.
    await page.clock.fastForward(5_000);
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    await frame.locator('#play-new:not(:disabled)').click();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    expect(await frame.locator('#setup-start').textContent()).toBe('Starting your game…');
    await frame.locator('#retry').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect(await sent(page, 'kingdown_create')).toBe(1);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

// A failed command locks Start, the board, the seat and the poll on every game screen, so each of them says why.
it('shows a timed-out start and its Retry on the board of another game, and Retry finishes the start', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    const friend = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('play'));
    await frame.locator('#play-new:not(:disabled)').click();
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    await frame.locator('#setup-start').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(5_001);
    await frame.locator('#page-back').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await page.clock.fastForward(5_000);
    await frame.locator(`#games-list [data-game-id="${friend}"]:not(:disabled)`).click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).not.toBe(friend);
    // The friend game's own Create (sent by the test) has no command ID.
    const ids = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create' && c.arguments.command_id).map((c: any) => c.arguments.command_id));
    expect(ids).toHaveLength(2); expect(ids[1]).toBe(ids[0]);
    await expect.poll(() => frame.locator('#error').textContent()).toBe('');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('shows a waiting move and its Retry on New game after an inline remount, and Retry frees Start', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'setup-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.evaluate(() => { const host = window as any; host.harnessHostContext = { displayMode: 'inline', availableDisplayModes: ['inline', 'fullscreen'] }; host.harnessDisplayMode = 'inline'; host.denyDisplayNext = true; });
    const settings = await sent(page, 'kingdown_settings');
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_settings').length > n, settings);
    await frame.locator('#home-play:not(:disabled)').click();
    await frame.locator('#play-new:not(:disabled)').click();
    await frame.locator('[data-screen="setup"]:not([hidden])').waitFor();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    expect(await frame.locator('#setup-start').isDisabled()).toBe(true);
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#setup-start:not(:disabled)').waitFor();
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
    expect(await frame.locator('#setup-start').textContent()).toBe('Starting your game…');
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
    await frame.locator('[data-screen="setup"]:not([hidden])').waitFor();
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('Pick a name and picture first.');
    expect(await sent(page, 'kingdown_create')).toBe(1);
  } finally { await page.close(); }
});

it('keeps a move in flight free of errors when a chat result arrives during it', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'busy-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // The chat result for this game reads no board while the move runs; its last widget write ends the mount.
    const writes = await page.evaluate(() => (window as any).harnessWidgetStates.length);
    await page.evaluate(() => { const host = window as any; return host.harnessShow({ content: [], structuredContent: { game_id: host.harnessView.game_id, board_id: host.harnessWidgetState.privateContent.board_id } }, true); });
    await page.waitForFunction(n => (window as any).harnessWidgetStates.length > n, writes);
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    expect(await frame.locator('#error').textContent()).toBe('');
    await page.evaluate(() => (window as any).releaseHeld());
    await expect.poll(() => page.evaluate(() => (window as any).harnessWidgetState.privateContent.pending)).toBeUndefined();
    expect(await frame.locator('#retry').isHidden()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('shows the connection sentence after three failed polls and clears it on the next good read', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    // White, this player, moves next: the timed poll waits 30 s, so only the reads below run.
    await friendGame(page);
    const poll = () => frame.locator('html').evaluate(async () => { const app = (window as any).harnessApp; await app.call('kingdown_get', { since_revision: app.memory.view.revision }, false, true); });
    await page.context().setOffline(true);
    await poll(); await poll();
    expect(await frame.locator('#error').textContent()).toBe('');
    await poll();
    expect(await frame.locator('#error').textContent()).toBe(CANNOT_CONNECT);
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    await page.context().setOffline(false);
    await poll();
    expect(await frame.locator('#error').textContent()).toBe('');
  } finally { await page.context().setOffline(false); await page.close(); }
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
    await page.evaluate(name => { (window as any).holdNext = name; }, game_id ? 'kingdown_resume' : 'kingdown_open');
    await page.evaluate(game_id => (window as any).harnessShow(game_id ? { content: [], structuredContent: { screen: 'board', game_id } } : { isError: true, content: [{ type: 'text', text: 'Invitation expired or used' }], _meta: { code: 'INVITE_UNAVAILABLE' } }), game_id);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(20_000);
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#page-back:not(:disabled)').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#home-error').textContent()).toBe('');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});
