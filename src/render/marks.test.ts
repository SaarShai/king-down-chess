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
  drawMarks(ctx, scene, layer, { marks: { bites: [0], hint }, piece: 0, preview: 0, k: 1, px: 1, ink, ...more });
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

it('keeps the gold tile under the selected piece and joins its line with a rail', () => {
  const calls: string[] = [], gradient = () => ({ addColorStop() {} });
  const ctx = {
    globalAlpha: 1, save() {}, restore() {}, beginPath() {}, fill() {}, stroke() {}, translate() {}, scale() {}, lineTo() {}, roundRect() {}, arc() {},
    fillRect() { calls.push('tile'); }, strokeRect() { calls.push('edge'); }, moveTo() { calls.push('line'); }, ellipse() { calls.push('ellipse'); }, drawImage() { calls.push('image'); },
    createLinearGradient: gradient, createRadialGradient() { calls.push('glow'); return gradient(); },
  } as unknown as CanvasRenderingContext2D;
  const scene = { PAD: 0, TILE: 100, cell: (sq: number) => ({ col: sq % 8, row: 7 - (sq >> 3) }), foot: () => ({ x: 0, y: 0 }) } as unknown as PaintedScene;
  const state = (marks: MarkState['marks']): MarkState => ({ marks, piece: 0, preview: null, k: 1, px: 1 });
  drawMarks(ctx, scene, 'under', state({ selected: 0 }));
  expect(calls).toEqual(['tile', 'edge']);
  calls.length = 0;
  // The rook a1 to h1: the tile, the rail's three lines, the 7 tiles, then the arrowhead's two shapes.
  drawMarks(ctx, scene, 'under', state({ selected: 0, moves: [1, 2, 3, 4, 5, 6, 7], rails: [{ to: 7, end: 'arrow' }] }));
  expect(calls.slice(0, 5)).toEqual(['tile', 'edge', 'line', 'line', 'line']);
  expect(calls.slice(-2)).toEqual(['line', 'line']);
});

it('draws Show threats as the red glow under the attacked piece and the red arrow after the last row', () => {
  const calls: string[] = [], gradient = () => ({ addColorStop() {} });
  const ctx = {
    globalAlpha: 1, save() {}, restore() {}, beginPath() {}, fill() {}, stroke() {}, translate() {}, scale() {}, lineTo() {}, roundRect() {}, arc() {},
    moveTo() { calls.push('line'); }, ellipse() { calls.push('ellipse'); }, strokeRect() {},
    createLinearGradient: gradient, createRadialGradient: gradient,
  } as unknown as CanvasRenderingContext2D;
  const scene = { PAD: 0, TILE: 100, cell: (sq: number) => ({ col: sq % 8, row: 7 - (sq >> 3) }), foot: () => ({ x: 0, y: 0 }) } as unknown as PaintedScene;
  const state: MarkState = { marks: { threats: [{ from: 35, to: 11 }] }, piece: 0, preview: null, k: 1, px: 1, };
  drawMarks(ctx, scene, 'under', state);
  expect(calls).toEqual(['ellipse']);
  calls.length = 0;
  drawMarks(ctx, scene, 'over', state, 3);
  expect(calls).toEqual([]);
  drawMarks(ctx, scene, 'over', state, 7);
  expect(calls).toEqual(['line', 'line', 'line', 'line']);
});

it('uses the piece look for the move preview at half opacity', () => {
  let preview: unknown;
  draw(undefined, undefined, { marks: { moves: [0] }, piece: 2, ...{ ghost: (_ctx: CanvasRenderingContext2D, piece: number, square: number, opacity: number) => { preview = [piece, square, opacity]; } } }, 'under');
  expect(preview).toEqual([2, 0, 0.5]);
});

