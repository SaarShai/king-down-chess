#!/usr/bin/env -S npx tsx
/**
 * The numbers the Ogre/Catapult report still needs (docs/TAKEOVER-PLAN.md §4): the piece-vs-knight
 * comparison on matched ranks (np-O / np-C against np-N), guard-shove frequency, and the activity
 * counters for each arm. Read-only. Usage: tsx tools/newpieces-stats.ts
 */
import { readRecords } from '../src/sim/analyze';
import type { GameRecord } from '../src/sim/game';

const OUT = 'sim/out';
const files = {
  'np-N': `${OUT}/np-N.jsonl`, 'np-O': `${OUT}/np-O.jsonl`, 'np-C': `${OUT}/np-C.jsonl`,
  'ab-O-push.base': `${OUT}/ab-O-push.base.jsonl`, 'ab-O-push.var': `${OUT}/ab-O-push.var.jsonl`,
  'ab-C-land.base': `${OUT}/ab-C-land.base.jsonl`, 'ab-C-land.var': `${OUT}/ab-C-land.var.jsonl`,
};
const runs = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, readRecords(v)])) as Record<string, GameRecord[]>;

const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const ci = (xs: number[]): number => {
  const n = xs.length; if (n < 2) return Infinity;
  const m = mean(xs), v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / (n - 1);
  return 1.959964 * Math.sqrt(v / n);
};
const f3 = (x: number): string => x.toFixed(3);
const f2 = (x: number): string => x.toFixed(2);

/** Per-game counters from the record's `events` (the same source the runner wrote). */
const activity = (recs: GameRecord[]) => {
  const g = (f: (r: GameRecord) => number): number => recs.reduce((a, r) => a + f(r), 0) / (recs.length || 1);
  const shoves = g(r => (r.events.ogreShoves?.[0] ?? 0) + (r.events.ogreShoves?.[1] ?? 0));
  const friend = g(r => (r.events.ogreShovesFriend?.[0] ?? 0) + (r.events.ogreShovesFriend?.[1] ?? 0));
  const guard = g(r => (r.events.ogreShovesGuard?.[0] ?? 0) + (r.events.ogreShovesGuard?.[1] ?? 0));
  const guardGames = recs.filter(r => (r.events.ogreShovesGuard?.[0] ?? 0) + (r.events.ogreShovesGuard?.[1] ?? 0) > 0).length;
  const lobs = g(r => r.stats.reduce((a, s) => a + (s.captures.C ?? 0), 0));
  const lobGames = recs.filter(r => r.stats.some(s => (s.captures.C ?? 0) > 0)).length;
  const lobChecks = g(r => (r.events.catapultChecks?.[0] ?? 0) + (r.events.catapultChecks?.[1] ?? 0));
  const draws = recs.filter(r => r.result === 0.5).length / (recs.length || 1);
  const capped = recs.filter(r => r.reason === 'plyCap').length / (recs.length || 1);
  const plies = mean(recs.map(r => r.plies));
  return { shoves, friend, guard, guardGames, lobs, lobGames, lobChecks, draws, capped, plies };
};

console.log('## Activity per game (both colours)');
console.log('| run | shoves | friend | guard | games with a guard shove | lobs | games with a lob | lob checks | draws | capped | plies |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const [k, recs] of Object.entries(runs)) {
  const a = activity(recs);
  console.log(`| ${k} | ${f2(a.shoves)} | ${f2(a.friend)} | ${f3(a.guard)} | ${a.guardGames} (${f2(100 * a.guardGames / recs.length)}%) | ${f2(a.lobs)} | ${a.lobGames} (${f2(100 * a.lobGames / recs.length)}%) | ${f2(a.lobChecks)} | ${f2(100 * a.draws)}% | ${f2(100 * a.capped)}% | ${f2(a.plies)} |`);
}

console.log('\n## Matched np-* comparison (same gameId = same rank and opening seed)');
for (const [piece, run] of [['O', 'np-O'], ['C', 'np-C']] as const) {
  const ctrl = runs['np-N'];
  const arm = runs[run];
  const byId = new Map(arm.map(r => [r.gameId, r]));
  const paired = ctrl.filter(r => byId.has(r.gameId));
  const resDiff = paired.map(r => (byId.get(r.gameId)!.result as number) - (r.result as number));
  const decDiff = paired.map(r => (byId.get(r.gameId)!.result === 0.5 ? 0 : 1) - (r.result === 0.5 ? 0 : 1));
  const plyDiff = paired.map(r => byId.get(r.gameId)!.plies - r.plies);
  const a = activity(arm), b = activity(ctrl);
  console.log(`${run} vs np-N: ${paired.length} matched games`);
  console.log(`  white score: control ${f3(mean(ctrl.map(r => r.result)))} -> ${f3(mean(arm.map(r => r.result)))} (paired diff ${f3(mean(resDiff))} ± ${f3(ci(resDiff))})`);
  console.log(`  decisive:    control ${f2(100 * (1 - b.draws - b.capped))}% -> ${f2(100 * (1 - a.draws - a.capped))}% (paired diff ${f3(mean(decDiff))} ± ${f3(ci(decDiff))})`);
  console.log(`  draws:       control ${f2(100 * b.draws)}% -> ${f2(100 * a.draws)}%`);
  console.log(`  mean plies:  control ${f2(b.plies)} -> ${f2(a.plies)} (paired diff ${f2(mean(plyDiff))} ± ${f2(ci(plyDiff))})`);
  if (piece === 'O') console.log(`  shoves: ${f2(b.shoves)} -> ${f2(a.shoves)}/game; guard shoves: ${f3(b.guard)} -> ${f3(a.guard)}/game; games with a guard shove: ${b.guardGames} -> ${a.guardGames}`);
  else console.log(`  lobs: ${f2(b.lobs)} -> ${f2(a.lobs)}/game; games with a lob: ${b.lobGames} -> ${a.lobGames}; lob checks: ${f2(b.lobChecks)} -> ${f2(a.lobChecks)}/game`);
}

console.log('\n## Paired A/B of the two readings');
for (const [id, label] of [['ab-O-push', 'push − repel'], ['ab-C-land', 'land − stay']] as const) {
  const base = runs[`${id}.base`], varArm = runs[`${id}.var`];
  const byId = new Map(varArm.map(r => [r.gameId, r]));
  const paired = base.filter(r => byId.has(r.gameId));
  const resDiff = paired.map(r => (byId.get(r.gameId)!.result as number) - (r.result as number));
  const decDiff = paired.map(r => (byId.get(r.gameId)!.result === 0.5 ? 0 : 1) - (r.result === 0.5 ? 0 : 1));
  const a = activity(varArm), b = activity(base);
  console.log(`${label}: ${paired.length} paired games, score diff ${f3(mean(resDiff))} ± ${f3(ci(resDiff))}, decisive diff ${f3(mean(decDiff))} ± ${f3(ci(decDiff))}, draws ${f2(100 * b.draws)}% -> ${f2(100 * a.draws)}%`);
  if (id === 'ab-O-push') console.log(`  shoves/game ${f2(b.shoves)} -> ${f2(a.shoves)}; games with a guard shove ${b.guardGames} -> ${a.guardGames}; guard shoves/game ${f3(b.guard)} -> ${f3(a.guard)}`);
  else console.log(`  lobs/game ${f2(b.lobs)} -> ${f2(a.lobs)}; lob games ${b.lobGames} -> ${a.lobGames}; lob checks/game ${f2(b.lobChecks)} -> ${f2(a.lobChecks)}`);
}
