# Piece values — values-d3-p3

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: defaults.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 500 | 250 | [101, 38, 76, 20, 15] | 0.310 | -139 ± 26 | -152 | 0.0% | -2.13 | continue | 12.4% | 0.4% | 91 |
| L | 500 | 250 | [52, 25, 104, 22, 47] | 0.487 | -9 ± 29 | -10 | 26.8% | -0.19 | continue | 10.2% | 0.0% | 88 |
| pawn | 1500 | 750 | [213, 91, 299, 56, 91] | 0.407 | -65 ± 16 | -71 | 0.0% | -3.45 | H0 | 11.0% | 0.0% | 81 |

**One pawn = 65 ± 16 Elo** at this depth (the `pawn` arm). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -139 ± 26 | -2.13 ± 0.40 ** | < 1.70 ** | 1.70 | 3.50 | 107 |
| L (paladin) | -9 ± 29 | -0.14 ± 0.44 | 3.06 ± 0.44 | 3.20 | 4.00 | 306 |

Implied value = knight (3.20) + Elo / 65.

** 1 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far below a
knight", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 107;
export const PALADIN_V = 306;
```
