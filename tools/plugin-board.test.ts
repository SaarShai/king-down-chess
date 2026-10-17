import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import { startHarness } from './plugin-ui-harness';
import { fromFen, toFen, toLan } from '../src/rules/setup';
import { legalMoves, makeMove, RULES, setRules, type Move, type Rules } from '../src/rules/engine';
import type { View } from '../src/match/protocol';
import { DEFAULT_OPTIONS } from '../src/match/setup';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let folder: string, harness: Awaited<ReturnType<typeof startHarness>>, served: Awaited<ReturnType<typeof startHarness>>, browser: Browser;
beforeAll(async () => {
  folder = await mkdtemp(join(tmpdir(), 'kingdown-board-faults-'));
  execFileSync(process.execPath, ['tools/plugin-ui-build.mjs', folder], { stdio: 'pipe' });
  const boardPath = join(folder, 'board.html');
  harness = await startHarness({ boardPath, sourcePage: true }); served = await startHarness({ boardPath }); browser = await chromium.launch({ headless: true });
});
afterAll(async () => { await browser?.close(); await harness?.close(); await served?.close(); await rm(folder, { recursive: true, force: true }); });

function view(fen: string, rules: Partial<Rules> = {}, fields: Partial<View> = {}): View {
  setRules(rules); const pos = fromFen(fen || '7k/8/8/8/8/8/P7/K7 w - - 0 1');
  return { game_id: crypto.randomUUID(), revision: 0, created_at: '2026-10-15T00:00:00Z', abort_open: false, seat: pos.turn, kind: 'solo', speed: 'daily', days_per_move: 3, status: 'playing', turn: pos.turn, action: 'ready', fen, in_check: false, legal: legalMoves(pos).map(m => toLan(pos, m)), last_commands: [], opponent: { handle: null, icon: null, computer: true, deleted: false, last_seen_ms: null }, draw_offer: null, deadline_at: null, server_now: '2026-10-15T00:00:00Z', rules: structuredClone(RULES), ...fields };
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
async function open(next: View, width = 393, height = 852) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true });
  page.setDefaultTimeout(3000); await page.goto(harness.url);
  await page.frameLocator('iframe').locator('#home-play:not(:disabled)').waitFor();
  await page.locator('#remount').evaluate(e => { e.style.display = 'none'; });
  await page.locator('iframe').evaluate(e => { e.style.setProperty('height', '100dvh', 'important'); });
  await page.evaluate(async safeAreaInsets => {
    await (window as any).harnessSetContext({ displayMode: 'fullscreen', safeAreaInsets, deviceCapabilities: { touch: true } });
  }, insets(width));
  await page.frameLocator('iframe').locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), next);
  await page.frameLocator('iframe').locator('html').evaluate('(async () => { window.testBoard = (await import("/src/plugin/board-view.ts")).board; })()');
  return page;
}
async function marks(page: Page) {
  return page.frameLocator('iframe').locator('html').evaluate(() => structuredClone((window as any).testBoard.marks));
}

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

it('marks the pieces that can use Vault with the power target mark', async () => {
  const rules: Partial<Rules> = { hands: [['Vault'], []] }, next = view('7k/8/8/8/8/8/P7/R6K w - - 0 1', rules);
  const page = await open(next), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#card-w-0').click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
    setRules(rules); const sources = [...new Set(legalMoves(fromFen(next.fen)).filter(m => m.power === 'vault').map(m => m.from))];
    expect(sources.length).toBeGreaterThan(0); expect((await marks(page)).powers).toEqual(sources);
  } finally { await page.close(); }
});

it('names the card owner, feature icons and the computer once', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { hands: [['Freeze'], ['Freeze']] }, { level: 'beginner' })), frame = page.frameLocator('iframe');
  try {
    expect.soft(await frame.locator('#card-w-0').getAttribute('aria-label')).toBe('Your Freeze');
    expect.soft(await frame.locator('#card-b-0').getAttribute('aria-label')).toBe("Opponent's Freeze");
  } finally { await page.close(); }
});

