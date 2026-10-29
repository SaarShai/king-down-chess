import { afterEach, describe, expect, it, vi } from 'vitest';
import { Game } from '../game';
import type { BoardView } from '../render/PaintedView';
import { connectPreviously } from './previously';

afterEach(() => vi.unstubAllGlobals());

describe('game-link loading', () => {
  it.each([false, true])('keeps a Haste draw without a pass (extra move: %s)', extra => {
    const game = new Game(undefined, { kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const fen = '7k/p7/8/8/8/8/8/R5K1 w - - 99 1';
    const ended = new Game(undefined, game.rules);
    ended.load(ended.context.fromFen(fen));
    expect(ended.playLan(['Ra1-a4!H'])).toBe(1);
    const alert = vi.fn();
    vi.stubGlobal('alert', alert);
    const previously = connectPreviously({} as HTMLButtonElement, {
      game: () => game, view: {} as BoardView, generation: () => 0, navigation: () => 0,
      motion: () => false, blocked: () => false, show: vi.fn(), refresh: vi.fn(),
    });
    previously.load(new URLSearchParams({ fen, moves: extra ? 'Ra1-a4!H_Ra4-a5' : 'Ra1-a4!H' }), 0);
    expect(game.history.map(h => h.lan)).toEqual(['Ra1-a4!H']);
    expect(game.pos).toEqual(ended.pos);
    expect(game.pos).toMatchObject({ turn: 0, halfmove: 100 });
    expect(game.status).toBe('draw50');
    if (extra) expect(alert).toHaveBeenCalledWith('Part of this game link could not be read; the game stops before that move.');
    else expect(alert).not.toHaveBeenCalled();
  });
});
