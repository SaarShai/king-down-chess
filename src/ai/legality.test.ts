/**
 * The search's legal-move filter skips the king-safety probe for moves that cannot expose the king
 * (`genLegal` in ./search.ts). Held to the engine's own `legalMoves`, which makes every move and looks
 * at the king, on random positions with every piece type (catapults included: their screen is the
 * one way an arriving piece can expose a king) and random kings' powers.
 */
import { afterEach, expect, it } from 'vitest';
import {
  A, B, BLACK, C, Color, G, K, L, M, N, O, P, PieceType, Position, Q, R, S, T, V, WHITE, inCheck, legalMoves, piece,
} from '../rules/engine';
import { KINGS, KingName, PowerName, setRules } from '../rules/rules';
import { toFen, toLan } from '../rules/setup';
import { searchLegal, setFastLegality } from './search';

afterEach(() => { setRules(); setFastLegality(true); });

const TYPES: PieceType[] = [P, N, B, R, Q, A, L, G, M, S, O, C, V, T];
const POWERS = (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).flatMap(([king, ps]) => ps.map(power => ({ king, power })));

it('skipping the king probe never changes the legal moves', () => {
  let seed = 4242;
  const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  let checked = 0, inCheckCount = 0;
  for (let trial = 0; trial < 4000; trial++) {
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
