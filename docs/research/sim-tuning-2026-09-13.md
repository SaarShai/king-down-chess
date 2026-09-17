# Texel tuning the evaluation (2026-09-13)

Batch-2 run **R5** (`docs/RUNS.md`): fit every number in `src/ai/eval.ts` to the results of games we already played,
then measure what it bought. **584k positions, 408 parameters, +113 ± 27 Elo at depth 3 and +117 ± 33 at depth 4.
Shipped.** 16 cores, Node 26, `tsx`, 50 minutes — 34 of them making data.

## 1. Data

**The recorded corpus was too small, and most of it is a different game.** A summary records only the toggles a run
*set*, and `DEFAULT_RULES` changed mid-campaign when the buffs landed, so an empty rule set means "whatever the
defaults were that hour". Keeping only runs that name all five v0.6 toggles (`archerMove=any beastMove=any
guardCaptures=pawns guardStep=2 guardCaptureLimit=1`) and differ from today's rules in nothing leaves **8,600 games
of 196,260** (`v06Runs()` is that test in code); the 40,000-game `ab-buff-big` pair predates the guard's one-capture
limit and fails it. So the pass played its own — **`tune-data`: 24,000 games**, depth 3, 1,200 random back ranks,
rules named on the command line, White 0.5225 over 132.7 plies. Sampled: 163,353 positions from the `ab-g-lim1*`
runs, 9,456 from the guard odds arms and 411,059 from 20,000 `tune-data` games — **583,868 positions from 28,600
games**, 58,267 of them held out.

Sampling: replay each game from its `startFen` through its own notation (`parseLan`, checked against `toLan` every
ply, so a mis-parse throws); at most 30 positions a game, 4 or more plies apart, after the opening; **keep one only
when the mover is not in check and `evaluate()` agrees with a full quiescence search within 50 cp** — that dropped
35,106 in check and 75,931 noisy. Labels are the game result from White's side; the 10% held out is 10% of *games*,
so no game straddles the split.

## 2. Method

`src/sim/tune.ts`. The evaluation is re-implemented as `evalVector(board, turn, v, g?)`, a function of one
**408-number vector**: 10 material values, 12 tables × 32 (left-right mirrored, as the shipped tables already are),
4 mobility weights, the beast's target bonus and its cap, 4 king-shield weights, 2 maester-proximity weights, tempo,
`PHASE_MAX`. With `g` it accumulates the exact derivative too, the phase blend included — the one non-linear term,
where every material value pulls on the king tables through `npm / PHASE_MAX`. Two implementations of one evaluation
are a bug factory, so `src/sim/tune.test.ts` holds them together: **with the live parameters loaded they agree bit
for bit on 1,000 random positions** — not to a centipawn, to the last bit, which is why the king blend accumulates
in `evaluateBoard`'s order — and the gradient is checked against one-sided finite differences on 25 positions.

The loss is Texel's: mean of `(result − sigmoid(K·eval/400))²`. **K = 0.667**, by golden section on the training set
at today's values, then held. Optimiser: full-batch Adam (lr 1.0, cosine decay, 300 epochs) over 16 workers, each
holding a slice of the positions; the best-validation vector is kept, rounded to integers. Regularisation is L2
toward today's values, scaled per group (material 100, tables 30, weights 10, `PHASE_MAX` 1000). **The pawn is
frozen at 100**: K is fixed, so nothing else stops the vector drifting bigger, and the rest of the project spends
centipawns — delta pruning, adjudication thresholds, Elo per pawn.

## 3. The fit, and why validation error is the wrong judge

Six fits, about 25 s each; `--freeze weights` tunes material and the tables only. Pilots are 200-game paired matches
against the untuned evaluation at depth 3, on the same openings. Two fits are not in the table: λ = 1e-5 validates
at 0.130103, λ = 1e-4 with the weights frozen at 0.131827.

| fit | train MSE | validation MSE | pilot Elo ± 95% |
|---|---|---|---|
| untuned | 0.133212 | 0.134855 | — |
| λ = 0 | **0.128154** | **0.129924** | −23 ± 48 |
| **λ = 1e-4** | 0.130223 | 0.131611 | **+85 ± 44** |
| λ = 1e-3 | 0.131982 | 0.133486 | +85 ± 38 |
| λ = 0, weights frozen | 0.128504 | 0.130395 | −12 ± 43 |

**Validation error and playing strength point opposite ways.** The unregularised fit predicts held-out results best
and plays them worst; it is also what "sparse pieces blow up" looks like — tempo to 0, bishop and rook mobility to 0
and −1, the beast's target bonus 6 → 50 with its cap at 74. Such terms are cheap to overfit on quiet positions and
expensive to get wrong inside a search: read the MSE columns as a diagnostic, the match as the metric. λ = 1e-4 and
λ = 1e-3 both read +85, so they played each other: **λ = 1e-4 by +81 ± 36** over 200 games. That vector shipped.

## 4. The measurement

Tuned against untuned, colour-swapped pairs, random v0.6 back ranks, openings no pilot used. Both evaluations live
in one process — `setEvalParams()` swaps the tables between plies — so **the transposition table is cleared every
ply on both sides**, which weakens both equally.

| match | games | pairs | pentanomial | tuned score | Elo ± 95% | nElo | LOS | draws | plies |
|---|---|---|---|---|---|---|---|---|---|
| depth 3 | 400 | 200 | [11, 16, 66, 50, 57] | 0.657 | **+113 ± 27** | +136 | 100.0% | 9.0% | 160 |
| depth 4 | 200 | 100 | [3, 8, 30, 39, 20] | 0.662 | **+117 ± 33** | +162 | 100.0% | 12.5% | 196 |

**Four error bars clear of zero, and the gain survives the deeper search** (SIM-PLAN §9's check). A ply is worth
about 180 Elo here (`sim-strength-2026-09-13.md`): the fit bought two thirds of one, free at run time.

## 5. What moved

| | P | N | B | R | Q | A | L | G | M | S |
|---|---|---|---|---|---|---|---|---|---|---|
| was | 100 | 320 | 330 | 500 | 900 | 280 | 310 | 170 | 330 | 215 |
| now | 100 | **296** | **313** | **472** | 909 | **295** | 318 | **124** | **291** | **261** |

Every standard piece but the queen shrinks 5–6%, which is the same sentence as "a pawn is worth more than 100 said".
The fairy rows are the news: the guard falls 46 and the beast rises 46, both the way §6 points, and neither
reachable by Muller's method, which reads the guard only as a bound.

Weights: tempo 10 → **5**; mobility (B/R/Q/L) 4/3/2/2 → **1/1/0/0**; beast target 6 → 8, cap still 18; king shield
(pawn/guard/other/open) 12/26/5/8 → **9/25/5/4**; maester within 1/2 of its king 14/7 → **11/7**; `PHASE_MAX` 5600 →
5712. **The hand-set mobility weights were about four times too big**: with tables this detailed, most of what
mobility says is said already by where a piece stands.

The tables barely moved — 2.5 cp a square at most — **except the pawn, at 7.9 cp a square, and it moved where no
chess table has an entry: rank 1.** A maester swaps with a friendly neighbour, so `Ma1<>a2` drags a pawn backwards
off rank 2 and **14% of the sampled positions hold a pawn on its own first rank**. The fit prices that: **+38 on a2
and +11 on a1 against −8 on d2 and −3 on d1**. An edge pawn pulled home is nearly free; a centre pawn pulled home is
a hole.

## 6. The fairy pieces, re-measured under the tuned engine

One arm per piece replacing a knight of `RNBQKBNR` on one side, 300 games an arm, depth 3, `--eloPerPawn 64`. Both
sides play the tuned evaluation, so this is the piece as the **new** engine plays it, not a re-price of the old one,
and the knight anchor itself moved from 3.20 to 2.96 pawns.

| piece | Elo vs knight, was → now | implied value, was → now |
|---|---|---|
| A archer | −24 ± 28 → **+30 ± 34** | 2.82 ± 0.44 → **3.43 ± 0.54** |
| L paladin | −6 ± 29 → **−48 ± 33** | 3.10 ± 0.45 → **2.21 ± 0.52** |
| G guard | −100 ± 26 → **−158 ± 31** | < 1.70 → **< 1.46** (still a bound) |
| M maester | +5 ± 28 → **−50 ± 34** | 3.28 ± 0.44 → **2.18 ± 0.53** |
| S beast | −66 ± 27 → **−19 ± 34** | 2.17 ± 0.41 → **2.67 ± 0.54** |

**Every row moved, three by more than a combined error bar** (paladin, maester, guard), and the two the fit
re-priced hardest moved the way it pushed: the beast closes half its gap to a knight, the archer crosses it.
**Muller's fixed point is not converged under the tuned engine** — re-seed from this table and play another pass
before touching a value by hand, starting with the maester, which the fit cut 39 cp *and* the odds match reads a
pawn lower.

## 7. Commands

```
npm run sim -- --id tune-data --games 24000 --depth 3 --sample 1200 --seed 77 --workers 15 --rule \
  archerMove=any --rule beastMove=any --rule guardCaptures=pawns --rule guardStep=2 \
  --rule guardCaptureLimit=1                                               # 0h34m02s
