import { A, G, K, M, O, S, file, rank, sq, typeOf, type Move, type Position } from './rules/engine';

/** The six tricks from the Menu demo. Art paths start at the app's public root. */
export const TRICKS = [
  { id: 'chain', art: 'ui/pieces/beast-w.webp', seal: 'beast', name: 'Bite chain', found: 'Your beast bit twice in one turn.', riddle: 'One piece can bite, then bite again.' },
  { id: 'shot-over', art: 'ui/pieces/archer-w.webp', seal: 'archer', name: 'Shot over a piece', found: 'Your archer shot over a piece.', riddle: 'One piece in the way cannot stop her shot.' },
  { id: 'shove-guard', art: 'ui/pieces/ogre-w.webp', seal: 'ogre', name: 'Shove a guard', found: 'Your ogre shoved a guard.', riddle: 'A guard stands firm. Which piece can shove it?' },
  { id: 'far-swap', art: 'ui/pieces/maester-w.webp', seal: 'maester', name: 'Far swap', found: 'Your maester and king swapped from a distance.', riddle: 'Two friends on the first rank swap from a distance. Which two?' },
  { id: 'king-guard', art: 'ui/pieces/guard-w.webp', seal: 'king', name: 'A king takes a guard', found: 'Your king took a guard.', riddle: 'A guard fears only one piece.' },
  { id: 'second-life', art: 'ui/kings/stratus.webp', seal: 'pawn', name: 'A second life', found: 'Your pawn brought back a fallen friend.', riddle: 'A pawn brings back a fallen friend. Which king helps?' },
] as const;

export type TrickId = typeof TRICKS[number]['id'];

/** Reads a legal move and its position before the move. */
export function trickOf(pre: Position, move: Move): TrickId | null {
  if (typeOf(pre.board[move.from]) === S && move.captures.length >= 2) return 'chain';
  if (typeOf(pre.board[move.from]) === A && move.to === move.from && move.captures.length === 1) {
    const target = move.captures[0];
    const dx = file(target) - file(move.from), dy = rank(target) - rank(move.from);
    if (Math.max(Math.abs(dx), Math.abs(dy)) === 2 && dx % 2 === 0 && dy % 2 === 0
      && pre.board[sq(file(move.from) + dx / 2, rank(move.from) + dy / 2)]) return 'shot-over';
  }
  if (typeOf(pre.board[move.from]) === O && move.shove && typeOf(pre.board[move.shove.from]) === G) return 'shove-guard';
  if (typeOf(pre.board[move.from]) === M && move.swap && typeOf(pre.board[move.to]) === K
    && Math.max(Math.abs(file(move.to) - file(move.from)), Math.abs(rank(move.to) - rank(move.from))) > 1) return 'far-swap';
  if (typeOf(pre.board[move.from]) === K && move.captures.some(s => typeOf(pre.board[s]) === G)) return 'king-guard';
  if (move.power === 'sacrifice') return 'second-life';
  return null;
}
