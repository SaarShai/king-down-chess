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
