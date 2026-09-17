# Variant balance and measurable "fun" (2026-09-13)

Method input for `docs/SIM-PLAN.md` §3. Measured fairy values go in `fairy-values.md`, arrangement data in `chess960.md`, runner design in `sim-methodology.md`. Every formula
here is computable from one recorded game: per-ply eval, material, moves, captures, result.

## Sources

| # | Source | URL | What we take |
|---|---|---|---|
| S1 | Tomašev, Paquet, Hassabis, Kramnik, *Assessing Game Balance with AlphaZero* (2020) | https://arxiv.org/abs/2009.04374 | The whole protocol: expected score, Bayesian variant comparison, opening entropy, piece values from games |
| S2 | Browne, *Automatic Generation and Evaluation of Recombination Games*, PhD, QUT 2008 | https://eprints.qut.edu.au/17025/1/Cameron_Browne_Thesis.pdf | 57 criteria with exact equations; viability gate; **fitted weights and ablation against human rankings** |
| S3 | Browne & Maire, *Evolutionary Game Design*, IEEE TCIAIG 2(1), 2010 | https://eprints.qut.edu.au/31909/1/c31909.pdf | Same criteria condensed; the six standouts |
| S4 | Barthelemy, *Not all Chess960 positions are equally complex* (2025) | https://arxiv.org/html/2512.14319 | Static screen of all 960 arrangements; information-cost complexity; decision asymmetry |
| S5 | Van den Bergh, *Normalized Elo* + *The accounting identity* + *GSPRT approximation* | https://www.cantate.be/Fishtest/normalized_elo_practical.pdf https://www.cantate.be/Fishtest/accounting_identity.pdf | Normalized Elo, SPRT duration, why colour-reversed pairs cut variance and by exactly how much |
| S6 | Fishtest wiki, `stat_util.py`, *Running Fastchess*, Stockfish *Useful data* | https://github.com/official-stockfish/fishtest/wiki/Fishtest-mathematics https://github.com/official-stockfish/fishtest/blob/master/server/fishtest/stats/stat_util.py | Exact Elo and error-bar code; pentanomial practice; conventional adjudication values |
| S7 | cutechess-cli manual | https://github.com/cutechess/cutechess/blob/master/docs/cutechess-cli.6.txt | Adjudication semantics; `-maxmoves` silently scores a capped game as a draw |
| S8 | Beuke, *Chess engine draw rates* (CCRL, 2.1 M games) | https://beuke.org/chess-engine-draws/ | Draw rate as a function of engine Elo |
| S9 | Muller, piece-value forum corpus + Fairy-Max docs | https://www.chess.com/forum/view/chess960-chess-variants/variant-pieces-values https://home.hccnet.nl/h.g.muller/CVfairy.html | The asymmetric-material self-play method, its sample sizes, and the seed-value failure mode |
| S10 | Betza, *About the Values of Chess Pieces* and *Ideal and Practical Values* | https://www.chessvariants.com/d.betza/pieceval/ https://www.chessvariants.com/piececlopedia.dir/ideal-and-practical-values.html | Atom counting; ideal vs practical value; the five factors |
| S11 | Fairy-Stockfish `variants.ini` and `types.h` | https://github.com/fairy-stockfish/Fairy-Stockfish/blob/master/src/types.h https://github.com/fairy-stockfish/Fairy-Stockfish/issues/1036 | Published fairy value table; values are hand-set, and `variants.ini` values do not reach material |
| S12 | Lara-Cabrera et al., *Evolutionary Tabletop Game Design* (Risk, 2023) | https://arxiv.org/abs/2310.20008 | Distance-to-target fitness over 7 Browne criteria |
| S13 | Todd et al., *GAVEL* (NeurIPS 2024) | https://arxiv.org/abs/2407.09388 | Cheap random-playout pre-filter; **harmonic-mean aggregation** |
| S14 | Ludii evaluation metrics (source of truth) | https://github.com/Ludeme/Ludii/tree/master/Evaluation/src/metrics | Reference implementations of Browne's criteria and the naming to copy |
| S15 | Ely, Frankel & Kamenica, *Suspense and Surprise*, JPE 123(1), 2015 | https://www.journals.uchicago.edu/doi/abs/10.1086/677350 | Formal suspense and surprise from a belief trace |
| S16 | Collins & Humphreys, *Contest Outcome Uncertainty: A Meta-Analysis* (2022) | https://journals.sagepub.com/doi/abs/10.1177/15270025221091544 | 97 papers, >500 specifications: **the uncertainty-of-outcome hypothesis is not established** |
| S17 | Iida et al., game refinement theory | https://link.springer.com/chapter/10.1007/978-3-319-08189-2_22 | `GR = sqrt(B)/D`, the 0.07–0.08 band, and why it cannot discriminate for us |
| S18 | Karnin/Koren/Somekh Sequential Halving; Jamieson & Talwalkar | https://proceedings.mlr.press/v28/karnin13.html http://proceedings.mlr.press/v51/jamieson16.pdf | Budget split for ranking many arrangements |
| S19 | Binomial proportion confidence intervals | https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval | Wilson score interval |
| S20 | Stockfish books and discussion 5079 | https://github.com/official-stockfish/books/blob/master/README.md | Balanced vs unbalanced opening sets and what each measures |

