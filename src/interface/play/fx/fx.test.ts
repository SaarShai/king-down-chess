import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { burst, ease, edgeLight, hold, later, onFrame, pulse, setFxMotion, setPauseHook, setVibration, shake, sound, Spring, startFx, streak, tween } from './index';

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

it('draws all primitives on one canvas and clears it when Motion goes off', () => {
  const append = vi.fn();
  const drawing = {
    setTransform: vi.fn(), clearRect: vi.fn(), save: vi.fn(), restore: vi.fn(),
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    setLineDash: vi.fn(), roundRect: vi.fn(), ellipse: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };
  const canvas = { getContext: vi.fn(() => drawing), setAttribute: vi.fn(), style: {}, width: 0, height: 0 };
  const element = { style: { translate: '5px' }, getBoundingClientRect: () => ({ left: 7, top: 9, width: 108, height: 44 }) } as HTMLElement;
  const arrive = vi.fn();
  vi.stubGlobal('document', { createElement: vi.fn(() => canvas), body: { append } });
  vi.stubGlobal('window', { innerWidth: 390, innerHeight: 844, devicePixelRatio: 2, scrollX: 0, scrollY: 0 });
  vi.stubGlobal('getComputedStyle', () => ({ borderTopLeftRadius: '50%' }));

  streak({ x: 7, y: 8 }, { x: 180, y: 250 }, { ms: 32, onArrive: arrive });
  edgeLight(element, { reverse: true });
  burst('dust', { x: 10, y: 20 }, { count: 3 });
  burst('sparks', { x: 4, y: 20 }, { count: 2 });
  const firstShake = shake(element, { amplitude: 2 });
  advance(16);
  expect(append).toHaveBeenCalledExactlyOnceWith(canvas);
  expect(drawing.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
  expect(drawing.roundRect).toHaveBeenCalledWith(7, 9, 108, 44, 22);
  expect(drawing.ellipse).toHaveBeenCalledTimes(3);
  expect(drawing.stroke.mock.calls.length).toBeGreaterThan(6);
  expect(element.style.translate).not.toBe('5px');
  expect(arrive).not.toHaveBeenCalled();

  hold(55);
  advance(32);
  expect(arrive).not.toHaveBeenCalled();
  advance(39);
  expect(arrive).toHaveBeenCalledOnce();
  firstShake.cancel();
  expect(element.style.translate).toBe('5px');
  shake(element);
  advance(10);
  setFxMotion('off', false);
  expect(element.style.translate).toBe('5px');
  expect(pending.size).toBe(0);
  expect(drawing.clearRect).toHaveBeenLastCalledWith(0, 0, 390, 844);
});

it('uses the specified browser patterns and cancels vibration when the switch goes off', () => {
  const vibrate = vi.fn(() => true);
  vi.stubGlobal('navigator', { vibrate });
  setVibration(true);
  for (const cue of ['tick', 'light', 'medium', 'heavy', 'success', 'warn', 'error', 'refuse'] as const) pulse(cue);
  setVibration(false);
  pulse('light');
  expect(vibrate.mock.calls).toEqual([[10], [15], [25], [35], [[30, 60, 40]], [[35, 95, 30]], [[25, 35, 25, 35, 40]], [[25, 35, 25]], [0]]);
});

it('calls native Haptics on time and drops its remaining pulses when turned off', () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  const vibrate = vi.fn(async (_options: { duration: number }) => {});
  vi.stubGlobal('window', { Capacitor: { Plugins: { Haptics: { vibrate } } } });
  vi.stubGlobal('navigator', { vibrate: vi.fn() });
  try {
    setVibration(true);
    pulse('error');
    vi.advanceTimersByTime(60);
    expect(vibrate.mock.calls).toEqual([[{ duration: 25 }], [{ duration: 25 }]]);
    setVibration(false);
    vi.advanceTimersByTime(120);
    expect(vibrate).toHaveBeenCalledTimes(2);
    expect(navigator.vibrate).not.toHaveBeenCalled();
  } finally { vi.useRealTimers(); }
});
