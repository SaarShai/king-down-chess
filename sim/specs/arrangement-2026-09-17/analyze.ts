/**
 * Sweep B analysis (2026-09-17): the pre-registered ranking rule and the cross-sweep
 * stability check. Read-only over `sim/out/*.report.json`; writes nothing.
 *
 *   tsx analyze.ts rank <report.json>
 *   tsx analyze.ts compare <A.report.json> <B.report.json>
 *
 * Ranking rule (docs/research/arrangement-benchmark-2026-09-17.md, restated by the task):
 *   drop |score - 0.5| > 0.03 or timeouts > 0.05; rank by interest, ties by minUse, then by
 *   event diversity. Event diversity needs the stored games, so the script says when an
 *   exact interest tie needs it; none occurred in sweep B (or A), so it was never read.
 *
 * `compare` reports the intersection of the two sweeps' arrangements and, when the shared
 * count is under 20 (the pre-registered fallback), the feature splits and the top-set
 * profile. The Spearman value is printed for transparency at n >= 2, but a shared count
 * under 20 is too small to carry the pre-registered stability claim.
 */
import { readFileSync } from 'node:fs';
import { analyze } from '../../../src/sim/analyze';
import type { GameRecord } from '../../../src/sim/game';

interface Lead { killerMove: number; leadChange: number; uncertaintyLate: number; drama: number; permanence: number }
interface Group {
  key: string; games: number; draws: number; score: number;
  drawRate: number; timeouts: number; decisiveness: number;
  minUse: number; meanFairyUse: number;
  interest: number; interestMinFairy: number;
  interestResiduals: Record<string, number>;
  lead: Lead;
}
interface Report { id: string; games: number; byConfig: Group[] }

const FAIR_MAX = 0.03;
const TIMEOUT_MAX = 0.05;

/**
 * The ranked value. `raw` is the report's interest composite, the task's restatement of the
 * rule; `resid` is the benchmark doc's literal criterion 1 (`interestResiduals.interest`, the
 * composite with its draw-rate line removed, fitted per report pool). Both are printed.
 */
let METRIC: 'raw' | 'resid' = 'raw';
const value = (g: Group) => (METRIC === 'resid' ? (g.interestResiduals?.interest ?? g.interest) : g.interest);
const METRIC_LABEL = () => (METRIC === 'resid' ? 'interest (resid.)' : 'interest');

function ranked(report: Report): { kept: Group[]; dropped: Group[] } {
  const dropped = report.byConfig.filter(g => Math.abs(g.score - 0.5) > FAIR_MAX || g.timeouts > TIMEOUT_MAX);
  const kept = report.byConfig
    .filter(g => !dropped.includes(g))
    .slice()
    .sort((a, b) => value(b) - value(a) || b.minUse - a.minUse);
  const tie = kept.filter((g, i) => i > 0 && Math.abs(value(g) - value(kept[i - 1])) < 1e-12);
  if (tie.length) console.error(`NOTE: exact ${METRIC_LABEL()} tie on ${tie.map(g => g.key).join(', ')} — minUse break used; event diversity not read.`);
  return { kept, dropped };
}

const f3 = (x: number) => x.toFixed(3);
const f2 = (x: number) => x.toFixed(2);
const pctOf = (x: number) => `${(100 * x).toFixed(1)}%`;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

function table(head: string[], rows: (string | number)[][]): string {
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
}

/** Average-rank Spearman (ties averaged). NaN when either side has no spread. */
function spearman(xs: number[], ys: number[]): number {
  const ranks = (v: number[]) => {
    const order = v.map((x, i) => [x, i] as [number, number]).sort((a, b) => a[0] - b[0]);
    const r = new Array<number>(v.length);
    for (let i = 0; i < order.length;) {
      let j = i;
      while (j + 1 < order.length && order[j + 1][0] === order[i][0]) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[order[k][1]] = avg;
      i = j + 1;
    }
    return r;
  };
  const rx = ranks(xs), ry = ranks(ys), mx = mean(rx), my = mean(ry);
  const num = rx.reduce((a, x, i) => a + (x - mx) * (ry[i] - my), 0);
  const den = Math.sqrt(rx.reduce((a, x) => a + (x - mx) ** 2, 0) * ry.reduce((a, y) => a + (y - my) ** 2, 0));
  return den < 1e-12 ? NaN : num / den;
}

/** Least-squares residual of y on x, fitted over `xs`. A linear adjustment is enough for this axis. */
function residual(xs: number[], ys: number[]): number[] {
  const mx = mean(xs), my = mean(ys);
  const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const b = sxx < 1e-12 ? 0 : xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / sxx;
  return ys.map((y, i) => y - (my + b * (xs[i] - mx)));
}

