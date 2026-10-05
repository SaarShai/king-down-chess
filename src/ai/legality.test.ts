/**
 * The search's legal-move filter skips the king-safety probe for moves that cannot expose the king
 * (`genLegal` in ./search.ts). Held to the engine's own `legalMoves`, which makes every move and looks
 * at the king, on random positions with every piece type (catapults included: their screen is the
 * one way an arriving piece can expose a king) and random kings' powers, or random card hands, or
 * the Darkness and Mercy lab readings (the Darkness king's two-square take adds an attack over a
 * square next to the king it attacks), or guards waiting to enter (`guardReserve`; a drop fills a
 * square, which only a catapult's screen turns against the king). The card hands hold the 2014
 * cards too, with their state: piles and drawn cards, a last card to mirror, Firewall marks, ended
 * marks a Rescue may renew, and a Rage's pending second move.
 */
import { afterEach, expect, it } from 'vitest';
import {
  A, B, BLACK, C, Color, G, K, L, M, Mark, N, O, P, PieceType, Position, Q, R, S, T, V, WHITE, inCheck, legalMoves, piece, pseudoMoves,
} from '../rules/engine';
import { CARD_ONLY, CardName, DEFAULT_RULES, KINGS, KingChoice, KingName, PowerName, RULES, Rules, TIER1, USES_RULE, setRules } from '../rules/rules';
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
    // A Rage's (or RageB's) second move pending for a piece of the side to move.
    if (rng() < 0.15) {
      const own = [...board.keys()].filter(s => board[s] && (board[s] >> 4 & 1) === turn && (board[s] & 15) !== K);
      if (own.length) { pos.haste = pick(own); pos.rage = rng() < 0.5 ? 1 : 2; }
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
    'control', 'rescue', 'growth', 'growthb', 'mirror', 'mirrorb', 'rage1', 'rage2']) expect(played).toContain(tag);
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
  const SETS: Rules['archerShots'][] = ['plusDiagFwd2', 'plusDiagFwd2Clear', 'fwd2NoBack', 'fwd2NoSide', 'far2', 'over2', 'nearOver2', 'fwdNearOver2'];
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
  // Each set but today's default (`over2` since 2026-10-05) changes the legal moves on some boards.
  for (const set of SETS.filter(x => x !== DEFAULT_RULES.archerShots)) expect(changed[set] ?? 0, set).toBeGreaterThan(20);
}, 120_000);
