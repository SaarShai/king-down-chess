import { expect, it, vi } from 'vitest';
import { contrast } from './contrast';
import { drawPlainMarks, emptyMarks, PLAIN, type PlainMarks } from './plain-marks';

function draw(marks: Parameters<typeof drawPlainMarks>[2], tile = 75, flipped = false, pixel = 1) {
  const gradients: ReturnType<typeof vi.fn>[] = [];
  const gradient = () => {
    const ink = { addColorStop: vi.fn() };
    gradients.push(ink.addColorStop);
    return ink;
  };
  const strokes: { color: unknown; width: number }[] = [], caps: unknown[] = [];
  const ctx = new Proxy({
    fillRect: vi.fn(), fillText: vi.fn(), roundRect: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    ellipse: vi.fn(), quadraticCurveTo: vi.fn(), arc: vi.fn(), setLineDash: vi.fn(),
    createLinearGradient: vi.fn(gradient), createRadialGradient: vi.fn(gradient),
    globalAlpha: 1, lineWidth: 0, strokeStyle: null as unknown, font: '', lineCap: 'round',
    stroke() { strokes.push({ color: this.strokeStyle, width: this.lineWidth }); caps.push(this.lineCap); },
  }, { get: (o, key: string) => o[key as keyof typeof o] ?? (() => {}) });
  const scene = { PAD: 0, TILE: tile, cell: (sq: number) => ({ col: flipped ? 7 - sq % 8 : sq % 8, row: flipped ? sq >> 3 : 7 - (sq >> 3) }) };
  drawPlainMarks(ctx as unknown as CanvasRenderingContext2D, scene, marks, pixel);
  return { ctx, gradients, strokes, caps };
}

const actor = { square: 0, color: PLAIN.actor, size: 1.12, role: 'actor' } as const;
it('paints a tapered ring and a pool inside each empty move ring', () => {
  const d = draw({ ...emptyMarks(), rings: [actor, { square: 8, color: PLAIN.move, size: .78, role: 'target' }] });
  const { ctx } = d;
  const [x, y] = [37.5, (7 + .79) * 75], rx = .4 * 75 * 1.12, ry = .18 * 75 * 1.12;
  expect(ctx.ellipse.mock.calls[0].slice(0, 4)).toEqual([x, y - .046 * 75 * .12, rx, ry]);
  const points = ctx.lineTo.mock.calls;
  const body = points.slice(130, 195);
  expect(body[32][1] - y - ry).toBeCloseTo(.7 * .046 * 75 / 2);
  expect(y - ry - body[0][1]).toBeCloseTo(.7 * .046 * 75 * .42 / 2);
  expect(d.gradients[0].mock.calls).toEqual([[0, '#fff6cf'], [.55, '#e9b44c'], [1, '#e9b44c']]);
  expect(ctx.createRadialGradient).toHaveBeenCalledExactlyOnceWith(0, 0, 0, 0, 0, .4 * 75 * .78);
  expect(d.gradients[1].mock.calls).toEqual([[0, 'rgba(255,214,120,0.5)'], [1, 'rgba(255,214,120,0)']]);
});

it('keeps the gaps of a dashed ring open: its keyline and body dashes have flat ends', () => {
  expect(draw({ ...emptyMarks(), rings: [{ ...actor, dash: [4, 5] }] }).caps).toEqual(['butt', 'butt']);
});

it('keeps dashed rings, curved paths, arrow heads and step positions at each scale and orientation', () => {
  const marks: PlainMarks = {
    rings: [{ ...actor, dash: [4, 5] }],
    paths: [{ squares: [0, 8], color: PLAIN.move, arc: true, dash: [2, 7] }],
    steps: [{ square: 8, number: 2 }],
  };
  const { ctx, strokes } = draw(marks);
  expect(strokes[0]).toEqual({ color: '#4e3815d9', width: .027 * .8 * 75 + 2.4 });
  expect(ctx.quadraticCurveTo.mock.calls[0]).toEqual([37.5, 459.75, 37.5, 507.75]);
  expect(ctx.moveTo.mock.calls[2][0]).toBeCloseTo(37.5 - Math.cos(Math.PI / 2 - .5) * .147 * 75);
  expect(ctx.ellipse.mock.calls[1].slice(0, 4)).toEqual([37.5, 584.25, .4 * 75 * 1.12, .18 * 75 * 1.12]);
  expect(ctx.setLineDash).toHaveBeenCalledWith([4, 5]);
  expect(ctx.fillText).toHaveBeenCalledWith('2', 61.5, 463.5);
  expect(ctx.arc.mock.calls[0]).toEqual([61.5, 463.5, 8.25, 0, Math.PI * 2]);
  expect(ctx.font).toBe('700 12px Avenir Next,Avenir,sans-serif');

  const larger = draw(marks, 150).ctx;
  expect(larger.ellipse.mock.calls[1].slice(0, 4)).toEqual(ctx.ellipse.mock.calls[1].slice(0, 4).map(n => n * 2));
  expect(larger.setLineDash).toHaveBeenCalledWith([8, 10]);
  const flipped = draw(marks, 75, true, 2).ctx;
  expect(flipped.fillText).toHaveBeenCalledWith('2', 586.5, 88.5);
  expect(flipped.font).toBe('700 24px Avenir Next,Avenir,sans-serif');
});

