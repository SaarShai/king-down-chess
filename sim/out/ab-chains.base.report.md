# Sim report — ab-chains.base

200 games. White score **0.510** (95% 0.453–0.567),
white advantage **+7 ± 40 Elo**.
Decisive 68.0% · draws 26.0% · capped 6.0% (counted apart, never as draws).
Plies: mean 133.8 ± 72.3, median 109. Rules: all defaults.

No complete colour-swapped pairs in this run.
σ_pg 0.4122 · normalized Elo +8 · LOS 63.4% ·
SPRT LLR 0.04 against ±2.94 (nElo 0 vs 4) → **continue**.

## Overall
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ALL | 200 | 70 | 64 | 66 | 0.510 | 0.453–0.567 | +7 ±40 | 68.0% | 26.0% | 6.0% | 133.8±72.3 | 0.34 | 0.034 | 0.629 | 0.12 | 0.97 | 0.43 | -0.023 | 0.383 | timeouts |

## Piece utilisation (move share / starting-material share; 1 = pulls its weight)
| piece | K | S | G | N | A | L | Q | P | R | B | M |
|---|---|---|---|---|---|---|---|---|---|---|---|
| use | 1.99 | 0.49 | 2.05 | 1.21 | 1.59 | 1.45 | 1.39 | 0.43 | 1.36 | 1.38 | 2.37 |

## End reasons
| reason | games | share |
|---|---|---|
| adjudicatedResign | 135 | 67.5% |
| adjudicatedDraw | 29 | 14.5% |
| draw50 | 15 | 7.5% |
| plyCap | 12 | 6.0% |
| drawRepetition | 7 | 3.5% |
| drawMaterial | 1 | 0.5% |
| checkmate | 1 | 0.5% |

## Pieces
| piece | moves | captures made | times captured | started | survived | survival |
|---|---|---|---|---|---|---|
| P | 5781 | 1152 | 2144 | 3200 | 981 | 30.7% |
| M | 3767 | 292 | 190 | 380 | 190 | 50.0% |
| K | 3324 | 207 | 0 | 400 | 400 | 100.0% |
| G | 3079 | 0 | 13 | 360 | 353 | 98.1% |
| A | 2660 | 462 | 144 | 400 | 256 | 64.0% |
| N | 2318 | 496 | 399 | 460 | 61 | 13.3% |
| R | 2161 | 404 | 272 | 380 | 108 | 28.4% |
| B | 1266 | 249 | 172 | 220 | 48 | 21.8% |
| L | 1090 | 107 | 47 | 180 | 26 | 14.4% |
| Q | 695 | 126 | 106 | 120 | 83 | 69.2% |
| S | 614 | 92 | 100 | 300 | 200 | 66.7% |

## Fairy events (both sides, whole run)
| event | total | per game |
|---|---|---|
| archerShots | 462 | 2.31 |
| beastChainMoves | 87 | 0.43 |
| beastChainCaptures | 92 | 0.46 |
| maesterSwaps | 1436 | 7.18 |
| maesterLongSwaps | 301 | 1.50 |
| paladinSacrifices | 107 | 0.54 |
| promotions | 75 | 0.38 |
| checks | 909 | 4.54 |

