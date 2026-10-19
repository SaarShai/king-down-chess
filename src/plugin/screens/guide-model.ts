import { legalMoves, makeMove, RULES, setRules, type Move } from '../../rules/engine';
import { fromFen } from '../../rules/setup';
import { LESSONS } from '../../lessons';

/** A lesson uses its own rules and position. It cannot write to the live game. */
export function withLessonRules<T>(read: () => T): T {
  const saved = { ...RULES };
  try { setRules(); return read(); } finally { setRules(saved); }
}
export function lessonPosition(index: number) {
  return withLessonRules(() => fromFen(LESSONS[index].fen));
}
export function lessonMoves(index: number) {
  return withLessonRules(() => legalMoves(lessonPosition(index)));
}
export function lessonAttempt(index: number, move: Move) {
  return withLessonRules(() => {
    const position = lessonPosition(index), done = LESSONS[index].goal(position, move);
    return { position: done ? makeMove(position, move) : position, done };
  });
}
