import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, RULES, WHITE, legalMoves, makeMove, setRules, type Position } from './rules/engine';
import { fromFen, toFen, toLan } from './rules/setup';
import { Game } from './game';
import { SOURCES, countdowns, demoShackle, ring } from './countdown';

const play = (pos: Position, lan: string): Position => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}`);
  return makeMove(pos, m);
};
const left = (pos: Position, side?: 0 | 1) => countdowns(pos, RULES, side).map(c => [c.scope, c.side, c.item, c.turnsLeft, c.total]);
const haste = { kings: [{ king: 'Flame', power: 'Haste' }, { king: 'Flame', power: 'Haste' }], fromMove: { Haste: 4 } } as const;
const START = 'r6k/p7/8/8/8/8/P7/R6K w - - 0 1';

afterEach(() => setRules());

describe('countdowns', () => {
  it('none under the default rules', () => {
    expect(countdowns(fromFen(START))).toEqual([]);
  });

  it('counts each side\'s own turns, through both colours, to 0', () => {
    setRules({ ...haste });
    let p = fromFen(START);
    expect(left(p)).toEqual([['item', WHITE, 'Haste', 3, 3], ['item', BLACK, 'Haste', 3, 3]]);
    p = play(p, 'a2-a3');          // Black to move on move 1: White's next own move is 2
    expect(left(p)).toEqual([['item', WHITE, 'Haste', 2, 3], ['item', BLACK, 'Haste', 3, 3]]);
    expect(left(p, BLACK)).toEqual([['item', BLACK, 'Haste', 3, 3]]);
    p = play(p, 'a7-a6');
    expect(left(p)).toEqual([['item', WHITE, 'Haste', 2, 3], ['item', BLACK, 'Haste', 2, 3]]);
    p = play(play(play(p, 'Ra1-b1'), 'Ra8-b8'), 'Rb1-c1'); // White's move 3 played, Black on move 3
    expect(left(p)).toEqual([['item', BLACK, 'Haste', 1, 3]]); // White's next move is 4: usable, no countdown
    p = play(p, 'Rb8-c8');
    expect(left(p)).toEqual([]);
    expect(legalMoves(p).some(m => m.power === 'haste')).toBe(true);
  });

  it('a turn of two moves (Haste, Rage, Rally) counts once', () => {
    setRules({ ...haste, fromMove: { Haste: 2 } });
    expect(left(play(fromFen(START), 'a2-a3'))).toEqual([['item', BLACK, 'Haste', 1, 1]]);
    setRules({ hands: [['Rage', 'Rally'], []], fromMove: { Rally: 5 } });
    const p = fromFen('r6k/p7/8/8/8/8/P7/R6K w - - 0 3');
    const rage = legalMoves(p).find(m => m.power === 'rage' && toLan(p, m).startsWith('Ra1'))!;
    const q = makeMove(p, rage); // the first of Rage's two moves: White still to move, still move 3
    expect([q.turn, left(p), left(q)]).toEqual([WHITE, [['game', WHITE, 'Rally', 2, 4]], [['game', WHITE, 'Rally', 2, 4]]]);
  });

  it('follows undo and a loaded game', () => {
    setRules({ ...haste });
    const g = new Game();
    g.load(fromFen(START));
    g.playLan(['a2-a3', 'a7-a6']);
    expect(left(g.pos, WHITE)).toEqual([['item', WHITE, 'Haste', 2, 3]]);
    g.undo(); g.undo();
    expect(left(g.pos, WHITE)).toEqual([['item', WHITE, 'Haste', 3, 3]]);
    expect(left(fromFen('r6k/p7/8/8/8/8/P7/R6K b - - 0 3'))).toEqual([['item', BLACK, 'Haste', 1, 3]]);
  });

  it('a spent power or a played card has none; several items, one each', () => {
    setRules({ ...haste });
    expect(left({ ...fromFen(START), used: [1, 0] })).toEqual([['item', BLACK, 'Haste', 3, 3]]);
    setRules({ hands: [['Rage', 'Rally', 'Rage'], ['Rally']], fromMove: { Rage: 3, Rally: 5 } });
    const p = fromFen(START);
    expect(left(p)).toEqual([['game', WHITE, 'Rage', 2, 2], ['game', null, 'Rally', 4, 4]]); // both hold Rally: one for the game
    expect(left({ ...p, used: [0b010, 0] })).toEqual([['game', WHITE, 'Rage', 2, 2], ['game', BLACK, 'Rally', 4, 4]]);
    expect(left({ ...p, used: [0b101, 0] })).toEqual([['game', null, 'Rally', 4, 4]]);
  });

  it('labels in plain words', () => {
    setRules({ ...haste, fromMove: { Haste: 3 } });
    const [w] = countdowns(fromFen(START));
    expect(w.label).toBe('Haste usable in 2 turns');
    expect(countdowns(fromFen('r6k/p7/8/8/8/8/P7/R6K w - - 0 2'))[0].label).toBe('Haste usable in 1 turn');
    setRules({ hands: [['SkyLift'], []], fromMove: { SkyLift: 4 } });
    expect(countdowns(fromFen(START))[0].label).toBe("White's Sky Lift usable in 3 turns");
    expect(countdowns(fromFen(START), RULES, WHITE, [...SOURCES, demoShackle]).map(c => [c.scope, c.square, c.label]))
      .toEqual([['game', undefined, "White's Sky Lift usable in 3 turns"], ['piece', 0, 'Rook unshackled in 4 turns']]);
  });

  it('the ring: label, number, and the filled part', () => {
    const html = ring({ turnsLeft: 1, total: 4, label: 'Haste usable in 1 turn' });
    expect(html).toContain('aria-label="Haste usable in 1 turn"');
    expect(html).toContain('data-n="1"');
    expect(html).toContain('stroke-dasharray="75 100"');
    expect(ring({ turnsLeft: 4, total: 4, label: 'x' })).not.toContain('cd-fill');
  });
});
