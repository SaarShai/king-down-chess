import type { GameRules } from '../../game-rules';
import type { Move, Position } from '../../rules/engine';
import type { MoveOverlay } from './move-overlay';

/** Special moves that keep their real walk or attack: castling, en passant, always-on powers. */
export function specialOverlay(_context: GameRules, _before: Position, _move: Move): MoveOverlay | null {
  return null;
}
