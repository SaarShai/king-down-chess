import { afterEach, expect, test } from 'vitest';
import { matchSpec } from './fairy-stockfish-match';
import { DEFAULT_RULES, setRules } from '../src/rules/rules';
afterEach(() => setRules(DEFAULT_RULES));
test('longer-time games keep paired starts and deals with an explicit time and fresh seed', () => {
  const short = matchSpec(), long = matchSpec(false, 1000, 164211);
  expect(short.timeMs).toBe(80); expect(short.seed).toBe(143211);
  expect(long.timeMs).toBe(1000); expect(long.seed).toBe(164211);
  expect(long.jobs).toHaveLength(192); expect(long.jobs[0].fen).not.toBe(short.jobs[0].fen);
  expect(long.parts[0].ids).toHaveLength(8);
  expect(new Set(long.jobs.slice(0, 8).map(job => job.stratum)).size).toBe(4);
  const ids = long.parts.flatMap(part => part.ids);
  expect(new Set(ids).size).toBe(192); expect(ids.sort((a, b) => a - b)).toEqual(long.jobs.map(job => job.id));
  for (let i = 0; i < long.jobs.length; i += 2) {
    expect(long.jobs[i].fairyWhite).not.toBe(long.jobs[i + 1].fairyWhite);
    expect(long.jobs[i].fen).toBe(long.jobs[i + 1].fen); expect(long.jobs[i].rules).toEqual(long.jobs[i + 1].rules);
  }
  expect(() => matchSpec(false, 0, 164211)).toThrow('Unsupported');
});
