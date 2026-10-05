import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GameRecord, startGame, playGame } from './game';
import { analyze, elo, excessDecisiveness, fitValues, group, leadMetrics, matchStats, materialDelta, pentanomial, phi, readRecords, sprt, trajectory, utilisation, wilson } from './analyze';
import { RunSpec, adjudication, buildJobs, loadSpec, parseFlags, parseRuleFlags, parseValues, paths, sampleBackRank, sideOptions, usePairs } from './spec';
import { checkResume, stampOf } from './run';
import { eventsMatch, replayRecord } from './replay';
import { ARCHER_V, GUARD_V, VALUES, evaluate, setPieceValues } from '../ai/eval';
import { armStats, swapRank, valueSpecs } from './experiments';
import { applyDrawRules } from './game';
import { mulberry32 } from './rng';
import { Game } from '../game';
import { A, BLACK, G, WHITE, moverAt, parseSq } from '../rules/engine';
import { setRules } from '../rules/rules';
import { CLASSIC_CHESS } from '../rules/setup';

describe('statistics', () => {
  it('wilson matches published values', () => {
    const [lo, hi] = wilson(50, 100);
    expect(lo).toBeCloseTo(0.4038, 3);
    expect(hi).toBeCloseTo(0.5962, 3);
    expect(wilson(0, 10)[0]).toBe(0);
    expect(wilson(0, 10)[1]).toBeCloseTo(0.2775, 3);
    expect(wilson(10, 10)[0]).toBeCloseTo(0.7225, 3);
    expect(wilson(10, 10)[1]).toBeCloseTo(1, 12);
  });

  it('elo matches the standard score curve', () => {
    expect(elo(0.5)).toBeCloseTo(0, 6);
    expect(elo(0.6)).toBeCloseTo(70.44, 2);
    expect(elo(0.75)).toBeCloseTo(190.85, 2);
    expect(elo(0.25)).toBeCloseTo(-190.85, 2);
    expect(Number.isFinite(elo(1))).toBe(true);
  });

  it('phi is a standard normal CDF', () => {
    expect(phi(0)).toBeCloseTo(0.5, 6);
    expect(phi(1.959964)).toBeCloseTo(0.975, 4);
    expect(phi(-1.959964)).toBeCloseTo(0.025, 4);
  });

  it('matchStats: a dead-even trinomial is 0 Elo, 50% LOS, and pairs get the sqrt(2) sigma', () => {
    const m = matchStats([25, 50, 25], 100); // L, D, W
    expect(m.mu).toBeCloseTo(0.5, 6);
    expect(m.elo).toBeCloseTo(0, 6);
    expect(m.los).toBeCloseTo(0.5, 6);
    expect(m.sigmaPg).toBeCloseTo(Math.sqrt(m.variance), 9);
    // A pentanomial with the same variance takes sqrt(2 * v).
    const p = matchStats([0, 0, 100, 0, 0], 200);
    expect(p.sigmaPg).toBeCloseTo(Math.sqrt(2 * p.variance), 9);
    // A clean sweep leans the right way and is confident.
    expect(matchStats([0, 0, 100], 100).elo).toBeGreaterThan(500);
    expect(matchStats([0, 0, 100], 100).los).toBeGreaterThan(0.99);
  });

  it('parseFlags reads values, bare flags and --k=v', () => {
    expect(parseFlags(['--games', '200', '--tty', '--id=smoke'])).toEqual({ games: '200', tty: true, id: 'smoke' });
  });

  it('mulberry32 is deterministic and in range', () => {
    const a = Array.from({ length: 5 }, mulberry32(7));
    expect(Array.from({ length: 5 }, mulberry32(7))).toEqual(a);
    expect(a.every(x => x >= 0 && x < 1)).toBe(true);
  });

  it('sampleBackRank honours a pool and keeps bishops on opposite colours', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 50; i++) {
      const r = sampleBackRank(rng, 'QRRBBNNAA');
      expect(r).toHaveLength(8);
      expect(r.split('K')).toHaveLength(2);
      expect([...r].every(c => 'QRBNAK'.includes(c))).toBe(true);
      const b = [...r].flatMap((c, i2) => (c === 'B' ? [i2] : []));
      if (b.length === 2) expect((b[0] + b[1]) % 2).toBe(1);
    }
  });
});

