import { expect, it } from 'vitest';
import { shouldPlayCeremony } from './ceremony-game';

it('plays your win against the computer', () => {
  expect(shouldPlayCeremony('checkmate', 1, ['human', 'ai'], null, null)).toBe(true);
});

it.each([0, 1] as const)('plays either mate on one device (loser %s)', turn => {
  expect(shouldPlayCeremony('checkmate', turn, ['human', 'human'], null, null)).toBe(true);
});

it.each([0, 1] as const)('plays only the local win in a link game (local %s)', local => {
  expect(shouldPlayCeremony('checkmate', local === 0 ? 1 : 0, ['human', 'human'], local, null)).toBe(true);
  expect(shouldPlayCeremony('checkmate', local, ['human', 'human'], local, null)).toBe(false);
});

it('keeps a loss against the computer quiet', () => {
  expect(shouldPlayCeremony('checkmate', 0, ['human', 'ai'], null, null)).toBe(false);
  expect(shouldPlayCeremony('checkmate', 1, ['ai', 'human'], null, null)).toBe(false);
});

it.each(['playing', 'stalemate', 'draw50', 'drawRepetition', 'drawMaterial'] as const)('keeps %s quiet', status => {
  expect(shouldPlayCeremony(status, 1, ['human', 'ai'], null, null)).toBe(false);
});

it('keeps Resign and a game with no person quiet', () => {
  expect(shouldPlayCeremony('checkmate', 1, ['human', 'ai'], null, 1)).toBe(false);
  expect(shouldPlayCeremony('checkmate', 1, ['ai', 'ai'], null, null)).toBe(false);
});

import { ceremonyMoveLabel } from './ceremony-game';
import { fromFen } from './rules/setup';

it('names each review act in words', () => {
  const pos = fromFen('7k/8/8/8/8/p7/8/R5MK w - - 0 1');
  expect(ceremonyMoveLabel(pos, { from: 0, to: 16, captures: [16] })).toBe('Rook takes pawn');
  expect(ceremonyMoveLabel(pos, { from: 6, to: 7, captures: [], swap: true })).toBe('Maester swaps');
  const shot = fromFen('7k/8/4A3/8/4n3/8/8/7K w - - 0 1');
  expect(ceremonyMoveLabel(shot, { from: 44, to: 44, captures: [28] })).toBe('Archer shoots knight');
});

it('names powers in two to four words without squares', () => {
  const pos = fromFen('7k/8/8/8/8/n7/8/R5MK w - - 0 1');
  expect(ceremonyMoveLabel(pos, { from: 7, to: 23, captures: [], power: 'flight' })).toBe('King flies');
  expect(ceremonyMoveLabel(pos, { from: 0, to: 8, captures: [], power: 'haste' })).toBe('Rook moves with Haste');
  expect(ceremonyMoveLabel(pos, { from: 16, to: 16, captures: [], power: 'freeze' })).toBe('Freeze on knight');
});
