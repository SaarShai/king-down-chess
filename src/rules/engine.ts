/**
 * King Down Chess rules engine (single source of truth).
 * Board: 64 cells, a1 = 0 … h8 = 63; file = sq & 7, rank = sq >> 3. White moves up (+rank).
 * Standard chess + 5 King Down fairy pieces. No castling, no en passant (King Down Classic default).
 *
 * Every rule the balance lab varies lives in `./rules.ts` as one module-level object, `RULES`.
 * Read that file's header for why it is module state and not a field on `Position`. With no call
 * to `setRules` the defaults apply, which is exactly the game the browser plays today.
 */

import { ArcherShots, PowerName, RULES, Rules, USES_RULE } from './rules';
export type { ArcherMove, ArcherShots, BeastCapture, BeastMove, CatapultCapture, GuardCaptures, KingChoice, KingName, OgreMode, OgreShoveFriends, PaladinKamikaze, PowerName, PromotionSet, Rules, StrikeMode } from './rules';
export { BUILT, DEFAULT_RULES, KINGS, POWERS_BALANCED, RULES, RULES_2017, RULES_2021, TIER1, USES_RULE, kingLabel, parseKing, parseKings, parseRule, ruleDiff, setRules } from './rules';

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
   * A king power spent by this move (docs/RULES.md §4). Each spends one of the side's uses
   * (`Position.used`):
   * - `freeze` / `ward` (Freeze, Ice Wall): mark one piece and change no square; `from === to ===`
   *   the marked piece, and the mark binds the opponent's next turn (`Position.mark`).
   * - `strike`: a non-king piece moves as a queen (`strikeMode: 'capture'`: takes without moving);
   *   it keeps its own type, so a striking pawn never promotes.
   * - `haste`: an ordinary move after which the turn does not pass: the same piece may move again
   *   (`Position.haste`), or the side ends the turn with a `pass`.
   * - `flight`: a non-king piece jumps to any empty square in its own half.
   * - `sacrifice`: an own pawn becomes a piece the side lost earlier; `from === to`, `promo` names it.
   * - `march` / `leap`: the counted pawn double step from any rank, and a slider passing over its own
   *   pawns. (At 0 uses they are always on, as ordinary moves with no tag.)
   * No power move ever captures a king, and none adds an attacked square.
   */
  power?: PowerTag;
  /** Haste: end the turn without the optional second move; `from === to ===` the hasted piece. */
  pass?: boolean;
  promo?: PieceType;
}

/** The tag on a move that spends a king power (`Move.power`). */
export type PowerTag = 'freeze' | 'ward' | 'strike' | 'haste' | 'flight' | 'sacrifice' | 'march' | 'leap';

export interface Position {
  board: Uint8Array;
  turn: Color;
  /** Plies since the last capture or pawn move (50-move rule). */
  halfmove: number;
  ply: number;
  /**
   * King powers: uses each side has spent of its spendable power (`Rules.freezeUses` and the rest),
   * `[white, black]`. Absent = none. Game state, not a rule: it travels with the position (FEN field
   * 7) and `positionKey` folds it in, so positions that differ only here are not the same position.
   */
  used?: readonly [number, number];
  /**
   * Freeze and Ice Wall marks, one slot per marking side (`[by White, by Black]`), so a side bound
   * by the opponent's mark can set its own without lifting it. A mark binds the other side only; its
   * marker's power says which kind (`markKind`). It lasts through the marking side's own moves and
   * `left` turns of the bound side (absent = 1; `markTurns: 2` makes it 2); a Haste's second move is
   * part of the same turn. `ward` (card mode only): an Ice Wall, since a hand may hold both.
   */
  marks?: readonly [Mark | undefined, Mark | undefined];
  /**
   * `markFree`: the side has just set a free Freeze/Ice Wall mark and still makes its ordinary move
   * this turn (or ends it with a `pass`); no power is offered in that move.
   */
  free?: boolean;
  /** Haste: the square of the piece that may still make its optional second move this turn. */
  haste?: number;
  /**
   * Sacrifice's reserve: pieces each side has lost (captured, or removed by its own paladin),
   * counted at index `colour * 16 + type`. Kept only while a side plays Sacrifice; a piece the power
   * returns leaves the count.
   */
  lost?: readonly number[];
}

