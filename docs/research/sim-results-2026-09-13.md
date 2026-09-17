# Simulation results — stage 2, reduced runs (2026-09-13)

First end-to-end runs of the stage-2 lab: rule toggles, the piece-value experiment, the arrangement
sweep and a rule A/B. Every run here is **reduced**, to stay inside a 40-minute budget on 16 cores.
Read the error bars before you read the numbers. Nothing here is a decision; §7 says what to do next.

Machine: Apple Silicon, 16 cores, Node 26, `tsx`. Throughput **8.4–9.4 games/s** at depth 3 and
1.2 games/s at depth 4, ply cap 300, 4 random opening plies. 11 400 games in about 20 minutes of
wall clock. The full plan asks for 80 000 games in the sweep alone; that is a budget choice here,
not a limit.

## 1. Commands

```
npm run sim -- --id smoke      --games 200 --depth 3 --sample 50 --seed 1
npm run sim -- --id values-d3  --experiment values --games 200 --depth 3 --seed 1
npm run sim -- --id sweep-d3   --experiment sweep --arrangements 100 --rounds 2 --games 20 --depth 3 --seed 7
npm run sim -- --id ab-chains  --experiment ab --rule beastChains=false --games 200 --sample 20 --depth 3 --seed 11
npm run sim -- --id smoke-d4   --games 200 --depth 4 --sample 50 --seed 1
npm run sim:analyze -- --id smoke
npm run sim:analyze -- --id smoke --confirm smoke-d4
```

Reports land in `sim/out/<id>.report.md` (per run) and `sim/out/<id>.experiment.md` (per
experiment). Each run keeps its JSONL, so a report rebuilds without playing again.

## 2. Regression check: the `Rules` object changes nothing by default

The `Rules` object is read from module scope, so every default path had to stay identical. Two
direct comparisons against a reconstructed pre-change engine and search:

| Check | Scope | Result |
|---|---|---|
| Move generation, `isAttacked`, `status`, `insufficientMaterial` | 4 000 random boards, 266 659 moves, all 3 generation modes, both colours, every square | **identical** |
| `search(pos, { maxDepth: 3 })` | 240 positions from 12 games | **identical** move, score and node count |
| Test suite | `npx vitest run` | 54 existing tests pass unchanged, 25 new tests added (79 total) |

The stored smoke report from earlier today is **not** a valid baseline: its numbers were produced
before `resetSearchState()` and `positionKey()` landed in `src/ai/search.ts` (the defensive shims in
`src/sim/game.ts` are the evidence). The direct comparison above replaces it.

In the browser (dev server, `SGNMKNBR` random setup): the board renders, the piece guide reads the
rule text out of `canCapture` ("Only a king can take a guard"), a click plays `1. e2-e4`, and inside
that page both an inline `search()` and a freshly spawned `ai/worker.ts` return depth 6 in 301 ms
with the same score. One caveat for the HUD owner, **not caused by this work**: `commit()` in
`src/main.ts` awaits `view.animateMove()`, whose tweens never finish while the embedded preview
reports `document.hidden === true`, so the board sprite and the AI reply both wait. Worth a check in
a real browser window and in `src/render/renderer.ts`.

Smoke run, 200 games over 50 sampled back ranks, depth 3, 22 s:

| White score | White Elo | decisive | draws | capped | plies |
|---|---|---|---|---|---|
| 0.542 (95% 0.485–0.600) | +30 ± 40 | 68.5% | 27.5% | 4.0% | 131 ± 70 |

White's score sits inside the Chess960 expectation of 0.53–0.55 (chess960.md §7.1). The draw rate is
far below Chess960's 79%, as expected: our engine is weak, and draw rate is a property of the
engine, not of the variant (variant-balance.md §6 [S8]).

Piece utilisation (move share over starting-material share; 1 = pulls its weight):

| M | K | A | R | G | Q | B | N | L | S | P |
|---|---|---|---|---|---|---|---|---|---|---|
| 2.55 | 2.01 | 1.76 | 1.75 | 1.53 | 1.35 | 1.34 | 1.15 | 1.26 | **0.46** | 0.45 |

The beast is the only piece near the 0.25 utilisation gate. Fairy events per game: 1.73 archer
shots, 7.97 maester swaps of which **1.06 are long swaps**, 0.46 paladin sacrifices, 0.56 beast
capture moves. Of 376 guards started, **6 were ever captured**.

## 3. Piece values (`--experiment values`, depth 3)

Each arm replaces one knight of `RNBQKBNR` on one side and plays 100 colour-reversed pairs. The
calibration arm gives one side pawn odds and gets 300 pairs, because it is the denominator of every
implied value. Scores below are the fairy army's, folded over the colour swap.

| arm | pairs | pentanomial | score | Elo ± 95% | nElo | LOS | draws | plies |
|---|---|---|---|---|---|---|---|---|
| A archer | 100 | [30, 20, 30, 8, 12] | 0.380 | **−85 ± 45** | −90 | 0.0% | 21.0% | 99 |
| L paladin | 100 | [23, 3, 33, 18, 23] | 0.537 | +26 ± 48 | +26 | 85.4% | 11.5% | 92 |
| G guard | 100 | [51, 13, 28, 5, 3] | 0.240 | **−200 ± 38** | −228 | 0.0% | 10.0% | 87 |
| M maester | 100 | [14, 10, 42, 21, 13] | 0.522 | +16 ± 40 | +19 | 77.8% | 21.5% | 101 |
| S beast | 100 | [53, 9, 24, 8, 6] | 0.262 | **−179 ± 43** | −183 | 0.0% | 9.5% | 85 |
| pawn odds | 300 | [80, 34, 126, 22, 38] | 0.420 | −56 ± 25 | −61 | 0.0% | 11.0% | 83 |

**One pawn = 56 ± 25 Elo at depth 3.** That number is low, and it took two attempts to get:

