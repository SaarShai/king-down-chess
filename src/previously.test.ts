import { afterEach, describe, expect, it } from 'vitest';
import { Game } from './game';
import { setRules } from './rules/engine';
import { fromFen } from './rules/setup';
import { previouslyPlayback, previouslyTurn } from './previously';

afterEach(() => setRules());

function played(fen: string, moves: string[]): Game {
  const game = new Game('RNBQKBNR');
  game.load(fromFen(fen));
  expect(game.playLan(moves)).toBe(moves.length);
  return game;
}

describe('Previously', () => {
  it('shows the friend move and your last move with the existing words', () => {
    const game = played('4k3/4p3/8/8/8/8/4P3/4K3 w - - 0 1', ['e2-e4', 'e7-e5']);
    expect(previouslyTurn(game.history, 0)).toEqual({
      from: 1, to: 2,
      line: 'Black pawn e7 to e5.',
      before: 'White pawn e2 to e4.',
    });
  });

  it('shows only the friend line in the first link', () => {
    const game = played('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', ['e2-e4']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 0, to: 1, line: 'White pawn e2 to e4.', before: null,
    });
  });

  it('has no friend turn before a move or after your own move', () => {
    const game = played('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', []);
    expect(previouslyTurn(game.history, 0)).toBeNull();
    game.playLan(['e2-e4']);
    expect(previouslyTurn(game.history, 0)).toBeNull();
  });

  it('keeps both moves of the friend Haste turn', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const game = played('7k/8/8/r3r3/8/8/8/R5K1 b - - 0 1', ['Kh8-h7', 'Ra1xa5!H', 'Ra5xe5']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 1, to: 3,
      line: 'White rook a5 to e5, taking the rook on e5.', before: 'Black king h8 to h7.',
    });
  });

  it('keeps the free mark and the friend move', () => {
    setRules({ kings: [{ king: 'Frost', power: 'Freeze' }, null], markFree: true });
    const game = played('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', ['!F:d5', 'a2-a4']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 0, to: 2, line: 'White pawn a2 to a4.', before: null,
    });
  });

  it('uses the kept free-pass words after a friend mark', () => {
    setRules({ kings: [{ king: 'Frost', power: 'Freeze' }, null], markFree: true });
    const game = played('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', ['!F:d5', '--']);
    expect(previouslyTurn(game.history, 1)?.line).toBe('White ends the turn after the mark.');
  });

  it('keeps both moves of the friend Rage turn', () => {
    setRules({ hands: [['Rage'], []], hasteCaptures: false });
    const game = played('4k3/8/p7/8/8/8/8/R3K2n w - - 0 1', ['Ra1xa6!A', 'Ra6-h6']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 0, to: 2, line: 'White rook a6 to h6.', before: null,
    });
  });

  it('keeps both pieces of the friend Rally turn', () => {
    setRules({ hands: [['Rally'], []], hasteCaptures: false });
    const game = played('4k3/8/p7/8/8/2p5/8/RN2K3 w - - 0 1', ['Ra1-a5!J', 'Nb1-d2']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 0, to: 2, line: 'White knight b1 to d2.', before: null,
    });
  });

  it('plays the opened turn once', () => {
    const game = played('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', ['e2-e4']);
    const turn = previouslyTurn(game.history, 1);
    const options = { played: false, motion: true, reducedMotion: false, complete: true };
    const first = previouslyPlayback(turn, options);
    expect(first).toEqual({ play: true, seeAgain: true, played: true });
    expect(previouslyPlayback(turn, { ...options, played: first.played })).toEqual({
      play: false, seeAgain: true, played: true,
    });
  });

  it.each([
    { motion: false, reducedMotion: false },
    { motion: true, reducedMotion: true },
  ])('keeps the same line without replay when motion stops: %j', motion => {
    const game = played('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', ['e2-e4']);
    const turn = previouslyTurn(game.history, 1);
    const result = previouslyPlayback(turn, { ...motion, played: false, complete: true });
    expect(result).toEqual({ play: false, seeAgain: false, played: true });
    expect(turn?.line).toBe('White pawn e2 to e4.');
    expect(previouslyPlayback(turn, {
      played: result.played, motion: true, reducedMotion: false, complete: true,
    }).play).toBe(false);
  });

  it('does not replay a link that stops before an unread move', () => {
    const game = played('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', ['e2-e4']);
    const turn = previouslyTurn(game.history, 1);
    expect(previouslyPlayback(turn, {
      played: false, motion: true, reducedMotion: false, complete: false,
    })).toEqual({ play: false, seeAgain: false, played: true });
  });

  it('offers no replay without a friend turn', () => {
    expect(previouslyPlayback(null, {
      played: false, motion: true, reducedMotion: false, complete: true,
    })).toEqual({ play: false, seeAgain: false, played: true });
  });
});
