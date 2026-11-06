import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PaintedScene } from '../painted/scene.mjs';
import { CHECK_ONSET_MS, CHECK_SETTLE_MS, drawCheck, drawWithdrawal } from './check';
import { checkRing, link } from './indications';
vi.mock('./indications', () => ({ link: vi.fn(), checkRing: vi.fn() }));

// A recording canvas: each drawImage and fill is noted with the alpha it is drawn at.
let drawn: { op: string; alpha: number }[] = [];
function recorder() {
  const state = { globalAlpha: 1 }, stack: number[] = [];
  return new Proxy(state, {
    get(target, key) {
      if (key in target) return Reflect.get(target, key);
      if (key === 'save') return () => stack.push(target.globalAlpha);
      if (key === 'restore') return () => { target.globalAlpha = stack.pop() ?? 1; };
      if (key === 'drawImage' || key === 'fill') return () => drawn.push({ op: key, alpha: target.globalAlpha });
      if (key === 'getContext') return () => recorder();
      return () => {};
    },
    set(target, key, value) { Reflect.set(target, key, value); return true; },
  }) as unknown as CanvasRenderingContext2D;
}
beforeEach(() => {
  drawn = [];
  vi.stubGlobal('document', { createElement: () => recorder() });
  vi.stubGlobal('Path2D', class {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

const ghost = vi.fn();
const scene = { headroom: 64, foot: (sq: number) => ({ x: sq * 10, y: sq * 5 }), cell: (sq: number) => ({ col: sq % 8, row: 7 - (sq >> 3) }), ghost } as unknown as PaintedScene;
const checkers = [{ sq: 60, king: 4, path: 'straight' as const }], board = Object.assign(new Uint8Array(64), { 60: 0x14, 4: 6 });
const at = (ms: number, layer: 'under' | 'over', row?: number) => { drawn = []; drawCheck(recorder(), scene, layer, row, { king: 4, checkers, board, ms, pixel: 1 }); return drawn; };

it('presses the wash in, flashes the real checker edge once, then gives way to the ring without a cut', () => {
  expect(at(0, 'under')).toEqual([]);
  // At 80 ms: the wash's three strokes and the checker's edge three times, a few pixels out.
  expect(at(80, 'under').filter(d => d.op === 'drawImage')).toHaveLength(6);
  expect(ghost).toHaveBeenCalledWith(expect.anything(), 0x14, 60, 1);
  const full = at(CHECK_ONSET_MS, 'under');
  expect(full.map(d => d.alpha)).toEqual([.85, .54, .62]);
  const half = at(CHECK_ONSET_MS + CHECK_SETTLE_MS / 2, 'under');
  expect(half.map(d => d.alpha)).toEqual([.425, .27, .31]);
  expect(at(CHECK_ONSET_MS + CHECK_SETTLE_MS, 'under')).toEqual([]);
});

it('lands the seal in the king row after 175 ms, and fades it as the ring comes', () => {
  expect(at(150, 'over', 7).filter(d => d.op === 'fill')).toEqual([]);
  const settled = at(CHECK_ONSET_MS, 'over', 7);
  expect(settled.filter(d => d.op === 'drawImage')).toEqual([{ op: 'drawImage', alpha: 1 }]);
  expect(settled.filter(d => d.op === 'fill').length).toBeGreaterThan(0);
  expect(at(CHECK_ONSET_MS, 'over', 6)).toEqual([]);
  expect(at(CHECK_ONSET_MS + CHECK_SETTLE_MS / 2, 'over', 7).filter(d => d.op === 'drawImage')).toEqual([{ op: 'drawImage', alpha: .5 }]);
  expect(at(CHECK_ONSET_MS + CHECK_SETTLE_MS, 'over', 7)).toEqual([]);
});

it('draws each cause line whole and still, after the last row', () => {
  at(0, 'over', 6); expect(link).not.toHaveBeenCalled();
  at(0, 'over', 7); at(CHECK_ONSET_MS - 1, 'over', 7);
  at(CHECK_ONSET_MS, 'over', 7);
  expect(vi.mocked(link).mock.calls.map(call => call.slice(2))).toEqual([[60, 4, '#b84d25', false], [60, 4, '#b84d25', false]]);
});

it('fades the ring over its 220 ms and then draws nothing', () => {
  drawWithdrawal(recorder(), scene, 4, .5);
  expect(checkRing).toHaveBeenCalledExactlyOnceWith(expect.anything(), scene, 4, .5, 1.06);
  vi.mocked(checkRing).mockClear();
  drawWithdrawal(recorder(), scene, 4, 1);
  expect(checkRing).not.toHaveBeenCalled();
});
