import { afterEach, describe, expect, it } from 'vitest';
import { Game } from './game';
import { P, R, G, A, O, type Move, setRules } from './rules/engine';
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
  it.each([[R, 'R', 'a rook'], [A, 'A', 'an archer'], [O, 'O', 'an ogre']])('names a Sacrifice for %s', (_, symbol, piece) => {
    setRules({ kings: [{ king: 'Stratus', power: 'Sacrifice' }, null] });
    const game = played(`4k3/8/8/8/8/8/P7/4K3 w - - 0 1 l${symbol}`, [`!S:a2=${symbol}`]);
    expect(previouslyTurn(game.history, 1)?.line).toBe(`they traded a pawn for ${piece}.`);
  });

  it.each([
    [{ from: 8, to: 8, captures: [], power: 'morph', promo: R }, 'their pawn became a rook.'],
    [{ from: 8, to: 8, captures: [], power: 'morphp', promo: 2 }, 'their pawn became a knight.'],
    [{ from: 8, to: 8, captures: [], power: 'ward' }, 'they shielded their pawn.'],
    [{ from: 8, to: 8, captures: [], power: 'rescue' }, 'they marked the pawn again.'],
    [{ from: 16, to: 16, captures: [], power: 'salvation', drop: R }, 'their rook returned on a3.'],
    [{ from: 16, to: 16, captures: [], drop: G }, 'their guard entered on a3.'],
    [{ from: 16, to: 16, captures: [], power: 'spawn', drop: P }, 'their pawn entered on a3.'],
    [{ from: 4, to: 4, captures: [], power: 'growth' }, 'they drew a card with Growth.'],
    [{ from: 4, to: 4, captures: [], power: 'firewall' }, 'their king used Firewall.'],
    [{ from: 4, to: 4, captures: [] }, 'their king stayed on e1.'],
  ] as [Move, string][])('names a stationary act or entry: %j', (move, line) => {
    const turn = previouslyTurn([{ pos: fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'), move, lan: '' }], 1)!;
    expect(turn.line).toBe(line);
    expect(turn.detail).not.toMatch(/undefined| to (a2|e1)/);
    expect(('Previously: ' + turn.line).split(/\s+/).length).toBeLessThanOrEqual(8);
  });

  it('names Rescue and its marked pawn in the detail', () => {
    const pos = fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
    const move: Move = { from: 8, to: 8, captures: [], power: 'rescue' };
    expect(previouslyTurn([{ pos, move, lan: '' }], 1)?.detail).toBe('Rescue puts the mark on the pawn on a2 again.');
  });

  it('names Rescue when its mark is now on an empty square', () => {
    setRules({ hands: [['Rescue'], []], markFree: true });
    const game = played('4k3/8/8/8/8/8/P7/4K3 w - - 0 1 md6w0', ['!D:d6']);
    expect(previouslyTurn(game.history, 1)).toMatchObject({
      line: 'they used Rescue.', detail: 'Rescue puts the mark on d6 again.',
    });
  });

  it.each([
    [{ from: 8, to: 8, captures: [], power: 'morph', promo: A }, 'their pawn became an archer.', 'Pawn a2 becomes archer with Morph.'],
    [{ from: 4, to: 4, captures: [], power: 'quake', pushes: [{ from: 8, to: 16 }] }, 'they pushed a pawn with Earth Quake.', 'Pushes pawn a2 to a3 with Earth Quake.'],
    [{ from: 4, to: 4, captures: [], power: 'growthb' }, 'they drew a card with Growth.', 'King e1 uses Growth.'],
    [{ from: 4, to: 4, captures: [], power: 'firestarter' }, 'their king used Fire Starter.', 'King e1 uses Fire Starter.'],
    [{ from: 16, to: 16, captures: [], power: 'spawnk2', drop: P, drop2: 17 }, 'their pawn entered on a3.', 'Pawn enters on a3 and b3 with Spawn.'],
  ] as [Move, string, string][])('uses player names and articles: %j', (move, line, detail) => {
    const turn = previouslyTurn([{ pos: fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'), move, lan: '' }], 1)!;
    expect(turn).toMatchObject({ line, detail });
    expect(('Previously: ' + turn.line).split(/\s+/).length).toBeLessThanOrEqual(8);
  });

  it('uses an before a pushed ogre', () => {
    const pos = fromFen('4k3/8/8/8/8/8/O7/4K3 w - - 0 1');
    const move: Move = { from: 4, to: 4, captures: [], power: 'quake', pushes: [{ from: 8, to: 16 }] };
    expect(previouslyTurn([{ pos, move, lan: '' }], 1)?.line).toBe('they pushed an ogre with Earth Quake.');
  });

  it('summarizes a link that starts with a held turn and a pass', () => {
    const game = new Game('RNBQKBNR');
    game.load({ ...fromFen('7k/8/8/8/8/R7/8/7K w - - 0 1'), haste: 16 });
    expect(game.playLan(['--'])).toBe(1);
    expect(previouslyTurn(game.history, 1)).toMatchObject({
      line: 'their rook stayed; the turn ended.', detail: 'End turn.',
    });
  });

  it('shows the main act and each turn in short words', () => {
    const game = played('4k3/4p3/8/8/8/8/4P3/4K3 w - - 0 1', ['e2-e4', 'e7-e5']);
    expect(previouslyTurn(game.history, 0)).toEqual({
      from: 1, to: 2,
      line: 'their pawn moved to e5.', detail: 'Pawn e7 to e5.',
      before: 'Pawn e2 to e4.',
    });
  });

  it('shows only the friend line in the first link', () => {
    const game = played('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1', ['e2-e4']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 0, to: 1, line: 'their pawn moved to e4.', detail: 'Pawn e2 to e4.', before: null,
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
      line: 'their rook took 2 pieces.', detail: 'Rook a1 takes a5 with Haste, then takes e5.', before: 'King h8 to h7.',
    });
  });

  it('counts every take in the friend Haste chain turn', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null], hasteCaptures: true });
    const game = played('k7/6pp/5pp1/3pp1pp/2nS3p/8/8/K7 b - - 0 1',
      ['Ka8-a7', 'Sd4xc4xd5xe5xf6!H', 'Sf6xg7xh7xg6xh5xg5xh4']);
    expect(previouslyTurn(game.history, 1)?.line).toBe('their beast took 10 pieces.');
  });

  it('keeps the free mark and the friend move', () => {
    setRules({ kings: [{ king: 'Frost', power: 'Freeze' }, null], markFree: true });
    const game = played('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', ['!F:d5', 'a2-a4']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 0, to: 2, line: 'their pawn moved to a4.', detail: 'Freeze on d5, then pawn a2 to a4.', before: null,
    });
  });

  it('names the mark and pass without rule text', () => {
    setRules({ kings: [{ king: 'Frost', power: 'Freeze' }, null], markFree: true });
    const game = played('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1', ['!F:d5', '--']);
    expect(previouslyTurn(game.history, 1)).toMatchObject({ line: 'they froze your knight.', detail: 'Freeze on d5, then end turn.' });
  });

  it.each(['rage', 'haste'] as const)('keeps %s on a stationary Archer take', power => {
    const pos = fromFen('7k/8/8/8/3A1p2/8/8/K7 w - - 0 1');
    const move: Move = { from: 27, to: 27, captures: [29], power };
    expect(previouslyTurn([{ pos, move, lan: '' }], 1)?.detail).toBe(`Archer d4 shoots f4 with ${power === 'rage' ? 'Rage' : 'Haste'}.`);
  });

  it('keeps the Reaver landing square after a take', () => {
    const pos = fromFen('7k/8/8/8/8/2p5/8/KV6 w - - 0 1');
    const move: Move = { from: 1, to: 27, captures: [18] };
    expect(previouslyTurn([{ pos, move, lan: '' }], 1)?.detail).toBe('Reaver b1 takes c3, to d4.');
  });

  it('keeps both moves of the friend Rage turn', () => {
    setRules({ hands: [['Rage'], []], hasteCaptures: false });
    const game = played('4k3/8/p7/8/8/8/8/R3K2n w - - 0 1', ['Ra1xa6!A', 'Ra6-h6']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 0, to: 2, line: 'their rook took your pawn.', detail: 'Rook a1 takes a6 with Rage, then to h6.', before: null,
    });
  });

  it('keeps both pieces of the friend Rally turn', () => {
    setRules({ hands: [['Rally'], []], hasteCaptures: false });
    const game = played('4k3/8/p7/8/8/2p5/8/RN2K3 w - - 0 1', ['Ra1-a5!J', 'Nb1-d2']);
    expect(previouslyTurn(game.history, 1)).toEqual({
      from: 0, to: 2, line: 'their knight moved to d2.', detail: 'Rook a1 to a5 with Rally, then knight b1 to d2.', before: null,
    });
  });

  it('names every bite in a long friend turn', () => {
    const game = played('7k/6p1/5p2/3pp3/2nS4/8/8/K7 b - - 0 1', ['Kh8-h7', 'Sd4xc4xd5xe5xf6']);
    expect(previouslyTurn(game.history, 1)?.detail).toBe('Beast d4 takes c4 and d5 and e5 and f6.');
  });

  it('keeps two Haste takes and a promotion', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null], hasteCaptures: true });
    const game = played('k6q/6r1/5P2/8/8/8/8/K7 b - - 0 1', ['Ka8-a7', 'f6xg7!H', 'g7xh8=Q']);
    expect(previouslyTurn(game.history, 1)?.detail).toBe('Pawn f6 takes g7 with Haste, then takes h8, becomes queen.');
  });

  it('keeps your whole Haste turn before the friend move', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const game = played('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1', ['Ra1xa5!H', 'Ra5xe5', 'Kh8-h7']);
    expect(previouslyTurn(game.history, 0)?.before).toBe('Rook a1 takes a5 with Haste, then takes e5.');
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
    expect(turn?.line).toBe('their pawn moved to e4.');
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
