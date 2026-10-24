// F13: the board canvas stays hidden until the stone art is loaded and decoded, so no gold or page colour
// shows in its place; it appears in the frame that first draws stone and pieces.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromFen, toFen } from '../rules/setup';
import { Game } from '../game';
import { setRules } from '../rules/engine';
import type { PaintedScene } from '../../docs/2d-first-pieces/board/scene.mjs';
import { SHARED_MECHANICS, assertMechanicExpected } from '../../tools/fixtures/shared-mechanics';

const { reducedMotion, lively, aim, decorate, disposeScene, disconnectResize } = vi.hoisted(() => ({ reducedMotion: vi.fn(), lively: vi.fn(), aim: vi.fn(), decorate: vi.fn(), disposeScene: vi.fn(), disconnectResize: vi.fn() }));
let resolveLoad: () => void = () => {};
let pickedSquare: number | null = null;
vi.mock('../../docs/2d-first-pieces/board/scene.mjs', () => ({
  createScene: () => new Proxy({ load: () => new Promise<void>(r => { resolveLoad = r; }), dispose: disposeScene, squareAt: () => pickedSquare, kings: [], drawnKings: [], setReducedMotion: reducedMotion, setLively: lively, setAim: aim, setDecorate: decorate, animating: false, falling: false, PAD: 32, TILE: 112, cell: (sq: number) => ({col:sq % 8,row:7 - (sq >> 3)}) } as Record<string, unknown>,
    { get: (t, k: string) => k in t ? t[k] : () => {} }),
}));

const frames: FrameRequestCallback[] = [];
const listeners = new Map<string, EventListener>();
const documentListeners = new Map<string, EventListener>();
function stubDom() {
  const listen = (target: Map<string, EventListener>) => (name: string, listener: EventListener, options?: AddEventListenerOptions) => {
    target.set(name, listener);
    options?.signal?.addEventListener('abort', () => target.delete(name), { once: true });
  };
  const el = () => ({ style: {} as Record<string, string>, classList: { add() {}, toggle() {} },
    addEventListener: listen(listeners), appendChild() {}, getContext: () => new Proxy({}, { get: () => () => {} }), width: 0, height: 0,
    getClientRects: () => [1], getBoundingClientRect: () => ({ left: 0, top: 0, width: 960 }), setPointerCapture() {}, hasPointerCapture: () => true, releasePointerCapture() {} });
  vi.stubGlobal('document', { createElement: el, addEventListener: listen(documentListeners), hidden: false });
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: listen(documentListeners) }));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect = disconnectResize; });
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => frames.push(f));
  return el();
}
afterEach(() => { vi.unstubAllGlobals(); frames.length = 0; listeners.clear(); documentListeners.clear(); pickedSquare = null; vi.clearAllMocks(); setRules({}); });

