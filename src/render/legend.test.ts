import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFS, LEG, TR, badge, glow, occupied, paint, railLine, shot, target, threat, tile, toSvg, type Kind, type Shape } from './legend';

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

  it('draws the key tile at 0.8 s with a bevel, and a dashed frame for a mark that holds only sometimes', () => {
    const box = (shapes: Shape[]) => shapes.find((s): s is Extract<Shape, { k: 'rect' }> => s.k === 'rect')!;
    expect(box(tile('move', 0, 0, 80)).w).toBeCloseTo(0.67 * 80);
    expect(box(tile('move', 0, 0, 80, { solid: true }))).toMatchObject({ x: 8, w: 64 });
    expect(tile('move', 0, 0, 80, { solid: true }).filter(s => s.k === 'line')).toHaveLength(2);
    expect(tile('move', 0, 0, 80).some(s => s.dash)).toBe(false);
    const asleep = tile('move', 0, 0, 80, { cond: 'asleep' });
    expect(asleep.filter(s => s.dash)).toHaveLength(1);
    expect(asleep.some(s => s.fill === LEG.hi)).toBe(true);
    expect(toSvg(tile('move', 0, 0, 80, { cond: 'awake' }))).toContain('stroke-dasharray="4 3"');
    expect(toSvg(tile('move', 0, 0, 36, { cond: 'awake', solid: true }))).toContain('stroke-dasharray="3 2"');
    expect(occupied('take', 0, 0, 80, 72, { cond: 'awake' }).filter(s => s.dash)).toHaveLength(1);
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

  it('draws a line as a thin rail from the square edge, with an arrow at the board edge, a bar before a friend, none in a take', () => {
    const arrow = railLine([50, 50], [450, 50], 100, 'arrow');
    expect(arrow.rail.a).toBe(0.85);
    expect(arrow.rail.shapes.map(sh => [sh.stroke, sh.cap])).toEqual([[LEG.halo, 'butt'], [LEG.navy, 'butt'], [LEG.green, 'butt']]);
    // The rail starts 0.42 of a square from the piece's centre; the arrow's tip is 0.44 past the last centre.
    expect(arrow.rail.shapes[2]).toMatchObject({ k: 'line', pts: [92, 50, 478, 50], lw: 4 });
    expect(arrow.end.map(sh => sh.k === 'line' && sh.pts.slice(0, 2))).toEqual([[494, 50], [494, 50]]);
    expect(arrow.end[1]).toMatchObject({ fill: LEG.green, stroke: LEG.navy });
    expect(railLine([50, 50], [450, 50], 100, 'stop').end.map(sh => sh.stroke)).toEqual([LEG.halo, LEG.navy]);
    expect(railLine([50, 50], [450, 450], 100, 'x')).toMatchObject({ end: [], rail: { shapes: [{ pts: [92, 92, 450, 450] }, {}, {}] } });
    expect(toSvg(arrow.rail.shapes)).toContain('stroke-linecap="butt"');
  });

  it('draws the gold glow under a selected piece and the red one under an attacked piece', () => {
    expect(glow(50, 90, 100)).toEqual({ k: 'ellipse', x: 50, y: 90, rx: 36, ry: 11, fill: 'glow-gold' });
    expect(glow(50, 90, 100, true)).toMatchObject({ rx: 40, ry: 13, fill: 'glow-red' });
    expect(toSvg([glow(50, 90, 100)])).toContain('fill="url(#leg-glow-gold)"');
    expect(DEFS).toContain('id="leg-glow-gold"');
  });

  it('draws a threat as a faint red arrow from the attacker, cut short at both centres', () => {
    const t = threat([50, 50], [50, 450], 100);
    expect(t.a).toBe(0.6);
    // The halo line, the halo head, the red line, the red head; the head's tip is 0.28 of a square short of the target's centre.
    expect(t.shapes.map(sh => sh.fill ?? sh.stroke)).toEqual([LEG.halo, LEG.halo, LEG.red, LEG.red]);
    expect(t.shapes[3]).toMatchObject({ k: 'line', pts: [50, 422, expect.any(Number), expect.any(Number), expect.any(Number), expect.any(Number), 50, 422] });
    expect(t.shapes[2]).toMatchObject({ pts: [50, 72, 50, 415.7], lw: 2 });
  });

  it('leaves none of the old marks in the game or the Workshop', () => {
    const dir = new URL('./', import.meta.url);
    const render = readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(f => /\.(ts|mjs)$/.test(f) && !f.endsWith('.test.ts'))
      .map(f => readFileSync(new URL(f, dir), 'utf8')).join('\n');
    expect(render.match(/\b(gem|brackets|sight)\(/g)).toBeNull();
    // The old gem gold, its light gold and the dashed shot ring (the character classes keep this line out of a grep for them).
    const css = readFileSync(new URL('../workshop/ground.css', import.meta.url), 'utf8');
    expect(css.match(/#e9b4[4]c|#f0bf5[2]|dashed #b3261[e]/gi)).toBeNull();
  });
});
