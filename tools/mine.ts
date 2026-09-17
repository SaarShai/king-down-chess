/**
 * Mine the recorded games for "what makes a back rank interesting or unbalanced".
 *
 * Reads `sim/out/<run>.jsonl` (every game) and reuses the analyser's own metric functions, so no
 * statistic is redefined here. Prints three sections:
 *
 *   1. per back rank -> balance / draws / length / interest, correlated with features of the
 *      rank string (fairy counts, king and queen files, adjacency pairs, flank vs centre, ...)
 *   2. per game -> which pieces actually move, shoot, swap, chain, sacrifice, survive, and where
 *      captures happen; "dead weight" is a piece or a start square that never does anything
 *   3. the extremes -> top/bottom 10 by residual interest and by imbalance, and what they share
 *
 * Usage:
 *   npx tsx tools/mine.ts                                  # sweep-p2.r1 + r2 (current engine)
 *   npx tsx tools/mine.ts --runs sweep-d3.r1,sweep-d3.r2   # pass-1 engine, as a replication
 *   npx tsx tools/mine.ts --min 40 --section 1
 *   npx tsx tools/mine.ts --specs                          # write sim/specs/batch3/*.json
 */
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import type { GameRecord } from '../src/sim/game';
import { CP_CLAMP, CP_SCALE, DEAD_BAND, INTEREST, UNSURE } from '../src/sim/weights';
// The one exception to the port below: who moved at a ply is a *rule*, so it is imported, never
// copied. `moverAt` is one line with no state; a second copy is how the parity bug survived.
import { WHITE, moverAt } from '../src/rules/engine';

/**
 * `trajectory` and `leadMetrics` below are a **line-for-line port of `src/sim/analyze.ts`**, not a
 * second definition: the constants still come from `src/sim/weights.ts`, so the two cannot drift on
 * a weight, and `moverAt` is imported outright. They are copied rather than imported because `src/` is owned by other agents and was
 * mid-edit (a broken template literal) while this ran; importing it makes the mine break whenever
 * the analyser is being rewritten. If analyse and mine ever disagree, analyse is right — re-copy.
 */
function trajectory(rec: GameRecord): { leadChanges: number; volatility: number; branchingFactor: number } {
  const clamp = (c: number): number => Math.max(-CP_CLAMP, Math.min(CP_CLAMP, c));
  let changes = 0, side = 0, s = 0, deltas = 0;
  let prev: number | null = null;
  rec.moves.forEach((m, i) => {
    if (m.cp === undefined) return;
    const cp = clamp(m.cp);
    if (prev !== null) { s += Math.abs(cp - prev); deltas++; }
    prev = cp;
    if (i < 10) return;
    const sg = cp > DEAD_BAND ? 1 : cp < -DEAD_BAND ? -1 : 0;
    if (sg !== 0) { if (side !== 0 && sg !== side) changes++; side = sg; }
  });
  return {
    leadChanges: changes,
    volatility: deltas ? s / deltas : 0,
    branchingFactor: mean(rec.moves.map(m => m.legal ?? 0)),
  };
}

interface Lead { killerMove: number; leadChange: number; uncertaintyLate: number; permanence: number; drama: number }

function leadMetrics(rec: GameRecord, rules = rec.rules ?? {}): Lead {
  const idx: number[] = [], lead: number[] = [];
  rec.moves.forEach((m, i) => {
    if (m.cp === undefined) return;
    idx.push(i);
    lead.push(2 / (1 + Math.exp(-Math.max(-CP_CLAMP, Math.min(CP_CLAMP, m.cp)) / CP_SCALE)) - 1);
  });
  const T = lead.length;
  const z = rec.result === 1 ? 1 : rec.result === 0 ? -1 : 0;
  if (T < 2) return { killerMove: 0, leadChange: 0, uncertaintyLate: 0.5, permanence: 1, drama: 0 };
  let killer = 0, changes = 0, jerk = 0, dramaSum = 0, dramaN = 0;
  for (let i = 1; i < T; i++) {
    const d = lead[i] - lead[i - 1];
    killer = Math.max(killer, (moverAt(idx[i], rules) === WHITE ? 1 : -1) * d);
    if (Math.sign(lead[i]) !== 0 && Math.sign(lead[i]) !== Math.sign(lead[i - 1]) && Math.sign(lead[i - 1]) !== 0) changes++;
    if (i >= 2) jerk += Math.abs(d - (lead[i - 1] - lead[i - 2]));
  }
  for (const l of lead) if (z !== 0 && z * l < 0) { dramaSum += Math.sqrt(-z * l); dramaN++; }
  let u = 0;
  for (let k = 0; k < 100; k++) {
    const tau = k / 100;
    u += tau - Math.abs(lead[Math.min(T - 1, Math.floor(tau * T))]);
  }
  return {
    killerMove: Math.max(0, Math.min(1, killer)),
    leadChange: changes / (T - 1),
    uncertaintyLate: (u / 100 + 1) / 2,
    permanence: T >= 3 ? Math.max(0, 1 - jerk / (T - 2)) : 1,
    drama: dramaN ? dramaSum / dramaN : 0,
  };
}
void UNSURE;

/** `--games 200` -> { games: '200' }; a bare `--flag` is `true`. Same shape as `spec.ts`. */
function parseFlags(argv: readonly string[]): Record<string, string | true> {
  const out: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const eq = a.indexOf('=');
    if (eq > 0) out[a.slice(2, eq)] = a.slice(eq + 1);
    else out[a.slice(2)] = argv[i + 1]?.startsWith('--') === false ? argv[++i] : true;
  }
  return out;
}

const FAIRY = [...'ALGMS'];
const ALL = [...'KQRBNALGMSP'];
const FILE = [...'abcdefgh'];

// ---------------------------------------------------------------- small statistics

