# Sim report — cfg-h-fairy

3200 games. White score **0.521** (95% 0.510–0.532),
white advantage **+15 ± 8 Elo**.
Decisive 39.8% · draws 45.7% · capped 14.5% (counted apart, never as draws).
Plies: mean 171.8 ± 85.8, median 170. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.3145 · normalized Elo +23 · LOS 100.0% ·
SPRT LLR 2.27 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 3200 | 704 | 1928 | 568 | 0.521 | 0.510–0.532 | +15 ±8 | 39.8% | 45.7% | 14.5% | 171.8±85.8 | 0.25 | 0.041 | 0.641 | 0.07 | 0.97 | 0.35 | 1.66 | 0.036 | 0.465 | 0.348 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | L | S | A | K | M | Q | P | G |
|---|---|---|---|---|---|---|---|---|
| use | 0.97 | 0.42 | 1.66 | 1.64 | 3.38 | 0.93 | 0.35 | 1.89 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 1272 | 39.8% |
| draw50 | 683 | 21.3% |
| adjudicatedDraw | 664 | 20.8% |
| plyCap | 465 | 14.5% |
| drawRepetition | 110 | 3.4% |
| drawMaterial | 6 | 0.2% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| M | 162734 | 5606 | 3047 | 8960 | 5913 | 66.0% |
| P | 97364 | 19543 | 38549 | 51200 | 11984 | 23.4% |
| G | 84223 | 0 | 113 | 8320 | 8257 | 99.2% |
| A | 82494 | 14896 | 1721 | 9280 | 7559 | 81.5% |
| K | 56445 | 1738 | 0 | 6400 | 6400 | 100.0% |
| L | 24957 | 3182 | 1193 | 4800 | 425 | 8.9% |
| S | 20790 | 2500 | 2776 | 9280 | 6505 | 70.1% |
| Q | 20690 | 3881 | 3945 | 4160 | 829 | 19.9% |
| R | 0 | 0 | 1 | 0 | 0 | 0.0% |
| N | 0 | 0 | 1 | 0 | 0 | 0.0% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 14896 | 4.66 |
| beastChainMoves | 2167 | 0.68 |
| beastChainCaptures | 2500 | 0.78 |
| maesterSwaps | 80334 | 25.10 |
| maesterLongSwaps | 7793 | 2.44 |
| paladinSacrifices | 3182 | 0.99 |
| promotions | 667 | 0.21 |
| checks | 9208 | 2.88 |

## Degeneracy counters
| counter | value |
|---|---|
| guard captures per game | 0.000 |
| games with a guard rampage (≥ 3 captures) | 0 (0.0%) |
| dead-material endings (draw50 + drawMaterial) | 689 (21.5%) |
| games where a king never moved | 643 (20.1%) |

