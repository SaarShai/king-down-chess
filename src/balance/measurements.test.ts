import { describe, expect, it } from 'vitest';
import { addMoment, estimate, markdownTables, moments, numericCell, stable } from './measurements';
describe('measurement primitives', () => {
  it('keeps a bound and missing error apart from a point estimate', () => {
    expect(numericCell('**< 1.70 **')).toEqual({ value: 1.7, error: null, bound: 'lessThan' });
    expect(numericCell('−11.0 ± 2.0')).toEqual({ value: -11, error: 2 });
    expect(numericCell('+4.34 ± 0.42')).toEqual({ value: 4.34, error: .42 });
    expect(numericCell('-')).toEqual({ value: null, error: null });
  });
  it('does not invent a sampling error for one observation', () => {
    const m = moments(); expect(estimate(m)).toEqual({ value: null, error: null });
    addMoment(m, .5); expect(estimate(m)).toEqual({ value: .5, error: null });
    addMoment(m, .5); expect(estimate(m)).toEqual({ value: .5, error: 0 });
  });
  it('sorts context object keys but keeps arrays in order', () => {
    expect(stable({ z: 1, a: { y: 2, b: 3 } })).toBe(stable({ a: { b: 3, y: 2 }, z: 1 }));
    expect(stable([1, 2])).not.toBe(stable([2, 1]));
  });
  it('reads separate markdown tables and their headings', () => {
    expect(markdownTables('## Worth\n| piece | pawns |\n|---|---|\n| A | 3.4 ± .2 |\n\n## Pace\n| arm | turns |\n|---|---|\n| none | 100 |')).toHaveLength(2);
  });
});
