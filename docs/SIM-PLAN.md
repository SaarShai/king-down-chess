# Simulation plan — AI vs AI Monte Carlo for balance and interest (v2, 2026-09-13)

Goal: play many AI-vs-AI games over many starting arrangements and rule settings, record every game, and rank the arrangements on two axes — balance and interest. The research round is complete, so v2 replaces the guesses of v1 with measured numbers. Sources are `docs/research/{sim-methodology,variant-balance,chess960,fairy-values,balancing-frameworks,ai-players}.md`, and every formula below names its file and its tag. Code lives in `src/sim/`.

What v2 corrects (sim-methodology.md §8; variant-balance.md §7):

| # | v1 error | v2 correction |
|---|---|---|
| 1 | Unpaired games | Colour-reversed pairs and pentanomial counts (§2) |
| 2 | A fixed "N games" per experiment | SPRT plus the length formula `1046535 / delta_nElo^2` (§3) |
| 3 | Adjudication left unstated | Resign 600/3, draw 20/8 after move 34, recorded as a flag (§2) |
| 4 | "depth 3" while `timeMs` defaults to 1000 ms | `timeMs: Infinity` and a search-state reset per game (§2) |
| 5 | No skill measurement | Depth 2 against depth 4, plus the move-match rate (§5) |
| 6 | 400 games for a piece value, about +/- 28 Elo | Muller fixed-point iteration, about 800 games per step (§6) |
| 7 | "keep the top and bottom 50" | Successive halving, eta = 2, common random numbers (§7) |
| 8 | A Wilson interval on the match score | Wilson on true rates only; a score with draws is trinomial (§3) |
| 9 | Decisiveness as a reward term | The residual after `abs(White score - 0.5)` is regressed out (§4) |
| 10 | One blended "fun score" | Two axes, reported apart and never merged (§4) |

## 1. Configuration space

| Axis | Values | Notes |
|---|---|---|
| Back rank | 7 letters from the pool `QLRRBBNNAAGGMMSS` plus K; bishops on opposite colours; mirrored | `sampleBackRank()` in `src/sim/spec.ts`. 16,236,000 legal ranks (ai-players.md §5) |
| Pool | Which fairy pieces the sampler may draw, and how many | `--pool`. It changes the sampler, not the engine |
| Asymmetric | White and Black get different back ranks | `spec.asymmetric`. This is the piece-value experiment (§6) |
| Rules | The toggle object below | `--rule name=value`, repeatable on any run |
| AI | Depth per side, `timeMs`, opening random plies (default 4) | Equal for balance runs; unequal for the skill trace (§5) |

The `Rules` object. Every field defaults to today's behaviour.

| Field | Default | Field | Default |
|---|---|---|---|
| `archerChecks` | true | `bishopsOppositeColours` | true |
| `beastChains` | true | `promotionSet` | `'anyNonKing'` (else `'standard'`, `'anyNonKingNoFairy'`) |
| `guardImmune` | true | `fiftyMove` | true |
| `guardCaptures` | **false** | `threefold` | true |
| `maesterLongSwap` | true | `insufficientMaterial` | true |
| `paladinKamikaze` | true | `paladinBlockedByEnemies` | true |

## 2. Protocol

- **Colour-reversed pairs.** Each configuration plays twice from the same opening seed with the colours swapped. Record the pentanomial counts `[LL, LD+DL, LW+DD+WL, DW+WD, WW]` (sim-methodology.md §2 [8]). Pairs take the opening bias out of the variance, so a test ends sooner. The accounting identity is `V3 - V5 = mean(b_i^2)`, with `b_i` the bias of opening `i` (variant-balance.md §4 [S5]). Our opening is a random back rank, so `b` is large and an unpaired error bar is wrong. `pentanomial()` in `src/sim/analyze.ts` builds the counts. `usePairs()` turns pairing on only when the two sides differ, because one engine on a mirrored rank at fixed depth replays the same game; `--pairs` forces it on, and the 4 random opening plies make the swapped game diverge.
- **Fixed depth.** Set `timeMs: Infinity`, so the wall clock cannot change a result (sim-methodology.md §7.1 [6]); `sideOptions()` does this. Call `resetSearch()` when each game starts. The transposition table, `history` and `killers` are module-level, so game *n* otherwise depends on games 1..*n*-1 in the same worker (sim-methodology.md §7.2).
- **Adjudication.** Resign at `abs(eval) >= 600` cp for 3 full moves on both sides. Draw at `abs(eval) <= 20` cp for 8 full moves after move 34 (sim-methodology.md §3 [7][3]; variant-balance.md §5 [S6][S7]). `ADJUDICATE` in `src/sim/spec.ts` holds the values. Engine draws stay primary. Record the adjudication flag on each game, so a run re-scores without it. Our eval is not calibrated, so validate the values first on a sub-run with `--noadjudicate`.
- **Ply cap 300.** A capped game is its own class, `plyCap`, and never a draw. cutechess and fastchess score a `-maxmoves` timeout as 1/2-1/2 silently (variant-balance.md §6 [S7]), which hides the failure. Over 5 % timeouts is a smell, and over 50 % is a kill switch (variant-balance.md §7 [S2]).