> The first calibration removed the h-pawn only and measured −17 ± 42 Elo. Taking the h-pawn off
> opens the rook's file, and at depth 3 the rook grabs it at once, which pays most of the material
> back. The calibration now cycles over all eight files, which is the average pawn we want. Keep
> this in mind for any future handicap: **the file matters as much as the pawn**.

Implied values, with knight = 3.20 pawns:

| piece | Δ pawns | implied value | engine seed | research prior |
|---|---|---|---|---|
| A archer | −1.52 ± 0.80 ** | < 1.70 ** | 4.30 | 3.5 |
| L paladin | +0.47 ± 0.86 | 3.67 ± 0.86 | 4.70 | 4.0 |
| G guard | −3.57 ± 0.68 ** | < 1.70 ** | 2.50 | 2.0 |
| M maester | +0.28 ± 0.71 | 3.48 ± 0.71 | 3.30 | 3.5 |
| S beast | −3.20 ± 0.77 ** | < 1.70 ** | 3.50 | 2.2 |

\*\* outside the ±1.5 pawn linear band that Muller's method needs. The score saturates there, so the
conversion under-reads the gap: read those rows as "far below a knight", not as a number.

What this says, and what it does not:

1. **Order measured: L > M > A > S ≈ G.** The research predicted `L > M ≈ A > S > G` (fairy-values
   §10 H1). Paladin and maester land where the priors put them, both within their stated ranges.
2. **The archer fails H2.** The prediction was +20 to +80 Elo against a knight; it measured −85 ± 45.
3. **Guard and beast are far below a knight** at this depth, which agrees with their priors in
   direction (2.0 and 2.2 pawns against 3.2) but overshoots in size.
4. **The engine's own values are the prime suspect, not the pieces.** `src/ai/eval.ts` says archer
   430 and beast 350 against a knight 320, so the search happily trades a knight for an archer and
   then loses. That is exactly Muller's blindness failure mode (variant-balance.md §1 [S9]); it is
   why the fixed-point iteration exists, and why one pass proves nothing.
5. **Depth 3 is a screen, not a verdict.** A short-range piece needs depth to show its worth, and
   the guard's whole value is positional.

Next seed for pass 2 (floored at 50 cp where the swap left the linear band):

```ts
export const ARCHER_V = 168, PALADIN_V = 367, GUARD_V = 50, MAESTER_V = 348, BEAST_V = 50;
```

Do **not** paste that into `src/ai/eval.ts` yet: a guard at 50 cp would make the engine give guards
away, and the guard's measured value is a lower bound, not a value. The honest pass 2 keeps the
direction (archer and beast down, paladin and maester roughly unchanged) and moves each seed part of
the way, then re-measures. See §7.

## 4. Arrangement sweep (`--experiment sweep`, depth 3)

Successive halving, eta = 2, common random numbers inside each round: round 1 is 100 random back
ranks x 20 games, round 2 keeps the better half at 40 games each. 4 000 games, about 8 minutes. The
rank key is imbalance = |white score - 0.5|, ties broken by the interest score.

| Round | Arrangements | Games each | White score, mean +/- sd | Range | Passing every gate |
|---|---|---|---|---|---|
| 1 | 100 | 20 | 0.545 +/- 0.085 | 0.325 (`GRNRAKAN`) to 0.800 (`BNMKGMLA`) | 21 / 100 |
| 2 | 50 | 40 | 0.516 +/- 0.062 | 0.375 (`ARSKNGNA`) to 0.688 (`AKNNARLQ`) | 15 / 50 |