describe('spec', () => {
  const base = { id: 'x', games: 6, backRanks: { sample: 3 }, ai: {}, seed: 9 };

  it('a fixed-depth run ignores the wall clock, and the pair swaps the sides', () => {
    const spec = { ...base, ai: { white: { depth: 2 }, black: { depth: 4 } } };
    expect(sideOptions(spec)).toEqual([{ maxDepth: 2, timeMs: Infinity }, { maxDepth: 4, timeMs: Infinity }]);
    expect(sideOptions(spec, true)).toEqual([{ maxDepth: 4, timeMs: Infinity }, { maxDepth: 2, timeMs: Infinity }]);
    expect(sideOptions({ ...base, ai: { timeMs: 250 } })).toEqual([{ timeMs: 250 }, { timeMs: 250 }]);
  });

  it('pairs default off for identical sides and on when the sides differ', () => {
    expect(usePairs(base)).toBe(false);
    expect(usePairs({ ...base, ai: { white: { depth: 2 }, black: { depth: 4 } } })).toBe(true);
    expect(usePairs({ ...base, asymmetric: [{ white: 'RNBQKBNR', black: 'RNBQKBNA' }] })).toBe(true);
    expect(usePairs({ ...base, pairs: true })).toBe(true);
  });

  it('paired jobs share a config and an opening seed and swap the back ranks', () => {
    const jobs = buildJobs({ ...base, pairs: true, asymmetric: [{ white: 'RNBQKBNR', black: 'AAGGKMMS' }] });
    expect(jobs).toHaveLength(6);
    const [a, b] = jobs;
    expect([a.pairId, b.pairId]).toEqual([0, 0]);
    expect([a.colourSwapped, b.colourSwapped]).toEqual([false, true]);
    expect(a.seed).toBe(b.seed);
    expect([a.backRankWhite, a.backRankBlack]).toEqual([b.backRankBlack, b.backRankWhite]);
    expect(a.configId).toBe(b.configId);
  });

  it('unpaired jobs cycle the sampled configs and are seed-stable', () => {
    const jobs = buildJobs(base);
    expect(jobs.map(j => j.configId)).toEqual(buildJobs(base).map(j => j.configId));
    expect(new Set(jobs.map(j => j.configId)).size).toBe(3);
    expect(jobs.every(j => j.backRankWhite === j.backRankBlack && !j.colourSwapped)).toBe(true);
  });

  it('adjudication defaults to Fishtest values and takes overrides', () => {
    expect(adjudication(base)).toEqual({ resignCp: 600, resignPlies: 3, drawCp: 20, drawPlies: 8, drawAfterPly: 68 });
    expect(adjudication({ ...base, adjudicate: false })).toBeNull();
    expect(adjudication({ ...base, adjudicate: { evalCp: 900, plies: 5 } }))
      .toMatchObject({ resignCp: 900, resignPlies: 5, drawCp: 20 });
    expect(adjudication({ ...base, adjudicate: { drawAfterPly: 40 } })).toMatchObject({ drawAfterPly: 40, resignCp: 600 });
  });
});

describe('trajectory', () => {
  it('counts lead changes after ply 10 with a dead band, and drama for the winner', () => {
    const cps = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 200, 200, -200, -200];
    const rec = (result: 1 | 0.5 | 0) => ({
      plies: cps.length, result,
      moves: cps.map(cp => ({ lan: 'a2-a3', cp, legal: 20, ms: 0 })),
    }) as GameRecord;
    const t = trajectory(rec(0.5));
    expect(t.leadChanges).toBe(1);
    expect(t.volatility).toBeCloseTo(600 / 13, 6);
    expect(t.uncertainty).toBeCloseTo(10 / 14, 6);
    expect(t.branchingFactor).toBe(20);
    expect(t.drama).toBe(0);                      // a draw has no winner
    expect(trajectory(rec(1)).drama).toBe(200);   // white won after being 200 down
    expect(trajectory(rec(0)).drama).toBe(200);   // black won after being 200 down
    expect(t.stability).toBeGreaterThan(0);
    expect(t.stability).toBeLessThanOrEqual(1);
  });
});