## 3. Statistics

| Quantity | Formula | Source |
|---|---|---|
| Elo from score | `elo = -400 * log10(1/mu - 1)` | sim-methodology.md §2 [10] |
| Error bar | `err95 = 694.9 * 1.95996 * sigma_pg / sqrt(games)`; 694.9 = `d(elo)/d(mu)` at `mu = 0.5` | sim-methodology.md §2 [11 (2.1)] |
| Pair variance | `sigma_pg = sqrt(2 * var)` for 5 pair counts, `sqrt(var)` for 3 game counts | sim-methodology.md §2 [11 §2][12] |
| Normalized Elo | `347.4356 * (mu - 0.5) / sigma_pg` | sim-methodology.md §2 [11 (3.2)] |
| GSPRT LLR (4.14) | `(games/2) * log((1 + (t-t0)^2) / (1 + (t-t1)^2))`, `t = (mu-0.5)/sigma_pg`, `t_i = nElo_i / 347.4356`; clamp to `+/- games*(t1-t0)/2` | sim-methodology.md §2 [11 (4.14)] |
| SPRT bounds | `+/- 2.944` at `alpha = beta = 0.05` | sim-methodology.md §2 [10][15] |
| Test length | `games = 1046535 / delta_nElo^2` | sim-methodology.md §2 [11 (3.4)]; variant-balance.md §4 [S5] |
| Wilson interval | `(1/(1 + z^2/n)) * (p + z^2/(2n) +/- (z/(2n)) * sqrt(4*n*p*(1-p) + z^2))` | variant-balance.md §4 [S19] |

Use Wilson for a true proportion only: draw rate, timeout rate, "this piece never moved". Do **not** use it on a match score, because a score with draws is trinomial, not binomial (variant-balance.md §4 [S19]). `group()` in `src/sim/analyze.ts` therefore reports the match score with a normal interval on the per-game score, and keeps `wilson()` for the rates.

Games needed, from `N ~= 463700 * (1 - d) / elo95^2` (variant-balance.md §4 [S6]):

| Draw rate `d` | +/- 5 Elo | +/- 10 Elo | +/- 25 Elo |
|---|---|---|---|
| 0.3 | 12 984 | 3 246 | 519 |
| 0.5 | 9 274 | 2 319 | 371 |
| 0.7 | 5 564 | 1 391 | 223 |

## 4. Metrics: two axes

Report balance and interest apart, and never merge them into one number, because the two objectives conflict (balancing-frameworks.md §7 [22][24]).

**Balance axis.**

| Metric | Formula | Source |
|---|---|---|
| White score | `e = pi_win + 0.5 * pi_draw`. Expect 0.53-0.55, sd near 0.03 (chess960.md §7.1) | variant-balance.md §3.2 [S1] |
| White Elo, err95 | §3 above | sim-methodology.md §2 [10][11] |
| Imbalance | `abs(e - 0.5)`. This is the primary rank key | variant-balance.md §7 [S2] |
| Draw rate | `pi_draw`, with a Wilson interval and its depth beside it | variant-balance.md §6 [S8] |
| Timeouts | Share of games at the ply cap, counted apart from draws | variant-balance.md §3.2 [S2][S7] |

**Interest axis.** The lead signal comes first (variant-balance.md §3.0). `v_t` is the white-point-of-view eval at ply `t`; `p_t = 1 / (1 + exp(-v_t / c))`; the lead is `L_t = 2*p_t - 1`. Fit `c` once by logistic regression of the result on `v_t`, and expect 300-400 cp. Skip the randomised opening plies in every sum. `z = +1` if White won, else `-1`. Formulas from variant-balance.md §3.1, weights from variant-balance.md §7 [S2].

| Metric | Formula | Weight |
|---|---|---|
| Killer move | `max_t c_t * (L_t - L_{t-1})`, with `c_t = +1` when White moved at ply `t` | **+0.20** |
| Fairy utilisation, minimum over types | per type, `(moves by the type / total moves) / (its share of starting material)`; take the minimum | **+0.20** |
| Lead change | `count{t : sign(L_t) != sign(L_{t-1})} / (T - 1)` | **-0.16** |
| Uncertainty (late) | sample `abs(L)` at 100 points `tau = k/100`; `U = mean_tau(tau - abs(L(tau)))`; report `(U+1)/2` | +0.13 |
| Excess decisiveness | the residual below | +0.12 |
| Drama (average) | `mean over {t : z*L_t < 0} of sqrt(-z*L_t)` | +0.12 |
| Permanence | `1 - mean_t abs((L_t - L_{t-1}) - (L_{t-1} - L_{t-2}))` over triplets | +0.07 |

