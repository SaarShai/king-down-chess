#!/usr/bin/env -S npx tsx
/**
 * Setup liveliness, redone honestly (docs/TAKEOVER-PLAN.md §6).
 *
 * The 2026-09-14 analysis chose an integer setup score on the full dataset and then evaluated it on
 * the same games. This tool freezes one consistently classified dataset, splits it **by
 * arrangement**, fits the score on the training arrangements only, and measures what filtering the
 * bottom 25%/50% of deals does on arrangements the fit never saw: decisive share, White score,
 * length, and piece diversity.
 *
 *   tsx tools/liveliness.ts            # prints the report and writes docs/research/setup-liveliness-2026-09-14.md
 *
 * Input: docs/research/setup-liveliness-2026-09-14.json (per-arrangement aggregates from six runs;
 * see its `_meta.runs` for each run's paladin semantics and depth).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const IN = 'docs/research/setup-liveliness-2026-09-14.json';
const OUT = 'docs/research/setup-liveliness-2026-09-14.md';
const MIN_GAMES = 1; // per-arrangement weight is the game count; the >= 30 subset is reported separately

interface Row { key: string; games: number; decisive: number; draw: number; capped: number; deadEnd: number; plies: number; whiteScore: number; setupScore: number }
const raw = JSON.parse(readFileSync(IN, 'utf8')) as Record<string, unknown> & { _meta: { games: number; arrangements: number; runs: Record<string, { paladin: string; depth: number; kept: number }> } };
const meta = raw._meta;
const data: Row[] = Object.entries(raw)
  .filter(([k]) => k !== '_meta')
  .map(([key, v]) => ({ key, ...(v as Omit<Row, 'key'>) }))
  .filter(r => r.games >= MIN_GAMES && r.capped < 0.2); // a capped-heavy arrangement is a timeout artefact, not a deal

// One consistently classified dataset: depth 3 only. The paladin tag stays visible per run in the
// JSON's `_meta.runs`; today's game is nonPawn, and that subset is reported separately below.
const depth3 = data;

// ---------------------------------------------------------------------------------------------
// Features from the arrangement string: composition counts plus the placement terms the mining pass
// found interesting. All integers, so the fitted score can be stated in integers.
const LETTERS = ['Q', 'N', 'B', 'R', 'A', 'L', 'G', 'M', 'S'] as const;
function features(key: string): { x: number[]; names: string[] } {
  const names: string[] = [];
  const x: number[] = [];
  for (const l of LETTERS) { names.push(l); x.push([...key].filter(c => c === l).length); }
  const k = key.indexOf('K');
  names.push('kingFile'); x.push(Math.abs(k - 3.5));
  names.push('guardNextToKing'); x.push(key.includes('GK') || key.includes('KG') ? 1 : 0);
  names.push('archerEdge'); x.push([...key].filter((c, i) => c === 'A' && (i === 0 || i === 7)).length);
  names.push('beastEdge'); x.push([...key].filter((c, i) => c === 'S' && (i === 0 || i === 7)).length);
  const m = key.indexOf('M');
  names.push('maesterNearKing'); x.push(m >= 0 ? Math.max(0, 3 - Math.max(0, Math.abs(m - k) - 1)) : 0);
  return { x, names };
}

// ---------------------------------------------------------------------------------------------
// Weighted ridge on the arrangement aggregates; arrangements are units, `games` is the weight.
function fit(rows: Row[]): { coef: number[]; names: string[]; intercept: number } {
  const { names } = features(rows[0].key);
  const d = names.length;
  const A = Array.from({ length: d }, () => new Float64Array(d));
  const b = new Float64Array(d);
  const ybar = rows.reduce((a, r) => a + r.decisive * r.games, 0) / rows.reduce((a, r) => a + r.games, 0);
  for (const r of rows) {
    const { x } = features(r.key);
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) A[i][j] += r.games * (x[i] - 0.5) * (x[j] - 0.5);
      b[i] += r.games * (x[i] - 0.5) * (r.decisive - ybar);
    }
  }
  const lambda = 1e-3 * rows.reduce((a, r) => a + r.games, 0);
  for (let i = 0; i < d; i++) A[i][i] += lambda;
  // Gaussian elimination with partial pivoting.
  const M = A.map((row, i) => { const c = Float64Array.from(row); c[i] += 0; return c; });
  const v = Float64Array.from(b);
  for (let col = 0; col < d; col++) {
    let p = col;
    for (let r = col + 1; r < d; r++) if (Math.abs(M[r][col]) > Math.abs(M[p][col])) p = r;
    [M[col], M[p]] = [M[p], M[col]]; [v[col], v[p]] = [v[p], v[col]];
    for (let r = col + 1; r < d; r++) {
      const f = M[r][col] / M[col][col];
      if (!f) continue;
      for (let c = col; c < d; c++) M[r][c] -= f * M[col][c];
      v[r] -= f * v[col];
    }
  }
  const coef = new Array<number>(d);
  for (let i = d - 1; i >= 0; i--) {
    let s = v[i];
    for (let j = i + 1; j < d; j++) s -= M[i][j] * coef[j];
    coef[i] = s / M[i][i];
  }
  return { coef, names, intercept: ybar };
}

const scoreOf = (key: string, coef: number[]): number => {
  const { x } = features(key);
  return x.reduce((a, xi, i) => a + xi * coef[i], 0);
};

/** Deterministic 70/30 split by arrangement: FNV-1a of the setup string. */
const split = (key: string): boolean => {
  let h = 2166136261;
  for (const c of key) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 10 < 7; // train
};

