import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { startHarness } from './plugin-ui-harness';
import { DEFAULT_OPTIONS, switches } from '../src/match/setup';
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
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' })); return page;
}
async function freeze(page: Page) {
  const now = new Date(); await page.clock.install({ time: new Date(now.getTime() - 60000) }); await page.clock.pauseAt(now);
}
// lobby: the game takes the options that Find in Open games sends, so that Find takes it back later (D1 a).
const lobbyOptions = async (page: Page) => await page.frameLocator('iframe').locator('html').evaluate(() => (window as any).harnessApp.memory.settings?.last_setup?.options) ?? DEFAULT_OPTIONS;
async function start(page: Page, kind: string, lobby = false) {
  const used = lobby ? await lobbyOptions(page) : options;
  return page.frameLocator('iframe').locator('html').evaluate(async (_, input) => {
    const app = (window as any).harnessApp; app.navigate('play');
    return app.start(input.kind, { options: input.options, colour: 'white' });
  }, { kind, options: used });
}
// The host opens the chat route fullscreen.
async function hall(page: Page) {
  const result = await page.evaluate(() => (window as any).harnessTool({ name: 'kingdown_open', arguments: { screen: 'play' } }));
  await page.evaluate(result => (window as any).harnessShow(result), result);
  await page.frameLocator('iframe').locator('[data-screen="play"]:not([hidden])').waitFor();
}
it('makes a friend code after create and offers a new code after remount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await start(page, 'friend'); await frame.locator('.game-code span').first().waitFor();
    expect(await frame.locator('.game-code span').count()).toBe(6);
    expect(await frame.locator('#friend-expiry').textContent()).toContain('Ends ');
    expect(await frame.locator('#friend-actions button').allTextContents()).toEqual(['Share', 'Copy']);
    expect(await frame.locator('#friend-share').getAttribute('class')).toContain('primary');
    expect(await frame.locator('#friend-copy').getAttribute('class')).not.toContain('primary');
    const invites = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_invite').length);
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#friend-new').waitFor();
    expect(await frame.locator('.game-code span').count()).toBe(0);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_invite').length)).toBe(invites);
    expect(JSON.stringify(await page.evaluate(() => (window as any).harnessWidgetState))).not.toContain('expires_at');
    await frame.locator('#friend-new').click(); await frame.locator('.game-code span').first().waitFor();
    const code = (await frame.locator('.game-code span').allTextContents()).join('');
    await frame.locator('#page-back').click();
    const row = frame.locator('.friend-invite-row').filter({ hasText: code }); await row.waitFor();
    expect(await row.getByRole('button', { name: `Share game ${code}`, exact: true }).isVisible()).toBe(true);
  } finally { await page.close(); }
});
it('copies the full invite without Share and selects it when both copy paths refuse', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await start(page, 'friend'); await frame.locator('#friend-copy').waitFor();
    const code = (await frame.locator('.game-code span').allTextContents()).join('');
    const text = `Join King Down game ${code}. Rules: Fairy pieces.`;
    await frame.locator('html').evaluate(() => {
      (window as any).inviteShareCalls = 0;
      Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { (window as any).inviteShareCalls++; } });
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => { (window as any).copiedInvite = text; } } });
    });
    await frame.locator('#friend-copy').click(); expect(await frame.locator('#friend-copy-status').textContent()).toBe('Copied');
    expect(await frame.locator('html').evaluate(() => (window as any).copiedInvite)).toBe(text);
    expect(await frame.locator('html').evaluate(() => (window as any).inviteShareCalls)).toBe(0);
    await frame.locator('html').evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('Denied'); } } });
      document.execCommand = () => false;
    });
    await frame.locator('#friend-copy').click();
    expect(await frame.locator('#friend-copy-status').textContent()).toBe(`Select the invite and copy it: ${text}`);
    expect(await frame.locator('html').evaluate(() => getSelection()?.toString())).toBe(text);
    expect(await frame.locator('html').evaluate(() => (window as any).inviteShareCalls)).toBe(0);
  } finally { await page.close(); }
});
async function buddy(page: Page, name: string, args: Record<string, unknown> = {}) {
  return (await page.request.post(new URL('/fixture-friend-tool', harness.url).href, { data: { name, arguments: args } })).json();
}
it('shares the known code from Your games without a new code or a resume', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const view = await start(page, 'friend'); await frame.locator('.game-code span').first().waitFor();
    const code = (await frame.locator('.game-code span').allTextContents()).join('');
    await frame.locator('html').evaluate(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => { (window as any).sharedInvite = data.text; } });
    });
    await frame.locator('#friend-share').click();
    expect(await frame.locator('#friend-copy-status').textContent()).toBe('Shared');
    await frame.locator('#page-back').click();
    const row = frame.locator('.friend-invite-row').filter({ hasText: code }); await row.waitFor();
    expect(await row.locator('[data-game-id]').getAttribute('data-game-id')).toBe(view.game_id);
    const calls = () => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => ['kingdown_invite', 'kingdown_resume'].includes(c.name)).length);
    const before = await calls();
    await row.getByRole('button', { name: `Share game ${code}`, exact: true }).click();
    expect(await row.getByRole('status').textContent()).toBe('Shared');
    expect(await frame.locator('html').evaluate(() => (window as any).sharedInvite)).toBe(`Join King Down game ${code}. Rules: Fairy pieces.`);
    expect(await calls()).toBe(before);
    expect(await frame.locator('button button').count()).toBe(0);
    await row.locator('[data-game-id]').click();
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
    expect((await frame.locator('.game-code span').allTextContents()).join('')).toBe(code);
  } finally { await page.close(); }
});
it('names Black on a preview from a code in chat', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const created = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'white' });
    const invite = await buddy(page, 'kingdown_invite', { game_id: created._meta.view.game_id });
    const opened = await page.evaluate(code => (window as any).harnessTool({ name: 'kingdown_open', arguments: { code } }), invite.structuredContent.code);
    await page.evaluate(result => (window as any).harnessShow(result), opened);
    await frame.locator('#join-confirm').waitFor();
    expect(await frame.locator('#join-confirm').textContent()).toBe('Join and take Black');
    expect(await frame.locator('#join-entry').isVisible()).toBe(false);
  } finally { await page.close(); }
});
it('updates Your games after Back and keeps rows locked during Resume', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const view = await start(page, 'friend'); await frame.locator('.game-code span').first().waitFor();
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#friend-new').waitFor();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_invite'; });
    await frame.locator('#friend-new').click();
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await frame.locator('#page-back').click();
    await frame.locator(`[data-screen="play"]:not([hidden]) [data-game-id="${view.game_id}"]`).waitFor();
    await page.evaluate(() => {
      const host = window as any; host.releaseInvite = host.releaseHeld; host.releaseHeld = undefined; host.holdNext = 'kingdown_resume';
    });
    await frame.locator(`[data-game-id="${view.game_id}"]`).click();
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await page.evaluate(() => { const host = window as any; host.releaseResume = host.releaseHeld; host.releaseInvite(); });
    const row = frame.locator('.friend-invite-row').filter({ has: frame.locator(`[data-game-id="${view.game_id}"]`) });
    await row.waitFor();
    expect(await row.getByRole('button', { name: /^Share game / }).isVisible()).toBe(true);
    expect(await row.getByRole('button', { name: /^Share game / }).isDisabled()).toBe(true);
    expect(await row.locator('[data-game-id]').isDisabled()).toBe(true);
    expect(await frame.locator('[data-screen="play"]').isVisible()).toBe(true);
    await page.evaluate(() => (window as any).releaseResume());
    await frame.locator('[data-screen="friend"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('previews a lower-case code, declines without taking a seat and then joins', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const created = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'black' });
    const invite = await buddy(page, 'kingdown_invite', { game_id: created._meta.view.game_id });
    const code = invite.structuredContent.code.toLowerCase();
    await hall(page); await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(`${code.slice(0,3)}-${code.slice(3)}`); await frame.locator('#join').click();
    await frame.locator('#join-confirm').waitFor();
    expect(await frame.locator('#join-preview .row-title').allTextContents()).toEqual(['Your opponent', 'Features']);
    expect(await frame.locator('#join-preview .line').last().textContent()).toContain('You play White.');
    expect(await frame.locator('#join-confirm').textContent()).toBe('Join and take White');
    await frame.locator('#join-decline').click();
    expect((await buddy(page, 'kingdown_get', { game_id: created._meta.view.game_id }))._meta.view.status).toBe('waiting');
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(code); await frame.locator('#join').click(); await frame.locator('#join-confirm').waitFor(); await frame.locator('#join-confirm').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect((await buddy(page, 'kingdown_get', { game_id: created._meta.view.game_id }))._meta.view.status).toBe('playing');
    expect(JSON.stringify(await page.evaluate(() => (window as any).harnessWidgetState)).includes(code.toUpperCase())).toBe(false);
  } finally { await page.close(); }
});
it('lists another player with features and accepts the open seat', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const created = await buddy(page, 'kingdown_create', { kind: 'random', options, colour: 'white' });
    await hall(page); await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click();
    await frame.locator('#lobby-list .accept').first().waitFor();
    expect(await frame.locator('#lobby-list .feats [title="Fairy pieces"]').count()).toBe(1);
    await frame.locator('#lobby-list .accept').first().click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(created._meta.view.game_id);
    expect((await buddy(page, 'kingdown_get', { game_id: created._meta.view.game_id }))._meta.view.status).toBe('playing');
  } finally { await page.close(); }
});
it('reads the visible lobby every fifteen seconds and pauses while hidden', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  let waiting: string | undefined;
  try {
    await freeze(page);
    waiting = (await buddy(page, 'kingdown_create', { kind: 'random', options, colour: 'white' }))._meta.view.game_id;
    await hall(page); await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click();
    await frame.locator('#lobby-list .accept').first().waitFor();
    const reads = () => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_lobby').length);
    const initial = await reads();
    await page.clock.runFor(14999); expect(await reads()).toBe(initial);
    await page.clock.runFor(1); await expect.poll(reads).toBe(initial + 1);
    await frame.locator('html').evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    await page.clock.fastForward(30000); expect(await reads()).toBe(initial + 1);
    await frame.locator('html').evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect.poll(reads).toBe(initial + 2);
    await frame.locator('#page-back').click();
    await page.clock.fastForward(30000); expect(await reads()).toBe(initial + 2);
    await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await expect.poll(reads).toBe(initial + 3);
    await page.clock.resume();
  } finally { if (waiting) await buddy(page, 'kingdown_cancel', { game_id: waiting }); await page.close(); }
});
it('offers a computer game after 25 seconds, watches without a board ID and switches', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await freeze(page);
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
it('keeps the five-second wait budget through the computer handoff, then uses fifteen seconds', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    await freeze(page);
    await frame.locator('html').evaluate(() => {
      // The frame keeps its own read log: the host page cannot reach a frame on another origin.
      const host = window as any, app = host.harnessApp, send = app.client.call;
      host.ticketReads = [];
      app.client.call = async (name: string, args: any, options: any) => {
        const at = Date.now(), result = await send(name, args, options);
        if (name === 'kingdown_get') host.ticketReads.push({ at, background: options?.background === true });
        return result;
      };
    });
    await start(page, 'random');
    const advance = async (ms: number) => {
      const n = await frame.locator('html').evaluate(() => (window as any).ticketReads.length);
      await page.clock.runFor(ms); await expect.poll(() => frame.locator('html').evaluate(() => (window as any).ticketReads.length)).toBe(n+1);
    };
    for (let i=0;i<5;i++) await advance(5000);
    await frame.locator('#page-back').click(); await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await frame.locator('#find-any-row').click(); await frame.locator('#find-opponent').click();
    await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    await frame.locator('#wait-computer').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // The solo read and the human-game watch can finish in either order.
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    for (let i=5;i<24;i++) await advance(5000);
    const count = await frame.locator('html').evaluate(() => (window as any).ticketReads.length);
    await page.clock.runFor(14999);
    expect(await frame.locator('html').evaluate(() => (window as any).ticketReads.length)).toBe(count);
    await advance(1);
    const times = await frame.locator('html').evaluate(() => (window as any).ticketReads.map((r: any) => r.at));
    expect(times.at(-1)-times.at(-2)).toBe(15000);
    await frame.locator('html').evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    const hidden = await frame.locator('html').evaluate(() => (window as any).ticketReads.length); await page.clock.fastForward(30000);
    expect(await frame.locator('html').evaluate(() => (window as any).ticketReads.length)).toBe(hidden);
    await frame.locator('html').evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).ticketReads.length)).toBeGreaterThan(hidden);
    await page.clock.resume();
    await page.evaluate(() => (window as any).harnessTeardown());
    const closed = await frame.locator('html').evaluate(() => (window as any).ticketReads.length); await page.clock.fastForward(30000);
    expect(await frame.locator('html').evaluate(() => (window as any).ticketReads.length)).toBe(closed);
  } finally { await page.close(); }
});
// The owner's item D1 a: 'Any rules' under A random player and in Open games. Find sends any_rules only when it is on.
it('shows Any rules only for a random player and sends it with Find from New game and Open games', async () => {
  const page = await open(), frame = page.frameLocator('iframe'), html = frame.locator('html'), line = 'Join the oldest open game, whatever its rules.';
  // One Find, then its game ends, so the next Find has no open game of its own.
  async function find(click: () => Promise<void>) {
    const before = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_find').length);
    await click();
    await expect.poll(() => html.evaluate(() => { const view = (window as any).harnessApp.memory.view; return view?.kind === 'random' && view.status !== 'aborted'; })).toBe(true);
    await html.evaluate(async () => { const app = (window as any).harnessApp, view = app.memory.view; await app.call(view.status === 'waiting' ? 'kingdown_cancel' : 'kingdown_abort', { game_id: view.game_id }, false, false, false); await app.call('kingdown_games', {}); });
    return page.evaluate(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_find')[n].arguments.any_rules, before);
  }
  try {
    await hall(page);
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click();
    expect(await frame.locator('#anyRules-row').isHidden()).toBe(true);
    await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click();
    expect([await frame.locator('#anyRules-row').isVisible(), await frame.locator('#anyRules-line').textContent()]).toEqual([true, line]);
    expect(await find(() => frame.locator('#setup-start').click())).toBeUndefined();
    await html.evaluate(() => (window as any).harnessApp.navigate('play'));
    await frame.locator('#anyRules-row').click();
    expect(await find(() => frame.locator('#setup-start').click())).toBe(true);
    await html.evaluate(() => (window as any).harnessApp.navigate('lobby'));
    expect(await frame.locator('#find-any-line').textContent()).toBe(line);
    expect(await find(() => frame.locator('#find-opponent').click())).toBeUndefined();
    await html.evaluate(() => (window as any).harnessApp.navigate('lobby'));
    await frame.locator('#find-any-row').click();
    expect(await find(() => frame.locator('#find-opponent').click())).toBe(true);
  } finally { await page.close(); }
});
it('reuses a new open game after returning through Play without a second Find', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => {
      const app = (window as any).harnessApp;
      for (const game of app.memory.games.filter((g: any) => g.kind === 'random' && g.status === 'waiting')) await app.call('kingdown_cancel', { game_id: game.game_id }, false, false, false);
      await app.call('kingdown_games', {});
    });
    await start(page, 'random', true);
    await frame.locator('#page-back').click(); await page.evaluate(() => { (window as any).holdNext = 'kingdown_games'; });
    await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await frame.locator('#find-any-row').click(); await frame.locator('#find-opponent').click();
    await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).releaseHeld?.());
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_find').length)).toBe(1);
  } finally { await page.close(); }
});
// D1 a: Find in Open games takes your own open game only when it has the same five switches (or with Any rules).
it('sends a new Find from Open games when your own open game has other switches', async () => {
  const page = await open(), frame = page.frameLocator('iframe'), html = frame.locator('html');
  const finds = () => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_find').length);
  try {
    await clearWait(page);
    const own = await start(page, 'random');
    await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    expect(switches(await lobbyOptions(page))).not.toBe(switches(options));
    const before = await finds();
    await html.evaluate(() => (window as any).harnessApp.navigate('lobby'));
    await frame.locator('#find-opponent').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_find').length > n, before);
    await frame.locator('[data-screen="lobby"]').waitFor({ state: 'hidden' });
    expect(await html.evaluate(() => (window as any).harnessApp.memory.view.game_id)).not.toBe(own.game_id);
  } finally { await page.close(); }
});
it('opens the human game when the friend joins before a saved wait remounts', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await start(page, 'friend'); await frame.locator('.game-code span').first().waitFor();
    const code = (await frame.locator('.game-code span').allTextContents()).join('');
    await buddy(page, 'kingdown_join', { code }); await page.locator('#remount').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('shows code errors on a chat mount and permits a new code from Play', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    for (const [code, words] of [['INVITE_UNAVAILABLE','No game has this code. Check the code with your friend.'],['FORBIDDEN','You cannot join this game.'],['INVALID_INPUT','Check the code: 6 letters and digits.'],['RATE_LIMITED','Too many code tries. Wait one hour.']]) {
      await page.evaluate(({ code }) => (window as any).harnessShow({ isError: true, content: [{ type: 'text', text: 'Server code error with an invitation link.' }], _meta: { code } }, true), { code });
      await frame.locator('#join-message').filter({ hasText: words }).waitFor();
      expect(await frame.locator('#join-message').textContent()).toBe(words);
    }
    // Another limit (here the Open limit) keeps its own server text.
    const boards = 'Too many new boards. Wait one minute, then try again.';
    await page.evaluate(text => (window as any).harnessShow({ isError: true, content: [{ type: 'text', text }], _meta: { code: 'RATE_LIMITED' } }, true), boards);
    await frame.locator('#join-message').filter({ hasText: boards }).waitFor();
    const created = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'white' });
    const invite = await buddy(page, 'kingdown_invite', { game_id: created._meta.view.game_id });
    await frame.locator('#page-back').click(); await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(invite.structuredContent.code); await frame.locator('#join').click();
    await frame.locator('#join-confirm').waitFor();
  } finally { await page.close(); }
});
async function clearWait(page: Page) {
  const games = await buddy(page, 'kingdown_games');
  for (const game of games._meta.games.filter((g: any) => g.kind === 'random' && g.status === 'waiting')) await buddy(page, 'kingdown_cancel', { game_id: game.game_id });
  await page.frameLocator('iframe').locator('html').evaluate(async () => {
    const app = (window as any).harnessApp, result = await app.client.call('kingdown_games');
    for (const game of result._meta.games.filter((g: any) => g.kind === 'random' && g.status === 'waiting')) await app.call('kingdown_cancel', { game_id: game.game_id }, false, false, false);
    await app.call('kingdown_games', {});
  });
}
it('starts the computer with default seat choices and keeps it after Not now', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await clearWait(page); await freeze(page);
    const waiting = await frame.locator('html').evaluate(async (_, options) => (window as any).harnessApp.start('random', { options: { ...options, arrangement: true }, colour: 'white' }), options);
    await page.clock.fastForward(25000); await frame.locator('#wait-computer').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.status)).toBe('playing');
    expect(await page.evaluate(() => (window as any).harnessCalls.some((c: any) => c.name === 'kingdown_choose' && c.arguments.ready))).toBe(true);
    const solo = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    await buddy(page, 'kingdown_accept', { game_id: waiting.game_id }); await page.clock.runFor(5000); await frame.locator('#over.found[open]').waitFor();
    await frame.locator('#found-later').click(); expect(await frame.locator('#over').isVisible()).toBe(false);
    await expect.poll(() => frame.locator('html').evaluate((_, id) => (window as any).harnessApp.memory.games.some((g: any) => g.game_id === id && g.status === 'setup'), waiting.game_id)).toBe(true);
    expect(await frame.locator('html').evaluate(async (_, id) => (await (window as any).harnessApp.client.call('kingdown_get', { game_id: id }, { background: true }))._meta.view.status, solo)).toBe('playing');
  } finally { await page.close(); }
});
it('opens the human game when Abort is closed on the computer game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await clearWait(page); await freeze(page);
    const solo = await start(page, 'solo');
    const waiting = await frame.locator('html').evaluate(async (_, options) => {
      const app = (window as any).harnessApp;
      for (const name of ['kingdown_move','kingdown_computer']) {
        const view = app.memory.view; await app.call(name, { game_id: view.game_id, command_id: crypto.randomUUID(), expected_revision: view.revision, ...(name === 'kingdown_move' ? { lan: view.legal[0] } : {}) }, false, false, false);
      }
      const solo = app.memory.view.game_id, waiting = await app.start('random', { options, colour: 'white' }, { route: false });
      await app.call('kingdown_games', {}); await app.call('kingdown_resume', { game_id: solo }); return waiting;
    }, options);
    await buddy(page, 'kingdown_accept', { game_id: waiting.game_id }); await page.clock.runFor(5000); await frame.locator('#over.found[open]').waitFor();
    await frame.locator('#found-switch').click(); await frame.locator('#over.found[open]').waitFor({ state: 'hidden' });
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(waiting.game_id);
    expect(await frame.locator('html').evaluate(async (_, id) => (await (window as any).harnessApp.client.call('kingdown_get', { game_id: id }, { background: true }))._meta.view.status, solo.game_id)).toBe('playing');
  } finally { await page.close(); }
});
it('keeps Accept through handle Save when the board has no game', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await buddy(page, 'kingdown_create', { kind: 'random', options, colour: 'white' });
    await frame.locator('html').evaluate(() => {
      const app = (window as any).harnessApp, send = app.client.call; let blocked = false;
      app.client.call = async (name: string, args: any, opts: any) => {
        if (name === 'kingdown_accept' && !blocked) { blocked = true; return { isError: true, content: [{ type: 'text', text: 'Choose a handle first' }], _meta: { code: 'HANDLE_NEEDED' } }; }
        return send(name, args, opts);
      };
    });
    await hall(page); await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await frame.locator('#lobby-list .accept').first().waitFor();
    await frame.locator('#lobby-list .accept').first().click(); await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    await frame.locator('#save-handle').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('keeps Join through handle Save and sends nothing when Back cancels it', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const created = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'white' });
    const invite = await buddy(page, 'kingdown_invite', { game_id: created._meta.view.game_id });
    await frame.locator('html').evaluate(() => {
      const app = (window as any).harnessApp, send = app.client.call; let blocked = true; (window as any).ticketJoins = 0;
      app.client.call = async (name: string, args: any, opts: any) => {
        if (name === 'kingdown_handle' && !args?.check) blocked = false;
        if (name === 'kingdown_join' && !args?.preview) { (window as any).ticketJoins++; if (blocked) return { isError: true, content: [{ type: 'text', text: 'Choose a handle first' }], _meta: { code: 'HANDLE_NEEDED' } }; }
        return send(name, args, opts);
      };
    });
    await hall(page); await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(invite.structuredContent.code); await frame.locator('#join').click(); await frame.locator('#join-confirm').waitFor();
    await frame.locator('#join-confirm').click(); await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    expect(await page.evaluate(code => JSON.stringify((window as any).harnessWidgetState).includes(code), invite.structuredContent.code)).toBe(false);
    await frame.locator('#page-back').click(); await frame.locator('[data-screen="join"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).ticketJoins)).toBe(1);
    await frame.locator('#join-confirm').click(); await frame.locator('[data-screen="handle"]:not([hidden])').waitFor(); await frame.locator('#save-handle').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('shows the lobby name beside Accept without a button over the text', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await buddy(page, 'kingdown_create', { kind: 'random', options, colour: 'white' });
    await hall(page); await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click(); await frame.locator('#lobby-list .row-title').first().waitFor();
    expect(await frame.locator('#lobby-list .row-title').first().evaluate(el => {
      const box = el.getBoundingClientRect(), hit = document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
      return el.contains(hit) || hit?.closest('button')?.classList.contains('menu-row');
    })).toBe(true);
  } finally { await page.close(); }
});