/** Hand-built records with counts that are obvious by inspection. */
function tinyRecords(): GameRecord[] {
  const stats = (moves: Record<string, number>, captures: Record<string, number>, taken: Record<string, number>) =>
    ({ moves, captures, taken, survived: { K: 1 }, start: { K: 1, P: 8 } });
  const base = (gameId: number, result: 1 | 0.5 | 0, reason: GameRecord['reason'], configId: string) => ({
    gameId, pairId: gameId >> 1, colourSwapped: (gameId & 1) === 1, configId, seed: gameId,
    backRankWhite: configId, backRankBlack: configId, openingPlies: 0, startFen: '', result, reason,
    plies: 20, ms: 1, firstCapturePly: 5, coverage: 0.5,
    moves: Array.from({ length: 20 }, (_, k) => ({ lan: 'a2-a3', cp: k < 10 ? 0 : 300, legal: 30, ms: 0 })),
    events: {
      archerShots: [1, 2], beastChains: [[2, 3], [1]], maesterSwaps: [1, 0], maesterLongSwaps: [1, 0],
      paladinSacrifices: [0, 1], promotions: [2, 0], checks: [3, 4],
    },
    stats: [stats({ P: 10, A: 3 }, { A: 2 }, { P: 1 }), stats({ P: 8 }, { P: 1 }, { A: 2 })],
  }) as unknown as GameRecord;
  // Games 0+1 are a complete colour-swapped pair (W then L -> pair score 1.0 -> the middle bucket).
  return [base(0, 1, 'checkmate', 'RNBQKBNR'), base(1, 1, 'checkmate', 'RNBQKBNR'), base(2, 0.5, 'drawRepetition', 'AAGGKMMS')];
}

describe('analyze', () => {
  it('computes the expected counts on a hand-built JSONL', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kdsim-'));
    const file = join(dir, 'tiny.jsonl');
    writeFileSync(file, tinyRecords().map(r => JSON.stringify(r)).join('\n') + '\n');
    const recs = readRecords(file);
    const r = analyze('tiny', recs);
    rmSync(dir, { recursive: true, force: true });

    expect(r.games).toBe(3);
    expect(r.overall).toMatchObject({ wins: 2, draws: 1, losses: 0, games: 3 });
    expect(r.overall.score).toBeCloseTo(2.5 / 3, 6);
    expect(r.overall.decisiveness).toBeCloseTo(2 / 3, 6);
    expect(r.overall.meanPlies).toBe(20);
    expect(r.overall.medianPlies).toBe(20);
    expect(r.overall.sdPlies).toBe(0);
    expect(r.overall.boardCoverage).toBeCloseTo(0.5, 6);
    expect(r.overall.branchingFactor).toBe(30);
    expect(r.reasons).toEqual({ checkmate: 2, drawRepetition: 1 });

    // Pair 0 = white win + (swapped) white win -> 1 + (1 - 1) = 1.0 -> bucket index 2. Game 2 is unpaired.
    expect(pentanomial(recs)).toEqual({ counts: [0, 0, 1, 0, 0], pairs: 1 });

    // 3 games x (archer 1+2) shots; beast chains 2+3+1 captures over 3 chain moves; etc.
    expect(r.events).toEqual({
      archerShots: 9, beastChainMoves: 9, beastChainCaptures: 18, maesterSwaps: 3,
      maesterLongSwaps: 3, paladinSacrifices: 3, promotions: 6, checks: 21,
      // These records carry no lab-piece counters, which is what every game stored before
      // 2026-09-14 looks like: `eventTotals` reads them as zero instead of throwing.
      ogreShoves: 0, ogreShovesFriend: 0, ogreShovesGuard: 0, catapultChecks: 0,
    });

    const pawn = r.pieces.find(p => p.piece === 'P')!;
    expect(pawn).toMatchObject({ moves: 54, captures: 3, taken: 3, started: 48, survived: 0 });
    expect(pawn.survival).toBe(0);
    expect(r.pieces.find(p => p.piece === 'A')!).toMatchObject({ moves: 9, captures: 6, taken: 6 });
    expect(r.pieces.find(p => p.piece === 'K')!.survival).toBe(1);

    expect(r.byConfig.map(g => [g.key, g.games])).toEqual([['RNBQKBNR', 2], ['AAGGKMMS', 1]]);
    expect(r.mostBalanced[0].key).toBe('AAGGKMMS'); // score 0.5 -> 0 Elo, vs 1.0 -> the clamp
    expect(r.mostFun.map(g => g.key).sort()).toEqual(['AAGGKMMS', 'RNBQKBNR']);
  });
});

