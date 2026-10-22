import { RULES } from './rules/rules';
import { GameRules } from './game-rules';
import { expect, it } from 'vitest';
import { cursorText } from './cursor-text';
import { fromFen } from './rules/setup';

it('uses the web words for pieces, empty squares, selection and targets', () => {
  const pos = fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1');
  expect(cursorText(new GameRules(RULES), pos, 0, undefined, false)).toBe('a1, white king');
  expect(cursorText(new GameRules(RULES), pos, 63, null, false)).toBe('h8, black king');
  expect(cursorText(new GameRules(RULES), pos, 1, null, false)).toBe('b1, empty');
  expect(cursorText(new GameRules(RULES), pos, 8, 8, false)).toBe('a2, white pawn, selected');
  expect(cursorText(new GameRules(RULES), pos, 16, 8, true)).toBe('a3, empty, can go here');
  expect(cursorText(new GameRules(RULES), pos, 8, 8, true)).toBe('a2, white pawn, selected');
});
