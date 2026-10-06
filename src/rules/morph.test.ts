/**
 * The Morph and MorphB cards (card mode, lab; owner idea 2026-10-06): one own piece (not the king or
 * a pawn) becomes another type the draw pool fields (not a king or pawn, not its own type), on its
 * square, as the turn; it takes nothing. Never a second Beast for the side; a second queen may come.
 * MorphB: never a queen. The move is Sacrifice's shape (`from === to`, `promo`), notation `!I:d1=Q`
 * and `!I+:d1=R`.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { BLACK, Move, N, Position, Q, S, WHITE, inCheck, legalMoves, makeMove, parseSq, piece, status } from './engine';
import { POOL, fromFen, randomBackRank, toFen, toLan } from './setup';
import { ALL_CARDS, CARD_ONLY, CardName, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, search, searchLegal } from '../ai/search';
import { mulberry32 } from '../sim/rng';
import { replayRecord } from '../sim/replay';
import { cardText } from '../powers-ui';
import { describeMove } from '../move-text';

const hands = (white: CardName[], black: CardName[], more = {}): void => { setRules({ hands: [white, black], markFree: true, ...more }); };
const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
const morphs = (pos: Position): string[] => lans(pos).filter(l => l.startsWith('!I'));
const find = (pos: Position, lan: string): Move => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return m;
};
const play = (pos: Position, lan: string): Position => makeMove(pos, find(pos, lan));
const legalSame = (pos: Position): void => { expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(lans(pos)); };
/** The pool's types as letters, without `drop`. */
const pool = (...drop: string[]): string[] => [...new Set(POOL)].filter(l => !drop.includes(l));
const targets = (pos: Position, square: string, tag = '!I'): string[] => morphs(pos).filter(l => l.startsWith(`${tag}:${square}=`)).map(l => l.slice(-1)).sort();

afterEach(() => { setRules(); resetSearchState(); });

describe('Morph: what may become what', () => {
  const START = '4k3/8/8/8/8/8/PP6/RN2K3 w - - 0 1';

  it('a piece, not the king or a pawn, becomes any other type of the pool', () => {
    hands(['Morph'], []);
    const pos = fromFen(START);
    expect(targets(pos, 'a1')).toEqual(pool('R').sort());
    expect(targets(pos, 'b1')).toEqual(pool('N').sort());
    expect(morphs(pos).length).toBe(2 * (pool().length - 1)); // nothing for the pawns or the king
    // The pool's types are the engine's: every one a piece the engine plays, none a king or pawn.
    expect(pool().sort()).toEqual(['A', 'B', 'G', 'M', 'N', 'O', 'Q', 'R', 'S']);
    legalSame(pos);
  });

  it('never a second Beast for the side; a second queen may come', () => {
    hands(['Morph'], []);
    const beast = fromFen('4k3/8/8/8/8/8/8/RS2K3 w - - 0 1');
    expect(targets(beast, 'a1')).toEqual(pool('R', 'S').sort());
    expect(targets(beast, 'b1')).toEqual(pool('S').sort()); // the Beast itself may become another type
    // The opponent's Beast does not count.
    expect(targets(fromFen('s3k3/8/8/8/8/8/8/R3K3 w - - 0 1'), 'a1')).toContain('S');
    expect(targets(fromFen('4k3/8/8/8/8/8/8/RQ2K3 w - - 0 1'), 'a1')).toContain('Q');
  });

  it('MorphB never makes a queen; the two cards have their own notation', () => {
    hands(['MorphB'], []);
    const pos = fromFen(START);
    expect(targets(pos, 'a1', '!I+')).toEqual(pool('R', 'Q').sort());
    expect(morphs(pos).every(l => l.startsWith('!I+:'))).toBe(true);
    expect(targets(fromFen('4k3/8/8/8/8/8/8/QN2K3 w - - 0 1'), 'a1', '!I+')).toEqual(pool('Q').sort()); // a queen may stop being one
    hands(['Morph', 'MorphB'], []);
    const both = lans(fromFen(START));
    expect(both).toEqual(expect.arrayContaining(['!I:b1=R', '!I+:b1=R', '!I:b1=Q']));
    expect(both).not.toContain('!I+:b1=Q');
    expect(new Set(both).size).toBe(both.length);
  });

  it('a lab piece may morph, into the pool only; a guard only where a guard may land', () => {
    hands(['Morph'], []);
    expect(targets(fromFen('4k3/8/8/8/8/8/8/2L1K3 w - - 0 1'), 'c1')).toEqual(pool().sort());
    expect(morphs(fromFen('4k3/8/8/8/8/8/8/1TCVK3 w - - 0 1')).some(l => /=[KPLTCV]$/.test(l))).toBe(false);
    const second = fromFen('4k3/8/8/8/8/8/1N6/4K3 w - - 0 1');
    expect(targets(second, 'b2')).toContain('G');
    hands(['Morph'], [], { guardNoSecondRank: true });
    expect(targets(second, 'b2')).not.toContain('G');
  });

  it('Black morphs its own pieces; a frozen piece does not morph; one use', () => {
    hands([], ['Morph']);
    const black = fromFen('4k2r/8/8/8/8/8/8/R3K3 b - - 0 1');
    expect(targets(black, 'h8')).toEqual(pool('R').sort());
    expect(morphs(black).every(l => l.startsWith('!I:h8='))).toBe(true);
    const next = play(black, '!I:h8=Q');
    expect(morphs(next)).toEqual([]); // White holds no Morph
    expect(morphs(play(next, 'Ke1-d1'))).toEqual([]); // and Black's card is spent
    hands(['Morph'], ['Freeze']);
    const frozen = fromFen('4k3/8/8/8/8/8/8/RN2K3 w - - 0 1 mb1b'); // Black's Freeze on b1
    expect(targets(frozen, 'b1')).toEqual([]);
    expect(targets(frozen, 'a1')).toEqual(pool('R').sort());
  });
});

