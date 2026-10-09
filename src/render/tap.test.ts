import { expect, it } from 'vitest';
import { pastTap } from './tap';

const at = (pointerType: string, clientX: number, clientY = 0) => ({ pointerType, clientX, clientY });

it('a mouse keeps the 6 px tap limit; a finger or a pen gets 12 px', () => {
  expect(pastTap(at('mouse', 0), at('mouse', 6))).toBe(false);
  expect(pastTap(at('mouse', 0), at('mouse', 7))).toBe(true);
  for (const type of ['touch', 'pen']) {
    expect(pastTap(at(type, 0), at(type, 9, 7))).toBe(false); // 11.4 px
    expect(pastTap(at(type, 0), at(type, 12))).toBe(false);
    expect(pastTap(at(type, 0), at(type, 13))).toBe(true);
  }
});
