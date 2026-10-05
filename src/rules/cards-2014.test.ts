/**
 * The 2014 cards in card mode (lab, owner 2026-10-04: "cards - let's add all"): Rage, RageB, Mirror,
 * MirrorB, Firewall, FirewallB, EarthQuake, EarthQuakeB, Burn, FireStarter, Control, Rescue, Growth,
 * GrowthB. Per card: what it allows and refuses, its text, the other side unaffected; then the
 * make/unmake, search key, FEN and replay round-trips of every card move.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { B, BLACK, K, Move, N, P, Position, Q, R, WHITE, inCheck, legalMoves, makeMove, materialDraw, parseSq, typeOf } from './engine';
import { fromFen, toFen, toLan } from './setup';
import { CardName, DEFAULT_RULES, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, search, searchLegal } from '../ai/search';
import { replayRecord } from '../sim/replay';
import { cardText } from '../powers-ui';

const hands = (white: CardName[], black: CardName[], more = {}): void => { setRules({ hands: [white, black], markFree: true, ...more }); };
const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
const play = (pos: Position, lan: string): Position => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return makeMove(pos, m);
};
const card = (pos: Position, mark: string): string[] => lans(pos).filter(l => l.includes(mark));
const tags = (pos: Position): string[] => [...new Set(legalMoves(pos).map(m => m.via ?? m.power ?? ''))].filter(Boolean).sort();
const legalSame = (pos: Position): void => { expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(lans(pos)); };
const at = (pos: Position, s: string): number => pos.board[parseSq(s)];
/** FEN keeps every card state; it cannot keep the ply inside a turn that goes on (a Rage, a free action), so that is left out. */
const fenSame = (p: Position): void => { expect({ ...fromFen(toFen(p)), ply: 0 }, toFen(p)).toEqual({ ...p, ply: 0 }); };

afterEach(() => { setRules(); resetSearchState(); });

describe('Rage and RageB', () => {
  it('Rage: one piece moves twice and may take on either move; the second move is optional', () => {
    hands(['Rage'], [], { hasteCaptures: false }); // the card rules of the measurements: Haste is quiet, Rage is not
    const pos = fromFen('4k3/8/p7/8/8/8/8/R3K2n w - - 0 1');
    expect(card(pos, '!A')).toContain('Ra1xa6!A'); // the first move may take
    const p = play(pos, 'Ra1-a5!A');
    expect([p.turn, p.haste, p.rage, p.used]).toEqual([WHITE, parseSq('a5'), 1, [1, 0]]);
    expect(toFen(p).split(' ')[6]).toBe('u1.0/ha5r');
    fenSame(p);
    expect(lans(p)).toEqual(expect.arrayContaining(['Ra5xa6', '--'])); // the second may take too, or the turn ends
    expect(lans(p).every(l => l.startsWith('Ra5') || l === '--')).toBe(true); // only the raged piece moves
    const q = play(play(pos, 'Ra1xa6!A'), 'Ra6-h6');
    expect([q.turn, q.haste, q.rage]).toEqual([BLACK, undefined, undefined]);
    expect(tags(play(q, 'Ke8-d8'))).toEqual([]); // one use
    legalSame(p);
  });

  it('RageB: the second move must take, or the turn ends', () => {
    hands(['RageB'], []);
    const p = play(fromFen('4k3/8/p7/8/8/8/8/R3K3 w - - 0 1'), 'Ra1-a5!B');
    expect([p.rage, toFen(p).split(' ')[6]]).toEqual([2, 'u1.0/ha5t']);
    expect(lans(p)).toEqual(['--', 'Ra5xa6']);
    legalSame(p);
  });

  it('refuses: no king is taken on the second move, no paladin that removes itself, no frozen piece', () => {
    hands(['Rage'], ['Freeze']);
    // The first move checks; the second move may not take the king.
    const p = play(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), 'Ra1-a8!A');
    expect(inCheck({ ...p, turn: BLACK })).toBe(true);
    expect(lans(p).some(l => l.includes('xe8'))).toBe(false);
    expect(card(fromFen('4k3/8/8/8/8/8/1n6/L3K3 w - - 0 1'), '!A').some(l => l.startsWith('La1xb2'))).toBe(false);
    const frozen = play(play(fromFen('4k3/8/8/8/8/8/8/R3K3 b - - 0 1'), '!F:a1'), 'Ke8-f8');
    expect(card(frozen, '!A').some(l => l.startsWith('Ra1'))).toBe(false);
    expect(card(frozen, '!A').length).toBeGreaterThan(0);
  });

  it('texts, and the other side unaffected', () => {
    expect(cardText('Rage')).toBe('one of your pieces moves twice this turn and may take on either move (the second move is optional)');
    expect(cardText('RageB')).toBe('one of your pieces moves twice this turn; its second move, if it makes one, must take');
    hands(['Rage', 'RageB'], []);
    expect(tags(fromFen('4k3/8/8/8/8/8/8/R3K3 b - - 0 1'))).toEqual([]);
  });

  it('the search takes twice with a Rage', () => {
    hands(['Rage'], []);
    // Taking the knight loses the rook to the queen; a Rage takes the knight, then the queen.
    const pos = fromFen('k7/8/8/n6q/8/8/8/R3K3 w - - 0 1');
    expect(toLan(pos, search(pos, { maxDepth: 2 }).move!)).toBe('Ra1xa5!A');
  });
});

