// Fault round 6: the UX journey review (U1, U2, U4, U7, U18, U21). U8 is in src/plugin/poll.test.ts.
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { startHarness } from './plugin-ui-harness';
vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => { folder = await mkdtemp(join(tmpdir(), 'kingdown-journeys-test-'));
  const boardPath = join(folder, 'board.html'); await writeFile(boardPath, await readFile('src/plugin/index.html'));
  harness = await startHarness({ boardPath, sourcePage: true }); browser = await chromium.launch({ headless: true }); });
afterAll(async () => { await browser?.close(); await harness?.close(); await rm(folder, { recursive: true, force: true }); });
const CLASSIC = { fairy: false, pool: [], arrangement: false, classic: true, cards: false, cardPool: [], kingPowers: false };
// A phone host in fullscreen: touch on, so the touch hit layers (and their z-index) apply.
async function open({ width = 393, height = 852, top = 0, bottom = 0 } = {}) {
  const page = await browser.newPage({ viewport: { width, height } }); page.setDefaultTimeout(5000);
  await page.goto(harness.url); await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.evaluate(([top, bottom]) => (window as any).harnessSetContext({ displayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen'], deviceCapabilities: { touch: true }, safeAreaInsets: { top, bottom, left: 0, right: 0 } }), [top, bottom]);
  return page;
}
const html = (page: Page) => page.frameLocator('iframe').locator('html');
const tool = async (page: Page, path: string, name: string, args: Record<string, unknown> = {}) => (await page.request.post(new URL(path, harness.url).href, { data: { name, arguments: args } })).json();
const reads = (page: Page) => page.evaluate(() => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length);
const soloBoard = (page: Page) => html(page).evaluate(async (_, options) => { await (window as any).harnessApp.call('kingdown_create', { kind: 'solo', colour: 'white', options }); }, CLASSIC);

it('opens the screen of the game status when a chat result names the board, with no draw offer before a game plays', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    const kai = { fairy: true, pool: ['R', 'A', 'G', 'Q', 'M', 'S', 'O'], arrangement: false, classic: false, cards: false, cardPool: [], kingPowers: true };
    const terminal = await (await page.request.get(new URL('/fixture-terminal', harness.url).href)).json();
    for (const [made, screen] of [
      [await tool(page, '/fixture-tool', 'kingdown_create', { kind: 'solo', colour: 'black', level: 'club', options: kai }), 'seat'],
      [await tool(page, '/fixture-tool', 'kingdown_create', { kind: 'friend', colour: 'white', options: CLASSIC }), 'friend'],
      [await tool(page, '/fixture-tool', 'kingdown_create', { kind: 'random', colour: 'white', options: CLASSIC }), 'wait'],
      [await tool(page, '/fixture-tool', 'kingdown_create', { kind: 'solo', colour: 'white', options: CLASSIC }), 'board'],
      [terminal, 'end'],
    ] as const) {
      // The model opens the game it made: the server names the board for every game.
      const shown = await tool(page, '/fixture-tool', 'kingdown_open', { game_id: made._meta.view.game_id });
      expect(shown.structuredContent.screen).toBe('board');
      const before = await reads(page);
      await page.evaluate(result => (window as any).harnessShow(result), shown);
      await page.waitForFunction(n => (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_get').length > n, before);
      await frame.locator(`[data-screen="${screen}"]:not([hidden])`).waitFor();
      // A board that draws a game in setup or waiting offers no draw and no resignation.
      if (screen === 'seat') expect(await html(page).evaluate(() => [document.getElementById('offer-draw')!.hidden, document.getElementById('resign')!.hidden])).toEqual([true, true]);
    }
  } finally { await page.close(); }
});

it('keeps every board control under an open sheet and its scrim', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page); await frame.locator('#context-actions #abort').waitFor();
    for (const opener of ['#board-menu', '#resign']) {
      await frame.locator(`${opener}:not(:disabled)`).click(); await frame.locator('#board-sheet[open]').waitFor();
      // The page is inert under a sheet, and inert hides it from hit tests; lift it to test what paints on top.
      const above = await html(page).evaluate(() => {
        const page = document.querySelector<HTMLElement>('.page-sheet')!, sheet = document.getElementById('board-sheet')!, scrim = sheet.previousElementSibling;
        page.inert = false;
        try {
          return [...document.querySelectorAll<HTMLElement>('#moves-line, #context-actions button, #table-bar > button:not([hidden])')].flatMap(control => {
            const box = control.getBoundingClientRect(), top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
            return sheet.contains(top) || top === scrim ? [] : [control.id || control.textContent];
          });
        } finally { page.inert = true; }
      });
      expect(above, opener).toEqual([]);
      await page.keyboard.press('Escape');
    }
  } finally { await page.close(); }
});