## 1. How designers measure variant balance

**S1 is the closest match to our plan and we copy its skeleton.** DeepMind trained AlphaZero on nine atomic rule changes plus classical chess, then played 10 000 self-play
games at 1 s per move and 1 000 at 1 min per move per variant, forcing diversity by sampling the first 20 plies in proportion to MCTS visit counts. Four reported quantities,
and we should report the same four:

1. **Expected score for White** `e = pi_win + 0.5 * pi_draw`. Classical chess 54.1 % at end of training, 51.8 % at 1 s, 50.8 % at 1 min; all variants tend to 50 % with time.
2. **Decisiveness** by a Bayesian test, not raw counts: posterior `p(pi | G) = Dir(n_win+1, n_draw+1, n_lose+1)`, then estimate `p(pi_draw^A < pi_draw^B)` and `p(e^A >
   e^B)` from sampled pairs. No stopping rule needed, and it ranks many configurations at once.
3. **Opening diversity** as move-sequence entropy over the first T = 20 plies, `H(T) = E[-log p(s_1:T)]`, from 10^4 sampled sequences; `exp(H)` reads as a count of distinct
   20-ply games. Classical chess 28.58 nats (2.58e12) against a uniform-random baseline of 64.96 (1.63e28).
4. **Piece values from outcomes.** Fit `g_w(s) = tanh(w^T d)`, `d` = piece-count differences, minimising `E[(z - g_w(s))^2]` over sampled positions with result `z` in
   {-1, 0, 1}; normalise by the pawn weight. On classical chess it recovers 3.05 / 3.33 / 5.63 / 9.50 against the textbook 3 / 3 / 5 / 9 — the validation for new pieces.

**S4 is the closest match to our back-rank sweep.** All 960 Chess960 positions at Stockfish 17.1 depth 30: mean initial eval +0.297 +/- 0.136 pawns, 956 of 960 favour White,
best #279 (NRBKNRQB) +0.83, closest to level #535 (RNBKQNRB) -0.09, standard chess #518 +0.30. A static deep eval of every arrangement is a cheap screen before any games.

**Muller's asymmetric-material method is the practical recipe for piece values (S9).** From a normal opening position, replace one piece, play a few hundred self-play games,
then handicap the stronger side by a pawn and repeat until the result brackets 50 %. His numbers: ~100 games resolve a quarter of a pawn, and 800 games from 16 start positions
gave a 1.4 % standard error, about +/- 0.09 pawn. Keep the imbalance inside ~1.5 pawns so the score stays linear, randomise the first four plies, average over reversed
colours. **The failure mode he names is ours:** a seed value that inverts a plausible exchange — his example is an Archbishop seeded below a Rook — makes self-play blind,
because the piece forces a trade it believes is a gain; the fix is a second iteration seeded with the first pass's result. Our eval asserts Archer 430, Paladin 470, Guard 250,
Maester 330, Beast 350 (`src/ai/eval.ts`), so iterate to a fixed point. His warning: never believe piece values obtained by calculation.

