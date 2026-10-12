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
async function start(page: Page, route = true) {
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
    expect(await row.locator('.line').textContent()).toBe('Your turn · move 1');
    await row.click(); await frame.locator('#reload:not(:disabled)').waitFor({ state: 'attached' });
    await frame.locator('html').evaluate(async (_, game_id) => {
      await (window as any).harnessApp.call('kingdown_move', { game_id, command_id: 'play-rows-move', expected_revision: 0, lan: 'e2-e4' }, true);
    }, game_id);
    await frame.locator('#page-back').click();
    await row.locator('.line').filter({ hasText: 'Their turn · move 1' }).waitFor();
    expect(await row.locator('.turn-mark').count()).toBe(0);
    expect(await frame.locator('html').evaluate((_, game_id) => (window as any).harnessApp.memory.games.find((entry: any) => entry.game_id === game_id).revision, game_id)).toBe(1);
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
    await page.evaluate(() => { (window as any).failNextAction = true; });
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
    await frame.locator('html').evaluate(() => { const app = (window as any).harnessApp; app.navigate('settings'); app.navigate('handle'); });
    expect(await frame.locator('#page-back').textContent()).toBe('‹ Settings');
    expect(await frame.locator('[data-screen="handle"]').textContent()).toContain('Each name is unique. You pick it once, at your first game against a person.');
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
    await frame.locator('#status').filter({ hasText: 'White to move' }).waitFor();
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
    expect(await frame.locator('#retry').isVisible()).toBe(false);
  } finally { await page.close(); }
});
