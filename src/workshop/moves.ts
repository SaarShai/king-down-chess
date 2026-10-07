/**
 * The moves of a Workshop design on a board (revision 3 §8.1): what Try it shows, and the
 * oracle build 2 must match. It reads the engine's board bytes and never calls the engine's move
 * generator, so the engine, the AI and the save have no new code path (§7.1).
 * "Revision 3" and the section numbers (§, W) cite docs/visual-design/workshop/WORKSHOP-revision-3-2026-10-07.md.
 */
import { BLACK, G, K, P, RULES, colorOf, file, rank, sq, typeOf, type Color, type Move, type PieceType } from '../rules/engine';
import { DIR, presetOf, type Body, type Dir, type PieceDesign, type Rule, type Square, type When } from './model';

type D = Pick<PieceDesign, 'squares' | 'lines' | 'rules'>;
/** What Try it tracks: the move counter, a first capture, and "Pretend your opponent played a card". */
export interface TryState { move: number; captured: boolean; card: boolean }
export const START: TryState = { move: 1, captured: false, card: false };
export const CAPITAL: readonly number[] = [27, 28, 35, 36];
export const BODY_TYPE: Record<Body, PieceType> = { P: 1, N: 2, B: 3, R: 4, Q: 5, A: 7, L: 8, G: 9, M: 10, S: 11, O: 12 };
const PROMO: Record<string, PieceType[]> = { choice: [5, 4, 3, 2], Q: [5], R: [4], B: [3], N: [2], A: [7] };
const LIKE: Record<string, D> = { king: { squares: presetOf('maester').squares, lines: [], rules: [] },
  knight: presetOf('knight'), bishop: presetOf('bishop'), rook: presetOf('rook'), queen: presetOf('queen') };

const step = (s: number, df: number, dr: number): number => {
  const f = file(s) + df, r = rank(s) + dr;
  return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : sq(f, r);
};
const NEAR: readonly [number, number][] = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];

/** Does a state rule's When hold for the piece on `from` now? Events always "hold": the move decides. */
export function holds(w: When, board: Uint8Array, from: number, st: TryState): boolean {
  const c = colorOf(board[from]), r = c === BLACK ? 7 - rank(from) : rank(from);
  switch (w.on) {
    case 'zone': return w.zone === 'startRank' ? r === 1 : w.zone === 'ownHalf' ? r <= 3 : w.zone === 'enemyHalf' ? r >= 4 : w.zone === 'lastRank' ? r === 7 : CAPITAL.includes(from);
    case 'near': return NEAR.some(([x, y]) => {
      const n = step(from, x, y), v = n >= 0 ? board[n] : 0;
      if (!v) return false;
      return w.who === 'enemy' ? colorOf(v) !== c : colorOf(v) === c && (w.who === 'friend' || typeOf(v) === (w.who === 'king' ? K : BODY_TYPE[w.who]));
    });
    case 'fromMove': return st.move >= w.n;
    case 'beforeMove': return st.move < w.n;
    case 'afterFirstCapture': return st.captured;
    case 'afterCard': return st.card;
    default: return true;
  }
}

interface Can { m: boolean; t: boolean; s: boolean }
const CAN: Record<Square['mark'], Can> = { both: { m: true, t: true, s: false }, move: { m: true, t: false, s: false }, take: { m: false, t: true, s: false }, shoot: { m: false, t: false, s: true }, moveShoot: { m: true, t: false, s: true } };

