import type { Pace } from '../../board-api';
import { ease } from './curves';
import type { Effect, Step, TweenOptions } from './index';

const frames = new Map<Effect, Step>();
let request: number | undefined;
let time = 0, last = 0, holdUntil = 0;
let pace: Pace = 'normal', reduced = false;
let paint: (() => void) | undefined;
let pauseScene: ((paused: boolean) => void) | undefined;
export function reducedMotion(): boolean { return reduced || pace === 'off'; }

export function setFxMotion(next: Pace, reduce: boolean): void {
  pace = next;
  reduced = reduce;
  if (!reducedMotion()) return;
  if (holdUntil) { holdUntil = 0; pauseScene?.(false); }
  for (const effect of [...frames.keys()]) effect.finish();
  if (request !== undefined) { cancelAnimationFrame(request); request = undefined; }
}

export function setPauseHook(hook?: (paused: boolean) => void): void {
  if (pauseScene === hook) return;
  if (holdUntil) pauseScene?.(false);
  pauseScene = hook;
  if (holdUntil) pauseScene?.(true);
}

export function setPaintHook(hook: () => void): void { paint = hook; }

function schedule(): void {
  if (request !== undefined || (!frames.size && !holdUntil)) return;
  request = requestAnimationFrame(frame);
}

function frame(stamp: number): void {
  const elapsed = stamp - Math.max(last, holdUntil);
  last = stamp;
  if (holdUntil && stamp >= holdUntil) {
    holdUntil = 0;
    pauseScene?.(false);
  }
  const delta = Math.min(34, Math.max(0, elapsed)) * (pace === 'fast' ? 2 : 1);
  time += delta;
  if (delta > 0) {
    for (const [effect, step] of [...frames]) {
      if (frames.has(effect) && step(delta, time) === false) effect.finish();
    }
  }
  paint?.();
  request = undefined;
  schedule();
}

function wake(): void {
  if (request === undefined) last = performance.now();
  schedule();
}

export function hold(ms: number): void {
  if (reducedMotion() || ms <= 0) return;
  const wasHeld = holdUntil > 0;
  holdUntil = Math.max(holdUntil, performance.now() + ms);
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