## Interest terms, residualised on draw rate
Each term minus what this run's `term ~ a + b·drawRate` line predicts from the arrangement's draw
rate. The mean over the arrangements is 0 by construction, so read differences between pools, never
levels. Overall row, fitted on the 20 arrangements:
| killerMove | leadChange | uncertaintyLate | drama | permanence | fairyUse | excessDecisiveness | interest | interestMinFairy |
|---|---|---|---|---|---|---|---|---|
| 0.000 | -0.000 | -0.000 | 0.000 | -0.000 | 0.000 | 0.036 | 0.002 | 0.002 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| QAGASKMS | 160 | 17 | 125 | 18 | 0.497 | 0.461–0.533 | -2 ±25 | 21.9% | 58.1% | 20.0% | 187.6±85.8 | 0.19 | 0.048 | 0.670 | 0.05 | 0.97 | 0.33 | 2.22 | -0.077 | 0.445 | 0.325 | timeouts |
| GAKSAMMG | 160 | 15 | 129 | 16 | 0.497 | 0.463–0.531 | -2 ±24 | 19.4% | 58.1% | 22.5% | 200.4±83.9 | 0.19 | 0.046 | 0.667 | 0.04 | 0.97 | 0.30 | 1.70 | -0.102 | 0.444 | 0.319 | timeouts |
| KQSMGAGL | 160 | 38 | 85 | 37 | 0.503 | 0.450–0.556 | +2 ±37 | 46.9% | 41.9% | 11.3% | 164.3±87.6 | 0.30 | 0.036 | 0.621 | 0.08 | 0.97 | 0.36 | 1.69 | 0.173 | 0.482 | 0.366 | timeouts |
| ALAKGSMS | 160 | 20 | 121 | 19 | 0.503 | 0.465–0.541 | +2 ±27 | 24.4% | 53.8% | 21.9% | 202.2±81.3 | 0.23 | 0.040 | 0.636 | 0.04 | 0.97 | 0.30 | 1.89 | -0.052 | 0.452 | 0.328 | timeouts |
| GGQMKSAS | 160 | 31 | 100 | 29 | 0.506 | 0.459–0.554 | +4 ±33 | 37.5% | 49.4% | 13.1% | 167.3±81.6 | 0.26 | 0.042 | 0.652 | 0.08 | 0.97 | 0.37 | 2.20 | 0.068 | 0.471 | 0.362 | timeouts |
| AGLSGMKM | 160 | 26 | 105 | 29 | 0.491 | 0.445–0.536 | -7 ±32 | 34.4% | 51.9% | 13.8% | 170.0±86.2 | 0.20 | 0.069 | 0.657 | 0.07 | 0.97 | 0.36 | 1.56 | 0.025 | 0.452 | 0.348 | timeouts |
| AQASGMGK | 160 | 24 | 107 | 29 | 0.484 | 0.440–0.529 | -11 ±31 | 33.1% | 50.0% | 16.9% | 180.5±84.5 | 0.24 | 0.040 | 0.654 | 0.08 | 0.97 | 0.35 | 2.08 | -0.010 | 0.464 | 0.348 | timeouts |
| AGQKLAMS | 160 | 24 | 119 | 17 | 0.522 | 0.483–0.561 | +15 ±27 | 25.6% | 57.5% | 16.9% | 175.9±90.6 | 0.20 | 0.040 | 0.641 | 0.04 | 0.97 | 0.32 | 1.80 | -0.107 | 0.442 | 0.319 | timeouts |
| QKGGSAAM | 160 | 32 | 103 | 25 | 0.522 | 0.476–0.568 | +15 ±32 | 35.6% | 50.0% | 14.4% | 167.0±83.9 | 0.25 | 0.054 | 0.661 | 0.08 | 0.96 | 0.38 | 2.04 | -0.007 | 0.464 | 0.341 | timeouts |
| LSAKSGMM | 160 | 27 | 98 | 35 | 0.475 | 0.427–0.523 | -17 ±33 | 38.8% | 40.6% | 20.6% | 188.4±86.2 | 0.28 | 0.043 | 0.638 | 0.07 | 0.97 | 0.32 | 1.61 | 0.013 | 0.468 | 0.350 | timeouts |
| SMMSQKLA | 160 | 46 | 76 | 38 | 0.525 | 0.469–0.581 | +17 ±39 | 52.5% | 40.6% | 6.9% | 156.9±74.0 | 0.25 | 0.039 | 0.637 | 0.10 | 0.97 | 0.40 | 1.51 | 0.150 | 0.476 | 0.365 | timeouts |
| AAMKMLGS | 160 | 19 | 130 | 11 | 0.525 | 0.492–0.558 | +17 ±23 | 18.8% | 64.4% | 16.9% | 189.8±81.9 | 0.20 | 0.039 | 0.653 | 0.04 | 0.97 | 0.32 | 1.53 | -0.187 | 0.440 | 0.319 | timeouts,drawRate |
| KLGGQMSS | 160 | 43 | 85 | 32 | 0.534 | 0.482–0.587 | +24 ±37 | 46.9% | 40.0% | 13.1% | 159.1±86.4 | 0.29 | 0.037 | 0.634 | 0.08 | 0.97 | 0.39 | 1.91 | 0.060 | 0.475 | 0.360 | balance,timeouts |
| QGMSSLKA | 160 | 48 | 77 | 35 | 0.541 | 0.485–0.596 | +28 ±39 | 51.9% | 40.6% | 7.5% | 158.4±83.1 | 0.24 | 0.029 | 0.635 | 0.08 | 0.97 | 0.39 | 1.87 | 0.087 | 0.467 | 0.349 | balance,timeouts |
| AKSMMSLG | 160 | 31 | 84 | 45 | 0.456 | 0.403–0.509 | -30 ±37 | 47.5% | 36.9% | 15.6% | 178.5±83.1 | 0.23 | 0.043 | 0.640 | 0.09 | 0.97 | 0.34 | 1.66 | 0.032 | 0.463 | 0.349 | balance,timeouts |
| AMKQLSAG | 160 | 38 | 101 | 21 | 0.553 | 0.507–0.599 | +37 ±32 | 36.9% | 45.0% | 18.1% | 176.3±88.7 | 0.22 | 0.029 | 0.631 | 0.06 | 0.97 | 0.35 | 1.72 | -0.108 | 0.451 | 0.336 | balance,timeouts |
| LSASKMMQ | 160 | 66 | 49 | 45 | 0.566 | 0.502–0.629 | +46 ±44 | 69.4% | 25.0% | 5.6% | 140.3±73.7 | 0.31 | 0.033 | 0.610 | 0.11 | 0.97 | 0.43 | 1.49 | 0.172 | 0.486 | 0.389 | balance,timeouts |
| LMGSGKAA | 160 | 48 | 85 | 27 | 0.566 | 0.514–0.618 | +46 ±36 | 46.9% | 36.3% | 16.9% | 166.9±89.5 | 0.29 | 0.051 | 0.637 | 0.06 | 0.96 | 0.33 | 1.69 | -0.053 | 0.465 | 0.331 | balance,timeouts |
| QAMSGLKA | 160 | 53 | 77 | 30 | 0.572 | 0.517–0.627 | +50 ±38 | 51.9% | 38.1% | 10.0% | 156.1±85.7 | 0.30 | 0.035 | 0.639 | 0.09 | 0.96 | 0.39 | 1.70 | -0.026 | 0.475 | 0.362 | balance,timeouts |
| LKSGMMAQ | 160 | 58 | 72 | 30 | 0.588 | 0.532–0.643 | +61 ±39 | 55.0% | 36.3% | 8.8% | 149.7±84.9 | 0.27 | 0.027 | 0.606 | 0.09 | 0.97 | 0.39 | 1.55 | -0.051 | 0.465 | 0.344 | balance,timeouts |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | fairyUse | xDec | interest | interest(min) | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LSASKMMQ | 160 | 66 | 49 | 45 | 0.566 | 0.502–0.629 | +46 ±44 | 69.4% | 25.0% | 5.6% | 140.3±73.7 | 0.31 | 0.033 | 0.610 | 0.11 | 0.97 | 0.43 | 1.49 | 0.172 | 0.486 | 0.389 | balance,timeouts |
| KQSMGAGL | 160 | 38 | 85 | 37 | 0.503 | 0.450–0.556 | +2 ±37 | 46.9% | 41.9% | 11.3% | 164.3±87.6 | 0.30 | 0.036 | 0.621 | 0.08 | 0.97 | 0.36 | 1.69 | 0.173 | 0.482 | 0.366 | timeouts |
| SMMSQKLA | 160 | 46 | 76 | 38 | 0.525 | 0.469–0.581 | +17 ±39 | 52.5% | 40.6% | 6.9% | 156.9±74.0 | 0.25 | 0.039 | 0.637 | 0.10 | 0.97 | 0.40 | 1.51 | 0.150 | 0.476 | 0.365 | timeouts |
| KLGGQMSS | 160 | 43 | 85 | 32 | 0.534 | 0.482–0.587 | +24 ±37 | 46.9% | 40.0% | 13.1% | 159.1±86.4 | 0.29 | 0.037 | 0.634 | 0.08 | 0.97 | 0.39 | 1.91 | 0.060 | 0.475 | 0.360 | balance,timeouts |
| QAMSGLKA | 160 | 53 | 77 | 30 | 0.572 | 0.517–0.627 | +50 ±38 | 51.9% | 38.1% | 10.0% | 156.1±85.7 | 0.30 | 0.035 | 0.639 | 0.09 | 0.96 | 0.39 | 1.70 | -0.026 | 0.475 | 0.362 | balance,timeouts |
| GGQMKSAS | 160 | 31 | 100 | 29 | 0.506 | 0.459–0.554 | +4 ±33 | 37.5% | 49.4% | 13.1% | 167.3±81.6 | 0.26 | 0.042 | 0.652 | 0.08 | 0.97 | 0.37 | 2.20 | 0.068 | 0.471 | 0.362 | timeouts |
| LSAKSGMM | 160 | 27 | 98 | 35 | 0.475 | 0.427–0.523 | -17 ±33 | 38.8% | 40.6% | 20.6% | 188.4±86.2 | 0.28 | 0.043 | 0.638 | 0.07 | 0.97 | 0.32 | 1.61 | 0.013 | 0.468 | 0.350 | timeouts |
| QGMSSLKA | 160 | 48 | 77 | 35 | 0.541 | 0.485–0.596 | +28 ±39 | 51.9% | 40.6% | 7.5% | 158.4±83.1 | 0.24 | 0.029 | 0.635 | 0.08 | 0.97 | 0.39 | 1.87 | 0.087 | 0.467 | 0.349 | balance,timeouts |
| LMGSGKAA | 160 | 48 | 85 | 27 | 0.566 | 0.514–0.618 | +46 ±36 | 46.9% | 36.3% | 16.9% | 166.9±89.5 | 0.29 | 0.051 | 0.637 | 0.06 | 0.96 | 0.33 | 1.69 | -0.053 | 0.465 | 0.331 | balance,timeouts |
| LKSGMMAQ | 160 | 58 | 72 | 30 | 0.588 | 0.532–0.643 | +61 ±39 | 55.0% | 36.3% | 8.8% | 149.7±84.9 | 0.27 | 0.027 | 0.606 | 0.09 | 0.97 | 0.39 | 1.55 | -0.051 | 0.465 | 0.344 | balance,timeouts |
| QKGGSAAM | 160 | 32 | 103 | 25 | 0.522 | 0.476–0.568 | +15 ±32 | 35.6% | 50.0% | 14.4% | 167.0±83.9 | 0.25 | 0.054 | 0.661 | 0.08 | 0.96 | 0.38 | 2.04 | -0.007 | 0.464 | 0.341 | timeouts |
| AQASGMGK | 160 | 24 | 107 | 29 | 0.484 | 0.440–0.529 | -11 ±31 | 33.1% | 50.0% | 16.9% | 180.5±84.5 | 0.24 | 0.040 | 0.654 | 0.08 | 0.97 | 0.35 | 2.08 | -0.010 | 0.464 | 0.348 | timeouts |
| AKSMMSLG | 160 | 31 | 84 | 45 | 0.456 | 0.403–0.509 | -30 ±37 | 47.5% | 36.9% | 15.6% | 178.5±83.1 | 0.23 | 0.043 | 0.640 | 0.09 | 0.97 | 0.34 | 1.66 | 0.032 | 0.463 | 0.349 | balance,timeouts |
| ALAKGSMS | 160 | 20 | 121 | 19 | 0.503 | 0.465–0.541 | +2 ±27 | 24.4% | 53.8% | 21.9% | 202.2±81.3 | 0.23 | 0.040 | 0.636 | 0.04 | 0.97 | 0.30 | 1.89 | -0.052 | 0.452 | 0.328 | timeouts |
| AGLSGMKM | 160 | 26 | 105 | 29 | 0.491 | 0.445–0.536 | -7 ±32 | 34.4% | 51.9% | 13.8% | 170.0±86.2 | 0.20 | 0.069 | 0.657 | 0.07 | 0.97 | 0.36 | 1.56 | 0.025 | 0.452 | 0.348 | timeouts |
| AMKQLSAG | 160 | 38 | 101 | 21 | 0.553 | 0.507–0.599 | +37 ±32 | 36.9% | 45.0% | 18.1% | 176.3±88.7 | 0.22 | 0.029 | 0.631 | 0.06 | 0.97 | 0.35 | 1.72 | -0.108 | 0.451 | 0.336 | balance,timeouts |
| QAGASKMS | 160 | 17 | 125 | 18 | 0.497 | 0.461–0.533 | -2 ±25 | 21.9% | 58.1% | 20.0% | 187.6±85.8 | 0.19 | 0.048 | 0.670 | 0.05 | 0.97 | 0.33 | 2.22 | -0.077 | 0.445 | 0.325 | timeouts |
| GAKSAMMG | 160 | 15 | 129 | 16 | 0.497 | 0.463–0.531 | -2 ±24 | 19.4% | 58.1% | 22.5% | 200.4±83.9 | 0.19 | 0.046 | 0.667 | 0.04 | 0.97 | 0.30 | 1.70 | -0.102 | 0.444 | 0.319 | timeouts |
| AGQKLAMS | 160 | 24 | 119 | 17 | 0.522 | 0.483–0.561 | +15 ±27 | 25.6% | 57.5% | 16.9% | 175.9±90.6 | 0.20 | 0.040 | 0.641 | 0.04 | 0.97 | 0.32 | 1.80 | -0.107 | 0.442 | 0.319 | timeouts |
| AAMKMLGS | 160 | 19 | 130 | 11 | 0.525 | 0.492–0.558 | +17 ±23 | 18.8% | 64.4% | 16.9% | 189.8±81.9 | 0.20 | 0.039 | 0.653 | 0.04 | 0.97 | 0.32 | 1.53 | -0.187 | 0.440 | 0.319 | timeouts,drawRate |

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