it('retries Switch after Abort succeeds and Resume loses its reply', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await clearWait(page); await freeze(page);
    const waiting = await start(page, 'random');
    await page.clock.runFor(26000); await frame.locator('#wait-computer').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await buddy(page, 'kingdown_accept', { game_id: waiting.game_id });
    await page.clock.runFor(5000); await frame.locator('#over.found[open]').waitFor();
    await page.evaluate(() => { (window as any).dropNextReply = 'kingdown_resume'; });
    await frame.locator('#found-switch').click(); await frame.locator('#found-error').filter({ hasText: 'lost reply' }).waitFor();
    await frame.locator('#found-switch').click(); await frame.locator('#over.found[open]').waitFor({ state: 'hidden' });
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(waiting.game_id);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_abort').length)).toBe(1);
  } finally { await page.close(); }
});

it.each(['kingdown_create', 'kingdown_choose'])('finishes the computer handoff when %s needs Retry', async lost => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await clearWait(page); await freeze(page);
    await frame.locator('html').evaluate(async (_, options) => (window as any).harnessApp.start('random', { options: { ...options, arrangement: true }, colour: 'white' }), options);
    await page.clock.runFor(26000);
    await page.evaluate(lost => { (window as any).dropNextReply = lost; }, lost);
    await frame.locator('#wait-computer').click(); await frame.locator('#retry').waitFor();
    const command = await page.evaluate(lost => (window as any).harnessCalls.findLast((c: any) => c.name === lost), lost);
    if (lost === 'kingdown_create') {
      expect(await frame.locator('#wait-computer').isDisabled()).toBe(true);
      await frame.locator('#wait-computer').evaluate(button => button.dispatchEvent(new MouseEvent('click')));
      await frame.locator('#page-back').click(); await frame.locator('#retry').waitFor();
    }
    await frame.locator('#retry').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.status)).toBe('playing');
    const calls = await page.evaluate(() => (window as any).harnessCalls);
    const commands = calls.filter((c: any) => c.name === lost);
    expect(commands.map((c: any) => c.arguments.command_id)).toEqual([command.arguments.command_id, command.arguments.command_id]);
    expect(calls.findLast((c: any) => c.name === 'kingdown_choose').arguments.ready).toBe(true);
    expect(calls.findLast((c: any) => c.name === 'kingdown_get').arguments.since_revision).toBeUndefined();
    expect(await frame.locator('#board canvas').isVisible()).toBe(true);
  } finally { await page.close(); }
});