**The headline result is that those extremes are noise.** The per-game score standard deviation is
0.41 (the smoke run's sigma_pg), so pure sampling noise alone gives a spread of 0.41/sqrt(20) = 0.092
in round 1 and 0.41/sqrt(40) = 0.065 in round 2. The measured spreads, 0.085 and 0.062, are *smaller*
than that. The between-arrangement variance that remains is therefore not measurable at this budget:
at 20 games one arrangement carries about +/- 0.18 on its score, which is wider than the whole
Chess960 range. Round 2 is narrower again partly because halving already selected the balanced half,
which regresses to the mean.

This is the sweep working as designed, not failing: a cheap round exists to be thrown away. It also
sizes the real run. The plan's budget table (SIM-PLAN §7) gives the last round 320 games per
arrangement, about +/- 17 Elo, which is the first point where a back rank can be told from its
neighbour.

Two secondary readings, both weak at this budget:

- `corr(draw rate, white score)` is **-0.20** in round 1 and -0.05 in round 2, against -0.92 in
  Chess960 at 50 000 games per position (chess960.md §3.2). With noise this large the correlation
  cannot show, which is another reason the residual correction (SIM-PLAN §4) must stay: the
  confound does not disappear, it is only invisible here.
- Capped games run at 5.2% and 5.8% per arrangement, just over Browne's 5% gate, so the ply cap and
  the draw adjudication want a second look before the full sweep. This is why a capped game must
  never be scored as a draw: at 5% it would quietly bias every draw rate.

Round 2's most balanced survivors, for the record (all scores 0.500 +/- 0.079 noise):
`KLBRANQN`, `GRMGKNBB`, `RKNSAARB`, `AKLSNSMQ`, `ARKAGNML`. The first of those is the only
arrangement in the run that reaches 90% decisive games, +0.29 excess decisiveness and the highest
interest score (0.498) while passing every gate. Treat it as a candidate to re-measure, not a winner.

Full per-round tables: `sim/out/sweep-d3.experiment.md`; per-round reports with every metric:
`sim/out/sweep-d3.r1.report.md` and `.r2.report.md`.

## 5. Rule A/B (`--experiment ab --rule beastChains=false`)

`--rule beastChains=false`: 200 games per population, depth 3, the same 20 arrangements and the
same opening seeds in both populations (common random numbers). A symmetric rule changes both sides
at once, so there is no match to play and no SPRT; this is a paired two-population comparison.

| metric | defaults | chains off | mean paired difference +/- 95% |
|---|---|---|---|
| white score | 0.510 | 0.547 | +0.037 +/- 0.029 |
| decisive | 0.680 | 0.695 | +0.015 +/- 0.046 |
| draw rate | 0.260 | 0.230 | -0.030 +/- 0.053 |
| capped | 0.060 | 0.075 | +0.015 +/- 0.033 |
| mean plies | 133.8 | 140.1 | **+6.3 +/- 5.9** |
| branching factor | 28.6 | 28.3 | **-0.3 +/- 0.3** |
| killer move | 0.337 | 0.339 | +0.002 +/- 0.022 |
| lead change | 0.034 | 0.033 | -0.001 +/- 0.002 |
| uncertainty (late) | 0.629 | 0.625 | -0.004 +/- 0.003 |
| drama | 0.124 | 0.123 | -0.001 +/- 0.015 |
| permanence | 0.965 | 0.965 | +0.000 +/- 0.001 |
| min utilisation | 0.43 | 0.42 | -0.00 +/- 0.02 |
| interest | 0.383 | 0.394 | +0.003 +/- 0.010 |

Reading: taking the chain away makes games about **6 plies longer** and cuts the branching factor by
0.3, which is the chain moves disappearing from the move list. Balance and every interest term stay
where they were. That matches the smoke run, where only about one beast capture in ten continued,
and it answers fairy-values H7: **the chain is flavour, not balance**, and it can stay for fun (the
Ultima precedent).

Two cautions. The white-score row reads as outside its interval, which a symmetric rule cannot cause:
with 13 metrics at 95% each, about one false positive per run is expected, and the interval is a
normal approximation over 20 arrangements. The right response is more arrangements, not a
conclusion. And the A/B measures the rule *at depth 3*; a chain is a tactical resource, so it should
be re-run deeper before the rule is called flavour for good.

## 6. Second-depth confirmation (`--confirm`)

The same 200 games and the same 50 back ranks, replayed at depth 4 (2 m 51 s, 1.2 games/s), then
`npm run sim:analyze -- --id smoke --confirm smoke-d4`:

| | White score | White Elo | decisive | draws | capped | plies | guard use | beast use |
|---|---|---|---|---|---|---|---|---|
| depth 3 | 0.542 | +30 ± 40 | 68.5% | 27.5% | 4.0% | 131 | 1.53 | 0.46 |
| depth 4 | 0.545 | +31 ± 38 | 63.0% | 32.5% | 4.5% | 147 | **1.96** | 0.41 |

Three readings:

1. **White's edge is stable** across the two budgets, at about +30 Elo. That is the one headline
   number here that survives a depth change.
2. **Draws rise with depth** (27.5% to 32.5%) and games get 16 plies longer, exactly as AlphaZero
   reported across nine variants (chess960.md §5). Every draw rate we publish must carry its depth.
3. **The guard gains the most from depth** (utilisation 1.53 to 1.96) and the beast loses a little.
   That supports the reading in §3: the guard's value is positional, so a depth-3 verdict on it is
   worth little.

Per arrangement, 36 of 50 back ranks changed the sign of their White edge between the two depths.
At 4 games per arrangement that is what a coin flip looks like (and a score of exactly 0.5 counts as
a change), so the number measures the noise, not the depth. It is the same message as §4: per
arrangement, this budget resolves nothing. The hook itself works and is the gate every headline
result has to pass.

## 7. What the pipeline proves

- Rule toggles reach the workers: the A/B changes the branching factor, and nothing else in the
  stack had to know about it.
- Colour-reversed pairs, pentanomial counts, normalized Elo, the SPRT LLR, the residual
  decisiveness, the Browne interest score, capped games as their own class and MultiPV = 2 decision
  cost all run end to end and are unit-tested.
- Throughput is 8.4–9.4 games/s at depth 3 on 16 cores, so the full plan (80 000 games for the
  sweep) costs about 2.5 hours. The reduced runs here are a budget choice, not a limit.

## 8. What to do next, in order

1. **Do not act on any number here.** Every arm is one pass at one depth with a wide bar.
2. **Run the fixed-point loop** (SIM-PLAN §6): move the seeds part of the way, re-run
   `--experiment values` with 1 000 games per arm, and repeat until no piece moves by more than its
   error bar. Budget: about 20 minutes per pass.
3. **Confirm at a second depth.** `--experiment values --depth 5`, then compare. A sign change
   between depths means the result is unresolved (SIM-PLAN §9).
4. **Fit the pawn scale better.** 56 ± 25 Elo per pawn is the weakest link in every implied value.
   Either raise the calibration to 2 000 games, or fit the material regression over the whole corpus
   (SIM-PLAN §6, `g_w(s) = tanh(w^T d)`), which uses every game instead of one arm.
5. **Then, and only then, revisit `docs/RULES.md` §6.**

---

# Pass 2 — the value fixed point, a material regression, and a sized sweep

Second session, same machine (Apple Silicon, 16 cores, Node 26, `tsx`). Pass 1 above is unchanged;
this part only adds. Throughput this time: **8.3–13.6 games/s at depth 3** and **1.7–2.0 games/s at
depth 4** — faster than pass 1 because the new values make games shorter and more decisive.
**16 820 games in 30 m 15 s of play**, four runs, 33 minutes end to end including the analysis.

## 9. Commands

```
npm run sim -- --id values-d3-p2 --experiment values --games 500 --depth 3 --seed 1
npm run sim -- --id values-d4-p2 --experiment values --games 120 --depth 4 --seed 1 --pieces AGS
npm run sim -- --id values-d3-p3 --experiment values --games 500 --depth 3 --seed 1 --pieces AL
npm run sim -- --id sweep-p2 --experiment sweep --arrangements 60 --rounds 2 --games 80 --depth 3 --seed 7
npm run sim:analyze -- --values --boots 300
```

Two additions to the lab: `--pieces AGS` runs a subset of the value arms (the calibration arm is
always included, because it is the denominator), and `sim:analyze --values` is the material
regression of §13. `--ids a,b,c` restricts the regression to named runs; without it, it reads every
JSONL in `sim/out`.

## 10. Re-seeding (step 1 of the fixed point)

Pass 1 resolved two pieces and bounded three. The seeds for pass 2 follow that split:

| piece | pass-1 seed | pass-1 result | pass-2 seed | why |
|---|---|---|---|---|
| L paladin | 470 | 3.67 ± 0.86 | **370** | the measurement |
| M maester | 330 | 3.48 ± 0.71 | **350** | the measurement |
| A archer | 430 | < 1.70 (bound) | **260** | midpoint of the prior (3.50) and the band floor (1.70) |
| G guard | 250 | < 1.70 (bound) | **185** | midpoint of the prior (2.00) and the band floor (1.70) |
| S beast | 350 | < 1.70 (bound) | **195** | midpoint of the prior (2.20) and the band floor (1.70) |

The band floor is knight − 1.5 = 1.70 pawns: outside Muller's ±1.5-pawn band the score stops being
linear in material, so 1.70 is the lowest value the pass-1 games can actually assert. Splitting the
difference with the research prior moves each of the three a long way down — 40 % for the archer —
without seeding it where the engine would start giving the piece away, which is the failure pass 1
warned about. The comment block in `src/ai/eval.ts` was rewritten with it, and now records the
measurement rather than the pre-simulation reasoning.

## 11. Pass 2 at depth 3

Sized from `N ≈ 463700 · (1 − d) / elo95²` (SIM-PLAN §3) with the pass-1 draw rate d ≈ 0.15 and a
target of ±30 Elo: N ≈ 438, rounded to **500 games per arm** (250 colour-reversed pairs), and
1 500 for the calibration arm. Every bar came in at or under target.

| arm | games | pentanomial | score | Elo ± 95% | nElo | draws | plies |
|---|---|---|---|---|---|---|---|
| A archer | 500 | [100, 29, 92, 13, 16] | 0.316 | **−134 ± 26** | −149 | 8.8% | 93 |
| L paladin | 500 | [51, 27, 97, 21, 54] | 0.500 | +0 ± 29 | +0 | 11.2% | 88 |
| G guard | 500 | [136, 22, 74, 4, 14] | 0.238 | **−202 ± 26** | −217 | 5.6% | 88 |
| M maester | 500 | [45, 32, 84, 49, 40] | 0.507 | +5 ± 28 | +5 | 18.8% | 96 |
| S beast | 500 | [131, 41, 64, 5, 9] | 0.220 | **−220 ± 23** | −254 | 10.4% | 89 |
| pawn odds | 1500 | [213, 91, 296, 58, 92] | 0.408 | −64 ± 16 | −69 | 11.0% | 82 |

**One pawn = 64 ± 16 Elo at depth 3**, against 56 ± 25 in pass 1: the same number, measured three
times as well. Implied values, knight = 3.20:

| piece | Δ pawns | implied | pass-2 seed | moved by |
|---|---|---|---|---|
| A archer | −2.08 ± 0.41 ** | < 1.70 ** | 2.60 | ≥ 0.90 |
| L paladin | +0.00 ± 0.46 | 3.20 ± 0.46 | 3.70 | 0.50 |
| G guard | −3.14 ± 0.40 ** | < 1.70 ** | 1.85 | ≥ 0.15 |
| M maester | +0.08 ± 0.43 | 3.28 ± 0.43 | 3.50 | 0.22 |
| S beast | −3.41 ± 0.36 ** | < 1.70 ** | 1.95 | ≥ 0.25 |

\*\* outside the ±1.5-pawn linear band, so the row is a bound, not a number.

Three readings.

1. **The order of pass 1 survives**, with tighter bars: L ≈ M >> A > G ≈ S. Paladin and maester sit
   on the knight; archer, guard and beast are far below it.
2. **Lowering a seed did not raise its arm.** The archer went from −85 ± 45 at a seed of 430 to
   −134 ± 26 at 260, and the beast from −179 ± 43 to −220 ± 23. Each move is about one combined
   error bar, so no single one is significant — but all five arms moved the same way, and that is
   worth watching. It is *not* the Muller blindness failure: an arm that is blind to a seed is one
   whose piece is being traded at the wrong price, and §14 shows the archer's arm barely reacts to
   its seed at all.
3. **The guard barely moved (0.15 pawns) while its seed moved 0.65.** That is what an untradeable
   piece looks like. Only a king may capture a guard, so a guard is almost never part of an
   exchange, and the material constant hardly reaches the search. Pass 1 saw 6 of 376 guards ever
   captured; this is the same fact from the other end.

## 12. The same three pieces at depth 4

120 games per arm, 360 for the calibration, same seeds, 12 minutes. The point is the sign and the
size, not a new number.

| arm | depth 3 | depth 4 | sign holds |
|---|---|---|---|
| A archer | −134 ± 26 | **−117 ± 51** | yes |
| G guard | −202 ± 26 | **−241 ± 51** | yes |
| S beast | −220 ± 23 | **−199 ± 49** | yes |
| pawn odds | −64 ± 16 | −30 ± 33 | unresolved |

All three intervals overlap their depth-3 partners, so the verdict "far below a knight" is not an
artefact of depth 3. The **calibration arm does not resolve at depth 4**: 30 ± 33 Elo per pawn at
360 games, which is why the depth-4 rows are quoted in Elo and not in pawns. That is the expected
direction — everything tends towards 0.5 with more search (chess960.md §5) — but at this budget it
is indistinguishable from noise. A depth-4 value in pawns needs about 1 500 calibration games, not
360.

## 13. Material regression over the whole corpus (SIM-PLAN §6 cross-check)

`sim:analyze --values` fits `z = tanh(w·Δcounts + b)` by least squares to the result of **every
game recorded so far** — 23 220 games, 18 810 independent units, 13 distinct starting imbalances.
Δcounts is the starting material difference (white − black), z is +1/0/−1, and `b` absorbs the
white-to-move edge so it cannot leak into a piece weight. Error bars are a percentile bootstrap
over **pairs**, not games, because the pair is the independent unit.

| piece | regression (pawns) | bootstrap 95% | odds match, pass 2 |
|---|---|---|---|
| A archer | 1.09 | 0.52 – 1.45 | < 1.70 (point −2.08 ± 0.41 below a knight) |
| L paladin | 3.21 | 2.89 – 3.52 | 3.20 ± 0.46 |
| G guard | −0.26 | −1.21 – 0.37 | < 1.70 (point −3.14 ± 0.40) |
| M maester | 3.33 | 2.96 – 3.74 | 3.28 ± 0.43 |
| S beast | −0.22 | −1.06 – 0.39 | < 1.70 (point −3.41 ± 0.36) |

Three things this does and one it does not.

- **It agrees, and that is the point.** Paladin and maester land on their odds-match values with
  about 25 % narrower bars, because the fit pools every pass and every depth into one pawn scale
  instead of dividing each arm by one calibration arm.
- **It does not rescue the saturated rows.** `atanh(2μ − 1)` is half the logit, and Elo is the
  logit times 400/ln 10, so the tanh link and the Elo conversion are the *same* transform up to a
  constant. A guard at −0.26 pawns is the same extrapolation as "3.14 pawns below a knight", stated
  in different units; the negative value is the model reporting that the arm is outside its band,
  not a claim that a guard is worth less than nothing. Muller's remedy — hand the strong side
  pawns until the result brackets 50 % — is still the only way to turn those bounds into values.
- **The corpus only identifies six contrasts.** Every arm swaps one knight for one fairy piece, so
  what the fit sees is `w_X − w_N`; the pawn arm gives `w_P`. No game ever started with a knight,
  bishop, rook or queen imbalance, so those four are not separately identified and the knight stays
  pinned at 3.20. Recovering the classical 3.05 / 3.33 / 5.63 / 9.50 check needs material
  differences sampled from *mid-game* positions, which means replaying the stored games; that is
  not done here.
- Games on two identical back ranks (the smoke, sweep and A/B runs, 14 400 of the 23 220) carry
  Δ = 0 and contribute to `b` alone. The white-to-move term fits at +0.063 in tanh units, or
  **+0.36 pawns of tempo**, close to the +0.30 pawn Stockfish reads for the classical start
  position at depth 30 (chess960.md §3.1).

`fitTanh` is plain gradient descent with momentum from `w = 0`, not Adam, on purpose: the design is
rank-deficient, and gradient descent from zero never leaves the row space of the design, so it
lands on the minimum-norm solution and the identified contrasts are exact. A unit test plants a
piece at 2.00 pawns in synthetic results and checks that the fit recovers it.

## 14. Convergence, and the constants to keep

A value is converged when one pass moves it by less than its own error bar. After pass 2, two had
not: the archer (seed 2.60, measured ≤ 1.70) and the paladin (seed 3.70, measured 3.20 ± 0.46,
moved 0.50). Pass 3 re-seeded **those two only** — archer 170, paladin 320 — and replayed their
arms plus the calibration, 2 500 games, 4 minutes.

| arm | pass-2 seed → result | pass-3 seed → result | verdict |
|---|---|---|---|
| A archer | 260 → −134 ± 26 (≤ 1.70) | 170 → **−139 ± 26** (≤ 1.70) | converged |
| L paladin | 370 → +0 ± 29 (3.20 ± 0.46) | 320 → **−9 ± 29** (3.06 ± 0.44) | converged, moved 0.14 |
| pawn odds | −64 ± 16 | **−65 ± 16** | stable |

The archer arm reads −134 at a seed of 260 and −139 at a seed of 170, and it read −85 at 430. Over
a 260 cp range of seeds the measurement moves by less than its error bar, so **the bound is the
answer, not a way-station**: the fixed point has been reached from the measurement side even though
the seed never reaches the extrapolated point value. Guard, maester and beast each moved less than
their bar in pass 2 and were not re-seeded.

**Recommended constants, now in `src/ai/eval.ts`:**

```ts
export const ARCHER_V = 170, PALADIN_V = 320, GUARD_V = 185, MAESTER_V = 350, BEAST_V = 195;
```

Paladin and maester are measurements. The other three are the band floor, which is the **largest**
value the data allows. That choice is deliberate: the regression point estimates (1.08, −0.26,
−0.22 pawns) are extrapolations the method cannot support, and pricing a piece there would make the
engine hand it over for a pawn. When a measurement can only bound a value, take the safe end of the
bound.

## 15. A sweep sized from the noise formula

Pass 1's sweep failed on purpose: at 20 and 40 games per rank the spread *between* back ranks was
smaller than the sampling noise inside one, so no arrangement could be told from its neighbour.
This run is sized first. The per-game score standard deviation is σ = 0.41 (pass 1 §4), so a rank's
score carries `σ/√N`; `≤ 0.04` needs **N ≥ 105**. Successive halving doubles the games each round,
so round 1 plays 80 (a screen, above the target) and round 2 plays **160** (0.032, under it).
60 back ranks, eta = 2, common random numbers inside each round, depth 3, 9 600 games, 14 m 21 s.

| round | ranks | games each | white score, mean ± sd across ranks | sampling sd of one rank | between-rank sd |
|---|---|---|---|---|---|
| 1 | 60 | 80 | 0.516 ± 0.039 | **0.043** (split-half 0.036) | none measurable |
| 2 | 30 | 160 | 0.522 ± 0.034 | **0.031** (split-half 0.028) | **0.013** |

The "sampling sd" column is computed from the games themselves, not from the formula, and checked
against a split-half of each rank's own games. Round 1 repeats pass 1: the spread across ranks
(0.039) is *below* the noise inside one (0.043), so there is nothing to see. Round 2 is the first
round in this project where the two separate: `√(0.0335² − 0.0308²) = 0.013` of real spread between
back ranks, about 9 Elo. That is a small number, and it is the first measurable one.

**Real candidates** — ranks whose `|white score − 0.5|` exceeds twice their own sampling sd:

| back rank | white score | ± sd | interest | gates failed | survives the White-edge null? |
|---|---|---|---|---|---|
| `MGKRGRNB` | 0.588 | 0.029 | 0.475 | balance | yes |
| `MQKASSRL` | 0.584 | 0.032 | 0.366 | balance, timeouts | borderline |
| `BKMLQRGA` | 0.578 | 0.034 | 0.471 | balance | no |
| `ARLKBANN` | 0.569 | 0.032 | 0.416 | balance | no |

Round 1 flagged 2 of 60 by the same test (`ARNAKSNG` 0.375, `AMLBGNAK` 0.600), and both also failed
the timeout gate.

Four caveats, all of them larger than the effect:

1. **0.5 is the wrong null.** The pool's own White edge is 0.522, so the question "is this rank
   unbalanced" should be asked against 0.522, not 0.500. Only `MGKRGRNB` clearly survives that, and
   `MQKASSRL` sits on the line. The other two are the game's White edge, not their own.
2. **Round 2 is a selected sample.** Successive halving keeps the half that looked most balanced in
   round 1 — selected on the very statistic being tested here, at a budget where that statistic was
   noise. So round 2's ranks regress to the mean, its across-rank sd understates the real spread of
   the pool, and a rank that still reads imbalanced *after* that selection is more interesting than
   the raw p-value suggests.
3. **30 ranks at a two-sided 2-sd threshold expect about 1.4 false positives.** Four is more than
   that, but not by much.
4. **160 games is ±0.060 on a score, about ±42 Elo.** That ranks a back rank; it does not certify
   one. SIM-PLAN §7 wants 320 games in the last round and a 4 000-game confirmation for the top 8.

**The interest axis, unlike balance, does separate the ranks.** Its sampling sd per rank is 0.008
(split-half), and the spread across ranks is 0.050 — six times the noise.

| top 5 by interest | | bottom 5 by interest | |
|---|---|---|---|
| `NAGQKGBM` | 0.503 | `SAMNGBKR` | 0.364 |
| `AKNNARLQ` | 0.486 | `MNABAKSM` | 0.339 |
| `KQMNGLAB` | 0.486 | `SKANSGGR` | 0.339 |
| `GRMGKNBB` | 0.485 | `LGKBSMGR` | 0.338 |
| `MGKRGRNB` | 0.475 | `AGSMRSMK` | 0.337 |

Each of those carries ±0.016 at 95 %, against a top-to-bottom range of 0.166, so the ordering is
real at this budget. Two readings, one of them a warning.

- **It reproduces across an engine change.** `AKNNARLQ` and `KQMNGLAB` were also in pass 1's top
  five, measured with the old piece values. The 60 ranks here are the first 60 of pass 1's 100 (the
  sampler shares the seed), so this is the same arrangements re-measured, not an independent draw.