describe('PaintedView first paint', () => {
  it('releases input, observers and scene work before a delayed artwork load finishes', async () => {
    const container = stubDom(), { PaintedView } = await import('./PaintedView');
    const view = new PaintedView(container as unknown as HTMLElement);
    expect(listeners.size).toBeGreaterThan(0); expect(documentListeners.size).toBeGreaterThan(0);
    view.dispose(); view.dispose();
    expect(listeners.size).toBe(0); expect(documentListeners.size).toBe(0);
    expect(disconnectResize).toHaveBeenCalledOnce(); expect(disposeScene).toHaveBeenCalledOnce();
    resolveLoad(); await view.ready();
    expect(frames).toHaveLength(0);
  });

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

it.each([false, true])('syncs the legal Earth Quake without a figure at its center (reduced motion %s)', async systemReduced => {
  const container = stubDom();
  vi.stubGlobal('Image', class { src = ''; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('matchMedia', () => ({ matches: systemReduced, addEventListener() {} }));
  const { PaintedView } = await import('./PaintedView');
  const { createScene } = await vi.importActual<typeof import('../../docs/2d-first-pieces/board/scene.mjs')>('../../docs/2d-first-pieces/board/scene.mjs');
  const scene = createScene({ canvas: document.createElement('canvas'), pieces: await import('../rules/engine') });
  scene.setReducedMotion(systemReduced);
  const view = new PaintedView(container as unknown as HTMLElement);
  (view as unknown as { scene: PaintedScene }).scene = scene;
  const fixture = SHARED_MECHANICS.find(row => row.id === 'card-earthquake')!;
  const game = new Game('RNBQKBNR', { hands: [fixture.setup.hand!, fixture.setup.hand!] });
  game.load(game.context.fromFen(fixture.setup.fen!)); view.setRules(game.context);
  const before = game.pos, move = game.legal.find(move => game.context.toLan(before, move) === fixture.actions[0])!;
  expect(move).toMatchObject({ power: 'quake', from: 27, to: 27 });
  expect(before.board[move.from]).toBe(0);
  const playing = vi.spyOn(scene, 'play').mockResolvedValue(true), synced = vi.spyOn(scene, 'setPosition');
  await expect(view.animateMove(before, move)).resolves.toBeUndefined();
  if (systemReduced) expect(playing).not.toHaveBeenCalled();
  else expect(playing).toHaveBeenCalledWith(move, expect.objectContaining({ effect: expect.anything() }));
  game.play(move); view.sync(game.pos);
  expect(synced).toHaveBeenLastCalledWith(game.pos);
  assertMechanicExpected({ fen: toFen(game.pos), rules: game.rules, turn: game.pos.turn, legal: game.legal.map(move => game.context.toLan(game.pos, move)) }, fixture.expected);
  view.dispose();
});

it('replaces the old Freeze image with the shared volume and draws its front after its row', async () => {
  const container = stubDom(), { PaintedView } = await import('./PaintedView');
  const { GameRules } = await import('../game-rules');
  const context = new GameRules({ kings: [{ king: 'Frost', power: 'Freeze' }, null] });
  const pos = context.fromFen('7k/8/8/4p3/8/8/P7/K7 w - - 0 1');
  const frozen = context.makeMove(pos, context.legalMoves(pos).find(m => m.power === 'freeze' && m.to === 36)!);
  const view = new PaintedView(container as unknown as HTMLElement);
  view.setRules(context); view.sync(frozen);
  const scene = (view as unknown as { scene: PaintedScene }).scene;
  Object.assign(scene, { foot: (sq: number) => ({ x: 32 + (sq % 8 + .5) * 112, y: 32 + (7 - (sq >> 3) + .8) * 112 }) });
  const draw = decorate.mock.lastCall![0], calls: string[] = [];
  const gradient = () => ({ addColorStop() {} });
  const ctx = new Proxy({ globalAlpha: 1, createLinearGradient: gradient, createRadialGradient: gradient,
    drawImage() { calls.push('image'); }, clip() { calls.push('ice'); }, roundRect() { calls.push('pip'); },
  } as Record<string, unknown>, { get: (target, key: string) => key in target ? target[key] : () => {} });
  draw(ctx, scene, 'under');
  expect(calls).toEqual(['ice']);
  calls.length = 0;
  for (let row = 0; row < 8; row++) {
    draw(ctx, scene, 'over', row);
    expect(calls.length).toBe(row < 3 ? 0 : 2);
  }
  expect(calls).toEqual(['ice', 'pip']);
  view.dispose();
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
    createLinearGradient: () => ({ addColorStop() {} }),
    drawImage: () => calls.push('figure'),
  } as Record<string, unknown>, { get: (target, key: string) => key in target ? target[key] : () => {} });
  decorate.mock.lastCall![0](ctx, scene, 'under');
  const tile = calls.indexOf('#d8aa43'), threat = calls.indexOf('threat');
  const ring = calls.indexOf('#b84d25'), figure = calls.indexOf('figure');
  expect(tile).toBeGreaterThanOrEqual(0);
  expect(threat).toBeGreaterThan(tile);
  expect(ring).toBeGreaterThan(tile);
  expect(figure).toBeGreaterThan(Math.max(threat, ring));
});

it('does not wake the scene for excluded marks and stops state work on hidden, Off and disposal', async () => {
  const container = stubDom(), { PaintedView } = await import('./PaintedView');
  const { fixtures } = await import('../../docs/specs/effects-animation/preview/signals/fixtures');
  const { StateEffects } = await import('./effects/states');
  const view = new PaintedView(container as unknown as HTMLElement);
  const { scene, stateEffects } = view as unknown as { scene: PaintedScene; stateEffects: InstanceType<typeof StateEffects> };
  const awake = vi.fn(); Object.assign(scene, { keepAwake: awake });
  view.highlight({ selected: 12, moves: [20, 28], captures: [21], last: [28], bites: [21], threats: [{ from: 36, to: 28 }] });
  expect(awake).not.toHaveBeenCalled();
  const f = fixtures.freeze;
  view.setRules(f.rules); view.sync(f.before); view.sync(f.after);
  expect(awake).toHaveBeenCalledOnce();
  (document as unknown as { hidden: boolean }).hidden = true;
  documentListeners.get('visibilitychange')!(new Event('visibilitychange'));
  expect(stateEffects.remaining(performance.now())).toBe(0);
  (document as unknown as { hidden: boolean }).hidden = false;
  documentListeners.get('visibilitychange')!(new Event('visibilitychange'));
  expect(stateEffects.remaining(performance.now())).toBe(0);
  view.setPace('off');
  expect(stateEffects.frames.every(frame => frame.since === -Infinity)).toBe(true);
  view.dispose();
  expect(stateEffects.frames).toEqual([]);
  awake.mockClear();
  view.sync(f.before); view.highlight({ hint: [1, 2] }); view.setPreview(2);
  expect(awake).not.toHaveBeenCalled();
  expect(stateEffects.remaining(performance.now())).toBe(0);
});

it('keeps the last-move wash static at different wall-clock times', async () => {
  const container = stubDom(), { PaintedView } = await import('./PaintedView');
  const view = new PaintedView(container as unknown as HTMLElement);
  const scene = (view as unknown as { scene: PaintedScene }).scene;
  view.sync(fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1'));
  view.highlight({ last: [16] });
  const draw = decorate.mock.lastCall![0];
  const record = (time: number) => {
    const clock = vi.spyOn(performance, 'now').mockReturnValue(time), calls: unknown[][] = [];
    const ctx = new Proxy({ globalAlpha: 1, fillRect(this: CanvasRenderingContext2D, ...box: number[]) { calls.push([this.fillStyle, ...box]); } } as Record<string, unknown>, { get: (target, key: string) => key in target ? target[key] : () => {} });
    draw(ctx, scene, 'under'); clock.mockRestore(); return calls;
  };
  expect(record(1)).toEqual([['#e6b84a6e', 32, 592, 112, 112]]);
  expect(record(1)).toEqual(record(9000));
  view.dispose();
});
