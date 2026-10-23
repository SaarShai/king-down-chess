// The shared setup and helpers of the board tests (tools/plugin-board.test.ts, tools/plugin-board-input.test.ts and
// tools/plugin-board-drafts.test.ts).
// Each test file that imports this module gets its own build, harness and browser.
import { afterAll, beforeAll, expect, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Browser, Locator, Page } from 'playwright';
import { launch, STEP } from './checks.mjs';
import { startHarness, waitForSourceApp } from '../plugin-ui-harness';
import { fromFen, toLan } from '../../src/rules/setup';
import { legalMoves, RULES, setRules, type Rules } from '../../src/rules/engine';
import type { View } from '../../src/match/protocol';

vi.setConfig({ testTimeout: 60_000 * STEP, hookTimeout: 60_000 * STEP, expect: { poll: { timeout: 1000 * STEP } } });

export let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, served: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-board-faults-'));
  // Normal shared build: at most 601 ms in the M1 style test.
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe', timeout: 30_000 });
  const boardPath = join(folder, 'board.html');
  harness = await startHarness({ boardPath, sourcePage: true, pageEngine: 'test-engine' }); served = await startHarness({ boardPath }); browser = await launch({ headless: true, channel: process.env.PLAYABLE_BROWSER || 'chromium' });
  // The first board page of a new browser pays one-time costs (Vite's transform of the board modules, the first painted
  // board): over 3 s on cold Linux WebKit in CI runs 39135693919 and 39138716531. Open one board here with the hook's
  // limit, so the first test's 3 s steps measure the page, not the cold start.
  const warm = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), 393, 852, true, 30_000);
  try { await warm.frameLocator('iframe').locator('html').evaluate(async () => { await (window as any).testBoard.ready(); }); }
  finally { await warm.close(); }
});
afterAll(async () => { await browser?.close(); await harness?.close(); await served?.close(); await rm(folder, { recursive: true, force: true }); });