it('previews the current code after Back while the old preview loads', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const first = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'white' });
    const second = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'black' });
    const a = await buddy(page, 'kingdown_invite', { game_id: first._meta.view.game_id });
    const b = await buddy(page, 'kingdown_invite', { game_id: second._meta.view.game_id });
    await hall(page); await page.evaluate(() => { (window as any).holdNext = 'kingdown_join'; });
    await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(a.structuredContent.code); await frame.locator('#join').click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await frame.locator('#page-back').click(); await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(b.structuredContent.code); await frame.locator('#join').click();
    await page.evaluate(() => (window as any).releaseHeld());
    await frame.locator('#join-confirm').waitFor();
    expect(await frame.locator('#join-preview .line').last().textContent()).toContain('You play White.');
    await frame.locator('#join-confirm').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(second._meta.view.game_id);
    expect((await buddy(page, 'kingdown_get', { game_id: first._meta.view.game_id }))._meta.view.status).toBe('waiting');
  } finally { await page.close(); }
});

it('finds a joined random game when the computer page mounts again', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await clearWait(page); await freeze(page);
    const waiting = await frame.locator('html').evaluate(async (_, options) => (window as any).harnessApp.start('random', { options: { ...options, arrangement: true }, colour: 'white' }), options);
    await page.clock.runFor(26000); await frame.locator('#wait-computer').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const solo = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    const reads = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
    await page.locator('iframe').evaluate(el => { (el as HTMLIFrameElement).src = 'about:blank'; });
    await page.mainFrame().childFrames()[0].waitForURL('about:blank');
    await buddy(page, 'kingdown_accept', { game_id: waiting.game_id });
    await page.locator('#remount').click();
    await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, reads);
    await frame.locator('#over.found[open]').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id)).toBe(solo);
    await frame.locator('#found-switch').click(); await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).harnessView.game_id)).toBe(waiting.game_id);
  } finally { await page.close(); }
});

