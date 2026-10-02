import { afterEach, describe, expect, it } from 'vitest';
import { POWERS_BALANCED, setRules } from './rules/rules';
import { powerText } from './powers-ui';

afterEach(() => setRules());

describe('power texts follow the rules in force', () => {
  it('reads the rulebook by default', () => {
    expect(powerText('Freeze')).toBe('as your move, freeze an enemy piece (not the king): it cannot move on its next turn');
    expect(powerText('HolyLight')).toBe('enemy pawns cannot take your king, and it cannot take pawns');
    expect(powerText('Strike')).toBe('move any piece except the king as if it were a queen');
  });

  it('names the balance-lab readings', () => {
    setRules({ markFree: true, freezeQuiet: true, strikePawns: false, strikeCaptures: false, hasteCaptures: false, holyLightTakesPawns: true, mercyCaptures: true, darknessKeep: true });
    expect(powerText('Freeze')).toBe('freeze an enemy piece (not the king), then make your move, which cannot capture: the frozen piece cannot move on its next turn');
    expect(powerText('Strike')).toBe('move any piece except a pawn or the king as if it were a queen, to an empty square');
    expect(powerText('Haste')).toBe('move one piece twice in one turn (the second move is optional); neither move captures');
    expect(powerText('HolyLight')).toBe('enemy pawns cannot take your king');
    expect(powerText('Mercy')).toBe('your king steps 1–2 squares and jumps your pieces (it takes only next to itself)');
    expect(powerText('Darkness')).toBe('your pawns may also step diagonally and take straight ahead');
  });

  it('reads the official kings’ powers rules', () => {
    setRules({ ...POWERS_BALANCED });
    expect(powerText('HolyLight')).toBe('enemy pawns cannot take your king; your pieces beside, in front of or behind it cannot be taken');
    expect(powerText('Mercy')).toBe('your king steps 1–2 squares and jumps your pieces, but takes only a guard; your pieces next to it cannot be taken');
  });
});