describe('Mirror and MirrorB', () => {
  it('Mirror: plays the card the opponent played last, and spends the Mirror', () => {
    hands(['Mirror'], ['Haste', 'Freeze']);
    let p = fromFen('4k3/8/8/8/8/8/8/RN2K3 b - - 0 1');
    expect(tags(play(p, 'Ke8-f8'))).toEqual([]); // nothing played yet: nothing to copy
    p = play(play(p, 'Ke8-d8!H'), '--');
    expect(p.last).toEqual([undefined, 'Haste']);
    expect(toFen(p).split(' ')[6]).toBe('u0.1/y.Haste');
    expect(card(p, '!Y').every(l => l.endsWith('!H!Y'))).toBe(true);
    const q = play(p, 'Ra1-a5!H!Y');
    expect([q.turn, q.haste, q.used, q.last]).toEqual([WHITE, parseSq('a5'), [1, 1], ['Haste', 'Haste']]);
    legalSame(p);
  });

  it('Mirror copies a mark with its own rules, and records the card it played as', () => {
    hands(['Mirror'], ['Freeze']);
    let p = play(play(fromFen('4k3/8/3n4/8/8/8/P7/4K3 b - - 0 1'), '!F:a2'), 'Ke8-f8');
    p = play(p, '!F:d6!Y');
    expect([p.turn, p.free, p.marks?.[WHITE]?.sq, p.last]).toEqual([WHITE, true, parseSq('d6'), ['Freeze', 'Freeze']]);
    expect(tags(p)).toEqual([]); // then the ordinary move, no second card
  });

  it('MirrorB: plays another card of the hand, which stays; never a Mirror', () => {
    hands(['MirrorB', 'Freeze', 'Mirror'], []);
    const pos = fromFen('4k3/8/3n4/8/8/8/P7/4K3 w - - 0 1');
    expect(card(pos, '!Z')).toEqual(['!F:d6!Z']);
    const p = play(play(play(pos, '!F:d6!Z'), 'a2-a3'), 'Ke8-f8');
    expect(p.used).toEqual([0b001, 0]);
    expect(card(p, '!F:')).toEqual(['!F:d6']); // the Freeze card is still in the hand
    expect(card(p, '!Z')).toEqual([]);
    legalSame(pos);
  });

  it('texts, and the other side unaffected', () => {
    expect(cardText('Mirror')).toBe('play the card your opponent played last, as if it were in your hand');
    expect(cardText('MirrorB')).toBe('play another card from your hand; it stays in your hand');
    hands(['Mirror', 'MirrorB', 'Haste'], []);
    expect(tags(fromFen('4k3/8/8/8/8/8/8/R3K3 b - - 0 1 yHaste.'))).toEqual([]);
  });
});