const sum = (xs: readonly number[]): number => xs.reduce((a, b) => a + b, 0);
const mean = (xs: readonly number[]): number => (xs.length ? sum(xs) / xs.length : 0);
const sd = (xs: readonly number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(sum(xs.map(x => (x - m) ** 2)) / (xs.length - 1));
};

/** Pearson r plus the two-sided t statistic; n-2 df, so |t| > 2 is the usual eyeball threshold. */
function corr(x: readonly number[], y: readonly number[]): { r: number; t: number; n: number } {
  const n = x.length;
  const mx = mean(x), my = mean(y);
  const sxy = sum(x.map((v, i) => (v - mx) * (y[i] - my)));
  const sxx = sum(x.map(v => (v - mx) ** 2)), syy = sum(y.map(v => (v - my) ** 2));
  const r = sxx > 1e-12 && syy > 1e-12 ? sxy / Math.sqrt(sxx * syy) : 0;
  return { r, t: Math.abs(r) >= 1 ? Infinity : r * Math.sqrt((n - 2) / (1 - r * r)), n };
}

/** Least squares slope + intercept; used for every residualisation below. */
function ols(x: readonly number[], y: readonly number[]): { a: number; b: number } {
  const mx = mean(x), my = mean(y);
  const sxx = sum(x.map(v => (v - mx) ** 2));
  const b = sxx > 1e-12 ? sum(x.map((v, i) => (v - mx) * (y[i] - my))) / sxx : 0;
  return { a: my - b * mx, b };
}
const residuals = (x: readonly number[], y: readonly number[]): number[] => {
  const { a, b } = ols(x, y);
  return y.map((v, i) => v - (a + b * x[i]));
};

const f2 = (x: number, d = 3): string => (Number.isFinite(x) ? x.toFixed(d) : '-');
const pad = (s: string, w: number): string => (s.length >= w ? s : s + ' '.repeat(w - s.length));
const padL = (s: string, w: number): string => (s.length >= w ? s : ' '.repeat(w - s.length) + s);

function table(head: readonly string[], rows: readonly (readonly string[])[]): string {
  const w = head.map((h, i) => Math.max(h.length, ...rows.map(r => (r[i] ?? '').length)));
  const line = (r: readonly string[]): string => r.map((c, i) => (i ? padL(c ?? '', w[i]) : pad(c ?? '', w[i]))).join('  ');
  return [line(head), w.map(n => '-'.repeat(n)).join('  '), ...rows.map(line)].join('\n');
}

// ---------------------------------------------------------------- features of a back rank string

/**
 * Every feature is a number, so the whole set goes through one correlation loop. Index i of the
 * rank string is file i (the start FEN writes the rank a-file first), and the board is mirrored,
 * so a feature is a property of the arrangement, not of a colour.
 */
export function features(rank: string): Record<string, number> {
  const at = (i: number): string => rank[i];
  const idx = (p: string): number[] => [...rank].flatMap((c, i) => (c === p ? [i] : []));
  const count = (p: string): number => idx(p).length;
  const kf = idx('K')[0] ?? -1;
  const qf = idx('Q')[0] ?? -1;
  const bs = idx('B');
  const centrality = (i: number): number => (i < 0 ? 0 : Math.min(i, 7 - i));   // 0 = corner, 3 = centre
  const nFairy = sum(FAIRY.map(count));

  const f: Record<string, number> = {
    fairyCount: nFairy,
    nA: count('A'), nL: count('L'), nG: count('G'), nM: count('M'), nS: count('S'),
    nQ: count('Q'), nR: count('R'), nB: count('B'), nN: count('N'),
    // King and queen placement. Chess960's own features, kept in the same shape (chess960.md §7.9).
    kingCentrality: centrality(kf),
    kingCorner: kf === 0 || kf === 7 ? 1 : 0,
    kingCentre: kf >= 2 && kf <= 5 ? 1 : 0,
    queenCentrality: centrality(qf),
    queenCorner: qf === 0 || qf === 7 ? 1 : 0,
    bishopCorners: bs.filter(i => i === 0 || i === 7).length,
    bishopsBothCorners: bs.length === 2 && bs.every(i => i === 0 || i === 7) ? 1 : 0,
    // Flank = the four outer files; centre = c-f. Short-range pieces in a corner are the
    // "corner knight is worst" hypothesis (chess960.md §7.10).
    fairyOnFlank: [...rank].filter((c, i) => FAIRY.includes(c) && (i < 2 || i > 5)).length,
    fairyInCentre: [...rank].filter((c, i) => FAIRY.includes(c) && i >= 2 && i <= 5).length,
    slidersOnFlank: [...rank].filter((c, i) => 'QRBL'.includes(c) && (i < 2 || i > 5)).length,
    // Distance of the short-range / sacrificial pieces from the king.
    distLK: distFrom(rank, 'L', kf), distAK: distFrom(rank, 'A', kf), distSK: distFrom(rank, 'S', kf),
    distGK: distFrom(rank, 'G', kf), distMK: distFrom(rank, 'M', kf),
    // Mirror asymmetry of the rank about its own centre: 0 = palindrome.
    mirrorBreaks: [...rank].filter((c, i) => c !== rank[7 - i]).length,
    // Total measured value of the seven non-king pieces (sim-results §14). The only all-standard
    // army is QRRBBNN at 32.0 pawns, so every fairy piece a rank takes on makes it lighter: this
    // column is the confound test for every `fairyCount` row below.
    armyValue: sum([...rank].map(c => VALUE[c])),
    materialSkew: Math.abs(sum([...rank].map((c, i) => (i < 4 ? 1 : -1) * VALUE[c]))),
  };
  // Adjacency: one column per unordered type pair that ever occurs. The named pairs of the brief
  // are always present (0 when absent) so the table shape does not depend on the sample.
  for (const p of NAMED_PAIRS) f[`adj_${p}`] = 0;
  for (let i = 0; i + 1 < 8; i++) {
    const k = `adj_${[at(i), at(i + 1)].sort().join('')}`;
    f[k] = (f[k] ?? 0) + 1;
  }
  f.adjKingFairy = FAIRY.reduce((a, p) => a + (f[`adj_${['K', p].sort().join('')}`] ?? 0), 0);
  return f;
}

