# Piece activity: pa-anb

Files: `sim/out/pa-anb.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 5.96 | 1.18 [1.15, 1.20] | 1.17 | 1.18 [1.15, 1.20] | 7.9% | 96.9% | 30.0 |
| O ogre | 4633 | 9266 | 4.87 | 0.96 [0.94, 0.99] | 0.54 | 0.55 [0.53, 0.56] | 11.3% | 95.7% | 23.0 |
| R rook | 7014 | 18348 | 4.20 | 0.83 [0.82, 0.85] | 0.88 | 0.88 [0.87, 0.90] | 16.1% | 94.5% | 39.0 |
| B bishop | 6741 | 16112 | 3.53 | 0.70 [0.69, 0.71] | 0.81 | 0.81 [0.80, 0.83] | 6.6% | 98.3% | 20.0 |
| N knight | 6983 | 18256 | 3.87 | 0.76 [0.76, 0.77] | 0.71 | 0.72 [0.71, 0.73] | 1.5% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 8.45 | 1.67 [1.65, 1.69] | 2.06 | 2.07 [2.04, 2.09] | 2.5% | 99.4% | 16.0 |
| G guard | 4714 | 9428 | 2.75 | 0.54 [0.52, 0.57] | 0.00 | cannot capture | 28.1% | 82.7% | 33.0 |
| M maester | 6926 | 18052 | 5.72 | 1.13 [1.12, 1.14] | 0.58 | 0.59 [0.58, 0.60] | 6.1% | 98.4% | 20.0 |
| S beast | 4593 | 9186 | 5.46 | 1.08 [1.06, 1.10] | 1.10 | 1.10 [1.07, 1.13] | 4.0% | 98.7% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.071 | 0.59 | 0.216 | 1.16 | 0.437 | 1.63 | 0.199 | 2.20 |
| O ogre | 0.077 | 0.64 | 0.140 | 0.75 | 0.267 | 1.00 | 0.144 | 1.86 |
| R rook | 0.037 | 0.31 | 0.170 | 0.91 | 0.387 | 1.44 | 0.153 | 2.53 |
| B bishop | 0.109 | 0.91 | 0.174 | 0.94 | 0.242 | 0.90 | 0.155 | 1.56 |
| N knight | 0.227 | 1.89 | 0.214 | 1.15 | 0.255 | 0.95 | 0.224 | 1.14 |
| A archer | 0.207 | 1.72 | 0.289 | 1.55 | 0.315 | 1.17 | 0.268 | 1.17 |
| G guard | 0.027 | 0.23 | 0.032 | 0.17 | 0.103 | 0.38 | 0.054 | 1.91 |
| M maester | 0.111 | 0.93 | 0.196 | 1.05 | 0.287 | 1.07 | 0.180 | 1.59 |
| S beast | 0.150 | 1.24 | 0.190 | 1.02 | 0.247 | 0.92 | 0.186 | 1.33 |
| average piece | 0.120 | 1.00 | 0.186 | 1.00 | 0.268 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -3.8 [-5.6, -2.2] | -0.5 [-2.5, +1.4] | -7.3% [-9.1%, -5.4%] |
| O ogre | 4633 | 4367 | +0.1 [-1.6, +1.8] | +1.2 [-0.9, +2.9] | 2.0% [0.1%, 4.0%] |
| R rook | 7014 | 1986 | -2.0 [-4.2, -0.2] | +0.9 [-1.2, +3.3] | -2.2% [-4.3%, 0.1%] |
| B bishop | 6741 | 2259 | +1.6 [-0.4, +3.4] | -1.2 [-3.4, +1.0] | -1.9% [-4.2%, 0.3%] |
| N knight | 6983 | 2017 | +1.0 [-1.2, +2.8] | +1.7 [-0.4, +4.0] | 0.3% [-1.9%, 2.5%] |
| A archer | 6988 | 2012 | -5.8 [-7.9, -3.9] | +0.5 [-1.7, +2.7] | -4.8% [-7.0%, -2.5%] |
| G guard | 4714 | 4286 | +3.2 [+1.6, +4.9] | +0.4 [-1.6, +2.3] | 7.2% [5.2%, 9.1%] |
| M maester | 6926 | 2074 | +2.6 [+0.7, +4.4] | -0.6 [-2.9, +1.6] | 8.4% [5.9%, 11.1%] |
| S beast | 4593 | 4407 | -3.0 [-4.6, -1.4] | -1.3 [-3.3, +0.6] | -5.0% [-6.6%, -3.3%] |
| all games | 9000 | | draws 19.0% | White 51.4% | 103.7 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.18 [1.15, 1.20] | PASS 1.18 [1.15, 1.20] | PASS 2.20 | PASS 1.63 [1.60, 1.67] | PASS 92.1% [91.5%, 92.7%] | fail? (draws) |
| O ogre | PASS 0.55 [0.53, 0.56] | PASS 0.96 [0.94, 0.99] | PASS 1.86 | fail? 1.00 [0.96, 1.04] | PASS 88.7% [87.9%, 89.5%] | pass? |
| R rook | PASS 0.88 [0.87, 0.90] | PASS 0.83 [0.82, 0.85] | PASS 2.53 | PASS 1.44 [1.42, 1.47] | FAIL 83.9% [83.2%, 84.5%] | pass? |
| B bishop | PASS 0.81 [0.80, 0.83] | PASS 0.70 [0.69, 0.71] | PASS 1.56 | FAIL 0.94 [0.93, 0.95] | PASS 93.4% [93.0%, 93.9%] | pass? |
| N knight | PASS 0.72 [0.71, 0.73] | PASS 0.76 [0.76, 0.77] | PASS 1.14 | PASS 1.89 [1.87, 1.91] | PASS 98.5% [98.3%, 98.7%] | pass? |
| A archer | FAIL 2.07 [2.04, 2.09] | PASS 1.67 [1.65, 1.69] | PASS 1.17 | PASS 1.72 [1.70, 1.75] | PASS 97.5% [97.2%, 97.8%] | FAIL (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.54 [0.52, 0.57] | PASS 1.91 | FAIL 0.38 [0.36, 0.40] | FAIL 71.9% [70.7%, 73.0%] | fail? (draws) |
| M maester | PASS 0.59 [0.58, 0.60] | PASS 1.13 [1.12, 1.14] | PASS 1.59 | PASS 1.07 [1.05, 1.09] | PASS 93.9% [93.5%, 94.3%] | pass? |
| S beast | PASS 1.10 [1.07, 1.13] | PASS 1.08 [1.06, 1.10] | PASS 1.33 | PASS 1.24 [1.22, 1.27] | PASS 96.0% [95.5%, 96.4%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
