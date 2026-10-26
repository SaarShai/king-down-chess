import { describe, expect, it } from 'vitest';
import { defaultSetup, dialogSetup, newGamePowerLine, newGameWarning, kingsOf, parseSetup, playersOf, powersOn, refusal, setupOfGame, withDesign, withKing, withMode } from './new-game';
import { PRESETS, designCode, fromPreset } from './workshop/model';
import { powerOptions } from './powers-ui';
import { Game } from './game';
import { CLASSIC_CHESS, toLan } from './rules/setup';
import { turnEnded } from './turn';

describe('New game setup', () => {
  it('starts as Computer: White against the Club computer, Spirit and Shadow with no power', () => {
    const s = defaultSetup();
    expect([s.mode, s.level, s.side, s.army]).toEqual(['computer', 'club', 0, 'random']);
    expect(s.picks).toEqual([{ king: 'Spirit', power: null }, { king: 'Shadow', power: null }]);
    expect(playersOf(s)).toEqual(['human', 'ai']);
    expect(kingsOf(s)).toEqual([null, null]); // no powers: the rules' kings stay plain
  });

  it('Kings\' powers gives each king its first power; No power stays possible', () => {
    const s = withMode(defaultSetup(), 'powers');
    expect(kingsOf(s)).toEqual([{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }]);
    expect(playersOf(s)).toEqual(['human', 'ai']);
    const mud = withKing(s, 0, 'Mud');
    expect(mud.picks[0]).toEqual({ king: 'Mud', power: 'March' });
    expect(s.picks[0].king).toBe('Spirit'); // the setup is copied, not changed
    mud.picks[1].power = null;
    expect(kingsOf(mud)).toEqual([{ king: 'Mud', power: 'March' }, null]);
    // Back to Computer: no powers, whatever the picker holds.
    expect(kingsOf(withMode(mud, 'computer'))).toEqual([null, null]);
  });

  it('a chosen power survives a return to the same mode; a king pressed again keeps its power', () => {
    const s = withMode(defaultSetup(), 'powers');
    s.picks[0].power = 'Mercy';
    expect(withMode(withMode(s, 'computer'), 'powers').picks[0].power).toBe('Mercy');
    expect(withKing(s, 0, 'Spirit').picks[0].power).toBe('Mercy');
  });

  it('A friend: both sides are people; the Kings\' powers box turns the picker on', () => {
    const two = withMode(defaultSetup(), 'two');
    expect(playersOf(two)).toEqual(['human', 'human']);
    expect(powersOn(two)).toBe(false);
    expect(kingsOf(two)).toEqual([null, null]);
    const boxed = withMode(two, 'two', true);
    expect(kingsOf(boxed)).toEqual([{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'DeathTouch' }]);
  });

  it('the person may play Black against the computer', () => {
    expect(playersOf({ ...defaultSetup(), side: 1 })).toEqual(['ai', 'human']);
  });

  it('reads an older saved game as a setup', () => {
    expect(setupOfGame(['ai', 'human'], [null, null], 'strong')).toMatchObject({ mode: 'computer', side: 1, level: 'strong' });
    const powered = setupOfGame(['human', 'ai'], [{ king: 'Frost', power: 'IceWall' }, null], 'club');
    expect(powered.mode).toBe('powers');
    expect(powered.picks).toEqual([{ king: 'Frost', power: 'IceWall' }, { king: 'Shadow', power: null }]);
    expect(setupOfGame(['human', 'human'], [null, { king: 'Mud', power: 'Leap' }], 'club')).toMatchObject({ mode: 'two', twoPowers: true });
  });

  it('accepts only a whole, valid remembered setup', () => {
    const s = withKing(withMode(defaultSetup(), 'powers'), 1, 'Flame');
    expect(parseSetup(JSON.parse(JSON.stringify(s)))).toEqual(s);
    expect(parseSetup(null)).toBeNull();
    expect(parseSetup({ ...s, mode: 'solo' })).toBeNull();
    expect(parseSetup({ ...s, level: 'grandmaster' })).toBeNull();
    expect(parseSetup({ ...s, picks: [{ king: 'Frost', power: 'Haste' }, s.picks[1]] })).toBeNull(); // Haste is Flame's
  });

  it('the picker shows the official count and one-line rule of each power', () => {
    const frost = powerOptions().find(g => g.king === 'Frost')!.options;
    expect(frost.map(o => o.label)).toEqual(['Freeze (1 per game)', 'Ice Wall (2 per game)']);
    expect(frost[0].title).toBe('freeze an enemy piece (not the king), then make your move: the frozen piece cannot move on its next turn');
    expect(powerOptions().map(g => g.king)).toEqual(['Frost', 'Flame', 'Stratus', 'Mud', 'Spirit', 'Shadow']);
  });
});

const play = (game: Game, ...lans: string[]): Game => {
  for (const lan of lans) game.play(game.legal.find(m => toLan(game.pos, m) === lan)!);
  return game;
};

