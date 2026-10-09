import { afterEach, describe, expect, it } from 'vitest';
import { LESSONS } from './lessons';
import { Game } from './game';
import { Q, legalMoves, makeMove, parseKings } from './rules/engine';
import { POWERS_BALANCED, RULES_2017, setRules } from './rules/rules';
import { fromFen, toLan } from './rules/setup';
import { autoQueen, coinState, hintMoves, needsArming, powerOptions, powerText, powersRules } from './powers-ui';

afterEach(() => setRules());

describe('the power coin', () => {
  it('has no coin for a side with no power', () => {
    const rules = powersRules({ kings: parseKings('none,frost:freeze') });
    expect(coinState(fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1'), 0, rules, [], false)).toBeNull();
  });

  it('shows a ready power with its use left', () => {
    const rules = powersRules({ kings: parseKings('frost:freeze,none') });
    expect(coinState(fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1'), 0, rules, [], false)).toEqual({
      king: 'Frost', power: 'Freeze', state: 'ready', total: 1, spent: 0, left: 1,
      fromMove: 1, usedOn: null,
    });
  });

  it('shows an armed power without spending a use', () => {
    const rules = powersRules({ kings: parseKings('none,frost:freeze') });
    expect(coinState(fromFen('7k/8/8/8/8/8/8/K7 b - - 0 1'), 1, rules, [], true)).toMatchObject({
      king: 'Frost', power: 'Freeze', state: 'armed', total: 1, spent: 0, left: 1,
    });
  });

  it('shows the use on its full move and restores it on Undo', () => {
    const rules = powersRules({ kings: parseKings('none,frost:freeze') });
    setRules(rules);
    const game = new Game();
    game.load(fromFen('7k/8/8/8/8/8/R7/K7 b - - 0 12'));
    game.play(game.legal.find(m => m.power === 'freeze')!);
    expect(coinState(game.pos, 1, rules, game.history, true)).toMatchObject({
      state: 'used', total: 1, spent: 1, left: 0, usedOn: 12,
    });
    game.undo();
    expect(coinState(game.pos, 1, rules, game.history, false)).toMatchObject({
      state: 'ready', spent: 0, left: 1, usedOn: null,
    });
  });

  it('shows an always-on power with no use notches', () => {
    const rules = powersRules({ kings: parseKings('spirit:holylight,none') });
    setRules(rules);
    const game = new Game();
    game.load(fromFen('7k/8/8/8/8/8/R7/K7 w - - 0 1'));
    game.play(game.legal[0]);
    expect(coinState(game.pos, 0, rules, game.history, true)).toEqual({
      king: 'Spirit', power: 'HolyLight', state: 'always', total: null, spent: 0, left: null,
      fromMove: 1, usedOn: null,
    });
  });

  it.each(['march', 'leap'])('shows zero-use %s as always on', power => {
    const rules = powersRules({ kings: parseKings(`mud:${power},none`), marchUses: 0, leapUses: 0 });
    expect(coinState(fromFen('7k/8/8/8/8/8/8/K7 w - - 0 1'), 0, rules, [], true)).toMatchObject({
      state: 'always', total: null, spent: 0, left: null, usedOn: null,
    });
  });
});

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
    expect(powerText('Mercy')).toBe('your king steps 1–2 squares and jumps your pieces, but takes only a pawn or a guard; your pieces next to it cannot be taken except by pawns');
    expect(powerText('DeathTouch')).toBe('your king takes an enemy next to it, or two squares away straight forward, back or sideways over an empty square, without moving \u2014 it can only take this way');
    expect(powerText('Darkness')).toBe('your pawns may also step diagonally, and take only straight ahead; your king may also step two squares in a straight line, over an empty square');
  });
});

