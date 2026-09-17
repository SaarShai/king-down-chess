/**
 * Guard activity, drag and pool checks for the Warden study (docs/research/sim-warden-2026-09-13.md).
 *
 *   npx tsx tools/warden-report.ts --runs ab-warden-wall,ab-warden-a.var,ab-warden-b.var,ab-warden-ctrl.var
 *   npx tsx tools/warden-report.ts --runs ab-warden-a.var --excerpts 12
 *
 * Reads `sim/out/<run>.jsonl` and replays each game's LAN list on a plain 64-byte board. Only
 * `moverAt` is imported from `src/`: another agent owns those files, and a half-written module would
 * break this tool (LESSONS.md) — but which side played ply i is a rule, not arithmetic, and a second
 * copy of it is how the parity bug survived (LESSONS.md 2026-09-14). The replayer is ported from
 * `tools/guard-study.ts` §board, which `--verify` checked against the runner's own survival census
 * on 2 004 games with 0 mismatches.
 *
 * Every rule is read off the *moves*, never off the stored spec: a recorded `rules: {}` means "the
 * defaults on the day the run played", and the guard defaults have changed twice (LESSONS.md).
 */
import { readFileSync, existsSync } from 'node:fs';
import { moverAt } from '../src/rules/engine';

// ------------------------------------------------------------------ board (letters as bytes)

const EMPTY = 0;
const up = (p: number): number => p & 0xdf;                 // 'q' -> 'Q'
const isWhite = (p: number): boolean => p !== 0 && p < 97;   // uppercase byte
const F = (s: number): number => s & 7;
const R = (s: number): number => s >> 3;
const parseSq = (n: string): number => ((n.charCodeAt(1) - 49) << 3) | (n.charCodeAt(0) - 97);
const sqName = (s: number): string => `${'abcdefgh'[F(s)]}${R(s) + 1}`;
const cheb = (a: number, b: number): number => Math.max(Math.abs(F(a) - F(b)), Math.abs(R(a) - R(b)));
const C = (ch: string): number => ch.charCodeAt(0);
const [G_, K_, P_, Q_, R_, B_, L_] = ['G', 'K', 'P', 'Q', 'R', 'B', 'L'].map(C);

const DIRS: readonly [number, number][] =
  [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const step = (s: number, df: number, dr: number): number => {
  const f = F(s) + df, r = R(s) + dr;
  return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : (r << 3) | f;
};

function fromFen(fen: string): Uint8Array {
  const board = new Uint8Array(64);
  const rows = fen.trim().split(/\s+/)[0].split('/');
  rows.forEach((row, i) => {
    let f = 0;
    for (const ch of row) {
      if (ch >= '0' && ch <= '9') { f += +ch; continue; }
      board[((7 - i) << 3) | f++] = C(ch);
    }
  });
  return board;
}

function toFen(board: Uint8Array, turn: 0 | 1, ply: number): string {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = '', empty = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[(r << 3) | f];
      if (!p) { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      row += String.fromCharCode(p);
    }
    rows.push(row + (empty || ''));
  }
  return `${rows.join('/')} ${turn ? 'b' : 'w'} - - 0 ${Math.floor(ply / 2) + 1}`;
}

/**
 * Apply one LAN string (src/rules/setup.ts `toLan`): `Nb1-c3`, `Bc4xf7`, `Ae4*d5` (shot, the mover
 * stays), `Ma1<>e1` (swap), `Sd4xe5xf6` (beast chain, lands on the last victim), `e7-e8=Q`.
 * A paladin that captures removes itself (`paladinKamikaze: 'always'`, the default in every run here).
 */
