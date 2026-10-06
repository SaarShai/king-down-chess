import { describe, expect, it } from 'vitest';
import { ANCHOR_DESIGNS, anchorOf } from './anchors';
import { BAND_WORD, THRESHOLDS, badgeText, judge, memoryOf, worthOf, type Label } from './judge';
import { DIAG, DIRS, KING_STEP, KNIGHT_JUMP, ORTHO, PRESETS, empty, keyOf, limit, presetOf, type Dir, type Mark, type PieceDesign, type Rule, type Square, type When } from './model';
import { BLOCKS, EVENT_WHENS, MORE_WHENS, TOP_WHENS } from './vocab';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
const K8 = KING_STEP('both'), NN = KNIGHT_JUMP(), AL: When = { on: 'always' };
const chain: Rule = { when: { on: 'takes' }, does: { a: 'chain' } };
const d = (squares: Square[], lines: readonly Dir[], ...rules: Rule[]): D => ({ squares, lines: [...lines], rules });
const p = (key: string): D => presetOf(key);
const anchor = (name: string): D => ANCHOR_DESIGNS.find(a => a.name === name)!.design;
const like = (when: When, as: 'knight' | 'bishop' | 'rook' | 'queen'): Rule => ({ when, does: { a: 'movesLike', as } });
const becomes = (when: When, into: 'Q' | 'choice'): Rule => ({ when, does: { a: 'becomes', into } });
const lr = (offs: [number, number][], mark: Mark): Square[] => offs.flatMap(([x, y]) => (x ? [{ x, y, mark }, { x: -x, y, mark }] : [{ x, y, mark }]));
const ring = (offs: [number, number][]): Square[] => {
  const s = new Map<string, Square>();
  for (const [x, y] of offs) for (const [a, b] of [[x, y], [-x, y], [x, -y], [-x, -y], [y, x], [-y, x], [y, -x], [-y, -x]]) s.set(`${a},${b}`, { x: a, y: b, mark: 'shoot' });
  return [...s.values()];
};
const archerSteps = [...lr([[0, 1], [0, -1], [1, 0]], 'move'), ...lr([[1, 1], [1, -1]], 'moveShoot')];
const all48: Square[] = [];
for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) if (x || y) all48.push({ x, y, mark: Math.max(Math.abs(x), Math.abs(y)) === 1 ? 'both' : 'move' });
const zone = (z: 'capital' | 'enemyHalf'): When => ({ on: 'zone', zone: z });

/**
 * §6.13, from the prototype `judge-v2.mjs` (kq5: see docs/WORKSHOP.md §6.2, the largest-worth union).
 * The flags follow the §6.10 rules in full: the table leaves out some F3, F9 and F+ that they give.
 */