describe('the power picker', () => {
  it('shows the official counts even before a game with powers starts', () => {
    setRules(); // plain rules: the rulebook gives Freeze two uses, the official set one
    const freeze = powerOptions().flatMap(g => g.options).find(o => o.value === 'Frost:Freeze')!;
    expect(freeze.label).toBe('Freeze (1 per game)');
    expect(powerOptions().flatMap(g => g.options).find(o => o.value === 'Spirit:Mercy')!.title).toContain('takes only a pawn or a guard');
  });

  it('puts a `?rules=` preset over the official readings, as the game it starts plays them', () => {
    const opts = powerOptions(RULES_2017).flatMap(g => g.options);
    expect(opts.find(o => o.value === 'Frost:Freeze')!.label).toBe('Freeze (2 per game)');
    expect(opts.find(o => o.value === 'Spirit:Mercy')!.title).toBe('your king steps 1–2 squares and jumps your pieces, but takes only a guard');
  });
});

describe('the moves Hint may suggest', () => {
  it('in a lesson, only its goal moves: in lesson 3 the Maester swap, not a king move', () => {
    for (const l of LESSONS) {
      const pos = fromFen(l.fen), moves = hintMoves(legalMoves(pos), null, m => l.goal(pos, m));
      expect(moves.length, l.name).toBeGreaterThan(0);
      expect(moves.every(m => l.goal(pos, m)), l.name).toBe(true);
    }
    const pos = fromFen(LESSONS[2].fen);
    expect(hintMoves(legalMoves(pos), null, m => LESSONS[2].goal(pos, m)).map(m => toLan(pos, m))).toEqual(['Md4<>e4']);
  });

  it('with the power not armed, no move that needs it; with the power armed, only its moves', () => {
    setRules({ ...POWERS_BALANCED, kings: parseKings('flame:strike,none') });
    const pos = fromFen('2b4k/2P3pp/2R5/8/8/8/8/K7 w - - 0 1'), legal = legalMoves(pos);
    const plain = hintMoves(legal, null), strike = hintMoves(legal, 'strike');
    expect(plain.length).toBeGreaterThan(0);
    expect(plain.some(needsArming)).toBe(false);
    expect(strike.every(m => m.power === 'strike')).toBe(true);
    expect(plain.length + strike.length).toBe(legal.length);
    expect(strike.map(m => toLan(pos, m))).toContain('Rc6-e8!'); // the Strike that mates, which an unarmed Hint showed
  });

  it('keeps the pass in a Haste turn, which End turn plays', () => {
    setRules({ ...POWERS_BALANCED, kings: parseKings('flame:haste,none') });
    const pos = fromFen('7k/8/8/1p6/8/8/P7/K7 w - - 0 1');
    const after = makeMove(pos, hintMoves(legalMoves(pos), 'haste').find(m => toLan(pos, m) === 'a2-a3!H')!);
    expect(hintMoves(legalMoves(after), null).map(m => toLan(after, m))).toEqual(['a3-a4', '--']); // a3-a4 loses the pawn to b5xa4
  });

  it('with Always promote to queen, no promotion that the board changes to the queen', () => {
    const pos = fromFen('8/2q1P1k1/8/8/8/8/8/7K w - - 0 1'), legal = legalMoves(pos);
    const promos = (queen: boolean) => hintMoves(legal, null, undefined, queen).filter(m => m.promo).map(m => toLan(pos, m));
    expect(promos(false)).toEqual(['e7-e8=Q', 'e7-e8=R', 'e7-e8=B', 'e7-e8=N']);
    expect(promos(true)).toEqual(['e7-e8=Q']); // not e7-e8=N, the fork that the search likes
    expect(autoQueen(legal.filter(m => m.promo))?.promo).toBe(Q);
    expect(autoQueen(legal.filter(m => !m.promo))).toBeUndefined();
  });

  it('keeps every Sacrifice with Always promote to queen: its picker always asks', () => {
    setRules({ ...POWERS_BALANCED, kings: parseKings('stratus:sacrifice,none') });
    const pos = fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1 lQN');
    expect(hintMoves(legalMoves(pos), 'sacrifice', undefined, true).map(m => toLan(pos, m)).sort()).toEqual(['!S:a2=N', '!S:a2=Q']);
  });
});