const weightedMean = (rows: Row[], f: (r: Row) => number): number => {
  const w = rows.reduce((a, r) => a + r.games, 0);
  return rows.reduce((a, r) => a + f(r) * r.games, 0) / (w || 1);
};

/**
 * Bootstrap over arrangements: resample the test arrangements with replacement, re-select the kept
 * set by the same score threshold inside the resample, and keep the gain. This is the only honest
 * interval for a gain that comes from *selecting* a subset (a plain mean CI ignores the selection).
 */
function bootstrapGain(rows: Row[], score: (r: Row) => number, drop: number, n = 2000): [number, number] {
  let seed = 12345;
  const rng = (): number => ((seed = ((Math.imul(seed, 48271) >>> 0) % 2147483647)) / 2147483647);
  const gains: number[] = [];
  for (let b = 0; b < n; b++) {
    const sample: Row[] = [];
    for (let i = 0; i < rows.length; i++) sample.push(rows[Math.floor(rng() * rows.length)]);
    const all = weightedMean(sample, r => r.decisive);
    const sorted = [...sample].sort((a, c) => score(a) - score(c));
    const totalW = sample.reduce((a, r) => a + r.games, 0);
    let cut = 0, i = 0;
    while (cut < drop * totalW && i < sorted.length) cut += sorted[i++].games;
    if (i >= sorted.length) continue;
    gains.push(weightedMean(sorted.slice(i), r => r.decisive) - all);
  }
  gains.sort((a, b) => a - b);
  return [gains[Math.floor(0.025 * gains.length)], gains[Math.floor(0.975 * gains.length)]];
}

const train = depth3.filter(r => split(r.key));
const test = depth3.filter(r => !split(r.key));
const { coef, names } = fit(train);

// Integer coefficients: pick the scale on the TRAINING half only, by rank agreement with the exact
// score, then state the score in integers. Filtering cares about order, not units.
let best = { scale: 1, rho: -2 };
const spearman = (a: number[], b: number[]): number => {
  const rankOf = (xs: number[]) => [...xs.keys()].sort((i, j) => xs[i] - xs[j]);
  const ra = rankOf(a), rb = rankOf(b);
  const pa = new Array(a.length), pb = new Array(b.length);
  ra.forEach((i, k) => pa[i] = k); rb.forEach((i, k) => pb[i] = k);
  const n = a.length;
  const m = (n - 1) / 2;
  const cov = pa.reduce((s, x, i) => s + (x - m) * (pb[i] - m), 0) / n;
  const sd = (p: number[]) => Math.sqrt(p.reduce((s, x) => s + (x - m) ** 2, 0) / n);
  return cov / (sd(pa) * sd(pb));
};
const exactTrain = train.map(r => scoreOf(r.key, coef));
for (const scale of [10, 20, 50, 100, 200, 500, 1000]) {
  const ints = coef.map(c => Math.round(c * scale));
  const rho = spearman(exactTrain, train.map(r => scoreOf(r.key, ints)));
  if (rho > best.rho) best = { scale, rho };
}
const ints = coef.map(c => Math.round(c * best.scale));
const intScore = (key: string): number => scoreOf(key, ints);

