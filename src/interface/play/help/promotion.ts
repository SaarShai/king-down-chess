import type { Move, PieceType } from '../../../rules/engine';
import { pieces } from '../texts';

/** Give the legal moves for one pawn and one target square. Keep the engine's order and move objects. */
export function promotionChoices(moves: readonly Move[]): { move: Move; type: PieceType; name: string }[] {
  return moves.flatMap(move => move.promo == null ? [] : [{ move, type: move.promo, name: pieces[move.promo].name }]);
}
