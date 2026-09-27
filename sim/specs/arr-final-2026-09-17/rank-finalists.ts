/**
 * Finalist analysis (2026-09-17): the pre-registered ranking rule applied to the 1,000-game run,
 * and the depth-4 comparison of the top 5. Read-only over `sim/out/*.report.json`; writes one
 * markdown file beside itself.
 *
 *   tsx rank-finalists.ts rank [report.json]
 *   tsx rank-finalists.ts d4   [report.json]
 *
 * Ranking rule (docs/research/arrangement-benchmark-2026-09-17.md):
 *   drop |score - 0.5| > 0.03 or timeouts > 0.05; rank the rest by interest (resid.), ties by
 *   min utilisation, then by interest (min-use), then by key.
 *
 * The decisive-share interval is the normal approximation 1.96 * sqrt(p(1-p)/n) on this row's
 * game count; the report carries a score interval, not a decisive one.
 */
import { readFileSync, writeFileSync } from 'node:fs';

interface Lead { killerMove: number; leadChange: number; uncertaintyLate: number; drama: number; permanence: number }
interface Group {
  key: string; games: number; score: number; ci: [number, number];
  drawRate: number; timeouts: number; decisiveness: number;
  minUse: number; meanFairyUse: number; minFairyUse: number;
  interest: number; interestMinFairy: number;
  interestResiduals: Record<string, number>;
  excessDecisiveness: number; lead: Lead;
}
interface Report { id: string; games: number; overall: Group; byConfig: Group[] }

const FAIR_MAX = 0.03;
const TIMEOUT_MAX = 0.05;
const OUT = 'sim/specs/arr-final-2026-09-17/finalists-tables.md';

const reportPath = process.argv[3] ?? 'sim/out/finalists.report.json';
const report = JSON.parse(readFileSync(reportPath, 'utf8')) as Report;

const resid = (g: Group): number => g.interestResiduals?.interest ?? g.interest;
const fairness = (g: Group): number => Math.abs(g.score - 0.5);

function ranked(r: Report): { kept: Group[]; dropped: Group[] } {
  const dropped = r.byConfig.filter(g => fairness(g) > FAIR_MAX || g.timeouts > TIMEOUT_MAX);
  const kept = r.byConfig
    .filter(g => !dropped.includes(g))
    .slice()
    .sort((a, b) => resid(b) - resid(a)
      || b.minUse - a.minUse
      || b.interestMinFairy - a.interestMinFairy
      || a.key.localeCompare(b.key));
  return { kept, dropped };
}

const f3 = (x: number): string => x.toFixed(3);
const f2 = (x: number): string => x.toFixed(2);
const pctOf = (x: number): string => `${(100 * x).toFixed(1)}%`;
const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const sd = (xs: number[]): number => { const m = mean(xs); return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, xs.length - 1)); };

/** Normal-approximation 95% interval on a share, as `± half-width`. */
const half95 = (p: number, n: number): number => 1.959964 * Math.sqrt((p * (1 - p)) / (n || 1));

