# The buffed rule set, measured (2026-09-13)

The designer chose the recommended buff set of `sim-results-2026-09-13.md` §18.4: `archerMove=any
guardCaptures=pawns guardStep=2 beastMove=any`. This pass prices the five fairy pieces under it, plays a paired A/B
against today's game, hunts abuse patterns, confirms the headline at depth 4, and sweeps arrangements. **53 940
games, 3.1 h. Adopt the movement buffs; hold the guard pair.**

## 1. Two additions to the lab

**`--values A=280,G=170,S=215`** re-prices the engine at run time. `setPieceValues()` in `src/ai/eval.ts` rebuilds
both tables derived from the material constants — the hot `VAL` array and the exported `VALUES` record
`src/ai/search.ts` orders moves with — in place; `playGame()` calls it once a game beside `setRules`, resetting to
the shipped constants first, so a run without `--values` plays today's engine. §18 measured every buff with the
engine still pricing the piece at its un-buffed value. **Regression:** the same 20-game depth-3 run (`--seed 1
--sample 5 --workers 1`) before and after the change, with no `--values`, gives byte-identical JSONL once the
wall-clock `ms` fields are stripped (sha1 `43282a31`). One lab guard came out of this pass too: the first values
run lost every `--rule`, because zsh does not word-split an unquoted `$VAR` and four flags reached `argv` as one
argument whose key held spaces. `parseFlags` now throws on such a key, and `run()` prints the live rule diff and
values in its header.

## 2. Converged values under the buff set

Muller's fixed point at depth 3: one arm per piece, each replacing a knight on one side of `RNBQKBNR`, 500 games
(250 pairs) an arm, `--eloPerPawn 64` from §11/§14, seeds from §18.

| arm | pentanomial | score | Elo ± 95% | Δ pawns | implied value | seed | moved | verdict |
|---|---|---|---|---|---|---|---|---|
| A archer | [55, 30, 101, 23, 41] | 0.465 | −24 ± 28 | −0.38 ± 0.44 | **2.82 ± 0.44** | 2.70 | 0.12 | converged |
| L paladin | [52, 25, 102, 22, 49] | 0.491 | −6 ± 29 | −0.10 ± 0.45 | **3.10 ± 0.45** | 3.20 | 0.10 | converged |
| G guard | [74, 54, 81, 20, 21] | 0.360 | −100 ± 26 | −1.56 ± 0.41 \*\* | < 1.70 \*\* | 1.80 | 0.16 | bound |
| M maester | [44, 34, 84, 47, 41] | 0.507 | +5 ± 28 | +0.08 ± 0.44 | **3.28 ± 0.44** | 3.50 | 0.22 | converged |
| S beast | [62, 41, 103, 17, 27] | 0.406 | −66 ± 27 | −1.03 ± 0.41 | **2.17 ± 0.41** | 2.10 | 0.07 | converged |

\*\* outside the ±1.5-pawn linear band: a bound, not a number. **No piece moved by more than its own error bar, so
one pass closes the fixed point** — the payoff of seeding from §18. The guard, the one row that stays a bound, was
re-run at the band floor (seed 1.70) and read **−114 ± 26** against −100 ± 26 at seed 1.80; the two overlap, so it
is seed-blind under the buff as under today's rules (§11 reading 3), and per §14 a bounded piece is priced at the
safe end of its bound. **Constants for the buff set** — applied with `--values`, never written into
`src/ai/eval.ts`: **`--values A=280,L=310,G=170,M=330,S=215`**. Against today's values (170 / 320 / 185 / 350 /
195) that lifts the archer **1.10 pawns** and the beast **0.20**, the beast now inside the band; nothing else
moves, and the guard's deficit halves from −202 ± 26 (§11) to −100 ± 26.

