// The client race journeys (design §7.1), moved out of plugin-journeys.test.ts. Each test waits for a fact
// (settled) and not for a time: no fixed wait stays here (design §7.7).
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { startHarness, waitForSourceApp } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => { folder = await mkdtemp(join(tmpdir(), 'kingdown-races-test-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
const CLASSIC = { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false };
// A phone host in fullscreen: touch on, so the touch hit layers (and their z-index) apply.
async function open({ width = 393, height = 852, top = 0, bottom = 0 } = {}) {
  const page = await browser.newPage({ viewport: { width, height } }); page.setDefaultTimeout(5000);
  await page.goto(harness.url); await sourceReady(page);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(([top, bottom]) => (window as any).harnessSetContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'], deviceCapabilities: { touch: true }, safeAreaInsets: { top, bottom, left: 0, right: 0 } }), [top, bottom]);
  return page;
}
const html = (page: Page) => page.frameLocator('iframe').locator('html');
const widget = (page: Page) => page.mainFrame().childFrames()[0];
// The frame load does not wait for the source module's dynamic import.
const sourceReady = waitForSourceApp;
// A view and a widget write can precede the mount's last list read and control unlock.
const mounted = (page: Page) => html(page).evaluate(async () => { await (window as any).harnessApp.queue.mountJob()?.promise; });
const tool = async (page: Page, path: string, name: string, args: Record<string, unknown> = {}) => (await page.request.post(new URL(path, harness.url).href, { data: { name, arguments: args } })).json();
const soloBoard = (page: Page) => html(page).evaluate(async (_, options) => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options }); }, CLASSIC);
const reads = (page: Page) => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
/** Waits until the frame's transport calls match the host's held calls, then one frame: each released reply is drawn. */
async function settled(page: Page) {
  const end = Date.now() + 5000;
  for (;;) {
    const held = await page.evaluate(() => (window as any).harnessHeld ?? 0);
    const done = await html(page).evaluate((_, held) => (window as any).harnessApp.client.inflight === held, held);
    if (done) break;
    if (Date.now() > end) throw new Error('settled: the frame still waits for a call');
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  await html(page).evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(undefined))));
}
async function friendGame(page: Page) {
  await html(page).evaluate(async (_, options) => { await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white', options }); }, CLASSIC);
  const code = await html(page).evaluate(async () => { const app = (window as any).harnessApp; return (await app.client.call('kingdown_invite', { game_id: app.memory.view.game_id })).structuredContent.code; });
  await tool(page, '/fixture-friend-tool', 'kingdown_join', { code });
  await html(page).evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
  return html(page).evaluate(() => { const app = (window as any).harnessApp; return { game: app.memory.view.game_id as string, board: app.client.state.board_id as string }; });
}
const shownGame = (page: Page) => html(page).evaluate(() => { const app = (window as any).harnessApp; return { game: app.memory.view?.game_id, screen: document.body.dataset.page, board: app.client.state.board_id }; });
const SOLO = { kind: 'solo', colour: 'white', options: CLASSIC };
const soloGame = async (page: Page) => (await tool(page, '/fixture-tool', 'kingdown_create', SOLO))._meta.view.game_id as string;
// A mount selects the game of a result with no board; the host holds the first call to either selection tool.
const SELECT = ['kingdown_open', 'kingdown_resume'];
const release = (hold: string) => (window as any)[hold === 'holdNext' ? 'releaseHeld' : 'releaseBefore']();
/** Runs in the frame: it shows this game on the board screen. */
const shows = (game: string) => (window as any).harnessApp.memory.view?.game_id === game && document.body.dataset.page === 'board';
/** From now on, records each page the frame shows and the board of each board read (a background read names none). */
async function watch(page: Page) {
  await html(page).evaluate(() => { const frame = window as any; frame.pages = []; new MutationObserver(() => frame.pages.push(document.body.dataset.page)).observe(document.body, { attributes: true, attributeFilter: ['data-page'] }); });
  const mark = await page.evaluate(() => (window as any).harnessCalls.length);
  return async () => ({ pages: await html(page).evaluate(() => (window as any).pages as string[]), reads: await page.evaluate(mark => (window as any).harnessCalls.slice(mark).filter((c: any) => c.name === 'kingdown_get' && c.arguments.board_id).map((c: any) => c.arguments.board_id) as string[], mark) });
}
/** Waits for the next widget write: a mount writes when it opens the screen of its result. */
async function nextWrite(page: Page, show: () => Promise<unknown>) {
  const writes = await page.evaluate(() => (window as any).harnessWidgetStates.length);
  await show(); await page.waitForFunction(n => (window as any).harnessWidgetStates.length > n, writes);
  await sourceReady(page);
}

it('counts a held call in the host and in the frame until its release', async () => {
  const page = await open();
  try {
    await soloBoard(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_get'; });
    await html(page).evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_get', {}); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    expect(await page.evaluate(() => (window as any).harnessHeld)).toBe(1);
    expect(await html(page).evaluate(() => (window as any).harnessApp.client.inflight)).toBe(1);
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect(await page.evaluate(() => (window as any).harnessHeld)).toBe(0);
    expect(await html(page).evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it.each([
  ['a slow board selection reply, and the newer result opens a new board', 'holdNext', true],
  ['a board selection that reaches the server late, and the newer result names no board', 'holdBeforeNext', false],
] as const)('shows the newest chat result at once after %s, and the older result never reads', async (_, hold, newBoard) => {
  const page = await open();
  try {
    const old = await friendGame(page), newer = await soloGame(page);
    // The model aborts the shown game. Its result names the game but no board, so the page selects it; the host holds that.
    const aborted = await tool(page, '/fixture-tool', 'kingdown_abort', { game_id: old.game });
    expect(aborted._meta.board_id).toBeUndefined();
    await page.evaluate(([name, tools]) => { (window as any)[name] = tools; }, [hold, SELECT] as const);
    await page.evaluate(result => (window as any).harnessShow(result), aborted);
    await page.waitForFunction(name => !!(window as any)[name === 'holdNext' ? 'releaseHeld' : 'releaseBefore'], hold);
    // Then the model shows the new game: kingdown_open names a new board; a game summary names none.
    const next = newBoard ? await tool(page, '/fixture-tool', 'kingdown_open', { game_id: newer }) : { content: [], structuredContent: { game_id: newer } };
    const seen = await watch(page);
    await page.evaluate(result => (window as any).harnessShow(result), next);
    // The newer result does not wait for the older mount's call, which has no client time limit.
    await widget(page).waitForFunction(shows, newer);
    await page.evaluate(release, hold);
    await settled(page);
    const shown = await shownGame(page);
    expect(shown).toMatchObject({ game: newer, screen: 'board' });
    if (newBoard) expect(shown.board).toBe(next._meta.board_id);
    // The older mount stops: it reads no board, so the aborted game's end screen never shows.
    const { pages, reads } = await seen();
    expect(pages).not.toContain('end');
    expect(new Set(reads)).toEqual(new Set([shown.board]));
    // The server agrees: the page's board selects the newer game, so the next read keeps it.
    expect((await tool(page, '/fixture-tool', 'kingdown_get', { board_id: shown.board }))._meta.view.game_id).toBe(newer);
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseBefore?.(); }); await page.close(); }
});

it.each([
  ['its reply comes late', 'holdNext'],
  ['it reaches the server late', 'holdBeforeNext'],
] as const)('shows a chat result that comes while a game the player tapped selects, and %s', async (_, hold) => {
  const page = await open();
  try {
    const { board } = await friendGame(page), tapped = await soloGame(page), chat = await soloGame(page);
    // The player taps another game in Your games: the page selects it on its board.
    await page.evaluate(name => { (window as any)[name] = 'kingdown_resume'; }, hold);
    await html(page).evaluate((_, game_id) => { void (window as any).harnessApp.call('kingdown_resume', { game_id }); }, tapped);
    await page.waitForFunction(name => !!(window as any)[name === 'holdNext' ? 'releaseHeld' : 'releaseBefore'], hold);
    // Then a chat result for another game comes: a slow reply with kingdown_open's new board, or a late call with a game summary.
    const result = hold === 'holdNext' ? await tool(page, '/fixture-tool', 'kingdown_open', { game_id: chat }) : { content: [], structuredContent: { game_id: chat } };
    await nextWrite(page, () => page.evaluate(result => (window as any).harnessShow(result), result));
    if (hold === 'holdBeforeNext') await page.waitForFunction(game => (window as any).harnessCalls.some((c: any) => c.name !== 'kingdown_get' && c.arguments?.game_id === game), chat);
    await page.evaluate(release, hold);
    await widget(page).waitForFunction(shows, chat);
    await settled(page);
    const shown = await shownGame(page);
    expect(shown).toMatchObject({ game: chat, screen: 'board' });
    if (hold === 'holdNext') expect(shown.board).toBe(result._meta.board_id);
    expect(shown.board).not.toBe(board);
    // The server agrees: the page's board selects the chat game, so the next read keeps it.
    expect((await tool(page, '/fixture-tool', 'kingdown_get', { board_id: shown.board }))._meta.view.game_id).toBe(chat);
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseBefore?.(); }); await page.close(); }
});

/** Starts a friend game on the page; it waits for the friend, so the page shows the friend screen. */
async function waitingFriendGame(page: Page) {
  await html(page).evaluate(async (_, options) => { await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white', options }); }, CLASSIC);
  return html(page).evaluate(() => (window as any).harnessApp.memory.view.game_id as string);
}
const locks = (page: Page) => html(page).evaluate(() => ({ locked: (document.getElementById('home-play') as HTMLButtonElement).disabled, error: document.getElementById('error')!.textContent, home: document.getElementById('home-error')!.textContent }));

it.each([
  ['its reply comes late', 'holdNext'],
  ['it reaches the server late', 'holdBeforeNext'],
] as const)('reads and opens Seat after a chat result opens Board while Choose for the same game waits, and %s', async (_, hold) => {
  const page = await open();
  try {
    await html(page).evaluate(async () => {
      await (window as any).harnessApp.call('kingdown_create', { kind: 'friend', colour: 'white', options: { fairy: true, pool: ['R','A','G','Q','M','S','O'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: false } });
    });
    const game = (await shownGame(page)).game as string;
    expect((await tool(page, '/fixture-friend-tool', 'kingdown_accept', { game_id: game })).isError).toBeFalsy();
    await html(page).evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
    await page.frameLocator('iframe').locator('[data-screen="seat"]:not([hidden])').waitFor();
    await page.evaluate(name => { (window as any)[name] = 'kingdown_choose'; }, hold);
    await html(page).evaluate(() => {
      const app = (window as any).harnessApp, view = app.memory.view;
      void app.call('kingdown_choose', { game_id: view.game_id, command_id: 'mount-choose', expected_revision: view.revision, king: null, order: view.draw, ready: true }, true, false, false);
    });
    await page.waitForFunction(name => !!(window as any)[name === 'holdNext' ? 'releaseHeld' : 'releaseBefore'], hold);
    const before = await reads(page);
    const result = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: game });
    await nextWrite(page, () => page.evaluate(result => (window as any).harnessShow(result), result));
    expect(await reads(page)).toBe(before);
    await page.evaluate(release, hold);
    await mounted(page);
    // Read all six fields in one frame state. Separate reads can span a screen change.
    await widget(page).waitForFunction(({ game, board }) => {
      const app = (window as any).harnessApp, doc = document;
      return app.memory.view?.game_id === game && app.client.state.board_id === board && doc.body.dataset.page === 'seat'
        && !doc.getElementById('home-play')!.hasAttribute('disabled') && doc.getElementById('error')!.textContent === '' && doc.getElementById('home-error')!.textContent === '';
    }, { game, board: result._meta.board_id }, { timeout: 1000 })
      .catch(async e => { throw new Error(`${e.message}; the state: ${JSON.stringify({ ...await shownGame(page), ...await locks(page) })}`); });
    expect(await reads(page)).toBeGreaterThan(before);
    expect(await html(page).evaluate(() => { const app = (window as any).harnessApp; return { status: app.memory.view.status, ready: app.memory.view.ready[app.memory.view.seat], pending: app.client.state.pending }; })).toEqual({ status: 'setup', ready: true, pending: undefined });
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseBefore?.(); }); await page.close(); }
});

it.each([
  ['the shown game', 'shown', 'board'],
  ['the shown game, which waits for a friend', 'waiting', 'friend'],
  ['another game', 'other', 'board'],
] as const)('shows a chat result for %s at once while an older chat result reads, and the older read shows nothing', async (_, kind, screen) => {
  const page = await open();
  try {
    const game = kind === 'waiting' ? await waitingFriendGame(page) : kind === 'shown' ? (await friendGame(page)).game : (await friendGame(page), await soloGame(page));
    const other = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: await soloGame(page) }), newer = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: game });
    // The model opens another game, and the host holds the reply to its read. Then the model opens the game.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_get'; });
    await page.evaluate(result => (window as any).harnessShow(result), other);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.evaluate(result => (window as any).harnessShow(result), newer);
    // The newer result stops the older read, so it does not wait for it (up to the 10 s client limit). Its own read
    // opens the screen of the game status, and the controls unlock.
    await widget(page).waitForFunction(([game, screen]) => (window as any).harnessApp.memory.view?.game_id === game && document.body.dataset.page === screen && !(document.getElementById('home-play') as HTMLButtonElement).disabled, [game, screen]);
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect(await shownGame(page)).toEqual({ game, screen, board: newer._meta.board_id });
    expect((await tool(page, '/fixture-tool', 'kingdown_get', { board_id: newer._meta.board_id }))._meta.view.game_id).toBe(game);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it.each([
  ['the shown game', 'game'],
  ['the Play screen', 'play'],
  ['the Profile screen', 'profile'],
] as const)('keeps the board of a chat result for %s that comes while a game the player tapped selects', async (_, kind) => {
  const page = await open();
  try {
    const { game } = await friendGame(page), tapped = await soloGame(page);
    const chat = await tool(page, '/fixture-tool', 'kingdown_open', kind === 'game' ? { game_id: game } : { screen: kind });
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_resume'; });
    await html(page).evaluate((_, game_id) => { void (window as any).harnessApp.call('kingdown_resume', { game_id }); }, tapped);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await nextWrite(page, () => page.evaluate(result => (window as any).harnessShow(result), chat));
    // The tapped game's reply comes after the chat result. The chat result is newer, so its board and screen stay.
    await page.evaluate(() => (window as any).releaseHeld());
    const expected = { game: kind === 'game' ? game : undefined, screen: kind === 'game' ? 'board' : kind, board: chat._meta.board_id };
    await settled(page);
    expect(await shownGame(page)).toEqual(expected);
    // The server agrees, so a poll, Reload or a remount keeps the page as it is.
    expect((await tool(page, '/fixture-tool', 'kingdown_get', { board_id: expected.board }))._meta?.view?.game_id).toBe(expected.game);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it.each([
  ['Profile', { screen: 'profile' }, 'profile'],
  ['home', {}, 'home'],
  ['Play', { screen: 'play' }, 'play'],
  ['join error', undefined, 'join'],
] as const)('keeps the screen of a newer %s result when an older chat result reads its games list', async (_, args, screen) => {
  const page = await open();
  try {
    await friendGame(page);
    const older = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: await soloGame(page) });
    const newer = args ? await tool(page, '/fixture-tool', 'kingdown_open', args) : { isError: true, content: [{ type: 'text', text: 'Invitation expired or used' }], _meta: { code: 'INVITE_UNAVAILABLE' } };
    // The older result reads its board, then its games list; the host holds the list.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_games'; });
    await page.evaluate(result => (window as any).harnessShow(result), older);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.evaluate(result => (window as any).harnessShow(result, true), newer);
    await widget(page).waitForFunction(screen => document.body.dataset.page === screen, screen);
    const seen = await watch(page);
    // The older list comes late; the older result does not open its game.
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect((await shownGame(page)).screen).toBe(screen);
    expect((await seen()).pages.filter(shown => shown !== screen)).toEqual([]);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('keeps the newer games list when an older chat result reads its list late', async () => {
  const page = await open();
  try {
    await soloBoard(page);
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_games'; });
    await page.evaluate(result => (window as any).harnessShow(result, true), await tool(page, '/fixture-tool', 'kingdown_open', { screen: 'play' }));
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // The model makes a game and opens it; its result reads the newer list.
    const made = await soloGame(page);
    await page.evaluate(result => (window as any).harnessShow(result), await tool(page, '/fixture-tool', 'kingdown_open', { game_id: made }));
    await widget(page).waitForFunction(shows, made);
    await mounted(page);
    const listed = () => html(page).evaluate((_, game) => (window as any).harnessApp.memory.games.some((entry: any) => entry.game_id === game), made);
    expect(await listed()).toBe(true);
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect(await listed()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

// The owner's item W6 a: the page sends the waiting move again by itself, so no error and no Retry show.
it('sends a move that waited over a remount again by itself when a chat result for its game comes during the first read', async () => {
  const page = await open();
  try {
    const { game } = await friendGame(page);
    // The move's reply never comes: the host remounts the widget while it waits.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await html(page).evaluate(() => { const app = (window as any).harnessApp; void app.call('kingdown_move', { game_id: app.memory.view.game_id, command_id: 'remount-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.evaluate(() => { const host = window as any; host.releaseMove = host.releaseHeld; host.releaseHeld = undefined; host.holdNext = 'kingdown_games'; });
    const again = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: game });
    await page.locator('#remount').click();
    // The first read after the remount holds its games list; then the model opens the game again.
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await nextWrite(page, () => page.evaluate(result => (window as any).harnessShow(result), again));
    await page.evaluate(() => (window as any).releaseHeld());
    await mounted(page);
    await html(page).evaluate(async () => { await (window as any).harnessApp.queue.idle(); });
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.command_id))).toEqual(['remount-move', 'remount-move']);
    await expect.poll(() => page.evaluate(() => (window as any).harnessWidgetState?.privateContent?.pending ?? null)).toBeNull();
    expect(await html(page).evaluate(() => ({ retry: document.getElementById('retry')!.hidden, error: document.getElementById('error')!.textContent, game: (window as any).harnessApp.memory.view?.game_id }))).toEqual({ retry: true, error: '', game });
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseMove?.(); }); await page.close(); }
});

it('keeps the controls locked, with no error, when a newer chat result stops an older one', async () => {
  const page = await open();
  try {
    await friendGame(page);
    const older = await soloGame(page), newer = await soloGame(page);
    // Both results name a game and no board, so each selects its game on a new board. The host holds the older
    // selection's reply, then the newer selection before the server runs it.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_open'; });
    await page.evaluate(game_id => (window as any).harnessShow({ content: [], structuredContent: { game_id } }), older);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_open'; });
    await page.evaluate(game_id => (window as any).harnessShow({ content: [], structuredContent: { game_id } }), newer);
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    // The older result stops at once. The newer one still selects its game, so the controls stay locked.
    expect(await locks(page)).toEqual({ locked: true, error: '', home: '' });
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect(await locks(page)).toEqual({ locked: true, error: '', home: '' });
    await page.evaluate(() => (window as any).releaseBefore());
    await widget(page).waitForFunction(shows, newer);
    await mounted(page);
    expect(await locks(page)).toEqual({ locked: false, error: '', home: '' });
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseBefore?.(); }); await page.close(); }
});