describe('runner (end to end)', () => {
  it('plays 2 games at depth 1 on 1 worker and records legal moves', () => {
    const id = 'vitest-e2e';
    const { jsonl, summary } = paths(id);
    for (const f of [jsonl, summary]) rmSync(f, { force: true });

    execFileSync('node_modules/.bin/tsx',
      ['src/sim/run.ts', '--id', id, '--games', '2', '--depth', '1', '--sample', '2', '--seed', '5',
        '--workers', '1', '--maxPlies', '60', '--openingRandomPlies', '4'],
      { stdio: 'pipe', timeout: 110_000 }); // a sync call blocks vitest's own timeout

    const recs = readRecords(jsonl);
    expect(recs).toHaveLength(2);
    expect(recs.map(r => r.gameId).sort()).toEqual([0, 1]);
    for (const rec of recs) {
      expect(rec.plies).toBeGreaterThan(0);
      expect(rec.moves).toHaveLength(rec.plies);
      expect([1, 0.5, 0]).toContain(rec.result);
      expect(rec.startFen).toMatch(/ w - - 0 1$/);
      expect(rec.moves.slice(0, 4).every(m => m.cp === undefined)).toBe(true);   // opening plies
      expect(rec.moves.slice(4).every(m => typeof m.cp === 'number')).toBe(true);
      expect(rec.moves.every(m => m.legal > 0)).toBe(true);

      // Replay through Game: every recorded LAN has to be legal in turn.
      const g = startGame(rec.backRankWhite, rec.backRankBlack);
      expect(g.playLan(rec.moves.map(m => m.lan))).toBe(rec.plies);
      if (rec.reason === 'checkmate') expect(g.status).toBe('checkmate');
      if (rec.reason === 'plyCap') expect(rec.plies).toBe(60);
    }
    expect(JSON.parse(readFileSync(summary, 'utf8')).games).toBe(2);
    for (const f of [jsonl, summary]) rmSync(f, { force: true });
  }, 120_000);

  it('resumes games it would replay, and refuses ones it would not', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kdsim-'));
    const file = join(dir, 'resume.jsonl');
    const spec: RunSpec = { id: 'vitest-resume', games: 4, backRanks: ['KQRBNMAG', 'KSRBNMAG'], ai: { depth: 1 }, seed: 1 };
    // Two finished games, stamped the way run() stamps them.
    writeFileSync(file, buildJobs(spec).slice(0, 2)
      .map(j => JSON.stringify({ gameId: j.gameId, pairId: j.pairId, configId: j.configId, plies: 20, ...stampOf(spec) }))
      .join('\n') + '\n');

    expect([...checkResume(spec, buildJobs(spec), file).keys()]).toEqual([0, 1]);

    const repooled: RunSpec = { ...spec, backRanks: ['KQRBNMAG', 'KGRBNMAS'] };
    expect(() => checkResume(repooled, buildJobs(repooled), file)).toThrow(/refusing to resume .* arrangements/);

    const buffed: RunSpec = { ...spec, rules: { guardCaptures: 'any' } };
    expect(() => checkResume(buffed, buildJobs(buffed), file)).toThrow(/refusing to resume .*guardCaptures/);

    rmSync(dir, { recursive: true, force: true });
  });

  it('rejects unstamped history, torn lines, mixed stamps and a different source', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kdsim-'));
    const file = join(dir, 'scan.jsonl');
    const spec: RunSpec = { id: 'vitest-scan', games: 2, backRanks: ['KQRBNMAG', 'KSRBNMAG'], ai: { depth: 1 }, seed: 1 };
    const jobs = buildJobs(spec);
    const line = (j: (typeof jobs)[number], over: object = {}): string =>
      JSON.stringify({ gameId: j.gameId, pairId: j.pairId, configId: j.configId, plies: 10, ...stampOf(spec), ...over });

    // A stamp-less line is history, not a resume point: its rules are unknown.
    writeFileSync(file, line(jobs[0], { rules: undefined, rulesKey: undefined, pool: undefined, specKey: undefined, src: undefined }) + '\n');
    expect(() => checkResume(spec, jobs, file)).toThrow(/no rule\/source stamp/);

    // A final line without its newline is a partial write; appending would corrupt the file.
    writeFileSync(file, [line(jobs[0]), line(jobs[1])].join('\n'));
    expect(() => checkResume(spec, jobs, file)).toThrow(/torn or unreadable/);

    // Two stamps in one file: a resumed run under rules nobody can reconstruct.
    const other = stampOf({ ...spec, rules: { guardCaptures: 'any' } });
    writeFileSync(file, [line(jobs[0]), line(jobs[1], other)].join('\n') + '\n');
    expect(() => checkResume(spec, jobs, file)).toThrow(/more than one stamp|mixes/);

    // Identical spec resumes; a changed search setting or source does not, even with the same ranks.
    writeFileSync(file, jobs.map(j => line(j)).join('\n') + '\n');
    expect([...checkResume(spec, jobs, file).keys()]).toEqual([0, 1]);
    const deeper: RunSpec = { ...spec, ai: { depth: 2 } };
    expect(() => checkResume(deeper, buildJobs(deeper), file)).toThrow(/seed, arrangements, search settings/);
    writeFileSync(file, jobs.map(j => line(j, { src: 'deadbeef' })).join('\n') + '\n');
    expect(() => checkResume(spec, jobs, file)).toThrow(/played by source/);

    rmSync(dir, { recursive: true, force: true });
  });

  it('replayRecord reproduces the events of a game the runner just played', () => {
    const spec: RunSpec = { id: 'vitest-replay', games: 1, backRanks: ['KQRBNMAG'], ai: { depth: 1 }, seed: 7, openingRandomPlies: 2, maxPlies: 40 };
    const rec = playGame(spec, buildJobs(spec)[0]);
    expect(rec.plies).toBeGreaterThan(0);
    const replay = replayRecord(rec);
    expect(replay.plies).toBe(rec.plies);
    expect(eventsMatch(replay.events, rec.events)).toBeNull();
    setRules();
  }, 60_000);
});


