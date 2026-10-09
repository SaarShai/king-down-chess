import { describe, expect, it } from 'vitest';
import { reviewStep } from './review';

describe('Review navigation', () => {
  it('keeps the last ply in Review and exits only with an explicit request', () => {
    expect(reviewStep(2, 2)).toEqual({ ply: 2, viewing: 2 });
    expect(reviewStep(3, 2)).toEqual({ ply: 2, viewing: 2 });
    expect(reviewStep(-1, 2)).toEqual({ ply: 0, viewing: 0 });
    expect(reviewStep(0, 0)).toEqual({ ply: 0, viewing: null });
    expect(reviewStep(null, 2)).toEqual({ ply: 2, viewing: null });
  });
});
