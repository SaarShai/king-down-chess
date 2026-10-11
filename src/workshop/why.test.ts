// The why-trace and the Why tag's words against the hand scenes of the approved mockup
// (docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js), loaded as in scene.test.ts.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { parseSq, sqName } from '../rules/engine';
import { drawString } from './marks';
import { presetOf, type PieceDesign, type Rule } from './model';
import { boardOf, diffOf, sceneOf, type ScenePiece } from './scene';
import { traceOf, whyWords } from './why';

interface Hand {
  pieces: ScenePiece[];
  marks: { sq: string; k: string; by?: number[]; byWords?: string }[];
  knots?: { a: number; b: number; type: string; words: string }[];
  why?: Record<string, { count: number; occupant: string; icon?: string; side?: string; foot?: string;
    sum: { base: { rail?: string }; imps: { a: string }[]; result: { k: string; cond?: string; tag?: { a: string } }; captions: string[] } }>;
}
const ctx = { window: {} as { KD?: { scenes: { get(id: string): Hand } } } };
runInNewContext(readFileSync(new URL('../../docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js', import.meta.url), 'utf8'), ctx);
const scenes = ctx.window.KD!.scenes;

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
const beast = presetOf('beast'), removed = (what: 'piece' | 'any'): Rule => ({ when: { on: 'takes' }, does: { a: 'removedAfter', what } });
/** The designs of the hand scenes: a pool piece, or My Beast (the Beast, removed too after a piece or after anything). */
const DESIGNS: Record<string, D> = {
  paladin: presetOf('paladin'), beast, ogre: presetOf('ogre'), pawn: presetOf('pawn'),
  mybeast: { ...beast, rules: [...beast.rules, removed('piece')] }, 'mybeast-any': { ...beast, rules: [...beast.rules, removed('any')] },
};
/** The hand scene `id` and the trace of its design on its board. */
function both(id: string) {
  const hand = scenes.get(id);
  return { hand, trace: traceOf(DESIGNS[id], boardOf(hand.pieces), parseSq(hand.pieces.find(p => p.open)!.sq)) };
}

