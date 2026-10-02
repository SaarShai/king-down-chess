/**
 * A residual net that knows the kings' powers (docs/research/ai-powers-2026-10-02.md).
 *
 *   gen    play games under the official powers rules and sample quiet positions in the same worker
 *            tsx src/sim/powers-net.ts gen --id pn-a --games 2000 --depth 3 --workers 4 --seed 1
 *            [--nonePct 0.33] [--evaluator residual]
 *          Each game draws its kings: with probability `nonePct` neither side has a power (an ordinary
 *          game); otherwise each side is uniform over the twelve powers and "none". A game with a power
 *          plays under POWERS_BALANCED, as the browser does. Positions: sim/nnue-powers/<id>.bin
 *          (`REC_P` records); games: sim/out/<id>.jsonl. Resumes by game id.
 *   train  fit the residual on one or more corpora, by default fine-tuning the adopted net
 *            tsx src/sim/powers-net.ts train --data pn-a,pn-b --name cand1 [--init current|none]
 *            [--epochs 8] [--lr 0.003] [--batch 8192] [--seed 20261002] [--adapter]
 *          `--adapter` trains only the new Ogre and power rows: a board with neither plays the adopted net.
 *          Writes sim/nnue-powers/<name>.weights.ts (a candidate, never src/), <name>.train.json, and the
 *          two match arms <name>.arm.json and current.arm.json.
 *   match  candidate against the adopted net: colour-swapped pairs on one army, opening and pair of
 *          kings each (the kings stay with the board colour, the engines change sides)
 *            tsx src/sim/powers-net.ts match --id pm-a --cand sim/nnue-powers/cand1.arm.json
 *            --base sim/nnue-powers/current.arm.json --pairs 200 --depth 3 --mode none|powers
 *            [--timeMs 800] [--workers 4] [--seed 7]
 *   report tsx src/sim/powers-net.ts report --id pm-a [--id pm-b]
 *   bench  speed of two arms on the same positions (random armies, half with powers): nodes per
 *          second at a fixed depth and the depth a one-second search reaches
 *            tsx src/sim/powers-net.ts bench --arms sim/nnue-powers/current.arm.json,sim/nnue-powers/cand1.arm.json
 *   skills each weaker level against Club, as the browser plays them (`skillPlan`: its time cap, score
 *          band and random-move chance), colour-swapped pairs, half the games with powers
 *            tsx src/sim/powers-net.ts skills --id sk-a --pairs 10 [--arm sim/nnue-powers/cand1.arm.json]
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { availableParallelism } from 'node:os';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainThread, parentPort, workerData } from 'node:worker_threads';
import type { Worker } from 'node:worker_threads';
import { Color, Position, WHITE, inCheck, legalMoves, makeMove } from '../rules/engine';
import { POWERS_BALANCED, PowerName, Rules, setRules } from '../rules/rules';
import { fromFen, randomBackRank, toLan } from '../rules/setup';
import { EvalParams, Evaluator, evalParams, evaluate, setEvalParams, setEvaluator } from '../ai/eval';
import { leafPowers, positionKey, quiesceScore, resetSearchState, search } from '../ai/search';
import { SkillName, skillPlan } from '../ai/skill';
import { Game } from '../game';
import { BOARD_INPUTS, HIDDEN, INPUTS, NET_POWERS, QA, QB, packNet } from '../ai/nnue/net';
import { NET_B64 } from '../ai/nnue/weights';
import { Net, REC_P, TrainOpts, VAL_BIT, quantise, trainNet } from './gen';
import { type GameRecord, playGame } from './game';
import { OUT_DIR, RunSpec, parseFlags } from './spec';
import { choice } from './tournament';
import { mulberry32 } from './rng';
import { tsWorker } from './ts-worker';
import { sourceId } from './identity';
import { armStats } from './experiments';

export const PDIR = 'sim/nnue-powers';
type Side = PowerName | 'none';
const OPTIONS: readonly Side[] = [...NET_POWERS, 'none'];
const CP_CAP = 2000, QUIET_CP = 50, VAL_EVERY = 10;

/** One game's rules: none for an ordinary game, the official powers readings plus the kings otherwise. */
export function rulesFor(k: readonly [Side, Side]): Partial<Rules> {
  if (k[0] === 'none' && k[1] === 'none') return {};
  return { ...POWERS_BALANCED, kings: [choice(k[0]), choice(k[1])] };
}

