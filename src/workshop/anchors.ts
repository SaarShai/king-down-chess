/**
 * The measured designs (revision 3 §6.7). A design whose canonical form equals one gets a
 * note ("Measured in computer games: 4.27 ± 0.29.") and its label from the measurement. The number
 * the player sees is always the formula, so these never change the worth.
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { KING_STEP, keyOf, presetOf, type PieceDesign, type Rule, type Square } from './model';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
export interface Anchor { name: string; value: number; pm: number; source: string; under?: boolean }

const lr = (offs: [number, number][], mark: Square['mark']): Square[] =>
  offs.flatMap(([x, y]) => (x ? [{ x, y, mark }, { x: -x, y, mark }] : [{ x, y, mark }]));
/** Today's archer steps (straight: move; diagonal: move or shoot) with a set of shots. */
const archer = (shots: [number, number][]): D => ({
  squares: [...lr([[0, 1], [0, -1], [1, 0]], 'move'), ...lr([[1, 1], [1, -1]], 'moveShoot'), ...lr(shots, 'shoot')], lines: [], rules: [],
});
const chain: Rule = { when: { on: 'takes' }, does: { a: 'chain' } };
const p = (key: string): D => presetOf(key);
const PV2 = 'docs/research/piece-runs-2026-10-04-pv2-d3.md';

/** Era A first (pv2-d3), then the era A lab readings, then era B (2026-09-17). */
const TABLE: [string, D, number, number, string, boolean?][] = [
  ['Pawn', p('pawn'), 1.0, 0, 'the unit'],
  ['Knight', p('knight'), 3.16, 0, 'src/ai/eval.ts:60 (the Texel price)'],
  ['Bishop', p('bishop'), 3.17, 0.27, `${PV2}:32`],
  ['Rook', p('rook'), 3.84, 0.27, `${PV2}:31`],
  ['Queen', p('queen'), 9.33, 0, 'src/ai/eval.ts:60'],
  ['Ogre', p('ogre'), 2.6, 0.28, `${PV2}:30`],
  ['Beast', p('beast'), 4.27, 0.29, `${PV2}:35`],
  ['Guard', p('guard'), 1.66, 0, `${PV2}:33`, true],
  ['Archer', p('archer'), 4.29, 0.35, 'docs/research/piece-runs-2026-10-04-pv2-A-vsR-d3.md:24; claude/archer-reach'],
  ['Archer far2', { squares: [...KING_STEP('move'), ...lr([[0, 2], [2, 0], [0, -2], [2, 2]], 'shoot')], lines: [], rules: [] }, 2.83, 0.28, 'pv-A-af2'],
  ['Archer fwd2NoSide', archer([[0, 2], [0, -2], [2, 2]]), 3.99, 0.28, 'claude/archer-reach'],
  ['Archer fwd2NoBack', archer([[0, 2], [2, 0], [2, 2]]), 4.34, 0.28, 'claude/archer-reach'],
  ['Archer classic', archer([[0, 2], [2, 0], [0, -2]]), 3.73, 0.42, 'era B'],
  ['Paladin', p('paladin'), 4.08, 0.45, 'era B'],
  ['Templar', { squares: KING_STEP('both'), lines: [], rules: [{ when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } }] }, 2.15, 0.53, 'era B'],
  ['Beast, 7 neighbours', { squares: KING_STEP('both').map(s => (s.x === 0 && s.y === 1 ? { ...s, mark: 'move' as const } : s)), lines: [], rules: [chain] }, 3.77, 0.43, 'era B'],
  ['Beast, diagonals', { squares: [...lr([[0, 1], [0, -1], [1, 0]], 'move'), ...lr([[1, 1], [1, -1]], 'both')], lines: [], rules: [chain] }, 1.81, 0.42, 'era B'],
];

const BY_KEY = new Map<string, Anchor>(TABLE.map(([name, d, value, pm, source, under]) => [keyOf(d), { name, value, pm, source, under }]));
export const ANCHOR_DESIGNS: readonly { name: string; design: D }[] = TABLE.map(([name, design]) => ({ name, design }));
export const anchorOf = (d: D): Anchor | undefined => BY_KEY.get(keyOf(d));
/** "Measured in computer games: 4.27 ± 0.29." */
export const anchorNote = (a: Anchor): string =>
  `Measured in computer games: ${a.under ? 'under 1.7' : a.value.toFixed(2)}${a.pm ? ` ± ${a.pm.toFixed(2)}` : ''}.`;
/** The Maester preset is not an anchor: the measured piece has the long swap with the king. */
export const MAESTER_NOTE = 'Measured with the long swap: 3.28 ± 0.27.';
