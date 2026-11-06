import { afterEach, expect, it, vi } from 'vitest';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';
import { drawFreezeCast, quakeJolt } from './card-hero';
import { dom } from './view-harness';

afterEach(() => vi.unstubAllGlobals());

it('the Freeze cast stays at its target and ends after the ice forms', () => {
  dom();
  const spots: number[][] = [];
  const ctx: CanvasRenderingContext2D = new Proxy({} as CanvasRenderingContext2D, {
    get: (_, key) => (...args: number[]) => { if (key === 'translate') spots.push(args); return ctx; },
    set: () => true,
  });
  const scene = { foot: () => ({ x: 400, y: 400 }), cell: () => ({ col: 3, row: 3 }) } as unknown as PaintedScene;
  for (let ms = 16; ms < 900; ms += 16) { drawFreezeCast(ctx, scene, 27, 'under', undefined, ms); drawFreezeCast(ctx, scene, 27, 'over', 3, ms); }
  expect(spots.length).toBeGreaterThan(100);
  // No light crosses the board: every sprite stays within a tile and a half of the target.
  for (const [x, y] of spots) expect(Math.hypot(x - 400, y - 400)).toBeLessThan(168);
  spots.length = 0;
  drawFreezeCast(ctx, scene, 27, 'over', 2, 300); drawFreezeCast(ctx, scene, 27, 'over', 3, 900);
  expect(spots).toEqual([]);
});

it('a shoved figure jumps inside its slide and lands flat', () => {
  expect(quakeJolt(.22)).toBe(0); expect(quakeJolt(.62)).toBe(0); expect(quakeJolt(.1)).toBe(0); expect(quakeJolt(.9)).toBe(0);
  expect(quakeJolt(.28)).toBeGreaterThan(15);
  for (let t = .22; t < .62; t += .01) expect(Math.abs(quakeJolt(t + .01) - quakeJolt(t))).toBeLessThan(8);
});
