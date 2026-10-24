// The motion concepts of ticket 86 on the plugin board: the promotion reveal and the check onset and withdrawal.
// The plugin board is the shared PaintedView at the fast pace. The Freeze card release is in tools/plugin-motion.test.ts.
import { expect, it } from 'vitest';
import type { Page } from 'playwright';
import { harness, open, view, settleBoardReads, chooseTurnMove } from './lib/plugin-board-fixture';

/** A live game at `fen` with the player's side to move (Black with `black`), at phone size. */
async function liveBoard(fen: string, black: boolean, reduced: boolean) {
  const page = await open(view(''), 390, 844), frame = page.frameLocator('iframe');
  if (reduced) await page.emulateMedia({ reducedMotion: 'reduce' });
  const result = await (await page.request.post(new URL(`/fixture-position?fen=${encodeURIComponent(fen)}${black ? '&black=1' : ''}`, harness.url).href)).json();
  expect(result.isError).not.toBe(true);
  await page.evaluate(result => (window as any).harnessShow(result), result);
  await frame.locator('#status').filter({ hasText: 'Your move' }).waitFor();
  await frame.locator('#board[aria-busy="false"][data-animating="false"]').waitFor();
  await settleBoardReads(page);
  // Note each scene effect, each frame that draws the promotion square itself, and each frame of a check withdrawal.
  await frame.locator('html').evaluate(() => {
    const board = (window as any).testBoard, scene = board.scene, play = scene.play.bind(scene);
    type Effect = { duration: number; position(t: number): { board: ArrayLike<number> } };
    const seen = (window as any).seen = { effects: [] as { duration: number; speed: number }[], hidden: 0, withdrawn: 0, square: -1 };
    let effect: Effect | undefined, at = 0, speed = 1;
    scene.play = (move: unknown, options: { effect?: Effect; speed: number } = { speed: 1 }) => {
      if (options.effect) { seen.effects.push({ duration: options.effect.duration, speed: options.speed }); effect = options.effect; at = performance.now(); speed = options.speed; }
      return play(move, options);
    };
    // The reveal draws the promotion square itself: the board it shows has that square empty (scene.position is the end).
    const tick = () => {
      const t = effect ? (performance.now() - at) / (effect.duration * speed) : 1;
      if (effect && seen.square >= 0 && t < 1 && !effect.position(t).board[seen.square]) seen.hidden++;
      if (board.stateEffects.withdrawn) seen.withdrawn++;
      requestAnimationFrame(tick);
    };
    tick();
  });
  return { page, frame };
}
const seen = (page: Page) => page.frameLocator('iframe').locator('html').evaluate(() => structuredClone((window as any).seen));
const checkAge = (page: Page) => page.frameLocator('iframe').locator('html').evaluate(() => { const board = (window as any).testBoard; return board.stateEffects.age('check', performance.now(), true); });

it.each([
  ['White', '7k/1P6/8/8/8/8/8/K7 w - - 0 1', false, 'b7-b8=Q', 49, 57],
  ['Black', '7k/8/8/8/8/8/6p1/K7 b - - 0 1', true, 'g2-g1=N', 14, 6],
] as const)('%s: the promotion reveal plays once at the fast pace and never under reduced motion', async (_, fen, black, lan, from, to) => {
  for (const reduced of [false, true]) {
    const { page, frame } = await liveBoard(fen, black, reduced);
    try {
      await frame.locator('html').evaluate((_, to) => { (window as any).seen.square = to; }, to);
      expect(await frame.locator('html').evaluate(() => (window as any).testBoard.screenOf(0).y < (window as any).testBoard.screenOf(63).y)).toBe(black);
      await chooseTurnMove(page, lan, from);
      const result = await seen(page);
      expect(result.effects).toEqual(reduced ? [] : [{ duration: 740, speed: .5 }]);
      if (!reduced) expect(result.hidden).toBeGreaterThan(0);
      expect(await frame.locator('html').evaluate((_, to) => (window as any).testBoard.scene.position.board[to], to)).toBeGreaterThan(0);
    } finally { await page.close(); }
  }
});

it.each([false, true])('a check starts once, holds still, and a legal evasion withdraws it (reduced motion %s)', async reduced => {
  // The check preview's dense board, White in check from the rook on e3: a loaded check holds still at once.
  const { page } = await liveBoard('rnbq3k/pppp1ppp/5n2/8/8/4r3/PPPP1PPP/RNBQK1NR w - - 0 13', false, reduced);
  try {
    expect(await checkAge(page)).toBe(Infinity);
    await chooseTurnMove(page, 'Ke1-f1', 4);
    expect((await seen(page)).withdrawn > 0).toBe(!reduced);
  } finally { await page.close(); }
  // A move that gives check starts the onset on the other king.
  const live = await liveBoard('4k3/8/8/8/8/8/8/R3K3 w - - 0 1', false, reduced);
  try {
    await chooseTurnMove(live.page, 'Ra1-a8', 0);
    expect(Number.isFinite(await checkAge(live.page))).toBe(!reduced);
  } finally { await live.page.close(); }
});
