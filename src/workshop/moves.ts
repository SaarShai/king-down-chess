/**
 * The moves of a Workshop design on a board (revision 3 §8.1): what Try with shows. The one move interpreter is the
 * engine's `genDesigned` (src/rules/design.ts, ticket 16); this module gives it the Workshop's design and Try state.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { type Move, type PieceType } from '../rules/engine';
import { genDesigned, patternOf as pattern, type Refused, type TryState } from '../rules/design';
import { BODIES, specOf, type Body, type PieceDesign } from './model';
import { BODY } from './vocab';

export { holds, step, type Can, type Refused, type TryState } from '../rules/design';
type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
export const START: TryState = { move: 1, captured: false, card: false };
export const BODY_TYPE = Object.fromEntries(BODIES.map(b => [b, BODY[b].type])) as Record<Body, PieceType>;
/** The union of the piece's own squares and lines and its "moves like" piece's, while that When holds. */
export const patternOf = (d: D, board: Uint8Array, from: number, st: TryState) => pattern(specOf(d), board, from, st);

/** Pseudo-legal moves of design `d` for the piece on `from` (its colour is the board's), as engine `Move`s. `refused` gets the refused targets. */
export function movesOf(d: D, board: Uint8Array, from: number, st: TryState = START, refused?: Refused[]): Move[] {
  const out: Move[] = [];
  genDesigned(board, from, 'all', out, specOf(d), refused, st);
  return out;
}
