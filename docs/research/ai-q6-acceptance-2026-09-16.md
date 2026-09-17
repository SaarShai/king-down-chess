# Q6 replacement — accept or reject (2026-09-16)

The inherited Q6 corpus was audited and excluded (`docs/research/ai-q6-audit-2026-09-16.md`); this
report covers the `nnue-g2` replacement chain (`tools/q6-chain.sh`), whose success marker is written
only after `tools/q6-validate.mjs` passes. Marker present: **no**.

## Verdict

The chain has not finished; this is a progress record, not a verdict.

## Stages

| stage | result |
|---|---|
| generation (`nnue-g2`) | **not finished** |
| dataset | 80000 games sampled, 7487107 positions (752039 held out), undefined undefined/undefined, sampler undefined |
| training | residual net, 7487107 positions, best validation 0.000742 at epoch 14; dataset sha256 undefined…, model sha256 undefined… |
| pinned arm | **not finished** |
| 400-game gate, depth 3 | **not finished** |
| 1,600-game decision, depth 3 | **not finished** |
| depth-4 confirmation | **not finished** |
| speed | linear: 387661 nodes/s, 1s depth 6.08 · residual: 282147 nodes/s, 1s depth 5.92 |

The raw records `sim/out/nnue-res2-*.{jsonl,summary.json,tuned.json}` and `sim/nnue/{positions,net,train,bench}.json`
stay on disk; `docs/takeover/baseline.json` does not cover them (it froze the *inherited* state), so
verify them with `node tools/q6-validate.mjs final` before quoting any number.
