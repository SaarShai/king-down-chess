import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Browser, Locator, Page } from 'playwright';
import { launch, STEP } from './lib/checks.mjs';
import { startHarness, waitForSourceApp } from './plugin-ui-harness';
import { fromFen, toFen, toLan } from '../src/rules/setup';
import { P, R, N, L, inCheck, legalMoves, makeMove, parseRule, RULES, setRules, type Move, type Rules } from '../src/rules/engine';
import type { View } from '../src/match/protocol';
import { applyLan } from '../src/plugin/screens/board-model';
import { LESSONS } from '../src/lessons';
import { DEFAULT_OPTIONS } from '../src/match/setup';
import { readText } from '../src/read';
import { checkTabletButtons, checkButtonContent } from './lib/plugin-tablet-check.mjs';
import { cardFaces } from './lib/plugin-card-faces.mjs';
import { checkCoinFocus } from './lib/plugin-coin-focus-check.mjs';
import { momentKind } from '../src/moment';
import { soundsFor } from '../src/screen/moments';
import { describeMove } from '../src/move-text';
import { cardText, powerText, ruleLine } from '../src/powers-ui';
import { PRESETS, designCode, fromPreset } from '../src/workshop/model';

vi.setConfig({ testTimeout: 60_000 * STEP, hookTimeout: 60_000 * STEP, expect: { poll: { timeout: 1000 * STEP } } });

let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, served: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
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

function view(fen: string, rules: Partial<Rules> = {}, fields: Partial<View> = {}): View {
  setRules(rules); const pos = fromFen(fen || '7k/8/8/8/8/8/P7/K7 w - - 0 1');
  return { game_id: crypto.randomUUID(), engine_fingerprint: 'test-engine', revision: 0, created_at: '2026-10-15T00:00:00Z', abort_open: false, seat: pos.turn, kind: 'solo', speed: 'daily', days_per_move: 3, status: 'playing', turn: pos.turn, action: 'ready', fen, in_check: false, legal: legalMoves(pos).map(m => toLan(pos, m)), last_commands: [], opponent: { handle: null, icon: null, computer: true, deleted: false, last_seen_ms: null }, draw_offer: null, deadline_at: null, server_now: '2026-10-15T00:00:00Z', rules: structuredClone(RULES), ...fields };
}
const insets = (width: number) => ({ top: width === 320 ? 63 : width === 360 ? 80 : 102, bottom: width === 320 ? 84 : width === 360 ? 100 : 118, left: 0, right: 0 });
// The target checks get a root that a redraw keeps, and find its visible buttons in the same page call as they measure.
// evaluateAll finds the buttons in one call and measures them in the next. A redraw between the two calls (the strips draw
// again as a game opens) detaches the buttons it found, and each then measures 0 × 0 (fault: 'card-b-0: size' under load).
// Each visible button must give a 48 px target (its box or its touch ::after); each corner of that target must hit it.
const targetMisses = (root: Element) => [...root.querySelectorAll('button')].filter(b => b.checkVisibility({ checkVisibilityCSS: true }) && b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().height > 0).flatMap(button => {
  const r = button.getBoundingClientRect(), s = getComputedStyle(button, '::after'), active = s.content !== 'none' && s.content !== 'normal', m = new DOMMatrix(s.transform);
  const width = Math.max(r.width, active ? parseFloat(s.width) || 0 : 0), height = Math.max(r.height, active ? parseFloat(s.height) || 0 : 0);
  if (width < 48 || height < 48) return [`${button.id}: size ${Math.round(width)} × ${Math.round(height)}`];
  const x = r.x + button.clientLeft + parseFloat(s.left) + m.e + parseFloat(s.width) / 2, y = r.y + button.clientTop + parseFloat(s.top) + m.f + parseFloat(s.height) / 2;
  return [-23, 23].flatMap(dx => [-23, 23].flatMap(dy => { const hit = document.elementFromPoint(x + dx, y + dy)?.closest('button'), box = hit?.getBoundingClientRect(); return hit === button || box && x + dx >= box.left && x + dx < box.right && y + dy >= box.top && y + dy < box.bottom ? [] : [`${button.id}: ${dx},${dy} → ${hit?.id}`]; }));
});
// Taps 1 px inside each edge of each visible control (clear of round corners); each must hit that control, not a neighbour's hit layer.
const edgeMisses = (root: Element) => [...root.querySelectorAll('button')].filter(b => b.checkVisibility({ checkVisibilityCSS: true }) && b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().height > 0).flatMap(button => {
  const r = button.getBoundingClientRect(), xs = [r.left + r.width / 4, r.left + r.width / 2, r.right - r.width / 4], ys = [r.top + 1, r.bottom - 1];
  return [...xs.flatMap(x => ys.map(y => [x, y])), [r.left + 1, r.top + r.height / 2], [r.right - 1, r.top + r.height / 2]].flatMap(([x, y]) => {
    const hit = document.elementFromPoint(x, y)?.closest('button');
    return !hit || hit === button ? [] : [`${button.id || button.textContent}: ${Math.round(x)},${Math.round(y)} → ${hit.id || hit.textContent}`];
  });
});
async function open(next: View, width = 393, height = 852, clock = false, limit = 3000) {
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
async function marks(page: Page) {
  return page.frameLocator('iframe').locator('html').evaluate(() => structuredClone((window as any).testBoard.marks));
}
// Release a held call and close the page. A crashed page has no call to release: keep the test's own first error.
async function closeHeld(page: Page) {
  if (!page.isClosed()) await page.evaluate(() => (window as any).releaseBefore?.()).catch(() => {});
  await page.close();
}
// Keep real pointer input without WebKit's stalled locator geometry check. Check the hit target in the frame.
async function clickButton(page: Page, button: Locator) {
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

it.each(['See the board', 'New game'])('cancels a pending ceremony with %s during the final move', async action => {
  const before = view('7k/8/6K1/8/8/8/8/Q7 w - - 0 1'), pre = fromFen(before.fen);
  const move = legalMoves(pre).find(m => toLan(pre,m) === 'Qa1-a8')!, post = makeMove(pre,move);
  const page = await open(before, 393, 852, true), frame = page.frameLocator('iframe');
  try {
    // Artwork load is separate from the first visible frame; it can outlast an action wait on a cold load.
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await frame.locator('#board canvas').waitFor({ state: 'visible' });
    await frame.locator('html').evaluate(() => {
      const w = window as any; w.falls = []; const set = w.testBoard.setFallen.bind(w.testBoard);
      w.testBoard.setFallen = (sq: number|null, animate: boolean) => { if (sq !== null) w.falls.push(animate); set(sq,animate); };
      w.testBoard.animateMove = () => new Promise<void>(resolve => { w.endReplay = resolve; });
    });
    const next = { ...before, fen: toFen(post), revision: 1, status: 'finished', action: 'finished', turn: 1, legal: [], result: { winner: 0, reason: 'checkmate' }, last_commands: [{ seq: 1, seat: 0, at: before.server_now, action: { type: 'turn', actions: ['Qa1-a8'] } }] };
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), next);
    await frame.locator('#over[open]').waitFor();
    expect(await frame.locator('#board[data-toppling]').count()).toBe(0);
    if (action === 'New game') await page.clock.fastForward(1000);
    // The CSS entry animation uses the browser timeline, not the test clock.
    await frame.locator('#over').evaluate(async e => { await Promise.all(e.getAnimations().map(a => a.finished)); });
    await clickButton(page, frame.locator('#over').getByRole('button', { name: action, exact: true }));
    await frame.locator('#over[open]').waitFor({ state: 'hidden' });
    if (action === 'New game') await frame.locator('[data-screen="play"]:not([hidden])').waitFor();
    else await frame.locator('#end-result').waitFor();
    await frame.locator('html').evaluate(() => (window as any).endReplay());
    await frame.locator('#board[data-animating="false"]').waitFor({ state: 'attached' });
    expect(await frame.locator('html').evaluate(() => (window as any).falls.includes(true))).toBe(false);
    expect(await frame.locator('#board[data-toppling], #board .kd-words').count()).toBe(0);
  } finally { await page.close(); }
});

it.each(['Skip mouse', 'Skip touch', 'Finish'])('keeps the king fall running when the result card opens, then %s clears it', async ending => {
  const before = view('7k/8/6K1/8/8/8/8/Q7 w - - 0 1'), pre = fromFen(before.fen);
  const move = legalMoves(pre).find(m => toLan(pre,m) === 'Qa1-a8')!, post = makeMove(pre,move);
  const page = await open(before, 360, 844, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(() => {
      const w = window as any; w.falls = []; const set = w.testBoard.setFallen.bind(w.testBoard);
      w.testBoard.setFallen = (sq: number|null, animate: boolean) => { if (sq !== null) w.falls.push(animate); set(sq,animate); };
    });
    // Hold the short ceremony while browser calls read it and press Skip.
    await page.clock.setFixedTime(new Date()); await page.clock.pauseAt(await page.evaluate(() => Date.now()));
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...before, fen: toFen(post), revision: 1, status: 'finished', action: 'finished', turn: 1, legal: [], result: { winner: 0, reason: 'checkmate' }, last_commands: [] });
    // Open the result card through its queued timers and frame, then keep the ceremony paused.
    await page.clock.runFor(50);
    await frame.locator('#over[open]').waitFor(); await frame.locator('#board[data-toppling]').waitFor({ state: 'attached' });
    expect(await frame.locator('html').evaluate(() => (window as any).falls)).toEqual([true]);
    if (ending !== 'Finish') {
      expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.falling)).toBe(true);
      await frame.locator('#over').evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
      const box = (await frame.locator('#end-skip').boundingBox())!;
      if (ending === 'Skip touch') await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await expect.poll(() => frame.locator('#end-skip').isHidden()).toBe(true);
    } else await page.clock.fastForward(1130);
    expect(await frame.locator('html').evaluate(() => (window as any).falls.at(-1))).toBe(false);
    expect(await frame.locator('#board[data-toppling], #board .kd-words').count()).toBe(0);
    await page.clock.runFor(1200);
    expect(await frame.locator('#board[data-toppling], #board .kd-words').count()).toBe(0);
    expect(await frame.locator('#game-table').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  } finally { await page.close(); }
});

it.each(['move', 'vault', 'freeze', 'power'] as const)('marks the opponent %s on its source and targets after first-move entry', async kind => {
  const rules: Partial<Rules> = kind === 'power' ? { kings: [null, { king: 'Frost', power: 'Freeze' }] } : kind === 'move' ? {} : { hands: [[], [kind === 'vault' ? 'Vault' : 'Freeze']] };
  const fen = 'r6k/p7/8/8/8/8/4P3/K7 b - - 0 1'; setRules(rules); const pre = fromFen(fen);
  const move = legalMoves(pre).find(m => kind === 'move' ? !m.power && m.from === 48 && m.to === 40 : m.power === (kind === 'vault' ? 'vault' : 'freeze'))!;
  expect(move).toBeDefined(); const lan = toLan(pre, move), post = makeMove(pre, move);
  const next = view(toFen(post), rules, { revision: 1, seat: 0, history: { initial_fen: fen, actions: [lan] } });
  const page = await open(next);
  try { expect((await marks(page)).last).toEqual([...new Set([move.from, move.to, ...move.captures])]); }
  finally { await page.close(); }
});

it.each([['a stop', 'pass'], ['a second move', 'move']] as const)('marks each opponent Haste step when the turn ends with %s', async (_, end) => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] }, fen = '4k3/p7/8/8/8/8/4P3/K7 b - - 0 1';
  setRules(rules); let pos = fromFen(fen); const lans: string[] = [], squares: number[] = [];
  for (const pick of [(m: Move) => m.power === 'haste' && m.from === 48 && m.to === 40, (m: Move) => end === 'pass' ? !!m.pass : !m.pass && m.from === 40 && m.to === 32]) {
    const move = legalMoves(pos).find(pick)!; expect(move).toBeDefined();
    lans.push(toLan(pos, move)); if (!move.pass) squares.push(move.from, move.to); pos = makeMove(pos, move);
  }
  expect(pos.turn).toBe(0);
  const page = await open(view(toFen(pos), rules, { revision: 2, seat: 0, history: { initial_fen: fen, actions: lans } }));
  try { expect((await marks(page)).last).toEqual([...new Set(squares)]); }
  finally { await page.close(); }
});

it('keeps Their move through the opponent Haste turn', async () => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] }, fen = '4k3/p7/8/8/8/8/4P3/K7 b - - 0 1';
  setRules(rules); const pre = fromFen(fen), move = legalMoves(pre).find(m => m.power === 'haste' && m.from === 48 && m.to === 40)!;
  // A solo view asks the server to move the computer. This game has no server row, so that programmatic write comes
  // back refused. The refusal must not blank the words area (ticket 19 S2: a refusal belongs to a user command).
  const page = await open(view(toFen(makeMove(pre, move)), rules, { revision: 1, seat: 0, history: { initial_fen: fen, actions: [toLan(pre, move)] } })), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#status').textContent()).toBe('Their move.');
    expect(await frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('true');
    // Wait for the board's four computer asks and their follow-up reads to finish, then check the words area.
    await page.waitForFunction(() => {
      const calls = (window as any).harnessCalls.filter((c: any) => c.name === 'kingdown_computer').length;
      return calls >= 4 && (window as any).harnessInflight === 0;
    });
    expect(await frame.locator('#error').textContent()).toBe('');
    expect(await frame.locator('#status').textContent()).toBe('Their move.');
    expect(await frame.locator('#retry').isHidden()).toBe(true);
  } finally { await page.close(); }
});

it('marks the pieces that can use Vault with the power target mark', async () => {
  const rules: Partial<Rules> = { hands: [['Vault'], []] }, next = view('7k/8/8/8/8/8/P7/R6K w - - 0 1', rules);
  const page = await open(next), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#card-w-0').click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
    expect(await frame.locator('#status').textContent()).toBe('Vault.');
    setRules(rules); const sources = [...new Set(legalMoves(fromFen(next.fen)).filter(m => m.power === 'vault').map(m => m.from))];
    expect(sources.length).toBeGreaterThan(0); expect((await marks(page)).powers).toEqual(sources);
  } finally { await page.close(); }
});

// Use refreshes the board, and the refresh rebuilds the coins.
it.each([
  ['card-w-0', '7k/8/8/8/8/8/P7/R6K w - - 0 1', { hands: [['Vault'], []] }],
  ['power-w', '7k/8/8/8/8/8/p7/K7 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, null] }],
] as [string, string, Partial<Rules>][])('keeps focus on %s after its Use button', async (id, fen, rules) => {
  const page = await open(view(fen, rules)), frame = page.frameLocator('iframe');
  try {
    await frame.locator(`#${id}`).click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
    await frame.locator('#board-sheet:not([open])').waitFor({ state: 'attached' });
    expect(await frame.locator('html').evaluate(() => document.activeElement?.id || document.activeElement?.tagName)).toBe(id);
  } finally { await page.close(); }
});

it('names the card owner, feature icons and the computer once', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['Freeze'], ['Freeze']] }, { level: 'beginner' })), frame = page.frameLocator('iframe');
  try {
    expect.soft(await frame.locator('#card-w-0').getAttribute('aria-label')).toBe('Your Freeze');
    expect.soft(await frame.locator('#card-b-0').getAttribute('aria-label')).toBe("Opponent's Freeze");
  } finally { await page.close(); }
});

// Spec W10 a: the board uses the card names of setup, the Cards sheet and the Collection.
it('names Mirror B and Morph P with the shared card names on the coins, the sheet and the armed line', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['MorphP'], ['MirrorB']] })), frame = page.frameLocator('iframe');
  try {
    expect.soft(await frame.locator('#card-w-0').getAttribute('aria-label')).toBe('Your Morph');
    expect.soft(await frame.locator('#card-b-0').getAttribute('aria-label')).toBe("Opponent's Mirror");
    await frame.locator('#card-w-0').click();
    expect(await frame.locator('#board-sheet[open] h2').textContent()).toBe('Morph');
    await frame.getByRole('button', { name: 'Use', exact: true }).click();
    expect(await frame.locator('#status').textContent()).toBe('Morph.');
  } finally { await page.close(); }
});

it('keeps round coin faces while a command disables the buttons', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['MorphP'], ['MirrorB']] })), frame = page.frameLocator('iframe');
  try {
    const coins = await frame.locator('#game-table').evaluate(table => [...table.querySelectorAll<HTMLButtonElement>('.coin')].map(coin => {
      coin.disabled = true;
      const style = getComputedStyle(coin.querySelector('.coin-paint')!);
      return { round: style.borderRadius === '50%', radial: style.backgroundImage.includes('radial-gradient'), cursor: getComputedStyle(coin).cursor };
    }));
    expect(coins.length).toBeGreaterThan(0);
    expect(coins.every(coin => coin.round && coin.radial && coin.cursor === 'default')).toBe(true);
  } finally { await page.close(); }
});

it.each([['light', 'cards'], ['dark', 'cards'], ['light', 'powers'], ['dark', 'powers']] as const)('keeps used coin focus above 3:1 in %s with %s at 390 × 844', async (theme, kind) => {
  const rules: Partial<Rules> = kind === 'cards' ? { hands: [['Freeze', 'Vault'], ['Freeze', 'Vault']] }
    : { kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'Freeze' }] };
  const page = await open(view('7k/8/8/8/8/8/P7/R6K w - - 0 1 u3.3', rules), 390, 844), frame = page.frameLocator('iframe');
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(theme => (window as any).harnessSetContext({ theme }), theme);
    const ids = await frame.locator('#game-table .coin[data-state="used"]').evaluateAll(coins => coins.map(c => c.id));
    expect(ids).toHaveLength(kind === 'cards' ? 4 : 2);
    for (const id of ids) await checkCoinFocus(page, frame, `#${id}`);
    expect(await frame.locator('#game-table .coin-paint > .notches').count()).toBe(kind === 'powers' ? 2 : 0);
    expect(await frame.locator('#game-table').evaluate(table => [...table.querySelectorAll('.notches')].every(n => n.parentElement?.className === 'coin-paint'))).toBe(true);
  } finally { await page.close(); }
});

