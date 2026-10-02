/**
 * Kings' powers round-robin (docs/RULES.md §4): every power against every other, as colour-swapped
 * pairs on shared armies and opening seeds, so a matchup's two games cancel the first-move edge and
 * every matchup plays the same positions (common random numbers). One JSON line per game.
 *
 *   tsx src/sim/tournament.ts run --id kp2-a --pairs 40 --depth 3 --workers 4 [--powers Freeze,Haste,...]
 *       [--rule freezeUses=3 ...] [--hold Freeze=60,...] [--powerPlies 2] [--mirror] [--none]
 *   tsx src/sim/tournament.ts report --id kp2-a [--id kp2-b ...]
 *
 * `--shard i/n` plays only the colour-swapped pairs with `pairId % n === i`, into
 * `<id>.shard<i>of<n>.jsonl`, so one tournament can run on several machines; `report` reads the
 * main file and every shard file of an id.
 *
 * `--none` adds a plain king as a reference entrant. `run` resumes by game id; a changed rule,
 * entrant list, seed or depth must use a new id (the header line records them and is checked).
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { availableParallelism } from 'node:os';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import type { Worker } from 'node:worker_threads';
import { KINGS, KingChoice, KingName, PowerName, Rules, parseRule, ruleDiff, setRules } from '../rules/rules';
import { randomBackRank } from '../rules/setup';
import { mulberry32 } from './rng';
import { OUT_DIR, RunSpec, parseFlags, parseRuleFlags } from './spec';
import { tsWorker } from './ts-worker';
import { type GameRecord, playGame } from './game';

export const ALL_POWERS: readonly PowerName[] = Object.values(KINGS).flat();
const KING_OF = Object.fromEntries(
  (Object.entries(KINGS) as [KingName, readonly PowerName[]][]).flatMap(([king, ps]) => ps.map(p => [p, king])),
) as Record<PowerName, KingName>;
export const choice = (p: PowerName | 'none'): KingChoice | null => (p === 'none' ? null : { king: KING_OF[p], power: p });

/**
 * A power name, `none`, or a variant of a power. `Strike~h200` plays Strike with an unspent use worth
 * 200 cp to that side's search (a calibration entrant). `Sacrifice~vbehind` plays Sacrifice under the
 * spec's rule variant `behind` (`--variant behind:sacrificeBehind=true`), so one round can screen several
 * readings of a power against the same field (a screening entrant).
 */
export type Entrant = PowerName | 'none' | `${PowerName}~h${number}` | `${PowerName}~v${string}`;
export const basePower = (e: Entrant): PowerName | 'none' => e.split('~')[0] as PowerName | 'none';
const holdOf = (e: Entrant): Partial<Record<string, number>> | undefined => {
  const m = /~h(\d+)$/.exec(e);
  return m ? { [basePower(e)]: Number(m[1]) } : undefined;
};

/**
 * The powers each power rule changes. A rule variant may set only rules of its own power, and a game
 * applies it only when the other side's power does not read that rule (rules are global to a game).
 */