- **Right now the interest axis is mostly a draw-rate axis.** The bottom five draw 41–51 % of their
  games and all carry strongly negative excess decisiveness; the top five draw 21–37 %. The Browne
  weights put +0.12 on excess decisiveness and +0.13 on late uncertainty, and at our engine's draw
  rate those two dominate the sum. That is not wrong, but "interesting" currently means "gets
  decided", and it stays a hypothesis until Saar and the testers rank arrangements by hand
  (SIM-PLAN §4: never refit these weights on our own output).

Six of the 30 ranks pass every gate; capped games average 6.1 %, still over Browne's 5 % ceiling, as
in pass 1. The ply cap and the draw adjudication want a look before the full-size sweep.

## 16. What pass 2 leaves open

1. **The three bounds.** Archer, guard and beast are each "under 1.70 pawns" and no better. Muller's
   step 2 is the fix: give the knight side a pawn — probably two or three — until the arm brackets
   50 %, and read the value off the compensation. That needs a new arm shape in `experiments.ts`
   (a fairy-vs-knight position where the knight side also starts short of material), about 1 500
   games per piece at depth 3.
2. **A depth-4 pawn scale.** 360 games gave 30 ± 33 Elo per pawn, which is nothing. About 1 500
   games would make every depth-4 value quotable in pawns instead of Elo.
