import { expect, it } from 'vitest';
import { boardInk, coordInk } from './board-ink';

it('phone board text and cause lines keep their CSS size', () => {
  for (const width of [246, 300, 360, 376]) {
    const ink = boardInk(width), scale = width / 960;
    expect(ink.coord * scale).toBeCloseTo(12, 8);
    expect(ink.biteFont * scale).toBeCloseTo(14, 8);
    expect(ink.causeCore * scale).toBeCloseTo(1.5, 8);
    expect(ink.causeHalo * scale).toBeCloseTo(3.5, 8);
    expect(ink.biteInset * scale).toBeCloseTo(1, 8);
    expect(ink.biteRadius * scale).toBeCloseTo(6.5, 8);
  }
});

it('desktop cause lines stay thin', () => {
  expect(boardInk(960).causeCore).toBe(2.2);
  expect(boardInk(960).causeHalo).toBe(5.5);
});

it('the desktop check ring keeps its old width', () => {
  expect(boardInk(960).checkRing).toBeGreaterThanOrEqual(3);
});

it('keeps the edge labels inside the frame or hides them (fault M10)', () => {
  // The frame is 32 board units (PAD); rank 1 starts at 928. A label is about 0.7 em tall and 0.6 em wide.
  for (const width of [158, 169, 192, 210, 246, 302, 360, 483, 960]) {
    const { size, inset, shown } = coordInk(width);
    if (!shown) { expect(width).toBeLessThan(200); continue; }
    expect(960 - inset - 0.35 * size).toBeGreaterThanOrEqual(928);
    expect(15 + 0.3 * size).toBeLessThanOrEqual(32);
    expect(size * width / 960).toBeGreaterThanOrEqual(8);
  }
  expect(coordInk(302).size * 302 / 960).toBeCloseTo(12, 8);
});