export const RULE_POWERS: Partial<Record<keyof Rules, readonly PowerName[]>> = {
  freezeUses: ['Freeze'], freezeQuiet: ['Freeze'], iceWallUses: ['IceWall'], markFree: ['Freeze', 'IceWall'], markTurns: ['Freeze', 'IceWall'],
  strikeUses: ['Strike'], strikeCaptures: ['Strike'], strikeMode: ['Strike'], strikePawns: ['Strike'],
  hasteUses: ['Haste'], hasteSecond: ['Haste'], hasteCaptures: ['Haste'],
  flightUses: ['Flight'], sacrificeUses: ['Sacrifice'], sacrificeBehind: ['Sacrifice'],
  marchUses: ['March'], leapUses: ['Leap'],
  holyLightTakesPawns: ['HolyLight'], holyLightAura: ['HolyLight'], mercyCaptures: ['Mercy'], mercyAura: ['Mercy'],
  deathTouchMoves: ['DeathTouch'], darknessKeep: ['Darkness'],
};
const variantOf = (t: TournamentSpec, e: Entrant): Partial<Rules> => {
  const m = /~v(.+)$/.exec(e);
  if (!m) return {};
  const v = t.variants?.[m[1]];
  if (!v) throw new Error(`[${t.id}] entrant ${e}: no variant "${m[1]}" (--variant ${m[1]}:rule=value)`);
  return v;
};
/** Whether `a`'s rule variant would change `b`'s power in their game (then they do not meet). */
const clashes = (t: TournamentSpec, a: Entrant, b: Entrant): boolean => {
  const pb = basePower(b);
  return pb !== 'none' && Object.keys(variantOf(t, a)).some(k => RULE_POWERS[k as keyof Rules]?.includes(pb));
};
/** One game's rules: the tournament's, both sides' rule variants, and the two kings. */
export function gameRules(t: TournamentSpec, white: Entrant, black: Entrant): Partial<Rules> {
  return { ...t.rules, ...variantOf(t, white), ...variantOf(t, black), kings: [choice(basePower(white)), choice(basePower(black))] };
}

export interface TournamentSpec {
  id: string;
  entrants: Entrant[];
  /** Colour-swapped game pairs per matchup. */
  pairs: number;
  depth: number;
  seed: number;
  /** Rules for every game; `kings` is set per game. */
  rules: Partial<Rules>;
  /** Named rule variants for `Power~v<name>` entrants (each sets rules of that power only). */
  variants?: Record<string, Partial<Rules>>;
  powerHold?: Partial<Record<string, number>>;
  powerPlies?: number;
  /** Also play each entrant against itself (the matchup's colour edge, and a sanity line). */
  mirror: boolean;
  maxPlies: number;
  openingRandomPlies: number;
}

export interface TJob {
  gameId: number; pairId: number; a: Entrant; b: Entrant; white: Entrant; black: Entrant; backRank: string; seed: number;
}

/** What a tournament keeps of a game: enough to rate, to count the powers' use and to replay it. */
export interface TRecord {
  gameId: number; pairId: number; a: Entrant; b: Entrant; white: Entrant; black: Entrant;
  backRank: string; seed: number;
  /** White's score. */
  result: 1 | 0.5 | 0;
  reason: string; plies: number; ms: number;
  /** Power moves each side made (Haste counts once per turn, its pass not at all). */
  uses: [number, number];
  /** Ply of each side's first power move, or null. */
  firstUse: [number | null, number | null];
  checks: [number, number];
  lans: string[];
}

/** The schedule: every unordered matchup (and mirrors if asked), `pairs` colour-swapped pairs each. */
export function schedule(t: TournamentSpec): TJob[] {
  setRules(t.rules);
  const rng = mulberry32(t.seed);
  // Shared across matchups: pair p of every matchup plays army p with opening seed p.
  const armies = Array.from({ length: t.pairs }, () => randomBackRank(rng));
  const seeds = Array.from({ length: t.pairs }, (_, p) => (t.seed * 1_000_003 + p * 7919) >>> 0);
  const jobs: TJob[] = [];
  const e = t.entrants;
  for (let i = 0; i < e.length; i++) {
    for (let j = t.mirror ? i : i + 1; j < e.length; j++) {
      if (clashes(t, e[i], e[j]) || clashes(t, e[j], e[i])) continue;
      for (let p = 0; p < t.pairs; p++) {
        const pairId = jobs.length >> 1;
        for (const swap of [false, true]) {
          jobs.push({
            gameId: jobs.length, pairId, a: e[i], b: e[j],
            white: swap ? e[j] : e[i], black: swap ? e[i] : e[j], backRank: armies[p], seed: seeds[p],
          });
        }
      }
    }
  }
  return jobs;
}

