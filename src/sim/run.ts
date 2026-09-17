/** Monte Carlo runner: a worker per core, one JSON line per game, resumable. */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import { GameRecord } from './game';
import { DEFAULT_RULES, Rules, ruleDiff, setRules } from '../rules/rules';
import { POOL } from '../rules/setup';
import { Job, OUT_DIR, RunSpec, buildJobs, loadSpec, parseFlags, paths, usePairs } from './spec';

/** Stamped on every game line: what a resume has to match. Readers ignore unknown fields. */
export interface Stamp { rules: Partial<Rules>; rulesKey: string; pool: string }

/**
 * The rules and pool a run plays under. `rulesKey` hashes the *whole* rule set, not the diff: a
 * diff is read against the defaults of the day, and those move, so a stored `rules: {}` does not
 * mean today's game (LESSONS.md 2026-09-13/14). The diff is kept beside it to read in the file.
 */
export function stampOf(spec: RunSpec): Stamp {
  const rules = { ...DEFAULT_RULES, ...spec.rules }; // exactly what run() puts in RULES
  // A new rule field re-keys *every* stored run and blocks its resume, so `kings` is left out of
  // the key for a run that plays none — the same "append, never move a historic key" discipline
  // src/ai/zobrist.ts follows. A run that does play a king hashes it, which is the whole point of
  // putting the choice in `Rules` (LESSONS.md 2026-09-14: a resumed control silently mixes pools).
  const { kings, ...noKings } = rules;
  const keyed = kings[0] || kings[1] ? rules : noKings;
  return {
    rules: ruleDiff(rules),
    rulesKey: createHash('sha1').update(JSON.stringify(keyed)).digest('hex').slice(0, 8),
    pool: (Array.isArray(spec.backRanks) ? undefined : spec.backRanks?.pool) ?? POOL,
  };
}

/** Games already in the file: game id -> the arrangement it played, plus the run's stamp. */
export function doneGames(file: string): { configs: Map<number, string>; stamp: Stamp | null } {
  const configs = new Map<number, string>();
  let stamp: Stamp | null = null;
  if (!existsSync(file)) return { configs, stamp };
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    // Every line is written by this module, so the prefix is exact and `configId` comes before the moves.
    const m = /^\{"gameId":(\d+).*?"configId":"([^"]*)"/.exec(line);
    if (!m) continue;
    if (!configs.size) { // the stamp is the same on every line; files written before it existed have none
      const r = JSON.parse(line) as Partial<Stamp>;
      if (r.rulesKey) stamp = { rules: r.rules ?? {}, rulesKey: r.rulesKey, pool: r.pool ?? '' };
    }
    configs.set(+m[1], m[2]);
  }
  return { configs, stamp };
}

/**
 * A run resumes from its JSONL by game id, so the stored games have to be the ones this spec plays
 * now. After a change to `POOL`, `DEFAULT_RULES`, the seed or the sample they are not, and the file
 * then holds two experiments that every reader adds up as one: `pb-ab-base` was 1 544 games under
 * the two-guard pool plus 56 under the one-guard pool, and the A/B it controlled was void
 * (LESSONS.md 2026-09-14). Throws rather than appending; returns the games to skip.
 */
