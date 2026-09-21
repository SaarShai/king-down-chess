# Piece values — pb-S-all8-value

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: `{"beastCaptureForward":true}`.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S | 500 | 250 | [25, 18, 106, 27, 74] | 0.607 | +76 ± 27 | +84 | 100.0% | 1.28 | continue | 10.6% | 0.0% | 90 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| S (beast) | +76 ± 27 | +1.18 ± 0.42 | 4.34 ± 0.42 | 3.77 | 2.20 | 434 |

Implied value = n (3.16) + Elo / 64.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const BEAST_V = 434;
```