describe('New game warn line', () => {
  it('names the move at the handed-over turn boundary', () => {
    const game = play(new Game(CLASSIC_CHESS), 'f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4');
    expect(newGameWarning(game, 3, turnEnded(game, 3))).toBe('This ends your game at move 2.');
  });

  it('stops warning when the final turn is handed over', () => {
    const game = play(new Game(CLASSIC_CHESS), 'f2-f3', 'e7-e5', 'g2-g4', 'Qd8-h4');
    expect(turnEnded(game, 3)).toBe(false);
    expect(newGameWarning(game, 4, turnEnded(game, 4))).toBe('');
  });

  it('shows no warning before the first move', () => {
    const game = new Game(CLASSIC_CHESS);
    expect(newGameWarning(game, 0, turnEnded(game, 0))).toBe('');
  });

  it('shows no warning after resignation', () => {
    const game = play(new Game(CLASSIC_CHESS), 'e2-e4', 'e7-e5');
    expect(newGameWarning(game, 2, turnEnded(game, 2, 0))).toBe('');
  });
});

it('keeps a remembered example army for More', () => {
  expect(parseSetup({ ...defaultSetup(), army: 'MMSSNBNK' })?.army).toBe('MMSSNBNK');
});

it('the sheet splits power rules into sentences without changing their conditions', () => {
  expect(newGamePowerLine('Holy Light (always on)', 'enemy pawns cannot take your king; your pieces beside, in front of or behind it cannot be taken'))
    .toBe('Holy Light (always on). Enemy pawns cannot take your king. Your pieces beside, in front of or behind it cannot be taken.');
  expect(newGamePowerLine('Freeze (1 use)', 'freeze an enemy piece (not the king), then make your move: the frozen piece cannot move on its next turn'))
    .toBe('Freeze (1 use). Freeze an enemy piece (not the king). Then make your move. The frozen piece cannot move on its next turn.');
});

describe('Bring a design (ticket 17)', () => {
  const rook = { ...fromPreset(PRESETS.find(p => p.key === 'rook')!), name: 'My Rook', letter: 'Y' };
  const late = { ...rook, name: 'Late Rook', rules: [{ when: { on: 'fromMove' as const, n: 10 as const }, does: { a: 'movesLike' as const, as: 'knight' as const } }] };

  it('a setup from before "Bring a design" has none; a playable design code is kept; any other is dropped', () => {
    const { design: _, ...old } = defaultSetup();
    expect(parseSetup(old)?.design).toBeNull();
    expect(parseSetup({ ...defaultSetup(), design: designCode(rook) })?.design).toBe(designCode(rook));
    expect(parseSetup({ ...defaultSetup(), design: designCode(late) })?.design).toBeNull();
    expect(parseSetup({ ...defaultSetup(), design: 'nope' })?.design).toBeNull();
  });

  it('says why a design cannot play yet: a When that counts moves or cards', () => {
    expect(refusal(rook)).toBe('');
    expect(refusal(late)).toBe('a rule counts moves or cards');
    expect(refusal({ ...rook, lines: [], squares: [] })).toBe('it has no move'); // review 17, item 1: its code does not parse
  });

  it('puts the design in place of the piece nearest its worth, never the king, the left one on a tie', () => {
    expect(withDesign(CLASSIC_CHESS, 3.2)).toBe('RNTQKBNR');
    expect(withDesign(CLASSIC_CHESS, 9)).toBe('RNBTKBNR');
    expect(withDesign(CLASSIC_CHESS, 4.5)).toBe('TNBQKBNR');
    expect(withDesign('KQQQQQQQ', 0)).toBe('KTQQQQQQ');
    expect(withDesign('RTBQKBNR', 3)).toBe('RTBQKBNR'); // one design: a custom back rank that holds it already
  });
});

it('keeps old level values and maps the three menu stops', async () => {
  const { MENU_LEVELS, LEVEL_NAMES, menuLevel, levelPosition } = await import('./level-ui');
  expect(MENU_LEVELS.map(level => LEVEL_NAMES[level])).toEqual(['Casual','Clever','Club']);
  expect(MENU_LEVELS).toEqual(['beginner','casual','club']);
  for (const level of [...MENU_LEVELS, 'strong'] as const) expect(parseSetup({ ...defaultSetup(), level })?.level).toBe(level);
  expect(menuLevel('strong')).toBe('club'); expect(LEVEL_NAMES.strong).toBe('Strong'); expect(levelPosition('strong')).toBe(2);
});

it('opens a computer setup when the saved game has two local players', () => {
  const saved = withMode(defaultSetup(), 'two', true);
  expect(dialogSetup(saved).mode).toBe('powers');
  expect(dialogSetup({ ...saved, twoPowers: false }).mode).toBe('computer');
  expect(saved.mode).toBe('two');
});
