/**
 * A designed piece (docs/specs/workshop-proving-ground ticket 16): the one move interpreter of a Workshop design. The
 * Workshop's Try board calls it through `movesOf`, and the engine calls it for the type slot `T` while `RULES.design`
 * is set. The types are the Workshop's stored form (`src/workshop/model.ts` re-exports them).
 */
import { BLACK, CAPITAL, K, LETTERS, P, SPENT, T, canCapture, colorOf, file, rank, sq, typeOf, type Color, type GenMode, type Move, type PieceType } from './engine';

export type Body = 'P' | 'N' | 'B' | 'R' | 'Q' | 'A' | 'L' | 'G' | 'M' | 'S' | 'O';
export type Mark = 'both' | 'move' | 'take' | 'shoot' | 'moveShoot';
export type Dir = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export type Zone = 'startRank' | 'ownHalf' | 'enemyHalf' | 'lastRank' | 'capital';
export type MoveN = 5 | 10 | 15 | 20;
/** MATRIX D.1. A state holds for a while; an event happens at one moment. */
export type When =
  | { on: 'always' }
  | { on: 'zone'; zone: Zone }
  | { on: 'near'; who: 'king' | 'friend' | 'enemy' | Body }
  | { on: 'fromMove'; n: MoveN } | { on: 'beforeMove'; n: MoveN }
  | { on: 'afterFirstCapture' }
  | { on: 'afterCard'; card: 'any' }
  | { on: 'takes' } | { on: 'firstTake' }
  | { on: 'reaches'; zone: 'lastRank' };
/** The pieces that "also moves like" can name. */
export type LikeAs = 'king' | 'knight' | 'bishop' | 'rook' | 'queen';
/** The 10 rule blocks of build 1a; src/workshop/vocab.ts has the sentence and the limits of each. */
export type Ability =
  | { a: 'step2' }
  | { a: 'movesLike'; as: LikeAs }
  | { a: 'linesPass'; over: 'own' | 'any' }
  | { a: 'chain' }
  | { a: 'cannotBeTaken'; by: 'pawns' | 'allButKing' }
  | { a: 'push'; then: 'follow' | 'stay' }
  | { a: 'swap'; with: 'friend' | 'enemy' }
  | { a: 'becomes'; into: 'choice' | 'Q' | 'R' | 'B' | 'N' | 'A' }
  | { a: 'cannotTake'; what: 'king' | 'pawns' | 'any' }
  | { a: 'removedAfter'; what: 'piece' | 'any' };
export interface Rule { when: When; does: Ability }
/** x to the right, y forward, both in −3..3, never (0, 0). Black's pattern is the mirror image. */
export interface Square { x: number; y: number; mark: Mark }
/** What the engine plays: the squares, lines and rules, and the squares and lines of the "moves like" piece (null without that rule). */
export interface DesignSpec { squares: Square[]; lines: Dir[]; rules: Rule[]; like: { squares: readonly Square[]; lines: readonly Dir[] } | null }

export const DIR: Record<Dir, readonly [number, number]> = { n: [0, 1], ne: [1, 1], e: [1, 0], se: [1, -1], s: [0, -1], sw: [-1, -1], w: [-1, 0], nw: [-1, 1] };
/** What Try with tracks: the move counter, a first capture, and "Pretend your opponent played a card". */
export interface TryState { move: number; captured: boolean; card: boolean }
/** The state of a piece in a game: a first capture is `SPENT` on its byte; the move and card Whens are refused (`setRules`). */
const inGame = (board: Uint8Array, from: number): TryState => ({ move: 1, captured: (board[from] & SPENT) !== 0, card: false });

export const step = (s: number, df: number, dr: number): number => {
  const f = file(s) + df, r = rank(s) + dr;
  return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : sq(f, r);
};
const NEAR: readonly [number, number][] = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

/** Does a state rule's When hold for the piece on `from` now? Events always "hold": the move decides. */
export function holds(w: When, board: Uint8Array, from: number, st: TryState = inGame(board, from)): boolean {
  const c = colorOf(board[from]), r = c === BLACK ? 7 - rank(from) : rank(from);
  switch (w.on) {
    case 'zone': return w.zone === 'startRank' ? r === 1 : w.zone === 'ownHalf' ? r <= 3 : w.zone === 'enemyHalf' ? r >= 4 : w.zone === 'lastRank' ? r === 7 : CAPITAL.includes(from);
    case 'near': return NEAR.some(([x, y]) => {
      const n = step(from, x, y), v = n >= 0 ? board[n] : 0;
      if (!v) return false;
      return w.who === 'enemy' ? colorOf(v) !== c : colorOf(v) === c && (w.who === 'friend' || typeOf(v) === (w.who === 'king' ? K : LETTERS.indexOf(w.who)));
    });
    case 'fromMove': return st.move >= w.n;
    case 'beforeMove': return st.move < w.n;
    case 'afterFirstCapture': return st.captured;
    case 'afterCard': return st.card;
    default: return true;
  }
}

