/**
 * King Down Chess rules engine (single source of truth).
 * Board: 64 cells, a1 = 0 … h8 = 63; file = sq & 7, rank = sq >> 3. White moves up (+rank).
 * Standard chess + 5 King Down fairy pieces. No castling, no en passant (King Down Classic default).
 *
 * Every rule the balance lab varies lives in `./rules.ts` as one module-level object, `RULES`.
 * Read that file's header for why it is module state and not a field on `Position`. With no call
 * to `setRules` the defaults apply, which is exactly the game the browser plays today.
 */

import { ArcherShots, PowerName, RULES, Rules } from './rules';
export type { ArcherMove, ArcherShots, BeastCapture, BeastMove, CatapultCapture, GuardCaptures, KingChoice, KingName, OgreMode, PaladinKamikaze, PowerName, PromotionSet, Rules, StrikeMode } from './rules';
export { BUILT, DEFAULT_RULES, KINGS, RULES, RULES_2017, RULES_2021, TIER1, kingLabel, parseKing, parseKings, parseRule, ruleDiff, setRules } from './rules';

export type Color = 0 | 1;
export const WHITE: Color = 0;
export const BLACK: Color = 1;

export const P = 1, N = 2, B = 3, R = 4, Q = 5, K = 6, A = 7, L = 8, G = 9, M = 10, S = 11, O = 12, C = 13, V = 14, T = 15;
export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
/** Letter per piece type (index = type). A=archer L=paladin G=guard M=maester S=beast O=ogre C=catapult V=reaver. */
export const LETTERS = ' PNBRQKALGMSOCVT';
export const NAMES = ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king', 'archer', 'paladin', 'guard', 'maester', 'beast', 'ogre', 'catapult', 'reaver', 'templar'] as const;
/**
 * Promotion targets. The ogre and the catapult are **not** here: they are lab pieces that enter a
 * game only through `--pool` or an explicit back rank, and adding them would hand every shipped
 * game two promotion choices it does not have today.
 */
export const PROMOTIONS: readonly PieceType[] = [Q, R, B, N, A, L, G, M, S];
/**
 * Promotion targets per `Rules.promotionSet`. `standard` and `anyNonKingNoFairy` name the same
 * four pieces while every non-fairy piece is also a standard one; both names exist so a run says
 * which rule it tested.
 */
const PROMOTION_SETS: Record<string, readonly PieceType[]> = {
  anyNonKing: PROMOTIONS,
  standard: [Q, R, B, N],
  anyNonKingNoFairy: [Q, R, B, N],
  // The designer's 2026-09-13 call: a pawn never becomes a wall.
  anyNonKingNoGuard: PROMOTIONS.filter(t => t !== G),
};

/**
 * A guard that has spent its one lifetime capture (`Rules.guardCaptureLimit`). Bit 5 of the piece
 * byte: types own the low 4 bits and colour is bit 4, so this is the first free one. `typeOf` and
 * `colorOf` mask it off, `toFen` writes it as `H`/`h`, and `zIndex` hashes it.
 */
export const SPENT = 32;

export const piece = (t: PieceType, c: Color): number => t | (c << 4);
export const typeOf = (p: number): PieceType => (p & 15) as PieceType;
export const colorOf = (p: number): Color => ((p >> 4) & 1) as Color;
export const file = (s: number): number => s & 7;
export const rank = (s: number): number => s >> 3;
export const sq = (f: number, r: number): number => (r << 3) | f;
export const sqName = (s: number): string => 'abcdefgh'[file(s)] + (rank(s) + 1);
export const parseSq = (n: string): number => sq(n.charCodeAt(0) - 97, n.charCodeAt(1) - 49);

export interface Move {
  from: number;
  /** Landing square. Equals `from` for archer shots. For beast chains: the last victim square. */
  to: number;
  /** Squares emptied of enemy pieces, in order (beast chains list every victim). */
  captures: number[];
  /** Maester: the friendly piece on `to` moves to `from`. */
  swap?: boolean;
  /**
   * Ogre: the piece standing on `shove.from` is pushed to `shove.to` (one square straight away from
   * the Ogre, onto an empty board square). Never a capture and never a king. The Ogre's own square
   * is `to` as usual — equal to `from` under `ogreMode: 'repel'`, equal to `shove.from` under
   * `'push'` — so no make/unmake path needs to know which reading is in force.
   */
  shove?: { from: number; to: number };
  /** Paladin: the mover leaves the board after capturing. */
  selfRemove?: boolean;
  /**
   * Strike (Flame A, tier 2): the side's one queen-like action by a non-king piece. Under
   * `strikeMode: 'move'` the piece moves as a queen; under `'capture'` it takes a queen-reach victim
   * without moving (`to === from`). Either way it keeps its own type (a pawn never promotes) and the
   * side's flag in `Position.strike` is spent.
   */
  strike?: boolean;
  promo?: PieceType;
}

export interface Position {
  board: Uint8Array;
  turn: Color;
  /** Plies since the last capture or pawn move (50-move rule). */
  halfmove: number;
  ply: number;
  /**
   * Strike (Flame A): per side, whether the one queen-like action has been used. Absent = neither.
   * Game state, not a rule: it travels with the position (FEN field 7) and `positionKey` folds it
   * in, so two boards that differ only by a spent Strike are not the same position to repetition.
   */
  strike?: readonly [boolean, boolean];
}

