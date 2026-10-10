// The scene builder against the hand scenes of the approved mockup
// (docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js). Where the two differ, the engine wins.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { parseSq } from '../rules/engine';
import { PRESETS, presetOf, type PieceDesign, type Rule } from './model';
import { boardOf, diffOf, examplesOf, sceneOf, type ScenePiece } from './scene';

interface Hand {
  pieces: ScenePiece[];
  marks: { sq: string; k: string; cond?: string; on?: string }[];
  rails: { from: string; to: string; end: string; style?: string }[];
  arches: { from: string; over: string; to: string }[];
  effects: { k: string; on?: string; a?: string; b?: string; from?: string; to?: string; sq?: string; n?: number }[];
}
const ctx = { window: {} as { KD?: { scenes: { get(id: string): Hand; check(): string[] } } } };
runInNewContext(readFileSync(new URL('../../docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js', import.meta.url), 'utf8'), ctx);
const scenes = ctx.window.KD!.scenes;
const sorted = <T>(l: T[]): T[] => [...l].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
/** Sorted, less the why-trace's fields. */
const plain = <T>(l: T[]) => sorted(l.map(x => ({ ...x, by: undefined, byWords: undefined })));

/** The scenes whose hover-only marks and effects (`on`, ticket 05) the test compares: the hand scene of the Archer alone
 *  leaves them out. The effects that the builder draws; the threat and "becomes" effects are those of later tickets. */
const ON = ['beast', 'archer', 'ogre'], DRAWN = ['swap', 'push', 'follow', 'sight', 'hop', 'pip'];
/** The hand scene `id` and the built one, less the why-trace (why.test.ts). */
function both(id: string, d: Pick<PieceDesign, 'squares' | 'lines' | 'rules'>) {
  const hand = scenes.get(id), got = sceneOf(d, boardOf(hand.pieces), parseSq(hand.pieces.find(p => p.open)!.sq)), keep = (x: { on?: string }) => ON.includes(id) || !x.on;
  return [{
    marks: plain(got.marks.filter(keep)),
    rails: plain(got.rails),
    arches: plain(got.arches),
    effects: plain(got.effects.filter(keep)),
  }, {
    marks: sorted(hand.marks.filter(keep).map(({ sq, k, cond, on }) => ({ sq, k, cond, on }))),
    rails: sorted(hand.rails.map(({ from, to, end, style }) => ({ from, to, end, style }))),
    arches: sorted(hand.arches.map(({ from, over, to }) => ({ from, over, to }))),
    effects: sorted(hand.effects.filter(e => DRAWN.includes(e.k) && keep(e)).map(({ k, a, b, from, to, sq, n, on }) => ({ k, a, b, from, to, sq, n, on }))),
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

  it('marks the paint diff of a copy: new or changed marks, and the marks of its pool piece that are gone', () => {
    const pawn = presetOf('pawn'), board = boardOf(examplesOf({ from: ['pawn'] })), d4 = parseSq('d4');
    const diff = (squares: PieceDesign['squares'], lines: PieceDesign['lines'] = []) =>
      diffOf({ ...pawn, squares, lines }, pawn, board, d4).marks.filter(m => m.diff).map(m => `${m.sq} ${m.k} ${m.diff}`).sort();
    expect(diff(pawn.squares)).toEqual([]);
    // My Pawn (proving-ground.html, the painted state): Both on c5 and e5.
    expect(diff([{ x: 0, y: 1, mark: 'move' }, { x: -1, y: 1, mark: 'both' }, { x: 1, y: 1, mark: 'both' }])).toEqual(['c5 both +', 'e5 both +']);
    expect(diff(pawn.squares.filter(s => s.x !== -1))).toEqual(['c5 take -']);
    // A line ahead: d6 was asleep (step 2) and is a plain move now; d7 and d8 are new.
    expect(diff(pawn.squares, ['n'])).toEqual(['d6 move +', 'd7 move +', 'd8 move +']);
  });
});