export interface Can { m: boolean; t: boolean; s: boolean }
const CAN: Record<Mark, Can> = { both: { m: true, t: true, s: false }, move: { m: true, t: false, s: false }, take: { m: false, t: true, s: false }, shoot: { m: false, t: false, s: true }, moveShoot: { m: true, t: false, s: true } };

/** The union of the piece's own squares and lines and its "moves like" piece's, while that When holds. */
export function patternOf(d: DesignSpec, board: Uint8Array, from: number, st?: TryState) {
  const like = d.like && d.rules.some(r => r.does.a === 'movesLike' && holds(r.when, board, from, st));
  const can = new Map<string, Can & { x: number; y: number }>();
  const lines = new Set<Dir>(d.lines);
  for (const src of like ? [d, d.like!] : [d]) {
    for (const s of src.squares) {
      const k = `${s.x},${s.y}`, o = can.get(k) ?? { x: s.x, y: s.y, m: false, t: false, s: false }, n = CAN[s.mark];
      can.set(k, { ...o, m: o.m || n.m, t: o.t || n.t, s: o.s || n.s });
    }
    for (const l of src.lines) lines.add(l);
  }
  return { can, lines };
}

/** The shelter level of the engine's `sheltered` for a design on `s` whose "cannot be taken" When reads its square:
 *  1 (no pawn takes it), 4 (only a king takes it) or 0. An "always" rule is in `canCapture`. */
export function shelterOf(d: DesignSpec, board: Uint8Array, s: number): number {
  const r = d.rules.find(r => r.does.a === 'cannotBeTaken');
  return r?.does.a === 'cannotBeTaken' && r.when.on !== 'always' && holds(r.when, board, s) ? (r.does.by === 'pawns' ? 1 : 4) : 0;
}

/**
 * A target that a rule refuses: a take that "cannot take" or the engine (`canCapture`: the guard's table rule) forbids, or a
 * king that a chain, a push or a swap may not touch. `why` names the rule's ability, or the table rule; `caps` are a
 * chain's takes before this one (none for a first take).
 */
export interface Refused { sq: number; why: 'cannotTake' | 'guardImmune' | 'chain' | 'push' | 'swap'; caps: number[] }

/**
 * Pseudo-legal moves of design `d` for the piece on `from` (its colour is the board's), as engine `Move`s, by the engine's
 * modes: `attacks` gives the first takes and the shots only, `captures` gives no quiet move. `refused` gets the refused
 * targets; `st` is the Try board's state (in a game, the byte's `SPENT`).
 */