// -----------------------------------------------------------------------------------------------
// Stage 2: rules in the spec, the Browne metrics, SPRT and the experiment helpers.

/** A record with a given eval trace; `gap` feeds the decision-cost metric. */
const traced = (cps: number[], result: 1 | 0.5 | 0, extra: Partial<GameRecord> = {}): GameRecord => ({
  plies: cps.length, result, reason: 'checkmate',
  moves: cps.map(cp => ({ lan: 'a2-a3', cp, legal: 20, ms: 0 })),
  stats: [{ moves: {}, captures: {}, taken: {}, survived: {}, start: {} }, { moves: {}, captures: {}, taken: {}, survived: {}, start: {} }],
  ...extra,
}) as unknown as GameRecord;

describe('rule flags in a run spec', () => {
  it('collects every --rule and merges them left to right', () => {
    expect(parseRuleFlags(['--rule', 'beastChains=false', '--rule=guardCaptures=any', '--depth', '3']))
      .toEqual({ beastChains: false, guardCaptures: 'any' });
    expect(parseRuleFlags(['--depth', '3'])).toEqual({});
    expect(() => parseRuleFlags(['--rule', 'bogus=1'])).toThrow();
  });

  it('commonSeeds gives every configuration the same opening seeds', () => {
    const base = { id: 'x', games: 6, ai: {}, seed: 3, backRanks: ['RNBQKBNR', 'AAGGKMMS', 'SSLLKMMB'] };
    const plain = buildJobs(base).map(j => j.seed);
    const common = buildJobs({ ...base, commonSeeds: true }).map(j => j.seed);
    expect(new Set(plain).size).toBe(6);           // one stream per game
    expect(new Set(common).size).toBe(2);          // two openings, replayed by all three ranks
    expect(common.slice(0, 3)).toEqual([common[0], common[0], common[0]]);
  });
});

describe('runtime piece values', () => {
  it('--values re-prices the eval, and a bare reset restores the shipped constants', () => {
    expect(parseValues('A=270,G=180')).toEqual({ A: 270, G: 180 });
    expect(() => parseValues('X=1')).toThrow();
    expect(() => parseValues('A=lots')).toThrow();
    expect(loadSpec(['--id', 'v', '--values', 'A=270,G=180']).values).toEqual({ A: 270, G: 180 });

    // White holds the only archer and the only guard, so the score moves by exactly the re-pricing.
    // `evaluateBoard` reads the private `VAL` array, so this also proves the derived table is
    // rebuilt and not left stale behind the exported `VALUES` record.
    const pos = startGame('AGNQKBNR', 'RNBQKBNR').pos;
    const before = evaluate(pos);
    setPieceValues({ A: 380, G: 180 });
    expect([VALUES[A], VALUES[G]]).toEqual([380, 180]);
    // Against the shipped constants, not against numbers copied out of eval.ts: the tuner rewrites
    // those (docs/research/sim-tuning-2026-09-13.md) and this test is about the plumbing.
    expect(evaluate(pos) - before).toBe(380 - ARCHER_V + (180 - GUARD_V));
    setPieceValues();
    expect([VALUES[A], VALUES[G]]).toEqual([ARCHER_V, GUARD_V]);
    expect(evaluate(pos)).toBe(before);
  });
});

