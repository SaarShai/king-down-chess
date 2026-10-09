import { describe, expect, it } from 'vitest';
import { defaultSetup, newGameWarning, kingsOf, parseSetup, playersOf, powersOn, setupOfGame, withKing, withMode } from './new-game';
import { powerOptions } from './powers-ui';

describe('New game setup', () => {
  it('starts as Play the computer: White against the Club computer, Spirit and Shadow with no power', () => {
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
    // Back to Play the computer: no powers, whatever the picker holds.
    expect(kingsOf(withMode(mud, 'computer'))).toEqual([null, null]);
  });

  it('a chosen power survives a return to the same mode; a king pressed again keeps its power', () => {
    const s = withMode(defaultSetup(), 'powers');
    s.picks[0].power = 'Mercy';
    expect(withMode(withMode(s, 'computer'), 'powers').picks[0].power).toBe('Mercy');
    expect(withKing(s, 0, 'Spirit').picks[0].power).toBe('Mercy');
  });

  it('Two players: both sides are people; the Kings\' powers box turns the picker on', () => {
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

// W1 supplies the handed-over end state in phase 2.
describe('New game warn line', () => {
  it('names the move of the game that Start ends', () => {
    expect(newGameWarning({ moves: 8, move: 5, ended: false })).toBe('This ends your game at move 5.');
  });
});

it('a staged end still warns until the turn is handed over', () => {
  expect(newGameWarning({ moves: 7, move: 4, ended: false })).toBe('This ends your game at move 4.');
  expect(newGameWarning({ moves: 7, move: 4, ended: true })).toBe('');
});

it('a game with no moves needs no warn line', () => {
  expect(newGameWarning({ moves: 0, move: 1, ended: false })).toBe('');
});

it('keeps a remembered example army for More', () => {
  expect(parseSetup({ ...defaultSetup(), army: 'MMSSNBNK' })?.army).toBe('MMSSNBNK');
});
