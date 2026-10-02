import { afterEach, beforeEach, expect, it } from 'vitest';
import { Color, Position, inCheck, legalMoves, makeMove, setRules, status } from '../rules/engine';
import { fromFen, toLan } from '../rules/setup';
import { quiesceScore, resetSearchState, search } from './search';

beforeEach(() => { setRules(); resetSearchState(); });
afterEach(() => { setRules(); resetSearchState(); });

function flip(pos: Position): Position {
  const board = new Uint8Array(64);
  pos.board.forEach((p, square) => { if (p) board[square ^ 56] = p ^ 16; });
  return { ...pos, board, turn: (pos.turn ^ 1) as Color,
    ...(pos.used ? { used: [pos.used[1], pos.used[0]] as [number, number] } : {}),
    ...(pos.mark !== undefined ? { mark: pos.mark ^ 56 } : {}),
    ...(pos.haste !== undefined ? { haste: pos.haste ^ 56 } : {}),
    ...(pos.lost ? { lost: [...pos.lost.slice(16), ...pos.lost.slice(0, 16)] } : {}) };
}
const flipLan = (lan: string): string => lan.replace(/[a-h][1-8]/g, sq => sq[0] + (9 - +sq[1]));
const FENS: readonly string[] = [
  // Ogre shove Oc4>c5-c6
  '7k/8/8/2p5/2O5/8/8/4K3 w - - 0 1',
  // Ogre push of own pawn Od4>d5-d6
  '7k/8/8/3P4/3O4/8/8/4K3 w - - 0 1',
  // Archer shot Ae4*e6
  '7k/8/4p3/8/4A3/8/8/K7 w - - 0 1',
  // Archer shot Ac3*c5
  '7k/8/8/2p5/8/2A5/8/4K3 w - - 0 1',
  // Beast step (empty board around d4)
  '7k/8/8/8/3S4/8/8/K7 w - - 0 1',
  // Beast capture Se4xe5
  '7k/8/8/4p3/4S3/8/8/7K w - - 0 1',
  // Maester swap Ma1<>b1
  'k7/8/8/8/8/8/8/MN5K w - - 0 1',
  // Maester adjacent capture
  '7k/8/8/8/8/8/1n6/M3K3 w - - 0 1',
  // Guard beside pawn (no capture under shipped rules)
  '7k/8/8/4p3/4G3/8/8/7K w - - 0 1',
  // Guard alone on e4
  '7k/8/8/8/4G3/8/8/7K w - - 0 1',
  // Pawn double/single from e2
  '7k/8/8/8/8/8/4P3/4K3 w - - 0 1',
  // Black pawn from e7
  '4k3/4p3/8/8/8/8/8/4K3 b - - 0 1',
  // Quiet king + rook
  '7k/8/8/8/8/8/8/R3K3 w - - 0 1',
  // Checkmate (Black to move)
  '7k/6Q1/6K1/8/8/8/8/8 b - - 0 1',
  // Mid-board ogre + archer clutter
  '6k1/8/3p4/2pA4/2O5/8/8/4K3 w - - 0 1',
];


it.each(FENS)('legal moves and status mirror: %s', fen => {
  const pos = fromFen(fen), other = flip(pos);
  expect(legalMoves(other).map(m => toLan(other, m)).sort())
    .toEqual(legalMoves(pos).map(m => flipLan(toLan(pos, m))).sort());
  expect(status(other)).toBe(status(pos));
});

it.each(FENS.filter(fen => status(fromFen(fen)) === 'playing'))('search mirrors with genuine move ties: %s', fen => {
  const pos = fromFen(fen), other = flip(pos);
  const a = search(pos, { maxDepth: 1 });
  resetSearchState();
  const b = search(other, { maxDepth: 1 });
  expect(a.score).toBe(b.score);
  expect(a.move).not.toBeNull(); expect(b.move).not.toBeNull();
  const mapped = legalMoves(other).find(m => toLan(other, m) === flipLan(toLan(pos, a.move!)));
  expect(mapped).toBeDefined();
  // If move order chooses a different best move, score both candidates at the same horizon.
  // These sparse tied fixtures do not enter the main search's check extension.
  if (toLan(other, mapped!) !== toLan(other, b.move!)) {
    const mappedChild = makeMove(other, mapped!), chosenChild = makeMove(other, b.move!);
    expect(inCheck(mappedChild)).toBe(false); expect(inCheck(chosenChild)).toBe(false);
    expect(-quiesceScore(mappedChild)).toBe(b.score);
    expect(quiesceScore(chosenChild)).toBe(quiesceScore(mappedChild));
  }
});
