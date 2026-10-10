/**
 * The Proving Ground's scene: a design on a board as the marks, rails, arches and effects of the
 * mockup's scene format (docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js, lines 7-23).
 * movesOf gives every reach and the board gives every occupant; this module decides no move rule
 * (docs/specs/workshop-proving-ground/spec.md, decision 36). Pure, so it runs in Node.
 */
import { BLACK, LETTERS, NAMES, T, WHITE, colorOf, file, parseSq, piece, rank, sqName, typeOf, type PieceType } from '../rules/engine';
import { marksModel } from '../marks-model';
import { DIR, type PieceDesign } from './model';
import { blockOf } from './vocab';
import { START, holds, movesOf, patternOf, step, type Can, type TryState } from './moves';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
export type Kind = 'move' | 'take' | 'both' | 'shot' | 'moveshot';
/** `k` is the piece's engine name; the open design is 'design', because its look comes from the design. */
export interface ScenePiece { sq: string; k: string; side: 'w' | 'b'; open?: true }
/** `x`: the line ends in a take; `stop`: a friend stops it; `arrow`: the board edge; `none`: an enemy it cannot take (ticket 04 draws it). */
export interface Rail { from: string; to: string; end: 'x' | 'stop' | 'arrow' | 'none'; style?: 'asleep' | 'awake'; pv?: true }
/** `pv` on a part: a preview adds it (a choice or a new rule that the player looks at, ground.ts). */
export interface Scene {
  pieces: ScenePiece[];
  /** diff: the paint diff of a copy (diffOf): '+' a new or changed mark, '-' a mark of its pool piece that is gone. */
  marks: { sq: string; k: Kind; cond?: 'asleep' | 'awake'; diff?: '+' | '-'; pv?: true }[];
  rails: Rail[];
  arches: { from: string; over: string; to: string; pv?: true }[];
  effects: (({ k: 'swap'; a: string; b: string } | { k: 'push'; from: string; to: string }) & { pv?: true })[];
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
    const [x, y] = DIR[l], ray: number[] = [], reach = new Map<number, boolean>();
    for (let s = step(from, x, y * dy); s >= 0; s = step(s, x, y * dy)) ray.push(s);
    for (const m of movesOf({ squares: [], lines: [l], rules: d.rules }, board, from, st)) {
      const s = m.captures[0] ?? m.to;
      if (!m.swap && !m.shove && m.captures.length < 2 && ray.includes(s)) reach.set(s, m.captures.length > 0);
    }
    for (const [s, take] of reach) add(s, { m: !take, t: take, s: false });
    const far = Math.max(-1, ...[...reach.keys()].map(s => ray.indexOf(s))), next = ray[far + 1];
    for (let i = 0; i < far; i++) if (board[ray[i]]) arches.push({ from: sqName(i ? ray[i - 1] : from), over: sqName(ray[i]), to: sqName(ray[i + 1]) });
    const end = reach.get(ray[far]) ? 'x' : next === undefined ? 'arrow' : colorOf(board[next]) === c ? 'stop' : 'none';
    if (end === 'stop') rails.push({ from: sqName(from), to: sqName(next), end });
    else if (far >= 0) rails.push({ from: sqName(from), to: sqName(ray[far]), end });
  }
  // A move that no painted square or line gives (a rule's move, such as step 2).
  const mm = marksModel(moves);
  for (const s of mm.moves) if (!can.has(s)) add(s, { m: true, t: false, s: false });
  for (const s of mm.captures) if (!can.has(s)) add(s, { m: false, t: !mm.shots.includes(s), s: mm.shots.includes(s) });
  return { marks: new Map([...can].map(([s, n]) => [s, kindOf(n)])), rails, arches, moves };
}

/** The scene of design `d` for the piece on `from`. Ticket 04 adds the refused marks, stamps and knots; ticket 05 the hover-only marks. */
export function sceneOf(d: D, board: Uint8Array, from: number, st: TryState = START): Scene {
  const now = layer(d, board, from, st);
  const marks: Scene['marks'] = [...now.marks].map(([s, k]) => ({ sq: sqName(s), k })), rails = now.rails;
  // A state rule whose When does not hold: what it adds when its When is "always" is asleep. One that holds: what goes without it is awake.
  for (const r of d.rules) {
    if (blockOf(r.does.a).event || r.when.on === 'always') continue;
    const awake = holds(r.when, board, from, st);
    const other = layer({ ...d, rules: awake ? d.rules.filter(x => x !== r) : d.rules.map(x => (x === r ? { ...x, when: { on: 'always' as const } } : x)) }, board, from, st);
    const lines = new Set((awake ? other.rails : rails).map(lineOf));
    if (awake) {
      for (const m of marks) if (!m.cond && !other.marks.has(parseSq(m.sq))) m.cond = 'awake';
      for (const rl of rails) if (!rl.style && !lines.has(lineOf(rl))) rl.style = 'awake';
    } else {
      for (const [s, k] of other.marks) if (!marks.some(m => m.sq === sqName(s))) marks.push({ sq: sqName(s), k, cond: 'asleep' });
      for (const rl of other.rails) if (!lines.has(lineOf(rl))) rails.push({ ...rl, style: 'asleep' });
    }
  }
  const effects = new Map<string, Scene['effects'][number]>();
  for (const m of now.moves) {
    if (m.swap) effects.set(`swap ${m.to}`, { k: 'swap', a: sqName(from), b: sqName(m.to) });
    if (m.shove) effects.set(`push ${m.shove.from}`, { k: 'push', from: sqName(m.shove.from), to: sqName(m.shove.to) });
  }
  const pieces: ScenePiece[] = [];
  board.forEach((v, s) => {
    if (!v) return;
    const p: ScenePiece = { sq: sqName(s), k: s === from ? 'design' : NAMES[typeOf(v)], side: colorOf(v) ? 'b' : 'w' };
    pieces.push(s === from ? { ...p, open: true } : p);
  });
  return { pieces, marks, rails, arches: now.arches, effects: [...effects.values()] };
}

/** The paint diff of a copy (paintDiff, proving-ground.html:875): the scene of `d`, where each mark that `base`'s paint
 *  with d's rules does not make on the same board is '+', and each mark of that paint that is gone comes back as '-'. */
export function diffOf(d: D, base: Pick<D, 'squares' | 'lines'>, board: Uint8Array, from: number, st: TryState = START): Scene {
  const sc = sceneOf(d, board, from, st), was = sceneOf({ ...base, rules: d.rules }, board, from, st).marks;
  for (const m of sc.marks) if (!was.some(o => o.sq === m.sq && o.k === m.k && o.cond === m.cond)) m.diff = '+';
  for (const o of was) if (!sc.marks.some(m => m.sq === o.sq)) sc.marks.push({ ...o, diff: '-' });
  return sc;
}
