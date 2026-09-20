#!/usr/bin/env -S npx tsx
/**
 * Interaction profiler: what actually happens in the game, how often, and whether it tracks
 * decisive games. Pure streaming arithmetic over recorded corpora — no model, no judgment.
 *
 * The output is the parameter table the Jev interestingness rubric needs (tools/jev-interest.ts):
 * per interaction, events per game, the share of games it appears in, and the decisive-share
 * difference between games with and without it (correlational, not causal).
 *
 *   tsx tools/interactions.ts --files ../king-down-sim/sim/out/nnue-g2.jsonl,sim/out/np-O.jsonl
 *   tsx tools/interactions.ts            # defaults to the shipped-rule corpus if it is on disk
 */
import { createReadStream, existsSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import type { GameRecord } from '../src/sim/game';

const flag = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const FILES = flag('files', '../king-down-sim/sim/out/nnue-g2.jsonl,sim/out/np-O.jsonl')
  .split(',').filter(f => existsSync(f));
if (!FILES.length) { console.error('interactions: no input files'); process.exit(2); }
const OUT_MD = flag('out', 'docs/research/interactions-2026-09-17.md');
const OUT_JSON = 'sim/out/interactions.json';

const KEYS = ['archerShots', 'beastChainMoves', 'maesterSwaps', 'maesterLongSwaps', 'paladinSacrifices', 'promotions', 'checks', 'ogreShoves', 'ogreShovesFriend', 'ogreShovesGuard', 'catapultChecks'] as const;
type Key = typeof KEYS[number];
const z = (): Record<Key, number> => Object.fromEntries(KEYS.map(k => [k, 0])) as Record<Key, number>;
const add = (into: Record<Key, number>, rec: GameRecord): void => {
  const e = rec.events;
  into.archerShots += (e.archerShots?.[0] ?? 0) + (e.archerShots?.[1] ?? 0);
  into.beastChainMoves += (e.beastChains?.[0]?.length ?? 0) + (e.beastChains?.[1]?.length ?? 0);
  into.maesterSwaps += (e.maesterSwaps?.[0] ?? 0) + (e.maesterSwaps?.[1] ?? 0);
  into.maesterLongSwaps += (e.maesterLongSwaps?.[0] ?? 0) + (e.maesterLongSwaps?.[1] ?? 0);
  into.paladinSacrifices += (e.paladinSacrifices?.[0] ?? 0) + (e.paladinSacrifices?.[1] ?? 0);
  into.promotions += (e.promotions?.[0] ?? 0) + (e.promotions?.[1] ?? 0);
  into.checks += (e.checks?.[0] ?? 0) + (e.checks?.[1] ?? 0);
  into.ogreShoves += (e.ogreShoves?.[0] ?? 0) + (e.ogreShoves?.[1] ?? 0);
  into.ogreShovesFriend += (e.ogreShovesFriend?.[0] ?? 0) + (e.ogreShovesFriend?.[1] ?? 0);
  into.ogreShovesGuard += (e.ogreShovesGuard?.[0] ?? 0) + (e.ogreShovesGuard?.[1] ?? 0);
  into.catapultChecks += (e.catapultChecks?.[0] ?? 0) + (e.catapultChecks?.[1] ?? 0);
};

interface Acc { games: number; decisive: number; draws: number; capped: number; plies: number; ev: Record<Key, number>; with: Record<Key, number>; decisiveWith: Record<Key, number> }
const empty = (): Acc => ({ games: 0, decisive: 0, draws: 0, capped: 0, plies: 0, ev: z(), with: z(), decisiveWith: z() });

const results: { file: string; acc: Acc }[] = [];
for (const file of FILES) {
  const acc = empty();
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    const rec = JSON.parse(line) as GameRecord;
    acc.games++;
    acc.plies += rec.plies;
    const decisive = rec.reason === 'checkmate' || rec.reason === 'adjudicatedResign';
    if (rec.result === 0.5) acc.draws++;
    if (rec.reason === 'plyCap') acc.capped++;
    if (decisive) acc.decisive++;
    const one = z(); add(one, rec);
    for (const k of KEYS) {
      acc.ev[k] += one[k];
      if (one[k] > 0) { acc.with[k]++; if (decisive) acc.decisiveWith[k]++; }
    }
  }
  results.push({ file, acc });
  console.log(`interactions: ${file} — ${acc.games} games`);
}

const pct = (x: number): string => `${(100 * x).toFixed(1)}%`;
const rows: string[] = [];
for (const { file, acc } of results) {
  const g = acc.games || 1;
  const base = acc.decisive / g;
  rows.push(`### ${file}\n`);
  rows.push(`${acc.games} games · decisive ${pct(base)} · draws ${pct(acc.draws / g)} · capped ${pct(acc.capped / g)} · mean plies ${(acc.plies / g).toFixed(0)}\n`);
  rows.push('| interaction | per game | in games | decisive with | decisive without | Δ decisive |');
  rows.push('|---|---|---|---|---|---|');
  for (const k of KEYS) {
    const inGames = acc.with[k];
    if (!inGames) { rows.push(`| ${k} | 0.00 | 0.0% | — | — | — |`); continue; }
    const dw = acc.decisiveWith[k] / inGames;
    const dn = (acc.decisive - acc.decisiveWith[k]) / (g - inGames || 1);
    rows.push(`| ${k} | ${(acc.ev[k] / g).toFixed(2)} | ${pct(inGames / g)} | ${pct(dw)} | ${pct(dn)} | ${((dw - dn) * 100).toFixed(1)} pts |`);
  }
  rows.push('');
}

writeFileSync(OUT_JSON, JSON.stringify(results, null, 1) + '\n');
writeFileSync(OUT_MD, `# Interaction profile — 2026-09-17

What actually happens in recorded games: events per game, the share of games an interaction appears
in, and the decisive share in games with and without it. The last column is a **correlation**, not a
cause: an interaction can be rare *because* games end before it happens.

${rows.join('\n')}
Read by \`tools/jev-interest.ts\` as the parameter table for the interestingness rubric.
`);
console.log(`interactions: wrote ${OUT_MD} and ${OUT_JSON}`);