/** The RunSpec `playGame` wants for one tournament game. */
export function gameSpec(t: TournamentSpec, job: TJob): RunSpec {
  const sides = [holdOf(job.white), holdOf(job.black)] as [Partial<Record<string, number>> | undefined, Partial<Record<string, number>> | undefined];
  return {
    id: t.id, games: 1, seed: t.seed, ai: { depth: t.depth, ...(t.powerPlies === undefined ? {} : { powerPlies: t.powerPlies }) },
    rules: gameRules(t, job.white, job.black),
    ...(t.powerHold ? { powerHold: t.powerHold } : {}),
    ...(sides[0] || sides[1] ? { powerHoldSides: sides } : {}),
    maxPlies: t.maxPlies, openingRandomPlies: t.openingRandomPlies,
  };
}

/** Squeeze a full `GameRecord` into a `TRecord`. */
export function compress(job: TJob, rec: GameRecord): TRecord {
  const uses: [number, number] = [0, 0];
  const firstUse: [number | null, number | null] = [null, null];
  rec.moves.forEach((m, i) => {
    // The side of ply i is not i % 2 after a Haste turn: `by` says who moved.
    const by = m.by ?? ((i & 1) as 0 | 1);
    // A power move's notation carries its tag (`!F:`, `!W:`, `!S:`, `!H`, `!M`, `!L`, a Strike's
    // trailing `!`, a Flight's `~`); a Haste pass (`--`) is not a use.
    if (/![FWSHML]|!$|~/.test(m.lan)) {
      uses[by]++;
      if (firstUse[by] === null) firstUse[by] = i;
    }
  });
  return {
    gameId: job.gameId, pairId: job.pairId, a: job.a, b: job.b, white: job.white, black: job.black,
    backRank: job.backRank, seed: job.seed, result: rec.result, reason: rec.reason, plies: rec.plies, ms: rec.ms,
    uses, firstUse, checks: rec.events.checks, lans: rec.moves.map(m => m.lan),
  };
}

export interface Shard { i: number; n: number }
const files = (id: string, shard?: Shard) => ({
  jsonl: `${OUT_DIR}/${id}${shard ? `.shard${shard.i}of${shard.n}` : ''}.jsonl`, spec: `${OUT_DIR}/${id}.tournament.json`,
});

/** Every game of a tournament: its main file and any shard files, each game once. */
export function readRecords(id: string): TRecord[] {
  const paths = [files(id).jsonl, ...readdirSync(OUT_DIR).filter(f => f.startsWith(`${id}.shard`) && f.endsWith('.jsonl')).map(f => `${OUT_DIR}/${f}`)];
  const seen = new Map<number, TRecord>();
  for (const path of paths) {
    if (!existsSync(path)) continue;
    for (const l of readFileSync(path, 'utf8').split('\n')) if (l) { const r = JSON.parse(l) as TRecord; seen.set(r.gameId, r); }
  }
  return [...seen.values()].sort((a, b) => a.gameId - b.gameId);
}