describe('the why-trace', () => {
  it('refuses the blocked marks of the scenes (G22), with the rule and its words', () => {
    for (const id of ['paladin', 'beast', 'ogre']) {
      const { hand, trace } = both(id);
      const got = trace.refused.map(r => ({ sq: sqName(r.sq), by: r.rule === undefined ? undefined : [r.rule], byWords: r.words }));
      const want = hand.marks.filter(m => m.k === 'blocked').map(({ sq, by, byWords }) => ({ sq, by, byWords }));
      expect(got, id).toEqual(want);
    }
  });

  it('gives each mark of the Paladin, Beast and My Beast scenes the rules of its `by`', () => {
    for (const id of ['paladin', 'beast', 'mybeast', 'mybeast-any']) {
      const { hand, trace } = both(id);
      for (const m of hand.marks) expect(trace.by.get(parseSq(m.sq))?.map(x => x.i), `${id} ${m.sq}`).toEqual(m.by);
    }
  });

  it('ties two rules with the knots of the scenes: gold on the Paladin and My Beast, cracked on My Beast removed after anything', () => {
    for (const id of ['paladin', 'mybeast', 'mybeast-any']) {
      const { hand, trace } = both(id);
      expect(trace.knots, id).toEqual(hand.knots!.filter(k => k.type !== 'unknown'));
    }
    expect(both('paladin').trace.knots).toEqual([{ a: 0, b: 2, type: 'gold', words: 'Both shape d7.' }]);
    expect(both('mybeast-any').trace.knots).toEqual([{ a: 0, b: 1, type: 'cracked', words: 'Removed too stops Takes again.' }]);
  });

  it('ties no knot for two rules that never meet (the Pawn: step 2 and becomes)', () => {
    expect(DESIGNS.pawn.rules.map(r => r.does.a)).toEqual(['step2', 'becomes']);
    expect(both('pawn').trace.knots).toEqual([]);
  });

  it('marks the sign: the Paladin\'s lines pass (+) on d6, "cannot take" refuses (-) g7, "removed too" changes (~) d7', () => {
    const { trace } = both('paladin'), at = (q: string) => trace.by.get(parseSq(q));
    expect([at('d6'), at('g7'), at('d7')]).toEqual([[{ i: 0, sign: '+' }], [{ i: 1, sign: '-' }], [{ i: 0, sign: '+' }, { i: 2, sign: '~' }]]);
  });

  it('keys each square by its whole click path: "its lines pass" shapes f6, the end of the path f4-f6', () => {
    const d: D = { squares: [], lines: ['n', 'e'], rules: [{ when: { on: 'always' }, does: { a: 'linesPass', over: 'own' } }, { when: { on: 'takes' }, does: { a: 'chain' } }] };
    const board = boardOf([{ sq: 'd4', k: 'design', side: 'w', open: true }, { sq: 'e4', k: 'pawn', side: 'w' }, ...['d6', 'f4', 'f6'].map(sq => ({ sq, k: 'pawn', side: 'b' as const }))]);
    expect(traceOf(d, board, parseSq('d4')).by.get(parseSq('f6'))).toEqual([{ i: 0, sign: '~' }, { i: 1, sign: '+' }]);
  });

  it('keeps each rule that refuses one target: a push and a swap of a friendly king both stamp it, and each isolates it', () => {
    const d: D = { squares: [], lines: [], rules: [{ when: { on: 'always' }, does: { a: 'push', then: 'follow' } }, { when: { on: 'always' }, does: { a: 'swap', with: 'friend' } }] };
    const board = boardOf([{ sq: 'd4', k: 'design', side: 'w', open: true }, { sq: 'e4', k: 'king', side: 'w' }]), sc = sceneOf(d, board, parseSq('d4'));
    expect(traceOf(d, board, parseSq('d4')).refused.map(r => `${sqName(r.sq)} ${r.why} ${r.rule}`)).toEqual(['e4 swap 1', 'e4 push 0']);
    expect(sc.marks).toEqual([{ sq: 'e4', k: 'blocked-move', by: [0, 1], byWords: 'Swaps: not a king, Pushes: not a king' }]);
    expect(sc.impressions).toEqual([{ sq: 'e4', list: [{ a: 'push', by: 0 }, { a: 'swap', by: 1 }] }]);
    for (const i of [0, 1]) expect(drawString(sc, { s: 64, art: () => '', focus: by => by.includes(i) }), `rule ${i}`).toContain('<g class="kdm-iso" data-sq="e4"');
  });

  it('gives the painted square or line under each square', () => {
    const { trace } = both('paladin');
    expect(['d5', 'd6', 'e5', 'g7'].map(q => trace.base.get(parseSq(q)))).toEqual(['n', 'n', 'ne', 'ne']);
  });
});

