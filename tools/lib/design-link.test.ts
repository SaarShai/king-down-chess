import { describe, expect, it } from 'vitest';
import { designCode, type PieceDesign } from '../../src/workshop/model';
import { parseRule } from '../../src/rules/engine';
import { WARD, WARD_CODE } from './design-link.mjs';

describe('design link fixture', () => {
  it('holds the code of its design, and the game link reads it back', () => {
    expect(designCode(WARD as unknown as PieceDesign)).toBe(WARD_CODE);
    expect(parseRule(`design=${WARD_CODE}`).design?.code).toBe(WARD_CODE);
  });
});
