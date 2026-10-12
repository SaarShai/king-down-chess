import { afterEach, expect, test } from 'vitest';
import { checkInspection } from './fairy-stockfish-stress';
import { DEFAULT_RULES, setRules } from '../src/rules/rules';
import { fromFen } from '../src/rules/setup';
afterEach(() => setRules(DEFAULT_RULES));
test('inspection rejects omitted actions, corrupt state, attack maps and history', () => {
  setRules(DEFAULT_RULES);
  // Terminal material draw still has legal king actions. An empty action list must fail.
  const pos = fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1');
  const lines = ['fen 7k/8/8/8/8/8/8/K7 w - - 0 1', 'check 0', 'status 4', 'historydraw 1', 'attack 0 302', 'attack 1 40c0000000000000', 'kdinspectok 0'];
  expect(() => checkInspection(lines, pos, false, true)).toThrow(/missing/);
  expect(() => checkInspection(lines.map(line => line.startsWith('fen ') ? 'fen wrong' : line), pos, false, true)).toThrow('FEN');
  expect(() => checkInspection(lines.map(line => line.startsWith('attack 0') ? 'attack 0 0' : line), pos, false, true)).toThrow('Attacks');
  expect(() => checkInspection(lines, pos, false, false)).toThrow('History');
});