export function view(fen: string, rules: Partial<Rules> = {}, fields: Partial<View> = {}): View {
  setRules(rules); const pos = fromFen(fen || '7k/8/8/8/8/8/P7/K7 w - - 0 1');
  return { rating_policy: 'casual', game_id: crypto.randomUUID(), engine_fingerprint: 'test-engine', revision: 0, created_at: '2026-10-15T00:00:00Z', abort_open: false, seat: pos.turn, kind: 'solo', speed: 'daily', days_per_move: 3, status: 'playing', turn: pos.turn, action: 'ready', fen, in_check: false, legal: legalMoves(pos).map(m => toLan(pos, m)), last_commands: [], opponent: { handle: null, icon: null, computer: true, deleted: false, last_seen_ms: null }, draw_offer: null, deadline_at: null, server_now: '2026-10-15T00:00:00Z', rules: structuredClone(RULES), ...fields };
}
export const insets = (width: number) => ({ top: width === 320 ? 63 : width === 360 ? 80 : 102, bottom: width === 320 ? 84 : width === 360 ? 100 : 118, left: 0, right: 0 });
// The target checks get a root that a redraw keeps, and find its visible buttons in the same page call as they measure.
// evaluateAll finds the buttons in one call and measures them in the next. A redraw between the two calls (the strips draw
// again as a game opens) detaches the buttons it found, and each then measures 0 × 0 (fault: 'card-b-0: size' under load).
// Each visible button must give a 48 px target (its box or its touch ::after); each corner of that target must hit it.
export const targetMisses = (root: Element) => [...root.querySelectorAll('button')].filter(b => b.checkVisibility({ checkVisibilityCSS: true }) && b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().height > 0).flatMap(button => {
  const r = button.getBoundingClientRect(), s = getComputedStyle(button, '::after'), active = s.content !== 'none' && s.content !== 'normal', m = new DOMMatrix(s.transform);
  const width = Math.max(r.width, active ? parseFloat(s.width) || 0 : 0), height = Math.max(r.height, active ? parseFloat(s.height) || 0 : 0);
  if (width < 48 || height < 48) return [`${button.id}: size ${Math.round(width)} × ${Math.round(height)}`];
  const x = r.x + button.clientLeft + parseFloat(s.left) + m.e + parseFloat(s.width) / 2, y = r.y + button.clientTop + parseFloat(s.top) + m.f + parseFloat(s.height) / 2;
  return [-23, 23].flatMap(dx => [-23, 23].flatMap(dy => { const hit = document.elementFromPoint(x + dx, y + dy)?.closest('button'), box = hit?.getBoundingClientRect(); return hit === button || box && x + dx >= box.left && x + dx < box.right && y + dy >= box.top && y + dy < box.bottom ? [] : [`${button.id}: ${dx},${dy} → ${hit?.id}`]; }));
});
// Taps 1 px inside each edge of each visible control (clear of round corners); each must hit that control, not a neighbour's hit layer.
export const edgeMisses = (root: Element) => [...root.querySelectorAll('button')].filter(b => b.checkVisibility({ checkVisibilityCSS: true }) && b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().height > 0).flatMap(button => {
  const r = button.getBoundingClientRect(), xs = [r.left + r.width / 4, r.left + r.width / 2, r.right - r.width / 4], ys = [r.top + 1, r.bottom - 1];
  return [...xs.flatMap(x => ys.map(y => [x, y])), [r.left + 1, r.top + r.height / 2], [r.right - 1, r.top + r.height / 2]].flatMap(([x, y]) => {
    const hit = document.elementFromPoint(x, y)?.closest('button');
    return !hit || hit === button ? [] : [`${button.id || button.textContent}: ${Math.round(x)},${Math.round(y)} → ${hit.id || hit.textContent}`];
  });
});
export async function open(next: View, width = 393, height = 852, clock = false, limit = 3000) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(limit * STEP);
  // CI WebKit once closed one page in the middle of a test, with no error of its own (ticket 49).
  page.on('crash', () => console.error('The test page crashed'));
  if (clock) await page.clock.install();
  await page.goto(harness.url); await waitForSourceApp(page);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
  await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
  await page.evaluate(async safeAreaInsets => {
    await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets, deviceCapabilities: { touch: true } });
  }, insets(width));
  expect(await page.frameLocator('iframe').locator('html').evaluate('(async () => (await import("/src/account-game/engine-identity.ts")).PAGE_ENGINE)()')).toBe('test-engine');
  await page.frameLocator('iframe').locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), next);
  await page.frameLocator('iframe').locator('html').evaluate('(async () => { window.testBoard = (await import("/src/plugin/board-view.ts")).board; })()');
  return page;
}
export async function marks(page: Page) {
  return page.frameLocator('iframe').locator('html').evaluate(() => structuredClone((window as any).testBoard.marks));
}
// Release a held call and close the page. A crashed page has no call to release: keep the test's own first error.
export async function closeHeld(page: Page) {
  if (!page.isClosed()) await page.evaluate(() => (window as any).releaseBefore?.()).catch(() => {});
  await page.close();
}
// Keep real pointer input without WebKit's stalled locator geometry check. Check the hit target in the frame.
export async function clickButton(page: Page, button: Locator) {
  // Playwright's scrollIntoViewIfNeeded waits for a box that holds over two animation frames, as its click does, and CI
  // WebKit can stop sending frames. Scroll in the page instead, and wait until two reads 20 ms apart agree.
  const box = () => button.evaluate((button: HTMLElement) => {
    button.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
    const r = button.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].join();
  });
  let last = '';
  const seen: string[] = [];
  // The limit of the page wait that this step replaced (open(): 3000 ms × STEP), not the 1 s poll default.
  await expect.poll(async () => { const next = await box(), still = next === last; seen.push(next); last = next; return still; }, { interval: 20, timeout: 3000 * STEP }).toBe(true)
    .catch(error => { throw new Error(`clickButton: no two equal boxes in ${seen.length} reads, last ${seen.slice(-4).join(' | ')}`, { cause: error }); });
  const pane = await page.locator('iframe').evaluate(e => ({ x: e.getBoundingClientRect().x, y: e.getBoundingClientRect().y }));
  const point = await button.evaluate((button: HTMLButtonElement) => {
    const r = button.getBoundingClientRect(), x = r.x + r.width / 2, y = r.y + r.height / 2;
    return { x, y, hit: document.elementFromPoint(x, y)?.closest('button') === button,
      enabled: !button.disabled && button.getAttribute('aria-disabled') !== 'true' };
  });
  expect(point.hit).toBe(true); expect(point.enabled).toBe(true);
  await page.mouse.click(pane.x + point.x, pane.y + point.y);
}

