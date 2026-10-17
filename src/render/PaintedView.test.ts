// F13: the board canvas stays hidden until the stone art is loaded and decoded, so no gold or page colour
// shows in its place; it appears in the frame that first draws stone and pieces.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromFen } from '../rules/setup';

let resolveLoad: () => void = () => {};
let pickedSquare: number | null = null;
vi.mock('../../docs/2d-first-pieces/board/scene.mjs', () => ({
  createScene: () => new Proxy({ load: () => new Promise<void>(r => { resolveLoad = r; }), squareAt: () => pickedSquare, kings: [], drawnKings: [] } as Record<string, unknown>,
    { get: (t, k: string) => k in t ? t[k] : () => {} }),
}));

const frames: FrameRequestCallback[] = [];
const listeners = new Map<string, EventListener>();
function stubDom() {
  const el = () => ({ style: {} as Record<string, string>, classList: { add() {}, toggle() {} },
    addEventListener(name: string, listener: EventListener) { listeners.set(name, listener); }, appendChild() {}, width: 0, height: 0,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 960 }), setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} });
  vi.stubGlobal('document', { createElement: el, addEventListener() {}, hidden: false });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} });
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f));
  return el();
}
afterEach(() => { vi.unstubAllGlobals(); frames.length = 0; listeners.clear(); pickedSquare = null; });

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

describe('PaintedView touch input', () => {
  const down = { button: 0, pointerId: 1, pointerType: 'touch', clientX: 0, clientY: 0, shiftKey: false };
  const fire = (name: string, event: object = {}) => listeners.get(name)!(event as Event);
  async function board() {
    const container = stubDom(), { PaintedView } = await import('./PaintedView');
    const view = new PaintedView(container as unknown as HTMLElement);
    view.sync(fromFen('7k/8/8/8/8/8/4P3/K7 w - - 0 1'));
    view.onSquareClick = vi.fn(); view.onDragSelect = vi.fn();
    return view;
  }
  it.each([[40, 0], [0, -40]])('keeps a touch piece drag by %i/%i', async (clientX, clientY) => {
    const view = await board(), preventDefault = vi.fn();
    pickedSquare = 12; fire('pointerdown', down); fire('touchstart', { preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    pickedSquare = 28; fire('pointermove', { ...down, clientX, clientY }); fire('pointerup', { ...down, clientX, clientY });
    expect(view.onDragSelect).toHaveBeenCalledExactlyOnceWith(12);
    expect(view.onSquareClick).toHaveBeenCalledExactlyOnceWith(28, false);
  });
  it('allows a swipe from the side-to-move piece when the board takes no input', async () => {
    const view = await board(), preventDefault = vi.fn();
    view.canDrag = () => false; pickedSquare = 12;
    fire('pointerdown', down); fire('touchstart', { preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
    fire('pointercancel'); fire('pointerup', down);
    expect(view.onDragSelect).not.toHaveBeenCalled(); expect(view.onSquareClick).not.toHaveBeenCalled();
  });
  it('keeps a swipe from selecting their piece when drag is off, but keeps a tap', async () => {
    const view = await board(); view.canDrag = () => false; pickedSquare = 12;
    fire('pointerdown', down);
    fire('pointermove', { ...down, clientY: -40 }); fire('pointerup', { ...down, clientY: -40 });
    expect(view.onDragSelect).not.toHaveBeenCalled();
    expect(view.onSquareClick).not.toHaveBeenCalled();
    fire('pointerdown', down); fire('pointerup', down);
    expect(view.onSquareClick).toHaveBeenCalledExactlyOnceWith(12, false);
    expect(view.onDragSelect).not.toHaveBeenCalled();
  });
  it('keeps a square tap', async () => {
    const view = await board(); pickedSquare = 12;
    fire('pointerdown', down); fire('touchstart', { preventDefault() {} }); fire('pointerup', down);
    expect(view.onSquareClick).toHaveBeenCalledExactlyOnceWith(12, false);
    expect(view.onDragSelect).not.toHaveBeenCalled();
  });
  it.each([20, 63])('allows scroll from square %i and clears a cancelled touch', async square => {
    const view = await board(), preventDefault = vi.fn(); pickedSquare = square;
    fire('pointerdown', down); fire('touchstart', { preventDefault });
    expect(preventDefault).not.toHaveBeenCalled();
    fire('pointermove', { ...down, clientY: -40 }); fire('pointercancel'); fire('pointerup', down);
    expect(view.onSquareClick).not.toHaveBeenCalled(); expect(view.onDragSelect).not.toHaveBeenCalled();
    pickedSquare = 12; fire('pointerdown', down); fire('pointerup', down);
    expect(view.onSquareClick).toHaveBeenCalledExactlyOnceWith(12, false);
  });
});