it('locks the page at once when a chat result comes, while its selection waits', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // The chat result names a game and no board, so the mount selects the game's board first; the host holds that call.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_open'; });
    await page.evaluate(game_id => (window as any).harnessShow({ content: [], structuredContent: { game_id } }, true), (await shownGame(page)).game);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // The lock shows at once, with no text, while the mount waits (design §2 and §3.3).
    expect(await html(page).evaluate(() => ({ mounting: (window as any).harnessApp.store.page().mounting, play: (document.getElementById('home-play') as HTMLButtonElement).disabled, reload: (document.getElementById('reload') as HTMLButtonElement).disabled, error: document.getElementById('error')!.textContent }))).toEqual({ mounting: true, play: true, reload: true, error: '' });
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    await expect.poll(() => locks(page)).toEqual({ locked: false, error: '', home: '' });
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('sends a start that a chat result detached only once, and keeps the chat result on its screen', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await html(page).evaluate(() => (window as any).harnessApp.navigate('play'));
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    // The start waits at the host: its body has not ended, so the mount must not send it again (design §5.3).
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    await html(page).evaluate(async (_, options) => { void (window as any).harnessApp.start('solo', { options, colour: 'white' }); }, CLASSIC);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.evaluate(result => (window as any).harnessShow(result), await tool(page, '/fixture-tool', 'kingdown_open', { screen: 'play' }));
    await page.waitForFunction(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length > 0);
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    const creates = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_create' || c.name === 'kingdown_find').map((c: any) => c.arguments.command_id));
    expect(creates).toHaveLength(1);
    expect(await shownGame(page)).toMatchObject({ screen: 'play' });
    // The older start settles its own pending (design §1.2): Play keeps its Start, with no Retry.
    await expect.poll(() => html(page).evaluate(() => { const app = (window as any).harnessApp; return { pending: app.client.state.pending ?? null, start: (document.getElementById('setup-start') as HTMLButtonElement).disabled, retry: document.getElementById('retry')!.hidden }; })).toEqual({ pending: null, start: false, retry: true });
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it.each(['same game', 'other game', 'failed read'] as const)('keeps a command refusal only for its game after a chat result reads: %s', async kind => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const game = (await shownGame(page)).game!;
    const chat = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: kind === 'other game' ? await soloGame(page) : game });
    const name = kind === 'failed read' ? 'kingdown_invite' : 'kingdown_move';
    await page.evaluate(name => { (window as any).holdBeforeNext = name; }, name);
    await html(page).evaluate((_, name) => {
      const app = (window as any).harnessApp, v = app.memory.view;
      // Invite has no rollback read, so the next read belongs to the mount.
      void app.call(name, name === 'kingdown_invite' ? { game_id: v.game_id } : { game_id: v.game_id, command_id: 'refused-during-mount', expected_revision: v.revision, lan: 'e2-e5' }, name === 'kingdown_move');
    }, name);
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    await nextWrite(page, () => page.evaluate(result => (window as any).harnessShow(result), chat));
    if (kind === 'failed read') await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await page.evaluate(() => (window as any).releaseBefore());
    await frame.locator('#home-play:not(:disabled)').waitFor({ state: 'attached' });
    expect(await frame.locator('#error').textContent()).toBe(kind === 'other game' ? '' : kind === 'failed read' ? 'Harness saved-game read failed' : 'This move is not available. Choose another move.');
    expect(await frame.locator('#retry').isVisible()).toBe(kind === 'failed read');
    expect((await shownGame(page)).board).toBe(chat._meta.board_id);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

it.each([
  ['Join', 'profile', false], ['Join', 'game', false], ['Accept', 'profile', false], ['Accept', 'game', false],
  ['Join', 'profile', true], ['Accept', 'profile', true],
] as const)('keeps the %s button reply off a newer chat %s result (name needed: %s)', async (button, destination, needsHandle) => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    if (button === 'Accept') {
      // Find would join Alice's open table from an earlier test instead of opening Bob's table.
      const inbox = await tool(page, '/fixture-tool', 'kingdown_games');
      for (const game of inbox._meta.games) if (game.kind === 'random' && game.status === 'waiting') await tool(page, '/fixture-tool', 'kingdown_cancel', { game_id: game.game_id });
    }
    const made = await tool(page, '/fixture-friend-tool', 'kingdown_create', { kind: button === 'Join' ? 'friend' : 'random', colour: 'white', options: CLASSIC });
    const joined = made._meta.view.game_id as string;
    if (button === 'Join') {
      const invite = await tool(page, '/fixture-friend-tool', 'kingdown_invite', { game_id: joined });
      await html(page).evaluate((_, code) => { const app = (window as any).harnessApp; app.memory.code = code; app.navigate('join'); }, invite.structuredContent.code);
      await frame.locator('#join-confirm:not([hidden]):not(:disabled)').waitFor();
    } else {
      await html(page).evaluate(() => (window as any).harnessApp.navigate('lobby'));
      await frame.locator('#lobby-list button').first().waitFor();
    }
    if (needsHandle) await page.route('**/fixture-tool', route => {
      const name = route.request().postDataJSON()?.name;
      return name === (button === 'Join' ? 'kingdown_join' : 'kingdown_accept')
        ? route.fulfill({ json: { isError: true, content: [{ type: 'text', text: 'Pick a name and picture first.' }], _meta: { code: 'HANDLE_NEEDED' } } })
        : route.continue();
    });
    await page.evaluate(name => { (window as any).holdNext = name; }, button === 'Join' ? 'kingdown_join' : 'kingdown_accept');
    await frame.locator(button === 'Join' ? '#join-confirm' : '#lobby-list button').first().click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    const game = destination === 'game' ? await soloGame(page) : undefined;
    const chat = await tool(page, '/fixture-tool', 'kingdown_open', game ? { game_id: game } : { screen: 'profile' });
    await nextWrite(page, () => page.evaluate(result => (window as any).harnessShow(result), chat));
    await mounted(page);
    await frame.locator('#home-play:not(:disabled)').waitFor({ state: 'attached' });
    const expected = { game, screen: game ? 'board' : 'profile', board: chat._meta.board_id };
    expect(await shownGame(page)).toEqual(expected);
    const seen = await watch(page);
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect(await shownGame(page)).toEqual(expected);
    expect((await seen()).pages.filter(screen => screen !== expected.screen)).toEqual([]);
    expect((await tool(page, '/fixture-tool', 'kingdown_get', { board_id: expected.board }))._meta?.view?.game_id).toBe(game);
    // The creator can read the game even when the name request prevents Join or Accept.
    expect((await tool(page, '/fixture-friend-tool', 'kingdown_get', { game_id: joined }))._meta.view.status).toBe(needsHandle ? 'waiting' : 'playing');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

// The independent review faults (design §7.5). The epoch gate, the queue and the reducer (S2, S3) fix each one, so
// each test records the wanted behaviour now and fails on this build.
const CANNOT_CONNECT = 'Cannot connect. Check your connection, then try again.';

it('R1: keeps a command refusal for the shown game after a chat result reads (a.out 1)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const game = (await shownGame(page)).game!;
    // A chat result names the same game and no board, so the mount selects its own board; the host holds that selection.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_open'; });
    await page.evaluate(game_id => (window as any).harnessShow({ content: [], structuredContent: { game_id } }), game);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // While the mount waits, the server refuses a move for that game.
    await page.evaluate(() => { (window as any).rejectNextMove = 'STALE_REVISION'; });
    await html(page).evaluate(async (_, game_id) => {
      const app = (window as any).harnessApp, view = app.memory.view;
      await app.call('kingdown_move', { game_id, command_id: 'r1-refused', expected_revision: view.revision, lan: 'e2-e4' }, true);
    }, game);
    await frame.locator('#error').filter({ hasText: 'Harness definitive rejection' }).waitFor();
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    // The mount read keeps the refusal for its own game, with no Retry.
    expect(await frame.locator('#error').textContent()).toBe('Harness definitive rejection');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('R2: a failed start does not lock another game (a.out 2)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const { game: friend } = await friendGame(page);
    await html(page).evaluate(() => (window as any).harnessApp.navigate('play'));
    await frame.getByRole('radio', { name: 'Computer', exact: true }).locator('..').click();
    await page.clock.install();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_create'; });
    // This action has no navigation; wait for its held create request.
    await frame.locator('#setup-start').click({ noWaitAfter: true });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    await page.clock.fastForward(5_001);
    await frame.locator('[data-screen="play"] [data-nav="settings"]').click();
    await page.clock.fastForward(5_000);
    await frame.locator('#page-back').click();
    await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    await frame.locator(`#games-list [data-game-id="${friend}"]:not(:disabled)`).click();
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // Changed (fault b): the start's text and Retry show on Play only; the other game plays.
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    expect(await frame.locator('#board-menu').isEnabled()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('R3: a poll reply does not replace the screen that a chat result chose (a.out 3)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // A poll is in flight, and its reply brings a new revision.
    const view = await html(page).evaluate(() => (window as any).harnessApp.memory.view);
    await page.evaluate(next => { (window as any).harnessNextView = next; (window as any).holdNext = 'kingdown_get'; }, { ...view, revision: view.revision + 1 });
    await html(page).evaluate((_, revision) => { const frame = window as any; frame.pollSettled = false; void frame.harnessApp.call('kingdown_get', { since_revision: revision }, false, true, true).then(() => { frame.pollSettled = true; }); }, view.revision);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    expect(await html(page).evaluate(() => (window as any).pollSettled)).toBe(false);
    expect(await html(page).evaluate(() => (window as any).harnessApp.client.inflight)).toBe(1);
    // The chat opens Profile; its games list waits too.
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_games'; });
    await page.evaluate(result => (window as any).harnessShow(result, true), await tool(page, '/fixture-tool', 'kingdown_open', { screen: 'profile' }));
    await frame.locator('[data-screen="profile"]:not([hidden])').waitFor();
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    // The poll reply is older than the chat result, so Profile stays.
    await settled(page);
    expect(await html(page).evaluate(() => (window as any).harnessApp.client.inflight)).toBe(2);
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    await page.evaluate(() => (window as any).releaseBefore());
    await settled(page);
    expect(await shownGame(page)).toMatchObject({ screen: 'profile' });
    expect(await html(page).evaluate(() => (window as any).harnessApp.memory.view)).toBeUndefined();
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseBefore?.(); }); await page.close(); }
});

it('R8: another game does not drop a failed command for the game it belongs to (a.out 8)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const game = (await shownGame(page)).game!;
    // The resign cannot reach the server.
    await page.context().setOffline(true);
    await frame.locator('#board-menu:not(:disabled)').click();
    await frame.locator('#menu-resign').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Resign', exact: true }).click();
    await expect.poll(() => frame.locator('#error').textContent(), { timeout: 5000 }).toBe(CANNOT_CONNECT);
    await page.context().setOffline(false);
    // Then the player opens another game.
    const other = await soloGame(page);
    await html(page).evaluate(async (_, game_id) => { await (window as any).harnessApp.call('kingdown_resume', { game_id }); }, other);
    await expect.poll(() => shownGame(page).then(shown => shown.game)).toBe(other);
    // The failed resign stays with its own game.
    expect((await html(page).evaluate(() => (window as any).harnessApp.client.state.pending))?.game_tag).toBe(game.slice(0, 8));
  } finally { await page.context().setOffline(false).catch(() => {}); await page.close(); }
});

