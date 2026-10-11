// The scene builder against the hand scenes of the approved mockup
// (docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js). Where the two differ, the engine wins.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { BLACK, WHITE, colorOf, file, makeMove, parseSq, rank, sqName } from '../rules/engine';
import { DIRS, PRESETS, presetOf, type PieceDesign, type Rule } from './model';
import { movesOf } from './moves';
import { boardOf, diffOf, examplesOf, sceneOf, stir, threatsOf, wakeSquare, type ScenePiece } from './scene';

interface Hand {
  pieces: ScenePiece[];
  marks: { sq: string; k: string; cond?: string; on?: string }[];
  rails: { from: string; to: string; end: string; style?: string }[];
  arches: { from: string; over: string; to: string }[];
  effects: { k: string; on?: string; a?: string; b?: string; from?: string; to?: string; sq?: string; n?: number; stopped?: true; by?: (number | string)[] }[];
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

  it('draws the asleep and awake marks and rails of My Pawn, and of My Pawn that moves like a queen on a center square, on d4, b4 and e2', () => {
    const pawn = presetOf('pawn');
    const mine = { ...pawn, squares: [{ x: 0, y: 1, mark: 'move' as const }, { x: -1, y: 1, mark: 'both' as const }, { x: 1, y: 1, mark: 'both' as const }] };
    const queen: Rule = { when: { on: 'zone', zone: 'capital' }, does: { a: 'movesLike', as: 'queen' } };
    const mq = { ...mine, rules: [pawn.rules[0], queen, pawn.rules[1]] };
    // On b4 and e2 (ticket 06) the queen lines sleep: faint rails to the edge, with no asleep marks on their squares.
    const cases: [string, Pick<PieceDesign, 'squares' | 'lines' | 'rules'>][] = [['mypawn', mine], ['mypawn-queen', mq], ['mypawn-queen-b4', mq], ['mypawn-queen-e2', mq]];
    for (const [id, d] of cases) {
      const [got, want] = both(id, d);
      expect(got, id).toEqual(want);
    }
  });

  it('takes the pip and the hop of each next take from one route, when a chain has more routes to it', () => {
    // The Archer with no shot squares, all eight lines and "takes again": from e5 it takes f6, f4 and d6 at once, and d2 after f4.
    const archer = presetOf('archer'), d = { squares: archer.squares.filter(s => s.mark === 'move'), lines: [...DIRS], rules: [{ when: { on: 'takes' as const }, does: { a: 'chain' as const } }] };
    const fx = sceneOf(d, boardOf(examplesOf({ from: ['archer'] })), parseSq('d4')).effects.filter(e => e.on === 'e5');
    const n = new Map(fx.flatMap(e => (e.k === 'pip' ? [[e.sq, e.n]] : [])));
    const hops = fx.flatMap(e => (e.k === 'hop' ? [[e.from, e.to]] : []));
    expect(hops).toEqual([['e5', 'f6'], ['f6', 'f4'], ['f4', 'd2'], ['d2', 'd6']]);
    for (const [from, to] of hops) expect(n.get(to), `${from}-${to}`).toBe((n.get(from) ?? 1) + 1);
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

describe('Try with (ticket 06)', () => {
  const d4 = parseSq('d4'), blacks = (b: Uint8Array): number[] => [...b.keys()].filter(s => b[s] && colorOf(b[s]) === BLACK);

  it('stirs new enemies onto free squares: the piece and its friends stay, and no enemy stands next to the piece', () => {
    const board = boardOf(scenes.get('guard').pieces);
    let seed = 7;
    const rnd = (): number => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 20; i++) {
      const b = stir(board, d4, rnd);
      expect([b[d4], b[parseSq('d3')]]).toEqual([board[d4], board[parseSq('d3')]]);
      expect(blacks(b)).toHaveLength(6);
      for (const s of blacks(b)) expect(Math.max(Math.abs(file(s) - 3), Math.abs(rank(s) - 3)), sqName(s)).toBeGreaterThan(1);
    }
    // With no random source the enemies stand on the first board of Try it.
    expect(blacks(stir(board, d4)).map(sqName).sort()).toEqual(['b5', 'd6', 'f5', 'f7', 'g4', 'h8']);
  });

  it('stops the pawn threat on the Guard with its rule, as the guard hand scene does', () => {
    const hand = scenes.get('guard'), board = boardOf(hand.pieces), guard = presetOf('guard');
    expect(threatsOf(guard, board, d4)).toEqual(hand.effects.map(({ k, from, to, stopped, by }) => ({ k, from, to, stopped, by })));
    expect(threatsOf({ ...guard, rules: [] }, board, d4)).toEqual([{ k: 'threat', from: 'e5', to: 'd4' }]);
  });

  it('plays Move here with the engine: the Paladin takes d7, and both pieces go (selfRemove)', () => {
    const board = boardOf(examplesOf({ from: ['paladin'] })), d7 = parseSq('d7');
    const m = movesOf(presetOf('paladin'), board, d4).find(x => x.captures[0] === d7)!;
    expect(m.selfRemove).toBe(true);
    const after = makeMove({ board, turn: WHITE, halfmove: 0, ply: 0 }, m).board;
    expect([after[d4], after[d7]]).toEqual([0, 0]);
  });

  it('finds the square that wakes a rule: d2 for the Pawn\'s step 2 from d4, and none for a move number', () => {
    const board = boardOf(examplesOf({ from: ['pawn'] })), step2 = presetOf('pawn').rules[0];
    expect(sqName(wakeSquare(board, d4, step2)!)).toBe('d2');
    expect(wakeSquare(board, d4, { ...step2, when: { on: 'fromMove', n: 5 } })).toBeNull();
  });
});