**Calculation is one sanity check, not more (S10, S11).** Betza's atom rule: a one-step piece's *ideal* value is the number of distinct squares it moves to, and a compound
masks the weaknesses of its parts. Muller measures about +2.25 pawns of unexplained synergy in the Archbishop alone, so additivity fails for exactly the pieces we care about.
Fairy-Stockfish's published table (`types.h`, normalised to Rook 500) gives Archbishop 862, Chancellor 901, Queen 994 — hand-set rather than tuned, and `variants.ini`
overrides do not reach the main material term.

## 2. What "fun" means measurably

**S2 is the only work that validated game metrics against human preference, and its numbers must steer our design.** Browne measured 57 criteria by self-play and regressed
them on human rankings of 79 games:

| Criteria set | Correlation with human preference |
|---|---|
| All 57 | 0.4172 |
| Intrinsic 16 (rules only, no play) | 0.0941 |
| Quality 30 (from self-play) | 0.4264 |
| **Viability 11 (does the game work at all)** | **0.5932** |
| Best 17, selected by search on the same 79 games | 0.8208, 95 % CI [0.562, 0.933]; 0.65 on held-out games |

The cheap criteria beat the clever ones, and the 0.82 is fitted and evaluated on the same games. **Gates carry most of the signal; a weighted interest score is a
tie-breaker.** Do not fit fun weights on our own simulation output.

**Browne's fitted signs are the useful part, and two are counter-intuitive.** Best-17 weights, largest first: clarity-variance **-0.376**, killer moves **+0.359**, lead change
**-0.277**, drama (average) +0.217, uncertainty (late) +0.202, correction +0.162, decisiveness threshold +0.131, momentum +0.124, permanence +0.103, duration -0.091,
completion +0.079. Removing each in turn raises prediction error from a 13.28 % baseline: uncertainty (late) **48.8 %**, lead change **36.5 %**, permanence 28.1 %, completion
23.1 %, killer moves 23.1 %, duration 20.9 %, drama 17.1 %. S3 summarises it: players prefer stable games with uncertain outcomes that end within a reasonable number of moves,
in which strong moves are reasonably permanent. So **more lead changes are worse** — a churning evaluation reads as chaos, not tension. This contradicts the mid-range target
S12 used for Risk; we follow S2, which has the human data. On aggregation, S12 scores by distance to a target vector and S13 takes the harmonic mean so one catastrophic value
cannot be averaged away; we use gates plus a signed linear score, because Browne's fit was linear and his signs are what we borrow.

**Caveats to carry.** The uncertainty-of-outcome hypothesis is *not* established: S16 pools over 500 specifications across 97 sports-economics papers and finds no consensus,
leaning toward loss aversion instead. S17's `GR = sqrt(B)/D` sits in a claimed 0.07–0.08 band (chess 0.074, shogi 0.078) fitted to about six games, and `B` and `D` barely
move between our back ranks, so it cannot discriminate — sanity check only. With calibrated win probabilities, S15 offers a better-founded substitute for Browne's drawn-area
uncertainty: suspense at a ply is the variance of the next ply's belief, surprise the squared change between them.

## 3. Metric definitions

### 3.0 The lead signal

`search()` returns a centipawn score from the mover's point of view with `MATE = 100_000` (`src/ai/search.ts`).

- `v_t` = white-point-of-view eval at ply `t`: negate the recorded score when Black moved.
- `p_t = 1 / (1 + exp(-v_t / c))` = probability White wins; clamp to 1 or 0 when `abs(v_t) >= MATE_BOUND`. Fit the scale `c` once by logistic regression of the result on
  `v_t` over a pilot run; expect 300–400 cp.
- **Lead** `L_t = 2 p_t - 1` in [-1, 1]. `z = +1` if White won, else `-1`. `T` = plies. Skip the first `k` randomised opening plies in every sum, as S2 excludes its random
  opening moves.

