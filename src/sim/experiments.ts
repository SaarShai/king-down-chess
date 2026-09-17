/**
 * Stage-2 experiments (docs/SIM-PLAN.md §6-8): piece values, arrangement sweep, rule A/B.
 *
 * Each one builds plain `RunSpec`s, plays them with `run()`, then writes
 * `sim/out/<id>.experiment.md`. Every sub-run keeps its own JSONL, so a run resumes and a report
 * can be rebuilt without playing again.
 */
import { writeFileSync } from 'node:fs';
import { INTEREST_TERMS, MatchStats, PieceRow, Sprt, matchStats, pentanomial, readRecords, residualiseInterest, sprt, writeReport } from './analyze';
import { GameRecord } from './game';
import { run } from './run';
import { OUT_DIR, RunSpec, paths, sampleBackRank } from './spec';
import { mulberry32 } from './rng';
import { CLASSIC_CHESS } from '../rules/setup';
import { LETTERS, NAMES, PieceType } from '../rules/engine';
import { Rules, ruleDiff } from '../rules/rules';
import { BEAST_V, CATAPULT_V, GUARD_V, KNIGHT_V, MAESTER_V, OGRE_V, PALADIN_V, ARCHER_V } from '../ai/eval';

/** The shipped fairy set. `--pieces O` / `--pieces C` reaches the two lab pieces below. */
const FAIRY = 'ALGMS';
/** Engine seed values today (`src/ai/eval.ts`) and the research priors, both in pawns. */
const SEEDED: Record<string, number> = { A: ARCHER_V, L: PALADIN_V, G: GUARD_V, M: MAESTER_V, S: BEAST_V, O: OGRE_V, C: CATAPULT_V };
// O and C: `docs/PIECES-PROPOSED.md` guesses "about 3 pawns" and "3.5-4.5 while the board is full".
const PRIOR: Record<string, number> = { A: 3.5, L: 4.0, G: 2.0, M: 3.5, S: 2.2, O: 3.0, C: 4.0 };
const NAME: Record<string, string> = { A: 'archer', L: 'paladin', G: 'guard', M: 'maester', S: 'beast', O: 'ogre', C: 'catapult' };

const f2 = (x: number): string => x.toFixed(2);
const signed = (x: number, d = 0): string => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
const pct = (x: number): string => `${(100 * x).toFixed(1)}%`;
const table = (head: string[], rows: (string | number)[][]): string =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');

/**
 * Statistics from the *first* arrangement's point of view. In a colour-swapped pair the second
 * game has the arms the other way round, so white's raw score says nothing; `pentanomial` already
 * folds a pair to arm A's score, and the unpaired fallback flips the swapped games by hand.
 */
export interface Arm extends MatchStats { key: string; games: number; pairs: number; counts: number[]; sprt: Sprt; draws: number; capped: number; plies: number }

export function armStats(key: string, recs: readonly GameRecord[]): Arm {
  const pen = pentanomial(recs);
  let counts: number[];
  if (pen) counts = pen.counts;
  else {
    counts = [0, 0, 0];
    for (const r of recs) counts[Math.round((r.colourSwapped ? 1 - r.result : r.result) * 2)]++;
  }
  return {
    key, games: recs.length, pairs: pen?.pairs ?? 0, counts,
    ...matchStats(counts, recs.length), sprt: sprt(counts, recs.length),
    draws: recs.filter(r => r.result === 0.5 && r.reason !== 'plyCap').length / (recs.length || 1),
    capped: recs.filter(r => r.reason === 'plyCap').length / (recs.length || 1),
    plies: recs.reduce((a, r) => a + r.plies, 0) / (recs.length || 1),
  };
}

const armRow = (a: Arm): (string | number)[] => [
  a.key, a.games, a.pairs, `[${a.counts.join(', ')}]`, a.mu.toFixed(3),
  `${signed(a.elo)} ± ${a.err95.toFixed(0)}`, signed(a.nElo), pct(a.los), a.sprt.llr.toFixed(2), a.sprt.verdict,
  pct(a.draws), pct(a.capped), a.plies.toFixed(0),
];
const ARM_HEAD = ['arm', 'games', 'pairs', 'pentanomial', 'score', 'Elo ±95%', 'nElo', 'LOS', 'LLR', 'SPRT', 'draws', 'capped', 'plies'];

