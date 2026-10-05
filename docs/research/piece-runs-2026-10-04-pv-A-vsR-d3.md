# Piece values — pv-A-vsR-d3

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **rook** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [65, 25, 199, 54, 157] | 0.607 | +75 ± 20 | +79 | 100.0% | 2.43 | continue | 10.3% | 0.0% | 89 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs r | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | +75 ± 20 | +0.98 ± 0.26 | 5.47 ± 0.26 | 5.05 | 3.50 | 547 |

Implied value = r (4.49) + Elo / 77.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 547;
```