describe('Firewall and FirewallB', () => {
  it('Firewall: none of the side\'s pieces can be taken, cursed or swapped on the opponent\'s next turn; then its move', () => {
    hands(['Firewall'], ['Curse', 'FirewallB']);
    const pos = fromFen('4k3/8/8/3r4/2P5/1n6/R7/N3K3 w - - 0 1');
    const takes = (q: Position): string[] => lans(q).filter(l => l.includes('x') || l.includes('*'));
    // Without the Firewall, Black takes the rook on d2, curses and swaps White's pieces.
    const open = play(pos, 'Ra2-d2');
    expect([takes(open).length > 0, card(open, '!C:').length > 0, card(open, '!E:').length > 0]).toEqual([true, true, true]);
    let p = play(pos, '!P');
    expect([p.turn, p.free, p.marks?.[WHITE]]).toEqual([WHITE, true, { sq: parseSq('e1'), ward: true, all: true }]);
    expect(toFen(p).split(' ')[6]).toBe('u1.0/me1wa/f');
    fenSame(p);
    p = play(p, 'Ra2-d2'); // into the rook's file: it cannot be taken
    expect([takes(p), card(p, '!C:'), card(p, '!E:')]).toEqual([[], [], []]);
    const after = play(p, 'Ke8-f8');
    expect(after.marks).toBeUndefined(); // one turn
    legalSame(p);
  });

  it('Firewall leaves check alone: the king still gives and receives check, and a checker cannot be taken', () => {
    hands(['Firewall'], []);
    // The rook checks next to the king, which may not take it: it must step away.
    const p = play(play(fromFen('1k6/8/8/8/8/8/8/R3K3 w - - 0 1'), '!P'), 'Ra1-a8');
    expect(inCheck(p)).toBe(true);
    expect(lans(p)).toEqual(['Kb8-b7', 'Kb8-c7']);
    hands(['Firewall'], []);
    const checked = fromFen('4k3/8/8/8/8/8/8/r3K3 w - - 0 1');
    expect(card(checked, '!P')).toEqual([]); // a free mark changes no square, so it cannot answer check
    hands(['Firewall'], [], { markFree: false });
    expect(play(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), '!P').turn).toBe(BLACK);
  });

  it('FirewallB: an own piece and an enemy piece next to it trade squares; no kings, no pawn to the last rank, no warded piece', () => {
    hands(['FirewallB'], []);
    const pos = fromFen('8/8/8/1k1p4/2N5/8/5n2/4K3 w - - 0 1');
    expect(card(pos, '!E:')).toEqual(['!E:c4<>d5']); // the kings neither swap nor are swapped
    const p = play(pos, '!E:c4<>d5');
    expect([typeOf(at(p, 'd5')), at(p, 'd5') >> 4, typeOf(at(p, 'c4')), at(p, 'c4') >> 4, p.turn]).toEqual([N, WHITE, P, BLACK, BLACK]);
    expect(card(fromFen('3rk3/2P5/8/8/8/8/8/4K3 w - - 0 1'), '!E:')).toEqual([]); // the pawn would land on the last rank
    hands(['FirewallB'], ['IceWall']);
    const warded = play(play(fromFen('4k3/8/8/3p4/2N5/8/8/4K3 b - - 0 1'), '!W:d5'), 'Ke8-f8');
    expect(card(warded, '!E:')).toEqual([]);
    legalSame(pos);
  });

  it('FirewallB is tested for check: an enemy piece moved next to our king may attack it', () => {
    hands(['FirewallB'], []);
    // Swapping the knight with the rook puts the rook next to the king, on its file.
    const pos = fromFen('4k3/8/8/8/8/5r2/4N3/4K3 w - - 0 1');
    expect(card(pos, '!E:')).toEqual([]);
    legalSame(pos);
  });

  it('texts, and the other side unaffected', () => {
    setRules();
    expect(cardText('Firewall', { ...DEFAULT_RULES, markFree: true })).toBe('none of your pieces can be taken on your opponent’s next turn; then make your move');
    expect(cardText('Firewall')).toBe('as your move, none of your pieces can be taken on your opponent’s next turn');
    expect(cardText('FirewallB')).toBe('swap one of your pieces (not the king) with an enemy piece (not the king) next to it');
    hands(['Firewall', 'FirewallB'], []);
    expect(tags(fromFen('4k3/8/8/3p4/2N5/8/8/4K3 b - - 0 1'))).toEqual([]);
  });
});

