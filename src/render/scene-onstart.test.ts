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
import { createScene } from './painted/scene.mjs';

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