export async function runTournament(t: TournamentSpec, nWorkers: number, shard?: Shard): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const f = files(t.id, shard);
  if (existsSync(f.spec)) {
    const old = JSON.parse(readFileSync(f.spec, 'utf8')) as TournamentSpec;
    if (JSON.stringify(old) !== JSON.stringify(t)) throw new Error(`[${t.id}] ${f.spec} holds a different tournament; give this one a new id`);
  } else writeFileSync(f.spec, JSON.stringify(t, null, 2) + '\n');
  const all = schedule(t).filter(j => !shard || j.pairId % shard.n === shard.i);
  const done = new Set(readRecords(t.id).map(r => r.gameId));
  const jobs = all.filter(j => !done.has(j.gameId));
  console.log(`[${t.id}] ${t.entrants.length} entrants, ${all.length} games (${done.size} done), depth ${t.depth}, ${nWorkers} workers`);
  console.log(`[${t.id}] rules ${JSON.stringify(ruleDiff(t.rules))}${t.powerHold ? `, hold ${JSON.stringify(t.powerHold)}` : ''}${t.powerPlies !== undefined ? `, powerPlies ${t.powerPlies}` : ''}`);
  if (!jobs.length) return;
  const out = createWriteStream(f.jsonl, { flags: 'a' });
  const t0 = Date.now();
  let next = 0, finished = 0;
  const tick = setInterval(() => {
    const s = (Date.now() - t0) / 1000, rate = finished / s;
    console.log(`[${t.id}] ${finished}/${jobs.length}  ${rate.toFixed(2)} games/s  ETA ${Math.round((jobs.length - finished) / rate / 60)} min`);
  }, 30_000);
  const workers: Worker[] = [];
  const retired = new Set<Worker>();
  try {
    await new Promise<void>((resolve, reject) => {
      for (let i = 0; i < Math.max(1, Math.min(nWorkers, jobs.length)); i++) {
        const w = tsWorker(new URL(import.meta.url), { workerData: { role: 'tournament', t } });
        w.on('message', (rec: TRecord) => {
          out.write(JSON.stringify(rec) + '\n');
          finished++;
          if (next < jobs.length) w.postMessage(jobs[next++]);
          else { retired.add(w); void w.terminate(); if (finished === jobs.length) resolve(); }
        });
        w.on('error', reject);
        w.on('exit', code => { if (!retired.has(w)) reject(new Error(`[${t.id}] a worker exited (code ${code}) with ${jobs.length - finished} games unplayed`)); });
        workers.push(w);
      }
      for (const w of workers) if (next < jobs.length) w.postMessage(jobs[next++]);
    });
  } finally {
    clearInterval(tick);
    for (const w of workers) void w.terminate();
    await new Promise<void>(res => out.end(res));
  }
  console.log(`[${t.id}] ${finished} games in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}

if (!isMainThread && (workerData as { role?: string } | null)?.role === 'tournament') {
  const t = (workerData as { t: TournamentSpec }).t;
  parentPort!.on('message', (job: TJob) => {
    const rec = playGame(gameSpec(t, job), {
      gameId: job.gameId, pairId: job.pairId, colourSwapped: false, configId: job.backRank,
      seed: job.seed, backRankWhite: job.backRank, backRankBlack: job.backRank,
    });
    parentPort!.postMessage(compress(job, rec));
  });
}

// ---------------------------------------------------------------------------------------------
// Ratings.

export interface Rating { entrant: Entrant; elo: number; se: number; score: number; scoreSe: number; games: number }
export interface Pairwise { a: Entrant; b: Entrant; score: number; se: number; pairs: number }

/**
 * Bradley–Terry with a first-move term, fitted by Newton's method on the game scores (a draw is half
 * a win): P(white scores) = σ(r_white − r_black + w). Ratings sum to zero; Elo = r · 400 / ln 10.
 * Standard errors come from the inverse Fisher information.
 */
export function rate(recs: readonly TRecord[], entrants: readonly Entrant[]): { ratings: Rating[]; white: number; whiteSe: number } {
  const idx = new Map(entrants.map((e, i) => [e, i]));
  const n = entrants.length;
  // Parameters: r_0 … r_{n-2} (r_{n-1} = −Σ), then w.
  const k = n; // n-1 ratings + w
  const theta = new Float64Array(k);
  const rOf = (th: Float64Array, i: number): number => (i < n - 1 ? th[i] : -th.slice(0, n - 1).reduce((a, b) => a + b, 0));
  // d r_i / d theta_j
  const dr = (i: number, j: number): number => (i < n - 1 ? (i === j ? 1 : 0) : -1);
  const games = recs.filter(r => idx.has(r.white) && idx.has(r.black));
  let H = new Float64Array(k * k);
  for (let iter = 0; iter < 50; iter++) {
    const g = new Float64Array(k);
    H = new Float64Array(k * k);
    for (const r of games) {
      const wi = idx.get(r.white)!, bi = idx.get(r.black)!;
      const x = rOf(theta, wi) - rOf(theta, bi) + theta[k - 1];
      const p = 1 / (1 + Math.exp(-x));
      const resid = r.result - p, v = p * (1 - p);
      const grad = new Float64Array(k);
      for (let j = 0; j < n - 1; j++) grad[j] = dr(wi, j) - dr(bi, j);
      grad[k - 1] = 1;
      for (let a = 0; a < k; a++) {
        g[a] += resid * grad[a];
        for (let b = 0; b < k; b++) H[a * k + b] += v * grad[a] * grad[b];
      }
    }
    const step = solve(H, g, k);
    for (let i = 0; i < k; i++) theta[i] += step[i];
    if (Math.max(...step.map(Math.abs)) < 1e-9) break;
  }
  const cov = invert(H, k);
  const elo = 400 / Math.LN10;
  const ratings: Rating[] = entrants.map((e, i) => {
    // Var(r_i): for the last entrant, the variance of −Σ.
    let v = 0;
    for (let a = 0; a < n - 1; a++) for (let b = 0; b < n - 1; b++) v += dr(i, a) * dr(i, b) * cov[a * k + b];
    const mine = games.filter(r => (r.white === e) !== (r.black === e)); // mirrors say nothing about the field
    // Score vs the field from this entrant's side, and its standard error over colour-swapped pairs.
    const byPair = new Map<number, number[]>();
    for (const r of mine) {
      const s = r.white === e ? r.result : 1 - r.result;
      const list = byPair.get(r.pairId) ?? [];
      list.push(s);
      byPair.set(r.pairId, list);
    }
    const pairMeans = [...byPair.values()].map(l => l.reduce((a, b) => a + b, 0) / l.length);
    const m = pairMeans.reduce((a, b) => a + b, 0) / Math.max(1, pairMeans.length);
    const sd = Math.sqrt(pairMeans.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, pairMeans.length - 1));
    return {
      entrant: e, elo: rOf(theta, i) * elo, se: Math.sqrt(Math.max(0, v)) * elo,
      score: m, scoreSe: sd / Math.sqrt(Math.max(1, pairMeans.length)), games: mine.length,
    };
  });
  return { ratings, white: theta[k - 1] * elo, whiteSe: Math.sqrt(cov[(k - 1) * k + (k - 1)]) * elo };
}

/** Each matchup's score for its first-named entrant, over colour-swapped pairs. */
export function pairwise(recs: readonly TRecord[]): Pairwise[] {
  const groups = new Map<string, TRecord[]>();
  for (const r of recs) {
    if (r.a === r.b) continue;
    const key = `${r.a}|${r.b}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
  }
  const out: Pairwise[] = [];
  for (const [key, list] of groups) {
    const [a, b] = key.split('|') as [Entrant, Entrant];
    const byPair = new Map<number, number[]>();
    for (const r of list) {
      const s = r.white === a ? r.result : 1 - r.result;
      (byPair.get(r.pairId) ?? byPair.set(r.pairId, []).get(r.pairId)!).push(s);
    }
    const means = [...byPair.values()].map(l => l.reduce((x, y) => x + y, 0) / l.length);
    const m = means.reduce((x, y) => x + y, 0) / means.length;
    const sd = Math.sqrt(means.reduce((x, y) => x + (y - m) ** 2, 0) / Math.max(1, means.length - 1));
    out.push({ a, b, score: m, se: sd / Math.sqrt(means.length), pairs: means.length });
  }
  return out;
}

