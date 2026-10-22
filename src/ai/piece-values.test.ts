import { describe, expect, it } from 'vitest';
import { VALUES, setPieceValues } from './eval';
import { SHIPPED_VALUES } from './piece-values';

describe('SHIPPED_VALUES', () => {
  it('equals the shipped evaluation values for every piece type', () => {
    setPieceValues(); // the shipped defaults, whatever an earlier test set
    expect({ ...SHIPPED_VALUES }).toEqual({ ...VALUES });
  });
});
