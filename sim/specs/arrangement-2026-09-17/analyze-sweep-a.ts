#!/usr/bin/env -S npx tsx
/**
 * Sweep A reader — applies the pre-registered ranking rule of
 * docs/research/arrangement-benchmark-2026-09-17.md to a sweep round report and derives the
 * feature and event tables of docs/research/arrangement-sweep-a-2026-09-17.md.
 *
 *   node_modules/.bin/tsx sim/specs/arrangement-2026-09-17/analyze-sweep-a.ts [--id arr-a] [--round 5]
 *
 * Ranking rule: drop |white score − 0.5| > 0.03 or capped share > 0.05; rank by the draw-rate
 * residual of interest (`interestResiduals.interest`), break ties by min utilisation then by the
 * mean number of the six stored mechanics a game engages. Events are counted per game from the
 * round's JSONL and averaged per arrangement.
 */
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const argv = process.argv.slice(2);
const flag = (name: string, dflt: string): string => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const ID = flag('id', 'arr-a');
const ROUND = +flag('round', '5');
const OUT_DIR = 'sim/out';
const HERE = 'sim/specs/arrangement-2026-09-17';
const FAIR = 0.03, CAPPED = 0.05;

interface Group {
  key: string; games: number; score: number; decisiveness: number; drawRate: number; timeouts: number;
  minUse: number; meanFairyUse: number; excessDecisiveness: number; interest: number; interestMinFairy: number;
  gatesFailed: string[]; interestResiduals?: Record<string, number>;
}
interface Report { id: string; games: number; byConfig: Group[] }
interface Events {
  archerShots: [number, number]; beastChains: [number[], number[]]; maesterSwaps: [number, number];
  maesterLongSwaps: [number, number]; paladinSacrifices: [number, number]; promotions: [number, number];
  checks: [number, number];
}
interface GameRec { gameId: number; configId: string; events: Events }

const avg = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

const EVENTS: [string, (e: Events) => number][] = [
  ['archer shots', e => e.archerShots[0] + e.archerShots[1]],
  ['beast chain moves', e => e.beastChains[0].length + e.beastChains[1].length],
  ['maester swaps', e => e.maesterSwaps[0] + e.maesterSwaps[1]],
  ['paladin sacrifices', e => e.paladinSacrifices[0] + e.paladinSacrifices[1]],
  ['promotions', e => e.promotions[0] + e.promotions[1]],
  ['checks', e => e.checks[0] + e.checks[1]],
];

export interface Derived {
  key: string; games: number; score: number; residInterest: number; interest: number;
  interestMinFairy: number; decisive: number; drawRate: number;
  timeouts: number; minUse: number; meanFairyUse: number; excessDecisiveness: number;
  gatesFailed: string[]; eventsPerGame: Record<string, number>; mechanics: number; rank: number;
}
export interface AppendixRow {
  round: number; key: string; games: number; score: number; residInterest: number; interest: number;
  interestMinFairy: number; decisive: number; drawRate: number;
  timeouts: number; minUse: number; meanFairyUse: number; excessDecisiveness: number; gatesFailed: string[];
  eventsPerGame: Record<string, number>; mechanics: number; rank: number;
}
export interface FeatureSplit {
  feature: string; level: string | number | null; arrangements: number; meanInterest: number | null;
  meanRawInterest: number | null; decisiveShare: number | null; inTopQ: number; inBottomQ: number;
}
export interface SweepOut {
  id: string; round: number; arrangementsPlayed: number; passedGates: number;
  dropped: { key: string; score: number; timeouts: number; gates: string[] }[];
  quartileSize: number; ranked: (Derived & { features: Features | undefined })[];
  top20: Derived[]; bottom20: Derived[]; top5: Derived[]; bottom5: Derived[];
  eventMeans: { event: string; top20: number; bottom20: number; topQ: number; bottomQ: number }[];
  eventMeansTop5: { event: string; top5: number; bottom5: number }[];
  mechanicsTop20: number; mechanicsBottom20: number; mechanicsTopQ: number; mechanicsBottomQ: number;
  mechanicsTop5: number; mechanicsBottom5: number;
  rankShifts: { key: string; residRank: number; rawRank: number; shift: number }[];
  featureSplits: FeatureSplit[]; appendix: AppendixRow[];
}
export interface Features {
  queen: number; guard: number; guardKingDist: number | null; archers: 'adjacent' | 'apart' | 'incomplete';
  maesterNearKing: number; distinctTypes: number; kingFile: number;
  pawnRowContact: number; nonKingOnKingFile: number;
}

