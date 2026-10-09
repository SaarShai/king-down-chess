/**
 * The search's legal-move filter skips the king-safety probe for moves that cannot expose the king
 * (`genLegal` in ./search.ts). Held to the engine's own `legalMoves`, which makes every move and looks
 * at the king, on random positions with every piece type (catapults included: their screen is the
 * one way an arriving piece can expose a king) and random kings' powers, or random card hands, or
 * the Darkness and Mercy lab readings (the Darkness king's two-square take adds an attack over a
 * square next to the king it attacks), or guards waiting to enter (`guardReserve`; a drop fills a
 * square, which only a catapult's screen turns against the king). The card hands hold the 2014
 * cards too, with their state: piles and drawn cards, a last card to mirror, Firewall marks, ended
 * marks a Rescue may renew, and a Rage's pending second move. The Morph cards change a piece's type
 * on its square, which the fast path never probes outside a check; the Spawn cards drop one or two
 * pawns, which only a catapult's screen turns against the king. MorphP changes a pawn's type on its
 * square and MorphS swaps two own pieces: neither changes which squares are filled, so neither ever
 * changes whether the own king is in check.
 */
import { afterEach, expect, it } from 'vitest';
import {
  A, B, BLACK, C, Color, G, K, L, M, Mark, N, O, P, PieceType, Position, Q, R, S, T, V, WHITE, inCheck, legalMoves, makeMove, piece, pseudoMoves,
} from '../rules/engine';
import { CARD_ONLY, CardName, KINGS, KingChoice, KingName, PowerName, RULES, Rules, TIER1, USES_RULE, setRules } from '../rules/rules';
import { toFen, toLan } from '../rules/setup';
import { searchLegal, setFastLegality } from './search';

afterEach(() => { setRules(); setFastLegality(true); });

const TYPES: PieceType[] = [P, N, B, R, Q, A, L, G, M, S, O, C, V, T];
const POWERS = (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).flatMap(([king, ps]) => ps.map(power => ({ king, power })));

/** A random position: both kings apart, about 30% of the other squares holding a random piece. */
function randomBoard(rng: () => number): Uint8Array {
  const board = new Uint8Array(64);
  const kw = Math.floor(rng() * 64);
  let kb = Math.floor(rng() * 64);
  while (kb === kw || Math.max(Math.abs((kb & 7) - (kw & 7)), Math.abs((kb >> 3) - (kw >> 3))) < 2) kb = Math.floor(rng() * 64);
  board[kw] = piece(K, WHITE);
  board[kb] = piece(K, BLACK);
  for (let s = 0; s < 64; s++) {
    if (board[s] || rng() < 0.7) continue;
    const t = TYPES[Math.floor(rng() * TYPES.length)];
    if (t === P && (s < 8 || s >= 56)) continue;
    board[s] = piece(t, rng() < 0.5 ? WHITE : BLACK);
  }
  return board;
}

it('skipping the king probe never changes the legal moves', () => {
  let seed = 4242;
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  let checked = 0, inCheckCount = 0;
  for (let trial = 0; trial < 4000; trial++) {
    const board = randomBoard(rng);
    const turn = (rng() < 0.5 ? WHITE : BLACK) as Color;
    const pos: Position = { board, turn, halfmove: 0, ply: 0 };
    if (inCheck(pos, (turn ^ 1) as Color)) continue; // the side not to move may not be in check
    const pw = rng() < 0.6 ? POWERS[Math.floor(rng() * POWERS.length)] : null;
    const pb = rng() < 0.6 ? POWERS[Math.floor(rng() * POWERS.length)] : null;
    setRules({ kings: [pw, pb] });
    if (inCheck(pos)) inCheckCount++;
    const engine = legalMoves(pos).map(m => toLan(pos, m)).sort();
    const fast = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(false);
    const slow = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(true);
    expect(fast, `${toFen(pos)} kings ${JSON.stringify([pw, pb])}`).toEqual(slow);
    expect(fast, toFen(pos)).toEqual(engine);
    checked++;
  }
  expect(checked).toBeGreaterThan(1000);
  expect(inCheckCount).toBeGreaterThan(50);
}, 120_000);