/** `nonePct` of games have no powers; the rest give each side one of the twelve powers or none. */
export function drawKings(rng: () => number, nonePct: number, allowNone = true): [Side, Side] {
  if (rng() < nonePct) return ['none', 'none'];
  for (;;) {
    const k: [Side, Side] = [OPTIONS[Math.floor(rng() * OPTIONS.length)], OPTIONS[Math.floor(rng() * OPTIONS.length)]];
    if (allowNone || k[0] !== 'none' || k[1] !== 'none') return k;
  }
}

// -------------------------------------------------------------------------------------------------
// 1. Generation and sampling.

interface GenJob { gameId: number; kings: [Side, Side]; army: string; seed: number }
interface GenSpec { id: string; games: number; depth: number; seed: number; nonePct: number; evaluator: Evaluator; maxPlies: number; openingRandomPlies: number }
interface GenOut { line: Record<string, unknown>; bytes: Uint8Array }

function genJobs(g: GenSpec): GenJob[] {
  const rng = mulberry32(g.seed);
  return Array.from({ length: g.games }, (_, gameId) => {
    const kings = drawKings(rng, g.nonePct);
    const army = randomBackRank(rng);
    return { gameId, kings, army, seed: (g.seed * 1_000_003 + gameId * 7919) >>> 0 };
  });
}

/** Play one game and keep its quiet, scored positions as `REC_P` records. */
function genGame(g: GenSpec, job: GenJob): GenOut {
  const rules = rulesFor(job.kings);
  const spec: RunSpec = { id: g.id, games: 1, seed: g.seed, ai: { depth: g.depth }, rules, maxPlies: g.maxPlies, openingRandomPlies: g.openingRandomPlies };
  setEvaluator(g.evaluator);
  const rec = playGame(spec, { gameId: job.gameId, pairId: job.gameId, colourSwapped: false, configId: job.army, seed: job.seed, backRankWhite: job.army, backRankBlack: job.army });
  // Sample under the same rules (playGame left them set), with the linear quiet test of `gen.ts`.
  setRules(rules);
  setEvaluator('linear');
  const isVal = job.gameId % VAL_EVERY === 0;
  const out: number[] = [];
  const st = { kept: 0, noScore: 0, decided: 0, inCheck: 0, midTurn: 0, noisy: 0 };
  let pos: Position = fromFen(rec.startFen);
  for (let i = 0; i < rec.moves.length; i++) {
    const ply = rec.moves[i];
    const m = legalMoves(pos).find(x => toLan(pos, x) === ply.lan);
    if (!m) throw new Error(`game ${job.gameId} ply ${i}: ${ply.lan} is not legal on replay`);
    if (ply.cp === undefined) st.noScore++;
    else if (Math.abs(ply.cp) > CP_CAP) st.decided++;
    else if (inCheck(pos)) st.inCheck++;
    else if (pos.haste !== undefined || pos.free) st.midTurn++; // inside a Haste or free-mark turn
    else {
      const lp = leafPowers(pos);
      if (Math.abs(evaluate(pos) + lp.term - quiesceScore(pos)) > QUIET_CP) st.noisy++;
      else {
        const mover = pos.turn === WHITE ? 1 : -1;
        for (let s = 0; s < 64; s++) out.push(pos.board[s]);
        out.push(pos.turn);
        out.push(Math.round((mover > 0 ? rec.result : 1 - rec.result) * 2) | (isVal ? VAL_BIT : 0));
        const cp = mover * ply.cp;
        out.push(cp & 0xff, (cp >> 8) & 0xff);
        out.push(lp.rows[0] + 1, lp.rows[1] + 1);
        const t = Math.max(-32000, Math.min(32000, Math.round(lp.term)));
        out.push(t & 0xff, (t >> 8) & 0xff);
        st.kept++;
      }
    }
    pos = makeMove(pos, m);
  }
  setRules();
  return {
    line: {
      gameId: job.gameId, kings: job.kings, army: job.army, result: rec.result, reason: rec.reason, plies: rec.plies, ms: rec.ms,
      powers: rec.events.powers, ...st, startFen: rec.startFen, lans: rec.moves.map(m => m.lan), cps: rec.moves.map(m => m.cp ?? null),
    },
    bytes: Uint8Array.from(out),
  };
}

