/**
 * The search's legal-move filter skips the king-safety probe for moves that cannot expose the king
 * (`genLegal` in ./search.ts). Held to the engine's own `legalMoves`, which makes every move and looks
 * at the king, on random positions with every piece type (catapults included: their screen is the
 * one way an arriving piece can expose a king) and random kings' powers, or random card hands, or
 * the Darkness and Mercy lab readings (the Darkness king's two-square take adds an attack over a
 * square next to the king it attacks).
 */
import { afterEach, expect, it } from 'vitest';
import {
  A, B, BLACK, C, Color, G, K, L, M, Mark, N, O, P, PieceType, Position, Q, R, S, T, V, WHITE, inCheck, legalMoves, piece,
} from '../rules/engine';
import { CARD_ONLY, CardName, KINGS, KingChoice, KingName, PowerName, Rules, TIER1, USES_RULE, setRules } from '../rules/rules';
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
  const CARDS: readonly CardName[] = [...(Object.keys(USES_RULE) as PowerName[]), ...CARD_ONLY, ...CARD_ONLY]; // the new cards twice as often
  const STATELESS = POWERS.filter(k => TIER1.includes(k.power) && k.power !== 'March' && k.power !== 'Leap');
  let checked = 0, inCheckCount = 0;
  const played = new Set<string>();
  for (let trial = 0; trial < 3000; trial++) {
    const board = randomBoard(rng);
    const turn = (rng() < 0.5 ? WHITE : BLACK) as Color;
    const pos: Position = { board, turn, halfmove: 0, ply: 0 };
    if (inCheck(pos, (turn ^ 1) as Color)) continue;
    const hand = (): CardName[] => Array.from({ length: 1 + Math.floor(rng() * 4) }, () => pick(CARDS));
    const hw = hand(), hb = hand();
    setRules({ hands: [hw, hb], kings: [rng() < 0.3 ? pick(STATELESS) : null, rng() < 0.3 ? pick(STATELESS) : null], markTurns: rng() < 0.5 ? 2 : 1 });
    // Some cards already played, some marks set (by either side, a card-mode Ice Wall or a Freeze).
    pos.used = [Math.floor(rng() * (1 << hw.length)) & ~1, Math.floor(rng() * (1 << hb.length)) & ~1];
    const mark = (): Mark | undefined => (rng() < 0.4 ? { sq: Math.floor(rng() * 64), ...(rng() < 0.5 ? { ward: true } : {}) } : undefined);
    pos.marks = [mark(), mark()];
    if (hw.includes('Sacrifice') || hb.includes('Sacrifice')) { const lost = new Array<number>(32).fill(0); lost[pick(TYPES)] = 1; lost[16 + pick(TYPES)] = 1; pos.lost = lost; }
    if (inCheck(pos)) inCheckCount++;
    const engineMoves = legalMoves(pos);
    for (const m of engineMoves) if (m.power) played.add(m.power);
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
  for (const tag of ['mimic', 'vault', 'curse', 'skylift']) expect(played).toContain(tag);
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
  const SETS: Rules['archerShots'][] = ['plusDiagFwd2', 'plusDiagFwd2Clear', 'fwd2NoBack', 'fwd2NoSide', 'far2', 'over2', 'nearOver2'];
  let checked = 0, inCheckCount = 0;
  const changed: Record<string, number> = {};
  for (let trial = 0; trial < 10500; trial++) {
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