it('the same with card hands, the card-only cards included, and marks on the board', () => {
  let seed = 9191;
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const pick = <X>(xs: readonly X[]): X => xs[Math.floor(rng() * xs.length)];
  const CARDS: readonly CardName[] = [...(Object.keys(USES_RULE) as PowerName[]), ...CARD_ONLY, ...CARD_ONLY]; // the card-only cards twice as often
  const STATELESS = POWERS.filter(k => TIER1.includes(k.power) && k.power !== 'March' && k.power !== 'Leap');
  let checked = 0, inCheckCount = 0;
  const played = new Set<string>();
  for (let trial = 0; trial < 4000; trial++) {
    const board = randomBoard(rng);
    const turn = (rng() < 0.5 ? WHITE : BLACK) as Color;
    const pos: Position = { board, turn, halfmove: 0, ply: 0 };
    if (inCheck(pos, (turn ^ 1) as Color)) continue;
    const hand = (): CardName[] => Array.from({ length: 1 + Math.floor(rng() * 4) }, () => pick(CARDS));
    const hw = hand(), hb = hand(), pw = hand(), pb = hand();
    const markFree = rng() < 0.8;
    setRules({ hands: [hw, hb], piles: [pw, pb], kings: [rng() < 0.3 ? pick(STATELESS) : null, rng() < 0.3 ? pick(STATELESS) : null], markTurns: rng() < 0.5 ? 2 : 1, markFree });
    // Some cards drawn and some played; the last card of each side; some marks set (by either side:
    // a Freeze, a card-mode Ice Wall or Firewall, or one just ended).
    pos.drawn = [Math.floor(rng() * 3), Math.floor(rng() * 3)];
    pos.used = [Math.floor(rng() * (1 << (hw.length + pos.drawn[0]))) & ~1, Math.floor(rng() * (1 << (hb.length + pos.drawn[1]))) & ~1];
    pos.last = [rng() < 0.6 ? pick(CARDS) : undefined, rng() < 0.6 ? pick(CARDS) : undefined];
    const mark = (): Mark | undefined => {
      if (rng() < 0.5) return undefined;
      const r = rng();
      return { sq: Math.floor(rng() * 64), ...(r < 0.3 ? { ward: true } : r < 0.5 ? { ward: true, all: true } : {}), ...(rng() < 0.3 ? { left: 0 } : {}) };
    };
    pos.marks = [mark(), mark()];
    // A Rage's (RageB's, Rally's) second move pending for a piece of the side to move.
    if (rng() < 0.15) {
      const own = [...board.keys()].filter(s => board[s] && (board[s] >> 4 & 1) === turn && (board[s] & 15) !== K);
      if (own.length) { pos.haste = pick(own); pos.rage = (1 + Math.floor(rng() * 3)) as 1 | 2 | 3; }
    }
    if ([...hw, ...hb, ...pw, ...pb].some(h => h === 'Sacrifice' || h === 'Salvation')) { const lost = new Array<number>(32).fill(0); lost[pick(TYPES)] = 1; lost[16 + pick(TYPES)] = 1; pos.lost = lost; }
    if (inCheck(pos)) inCheckCount++;
    const engineMoves = legalMoves(pos);
    for (const m of engineMoves) { if (m.power) played.add(m.power); if (m.via) played.add(m.via); if (pos.rage && !m.pass) played.add(`rage${pos.rage}`); }
    const engine = engineMoves.map(m => toLan(pos, m)).sort();
    const fast = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(false);
    const slow = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(true);
    const where = `${toFen(pos)} hands ${JSON.stringify([hw, hb])}`;
    expect(new Set(engine).size, where).toBe(engine.length); // every move has its own notation
    expect(fast, where).toEqual(slow);
    expect(fast, where).toEqual(engine);
    checked++;
  }
  expect(checked).toBeGreaterThan(1000);
  expect(inCheckCount).toBeGreaterThan(50);
  for (const tag of ['mimic', 'vault', 'curse', 'skylift', 'salvation', 'rage', 'rageb', 'firewall', 'firewallb', 'quake', 'quakeb', 'burn', 'firestarter',
    'control', 'rescue', 'growth', 'growthb', 'mirror', 'mirrorb', 'rally', 'morph', 'morphb', 'spawn', 'spawnk', 'spawn2', 'spawnk2', 'morphp', 'morphs',
    'rage1', 'rage2', 'rage3']) expect(played).toContain(tag);
}, 120_000);