**One control worth keeping.** The lost-rules run (`buffv-p1`: buffed *values*, today's *rules*) is the cleanest
test of seed blindness yet: at A = 270 the archer arm read −135 ± 27 against −139 ± 26 at A = 170 in §14, so a 100
cp re-price moves it by 4 Elo and **the gains above are the rules, not the re-pricing**. It does not settle the
mining pass's court army, though: `AAGMMQN` beat `SSLQBBG` 0.790 on matched values, so a guard priced at a bound
stays overpriced in bulk.

## 3. Today against the buff set — the paired A/B

150 random back ranks, 100 games a rank an arm, the same ranks and opening seeds in both arms (common random
numbers), depth 3, **30 000 games**, 104 minutes. The buffed arm plays the §2 values, the control today's rules
*and* values.

| | today | buffed | mean paired difference ± 95% |
|---|---|---|---|
| White score | 0.524 (0.517–0.530), +16 ± 4 Elo | 0.521 (0.515–0.527), +15 ± 4 Elo | **−0.002 ± 0.009** |
| decisive | 60.4% | 59.6% | −0.009 ± 0.022 |
| draw rate | 33.0% | **36.7%** | **+0.037 ± 0.019** |
| capped at 300 plies | 6.6% | **3.7%** | **−0.029 ± 0.007** |
| minimum utilisation | 0.42 | 0.37 | −0.03 ± 0.01 |

**The buff set does not change who wins.** The paired difference is −0.002 ± 0.009; §18.3's −0.075 ± 0.037 came
from 30 ranks, so read that row as retracted. What changes is the shape of a game: branching 27.7 → 32.9 (**+5.2 ±
0.4**), mean plies 139.4 → 134.7 (**−4.7 ± 2.6**), and **less than half as many games hit the ply cap**. Per piece,
both sides, a game — moves / captures / survival, today → buffed:

| piece | moves | captures | survival | piece | moves | captures | survival |
|---|---|---|---|---|---|---|---|
| P pawn | 29.33 → 25.22 | 5.84 → 4.75 | 28.9 → **20.9%** | B bishop | 7.60 → 6.86 | 1.53 → 1.43 | 19.5 → 17.0% |
| M maester | 21.14 → 13.61 | 1.26 → 1.05 | 53.7 → 50.8% | Q queen | 4.99 → 4.75 | 1.04 → 0.99 | 43.1 → 37.5% |
| K king | 18.70 → 16.08 | 1.16 → 1.14 | 100 → 100% | S beast | **3.63 → 10.80** | 0.57 → 1.28 | 69.7 → 50.6% |
| G guard | 16.22 → 18.99 | **0.00 → 3.41** | 97.9 → 94.1% | L paladin | 3.31 → 3.03 | 0.62 → 0.62 | 6.3 → 6.6% |
| R rook | 13.04 → 12.54 | 2.11 → 1.87 | 29.4 → 30.9% | N knight | 10.00 → 9.01 | 1.89 → 1.75 | 15.2 → 11.6% |
| A archer | 11.42 → 13.81 | 2.08 → 2.02 | 73.0 → **50.3%** | | | | |

Two intended effects land. **The beast triples its activity** and stops being the inert piece of every earlier
report. **The archer becomes killable**: it leaves the back rank, its orthogonal neighbours are still its blind
spot, so it can be traded and therefore priced. One unintended effect: the pawns pay — §4 says who eats them. Fairy
events a game: archer shots 2.08 → 2.02, beast chain moves 0.50 → 1.10, chain captures 0.57 → 1.28, maester swaps
8.24 → 4.92, promotions 0.36 → 0.29, checks 6.48 → 8.24.

Interest terms residualised on the arm's draw rate — one `term ~ a + b·drawRate` line over both arms' 300
arrangements (`residualiseInterest()`, `src/sim/analyze.ts`). Buffed − today ± 95%: killer move +0.005 ± 0.005,
lead change −0.003 ± 0.001, uncertainty late −0.006 ± 0.002, drama **+0.013 ± 0.003**, permanence +0.001 ± 0.000,
fairy use (mean) +0.002 ± 0.004, excess decisiveness **+0.041 ± 0.011**, **interest +0.005 ± 0.002**, old
minimum-based interest +0.066 ± 0.009.

That last pair matters. `fairyUse` was the **minimum** over the fairy types, so one inert beast pinned it for a
whole arrangement (corr −0.77 with beast count, `sim-mining-2026-09-13.md`) and hid every other difference;
`weights.ts` and `interestScore()` now take the **mean**, and every table prints both. The buff set's headline
interest gain *was* that artefact — the old score reads +0.060 ± 0.010, §18.3's "+0.066" again — and on the mean it
is **thirteen times smaller**.

## 4. Degeneracy

Counters, today → buffed: guard captures a game **0.000 → 3.407**; games where one side's guard takes three or more
**0 → 6 550 (43.7%)**; dead-material endings (draw50 + drawMaterial) 1 489 (9.9%) → 1 592 (10.6%); games where a
king never moved 3 038 (20.3%) → 3 294 (22.0%).

**The uncapturable pawn harvester is the buff set's real cost.** §18.4 saw it in a handicap arm and called it a
position effect. It is not: with guards on both sides it happens in **43.7% of games**, flat across counts and not
a tail — 13.6% reach exactly three guard captures, 13.2% four, 9.2% five, 7.7% six or more. It also makes games end
in nothing:

| | games | dead-material ending | draw |
|---|---|---|---|
| buffed, a guard takes ≥ 3 | 6 550 | **18.1%** | **46.7%** |
| buffed, all other games | 8 450 | 4.8% | 29.0% |
| today | 15 000 | 9.9% | 33.0% |

That is the whole of the +0.037 draw-rate rise, and the reason pawn survival falls to 20.9%. Three games, guard
moves only (LAN); all three drawn:

```
SMKQGRGM  Gd3xc4 Gg5xf4 Gc4xd5 Gf4xe5 Gd5xe6 Ge5xd4 Ge6xf5 Gd4xc3 ...  8 pawns, drawn, 123 plies
KBGNGMMA  Gc6xb5 Gd4xd5 Gb4xc3 Gd5xc4 Gc3xd2 Gb4xa3 Ge3xf4 Ge5xe6 ...  8 pawns, drawn, 141 plies
RLMNSGKG  Ge5xe4 Ge4xf3 Gh4xg5 Gd3xc2 Ge7xd7 Gc2xb2 Gd6xc5 Gb2xa2 ...  8 pawns, draw50, 238 plies
```

Both sides harvest, nothing recaptures (only a king may take a guard), and the position runs out of material.
`guardStep: 2` makes it a harvest and not an accident: two squares of reach turn "a guard beside a pawn" into "a
guard that picks a pawn". **The beast's ten-capture chain is rare and spectacular** — `beastMove: 'any'` lets it
walk diagonally into a crowd and chain:

```
ARSSNNKL  Sc8-d7 Sd7-c6 Sc6-d5 Sd5-c4 Sc4xd3xc3xb2xa1xa2xb1xc1xd1xd2   black resigns, 24 plies
```

Chains of four or more appear in 0.83% of buffed games against 0.39% today, 82% of them decisive — a highlight, not
an exploit: it needs an opponent who leaves ten pieces adjacent on a back rank.

## 5. Depth-4 confirmation

60 back ranks, 20 games a rank an arm, **2 400 games**, 31 minutes. The brief asked for 40 a rank, but depth 4 runs
at 1.0–1.4 games/s here against 4.8 at depth 3, so the ranks were kept and the games halved.

| metric | depth 3 (30 000 games) | depth 4 (2 400 games) | agrees |
|---|---|---|---|
| White score, paired | −0.002 ± 0.009 | −0.020 ± 0.029 | yes |
| draw rate · decisive | +0.037 ± 0.019 · −0.009 ± 0.022 | **+0.116 ± 0.050** · −0.084 ± 0.053 | yes, larger |
| guard captures a game · rampage games | 3.41 · 43.7% | **5.15 · 59.4%** | yes, larger |
| dead-material endings | 10.6% (today 9.9%) | **18.3%** (today 11.8%) | yes, larger |

**No metric changes sign between the two budgets**, so no headline is unresolved (SIM-PLAN §9). But draws, dead
endings and the guard harvest all get **worse with depth**: a deeper search finds the harvester more often, not
less.

## 6. Sweep under the buff set

100 random back ranks, successive halving, eta = 2, common random numbers inside each round, depth 3, **16 000
games**, 25 minutes. Round 1: 100 ranks x 80 games, White mean 0.5183, sd across ranks 0.0429 against 0.0458 of
sampling noise inside one rank, 36.7% draws, 3.5% capped. Round 2, the one to read: the better 50 at 160 games
(§15's noise-sized budget), White mean 0.5173, sd 0.0290 against 0.0324, 38.3% draws, 3.7% capped.

**The spread between back ranks is still smaller than the noise inside one**, as §15 found under today's rules: the
buff set does not make arrangements more distinguishable. Only **one rank of 50** sits beyond twice the pool sd
from the buffed pool's own White mean — `KLSNMRQA` at 0.591 (+2.53 sd, 16.9% draws), which fails the balance gate.
Round-2 gate failures: balance 19, timeouts 9, draw rate 4, of 50. Residualised interest extremes span only ±0.015,
noise here: `NSBNQGKM` +0.015 and `MKANRQSB` +0.014 top, `SNKSGLQR` −0.014 and `GRKBALBA` −0.014 bottom. Guard
captures 3.69 a game, 47.0% rampages, 12.0% dead ends.

## 7. Commands, games and wall time

`RULES` is the four rule flags **typed out, never through a shell variable** (§1); `VALS` is `--values
A=280,G=170,S=215,L=310,M=330`.

```
npm run sim -- --id buffv-a --experiment values --games 500 --depth 3 --seed 1 --eloPerPawn 64 RULES --values A=270,G=180,S=210,L=320,M=350
npm run sim -- --id buffv-b --experiment values --games 500 --depth 3 --seed 1 --eloPerPawn 64 --pieces G RULES VALS
npm run sim -- --id ab-buff-big --experiment ab --games 15000 --sample 150 --depth 3 --seed 11 RULES VALS
npm run sim -- --id ab-buff-d4  --experiment ab --games  1200 --sample  60 --depth 4 --seed 11 RULES VALS
npm run sim -- --id sweep-buff --experiment sweep --arrangements 100 --rounds 2 --games 80 --depth 3 --seed 7 RULES VALS
npm run dashboard
```

Games and minutes: regression 40 / 1.0, `buffv-p1` (the seed-blindness control) 2 500 / 11.3, `buffv-a` plus
`buffv-b` 3 000 / 11.1, `ab-buff-big` 30 000 / 103.8, `ab-buff-d4` 2 400 / 31.2, `sweep-buff` 16 000 / 25.4 — **53
940 games in 184 minutes (3.1 h)**. Two cuts against the brief, both from throughput: the A/B ran on **150 back
ranks, not 200** (the sanctioned cut; two other agents held the machine at 4.8 games/s against the usual 9) and the
depth-4 check ran **20 games a rank, not 40**. Neither changes a verdict — the A/B interval is ±0.009 where ±0.03
would decide it, and no depth-4 metric changes sign.

## 8. What this says about adopting the buff set

**Adopt `archerMove: 'any'` and `beastMove: 'any'`. Do not adopt `guardCaptures: 'pawns'` with `guardStep: 2` as
they stand.** The movement buffs do what §18 promised and cost nothing measurable: the archer reaches 2.82 ± 0.44
pawns and can now be traded, the beast 2.17 ± 0.41 with triple the activity, White's edge does not move at either
depth, and games get shorter with half as many capped.

The guard pair is a different case. It buys the smallest gain of the three — the guard is still a bound below 1.70
pawns, the one piece the method cannot price — and it brings the only new pattern in 30 000 games that changes how
a position feels. In 43.7% of games one side's guard eats three or more pawns, nothing can answer it, and those
games draw at 46.7% against 29.0%; at depth 4, 59.4% of games and 18.3% dead endings. **The pattern grows with
search depth**, so it belongs to the rule, not to a weak engine. The fix is a rule question, not a measurement
question: two candidates, one run each — `guardCaptures: 'pawns'` with `guardStep: 1` (a guard eats only what it
touches; §18 read +4 ± 47 Elo for that alone, so expect no value gain, but the harvest needs the reach), or
`guardStep: 2` with `guardCaptures` back at `'none'` (+1 ± 45, a wall that covers ground). Neither reached a knight
alone, which is why §18 recommended the pair. If the guard must stay under a minor, leave it as it is and let it be
the wall.