const LOGFACT: number[] = [0];
function logFact(n: number): number {
  for (let i = LOGFACT.length; i <= n; i++) LOGFACT[i] = LOGFACT[i - 1] + Math.log(i);
  return LOGFACT[n];
}
const logChoose = (n: number, k: number) => logFact(n) - logFact(k) - logFact(n - k);

/** Two-sided Fisher exact p for the 2x2 table [[a, b], [c, d]]. */
function fisher(a: number, b: number, c: number, d: number): number {
  const n = a + b + c + d, r1 = a + b, c1 = a + c;
  const pOf = (x: number) => Math.exp(logChoose(r1, x) + logChoose(n - r1, c1 - x) - logChoose(n, c1));
  const pObs = pOf(a);
  let p = 0;
  for (let x = Math.max(0, c1 - (n - r1)); x <= Math.min(r1, c1); x++) {
    const px = pOf(x);
    if (px <= pObs * (1 + 1e-9)) p += px;
  }
  return Math.min(1, p);
}

/** Two-sided permutation p for a difference of means, 10,000 shuffles, fixed stream. */
function permTest(xs: number[], ys: number[]): number {
  if (xs.length < 2 || ys.length < 2) return NaN;
  const obs = Math.abs(mean(xs) - mean(ys));
  const all = [...xs, ...ys];
  let s = 987654321, hits = 0;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let it = 0; it < 10_000; it++) {
    for (let j = all.length - 1; j > 0; j--) { const k = Math.floor(rnd() * (j + 1)); [all[j], all[k]] = [all[k], all[j]]; }
    if (Math.abs(mean(all.slice(0, xs.length)) - mean(all.slice(xs.length))) >= obs - 1e-12) hits++;
  }
  return (hits + 1) / 10_001;
}

/** Feature split of one mirrored back rank. */
interface Features {
  queen: boolean;
  guard: boolean;
  guardKingFileDist: number | null;
  archers: 'two-adjacent' | 'two-apart' | 'one-or-none';
  maesterAdjKing: boolean;
  types: number;
}

function features(rank: string): Features {
  const at = (c: string) => [...rank].flatMap((p, i) => (p === c ? [i] : []));
  const k = at('K')[0], g = at('G')[0], m = at('M'), a = at('A');
  return {
    queen: rank.includes('Q'),
    guard: g !== undefined,
    guardKingFileDist: g !== undefined && k !== undefined ? Math.abs(g - k) : null,
    archers: a.length === 2 ? (Math.abs(a[0] - a[1]) === 1 ? 'two-adjacent' : 'two-apart') : 'one-or-none',
    maesterAdjKing: m.some(i => Math.abs(i - k) === 1),
    types: new Set(rank).size,
  };
}

interface Stats {
  n: number; queen: number; guard: number; gkMean: number; gkN: number;
  archAdj: number; archTwo: number; maesterAdj: number; typesMean: number;
}

function stats(rows: Group[]): Stats {
  const fs = rows.map(g => features(g.key));
  const gks = fs.flatMap(f => (f.guardKingFileDist === null ? [] : [f.guardKingFileDist]));
  return {
    n: fs.length,
    queen: fs.filter(f => f.queen).length,
    guard: fs.filter(f => f.guard).length,
    gkMean: gks.length ? mean(gks) : NaN,
    gkN: gks.length,
    archAdj: fs.filter(f => f.archers === 'two-adjacent').length,
    archTwo: fs.filter(f => f.archers !== 'one-or-none').length,
    maesterAdj: fs.filter(f => f.maesterAdjKing).length,
    typesMean: mean(fs.map(f => f.types)),
  };
}

const gksOf = (rows: Group[]) => rows.map(g => features(g.key).guardKingFileDist).flatMap(d => (d === null ? [] : [d]));
const numOf = (rows: Group[], pick: (f: Features) => number) => rows.map(g => pick(features(g.key)));

