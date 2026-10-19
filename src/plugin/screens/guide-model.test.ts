import { afterEach, expect, it } from 'vitest';
import { LESSONS } from '../../lessons';
import { RULES, setRules } from '../../rules/engine';
import { toFen } from '../../rules/setup';
import { lessonAttempt, lessonMoves, lessonPosition } from './guide-model';
afterEach(() => setRules());
const finalPositions = [
  '7k/8/8/8/3A4/8/8/K7 b - - 0 1',
  '7k/8/3S4/8/8/8/8/K7 b - - 0 1',
  '7k/8/8/8/3NM3/8/8/K7 b - - 1 1',
  '7k/8/3n4/3O4/8/8/8/K7 b - - 1 1',
  'k3r3/8/8/8/8/8/4G3/4K3 b - - 1 1',
  '7k/8/3L4/8/8/3N4/3P4/K7 b - - 0 1',
];
it.each(LESSONS.map((lesson, index) => [lesson.name, index] as const))('completes the %s lesson and keeps the live rules', (_, index) => {
  setRules({ classicChess: true, beastChains: false });
  const saved = structuredClone(RULES), position = lessonPosition(index), fen = toFen(position);
  const move = lessonMoves(index).find(move => LESSONS[index].goal(position, move))!;
  expect(move).toBeDefined();
  const result = lessonAttempt(index, move);
  expect(result.done).toBe(true); expect(toFen(result.position)).toBe(finalPositions[index]);
  expect(toFen(position)).toBe(fen); expect(RULES).toEqual(saved);
});
it.each(LESSONS.map((lesson, index) => [lesson.name, index] as const))('keeps the %s position after a wrong move', (_, index) => {
  const position = lessonPosition(index), move = lessonMoves(index).find(move => !LESSONS[index].goal(position, move))!;
  const result = lessonAttempt(index, move);
  expect(result.done).toBe(false); expect(toFen(result.position)).toBe(LESSONS[index].fen);
});
