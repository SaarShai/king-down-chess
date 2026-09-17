# Piece values — values-d3

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 200 games per arm, 4 random opening plies.
Rules: defaults.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 200 | 100 | [30, 20, 30, 8, 12] | 0.380 | -85 ± 45 | -90 | 0.0% | -0.57 | continue | 21.0% | 0.0% | 99 |
| L | 200 | 100 | [23, 3, 33, 18, 23] | 0.537 | +26 ± 48 | +26 | 85.4% | 0.16 | continue | 11.5% | 0.0% | 92 |
| G | 200 | 100 | [51, 13, 28, 5, 3] | 0.240 | -200 ± 38 | -228 | 0.0% | -1.06 | continue | 10.0% | 0.0% | 87 |
| M | 200 | 100 | [14, 10, 42, 21, 13] | 0.522 | +16 ± 40 | +19 | 77.8% | 0.11 | continue | 21.5% | 0.0% | 101 |
| S | 200 | 100 | [53, 9, 24, 8, 6] | 0.262 | -179 ± 43 | -183 | 0.0% | -0.96 | continue | 9.5% | 0.0% | 85 |
| pawn | 600 | 300 | [80, 34, 126, 22, 38] | 0.420 | -56 ± 25 | -61 | 0.0% | -1.21 | continue | 11.0% | 0.7% | 83 |

**One pawn = 56 ± 25 Elo** at this depth (the `pawn` arm). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -85 ± 45 | -1.52 ± 0.80 ** | < 1.70 ** | 4.30 | 3.50 | 168 |
| L (paladin) | +26 ± 48 | +0.47 ± 0.86 | 3.67 ± 0.86 | 4.70 | 4.00 | 367 |
| G (guard) | -200 ± 38 | -3.57 ± 0.68 ** | < 1.70 ** | 2.50 | 2.00 | 50 |
| M (maester) | +16 ± 40 | +0.28 ± 0.71 | 3.48 ± 0.71 | 3.30 | 3.50 | 348 |
| S (beast) | -179 ± 43 | -3.20 ± 0.77 ** | < 1.70 ** | 3.50 | 2.20 | 50 |

Implied value = knight (3.20) + Elo / 56.

** 3 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far below a
knight", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 168, PALADIN_V = 367, GUARD_V = 50, MAESTER_V = 348, BEAST_V = 50;
```
