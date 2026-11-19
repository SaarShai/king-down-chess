import { afterEach, expect, it, vi } from 'vitest';
import { GameRules } from '../../game-rules';
import type { PaintedView } from '../../render/PaintedView';
import { boardMoments } from './board-moments';
import type { LoadedPack } from './art';

const { load, playFrames } = vi.hoisted(() => ({ load: vi.fn(), playFrames: vi.fn() }));
vi.mock('./art', () => ({ createArtLoader: () => load }));
vi.mock('./frame-player', () => ({ playFrames }));

function fixture() {
  const requests = new Map<number, FrameRequestCallback>();
  let latest = 0, ready!: () => void, idle!: () => void;
  vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => { requests.set(++latest, frame); return latest; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => requests.delete(id));
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => { idle = callback; });
  const paint = () => {
    const frames = [...requests.values()]; requests.clear();
    for (const frame of frames) frame(0);
  };
  const view = {
    ready: () => new Promise<void>(resolve => { ready = resolve; }),
    time: 100,
    momentFigure: vi.fn(() => ({ x: 500, y: 500, bodyHeight: 84 })),
  };
  const layer = { getBoundingClientRect: () => ({ width: 480 }) };
  const board = boardMoments(layer as HTMLElement, view as unknown as PaintedView);
  const player = { draw: vi.fn(), remove: vi.fn() };
  playFrames.mockReturnValue(player);
  const rules = new GameRules(), position = rules.fromFen('7k/8/8/8/8/8/1p6/KR6 w - - 0 1');
  async function warm() { ready(); await Promise.resolve(); paint(); idle(); }
  return { board, rules, position, view, player, paint, warm };
}

afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); });

it('loads the figures on the board after paint and uses ready art at contact on scene time', async () => {
  load.mockResolvedValue({ bank: { ms: 1100 } } as LoadedPack);
  const { board, position, rules, view, player, warm, paint } = fixture();
  board.preload(position, rules);
  expect(load).not.toHaveBeenCalled();
  await warm();
  expect(load.mock.calls.map(([key]) => key)).toEqual([
    'bow/spirit/white', 'collapse/rook/white', 'collapse/pawn/black', 'bow/shadow/black',
  ]);
  const replace = vi.fn(() => true);
  board.capture(9, 'pawn', 'black', 'normal', replace);
  expect(replace).toHaveBeenCalledOnce();
  expect(view.momentFigure).toHaveBeenCalledWith(9, true);
  expect(playFrames.mock.calls[0][0].measure()).toEqual({ x: 250, y: 250, width: 0, height: 0, bodyHeight: 42 });
  expect(player.draw.mock.calls.at(-1)?.[0]).toBe(0);
  paint();
  expect(player.draw.mock.calls.at(-1)?.[0]).toBe(0);
  view.time = 1600; paint();
  expect(player.draw.mock.calls.at(-1)?.slice(0, 2)).toEqual([1500, 1]);
  board.skipCaptures();
  expect(player.remove).toHaveBeenCalledOnce();
});

it('leaves slow or missing banks to the scene and adopts a ready reduced bow immediately', async () => {
  let decode!: (pack: LoadedPack) => void;
  load.mockImplementation((key: string) => key === 'bow/shadow/black'
    ? new Promise<LoadedPack>(resolve => { decode = resolve; }) : Promise.reject(Error('missing')));
  const { board, position, rules, player, warm } = fixture();
  board.preload(position, rules);
  await warm();
  const replace = vi.fn(() => true);
  board.capture(9, 'pawn', 'black', 'normal', replace);
  expect(replace).not.toHaveBeenCalled();
  expect(board.bow(63, position.board[63], rules, 'normal')).toBeUndefined();
  decode({ bank: { ms: 1400 } } as LoadedPack);
  await Promise.resolve();
  expect(playFrames).not.toHaveBeenCalled();
  const bow = board.bow(63, position.board[63], rules, 'reduce');
  expect(player.draw).toHaveBeenCalledExactlyOnceWith(1400);
  await expect(bow?.finished).resolves.toBe('finished');
  expect(player.remove).not.toHaveBeenCalled();
  board.dispose();
  expect(player.remove).toHaveBeenCalledOnce();
});
