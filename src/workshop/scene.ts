/**
 * The Proving Ground's scene: a design on a board as the marks, rails, arches and effects of the
 * mockup's scene format (docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js, lines 7-23).
 * movesOf gives every reach and the board gives every occupant; this module decides no move rule
 * (docs/specs/workshop-proving-ground/spec.md, decision 36). Pure, so it runs in Node.
 */
import { BLACK, LETTERS, NAMES, T, WHITE, colorOf, file, parseSq, piece, rank, sqName, typeOf, type PieceType } from '../rules/engine';
import { marksModel } from '../marks-model';
import { DIR, canonical, type Ability, type PieceDesign, type Zone } from './model';
import { blockOf } from './vocab';
import { START, holds, movesOf, patternOf, step, type Can, type Refused, type TryState } from './moves';
import { traceOf, type Knot } from './why';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
export type Kind = 'move' | 'take' | 'both' | 'shot' | 'moveshot';
/** `k` is the piece's engine name; the open design is 'design', because its look comes from the design. */
export interface ScenePiece { sq: string; k: string; side: 'w' | 'b'; open?: true }
/** `by` (here and below): the rules, by their index in canonical(d).rules (the seals I, II and III), that make, change or refuse it.
 *  `pv`: a preview adds it (a choice or a new rule that the player looks at, ground.ts). */
type By = { by?: number[]; pv?: true };
/** `x`: the line ends in a take; `stop`: a friend stops it; `arrow`: the board edge; `blocked`: an enemy that a rule refuses. */
export interface Rail extends By { from: string; to: string; end: 'x' | 'stop' | 'arrow' | 'blocked'; style?: 'asleep' | 'awake' }
export interface Scene {
  pieces: ScenePiece[];
  /** `blocked`: a refused take; `blocked-move`: a refused push or swap (a king). `byWords`: what refuses it.
   *  `diff`: the paint diff of a copy (diffOf): '+' a new or changed mark, '-' a mark of its pool piece that is gone. */
  marks: (By & { sq: string; k: Kind | 'blocked' | 'blocked-move'; cond?: 'asleep' | 'awake'; byWords?: string; diff?: '+' | '-' })[];
  rails: Rail[];
  arches: (By & { from: string; over: string; to: string })[];
  effects: (By & ({ k: 'swap'; a: string; b: string } | { k: 'push'; from: string; to: string }))[];
  /** The stamps on a mark: the table rule that refuses it (no `by`), then each rule of its `by`. */
  impressions: { sq: string; list: { a: Ability['a']; by?: number }[] }[];
  /** The zone of a rule's When, shown while that rule is isolated. */
  chalk: (By & { zone: Zone })[];
  knots: Knot[];
}

/** The example board of each pool piece (the `pieces` of scenes.js): the open piece's square, then each other
 *  piece as its engine letter (upper case White, lower case Black) and its square. */
const EXAMPLES: Readonly<Record<string, string>> = {
  paladin: 'd4 Pd5 Bb2 Kb1 nd7 pb6 kg7', pawn: 'd4', archer: 'd4 Pb4 nd6 bf6 pf4 rd2 pe5', beast: 'd4 Pc3 pe5 nf6 kg7',
  maester: 'd4 Re4 Pd3 nc5', ogre: 'd4 Ne4 pd5 gc3', guard: 'd4 Kd3 pe5', rook: 'd1 Pd2 Ke1 pd7 kg8', knight: 'd4', bishop: 'd4', queen: 'd4',
};
/** A design copied from one pool piece stands on that piece's example board; any other design stands alone on d4. */
export const examplesOf = (d: Pick<PieceDesign, 'from'>): ScenePiece[] =>
  (d.from.length === 1 && Object.hasOwn(EXAMPLES, d.from[0]) ? EXAMPLES[d.from[0]] : 'd4').split(' ').map((t, i): ScenePiece => (i
    ? { sq: t.slice(1), k: NAMES[LETTERS.indexOf(t[0].toUpperCase())], side: t[0] < 'a' ? 'w' : 'b' }
    : { sq: t, k: 'design', side: 'w', open: true }));

/** The board of a piece list. The open design is piece(T, WHITE), as in Try it: its moves come from the design. */
export function boardOf(pieces: readonly ScenePiece[]): Uint8Array {
  const b = new Uint8Array(64);
  for (const p of pieces) b[parseSq(p.sq)] = p.open ? piece(T, WHITE) : piece((NAMES as readonly string[]).indexOf(p.k) as PieceType, p.side === 'b' ? BLACK : WHITE);
  return b;
}