it('keeps spent coin contrast and clear symbols together', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['MorphP'], ['MirrorB']] })), frame = page.frameLocator('iframe');
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const coins = await frame.locator('#game-table').evaluate(table => [...table.querySelectorAll<HTMLButtonElement>('.card-coin')].map(coin => {
      coin.dataset.state = 'used'; coin.disabled = true;
      const style = getComputedStyle(coin.querySelector('.coin-paint')!), symbol = coin.querySelector('svg')!, face = symbol.getBoundingClientRect(), box = coin.getBoundingClientRect();
      return { opacity: style.opacity, buttonOpacity: getComputedStyle(coin).opacity, symbol: !!symbol, letters: coin.textContent, color: getComputedStyle(symbol).color, inset: box.width - face.width };
    }));
    expect(coins).toHaveLength(2);
    expect(coins[0].color).not.toBe(coins[1].color);
    expect(coins[1].color).toBe('rgb(255, 245, 218)');
    for (const coin of coins) { expect(coin.opacity).toBe('0.85'); expect(coin.buttonOpacity).toBe('1'); expect(coin.symbol).toBe(true); expect(coin.letters).toBe(''); expect(coin.inset).toBeCloseTo(12, 0); }
  } finally { await page.close(); }
});

it.each(['EarthQuake', 'SkyLift'] as const)('keeps the armed %s targets and rule before the block notice', async card => {
  const page = await open(view('7k/8/8/8/2RM4/8/P7/K7 w - - 0 1', { hands: [[card], []] })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.memory.blockNotice = 'Player blocked.'; });
    await frame.locator('#card-w-0').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const targets = card === 'EarthQuake' ? 'Select a marked square.' : 'Choose a marked piece, then a marked square.';
    expect(await frame.locator('#context-note').textContent()).toBe(`${targets} ${ruleLine(cardText(card))} Player blocked.`);
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('armed');
    expect(await frame.locator('#context-text').getAttribute('tabindex')).toBe('0');
    await frame.getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await frame.locator('#context-note').textContent()).toBe('Player blocked.');
    expect(await frame.locator('#context-text').getAttribute('tabindex')).toBe('-1');
  } finally { await page.close(); }
});

it.each([[320,568], [393,852]])('keeps the swap portrait and held note with the block notice at %d x %d', async (width,height) => {
  const fen = '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', base = view(fen), page = await open(base,width,height), frame = page.frameLocator('iframe');
  setRules(base.rules!); const pre = fromFen(fen), swap = legalMoves(pre).find(m => m.from === 27 && m.to === 26 && m.swap)!;
  expect(swap).toBeDefined();
  try {
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.memory.blockNotice = 'Player blocked.'; });
    await squareTap(page,27);
    expect(await frame.locator('#status').textContent()).toBe('White Maester.');
    await squareTap(page,26);
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('held');
    expect(await frame.locator('#context-note').textContent()).toBe(`${describeMove(pre,swap)} Player blocked.`);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    const info = frame.getByRole('button', {name:'All rules',exact:true});
    await info.locator('img').evaluate(image => (image as HTMLImageElement).decode());
    expect(await info.evaluate(button => {
      const b = button.getBoundingClientRect(), row = button.parentElement!, r = row.getBoundingClientRect();
      return row.firstElementChild === button && b.width >= 44 && b.height >= 44 && b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom;
    })).toBe(true);
    await info.click();
    expect(await frame.locator('#board-sheet').innerText()).toContain('Swaps places with a friendly piece.');
    await frame.locator('#board-sheet').getByRole('button', {name:'Close',exact:true}).click();
    expect(await info.evaluate(button => button === document.activeElement)).toBe(true);
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('held');
    expect(await frame.locator('#context-note').textContent()).toBe(`${describeMove(pre,swap)} Player blocked.`);
    await squareTap(page,27);
    expect(await frame.locator('#context-note').textContent()).toBe('Player blocked.');
  } finally { await page.close(); }
});

it.each(['EarthQuake', 'SkyLift'] as const)('G1: the armed %s note names its targets, then its rule', async card => {
  const rules: Partial<Rules> = { hands: [[card], []] };
  const page = await open(view('7k/8/8/8/2RM4/8/P7/K7 w - - 0 1', rules)), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#card-w-0').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const targets = card === 'EarthQuake' ? 'Select a marked square.' : 'Choose a marked piece, then a marked square.';
    expect(await frame.locator('#context-note').textContent()).toBe(`${targets} ${ruleLine(cardText(card))}`);
  } finally { await page.close(); }
});

it.each([
  [1280,800,false,'card'], [1280,800,true,'card'],
  [852,393,false,'card'], [852,393,true,'card'],
  [1280,800,false,'power'], [1280,800,true,'power'],
  [852,393,false,'power'], [852,393,true,'power'],
] as const)('G1: the full armed rule shows at %d×%d, draw=%s, %s', async (width,height,draw,kind) => {
  const rules: Partial<Rules> = kind === 'card' ? {hands:[['Haste'],[]]} : {kings:[{king:'Frost',power:'Freeze'},null]};
  const page = await open(view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1', rules, {kind:'friend',draw_offer:draw?1:null}),width,height), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => (window as any).harnessSetContext({ safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 } }));
    await expect.poll(() => frame.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--safe-top').trim())).toBe('0px');
    const board = await frame.locator('#board canvas').evaluate(async canvas => {
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return canvas.getBoundingClientRect().width;
    });
    await frame.locator(kind === 'card' ? '#card-w-0' : '#power-w').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('armed');
    const text = await frame.locator('#context-text').evaluate(async el => {
      await document.fonts.ready;
      const style = getComputedStyle(el);
      return {maxHeight:style.maxHeight,overflow:style.overflowY,height:el.clientHeight,content:el.scrollHeight};
    });
    expect(text.maxHeight).toBe('none');
    expect(text.overflow).toBe('visible');
    expect(text.content).toBeLessThanOrEqual(text.height + 1);
    expect((await frame.locator('#board canvas').boundingBox())!.width).toBeCloseTo(board,0);
  } finally { await page.close(); }
});

it.each([[320,568,'card'],[393,852,'card'],[320,568,'power'],[393,852,'power']] as const)(
  'G1: keyboard scroll reads an armed rule at %d×%d, %s', async (width,height,kind) => {
    const rules: Partial<Rules> = kind === 'card' ? {hands:[['Haste'],[]]} : {kings:[{king:'Frost',power:'Freeze'},null]};
    const page = await open(view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1',rules),width,height), frame = page.frameLocator('iframe');
    try {
      await frame.locator(kind === 'card' ? '#card-w-0' : '#power-w').click();
      await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
      const text = frame.locator('#context-text'), cancel = frame.getByRole('button',{name:'Cancel',exact:true});
      expect(await text.getAttribute('tabindex')).toBe('0');
      expect(await text.evaluate(el => ({height:el.clientHeight,overflow:getComputedStyle(el).overflowY}))).toEqual({height:40,overflow:'auto'});
      await cancel.focus(); await page.keyboard.press('Shift+Tab');
      expect(await text.evaluate(el => el === document.activeElement)).toBe(true);
      await page.keyboard.press('End');
      await expect.poll(() => text.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      await cancel.click();
      expect(await text.getAttribute('tabindex')).toBe('-1');
    } finally { await page.close(); }
  }
);

it.each(['card','power'] as const)('keeps the full armed %s rule and block notice at 197 x 426', async kind => {
  const rules: Partial<Rules> = kind === 'card' ? {hands:[['EarthQuake'],[]]} : {kings:[{king:'Frost',power:'Freeze'},null]};
  const base = view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1',rules);
  const page = await open(base,197,426), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(() => (window as any).harnessSetContext({safeAreaInsets:{top:51,bottom:59,left:0,right:0}}));
    await expect.poll(() => frame.locator('html').evaluate(el => getComputedStyle(el).getPropertyValue('--safe-top').trim())).toBe('51px');
    await frame.locator('html').evaluate(() => { (window as any).harnessApp.memory.blockNotice = 'Player blocked.'; });
    await frame.locator(kind === 'card' ? '#card-w-0' : '#power-w').click();
    await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
    const rule = ruleLine(kind === 'card' ? cardText('EarthQuake') : powerText('Freeze',base.rules!));
    expect(await frame.locator('#context-note').textContent()).toContain(`${rule} Player blocked.`);
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('armed');
    const text = await frame.locator('#context-text').evaluate(async el => {
      await document.fonts.ready;
      return {maxHeight:getComputedStyle(el).maxHeight,height:el.clientHeight,content:el.scrollHeight};
    });
    expect(text.maxHeight).toBe('none');
    expect(text.content).toBeLessThanOrEqual(text.height + 1);
    expect((await frame.locator('#board canvas').boundingBox())!.width).toBeGreaterThanOrEqual(184);
    await frame.getByRole('button',{name:'Cancel',exact:true}).click();
    expect(await frame.locator('#context-note').textContent()).toBe('Player blocked.');
  } finally { await page.close(); }
});

// Spec G1 a: an armed power keeps its target words first and puts its rule second, in the same note.
it('G1: the armed power note names the target, then the rule', async () => {
  const rules: Partial<Rules> = { kings: [{ king: 'Frost', power: 'Freeze' }, null] };
  const page = await open(view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1', rules)), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#power-w').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const target = 'Select an enemy piece.';
    expect(await frame.locator('#context-note').textContent()).toBe(`${target} ${ruleLine(powerText('Freeze', { ...RULES, ...rules } as Rules))}`);
  } finally { await page.close(); }
});

it('names the power coin owner when both kings have the same power', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'Freeze' }] })), frame = page.frameLocator('iframe');
  try {
    expect.soft(await frame.locator('#power-w').getAttribute('aria-label')).toMatch(/^Your Freeze, /);
    expect.soft(await frame.locator('#power-b').getAttribute('aria-label')).toMatch(/^Opponent's Freeze, /);
    expect.soft((await frame.locator('#strip-them').innerText()).match(/Computer/g)).toHaveLength(1);
    const names = await frame.locator('html').evaluate('(async () => { const { features } = await import("/src/account-game/features.ts"); return [...features({ fairy: true, arrangement: true, cards: true, kingPowers: true }).children].map(e => [e.getAttribute("role"), e.getAttribute("aria-label")]); })()');
    expect.soft(names).toEqual(['Fairy pieces', 'Arrangement', 'Cards', 'King powers'].map(name => ['img', name]));
  } finally { await page.close(); }
});

it.each([[true, 393, 852], [true, 320, 568], [false, 393, 852]] as const)('uses the correct seat line for computer=%s at %i × %i', async (computer, width, height) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  page.setDefaultTimeout(3000 * STEP);
  const tool = async (path: string, name: string, args: Record<string, unknown>) => {
    const result = await (await page.request.post(new URL(path, served.url).href, { data: { name, arguments: args } })).json();
    expect(result.isError, JSON.stringify(result)).not.toBe(true); return result;
  };
  try {
    // The build writes the seat's table selectors. Test its rendered page.
    await page.goto(served.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await page.evaluate(async safeAreaInsets => (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets, deviceCapabilities: { touch: true } }), insets(width));
    const game = await tool('/fixture-tool', 'kingdown_create', { kind: computer ? 'solo' : 'friend', colour: 'white', options: { ...DEFAULT_OPTIONS, arrangement: true, kingPowers: true } });
    const game_id = game._meta.view.game_id;
    if (!computer) {
      const invite = await tool('/fixture-tool', 'kingdown_invite', { game_id });
      await tool('/fixture-friend-tool', 'kingdown_join', { code: invite.structuredContent.code });
    }
    const opened = await tool('/fixture-tool', 'kingdown_open', { game_id });
    await page.evaluate(result => (window as any).harnessShow({ ...result, structuredContent: { ...result.structuredContent, screen: undefined } }, true), opened);
    await frame.locator('[data-screen="seat"]:not([hidden])').waitFor();
    await frame.locator('#board canvas').waitFor({ state: 'visible' });
    await frame.locator('#seat-veil-layer .veil').waitFor();
    expect(await frame.locator('#seat-veil-layer').innerText()).toBe(computer ? 'Their side stays hidden until you are ready.' : 'Their side stays hidden until both players are ready.');
  }
  finally { await page.close(); }
});

it.each([{ width: 393, height: 852, cards: true }, { width: 320, height: 568, cards: true }, { width: 360, height: 740, cards: true }, { width: 393, height: 852, cards: false }, { width: 320, height: 568, cards: false }, { width: 360, height: 740, cards: false }])('keeps 48 px control targets, art and rows at $width × $height with cards=$cards', async ({ width, height, cards }) => {
  const rules: Partial<Rules> = cards ? { hands: [['Freeze', 'Vault', 'March', 'IceWall'], ['Freeze']] } : { kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Flame', power: 'Haste' }] };
  const page = await open(view(cards ? '7k/8/8/8/8/8/P7/R6K w - - 0 1' : '7k/8/8/8/8/8/P7/K7 w - - 0 1', rules), width, height), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('html').evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
    expect(await frame.locator('#game-table').evaluate(targetMisses)).toEqual([]);
    expect(await frame.locator('#game-table').evaluate(edgeMisses)).toEqual([]);
    const clearance = await frame.locator('.table-back:visible').evaluate(back => {
      const board = (window as any).testBoard, top = board.screenOf(56), below = board.screenOf(48);
      return top.y - Math.abs(below.y - top.y) / 2 - back.getBoundingClientRect().bottom;
    });
    expect(clearance, 'Back stays above the board squares').toBeGreaterThanOrEqual(0);
    if (cards) {
      await frame.locator('#card-w-1').click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
      await frame.getByRole('button', { name: 'Cancel', exact: true }).waitFor();
      expect(await frame.locator('#game-table').evaluate(edgeMisses)).toEqual([]);
    }
    expect.soft(await frame.locator('#strip-me').evaluate(e => { const r = e.querySelector('.coin img')!.getBoundingClientRect(); return [r.width, r.height]; })).toEqual(cards ? [36, 36] : [30, 30]);
    // K1 a: the cards stay below the 36 px portrait row. Their targets stay 48 px.
    expect(await frame.locator('#strip-me').evaluate(e => e.getBoundingClientRect().height)).toBe(cards ? 80 : 44);
  } finally { await page.close(); }
});

it.each(['normal', 'fast'])('uses a slide, a 150 ms fade and no shake under reduced motion at %s pace', async pace => {
  // Install the clock before the scene queues frames, so a real frame cannot outlive the clock change.
  const page = await open(view('7k/8/8/8/8/8/p7/R6K w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).testBoard.motionQuery.matches)).toBe(true);
    await frame.locator('html').evaluate((_, pace) => (window as any).testBoard.setPace(pace), pace);
    // Let the reduced-motion setting draw its last frame before the clock pauses.
    await expect.poll(() => frame.locator('html').evaluate(async () => { const scene = (window as any).testBoard.scene, before = scene.frames; await new Promise(resolve => setTimeout(resolve, 100)); return scene.frames === before; })).toBe(true);
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    const result = await frame.locator('html').evaluate(async () => {
      const board = (window as any).testBoard, scene = board.scene, pre = board.pos;
      const moves = [];
      for (let type = 1; type <= 12; type++) {
        const position = { ...pre, board: new Uint8Array(pre.board) }; position.board[0] = type;
        scene.setPosition(position); void scene.play({ from: 0, to: 8, captures: [8] }); moves.push(scene.playing); scene.cancel();
      }
      scene.setPosition(pre);
      return moves;
    });
    expect(result).toEqual(Array(12).fill('move'));
    await frame.locator('html').evaluate((_, pace) => {
      const board = (window as any).testBoard; board.setPace(pace);
      const canvas = document.querySelector<HTMLCanvasElement>('#board canvas')!, ctx = canvas.getContext('2d')!, original = CanvasRenderingContext2D.prototype.drawImage.bind(ctx);
      (window as any).victimFrames = []; (window as any).boardFrames = [];
      ctx.drawImage = (...args: any[]) => {
        const m = ctx.getTransform();
        if (args[0] instanceof HTMLCanvasElement && args[0].width === 1152 && m.a < 0 && m.e === 88 && m.f === 864) (window as any).victimFrames.push({ opacity: ctx.globalAlpha, at: performance.now() });
        if (args[0] instanceof HTMLImageElement && args[0].src.includes('stone-board')) (window as any).boardFrames.push([m.e, m.f]);
        return (original as any)(...args);
      };
      (window as any).captureDone = false; (window as any).captureStart = performance.now();
      void board.animateMove(board.pos, { from: 0, to: 8, captures: [8] }).then(() => { (window as any).captureDone = true; });
    }, pace);
    const slide = pace === 'fast' ? 210 : 420;
    await page.clock.fastForward(slide + 75);
    const middle = await frame.locator('html').evaluate(() => ({ done: (window as any).captureDone, start: (window as any).captureStart, frames: (window as any).victimFrames }));
    expect(middle.done).toBe(false);
    expect(middle.frames.length).toBeGreaterThan(0);
    const victim = middle.frames.at(-1);
    expect(victim.opacity).toBeGreaterThan(0); expect(victim.opacity).toBeLessThan(1);
    expect(victim.opacity).toBeCloseTo(1 - (victim.at - middle.start - slide) / 150, 5);
    await page.clock.fastForward(100);
    expect(await frame.locator('html').evaluate(() => (window as any).captureDone)).toBe(true);
    const frames = await frame.locator('html').evaluate(() => (window as any).boardFrames as number[][]);
    expect(frames.length).toBeGreaterThan(0); expect(frames.every(([x, y]) => x === 0 && y === 64)).toBe(true);
    await frame.locator('html').evaluate(() => { const board = (window as any).testBoard; board.skip(); board.sync(board.pos); });
  } finally { await page.close(); }
});

it.each([[393, 852], [320, 568], [844, 390], [1440, 900]])('keeps the board box still behind the end card at %i × %i', async (width, height) => {
  const next = view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), page = await open(next, width, height), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await expect.poll(() => frame.locator('#board canvas').evaluate(e => e.getBoundingClientRect().width)).toBeGreaterThan(0);
    await frame.locator('#game-table').evaluate(async e => { await Promise.all(e.getAnimations().map(a => a.finished)); });
    // The render compare: the two boxes the canvas follows, in the page's pixels.
    const boxes = () => frame.locator('html').evaluate(() => ['#board', '#board canvas', '#table-bar'].map(sel => { const r = document.querySelector(sel)!.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(v => Math.round(v * 100) / 100); }));
    const before = await boxes();
    // Record every board size while the card opens, so a transient resize (a hidden box) shows.
    await frame.locator('html').evaluate(() => {
      (window as any).endSizes = [];
      new ResizeObserver(entries => { for (const e of entries) (window as any).endSizes.push(Math.round(e.contentRect.width * 10) / 10); }).observe(document.getElementById('board')!);
    });
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...next, revision: 1, status: 'finished', action: 'finished', result: { reason: 'resign', winner: 0 } });
    await frame.locator('#over[open]').waitFor();
    await frame.locator('html').evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const after = await boxes();
    // F14: the board and its canvas keep the same rect; the canvas does not redraw at a new size.
    expect(after.slice(0, 2)).toEqual(before.slice(0, 2));
    // The end card is an overlay over #game-table: the table bar keeps its box in the grid (no zero-height cell).
    expect(after[2][2]).toBeGreaterThan(0); expect(after[2][3]).toBeGreaterThan(0);
    // No resize of the board happens while the card opens: the board never takes a hidden (0 px) box.
    const sizes = await frame.locator('html').evaluate(() => (window as any).endSizes as number[]);
    expect(sizes.filter(w => w < 1)).toEqual([]);
  } finally { await page.close(); }
});

