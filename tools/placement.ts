#!/usr/bin/env npx tsx
/**
 * Placement analysis: does where a piece starts change how it plays and how the game goes?
 *
 * Streams recorded runs (no new games) and splits every game by the starting square of each piece:
 * file, distance to its own king, whether it starts adjacent to the king, and whether it starts on
 * an edge/corner. Reports, per piece and per starting file: decisive share, draws, plies, the
 * piece's moves and captures per game, and how often it never moves.
 *
 *   tsx tools/placement.ts --runs np-N,np-O,np-V-ortho,np-T
 *
 * Caveats, printed with the table: the ranks are sampled, so a file's sample is not independent of
 * the rest of the army (composition is fixed within a run, but neighbourhoods differ); treat the
 * table as a screen for a targeted paired experiment, not as a measurement of a file's worth.
 */
import { createReadStream, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import type { GameRecord } from '../src/sim/game';

const flag = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const RUNS = flag('runs', 'np-N,np-O,np-V-ortho,np-T').split(',').filter(Boolean);
const FILES = 'abcdefgh';

interface Cell { games: number; decisive: number; draws: number; plies: number; moves: number; captures: number; zero: number; surv: number }
const empty = (): Cell => ({ games: 0, decisive: 0, draws: 0, plies: 0, moves: 0, captures: 0, zero: 0, surv: 0 });

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`;

async function scan(id: string): Promise<void> {
  const file = existsSync(id) ? id : `sim/out/${id}.jsonl`;
  if (!existsSync(file)) { console.log(`\n${id}: missing (${file})`); return; }
  // letter -> file -> cell, and letter -> adjacency-to-king split.
  const byFile = new Map<string, Map<string, Cell>>();
  const adjKing = new Map<string, Cell>();
  const nonAdjKing = new Map<string, Cell>();
  let games = 0, decisive = 0, draws = 0, plies = 0;
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    const rec = JSON.parse(line) as GameRecord;
    games++; plies += rec.plies;
    const dec = rec.reason === 'checkmate' || rec.reason === 'adjudicatedResign';
    if (dec) decisive++;
    if (rec.result === 0.5) draws++;
    const rank = rec.startFen.split(' ')[0].split('/')[7]; // white's back rank (both armies mirrored)
    const king = rank.indexOf('K');
    for (let sq = 0; sq < 8; sq++) {
      const letter = rank[sq];
      if (letter === 'K' || letter === 'P') continue;
      const p = rec.stats[0]; // symmetric runs: white's army is the one summarised
      const moves = p.moves[letter] ?? 0, caps = p.captures[letter] ?? 0;
      const surv = p.survived[letter] ?? 0;
      const cell = (map: Map<string, Cell>) => {
        const c = map.get(letter) ?? empty();
        c.games++; c.plies += rec.plies;
        if (dec) c.decisive++;
        if (rec.result === 0.5) c.draws++;
        c.moves += moves; c.captures += caps; c.surv += surv;
        if (moves === 0) c.zero++;
        map.set(letter, c);
      };
      const fileCell = (byFile.get(letter) ?? new Map<string, Cell>());
      const c = fileCell.get(FILES[sq]) ?? empty();
      c.games++; c.plies += rec.plies;
      if (dec) c.decisive++;
      if (rec.result === 0.5) c.draws++;
      c.moves += moves; c.captures += caps; c.surv += surv;
      if (moves === 0) c.zero++;
      fileCell.set(FILES[sq], c);
      byFile.set(letter, fileCell);
      (Math.max(Math.abs(sq - king), 0) === 1 ? cell(adjKing) : cell(nonAdjKing));
    }
  }

  console.log(`\n${id}: ${games} games · decisive ${pct(decisive / (games || 1))} · draws ${pct(draws / (games || 1))} · plies ${(plies / (games || 1)).toFixed(0)}`);
  console.log('  piece | file: decisive / draws / plies / moves / captures (games at that file)');
  for (const [letter, files] of [...byFile].sort()) {
    const parts = [...files].sort().map(([f, c]) =>
      `${f} ${pct(c.decisive / c.games)}/${pct(c.draws / c.games)}/${(c.plies / c.games).toFixed(0)}/${(c.moves / c.games).toFixed(1)}/${(c.captures / c.games).toFixed(2)} (${c.games})`);
    console.log(`  ${letter.padEnd(2)}   ${parts.join(' | ')}`);
  }
  const line = (letter: string): string => {
    const a = adjKing.get(letter), n = nonAdjKing.get(letter);
    if (!a || !n) return '';
    return `  ${letter.padEnd(2)} adjacent: decisive ${pct(a.decisive / a.games)} draws ${pct(a.draws / a.games)} moves ${(a.moves / a.games).toFixed(1)} n=${a.games} · far: decisive ${pct(n.decisive / n.games)} draws ${pct(n.draws / n.games)} moves ${(n.moves / n.games).toFixed(1)} n=${n.games}`;
  };
  const adj = [...adjKing.keys()].sort().map(line).filter(Boolean);
  if (adj.length) { console.log('  adjacent to its own king vs farther (king-adjacent starts only):'); for (const l of adj) console.log(l); }
}

for (const id of RUNS) await scan(id);
console.log(`
Caveat: files are sampled ranks, so a file's sample is confounded with the rest of that army and
with opening luck. Use the table to pick a paired experiment (same armies, one piece swapped between
files at fixed squares), not to quote a file's worth.`);
