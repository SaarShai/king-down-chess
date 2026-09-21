# Beast `beastCapture=diagonal` at 1,600-game depth 4: pricing and the three-way choice (2026-09-17)

The shipped beast captures on the 7 adjacent squares except straight ahead. Reading B,
`beastCapture: 'diagonal'`, replaces that rule with one sentence, the same for both colours: *a beast
takes diagonally, and keeps taking* (semantics and the implementation seam are in
`sim-beast-diagonal-2026-09-17.md`). The depth-3 comparison was 1,600 games per arm, but depth 4 was
only 400. This route repeats the depth-4 read at 1,600 games per arm and prices the piece, so that A
(`beastCaptureForward=true`), B and C (`beastCapture=diagForward`) stand on the same sample.

## Method

```
node_modules/.bin/tsx src/sim/run.ts --id pb-ab-S-diagonal-d4b --experiment ab --games 1600 --sample 40 --depth 4 --seed 72 --workers 4 --rule "beastCapture=diagonal"
```

Control arm `pb-ab-S-diagonal-d4b.base`, variant arm `pb-ab-S-diagonal-d4b.var`
(`sim/out/pb-ab-S-diagonal-d4b.experiment.md`). 1,600 games per population, 4 workers, ply cap 300,
4 random opening plies, the same 40 arrangements and opening seeds in both arms (common random
numbers). The interval is the 95% normal approximation on the mean paired difference over
arrangements. The base pool reproduces the seed-72 depth-4 read of the other two routes exactly
(white 0.541, decisive 0.756, draws 0.227, mean 116.3 plies), so all three candidates are measured on
one sample.

Value pass, same protocol as A's (`values`, 500 games, depth 3, seed 77, 4 workers):

```
node_modules/.bin/tsx src/sim/run.ts --id pb-S-diagonal-value --experiment values --pieces S --games 500 --eloPerPawn 64 --depth 3 --seed 77 --workers 4 --rule "beastCapture=diagonal"
```

## Depth 4 (1,600 games per population, seed 72)

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.536 | −0.005 ± 0.020 | no |
| decisive | 0.756 | 0.757 | +0.001 ± 0.022 | no |
| draw rate | 0.227 | 0.229 | +0.002 ± 0.024 | no |
| capped | 0.017 | 0.014 | −0.002 ± 0.010 | no |
| mean plies | 116.3 | 114.8 | −1.6 ± 3.5 | no |
| interest | 0.464 | 0.463 | −0.001 ± 0.003 | no |
| interest (min-use) | 0.464 | 0.456 | +0.003 ± 0.008 | no |

Every row covers zero. The 400-game depth-4 read of the same rule (white −0.024 ± 0.038, decisive
+0.003 ± 0.041, draws +0.010 ± 0.043, plies −1.0 ± 6.0) was an underpowered version of these
intervals, not a different result: at 1,600 games the white-score shift is −0.005 ± 0.020 and the
depth-3 sharpening (decisive +0.022 ± 0.020, draws −0.022 ± 0.019) is gone. The remaining rows in
the experiment file are flat (branching factor +0.0 ± 0.2, killer move −0.004 ± 0.007,
excessDecisiveness +0.002 ± 0.011; the residual interest terms are flat). Degeneracy counters barely
move: dead-material endings 71 (4.4%) → 60 (3.8%); games where a king never moved 409 (25.6%) →
415 (25.9%).

## Value pass: the beast prices below the knight it replaces

From `sim/out/pb-S-diagonal-value.experiment.md`, the `S` arm replaces one knight with a beast on one
side under the rule: 250 pairs, pentanomial [72, 48, 85, 20, 25], score 0.378, Elo −87 ± 27,
draws 17.2%, capped 0.8%, mean 97 plies.

| piece | implied value (pawns) | engine seed | research prior | next seed (cp) |
|---|---|---|---|---|
| S (beast) | 1.81 ± 0.42 | 3.77 | 2.20 | 181 |

The point estimate moves 1.96 pawns below the shipped `BEAST_V` 377 (3.77) and the current measured
3.77 ± 0.43 (`pb-values-refresh2`, default rules); the combined 95% error is ±0.60, so the move is
outside the noise — unlike A's +0.57, which sat inside it. B's implied value is level with C's
1.99 ± 0.43 (`pb-S-diagfwd-value`): both readings price the beast at about 1.8–2.0 pawns, below the
knight it replaces (n = 3.16). The Muller fixed point suggests next seed 181, which a second pass
must confirm before it goes into `src/ai/eval.ts`.

## Capture counters