it('draws no fallback board before the stone loads', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 } }), frame = page.frameLocator('iframe');
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/board-art/stone-board.webp', async route => { await held; await route.continue(); });
  try {
    await page.goto(harness.url, { waitUntil: 'domcontentloaded' }); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), view('7k/8/8/8/8/8/P7/K7 w - - 0 1'));
    const pixel = () => frame.locator('#board canvas').evaluate(e => [...(e as HTMLCanvasElement).getContext('2d')!.getImageData(200, 264, 1, 1).data]);
    expect(await frame.locator('#board').getAttribute('aria-busy')).toBe('true');
    expect(await pixel()).toEqual([0, 0, 0, 0]);
    release(); await frame.locator('#board[aria-busy="false"]').waitFor();
    await expect.poll(async () => (await pixel())[3]).toBe(255);
    expect((await pixel()).slice(0, 3)).not.toEqual([230, 184, 74]);
  } finally { release(); await page.close(); }
});

it.each([[393, 852], [360, 740], [320, 568]])('serves 48 px targets on Seat and Board at %i × %i', async (width, height) => {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe'); page.setDefaultTimeout(2000 * STEP);
  try {
    await page.goto(served.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await page.evaluate(async safeAreaInsets => (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets, deviceCapabilities: { touch: true } }), insets(width));
    for (const cards of [false, true]) {
      await page.evaluate(async options => {
        const result = await (await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white', options } }) })).json();
        if (result.isError) throw new Error(JSON.stringify(result));
        await (window as any).harnessShow({ ...result, structuredContent: { ...result.structuredContent, screen: undefined, game_id: result._meta.view.game_id } }, true);
      }, { ...DEFAULT_OPTIONS, arrangement: !cards, cards, kingPowers: !cards, cardPool: cards ? ['Freeze', 'Vault', 'March', 'IceWall'] : [] });
      await frame.locator(`[data-screen="${cards ? 'board' : 'seat'}"]:not([hidden])`).waitFor();
      for (const screen of cards ? ['board'] : ['seat', 'board']) {
        if (screen === 'board' && !cards) {
          const ready = frame.locator('#seat-ready:not(:disabled)');
          await clickButton(page, ready);
          // Ready commits the choice, then reads the full rules before it opens the board.
          await page.waitForFunction(() => (window as any).harnessView.status === 'playing');
          await page.waitForFunction(() => !!(window as any).harnessView.rules);
          await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
        }
        const coin = `#${cards ? 'card-w-0' : screen === 'seat' ? 'seat-king' : 'power-w'}`;
        await frame.locator(`${coin}:visible`).waitFor();
        // Wait until no motion runs. A strip rebuild during the deal can cancel the old coin's animation (its finished
        // promise rejects) and starts it again on the new coin, so a single wait can reject or end too soon.
        await frame.locator('#game-table').evaluate(async e => {
          for (let run: Animation[]; (run = e.getAnimations({ subtree: true }).filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {})));
          await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
        });
        // The coin shows at the first draw of the game; the screen draws again after the games-list read.
        const section = frame.locator(`[data-screen="${screen}"]`);
        expect(await section.evaluate(targetMisses)).toEqual([]);
        expect(await section.evaluate(edgeMisses)).toEqual([]);
        expect(await section.evaluate((e, coin) => { const r = e.querySelector(`${coin} img`)!.getBoundingClientRect(); return [r.width, r.height]; }, coin)).toEqual(cards ? [36, 36] : [30, 30]);
      }
    }
  } finally { await page.close(); }
});

// Ticket 22 review: the card-coin face measure holds a root that a redraw keeps.
// `locator.evaluateAll` finds the images in one page call and measures them in the next. The board replaces each
// strip's content on every refresh (`strips()` sets `strip.innerHTML`), so an image that a redraw removed is detached
// and measures 0 × 0. `cardFaces` holds `#game-table`, which a redraw keeps, and finds the images inside the one call.
it('measures the card coin face in one page call on a root a redraw keeps', async () => {
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe');
  try {
    await page.goto(served.url); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
    await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
    await page.evaluate(async () => (window as any).harnessSetContext({ displayMode: 'fullscreen', deviceCapabilities: { touch: true } }));
    await page.evaluate(async options => {
      const result = await (await fetch('/fixture-tool', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'kingdown_create', arguments: { kind: 'solo', colour: 'white', options } }) })).json();
      if (result.isError) throw new Error(JSON.stringify(result));
      await (window as any).harnessShow({ ...result, structuredContent: { ...result.structuredContent, screen: undefined, game_id: result._meta.view.game_id } }, true);
    }, { ...DEFAULT_OPTIONS, arrangement: false, cards: true, kingPowers: false, cardPool: ['Freeze', 'Vault', 'March', 'IceWall'] });
    await frame.locator('#board[aria-busy="false"]:not([data-animating="true"])').waitFor();
    const settle = () => frame.locator('#game-table').evaluate(async e => {
      for (let run: Animation[]; (run = e.getAnimations({ subtree: true }).filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {})));
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    });
    await settle();
    const faces: { coin: number; image: number; x: number; y: number }[] = await cardFaces(frame);
    expect(faces.length).toBe(8);
    expect(faces.every(face => face.coin === 44 && face.image === 36 && face.x === 0 && face.y === 0), JSON.stringify(faces)).toBe(true);
    // A measure that finds the images first and reads them later loses them to a redraw: hold that hazard here.
    const found = await frame.locator('#game-table .card-coin img').elementHandles();
    expect(found.length).toBe(8);
    await frame.locator('#game-table').evaluate(table => { for (const strip of table.querySelectorAll('.player-strip')) (strip as HTMLElement).innerHTML = (strip as HTMLElement).innerHTML; });
    expect(await Promise.all(found.map(handle => handle.evaluate(image => Math.round(image.getBoundingClientRect().width))))).toEqual(Array(8).fill(0));
    // `cardFaces` holds `#game-table` and finds the images in the same page call as the measure, so it reads them all.
    await settle();
    const after: { coin: number; image: number; x: number; y: number }[] = await cardFaces(frame);
    expect(after.length).toBe(8);
    expect(after.every(face => face.coin === 44 && face.image === 36 && face.x === 0 && face.y === 0), JSON.stringify(after)).toBe(true);
  } finally { await page.close(); }
});

it('stops passive drawing five seconds after changes and keeps move motion', async () => {
  const page = await open(view('7k/8/8/8/8/3p4/4P3/K7 w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await frame.locator('html').evaluate(() => (window as any).testBoard.scene.redraw());
    const frames = () => frame.locator('html').evaluate(() => (window as any).testBoard.scene.frames);
    const settle = async () => { await page.clock.fastForward(5_100); await page.clock.runFor(100); const count = await frames(); await page.clock.runFor(200); expect(await frames()).toBe(count); };
    await settle();
    const stopped = await frames();
    await frame.locator('html').evaluate(() => (window as any).testBoard.highlight({ selected: 12, moves: [20] }));
    await page.clock.runFor(100); expect(await frames()).toBeGreaterThan(stopped);
    await settle();
    const selected = await frames();
    const width = await frame.locator('#board canvas').evaluate(e => (e as HTMLElement).style.width);
    await page.setViewportSize({ width: 400, height: 900 });
    // The board's ResizeObserver needs a frame on the test clock before the width check.
    await page.clock.runFor(100);
    await expect.poll(() => frame.locator('#board canvas').evaluate(e => (e as HTMLElement).style.width)).not.toBe(width);
    await page.clock.runFor(100); expect(await frames()).toBeGreaterThan(selected);
    await settle();
    // A capture still draws to its contact and end after the passive window ends.
    await frame.locator('html').evaluate(() => {
      const host = window as any;
      host.testBoard.animateMove(host.testBoard.pos, { from: 12, to: 19, captures: [19] }, () => { host.contact = true; }).then(() => { host.motionDone = true; });
    });
    await page.clock.fastForward(100); const moving = await frames();
    await page.clock.fastForward(3_000);
    expect(await frames()).toBeGreaterThan(moving);
    expect(await frame.locator('html').evaluate(() => ({ done: (window as any).motionDone, contact: (window as any).contact }))).toEqual({ done: true, contact: true });
    await settle();
  } finally { await page.close(); }
});

it('lays the mated king down only after the mating move ends', async () => {
  const fen = 'k7/8/1K6/8/8/8/8/7R w - - 0 1'; setRules({}); const pre = fromFen(fen);
  const move = legalMoves(pre).find(m => m.from === 7 && m.to === 63)!; expect(move).toBeDefined();
  const lan = toLan(pre, move), post = toFen(makeMove(pre, move)), first = view(fen, {}, { seat: 1, action: 'waiting', legal: [] });
  const page = await open(first), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('html').evaluate((_, next) => {
      const host = window as any, board = host.testBoard, setFallen = board.setFallen.bind(board); host.fallen = []; host.moving = 0;
      // Count the painted frames that show the move in motion (fault F35-1: a settings resync ended it at once).
      const sample = () => { if (board.scene.animating) host.moving++; requestAnimationFrame(sample); }; requestAnimationFrame(sample);
      board.setFallen = (sq: number | null, animate?: boolean) => { host.fallen.push({ sq, animating: document.getElementById('board')!.dataset.animating, moving: host.moving }); setFallen(sq, animate); };
      host.harnessApp.routeView(next);
    }, { ...first, revision: 1, fen: post, turn: 1, status: 'finished', action: 'finished', result: { reason: 'checkmate', winner: 0 }, last_commands: [{ seq: 1, seat: 0, action: { type: 'turn', actions: [lan] }, at: '2026-10-15T00:00:01Z' }] });
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).fallen.some((c: any) => c.sq !== null && c.animating === 'false')), { timeout: 3000 * STEP }).toBe(true);
    const calls = await frame.locator('html').evaluate(() => (window as any).fallen);
    expect(calls.filter((c: any) => c.sq !== null && c.animating === 'true')).toEqual([]);
    expect(calls.some((c: any) => c.animating === 'true')).toBe(true);
    expect(calls.find((c: any) => c.sq !== null).moving).toBeGreaterThan(0);
  } finally { await page.close(); }
});

it('moves the keyboard cursor while the opponent move animates', async () => {
  const fen = 'k7/8/1K6/8/8/8/8/7R w - - 0 1'; setRules({}); const pre = fromFen(fen);
  const move = legalMoves(pre).find(m => m.from === 7 && m.to === 15)!; expect(move).toBeDefined();
  const first = view(fen, {}, { seat: 1, action: 'waiting', legal: [] });
  const page = await open(first), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#board').press('ArrowLeft');
    expect(await frame.locator('#board').getAttribute('aria-label')).toBe('Chess board, b1, empty. Enter selects a square.');
    await frame.locator('html').evaluate((_, next) => {
      const host = window as any, board = document.getElementById('board')!;
      // Hold the replay until the real cursor key arrives, as in the ceremony test.
      host.testBoard.animateMove = () => new Promise<void>(resolve => { host.endReplay = resolve; });
      board.addEventListener('keydown', event => { if (event.key === 'ArrowRight') host.cursorKeyAnimating = board.dataset.animating; }, { once: true });
      host.harnessApp.routeView(next);
    },
      { ...first, revision: 1, fen: toFen(makeMove(pre, move)), turn: 1, last_commands: [{ seq: 1, seat: 0, action: { type: 'turn', actions: [toLan(pre, move)] }, at: '2026-10-15T00:00:01Z' }] });
    await frame.locator('#board[data-animating="true"]').waitFor();
    await frame.locator('#board').focus(); await page.keyboard.press('ArrowRight');
    expect(await frame.locator('html').evaluate(() => (window as any).cursorKeyAnimating)).toBe('true');
    expect(await frame.locator('#board').getAttribute('aria-label')).toBe('Chess board, a1, empty. Enter selects a square.');
    await frame.locator('html').evaluate(() => (window as any).endReplay());
    await frame.locator('#board[data-animating="false"]').waitFor();
  } finally { await page.close(); }
});

it('hides the edge labels on a small board and keeps them in the frame on a phone board (fault M10)', async () => {
  const page = await open(view('')), frame = page.frameLocator('iframe');
  try {
    const coords = await frame.locator('html').evaluate(() => {
      const board = (window as any).testBoard, calls: [boolean, number, number][] = [];
      board.scene.setCoords = (...args: [boolean, number, number]) => { calls.push(args); };
      return [158, 302].map(width => { board.width = width; board.setCoords(true); return calls.at(-1)!; });
    });
    expect(coords[0][0]).toBe(false);
    expect(coords[1][0]).toBe(true); expect(coords[1][1]).toBeLessThanOrEqual(40); expect(coords[1][2]).toBeLessThanOrEqual(16);
  } finally { await page.close(); }
});

it.each([[320, 568, 84], [320, 568, 180], [393, 852, 118], [820, 600, 34], [852, 393, 34], [667, 375, 34]] as const)('keeps Menu actions visible at %i × %i, with draw replies only on the board', async (width, height, bottom) => {
  const next = view('4k3/7p/8/8/8/8/P7/K7 w - - 0 1', {}, {kind:'friend',abort_open:true,opponent:{handle:'Bob',icon:null,computer:false,deleted:false,last_seen_ms:null,rating:{rating:1500,provisional:true}}});
  const page = await open(next, width, height), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#table-bar button').allTextContents()).toEqual(['Undo','','Menu']);
    expect(await frame.locator('#end-turn').getAttribute('aria-label')).toBe('Send your turn');
    expect(await frame.locator('#end-turn').getAttribute('title')).toBe('Send your turn');
    expect(await frame.locator('#context-actions #abort').count()).toBe(0);
    expect(await frame.locator('#context-note').textContent()).toBe('');
    expect(await frame.locator('#strip-them small').textContent()).toBe('New player · Black');
    await page.evaluate(({width,height,bottom}) => (window as any).harnessSetContext({safeAreaInsets:{top:width>height?59:width===320?63:102,bottom,left:0,right:0}}), {width,height,bottom});
    await frame.locator('#board-menu').click();
    expect(await frame.locator('#menu-resign').isVisible()).toBe(true);
    expect(await frame.locator('#menu-draw').isVisible()).toBe(true);
    expect(await frame.locator('#menu-abort small').textContent()).toBe('No result, until each side moves once.');
    expect(await frame.locator('#reload').textContent()).toBe('Refresh the board');
    expect(await frame.locator('#board-sheet').evaluate(sheet => {
      const body = sheet.querySelector('.sheet-body')!, box = sheet.getBoundingClientRect();
      return body.scrollHeight <= body.clientHeight + 1 && [...sheet.querySelectorAll<HTMLElement>('button')].filter(b => b.getClientRects().length).every(b => {const r=b.getBoundingClientRect();return r.top>=box.top && r.bottom<=box.bottom+1;});
    })).toBe(true);
    await page.keyboard.press('Escape');
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView({...next,draw_offer:1}), next);
    expect(await frame.locator('#context-actions #accept-draw').isVisible()).toBe(true);
    expect(await frame.locator('#context-actions #decline-draw').isVisible()).toBe(true);
    const clear = await frame.locator('#context-line').evaluate(row => row.getBoundingClientRect().bottom <= document.getElementById('table-bar')!.getBoundingClientRect().top + 1);
    expect(clear, 'The draw reply row stays above the game bar').toBe(true);
    await frame.locator('#board-menu').click();
    expect(await frame.locator('#board-sheet #accept-draw, #board-sheet #decline-draw, #menu-accept-draw, #menu-decline-draw').count()).toBe(0);
  } finally { await page.close(); }
});

it.each([[320,568],[852,393]] as const)('keeps a short last move and its deadline above a short board at %i × %i', async (width,height) => {
  const initial_fen = '4k3/7p/8/8/8/8/P7/K7 b - - 0 1';
  const step = applyLan(fromFen(initial_fen), 'h7-h5', {})!;
  const next = view(toFen(step.pos), {}, {kind:'friend',history:{initial_fen,actions:['h7-h5']},deadline_at:'2026-10-15T18:00:00Z'});
  const page = await open(next, width, height), frame = page.frameLocator('iframe');
  try {
    if (width > height) await page.evaluate(() => (window as any).harnessSetContext({safeAreaInsets:{top:59,bottom:34,left:0,right:0}}));
    expect(await frame.locator('#short-move-words').innerText()).toBe('Black pawn h7 → h5');
    expect(await frame.locator('#move-time-left').innerText()).toBe('18 h left');
    const line = (await frame.locator('#short-last-move').boundingBox())!, board = (await frame.locator('#board').boundingBox())!;
    expect(line.y + line.height).toBeLessThanOrEqual(board.y + 1);
    expect(await frame.locator('#move-time-left').evaluate(e => e.getBoundingClientRect().right <= e.parentElement!.getBoundingClientRect().right + 1)).toBe(true);
    expect(await frame.locator('#moves-line').isVisible()).toBe(false);
    await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button', {name:'Moves',exact:true}).click();
    expect(await frame.locator('#board-sheet').innerText()).toContain('Black pawn h7 to h5.');
  } finally { await page.close(); }
});