/** Files between the nearest piece of type `p` and the king; 9 when the rank has no such piece. */
function distFrom(rank: string, p: string, kf: number): number {
  const ds = [...rank].flatMap((c, i) => (c === p ? [Math.abs(i - kf)] : []));
  return ds.length ? Math.min(...ds) : 9;
}

/** Measured values in pawns (sim-results §14; the three bounds sit at the band floor 1.70). */
export const VALUE: Record<string, number> = {
  K: 0, Q: 9.0, R: 5.0, B: 3.3, N: 3.2, P: 1.0,
  L: 3.06, M: 3.28, A: 1.7, G: 1.7, S: 1.7,
};

const NAMED_PAIRS = ['AG', 'KM', 'AA', 'SS', 'GK', 'KL', 'AK', 'KR', 'KQ', 'GG', 'MM', 'BB', 'NN', 'RR', 'AM', 'GS'];

// ---------------------------------------------------------------- per-rank accumulation

interface Acc {
  rank: string; n: number; score: number; wins: number; draws: number; losses: number; capped: number;
  plies: number; coverage: number;
  killerMove: number; leadChange: number; uncertaintyLate: number; permanence: number; dramaLead: number;
  branching: number; leadChanges: number; volatility: number; uncertainty: number;
  ev: Record<string, number>;
  moves: Record<string, number>; start: Record<string, number>;
  survived: Record<string, number>; taken: Record<string, number>; captures: Record<string, number>;
  /** Per start square (file index) and piece letter: games where that piece never left home. */
  homeGames: Record<string, number>; homeTotal: Record<string, number>;
}

const acc = (rank: string): Acc => ({
  rank, n: 0, score: 0, wins: 0, draws: 0, losses: 0, capped: 0, plies: 0, coverage: 0,
  killerMove: 0, leadChange: 0, uncertaintyLate: 0, permanence: 0, dramaLead: 0,
  branching: 0, leadChanges: 0, volatility: 0, uncertainty: 0,
  ev: {}, moves: {}, start: {}, survived: {}, taken: {}, captures: {},
  homeGames: {}, homeTotal: {},
});
const bump = (r: Record<string, number>, k: string, n = 1): void => { r[k] = (r[k] ?? 0) + n; };
const addAll = (into: Record<string, number>, from: Record<string, number>): void => {
  for (const [k, v] of Object.entries(from)) bump(into, k, v);
};

/** Everything section 2 counts, over the whole corpus rather than per rank. */
interface Global {
  games: number;
  chains: number[];                                   // beast chain lengths
  longSwapPly: number[]; swapGames: number; longSwapGames: number;
  promoTo: Record<string, number>;
  shotsByFile: number[];                              // archer shots by the shooter's own file
  /** Captures by destination, from the mover's point of view: [file][rank], rank 0 = mover's home. */
  capHeat: number[][];
  /** Per (piece, start file): games started, games the piece never left its square, moves made. */
  home: Record<string, { games: number; stayed: number }>;
  /** Per piece: first ply it ever moves, and whether it ever captures. */
  firstMove: Record<string, number[]>;
  everCaptured: Record<string, { has: number; did: number }>;
}

const emptyGlobal = (): Global => ({
  games: 0, chains: [], longSwapPly: [], swapGames: 0, longSwapGames: 0, promoTo: {},
  shotsByFile: Array(8).fill(0), capHeat: Array.from({ length: 8 }, () => Array(8).fill(0)),
  home: {}, firstMove: {}, everCaptured: {},
});

const sqFile = (s: string): number => s.charCodeAt(0) - 97;
const sqRank = (s: string): number => +s[1] - 1;
/** LAN piece letter; a pawn move has none. */
const lanPiece = (lan: string): string => (/^[A-Z]/.test(lan) ? lan[0] : 'P');

// ---------------------------------------------------------------- batch-3 spec generation

/** `mulberry32`, copied from `src/sim/rng.ts` so a spec file regenerates byte-identically. */
function rng32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * `n` distinct arrangements of one army (7 letters + K), each satisfying `ok`. Two bishops must
 * land on opposite square colours, which is `Rules.bishopsOppositeColours` and therefore what the
 * project's own sampler enforces; every generated rank is a legal back rank.
 */
function place(army: string, n: number, seed: number, ok: (r: string) => boolean = () => true): string[] {
  const r = rng32(seed);
  const letters = [...(army + 'K')];
  const out = new Set<string>();
  for (let guard = 0; out.size < n && guard < 400000; guard++) {
    const a = [...letters];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    const s = a.join('');
    const b = [...s].flatMap((c, i) => (c === 'B' ? [i] : []));
    if (b.length === 2 && (b[0] + b[1]) % 2 === 0) continue;
    if (ok(s)) out.add(s);
  }
  if (out.size < n) throw new Error(`only ${out.size}/${n} ranks for "${army}" under the constraint`);
  return [...out].sort();
}

const at = (r: string, p: string): number[] => [...r].flatMap((c, i) => (c === p ? [i] : []));
const kingAt = (r: string): number => r.indexOf('K');
const minGap = (r: string, p: string, i: number): number => {
  const xs = at(r, p).map(j => Math.abs(j - i));
  return xs.length ? Math.min(...xs) : 9;
};
const armyValue = (r: string): number => sum([...r].map(c => VALUE[c]));

