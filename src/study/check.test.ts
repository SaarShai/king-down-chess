import { describe, expect, it } from 'vitest';
import { K, R, T, isAttacked, piece, type Color } from '../rules/engine';
import { RULES } from '../rules/rules';
import { fromFen } from '../rules/setup';
import { checkStudy, parseTest } from './check';
import { exampleStudies } from './examples';
import { positionData, positionOf, withRules } from './model';
import { openStudy } from './session';

const source = 'test-engine';
describe('interaction studies', () => {
  it('passes each declared case and preserves its exact state on reload and undo', () => {
    for (const test of exampleStudies(source)) {
      const report = checkStudy(test, source);
      expect(report, test.study.id).toMatchObject({ status: 'passed' });
      expect(report.facts.length).toBe(test.checks.length);
      expect(report.coverage.map(c => c.state)).toEqual(['passed', 'unsupported', 'untested']);
      const session = openStudy({ ...test.study, actions: [] }, source);
      for (const action of test.study.actions) {
        const before = session.snapshot(); session.play(action);
        const after = session.snapshot();
        expect(openStudy(JSON.parse(JSON.stringify(session.exportStudy())), source).snapshot()).toEqual(after);
        expect(session.undo()).toBe(true); expect(session.snapshot()).toEqual(before);
        expect(session.play(action)).toEqual(after);
      }
    }
  });
  it('matches a base Rook for legal moves and attacks, with blockers, pins and check on either side', () => {
    const test = exampleStudies(source)[0];
    for (const fen of ['7k/8/8/3P4/3T1p2/8/8/K7 w - - 0 1', 'k2r4/8/8/8/3T4/8/8/3K4 w - - 0 1', '7k/8/8/8/3T4/8/8/K6r w - - 0 1']) {
      for (const flip of [false, true]) {
        const start = positionData(fromFen(fen));
        if (flip) {
          start.board = start.board.map((_v, sq, board) => board[sq ^ 56] ? board[sq ^ 56] ^ 16 : 0);
          start.turn = 1;
        }
        const design = { ...test.study, start, actions: [] };
        const base = { ...design, design: undefined, rules: { ...design.rules, design: null }, start: { ...start, board: start.board.map(v => (v & 15) === T ? (v & 16) | R : v) } };
        expect(openStudy(design, source).snapshot().legal.map(l => l.replace(/^T/, 'R')).sort()).toEqual(openStudy(base, source).snapshot().legal.sort());
        // Both paths must agree on king threats, including a king that steps onto an empty square.
        const attacks = (s: typeof design) => withRules(s.rules, () => [0, 1].flatMap(c => Array.from({ length: 64 }, (_, sq) => {
          const board = positionOf(s.start).board;
          board[sq] = piece(K, (c ^ 1) as Color);
          return isAttacked(board, sq, c as Color);
        })));
        expect(attacks(design)).toEqual(attacks(base));
      }
    }
  });
  it('separates a failed fact, an illegal line and an unsupported scope', () => {
    const test = exampleStudies(source)[0];
    test.checks[0].expected = false;
    const failed = checkStudy(test, source);
    expect(failed.status).toBe('failed');
    expect(failed.facts[0]).toMatchObject({ expected: false, actual: true, passed: false });
    expect(failed.coverage[1].state).toBe('unsupported');
    test.study.actions = ['Td4-e5'];
    expect(checkStudy(test, source)).toMatchObject({ status: 'invalid', facts: [], error: 'Illegal or ambiguous study action' });
  });
  it('rejects empty checks, bad coverage, schema extensions and out-of-range boundaries', () => {
    const test = exampleStudies(source)[0];
    for (const bad of [{ ...test, checks: [] }, { ...test, events: [{ when: 'event', then: 'same-event' }] },
      { ...test, checks: [test.checks[0], test.checks[0]] },
      { ...test, checks: [{ ...test.checks[0], after: 2 }] },
      { ...test, coverage: [{ ...test.coverage[0], checks: ['missing'] }] },
      { ...test, coverage: [{ ...test.coverage[0], state: 'unsupported' }] }]) {
      expect(() => parseTest(bad)).toThrow(); expect(checkStudy(bad, source).status).toBe('invalid');
    }
  });
  it('validates challenge lines from the scenario and does not claim a proven solution', () => {
    const test = exampleStudies(source)[0];
    expect(checkStudy(test, source).challenge).toEqual({ claim: 'suggested', difficulty: 'unmeasured', legalLines: 1 });
    test.challenge!.solutions = [['Td4-e5']];
    expect(checkStudy(test, source).status).toBe('invalid');
    test.challenge!.solutions = [['Td4-e4', 'Kh8-g8']];
    expect(() => parseTest(test)).toThrow('horizon');
  });
  it('restores rules on success and failure, and keeps different sessions separate', () => {
    const before = structuredClone(RULES), examples = exampleStudies(source);
    const one = openStudy({ ...examples[0].study, actions: [] }, source);
    const two = openStudy({ ...examples[1].study, actions: [] }, source);
    const state = one.snapshot(); two.play('Td4-d5!H');
    expect(one.snapshot()).toEqual(state);
    expect(checkStudy(examples[1], 'wrong-source').status).toBe('invalid');
    expect(checkStudy(examples[3], source).status).toBe('passed');
    expect(RULES).toEqual(before);
  });
  it('rebuilds repetition from the saved prefix and refuses further moves', () => {
    const study = exampleStudies(source)[1].study;
    study.rules.hands = [[], []]; study.actions = [];
    study.prefix = [...Array(2)].flatMap(() => ['Ka1-b1', 'Kh8-g8', 'Kb1-a1', 'Kg8-h8']);
    const session = openStudy(study, source);
    expect(session.snapshot().status).toBe('drawRepetition');
    expect(session.undo()).toBe(false);
    expect(() => session.play('Td4-e4')).toThrow('terminal');
  });
});