function solve(H: Float64Array, g: Float64Array, k: number): Float64Array {
  const inv = invert(H, k);
  const out = new Float64Array(k);
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) out[i] += inv[i * k + j] * g[j];
  return out;
}

/** Gauss–Jordan inverse with a tiny ridge, enough for these small, well-posed systems. */
function invert(M: Float64Array, k: number): Float64Array {
  const a = new Float64Array(k * 2 * k);
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) a[i * 2 * k + j] = M[i * k + j] + (i === j ? 1e-9 : 0);
    a[i * 2 * k + k + i] = 1;
  }
  for (let c = 0; c < k; c++) {
    let p = c;
    for (let r = c + 1; r < k; r++) if (Math.abs(a[r * 2 * k + c]) > Math.abs(a[p * 2 * k + c])) p = r;
    if (p !== c) for (let j = 0; j < 2 * k; j++) { const t = a[c * 2 * k + j]; a[c * 2 * k + j] = a[p * 2 * k + j]; a[p * 2 * k + j] = t; }
    const d = a[c * 2 * k + c];
    for (let j = 0; j < 2 * k; j++) a[c * 2 * k + j] /= d;
    for (let r = 0; r < k; r++) {
      if (r === c) continue;
      const f = a[r * 2 * k + c];
      if (f) for (let j = 0; j < 2 * k; j++) a[r * 2 * k + j] -= f * a[c * 2 * k + j];
    }
  }
  const out = new Float64Array(k * k);
  for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) out[i * k + j] = a[i * 2 * k + k + j];
  return out;
}