interface Spec {
  id: string; games: number; seed: number; ai: { depth: number };
  backRanks?: string[]; asymmetric?: { white: string; black: string }[];
  commonSeeds?: boolean; pairs?: boolean; rules?: Record<string, unknown>;
  /** Not read by the runner; it keeps the hypothesis with the file that tests it. */
  note?: string;
}

/** The recommended buff set of sim-results §18.4, as a `rules` object. */
const BUFFS = { archerMove: 'any', guardCaptures: 'pawns', guardStep: 2, beastMove: 'any' };

function batch3(): Spec[] {
  const D = { depth: 3 };
  const N = 20;                       // placements per arm; the rank is the independent unit
  const G = 100;                      // games per placement unless stated
  const specs: Spec[] = [];
  const arm = (id: string, army: string, seed: number, games: number, note: string,
               ok?: (r: string) => boolean, rules?: Record<string, unknown>): void => {
    specs.push({ id, games: N * games, seed, ai: D, commonSeeds: true, backRanks: place(army, N, seed, ok), ...(rules ? { rules } : {}), note });
  };

  // 1. Army value against fairy count. L (3.06) and M (3.28) price at a knight, so fairy count can
  //    be raised 0 -> 3 with the army value held inside 0.25 pawns. Beyond 3 it cannot: A, G and S
  //    are each <= 1.70, so a 4+ fairy army is necessarily lighter. That is the whole confound.
  arm('b3-val-f0', 'QRRBBNN', 301, G, 'fairy 0, army 32.00 pawns — the only all-standard army there is');
  arm('b3-val-f1', 'QRRBBNL', 302, G, 'fairy 1, army 31.86 — N->L, iso-value');
  arm('b3-val-f2', 'QRRBBML', 303, G, 'fairy 2, army 31.94 — iso-value');
  arm('b3-val-f3', 'QRRBMML', 304, G, 'fairy 3, army 31.92 — iso-value; if pace still slows, fairy count is its own effect');

  // 2. The other half: fairy count fixed at 3, army value stepped down.
  arm('b3-iso-v32', 'QRRBMML', 311, G, 'fairy 3, army 31.92 (same arm as b3-val-f3, re-seeded)');
  arm('b3-iso-v27', 'QRRBAAG', 312, G, 'fairy 3, army 27.40');
  arm('b3-iso-v22', 'RRBBAAG', 313, G, 'fairy 3, army 21.70 — pace should track value, not fairy count');

  // 3. Guard count at fixed value AND fixed fairy count: A and G are both bounded at 1.70, so
  //    A->G is the only swap in the game that changes nothing but the piece. H10 (fairy-values §10).
  arm('b3-guard0', 'QRRBAAN', 321, G, 'guards 0, army 28.90, fairy 2');
  arm('b3-guard1', 'QRRBAGN', 322, G, 'guards 1, army 28.90, fairy 2');
  arm('b3-guard2', 'QRRBGGN', 323, G, 'guards 2, army 28.90, fairy 2 — H10 predicts +10 draw points 0->2');

  // 4. The five ranks the sweep cannot certify, at 500 games each (sd 0.018 instead of 0.027).
  specs.push({
    id: 'b3-deep5', games: 2500, seed: 331, ai: D, commonSeeds: true,
    backRanks: ['SKANSGGR', 'BKMLQRGA', 'ARNAKSNG', 'NAGQKGBM', 'GRMGKNBB'],
    note: 'two most lopsided and two most interesting ranks at n=240, plus the biggest raw outlier at n=80',
  });

  // 5-6. Placement: the corner is where a one-square piece goes to die (chess960.md §7.10).
  arm('b3-archer-corner', 'QRRBBAA', 341, 160, 'both archers on a/h', r => at(r, 'A').every(i => i === 0 || i === 7));
  arm('b3-archer-centre', 'QRRBBAA', 342, 160, 'both archers on d/e', r => at(r, 'A').every(i => i === 3 || i === 4));
  arm('b3-beast-corner', 'QRRBBSS', 343, 160, 'both beasts on a/h', r => at(r, 'S').every(i => i === 0 || i === 7));
  arm('b3-beast-centre', 'QRRBBSS', 344, 160, 'both beasts on d/e', r => at(r, 'S').every(i => i === 3 || i === 4));

  // 7. Rule removals, on top of the §18.4 buff set, over one shared set of ranks and seeds.
  const ruleRanks = place('QLRBAGM', N, 351);
  for (const [id, extra, note] of [
    ['b3-rule-base', {}, 'the §18.4 buff set alone — the base every removal is paired against'],
    ['b3-rule-noArcherCheck', { archerChecks: false }, 'archerChecks=false: can a buffed archer lose the check and keep its value?'],
    ['b3-rule-noGuardImmune', { guardImmune: false }, 'guardImmune=false: is the wall still a wall once it can be taken?'],
    ['b3-rule-noLongSwap', { maesterLongSwap: false }, 'maesterLongSwap=false: the swap is castling (43% of games, median ply 11)'],
  ] as const) {
    specs.push({ id, games: N * G, seed: 351, ai: D, commonSeeds: true, backRanks: ruleRanks, rules: { ...BUFFS, ...extra }, note });
  }

  // 8. Thematic armies matched on the measured values, played against each other.
  const court = place('AAGMMQN', N, 361), horde = place('SSLQBBG', N, 362);
  specs.push({
    id: 'b3-armies', games: N * G, seed: 361, ai: D, commonSeeds: true, pairs: true,
    asymmetric: court.map((w, i) => ({ white: w, black: horde[i] })),
    note: 'court AAGMMQN 23.86 pawns vs horde SSLQBBG 23.76 — matched on the measured values, so 0.500 or the values do not add',
  });

  // 9. Mirrored against independently drawn black, same fairy count on both sides.
  const mw = place('QRRBAGM', N, 371), mb = place('QRRBAGM', N, 372);
  arm('b3-mirror-same', 'QRRBAGM', 371, G, 'mirrored: both sides get the same rank (today\'s default)');
  specs.push({
    id: 'b3-mirror-indep', games: N * G, seed: 372, ai: D, commonSeeds: true, pairs: true,
    asymmetric: mw.map((w, i) => ({ white: w, black: mb[i] })),
    note: 'same army, drawn independently per side — does mirroring hide imbalance?',
  });

  // 10-11. The two adjacency hypotheses the sweep could not resolve.
  arm('b3-maester-beside-K', 'QRRBBMM', 381, 160, 'a maester next to the king', r => minGap(r, 'M', kingAt(r)) === 1);
  arm('b3-maester-far-K', 'QRRBBMM', 382, 160, 'every maester >= 3 files from the king', r => minGap(r, 'M', kingAt(r)) >= 3);
  arm('b3-archer-beside-G', 'QRBAAGG', 391, 160, 'an archer next to a guard (H4: guards wall, archers shoot through)',
    r => at(r, 'A').some(i => at(r, 'G').some(j => Math.abs(i - j) === 1)));
  arm('b3-archer-far-G', 'QRBAAGG', 392, 160, 'no archer next to a guard', r => at(r, 'A').every(i => at(r, 'G').every(j => Math.abs(i - j) > 1)));

  // 12. Drop the beast from the sampler: it sets the utilisation gate for four ranks in five.
  arm('b3-nobeast', 'QLRBAGM', 401, 160, 'a pool with no beast; every other term should be unchanged');

  // 13. Two paladins against two knights, near iso-value.
  arm('b3-paladin2', 'QRBBNLL', 411, G, 'two paladins, army 29.92 — is a second kamikaze superlinear?');
  arm('b3-paladin0', 'QRBBNNM', 412, G, 'the knight control, army 30.28');
  return specs;
}

