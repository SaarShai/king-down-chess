/**
 * The turn counter (`Position.move`, the full-move number) and `Rules.fromMove` (lab, 2026-10-05): a
 * spendable king power or a card may not be used before the side's own move N.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, CardName, Move, Position, TAG_POWER, WHITE, legalMoves, makeMove } from './engine';
import { fromFen, startPosition, toFen, toLan } from './setup';
import { ALL_CARDS, parseRule, ruleDiff, setRules } from './rules';
import { positionKey, probeLegalAfter, resetSearchState, search, searchLegal } from '../ai/search';
import { replayRecord } from '../sim/replay';

const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
const play = (pos: Position, lan: string): Position => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return makeMove(pos, m);
};
const has = (pos: Position, mark: string): boolean => lans(pos).some(l => l.includes(mark));

afterEach(() => { setRules(); resetSearchState(); });

describe('the turn counter', () => {
  it('counts whole turns: a Haste first move and a free mark do not advance it', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, { king: 'Frost', power: 'Freeze' }], markFree: true });
    let p = startPosition('RNBQKBNR');
    expect(p.move).toBe(1);
    p = play(p, 'Nb1-c3!H');
    expect([p.turn, p.move, toFen(p).split(' ')[5]]).toEqual([WHITE, 1, '1']);
    p = play(p, 'Nc3-e4');
    expect([p.turn, p.move]).toEqual([BLACK, 1]);
    p = play(p, '!F:e4');
    expect([p.turn, p.move]).toEqual([BLACK, 1]);
    p = play(p, 'e7-e6');
    expect([p.turn, p.move, p.ply, toFen(p).split(' ')[5]]).toEqual([WHITE, 2, 4, '2']);
  });

  it('round-trips through FEN exactly, mid-turn too; old FENs read as before', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const p = play(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 12'), 'Ra1-a5!H');
    const back = fromFen(toFen(p));
    expect([back.move, back.turn, back.haste]).toEqual([12, WHITE, p.haste]);
    expect(fromFen('4k3/8/8/8/8/8/8/R3K3 b - - 3 7')).toMatchObject({ ply: 13, move: 7, halfmove: 3 });
    expect(positionKey({ ...p, move: 40 })).toBe(positionKey(p)); // not in the key, as in chess
  });

  it('replay keeps it', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null] });
    const startFen = '4k3/8/8/8/8/8/8/R3K3 w - - 0 1';
    const { end } = replayRecord({ gameId: 0, startFen, moves: ['Ra1-a5!H', 'Ra5-b5', 'Ke8-d8', 'Rb5-c5'].map(lan => ({ lan })) });
    expect([end.move, end.turn]).toEqual([2, BLACK]);
  });
});

describe('fromMove', () => {
  it('a card: not before the side\'s own move N, then legal, for either side', () => {
    setRules({ hands: [['Rally'], ['Rally']], fromMove: { Rally: 10 } });
    expect(has(fromFen('4k3/8/8/8/8/8/8/RN2K3 w - - 0 9'), '!J')).toBe(false);
    expect(has(fromFen('4k3/8/8/8/8/8/8/RN2K3 w - - 0 10'), '!J')).toBe(true);
    expect(has(fromFen('rn2k3/8/8/8/8/8/8/4K3 b - - 0 9'), '!J')).toBe(false);
    expect(has(fromFen('rn2k3/8/8/8/8/8/8/4K3 b - - 0 10'), '!J')).toBe(true);
    // Played into: White's move 9, Black's move 9, then White's move 10 has it.
    const p = play(play(fromFen('rn2k3/8/8/8/8/8/8/RN2K3 w - - 0 9'), 'Ke1-f1'), 'Ke8-f8');
    expect([p.move, has(p, '!J')]).toEqual([10, true]);
  });

  it('a king power: the same', () => {
    setRules({ kings: [{ king: 'Flame', power: 'Haste' }, null], fromMove: { Haste: 5 } });
    expect(has(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 4'), '!H')).toBe(false);
    expect(has(fromFen('4k3/8/8/8/8/8/8/R3K3 w - - 0 5'), '!H')).toBe(true);
  });

  it('the search never plays it early, at the root or below it', () => {
    // Strike takes the queen on a4 (Nd1 as a queen via c2, b3): the best move as soon as it may be played.
    setRules({ kings: [{ king: 'Flame', power: 'Strike' }, null], fromMove: { Strike: 5 } });
    const early = fromFen('k7/8/8/8/q7/8/8/3NK3 w - - 0 4'), ready = fromFen('k7/8/8/8/q7/8/8/3NK3 w - - 0 5');
    expect(searchLegal(early).some(m => m.power)).toBe(false);
    expect(search(early, { maxDepth: 3 }).move?.power).toBeUndefined();
    resetSearchState();
    expect(search(ready, { maxDepth: 3 }).move?.power).toBe('strike');
    // Below the root the search counts the move as makeMove does: after Black's turn the card is there.
    setRules({ hands: [['Rally'], []], fromMove: { Rally: 10 } });
    const pos = fromFen('rn2k3/8/8/8/8/8/8/RN2K3 b - - 0 9');
    const m = legalMoves(pos).find(x => toLan(pos, x) === 'Ke8-f8')!;
    const next = makeMove(pos, m);
    expect(lans(next, probeLegalAfter(pos, m))).toEqual(lans(next));
    expect(has(next, '!J')).toBe(true);
    const w = fromFen('rn2k3/8/8/8/8/8/8/RN2K3 w - - 0 9'), wm = legalMoves(w).find(x => toLan(w, x) === 'Ke1-f1')!;
    const after = makeMove(w, wm);
    expect(lans(after, probeLegalAfter(w, wm))).toEqual(lans(after));
  });

  it('a Mirror may not copy a card that is not yet available', () => {
    setRules({ hands: [['Mirror'], ['Haste']], fromMove: { Haste: 10 } });
    expect(has(fromFen('4k3/8/8/8/8/8/8/RN2K3 w - - 0 9 u0.1/y.Haste'), '!Y')).toBe(false);
    expect(has(fromFen('4k3/8/8/8/8/8/8/RN2K3 w - - 0 10 u0.1/y.Haste'), '!Y')).toBe(true);
    setRules({ hands: [['MirrorB', 'Haste'], []], fromMove: { Haste: 10 } });
    expect(has(fromFen('4k3/8/8/8/8/8/8/RN2K3 w - - 0 9'), '!Z')).toBe(false);
    expect(has(fromFen('4k3/8/8/8/8/8/8/RN2K3 w - - 0 10'), '!Z')).toBe(true);
  });

  it('refuses an always-on power', () => {
    expect(() => parseRule('fromMove=HolyLight:3')).toThrow(/always on/);
    expect(() => setRules({ fromMove: { Mercy: 3 } as Partial<Record<CardName, number>> })).toThrow(/always on/);
    expect(() => setRules({ kings: [{ king: 'Mud', power: 'March' }, null], marchUses: 0, fromMove: { March: 3 } })).toThrow(/always on/);
    expect(() => setRules({ kings: [{ king: 'Mud', power: 'March' }, null], marchUses: 3, fromMove: { March: 3 } })).not.toThrow();
  });

  it('parses and round-trips its flag', () => {
    const r = parseRule('fromMove=Haste:10+rage:8').fromMove!;
    expect(r).toEqual({ Haste: 10, Rage: 8 });
    expect(parseRule(`fromMove=${Object.entries(r).map(([k, v]) => `${k}:${v}`).join('+')}`).fromMove).toEqual(r);
    expect(ruleDiff({ fromMove: r })).toEqual({ fromMove: r });
    expect(ruleDiff({ fromMove: {} })).toEqual({});
    expect(() => parseRule('fromMove=Haste:0')).toThrow(/move number/);
    expect(() => parseRule('fromMove=Haste')).toThrow(/move number/);
    expect(() => parseRule('fromMove=Fireball:3')).toThrow(/not a one-use/);
  });

  it('on random positions only removes the held-back card\'s moves, and none from move N on', () => {
    let seed = 77;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    const cards = ALL_CARDS.filter(c => c !== 'Growth' && c !== 'GrowthB');
    let removed = 0;
    for (let g = 0; g < 30; g++) {
      const hand = Array.from({ length: 3 }, () => cards[Math.floor(rng() * cards.length)]);
      const held = hand[0], n = 2 + Math.floor(rng() * 20);
      let pos = startPosition('RNBQKBNR');
      for (let ply = 0; ply < 40; ply++) {
        setRules({ hands: [hand, hand], markFree: true });
        const free = legalMoves(pos);
        if (!free.length) break;
        setRules({ hands: [hand, hand], markFree: true, fromMove: { [held]: n } });
        const gated = lans(pos);
        // The difference is exactly the moves that spend `held`, or copy it, before move N.
        const early = (m: Move): boolean => pos.move! < n && !!m.power
          && ((m.via ? (m.via === 'mirror' ? 'Mirror' : 'MirrorB') : TAG_POWER[m.power]) === held || (!!m.via && TAG_POWER[m.power] === held));
        expect(gated, toFen(pos)).toEqual(lans(pos, free.filter(m => !early(m))));
        expect(lans(pos, searchLegal(pos))).toEqual(gated);
        removed += free.length - gated.length;
        const m = free[Math.floor(rng() * free.length)];
        pos = makeMove(pos, m);
      }
    }
    expect(removed).toBeGreaterThan(100);
  });
});
