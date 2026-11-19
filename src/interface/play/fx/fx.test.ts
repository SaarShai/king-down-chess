import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ease, hold, later, onFrame, setFxMotion, setPauseHook, sound, Spring, startFx, streak, tween } from './index';

let now: number, id: number, pending: Map<number, FrameRequestCallback>;

function advance(ms: number): void {
  now += ms;
  const callbacks = [...pending.values()];
  pending.clear();
  for (const callback of callbacks) callback(now);
}

beforeEach(() => {
  now = 0; id = 0; pending = new Map();
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { pending.set(++id, callback); return id; });
  vi.stubGlobal('cancelAnimationFrame', (key: number) => pending.delete(key));
  setFxMotion('normal', false);
});
afterEach(() => {
  setPauseHook();
  setFxMotion('off', false);
  vi.unstubAllGlobals();
});

describe('Daylight clock', () => {
  it('shares one frame clock and sleeps after the last cue', () => {
    const frames = vi.fn(), end = vi.fn(), cue = vi.fn();
    onFrame(frames, end);
    later(20, cue);
    expect(pending.size).toBe(1);
    advance(12);
    expect(frames).toHaveBeenCalledWith(12, expect.any(Number));
    expect(cue).not.toHaveBeenCalled();
    advance(8);
    expect(cue).toHaveBeenCalledOnce();
    setFxMotion('off', false);
    expect(end).toHaveBeenCalledOnce();
    expect(pending.size).toBe(0);
  });

  it('holds both frame effects and timed cues with one scene pause', () => {
    const frames = vi.fn(), cue = vi.fn(), pause = vi.fn();
    setPauseHook(pause);
    const effect = onFrame(frames);
    later(10, cue);
    hold(55);
    advance(30);
    expect(frames).not.toHaveBeenCalled();
    expect(pause.mock.calls).toEqual([[true]]);
    hold(40);
    advance(20);
    advance(20);
    expect(frames).not.toHaveBeenCalled();
    expect(pause.mock.calls).toEqual([[true], [false]]);
    advance(10);
    expect(frames).toHaveBeenCalledWith(10, expect.any(Number));
    expect(cue).toHaveBeenCalledOnce();
    effect.cancel();
    advance(10);
    expect(pending.size).toBe(0);
  });

  it.each([['off', false], ['normal', true]] as const)('shows the end state and plays its cue at once (%s, %s)', (pace, reduce) => {
    const draw = vi.fn(), play = vi.fn();
    startFx(play);
    const arrival = vi.fn(() => sound('arrive'));
    tween(200, draw, { done: () => sound('ting') });
    setFxMotion(pace, reduce);
    streak({ x: 0, y: 0 }, { x: 4, y: 8 }, { onArrive: arrival }).finish();
    hold(55);
    expect(draw.mock.calls).toEqual([[1, 1]]);
    expect(arrival).toHaveBeenCalledOnce();
    expect(play.mock.calls).toEqual([['ting', undefined], ['arrive', undefined]]);
    expect(pending.size).toBe(0);
  });

  it('uses the agreed curves and a spring that settles at its target', () => {
    expect(ease.out3(.5)).toBe(.875);
    expect(ease.EASE(.5)).toBeCloseTo(.946, 3);
    expect(ease.OVER(.7)).toBeGreaterThan(1);
    const spring = new Spring(0, 420, 26);
    spring.to = 21;
    expect(spring.step(16)).toBeGreaterThan(0);
    expect(spring.step(1000)).toBe(21);
    expect(spring.still).toBe(true);
  });
});
