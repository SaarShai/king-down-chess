import { afterEach, expect, it, vi } from 'vitest';
import { startCeremony } from './ceremony';
import { fromFen } from './rules/setup';

function setup(motion = true) {
  vi.useFakeTimers();
  const element = () => ({ hidden: false, className: '', textContent: '', append: vi.fn(), remove: vi.fn(), replaceChildren: vi.fn(), setAttribute: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), classList: { add: vi.fn(), remove: vi.fn() } });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('document', { hidden: false, createElement: element, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  const view = { skip: vi.fn(), sync: vi.fn(), setFallen: vi.fn(), animateMove: vi.fn() };
  const final = fromFen('7k/6Q1/6K1/8/8/8/8/8 b - - 0 1');
  const live = vi.fn(() => true);
  const control = startCeremony({ view, board: element(), captionHost: element(), moments: element(), history: [], final, king: 63, showPly: vi.fn(), motion, live } as unknown as Parameters<typeof startCeremony>[0]);
  return { control, view, final, live };
}
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it('shows the final board and one fall, then ends within 650 ms', async () => {
  const { control, view, final } = setup();
  expect(view.sync).toHaveBeenCalledExactlyOnceWith(final);
  expect(view.setFallen).toHaveBeenCalledExactlyOnceWith(63);
  await vi.advanceTimersByTimeAsync(650);
  expect(await control.done).toBe(true);
  expect(view.animateMove).not.toHaveBeenCalled();
});

it('skips the fall at once', async () => {
  const { control, view } = setup();
  control.skip();
  expect(await control.done).toBe(true);
  expect(view.setFallen).toHaveBeenLastCalledWith(63, false);
  expect(vi.getTimerCount()).toBe(0);
});

it('shows the final state at once with motion off', async () => {
  const { control, view } = setup(false);
  expect(await control.done).toBe(true);
  expect(view.setFallen).toHaveBeenLastCalledWith(63, false);
  expect(vi.getTimerCount()).toBe(0);
});

it('cancels an old fall without stopping the next game', async () => {
  const { control, view, live } = setup();
  live.mockReturnValue(false);
  control.cancel();
  expect(await control.done).toBe(false);
  expect(view.skip).not.toHaveBeenCalled();
});