// ---------------------------------------------------------------------------------------------
// Report.

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`;

/** `e`'s score over colour-swapped pairs against the powers only (the plain king left out), ± its standard error. */
function scoreVsPowers(recs: readonly TRecord[], e: Entrant): { m: number; se: number; n: number } {
  const byPair = new Map<number, number[]>();
  for (const r of recs) {
    if ((r.white === e) === (r.black === e) || basePower(r.white === e ? r.black : r.white) === 'none') continue;
    (byPair.get(r.pairId) ?? byPair.set(r.pairId, []).get(r.pairId)!).push(r.white === e ? r.result : 1 - r.result);
  }
  const means = [...byPair.values()].map(l => l.reduce((a, b) => a + b, 0) / l.length);
  const m = means.reduce((a, b) => a + b, 0) / Math.max(1, means.length);
  const sd = Math.sqrt(means.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, means.length - 1));
  return { m, se: sd / Math.sqrt(Math.max(1, means.length)), n: means.length };
}

export function report(ids: readonly string[]): string {
  const specs = ids.map(id => JSON.parse(readFileSync(files(id).spec, 'utf8')) as TournamentSpec);
  const recs = ids.flatMap(readRecords);
  const entrants = [...new Set(specs.flatMap(s => s.entrants))];
  const { ratings, white, whiteSe } = rate(recs, entrants);
  ratings.sort((x, y) => y.elo - x.elo);
  const lines: string[] = [];
  lines.push(`# Kings' powers tournament: ${ids.join(' + ')}`, '');
  lines.push(`${recs.length} games, depth ${[...new Set(specs.map(s => s.depth))].join('/')}, ${entrants.length} entrants. Rules: \`${JSON.stringify(ruleDiff(specs[0].rules))}\`${specs[0].powerHold ? `, hold \`${JSON.stringify(specs[0].powerHold)}\`` : ''}.`, '');
  const variants = Object.assign({}, ...specs.map(s => s.variants ?? {})) as Record<string, Partial<Rules>>;
  if (Object.keys(variants).length) lines.push(`Variants: ${Object.entries(variants).map(([k, v]) => `\`~v${k}\` = \`${JSON.stringify(v)}\``).join(', ')}. A variant does not meet an entrant whose power its rules would change.`, '');
  lines.push(`First move: White ${white >= 0 ? '+' : ''}${white.toFixed(0)} ± ${(1.96 * whiteSe).toFixed(0)} Elo.`, '');
  lines.push('| power | Elo (BT) | ±95% | score vs field | ±95% | vs powers | ±95% | games | used / game | games used | first use (ply, median) | decisive | draws | plies |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  const vs = new Map(ratings.map(r => [r.entrant, scoreVsPowers(recs, r.entrant)]));
  for (const r of ratings) {
    const mine = recs.filter(g => g.white === r.entrant || g.black === r.entrant);
    let uses = 0, usedGames = 0;
    const first: number[] = [];
    for (const g of mine) {
      const sides = ([0, 1] as const).filter(c => (c === 0 ? g.white : g.black) === r.entrant);
      for (const c of sides) {
        uses += g.uses[c];
        if (g.uses[c] > 0) usedGames++;
        if (g.firstUse[c] !== null) first.push(g.firstUse[c]!);
      }
    }
    const sides = mine.reduce((a, g) => a + (g.white === r.entrant ? 1 : 0) + (g.black === r.entrant ? 1 : 0), 0);
    first.sort((a, b) => a - b);
    const decisive = mine.filter(g => g.result !== 0.5).length / Math.max(1, mine.length);
    const plies = mine.reduce((a, g) => a + g.plies, 0) / Math.max(1, mine.length);
    const v = vs.get(r.entrant)!;
    lines.push(`| ${r.entrant} | ${r.elo >= 0 ? '+' : ''}${r.elo.toFixed(0)} | ${(1.96 * r.se).toFixed(0)} | ${pct(r.score)} | ${(196 * r.scoreSe).toFixed(1)} | ${pct(v.m)} | ${(196 * v.se).toFixed(1)} | ${r.games} | ${(uses / Math.max(1, sides)).toFixed(2)} | ${pct(usedGames / Math.max(1, sides))} | ${first.length ? first[first.length >> 1] : '-'} | ${pct(decisive)} | ${pct(1 - decisive)} | ${plies.toFixed(0)} |`);
  }
  // The balance target: every power's score against the other powers inside 50 ± 4 points.
  const powers = ratings.filter(r => basePower(r.entrant) !== 'none').map(r => ({ e: r.entrant, ...vs.get(r.entrant)! }));
  const inside = powers.filter(p => Math.abs(p.m - 0.5) <= 0.04);
  const spread = Math.max(...powers.map(p => p.m)) - Math.min(...powers.map(p => p.m));
  lines.push('', `Against the other powers: ${inside.length} of ${powers.length} inside 50 ± 4 points; spread ${(100 * spread).toFixed(1)} points.${powers.length - inside.length ? ` Outside: ${powers.filter(p => Math.abs(p.m - 0.5) > 0.04).map(p => `${p.e} ${pct(p.m)}`).join(', ')}.` : ''}`);
  const pw = pairwise(recs);
  lines.push('', '## Matchups (row power\'s score against the column power)', '');
  const order = ratings.map(r => r.entrant);
  lines.push(`| | ${order.join(' | ')} |`);
  lines.push(`|---|${order.map(() => '---').join('|')}|`);
  for (const a of order) {
    const cells = order.map(b => {
      if (a === b) return '—';
      const hit = pw.find(p => p.a === a && p.b === b) ?? pw.find(p => p.a === b && p.b === a);
      if (!hit) return '';
      const s = hit.a === a ? hit.score : 1 - hit.score;
      return `${Math.round(100 * s)}`;
    });
    lines.push(`| **${a}** | ${cells.join(' | ')} |`);
  }
  const reasons = new Map<string, number>();
  for (const g of recs) reasons.set(g.reason, (reasons.get(g.reason) ?? 0) + 1);
  lines.push('', `Endings: ${[...reasons].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v / recs.length)}`).join(', ')}.`);
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------------------------