it('R9: a failed connect shows an enabled Try again that connects again (a.out 9)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const mounts = await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length);
    await page.evaluate(() => { (window as any).rejectNextConnect = true; });
    await page.locator('#remount').click();
    const line = frame.locator('#error, #home-error').filter({ hasText: 'Could not connect to the game' });
    await line.waitFor();
    // The widget offers a Try again that connects again and mounts the page.
    const retry = frame.locator('#retry');
    expect(await retry.isVisible()).toBe(true);
    expect(await retry.isEnabled()).toBe(true);
    await retry.click();
    await sourceReady(page);
    await frame.locator('#home-play:not(:disabled)').waitFor({ state: 'attached' });
    await expect.poll(() => line.count(), { timeout: 5000 }).toBe(0);
    await expect.poll(() => page.evaluate(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_games').length, mounts)).toBeGreaterThan(mounts);
  } finally { await page.close(); }
});

it('R3b: a poll reply does not leave the screen the player opened (a.out 3, user navigation)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const view = await html(page).evaluate(() => (window as any).harnessApp.memory.view);
    // A poll is in flight, and its reply brings a game that has ended.
    await page.evaluate(next => { (window as any).harnessNextView = next; (window as any).holdNext = 'kingdown_get'; }, { ...view, revision: view.revision + 1, status: 'finished' });
    await html(page).evaluate((_, revision) => { void (window as any).harnessApp.call('kingdown_get', { since_revision: revision }, false, true, true); }, view.revision);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // The player opens Settings while the poll waits.
    await html(page).evaluate(() => (window as any).harnessApp.navigate('settings'));
    await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    // A poll routes only between the game screens of the shown game. It never leaves the player's screen.
    expect(await html(page).evaluate(() => document.body.dataset.page)).toBe('settings');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

// This fault is masked on the merged base: the chat result's own mount read runs after the refusal and clears the
// message line, so the refused move's words do not stay on the chat board (a.out 4). The test records the wanted
// behaviour for S3, like R3.
it('R4: a refused move on A does not write its words on the chat board B (a.out 4)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const a = await friendGame(page);
    const b = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: await soloGame(page) });
    // A move on A is in flight: the server refuses it (an illegal move), and the host holds the refusal.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_move'; });
    await html(page).evaluate((_, game_id) => {
      const app = (window as any).harnessApp;
      void app.call('kingdown_move', { game_id, command_id: 'r4-refused', expected_revision: app.memory.view.revision, lan: 'e2-e7' }, true);
    }, a.game);
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // A chat result selects board B while the refusal waits at the host.
    await page.evaluate(result => (window as any).harnessShow(result), b);
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    // The refusal belongs to A's board only. B keeps an empty message line.
    expect(await frame.locator('#error').textContent()).toBe('');
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('R5: a refused Abort leaves the board menu (a.out 5)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const a = await friendGame(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const chat = await tool(page, '/fixture-tool', 'kingdown_get', { game_id: a.game });
    // The server refuses the abort that the board still offers, and the host holds its reply before the server runs.
    await page.evaluate(() => { (window as any).holdBeforeNext = 'kingdown_abort'; (window as any).rejectNextAction = { name: 'kingdown_abort', code: 'NOT_ALLOWED', text: 'Abort is closed' }; });
    await frame.locator('#board-menu:not(:disabled)').click();
    await frame.locator('#menu-abort').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Abort', exact: true }).click();
    await page.waitForFunction(() => !!(window as any).releaseBefore);
    // A chat result arrives while the refusal waits: its mount read waits behind the command.
    await page.evaluate(result => (window as any).harnessShow(result), chat);
    // The refusal ends the command; the mount read resumes and must not erase the refusal.
    await page.evaluate(() => (window as any).releaseBefore());
    await settled(page);
    expect(await frame.locator('#error').textContent()).toBe('Abort is closed');
    // The refused action does not offer itself again.
    await frame.locator('#board-menu:not(:disabled)').click();
    expect(await frame.locator('#menu-abort').count()).toBe(0);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('R5: a stale-revision Abort keeps Abort in the board menu', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // Another command changed the revision after the sheet opened; Abort itself is still open.
    await page.evaluate(() => { (window as any).rejectNextAction = { name: 'kingdown_abort', code: 'STALE_REVISION', text: 'The game changed; reload before you act' }; });
    await frame.locator('#board-menu:not(:disabled)').click();
    await frame.locator('#menu-abort').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Abort', exact: true }).click();
    await settled(page);
    expect(await frame.locator('#error').textContent()).toBe('The game changed; reload before you act');
    await frame.locator('#board-menu:not(:disabled)').click();
    expect(await frame.locator('#menu-abort').count()).toBe(1);
  } finally { await page.close(); }
});

