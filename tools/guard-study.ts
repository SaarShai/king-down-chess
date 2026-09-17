/**
 * Guard study: what the immortal guard actually does in the 130 000 recorded games, and whether it
 * drags the game to a draw (docs/research/guard-study-2026-09-13.md).
 *
 * Only runs whose recorded rule diff leaves the three guard toggles alone are read: `guardCaptures`
 * none, `guardImmune` true, `guardStep` 1. Everything else is the lab's capturing guard and answers
 * a different question.
 *
 * It replays each game's LAN list on a plain 64-byte board. No move generation and one import from
 * `src/` (LESSONS: a cross-cutting tool must not break when another agent is mid-edit): every LAN
 * string carries the from square, the to square and every victim, so a replay needs no rules — but
 * *which side* played ply i is a rule (`secondPlayerDoubleFirstTurn`), so `moverAt` is imported
 * rather than re-derived from ply parity, which is wrong under that rule (LESSONS.md 2026-09-14).
 *
 *   npx tsx tools/guard-study.ts                  # mine (today's rules) + replication
 *   npx tsx tools/guard-study.ts --specs          # write sim/specs/guard/*.json
 *   npx tsx tools/guard-study.ts --runs b3-guard2 --stride 4
 */
import { createReadStream, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { globSync } from 'node:fs';
import { WHITE, moverAt } from '../src/rules/engine';

// ------------------------------------------------------------------ board (letters as bytes)

const EMPTY = 0;
const up = (p: number): number => p & 0xdf;                 // 'q' -> 'Q'
const isWhite = (p: number): boolean => p !== 0 && p < 97;   // uppercase byte
const F = (s: number): number => s & 7;
const R = (s: number): number => s >> 3;
const parseSq = (n: string): number => ((n.charCodeAt(1) - 49) << 3) | (n.charCodeAt(0) - 97);
const cheb = (a: number, b: number): number => Math.max(Math.abs(F(a) - F(b)), Math.abs(R(a) - R(b)));
const C = (ch: string): number => ch.charCodeAt(0);
const [G_, K_, P_, Q_, R_, B_, A_, S_, M_, L_, N_] =
  ['G', 'K', 'P', 'Q', 'R', 'B', 'A', 'S', 'M', 'L', 'N'].map(C);
void M_; void S_; void A_;   // read only through VALUE below

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
 * Apply one LAN string. Forms (src/rules/setup.ts `toLan`):
 * `Nb1-c3` quiet, `Bc4xf7` capture, `Ae4*d5` shot (mover stays), `Ma1<>e1` swap,
 * `Sd4xe5xf6` beast chain (lands on the last victim), `e7-e8=Q` promotion.
 * A paladin that captures removes itself (`paladinKamikaze`, on in every run read here).
 */
function applyLan(board: Uint8Array, lan: string): void {
  const m = /^([PNBRQKALGMSH]?)([a-h][1-8])(<>|\*|-|x)(.*)$/.exec(lan);
  if (!m) throw new Error(`bad LAN ${lan}`);
  const [, , fromN, op, rest] = m;
  const from = parseSq(fromN);
  const mover = board[from];
  if (op === '<>') {                                   // maester swap
    const to = parseSq(rest);
    [board[from], board[to]] = [board[to], board[from]];
    return;
  }
  if (op === '*') { board[parseSq(rest)] = EMPTY; return; }   // archer shot: mover does not move
  const parts = rest.split('x');
  const last = parts[parts.length - 1];
  const promo = last.includes('=') ? last.split('=')[1] : '';
  const to = parseSq(last.slice(0, 2));
  if (op === 'x') for (const p of parts) board[parseSq(p.slice(0, 2))] = EMPTY;
  board[from] = EMPTY;
  const kamikaze = op === 'x' && up(mover) === L_;
  board[to] = kamikaze ? EMPTY
    : promo ? (isWhite(mover) ? C(promo) : C(promo.toLowerCase()))
    : mover;
}

// ------------------------------------------------------------------ records

interface Ply { lan: string; cp?: number }
interface Rec {
  gameId: number; configId: string; startFen: string; result: 1 | 0.5 | 0;
  reason: string; plies: number; moves: Ply[];
  stats?: [{ survived: Record<string, number> }, { survived: Record<string, number> }];
  /** The run's rule diff, stamped on every line since 2026-09-14; older files carry none ({} = defaults). */
  rules?: { secondPlayerDoubleFirstTurn?: boolean };
}

// ------------------------------------------------------------------ pattern accounting

const PATTERNS = [
  'shield', 'blocker', 'escort', 'escortPromo', 'promoDeny', 'wall', 'anvilArcher', 'anvilBeast', 'gSwap', 'lastThree',
] as const;
type Pattern = typeof PATTERNS[number];

interface Cell { n: number; w: number; d: number; l: number; plies: number; open: number; mid: number; end: number }
const cell = (): Cell => ({ n: 0, w: 0, d: 0, l: 0, plies: 0, open: 0, mid: 0, end: 0 });
const add = (c: Cell, res: number, plies: number, firstPly: number): void => {
  c.n++; c.plies += plies;
  if (res === 1) c.w++; else if (res === 0.5) c.d++; else c.l++;
  if (firstPly >= 0) { if (firstPly < 30) c.open++; else if (firstPly < 90) c.mid++; else c.end++; }
};
const pct = (a: number, b: number): string => (b ? ((100 * a) / b).toFixed(1) : '—');
const sc = (c: Cell): string => (c.n ? ((c.w + 0.5 * c.d) / c.n).toFixed(3) : '—');

interface Example { run: string; gameId: number; ply: number; fen: string; lan: string; result: number; rank: string }

class Study {
  occ: Record<string, Cell> = {};
  ctl: Record<string, Cell> = {};
  ex: Record<string, Example[]> = {};
  sideGames = 0; withGuard = 0; games = 0;
  /** guard drag: drawn games whose last 20 plies hold a guard on a key square. */
  drawn = 0; dragKey = 0; dragLast3 = 0; drawnWithGuard = 0; gvk = 0;
  decisive = 0; decisiveWithGuard = 0;
  shots = 0; shotsAnvil = 0; chains = 0; chainsAnvil = 0;
  swaps = 0; gSwaps = 0; gSwapLong = 0;
  promos = 0; promosEscorted = 0; promosGuard = 0;
  /** [behind?][holds a guard?] -> score and draws, from 20 plies before the end. */
  salvage = [0, 1].map(() => [0, 1].map(() => cell()));
  /** games with / without any guard on the board -> draws. */
  byGuard = [cell(), cell()];
  constructor(public label: string) {
    for (const p of PATTERNS) { this.occ[p] = cell(); this.ctl[p] = cell(); this.ex[p] = []; }
  }
}

const VALUE: Record<number, number> = {
  [P_]: 100, [N_]: 300, [B_]: 310, [R_]: 500, [Q_]: 900,
  [A_]: 340, [L_]: 220, [G_]: 150, [M_]: 220, [S_]: 270,
};
const material = (board: Uint8Array, white: boolean): number => {
  let v = 0;
  for (const p of board) if (p && isWhite(p) === white) v += VALUE[up(p)] ?? 0;
  return v;
};

/** Every guard square of one colour. */
function guards(board: Uint8Array, white: boolean): number[] {
  const out: number[] = [];
  for (let s = 0; s < 64; s++) if (board[s] && up(board[s]) === G_ && isWhite(board[s]) === white) out.push(s);
  return out;
}

const kingSq = (board: Uint8Array, white: boolean): number => {
  for (let s = 0; s < 64; s++) if (board[s] && up(board[s]) === K_ && isWhite(board[s]) === white) return s;
  return -1;
};

/** Does the enemy still hold a piece that can attack (anything but a lone king and guards)? */
function enemyHasAttackers(board: Uint8Array, white: boolean): boolean {
  for (const p of board) {
    if (!p || isWhite(p) === white) continue;
    const t = up(p);
    if (t !== K_ && t !== G_) return true;
  }
  return false;
}

/**
 * Guard `g` stands on an enemy slider's ray and a friendly piece stands behind it: the wall is
 * doing a rook's job. Walks each of the 8 directions once, so it is O(56) per guard.
 */
function isBlocker(board: Uint8Array, g: number, white: boolean): boolean {
  for (const [df, dr] of DIRS) {
    const diag = df !== 0 && dr !== 0;
    let att = 0;
    for (let s = step(g, -df, -dr); s >= 0; s = step(s, -df, -dr)) {
      const p = board[s];
      if (!p) continue;
      const t = up(p);
      if (isWhite(p) !== white && (t === Q_ || (diag ? t === B_ : t === R_))) att = 1;
      break;
    }
    if (!att) continue;
    for (let s = step(g, df, dr); s >= 0; s = step(s, df, dr)) {
      const p = board[s];
      if (!p) continue;
      if (isWhite(p) === white) return true;
      break;
    }
  }
  return false;
}

/** A friendly guard within one square of a friendly pawn that is past the half way line. */
function escortSquares(board: Uint8Array, gs: readonly number[], white: boolean): number[] {
  const out: number[] = [];
  for (let s = 0; s < 64; s++) {
    const p = board[s];
    if (!p || up(p) !== P_ || isWhite(p) !== white) continue;
    if (white ? R(s) < 4 : R(s) > 3) continue;
    if (gs.some(g => cheb(g, s) === 1)) out.push(s);
  }
  return out;
}

// ------------------------------------------------------------------ the mine

interface Opt { stride: number; examples: number }

function mineGame(sts: readonly Study[], run: string, rec: Rec, opt: Opt): void {
  const st = sts[0];
  st.games++;
  const board = fromFen(rec.startFen);
  const nPlies = rec.moves.length;
  const drawn = rec.result === 0.5;
  if (drawn) st.drawn++; else st.decisive++;

  // Per side: does it start with a guard at all? Everything is scored against that control.
  const hasG: [boolean, boolean] = [guards(board, true).length > 0, guards(board, false).length > 0];
  const first: Record<string, [number, number]> = {};
  const shieldPlies: [number, number] = [0, 0];
  let samples = 0;
  for (const p of PATTERNS) first[p] = [-1, -1];
  const mark = (p: Pattern, side: 0 | 1, ply: number): void => { if (first[p][side] < 0) first[p][side] = ply; };

  const boards: { ply: number; fen: string }[] = [];
  const lastWindow = Math.max(0, nPlies - 20);
  let dragKey = false, dragLast3 = false, gvkEnd = false;
  let behind: [boolean, boolean] = [false, false];

  for (let i = 0; i <= nPlies; i++) {
    const inTail = i >= lastWindow;
    const sample = i % opt.stride === 0 || inTail;
    if (sample) {
      samples++;
      for (const side of [0, 1] as const) {
        const white = side === 0;
        if (!hasG[side]) continue;
        const gs = guards(board, white);
        if (!gs.length) continue;
        const k = kingSq(board, white);
        let key = false;
        if (k >= 0 && enemyHasAttackers(board, white) && gs.some(g => cheb(g, k) === 1)) {
          shieldPlies[side]++; mark('shield', side, i); key = true;
          if (gs.filter(g => cheb(g, k) <= 2).length >= 2
            && gs.some(a => gs.some(b => a !== b && cheb(a, b) === 1))) mark('wall', side, i);
        }
        if (gs.some(g => isBlocker(board, g, white))) { mark('blocker', side, i); key = true; }
        if (escortSquares(board, gs, white).length) { mark('escort', side, i); key = true; }
        // A guard on the rank the ENEMY promotes on, standing on a file that holds an enemy pawn.
        // The enemy promotes on the guard's own back rank, so the guard denies a promotion only
        // when it stands there and an enemy pawn on that file is already within 3 ranks of it.
        const denyRank = white ? 0 : 7;
        if (gs.some(g => R(g) === denyRank && (() => {
          for (let r = 0; r < 8; r++) {
            const p = board[(r << 3) | F(g)];
            if (p && up(p) === P_ && isWhite(p) !== white && Math.abs(r - denyRank) <= 3) return true;
          }
          return false;
        })())) { mark('promoDeny', side, i); key = true; }
        if (inTail && drawn && key) dragKey = true;
        if (inTail) {
          let n = 0;
          for (const p of board) if (p && isWhite(p) === white) n++;
          if (n <= 3) { dragLast3 = true; mark('lastThree', side, i); }
          if (n === 2 && gs.length === 1) gvkEnd = true;
        }
      }
      if (i === lastWindow) {
        behind = [material(board, true) - material(board, false) <= -200,
                  material(board, false) - material(board, true) <= -200];
      }
      if (boards.length < 400) boards.push({ ply: i, fen: toFen(board, moverAt(i, rec.rules ?? {}), i) });
    }
    if (i === nPlies) break;
    const lan = rec.moves[i].lan;
    const white = moverAt(i, rec.rules ?? {}) === WHITE;
    const side = (white ? 0 : 1) as 0 | 1;

    // Move-driven patterns, read before the move is applied.
    if (lan.includes('*')) {
      st.shots++;
      const victim = parseSq(lan.split('*')[1].slice(0, 2));
      if (guards(board, white).some(g => cheb(g, victim) === 1)) { st.shotsAnvil++; mark('anvilArcher', side, i); }
    } else if (lan.includes('<>')) {
      st.swaps++;
      const to = parseSq(lan.split('<>')[1].slice(0, 2));
      const from = parseSq(lan.slice(1, 3));
      if (up(board[to]) === G_) {
        st.gSwaps++; mark('gSwap', side, i);
        if (cheb(from, to) > 1) st.gSwapLong++;
      }
    } else if (lan[0] === 'S' && (lan.match(/x/g)?.length ?? 0) >= 2) {
      st.chains++;
      const vics = lan.split('x').slice(1).map(v => parseSq(v.slice(0, 2)));
      const gs = guards(board, white);
      if (vics.some(v => gs.some(g => cheb(g, v) === 1))) { st.chainsAnvil++; mark('anvilBeast', side, i); }
    }
    if (lan.includes('=')) {
      st.promos++;
      if (lan.endsWith('=G')) st.promosGuard++;
      const from = parseSq(lan.slice(0, 2));
      if (guards(board, white).some(g => cheb(g, from) <= 2)) st.promosEscorted++;
      // The escort paid: this side showed an escort formation earlier and now promotes.
      if (first.escort[side] >= 0 && first.escort[side] < i) mark('escortPromo', side, i);
    }
    applyLan(board, lan);
  }

  if (drawn) {
    const anyG = hasG[0] || hasG[1];
    if (anyG) st.drawnWithGuard++;
    if (dragKey) st.dragKey++;
    if (dragLast3) st.dragLast3++;
    if (gvkEnd) st.gvk++;
  } else if (hasG[0] || hasG[1]) st.decisiveWithGuard++;
  add(st.byGuard[hasG[0] || hasG[1] ? 1 : 0], rec.result, nPlies, -1);
  for (const side of [0, 1] as const) {
    const res = side === 0 ? rec.result : 1 - rec.result;
    add(st.salvage[behind[side] ? 1 : 0][hasG[side] ? 1 : 0], res, nPlies, -1);
  }

  // The second study is a length-matched band: a pattern that needs 60 plies to appear cannot be
  // compared with side-games that ended at ply 40, so the band gives both arms the same room.
  const band = nPlies >= 80 && nPlies <= 220 ? sts[1] : undefined;
  if (band) band.games++;
  for (const side of [0, 1] as const) {
    st.sideGames++;
    if (band) band.sideGames++;
    if (!hasG[side]) continue;
    st.withGuard++;
    if (band) band.withGuard++;
    const res = side === 0 ? rec.result : 1 - rec.result;
    for (const p of PATTERNS) {
      const fp = first[p][side];
      if (band) { if (fp >= 0) add(band.occ[p], res, nPlies, fp); else add(band.ctl[p], res, nPlies, -1); }
      if (fp >= 0) {
        add(st.occ[p], res, nPlies, fp);
        if (st.ex[p].length < opt.examples && res === 1 && fp > 8) {
          const snap = boards.reduce((a, b) => (Math.abs(b.ply - fp) < Math.abs(a.ply - fp) ? b : a), boards[0]);
          st.ex[p].push({
            run, gameId: rec.gameId, ply: snap.ply, fen: snap.fen, result: res, rank: rec.configId,
            lan: rec.moves.slice(Math.max(0, fp - 2), fp + 4).map(m => m.lan).join(' '),
          });
        }
      } else add(st.ctl[p], res, nPlies, -1);
    }
    void shieldPlies; void samples;
  }
}

async function mineRun(sts: readonly Study[], run: string, opt: Opt): Promise<void> {
  const rl = createInterface({ input: createReadStream(`sim/out/${run}.jsonl`), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    let rec: Rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (!rec.moves?.length) continue;
    try { mineGame(sts, run, rec, opt); } catch { /* a malformed line is one game, not the mine */ }
  }
}

/**
 * Which rules a run *played*, read from its own moves — never from its recorded diff.
 * A spec that records `rules: {}` played whatever `DEFAULT_RULES` held on the day, and the guard
 * defaults changed twice: every `b3-*` run records an empty diff and captures with its guards.
 * Signatures: a guard capture (`Gx`), a guard step of 2, an archer's diagonal step, a guard taken
 * by a non-king.
 */
interface Played { games: number; gSeen: number; gCapt: number; gStep2: number; aDiag: number; aStep: number; gTaken: number; gTakenByK: number }

async function classify(run: string, limit = 300): Promise<Played> {
  const p: Played = { games: 0, gSeen: 0, gCapt: 0, gStep2: 0, aDiag: 0, aStep: 0, gTaken: 0, gTakenByK: 0 };
  const rl = createInterface({ input: createReadStream(`sim/out/${run}.jsonl`), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    let rec: Rec;
    try { rec = JSON.parse(line); } catch { continue; }
    if (!rec.moves?.length) continue;
    if (++p.games > limit) break;
    const board = fromFen(rec.startFen);
    for (const b of board) if (b && up(b) === G_) { p.gSeen++; break; }
    for (const m of rec.moves) {
      const lan = m.lan;
      const t = lan[0];
      if (t === 'G') {
        if (lan.includes('x')) p.gCapt++;
        else if (lan.includes('-') && cheb(parseSq(lan.slice(1, 3)), parseSq(lan.slice(4, 6))) === 2) p.gStep2++;
      } else if (t === 'A' && lan.includes('-')) {
        p.aStep++;
        const [a, b] = [parseSq(lan.slice(1, 3)), parseSq(lan.slice(4, 6))];
        if (F(a) !== F(b) && R(a) !== R(b)) p.aDiag++;
      }
      if (lan.includes('x')) {
        const vic = parseSq(lan.slice(lan.lastIndexOf('x') + 1, lan.lastIndexOf('x') + 3));
        if (up(board[vic]) === G_) { p.gTaken++; if (t === 'K') p.gTakenByK++; }
      }
      try { applyLan(board, lan); } catch { break; }
    }
  }
  return p;
}

/** Runs that played the shipped guard: no capture, no 2-step move, and only a king takes it. */
async function guardRuns(): Promise<{ shipped: string[]; buffedArcher: Set<string> }> {
  const shipped: string[] = [], buffedArcher = new Set<string>();
  for (const f of globSync('sim/out/*.summary.json')) {
    const id = f.replace(/^sim\/out\//, '').replace(/\.summary\.json$/, '');
    let p: Played;
    try { p = await classify(id); } catch { continue; }
    if (!p.games) continue;
    if (!p.gSeen || p.gCapt || p.gStep2 || (p.gTaken > p.gTakenByK)) continue;
    shipped.push(id);
    if (p.aStep > 40 && p.aDiag / p.aStep > 0.1) buffedArcher.add(id);
  }
  return { shipped, buffedArcher };
}

function report(st: Study): void {
  console.log(`\n## ${st.label} — ${st.games} games, ${st.withGuard}/${st.sideGames} side-games hold a guard\n`);
  console.log('| pattern | side-games | share of guard sides | score with | score without | draw with | draw without | open/mid/end |');
  console.log('|---|---|---|---|---|---|---|---|');
  for (const p of PATTERNS) {
    const o = st.occ[p], c = st.ctl[p];
    console.log(`| ${p} | ${o.n} | ${pct(o.n, st.withGuard)}% | ${sc(o)} | ${sc(c)} | ${pct(o.d, o.n)}% | ${pct(c.d, c.n)}% | ${o.open}/${o.mid}/${o.end} |`);
  }
  console.log(`\nmean plies with/without, per pattern:`);
  for (const p of PATTERNS) {
    const o = st.occ[p], c = st.ctl[p];
    console.log(`  ${p.padEnd(12)} ${(o.n ? o.plies / o.n : 0).toFixed(0)} vs ${(c.n ? c.plies / c.n : 0).toFixed(0)}`);
  }
  console.log(`\narcher shots ${st.shots}, of which the victim touches a friendly guard: ${st.shotsAnvil} (${pct(st.shotsAnvil, st.shots)}%)`);
  console.log(`beast chains ${st.chains}, anvil-assisted ${st.chainsAnvil} (${pct(st.chainsAnvil, st.chains)}%)`);
  console.log(`maester swaps ${st.swaps}, with a guard ${st.gSwaps} (${pct(st.gSwaps, st.swaps)}%), of them long ${st.gSwapLong}`);
  console.log(`promotions ${st.promos}, guard within 2 of the pawn ${st.promosEscorted} (${pct(st.promosEscorted, st.promos)}%), promoted to a guard ${st.promosGuard} (${pct(st.promosGuard, st.promos)}%)`);
  console.log(`\ndraws ${st.drawn} (${pct(st.drawn, st.games)}%), of them with a guard on the board ${st.drawnWithGuard}`);
  console.log(`  last 20 plies hold a guard on a key square: ${st.dragKey} (${pct(st.dragKey, st.drawn)}% of draws)`);
  console.log(`  a guard among the last 3 pieces of a side:  ${st.dragLast3} (${pct(st.dragLast3, st.drawn)}% of draws)`);
  console.log(`  king + guard only:                          ${st.gvk} (${pct(st.gvk, st.drawn)}% of draws)`);
  console.log(`  draw rate with a guard on the board ${pct(st.byGuard[1].d, st.byGuard[1].n)}% (n ${st.byGuard[1].n}), without ${pct(st.byGuard[0].d, st.byGuard[0].n)}% (n ${st.byGuard[0].n})`);
  console.log('\nsalvage: a side 2+ pawns down 20 plies before the end');
  console.log('| behind | holds a guard | side-games | score | draw |');
  console.log('|---|---|---|---|---|');
  for (const b of [0, 1]) for (const g of [0, 1]) {
    const c = st.salvage[b][g];
    console.log(`| ${b ? 'yes' : 'no'} | ${g ? 'yes' : 'no'} | ${c.n} | ${sc(c)} | ${pct(c.d, c.n)}% |`);
  }
  for (const p of PATTERNS) {
    for (const e of st.ex[p]) {
      console.log(`EX ${p} ${e.run}#${e.gameId} rank ${e.rank} ply ${e.ply} | ${e.lan}`);
      console.log(`   ${e.fen}`);
    }
  }
}

// ------------------------------------------------------------------ targeted specs

const POOL_ARMY_1G = 'QRRBAGM';   // one guard, 3 fairy pieces
const POOL_ARMY_2G = 'QRRBGGM';   // two guards, the b3-guard2 army (26.8 pawns, tuned values)

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const shuffle = <T>(a: T[], rng: () => number): T[] => {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/** n arrangements of one fixed army that satisfy `keep`; bishops-on-opposite-colours is moot at one B. */
function arrangements(army: string, n: number, seed: number, keep: (r: string) => boolean): string[] {
  const rng = mulberry32(seed);
  const seen = new Set<string>();
  for (let tries = 0; seen.size < n && tries < 5e6; tries++) {
    const row = shuffle([...army.split(''), 'K'], rng).join('');
    if (keep(row)) seen.add(row);
  }
  if (seen.size < n) throw new Error(`only ${seen.size}/${n} arrangements for ${army}`);
  return [...seen];
}

const gPos = (r: string): number[] => r.split('').flatMap((c, i) => (c === 'G' ? [i] : []));
const kPos = (r: string): number => r.indexOf('K');

/**
 * Escort positions: one FEN per position, plus the vertical mirror with the colours swapped so the
 * pair hands the same structure to Black and keeps White to move (`RunSpec.asymmetric.fenSwapped`).
 */
function mirrorFen(fen: string): string {
  const [board] = fen.split(' ');
  const rows = board.split('/').reverse()
    .map(r => [...r].map(c => (c >= 'a' && c <= 'z' ? c.toUpperCase() : c >= 'A' && c <= 'Z' ? c.toLowerCase() : c)).join(''));
  return `${rows.join('/')} w - - 0 1`;
}

/**
 * A passed white pawn on `file`, rank 5, with the white guard either beside it (`escort`) or parked
 * on the far wing. Both sides hold K + R + G + 3 pawns, so material is identical in both arms and
 * only the guard's square changes.
 */
function escortPositions(n: number, escort: boolean): { fen: string; tag: string }[] {
  const files = 'abcdefgh';
  const out: { fen: string; tag: string }[] = [];
  for (let i = 0; i < n; i++) {
    const b: string[] = Array.from({ length: 64 }, () => '');
    const put = (file: number, rank1: number, ch: string): void => { b[(rank1 - 1) * 8 + (file & 7)] = ch; };
    const pf = 1 + (i % 6);                         // passed pawn on file b..g
    const rot = (i * 3) % 8;
    const kf = rot, rf = (rot + 3) % 8, gf = (rot + 6) % 8;
    // Three pawn files clear of the passer and of its two neighbours, so the passer is truly passed.
    const free = [0, 1, 2, 3, 4, 5, 6, 7].filter(x => Math.abs(x - pf) > 1);
    const pawnFiles = [0, 1, 2].map(j => free[(i + j * 2) % free.length]);
    put(pf, 6, 'P');
    for (const f of pawnFiles) { put(f, 2, 'P'); put(f, 7, 'p'); }
    put(kf, 1, 'K'); put(rf, 1, 'R');
    put(kf, 8, 'k'); put(rf, 8, 'r'); put(gf, 8, 'g');
    // The one square that separates the two arms.
    if (escort) put(i % 2 ? pf - 1 : pf + 1, 6, 'G'); else put(gf, 1, 'G');
    const rows: string[] = [];
    for (let r = 8; r >= 1; r--) {
      let row = '', e = 0;
      for (let f = 0; f < 8; f++) {
        const ch = b[(r - 1) * 8 + f];
        if (!ch) { e++; continue; }
        if (e) { row += e; e = 0; }
        row += ch;
      }
      rows.push(row + (e || ''));
    }
    out.push({ fen: `${rows.join('/')} w - - 0 1`, tag: `${files[pf]}6${escort ? '+G' : ''}` });
  }
  return out;
}

function writeSpecs(): void {
  mkdirSync('sim/specs/guard', { recursive: true });
  const write = (o: Record<string, unknown>): void => {
    writeFileSync(`sim/specs/guard/${o.id}.json`, JSON.stringify(o, null, 2) + '\n');
    const n = Array.isArray(o.backRanks) ? o.backRanks.length : (o.asymmetric as unknown[] | undefined)?.length ?? 40;
    console.log(`${o.id}: ${n} configs, ${o.games} games`);
  };
  const common = { ai: { depth: 3 }, commonSeeds: true, seed: 911 };

  write({ id: 'gs-shield-near', games: 4000, ...common,
    backRanks: arrangements(POOL_ARMY_1G, 40, 21, r => Math.abs(gPos(r)[0] - kPos(r)) === 1),
    note: 'one guard, army QRRBAGM; guard on a square beside the king' });
  write({ id: 'gs-shield-far', games: 4000, ...common,
    backRanks: arrangements(POOL_ARMY_1G, 40, 22, r => Math.abs(gPos(r)[0] - kPos(r)) >= 4),
    note: 'same army QRRBAGM; guard at least 4 files from the king' });

  write({ id: 'gs-wall-front', games: 4000, ...common,
    backRanks: arrangements(POOL_ARMY_2G, 40, 23, r => {
      const g = gPos(r), k = kPos(r);
      return Math.abs(g[0] - g[1]) === 1 && Math.min(...g.map(x => Math.abs(x - k))) === 1;
    }),
    note: 'two guards, army QRRBGGM; the two guards adjacent and beside the king (a wall)' });
  write({ id: 'gs-wall-split', games: 4000, ...common,
    backRanks: arrangements(POOL_ARMY_2G, 40, 24, r => Math.abs(gPos(r)[0] - gPos(r)[1]) >= 5),
    note: 'same army QRRBGGM; the two guards at least 5 files apart' });

  // `startGame` validates the back rank even when a FEN overrides it, and `configId` is that
  // string, so each position carries its own legal-but-unused 8-letter label.
  const labels = arrangements('RGQBNMA', 40, 77, () => true);
  for (const escort of [true, false]) {
    const pos = escortPositions(40, escort);
    write({ id: `gs-escort-${escort ? 'on' : 'off'}`, games: 2400, ...common, pairs: true,
      asymmetric: pos.map((p, i) => ({ white: labels[i], black: labels[i], fen: p.fen, fenSwapped: mirrorFen(p.fen) })),
      maxPlies: 200, openingRandomPlies: 2,
      note: `K+R+G+4P each, White a passer on rank 6; guard ${escort ? 'beside the passer' : 'on the far wing'}` });
  }

  write({ id: 'gs-step2', games: 4000, ...common, seed: 912,
    backRanks: { sample: 40 }, rules: { guardStep: 2 },
    note: 'guardStep=2 against the shipped 1-step guard; immortal and capture-free in both arms' });
  write({ id: 'gs-step2-base', games: 4000, ...common, seed: 912, backRanks: { sample: 40 },
    note: 'control for gs-step2 — same seed and sample, so the same 40 ranks and the same openings' });
}

// ------------------------------------------------------------------ main

const f: Record<string, string | true> = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith('--')) continue;
  const eq = a.indexOf('=');
  if (eq > 0) f[a.slice(2, eq)] = a.slice(eq + 1);
  else f[a.slice(2)] = process.argv[i + 1]?.startsWith('--') === false ? process.argv[++i] : true;
}

if (typeof f.fen === 'string') {
  // `--fen <run>:<gameId>:<ply>` — the exact position after `ply` plies, for a quoted example.
  const [run, gid, ply] = (f.fen as string).split(':');
  const rl = createInterface({ input: createReadStream(`sim/out/${run}.jsonl`), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.startsWith(`{"gameId":${gid},`)) continue;
    const rec: Rec = JSON.parse(line);
    const board = fromFen(rec.startFen);
    for (let i = 0; i < +ply; i++) applyLan(board, rec.moves[i].lan);
    console.log(`${run}#${gid} ${rec.configId} result ${rec.result} ${rec.reason} ${rec.plies} plies`);
    console.log(`ply ${ply}: ${toFen(board, moverAt(+ply, rec.rules ?? {}), +ply)}`);
    console.log(`... ${rec.moves.slice(Math.max(0, +ply - 2), +ply + 5).map(m => m.lan).join(' ')}`);
    break;
  }
}
else if (typeof f.verify === 'string') {
  // The one check the replayer needs: replay every game and compare the final census with the
  // runner's own `stats[].survived`. If `applyLan` is wrong about a swap, a shot, a chain or the
  // paladin's self-removal, the counts diverge.
  let games = 0, bad = 0;
  for (const run of (f.verify as string).split(',')) {
    const rl = createInterface({ input: createReadStream(`sim/out/${run}.jsonl`), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line) continue;
      const rec: Rec = JSON.parse(line);
      if (!rec.moves?.length || !rec.stats) continue;
      if (++games > 2000) break;
      const board = fromFen(rec.startFen);
      for (const m of rec.moves) applyLan(board, m.lan);
      const got: [Record<string, number>, Record<string, number>] = [{}, {}];
      for (const p2 of board) if (p2) {
        const side = isWhite(p2) ? 0 : 1, l = String.fromCharCode(up(p2));
        got[side][l] = (got[side][l] ?? 0) + 1;
      }
      for (const side of [0, 1]) {
        const want = rec.stats[side].survived;
        const keys = new Set([...Object.keys(want), ...Object.keys(got[side])]);
        for (const k of keys) if ((want[k] ?? 0) !== (got[side][k] ?? 0)) {
          if (bad++ < 5) console.log(`MISMATCH ${run}#${rec.gameId} side ${side} ${k}: record ${want[k] ?? 0}, replay ${got[side][k] ?? 0}`);
        }
      }
    }
  }
  console.log(`verify: ${games} games, ${bad} piece-count mismatches`);
  if (bad) process.exitCode = 1;
}
else if (typeof f.shots === 'string') {
  // Confirm from the games what `genPiece` case A already says in code: an archer's shot table is
  // built with `step()` alone, so no blocker of either colour is consulted.
  let over = 0, overFriend = 0, overEnemy = 0, all = 0, drawGvK = 0;
  for (const run of (f.shots as string).split(',')) {
    const rl = createInterface({ input: createReadStream(`sim/out/${run}.jsonl`), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line) continue;
      const rec: Rec = JSON.parse(line);
      const board = fromFen(rec.startFen);
      for (let i = 0; i < rec.moves.length; i++) {
        const lan = rec.moves[i].lan;
        if (lan[0] === 'A' && lan.includes('*')) {
          all++;
          const from = parseSq(lan.slice(1, 3)), to = parseSq(lan.split('*')[1].slice(0, 2));
          const df = F(to) - F(from), dr = R(to) - R(from);
          if (Math.abs(df) === 2 || Math.abs(dr) === 2) {         // the orthogonal 2-square shot
            const mid = step(from, df / 2, dr / 2);
            if (mid >= 0 && board[mid]) {
              over++;
              if (isWhite(board[mid]) === (moverAt(i, rec.rules ?? {}) === WHITE)) overFriend++; else overEnemy++;
            }
          }
        }
        applyLan(board, lan);
      }
      if (rec.result === 0.5) {
        let w = 0, b = 0, wg = 0, bg = 0;
        for (const p2 of board) if (p2) { if (isWhite(p2)) { w++; if (up(p2) === G_) wg++; } else { b++; if (up(p2) === G_) bg++; } }
        if ((w === 2 && wg === 1) || (b === 2 && bg === 1)) { drawGvK++; if (drawGvK <= 3) console.log(`GvK draw ${run}#${rec.gameId} ${rec.reason} ${rec.plies} plies ${toFen(board, 0, rec.plies)}`); }
      }
    }
  }
  console.log(`archer shots ${all}; two-square shots over an occupied square ${over} (friendly blocker ${overFriend}, enemy blocker ${overEnemy})`);
  console.log(`drawn games ending king+guard vs anything: ${drawGvK}`);
}
else if (f.specs) { writeSpecs(); }
else if (f.list) {
  const { shipped, buffedArcher } = await guardRuns();
  for (const r of shipped) console.log(`${r}\t${buffedArcher.has(r) ? 'v0.6-archer' : 'pre-buff'}`);
}
else {
  const opt: Opt = { stride: +(f.stride ?? 8), examples: +(f.examples ?? 3) };
  let groups: [string, string[]][];
  if (typeof f.runs === 'string') groups = [['custom', (f.runs as string).split(',')]];
  else {
    const { shipped, buffedArcher } = await guardRuns();
    groups = [
      ['A — shipped guard, v0.6 archer and beast', shipped.filter(r => buffedArcher.has(r))],
      // The replication is the two big mirrored campaigns only: the odds arms and the pilots play
      // handicapped or tiny samples and would pool three questions into one column.
      ['B — shipped guard, 2017 archer and beast (replication)',
        shipped.filter(r => !buffedArcher.has(r) && (r.startsWith('cfg-') || r.startsWith('sweep-p2') || r.startsWith('sweep-d3')))],
    ];
  }
  for (const [label, runs] of groups) {
    const st = new Study(`${label} (${runs.length} runs)`);
    const band = new Study(`${label} — length-matched band, 80-220 plies`);
    for (const r of runs) { process.stderr.write(`  ${r}\n`); await mineRun([st, band], r, opt); }
    report(st);
    report(band);
  }
}
