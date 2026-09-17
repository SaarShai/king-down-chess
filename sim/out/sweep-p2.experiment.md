# Arrangement sweep — sweep-p2

Successive halving, eta = 2, 2 rounds, common random numbers inside every round
(docs/SIM-PLAN.md §8). Depth 3. Round 1 starts with 60 random back ranks and
80 games each; every round doubles the games and keeps the better half.

The ranking key is **imbalance = |white score − 0.5|**, ties broken by the interest score. Balance and interest
stay two axes; the table prints both, and the gate column prints the rejects.

## Round 1 — 60 arrangements x 80 games
| back rank | games | score | imbalance | decisive | draws | xDec | interest | minUse | gates |
|---|---|---|---|---|---|---|---|---|---|
| GRMGKNBB | 80 | 0.500 | 0.000 | 57.5% | 37.5% | -0.045 | 0.486 | 0.42 | - |
| LABKRSQN | 80 | 0.500 | 0.000 | 75.0% | 21.3% | 0.130 | 0.394 | 0.50 | - |
| SQBRRNKM | 80 | 0.500 | 0.000 | 80.0% | 20.0% | 0.180 | 0.385 | 0.37 | - |
| NSBBQNKG | 80 | 0.500 | 0.000 | 77.5% | 21.3% | 0.155 | 0.385 | 0.32 | - |
| QKNALSRM | 80 | 0.506 | 0.006 | 63.7% | 32.5% | 0.020 | 0.378 | 0.41 | - |
| MSNGGAKN | 80 | 0.506 | 0.006 | 53.8% | 31.3% | -0.080 | 0.375 | 0.40 | timeouts |
| LGKBSMGR | 80 | 0.506 | 0.006 | 53.8% | 41.3% | -0.080 | 0.357 | 0.38 | - |
| AGSMRSMK | 80 | 0.506 | 0.006 | 41.3% | 36.3% | -0.205 | 0.333 | 0.34 | timeouts |
| AKNNARLQ | 80 | 0.512 | 0.012 | 82.5% | 15.0% | 0.209 | 0.476 | 0.47 | - |
| SKANSGGR | 80 | 0.512 | 0.012 | 37.5% | 56.3% | -0.241 | 0.349 | 0.40 | timeouts,drawRate |
| BNMKGMLA | 80 | 0.487 | 0.013 | 65.0% | 31.3% | 0.034 | 0.449 | 0.48 | - |
| MQKASSRL | 80 | 0.487 | 0.013 | 65.0% | 31.3% | 0.034 | 0.375 | 0.42 | - |
| AANSMRNK | 80 | 0.487 | 0.013 | 52.5% | 41.3% | -0.091 | 0.371 | 0.41 | timeouts |
| SAMNGBKR | 80 | 0.487 | 0.013 | 50.0% | 38.8% | -0.116 | 0.363 | 0.37 | timeouts |
| MNABAKSM | 80 | 0.487 | 0.013 | 50.0% | 40.0% | -0.116 | 0.358 | 0.36 | timeouts |
| KQMNGLAB | 80 | 0.481 | 0.019 | 71.3% | 21.3% | 0.098 | 0.491 | 0.46 | timeouts |
| NKSRGRBQ | 80 | 0.481 | 0.019 | 73.8% | 22.5% | 0.123 | 0.396 | 0.47 | - |
| BKMLQRGA | 80 | 0.519 | 0.019 | 61.3% | 32.5% | -0.002 | 0.449 | 0.44 | timeouts |
| NQMSNBKM | 80 | 0.519 | 0.019 | 73.8% | 22.5% | 0.123 | 0.404 | 0.50 | - |
| MRSMABKL | 80 | 0.519 | 0.019 | 63.7% | 35.0% | 0.023 | 0.388 | 0.46 | - |
| BSABKGLM | 80 | 0.519 | 0.019 | 61.3% | 31.3% | -0.002 | 0.382 | 0.42 | timeouts |
| BSALNRKG | 80 | 0.519 | 0.019 | 48.8% | 43.8% | -0.127 | 0.360 | 0.41 | timeouts |
| NAGQKGBM | 80 | 0.525 | 0.025 | 72.5% | 23.8% | 0.113 | 0.500 | 0.49 | - |
| MGKRGRNB | 80 | 0.475 | 0.025 | 62.5% | 31.3% | 0.013 | 0.491 | 0.44 | timeouts |
| BMMRNKGG | 80 | 0.525 | 0.025 | 57.5% | 33.8% | -0.037 | 0.488 | 0.44 | timeouts |
| ARLKBANN | 80 | 0.525 | 0.025 | 72.5% | 23.8% | 0.113 | 0.467 | 0.42 | - |
| BNMLGKAG | 80 | 0.475 | 0.025 | 65.0% | 26.3% | 0.038 | 0.425 | 0.52 | timeouts |
| GRKBALBA | 80 | 0.525 | 0.025 | 37.5% | 48.8% | -0.237 | 0.416 | 0.35 | timeouts,drawRate |
| ARKAGNML | 80 | 0.525 | 0.025 | 40.0% | 50.0% | -0.212 | 0.395 | 0.37 | timeouts,drawRate |
| RNRKSBAG | 80 | 0.525 | 0.025 | 60.0% | 31.3% | -0.012 | 0.390 | 0.42 | timeouts |
| NKGSRANQ | 80 | 0.525 | 0.025 | 65.0% | 28.7% | 0.038 | 0.383 | 0.39 | timeouts |
| SBRSGAKQ | 80 | 0.475 | 0.025 | 65.0% | 27.5% | 0.038 | 0.374 | 0.40 | timeouts |
| GSNKBMAB | 80 | 0.531 | 0.031 | 53.8% | 38.8% | -0.073 | 0.367 | 0.40 | balance,timeouts |
| LAQSKBGS | 80 | 0.531 | 0.031 | 61.3% | 31.3% | 0.002 | 0.353 | 0.41 | balance,timeouts |
| BLGKRSAG | 80 | 0.531 | 0.031 | 46.3% | 43.8% | -0.148 | 0.352 | 0.34 | balance,timeouts |
| KQGMBSGR | 80 | 0.531 | 0.031 | 43.8% | 50.0% | -0.173 | 0.345 | 0.39 | balance,timeouts,drawRate |
| KBQLGARN | 80 | 0.537 | 0.037 | 77.5% | 22.5% | 0.166 | 0.490 | 0.47 | balance |
| KLBRANQN | 80 | 0.537 | 0.037 | 85.0% | 15.0% | 0.241 | 0.465 | 0.50 | balance |
| GRNRAKAN | 80 | 0.537 | 0.037 | 47.5% | 45.0% | -0.134 | 0.461 | 0.40 | balance,timeouts |
| MMSBRGAK | 80 | 0.537 | 0.037 | 50.0% | 42.5% | -0.109 | 0.372 | 0.39 | balance,timeouts |