const ROWS: [string, D, number, Label, string, string, number][] = [
  // name, design, W, label, metal, flags, memory
  ['knight', p('knight'), 3.28, 'fair', 'silver', '', 0.5],
  ['bishop', p('bishop'), 3.04, 'fair', 'silver', '', 0.5],
  ['rook', p('rook'), 3.96, 'fair', 'gold', '', 0.5],
  ['archer', p('archer'), 4.47, 'fair', 'gold', 'F2 F3 F+', 5],
  ['archer far2', anchor('Archer far2'), 2.89, 'fair', 'bronze', 'F2 F3 F+', 4],
  ['archer noSide', anchor('Archer fwd2NoSide'), 3.65, 'fair', 'gold', 'F2 F3 F+', 5],
  ['archer noBack', anchor('Archer fwd2NoBack'), 4.02, 'fair', 'gold', 'F2 F3 F+', 5],
  ['archer classic', anchor('Archer classic'), 3.84, 'fair', 'gold', 'F2 F3 F+', 3.5],
  ['beast', p('beast'), 4.08, 'fair', 'gold', 'F+', 3],
  ['beast 7', anchor('Beast, 7 neighbours'), 3.65, 'fair', 'gold', 'F+', 6.5],
  ['beast diag', anchor('Beast, diagonals'), 2.38, 'likelyWeak', 'stone', 'F+', 5],
  ['maester', p('maester'), 3.28, 'fair', 'silver', 'F1', 1.5],
  ['ogre', p('ogre'), 2.58, 'fair', 'bronze', '', 1.5],
  ['guard', p('guard'), 0.88, 'likelyWeak', 'stone', 'F1', 2.5],
  ['paladin', p('paladin'), 4.11, 'fair', 'gold', 'F9', 5.5],
  ['templar', anchor('Templar'), 2.74, 'possiblyWeak', 'bronze', 'F7', 2.5],
  ['hungry rider', d(NN, [], chain), 4.48, 'fair', 'gold', 'F+', 3],
  ['rook chain', d([], ORTHO, chain), 5.55, 'possiblyOP', 'cracked', 'F+', 3],
  ['rook chain hop', d([], ORTHO, chain, { when: AL, does: { a: 'linesPass', over: 'own' } }), 5.85, 'possiblyOP', 'cracked', 'F9 F+', 4],
  ['rook no king', d([], ORTHO, chain, { when: AL, does: { a: 'linesPass', over: 'own' } }, { when: AL, does: { a: 'cannotTake', what: 'king' } }), 4.85, 'untestedOP', 'hairline', 'F9 F+', 5.5],
  ['mix knight rook', d(NN, [], like(zone('enemyHalf'), 'rook')), 4.95, 'fair', 'hairline', 'F9', 2.5],
  ['mix knight bishop', d(NN, [], like(zone('enemyHalf'), 'bishop')), 4.36, 'fair', 'gold', 'F9', 2.5],
  ['mix rook knight', d([], ORTHO, like(zone('enemyHalf'), 'knight')), 5.89, 'likelyOP', 'cracked', 'F9', 2.5],
  ['mix bishop beast', d([], DIAG, chain), 4.25, 'fair', 'gold', 'F+', 3],
  ['knight rook lines', d(NN, ORTHO), 10.11, 'likelyOP', 'broken', 'F11', 1],
  ['knight n s lines', d(NN, ['n', 's']), 6.01, 'likelyOP', 'cracked', '', 2],
  ['archer plusDiag2', d([...archerSteps, ...ring([[0, 2], [2, 2]])], []), 5.54, 'likelyOP', 'cracked', 'F2 F3 F+', 4.5],
  ['archer ring2', d([...archerSteps, ...ring([[0, 2], [1, 2], [2, 2]])], []), 10.51, 'likelyOP', 'broken', 'F2 F3 F+', 5.5],
  ['knight beast mix', d([...NN, ...K8], [], chain), 12.22, 'likelyOP', 'broken', 'F2 F11 F+', 5.5],
  ['squire', d(K8, [], like({ on: 'afterFirstCapture' }, 'knight')), 5.66, 'possiblyOP', 'cracked', 'F9 F11', 3],
  ['teleport', d(all48, []), 13.87, 'likelyOP', 'broken', 'F11', 0],
  ['5x5', d(all48.filter(s => Math.max(Math.abs(s.x), Math.abs(s.y)) <= 2), []), 7.49, 'possiblyOP', 'cracked', 'F11', 0],
  ['king queen first take', d(K8, [], becomes({ on: 'firstTake' }, 'Q')), 6.63, 'possiblyOP', 'cracked', 'F9 F12', 2],
  ['king choice last rank', d(K8, [], becomes({ on: 'reaches', zone: 'lastRank' }, 'choice')), 2.91, 'fair', 'bronze', 'F9', 0],
  ['knight queen last rank', d(NN, [], becomes({ on: 'reaches', zone: 'lastRank' }, 'Q')), 5.70, 'possiblyOP', 'cracked', 'F9 F12', 0],
  ['rook queen last rank', d([], ORTHO, becomes({ on: 'reaches', zone: 'lastRank' }, 'Q')), 8.79, 'possiblyOP', 'broken', 'F9 F12', 0],
  ['king queen from 5', d(K8, [], like({ on: 'fromMove', n: 5 }, 'queen')), 9.28, 'likelyOP', 'broken', 'F9 F11', 0],
  ['king queen near king', d(K8, [], like({ on: 'near', who: 'king' }, 'queen')), 5.36, 'possiblyOP', 'cracked', 'F9 F11', 0],
  ['king queen after card', d(K8, [], like({ on: 'afterCard', card: 'any' }, 'queen')), 2.95, 'fair', 'bronze', 'F7 F9', 4],
  ['commoner', d(K8, []), 2.58, 'fair', 'bronze', '', 0],
];

