# Piece values — values-d5

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 5, 120 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 120 | 60 | [25, 8, 23, 2, 2] | 0.283 | -161 ± 48 | -193 | 0.0% | -0.59 | continue | 10.0% | 0.0% | 95 |
| G | 120 | 60 | [34, 11, 13, 1, 1] | 0.183 | -260 ± 42 | -323 | 0.0% | -0.69 | continue | 10.0% | 0.0% | 95 |
| S | 120 | 60 | [35, 9, 14, 1, 1] | 0.183 | -260 ± 43 | -317 | 0.0% | -0.69 | continue | 8.3% | 1.7% | 95 |

**One pawn = 65 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -161 ± 48 | -2.48 ± 0.75 ** | < 1.70 ** | 1.70 | 3.50 | 72 |
| G (guard) | -260 ± 42 | -3.99 ± 0.65 ** | < 1.70 ** | 1.85 | 2.00 | 50 |
| S (beast) | -260 ± 43 | -3.99 ± 0.66 ** | < 1.70 ** | 1.95 | 2.20 | 50 |

Implied value = knight (3.20) + Elo / 65.

** 3 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 72;
export const GUARD_V = 50;
export const BEAST_V = 50;
```
