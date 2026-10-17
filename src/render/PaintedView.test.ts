// F13: the board canvas stays hidden until the stone art is loaded and decoded, so no gold or page colour
// shows in its place; it appears in the frame that first draws stone and pieces.
import { afterEach, describe, expect, it, vi } from 'vitest';

let resolveLoad: () => void = () => {};
vi.mock('../../docs/2d-first-pieces/board/scene.mjs', () => ({
  createScene: () => new Proxy({ load: () => new Promise<void>(r => { resolveLoad = r; }), kings: [], drawnKings: [] } as Record<string, unknown>,
    { get: (t, k: string) => k in t ? t[k] : () => {} }),
}));

const frames: FrameRequestCallback[] = [];
function stubDom() {
  const el = () => ({ style: {} as Record<string, string>, classList: { add() {}, toggle() {} }, addEventListener() {}, appendChild() {}, width: 0, height: 0 });
  vi.stubGlobal('document', { createElement: el, addEventListener() {}, hidden: false });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} });
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f));
  return el();
}
afterEach(() => { vi.unstubAllGlobals(); frames.length = 0; });

describe('PaintedView first paint', () => {
  it('hides the canvas until the scene has loaded, then shows it on the next frame', async () => {
    const container = stubDom();
    const { PaintedView } = await import('./PaintedView');
    const view = new PaintedView(container as unknown as HTMLElement);
    const canvas = (view as unknown as { canvas: { style: { visibility: string } } }).canvas;
    expect(canvas.style.visibility).toBe('hidden');
    resolveLoad();
    await view.ready();
    expect(canvas.style.visibility).toBe('hidden');
    frames.splice(0).forEach(f => f(0));
    expect(canvas.style.visibility).toBe('');
  });
});
