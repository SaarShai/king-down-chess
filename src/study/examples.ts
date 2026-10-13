import { DEFAULT_RULES, type Rules } from '../rules/rules';
import { T, parseSq } from '../rules/engine';
import { fromFen } from '../rules/setup';
import { designCode, fromPreset, presetOf, specOf } from '../workshop/model';
import { createStudy, positionData } from './model';
import type { Fact, StudyTest } from './check';

const legal = (id: string, after: number, lan: string, expected = true): Fact => ({ id, label: lan, after, kind: 'legal', lan, expected });
const state = (id: string, after: number, field: Extract<Fact, { kind: 'state' }>['field'], expected: Extract<Fact, { kind: 'state' }>['expected']): Fact => ({ id, label: id, after, kind: 'state', field, expected });

/** Small constructed controls. Their assertions are declared before execution. */
export function exampleStudies(engine: string): StudyTest[] {
  const design = fromPreset(presetOf('rook'));
  Object.assign(design, { name: 'My Rook', named: true, letter: 'D' });
  const code = designCode(design);
  const rules: Rules = { ...structuredClone(DEFAULT_RULES), design: { ...specOf(design), code } };
  const make = (id: string, question: string, fen: string, more: Partial<Rules>, actions: string[], checks: Fact[], items: string[]): StudyTest => ({
    schema: 'kingdown-test/1',
    study: createStudy({ id, version: 1, parentVersion: null, title: id, question, engine,
      design: { code, version: 1 }, rules: { ...structuredClone(rules), ...more }, start: positionData(fromFen(fen)), prefix: [], actions, origin: 'constructed' }),
    checks,
    coverage: [
      { id: 'selected-case', items, state: 'tested', reason: question, checks: checks.map(c => c.id) },
      { id: 'identity', items: ['piece identity'], state: 'unsupported', reason: 'The engine keeps piece types and counts. It does not retain entity IDs through capture and return.', checks: [] },
      { id: 'experience', items: ['balance', 'strategy', 'fun'], state: 'untested', reason: 'These cases check behavior. They contain no campaign or player evidence.', checks: [] },
    ],
  });
  const rook = make('rook-control', 'Does an unchanged Rook stop at blockers and capture the target?',
    '7k/8/8/3P4/3T1p2/8/8/K7 w - - 0 1', {}, ['Td4xf4'], [
      legal('quiet', 0, 'Td4-e4'), legal('capture', 0, 'Td4xf4'), legal('enemy-blocks', 0, 'Td4-g4', false),
      legal('friend-blocks', 0, 'Td4-d5', false), legal('behind-friend', 0, 'Td4-d6', false), legal('outside-pattern', 0, 'Td4-e5', false),
      { id: 'landed', label: 'My Rook stands on f4', after: 1, kind: 'piece', square: parseSq('f4'), expected: T },
      { id: 'left-origin', label: 'd4 is empty', after: 1, kind: 'piece', square: parseSq('d4'), expected: 0 },
    ], ['My Rook', 'blockers', 'capture']);
  rook.challenge = { goal: 'Take the pawn on f4.', horizon: 1, solutions: [['Td4xf4']], claim: 'suggested', difficulty: 'unmeasured' };
  const haste = make('rook-haste', 'Does Haste keep the custom piece on the same turn until its second action?',
    '7k/8/8/8/3T4/8/8/K7 w - - 0 1', { hands: [['Haste'], []] }, ['Td4-d5!H', '--'], [
      legal('haste-offered', 0, 'Td4-d5!H'), state('same-side', 1, 'turn', 0), state('one-action', 1, 'ply', 1),
      state('extra-piece', 1, 'haste', parseSq('d5')), legal('other-piece-refused', 1, 'Ka1-b1', false),
      state('pass-turn', 2, 'turn', 1), state('two-actions', 2, 'ply', 2), state('extra-ended', 2, 'haste', null),
    ], ['My Rook', 'Haste', 'turn state']);
  const freeze = make('rook-power', 'Does the Frost power stop a custom piece for one opposing turn?',
    '7k/8/8/8/3T4/8/8/K7 b - - 0 1', { kings: [null, { king: 'Frost', power: 'Freeze' }] }, ['!F:d4', 'Ka1-b1', 'Kh8-g8'], [
      legal('freeze-offered', 0, '!F:d4'), legal('frozen', 1, 'Td4-e4', false),
      state('mark-set', 1, 'marks', [null, { sq: parseSq('d4') }]), state('mark-ended', 2, 'marks', null),
      legal('free-again', 3, 'Td4-e4'),
    ], ['My Rook', 'Frost Freeze', 'mark expiry']);
  const triple = make('marks-and-haste', 'Do both marks keep their own duration through a free mark and Haste?',
    '7k/8/3t1n2/8/3T4/8/8/K7 w - - 0 1', { hands: [['Freeze'], ['Freeze', 'Haste']], markFree: true, markTurns: 2 },
    ['!F:d6', '--', '!F:d4', '--', 'Ka1-b1', 'Nf6-e4!H', '--', 'Kb1-a1', 'Td6-e6'], [
      state('free-mark-holds-turn', 1, 'turn', 0), state('first-mark', 2, 'marks', [{ sq: 43, left: 2 }, null]),
      state('two-marks', 3, 'marks', [{ sq: 43, left: 2 }, { sq: 27, left: 2 }]),
      legal('still-frozen-after-mark', 3, 'Td6-e6', false),
      state('black-turn-ended', 4, 'marks', [{ sq: 43 }, { sq: 27, left: 2 }]),
      state('white-turn-ended', 5, 'marks', [{ sq: 43 }, { sq: 27 }]),
      state('haste-keeps-marks', 6, 'marks', [{ sq: 43 }, { sq: 27 }]), state('haste-keeps-black', 6, 'turn', 1),
      state('black-mark-remains', 7, 'marks', [null, { sq: 27 }]), legal('white-still-frozen', 7, 'Td4-e4', false),
      state('both-ended', 8, 'marks', null), legal('black-free', 8, 'Td6-e6'),
    ], ['My Rook', 'two Freeze cards', 'Haste', 'free marks', 'two-turn marks']);
  const double = make('second-player-turn', 'Does the second player get two first-turn actions under this rule?',
    '7k/8/3t4/8/3T4/8/8/K7 w - - 0 1', { secondPlayerDoubleFirstTurn: true }, ['Ka1-b1', 'Kh8-g8', 'Kg8-h8'], [
      state('black-first', 1, 'turn', 1), state('black-second', 2, 'turn', 1), state('white-next', 3, 'turn', 0),
      state('three-actions', 3, 'ply', 3), state('second-move-number', 3, 'move', 2),
    ], ['My Rook', 'second-player rule', 'turn state']);
  return [rook, haste, freeze, triple, double];
}