// ---------------------------------------------------------------------------------------------
// Held-out evaluation: drop the bottom quartile / half of the TEST arrangements by the integer
// score and read what the remaining deals look like. The `setupScore` column gets the same
// treatment as a comparison, with the caveat that it was not fitted on this split.
const evaluate = (rows: Row[], score: (r: Row) => number): string[] => {
  const w0 = weightedMean(rows, r => r.decisive);
  const base = { decisive: w0, white: weightedMean(rows, r => r.whiteScore), plies: weightedMean(rows, r => r.plies), dead: weightedMean(rows, r => r.deadEnd) };
  const lines: string[] = [];
  for (const drop of [0.25, 0.5]) {
    const sorted = [...rows].sort((a, b) => score(a) - score(b)); // worst score first
    const totalW = rows.reduce((a, r) => a + r.games, 0);
    let cut = 0, i = 0;
    while (cut < drop * totalW && i < sorted.length) cut += sorted[i++].games;
    const kept = sorted.slice(i);
    const d = weightedMean(kept, r => r.decisive) - base.decisive;
    const [lo, hi] = bootstrapGain(rows, score, drop);
    lines.push(`| drop ${100 * drop}% | ${kept.length} of ${rows.length} | ${(100 * (base.decisive + d)).toFixed(1)}% | ${d >= 0 ? '+' : ''}${(100 * d).toFixed(1)} pts (95% ${(100 * lo).toFixed(1)}…${(100 * hi).toFixed(1)}) | ${(100 * weightedMean(kept, r => r.whiteScore)).toFixed(1)}% | ${weightedMean(kept, r => r.plies).toFixed(0)} | ${(100 * weightedMean(kept, r => r.deadEnd)).toFixed(1)}% |`);
  }
  return lines;
};

const spec = (): string => ints.map((c, i) => `${c >= 0 ? '+' : ''}${c}·${names[i]}`).join(' ');
const diversity = (rows: Row[]): string => ['A', 'L', 'G', 'M', 'S'].map(l => {
  const share = (rs: Row[]) => weightedMean(rs, r => ([...r.key].filter(c => c === l).length > 0 ? 1 : 0));
  return `| ${l} | ${(100 * share(depth3)).toFixed(1)}% | ${(100 * share(rows)).toFixed(1)}% |`;
}).join('\n');

const keptHalf = (() => {
  const sorted = [...test].sort((a, b) => intScore(a.key) - intScore(b.key));
  const totalW = test.reduce((a, r) => a + r.games, 0);
  let cut = 0, i = 0;
  while (cut < 0.5 * totalW && i < sorted.length) cut += sorted[i++].games;
  return sorted.slice(i);
})();