Squashing before differencing keeps every metric bounded, stops one mate score dominating a game, and makes `p_t` a calibrated belief, which is what S15 needs.

### 3.1 Per-game metrics

| Metric | Formula | Range | Wanted |
|---|---|---|---|
| Uncertainty (late) | sample `abs(L)` at `n = 100` points `tau = k/100` of the game; `U = mean_tau(tau - abs(L(tau)))`, report `(U+1)/2` | 0..1 | **high** |
| Lead change | `count{t : sign(L_t) != sign(L_{t-1})} / (T - 1)` | 0..1 | **low** |
| Killer move | `max_t c_t * (L_t - L_{t-1})`, `c_t = +1` if White moved at ply `t` | 0..1 | high |
| Permanence | `1 - mean_t abs((L_t - L_{t-1}) - (L_{t-1} - L_{t-2}))` over triplets | 0..1 | high |
| Drama (average) | `mean over {t : z*L_t < 0} of sqrt(-z*L_t)`; the max variant replaces the mean with `max` | 0..1 | mid |
| Stability, surprise | `mean_t abs(L_t - L_{t-1})`; `mean_t (L_t - L_{t-1})^2` | 0..1 | mid |
| Decisiveness (Browne) | `th` = max over all games of the loser's peak lead; `1 - (T - T_th)/T`, `T_th` = first ply reaching `th` | 0..1 | high |
| Duration deviation | `abs(T_pref - T) / T_pref`, `T_pref` = half the ply cap | 0..1 | **low** |
| Branching factor | mean legal-move count per ply (free: `rootMoves.length`) | — | mid |
| Decision cost (S4) | `sum_t log2(1 + exp(-delta_t / delta_0))`, `delta_t = E_1 - E_2` in cp, `delta_0 = 10`; asymmetry `A = cost_black - cost_white` | bits | high; `A` near 0 |
| Fairy utilisation | per type: (moves by that type / total moves) / (its share of starting material) | 0..inf | ~1 |

Drama, killer move, permanence and stability are the zero-sum reductions of Browne's two-player equations: his `E_W`, `E_B` collapse to `p_t` and `1 - p_t`. Decisiveness
follows the intent stated in S2 (win quickly after reaching the threshold), not the literal typography of the scanned equation. **Two senses of "decisiveness" are in play:**
Browne's above, and `1 - draw rate` in S1 and the chess world, which we call the *decisive rate*. Clarity (variance) carried S2's second-largest weight but needs every legal
move evaluated at every ply, and decision cost needs the second-best root move: both want a MultiPV search `search()` does not expose. Add MultiPV = 2 behind a flag.

### 3.2 Per-configuration metrics

| Metric | Formula |
|---|---|
| White score, Elo | `e = pi_win + 0.5 * pi_draw` (S1); `elo = -400 * log10(1/e - 1)` (S6) |
| Decisive rate | `1 - pi_draw` |
| Completion, balance, advantage | `(wins_W + wins_B)/G`; `1 - abs(wins_W - wins_B)/(wins_W + wins_B)`; `abs(wins_1 - (wins_W + wins_B)/2) / ((wins_W + wins_B)/2)` (S2) |
| Timeouts | fraction of games hitting the ply cap, **counted separately from draws** (S2, S7) |
| Opening diversity | `H(20) = mean over games of -sum_{t<=20} log q(move_t)`, `q = softmax(root scores / tau)`, `tau = 100` cp; report `exp(H)` (S1 surrogate) |
| Piece values | `g_w(s) = tanh(w^T d)` fitted to the result, normalised by the pawn weight (S1) |
| **Excess decisiveness** | residual of `decisive rate` regressed on `abs(White score - 0.5)` across the pool — see §7 |

## 4. Statistics