Counted per game over all 1,600 stored games of each arm with a throwaway script under `/tmp` (the
same rule as the sibling reports): a beast capture move is a LAN that starts with `S` and holds at
least one `x`; each `x` is one capture step; a chain move holds two or more `x`. The counter agrees
with the experiment file's event rows (S captures 1.21 → 0.74, `beastChainCaptures` 1.21 → 0.74,
`beastChainMoves` 1.03 → 0.68).

| counter | base | diagonal | change |
|---|---|---|---|
| games with ≥1 beast capture | 735 (45.9%) | 601 (37.6%) | −8.4 points |
| beast capture moves per game | 1.028 (1,644) | 0.682 (1,091) | −33.6% |
| beast captures per game | 1.206 (1,930) | 0.744 (1,191) | −38.3% |
| chain moves (≥2 captures) per game | 0.138 (221) | 0.048 (77) | −65.2% |
| chain steps per game | 0.179 (286) | 0.062 (100) | −65.0% |

The suppression is stable with depth: captures per game fell 1.431 → 0.909 (−36.5%) at depth 3 and
1.206 → 0.744 (−38.3%) at depth 4; the share of games with any beast capture fell 53.6% → 45.2% and
45.9% → 37.6%. This is unlike C, whose suppression deepens with search (−38.9% at depth 3, −55.8% at
depth 4). B keeps a diagonal ambusher that bites in 37.6% of games, but two of five beast captures
and two of three chain steps are gone; the per-piece table shows the beast moving less often
(10.32 → 9.47 moves per game) and surviving slightly more (46.2% → 47.9%), with every other piece
holding its rate (for example P 3.59 → 3.65, Q 0.82 → 0.85).

## Verdict: game-safe, but a measurable weakening of the piece, level with C

On the game axes B is the calmest of the three candidates: **decisive +0.001 ± 0.022, draws
+0.002 ± 0.024, white score −0.005 ± 0.020 and interest −0.001 ± 0.003 all cover zero**, and mean
plies **−1.6 ± 3.5 is the only pace interval of the three that covers zero** (A: −6.6 ± 4.0,
C: −4.8 ± 4.0, both significant). Nothing on the balance, fairness or interest axes moves, so as a
change to the played game B is neutral and safe.

It is not, however, a neutral simplification of the piece. The rule costs **38.3% of beast captures**
and **65.0% of chain steps**, and the value pass prices the beast at **1.81 ± 0.42 pawns against the
measured 3.77 ± 0.43** — a −1.96 move outside the ±0.60 combined interval, below the knight it
replaces, and level with C's 1.99 ± 0.43. That is the same piece-level weakening C shows, approached
from a different direction: B keeps more capture volume than C (0.744 vs 0.533 per game) and loses
less pace, but the two are indistinguishable in implied value. If the intent is a one-sentence rule
that leaves the beast's function and price intact, B fails the price test; if the intent is a simpler
reading of a beast that is allowed to be smaller and slower, B is the safest of the three on the game
axes.

## The three candidates at depth 4 (1,600 games per arm, seed 72, one sample)

Drawn from the three reports and their value runs; all differences are paired means (rule − base) on
the same 40 arrangements, so the base arm is the same pool in every row.

| candidate | rule | white score Δ | decisive Δ | draws Δ | mean plies Δ | beast capture steps per game (base → variant) | implied value (pawns) |
|---|---|---|---|---|---|---|---|
| A | `beastCaptureForward=true` | −0.017 ± 0.022 | +0.014 ± 0.021 | −0.013 ± 0.022 | −6.6 ± 4.0 | 1.206 → 1.561 (+29.4%) | 4.34 ± 0.42 |
| B | `beastCapture=diagonal` | −0.005 ± 0.020 | +0.001 ± 0.022 | +0.002 ± 0.024 | −1.6 ± 3.5 | 1.206 → 0.744 (−38.3%) | 1.81 ± 0.42 |
| C | `beastCapture=diagForward` | +0.005 ± 0.020 | +0.013 ± 0.023 | −0.009 ± 0.021 | −4.8 ± 4.0 | 1.206 → 0.533 (−55.8%) | 1.99 ± 0.43 |

Reference: the shipped default beast measures 3.77 ± 0.43 (`pb-values-refresh2`).

Read the table along two axes. On the game axes all three are balance-neutral — every decisive, draw
and white-score interval covers zero — and only A and C shorten the game measurably. On the piece
axis A raises the beast's captures (+29.4%) and leaves its price on the shipped value (4.34 ± 0.42,
a +0.57 move inside the ±0.60 combined interval), while B and C cut the captures and price the beast
at ~1.8–2.0 pawns, indistinguishable from each other. A is the no-op simplification; B and C are
weakenings that keep the game balanced.
