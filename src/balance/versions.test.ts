import { expect, it } from 'vitest';
import { measuredVersions } from './versions';
import { unknownContext, type Measurement } from './measurements';

it('retains branch values and flags unmapped historical dimensions', () => {
  const row: Measurement = { id: 'r', run: 'r', element: 'Archer', version: 'far2', context: { ...unknownContext(), flagsKind: 'diff', flags: { archerShots: 'far2', unknownRule: true, hands: ['bad'] } }, measure: 'drawRate', value: 0.2, error: 0.02, errorKind: 'report', sample: 100, sampleUnit: 'games', unit: 'fraction', validity: 'valid', reasons: [], sources: ['r.jsonl'], method: 'report' };
  const points = measuredVersions([row, { ...row, id: 'other', run: 'repeat' }]);
  expect(points).toHaveLength(1);
  expect(points[0].runs).toEqual(['r', 'repeat']);
  expect(points[0].findings).toHaveLength(3);
  expect(points[0].findings.some(f => f.includes('archerShots'))).toBe(false);
  expect(points[0].version).toBe('far2');
  expect(measuredVersions([{ ...row, validity: 'void' }])).toEqual([]);
});
