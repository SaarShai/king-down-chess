import { afterEach, expect, it, vi } from 'vitest';
import * as pieces from '../rules/engine';
import { fromFen } from '../rules/setup';
import { dom } from './effects/view-harness';

const control = vi.hoisted(() => ({ prepare: vi.fn() }));
vi.mock('./painted/character-runtime.mjs', async importOriginal => {
  const actual = await importOriginal<typeof import('./painted/character-runtime.mjs')>();
  return { ...actual, prefetchCharacterIndex: () => {}, createCharacterRuntime: () => ({
    stats: { manifestPending: false }, ready: async () => {}, warm: async () => {},
    has: () => true, lacks: () => false, rest: () => null, reserveIdle: async () => false,
    releaseIdle() {}, releaseMovePrefetch() {}, prefetchMoves: async () => {}, dispose() {},
    prepare: control.prepare,
  }) };
});
import { createScene, type DaylightSceneHooks } from './painted/scene.mjs';

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

async function sceneWithRuntime(enabled: boolean) {
  const clock = dom();
  const scene = createScene({ canvas: clock.element() as unknown as HTMLCanvasElement, pieces, characterRuntime: enabled });
  await scene.load(); clock.advance(0); clock.advance(0);
  for (let i = 0; i < 8; i++) await Promise.resolve();
  scene.setPosition(fromFen('7k/8/8/8/8/8/8/KR6 w - - 0 1'));
  return { scene, advance: clock.advance };
}

it('calls movement start once when no preparation is needed', async () => {
  const { scene, advance } = await sceneWithRuntime(false), start = vi.fn();
  const running = scene.play({ from: 1, to: 9, captures: [] }, { onStart: start });
  expect(start).toHaveBeenCalledOnce(); advance(2000); await running;
  expect(start).toHaveBeenCalledOnce(); scene.dispose();
});

it('waits for preparation, and never starts a cancelled preparation', async () => {
  let release!: (value: null) => void;
  control.prepare.mockImplementation(() => new Promise(resolve => { release = resolve; }));
  const { scene, advance } = await sceneWithRuntime(true), start = vi.fn();
  const running = scene.play({ from: 1, to: 9, captures: [] }, { onStart: start });
  expect(control.prepare).toHaveBeenCalled(); expect(start).not.toHaveBeenCalled();
  release(null); for (let i = 0; i < 8; i++) await Promise.resolve(); expect(start).toHaveBeenCalledOnce();
  advance(2000); await running; expect(start).toHaveBeenCalledOnce();
  const cancelled = scene.play({ from: 1, to: 9, captures: [] }, { onStart: start });
  scene.cancel(); await cancelled; release(null);
  for (let i = 0; i < 8; i++) await Promise.resolve();
  expect(start).toHaveBeenCalledOnce(); scene.dispose();
});

it('holds the contact frame and supplies the victim geometry to the interface', async () => {
  const clock = dom(), contact = vi.fn(() => true), sound = vi.fn();
  const victim = vi.fn<NonNullable<DaylightSceneHooks['onCaptureVictim']>>();
  class Rect { constructor(readonly x: number, readonly y: number, readonly width: number, readonly height: number) {} }
  vi.stubGlobal('DOMRectReadOnly', Rect);
  const canvas = { ...clock.element(), getBoundingClientRect: () => ({ left: 10, top: 20, width: 480 }) } as unknown as HTMLCanvasElement;
  const hold = vi.fn(() => scene.pause());
  const scene = createScene({ canvas, pieces, headroom: 64, daylight: { hold, onCaptureContact: contact, onCaptureVictim: victim } });
  await scene.load();
  scene.setPosition(fromFen('7k/8/8/8/8/8/1p6/KR6 w - - 0 1'));
  const moving = scene.play({ from: 1, to: 9, captures: [9] }, { onContact: sound });
  clock.advance(1000);
  expect(contact).toHaveBeenCalledExactlyOnceWith(9, true);
  expect(victim).toHaveBeenCalledExactlyOnceWith(9, 'pawn', 'black', expect.any(Number), new Rect(82, 404, 56, 56), expect.any(Function));
  expect(sound).toHaveBeenCalledExactlyOnceWith(true);
  expect(hold).toHaveBeenCalledExactlyOnceWith(55);
  const at = scene.actionElapsed;
  clock.advance(55);
  expect(scene.actionElapsed).toBe(at);
  expect(scene.animating).toBe(true);
  const replace = victim.mock.calls[0][5], frames = scene.frames;
  expect(replace()).toBe(true);
  clock.advance(0);
  expect(scene.frames).toBe(frames + 1);
  expect(scene.actionElapsed).toBe(at);
  scene.resume();
  clock.advance(2000);
  await expect(moving).resolves.toBe(true);
  expect(replace()).toBe(false);
  expect(contact).toHaveBeenCalledOnce();
  scene.dispose();
});

it('keeps the default 55 ms hold after contact and clears it on skip', async () => {
  const clock = dom(), timeOut = vi.fn(() => 77), clear = vi.fn();
  vi.stubGlobal('setTimeout', timeOut);
  vi.stubGlobal('clearTimeout', clear);
  const scene = createScene({ canvas: clock.element() as unknown as HTMLCanvasElement, pieces, daylight: {} });
  await scene.load();
  scene.setPosition(fromFen('7k/8/8/8/8/8/1p6/KR6 w - - 0 1'));
  const moving = scene.play({ from: 1, to: 9, captures: [9] });
  clock.advance(1000);
  expect(timeOut).toHaveBeenCalledWith(expect.any(Function), 55);
  expect(scene.actionElapsed).toBe(900);
  clock.advance(30);
  expect(scene.actionElapsed).toBe(900);
  scene.cancel();
  await expect(moving).resolves.toBe(false);
  expect(clear).toHaveBeenCalledWith(77);
  clock.advance(20);
  expect(scene.time).toBe(1020);
  scene.dispose();
});

it('fires the king fall hook once at impact on the scene clock', async () => {
  const { scene, advance } = await sceneWithRuntime(false), impact = vi.fn();
  scene.setFallen(0, true, -1.5, .5, impact);
  advance(219);
  expect(impact).not.toHaveBeenCalled();
  scene.pause(); advance(55);
  expect(impact).not.toHaveBeenCalled();
  scene.resume(); advance(1);
  expect(impact).toHaveBeenCalledExactlyOnceWith(0);
  advance(1000);
  expect(impact).toHaveBeenCalledOnce();
  scene.setFallen(0, false, -1.5, .5, impact);
  advance(1000);
  expect(impact).toHaveBeenCalledOnce();
  scene.dispose();
});