it('routes a newer chat game to its own screen when an older board command replies during its mount', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await friendGame(page);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    // Game B waits for a friend, so its own screen is Friend, not Board.
    const created = await tool(page, '/fixture-tool', 'kingdown_create', { kind: 'friend', colour: 'white', options: CLASSIC });
    const b = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: created._meta.view.game_id });
    // The draw offer on A runs on the server; the host holds its reply. A stays in play.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_draw'; });
    await frame.locator('#board-menu:not(:disabled)').click();
    await frame.locator('#menu-draw').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Offer draw', exact: true }).click();
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // The chat result for B mounts: it selects B's board, and its board read waits behind the draw offer.
    await page.evaluate(result => (window as any).harnessShow(result), b);
    await widget(page).waitForFunction(board => (window as any).harnessApp.client.state.board_id === board, b._meta.board_id);
    // The superseded draw reply must not stop the mount: B goes to its own screen.
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    await mounted(page);
    expect(await shownGame(page)).toEqual({ game: created._meta.view.game_id, screen: 'friend', board: b._meta.board_id });
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('R7: a move with a view clears Try again and its read text (a.out 7)', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    const game = await html(page).evaluate(() => (window as any).harnessApp.memory.view.game_id as string);
    // A failed foreground read shows Try again, its sentence and "Not current".
    await page.evaluate(() => { (window as any).rejectNextGet = true; });
    await html(page).evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}); });
    await frame.locator('#retry').waitFor();
    expect(await frame.locator('#error').textContent()).toBe('Harness saved-game read failed');
    expect(await frame.locator('#status').textContent()).toBe('Not current');
    // A move succeeds with a view: the good view clears the read notice, its text and Try again.
    await html(page).evaluate(async (_, game_id) => {
      const app = (window as any).harnessApp;
      await app.call('kingdown_move', { game_id, command_id: 'r7-move', expected_revision: app.memory.view.revision, lan: 'e2-e4' }, true);
    }, game);
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
    expect(await frame.locator('#status').textContent()).not.toBe('Not current');
  } finally { await page.close(); }
});

