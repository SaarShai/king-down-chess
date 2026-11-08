import { describe, expect, it } from 'vitest';
import { GameRules } from '../game-rules';
import { DEFAULT_RULES, POWERS_BALANCED } from '../rules/engine';
import { toFen } from '../rules/setup';
import { matchMove, moveChoices, type MoveMatch } from './match-words';

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
const CLASSIC = { ...DEFAULT_RULES, classicChess: true };
const HASTE = { ...DEFAULT_RULES, ...POWERS_BALANCED, kings: [{ king: 'Flame', power: 'Haste' }, null] } as const;
const FROST = { ...DEFAULT_RULES, ...POWERS_BALANCED, kings: [{ king: 'Frost', power: 'Freeze' }, null] } as const;
const legal = (fen: string, rules: object = DEFAULT_RULES): string[] => {
  const context = new GameRules(rules), pos = context.fromFen(fen);
  return context.legalMoves(pos).map(m => context.toLan(pos, m));
};
const match = (fen: string, said: string, rules: object = DEFAULT_RULES): MoveMatch => matchMove(rules as never, fen, legal(fen, rules), said);
const ids = (r: MoveMatch): string[] => r.kind === 'one' ? [r.move.id] : r.kind === 'many' ? r.choices.map(c => c.id) : [];