export interface Mark { sq: number; left?: number; ward?: boolean }

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
const MIRRORED: Partial<Record<ArcherShots, readonly Delta[]>> = Object.fromEntries(
  Object.entries(FORWARD_SETS).map(([k, set]) => [k, mirrored(set!)]),
);
const archerShotsFor = (c: Color): readonly Delta[] => {
  const forward = FORWARD_SETS[RULES.archerShots];
  if (forward) return c === BLACK ? MIRRORED[RULES.archerShots]! : forward; // built once, not per call
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
export const powerOf = (c: Color): PowerName | '' => RULES.kings[c]?.power ?? '';

/**
 * Uses side `c` may spend of its power: n > 0 counted, 0 unlimited, -1 when its power is not a
 * spendable one (or it has none). The counts are rules (`USES_RULE`), the spent ones game state.
 */
export function powerUses(c: Color): number {
  const p = powerOf(c);
  const key = p ? USES_RULE[p] : undefined;
  return key ? (RULES[key] as number) : -1;
}

/** Card mode: side `c`'s hand (`Rules.hands`); empty outside card mode. */
export const handOf = (c: Color): readonly PowerName[] => RULES.hands[c];
/** The power each power-move tag spends. */
const TAG_POWER: Readonly<Record<PowerTag, PowerName>> = {
  freeze: 'Freeze', ward: 'IceWall', strike: 'Strike', haste: 'Haste', flight: 'Flight', sacrifice: 'Sacrifice', march: 'March', leap: 'Leap',
};
/** Card mode: may side `c` (cards played: the bits of `used`) still play a `power` card? */
const holdsCard = (c: Color, used: number, power: PowerName): boolean => handOf(c).some((p, k) => p === power && !(used >> k & 1));
/** Side `c`'s spent state after a power move tagged `tag`: one more use, or in card mode the bit of the first unplayed card of that power. */
export function spend(c: Color, used: number, tag: PowerTag): number {
  const hand = handOf(c);
  if (!hand.length) return used + 1;
  const k = hand.findIndex((p, i) => p === TAG_POWER[tag] && !(used >> i & 1));
  return k < 0 ? used : used | 1 << k;
}

/** May side `c`, having spent `used` uses, spend one more now? March and Leap at 0 are always on, never spent. */
export function canSpend(c: Color, used: number): boolean {
  const hand = handOf(c);
  if (hand.length) return (~used & ((1 << hand.length) - 1)) !== 0;
  const n = powerUses(c);
  if (n < 0) return false;
  if (n === 0) return powerOf(c) !== 'March' && powerOf(c) !== 'Leap';
  return used < n;
}

/** March and Leap at 0 uses: the stateless always-on readings (ordinary moves and attacks). */
const marchAlways = (c: Color): boolean => powerOf(c) === 'March' && RULES.marchUses === 0;
const leapAlways = (c: Color): boolean => powerOf(c) === 'Leap' && RULES.leapUses === 0;

/**
 * How a mark set by `markBy` binds the side to move `c`: not at all on the marking side's own turn,
 * else frozen (a Freeze) or warded (an Ice Wall).
 */
export function markKind(c: Color, markBy: Color | undefined, ward = false): 'frozen' | 'warded' | '' {
  if (markBy === undefined || markBy === c) return '';
  if (handOf(markBy).length) return ward ? 'warded' : 'frozen';
  const p = powerOf(markBy);
  return p === 'Freeze' ? 'frozen' : p === 'IceWall' ? 'warded' : '';
}

/** A game keeps the Sacrifice reserve (`Position.lost`) only while a side plays Sacrifice. */
export const keepsLost = (): boolean => RULES.kings[0]?.power === 'Sacrifice' || RULES.kings[1]?.power === 'Sacrifice'
  || RULES.hands[0].includes('Sacrifice') || RULES.hands[1].includes('Sacrifice');

/**
 * May the attacker `att` remove a piece of type `vic`? Guard captures nothing and is taken only by
 * a king; a paladin never takes a king. `att` is a whole piece byte, so a guard carrying `SPENT`
 * has used up `guardCaptureLimit`; a bare `PieceType` is the same byte with no flags.
 */
export function canCapture(att: number, vic: PieceType): boolean {
  const at = typeOf(att);
  // `ogreNoCapture`: a no-capture Ogre is a pure relocator. The clause lives here, where every
  // generator and `isAttacked` already ask, so the move list and the attack mirror stay in step
  // (`crossCheckAttacks`) and "it can never check or mate" follows with no branch of its own. The
  // shove is a separate path: it removes nothing and survives this rule.
  if (at === O && RULES.ogreNoCapture) return false;
  // A pawn-clearing guard still cannot take a king, so it still never checks and still cannot mate.
  if (at === G && (RULES.guardCaptures === 'none' || (RULES.guardCaptures === 'pawns' && vic !== P))) return false;
  if (at === G && RULES.guardCaptureLimit && (att & SPENT)) return false;
  if (vic === G && RULES.guardImmune) return at === K;
  // Mercy (Spirit B): this king captures nothing — **except a guard**, which only a king may ever
  // take (plan decision 15: a piece may be hard to take, never impossible; a permanently immortal
  // guard is the measured draw engine). Stated here and not in `genPiece`, so `isAttacked` follows
  // for nothing: its DIRS8 loop asks `canCapture` for the king like every other piece.
  if (at === K && vic !== G && powerOf(colorOf(att)) === 'Mercy' && !RULES.mercyCaptures) return false;
  // Holy Light (Spirit A): no enemy pawn takes this side's king, and this king takes no pawn. A
  // capture is always cross-colour, so the victim's side is `colorOf(att) ^ 1` and one byte decides
  // both directions. The guard is untouched: a Spirit king still takes one (§1.9).
  if (at === P && vic === K && powerOf((colorOf(att) ^ 1) as Color) === 'HolyLight') return false;
  if (at === N && vic === K && RULES.holyLightKnights && powerOf((colorOf(att) ^ 1) as Color) === 'HolyLight') return false;
  if (at === K && vic === P && powerOf(colorOf(att)) === 'HolyLight' && !RULES.holyLightTakesPawns) return false;
  if (vic === K) return (at !== L || RULES.paladinChecks) && (RULES.archerChecks || at !== A);
  return true;
}

export function findKing(board: Uint8Array, c: Color): number {
  return board.indexOf(piece(K, c));
}

/** all = every pseudo-legal move; captures = only moves that remove something (chains included); attacks = first-level captures only. */
export type GenMode = 'all' | 'captures' | 'attacks';

/** A pawn move onto `to`, as one move per promotion piece when `to` is the last rank. */
/**
 * Holy Light's aura (`holyLightAura`, balance lab): `sq` stands next to `side`'s Holy Light king, so
 * no enemy pawn may take it. The king itself is covered by `canCapture` under every reading.
 */
function inLight(board: Uint8Array, sq: number, side: number): boolean {
  if (!RULES.holyLightAura || powerOf(side as Color) !== 'HolyLight') return false;
  const k = piece(K, side as Color);
  for (let d = 0; d < 8; d++) { const n = NEIGHBOUR[sq * 8 + d]; if (n >= 0 && board[n] === k) return true; }
  return false;
}

/**
 * Mercy's shelter (`mercyAura`) and Holy Light's (`holyLightShelter`), balance lab: `sq` holds a
 * piece, not a king, standing next to its own side's sheltering king. Returns what the shelter stops
 * there: every capture (2), only a pawn's (1, `mercyAuraPawns`), or nothing (0). The `*Ortho`
 * readings shelter only the four orthogonal neighbours.
 */
function sheltered(board: Uint8Array, sq: number): number {
  const v = board[sq];
  if (!v || typeOf(v) === K) return 0;
  const pw = powerOf(colorOf(v));
  let ortho: boolean, level: number;
  if (pw === 'Mercy' && RULES.mercyAura) { ortho = RULES.mercyAuraOrtho; level = RULES.mercyAuraPawns ? 1 : 2; }
  else if (pw === 'HolyLight' && RULES.holyLightShelter) { ortho = RULES.holyLightShelterOrtho; level = 2; }
  else return 0;
  const k = piece(K, colorOf(v));
  for (let d = 0; d < (ortho ? 4 : 8); d++) { const n = NEIGHBOUR[sq * 8 + d]; if (n >= 0 && board[n] === k) return level; }
  return 0;
}

/** Drop the moves from `n0` on that would capture a sheltered piece (`mercyAura`, `holyLightShelter`). */
function dropSheltered(board: Uint8Array, out: Move[], n0: number): void {
  for (let i = out.length - 1; i >= n0; i--) {
    const caps = out[i].captures, pawn = typeOf(board[out[i].from]) === P;
    for (let j = 0; j < caps.length; j++) { const l = sheltered(board, caps[j]); if (l === 2 || (l === 1 && pawn)) { out.splice(i, 1); break; } }
  }
}

function pawnPush(out: Move[], from: number, to: number, captures: number[], lastRank: number): void {
  if (rank(to) === lastRank) for (const promo of PROMOTION_SETS[RULES.promotionSet]) out.push({ from, to, captures, promo });
  else out.push({ from, to, captures });
}

/**
 * The beast's chain from `at`, as a module function so no closure is made per generated beast.
 * `scratch` is the board with the chain's victims removed so far (made on the first link).
 */
function beastChain(board: Uint8Array, scratch: Uint8Array | null, from: number, at: number, caps: number[], c: Color,
  capDirs: readonly Delta[], dr: number, mode: GenMode, out: Move[]): void {
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
    const sc = scratch ?? new Uint8Array(board);
    sc[target] = 0;
    beastChain(board, sc, from, target, next, c, capDirs, dr, mode, out);
    sc[target] = v;
  }
}

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
 * Rook, bishop and queen rays — and the seam of the always-on **Leap** (Mud B, `leapUses: 0`): a
 * slider of a Mud:Leap side passes over its **own pawns**, and every other blocker still stops the
 * ray. The paladin jumps friends already (`case L`) and a one-stepper has no ray.
 *
 * Move and capture are the same ray here, so always-on Leap **does** change the attack set:
 * `isAttacked`'s hand-written mirror of this walk carries the same condition, and
 * `crossCheckAttacks()` is what proves the two have not drifted. Counted Leap (the default, 3 uses)
 * is a power move instead (`genPowerMoves`): no king capture, no attack.
 */
