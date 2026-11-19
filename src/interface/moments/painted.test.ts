import { beforeEach, expect, it, vi } from 'vitest';
import { playBow, playCollapse, type CollapseTarget } from './painted';

const { load, playFrames } = vi.hoisted(() => ({ load: vi.fn(), playFrames: vi.fn() }));
vi.mock('./art', () => ({ createArtLoader: () => load }));
vi.mock('./frame-player', () => ({ playFrames }));

function fixture(motion: CollapseTarget['motion'] = 'normal') {
  let draw!: (elapsed: number) => void;
  const stop = vi.fn(), onReady = vi.fn();
  const clock = vi.fn((step: typeof draw) => { draw = step; return stop; });
  const target: CollapseTarget = {
    layer: {} as HTMLElement, measure: () => ({ x: 0, y: 0, width: 50, height: 50, bodyHeight: 80 }),
    motion, onReady, clock, from: { image: {} as HTMLCanvasElement, rect: { x: 0, y: -30, width: 50, height: 80 } },
  };
  const player = { draw: vi.fn(), remove: vi.fn() };
  playFrames.mockReturnValue(player);
  return { target, player, onReady, stop, clock, at: (time: number) => draw(time) };
}
beforeEach(() => {
  vi.resetAllMocks();
  load.mockImplementation(async (key: string) => ({ bank: { ms: key.startsWith('bow/') ? 1400 : 1100 } }));
});

it.each(['normal', 'fast'] as const)('uses the reference collapse times in %s motion', async motion => {
  const f = fixture(motion);
  const divisor = motion === 'fast' ? 2 : 1;
  const playback = playCollapse('pawn', 'black', f.target);
  expect(load).toHaveBeenCalledWith('collapse/pawn/black');
  expect(f.onReady).not.toHaveBeenCalled();
  await Promise.resolve();
  expect(f.onReady).toHaveBeenCalledOnce();
  expect(f.player.draw).toHaveBeenLastCalledWith(0, 1, f.target.from, 0);
  f.at(60 / divisor);
  expect(f.player.draw).toHaveBeenLastCalledWith(60, 1, f.target.from, .5);
  f.at(120 / divisor);
  expect(f.player.draw).toHaveBeenLastCalledWith(120, 1, f.target.from, 1);
  f.at(1500 / divisor);
  expect(f.player.draw).toHaveBeenLastCalledWith(1500, 1, f.target.from, 1);
  f.at(1625 / divisor);
  expect(f.player.draw).toHaveBeenLastCalledWith(1625, .5, f.target.from, 1);
  expect(f.player.remove).not.toHaveBeenCalled();
  f.at(1750 / divisor);
  await expect(playback.finished).resolves.toBe('finished');
  expect(f.player.draw).toHaveBeenLastCalledWith(1750, 0, f.target.from, 1);
  expect(f.player.remove).toHaveBeenCalledOnce();
  expect(f.stop).toHaveBeenCalledOnce();
});

it.each(['bishop', 'archer'])('dissolves the first pose of %s', async piece => {
  const f = fixture(), playback = playCollapse(piece, 'white', f.target);
  await Promise.resolve();
  expect(f.player.draw).toHaveBeenLastCalledWith(0, 1, f.target.from, 0);
  playback.dispose();
  await expect(playback.finished).resolves.toBe('cancelled');
});

it('starts a knight with the full first pose and can skip the rest exactly once', async () => {
  const f = fixture(), playback = playCollapse('knight', 'white', f.target);
  await Promise.resolve();
  expect(f.player.draw).toHaveBeenLastCalledWith(0, 1, undefined, 1);
  playback.skip();
  playback.skip();
  await expect(playback.finished).resolves.toBe('finished');
  expect(f.onReady).toHaveBeenCalledOnce();
  expect(f.player.remove).toHaveBeenCalledOnce();
});

it.each(['clock', 'skip'] as const)('holds the last bow pose after %s until disposal', async end => {
  const f = fixture(), playback = playBow('frost', 'black', f.target);
  await Promise.resolve();
  expect(load).toHaveBeenCalledWith('bow/frost/black');
  f.at(1399);
  expect(f.stop).not.toHaveBeenCalled();
  if (end === 'clock') f.at(1400);
  else playback.skip();
  await expect(playback.finished).resolves.toBe('finished');
  expect(f.player.draw.mock.lastCall?.slice(0, 1)).toEqual([1400]);
  expect(f.player.remove).not.toHaveBeenCalled();
  expect(f.stop).toHaveBeenCalledOnce();
  playback.dispose();
  playback.dispose();
  expect(f.player.remove).toHaveBeenCalledOnce();
});

it('ends a reduced collapse without loading and draws only the last bow pose', async () => {
  const f = fixture('reduce');
  await expect(playCollapse('pawn', 'white', f.target).finished).resolves.toBe('finished');
  expect(load).not.toHaveBeenCalled();
  expect(f.onReady).toHaveBeenCalledOnce();
  const bow = playBow('spirit', 'white', f.target);
  await expect(bow.finished).resolves.toBe('finished');
  expect(f.clock).not.toHaveBeenCalled();
  expect(f.player.draw).toHaveBeenCalledExactlyOnceWith(1400);
  bow.dispose();
});

it('reports missing art and keeps the original pose available to the caller', async () => {
  const f = fixture();
  load.mockRejectedValue(Error('offline'));
  await expect(playCollapse('pawn', 'white', f.target).finished).resolves.toBe('not-ready');
  await expect(playBow('frost', 'white', f.target).finished).resolves.toBe('not-ready');
  expect(playFrames).not.toHaveBeenCalled();
  expect(f.onReady).not.toHaveBeenCalled();
});

it('never mounts late art after a pending effect is skipped or disposed', async () => {
  const f = fixture();
  const collapse = playCollapse('pawn', 'white', f.target);
  const bow = playBow('frost', 'white', f.target);
  const abandoned = playBow('mud', 'black', f.target);
  collapse.skip();
  bow.skip();
  abandoned.dispose();
  await expect(collapse.finished).resolves.toBe('finished');
  await expect(bow.finished).resolves.toBe('not-ready');
  await expect(abandoned.finished).resolves.toBe('cancelled');
  expect(f.onReady).toHaveBeenCalledOnce();
  expect(playFrames).not.toHaveBeenCalled();
});
