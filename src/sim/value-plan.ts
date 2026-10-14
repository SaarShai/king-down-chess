import { CLASSIC_CHESS } from '../rules/setup';
import type { RunSpec } from './spec-plan';
export const FAIRY = 'ALGMS';
/** `RNBQKBNR` with the first `vs` piece replaced by the fairy letter. */
export const swapRank = (fairy: string, vs = 'N'): string => CLASSIC_CHESS.replace(vs, fairy);

/**
 * Pawn odds on file `f` (0 = a). One config per file, because a single file is not "a pawn": the
 * h-pawn measured only -17 Elo at depth 3 in the first run, since taking it off opens the rook's
 * file and pays most of the material back. The calibration cycles over all eight files and the
 * arm pools them, which is the average pawn we actually want.
 */
function pawnOdds(f: number): { white: string; black: string; fen: string; fenSwapped: string } {
  const gapped = `${'P'.repeat(f)}1${'P'.repeat(7 - f)}`;
  return {
    white: CLASSIC_CHESS, black: CLASSIC_CHESS,
    fen: `${CLASSIC_CHESS.toLowerCase()}/pppppppp/8/8/8/8/${gapped}/${CLASSIC_CHESS} w - - 0 1`,
    fenSwapped: `${CLASSIC_CHESS.toLowerCase()}/${gapped.toLowerCase()}/8/8/8/8/PPPPPPPP/${CLASSIC_CHESS} w - - 0 1`,
  };
}

/**
 * One arm per fairy piece (it replaces a knight on one side only) plus a pawn-odds calibration
 * arm. The calibration turns Elo into pawns, which is the only way to state an implied value
 * without a guessed conversion constant.
 */
export function valueSpecs(base: RunSpec, vs = 'N', pieces = FAIRY, calibrate = true): RunSpec[] {
  const arms = [...pieces].map(letter => ({
    id: `${base.id}.${letter}`,
    asymmetric: [{ white: swapRank(letter, vs), black: CLASSIC_CHESS }],
  }));
  return [
    ...arms,
    ...(calibrate ? [{ id: `${base.id}.pawn`, asymmetric: Array.from({ length: 8 }, (_, f) => pawnOdds(f)) }] : []),
  ].map(a => ({
    ...base, ...a, pairs: true,
    // The calibration is the denominator of every implied value, so it gets three times the games.
    games: a.id.endsWith('.pawn') ? base.games * 3 : base.games,
  }));
}

