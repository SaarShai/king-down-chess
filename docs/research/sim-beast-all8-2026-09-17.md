# Removing the beast's blind spot at depth 4 (2026-09-17)

The shipped beast captures on the 7 adjacent squares except straight ahead — a blind spot that
reads differently for each colour. `beastCaptureForward=true` removes it: the beast captures on all
8 neighbours, one sentence with no colour asymmetry. The depth-3 run (`pb-ab-S-fwd`, 1,600 games
per arm, seed 71) read balance null and mean plies −10.7 ± 3.5; a 400-game depth-4 arm then read
the plies effect gone (−1.7 ± 7.2). This route settles the question with a 1,600-game depth-4 run
and re-prices the beast under the rule.

## Method

```
node_modules/.bin/tsx src/sim/run.ts --id pb-ab-S-all8-d4b --experiment ab --games 1600 --sample 40 --depth 4 --seed 72 --workers 4 --rule "beastCaptureForward=true"
```

Control arm `pb-ab-S-all8-d4b.base`, variant arm `pb-ab-S-all8-d4b.var`
(`sim/out/pb-ab-S-all8-d4b.experiment.md`). 1,600 games per population, 4 workers, ply cap 300,
4 random opening plies, the same 40 arrangements and opening seeds in both arms (common random
numbers). The interval is the 95% normal approximation on the mean paired difference over
arrangements.

Because decisive, draws and white score all stay inside their intervals, the route's neutrality
gate passes and the value pass runs on the same rule:

```
node_modules/.bin/tsx src/sim/run.ts --id pb-S-all8-value --experiment values --pieces S --games 500 --eloPerPawn 64 --depth 3 --seed 77 --workers 4 --rule "beastCaptureForward=true"
```

Capture counters parse the stored JSONL with a throwaway script under `/tmp`: a beast capture move
is a LAN that starts with `S` and holds at least one `x`; each `x` is one capture step (chains
included). A step is straight ahead when the target shares the beast's file and sits one rank
forward for the mover (white up, black down). The counter agrees with the report's event table:
1.206 capture steps per game base and 1.561 with the rule against `beastChainCaptures` 1.21 and
1.56.

## Depth 4 (1,600 games per population, seed 72)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.524 | −0.017 ± 0.022 | no |
| decisive | 0.756 | 0.771 | +0.014 ± 0.021 | no |
| draw rate | 0.227 | 0.214 | −0.013 ± 0.022 | no |
| capped | 0.017 | 0.015 | −0.002 ± 0.009 | no |
| mean plies | 116.3 | 109.8 | −6.6 ± 4.0 | yes |
| interest | 0.464 | 0.465 | +0.002 ± 0.003 | no |
| interest (min-use) | 0.464 | 0.458 | +0.002 ± 0.007 | no |

The other rows are in `sim/out/pb-ab-S-all8-d4b.experiment.md`: branching factor +0.6 ± 0.3 (yes),
killer move +0.014 ± 0.010 (yes), permanence −0.001 ± 0.001 (yes), excessDecisiveness
−0.012 ± 0.012 (yes); lead change, uncertainty-late, drama and the residual interest terms are
flat. The base arm reproduces `pb-ab-S-diagfwd-d4b.base` exactly (white 0.541, decisive 0.756,
draws 0.227, plies 116.3), as expected from the shared sample and seed.

The three readings of the same rule, paired means (rule − base):

| metric | depth 3, 1,600/arm (seed 71) | depth 4, 400/arm (seed 72) | depth 4, 1,600/arm (seed 72) |
|---|---|---|---|
| white score | +0.008 ± 0.025 | +0.011 ± 0.058 | −0.017 ± 0.022 |
| decisive | +0.018 ± 0.021 | +0.012 ± 0.039 | +0.014 ± 0.021 |
| draw rate | −0.019 ± 0.021 | −0.020 ± 0.038 | −0.013 ± 0.022 |
| mean plies | −10.7 ± 3.5 | −1.7 ± 7.2 | −6.6 ± 4.0 |
| interest | +0.005 ± 0.005 | +0.003 ± 0.005 | +0.002 ± 0.003 |

Balance and interest stay null at every sample size. The 400-game depth-4 "no plies effect" was an
underpowered interval (±7.2), not a reversal: at 1,600 games the pace effect returns, significant
and about 60% of its depth-3 size. Mean plies −6.6 is a 5.7% shortening of the 116.3-ply base
game (depth 3: 9.7%).

