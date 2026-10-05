# Piece activity: pa-abk

Files: `sim/out/pa-abk.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 6.08 | 1.19 [1.16, 1.22] | 1.17 | 1.17 [1.14, 1.19] | 7.6% | 97.1% | 30.0 |
| O ogre | 4633 | 9266 | 4.83 | 0.95 [0.92, 0.97] | 0.54 | 0.54 [0.52, 0.56] | 11.6% | 95.6% | 23.0 |
| R rook | 7014 | 18348 | 4.25 | 0.83 [0.81, 0.85] | 0.89 | 0.88 [0.87, 0.90] | 16.0% | 94.8% | 39.0 |
| B bishop | 6741 | 16112 | 3.56 | 0.70 [0.69, 0.71] | 0.82 | 0.82 [0.80, 0.83] | 6.3% | 98.4% | 20.0 |
| N knight | 6983 | 18256 | 3.87 | 0.76 [0.75, 0.77] | 0.71 | 0.71 [0.70, 0.72] | 1.4% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 8.55 | 1.68 [1.66, 1.69] | 2.08 | 2.08 [2.06, 2.10] | 2.6% | 99.3% | 16.0 |
| G guard | 4714 | 9428 | 2.92 | 0.57 [0.55, 0.60] | 0.00 | cannot capture | 26.9% | 83.3% | 34.0 |
| M maester | 6926 | 18052 | 5.71 | 1.12 [1.11, 1.13] | 0.58 | 0.58 [0.56, 0.59] | 6.0% | 98.5% | 20.0 |
| S beast | 4593 | 9186 | 5.47 | 1.07 [1.05, 1.09] | 1.11 | 1.11 [1.08, 1.15] | 4.0% | 98.7% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.071 | 0.59 | 0.216 | 1.16 | 0.444 | 1.65 | 0.201 | 2.21 |
| O ogre | 0.077 | 0.64 | 0.140 | 0.75 | 0.268 | 0.99 | 0.143 | 1.87 |
| R rook | 0.037 | 0.31 | 0.169 | 0.90 | 0.389 | 1.44 | 0.154 | 2.53 |
| B bishop | 0.109 | 0.91 | 0.175 | 0.94 | 0.245 | 0.91 | 0.156 | 1.57 |
| N knight | 0.231 | 1.91 | 0.217 | 1.16 | 0.248 | 0.92 | 0.227 | 1.09 |
| A archer | 0.206 | 1.71 | 0.291 | 1.56 | 0.311 | 1.15 | 0.268 | 1.16 |
| G guard | 0.027 | 0.23 | 0.033 | 0.18 | 0.108 | 0.40 | 0.057 | 1.92 |
| M maester | 0.111 | 0.92 | 0.195 | 1.05 | 0.287 | 1.06 | 0.180 | 1.60 |
| S beast | 0.150 | 1.25 | 0.190 | 1.02 | 0.251 | 0.93 | 0.187 | 1.35 |
| average piece | 0.120 | 1.00 | 0.186 | 1.00 | 0.270 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -2.3 [-3.9, -0.7] | +0.5 [-1.5, +2.3] | -7.5% [-9.2%, -5.8%] |
| O ogre | 4633 | 4367 | +0.6 [-1.1, +2.0] | +1.5 [-0.4, +3.4] | -0.6% [-2.3%, 1.4%] |
| R rook | 7014 | 1986 | -2.1 [-4.0, -0.2] | -0.6 [-2.8, +1.4] | -0.9% [-3.2%, 1.5%] |
| B bishop | 6741 | 2259 | +1.2 [-0.6, +3.0] | -0.5 [-2.8, +1.5] | -0.7% [-2.9%, 1.4%] |
| N knight | 6983 | 2017 | +0.4 [-1.7, +2.2] | +0.7 [-1.5, +3.0] | -0.8% [-3.2%, 1.6%] |
| A archer | 6988 | 2012 | -5.9 [-8.0, -3.9] | -0.4 [-2.6, +1.9] | -3.6% [-5.8%, -1.4%] |
| G guard | 4714 | 4286 | +3.5 [+1.9, +5.2] | +0.8 [-1.1, +2.7] | 6.8% [4.8%, 8.8%] |
| M maester | 6926 | 2074 | +2.0 [+0.1, +3.9] | +0.2 [-2.1, +2.4] | 8.9% [6.2%, 11.4%] |
| S beast | 4593 | 4407 | -3.7 [-5.4, -2.1] | -1.8 [-3.8, +0.1] | -5.3% [-7.1%, -3.4%] |
| all games | 9000 | | draws 18.9% | White 50.7% | 104.7 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.17 [1.14, 1.19] | PASS 1.19 [1.16, 1.22] | PASS 2.21 | PASS 1.65 [1.61, 1.68] | PASS 92.4% [91.7%, 93.0%] | pass? |
| O ogre | PASS 0.54 [0.52, 0.56] | PASS 0.95 [0.92, 0.97] | PASS 1.87 | fail? 0.99 [0.96, 1.03] | PASS 88.4% [87.7%, 89.1%] | pass? |
| R rook | PASS 0.88 [0.87, 0.90] | PASS 0.83 [0.81, 0.85] | PASS 2.53 | PASS 1.44 [1.42, 1.47] | FAIL 84.0% [83.3%, 84.7%] | pass? |
| B bishop | PASS 0.82 [0.80, 0.83] | PASS 0.70 [0.69, 0.71] | PASS 1.57 | FAIL 0.94 [0.93, 0.95] | PASS 93.7% [93.3%, 94.1%] | pass? |
| N knight | PASS 0.71 [0.70, 0.72] | PASS 0.76 [0.75, 0.77] | PASS 1.09 | PASS 1.91 [1.90, 1.93] | PASS 98.6% [98.4%, 98.8%] | pass? |
| A archer | FAIL 2.08 [2.06, 2.10] | PASS 1.68 [1.66, 1.69] | PASS 1.16 | PASS 1.71 [1.69, 1.73] | PASS 97.4% [97.1%, 97.7%] | FAIL (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.57 [0.55, 0.60] | PASS 1.92 | FAIL 0.40 [0.38, 0.42] | FAIL 73.1% [71.9%, 74.1%] | fail? (draws) |
| M maester | PASS 0.58 [0.56, 0.59] | PASS 1.12 [1.11, 1.13] | PASS 1.60 | PASS 1.06 [1.05, 1.08] | PASS 94.0% [93.6%, 94.4%] | pass? |
| S beast | PASS 1.11 [1.08, 1.15] | PASS 1.07 [1.05, 1.09] | PASS 1.35 | PASS 1.25 [1.22, 1.28] | PASS 96.0% [95.5%, 96.4%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
