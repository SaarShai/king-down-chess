import { describe, expect, it } from 'vitest';
import { B, LETTERS, M, N, P, Q, R } from '../rules/engine';
import { F, GAME, type StoredGame, addGame, at, countGame, fromRun, fromTournament, median, newTally, reportText, summarise, total, verdict } from '../../tools/piece-activity';
import { playGame } from './game';
import { type TournamentSpec, compress, gameSpec, schedule } from './tournament';

const CLASSIC = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';

/**
 * 86 plies on the classic army: two pawn moves and Qd8xd5 (plies 1–4), then the g1 and b8 knights
 * step out and back, except Qd5xa2 at ply 50 and Ra1xa2 at ply 85.
 */
function knightsGame(openingPlies = 0): StoredGame {
  const lans = ['e2-e4', 'd7-d5', 'e4xd5', 'Qd8xd5'];
  let w = 'g1', b = 'b8';
  for (let i = 4; i < 86; i++) {
    if (i === 49) lans.push('Qd5xa2');
    else if (i === 84) lans.push('Ra1xa2');
    else if (i % 2 === 0) { const to = w === 'g1' ? 'f3' : 'g1'; lans.push(`N${w}-${to}`); w = to; }
    else { const to = b === 'b8' ? 'c6' : 'b8'; lans.push(`N${b}-${to}`); b = to; }
  }
  return { key: 'knights', gameId: 0, startFen: CLASSIC, lans, rules: {}, openingPlies, result: 1, ordinary: true };
}

