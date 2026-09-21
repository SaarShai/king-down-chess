# Composition mining: 56,000 arrangement games — which pieces are on the rank vs how the game goes (2026-09-17)

The two arrangement sweeps stored 56,000 games under one pool (`QLRRBBNNAAGMMSS`) and current
rules. This note mines those stored records for **composition** effects: does having a piece in
the back rank go with a more decisive, fairer or more event-rich game, and which mixes are the
richest? The headline: **the archer is the strongest positive presence correlate (+4.8 points of
decisive share) and the guard the strongest negative one (−4.3 points); the paladin shows no
decisiveness effect but +4.6 points of White score in both sweeps.** All of it is observational;
the controlled pool A/Bs agree on pace and disagree on most decisiveness sizes.

## Method

- **Files.** `sim/out/arr-a.r1..r5.jsonl` (8,000 games each, 40,000) and
  `sim/out/arr-b.r1..r4.jsonl` (4,000 games each, 16,000): **56,000 games**, all with
  `backRankWhite`, `result`, `plies`, `events`, and the run's rules. No replay was needed; every
  number below comes from the stored fields. Throwaway script `/tmp/mine-composition.mjs`.
- **Runs.** Depth 3, ply cap 300, four random opening plies, both sides mirror the row. Sweep A is
  stamped `rulesKey 37a776ee`, sweep B `60dd023b`; the only serialized difference is that A writes
  `ogreHop: false, ogreStep2: false` while B omits them (both default to false, `src/rules/rules.ts:394`),
  so the rules are the same.
- **Selection caveat (important).** Round 1 of each sweep is an unselected sample (A: 400 rows,
  B: 200 rows, 20 games each). Later rounds re-play only the survivors of a successive halving, so
  the corpus over-represents arrangements that passed the balance screen. Every
  per-piece number is therefore reported beside its **round-1-only** value (12,000 games), and the
  mix frequencies below are corpus frequencies, not pool-draw probabilities.
- **Mix.** The multiset of the seven non-king letters in `backRankWhite`, e.g. `BMMRGLRK` → `BGLMMRR`
  (sorted). The pool supports **1,017** distinct mixes; the corpus realizes **373** of them, and
  round 1 alone also realizes all 373.
- **Presence.** A letter is "present" when it is in the rank (both armies carry it). Marginals over
  56,000 games: A 74.0%, B 71.3%, G 47.8%, L 36.9%, M 74.1%, N 76.8%, Q 44.0%, R 75.3%, S 78.8%.
  A one-copy letter should appear in 7/15 = 46.7% of ranks; the corpus sits below that for L
  (36.9%) and Q (44.0%) and above it for G (47.8%), because the later rounds kept what survived.
  Round 1 alone gives L 47.8%, Q 47.7%, G 46.8%, A 75.3%, S 75.5%.
- **Definitions.** `result` is White's score (1 / 0.5 / 0); decisive = `result ≠ 0.5`. Events are
  the six counters summed over both colours: archer shots, beast chain moves (total list length),
  maester swaps, paladin sacrifices, promotions, checks. "Mechanics engaged" is how many of the six
  counters are non-zero in a game (0–6).
- **Intervals.** Unpaired two-proportion normal (Wald) 95% intervals on differences of shares, and
  Welch normal intervals on differences of means. Draws mirror decisiveness exactly (draw = 1 −
  decisive), so a decisive interval is also the draw interval with the sign flipped.

## Overall

56,000 games: **46,399 decisive (82.9%)**, 9,601 draws (17.1%), **White score 0.5272**, mean
**100.8 plies**. Per game: archer shots 3.45, beast chain moves 1.24, maester swaps 5.44, paladin
sacrifices 0.47, promotions 0.22, checks 3.67. Mechanics engaged 3.265 of 6.

## Per piece: presence vs absence

`with` = games whose rank holds the piece; `Δ` = with − without, 95% intervals in brackets.
Draw rate is the exact complement of the decisive column.

