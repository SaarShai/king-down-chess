import { describe, expect, it } from 'vitest';
import { NAMES, RULES, parseSq, sqName, type Move, type PieceType } from '../rules/engine';
import { PRESETS, fromPreset } from './model';
import { boardOf, examplesOf, sceneOf, type ScenePiece } from './scene';
import { enginePos, playPower, powerLayer, powerMarks, seated, withRules } from './powers';

const typeOf = (key: string): PieceType => (NAMES as readonly string[]).indexOf(key) as PieceType;
/** A pool piece on board `pieces` (its example board by default), with a seated king. */
function at(key: string, pieces: ScenePiece[] = examplesOf({ from: [key] })) {
  const board = seated(boardOf(pieces)), from = parseSq(pieces[0].sq);
  return { board, from, pos: enginePos(board, from, typeOf(key)) };
}
const squares = (ms: readonly Move[], take: boolean): string => ms.filter(m => (m.captures.length > 0) === take).map(m => sqName(m.captures[0] ?? m.to)).sort().join(' ');
const sorted = (s: string): string => s.split(' ').sort().join(' ');

describe('withRules (ticket 13, decision 32)', () => {
  it('puts RULES back after the preview, also when it throws', () => {
    const before = JSON.stringify(RULES);
    expect(withRules({ kings: [{ king: 'Mud', power: 'Leap' }, null], freezeUses: 5 }, () => RULES.freezeUses)).toBe(5);
    expect(JSON.stringify(RULES)).toBe(before);
    expect(() => withRules({ freezeUses: 7 }, () => { throw new Error('boom'); })).toThrow('boom');
    expect(JSON.stringify(RULES)).toBe(before);
  });
});

describe('powerMarks (ticket 13)', () => {
  it('the Rook with Leap: its marks with the plain marks are the rook-leap list of G22 (scenes.js:367)', () => {
    const { board, from, pos } = at('rook'), leap = powerMarks(pos, from, 'Mud', 'Leap');
    expect(squares(leap, false)).toBe('d3 d4 d5 d6');
    expect(squares(leap, true)).toBe('d7');
    const plain = sceneOf(fromPreset(PRESETS.find(p => p.key === 'rook')!), board, from).marks.filter(m => m.k === 'move').map(m => m.sq);
    expect(sorted([...plain, ...squares(leap, false).split(' ')].join(' '))).toBe(sorted('c1 b1 a1 d3 d4 d5 d6'));
    const layer = powerLayer(leap, board, from, 'mud');
    expect(layer.arches).toEqual([{ from: 'd1', over: 'd2', to: 'd3', power: 'mud' }]);
    expect(layer.marks.filter(m => m.stamp).map(m => m.sq)).toEqual(['d7']);
    expect(layer.rails).toEqual([{ from: 'd2', to: 'd7', end: 'x' }]);
  });
  it('Leap on the Paladin is an echo: it adds nothing', () => {
    const { from, pos } = at('paladin');
    expect(powerMarks(pos, from, 'Mud', 'Leap')).toEqual([]);
  });
  it('Freeze on the frost-power board: each enemy piece but the king; the freeze on c6 leaves a mark there', () => {
    const P = (sq: string, k: string, side: 'w' | 'b' = 'b'): ScenePiece => ({ sq, k, side });
    const { from, pos } = at('paladin', [{ sq: 'd4', k: 'design', side: 'w', open: true }, P('b1', 'king', 'w'), P('c6', 'knight'), P('e5', 'pawn'), P('h8', 'rook'), P('g8', 'king')]);
    const freeze = powerMarks(pos, from, 'Frost', 'Freeze');
    expect(freeze.map(m => sqName(m.to)).sort()).toEqual(['c6', 'e5', 'h8']);
    const next = playPower(pos, freeze.find(m => sqName(m.to) === 'c6')!, 'Frost', 'Freeze');
    expect(next.marks?.[0]?.sq).toBe(parseSq('c6'));
    expect(next.used?.[0]).toBe(1);
  });
});