it('fills the last squares, marks all four check corners and draws a flake over a frost square', () => {
  const { ctx, strokes } = draw({
    ...emptyMarks(), check: 0, shadows: [{ square: 1, opacity: .12 }, { square: 9, opacity: .24 }],
    rings: [{ square: 8, color: PLAIN.ice, frost: true, role: 'focus' }],
  });
  expect(ctx.fillRect.mock.calls).toEqual([[78.75, 528.75, 67.5, 67.5], [78.75, 453.75, 67.5, 67.5], [0, 450, 75, 75]]);
  expect(ctx.roundRect).toHaveBeenCalledWith(3.75, 528.75, 67.5, 67.5, .063 * 75);
  expect(ctx.moveTo.mock.calls.slice(0, 10)).toHaveLength(10);
  expect(ctx.lineTo).toHaveBeenCalledWith(.09 * 75, 525 + .09 * 75);
  expect(ctx.lineTo).toHaveBeenCalledWith(.91 * 75, 525 + .91 * 75);
  expect(strokes.at(-1)?.color).toBe('#3f86b3');
  expect(ctx.ellipse).not.toHaveBeenCalled();
});

// The two stone tones of the play board, the median of an empty a5 and b5 in the 1280x800 build (docs/specs/gui-fx/capture.mjs).
const STONE = { light: '#dfd6b9', dark: '#a3a397' };
it('gives each mark kind an edge that reads at 3:1 or more on both stone tones', () => {
  const kind = (color: string, extra: Partial<PlainMarks['rings'][number]> = {}): PlainMarks => ({ ...emptyMarks(), rings: [{ square: 8, color, role: 'target', ...extra }] });
  const kinds: Record<string, PlainMarks> = {
    move: kind(PLAIN.move, { size: .78 }), capture: kind(PLAIN.enemy, { size: 1.12 }), selected: kind(PLAIN.actor, { size: 1.12, role: 'actor' }),
    staged: { ...emptyMarks(), paths: [{ squares: [0, 8], color: PLAIN.move }], steps: [{ square: 8, number: 1 }] },
    shelter: kind(PLAIN.holy, { role: 'state' }), freeze: kind(PLAIN.ice, { frost: true }), ice: kind(PLAIN.ice, { role: 'state', size: 1.25 }),
    ember: kind(PLAIN.ember), shadow: kind(PLAIN.shadow), friend: kind(PLAIN.friend, { dash: [5, 5] }), check: { ...emptyMarks(), check: 0 },
  };
  const reads = Object.fromEntries(Object.entries(kinds).map(([name, marks]) => {
    const inks: string[] = [];
    const ctx = new Proxy({ fillStyle: '' as unknown, strokeStyle: '' as unknown, globalAlpha: 1,
      createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }),
      fill() { inks.push(this.fillStyle as string); }, stroke() { inks.push(this.strokeStyle as string); },
      strokeRect() { inks.push(this.strokeStyle as string); },
    }, { get: (o, key: string) => o[key as keyof typeof o] ?? (() => {}) });
    drawPlainMarks(ctx as unknown as CanvasRenderingContext2D, { PAD: 0, TILE: 75, cell: sq => ({ col: sq % 8, row: 7 - (sq >> 3) }) }, marks);
    const best = Math.max(...inks.filter(ink => typeof ink === 'string').map(ink => Math.min(contrast(ink, STONE.light), contrast(ink, STONE.dark))));
    return [name, best >= 3];
  }));
  expect(reads).toEqual(Object.fromEntries(Object.keys(kinds).map(name => [name, true])));
});
