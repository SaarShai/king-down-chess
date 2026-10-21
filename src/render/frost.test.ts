import { RULES } from '../rules/rules';
import { GameRules } from '../game-rules';
import { afterEach, expect, it } from 'vitest';
import { fromFen } from '../rules/setup';
import { setRules } from '../rules/engine';
import { frost, frozenPieces } from './frost';
afterEach(() => setRules({}));
it('shows both active Freeze marks with their turns and omits empty, expired, friendly and ward marks', () => {
  setRules({hands:[['Freeze'],['Freeze']]});
  const pos = fromFen('7k/8/8/4p3/3P4/8/8/K7 w - - 0 1 me5w2/md4b');
  expect(frozenPieces(new GameRules(RULES), pos)).toEqual([{sq:36,turns:2},{sq:27,turns:1}]);
  pos.marks![0]!.left = 0; expect(frozenPieces(new GameRules(RULES), pos)).toEqual([{sq:27,turns:1}]);
  pos.marks![1]!.ward = true; expect(frozenPieces(new GameRules(RULES), pos)).toEqual([]);
  pos.marks![1]!.ward = false; pos.board[27] = 0; expect(frozenPieces(new GameRules(RULES), pos)).toEqual([]);
  pos.marks![0]!.left = 1; pos.marks![0]!.sq = 0; expect(frozenPieces(new GameRules(RULES), pos)).toEqual([]);
  expect(frozenPieces(new GameRules(RULES), null)).toEqual([]);
});
it('shares the Workshop tint, blue ring and one moon pip per turn', () => {
  const [under,over] = frost(0,0,112,2);
  expect(under).toContain('url(#kdm-frost)'); expect(under).toContain('url(#kdm-crystal)');
  expect(under).toContain('stroke="#2f5ea8"');
  expect(over.match(/<circle /g)).toHaveLength(2); expect(over.match(/viewBox="0 0 24 24"/g)).toHaveLength(2);
});