function scan(rec: GameRecord, a: Acc, g: Global): void {
  const t = trajectory(rec), l = leadMetrics(rec);
  a.n++; a.score += rec.result;
  if (rec.result === 1) a.wins++; else if (rec.result === 0) a.losses++; else a.draws++;
  if (rec.reason === 'plyCap') a.capped++;
  a.plies += rec.plies; a.coverage += rec.coverage ?? 0;
  a.killerMove += l.killerMove; a.leadChange += l.leadChange; a.uncertaintyLate += l.uncertaintyLate;
  a.permanence += l.permanence; a.dramaLead += l.drama;
  a.branching += t.branchingFactor; a.leadChanges += t.leadChanges;
  a.volatility += t.volatility; a.uncertainty += t.uncertainty;

  const e = rec.events;
  const pair = (x: readonly number[]): number => x[0] + x[1];
  bump(a.ev, 'archerShots', pair(e.archerShots));
  bump(a.ev, 'maesterSwaps', pair(e.maesterSwaps));
  bump(a.ev, 'maesterLongSwaps', pair(e.maesterLongSwaps));
  bump(a.ev, 'paladinSacrifices', pair(e.paladinSacrifices));
  bump(a.ev, 'promotions', pair(e.promotions));
  bump(a.ev, 'checks', pair(e.checks));
  bump(a.ev, 'beastChainMoves', e.beastChains[0].length + e.beastChains[1].length);

  for (const side of rec.stats) {
    addAll(a.moves, side.moves); addAll(a.start, side.start);
    addAll(a.survived, side.survived); addAll(a.taken, side.taken); addAll(a.captures, side.captures);
  }

  // ---- global, per game
  g.games++;
  for (const side of e.beastChains) g.chains.push(...side);
  if (pair(e.maesterSwaps) > 0) g.swapGames++;
  if (pair(e.maesterLongSwaps) > 0) g.longSwapGames++;

  // Which back-rank pieces ever left home, and where the captures land.
  const wr = rec.backRankWhite, br = rec.backRankBlack;
  const left = new Set<string>();               // "w3" = white's piece on file 3 has moved
  const capturedBy = new Set<string>();
  rec.moves.forEach((m, ply) => {
    const lan = m.lan;
    const white = moverAt(ply, rec.rules ?? {}) === WHITE;
    const p = lanPiece(lan);
    const body = lan.replace(/^[A-Z]/, '');
    const from = body.slice(0, 2);
    const ff = sqFile(from), fr = sqRank(from);
    if ((white && fr === 0) || (!white && fr === 7)) left.add(`${white ? 'w' : 'b'}${ff}`);
    (g.firstMove[p] ??= []).push(ply);
    // Shots: `Af4*e5` (the archer stays put). Captures: `-`/`x`/`*`, chains repeat `x`.
    if (lan.includes('*')) g.shotsByFile[ff]++;
    for (const mm of body.matchAll(/[x*]([a-h][1-8])/g)) {
      const tf = sqFile(mm[1]), tr = sqRank(mm[1]);
      g.capHeat[tf][white ? tr : 7 - tr]++;
      capturedBy.add(p);
    }
    if (lan.includes('<>')) {
      const to = body.slice(-2);
      if (Math.abs(sqFile(to) - ff) > 1) { g.longSwapPly.push(ply); }
    }
    const promo = /=([A-Z])$/.exec(lan);
    if (promo) bump(g.promoTo, promo[1], 1);
  });
  for (const [side, rank] of [['w', wr], ['b', br]] as const) {
    [...rank].forEach((p, i) => {
      const k = `${p}@${FILE[i]}`;
      const h = (g.home[k] ??= { games: 0, stayed: 0 });
      h.games++;
      if (!left.has(`${side}${i}`)) h.stayed++;
      bump(a.homeTotal, k); if (!left.has(`${side}${i}`)) bump(a.homeGames, k);
    });
    for (const p of new Set(rank)) {
      const c = (g.everCaptured[p] ??= { has: 0, did: 0 });
      c.has++; if (capturedBy.has(p)) c.did++;
    }
  }
}