const kindOf = (c: Can): Kind => (c.s ? (c.m ? 'moveshot' : 'shot') : c.t ? (c.m ? 'both' : 'take') : 'move');
/** A rail's line: its start and its direction. */
const lineOf = (r: Rail): string => {
  const a = parseSq(r.from), b = parseSq(r.to);
  return `${r.from} ${Math.sign(file(b) - file(a))} ${Math.sign(rank(b) - rank(a))}`;
};

/** The marks, rails and arches of the design now, and its moves. */
function layer(d: D, board: Uint8Array, from: number, st: TryState) {
  const moves = movesOf(d, board, from, st), c = colorOf(board[from]), dy = c === BLACK ? -1 : 1;
  const can = new Map<number, Can>();
  const add = (s: number, n: Can): void => { const o = can.get(s); can.set(s, o ? { m: o.m || n.m, t: o.t || n.t, s: o.s || n.s } : n); };
  // The painted mark shows on an empty square, or on an enemy that the piece takes there.
  const taken = new Set(moves.map(m => m.captures[0]));
  const pattern = patternOf(d, board, from, st);
  for (const q of pattern.can.values()) {
    const s = step(from, q.x, q.y * dy);
    if (s >= 0 && (!board[s] || (taken.has(s) && (q.t || q.s)))) add(s, { m: q.m, t: q.t, s: q.s });
  }
  // Each line: its reach is movesOf with that line only, less swaps, shoves and chains.
  const rails: Rail[] = [], arches: Scene['arches'] = [];
  for (const l of pattern.lines) {
    const [x, y] = DIR[l], ray: number[] = [], reach = new Map<number, boolean>(), refused: Refused[] = [];
    for (let s = step(from, x, y * dy); s >= 0; s = step(s, x, y * dy)) ray.push(s);
    for (const m of movesOf({ squares: [], lines: [l], rules: d.rules }, board, from, st, refused)) {
      const s = m.captures[0] ?? m.to;
      if (!m.swap && !m.shove && m.captures.length < 2 && ray.includes(s)) reach.set(s, m.captures.length > 0);
    }
    for (const [s, take] of reach) add(s, { m: !take, t: take, s: false });
    // The rail ends on the first refused enemy past its reach, else on its last take, at the edge, or on the friend that stops it.
    const far = Math.max(-1, ...[...reach.keys()].map(s => ray.indexOf(s)));
    const bar = Math.min(...refused.filter(r => !r.caps.length).map(r => ray.indexOf(r.sq)).filter(i => i > far));
    const end = bar < ray.length ? 'blocked' : reach.get(ray[far]) ? 'x' : far + 1 === ray.length ? 'arrow' : 'stop';
    const to = end === 'blocked' ? bar : end === 'stop' ? far + 1 : far;
    for (let i = 0; i < to; i++) if (board[ray[i]]) arches.push({ from: sqName(i ? ray[i - 1] : from), over: sqName(ray[i]), to: sqName(ray[i + 1]) });
    if (to >= 0) rails.push({ from: sqName(from), to: sqName(ray[to]), end });
  }
  // A move that no painted square or line gives (a rule's move, such as step 2).
  const mm = marksModel(moves);
  for (const s of mm.moves) if (!can.has(s)) add(s, { m: true, t: false, s: false });
  for (const s of mm.captures) if (!can.has(s)) add(s, { m: false, t: !mm.shots.includes(s), s: mm.shots.includes(s) });
  return { marks: new Map([...can].map(([s, n]) => [s, kindOf(n)])), rails, arches, moves };
}