npm run tune -- sample --perRun 20000                                       # 21s
npm run tune -- fit --epochs 300 --lr 1 --lambda 0,1e-5,1e-4,1e-3           # 1m37s
npm run tune -- fit --epochs 300 --lr 1 --lambda 0,1e-4 --freeze weights    # 0m50s
npm run tune -- match --id pilot-X --games 200 --depth 3 --seed 991 --tuned sim/tune/params-X.json
cp sim/tune/params-l0.0001.json sim/tune/params.json && npm run tune:apply
npm run tune -- match --id tuned-d3 --games 400 --depth 3 --seed 3001       # 0m47s
npm run tune -- match --id tuned-d4 --games 200 --depth 4 --seed 3002       # 3m10s
npm run sim -- --id tuned-values --experiment values --games 300 --depth 3 \
  --seed 1 --pieces ALGMS --eloPerPawn 64                                   # 1m54s
npx tsc --noEmit && npx vitest run && npm run dashboard                     # 102 tests green
```

`tune:apply` rewrites the constants and tables in `src/ai/eval.ts` from `sim/tune/params.json`, re-imports the file
it wrote and checks all 408 numbers read back; run with today's parameters it reproduces the hand-written file
**byte for byte**. The untuned file stays at `sim/tune/eval-before.ts`.

## 8. What this does not show

- **Both arms shared the per-ply table reset and the Fishtest adjudication**: the comparison is fair, absolute
  strength is not measured, and an inflated evaluation would trip the ±600 cp resign rule earlier — the second
  reason the pawn is anchored.
- **The labels are this engine's own results**, 65% adjudicated on its own evaluation: an error both evaluations
  share is invisible to the MSE, and only the match can see it.
- **One data distribution** (depth-3 self-play from random back ranks) and **one scalar λ**, chosen by a pilot match
  over six fits. A weaker pull on the tables than on the weights is the cheapest experiment left.
