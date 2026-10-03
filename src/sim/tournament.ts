/**
 * Kings' powers round-robin (docs/RULES.md §4): every power against every other, as colour-swapped
 * pairs on one army and opening seed each, so a pair's two games cancel the first-move edge. One
 * JSON line per game.
 *
 * Armies: by default pair p of every matchup plays army p (12 pairs = 12 armies for the whole round).
 * A power's strength depends on the army, so such a round measures only the armies it drew
 * (LESSONS.md 2026-10-03). `--armies perPair` draws a fresh army and opening for every pair instead.
 * `report` gives intervals that resample the armies next to the per-game ones.
 *
 *   tsx src/sim/tournament.ts run --id kp2-a --pairs 40 --depth 3 --workers 4 [--powers Freeze,Haste,...]
 *       [--rule freezeUses=3 ...] [--hold Freeze=60,...] [--powerPlies 2] [--mirror] [--none] [--armies perPair]
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
export type Entrant = PowerName | 'none' | `${PowerName}~h${number}` | `${PowerName}~v${string}` | `cards${number}`;
/** A `cards<k>` entrant (card mode) plays a plain king: its powers are its hand. */
export const basePower = (e: Entrant): PowerName | 'none' => (e.startsWith('cards') ? 'none' : e.split('~')[0] as PowerName | 'none');
/** The one-use powers card mode deals from, unless a spec names its own `cardPool`. */
export const CARD_POOL: readonly PowerName[] = ['Freeze', 'IceWall', 'Strike', 'Haste', 'Flight', 'Sacrifice', 'March', 'Leap'];
/**
 * A `cards<k>` entrant's hand in one game: the first k cards of the pool shuffled by the pair's own
 * opening seed. So `cards3` holds the first half of the same pair's `cards6`, both sides of a mirror
 * hold the same hand, and every entrant of a `perPair` round sees the same hands on the same army.
 */
export function handFor(t: TournamentSpec, e: Entrant, seed: number): PowerName[] {
  if (!e.startsWith('cards')) return [];
  const pool = [...(t.cardPool ?? CARD_POOL)], rng = mulberry32(seed ^ 0x5bd1e995);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  return pool.slice(0, Number(e.slice(5)));
}
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
  holyLightTakesPawns: ['HolyLight'], holyLightAura: ['HolyLight'], holyLightKnights: ['HolyLight'], holyLightShelter: ['HolyLight'], holyLightShelterOrtho: ['HolyLight'], mercyCaptures: ['Mercy'], mercyAura: ['Mercy'], mercyAuraOrtho: ['Mercy'], mercyAuraPawns: ['Mercy'],
  deathTouchMoves: ['DeathTouch'], deathTouchReach: ['DeathTouch'], deathTouchReachOrtho: ['DeathTouch'], darknessKeep: ['Darkness'], darknessMoves: ['Darkness'], darknessTakeAhead: ['Darkness'], darknessStepDiag: ['Darkness'],
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
  /**
   * `perPair`: every pair draws its own army and opening seed (`pairDraw`). Absent: pair p of every
   * matchup plays army p (rounds 1–12).
   */
  armies?: 'perPair';
  /**
   * Play only the matchups against this entrant (a star, not a round-robin), plus its mirror with
   * `mirror`: each entrant's value against a reference, e.g. a one-use power (a card) against a plain
   * king. Absent: every matchup.
   */
  anchor?: Entrant;
  /** Play only each entrant against itself (with `mirror`): for `cards<k>`, both sides with the same hand. */
  mirrorOnly?: boolean;
  /** Card mode: the cards `cards<k>` entrants are dealt from (default `CARD_POOL`). */
  cardPool?: PowerName[];
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

/**
 * Pair p's army and opening seed under `--armies perPair`. They depend only on the seed, p and the
 * two base powers (under the round's rules, which `schedule` sets first), so adding or removing an
 * entrant changes no other matchup's games, and a variant (`Haste~vtrim`) plays the same armies as
 * its base power against each opponent.
 */
export function pairDraw(seed: number, a: Entrant, b: Entrant, p: number): { backRank: string; seed: number } {
  // FNV-1a of the key, then mulberry32 from that hash.
  let h = 0x811c9dc5;
  for (const c of `${seed}|${[basePower(a), basePower(b)].sort().join('|')}|${p}`) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
  const rng = mulberry32(h);
  const backRank = randomBackRank(rng);
  return { backRank, seed: Math.floor(rng() * 2 ** 32) };
}

