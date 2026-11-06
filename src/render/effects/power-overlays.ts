import type { GameRules } from '../../game-rules';
import type { Move, Position } from '../../rules/engine';
import type { MoveOverlay } from './move-overlay';

/** King powers and cards that keep the real walk: Strike, Haste, March. */
export function powerOverlay(_context: GameRules, _before: Position, _move: Move): MoveOverlay | null {
  return null;
}
