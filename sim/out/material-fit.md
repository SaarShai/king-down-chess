# Material regression — implied piece values

`z = tanh(w·Δcounts + b)` fitted by least squares to the game result over **23220 games**
(18810 colour-reversed pairs / lone games, 13 distinct starting imbalances) from
`ab-chains.base`, `ab-chains.var`, `smoke`, `smoke-d4`, `sweep-d3.r1`, `sweep-d3.r2`, `sweep-p2.r1`, `sweep-p2.r2`, `values-d3-p2.A`, `values-d3-p2.G`, `values-d3-p2.L`, `values-d3-p2.M`, `values-d3-p2.S`, `values-d3-p2.pawn`, `values-d3-p3.A`, `values-d3-p3.L`, `values-d3-p3.pawn`, `values-d3.A`, `values-d3.G`, `values-d3.L`, `values-d3.M`, `values-d3.S`, `values-d3.pawn`, `values-d4-p2.A`, `values-d4-p2.G`, `values-d4-p2.S`, `values-d4-p2.pawn`. Δcounts is the *starting* material difference, white − black; z is +1, 0, −1.
Bootstrap: pairs resampled with replacement, 95% percentile interval.

| piece | implied value (pawns) | bootstrap 95% |
|---|---|---|
| A (archer) | 1.09 | 0.52 – 1.45 |
| L (paladin) | 3.21 | 2.89 – 3.52 |
| G (guard) | -0.26 | -1.21 – 0.37 |
| M (maester) | 3.33 | 2.96 – 3.74 |
| S (beast) | -0.22 | -1.06 – 0.39 |

White-to-move term +0.0626, pawn weight 0.1734 (tanh units).
Every value is quoted against a knight held at 3.20 pawns: each arm swaps one knight for one
fairy piece, so the fit identifies `w_X − w_N`, and no game we played ever started with a knight,
bishop, rook or queen imbalance, so those four are not separately identified by this corpus.
Games with two identical back ranks carry Δ = 0; they contribute only to the white-to-move term.
