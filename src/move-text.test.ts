import { afterEach, describe, expect, it } from 'vitest';
import { Move, N, Position, POWERS_BALANCED, RULES, T, inCheck, legalMoves, makeMove, nameOf, parseRule, parseSq, setRules } from './rules/engine';
import { GameRules } from './game-rules';
import { PRESETS, designCode, fromPreset } from './workshop/model';
import { CardName, KingChoice, PowerName } from './rules/rules';
import { RELEASED_CARDS } from './content/cards';
import { fromFen, randomBackRank, startPosition, toLan } from './rules/setup';
import { checkCause, checkersOf, describeMove, shortMove, moveNumbers, nextMoveNumber, threatsIn } from './move-text';
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
const say = (pos: Position, lan: string): string => describeMove(new GameRules(RULES), pos, find(pos, lan));

afterEach(() => setRules());

describe('check causes', () => {
  it('names the Archer screen, a clear shot, a knight and both checkers', () => {
    expect(checkCause(new GameRules(RULES), fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'))).toBe('Their archer can shoot over e2.');
    expect(checkCause(new GameRules(RULES), fromFen('7k/8/8/8/8/4a3/8/4K3 w - - 0 1'))).toBe('Their archer can shoot your king.');
    expect(checkCause(new GameRules(RULES), fromFen('7k/p7/8/8/8/5n2/8/4K3 w - - 0 1'))).toBe('Their knight attacks your king.');
    expect(checkCause(new GameRules(RULES), fromFen('4k3/8/8/8/8/5n2/8/4K2r w - - 0 1'))).toBe('Their rook and knight attack your king.');
  });

  it('names Strike only when it moves the checker', () => {
    setRules({ ...POWERS_BALANCED, kings: [null, { king: 'Flame', power: 'Strike' }] });
    const pre = fromFen('7k/8/8/8/8/a7/4P3/4K3 b - - 0 1');
    const strike = legalMoves(pre).find(m => m.power === 'strike' && m.from === parseSq('a3') && m.to === parseSq('e3'))!;
    expect(strike).toBeDefined();
    const pos = makeMove(pre, strike);
    expect(checkCause(new GameRules(RULES), pos, strike)).toBe('Strike lets their archer shoot over e2.');
    expect(checkCause(new GameRules(RULES), pos, { ...strike, to: parseSq('a3') })).toBe('Their archer can shoot over e2.');
  });

  it('has no cause when the rules prevent check', () => {
    const archer = fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1');
    setRules({ archerChecks: false });
    expect(checkCause(new GameRules(RULES), archer)).toBe('');
    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, null], holyLightKnights: true });
    expect(checkCause(new GameRules(RULES), fromFen('7k/p7/8/8/8/5n2/8/4K3 w - - 0 1'))).toBe('');
  });

  it('names both checkers and their paths in a double check', () => {
    const pos = fromFen('4k3/8/8/8/8/5n2/8/4K2r w - - 0 1');
    expect(checkersOf(new GameRules(RULES), pos)).toEqual([
      { sq: parseSq('h1'), king: parseSq('e1'), path: 'straight' },
      { sq: parseSq('f3'), king: parseSq('e1'), path: 'arc' },
    ]);
  });

  it('shows an arc for an Archer shot over a piece', () => {
    const pos = fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1');
    expect(checkersOf(new GameRules(RULES), pos)).toEqual([
      { sq: parseSq('e3'), king: parseSq('e1'), path: 'arc' },
    ]);
  });

  it('counts a frozen checker during a held turn', () => {
    powers('Freeze');
    const pos = fromFen('7k/8/8/8/8/8/8/4K2r w - - 0 1');
    expect(checkersOf(new GameRules(RULES), { ...pos, marks: [{ sq: parseSq('h1') }, undefined], free: true, haste: parseSq('e1') }))
      .toEqual([{ sq: parseSq('h1'), king: parseSq('e1'), path: 'straight' }]);
  });

  it('names the rook in a discovered check', () => {
    const pos = fromFen('4k3/8/8/8/8/8/4B3/4R2K w - - 0 1');
    expect(checkersOf(new GameRules(RULES), makeMove(pos, find(pos, 'Be2-f3'))))
      .toEqual([{ sq: parseSq('e1'), king: parseSq('e8'), path: 'straight' }]);
  });

  it('shows a paladin leap over a friend', () => {
    setRules({ paladinChecks: true });
    const pos = fromFen('7k/8/8/8/8/4l3/4p3/4K3 w - - 0 1');
    expect(checkersOf(new GameRules(RULES), pos)).toEqual([{ sq: parseSq('e3'), king: parseSq('e1'), path: 'arc' }]);
  });

  it('reads Holy Light and Darkness from the rules in force', () => {
    const knight = fromFen('7k/8/8/8/8/5n2/8/4K3 w - - 0 1');
    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Spirit', power: 'HolyLight' }, null], holyLightKnights: true });
    expect(checkersOf(new GameRules(RULES), knight)).toEqual([]);
    setRules({ ...POWERS_BALANCED, kings: [null, { king: 'Shadow', power: 'Darkness' }] });
    const pawn = fromFen('7k/8/8/8/8/8/4p3/4K3 w - - 0 1');
    expect(checkersOf(new GameRules(RULES), pawn)).toEqual([{ sq: parseSq('e2'), king: parseSq('e1'), path: 'straight' }]);
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
          const list = checkersOf(new GameRules(RULES), { ...pos, turn });
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
    expect(describeMove(new GameRules(RULES), sac, back)).toBe('White sacrifices the pawn on a2 and brings back a queen there.');

    powers('Haste');
    const pos = fromFen('7k/8/8/r3r3/8/8/8/R5K1 w - - 0 1');
    expect(say(pos, 'Ra1xa5!H')).toBe('White rook a1 to a5, taking the rook on a5, with Haste: the rook may move again.');
    const held = makeMove(pos, find(pos, 'Ra1xa5!H'));
    expect(say(held, '--')).toBe('White ends the turn without the Haste second move.');

    setRules({ ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] }); // a free Freeze: mark, then move or pass
    const marked = makeMove(fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'), find(fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1'), '!F:d5'));
    expect(describeMove(new GameRules(RULES), marked, find(marked, '--'), true)).toBe('White ends the turn after the mark.');
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
  it('give each attacker and the own piece it can take, the king too', () => {
    // The W13 threats position: the rook d5 attacks the knight d2; the queen b3 is safe.
    expect(threatsIn(new GameRules(RULES), fromFen('4k3/8/8/3r4/8/1Q6/3N4/4K3 w - - 0 1'))).toEqual([{ from: parseSq('d5'), to: parseSq('d2') }]);
    // Check: the rook e4 attacks the king e1; the king comes from checkersOf.
    expect(threatsIn(new GameRules(RULES), fromFen('4k3/8/8/8/4r3/8/8/4K3 w - - 0 1'))).toEqual([{ from: parseSq('e4'), to: parseSq('e1') }]);
    // An archer's shot stays on its square (to === from): the threat starts at the archer d5.
    expect(threatsIn(new GameRules(RULES), fromFen('4k3/8/8/3a4/8/3N4/8/4K3 w - - 0 1'))).toEqual([{ from: parseSq('d5'), to: parseSq('d3') }]);
  });
  it('still show during a Haste turn’s pending second move', () => {
    powers('Haste');
    const pos = fromFen('7k/8/8/r7/8/8/8/R5K1 w - - 0 1');
    const held = makeMove(pos, find(pos, 'Ra1-a4!H'));
    expect(held.haste).toBe(parseSq('a4'));
    expect(threatsIn(new GameRules(RULES), held)).toContainEqual({ from: parseSq('a5'), to: parseSq('a4') }); // the black rook on a5 attacks it
    expect(threatsIn(new GameRules(RULES), held)).toEqual(threatsIn(new GameRules(RULES), { ...held, haste: undefined }));
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
  expect(checkCause(new GameRules(RULES), fromFen('7k/8/8/8/8/8/8/4K2r w - - 0 1'), undefined, 'device'))
    .toBe("Black's rook attacks the white king.");
  expect(checkCause(new GameRules(RULES), fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'), undefined, 'device'))
    .toBe("Black's archer shoots the white king over e2.");
});
it.each(['computer', 'link'] as const)('names the king and states the Archer fact in %s play', mode => {
  expect(checkCause(new GameRules(RULES), fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'), undefined, mode))
    .toBe('Their archer shoots your king over e2.');
  expect(checkCause(new GameRules(RULES), fromFen('7k/8/8/8/8/4a3/8/4K3 w - - 0 1'), undefined, mode))
    .toBe('Their archer shoots your king.');
});

it('keeps the web Archer cause within eight words on one device', () => {
  const words = checkCause(new GameRules(RULES), fromFen('7k/8/8/8/8/4a3/4P3/4K3 w - - 0 1'), undefined, 'device');
  expect(words.split(/\s+/).length).toBeLessThanOrEqual(8);
});

it.each(['computer', 'link'] as const)('speaks from either viewer when either king is in check in %s', mode => {
  const whiteCheck = fromFen('7k/8/8/8/8/8/8/4K2r w - - 0 1');
  const blackCheck = fromFen('4k2R/8/8/8/8/8/8/7K b - - 0 1');
  expect(checkCause(new GameRules(RULES), whiteCheck, undefined, mode, 0)).toBe('Their rook attacks your king.');
  expect(checkCause(new GameRules(RULES), whiteCheck, undefined, mode, 1)).toBe('Your rook attacks their king.');
  expect(checkCause(new GameRules(RULES), blackCheck, undefined, mode, 0)).toBe('Your rook attacks their king.');
  expect(checkCause(new GameRules(RULES), blackCheck, undefined, mode, 1)).toBe('Their rook attacks your king.');
});

it.each(['haste', 'rally'] as const)('describes the final %s ply without another move', power => {
  const pos = fromFen('7k/8/8/8/8/R7/8/7K w - - 0 1');
  expect(describeMove(new GameRules(RULES), pos, { from: 16, to: 56, captures: [], power }, true, true)).toBe('White rook a3 to a8.');
});


it('keeps a short move and names the card or power use', () => {
  setRules({});
  const pos = fromFen('4k3/7p/8/8/8/8/P7/K7 b - - 0 1');
  expect(shortMove(pos, find(pos, 'h7-h5'), nameOf)).toBe('Black pawn h7 → h5');
  expect(shortMove(pos, {from:55,to:47,captures:[],power:'haste'}, nameOf)).toBe('Black Haste · pawn h7 → h6');
  expect(shortMove(pos, {from:60,to:60,captures:[],power:'firewall'}, nameOf)).toBe('Black Firewall · king e8');
  // Spec W10 a: the shared card names, as setup, the Cards sheet and the board coins show them.
  expect(shortMove(pos, {from:60,to:60,captures:[],power:'firewall',via:'mirrorb'}, nameOf)).toBe('Black Mirror · Firewall · king e8');
  expect(shortMove(fromFen('4k3/8/8/8/8/8/P7/K7 w - - 0 1'), {from:8,to:8,captures:[],power:'morphp',promo:N}, nameOf)).toBe('White Morph · pawn a2 = knight');
  expect(shortMove(pos, {from:60,to:47,captures:[],drop:1,power:'spawn'}, nameOf)).toBe('Black Spawn · adds pawn h6');
  expect(shortMove(pos, {from:60,to:60,captures:[],pass:true}, nameOf)).toBe('Black ends turn · Haste');
});

it('keeps owned designed names in short moves without changing the ambient rules', () => {
  const preset = fromPreset(PRESETS.find(row => row.key === 'rook')!);
  const rules = (name: string) => parseRule(`design=${designCode({ ...preset, name, letter: 'Y' })}`);
  const context = new GameRules(rules('Owned Ward'));
  const pos = context.fromFen('7k/P7/8/8/8/8/T7/K7 w - - 0 1');
  setRules(rules('Ambient Ward'));
  const ambient = structuredClone(RULES), name = (type: Parameters<typeof context.nameOf>[0]) => context.nameOf(type);
  const move = { from: 8, to: 16, captures: [] };
  expect(shortMove(pos, move, name)).toBe('White Owned Ward a2 → a3');
  expect(shortMove(pos, { from: 0, to: 16, captures: [], drop: T, power: 'salvation' }, name)).toBe('White Salvation · adds Owned Ward a3');
  expect(shortMove(pos, { from: 48, to: 56, captures: [], promo: T }, name)).toBe('White pawn a7 → a8 = Owned Ward');
  expect(shortMove(pos, move, nameOf)).toBe('White Ambient Ward a2 → a3');
  expect(RULES).toEqual(ambient);
});

describe('screen-reader lines for released cards', () => {
  // One real move per card of RELEASED_CARDS: the hand, the position, the move (LAN) and its sentence.
  const CASES: Record<string, [hand: CardName[], fen: string, lan: string, text: string]> = {
    Freeze: [['Freeze'], '4k3/8/3p4/3n4/8/8/8/4K3 w - - 0 1', '!F:d5', 'White freezes the black knight on d5.'],
    IceWall: [['IceWall'], '4k3/8/8/8/R7/8/2b5/4K3 w - - 0 1', '!W:a4', 'White puts an Ice Wall on the white rook on a4.'],
    Strike: [['Strike'], '4k3/8/8/8/3p4/8/8/R3K3 w - - 0 1', 'Ra1xd4!', 'White rook a1 to d4, taking the pawn on d4 with Strike.'],
    Haste: [['Haste'], '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'Ra1-a5!H', 'White rook a1 to a5, with Haste: the rook may move again.'],
    Flight: [['Flight'], '4k3/8/8/8/8/8/1P6/RN2K3 w - - 0 1', 'Nb1~d3', 'White knight flies from b1 to d3.'],
    Sacrifice: [['Sacrifice'], '4k3/8/8/8/8/8/P7/4K3 w - - 0 1 lQ', '!S:a2=Q', 'White sacrifices the pawn on a2 and brings back a queen there.'],
    March: [['March'], '4k3/8/8/8/8/P7/8/4K3 w - - 0 1', 'a3-a5!M', 'White pawn a3 to a5 with March.'],
    Leap: [['Leap'], '4k3/8/8/8/8/8/P7/R3K3 w - - 0 1', 'Ra1-a3!L', 'White rook a1 to a3 with Leap.'],
    Salvation: [['Salvation'], '4k3/8/8/8/8/8/8/4K3 w - - 0 1 lQ', 'Q@d1!R', 'White uses Salvation to bring back a queen on d1.'],
    MirrorB: [['MirrorB', 'Freeze'], '4k3/8/3p4/3n4/8/8/8/4K3 w - - 0 1', '!F:d5!Z', 'With Mirror, White freezes the black knight on d5.'],
    Firewall: [['Firewall'], '4k3/8/8/8/8/8/8/4K3 w - - 0 1', '!P', 'White uses Firewall to protect all its pieces until its next turn.'],
    EarthQuake: [['EarthQuake'], '4k3/8/8/3p4/8/8/8/4K3 w - - 0 1', '!Q:c4', 'White uses Earth Quake on c4 and pushes the pawn on d5 to e6.'],
    Burn: [['Burn'], '4k3/8/8/8/3p4/8/8/3NK3 w - - 0 1', 'Nd1xd4!N', 'White knight d1 to d4, taking the pawn on d4 with Burn.'],
    FireStarter: [['FireStarter'], '3rk3/8/8/8/8/8/8/3NK3 w - - 0 1', 'Nd1xd8!T', 'White knight d1 to d8, taking the rook on d8 with Fire Starter.'],
    Control: [['Control'], '4k3/8/8/8/8/8/8/1NR1K3 w - - 0 1', 'Nb1-b5!O', 'White knight b1 to b5 with Control.'],
    Rally: [['Rally'], '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'Ra1-a5!J', 'White rook a1 to a5, with Rally: a different piece may move next.'],
    MorphP: [['MorphP'], '4k3/8/8/8/8/8/P7/4K3 w - - 0 1', '!IP:a2=N', 'White turns the pawn on a2 into a knight.'],
    Mimic: [['Mimic'], '4k3/8/8/8/8/8/8/1NR1K3 w - - 0 1', 'Nb1-b5!X', 'White knight b1 to b5 with Mimic.'],
    Vault: [['Vault'], '4k3/8/8/8/8/8/p7/R3K3 w - - 0 1', 'Ra1-a3!V', 'White rook a1 to a3 with Vault.'],
    Curse: [['Curse'], '4k3/8/8/3n4/8/8/8/4K3 w - - 0 1', '!C:d5-e5', 'White uses Curse to move the black knight on d5 to e5.'],
    SkyLift: [['SkyLift'], '4k3/8/8/8/8/8/8/1NB1K3 w - - 0 1', '!K:b1<>c1', 'White uses Sky Lift to swap the knight on b1 and the bishop on c1.'],
  };
  // The king-power sentences, unchanged, name these cards by their verb.
  const VERB: Record<string, string> = { Freeze: 'freezes', Flight: 'flies', Sacrifice: 'sacrifices', MorphP: 'turns' };

  it('has one case for each released card', () => {
    expect(Object.keys(CASES).sort()).toEqual(RELEASED_CARDS.map(card => card.id).sort());
  });

  it.each(RELEASED_CARDS.map(card => [card.id, card.name] as const))('names %s in its move sentence', (id, name) => {
    const [hand, fen, lan, text] = CASES[id];
    setRules({ hands: [hand, []] });
    const line = say(fromFen(fen), lan);
    expect(line).toBe(text);
    expect(line).toContain(VERB[id] ?? name);
  });

  it('counts the pieces when an Earth Quake pushes more than two', () => {
    setRules({ hands: [['EarthQuake'], []] });
    expect(say(fromFen('4k3/8/8/2ppp3/8/8/8/4K3 w - - 0 1'), '!Q:d4')).toBe('White uses Earth Quake on d4 and pushes 3 pieces one square away.');
  });
});
