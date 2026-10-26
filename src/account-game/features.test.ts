import { expect, it } from 'vitest';
import { DEFAULT_OPTIONS } from '../match/setup';
import { featureNames, ruleNames } from './features';

it('names the First rank sorting value in the words, the badges and the lobby key', () => {
  // Only Player shows the feature; its value tells a joiner that each player sorts their own back rank.
  expect(featureNames.find(([field]) => field === 'arrangement')?.[2]).toBe('First rank sorting: Player');
  expect(ruleNames({ ...DEFAULT_OPTIONS, arrangement: true })).toBe('Fairy pieces, First rank sorting: Player');
  expect(ruleNames({ ...DEFAULT_OPTIONS, arrangement: false })).toBe('Fairy pieces');
});