| piece | games with | decisive with | decisive without | Δ decisive | draws with / without | White with | White without | Δ White | plies with | plies without | Δ plies |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Q queen | 24,640 | 83.9% | 82.1% | **+1.8 [1.2, 2.4]** | 16.1 / 17.9% | 0.530 | 0.525 | +0.005 [−0.003, 0.012] | 95.3 | 105.1 | **−9.82 [−10.64, −9.00]** |
| L paladin | 20,660 | 83.0% | 82.8% | +0.3 [−0.4, +0.9] | 17.0 / 17.2% | 0.556 | 0.510 | **+0.046 [0.038, 0.054]** | 99.4 | 101.5 | −2.13 [−2.98, −1.29] |
| R rook | 42,180 | 82.9% | 82.7% | +0.2 [−0.5, +1.0] | 17.1 / 17.3% | 0.525 | 0.535 | −0.010 [−0.019, −0.001] | 101.3 | 99.1 | +2.23 [1.29, 3.17] |
| B bishop | 39,920 | 82.9% | 82.9% | −0.0 [−0.7, +0.7] | 17.1 / 17.1% | 0.527 | 0.527 | 0.000 [−0.008, 0.008] | 101.0 | 100.1 | +0.86 [−0.05, 1.76] |
| N knight | 43,020 | 82.4% | 84.2% | **−1.8 [−2.5, −1.1]** | 17.6 / 15.8% | 0.526 | 0.531 | −0.005 [−0.014, 0.004] | 101.5 | 98.1 | **+3.44 [2.42, 4.45]** |
| A archer | 41,440 | 84.1% | 79.3% | **+4.8 [4.1, 5.6]** | 15.9 / 20.7% | 0.525 | 0.533 | −0.008 [−0.017, 0.000] | 100.4 | 101.8 | −1.41 [−2.40, −0.41] |
| G guard | 26,740 | 80.6% | 84.9% | **−4.3 [−4.9, −3.7]** | 19.4 / 15.1% | 0.526 | 0.528 | −0.003 [−0.010, 0.005] | 104.2 | 97.6 | **+6.56 [5.73, 7.38]** |
| M maester | 41,520 | 82.1% | 85.0% | **−2.9 [−3.6, −2.2]** | 17.9 / 15.0% | 0.526 | 0.532 | −0.006 [−0.015, 0.003] | 102.1 | 96.8 | **+5.33 [4.39, 6.28]** |
| S beast | 44,100 | 83.5% | 80.5% | **+3.0 [2.2, 3.8]** | 16.5 / 19.5% | 0.524 | 0.538 | −0.013 [−0.023, −0.004] | 99.1 | 106.9 | **−7.80 [−8.76, −6.84]** |

Robustness — the same Δ decisive computed inside each independent sample. Sweep A and B differ in
sample and seed; round 1 is unselected. Every sign that is significant in the whole corpus keeps
its sign in all three columns.

| piece | Δ decisive, sweep A (40,000) | Δ decisive, sweep B (16,000) | Δ decisive, round 1 only (12,000) |
|---|---|---|---|
| Q | +1.8 [1.1, 2.6] | +1.9 [0.7, 3.0] | +2.1 |
| L | +0.4 [−0.4, 1.2] | −0.1 [−1.3, 1.1] | −0.3 |
| R | +0.2 [−0.7, 1.0] | +0.3 [−1.1, 1.7] | +0.3 |
| B | −0.2 [−1.0, 0.6] | +0.4 [−0.8, 1.7] | −0.9 |
| N | −1.2 [−2.1, −0.3] | −3.0 [−4.3, −1.8] | −1.6 |
| A | +4.4 [3.5, 5.3] | +6.0 [4.5, 7.5] | +5.3 |
| G | −4.4 [−5.2, −3.7] | −4.1 [−5.2, −2.9] | −2.6 |
| M | −3.2 [−4.0, −2.3] | −2.2 [−3.4, −0.9] | −3.7 |
| S | +2.8 [1.8, 3.7] | +3.5 [2.0, 4.9] | +3.5 |

Round-1 White diffs: L +0.033 [0.017, 0.049]; S −0.012; A −0.011; Q +0.012; G −0.010; M +0.002.

### Per-game event means by presence

`with / without`. Events are both colours summed.

