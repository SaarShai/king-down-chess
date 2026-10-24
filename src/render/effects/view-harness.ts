import { vi } from 'vitest';
import { PaintedView } from '../PaintedView';
import type { PaintedScene } from '../../../docs/2d-first-pieces/board/scene.mjs';

// Test helper for the effect tests (card.test.ts, motion-concepts.test.ts). Call vi.unstubAllGlobals() after each test.
/** The real scene runs on a controlled frame clock. No production timer is replaced by a sample player. */
export function dom(reduced = false) {
  let now = 0, id = 0;
  const raf = new Map<number, FrameRequestCallback>(), docEvents = new Map<string, () => void>();
  const ctx = new Proxy({} as CanvasRenderingContext2D, {
    get(target, key) {
      if (Reflect.has(target, key)) return Reflect.get(target, key);
      if (key === 'measureText') return () => ({ width: 1 });
      if (key === 'getImageData' || key === 'createImageData') return (_x: number, _y: number, w = 1, h = 1) => ({ data: new Uint8ClampedArray(Math.max(1, w * h) * 4) });
      return () => ctx;
    },
    set(target, key, value) { Reflect.set(target, key, value); return true; },
  });
  const element = () => ({ width: 960, height: 1024, style: {}, classList: { add() {}, toggle() {} }, getContext: () => ctx, appendChild() {}, addEventListener() {}, getBoundingClientRect: () => ({ width: 960, height: 1024 }), getClientRects: () => [1] });
  const doc = { createElement: element, hidden: false, addEventListener: (name: string, fn: () => void) => docEvents.set(name, fn) };
  const media = { matches: reduced, addEventListener: (_: string, fn: () => void) => docEvents.set('reduced', fn) };
  vi.stubGlobal('document', doc);
  vi.stubGlobal('Path2D', class {});
  vi.stubGlobal('DOMMatrix', class { scale() { return this; } translate() { return this; } });
  vi.stubGlobal('setTimeout', () => 0);
  vi.stubGlobal('clearTimeout', () => {});
  vi.stubGlobal('Image', class { width = 1152; height = 1152; naturalWidth = 1152; complete = true; onload?: () => void; set src(_: string) { queueMicrotask(() => this.onload?.()); } decode() { return Promise.resolve(); } });
  vi.stubGlobal('matchMedia', () => media);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => { raf.set(++id, fn); return id; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => raf.delete(id));
  const advance = (ms: number) => { now += ms; const tasks = [...raf.values()]; raf.clear(); tasks.forEach(fn => fn(now)); };
  return { element, doc, media, docEvents, advance };
}
export async function viewBoard(reduced = false) {
  const clock = dom(reduced), view = new PaintedView(clock.element() as unknown as HTMLElement);
  for (let i = 0; i < 12; i++) await Promise.resolve();
  clock.advance(0); await view.ready();
  return { ...clock, view, scene: (view as unknown as { scene: PaintedScene }).scene };
}

