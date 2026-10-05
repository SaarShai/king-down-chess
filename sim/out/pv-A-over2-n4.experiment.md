# Piece values — pv-A-over2-n4

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. **Muller's second step:** the knight army also plays a pawn down
(one file per config, all eight), so each arm measures the fairy piece plus a pawn. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: `A=84` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [177, 56, 190, 30, 47] | 0.357 | -102 ± 19 | -110 | 0.0% | -3.36 | H0 | 9.5% | 0.1% | 86 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -102 ± 19 | -1.33 ± 0.25 | 0.83 ± 0.25 | 0.84 | 3.50 | 83 |

Implied value = n (3.16) − 1 (the pawn of odds) + Elo / 77.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 83;
```