it.each(['A', 'S', 'M', 'O', 'G', 'L'])('shows the %s lesson rule when a beginner selects the piece', async letter => {
  const names: Record<string, string> = { A: 'Archer', S: 'Beast', M: 'Maester', O: 'Ogre', G: 'Guard', L: 'Paladin' };
  const page = await open(view(`7k/8/8/8/3${letter}4/8/8/K7 w - - 0 1`, {}, { level: 'beginner' })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('html').evaluate(() => (window as any).testBoard.onSquareClick(27));
    expect(await frame.locator('#context-note').innerText()).toBe(LESSONS.find(lesson => lesson.name === names[letter])!.done);
    expect(await frame.locator('#move-hint').textContent()).not.toMatch(/\bTap\b/);
  } finally { await page.close(); }
});
it('keeps the normal piece rule for a player above beginner level', async () => {
  const page = await open(view('7k/8/8/8/3G4/8/8/K7 w - - 0 1', {}, { level: 'club' })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('html').evaluate(() => (window as any).testBoard.onSquareClick(27));
    expect(await frame.locator('#context-note').innerText()).toBe('Only a king can take it.');
  } finally { await page.close(); }
});


it('gives live pawn move choices the shared tablet face', async () => {
  const page = await open(view('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1')), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('html').evaluate(() => (window as any).testBoard.onSquareClick(12));
    await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
    await checkTabletButtons(frame, '#choices button');
    await checkButtonContent(frame, '#choices button');
    await frame.locator('#choices button[title="e2-e4"]').click();
    await frame.locator('#end-turn[aria-disabled="false"]').waitFor();
    expect(await frame.locator('#board-sheet').isVisible()).toBe(false);
  } finally { await page.close(); }
});

it.each([[320, 568], [393, 852]])('keeps the board size after a beginner selects a long lesson at %i px', async (width, height) => {
  const page = await open(view('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBOR w - - 0 1', {}, { level: 'beginner' }), width, height), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    const size = () => frame.locator('#board canvas').boundingBox();
    const settle = () => frame.locator('#board canvas').evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await settle();
    await expect.poll(async () => (await size())?.width ?? 0).toBeGreaterThanOrEqual(192);
    const before = (await size())!;
    await frame.locator('html').evaluate(() => (window as any).testBoard.onSquareClick(6));
    const lesson = LESSONS.find(lesson => lesson.name === 'Ogre')!.done;
    expect(await frame.locator('#context-note').textContent()).toBe(lesson);
    // Wait for layout and the board's resize observer before the size comparison.
    await settle();
    const after = (await size())!;
    expect(after.width).toBeCloseTo(before.width, 0);
    expect(after.height).toBeCloseTo(before.height, 0);
    expect(after.y).toBeCloseTo(before.y, 0);
    expect(after.width).toBeGreaterThanOrEqual(192);
    await frame.getByRole('button', { name: 'All rules', exact: true }).click();
    expect(await frame.locator('#board-sheet').innerText()).toContain(lesson);
  } finally { await page.close(); }
});

// W7 journeys use board input. The endpoint only sets the starting position.
// These calls start only after the mounted board has requested its preview.
const settleBoardReads = (page: Page) => expect.poll(() => page.frameLocator('iframe').locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
async function turnBoard(fen?: string, clock = false) {
  const page = await open(view(''), 393, 852, clock), frame = page.frameLocator('iframe');
  const result = await (await page.request.post(new URL(fen ? `/fixture-position?fen=${encodeURIComponent(fen)}` : '/fixture-position?case=haste', harness.url).href)).json();
  expect(result.isError).not.toBe(true);
  await page.evaluate(result => (window as any).harnessShow(result), result);
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
  await settleBoardReads(page);
  return {page, frame, base:result._meta.view as View};
}
async function squarePoint(page: Page, square: number) {
  const frame = page.frameLocator('iframe'), pane = (await page.locator('iframe').boundingBox())!;
  await frame.locator('#board canvas').waitFor({state:'visible'});
  const point = await frame.locator('#board canvas').evaluate((canvas, sq) => {
    const r = canvas.getBoundingClientRect(), k = r.width / 960;
    return {x:r.x+(32+((sq&7)+.5)*112)*k, y:r.y+(96+(7-(sq>>3)+.5)*112)*k};
  }, square);
  return {x:pane.x+point.x, y:pane.y+point.y};
}
async function squareTap(page: Page, square: number) {
  const point = await squarePoint(page, square);
  await page.mouse.click(point.x, point.y);
}
async function chooseTurnMove(page: Page, lan: string, from: number) {
  const frame = page.frameLocator('iframe');
  await squareTap(page, from); await frame.locator('#board-menu').click();
  await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
  await frame.locator(`#choices button[title="${lan}"]`).click();
  await expect.poll(async () => (await savedDraft(page))?.lans.at(-1)).toBe(lan);
  await frame.locator('#board[data-animating="false"]').waitFor();
}
const moveCalls = (page: Page) => page.evaluate(() => ((window as any).harnessCalls ?? []).filter((c: any) => c.name === 'kingdown_move'));
const boardFen = (page: Page) => page.frameLocator('iframe').locator('html').evaluate<string>('(async () => { const { toFen } = await import("/src/rules/setup.ts"); return toFen(window.testBoard.pos); })()');

// Spec G3 a (J9 a): a shove or swap onto your own piece waits for a second tap; any other tap lets it go and never plays a move.
const cursorOf = (page: Page) => page.frameLocator('iframe').locator('html').evaluate(() => (window as any).testBoard.cursor);
it('G3: the ogre holds a shove onto its own pawn and plays it on the second tap', async () => {
  const fen = 'k7/8/8/8/8/2p5/3pP3/4O2K w - - 0 1', base = view(fen), page = await open(base), frame = page.frameLocator('iframe');
  setRules(base.rules!); const pre = fromFen(fen), shove = legalMoves(pre).find(m => m.from === 4 && m.shove?.from === 12)!;
  expect(shove).toBeDefined();
  try {
    await squareTap(page,4);
    expect((await marks(page)).shoves).toEqual([12]); expect((await marks(page)).moves.length).toBeGreaterThan(0); expect((await marks(page)).captures).toContain(11);
    await squareTap(page,12);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    expect(await frame.locator('#context-note').textContent()).toBe(describeMove(pre,shove));
    expect(await marks(page)).toMatchObject({selected:4, moves:[], captures:[], swaps:[], shoves:[12], shoveTo:[{from:12,to:20}]});
    expect(await cursorOf(page)).toBe(12);
    expect(await boardFen(page)).toBe(fen);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    // An unmarked empty square that the ogre can reach lets the shove go and clears the selection, without moving.
    await squareTap(page,3);
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await cursorOf(page)).toBe(null);
    expect(await boardFen(page)).toBe(fen);
    // An unmarked enemy piece that the ogre can take lets the shove go and reads that piece, without taking it.
    await squareTap(page,4); await squareTap(page,12);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    await squareTap(page,11);
    expect(await frame.locator('#status').textContent()).toBe('Black Pawn.');
    expect((await marks(page)).read).toBeDefined();
    expect(await boardFen(page)).toBe(fen);
    // Holding the shove again clears the enemy read, so All rules opens the ogre's rules.
    await squareTap(page,12);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    expect((await marks(page)).read).toBeUndefined();
    await frame.locator('#all-rules').click();
    expect(await frame.locator('#board-sheet').innerText()).toContain(readText(pre,4));
    await frame.locator('#board-sheet button[aria-label="Close"]').click();
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    // Escape lets the held shove go and clears the selection.
    await page.keyboard.press('Escape');
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await cursorOf(page)).toBe(null);
    // Another own piece: the shove goes, and that piece is selected.
    await squareTap(page,4); await squareTap(page,12);
    await squareTap(page,7);
    expect((await marks(page)).selected).toBe(7);
    expect(await frame.locator('#status').textContent()).not.toBe('Select again to shove.');
    expect(await cursorOf(page)).toBe(null);
    // The let-go shove does not play on the next tap of the pawn: that tap holds it again.
    await squareTap(page,4); await squareTap(page,12);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    expect(await boardFen(page)).toBe(fen);
    await squareTap(page,12); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(makeMove(pre,shove)));
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('G3: the maester holds a swap with its own rook, by tap and by keyboard', async () => {
  const fen = '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', base = view(fen), page = await open(base), frame = page.frameLocator('iframe');
  setRules(base.rules!); const pre = fromFen(fen), swap = legalMoves(pre).find(m => m.from === 27 && m.to === 26 && m.swap)!;
  expect(swap).toBeDefined();
  try {
    await squareTap(page,27); await squareTap(page,26);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    expect(await frame.locator('#context-note').textContent()).toBe(describeMove(pre,swap));
    expect(await marks(page)).toMatchObject({selected:27, moves:[], captures:[], shoves:[], swaps:[26]});
    expect(await boardFen(page)).toBe(fen);
    // A tap on the maester lets the swap go and clears the selection, as before.
    await squareTap(page,27);
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await boardFen(page)).toBe(fen);
    // Keyboard: Enter on the rook holds the swap, and a second Enter plays it.
    await frame.locator('#board').focus();
    for (const key of ['ArrowRight','ArrowRight','ArrowRight','ArrowUp','ArrowUp','ArrowUp','Enter','ArrowLeft','Enter']) await page.keyboard.press(key);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    expect(await boardFen(page)).toBe(fen);
    await page.keyboard.press('Enter'); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(makeMove(pre,swap)));
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('G3: an armed Sky Lift card holds a swap of two own pieces, and Cancel ends it', async () => {
  const fen = '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', rules: Partial<Rules> = { hands: [['SkyLift'], []] };
  const base = view(fen, rules), page = await open(base), frame = page.frameLocator('iframe');
  setRules(rules); const pre = fromFen(fen), swap = legalMoves(pre).find(m => m.power === 'skylift')!;
  expect(swap).toBeDefined(); const use = async () => { await frame.locator('#card-w-0').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click(); };
  try {
    await use(); await squareTap(page,swap.from); await squareTap(page,swap.to);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    expect(await frame.locator('#context-note').textContent()).toBe(describeMove(pre,swap));
    expect(await frame.locator('#context-text').getAttribute('data-rank')).toBe('armed');
    expect(await marks(page)).toMatchObject({selected:swap.from, moves:[], captures:[], shoves:[], swaps:[swap.to]});
    expect(await boardFen(page)).toBe(fen);
    // Cancel ends the armed card and the held swap.
    await frame.locator('#context-actions').getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await frame.locator('#status').textContent()).not.toBe('Select again to swap.');
    expect(await cursorOf(page)).toBe(null);
    // The second tap on the target plays the swap as a draft step.
    await use(); await squareTap(page,swap.from); await squareTap(page,swap.to);
    expect(await frame.locator('#status').textContent()).toBe('Select again to swap.');
    await squareTap(page,swap.to); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(makeMove(pre,swap)));
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it.each([
  ['shove', 'k7/8/8/8/8/8/4P3/4O2K w - - 0 1', 4, 12],
  ['swap', '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', 27, 26],
] as const)('G3: a drag onto your own piece previews the %s', async (action, fen, from, target) => {
  const page = await open(view(fen)), frame = page.frameLocator('iframe');
  try {
    const a = await squarePoint(page, from), b = await squarePoint(page, target);
    await page.mouse.move(a.x, a.y); await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 }); await page.mouse.up();
    expect(await frame.locator('#status').textContent()).toBe(`Select again to ${action}.`);
    expect(await boardFen(page)).toBe(fen);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    await squareTap(page, target); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).not.toBe(fen);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('G3: Undo lets a held shove go in the second move of a Haste turn', async () => {
  const fen = 'k7/8/8/8/8/8/3P4/4O2K w - - 0 1', rules: Partial<Rules> = { kings: [{ king: 'Flame', power: 'Haste' }, null] };
  const base = view(fen, rules), page = await open(base), frame = page.frameLocator('iframe');
  setRules(rules); const pre = fromFen(fen), haste = legalMoves(pre).find(m => m.power === 'haste' && m.from === 4 && m.to === 12)!;
  expect(haste).toBeDefined(); const mid = makeMove(pre, haste);
  try {
    await frame.locator('#power-w').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    await squareTap(page,4); await squareTap(page,12); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(mid));
    await squareTap(page,12); await squareTap(page,11);
    expect(await frame.locator('#status').textContent()).toBe('Select again to shove.');
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    await frame.locator('#undo').click();
    expect(await boardFen(page)).toBe(fen);
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    expect(await cursorOf(page)).toBe(null);
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it.each(['Resign', 'Abort'])('W7: Menu %s drops the draft move from the end card and trail', async action => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button',{name:action,exact:action === 'Resign'}).click();
    await frame.locator('#board-sheet').getByRole('button',{name:action,exact:true}).click();
    // od-end ticket 06: a computer abort opens the Play hall with its setup; a resign opens the end card.
    await frame.locator(action === 'Resign' ? '#over[open]' : '[data-screen="play"]:not([hidden])').waitFor();
    expect(await moveCalls(page)).toEqual([]);
    expect(await page.evaluate(() => (window as any).harnessView.fen)).toBe(base.fen);
    if (action === 'Resign') {
      expect(await frame.locator('#end-reason').innerText()).toBe('You resigned.');
      expect(await frame.locator('#last-move').innerText()).toBe('Move 1.');
    }
    expect((await marks(page)).last).toEqual([]);
  } finally { await page.close(); }
});

it('W7-04: an incremental draw reply keeps the draft and the draw note (D13)', async () => {
  const initial_fen = '4k3/7p/8/8/8/8/4P3/4K3 b - - 0 1';
  const prior = applyLan(fromFen(initial_fen),'h7-h5',{})!;
  const base = view(toFen(prior.pos), {}, {kind:'friend', revision:1, history:{initial_fen,actions:['h7-h5']}});
  const page = await open(base), frame = page.frameLocator('iframe');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    // Ticket 04 (D13): a draw offer is a new revision with the same base FEN, so the draft stays.
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {...base, revision:2, history:undefined, draw_offer:1, last_commands:[{seq:2, seat:1, at:base.server_now, action:{type:'draw',choice:'offer'}}]});
    expect(await boardFen(page)).toBe(toFen(applyLan(fromFen(base.fen),'e2-e4',{})!.pos));
    expect((await savedDraft(page)).scope.revision).toBe(2);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await frame.locator('#last-move').innerText()).toBe('White pawn e2 to e4.');
    expect(await frame.locator('#context-note').innerText()).toContain('Your opponent offers a draw.');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('W7: Escape from the move sheet clears selection and keeps the Haste draft', async () => {
  const {page,frame,base} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    const staged = applyLan(fromFen(base.fen),'e2-e4!H',base.rules!)!;
    await squareTap(page,28); await frame.locator('#board-menu').click();
    await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
    expect(await frame.locator('#choices button[title="e4-e5"]').count()).toBe(1);
    await page.keyboard.press('Escape');
    expect(await frame.locator('#board-sheet[open]').count()).toBe(0);
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('#choices button').count()).toBe(0);
    await squareTap(page,36);
    expect(await frame.locator('#board').getAttribute('data-animating')).toBe('false');
    expect(await boardFen(page)).toBe(toFen(staged.pos));
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it.each(['power','card'] as const)('W7: Escape on the board and sheet clears %s arming', async kind => {
  const rules: Partial<Rules> = kind === 'power' ? {kings:[{king:'Flame',power:'Haste'},null]} : {hands:[['Haste'],[]]};
  const base = view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1',rules), page = await open(base), frame = page.frameLocator('iframe');
  try {
    for (const sheet of [false,true]) {
      await frame.locator(kind === 'power' ? '#power-w' : '#card-w-0').click();
      await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).click();
      await squareTap(page,12);
      if (sheet) { await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click(); }
      else await frame.locator('#board').focus();
      await page.keyboard.press('Escape');
      expect(await frame.locator('#board-sheet[open]').count()).toBe(0);
      expect((await marks(page)).selected).toBeUndefined();
      expect((await marks(page)).powers).toEqual([]);
      expect(await frame.locator('#choices button').count()).toBe(0);
      await squareTap(page,28);
      expect(await boardFen(page)).toBe(base.fen);
    }
    await squareTap(page,12); await squareTap(page,28); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(toFen(applyLan(fromFen(base.fen),'e2-e4',rules)!.pos));
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it.each([['C',''], ['c',''], ['V',''], ['v',''], ['T','Y'], ['t','Y'], ['T',''], ['t','']])('shows a letter and opens rules when %s has no portrait (design letter %s)', async (letter, designLetter) => {
  const designed = !!designLetter;
  const rules = designed ? parseRule(`design=${designCode({ ...fromPreset(PRESETS.find(p => p.key === 'rook')!), name: 'Old Ward', letter: designLetter })}`) : {};
  const page = await open(view(`7k/8/8/8/3${letter}4/8/P7/K7 w - - 0 1`, rules), 320, 568), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await frame.locator('#board').evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    });
    await squareTap(page, 27);
    const info = frame.getByRole('button', {name:'All rules',exact:true});
    for (const [width, height] of [[320,568], [393,852]]) {
      await page.setViewportSize({width, height});
      expect(await info.isVisible()).toBe(true);
      expect(await info.locator('.portrait').textContent()).toBe(designLetter || letter.toUpperCase());
      expect(await info.locator('.portrait').evaluate(el => { const style = getComputedStyle(el); return style.fontSize === style.getPropertyValue('--fs-xl').trim(); })).toBe(true);
      expect(await info.locator('img').count()).toBe(0);
      expect(await info.evaluate(button => {
        const b = button.getBoundingClientRect(), r = button.parentElement!.getBoundingClientRect();
        return b.width >= 44 && b.height >= 44 && b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom;
      })).toBe(true);
      await info.click();
      expect(await frame.locator('#board-sheet').innerText()).toContain(designed ? 'Old Ward' : letter.toUpperCase() === 'C' ? 'catapult' : letter.toUpperCase() === 'V' ? 'reaver' : 'templar');
      await frame.locator('#board-sheet').getByRole('button', {name:'Close',exact:true}).click();
      expect(await info.evaluate(button => button === document.activeElement)).toBe(true);
    }
  } finally { await page.close(); }
});

it.each([[320,568],[360,640],[852,393]])('keeps draw offer board and row size with the pawn portrait and actions at %d×%d', async (width,height) => {
  const rules: Partial<Rules> = {kings:[{king:'Mud',power:'March'},{king:'Shadow',power:'Darkness'}],hands:[['Haste'],['Haste']],marchUses:0};
  const page = await open(view('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',rules,{kind:'friend',draw_offer:1}),width,height), frame = page.frameLocator('iframe');
  const sizes = () => frame.locator('#context-line').evaluate(async row => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return {
      board: document.querySelector('#board canvas')!.getBoundingClientRect().width,
      row: row.getBoundingClientRect().height,
      text: document.getElementById('context-text')!.getBoundingClientRect().height,
      actions: document.getElementById('context-actions')!.getBoundingClientRect().height,
    };
  });
  try {
    await page.evaluate(safeAreaInsets => (window as any).harnessSetContext({safeAreaInsets}),{top:height>width?63:0,right:0,bottom:height>width?84:0,left:0});
    await frame.locator('#board').evaluate(() => document.fonts.ready.then(() => {}));
    const before = await sizes();
    await squareTap(page,12);
    expect(await frame.getByRole('button', {name:'All rules',exact:true}).isVisible()).toBe(true);
    expect(await frame.locator('#context-actions button').allTextContents()).toEqual(['Choose a move','Accept draw','Decline draw']);
    const after = await sizes();
    expect(Math.abs(before.board-after.board), JSON.stringify({before,after})).toBeLessThan(1);
    expect(Math.abs(before.row-after.row), JSON.stringify({before,after})).toBeLessThan(1);
    expect(await frame.locator('#context-actions').evaluate(edgeMisses)).toEqual([]);
  } finally { await page.close(); }
});

it.each([[320,568],[393,852]] as const)('Q3 b: a draw offer keeps the board size, and the screen scrolls to the replies at %d×%d', async (width,height) => {
  const rules: Partial<Rules> = {kings:[{king:'Mud',power:'March'},{king:'Shadow',power:'Darkness'}],hands:[['Haste'],['Haste']],marchUses:0};
  const base = view('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',rules,{kind:'friend'});
  const page = await open(base,width,height), frame = page.frameLocator('iframe');
  const boardWidth = () => frame.locator('#board canvas').evaluate(async canvas => { await document.fonts.ready; return canvas.getBoundingClientRect().width; });
  try {
    await page.evaluate(safeAreaInsets => (window as any).harnessSetContext({safeAreaInsets}),insets(width));
    const before = await boardWidth();
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {...base, revision:1, draw_offer:1});
    await frame.locator('#accept-draw').waitFor();
    const after = await boardWidth();
    expect(after, `board ${before} → ${after}`).toBeGreaterThanOrEqual(before - 1);
    // The replies stay reachable: the screen scrolls to them rather than shrinking the board.
    const screen = await frame.locator('[data-screen="board"]').evaluate(el => ({ overflow: getComputedStyle(el).overflowY, over: el.scrollWidth > el.clientWidth + 1 }));
    expect(screen.overflow).toBe('auto'); expect(screen.over).toBe(false);
    expect(await frame.locator('#accept-draw').evaluate(el => {
      el.scrollIntoView({block:'nearest'});
      const r = el.getBoundingClientRect(), box = document.querySelector('[data-screen="board"]')!.getBoundingClientRect();
      return r.top >= box.top - 1 && r.bottom <= box.bottom + 1 && r.left >= box.left - 1 && r.right <= box.right + 1;
    })).toBe(true);
    // No row shrinks under its content: each card coin stays inside its strip, so the status never covers it.
    expect(await frame.locator('#game-table .card-coin').evaluateAll(coins => coins.filter(coin => {
      const c = coin.getBoundingClientRect(), s = coin.closest('.player-strip')!.getBoundingClientRect();
      return c.top < s.top - 1 || c.bottom > s.bottom + 1;
    }).length)).toBe(0);
  } finally { await page.close(); }
});

it.each([[320,568],[393,852]] as const)('Q6 b: the narrow status text keeps 12 px at each side at %d×%d', async (width,height) => {
  const page = await open(view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1'),width,height), frame = page.frameLocator('iframe');
  try {
    await page.evaluate(safeAreaInsets => (window as any).harnessSetContext({safeAreaInsets}),insets(width));
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    const margins = await frame.locator('#context-line').evaluate(line => { const r = line.getBoundingClientRect(), s = line.closest('[data-screen="board"]')!.getBoundingClientRect(); return [r.left - s.left, s.right - r.right]; });
    expect(margins[0], 'left margin').toBeGreaterThanOrEqual(11.5); expect(margins[1], 'right margin').toBeGreaterThanOrEqual(11.5);
  } finally { await page.close(); }
});

it('W7: a draw offer keeps piece rules readable at 320 px before and during Send', async () => {
  const base = view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1',{}, {kind:'friend',draw_offer:1});
  const page = await open(base,320,568), frame = page.frameLocator('iframe');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    const staged = applyLan(fromFen(base.fen),'e2-e4',base.rules!)!;
    const rule = readText(staged.pos,28).split('\n')[0].split(' · ')[1];
    expect(rule).toBeTruthy();
    for (const sending of [false,true]) {
      if (sending) {
        await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
        await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
        await clickButton(page, frame.locator('#end-turn')); await page.waitForFunction(() => typeof (window as any).releaseBefore==='function');
      }
      await squareTap(page,28);
      expect(await frame.locator('#context-note').innerText()).toContain(rule);
      expect(await frame.locator('#context-note').innerText()).toContain('Your opponent offers a draw.');
      expect(await frame.locator('#all-rules').isEnabled()).toBe(true);
      expect(await frame.locator('#context-actions').evaluate(e => [...e.children].every(child => { const r=child.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth && r.bottom<=document.getElementById('table-bar')!.getBoundingClientRect().top; }))).toBe(true);
      expect(await frame.locator('#context-text').evaluate(e => e.getBoundingClientRect().bottom<=document.getElementById('context-actions')!.getBoundingClientRect().top)).toBe(true);
      await frame.locator('#all-rules').click();
      expect(await frame.locator('#board-sheet').innerText()).toContain(rule);
      await page.keyboard.press('Escape');
      expect(await boardFen(page)).toBe(toFen(staged.pos));
      expect((await moveCalls(page)).length).toBe(sending ? 1 : 0);
    }
  } finally { await closeHeld(page); }
});

it('W7: stages a move, sends once, and starts the computer only after the press', async () => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await squareTap(page,12); await squareTap(page,28);
    await expect.poll(async () => (await savedDraft(page))?.lans).toEqual(['e2-e4']);
    await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await moveCalls(page)).toEqual([]);
    expect(await page.evaluate(() => (window as any).harnessView.revision)).toBe(base.revision);
    expect(await page.evaluate(() => (window as any).harnessCalls.some((c: any) => c.name==='kingdown_computer'))).toBe(false);
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
    expect(await frame.locator('#end-turn').getAttribute('aria-label')).toBe('End turn');
    expect(await frame.locator('#end-turn').getAttribute('title')).toBe('End turn');
    expect(await frame.locator('#end-turn').innerText()).toBe('');
    expect(await frame.locator('#end-turn use').getAttribute('href')).toBe('#i-sword');
    await page.emulateMedia({reducedMotion:'reduce'});
    expect(await frame.locator('#end-turn').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn'));
    await page.waitForFunction(() => typeof (window as any).releaseBefore==='function');
    await frame.locator('#end-turn').evaluate(e => { (e as HTMLButtonElement).click(); });
    expect((await moveCalls(page)).map((c: any) => c.arguments.actions)).toEqual([['e2-e4']]);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    expect(await frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('true');
    expect(await frame.locator('#undo').evaluate(e => (e as HTMLButtonElement).disabled)).toBe(false); expect(await frame.locator('#end-turn').evaluate(e => (e as HTMLButtonElement).disabled)).toBe(false);
    await frame.locator('#undo').focus(); await page.keyboard.press('Tab');
    expect(await frame.locator('#end-turn').evaluate(e => e===document.activeElement)).toBe(true);
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_computer'; (window as any).releaseBefore(); });
    await page.waitForFunction(() => (window as any).harnessCalls.some((c: any) => c.name==='kingdown_computer'));
    expect(await frame.locator('#status').textContent()).toBe('Their move.');
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
  } finally { await closeHeld(page); }
});

