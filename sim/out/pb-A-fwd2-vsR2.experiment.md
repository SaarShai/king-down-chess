# Piece values — pb-A-fwd2-vsR2

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **rook** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 500 | 250 | [39, 19, 102, 32, 58] | 0.551 | +36 ± 28 | +38 | 99.3% | 0.59 | continue | 11.8% | 0.0% | 88 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs r | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | +36 ± 28 | +0.56 ± 0.44 | 5.05 ± 0.44 | 3.37 | 3.50 | 505 |

Implied value = r (4.49) + Elo / 64.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 505;
```
