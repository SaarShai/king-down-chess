# Piece values — pb-values-refresh2

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: defaults.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 500 | 250 | [16, 11, 82, 31, 110] | 0.708 | +154 ± 26 | +167 | 100.0% | 2.23 | continue | 10.4% | 0.0% | 85 |
| L | 500 | 250 | [35, 19, 92, 35, 69] | 0.584 | +59 ± 29 | +62 | 100.0% | 0.97 | continue | 11.4% | 0.2% | 93 |
| G | 500 | 250 | [126, 28, 75, 12, 9] | 0.250 | -191 ± 25 | -214 | 0.0% | -2.58 | continue | 8.6% | 1.0% | 93 |
| M | 500 | 250 | [43, 30, 96, 44, 37] | 0.502 | +1 ± 27 | +2 | 54.0% | -0.01 | continue | 17.2% | 0.0% | 98 |
| S | 500 | 250 | [31, 32, 93, 38, 56] | 0.556 | +39 ± 27 | +43 | 99.7% | 0.67 | continue | 15.8% | 0.2% | 98 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | +154 ± 26 | +2.40 ± 0.41 ** | > 4.66 ** | 5.05 | 3.50 | 556 |
| L (paladin) | +59 ± 29 | +0.92 ± 0.45 | 4.08 ± 0.45 | 3.74 | 4.00 | 408 |
| G (guard) | -191 ± 25 | -2.98 ± 0.39 ** | < 1.66 ** | 0.96 | 2.00 | 50 |
| M (maester) | +1 ± 27 | +0.02 ± 0.42 | 3.18 ± 0.42 | 2.82 | 3.50 | 318 |
| S (beast) | +39 ± 27 | +0.61 ± 0.43 | 3.77 ± 0.43 | 3.68 | 2.20 | 377 |

Implied value = n (3.16) + Elo / 64.

** 2 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far from a knight,
on the side the bound points", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const ARCHER_V = 556;
export const PALADIN_V = 408;
export const GUARD_V = 50;
export const MAESTER_V = 318;
export const BEAST_V = 377;
```
