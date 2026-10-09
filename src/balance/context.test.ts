import { expect, it } from 'vitest';
import { matchesTarget } from './context';
import { unknownContext } from './measurements';

it('requires reviewed immutable source and full run inputs', () => {
  const target = [{ sourceHash: 'engine', specKey: 'rules-and-pool', reason: 'All target choices match.' }];
  const context = { ...unknownContext(), sourceHash: 'engine', specKey: 'rules-and-pool', flagsKind: 'full' as const };
  expect(matchesTarget(context, target)).toBe(true);
  expect(matchesTarget({ ...context, flagsKind: 'diff' }, target)).toBe(false);
  expect(matchesTarget({ ...context, specKey: 'old-pool' }, target)).toBe(false);
  expect(matchesTarget({ ...context, sourceHash: 'old-engine' }, target)).toBe(false);
  expect(matchesTarget(context, [])).toBe(false);
});