## Value pass (500 games, depth 3, seed 77)

From `sim/out/pb-S-all8-value.experiment.md`, the `S` arm replaced a knight with a beast on one
side under the rule: 250 pairs, pentanomial [25, 18, 106, 27, 74], score 0.607, Elo +76 ± 27,
draws 10.6%, capped 0.0%, mean 90 plies.

| piece | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|
| S (beast) | 4.34 ± 0.42 | 3.77 | 2.20 | 434 |

Under the rule the beast implies 4.34 ± 0.42 pawns against the shipped `BEAST_V` 377 (3.77) and the
current measured 3.77 ± 0.43 from `pb-values-refresh2` (default rules). The move is +0.57 with a
combined 95% error of ±0.60, so it is inside the noise: the route does not force a re-price. The
Muller fixed point suggests seed 434, which needs a second value pass to confirm convergence; if
the rule ships, that seed is the one to test.

## Capture counters

Counted per game over all 1,600 stored games of each arm (totals in brackets):

| counter (per game) | base | with the rule | change |
|---|---|---|---|
| beast capture moves | 1.028 (1,644) | 1.211 (1,937) | +0.183 (+17.8%) |
| beast capture steps | 1.206 (1,930) | 1.561 (2,498) | +0.355 (+29.4%) |
| multi-capture chains (moves with ≥2 takes) | 0.138 (221) | 0.228 (364) | +0.089 |
| straight-ahead capture steps | 0.000 (0) | 0.441 (705) | +0.441 |
| capture moves with a straight-ahead take | 0.000 (0) | 0.407 (652) | +0.407 |
| straight-ahead share of capture steps | 0% | 28.2% (705/2,498) | — |

The sanity check holds exactly: the base arm records **zero** straight-ahead beast captures over
1,600 games, so the blind spot is real and the counter detects it; the variant unlocks 705 such
steps. Straight ahead is 28.2% of the variant's beast captures — the rule removes a used square,
not a theoretical one — and beast captures rise 29.4% overall, matching the report's per-piece row
(S captures 1.21 → 1.56, `beastChainCaptures` 1.21 → 1.56, `beastChainMoves` 1.03 → 1.21).

## End reasons (from the two `.summary.json` files)

| reason | base | with the rule |
|---|---|---|
| adjudicatedResign | 1,209 (75.6%) | 1,232 (77.0%) |
| adjudicatedDraw | 223 (13.9%) | 216 (13.5%) |
| drawRepetition | 69 (4.3%) | 70 (4.4%) |
| drawMaterial | 44 (2.8%) | 30 (1.9%) |
| draw50 | 27 (1.7%) | 27 (1.7%) |
| plyCap | 27 (1.7%) | 24 (1.5%) |
| checkmate | 1 | 1 |

Dead-material endings fall 4.4% → 3.6% (draw50 + drawMaterial, 71 → 57); games where a king never
moved rise 25.6% → 29.3% (409 → 469) against a 6-ply shorter game.

## Verdict: safe to ship as a simplification

The neutrality gate holds at depth 4 with the larger sample: **decisive +0.014 ± 0.021, draws
−0.013 ± 0.022 and white score −0.017 ± 0.022 all cover zero**, and **interest is flat**
(+0.002 ± 0.003; min-use +0.002 ± 0.007). The rule is not an invisible no-op — the counters show
it bites, with 0.441 straight-ahead capture steps per game against exactly 0 in the base and 28.2%
of the variant's beast captures — but nothing on the balance, fairness or interest axes moves
outside its interval, and the beast's added takes do not push the game toward draws or one colour.

The one cost is pace: **mean plies −6.6 ± 4.0**, the only significant metric, a 5.7% shorter game
(depth 3 was 9.7%). Capped games do not rise (1.7% → 1.5%, −0.002 ± 0.009); dead-material endings
fall (4.4% → 3.6%). In exchange the rule deletes a colour-dependent special case: the beast
becomes "captures on all 8 neighbours", easier to state, implement and learn.

The value pass leaves the beast at the shipped price within error: implied 4.34 ± 0.42 against
`BEAST_V` 377, a +0.57 move inside a ±0.60 combined interval. If the rule ships, the Muller next
seed is 434; confirm with a second pass before writing it into `src/ai/eval.ts`.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