it('locks the Join input until a saved screen finishes its mount read', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const made = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'black' });
    const invite = await buddy(page, 'kingdown_invite', { game_id: made._meta.view.game_id });
    await start(page, 'solo');
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('join'));
    await page.evaluate(() => { (window as any).holdNextGet = true; });
    await page.locator('#remount').click();
    await page.waitForFunction(() => !!(window as any).releaseHeldGet);
    expect(await frame.locator('#join-code').isDisabled()).toBe(true);
    expect(await frame.locator('#join-entry button').isDisabled()).toBe(true);
    await page.evaluate(() => (window as any).releaseHeldGet());
    await frame.locator('#join-code:not(:disabled)').waitFor();
    await frame.locator('#join-code').fill(invite.structuredContent.code);
    await frame.locator('#join-entry button').click();
    await frame.locator('#join-confirm').waitFor();
  } finally { await page.evaluate(() => (window as any).releaseHeldGet?.()); await page.close(); }
});

it('keeps a bad code, hides the review and gives words for each code error', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await hall(page); await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill('ZZZZZZ'); await frame.locator('#join').click();
    await frame.locator('#join-message').filter({hasText:'No game has this code.'}).waitFor();
    expect(await frame.locator('#join-code').inputValue()).toBe('ZZZZZZ');
    for (const id of ['join-game-head','join-preview','join-decline','join-confirm']) expect(await frame.locator(`#${id}`).isVisible()).toBe(false);
    expect(await frame.locator('#join-help').textContent()).toBe('Enter the game code.');
    for (const [name,value] of [['autocapitalize','characters'],['autocomplete','off'],['spellcheck','false'],['enterkeyhint','go']]) expect(await frame.locator('#join-code').getAttribute(name)).toBe(value);
    await frame.locator('#join-code').fill('X'); expect(await frame.locator('#join-message').textContent()).toBe('');
    await frame.locator('#join-entry button').click(); await frame.locator('#join-message').filter({hasText:'6 letters and digits.'}).waitFor();
    expect(await frame.locator('#join-code').inputValue()).toBe('X');
    for (const [code,message,words] of [['INVITE_UNAVAILABLE','Invitation expired or used','This code has expired or was used. Ask your friend for a new code.'],['FORBIDDEN','You already have a seat','You cannot join this game.']]) {
      await page.evaluate(({code,message})=>(window as any).harnessShow({isError:true,content:[{type:'text',text:message}],_meta:{code}},true),{code,message});
      await frame.locator('#join-message').filter({hasText:words}).waitFor();
    }
  } finally { await page.close(); }
});

