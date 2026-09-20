# Interaction profile — 2026-09-17

What actually happens in recorded games: events per game, the share of games an interaction appears
in, and the decisive share in games with and without it. The last column is a **correlation**, not a
cause: an interaction can be rare *because* games end before it happens.

### ../king-down-sim/sim/out/nnue-g2.jsonl

80000 games · decisive 73.0% · draws 27.0% · capped 1.1% · mean plies 117

| interaction | per game | in games | decisive with | decisive without | Δ decisive |
|---|---|---|---|---|---|
| archerShots | 2.26 | 63.1% | 74.5% | 70.4% | 4.1 pts |
| beastChainMoves | 1.01 | 50.9% | 76.3% | 69.5% | 6.8 pts |
| maesterSwaps | 5.98 | 72.8% | 71.5% | 77.0% | -5.6 pts |
| maesterLongSwaps | 0.65 | 37.8% | 72.5% | 73.3% | -0.8 pts |
| paladinSacrifices | 0.57 | 41.9% | 74.7% | 71.7% | 3.0 pts |
| promotions | 0.31 | 27.1% | 95.1% | 64.7% | 30.4 pts |
| checks | 4.36 | 81.0% | 79.6% | 44.8% | 34.8 pts |
| ogreShoves | 0.00 | 0.0% | — | — | — |
| ogreShovesFriend | 0.00 | 0.0% | — | — | — |
| ogreShovesGuard | 0.00 | 0.0% | — | — | — |
| catapultChecks | 0.00 | 0.0% | — | — | — |

### sim/out/np-O.jsonl

2000 games · decisive 68.3% · draws 31.7% · capped 1.4% · mean plies 120

| interaction | per game | in games | decisive with | decisive without | Δ decisive |
|---|---|---|---|---|---|
| archerShots | 2.14 | 60.9% | 70.8% | 64.5% | 6.3 pts |
| beastChainMoves | 0.80 | 41.0% | 74.9% | 63.7% | 11.1 pts |
| maesterSwaps | 5.08 | 64.4% | 65.7% | 73.0% | -7.4 pts |
| maesterLongSwaps | 0.48 | 28.8% | 67.0% | 68.8% | -1.8 pts |
| paladinSacrifices | 0.45 | 31.3% | 70.7% | 67.2% | 3.5 pts |
| promotions | 0.32 | 27.8% | 96.0% | 57.6% | 38.4 pts |
| checks | 4.02 | 78.8% | 77.0% | 35.9% | 41.0 pts |
| ogreShoves | 3.33 | 94.2% | 67.9% | 75.0% | -7.1 pts |
| ogreShovesFriend | 3.12 | 93.7% | 67.9% | 74.8% | -6.9 pts |
| ogreShovesGuard | 0.02 | 1.9% | 64.1% | 68.4% | -4.3 pts |
| catapultChecks | 0.00 | 0.0% | — | — | — |

Read by `tools/jev-interest.ts` as the parameter table for the interestingness rubric.
