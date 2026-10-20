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
import { GameRules } from './game-rules';
import { nameOf, parseRule, RULES, setRules, T } from './rules/engine';
import { PRESETS, designCode, fromPreset } from './workshop/model';

it('names each review act in words', () => {
  const pos = fromFen('7k/8/8/8/8/p7/8/R5MK w - - 0 1');
  expect(ceremonyMoveLabel(pos, { from: 0, to: 16, captures: [16] }, nameOf)).toBe('Rook takes pawn');
  expect(ceremonyMoveLabel(pos, { from: 6, to: 7, captures: [], swap: true }, nameOf)).toBe('Maester swaps');
  const shot = fromFen('7k/8/4A3/8/4n3/8/8/7K w - - 0 1');
  expect(ceremonyMoveLabel(shot, { from: 44, to: 44, captures: [28] }, nameOf)).toBe('Archer shoots knight');
});

it('names powers in two to four words without squares', () => {
  const pos = fromFen('7k/8/8/8/8/n7/8/R5MK w - - 0 1');
  expect(ceremonyMoveLabel(pos, { from: 0, to: 8, captures: [], power: 'flight' }, nameOf)).toBe('Rook flies');
  expect(ceremonyMoveLabel(pos, { from: 0, to: 8, captures: [], power: 'haste' }, nameOf)).toBe('Rook moves with Haste');
  expect(ceremonyMoveLabel(pos, { from: 16, to: 16, captures: [], power: 'freeze' }, nameOf)).toBe('Freeze on knight');
});

it('keeps owned designed names in review labels without changing ambient rules', () => {
  const before = structuredClone(RULES);
  try {
    const preset = fromPreset(PRESETS.find(row => row.key === 'rook')!);
    const rules = (name: string) => parseRule(`design=${designCode({ ...preset, name, letter: 'Y' })}`);
    const context = new GameRules(rules('Owned Ward'));
    const pos = context.fromFen('7k/P7/8/8/8/8/T7/K7 w - - 0 1');
    const victim = context.fromFen('7k/8/8/8/8/8/t7/R5K1 w - - 0 1');
    setRules(rules('Ambient Ward'));
    const ambient = structuredClone(RULES), name = (type: Parameters<typeof context.nameOf>[0]) => context.nameOf(type);
    expect(ceremonyMoveLabel(pos, { from: 8, to: 16, captures: [] }, name)).toBe('Owned Ward moves');
    expect(ceremonyMoveLabel(victim, { from: 0, to: 8, captures: [8] }, name)).toBe('Rook takes Owned Ward');
    expect(ceremonyMoveLabel(pos, { from: 48, to: 56, captures: [], promo: T }, name)).toBe('Pawn becomes Owned Ward');
    expect(ceremonyMoveLabel(pos, { from: 48, to: 48, captures: [], promo: T, power: 'sacrifice' }, name)).toBe('Sacrifice restores Owned Ward');
    expect(ceremonyMoveLabel(pos, { from: 8, to: 16, captures: [] }, nameOf)).toBe('Ambient Ward moves');
    expect(RULES).toEqual(ambient);
  } finally { setRules(before); }
});
