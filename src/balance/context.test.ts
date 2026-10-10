import { expect, it } from 'vitest';
import { matchesTarget, type TargetContext } from './context';
import { DEFAULT_RULES } from '../rules/rules';
import { unknownContext } from './measurements';

it('requires checked full rules, pool, price source, mode and immutable stamps', () => {
  const target: TargetContext[] = [{ sourceHash: 'engine', specKey: 'rules-and-pool', flags: { ...DEFAULT_RULES }, pool: 'QOLRRBBNNAAGMMS', mode: 'ordinary', priceReview: 'Checked eval.ts at engine.', reason: 'All ordinary target choices match.' }];
  const context = { ...unknownContext(), sourceHash: 'engine', specKey: 'rules-and-pool', flagsKind: 'full' as const, flags: { ...DEFAULT_RULES }, pool: 'QOLRRBBNNAAGMMS', variantScope: 'none' as const, settings: { entrants: ['none'] } };
  expect(matchesTarget(context, target)).toBe(true);
  for (const patch of [{ flagsKind: 'diff' as const }, { flags: null }, { flags: {} }, { flags: { archerShots: 'all' } }, { pool: null }, { pool: 'old' }, { specKey: 'old-pool' }, { sourceHash: 'old-engine' }, { variantScope: 'mixed' as const }, { variantScope: 'unknown' as const }, { settings: null }, { settings: { entrants: ['cards4', 'none'] } }]) expect(matchesTarget({ ...context, ...patch }, target)).toBe(false);
  expect(matchesTarget(context, [{ ...target[0], priceReview: '' }])).toBe(false);
  expect(matchesTarget({ ...context, flags: { archerShots: 'far2' } }, [{ ...target[0], flags: { archerShots: 'far2' } }])).toBe(false);
  const invalid = { ...DEFAULT_RULES, fromMove: { Freeze: 0 } };
  expect(matchesTarget({ ...context, flags: invalid }, [{ ...target[0], flags: invalid }])).toBe(false);
  expect(matchesTarget(context, [])).toBe(false);
});