/** The schedule: every unordered matchup (and mirrors if asked), `pairs` colour-swapped pairs each. */
export function schedule(t: TournamentSpec): TJob[] {
  setRules(t.rules);
  const rng = mulberry32(t.seed);
  // Shared across matchups unless `armies` is `perPair`: pair p of every matchup plays army p with opening seed p.
  const armies = Array.from({ length: t.pairs }, () => randomBackRank(rng));
  const seeds = Array.from({ length: t.pairs }, (_, p) => (t.seed * 1_000_003 + p * 7919) >>> 0);
  const jobs: TJob[] = [];
  const e = t.entrants;
  let pairs = 0;
  for (let i = 0; i < e.length; i++) {
    for (let j = t.mirror ? i : i + 1; j < e.length; j++) {
      if (clashes(t, e[i], e[j]) || clashes(t, e[j], e[i])) continue;
      if (t.anchor !== undefined && e[i] !== t.anchor && e[j] !== t.anchor) continue;
      if (t.mirrorOnly && i !== j) continue;
      for (let p = 0; p < t.pairs; p++) {
        const pairId = pairs++;
        const draw = t.armies === 'perPair' ? pairDraw(t.seed, e[i], e[j], p) : { backRank: armies[p], seed: seeds[p] };
        // A mirror's colour swap replays the same game exactly, so a mirror-only round plays it once.
        for (const swap of t.mirrorOnly ? [false] : [false, true]) {
          jobs.push({
            gameId: jobs.length, pairId, a: e[i], b: e[j],
            white: swap ? e[j] : e[i], black: swap ? e[i] : e[j], ...draw,
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
    rules: { ...gameRules(t, job.white, job.black), ...(job.white.startsWith('cards') || job.black.startsWith('cards') ? { hands: [handFor(t, job.white, job.seed), handFor(t, job.black, job.seed)] } : {}) },
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
  const sched = schedule(t), recorded = readRecords(t.id);
  checkResume(t, sched, recorded);
  const all = sched.filter(j => !shard || j.pairId % shard.n === shard.i);
  const done = new Set(recorded.map(r => r.gameId));
  const jobs = all.filter(j => !done.has(j.gameId));
  console.log(`[${t.id}] ${t.entrants.length} entrants, ${all.length} games (${done.size} done), depth ${t.depth}, armies ${t.armies ?? 'shared'}, ${nWorkers} workers`);
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
export function scoreVsPowers(recs: readonly TRecord[], e: Entrant): { m: number; se: number; n: number } {
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

/** The random draw a game played on: its army and opening seed. Games on one draw are not independent. */
export const drawOf = (r: Pick<TRecord, 'backRank' | 'seed'>): string => `${r.backRank}|${r.seed}`;

export interface ArmyResample {
  /** Distinct draws (armies with their opening seeds) in the records. */
  draws: number;
  /** Each entrant's score over all its games (games-weighted), `NaN` with no games. */
  m: Map<Entrant, number>;
  /** Each entrant's score in each resample, `NaN` where it played none of the drawn armies. */
  samples: Map<Entrant, Float64Array>;
}

/**
 * Bootstrap over armies: `B` resamples of the draws with replacement, and each entrant's score over
 * the games on the drawn armies. Mirror games are left out, and with `vsPowers` the games against
 * the plain king too (as in `scoreVsPowers`). A plain bootstrap underestimates the variance with few
 * draws, so each resample's distance from `m` is scaled by √(G/(G−1)); the tails are `halfWidth`'s
 * job. Fixed seed, so a report reads the same each time.
 */
export function resampleArmies(recs: readonly TRecord[], entrants: readonly Entrant[], vsPowers: boolean, B = 10_000, seed = 7): ArmyResample {
  const idx = new Map(entrants.map((e, i) => [e, i]));
  const n = entrants.length;
  const byDraw = new Map<string, Map<number, [number, number]>>(); // per draw: entrant -> [score, games]
  for (const r of recs) {
    if (r.white === r.black) continue;
    const d = drawOf(r);
    const cell = byDraw.get(d) ?? byDraw.set(d, new Map()).get(d)!;
    for (const [e, other, s] of [[r.white, r.black, r.result], [r.black, r.white, 1 - r.result]] as const) {
      const i = idx.get(e);
      if (i === undefined || (vsPowers && basePower(other) === 'none')) continue;
      const v = cell.get(i) ?? cell.set(i, [0, 0]).get(i)!;
      v[0] += s;
      v[1]++;
    }
  }
  // Sparse cells: a perPair draw holds the games of one matchup, so two entrants.
  const cells = [...byDraw.values()].map(c => ({ i: Int32Array.from(c.keys()), s: Float64Array.from(c.values(), v => v[0]), k: Float64Array.from(c.values(), v => v[1]) }));
  const S = new Float64Array(n), K = new Float64Array(n);
  for (const c of cells) for (let j = 0; j < c.i.length; j++) { S[c.i[j]] += c.s[j]; K[c.i[j]] += c.k[j]; }
  const m = new Map(entrants.map((e, i) => [e, K[i] ? S[i] / K[i] : NaN]));
  const G = cells.length, f = G > 1 ? Math.sqrt(G / (G - 1)) : 1;
  const samples = new Map(entrants.map(e => [e, new Float64Array(B)]));
  const rng = mulberry32(seed);
  const sum = new Float64Array(n), cnt = new Float64Array(n);
  for (let b = 0; b < B; b++) {
    sum.fill(0);
    cnt.fill(0);
    for (let g = 0; g < G; g++) {
      const c = cells[Math.floor(rng() * G)];
      for (let j = 0; j < c.i.length; j++) { sum[c.i[j]] += c.s[j]; cnt[c.i[j]] += c.k[j]; }
    }
    entrants.forEach((e, i) => { samples.get(e)![b] = cnt[i] ? m.get(e)! + f * (sum[i] / cnt[i] - m.get(e)!) : NaN; });
  }
  return { draws: G, m, samples };
}

/**
 * The quantile of Student's t with `nu` degrees of freedom that has the tail of the normal quantile
 * `z` (Abramowitz & Stegun 26.7.5; within 0.003 of the exact value for nu >= 9 up to z = 3.5).
 */
export function tFromZ(z: number, nu: number): number {
  const z2 = z * z;
  const g = [
    (z2 + 1) * z / 4,
    ((5 * z2 + 16) * z2 + 3) * z / 96,
    (((3 * z2 + 19) * z2 + 17) * z2 - 15) * z / 384,
    ((((79 * z2 + 776) * z2 + 1482) * z2 - 1920) * z2 - 945) * z / 92160,
  ];
  return z + g.reduce((acc, gi, i) => acc + gi / nu ** (i + 1), 0);
}

const sdOf = (sample: ArrayLike<number>): number => {
  const s = Array.from(sample).filter(x => !Number.isNaN(x));
  const mean = s.reduce((a, b) => a + b, 0) / s.length;
  return Math.sqrt(s.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, s.length - 1));
};

/**
 * Half the width of a 95% interval from a resampled score: t with G − 1 degrees of freedom times its
 * spread. A mean over few armies has heavier tails than a normal curve (12 armies: 1.96 standard
 * errors cover 92%, 2.20 cover 95%); with hundreds of armies this is the usual 1.96.
 */
export const halfWidth = (a: ArmyResample, sample: ArrayLike<number>): number => tFromZ(1.96, Math.max(1, a.draws - 1)) * sdOf(sample);

/**
 * Which powers are off 50% once all of them are tested together: a simultaneous 95% band from the
 * same resamples (the 95th percentile of each resample's largest |score − m| / sd over the powers,
 * moved onto the t scale of G − 1 degrees of freedom like `halfWidth`). Twelve separate 95% intervals
 * would flag a power by chance in about half of all rounds where every power is level; this band
 * does so in about one round in twenty (slightly more with few armies, as each sd is estimated).
 */
export function simultaneous(a: ArmyResample, powers: readonly Entrant[]): { c: number; band: Map<Entrant, number> } {
  const ps = powers.filter(e => !Number.isNaN(a.m.get(e)!));
  const sd = new Map(ps.map(e => [e, sdOf(a.samples.get(e)!)]));
  const B = ps.length ? a.samples.get(ps[0])!.length : 0;
  const maxima: number[] = [];
  for (let b = 0; b < B; b++) {
    let worst = 0;
    for (const e of ps) {
      const x = a.samples.get(e)![b];
      if (!Number.isNaN(x) && sd.get(e)! > 0) worst = Math.max(worst, Math.abs(x - a.m.get(e)!) / sd.get(e)!);
    }
    maxima.push(worst);
  }
  maxima.sort((x, y) => x - y);
  const c = maxima.length ? tFromZ(maxima[Math.floor(0.95 * maxima.length)], Math.max(1, a.draws - 1)) : NaN;
  return { c, band: new Map(ps.map(e => [e, c * sd.get(e)!])) };
}

/** A resume must find every recorded game where this code schedules it; otherwise the schedule changed under the run. */
export function checkResume(t: TournamentSpec, jobs: readonly TJob[], recs: readonly TRecord[]): void {
  for (const r of recs) {
    const j = jobs[r.gameId];
    if (!j || j.white !== r.white || j.black !== r.black || j.backRank !== r.backRank || j.seed !== r.seed) {
      throw new Error(`[${t.id}] game ${r.gameId} was played as ${r.white}-${r.black} on ${drawOf(r)}, but this code schedules ${j ? `${j.white}-${j.black} on ${drawOf(j)}` : 'no such game'}; the schedule changed, so give the run a new id`);
    }
  }
}

/** Several rounds' games as one list. pairIds restart at 0 in every round, so each round's are offset: otherwise pooled rounds would merge unrelated pairs. */
export const poolRounds = (rounds: readonly (readonly TRecord[])[]): TRecord[] =>
  rounds.flatMap((rs, k) => rs.map(r => ({ ...r, pairId: k * 10_000_000 + r.pairId })));

export function report(ids: readonly string[]): string {
  return reportText(ids.map(id => JSON.parse(readFileSync(files(id).spec, 'utf8')) as TournamentSpec), ids.map(readRecords));
}

/** The report of one or more rounds: `rounds[k]` holds the games of `specs[k]`. */
export function reportText(specs: readonly TournamentSpec[], rounds: readonly (readonly TRecord[])[]): string {
  const ids = specs.map(s => s.id);
  const recs = poolRounds(rounds);
  const scheduled = specs.reduce((a, s) => a + schedule(s).length, 0);
  const entrants = [...new Set(specs.flatMap(s => s.entrants))];
  const { ratings, white, whiteSe } = rate(recs, entrants);
  ratings.sort((x, y) => y.elo - x.elo);
  const lines: string[] = [];
  lines.push(`# Kings' powers tournament: ${ids.join(' + ')}`, '');
  lines.push(`${recs.length} of ${scheduled} games, depth ${[...new Set(specs.map(s => s.depth))].join('/')}, ${entrants.length} entrants. Rules: \`${JSON.stringify(ruleDiff(specs[0].rules))}\`${specs[0].powerHold ? `, hold \`${JSON.stringify(specs[0].powerHold)}\`` : ''}.`, '');
  if (recs.length < scheduled) lines.push(`**Partial:** ${scheduled - recs.length} games still to play; every number below is provisional.`, '');
  const variants = Object.assign({}, ...specs.map(s => s.variants ?? {})) as Record<string, Partial<Rules>>;
  if (Object.keys(variants).length) lines.push(`Variants: ${Object.entries(variants).map(([k, v]) => `\`~v${k}\` = \`${JSON.stringify(v)}\``).join(', ')}. A variant does not meet an entrant whose power its rules would change.`, '');
  if (specs.every(s => s.mirrorOnly)) return [...lines, ...mirrorSection(recs, entrants), '', endings(recs)].join('\n') + '\n';
  lines.push(`First move: White ${white >= 0 ? '+' : ''}${white.toFixed(0)} ± ${(1.96 * whiteSe).toFixed(0)} Elo.`, '');
  const field = resampleArmies(recs, entrants, false), vsP = resampleArmies(recs, entrants, true);
  const hw = (a: ArmyResample, e: Entrant): string => (Number.isNaN(a.m.get(e)!) ? '-' : (100 * halfWidth(a, a.samples.get(e)!)).toFixed(1));
  lines.push(`${field.draws} armies (${specs.map(s => (s.armies === 'perPair' ? `${s.id}: a fresh army for every pair` : `${s.id}: one army per pair slot, shared by every matchup`)).join('; ')}). The "armies" intervals resample the armies with their games; a power's strength depends on the army, so they are the ones to read (LESSONS.md 2026-10-03). The other ± are per game.`, '');
  lines.push('| power | Elo (BT) | ±95% | score vs field | ±95% | ±95% armies | vs powers | ±95% | ±95% armies | games | used / game | games used | first use (ply, median) | decisive | draws | plies |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
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
    lines.push(`| ${r.entrant} | ${r.elo >= 0 ? '+' : ''}${r.elo.toFixed(0)} | ${(1.96 * r.se).toFixed(0)} | ${pct(r.score)} | ${(196 * r.scoreSe).toFixed(1)} | ${hw(field, r.entrant)} | ${v.n ? pct(v.m) : '-'} | ${v.n ? (196 * v.se).toFixed(1) : '-'} | ${hw(vsP, r.entrant)} | ${r.games} | ${(uses / Math.max(1, sides)).toFixed(2)} | ${pct(usedGames / Math.max(1, sides))} | ${first.length ? first[first.length >> 1] : '-'} | ${pct(decisive)} | ${pct(1 - decisive)} | ${plies.toFixed(0)} |`);
  }
  // The balance target: every power's score against the other powers inside 50 ± 4 points.
  const powers = ratings.filter(r => basePower(r.entrant) !== 'none' && vs.get(r.entrant)!.n).map(r => ({ e: r.entrant, ...vs.get(r.entrant)! }));
  const inside = powers.filter(p => Math.abs(p.m - 0.5) <= 0.04);
  const spread = Math.max(...powers.map(p => p.m)) - Math.min(...powers.map(p => p.m));
  lines.push('', `Against the other powers: ${inside.length} of ${powers.length} inside 50 ± 4 points; spread ${(100 * spread).toFixed(1)} points.${powers.length - inside.length ? ` Outside: ${powers.filter(p => Math.abs(p.m - 0.5) > 0.04).map(p => `${p.e} ${pct(p.m)}`).join(', ')}.` : ''}`);
  // Two readings of "off centre": each power on its own (a screen), and all of them tested together.
  const own = powers.filter(p => Math.abs(vsP.m.get(p.e)! - 0.5) > halfWidth(vsP, vsP.samples.get(p.e)!));
  const { c, band } = simultaneous(vsP, powers.map(p => p.e));
  const joint = powers.filter(p => Math.abs(vsP.m.get(p.e)! - 0.5) > band.get(p.e)!);
  const at = (e: Entrant, w: number): string => `${e} ${pct(vsP.m.get(e)!)} ± ${(100 * w).toFixed(1)}`;
  lines.push('', `Outside 50% on its own armies interval (a screen: with ${powers.length} powers tested, about ${(0.05 * powers.length).toFixed(1)} would be flagged by chance if all were level): ${own.length ? own.map(p => at(p.e, halfWidth(vsP, vsP.samples.get(p.e)!))).join(', ') : 'none'}.`);
  lines.push('', `Off centre with all ${powers.length} tested together (simultaneous 95% band, ${c.toFixed(2)} standard errors on ${vsP.draws} armies): ${joint.length ? joint.map(p => at(p.e, band.get(p.e)!)).join(', ') : 'none'}.`);
  // Each king's two powers, averaged; the light and dark kings must stay level with each other (owner, 2026-10-02).
  const kings = (Object.keys(KINGS) as KingName[]).filter(k => KINGS[k].every(p => !Number.isNaN(vsP.m.get(p) ?? NaN)));
  const king = new Map(kings.map(k => {
    const [p, q] = KINGS[k].map(x => vsP.samples.get(x)!);
    return [k, { m: (vsP.m.get(KINGS[k][0])! + vsP.m.get(KINGS[k][1])!) / 2, s: p.map((x, b) => (x + q[b]) / 2) }];
  }));
  const pm = (x: number, s: ArrayLike<number>): string => `${(100 * x).toFixed(1)} ± ${(100 * halfWidth(vsP, s)).toFixed(1)}`;
  if (kings.length) {
    const sp = king.get('Spirit'), sh = king.get('Shadow');
    let light = '';
    if (sp && sh) {
      const d = sp.s.map((x, b) => x - sh.s[b]), w = halfWidth(vsP, d);
      light = `; Spirit − Shadow ${pm(sp.m - sh.m, d)} points (${(100 * (sp.m - sh.m - w)).toFixed(1)} to ${(100 * (sp.m - sh.m + w)).toFixed(1)})`;
    }
    lines.push('', `Kings (the mean of their two powers against the other powers): ${kings.map(k => `${k} ${pm(king.get(k)!.m, king.get(k)!.s)}`).join(', ')}${light}.`);
  }
  const anchor = specs.find(s => s.anchor !== undefined)?.anchor;
  if (anchor !== undefined) lines.push('', ...anchorSection(recs, entrants, anchor));
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
  lines.push('', endings(recs));
  return lines.join('\n') + '\n';
}

function endings(recs: readonly TRecord[]): string {
  const reasons = new Map<string, number>();
  for (const g of recs) reasons.set(g.reason, (reasons.get(g.reason) ?? 0) + 1);
  return `Endings: ${[...reasons].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${pct(v / recs.length)}`).join(', ')}.`;
}

/** Mean and 95% half-width of per-pair values (a pair is one army, so the interval counts armies). */
const meanCi = (xs: readonly number[]): [number, number] => {
  const m = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
  return [m, tFromZ(1.96, Math.max(1, xs.length - 1)) * sd / Math.sqrt(Math.max(1, xs.length))];
};

/**
 * Mirror rounds (`mirrorOnly`): each entrant against itself, e.g. `cards3` with the same hand on both
 * sides. Per entrant: White's score (the first-move edge), draws, length and cards played; and the
 * same measures as differences from `none` on the same armies (paired by draw), when `none` played.
 */
export function mirrorSection(recs: readonly TRecord[], entrants: readonly Entrant[]): string[] {
  const pairsOf = (e: Entrant): Map<string, TRecord[]> => {
    const out = new Map<string, TRecord[]>();
    for (const r of recs) if (r.white === e && r.black === e) (out.get(drawOf(r)) ?? out.set(drawOf(r), []).get(drawOf(r))!).push(r);
    return out;
  };
  const per = (rs: readonly TRecord[]) => ({
    white: rs.reduce((a, r) => a + r.result, 0) / rs.length,
    draws: rs.filter(r => r.result === 0.5).length / rs.length,
    plies: rs.reduce((a, r) => a + r.plies, 0) / rs.length,
    cards: rs.reduce((a, r) => a + r.uses[0] + r.uses[1], 0) / (2 * rs.length),
  });
  const base = entrants.includes('none') ? pairsOf('none') : undefined;
  const f1 = (x: number, w: number): string => `${(100 * x).toFixed(1)} | ${(100 * w).toFixed(1)}`;
  const out = ['## Same hand for both sides', '',
    `Each entrant against itself: White's score (50% = no first-move edge), the share of drawn games, plies and cards played per side, with 95% intervals over pairs (one army each)${base ? '; Δ columns are differences from `none` on the same armies' : ''}.`, '',
    '| entrant | White % | ±95% | draws % | ±95% | Δ White | ±95% | Δ draws | ±95% | plies | cards / side | pairs |', '|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const e of entrants) {
    const ps = pairsOf(e);
    if (!ps.size) continue;
    const vals = [...ps.entries()].map(([d, rs]) => ({ d, ...per(rs) }));
    const [w, ww] = meanCi(vals.map(v => v.white)), [dr, dw] = meanCi(vals.map(v => v.draws));
    let delta = '- | - | - | -';
    if (base && e !== 'none') {
      const paired = vals.filter(v => base.has(v.d)).map(v => ({ v, b: per(base.get(v.d)!) }));
      if (paired.length) {
        const [a, aw] = meanCi(paired.map(p => p.v.white - p.b.white)), [b, bw] = meanCi(paired.map(p => p.v.draws - p.b.draws));
        delta = `${a >= 0 ? '+' : ''}${f1(a, aw)} | ${b >= 0 ? '+' : ''}${f1(b, bw)}`;
      }
    }
    out.push(`| ${e} | ${f1(w, ww)} | ${f1(dr, dw)} | ${delta} | ${(vals.reduce((a, v) => a + v.plies, 0) / vals.length).toFixed(0)} | ${(vals.reduce((a, v) => a + v.cards, 0) / vals.length).toFixed(2)} | ${vals.length} |`);
  }
  return out;
}

/** Elo per pawn at depth 3, the balance lab's pawn-odds calibration (docs/research/sim-results-2026-09-13.md: 64 ± 16). */
const ELO_PER_PAWN = 64;

/**
 * Each entrant against the anchor: its score, Elo and value in pawns (Elo / 64), and the share of
 * drawn games against the anchor's own mirror games. Intervals resample the armies; the pawn value
 * also carries the calibration's own ±25%.
 */
export function anchorSection(recs: readonly TRecord[], entrants: readonly Entrant[], anchor: Entrant): string[] {
  const vsA = recs.filter(r => (r.white === anchor) !== (r.black === anchor));
  const field = resampleArmies(vsA, entrants, false);
  const elo = (s: number): number => 400 * Math.log10(Math.min(0.999, Math.max(0.001, s)) / (1 - Math.min(0.999, Math.max(0.001, s))));
  // Draws per pair, so the interval counts the pair (one army) once.
  const drawShare = (rs: readonly TRecord[]): { m: number; w: number; n: number } => {
    const byPair = new Map<number, number[]>();
    for (const r of rs) (byPair.get(r.pairId) ?? byPair.set(r.pairId, []).get(r.pairId)!).push(r.result === 0.5 ? 1 : 0);
    const xs = [...byPair.values()].map(l => l.reduce((a, b) => a + b, 0) / l.length);
    const m = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1));
    return { m, w: 1.96 * sd / Math.sqrt(Math.max(1, xs.length)), n: xs.length };
  };
  const base = drawShare(recs.filter(r => r.white === anchor && r.black === anchor));
  const out = [`## Against ${anchor}`, '',
    `Each entrant's score against ${anchor} (±95%, armies resampled), in Elo and in pawns at ${ELO_PER_PAWN} Elo per pawn (depth 3; that calibration is itself ±25%), and its games' draw share against ${anchor}'s mirror games (${base.n ? `${pct(base.m)} ± ${(100 * base.w).toFixed(1)}, ${base.n} pairs` : 'none played'}).`, '',
    '| entrant | score | ±95% | Elo | pawns | ±95% | draws | Δ draws | ±95% | pairs |', '|---|---|---|---|---|---|---|---|---|---|'];
  const rows = entrants.filter(e => e !== anchor && !Number.isNaN(field.m.get(e)!)).map(e => {
    const m = field.m.get(e)!, w = halfWidth(field, field.samples.get(e)!);
    const d = drawShare(vsA.filter(r => r.white === e || r.black === e));
    const dw = Math.sqrt(d.w ** 2 + base.w ** 2);
    const pawns = elo(m) / ELO_PER_PAWN, pw = (elo(Math.min(0.999, m + w)) - elo(Math.max(0.001, m - w))) / 2 / ELO_PER_PAWN;
    return { e, m, line: `| ${e} | ${pct(m)} | ${(100 * w).toFixed(1)} | ${elo(m) >= 0 ? '+' : ''}${elo(m).toFixed(0)} | ${pawns >= 0 ? '+' : ''}${pawns.toFixed(2)} | ${pw.toFixed(2)} | ${pct(d.m)} | ${base.n ? `${d.m >= base.m ? '+' : ''}${(100 * (d.m - base.m)).toFixed(1)}` : '-'} | ${base.n ? (100 * dw).toFixed(1) : '-'} | ${d.n} |` };
  });
  rows.sort((x, y) => y.m - x.m);
  return [...out, ...rows.map(r => r.line)];
}

// ---------------------------------------------------------------------------------------------

function parseEntrants(text: string | true | undefined, none: boolean): Entrant[] {
  const list = typeof text === 'string' ? text.split(',').map(s => s.trim()).filter(Boolean) : [...ALL_POWERS];
  const out = list.map((s): Entrant => {
    if (s === 'none') return 'none';
    if (/^cards\d+$/.test(s)) return s as Entrant;
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
    if (f.armies !== undefined && f.armies !== 'perPair' && f.armies !== 'shared') throw new Error(`--armies ${f.armies}: perPair or shared`);
    if (typeof f.anchor === 'string' && !entrants.includes(parseEntrants(f.anchor, false)[0])) throw new Error(`--anchor ${f.anchor} is not an entrant`);
    const t: TournamentSpec = {
      id: typeof f.id === 'string' ? f.id : 'kp2',
      entrants,
      pairs: num('pairs', 20),
      // Left out when shared, so the specs of rounds 1–12 still match and resume.
      ...(f.armies === 'perPair' ? { armies: 'perPair' as const } : {}),
      ...(typeof f.anchor === 'string' ? { anchor: parseEntrants(f.anchor, false)[0] } : {}),
      ...(f.mirrorOnly ? { mirrorOnly: true } : {}),
      ...(typeof f.cardPool === 'string' ? { cardPool: parseEntrants(f.cardPool, false).map(basePower).filter((p): p is PowerName => p !== 'none') } : {}),
      depth: num('depth', 3), seed: num('seed', 101),
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