// ---------------------------------------------------------------- derived per-rank row

interface Row extends Record<string, number> { }

function rowOf(a: Acc): Record<string, number> {
  const n = a.n || 1;
  const totalMoves = sum(Object.values(a.moves)), totalStart = sum(Object.values(a.start));
  const util = (p: string): number => {
    const s = a.start[p] ?? 0;
    return s > 0 ? ((a.moves[p] ?? 0) / (totalMoves || 1)) / (s / (totalStart || 1)) : NaN;
  };
  const fairyUse = FAIRY.map(util).filter(x => !Number.isNaN(x));
  return {
    n: a.n,
    score: a.score / n,
    imbalance: Math.abs(a.score / n - 0.5),
    drawRate: (a.draws - a.capped) / n,
    decisiveness: (a.wins + a.losses) / n,
    capped: a.capped / n,
    plies: a.plies / n,
    branching: a.branching / n,
    coverage: a.coverage / n,
    killerMove: a.killerMove / n,
    leadChange: a.leadChange / n,
    uncertaintyLate: a.uncertaintyLate / n,
    permanence: a.permanence / n,
    dramaLead: a.dramaLead / n,
    volatility: a.volatility / n,
    minFairyUse: fairyUse.length ? Math.min(...fairyUse) : 1,
    archerShots: (a.ev.archerShots ?? 0) / n,
    maesterSwaps: (a.ev.maesterSwaps ?? 0) / n,
    maesterLongSwaps: (a.ev.maesterLongSwaps ?? 0) / n,
    paladinSacs: (a.ev.paladinSacrifices ?? 0) / n,
    beastChains: (a.ev.beastChainMoves ?? 0) / n,
    checks: (a.ev.checks ?? 0) / n,
    promotions: (a.ev.promotions ?? 0) / n,
    ...Object.fromEntries(ALL.map(p => [`surv_${p}`, (a.start[p] ?? 0) ? (a.survived[p] ?? 0) / a.start[p] : NaN])),
    ...Object.fromEntries(ALL.map(p => [`use_${p}`, util(p)])),
  };
}

// ---------------------------------------------------------------- main

async function readRun(id: string, byRank: Map<string, Acc>, g: Global): Promise<number> {
  let n = 0;
  const rl = createInterface({ input: createReadStream(`sim/out/${id}.jsonl`), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line) as GameRecord;
    const key = rec.backRankWhite === rec.backRankBlack ? rec.backRankWhite : rec.configId;
    let a = byRank.get(key);
    if (!a) byRank.set(key, (a = acc(key)));
    scan(rec, a, g);
    n++;
  }
  return n;
}