// -----------------------------------------------------------------------------------------------
// 1. Piece values (Muller's asymmetric-material method, docs/SIM-PLAN.md §7).

/** `RNBQKBNR` with the first `vs` piece replaced by the fairy letter. */
export const swapRank = (fairy: string, vs = 'N'): string => CLASSIC_CHESS.replace(vs, fairy);

/**
 * Pawn odds on file `f` (0 = a). One config per file, because a single file is not "a pawn": the
 * h-pawn measured only -17 Elo at depth 3 in the first run, since taking it off opens the rook's
 * file and pays most of the material back. The calibration cycles over all eight files and the
 * arm pools them, which is the average pawn we actually want.
 */
function pawnOdds(f: number): { white: string; black: string; fen: string; fenSwapped: string } {
  const gapped = `${'P'.repeat(f)}1${'P'.repeat(7 - f)}`;
  return {
    white: CLASSIC_CHESS, black: CLASSIC_CHESS,
    fen: `${CLASSIC_CHESS.toLowerCase()}/pppppppp/8/8/8/8/${gapped}/${CLASSIC_CHESS} w - - 0 1`,
    fenSwapped: `${CLASSIC_CHESS.toLowerCase()}/${gapped.toLowerCase()}/8/8/8/8/PPPPPPPP/${CLASSIC_CHESS} w - - 0 1`,
  };
}

/**
 * One arm per fairy piece (it replaces a knight on one side only) plus a pawn-odds calibration
 * arm. The calibration turns Elo into pawns, which is the only way to state an implied value
 * without a guessed conversion constant.
 */
export function valueSpecs(base: RunSpec, vs = 'N', pieces = FAIRY, calibrate = true): RunSpec[] {
  const arms = [...pieces].map(letter => ({
    id: `${base.id}.${letter}`,
    asymmetric: [{ white: swapRank(letter, vs), black: CLASSIC_CHESS }],
  }));
  return [
    ...arms,
    ...(calibrate ? [{ id: `${base.id}.pawn`, asymmetric: Array.from({ length: 8 }, (_, f) => pawnOdds(f)) }] : []),
  ].map(a => ({
    ...base, ...a, pairs: true,
    // The calibration is the denominator of every implied value, so it gets three times the games.
    games: a.id.endsWith('.pawn') ? base.games * 3 : base.games,
  }));
}

/**
 * `pawnElo` reuses a calibration measured earlier (`--eloPerPawn 64`) instead of playing one. The
 * pawn arm is three times the size of a fairy arm, and the number is stable across passes
 * (56 ± 25, then 64 ± 16, then 65 ± 16 at depth 3), so a follow-up run that only needs the
 * conversion should not spend two thirds of its budget re-measuring it.
 */