function table(head: string[], rows: (string | number)[][]): string {
  return [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`,
    ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');
}

const HEAD = ['#', 'back rank', 'games', 'score', 'fairness |s-0.5|', 'decisive', 'decisive 95%', 'draws', 'capped', 'minUse', 'fairyUse', 'interest (resid.)', 'interest', 'interest (min-use)'];
const line = (g: Group, i: number): (string | number)[] => [
  i + 1, g.key, g.games, f3(g.score), f3(fairness(g)),
  pctOf(g.decisiveness), `±${(100 * half95(g.decisiveness, g.games)).toFixed(1)}`,
  pctOf(g.drawRate), pctOf(g.timeouts), f2(g.minUse), f2(g.meanFairyUse),
  f3(resid(g)), f3(g.interest), f3(g.interestMinFairy),
];

/** Average-rank Spearman (ties averaged). NaN when either side has no spread. */
function spearman(xs: number[], ys: number[]): number {
  const ranks = (v: number[]): number[] => {
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

const { kept, dropped } = ranked(report);
const o = report.overall;
const out: string[] = [];
const say = (s: string): void => { out.push(s); console.log(s); };

say(`# Finalists — pre-registered ranking (${reportPath})`);
say('');
say(`${report.games} games over ${report.byConfig.length} arrangements; ${report.games / report.byConfig.length} games each. Overall: white score ${f3(o.score)}, decisive ${pctOf(o.decisiveness)}, draws ${pctOf(o.drawRate)}, capped ${pctOf(o.timeouts)}.`);
say(`Gate: |score - 0.5| <= ${FAIR_MAX} and timeouts <= ${TIMEOUT_MAX}. ${kept.length} of ${report.byConfig.length} kept, ${dropped.length} dropped.`);
if (dropped.length) say(`Dropped: ${dropped.map(g => `${g.key} (|s-0.5|=${f3(fairness(g))}, timeouts=${f3(g.timeouts)})`).join('; ')}.`);
const ties = kept.filter((g, i) => i > 0 && Math.abs(resid(g) - resid(kept[i - 1])) < 1e-12);
if (ties.length) say(`Exact residual ties: ${ties.map(g => g.key).join(', ')} (minUse then interest(min-use) broke them).`);
say('');
say(`Cross-arrangement interest (resid.): SD ${f3(sd(kept.map(resid)))}, range ${f3(Math.min(...kept.map(resid)))} to ${f3(Math.max(...kept.map(resid)))} over the ${kept.length} kept.`);
say(`Cross-arrangement raw interest: SD ${f3(sd(kept.map(g => g.interest)))}, range ${f3(Math.min(...kept.map(g => g.interest)))} to ${f3(Math.max(...kept.map(g => g.interest)))}.`);
say('');
say(`## Top 10`);
say('');
say(table(HEAD, kept.slice(0, 10).map(line)));
say('');
say(`## Bottom 10 (rows ${kept.length - 9}–${kept.length} of the ranked list)`);
say('');
const start = Math.max(0, kept.length - 10);
say(table(HEAD, kept.slice(start).map((g, i) => line(g, start + i))));
say('');
say(`## All ${kept.length} kept, in ranking order`);
say('');
say(table(HEAD, kept.map(line)));

const mode = process.argv[2];
if (mode === 'd4') {
  const d4 = JSON.parse(readFileSync('sim/out/arr-final-d4.report.json', 'utf8')) as Report;
  const top5 = kept.slice(0, 5);
  const r4 = ranked(d4);
  const by4 = d4.byConfig.slice().sort((a, b) => resid(b) - resid(a) || b.minUse - a.minUse || a.key.localeCompare(b.key));
  const rank4 = new Map(by4.map((g, i) => [g.key, i + 1]));
  say('');
  say(`## Depth-4 confirmation of the top 5 (${d4.games} games, ${d4.games / d4.byConfig.length} per rank)`);
  say('');
  say(`Depth-4 gate: ${r4.kept.length} of ${d4.byConfig.length} kept, ${r4.dropped.length} dropped (${r4.dropped.map(g => `${g.key}: |s-0.5|=${f3(fairness(g))}, timeouts=${f3(g.timeouts)}`).join('; ') || 'none'}).`);
  say('');
  say(table(['rank at depth 3', 'back rank', 'depth-3 interest (resid.)', 'depth-4 interest (resid.)', 'depth-4 rank (all five)', 'depth-4 decisive', 'depth-4 fairness |s-0.5|', 'depth-4 gate'], top5.map((g, i) => {
    const h = d4.byConfig.find(x => x.key === g.key)!;
    const gate = fairness(h) > FAIR_MAX ? 'balance' : h.timeouts > TIMEOUT_MAX ? 'timeouts' : 'pass';
    return [i + 1, g.key, f3(resid(g)), f3(resid(h)), rank4.get(g.key) ?? '-', pctOf(h.decisiveness), f3(fairness(h)), gate];
  })));
  const order4 = top5.map(g => rank4.get(g.key)!);
  say('');
  say(`Spearman between the depth-3 order (1–5, which is the depth-3 ranking order) and the depth-4 rank of the same five when all five are ranked without the gate: rho = ${spearman([1, 2, 3, 4, 5], order4).toFixed(3)} (n = 5).`);
  say(`Depth-4 order of the five: ${top5.map(g => `${g.key} (3:${top5.indexOf(g) + 1} -> 4:${rank4.get(g.key)})`).join(', ')}.`);
  const inTopHalf = top5.filter(g => (rank4.get(g.key) ?? 99) <= Math.ceil(d4.byConfig.length / 2)).length;
  say(`Depth-4 top half (of all five) holds ${inTopHalf} of the 5; gate-kept rows: ${r4.kept.length}.`);
}

writeFileSync(OUT, out.join('\n') + '\n');
console.log(`-> ${OUT}`);
