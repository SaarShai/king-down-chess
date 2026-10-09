import type { Game } from './game';
import type { Color } from './rules/engine';
import { describeMove } from './move-text';

export interface PreviouslyTurn {
  from: number;
  to: number;
  line: string;
  before: string | null;
}

/** The last friend turn uses the side before each move, not ply parity. */
export function previouslyTurn(history: Readonly<Game['history']>, side: Color): PreviouslyTurn | null {
  const last = history.at(-1);
  if (!last || last.pos.turn === side) return null;
  let from = history.length - 1;
  while (from > 0 && history[from - 1].pos.turn !== side) from--;
  let beforeFrom = from;
  while (beforeFrom > 0 && history[beforeFrom - 1].pos.turn === side) beforeFrom--;
  const words = (start: number, end: number): string => history.slice(start, end)
    .map(ply => describeMove(ply.pos, ply.move, true)).join(' Then ');
  return {
    from, to: history.length,
    line: words(from, history.length),
    before: beforeFrom < from ? words(beforeFrom, from) : null,
  };
}

/** Keep `played` for this open link; a later render does not play it again. */
export function previouslyPlayback(turn: PreviouslyTurn | null, options: {
  played: boolean;
  motion: boolean;
  reducedMotion: boolean;
  complete: boolean;
}): { play: boolean; seeAgain: boolean; played: boolean } {
  const seeAgain = turn !== null && options.complete && options.motion && !options.reducedMotion;
  return { play: seeAgain && !options.played, seeAgain, played: true };
}
