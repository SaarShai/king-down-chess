/** Monte Carlo runner: a worker per core, one JSON line per game, resumable. */
import { closeSync, createWriteStream, existsSync, mkdirSync, openSync, readSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { availableParallelism } from 'node:os';
import type { Worker } from 'node:worker_threads';
import { GameRecord } from './game';
import { tsWorker } from './ts-worker';
import { DEFAULT_RULES, Rules, ruleDiff, setRules } from '../rules/rules';
import { POOL } from '../rules/setup';
import { Job, OUT_DIR, RunSpec, buildJobs, loadSpec, parseFlags, paths, usePairs } from './spec';
import { sourceId, specKey } from './identity';

/**
 * Stamped on every game line: what a resume has to match. Readers ignore unknown fields.
 *
 * `rules` is the **full resolved rule set**, not a diff. A diff is read against the defaults of the
 * day, and those move, so a stored `rules: {}` does not mean today's game (LESSONS.md 2026-09-13):
 * sampling and replay have to set the exact rules a run played, and only the full set can do that.
 * `rulesKey` stays as the cheap comparison. `specKey` covers seed, pool, search/evaluation settings
 * and the eval-parameter files by content; `src` covers the engine code itself.
 */
export interface Stamp { rules: Rules; rulesKey: string; pool: string; specKey: string; src: string }

/**
 * The rules and pool a run plays under. `rulesKey` hashes the *whole* rule set, not the diff.
 * A new rule field re-keys *every* stored run and blocks its resume, so `kings` is left out of the
 * key for a run that plays none — the same "append, never move a historic key" discipline
 * `src/ai/zobrist.ts` follows. A run that does play a king hashes it, which is the whole point of
 * putting the choice in `Rules` (LESSONS.md 2026-09-14: a resumed control silently mixes pools).
 */
export function stampOf(spec: RunSpec): Stamp {
  const rules = { ...DEFAULT_RULES, ...spec.rules }; // exactly what run() puts in RULES
  // Keys added later (kings, hands) count only when set, so stamps of older runs still match.
  const { hands, ...noHands } = rules;
  const r = hands[0].length || hands[1].length ? rules : noHands;
  const { kings, ...noKings } = r;
  const keyed = kings[0] || kings[1] ? r : noKings;
  return {
    rules,
    rulesKey: createHash('sha1').update(JSON.stringify(keyed)).digest('hex').slice(0, 8),
    pool: (Array.isArray(spec.backRanks) ? undefined : spec.backRanks?.pool) ?? POOL,
    specKey: specKey(spec),
    src: sourceId(),
  };
}

/** Line-per-line read of a possibly huge JSONL file. The last call has `complete = false` on a torn line. */
function eachLine(file: string, fn: (line: string, complete: boolean) => void): void {
  const fd = openSync(file, 'r');
  try {
    const buf = Buffer.alloc(1 << 22);
    let carry = '';
    for (;;) {
      const n = readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      // The files are our own JSON (ASCII, one line per game), so a chunk boundary cannot split a
      // character; it can only split a line, and `carry` holds that.
      const text = carry + buf.toString('utf8', 0, n);
      let start = 0;
      for (;;) {
        const nl = text.indexOf('\n', start);
        if (nl < 0) { carry = text.slice(start); break; }
        fn(text.slice(start, nl), true);
        start = nl + 1;
      }
    }
    if (carry) fn(carry, false);
  } finally { closeSync(fd); }
}

export interface RunScan {
  /** game id -> the arrangement it played. */
  configs: Map<number, string>;
  stamp: Stamp | null;
  games: number;
  /** Lines that are truncated (no newline) or not a game record. */
  bad: number;
  /** Stamped and unstamped records in one file, or two different stamps. */
  mixed: boolean;
}

/** What a file already holds. The stamp is the same on every line; a file written before it existed has none. */
export function readRun(file: string): RunScan {
  const configs = new Map<number, string>();
  const keys = new Set<string>();
  let stamp: Stamp | null = null, games = 0, bad = 0, stamped = 0;
  if (!existsSync(file)) return { configs, stamp, games, bad, mixed: false };
  eachLine(file, (line, complete) => {
    if (!complete) { bad++; return; }
    if (!line) return;
    let rec: GameRecord & Partial<Stamp>;
    try { rec = JSON.parse(line) as GameRecord & Partial<Stamp>; } catch { bad++; return; }
    if (typeof rec.gameId !== 'number' || typeof rec.configId !== 'string') { bad++; return; }
    games++;
    configs.set(rec.gameId, rec.configId);
    if (rec.rulesKey) {
      stamped++;
      const s: Stamp = {
        rules: (rec.rules ?? {}) as Rules, rulesKey: rec.rulesKey, pool: rec.pool ?? '',
        specKey: rec.specKey ?? '', src: rec.src ?? '',
      };
      if (!stamp) stamp = s;
      keys.add(s.specKey || s.rulesKey);
    }
  });
  return { configs, stamp, games, bad, mixed: (stamped > 0 && stamped < games) || keys.size > 1 };
}

/** Kept for callers that only want the map: the configs and the stamp of a stored run. */
export function doneGames(file: string): { configs: Map<number, string>; stamp: Stamp | null } {
  const { configs, stamp } = readRun(file);
  return { configs, stamp };
}

/**
 * A run resumes from its JSONL by game id, so the stored games have to be the ones this spec plays
 * now. After a change to `POOL`, `DEFAULT_RULES`, the seed, the evaluation files or the source they
 * are not, and the file then holds two experiments that every reader adds up as one: `pb-ab-base`
 * was 1 544 games under the two-guard pool plus 56 under the one-guard pool, and the A/B it
 * controlled was void (LESSONS.md 2026-09-14). Throws rather than appending; returns the games to
 * skip. A file with no stamp at all is read-only history: give the run a new id instead of
 * resuming a game whose rules are unknown.
 */
export function checkResume(spec: RunSpec, jobs: Job[], file: string): Map<number, string> {
  const { configs, stamp, games, bad, mixed } = readRun(file);
  if (!games && !bad) return configs;
  const newId = 'Give the run a new id';
  if (bad) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: ${bad} line(s) are torn or unreadable (a partial write). ${newId}, or repair the file from a backup.`);
  }
  if (mixed) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: its ${games} games carry more than one stamp or a mix of stamped and unstamped records. ${newId}.`);
  }
  const distinct = (xs: Iterable<string>): number => new Set(xs).size;
  const badCfg = [...configs].find(([id, cfg]) => jobs[id]?.configId !== cfg);
  if (badCfg) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: its ${configs.size} stored games played ${distinct(configs.values())} arrangements, this spec plays ${distinct(jobs.map(j => j.configId))} over ${jobs.length} games (game ${badCfg[0]} is "${badCfg[1]}" in the file, "${jobs[badCfg[0]]?.configId ?? 'not played'}" now). ${newId}, or list \`backRanks\` in the spec to replay the stored ones.`);
  }
  if (!stamp) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: its ${games} stored games carry no rule/source stamp (written before stamping existed), so the rules they played are unknown. ${newId}.`);
  }
  const now = stampOf(spec);
  if (stamp.rulesKey !== now.rulesKey || stamp.pool !== now.pool) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: its ${games} stored games played rules ${JSON.stringify(ruleDiff(stamp.rules))} (key ${stamp.rulesKey}) on pool ${stamp.pool}, this spec plays ${JSON.stringify(ruleDiff(now.rules))} (key ${now.rulesKey}) on pool ${now.pool}. ${newId}.`);
  }
  if (stamp.specKey !== now.specKey) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: the seed, arrangements, search settings or evaluation inputs changed (stamp ${stamp.specKey}, this spec ${now.specKey}). ${newId}.`);
  }
  if (stamp.src !== now.src) {
    throw new Error(`[${spec.id}] refusing to resume ${file}: its ${games} games were played by source ${stamp.src}, this source is ${now.src}. ${newId}.`);
  }
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

  // A worker that dies (a failed import, a thrown game) must end the run: before 2026-10-02 the
  // rejection left `tick` running, so the process printed "0/2 0.0 games/s" forever.
  const workers: Worker[] = [];
  const retired = new Set<Worker>(); // terminated on purpose: their exit code means nothing
  try {
    await new Promise<void>((resolve, reject) => {
      for (let i = 0; i < Math.max(1, Math.min(nWorkers, jobs.length)); i++) {
        const w = tsWorker(new URL('./worker.ts', import.meta.url), { workerData: spec });
        w.on('message', (rec: GameRecord) => {
          out.write(JSON.stringify({ ...rec, ...stamp }) + '\n');
          finished++;
          if (next < jobs.length) w.postMessage(jobs[next++]);
          else { retired.add(w); void w.terminate(); if (finished === jobs.length) resolve(); }
        });
        w.on('error', reject);
        w.on('exit', code => { if (!retired.has(w)) reject(new Error(`[${spec.id}] a worker exited (code ${code}) with ${jobs.length - finished} games unplayed`)); });
        workers.push(w);
      }
      for (const w of workers) if (next < jobs.length) w.postMessage(jobs[next++]);
    });
  } finally {
    clearInterval(tick);
    for (const w of workers) void w.terminate();
  }
  await new Promise<void>(res => out.end(res)); // flush before writeSummary reads the file back
  const secs = (Date.now() - t0) / 1000;
  process.stdout.write(`${process.stdout.isTTY ? '\r' : ''}[${spec.id}] ${finished} games in ${hms(secs)} (${(finished / secs).toFixed(1)} games/s)\n`);
  writeSummary(spec, jsonl, summary, secs);
}

/**
 * Streamed, not `readFileSync`: the file is now on the order of a gigabyte and reading it as one
 * string throws `ERR_STRING_TOO_LONG` (>512 MB) — which is exactly how the inherited Q6 chain
 * ended with `exit 1` and a summary that still reported its 686-game prefix (BASELINE.md).
 */
function writeSummary(spec: RunSpec, jsonl: string, summary: string, secs: number): void {
  const reasons: Record<string, number> = {};
  let n = 0, score = 0, wins = 0, draws = 0, plies = 0;
  eachLine(jsonl, (line, complete) => {
    if (!complete || !line) return;
    let r: GameRecord;
    try { r = JSON.parse(line) as GameRecord; } catch { return; }
    n++;
    reasons[r.reason] = (reasons[r.reason] ?? 0) + 1;
    score += r.result; plies += r.plies;
    if (r.result === 1) wins++; else if (r.result === 0.5) draws++;
  });
  const d = n || 1;
  writeFileSync(summary, JSON.stringify({
    spec, games: n, seconds: +secs.toFixed(1),
    whiteScore: +(score / d).toFixed(4),
    whiteWins: wins, draws, blackWins: n - wins - draws,
    meanPlies: +(plies / d).toFixed(1), reasons,
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