function applyLan(board: Uint8Array, lan: string): void {
  const m = /^([PNBRQKALGMSH]?)([a-h][1-8])(<>|\*|-|x)(.*)$/.exec(lan);
  if (!m) throw new Error(`bad LAN ${lan}`);
  const [, , fromN, op, rest] = m;
  const from = parseSq(fromN);
  const mover = board[from];
  if (op === '<>') {
    const to = parseSq(rest);
    [board[from], board[to]] = [board[to], board[from]];
    return;
  }
  if (op === '*') { board[parseSq(rest)] = EMPTY; return; }
  const parts = rest.split('x');
  const last = parts[parts.length - 1];
  const promo = last.includes('=') ? last.split('=')[1] : '';
  const to = parseSq(last.slice(0, 2));
  if (op === 'x') for (const p of parts) board[parseSq(p.slice(0, 2))] = EMPTY;
  board[from] = EMPTY;
  const kamikaze = op === 'x' && up(mover) === L_;
  board[to] = kamikaze ? EMPTY : promo ? (isWhite(mover) ? C(promo) : C(promo.toLowerCase())) : mover;
}

// ------------------------------------------------------------------ records

interface Ply { lan: string }
interface Rec {
  gameId: number; configId: string; backRankWhite: string; backRankBlack: string;
  startFen: string; result: 1 | 0.5 | 0; reason: string; plies: number; moves: Ply[];
  /** The run's rule diff, stamped on every line since 2026-09-14; older files carry none ({} = defaults). */
  rules?: { secondPlayerDoubleFirstTurn?: boolean };
}

// ------------------------------------------------------------------ position predicates

/** Squares holding a guard of one colour. */
function guardSqs(board: Uint8Array, white: boolean): number[] {
  const out: number[] = [];
  for (let s = 0; s < 64; s++) { const p = board[s]; if (p && up(p) === G_ && isWhite(p) === white) out.push(s); }
  return out;
}
const kingSq = (board: Uint8Array, white: boolean): number => {
  for (let s = 0; s < 64; s++) { const p = board[s]; if (p && up(p) === K_ && isWhite(p) === white) return s; }
  return -1;
};
/** Non-king pieces of one colour. */
function forceCount(board: Uint8Array, white: boolean): number {
  let n = 0;
  for (const p of board) if (p && isWhite(p) === white && up(p) !== K_) n++;
  return n;
}

/**
 * Is a guard of `white` the one piece between an enemy slider and its own king? Walk the 8 rays out
 * of the king: the first occupant must be the friendly guard, the next an enemy Q/R/B that moves
 * along that ray. The paladin is left out on purpose — it can never capture a king
 * (`paladinChecks: false`), so it never has a ray *to* the king to be blocked.
 */
function shieldsRay(board: Uint8Array, king: number, white: boolean): number {
  if (king < 0) return 0;
  let n = 0;
  for (const [df, dr] of DIRS) {
    let s = step(king, df, dr), first = -1;
    for (; s >= 0; s = step(s, df, dr)) if (board[s]) { first = s; break; }
    if (first < 0) continue;
    const g = board[first];
    if (up(g) !== G_ || isWhite(g) !== white) continue;
    for (s = step(first, df, dr); s >= 0; s = step(s, df, dr)) {
      const p = board[s];
      if (!p) continue;
      if (isWhite(p) === white) break;
      const t = up(p), diag = df !== 0 && dr !== 0;
      if (t === Q_ || (t === R_ && !diag) || (t === B_ && diag)) n++;
      break;
    }
  }
  return n;
}

/** An enemy pawn within `d` ranks of the promotion rank the guard stands on. */
function pawnNear(board: Uint8Array, white: boolean, d = 3): boolean {
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p || up(p) !== P_ || isWhite(p) === white) continue;
    // Enemy of `white` promotes on rank 1 (index 0) when `white` is true.
    const togo = white ? R(s) : 7 - R(s);
    if (togo <= d) return true;
  }
  return false;
}

// ------------------------------------------------------------------ per-run accumulator

interface Side {
  sideGames: number; plies: number;
  moves: number; twoStep: number; swaps: number;
  squares: number; adj: number; shield: number; promoDeny: number; secondRank: number;
  shieldGames: number; promoGames: number; survived: number; takenByKing: number;
  drawn: number; dragLast3: number; dragAdj: number; dragEither: number;
}
const side = (): Side => ({
  sideGames: 0, plies: 0, moves: 0, twoStep: 0, swaps: 0, squares: 0, adj: 0, shield: 0,
  promoDeny: 0, secondRank: 0, shieldGames: 0, promoGames: 0, survived: 0, takenByKing: 0,
  drawn: 0, dragLast3: 0, dragAdj: 0, dragEither: 0,
});