async function runPool<J, R>(role: string, payload: unknown, jobs: J[], nWorkers: number, onResult: (r: R) => void, label: string): Promise<void> {
  if (!jobs.length) return;
  const t0 = Date.now();
  let next = 0, finished = 0;
  const tick = setInterval(() => {
    const s = (Date.now() - t0) / 1000, rate = finished / s;
    console.log(`[${label}] ${finished}/${jobs.length}  ${rate.toFixed(2)} games/s  ETA ${Math.round((jobs.length - finished) / Math.max(rate, 1e-9) / 60)} min`);
  }, 60_000);
  const workers: Worker[] = [];
  const retired = new Set<Worker>();
  try {
    await new Promise<void>((resolve, reject) => {
      for (let i = 0; i < Math.max(1, Math.min(nWorkers, jobs.length)); i++) {
        const w = tsWorker(new URL(import.meta.url), { workerData: { role, payload } });
        w.on('message', (r: R) => {
          onResult(r);
          finished++;
          if (next < jobs.length) w.postMessage(jobs[next++]);
          else { retired.add(w); void w.terminate(); if (finished === jobs.length) resolve(); }
        });
        w.on('error', reject);
        w.on('exit', code => { if (!retired.has(w)) reject(new Error(`[${label}] a worker exited (code ${code}) with ${jobs.length - finished} games unplayed`)); });
        workers.push(w);
      }
      for (const w of workers) if (next < jobs.length) w.postMessage(jobs[next++]);
    });
  } finally {
    clearInterval(tick);
    for (const w of workers) void w.terminate();
  }
  console.log(`[${label}] ${finished} games in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
}

const doneIds = (file: string): Set<number> => {
  const out = new Set<number>();
  if (!existsSync(file)) return out;
  for (const l of readFileSync(file, 'utf8').split('\n')) if (l) out.add((JSON.parse(l) as { gameId: number }).gameId);
  return out;
};

async function gen(g: GenSpec, workers: number): Promise<void> {
  mkdirSync(PDIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });
  const specFile = `${PDIR}/${g.id}.gen.json`;
  if (existsSync(specFile)) {
    const old = JSON.parse(readFileSync(specFile, 'utf8')) as GenSpec & { src?: string };
    const { src: _src, ...rest } = old;
    if (JSON.stringify(rest) !== JSON.stringify(g)) throw new Error(`[${g.id}] ${specFile} holds a different run; use a new id`);
  } else writeFileSync(specFile, JSON.stringify({ ...g, src: sourceId() }, null, 2) + '\n');
  const jsonl = `${OUT_DIR}/${g.id}.jsonl`, bin = `${PDIR}/${g.id}.bin`;
  const done = doneIds(jsonl);
  const jobs = genJobs(g).filter(j => !done.has(j.gameId));
  console.log(`[${g.id}] ${g.games} games (${done.size} done), depth ${g.depth}, ${workers} workers, evaluator ${g.evaluator}, no-power share ${g.nonePct}`);
  // The positions first, then the game line: a crash between the two replays that game on resume
  // and appends its positions twice, never the reverse (a game counted with its positions missing).
  await runPool<GenJob, GenOut>('powers-gen', g, jobs, workers, r => {
    appendFileSync(bin, r.bytes);
    appendFileSync(jsonl, JSON.stringify(r.line) + '\n');
  }, g.id);
}

// -------------------------------------------------------------------------------------------------
// 2. Training.

/** The float net behind a blob (either layout); power rows of a board-only blob are zero. */
export function dequantise(b64: string): Net {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const w = new Int16Array(bytes.buffer);
  const rows = w.length === INPUTS * HIDDEN + 3 * HIDDEN + 1 ? INPUTS : BOARD_INPUTS;
  const net: Net = { w1: new Float32Array(INPUTS * HIDDEN), b1: new Float32Array(HIDDEN), w2: new Float32Array(2 * HIDDEN), b2: 0 };
  let o = 0;
  for (let i = 0; i < rows * HIDDEN; i++) net.w1[i] = w[o++] / QA;
  for (let i = 0; i < HIDDEN; i++) net.b1[i] = w[o++] / QA;
  for (let i = 0; i < 2 * HIDDEN; i++) net.w2[i] = w[o++] / QB;
  net.b2 = w[o++] / QB;
  if (o !== w.length) throw new Error(`dequantise: read ${o} of ${w.length} weights`);
  return net;
}

function loadCorpus(ids: string[]): { buf: Uint8Array; n: number; sha: string; parts: { id: string; positions: number }[] } {
  const chunks = ids.map(id => readFileSync(`${PDIR}/${id}.bin`));
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const buf = new Uint8Array(total);
  let o = 0;
  const parts: { id: string; positions: number }[] = [];
  chunks.forEach((c, i) => {
    if (c.length % REC_P) throw new Error(`${ids[i]}.bin is ${c.length} bytes, not a whole number of ${REC_P}-byte records`);
    buf.set(c, o); o += c.length; parts.push({ id: ids[i], positions: c.length / REC_P });
  });
  return { buf, n: total / REC_P, sha: createHash('sha256').update(buf).digest('hex'), parts };
}

/** Held-out loss of a net, split into positions with no live power and positions with one. */
async function splitLoss(buf: Uint8Array, n: number, net: Net): Promise<{ plain: number; powers: number; ogre: number; nPlain: number; nPowers: number; nOgre: number }> {
  // One epoch at lr 0 is exactly the loss function the trainer uses; cheaper to restate it here.
  const { features, forward } = await import('./gen');
  const { evaluateBoard } = await import('../ai/eval');
  const { SCALE, RESIDUAL_MAX } = await import('../ai/nnue/net');
  setRules();
  const K = 0.667 * Math.LN10 / 400;
  const mine = new Int32Array(66), theirs = new Int32Array(66), acc = new Float32Array(2 * HIDDEN), h = new Float32Array(2 * HIDDEN);
  let sp = 0, np = 0, sw = 0, nw = 0, so = 0, no = 0;
  for (let i = 0; i < n; i++) {
    const off = i * REC_P;
    if (!(buf[off + 65] & VAL_BIT)) continue;
    const turn = buf[off + 64] as Color;
    const base = evaluateBoard(buf.subarray(off, off + 64), turn) + (((buf[off + 70] | (buf[off + 71] << 8)) << 16) >> 16);
    const cp = ((buf[off + 66] | (buf[off + 67] << 8)) << 16) >> 16;
    const d = cp - base, tcp = base + (d > RESIDUAL_MAX ? RESIDUAL_MAX : d < -RESIDUAL_MAX ? -RESIDUAL_MAX : d);
    const t = 1 / (1 + Math.exp(-K * tcp));
    const cnt = features(buf, off, turn, mine, theirs, REC_P);
    const y = forward(net, mine, theirs, cnt, acc, h);
    const p = 1 / (1 + Math.exp(-(base + y * SCALE) * K));
    const l = (p - t) ** 2;
    if (buf[off + 68] || buf[off + 69]) { sw += l; nw++; } else { sp += l; np++; }
    let ogre = false;
    for (let s = 0; s < 64 && !ogre; s++) ogre = (buf[off + s] & 15) === 12;
    if (ogre) { so += l; no++; }
  }
  return { plain: sp / Math.max(1, np), powers: sw / Math.max(1, nw), ogre: so / Math.max(1, no), nPlain: np, nPowers: nw, nOgre: no };
}

function weightsTs(b64: string, note: string): string {
  return `/**
 * The trained net, base64 little-endian Int16 (see \`net.ts\` for the layout).
 * ${INPUTS} x ${HIDDEN} x 2 -> 1, QA=${QA} QB=${QB} SCALE=400.
 *
${note.split('\n').map(l => ` * ${l}`.trimEnd()).join('\n')}
 */

/** What the blob predicts: the whole evaluation, or a bounded residual on the linear one. */
export const NET_KIND = 'residual';

export const NET_B64: string = '${b64}';
`;
}

const armOf = (b64: string): EvalParams => ({ ...evalParams(), evaluator: 'residual', net: { b64, kind: 'residual' } });

async function train(ids: string[], name: string, opts: TrainOpts, initFrom: 'current' | 'none'): Promise<void> {
  const { buf, n, sha, parts } = loadCorpus(ids);
  console.log(`[powers-net] ${n} positions from ${ids.join(', ')} (sha256 ${sha.slice(0, 16)}…)`);
  const init = initFrom === 'current' ? dequantise(NET_B64) : undefined;
  if (init) {
    const l0 = await splitLoss(buf, n, init);
    console.log(`[powers-net] starting net, held out: no powers ${l0.plain.toFixed(6)} (${l0.nPlain}), powers ${l0.powers.toFixed(6)} (${l0.nPowers}), Ogre on the board ${l0.ogre.toFixed(6)} (${l0.nOgre})`);
  }
  const res = trainNet(buf, n, opts, init, REC_P);
  const b64 = packNet(quantise(res.net));
  const l1 = await splitLoss(buf, n, res.net);
  const l0 = init ? await splitLoss(buf, n, init) : null;
  console.log(`[powers-net] ${name}, held out: no powers ${l1.plain.toFixed(6)}, powers ${l1.powers.toFixed(6)}, Ogre on the board ${l1.ogre.toFixed(6)}`);
  mkdirSync(PDIR, { recursive: true });
  writeFileSync(`${PDIR}/${name}.weights.ts`, weightsTs(b64,
    `**Candidate** written by \`tsx src/sim/powers-net.ts train\` (${new Date().toISOString().slice(0, 10)}); not adopted until it\n` +
    `passes the matches in docs/research/ai-powers-2026-10-02.md. Corpus: ${ids.join(', ')}, ${n} positions.`));
  writeFileSync(`${PDIR}/${name}.arm.json`, JSON.stringify(armOf(b64), null, 1) + '\n');
  writeFileSync(`${PDIR}/current.arm.json`, JSON.stringify(armOf(NET_B64), null, 1) + '\n');
  writeFileSync(`${PDIR}/${name}.train.json`, JSON.stringify({
    opts, init: initFrom, positions: n, bestEpoch: res.bestEpoch, bestVal: res.bestVal, curve: res.curve,
    heldOut: { start: l0, candidate: l1 },
    dataset: { ids, parts, sha256: sha }, trainedBy: sourceId(),
    model: { file: `${PDIR}/${name}.weights.ts`, kind: 'residual', sha256: createHash('sha256').update(b64).digest('hex') },
  }, null, 2) + '\n');
  console.log(`[powers-net] wrote ${PDIR}/${name}.{weights.ts,arm.json,train.json} and current.arm.json`);
}