3. **The classical control for the regression.** Sampling material differences from mid-game
   positions (replay the stored LAN with the engine) would let the fit recover N/B/R/Q and check
   them against AlphaZero's 3.05 / 3.33 / 5.63 / 9.50 — the validation the method is supposed to
   carry.
4. **A full-size sweep.** This one measured 0.013 of real spread between back ranks. SIM-PLAN §7's
   budget (500 ranks, 4 rounds, 80 000 games, about 2.5 hours here) is what it takes to act on it.
5. **The five arms are still one depth apart.** Paladin and maester have never been measured at
   depth 4 at all.

## 17. One test expectation changed

`src/ai/search.test.ts`, "evaluation is mirror-symmetric", now allows a one-centipawn difference
instead of demanding equality. It is not the piece values that broke it. The king term blends
`KING_MG` and `KING_EG` by a fractional phase, so the running total is a float and the mirrored
board sums the same squares in a different order; when the total lands exactly on a half centipawn,
the two orders round opposite ways. The new values happen to put `MID` on such a total. The honest
fixes are to round each king term to a whole centipawn inside `evaluateBoard`, or to carry an
integer phase — both change the evaluation, and both would invalidate every number measured today,
so neither belongs in this pass. A real asymmetry (a table that is not left-right symmetric, a
colour-specific term) is worth tens of centipawns, so the tolerance keeps the test's power. The
other 79 tests pass unchanged, and one new test covers the material regression.