The lead-change weight is negative: churn reads as chaos, not tension, and it carries the second-largest magnitude in Browne's fit. Uncertainty (late) is top of his ablation, because removing it raises the prediction error by 48.8 %. Then `fun = sum_i w_i * m_i` with each `m_i` in [0, 1], so `fun` lies in [-0.16, 0.84]. Rank on it, and never read it as a percentage. `INTEREST` in `src/sim/weights.ts` holds these weights; the v1 placeholder stays only to keep old reports readable.

**The decisiveness correction.** A raw decisive rate must never be a reward term and never a gate. Over 960 Chess960 arrangements at 50,000 games each, `corr(draw rate, White points) = -0.92` (chess960.md §3.2), so a decisive arrangement is usually an arrangement that is good for White. Fit `decisive rate ~ a + b * abs(White score - 0.5)` over the configurations of the round, and score the **residual** (variant-balance.md §7).

**Gates.** Reject, do not score.

| Gate | Threshold | Source |
|---|---|---|
| Imbalance | `abs(White score - 0.5) <= 0.03`, about +/- 21 Elo | variant-balance.md §7 [S2] |
| Draw rate | not in the pool's worst decile; relative, never absolute | chess960.md §3.2 |
| Timeouts | `<= 0.05` | variant-balance.md §7 [S2] |
| Duration deviation | `abs(T_pref - T) / T_pref <= 0.5`, with `T_pref` = half the ply cap | variant-balance.md §3.1 [S2] |
| Fairy utilisation | every piece type `>= 0.25` | project requirement |

The first four are Browne's viability set. That set alone correlates 0.5932 with human preference, while all 57 criteria give 0.4172 (variant-balance.md §2 [S2]). Gates carry the signal, and the score breaks ties.

**Do not refit these weights on our own simulation output.** Browne's 0.8208 is a fit measured on its own evaluation set, and held out it fell to 0.65 (variant-balance.md §2 [S2]). Refit only against human rankings, after Saar and the testers rank arrangements, because that ranking is ground truth and the simulation is not.

## 5. Restricted play and the skill trace

Play depth 2 against depth 4 on every surviving arrangement, 100 games each, with the colours swapped. Record the move-match rate between the two searches (sim-methodology.md §6 [29]; balancing-frameworks.md §4 [25]). An arrangement where the deeper side wins under 65 % does not reward skill, and no amount of drama saves it. A win rate near 0.5 cannot answer this question.

## 6. Piece values

Muller's fixed-point iteration (variant-balance.md §1 [S9]; fairy-values.md §2 [S2]):

1. Replace one knight with one fairy piece on one side of the classic arrangement. Play colour-reversed pairs, and randomise the first four plies.
2. About 100 games resolve a quarter of a pawn. About 800 games give about +/- 0.09 pawn.
3. Keep the imbalance under about 1.5 pawns, so that the score stays linear.
4. Re-seed the engine values in `src/ai/eval.ts` with the measured result, and repeat until the values stop moving.

Failure mode: a seed value that inverts a plausible exchange makes self-play blind, because the engine forces a trade that it believes is a gain. Muller's example is an Archbishop seeded below a Rook (variant-balance.md §1 [S9]).

Current seeds (`src/ai/eval.ts`): Archer 430, Paladin 470, Guard 250, Maester 330, Beast 350, against Knight 320, Bishop 330, Rook 500, Queen 900. Research priors (fairy-values.md §9): A 3.5, L 4.0, G 2.0, M 3.5, S 2.2 pawns. Each prior is a starting point, not an answer.

Cross-check over the whole corpus: fit `g_w(s) = tanh(w^T d)` to the result, with `d` the piece-count differences, then normalise by the pawn weight (variant-balance.md §3.2 [S1]). The same fit recovers 3.05 / 3.33 / 5.63 / 9.50 on classical chess. No castling costs the rook about 11 %, so price every fairy piece against that rook, not against the classical rook (chess960.md §7.8).

## 7. Budget allocation

Three stages, cheapest first (variant-balance.md §5; balancing-frameworks.md §4 [28]):

1. **Static depth screen** of every arrangement. One search per colour at fixed depth 12-14. Drop `abs(eval) > 60` cp. Barthelemy screened all 960 Chess960 positions this way (chess960.md §3.1).
2. **Random-playout pre-filter.** 100 random-policy playouts per survivor. Reject when the first/second win-rate gap exceeds 0.5, or when under half the states offer more than one legal move (variant-balance.md §5 [S13]).
3. **Successive halving**, eta = 2, with common random numbers: every arrangement in a round gets the same opening seeds (sim-methodology.md §6 [23][24]; variant-balance.md §5 [S18]). Paired comparison cuts the variance more than extra games do.