it('W7: undoes both Haste steps and restores the power coin and trail', async () => {
  const {page,frame} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    expect(await frame.locator('#status').textContent()).toBe('Move it again, or select End turn.');
    expect(await frame.locator('#board').evaluate(e => e===document.activeElement)).toBe(true);
    await chooseTurnMove(page,'e4-e5',28);
    expect((await marks(page)).last).toEqual([12,28,36]);
    await frame.locator('#undo').click();
    expect((await marks(page)).last).toEqual([12,28]);
    await frame.locator('#undo').click();
    expect(await frame.locator('#power-w').getAttribute('data-state')).toBe('ready');
    expect(await frame.locator('#last-move').innerText()).toBe('Move 1.');
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    expect(await frame.locator('#undo').evaluate(e => e===document.activeElement)).toBe(true);
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});

it('W7: sends a mid-way Haste turn with a pass in the same command', async () => {
  const {page,frame} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    expect(await frame.getByRole('button',{name:'Stop here',exact:true}).count()).toBe(0);
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_computer'; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn'));
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
    expect((await moveCalls(page))[0].arguments.actions).toEqual(['e2-e4!H','--']);
  } finally { await closeHeld(page); }
});

it('W7: keeps reads and blocks legal tap, keyboard and drag moves before and during Send', async () => {
  const {page,frame,base} = await turnBoard(undefined, true);
  try {
    await chooseTurnMove(page,'e2-e4',12);
    const staged = applyLan(fromFen(base.fen),'e2-e4',base.rules!)!;
    expect(applyLan(staged.pos,'e7-e5',base.rules!)).toBeDefined();
    await frame.locator('html').evaluate(() => {
      const host=window as any, drag=host.testBoard.onDragSelect;
      host.dragAttempts=[]; host.testBoard.onDragSelect=(square: number) => { host.dragAttempts.push(square); drag(square); };
    });
    for (const sending of [false,true]) {
      if (sending) {
        // Input checks can outlast the request limit. Keep the held reply inside that limit.
        // Pause ahead of now; the page can pass that time before the command reaches it.
        for (let tries = 0; ; tries++) {
          try { await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000)); break; }
          catch (error) { if (tries >= 2 || !String(error).includes('Cannot fast-forward to the past')) throw error; }
        }
        await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
        await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
        await clickButton(page, frame.locator('#end-turn')); await page.waitForFunction(() => typeof (window as any).releaseBefore==='function');
      }
      expect(await frame.locator('#status').textContent()).toBe(sending ? 'Sending…' : 'Your turn is ready. Select End turn.');
      const unchanged = async () => {
        expect(await frame.locator('#board').getAttribute('data-animating')).toBe('false');
        expect(await boardFen(page)).toBe(toFen(staged.pos));
        expect(await page.evaluate(() => (window as any).harnessView.fen)).toBe(base.fen);
        expect((await moveCalls(page)).length).toBe(sending ? 1 : 0);
      };
      await squareTap(page,28);
      expect(await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
      if (sending) expect(await frame.locator('#context-text').innerText()).not.toMatch(/End turn|Undo/);
      else expect(await frame.locator('#context-note').textContent()).toContain('Select End turn, or Undo.');
      await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).click();
      await frame.locator('#board-sheet[open]').waitFor(); await page.keyboard.press('Escape');
      expect(await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).evaluate(e => e===document.activeElement)).toBe(true);
      await frame.locator('#power-w').click();
      expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
      await page.keyboard.press('Escape');
      expect(await frame.locator('#power-w').evaluate(e => e===document.activeElement)).toBe(true);
      await squareTap(page,52); await squareTap(page,36); await unchanged();
      const board=frame.locator('#board'); await board.focus();
      for (let n=0;n<7;n++) { await board.press('ArrowLeft'); await board.press('ArrowDown'); }
      for (let n=0;n<4;n++) await board.press('ArrowRight');
      for (let n=0;n<6;n++) await board.press('ArrowUp');
      expect(await board.getAttribute('aria-label')).toContain('e7,'); await board.press('Enter');
      await board.press('ArrowDown'); await board.press('ArrowDown');
      expect(await board.getAttribute('aria-label')).toContain('e5,'); await board.press('Enter'); await unchanged();
      const source=await squarePoint(page,52), target=await squarePoint(page,36);
      await page.mouse.move(source.x,source.y); await page.mouse.down(); await page.mouse.move(target.x,target.y,{steps:5}); await page.mouse.up();
      expect(await frame.locator('html').evaluate(() => (window as any).dragAttempts)).toEqual([]);
      await unchanged();
      if (!sending) { await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click(); }
      expect(await frame.locator('#choices button').count()).toBe(0); await page.keyboard.press('Escape');
      expect(await frame.locator('#last-move').innerText()).toContain('White pawn e2 to e4.');
      expect((await moveCalls(page)).length).toBe(sending?1:0);
    }
    await page.clock.resume();
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_computer'; (window as any).releaseBefore(); });
    await page.waitForFunction(() => (window as any).harnessCalls.some((c: any) => c.name==='kingdown_computer'));
    await squareTap(page,28);
    expect(await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
    await frame.locator('#power-w').click();
    expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
    await page.keyboard.press('Escape'); await squareTap(page,36); await frame.locator('#board').press('Enter');
    expect(await frame.locator('#last-move').innerText()).toContain('White pawn e2 to e4.');
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
  } finally { await closeHeld(page); }
});

it('W7: blocks a legal Haste follow-up while Send waits', async () => {
  const {page,frame,base} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    const staged = applyLan(fromFen(base.fen),'e2-e4!H',base.rules!)!;
    expect(staged.pos.turn).toBe(base.seat);
    expect(applyLan(staged.pos,'e4-e5',base.rules!)).toBeDefined();
    await frame.locator('html').evaluate(() => {
      const host=window as any, drag=host.testBoard.onDragSelect;
      host.dragAttempts=[]; host.testBoard.onDragSelect=(square: number) => { host.dragAttempts.push(square); drag(square); };
    });
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn')); await page.waitForFunction(() => typeof (window as any).releaseBefore==='function');
    expect(await frame.locator('#status').innerText()).toBe('Sending…');
    const unchanged = async () => {
      expect(await frame.locator('#board').getAttribute('data-animating')).toBe('false');
      expect(await boardFen(page)).toBe(toFen(staged.pos));
      expect(await page.evaluate(() => (window as any).harnessView.fen)).toBe(base.fen);
      expect((await moveCalls(page)).map((call: any) => call.arguments.actions)).toEqual([['e2-e4!H','--']]);
    };
    await squareTap(page,28); await squareTap(page,36); await unchanged();
    const board=frame.locator('#board'); await board.focus();
    for (let n=0;n<4;n++) await board.press('ArrowRight');
    for (let n=0;n<3;n++) await board.press('ArrowUp');
    expect(await board.getAttribute('aria-label')).toContain('e4,'); await board.press('Enter');
    await board.press('ArrowUp'); expect(await board.getAttribute('aria-label')).toContain('e5,'); await board.press('Enter'); await unchanged();
    const source=await squarePoint(page,28), target=await squarePoint(page,36);
    await page.mouse.move(source.x,source.y); await page.mouse.down(); await page.mouse.move(target.x,target.y,{steps:5}); await page.mouse.up();
    expect(await frame.locator('html').evaluate(() => (window as any).dragAttempts)).toEqual([]);
    await unchanged();
  } finally { await closeHeld(page); }
});

it('W7: stages mate, permits Undo, and ends only on the press with no second move animation', async () => {
  const {page,frame} = await turnBoard('k7/8/1K6/8/8/8/8/7R w - - 0 1');
  try {
    await frame.locator('html').evaluate(() => { const host=window as any, animate=host.testBoard.animateMove.bind(host.testBoard); host.turnAnimations=0; host.testBoard.animateMove=(...args: any[]) => { host.turnAnimations++; return animate(...args); }; });
    await squareTap(page,7); await squareTap(page,63);
    await expect.poll(async () => (await savedDraft(page))?.lans).toEqual(['Rh1-h8']);
    await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await frame.locator('#status').textContent()).toBe('Checkmate. Select End turn to finish.');
    expect(await frame.locator('#over[open]').count()).toBe(0); expect(await moveCalls(page)).toEqual([]);
    await clickButton(page, frame.locator('#undo'));
    await frame.locator('#status').filter({ hasText: 'Your move.' }).waitFor();
    expect(await frame.locator('#status').textContent()).toBe('Your move.');
    await squareTap(page,7); await squareTap(page,63);
    await expect.poll(async () => (await savedDraft(page))?.lans).toEqual(['Rh1-h8']);
    await frame.locator('#board[data-animating="false"]').waitFor();
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn')); await frame.locator('#over[open]').waitFor();
    expect(await frame.locator('html').evaluate(() => (window as any).turnAnimations)).toBe(2);
    expect((await moveCalls(page))[0].arguments.actions).toEqual(['Rh1-h8']);
  } finally { await page.close(); }
});

it('W7: moves keyboard focus to the turn button, sends with Enter, and undoes with Z', async () => {
  const {page,frame} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    const board=frame.locator('#board'); await board.focus();
    for(let n=0;n<4;n++) await board.press('ArrowRight'); await board.press('ArrowUp'); await board.press('Enter');
    await board.press('ArrowUp'); await board.press('ArrowUp'); await board.press('Enter');
    await expect.poll(() => frame.locator('#end-turn').evaluate(e => e===document.activeElement)).toBe(true);
    await frame.locator('#end-turn').press('z');
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    await board.press('ArrowDown'); await board.press('ArrowDown'); await board.press('Enter');
    await board.press('ArrowUp'); await board.press('ArrowUp'); await board.press('Enter');
    await frame.locator('#board[data-animating="false"]').waitFor(); await board.press('z');
    expect(await moveCalls(page)).toEqual([]);
    await board.press('ArrowDown'); await board.press('ArrowDown'); await board.press('Enter');
    await board.press('ArrowUp'); await board.press('ArrowUp'); await board.press('Enter');
    await expect.poll(() => frame.locator('#end-turn').evaluate(e => e===document.activeElement)).toBe(true);
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
    await frame.locator('#end-turn').press('Enter');
    expect(await board.evaluate(e => e===document.activeElement)).toBe(true);
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
  } finally { await closeHeld(page); }
});


it('W7: snaps to the draft if motion fails and keeps Undo available', async () => {
  const {page,frame,base} = await turnBoard();
  try {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message.replace(/^Error: /, '')));
    await frame.locator('html').evaluate(() => { (window as any).testBoard.animateMove=() => Promise.reject(new Error('Move motion test failure')); });
    await chooseTurnMove(page,'e2-e4',12);
    await expect.poll(() => errors).toEqual(['Move motion test failure']);
    expect(await frame.locator('html').evaluate(() => Array.from((window as any).testBoard.pos.board))).toEqual([...applyLan(fromFen(base.fen),'e2-e4',base.rules!)!.pos.board]);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    await frame.locator('#undo').click();
    expect(await frame.locator('#last-move').innerText()).toBe('Move 1.');
    expect(await moveCalls(page)).toEqual([]);
  } finally { await page.close(); }
});