async function main(): Promise<void> {
  const f = parseFlags(process.argv.slice(2));
  if (f.specs) {
    const dir = 'sim/specs/batch3';
    mkdirSync(dir, { recursive: true });
    const specs = batch3();
    let games = 0;
    for (const s of specs) {
      writeFileSync(`${dir}/${s.id}.json`, JSON.stringify(s, null, 2) + '\n');
      games += s.games;
    }
    console.log(table(['spec', 'games', 'min @5/s', 'ranks', 'army', 'value', 'note'],
      specs.map(s => {
        const r = s.backRanks?.[0] ?? s.asymmetric?.[0].white ?? '';
        return [s.id, String(s.games), (s.games / 300).toFixed(0), String((s.backRanks ?? s.asymmetric ?? []).length),
          [...r].filter(c => c !== 'K').sort().join(''), armyValue(r).toFixed(2), s.note ?? ''];
      })));
    console.log(`\n${specs.length} specs -> ${dir}/  •  ${games} games  •  ${(games / 300 / 60).toFixed(1)} h at 5 games/s`);
    return;
  }
  const runs = (typeof f.runs === 'string' ? f.runs : 'sweep-p2.r1,sweep-p2.r2').split(',');
  const min = typeof f.min === 'string' ? +f.min : 80;
  const only = typeof f.section === 'string' ? f.section.split(',') : ['1', '2', '3'];

  const byRank = new Map<string, Acc>();
  const g = emptyGlobal();
  let games = 0;
  for (const id of runs) games += await readRun(id, byRank, g);

  const kept = [...byRank.values()].filter(a => a.n >= min).sort((a, b) => a.rank.localeCompare(b.rank));
  const rows = kept.map(rowOf);
  const feat = kept.map(a => features(a.rank));
  const names = [...new Set(feat.flatMap(Object.keys))].filter(k => sd(feat.map(x => x[k] ?? 0)) > 0);

  console.log(`# mine — ${runs.join(' + ')}: ${games} games, ${byRank.size} back ranks, ${kept.length} with n >= ${min}\n`);

  // The pool's own White edge is the null, not 0.5 (sim-results §15 caveat 1).
  const poolScore = sum(rows.map(r => r.score * r.n)) / sum(rows.map(r => r.n));
  const col = (k: string): number[] => rows.map(r => r[k]);
  const interest = rows.map(r =>
    INTEREST.killerMove * r.killerMove + INTEREST.leadChange * r.leadChange
    + INTEREST.uncertaintyLate * r.uncertaintyLate + INTEREST.drama * r.dramaLead
    + INTEREST.permanence * r.permanence + INTEREST.fairyUse * Math.min(1, r.minFairyUse));
  // excessDecisiveness needs the pool, so it is fitted here and then folded in (analyze.ts §4).
  const xdec = residuals(col('imbalance'), col('decisiveness'));
  const interestFull = interest.map((v, i) => v + INTEREST.excessDecisiveness * ((Math.max(-1, Math.min(1, xdec[i])) + 1) / 2));
  const interestResid = residuals(col('drawRate'), interestFull);
  // The +0.20 fairyUse term is a *minimum* over the fairy types present, so one ornamental piece
  // sets it for the whole rank. Keep a copy without that term, to tell "this rank plays well" from
  // "this rank happens to contain no beast".
  const interestNoUse = interestFull.map((v, i) => v - INTEREST.fairyUse * Math.min(1, rows[i].minFairyUse));
  const interestNoUseResid = residuals(col('drawRate'), interestNoUse);
  rows.forEach((r, i) => {
    r.interest = interestFull[i]; r.interestResid = interestResid[i]; r.xdec = xdec[i];
    r.interestNoUse = interestNoUse[i]; r.interestNoUseResid = interestNoUseResid[i];
  });
  const imbPool = rows.map(r => Math.abs(r.score - poolScore));
  rows.forEach((r, i) => { r.imbalancePool = imbPool[i]; });

  const noise = Math.sqrt(mean(rows.map(r => 0.41 ** 2 / r.n)));   // sigma_pg = 0.41 (sim-results §15)

  if (only.includes('1')) {
    console.log('## 1a. Per back rank\n');
    console.log(table(
      ['rank', 'n', 'score', 'draw', 'capped', 'plies', 'branch', 'killer', 'uncLate', 'drama', 'minFUse', 'xDec', 'interest', 'iResid', 'shots/g', 'swaps/g', 'long/g', 'sacs/g', 'chain/g'],
      [...rows].map((r, i) => [kept[i].rank, String(r.n), f2(r.score), f2(r.drawRate), f2(r.capped), f2(r.plies, 0),
        f2(r.branching, 1), f2(r.killerMove), f2(r.uncertaintyLate), f2(r.dramaLead), f2(r.minFairyUse, 2), f2(r.xdec),
        f2(r.interest), f2(r.interestResid), f2(r.archerShots, 2), f2(r.maesterSwaps, 2), f2(r.maesterLongSwaps, 2),
        f2(r.paladinSacs, 2), f2(r.beastChains, 2)])
        .sort((a, b) => +b[2] - +a[2])));
    console.log(`\npool white score ${f2(poolScore)}; sampling sd of one rank's score ~ ${f2(noise)}\n`);

    console.log('## 1b. Per-rank piece survival (share of starters alive at the end) and utilisation\n');
    console.log(table(['piece', 'ranks', 'survival mean', 'sd', 'utilisation mean', 'sd'],
      ALL.map(p => {
        const s = rows.map(r => r[`surv_${p}`]).filter(x => !Number.isNaN(x));
        const u = rows.map(r => r[`use_${p}`]).filter(x => !Number.isNaN(x));
        return [p, String(s.length), f2(mean(s)), f2(sd(s)), f2(mean(u), 2), f2(sd(u), 2)];
      })));

    console.log('\n## 1c. Feature -> outcome correlations (Pearson r, |t| > 2 beats the noise)\n');
    const targets: [string, number[]][] = [
      ['imbalance|0.5', col('imbalance')], ['imbalance|pool', imbPool], ['score', col('score')],
      ['drawRate', col('drawRate')], ['plies', col('plies')], ['interest', interestFull],
      ['interest|resid', interestResid], ['iNoUse|resid', interestNoUseResid], ['branching', col('branching')],
    ];
    const cells = names.map(k => {
      const x = feat.map(v => v[k] ?? 0);
      return { k, x, cs: targets.map(([, y]) => corr(x, y)) };
    });
    // Sort by the largest |t| anywhere, so the rows that matter come first.
    cells.sort((a, b) => Math.max(...b.cs.map(c => Math.abs(c.t))) - Math.max(...a.cs.map(c => Math.abs(c.t))));
    console.log(table(['feature', 'range', ...targets.map(t => t[0])],
      cells.map(c => [c.k, `${Math.min(...c.x)}-${Math.max(...c.x)}`,
        ...c.cs.map(s => `${f2(s.r, 2)}${Math.abs(s.t) > 2 ? '*' : ' '}`)])));
    console.log(`\nn = ${kept.length} ranks; * marks |t| > 2 (two-sided p < 0.05, uncorrected).`);
    console.log(`With ${names.length} features x ${targets.length} targets, expect about ${Math.round(names.length * targets.length * 0.05)} stars by chance.`);

    // The correlation scan finds candidates; this reads them back in game units, which is what a
    // design decision needs. The error bar is over *ranks*, because the rank is the independent
    // unit -- games inside one rank share an arrangement.
    console.log('\n## 1d. The design knobs, read in game units (± is over ranks, the independent unit)\n');
    for (const key of ['nS', 'nG', 'nA', 'nM', 'nL', 'nQ', 'fairyCount']) {
      const vals = [...new Set(feat.map(v => v[key] ?? 0))].sort((a, b) => a - b);
      const bucket = vals.map(v => [...rows.keys()].filter(i => (feat[i][key] ?? 0) === v));
      console.log(table([key, 'ranks', 'games', 'score', 'draw', 'plies', 'interest', 'iNoUse', 'minFUse'],
        vals.map((v, j) => {
          const sel = bucket[j];
          const se = (f: (i: number) => number): string => `${f2(mean(sel.map(f)))}±${f2(sd(sel.map(f)) / Math.sqrt(Math.max(1, sel.length)), 3)}`;
          return [String(v), String(sel.length), String(sum(sel.map(i => rows[i].n))),
            se(i => rows[i].score), se(i => rows[i].drawRate),
            `${f2(mean(sel.map(i => rows[i].plies)), 0)}±${f2(sd(sel.map(i => rows[i].plies)) / Math.sqrt(Math.max(1, sel.length)), 0)}`,
            se(i => rows[i].interest), se(i => rows[i].interestNoUse), f2(mean(sel.map(i => rows[i].minFairyUse)), 2)];
        })));
      console.log('');
    }
  }

  if (only.includes('2')) {
    console.log('\n## 2a. Events per game (whole corpus)\n');
    const per = (k: string): number => sum(kept.map(a => a.ev[k] ?? 0)) / g.games;
    console.log(table(['event', 'per game'], [
      ['archer shots', f2(per('archerShots'), 2)],
      ['maester swaps', f2(per('maesterSwaps'), 2)],
      ['maester LONG swaps', f2(per('maesterLongSwaps'), 2)],
      ['paladin sacrifices', f2(per('paladinSacrifices'), 2)],
      ['beast chain moves', f2(per('beastChainMoves'), 2)],
      ['promotions', f2(per('promotions'), 2)],
      ['checks', f2(per('checks'), 2)],
      ['games with any maester swap', f2(g.swapGames / g.games, 3)],
      ['games with a LONG swap', f2(g.longSwapGames / g.games, 3)],
      ['median long-swap ply', f2(median(g.longSwapPly), 0)],
    ]));
    const hist: Record<number, number> = {};
    for (const c of g.chains) bump(hist as unknown as Record<string, number>, String(c));
    console.log(`\nbeast chain-length histogram (captures per chain move): ${JSON.stringify(hist)}`);
    console.log(`promotion targets: ${JSON.stringify(g.promoTo)}`);

    console.log('\n## 2b. Does the piece ever act? (per game a side holds one)\n');
    console.log(table(['piece', 'games held', 'ever captured with it', 'share'],
      ALL.filter(p => g.everCaptured[p]).map(p => {
        const c = g.everCaptured[p];
        return [p, String(c.has), String(c.did), f2(c.did / c.has)];
      }).sort((a, b) => +a[3] - +b[3])));

    console.log('\n## 2c. Dead weight by start square: share of games the piece never leaves it\n');
    const byPiece = new Map<string, string[]>();
    for (const k of Object.keys(g.home)) {
      const p = k[0];
      (byPiece.get(p) ?? byPiece.set(p, []).get(p)!).push(k);
    }
    console.log(table(['piece', ...FILE, 'mean'],
      [...byPiece.keys()].filter(p => p !== 'P').sort().map(p => {
        const cells = FILE.map(fl => {
          const h = g.home[`${p}@${fl}`];
          return h && h.games >= 30 ? f2(h.stayed / h.games, 2) : '-';
        });
        const tot = FILE.map(fl => g.home[`${p}@${fl}`]).filter(Boolean);
        return [p, ...cells, f2(sum(tot.map(h => h.stayed)) / sum(tot.map(h => h.games)), 2)];
      })));
    console.log('\n(1.00 = the piece is still on its start square when the game ends, every game.)');

    console.log('\n## 2d. Archer shots by the shooting archer\'s file\n');
    console.log(table(['file', ...FILE], [['shots', ...g.shotsByFile.map(String)]]));

    console.log('\n## 2e. Capture heat map, from the capturing side\'s point of view\n');
    console.log(table(['rank', ...FILE],
      [...Array(8).keys()].reverse().map(r => [`${r + 1}`, ...FILE.map((_, c) => String(g.capHeat[c][r]))])));
    console.log('\n(rank 1 = the capturing side\'s own back rank, rank 8 = the enemy back rank.)');
  }

  if (only.includes('3')) {
    console.log('\n## 3. The extremes\n');
    const show = (title: string, order: number[], k: string): void => {
      console.log(`### ${title}\n`);
      console.log(table(['rank', 'n', 'score', 'draw', 'plies', 'interest', k, 'fairy', 'K file', 'nG', 'nA', 'nS', 'nL', 'nM', 'adjKfairy'],
        order.map(i => {
          const v = feat[i];
          return [kept[i].rank, String(rows[i].n), f2(rows[i].score), f2(rows[i].drawRate), f2(rows[i].plies, 0),
            f2(rows[i].interest), f2(rows[i][k]), String(v.fairyCount),
            FILE[kept[i].rank.indexOf('K')], String(v.nG), String(v.nA), String(v.nS), String(v.nL), String(v.nM), String(v.adjKingFairy)];
        })));
      const mn = (sel: number[], key: string): number => mean(sel.map(i => feat[i][key] ?? 0));
      console.log(`\nmeans: fairyCount ${f2(mn(order, 'fairyCount'), 2)}, nG ${f2(mn(order, 'nG'), 2)}, nA ${f2(mn(order, 'nA'), 2)}, nS ${f2(mn(order, 'nS'), 2)}, nM ${f2(mn(order, 'nM'), 2)}, nL ${f2(mn(order, 'nL'), 2)}, nQ ${f2(mn(order, 'nQ'), 2)}, kingCentrality ${f2(mn(order, 'kingCentrality'), 2)}, fairyOnFlank ${f2(mn(order, 'fairyOnFlank'), 2)}, drawRate ${f2(mean(order.map(i => rows[i].drawRate)), 3)}, plies ${f2(mean(order.map(i => rows[i].plies)), 0)}\n`);
    };
    const order = (key: string, dir: number): number[] =>
      [...rows.keys()].sort((a, b) => dir * (rows[b][key] - rows[a][key])).slice(0, 10);
    show('Top 10 by residual interest', order('interestResid', 1), 'interestResid');
    show('Bottom 10 by residual interest', order('interestResid', -1), 'interestResid');
    show('Top 10 by residual interest WITHOUT the fairy-use term', order('interestNoUseResid', 1), 'interestNoUseResid');
    show('Bottom 10 by residual interest WITHOUT the fairy-use term', order('interestNoUseResid', -1), 'interestNoUseResid');
    show('Top 10 by imbalance against the pool mean', order('imbalancePool', 1), 'imbalancePool');
    show('Most balanced 10 against the pool mean', order('imbalancePool', -1), 'imbalancePool');
  }
}

const median = (xs: readonly number[]): number => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[s.length >> 1];
};

main().catch(e => { console.error(e); process.exit(1); });
