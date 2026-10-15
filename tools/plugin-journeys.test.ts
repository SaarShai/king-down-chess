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

it('reads the game again after a conflict and says that the opponent moved, with no Reload', async () => {
  const page = await open(), frame = page.frameLocator('iframe');
  const bob = (name: string, args: Record<string, unknown>) => tool(page, '/fixture-friend-tool', name, args);
  const moved = 'Your opponent moved. Check the board.';
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
    // A move that the board no longer allows (e2 to e4 again) says the same, with no Reload.
    await html(page).evaluate(async () => { const app = (window as any).harnessApp, v = app.memory.view; await app.call('kingdown_move', { game_id: v.game_id, command_id: 'alice-again', expected_revision: v.revision, lan: 'e2-e4' }, true); });
    await frame.locator('#retry').waitFor({ state: 'hidden' });
    expect(await frame.locator('#error').textContent()).toBe(moved);
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
