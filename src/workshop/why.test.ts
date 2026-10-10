// The why-trace against the hand scenes of the approved mockup
// (docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js), loaded as in scene.test.ts.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { parseSq, sqName } from '../rules/engine';
import { drawString } from './marks';
import { presetOf, type PieceDesign, type Rule } from './model';
import { boardOf, sceneOf, type ScenePiece } from './scene';
import { traceOf } from './why';

interface Hand {
  pieces: ScenePiece[];
  marks: { sq: string; k: string; by?: number[]; byWords?: string }[];
  knots?: { a: number; b: number; type: string; words: string }[];
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