describe('move words', () => {
  it.each([
    // fen, said, the one move, rules
    [START, 'Ng1-f3', 'Ng1-f3'],
    [START, 'knight f3', 'Ng1-f3'],
    [START, 'Nf3', 'Ng1-f3'],
    [START, 'g1 f3', 'Ng1-f3'],
    [START, 'g1f3', 'Ng1-f3'],
    [START, 'horse to f3', 'Ng1-f3'],
    [START, 'um, I want to play my knight from g1 to f3 please', 'Ng1-f3'],
    [START, 'echo four', 'e2-e4'],
    [START, 'e 4', 'e2-e4'],
    [START, 'pawn to e four', 'e2-e4'],
    ['k7/8/8/8/8/8/8/R4R1K w - - 0 1', 'rook a1 to c1', 'Ra1-c1'],
    ['k7/8/8/8/8/8/8/R4R1K w - - 0 1', 'Rfc1', 'Rf1-c1'],
    ['4k3/8/4p3/8/4A3/8/8/4K3 w - - 0 1', 'archer shoots e6', 'Ae4*e6'],
    ['4k3/8/4p3/8/4A3/8/8/4K3 w - - 0 1', 'shoot the pawn', 'Ae4*e6'],
    ['4k3/8/8/8/8/8/8/3MK3 w - - 0 1', 'maester swaps with the king', 'Md1<>e1'],
    ['4k3/8/8/5p2/4O3/8/8/4K3 w - - 0 1', 'ogre shoves f5', 'Oe4>f5-g6'],
    ['4k3/8/8/5p2/4O3/8/8/4K3 w - - 0 1', 'push the pawn', 'Oe4>f5-g6'],
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'castle short', 'O-O', CLASSIC],
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'castle kingside', 'O-O', CLASSIC],
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'O-O', 'O-O', CLASSIC],
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', "castle on the queen's side", 'O-O-O', CLASSIC],
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', '0-0-0', 'O-O-O', CLASSIC],
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'castle long', 'O-O-O', CLASSIC],
    ['4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'b8 queen', 'b7-b8=Q'],
    ['4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'promote to a knight', 'b7-b8=N'],
    ['4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'b8=R', 'b7-b8=R'],
    ['4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'bravo seven bravo eight = b', 'b7-b8=B'],
    ['4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'pawn takes d5', 'e4xd5'],
    ['4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'captures', 'e4xd5'],
    ['4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1', 'exd5', 'e4xd5'],
    ['4k3/8/8/4n3/8/8/8/4K3 w - - 0 1', 'freeze the knight', '!F:e5', FROST],
    // A power the phrase does not name never plays: the plain move is the one fit.
    [START, 'knight f3', 'Ng1-f3', HASTE],
    [START, 'knight f3 with haste', 'Ng1-f3!H', HASTE],
  ] as const)('%s: "%s" is %s', (fen, said, id, rules = DEFAULT_RULES) => {
    const r = match(fen, said, rules);
    expect(r.kind).toBe('one');
    expect(ids(r)).toEqual([id]);
  });

  it('plays a pass by its words', () => {
    const context = new GameRules(HASTE), pre = context.fromFen(START);
    const fen = toFen(context.makeMove(pre, context.legalMoves(pre).find(m => m.power === 'haste' && context.toLan(pre, m) === 'Ng1-f3!H')!));
    expect(legal(fen, HASTE)).toContain('--');
    for (const said of ['--', 'pass', 'end turn', "I'm done", 'stop']) expect(ids(match(fen, said, HASTE))).toEqual(['--']);
  });

  it.each([
    ['k7/8/8/8/8/8/8/R4R1K w - - 0 1', 'rook to c1', ['Ra1-c1', 'Rf1-c1'], DEFAULT_RULES],
    ['r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1', 'castle', ['O-O', 'O-O-O'], CLASSIC],
    ['4k3/1P6/8/8/8/8/8/4K3 w - - 0 1', 'b8', ['b7-b8=Q', 'b7-b8=R', 'b7-b8=B', 'b7-b8=N'], DEFAULT_RULES],
    [START, 'knight g1', ['Ng1-f3', 'Ng1-h3'], DEFAULT_RULES],
  ] as const)('gives choices, never a pick: %s "%s"', (fen, said, choices, rules) => {
    const r = match(fen, said, rules);
    expect(r.kind).toBe('many');
    expect(ids(r).sort()).toEqual([...choices].sort());
    if (said === 'b8') expect(ids(r)[0]).toBe('b7-b8=Q');
  });

  it('never plays the piece on a misheard target square', () => {
    const r = match('4k3/8/8/8/4P3/8/8/4K3 w - - 0 1', 'pawn to e4');
    expect(r).toMatchObject({ kind: 'many', count: 1, choices: [{ id: 'e4-e5' }] });
  });

  it('counts every fit when it lists only some', () => {
    const r = match('QQQQQQQQ/QQQQ4/8/8/8/8/8/k6K w - - 0 1', 'queen');
    expect(r.kind === 'many' && [r.count > 4, r.choices.length]).toEqual([true, 4]);
  });

  it.each([
    [START, 'banana', 'Some words are not move words. Say a piece and a square, for example "knight to f3".'],
    [START, 'um the', 'Say a piece and a square, for example "knight to f3".'],
    [START, 'e2 e5', 'The pawn cannot reach e5.'],
    [START, 'e3 e4', 'There is no piece on e3.'],
    [START, 'bishop to e4', 'No legal move matches those words.'],
    ['4k3/4r3/8/8/8/8/4B3/4K3 w - - 0 1', 'bishop e2 d3', 'That leaves your king in check.'],
  ])('refuses %s "%s" with a reason and options', (fen, said, reason) => {
    const r = match(fen, said);
    expect(r).toMatchObject({ kind: 'none', reason });
    if (r.kind !== 'none') return;
    expect(r.options.length).toBeGreaterThan(0);
    expect(r.options.length).toBeLessThanOrEqual(6);
    for (const o of r.options) expect(legal(fen)).toContain(o.id);
  });

  it('offers the moves of the named piece when nothing fits', () => {
    const r = match(START, 'knight to e5');
    expect(r.kind === 'none' && r.options.map(o => o.id).sort()).toEqual(['Nb1-a3', 'Nb1-c3', 'Ng1-f3', 'Ng1-h3']);
  });

  it('asks for the power a move needs instead of spending it', () => {
    const r = matchMove(HASTE as never, START, legal(START, HASTE).filter(l => l.endsWith('!H')), 'knight f3');
    expect(r).toMatchObject({ kind: 'none', reason: 'That move needs Haste. Say "Haste" to use it.', options: [{ id: 'Ng1-f3!H' }] });
  });

  it('words every choice from the mover, in plain sentences without notation', () => {
    const all = moveChoices(DEFAULT_RULES, START, legal(START));
    expect(all).toHaveLength(legal(START).length);
    expect(all.find(c => c.id === 'Ng1-f3')!.words).toBe('White knight g1 to f3.');
    for (const c of all) expect(c.words).not.toMatch(/\b[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[-]{2}|=/);
    const shot = match('4k3/8/4p3/8/4A3/8/8/4K3 w - - 0 1', 'archer shoots e6');
    expect(shot.kind === 'one' && shot.move.words).toMatch(/without moving/);
  });

  it('matches a 250-move position fast', () => {
    const fen = 'QQQQQQQQ/QQQQ4/8/8/8/8/8/k6K w - - 0 1', list = legal(fen);
    expect(list.length).toBeGreaterThan(100);
    const t = performance.now();
    for (let i = 0; i < 20; i++) matchMove(DEFAULT_RULES, fen, list, 'queen to e4');
    expect(performance.now() - t).toBeLessThan(2000);
  });
});
