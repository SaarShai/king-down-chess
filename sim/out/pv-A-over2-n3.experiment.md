# Piece values — pv-A-over2-n3

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. **Muller's second step:** the knight army also plays a pawn down
(one file per config, all eight), so each arm measures the fairy piece plus a pawn. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 1000 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: `A=138` (the rest keep `src/ai/eval.ts`).

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 1000 | 500 | [179, 61, 178, 30, 52] | 0.357 | -102 ± 20 | -107 | 0.0% | -3.29 | H0 | 9.9% | 0.0% | 89 |

**One pawn = 77 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -102 ± 20 | -1.32 ± 0.26 | 0.84 ± 0.26 | 1.38 | 3.50 | 84 |

Implied value = n (3.16) − 1 (the pawn of odds) + Elo / 77.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 84;
```