// -------------------------------------------------------------------------------------------------
// 3. Matches.

interface MatchSpec {
  id: string; cand: string; base: string; pairs: number; depth?: number; timeMs?: number;
  mode: 'none' | 'powers'; seed: number; maxPlies: number; openingRandomPlies: number;
}
interface MatchJob { gameId: number; pairId: number; colourSwapped: boolean; kings: [Side, Side]; army: string; seed: number }

function matchJobs(m: MatchSpec): MatchJob[] {
  const rng = mulberry32(m.seed);
  const jobs: MatchJob[] = [];
  for (let p = 0; p < m.pairs; p++) {
    const kings = m.mode === 'none' ? (['none', 'none'] as [Side, Side]) : drawKings(rng, 0, false);
    const army = randomBackRank(rng);
    const seed = (m.seed * 1_000_003 + p * 7919) >>> 0;
    for (const colourSwapped of [false, true]) jobs.push({ gameId: jobs.length, pairId: p, colourSwapped, kings, army, seed });
  }
  return jobs;
}

/** One game: the candidate plays White in the pair's first game and Black in the second; the kings stay. */
function matchGame(m: MatchSpec, job: MatchJob): Record<string, unknown> {
  const spec: RunSpec = {
    id: m.id, games: 1, seed: m.seed,
    ai: m.timeMs ? { timeMs: m.timeMs } : { depth: m.depth },
    rules: rulesFor(job.kings), maxPlies: m.maxPlies, openingRandomPlies: m.openingRandomPlies,
    evalParams: { white: m.cand, black: m.base },
  };
  const rec = playGame(spec, {
    gameId: job.gameId, pairId: job.pairId, colourSwapped: job.colourSwapped, configId: job.army,
    seed: job.seed, backRankWhite: job.army, backRankBlack: job.army,
  });
  setRules();
  return {
    gameId: job.gameId, pairId: job.pairId, colourSwapped: job.colourSwapped, kings: job.kings, army: job.army,
    result: rec.result, reason: rec.reason, plies: rec.plies, ms: rec.ms, powers: rec.events.powers, lans: rec.moves.map(x => x.lan),
  };
}

