import { PaintedView, type Pace } from '../render/PaintedView';
import { GameRules } from '../game-rules';
import type { Move, Position } from '../rules/engine';
import { momentKind } from '../moment';
import { soundsFor } from '../render/sounds';
import { snd, playArmour, movementSample, stopSelection, type SamplePlayback } from '../render/sfx';
import { colorOf, typeOf, N, P, G, M, O, K, PLAIN_KINGS, type Color } from '../rules/engine';
import type { Highlights } from '../render/marks';
import type { PlainMarks } from '../render/plain-marks';

export type { Move, Position, Pace };
export { GameRules };
export type BoardAction = Move | { kind: 'check' | 'fall'; square: number };
export interface Playback { durationMs: number; blockedMs: number; skipped: boolean }
export interface Board {
  /** Wait for the initial board art and the first visible frame. Reject on an art error. */
  ready(): Promise<void>;
  /** Swap board art without changing square geometry. */
  setSkin(url: string): Promise<void>;
  /** Cancel playback and show a complete position. Omit rules to retain the current rules. */
  setPosition(position: Position, rules?: GameRules): void;
  /** Play one engine action, check mark, or king fall. Resolve after its final board frame. */
  play(action: BoardAction, after?: Position): Promise<Playback>;
  /** Set a lasting mark. It draws only when the rules give the marking side Freeze or Ice Wall, or cards; return true then. */
  showEffect(effect: 'frozen' | 'protected', square: number, turns?: number): boolean;
  /** Remove the lasting mark at a square, or all marks. Restore the position's own marks. */
  clearEffect(square?: number): void;
  /** Set speed and reduced motion. Null follows the system setting. Reduced motion keeps slides. */
  setMotion(speed: Pace, reducedMotion?: boolean | null): void;
  /** End current playback at once. Its play promise still resolves and shows the final position. */
  skip(): void;
  /** Draw each piece as a symbol image in place of its figure, or clear with no argument. Symbols have no travel. */
  setSymbols(symbols?: (piece: number) => HTMLImageElement): void;
  /** Set or clear the imported selection, legal-action, and check drawings. */
  highlight(marks: Highlights): void;
  /** Draw Plain rings and paths below the figures when plainMarks is on. */
  mark(marks: PlainMarks): void;
  /** Tell the board the selected piece and its targets, with no drawing: the piece's idle plays and its move frames load. */
  select(square: number | null, targets?: number[], captures?: number[]): void;
  /** The match opening: the figures on `delays` (square: ms) fade in and rise into place, `ms` each. An empty map ends it. */
  arrive(delays: Map<number, number>, ms?: number, rise?: number): void;
  /** Remove the board. End playback and release input events, frames, and the size observer. */
  dispose(): void;
  /** Show the board from Dark's side (true) or Light's side. Square numbers and marks keep their engine squares. */
  flip(black: boolean): void;
}
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/** Mount one board. The callback receives a1=0 through h8=63. Input pauses during playback. */
/** `onArtError`: a rest still of a figure cannot load (no default: the old fallback stays). */
export function mountBoard(element: HTMLElement, onSquare: (square: number) => void = () => {}, options: { liveInput?: boolean; quiet?: boolean; plainMarks?: boolean; initialBoardArt?: string; armourSounds?: boolean; onArtError?: (url: string) => void } = {}): Board {
  const view = new PaintedView(element, { ...options, holdStills: true, lazySheets: true, floor: options.quiet ? null : undefined, webInk: options.quiet });
  let rules = new GameRules(), position: Position | null = null, busy = false, skipped = false, generation = 0;
  let knightTake = false, pawnTake = false;
  // Every character cue of this board: leap, landing, walk, movement and the takes that end after their move.
  const cues = new Set<SamplePlayback>();
  let cueRound = 0;
  function cue(playback: SamplePlayback) { cues.add(playback); void playback.done.then(() => cues.delete(playback)); return playback; }
  /** Stop every character cue at once; the pending cues of the move that plays stay silent. */
  function stopCues() { cueRound++; for (const playback of cues) playback.cancel(); cues.clear(); stopSelection(); }
  // An idle skip or position (End turn, the next move's start) keeps the natural end of the last take.
  function interrupt() { if (busy) stopCues(); }
  const page = typeof document === 'undefined' ? undefined : document;
  const hideMovement = () => { if (page?.hidden) stopCues(); };
  page?.addEventListener('visibilitychange', hideMovement);
  let loadError: unknown;
  let pace: Pace = 'normal', reduced = false, symbolsActive = false, releaseHold = () => {};
  const hold = (start: number) => new Promise<void>(resolve => {
    const timer = setTimeout(resolve, Math.max(0, (pace === 'fast' ? 450 : 900) - (performance.now() - start)));
    releaseHold = () => { clearTimeout(timer); resolve(); };
  });
  // The scene ends a running move when the selection changes: hold the selection until playback ends.
  let selection: [number | null, number[], number[]] = [null, [], []], shownSelection = '';
  function applySelection() { const key = JSON.stringify(selection); if (busy || key === shownSelection) return; shownSelection = key; view.setSelected(...selection); }
  const effects = new Map<number, { kind: 'frozen' | 'protected'; turns: number }>();
  view.onLoadError = error => { loadError = error; };
  function finish() {
    interrupt(); releaseHold(); skipped = true; view.skip({ keepStates: true });
    if (options.liveInput && busy) { generation++; busy = false; if (position) syncEffects(); applySelection(); }
  }
  view.onSquareClick = square => { if (options.liveInput && busy) finish(); if (!busy) onSquare(square); };
  view.canDrag = () => false;
  view.onSkipAnimation = () => { if (options.liveInput) finish(); else { interrupt(); skipped = true; } };
  function syncEffects(): void {
    if (!position) return;
    const shown = structuredClone(position);
    for (const [square, effect] of effects) {
      const by = effect.kind === 'frozen' ? (colorOf(shown.board[square]) ^ 1) : colorOf(shown.board[square]);
      const marks: NonNullable<Position['marks']> = [
        by === 0 ? { sq: square, left: effect.turns, ward: effect.kind === 'protected' } : shown.marks?.[0],
        by === 1 ? { sq: square, left: effect.turns, ward: effect.kind === 'protected' } : shown.marks?.[1],
      ];
      shown.marks = marks;
    }
    view.sync(shown);
  }
  return {
    async ready() { await view.ready(); if (loadError) throw loadError; },
    setSkin(url) { return view.setSkin(url); },
    setPosition(next, context = rules) {
      interrupt(); releaseHold(); generation++; view.skip(); busy = false; effects.clear(); position = structuredClone(next); rules = context;
      view.setRules(rules); view.setFallen(null, false); view.highlight({}); shownSelection = JSON.stringify([null, [], []]); view.sync(position);
    },
    async play(action, after) {
      if (!position) throw new Error('Set a position before playback.');
      if (busy) throw new Error('The board already plays an action.');
      const own = generation, round = cueRound, before = position, start = performance.now();
      busy = true; skipped = false;
      if (options.liveInput && !('kind' in action)) position = structuredClone(after ?? rules.makeMove(before, action));
      try {
        if ('kind' in action) {
          if (action.kind === 'check') { view.highlight({ check: action.square }); snd.check(); }
          else view.setFallen(action.square);
          while (view.animating && own === generation) await frame();
        } else {
          const sounds = soundsFor(momentKind(before, action), action);
          const piece = before.board[action.from], type = typeOf(piece), side = colorOf(piece);
          const knight = options.armourSounds !== false && type === N && action.from !== action.to && action.drop === undefined && !action.swap && sounds.now !== 'shot' && sounds.now !== 'swap';
          const pawn = options.armourSounds !== false && type === P && action.from !== action.to && action.drop === undefined && !action.swap && sounds.now !== 'shot' && sounds.now !== 'swap';
          const moves = options.armourSounds !== false && action.from !== action.to && action.drop === undefined && !action.pass && !action.pushes && !action.swap && sounds.now !== 'shot' && sounds.now !== 'swap';
          const newMove = options.armourSounds !== false && action.from !== action.to && action.drop === undefined && !action.pass && !action.pushes && [G, M, O, K].includes(type) && (!action.swap || type === M);
          const movement = moves || newMove ? movementSample(type, rules.rules.kings[side]?.king ?? PLAIN_KINGS[side]) : undefined;
          const bishop = movement === 'bishopMove';
          const take = knightTake ? 'B' : 'A';
          if (knight) { knightTake = !knightTake; cue(playArmour(`knightLeap${take}`)); }
          if (pawn) { cue(playArmour(pawnTake ? 'pawnWalkB' : 'pawnWalkA')); pawnTake = !pawnTake; }
          const animated = pace !== 'off' && !symbolsActive && !page?.hidden;
          let playback: SamplePlayback | undefined;
          const startMove = () => {
            if (own !== generation || round !== cueRound || skipped || pace === 'off' || symbolsActive || page?.hidden) return;
            playback = movement ? cue(bishop ? playArmour(movement) : playArmour(movement, true)) : undefined;
          };
          if (!animated && !page?.hidden && movement) cue(playArmour(movement));
          if (sounds.now && !((knight || pawn || movement) && sounds.now === 'move')) snd[sounds.now]();
          let struck = false;
          const contact = () => { if (!struck && own === generation) { struck = true; if (knight && round === cueRound) cue(playArmour(`knightLand${take}`)); if (sounds.hit) snd[sounds.hit](); } };
          // A reserve drop has no motion; a Salvation return or an Earth Quake may start on an empty square (main board.ts:325).
          try { if (action.drop === undefined || action.power) await view.animateMove(before, action, contact, undefined, startMove); }
          finally {
            // A normal end keeps the current take to its end; it stays in `cues` until then.
            if (own === generation && round === cueRound && !skipped) playback?.finish(); else playback?.cancel();
          }
          contact();
          if (options.plainMarks && !action.swap && pace !== 'off' && !reduced && !skipped && own === generation) await hold(start);
          if (own === generation) {
            position = structuredClone(after ?? rules.makeMove(before, action));
            syncEffects();
          }
        }
        const durationMs = performance.now() - start;
        await frame();
        return { durationMs, blockedMs: performance.now() - start, skipped: skipped || own !== generation };
      } finally { if (own === generation) { busy = false; applySelection(); } }
    },
    showEffect(kind, square, turns = 1) {
      if (!position?.board[square] || !Number.isInteger(turns) || turns < 1) throw new Error('A mark needs a piece and a positive turn count.');
      effects.set(square, { kind, turns }); syncEffects();
      const by = kind === 'frozen' ? colorOf(position.board[square]) ^ 1 : colorOf(position.board[square]);
      return rules.markKind((by ^ 1) as Color, by as Color, kind === 'protected') !== '';
    },
    clearEffect(square) { if (square == null) effects.clear(); else effects.delete(square); syncEffects(); },
    setMotion(speed, reducedMotion = null) { pace = speed; reduced = reducedMotion ?? (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); if (pace === 'off') stopCues(); if (pace === 'off' || reduced) releaseHold(); view.setReducedMotion(reducedMotion); view.setPace(speed); },
    skip() { finish(); },
    setSymbols(symbols) { symbolsActive = !!symbols; if (symbols) stopCues(); view.setSymbols(symbols); },
    highlight(marks) { view.highlight(marks); },
    mark(marks) { if (options.plainMarks) view.setPlainMarks(marks); },
    select(square, targets = [], captures = []) { selection = [square, targets, captures]; applySelection(); },
    arrive(delays, ms, rise) { view.arrive(delays, ms, rise); },
    dispose() { stopCues(); page?.removeEventListener('visibilitychange', hideMovement); releaseHold(); generation++; busy = false; view.dispose(); element.replaceChildren(); },
    flip(black) { view.flip(black); },
  };
}