describe('threefold toggle (runner side)', () => {
  it('applyDrawRules re-opens a repetition draw when the rule is off', () => {
    const drive = (): Game => {
      const g = new Game(CLASSIC_CHESS);
      const play = (from: string, to: string) => g.play(g.legal.find(m => m.from === parseSq(from) && m.to === parseSq(to))!);
      for (let i = 0; i < 2; i++) { play('b1', 'c3'); play('b8', 'c6'); play('c3', 'b1'); play('c6', 'b8'); }
      return g;
    };
    const g = drive();
    expect(g.status).toBe('drawRepetition');
    applyDrawRules(g);
    expect(g.status).toBe('drawRepetition');       // rule on: nothing changes
    setRules({ threefold: false });
    applyDrawRules(g);
    expect(g.status).toBe('playing');
    setRules();
  });
});

describe('Browne lead metrics', () => {
  it('counts lead changes, drama, killer moves and uncertainty on a squashed lead', () => {
    const m = leadMetrics(traced([0, 0, 0, 0, -400, -400, 400, 400], 1));
    expect(m.leadChange).toBeCloseTo(1 / 7, 6);    // one sign flip over T-1 steps
    expect(m.drama).toBeGreaterThan(0);            // white won after being 400 down
    expect(leadMetrics(traced([0, 0, 0, 0, -400, -400, 400, 400], 0.5)).drama).toBe(0);
    expect(m.killerMove).toBeGreaterThan(0);
    for (const v of [m.killerMove, m.leadChange, m.uncertaintyLate, m.permanence, m.drama]) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    // A game decided at once is less uncertain than one that stays level to the end.
    const early = leadMetrics(traced(Array.from({ length: 40 }, () => 900), 1));
    const late = leadMetrics(traced([...Array.from({ length: 38 }, () => 0), 900, 900], 1));
    expect(late.uncertaintyLate).toBeGreaterThan(early.uncertaintyLate);
  });

  it('reads the mover from the rules, not from ply parity (secondPlayerDoubleFirstTurn)', () => {
    // Black plays plies 1 *and* 2, so from ply 2 on the mover is shifted by one.
    const dbl = { secondPlayerDoubleFirstTurn: true };
    expect([0, 1, 2, 3, 4].map(i => moverAt(i, dbl))).toEqual([WHITE, BLACK, BLACK, WHITE, BLACK]);
    expect([0, 1, 2, 3, 4].map(i => moverAt(i, {}))).toEqual([WHITE, BLACK, WHITE, BLACK, WHITE]);

    // The same game told twice. Under the rule the movers are W B B W B W; repeating ply 1's score
    // under the defaults relabels them W B (W) B W B — the same side on every real swing, plus one
    // zero delta, which cannot raise a maximum. So the killer move has to come out identical.
    const cps = [0, -30, 120, -400, 250, 90];
    const on = traced(cps, 1, { rules: dbl });
    const relabelled = traced([cps[0], cps[1], cps[1], ...cps.slice(2)], 1);
    expect(leadMetrics(on).killerMove).toBeCloseTo(leadMetrics(relabelled).killerMove, 12);
    // …and it is not what plain ply parity used to say: that read the swing against the mover.
    expect(leadMetrics(traced(cps, 1)).killerMove).not.toBeCloseTo(leadMetrics(on).killerMove, 6);

    // Fallback chain: the record's own stamp, else the rules the caller (`analyze`) was given.
    expect(leadMetrics(traced(cps, 1), dbl).killerMove).toBeCloseTo(leadMetrics(on).killerMove, 12);
    expect(group('k', [traced(cps, 1)], dbl).lead.killerMove).toBeCloseTo(leadMetrics(on).killerMove, 12);
    // Decision cost is bucketed by mover too, so it follows the same rule.
    const gaps = (rules?: Partial<GameRecord['rules']>) => leadMetrics(traced([0, 0, 0], 1, {
      rules, moves: [0, 200, 0].map(gap => ({ lan: 'a2-a3', cp: 0, gap, legal: 9, ms: 0 })),
    } as Partial<GameRecord>)).decisionCost;
    expect(gaps().map(x => x > 0.5)).toEqual([true, false]);      // plies 0 and 2 are White's
    expect(gaps(dbl).map(x => x > 0.5)).toEqual([true, true]);    // …ply 2 is Black's under the rule
  });

  it('decision cost falls as the best move gets clearer', () => {
    const withGap = (gap: number) => leadMetrics({
      plies: 2, result: 0.5, moves: [{ lan: 'a', cp: 0, gap, legal: 9, ms: 0 }, { lan: 'b', cp: 0, gap, legal: 9, ms: 0 }],
    } as unknown as GameRecord);
    expect(withGap(0).decisionCost[0]).toBeCloseTo(1, 6);   // log2(1 + e^0) = 1 bit
    expect(withGap(200).decisionCost[0]).toBeLessThan(0.01);
    expect(withGap(0).decisionAsymmetry).toBeCloseTo(0, 6);
  });
});