it('names the power coin owner when both kings have the same power', async () => {
  const page = await open(view('7k/8/8/8/8/8/P7/K7 w - - 0 1', { kings: [{ king: 'Frost', power: 'Freeze' }, { king: 'Frost', power: 'Freeze' }] })), frame = page.frameLocator('iframe');
  try {
    expect.soft(await frame.locator('#power-w').getAttribute('aria-label')).toMatch(/^Your Freeze, /);
    expect.soft(await frame.locator('#power-b').getAttribute('aria-label')).toMatch(/^Opponent's Freeze, /);
    expect.soft((await frame.locator('#strip-them').innerText()).match(/Computer/g)).toHaveLength(1);
    const names = await frame.locator('html').evaluate('(async () => { const { features } = await import("/src/plugin/screens/friend.ts"); return [...features({ fairy: true, arrangement: true, cards: true, kingPowers: true }).children].map(e => [e.getAttribute("role"), e.getAttribute("aria-label")]); })()');
    expect.soft(names).toEqual(['Fairy pieces', 'Arrangement', 'Cards', 'King powers'].map(name => ['img', name]));
  } finally { await page.close(); }
});

it.each([[true, 393, 852], [true, 320, 568], [false, 393, 852]] as const)('uses the correct seat line for computer=%s at %i × %i', async (computer, width, height) => {
  const page = await open(view('', {}, { status: 'setup', legal: [], options: { fairy: false, pool: ['R', 'N', 'B', 'Q'], arrangement: true, classic: false, cards: false, cardPool: [], kingPowers: true }, draw: 'RNBQKBNR', choices: [{ order: 'RNBQKBNR', king: { king: 'Spirit', power: 'Mercy' } }, null], ready: [false, computer], opponent: { handle: null, icon: null, computer, deleted: false, last_seen_ms: null } }), width, height), frame = page.frameLocator('iframe');
  try {
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
    if (cards) {
      await frame.locator('#card-w-1').click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
      await frame.getByRole('button', { name: 'Cancel', exact: true }).waitFor();
      expect(await frame.locator('#game-table').evaluate(edgeMisses)).toEqual([]);
    }
    expect.soft(await frame.locator('#strip-me').evaluate(e => { const r = e.querySelector('.coin img')!.getBoundingClientRect(); return [r.width, r.height]; })).toEqual(cards ? [26, 26] : [30, 30]);
    expect(await frame.locator('#strip-me').evaluate(e => e.getBoundingClientRect().height)).toBe(width === 320 ? 44 : 56);
  } finally { await page.close(); }
});

it.each(['normal', 'fast'])('uses a slide, a 150 ms fade and no shake under reduced motion at %s pace', async pace => {
  const page = await open(view('7k/8/8/8/8/8/p7/R6K w - - 0 1')), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).testBoard.motionQuery.matches)).toBe(true);
    await frame.locator('html').evaluate((_, pace) => (window as any).testBoard.setPace(pace), pace);
    // A frame requested before the fake clock runs on real time; wait until the scene draws no more frames.
    await expect.poll(() => frame.locator('html').evaluate(async () => { const scene = (window as any).testBoard.scene, before = scene.frames; await new Promise(resolve => setTimeout(resolve, 100)); return scene.frames === before; })).toBe(true);
    await page.clock.install({ time: new Date('2026-10-15T12:00:00Z') }); await page.clock.pauseAt(new Date('2026-10-15T12:00:01Z'));
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

it.each([[393, 852], [320, 568]])('keeps the board box still behind the end card at %i × %i', async (width, height) => {
  const next = view('7k/8/8/8/8/8/P7/K7 w - - 0 1'), page = await open(next, width, height), frame = page.frameLocator('iframe');
  try {
    await frame.locator('#board[aria-busy="false"]').waitFor();
    await expect.poll(() => frame.locator('#board canvas').evaluate(e => e.getBoundingClientRect().width)).toBeGreaterThan(0);
    const before = await frame.locator('#board canvas').boundingBox();
    await frame.locator('html').evaluate((_, next) => (window as any).harnessApp.routeView(next), { ...next, revision: 1, status: 'finished', action: 'finished', result: { reason: 'resign', winner: 0 } });
    await frame.locator('#over[open]').waitFor();
    expect(await frame.locator('#board canvas').boundingBox()).toEqual(before);
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
  const page = await browser.newPage({ viewport: { width, height }, isMobile: true, hasTouch: true }), frame = page.frameLocator('iframe'); page.setDefaultTimeout(2000);
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
        if (screen === 'board' && !cards) { await frame.locator('#seat-ready:not(:disabled)').click(); await frame.locator('[data-screen="board"]:not([hidden])').waitFor(); }
        const coin = `#${cards ? 'card-w-0' : screen === 'seat' ? 'seat-king' : 'power-w'}`;
        await frame.locator(`${coin}:visible`).waitFor();
        // The coin shows at the first draw of the game; the screen draws again after the games-list read.
        const section = frame.locator(`[data-screen="${screen}"]`);
        expect(await section.evaluate(targetMisses)).toEqual([]);
        expect(await section.evaluate(edgeMisses)).toEqual([]);
        expect(await section.evaluate((e, coin) => { const r = e.querySelector(`${coin} img`)!.getBoundingClientRect(); return [r.width, r.height]; }, coin)).toEqual(cards ? [26, 26] : [30, 30]);
      }
    }
  } finally { await page.close(); }
});

it('stops passive drawing five seconds after changes and keeps move motion', async () => {
  const page = await open(view('7k/8/8/8/8/3p4/4P3/K7 w - - 0 1')), frame = page.frameLocator('iframe');
  try {
    await frame.locator('html').evaluate(async () => { await (window as any).testBoard.ready(); });
    await page.clock.install();
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
    await expect.poll(() => frame.locator('html').evaluate(() => (window as any).fallen.some((c: any) => c.sq !== null && c.animating === 'false')), { timeout: 3000 }).toBe(true);
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
    await frame.locator('html').evaluate((_, next) => { (window as any).harnessApp.routeView(next); },
      { ...first, revision: 1, fen: toFen(makeMove(pre, move)), turn: 1, last_commands: [{ seq: 1, seat: 0, action: { type: 'turn', actions: [toLan(pre, move)] }, at: '2026-10-15T00:00:01Z' }] });
    await frame.locator('#board[data-animating="true"]').waitFor();
    await frame.locator('#board').focus(); await page.keyboard.press('ArrowRight');
    expect(await frame.locator('#board').getAttribute('aria-label')).toMatch(/^Chess board, [a-h][1-8]\./);
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
