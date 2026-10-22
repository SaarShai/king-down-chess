import { afterEach, expect, it, vi } from 'vitest';
import { DEFAULT_RULES, RULES, RULES_2017, setRules } from '../rules/rules';
import { fromFen, startPosition, toLan } from '../rules/setup';
import { setDesignValue, setEvaluator, VALUES } from './eval';
import { PRESETS, specOf } from '../workshop/model';
import { resetSearchState, search, searchOwned } from './search';

afterEach(() => { setRules(); setDesignValue(null); resetSearchState(); });

it('isolates game lifetimes while retaining the current game’s warm search tables', () => {
  setEvaluator('residual');
  const pos = startPosition('RALSKMOG'), opts = { maxDepth: 3 };
  const configs = [DEFAULT_RULES, { ...DEFAULT_RULES, ...RULES_2017 }];
  const fresh = configs.map(rules => {
    setRules(rules); setDesignValue(rules.design); resetSearchState();
    return search(pos, opts);
  });
  expect(fresh.map(result => toLan(pos, result.move!))).toEqual(['c2-c3', 'Mf1<>g1']);

  const owners = [{}, {}];
  for (const index of [0, 1, 0, 1]) {
    const rules = configs[index];
    const before = structuredClone(RULES), values = { ...VALUES };
    expect(searchOwned(owners[index], rules, pos, opts)).toEqual(fresh[index]);
    expect(RULES).toEqual(before);
    expect(VALUES).toEqual(values);
  }
  const warm = searchOwned(owners[1], configs[1], pos, opts);
  expect(warm.move).toEqual(fresh[1].move);
  expect(warm.score).toBe(fresh[1].score);
  expect(warm.nodes).toBeLessThan(fresh[1].nodes);

  // A fresh game with identical rules must not inherit another game's search decisions.
  expect(searchOwned({}, configs[1], pos, opts)).toEqual(fresh[1]);
});

it('rejects entropy callbacks before entering owned rules or reading search options', () => {
  const before = structuredClone(RULES), values = { ...VALUES };
  const rules = { ...DEFAULT_RULES, classicChess: true }, pos = startPosition('RNBQKBNR');
  const rng = vi.fn(() => 0.5), read = vi.fn(() => 1);
  expect(() => searchOwned({}, rules, pos, { get maxDepth() { return read(); }, rng } as never)).toThrow('entropy callback');
  expect(rng).not.toHaveBeenCalled();
  expect(read).not.toHaveBeenCalled();
  expect(RULES).toEqual(before);
  expect(VALUES).toEqual(values);
});

it('owns design values and restores ambient rules and values after success and failure', () => {
  setEvaluator('linear');
  const design = specOf(PRESETS.find(p => p.key === 'rook')!);
  const rules = { ...DEFAULT_RULES, design }, pos = fromFen('7k/8/8/8/8/8/3T4/K7 w - - 0 1');
  setRules(rules); setDesignValue(design); resetSearchState();
  const fresh = search(pos, { maxDepth: 1 });
  setRules(); setDesignValue(null);
  const before = structuredClone(RULES), values = { ...VALUES };
  expect(searchOwned({}, rules, pos, { maxDepth: 1 })).toEqual(fresh);
  expect(RULES).toEqual(before);
  expect(VALUES).toEqual(values);
  expect(() => searchOwned({}, rules, pos, { get maxDepth(): number {
    expect(RULES).toEqual(rules);
    expect(VALUES).not.toEqual(values);
    throw new Error('search options');
  } })).toThrow('search options');
  expect(RULES).toEqual(before);
  expect(VALUES).toEqual(values);
});
