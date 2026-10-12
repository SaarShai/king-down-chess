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
    expect(JSON.stringify(await page.evaluate(() => (window as any).harnessWidgetState)).includes(code.toUpperCase())).toBe(false);
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
it('reads the visible lobby every fifteen seconds and pauses while hidden', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  let waiting: string | undefined;
  try {
    await page.clock.install(); await page.clock.pauseAt(new Date());
    waiting = (await buddy(page, 'kingdown_create', { kind: 'random', options, colour: 'white' }))._meta.view.game_id;
    await frame.locator('#home-play').click(); await frame.locator('#random').click();
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
    await frame.locator('#random').click(); await expect.poll(reads).toBe(initial + 3);
    await page.clock.resume();
  } finally { if (waiting) await buddy(page, 'kingdown_cancel', { game_id: waiting }); await page.close(); }
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
it('keeps the five-second wait budget through the computer handoff, then uses fifteen seconds', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await page.clock.install(); await page.clock.pauseAt(new Date());
    await frame.locator('html').evaluate(() => {
      const host = parent as any, app = (window as any).harnessApp, send = app.client.call;
      host.ticketReads = [];
      app.client.call = async (name: string, args: any, options: any) => {
        const at = Date.now(), result = await send(name, args, options);
        if (name === 'kingdown_get') host.ticketReads.push({ at, background: options?.background === true });
        return result;
      };
    });
    await start(page, 'random');
    const advance = async (ms: number) => {
      const n = await page.evaluate(() => (window as any).ticketReads.length);
      await page.clock.runFor(ms); await expect.poll(() => page.evaluate(() => (window as any).ticketReads.length)).toBe(n+1);
    };
    for (let i=0;i<5;i++) await advance(5000); 
    await frame.locator('#page-back').click(); await frame.locator('#random').click(); await frame.locator('#find-opponent').click();
    await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    const reads = await page.evaluate(() => (window as any).ticketReads.length);
    await frame.locator('#wait-computer').click();
    await expect.poll(() => page.evaluate(() => (window as any).ticketReads.length)).toBeGreaterThan(reads);
    for (let i=5;i<24;i++) await advance(5000); 
    const count = await page.evaluate(() => (window as any).ticketReads.length);
    await page.clock.runFor(14999);
    expect(await page.evaluate(() => (window as any).ticketReads.length)).toBe(count);
    await advance(1); 
    const times = await page.evaluate(() => (window as any).ticketReads.map((r: any) => r.at));
    expect(times.at(-1)-times.at(-2)).toBe(15000);
    await frame.locator('html').evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    const hidden = await page.evaluate(() => (window as any).ticketReads.length); await page.clock.fastForward(30000); 
    expect(await page.evaluate(() => (window as any).ticketReads.length)).toBe(hidden); 
    await frame.locator('html').evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: false }); document.dispatchEvent(new Event('visibilitychange')); });
    await expect.poll(() => page.evaluate(() => (window as any).ticketReads.length)).toBeGreaterThan(hidden);
    await page.clock.resume();
    await page.evaluate(() => (window as any).harnessTeardown()); 
    const closed = await page.evaluate(() => (window as any).ticketReads.length); await page.clock.fastForward(30000);
    expect(await page.evaluate(() => (window as any).ticketReads.length)).toBe(closed);
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
    await start(page, 'random');
    await frame.locator('#page-back').click(); await page.evaluate(() => { (window as any).holdNext = 'kingdown_games'; });
    await frame.locator('#random').click(); await frame.locator('#find-opponent').click();
    await frame.locator('[data-screen="wait"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).releaseHeld?.());
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_find').length)).toBe(1);
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
    for (const [code, words] of [['INVITE_UNAVAILABLE','This code has expired or was used'],['FORBIDDEN','You cannot join this game'],['INVALID_INPUT','Check the code: 6 letters and digits'],['RATE_LIMITED','Too many code tries. Wait one hour.']]) {
      await page.evaluate(({ code }) => (window as any).harnessShow({ isError: true, content: [{ type: 'text', text: 'Server code error with an invitation link.' }], _meta: { code } }, true), { code });
      await frame.locator('#join-message').filter({ hasText: words }).waitFor();
      expect(await frame.locator('#join-message').textContent()).toBe(words);
    }
    const created = await buddy(page, 'kingdown_create', { kind: 'friend', options, colour: 'white' });
    const invite = await buddy(page, 'kingdown_invite', { game_id: created._meta.view.game_id });
    await frame.locator('#page-back').click(); await frame.locator('#token').fill(invite.structuredContent.code); await frame.locator('#join').click();
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
    await clearWait(page); await page.clock.install(); await page.clock.pauseAt(new Date());
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
    await clearWait(page); await page.clock.install(); await page.clock.pauseAt(new Date());
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
    await frame.locator('#home-play').click(); await frame.locator('#random').click(); await frame.locator('#lobby-list .accept').first().waitFor();
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
      const app = (window as any).harnessApp, send = app.client.call; let blocked = true; (parent as any).ticketJoins = 0;
      app.client.call = async (name: string, args: any, opts: any) => {
        if (name === 'kingdown_handle' && !args?.check) blocked = false;
        if (name === 'kingdown_join' && !args?.preview) { (parent as any).ticketJoins++; if (blocked) return { isError: true, content: [{ type: 'text', text: 'Choose a handle first' }], _meta: { code: 'HANDLE_NEEDED' } }; }
        return send(name, args, opts);
      };
    });
    await frame.locator('#home-play').click(); await frame.locator('#token').fill(invite.structuredContent.code); await frame.locator('#join').click(); await frame.locator('#join-confirm').waitFor();
    await frame.locator('#join-confirm').click(); await frame.locator('[data-screen="handle"]:not([hidden])').waitFor();
    expect(await page.evaluate(code => JSON.stringify((window as any).harnessWidgetState).includes(code), invite.structuredContent.code)).toBe(false);
    await frame.locator('#page-back').click(); await frame.locator('[data-screen="join"]:not([hidden])').waitFor();
    expect(await page.evaluate(() => (window as any).ticketJoins)).toBe(1);
    await frame.locator('#join-confirm').click(); await frame.locator('[data-screen="handle"]:not([hidden])').waitFor(); await frame.locator('#save-handle').click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
  } finally { await page.close(); }
});
it('shows the lobby name beside Accept without a button over the text', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await buddy(page, 'kingdown_create', { kind: 'random', options, colour: 'white' });
    await frame.locator('#home-play').click(); await frame.locator('#random').click(); await frame.locator('#lobby-list .row-title').first().waitFor();
    expect(await frame.locator('#lobby-list .row-title').first().evaluate(el => {
      const box = el.getBoundingClientRect(), hit = document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
      return el.contains(hit) || hit?.closest('button')?.classList.contains('menu-row');
    })).toBe(true);
  } finally { await page.close(); }
});

it('retries Switch after Abort succeeds and Resume loses its reply', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await clearWait(page); await page.clock.install(); await page.clock.pauseAt(new Date());
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
