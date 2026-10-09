import { afterEach, describe, expect, it } from 'vitest';
import { Move, Position, POWERS_BALANCED, inCheck, legalMoves, makeMove, parseSq, setRules } from './rules/engine';
import { KingChoice, PowerName } from './rules/rules';
import { fromFen, randomBackRank, startPosition, toLan } from './rules/setup';
import { checkCause, checkersOf, describeMove, moveNumbers, nextMoveNumber, threatsIn } from './move-text';
import { offered } from './powers-ui';
import { mulberry32 } from './sim/rng';

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

describe('check causes', () => {
  it('names the Archer screen, a clear shot, a knight and both checkers', () => {
    expect(checkCause(fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'))).toBe('Their archer can shoot over e2.');
    expect(checkCause(fromFen('7k/8/8/8/8/4a3/8/4K3 w - - 0 1'))).toBe('Their archer can shoot your king.');
    expect(checkCause(fromFen('7k/p7/8/8/8/5n2/8/4K3 w - - 0 1'))).toBe('Their knight attacks your king.');
    expect(checkCause(fromFen('4k3/8/8/8/8/5n2/8/4K2r w - - 0 1'))).toBe('Their rook and knight attack your king.');
  });

  it('names Strike only when it moves the checker', () => {
    setRules({ ...POWERS_BALANCED, kings: [null, { king: 'Flame', power: 'Strike' }] });
    const pre = fromFen('7k/8/8/8/8/a7/4P3/4K3 b - - 0 1');
    const strike = legalMoves(pre).find(m => m.power === 'strike' && m.from === parseSq('a3') && m.to === parseSq('e3'))!;
    expect(strike).toBeDefined();
    const pos = makeMove(pre, strike);
    expect(checkCause(pos, strike)).toBe('Strike lets their archer shoot over e2.');
    expect(checkCause(pos, { ...strike, to: parseSq('a3') })).toBe('Their archer can shoot over e2.');
  });

  it('has no cause when the rules prevent check', () => {
    const archer = fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1');
    setRules({ archerChecks: false });
    expect(checkCause(archer)).toBe('');
    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, null], holyLightKnights: true });
    expect(checkCause(fromFen('7k/p7/8/8/8/5n2/8/4K3 w - - 0 1'))).toBe('');
  });

  it('names both checkers and their paths in a double check', () => {
    const pos = fromFen('4k3/8/8/8/8/5n2/8/4K2r w - - 0 1');
    expect(checkersOf(pos)).toEqual([
      { sq: parseSq('h1'), king: parseSq('e1'), path: 'straight' },
      { sq: parseSq('f3'), king: parseSq('e1'), path: 'arc' },
    ]);
  });

  it('shows an arc for an Archer shot over a piece', () => {
    const pos = fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1');
    expect(checkersOf(pos)).toEqual([
      { sq: parseSq('e3'), king: parseSq('e1'), path: 'arc' },
    ]);
  });

  it('counts a frozen checker during a held turn', () => {
    powers('Freeze');
    const pos = fromFen('7k/8/8/8/8/8/8/4K2r w - - 0 1');
    expect(checkersOf({ ...pos, marks: [{ sq: parseSq('h1') }, undefined], free: true, haste: parseSq('e1') }))
      .toEqual([{ sq: parseSq('h1'), king: parseSq('e1'), path: 'straight' }]);
  });

  it('names the rook in a discovered check', () => {
    const pos = fromFen('4k3/8/8/8/8/8/4B3/4R2K w - - 0 1');
    expect(checkersOf(makeMove(pos, find(pos, 'Be2-f3'))))
      .toEqual([{ sq: parseSq('e1'), king: parseSq('e8'), path: 'straight' }]);
  });

  it('shows a paladin leap over a friend', () => {
    setRules({ paladinChecks: true });
    const pos = fromFen('7k/8/8/8/8/4l3/4p3/4K3 w - - 0 1');
    expect(checkersOf(pos)).toEqual([{ sq: parseSq('e3'), king: parseSq('e1'), path: 'arc' }]);
  });

  it('reads Holy Light and Darkness from the rules in force', () => {
    const knight = fromFen('7k/8/8/8/8/5n2/8/4K3 w - - 0 1');
    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, null], holyLightKnights: true });
    expect(checkersOf(knight)).toEqual([]);
    setRules({ ...POWERS_BALANCED, kings: [null, { king: 'Shadow', power: 'Darkness' }] });
    const pawn = fromFen('7k/8/8/8/8/8/4p3/4K3 w - - 0 1');
    expect(checkersOf(pawn)).toEqual([{ sq: parseSq('e2'), king: parseSq('e1'), path: 'straight' }]);
  });

  it('agrees with inCheck in seeded legal games under powers rules', () => {
    const pairs: [KingChoice, KingChoice][] = [
      [{ king: 'Spirit', power: 'HolyLight' }, { king: 'Shadow', power: 'Darkness' }],
      [{ king: 'Frost', power: 'Freeze' }, { king: 'Flame', power: 'Haste' }],
      [{ king: 'Stratus', power: 'Flight' }, { king: 'Stratus', power: 'Sacrifice' }],
      [{ king: 'Mud', power: 'March' }, { king: 'Mud', power: 'Leap' }],
      [{ king: 'Spirit', power: 'Mercy' }, { king: 'Shadow', power: 'DeathTouch' }],
      [{ king: 'Frost', power: 'IceWall' }, { king: 'Flame', power: 'Strike' }],
    ];
    const rng = mulberry32(705);
    let checks = 0;
    for (const kings of pairs) for (const paladinChecks of [false, true]) for (const archerChecks of [false, true]) {
      setRules({ ...POWERS_BALANCED, kings, paladinChecks, archerChecks, holyLightKnights: paladinChecks });
      let pos = startPosition(randomBackRank(rng));
      for (let ply = 0; ply < 64; ply++) {
        for (const turn of [0, 1] as const) {
          const list = checkersOf({ ...pos, turn });
          expect(list.length > 0).toBe(inCheck(pos, turn));
          checks += Number(list.length > 0);
        }
        const moves = legalMoves(pos);
        if (!moves.length) break;
        pos = makeMove(pos, moves[Math.floor(rng() * moves.length)]);
      }
    }
    expect(checks).toBeGreaterThan(0);
  }, 15000);
});

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

it('names both colours in a check on one device', () => {
  expect(checkCause(fromFen('7k/8/8/8/8/8/8/4K2r w - - 0 1'), undefined, 'device'))
    .toBe('The black rook attacks the white king.');
  expect(checkCause(fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'), undefined, 'device'))
    .toBe("Black archer shoots White's king over e2.");
});
it.each(['computer', 'link'] as const)('names the king and states the Archer fact in %s play', mode => {
  expect(checkCause(fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'), undefined, mode))
    .toBe('Their archer shoots your king over e2.');
  expect(checkCause(fromFen('7k/8/8/8/8/4a3/8/4K3 w - - 0 1'), undefined, mode))
    .toBe('Their archer shoots your king.');
});

it('keeps the web Archer cause within eight words on one device', () => {
  const words = checkCause(fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'), undefined, 'device');
  expect(words.split(/\s+/).length).toBeLessThanOrEqual(8);
});
