# Piece values — ov-T-bonus

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 300 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| T | 300 | 150 | [34, 28, 56, 10, 22] | 0.430 | -49 ± 36 | -53 | 0.4% | -0.54 | continue | 15.3% | 0.0% | 92 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| T (templar) | -49 ± 36 | -0.77 ± 0.56 | 2.39 ± 0.56 | 3.50 | 3.75 | 239 |

Implied value = knight (3.16) + Elo / 64.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const TEMPLAR_V = 239;
```
