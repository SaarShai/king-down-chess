import { expect, it } from 'vitest';
import { predictEffect, type EffectAnchor } from './effects';

it('interpolates only within the measured context and carries missing error', () => {
  const rows: EffectAnchor[] = [{ id: 'none', context: 'deal-a', feature: 0, value: 0.3, low: 0.27, high: 0.33 }, { id: 'four', context: 'deal-a', feature: 4, value: 0.12, low: 0.1, high: 0.14 }];
  expect(predictEffect(rows, 2, 'deal-a')).toMatchObject({ status: 'model', value: 0.21, low: 0.185, high: 0.23500000000000001 });
  expect(predictEffect(rows, 4, 'deal-a').status).toBe('measured');
  expect(predictEffect(rows, 6, 'deal-a').value).toBeNull();
  expect(predictEffect(rows, 2, 'deal-b').status).toBe('no-data');
  expect(predictEffect([rows[0], { ...rows[1], low: null }], 2, 'deal-a').low).toBeNull();
});
