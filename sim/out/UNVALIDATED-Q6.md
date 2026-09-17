# Q6 dataset is UNVALIDATED

`nnue-g1.jsonl` (80,000 games), `positions.bin`, `net.json`, `src/ai/nnue/weights.ts` and the
`nnue-res-d3/d4` matches were produced by the inherited chain that `queue3.sh` ran on 2026-09-14.
The chain completed (marker `q6-2026-09-14.done`), but its success was never validated:

- every record carries **no rule/pool/source stamp** (the writer loaded before stamping existed);
- generation ended `exit 1` (a summary-write bug, not a game failure);
- sampling reset to current defaults and recorded no input fingerprint;
- the documented 400-game rejection gate was skipped, and the match arms do not pin the net blob.

Treat these files as historical evidence only. Phase 3 of `docs/TAKEOVER-PLAN.md` audits them.
Do not train on them, publish a model from them, or resume them in place.
See `docs/takeover/BASELINE.md` for the full record.