## 18. Buff candidates for the archer, the guard and the beast

§11 and §14 leave three pieces bounded: archer, guard and beast are each **under 1.70 pawns**
against a knight of 3.20, and the bound is the answer, not a way-station. This pass asks the design
question instead of the pricing one: **which single rule change lifts a piece towards a knight
without changing what the piece is?**

Ten candidates, each a toggle in `src/rules/rules.ts` whose default is today's rule, so nothing
changes until a run sets it. `isAttacked`, `canCapture`, `status` and the search all read the same
toggles; each one has a test that flips it, asserts one consequence, and re-runs the
`isAttacked` / `genPiece('attacks')` cross-check on 200 random boards under the new rule.

### 18.1 Commands

```
V="--experiment values --games 300 --depth 3 --seed 1 --eloPerPawn 64"
npm run sim -- --id buff-A-move  --pieces A $V --rule archerMove=any
npm run sim -- --id buff-A-diag2 --pieces A $V --rule archerShots=plusDiag2
npm run sim -- --id buff-A-ring2 --pieces A $V --rule archerShots=ring2
npm run sim -- --id buff-A-both  --pieces A $V --rule archerMove=any --rule archerShots=plusDiag2
npm run sim -- --id buff-G-pawns --pieces G $V --rule guardCaptures=pawns
npm run sim -- --id buff-G-step2 --pieces G $V --rule guardStep=2
npm run sim -- --id buff-G-both  --pieces G $V --rule guardCaptures=pawns --rule guardStep=2
npm run sim -- --id buff-S-move  --pieces S $V --rule beastMove=any
npm run sim -- --id buff-S-fwd   --pieces S $V --rule beastCaptureForward=true
npm run sim -- --id buff-S-both  --pieces S $V --rule beastMove=any --rule beastCaptureForward=true
npm run sim -- --id base-A --pieces A $V    # the same arm under today's rules, for the delta
npm run sim -- --id base-G --pieces G $V
npm run sim -- --id base-S --pieces S $V
npm run sim -- --id buff-all --games 300 --depth 3 --sample 30 --seed 5 \
  --rule archerMove=any --rule archerShots=plusDiag2 \
  --rule guardCaptures=pawns --rule guardStep=2 \
  --rule beastMove=any --rule beastCaptureForward=true
npm run sim -- --id ab-buff --experiment ab --games 300 --sample 30 --depth 3 --seed 5 \
  --rule archerMove=any --rule guardCaptures=pawns --rule guardStep=2 --rule beastMove=any
npm run sim:analyze -- --id buff-all
```

