import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEG, TR, badge, occupied, paint, shot, target, tile, toSvg, type Kind, type Shape } from './legend';

const circles = (shapes: Shape[]) => shapes.filter((s): s is Extract<Shape, { k: 'circle' }> => s.k === 'circle');
const red = (shapes: Shape[]) => circles(shapes).filter(s => s.stroke === LEG.red || s.fill === LEG.red);

describe('the move legend', () => {
  it('draws a move as a green tile with no target', () => {
    const shapes = tile('move', 0, 0, 80);
    expect(circles(shapes)).toEqual([]);
    expect(shapes.some(s => s.k === 'rect' && s.fill === 'green')).toBe(true);
  });

  it('draws a take as a white tile with the outer ring, the dot and the halo', () => {
    const shapes = tile('take', 0, 0, 60), R = TR * 0.67 * 60;
    expect(shapes.some(s => s.k === 'rect' && s.fill === LEG.white)).toBe(true);
    expect(red(shapes).map(s => s.stroke ? 'ring' : 'dot')).toEqual(['ring', 'dot']);
    expect(red(shapes)[0].r).toBeCloseTo(R);
    // The halo: a light ring under the red ring (1 px each side) and a light disc under the dot.
    const halo = circles(shapes).filter(s => !red([s]).length);
    expect(halo).toHaveLength(2);
    expect(halo[0].lw).toBeCloseTo(red(shapes)[0].lw! + 2);
  });

  it('adds the middle ring only from R = 16 CSS px', () => {
    expect(red(target(0, 0, 15.9))).toHaveLength(2);
    expect(red(target(0, 0, 16))).toHaveLength(3);
    // The same target at 2 drawing units for each CSS pixel is 8 px: no middle ring, and its widths double.
    expect(red(target(0, 0, 16, { px: 2 }))).toHaveLength(2);
    expect(red(target(0, 0, 4, { px: 2 }))[0].lw).toBeCloseTo(2.4);
  });

  it('draws both as the green fill plus the target', () => {
    const shapes = tile('both', 0, 0, 80);
    expect(shapes.some(s => s.k === 'rect' && s.fill === 'green')).toBe(true);
    expect(shapes.some(s => s.k === 'rect' && s.fill === LEG.white)).toBe(false);
    expect(red(shapes).length).toBeGreaterThan(0);
  });

  it('draws a shot as the target with an ink shaft and two fletching chevrons', () => {
    const lines = (shapes: Shape[]) => shapes.filter(s => s.k === 'line' && s.stroke === LEG.ink);
    expect(lines(tile('take', 0, 0, 80))).toEqual([]);
    expect(lines(tile('shot', 0, 0, 80))).toHaveLength(3);
    expect(lines(tile('moveshot', 0, 0, 80))).toHaveLength(3);
    expect(lines(shot(0, 0, 10)).map(s => s.k === 'line' && s.pts.length)).toEqual([4, 6, 6]);
  });

  it('draws a take on a figure as a red edge, a faint fill, and a ring and a glow at the foot line', () => {
    const shapes = occupied('take', 0, 0, 100, 85), ellipses = shapes.filter(s => s.k === 'ellipse');
    expect(shapes.some(s => s.k === 'rect' && s.stroke === LEG.red)).toBe(true);
    expect(ellipses.map(s => s.k === 'ellipse' && s.y)).toEqual([85, 85]);
    expect(ellipses.map(s => s.fill)).toEqual([undefined, 'glow-red']);
    expect(occupied('both', 0, 0, 100, 85).some(s => s.fill === 'green')).toBe(true);
  });

  it('sizes the badge 15 px under a 48 px square, else 0.27 of the square within 15 to 22 px', () => {
    const side = (s: number, px = 1) => { const b = badge(0, 0, s, 'take', { px })[0]; return b.k === 'rect' ? b.w / px : 0; };
    expect(side(47)).toBe(15);
    expect(side(48)).toBe(15);
    expect(side(70)).toBeCloseTo(18.9);
    expect(side(100)).toBe(22);
    expect(side(94, 2)).toBe(15); // 47 CSS px
    // The shot badge holds the pierced target; the take badge has no shaft.
    expect(badge(0, 0, 40, 'shot').some(s => s.k === 'line')).toBe(true);
    expect(badge(0, 0, 40, 'take').some(s => s.k === 'line')).toBe(false);
  });

  it('draws each shape once in SVG and once on a canvas', () => {
    const kinds: Kind[] = ['move', 'take', 'both', 'shot', 'moveshot'];
    const shapes = [...kinds.flatMap(k => tile(k, 0, 0, 90, { power: true })), ...occupied('both', 0, 0, 90, 70), ...badge(0, 0, 90, 'moveshot')];
    let paths = 0;
    const gradient = () => ({ addColorStop() {} });
    const ctx = {
      globalAlpha: 1, beginPath: () => paths++, roundRect() {}, arc() {}, ellipse() {}, moveTo() {}, lineTo() {}, fill() {}, stroke() {},
      save() {}, restore() {}, translate() {}, scale() {}, createLinearGradient: gradient, createRadialGradient: gradient,
    } as unknown as CanvasRenderingContext2D;
    paint(ctx, shapes);
    expect(paths).toBe(shapes.length);
    expect(toSvg(shapes).match(/<(rect|circle|ellipse|polyline) /g)).toHaveLength(shapes.length);
    expect(ctx.globalAlpha).toBe(1);
  });

  it('leaves none of the old marks in the game or the Workshop', () => {
    const dir = new URL('./', import.meta.url);
    const render = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(f => /\.(ts|mjs)$/.test(f) && !f.endsWith('.test.ts'))
      .map(f => readFileSync(new URL(f, dir), 'utf8')).join('\n');
    expect(render.match(/\b(gem|brackets|sight)\(/g)).toBeNull();
    // The old gem gold, its light gold and the dashed shot ring (the character classes keep this line out of a grep for them).
    const css = readFileSync(new URL('../workshop/workshop.css', import.meta.url), 'utf8');
    expect(css.match(/#e9b4[4]c|#f0bf5[2]|dashed #b3261[e]/gi)).toBeNull();
  });
});
