#!/usr/bin/env -S npx tsx
/**
 * Audit of the inherited Q6 corpus (docs/TAKEOVER-PLAN.md §3).
 *
 * `sim/out/nnue-g1.jsonl` carries no rule stamp, so what its 80 000 games actually played has to
 * come from the launch record (`queue3.sh`, 2026-09-14 04:50) and from move replay under candidate
 * rule sets. The one semantic the launch left open is `paladinKamikaze`; the pool, archer, beast,
 * guard and promotion rules were pinned on the command line.
 *
 *   tsx tools/q6-audit.ts [--file sim/out/nnue-g1.jsonl] [--games 200]
 *
 * Read-only: it never writes a file. The findings land in docs/research/ai-q6-audit-2026-09-16.md.
 */
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { buildJobs } from '../src/sim/spec';
import { replayRecord, eventsMatch } from '../src/sim/replay';
import { setRules } from '../src/rules/rules';
import type { GameRecord } from '../src/sim/game';

const flags = process.argv.slice(2);
const flag = (name: string, dflt: string): string => {
  const i = flags.indexOf(`--${name}`);
  return i >= 0 && flags[i + 1] ? flags[i + 1] : dflt;
};
const file = flag('file', 'sim/out/nnue-g1.jsonl');
const wantGames = Number(flag('games', '200'));

interface Rec extends GameRecord { rulesKey?: string }
const prefix: { gameId: number; configId: string }[] = [];
const sampled: Rec[] = [];
let lines = 0, stamped = 0;
for await (const line of createInterface({ input: createReadStream(file), crlfDelay: Infinity })) {
  if (!line) continue;
  lines++;
  const rec = JSON.parse(line) as Rec;
  if (rec.rulesKey) stamped++;
  if (lines <= 686) prefix.push({ gameId: rec.gameId, configId: rec.configId });
  else if ((lines - 687) % Math.max(1, Math.floor((79_314) / wantGames)) === 0 && sampled.length < wantGames) sampled.push(rec);
}
console.log(`file: ${file}`);
console.log(`lines: ${lines}, records with a stamp field: ${stamped}, prefix lines inspected: ${prefix.length}, cohort games sampled: ${sampled.length}\n`);

// ---------------------------------------------------------------------------------------------
// 1. Which spec does the 686-record prefix belong to?
console.log('Prefix vs candidate specs (gameId/configId must match):');
const specs = [
  { name: 'queue3.sh 2026-09-14 (seed 914, sample 4000, 80000 games)', seed: 914, sample: 4000, games: 80_000 },
  { name: 'the stored summary (seed 202, sample 700, 686 games)', seed: 202, sample: 700, games: 686 },
];
for (const s of specs) {
  const jobs = buildJobs({ id: 'audit', games: s.games, ai: { depth: 3 }, seed: s.seed, backRanks: { sample: s.sample }, openingRandomPlies: 4 });
  const byId = new Map(jobs.map(j => [j.gameId, j.configId]));
  const hit = prefix.filter(p => byId.get(p.gameId) === p.configId).length;
  console.log(`  ${String(hit).padStart(3)}/${prefix.length}  ${s.name}`);
}

// ---------------------------------------------------------------------------------------------
// 2. Replay the cohort under both paladin semantics.
console.log('\nCohort replay under candidate paladin semantics (all other rules at their launch values):');
type Verdict = 'match' | 'eventsDiffer' | 'illegal';
const classify = (rec: Rec): Verdict => {
  try {
    const { events } = replayRecord(rec);
    return eventsMatch(events, rec.events ?? {}) === null ? 'match' : 'eventsDiffer';
  } catch { return 'illegal'; }
};
const variants = ['always', 'nonPawn'] as const;
const table: Record<string, Record<Verdict, number>> = {};
for (const v of variants) table[v] = { match: 0, eventsDiffer: 0, illegal: 0 };
let decisiveAlways = 0, decisiveNonPawn = 0, ambiguous = 0, neither = 0;
for (const rec of sampled) {
  const verdicts = {} as Record<(typeof variants)[number], Verdict>;
  for (const v of variants) {
    setRules({ paladinKamikaze: v });
    verdicts[v] = classify(rec);
    table[v][verdicts[v]]++;
  }
  if (verdicts.always === 'match' && verdicts.nonPawn !== 'match') decisiveAlways++;
  else if (verdicts.nonPawn === 'match' && verdicts.always !== 'match') decisiveNonPawn++;
  else if (verdicts.always === 'match' && verdicts.nonPawn === 'match') ambiguous++;
  else neither++;
}
for (const v of variants) {
  const t = table[v];
  console.log(`  paladinKamakaze=${v.padEnd(8)} match ${t.match}, events differ ${t.eventsDiffer}, illegal ${t.illegal}`);
}
console.log(`\n  only "always" replays clean : ${decisiveAlways}`);
console.log(`  only "nonPawn" replays clean: ${decisiveNonPawn}`);
console.log(`  both replay clean (no paladin pawn capture to tell them apart): ${ambiguous}`);
console.log(`  neither replays clean       : ${neither}`);
setRules();
