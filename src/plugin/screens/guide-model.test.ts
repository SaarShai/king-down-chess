import { afterEach, expect, it } from 'vitest';
import { LESSONS } from '../../lessons';
import { RULES, setRules } from '../../rules/engine';
import { toFen } from '../../rules/setup';
import { lessonAttempt, lessonMoves, lessonPosition } from './guide-model';
afterEach(() => setRules());
it.each(LESSONS.map((lesson, index) => [lesson.name, index] as const))('completes the %s lesson and keeps the live rules', (_, index) => {
  setRules({ classicChess: true, beastChains: false });
  const saved = structuredClone(RULES), position = lessonPosition(index), fen = toFen(position);
  const move = lessonMoves(index).find(move => LESSONS[index].goal(position, move))!;
  expect(move).toBeDefined(); expect(lessonAttempt(index, move).done).toBe(true);
  expect(toFen(position)).toBe(fen); expect(RULES).toEqual(saved);
});