describe('the judge (§6)', () => {
  it('reproduces the §6.2 feature counts to ±0.01', () => {
    const g = (x: D) => judge(x).g;
    const close = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(0.01);
    close(g(p('knight')).Q, 5.25); close(g(p('knight')).Xfar, 5.25);
    close(g(p('bishop')).Q, 3.17); close(g(p('bishop')).Xfar, 5.29);
    close(g(p('rook')).Q, 4.16); close(g(p('rook')).Xfar, 6.93);
    close(g(p('queen')).Q, 7.33); close(g(p('queen')).Xfar, 12.21);
    close(g(p('archer')).Q, 6.56); close(g(p('archer')).Xshot, 7.19);
    close(g(anchor('Archer far2')).Xshot, 4.13);
    close(g(p('beast')).Q, 6.56); close(g(p('beast')).Xstep, 6.56);
  });

  it('takes the union: painted queen lines equal "always moves like a queen"', () => {
    for (const base of [d([], []), d(K8, []), d(NN, [])]) {
      const painted = judge({ ...base, lines: [...DIRS] }).g;
      const ruled = judge({ ...base, rules: [like(AL, 'queen')] }).g;
      for (const k of Object.keys(painted) as (keyof typeof painted)[]) expect(ruled[k]).toBeCloseTo(painted[k], 9);
    }
  });

  it('pins the §6.13 rows: worth, label, metal, flags and memory', () => {
    const got = ROWS.map(([name, x, W, , , , mem]) => {
      const v = judge(x);
      return [name, x, Math.abs(v.worth.point - W) <= 0.005 ? W : +v.worth.point.toFixed(2), v.label, v.metal, v.flags.map(f => f.code).join(' '), mem && memoryOf(x).points];
    });
    expect(got.map(g => g.filter((_, i) => i !== 1))).toEqual(ROWS.map(g => g.filter((_, i) => i !== 1)));
    expect(judge(p('knight')).worth.lo).toBeCloseTo(2.93, 2);
    expect(judge(p('paladin')).worth.lo).toBeCloseTo(2.0, 1);
    expect(judge(p('pawn')).worth.point).toBeCloseTo(1.03, 2);
    expect(judge(p('queen')).worth.point).toBeCloseTo(9.32, 2);
    expect(judge(p('pawn')).line).toBe('A pawn: the unit of worth.');
    expect(judge(p('queen')).line).toBe('The queen: the one piece above the band. Only the queen stands here.');
    expect(memoryOf(p('pawn')).points).toBe(0.5);
  });

  it('blocks the shapes §6.13 marks blocked', () => {
    expect(judge(d(NN, [], { when: AL, does: { a: 'cannotBeTaken', by: 'allButKing' } })).blocked).toMatch(/Only a king/);
    expect(judge(d(K8, [], { when: AL, does: { a: 'cannotBeTaken', by: 'allButKing' } })).blocked).toMatch(/Only a king/);
    expect(judge(d(K8, [], becomes({ on: 'reaches', zone: 'capital' } as unknown as When, 'Q'))).blocked).not.toBe('');
  });

  it('warns on no pool piece but the Archer and the Guard', () => {
    // A warning flag; the Paladin's chip is its memory (5.5, hard: the §6.13 row).
    expect(PRESETS.filter(x => judge(x).flags.some(f => f.level === 'warn')).map(x => x.key)).toEqual(['archer', 'guard']);
    expect(PRESETS.filter(x => judge(x).warn).map(x => x.key)).toEqual(['archer', 'paladin', 'guard']);
    expect(judge(p('archer')).flags.find(f => f.level === 'warn')?.code).toBe('F2');
  });

  it('keeps the measured labels (§6.7)', () => {
    expect(anchorOf(p('paladin'))?.value).toBe(4.08);
    expect(judge(p('paladin')).worth.measured?.label).toBe('fair');
    expect(judge(anchor('Templar')).line).toBe('May often wait: its rule works only on a center square.');
    expect(judge(p('ogre')).line).toBe('Fair: about 2½ pawns. About as strong as an ogre.');
    expect(judge(d(NN, [], chain)).like).toBe('About as strong as a beast.');
    expect(judge(d(NN, ORTHO)).like).toBe('About a queen.');
    expect(BAND_WORD.likelyOP).toBe('Likely overpowered');
  });
});

/* ---- random designs (§8.4.4, §8.4.7) ---- */