interface Run {
  id: string; games: number; s: Side;
  guardsPerRank: Record<number, number>;   // how many ranks held 0 / 1 / 2 guards
  reasons: Record<string, number>;
  excerpts: { gameId: number; ply: number; lan: string; context: string; fen: string; tag: string }[];
}

interface Opt { excerpts: number }

function mineRun(id: string, opt: Opt): Run {
  const file = `sim/out/${id}.jsonl`;
  if (!existsSync(file)) throw new Error(`no such run: ${file}`);
  const run: Run = { id, games: 0, s: side(), guardsPerRank: {}, reasons: {}, excerpts: [] };
  const s = run.s;

  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line) continue;
    const rec = JSON.parse(line) as Rec;
    run.games++;
    run.reasons[rec.reason] = (run.reasons[rec.reason] ?? 0) + 1;
    for (const r of [rec.backRankWhite, rec.backRankBlack]) {
      const g = (r.match(/G/g) ?? []).length;
      run.guardsPerRank[g] = (run.guardsPerRank[g] ?? 0) + 1;
    }

    const board = fromFen(rec.startFen);
    const has: [boolean, boolean] = [guardSqs(board, true).length > 0, guardSqs(board, false).length > 0];
    if (!has[0] && !has[1]) continue;
    const seen: [Set<number>, Set<number>] = [new Set(), new Set()];
    const hit: [boolean, boolean][] = [[false, false], [false, false]];   // [shielded a ray, denied a promo square]
    for (const w of [0, 1]) for (const q of guardSqs(board, w === 0)) seen[w].add(q);

    for (let i = 0; i < rec.moves.length; i++) {
      const lan = rec.moves[i].lan;
      // Guard move / a king taking a guard / a maester swapping with one: read before the board moves.
      const m = /^([PNBRQKALGMSH]?)([a-h][1-8])(<>|\*|-|x)(.*)$/.exec(lan);
      if (m) {
        const from = parseSq(m[2]), op = m[3];
        const mover = board[from];
        if (up(mover) === G_) {
          s.moves++;
          if (op !== '*' && cheb(from, parseSq(m[4].split('x').pop()!.slice(0, 2))) === 2) s.twoStep++;
        }
        if (op === '<>' && up(board[parseSq(m[4])]) === G_) s.swaps++;
        if (op === 'x' && up(mover) === K_) {
          for (const p of m[4].split('x')) if (up(board[parseSq(p.slice(0, 2))]) === G_) s.takenByKing++;
        }
      }
      applyLan(board, lan);

      for (const w of [0, 1]) {
        if (!has[w]) continue;
        const white = w === 0;
        const gs = guardSqs(board, white);
        s.plies++;
        if (!gs.length) continue;
        for (const q of gs) seen[w].add(q);
        const k = kingSq(board, white);
        if (k >= 0 && gs.some(q => cheb(q, k) === 1)) s.adj++;
        if (shieldsRay(board, k, white) > 0) { s.shield++; hit[w][0] = true; }
        // The enemy promotes on rank 1 when `white`, rank 8 when black. A guard standing there only
        // *denies* anything once an enemy pawn is near it; without that test the column would read
        // "the guard has not left home yet" for most of the opening.
        if (gs.some(q => R(q) === (white ? 0 : 7)) && pawnNear(board, white)) { s.promoDeny++; hit[w][1] = true; }
        if (gs.some(q => R(q) === (white ? 1 : 6))) s.secondRank++;
      }

      if (opt.excerpts && m && up(board[parseSq(m[4].split('x').pop()!.slice(0, 2))] ?? 0) === G_) {
        const from = parseSq(m[2]), to = parseSq(m[4].split('x').pop()!.slice(0, 2));
        if (m[3] !== '*' && m[3] !== '<>' && cheb(from, to) === 2) {
          const white = isWhite(board[to]);
          const k = kingSq(board, white);
          const tag = shieldsRay(board, k, white) > 0 ? 'seal'
            // A true denial stands on the pawn's *own* file: the aggregate column below is looser
            // on purpose (it is a comparable proxy), but an excerpt has to show the block itself.
            : R(to) === (white ? 0 : 7) && (() => {
              for (let r = 0; r < 8; r++) {
                const q = (r << 3) | F(to), pc = board[q];
                if (pc && up(pc) === P_ && isWhite(pc) !== white && (white ? r : 7 - r) <= 3) return true;
              }
              return false;
            })() ? 'deny'
            : [...DIRS, [0, 0] as [number, number]].some(([df, dr]) => {
              const q = step(to, df, dr); if (q < 0) return false;
              const p = board[q];
              return !!p && up(p) === P_ && isWhite(p) === white && (white ? R(q) >= 4 : R(q) <= 3);
            }) ? 'escort' : '';
          // Cap per tag, not overall: the first N hits of a whole run are all the same trick.
          if (tag && run.excerpts.filter(e => e.tag === tag).length < opt.excerpts) run.excerpts.push({
            gameId: rec.gameId, ply: i + 1, lan, tag,
            context: rec.moves.slice(Math.max(0, i - 2), i + 3).map(x => x.lan).join(' '),
            fen: toFen(board, moverAt(i + 1, rec.rules ?? {}), i + 1),
          });
        }
      }
    }

    // End of game: survival and drag.
    for (const w of [0, 1]) {
      if (!has[w]) continue;
      const white = w === 0;
      s.sideGames++;
      s.squares += seen[w].size;
      if (hit[w][0]) s.shieldGames++;
      if (hit[w][1]) s.promoGames++;
      const gs = guardSqs(board, white);
      if (gs.length) s.survived++;
      if (rec.result === 0.5) {
        s.drawn++;
        const k = kingSq(board, white);
        const last3 = forceCount(board, white) <= 3 && gs.length > 0;
        const adj = k >= 0 && gs.some(q => cheb(q, k) === 1);
        if (last3) s.dragLast3++;
        if (adj) s.dragAdj++;
        if (last3 || adj) s.dragEither++;
      }
    }
  }
  return run;
}