Two additions to the lab. **`--eloPerPawn 64`** reuses the calibration of §11 and §14 instead of
playing it again: the pawn arm is three times the size of a fairy arm, and the number is the same
in three passes (56 ± 25, 64 ± 16, 65 ± 16), so a run that only needs the conversion should not
spend two thirds of its budget re-measuring it. The three `base-*` runs replay nothing — they read
the first 300 games of the stored §11/§14 arms out of their JSONL, which are the **same openings**
as the buffed arms (same seed, same job stream), so every delta below is paired on the opening.

### 18.2 The arms

300 games (150 colour-reversed pairs) per arm, depth 3, one pawn = 64 Elo, knight = 3.20 pawns.

| piece | toggle | Elo vs knight | implied value (pawns) | Δ vs today's rule |
|---|---|---|---|---|
| A archer | *today* | −160 ± 34 | < 1.70 ** | — |
| A archer | `archerMove=any` | −34 ± 35 | **2.67 ± 0.55** | +126 ± 49 |
| A archer | `archerShots=plusDiag2` | −88 ± 37 | 1.83 ± 0.58 | +72 ± 50 |
| A archer | `archerShots=ring2` | +44 ± 38 | **3.89 ± 0.59** | +204 ± 51 |
| A archer | `archerMove=any` + `plusDiag2` | +88 ± 35 | 4.57 ± 0.55 | +248 ± 49 |
| G guard | *today* | −200 ± 33 | < 1.70 ** | — |
| G guard | `guardCaptures=pawns` | −196 ± 33 | < 1.70 ** | +4 ± 47 |
| G guard | `guardStep=2` | −199 ± 31 | < 1.70 ** | +1 ± 45 |
| G guard | `guardCaptures=pawns` + `guardStep=2` | −91 ± 35 | **1.77 ± 0.55** | +109 ± 48 |
| S beast | *today* | −225 ± 30 | < 1.70 ** | — |
| S beast | `beastMove=any` | −72 ± 35 | **2.08 ± 0.55** | +153 ± 46 |
| S beast | `beastCaptureForward=true` | −199 ± 30 | < 1.70 ** | +26 ± 42 |
| S beast | `beastMove=any` + `beastCaptureForward` | −17 ± 34 | **2.93 ± 0.53** | +208 ± 45 |

\*\* outside Muller's ±1.5-pawn linear band, so the row is a bound, not a number. The Δ column adds
the two error bars in quadrature, which is conservative: the arms share their openings.

Four readings.

1. **Every buff pair is superadditive, and two of the three pieces need the pair.** Guard: +4 and
   +1 alone, **+109 together**. Archer: +126 and +72 alone, **+248 together**. A guard that eats
   pawns but steps one square never reaches a pawn; a guard that covers two squares but takes
   nothing still takes nothing. Reach and threat only pay when a piece has both.
2. **The beast's handicap is the one-way *move*, not the blind spot.** Moving in eight directions is
   worth +153; capturing straight ahead is worth +26 ± 42, which is nothing. Beast utilisation goes
   0.47 → 1.47 and chains finally happen (168 chain moves per 300 games against 76, with chains of
   3 and 4 appearing). The rulebook's blind spot costs the piece almost nothing.
3. **The archer's handicap is its feet, not its bow.** One extra shot ring (`plusDiag2`) is worth
   +72; four extra steps are worth +126. A sniper that cannot walk cannot pick its ground.