async function match(m: MatchSpec, workers: number): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  const specFile = `${OUT_DIR}/${m.id}.match.json`;
  const cand = readFileSync(m.cand, 'utf8'), base = readFileSync(m.base, 'utf8');
  const stamp = { ...m, candSha: createHash('sha256').update(cand).digest('hex').slice(0, 16), baseSha: createHash('sha256').update(base).digest('hex').slice(0, 16) };
  if (existsSync(specFile)) {
    const old = JSON.parse(readFileSync(specFile, 'utf8')) as typeof stamp & { src?: string };
    const { src: _src, ...rest } = old;
    if (JSON.stringify(rest) !== JSON.stringify(stamp)) throw new Error(`[${m.id}] ${specFile} holds a different match; use a new id`);
  } else writeFileSync(specFile, JSON.stringify({ ...stamp, src: sourceId() }, null, 2) + '\n');
  const jsonl = `${OUT_DIR}/${m.id}.jsonl`;
  const done = doneIds(jsonl);
  const jobs = matchJobs(m).filter(j => !done.has(j.gameId));
  console.log(`[${m.id}] ${m.pairs} pairs (${done.size} games done), ${m.timeMs ? `${m.timeMs} ms a move` : `depth ${m.depth}`}, mode ${m.mode}, ${workers} workers`);
  await runPool<MatchJob, Record<string, unknown>>('powers-match', m, jobs, workers, r => appendFileSync(jsonl, JSON.stringify(r) + '\n'), m.id);
  console.log(matchReport([m.id]));
}

