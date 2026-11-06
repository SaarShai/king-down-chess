import { describe, expect, it, vi } from 'vitest';
import { cloudAt, cloudRing, windAt } from './travel-material';

describe('painted clouds before the sheet has loaded', () => {
  it('draws nothing and does not throw', () => {
    const drawImage = vi.fn();
    const ctx = { drawImage, save() {}, restore() {}, translate() {}, rotate() {}, globalAlpha: 1 } as unknown as CanvasRenderingContext2D;
    cloudAt(ctx, 10, 10, 1, 200, 600, 3, 'gold');
    cloudRing(ctx, { x: 10, y: 10 }, 200, 'under', 3);
    windAt(ctx, 10, 10, 0, 1, 100, 400, 'slate');
    expect(drawImage).not.toHaveBeenCalled();
  });
});
