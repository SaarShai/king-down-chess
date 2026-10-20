// F13: the board canvas stays hidden until the stone art is loaded and decoded, so no gold or page colour
// shows in its place; it appears in the frame that first draws stone and pieces.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromFen } from '../rules/setup';
import { Game } from '../game';
import { setRules } from '../rules/engine';
import type { PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';

const { reducedMotion, lively, aim, decorate } = vi.hoisted(() => ({ reducedMotion: vi.fn(), lively: vi.fn(), aim: vi.fn(), decorate: vi.fn() }));
let resolveLoad: () => void = () => {};
let pickedSquare: number | null = null;
vi.mock('../../docs/2d-first-pieces/board/scene.mjs', () => ({
  createScene: () => new Proxy({ load: () => new Promise<void>(r => { resolveLoad = r; }), squareAt: () => pickedSquare, kings: [], drawnKings: [], setReducedMotion: reducedMotion, setLively: lively, setAim: aim, setDecorate: decorate, animating: false, falling: false, PAD: 32, TILE: 112, cell: (sq: number) => ({col:sq % 8,row:7 - (sq >> 3)}) } as Record<string, unknown>,
    { get: (t, k: string) => k in t ? t[k] : () => {} }),
}));

const frames: FrameRequestCallback[] = [];
const listeners = new Map<string, EventListener>();
const documentListeners = new Map<string, EventListener>();
function stubDom() {
  const el = () => ({ style: {} as Record<string, string>, classList: { add() {}, toggle() {} },
    addEventListener(name: string, listener: EventListener) { listeners.set(name, listener); }, appendChild() {}, width: 0, height: 0,
    getClientRects: () => [1], getBoundingClientRect: () => ({ left: 0, top: 0, width: 960 }), setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} });
  vi.stubGlobal('document', { createElement: el, addEventListener(name: string, listener: EventListener) { documentListeners.set(name, listener); }, hidden: false });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {} }));
  vi.stubGlobal('ResizeObserver', class { observe() {} });
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f));
  return el();
}
afterEach(() => { vi.unstubAllGlobals(); frames.length = 0; listeners.clear(); documentListeners.clear(); pickedSquare = null; vi.clearAllMocks(); setRules({}); });

