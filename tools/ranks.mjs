/**
 * Constrained back-rank lists for the configuration runs (docs/research/sim-configs-2026-09-13.md).
 *
 * It is a faithful clone of `sampleBackRank` in src/sim/spec.ts — same RNG (mulberry32), same call
 * order (shuffle the pool, take 7, shuffle with the king), same "two bishops sit on opposite
 * colours" rejection — plus one extra rejection for the placement constraint. Same seed and
 * `--constraint none` therefore reproduce the sampler's own list exactly, which is what makes a
 * constrained set and its control like-for-like: one RNG stream, one pool, one extra filter.
 *
 *   node tools/ranks.mjs --n 20 --seed 42 --constraint kingCorner
 *   node tools/ranks.mjs --n 20 --seed 42 --constraint none --id cfg-control --games 3200 \
 *     --depth 3 --runseed 7 --out sim/specs/cfg-control.json
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const POOL = 'QLRRBBNNAAGGMMSS';

const mulberry32 = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = (a, rng) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const at = (row, p) => row.split('').flatMap((c, i) => (c === p ? [i] : []));
const adjacent = (row, p) => {
  const k = row.indexOf('K');
  return at(row, p).some((i) => Math.abs(i - k) === 1);
};

/** Each takes the 8-char back rank (index 0 = file a) and says whether to keep it. */
export const CONSTRAINTS = {
  none: () => true,
  kingCorner: (r) => r[0] === 'K' || r[7] === 'K',
  kingCentre: (r) => r[3] === 'K' || r[4] === 'K',
  queenCorner: (r) => r[0] === 'Q' || r[7] === 'Q',
  bishopsCorners: (r) => r[0] === 'B' && r[7] === 'B',
  guardAdjKing: (r) => adjacent(r, 'G'),
  maesterAdjKing: (r) => adjacent(r, 'M'),
  archersAdjacent: (r) => {
    const a = at(r, 'A');
    return a.length === 2 && a[1] - a[0] === 1;
  },
  beastsFlanks: (r) => r[0] === 'S' && r[7] === 'S',
};

export function sampleRanks(n, seed, constraint = 'none', pool = POOL) {
  const keep = CONSTRAINTS[constraint];
  if (!keep) throw new Error(`unknown constraint "${constraint}" (have: ${Object.keys(CONSTRAINTS).join(', ')})`);
  const rng = mulberry32(seed);
  const out = [];
  for (let tries = 0; out.length < n; tries++) {
    if (tries > 5e6) throw new Error(`constraint "${constraint}" yielded ${out.length}/${n} ranks in 5M tries`);
    const row = shuffle([...shuffle(pool.split(''), rng).slice(0, 7), 'K'], rng).join('');
    const b = at(row, 'B');
    if (b.length === 2 && (b[0] + b[1]) % 2 === 0) continue; // bishops on opposite colours
    if (keep(row)) out.push(row);
  }
  return out;
}

// A path with a space is percent-encoded in `import.meta.url`, so compare resolved paths (as src/sim/run.ts does).
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const f = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) f[a.slice(2)] = process.argv[i + 1]?.startsWith('--') === false ? process.argv[++i] : true;
  }
  const ranks = sampleRanks(+(f.n ?? 20), +(f.seed ?? 42), f.constraint ?? 'none', f.pool ?? POOL);
  if (!f.out) { console.log(JSON.stringify(ranks, null, 0)); process.exit(0); }
  const spec = {
    id: f.id ?? 'run',
    games: +(f.games ?? 3200),
    backRanks: ranks,
    ai: { depth: +(f.depth ?? 3) },
    seed: +(f.runseed ?? 7),
  };
  writeFileSync(f.out, JSON.stringify(spec, null, 2) + '\n');
  console.log(`${spec.id}: ${ranks.length} ranks (${f.constraint ?? 'none'}) -> ${f.out}`);
}
