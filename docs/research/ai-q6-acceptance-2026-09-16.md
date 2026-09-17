# Q6 replacement — accept or reject (2026-09-16)

The inherited Q6 corpus was audited and excluded (`docs/research/ai-q6-audit-2026-09-16.md`); this
report covers the `nnue-g2` replacement chain (`tools/q6-chain.sh`), whose success marker is written
only after `tools/q6-validate.mjs` passes. Marker present: **no**. Evidence read
from `sim/q6-g2/`.

## Verdict

The chain has not finished; this is a progress record, not a verdict.

## Stages

| stage | result |
|---|---|
| generation (`nnue-g2`) | **not finished** |
| dataset | **not finished** |
| training | **not finished** |
| pinned arm | **not finished** |
| 400-game gate, depth 3 | **not finished** |
| 1,600-game decision, depth 3 | **not finished** |
| depth-4 confirmation | **not finished** |
| speed | **not finished** |

The raw records `sim/out/nnue-res2-*.{jsonl,summary.json,tuned.json}` and `sim/nnue/{positions,net,train,bench}.json`
stay on disk; `docs/takeover/baseline.json` does not cover them (it froze the *inherited* state), so
verify them with `node tools/q6-validate.mjs final` before quoting any number.