it('R6: a command that starts while a read is in flight waits for it and runs (a.out 6)', async () => {
  const page = await open();
  try {
    await soloBoard(page);
    const game = await html(page).evaluate(() => (window as any).harnessApp.memory.view.game_id as string);
    // A foreground read is in flight.
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_get'; });
    await html(page).evaluate(() => { void (window as any).harnessApp.call('kingdown_get', {}); });
    await page.waitForFunction(() => !!(window as any).releaseHeld);
    // A board command starts while the read still waits: it must wait for the read and run, not be dropped.
    const outcome = await html(page).evaluate(async (_, game_id) => (window as any).harnessApp.call('kingdown_move', { game_id, command_id: 'r6-waits', expected_revision: (window as any).harnessApp.memory.view.revision, lan: 'e2-e4' }, true), game);
    expect(outcome).toBeTruthy();
    await page.evaluate(() => (window as any).releaseHeld());
    await settled(page);
    expect(await page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move').map((c: any) => c.arguments.command_id))).toEqual(['r6-waits']);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('R10: a remount keeps a waiting move on A and sends nothing to the shown game (a.out 10)', async () => {
  const page = await open();
  try {
    const a = await friendGame(page);
    const b = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: await soloGame(page) });
    const revision = await html(page).evaluate(() => (window as any).harnessApp.memory.view.revision as number);
    // The saved widget state names board B while A's move waits (its reply was lost at the teardown).
    await page.evaluate(([board, tag, rev]) => {
      (window as any).harnessDropWidgetWrites = true;
      (window as any).harnessWidgetState = { modelContent: {}, privateContent: { screen: 'board', board_id: board, pending: { name: 'kingdown_move', args: { command_id: 'r10-move', expected_revision: rev, lan: 'e2-e4' }, game_tag: tag, screen: 'board' } } };
    }, [b._meta.board_id, a.game.slice(0, 8), revision]);
    // The new frame reads the saved board B and writes its state; wait for that write before its state is read.
    await nextWrite(page, () => page.locator('#remount').click());
    await settled(page);
    // Nothing is sent for the shown game B.
    expect(await page.evaluate(game => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move' && c.arguments.game_id === game).length, b.structuredContent.game_id)).toBe(0);
    // The waiting move stays for A, with the connection words.
    const sent = await html(page).evaluate(() => (window as any).harnessApp.client.state.pending);
    expect(sent?.game_tag).toBe(a.game.slice(0, 8));
    expect(sent?.error).toBe(CANNOT_CONNECT);
    // Its Retry shows when A shows, and A never gets the move.
    const aView = (await tool(page, '/fixture-tool', 'kingdown_get', { game_id: a.game }))._meta.view;
    await html(page).evaluate((_, next) => (window as any).harnessApp.routeView(next), aView);
    await page.frameLocator('iframe').locator('[data-screen="board"]:not([hidden])').waitFor();
    expect(await page.frameLocator('iframe').locator('#retry').isVisible()).toBe(true);
    expect(await page.frameLocator('iframe').locator('#error').textContent()).toBe(CANNOT_CONNECT);
    expect(await page.evaluate(game => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_move' && c.arguments.game_id === game).length, a.game)).toBe(0);
  } finally { await page.close(); }
});
