/**
 * The Spawn cards (card mode, lab; owner, 2026-10-06, docs/MATRIX.md D.5), each one use and the
 * turn's move, taking nothing: a new own pawn appears on an empty square — Spawn on the side's pawn
 * start rank, SpawnK next to its own king but never on rank 1 or 8; Spawn2 and SpawnK2 two new pawns
 * on two different such squares. The move is a drop (`drop: P`, `drop2` for the second pawn),
 * notation `P@c2!S`, `P@d2!SK`, `P@c2,f2!S2`, `P@d2,e2!SK2`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, Move, P, Position, WHITE, inCheck, legalMoves, makeMove, parseSq, piece, status } from './engine';
import { fromFen, randomBackRank, toFen, toLan } from './setup';
import { ALL_CARDS, CARD_ONLY, CardName, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, search, searchLegal } from '../ai/search';
import { mulberry32 } from '../sim/rng';
import { replayRecord } from '../sim/replay';
import { cardText } from '../powers-ui';
import { describeMove } from '../move-text';

const hands = (white: CardName[], black: CardName[], more = {}): void => { setRules({ hands: [white, black], markFree: true, ...more }); };
const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
/** The spawn moves of `pos` with the tag `tag` (`!S`, `!SK`, `!S2`, `!SK2`), as notation. */
const spawns = (pos: Position, tag?: string): string[] => lans(pos).filter(l => l.startsWith('P@') && (!tag || l.endsWith(tag)));
const find = (pos: Position, lan: string): Move => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return m;
};
const play = (pos: Position, lan: string): Position => makeMove(pos, find(pos, lan));
const legalSame = (pos: Position): void => { expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(lans(pos)); };
/** Every pair of `squares` (in the order given, which is ascending), as Spawn2 notation with `tag`. */
const pairs = (squares: string[], tag: string): string[] => squares.flatMap((a, i) => squares.slice(i + 1).map(b => `P@${a},${b}${tag}`)).sort();
const one = (squares: string[], tag: string): string[] => squares.map(s => `P@${s}${tag}`).sort();
const pawns = (pos: Position, c: 0 | 1): number => pos.board.filter(p => p === piece(P, c)).length;
const isSpawn = (m: Move): boolean => m.power === 'spawn' || m.power === 'spawnk' || m.power === 'spawn2' || m.power === 'spawnk2';

afterEach(() => { setRules(); resetSearchState(); });