/** One feature, with its two complementary renderings. */
function splitRow(top: Group[], bot: Group[]): (string | number)[][] {
  const t = stats(top), b = stats(bot);
  const cnt = (x: number, n: number) => `${x}/${n}`;
  return [
    ['queen present', cnt(t.queen, t.n), cnt(b.queen, b.n), fisher(t.queen, t.n - t.queen, b.queen, b.n - b.queen).toFixed(3)],
    ['guard present', cnt(t.guard, t.n), cnt(b.guard, b.n), fisher(t.guard, t.n - t.guard, b.guard, b.n - b.guard).toFixed(3)],
    ['guard–king file distance (mean)', `${t.gkMean.toFixed(2)} (n=${t.gkN})`, `${b.gkMean.toFixed(2)} (n=${b.gkN})`, permTest(gksOf(top), gksOf(bot)).toFixed(3)],
    ['archers: 2 adjacent (of 2-archer ranks)', cnt(t.archAdj, t.archTwo), cnt(b.archAdj, b.archTwo), fisher(t.archAdj, t.archTwo - t.archAdj, b.archAdj, b.archTwo - b.archAdj).toFixed(3)],
    ['maester adjacent to king', cnt(t.maesterAdj, t.n), cnt(b.maesterAdj, b.n), fisher(t.maesterAdj, t.n - t.maesterAdj, b.maesterAdj, b.n - b.maesterAdj).toFixed(3)],
    ['distinct types (mean)', t.typesMean.toFixed(2), b.typesMean.toFixed(2), permTest(numOf(top, f => f.types), numOf(bot, f => f.types)).toFixed(3)],
  ];
}

const HEAD = ['feature', 'top', 'bottom', 'p'];

/** Pearson correlation of a 0/1 feature with interest, over every arrangement in the list. */
function pointBiserial(flag: boolean[], interest: number[]): number {
  const x: number[] = flag.map(f => (f ? 1 : 0));
  const mx = mean(x), my = mean(interest);
  const num = x.reduce((a, v, i) => a + (v - mx) * (interest[i] - my), 0);
  const den = Math.sqrt(x.reduce((a, v) => a + (v - mx) ** 2, 0) * interest.reduce((a, v) => a + (v - my) ** 2, 0));
  return den < 1e-12 ? NaN : num / den;
}

/**
 * Every kept arrangement's feature against its interest. This is the fallback's quantitative
 * form: a feature "separates" top from bottom only if its association has the same sign in both
 * sweeps, and n = one round is small, so the value is read as a sign, not a size.
 */
function featureAssociation(rows: Group[]): (string | number)[][] {
  const interest = rows.map(value);
  const fs = rows.map(g => features(g.key));
  const bin = (f: (x: Features) => boolean) => pointBiserial(fs.map(f), interest);
  const gk = rows.flatMap((g, i) => (fs[i].guardKingFileDist === null ? [] : [[fs[i].guardKingFileDist as number, interest[i]] as const]));
  return [
    ['queen present', bin(f => f.queen), rows.length],
    ['guard present', bin(f => f.guard), rows.length],
    ['guard–king file distance', gk.length >= 2 ? spearman(gk.map(p => p[0]), gk.map(p => p[1])) : NaN, gk.length],
    ['archers: 2 adjacent', bin(f => f.archers === 'two-adjacent'), rows.length],
    ['maester adjacent to king', bin(f => f.maesterAdjKing), rows.length],
    ['distinct types', spearman(rows.map(g => features(g.key).types), interest), rows.length],
  ];
}

/** Every arrangement sorted by interest, with the gate verdict and the placement features. */
function fullCommand(path: string): void {
  const report = JSON.parse(readFileSync(path, 'utf8')) as Report;
  const rows = report.byConfig.slice().sort((a, b) => value(b) - value(a));
  const body = rows.map((g, i) => {
    const f = features(g.key);
    const fail = Math.abs(g.score - 0.5) > FAIR_MAX ? 'balance' : g.timeouts > TIMEOUT_MAX ? 'timeouts' : '-';
    return [
      i + 1, g.key, f3(g.score), f3(value(g)), pctOf(g.decisiveness), pctOf(g.drawRate), f2(g.minUse),
      f.queen ? 'Q' : '-', f.guard ? 'G' : '-', f.guardKingFileDist === null ? '-' : f.guardKingFileDist,
      f.archers, f.maesterAdjKing ? 'yes' : '-', f.types, fail,
    ];
  });
  console.log(`# ${report.id}: all ${rows.length} arrangements by interest (gate: |score-0.5| <= ${FAIR_MAX}, timeouts <= ${TIMEOUT_MAX})\n`);
  console.log(table(['#', 'back rank', 'score', 'interest', 'decisive', 'draws', 'minUse', 'Q', 'G', 'G-K file', 'archers', 'M adj K', 'types', 'gate'], body));
}

