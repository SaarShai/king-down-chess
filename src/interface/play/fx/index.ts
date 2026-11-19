import type { Pace } from '../../board-api';
import { ease } from './curves';

export { ease, Spring } from './curves';

export type Curve = (progress: number) => number;
export type Point = { x: number; y: number };
export type SoundName = 'tick' | 'press' | 'ting' | 'clink' | 'knock' | 'impact' | 'whoosh' | 'pass'
  | 'arrive' | 'ice' | 'fire' | 'wind' | 'rewind' | 'no' | 'lift' | 'mark' | 'check';
export type SoundOptions = { piece?: number; king?: import('../../../rules/engine').KingName; volume?: number; pitch?: number };
export type PulseKind = 'tick' | 'light' | 'medium' | 'heavy' | 'success' | 'warn' | 'error' | 'refuse';
export type Effect = { cancel(): void; finish(): void };

type Step = (deltaMs: number, timeMs: number) => false | void;
type TweenOptions = { curve?: Curve; done?: () => void };
type StreakOptions = { ms?: number; width?: number; bend?: number; curve?: Curve; onArrive?: () => void };
type EdgeOptions = { ms?: number; width?: number; reverse?: boolean };
type BurstOptions = { ms?: number; count?: number; rise?: number };
type ShakeOptions = { ms?: number; amplitude?: number };
type SoundPlayer = (name: SoundName, options?: SoundOptions) => void;

const frames = new Map<Effect, Step>();
let request: number | undefined;
let time = 0, last = 0, held = 0;
let pace: Pace = 'normal', reduced = false;
let pauseScene: ((paused: boolean) => void) | undefined;
let playSound: SoundPlayer | undefined;
let vibration = true;

export function startFx(player: SoundPlayer): void { playSound = player; }
export function sound(name: SoundName, options?: SoundOptions): void { playSound?.(name, options); }
export function setVibration(on: boolean): void { vibration = on; }

const patterns: Record<PulseKind, number | number[]> = {
  tick: 10, light: 15, medium: 25, heavy: 35, success: [30, 60, 40],
  warn: [35, 95, 30], error: [25, 35, 25, 35, 40], refuse: [25, 35, 25],
};

export function pulse(kind: PulseKind): void {
  if (vibration) globalThis.navigator?.vibrate?.(patterns[kind]);
}

export function reducedMotion(): boolean { return reduced || pace === 'off'; }

export function setFxMotion(next: Pace, reduce: boolean): void {
  pace = next;
  reduced = reduce;
  if (!reducedMotion()) return;
  if (held) { held = 0; pauseScene?.(false); }
  for (const effect of [...frames.keys()]) effect.finish();
  if (request !== undefined) { cancelAnimationFrame(request); request = undefined; }
}

export function setPauseHook(hook?: (paused: boolean) => void): void {
  if (pauseScene === hook) return;
  if (held) pauseScene?.(false);
  pauseScene = hook;
  if (held) pauseScene?.(true);
}

function schedule(): void {
  if (request !== undefined || (!frames.size && !held)) return;
  request = requestAnimationFrame(frame);
}

function frame(stamp: number): void {
  const elapsed = Math.max(0, stamp - last);
  last = stamp;
  const paused = Math.min(elapsed, held);
  if (held) {
    held -= paused;
    if (!held) pauseScene?.(false);
  }
  const delta = Math.min(34, elapsed - paused) * (pace === 'fast' ? 2 : 1);
  time += delta;
  if (delta > 0) {
    for (const [effect, step] of [...frames]) {
      if (frames.has(effect) && step(delta, time) === false) effect.finish();
    }
  }
  request = undefined;
  schedule();
}

function wake(): void {
  if (request === undefined) last = performance.now();
  schedule();
}

export function hold(ms: number): void {
  if (reducedMotion() || ms <= 0) return;
  const wasHeld = held > 0;
  held = Math.max(held, ms);
  wake();
  if (!wasHeld) pauseScene?.(true);
}

export function onFrame(step: Step, end?: () => void): Effect {
  let active = true;
  const effect: Effect = {
    cancel() { active = false; frames.delete(effect); },
    finish() {
      if (!active) return;
      effect.cancel();
      end?.();
    },
  };
  if (reducedMotion()) effect.finish();
  else { frames.set(effect, step); wake(); }
  return effect;
}

export function tween(ms: number, draw: (value: number, progress: number) => void, options: TweenOptions = {}): Effect {
  let elapsed = 0;
  const { curve = ease.out3, done } = options;
  const end = () => { draw(curve(1), 1); done?.(); };
  const effect = onFrame(delta => {
    elapsed += delta;
    if (elapsed >= ms) return false;
    const progress = elapsed / ms;
    draw(curve(progress), progress);
  }, end);
  if (ms <= 0) effect.finish();
  return effect;
}

export function later(ms: number, run: () => void): Effect {
  let remaining = ms;
  const effect = onFrame(delta => { remaining -= delta; if (remaining <= 0) return false; }, run);
  if (ms <= 0) effect.finish();
  return effect;
}

export function at(element: Element, x = .5, y = .5): Point {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width * x, y: box.top + box.height * y };
}

// The API is ready for callers. The drawing pass adds the canvas and these effects.
export function streak(_from: Point, _to: Point, { ms = 360, onArrive }: StreakOptions = {}): Effect {
  return later(ms, () => onArrive?.());
}
export function edgeLight(_element: Element, { ms = 420 }: EdgeOptions = {}): Effect { return later(ms, () => {}); }
export function burst(_kind: 'sparks' | 'dust', _point: Point, { ms = 350 }: BurstOptions = {}): Effect { return later(ms, () => {}); }
export function shake(_element: HTMLElement, { ms = 220 }: ShakeOptions = {}): Effect { return later(ms, () => {}); }