it('the same with guards waiting to enter, more catapults on the board, and Salvation cards', () => {
  let seed = 2020;
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  let checked = 0, inCheckCount = 0, drops = 0, refused = 0;
  for (let trial = 0; trial < 3000; trial++) {
    const board = randomBoard(rng);
    // A catapult on a random empty square for either side: a dropped piece may become its screen.
    for (const c of [WHITE, BLACK]) { const s = Math.floor(rng() * 64); if (!board[s] && rng() < 0.6) board[s] = piece(C, c); }
    const turn = (rng() < 0.5 ? WHITE : BLACK) as Color;
    const pos: Position = { board, turn, halfmove: 0, ply: 0, waiting: [rng() < 0.7 ? 1 : 0, rng() < 0.7 ? 1 : 0] };
    if (inCheck(pos, (turn ^ 1) as Color)) continue;
    const salvation = rng() < 0.3;
    if (salvation) { const lost = new Array<number>(32).fill(0); lost[N] = 1; lost[16 + Q] = 1; lost[R] = 1; lost[16 + R] = 1; pos.lost = lost; }
    setRules({
      guardReserve: rng() < 0.5 ? 'rank1' : 'rank12', guardNoSecondRank: rng() < 0.2,
      ...(salvation ? { hands: [['Salvation'], ['Salvation']] as const } : {}),
    });
    if (inCheck(pos)) inCheckCount++;
    const engineMoves = legalMoves(pos);
    drops += engineMoves.filter(m => m.drop).length;
    refused += pseudoMoves(pos).filter(m => m.drop).length - engineMoves.filter(m => m.drop).length;
    const engine = engineMoves.map(m => toLan(pos, m)).sort();
    const fast = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(false);
    const slow = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(true);
    const where = `${toFen(pos)} ${JSON.stringify(RULES.guardReserve)}`;
    expect(fast, where).toEqual(slow);
    expect(fast, where).toEqual(engine);
    checked++;
  }
  expect(checked).toBeGreaterThan(1000);
  expect(inCheckCount).toBeGreaterThan(50);
  expect(drops).toBeGreaterThan(3000); // 2026-10-04: 4,950 drops
  expect(refused, String(refused)).toBeGreaterThan(3000); // drops that leave the king in check or do not answer one (2026-10-04: 6,735)
}, 120_000);

it('the same with the Spawn cards and more catapults on the board (a new pawn may become a screen)', () => {
  let seed = 3131;
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const SPAWNS: readonly CardName[] = ['Spawn', 'SpawnK', 'Spawn2', 'SpawnK2'];
  let checked = 0, inCheckCount = 0, spawns = 0, refused = 0, screens = 0;
  for (let trial = 0; trial < 3000; trial++) {
    const board = randomBoard(rng);
    for (const c of [WHITE, BLACK]) { const s = Math.floor(rng() * 64); if (!board[s] && rng() < 0.6) board[s] = piece(C, c); }
    const turn = (rng() < 0.5 ? WHITE : BLACK) as Color;
    const pos: Position = { board, turn, halfmove: 0, ply: 0 };
    if (inCheck(pos, (turn ^ 1) as Color)) continue;
    const hand = (): CardName[] => SPAWNS.filter(() => rng() < 0.5);
    setRules({ hands: [hand(), hand()] });
    const checked0 = inCheck(pos);
    if (checked0) inCheckCount++;
    const engineMoves = legalMoves(pos);
    const out = pseudoMoves(pos).filter(m => m.drop).length - engineMoves.filter(m => m.drop).length;
    spawns += engineMoves.filter(m => m.drop).length;
    refused += out;
    if (!checked0) screens += out; // not in check: only a catapult's new screen refuses a spawn
    const engine = engineMoves.map(m => toLan(pos, m)).sort();
    const fast = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(false);
    const slow = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(true);
    const where = `${toFen(pos)} hands ${JSON.stringify(RULES.hands)}`;
    expect(fast, where).toEqual(slow);
    expect(fast, where).toEqual(engine);
    checked++;
  }
  expect(checked).toBeGreaterThan(1000);
  expect(inCheckCount).toBeGreaterThan(50);
  expect(spawns).toBeGreaterThan(5000); // 2026-10-06: 7,959 spawns
  expect(refused).toBeGreaterThan(5000); // spawns that leave the king in check or do not answer one (10,310)
  expect(screens).toBeGreaterThan(40); // of them, out of check: a new pawn screens a catapult (88)
}, 120_000);

