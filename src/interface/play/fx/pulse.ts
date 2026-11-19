import type { PulseKind } from './index';

const patterns: Record<PulseKind, number | number[]> = {
  tick: 10, light: 15, medium: 25, heavy: 35, success: [30, 60, 40],
  warn: [35, 95, 30], error: [25, 35, 25, 35, 40], refuse: [25, 35, 25],
};

type NativeHaptics = { vibrate(options: { duration: number }): Promise<void> };
type NativeWindow = Window & { Capacitor?: { Plugins?: { Haptics?: NativeHaptics } } };
const nativeTimers = new Set<ReturnType<typeof setTimeout>>();
let enabled = true, webVibration = false;

function clearNative(): void {
  for (const timer of nativeTimers) clearTimeout(timer);
  nativeTimers.clear();
}

export function setVibration(on: boolean): void {
  enabled = on;
  if (on) return;
  clearNative();
  if (webVibration) globalThis.navigator?.vibrate?.(0);
  webVibration = false;
}

export function pulse(kind: PulseKind): void {
  if (!enabled) return;
  const pattern = patterns[kind];
  const haptics = (globalThis.window as NativeWindow | undefined)?.Capacitor?.Plugins?.Haptics;
  if (haptics?.vibrate) {
    clearNative();
    const parts = Array.isArray(pattern) ? pattern : [pattern];
    const vibrate = async (duration: number) => {
      try { await haptics.vibrate({ duration }); } catch { /* Native vibration is optional. */ }
    };
    let delay = 0;
    for (let i = 0; i < parts.length; i += 2) {
      const duration = parts[i];
      if (delay) {
        const timer = setTimeout(() => { nativeTimers.delete(timer); void vibrate(duration); }, delay);
        nativeTimers.add(timer);
      } else void vibrate(duration);
      delay += duration + (parts[i + 1] ?? 0);
    }
    return;
  }
  const navigator = globalThis.navigator;
  if (navigator?.userActivation?.hasBeenActive === false) return;
  webVibration = navigator?.vibrate?.(pattern) ?? false;
}