describe('PaintedView first paint', () => {
  it('stays unready until the loaded scene is visible on its first frame', async () => {
    const container = stubDom();
    const { PaintedView } = await import('./PaintedView');
    const view = new PaintedView(container as unknown as HTMLElement);
    const canvas = (view as unknown as { canvas: { style: { visibility: string } } }).canvas;
    expect(canvas.style.visibility).toBe('hidden');
    const ready = vi.fn();
    void view.ready().then(ready);
    resolveLoad();
    await vi.waitFor(() => expect(frames).toHaveLength(1));
    expect(canvas.style.visibility).toBe('hidden');
    expect(ready).not.toHaveBeenCalled();
    frames.splice(0).forEach(f => f(0));
    await view.ready();
    expect(canvas.style.visibility).toBe('');
    expect(ready).toHaveBeenCalledOnce();
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

// Off must reach the scene. A select value alone does not stop weapon motion.
describe('PaintedView motion setting', () => {
  it.each([false, true])('sets scene motion for system reduced motion %s', async systemReduced => {
    const container = stubDom();
    vi.stubGlobal('matchMedia', () => ({ matches: systemReduced, addEventListener() {} }));
    const { PaintedView } = await import('./PaintedView');
    const view = new PaintedView(container as unknown as HTMLElement);
    for (const pace of ['normal', 'fast', 'off'] as const) {
      view.setPace(pace);
      expect(reducedMotion).toHaveBeenLastCalledWith(systemReduced || pace === 'off');
      expect(lively).toHaveBeenLastCalledWith(expect.objectContaining({ moves: !systemReduced && pace !== 'off', idle: !systemReduced && pace !== 'off', pawns: !systemReduced && pace !== 'off' }));
      view.highlight({ selected: 12, moves: [20] });
      pickedSquare = 20;
      listeners.get('pointermove')!({ clientX: 0, clientY: 0 } as PointerEvent);
      expect(aim).toHaveBeenLastCalledWith(20);
    }
  });
});

it('draws frost on the game board after Freeze and clears it on expiry and Undo', async () => {
  const container = stubDom();
  vi.stubGlobal('Image', class { complete = true; naturalWidth = 448; src = ''; });
  const { PaintedView } = await import('./PaintedView');
  const game = new Game(undefined, { kings: [{ king: 'Frost', power: 'Freeze' }, null] });
  game.load(fromFen('7k/8/8/4p3/8/8/P7/K7 w - - 0 1'));
  const view = new PaintedView(container as unknown as HTMLElement);
  const scene = (view as unknown as {scene: PaintedScene}).scene;
  const draw = decorate.mock.lastCall![0];
  const drawImage = vi.fn();
  const ctx = new Proxy({ drawImage }, { get: (target, key: string) => key === 'drawImage' ? target.drawImage : () => {} });
  const boardDrawing = () => {
    view.setRules(game.context); view.sync(game.pos); drawImage.mockClear();
    draw(ctx, scene, 'under');
    for (let row = 0; row < 8; row++) draw(ctx, scene, 'over', row);
    return drawImage.mock.calls.map(([image, ...box]) => ({svg:decodeURIComponent(image.src),box}));
  };
  expect(boardDrawing()).toEqual([]);
  const freeze = () => game.play(game.legal.find(move => move.power === 'freeze' && move.to === 36)!);
  freeze();
  const frozen = boardDrawing();
  expect(frozen).toHaveLength(2);
  expect(frozen[0].svg).toContain('fill="url(#kdm-frost)"');
  expect(frozen[1].svg).toContain('<circle ');
  for (const mark of frozen) expect(mark.box).toEqual([480,368,112,134.4]);
  game.play(game.legal.find(move => move.from === 63 && move.to === 62)!);
  expect(boardDrawing()).toEqual([]);
  expect(game.undo()).toBe(true); expect(boardDrawing()).toEqual(frozen);
  expect(game.undo()).toBe(true); expect(boardDrawing()).toEqual([]);
  freeze(); expect(boardDrawing()).toEqual(frozen);
});


it.each(['move', 'fall'])('A8: ends a %s and consumes the whole pointer gesture', async kind => {
  const container = stubDom(), { PaintedView } = await import('./PaintedView');
  const view = new PaintedView(container as unknown as HTMLElement);
  const scene = (view as unknown as { scene: PaintedScene }).scene;
  const cancel = vi.fn(), fallen = vi.fn();
  Object.assign(scene, { animating: kind === 'move', falling: kind === 'fall', cancel, setFallen: fallen });
  view.onSquareClick = vi.fn();
  for (const type of ['pointerdown', 'pointerup', 'click']) {
    const event = { button: 0, pointerId: 7, detail: 1, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() };
    documentListeners.get(type)!(event as unknown as Event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.stopImmediatePropagation).toHaveBeenCalledOnce();
  }
  expect(cancel).toHaveBeenCalledTimes(kind === 'move' ? 1 : 0);
  expect(fallen).toHaveBeenCalledTimes(kind === 'fall' ? 1 : 0);
  expect(view.onSquareClick).not.toHaveBeenCalled();
  Object.assign(scene, { animating: false, falling: false });
  const next = { button: 0, pointerId: 8, detail: 1, preventDefault: vi.fn(), stopImmediatePropagation: vi.fn() };
  for (const type of ['pointerdown', 'pointerup', 'click']) documentListeners.get(type)!(next as unknown as Event);
  expect(next.preventDefault).not.toHaveBeenCalled();
});

it.each([false, true])('A15: keeps check and threat marks above the selected tile (web %s)', async webInk => {
  const container = stubDom(), { PaintedView } = await import('./PaintedView');
  const view = new PaintedView(container as unknown as HTMLElement, { webInk });
  const scene = (view as unknown as { scene: PaintedScene }).scene;
  Object.assign(scene, { foot: () => ({ x: 536, y: 918 }) });
  view.sync(fromFen('4r2k/8/8/8/8/8/8/4K3 w - - 0 1'));
  view.setSymbols(() => 'figure' as unknown as HTMLImageElement);
  view.highlight({ selected: 4, check: 4, checkers: webInk ? [] : undefined, threats: [{ from: 60, to: 4 }] });
  const calls: string[] = [];
  const ctx = new Proxy({
    fillRect(this: CanvasRenderingContext2D) { calls.push(String(this.fillStyle)); },
    fill(this: CanvasRenderingContext2D) { calls.push(String(this.fillStyle)); },
    stroke(this: CanvasRenderingContext2D) { calls.push(String(this.strokeStyle)); },
    createRadialGradient: () => ({ addColorStop() {}, toString: () => 'threat' }),
    drawImage: () => calls.push('figure'),
  } as Record<string, unknown>, { get: (target, key: string) => key in target ? target[key] : () => {} });
  decorate.mock.lastCall![0](ctx, scene, 'under');
  const tile = calls.indexOf('#d8aa43'), threat = calls.indexOf('threat');
  const ring = calls.indexOf(webInk ? '#c4501f' : '#b3261e'), figure = calls.indexOf('figure');
  expect(tile).toBeGreaterThanOrEqual(0);
  expect(threat).toBeGreaterThan(tile);
  expect(ring).toBeGreaterThan(tile);
  expect(figure).toBeGreaterThan(Math.max(threat, ring));
});
