# Piece values — pb-S-diagonal-value

Muller's asymmetric-material method (docs/SIM-PLAN.md §7). Each arm replaces one **knight** of the
classic arrangement `RNBQKBNR` with one fairy piece, on one side only, and plays
colour-reversed pairs. The last arm gives White pawn odds; it converts Elo into pawns.

Depth 3, 500 games per arm, 4 random opening plies.
Rules: `{"beastCapture":"diagonal"}`.
Engine values: the shipped constants.

## Arms (scores are the fairy army's, folded over the colour swap)
| arm | games | pairs | pentanomial | score | Elo ±95% | nElo | LOS | LLR | SPRT | draws | capped | plies |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S | 500 | 250 | [72, 48, 85, 20, 25] | 0.378 | -87 ± 27 | -95 | 0.0% | -1.49 | continue | 17.2% | 0.8% | 97 |

**One pawn = 64 Elo** at this depth
(carried over with `--eloPerPawn`; no calibration arm was played here). Every
implied value below carries that calibration error on top of its own.


## Implied values
| piece | Elo vs n | Δ pawns | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|---|---|
| S (beast) | -87 ± 27 | -1.35 ± 0.42 | 1.81 ± 0.42 | 3.77 | 2.20 | 181 |

Implied value = n (3.16) + Elo / 64.


## Muller fixed-point update
Write the "next seed" column into `src/ai/eval.ts`, then run this experiment again. The values are
converged when a pass moves no piece by more than its error bar. A seed that inverts a plausible
exchange makes self-play blind, so never stop after one pass.

```ts
export const BEAST_V = 181;
```
