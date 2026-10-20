import { afterEach, expect, it } from 'vitest';
import { DEAL_CARDS } from './match/setup';
import { cardPicture, cardSymbol } from './card-symbol';
import { K, legalMoves, makeMove, N, P, parseSq, piece, R, setRules } from './rules/engine';
import { fromFen, toLan } from './rules/setup';

afterEach(() => setRules());

it('gives every dealt card a symbol with no letters', () => {
  const missing = ['Curse','MirrorB','MorphP','FireStarter','Burn','Rally','Control','EarthQuake','Firewall'] as const;
  const symbols = missing.map(card => cardSymbol(card).replace(/ data-card-symbol="[^"]+"/, ''));
  expect(new Set(symbols).size).toBe(missing.length);
  for (const card of DEAL_CARDS) {
    expect(cardSymbol(card)).toContain(`data-card-symbol="${card}"`);
    expect(cardSymbol(card)).toContain('aria-hidden="true"');
    expect(cardSymbol(card)).not.toMatch(/undefined|<text| data-card=/);
    expect(cardPicture(card)).toContain(`class="card-picture" data-card-picture="${card}"`);
    expect(cardPicture(card)).not.toMatch(/undefined|<text|back.webp| data-card=/);
  }
});

it.each(['Burn', 'FireStarter', 'Control'] as const)('shows no pawn for %s, which cannot use a pawn', card => {
  expect(cardPicture(card)).not.toContain('data-piece="pawn"');
  expect(cardPicture(card)).toContain('data-piece="knight"');
});

it('shows Control borrowing a rook move from an adjacent friendly rook', () => {
  const picture = cardPicture('Control');
  expect(picture.match(/data-piece="knight"/g)).toHaveLength(1);
  expect(picture.match(/data-piece="rook"/g)).toHaveLength(1);
  expect(picture).not.toContain('fill="#514638"');
  expect(picture).not.toContain('M25 10h30');
  const squares = [...picture.matchAll(/data-square="([a-h][1-8])"/g)].map(match => parseSq(match[1]));
  const lan = picture.match(/data-move="([^"]+)"/)![1];
  setRules({ hands: [['Control'], []] });
  const pos = fromFen('4k3/7p/8/8/8/8/8/4K3 w - - 0 1');
  pos.board[squares[0]] = piece(N, 0); pos.board[squares[1]] = piece(R, 0);
  const move = legalMoves(pos).find(move => toLan(pos, move) === lan)!;
  expect(move).toMatchObject({ from: squares[0], to: parseSq('a2'), power: 'control' });
  expect(move.swap).toBeUndefined();
  expect(move.shove).toBeUndefined();
  const next = makeMove(pos, move);
  expect(next.board[move.to]).toBe(piece(N, 0));
  expect(next.board[squares[1]]).toBe(piece(R, 0));
  pos.board[squares[1]] = piece(N, 0);
  expect(legalMoves(pos).some(move => toLan(pos, move) === lan)).toBe(false);
});

it('shows the right pawn count for Spawn', () => {
  for (const card of ['Spawn2', 'SpawnK2'] as const) expect(cardPicture(card).match(/data-piece="pawn"/g)).toHaveLength(2);
  for (const card of ['SpawnK', 'SpawnK2'] as const) expect(cardPicture(card)).toContain('data-piece="king"');
});

it.each(['SpawnK', 'SpawnK2'] as const)('shows a legal %s drop on distinct squares next to the king', card => {
  const picture = cardPicture(card);
  // The three columns start at file a. The lower row is rank 2; the upper row is rank 3.
  const pieces = [...picture.matchAll(/data-piece="(king|pawn)" transform="translate\((\d+) (\d+)\)"/g)].map(([, kind, x, y]) => ({
    kind, square: Math.floor((Number(x) + 8 - 10) / 20) + 8 * (2 - Math.floor((Number(y) + 8 - 6) / 18)),
  }));
  const king = pieces.find(piece => piece.kind === 'king');
  expect(king).toBeDefined();
  const pawns = pieces.filter(piece => piece.kind === 'pawn').map(piece => piece.square).sort((a, b) => a - b);
  expect(pawns).toHaveLength(card === 'SpawnK2' ? 2 : 1);
  expect(new Set(pawns).size).toBe(pawns.length);
  setRules({ hands: [[card], []] });
  const pos = fromFen('7k/7p/8/8/8/8/8/8 w - - 0 1');
  pos.board[king!.square] = piece(K, 0);
  const move = legalMoves(pos).find(move => move.power === (card === 'SpawnK2' ? 'spawnk2' : 'spawnk')
    && [move.to, ...(move.drop2 === undefined ? [] : [move.drop2])].sort((a, b) => a - b).join() === pawns.join());
  expect(move).toBeDefined();
  const next = makeMove(pos, move!);
  expect(next.board[king!.square]).toBe(piece(K, 0));
  for (const square of pawns) expect(next.board[square]).toBe(piece(P, 0));
});