describe('EarthQuake and EarthQuakeB', () => {
  it('pushes every piece next to the square one square away, where the square beyond is empty; never a king', () => {
    hands(['EarthQuake'], []);
    // Around d4: the knight on c4 to b4, the pawn on d5 to d6, the bishop on e3 stays (f2 is taken).
    const pos = fromFen('4k3/8/8/3p4/2N5/4B3/5P2/4K3 w - - 0 1');
    const p = play(pos, '!Q:d4');
    expect([typeOf(at(p, 'b4')), typeOf(at(p, 'd6')), typeOf(at(p, 'e3')), at(p, 'c4'), at(p, 'd5')]).toEqual([N, P, B, 0, 0]);
    expect([p.turn, p.used, p.halfmove]).toEqual([BLACK, [1, 0], 0]); // a pushed pawn resets the clock
    expect(toFen(p)).toBe('4k3/8/3p4/8/1N6/4B3/5P2/4K3 b - - 0 1 u1.0');
    // A king is not pushed, and a piece in the corner does not leave the board: nothing moves here.
    expect(card(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), '!Q:')).toEqual([]);
    legalSame(pos);
  });

  it('a pawn is not pushed onto the first or last rank, nor a frozen piece, and a push may not expose our king', () => {
    hands(['EarthQuake'], []);
    expect(card(fromFen('4k3/8/8/8/8/8/1P6/4K3 w - - 0 1'), '!Q:').some(l => /!Q:(a3|b3|c3)$/.test(l))).toBe(false);
    // The bishop on e2 shields the king from the rook on e8; quakes that push it off the file are illegal.
    const pin = fromFen('4r1k1/8/8/8/8/8/4B3/4K3 w - - 0 1');
    expect(card(pin, '!Q:').some(l => /!Q:(d2|f2|d3|e3|f3|d1|f1)$/.test(l))).toBe(false);
    expect(card(pin, '!Q:')).toContain('!Q:e1'); // up the file, from the king's own square
    legalSame(pin);
    hands(['EarthQuake'], ['Freeze']);
    const frozen = play(play(fromFen('4k3/8/8/8/2N5/8/8/4K3 b - - 0 1'), '!F:c4'), 'Ke8-f8');
    expect(card(frozen, '!Q:')).toEqual([]); // the knight is the only piece to push, and it is frozen
    legalSame(frozen);
  });

  it('EarthQuakeB: only a square next to an own piece', () => {
    hands(['EarthQuakeB'], []);
    const pos = fromFen('4k3/3pp3/8/8/8/8/1R6/4K3 w - - 0 1');
    expect(card(pos, '!U:')).toEqual(['a1', 'a2', 'a3', 'b1', 'b3', 'c1', 'c2', 'c3'].map(s => `!U:${s}`)); // around the rook only
    hands(['EarthQuake'], []);
    expect(card(pos, '!Q:')).toContain('!Q:d8'); // the plain card shakes the pawns too
  });

  it('texts, and the other side unaffected', () => {
    expect(cardText('EarthQuake')).toMatch(/^choose a square: each piece next to it, except a king, is pushed/);
    expect(cardText('EarthQuakeB')).toMatch(/^choose a square next to one of your pieces/);
    hands(['EarthQuake', 'EarthQuakeB'], []);
    expect(tags(fromFen('4k3/8/8/3p4/2N5/8/8/4K3 b - - 0 1'))).toEqual([]);
  });
});

describe('Burn and FireStarter', () => {
  it('Burn: a piece takes an enemy on d4 e4 d5 e5 along a queen line; blockers count; only what its own move does not', () => {
    hands(['Burn'], []);
    const pos = fromFen('4k3/8/8/3n4/8/8/R7/3QK3 w - - 0 1');
    // The rook reaches d5 on the diagonal a2-d5 as a queen; the queen takes d5 by its own move.
    expect(card(pos, '!N')).toEqual(['Ra2xd5!N']);
    const p = play(pos, 'Ra2xd5!N');
    expect([typeOf(at(p, 'd5')), at(p, 'd5') >> 4, p.used]).toEqual([R, WHITE, [1, 0]]);
    expect(card(fromFen('4k3/8/8/3n4/2p5/8/R7/4K3 w - - 0 1'), '!N')).toEqual([]); // the pawn on c4 blocks
    expect(card(fromFen('4k3/8/8/8/3n4/8/R7/4K3 w - - 0 1'), '!N')).toEqual([]); // d4 is on none of the rook's queen lines
  });

  it('Burn refuses: a king, a guard, a piece outside the capital, a pawn as the burner', () => {
    hands(['Burn'], []);
    expect(card(fromFen('8/8/8/3k4/8/8/R7/4K3 w - - 0 1'), '!N')).toEqual([]);
    expect(card(fromFen('4k3/8/8/3g4/8/8/R7/4K3 w - - 0 1'), '!N')).toEqual([]);
    expect(card(fromFen('4k3/8/8/8/8/2n5/R7/4K3 w - - 0 1'), '!N')).toEqual([]);
    expect(card(fromFen('4k3/8/8/3n4/8/8/P7/4K3 w - - 0 1'), '!N')).toEqual([]); // a pawn on the a2-d5 line
  });

  it('FireStarter: takes on the enemy back rank as a queen would; Black takes on rank 1', () => {
    hands(['FireStarter'], ['FireStarter']);
    const pos = fromFen('1n2k2r/8/8/8/8/8/8/R2QK3 w - - 0 1');
    expect(card(pos, '!T')).toEqual(['Ra1xh8!T']);
    expect(card(fromFen('4k3/8/8/8/8/8/8/R3K1N1 b - - 0 1'), '!T')).toEqual([]); // Black has nothing to take with
    expect(card(fromFen('4k3/8/8/8/8/2r5/8/R3K3 b - - 0 1'), '!T')).toEqual(['Rc3xa1!T']);
    expect(card(fromFen('4k3/8/8/8/7N/8/8/4K2n w - - 0 1'), '!T')).toEqual([]); // its own back rank is not the zone
  });

  it('texts, and the other side unaffected', () => {
    expect(cardText('Burn')).toBe('one of your pieces (not a pawn or the king) takes an enemy piece on d4, e4, d5 or e5 as a queen would');
    expect(cardText('FireStarter')).toBe('one of your pieces (not a pawn or the king) takes an enemy piece on the enemy back rank as a queen would');
    hands(['Burn', 'FireStarter'], []);
    expect(tags(fromFen('R3k3/8/8/3N4/8/8/r7/4K3 b - - 0 1'))).toEqual([]);
  });
});

