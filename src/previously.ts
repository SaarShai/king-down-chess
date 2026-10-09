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
  const before = history[from - 1];
  return {
    from, to: history.length,
    line: describeMove(last.pos, last.move, true),
    before: before ? describeMove(before.pos, before.move, true) : null,
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