it('fills only the selected tile under every figure row in both board directions', () => {
  for (const flipped of [false, true]) {
    const fills: unknown[][] = [], strokes: unknown[][] = [];
    const ctx = { globalAlpha: 1, save() {}, restore() {},
      fillRect(this: {fillStyle: string}, ...box: number[]) { fills.push([this.fillStyle, ...box]); },
      strokeRect(this: {strokeStyle: string; lineWidth: number}, ...box: number[]) { strokes.push([this.strokeStyle, this.lineWidth, ...box]); },
    } as unknown as CanvasRenderingContext2D;
    const scene = { PAD: 32, TILE: 112, cell: () => ({col:4,row:flipped ? 7 : 0}), foot: () => ({x:480,y:120}) } as unknown as PaintedScene;
    const state: MarkState = { marks: {selected:60}, piece:0, preview:null, k:1, px:2 };
    drawMarks(ctx,scene,'under',state);
    expect(fills).toEqual([['#d8aa43',480,flipped ? 816 : 32,112,112]]);
    expect(strokes).toEqual([['#684819',4,482,flipped ? 818 : 34,108,108]]);
    for(let row=0;row<8;row++) drawMarks(ctx,scene,'over',state,row);
    expect(fills).toHaveLength(1); expect(strokes).toHaveLength(1);
  }
});

it('draws near and far legal tiles at full size at once', () => {
  const scales: number[][] = [], gradient = () => ({ addColorStop() {} });
  const ctx = { globalAlpha:1, save() {},restore() {},beginPath() {},fill() {},stroke() {},translate() {},
    scale(...args: number[]) { scales.push(args); }, roundRect() {}, ellipse() {}, fillRect() {}, strokeRect() {},
    createLinearGradient:gradient,createRadialGradient:gradient,
  } as unknown as CanvasRenderingContext2D;
  const scene = {PAD:0,TILE:112,cell:(sq:number)=>({col:sq%8,row:7-(sq>>3)}),foot:()=>({x:0,y:0})} as unknown as PaintedScene;
  drawMarks(ctx,scene,'under',{marks:{selected:0,moves:[1,7]},piece:0,preview:null,k:1,px:1});
  expect(scales).toEqual([]);
});

it('keeps every excluded legend mark identical at onset, mid-frame and late time', async () => {
  const { vi } = await import('vitest');
  const scene = { PAD: 32, TILE: 112, cell: (sq: number) => ({ col: sq % 8, row: 7 - (sq >> 3) }), foot: (sq: number) => ({ x: (sq % 8) * 112 + 88, y: (7 - (sq >> 3)) * 112 + 125 }) } as unknown as PaintedScene;
  const marks: MarkState['marks'] = {
    selected: 0, moves: [1, 2, 7, 16], captures: [9, 18], bites: [9, 18], last: [12],
    threats: [{ from: 35, to: 11 }], rails: [{ to: 7, end: 'arrow' }],
    read: { step: new Set([24]), take: new Set([18]), shot: new Set(), swap: new Set(), push: [] } as MarkState['marks']['read'],
  };
  const record = (time: number) => {
    const calls: unknown[][] = [];
    const clock = vi.spyOn(performance, 'now').mockReturnValue(time);
    const ctx = new Proxy({ globalAlpha: 1 } as Record<string, unknown>, {
      get: (target, name: string) => name in target ? target[name] : (...args: unknown[]) => {
        calls.push([name, ...args]);
        if (name.startsWith('create')) return { addColorStop: (...stops: unknown[]) => calls.push(['colour', ...stops]) };
      },
      set: (target, name: string, value) => { target[name] = value; calls.push([name, typeof value === 'object' ? 'gradient' : value]); return true; },
    }) as unknown as CanvasRenderingContext2D;
    const state: MarkState = { marks, board: new Uint8Array(64).fill(1), piece: 0, preview: null, px: 2, k: 1.7, };
    drawMarks(ctx, scene, 'under', state);
    for (let row = 0; row < 8; row++) drawMarks(ctx, scene, 'over', state, row);
    clock.mockRestore();
    return calls;
  };
  expect(record(100)).toEqual(record(250));
  expect(record(250)).toEqual(record(50000));
});