export async function runValues(base: RunSpec, workers: number, vs = 'N', pieces = FAIRY, pawnElo?: number): Promise<string> {
  const specs = valueSpecs(base, vs, pieces, pawnElo === undefined);
  const arms: Arm[] = [];
  for (const spec of specs) {
    await run(spec, workers);
    arms.push(armStats(spec.id.split('.').pop()!, readRecords(paths(spec.id).jsonl)));
  }
  const cal = pawnElo === undefined ? arms[arms.length - 1] : null;
  const fairy = cal ? arms.slice(0, -1) : arms;
  // White gives pawn odds, so its Elo is negative; the magnitude is what one pawn is worth. With
  // too few games that number is noise, and dividing by it turns every implied value into noise.
  const eloPerPawn = cal ? -cal.elo : pawnElo!;
  const usable = eloPerPawn > (cal?.err95 ?? 0) && eloPerPawn > 20;
  // `--values` re-prices the search without touching the shipped constants, so the seed column has
  // to report what this pass actually played with, not what `src/ai/eval.ts` says.
  const seeded: Record<string, number> = { ...SEEDED, ...base.values };
  const knight = (base.values?.N ?? KNIGHT_V) / 100;

  // Muller keeps the imbalance inside about 1.5 pawns, because the score stops being linear in
  // material outside it. A swap beyond that band is a direction, not a value.
  const BAND = 1.5;
  let outside = 0;
  const rows = fairy.map(a => {
    const delta = a.elo / eloPerPawn;
    const err = a.err95 / eloPerPawn;
    const implied = knight + delta;
    const linear = Math.abs(delta) <= BAND;
    if (!linear) outside++;
    return [
      `${a.key} (${NAME[a.key]})`, `${signed(a.elo)} ± ${a.err95.toFixed(0)}`,
      usable ? `${signed(delta, 2)} ± ${err.toFixed(2)}${linear ? '' : ' **'}` : 'n/a',
      // The bound points the way the arm went: a buffed piece can leave the band on the high side.
      usable ? (linear ? `${f2(implied)} ± ${err.toFixed(2)}` : `${delta > 0 ? '>' : '<'} ${f2(knight + (delta > 0 ? BAND : -BAND))} **`) : 'n/a',
      f2(seeded[a.key] / 100), f2(PRIOR[a.key]),
      usable ? Math.max(50, Math.round(implied * 100)) : 'n/a',
    ];
  });

  const md = `# Piece values — ${base.id}

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **${NAMES[LETTERS.indexOf(vs) as PieceType]}** of the
classic arrangement \`${CLASSIC_CHESS}\` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth ${base.ai.depth ?? '-'}, ${base.games} games per arm, ${base.openingRandomPlies ?? 0} random opening plies.
Rules: ${Object.keys(ruleDiff(base.rules ?? {})).length ? `\`${JSON.stringify(ruleDiff(base.rules ?? {}))}\`` : 'defaults'}.
Engine values: ${Object.keys(base.values ?? {}).length ? `\`${Object.entries(base.values!).map(([k, v]) => `${k}=${v}`).join(' ')}\` (the rest keep \`src/ai/eval.ts\`)` : 'the shipped constants'}.

## Arms (scores are the fairy army's, folded over the colour swap)
${table(ARM_HEAD, arms.map(armRow))}

**One pawn = ${eloPerPawn.toFixed(0)}${cal ? ` ± ${cal.err95.toFixed(0)}` : ''} Elo** at this depth
(${cal ? 'the `pawn` arm' : 'carried over with `--eloPerPawn`; no calibration arm was played here'}). Every
implied value below carries that calibration error on top of its own.
${usable ? '' : `
> **The calibration arm did not resolve** (the pawn is worth less than its own error bar).
> Implied values are printed as \`n/a\`: play more games, or raise the depth, before reading them.
`}

## Implied values
${table(['piece', 'Elo vs knight', 'Δ pawns', 'implied value (pawns)', 'engine seed', 'research prior', 'next seed (cp)'], rows)}

Implied value = knight (${f2(knight)}) + Elo / ${eloPerPawn.toFixed(0)}.
${outside ? `
\*\* ${outside} swap(s) fall outside the linear band of ±${BAND} pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.
` : ''}