## Balance axis — back ranks by |white score − 0.5| (ascending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| RSNSKNAB | 10 | 5 | 0 | 5 | 0.500 | 0.190–0.810 | +0 ±215 | 100.0% | 0.0% | 0.0% | 110.0±21.7 | 0.26 | 0.030 | 0.595 | 0.29 | 0.96 | 0.54 | 0.294 | 0.414 | - |
| RNKSLGAS | 10 | 4 | 2 | 4 | 0.500 | 0.223–0.777 | +0 ±193 | 80.0% | 20.0% | 0.0% | 114.7±65.3 | 0.24 | 0.020 | 0.605 | 0.14 | 0.96 | 0.48 | 0.094 | 0.369 | - |
| MGQMBSNK | 10 | 3 | 4 | 3 | 0.500 | 0.260–0.740 | +0 ±167 | 60.0% | 40.0% | 0.0% | 136.4±64.7 | 0.42 | 0.043 | 0.661 | 0.15 | 0.97 | 0.40 | -0.106 | 0.381 | - |
| AMNKRRQL | 10 | 3 | 3 | 4 | 0.450 | 0.193–0.707 | -35 ±179 | 70.0% | 30.0% | 0.0% | 127.2±72.7 | 0.38 | 0.050 | 0.606 | 0.10 | 0.97 | 0.42 | 0.008 | 0.488 | balance |
| GKRNMMRG | 10 | 2 | 5 | 3 | 0.450 | 0.233–0.667 | -35 ±151 | 50.0% | 40.0% | 10.0% | 151.6±85.9 | 0.29 | 0.072 | 0.677 | 0.15 | 0.97 | 0.37 | -0.192 | 0.468 | balance,timeouts |
| BRNMSKMA | 10 | 5 | 1 | 4 | 0.550 | 0.258–0.842 | +35 ±203 | 90.0% | 10.0% | 0.0% | 106.9±44.0 | 0.40 | 0.027 | 0.657 | 0.13 | 0.96 | 0.55 | 0.208 | 0.427 | balance |
| SSARANKM | 10 | 2 | 7 | 1 | 0.550 | 0.383–0.717 | +35 ±116 | 30.0% | 50.0% | 20.0% | 179.6±82.3 | 0.32 | 0.034 | 0.651 | 0.06 | 0.96 | 0.36 | -0.392 | 0.342 | balance,timeouts,drawRate |
| NSGGMAKL | 10 | 3 | 5 | 2 | 0.550 | 0.333–0.767 | +35 ±151 | 50.0% | 40.0% | 10.0% | 183.9±67.8 | 0.32 | 0.027 | 0.591 | 0.05 | 0.97 | 0.34 | -0.192 | 0.350 | balance,timeouts |
| BGKNMQLN | 10 | 5 | 1 | 4 | 0.550 | 0.258–0.842 | +35 ±203 | 90.0% | 10.0% | 0.0% | 91.7±36.8 | 0.25 | 0.029 | 0.597 | 0.09 | 0.97 | 0.52 | 0.208 | 0.474 | balance |
| KSGNANLQ | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 113.2±66.2 | 0.37 | 0.016 | 0.582 | 0.13 | 0.96 | 0.23 | 0.123 | 0.343 | balance,utilisation |
| QARSBLGK | 10 | 3 | 2 | 5 | 0.400 | 0.130–0.670 | -70 ±188 | 80.0% | 20.0% | 0.0% | 124.9±58.6 | 0.33 | 0.023 | 0.629 | 0.18 | 0.97 | 0.44 | 0.123 | 0.387 | balance |
| KBGNGMMA | 10 | 2 | 4 | 4 | 0.400 | 0.168–0.632 | -70 ±161 | 60.0% | 30.0% | 10.0% | 125.5±66.6 | 0.41 | 0.049 | 0.663 | 0.12 | 0.96 | 0.51 | -0.077 | 0.498 | balance,timeouts |
| NRRKBAGM | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 131.6±50.4 | 0.48 | 0.040 | 0.676 | 0.16 | 0.97 | 0.46 | 0.123 | 0.457 | balance |
| RRSAQNMK | 10 | 3 | 2 | 5 | 0.400 | 0.130–0.670 | -70 ±188 | 80.0% | 10.0% | 10.0% | 130.2±66.2 | 0.41 | 0.032 | 0.653 | 0.17 | 0.96 | 0.44 | 0.123 | 0.429 | balance,timeouts |
| RNMSAKGR | 10 | 2 | 3 | 5 | 0.350 | 0.108–0.592 | -108 ±168 | 70.0% | 30.0% | 0.0% | 134.7±45.8 | 0.34 | 0.038 | 0.643 | 0.14 | 0.97 | 0.45 | 0.037 | 0.396 | balance |
| KNGNBRAB | 10 | 5 | 3 | 2 | 0.650 | 0.408–0.892 | +108 ±168 | 70.0% | 20.0% | 10.0% | 129.0±87.7 | 0.35 | 0.032 | 0.653 | 0.19 | 0.96 | 0.44 | 0.037 | 0.501 | balance,timeouts |
| GKLAMNMS | 10 | 0 | 7 | 3 | 0.350 | 0.208–0.492 | -108 ±99 | 30.0% | 40.0% | 30.0% | 196.2±88.8 | 0.35 | 0.037 | 0.624 | 0.07 | 0.96 | 0.33 | -0.363 | 0.349 | balance,timeouts |
| ASGLABKM | 10 | 1 | 5 | 4 | 0.350 | 0.152–0.548 | -108 ±138 | 50.0% | 40.0% | 10.0% | 186.0±66.4 | 0.29 | 0.046 | 0.629 | 0.12 | 0.96 | 0.33 | -0.163 | 0.360 | balance,timeouts |
| GALMRRKN | 10 | 5 | 4 | 1 | 0.700 | 0.494–0.906 | +147 ±143 | 60.0% | 30.0% | 10.0% | 124.3±74.6 | 0.17 | 0.026 | 0.607 | 0.04 | 0.97 | 0.41 | -0.049 | 0.413 | balance,timeouts |
| GRBNANKA | 10 | 7 | 2 | 1 | 0.800 | 0.594–1.000 | +241 ±143 | 80.0% | 20.0% | 0.0% | 77.9±50.1 | 0.36 | 0.005 | 0.591 | 0.00 | 0.96 | 0.58 | 0.180 | 0.486 | balance |

