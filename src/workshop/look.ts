/**
 * `lookOf(design)`: what the card and the motion read of the stage (revision 3 §5.1, §5.4): the
 * figure, the army, the body and the ghost of a "moves like" or "becomes" rule. art.ts draws the
 * figure; motion.ts reads the body for the gait and the ghost for the gold ring.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { selectedFigure, figureById } from './figures';
import type { Body, PieceDesign } from './model';
import { autoBody } from './judge';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules' | 'look' | 'letter'>;
export interface StageLook { figure: string; body: Body | 'token'; army: 0 | 1; ghost: Body | 'K' | null }
const LIKE_BODY: Record<string, Body | 'K'> = { king: 'K', knight: 'N', bishop: 'B', rook: 'R', queen: 'Q' };
const INTO_BODY: Record<string, Body> = { choice: 'Q', Q: 'Q', R: 'R', B: 'B', N: 'N', A: 'A' };

export function lookOf(d: D): StageLook {
  const rule = <A extends string>(a: A) => d.rules.find(r => r.does.a === a);
  const like = rule('movesLike'), bec = rule('becomes');
  return {
    figure: selectedFigure(d).id, body: d.look.auto ? autoBody(d) : d.look.body, army: d.look.army,
    ghost: like?.does.a === 'movesLike' ? LIKE_BODY[like.does.as] : bec?.does.a === 'becomes' ? INTO_BODY[bec.does.into] : null,
  };
}
/** "Knight look, ivory." The start of the stage's hidden summary: only what the card shows. */
export const lookWords = (l: StageLook): string =>
  `${figureById(l.figure)?.name ?? 'Piece'} look, ${l.army ? 'charcoal' : 'ivory'}.`;