## Muller fixed-point update
Write the "next seed" column into \`src/ai/eval.ts\`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

${usable ? `\`\`\`ts
${rows.map((r, i) => `export const ${NAME[fairy[i].key].toUpperCase()}_V = ${r[6]};`).join('\n')}
\`\`\`` : 'No update this pass: the calibration arm did not resolve.'}
`;
  const out = `${OUT_DIR}/${base.id}.experiment.md`;
  writeFileSync(out, md);
  console.log(md);
  return out;
}

// -----------------------------------------------------------------------------------------------
// 2. Arrangement sweep with successive halving (eta = 2).

export interface SweepRound { round: number; arrangements: number; gamesEach: number; kept: string[] }

export async function runSweep(base: RunSpec, workers: number, nArrangements: number, rounds: number): Promise<string> {
  const rng = mulberry32(base.seed);
  let ranks = Array.from({ length: nArrangements }, () => sampleBackRank(rng));
  const perRound: { round: number; gamesEach: number; rows: (string | number)[][] }[] = [];

  for (let r = 1; r <= rounds && ranks.length > 0; r++) {
    // Successive halving: each round gets the same total budget, so games per arrangement double.
    const gamesEach = (base.games ?? 20) * 2 ** (r - 1);
    const spec: RunSpec = {
      ...base, id: `${base.id}.r${r}`, games: ranks.length * gamesEach,
      backRanks: ranks, commonSeeds: true, seed: base.seed + r,
    };
    await run(spec, workers);
    const report = writeReport(spec.id);
    const scored = report.byConfig.map(g => ({
      g, imbalance: Math.abs(g.score - 0.5),
    })).sort((a, b) => a.imbalance - b.imbalance || b.g.interest - a.g.interest);

    perRound.push({
      round: r, gamesEach,
      rows: scored.map(({ g, imbalance }) => [
        g.key, g.games, g.score.toFixed(3), imbalance.toFixed(3), pct(g.decisiveness), pct(g.drawRate),
        g.excessDecisiveness.toFixed(3), g.interest.toFixed(3), g.interestMinFairy.toFixed(3), g.meanFairyUse.toFixed(2), g.minUse.toFixed(2), g.gatesFailed.join(',') || '-',
      ]),
    });
    if (r < rounds) ranks = scored.slice(0, Math.max(1, Math.ceil(scored.length / 2))).map(x => x.g.key);
  }

  const head = ['back rank', 'games', 'score', 'imbalance', 'decisive', 'draws', 'xDec', 'interest', 'interest(min)', 'fairyUse', 'minUse', 'gates'];
  const md = `# Arrangement sweep — ${base.id}

Successive halving, eta = 2, ${rounds} rounds, common random numbers inside every round
(docs/SIM-PLAN.md §8). Depth ${base.ai.depth ?? '-'}. Round 1 starts with ${nArrangements} random back ranks and
${base.games} games each; every round doubles the games and keeps the better half.

The ranking key is **imbalance = |white score − 0.5|**, ties broken by the interest score. Balance and interest
stay two axes; the table prints both, and the gate column prints the rejects.