describe('piece activity counting', () => {
  it('counts moves, captures, phases, first moves and never-moved pieces', () => {
    const { row, first } = countGame(knightsGame());
    const v = (t: number, f: number): number => row[at(t, f)];
    expect([Q, R, B, N].map(t => v(t, F.start))).toEqual([2, 4, 4, 4]);
    expect([Q, R, B, N].map(t => [v(t, F.moves), v(t, F.caps)])).toEqual([[2, 2], [1, 1], [0, 0], [80, 0]]);
    // Starting pieces that moved: one queen, one rook, no bishop, two knights.
    expect([Q, R, B, N].map(t => v(t, F.moved))).toEqual([1, 1, 0, 2]);
    expect([first[Q], first[R], first[B], first[N]]).toEqual([[4], [85], [], [5, 6]]);
    // Moves + captures per phase: opening plies 1–30, middle 31–80, end 81+.
    const ev = (t: number): number[] => [0, 1, 2].map(ph => v(t, F.ev + ph));
    expect([ev(Q), ev(R), ev(B), ev(N)]).toEqual([[2, 2, 0], [0, 0, 2], [0, 0, 0], [26, 49, 5]]);
    // Exposure: the mover's pieces of the type at each ply. Black's queen is gone for ply 86.
    const exp = (t: number): number[] => [0, 1, 2].map(ph => v(t, F.exp + ph));
    expect([exp(Q), exp(N)]).toEqual([[30, 50, 5], [60, 100, 12]]);
    expect([row[GAME], row[GAME + 1], row[GAME + 2], row[GAME + 3]]).toEqual([1, 0, 1, 86]);
    expect(median(first[N])).toBe(5.5);

    const st = summarise(row, [Q, R, B, N], new Set()).get(N)!;
    expect(st.movesPer).toBe(20);
    expect(st.movesX).toBeCloseTo(20 / (83 / 14), 9);
    expect(st.instUsed).toBe(0.5);
    expect(st.act).toEqual([26 / 60, 49 / 100, 5 / 12]);
    expect(st.whole).toBeCloseTo(80 / 172, 12);
    expect(summarise(row, [Q, R, B, N], new Set()).get(Q)!.capsX).toBeCloseTo(1 / (3 / 14), 9);
  });

  it('leaves the random opening plies out', () => {
    const { row, first } = countGame(knightsGame(4));
    expect([row[at(Q, F.moves)], row[at(Q, F.caps)]]).toEqual([1, 1]);
    expect(first[Q]).toEqual([50]);
    expect([row[at(N, F.ev)], row[at(N, F.exp)], row[at(Q, F.exp)]]).toEqual([26, 52, 26]);
  });

  it('compares games with and without a piece in the army', () => {
    const tally = newTally();
    addGame(tally, knightsGame());
    addGame(tally, { key: 'maester', gameId: 1, startFen: 'rnbmkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBMKBNR w - - 0 1', lans: ['e2-e4', 'e7-e5'], rules: {}, openingPlies: 0, result: 0.5, ordinary: true });
    addGame(tally, { ...knightsGame(), key: 'powers', ordinary: false });
    expect([tally.rows.length, tally.powers, tally.failed.length]).toEqual([2, 1, 0]);
    const st = summarise(total(tally.rows), [Q, R, B, N, M], new Set());
    const q = st.get(Q)!, m = st.get(M)!;
    expect([q.games, q.without, q.dDraws, q.dWhite, q.dLength]).toEqual([1, 1, -1, 0.5, 42]);
    expect([m.games, m.without, m.dDraws, m.dWhite]).toEqual([1, 1, 1, -0.5]);
    expect(m.dLength).toBeCloseTo(2 / 86 - 1, 12);
    expect(m.instUsed).toBe(0);
    expect(reportText(tally, 20)).toContain('| Q queen | 1 | 2 |');
  });

  it('a promoted pawn is a new piece: its moves count for its new type, but it is not a starting piece', () => {
    const lans = ['a7-a8=Q', 'Ke8-e7', 'Qa8-a1', 'Ke7-e6', 'Qa1-a2', 'Ke6-e7'];
    const { row, first } = countGame({ key: 'promo', gameId: 2, startFen: '4k3/P7/8/8/8/8/8/4K3 w - - 0 1', lans, rules: {}, openingPlies: 0, result: 0.5, ordinary: true });
    const v = (t: number, f: number): number => row[at(t, f)];
    expect([v(P, F.start), v(P, F.moves), v(P, F.moved)]).toEqual([1, 1, 1]);
    expect([v(Q, F.start), v(Q, F.moves), v(Q, F.moved), v(Q, F.exp)]).toEqual([0, 2, 0, 2]);
    expect(first[Q]).toEqual([]);
  });

  it('exposure is counted once per turn: a Haste turn of two plies is one turn', () => {
    // Flame's Haste for White: Ng1-f3!H holds the turn, and Nf3-g5 ends it.
    const g: StoredGame = {
      key: 'haste', gameId: 3, startFen: CLASSIC, lans: ['e2-e4', 'e7-e5', 'Ng1-f3!H', 'Nf3-g5', 'Nb8-c6', 'Bf1-c4'],
      rules: { kings: [{ king: 'Flame', power: 'Haste' }, null] }, openingPlies: 0, result: 0.5, ordinary: false,
    };
    const { row } = countGame(g);
    // White's knights: 3 turns × 2; Black's: 2 turns × 2. The power move is not counted, its second move is.
    expect([row[at(N, F.exp)], row[at(N, F.moves)], row[at(B, F.exp)]]).toEqual([10, 2, 10]);
  });

  it('a record that does not replay is counted as failed, not as a game', () => {
    const tally = newTally();
    addGame(tally, { ...knightsGame(), lans: ['e2-e4', 'Qd8-d4'] });
    expect([tally.rows.length, tally.failed.length]).toEqual([0, 1]);
  });

  it('agrees with the counts the games recorded as they were played (run and tournament records)', () => {
    // Depth 1 on fairy armies: archer shots, maester swaps, ogre shoves and beast captures all occur.
    const t: TournamentSpec = {
      id: 'pa', entrants: ['none'], pairs: 3, armies: 'perPair', mirrorOnly: true, depth: 1, seed: 7,
      rules: {}, mirror: true, maxPlies: 160, openingRandomPlies: 4,
    };
    const jobs = schedule(t);
    const extra = ['AOMSKGNB', 'SMAOKRBA'];
    let special = 0;
    for (const [k, job] of [...jobs, ...extra.map((backRank, i) => ({ ...jobs[0], gameId: 10 + i, backRank }))].entries()) {
      const spec = gameSpec(t, job);
      const rec = playGame(spec, { gameId: job.gameId, pairId: job.pairId, colourSwapped: false, configId: job.backRank, seed: job.seed, backRankWhite: job.backRank, backRankBlack: job.backRank });
      special += rec.events.archerShots[0] + rec.events.archerShots[1] + rec.events.maesterSwaps[0] + rec.events.maesterSwaps[1] + rec.events.ogreShoves[0] + rec.events.ogreShoves[1];
      const games = [fromTournament(compress(job, rec), t, 'pa.jsonl'), fromRun(rec, 'pa-run.jsonl', spec.rules)];
      for (const g of games) {
        const { row } = countGame(g, true);
        for (let ty = 1; ty < LETTERS.length; ty++) {
          const l = LETTERS[ty], sum = (r: Record<string, number>[]): number => (r[0][l] ?? 0) + (r[1][l] ?? 0);
          expect([k, l, row[at(ty, F.start)], row[at(ty, F.moves)], row[at(ty, F.caps)]])
            .toEqual([k, l, sum(rec.stats.map(s => s.start)), sum(rec.stats.map(s => s.moves)), sum(rec.stats.map(s => s.captures))]);
        }
      }
    }
    expect(special).toBeGreaterThan(0);
  });

  it('verdicts: the whole interval decides PASS and FAIL', () => {
    expect(verdict(0.9, [0.86, 0.94], 0.85)).toBe('PASS');
    expect(verdict(0.9, [0.8, 0.94], 0.85)).toBe('pass?');
    expect(verdict(0.8, [0.7, 0.9], 0.85)).toBe('fail?');
    expect(verdict(0.8, [0.7, 0.84], 0.85)).toBe('FAIL');
    expect(verdict(1.6, [1.4, 1.7], 0.5, 1.5)).toBe('fail?');
    expect(verdict(NaN, undefined, 0.5)).toBe('n/a');
    // No interval (`--boot 0`): the point alone settles nothing.
    expect(verdict(0.9, undefined, 0.85)).toBe('pass?');
    expect(verdict(0.8, undefined, 0.85)).toBe('fail?');
    const tally = newTally();
    addGame(tally, knightsGame());
    expect(reportText(tally, 0)).not.toMatch(/\| (PASS|FAIL) /);
  });
});