describe('excess decisiveness and utilisation', () => {
  it('regresses decisiveness on |score - 0.5| and keeps the residual', () => {
    const g = (score: number, dec: number) => ({ score, decisiveness: dec, excessDecisiveness: 0 }) as ReturnType<typeof group>;
    // Perfectly linear: every residual is 0. Then lift one point and only that one moves up.
    const linear = [g(0.5, 0.2), g(0.6, 0.4), g(0.7, 0.6)];
    excessDecisiveness(linear);
    for (const x of linear) expect(x.excessDecisiveness).toBeCloseTo(0, 9);
    const bumped = [g(0.5, 0.2), g(0.6, 0.5), g(0.7, 0.6)];
    excessDecisiveness(bumped);
    expect(bumped[1].excessDecisiveness).toBeGreaterThan(0);
  });

  it('utilisation is move share over starting-material share', () => {
    const rec = {
      stats: [{ moves: { P: 30, A: 10 }, captures: {}, taken: {}, survived: {}, start: { P: 8, A: 2 } },
        { moves: { P: 40, A: 0 }, captures: {}, taken: {}, survived: {}, start: { P: 8, A: 2 } }],
    } as unknown as GameRecord;
    const u = utilisation([rec]);
    expect(u.P).toBeCloseTo((70 / 80) / (16 / 20), 6);
    expect(u.A).toBeCloseTo((10 / 80) / (4 / 20), 6);
  });

  it('a capped game is its own class, not a draw', () => {
    const recs = [traced([0], 1), traced([0], 0.5, { reason: 'drawRepetition' }), traced([0], 0.5, { reason: 'plyCap' })];
    const g = group('k', recs);
    expect(g.timeouts).toBeCloseTo(1 / 3, 6);
    expect(g.drawRate).toBeCloseTo(1 / 3, 6);
    expect(g.decisiveness).toBeCloseTo(1 / 3, 6);
    expect(g.drawRate + g.timeouts + g.decisiveness).toBeCloseTo(1, 6);
  });
});

describe('SPRT', () => {
  it('stays undecided on a dead-even result and decides a one-sided one', () => {
    expect(sprt([0, 0, 200, 0, 0], 400).verdict).toBe('continue');
    expect(sprt([20, 80, 300, 300, 100], 1600).verdict).toBe('H1');
    expect(sprt([100, 300, 300, 80, 20], 1600).verdict).toBe('H0');
    // Symmetric bounds give a symmetric LLR; the default [0, +4] pair does not, so only the sign mirrors.
    expect(sprt([20, 80, 300, 300, 100], 1600, -4, 4).llr).toBeCloseTo(-sprt([100, 300, 300, 80, 20], 1600, -4, 4).llr, 6);
    expect(sprt([0, 0, 200, 0, 0], 400).expectedGames).toBe(Math.round(1_046_535 / 16));
    // The LLR is clamped to +-games * (nelo1 - nelo0) / (2 * C) so early noise cannot end a test.
    expect(Math.abs(sprt([10, 20, 30, 20, 10], 200).llr)).toBeLessThanOrEqual(200 * (4 / (800 / Math.log(10))) / 2 + 1e-9);
    // A clean sweep has no variance, so the approximation flattens: undecided, not H1.
    expect(sprt([0, 0, 0, 0, 400], 800).verdict).toBe('continue');
  });
});