function slider(board: Uint8Array, from: number, c: Color, att: number, dirs: readonly Delta[], mode: GenMode, out: Move[]): void {
  const leap = leapAlways(c);
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
      // **Darkness** (Shadow B): the pawn's two verbs swap — it steps on the forward diagonals and
      // captures straight ahead — and the double first step is gone. Promotion follows on its own,
      // because `pawnPush()` promotes by rank and both paths call it. The matching branch is the pawn
      // walk in `isAttacked`, which is the only other place that knows where a pawn takes from.
      const dark = powerOf(c) === 'Darkness';
      // Round-8 lab readings: ordinary pawns plus one of the two Darkness verbs. The extra verb never
      // overlaps an ordinary one (a straight capture needs an occupied square, a diagonal step an
      // empty one), so the ordinary moves below simply follow.
      if (dark && (RULES.darknessTakeAhead || RULES.darknessStepDiag)) {
        if (RULES.darknessStepDiag) {
          if (mode === 'all') for (const df of [-1, 1]) {
            const to = step(from, df, dr);
            if (to >= 0 && !board[to]) pawnPush(out, from, to, [], lastRank);
          }
        } else {
          const ahead = step(from, 0, dr);
          if (ahead >= 0 && board[ahead] && colorOf(board[ahead]) !== c && canCapture(p, typeOf(board[ahead])) && !inLight(board, ahead, c ^ 1)) pawnPush(out, from, ahead, [ahead], lastRank);
        }
      } else if (dark) {
        if (mode === 'all') for (const df of [-1, 1]) {
          const to = step(from, df, dr);
          if (to >= 0 && !board[to]) pawnPush(out, from, to, [], lastRank);
        }
        const ahead = step(from, 0, dr);
        if (ahead >= 0 && board[ahead] && colorOf(board[ahead]) !== c && canCapture(p, typeOf(board[ahead])) && !inLight(board, ahead, c ^ 1)) pawnPush(out, from, ahead, [ahead], lastRank);
        // `darknessKeep` (balance lab): the ordinary pawn moves below as well — the two sets never
        // overlap, because one set goes to empty squares where the other takes.
        // `darknessMoves` (balance lab): the ordinary straight steps too, but no diagonal capture.
        if (RULES.darknessMoves && !RULES.darknessKeep && mode === 'all') {
          const s1 = step(from, 0, dr);
          if (s1 >= 0 && !board[s1]) {
            pawnPush(out, from, s1, [], lastRank);
            const s2 = step(from, 0, 2 * dr);
            if ((marchAlways(c) || rank(from) === startRank) && s2 >= 0 && !board[s2]) pawnPush(out, from, s2, [], lastRank);
          }
        }
        if (!RULES.darknessKeep) return;
      }
      if (mode === 'all') {
        const s1 = step(from, 0, dr);
        if (s1 >= 0 && !board[s1]) {
          pawnPush(out, from, s1, [], lastRank);
          // Always-on **March** (Mud A, `marchUses: 0`): the double step from *any* rank, both
          // squares empty. Dropping the home-rank test is the whole power — and it is why the second
          // square goes through `pawnPush()` too: from rank 6 a marching pawn lands on the last rank and
          // must promote. Counted March (the default) is a power move (`genPowerMoves`).
          const s2 = step(from, 0, 2 * dr);
          if ((marchAlways(c) || rank(from) === startRank) && s2 >= 0 && !board[s2]) pawnPush(out, from, s2, [], lastRank);
        }
      }
      // **C4** (`pawnCapitalCapture`, `docs/MATRIX.md` §B.2): a pawn standing in the capital
      // (d4 e4 d5 e5) may also take **straight ahead**. `pawnPush()` is the ordinary advance's own
      // path, so a capture that reached the last rank would promote exactly like a push. The move
      // is generated for `all` and `captures` but never for `attacks`: a straight capture is a
      // move, not a new attack, so `isAttacked` keeps the pawn's ordinary two diagonals (the same
      // deliberate check-detection split as `capitalSanctuary`).
      if (RULES.pawnCapitalCapture && mode !== 'attacks' && !dark && CAPITAL.includes(from)) {
        const ahead = step(from, 0, dr);
        if (ahead >= 0 && board[ahead] && colorOf(board[ahead]) !== c && canCapture(p, typeOf(board[ahead])) && !inLight(board, ahead, c ^ 1)) pawnPush(out, from, ahead, [ahead], lastRank);
      }
      for (const df of [-1, 1]) {
        const to = step(from, df, dr);
        // The real piece byte, not the bare type: `canCapture` reads the attacker's colour off it,
        // which is how Holy Light knows whose king a pawn may not take.
        if (to >= 0 && board[to] && colorOf(board[to]) !== c && canCapture(p, typeOf(board[to])) && !inLight(board, to, c ^ 1)) pawnPush(out, from, to, [to], lastRank);
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
        for (let d = 0; d < 8; d++) {
          const [df, dr] = DIRS8[d];
          const to = step(from, df, dr);
          if (to < 0) continue;
          const v = board[to];
          if (!v) { if (mode === 'all') out.push({ from, to, captures: [] }); }
          else if (colorOf(v) !== c && canCapture(p, typeOf(v))) {
            out.push({ from, to: from, captures: [to] }); // the shot
            // The second reading (`deathTouchMoves`): keep the displacement capture as well.
            if (RULES.deathTouchMoves) out.push({ from, to, captures: [to] });
          }
          // `deathTouchReach` (round 8): the touch also reaches two squares in a straight line, over
          // an empty square; a move-free shot like the adjacent one. Mirrored in `isAttacked`.
          if (RULES.deathTouchReach && !v && !(RULES.deathTouchReachOrtho && d >= 4)) {
            const two = step(to, df, dr);
            const w = two >= 0 ? board[two] : 0;
            if (w && colorOf(w) !== c && canCapture(p, typeOf(w))) out.push({ from, to: from, captures: [two] });
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
      beastChain(board, null, from, from, [], c, capDirs, dr, mode, out);
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
      // `ogreStep2` (lab reading, off by default): the second square of each ray through an empty
      // middle square — the same move-only shape as `guardStep: 2` and `maesterStep: 2`, so the
      // `isAttacked` branch above needs no change.
      if (RULES.ogreStep2 && mode === 'all') for (const [df, dr] of DIRS8) {
        const mid = step(from, df, dr);
        if (mid < 0 || board[mid]) continue;
        const to = step(mid, df, dr);
        if (to >= 0 && !board[to]) out.push({ from, to, captures: [] });
      }
      if (mode !== 'all') return; // a shove takes nothing, so it is not an attack
      // `ogreHop` (lab reading, off by default): over exactly one adjacent piece — friend, enemy or
      // king, because a hop jumps and displaces nothing — onto the empty square directly beyond.
      // Also move-only, and the landing square has to be empty, so one piece never lands on another.
      if (RULES.ogreHop) for (const [df, dr] of DIRS8) {
        const over = step(from, df, dr);
        if (over < 0 || !board[over]) continue;
        const to = step(over, df, dr);
        if (to >= 0 && !board[to]) out.push({ from, to, captures: [] });
      }
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
 *
 * **`ogreShoveFriends`** (2026-09-17, lab): a third single-seam filter, over shoves. Only an Ogre
 * generates a move with `shove`, so the move itself names the victim (`shove.from`) and the filter
 * needs no piece knowledge. `enemies` keeps enemy victims only, `friends` keeps friendly ones; a
 * king is excluded upstream under every value. Shoves are not attacks, so `isAttacked` never reads
 * this field.
 */
export function genPiece(board: Uint8Array, from: number, mode: GenMode, out: Move[]): void {
  const n0 = out.length;
  genPieceRaw(board, from, mode, out);
  // Mercy's shelter covers every mode: `isAttacked` mirrors it, so the attack sets stay equal.
  if (RULES.mercyAura || RULES.holyLightShelter) dropSheltered(board, out, n0);
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
  // `ogreShoveFriends`: who may be shoved. Only an Ogre generates a move with `shove`, so the move
  // itself names the victim (`shove.from`) and the filter needs no piece knowledge — the same
  // one-seam shape as C2/C5, so `case O` keeps a single shove loop and the attack mirror is not
  // involved at all (a shove was never an attack). A friend shove survives `both` and `friends`, an
  // enemy shove survives `both` and `enemies`.
  if (RULES.ogreShoveFriends !== 'both') {
    const mover = colorOf(board[from]);
    for (let i = out.length - 1; i >= n0; i--) {
      const sh = out[i].shove;
      if (sh && (colorOf(board[sh.from]) === mover) !== (RULES.ogreShoveFriends === 'friends')) out.splice(i, 1);
    }
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

/**
 * Sacrifice's reserve after `m`: every piece it removes joins its owner's count, a paladin that
 * removes itself joins its own side's, and a piece the power returns leaves it. Read `board`
 * *before* the move's writes.
 */
function loseInto(lost: readonly number[] | undefined, board: Uint8Array, m: Move, mover: number): number[] {
  const out = lost ? [...lost] : new Array<number>(32).fill(0);
  for (const s of m.captures) { const v = board[s]; out[colorOf(v) * 16 + typeOf(v)]++; }
  if (m.selfRemove) out[colorOf(mover) * 16 + typeOf(mover)]++;
  if (m.power === 'sacrifice' && m.promo) out[colorOf(mover) * 16 + m.promo]--;
  return out;
}

export function makeMove(pos: Position, m: Move): Position {
  const c = pos.turn;
  const board = new Uint8Array(pos.board);
  // Freeze and Ice Wall change no square (the mark is the whole move), and neither does a Haste pass.
  const still = m.power === 'freeze' || m.power === 'ward' || m.pass === true;
  const mover = board[m.from], other = board[m.to];
  let lost = pos.lost;
  if (!still) {
    if (keepsLost()) lost = loseInto(lost, board, m, mover);
    for (const s of m.captures) board[s] = 0;
    // The shoved piece moves first: under `ogreMode: 'push'` the Ogre lands on the square it just
    // left, so the two writes below would otherwise undo each other.
    if (m.shove) { board[m.shove.to] = board[m.shove.from]; board[m.shove.from] = 0; }
    board[m.from] = m.swap ? other : 0;
    board[m.to] = m.selfRemove ? 0 : landed(mover, m);
  }
  const reset = !still && (m.captures.length > 0 || typeOf(mover) === P);
  // The turn holds after Black's first move under `secondPlayerDoubleFirstTurn` (see the rule's
  // comment in ./rules.ts for why that is a ply check), and after the first move of a Haste.
  const isMark = m.power === 'freeze' || m.power === 'ward';
  const hold = (RULES.secondPlayerDoubleFirstTurn && pos.ply === 1) || m.power === 'haste' || (isMark && RULES.markFree);
  const next: Position = { board, turn: (hold ? c : c ^ 1) as Color, halfmove: reset ? 0 : pos.halfmove + 1, ply: pos.ply + 1 };
  let used = pos.used;
  if (m.power) {
    const u: [number, number] = [used?.[0] ?? 0, used?.[1] ?? 0];
    u[c] = spend(c, u[c], m.power);
    used = u;
  }
  if (used && (used[0] || used[1])) next.used = used;
  // The opponent's mark binds the mover: a move that passes the turn uses up one of its turns (a
  // Haste's first move and a free mark do not). The mover's own mark lasts through its own moves; a
  // new mark replaces only the mover's own slot.
  const marks: [Mark | undefined, Mark | undefined] = [pos.marks?.[0], pos.marks?.[1]];
  const o = (c ^ 1) as Color, theirs = marks[o];
  if (theirs && !hold) {
    const left = (theirs.left ?? 1) - 1, { left: _, ...rest } = theirs;
    marks[o] = left > 1 ? { ...rest, left } : left === 1 ? rest : undefined;
  }
  if (isMark) {
    marks[c] = { sq: m.to, ...(RULES.markTurns > 1 ? { left: RULES.markTurns } : {}), ...(m.power === 'ward' && handOf(c).length ? { ward: true } : {}) };
    if (RULES.markFree) next.free = true;
  }
  if (marks[0] || marks[1]) next.marks = marks;
  if (m.power === 'haste') next.haste = m.to;
  if (lost) next.lost = lost;
  return next;
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

/** Is the piece on `s` of colour `by` and type `t`, and may it take a `victim` (0 = an empty target)? */
function hits(board: Uint8Array, s: number, t: PieceType, by: Color, victim: number): boolean {
  const p = board[s];
  return p !== 0 && colorOf(p) === by && typeOf(p) === t && (victim === 0 || canCapture(p, victim as PieceType));
}

/**
 * Board geometry for `isAttacked`, computed once: the knight squares of each square, its eight
 * neighbours by direction (-1 off the board), and the squares of each of its eight rays, outward.
 * Indexed `s * 8 + d` with `d` the index into `DIRS8`.
 */
const KNIGHT_TO: Int8Array[] = Array.from({ length: 64 }, (_, s) => Int8Array.from(KNIGHT.map(([df, dr]) => step(s, df, dr)).filter(t => t >= 0)));
const NEIGHBOUR = Int8Array.from({ length: 64 * 8 }, (_, i) => step(i >> 3, DIRS8[i & 7][0], DIRS8[i & 7][1]));
const RAY: Int8Array[] = Array.from({ length: 64 * 8 }, (_, i) => {
  const [df, dr] = DIRS8[i & 7], out: number[] = [];
  for (let t = step(i >> 3, df, dr); t >= 0; t = step(t, df, dr)) out.push(t);
  return Int8Array.from(out);
});

export function isAttacked(board: Uint8Array, target: number, by: Color): boolean {
  const shelter = RULES.mercyAura || RULES.holyLightShelter ? sheltered(board, target) : 0;
  if (shelter === 2) return false;
  const victim = board[target] ? typeOf(board[target]) : 0;
  // `isAttacked` is the hottest function in the project, so it creates no closure per call (the
  // simulator runs under tsx, whose name-keeping wraps every closure it creates), walks precomputed
  // geometry, and looks for a catapult only when a lob is geometrically possible (-1 = not yet).
  let lobber = -1;
  const kn = KNIGHT_TO[target];
  for (let i = 0; i < kn.length; i++) if (hits(board, kn[i], N, by, victim) || hits(board, kn[i], V, by, victim)) return true;
  for (let d = 0; d < 8; d++) {
    const s = NEIGHBOUR[target * 8 + d];
    if (s < 0) continue;
    const p = board[s];
    if (!p || colorOf(p) !== by) continue;
    // `hits` answers "can this piece take a king here" through `canCapture`, but an empty target
    // short-circuits it, so the no-capture Ogre is gated explicitly — the same shape the guard's
    // `guardCaptures` gate uses. `crossCheckAttacks` fails without it.
    if (hits(board, s, K, by, victim) || hits(board, s, M, by, victim) || (!RULES.ogreNoCapture && hits(board, s, O, by, victim)) || hits(board, s, T, by, victim) || (RULES.guardCaptures !== 'none' && hits(board, s, G, by, victim) && guardMayLand(p, target))) return true;
    if (hits(board, s, S, by, victim) && beastTakesFrom(DIRS8[d][0], DIRS8[d][1], by)) return true;
  }
  // `deathTouchReach` (round 8): a Death Touch king two squares away in a straight line, over an
  // empty square (the mirror of its shot in `case K`).
  if (RULES.deathTouchReach && powerOf(by) === 'DeathTouch') for (let d = 0; d < (RULES.deathTouchReachOrtho ? 4 : 8); d++) {
    const s = NEIGHBOUR[target * 8 + d];
    if (s < 0 || board[s]) continue;
    const s2 = NEIGHBOUR[s * 8 + d];
    if (s2 >= 0 && hits(board, s2, K, by, victim)) return true;
  }
  // A pawn of `by` that takes the target stands on one of the two squares diagonally behind it —
  // or, under **Darkness**, on the single square straight behind it (the mirror of `case P`).
  // `darknessKeep` keeps both. A piece in a Holy Light king's aura is out of every pawn's reach.
  const back = -fwd(by), dark = powerOf(by) === 'Darkness';
  if (shelter === 0 && !inLight(board, target, by ^ 1)) {
    const ahead = dark && !RULES.darknessStepDiag;
    if (ahead) { const s = step(target, 0, back); if (s >= 0 && hits(board, s, P, by, victim)) return true; }
    if (!dark || RULES.darknessKeep || RULES.darknessTakeAhead || RULES.darknessStepDiag) {
      const s1 = step(target, -1, back), s2 = step(target, 1, back);
      if ((s1 >= 0 && hits(board, s1, P, by, victim)) || (s2 >= 0 && hits(board, s2, P, by, victim))) return true;
    }
  }
  // Walk the shot deltas *negated*: an archer that shoots (df, dr) sits at (-df, -dr) from its
  // target. The symmetric sets do not care; `forward3` does.
  const shots = archerShotsFor(by);
  for (let i = 0; i < shots.length; i++) { const s = step(target, -shots[i][0], -shots[i][1]); if (s >= 0 && hits(board, s, A, by, victim)) return true; }
  for (let i = 0; i < 8; i++) {
    const ray = RAY[target * 8 + i];
    const sliderType = i < 4 ? R : B;
    // A `by`-coloured piece in the way blocks sliders; whether it blocks a paladin is a rule, so
    // the two get their own flags (they differ under `paladinJumpsFriends: false`).
    let blockedForSliders = false, blockedForPaladin = false, first = true;
    for (let j = 0; j < ray.length; j++) {
      const s = ray[j], p = board[s];
      if (!p) continue;
      const isFirst = first;
      first = false;
      if (colorOf(p) !== by) {
        // A catapult lobs over exactly one screen, the screen is the first piece on the ray, and it
        // must not belong to the shooter — so the walk the sliders already make *is* the walk the
        // lob needs, and only the leg past the screen is new work. That is why the lob lives inside
        // this loop instead of walking four rays of its own.
        if (i < 4 && isFirst && (lobber < 0 ? (lobber = board.includes(piece(C, by)) ? 1 : 0) : lobber)) {
          for (let jj = j + 1; jj < ray.length; jj++) {
            if (!board[ray[jj]]) continue;
            if (hits(board, ray[jj], C, by, victim)) return true;
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
      // Always-on **Leap** (Mud B): an own pawn does not stop a `by` slider, which is the mirror of
      // the `continue` in `slider()`. The paladin is untouched — it jumps friends already. Counted
      // Leap adds no attack (a power move never takes a king).
      if (!(t === P && leapAlways(by))) blockedForSliders = true;
      if (!RULES.paladinJumpsFriends) blockedForPaladin = true;
    }
  }
  return false;
}

export function inCheck(pos: Position, c: Color = pos.turn): boolean {
  const k = findKing(pos.board, c);
  return k >= 0 && isAttacked(pos.board, k, (c ^ 1) as Color);
}

/**
 * The spendable king powers' moves for side `c` (docs/RULES.md §4), appended to `out` while the
 * side has a use left. `out[n0..n1)` must hold the side's ordinary moves: Haste is those moves
 * again, tagged. `src/ai/search.ts` calls this too, so the engine and the search cannot drift.
 * Legality (own king safe) is the caller's filter, like every other move; a Freeze or Ice Wall
 * changes no square, so it can never answer a check.
 */
export function genPowerMoves(board: Uint8Array, c: Color, used: number, lost: ArrayLike<number> | undefined, out: Move[], n0: number, n1: number): void {
  if (!canSpend(c, used)) return;
  const start = out.length;
  const hand = handOf(c);
  if (!hand.length) genPowerMovesRaw(powerOf(c), board, c, lost, out, n0, n1);
  // Card mode: each unplayed card's moves, once per power (a second copy offers the same moves).
  else hand.forEach((p, k) => { if (!(used >> k & 1) && hand.findIndex((q, i) => q === p && !(used >> i & 1)) === k) genPowerMovesRaw(p, board, c, lost, out, n0, n1); });
  // A power capture (Strike, a counted Leap) spares a sheltered piece like any other capture.
  if (RULES.mercyAura || RULES.holyLightShelter) dropSheltered(board, out, start);
}

function genPowerMovesRaw(power: PowerName | '', board: Uint8Array, c: Color, lost: ArrayLike<number> | undefined, out: Move[], n0: number, n1: number): void {
  switch (power) {
    case 'Freeze': case 'IceWall': {
      // Freeze names an enemy piece, Ice Wall an own one; never a king.
      const tag = power === 'Freeze' ? 'freeze' : 'ward';
      const enemy = power === 'Freeze';
      for (let s = 0; s < 64; s++) {
        const p = board[s];
        if (p && typeOf(p) !== K && (colorOf(p) !== c) === enemy) out.push({ from: s, to: s, captures: [], power: tag });
      }
      return;
    }
    case 'Strike': {
      // Any own non-king piece moves as a queen, as the whole turn; it keeps its own type (`landed`)
      // and its own capture rules (`canCapture` with the real byte), and never takes a king.
      const capture = RULES.strikeMode === 'capture';
      for (let s = 0; s < 64; s++) {
        const p = board[s];
        if (!p || colorOf(p) !== c || typeOf(p) === K || (typeOf(p) === P && !RULES.strikePawns)) continue;
        for (const [df, dr] of DIRS8) {
          for (let to = step(s, df, dr); to >= 0; to = step(to, df, dr)) {
            const v = board[to];
            if (!v) {
              if (!capture) out.push({ from: s, to, captures: [], power: 'strike' });
              continue;
            }
            // The first occupied square stops the walk in both readings; only `move` passes through
            // empty squares. `capture` takes a queen-reach victim and stays where it stood.
            if (RULES.strikeCaptures && colorOf(v) !== c && typeOf(v) !== K && canCapture(p, typeOf(v)) && !(typeOf(p) === P && inLight(board, to, c ^ 1))) {
              out.push(capture ? { from: s, to: s, captures: [to], power: 'strike' } : { from: s, to, captures: [to], power: 'strike' });
            }
            break;
          }
        }
      }
      return;
    }
    case 'Haste': {
      // Any ordinary move, after which the same piece may move again. A paladin that removes itself
      // has no second move to make, so its captures are not offered as a Haste.
      // `hasteCaptures: false` (balance lab): the first move is quiet too.
      for (let i = n0; i < n1; i++) if (!out[i].selfRemove && (RULES.hasteCaptures || !out[i].captures.length)) out.push({ ...out[i], power: 'haste' });
      return;
    }
    case 'Flight': {
      // Any own non-king piece to any empty square of its own half (ranks 1-4 / 5-8). A pawn may not
      // land on its own back rank, where no pawn ever stands; it may fly back to its start rank and
      // regain the double step, which is a rank test, not history.
      const lo = c === WHITE ? 0 : 32, back = c === WHITE ? 0 : 7;
      for (let s = 0; s < 64; s++) {
        const p = board[s];
        if (!p || colorOf(p) !== c || typeOf(p) === K) continue;
        const pawn = typeOf(p) === P;
        for (let t = lo; t < lo + 32; t++) {
          if (board[t] || (pawn && rank(t) === back) || !guardMayLand(p, t)) continue;
          out.push({ from: s, to: t, captures: [], power: 'flight' });
        }
      }
      return;
    }
    case 'Sacrifice': {
      // An own pawn becomes a piece the side lost earlier, on the pawn's square; the pawn leaves play.
      // Never a guard (a pawn may not become a wall, docs/RULES.md §6.13) and never a pawn or king.
      if (!lost) return;
      // `sacrificeBehind` (balance lab): only while this side has fewer pieces, kings and pawns aside.
      if (RULES.sacrificeBehind) {
        let mine = 0, theirs = 0;
        for (let s = 0; s < 64; s++) {
          const p = board[s];
          if (p && typeOf(p) !== P && typeOf(p) !== K) { if (colorOf(p) === c) mine++; else theirs++; }
        }
        if (mine >= theirs) return;
      }
      const types: PieceType[] = [];
      for (let t = 1; t < 16; t++) if (t !== P && t !== K && t !== G && lost[c * 16 + t] > 0) types.push(t as PieceType);
      if (!types.length) return;
      const pawn = piece(P, c);
      for (let s = 0; s < 64; s++) if (board[s] === pawn) for (const promo of types) out.push({ from: s, to: s, captures: [], promo, power: 'sacrifice' });
      return;
    }
    case 'March': {
      // Counted reading: the double step from a rank other than the start rank, both squares empty.
      const dr = fwd(c), startRank = c === WHITE ? 1 : 6, lastRank = c === WHITE ? 7 : 0, pawn = piece(P, c);
      for (let s = 0; s < 64; s++) {
        if (board[s] !== pawn || rank(s) === startRank) continue;
        const s1 = step(s, 0, dr), s2 = s1 < 0 ? -1 : step(s1, 0, dr);
        if (s2 < 0 || board[s1] || board[s2]) continue;
        if (rank(s2) === lastRank) for (const promo of PROMOTION_SETS[RULES.promotionSet]) out.push({ from: s, to: s2, captures: [], promo, power: 'march' });
        else out.push({ from: s, to: s2, captures: [], power: 'march' });
      }
      return;
    }
    case 'Leap': {
      // Counted reading: a rook, bishop or queen continues past its own pawns; a square reached only
      // over one is a Leap. Every other blocker stops the ray, and a Leap never takes a king.
      for (let s = 0; s < 64; s++) {
        const p = board[s];
        if (!p || colorOf(p) !== c) continue;
        const t = typeOf(p);
        const dirs = t === R ? ORTHO : t === B ? DIAG : t === Q ? DIRS8 : null;
        if (!dirs) continue;
        for (const [df, dr] of dirs) {
          let jumped = false;
          for (let to = step(s, df, dr); to >= 0; to = step(to, df, dr)) {
            const v = board[to];
            if (!v) { if (jumped) out.push({ from: s, to, captures: [], power: 'leap' }); continue; }
            if (colorOf(v) === c && typeOf(v) === P) { jumped = true; continue; }
            if (jumped && colorOf(v) !== c && typeOf(v) !== K && canCapture(p, typeOf(v))) out.push({ from: s, to, captures: [to], power: 'leap' });
            break;
          }
        }
      }
      return;
    }
  }
}

/**
 * Drop the moves a Freeze or Ice Wall mark forbids the side to move `c` (from `out[n0]` on). A
 * frozen piece does not move by any hand: not itself, not by its own maester's swap or ogre's shove
 * (it may still be warded). A warded piece cannot be captured, by a chain either — the chain's
 * shorter prefixes stay. Neither changes an attack: a frozen piece still gives check.
 */
export function filterMarks(c: Color, mark: number | undefined, markBy: Color | undefined, out: Move[], n0 = 0, ward: boolean | undefined = false): void {
  if (mark === undefined || mark < 0) return;
  const kind = markKind(c, markBy, ward);
  if (!kind) return;
  let n = n0;
  for (let i = n0; i < out.length; i++) {
    const m = out[i];
    const blocked = kind === 'frozen'
      ? (m.from === mark && m.power !== 'ward' && m.power !== 'freeze') || (m.swap === true && m.to === mark) || m.shove?.from === mark
      : m.captures.includes(mark);
    if (!blocked) out[n++] = m;
  }
  out.length = n;
}

/**
 * Haste's second move: only the hasted piece on `at` moves, and never onto a king (the first move
 * may have given check). `pass` ends the turn instead, so the side always has a move here.
 */
export function genHasteFollowUp(board: Uint8Array, at: number, mode: GenMode, out: Move[]): void {
  const n0 = out.length;
  genPiece(board, at, mode, out);
  // `hasteSecond: 'quiet'` (balance lab): the second move captures nothing at all.
  const quiet = RULES.hasteSecond === 'quiet' || !RULES.hasteCaptures;
  let n = n0;
  for (let i = n0; i < out.length; i++) {
    const m = out[i];
    if (quiet ? m.captures.length === 0 : !m.captures.some(s => typeOf(board[s]) === K)) out[n++] = m;
  }
  out.length = n;
  if (mode === 'all') out.push({ from: at, to: at, captures: [], pass: true });
}

/** `freezeQuiet` (balance lab): the ordinary move after a free Freeze takes nothing. */
export function filterFree(c: Color, free: boolean | undefined, out: Move[]): void {
  // ponytail: in card mode `freezeQuiet` does nothing (a lab reading, off in the official set); pass the mark's kind if it is ever needed there.
  if (!free || !RULES.freezeQuiet || powerOf(c) !== 'Freeze') return;
  let n = 0;
  for (let i = 0; i < out.length; i++) if (!out[i].captures.length) out[n++] = out[i];
  out.length = n;
}

/** The `pass` that ends a free-mark turn without an ordinary move, named by the side's king square. */
export function freePass(board: Uint8Array, c: Color): Move {
  const k = findKing(board, c);
  return { from: k, to: k, captures: [], pass: true };
}

export function pseudoMoves(pos: Position, mode: GenMode = 'all'): Move[] {
  const out: Move[] = [];
  const c = pos.turn;
  if (pos.haste !== undefined) genHasteFollowUp(pos.board, pos.haste, mode, out);
  else {
    for (let s = 0; s < 64; s++) if (pos.board[s] && colorOf(pos.board[s]) === c) genPiece(pos.board, s, mode, out);
    // After a free mark (`markFree`): the ordinary move, or end the turn; no second power.
    if (pos.free) { filterFree(c, true, out); if (mode === 'all') out.push(freePass(pos.board, c)); }
    else if (mode === 'all') genPowerMoves(pos.board, c, pos.used?.[c] ?? 0, pos.lost, out, 0, out.length);
  }
  // Only the opponent's mark binds the side to move.
  const theirs = pos.marks?.[c ^ 1];
  if (theirs) filterMarks(c, theirs.sq, (c ^ 1) as Color, out, 0, theirs.ward);
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
    // The ogre is a commoner, so it mates with a king — except under `ogreNoCapture`, where it can
    // never give check and K+O vs K is exact, not conservative. The catapult needs a screen it
    // cannot make for itself, but a single enemy piece is screen enough, so it counts too — this
    // test is meant to be conservative, and declaring a live game drawn is the expensive direction
    // to be wrong in.
    if (t === P || t === R || t === Q || t === A || t === M || t === S || t === C || t === T) return false;
    if (t === O && !RULES.ogreNoCapture) return false;
    if (t === G && RULES.guardCaptures === 'any') return false; // a commoner guard mates with a king; a pawn-only guard cannot
    if (t === L && RULES.paladinChecks) return false; // a paladin that may take a king can mate with one
    if (t === N || t === B || t === V) minors[colorOf(p)]++; // a lone leaper cannot mate: K+V vs K is drawn
  }
  return minors[WHITE] <= 1 && minors[BLACK] <= 1;
}

/** Material draw under the active rules; an unspent Strike can still change mating potential. */
export function materialDraw(board: Uint8Array, used?: readonly [number, number]): boolean {
  const liveStrike = (c: Color): boolean => handOf(c).length ? holdsCard(c, used?.[c] ?? 0, 'Strike') : powerOf(c) === 'Strike' && canSpend(c, used?.[c] ?? 0);
  return RULES.insufficientMaterial && !liveStrike(WHITE) && !liveStrike(BLACK) && insufficientMaterial(board);
}

export type Status = 'playing' | 'checkmate' | 'stalemate' | 'draw50' | 'drawRepetition' | 'drawMaterial';

/** Pure: repetition needs move history, so only `Game.status` can report 'drawRepetition'. */
export function status(pos: Position): Status {
  if (findKing(pos.board, pos.turn) < 0) return 'checkmate';
  if (legalMoves(pos).length === 0) return inCheck(pos) ? 'checkmate' : 'stalemate';
  if (RULES.fiftyMove && pos.halfmove >= 100) return 'draw50';
  if (materialDraw(pos.board, pos.used)) return 'drawMaterial';
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