// ------------------------------------------------------------------ output

const f2 = (x: number): string => (Number.isFinite(x) ? x.toFixed(2) : '—');
const pct = (a: number, b: number): string => (b ? `${((100 * a) / b).toFixed(1)}%` : '—');
const table = (head: string[], rows: (string | number)[][]): string =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n');

// ------------------------------------------------------------------ odds match, paired across arms

/**
 * Elo difference of two arms of the *same* odds match, paired game by game. `armStats` scores each
 * arm on its own, so the gap between two arms carries both arms' full error. Every arm here plays
 * one configuration, one seed and one opening stream per game index, so game *i* of one arm and
 * game *i* of another start from the same position: the paired difference removes the opening.
 */
function oddsPaired(runs: readonly string[]): void {
  const armScore = (file: string): Map<number, number> => {
    const m = new Map<number, number>();
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (!line) continue;
      const r = JSON.parse(line) as Rec & { colourSwapped: boolean };
      m.set(r.gameId, r.colourSwapped ? 1 - r.result : r.result);
    }
    return m;
  };
  const elo = (s: number): number => (s <= 0 || s >= 1 ? NaN : -400 * Math.log10(1 / s - 1));
  const base = armScore(`sim/out/${runs[0]}.G.jsonl`);
  const mu0 = [...base.values()].reduce((a, b) => a + b, 0) / (base.size || 1);
  // Elo per unit of score at the base arm's own score: the arms sit far from 0.5, where the
  // logistic is flat, so a slope taken at 0.5 would over-read every delta.
  const slope = 400 / (Math.LN10 * mu0 * (1 - mu0));
  const rows = runs.map(id => {
    const arm = armScore(`sim/out/${id}.G.jsonl`);
    const d: number[] = [];
    for (const [g, v] of arm) if (base.has(g)) d.push(v - base.get(g)!);
    const mu = d.reduce((a, b) => a + b, 0) / (d.length || 1);
    const v = d.reduce((a, b) => a + (b - mu) ** 2, 0) / Math.max(1, d.length - 1);
    const half = 1.959964 * Math.sqrt(v / (d.length || 1));
    const own = [...arm.values()].reduce((a, b) => a + b, 0) / (arm.size || 1);
    return [id, arm.size, own.toFixed(3), Number.isFinite(elo(own)) ? elo(own).toFixed(0) : '—',
      id === runs[0] ? '—' : `${mu >= 0 ? '+' : ''}${mu.toFixed(3)} ± ${half.toFixed(3)}`,
      id === runs[0] ? '—' : `${mu * slope >= 0 ? '+' : ''}${(mu * slope).toFixed(0)} ± ${(half * slope).toFixed(0)}`];
  });
  console.log('\n## Odds match vs a knight — paired across arms\n');
  console.log(table(['arm', 'games', 'score', 'Elo vs knight', 'paired Δ score vs the Wall', 'paired Δ Elo'], rows));
  console.log(`\nPaired game by game on the same openings. ${slope.toFixed(0)} Elo per unit of score at the Wall's own score.\n`);
}

