import { afterEach, expect, it, vi } from 'vitest';
import { playFrames } from './frame-player';
import type { LoadedPack } from './art';

const pack: LoadedPack = {
  image: {} as HTMLImageElement,
  bank: { image: 'pack.webp', ms: 1100, size: 384, columns: 4, pivot: [192, 350], body: 300, frames: [[0, 0], [500, 1], [925, 5]] },
};
function fixture() {
  const ctx = {
    clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(), globalAlpha: 1, globalCompositeOperation: 'source-over',
    drawImage: vi.fn(() => [ctx.globalAlpha, ctx.globalCompositeOperation]),
  };
  const canvas = { style: {} as CSSStyleDeclaration, dataset: {}, setAttribute: vi.fn(), remove: vi.fn(), getContext: () => ctx };
  const callbacks = new Map<string, () => void>();
  vi.stubGlobal('document', { createElement: () => canvas });
  vi.stubGlobal('window', { addEventListener: (name: string, callback: () => void) => callbacks.set(name, callback), removeEventListener: vi.fn() });
  const layer = { append: vi.fn() } as unknown as HTMLElement;
  const box = { x: 50, y: 70, width: 100, height: 100, bodyHeight: 130 };
  return { target: { layer, measure: () => box, motion: 'normal' as const }, box, canvas, ctx, callbacks };
}
afterEach(() => vi.unstubAllGlobals());

it('scales the body and keeps the feet fixed through each pose and resize', () => {
  const f = fixture();
  const player = playFrames(f.target, pack)!;
  const scale = 130 / 300;
  player.draw(0);
  expect(f.ctx.drawImage).toHaveBeenLastCalledWith(pack.image, 0, 0, 384, 384, 0, 0, 384, 384);
  expect(parseFloat(f.canvas.style.width)).toBeCloseTo(384 * scale);
  expect(parseFloat(f.canvas.style.left)).toBeCloseTo(100 - 192 * scale);
  expect(parseFloat(f.canvas.style.top)).toBeCloseTo(170 - 350 * scale);
  player.draw(600);
  expect(f.ctx.drawImage).toHaveBeenLastCalledWith(pack.image, 384, 0, 384, 384, 0, 0, 384, 384);
  player.draw(1500, .5);
  expect(f.ctx.drawImage).toHaveBeenLastCalledWith(pack.image, 384, 384, 384, 384, 0, 0, 384, 384);
  expect(f.canvas.style.opacity).toBe('0.5');
  f.box.x = 100;
  f.box.bodyHeight = 90;
  f.callbacks.get('resize')!();
  expect(parseFloat(f.canvas.style.left)).toBeCloseTo(150 - 192 * .3);
  expect(parseFloat(f.canvas.style.width)).toBeCloseTo(384 * .3);
  player.remove();
  expect(f.canvas.remove).toHaveBeenCalledOnce();
  expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
});

it('dissolves from the registered old pose and adds the weighted colours', () => {
  const f = fixture(), player = playFrames(f.target, pack)!;
  const from = { image: {} as HTMLCanvasElement, rect: { x: 60, y: 40, width: 80, height: 130 } };
  player.draw(60, 1, from, .5);
  const [image, x, y, width, height] = f.ctx.drawImage.mock.calls[0] as unknown as [CanvasImageSource, number, number, number, number];
  expect(image).toBe(from.image);
  expect(x).toBeCloseTo(192 - 40 / (130 / 300));
  expect(y).toBeCloseTo(50);
  expect(width).toBeCloseTo(80 / (130 / 300));
  expect(height).toBeCloseTo(300);
  expect(f.ctx.drawImage).toHaveNthReturnedWith(1, [.5, 'source-over']);
  expect(f.ctx.drawImage).toHaveNthReturnedWith(2, [.5, 'lighter']);
  expect(f.ctx.restore).toHaveBeenCalledOnce();
  player.remove();
});
