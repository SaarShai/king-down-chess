# Piece values — pv-A-vsR-d4

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **rook** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 4, 600 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 600 | 300 | [29, 34, 93, 63, 81] | 0.611 | +78 ± 25 | +86 | 100.0% | 1.58 | continue | 18.0% | 0.5% | 98 |
| pawn | 1800 | 900 | [227, 189, 289, 103, 92] | 0.401 | -70 ± 14 | -77 | 0.0% | -4.49 | H0 | 21.0% | 0.3% | 100 |

**One pawn = 70 ± 14 Elo** at this depth
(the `pawn` arm). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs r | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | +78 ± 25 | +1.12 ± 0.36 | 5.61 ± 0.36 | 5.05 | 3.50 | 561 |

Implied value = r (4.49) + Elo / 70.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 561;
```