| piece | archer shots | beast chain moves | maester swaps | paladin sacrifices | promotions | checks |
|---|---|---|---|---|---|---|
| Q | 2.85 / 3.92 | 1.07 / 1.38 | 5.29 / 5.56 | 0.43 / 0.50 | 0.19 / 0.24 | 3.90 / 3.48 |
| L | 2.83 / 3.81 | 1.06 / 1.35 | 4.36 / 6.07 | 1.27 / 0.00 | 0.24 / 0.20 | 3.60 / 3.70 |
| R | 3.36 / 3.72 | 1.19 / 1.41 | 5.05 / 6.64 | 0.44 / 0.57 | 0.22 / 0.20 | 3.82 / 3.21 |
| B | 3.34 / 3.72 | 1.21 / 1.34 | 5.21 / 6.02 | 0.41 / 0.61 | 0.22 / 0.20 | 3.71 / 3.57 |
| N | 3.39 / 3.62 | 1.21 / 1.35 | 5.11 / 6.54 | 0.43 / 0.62 | 0.23 / 0.19 | 3.77 / 3.33 |
| A | 4.66 / 0.00 | 1.08 / 1.71 | 5.00 / 6.71 | 0.47 / 0.48 | 0.20 / 0.27 | 3.74 / 3.45 |
| G | 3.05 / 3.81 | 1.26 / 1.23 | 5.19 / 5.67 | 0.43 / 0.51 | 0.23 / 0.20 | 3.60 / 3.73 |
| M | 3.44 / 3.45 | 1.23 / 1.29 | 7.34 / 0.00 | 0.40 / 0.68 | 0.22 / 0.20 | 3.63 / 3.76 |
| S | 3.17 / 4.49 | 1.58 / 0.00 | 5.33 / 5.86 | 0.46 / 0.50 | 0.20 / 0.27 | 3.43 / 4.54 |

Later the report uses two engagement splits: a game **with ≥1 beast chain** is 85.5% decisive
(n = 33,005) against 79.0% without (n = 22,995); within the 44,100 games that hold a beast, those
whose rank beast never chains are 77.5% decisive (n = 11,095, below the 80.5% of games with no
beast at all). A game **with ≥1 archer shot** is 84.5% decisive (n = 37,831) against 79.5%
without; within the 41,440 archer ranks the 3,609 games where the archer never fires are 80.4%
decisive and last only 53.5 plies.

## The draw confound, and conditioning on it

Presence is not independent across pieces: the 7 picks come from one pool, so a queen row has less
room for others. Observed conditional probabilities against the marginal in brackets:
P(G | A) = 41.0% (47.8%), P(G | Q) = 41.2% (47.8%), P(Q | A) = 41.2% (44.0%), P(A | Q) = 69.3%
(74.0%), P(S | A) = 75.2% (78.8%). So any queen or archer effect is partly a displacement effect.

Split each piece's Δ decisive by the queen's presence (both arms large: 24,640 queen rows, 31,360
no-queen rows). The archer, guard and maester signs hold in both strata; the knight's negative
effect appears only beside the queen, and the beast and paladin effects flip or vanish.

| piece | Δ decisive, queen in rank | Δ decisive, no queen |
|---|---|---|
| L | +1.7 [0.7, 2.6] | −0.7 [−1.5, 0.2] |
| R | −0.0 [−1.1, 1.0] | +0.6 [−0.4, 1.7] |
| B | +0.6 [−0.4, 1.6] | −0.3 [−1.3, 0.7] |
| N | −3.1 [−4.1, −2.1] | −0.0 [−1.1, 1.0] |
| A | +5.5 [4.4, 6.5] | +4.6 [3.6, 5.7] |
| G | −3.8 [−4.8, −2.9] | −4.4 [−5.3, −3.6] |
| M | −3.5 [−4.5, −2.4] | −2.5 [−3.5, −1.6] |
| S | +0.8 [−0.3, 2.0] | +4.9 [3.8, 6.0] |

The same split by the number of **distinct types** in the rank (4–7 distinct; 8 is impossible with
7 letters; no game has fewer than 4). The archer, guard, maester and knight signs hold in every
stratum; the queen is positive in every stratum but its dt=7 interval contains zero.

