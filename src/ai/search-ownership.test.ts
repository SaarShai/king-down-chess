import { afterEach, expect, it } from 'vitest';
import { DEFAULT_RULES, RULES_2017, setRules } from '../rules/rules';
import { startPosition, toLan } from '../rules/setup';
import { setDesignValue, setEvaluator } from './eval';
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
    setRules(rules); setDesignValue(rules.design);
    expect(searchOwned(owners[index], pos, opts)).toEqual(fresh[index]);
  }
  const warm = searchOwned(owners[1], pos, opts);
  expect(warm.move).toEqual(fresh[1].move);
  expect(warm.score).toBe(fresh[1].score);
  expect(warm.nodes).toBeLessThan(fresh[1].nodes);

  // A fresh game with identical rules must not inherit another game's search decisions.
  expect(searchOwned({}, pos, opts)).toEqual(fresh[1]);
});