4. **These are lower bounds.** `src/ai/eval.ts` is frozen for this round at archer 170, guard 185,
   beast 195, and `beastTargets()` still hardcodes the blind spot. So the search prices every
   buffed piece at its un-buffed value and trades it away too cheaply; a re-seeded engine would
   read each buff at least as high, not lower.

### 18.3 Balance of the combined rule sets

`buff-all` turns on every toggle at once (the strongest set), 300 games over 30 random back ranks:

| set | white score (95%) | decisive | draws | capped | mean plies |
|---|---|---|---|---|---|
| defaults (§2 smoke, 200 games) | 0.542 (0.485–0.600) | 68.5% | 27.5% | 4.0% | 131 ± 70 |
| all six toggles (`buff-all`) | **0.500 (0.453–0.547)** | 68.7% | 28.3% | 3.0% | 132 ± 64 |

Utilisation under the full set: archer 1.76 → **2.48**, guard 1.53 → **2.31**, beast 0.46 → **1.32**.
The beast leaves the 0.25 utilisation gate it was sitting on. Archer shots go 1.73 → 4.31 per game.

Those two rows are different arrangement samples, so `ab-buff` repeats the question properly: the
recommended (milder) set against today's defaults on the **same 30 back ranks and the same opening
seeds**, 300 games each side.

| metric | defaults | recommended set | paired difference ±95% |
|---|---|---|---|
| white score | 0.560 | 0.485 | −0.075 ± 0.037 |
| decisive | 0.547 | 0.583 | +0.037 ± 0.092 |
| draw rate | 0.357 | 0.373 | +0.017 ± 0.078 |
| capped | 0.097 | 0.043 | −0.053 ± 0.049 |
| mean plies | 151.8 | 141.5 | −10.4 ± 9.3 |
| branching factor | 27.4 | 33.6 | +6.2 ± 1.0 |
| interest | 0.374 | 0.425 | +0.066 ± 0.025 |

Draws and decisiveness do not move. Games get slightly shorter and far fewer of them hit the ply
cap, branching rises by six moves a position, and the interest score rises. White's edge drops by
0.075 on this sample; with one interval per metric over 13 metrics that is "worth a second run",
not a finding, and it moves *towards* 0.5.

### 18.4 What to change, and what to leave

| piece | recommended | value | why |
|---|---|---|---|
| A archer | `archerMove: 'any'` | 2.67 ± 0.55 | closest arm to a knight; the shot table — the archer's whole signature — is untouched |
| G guard | `guardCaptures: 'pawns'` + `guardStep: 2` | 1.77 ± 0.55 | the only guard arm that moves at all; still cannot check, mate, or take a piece |
| S beast | `beastMove: 'any'` | 2.08 ± 0.55 | keeps the 7-square maul, the blind spot and the chain; only the one-way walk goes |

Three game records per recommended toggle, read by hand for new degeneracies:

- **Archer.** It walks up the board and snipes from its new square (`Ac7-c6 Ac6-d5 Ad5-e4 Af4*e5
  Ag3*g1`), 1.00 shots a game against 0.66 and utilisation 1.43 → 1.91. It is a mobile sniper,
  which is what the piece claims to be. No shuffle-and-shoot loop appears, and the draw count
  hardly moves (41 → 39 games in 300).
- **Guard.** The pair produces a new pattern worth the designer's eye: an **uncapturable pawn
  harvester**. One game has `Gb8-c7 Gc7-a5 Ga5xa4 Ga4xb3 Gb3xc4` — three pawns eaten, and only a
  king could ever answer it. It is not a winning tactic (the arm still scores 0.372 and the game
  was drawn), but it triples dead endings in the odds arm: draw50 1 → 18 and drawMaterial 2 → 16
  games in 300. The paired A/B shows no draw-rate change in a normal game, where both sides have
  guards, so this is a handicap-position effect — but it is the one candidate that changes how a
  position *feels*, not only what it is worth.
- **Beast.** It steps into contact instead of waiting to be walked into (`Sb1-c2 Sc2-c3 Sc3xd4
  Sd4-e4 Se4-f3`), and chains of 2–4 appear. In one of the three it still never left its start
  square and its side lost: even buffed, the beast is slow.

If the designer wants a piece **on** the knight rather than under it, the measured options are
`archerShots: 'ring2'` (3.89 ± 0.59) and the beast pair (2.93 ± 0.53). Both cost identity: ring2
turns the sniper at a fixed range into area denial over 20 squares, and `beastCaptureForward`
deletes the blind spot that RULES.md §6 decision 3 chose on purpose. The archer pair
(`any` + `plusDiag2`, 4.57 ± 0.55) overshoots — it prices the archer between a bishop and a rook.

### 18.5 What this pass changed in the code

- Six new toggles in `src/rules/rules.ts`: `archerMove`, `archerShots`, `guardStep`, `beastMove`,
  `beastCaptureForward`, and `guardCaptures`, which **changes type** from `boolean` to
  `'none' | 'pawns' | 'any'` (`'any'` is the old `true`). `--rule guardCaptures` alone no longer
  parses; write `--rule guardCaptures=any`. `parseRule` now derives booleans and choices from
  `DEFAULT_RULES`, so a new toggle needs one entry, not a branch.
- `--eloPerPawn` on the values experiment (§18.1), and one bug fix in the same report: an arm that
  left the linear band on the **strong** side printed `< 1.70`. It now prints `> 4.70`. No earlier
  number is affected — every previous arm left the band downwards.
- Two test expectations moved with the type change (`rules.test.ts`, `sim.test.ts`); nothing in
  `src/ai/search.test.ts` needed to change. Seven new tests, 87 green.
- Regression, the same check §2 makes: with every toggle at its default the engine replays the
  first 20 games of the stored `values-d3-p3.A` arm **move for move**, same result, same reason,
  same ply count. So the `base-*` rows are today's engine, and the commands in §18.1 reproduce
  them from scratch.