## Interest axis — back ranks by interest score (descending)
| key | n | W | D | L | score | score 95% | white Elo ± | decisive | draw | capped | plies | killer | leadΔ | unc | drama | perm | minUse | xDec | interest | gates |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| KNGNBRAB | 10 | 5 | 3 | 2 | 0.650 | 0.408–0.892 | +108 ±168 | 70.0% | 20.0% | 10.0% | 129.0±87.7 | 0.35 | 0.032 | 0.653 | 0.19 | 0.96 | 0.44 | 0.037 | 0.501 | balance,timeouts |
| KBGNGMMA | 10 | 2 | 4 | 4 | 0.400 | 0.168–0.632 | -70 ±161 | 60.0% | 30.0% | 10.0% | 125.5±66.6 | 0.41 | 0.049 | 0.663 | 0.12 | 0.96 | 0.51 | -0.077 | 0.498 | balance,timeouts |
| AMNKRRQL | 10 | 3 | 3 | 4 | 0.450 | 0.193–0.707 | -35 ±179 | 70.0% | 30.0% | 0.0% | 127.2±72.7 | 0.38 | 0.050 | 0.606 | 0.10 | 0.97 | 0.42 | 0.008 | 0.488 | balance |
| GRBNANKA | 10 | 7 | 2 | 1 | 0.800 | 0.594–1.000 | +241 ±143 | 80.0% | 20.0% | 0.0% | 77.9±50.1 | 0.36 | 0.005 | 0.591 | 0.00 | 0.96 | 0.58 | 0.180 | 0.486 | balance |
| BGKNMQLN | 10 | 5 | 1 | 4 | 0.550 | 0.258–0.842 | +35 ±203 | 90.0% | 10.0% | 0.0% | 91.7±36.8 | 0.25 | 0.029 | 0.597 | 0.09 | 0.97 | 0.52 | 0.208 | 0.474 | balance |
| GKRNMMRG | 10 | 2 | 5 | 3 | 0.450 | 0.233–0.667 | -35 ±151 | 50.0% | 40.0% | 10.0% | 151.6±85.9 | 0.29 | 0.072 | 0.677 | 0.15 | 0.97 | 0.37 | -0.192 | 0.468 | balance,timeouts |
| NRRKBAGM | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 131.6±50.4 | 0.48 | 0.040 | 0.676 | 0.16 | 0.97 | 0.46 | 0.123 | 0.457 | balance |
| RRSAQNMK | 10 | 3 | 2 | 5 | 0.400 | 0.130–0.670 | -70 ±188 | 80.0% | 10.0% | 10.0% | 130.2±66.2 | 0.41 | 0.032 | 0.653 | 0.17 | 0.96 | 0.44 | 0.123 | 0.429 | balance,timeouts |
| BRNMSKMA | 10 | 5 | 1 | 4 | 0.550 | 0.258–0.842 | +35 ±203 | 90.0% | 10.0% | 0.0% | 106.9±44.0 | 0.40 | 0.027 | 0.657 | 0.13 | 0.96 | 0.55 | 0.208 | 0.427 | balance |
| RSNSKNAB | 10 | 5 | 0 | 5 | 0.500 | 0.190–0.810 | +0 ±215 | 100.0% | 0.0% | 0.0% | 110.0±21.7 | 0.26 | 0.030 | 0.595 | 0.29 | 0.96 | 0.54 | 0.294 | 0.414 | - |
| GALMRRKN | 10 | 5 | 4 | 1 | 0.700 | 0.494–0.906 | +147 ±143 | 60.0% | 30.0% | 10.0% | 124.3±74.6 | 0.17 | 0.026 | 0.607 | 0.04 | 0.97 | 0.41 | -0.049 | 0.413 | balance,timeouts |
| RNMSAKGR | 10 | 2 | 3 | 5 | 0.350 | 0.108–0.592 | -108 ±168 | 70.0% | 30.0% | 0.0% | 134.7±45.8 | 0.34 | 0.038 | 0.643 | 0.14 | 0.97 | 0.45 | 0.037 | 0.396 | balance |
| QARSBLGK | 10 | 3 | 2 | 5 | 0.400 | 0.130–0.670 | -70 ±188 | 80.0% | 20.0% | 0.0% | 124.9±58.6 | 0.33 | 0.023 | 0.629 | 0.18 | 0.97 | 0.44 | 0.123 | 0.387 | balance |
| MGQMBSNK | 10 | 3 | 4 | 3 | 0.500 | 0.260–0.740 | +0 ±167 | 60.0% | 40.0% | 0.0% | 136.4±64.7 | 0.42 | 0.043 | 0.661 | 0.15 | 0.97 | 0.40 | -0.106 | 0.381 | - |
| RNKSLGAS | 10 | 4 | 2 | 4 | 0.500 | 0.223–0.777 | +0 ±193 | 80.0% | 20.0% | 0.0% | 114.7±65.3 | 0.24 | 0.020 | 0.605 | 0.14 | 0.96 | 0.48 | 0.094 | 0.369 | - |
| ASGLABKM | 10 | 1 | 5 | 4 | 0.350 | 0.152–0.548 | -108 ±138 | 50.0% | 40.0% | 10.0% | 186.0±66.4 | 0.29 | 0.046 | 0.629 | 0.12 | 0.96 | 0.33 | -0.163 | 0.360 | balance,timeouts |
| NSGGMAKL | 10 | 3 | 5 | 2 | 0.550 | 0.333–0.767 | +35 ±151 | 50.0% | 40.0% | 10.0% | 183.9±67.8 | 0.32 | 0.027 | 0.591 | 0.05 | 0.97 | 0.34 | -0.192 | 0.350 | balance,timeouts |
| GKLAMNMS | 10 | 0 | 7 | 3 | 0.350 | 0.208–0.492 | -108 ±99 | 30.0% | 40.0% | 30.0% | 196.2±88.8 | 0.35 | 0.037 | 0.624 | 0.07 | 0.96 | 0.33 | -0.363 | 0.349 | balance,timeouts |
| KSGNANLQ | 10 | 5 | 2 | 3 | 0.600 | 0.330–0.870 | +70 ±188 | 80.0% | 20.0% | 0.0% | 113.2±66.2 | 0.37 | 0.016 | 0.582 | 0.13 | 0.96 | 0.23 | 0.123 | 0.343 | balance,utilisation |
| SSARANKM | 10 | 2 | 7 | 1 | 0.550 | 0.383–0.717 | +35 ±116 | 30.0% | 50.0% | 20.0% | 179.6±82.3 | 0.32 | 0.034 | 0.651 | 0.06 | 0.96 | 0.36 | -0.392 | 0.342 | balance,timeouts,drawRate |

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
