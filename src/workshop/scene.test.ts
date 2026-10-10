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
/** Sorted, less the why-trace's fields. */
const plain = <T>(l: T[]) => sorted(l.map(x => ({ ...x, by: undefined, byWords: undefined })));

/** The hand scene `id` and the built one, less what ticket 05 adds (hover-only marks and effects) and less the why-trace (why.test.ts). */
function both(id: string, d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'>) {
  const hand = scenes.get(id), got = sceneOf(d, boardOf(hand.pieces), parseSq(hand.pieces.find(p => p.open)!.sq));
  return [{
    marks: plain(got.marks),
    rails: plain(got.rails),
    arches: plain(got.arches),
    effects: plain(got.effects),
  }, {
    marks: sorted(hand.marks.filter(m => !m.on).map(({ sq, k, cond }) => ({ sq, k, cond }))),
    rails: sorted(hand.rails.map(({ from, to, end, style }) => ({ from, to, end, style }))),
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
