# Piece values — tuned-values

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 300 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 300 | 150 | [20, 16, 60, 26, 28] | 0.543 | +30 ± 34 | +34 | 95.7% | 0.32 | continue | 14.3% | 0.3% | 96 |
| L | 300 | 150 | [31, 25, 65, 12, 17] | 0.432 | -48 ± 33 | -56 | 0.3% | -0.56 | continue | 18.3% | 0.0% | 92 |
| G | 300 | 150 | [58, 31, 48, 7, 6] | 0.287 | -158 ± 31 | -189 | 0.0% | -1.46 | continue | 14.0% | 2.0% | 107 |
| M | 300 | 150 | [31, 30, 55, 19, 15] | 0.428 | -50 ± 34 | -58 | 0.2% | -0.58 | continue | 19.0% | 2.0% | 108 |
| S | 300 | 150 | [26, 25, 59, 19, 21] | 0.473 | -19 ± 34 | -21 | 14.6% | -0.23 | continue | 17.0% | 0.3% | 94 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | +30 ± 34 | +0.47 ± 0.54 | 3.43 ± 0.54 | 2.95 | 3.50 | 343 |
| L (paladin) | -48 ± 33 | -0.75 ± 0.52 | 2.21 ± 0.52 | 3.18 | 4.00 | 221 |
| G (guard) | -158 ± 31 | -2.47 ± 0.48 ** | < 1.46 ** | 1.24 | 2.00 | 50 |
| M (maester) | -50 ± 34 | -0.78 ± 0.53 | 2.18 ± 0.53 | 2.91 | 3.50 | 218 |
| S (beast) | -19 ± 34 | -0.29 ± 0.54 | 2.67 ± 0.54 | 2.61 | 2.20 | 267 |

Implied value = knight (2.96) + Elo / 64.

** 1 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 343;
export const PALADIN_V = 221;
export const GUARD_V = 50;
export const MAESTER_V = 218;
export const BEAST_V = 267;
```
