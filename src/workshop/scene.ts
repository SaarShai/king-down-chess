/**
 * The Proving Ground's scene: a design on a board as the marks, rails, arches and effects of the
 * mockup's scene format (docs/research/rules-ui-2026-10-10/mockups/shared/scenes.js, lines 7-23).
 * movesOf gives every reach and the board gives every occupant; this module decides no move rule
 * (docs/specs/workshop-proving-ground/spec.md, decision 36). Pure, so it runs in Node.
 */
import { BLACK, K, LETTERS, NAMES, P, T, WHITE, colorOf, file, genPiece, parseSq, piece, rank, sqName, typeOf, type Move, type PieceType } from '../rules/engine';
import { marksModel } from '../marks-model';
import { DIR, canonical, type Ability, type PieceDesign, type Rule, type Zone } from './model';
import { blockOf } from './vocab';
import { START, holds, movesOf, patternOf, step, type Can, type Refused, type TryState } from './moves';
import { traceOf, type Knot } from './why';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
export type Kind = 'move' | 'take' | 'both' | 'shot' | 'moveshot';
/** `k` is the piece's engine name; the open design is 'design', because its look comes from the design. */
export interface ScenePiece { sq: string; k: string; side: 'w' | 'b'; open?: true }
/** `by` (here and below): the rules, by their index in canonical(d).rules (the seals I, II and III), that make, change or refuse it.
 *  `pv`: a preview adds it (a choice or a new rule that the player looks at, ground.ts). `on`: a hover-only part, shown while
 *  the square `on` has the pointer, the keyboard focus or the open Why tag (spec decision 37). */
type By = { by?: number[]; pv?: true; on?: string };
/** `x`: the line ends in a take; `stop`: a friend stops it; `arrow`: the board edge; `edge`: the board edge of an asleep
 *  line, with no arrow; `blocked`: an enemy that a rule refuses. */
