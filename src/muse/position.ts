/** A game view's position for the connector's words: the game's fixed rules, its FEN, and each legal LAN with its move. */
import { GameRules } from '../game-rules';
import type { PublicMatchRules } from '../match';
import type { Move, Position } from '../rules/engine';

export interface Board { context: GameRules; pos: Position; moves: { lan: string; move: Move }[] }

/** `legal` is the view's list (empty when it is not your turn); a LAN that the rules do not make is dropped. */
export function board(rules: PublicMatchRules, fen: string, legal: readonly string[] = []): Board {
  const context = new GameRules(rules), pos = context.fromFen(fen), wanted = new Set(legal);
  const moves = context.legalMoves(pos).map(move => ({ lan: context.toLan(pos, move), move })).filter(m => wanted.has(m.lan));
  return { context, pos, moves };
}
