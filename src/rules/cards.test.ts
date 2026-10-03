/**
 * Card mode (lab): each side holds a hand of one-use cards, each one use of a spendable power or a
 * card no king has (Mimic, Vault, Curse, SkyLift), at most one a turn. Generation, the played-card
 * bits in `Position.used`, the Ice Wall flag, FEN, and the search's incremental key.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, K, Move, N, Position, WHITE, inCheck, legalMoves, makeMove, materialDraw, parseSq, status, typeOf } from './engine';
import { fromFen, randomBackRank, toFen, toLan } from './setup';
import { CardName, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, search, searchLegal } from '../ai/search';
import { mulberry32 } from '../sim/rng';

const hands = (white: CardName[], black: CardName[], more = {}): void => { setRules({ hands: [white, black], markFree: true, ...more }); };
const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
const play = (pos: Position, lan: string): Position => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return makeMove(pos, m);
};
const tags = (pos: Position): string[] => [...new Set(legalMoves(pos).map(m => m.power ?? ''))].filter(Boolean).sort();

afterEach(() => { setRules(); resetSearchState(); });

describe('card mode', () => {
  it('parses hands: one hand for both sides, or one each', () => {
    expect(parseRule('hands=Freeze+haste')).toEqual({ hands: [['Freeze', 'Haste'], ['Freeze', 'Haste']] });
    expect(parseRule('hands=Flight,IceWall+Leap')).toEqual({ hands: [['Flight'], ['IceWall', 'Leap']] });
    expect(() => parseRule('hands=Mercy')).toThrow(/not a one-use power/);
    expect(parseRule('hands=mimic+Vault,curse+SKYLIFT')).toEqual({ hands: [['Mimic', 'Vault'], ['Curse', 'SkyLift']] });
  });

  it('offers every unplayed card, one a turn, and each card once', () => {
    hands(['Freeze', 'IceWall', 'Haste'], ['Flight']);
    let p = fromFen('4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1');
    expect(tags(p)).toEqual(['freeze', 'haste', 'ward']);
    p = play(p, '!F:d5');
    expect(p.used).toEqual([0b001, 0]);
    expect(p.turn).toBe(WHITE);
    expect(tags(p)).toEqual([]); // a free mark, then the ordinary move: no second card
    p = play(p, 'a2-a3');
    expect(lans(p).some(l => l.startsWith('Nd5'))).toBe(false); // frozen for Black's turn
    expect(tags(p)).toEqual(['flight']);
    p = play(p, 'a7-a6');
    expect(tags(p)).toEqual(['haste', 'ward']); // Freeze is played
    p = play(p, '!W:a3');
    expect(p.used).toEqual([0b011, 0]);
    expect(p.marks?.[WHITE]?.ward).toBe(true);
    expect(toFen(p).split(' ')[6]).toBe('u3.0/ma3wi/f');
    expect(fromFen(toFen(p)).marks?.[WHITE]?.ward).toBe(true);
  });

  it('a hand may hold two copies: each is played on its own', () => {
    hands(['Haste', 'Haste'], []);
    let p = fromFen('4k3/8/8/8/8/8/P7/R3K3 w - - 0 1');
    p = play(play(p, 'Ra1-b1!H'), '--');
    expect(p.used).toEqual([0b01, 0]);
    p = play(p, 'Ke8-f8');
    expect(tags(p)).toEqual(['haste']);
    p = play(play(p, 'Rb1-c1!H'), '--');
    expect(p.used).toEqual([0b11, 0]);
    p = play(p, 'Kf8-e8');
    expect(tags(p)).toEqual([]);
  });

  it('a Freeze and an Ice Wall from one hand bind differently', () => {
    hands(['Freeze', 'IceWall'], []);
    const start = fromFen('4k3/8/8/8/R7/8/2b5/4K3 w - - 0 1');
    const warded = play(play(start, '!W:a4'), '--');
    expect(lans(warded)).not.toContain('Bc2xa4');
    const frozen = play(play(start, '!F:c2'), '--');
    expect(lans(frozen).some(l => l.startsWith('Bc2'))).toBe(false);
    expect(positionKey(warded)).not.toBe(positionKey({ ...warded, marks: [{ sq: warded.marks![WHITE]!.sq }, undefined] }));
  });

  it('a side bound by a mark cannot lift it by marking back', () => {
    hands(['Freeze'], ['Freeze']);
    let p = play(play(fromFen('4k3/8/8/3n4/8/8/P6P/4K3 w - - 0 1'), '!F:d5'), 'a2-a3');
    p = play(p, '!F:a3'); // Black freezes White's pawn: the knight stays frozen this turn
    expect(lans(p).some(l => l.startsWith('Nd5'))).toBe(false);
    expect(toFen(p).split(' ')[6]).toBe('u1.1/md5w/ma3b/f');
    p = play(p, 'Ke8-f8');
    expect(lans(p).some(l => l.startsWith('a3'))).toBe(false); // and White's pawn is frozen now
    hands(['IceWall'], ['IceWall']);
    let q = play(play(fromFen('4k3/8/8/3n4/8/2R5/P7/4K3 w - - 0 1'), '!W:c3'), 'a2-a3');
    q = play(q, '!W:d5');
    expect(lans(q)).not.toContain('Nd5xc3');
  });

  it('refuses a hand beside a spendable king power on the same side', () => {
    expect(() => setRules({ hands: [['Haste'], []], kings: [{ king: 'Flame', power: 'Strike' }, null] })).toThrow(/card mode/);
    expect(() => setRules({ hands: [['Haste'], []], kings: [{ king: 'Spirit', power: 'Mercy' }, null] })).not.toThrow();
  });

  it('two Sacrifice cards hold what one does, so the search still cashes one in', () => {
    hands(['Sacrifice', 'Sacrifice'], []);
    const pos = fromFen('4k3/8/8/8/8/8/P6P/4K3 w - - 0 1 lQ');
    expect(toLan(pos, search(pos, { maxDepth: 3 }).move!)).toMatch(/^!S:/);
  });

  it('the played cards are part of the position', () => {
    hands(['Freeze', 'IceWall'], []);
    const p = fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
    expect(positionKey({ ...p, used: [0b01, 0] })).not.toBe(positionKey({ ...p, used: [0b10, 0] }));
    expect(positionKey({ ...p, used: [0b01, 0] })).not.toBe(positionKey(p));
  });

  it('random games keep the search key, FEN and the played cards in step', () => {
    const pool: CardName[] = ['Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap', 'Mimic', 'Vault', 'Curse', 'SkyLift'];
    let seed = 7;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    for (let g = 0; g < 24; g++) {
      const hand = pool.filter((_, i) => (g * 37 + i * 11) % 3 !== 0);
      hands(hand, [...hand].reverse(), { hasteCaptures: false, strikeCaptures: false });
      // Every other game on a fairy army, so Mimic borrows the fairy pieces' moves too.
      const rank = g % 2 ? randomBackRank(mulberry32(g)) : 'RNBQKBNR';
      let pos = fromFen(`${rank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${rank} w - - 0 1`);
      for (let ply = 0; ply < 60 && status(pos) === 'playing'; ply++) {
        const moves = legalMoves(pos);
        const all = moves.map(m => toLan(pos, m));
        expect(new Set(all).size, toFen(pos)).toBe(all.length); // a move is found again by its notation
        const powered = moves.filter(m => m.power || m.pass);
        const m = powered.length && rng() < 0.4 ? powered[Math.floor(rng() * powered.length)] : moves[Math.floor(rng() * moves.length)];
        const { after, back } = probeApply(pos, m);
        const next = makeMove(pos, m);
        expect(after, `${toFen(pos)} ${toLan(pos, m)}`).toBe(positionKey(next));
        expect(back).toBe(positionKey(pos));
        expect(fromFen(toFen(next)).used ?? [0, 0], toFen(next)).toEqual(next.used ?? [0, 0]);
        // Only the bits of cards a side holds are ever set.
        for (const c of [WHITE, BLACK]) expect((next.used?.[c] ?? 0) >> hand.length).toBe(0);
        pos = next;
      }
    }
  });

  it('the search plays a card when it wins material', () => {
    hands(['Strike'], [], { strikeCaptures: true });
    // The rook cannot reach d4 by its own move; a Strike moves it as a queen and takes the knight.
    const pos = fromFen('4k3/8/8/8/3n4/8/8/R3K3 w - - 0 1');
    const best = search(pos, { maxDepth: 2 }).move!;
    expect(toLan(pos, best)).toMatch(/!$/);
  });
});

describe('the card-only cards', () => {
  const card = (pos: Position, suffix: string): string[] => lans(pos).filter(l => l.includes(suffix));
  const legalSame = (pos: Position): void => { expect(lans(pos, searchLegal(pos))).toEqual(lans(pos)); };

  it('Mimic: a piece moves to an empty square the way another of its own types moves', () => {
    hands(['Mimic'], []);
    const pos = fromFen('4k3/8/8/1n6/8/8/8/RN2K3 w - - 0 1');
    // The knight moves as the rook, blocked by the enemy knight it may not take; the rook as the knight.
    expect(card(pos, '!X').filter(l => l.startsWith('N'))).toEqual(['Nb1-b2!X', 'Nb1-b3!X', 'Nb1-b4!X', 'Nb1-c1!X', 'Nb1-d1!X']);
    expect(card(pos, '!X').filter(l => l.startsWith('R'))).toEqual(['Ra1-b3!X', 'Ra1-c2!X']);
    const next = play(pos, 'Nb1-b4!X');
    expect([typeOf(next.board[parseSq('b4')]), next.used, next.turn]).toEqual([N, [1, 0], BLACK]);
    legalSame(pos);
  });

  it('Mimic: no captures, no square its own moves reach, one move per square, never a king or pawn shape', () => {
    hands(['Mimic'], []);
    // The rook borrows only the queen's diagonal (its own file and rank are its moves); the queen gets
    // nothing from the rook; the king and the pawn lend nothing and borrow nothing.
    const pos = fromFen('4k3/8/8/8/8/8/P7/R2QK3 w - - 0 1');
    expect(card(pos, '!X')).toEqual(['Ra1-b2!X', 'Ra1-c3!X', 'Ra1-d4!X', 'Ra1-e5!X', 'Ra1-f6!X', 'Ra1-g7!X', 'Ra1-h8!X']);
    expect(card(fromFen('4k3/8/8/8/8/8/P7/1N2K3 w - - 0 1'), '!X')).toEqual([]);
    // The rook borrows the knight's jump to b3, not its capture on c2.
    expect(card(fromFen('4k3/8/8/8/8/8/2b5/RN2K3 w - - 0 1'), '!X').filter(l => l.startsWith('R'))).toEqual(['Ra1-b3!X']);
  });

  it('Mimic: a frozen piece cannot use it', () => {
    hands(['Mimic'], ['Freeze']);
    const pos = play(play(fromFen('4k3/8/8/8/8/8/8/RN2K3 b - - 0 1'), '!F:b1'), 'Ke8-f8');
    expect(lans(pos).filter(l => l.startsWith('Nb1'))).toEqual([]);
    expect(card(pos, '!X')).toEqual(['Ra1-b3!X', 'Ra1-c2!X']);
    legalSame(pos);
  });

  it('Vault: a slider passes exactly one piece, of either side, and takes the first beyond it', () => {
    hands(['Vault'], []);
    const pos = fromFen('4k3/8/r7/8/8/n7/8/R3K3 w - - 0 1');
    expect(card(pos, '!V')).toEqual(['Ra1-a4!V', 'Ra1-a5!V', 'Ra1-f1!V', 'Ra1-g1!V', 'Ra1-h1!V', 'Ra1xa6!V']); // over a3, or over its own king
    expect(lans(pos)).toContain('Ra1-a2');
    expect(lans(pos)).toContain('Ra1xa3');
    expect(lans(pos)).not.toContain('Ra1-a2!V'); // its own move
    expect(lans(pos).some(l => l.startsWith('Ra1') && l.includes('a7'))).toBe(false); // a second piece stops it
    legalSame(pos);
  });

  it('Vault: never takes a king, a guard or a warded piece; it may land giving ordinary check', () => {
    hands(['Vault'], []);
    const file = (pos: Position): string[] => card(pos, '!V').filter(l => /^Ra1[-x]a/.test(l)); // up the a-file
    const king = fromFen('k7/8/p7/8/8/8/8/R5K1 w - - 0 1');
    expect(file(king)).toEqual(['Ra1-a7!V']);
    expect(inCheck(play(king, 'Ra1-a7!V'))).toBe(true);
    expect(file(fromFen('k7/8/g7/p7/8/8/8/R5K1 w - - 0 1'))).toEqual([]);
    hands(['Vault'], ['IceWall']);
    const warded = play(play(fromFen('4k3/8/r7/8/8/n7/8/R3K3 b - - 0 1'), '!W:a6'), 'Ke8-f8');
    expect(file(warded)).toEqual(['Ra1-a4!V', 'Ra1-a5!V']);
    legalSame(warded);
  });

  it('Vault and Leap in one hand: the same move twice, told apart by its notation', () => {
    hands(['Leap', 'Vault'], []);
    const pos = fromFen('4k3/8/8/8/8/8/P7/R3K3 w - - 0 1');
    expect(lans(pos)).toEqual(expect.arrayContaining(['Ra1-a3!L', 'Ra1-a3!V']));
    expect(play(pos, 'Ra1-a3!V').used).toEqual([0b10, 0]);
    expect(play(pos, 'Ra1-a3!L').used).toEqual([0b01, 0]);
  });

  it('Curse: an enemy piece steps one square onto an empty square; never a king, never into check on us', () => {
    hands(['Curse'], []);
    const pos = fromFen('4k3/8/8/3n4/8/8/P7/4K3 w - - 0 1');
    expect(card(pos, '!C:')).toEqual(['c4', 'c5', 'c6', 'd4', 'd6', 'e4', 'e5', 'e6'].map(s => `!C:d5-${s}`));
    const next = play(pos, '!C:d5-e5');
    expect([next.board[parseSq('e5')], next.turn, next.used, next.halfmove]).toEqual([pos.board[parseSq('d5')], BLACK, [1, 0], 1]);
    // From e4 the knight would check White's king from d3 or f3: those Curses are not legal.
    const near = fromFen('4k3/8/8/8/4n3/8/8/4K3 w - - 0 1');
    expect(card(near, '!C:')).toEqual(['d4', 'd5', 'e3', 'e5', 'f4', 'f5'].map(s => `!C:e4-${s}`));
    legalSame(near);
  });

  it('Curse: a pawn stays on ranks 2-7, its step resets the clock, and a Curse may answer a check', () => {
    hands(['Curse'], []);
    const pos = fromFen('4k3/6p1/8/8/8/8/1p6/4K3 w - - 7 20');
    expect(card(pos, '!C:').filter(l => /[18]$/.test(l))).toEqual([]);
    expect(card(pos, '!C:').filter(l => l.startsWith('!C:b2'))).toEqual(['!C:b2-a2', '!C:b2-a3', '!C:b2-b3', '!C:b2-c2', '!C:b2-c3']);
    expect(play(pos, '!C:b2-b3').halfmove).toBe(0);
    const check = fromFen('4k3/8/8/8/8/8/8/r3K3 w - - 0 1');
    expect(card(check, '!C:')).toEqual(['!C:a1-a2', '!C:a1-b2']);
    legalSame(check);
  });

  it('Curse: not a warded piece, nor one our own Freeze still holds', () => {
    hands(['Curse'], ['IceWall']);
    const warded = play(play(fromFen('4k3/7p/8/3n4/8/8/P7/4K3 b - - 0 1'), '!W:d5'), 'Ke8-f8');
    expect(card(warded, '!C:').some(l => l.startsWith('!C:d5'))).toBe(false);
    expect(card(warded, '!C:').some(l => l.startsWith('!C:h7'))).toBe(true);
    legalSame(warded);
    hands(['Freeze', 'Curse'], [], { markTurns: 2 });
    const held = play(play(play(fromFen('4k3/7p/8/3n4/8/8/P7/4K3 w - - 0 1'), '!F:d5'), 'a2-a3'), 'Ke8-f8');
    expect(held.marks?.[WHITE]?.sq).toBe(parseSq('d5'));
    expect(card(held, '!C:').some(l => l.startsWith('!C:d5'))).toBe(false);
    expect(card(held, '!C:').some(l => l.startsWith('!C:h7'))).toBe(true);
    legalSame(held);
  });

  it('SkyLift: two own pieces trade squares; no king, no pawn, not two of one type', () => {
    hands(['SkyLift'], []);
    const pos = fromFen('4k3/8/8/8/8/8/P7/RNB1K1N1 w - - 0 1');
    expect(card(pos, '!K:')).toEqual(['!K:a1<>b1', '!K:a1<>c1', '!K:a1<>g1', '!K:b1<>c1', '!K:c1<>g1']);
    const next = play(pos, '!K:a1<>g1');
    expect(toFen(next)).toBe('4k3/8/8/8/8/8/P7/NNB1K1R1 b - - 1 1 u1.0');
    expect(fromFen(toFen(next)).used).toEqual([1, 0]);
    legalSame(pos);
  });

  it('SkyLift: it moves no frozen piece, cannot answer a check, and lands a guard only where it may stand', () => {
    hands(['SkyLift'], ['Freeze']);
    const frozen = play(play(fromFen('4k3/8/8/8/8/8/8/RNB1K3 b - - 0 1'), '!F:b1'), 'Ke8-f8');
    expect(card(frozen, '!K:')).toEqual(['!K:a1<>c1']);
    legalSame(frozen);
    hands(['SkyLift'], []);
    // A swap empties no square, so it never opens a line: in check, no SkyLift is legal.
    expect(card(fromFen('4k3/4r3/8/8/8/8/8/RN2K3 w - - 0 1'), '!K:')).toEqual([]);
    expect(card(fromFen('4k3/8/8/8/8/8/1N6/G3K3 w - - 0 1'), '!K:')).toEqual(['!K:a1<>b2']);
    hands(['SkyLift'], [], { guardNoSecondRank: true });
    expect(card(fromFen('4k3/8/8/8/8/8/1N6/G3K3 w - - 0 1'), '!K:')).toEqual([]);
  });

  it('the cards leave the material draw alone and never touch a king', () => {
    hands(['Mimic', 'Vault', 'Curse', 'SkyLift'], ['Mimic', 'Vault', 'Curse', 'SkyLift']);
    const pos = fromFen('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1');
    expect(materialDraw(pos.board, pos.used)).toBe(true);
    for (const m of legalMoves(pos)) {
      if (!m.power) continue;
      expect(typeOf(pos.board[m.from])).not.toBe(K);
      expect(m.captures.some(s => typeOf(pos.board[s]) === K)).toBe(false);
    }
  });

  it('the search plays a Vault when it wins material', () => {
    hands(['Vault'], []);
    // Taking the knight on a3 loses the rook to the rook on a6; vaulting over the knight takes that rook.
    const pos = fromFen('4k3/8/r7/8/8/n7/8/R3K3 w - - 0 1');
    expect(toLan(pos, search(pos, { maxDepth: 2 }).move!)).toBe('Ra1xa6!V');
  });
});