export interface Rail extends By { from: string; to: string; end: 'x' | 'stop' | 'arrow' | 'edge' | 'blocked'; style?: 'asleep' | 'awake' }
export interface Scene {
  pieces: ScenePiece[];
  /** `blocked`: a refused take; `blocked-move`: a refused push or swap (a king). `byWords`: what refuses it.
   *  `diff`: the paint diff of a copy (diffOf): '+' a new or changed mark, '-' a mark of its pool piece that is gone. */
  marks: (By & { sq: string; k: Kind | 'blocked' | 'blocked-move'; cond?: 'asleep' | 'awake'; byWords?: string; diff?: '+' | '-' })[];
  rails: Rail[];
  arches: (By & { from: string; over: string; to: string })[];
  /** The hover-only effects: `follow` (the piece follows its push), `sight` (a shot's line), and a chain's `hop` and order `pip`.
   *  A `threat` (threatsOf, the eye of Try with) is `stopped` by a "cannot be taken" rule. */
  effects: (By & ({ k: 'swap'; a: string; b: string } | { k: 'push' | 'follow' | 'sight' | 'hop'; from: string; to: string } | { k: 'pip'; sq: string; n: number }
    | { k: 'threat'; from: string; to: string; stopped?: true }))[];
  /** The stamps on a mark: the table rule that refuses it (no `by`), then each rule of its `by`. */
  impressions: { sq: string; list: { a: Ability['a']; by?: number }[]; on?: string }[];
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

/** The pieces of a board as scene pieces; the one on `from` is the open piece (none once a move removed it). */
export const piecesOf = (board: Uint8Array, from: number): ScenePiece[] => [...board.keys()].filter(s => board[s]).map(s => ({
  sq: sqName(s), k: s === from ? 'design' : NAMES[typeOf(board[s])], side: colorOf(board[s]) ? 'b' : 'w', ...(s === from && { open: true as const }),
}));

/* ---- Try with (ticket 06): the moves a tap plays, the die, the broom, "Show on" and the threats ---- */

/** What a move does, and the square a tap picks it by: the victim of a shot, the piece pushed, else the landing square (Try it, sandbox.ts). */
export type Act = 'move' | 'take' | 'shot' | 'push' | 'swap';
export const actOf = (m: Move): Act => (m.shove ? 'push' : m.swap ? 'swap' : m.captures.length && m.to === m.from ? 'shot' : m.captures.length ? 'take' : 'move');
export const tapOf = (m: Move): number => (m.shove ? m.shove.from : m.captures.length && m.to === m.from ? m.captures[0] : m.to);
const far = (a: number, b: number): number => Math.max(Math.abs(file(a) - file(b)), Math.abs(rank(a) - rank(b)));
/** The enemies of Try it, as piece type and square. */
const ENEMIES: [PieceType, string][] = [[4, 'h8'], [2, 'f7'], [1, 'd6'], [3, 'b5'], [1, 'f5'], [1, 'g4']];
/** The die (and Shuffle in Try it): the board less its enemies, then the six enemies on free squares that `rnd` picks,
 *  none next to the piece on `from`; with no `rnd`, on their own squares (the first board of Try it). */
export function stir(board: Uint8Array, from: number, rnd?: () => number): Uint8Array {
  const b = Uint8Array.from(board, v => (v && colorOf(v) !== colorOf(board[from]) ? 0 : v)), free = [...b.keys()].filter(s => !b[s] && far(s, from) > 1);
  for (const [t, q] of ENEMIES) {
    const to = rnd ? free.splice(Math.floor(rnd() * free.length), 1)[0] : parseSq(q);
    if (!b[to]) b[to] = piece(t, BLACK);
  }
  return b;
}
/** The broom: the piece alone. */
export const clear = (board: Uint8Array, from: number): Uint8Array => { const b = new Uint8Array(64); b[from] = board[from]; return b; };
/** "Show on": the nearest empty square where `rule`'s When holds for the piece, the same file first; null when no square wakes it. */
export function wakeSquare(board: Uint8Array, from: number, rule: Rule, st: TryState = START): number | null {
  const on = (s: number): Uint8Array => { const b = new Uint8Array(board); b[from] = 0; b[s] = board[from]; return b; };
  const key = (s: number): number => 2 * far(s, from) + +(file(s) !== file(from));
  return [...board.keys()].filter(s => !board[s] && holds(rule.when, on(s), s, st)).sort((a, b) => key(a) - key(b))[0] ?? null;
}
/** The eye: each enemy that attacks the piece on `from` (the engine's genPiece, 'attacks'). A "cannot be taken" rule of
 *  the design that holds and refuses that attacker stops the threat, with its seal number. */
export function threatsOf(design: D, board: Uint8Array, from: number, st: TryState = START): Scene['effects'] {
  const rules = canonical(design).rules, i = rules.findIndex(r => r.does.a === 'cannotBeTaken'), safe = rules[i];
  const by = safe?.does.a === 'cannotBeTaken' && holds(safe.when, board, from, st) ? safe.does.by : null;
  return [...board.keys()].flatMap(s => {
    const v = board[s], ms: Move[] = [];
    if (!v || colorOf(v) === colorOf(board[from])) return [];
    genPiece(board, s, 'attacks', ms);
    const stopped = by === 'allButKing' ? typeOf(v) !== K : by === 'pawns' && typeOf(v) === P;
    return ms.some(m => m.captures.includes(from)) ? [{ k: 'threat' as const, from: sqName(s), to: sqName(from), ...(stopped && { stopped: true as const, by: [i] }) }] : [];
  });
}

const kindOf = (c: Can): Kind => (c.s ? (c.m ? 'moveshot' : 'shot') : c.t ? (c.m ? 'both' : 'take') : 'move');
/** A rail's line: its start and its direction. */
const lineOf = (r: Rail): string => {
  const a = parseSq(r.from), b = parseSq(r.to);
  return `${r.from} ${Math.sign(file(b) - file(a))} ${Math.sign(rank(b) - rank(a))}`;
};
/** The squares a rail crosses, after its start, up to its end. */
function along(r: Rail): number[] {
  const a = parseSq(r.from), b = parseSq(r.to), out: number[] = [];
  for (let s = a; s !== b && s >= 0;) out.push(s = step(s, Math.sign(file(b) - file(a)), Math.sign(rank(b) - rank(a))));
  return out;
}

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

/** The scene of design `d` for the piece on `from`, with the why-trace's stamps, refused targets and knots, and the hover-only parts. */
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
      // An asleep line is a faint rail with no arrow; its squares get no asleep marks (scenes.js, mypawn-queen-b4).
      const asleep = other.rails.filter(rl => !lines.has(lineOf(rl))).map((rl): Rail => ({ ...rl, end: rl.end === 'arrow' ? 'edge' : rl.end, style: 'asleep', by: [i] }));
      const crossed = new Set(asleep.flatMap(along));
      for (const [s, k] of other.marks) if (!crossed.has(s) && !marks.some(m => m.sq === sqName(s))) marks.push({ sq: sqName(s), k, cond: 'asleep', by: [i] });
      rails.push(...asleep);
    }
  }
  const effects = new Map<string, Scene['effects'][number]>();
  // Hover-only (decision 37), on a chain's first take: each next take with its order pip and its hop from the take
  // before it, both from the first route to it; the refused next take (below) gets its pip too.
  const onOf = (caps: number[]): string | undefined => (caps.length ? sqName(caps[0]) : undefined);
  const pip = (sq: string, n: number, on: string): void => { if (!effects.has(`pip ${on} ${sq}`)) effects.set(`pip ${on} ${sq}`, { k: 'pip', sq, n, on }); };
  for (const m of now.moves) {
    const on = onOf(m.captures)!;
    m.captures.slice(1).forEach((s, k) => {
      if (!marks.some(x => x.sq === sqName(s) && x.on === on)) marks.push({ sq: sqName(s), k: 'take', by: by(s), on });
      pip(sqName(s), k + 2, on);
      if (!effects.has(`hop ${on} ${sqName(s)}`)) effects.set(`hop ${on} ${sqName(s)}`, { k: 'hop', from: sqName(m.captures[k]), to: sqName(s), on });
    });
  }
  // A refused take is grey with a bar, by the rules that refuse it only (a push and a swap may both refuse a king).
  for (const r of trace.refused) {
    const on = onOf(r.caps), m = marks.find(x => x.sq === sqName(r.sq) && x.on === on), by = r.rule === undefined ? [] : [r.rule];
    if (m?.k.startsWith('blocked') && !m.byWords?.includes(r.words)) Object.assign(m, { by: [...m.by ?? [], ...by].sort(), byWords: `${m.byWords}, ${r.words}` });
    else if (!m) marks.push({ sq: sqName(r.sq), k: r.why === 'push' || r.why === 'swap' ? 'blocked-move' : 'blocked', by: by.length ? by : undefined, byWords: r.words, ...on && { on } });
    if (on) pip(sqName(r.sq), r.caps.length + 1, on);
  }
  const impressions = marks.flatMap(m => {
    const table = m.k.startsWith('blocked') && trace.refused.some(r => r.rule === undefined && sqName(r.sq) === m.sq && onOf(r.caps) === m.on);
    const list = [...(table ? [{ a: 'cannotBeTaken' as const }] : []), ...(m.by ?? []).map(i => ({ a: d.rules[i].does.a, by: i }))];
    return list.length ? [{ sq: m.sq, list, ...m.on && { on: m.on } }] : [];
  });
  const chalk = d.rules.flatMap((r, i) => (r.when.on === 'zone' || r.when.on === 'reaches' ? [{ zone: r.when.zone, by: [i] }] : []));
  for (const m of now.moves) {
    if (m.swap) effects.set(`swap ${m.to}`, { k: 'swap', a: sqName(from), b: sqName(m.to), by: of('swap') });
    if (m.shove) effects.set(`push ${m.shove.from}`, { k: 'push', from: sqName(m.shove.from), to: sqName(m.shove.to), by: of('push') });
    // Hover-only: the piece follows its push, on the push's landing square (the Ogre).
    if (m.shove && m.to !== from) effects.set(`follow ${m.shove.from}`, { k: 'follow', from: sqName(from), to: sqName(m.to), on: sqName(m.shove.to), by: of('push') });
  }
  // Hover-only: a shot's sight line, on each shot mark (the Archer).
  for (const [s, k] of now.marks) if (k === 'shot' || k === 'moveshot') effects.set(`sight ${s}`, { k: 'sight', from: sqName(from), to: sqName(s), on: sqName(s) });
  return { pieces: piecesOf(board, from), marks, rails, arches: now.arches.map(a => ({ ...a, by: of('linesPass') })), effects: [...effects.values()], impressions, chalk, knots: trace.knots };
}

/** The paint diff of a copy (paintDiff, proving-ground.html:875): the scene of `d`, where each mark that `base`'s paint
 *  with d's rules does not make on the same board is '+', and each mark of that paint that is gone comes back as '-'. */
export function diffOf(d: D, base: Pick<D, 'squares' | 'lines'>, board: Uint8Array, from: number, st: TryState = START): Scene {
  const sc = sceneOf(d, board, from, st), was = sceneOf({ ...base, rules: d.rules }, board, from, st).marks;
  for (const m of sc.marks) if (!was.some(o => o.sq === m.sq && o.k === m.k && o.cond === m.cond)) m.diff = '+';
  for (const o of was) if (!sc.marks.some(m => m.sq === o.sq)) sc.marks.push({ ...o, diff: '-' });
  return sc;
}
