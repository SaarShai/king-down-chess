import { afterEach, describe, expect, it } from 'vitest';
import { Move, POWERS_BALANCED, Position, legalMoves, makeMove, parseSq, setRules } from './rules/engine';
import { KingChoice, PowerName } from './rules/rules';
import { fromFen, toLan } from './rules/setup';
import { describeMove, moveNumbers, nextMoveNumber, threatsIn } from './move-text';
import { offered } from './powers-ui';

const KING_OF: Partial<Record<PowerName, KingChoice['king']>> = {
  Freeze: 'Frost', IceWall: 'Frost', Haste: 'Flame', Flight: 'Stratus', Sacrifice: 'Stratus',
};
const powers = (white: PowerName): void => { setRules({ kings: [{ king: KING_OF[white]!, power: white }, null] }); };
const find = (pos: Position, lan: string): Move => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal`);
  return m;
};
const say = (pos: Position, lan: string): string => describeMove(pos, find(pos, lan));

afterEach(() => setRules());

describe('screen-reader lines for king powers', () => {
  it('names the side that spends the power, not the marked piece', () => {
    powers('Freeze');
    expect(say(fromFen('4k3/8/3p4/3n4/8/8/8/4K3 w - - 0 1'), '!F:d5')).toBe('White freezes the black knight on d5.');
    powers('IceWall');
    expect(say(fromFen('4k3/8/8/8/R7/8/2b5/4K3 w - - 0 1'), '!W:a4')).toBe('White puts an Ice Wall on the white rook on a4.');
  });

  it('says what Sacrifice brings back, and how Haste and Flight move', () => {
    powers('Sacrifice');
    const sac = fromFen('4k3/8/8/8/3b4/8/P1N5/4K3 w - - 0 1 lQr');
    const back = legalMoves(sac).find(m => m.power === 'sacrifice')!;
    expect(describeMove(sac, back)).toBe('White sacrifices the pawn on a2 and brings back a queen there.');

    powers('Haste');
    const pos = fromFen('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1');
    expect(say(pos, 'Ra1xa5!H')).toBe('White rook a1 to a5, taking the rook on a5, with Haste: the rook may move again.');
    const held = makeMove(pos, find(pos, 'Ra1xa5!H'));
    expect(say(held, '--')).toBe('White ends the turn without the Haste second move.');

    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] }); // a free Freeze: mark, then move or pass
    const marked = makeMove(fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'), find(fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'), '!F:d5'));
    expect(describeMove(marked, find(marked, '--'), true)).toBe('White ends the turn after the mark.');
    expect(say(marked, '--')).toBe('White ends the turn without the Haste second move.');

    powers('Flight');
    expect(say(fromFen('4k3/8/8/8/8/8/1P6/RN2K3 w - - 0 1 l'), 'Nb1~d3')).toBe('White knight flies from b1 to d3.');
  });

  it('keeps ordinary moves as before', () => {
    const pos = fromFen('4k3/8/8/8/8/8/4P3/4K3 w - - 0 1');
    expect(say(pos, 'e2-e4')).toBe('White pawn e2 to e4.');
  });
});

describe('threat markers', () => {
  it('still show during a Haste turn’s pending second move', () => {
    powers('Haste');
    const pos = fromFen('7k/8/8/r7/8/8/8/R5K1 w - - 0 1');
    const held = makeMove(pos, find(pos, 'Ra1-a4!H'));
    expect(held.haste).toBe(parseSq('a4'));
    expect(threatsIn(held).pieces).toContain(parseSq('a4')); // the black rook on a5 attacks it
    expect(threatsIn(held)).toEqual(threatsIn({ ...held, haste: undefined }));
  });
});

describe('move numbers', () => {
  it('number a Haste turn as one move', () => {
    expect(moveNumbers([0, 1, 0, 1])).toEqual([1, 1, 2, 2]);
    expect(moveNumbers([0, 0, 1, 0])).toEqual([1, 1, 1, 2]);   // White's Haste turn, then Black
    expect(moveNumbers([0, 1, 1, 0])).toEqual([1, 1, 1, 2]);   // Black's Haste turn
    expect(moveNumbers([1, 0, 1])).toEqual([1, 2, 2]);         // a game that starts with Black
  });

  it('give the move about to be played', () => {
    expect(nextMoveNumber([], 0)).toBe(1);
    expect(nextMoveNumber([0], 1)).toBe(1);
    expect(nextMoveNumber([0, 0], 0)).toBe(1);                 // Haste's second move is still move 1
    expect(nextMoveNumber([0, 0, 1], 0)).toBe(2);
  });
});

describe('which power moves a click can reach', () => {
  it('hides moves that need arming until their power is armed', () => {
    powers('Flight');
    const pos = fromFen('4k3/8/8/8/8/8/1P6/RN2K3 w - - 0 1 l');
    const flight = find(pos, 'Nb1~d3'), step = find(pos, 'Nb1-c3');
    expect(offered(flight, null)).toBe(false);
    expect(offered(flight, 'flight')).toBe(true);
    expect(offered(step, null)).toBe(true);
    expect(offered(step, 'flight')).toBe(false);
  });
});