| piece | Δ decisive, dt=5 (n=17,880) | Δ decisive, dt=6 (n=28,540) | Δ decisive, dt=7 (n=8,420) |
|---|---|---|---|
| Q | +4.1 [2.9, 5.4] | +1.3 [0.4, 2.2] | +1.4 [−0.5, 3.3] |
| L | +0.5 [−0.7, 1.8] | −0.6 [−1.5, 0.3] | +2.5 [0.9, 4.1] |
| R | −0.2 [−1.5, 1.0] | +0.4 [−0.7, 1.4] | +0.6 [−1.7, 2.9] |
| B | +0.1 [−1.0, 1.2] | +0.4 [−0.6, 1.4] | −1.4 [−3.5, 0.6] |
| N | −2.2 [−3.4, −0.9] | −1.7 [−2.8, −0.6] | −2.1 [−3.9, −0.3] |
| A | +4.8 [3.4, 6.2] | +4.5 [3.5, 5.5] | +6.6 [4.3, 9.0] |
| G | −5.4 [−6.7, −4.1] | −4.3 [−5.2, −3.4] | −3.8 [−5.4, −2.3] |
| M | −2.9 [−4.0, −1.8] | −2.4 [−3.5, −1.4] | −4.3 [−6.2, −2.3] |
| S | +2.8 [1.5, 4.0] | +2.8 [1.7, 3.9] | +4.5 [1.0, 8.1] |

## Mix frequencies

The corpus holds 373 distinct mixes; **150 of them have ≥100 games and cover 84.1% of the
corpus**. The most-played mix in round 1 is `ABLMNRS` with 180 games; the corpus top-10 below is
dominated by rows that survived four halvings, so treat its frequencies as "what was measured
most", not "what the draw gives".

### Corpus top 10 by frequency

`div` = mechanics engaged of 6. Event means are per game, both colours.

| mix | games | decisive | draws | White | plies | div | shots | chains | swaps | sacs | promo | checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ABMMNNS | 1,060 | 82.6% | 17.4% | 0.509 | 102.2 | 3.70 | 5.02 | 1.71 | 9.21 | 0.00 | 0.22 | 3.44 |
| ABGMQRS | 980 | 85.6% | 14.4% | 0.516 | 99.0 | 3.52 | 4.40 | 1.25 | 5.84 | 0.00 | 0.16 | 3.70 |
| BGLMRSS | 920 | 80.2% | 19.8% | 0.529 | 104.6 | 3.70 | 0.00 | 2.38 | 7.18 | 1.34 | 0.27 | 2.28 |
| AMMNQRS | 840 | 83.0% | 17.0% | 0.536 | 101.1 | 3.54 | 4.27 | 1.28 | 9.65 | 0.00 | 0.18 | 3.89 |
| ABGMNRR | 800 | 79.2% | 20.7% | 0.516 | 116.3 | 3.15 | 4.41 | 0.00 | 5.17 | 0.00 | 0.32 | 5.11 |
| ABLNQRS | 780 | 90.0% | 10.0% | 0.523 | 84.6 | 3.24 | 2.64 | 0.97 | 0.00 | 1.19 | 0.15 | 3.87 |
| ABMNRSS | 760 | 87.9% | 12.1% | 0.512 | 98.0 | 3.66 | 3.97 | 2.37 | 5.45 | 0.00 | 0.17 | 3.01 |
| ABLMNRS | 700 | 85.1% | 14.9% | 0.550 | 99.3 | 4.38 | 3.75 | 1.23 | 4.33 | 1.30 | 0.27 | 3.49 |
| ABMNQRS | 700 | 86.4% | 13.6% | 0.508 | 93.6 | 3.39 | 3.70 | 1.17 | 4.56 | 0.00 | 0.16 | 3.36 |
| BGMNQRS | 700 | 73.3% | 26.7% | 0.496 | 100.1 | 2.71 | 0.00 | 1.54 | 7.30 | 0.00 | 0.25 | 3.34 |