function parseEntrants(text: string | true | undefined, none: boolean): Entrant[] {
  const list = typeof text === 'string' ? text.split(',').map(s => s.trim()).filter(Boolean) : [...ALL_POWERS];
  const out = list.map((s): Entrant => {
    if (s === 'none') return 'none';
    const [name, variant] = s.split('~');
    const p = ALL_POWERS.find(x => x.toLowerCase() === name.toLowerCase());
    if (!p) throw new Error(`unknown power "${s}" (${ALL_POWERS.join(', ')}, none; variants are Power~h120 and Power~v<name>)`);
    if (variant !== undefined && !/^(h\d+|v\w+)$/.test(variant)) throw new Error(`bad variant "${s}" (Power~h120 or Power~v<name>)`);
    return (variant ? `${p}~${variant}` : p) as Entrant;
  });
  if (none && !out.includes('none')) out.push('none');
  return out;
}

/**
 * `--variant behind:sacrificeBehind=true,sacrificeUses=2` (repeatable). Every rule of a variant must
 * belong to the power of each entrant that names it.
 */
function parseVariants(argv: readonly string[], entrants: readonly Entrant[]): Record<string, Partial<Rules>> | undefined {
  const out: Record<string, Partial<Rules>> = {};
  for (let i = 0; i < argv.length; i++) {
    const text = argv[i] === '--variant' ? argv[++i] : argv[i].startsWith('--variant=') ? argv[i].slice(10) : undefined;
    if (text === undefined) continue;
    const [name, body = ''] = text.split(':');
    out[name] = Object.assign({}, ...body.split(',').filter(Boolean).map(parseRule));
  }
  for (const e of entrants) {
    const m = /~v(.+)$/.exec(e);
    if (!m) continue;
    const v = out[m[1]];
    if (!v) throw new Error(`entrant ${e}: no --variant ${m[1]}:rule=value`);
    for (const k of Object.keys(v)) {
      if (!RULE_POWERS[k as keyof Rules]?.includes(basePower(e) as PowerName)) throw new Error(`variant ${m[1]}: rule ${k} is not a rule of ${basePower(e)}`);
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function parseHold(text: string | true | undefined): Partial<Record<string, number>> | undefined {
  if (typeof text !== 'string') return undefined;
  return Object.fromEntries(text.split(',').map(kv => { const [k2, v] = kv.split('='); return [k2, Number(v)]; }));
}

if (isMainThread && process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  const argv = process.argv.slice(2);
  const cmd = argv[0] && !argv[0].startsWith('--') ? argv[0] : 'run';
  const f = parseFlags(argv);
  const num = (k2: string, d: number): number => (typeof f[k2] === 'string' ? Number(f[k2]) : d);
  const fail = (e: unknown): void => { console.error(e); process.exitCode = 1; };
  if (cmd === 'report') {
    const ids = argv.flatMap((a, i) => (a === '--id' ? [argv[i + 1]] : a.startsWith('--id=') ? [a.slice(5)] : []));
    const text = report(ids);
    writeFileSync(`${OUT_DIR}/${ids.join('+')}.report.md`, text);
    console.log(text);
  } else {
    const entrants = parseEntrants(f.powers, !!f.none);
    const variants = parseVariants(argv, entrants);
    const t: TournamentSpec = {
      id: typeof f.id === 'string' ? f.id : 'kp2',
      entrants,
      pairs: num('pairs', 20), depth: num('depth', 3), seed: num('seed', 101),
      rules: parseRuleFlags(argv),
      ...(variants ? { variants } : {}),
      ...(parseHold(f.hold) ? { powerHold: parseHold(f.hold) } : {}),
      ...(typeof f.powerPlies === 'string' ? { powerPlies: Number(f.powerPlies) } : {}),
      mirror: !!f.mirror, maxPlies: num('maxPlies', 300), openingRandomPlies: num('openingRandomPlies', 4),
    };
    const shard = typeof f.shard === 'string' ? (([i, n]) => ({ i: +i, n: +n }))(f.shard.split('/')) : undefined;
    runTournament(t, num('workers', availableParallelism()), shard).catch(fail);
  }
}