export function matchReport(ids: string[]): string {
  const lines: string[] = [];
  for (const id of ids) {
    const recs = readFileSync(`${OUT_DIR}/${id}.jsonl`, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l) as GameRecord & { kings: [Side, Side] });
    const a = armStats('candidate', recs);
    lines.push(`[${id}] ${a.games} games, ${a.pairs} pairs, pentanomial [${a.counts.join(', ')}]: candidate score ${a.mu.toFixed(3)}  Elo ${a.elo >= 0 ? '+' : ''}${a.elo.toFixed(1)} ± ${a.err95.toFixed(1)}  LOS ${(100 * a.los).toFixed(1)}%  draws ${(100 * a.draws).toFixed(1)}%  plies ${a.plies.toFixed(0)}`);
    writeFileSync(`${OUT_DIR}/${id}.result.json`, JSON.stringify(a, null, 2) + '\n');
  }
  return lines.join('\n');
}

// -------------------------------------------------------------------------------------------------
// 4. Skill levels: does Beginner still lose to Club, and Casual too?

interface SkillJob { gameId: number; pairId: number; level: SkillName; levelWhite: boolean; kings: [Side, Side]; army: string; seed: number }
interface SkillSpec { id: string; pairs: number; seed: number; arm?: string; thinkMs: number }

