# Piece activity: pa-ans

Files: `sim/out/pa-ans.jsonl`. Pool not stamped in the records (today's: QORRBBNNAAGMMS).
9000 games counted. Left out: 0 with a king power or cards, 0 that did not replay.
Counted: ordinary piece moves and their captures only (no king power or card move). Random opening plies: not counted.
Pawns and kings are not reported and not in the averages. The capture average leaves out the guard (it captures nothing by rule). Intervals: 95%, 1000 resamples of the games.

## Moves, captures and use

| piece | games with it | pieces (start) | moves / piece | × average | captures / piece | × average | never moved | moved in the game | first move (median ply) |
|---|---|---|---|---|---|---|---|---|---|
| Q queen | 4582 | 9164 | 6.05 | 1.21 [1.18, 1.24] | 1.20 | 1.22 [1.19, 1.24] | 7.4% | 97.4% | 30.0 |
| O ogre | 4633 | 9266 | 4.69 | 0.94 [0.92, 0.96] | 0.55 | 0.56 [0.54, 0.58] | 11.4% | 95.9% | 23.0 |
| R rook | 7014 | 18348 | 4.16 | 0.83 [0.81, 0.85] | 0.90 | 0.92 [0.90, 0.93] | 16.2% | 94.5% | 39.0 |
| B bishop | 6741 | 16112 | 3.59 | 0.72 [0.71, 0.73] | 0.84 | 0.85 [0.83, 0.86] | 6.2% | 98.3% | 20.0 |
| N knight | 6983 | 18256 | 3.89 | 0.78 [0.77, 0.79] | 0.72 | 0.73 [0.72, 0.74] | 1.4% | 99.9% | 7.0 |
| A archer | 6988 | 18188 | 8.08 | 1.62 [1.60, 1.63] | 1.90 | 1.93 [1.90, 1.95] | 2.9% | 99.3% | 16.0 |
| G guard | 4714 | 9428 | 2.70 | 0.54 [0.52, 0.56] | 0.00 | cannot capture | 28.1% | 83.1% | 33.0 |
| M maester | 6926 | 18052 | 5.67 | 1.13 [1.12, 1.15] | 0.59 | 0.60 [0.59, 0.61] | 6.1% | 98.3% | 20.0 |
| S beast | 4593 | 9186 | 5.57 | 1.11 [1.10, 1.13] | 1.15 | 1.16 [1.13, 1.19] | 3.9% | 98.8% | 18.0 |

Per piece = over the pieces that started on the board. "Never moved": share of starting pieces that made no counted move. "Moved in the game": share of the games with the piece where at least one of them moved (either side). First move: the ply of each starting piece's first counted move, among those that moved.

## Activity by phase

Activity = (moves + captures) per piece on the board per turn of its side, in that phase.

| piece | opening (plies 1–30) | × average | middle (31–80) | × average | end (81+) | × average | whole game | best phase / own whole game |
|---|---|---|---|---|---|---|---|---|
| Q queen | 0.072 | 0.60 | 0.226 | 1.21 | 0.449 | 1.68 | 0.204 | 2.20 |
| O ogre | 0.078 | 0.65 | 0.138 | 0.74 | 0.255 | 0.95 | 0.140 | 1.82 |
| R rook | 0.037 | 0.31 | 0.174 | 0.93 | 0.399 | 1.49 | 0.154 | 2.58 |
| B bishop | 0.110 | 0.92 | 0.178 | 0.96 | 0.243 | 0.91 | 0.158 | 1.54 |
| N knight | 0.228 | 1.91 | 0.220 | 1.18 | 0.278 | 1.04 | 0.228 | 1.22 |
| A archer | 0.200 | 1.67 | 0.278 | 1.50 | 0.307 | 1.15 | 0.258 | 1.19 |
| G guard | 0.027 | 0.23 | 0.032 | 0.17 | 0.102 | 0.38 | 0.053 | 1.92 |
| M maester | 0.112 | 0.93 | 0.193 | 1.04 | 0.288 | 1.08 | 0.179 | 1.61 |
| S beast | 0.150 | 1.25 | 0.195 | 1.05 | 0.254 | 0.95 | 0.190 | 1.34 |
| average piece | 0.120 | 1.00 | 0.186 | 1.00 | 0.267 | 1.00 | | |

## With and without the piece in the army

Games whose army includes the piece minus games whose army does not.

| piece | games with | without | draws Δ (points) | White's score Δ (points) | length Δ |
|---|---|---|---|---|---|
| Q queen | 4582 | 4418 | -2.4 [-4.0, -0.7] | +0.9 [-0.9, +2.9] | -7.7% [-9.4%, -5.9%] |
| O ogre | 4633 | 4367 | -0.7 [-2.4, +0.9] | +1.0 [-0.9, +2.8] | 0.9% [-0.9%, 2.8%] |
| R rook | 7014 | 1986 | -0.0 [-2.0, +1.9] | +0.5 [-1.8, +2.8] | -1.4% [-3.5%, 0.7%] |
| B bishop | 6741 | 2259 | +0.5 [-1.3, +2.4] | -0.0 [-2.2, +2.2] | -0.8% [-2.8%, 1.3%] |
| N knight | 6983 | 2017 | +1.7 [-0.2, +3.6] | -1.2 [-3.6, +1.0] | -0.5% [-2.8%, 1.9%] |
| A archer | 6988 | 2012 | -6.3 [-8.2, -4.2] | -0.1 [-2.2, +2.1] | -5.4% [-7.5%, -3.2%] |
| G guard | 4714 | 4286 | +2.5 [+1.0, +4.2] | -0.1 [-1.7, +1.7] | 7.7% [5.6%, 9.6%] |
| M maester | 6926 | 2074 | +4.7 [+2.8, +6.6] | -2.0 [-4.3, +0.3] | 11.3% [8.9%, 14.0%] |
| S beast | 4593 | 4407 | -3.2 [-4.9, -1.7] | +0.2 [-1.7, +2.1] | -4.6% [-6.4%, -2.8%] |
| all games | 9000 | | draws 18.6% | White 50.9% | 103.2 plies |

## Criteria 2–6

PASS / FAIL: the whole 95% interval is on that side of the line; pass? / fail?: the point is, the interval crosses it.

| piece | 2 captures 0.5–1.5× | 3 moves ≥ 0.5× | 4 a phase ≥ own whole game | 4b a phase ≥ average piece | 5 moved ≥ 85% | 6 draws ±3, White ±2, length ±10% |
|---|---|---|---|---|---|---|
| Q queen | PASS 1.22 [1.19, 1.24] | PASS 1.21 [1.18, 1.24] | PASS 2.20 | PASS 1.68 [1.65, 1.71] | PASS 92.6% [92.0%, 93.2%] | pass? |
| O ogre | PASS 0.56 [0.54, 0.58] | PASS 0.94 [0.92, 0.96] | PASS 1.82 | FAIL 0.95 [0.92, 0.99] | PASS 88.6% [87.8%, 89.3%] | pass? |
| R rook | PASS 0.92 [0.90, 0.93] | PASS 0.83 [0.81, 0.85] | PASS 2.58 | PASS 1.49 [1.47, 1.52] | FAIL 83.8% [83.1%, 84.4%] | pass? |
| B bishop | PASS 0.85 [0.83, 0.86] | PASS 0.72 [0.71, 0.73] | PASS 1.54 | FAIL 0.96 [0.94, 0.97] | PASS 93.8% [93.4%, 94.2%] | pass? |
| N knight | PASS 0.73 [0.72, 0.74] | PASS 0.78 [0.77, 0.79] | PASS 1.22 | PASS 1.91 [1.89, 1.93] | PASS 98.6% [98.4%, 98.8%] | pass? |
| A archer | FAIL 1.93 [1.90, 1.95] | PASS 1.62 [1.60, 1.63] | PASS 1.19 | PASS 1.67 [1.65, 1.69] | PASS 97.1% [96.8%, 97.4%] | FAIL (draws) |
| G guard | n/a (cannot capture; flagged) | PASS 0.54 [0.52, 0.56] | PASS 1.92 | FAIL 0.38 [0.36, 0.40] | FAIL 71.9% [70.9%, 73.0%] | pass? |
| M maester | PASS 0.60 [0.59, 0.61] | PASS 1.13 [1.12, 1.15] | PASS 1.61 | PASS 1.08 [1.06, 1.10] | PASS 93.9% [93.5%, 94.3%] | fail? (draws, White, length) |
| S beast | PASS 1.16 [1.13, 1.19] | PASS 1.11 [1.10, 1.13] | PASS 1.34 | PASS 1.25 [1.23, 1.28] | PASS 96.1% [95.7%, 96.6%] | fail? (draws) |

Criterion 4 as written cannot fail: the whole-game activity is a weighted mean of the three phases, so one phase is always at or above it. 4b reads it against the average piece in each phase.