describe('Control', () => {
  it('a piece moves and takes as a friendly piece next to it; it keeps its type', () => {
    hands(['Control'], []);
    const pos = fromFen('4k3/1p6/8/8/8/8/8/RN2K3 w - - 0 1');
    // The knight moves as the rook (up the b-file, taking b7) and the rook as the knight.
    expect(card(pos, '!O').filter(l => l.startsWith('N'))).toEqual(['Nb1-b2!O', 'Nb1-b3!O', 'Nb1-b4!O', 'Nb1-b5!O', 'Nb1-b6!O', 'Nb1-c1!O', 'Nb1-d1!O', 'Nb1xb7!O']);
    expect(card(pos, '!O').filter(l => l.startsWith('R'))).toEqual(['Ra1-b3!O', 'Ra1-c2!O']);
    const p = play(pos, 'Nb1xb7!O');
    expect([typeOf(at(p, 'b7')), p.used, p.turn]).toEqual([N, [1, 0], BLACK]);
    legalSame(pos);
  });

  it('refuses: a king or pawn lends nothing and borrows nothing; a guard moves but takes nothing; a lent shot or chain is the mover\'s', () => {
    hands(['Control'], []);
    expect(card(fromFen('4k3/8/8/8/8/8/1P6/1NK5 w - - 0 1'), '!O')).toEqual([]);
    // The guard moves as the rook beside it, past its own steps (b2, c1), and does not take the pawn on b3.
    const guard = fromFen('4k3/8/8/8/8/1p6/8/RG2K3 w - - 0 1');
    expect(card(guard, '!O').filter(l => l.startsWith('G'))).toEqual(['Gb1-d1!O']);
    // The knight next to an archer shoots as one, from its square (over the pawn on b2); the archer takes as a knight.
    const archer = fromFen('4k3/8/8/8/8/2p5/1P6/NA2K3 w - - 0 1');
    expect(card(archer, '!O')).toEqual(expect.arrayContaining(['Na1*c3!O', 'Ab1xc3!O']));
    legalSame(guard);
    legalSame(archer);
  });

  it('texts, and the other side unaffected', () => {
    expect(cardText('Control')).toBe('one of your pieces (not a pawn or the king) moves and takes this turn as a friendly piece next to it does');
    hands(['Control'], []);
    expect(tags(fromFen('4k3/8/8/8/8/8/8/RN2K3 b - - 0 1'))).toEqual([]);
  });
});

