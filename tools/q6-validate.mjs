#!/usr/bin/env node
/**
 * Acceptance guard for the Q6 replacement chain (docs/TAKEOVER-PLAN.md §3, bar: docs/research/
 * ai-residual-plan-2026-09-14.md §4). The chain calls this after the 400-game gate and again after
 * the depth-4 confirmation and the speed bench; the success marker is written only when it exits 0.
 *
 *   node tools/q6-validate.mjs gate  <gate-id>
 *   node tools/q6-validate.mjs final <gate-id> <d3-id> <d4-id>
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const fail = (msg) => { console.error(`q6-validate: FAIL — ${msg}`); process.exit(1); };
const ok = (msg) => console.log(`q6-validate: ok — ${msg}`);
const readJson = (f) => {
  if (!existsSync(f)) fail(`${f} is missing`);
  return JSON.parse(readFileSync(f, 'utf8'));
};

const stage = process.argv[2];
if (stage !== 'gate' && stage !== 'final') fail('usage: q6-validate.mjs gate <id> | final <gate> <d3> <d4>');

const armFile = (id) => `sim/out/${id}.tuned.json`;
const gateFile = armFile(process.argv[3]);
const gate = readJson(gateFile);

if (stage === 'gate') {
  if (gate.games < 400) fail(`${gateFile}: ${gate.games} games, the gate is 400`);
  // Reject and stop if the score is below 0.5 (the first net read 0.323 here).
  if (!(gate.mu >= 0.5)) fail(`${gateFile}: score ${gate.mu} < 0.5 — candidate rejected at the gate`);
  ok(`gate: score ${gate.mu.toFixed(3)} over ${gate.games} games`);
  process.exit(0);
}

// --- final: decision, confirmation, speed, provenance -----------------------------------------
const d3 = readJson(armFile(process.argv[4]));
const d4 = readJson(armFile(process.argv[5]));

if (d3.games < 1600) fail(`decision match played ${d3.games} games, the bar is 1600`);
if (!(d3.elo - d3.err95 > 0)) fail(`decision: Elo ${d3.elo.toFixed(1)} ± ${d3.err95.toFixed(1)} does not clear zero at 95%`);
ok(`decision: ${d3.games} games at depth 3, Elo ${d3.elo.toFixed(1)} ± ${d3.err95.toFixed(1)}`);

if (d4.games < 200) fail(`confirmation played ${d4.games} games, the bar is 200`);
if (!(d4.elo > 0)) fail(`confirmation: Elo ${d4.elo.toFixed(1)} changes sign at depth 4`);
ok(`confirmation: ${d4.games} games at depth 4, Elo ${d4.elo.toFixed(1)} ± ${d4.err95.toFixed(1)}`);

// The residual arm must pin the net blob, or the recorded match cannot be reproduced.
const residual = readJson('sim/nnue/eval-residual.json');
if (!residual.net?.b64 || residual.net.b64.length < 10_000) fail('eval-residual.json does not pin the net blob');
if (residual.net.kind !== 'residual') fail(`eval-residual.json carries a ${residual.net.kind} net`);
ok('arms: eval-residual.json pins the candidate blob');

const bench = readJson('sim/nnue/bench.json');
const row = Array.isArray(bench) ? bench.find(r => r.evaluator === 'residual') : null;
if (!row) fail('bench.json has no residual row');
if (!(row.meanDepthIn1s >= 5)) fail(`speed: residual 1s search reaches depth ${row.meanDepthIn1s}, the browser gate is 5`);
ok(`speed: residual 1s search reaches depth ${row.meanDepthIn1s} (${row.nodesPerSec} nodes/s)`);

const positions = readJson('sim/nnue/positions.json');
if (!(positions.games >= 79_000)) fail(`dataset holds ${positions.games} games, the plan generates 80,000`);
if (!positions.runs?.length) fail('positions.json carries no run fingerprints');
for (const r of positions.runs) {
  if (!r.specKey || !r.rulesKey || !r.src) fail(`run ${r.id} has no full fingerprint`);
}
ok(`dataset: ${positions.games} games, ${positions.runs.length} stamped run(s), sampled by ${positions.sampledBy}`);

const train = readJson('sim/nnue/train.json');
if (!(train.bestVal >= 0)) fail('train.json has no validation result');
if (train.model?.kind !== 'residual') fail(`trained ${train.model?.kind ?? 'unknown'} net, the plan trains a residual`);
if (train.model?.sha256 !== createHash('sha256').update(residual.net.b64).digest('hex')) {
  fail('the trained blob and the blob the arms pinned differ');
}
const sha = createHash('sha256').update(readFileSync('sim/nnue/positions.bin')).digest('hex');
if (sha !== train.dataset?.sha256) fail('positions.bin has changed since training: retrain or restore the corpus');
ok(`provenance: dataset sha256 matches train.json, model sha256 matches the pinned arm`);

console.log('\nq6-validate: ACCEPT — the candidate cleared the gate, the 1,600-game decision, the depth-4 confirmation and the speed bar.');
console.log('Adoption is still a separate, reviewed release step (docs/TAKEOVER-PLAN.md §3/§7).');