it('W7: keeps a lost-send error while pieces and coins remain readable', async () => {
  const {page,frame} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4',12);
    await page.evaluate(() => { (window as any).dropNextMoveReply=true; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn')); await frame.locator('#retry').waitFor();
    const message=await frame.locator('#error').innerText(); expect(message).not.toBe('');
    await squareTap(page,28);
    expect(await frame.locator('#error').innerText()).toBe(message);
    expect(await frame.locator('#context-line').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
    await frame.locator('#power-w').click();
    expect(await frame.locator('#error').innerText()).toBe(message);
    expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
  } finally { await page.close(); }
});

it('W7: a lost send shows the waiting words beside Retry, not Sending, also after a remount', async () => {
  const {page,frame} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    // The connection drops before the server gets the turn, so the restored draft and command stay after a remount.
    await page.route('**/fixture-tool', route => route.request().postDataJSON()?.name === 'kingdown_move' ? route.abort() : route.continue());
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn')); await frame.locator('#retry').waitFor();
    // Nothing is in flight now: send-turn 03 A3 shows Sending only while the turn waits for its reply.
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
    await remountBoard(page);
    await frame.locator('#retry').waitFor();
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
  } finally { await page.close(); }
});


// W7 ticket 04 browser journeys (design §7.4 D9 to D13): the draft in widget state, its restore and its keep-or-drop.
const getCalls = (page: Page) => page.evaluate(() => ((window as any).harnessCalls ?? []).filter((c: any) => c.name === 'kingdown_get').length);
const savedDraft = (page: Page) => page.evaluate(() => (window as any).harnessWidgetState.privateContent?.draft ?? null);
async function remountBoard(page: Page) {
  await page.locator('#remount').evaluate(e => (e as HTMLButtonElement).click());
  const frame = page.frameLocator('iframe');
  await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
  await frame.locator('html').evaluate('(async () => { window.testBoard = (await import("/src/plugin/board-view.ts")).board; })()');
}

it('W7-04: restores a saved draft after a remount only when the game, the base FEN and the replay agree (D9)', async () => {
  for (const change of ['same', 'fen', 'lan'] as const) {
    const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
    try {
      await chooseTurnMove(page,'e2-e4',12);
      expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
      if (change !== 'same') await page.evaluate(change => {
        const host = window as any, state = structuredClone(host.harnessWidgetState), draft = state.privateContent.draft;
        if (change === 'fen') draft.fen = '7k/8/8/8/8/8/8/7K w - - 0 1'; else draft.lans = ['e2-e5'];
        host.harnessWidgetState = state;
      }, change);
      await remountBoard(page);
      await settleBoardReads(page);
      if (change === 'same') {
        const draft = await savedDraft(page);
        expect(draft.lans).toEqual(['e2-e4']);
        expect(await frame.locator('#last-move').innerText()).toBe('White pawn e2 to e4.');
        expect(await frame.locator('#short-move-words').innerText()).toBe('White pawn e2 → e4');
        expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Select End turn.');
        expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
        expect(await boardFen(page)).toBe(toFen(applyLan(fromFen(base.fen),'e2-e4',base.rules!)!.pos));
      } else {
        expect(await savedDraft(page)).toBeNull();
        expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
        expect(await boardFen(page)).toBe(base.fen);
      }
    } finally { await page.close(); }
  }
});

it('W7-04: a refused press after a real draw offer keeps T6 and the note, then saves the turn (D10)', async () => {
  const page = await open(view('')), frame = page.frameLocator('iframe');
  const tool = async (name: string, args: Record<string, unknown> = {}, friend = false) => {
    const result = await (await page.request.post(new URL(friend ? '/fixture-friend-tool' : '/fixture-tool', harness.url).href, {data:{name,arguments:args}})).json();
    expect(result.isError, JSON.stringify(result.content)).not.toBe(true); return result;
  };
  try {
    const created = await tool('kingdown_create', {kind:'friend', colour:'white', options:{...DEFAULT_OPTIONS, fairy:false, pool:[], classic:true, arrangement:false}});
    const game_id = created._meta.view.game_id;
    const invite = await tool('kingdown_invite', {game_id});
    await tool('kingdown_join', {code:invite.structuredContent.code}, true);
    const result = await tool('kingdown_open', {game_id});
    await page.evaluate(result => (window as any).harnessShow(result), result);
    await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
    const base = result._meta.view as View;
    await chooseTurnMove(page,'e2-e4',12);
    const offered = (await tool('kingdown_draw', {game_id, choice:'offer'}, true))._meta.view as View;
    expect(offered.revision).toBeGreaterThan(base.revision);
    // The page still has the revision from before the offer. The server refuses that first press.
    await clickButton(page, frame.locator('#end-turn'));
    await frame.locator('#status').filter({hasText:'The game changed. Check it, then tap Send your turn.'}).waitFor();
    await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
    await settleBoardReads(page);
    expect(await frame.locator('#context-note').innerText()).toContain('Your opponent offers a draw.');
    await frame.locator('#undo[aria-disabled="false"]').waitFor();
    expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
    expect(await frame.locator('#last-move').innerText()).toBe('White pawn e2 to e4.');
    expect(await frame.locator('#short-move-words').innerText()).toBe('White pawn e2 → e4');
    await clickButton(page, frame.locator('#end-turn'));
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.state.pending ?? null)).toBeNull();
    const saved = (await tool('kingdown_get', {game_id}))._meta.view as View;
    expect(saved.revision).toBe(offered.revision + 1);
    setRules(base.rules!);
    expect(saved.fen).toBe(toFen(applyLan(fromFen(base.fen),'e2-e4',base.rules!)!.pos));
    expect(saved.draw_offer).toBeNull();
    expect(saved.history!.actions).toEqual(['e2-e4']);
    expect(await savedDraft(page)).toBeNull();
    expect((await moveCalls(page)).map((c: any) => c.arguments.actions)).toEqual([['e2-e4'], ['e2-e4']]);
  } finally { await page.close(); }
});

it('W7-04: a press refused with INVALID_MOVE drops the draft and reads once (D11)', async () => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    const reads = await getCalls(page);
    await page.evaluate(() => { (window as any).rejectNextMove = 'INVALID_MOVE'; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn'));
    await frame.locator('#error').filter({hasText:'Harness definitive rejection'}).waitFor();
    // The draft drops, the board returns to the base FEN, and the rollback reads the board once.
    await expect.poll(() => savedDraft(page)).toBeNull();
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    await expect.poll(() => getCalls(page)).toBe(reads + 1);
    await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
    expect(await boardFen(page)).toBe(base.fen);
    expect((await moveCalls(page)).length).toBe(1);
  } finally { await page.close(); }
});

it('W7-04: a lost send keeps the ID, revision and actions for Retry, and drops the draft when the FEN moves (D12)', async () => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    await page.evaluate(() => { (window as any).dropNextMoveReply=true; });
    await frame.locator('#end-turn:not(:disabled):not([aria-disabled="true"])').waitFor();
    await clickButton(page, frame.locator('#end-turn'));
    await frame.locator('#retry').waitFor();
    const first = (await moveCalls(page))[0].arguments;
    // Undo is off while the send waits; the draft stays in widget state.
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
    await frame.locator('#retry').click();
    await frame.locator('#retry').waitFor({state:'hidden'});
    const calls = await moveCalls(page);
    expect(calls.length).toBe(2);
    expect(calls.map((c: any) => [c.arguments.command_id, c.arguments.expected_revision, c.arguments.actions]))
      .toEqual([[first.command_id, first.expected_revision, first.actions],[first.command_id, first.expected_revision, first.actions]]);
    // The retry's read shows the sent position, so the base FEN moved and the draft drops.
    await expect.poll(() => savedDraft(page)).toBeNull();
  } finally { await page.close(); }
});

it.each(['playing', 'setup', 'waiting'] as const)('W7-04: keeps the draft through sheets and an equal-revision poll, and drops it for another %s game (D13)', async status => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await chooseTurnMove(page,'e2-e4',12);
    // A sheet.
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Moves',exact:true}).click();
    await page.keyboard.press('Escape');
    expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
    // Settings, then back to the game.
    await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Settings',exact:true}).click();
    await frame.locator('[data-screen="settings"]:not([hidden])').waitFor();
    await frame.locator('html').evaluate((_, next) => { (window as any).harnessApp.navigate('play'); (window as any).harnessApp.routeView(next); }, base);
    await frame.locator('[data-screen="board"]:not([hidden])').waitFor();
    await expect.poll(() => savedDraft(page)).toMatchObject({lans: ['e2-e4']});
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('false');
    expect(await frame.locator('#last-move').innerText()).toBe('White pawn e2 to e4.');
    expect(await frame.locator('#short-move-words').innerText()).toBe('White pawn e2 → e4');
    // An equal-revision poll keeps it.
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {...base, opponent: {...base.opponent, last_seen_ms: 1234}});
    expect((await savedDraft(page)).lans).toEqual(['e2-e4']);
    // Another game drops it.
    const other = view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1', {}, { status, ...(status !== 'playing' && { fen: '', kind: 'friend' }) });
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), other);
    await expect.poll(() => savedDraft(page)).toBeNull();
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), base);
    expect(await savedDraft(page)).toBeNull();
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
  } finally { await page.close(); }
});

it.each(['teardown', 'close'] as const)('keeps the player strips fixed when a profile reply follows %s', async lifecycle => {
  const page = await browser.newPage(); page.setDefaultTimeout(3000 * STEP);
  const frame = page.frameLocator('iframe');
  try {
    await page.goto(harness.url); await waitForSourceApp(page); await frame.locator('#home-play:not(:disabled)').waitFor();
    await page.evaluate(() => { (window as any).holdNext = 'kingdown_profile'; });
    await page.route('**/fixture-tool', route => route.request().postDataJSON()?.name === 'kingdown_profile'
      ? route.fulfill({ json: { content: [], _meta: { record: { rating: { rating: 1900, provisional: false } } } } }) : route.continue());
    await page.evaluate(() => (window as any).harnessSetContext({ displayMode: 'fullscreen' }));
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), view('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1', {}, { kind: 'friend' }));
    await page.waitForFunction(() => typeof (window as any).releaseHeld === 'function');
    await frame.locator('#board[aria-busy="false"]').waitFor();
    if (lifecycle === 'teardown') await page.evaluate(() => (window as any).harnessTeardown());
    else await frame.locator('html').evaluate('(async () => { (await import("/src/account-game/host.ts")).runtimeHost().onClose?.(); })()');
    await frame.locator('html').evaluate(() => {
      const w = window as any;
      w.closedStrips = [...document.querySelectorAll('#strip-me, #strip-them')].map(node => ({ node: node.firstChild, text: node.textContent }));
    });
    await page.evaluate(() => (window as any).releaseHeld());
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    await frame.locator('html').evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    expect(await frame.locator('html').evaluate(() => [...document.querySelectorAll('#strip-me, #strip-them')].every((node, i) => {
      const before = (window as any).closedStrips[i]; return node.firstChild === before.node && node.textContent === before.text;
    }))).toBe(true);
  } finally { await page.evaluate(() => (window as any).releaseHeld?.()).catch(() => {}); await page.close(); }
});

it('F05: draws one keyboard cursor at the tile and clears it on Escape or blur', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), 390, 844), frame = page.frameLocator('iframe');
  const proof = join(tmpdir(), 'kingdown-gui-board-proof'); await import('node:fs/promises').then(fs => fs.mkdir(proof, { recursive: true }));
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await frame.locator('#board').focus();
    await frame.locator('#board').press('ArrowRight');
    async function cursorBox() {
      return frame.locator('#board .mk-cursor').evaluate(mark => {
        const at = (window as any).testBoard.screenOf(1), next = (window as any).testBoard.screenOf(2), width = Math.hypot(at.x - next.x, at.y - next.y), box = mark.getBoundingClientRect(), style = getComputedStyle(mark);
        return { dx: Math.abs(box.x - at.x + width / 2), dy: Math.abs(box.y - at.y + width / 2), dw: Math.abs(box.width - width), border: style.borderTopWidth, color: style.borderTopColor };
      });
    }
    expect(await frame.locator('#board-marks[aria-hidden="true"]').count()).toBe(1);
    expect(await frame.locator('#board .mk-cursor').count()).toBe(1);
    const box = await cursorBox(); expect(box.dx).toBeLessThanOrEqual(1); expect(box.dy).toBeLessThanOrEqual(1); expect(box.dw).toBeLessThanOrEqual(1);
    expect(box.border).toBe('2px'); expect(box.color).toBe('rgb(43, 38, 33)');
    await frame.locator('#board .mk-cursor').evaluate(e => { (e as HTMLElement).style.visibility = 'hidden'; });
    await frame.locator('#board').screenshot({ path: join(proof, 'f05-before.png') });
    await frame.locator('#board .mk-cursor').evaluate(e => { (e as HTMLElement).style.visibility = ''; });
    await frame.locator('#board').screenshot({ path: join(proof, 'f05-after.png') });
    await page.setViewportSize({ width: 430, height: 844 });
    await expect.poll(async () => (await cursorBox()).dx).toBeLessThanOrEqual(1);
    await frame.locator('#board').press('Escape'); expect(await frame.locator('.mk-cursor').count()).toBe(0);
    await frame.locator('#board').press('ArrowLeft'); expect(await frame.locator('.mk-cursor').count()).toBe(1);
    await frame.locator('#board-menu').focus(); expect(await frame.locator('.mk-cursor').count()).toBe(0);
  } finally { await page.close(); }
});

it('N10: keeps the board name and Enter hint with the short cursor words', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1')), frame = page.frameLocator('iframe');
  try {
    const board = frame.locator('#board'), live = frame.locator('#cursor-say');
    expect(await frame.locator('#cursor-say[aria-live="polite"]').count()).toBe(1);
    for (const [key, words] of [
      ['ArrowUp', 'a2, white pawn'], ['Enter', 'a2, white pawn, selected'],
      ['ArrowUp', 'a3, empty, can go here'], ['ArrowRight', 'b3, empty'],
    ]) {
      await board.press(key);
      expect(await board.getAttribute('aria-label')).toBe(`Chess board, ${words}. Enter selects a square.`);
      expect(await live.textContent()).toBe(words);
    }
  } finally { await page.close(); }
});

it('N10: says "can go here" on the squares that an armed power can use', async () => {
  const page = await open(view('4k3/1p6/8/8/8/8/4P3/4K3 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, null] })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#power-w').click();
    await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const board = frame.locator('#board'), live = frame.locator('#cursor-say');
    await board.press('ArrowRight'); for (let i = 0; i < 5; i++) await board.press('ArrowUp');
    expect(await live.textContent()).toBe('b6, empty');
    await board.press('ArrowUp');
    expect(await live.textContent()).toBe('b7, black pawn, can go here');
  } finally { await page.close(); }
});

it.each(['Escape', 'blur'] as const)('N10: clears the cursor text when %s hides a selected cursor', async input => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1')), frame = page.frameLocator('iframe');
  try {
    const board = frame.locator('#board'), live = frame.locator('#cursor-say');
    await board.press('ArrowUp'); await board.press('Enter');
    expect(await live.textContent()).toBe('a2, white pawn, selected');
    if (input === 'Escape') await board.press('Escape');
    else await frame.locator('#board-menu').focus();
    expect(await board.getAttribute('aria-label')).toBe('Chess board');
    expect(await live.textContent()).toBe('');
    expect(await frame.locator('.mk-cursor').count()).toBe(0);
    if (input === 'Escape') {
      expect((await marks(page)).selected).toBeUndefined();
      await board.press('ArrowUp');
      expect(await live.textContent()).toBe('a3, empty');
    }
  } finally { await page.close(); }
});

it('F06: marks only the armed usable card and shows the gold band', async () => {
  const rules: Partial<Rules> = { hands: [['Strike', 'Freeze', 'IceWall', 'Vault'], ['Strike']] };
  const page = await open(view('7k/8/8/8/8/8/P7/R6K w - - 0 1', rules), 390, 844), frame = page.frameLocator('iframe');
  const proof = join(tmpdir(), 'kingdown-gui-board-proof'); await import('node:fs/promises').then(fs => fs.mkdir(proof, { recursive: true }));
  try {
    await page.evaluate(() => (window as any).harnessSetContext({ theme: 'dark' }));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await frame.locator('#card-w-0').click(); await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).click();
    const coin = frame.locator('#card-w-0');
    expect(await coin.getAttribute('data-state')).toBe('armed'); expect(await coin.getAttribute('aria-pressed')).toBe('true');
    expect(await frame.locator('#strip-me .card-coin[aria-pressed="false"]').count()).toBe(3);
    expect(await frame.locator('#strip-them .card-coin[aria-pressed]').count()).toBe(0);
    const pixels = await coin.screenshot({ path: join(proof, 'f06-coin.png') });
    const sharp = (await import('sharp')).default, image = await sharp(pixels).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const x = Math.floor(image.info.width / 2), at = (3 * image.info.width + x) * 4;
    expect(await coin.evaluate(e => getComputedStyle(e.querySelector('.coin-paint')!).boxShadow)).toMatch(/rgb\(233, 192, 113\)[^,]*\b5px\b/);
    // Linux rasters put this pixel up to 14 levels off gold-bright; the ink ring and the card art are more than 80 away.
    for (const [i, value] of [233, 192, 113].entries()) expect(Math.abs(image.data[at + i] - value)).toBeLessThanOrEqual(24);
    await page.screenshot({ path: join(proof, 'plugin-card-targets-390x844-dark.png') });
    await frame.locator('#context-actions').getByRole('button', { name: 'Cancel', exact: true }).click();
    expect(await coin.getAttribute('data-state')).toBe('always'); expect(await coin.getAttribute('aria-pressed')).toBe('false');
    expect(await coin.evaluate(e => e.querySelector('img')!.getBoundingClientRect().width)).toBe(await coin.evaluate(e => e.clientWidth - 6));
  } finally { await page.close(); }
});