const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32; };
const r = rng(11), pick = <T>(a: readonly T[]): T => a[Math.floor(r() * a.length)];
const MARKS: Mark[] = ['both', 'move', 'take', 'shoot', 'moveShoot'];
const CELLS: [number, number][] = [];
for (let x = -3; x <= 3; x++) for (let y = -3; y <= 3; y++) if (x || y) CELLS.push([x, y]);
const WHENS = [...TOP_WHENS, ...MORE_WHENS, ...EVENT_WHENS, { on: 'takes' } as When];
/** A random rule of a block, with a random pill and a When the block allows. */
function ruleOf(b: (typeof BLOCKS)[number]): Rule {
  const does = { ...b.rule.does } as Record<string, string>;
  if (b.pill) does[b.pill.key] = pick(b.pill.choices)[0];
  return { when: pick(WHENS.filter(b.whens)), does: does as unknown as Rule['does'] };
}
const ok = (x: D): boolean => !limit(x) && !empty(x);
function random(): D {
  const x: D = { squares: [], lines: DIRS.filter(() => r() < 0.12), rules: [] };
  for (const [cx, cy] of CELLS) if (r() < 0.12) x.squares.push({ x: cx, y: cy, mark: pick(MARKS) });
  for (let n = Math.floor(r() * 3); n > 0; n--) { const y = { ...x, rules: [...x.rules, ruleOf(pick(BLOCKS))] }; if (!limit(y)) x.rules = y.rules; }
  return x;
}
/** Every one-step addition of `x`: a square on a free cell, a line, a rule. */
function additions(x: D): { kind: 'gain' | 'flaw'; d: D; a?: Rule['does']['a'] }[] {
  const out: { kind: 'gain' | 'flaw'; d: D; a?: Rule['does']['a'] }[] = [];
  const used = new Set(x.squares.map(s => `${s.x},${s.y}`));
  for (const [cx, cy] of CELLS) if (!used.has(`${cx},${cy}`)) out.push({ kind: 'gain', d: { ...x, squares: [...x.squares, { x: cx, y: cy, mark: pick(MARKS) }] } });
  for (const l of DIRS) if (!x.lines.includes(l)) out.push({ kind: 'gain', d: { ...x, lines: [...x.lines, l] } });
  for (const b of BLOCKS) {
    const y = { ...x, rules: [...x.rules, ruleOf(b)] };
    if (!limit(y) && !b.needs?.(x)) out.push({ kind: b.group === 'Holding back' ? 'flaw' : 'gain', d: y, a: b.a });
  }
  return out.filter(o => ok(o.d));
}
const POOL: D[] = [...PRESETS, ...ANCHOR_DESIGNS.map(a => a.design), ...ROWS.map(x => x[1])].filter(ok);
const DESIGNS: D[] = [...POOL, ...POOL.flatMap(x => additions(x).map(o => o.d))];
while (DESIGNS.length < POOL.length + 1000) { const x = random(); if (ok(x)) DESIGNS.push(x); }

describe('the judge on random designs', () => {
  it('never lowers W for an added square, line or ability, and never raises it for a flaw (§8.4.4)', () => {
    let n = 0;
    for (const x of DESIGNS.slice(0, POOL.length + 1000)) {
      const w = worthOf(x);
      for (const o of additions(x)) {
        const v = worthOf(o.d);
        if (o.kind === 'gain') expect(v, `${keyOf(x)} + ${keyOf(o.d)}`).toBeGreaterThanOrEqual(w - 1e-9);
        else expect(v, `${keyOf(x)} + flaw ${keyOf(o.d)}`).toBeLessThanOrEqual(w + 1e-9);
        n++;
      }
    }
    expect(n).toBeGreaterThan(10000);
  });

  it('gives each rule-book badge the change that adding the rule then shows', () => {
    for (const x of POOL) {
      const v = judge(x);
      for (const b of BLOCKS) {
        const badge = v.deltas[b.a];
        if (!badge) continue;
        expect(badge.v, `${keyOf(x)} ${b.a}`).toBeCloseTo(worthOf({ ...x, rules: [...x.rules, b.rule] }) - v.worth.point, 2);
      }
    }
  });

  it('shows a badge in halves, and a change of 0.1 to ¼ pawn as ¼, not 0', () => {
    expect([0.05, 0.1, 0.24, 0.25, 0.74, 1.59, -0.2, -1].map(badgeText)).toEqual(['+0', '+¼', '+¼', '+½', '+½', '+1½', '−¼', '−1']);
    // The rook's "also moves like a queen on a center square": small, but not nothing.
    expect(badgeText(judge(p('rook')).deltas.movesLike!.v)).toBe('+¼');
  });

  it('names what makes a design strong in Why?: its parts and what each adds', () => {
    const v = judge(d(KING_STEP('both').filter(s => s.x && s.y), ORTHO, chain));
    expect(v.label).toBe('likelyOP');
    expect(v.why).toEqual([
      'Slides straight: adds about 7 pawns.',
      'Moves and takes 1 square diagonally: adds about 3 pawns.',
      'Takes again: adds about 2½ pawns.',
      'In all, it can take on about 10 squares; a rook, about 7; a queen, about 12. Past 7, each one counts double.',
    ]);
  });

  it('keeps the line within 90 characters, and each fix is a removal that lands in the band (§8.4.7)', () => {
    const sub = <T>(a: readonly T[], b: readonly T[], k: (t: T) => string) => a.every(t => b.some(u => k(u) === k(t)));
    for (const x of DESIGNS) {
      const v = judge(x);
      expect(v.line.length, v.line).toBeLessThanOrEqual(90);
      expect(v.fixes.length).toBeLessThanOrEqual(2);
      for (const f of v.fixes) {
        expect(sub(f.design.squares, x.squares, s => JSON.stringify(s)) && sub(f.design.lines, x.lines, String) && sub(f.design.rules, x.rules, s => JSON.stringify(s))).toBe(true);
        expect(keyOf(f.design)).not.toBe(keyOf(x));
        expect(f.worth).toBeGreaterThanOrEqual(THRESHOLDS.weak);
        expect(f.worth).toBeLessThanOrEqual(THRESHOLDS.op);
      }
    }
  });
});
