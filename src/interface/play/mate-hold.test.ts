import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { afterEach, expect, it, vi } from 'vitest';

const filename = new URL(process.env.KINGDOWN_MATE_HOLD_SOURCE ?? './main.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const declarations = parseSync(filename.pathname, source).program.body
  .filter(node => node.type === 'FunctionDeclaration' && ['showResult', 'holdMate', 'armResult', 'reply', 'setMotion'].includes(node.id?.name ?? ''));
// Run the play screen's real solo result sequence with stub collaborators and fake timers.
const page = transformSync(filename.pathname, declarations.map(node => source.slice(node.start, node.end)).join('\n')).code;
afterEach(() => { vi.useRealTimers(); });

function screen({ reduce = false, hidden = false, taken = false, start = true } = {}) {
  vi.useFakeTimers();
  const noop = () => {}, effect = () => ({ cancel: noop, finish: noop }), motion = { reduce };
  const play = vi.fn(() => new Promise<void>(() => {})), closeIn = vi.fn(effect);
  const listeners = new Set<() => void>(), skips: unknown[] = [];
  const document = {
    hidden,
    addEventListener: (_: string, run: () => void, { signal }: { signal: AbortSignal }) => { listeners.add(run); signal.addEventListener('abort', () => listeners.delete(run)); },
  };
  const game = {
    status: start ? 'checkmate' : 'playing', pos: { board: [], turn: 1, ply: 0 }, history: [], legal: [], context: { positionKey: () => '' },
    play() { game.status = 'checkmate'; game.pos = { board: [], turn: 0, ply: 1 }; },
  };
  const scope: Record<string, unknown> = {
    gameHelp: undefined, closeStaleDialogs: noop, stopGameTime: noop, ended: false, thinking: false, liveGame: true, reading: 'normal', shown: null,
    game, cpu: () => 1, text: { win: 'You win', loss: 'You lose' },
    board: { skip: noop, setPosition: noop, play, setMotion: noop }, detail: { querySelector: () => null },
    findKing: () => taken ? -1 : 60, kingSquare: () => 60,
    button: () => { const skip = { classList: { add: noop }, addEventListener: noop, focus: noop, remove: noop }; skips.push(skip); return skip; },
    screen: { append: vi.fn(), dataset: {}, isConnected: false }, boardBox: { append: vi.fn(), style: { setProperty: noop } },
    cue: noop, pulse: noop, hold: noop, ease: { lin: (t: number) => t, out2: (t: number) => t }, shake: effect, burst: effect, at: noop, tween: effect,
    later: (ms: number, run: () => void) => { const timer = setTimeout(run, ms); return { cancel: () => clearTimeout(timer), finish: noop }; },
    cells: Array.from({ length: 64 }, () => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 80, height: 80 }) })),
    closeIn, reducedMotion: () => motion.reduce, document, AbortController,
    setTimeout: (run: () => void, ms: number) => setTimeout(run, ms), clearTimeout: (timer: number) => clearTimeout(timer),
    update: noop, focusResult: noop, announce: noop, replyText: () => '', endResult: undefined, mateHold: undefined, drawMarks: noop,
    // The computer's mating reply: its playback waits for frames (a hidden page gives none).
    generation: 1, engine: { think: async () => ({ move: { from: 0, to: 8 } }) }, skillPlan: () => ({ blunder: 0 }), SKILLS: [{}], gameLevel: 0,
    calm: () => true, pieceView: 'figures', save: noop, turnText: () => '', turnActions: () => [], effectEndLines: () => [], sentence: () => '', cards: () => [],
    animate: () => new Promise<void>(() => {}), endReply: null, acting: '', fault: null, player: 0, DraftTurn: class {}, lastReplySteps: () => [], passTurn: noop,
    // Motion settings: the system setting follows the same switch as the app setting here.
    matchMedia: () => ({ matches: motion.reduce }), setInterfaceMotion: noop, setFxMotion: noop, homeView: undefined, motion: 'normal', boardReplay: { cancel: noop },
  };
  runInNewContext(page, scope, { filename: filename.pathname });
  if (start) (scope.showResult as () => void)();
  const hide = () => { document.hidden = true; listeners.forEach(run => run()); };
  return { scope, play, closeIn, motion, hide, skips, listeners, card: () => scope.reading === 'result' };
}

it('holds a checkmate 600 ms with the threat lines and one beat on the mated king, then the fall; the card comes even if the fall never ends', () => {
  const { scope, play, closeIn, card } = screen();
  expect(scope.mateHold).toBeDefined();
  expect(closeIn).toHaveBeenCalledOnce();
  vi.advanceTimersByTime(599);
  expect(play).not.toHaveBeenCalled();
  expect(card()).toBe(false);
  vi.advanceTimersByTime(1);
  expect(play).toHaveBeenCalledWith({ kind: 'fall', square: 60 });
  expect(scope.mateHold).toBeUndefined();
  vi.advanceTimersByTime(2399);
  expect(card()).toBe(false);
  vi.advanceTimersByTime(1);
  expect(card()).toBe(true);
});

it('reduced motion: no beat and no fall, a plain 300 ms pause with the lines, then the card', () => {
  const { scope, play, closeIn, card } = screen({ reduce: true });
  expect(closeIn).not.toHaveBeenCalled();
  expect(scope.mateHold).toBeDefined();
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
  expect(taken.scope.mateHold).toBeUndefined();
  await vi.advanceTimersByTimeAsync(900);
  expect(taken.card()).toBe(true);
});

it('the 3 s hard end starts when the computer mates, not when its playback ends', async () => {
  const { scope, card, listeners } = screen({ start: false });
  void (scope.reply as () => Promise<void>)();
  await vi.advanceTimersByTimeAsync(2999);
  expect(card()).toBe(false);
  await vi.advanceTimersByTimeAsync(1);
  expect(card()).toBe(true);
  vi.runAllTimers();
  expect([vi.getTimerCount(), listeners.size]).toEqual([0, 0]);
});

it('a page that becomes hidden during the mating playback shows the card at once', async () => {
  const { scope, card, hide } = screen({ start: false });
  void (scope.reply as () => Promise<void>)();
  await vi.advanceTimersByTimeAsync(100);
  expect(card()).toBe(false);
  hide();
  expect(card()).toBe(true);
});

it('the Skip surface covers the board only, so Menu and Back to home stay free during the hold', () => {
  const { scope, skips } = screen();
  expect((scope.boardBox as { append: ReturnType<typeof vi.fn> }).append).toHaveBeenCalledWith(skips[0]);
  expect((scope.screen as { append: ReturnType<typeof vi.fn> }).append).not.toHaveBeenCalled();
});

it('reduced motion turned on during the hold ends the hold and shows the card', () => {
  const { scope, motion, card, play } = screen();
  vi.advanceTimersByTime(100);
  motion.reduce = true;
  (scope.setMotion as () => void)();
  expect(card()).toBe(true);
  expect(play).not.toHaveBeenCalled();
});
