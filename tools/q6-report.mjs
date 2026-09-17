#!/usr/bin/env node
/**
 * Q6 accept/reject report (docs/TAKEOVER-PLAN.md §3). Reads what the replacement chain wrote and
 * turns it into `docs/research/ai-q6-acceptance-2026-09-16.md`. Safe to run at any time: a missing
 * stage is reported as "not finished", never guessed.
 *
 *   node tools/q6-report.mjs
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = 'docs/research/ai-q6-acceptance-2026-09-16.md';
const baseArg = process.argv.indexOf('--base');
/** Where the chain wrote. Default this repo; pass the worktree, e.g. `--base ../king-down-sim/sim`. */
const BASE = baseArg >= 0 && process.argv[baseArg + 1] ? process.argv[baseArg + 1] : 'sim';
const read = (f) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : null);
const at = (rel) => read(`${BASE}/${rel}`);
const arms = {
  gate: at('out/nnue-res2-gate.tuned.json'),
  d3: at('out/nnue-res2-d3.tuned.json'),
  d4: at('out/nnue-res2-d4.tuned.json'),
};
const dataset = at('nnue/positions.json');
const train = at('nnue/train.json');
const bench = at('nnue/bench.json');
const gen = at('out/nnue-g2.summary.json');
const residual = at('nnue/eval-residual.json');
const done = existsSync(`${BASE}/out/q6-nnue-g2.done`);

const elo = (a) => (a ? `${a.elo >= 0 ? '+' : ''}${a.elo.toFixed(0)} ± ${a.err95.toFixed(0)} Elo (score ${a.mu.toFixed(3)}, ${a.games} games, ${a.pairs} pairs)` : '**not finished**');
const verdict = (() => {
  if (!done) return 'The chain has not finished; this is a progress record, not a verdict.';
  if (!arms.gate || arms.gate.mu < 0.5) return '**REJECTED at the 400-game gate** (score below 0.5). The default stays linear.';
  if (arms.d3 && !(arms.d3.elo - arms.d3.err95 > 0)) return '**REJECTED at the 1,600-game decision** (the 95% lower Elo bound is not positive). The default stays linear.';
  if (arms.d4 && arms.d4.elo <= 0) return '**REJECTED at the depth-4 confirmation** (the sign reverses). The default stays linear.';
  const row = Array.isArray(bench) ? bench.find(r => r.evaluator === 'residual') : null;
  if (row && row.meanDepthIn1s < 5) return '**REJECTED on speed** (the residual 1-second search drops below depth 5). The default stays linear.';
  return '**ACCEPTED as a candidate**: every gate passed. Adoption is still a separate, reviewed release step.';
})();

const md = `# Q6 replacement — accept or reject (2026-09-16)

The inherited Q6 corpus was audited and excluded (\`docs/research/ai-q6-audit-2026-09-16.md\`); this
report covers the \`nnue-g2\` replacement chain (\`tools/q6-chain.sh\`), whose success marker is written
only after \`tools/q6-validate.mjs\` passes. Marker present: **${done ? 'yes' : 'no'}**. Evidence read
from \`${BASE}/\`.

## Verdict

${verdict}

## Stages

| stage | result |
|---|---|
| generation (\`nnue-g2\`) | ${gen ? `${gen.games} games, ${gen.seconds}s, White ${gen.whiteScore}, ${Object.entries(gen.reasons).map(([k, v]) => `${k} ${v}`).join(', ')}` : '**not finished**'} |
| dataset | ${dataset ? `${dataset.games} games sampled, ${dataset.kept} positions (${dataset.val} held out), ${dataset.runs.map(r => `${r.id} ${r.rulesKey}/${r.specKey}`).join(', ')}, sampler ${dataset.sampledBy}` : '**not finished**'} |
| training | ${train ? `residual net, ${train.positions} positions, best validation ${train.bestVal} at epoch ${train.bestEpoch}; dataset sha256 ${String(train.dataset?.sha256).slice(0, 16)}…, model sha256 ${String(train.model?.sha256).slice(0, 16)}…` : '**not finished**'} |
| pinned arm | ${residual?.net?.b64 ? `eval-residual.json pins a ${residual.net.kind} blob (${residual.net.b64.length} base64 chars)` : '**not finished**'} |
| 400-game gate, depth 3 | ${elo(arms.gate)} |
| 1,600-game decision, depth 3 | ${elo(arms.d3)} |
| depth-4 confirmation | ${elo(arms.d4)} |
| speed | ${bench ? bench.map(r => `${r.evaluator}: ${r.nodesPerSec} nodes/s, 1s depth ${r.meanDepthIn1s}`).join(' · ') : '**not finished**'} |

The raw records \`sim/out/nnue-res2-*.{jsonl,summary.json,tuned.json}\` and \`sim/nnue/{positions,net,train,bench}.json\`
stay on disk; \`docs/takeover/baseline.json\` does not cover them (it froze the *inherited* state), so
verify them with \`node tools/q6-validate.mjs final\` before quoting any number.
`;writeFileSync(OUT, md);
console.log(`q6-report: ${verdict}\nq6-report: wrote ${OUT}`);
