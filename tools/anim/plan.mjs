/** Frame timing and recursive midpoint plan for one bank. */

export const DEFAULT_FRAME_MS = 15;
export const MAX_FRAMES = 64;

/**
 * Uniform key spacing. `--timing` may set durationMs and frameMs; the keys sit at equal gaps. Each gap must be a
 * power-of-two multiple of frameMs, because the midpoint recursion halves one interval at a time.
 */
export function planTiming(timing, keyCount, { frameMs = DEFAULT_FRAME_MS, durationMs } = {}) {
  if (!Number.isSafeInteger(keyCount) || keyCount < 1) throw Error('A bank needs at least one key frame');
  const step = timing?.frameMs ?? frameMs;
  if (!Number.isFinite(step) || step <= 0) throw Error('frameMs must be a positive number');
  const total = timing?.durationMs ?? durationMs ?? (keyCount === 1 ? step : (keyCount - 1) * 4 * step);
  if (!Number.isFinite(total) || total <= 0) throw Error('durationMs must be a positive number');
  if (Math.abs(total / step - Math.round(total / step)) > 1e-9) throw Error(`durationMs ${total} is not a multiple of frameMs ${step}`);
  const frameCount = Math.round(total / step) + 1;
  if (frameCount > MAX_FRAMES) throw Error(`A bank of ${frameCount} frames is over the ${MAX_FRAMES}-frame limit`);
  if (keyCount === 1) {
    if (frameCount < 1) throw Error('A hold bank needs at least one frame');
    return { frameMs: step, durationMs: total, frameCount, keyIndexes: [0], steps: null, hold: true };
  }
  const gaps = keyCount - 1;
  const span = frameCount - 1;
  if (span % gaps) throw Error(`Frame count ${frameCount} does not split evenly across ${gaps} key gaps`);
  const steps = span / gaps;
  if (!Number.isInteger(steps) || (steps & (steps - 1)) !== 0) throw Error(`Each key gap needs a power-of-two number of steps; got ${steps}. Choose durationMs or frameMs so that (durationMs/frameMs)/${gaps} is 1, 2, 4 or 8.`);
  if (frameCount < keyCount) throw Error('Frame timing gives fewer frames than keys');
  const keyIndexes = Array.from({ length: keyCount }, (_, index) => index * steps);
  return { frameMs: step, durationMs: total, frameCount, keyIndexes, steps, hold: false };
}

/** Interval midpoints in pre-order: a parent is always listed before the children that read it. */
export function midpointPlan(keyIndexes) {
  const out = [];
  const visit = (lo, hi) => {
    if (hi - lo <= 1) return;
    if ((hi - lo) % 2) throw Error(`Cannot halve the gap ${lo}..${hi}; the gap is not a power-of-two width`);
    const mid = (lo + hi) / 2;
    out.push({ index: mid, left: lo, right: hi, t: (mid - lo) / (hi - lo) });
    visit(lo, mid);
    visit(mid, hi);
  };
  for (let index = 0; index < keyIndexes.length - 1; index++) visit(keyIndexes[index], keyIndexes[index + 1]);
  return out;
}

export function timeOf(index, plan) {
  return Math.round(index * plan.frameMs * 1000) / 1000;
}

/** A steady 15 ms step reads as the shipped 120 ms turn: 9 frames at 0, 15, ... 120 ms. */
export function describePlan(plan) {
  return { frameMs: plan.frameMs, durationMs: plan.durationMs, frameCount: plan.frameCount, keyIndexes: plan.keyIndexes, steps: plan.steps, hold: plan.hold };
}
