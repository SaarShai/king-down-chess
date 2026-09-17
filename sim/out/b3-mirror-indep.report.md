# Sim report — b3-mirror-indep

2000 games. White score **0.506** (95% 0.489–0.523),
white advantage **+4 ± 12 Elo**.
Decisive 58.8% · draws 35.5% · capped 5.7% (counted apart, never as draws).
Plies: mean 137.6 ± 74.1, median 119. Rules: all defaults.

Pentanomial over 1000 colour-swapped pairs: [76, 231, 330, 270, 93] (LL, LD, DD/WL, WD, WW).
σ_pg 0.3827 · normalized Elo +17 · LOS 98.4% ·
SPRT LLR 0.96 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 2000 | 600 | 825 | 575 | 0.506 | 0.489–0.523 | +4 ±12 | 58.8% | 35.5% | 5.7% | 137.6±74.1 | 0.31 | 0.027 | 0.643 | 0.11 | 0.97 | 0.34 | 1.91 | 0.014 | 0.484 | 0.484 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | B | Q | K | R | M | G | A | P |
|---|---|---|---|---|---|---|---|---|
| use | 1.03 | 1.46 | 2.15 | 1.47 | 1.83 | 2.09 | 1.81 | 0.34 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1175 | 58.8% |
| adjudicatedDraw | 575 | 28.7% |
| plyCap | 114 | 5.7% |
| drawRepetition | 63 | 3.1% |
| draw50 | 45 | 2.3% |
| drawMaterial | 28 | 1.4% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| R | 50485 | 7577 | 4648 | 8000 | 3354 | 41.9% |
| P | 46272 | 8123 | 20318 | 32000 | 11273 | 35.2% |
| K | 37062 | 2338 | 0 | 4000 | 4000 | 100.0% |
| G | 36041 | 2263 | 248 | 4000 | 3773 | 94.3% |
| M | 31423 | 3178 | 2545 | 4000 | 1455 | 36.4% |
| A | 31061 | 4816 | 2721 | 4000 | 1280 | 32.0% |
| Q | 25203 | 4931 | 3280 | 4000 | 1100 | 27.5% |
| B | 17721 | 3896 | 3359 | 4000 | 643 | 16.1% |
| S | 0 | 0 | 1 | 0 | 0 | 0.0% |
| N | 0 | 0 | 2 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 4816 | 2.41 |
| beastChainMoves | 0 | 0.00 |
| beastChainCaptures | 0 | 0.00 |
| maesterSwaps | 12841 | 6.42 |
| maesterLongSwaps | 2286 | 1.14 |
| paladinSacrifices | 0 | 0.00 |
| promotions | 409 | 0.20 |
| checks | 17586 | 8.79 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 1.131 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 73 (3.6%) |
| games where a king never moved | 451 (22.6%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | 0.000 | 0.000 | -0.000 | 0.000 | 0.000 | 0.014 | 0.001 | 0.001 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KQGRARBM vs KRAQMRBG | 100 | 31 | 38 | 31 | 0.500 | 0.423–0.577 | +0 ±59 | 62.0% | 33.0% | 5.0% | 136.7±68.9 | 0.35 | 0.031 | 0.640 | 0.12 | 0.97 | 0.34 | 1.78 | 0.051 | 0.494 | 0.494 | - |
| RQRGKABM vs RQMABKGR | 100 | 28 | 44 | 28 | 0.500 | 0.427–0.573 | +0 ±50 | 56.0% | 38.0% | 6.0% | 148.2±72.7 | 0.33 | 0.030 | 0.656 | 0.12 | 0.98 | 0.31 | 2.00 | -0.009 | 0.489 | 0.489 | timeouts |
| GRMKBAQR vs GAQMRKBR | 100 | 28 | 45 | 27 | 0.505 | 0.432–0.578 | +3 ±52 | 55.0% | 41.0% | 4.0% | 130.3±69.3 | 0.31 | 0.034 | 0.657 | 0.12 | 0.97 | 0.36 | 1.81 | -0.023 | 0.482 | 0.482 | - |
| RKGMAQRB vs RMGQKABR | 100 | 29 | 43 | 28 | 0.505 | 0.431–0.579 | +3 ±53 | 57.0% | 36.0% | 7.0% | 138.8±77.5 | 0.30 | 0.029 | 0.641 | 0.10 | 0.97 | 0.33 | 2.01 | -0.003 | 0.478 | 0.478 | timeouts |
| KMGBQRRA vs KQABMRRG | 100 | 26 | 46 | 28 | 0.490 | 0.418–0.562 | -7 ±43 | 54.0% | 42.0% | 4.0% | 125.8±75.4 | 0.29 | 0.025 | 0.648 | 0.11 | 0.97 | 0.36 | 1.88 | -0.036 | 0.478 | 0.478 | - |
| BRGMRAQK vs BAMGQRRK | 100 | 28 | 42 | 30 | 0.490 | 0.415–0.565 | -7 ±49 | 58.0% | 35.0% | 7.0% | 132.2±76.0 | 0.33 | 0.033 | 0.638 | 0.11 | 0.97 | 0.34 | 1.89 | 0.004 | 0.484 | 0.484 | timeouts |
| MRKQBRAG vs MGQARKRB | 100 | 25 | 48 | 27 | 0.490 | 0.419–0.561 | -7 ±46 | 52.0% | 41.0% | 7.0% | 140.6±76.1 | 0.30 | 0.028 | 0.651 | 0.10 | 0.97 | 0.32 | 1.94 | -0.056 | 0.477 | 0.477 | timeouts |
| RMKQBAGR vs RMKRBAGQ | 100 | 29 | 45 | 26 | 0.515 | 0.442–0.588 | +10 ±42 | 55.0% | 36.0% | 9.0% | 146.1±83.6 | 0.28 | 0.024 | 0.652 | 0.10 | 0.98 | 0.31 | 1.83 | -0.029 | 0.476 | 0.476 | timeouts |
| KAGRRQMB vs GQRMAKRB | 100 | 28 | 40 | 32 | 0.480 | 0.404–0.556 | -14 ±55 | 60.0% | 36.0% | 4.0% | 121.9±70.3 | 0.29 | 0.026 | 0.645 | 0.12 | 0.97 | 0.37 | 1.88 | 0.017 | 0.482 | 0.482 | - |
| QMRBGARK vs RABRMKQG | 100 | 27 | 42 | 31 | 0.480 | 0.405–0.555 | -14 ±53 | 58.0% | 39.0% | 3.0% | 135.0±67.1 | 0.31 | 0.024 | 0.646 | 0.10 | 0.98 | 0.35 | 1.94 | -0.003 | 0.483 | 0.483 | - |
| AGBKMRRQ vs ABGMKQRR | 100 | 29 | 37 | 34 | 0.475 | 0.397–0.553 | -17 ±47 | 63.0% | 32.0% | 5.0% | 131.1±68.5 | 0.30 | 0.030 | 0.630 | 0.11 | 0.98 | 0.36 | 1.85 | 0.044 | 0.481 | 0.481 | - |
| QBARMGKR vs QMKGBRAR | 100 | 34 | 37 | 29 | 0.525 | 0.447–0.603 | +17 ±54 | 63.0% | 31.0% | 6.0% | 136.6±74.9 | 0.32 | 0.028 | 0.641 | 0.14 | 0.97 | 0.34 | 1.91 | 0.044 | 0.491 | 0.491 | timeouts |
| AMQKBGRR vs AGRKRBQM | 100 | 33 | 41 | 26 | 0.535 | 0.460–0.610 | +24 ±56 | 59.0% | 38.0% | 3.0% | 145.7±66.2 | 0.29 | 0.025 | 0.652 | 0.10 | 0.98 | 0.34 | 1.92 | -0.003 | 0.479 | 0.479 | balance |
| BAMRKRGQ vs AQRKBRMG | 100 | 36 | 36 | 28 | 0.540 | 0.462–0.618 | +28 ±54 | 64.0% | 28.0% | 8.0% | 135.2±84.6 | 0.34 | 0.029 | 0.630 | 0.10 | 0.97 | 0.33 | 2.05 | 0.044 | 0.489 | 0.489 | balance,timeouts |
| RAGBMRQK vs RBGARQKM | 100 | 39 | 30 | 31 | 0.540 | 0.458–0.622 | +28 ±52 | 70.0% | 24.0% | 6.0% | 148.7±75.0 | 0.34 | 0.019 | 0.625 | 0.15 | 0.97 | 0.32 | 1.88 | 0.104 | 0.498 | 0.498 | balance,timeouts |
| RBGAQMKR vs RGQBMKAR | 100 | 26 | 56 | 18 | 0.540 | 0.475–0.605 | +28 ±47 | 44.0% | 47.0% | 9.0% | 158.0±77.3 | 0.29 | 0.024 | 0.651 | 0.09 | 0.98 | 0.30 | 1.86 | -0.156 | 0.469 | 0.469 | balance,timeouts,drawRate |
| GQRRMBAK vs BQKRMGRA | 100 | 27 | 36 | 37 | 0.450 | 0.372–0.528 | -35 ±53 | 64.0% | 33.0% | 3.0% | 133.9±64.6 | 0.29 | 0.019 | 0.629 | 0.12 | 0.97 | 0.35 | 1.88 | 0.037 | 0.482 | 0.482 | balance |
| BRMGRAQK vs BGQKMARR | 100 | 39 | 34 | 27 | 0.560 | 0.481–0.639 | +42 ±58 | 66.0% | 27.0% | 7.0% | 139.5±76.5 | 0.35 | 0.029 | 0.637 | 0.12 | 0.97 | 0.32 | 1.88 | 0.051 | 0.493 | 0.493 | balance,timeouts |
| BKQMARRG vs ARKGMRQB | 100 | 25 | 37 | 38 | 0.435 | 0.358–0.512 | -45 ±50 | 63.0% | 34.0% | 3.0% | 132.3±65.3 | 0.32 | 0.021 | 0.651 | 0.12 | 0.97 | 0.37 | 1.91 | 0.018 | 0.489 | 0.489 | balance |
| MRGAQRKB vs MABRQGKR | 100 | 33 | 48 | 19 | 0.570 | 0.501–0.639 | +49 ±46 | 52.0% | 40.0% | 8.0% | 136.0±78.2 | 0.29 | 0.032 | 0.651 | 0.09 | 0.97 | 0.33 | 2.08 | -0.096 | 0.471 | 0.471 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RAGBMRQK vs RBGARQKM | 100 | 39 | 30 | 31 | 0.540 | 0.458–0.622 | +28 ±52 | 70.0% | 24.0% | 6.0% | 148.7±75.0 | 0.34 | 0.019 | 0.625 | 0.15 | 0.97 | 0.32 | 1.88 | 0.104 | 0.498 | 0.498 | balance,timeouts |
| KQGRARBM vs KRAQMRBG | 100 | 31 | 38 | 31 | 0.500 | 0.423–0.577 | +0 ±59 | 62.0% | 33.0% | 5.0% | 136.7±68.9 | 0.35 | 0.031 | 0.640 | 0.12 | 0.97 | 0.34 | 1.78 | 0.051 | 0.494 | 0.494 | - |
| BRMGRAQK vs BGQKMARR | 100 | 39 | 34 | 27 | 0.560 | 0.481–0.639 | +42 ±58 | 66.0% | 27.0% | 7.0% | 139.5±76.5 | 0.35 | 0.029 | 0.637 | 0.12 | 0.97 | 0.32 | 1.88 | 0.051 | 0.493 | 0.493 | balance,timeouts |
| QBARMGKR vs QMKGBRAR | 100 | 34 | 37 | 29 | 0.525 | 0.447–0.603 | +17 ±54 | 63.0% | 31.0% | 6.0% | 136.6±74.9 | 0.32 | 0.028 | 0.641 | 0.14 | 0.97 | 0.34 | 1.91 | 0.044 | 0.491 | 0.491 | timeouts |
| RQRGKABM vs RQMABKGR | 100 | 28 | 44 | 28 | 0.500 | 0.427–0.573 | +0 ±50 | 56.0% | 38.0% | 6.0% | 148.2±72.7 | 0.33 | 0.030 | 0.656 | 0.12 | 0.98 | 0.31 | 2.00 | -0.009 | 0.489 | 0.489 | timeouts |
| BAMRKRGQ vs AQRKBRMG | 100 | 36 | 36 | 28 | 0.540 | 0.462–0.618 | +28 ±54 | 64.0% | 28.0% | 8.0% | 135.2±84.6 | 0.34 | 0.029 | 0.630 | 0.10 | 0.97 | 0.33 | 2.05 | 0.044 | 0.489 | 0.489 | balance,timeouts |
| BKQMARRG vs ARKGMRQB | 100 | 25 | 37 | 38 | 0.435 | 0.358–0.512 | -45 ±50 | 63.0% | 34.0% | 3.0% | 132.3±65.3 | 0.32 | 0.021 | 0.651 | 0.12 | 0.97 | 0.37 | 1.91 | 0.018 | 0.489 | 0.489 | balance |
| BRGMRAQK vs BAMGQRRK | 100 | 28 | 42 | 30 | 0.490 | 0.415–0.565 | -7 ±49 | 58.0% | 35.0% | 7.0% | 132.2±76.0 | 0.33 | 0.033 | 0.638 | 0.11 | 0.97 | 0.34 | 1.89 | 0.004 | 0.484 | 0.484 | timeouts |
| QMRBGARK vs RABRMKQG | 100 | 27 | 42 | 31 | 0.480 | 0.405–0.555 | -14 ±53 | 58.0% | 39.0% | 3.0% | 135.0±67.1 | 0.31 | 0.024 | 0.646 | 0.10 | 0.98 | 0.35 | 1.94 | -0.003 | 0.483 | 0.483 | - |
| GQRRMBAK vs BQKRMGRA | 100 | 27 | 36 | 37 | 0.450 | 0.372–0.528 | -35 ±53 | 64.0% | 33.0% | 3.0% | 133.9±64.6 | 0.29 | 0.019 | 0.629 | 0.12 | 0.97 | 0.35 | 1.88 | 0.037 | 0.482 | 0.482 | balance |
| GRMKBAQR vs GAQMRKBR | 100 | 28 | 45 | 27 | 0.505 | 0.432–0.578 | +3 ±52 | 55.0% | 41.0% | 4.0% | 130.3±69.3 | 0.31 | 0.034 | 0.657 | 0.12 | 0.97 | 0.36 | 1.81 | -0.023 | 0.482 | 0.482 | - |
| KAGRRQMB vs GQRMAKRB | 100 | 28 | 40 | 32 | 0.480 | 0.404–0.556 | -14 ±55 | 60.0% | 36.0% | 4.0% | 121.9±70.3 | 0.29 | 0.026 | 0.645 | 0.12 | 0.97 | 0.37 | 1.88 | 0.017 | 0.482 | 0.482 | - |
| AGBKMRRQ vs ABGMKQRR | 100 | 29 | 37 | 34 | 0.475 | 0.397–0.553 | -17 ±47 | 63.0% | 32.0% | 5.0% | 131.1±68.5 | 0.30 | 0.030 | 0.630 | 0.11 | 0.98 | 0.36 | 1.85 | 0.044 | 0.481 | 0.481 | - |
| AMQKBGRR vs AGRKRBQM | 100 | 33 | 41 | 26 | 0.535 | 0.460–0.610 | +24 ±56 | 59.0% | 38.0% | 3.0% | 145.7±66.2 | 0.29 | 0.025 | 0.652 | 0.10 | 0.98 | 0.34 | 1.92 | -0.003 | 0.479 | 0.479 | balance |
| RKGMAQRB vs RMGQKABR | 100 | 29 | 43 | 28 | 0.505 | 0.431–0.579 | +3 ±53 | 57.0% | 36.0% | 7.0% | 138.8±77.5 | 0.30 | 0.029 | 0.641 | 0.10 | 0.97 | 0.33 | 2.01 | -0.003 | 0.478 | 0.478 | timeouts |
| KMGBQRRA vs KQABMRRG | 100 | 26 | 46 | 28 | 0.490 | 0.418–0.562 | -7 ±43 | 54.0% | 42.0% | 4.0% | 125.8±75.4 | 0.29 | 0.025 | 0.648 | 0.11 | 0.97 | 0.36 | 1.88 | -0.036 | 0.478 | 0.478 | - |
| MRKQBRAG vs MGQARKRB | 100 | 25 | 48 | 27 | 0.490 | 0.419–0.561 | -7 ±46 | 52.0% | 41.0% | 7.0% | 140.6±76.1 | 0.30 | 0.028 | 0.651 | 0.10 | 0.97 | 0.32 | 1.94 | -0.056 | 0.477 | 0.477 | timeouts |
| RMKQBAGR vs RMKRBAGQ | 100 | 29 | 45 | 26 | 0.515 | 0.442–0.588 | +10 ±42 | 55.0% | 36.0% | 9.0% | 146.1±83.6 | 0.28 | 0.024 | 0.652 | 0.10 | 0.98 | 0.31 | 1.83 | -0.029 | 0.476 | 0.476 | timeouts |
| MRGAQRKB vs MABRQGKR | 100 | 33 | 48 | 19 | 0.570 | 0.501–0.639 | +49 ±46 | 52.0% | 40.0% | 8.0% | 136.0±78.2 | 0.29 | 0.032 | 0.651 | 0.09 | 0.97 | 0.33 | 2.08 | -0.096 | 0.471 | 0.471 | balance,timeouts |
| RBGAQMKR vs RGQBMKAR | 100 | 26 | 56 | 18 | 0.540 | 0.475–0.605 | +28 ±47 | 44.0% | 47.0% | 9.0% | 158.0±77.3 | 0.29 | 0.024 | 0.651 | 0.09 | 0.98 | 0.30 | 1.86 | -0.156 | 0.469 | 0.469 | balance,timeouts,drawRate |

---
**Two axes, reported apart.** Balance = |white score − 0.5|; interest = the Browne-fitted sum below.
Never merge them: the research shows the two objectives fight (variant-balance.md §7).

interest = +0.2·killerMove −0.16·leadChange +0.13·uncertaintyLate +0.12·drama +0.07·permanence +0.2·fairyUse +0.12·excessDecisiveness
— Browne's fitted signs (docs/research/variant-balance.md §7). **Lead change is negative**: churn
reads as chaos, not tension. "xDec" = decisiveness minus what |white score − 0.5| predicts for it,
fitted over the configurations of this run; raw decisiveness is never a reward term, because
corr(draw rate, white points) = −0.92 in Chess960.
"gates" lists failed viability gates (balance 0.03, timeouts 0.05, duration 0.5, utilisation 0.25, draw-rate worst decile); a gated
arrangement is rejected, not scored down.
"killer", "unc", "drama", "perm" use the squashed lead L = 2·σ(cp/350) − 1 (variant-balance.md §3.0).
"capped" games hit the ply cap: their own class, never counted as draws (cutechess counts them as draws).
Survival counts pieces on the board at the end, so a promotion target can exceed 100%.
Statistics follow docs/research/sim-methodology.md §2.