function rankCommand(path: string): void {
  const report = JSON.parse(readFileSync(path, 'utf8')) as Report;
  const { kept, dropped } = ranked(report);
  console.log(`# ${report.id}: ${report.byConfig.length} arrangements, ${report.games} games; ${kept.length} kept, ${dropped.length} dropped (metric: ${METRIC_LABEL()})\n`);
  if (dropped.length) console.log(`Dropped: ${dropped.map(g => `${g.key} (|s-0.5|=${f3(Math.abs(g.score - 0.5))}, timeouts=${f3(g.timeouts)})`).join('; ')}\n`);
  const line = (g: Group, i: number) => [
    i + 1, g.key, g.games, f3(g.score), f3(value(g)), pctOf(g.decisiveness), pctOf(g.drawRate),
    f2(g.minUse), f3(Math.abs(g.score - 0.5)), f3(g.timeouts),
  ];
  const head = ['#', 'back rank', 'games', 'score', METRIC_LABEL(), 'decisive', 'draws', 'minUse', '|score-0.5|', 'timeouts'];
  console.log(`## Top ${Math.min(20, kept.length)}\n`);
  console.log(table(head, kept.slice(0, 20).map(line)));
  const start = Math.max(0, kept.length - 20);
  console.log(`\n## Bottom ${Math.min(20, kept.length)} (rows ${start + 1}–${kept.length} of the ranked list)\n`);
  console.log(table(head, kept.slice(start).map((g, i) => line(g, start + i))));
  if (kept.length < 40) {
    console.log(`\nNote: the round keeps ${kept.length} arrangements, so the top 20 and bottom 20 above share ${40 - kept.length} rows.`);
  }
  console.log('\n## Feature split, top 20 vs bottom 20\n');
  console.log(table(HEAD, splitRow(kept.slice(0, 20), kept.slice(-20))));
  console.log('\n## Feature split, top 5 vs bottom 5 (disjoint)\n');
  console.log(table(HEAD, splitRow(kept.slice(0, 5), kept.slice(-5))));
  console.log('\n## Feature–interest association over every kept arrangement\n');
  console.log(table(['feature', 'rho', 'n'], featureAssociation(kept).map(([n, r, k]) => [n, Number.isNaN(r) ? '-' : (r as number).toFixed(3), k])));
}

function compareCommand(pathA: string, pathB: string): void {
  const a = JSON.parse(readFileSync(pathA, 'utf8')) as Report;
  const b = JSON.parse(readFileSync(pathB, 'utf8')) as Report;
  const ra = ranked(a), rb = ranked(b);
  const allA = new Set(a.byConfig.map(g => g.key)), allB = new Set(b.byConfig.map(g => g.key));
  const keptA = new Set(ra.kept.map(g => g.key)), keptB = new Set(rb.kept.map(g => g.key));
  const sharedAll = [...allA].filter(k => allB.has(k));
  const sharedKept = [...keptA].filter(k => keptB.has(k));
  console.log(`# Stability — ${a.id} vs ${b.id}\n`);
  console.log(`Arrangements: A ${a.byConfig.length} (${ra.kept.length} kept), B ${b.byConfig.length} (${rb.kept.length} kept).`);
  console.log(`Shared rank strings: ${sharedAll.length} over all arrangements, ${sharedKept.length} over the kept lists.`);
  if (sharedKept.length >= 2) {
    const ga = new Map(ra.kept.map(g => [g.key, g])), gb = new Map(rb.kept.map(g => [g.key, g]));
    const union = [...ra.kept, ...rb.kept];
    const resids = residual(union.map(g => g.drawRate), union.map(g => g.interest));
    const riA = new Map(ra.kept.map((g, i) => [g.key, resids[i]]));
    const riB = new Map(rb.kept.map((g, i) => [g.key, resids[ra.kept.length + i]]));
    const xs = sharedKept.map(k => ga.get(k)!.interest), ys = sharedKept.map(k => gb.get(k)!.interest);
    const xr = sharedKept.map(k => riA.get(k)!), yr = sharedKept.map(k => riB.get(k)!);
    console.log(`Spearman(interest): rho = ${spearman(xs, ys).toFixed(3)} (n = ${sharedKept.length}).`);
    console.log(`Spearman(interest residualised on draw rate, union fit): rho = ${spearman(xr, yr).toFixed(3)} (n = ${sharedKept.length}).`);
  } else {
    console.log('Spearman: not computed (fewer than 2 shared arrangements).');
  }

  const topA = ra.kept.slice(0, 20), botA = ra.kept.slice(-20);
  const topB = rb.kept.slice(0, 20), botB = rb.kept.slice(-20);
  console.log('\n## Feature splits: A, top 20 vs bottom 20\n');
  console.log(table(HEAD, splitRow(topA, botA)));
  console.log('\n## Feature splits: B, top 20 vs bottom 20\n');
  console.log(table(HEAD, splitRow(topB, botB)));
  console.log('\n## Feature splits: A, top 5 vs bottom 5 (disjoint)\n');
  console.log(table(HEAD, splitRow(ra.kept.slice(0, 5), ra.kept.slice(-5))));
  console.log('\n## Feature splits: B, top 5 vs bottom 5 (disjoint)\n');
  console.log(table(HEAD, splitRow(rb.kept.slice(0, 5), rb.kept.slice(-5))));
  console.log('\n## Top-set feature profile: A top 20 vs B top 20\n');
  console.log(table(['feature', 'A top 20', 'B top 20', 'p'], splitRow(topA, topB)));
  console.log('\n## Top-set feature profile: A top 5 vs B top 5\n');
  console.log(table(['feature', 'A top 5', 'B top 5', 'p'], splitRow(ra.kept.slice(0, 5), rb.kept.slice(0, 5))));
  const assoc = (label: string, rows: Group[]) => table([`${label} feature`, `${label} rho`, 'n'], featureAssociation(rows).map(([n, r, k]) => [n, Number.isNaN(r) ? '-' : (r as number).toFixed(3), k]));
  console.log('\n## Feature–interest association over every kept arrangement\n');
  console.log(assoc('A', ra.kept));
  console.log();
  console.log(assoc('B', rb.kept));
  console.log('\n## Feature–interest association over every arrangement in the round (filter not applied)\n');
  console.log(assoc('A', a.byConfig));
  console.log();
  console.log(assoc('B', b.byConfig));
}