it.each(['contact', 'reduced', 'off', 'skip', 'superseded'] as const)('F10: sounds the local capture once at contact or fallback (%s)', async path => {
  const base = view('7k/8/8/8/8/8/7p/K6R w - - 0 1'), page = await open(base), frame = page.frameLocator('iframe');
  try {
    if (path === 'reduced') await page.emulateMedia({ reducedMotion: 'reduce' });
    await frame.locator('html').evaluate(`(async () => {
      const { snd, setSound } = await import('/src/render/sfx.ts'); setSound(true);
      window.sounds = []; for (const name of ['capture', 'move', 'check']) snd[name] = () => window.sounds.push({ name, at: performance.now() });
      const b = window.testBoard; window.realAnimate = b.animateMove.bind(b);
      b.animateMove = (pre, move, contact) => {
        if (${JSON.stringify(path)} === 'off') { b.setPace('off'); return window.realAnimate(pre, move, contact).then(() => { window.restAt = performance.now(); }); }
        if (${JSON.stringify(path)} === 'reduced') { window.restAt = performance.now(); return Promise.resolve(); }
        window.contact = contact; return new Promise(resolve => { window.finishMove = () => { window.restAt = performance.now(); resolve(); }; });
      };
    })()`);
    await squareTap(page, 7); await squareTap(page, 15);
    if (['contact', 'skip', 'superseded'].includes(path)) {
      expect(await frame.locator('#board').getAttribute('data-animating')).toBe('true');
      if (path === 'contact') {
        await frame.locator('html').evaluate(() => { (window as any).contact(); (window as any).contact(); });
        expect(await frame.locator('html').evaluate(() => (window as any).sounds.map((s: any) => s.name))).toEqual(['capture']);
      }
      if (path === 'superseded') {
        await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...base, game_id: crypto.randomUUID() });
        await frame.locator('html').evaluate(() => { (window as any).contact(); (window as any).finishMove(); });
        expect(await frame.locator('html').evaluate(() => (window as any).sounds)).toEqual([]); return;
      }
      if (path === 'skip') await frame.locator('html').evaluate(() => { (window as any).testBoard.skip = () => (window as any).finishMove(); (window as any).testBoard.skip(); });
      else await frame.locator('html').evaluate(() => (window as any).finishMove());
    }
    await frame.locator('#board[data-animating="false"]').waitFor();
    const result = await frame.locator('html').evaluate(() => ({ sounds: (window as any).sounds, rest: (window as any).restAt }));
    expect(result.sounds.map((s: any) => s.name)).toEqual(['capture', 'check']);
    if (path === 'contact') expect(result.sounds[0].at).toBeLessThanOrEqual(result.rest);
    else expect(result.sounds[0].at).toBeGreaterThanOrEqual(result.rest);
    expect(result.sounds[1].at).toBeGreaterThanOrEqual(result.rest);
  } finally { await page.close(); }
});

it('F10: sounds a replay capture at contact and check after rest', async () => {
  const base = view('7k/8/8/8/8/8/7p/K6R w - - 0 1', {}, { kind: 'friend' }), page = await open(base), frame = page.frameLocator('iframe');
  const step = applyLan(fromFen(base.fen), 'Rh1xh2', base.rules!)!; expect(step).toBeDefined();
  try {
    await frame.locator('html').evaluate(`(async () => {
      const { snd, setSound } = await import('/src/render/sfx.ts'); setSound(true); window.sounds = [];
      for (const name of ['capture', 'move', 'check']) snd[name] = () => window.sounds.push({ name, at: performance.now() });
      window.testBoard.animateMove = (pre, move, hit) => { hit(); hit(); return new Promise(resolve => { window.finishMove = () => { window.restAt = performance.now(); resolve(); }; }); };
    })()`);
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...base, revision: 1, fen: toFen(step.pos), turn: 1, action: 'waiting', legal: [], last_commands: [{ seq: 1, seat: 0, at: base.server_now, action: { type: 'turn', actions: [step.lan] } }] });
    expect(await frame.locator('html').evaluate(() => (window as any).sounds.map((s: any) => s.name))).toEqual(['capture']);
    await frame.locator('html').evaluate(() => (window as any).finishMove());
    await frame.locator('#board[data-animating="false"]').waitFor();
    const result = await frame.locator('html').evaluate(() => ({ sounds: (window as any).sounds, rest: (window as any).restAt }));
    expect(result.sounds.map((s: any) => s.name)).toEqual(['capture', 'check']);
    expect(result.sounds[0].at).toBeLessThanOrEqual(result.rest); expect(result.sounds[1].at).toBeGreaterThanOrEqual(result.rest);
  } finally { await page.close(); }
});

it.each(['tap', 'Escape', 'drag', 'Menu Escape', 'Moves Escape'] as const)('F11: %s skips the whole reply and keeps the server position', async input => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] }, fen = '4k3/p7/8/8/8/8/4P3/K7 b - - 0 1';
  setRules(rules); let pos = fromFen(fen); const actions: string[] = [], positions: string[] = [];
  for (const pick of [(m: Move) => m.power === 'haste' && m.from === 48 && m.to === 40, (m: Move) => !m.pass && m.from === 40 && m.to === 32]) {
    const move = legalMoves(pos).find(pick)!; expect(move).toBeDefined(); actions.push(toLan(pos, move)); pos = makeMove(pos, move); positions.push(toFen(pos));
  }
  const base = view(fen, rules, { kind: 'friend', seat: 0, action: 'waiting' }), page = await open(base), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(`(async () => {
      const { snd } = await import('/src/render/sfx.ts'), { toFen } = await import('/src/rules/setup.ts'); window.hits = 0; snd.move = () => window.hits++;
      const b = window.testBoard, sync = b.sync.bind(b), timeout = window.setTimeout; window.syncs = []; window.animationCalls = 0; window.zeroTimers = 0;
      window.setTimeout = (fn, ms, ...args) => { if (ms === 0) window.zeroTimers++; return timeout(fn, ms, ...args); };
      b.sync = pos => { window.syncs.push(toFen(pos)); sync(pos); };
      b.animateMove = () => { window.animationCalls++; return new Promise(resolve => { window.finishMove = resolve; }); };
      b.skip = () => { window.finishMove?.(); };
    })()`);
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...base, revision: 1, fen: toFen(pos), turn: 0, action: 'ready', legal: legalMoves(pos).map(m => toLan(pos, m)), last_commands: [{ seq: 1, seat: 1, at: base.server_now, action: { type: 'turn', actions } }] });
    expect(await frame.locator('#board').getAttribute('data-animating')).toBe('true');
    const timers = await frame.locator('html').evaluate(() => (window as any).zeroTimers);
    if (input === 'Escape') { await frame.locator('#board').press('ArrowLeft'); expect(await frame.locator('#board .mk-cursor').count()).toBe(1); }
    const sheetEscape = input === 'Menu Escape' || input === 'Moves Escape';
    if (sheetEscape) {
      await frame.locator('#board-menu').click();
      if (input === 'Moves Escape') await frame.locator('#board-sheet').getByRole('button', { name: 'Moves', exact: true }).click();
      const close = frame.locator('#board-sheet [aria-label="Close"]');
      expect(await close.evaluate(button => button === document.activeElement)).toBe(true);
      await close.press('Escape');
      expect(await frame.locator('#board-sheet[open]').count()).toBe(0);
      expect(await frame.locator('.page-sheet').evaluate(page => page.inert)).toBe(false);
      expect(await frame.locator('#board-menu').evaluate(button => button === document.activeElement)).toBe(true);
    }
    const result = await frame.locator('html').evaluate(async (_, input) => {
      const b = (window as any).testBoard, board = document.getElementById('board')!;
      if (input === 'Escape') board.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      else if (input === 'drag') b.onDragSelect(12);
      else if (input === 'tap') b.onSquareClick(12);
      await new Promise(resolve => requestAnimationFrame(resolve));
      return { animating: board.dataset.animating, calls: (window as any).animationCalls, syncs: (window as any).syncs, hits: (window as any).hits, timers: (window as any).zeroTimers };
    }, input);
    expect(result.animating).toBe('false'); expect(result.calls).toBe(1); expect(result.hits).toBe(2);
    expect(result.syncs).toEqual([...positions, toFen(pos)]); expect(result.timers).toBeGreaterThan(timers);
    expect(await boardFen(page)).toBe(toFen(pos)); expect((await marks(page)).selected).toBeUndefined();
    // Escape during motion also ends the keyboard cursor, as it does at rest.
    if (input === 'Escape') {
      expect(await frame.locator('#board .mk-cursor').count()).toBe(0);
      expect(await frame.locator('#board').getAttribute('aria-label')).toBe('Chess board'); expect(await frame.locator('#cursor-say').textContent()).toBe('');
    }
    await squareTap(page, 12); expect((await marks(page)).selected).toBe(12);
  } finally { await page.close(); }
});

it('F11: a tap skips a local move without selecting a piece', async () => {
  const base = view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), page = await open(base), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(() => {
      const b = (window as any).testBoard;
      b.animateMove = () => new Promise(resolve => { b.skip = resolve; });
    });
    await squareTap(page, 8); await squareTap(page, 16);
    expect(await frame.locator('#board').getAttribute('data-animating')).toBe('true');
    await squareTap(page, 0); await frame.locator('#board[data-animating="false"]').waitFor();
    expect((await marks(page)).selected).toBeUndefined();
    expect(await boardFen(page)).toBe(toFen(applyLan(fromFen(base.fen), 'a2-a3', base.rules!)!.pos));
  } finally { await page.close(); }
});

it.each(['mouse', 'touch'] as const)('A8: real %s input skips both Haste moves', async input => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] };
  const base = view('4k3/p7/8/8/8/8/4P3/K7 b - - 0 1', rules, { kind: 'friend', seat: 0, action: 'waiting' });
  let pos = fromFen(base.fen);
  const actions: string[] = [];
  for (const pick of [(m: Move) => m.power === 'haste' && m.from === 48 && m.to === 40, (m: Move) => !m.pass && m.from === 40 && m.to === 32]) {
    const move = legalMoves(pos).find(pick)!;
    expect(move).toBeDefined(); actions.push(toLan(pos, move)); pos = makeMove(pos, move);
  }
  const page = await open(base, 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frame.locator('html').evaluate(() => {
      const w = window as any, b = w.testBoard, animate = b.animateMove.bind(b);
      w.animationCalls = 0;
      b.animateMove = (...args: unknown[]) => { w.animationCalls++; return animate(...args); };
    });
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {
      ...base, revision: 1, fen: toFen(pos), turn: 0, action: 'ready', legal: legalMoves(pos).map(m => toLan(pos, m)),
      last_commands: [{ seq: 1, seat: 1, at: base.server_now, action: { type: 'turn', actions } }],
    });
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(true);
    const pane = (await page.locator('iframe').boundingBox())!;
    const point = await frame.locator('html').evaluate(() => (window as any).testBoard.screenOf(12));
    if (input === 'touch') await page.touchscreen.tap(pane.x + point.x, pane.y + point.y);
    else await page.mouse.click(pane.x + point.x, pane.y + point.y);
    await expect.poll(() => frame.locator('#board').getAttribute('data-animating')).toBe('false');
    expect(await frame.locator('html').evaluate(() => (window as any).animationCalls)).toBe(1);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(false);
    expect(await boardFen(page)).toBe(toFen(pos));
    expect((await marks(page)).selected).toBeUndefined();
    expect(await frame.locator('html').evaluate(() => {
      const b = (window as any).testBoard.scene.position.board;
      return [b[48], b[40], b[32]];
    })).toEqual([0, 0, pos.board[32]]);
  } finally { await page.close(); }
});

it.each(['mouse', 'touch'] as const)('A8: real %s input ends the web final blow and its timers', async input => {
  const page = await open(view('7k/8/6K1/8/8/8/8/Q7 w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frame.locator('html').evaluate(`(async () => {
      const { startCeremony } = await import('/src/ceremony.ts'), { Game } = await import('/src/game.ts');
      const { fromFen, toFen } = await import('/src/rules/setup.ts');
      const game = new Game(); game.load(fromFen('7k/8/6K1/8/8/8/8/Q7 w - - 0 1'));
      game.play(game.legal.find(move => move.from === 0 && move.to === 56));
      const b = window.testBoard, board = document.getElementById('board');
      window.previousSkip = b.onSkipAnimation; window.ceremonyDone = false; window.finalFen = toFen(game.pos);
      const captionHost = document.createElement('div'), moments = document.createElement('div');
      board.append(captionHost, moments);
      window.ceremony = startCeremony({ view: b, board, captionHost, moments, history: game.history,
        final: game.pos, king: 63, showPly() {}, motion: true, live: () => true });
      window.ceremony.done.then(done => { window.ceremonyDone = done; });
    })()`);
    await page.clock.runFor(130);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(true);
    const pane = (await page.locator('iframe').boundingBox())!;
    const point = await frame.locator('html').evaluate(() => (window as any).testBoard.screenOf(46));
    if (input === 'touch') await page.touchscreen.tap(pane.x + point.x, pane.y + point.y);
    else await page.mouse.click(pane.x + point.x, pane.y + point.y);
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).ceremonyDone)).toBe(true);
    expect(await frame.locator('.ceremony-caption').count()).toBe(0);
    expect(await frame.locator('.ceremony-tile').count()).toBe(1);
    expect(await frame.locator('html').evaluate(() => {
      const w = window as any, b = w.testBoard;
      return { animating: b.scene.animating, falling: b.scene.falling, king: b.fallen?.sq, restored: b.onSkipAnimation === w.previousSkip };
    })).toEqual({ animating: false, falling: false, king: 63, restored: true });
    expect(await boardFen(page)).toBe(await frame.locator('html').evaluate(() => (window as any).finalFen));
    expect((await marks(page)).selected).toBeUndefined();
    await page.clock.runFor(1700);
    expect(await frame.locator('.kd-words.is-in, .ceremony-caption').count()).toBe(0);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.falling)).toBe(false);
  } finally { await page.close(); }
});

it.each(['dark', 'light'])('F13: centers both sheet close marks in 44 by 48 px tablets (%s)', async theme => {
  const base = view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), page = await open(base, 390, 844), frame = page.frameLocator('iframe');
  const proof = join(tmpdir(), 'kingdown-gui-board-proof'); await import('node:fs/promises').then(fs => fs.mkdir(proof, { recursive: true }));
  async function centered(selector: string) {
    const box = await frame.locator(selector).evaluate(button => {
      const range = document.createRange(); range.selectNodeContents(button);
      const glyph = range.getBoundingClientRect(), box = button.getBoundingClientRect();
      return { width: box.width, height: box.height, dx: Math.abs(glyph.x + glyph.width / 2 - box.x - box.width / 2), dy: Math.abs(glyph.y + glyph.height / 2 - box.y - box.height / 2), text: button.textContent };
    });
    expect(box.width).toBe(44); expect(box.height).toBe(48); expect(box.dx).toBeLessThanOrEqual(1); expect(box.dy).toBeLessThanOrEqual(1); expect(box.text).toBe('×');
  }
  try {
    await page.evaluate(theme => (window as any).harnessSetContext({ theme }), theme);
    await frame.locator('#board-menu').click(); await centered('#board-sheet .sheet-head button');
    await page.screenshot({ path: join(proof, `plugin-board-menu-390x844-${theme}.png`) });
    await frame.locator('#board-sheet .sheet-head button').click();
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {
      ...base, game_id: crypto.randomUUID(), status: 'setup', fen: '', options: { ...DEFAULT_OPTIONS, fairy: false, arrangement: true, cards: false, kingPowers: false }, draw: 'RNBQKBNR', choices: [{ order: 'RNBQKBNR', king: null }, null], ready: [false, false],
    });
    await frame.locator('#seat-menu').click(); await centered('#seat-menu-close');
    await page.screenshot({ path: join(proof, `plugin-seat-menu-390x844-${theme}.png`) });
  } finally { await page.close(); }
});

it.each(['Strike', 'MorphP'] as const)('shows the Collection face in the %s board sheet', async card => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [[card], []] })), frame = page.frameLocator('iframe');
  const picture = (el: Element) => ({ image: el.querySelector('img')?.getAttribute('src'), diagram: el.querySelector('svg')?.getAttribute('data-card-picture'), text: el.textContent?.trim() });
  try {
    await frame.locator('#card-w-0').click();
    const face = await frame.locator('#board-sheet .cf-art').evaluate(picture);
    expect(await frame.locator('#board-sheet .cf-art img[src*="back"]').count()).toBe(0);
    await frame.locator('#board-sheet [aria-label="Close"]').click();
    await frame.locator('html').evaluate(() => (window as any).harnessApp.navigate('collection'));
    await frame.locator('#collection-tabs input[value="Cards"]').locator('..').click();
    expect(await frame.locator(`#collection-items [data-card="${card}"] .cf-art`).evaluate(picture)).toEqual(face);
  } finally { await page.close(); }
});

it('explains why a card sheet has no Use button', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['MirrorB'], ['Freeze']] })), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#card-w-0').click();
    expect(await frame.locator('#board-sheet .card-reason').textContent()).toBe('This card has no move now.');
    expect(await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).count()).toBe(0);
    await frame.locator('#board-sheet [aria-label="Close"]').click();
    await frame.locator('#card-b-0').click();
    expect(await frame.locator('#board-sheet .card-reason').textContent()).toBe("This is your opponent's card.");
    expect(await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).count()).toBe(0);
  } finally { await page.close(); }
});

it('A35: an unused card names Retry after Send your turn fails', async () => {
  const base = view('7k/p7/8/8/8/8/8/R5K1 w - - 0 1', { hands: [['Haste'], []] }, { kind: 'friend' });
  const page = await open(base), frame = page.frameLocator('iframe');
  try {
    await chooseTurnMove(page, 'Ra1-a2', 0);
    await page.evaluate(() => { (window as any).failNextAction = true; });
    await frame.locator('#end-turn').click();
    await frame.locator('#retry:not(:disabled)').waitFor();
    expect((await moveCalls(page)).length).toBe(1);
    await frame.locator('#card-w-0').click();
    expect(await frame.locator('#board-sheet .card-reason').textContent()).toBe('Close this sheet and select Retry.');
    expect(await frame.locator('#board-sheet').getByRole('button', { name: 'Use', exact: true }).count()).toBe(0);
  } finally { await page.close(); }
});