const f: Record<string, string | true> = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) f[a.slice(2)] = process.argv[i + 1]?.startsWith('--') === false ? process.argv[++i] : true;
}
if (typeof f.odds === 'string') { oddsPaired(f.odds.split(',').filter(Boolean)); process.exit(0); }
const runs = String(f.runs ?? '').split(',').filter(Boolean);
if (!runs.length) { console.error('usage: --runs id1,id2,...  [--excerpts N] | --odds wall,a,b,ctrl'); process.exit(1); }
const opt: Opt = { excerpts: typeof f.excerpts === 'string' ? +f.excerpts : 0 };
const out = runs.map(id => mineRun(id, opt));

console.log('\n## Guard activity (per side-game that started with a guard)\n');
console.log(table(
  ['run', 'side-games', 'moves/game', '2-step/game', 'M-swaps/game', 'squares seen', 'adj. king (plies)', 'shields a king ray (plies/game)', '(games)', 'denies a promo square (games)', 'own 2nd rank (plies)', 'survival', 'taken by a king'],
  out.map(r => {
    const s = r.s;
    return [r.id, s.sideGames, f2(s.moves / (s.sideGames || 1)), f2(s.twoStep / (s.sideGames || 1)),
      f2(s.swaps / (s.sideGames || 1)), f2(s.squares / (s.sideGames || 1)),
      pct(s.adj, s.plies), f2(s.shield / (s.sideGames || 1)), pct(s.shieldGames, s.sideGames),
      pct(s.promoGames, s.sideGames), pct(s.secondRank, s.plies),
      pct(s.survived, s.sideGames), s.takenByKing];
  })));
console.log('\n`(plies)` columns are shares of the plies in which that side held a guard; `(games)` columns are shares of side-games with at least one such ply. Everything else is per side-game.\n');

console.log('\n## Guard drag (drawn games only)\n');
console.log(table(['run', 'drawn side-games', 'guard among last 3 non-king', 'guard adjacent to its king', 'either'],
  out.map(r => {
    const s = r.s;
    return [r.id, s.drawn, pct(s.dragLast3, s.drawn), pct(s.dragAdj, s.drawn), pct(s.dragEither, s.drawn)];
  })));

console.log('\n## Guards per back rank (the pool check)\n');
const keys = [...new Set(out.flatMap(r => Object.keys(r.guardsPerRank).map(Number)))].sort();
console.log(table(['run', 'ranks (side-games)', ...keys.map(k => `${k} guards`)],
  out.map(r => [r.id, Object.values(r.guardsPerRank).reduce((a, b) => a + b, 0),
    ...keys.map(k => `${r.guardsPerRank[k] ?? 0}`)])));

console.log('\n## End reasons\n');
const rk = [...new Set(out.flatMap(r => Object.keys(r.reasons)))].sort();
console.log(table(['run', 'games', ...rk], out.map(r => [r.id, r.games, ...rk.map(k => pct(r.reasons[k] ?? 0, r.games))])));

for (const r of out) {
  if (!r.excerpts.length) continue;
  console.log(`\n## Excerpts — ${r.id}\n`);
  for (const e of r.excerpts) console.log(`- **${e.tag}** #${e.gameId} ply ${e.ply} \`${e.lan}\`\n  - \`${e.context}\`\n  - \`${e.fen}\``);
}
