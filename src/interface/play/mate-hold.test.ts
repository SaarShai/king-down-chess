import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { afterEach, expect, it, vi } from 'vitest';

const filename = new URL(process.env.KINGDOWN_MATE_HOLD_SOURCE ?? './main.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const declarations = parseSync(filename.pathname, source).program.body
  .filter(node => node.type === 'FunctionDeclaration' && ['showResult', 'holdMate'].includes(node.id?.name ?? ''));
// Run the play screen's real solo result sequence with stub collaborators and fake timers.
const page = transformSync(filename.pathname, declarations.map(node => source.slice(node.start, node.end)).join('\n')).code;
afterEach(() => { vi.useRealTimers(); });

function screen({ reduce = false, hidden = false, taken = false } = {}) {
  vi.useFakeTimers();
  const noop = () => {}, effect = () => ({ cancel: noop, finish: noop });
  const play = vi.fn(() => new Promise<void>(() => {})), closeIn = vi.fn(effect), held: boolean[] = [];
  const scope: Record<string, unknown> = {
    gameHelp: undefined, closeStaleDialogs: noop, stopGameTime: noop, ended: false, thinking: false, liveGame: true, reading: 'normal', shown: null,
    game: { status: 'checkmate', pos: { board: [], turn: 1 }, history: [] }, cpu: () => 1, text: { win: 'You win', loss: 'You lose' },
    board: { skip: noop, setPosition: noop, play }, detail: { querySelector: () => null },
    findKing: () => taken ? -1 : 60, kingSquare: () => 60,
    button: () => ({ classList: { add: noop }, addEventListener: noop, focus: noop, remove: noop }),
    screen: { append: noop, dataset: {} }, boardBox: { style: { setProperty: noop } },
    cue: noop, pulse: noop, hold: noop, ease: { lin: (t: number) => t, out2: (t: number) => t }, shake: effect, burst: effect, at: noop, tween: effect,
    later: (ms: number, run: () => void) => { const timer = setTimeout(run, ms); return { cancel: () => clearTimeout(timer), finish: noop }; },
    cells: Array.from({ length: 64 }, () => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 80, height: 80 }) })),
    closeIn, reducedMotion: () => reduce, document: { hidden, addEventListener: noop }, AbortController,
    setTimeout: (run: () => void, ms: number) => setTimeout(run, ms), clearTimeout: (timer: number) => clearTimeout(timer),
    update: noop, focusResult: noop, announce: noop, replyText: () => '', endResult: undefined, mateHeld: false,
  };
  scope.drawMarks = () => held.push(scope.mateHeld as boolean);
  runInNewContext(page, scope, { filename: filename.pathname });
  (scope.showResult as () => void)();
  return { scope, play, closeIn, held, card: () => scope.reading === 'result' };
}

it('holds a checkmate 600 ms with the threat lines and one beat on the mated king, then the fall; the card comes even if the fall never ends', () => {
  const { scope, play, closeIn, card } = screen();
  expect(scope.mateHeld).toBe(true);
  expect(closeIn).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(599);
  expect(play).not.toHaveBeenCalled();
  expect(card()).toBe(false);
  vi.advanceTimersByTime(1);
  expect(play).toHaveBeenCalledWith({ kind: 'fall', square: 60 });
  expect(scope.mateHeld).toBe(false);
  vi.advanceTimersByTime(2399);
  expect(card()).toBe(false);
  vi.advanceTimersByTime(1);
  expect(card()).toBe(true);
});

it('reduced motion: no beat and no fall, a plain 300 ms pause with the lines, then the card', () => {
  const { scope, play, closeIn, card } = screen({ reduce: true });
  expect(closeIn).not.toHaveBeenCalled();
  expect(scope.mateHeld).toBe(true);
  vi.advanceTimersByTime(299);
  expect(card()).toBe(false);
  vi.advanceTimersByTime(1);
  expect(card()).toBe(true);
  expect(play).not.toHaveBeenCalled();
});

it('a hidden page shows the card at once; a taken king keeps its own moment with no hold', async () => {
  expect(screen({ hidden: true }).card()).toBe(true);
  const taken = screen({ taken: true });
  expect(taken.closeIn).not.toHaveBeenCalled();
  expect(taken.held).not.toContain(true);
  await vi.advanceTimersByTimeAsync(900);
  expect(taken.card()).toBe(true);
});