${perRound.map(p => `## Round ${p.round} — ${p.rows.length} arrangements x ${p.gamesEach} games
${table(head, p.rows.slice(0, 40))}${p.rows.length > 40 ? `\n\n(${p.rows.length - 40} more rows in \`${OUT_DIR}/${base.id}.r${p.round}.report.md\`)` : ''}`).join('\n\n')}

## Survivors
\`${(perRound.at(-1)?.rows ?? []).slice(0, 10).map(row => row[0]).join(' ')}\`

Round 1 numbers are noisy on purpose: at ${base.games} games one arrangement's score carries about
±${(1.96 * 0.5 / Math.sqrt(base.games)).toFixed(2)}. Halving spends the budget on the survivors, so trust the last round only,
and confirm it at a second depth before acting.
`;
  const out = `${OUT_DIR}/${base.id}.experiment.md`;
  writeFileSync(out, md);
  console.log(md);
  return out;
}

// -----------------------------------------------------------------------------------------------
// 3. Rule A/B.

/** Moves and captures per game, and survival, side by side for the two populations. */
function pieceTable(a: readonly PieceRow[], b: readonly PieceRow[], na: number, nb: number): string {
  const byPiece = new Map(b.map(p => [p.piece, p]));
  const rows = [...a].sort((x, y) => y.moves - x.moves).map(p => {
    const q = byPiece.get(p.piece);
    return [p.piece,
      (p.moves / (na || 1)).toFixed(2), ((q?.moves ?? 0) / (nb || 1)).toFixed(2),
      (p.captures / (na || 1)).toFixed(2), ((q?.captures ?? 0) / (nb || 1)).toFixed(2),
      pct(p.survival), pct(q?.survival ?? 0)];
  });
  return table(['piece', 'moves A', 'moves B', 'captures A', 'captures B', 'survival A', 'survival B'], rows);
}

/**
 * Both sides play under the same rules, so there is no head-to-head match and no SPRT. Instead run
 * two populations over the same arrangements and the same opening seeds, then compare them pair by
 * pair. The paired difference is what the common random numbers buy.
 *
 * `replay: false` (CLI `--noReplay`) rebuilds the reports and this page from the JSONL that is
 * already on disk and never calls `run()`, so it cannot play a game, resume a run or rewrite a
 * summary. That is the way to re-read a finished experiment after an analyser fix.
 */
export async function runAb(base: RunSpec, workers: number, rules: Partial<Rules>, replay = true): Promise<string> {
  // Without an explicit `--sample` the runner would draw one arrangement per game, which leaves
  // every arrangement with a single opening. 20 games each keeps the paired comparison meaningful.
  const backRanks = base.backRanks ?? { sample: Math.max(1, Math.round(base.games / 20)) };
  const shared = { ...base, backRanks, commonSeeds: true };
  // The control is today's game — today's rules *and* today's piece values, whatever `--values` the
  // variant carries — unless `--baseRule` / `--baseValues` move it. Without that split a buffed
  // values flag would silently re-price the control as well.
  const baseRules = base.baseRules ?? {}, baseValues = base.baseValues ?? {};
  const a: RunSpec = { ...shared, id: base.baseId ?? `${base.id}.base`, rules: baseRules, values: baseValues };
  const b: RunSpec = { ...shared, id: `${base.id}.var`, rules: { ...baseRules, ...rules }, values: { ...baseValues, ...(base.values ?? {}) } };
  if (replay) { await run(a, workers); await run(b, workers); }
  const [ra, rb] = [writeReport(a.id), writeReport(b.id)];
  // One draw-rate line fitted over both pools, so the two arms' residuals live on the same scale.
  const pool = [...ra.byConfig, ...rb.byConfig];
  residualiseInterest(pool, [...pool, ra.overall, rb.overall]);

  const metrics: [string, (g: typeof ra.overall) => number, number][] = [
    ['white score', g => g.score, 3], ['decisive', g => g.decisiveness, 3], ['draw rate', g => g.drawRate, 3],
    ['capped', g => g.timeouts, 3], ['mean plies', g => g.meanPlies, 1], ['branching factor', g => g.branchingFactor, 1],
    ['killer move', g => g.lead.killerMove, 3], ['lead change', g => g.lead.leadChange, 3],
    ['uncertainty late', g => g.lead.uncertaintyLate, 3], ['drama', g => g.lead.drama, 3],
    ['permanence', g => g.lead.permanence, 3], ['min utilisation', g => g.minUse, 2],
    ['interest', g => g.interest, 3], ['interest (min-use)', g => g.interestMinFairy, 3],
    // Residualised on draw rate: the interest axis tracks draws, so an unadjusted gain can be
    // nothing but "fewer draws". The line is fitted over both arms' arrangements at once.
    ...Object.keys(INTEREST_TERMS).map(k =>
      [`${k} (resid.)`, (g: typeof ra.overall) => g.interestResiduals[k] ?? 0, 3] as [string, (g: typeof ra.overall) => number, number]),
  ];

  // Paired over arrangements: the same back ranks and the same opening seeds in both populations.
  // `bishopsOppositeColours` is the exception — it decides which back ranks *exist*, so the two arms
  // draw different ones and there is nothing to pair. Then fall back to two independent samples.
  const byKey = new Map(rb.byConfig.map(g => [g.key, g]));
  const pairs = ra.byConfig.filter(g => byKey.has(g.key));
  const moments = (xs: number[]): [number, number, number] => {
    const mu = xs.reduce((x, y) => x + y, 0) / (xs.length || 1);
    const v = xs.reduce((x, y) => x + (y - mu) ** 2, 0) / Math.max(1, xs.length - 1);
    return [mu, v, xs.length];
  };
  const paired = metrics.map(([name, f, d]) => {
    let mu: number, half: number;
    if (pairs.length >= 2) {
      const [m, v, n] = moments(pairs.map(g => f(byKey.get(g.key)!) - f(g)));
      mu = m; half = 1.959964 * Math.sqrt(v / n);
    } else {
      const [ma, va, na] = moments(ra.byConfig.map(f)), [mb, vb, nb] = moments(rb.byConfig.map(f));
      mu = mb - ma; half = 1.959964 * Math.sqrt(va / na + vb / nb);
    }
    return [name, f(ra.overall).toFixed(d), f(rb.overall).toFixed(d), `${signed(mu, d)} ± ${half.toFixed(d)}`,
      Math.abs(mu) > half ? 'yes' : 'no'];
  });

  const flags = (r: Partial<Rules>): string => Object.entries(ruleDiff(r)).map(([k, v]) => `${k}=${v}`).join(' ');
  const baseLabel = flags(baseRules) ? `the base \`${flags(baseRules)}\`` : "today's defaults";
  const md = `# Rule A/B — ${base.id}

\`${flags(rules)}\` against ${baseLabel}${Object.keys(baseValues).length ? `, both arms at \`--values ${Object.entries(baseValues).map(([k, v]) => `${k}=${v}`).join(',')}\`` : ''}.
${base.games} games per population, depth ${base.ai.depth ?? '-'}, the same ${pairs.length} arrangements and the same
opening seeds in both (common random numbers). Control arm: \`${a.id}\`.

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
${pairs.length >= 2 ? 'paired' : '**two-sample, not paired**'} two-population comparison. The interval is a 95% normal approximation on the
${pairs.length >= 2 ? 'mean paired difference over arrangements' : 'difference of the two arms\' means over their own arrangements (they share none)'}; with few arrangements,
and with one interval per metric, read "significant" as "worth a second run", not as a test.

${table(['metric', 'base (pooled)', 'with the rule (pooled)', 'mean paired difference ±95%', 'significant'], paired)}

## Degeneracy counters
${table(['counter', 'base', 'with the rule'], [
    ['guard captures per game', ra.degeneracy.guardCapturesPerGame.toFixed(3), rb.degeneracy.guardCapturesPerGame.toFixed(3)],
    ['games with a guard rampage (≥ 3 captures)', `${ra.degeneracy.guardRampages} (${pct(ra.degeneracy.guardRampageShare)})`, `${rb.degeneracy.guardRampages} (${pct(rb.degeneracy.guardRampageShare)})`],
    ['dead-material endings (draw50 + drawMaterial)', `${ra.degeneracy.deadMaterial} (${pct(ra.degeneracy.deadMaterialShare)})`, `${rb.degeneracy.deadMaterial} (${pct(rb.degeneracy.deadMaterialShare)})`],
    ['games where a king never moved', `${ra.degeneracy.kingNeverMoved} (${pct(ra.degeneracy.kingNeverMovedShare)})`, `${rb.degeneracy.kingNeverMoved} (${pct(rb.degeneracy.kingNeverMovedShare)})`],
  ])}

## Per piece (both sides, whole population; moves and captures per game)
${pieceTable(ra.pieces, rb.pieces, ra.games, rb.games)}

## Fairy events per game
${table(['event', 'base', 'with the rule'], Object.keys(ra.events).map(k =>
    [k, (ra.events[k] / (ra.games || 1)).toFixed(2), (rb.events[k] / (rb.games || 1)).toFixed(2)]))}

The pooled columns describe each whole population; the difference column is the mean over the
${pairs.length} shared arrangements of (rule − base) on the same openings.${pairs.length >= 2 ? '' : ' There are none here, so it is a two-sample difference instead.'} The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
`;
  const out = `${OUT_DIR}/${base.id}.experiment.md`;
  writeFileSync(out, md);
  console.log(md);
  return out;
}

// -----------------------------------------------------------------------------------------------

export async function runExperiment(kind: string, spec: RunSpec, workers: number, flags: Record<string, string | true>): Promise<void> {
  const num = (k: string, d: number): number => (typeof flags[k] === 'string' ? Number(flags[k]) : d);
  if (kind === 'values') {
    await runValues(spec, workers, typeof flags.vs === 'string' ? flags.vs : 'N',
      typeof flags.pieces === 'string' ? flags.pieces : FAIRY,
      typeof flags.eloPerPawn === 'string' ? Number(flags.eloPerPawn) : undefined);
  }
  else if (kind === 'sweep') await runSweep(spec, workers, num('arrangements', 100), num('rounds', 2));
  else if (kind === 'ab') await runAb(spec, workers, { ...spec.rules }, !flags.noReplay);
  else throw new Error(`unknown experiment "${kind}" (values | sweep | ab)`);
}