describe('Rescue', () => {
  it('renews the Freeze of the previous turn: it binds the opponent\'s next turn again', () => {
    hands(['Freeze', 'Rescue'], []);
    let p = play(play(fromFen('4k3/8/3n4/8/8/8/P6P/4K3 w - - 0 1'), '!F:d6'), 'a2-a3');
    expect(card(p, '!D:')).toEqual([]); // not on the frozen turn: it is Black's
    p = play(p, 'Ke8-f8');
    expect(p.marks?.[WHITE]).toEqual({ sq: parseSq('d6'), left: 0 }); // ended: binds nothing, waits for a Rescue
    expect(toFen(p).split(' ')[6]).toBe('u1.0/md6w0');
    fenSame(p);
    expect(card(p, '!D:')).toEqual(['!D:d6']);
    p = play(p, '!D:d6');
    expect([p.turn, p.free, p.marks?.[WHITE], p.used]).toEqual([WHITE, true, { sq: parseSq('d6') }, [0b11, 0]]);
    p = play(p, 'h2-h3');
    expect(lans(p).some(l => l.startsWith('Nd6'))).toBe(false); // frozen again
    legalSame(p);
    const q = play(p, 'Kf8-e8');
    expect([q.marks?.[WHITE]?.left, card(q, '!D:')]).toEqual([0, []]); // the Rescue is spent
  });

  it('refuses: no mark of the previous turn, or one let go; an ended mark binds nothing', () => {
    hands(['Freeze', 'Rescue'], []);
    expect(card(fromFen('4k3/8/3n4/8/8/8/P6P/4K3 w - - 0 1'), '!D:')).toEqual([]);
    let p = play(play(play(fromFen('4k3/8/3n4/8/8/8/P6P/4K3 w - - 0 1'), '!F:d6'), 'a2-a3'), 'Ke8-f8');
    p = play(p, 'h2-h3'); // White lets the chance go
    expect(p.marks).toBeUndefined();
    expect(card(play(p, 'Kf8-e8'), '!D:')).toEqual([]);
    // Black's turn with White's ended mark on d6: the knight moves.
    hands(['Rescue'], []);
    expect(lans(fromFen('4k3/8/3n4/8/8/8/8/4K3 b - - 0 1 md6w0')).some(l => l.startsWith('Nd6'))).toBe(true);
  });

  it('under two-turn marks it adds a turn to a live one; it renews an Ice Wall and a Firewall too', () => {
    hands(['Freeze', 'Rescue'], [], { markTurns: 2 });
    let p = play(play(play(fromFen('4k3/8/3n4/8/8/8/P6P/4K3 w - - 0 1'), '!F:d6'), 'a2-a3'), 'Ke8-f8');
    expect(p.marks?.[WHITE]).toEqual({ sq: parseSq('d6') });
    p = play(p, '!D:d6');
    expect(p.marks?.[WHITE]).toEqual({ sq: parseSq('d6'), left: 2 });
    hands(['Firewall', 'Rescue'], []);
    p = play(play(play(fromFen('4k3/8/8/3r4/8/8/R6P/4K3 w - - 0 1'), '!P'), 'Ra2-d2'), 'Ke8-f8');
    p = play(play(p, '!D:e1'), 'h2-h3');
    expect(p.marks?.[WHITE]).toEqual({ sq: parseSq('e1'), ward: true, all: true });
    expect(lans(p)).not.toContain('Rd5xd2');
  });

  it('texts, and the other side unaffected', () => {
    expect(cardText('Rescue', { ...DEFAULT_RULES, markFree: true })).toBe('your Freeze, Ice Wall or Firewall from your previous turn lasts one more turn; then make your move');
    hands(['Freeze', 'Rescue'], []);
    expect(tags(fromFen('4k3/8/3n4/8/8/8/8/4K3 b - - 0 1 mb2b0'))).toEqual([]); // Black's own ended mark, but no card
  });
});

