#!/usr/bin/env -S npx tsx
/**
 * Policy distillation data: label positions with the search's own best move at a chosen depth, so a
 * small policy net can later rank moves instantly (move ordering, and eventually an instant player).
 *
 *   tsx tools/policy-data.ts --file ../king-down-sim/sim/out/nnue-g2.jsonl --positions 20000 --depth 4
 *
 * Record format (70 bytes, little-endian, appended):
 *   0…63  board bytes (a1 = 0)
 *   64    side to move
 *   65    from square
 *   66    to square
 *   67    promo piece type (0 = none)
 *   68…69 best-minus-second score margin, centipawns, signed Int16
 *
 * Sampling is deterministic: every Nth game from the file, every Mth plie after the opening, and
 * positions in check are skipped (their best move is a forced reply, which teaches nothing about
 * plan choice). The manifest records the run, depth, counts and a content hash.
 */
import { createReadStream, createWriteStream, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Position, inCheck, makeMove } from '../src/rules/engine';
import { fromFen, toLan } from '../src/rules/setup';
import { resetSearchState, search } from '../src/ai/search';
import { parseLan } from '../src/sim/tune';
import { setEvaluator } from '../src/ai/eval';
import type { GameRecord } from '../src/sim/game';

const flag = (name: string, dflt: string): string => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
export const REC = 70;
const FILE = flag('file', '../king-down-sim/sim/out/nnue-g2.jsonl');
const WANT = Number(flag('positions', '20000'));
const DEPTH = Number(flag('depth', '4'));
const OUT_DIR = 'sim/nnue';
const OUT = `${OUT_DIR}/policy.bin`;
const STRIDE_PLY = Number(flag('stride', '6'));
const GAME_STEP = Number(flag('gameStep', '1'));

if (!existsSync(FILE)) { console.error(`policy-data: ${FILE} is missing`); process.exit(2); }
mkdirSync(OUT_DIR, { recursive: true });
setEvaluator('linear'); // the teacher is the shipped linear search, as every lab run
resetSearchState();

const out = createWriteStream(OUT, { flags: 'w' });
const buf = Buffer.alloc(REC * 4096);
let bufLen = 0, kept = 0, seen = 0, games = 0, skippedCheck = 0;
const t0 = Date.now();
const hash = createHash('sha256');

async function flush(): Promise<void> {
  if (!bufLen) return;
  const chunk = buf.subarray(0, bufLen);
  hash.update(chunk);
  if (!out.write(Buffer.from(chunk))) await new Promise<void>(res => out.once('drain', () => res()));
  bufLen = 0;
}

const rl = createInterface({ input: createReadStream(FILE), crlfDelay: Infinity });
let game = -1;
for await (const line of rl) {
  if (!line) continue;
  if (kept >= WANT) break;
  const rec = JSON.parse(line) as GameRecord;
  game++;
  if (game % GAME_STEP) continue;
  games++;
  let pos: Position = fromFen(rec.startFen);
  const open = rec.openingPlies ?? 0;
  for (let i = 0; i < rec.moves.length && kept < WANT; i++) {
    const lan = rec.moves[i].lan;
    const mv = parseLan(pos.board, lan);
    if (toLan(pos, mv) !== lan) throw new Error(`game ${rec.gameId} ply ${i}: cannot replay ${lan}`);
    if (i >= open + 2 && (i - open) % STRIDE_PLY === 0 && !inCheck(pos)) {
      seen++;
      resetSearchState();
      const r = search(pos, { maxDepth: DEPTH, multiPv: 2 });
      if (r.move && typeof r.second === 'number') {
        const off = bufLen;
        buf.set(pos.board, off);
        buf[off + 64] = pos.turn;
        buf[off + 65] = r.move.from;
        buf[off + 66] = r.move.to;
        buf[off + 67] = r.move.promo ?? 0;
        const margin = Math.round(r.score - r.second);
        buf.writeInt16LE(Math.max(-32768, Math.min(32767, margin)), off + 68);
        bufLen += REC;
        kept++;
        if (bufLen >= buf.length) await flush();
      }
    }
    pos = makeMove(pos, mv);
  }
  if (kept % 5000 < STRIDE_PLY) process.stdout.write(`\rpolicy-data: ${kept}/${WANT} positions (${games} games, ${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
await flush();
await new Promise<void>(res => out.end(res));
const sha = hash.digest('hex');
writeFileSync(`${OUT_DIR}/policy.json`, JSON.stringify({
  source: FILE, positions: kept, candidatesSeen: seen, skippedInCheck: skippedCheck, depth: DEPTH,
  bytesPerRecord: REC, bytes: kept * REC, sha256: sha,
  note: 'Policy distillation data: board, side to move, search best move (from/to/promo), best-minus-second margin. Teacher = linear search at the recorded depth.',
}, null, 2) + '\n');
console.log(`\npolicy-data: ${kept} positions from ${games} games in ${((Date.now() - t0) / 1000).toFixed(0)}s -> ${OUT} (sha256 ${sha.slice(0, 16)}…)`);
