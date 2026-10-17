// Unit test for the tap wait of the website checks (tools/lib/tap-board.mjs), with no browser: a stand-in for
// Playwright's page and for the page's live view. The browser checks run it against the real board (read-piece).
import { afterEach, describe, expect, it } from 'vitest';
import { armTapCount, tapCount, tapSquare, waitForTap } from './tap-board.mjs';

type View = { screenOf: (sq: number) => { x: number; y: number }; onSquareClick: (sq: number, shift?: boolean) => void; onDragSelect: (sq: number) => void };
type Armed = View & { __taps?: number };

/** What the stand-in page did, in order. */
let log: string[] = [];
/** The calls that the view's own handlers took. */
let calls: string[] = [];

const view = (): Armed => ({
  screenOf: sq => ({ x: sq, y: sq * 2 }),
  onSquareClick: (sq, _shift) => { calls.push(`click ${sq}`); },
  onDragSelect: sq => { calls.push(`drag ${sq}`); },
});

/**
 * A stand-in page. `delay` says when the browser runs the board's handler: 'tap' inside touchscreen.tap(),
 * 'poll' on the first wait poll (the race that the ticket reports), 'never' not at all.
 */
function page(v: Armed, delay: 'tap' | 'poll' | 'never' = 'tap') {
  (globalThis as { window?: unknown }).window = { view: v };
  const take = (): void => { log.push('board takes the tap'); v.onSquareClick(5, false); };
  return {
    evaluate: async (fn: (arg?: unknown) => unknown, arg?: unknown) => { log.push('evaluate'); return fn(arg); },
    waitForFunction: async (pred: (arg?: unknown) => boolean, arg?: unknown) => {
      for (let i = 0; i < 3; i += 1) {
        log.push('wait');
        if (delay === 'poll' && i === 0) take();
        if (pred(arg)) return true;
      }
      const error = new Error('Timeout 30000ms exceeded.');
      error.stack = 'TimeoutError: Timeout 30000ms exceeded.\n    at tap-board.test.ts:1:1';
      throw error;
    },
    touchscreen: { tap: async (x: number, y: number) => { log.push(`touch ${x},${y}`); if (delay === 'tap') take(); } },
  };
}

afterEach(() => { delete (globalThis as { window?: unknown }).window; log = []; calls = []; });

describe('the tap wait', () => {
  it('counts each tap that the board takes, and wraps the handlers once', async () => {
    const v = view();
    const p = page(v);
    await armTapCount(p);
    await armTapCount(p); // a second arm must not wrap the handler again
    expect(await tapCount(p)).toBe(0);
    v.onSquareClick(5, false);
    v.onDragSelect(6);
    expect(await tapCount(p)).toBe(2);
    expect(calls).toEqual(['click 5', 'drag 6']);
  });

  it('reads the square, taps it, then waits for the board to take the tap', async () => {
    const v = view();
    const p = page(v);
    await armTapCount(p);
    log = [];
    await tapSquare(p, 5);
    expect(log).toEqual(['evaluate', 'evaluate', 'touch 5,10', 'board takes the tap', 'wait']);
    expect(calls).toEqual(['click 5']);
  });

  it('arms the count on the first tap of a page that no one armed', async () => {
    const v = view();
    await tapSquare(page(v), 5);
    expect(log).toEqual(['evaluate', 'evaluate', 'evaluate', 'touch 5,10', 'board takes the tap', 'wait']);
    expect(calls).toEqual(['click 5']);
  });

  it('waits when the board takes the tap only after touchscreen.tap() resolved', async () => {
    const v = view();
    const p = page(v, 'poll');
    await armTapCount(p);
    log = [];
    await tapSquare(p, 5);
    expect(log).toEqual(['evaluate', 'evaluate', 'touch 5,10', 'wait', 'board takes the tap']);
  });

  it('fails with the tap counts when the board never takes the tap', async () => {
    const v = view();
    const p = page(v, 'never');
    await armTapCount(p);
    const error = await tapSquare(p, 5).catch((e: Error) => e);
    expect(error.message).toMatch(/tap: the board did not take the tap; it has taken 0 taps, and it had taken 0 before the tap/);
    expect(error.stack).toMatch(/tap: the board did not take the tap.*\n    at tap-board\.test\.ts:1:1$/);
  });

  it('waits for the next tap, not for a count that it has seen already', async () => {
    const v = view();
    const p = page(v);
    await armTapCount(p);
    v.onSquareClick(3, false);
    await expect(waitForTap(p, 0)).resolves.toBeUndefined();
    await expect(waitForTap(p, 1)).rejects.toThrow(/the board did not take the tap; it has taken 1 taps/);
    v.onSquareClick(4, false);
    await expect(waitForTap(p, 1)).resolves.toBeUndefined();
  });
});
