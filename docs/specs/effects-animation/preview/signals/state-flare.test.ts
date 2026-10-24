import { describe, expect, it } from 'vitest';
import { drawGuard, drawShelter, drawSwap } from '../../../../../src/render/effects/state-flare';
import { drawArcherFocus } from '../../../../../src/render/effects/archer-flare';
import { checkFixtures } from './fixtures';

// This records the drawing contract without browser or figure art dependencies.
function context() {
  const calls: unknown[][] = [], stack: Record<string, unknown>[] = [];
  let state: Record<string, unknown> = { globalAlpha: 1 };
  const record = (name: string, args: unknown[]) => {
    for (const arg of args) if (typeof arg === 'number') expect(Number.isFinite(arg), name).toBe(true);
    calls.push([name, ...args]);
  };
  const ctx = new Proxy({}, {
    get(_target, name: string) {
      if (name in state) return state[name];
      if (name === 'save') return () => { stack.push({ ...state }); record(name, []); };
      if (name === 'restore') return () => { expect(stack.length, 'balanced context').toBeGreaterThan(0); state = stack.pop()!; record(name, []); };
      if (name.startsWith('create')) return (...args: unknown[]) => { record(name, args); return { addColorStop: (...stops: unknown[]) => record('colour', stops) }; };
      return (...args: unknown[]) => record(name, args);
    },
    set(_target, name: string, value) {
      if (typeof value === 'number') expect(Number.isFinite(value), name).toBe(true);
      if (name === 'globalAlpha') { expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(1); }
      state[name] = value; record(name, [typeof value === 'object' ? 'gradient' : value]); return true;
    },
  }) as CanvasRenderingContext2D;
  return { ctx, calls, finish: () => { expect(stack).toHaveLength(0); expect(ctx.globalAlpha).toBe(1); } };
}

const IDs = ['guard', 'holy-light', 'mercy', 'swap', 'archer'] as const;
function draw(id: typeof IDs[number], progress: number, reduced = false, flipped = false) {
  const log = context(), source = Object.freeze({ x: flipped ? 690 : 270, y: flipped ? 430 : 760 });
  const target = Object.freeze({ x: flipped ? 580 : 380, y: flipped ? 540 : 650 });
  const pair = Object.freeze({ x: flipped ? 250 : 710, y: source.y });
  for (const front of [false, true]) {
    const frame = Object.freeze({ progress, reduced, front });
    if (id === 'guard') drawGuard(log.ctx, target, frame);
    else if (id === 'swap') drawSwap(log.ctx, source, pair, frame);
    else if (id === 'archer') {
      drawArcherFocus(log.ctx, source, source, progress, front, reduced, true);
      drawArcherFocus(log.ctx, target, source, progress, front, reduced);
    } else drawShelter(log.ctx, source, target, frame, id === 'mercy');
  }
  log.finish(); return log.calls;
}

describe('state material studies', () => {
  it('keeps real fixture captures, shelter exceptions and the swap result', () => checkFixtures());
  it('draws finite deterministic frames and leaves context and inputs intact', () => {
    for (const id of IDs) for (const flipped of [false, true]) for (const p of [0, .04, .12, .22, .32, .42, .56, .7, 1]) {
      expect(draw(id, p, false, flipped)).toEqual(draw(id, p, false, flipped));
    }
  });
  it('settles into one quiet state after onset in both board directions', () => {
    for (const id of IDs) for (const flipped of [false, true]) expect(draw(id, .7, false, flipped)).toEqual(draw(id, 1, false, flipped));
  });
  it('keeps a stable reduced-motion result', () => {
    for (const id of IDs) for (const flipped of [false, true]) expect(draw(id, .42, true, flipped)).toEqual(draw(id, .9, true, flipped));
  });
  it('keeps Guard plates stable on reverse seek, after .65 and at every reduced progress', () => {
    const times = [0, .04, .12, .22, .32, .48, .65, .7, 1];
    for (const flipped of [false, true]) {
      const frames = times.map(p => draw('guard', p, false, flipped));
      for (let i = times.length - 1; i >= 0; i--) expect(draw('guard', times[i], false, flipped)).toEqual(frames[i]);
      expect(draw('guard', .65, false, flipped)).toEqual(frames.at(-1));
      for (const p of times) expect(draw('guard', p, true, flipped)).toEqual(draw('guard', 1, true, flipped));
    }
  });
});
