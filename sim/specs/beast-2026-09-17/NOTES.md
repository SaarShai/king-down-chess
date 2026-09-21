# Beast blind-spot route (2026-09-17)

Question: is removing the beast's straight-ahead capture blind spot
(`beastCaptureForward=true`, all 8 neighbours) safe to ship as a simplification?

Specs in this directory:

- `pb-ab-S-all8-d4b.base.json`, `pb-ab-S-all8-d4b.var.json` — paired A/B, 1,600 games per arm,
  depth 4, seed 72, sample 40, 4 workers, common random numbers (`--experiment ab --rule
  "beastCaptureForward=true"`).
- `pb-S-all8-value.S.json` — value pass on the same rule, 500 games, depth 3, seed 77
  (`--experiment values --pieces S --eloPerPawn 64`).

Outputs: `sim/out/pb-ab-S-all8-d4b.experiment.md`, `sim/out/pb-S-all8-value.experiment.md`.
Verdict and numbers: `docs/research/sim-beast-all8-2026-09-17.md`. Depth-4 balance, fairness and
interest are neutral; pace costs −6.6 ± 4.0 plies; the beast implies 4.34 ± 0.42 pawns under the
rule against the shipped `BEAST_V` 377 (next Muller seed 434).