describe('Growth and GrowthB', () => {
  it('Growth: as the turn, the next card of the pile joins the hand, to be played later', () => {
    hands(['Growth'], [], { piles: [['Haste', 'Freeze'], ['Strike']] });
    let p = play(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), '!G');
    expect([p.turn, p.used, p.drawn]).toEqual([BLACK, [1, 0], [1, 0]]);
    expect(toFen(p).split(' ')[6]).toBe('u1.0/d1.0');
    fenSame(p);
    expect(tags(p)).toEqual([]); // Black holds no Growth: its pile stays
    p = play(p, 'Ke8-f8');
    expect(tags(p)).toEqual(['haste']); // the drawn Haste, and no second Growth
    p = play(play(p, 'Ra1-a5!H'), '--');
    expect(p.used).toEqual([0b11, 0]);
  });

  it('GrowthB: draw, then make the move; nothing when the pile is empty or the hand full', () => {
    hands(['GrowthB'], [], { piles: [['Freeze'], []] });
    const p = play(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), '!G+');
    expect([p.turn, p.free, p.drawn]).toEqual([WHITE, true, [1, 0]]);
    expect(tags(p)).toEqual([]);
    expect(play(p, 'Ra1-a2').turn).toBe(BLACK);
    hands(['GrowthB'], []);
    expect(card(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), '!G')).toEqual([]);
    hands(['GrowthB', 'Leap', 'Leap', 'Leap', 'Leap', 'Leap', 'Leap', 'Leap'], [], { piles: [['Freeze'], []] });
    expect(card(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 1'), '!G')).toEqual([]);
  });

  it('a drawn Strike or Salvation keeps a dead draw open', () => {
    hands(['Growth'], [], { piles: [['Strike'], []] });
    const dead = fromFen('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1');
    expect(materialDraw(dead.board, dead.used, dead.lost, dead.waiting, dead.drawn)).toBe(false);
    hands(['Growth'], [], { piles: [['Haste'], []] });
    expect(materialDraw(dead.board, dead.used, dead.lost, dead.waiting, dead.drawn)).toBe(true);
  });

  it('texts, parsing, and the other side unaffected', () => {
    expect(cardText('Growth')).toBe('as your move, draw the next card');
    expect(cardText('GrowthB')).toBe('draw the next card, then make your move');
    expect(parseRule('piles=Haste+freeze,Strike')).toEqual({ piles: [['Haste', 'Freeze'], ['Strike']] });
    expect(parseRule('hands=rage+RageB+mirror+mirrorb+firewall+firewallb+earthquake+earthquakeb+burn+firestarter+control+rescue+growth+growthb').hands![0]).toHaveLength(14);
    hands(['Growth'], [], { piles: [['Haste'], ['Haste']] });
    expect(tags(fromFen('4k3/8/8/8/8/8/8/R3K3 b - - 0 1'))).toEqual([]);
  });
});

describe('every 2014 card move round-trips', () => {
  // A position per card where it has moves, with its rules; every card move and every second move
  // after a Rage is made by the engine and by the search, written and read back as FEN, and replayed
  // from its notation.
  const CASES: [CardName[], CardName[], string, object?][] = [
    [['Rage'], [], '4k3/8/p7/8/8/8/8/R3K2n w - - 0 1'],
    [['RageB'], [], '4k3/8/p7/8/8/8/8/R3K2n w - - 0 1'],
    [['Mirror'], ['Haste'], '4k3/8/8/8/8/8/8/RN2K3 w - - 0 1 u0.1/y.Haste'],
    [['MirrorB', 'Freeze', 'Sacrifice'], [], '4k3/8/3n4/8/8/8/P7/4K3 w - - 0 1 lQ'],
    [['Firewall'], [], '4k3/8/8/3r4/8/1n6/R7/N3K3 w - - 0 1'],
    [['FirewallB'], [], '4k3/8/8/3pp3/2NB4/8/8/4K3 w - - 0 1'],
    [['EarthQuake'], [], '4k3/8/8/3p4/2N5/4B3/5P2/4K3 w - - 0 1'],
    [['EarthQuakeB'], [], '4k3/8/8/3p4/2N5/4B3/5P2/4K3 w - - 0 1'],
    [['Burn'], [], '4k3/8/8/3n4/8/8/R7/3QK3 w - - 0 1'],
    [['FireStarter'], [], '1n2k2r/8/8/8/8/8/8/R2QK3 w - - 0 1'],
    [['Control'], [], '4k3/1p6/8/8/8/2p5/8/RNA1K3 w - - 0 1'],
    [['Freeze', 'Rescue'], [], '4k3/8/3n4/8/8/8/P6P/4K3 w - - 0 1 u1.0/md6w0'],
    [['Growth'], [], '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', { piles: [['Haste'], []] }],
    [['GrowthB'], [], '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', { piles: [['Haste'], []] }],
  ];
  for (const [w, b, fen, more] of CASES) {
    it(w.join('+'), () => {
      hands(w, b, { hasteCaptures: false, strikeCaptures: false, ...more });
      const pos = fromFen(fen);
      const moves = legalMoves(pos).filter(m => m.power && !(['freeze', 'sacrifice'] as string[]).includes(m.power) || m.via);
      expect(moves.length, fen).toBeGreaterThan(0);
      const check = (from: Position, m: Move, pre: string[]): Position => {
        const next = makeMove(from, m), lan = toLan(from, m);
        const { after, back } = probeApply(from, m);
        expect([after, back], `${toFen(from)} ${lan}`).toEqual([positionKey(next), positionKey(from)]);
        fenSame(next);
        expect(positionKey(fromFen(toFen(next)))).toBe(positionKey(next));
        const { end, events } = replayRecord({ gameId: 0, startFen: fen, moves: [...pre, lan].map(l => ({ lan: l })) });
        expect(toFen(end)).toBe(toFen(next));
        if (m.power) expect(Object.keys(events.powers).length, lan).toBeGreaterThan(0);
        return next;
      };
      for (const m of moves) {
        const next = check(pos, m, []);
        // A Rage's second moves (and a free action's ordinary moves) too.
        if (next.turn === pos.turn) for (const m2 of legalMoves(next).slice(0, 12)) check(next, m2, [toLan(pos, m)]);
      }
    });
  }
});