/** The scene of design `d` for the piece on `from`, with the why-trace's stamps, refused targets and knots. Ticket 05 adds the hover-only marks. */
export function sceneOf(design: D, board: Uint8Array, from: number, st: TryState = START): Scene {
  const d = canonical(design), now = layer(d, board, from, st), trace = traceOf(d, board, from, st);
  const by = (s: number): number[] | undefined => trace.by.get(s)?.map(x => x.i), of = (a: Ability['a']): number[] => [d.rules.findIndex(r => r.does.a === a)].filter(i => i >= 0);
  const marks: Scene['marks'] = [...now.marks].map(([s, k]) => ({ sq: sqName(s), k, by: by(s) })), rails = now.rails;
  // A state rule whose When does not hold: what it adds when its When is "always" is asleep. One that holds: what goes without it is awake.
  for (const [i, r] of d.rules.entries()) {
    if (blockOf(r.does.a).event || r.when.on === 'always') continue;
    const awake = holds(r.when, board, from, st);
    const other = layer({ ...d, rules: awake ? d.rules.filter(x => x !== r) : d.rules.map(x => (x === r ? { ...x, when: { on: 'always' as const } } : x)) }, board, from, st);
    const lines = new Set((awake ? other.rails : rails).map(lineOf));
    if (awake) {
      for (const m of marks) if (!m.cond && !other.marks.has(parseSq(m.sq))) m.cond = 'awake';
      for (const rl of rails) if (!rl.style && !lines.has(lineOf(rl))) Object.assign(rl, { style: 'awake', by: [i] });
    } else {
      for (const [s, k] of other.marks) if (!marks.some(m => m.sq === sqName(s))) marks.push({ sq: sqName(s), k, cond: 'asleep', by: [i] });
      for (const rl of other.rails) if (!lines.has(lineOf(rl))) rails.push({ ...rl, style: 'asleep', by: [i] });
    }
  }
  // A refused first take is grey with a bar, by the rules that refuse it only (a push and a swap may both refuse a king);
  // a chain's refused next take waits for its hover (ticket 05).
  for (const r of trace.refused) {
    const m = r.caps.length ? null : marks.find(x => x.sq === sqName(r.sq)), by = r.rule === undefined ? [] : [r.rule];
    if (m?.k.startsWith('blocked')) Object.assign(m, { by: [...m.by ?? [], ...by].sort(), byWords: `${m.byWords}, ${r.words}` });
    else if (m === undefined) marks.push({ sq: sqName(r.sq), k: r.why === 'push' || r.why === 'swap' ? 'blocked-move' : 'blocked', by: by.length ? by : undefined, byWords: r.words });
  }
  const impressions = marks.flatMap(m => {
    const table = m.k.startsWith('blocked') && trace.refused.some(r => r.rule === undefined && sqName(r.sq) === m.sq);
    const list = [...(table ? [{ a: 'cannotBeTaken' as const }] : []), ...(m.by ?? []).map(i => ({ a: d.rules[i].does.a, by: i }))];
    return list.length ? [{ sq: m.sq, list }] : [];
  });
  const chalk = d.rules.flatMap((r, i) => (r.when.on === 'zone' || r.when.on === 'reaches' ? [{ zone: r.when.zone, by: [i] }] : []));
  const effects = new Map<string, Scene['effects'][number]>();
  for (const m of now.moves) {
    if (m.swap) effects.set(`swap ${m.to}`, { k: 'swap', a: sqName(from), b: sqName(m.to), by: of('swap') });
    if (m.shove) effects.set(`push ${m.shove.from}`, { k: 'push', from: sqName(m.shove.from), to: sqName(m.shove.to), by: of('push') });
  }
  const pieces: ScenePiece[] = [];
  board.forEach((v, s) => {
    if (!v) return;
    const p: ScenePiece = { sq: sqName(s), k: s === from ? 'design' : NAMES[typeOf(v)], side: colorOf(v) ? 'b' : 'w' };
    pieces.push(s === from ? { ...p, open: true } : p);
  });
  return { pieces, marks, rails, arches: now.arches.map(a => ({ ...a, by: of('linesPass') })), effects: [...effects.values()], impressions, chalk, knots: trace.knots };
}

/** The paint diff of a copy (paintDiff, proving-ground.html:875): the scene of `d`, where each mark that `base`'s paint
 *  with d's rules does not make on the same board is '+', and each mark of that paint that is gone comes back as '-'. */
export function diffOf(d: D, base: Pick<D, 'squares' | 'lines'>, board: Uint8Array, from: number, st: TryState = START): Scene {
  const sc = sceneOf(d, board, from, st), was = sceneOf({ ...base, rules: d.rules }, board, from, st).marks;
  for (const m of sc.marks) if (!was.some(o => o.sq === m.sq && o.k === m.k && o.cond === m.cond)) m.diff = '+';
  for (const o of was) if (!sc.marks.some(m => m.sq === o.sq)) sc.marks.push({ ...o, diff: '-' });
  return sc;
}
