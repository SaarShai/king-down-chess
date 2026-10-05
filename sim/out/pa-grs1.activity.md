# Piece activity: pa-grs1

Files: `sim/out/pa-grs1.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 5.97 | 1.18 [1.15, 1.21] | 1.18 | 1.19 [1.16, 1.22] | 8.2% | 96.8% | 30.0 |
| O ogre | 4633 | 9266 | 4.79 | 0.95 [0.92, 0.97] | 0.53 | 0.53 [0.51, 0.55] | 11.3% | 95.7% | 23.0 |
| R rook | 7014 | 18348 | 4.21 | 0.83 [0.82, 0.85] | 0.88 | 0.89 [0.87, 0.90] | 16.3% | 94.5% | 38.0 |
| B bishop | 6741 | 16112 | 3.48 | 0.69 [0.67, 0.70] | 0.79 | 0.80 [0.78, 0.81] | 6.5% | 98.2% | 19.0 |
| N knight | 6983 | 18256 | 3.82 | 0.76 [0.75, 0.77] | 0.70 | 0.71 [0.70, 0.72] | 1.3% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 8.48 | 1.68 [1.66, 1.69] | 2.08 | 2.09 [2.07, 2.11] | 2.6% | 99.4% | 15.0 |
| G guard | 4714 | 9428 | 3.25 | 0.64 [0.62, 0.67] | 0.00 | cannot capture | 10.4% | 94.5% | 30.0 |
| M maester | 6926 | 18052 | 5.61 | 1.11 [1.10, 1.12] | 0.57 | 0.57 [0.56, 0.59] | 6.7% | 98.3% | 20.0 |
| S beast | 4593 | 9186 | 5.35 | 1.06 [1.04, 1.08] | 1.11 | 1.11 [1.08, 1.15] | 3.7% | 98.9% | 17.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.067 | 0.55 | 0.218 | 1.17 | 0.442 | 1.65 | 0.200 | 2.21 |
| O ogre | 0.078 | 0.64 | 0.136 | 0.73 | 0.258 | 0.96 | 0.141 | 1.83 |
| R rook | 0.038 | 0.32 | 0.168 | 0.90 | 0.386 | 1.44 | 0.153 | 2.52 |
| B bishop | 0.109 | 0.89 | 0.171 | 0.92 | 0.240 | 0.89 | 0.153 | 1.57 |
| N knight | 0.225 | 1.85 | 0.212 | 1.14 | 0.246 | 0.92 | 0.222 | 1.11 |
| A archer | 0.208 | 1.72 | 0.290 | 1.55 | 0.321 | 1.19 | 0.270 | 1.19 |
| G guard | 0.046 | 0.38 | 0.047 | 0.25 | 0.101 | 0.38 | 0.064 | 1.58 |
| M maester | 0.108 | 0.89 | 0.190 | 1.02 | 0.287 | 1.07 | 0.177 | 1.63 |
| S beast | 0.152 | 1.25 | 0.192 | 1.03 | 0.244 | 0.91 | 0.186 | 1.31 |
| average piece | 0.121 | 1.00 | 0.186 | 1.00 | 0.268 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -3.0 [-4.7, -1.5] | -0.3 [-2.1, +1.5] | -9.0% [-10.8%, -7.2%] |
| O ogre | 4633 | 4367 | -0.6 [-2.2, +1.0] | +1.3 [-0.3, +3.2] | 1.8% [-0.2%, 3.8%] |
| R rook | 7014 | 1986 | +1.0 [-0.9, +2.9] | -0.1 [-2.4, +2.3] | 0.2% [-2.1%, 2.5%] |
| B bishop | 6741 | 2259 | +0.5 [-1.5, +2.4] | -3.3 [-5.4, -1.0] | -2.2% [-4.4%, -0.1%] |
| N knight | 6983 | 2017 | +1.1 [-0.8, +3.0] | +0.4 [-1.8, +2.7] | -0.6% [-2.8%, 1.8%] |
| A archer | 6988 | 2012 | -6.0 [-8.3, -4.0] | -1.0 [-3.1, +1.1] | -1.9% [-4.1%, 0.2%] |
| G guard | 4714 | 4286 | +2.9 [+1.2, +4.4] | +0.1 [-1.6, +2.0] | 6.1% [3.9%, 7.9%] |
| M maester | 6926 | 2074 | +3.7 [+1.9, +5.5] | +1.1 [-1.1, +3.3] | 7.8% [5.2%, 10.2%] |
| S beast | 4593 | 4407 | -3.5 [-5.1, -1.9] | -0.0 [-1.8, +1.8] | -6.3% [-8.0%, -4.5%] |
| all games | 9000 | | draws 18.9% | White 51.7% | 103.3 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.19 [1.16, 1.22] | PASS 1.18 [1.15, 1.21] | PASS 2.21 | PASS 1.65 [1.61, 1.68] | PASS 91.8% [91.2%, 92.4%] | fail? (draws) |
| O ogre | PASS 0.53 [0.51, 0.55] | PASS 0.95 [0.92, 0.97] | PASS 1.83 | fail? 0.96 [0.92, 1.00] | PASS 88.7% [87.9%, 89.4%] | pass? |
| R rook | PASS 0.89 [0.87, 0.90] | PASS 0.83 [0.82, 0.85] | PASS 2.52 | PASS 1.44 [1.41, 1.46] | FAIL 83.7% [83.0%, 84.3%] | pass? |
| B bishop | PASS 0.80 [0.78, 0.81] | PASS 0.69 [0.67, 0.70] | PASS 1.57 | FAIL 0.92 [0.91, 0.93] | PASS 93.5% [93.1%, 93.9%] | fail? (White) |
| N knight | PASS 0.71 [0.70, 0.72] | PASS 0.76 [0.75, 0.77] | PASS 1.11 | PASS 1.85 [1.84, 1.87] | PASS 98.7% [98.5%, 98.8%] | pass? |
| A archer | FAIL 2.09 [2.07, 2.11] | PASS 1.68 [1.66, 1.69] | PASS 1.19 | PASS 1.72 [1.69, 1.74] | PASS 97.4% [97.1%, 97.7%] | FAIL (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.64 [0.62, 0.67] | PASS 1.58 | FAIL 0.38 [0.37, 0.40] | PASS 89.6% [88.8%, 90.4%] | pass? |
| M maester | PASS 0.57 [0.56, 0.59] | PASS 1.11 [1.10, 1.12] | PASS 1.63 | PASS 1.07 [1.05, 1.09] | PASS 93.3% [92.8%, 93.7%] | fail? (draws) |
| S beast | PASS 1.11 [1.08, 1.15] | PASS 1.06 [1.04, 1.08] | PASS 1.31 | PASS 1.25 [1.22, 1.28] | PASS 96.3% [95.8%, 96.7%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
