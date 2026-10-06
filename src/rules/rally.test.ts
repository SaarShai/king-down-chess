/**
 * The Rally card (card mode, lab, 2026-10-05; working name): one own piece moves, then a different
 * own piece may move; neither move captures. Its pending second move reuses Haste's and Rage's
 * (`Position.haste`, `Position.rage` 3, FEN `hd4o`).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, Move, Position, WHITE, legalMoves, makeMove, parseSq } from './engine';
import { fromFen, toFen, toLan } from './setup';
import { CARD_ONLY, CardName, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, searchLegal } from '../ai/search';
import { replayRecord } from '../sim/replay';
import { cardText } from '../powers-ui';

const hands = (white: CardName[], black: CardName[]): void => { setRules({ hands: [white, black], markFree: true, hasteCaptures: false }); };
const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
const play = (pos: Position, lan: string): Position => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return makeMove(pos, m);
};

afterEach(() => { setRules(); resetSearchState(); });

describe('Rally', () => {
  const START = '4k3/8/p7/8/8/2p5/8/RN2K3 w - - 0 1';

  it('one piece moves, then a different piece; neither move takes', () => {
    hands(['Rally'], []);
    const pos = fromFen(START);
    const first = lans(pos).filter(l => l.endsWith('!J'));
    expect(first).toEqual(expect.arrayContaining(['Ra1-a5!J', 'Nb1-d2!J', 'Ke1-d1!J'])); // the king too, as Haste allows
    expect(first.some(l => l.includes('x'))).toBe(false); // Ra1xa6 and Nb1xc3 are ordinary moves, not Rally ones
    const p = play(pos, 'Ra1-a5!J');
    expect([p.turn, p.haste, p.rage, p.used]).toEqual([WHITE, parseSq('a5'), 3, [1, 0]]);
    const second = lans(p);
    expect(second).toEqual(expect.arrayContaining(['Nb1-d2', 'Ke1-d1', '--']));
    expect(second.some(l => l.startsWith('Ra5'))).toBe(false); // not the same piece twice
    expect(second.some(l => l.includes('x'))).toBe(false); // Nb1xc3 is refused
    expect(lans(p, searchLegal(p))).toEqual(second);
    const q = play(p, 'Nb1-d2');
    expect([q.turn, q.haste, q.rage]).toEqual([BLACK, undefined, undefined]);
    expect(lans(play(q, 'Ke8-d8')).some(l => l.endsWith('!J'))).toBe(false); // one use
  });

  it('the second move may be skipped', () => {
    hands(['Rally'], []);
    const q = play(play(fromFen(START), 'Ra1-a5!J'), '--');
    expect([q.turn, q.haste, q.rage, q.board[parseSq('a5')] !== 0, q.board[parseSq('b1')] !== 0]).toEqual([BLACK, undefined, undefined, true, true]);
  });

  it('refuses a swap that moves the rallied piece again', () => {
    hands(['Rally'], []);
    const p = play(fromFen('4k3/8/8/8/8/8/8/RM2K3 w - - 0 1'), 'Ra1-a2!J');
    expect(lans(fromFen('4k3/8/8/8/8/8/R7/1M2K3 w - - 0 1'))).toContain('Mb1<>a2'); // an ordinary swap
    expect(lans(p)).not.toContain('Mb1<>a2');
    expect(lans(p)).toContain('Mb1-b2');
  });

  it('keeps its pending move in FEN, the search key and replay', () => {
    hands(['Rally'], []);
    const pos = fromFen(START);
    const m = legalMoves(pos).find(x => toLan(pos, x) === 'Ra1-a5!J')!;
    const p = makeMove(pos, m);
    expect(toFen(p).split(' ')[6]).toBe('u1.0/ha5o');
    const back = fromFen(toFen(p));
    expect([back.haste, back.rage]).toEqual([p.haste, 3]);
    expect(positionKey(back)).toBe(positionKey(p));
    expect(positionKey({ ...p, rage: 1 })).not.toBe(positionKey(p)); // not a Rage's pending move
    expect(probeApply(pos, m)).toEqual({ after: positionKey(p), back: positionKey(pos) });
    const n = legalMoves(p).find(x => toLan(p, x) === 'Nb1-d2')!;
    expect(probeApply(p, n)).toEqual({ after: positionKey(makeMove(p, n)), back: positionKey(p) });
    const { end, events } = replayRecord({ gameId: 0, startFen: START, moves: ['Ra1-a5!J', 'Nb1-d2'].map(lan => ({ lan })) });
    expect(toFen(end)).toBe(toFen(makeMove(p, n)));
    expect(events.powers.rally).toEqual([1, 0]);
  });

  it('is the last card (its hash slot), with its text and its flag', () => {
    expect(CARD_ONLY.at(-1)).toBe('Rally');
    expect(parseRule('hands=rally').hands![0]).toEqual(['Rally']);
    expect(cardText('Rally')).toBe('move one of your pieces, then a different one (the second move is optional); neither move captures');
  });
});