Round-1 top 5 (unselected): ABLMNRS 180 (81.7% decisive, div 4.26), ABGMNRS 160 (82.5%, 3.64),
ABLMNQS 140 (85.0%, 4.19), AABGNRS 140 (87.9%, 2.34), ABLMMNS 100 (83.0%, 4.20).

### Corpus bottom 10 by frequency

Every one has exactly 20 games — one round-1 arrangement that did not survive. The corpus floor
is 20, not 1, because round 1 plays 20 games per row.

| mix | games | decisive | draws | White | plies | div | shots | chains | swaps | sacs | promo | checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BBLMNNR | 20 | 70.0% | 30.0% | 0.650 | 110.3 | 2.85 | 0.00 | 0.00 | 7.00 | 0.85 | 0.20 | 3.95 |
| AABGLNS | 20 | 70.0% | 30.0% | 0.400 | 115.2 | 3.35 | 6.30 | 1.25 | 0.00 | 1.60 | 0.10 | 3.55 |
| ABBMMRS | 20 | 75.0% | 25.0% | 0.625 | 105.0 | 3.70 | 6.25 | 1.40 | 9.10 | 0.00 | 0.10 | 5.00 |
| LMNQRRS | 20 | 90.0% | 10.0% | 0.350 | 91.1 | 3.70 | 0.00 | 1.20 | 7.00 | 1.20 | 0.20 | 5.45 |
| AABBGNR | 20 | 80.0% | 20.0% | 0.350 | 107.0 | 2.05 | 8.95 | 0.00 | 0.00 | 0.00 | 0.25 | 4.10 |
| ABGNQRS | 20 | 80.0% | 20.0% | 0.650 | 94.0 | 2.30 | 3.85 | 0.90 | 0.00 | 0.00 | 0.15 | 5.25 |
| ABGMMNQ | 20 | 65.0% | 35.0% | 0.425 | 114.7 | 2.75 | 4.40 | 0.00 | 11.40 | 0.00 | 0.30 | 4.10 |
| BBGMNNS | 20 | 75.0% | 25.0% | 0.725 | 122.6 | 2.75 | 0.00 | 2.20 | 6.80 | 0.00 | 0.30 | 3.40 |
| ABMMQRS | 20 | 85.0% | 15.0% | 0.675 | 96.3 | 3.55 | 4.30 | 1.25 | 11.45 | 0.00 | 0.15 | 4.60 |
| BBLMNRS | 20 | 90.0% | 10.0% | 0.600 | 100.7 | 3.60 | 0.00 | 1.15 | 6.50 | 1.15 | 0.45 | 3.00 |

### Extremes among mixes with ≥100 games

The extremes span 23.5 points, far beyond the mix-level intervals: at n = 100 the 95% half-width is
±9.7 points, at n = 140 ±4.3, at n = 300 ±3.7. Both extremes are also corpus (survivor) mixes, so
read them as hints, not ranks.

| | mix | games | decisive | draws | White | plies | div |
|---|---|---|---|---|---|---|---|
| best decisive | AALMQSS | 140 | 92.9% | 7.1% | 0.536 | 80.4 | 3.99 |
| | ABMNNRS | 100 | 92.0% | 8.0% | 0.460 | 107.8 | 3.72 |
| | BLQRRSS | 300 | 91.0% | 9.0% | 0.558 | 80.3 | 2.53 |
| worst decisive | GLMMQRS | 120 | 70.8% | 29.2% | 0.554 | 112.8 | 3.40 |
| | BGMMNQS | 160 | 69.4% | 30.6% | 0.547 | 99.4 | 2.72 |

In round 1 (n ≥ 30, so 95% half-widths of ±14 points or worse): best ABLNQRS 98.3% (60), worst
ABMMNRS 67.5% (40).
The two rounds do not agree on `ABMMNRS` (92.0% corpus, 67.5% round 1), which is exactly the
sample-size warning above.

## Event diversity

Mean mechanics engaged per game: **3.265 of 6**. Distribution: 0 → 0.8%, 1 → 4.8%, 2 → 17.1%,
3 → 34.8%, 4 → 31.0%, 5 → 10.4%, 6 → 1.2%.

Present vs absent means, and by distinct-type count:

| piece | div with | div without |
|---|---|---|
| Q | 3.146 | 3.359 |
| L | 3.619 | 3.059 |
| R | 3.255 | 3.478 |
| B | 3.216 | 3.479 |
| N | 3.298 | 3.399 |
| A | 3.484 | 2.849 |
| G | 3.107 | 3.410 |
| M | 3.455 | 2.768 |
| S | 3.391 | 3.070 |

| distinct types | games | decisive | div | White | plies |
|---|---|---|---|---|---|
| 4 | 1,160 | 81.4% | 2.634 | 0.530 | 101.8 |
| 5 | 17,880 | 83.5% | 3.075 | 0.519 | 100.9 |
| 6 | 28,540 | 82.2% | 3.314 | 0.531 | 101.7 |
| 7 | 8,420 | 83.9% | 3.590 | 0.533 | 97.1 |

The four pieces that add an interaction kit (L sacrifices, A shots, M swaps, S chains) raise
diversity; queen and guard lower it by displacing one of those. Two copies of A, S or M add
little over one (A 1→2: 3.484 → 3.220; S 1→2: 3.391 → 3.136; M 1→2: 3.455 → 3.403).

### Most and least event-rich mixes with ≥100 games

| | mix | games | div | decisive | White | plies | shots | chains | swaps | sacs | promo | checks |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| richest | ABGLMRS | 120 | 4.57 | 86.7% | 0.475 | 110.6 | 4.18 | 1.35 | 6.57 | 1.38 | 0.33 | 3.20 |
| | ALMMNRS | 160 | 4.51 | 81.3% | 0.575 | 106.5 | 3.64 | 1.22 | 8.83 | 1.40 | 0.25 | 3.33 |
| | ABGLMNS | 180 | 4.41 | 82.2% | 0.550 | 106.9 | 3.26 | 1.47 | 6.29 | 1.30 | 0.29 | 3.13 |
| | AGLMMNS | 660 | 4.39 | 78.3% | 0.552 | 108.0 | 4.25 | 1.25 | 9.63 | 1.42 | 0.25 | 3.01 |
| | ABLMNRS | 700 | 4.38 | 85.1% | 0.550 | 99.3 | 3.75 | 1.23 | 4.33 | 1.30 | 0.27 | 3.49 |
| poorest | BGNQRRS | 620 | 1.73 | 81.9% | 0.484 | 94.2 | 0.00 | 1.35 | 0.00 | 0.00 | 0.25 | 4.25 |
| | BGNNRSS | 620 | 1.81 | 81.9% | 0.498 | 107.1 | 0.00 | 2.97 | 0.00 | 0.00 | 0.25 | 2.47 |
| | BGNNRRS | 140 | 1.84 | 80.7% | 0.546 | 99.0 | 0.00 | 1.65 | 0.00 | 0.00 | 0.29 | 3.92 |
| | ABGNNQR | 200 | 1.86 | 78.5% | 0.552 | 95.5 | 3.31 | 0.00 | 0.00 | 0.00 | 0.17 | 4.89 |
| | BBGLNNR | 300 | 2.04 | 73.7% | 0.575 | 114.8 | 0.00 | 0.00 | 0.00 | 0.98 | 0.43 | 4.34 |

The rich mixes all carry A + L + M + S (or three of the four); the poor ones carry at most one of
them. `BGNNRRS` is the cleanest example: no archer, no maester, no paladin, so three of the six
counters can never fire.

## What this suggests

This is an observational census over a corpus whose later rounds are survivor-selected. The
round-1 and split-sweep columns above are the guard against reading selection as signal; the
controlled pool A/Bs (`sim-pool-arch`, `sim-pool-beast`, `sim-pool-guard`, `sim-queen`) are the
guard against reading presence as cause.

- **The archer is the strongest positive presence correlate, and the controlled test says the
  count is not the lever.** An archer rank is +4.8 points decisive [4.1, 5.6], +5.3 in round 1,
  +4.4 in sweep A and +6.0 in sweep B, and the sign survives both queen strata and all distinct-type
  strata. The controlled two-vs-one archer pool test is null on decisiveness (−0.75 ±2.48 points);
  its own rank-level table shows archer ranks at 0.82–0.83 decisive against 0.73–0.77 without. So
  the corpus says "archer games are the livelier games", the experiment says "one archer is
  enough". Both fit: keep the archer, do not read its count as a dial.