describe('Spawn: where a new pawn may appear', () => {
  // White: own pawn a2, own knight c2, enemy pawn e2; b2 d2 f2 g2 h2 are empty.
  const WHITE_RANK = '4k3/pp6/8/8/8/8/P1N1p3/4K3 w - - 0 1';
  // Black, mirrored: own pawn a7, own knight c7, enemy pawn e7; b7 d7 f7 g7 h7 are empty.
  const BLACK_RANK = '4k3/p1n1P3/8/8/8/8/8/4K3 b - - 0 1';

  it('Spawn: an empty square of the own pawn start rank, rank 2 for White and 7 for Black', () => {
    hands(['Spawn'], ['Spawn']);
    expect(spawns(fromFen(WHITE_RANK))).toEqual(one(['b2', 'd2', 'f2', 'g2', 'h2'], '!S'));
    expect(spawns(fromFen(BLACK_RANK))).toEqual(one(['b7', 'd7', 'f7', 'g7', 'h7'], '!S'));
    // A full start rank (the start position) offers none.
    expect(spawns(fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1'))).toEqual([]);
    legalSame(fromFen(WHITE_RANK));
    legalSame(fromFen(BLACK_RANK));
  });

  it('SpawnK: an empty square next to the own king, never on rank 1 or 8', () => {
    hands(['SpawnK'], ['SpawnK']);
    // In the middle: the 8 neighbours, less the two the own bishop (c3) and an enemy knight (e5) hold.
    expect(spawns(fromFen('4k3/8/8/4n3/3K4/2B5/8/8 w - - 0 1'))).toEqual(one(['d3', 'e3', 'c4', 'e4', 'c5', 'd5'], '!SK'));
    expect(spawns(fromFen('4k3/8/8/8/3K4/8/8/8 w - - 0 1')).length).toBe(8);
    expect(spawns(fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1'))).toEqual(one(['d2', 'e2', 'f2'], '!SK')); // not d1 or f1
    expect(spawns(fromFen('7K/8/8/8/8/8/8/k7 w - - 0 1'))).toEqual(one(['g7', 'h7'], '!SK')); // not g8
    expect(spawns(fromFen('4k3/8/8/8/8/8/8/4K3 b - - 0 1'))).toEqual(one(['d7', 'e7', 'f7'], '!SK')); // Black: not d8 or f8
    expect(spawns(fromFen('8/8/8/8/8/8/8/k3K3 b - - 0 1'))).toEqual(one(['a2', 'b2'], '!SK')); // Black: not b1 either
    legalSame(fromFen('4k3/8/8/4n3/3K4/2B5/8/8 w - - 0 1'));
  });

  it('Spawn2 and SpawnK2: two different squares, each pair once; at most 28', () => {
    hands(['Spawn2'], ['SpawnK2']);
    expect(spawns(fromFen(WHITE_RANK))).toEqual(pairs(['b2', 'd2', 'f2', 'g2', 'h2'], '!S2'));
    expect(spawns(fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1')).length).toBe(28); // an empty rank 2
    expect(spawns(fromFen('4k3/8/8/8/8/8/1PPPPPPP/4K3 w - - 0 1'))).toEqual([]); // one empty square: no pair
    expect(spawns(fromFen('4k3/8/8/8/8/8/8/4K3 b - - 0 1'))).toEqual(pairs(['d7', 'e7', 'f7'], '!SK2'));
    hands(['SpawnK2'], []);
    expect(spawns(fromFen('4k3/8/8/4n3/3K4/2B5/8/8 w - - 0 1'))).toEqual(pairs(['d3', 'e3', 'c4', 'e4', 'c5', 'd5'], '!SK2'));
    expect(spawns(fromFen('4k3/8/8/8/3K4/8/8/8 w - - 0 1')).length).toBe(28);
    legalSame(fromFen(WHITE_RANK));
  });

  it('each card has its own notation, so two cards on one square are two moves', () => {
    hands(['Spawn', 'SpawnK', 'Spawn2', 'SpawnK2'], []);
    const pos = fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    const all = spawns(pos);
    expect(all).toEqual(expect.arrayContaining(['P@e2!S', 'P@e2!SK', 'P@d2,e2!S2', 'P@d2,e2!SK2']));
    expect(all.length).toBe(8 + 3 + 28 + 3);
    expect(new Set(all).size).toBe(all.length);
    legalSame(pos);
  });
});

describe('Spawn: the king in check', () => {
  // The rook on e8 checks the king on e1; only a pawn on e2 blocks.
  const ROOK = '4r1k1/8/8/8/8/8/8/4K3 w - - 0 1';

  it('a spawn that blocks a check is legal; one that leaves the king in check is not offered', () => {
    hands(['Spawn', 'SpawnK'], []);
    const pos = fromFen(ROOK);
    expect(inCheck(pos)).toBe(true);
    expect(spawns(pos)).toEqual(['P@e2!S', 'P@e2!SK']);
    expect(inCheck(play(pos, 'P@e2!S'))).toBe(false);
    legalSame(pos);
    // A bishop's diagonal check (a5 to e1) is blocked on d2.
    const bishop = fromFen('4k3/8/8/b7/8/8/8/4K3 w - - 0 1');
    expect(spawns(bishop)).toEqual(['P@d2!S', 'P@d2!SK']);
    legalSame(bishop);
    // A knight's check cannot be blocked: no spawn at all.
    const knight = fromFen('4k3/8/8/8/8/5n2/8/4K3 w - - 0 1');
    expect(inCheck(knight)).toBe(true);
    expect(spawns(knight)).toEqual([]);
    legalSame(knight);
  });

  it('a pair must block: every Spawn2 pair holds e2', () => {
    hands(['Spawn2', 'SpawnK2'], []);
    const pos = fromFen(ROOK);
    expect(spawns(pos, '!S2')).toEqual(['P@a2,e2!S2', 'P@b2,e2!S2', 'P@c2,e2!S2', 'P@d2,e2!S2', 'P@e2,f2!S2', 'P@e2,g2!S2', 'P@e2,h2!S2']);
    expect(spawns(pos, '!SK2')).toEqual(['P@d2,e2!SK2', 'P@e2,f2!SK2']);
    legalSame(pos);
  });

  it('gets the king out of a mate: without the card this is checkmate, with it the search blocks', () => {
    const fen = '4r1k1/8/8/8/8/8/3P1P2/3RKR2 w - - 0 1';
    hands([], []);
    expect(status(fromFen(fen))).toBe('checkmate');
    hands(['SpawnK'], []);
    const pos = fromFen(fen);
    expect(status(pos)).toBe('playing');
    expect(lans(pos)).toEqual(['P@e2!SK']);
    expect(toLan(pos, search(pos, { maxDepth: 2 }).move!)).toBe('P@e2!SK');
  });

  it('a spawned pawn that becomes an enemy catapult\'s screen exposes the king: not offered', () => {
    // The catapult on e8 has no screen; a white pawn on e2 would be one, and the lob takes the king.
    hands(['Spawn', 'SpawnK', 'Spawn2'], []);
    const pos = fromFen('4c1k1/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(inCheck(pos)).toBe(false);
    const all = spawns(pos);
    expect(all.some(l => /e2/.test(l))).toBe(false);
    expect(all).toContain('P@d2!SK');
    expect(all).toContain('P@a2,h2!S2');
    legalSame(pos); // the fast path probes the second square too (a2 is off the king's lines, e2 is on one)
  });
});

describe('Spawn: the move', () => {
  it('adds a pawn, takes nothing, resets the clock, spends the card and is the turn', () => {
    hands(['Spawn', 'Spawn2'], []);
    const pos = fromFen('4k3/8/8/8/8/8/8/4K3 w - - 7 12');
    const m = find(pos, 'P@c2!S');
    expect([m.from, m.to, m.captures, m.drop, m.drop2, m.power]).toEqual([parseSq('c2'), parseSq('c2'), [], P, undefined, 'spawn']);
    const next = makeMove(pos, m);
    for (let s = 0; s < 64; s++) expect(next.board[s], `square ${s}`).toBe(s === parseSq('c2') ? piece(P, WHITE) : pos.board[s]);
    expect([next.turn, next.used, next.halfmove, next.lost]).toEqual([BLACK, [1, 0], 0, undefined]);
    expect(describeMove(pos, m)).toBe('White adds a pawn on c2.');
    const two = find(pos, 'P@c2,f2!S2');
    expect([two.to, two.drop2, two.power]).toEqual([parseSq('c2'), parseSq('f2'), 'spawn2']);
    const after = makeMove(pos, two);
    expect(toFen(after)).toBe('4k3/8/8/8/8/8/2P2P2/4K3 b - - 0 12 u2.0');
    expect(describeMove(pos, two)).toBe('White adds pawns on c2 and f2.');
    // One use: the spent card offers nothing on White's next turn.
    expect(spawns(play(after, 'Ke8-d8')).filter(l => l.endsWith('!S2'))).toEqual([]);
  });

  it('the search resets the 50-move clock on a spawn, as makeMove does', () => {
    // Ply 99 without a capture or a pawn move: every other move draws; the spawn keeps the queen's win.
    hands(['Spawn'], []);
    const pos = fromFen('4k3/8/8/8/8/8/8/Q3K3 w - - 99 80');
    expect(makeMove(pos, find(pos, 'P@a2!S')).halfmove).toBe(0);
    expect(toLan(pos, search(pos, { maxDepth: 2 }).move!)).toMatch(/^P@[a-h]2!S$/);
  });

  it('a spawned pawn is an ordinary pawn: on its start rank it may double-step', () => {
    hands(['Spawn'], ['Spawn2']);
    let pos = play(fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1'), 'P@c2!S');
    pos = play(pos, 'P@f7,g7!S2');
    expect(lans(pos)).toEqual(expect.arrayContaining(['c2-c3', 'c2-c4']));
    pos = play(pos, 'c2-c4');
    expect(lans(pos)).toEqual(expect.arrayContaining(['f7-f5', 'g7-g5']));
    // SpawnK next to a king on rank 2 puts a pawn on rank 3, which steps one square only.
    hands(['SpawnK'], []);
    const k = play(fromFen('4k3/8/8/8/8/8/3K4/8 w - - 0 1'), 'P@d3!SK');
    const steps = lans(play(k, 'Ke8-e7')).filter(l => l.startsWith('d3'));
    expect(steps).toEqual(['d3-d4']);
  });

  it('more than eight pawns: the board, FEN, the search key and the evaluation take them', () => {
    hands(['Spawn2', 'Spawn'], ['Spawn']);
    let pos = fromFen('4k3/pppppppp/8/8/8/PPPPPPPP/8/4K3 w - - 0 1');
    pos = play(pos, 'P@a2,b2!S2');
    expect(pawns(pos, WHITE)).toBe(10);
    pos = play(pos, 'Ke8-d8');
    pos = play(pos, 'P@h2!S');
    expect(pawns(pos, WHITE)).toBe(11);
    expect(toFen(pos)).toBe('3k4/pppppppp/8/8/8/PPPPPPPP/PP5P/4K3 b - - 0 2 u3.0');
    expect(fromFen(toFen(pos))).toEqual(pos);
    expect(positionKey(fromFen(toFen(pos)))).toBe(positionKey(pos));
    expect(status(pos)).toBe('playing');
    expect(search(pos, { maxDepth: 2 }).move).toBeTruthy();
  });

  it('keeps FEN, the search key and make/unmake in step for every reading', () => {
    hands(['Spawn', 'SpawnK', 'Spawn2', 'SpawnK2'], ['Spawn', 'SpawnK2']);
    for (const fen of ['4k3/pp6/8/8/8/8/P1N1p3/4K3 w - - 0 1', '4k3/8/8/4n3/3K4/2B5/8/8 w - - 3 7', '4k3/p1n1P3/8/8/8/8/8/4K3 b - - 0 1', '4r1k1/8/8/8/8/8/8/4K3 w - - 0 1']) {
      const pos = fromFen(fen);
      const ms = legalMoves(pos).filter(isSpawn);
      expect(ms.length, fen).toBeGreaterThan(0);
      for (const m of ms) {
        const next = makeMove(pos, m), lan = toLan(pos, m);
        expect(fromFen(toFen(next)), lan).toEqual(next);
        expect(positionKey(fromFen(toFen(next))), lan).toBe(positionKey(next));
        expect(probeApply(pos, m), lan).toEqual({ after: positionKey(next), back: positionKey(pos) });
      }
    }
  });

  it('a Mirror copies a Spawn; every card has its own last-card key, the Spawn cards past slot 32 included', () => {
    hands(['Mirror'], ['Spawn2']);
    const pos: Position = { ...fromFen('4k3/8/8/8/8/8/8/4K3 w - - 0 1'), last: [undefined, 'Spawn2'] };
    expect(spawns(pos)).toEqual(pairs(['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'], '!S2!Y'));
    const m = find(pos, 'P@a2,h2!S2!Y');
    const next = makeMove(pos, m);
    expect(probeApply(pos, m)).toEqual({ after: positionKey(next), back: positionKey(pos) });
    expect(ALL_CARDS.indexOf('SpawnK2')).toBeGreaterThanOrEqual(32);
    const keys = new Set<number>();
    for (const c of [WHITE, BLACK]) for (const card of ALL_CARDS) {
      const last: [CardName | undefined, CardName | undefined] = [undefined, undefined];
      last[c] = card;
      keys.add(positionKey({ ...pos, last }));
    }
    expect(keys.size).toBe(2 * ALL_CARDS.length);
  });

  it('a recorded spawn replays by its notation', () => {
    hands(['Spawn', 'SpawnK2'], ['SpawnK', 'Spawn2']);
    const startFen = '4k3/8/8/8/8/8/8/4K3 w - - 0 1';
    const { end, events } = replayRecord({ gameId: 1, startFen, moves: ['P@c2!S', 'P@d7!SK', 'P@e2,f2!SK2', 'P@a7,h7!S2', 'c2-c4'].map(lan => ({ lan })) });
    expect(toFen(end).split(' ')[0]).toBe('4k3/p2p3p/8/8/2P5/8/4PP2/4K3');
    expect([events.powers.spawn, events.powers.spawnk, events.powers.spawn2, events.powers.spawnk2]).toEqual([[1, 0], [0, 1], [0, 1], [1, 0]]);
    expect(() => replayRecord({ gameId: 2, startFen, moves: [{ lan: 'P@c3!S' }] })).toThrow(/parsed nothing/); // not the start rank
    expect(() => replayRecord({ gameId: 3, startFen, moves: [{ lan: 'P@c2!SK' }] })).toThrow(/parsed nothing/); // White holds no SpawnK
  });

  it('a spawned pawn that is taken joins the reserve as a pawn, which nothing returns', () => {
    hands(['Spawn', 'Salvation', 'Sacrifice'], []);
    const pos = play(play(fromFen('4k3/8/8/8/8/2n5/8/4K3 w - - 0 1 lPPPPPPPP'), 'P@e2!S'), 'Nc3xe2');
    expect(pos.lost?.[WHITE * 16 + P]).toBe(9); // eight lost before, the spawned one the ninth
    expect(toFen(pos).split(' ')[6]).toBe('u1.0/lPPPPPPPPP');
    expect(fromFen(toFen(pos))).toEqual(pos);
    expect(lans(pos).filter(l => l.endsWith('!R') || l.startsWith('!S:'))).toEqual([]); // no Salvation or Sacrifice of a pawn
  });

  it('keeps a dead draw open while a Spawn card is unplayed', () => {
    const dead = fromFen('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1');
    for (const card of ['Spawn', 'SpawnK', 'Spawn2', 'SpawnK2'] as const) {
      hands([card], []);
      expect(status(dead), card).toBe('playing');
      expect(status({ ...dead, used: [1, 0] }), card).toBe('drawMaterial'); // the card is spent
    }
    hands(['Mirror'], ['Spawn']);
    expect(status({ ...dead, last: [undefined, 'Spawn'] })).toBe('playing');
    hands([], []);
    expect(status(dead)).toBe('drawMaterial');
  });

  it('keeps its hash slot (appended after MorphB), with its text and its flag', () => {
    expect(CARD_ONLY.slice(CARD_ONLY.indexOf('MorphB'), CARD_ONLY.indexOf('MorphB') + 5)).toEqual(['MorphB', 'Spawn', 'SpawnK', 'Spawn2', 'SpawnK2']);
    expect(parseRule('hands=spawn+SPAWNK+spawn2+spawnk2').hands![0]).toEqual(['Spawn', 'SpawnK', 'Spawn2', 'SpawnK2']);
    expect(cardText('Spawn')).toBe('as your move, a new pawn of yours appears on an empty square of your pawns’ start rank');
    expect(cardText('SpawnK2')).toBe('as your move, two new pawns of yours appear on two empty squares next to your king (not on the first or last rank)');
  });
});

describe('random games with the Spawn cards', () => {
  it('keep the legal moves, the search key, FEN and replay in step; every spawn lands where its card says', () => {
    const deck: CardName[] = ['Spawn', 'SpawnK', 'Spawn2', 'SpawnK2', 'Mirror', 'Sacrifice', 'Salvation', 'Haste'];
    const played = new Set<string>();
    let seed = 57, most = 0;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    for (let g = 0; g < 12; g++) {
      const hand = deck.filter((_, i) => (g + i) % 3 !== 0);
      hands(hand, [...hand].reverse(), { hasteCaptures: false });
      const rank = g % 2 ? randomBackRank(mulberry32(g)) : 'RNBQKBNR';
      const startFen = `${rank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${rank} w - - 0 1`;
      let pos = fromFen(startFen);
      const record: string[] = [];
      for (let ply = 0; ply < 70 && status(pos) === 'playing'; ply++) {
        const moves = legalMoves(pos);
        const all = moves.map(m => toLan(pos, m));
        expect(new Set(all).size, toFen(pos)).toBe(all.length);
        legalSame(pos);
        const spawned = moves.filter(isSpawn);
        const m = spawned.length && rng() < 0.4 ? spawned[Math.floor(rng() * spawned.length)] : moves[Math.floor(rng() * moves.length)];
        const next = makeMove(pos, m);
        if (isSpawn(m)) {
          played.add(m.via ? `${m.power}-${m.via}` : m.power!);
          const c = pos.turn, k = pos.board.indexOf(piece(6, c));
          for (const s of m.drop2 === undefined ? [m.to] : [m.to, m.drop2]) {
            expect(pos.board[s], toLan(pos, m)).toBe(0);
            if (m.power === 'spawn' || m.power === 'spawn2') expect(s >> 3).toBe(c === WHITE ? 1 : 6);
            else expect([Math.max(Math.abs((s & 7) - (k & 7)), Math.abs((s >> 3) - (k >> 3))), (s >> 3) % 7 !== 0]).toEqual([1, true]);
            expect(next.board[s]).toBe(piece(P, c));
          }
          expect(inCheck(next, pos.turn)).toBe(false);
        }
        expect(probeApply(pos, m), `${toFen(pos)} ${toLan(pos, m)}`).toEqual({ after: positionKey(next), back: positionKey(pos) });
        expect(positionKey(fromFen(toFen(next)))).toBe(positionKey(next));
        record.push(toLan(pos, m));
        pos = next;
        most = Math.max(most, pawns(pos, WHITE), pawns(pos, BLACK));
      }
      expect(toFen(replayRecord({ gameId: g, startFen, moves: record.map(lan => ({ lan })) }).end)).toBe(toFen(pos));
    }
    for (const t of ['spawn', 'spawnk', 'spawn2', 'spawnk2']) expect(played).toContain(t);
    expect(most).toBeGreaterThan(8);
  }, 60_000);
});
