import { expect, it } from 'vitest';
import type { PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import { boardInk } from './board-ink';
import { drawMarks, type MarkState } from './marks';

function draw(ink?: MarkState['ink'], hint?: number[], more: Partial<MarkState> = {}, layer: 'under' | 'over' = 'over') {
  const arcs: { x: number; y: number; radius: number }[] = [], calls: string[] = [];
  const gradient = () => ({ addColorStop() {} });
  const ctx = {
    save() {}, restore() {}, beginPath() {}, fill() {}, stroke() {}, translate() {}, scale() {}, moveTo() {}, lineTo() {},
    roundRect() { calls.push('rect'); }, ellipse() { calls.push('ellipse'); },
    createLinearGradient: gradient, createRadialGradient: gradient,
    arc(x: number, y: number, radius: number) { arcs.push({ x, y, radius }); calls.push('badge'); },
    fillText() {}, strokeRect(this: { strokeStyle: string }) { calls.push(this.strokeStyle === '#c99a2e' ? 'hint' : 'frame'); },
  } as unknown as CanvasRenderingContext2D;
  const scene = { PAD: 24, TILE: 114, cell: () => ({ col: 7, row: 7 }), foot: () => ({ x: 0, y: 0 }) } as unknown as PaintedScene;
  drawMarks(ctx, scene, layer, { marks: { bites: [0], hint }, piece: 0, preview: 0, k: 1, px: 1, motion: false, since: 0, ink, ...more });
  return { arcs, calls };
}

it('keeps the phone bite disc and its halo inside the tile', () => {
  for (const width of [246, 300, 360, 376]) {
    const { arcs } = draw(boardInk(width)), edge = 24 + 8 * 114, halo = (1.5 + 3) / 2;
    expect(arcs).toHaveLength(1);
    expect(arcs[0].x + arcs[0].radius + halo).toBeLessThanOrEqual(edge);
    expect(arcs[0].y + arcs[0].radius + halo).toBeLessThanOrEqual(edge);
    expect(arcs[0].radius * width / 960).toBeCloseTo(6.5);
  }
});

it('draws the web pointer frame before the bite badge', () => {
  expect(draw(boardInk(960)).calls).toEqual(['frame', 'badge']);
});

it('keeps the plugin badge size, place, and frame order', () => {
  const result = draw();
  expect(result.arcs).toEqual([{ x: 840, y: 840, radius: 11 }]);
  expect(result.calls).toEqual(['badge', 'frame']);
});

it('draws the web hint under the pointer frame, and both under the bite badge', () => {
  expect(draw(boardInk(390), [0]).calls).toEqual(['hint', 'frame', 'badge']);
});

it('keeps the plugin hint, badge and frame order', () => {
  expect(draw(undefined, [0]).calls).toEqual(['badge', 'hint', 'frame']);
});

it('draws a move as a tile, and a take on a figure as the red edge and ring under it and the badge over it', () => {
  const board = Array.from({ length: 64 }, (_, sq) => sq === 9 ? 1 : 0), marks = { moves: [0], captures: [9] };
  // The tile: its halo, its fill and its edge. The take: its edge (a halo, then red), the ring and the glow.
  expect(draw(undefined, undefined, { marks, board }, 'under').calls).toEqual(['rect', 'rect', 'rect', 'rect', 'rect', 'ellipse', 'ellipse']);
  // The badge: its halo and its edge, then the target (its ring and its dot).
  expect(draw(undefined, undefined, { marks, board }).calls).toEqual(['rect', 'rect', 'badge', 'badge']);
});