it('shows feature words and a fallback portrait in the join review', async () => {
  const page=await open(), frame=page.frameLocator('iframe');
  try {
    const made=await buddy(page,'kingdown_create',{kind:'friend',options:{...options,fairy:false,pool:[],classic:true},colour:'white'});
    const invite=await buddy(page,'kingdown_invite',{game_id:made._meta.view.game_id});
    await hall(page); await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(invite.structuredContent.code); await frame.locator('#join').click();
    await frame.locator('#join-confirm').waitFor();
    expect(await frame.locator('#join-preview .feats').textContent()).toBe('Classic chess');
    expect(await frame.locator('#join-preview .portrait img').getAttribute('src')).toContain('spirit');
    expect(await frame.locator('#join-help').textContent()).toBe('Review this game before you join.');
  } finally {await page.close();}
});

it('calls a newly opened game just opened and gives an opponent a fallback portrait', async () => {
  const page=await open(), frame=page.frameLocator('iframe');
  let game: string | undefined;
  try {
    const made=await buddy(page,'kingdown_create',{kind:'random',options,colour:'white'}); game=made._meta.view.game_id;
    await hall(page); await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click();
    await frame.locator('#lobby-list .menu-row').filter({hasText:'just opened'}).first().waitFor();
    expect(await frame.locator('#lobby-list .portrait img').first().getAttribute('src')).toContain('spirit');
  } finally { if(game) await buddy(page,'kingdown_cancel',{game_id:game}); await page.close(); }
});
// A failed read marks only the game it read. Join and Accept show a new game without a read, so the new board is current.
it.each(['join', 'accept'])('clears a failed read of the shown game when %s opens a new game', async path => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const shown = await start(page, 'solo'); await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await frame.locator('html').evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    await frame.locator('#status').filter({ hasText: 'Not current' }).waitFor();
    const created = await buddy(page, 'kingdown_create', { kind: path === 'join' ? 'friend' : 'random', options, colour: 'black' });
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('play'));
    if (path === 'join') {
      const { code } = (await buddy(page, 'kingdown_invite', { game_id: created._meta.view.game_id })).structuredContent;
      await frame.getByRole('radio', { name: 'A friend', exact: true }).locator('..').click(); await frame.locator('#token').fill(code); await frame.locator('#join').click();
      await frame.locator('#join-confirm').waitFor(); await frame.locator('#join-confirm').click();
    } else {
      await frame.getByRole('radio', { name: 'A random player', exact: true }).locator('..').click(); await frame.locator('#play-open').click();
      await frame.locator('#lobby-list .accept').first().waitFor(); await frame.locator('#lobby-list .accept').first().click();
    }
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const game = await frame.locator('html').evaluate(() => (window as any).harnessApp.memory.view.game_id);
    expect(game).not.toBe(shown.game_id);
    if (path === 'join') expect(game).toBe(created._meta.view.game_id);
    expect(await frame.locator('#status').textContent()).not.toBe('Not current');
    expect(await frame.locator('#retry').isVisible()).toBe(false);
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.gameActionsBlocked())).toBe(false);
  } finally { await page.close(); }
});