it('hides the display check line until a long press on the Settings title', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page);
    await frame.locator('#layout-check').filter({ hasText: 'Display check: board' }).waitFor({ state: 'attached' });
    await html(page).evaluate(() => (window as any).harnessApp.navigate('settings'));
    const line = frame.locator('#layout-check'), title = (await frame.locator('#page-title').boundingBox())!;
    expect(await line.isVisible()).toBe(false);
    await page.mouse.move(title.x + title.width / 2, title.y + title.height / 2);
    await page.mouse.down(); await page.waitForTimeout(200); await page.mouse.up();
    expect(await line.isVisible()).toBe(false);
    await page.mouse.down(); await page.waitForTimeout(800); await page.mouse.up();
    expect(await line.isVisible()).toBe(true);
    expect(await line.textContent()).toMatch(/^Display check: board · window \d+x\d+/);
  } finally { await page.close(); }
});

it('reads the game again after a conflict and says that the opponent moved, and says that a refused move is not available, with no Reload', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const bob = (name: string, args: Record<string, unknown>) => tool(page, '/fixture-friend-tool', name, args);
  const moved = 'Your opponent moved. Check the board.', refused = 'This move is not available. Choose another move.';
  try {
    // Poll reads fail, so Alice's board keeps its old view until she acts.
    await page.route('**/fixture-tool', route => route.request().postDataJSON()?.arguments?.since_revision !== undefined ? route.abort() : route.continue());
    await html(page).evaluate(async (_, options) => { await (window as any).harnessApp.start('friend', { colour: 'white', options }); }, CLASSIC);
    await frame.locator('#friend-code span').first().waitFor();
    await bob('kingdown_join', { code: (await frame.locator('#friend-code span').allTextContents()).join('') });
    await html(page).evaluate(async () => { await (window as any).harnessApp.call('kingdown_get', {}, false, false, true); });
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    const game_id = await html(page).evaluate(async () => {
      const app = (window as any).harnessApp, v = app.memory.view;
      await app.call('kingdown_move', { game_id: v.game_id, command_id: 'alice-e4', expected_revision: v.revision, lan: 'e2-e4' }, true);
      return v.game_id;
    });
    // Bob answers before Alice's board reads again; then Alice offers a draw on the old view.
    const seen = (await bob('kingdown_get', { game_id }))._meta.view;
    await bob('kingdown_move', { game_id, command_id: 'bob-e5', expected_revision: seen.revision, lan: 'e7-e5' });
    await frame.locator('#offer-draw:not(:disabled)').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Offer draw', exact: true }).click();
    await frame.locator('#error').filter({ hasText: moved }).waitFor();
    await frame.locator('#last-move').filter({ hasText: 'Black pawn e7 to e5' }).waitFor();
    expect(await html(page).evaluate(() => (window as any).harnessApp.memory.view.revision)).toBe(seen.revision + 1);
    // INVALID_MOVE comes only on a current view, because the service checks the revision first: e2 to e4 again on the
    // new view. Nobody moved, so the words say that the move is not available, with no Reload.
    await html(page).evaluate(async () => { const app = (window as any).harnessApp, v = app.memory.view; await app.call('kingdown_move', { game_id: v.game_id, command_id: 'alice-again', expected_revision: v.revision, lan: 'e2-e4' }, true); });
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    await frame.locator('#error').filter({ hasText: refused }).waitFor();
    expect(await frame.locator('#error').textContent()).toBe(refused);
  } finally { await page.close(); }
});

it('keeps the Name and picture row at its content height and the sample arrow as a hidden icon', async () => {
  // The small iPhone: Settings scrolls, so a row that may shrink takes less than its content height.
  const page = await open({ width: 320, height: 568, top: 63, bottom: 84 }), frame = page.frameLocator('iframe');
  try {
    await html(page).evaluate(() => (window as any).harnessApp.navigate('settings'));
    expect(await frame.locator('[data-screen="settings"] .new-game-body').evaluate(body => body.scrollHeight > body.clientHeight)).toBe(true);
    const room = await frame.locator('[data-screen="settings"] [data-nav="handle"]').evaluate(row => {
      const style = getComputedStyle(row), line = row.querySelector('.line')!.getBoundingClientRect(), box = row.getBoundingClientRect();
      return box.bottom - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom) - line.bottom;
    });
    expect(room).toBeGreaterThanOrEqual(-0.5);
    // The arrow between the painted knight and its symbol is the rows' arrow icon, not loose text.
    expect(await frame.locator('.sym-demo').evaluate(demo => [...demo.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent!.trim()).length)).toBe(0);
    expect(await frame.locator('.sym-demo > i').getAttribute('aria-hidden')).toBe('true');
    const look = (selector: string) => frame.locator(selector).evaluate(el => { const s = getComputedStyle(el); return [s.fontStyle, s.fontSize, s.fontWeight, s.color]; });
    expect(await look('.sym-demo > i')).toEqual(await look('[data-screen="settings"] [data-nav="handle"] > i'));
  } finally { await page.close(); }
});

