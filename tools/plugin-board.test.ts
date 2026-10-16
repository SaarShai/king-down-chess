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
import { applyLan } from '../src/plugin/screens/board-model';
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
// Taps 1 px inside each edge of each visible control (clear of round corners); each must hit that control, not a neighbour's hit layer.
const edgeMisses = (buttons: Element[]) => buttons.flatMap(button => {
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

it('keeps Their move through the opponent Haste turn', async () => {
  const rules: Partial<Rules> = { kings: [null, { king: 'Flame', power: 'Haste' }] }, fen = '4k3/p7/8/8/8/8/4P3/K7 b - - 0 1';
  setRules(rules); const pre = fromFen(fen), move = legalMoves(pre).find(m => m.power === 'haste' && m.from === 48 && m.to === 40)!;
  const page = await open(view(toFen(makeMove(pre, move)), rules, { revision: 1, seat: 0, history: { initial_fen: fen, actions: [toLan(pre, move)] } })), frame = page.frameLocator('iframe');
  try {
    expect(await frame.locator('#status').textContent()).toBe('Their move.');
    expect(await frame.locator('#end-turn').getAttribute('aria-disabled')).toBe('true');
  } finally { await page.close(); }
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
    const targets = await frame.locator('#game-table button:visible').evaluateAll(buttons => buttons.map(button => {
      const r = button.getBoundingClientRect(), style = getComputedStyle(button, '::after'), active = style.content !== 'none' && style.content !== 'normal';
      return { id: button.id, width: Math.max(r.width, active ? parseFloat(style.width) || 0 : 0), height: Math.max(r.height, active ? parseFloat(style.height) || 0 : 0) };
    }));
    expect(targets.filter(t => t.width < 48 || t.height < 48)).toEqual([]);
    const missed = await frame.locator('#game-table button:visible').evaluateAll(buttons => buttons.flatMap(button => {
      const r = button.getBoundingClientRect(), s = getComputedStyle(button, '::after'), m = new DOMMatrix(s.transform);
      const x = r.x + button.clientLeft + parseFloat(s.left) + m.e + parseFloat(s.width) / 2, y = r.y + button.clientTop + parseFloat(s.top) + m.f + parseFloat(s.height) / 2;
      return [-23, 23].flatMap(dx => [-23, 23].flatMap(dy => { const hit = document.elementFromPoint(x + dx, y + dy)?.closest('button'), box = hit?.getBoundingClientRect(); return hit === button || box && x + dx >= box.left && x + dx < box.right && y + dy >= box.top && y + dy < box.bottom ? [] : [`${button.id}: ${dx},${dy} → ${hit?.id}`]; }));
    }));
    expect(missed).toEqual([]);
    expect(await frame.locator('#game-table button:visible').evaluateAll(edgeMisses)).toEqual([]);
    if (cards) {
      await frame.locator('#card-w-1').click(); await frame.getByRole('button', { name: 'Use', exact: true }).click();
      await frame.getByRole('button', { name: 'Cancel', exact: true }).waitFor();
      expect(await frame.locator('#game-table button:visible').evaluateAll(edgeMisses)).toEqual([]);
    }
    expect.soft(await frame.locator('#strip-me .coin img').first().evaluate(e => [e.getBoundingClientRect().width, e.getBoundingClientRect().height])).toEqual(cards ? [26, 26] : [30, 30]);
    // U6 (taste preview): under 350 px the four cards go below the player name, so that row has two 44 px rows.
    expect(await frame.locator('#strip-me').evaluate(e => e.getBoundingClientRect().height)).toBe(cards && width === 320 ? 88 : 44);
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
    await frame.locator('#game-table').evaluate(async e => { await Promise.all(e.getAnimations().map(a => a.finished)); });
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
        // Wait until no motion runs. A strip rebuild during the deal can cancel the old coin's animation (its finished
        // promise rejects) and starts it again on the new coin, so a single wait can reject or end too soon.
        await frame.locator('#game-table').evaluate(async e => { for (let run: Animation[]; (run = e.getAnimations({ subtree: true }).filter(a => a.playState !== 'finished')).length;) await Promise.all(run.map(a => a.finished.catch(() => {}))); });
        const missed = await frame.locator(`[data-screen="${screen}"] button:visible`).evaluateAll(buttons => buttons.flatMap(button => {
          const r = button.getBoundingClientRect(), s = getComputedStyle(button, '::after'), m = new DOMMatrix(s.transform);
          if (Math.max(r.width, parseFloat(s.width) || 0) < 48 || Math.max(r.height, parseFloat(s.height) || 0) < 48) return [button.id + ': size'];
          const x = r.x + button.clientLeft + parseFloat(s.left) + m.e + parseFloat(s.width) / 2, y = r.y + button.clientTop + parseFloat(s.top) + m.f + parseFloat(s.height) / 2;
          return [-23, 23].flatMap(dx => [-23, 23].flatMap(dy => { const hit = document.elementFromPoint(x + dx, y + dy)?.closest('button'), box = hit?.getBoundingClientRect(); return hit === button || box && x + dx >= box.left && x + dx < box.right && y + dy >= box.top && y + dy < box.bottom ? [] : [`${button.id}: ${dx},${dy} → ${hit?.id}`]; }));
        }));
        expect(missed).toEqual([]);
        expect(await frame.locator(`[data-screen="${screen}"] button:visible`).evaluateAll(edgeMisses)).toEqual([]);
        expect(await frame.locator(`${coin} img`).evaluate(e => [e.getBoundingClientRect().width, e.getBoundingClientRect().height])).toEqual(cards ? [26, 26] : [30, 30]);
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

// W7 journeys use board input. The endpoint only sets the starting position.
async function turnBoard(fen?: string) {
  const page = await open(view('')), frame = page.frameLocator('iframe');
  const result = await (await page.request.post(new URL(fen ? `/fixture-position?fen=${encodeURIComponent(fen)}` : '/fixture-position?case=haste', harness.url).href)).json();
  expect(result.isError).not.toBe(true);
  await page.evaluate(result => (window as any).harnessShow(result), result);
  await frame.locator('#status').filter({hasText:'Your move'}).waitFor();
  await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
  return {page, frame, base:result._meta.view as View};
}
async function squareTap(page: Page, square: number) {
  const frame = page.frameLocator('iframe'), pane = (await page.locator('iframe').boundingBox())!;
  const point = await frame.locator('#board canvas').evaluate((canvas, sq) => {
    const r = canvas.getBoundingClientRect(), k = r.width / 960;
    return {x:r.x+(32+((sq&7)+.5)*112)*k, y:r.y+(96+(7-(sq>>3)+.5)*112)*k};
  }, square);
  await page.mouse.click(pane.x+point.x, pane.y+point.y);
}
async function chooseTurnMove(page: Page, lan: string, from: number) {
  const frame = page.frameLocator('iframe');
  await squareTap(page, from); await frame.locator('#board-menu').click();
  await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click();
  await frame.locator(`#choices button[title="${lan}"]`).click();
  await frame.locator('#board[data-animating="false"]').waitFor();
}
const moveCalls = (page: Page) => page.evaluate(() => ((window as any).harnessCalls ?? []).filter((c: any) => c.name === 'kingdown_move'));

it('W7: stages a move, sends once, and starts the computer only after the press', async () => {
  const {page,frame,base} = await turnBoard('4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1');
  try {
    await squareTap(page,12); await squareTap(page,28); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await moveCalls(page)).toEqual([]);
    expect(await page.evaluate(() => (window as any).harnessView.revision)).toBe(base.revision);
    expect(await page.evaluate(() => (window as any).harnessCalls.some((c: any) => c.name==='kingdown_computer'))).toBe(false);
    expect(await frame.locator('#status').textContent()).toBe('Your turn is ready. Tap End turn.');
    expect(await frame.locator('#end-turn').getAttribute('aria-label')).toBe('End turn');
    expect(await frame.locator('#end-turn').getAttribute('title')).toBe('End turn');
    expect(await frame.locator('#end-turn').innerText()).toBe('');
    expect(await frame.locator('#end-turn use').getAttribute('href')).toBe('#i-sword');
    await page.emulateMedia({reducedMotion:'reduce'});
    expect(await frame.locator('#end-turn').evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; });
    await frame.locator('#end-turn').click();
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
    expect((await moveCalls(page)).length).toBe(1);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

it('W7: undoes both Haste steps and restores the power coin and trail', async () => {
  const {page,frame} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4!H',12);
    expect(await frame.locator('#status').textContent()).toBe('Move it again, or tap End turn.');
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
    await frame.locator('#end-turn').click();
    await expect.poll(async () => (await moveCalls(page)).length).toBe(1);
    expect((await moveCalls(page))[0].arguments.actions).toEqual(['e2-e4!H','--']);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

it('W7: keeps piece and coin reads while the draft waits and while a send waits', async () => {
  const {page,frame} = await turnBoard();
  try {
    await chooseTurnMove(page,'e2-e4',12);
    for (const sending of [false,true]) {
      if (sending) { await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_move'; }); await frame.locator('#end-turn').click(); await page.waitForFunction(() => typeof (window as any).releaseBefore==='function'); }
      await squareTap(page,28);
      expect(await frame.locator('#context-actions').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
      expect(await frame.locator('#context-note').textContent()).toBe('Tap End turn, or Undo.');
      await frame.locator('#context-actions').getByRole('button',{name:'All rules',exact:true}).click();
      await frame.locator('#board-sheet[open]').waitFor(); await page.keyboard.press('Escape');
      expect(await frame.locator('#context-actions').getByRole('button',{name:'All rules',exact:true}).evaluate(e => e===document.activeElement)).toBe(true);
      await frame.locator('#power-w').click();
      expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
      await page.keyboard.press('Escape');
      expect(await frame.locator('#power-w').evaluate(e => e===document.activeElement)).toBe(true);
      await squareTap(page,36); await frame.locator('#board').press('Enter');
      const box=(await frame.locator('#board canvas').boundingBox())!;
      await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down(); await page.mouse.move(box.x+box.width/2+10,box.y+box.height/2); await page.mouse.up();
      if (!sending) { await frame.locator('#board-menu').click(); await frame.locator('#board-sheet').getByRole('button',{name:'Choose a move',exact:true}).click(); }
      expect(await frame.locator('#choices button').count()).toBe(0); await page.keyboard.press('Escape');
      expect(await frame.locator('#last-move').innerText()).toContain('White pawn e2 to e4.');
      expect((await moveCalls(page)).length).toBe(sending?1:0);
    }
    await page.evaluate(() => { (window as any).holdBeforeNext='kingdown_computer'; (window as any).releaseBefore(); });
    await page.waitForFunction(() => (window as any).harnessCalls.some((c: any) => c.name==='kingdown_computer'));
    await squareTap(page,28);
    expect(await frame.locator('#context-actions').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
    await frame.locator('#power-w').click();
    expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
    await page.keyboard.press('Escape'); await squareTap(page,36); await frame.locator('#board').press('Enter');
    expect(await frame.locator('#last-move').innerText()).toContain('White pawn e2 to e4.');
    expect((await moveCalls(page)).length).toBe(1);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});

it('W7: stages mate, permits Undo, and ends only on the press with no second move animation', async () => {
  const {page,frame} = await turnBoard('k7/8/1K6/8/8/8/8/7R w - - 0 1');
  try {
    await frame.locator('html').evaluate(() => { const host=window as any, animate=host.testBoard.animateMove.bind(host.testBoard); host.turnAnimations=0; host.testBoard.animateMove=(...args: any[]) => { host.turnAnimations++; return animate(...args); }; });
    await squareTap(page,7); await squareTap(page,63); await frame.locator('#board[data-animating="false"]').waitFor();
    expect(await frame.locator('#status').textContent()).toBe('Checkmate. Tap End turn to finish.');
    expect(await frame.locator('#over[open]').count()).toBe(0); expect(await moveCalls(page)).toEqual([]);
    await frame.locator('#undo').click(); expect(await frame.locator('#status').textContent()).toBe('Your move.');
    await squareTap(page,7); await squareTap(page,63); await frame.locator('#board[data-animating="false"]').waitFor();
    await frame.locator('#end-turn').click(); await frame.locator('#over[open]').waitFor();
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
    expect((await moveCalls(page)).length).toBe(1);
  } finally { await page.evaluate(() => (window as any).releaseBefore?.()); await page.close(); }
});


it('W7: snaps to the draft if motion fails and keeps Undo available', async () => {
  const {page,frame,base} = await turnBoard();
  try {
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
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
    await frame.locator('#end-turn').click(); await frame.locator('#retry').waitFor();
    const message=await frame.locator('#error').innerText(); expect(message).not.toBe('');
    await squareTap(page,28);
    expect(await frame.locator('#error').innerText()).toBe(message);
    expect(await frame.locator('#context-actions').getByRole('button',{name:'All rules',exact:true}).isEnabled()).toBe(true);
    await frame.locator('#power-w').click();
    expect(await frame.locator('#error').innerText()).toBe(message);
    expect(await frame.locator('#board-sheet').getByRole('button',{name:'Use',exact:true}).count()).toBe(0);
    expect(await frame.locator('#undo').getAttribute('aria-disabled')).toBe('true');
    expect((await moveCalls(page)).length).toBe(1);
  } finally { await page.close(); }
});