describe('random games with the 2014 cards', () => {
  it('keep the search key, FEN and replay in step, every card played', () => {
    const NEW: CardName[] = ['Rage', 'RageB', 'Mirror', 'MirrorB', 'Firewall', 'FirewallB', 'EarthQuake', 'EarthQuakeB', 'Burn', 'FireStarter', 'Control', 'Rescue', 'Growth', 'GrowthB'];
    const played = new Set<string>();
    let seed = 11;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    for (let g = 0; g < 28; g++) {
      // Six cards each, from the new ones and the marks Rescue renews; the rest of them is the pile.
      const deck = [...NEW, 'Freeze', 'IceWall', 'Haste'] as CardName[];
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      const hand = deck.slice(0, 6), pile = deck.slice(6);
      hands(hand, g % 2 ? [...hand].reverse() : hand, { piles: [pile, pile], hasteCaptures: false, strikeCaptures: false, markTurns: g % 4 === 3 ? 2 : 1 });
      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
      let pos = fromFen(startFen);
      const record: string[] = [];
      for (let ply = 0; ply < 70 && legalMoves(pos).length; ply++) {
        const moves = legalMoves(pos);
        const all = moves.map(m => toLan(pos, m));
        expect(new Set(all).size, toFen(pos)).toBe(all.length);
        const powered = moves.filter(m => m.power || m.pass);
        const m = powered.length && rng() < 0.5 ? powered[Math.floor(rng() * powered.length)] : moves[Math.floor(rng() * moves.length)];
        if (m.power) played.add(m.via ?? m.power);
        const { after, back } = probeApply(pos, m);
        const next = makeMove(pos, m);
        expect(after, `${toFen(pos)} ${toLan(pos, m)}`).toBe(positionKey(next));
        expect(back).toBe(positionKey(pos));
        fenSame(next);
        expect(positionKey(fromFen(toFen(next)))).toBe(positionKey(next));
        record.push(toLan(pos, m));
        pos = next;
      }
      expect(toFen(replayRecord({ gameId: g, startFen, moves: record.map(lan => ({ lan })) }).end)).toBe(toFen(pos));
    }
    for (const t of ['rage', 'rageb', 'mirror', 'mirrorb', 'firewall', 'firewallb', 'quake', 'quakeb', 'control', 'rescue', 'growth', 'growthb']) expect(played).toContain(t);
  }, 60_000);
});

describe('the 2014 cards and the kings', () => {
  it('no card takes, pushes or swaps a king; only a raged king moves itself', () => {
    const all: CardName[] = ['Rage', 'RageB', 'Firewall', 'FirewallB', 'EarthQuake', 'EarthQuakeB', 'Burn', 'FireStarter', 'Control', 'Growth'];
    hands(all.slice(0, 5), all.slice(5), { piles: [['Haste'], ['Haste']] });
    for (const fen of ['3k4/3p4/2N1q3/3K4/8/8/8/R6B w - - 0 1', '3k4/3pr3/2N5/3K4/8/8/8/7B b - - 0 1', 'r3k2r/2n5/8/3QK3/8/8/8/R6R w - - 0 1']) {
      const pos = fromFen(fen);
      const cards = legalMoves(pos).filter(m => m.power);
      expect(cards.length, fen).toBeGreaterThan(0);
      for (const m of cards) {
        const kings = [...m.captures, ...(m.pushes ?? []).map(p => p.from), ...(m.swap ? [m.to] : [])].filter(s => typeOf(pos.board[s]) === K);
        expect(kings, `${fen} ${toLan(pos, m)}`).toEqual([]);
        if (typeOf(pos.board[m.from]) === K && m.from !== m.to) expect(m.power, toLan(pos, m)).toMatch(/^rage/);
      }
    }
  });
});