describe('Morph: the move', () => {
  it('changes the piece in place, takes nothing, and is the turn', () => {
    hands(['Morph'], []);
    const pos = fromFen('4k3/8/8/8/8/8/PP6/RN2K3 w - - 3 9');
    const m = find(pos, '!I:a1=Q');
    expect([m.from, m.to, m.captures, m.promo, m.power]).toEqual([parseSq('a1'), parseSq('a1'), [], Q, 'morph']);
    const next = makeMove(pos, m);
    for (let s = 0; s < 64; s++) expect(next.board[s], `square ${s}`).toBe(s === parseSq('a1') ? piece(Q, WHITE) : pos.board[s]);
    expect([next.turn, next.used, next.halfmove, next.lost]).toEqual([BLACK, [1, 0], 4, undefined]);
    expect(describeMove(pos, m)).toBe('White turns the rook on a1 into a queen.');
    // A spent guard becomes a fresh piece.
    hands(['Morph'], [], { guardCaptures: 'pawns', guardCaptureLimit: 1 });
    expect(toFen(play(fromFen('4k3/8/8/8/8/8/8/H3K3 w - - 0 1'), '!I:a1=R')).split(' ')[0]).toBe('4k3/8/8/8/8/8/8/R3K3');
  });

  it('never answers a check; a pinned piece may morph while the king stays safe; it may give check', () => {
    hands(['Morph'], []);
    const checked = fromFen('4r1k1/8/8/8/8/8/8/1N2K3 w - - 0 1');
    expect(inCheck(checked)).toBe(true);
    expect(morphs(checked)).toEqual([]);
    legalSame(checked);
    // The rook on e2 is pinned on the e-file; whatever it becomes still stands between.
    const pinned = fromFen('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1');
    expect(targets(pinned, 'e2')).toEqual(pool('R').sort());
    for (const l of morphs(pinned)) expect(inCheck(play(pinned, l)), l).toBe(false);
    legalSame(pinned);
    // The knight on e4 becomes a rook and checks the king on e8.
    const open = fromFen('4k3/8/8/8/4N3/8/8/K7 w - - 0 1');
    expect(inCheck(play(open, '!I:e4=R'))).toBe(true);
    legalSame(open);
  });

  it('keeps FEN, the search key and make/unmake in step', () => {
    hands(['Morph', 'MorphB'], ['Morph']);
    for (const fen of ['4k3/8/8/8/8/8/PP6/RN2K3 w - - 0 1', 'rs2k3/8/8/8/8/8/8/AS1QK3 b - - 0 1', '4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1']) {
      const pos = fromFen(fen);
      expect(morphs(pos).length, fen).toBeGreaterThan(0);
      for (const m of legalMoves(pos).filter(x => x.power === 'morph' || x.power === 'morphb')) {
        const next = makeMove(pos, m), lan = toLan(pos, m);
        expect(fromFen(toFen(next)), lan).toEqual(next);
        expect(positionKey(fromFen(toFen(next))), lan).toBe(positionKey(next));
        expect(probeApply(pos, m), lan).toEqual({ after: positionKey(next), back: positionKey(pos) });
      }
    }
  });

  it('a recorded Morph replays by its notation, and an archer\'s is no shot', () => {
    hands(['Morph', 'MorphB'], []);
    const startFen = '4k3/8/8/8/8/8/8/AN2K3 w - - 0 1';
    const { end, events } = replayRecord({ gameId: 1, startFen, moves: ['!I:a1=R', 'Ke8-d8', 'Ra1-a8', 'Kd8-d7', '!I+:b1=M'].map(lan => ({ lan })) });
    expect(toFen(end).split(' ')[0]).toBe('R7/3k4/8/8/8/8/8/1M2K3');
    expect([events.powers.morph, events.powers.morphb, events.archerShots]).toEqual([[1, 0], [1, 0], [0, 0]]);
    expect(() => replayRecord({ gameId: 2, startFen, moves: [{ lan: '!I:a1=A' }] })).toThrow(/parsed nothing/);
    expect(() => replayRecord({ gameId: 3, startFen, moves: [{ lan: '!I+:a1=Q' }] })).toThrow(/parsed nothing/);
  });

  it('a morphed piece that is taken joins the reserve as its new type', () => {
    hands(['Morph', 'Salvation'], []);
    // The knight on d4 becomes a queen; the rook on d8 takes it; Salvation may return a queen.
    const pos = play(play(fromFen('3rk3/8/8/8/3N4/8/8/4K3 w - - 0 1'), '!I:d4=Q'), 'Rd8xd4');
    expect([pos.lost?.[WHITE * 16 + Q], pos.lost?.[WHITE * 16 + N]]).toEqual([1, 0]);
    expect(toFen(pos).split(' ')[6]).toBe('u1.0/lQ');
    const returns = lans(pos).filter(l => l.endsWith('!R'));
    expect(returns).toContain('Q@a1!R');
    expect(returns.some(l => l.startsWith('N@'))).toBe(false);
  });

  it('keeps a dead draw open while a piece may morph; the search plays it', () => {
    hands(['Morph'], []);
    const dead = fromFen('4k3/8/8/8/8/8/8/1N2K3 w - - 0 1');
    expect(status(dead)).toBe('playing');
    expect(status({ ...dead, used: [1, 0] })).toBe('drawMaterial'); // the card is spent
    expect(toLan(dead, search(dead, { maxDepth: 2 }).move!)).toMatch(/^!I:b1=/);
    hands(['MorphB'], []);
    expect(status(dead)).toBe('playing');
    hands([], ['Morph']);
    expect(status(dead)).toBe('drawMaterial'); // Black's lone king has nothing to morph
    // A Mirror copies the opponent's last Morph.
    hands(['Mirror'], ['Morph']);
    const mirror: Position = { ...dead, last: [undefined, 'Morph'] };
    expect(status(mirror)).toBe('playing');
    expect(lans(mirror)).toContain('!I:b1=Q!Y');
    hands([], []);
    expect(status(dead)).toBe('drawMaterial');
  });

  it('keeps its hash slot (right after Rally; later cards are appended), with its text and its flag', () => {
    expect(CARD_ONLY.slice(CARD_ONLY.indexOf('Rally'), CARD_ONLY.indexOf('Rally') + 3)).toEqual(['Rally', 'Morph', 'MorphB']);
    expect(ALL_CARDS.length).toBeLessThanOrEqual(64); // the Mirror's last-card keys: 64 slots a side (`lastIndex`)
    expect(parseRule('hands=morph+MORPHB').hands![0]).toEqual(['Morph', 'MorphB']);
    expect(cardText('Morph')).toBe('one of your pieces (not a pawn or the king) becomes another kind of piece where it stands (not a pawn or a king, and never a second beast)');
    expect(cardText('MorphB')).toBe('one of your pieces (not a pawn or the king) becomes another kind of piece where it stands (not a pawn, a king or a queen, and never a second beast)');
  });
});

