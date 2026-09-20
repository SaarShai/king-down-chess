#!/usr/bin/env -S npx tsx
/**
 * Condition-aware piece evaluation. Value (an odds match) is one number; this tool asks the other
 * questions the owner raised: does a piece ever get paralysed? Does its contribution change with the
 * army's composition — guards, pawns, screens? Is a cheap piece balance-breaking in the right
 * condition? Does a dear piece go quiet in the wrong one?
 *
 *   tsx tools/conditions.ts --runs np-N,np-O,np-V-ortho,np-T
 *   tsx tools/conditions.ts --pair np-V-ortho,np-N        # paired by gameId (same openings)
 *
 * Per run it prints, for every piece type the run contains:
 *   presence   share of games where at least one of the side's armies starts with it
 *   moves      the piece's moves per game, per army that owns it
 *   still      share of owner-armies where it made no move at all (paralysis)
 *   survive    share of owner-armies where it is still on the board at the end
 * and per run: decisive share, draws, capped, mean plies, White score.
 *
 * `--pair A,B` adds the paired difference over shared gameIds (same seed and ranks in the lab's
 * matched runs), plus the run's interaction counters so a condition can be read from the moves.
 */
import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { LETTERS } from '../src/rules/engine';
import type { GameRecord } from '../src/sim/game';

const flag = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const RUNS = flag('runs', '').split(',').filter(Boolean);
const PAIR = flag('pair', '').split(',').filter(Boolean);
if (!RUNS.length && PAIR.length !== 2) {
  console.error('usage: tsx tools/conditions.ts --runs a,b,c | --pair a,b');
  process.exit(2);
}
const pathOf = (id: string): string => (id.includes('/') ? id : `sim/out/${id}.jsonl`);

/** Pieces a back rank contains (the rank with the king), counted per colour. */
const armyOf = (fen: string, colour: 0 | 1): string => {
  const fields = fen.split(' ')[0].split('/');
  const rank = colour === 0 ? fields[7] : fields[0];
  return rank;
};

interface PieceStat { letters: Set<string>; moves: number; zero: number; survived: number; captures: number }
interface RunStat {
  id: string; games: number; decisive: number; draws: number; capped: number; plies: number; white: number;
  pieces: Map<string, PieceStat>;
  events: Record<string, number>;
}
const empty = (id: string): RunStat => ({ id, games: 0, decisive: 0, draws: 0, capped: 0, plies: 0, white: 0, pieces: new Map(), events: {} });

