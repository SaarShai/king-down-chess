# Piece values — values-d4-p2

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 4, 120 games per arm, 4 random opening plies.
Rules: defaults.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | 120 | 60 | [18, 15, 19, 4, 4] | 0.337 | -117 ± 51 | -137 | 0.0% | -0.48 | continue | 17.5% | 0.0% | 110 |
| G | 120 | 60 | [37, 5, 14, 1, 3] | 0.200 | -241 ± 51 | -256 | 0.0% | -0.66 | continue | 6.7% | 0.0% | 96 |
| S | 120 | 60 | [29, 11, 15, 3, 2] | 0.242 | -199 ± 49 | -229 | 0.0% | -0.64 | continue | 12.5% | 0.8% | 110 |
| pawn | 360 | 180 | [42, 22, 65, 27, 24] | 0.457 | -30 ± 33 | -32 | 3.9% | -0.41 | continue | 14.2% | 1.1% | 95 |

**One pawn = 30 ± 33 Elo** at this depth (the `pawn` arm). Every
implied value below carries that calibration error on top of its own.

> **The calibration arm did not resolve** (the pawn is worth less than its own error bar).
> Implied values are printed as `n/a`: play more games, or raise the depth, before reading them.


## Implied values
| piece | Elo vs knight | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| A (archer) | -117 ± 51 | n/a | n/a | 2.60 | 3.50 | n/a |
| G (guard) | -241 ± 51 | n/a | n/a | 1.85 | 2.00 | n/a |
| S (beast) | -199 ± 49 | n/a | n/a | 1.95 | 2.20 | n/a |

Implied value = knight (3.20) + Elo / 30.

** 3 swap(s) fall outside the linear band of ±1.5 pawns that Muller's method needs. The score
saturates there, so the conversion under-reads the gap: take the marked rows as "far below a
knight", not as a number. The fix is Muller's second step — hand the strong side a pawn and play
again until the result brackets 50%. The next-seed column floors at 50 cp for the same reason.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

No update this pass: the calibration arm did not resolve.