/** Pseudo-legal moves of design `d` for the piece on `from` (its colour is the board's), as engine `Move`s. */
export function movesOf(d: D, board: Uint8Array, from: number, st: TryState = START): Move[] {
  const c = colorOf(board[from]) as Color, dy = c === BLACK ? -1 : 1;
  const on = (a: Rule['does']['a']) => d.rules.find(r => r.does.a === a && holds(r.when, board, from, st))?.does;
  const like = on('movesLike'), pass = on('linesPass'), no = on('cannotTake'), chain = on('chain'), rem = on('removedAfter'), bec = d.rules.find(r => r.does.a === 'becomes');
  // The union of the piece's own squares and lines and a "moves like" piece's.
  const can = new Map<string, Can & { x: number; y: number }>();
  const lines = new Set<Dir>(d.lines);
  for (const src of like?.a === 'movesLike' ? [d, LIKE[like.as]] : [d]) {
    for (const s of src.squares) {
      const k = `${s.x},${s.y}`, o = can.get(k) ?? { x: s.x, y: s.y, m: false, t: false, s: false }, n = CAN[s.mark];
      can.set(k, { ...o, m: o.m || n.m, t: o.t || n.t, s: o.s || n.s });
    }
    for (const l of src.lines) lines.add(l);
  }
  const takes = (vt: PieceType): boolean => !(RULES.guardImmune && vt === G) && !(no?.a === 'cannotTake' && (no.what === 'any' || (no.what === 'king' && vt === K) || (no.what === 'pawns' && vt === P)));
  const enemy = (b: Uint8Array, s: number): boolean => s >= 0 && !!b[s] && colorOf(b[s]) !== c && takes(typeOf(b[s]));
  const out: Move[] = [];
  const kill = (caps: number[]): boolean => rem?.a === 'removedAfter' && caps.some(s => rem.what === 'any' || typeOf(board[s]) !== P);
  /** Captures by moving from `at` on board `b` (squares with take, and lines). */
  const reach = (b: Uint8Array, at: number, fn: (to: number) => void): void => {
    for (const q of can.values()) if (q.t) { const to = step(at, q.x, q.y * dy); if (enemy(b, to)) fn(to); }
    for (const l of lines) {
      const [x, y] = DIR[l];
      for (let to = step(at, x, y * dy); to >= 0; to = step(to, x, y * dy)) {
        const v = b[to];
        if (!v) continue;
        if (colorOf(v) === c) { if (pass) continue; break; }
        if (takes(typeOf(v))) fn(to);
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
    reach(sc, last, to => {
      if (seen.has(to) || typeOf(sc[to]) === K) return; // a chain may not continue onto a king
      seen.add(to);
      const next = [...caps, to];
      push({ from, to, captures: next });
      chainFrom(sc, next);
    });
  };
  for (const q of can.values()) {
    const to = step(from, q.x, q.y * dy);
    if (to < 0) continue;
    if (!board[to]) { if (q.m) push({ from, to, captures: [] }); }
    else if (enemy(board, to) && q.s) push({ from, to: from, captures: [to] });
  }
  for (const l of lines) {
    const [x, y] = DIR[l];
    for (let to = step(from, x, y * dy); to >= 0; to = step(to, x, y * dy)) if (!board[to]) push({ from, to, captures: [] }); else {
      if (colorOf(board[to]) === c) { if (pass) continue; break; }
      if (pass?.a === 'linesPass' && pass.over === 'any') continue;
      break;
    }
  }
  const seen = new Set<number>();
  reach(board, from, to => { if (!seen.has(to)) { seen.add(to); push({ from, to, captures: [to] }); chainFrom(board, [to]); } });
  if (on('step2')) {
    const s1 = step(from, 0, dy), s2 = step(from, 0, 2 * dy);
    if (s1 >= 0 && s2 >= 0 && !board[s1] && !board[s2] && !out.some(m => m.to === s2 && !m.captures.length)) push({ from, to: s2, captures: [] });
  }
  const sw = on('swap'), pu = on('push');
  for (const [x, y] of NEAR) {
    const n = step(from, x, y * dy), v = n >= 0 ? board[n] : 0;
    if (!v || typeOf(v) === K) continue;
    if (sw?.a === 'swap' && (colorOf(v) === c) === (sw.with === 'friend')) out.push({ from, to: n, captures: [], swap: true });
    const beyond = step(n, x, y * dy);
    if (pu?.a === 'push' && beyond >= 0 && !board[beyond]) out.push({ from, to: pu.then === 'follow' ? n : from, captures: [], shove: { from: n, to: beyond } });
  }
  if (bec?.does.a !== 'becomes') return out;
  const into = PROMO[bec.does.into], last = c === BLACK ? 0 : 7;
  return out.flatMap(m => {
    const fires = !m.selfRemove && !m.swap && (bec.when.on === 'firstTake' ? m.captures.length > 0 && !st.captured : rank(m.to) === last && m.to !== from);
    return fires ? into.map(promo => ({ ...m, promo })) : [m];
  });
}