- **Error bar** (S6): `elo95 = (elo(mu + 1.96*sd/sqrt(N)) - elo(mu - 1.96*sd/sqrt(N))) / 2`, `sd` the per-game score standard deviation. Near `mu = 0.5` this reduces to **`N
  ~= 463700 * (1 - d) / elo95^2`**, `d` = draw rate. A higher draw rate shrinks the error bar *and* the true difference, which is why normalized Elo exists (S5): `e_n =
  e_logistic / sqrt(1 - d) = 347.43 * (mu - 0.5) / sigma_pg`.

  | draw rate | +/- 5 Elo | +/- 10 Elo | +/- 25 Elo |
  |---|---|---|---|
  | 0.3 | 12 984 | 3 246 | 519 |
  | 0.5 | 9 274 | 2 319 | 371 |
  | 0.7 | 5 564 | 1 391 | 223 |

- **Wilson interval** (S19) for genuine proportions — draw rate, "piece never moved", "hit the cap": `p in [1/(1 + z^2/n)] * ( p_hat + z^2/(2n) +/- (z/(2n)) *
  sqrt(4*n*p_hat*(1 - p_hat) + z^2) )`. Do **not** use Wilson on the match score: a score with draws is trinomial, not binomial.
- **Pairs, always** (S5). Play every configuration twice from the same randomised opening with colours reversed and record pentanomial counts. The accounting identity is `V3
  - V5 = mean(b_i^2)`, `b_i` the bias of opening `i`. Our "opening" is a random back rank, so `b` is large and the unpaired error bar is badly wrong.
- **SPRT** (S5, S6) for a yes/no rule A/B: stop when the LLR leaves `[log(beta/(1-alpha)), log((1-beta)/alpha)]`, which is `+/- 2.944` at `alpha = beta = 0.05`; expected
  duration `T = 1046535 / (e_n1 - e_n0)^2`, so the Fishtest [0.0, 5.0] bounds cost about 41 900 games worst case.

## 5. Recommended protocol

1. **Screen statically.** Evaluate every back rank at fixed depth 12–14, both colours; drop `abs(eval) > 60` cp. One search each, as S4 did for all 960 Chess960 positions.
2. **Pre-filter cheaply** (S13). 100 random-policy playouts; reject if the first/second win-rate gap exceeds 0.5, or if under half the states offer more than one legal move.
3. **Fix the opening set once, and play every configuration as a colour-reversed pair.** Randomised openings are the first 4–6 plies sampled from `softmax(root scores/50cp)`;
   Muller uses an equivalent +/- 0.5 pawn of root noise (S9). Reuse the stored set — changing it invalidates every earlier number (S5, S20). Record pentanomial counts.
4. **Fixed nodes, not time**, and two budgets for anything we act on: White's advantage and the draw rate both drift with thinking time (S1: 51.8 % to 50.8 %), and a metric
   that flips sign between budgets is unresolved.
5. **Successive halving for the sweep** (S18). With `K` arrangements and budget `T` games, run `ceil(log2 K)` rounds; in round `r` each survivor gets
   `floor(T / (size(S_r) * ceil(log2 K)))` games; drop the worse half by fun score. `K = 512`, `T = 200 000` gives 9 rounds, 43 games each in round 1 and 11 111 in round 9.
6. **Games per measurement.** Balance: 500 buys about +/- 25 Elo, +/- 5 Elo needs ~10 000 (§4). Piece values: ~800 games per imbalance for +/- 0.09 pawn, ~100 for +/- 0.25
   pawn (S9), then a second iteration with the value the first produced.
7. **Adjudication** (S6, S7). The chess conventions are `-resign movecount=3 score=600` and `-draw movenumber=34 movecount=8 score=20`. Our eval is uncalibrated, so
   validate on a sub-run with adjudication off before trusting them. Captures and pawn moves reset the draw counter.

## 6. Pitfalls checklist

- **A capped game is not a draw.** cutechess and fastchess silently score `-maxmoves` timeouts as 1/2–1/2 (S7). Count them separately as Browne's `timeouts`; over 5 % is a
  smell, over 50 % is a kill switch (S2).
- **Repetition inflation.** A shallow search sees no progress and repeats; aggressive draw adjudication makes it worse, because +/- 20 cp is noise for a weak engine. Raise
  `movenumber` and `movecount` instead.