async function main(): Promise<void> {
  const report = JSON.parse(readFileSync(`${OUT_DIR}/${ID}.r${ROUND}.report.json`, 'utf8')) as Report;
  const perCfg = new Map<string, { n: number; ev: Record<string, number>; mech: number }>();
  for (const key of report.byConfig.map(g => g.key)) {
    perCfg.set(key, { n: 0, ev: Object.fromEntries(EVENTS.map(([name]) => [name, 0])), mech: 0 });
  }
  const input = createInterface({ input: createReadStream(`${OUT_DIR}/${ID}.r${ROUND}.jsonl`), crlfDelay: Infinity });
  for await (const line of input) {
    if (!line) continue;
    const r = JSON.parse(line) as GameRec;
    const p = perCfg.get(r.configId);
    if (!p) continue;
    p.n++;
    for (const [name, f] of EVENTS) p.ev[name] += f(r.events);
    p.mech += EVENTS.filter(([, f]) => f(r.events) > 0).length;
  }
  for (const [, p] of perCfg) {
    for (const name of Object.keys(p.ev)) p.ev[name] /= p.n || 1;
    p.mech /= p.n || 1;
  }

  const passes = (g: Group): boolean => Math.abs(g.score - 0.5) <= FAIR && g.timeouts <= CAPPED;
  const ranked: Derived[] = report.byConfig
    .filter(passes)
    .sort((a, b) =>
      (b.interestResiduals?.interest ?? 0) - (a.interestResiduals?.interest ?? 0)
      || b.minUse - a.minUse
      || perCfg.get(b.key)!.mech - perCfg.get(a.key)!.mech)
    .map((g, i) => ({
      key: g.key, games: g.games, score: g.score, residInterest: g.interestResiduals?.interest ?? 0,
      interest: g.interest, interestMinFairy: g.interestMinFairy,
      decisive: g.decisiveness, drawRate: g.drawRate, timeouts: g.timeouts, minUse: g.minUse,
      meanFairyUse: g.meanFairyUse, excessDecisiveness: g.excessDecisiveness,
      gatesFailed: g.gatesFailed, eventsPerGame: perCfg.get(g.key)!.ev, mechanics: perCfg.get(g.key)!.mech,
      rank: i + 1,
    }));
  const dropped = report.byConfig.filter(g => !passes(g)).map(g => ({
    key: g.key, score: g.score, timeouts: g.timeouts, gates: g.gatesFailed,
  }));

  const features = new Map<string, Features>();
  for (const g of report.byConfig) {
    const key = g.key, kFile = key.indexOf('K');
    const files = (ch: string): number[] => [...key].flatMap((c, i) => (c === ch ? [i] : []));
    const a = files('A'), m = files('M'), gd = files('G');
    features.set(key, {
      queen: key.includes('Q') ? 1 : 0,
      guard: key.includes('G') ? 1 : 0,
      guardKingDist: gd.length ? Math.abs(gd[0] - kFile) : null,
      archers: a.length < 2 ? 'incomplete' : Math.abs(a[0] - a[1]) === 1 ? 'adjacent' : 'apart',
      maesterNearKing: m.some(f => Math.abs(f - kFile) === 1) ? 1 : 0,
      distinctTypes: new Set(key).size,
      kingFile: kFile,
      pawnRowContact: 1,
      nonKingOnKingFile: [...key].some((c, i) => i === kFile && c !== 'K') ? 1 : 0,
    });
  }

  const byRaw = [...ranked].sort((a, b) => b.interest - a.interest).map(r => r.key);
  const rawRank = new Map(byRaw.map((k, i) => [k, i + 1]));
  const rankShifts = ranked.map(r => ({ key: r.key, residRank: r.rank, rawRank: rawRank.get(r.key) ?? 0 }))
    .map(x => ({ ...x, shift: x.rawRank - x.residRank }))
    .sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));

  const q = Math.max(1, Math.floor(ranked.length / 4));
  const topQ = ranked.slice(0, q), bottomQ = ranked.slice(-q);
  const featureSplits: FeatureSplit[] = [];
  const levels = (name: string): (string | number | null)[] => {
    switch (name) {
      case 'queen': case 'guard': case 'maesterNearKing': case 'pawnRowContact': case 'nonKingOnKingFile':
        return [0, 1];
      case 'archers': return ['adjacent', 'apart', 'incomplete'];
      case 'distinctTypes': return [...new Set(ranked.map(r => features.get(r.key)!.distinctTypes))].sort((a, b) => a - b);
      case 'guardKingDist': return [null, 1, 2, 3, 4, 5, 6, 7];
      default: throw new Error(name);
    }
  };
  for (const name of ['queen', 'guard', 'guardKingDist', 'archers', 'maesterNearKing', 'distinctTypes', 'pawnRowContact', 'nonKingOnKingFile']) {
    for (const lvl of levels(name)) {
      const inLvl = (r: Derived): boolean => features.get(r.key)![name as keyof Features] === lvl;
      const rows = ranked.filter(inLvl);
      featureSplits.push({
        feature: name, level: lvl, arrangements: rows.length,
        meanInterest: rows.length ? rows.reduce((a, r) => a + r.residInterest, 0) / rows.length : null,
        meanRawInterest: rows.length ? rows.reduce((a, r) => a + r.interest, 0) / rows.length : null,
        decisiveShare: rows.length ? rows.reduce((a, r) => a + r.decisive, 0) / rows.length : null,
        inTopQ: topQ.filter(inLvl).length, inBottomQ: bottomQ.filter(inLvl).length,
      });
    }
  }

  const r4File = `${OUT_DIR}/${ID}.r${ROUND - 1}.report.json`;
  const r4: Report | null = ROUND > 1 && existsSync(r4File) ? JSON.parse(readFileSync(r4File, 'utf8')) as Report : null;
  const r4Pass: Group[] = r4 ? r4.byConfig.filter(passes)
    .sort((a, b) => (b.interestResiduals?.interest ?? 0) - (a.interestResiduals?.interest ?? 0) || b.minUse - a.minUse) : [];
  const inR5 = new Set(report.byConfig.map(g => g.key));
  const appendix: AppendixRow[] = [
    ...ranked.map(r => ({ round: ROUND, ...r })),
    ...r4Pass.filter(g => !inR5.has(g.key)).map(g => ({
      round: ROUND - 1, key: g.key, games: g.games, score: g.score,
      residInterest: g.interestResiduals?.interest ?? 0, interest: g.interest,
      interestMinFairy: g.interestMinFairy, decisive: g.decisiveness, drawRate: g.drawRate,
      timeouts: g.timeouts, minUse: g.minUse, meanFairyUse: g.meanFairyUse, excessDecisiveness: g.excessDecisiveness,
      gatesFailed: g.gatesFailed, eventsPerGame: {}, mechanics: NaN, rank: 0,
    })),
  ].slice(0, 50);

  const out: SweepOut = {
    id: report.id, round: ROUND, arrangementsPlayed: report.byConfig.length,
    passedGates: ranked.length, dropped,
    quartileSize: q,
    ranked: ranked.map(r => ({ ...r, features: features.get(r.key) })),
    top20: ranked.slice(0, 20), bottom20: ranked.slice(-20),
    eventMeans: EVENTS.map(([name]) => ({
      event: name,
      top20: avg(ranked.slice(0, 20).map(r => r.eventsPerGame[name])),
      bottom20: avg(ranked.slice(-20).map(r => r.eventsPerGame[name])),
      topQ: avg(topQ.map(r => r.eventsPerGame[name])), bottomQ: avg(bottomQ.map(r => r.eventsPerGame[name])),
    })),
    top5: ranked.slice(0, 5), bottom5: ranked.slice(-5),
    eventMeansTop5: EVENTS.map(([name]) => ({
      event: name,
      top5: avg(ranked.slice(0, 5).map(r => r.eventsPerGame[name])),
      bottom5: avg(ranked.slice(-5).map(r => r.eventsPerGame[name])),
    })),
    mechanicsTop20: avg(ranked.slice(0, 20).map(r => r.mechanics)),
    mechanicsBottom20: avg(ranked.slice(-20).map(r => r.mechanics)),
    mechanicsTopQ: avg(topQ.map(r => r.mechanics)), mechanicsBottomQ: avg(bottomQ.map(r => r.mechanics)),
    mechanicsTop5: avg(ranked.slice(0, 5).map(r => r.mechanics)),
    mechanicsBottom5: avg(ranked.slice(-5).map(r => r.mechanics)),
    rankShifts,
    featureSplits,
    appendix,
  };
  writeFileSync(`${HERE}/sweep-a-results.json`, JSON.stringify(out, null, 2) + '\n');
  writeFileSync(`${HERE}/sweep-a-tables.md`, tables(out));
  process.stdout.write(`${HERE}/sweep-a-results.json, sweep-a-tables.md written: ${ranked.length}/${report.byConfig.length} pass gates, quartile ${q}\n`);
}