describe('value experiment', () => {
  it('builds one arm per fairy piece plus a pawn-odds calibration arm', () => {
    const specs = valueSpecs({ id: 'v', games: 10, ai: { depth: 3 }, seed: 1 });
    expect(specs).toHaveLength(6);
    expect(specs.map(s => s.id)).toEqual(['v.A', 'v.L', 'v.G', 'v.M', 'v.S', 'v.pawn']);
    expect(swapRank('A')).toBe('RABQKBNR');
    expect(specs[0].asymmetric).toEqual([{ white: 'RABQKBNR', black: CLASSIC_CHESS }]);
    expect(specs.every(s => s.pairs)).toBe(true);
    const pawn = specs[5].asymmetric!;
    expect(pawn).toHaveLength(8);                  // one per file: an average pawn, not the h-pawn
    expect(pawn[0].fen).toMatch(/1PPPPPPP/);       // white is a pawn down
    expect(pawn[7].fen).toMatch(/PPPPPPP1/);
    expect(pawn[3].fenSwapped).toMatch(/ppp1pppp/);// the swapped game hands the odds to black
    expect(pawn.every(p => p.fen !== p.fenSwapped)).toBe(true);
    // `--eloPerPawn` reuses a stored calibration, so the pawn arm is not played at all.
    expect(valueSpecs({ id: 'v', games: 10, ai: { depth: 3 }, seed: 1 }, 'N', 'A', false).map(s => s.id)).toEqual(['v.A']);
  });

  it('armStats scores from the first arrangement, folding the colour swap', () => {
    const rec = (gameId: number, result: 1 | 0.5 | 0, colourSwapped: boolean) =>
      ({ gameId, pairId: gameId >> 1, colourSwapped, result, reason: 'checkmate', plies: 30, moves: [], stats: [] }) as unknown as GameRecord;
    // The arm wins both games of the pair: as white (1) and as black (0 for white).
    const a = armStats('A', [rec(0, 1, false), rec(1, 0, true)]);
    expect(a.pairs).toBe(1);
    expect(a.counts).toEqual([0, 0, 0, 0, 1]);     // WW
    expect(a.mu).toBeGreaterThan(0.99);
    expect(a.elo).toBeGreaterThan(0);
  });
});

describe('material regression', () => {
  const start = (o: Record<string, number>) => ({ moves: {}, captures: {}, taken: {}, survived: {}, start: o });
  const rec = (gameId: number, w: Record<string, number>, b: Record<string, number>, result: 1 | 0.5 | 0): GameRecord =>
    ({ gameId, pairId: gameId, colourSwapped: false, result, reason: 'checkmate', plies: 40, moves: [],
      stats: [start(w), start(b)] }) as unknown as GameRecord;

  it('recovers a planted piece value from results alone', () => {
    // Truth: w_P = 0.2, w_N = 0, w_A = -0.24, no white-to-move term. So the archer is worth
    // (w_A - w_N) / w_P = -1.2 pawns against a knight, i.e. 3.20 - 1.20 = 2.00 pawns.
    const recs: GameRecord[] = [];
    const row = (w: Record<string, number>, b: Record<string, number>, u: number, n = 4000): void => {
      const wins = Math.round((n * (1 + Math.tanh(u))) / 2);
      for (let i = 0; i < n; i++) recs.push(rec(recs.length, w, b, i < wins ? 1 : 0));
    };
    row({ A: 1 }, { N: 1 }, -0.24);
    row({ N: 1 }, { A: 1 }, +0.24);
    row({ P: 7 }, { P: 8 }, -0.2);
    row({ P: 8 }, { P: 7 }, +0.2);
    expect(materialDelta(recs[0])).toEqual([0, -1, 0, 0, 0, 1, 0, 0, 0, 0]); // P N B R Q A L G M S

    const fit = fitValues(recs, r => `${r.pairId}`, 3.2, 20);
    expect(fit.games).toBe(16000);
    expect(fit.designRows).toBe(4);
    expect(fit.implied.A.pawns).toBeCloseTo(2.0, 1);
    expect(fit.implied.A.identified).toBe(true);
    expect(fit.implied.A.lo).toBeLessThan(2.0);
    expect(fit.implied.A.hi).toBeGreaterThan(2.0);
    expect(fit.bias).toBeCloseTo(0, 2);
    // No game started with a guard imbalance, so the guard is not identified by this corpus.
    expect(fit.implied.G.identified).toBe(false);
  });
});
