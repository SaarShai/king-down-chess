import { expect, it, vi } from 'vitest';
import { kingDisplayName } from './king-label';
import { KINGS, K, parseSq, type KingName } from './rules/engine';
import { GameRules } from './game-rules';
import { shortMove } from './move-text';
import { powerOptions } from './powers-ui';
import { guideEntries, kingBlocks } from './interface/play/guide';
import { kingLabel, versusLine } from './interface/play/texts';
import { explainWords } from './muse/board-words';

vi.mock('./interface/play/motion', () => ({ calm: () => true, ms: () => 0, token: () => '' }));

it.each([
  ['Frost', 'Frost'], ['Flame', 'Flame'], ['Stratus', 'Sky'],
  ['Mud', 'Earth'], ['Spirit', 'Spirit'], ['Shadow', 'Shadow'],
])('shows %s as %s', (id, label) => {
  expect(kingDisplayName(id)).toBe(label);
});
it('keeps an unknown label unchanged', () => {
  expect(kingDisplayName('King')).toBe('King');
});
it.each([['Stratus', 'Sky', 'Flight'], ['Mud', 'Earth', 'March']] as const)('keeps %s IDs and shows %s in the guides and sentences', (id, label, power) => {
  const blocks = kingBlocks(), block = blocks.find(block => block.king === id)!;
  expect(block.art).toBe(`/ui/pieces/king-${id.toLowerCase()}-w.webp`);
  expect(block.powers.every(entry => entry.kind.startsWith(`${label} King`))).toBe(true);
  expect(guideEntries('Kings and powers').find(entry => entry.id === power)!.kind).toContain(`${label} King`);
  const option = powerOptions().find(group => group.king === id)!;
  expect(option.group).toBe(`${label} king`);
  expect(option.options[0].value).toBe(`${id}:${power}`);
  expect(versusLine(kingLabel(id, 0), power, kingLabel(id, 1), power)).toContain(`Your ${label} King`);
  // The move helper accepts a caller's piece label; a named king uses the same map.
  const context = new GameRules(), pos = context.fromFen('7k/7p/8/8/8/8/P7/K7 w - - 0 1');
  const move = context.legalMoves(pos).find(move => move.from === parseSq('a1') && move.to === parseSq('b1'))!;
  expect(shortMove(pos, move, type => type === K ? `${kingDisplayName(id)} King` : context.nameOf(type))).toBe(`White ${label} King a1 → b1`);
  expect(explainWords(null, `${label} King`)).toMatch(new RegExp(`^${label} King:`));
  expect(explainWords(null, id)).toBe(explainWords(null, label));
  expect(Object.keys(KINGS)).toContain(id as KingName);
});