it('gives each control one id while the board Menu is open', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  try {
    await soloBoard(page); await frame.locator('#context-actions #abort').waitFor();
    await frame.locator('#board-menu:not(:disabled)').click(); await frame.locator('#board-sheet[open]').waitFor();
    expect(await html(page).evaluate(() => { const ids = [...document.querySelectorAll('[id]')].map(el => el.id); return ids.filter((id, i) => ids.indexOf(id) !== i); })).toEqual([]);
    await frame.locator('#board-sheet #menu-abort').click();
    await frame.locator('#board-sheet h2').filter({ hasText: 'Abort this game?' }).waitFor();
  } finally { await page.close(); }
});

// Codex review on PR 57: an older chat result must not read or route after a newer one.
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
/** Runs in the host page: the frame shows this game on the board screen. */
const shows = (game: string) => { const frame = document.querySelector('iframe')!.contentWindow as any; return frame.harnessApp.memory.view?.game_id === game && frame.document.body.dataset.page === 'board'; };
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
}

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
    await page.waitForFunction(shows, newer, { timeout: 1500 });
    await page.evaluate(release, hold);
    await page.waitForTimeout(300);
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
    await page.waitForTimeout(300);
    await page.evaluate(release, hold);
    await page.waitForFunction(shows, chat).catch(() => {});
    await page.waitForTimeout(300);
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
    await expect.poll(async () => ({ ...await shownGame(page), ...await locks(page) })).toEqual({ game, board: result._meta.board_id, screen: 'seat', locked: false, error: '', home: '' });
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
    await page.waitForFunction(([game, screen]) => { const frame = document.querySelector('iframe')!.contentWindow as any; return frame.harnessApp.memory.view?.game_id === game && frame.document.body.dataset.page === screen && !frame.document.getElementById('home-play').disabled; }, [game, screen], { timeout: 1500 });
    await page.evaluate(() => (window as any).releaseHeld());
    await page.waitForTimeout(300);
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
    await page.waitForTimeout(300);
    // The tapped game's reply comes after the chat result. The chat result is newer, so its board and screen stay.
    await page.evaluate(() => (window as any).releaseHeld());
    const expected = { game: kind === 'game' ? game : undefined, screen: kind === 'game' ? 'board' : kind, board: chat._meta.board_id };
    await expect.poll(() => shownGame(page), { timeout: 3000 }).toEqual(expected);
    await page.waitForTimeout(300);
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
    await page.waitForFunction(screen => (document.querySelector('iframe')!.contentWindow as any).document.body.dataset.page === screen, screen);
    const seen = await watch(page);
    // The older list comes late; the older result does not open its game.
    await page.evaluate(() => (window as any).releaseHeld());
    await page.waitForTimeout(300);
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
    await page.waitForFunction(shows, made);
    const listed = () => html(page).evaluate((_, game) => (window as any).harnessApp.memory.games.some((entry: any) => entry.game_id === game), made);
    await expect.poll(listed).toBe(true);
    await page.evaluate(() => (window as any).releaseHeld());
    await page.waitForTimeout(300);
    expect(await listed()).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()); await page.close(); }
});

it('shows Retry for a move that waited over a remount when a chat result for its game comes during the first read', async () => {
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
    await page.evaluate(result => (window as any).harnessShow(result), again);
    await page.frameLocator('iframe').locator('#retry:not([hidden])').waitFor();
    await page.evaluate(() => (window as any).releaseHeld());
    await page.waitForTimeout(300);
    expect(await html(page).evaluate(() => ({ retry: document.getElementById('retry')!.hidden, error: document.getElementById('error')!.textContent, game: (window as any).harnessApp.memory.view?.game_id }))).toEqual({ retry: false, error: 'Cannot connect. Check your connection, then try again.', game });
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
    await page.waitForTimeout(300);
    expect(await locks(page)).toEqual({ locked: true, error: '', home: '' });
    await page.evaluate(() => (window as any).releaseHeld());
    await page.waitForTimeout(300);
    expect(await locks(page)).toEqual({ locked: true, error: '', home: '' });
    await page.evaluate(() => (window as any).releaseBefore());
    await page.waitForFunction(shows, newer);
    await expect.poll(() => locks(page)).toEqual({ locked: false, error: '', home: '' });
  } finally { await page.evaluate(() => { (window as any).releaseHeld?.(); (window as any).releaseBefore?.(); }); await page.close(); }
});