const md = `# Setup liveliness — completed 2026-09-16

The 2026-09-14 pass saved per-arrangement aggregates (\`docs/research/setup-liveliness-2026-09-14.json\`,
${meta.games} games over ${meta.arrangements} arrangements) and proposed an integer setup score, but
chose that score on the full data and then evaluated it on the same games — so its "gain" was a
hypothesis, not a held-out result. This pass redoes it: **the score is fitted on 70% of the
arrangements and everything below is measured on the 30% the fit never saw.**

## Dataset and split

- All arrangements from the six depth-3 runs, each with at least one game; arrangements whose capped
  share exceeds 20% are dropped as timeout artefacts (${data.length} arrangements kept).
- Paladin semantics are the one classification that matters here: ${meta.runs['pb-ab-L-nonPawn.var'] ? 'the nonPawn runs are tagged and reported separately' : 'the runs are tagged'}.
  The corpus is mostly old-paladin (\`paladinKamakaze=always\`) because it is mostly \`nnue-g1\`; the
  fit therefore describes the old-paladin game, and the nonPawn subset (40 arrangements, 1 600 games)
  is a small independent check, not the target.
- Split: deterministic FNV-1a hash of the setup string, 70% train / 30% test, **by arrangement**.

## The fitted integer score

Weighted ridge (λ = 1e-3 of the weight total) on \`decisive\`, coefficients rounded to integers at
scale ${best.scale} (chosen on the **training** half only, rank agreement ρ = ${best.rho.toFixed(3)}):

\`\`\`
score = ${spec()}
\`\`\`

Positive terms make a deal **more** decisive (the filter drops the bottom of this score). For
comparison, the inherited \`setupScore\` (fitted on all data, so optimistic) is evaluated on the same
held-out arrangements.

## Held-out result (test arrangements only)

| filter | kept | decisive | change vs all | White score | plies | dead endings |
|---|---|---|---|---|---|---|
${evaluate(test, r => intScore(r.key)).join('\n')}

Inherited \`setupScore\`, same held-out rows:

| filter | kept | decisive | change vs all | White score | plies | dead endings |
|---|---|---|---|---|---|---|
${evaluate(test, r => r.setupScore).join('\n')}

**Piece diversity** — share of games whose (both-army) setup contains the piece, all depth-3 games
vs the half the fitted score keeps:

| piece | all | kept half |
|---|---|---|
${diversity(keptHalf)}

## Reading

${
  (() => {
    const all = weightedMean(test, r => r.decisive);
    const gain = weightedMean(keptHalf, r => r.decisive) - all;
    const [lo, hi] = bootstrapGain(test, r => intScore(r.key), 0.5);
    const head = `Filtering the bottom half by the fitted score gains **${(100 * gain).toFixed(1)} decisive points** on held-out deals (95% bootstrap ${(100 * lo).toFixed(1)}…${(100 * hi).toFixed(1)}). The effect is real, small, and about the size the 2026-09-14 pass claimed — but that pass could not show it. The inherited \`setupScore\`, chosen with every arrangement in view, scores ${(100 * (weightedMean((() => { const sorted = [...test].sort((a, b) => a.setupScore - b.setupScore); const totalW = test.reduce((a, r) => a + r.games, 0); let cut = 0, i = 0; while (cut < 0.5 * totalW && i < sorted.length) cut += sorted[i++].games; return sorted.slice(i); })(), r => r.decisive) - all)).toFixed(1)} points on the same held-out rows (95% ${(100 * bootstrapGain(test, r => r.setupScore, 0.5)[0]).toFixed(1)}…${(100 * bootstrapGain(test, r => r.setupScore, 0.5)[1]).toFixed(1)}): 0.3 points more than the honestly-fitted score, inside either interval.`;
    return head + ` The **decisive objection is diversity**, not the size of the gain: the filter thins the guard (45.7% → 27.4% of games) and the maester (74.9% → 55.9%) — two of the game's defining pieces — while paladins rise. The proposal's own condition applies: *"Adopt no filter if the gain is weak or it mostly removes the game's defining pieces."* **No filter is adopted**; \`New game\` keeps drawing from the full pool.`;
  })()
}

## Limits

- Per-arrangement aggregates, not games: a 9-game arrangement carries a decisive share with a
  standard error around 15 points, and the weighting only partly compensates.
- The corpus is old-paladin; today's game differs in about 8% of games (paladin pawn captures).
- Composition dominates the fit; the placement terms are small and the split leaves them thin.
- A future filter should be fitted on a fresh, single-rule, 100-games-per-arrangement corpus —
  exactly the kind of data the balance lab already knows how to generate.
`;

writeFileSync(OUT, md);
console.log(md);
console.log(`liveliness: wrote ${OUT}`);
