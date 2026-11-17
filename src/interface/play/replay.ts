import type { Game } from '../../game';
import type { GameRules } from '../../game-rules';
import type { Board, Move, Position } from '../board-api';
import type { Color } from '../../rules/engine';
export interface ReplayStep { before: Position; move: Move; after: Position }
/** Read the last complete opponent turn by side, including held turns and a final pass. */
export function lastReplySteps(game: Game, opponent: Color = 1): ReplayStep[] {
  let end = game.history.length;
  while (end && game.history[end - 1].pos.turn !== opponent) end--;
  if (!end || end === game.history.length && game.pos.turn === opponent && game.status === 'playing') return [];
  let start = end;
  while (start && game.history[start - 1].pos.turn === opponent) start--;
  return game.history.slice(start, end).map((h, i) => ({ before: h.pos, move: h.move, after: game.positionAfter(start + i + 1) }));
}
/** Playback owns a token. Cancel restores the current draft before the next input acts. */
export function replayController() {
  let token = 0, stop: (() => void) | undefined;
  return {
    get running() { return !!stop; },
    cancel() { token++; const cancel = stop; stop = undefined; cancel?.(); },
    async play(steps: readonly ReplayStep[], board: Board, rules: GameRules, current: () => boolean, restore: () => void, frame: (pos: Position, step?: ReplayStep) => void): Promise<void> {
      if (stop || !steps.length) return;
      const own = ++token;
      const finish = () => { board.skip(); if (current()) restore(); };
      stop = finish;
      try {
        board.setPosition(steps[0].before, rules);
        for (const step of steps) {
          if (own !== token || !current()) return;
          frame(step.before, step);
          if (!step.move.pass) await board.play(step.move, step.after);
          else board.setPosition(step.after, rules);
          if (own !== token || !current()) return;
          frame(step.after);
        }
      } finally { if (own === token) { stop = undefined; finish(); } }
    },
  };
}

/** One finish control: staged steps undo; otherwise the last opponent turn replays. */
export const undoReplayState = (staged: number, reply: number, blocked = false) => ({
  replay: !staged && !!reply,
  enabled: !blocked && !!(staged || reply),
});