it.each([true, false])('A35: the card sheet follows failed polls and same-revision recovery with openBefore=%s', async openBefore => {
  const base = view('7k/p7/8/8/8/8/8/R5K1 w - - 0 1', { hands: [['Haste'], []] }, { kind: 'friend' });
  const page = await open(base, 393, 852, true), frame = page.frameLocator('iframe'), sheet = frame.locator('#board-sheet');
  try {
    let failRead = true;
    await page.route('**/fixture-tool', async route => {
      if (route.request().postDataJSON().name === 'kingdown_get') {
        if (failRead) await route.abort('failed');
        else await route.fulfill({ json: { content: [], _meta: { view: base } } });
      }
      else await route.continue();
    });
    const read = () => frame.locator('html').evaluate((_, game_id) => (window as any).harnessApp.send('kingdown_get', { game_id }, { quiet: true }), base.game_id);
    if (openBefore) {
      await frame.locator('#card-w-0').click();
      expect(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible()).toBe(true);
      await sheet.getByRole('button', { name: 'Use', exact: true }).focus();
    }
    for (let i = 0; i < 3; i++) {
      expect((await read()).status).toBe('failed');
      if (openBefore && i < 2) expect(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible()).toBe(true);
    }
    if (!openBefore) await frame.locator('#card-w-0').click();
    await sheet.evaluate(el => { (window as any).openCardFace = el.querySelector('.cf-art'); });
    expect(await sheet.locator('.card-reason').textContent()).toBe('Close this sheet and select Try again.');
    expect(await sheet.getByRole('button', { name: 'Use', exact: true }).count()).toBe(0);
    if (openBefore) expect(await sheet.locator('[aria-label="Close"]').evaluate(el => el === document.activeElement)).toBe(true);
    failRead = false;
    expect((await read()).status).toBe('done');
    expect(await sheet.getByRole('button', { name: 'Use', exact: true }).isVisible()).toBe(true);
    expect(await sheet.locator('.card-reason').count()).toBe(0);
    expect(await sheet.evaluate(el => (el as HTMLDialogElement).open && el.querySelector('.cf-art') === (window as any).openCardFace)).toBe(true);
    await sheet.getByRole('button', { name: 'Use', exact: true }).click();
    expect(await frame.locator('#card-w-0').getAttribute('aria-pressed')).toBe('true');
  } finally { await page.close(); }
});
const soundCases = [
  { kind: 'move', fen: '7k/8/8/8/8/8/P7/K7 w - - 0 1', now: 'move', hit: null },
  { kind: 'capture', fen: '7k/8/8/8/8/8/7p/K6R w - - 0 1', now: null, hit: 'capture' },
  { kind: 'shot', fen: '7k/8/8/2p5/8/2A5/8/K7 w - - 0 1', now: 'shot', hit: 'capture' },
  { kind: 'shove', fen: 'k7/8/8/8/8/2p5/3pP3/4O2K w - - 0 1', now: null, hit: 'shove' },
  { kind: 'chain', fen: '7k/8/8/2pp4/2S5/8/8/K7 w - - 0 1', now: null, hit: 'chain' },
  { kind: 'swap', fen: '7k/8/8/8/2RM4/8/8/K7 w - - 0 1', now: 'swap', hit: null },
] as const;
it.each(soundCases.flatMap(test => ['local', 'replay'].map(path => ({ ...test, path }))))(
  'N11: the $path $kind uses the web sounds at start, contact and rest', async ({ kind, fen, now, hit, path }) => {
    const base = view(fen, {}, { kind: 'friend' }), page = await open(base), frame = page.frameLocator('iframe');
    try {
      setRules(base.rules!); const pre = fromFen(fen);
      const move = legalMoves(pre).find(m => kind === 'capture' ? m.captures.length === 1 && m.to !== m.from
        : kind === 'move' ? momentKind(pre, m) === null && !m.captures.length : momentKind(pre, m) === kind)!;
      expect(move).toBeDefined();
      const post = makeMove(pre, move), lan = toLan(pre, move), web = soundsFor(momentKind(pre, move), move);
      expect(web).toEqual({ now, hit });
      await frame.locator('html').evaluate(`(async () => {
        const { snd, setSound } = await import('/src/render/sfx.ts'); setSound(true); window.soundEvents = [];
        for (const name of ['move', 'capture', 'shot', 'shove', 'chain', 'swap', 'check']) snd[name] = () => window.soundEvents.push('sound:' + name);
        window.testBoard.animateMove = (pre, move, contact) => {
          window.soundEvents.push('animate');
          window.soundContact = () => { window.soundEvents.push('contact'); contact(); };
          return new Promise(resolve => { window.finishSoundMove = () => { window.soundEvents.push('rest'); resolve(); }; });
        };
      })()`);
      if (path === 'local') {
        await squareTap(page, move.from); await frame.locator('#board-menu').click();
        await frame.locator('#board-sheet').getByRole('button', { name: 'Choose a move', exact: true }).click();
        await frame.locator(`#choices button[title="${lan}"]`).click();
      } else {
        await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), {
          ...base, revision: 1, fen: toFen(post), turn: post.turn, action: 'waiting', legal: [],
          last_commands: [{ seq: 1, seat: 0, at: base.server_now, action: { type: 'turn', actions: [lan] } }],
        });
      }
      const events = () => frame.locator('html').evaluate<string[]>(() => (window as any).soundEvents);
      expect(await events()).toEqual([...(now ? [`sound:${now}`] : []), 'animate']);
      await frame.locator('html').evaluate(() => { (window as any).soundContact(); (window as any).soundContact(); });
      expect((await events()).filter(event => event.startsWith('sound:'))).toEqual([now, hit].filter(Boolean).map(name => `sound:${name}`));
      await frame.locator('html').evaluate(() => (window as any).finishSoundMove());
      await frame.locator('#board[data-animating="false"]').waitFor();
      const result = await events(), check = inCheck(post);
      expect(result.filter(event => event.startsWith('sound:'))).toEqual([web.now, web.hit, check ? 'check' : null].filter(Boolean).map(name => `sound:${name}`));
      if (hit) expect(result.indexOf(`sound:${hit}`)).toBeLessThan(result.indexOf('rest'));
      if (check) expect(result.indexOf('sound:check')).toBeGreaterThan(result.indexOf('rest'));
    } finally { await page.close(); }
  });


it.each(['mouse', 'touch'] as const)('A8: a %s skip keeps the capture and does not open Menu', async input => {
  const page = await open(view('7k/8/8/8/8/8/p7/R6K w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frame.locator('html').evaluate(() => {
      const board = (window as any).testBoard;
      board.onSquareClick(0, false); board.onSquareClick(8, false);
    });
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(true);
    const box = (await frame.locator('#board-menu').boundingBox())!;
    if (input === 'touch') await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.animating)).toBe(false);
    expect(await frame.locator('#board-sheet[open]').count()).toBe(0);
    await expect.poll(() => frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
    expect(await frame.locator('html').evaluate(() => {
      const board = (window as any).testBoard;
      return [board.scene.position.board[0], board.scene.position.board[8], board.marks.selected ?? null];
    })).toEqual([0, 4, null]);
    expect((await savedDraft(page)).lans).toEqual(['Ra1xa2']);
    await frame.locator('#board-menu').dispatchEvent('click');
    expect(await frame.locator('#board-sheet[open]').count()).toBe(1);
  } finally { await page.close(); }
});


it.each([390, 1280])('A18: keeps an empty named moves list with no words at %i px', async width => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), width, width === 390 ? 844 : 800), frame = page.frameLocator('iframe');
  try {
    const recent = frame.locator('#recent-moves');
    expect(await recent.textContent()).toBe('');
    expect(await recent.getAttribute('aria-label')).toBe('Moves');
    if (width === 390) expect(await recent.isHidden()).toBe(true);
    await frame.locator('#board-menu').click();
    await frame.getByRole('button', { name: 'Moves', exact: true }).click();
    expect(await frame.locator('#board-sheet .sheet-body').textContent()).toBe('');
    expect(await frame.getByRole('dialog', { name: 'Moves', exact: true }).isVisible()).toBe(true);
  } finally { await page.close(); }
});


it.each([false, true])('Y3: shows only the king and power in the seat strip (ready %s)', async ready => {
  const page = await open(view('', {}, { status: 'setup', options: { ...DEFAULT_OPTIONS, arrangement: false, kingPowers: true, cards: false },
    draw: 'RNBQKBNR', deal: [], ready: [ready, false], choices: [{ king: { king: 'Spirit', power: 'Mercy' }, order: 'RNBQKBNR' }, null] })), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#seat-me-line').textContent()).toBe('Spirit · Mercy');
    expect(await frame.locator('#seat-context').textContent()).toBe(ready ? 'Waiting for the other player.' : 'Choose your king, then press Ready.');
    expect(await frame.locator('#seat-king').isVisible()).toBe(true);
  } finally { await page.close(); }
});


it('A8: keeps the full main gait at Normal and Fast for every quiet move type', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    for (const pace of ['normal', 'fast']) for (const [piece, duration] of [[P,420],[R,480],[N,1350],[L,1450]]) {
      await frame.locator('html').evaluate((_, {piece, pace}) => {
        const host = window as any, board = host.testBoard, pos = { ...board.pos, board: new Uint8Array(board.pos.board) };
        pos.board[8] = piece; board.setPace(pace); host.quietDone = false;
        void board.animateMove(pos, {from:8,to:48,captures:[]}).then(() => { host.quietDone = true; });
      }, {piece, pace});
      await page.clock.fastForward(duration * (pace === 'fast' ? .5 : 1) - 40);
      expect(await frame.locator('html').evaluate(() => (window as any).quietDone)).toBe(false);
      await page.clock.fastForward(80);
      expect(await frame.locator('html').evaluate(() => (window as any).quietDone)).toBe(true);
    }
  } finally { await page.close(); }
});


it('A8: Off ends the active marker draw timer', async () => {
  const page = await open(view('7k/8/8/8/8/8/A7/K7 w - - 0 1'), 393, 852, true), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await frame.locator('html').evaluate(() => {
      const board = (window as any).testBoard;
      board.setPace('normal'); board.highlight({ selected:8, moves:[9,16] }); board.setPace('off');
    });
    await page.clock.runFor(100);
    const frames = await frame.locator('html').evaluate(() => (window as any).testBoard.scene.frames);
    await page.clock.runFor(500);
    expect(await frame.locator('html').evaluate(() => (window as any).testBoard.scene.frames)).toBe(frames);
  } finally { await page.close(); }
});

it('keeps a stored-engine draft through undo, remount and a late preview when the page calculator differs', async () => {
  const { LocalMatch } = await import('../src/match');
  const { GameService } = await import('../src/match/service');
  const { pathToFileURL } = await import('node:url');
  const { resolve } = await import('node:path');
  const actor = '11111111-1111-4111-8111-111111111111', engine = 'sha256:bab22e94d4df81591374763a7f3abe703c30534f80ce771ee3fe7e095dcec7da';
  const match = new LocalMatch(pathToFileURL(resolve('engines', engine.slice(7) + '.mjs')));
  const page = await browser.newPage({viewport:{width:393,height:852}}); page.setDefaultTimeout(10_000);
  const errors:string[] = []; page.on('pageerror', error=>errors.push(error.message));
  let release: (()=>void) | undefined, hold = false, commit:string[]|undefined, previews=0, returned=0, boardId:string|undefined, committedFen:string|undefined;
  try {
    await match.initialize({fen:'7k/p7/8/8/8/8/8/R5K1 w - - 0 1',kings:'Flame:Haste,none'});
    const snapshot = await match.snapshot(), state = await match.exportSave();
    const base = view(snapshot.fen,snapshot.rules,{engine_fingerprint:engine,kind:'friend',history:{initial_fen:snapshot.fen,actions:[]}});
    const game = {id:base.game_id,revision:0,engine_fingerprint:engine,status:'playing',turn:0,state,snapshot,players:[{seat:0,user_id:actor},{seat:1,user_id:null}]};
    const service = new GameService({load:async()=>game} as unknown as import('../src/match/store').PostgresMatchStore);
    await page.route('**/board-resource', async route=>{
      const response=await route.fetch(), source=await response.text();
      const entry='<script type="module">await window.harnessBoot;';
      expect(source).toContain(entry);
      const divergent=`const {GameRules}=await import('/src/game-rules.ts');
        GameRules.prototype.legalMoves=()=>[];
        GameRules.prototype.makeMove=()=>{throw new Error('Divergent page must not enforce this draft');};
        GameRules.prototype.status=()=>{throw new Error('Divergent page must not decide this result');};
        window.testBoard=(await import('/src/plugin/board-view.ts')).board;`;
      await route.fulfill({response,body:source.replace(entry,entry+divergent)});
    });
    await page.route('**/fixture-tool', async route=>{
      const request = route.request().postDataJSON();
      if (request.name === 'kingdown_preview') {
        previews++;
        const {game_id:_,...input}=request.arguments;
        const result = await service.previewDraft(actor,base.game_id,input);
        if (hold) { hold=false; await new Promise<void>(done=>{release=done;}); }
        await route.fulfill({json:{content:[],_meta:{draft:result}}}); returned++;
      } else if (request.name === 'kingdown_get') await route.fulfill({json:{content:[],structuredContent:{screen:'board'},_meta:{board_id:boardId,view:base}}});
      else if (request.name === 'kingdown_move') {
        commit=request.arguments.actions;
        for (const [index,lan] of commit!.entries()) await match.apply({id:`commit-${index}`,expectedRevision:index,lan});
        const after = await match.snapshot(); committedFen=after.fen;
        await route.fulfill({json:{content:[],_meta:{view:{...base,revision:1,fen:after.fen,turn:after.turn,action:'waiting',legal:[],history:{initial_fen:snapshot.fen,actions:commit},last_commands:[{seq:1,seat:0,at:'2026-10-20T00:00:00Z',action:{type:'turn',actions:commit}}]}}}});
      } else await route.continue();
    });
    await page.goto(harness.url); await waitForSourceApp(page);
    const frame=page.frameLocator('iframe');
    await frame.locator('#home-play:not(:disabled)').waitFor();
    boardId=await page.evaluate(()=>(window as any).harnessWidgetState.privateContent.board_id);
    await page.evaluate(async ()=>(window as any).harnessSetContext({displayMode:'fullscreen'}));
    await frame.locator('html').evaluate((_,base)=>(window as any).harnessApp.routeView(base),base);
    await frame.locator('#board').waitFor({state:'visible'});
    await expect.poll(()=>previews).toBe(1);
    const move = async (lan:string) => {
      await frame.locator('#board').focus();
      await frame.locator('#power-w').click();
      await frame.getByRole('button',{name:'Use',exact:true}).click();
      await squareTap(page,0);
      await frame.locator('#board-menu').click();
      await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
      await frame.locator(`#choices button[title="${lan}"]`).click();
      await expect.poll(()=>frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
      await expect.poll(()=>frame.locator('#board').getAttribute('data-animating')).toBe('false');
    };
    await move('Ra1-a4!H');
    await expect.poll(()=>frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
    expect(await boardFen(page)).toBe('7k/p7/8/8/R7/8/8/6K1 w - - 1 1 u1.0/ha4');
    await frame.locator('#undo').click();
    await expect.poll(()=>frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('true');
    expect(await boardFen(page)).toBe(base.fen);
    await move('Ra1-a4!H');
    expect((await savedDraft(page)).lans).toEqual(['Ra1-a4!H']);
    const boots=await page.evaluate(()=>(window as any).harnessBoots);
    await page.locator('#remount').click();
    await expect.poll(()=>page.evaluate(()=>(window as any).harnessBoots)).toBe(boots+1);
    await page.frameLocator('iframe').locator('#board[aria-busy="false"]').waitFor({state:'visible'});
    await expect.poll(()=>page.frameLocator('iframe').locator('#end-turn').getAttribute('aria-disabled')).toBe('false');
    expect(await page.evaluate(()=>(window as any).harnessWidgetState.privateContent.draft.lans)).toEqual(['Ra1-a4!H']);
    await page.frameLocator('iframe').locator('#end-turn').click();
    await expect.poll(()=>commit).toEqual(['Ra1-a4!H','--']);
    expect((await match.snapshot()).turn).toBe(1);
    await expect.poll(()=>boardFen(page)).toBe(committedFen);
    expect(await page.frameLocator('iframe').locator('#recent-moves').textContent()).toContain('White rook');
    expect(errors).toEqual([]);
    // A held read belongs to its old view, not a newly selected board.
    const settled=returned;
    hold=true; game.revision=2;
    await page.frameLocator('iframe').locator('html').evaluate((_,base)=>(window as any).harnessApp.routeView({...base,revision:2}),base);
    await expect.poll(()=>!!release).toBe(true);
    const other={...base,game_id:crypto.randomUUID(),revision:3,fen:'7k/8/8/8/8/8/P7/K7 b - - 0 1',action:'waiting',turn:1} as View;
    await page.frameLocator('iframe').locator('html').evaluate((_,other)=>(window as any).harnessApp.routeView(other),other);
    release!(); release=undefined;
    await expect.poll(()=>page.frameLocator('iframe').locator('html').evaluate(()=>(window as any).harnessApp.memory.view?.game_id)).toBe(other.game_id);
    await expect.poll(()=>returned).toBe(settled+1);
    expect(await boardFen(page)).toBe(other.fen);
    expect(await savedDraft(page)).toBeNull();
    expect(errors).toEqual([]);
  } catch (error) { throw new Error(`${String(error)}; page errors: ${JSON.stringify(errors)}`,{cause:error}); }
  finally {release?.();await page.close();await match.close();}
});

it('keeps source pages without an engine stamp on server preview', async () => {
  const unstamped = await startHarness({ boardPath: join(folder, 'board.html'), sourcePage: true });
  const page = await browser.newPage(); page.setDefaultTimeout(5000);
  try {
    await page.goto(unstamped.url); await waitForSourceApp(page);
    const frame = page.frameLocator('iframe');
    await frame.locator('#home-play:not(:disabled)').waitFor();
    expect(await frame.locator('html').evaluate('(async () => (await import("/src/account-game/engine-identity.ts")).PAGE_ENGINE)()')).toBeUndefined();
    const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent('7k/8/8/8/8/8/P7/K7 w - - 0 1')}`, unstamped.url).href)).json();
    await page.evaluate(async result => {
      await (window as any).harnessSetContext({ displayMode: 'fullscreen' });
      await (window as any).harnessShow(result);
    }, result);
    await frame.locator('#board').waitFor({ state: 'visible' });
    await expect.poll(() => page.evaluate(() => (window as any).harnessCalls.filter((call: any) => call.name === 'kingdown_preview').length)).toBe(1);
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).harnessApp.client.inflight)).toBe(0);
    expect(await frame.locator('html').evaluate(() => (window as any).harnessApp.store.page().notice)).toBeUndefined();
  } finally { await page.close(); await unstamped.close(); }
});