Budget for 500 arrangements and a total of 80,000 games:

| Round | Arrangements | Games each | Games |
|---|---|---|---|
| 1 | 500 | 40 | 20 000 |
| 2 | 250 | 80 | 20 000 |
| 3 | 125 | 160 | 20 000 |
| 4 | 62 | 320 | 19 840 |
| Total | | | 79 840 |

At a 79 % draw rate, 320 games give about +/- 17 Elo (§3), which ranks an arrangement but does not certify it. Take the top 8 to a confirmation run of about 4 000 games each at the second depth (§9), which buys about +/- 5 Elo.

## 8. MultiPV and decision cost

Clarity (variance) carried Browne's second-largest weight, and decision cost needs the second-best root move. Both need a MultiPV search, which `search()` does not expose (variant-balance.md §3.1). Add `MultiPV = 2` behind a flag, **off by default**, because it costs search time: Stockfish measures MultiPV 2 at -97 Elo (ai-players.md §5 [2]).

Decision cost is `sum_t log2(1 + exp(-delta_t / delta_0))`, with `delta_t = E_1 - E_2` in centipawns and `delta_0 = 10` cp; the asymmetry is `A = cost_black - cost_white` (variant-balance.md §3.1 [S4]). Chess960 reads 2.6-17.2 bits in total, and `A` from -4.5 to +4.2. Complexity is nearly independent of the evaluation (r = 0.15), so sharp is not the same as unfair (chess960.md §3.1).

## 9. Second-depth confirmation

Repeat every headline finding at a second depth, because balance depends on the agent (balancing-frameworks.md §4 [23]). White's advantage and the draw rate both drift with thinking time: AlphaZero read 51.8 % at 1 s per move and 50.8 % at 1 min, with draws rising from 88.2 % to 97.9 % (chess960.md §5). No Chess960 depth-10 top-three position stayed in the top three at depth 20 (chess960.md §3.1). **A metric that changes sign between the two budgets is unresolved.** Publish the node budget beside every draw rate.

## 10. Commands

```
npm run sim -- --id smoke --games 200 --depth 3 --sample 50
npm run sim -- --experiment values --games 200 --depth 3
npm run sim -- --experiment sweep --arrangements 500 --rounds 4 --games 40 --depth 3
npm run sim -- --experiment ab --rule beastChains=false --games 400 --sample 20 --depth 3
npm run sim:analyze -- --id <run-id>
```

| Command | What it does |
|---|---|
| `smoke` | 200 games over 50 sampled back ranks. It checks the recorder, and measures games/s and the sd of every metric. |
| `values` | Each fairy piece replaces a knight on one side of the classic arrangement. Colour-reversed pairs. It prints the implied values in pawns and the Muller fixed-point update (§6). |
| `sweep` | Successive halving, eta = 2, common random numbers, one report per round (§7). |
| `ab` | A paired A/B on the same arrangements and the same seeds. `--games` counts each population, so the line above plays 800 games. `--sample` sets the arrangements; without it the run uses one arrangement per 20 games. |
| `sim:analyze` | Reads `sim/out/<run-id>.jsonl` and writes `.report.md` and `.report.json`. |

Rule toggles reach any run as `--rule name=value`, and the flag repeats. A symmetric toggle changes both sides at once, so there is no match to play: the comparison is two populations, run A against run B, over the same arrangements and seeds, with a paired interval per metric. SPRT needs a head-to-head, which the piece-value experiment gives — one side holds the fairy piece, and the other holds the knight.

## 11. Out of scope

| Item | Reason |
|---|---|
| fastchess, cutechess | The managers validate moves under chess rules, so they cannot referee ours. Port the statistics instead (sim-methodology.md §5 [3][1]). |
| Fairy-Stockfish as a test bed | It reads a subset of Betza, and it has no rifle capture, no swap and no chained capture. Use it only as a standard-piece control (sim-methodology.md §5 [17][18]). |
| Ludii as software | CC BY-NC-ND 4.0 blocks shipping and modification, so port the metric definitions from the papers (balancing-frameworks.md §2 [1]). |
| Kings' powers, card effects | Documented but not enabled in the engine (RULES.md §4, §5), so the simulation cannot play them. |
| Opening books | The pool gives 16,236,000 legal back ranks against Chess960's 960, so no book theory can exist (ai-players.md §5 [23]). |
| Tablebases | None exist for these pieces. Endgames rest on the same eval, so expect more false draws (variant-balance.md §6 [S9]). |
| NNUE | A later stage. It changes the player, so it invalidates every earlier number (ai-players.md, Stage 2). |