/**
 * Split-half reliability of the interest metric inside one round: 160 games per arrangement split
 * by gameId parity into two 80-game samples, each re-analysed with the same analyzer. If the
 * halves do not agree across arrangements, the metric at this budget is mostly noise, and no
 * cross-sweep comparison can rescue it. This is the noise floor under the stability check.
 */
function splitCommand(path: string): void {
  const recs = readFileSync(path, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as GameRecord);
  const byConfig = new Map<string, GameRecord[]>();
  for (const r of recs) (byConfig.get(r.configId) ?? byConfig.set(r.configId, []).get(r.configId)!).push(r);
  const halfA: GameRecord[] = [], halfB: GameRecord[] = [];
  for (const rs of byConfig.values()) {
    rs.sort((x, y) => x.gameId - y.gameId);
    rs.forEach((r, i) => (i % 2 === 0 ? halfA : halfB).push(r));
  }
  const even = analyze(`${path} A`, halfA);
  const odd = analyze(`${path} B`, halfB);
  const ia = new Map(even.byConfig.map(g => [g.key, g])), ib = new Map(odd.byConfig.map(g => [g.key, g]));
  const keys = [...ia.keys()].filter(k => ib.has(k));
  const xs = keys.map(k => value(ia.get(k)!)), ys = keys.map(k => value(ib.get(k)!));
  const dx = keys.map(k => Math.abs(value(ia.get(k)!) - value(ib.get(k)!)));
  const sd = (v: number[]) => { const m = mean(v); return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length); };
  console.log(`# Split-half reliability — ${path}\n`);
  console.log(`Arrangements: ${keys.length}; games per half: ${even.games / (keys.length || 1)}.`);
  console.log(`Spearman(interest, even vs odd gameIds): rho = ${spearman(xs, ys).toFixed(3)} (n = ${keys.length}).`);
  console.log(`Interest SD: half A ${sd(xs).toFixed(3)}, half B ${sd(ys).toFixed(3)}, |A-B| mean ${mean(dx).toFixed(3)}, max ${Math.max(...dx).toFixed(3)}.`);
  console.log(`Per-arrangement: ${keys.map((k, i) => `${k} ${xs[i].toFixed(3)}/${ys[i].toFixed(3)}`).join('; ')}`);
}

const [, , cmd, ...rawArgs] = process.argv;
if (rawArgs.includes('resid')) METRIC = 'resid';
const args = rawArgs.filter(a => a !== 'raw' && a !== 'resid');
if (cmd === 'rank' && args[0]) rankCommand(args[0]);
else if (cmd === 'full' && args[0]) fullCommand(args[0]);
else if (cmd === 'compare' && args[0] && args[1]) compareCommand(args[0], args[1]);
else if (cmd === 'split' && args[0]) splitCommand(args[0]);
else { console.error('usage: tsx analyze.ts rank <report.json> | compare <A.report.json> <B.report.json> | split <round.jsonl>'); process.exit(1); }
