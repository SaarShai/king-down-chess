import { afterAll, expect, it, vi } from 'vitest';
import { checkFixtures } from '../../signals/fixtures';

// The material pass must be deterministic and leave the shared scene context intact.
function context(alpha = 1) {
  const calls: unknown[][] = [], stack: Record<string, unknown>[] = [];
  const initial = { globalAlpha: alpha, globalCompositeOperation: 'source-over', filter: 'none', fillStyle: '#123456' };
  let state: Record<string, unknown> = { ...initial };
  const record = (key: string, args: unknown[]) => {
    for (const value of args) if (typeof value === 'number') expect(Number.isFinite(value), key).toBe(true);
    calls.push([key, ...args]);
  };
  const ctx = new Proxy({}, {
    get(_, key: string) {
      if (key in state) return state[key];
      if (key === 'save') return () => stack.push({ ...state });
      if (key === 'restore') return () => { expect(stack.length).toBeGreaterThan(0); state = stack.pop()!; };
      if (key.startsWith('create')) return (...args: unknown[]) => { record(key, args); return { addColorStop: (...args: unknown[]) => record('colour', args) }; };
      return (...args: unknown[]) => record(key, args);
    },
    set(_, key: string, value) {
      if (typeof value === 'number') expect(Number.isFinite(value), key).toBe(true);
      if (key === 'globalAlpha') { expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(alpha); }
      state[key] = value; return true;
    },
  });
  return { ctx, calls, finish: () => { expect(stack).toHaveLength(0); expect(state).toEqual(initial); } };
}
const createCanvas = vi.fn(() => ({ width: 0, height: 0, getContext: () => context().ctx }));
vi.stubGlobal('document', { createElement: createCanvas });
const { drawPaintedShelter, drawPaintedBorrow } = await import('./paint.js');
afterAll(() => vi.unstubAllGlobals());

it('keeps the real shelter exception fixtures valid', () => checkFixtures());
it('keeps Mercy’s closed light lobe opposite the pawn in both board views', () => {
  // The authored field has its stronger lobe left of the figure (local x < 0).
  for (const pawnSide of [-1, 1]) for (const front of [false, true]) {
    const log = context();
    drawPaintedShelter(log.ctx, { x: 0, y: 240 }, { x: 0, y: 120 }, { progress: 1, reduced: true, front }, true, { x: pawnSide * 80, y: 40 });
    const mirror = log.calls.find(([key]) => key === 'scale')![1] as number;
    expect(-42 * mirror * pawnSide).toBeLessThan(0);
    log.finish();
  }
});
it('draws finite frames in both orientations and keeps reverse seek deterministic', () => {
  for (const flip of [false, true]) {
    const scene = { foot: (sq: number) => ({ x: flip ? 900 - sq * 5 : 60 + sq * 5, y: flip ? 80 + sq * 7 : 900 - sq * 7 }) };
    for (const id of ['holy-light', 'mercy', 'Control', 'Mimic']) {
      const draw = (p: number, reduced = false) => {
        const log = context(.37);
        for (const front of [false, true]) {
          if (id === 'holy-light' || id === 'mercy') drawPaintedShelter(log.ctx, scene.foot(12), scene.foot(19), Object.freeze({ progress: p, reduced, front }), id === 'mercy', scene.foot(26));
          else drawPaintedBorrow(log.ctx, scene, id, Object.freeze({ t: p, travel: p, lender: 0, move: Object.freeze({ from: 1, to: 25 }) }), front ? 'over' : 'under', []);
        }
        log.finish(); return log.calls;
      };
      const times = [0, .06, .15, .24, .41, .62, .8, .9, 1];
      const frames = times.map(p => draw(p));
      for (let i = times.length - 1; i >= 0; i--) expect(draw(times[i])).toEqual(frames[i]);
      if (id === 'holy-light' || id === 'mercy') {
        expect(draw(0)).toEqual([]);
        expect(draw(.9)).toEqual(draw(1));
        expect(draw(0, true)).toEqual(draw(1, true));
        expect(draw(1)).toEqual(draw(1, true));
      }
      else { expect(draw(0)).toEqual([]); expect(draw(1)).toEqual([]); }
    }
  }
});

it('reuses cached fields and bounds drawing on a zero-length move', () => {
  const canvases = createCanvas.mock.calls.length;
  const scene = { foot: () => ({ x: 120, y: 240 }) };
  for (const t of [.1, .3, .5, .7, .9]) {
    for (const id of ['Control', 'Mimic']) {
      const log = context(.37);
      drawPaintedBorrow(log.ctx, scene, id, { t, travel: t, lender: 0, move: { from: 1, to: 1 } }, 'over');
      expect(log.calls.filter(([key]) => key === 'drawImage').length).toBeLessThanOrEqual(6);
      expect(log.calls.filter(([key]) => key === 'fillRect').length).toBeLessThanOrEqual(5);
      log.finish();
    }
  }
  expect(createCanvas.mock.calls.length).toBe(canvases);
});