export async function squarePoint(page: Page, square: number) {
  const frame = page.frameLocator('iframe'), pane = (await page.locator('iframe').boundingBox())!;
  await frame.locator('#board canvas').waitFor({state:'visible'});
  const point = await frame.locator('#board canvas').evaluate((canvas, sq) => {
    const r = canvas.getBoundingClientRect(), k = r.width / 960;
    return {x:r.x+(32+((sq&7)+.5)*112)*k, y:r.y+(96+(7-(sq>>3)+.5)*112)*k};
  }, square);
  return {x:pane.x+point.x, y:pane.y+point.y};
}
export async function squareTap(page: Page, square: number) {
  const point = await squarePoint(page, square);
  await page.mouse.click(point.x, point.y);
}

// The board input journeys (tools/plugin-board-input.test.ts and tools/plugin-board-drafts.test.ts).
// W7 journeys use board input. The endpoint only sets the starting position.
// These calls start only after the mounted board has requested its preview.
export const settleBoardReads = (page: Page) => expect.poll(() => page.frameLocator('iframe').locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
export async function turnBoard(fen?: string, clock = false) {
  const page = await open(view(''), 393, 852, clock), frame = page.frameLocator('iframe');
  const result = await (await page.request.post(new URL(fen ? `/fixture-position?fen=${encodeURIComponent(fen)}` : '/fixture-position?case=haste', harness.url).href)).json();
  expect(result.isError).not.toBe(true);
  await page.evaluate(result => (window as any).harnessShow(result), result);
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
  await settleBoardReads(page);
  return {page, frame, base:result._meta.view as View};
}
export async function chooseTurnMove(page: Page, lan: string, from: number) {
  const frame = page.frameLocator('iframe');
  await squareTap(page, from); await frame.locator('#board-menu').click();
  await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
  await frame.locator(`#choices button[title="${lan}"]`).click();
  await expect.poll(async () => (await savedDraft(page))?.lans.at(-1)).toBe(lan);
  await frame.locator('#board[data-animating="false"]').waitFor();
}
export const moveCalls = (page: Page) => page.evaluate(() => ((window as any).harnessCalls ?? []).filter((c: any) => c.name === 'kingdown_move'));
export const boardFen = (page: Page) => page.frameLocator('iframe').locator('html').evaluate<string>('(async () => { const { toFen } = await import("/src/rules/setup.ts"); return toFen(window.testBoard.pos); })()');
// W7 ticket 04 (design §7.4 D9 to D13): the draft in widget state.
export const getCalls = (page: Page) => page.evaluate(() => ((window as any).harnessCalls ?? []).filter((c: any) => c.name === 'kingdown_get').length);
export const savedDraft = (page: Page) => page.evaluate(() => (window as any).harnessWidgetState.privateContent?.draft ?? null);
export async function remountBoard(page: Page) {
  await page.locator('#remount').evaluate(e => (e as HTMLButtonElement).click());
  const frame = page.frameLocator('iframe');
  await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
  await frame.locator('html').evaluate('(async () => { window.testBoard = (await import("/src/plugin/board-view.ts")).board; })()');
}
