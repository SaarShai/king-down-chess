import { expect, it } from 'vitest';
import { revealPoster, revealVariant, revealVideo } from './home-reveal';

it.each([
  [390, 844, 'portrait'],
  [78, 100, 'portrait'],
  [79, 100, 'square'],
  [820, 961, 'square'],
  [125, 100, 'square'],
  [126, 100, 'wide'],
  [1440, 900, 'wide'],
] as const)('selects the reveal for %i by %i', (width, height, variant) => {
  expect(revealVariant(width, height)).toBe(variant);
});

it('uses only the MP4 for the selected variant', () => {
  expect(revealVideo('portrait')).toBe('/interface/reveal/portrait.mp4');
  expect(revealVideo('square')).toBe('/interface/reveal/square.mp4');
  expect(revealVideo('wide')).toBe('/interface/reveal/wide.mp4');
});

it('uses the still that matches the selected variant', () => {
  expect(revealPoster(390, 844)).toBe('/interface/reveal/hero-portrait.webp');
  expect(revealPoster(820, 961)).toBe('/interface/reveal/hero-square.webp');
  expect(revealPoster(1440, 900)).toBe('/interface/reveal/hero-wide.webp');
});