(20 more rows in `sim/out/sweep-p2.r1.report.md`)

## Round 2 — 30 arrangements x 160 games
| back rank | games | score | imbalance | decisive | draws | xDec | interest | minUse | gates |
|---|---|---|---|---|---|---|---|---|---|
| QKNALSRM | 160 | 0.497 | 0.003 | 76.9% | 20.6% | 0.178 | 0.408 | 0.42 | - |
| NSBBQNKG | 160 | 0.497 | 0.003 | 74.4% | 22.5% | 0.153 | 0.391 | 0.39 | - |
| LGKBSMGR | 160 | 0.497 | 0.003 | 39.4% | 48.8% | -0.197 | 0.338 | 0.37 | timeouts,drawRate |
| BNMKGMLA | 160 | 0.494 | 0.006 | 66.3% | 28.1% | 0.068 | 0.444 | 0.46 | timeouts |
| LABKRSQN | 160 | 0.506 | 0.006 | 80.0% | 16.3% | 0.205 | 0.400 | 0.49 | - |
| MSNGGAKN | 160 | 0.506 | 0.006 | 48.8% | 40.6% | -0.107 | 0.368 | 0.42 | timeouts |
| MNABAKSM | 160 | 0.494 | 0.006 | 42.5% | 43.8% | -0.170 | 0.339 | 0.34 | timeouts |
| ARKAGNML | 160 | 0.509 | 0.009 | 49.4% | 39.4% | -0.104 | 0.439 | 0.39 | timeouts |
| BSALNRKG | 160 | 0.491 | 0.009 | 61.9% | 33.1% | 0.021 | 0.378 | 0.41 | - |
| AGSMRSMK | 160 | 0.509 | 0.009 | 35.6% | 47.5% | -0.242 | 0.337 | 0.35 | timeouts |
| NKSRGRBQ | 160 | 0.487 | 0.013 | 67.5% | 26.9% | 0.074 | 0.382 | 0.46 | timeouts |
| RNRKSBAG | 160 | 0.516 | 0.016 | 65.6% | 30.0% | 0.051 | 0.393 | 0.42 | - |
| BNMLGKAG | 160 | 0.519 | 0.019 | 71.3% | 25.0% | 0.104 | 0.438 | 0.50 | - |
| BSABKGLM | 160 | 0.519 | 0.019 | 63.7% | 28.7% | 0.029 | 0.386 | 0.41 | timeouts |
| BMMRNKGG | 160 | 0.522 | 0.022 | 48.1% | 44.4% | -0.131 | 0.468 | 0.43 | timeouts |
| AKNNARLQ | 160 | 0.531 | 0.031 | 73.8% | 21.3% | 0.115 | 0.486 | 0.44 | balance |
| AANSMRNK | 160 | 0.531 | 0.031 | 63.7% | 31.9% | 0.015 | 0.393 | 0.43 | balance |
| NAGQKGBM | 160 | 0.534 | 0.034 | 65.6% | 30.0% | 0.031 | 0.503 | 0.44 | balance |
| GRMGKNBB | 160 | 0.534 | 0.034 | 60.6% | 36.9% | -0.019 | 0.485 | 0.45 | balance |
| GRKBALBA | 160 | 0.534 | 0.034 | 51.9% | 37.5% | -0.107 | 0.416 | 0.38 | balance,timeouts |
| NQMSNBKM | 160 | 0.459 | 0.041 | 74.4% | 23.8% | 0.111 | 0.402 | 0.49 | balance |
| MRSMABKL | 160 | 0.544 | 0.044 | 66.3% | 28.7% | 0.027 | 0.390 | 0.42 | balance |
| SKANSGGR | 160 | 0.456 | 0.044 | 40.0% | 50.6% | -0.236 | 0.339 | 0.37 | balance,timeouts,drawRate |
| SQBRRNKM | 160 | 0.550 | 0.050 | 80.0% | 20.0% | 0.157 | 0.371 | 0.33 | balance |
| KQMNGLAB | 160 | 0.556 | 0.056 | 75.0% | 21.9% | 0.100 | 0.486 | 0.47 | balance |
| SAMNGBKR | 160 | 0.556 | 0.056 | 53.8% | 40.6% | -0.112 | 0.364 | 0.41 | balance,timeouts |
| ARLKBANN | 160 | 0.569 | 0.069 | 66.3% | 30.0% | -0.001 | 0.416 | 0.43 | balance |
| BKMLQRGA | 160 | 0.578 | 0.078 | 76.9% | 20.0% | 0.095 | 0.471 | 0.47 | balance |
| MQKASSRL | 160 | 0.584 | 0.084 | 66.9% | 26.9% | -0.012 | 0.366 | 0.45 | balance,timeouts |
| MGKRGRNB | 160 | 0.588 | 0.088 | 58.8% | 36.3% | -0.097 | 0.475 | 0.43 | balance |

## Survivors
`QKNALSRM NSBBQNKG LGKBSMGR BNMKGMLA LABKRSQN MSNGGAKN MNABAKSM ARKAGNML BSALNRKG AGSMRSMK`

Round 1 numbers are noisy on purpose: at 80 games one arrangement's score carries about
±0.11. Halving spends the budget on the survivors, so trust the last round only,
and confirm it at a second depth before acting.
