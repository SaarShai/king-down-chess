// The scene builder against the hand scenes of the approved mockup
// (docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js). Where the two differ, the engine wins.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { parseSq } from '../rules/engine';
import { PRESETS, presetOf, type PieceDesign, type Rule } from './model';
import { boardOf, examplesOf, sceneOf, type ScenePiece } from './scene';

interface Hand {
  pieces: ScenePiece[];
  marks: { sq: string; k: string; cond?: string; on?: string }[];
  rails: { from: string; to: string; end: string; style?: string }[];
  arches: { from: string; over: string; to: string }[];
  effects: { k: string; on?: string; a?: string; b?: string; from?: string; to?: string }[];
}
const ctx = { window: {} as { KD?: { scenes: { get(id: string): Hand; check(): string[] } } } };
runInNewContext(readFileSync(new URL('../../docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js', import.meta.url), 'utf8'), ctx);
const scenes = ctx.window.KD!.scenes;
const sorted = <T>(l: T[]): T[] => [...l].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));

/** The hand scene `id` and the built one, less what later tickets add: refused marks and rails (04), hover-only marks and effects (05). */
function both(id: string, d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'>) {
  const hand = scenes.get(id), got = sceneOf(d, boardOf(hand.pieces), parseSq(hand.pieces.find(p => p.open)!.sq));
  return [{
    marks: sorted(got.marks),
    rails: sorted(got.rails.filter(r => r.end !== 'none')),
    arches: sorted(got.arches),
    effects: sorted(got.effects),
  }, {
    marks: sorted(hand.marks.filter(m => !m.k.startsWith('blocked') && !m.on).map(({ sq, k, cond }) => ({ sq, k, cond }))),
    rails: sorted(hand.rails.filter(r => r.end !== 'blocked').map(({ from, to, end, style }) => ({ from, to, end, style }))),
    arches: sorted(hand.arches.map(({ from, over, to }) => ({ from, over, to }))),
    effects: sorted(hand.effects.filter(e => (e.k === 'swap' || e.k === 'push') && !e.on).map(({ k, a, b, from, to }) => ({ k, a, b, from, to }))),
  }];
}

describe('the scene builder', () => {
  it('reads hand scenes that pass their own check', () => {
    expect(scenes.check()).toEqual([]);
  });

  it('gives each pool piece its example board, and any other design d4 alone', () => {
    for (const p of PRESETS) {
      const want = scenes.get(p.key).pieces.map(({ sq, k, side, open }) => (open ? { sq, k: 'design', side, open } : { sq, k, side }));
      expect(examplesOf({ from: [p.key] }), p.key).toEqual(want);
    }
    for (const from of [[], ['pawn', 'rook'], ['toString']]) expect(examplesOf({ from })).toEqual([{ sq: 'd4', k: 'design', side: 'w', open: true }]);
  });

  for (const id of ['paladin', 'pawn', 'pawn-e2', 'archer', 'archer-alone', 'beast', 'maester', 'ogre', 'guard', 'rook', 'knight', 'bishop', 'rook-alone', 'queen']) {
    it(`draws the ${id} scene from the engine`, () => {
      const [got, want] = both(id, presetOf(id.split('-')[0]));
      expect(got).toEqual(want);
    });
  }

  it('draws the asleep and awake marks and rails of My Pawn, and of My Pawn that moves like a queen on a center square', () => {
    const pawn = presetOf('pawn');
    const mine = { ...pawn, squares: [{ x: 0, y: 1, mark: 'move' as const }, { x: -1, y: 1, mark: 'both' as const }, { x: 1, y: 1, mark: 'both' as const }] };
    const queen: Rule = { when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } };
    const cases: [string, Pick<PieceDesign, 'squares' | 'lines' | 'rules'>][] = [['mypawn', mine], ['mypawn-queen', { ...mine, rules: [pawn.rules[0], queen, pawn.rules[1]] }]];
    for (const [id, d] of cases) {
      const [got, want] = both(id, d);
      expect(got, id).toEqual(want);
    }
  });
});