describe('the Why tag words', () => {
  /** The Why tag of square `q` on the board of hand scene `id`. */
  const why = (id: string, q: string) => {
    const hand = scenes.get(id), board = boardOf(hand.pieces), from = parseSq(hand.pieces.find(p => p.open)!.sq), d = DESIGNS[id];
    return whyWords(d, sceneOf(d, board, from), traceOf(d, board, from), q);
  };

  it('sums the Paladin\'s d7 (the line, + its lines pass and removed too, = a take that leaves) and g7 (refused)', () => {
    expect(why('paladin', 'd7')).toMatchObject({ occupant: 'Black knight', piece: { k: 'knight', side: 'b' }, count: 3, foot: 'On b6 it takes a pawn and stays.',
      sum: { base: 'move', rail: 'n', stamps: ['linesPass', 'removedAfter'], result: 'take', tags: ['removedAfter'], captions: ['line', 'lines pass', 'removed too', 'takes, then leaves'] } });
    expect(why('paladin', 'g7')).toEqual({ occupant: 'Black king', piece: { sq: 'g7', k: 'king', side: 'b' }, count: 2,
      sum: { base: 'move', rail: 'ne', stamps: ['cannotTake'], result: 'blocked', cond: undefined, tags: [], captions: ['line', "can't take a king", 'refused'] } });
  });

  it('sums the Beast\'s e5, the first take of a chain, with its next take and the refused king; f6 names the take before it', () => {
    expect(why('beast', 'e5')).toMatchObject({ occupant: 'Black pawn', count: 2, foot: 'Then it may take f6. Never the king on g7.',
      sum: { base: 'both', stamps: ['chain'], result: 'both', tags: ['chain'], captions: ['move or take', 'takes again', 'then f6'] } });
    expect(why('beast', 'f6')).toMatchObject({ occupant: 'Black knight', count: 2, foot: 'It takes e5 first.',
      sum: { base: 'empty', stamps: ['chain'], result: 'take', captions: ['not painted', 'takes again', 'takes'] } });
  });

  it('takes nothing on a mark of the paint diff that is gone: a Beast copy with no northeast square, a Paladin copy with no northwest line', () => {
    const tag = (base: D, d: D, id: string, q: string) => {
      const board = boardOf(scenes.get(id).pieces), from = parseSq('d4');
      return whyWords(d, diffOf(d, base, board, from), traceOf(d, board, from), q);
    };
    const { paladin } = DESIGNS;
    expect(tag(beast, { ...beast, squares: beast.squares.filter(s => s.x !== 1 || s.y !== 1) }, 'beast', 'f6'))
      .toEqual({ occupant: 'Black knight', piece: { sq: 'f6', k: 'knight', side: 'b' }, count: 0, solo: 'Out of reach.' });
    expect(tag(paladin, { ...paladin, lines: paladin.lines.filter(l => l !== 'nw') }, 'paladin', 'd7').foot).toBeUndefined();
  });

  it('says why a square has no mark: the piece itself, its own piece, out of reach', () => {
    expect([why('beast', 'd4'), why('beast', 'c3'), why('beast', 'a8')].map(w => [w.occupant, w.count, w.solo, w.sum])).toEqual([
      ['Beast', 0, 'It stands here.', undefined], ['White pawn', 0, 'Its own piece.', undefined], ['Empty', 0, 'Out of reach.', undefined]]);
  });

  it('says what a swap and a push do to the piece on the square', () => {
    expect(why('ogre', 'd5').foot).toBe('It may push the pawn to d6.');
    const hand = scenes.get('maester'), board = boardOf(hand.pieces), d = presetOf('maester');
    expect(whyWords(d, sceneOf(d, board, parseSq('d4')), traceOf(d, board, parseSq('d4')), 'e4')).toMatchObject({ occupant: 'White rook', solo: 'Its own piece.', foot: 'It may swap places with the rook.' });
  });

  it('agrees with the why of the hand scenes: the occupant, its icon, the count, the stamps, the line, the mark now, the note and the captions', () => {
    // The rule captions are the seal labels (ticket 05), so only their number and the last caption, the mark now, are the mockup's.
    for (const id of ['paladin', 'pawn']) {
      for (const [q, w] of Object.entries(scenes.get(id).why!)) {
        const got = why(id, q), sum = got.sum!;
        expect({ occupant: got.occupant, icon: got.piece?.k, side: got.piece?.side, count: got.count, stamps: sum.stamps, rail: sum.rail, now: sum.cond ?? sum.result,
          tag: sum.tags[0], foot: got.foot, captions: sum.captions.length, last: sum.captions.at(-1) }, `${id} ${q}`).toEqual({
          occupant: w.occupant, icon: w.icon, side: w.side, count: w.count, stamps: w.sum.imps.map(i => i.a), rail: w.sum.base.rail, now: w.sum.result.cond ?? w.sum.result.k,
          tag: w.sum.result.tag?.a, foot: w.foot, captions: w.sum.captions.length, last: w.sum.captions.at(-1) });
      }
    }
  });
});
