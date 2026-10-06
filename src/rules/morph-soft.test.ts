/**
 * The softer Morph cards (card mode, lab; owner, 2026-10-06), each one use and the turn's move,
 * taking nothing. MorphP: one own pawn becomes a knight or a bishop on its square (Morph's shape,
 * `from === to`, `promo`), notation `!IP:e2=N`. MorphS: two own pieces of different types, neither
 * the king nor a pawn, swap places (SkyLift's shape, `swap`; the same moves as SkyLift), notation
 * `!IS:b1<>f1`. Neither changes which squares are filled, so neither can expose the own king or
 * answer a check.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { B, BLACK, K, Move, N, P, Position, WHITE, colorOf, inCheck, legalMoves, makeMove, parseSq, piece, pseudoMoves, status, typeOf } from './engine';
import { fromFen, randomBackRank, toFen, toLan } from './setup';
import { ALL_CARDS, CARD_ONLY, CardName, parseRule, setRules } from './rules';
import { positionKey, probeApply, resetSearchState, search, searchLegal } from '../ai/search';
import { mulberry32 } from '../sim/rng';
import { replayRecord } from '../sim/replay';
import { cardText } from '../powers-ui';
import { describeMove } from '../move-text';

const hands = (white: CardName[], black: CardName[], more = {}): void => { setRules({ hands: [white, black], markFree: true, ...more }); };
const lans = (pos: Position, ms: readonly Move[] = legalMoves(pos)): string[] => ms.map(m => toLan(pos, m)).sort();
const pawnMorphs = (pos: Position): string[] => lans(pos).filter(l => l.startsWith('!IP:'));
const swaps = (pos: Position): string[] => lans(pos).filter(l => l.startsWith('!IS:'));
const find = (pos: Position, lan: string): Move => {
  const m = legalMoves(pos).find(x => toLan(pos, x) === lan);
  if (!m) throw new Error(`${lan} is not legal in ${toFen(pos)}: ${lans(pos).join(' ')}`);
  return m;
};
const play = (pos: Position, lan: string): Position => makeMove(pos, find(pos, lan));
const legalSame = (pos: Position): void => { expect(lans(pos, searchLegal(pos)), toFen(pos)).toEqual(lans(pos)); };
const both = (squares: string[]): string[] => squares.flatMap(s => [`!IP:${s}=B`, `!IP:${s}=N`]).sort();
const isSoft = (m: Move): boolean => m.power === 'morphp' || m.power === 'morphs';

afterEach(() => { setRules(); resetSearchState(); });

describe('MorphP: which pawn, and what it becomes', () => {
  // White: pawns a2 b2, knight e2, rook a1, king e1. Black: king e8, pawn a7.
  const FEN = '4k3/p7/8/8/8/8/PP2N3/R3K3 w - - 0 1';

  it('every own pawn, as a knight or a bishop; not a piece, the king or an enemy pawn', () => {
    hands(['MorphP'], ['MorphP']);
    expect(pawnMorphs(fromFen(FEN))).toEqual(both(['a2', 'b2']));
    expect(pawnMorphs(fromFen(FEN.replace(' w ', ' b ')))).toEqual(both(['a7']));
    // A pawn one step from promotion may morph too.
    expect(pawnMorphs(fromFen('4k3/4P3/8/8/8/8/8/4K3 w - - 0 1'))).toEqual(both(['e7']));
    // No pawn: no move.
    expect(pawnMorphs(fromFen('4k3/8/8/8/8/8/8/RN2K3 w - - 0 1'))).toEqual([]);
    legalSame(fromFen(FEN));
  });

  it('a knight and a bishop even when the army has none', () => {
    hands(['MorphP'], []);
    expect(pawnMorphs(fromFen('4k3/8/8/8/8/8/P7/R3K3 w - - 0 1'))).toEqual(both(['a2']));
  });

  it('a frozen pawn does not morph; one use; a Mirror copies it', () => {
    hands(['MorphP'], ['Freeze']);
    const frozen = fromFen('4k3/8/8/8/8/8/PP6/4K3 w - - 0 1 mb2b'); // Black's Freeze on b2
    expect(pawnMorphs(frozen)).toEqual(both(['a2']));
    hands(['MorphP'], []);
    const next = play(fromFen('4k3/8/8/8/8/8/PP6/4K3 w - - 0 1'), '!IP:a2=N');
    expect(pawnMorphs(play(next, 'Ke8-d8'))).toEqual([]);
    hands(['Mirror'], ['MorphP']);
    const mirror: Position = { ...fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1'), last: [undefined, 'MorphP'] };
    expect(lans(mirror).filter(l => l.startsWith('!IP:'))).toEqual(['!IP:a2=B!Y', '!IP:a2=N!Y']);
  });
});

describe('MorphP: the move', () => {
  it('changes the pawn in place, takes nothing, is the turn, and resets the 50-move clock', () => {
    hands(['MorphP'], []);
    const pos = fromFen('4k3/8/8/8/8/8/PP6/R3K3 w - - 7 12');
    const m = find(pos, '!IP:b2=N');
    expect([m.from, m.to, m.captures, m.promo, m.power]).toEqual([parseSq('b2'), parseSq('b2'), [], N, 'morphp']);
    const next = makeMove(pos, m);
    for (let s = 0; s < 64; s++) expect(next.board[s], `square ${s}`).toBe(s === parseSq('b2') ? piece(N, WHITE) : pos.board[s]);
    // The clock: a pawn leaves for good, as with a promotion or a Sacrifice.
    expect([next.turn, next.used, next.halfmove, next.lost]).toEqual([BLACK, [1, 0], 0, undefined]);
    expect(toFen(next)).toBe('4k3/8/8/8/8/8/PN6/R3K3 b - - 0 12 u1.0');
    expect(describeMove(pos, m)).toBe('White turns the pawn on b2 into a knight.');
    expect(toFen(play(pos, '!IP:a2=B')).split(' ')[0]).toBe('4k3/8/8/8/8/8/BP6/R3K3');
  });

  it('the search resets the clock on a MorphP too, so it keeps a win that every other move draws', () => {
    // Ply 99 without a capture or a pawn move; the pawn on a2 is blocked, nothing can be taken: only a
    // MorphP keeps the game going.
    hands(['MorphP'], []);
    const pos = fromFen('4k3/8/8/8/8/B7/P7/Q3K3 w - - 99 80');
    expect(lans(pos).filter(l => !l.startsWith('!IP:') && makeMove(pos, find(pos, l)).halfmove < 100)).toEqual([]);
    const r = search(pos, { maxDepth: 2 });
    expect(toLan(pos, r.move!)).toMatch(/^!IP:a2=[NB]$/);
    expect(r.score).toBeGreaterThan(500);
  });

  it('never answers a check; a pinned pawn may morph; the new piece may give check', () => {
    hands(['MorphP'], []);
    const checked = fromFen('4r1k1/8/8/8/8/8/3P4/4K3 w - - 0 1');
    expect(inCheck(checked)).toBe(true);
    expect(pseudoMoves(checked).some(m => m.power === 'morphp')).toBe(true);
    expect(pawnMorphs(checked)).toEqual([]);
    legalSame(checked);
    // A catapult's screen stays a screen: the pawn on e2 lets the catapult on e8 take e1.
    const lob = fromFen('4c1k1/8/8/8/8/8/4P3/4K3 w - - 0 1');
    expect(inCheck(lob)).toBe(true);
    expect(pawnMorphs(lob)).toEqual([]);
    legalSame(lob);
    // The bishop on a5 pins the pawn on d2; whatever it becomes still stands between.
    const pinned = fromFen('4k3/8/8/b7/8/8/3P4/4K3 w - - 0 1');
    expect(pawnMorphs(pinned)).toEqual(both(['d2']));
    for (const l of pawnMorphs(pinned)) expect(inCheck(play(pinned, l)), l).toBe(false);
    legalSame(pinned);
    // The pawn on d6 becomes a knight and checks the king on e8.
    const open = fromFen('4k3/8/3P4/8/8/8/8/4K3 w - - 0 1');
    expect(inCheck(play(open, '!IP:d6=N'))).toBe(true);
    expect(inCheck(play(open, '!IP:d6=B'))).toBe(false);
    legalSame(open);
  });

  it('a morphed pawn that is taken joins the reserve as its new type, as a promoted pawn does', () => {
    hands(['MorphP', 'Salvation'], []);
    const pos = play(play(fromFen('3rk3/8/8/8/3P4/8/8/4K3 w - - 0 1'), '!IP:d4=N'), 'Rd8xd4');
    expect([pos.lost?.[WHITE * 16 + N], pos.lost?.[WHITE * 16 + P]]).toEqual([1, 0]);
    expect(toFen(pos).split(' ')[6]).toBe('u1.0/lN');
    expect(fromFen(toFen(pos))).toEqual(pos);
    const returns = lans(pos).filter(l => l.endsWith('!R'));
    expect(returns).toContain('N@a1!R');
    expect(returns.some(l => l.startsWith('P@'))).toBe(false);
  });

  it('needs no material-draw clause: it needs a pawn, and a pawn keeps the game open', () => {
    hands(['MorphP'], []);
    const pos = fromFen('4k3/8/8/8/8/8/P7/4K3 w - - 0 1');
    expect(status(pos)).toBe('playing');
    expect(status(play(pos, '!IP:a2=N'))).toBe('drawMaterial'); // a lone knight cannot mate
    expect(status(play(pos, '!IP:a2=B'))).toBe('drawMaterial');
  });
});

describe('MorphS: which two pieces', () => {
  // White: rook a1, knight b1, bishop c1, king e1, knight g1, rook h1, pawn a2. Black: king e8.
  const FEN = '4k3/8/8/8/8/8/P7/RNB1K1NR w - - 0 1';
  const PAIRS = ['!IS:a1<>b1', '!IS:a1<>c1', '!IS:a1<>g1', '!IS:b1<>c1', '!IS:b1<>h1', '!IS:c1<>g1', '!IS:c1<>h1', '!IS:g1<>h1'];

  it('two own pieces of different types, each pair once; not the king, a pawn, two of one type, or an enemy', () => {
    hands(['MorphS'], ['MorphS']);
    const pos = fromFen(FEN);
    expect(swaps(pos)).toEqual(PAIRS); // not a1<>h1 (two rooks) or b1<>g1 (two knights)
    expect(swaps(fromFen('4k3/8/8/8/8/8/8/RR2K2n w - - 0 1'))).toEqual([]); // two rooks; the knight is Black's
    expect(swaps(fromFen('rn2k3/8/8/8/8/8/8/4K3 b - - 0 1'))).toEqual(['!IS:a8<>b8']);
    legalSame(pos);
  });

  it('plays the same moves as SkyLift, under its own notation', () => {
    hands(['SkyLift'], []);
    const sky = lans(fromFen(FEN)).filter(l => l.startsWith('!K:')).map(l => l.replace('!K:', '!IS:'));
    expect(sky).toEqual(PAIRS);
    hands(['SkyLift', 'MorphS'], []);
    const all = lans(fromFen(FEN));
    expect(all.filter(l => l.startsWith('!K:') || l.startsWith('!IS:')).length).toBe(2 * PAIRS.length);
    expect(new Set(all).size).toBe(all.length);
  });

  it('a frozen piece does not swap; a guard only where a guard may land', () => {
    hands(['MorphS'], ['Freeze']);
    const frozen = fromFen(`${FEN} mb1b`); // Black's Freeze on b1
    expect(swaps(frozen)).toEqual(PAIRS.filter(l => !l.includes('b1')));
    hands(['MorphS'], []);
    const guard = fromFen('4k3/8/8/8/8/8/1N6/2G1K3 w - - 0 1');
    expect(swaps(guard)).toEqual(['!IS:c1<>b2']);
    hands(['MorphS'], [], { guardNoSecondRank: true });
    expect(swaps(guard)).toEqual([]); // the guard would land on its second rank
  });
});

describe('MorphS: the move', () => {
  it('swaps the two pieces, takes nothing, is the turn; each keeps its own flags', () => {
    hands(['MorphS'], []);
    const pos = fromFen('4k3/8/8/8/8/8/P7/RNB1K1NR w - - 5 9');
    const m = find(pos, '!IS:a1<>c1');
    expect([m.from, m.to, m.captures, m.swap, m.power]).toEqual([parseSq('a1'), parseSq('c1'), [], true, 'morphs']);
    const next = makeMove(pos, m);
    expect(toFen(next)).toBe('4k3/8/8/8/8/8/P7/BNR1K1NR b - - 6 9 u1.0');
    expect(describeMove(pos, m)).toBe('White rook on a1 swaps places with the bishop on c1.');
    // A spent guard (`H`) stays spent where it lands.
    hands(['MorphS'], [], { guardCaptures: 'pawns', guardCaptureLimit: 1 });
    expect(toFen(play(fromFen('4k3/8/8/8/8/8/8/H1N1K3 w - - 0 1'), '!IS:a1<>c1')).split(' ')[0]).toBe('4k3/8/8/8/8/8/8/N1H1K3');
  });

  it('the same squares stay filled: never answers a check, never exposes the king; a pinned piece may swap', () => {
    hands(['MorphS'], []);
    // The rook on e8 checks the king on e1; a swap of b1 and d1 changes nothing on the e-file.
    const checked = fromFen('4r1k1/8/8/8/8/8/8/1N1BK3 w - - 0 1');
    expect(inCheck(checked)).toBe(true);
    expect(pseudoMoves(checked).some(m => m.power === 'morphs')).toBe(true);
    expect(swaps(checked)).toEqual([]);
    legalSame(checked);
    // The rook on e2 screens the catapult on e8: a knight in its place screens it too.
    const lob = fromFen('4c1k1/8/8/8/8/8/4R3/1N2K3 w - - 0 1');
    expect(inCheck(lob)).toBe(true);
    expect(swaps(lob)).toEqual([]);
    legalSame(lob);
    // The rook on e2 is pinned on the e-file; the knight that takes its square still blocks.
    const pinned = fromFen('4r1k1/8/8/8/8/8/4R3/1N2K3 w - - 0 1');
    expect(swaps(pinned)).toEqual(['!IS:b1<>e2']);
    expect(inCheck(play(pinned, '!IS:b1<>e2'))).toBe(false);
    legalSame(pinned);
  });

  it('the search plays it for a mate: the rook takes the knight\'s square on d8', () => {
    hands(['MorphS'], []);
    const pos = fromFen('3N2k1/5ppp/8/8/8/2R5/8/4K3 w - - 0 1');
    expect(toLan(pos, search(pos, { maxDepth: 2 }).move!)).toBe('!IS:c3<>d8');
    expect(status(play(pos, '!IS:c3<>d8'))).toBe('checkmate');
  });
});

describe('MorphP and MorphS: records and keys', () => {
  it('keep FEN, the search key and make/unmake in step', () => {
    hands(['MorphP', 'MorphS'], ['MorphP', 'MorphS']);
    for (const fen of ['4k3/p7/8/8/8/8/PP2N3/R3K3 w - - 0 1', '4k3/8/8/8/8/8/P7/RNB1K1NR w - - 3 7', 'rnb1k3/ppp5/8/8/8/8/8/4K3 b - - 0 1', '4k3/8/8/b7/8/8/3P4/4K3 w - - 0 1']) {
      const pos = fromFen(fen);
      const ms = legalMoves(pos).filter(isSoft);
      expect(ms.length, fen).toBeGreaterThan(0);
      for (const m of ms) {
        const next = makeMove(pos, m), lan = toLan(pos, m);
        expect(fromFen(toFen(next)), lan).toEqual(next);
        expect(positionKey(fromFen(toFen(next))), lan).toBe(positionKey(next));
        expect(probeApply(pos, m), lan).toEqual({ after: positionKey(next), back: positionKey(pos) });
      }
    }
  });

  it('a record replays by its notation; a MorphS is no maester swap, a MorphP counts as a promotion', () => {
    hands(['MorphP', 'MorphS'], ['MorphS']);
    const startFen = 'rn2k3/p7/8/8/8/8/P7/RN2K3 w - - 0 1';
    const { end, events } = replayRecord({ gameId: 1, startFen, moves: ['!IP:a2=B', '!IS:a8<>b8', '!IS:a1<>b1', 'Ke8-d8'].map(lan => ({ lan })) });
    expect(toFen(end).split(' ')[0]).toBe('nr1k4/p7/8/8/8/8/B7/NR2K3');
    expect([events.powers.morphp, events.powers.morphs, events.maesterSwaps, events.promotions]).toEqual([[1, 0], [1, 1], [0, 0], [1, 0]]);
    expect(() => replayRecord({ gameId: 2, startFen, moves: [{ lan: '!IP:e1=N' }] })).toThrow(/parsed nothing/); // the king
    expect(() => replayRecord({ gameId: 3, startFen, moves: [{ lan: '!IP:a2=R' }] })).toThrow(/parsed nothing/); // not a rook
    expect(() => replayRecord({ gameId: 4, startFen, moves: [{ lan: '!IS:a2<>b1' }] })).toThrow(/parsed nothing/); // a pawn
  });

  it('keeps its hash slot (appended after SpawnK2), with its own last-card key, text and flag', () => {
    expect(CARD_ONLY.slice(CARD_ONLY.indexOf('SpawnK2'), CARD_ONLY.indexOf('SpawnK2') + 3)).toEqual(['SpawnK2', 'MorphP', 'MorphS']);
    expect(ALL_CARDS.length).toBeLessThanOrEqual(64); // the Mirror's last-card keys: 64 slots a side (`lastIndex`)
    hands(['Mirror'], ['Mirror']);
    const pos = fromFen('4k3/8/8/8/8/8/P7/RN2K3 w - - 0 1');
    const keys = new Set<number>();
    for (const c of [WHITE, BLACK]) for (const card of ['MorphP', 'MorphS', 'SkyLift', 'Morph', 'SpawnK2'] as CardName[]) {
      const last: [CardName | undefined, CardName | undefined] = [undefined, undefined];
      last[c] = card;
      keys.add(positionKey({ ...pos, last }));
    }
    expect(keys.size).toBe(10);
    expect(parseRule('hands=morphp+MORPHS').hands![0]).toEqual(['MorphP', 'MorphS']);
    expect(cardText('MorphP')).toBe('one of your pawns becomes a knight or a bishop where it stands');
    expect(cardText('MorphS')).toBe('two of your pieces (not pawns or the king, not of one kind) swap places');
  });
});

describe('random games with MorphP and MorphS', () => {
  it('keep the legal moves, the search key, FEN and replay in step; every use does what its card says', () => {
    const deck: CardName[] = ['MorphP', 'MorphS', 'SkyLift', 'Morph', 'Mirror', 'Salvation', 'Haste', 'Freeze'];
    const played = new Set<string>();
    let seed = 73;
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
        const soft = moves.filter(isSoft);
        const m = soft.length && rng() < 0.3 ? soft[Math.floor(rng() * soft.length)] : moves[Math.floor(rng() * moves.length)];
        const next = makeMove(pos, m);
        if (isSoft(m)) {
          const c = pos.turn, where = `${toFen(pos)} ${toLan(pos, m)}`;
          played.add(m.via ? `${m.power}-${m.via}` : m.power!);
          expect(m.captures, where).toEqual([]);
          expect(inCheck(pos), where).toBe(false);
          expect(inCheck(next, c), where).toBe(false);
          if (m.power === 'morphp') {
            expect([m.from === m.to, pos.board[m.from], next.board[m.from]], where).toEqual([true, piece(P, c), piece(m.promo!, c)]);
            expect([N, B], where).toContain(m.promo);
          } else {
            const a = pos.board[m.from], b = pos.board[m.to];
            expect([colorOf(a), colorOf(b), next.board[m.from], next.board[m.to]], where).toEqual([c, c, b, a]);
            expect([P, K].includes(typeOf(a)) || [P, K].includes(typeOf(b)) || typeOf(a) === typeOf(b), where).toBe(false);
          }
          for (let s = 0; s < 64; s++) if (s !== m.from && s !== m.to) expect(next.board[s], where).toBe(pos.board[s]);
        }
        expect(probeApply(pos, m), `${toFen(pos)} ${toLan(pos, m)}`).toEqual({ after: positionKey(next), back: positionKey(pos) });
        expect(positionKey(fromFen(toFen(next)))).toBe(positionKey(next));
        record.push(toLan(pos, m));
        pos = next;
      }
      expect(toFen(replayRecord({ gameId: g, startFen, moves: record.map(lan => ({ lan })) }).end)).toBe(toFen(pos));
    }
    for (const t of ['morphp', 'morphs']) expect(played).toContain(t);
  }, 60_000);
});