function skillGame(sp: SkillSpec, job: SkillJob): Record<string, unknown> {
  const rules = rulesFor(job.kings);
  setRules(rules);
  if (sp.arm) setEvalParams(JSON.parse(readFileSync(sp.arm, 'utf8')) as EvalParams);
  else setEvaluator('residual');
  resetSearchState();
  const rng = mulberry32(job.seed);
  const game = new Game(job.army);
  const keys: number[] = [];
  let streak = 0, sign = 0, result: number | null = null, reason = '';
  while (game.status === 'playing' && game.history.length < 240) {
    const c = game.pos.turn;
    const level: SkillName = (c === WHITE) === job.levelWhite ? job.level : 'club';
    const plan = skillPlan(level, sp.thinkMs, game.history.length);
    keys.push(positionKey(game.pos));
    const r = search(game.pos, { timeMs: plan.timeMs, temperature: plan.temperature, rng, history: keys });
    const legal = game.legal;
    const blunder = plan.blunder > 0 && rng() < plan.blunder ? legal[Math.floor(rng() * legal.length)] : null;
    const lan = r.move ? toLan(game.pos, r.move) : '';
    const move = blunder ?? legal.find(m => toLan(game.pos, m) === lan) ?? legal[0];
    // Resign only on the Club side's own lasting verdict (the weaker side's search is not trusted).
    if (level === 'club') {
      const w = c === WHITE ? r.score : -r.score;
      const sg = w >= 800 ? 1 : w <= -800 ? -1 : 0;
      streak = sg !== 0 && sg === sign ? streak + 1 : sg ? 1 : 0;
      sign = sg;
      if (streak >= 3) { result = sg > 0 ? 1 : 0; reason = 'adjudicatedResign'; break; }
    }
    game.play(move);
  }
  if (result === null) {
    reason = game.status === 'playing' ? 'plyCap' : game.status;
    result = game.status === 'checkmate' ? (game.pos.turn === WHITE ? 0 : 1) : 0.5;
  }
  setRules();
  const levelScore = job.levelWhite ? result : 1 - result;
  return { ...job, result, levelScore, reason, plies: game.history.length };
}

async function skills(sp: SkillSpec, workers: number): Promise<void> {
  const rng = mulberry32(sp.seed);
  const jobs: SkillJob[] = [];
  for (const level of ['beginner', 'casual'] as SkillName[]) {
    for (let p = 0; p < sp.pairs; p++) {
      const kings = p % 2 ? drawKings(rng, 0, false) : (['none', 'none'] as [Side, Side]);
      const army = randomBackRank(rng);
      const seed = (sp.seed * 1_000_003 + jobs.length * 7919) >>> 0;
      for (const levelWhite of [true, false]) jobs.push({ gameId: jobs.length, pairId: jobs.length >> 1, level, levelWhite, kings, army, seed: seed + (levelWhite ? 0 : 1) });
    }
  }
  const out: Record<string, unknown>[] = [];
  await runPool<SkillJob, Record<string, unknown>>('powers-skills', sp, jobs, workers, r => out.push(r), sp.id);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(`${OUT_DIR}/${sp.id}.skills.jsonl`, out.map(r => JSON.stringify(r)).join('\n') + '\n');
  for (const level of ['beginner', 'casual']) {
    const g = out.filter(r => r.level === level);
    const score = g.reduce((a, r) => a + (r.levelScore as number), 0) / Math.max(1, g.length);
    const wins = g.filter(r => r.levelScore === 1).length, draws = g.filter(r => r.levelScore === 0.5).length;
    console.log(`[${sp.id}] ${level} vs club: ${g.length} games, score ${(100 * score).toFixed(1)}% (${wins} wins, ${draws} draws, ${g.length - wins - draws} losses)`);
  }
}

async function bench(arms: string[], nPos: number, depth: number, seed: number): Promise<void> {
  const rng = mulberry32(seed);
  const cases: { pos: Position; rules: Partial<Rules> }[] = [];
  for (let i = 0; i < nPos; i++) {
    const rules = rulesFor(i % 2 ? drawKings(rng, 0, false) : ['none', 'none']);
    setRules(rules);
    let pos = fromFen(toFenOf(randomBackRank(rng)));
    for (let k = 0; k < 8; k++) {
      const ms = legalMoves(pos).filter(m => !m.power && !m.pass);
      if (!ms.length) break;
      pos = makeMove(pos, ms[Math.floor(rng() * ms.length)]);
    }
    cases.push({ pos, rules });
  }
  for (const arm of arms) {
    setEvalParams(JSON.parse(readFileSync(arm, 'utf8')) as EvalParams);
    let nodes = 0, ms = 0, depthSum = 0;
    for (const c of cases) {
      setRules(c.rules);
      resetSearchState();
      const t = performance.now();
      nodes += search(c.pos, { maxDepth: depth }).nodes;
      ms += performance.now() - t;
      resetSearchState();
      depthSum += search(c.pos, { timeMs: 1000 }).depth;
    }
    console.log(`[bench] ${arm}: depth ${depth} ${Math.round(nodes / (ms / 1000) / 1000)}k nodes/s over ${(ms / 1000).toFixed(1)} s; a 1 s search reaches depth ${(depthSum / nPos).toFixed(2)} (mean of ${nPos})`);
  }
  setRules();
}
const toFenOf = (rank: string): string => `${rank.toLowerCase()}/pppppppp/8/8/8/8/PPPPPPPP/${rank} w - - 0 1`;

