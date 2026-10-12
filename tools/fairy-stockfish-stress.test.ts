import { afterEach, expect, test } from 'vitest';
import { checkInspection } from './fairy-stockfish-stress';
import { DEFAULT_RULES, setRules } from '../src/rules/rules';
import { fromFen } from '../src/rules/setup';
afterEach(() => setRules(DEFAULT_RULES));
test('stalemate takes precedence over an available fifty-move draw', () => {
  setRules({ ...DEFAULT_RULES, hands: [['Rally'], ['Rally']], piles: [['Haste', 'GrowthB'], ['Haste', 'GrowthB']] });
  const fen = '8/8/4m3/4b3/8/4n3/5k2/2a4K w - - 100 117 u1.1/lNBRAOnbrao/yRally.Rally';
  const lines = ['fen ' + fen, 'status 2', 'check 0', 'attack 0 c040', 'attack 1 827c28386c74d679', 'historydraw 1', 'kdinspectok 0'];
  expect(checkInspection(lines, fromFen(fen), false, false)).toBe(0);
  expect(() => checkInspection(lines.map(line => line === 'status 2' ? 'status 3' : line), fromFen(fen), false, false)).toThrow('Status');
  expect(() => checkInspection(lines.map(line => line.startsWith('historydraw ') ? 'historydraw wrong' : line), fromFen(fen), false, false)).toThrow('History');
});
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