- **The beast effect is engagement, not presence.** Beast presence is +3.0 points decisive
  [2.2, 3.8], but within queen ranks only +0.8 [−0.3, 2.0]. Games with ≥1 chain are 85.5%
  decisive against 79.0% with none, and beast ranks whose beast never chains sit at 77.5%, below
  the 80.5% of ranks with no beast at all. The controlled two-vs-one beast test is null on
  decisiveness (−1.1 ±2.5 points) and the chain census reached the same reading ("chains are a
  marker, not a cause"). The second beast buys more chains and ~4 plies, not more wins.
- **The guard is the strongest negative correlate; the controlled test agrees in direction and is
  not resolved.** Guard presence is −4.3 points decisive [−4.9, −3.7] and +6.6 plies, the largest
  and longest-lived gap in the corpus. The controlled guard-vs-no-guard pool test points the same
  way on both (decisive −1.15 ±2.4 points, plies +3.12 [+0.32, +5.91]) but its decisive interval
  contains zero. Observational evidence is strong; controlled evidence is not sufficient to act.
- **The queen is a pace piece, and that part is confirmed.** Corpus queen presence is −9.82 plies
  [−10.64, −9.00], and the controlled test's per-protocol estimate is −9.84 plies [−14.60, −5.07]
  (~9% shorter). Decisiveness differs: corpus +1.8 [1.2, 2.4], controlled +0.1 [−2.28, +2.48]. The
  queen is neutral on draws by experiment; the corpus's small positive is most likely composition.
- **The paladin is the fairness signal worth a controlled test.** It has no decisiveness effect
  (+0.3 points) but **+4.6 points of White score [3.8, 5.4]**, and it repeats almost exactly in
  sweep A (+4.6 [3.7, 5.5]), sweep B (+4.7 [3.3, 6.1]) and round 1 (+3.3 [1.7, 4.9]). No paladin
  pool A/B exists yet. The corpus also shows the selection at work: L is in 47.8% of round-1 ranks
  but only 36.9% of the corpus, consistent with the balance gate dropping paladin rows. This is
  the one composition finding that reads as a fairness problem, so measure it before touching
  anything.
- **The maester and knight correlations are negative but untested.** Maester presence is −2.9
  points [−3.6, −2.2] and +5.3 plies; knight presence is −1.8 points [−2.5, −1.1], and the knight
  effect exists only beside the queen (−3.1 with her, −0.0 without). No pool A/B has isolated
  either piece. Their size is small next to archer/guard, no design has asked to touch the
  standard pairs, and the standing rule says do not change things on numbers alone; leave both
  until a design needs them.
- **Event richness is additive kit presence, not liveliness in the arrangement sense.** The
  richest mixes are exactly those holding A, L, M and S (`ABGLMRS` 4.57 of 6); the poorest hold at
  most one (`BGNQRRS` 1.73). Guard and queen lower diversity because they displace a kit piece.
  This repeats the sweep report's conclusion on a 56,000-game base: event-diversity differences
  track the draw, not the order.
- **What to do with the pool.** No rule change follows from any of this, and under the owner's
  standing rule ("all else equal or near equal, do not change or add rules") nothing here is a
  reason to add one. The composition reading is: keep both archers and both beasts (dropping
  either is null on results), see the guard as the pool's slow, draw-ish presence (controlled
  evidence still short of action), and test the paladin's +4.6-point White signal with a
  controlled pool A/B before any composition change. The queen stays on the pace argument alone.

Data: `sim/out/arr-a.r1..r5.jsonl`, `sim/out/arr-b.r1..r4.jsonl` (56,000 games). Script:
`/tmp/mine-composition.mjs` (throwaway, not committed). Related controlled pools:
`docs/research/sim-pool-arch-2026-09-17.md`, `docs/research/sim-pool-beast-2026-09-17.md`,
`docs/research/sim-pool-guard-2026-09-17.md`, `docs/research/sim-queen-2026-09-17.md`.