export function checkResume(spec: RunSpec, jobs: Job[], file: string): Map<number, string> {
  const { configs, stamp } = doneGames(file);
  if (!configs.size) return configs;
  const newId = 'Give the run a new id';
  const distinct = (xs: Iterable<string>): number => new Set(xs).size;
  const bad = [...configs].find(([id, cfg]) => jobs[id]?.configId !== cfg);
  if (bad) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: its ${configs.size} stored games played ${distinct(configs.values())} arrangements, this spec plays ${distinct(jobs.map(j => j.configId))} over ${jobs.length} games (game ${bad[0]} is "${bad[1]}" in the file, "${jobs[bad[0]]?.configId ?? 'not played'}" now). ${newId}, or list \`backRanks\` in the spec to replay the stored ones.`);
  }
  const now = stampOf(spec);
  if (stamp && (stamp.rulesKey !== now.rulesKey || stamp.pool !== now.pool)) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: its ${configs.size} stored games played rules ${JSON.stringify(stamp.rules)} (key ${stamp.rulesKey}) on pool ${stamp.pool}, this spec plays ${JSON.stringify(now.rules)} (key ${now.rulesKey}) on pool ${now.pool}. ${newId}.`);
  }
  if (!stamp) console.warn(`[${spec.id}] ${configs.size} stored games carry no rule stamp (written before it existed): arrangements match, rules unchecked.`);
  return configs;
}

const hms = (s: number): string =>
  s < 0 || !isFinite(s) ? '?' : `${Math.floor(s / 3600)}h${String(Math.floor(s / 60) % 60).padStart(2, '0')}m${String(Math.floor(s) % 60).padStart(2, '0')}s`;

export async function run(spec: RunSpec, nWorkers: number): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  // The sampler reads the rules too (`bishopsOppositeColours` rejects a draw), and it runs here in
  // the main thread, not in a worker. Without this the one rule that only constrains *which back
  // ranks exist* would be invisible to its own run.
  setRules(spec.rules);
  const { jsonl, summary } = paths(spec.id);
  const all = buildJobs(spec);
  const done = checkResume(spec, all, jsonl);
  const jobs: Job[] = all.filter(j => !done.has(j.gameId));

  console.log(`[${spec.id}] ${spec.games} games (${done.size} already done), ${jobs.length} to play on ${nWorkers} workers -> ${jsonl}`);
  console.log(`[${spec.id}] depth ${spec.ai.depth ?? '-'}, ${spec.openingRandomPlies ?? 0} random opening plies, ply cap ${spec.maxPlies}, pairs ${usePairs(spec) ? 'on' : 'off (both sides identical; --pairs forces them on)'}`);
  // Printed because a dropped `--rule` or `--values` is otherwise invisible until the report is wrong.
  console.log(`[${spec.id}] rules ${JSON.stringify(ruleDiff(spec.rules ?? {}))}, values ${JSON.stringify(spec.values ?? {})}`);
  if (!jobs.length) { writeSummary(spec, jsonl, summary, 0); return; }

  const out = createWriteStream(jsonl, { flags: 'a' });
  const stamp = stampOf(spec); // after the record, so `gameId` stays the first key on the line
  const t0 = Date.now();
  let next = 0, finished = 0;

  const tick = setInterval(() => {
    const s = (Date.now() - t0) / 1000;
    const rate = finished / s;
    const line = `[${spec.id}] ${finished}/${jobs.length}  ${rate.toFixed(1)} games/s  ETA ${hms((jobs.length - finished) / rate)}`;
    process.stdout.write(process.stdout.isTTY ? `\r${line}   ` : `${line}\n`);
  }, 2000);

  await new Promise<void>((resolve, reject) => {
    const workers = Array.from({ length: Math.max(1, Math.min(nWorkers, jobs.length)) }, () => {
      const w = new Worker(new URL('./worker.ts', import.meta.url), { workerData: spec });
      w.on('message', (rec: GameRecord) => {
        out.write(JSON.stringify({ ...rec, ...stamp }) + '\n');
        finished++;
        if (next < jobs.length) w.postMessage(jobs[next++]);
        else { w.terminate(); if (finished === jobs.length) resolve(); }
      });
      w.on('error', reject);
      return w;
    });
    for (const w of workers) if (next < jobs.length) w.postMessage(jobs[next++]);
  });

  clearInterval(tick);
  await new Promise<void>(res => out.end(res)); // flush before writeSummary reads the file back
  const secs = (Date.now() - t0) / 1000;
  process.stdout.write(`${process.stdout.isTTY ? '\r' : ''}[${spec.id}] ${finished} games in ${hms(secs)} (${(finished / secs).toFixed(1)} games/s)\n`);
  writeSummary(spec, jsonl, summary, secs);
}

function writeSummary(spec: RunSpec, jsonl: string, summary: string, secs: number): void {
  const recs = readFileSync(jsonl, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as GameRecord);
  const reasons: Record<string, number> = {};
  let score = 0, wins = 0, draws = 0, plies = 0;
  for (const r of recs) {
    reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
    score += r.result; plies += r.plies;
    if (r.result === 1) wins++; else if (r.result === 0.5) draws++;
  }
  const n = recs.length || 1;
  writeFileSync(summary, JSON.stringify({
    spec, games: recs.length, seconds: +secs.toFixed(1),
    whiteScore: +(score / n).toFixed(4),
    whiteWins: wins, draws, blackWins: recs.length - wins - draws,
    meanPlies: +(plies / n).toFixed(1), reasons,
  }, null, 2) + '\n');
  console.log(`[${spec.id}] summary -> ${summary}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  const spec = loadSpec(process.argv.slice(2));
  const f = parseFlags(process.argv.slice(2));
  const workers = typeof f.workers === 'string' ? +f.workers : availableParallelism();
  const fail = (e: unknown): void => { console.error(e); process.exitCode = 1; };
  // Not `await`: a top-level await would make this an async module, which breaks any CJS importer.
  // The experiments are imported lazily for the same reason, and to keep the import graph acyclic.
  if (typeof f.experiment === 'string') {
    import('./experiments').then(m => m.runExperiment(f.experiment as string, spec, workers, f)).catch(fail);
  } else {
    run(spec, workers).catch(fail);
  }
}