const f3 = (x: number | undefined): string => (Number.isFinite(x) ? (x as number).toFixed(3) : '-');
const f2 = (x: number | undefined): string => (Number.isFinite(x) ? (x as number).toFixed(2) : '-');
const pct1 = (x: number | undefined): string => (Number.isFinite(x) ? `${(100 * (x as number)).toFixed(1)}%` : '-');
const table = (head: string[], rows: (string | number)[][]): string =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');

function criteriaRow(r: Derived, set: string): (string | number)[] {
  return [r.rank, set, r.key, r.games, f3(r.score), f3(r.residInterest), f3(r.interest),
    f3(r.interestMinFairy), pct1(r.decisive), pct1(r.drawRate), pct1(r.timeouts),
    f3(r.excessDecisiveness), f2(r.meanFairyUse), f2(r.minUse), r.gatesFailed.join(',') || '-'];
}

function tables(out: SweepOut): string {
  const parts: string[] = [];
  parts.push(`Dropped by the gates before ranking: ${out.dropped.length ? out.dropped.map(d => `${d.key} (|score−0.5| ${f3(Math.abs(d.score - 0.5))}, capped ${pct1(d.timeouts)}, ${d.gates.join(',')})`).join('; ') : 'none'}.\n`);
  const head = ['rank', 'set', 'back rank', 'games', 'white score', 'interest (resid.)', 'interest', 'interest(min)', 'decisive', 'draws', 'capped', 'xDec', 'fairyUse', 'minUse', 'gates'];
  parts.push(`## Criteria — top 20\n${table(head, out.top20.map(r => criteriaRow(r, 'top')))}\n`);
  parts.push(`## Criteria — bottom 20\n${table(head, out.bottom20.map(r => criteriaRow(r, 'bottom')))}\n`);
  const evHead = ['back rank', 'set', 'archer shots', 'beast chain moves', 'maester swaps', 'paladin sacrifices', 'promotions', 'checks', 'mechanics'];
  const evRows = (rs: Derived[], set: string) => rs.map(r =>
    [r.key, set, f2(r.eventsPerGame['archer shots']), f2(r.eventsPerGame['beast chain moves']),
      f2(r.eventsPerGame['maester swaps']), f2(r.eventsPerGame['paladin sacrifices']),
      f2(r.eventsPerGame['promotions']), f2(r.eventsPerGame['checks']), f2(r.mechanics)]);
  parts.push(`## Events — top 20\n${table(evHead, evRows(out.top20, 'top'))}\n`);
  parts.push(`## Events — bottom 20\n${table(evHead, evRows(out.bottom20, 'bottom'))}\n`);
  parts.push(`## Events — means\n${table(['event', 'top 20', 'bottom 20', 'top 5', 'bottom 5', 'top quartile', 'bottom quartile'],
    out.eventMeans.map((e, i) => [e.event, f2(e.top20), f2(e.bottom20), f2(out.eventMeansTop5[i].top5),
      f2(out.eventMeansTop5[i].bottom5), f2(e.topQ), f2(e.bottomQ)]))}\n`);
  parts.push(`Mechanics engaged per game (of the six, top/bottom): top 20 ${f2(out.mechanicsTop20)}, bottom 20 ${f2(out.mechanicsBottom20)}, top 5 ${f2(out.mechanicsTop5)}, bottom 5 ${f2(out.mechanicsBottom5)}, top quartile ${f2(out.mechanicsTopQ)}, bottom quartile ${f2(out.mechanicsBottomQ)}.\n`);
  parts.push(`## Rank agreement, residualised vs raw interest\n${table(['back rank', 'rank (resid.)', 'rank (raw)', 'shift'],
    out.rankShifts.map(s => [s.key, s.residRank, s.rawRank, s.shift > 0 ? `+${s.shift}` : s.shift]))}\n`);
  parts.push(`## Feature splits\n${table(['feature', 'level', 'n', 'mean interest (resid.)', 'mean interest', 'decisive', 'in top quartile', 'in bottom quartile'],
    out.featureSplits.map(s => [s.feature, s.level === null ? 'no guard' : String(s.level), s.arrangements,
      s.meanInterest === null ? '-' : f3(s.meanInterest), s.meanRawInterest === null ? '-' : f3(s.meanRawInterest),
      s.decisiveShare === null ? '-' : pct1(s.decisiveShare), s.inTopQ, s.inBottomQ]))}\n`);
  parts.push(`## Appendix — ranked top ${out.appendix.length}\n${table(['rank', 'round', 'back rank', 'interest (resid.)', 'interest', 'decisive', 'draws', 'minUse'],
    out.appendix.map((r, i) => [i + 1, r.round === ROUND ? `${ROUND} (finalist)` : `${r.round} (non-finalist)`, r.key,
      f3(r.residInterest), f3(r.interest), pct1(r.decisive), pct1(r.drawRate), f2(r.minUse)]))}\n`);
  return parts.join('\n');
}

main().catch(e => { console.error(e); process.exitCode = 1; });