// -------------------------------------------------------------------------------------------------

if (!isMainThread) {
  const { role, payload } = workerData as { role: string; payload: unknown };
  if (role === 'powers-gen') parentPort!.on('message', (job: GenJob) => {
    const r = genGame(payload as GenSpec, job);
    parentPort!.postMessage(r);
  });
  else if (role === 'powers-match') parentPort!.on('message', (job: MatchJob) => parentPort!.postMessage(matchGame(payload as MatchSpec, job)));
  else if (role === 'powers-skills') parentPort!.on('message', (job: SkillJob) => parentPort!.postMessage(skillGame(payload as SkillSpec, job)));
}

if (isMainThread && process.argv[1] && fileURLToPath(import.meta.url) === resolvePath(process.argv[1])) {
  const argv = process.argv.slice(2);
  const cmd = argv[0] ?? 'help';
  const f = parseFlags(argv);
  const num = (k: string, d: number): number => (typeof f[k] === 'string' ? Number(f[k]) : d);
  const str = (k: string, d: string): string => (typeof f[k] === 'string' ? (f[k] as string) : d);
  const workers = num('workers', availableParallelism());
  const fail = (e: unknown): void => { console.error(e); process.exitCode = 1; };
  if (cmd === 'gen') {
    gen({
      id: str('id', 'pn'), games: num('games', 100), depth: num('depth', 3), seed: num('seed', 1), nonePct: num('nonePct', 1 / 3),
      evaluator: str('evaluator', 'residual') as Evaluator, maxPlies: num('maxPlies', 300), openingRandomPlies: num('openingRandomPlies', 4),
    }, workers).catch(fail);
  } else if (cmd === 'train') {
    const opts: TrainOpts = {
      epochs: num('epochs', 8), batch: num('batch', 8192), lr: num('lr', 0.003), lambda: num('lambda', 0), seed: num('seed', 20261002), loss: 'res',
      ...(f.adapter ? { trainFrom: BOARD_INPUTS } : {}),
    };
    train(str('data', '').split(',').filter(Boolean), str('name', 'cand'), opts, str('init', 'current') === 'none' ? 'none' : 'current').catch(fail);
  } else if (cmd === 'match') {
    match({
      id: str('id', 'pm'), cand: str('cand', ''), base: str('base', `${PDIR}/current.arm.json`), pairs: num('pairs', 100),
      ...(typeof f.timeMs === 'string' ? { timeMs: num('timeMs', 800) } : { depth: num('depth', 3) }),
      mode: str('mode', 'none') === 'powers' ? 'powers' : 'none', seed: num('seed', 7),
      maxPlies: num('maxPlies', 300), openingRandomPlies: num('openingRandomPlies', 4),
    }, workers).catch(fail);
  } else if (cmd === 'bench') {
    bench(str('arms', '').split(',').filter(Boolean), num('positions', 16), num('depth', 5), num('seed', 4242)).catch(fail);
  } else if (cmd === 'skills') {
    skills({ id: str('id', 'sk'), pairs: num('pairs', 10), seed: num('seed', 11), thinkMs: num('thinkMs', 800), ...(typeof f.arm === 'string' ? { arm: f.arm } : {}) }, workers).catch(fail);
  } else if (cmd === 'report') {
    const ids = argv.flatMap((a, i) => (a === '--id' ? [argv[i + 1]] : []));
    console.log(matchReport(ids));
  } else console.log('usage: tsx src/sim/powers-net.ts gen|train|match|report …  (see the header of this file)');
}