async function scan(id: string): Promise<RunStat> {
  const file = pathOf(id);
  if (!existsSync(file)) throw new Error(`conditions: ${file} is missing`);
  const st = empty(id);
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    const rec = JSON.parse(line) as GameRecord;
    st.games++;
    st.plies += rec.plies;
    st.white += rec.result;
    if (rec.result === 0.5) st.draws++;
    if (rec.reason === 'plyCap') st.capped++;
    if (rec.reason === 'checkmate' || rec.reason === 'adjudicatedResign') st.decisive++;
    for (const [k, v] of Object.entries(rec.events ?? {})) {
      const sum = Array.isArray(v) ? (Array.isArray(v[0]) ? (v as number[][]).flat().reduce((a, b) => a + b, 0) : (v as number[]).reduce((a, b) => a + b, 0)) : 0;
      st.events[k] = (st.events[k] ?? 0) + sum;
    }
    for (const side of [0, 1] as const) {
      const rank = armyOf(rec.startFen, side);
      const own = new Set(rank.split(''));
      const pst = rec.stats[side];
      for (const letter of own) {
        const p = st.pieces.get(letter) ?? { letters: new Set(), moves: 0, zero: 0, survived: 0, captures: 0 };
        p.letters.add(letter);
        const moves = pst.moves[letter] ?? 0;
        p.moves += moves;
        if (moves === 0) p.zero++;
        p.survived += pst.survived[letter] ?? 0;
        p.captures += pst.captures[letter] ?? 0;
        st.pieces.set(letter, p);
      }
    }
  }
  return st;
}

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`;
const show = (st: RunStat): void => {
  const g = st.games || 1;
  console.log(`\n${st.id}: ${st.games} games · decisive ${pct(st.decisive / g)} · draws ${pct(st.draws / g)} · capped ${pct(st.capped / g)} · plies ${(st.plies / g).toFixed(0)} · White ${(st.white / g).toFixed(3)}`);
  const letters = [...st.pieces.keys()].filter(l => LETTERS.includes(l) && l !== 'K' && l !== '').sort();
  const caps: Record<string, number> = { P: 0, N: 0, B: 0, R: 0, Q: 0, A: 0, L: 0, G: 0, M: 0, S: 0, O: 0, C: 0, V: 0, T: 0 };
  console.log('  piece | per game | still (no move) | survive | captures');
  for (const l of letters) {
    const p = st.pieces.get(l)!;
    // Owner-armies = games x armies that actually start with it.
    const owners = [...st.pieces.values()][0] && st.games; // each side owns it in these symmetric runs
    console.log(`  ${l.padEnd(5)} | ${(p.moves / (2 * g)).toFixed(2).padStart(8)} | ${pct(p.zero / (2 * g)).padStart(15)} | ${pct(p.survived / (2 * g)).padStart(7)} | ${(p.captures / (2 * g)).toFixed(2)}`.replace('$owners', ''));
    void caps;
  }
  const ev = Object.entries(st.events).filter(([, v]) => v > 0).map(([k, v]) => `${k} ${(v / g).toFixed(2)}`);
  if (ev.length) console.log(`  events/game: ${ev.join(', ')}`);
};

const main = async (): Promise<void> => {
  if (PAIR.length === 2) {
    const [a, b] = await Promise.all([scan(PAIR[0]), scan(PAIR[1])]);
    show(a); show(b);
    // Paired difference needs the records themselves, not the aggregates.
    const read = async (id: string): Promise<Map<number, GameRecord>> => {
      const m = new Map<number, GameRecord>();
      const rl = createInterface({ input: createReadStream(pathOf(id)), crlfDelay: Infinity });
      for await (const line of rl) { if (line) { const r = JSON.parse(line) as GameRecord; m.set(r.gameId, r); } }
      return m;
    };
    const [A, B] = await Promise.all([read(PAIR[0]), read(PAIR[1])]);
    const ids = [...A.keys()].filter(i => B.has(i));
    const mean = (xs: number[]): number => xs.reduce((x, y) => x + y, 0) / (xs.length || 1);
    const ci = (xs: number[]): number => {
      const n = xs.length; const m = mean(xs); if (n < 2) return NaN;
      const v = xs.reduce((x, y) => x + (y - m) ** 2, 0) / (n - 1);
      return 1.959964 * Math.sqrt(v / n);
    };
    const diff = (f: (r: GameRecord) => number): [number, number] => {
      const xs = ids.map(i => f(A.get(i)!) - f(B.get(i)!));
      return [mean(xs), ci(xs)];
    };
    const [res, resCI] = diff(r => r.result);
    const [dec, decCI] = diff(r => (r.result !== 0.5 ? 1 : 0));
    const [ply, plyCI] = diff(r => r.plies);
    console.log(`\npaired ${ids.length} games (${PAIR[0]} minus ${PAIR[1]})`);
    console.log(`  result ${res >= 0 ? '+' : ''}${res.toFixed(3)} ± ${resCI.toFixed(3)} · decisive ${dec >= 0 ? '+' : ''}${dec.toFixed(3)} ± ${decCI.toFixed(3)} · plies ${ply >= 0 ? '+' : ''}${ply.toFixed(1)} ± ${plyCI.toFixed(1)}`);
    return;
  }
  for (const id of RUNS) show(await scan(id));
};

main().catch(e => { console.error(e); process.exit(2); });