describe('random games with the Morph cards', () => {
  it('keep the legal moves, the search key, FEN and replay in step; no morph makes a second Beast', () => {
    const deck: CardName[] = ['Morph', 'MorphB', 'Salvation', 'Mirror', 'MirrorB', 'Haste', 'Freeze'];
    const played = new Set<string>();
    let seed = 31;
    const rng = (): number => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    for (let g = 0; g < 12; g++) {
      const hand = deck.filter((_, i) => (g + i) % 3 !== 0);
      hands(hand, [...hand].reverse(), { hasteCaptures: false });
      const rank = g % 2 ? randomBackRank(mulberry32(g)) : 'RNBQKBNR';
      const startFen = `${rank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${rank} w - - 0 1`;
      let pos = fromFen(startFen);
      const record: string[] = [];
      for (let ply = 0; ply < 60 && status(pos) === 'playing'; ply++) {
        const moves = legalMoves(pos);
        const all = moves.map(m => toLan(pos, m));
        expect(new Set(all).size, toFen(pos)).toBe(all.length);
        legalSame(pos);
        const morph = moves.filter(m => m.power === 'morph' || m.power === 'morphb');
        const powered = moves.filter(m => m.power || m.pass);
        const m = morph.length && rng() < 0.3 ? morph[Math.floor(rng() * morph.length)]
          : powered.length && rng() < 0.3 ? powered[Math.floor(rng() * powered.length)] : moves[Math.floor(rng() * moves.length)];
        const next = makeMove(pos, m);
        if (m.power === 'morph' || m.power === 'morphb') {
          played.add(m.via ? `${m.power}-${m.via}` : m.power);
          if (m.promo === S) expect(pos.board.includes(piece(S, pos.turn)), `${toFen(pos)} ${toLan(pos, m)}`).toBe(false);
          expect(m.promo === Q && m.power === 'morphb').toBe(false);
        }
        expect(probeApply(pos, m), `${toFen(pos)} ${toLan(pos, m)}`).toEqual({ after: positionKey(next), back: positionKey(pos) });
        expect(positionKey(fromFen(toFen(next)))).toBe(positionKey(next));
        record.push(toLan(pos, m));
        pos = next;
      }
      expect(toFen(replayRecord({ gameId: g, startFen, moves: record.map(lan => ({ lan })) }).end)).toBe(toFen(pos));
    }
    for (const t of ['morph', 'morphb']) expect(played).toContain(t);
  }, 60_000);
});