export function genDesigned(board: Uint8Array, from: number, mode: GenMode, out: Move[], d: DesignSpec, refused?: Refused[], st: TryState = inGame(board, from)): void {
  const c = colorOf(board[from]) as Color, dy = c === BLACK ? -1 : 1, att = (board[from] & ~15) | T, quiet = mode === 'all';
  const on = (a: Rule['does']['a']) => d.rules.find(r => r.does.a === a && holds(r.when, board, from, st))?.does;
  const pass = on('linesPass'), no = on('cannotTake'), chain = mode !== 'attacks' && on('chain'), rem = on('removedAfter'), bec = d.rules.find(r => r.does.a === 'becomes');
  const { can, lines } = patternOf(d, board, from, st);
  /** The rule that forbids a take of a piece of type vt, or null. */
  const takes = (vt: PieceType): Refused['why'] | null => no?.a === 'cannotTake' && (no.what === 'any' || (no.what === 'king' && vt === K) || (no.what === 'pawns' && vt === P)) ? 'cannotTake'
    : canCapture(att, vt) ? null : 'guardImmune';
  /** An enemy on s that the piece may take; a refused one goes to the sink. */
  const enemy = (b: Uint8Array, s: number, caps: number[] = []): boolean => {
    if (s < 0 || !b[s] || colorOf(b[s]) === c) return false;
    const why = takes(typeOf(b[s]));
    if (why) refused?.push({ sq: s, why, caps });
    return !why;
  };
  const n0 = out.length;
  const kill = (caps: number[]): boolean => rem?.a === 'removedAfter' && caps.some(s => rem.what === 'any' || typeOf(board[s]) !== P);
  /** Captures by moving from `at` on board `b` (squares with take, and lines), after the chain's takes `caps`. */
  const reach = (b: Uint8Array, at: number, caps: number[], fn: (to: number) => void): void => {
    for (const q of can.values()) if (q.t) { const to = step(at, q.x, q.y * dy); if (enemy(b, to, caps)) fn(to); }
    for (const l of lines) {
      const [x, y] = DIR[l];
      for (let to = step(at, x, y * dy); to >= 0; to = step(to, x, y * dy)) {
        const v = b[to];
        if (!v) continue;
        if (colorOf(v) === c) { if (pass) continue; break; }
        if (enemy(b, to, caps)) fn(to);
        if (pass?.a === 'linesPass' && pass.over === 'any') continue;
        break;
      }
    }
  };
  const push = (m: Move): void => {
    if (m.captures.length && kill(m.captures)) m.selfRemove = true;
    out.push(m);
  };
  const chainFrom = (b: Uint8Array, caps: number[]): void => {
    const last = caps[caps.length - 1];
    if (!chain || typeOf(b[last]) === K || kill(caps)) return;
    const sc = new Uint8Array(b);
    sc[last] = 0;
    sc[from] = 0; // the piece has left its square: a line may cross it
    const seen = new Set<number>();
    reach(sc, last, caps, to => {
      if (typeOf(sc[to]) === K) { refused?.push({ sq: to, why: 'chain', caps }); return; } // a chain may not continue onto a king
      if (seen.has(to)) return;
      seen.add(to);
      const next = [...caps, to];
      push({ from, to, captures: next });
      chainFrom(sc, next);
    });
  };
  for (const q of can.values()) {
    const to = step(from, q.x, q.y * dy);
    if (to < 0) continue;
    if (!board[to]) { if (q.m && quiet) push({ from, to, captures: [] }); }
    else if (q.s && enemy(board, to)) push({ from, to: from, captures: [to] });
  }
  if (quiet) for (const l of lines) {
    const [x, y] = DIR[l];
    for (let to = step(from, x, y * dy); to >= 0; to = step(to, x, y * dy)) if (!board[to]) push({ from, to, captures: [] }); else {
      if (colorOf(board[to]) === c) { if (pass) continue; break; }
      if (pass?.a === 'linesPass' && pass.over === 'any') continue;
      break;
    }
  }
  const seen = new Set<number>();
  reach(board, from, [], to => { if (!seen.has(to)) { seen.add(to); push({ from, to, captures: [to] }); chainFrom(board, [to]); } });
  if (quiet && on('step2')) {
    const s1 = step(from, 0, dy), s2 = step(from, 0, 2 * dy);
    if (s1 >= 0 && s2 >= 0 && !board[s1] && !board[s2] && !out.some((m, i) => i >= n0 && m.to === s2 && !m.captures.length)) push({ from, to: s2, captures: [] });
  }
  const sw = on('swap'), pu = on('push');
  if (quiet) for (const [x, y] of NEAR) {
    const n = step(from, x, y * dy), v = n >= 0 ? board[n] : 0;
    if (!v) continue;
    const king = typeOf(v) === K, beyond = step(n, x, y * dy); // never a king: the sink gets the refusal
    if (sw?.a === 'swap' && (colorOf(v) === c) === (sw.with === 'friend')) {
      if (king) refused?.push({ sq: n, why: 'swap', caps: [] }); else out.push({ from, to: n, captures: [], swap: true });
    }
    if (pu?.a === 'push' && beyond >= 0 && !board[beyond]) {
      if (king) refused?.push({ sq: n, why: 'push', caps: [] }); else out.push({ from, to: pu.then === 'follow' ? n : from, captures: [], shove: { from: n, to: beyond } });
    }
  }
  if (bec?.does.a !== 'becomes') return;
  const into: PieceType[] = (bec.does.into === 'choice' ? ['Q', 'R', 'B', 'N'] : [bec.does.into]).map(b => LETTERS.indexOf(b) as PieceType), last = c === BLACK ? 0 : 7;
  const mine = out.splice(n0);
  for (const m of mine) {
    const fires = !m.selfRemove && !m.swap && (bec.when.on === 'firstTake' ? m.captures.length > 0 && !st.captured : rank(m.to) === last && m.to !== from);
    if (fires) for (const promo of into) out.push({ ...m, promo }); else out.push(m);
  }
}