type Delta = readonly [number, number];
const DIRS8: readonly Delta[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
/** The four capital squares: d4 e4 d5 e5 (the Templar's queen squares, lab). */
const CAPITAL: readonly number[] = [27, 28, 35, 36];
const ORTHO = DIRS8.slice(0, 4);
const DIAG = DIRS8.slice(4);
const KNIGHT: readonly Delta[] = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
/** Archer "rifle" targets: diagonally adjacent, or two squares away orthogonally (blockers ignored). */
const ARCHER_SHOTS: readonly Delta[] = [[1, 1], [1, -1], [-1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
/** Every square at Chebyshev distance 2 (the 16-square ring), for `archerShots: 'ring2'`. */
const RING2: readonly Delta[] = [-2, -1, 0, 1, 2].flatMap(df => [-2, -1, 0, 1, 2]
  .filter(dr => Math.max(Math.abs(df), Math.abs(dr)) === 2).map(dr => [df, dr] as Delta));
/**
 * Shot tables per `Rules.archerShots`. Each one is closed under negation, which `isAttacked` needs:
 * it walks the same deltas *from the target* to find the shooter.
 */
const ARCHER_SHOT_SETS: Record<ArcherShots, readonly Delta[]> = {
  classic: ARCHER_SHOTS,
  plusDiag2: [...ARCHER_SHOTS, [2, 2], [2, -2], [-2, 2], [-2, -2]],
  ring2: [...DIAG, ...RING2],
  // The 2021 concept: the two forward diagonals and the square two ahead. Written from White's
  // view, because it is the one set that is *not* closed under negation.
  forward3: [[1, 1], [-1, 1], [0, 2]],
  // The two forward diagonals at distance 2, on top of classic: the measured middle ground between
  // classic and plusDiag2 (docs/research/sim-piece-balance-2026-09-17.md).
  plusDiagFwd2: [...ARCHER_SHOTS, [2, 2], [-2, 2]],
};
/** Sets written from White's view; the Black reading mirrors the rank delta. */
const FORWARD_SETS: Partial<Record<ArcherShots, readonly Delta[]>> = {
  forward3: ARCHER_SHOT_SETS.forward3,
  plusDiagFwd2: ARCHER_SHOT_SETS.plusDiagFwd2,
};
const mirrored = (set: readonly Delta[]): readonly Delta[] => set.map(([df, dr]) => [df, -dr] as Delta);
/** An archer's shot deltas seen from the archer. `forward3` and `plusDiagFwd2` depend on colour. */
const archerShotsFor = (c: Color): readonly Delta[] => {
  const forward = FORWARD_SETS[RULES.archerShots];
  if (forward) return c === BLACK ? mirrored(forward) : forward;
  return ARCHER_SHOT_SETS[RULES.archerShots];
};

/** `archerMove: 'fwdBack'` — 1 ahead or 1 back. The pair is the same two squares for either colour. */
const VERTICAL: readonly Delta[] = [[0, 1], [0, -1]];
/** `beastCapture: 'diagForward'` — the two forward diagonals, per colour. */
const DIAG_FWD: readonly [readonly Delta[], readonly Delta[]] = [[[1, 1], [-1, 1]], [[1, -1], [-1, -1]]];

function step(s: number, df: number, dr: number): number {
  const f = file(s) + df, r = rank(s) + dr;
  return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : sq(f, r);
}
const fwd = (c: Color): number => (c === WHITE ? 1 : -1);
/**
 * `guardNoSecondRank` / `guardNoCapital`: may the guard `p` finish a move on `to`? The first bans
 * its own second rank (rank 2 / rank 7), the second the capital (d4 e4 d5 e5). Landing bans only,
 * never starting ones — and the one predicate `isAttacked` and the maester swaps share.
 */
const guardMayLand = (p: number, to: number): boolean => {
  if (typeOf(p) !== G) return true;
  if (RULES.guardNoSecondRank && rank(to) === (colorOf(p) === WHITE ? 1 : 6)) return false;
  return !RULES.guardNoCapital || !CAPITAL.includes(to);
};
/** King-move distance: 1 = adjacent. Tells a long swap from the one the 8 neighbours already made. */
const chebyshev = (a: number, b: number): number => Math.max(Math.abs(file(a) - file(b)), Math.abs(rank(a) - rank(b)));
/**
 * The power side `c` plays, or `''` for a plain king (docs/RULES.md §4). One array index and one
 * null test, so it costs what `RULES.archerShots` costs — see `./rules.ts` for why the rule set is
 * module state. The six tier-1 powers are stateless, so this is the *whole* of their state.
 */
const powerOf = (c: Color): PowerName | '' => RULES.kings[c]?.power ?? '';

/**
 * May the attacker `att` remove a piece of type `vic`? Guard captures nothing and is taken only by
 * a king; a paladin never takes a king. `att` is a whole piece byte, so a guard carrying `SPENT`
 * has used up `guardCaptureLimit`; a bare `PieceType` is the same byte with no flags.
 */
export function canCapture(att: number, vic: PieceType): boolean {
  const at = typeOf(att);
  // A pawn-clearing guard still cannot take a king, so it still never checks and still cannot mate.
  if (at === G && (RULES.guardCaptures === 'none' || (RULES.guardCaptures === 'pawns' && vic !== P))) return false;
  if (at === G && RULES.guardCaptureLimit && (att & SPENT)) return false;
  if (vic === G && RULES.guardImmune) return at === K;
  // Mercy (Spirit B): this king captures nothing — **except a guard**, which only a king may ever
  // take (plan decision 15: a piece may be hard to take, never impossible; a permanently immortal
  // guard is the measured draw engine). Stated here and not in `genPiece`, so `isAttacked` follows
  // for nothing: its DIRS8 loop asks `canCapture` for the king like every other piece.
  if (at === K && vic !== G && powerOf(colorOf(att)) === 'Mercy') return false;
  // Holy Light (Spirit A): no enemy pawn takes this side's king, and this king takes no pawn. A
  // capture is always cross-colour, so the victim's side is `colorOf(att) ^ 1` and one byte decides
  // both directions. The guard is untouched: a Spirit king still takes one (§1.9).
  if (at === P && vic === K && powerOf((colorOf(att) ^ 1) as Color) === 'HolyLight') return false;
  if (at === K && vic === P && powerOf(colorOf(att)) === 'HolyLight') return false;
  if (vic === K) return (at !== L || RULES.paladinChecks) && (RULES.archerChecks || at !== A);
  return true;
}

export function findKing(board: Uint8Array, c: Color): number {
  return board.indexOf(piece(K, c));
}

/** all = every pseudo-legal move; captures = only moves that remove something (chains included); attacks = first-level captures only. */
export type GenMode = 'all' | 'captures' | 'attacks';

function leaper(board: Uint8Array, from: number, c: Color, att: number, deltas: readonly Delta[], mode: GenMode, out: Move[]): void {
  for (const [df, dr] of deltas) {
    const to = step(from, df, dr);
    if (to < 0) continue;
    const v = board[to];
    if (!v) { if (mode === 'all') out.push({ from, to, captures: [] }); }
    else if (colorOf(v) !== c && canCapture(att, typeOf(v))) out.push({ from, to, captures: [to] });
  }
}

/**
 * Rook, bishop and queen rays — and therefore the whole seam of **Leap** (Mud B): a slider of a
 * Mud:Leap side passes over its **own pawns**, and every other blocker still stops the ray. The
 * paladin jumps friends already (`case L`) and a one-stepper has no ray, so nothing else changes.
 *
 * Move and capture are the same ray here, so Leap is the one tier-1 power that **does** change the
 * attack set: `isAttacked`'s hand-written mirror of this walk carries the same condition, and
 * `crossCheckAttacks()` is what proves the two have not drifted.
 */
function slider(board: Uint8Array, from: number, c: Color, att: number, dirs: readonly Delta[], mode: GenMode, out: Move[]): void {
  const leap = powerOf(c) === 'Leap';
  for (const [df, dr] of dirs) {
    for (let to = step(from, df, dr); to >= 0; to = step(to, df, dr)) {
      const v = board[to];
      if (!v) { if (mode === 'all') out.push({ from, to, captures: [] }); continue; }
      if (leap && colorOf(v) === c && typeOf(v) === P) continue;
      if (colorOf(v) !== c && canCapture(att, typeOf(v))) out.push({ from, to, captures: [to] });
      break;
    }
  }
}

/** The unfiltered switch behind `genPiece`; see the exported wrapper for the C2 filter. */
function genPieceRaw(board: Uint8Array, from: number, mode: GenMode, out: Move[]): void {
  const p = board[from];
  const c = colorOf(p), t = typeOf(p);
  switch (t) {
    case P: {
      const dr = fwd(c), startRank = c === WHITE ? 1 : 6, lastRank = c === WHITE ? 7 : 0;
      const push = (to: number, captures: number[]) => {
        if (rank(to) === lastRank) for (const promo of PROMOTION_SETS[RULES.promotionSet]) out.push({ from, to, captures, promo });
        else out.push({ from, to, captures });
      };
      // **Darkness** (Shadow B): the pawn's two verbs swap — it steps on the forward diagonals and
      // captures straight ahead — and the double first step is gone. Promotion follows on its own,
      // because `push()` promotes by rank and both paths call it. The matching branch is the pawn
      // walk in `isAttacked`, which is the only other place that knows where a pawn takes from.
      if (powerOf(c) === 'Darkness') {
        if (mode === 'all') for (const df of [-1, 1]) {
          const to = step(from, df, dr);
          if (to >= 0 && !board[to]) push(to, []);
        }
        const ahead = step(from, 0, dr);
        if (ahead >= 0 && board[ahead] && colorOf(board[ahead]) !== c && canCapture(p, typeOf(board[ahead]))) push(ahead, [ahead]);
        return;
      }
      if (mode === 'all') {
        const s1 = step(from, 0, dr);
        if (s1 >= 0 && !board[s1]) {
          push(s1, []);
          // **March** (Mud A): the double step from *any* rank, both squares empty. Dropping the
          // home-rank test is the whole power — and it is why the second square goes through
          // `push()` too: from rank 6 a marching pawn lands on the last rank and must promote,
          // which the home-rank-only step could never reach.
          const s2 = step(from, 0, 2 * dr);
          if ((powerOf(c) === 'March' || rank(from) === startRank) && s2 >= 0 && !board[s2]) push(s2, []);
        }
      }
      // **C4** (`pawnCapitalCapture`, `docs/MATRIX.md` §B.2): a pawn standing in the capital
      // (d4 e4 d5 e5) may also take **straight ahead**. `push()` is the ordinary advance's own
      // path, so a capture that reached the last rank would promote exactly like a push. The move
      // is generated for `all` and `captures` but never for `attacks`: a straight capture is a
      // move, not a new attack, so `isAttacked` keeps the pawn's ordinary two diagonals (the same
      // deliberate check-detection split as `capitalSanctuary`).
      if (RULES.pawnCapitalCapture && mode !== 'attacks' && CAPITAL.includes(from)) {
        const ahead = step(from, 0, dr);
        if (ahead >= 0 && board[ahead] && colorOf(board[ahead]) !== c && canCapture(p, typeOf(board[ahead]))) push(ahead, [ahead]);
      }
      for (const df of [-1, 1]) {
        const to = step(from, df, dr);
        // The real piece byte, not the bare type: `canCapture` reads the attacker's colour off it,
        // which is how Holy Light knows whose king a pawn may not take.
        if (to >= 0 && board[to] && colorOf(board[to]) !== c && canCapture(p, typeOf(board[to]))) push(to, [to]);
      }
      return;
    }
    case N: return leaper(board, from, c, p, KNIGHT, mode, out);
    case K: {
      // **Mercy** (Spirit B): 1 or 2 squares in any direction, jumping its own pieces and stopped
      // by enemies (decision 14 — the paladin's shape, capped at 2), capturing nothing but a guard
      // (decision 15). The capture is the ordinary adjacent king capture that `canCapture` has
      // already narrowed to guards, so `isAttacked` needs no branch: the two-square reach is
      // move-only and adds no attacked square.
      if (powerOf(c) === 'Mercy') {
        for (const [df, dr] of DIRS8) {
          const one = step(from, df, dr);
          if (one < 0) continue;
          const v = board[one];
          if (v) {
            // An enemy stops the ray (and may be taken only if it is a guard); a friend is jumped.
            if (colorOf(v) !== c) { if (canCapture(p, typeOf(v))) out.push({ from, to: one, captures: [one] }); continue; }
          } else if (mode === 'all') out.push({ from, to: one, captures: [] });
          const two = step(one, df, dr);
          if (two >= 0 && !board[two] && mode === 'all') out.push({ from, to: two, captures: [] });
        }
        return;
      }
      // **Death Touch** (Shadow A): the king takes an adjacent enemy without leaving its square —
      // the archer's rifle shape, `to === from`, which every make/unmake path, `toLan` and even
      // `clickPath` in the HUD already handle. Decision 12: the shot **replaces** the displacement
      // capture, so the steps are move-only. Decision 13: the victim may be defended, because the
      // king never enters its square. `isAttacked` needs nothing — the shot covers exactly the 8
      // squares the king attacked before.
      if (powerOf(c) === 'DeathTouch') {
        for (const [df, dr] of DIRS8) {
          const to = step(from, df, dr);
          if (to < 0) continue;
          const v = board[to];
          if (!v) { if (mode === 'all') out.push({ from, to, captures: [] }); }
          else if (colorOf(v) !== c && canCapture(p, typeOf(v))) {
            out.push({ from, to: from, captures: [to] }); // the shot
            // The second reading (`deathTouchMoves`): keep the displacement capture as well.
            if (RULES.deathTouchMoves) out.push({ from, to, captures: [to] });
          }
        }
        return;
      }
      return leaper(board, from, c, p, DIRS8, mode, out);
    }
    case G: {
      const n0 = out.length;
      leaper(board, from, c, p, DIRS8, mode, out); // with guardCaptures='none' (or a spent guard) canCapture is false → empty squares only
      // guardStep=2 adds the second square of each ray, and guardDoubleFirst does the same for a guard
      // on its home rank only (`leap` also over an occupied middle square). guardCapitalStep gives the
      // same second square to a guard standing in the capital (C3, docs/MATRIX.md §B.2). All are
      // move-only: a capture stays adjacent, so `isAttacked` does not change with any of them.
      const fromHome = RULES.guardDoubleFirst !== 'off' && rank(from) === (c === WHITE ? 0 : 7);
      const fromCapital = RULES.guardCapitalStep && CAPITAL.includes(from);
      if ((RULES.guardStep === 2 || fromHome || fromCapital) && mode === 'all') for (const [df, dr] of DIRS8) {
        const mid = step(from, df, dr);
        if (mid < 0 || (board[mid] && !(fromHome && RULES.guardDoubleFirst === 'leap'))) continue;
        const to = step(mid, df, dr);
        if (to >= 0 && !board[to]) out.push({ from, to, captures: [] });
      }
      // One filter over everything this guard just generated, so no branch above has to know.
      if (RULES.guardNoSecondRank || RULES.guardNoCapital) for (let i = out.length - 1; i >= n0; i--) if (!guardMayLand(p, out[i].to)) out.splice(i, 1);
      return;
    }
    case B: return slider(board, from, c, p, DIAG, mode, out);
    case R: return slider(board, from, c, p, ORTHO, mode, out);
    case Q: return slider(board, from, c, p, DIRS8, mode, out);
    case A: {
      // Steps are move-only under every archerMove: the archer never captures by displacement (an
      // orthogonally adjacent enemy is neither a step target nor a shot target), so isAttacked()
      // only needs the shot table.
      const steps = RULES.archerMove === 'any' ? DIRS8 : RULES.archerMove === 'fwdBack' ? VERTICAL : ORTHO;
      if (mode === 'all') for (const [df, dr] of steps) { const to = step(from, df, dr); if (to >= 0 && !board[to]) out.push({ from, to, captures: [] }); }
      for (const [df, dr] of archerShotsFor(c)) {
        const target = step(from, df, dr);
        if (target >= 0 && board[target] && colorOf(board[target]) !== c && canCapture(A, typeOf(board[target]))) out.push({ from, to: from, captures: [target] });
      }
      return;
    }
    case L: {
      // Queen-like rays; jumps over friendly pieces, stopped by enemies; kamikaze on capture.
      for (const [df, dr] of DIRS8) {
        for (let to = step(from, df, dr); to >= 0; to = step(to, df, dr)) {
          const v = board[to];
          if (!v) { if (mode === 'all') out.push({ from, to, captures: [] }); continue; }
          if (colorOf(v) === c) { if (RULES.paladinJumpsFriends) continue; break; }
          if (canCapture(L, typeOf(v))) {
            // "The charge" (`paladinReturn`): it comes home, which on the board is the archer's
            // rifle shape — `to === from`, the victim in `captures` — so every make/unmake and the
            // LAN round-trip already handle it. Coming home and dying are the two ways of not
            // staying, so the return wins over `paladinKamikaze`.
            if (RULES.paladinReturn) out.push({ from, to: from, captures: [to] });
            else {
              const m: Move = { from, to, captures: [to] };
              if (RULES.paladinKamikaze === 'always' || (RULES.paladinKamikaze === 'nonPawn' && typeOf(v) !== P)) m.selfRemove = true;
              out.push(m);
            }
          }
          if (RULES.paladinBlockedByEnemies) break;
        }
      }
      return;
    }
    case M: {
      for (const [df, dr] of DIRS8) {
        const to = step(from, df, dr);
        if (to < 0) continue;
        const v = board[to];
        if (!v) { if (mode === 'all') out.push({ from, to, captures: [] }); }
        else if (colorOf(v) !== c) {
          if (canCapture(M, typeOf(v))) out.push({ from, to, captures: [to] });
          // Trading places is not a capture, so it adds no attack and `isAttacked` is untouched.
          if (mode === 'all' && RULES.maesterSwapEnemy && typeOf(v) !== K) out.push({ from, to, captures: [], swap: true });
        }
        else if (mode === 'all' && guardMayLand(v, from)) out.push({ from, to, captures: [], swap: true });
      }
      // The second square of each ray, move-only and through an empty square, like `guardStep`.
      if (RULES.maesterStep === 2 && mode === 'all') for (const [df, dr] of DIRS8) {
        const mid = step(from, df, dr);
        if (mid < 0 || board[mid]) continue;
        const to = step(mid, df, dr);
        if (to >= 0 && !board[to]) out.push({ from, to, captures: [] });
      }
      if (mode === 'all' && RULES.maesterSwapAny) {
        // The long swap generalised to every friendly piece. The king is not in it: it keeps the
        // `maesterLongSwap` condition below, whatever that condition currently is.
        for (let to = 0; to < 64; to++) {
          const v = board[to];
          if (v && colorOf(v) === c && typeOf(v) !== K && chebyshev(from, to) > 1 && guardMayLand(v, from)) out.push({ from, to, captures: [], swap: true });
        }
      }
      const firstRank = c === WHITE ? 0 : 7;
      const onRank = (s: number): boolean => RULES.maesterKingSwapAnywhere || rank(s) === firstRank;
      if (mode === 'all' && RULES.maesterLongSwap && onRank(from)) {
        const k = findKing(board, c);
        // Chebyshev > 1 is "not already generated above". On one rank that is the old file test.
        if (k >= 0 && onRank(k) && chebyshev(k, from) > 1) out.push({ from, to: k, captures: [], swap: true });
      }
      return;
    }
    case S: {
      const dr = fwd(c);
      const steps = RULES.beastMove === 'any' ? DIRS8 : RULES.beastMove === 'diagFwdBack' ? DIAG : [[0, dr] as Delta];
      if (mode === 'all') for (const [df, ddr] of steps) {
        const f = step(from, df, ddr);
        if (f >= 0 && !board[f]) out.push({ from, to: f, captures: [] });
      }
      // `diagForward` (the 2021 concept) and `diagonal` (lab, 2026-09-17) replace the 8-neighbour
      // maul with the two forward diagonals, or all four. Chaining is untouched: a chain just
      // continues on the same directions from each new square.
      const capDirs = RULES.beastCapture === 'diagForward' ? DIAG_FWD[c] : RULES.beastCapture === 'diagonal' ? DIAG : DIRS8;
      let scratch: Uint8Array | null = null;
      const chain = (at: number, caps: number[]): void => {
        for (const [df, ddr] of capDirs) {
          if (RULES.beastCapture === 'adjacent' && df === 0 && ddr === dr && !RULES.beastCaptureForward) continue; // straight ahead is move-only
          const target = step(at, df, ddr);
          if (target < 0) continue;
          const v = (scratch ?? board)[target];
          if (!v || colorOf(v) === c) continue;
          const vt = typeOf(v);
          if (!canCapture(S, vt) || (caps.length > 0 && vt === K)) continue; // a chain may not continue onto a king
          const next = [...caps, target];
          out.push({ from, to: target, captures: next });
          if (mode === 'attacks' || vt === K || !RULES.beastChains) continue;
          scratch ??= new Uint8Array(board);
          scratch[target] = 0;
          chain(target, next);
          scratch[target] = v;
        }
      };
      chain(from, []);
      return;
    }
    case V: {
      // **Reaver** (lab piece, PIECES-PROPOSED.md #5): a knight that may step one square in any
      // direction onto an empty square as part of the same move after a capture — it keeps the
      // winnings and slips out of the recapture. The step never captures and creates no attack
      // (isAttacked sees only the knight's eight), so the attack mirror needs no new branch here.
      // The step variants are mode-'all' only: for attack generation the plain knight captures are
      // the whole story.
      leaper(board, from, c, p, KNIGHT, mode, out);
      if (mode === 'all') {
        const stepDirs = RULES.reaverStep === 'ortho' ? ORTHO : DIRS8;
        for (const [df, dr] of KNIGHT) {
          const victim = step(from, df, dr);
          if (victim < 0) continue;
          const v = board[victim];
          if (!v || colorOf(v) === c || !canCapture(p, typeOf(v))) continue;
          for (const [sf, sr] of stepDirs) {
            const land = step(victim, sf, sr);
            if (land >= 0 && !board[land]) out.push({ from, to: land, captures: [victim] });
          }
        }
      }
      return;
    }
    case T: {
      // **Templar** (lab piece, PIECES-PROPOSED.md #4): a king-step while it stands anywhere, and a
      // full queen while it stands on one of the four capital squares (d4 e4 d5 e5). The switch is
      // a pure function of `from`, so no state exists; `isAttacked` mirrors it exactly (a Templar
      // blocks like any slider and is a queen only from a capital).
      if (CAPITAL.includes(from)) return slider(board, from, c, p, DIRS8, mode, out);
      return leaper(board, from, c, p, DIRS8, mode, out);
    }
    case O: {
      // An ordinary king-step attacker: it may take a king like any king-mover, never a guard
      // (`canCapture` settles both), so `isAttacked` needs nothing but the 8 neighbours.
      leaper(board, from, c, p, DIRS8, mode, out);
      if (mode !== 'all') return; // a shove takes nothing, so it is not an attack
      for (const [df, dr] of DIRS8) {
        const s = step(from, df, dr);
        if (s < 0) continue;
        const v = board[s];
        // Friend or enemy, a guard included — that is the point of the piece — but never a king of
        // either colour. The square straight beyond has to be on the board and empty.
        if (!v || typeOf(v) === K) continue;
        const to = step(s, df, dr);
        if (to < 0 || board[to]) continue;
        out.push({ from, to: RULES.ogreMode === 'push' ? s : from, captures: [], shove: { from: s, to } });
      }
      return;
    }
    case C: {
      // Rook lines, move-only: the Catapult never captures by displacement.
      if (mode === 'all') for (const [df, dr] of ORTHO) {
        for (let to = step(from, df, dr); to >= 0 && !board[to]; to = step(to, df, dr)) out.push({ from, to, captures: [] });
      }
      // The lob: the first piece on the ray is the screen and must be an **enemy** (a friendly
      // screen is no shot at all), and the first piece beyond it, at any distance, is the target.
      for (const [df, dr] of ORTHO) {
        let screen = step(from, df, dr);
        while (screen >= 0 && !board[screen]) screen = step(screen, df, dr);
        if (screen < 0 || colorOf(board[screen]) === c) continue;
        let target = step(screen, df, dr);
        while (target >= 0 && !board[target]) target = step(target, df, dr);
        if (target < 0) continue;
        const v = board[target];
        if (colorOf(v) === c || !canCapture(p, typeOf(v))) continue;
        out.push({ from, to: RULES.catapultCapture === 'land' ? target : from, captures: [target] });
      }
      return;
    }
  }
}

/**
 * Pseudo-legal moves for the piece on `from` (king safety is not checked here).
 *
 * **C2** (`capitalSanctuary`, `docs/MATRIX.md` §B.2): when on, a capture whose **victim** stands on
 * a capital square (d4 e4 d5 e5) is dropped. The filter lives here, the one function every
 * generator — `pseudoMoves`, `legalMoves` and the search's own `genLegal` — reaches the board
 * through, so the search plays exactly the rule the engine states and no capture push site has to
 * know about it. The test reads `m.captures`, not `m.to`: an archer shot, a catapult `stay` lob and
 * a Death Touch capture all keep `to === from`, and a beast chain lists every victim, so a chain
 * that would swallow a capital piece loses that extension while the shorter chain that stops before
 * it stays.
 *
 * **C5** (`capitalNoCapture`, §B.2): the mirror — when on, a move whose **mover** stands on a
 * capital square (`CAPITAL.includes(from)`) and that removes anything (`captures.length > 0`) is
 * dropped. The quiet moves of the same piece are untouched, and the two rules compose: the C2 loop
 * looks at victims, the C5 loop at the mover, and each drops only the moves it names. The C5 filter
 * needs no per-piece knowledge, so it catches displacement captures, archer shots, catapult lobs,
 * Death Touch shots, paladin charges and beast chains alike.
 *
 * `mode: 'attacks'` is deliberately left unfiltered under both rules: that is the generator
 * `isAttacked` is cross-checked against, and check/mate detection stays standard chess. Under C2 a
 * king standing in the capital can be checked and mated but never captured (no generator offers
 * the move). Under C5 a capital piece cannot capture, so it cannot *deliver* a capture — but
 * `isAttacked` is unchanged, so the same piece still counts as attacking every square it would
 * take on, and a king can therefore be checked and even mated by a piece that can never take it.
 * Detection over-reports the threat instead of missing it: deliberately conservative, and the lab
 * measures whether the inconsistency matters.
 */
export function genPiece(board: Uint8Array, from: number, mode: GenMode, out: Move[]): void {
  const n0 = out.length;
  genPieceRaw(board, from, mode, out);
  if (mode === 'attacks') return; // check/mate detection stays standard: see the C2/C5 notes above
  if (RULES.capitalSanctuary) {
    for (let i = out.length - 1; i >= n0; i--) {
      const captures = out[i].captures;
      for (let j = 0; j < captures.length; j++) {
        if (CAPITAL.includes(captures[j])) { out.splice(i, 1); break; }
      }
    }
  }
  // C5: a piece standing in the capital generates no captures; its quiet moves stay.
  if (RULES.capitalNoCapture && CAPITAL.includes(from)) {
    for (let i = out.length - 1; i >= n0; i--) if (out[i].captures.length > 0) out.splice(i, 1);
  }
}

/**
 * The byte a mover leaves on its landing square: a promotion, or a guard that has just spent its
 * one lifetime capture. `src/ai/search.ts` applies the same function on its scratch board, so the
 * two make/unmake paths cannot drift apart.
 */
export function landed(mover: number, m: Move): number {
  if (m.promo) return piece(m.promo, colorOf(mover));
  if (RULES.guardCaptureLimit && m.captures.length > 0 && typeOf(mover) === G) return mover | SPENT;
  return mover;
}

export function makeMove(pos: Position, m: Move): Position {
  const board = new Uint8Array(pos.board);
  const mover = board[m.from], other = board[m.to];
  for (const c of m.captures) board[c] = 0;
  // The shoved piece moves first: under `ogreMode: 'push'` the Ogre lands on the square it just
  // left, so the two writes below would otherwise undo each other.
  if (m.shove) { board[m.shove.to] = board[m.shove.from]; board[m.shove.from] = 0; }
  board[m.from] = m.swap ? other : 0;
  board[m.to] = m.selfRemove ? 0 : landed(mover, m);
  const reset = m.captures.length > 0 || typeOf(mover) === P;
  // `secondPlayerDoubleFirstTurn`: Black's first turn is two moves, so the side to move does not
  // flip after ply 1. See the rule's comment in ./rules.ts for why this is a ply check.
  const again = RULES.secondPlayerDoubleFirstTurn && pos.ply === 1;
  let strike = pos.strike;
  if (m.strike) {
    const flags: [boolean, boolean] = [pos.strike?.[0] ?? false, pos.strike?.[1] ?? false];
    flags[pos.turn] = true;
    strike = flags;
  }
  return {
    board, turn: (again ? pos.turn : pos.turn ^ 1) as Color, halfmove: reset ? 0 : pos.halfmove + 1, ply: pos.ply + 1,
    ...(strike ? { strike } : {}),
  };
}

/**
 * Whose move ply `i` is (0-based: `i` = 0 is White's first move, and `GameRecord.moves[i]`).
 *
 * The one source of truth for "who moved at this index". `makeMove` above is the only other place
 * that decides it, and it decides it the same way: `secondPlayerDoubleFirstTurn` hands Black plies
 * 1 **and** 2, so from ply 2 on the parity is shifted by one for the rest of the game. Plain
 * `i % 2` is therefore inverted under that rule, which is how `killerMove` and `interest` came out
 * invalid in the two `dt-*` experiments (LESSONS.md 2026-09-14).
 *
 * `rules` defaults to the live rule set, which is what the engine and the browser want. A reader of
 * *stored* games passes that run's rules instead: the per-game stamp (`Stamp` in src/sim/run.ts),
 * else the run summary, else `{}`. `{}` is safe as a last resort because a rule diff omits every
 * rule sitting at its default, so an absent key already means "the default".
 */
export function moverAt(ply: number, rules: Partial<Rules> = RULES): Color {
  return ((rules.secondPlayerDoubleFirstTurn && ply >= 2 ? ply - 1 : ply) & 1) as Color;
}

/**
 * Is `target` attacked by colour `by`? Reverse lookup from the target square (fast path for check tests).
 * Cross-checked against genPiece('attacks') in rules.test.ts — keep both in sync when adding pieces.
 */
/** A beast of colour `by` standing `(df, dr)` from the target: does it capture the target? */
function beastTakesFrom(df: number, dr: number, by: Color): boolean {
  // The beast captures at (-df, -dr) from itself. `diagForward` = the two forward diagonals only;
  // `diagonal` = all four diagonals, colour-independent; otherwise every neighbour but straight
  // ahead (the blind spot `beastCaptureForward` removes).
  if (RULES.beastCapture === 'diagForward') return df !== 0 && dr === -fwd(by);
  if (RULES.beastCapture === 'diagonal') return df !== 0 && dr !== 0;
  return RULES.beastCaptureForward || !(df === 0 && dr === -fwd(by));
}

export function isAttacked(board: Uint8Array, target: number, by: Color): boolean {
  const victim = board[target] ? typeOf(board[target]) : 0;
  // One 64-byte scan, so the lob test below costs nothing on a board with no catapult — which is
  // every shipped game, and `isAttacked` is the hottest function in the project.
  const lobber = board.includes(piece(C, by));
  const hit = (s: number, t: PieceType): boolean => {
    const p = board[s];
    return p !== 0 && colorOf(p) === by && typeOf(p) === t && (victim === 0 || canCapture(p, victim as PieceType));
  };
  for (const [df, dr] of KNIGHT) { const s = step(target, df, dr); if (s >= 0 && (hit(s, N) || hit(s, V))) return true; }
  for (const [df, dr] of DIRS8) {
    const s = step(target, df, dr);
    if (s < 0) continue;
    if (hit(s, K) || hit(s, M) || hit(s, O) || hit(s, T) || (RULES.guardCaptures !== 'none' && hit(s, G) && guardMayLand(board[s], target))) return true;
    if (hit(s, S) && beastTakesFrom(df, dr, by)) return true;
  }
  // A pawn of `by` that takes the target stands on one of the two squares diagonally behind it —
  // or, under **Darkness**, on the single square straight behind it (the mirror of `case P`).
  for (const df of powerOf(by) === 'Darkness' ? [0] : [-1, 1]) { const s = step(target, df, -fwd(by)); if (s >= 0 && hit(s, P)) return true; }
  // Walk the shot deltas *negated*: an archer that shoots (df, dr) sits at (-df, -dr) from its
  // target. The symmetric sets do not care; `forward3` does.
  for (const [df, dr] of archerShotsFor(by)) { const s = step(target, -df, -dr); if (s >= 0 && hit(s, A)) return true; }
  for (let i = 0; i < 8; i++) {
    const [df, dr] = DIRS8[i];
    const sliderType = i < 4 ? R : B;
    // A `by`-coloured piece in the way blocks sliders; whether it blocks a paladin is a rule, so
    // the two get their own flags (they differ under `paladinJumpsFriends: false`).
    let blockedForSliders = false, blockedForPaladin = false, first = true;
    for (let s = step(target, df, dr); s >= 0; s = step(s, df, dr)) {
      const p = board[s];
      if (!p) continue;
      const isFirst = first;
      first = false;
      if (colorOf(p) !== by) {
        // A catapult lobs over exactly one screen, the screen is the first piece on the ray, and it
        // must not belong to the shooter — so the walk the sliders already make *is* the walk the
        // lob needs, and only the leg past the screen is new work. That is why the lob lives inside
        // this loop instead of walking four rays of its own.
        if (lobber && i < 4 && isFirst) {
          for (let t = step(s, df, dr); t >= 0; t = step(t, df, dr)) {
            if (!board[t]) continue;
            if (hit(t, C)) return true;
            break;
          }
        }
        // An enemy of `by` stops everything, unless paladins jump enemies too: then keep looking
        // for a paladin further along the ray (sliders stay blocked; an enemy it jumps over is
        // not in its way, whatever `paladinJumpsFriends` says about its own side).
        if (RULES.paladinBlockedByEnemies) break;
        blockedForSliders = true;
        continue;
      }
      const t = typeOf(p);
      if (!blockedForSliders && (t === sliderType || t === Q || (t === T && CAPITAL.includes(s))) && (victim === 0 || canCapture(p, victim as PieceType))) return true;
      if (!blockedForPaladin && t === L && (victim === 0 || canCapture(p, victim as PieceType))) return true;
      // **Leap** (Mud B): an own pawn does not stop a `by` slider, which is the mirror of the
      // `continue` in `slider()`. The paladin is untouched — it jumps friends already.
      if (!(t === P && powerOf(by) === 'Leap')) blockedForSliders = true;
      if (!RULES.paladinJumpsFriends) blockedForPaladin = true;
    }
  }
  return false;
}

export function inCheck(pos: Position, c: Color = pos.turn): boolean {
  const k = findKing(pos.board, c);
  return k >= 0 && isAttacked(pos.board, k, (c ^ 1) as Color);
}

export function pseudoMoves(pos: Position, mode: GenMode = 'all'): Move[] {
  const out: Move[] = [];
  for (let s = 0; s < 64; s++) if (pos.board[s] && colorOf(pos.board[s]) === pos.turn) genPiece(pos.board, s, mode, out);
  const c = pos.turn;
  // Strike (Flame A): while the side's one use is unspent, any own non-king piece may also move as a
  // queen, as the whole turn. It never takes a king and never promotes — the piece keeps its type
  // (`landed`), and it is not an attack: `isAttacked` still sees only the piece's normal pattern.
  if (mode === 'all' && powerOf(c) === 'Strike' && !pos.strike?.[c]) {
    const capture = RULES.strikeMode === 'capture';
    for (let s = 0; s < 64; s++) {
      const p = pos.board[s];
      if (!p || colorOf(p) !== c || typeOf(p) === K) continue;
      for (const [df, dr] of DIRS8) {
        for (let f = file(s) + df, r = rank(s) + dr; f >= 0 && f < 8 && r >= 0 && r < 8; f += df, r += dr) {
          const to = sq(f, r), v = pos.board[to];
          if (!v) {
            if (!capture) out.push({ from: s, to, captures: [], strike: true });
            continue;
          }
          // The first occupied square stops the walk in both readings; only `move` passes through
          // empty squares. `capture` takes a queen-reach victim and stays where it stood.
          if (colorOf(v) !== c && typeOf(v) !== K && canCapture(p, typeOf(v))) {
            out.push(capture ? { from: s, to: s, captures: [to], strike: true } : { from: s, to, captures: [to], strike: true });
          }
          break;
        }
      }
    }
  }
  return out;
}

export function legalMoves(pos: Position, mode: GenMode = 'all'): Move[] {
  // The first of Black's two opening moves may not give check: White has no turn in between, so a
  // check there could otherwise be answered by capturing the king.
  const noCheck = RULES.secondPlayerDoubleFirstTurn && pos.ply === 1;
  return pseudoMoves(pos, mode).filter(m => {
    const next = makeMove(pos, m);
    return !inCheck(next, pos.turn) && (!noCheck || !inCheck(next, (pos.turn ^ 1) as Color));
  });
}

/**
 * Conservative dead draw: no side keeps material that can force mate.
 * Mating material = P, R, Q, A, M, S, or two minors (N/B). Guards and paladins never count:
 * a guard captures nothing and a paladin cannot capture a king, so neither can ever mate (K+G+L vs K is a draw).
 * The two lab toggles that hand either piece a king (`guardCaptures: 'any'`, `paladinChecks`) take it back.
 */
export function insufficientMaterial(board: Uint8Array): boolean {
  const minors = [0, 0];
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p) continue;
    const t = typeOf(p);
    // The ogre is a commoner, so it mates with a king. The catapult needs a screen it cannot make
    // for itself, but a single enemy piece is screen enough, so it counts too — this test is meant
    // to be conservative, and declaring a live game drawn is the expensive direction to be wrong in.
    if (t === P || t === R || t === Q || t === A || t === M || t === S || t === O || t === C || t === T) return false;
    if (t === G && RULES.guardCaptures === 'any') return false; // a commoner guard mates with a king; a pawn-only guard cannot
    if (t === L && RULES.paladinChecks) return false; // a paladin that may take a king can mate with one
    if (t === N || t === B || t === V) minors[colorOf(p)]++; // a lone leaper cannot mate: K+V vs K is drawn
  }
  return minors[WHITE] <= 1 && minors[BLACK] <= 1;
}

export type Status = 'playing' | 'checkmate' | 'stalemate' | 'draw50' | 'drawRepetition' | 'drawMaterial';

/** Pure: repetition needs move history, so only `Game.status` can report 'drawRepetition'. */
export function status(pos: Position): Status {
  if (legalMoves(pos).length === 0) return inCheck(pos) ? 'checkmate' : 'stalemate';
  if (RULES.fiftyMove && pos.halfmove >= 100) return 'draw50';
  // A live Strike is mating potential the material scan cannot see (a piece reaches a square it
  // never could, once). Do not declare a material draw in a Strike game — the expensive direction
  // is calling a live game drawn, and this only touches games that picked Flame.
  const strikeLive = (c: Color): boolean => powerOf(c) === 'Strike' && !pos.strike?.[c];
  if (RULES.insufficientMaterial && insufficientMaterial(pos.board) && !strikeLive(WHITE) && !strikeLive(BLACK)) return 'drawMaterial';
  return 'playing';
}

export function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = legalMoves(pos);
  if (depth === 1) return moves.length;
  let n = 0;
  for (const m of moves) n += perft(makeMove(pos, m), depth - 1);
  return n;
}
