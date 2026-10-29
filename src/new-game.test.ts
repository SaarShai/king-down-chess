import { describe, expect, it } from 'vitest';
import { defaultSetup, newGamePowerLine, newGameWarning, kingsOf, parkedLinkPlayers, parseSetup, playersOf, powersOn, rematchPlayers, setupOfGame, withKing, withMode } from './new-game';
import { PRESETS, designCode, fromPreset } from './workshop/model';
import { powerOptions } from './powers-ui';
import { Game } from './game';
import { CLASSIC_CHESS, toLan } from './rules/setup';
import { turnEnded } from './turn';

describe('New game setup', () => {
  it('starts as Artificial: White against the Club computer, Spirit and Shadow with no power', () => {
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
    // Back to Artificial: no powers, whatever the picker holds.
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
    // Pass-and-play is parked (docs/PARKED.md): an old two-person save gives a setup against the computer.
    expect(setupOfGame(['human', 'human'], [null, { king: 'Mud', power: 'Leap' }], 'club')).toMatchObject({ mode: 'powers', twoPowers: false });
    expect(setupOfGame(['human', 'human'], [null, null], 'club')).toMatchObject({ mode: 'computer', twoPowers: false });
  });

  it('reads a remembered pass-and-play setup as a game against the computer (parked)', () => {
    const two = withMode(defaultSetup(), 'two', true);
    expect(parseSetup(JSON.parse(JSON.stringify(two)))).toMatchObject({ mode: 'powers', twoPowers: false });
    expect(parseSetup(JSON.parse(JSON.stringify(withMode(defaultSetup(), 'two'))))).toMatchObject({ mode: 'computer', twoPowers: false });
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

it('the sheet splits power rules into sentences without changing their conditions', () => {
  expect(newGamePowerLine('Holy Light (always on)', 'enemy pawns cannot take your king; your pieces beside, in front of or behind it cannot be taken'))
    .toBe('Holy Light (always on). Enemy pawns cannot take your king. Your pieces beside, in front of or behind it cannot be taken.');
  expect(newGamePowerLine('Freeze (1 use)', 'freeze an enemy piece (not the king), then make your move: the frozen piece cannot move on its next turn'))
    .toBe('Freeze (1 use). Freeze an enemy piece (not the king). Then make your move. The frozen piece cannot move on its next turn.');
});

describe('a remembered setup from a parked feature (docs/PARKED.md)', () => {
  const rook = { ...fromPreset(PRESETS.find(p => p.key === 'rook')!), name: 'My Rook', letter: 'Y' };

  it('opens a parked army as Random and keeps Random and Chess', () => {
    for (const army of ['daily', 'custom', 'ogre', 'MMSSNBNK', 'COAQNRBK', 'nope']) expect(parseSetup({ ...defaultSetup(), army })?.army).toBe('random');
    expect(parseSetup({ ...defaultSetup(), army: 'classic' })?.army).toBe('classic');
    expect(parseSetup({ ...defaultSetup(), army: 'random' })?.army).toBe('random');
  });

  it('drops a "Bring a design" choice and keeps the rest of the setup', () => {
    const old = { ...defaultSetup(), mode: 'two', twoPowers: true, design: designCode(rook) };
    // Pass-and-play is parked too: Mode `two` with Kings' powers opens as a game against the computer with powers.
    expect(parseSetup(old)).toEqual({ ...defaultSetup(), mode: 'powers', twoPowers: false });
  });
});

it('keeps old level values and maps the three menu stops', async () => {
  const { MENU_LEVELS, LEVEL_NAMES, menuLevel, levelPosition } = await import('./level-ui');
  expect(MENU_LEVELS.map(level => LEVEL_NAMES[level])).toEqual(['Casual','Clever','Club']);
  expect(MENU_LEVELS).toEqual(['beginner','casual','club']);
  for (const level of [...MENU_LEVELS, 'strong'] as const) expect(parseSetup({ ...defaultSetup(), level })?.level).toBe(level);
  expect(menuLevel('strong')).toBe('club'); expect(LEVEL_NAMES.strong).toBe('Strong'); expect(levelPosition('strong')).toBe(2);
});

describe('parked pass-and-play and game link (docs/PARKED.md)', () => {
  it('a rematch of a two-person game is against the computer; other rematches swap the sides', () => {
    expect(rematchPlayers(['human', 'human'])).toEqual(['ai', 'human']);
    expect(rematchPlayers(rematchPlayers(['human', 'human']))).toEqual(['human', 'ai']);
    expect(rematchPlayers(['human', 'ai'])).toEqual(['ai', 'human']);
    expect(rematchPlayers(['ai', 'human'])).toEqual(['human', 'ai']);
  });

  it("a saved link game seats the computer on the friend's side", () => {
    expect(parkedLinkPlayers(0)).toEqual(['human', 'ai']);
    expect(parkedLinkPlayers(1)).toEqual(['ai', 'human']);
  });
});