- **Draw rate is a property of the engine, not of the variant.** CCRL over 2.1 M games: about 22 % draws at Elo 2000, 45 % at 3000, 73 % at 3500 (S8). Every draw-rate number
  we publish must carry its node budget.
- **Self-play blind spots.** One engine on both sides shares its mistakes, and our eval already asserts the fairy values we want to measure (S9). Mitigate as S1 did: force
  opening diversity, report the conditions of play, compare across two strengths, iterate the values to a fixed point. No tablebases exist either, so endgames rest on that
  same eval — expect longer games and more false draws than chess testing practice assumes.
- **Degeneracy detectors to run every time:** a piece type whose move share is near zero (Wilson interval on "never moved", by type and by starting square); a White score
  above 0.95 with a tight interval at high depth; opening entropy an order of magnitude below the pool average, the signature of one dominant line (S1).

## 7. Recommended fun score

**First, the finding that reshapes it.** Across the 960 Chess960 positions at 50 000 games each, `corr(draw rate, White points) = -0.92` (`chess960.md` §3.2; draw rate mean
79.0 % sd 6.0, White points mean 0.540 sd 0.033), and S1 saw the same across its nine variants — the more decisive ones also gave White the larger first-move advantage.
**A decisive arrangement is usually just an arrangement that is good for White.** So a raw decisive rate must never be a reward term and must never be gated at an absolute
threshold; either choice silently selects unfair arrangements. Separate the two with a one-line regression over the pool: fit
`decisive rate ~ a + b * abs(White score - 0.5)` across the configurations in the round and score the **residual** — decisiveness beyond what White's edge explains. That
residual is what "this arrangement produces fights" means once the confound is removed.

**Stage 1 — gates.** Reject, do not score. The first four are Browne's viability set (S2), which alone correlated 0.59 with human preference; the last is ours.

| Gate | Threshold | Source |
|---|---|---|
| `abs(White score - 0.5) <= 0.03` | about +/- 21 Elo; the primary filter | S2 balance, S1, `chess960.md` |
| Draw rate not in the pool's worst decile | relative, never absolute — Chess960 averages 79 % at engine strength | `chess960.md`, S8 |
| Timeouts `<= 0.05` | ply cap 300 | S2 kill switch |
| Duration deviation `<= 0.5` | | S2, his strongest single viability filter |
| Every piece type's utilisation `>= 0.25` | no ornamental fairy piece | project requirement |

**Stage 2 — interest score.** `fun = sum_i w_i * m_i`, each `m_i` in [0, 1], weights summing to 1 in absolute value: Browne's *fitted signs and relative magnitudes* (S2
best-17) renormalised over the five criteria we compute cheaply, plus the two the literature cannot give us. One negative weight puts `fun` in [-0.16, 0.84] — rank on it,
never read it as a percentage.

| metric | weight | reasoning |
|---|---|---|
| Killer move | **+0.20** | largest positive weight in S2's fit; the decisive single move is what players remember |
| Lead change | **-0.16** | second-largest magnitude in S2's fit, and negative; churn reads as chaos, not tension |
| Uncertainty (late) | +0.13 | top of S2's ablation, 48.8 % error increase when removed |
| Drama (average) | +0.12 | S2 positive weight; the winner having been behind is worth something |
| Permanence | +0.07 | third in S2's ablation; gains should stick |
| Fairy utilisation, minimum over types | **+0.20** | not in any paper — our design requirement. A variant where the Beast never moves has failed whatever its balance |
| Excess decisiveness (residual, §3.2) | **+0.12** | decisiveness with the White-advantage confound regressed out; S1's headline metric, made safe |

Three rules that matter more than the numbers. **Do not refit these weights on our own simulation output** — S2's 0.82 is what fitting on the evaluation set looks like, and
held out it was 0.65; refit only against human rankings once Saar and testers have ranked arrangements, because that ranking is ground truth and the simulation is not.
**Do not chase decisive rate and opening diversity together**, which S1 found anti-correlated. **Report gate failures alongside the score**, and if one term collapses prefer
S13's harmonic mean, because the linear sum will average a catastrophe away.
