import { expect, it } from 'vitest';
import { boardInk } from './board-ink';

it('phone board text and cause lines keep their CSS size', () => {
  for (const width of [246, 300, 360, 376]) {
    const ink = boardInk(width), scale = width / 960;
    expect(ink.coord * scale).toBeCloseTo(12, 8);
    expect(ink.biteFont * scale).toBeCloseTo(14, 8);
    expect(ink.causeCore * scale).toBeCloseTo(1.5, 8);
    expect(ink.causeHalo * scale).toBeCloseTo(3.5, 8);
    expect(ink.biteInset * scale).toBeCloseTo(1, 8);
    expect(ink.biteRadius * scale).toBeCloseTo(7, 8);
  }
});

it('desktop cause lines stay thin', () => {
  expect(boardInk(960).causeCore).toBe(2.2);
  expect(boardInk(960).causeHalo).toBe(5.5);
});

it('the desktop check ring keeps its old width', () => {
  expect(boardInk(960).checkRing).toBeGreaterThanOrEqual(3);
});
