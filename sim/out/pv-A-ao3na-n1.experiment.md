# Piece values — pv-A-ao3na-n1

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: `{"archerShots":"over23"}`.
Engine values: `A=299` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [129, 34, 213, 30, 94] | 0.463 | -26 ± 21 | -26 | 0.8% | -0.94 | continue | 7.3% | 0.1% | 110 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -26 ± 21 | -0.33 ± 0.27 | 2.83 ± 0.27 | 2.99 | 3.50 | 283 |

Implied value = n (3.16) + Elo / 77.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 283;
```
