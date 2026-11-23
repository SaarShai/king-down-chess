import { expect, it } from 'vitest';
import { contrast } from './contrast';

it('gives the WCAG contrast ratio and lays an ink with alpha over its ground first', () => {
  expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
  expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  expect(contrast('#ffffff', '#777777')).toBeCloseTo(4.48, 2);
  // Black at 50% over white is #7f7f7f, as an 8-bit canvas blends it.
  expect(contrast('#00000080', '#ffffff')).toBeCloseTo(contrast('#7f7f7f', '#ffffff'), 5);
  expect(contrast('#c8382a00', '#dfd6b9')).toBe(1);
});
