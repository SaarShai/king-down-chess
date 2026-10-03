/**
 * Card mode (lab): each side holds a hand of one-use cards, each one use of a spendable power, at
 * most one a turn. Generation, the played-card bits in `Position.used`, the Ice Wall flag, FEN, and
 * the search's incremental key.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, Move, Position, WHITE, legalMoves, makeMove, status } from './engine';
import { fromFen, toFen, toLan } from './setup';
import { PowerName, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, search } from '../ai/search';

const hands = (white: PowerName[], black: PowerName[], more = {}): void => { setRules({ hands: [white, black], markFree: true, ...more }); };
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
    expect(p.ward).toBe(true);
    expect(toFen(p).split(' ')[6]).toBe('u3.0/ma3w/i/f');
    expect(fromFen(toFen(p)).ward).toBe(true);
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
    expect(positionKey(warded)).not.toBe(positionKey({ ...warded, ward: undefined }));
  });

  it('the played cards are part of the position', () => {
    hands(['Freeze', 'IceWall'], []);
    const p = fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
    expect(positionKey({ ...p, used: [0b01, 0] })).not.toBe(positionKey({ ...p, used: [0b10, 0] }));
    expect(positionKey({ ...p, used: [0b01, 0] })).not.toBe(positionKey(p));
  });

  it('random games keep the search key, FEN and the played cards in step', () => {
    const pool: PowerName[] = ['Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap'];
    let seed = 7;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    for (let g = 0; g < 16; g++) {
      const hand = pool.filter((_, i) => (g * 37 + i * 11) % 3 !== 0);
      hands(hand, [...hand].reverse(), { hasteCaptures: false, strikeCaptures: false });
      let pos = fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
      for (let ply = 0; ply < 60 && status(pos) === 'playing'; ply++) {
        const moves = legalMoves(pos);
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