it('the same with MorphP and MorphS, more catapults, marks and the always-on kings (the king\'s safety never changes)', () => {
  let seed = 6262;
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const pick = <X>(xs: readonly X[]): X => xs[Math.floor(rng() * xs.length)];
  const STATELESS = POWERS.filter(k => TIER1.includes(k.power) && k.power !== 'March' && k.power !== 'Leap');
  const SOFT: readonly CardName[] = ['MorphP', 'MorphS'];
  const soft = (m: { power?: string }): boolean => m.power === 'morphp' || m.power === 'morphs';
  /** Own pieces that screen an enemy catapult's lob at the king on `k` (the first piece on a straight line, the catapult next). */
  const screensOf = (board: Uint8Array, k: number, c: Color): number[] => {
    const out: number[] = [];
    for (const [df, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const on: number[] = [];
      for (let f = (k & 7) + df, r = (k >> 3) + dr; f >= 0 && f < 8 && r >= 0 && r < 8 && on.length < 2; f += df, r += dr) if (board[r * 8 + f]) on.push(r * 8 + f);
      if (on.length === 2 && board[on[0]] >> 4 === c && board[on[1]] === piece(C, (c ^ 1) as Color)) out.push(on[0]);
    }
    return out;
  };
  let checked = 0, inCheckCount = 0, offered = 0, refusedIn = 0, refusedOut = 0, screened = 0;
  for (let trial = 0; trial < 3000; trial++) {
    const board = randomBoard(rng);
    for (const c of [WHITE, BLACK]) { const s = Math.floor(rng() * 64); if (!board[s] && rng() < 0.6) board[s] = piece(C, c); }
    const turn = (rng() < 0.5 ? WHITE : BLACK) as Color;
    const pos: Position = { board, turn, halfmove: 0, ply: 0 };
    if (inCheck(pos, (turn ^ 1) as Color)) continue;
    const hand = (): CardName[] => SOFT.filter(() => rng() < 0.7);
    setRules({ hands: [hand(), hand()], kings: [rng() < 0.3 ? pick(STATELESS) : null, rng() < 0.3 ? pick(STATELESS) : null] });
    const mark = (): Mark | undefined => (rng() < 0.6 ? undefined : { sq: Math.floor(rng() * 64) });
    pos.marks = [mark(), mark()];
    const checked0 = inCheck(pos);
    if (checked0) inCheckCount++;
    const engineMoves = legalMoves(pos);
    const pseudo = pseudoMoves(pos).filter(soft);
    for (const m of pseudo) expect(inCheck(makeMove(pos, m), turn), `${toFen(pos)} ${toLan(pos, m)}`).toBe(checked0);
    // A catapult's screen in the king's line: a MorphP of that pawn or a MorphS of that piece keeps the check.
    const screens = screensOf(board, board.indexOf(piece(K, turn)), turn);
    screened += pseudo.filter(m => screens.includes(m.from) || screens.includes(m.to)).length;
    const legal = engineMoves.filter(soft).length;
    offered += legal;
    if (checked0) { expect(legal, toFen(pos)).toBe(0); refusedIn += pseudo.length; } else refusedOut += pseudo.length - legal;
    const engine = engineMoves.map(m => toLan(pos, m)).sort();
    const fast = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(false);
    const slow = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(true);
    const where = `${toFen(pos)} hands ${JSON.stringify(RULES.hands)} kings ${JSON.stringify(RULES.kings)}`;
    expect(fast, where).toEqual(slow);
    expect(fast, where).toEqual(engine);
    checked++;
  }
  expect(checked).toBeGreaterThan(1000);
  expect(inCheckCount).toBeGreaterThan(50);
  expect(offered).toBeGreaterThan(10000); // 2026-10-06: 14,251 in 1,322 positions
  expect(refusedOut).toBe(0); // out of check, nothing refused: no line opens, no screen comes or goes
  expect(refusedIn).toBeGreaterThan(10000); // in check, nothing offered: neither answers a check (15,759)
  expect(screened).toBeGreaterThan(100); // of them, a catapult's screen morphed or swapped away (148)
}, 120_000);

it('the same under the Darkness and Mercy readings, the round-16 and round-17 ones included', () => {
  let seed = 1616;
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const dark: KingChoice = { king: 'Shadow', power: 'Darkness' }, mercy: KingChoice = { king: 'Spirit', power: 'Mercy' };
  const READINGS: (keyof Rules)[] = [
    'darknessMoves', 'darknessShelter', 'darknessShelterPawnsTake', 'darknessPawnArmor', 'darknessAuraPawns', 'darknessKingStep2',
    'darknessKingStepSafe', 'darknessKingStepTakes',
    'mercyAura', 'mercyAuraPawnsTake', 'mercyTakesPawns', 'mercyNoJump',
  ];
  const ROUND16 = { darknessPawnArmor: false, darknessAuraPawns: false, darknessKingStep2: false, darknessKingStepSafe: false, darknessKingStepTakes: false };
  let checked = 0, inCheckCount = 0, changed = 0;
  for (let trial = 0; trial < 3000; trial++) {
    const board = randomBoard(rng);
    const turn = (rng() < 0.5 ? WHITE : BLACK) as Color;
    const pos: Position = { board, turn, halfmove: 0, ply: 0 };
    if (inCheck(pos, (turn ^ 1) as Color)) continue;
    // Darkness on one side or both; the other side Mercy, another power or a plain king.
    const other = rng() < 0.4 ? mercy : rng() < 0.5 ? POWERS[Math.floor(rng() * POWERS.length)] : null;
    const kings: Rules['kings'] = rng() < 0.3 ? [dark, dark] : rng() < 0.5 ? [dark, other] : [other, dark];
    const flags = Object.fromEntries(READINGS.map(r => [r, rng() < 0.5])) as Partial<Rules>;
    setRules({ kings, ...flags, ...ROUND16 });
    const without = legalMoves(pos).map(m => toLan(pos, m)).sort();
    setRules({ kings, ...flags });
    if (inCheck(pos)) inCheckCount++;
    const engine = legalMoves(pos).map(m => toLan(pos, m)).sort();
    const fast = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(false);
    const slow = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(true);
    const where = `${toFen(pos)} ${JSON.stringify({ kings, ...flags })}`;
    expect(fast, where).toEqual(slow);
    expect(fast, where).toEqual(engine);
    if (engine.join() !== without.join()) changed++;
    checked++;
  }
  expect(checked).toBeGreaterThan(1000);
  expect(inCheckCount).toBeGreaterThan(50);
  expect(changed).toBeGreaterThan(150); // the round-16 readings change the legal moves here (2026-10-03: 276 positions)
}, 120_000);

it('the same under each archer shot set, the three middle lab sets included (2026-10-04)', () => {
  // `plusDiagFwd2Clear` is the one shot set with a blocker: the square between the archer and a
  // two-square diagonal target. Moves that empty or fill it must stay exact.
  let seed = 1818;
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  // `over2` shoots only over a piece there, so a move that fills it can open a shot (2026-10-04).
  const SETS: Rules['archerShots'][] = ['far2', 'plusDiagFwd2', 'plusDiagFwd2Clear', 'fwd2NoBack', 'fwd2NoSide', 'over2', 'nearOver2', 'fwdNearOver2'];
  let checked = 0, inCheckCount = 0;
  const changed: Record<string, number> = {};
  for (let trial = 0; trial < 12000; trial++) {
    const board = randomBoard(rng);
    // More archers: each side gets one more on a random empty square.
    for (const c of [WHITE, BLACK]) { const s = Math.floor(rng() * 64); if (!board[s]) board[s] = piece(A, c); }
    const turn = (rng() < 0.5 ? WHITE : BLACK) as Color;
    const pos: Position = { board, turn, halfmove: 0, ply: 0 };
    const archerShots = SETS[trial % SETS.length];
    const kings: Rules['kings'] = [rng() < 0.3 ? POWERS[Math.floor(rng() * POWERS.length)] : null, rng() < 0.3 ? POWERS[Math.floor(rng() * POWERS.length)] : null];
    setRules({ archerShots, kings });
    if (inCheck(pos, (turn ^ 1) as Color)) continue;
    if (inCheck(pos)) inCheckCount++;
    const engine = legalMoves(pos).map(m => toLan(pos, m)).sort();
    const fast = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(false);
    const slow = searchLegal(pos).map(m => toLan(pos, m)).sort();
    setFastLegality(true);
    const where = `${toFen(pos)} ${JSON.stringify({ archerShots, kings })}`;
    expect(fast, where).toEqual(slow);
    expect(fast, where).toEqual(engine);
    setRules({ kings });
    if (legalMoves(pos).map(m => toLan(pos, m)).sort().join() !== engine.join()) changed[archerShots] = (changed[archerShots] ?? 0) + 1;
    checked++;
  }
  expect(checked).toBeGreaterThan(1000);
  expect(inCheckCount).toBeGreaterThan(50);
  // Each lab set changes the legal moves against today's default on some boards.
  for (const set of SETS.slice(1)) expect(changed[set] ?? 0, set).toBeGreaterThan(20);
}, 120_000);
