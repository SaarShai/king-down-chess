# Q6 replacement — accept or reject (2026-09-16)

The inherited Q6 corpus was audited and excluded (`docs/research/ai-q6-audit-2026-09-16.md`); this
report covers the `nnue-g2` replacement chain (`tools/q6-chain.sh`), whose success marker is written
only after `tools/q6-validate.mjs` passes. Marker present: **yes**. Evidence read
from `sim/q6-g2/`.

## Verdict

**ACCEPTED as a candidate**: every gate passed. Adoption is still a separate, reviewed release step.

## Stages

| stage | result |
|---|---|
| generation (`nnue-g2`) | 80000 games, 11559.1s, White 0.5445, adjudicatedResign 58375, adjudicatedDraw 17810, draw50 751, drawRepetition 1527, drawMaterial 593, plyCap 913, stalemate 21, checkmate 10 |
| dataset | 80000 games sampled, 7820736 positions (777201 held out), nnue-g2 0e2fb239/5499b16edd36, sampler 4ab790baf8b7 |
| training | residual net, 7820736 positions, best validation 0.000674 at epoch 15; dataset sha256 33d8146b099c2dfd…, model sha256 e17a27bfbadb029e… |
| pinned arm | eval-residual.json pins a residual blob (120408 base64 chars) |
| 400-game gate, depth 3 | +167 ± 26 Elo (score 0.724, 400 games, 200 pairs) |
| 1,600-game decision, depth 3 | +139 ± 14 Elo (score 0.690, 1600 games, 800 pairs) |
| depth-4 confirmation | +149 ± 37 Elo (score 0.703, 200 games, 100 pairs) |
| speed | linear: 341465 nodes/s, 1s depth 6.08 · residual: 257539 nodes/s, 1s depth 5.92 |

The raw records `sim/out/nnue-res2-*.{jsonl,summary.json,tuned.json}` and `sim/nnue/{positions,net,train,bench}.json`
stay on disk; `docs/takeover/baseline.json` does not cover them (it froze the *inherited* state), so
verify them with `node tools/q6-validate.mjs final` before quoting any number.
