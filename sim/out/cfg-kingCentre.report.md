# Sim report — cfg-kingCentre

3200 games. White score **0.513** (95% 0.500–0.526),
white advantage **+9 ± 9 Elo**.
Decisive 56.3% · draws 35.9% · capped 7.8% (counted apart, never as draws).
Plies: mean 144.9 ± 76.7, median 123. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3748 · normalized Elo +12 · LOS 97.9% ·
SPRT LLR 1.11 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 943 | 1400 | 857 | 0.513 | 0.500–0.526 | +9 ±9 | 56.3% | 35.9% | 7.8% | 144.9±76.7 | 0.30 | 0.037 | 0.643 | 0.11 | 0.97 | 0.41 | 1.57 | 0.028 | 0.481 | 0.372 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | R | N | Q | K | M | G | P | L | A | S | B |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.73 | 1.15 | 1.16 | 2.35 | 2.78 | 2.22 | 0.41 | 0.74 | 1.64 | 0.46 | 1.24 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1800 | 56.3% |
| adjudicatedDraw | 649 | 20.3% |
| draw50 | 343 | 10.7% |
| plyCap | 251 | 7.8% |
| drawRepetition | 131 | 4.1% |
| drawMaterial | 26 | 0.8% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 94735 | 19200 | 36543 | 51200 | 13648 | 26.7% |
| K | 68170 | 3807 | 0 | 6400 | 6400 | 100.0% |
| M | 60460 | 3313 | 2239 | 4800 | 2561 | 53.4% |
| G | 57874 | 0 | 200 | 5760 | 5635 | 97.8% |
| A | 50030 | 8919 | 1654 | 6720 | 5067 | 75.4% |
| N | 36552 | 6760 | 6078 | 7040 | 967 | 13.7% |
| R | 32567 | 4881 | 2738 | 4160 | 1423 | 34.2% |
| B | 23357 | 4305 | 3179 | 4160 | 981 | 23.6% |
| Q | 20176 | 4504 | 3545 | 3840 | 1221 | 31.8% |
| S | 13258 | 1743 | 1905 | 6400 | 4495 | 70.2% |
| L | 6470 | 1231 | 582 | 1920 | 108 | 5.6% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 8919 | 2.79 |
| beastChainMoves | 1563 | 0.49 |
| beastChainCaptures | 1743 | 0.54 |
| maesterSwaps | 22237 | 6.95 |
| maesterLongSwaps | 5245 | 1.64 |
| paladinSacrifices | 1231 | 0.38 |
| promotions | 1009 | 0.32 |
| checks | 23364 | 7.30 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 369 (11.5%) |
| games where a king never moved | 616 (19.3%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| -0.000 | -0.000 | 0.000 | -0.000 | 0.000 | 0.013 | 0.028 | 0.004 | -0.024 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RSGAKQSA | 160 | 25 | 110 | 25 | 0.500 | 0.457–0.543 | +0 ±30 | 31.3% | 54.4% | 14.4% | 171.8±84.7 | 0.22 | 0.041 | 0.653 | 0.06 | 0.97 | 0.35 | 1.98 | -0.189 | 0.447 | 0.336 | timeouts |
| RNGKBBMG | 160 | 42 | 76 | 42 | 0.500 | 0.444–0.556 | +0 ±39 | 52.5% | 42.5% | 5.0% | 139.0±73.3 | 0.27 | 0.045 | 0.655 | 0.11 | 0.97 | 0.42 | 1.89 | 0.024 | 0.474 | 0.474 | - |
| NRSKBQAA | 160 | 46 | 67 | 47 | 0.497 | 0.438–0.556 | -2 ±41 | 58.1% | 36.9% | 5.0% | 128.1±76.1 | 0.34 | 0.037 | 0.640 | 0.10 | 0.96 | 0.42 | 0.94 | 0.072 | 0.477 | 0.378 | - |
| RBSSKLQN | 160 | 60 | 39 | 61 | 0.497 | 0.430–0.564 | -2 ±47 | 75.6% | 20.6% | 3.8% | 106.5±61.1 | 0.37 | 0.033 | 0.625 | 0.14 | 0.96 | 0.48 | 0.80 | 0.247 | 0.469 | 0.405 | - |
| MLGAKBNS | 160 | 47 | 68 | 45 | 0.506 | 0.448–0.565 | +4 ±41 | 57.5% | 29.4% | 13.1% | 165.2±75.6 | 0.30 | 0.032 | 0.626 | 0.12 | 0.97 | 0.39 | 1.64 | 0.058 | 0.483 | 0.368 | timeouts |
| LNAKNMAM | 160 | 51 | 54 | 55 | 0.487 | 0.424–0.551 | -9 ±44 | 66.3% | 24.4% | 9.4% | 153.2±71.7 | 0.35 | 0.030 | 0.637 | 0.12 | 0.97 | 0.41 | 1.55 | 0.130 | 0.498 | 0.434 | timeouts |
| ASGRKMGS | 160 | 24 | 117 | 19 | 0.516 | 0.476–0.556 | +11 ±28 | 26.9% | 55.6% | 17.5% | 182.5±85.2 | 0.24 | 0.055 | 0.651 | 0.05 | 0.97 | 0.34 | 2.22 | -0.271 | 0.442 | 0.342 | timeouts,drawRate |
| RSAQKSGM | 160 | 31 | 104 | 25 | 0.519 | 0.473–0.564 | +13 ±32 | 35.0% | 51.2% | 13.8% | 164.5±82.9 | 0.23 | 0.049 | 0.670 | 0.07 | 0.97 | 0.37 | 2.07 | -0.198 | 0.450 | 0.335 | timeouts |
| RNQKMMGN | 160 | 48 | 57 | 55 | 0.478 | 0.416–0.540 | -15 ±43 | 64.4% | 35.0% | 0.6% | 120.2±57.8 | 0.33 | 0.041 | 0.656 | 0.13 | 0.97 | 0.47 | 1.44 | 0.088 | 0.494 | 0.494 | - |
| SNGQKMSB | 160 | 47 | 59 | 54 | 0.478 | 0.417–0.540 | -15 ±43 | 63.1% | 29.4% | 7.5% | 150.0±76.6 | 0.35 | 0.031 | 0.638 | 0.15 | 0.96 | 0.40 | 2.00 | 0.076 | 0.498 | 0.378 | timeouts |
| GNSKARNG | 160 | 33 | 86 | 41 | 0.475 | 0.422–0.528 | -17 ±37 | 46.3% | 44.4% | 9.4% | 165.5±81.6 | 0.30 | 0.045 | 0.652 | 0.12 | 0.97 | 0.37 | 1.45 | -0.101 | 0.473 | 0.356 | timeouts |
| ASABKNGM | 160 | 22 | 108 | 30 | 0.475 | 0.431–0.519 | -17 ±31 | 32.5% | 50.0% | 17.5% | 179.4±81.3 | 0.24 | 0.038 | 0.655 | 0.07 | 0.97 | 0.34 | 1.76 | -0.238 | 0.449 | 0.329 | timeouts |
| ARNKSQMB | 160 | 56 | 56 | 48 | 0.525 | 0.463–0.587 | +17 ±43 | 65.0% | 34.4% | 0.6% | 128.4±63.0 | 0.31 | 0.045 | 0.655 | 0.13 | 0.97 | 0.46 | 1.32 | 0.087 | 0.490 | 0.383 | - |
| QMNKRABL | 160 | 68 | 33 | 59 | 0.528 | 0.459–0.597 | +20 ±48 | 79.4% | 20.0% | 0.6% | 107.6±53.6 | 0.32 | 0.024 | 0.602 | 0.12 | 0.97 | 0.49 | 1.49 | 0.223 | 0.494 | 0.476 | - |
| ASNNKAQM | 160 | 44 | 81 | 35 | 0.528 | 0.474–0.582 | +20 ±38 | 49.4% | 42.5% | 8.1% | 156.0±75.8 | 0.30 | 0.040 | 0.656 | 0.12 | 0.97 | 0.40 | 1.70 | -0.077 | 0.476 | 0.359 | timeouts |
| GAAQKGBN | 160 | 51 | 69 | 40 | 0.534 | 0.476–0.593 | +24 ±40 | 56.9% | 35.0% | 8.1% | 141.7±83.9 | 0.32 | 0.027 | 0.645 | 0.09 | 0.96 | 0.40 | 1.63 | -0.018 | 0.482 | 0.482 | balance,timeouts |
| MLQAKNSS | 160 | 61 | 53 | 46 | 0.547 | 0.484–0.610 | +33 ±44 | 66.9% | 25.0% | 8.1% | 142.0±71.0 | 0.28 | 0.029 | 0.623 | 0.11 | 0.97 | 0.43 | 1.64 | 0.051 | 0.478 | 0.364 | balance,timeouts |
| GLMRKNSB | 160 | 67 | 44 | 49 | 0.556 | 0.491–0.622 | +39 ±45 | 72.5% | 23.1% | 4.4% | 137.5±64.5 | 0.32 | 0.027 | 0.626 | 0.13 | 0.97 | 0.45 | 1.40 | 0.084 | 0.490 | 0.391 | balance |
| NRAGKGNB | 160 | 57 | 65 | 38 | 0.559 | 0.500–0.618 | +41 ±41 | 59.4% | 35.6% | 5.0% | 135.6±69.5 | 0.33 | 0.038 | 0.649 | 0.13 | 0.97 | 0.44 | 1.37 | -0.055 | 0.483 | 0.483 | balance |
| BNQKRGAS | 160 | 63 | 54 | 43 | 0.563 | 0.500–0.625 | +44 ±43 | 66.3% | 28.7% | 5.0% | 123.0±71.7 | 0.33 | 0.037 | 0.635 | 0.13 | 0.96 | 0.35 | 1.36 | 0.006 | 0.486 | 0.356 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LNAKNMAM | 160 | 51 | 54 | 55 | 0.487 | 0.424–0.551 | -9 ±44 | 66.3% | 24.4% | 9.4% | 153.2±71.7 | 0.35 | 0.030 | 0.637 | 0.12 | 0.97 | 0.41 | 1.55 | 0.130 | 0.498 | 0.434 | timeouts |
| SNGQKMSB | 160 | 47 | 59 | 54 | 0.478 | 0.417–0.540 | -15 ±43 | 63.1% | 29.4% | 7.5% | 150.0±76.6 | 0.35 | 0.031 | 0.638 | 0.15 | 0.96 | 0.40 | 2.00 | 0.076 | 0.498 | 0.378 | timeouts |
| QMNKRABL | 160 | 68 | 33 | 59 | 0.528 | 0.459–0.597 | +20 ±48 | 79.4% | 20.0% | 0.6% | 107.6±53.6 | 0.32 | 0.024 | 0.602 | 0.12 | 0.97 | 0.49 | 1.49 | 0.223 | 0.494 | 0.476 | - |
| RNQKMMGN | 160 | 48 | 57 | 55 | 0.478 | 0.416–0.540 | -15 ±43 | 64.4% | 35.0% | 0.6% | 120.2±57.8 | 0.33 | 0.041 | 0.656 | 0.13 | 0.97 | 0.47 | 1.44 | 0.088 | 0.494 | 0.494 | - |
| GLMRKNSB | 160 | 67 | 44 | 49 | 0.556 | 0.491–0.622 | +39 ±45 | 72.5% | 23.1% | 4.4% | 137.5±64.5 | 0.32 | 0.027 | 0.626 | 0.13 | 0.97 | 0.45 | 1.40 | 0.084 | 0.490 | 0.391 | balance |
| ARNKSQMB | 160 | 56 | 56 | 48 | 0.525 | 0.463–0.587 | +17 ±43 | 65.0% | 34.4% | 0.6% | 128.4±63.0 | 0.31 | 0.045 | 0.655 | 0.13 | 0.97 | 0.46 | 1.32 | 0.087 | 0.490 | 0.383 | - |
| BNQKRGAS | 160 | 63 | 54 | 43 | 0.563 | 0.500–0.625 | +44 ±43 | 66.3% | 28.7% | 5.0% | 123.0±71.7 | 0.33 | 0.037 | 0.635 | 0.13 | 0.96 | 0.35 | 1.36 | 0.006 | 0.486 | 0.356 | balance |
| NRAGKGNB | 160 | 57 | 65 | 38 | 0.559 | 0.500–0.618 | +41 ±41 | 59.4% | 35.6% | 5.0% | 135.6±69.5 | 0.33 | 0.038 | 0.649 | 0.13 | 0.97 | 0.44 | 1.37 | -0.055 | 0.483 | 0.483 | balance |
| MLGAKBNS | 160 | 47 | 68 | 45 | 0.506 | 0.448–0.565 | +4 ±41 | 57.5% | 29.4% | 13.1% | 165.2±75.6 | 0.30 | 0.032 | 0.626 | 0.12 | 0.97 | 0.39 | 1.64 | 0.058 | 0.483 | 0.368 | timeouts |
| GAAQKGBN | 160 | 51 | 69 | 40 | 0.534 | 0.476–0.593 | +24 ±40 | 56.9% | 35.0% | 8.1% | 141.7±83.9 | 0.32 | 0.027 | 0.645 | 0.09 | 0.96 | 0.40 | 1.63 | -0.018 | 0.482 | 0.482 | balance,timeouts |
| MLQAKNSS | 160 | 61 | 53 | 46 | 0.547 | 0.484–0.610 | +33 ±44 | 66.9% | 25.0% | 8.1% | 142.0±71.0 | 0.28 | 0.029 | 0.623 | 0.11 | 0.97 | 0.43 | 1.64 | 0.051 | 0.478 | 0.364 | balance,timeouts |
| NRSKBQAA | 160 | 46 | 67 | 47 | 0.497 | 0.438–0.556 | -2 ±41 | 58.1% | 36.9% | 5.0% | 128.1±76.1 | 0.34 | 0.037 | 0.640 | 0.10 | 0.96 | 0.42 | 0.94 | 0.072 | 0.477 | 0.378 | - |
| ASNNKAQM | 160 | 44 | 81 | 35 | 0.528 | 0.474–0.582 | +20 ±38 | 49.4% | 42.5% | 8.1% | 156.0±75.8 | 0.30 | 0.040 | 0.656 | 0.12 | 0.97 | 0.40 | 1.70 | -0.077 | 0.476 | 0.359 | timeouts |
| RNGKBBMG | 160 | 42 | 76 | 42 | 0.500 | 0.444–0.556 | +0 ±39 | 52.5% | 42.5% | 5.0% | 139.0±73.3 | 0.27 | 0.045 | 0.655 | 0.11 | 0.97 | 0.42 | 1.89 | 0.024 | 0.474 | 0.474 | - |
| GNSKARNG | 160 | 33 | 86 | 41 | 0.475 | 0.422–0.528 | -17 ±37 | 46.3% | 44.4% | 9.4% | 165.5±81.6 | 0.30 | 0.045 | 0.652 | 0.12 | 0.97 | 0.37 | 1.45 | -0.101 | 0.473 | 0.356 | timeouts |
| RBSSKLQN | 160 | 60 | 39 | 61 | 0.497 | 0.430–0.564 | -2 ±47 | 75.6% | 20.6% | 3.8% | 106.5±61.1 | 0.37 | 0.033 | 0.625 | 0.14 | 0.96 | 0.48 | 0.80 | 0.247 | 0.469 | 0.405 | - |
| RSAQKSGM | 160 | 31 | 104 | 25 | 0.519 | 0.473–0.564 | +13 ±32 | 35.0% | 51.2% | 13.8% | 164.5±82.9 | 0.23 | 0.049 | 0.670 | 0.07 | 0.97 | 0.37 | 2.07 | -0.198 | 0.450 | 0.335 | timeouts |
| ASABKNGM | 160 | 22 | 108 | 30 | 0.475 | 0.431–0.519 | -17 ±31 | 32.5% | 50.0% | 17.5% | 179.4±81.3 | 0.24 | 0.038 | 0.655 | 0.07 | 0.97 | 0.34 | 1.76 | -0.238 | 0.449 | 0.329 | timeouts |
| RSGAKQSA | 160 | 25 | 110 | 25 | 0.500 | 0.457–0.543 | +0 ±30 | 31.3% | 54.4% | 14.4% | 171.8±84.7 | 0.22 | 0.041 | 0.653 | 0.06 | 0.97 | 0.35 | 1.98 | -0.189 | 0.447 | 0.336 | timeouts |
| ASGRKMGS | 160 | 24 | 117 | 19 | 0.516 | 0.476–0.556 | +11 ±28 | 26.9% | 55.6% | 17.5% | 182.5±85.2 | 0.24 | 0.055 | 0.651 | 0.05 | 0.97 | 0.34 | 2.22 | -0.271 | 0.442 | 0.342 | timeouts,drawRate |

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
