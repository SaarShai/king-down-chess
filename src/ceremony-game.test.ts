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
