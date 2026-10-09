import { afterEach, expect, it } from 'vitest';
import { DEFAULT_RULES, legalMoves, parseSq, setRules } from './rules/engine';
import { fromFen } from './rules/setup';
import { marksModel } from './marks-model';

const at = parseSq;
afterEach(() => setRules(DEFAULT_RULES));

it('marks the Ogre target and landing, with a normal take as a separate choice', () => {
  const pos = fromFen('7k/8/8/4p3/3O4/8/8/K7 w - - 0 1');
  const marks = marksModel(legalMoves(pos).filter(m => m.from === at('d4')));
  expect(marks.shoveTo).toEqual([{ from: at('e5'), to: at('f6') }]);
  expect(marks.shoves).toEqual([at('e5')]);
  expect(marks.captures).toEqual([at('e5')]);
});

it('shows only the next Beast bite and numbers bites already made', () => {
  const pos = fromFen('7k/8/5p2/4p3/3S4/8/8/K7 w - - 0 1');
  const moves = legalMoves(pos).filter(m => m.from === at('d4'));
  expect(marksModel(moves).captures).toEqual([at('e5')]);
  expect(marksModel(moves).bites).toEqual([]);
  const chain = moves.filter(m => m.captures[0] === at('e5'));
  const marks = marksModel(chain, [at('e5')]);
  expect(marks.captures).toEqual([at('f6')]);
  expect(marks.bites).toEqual([at('e5')]);
});

it('marks a Maester swap without a step on its friend', () => {
  const pos = fromFen('7k/8/8/4N3/3M4/8/8/K7 w - - 0 1');
  const marks = marksModel(legalMoves(pos).filter(m => m.from === at('d4')));
  expect(marks.swaps).toEqual([at('e5')]);
  expect(marks.moves).not.toContain(at('e5'));
});

it('marks Archer shots at the victim while its step marks stay empty', () => {
  const pos = fromFen('7k/8/5p2/8/3A4/8/8/K7 w - - 0 1');
  const marks = marksModel(legalMoves(pos).filter(m => m.from === at('d4')));
  expect(marks.shots).toEqual([at('f6')]);
  expect(marks.captures).toEqual([at('f6')]);
  expect(marks.moves).not.toContain(at('f6'));
});

it('gives the step priority on a shared shove landing', () => {
  const marks = marksModel([
    { from: at('d4'), to: at('e4'), captures: [], shove: { from: at('e4'), to: at('f4') } },
    { from: at('d4'), to: at('f4'), captures: [] },
  ]);
  expect(marks.moves).toContain(at('f4'));
  expect(marks.shoveTo).toEqual([]);
  expect(marks.shoves).toEqual([at('e4')]);
});

it('keeps the two bite numbers and never marks a king as a continuation', () => {
  const pos = fromFen('8/8/5k2/4p3/3S4/8/8/K7 w - - 0 1');
  const moves = legalMoves(pos).filter(m => m.from === at('d4'));
  expect(marksModel(moves, [at('e5')]).captures).toEqual([]);
  const chain = fromFen('7k/8/5p2/4p3/3S4/8/8/K7 w - - 0 1');
  const marks = marksModel(legalMoves(chain).filter(m => m.from === at('d4')), [at('e5'), at('f6')]);
  expect(marks.bites).toEqual([at('e5'), at('f6')]);
  expect(marks.captures).toEqual([]);
});
