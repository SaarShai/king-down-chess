# Beast chains off: what the chain feature contributes

Rules stamp 2026-09-17, depth 3 and depth 4. Compiled 2026-09-20.

## Method

- Depth-3 arms: 1,600 games per population, depth 3, 4 random opening plies, the same
  40 arrangements and the same opening seeds (common random numbers), seed 71, 4 workers.
  The control is a fresh run of today's rules (`sim/out/pb-ab-S-nchains.base.jsonl`);
  the variant sets `beastChains=false` (`sim/out/pb-ab-S-nchains.var.jsonl`).
- The depth-3 white-score difference exceeded its paired interval, so the runbook called
  for a depth-4 arm: 400 games per population, depth 4, seed 72, the same 40 arrangements
  (`sim/out/pb-ab-S-nchains-d4.{base,var}.jsonl`).
- Differences are paired means over the 40 shared arrangements with a 95% normal
  interval. The runbook treats |difference| greater than its interval on decisive,
  draws or white score as consequential.
- Chain counter: a move whose LAN starts with `S` and holds two or more `x` segments.
  Counted per game from the stored JSONL with a throwaway script under `/tmp`. The
  corpus census parsed chains by the same rule and matched `events.beastChains` in all
  8,000 games of that census.
- Census reference (`docs/research/sim-corpus-census-2026-09-17.md`): 0.16 chains per
  game, 13.9% of games; chain games 85.30% decisive against 72.97% for no-chain games,
  a +12.3-point gap (pooled 6,400 unique games).

## Depth 3 (1,600 games per arm, seed 71)

| metric | base (today) | beastChains=false | paired difference ±95% | consequential |
|---|---:|---:|---|---|
| white score | 0.561 | 0.526 | -0.035 ± 0.026 | yes |
| decisive | 0.792 | 0.799 | +0.007 ± 0.027 | no |
| draw rate | 0.198 | 0.194 | -0.004 ± 0.026 | no |
| capped | 0.010 | 0.007 | -0.002 ± 0.005 | no |
| mean plies | 110.3 | 112.1 | +1.9 ± 3.4 | no |
| interest | 0.483 | 0.484 | +0.003 ± 0.005 | no |
| interest (min-use) | 0.483 | 0.484 | +0.008 ± 0.009 | no |

Decisiveness moves +0.7 points and the draw rate moves -0.4 points, both far inside
their intervals. The white score moves -3.5 points, outside its interval.

## Depth 4 (400 games per arm, seed 72)

| metric | base (today) | beastChains=false | paired difference ±95% | consequential |
|---|---:|---:|---|---|
| white score | 0.540 | 0.545 | +0.005 ± 0.040 | no |
| decisive | 0.760 | 0.755 | -0.005 ± 0.045 | no |
| draw rate | 0.212 | 0.228 | +0.015 ± 0.047 | no |
| capped | 0.028 | 0.018 | -0.010 ± 0.021 | no |
| mean plies | 117.2 | 116.1 | -1.1 ± 6.9 | no |
| interest | 0.466 | 0.463 | -0.001 ± 0.005 | no |
| interest (min-use) | 0.466 | 0.442 | -0.009 ± 0.012 | no |

The white score does not confirm: depth 4 gives +0.005 ± 0.040, seven times smaller in
magnitude than the depth-3 move and well inside the interval. The decisive difference stays null
(-0.005 ± 0.045).

## Beast chain counter, from the stored JSONL

| Arm | Games | Games with ≥1 chain | Chains | Chains/game | S capture moves/game | Chain lengths (captures: chains) |
|---|---:|---:|---:|---:|---:|---|
| Depth 3, base | 1,600 | 243 (15.19%) | 279 | 0.174 | 1.134 | 2:186, 3:43, 4:26, 5:14, 6:3, 7:2, 8:3, 10:1, 13:1 |
| Depth 3, beastChains=false | 1,600 | 0 (0.00%) | 0 | 0.000 | 1.339 | — |
| Depth 4, base | 400 | 46 (11.50%) | 51 | 0.128 | 1.088 | 2:38, 3:8, 4:4, 5:1 |
| Depth 4, beastChains=false | 400 | 0 (0.00%) | 0 | 0.000 | 1.133 | — |

The rule switch is complete: zero chains in 2,000 games with the rule off, against 330
chains in 2,000 games with the rule on. The fresh control reproduces the census rate
(0.174 chains/game against the census 0.16; 15.19% of games against 13.9%). With chains
off, S capture moves per game rise from 1.134 to 1.339 at depth 3 and from 1.088 to
1.133 at depth 4: the beast still captures, but only once per move.

## Chains inside the fresh control

Bigger sample, depth-3 base arm only (seed 71). Decisive = White win or Black win.

| Group | Games | Decisive | Decisive % (95% Wilson) | Draws | White score |
|---|---:|---:|---|---:|---:|
| With ≥1 chain | 243 | 214 | 88.07% (83.4–91.6) | 29 (11.93%) | 0.599 |
| No chain | 1,357 | 1,053 | 77.60% (75.3–79.7) | 304 (22.40%) | 0.554 |

The census correlation replicates in the fresh control: a +10.5-point decisive gap
with non-overlapping intervals (census: +12.3 pooled, +6.5 in its control corpus).

## Verdict

Chains do not drive the census correlation. Forcing chains off changes decisiveness by
+0.007 ± 0.027 at depth 3 and -0.005 ± 0.045 at depth 4, and the draw rate by
-0.004 ± 0.026 and +0.015 ± 0.047; every interval contains zero. A causal reading of
the census +12.3 points predicts a large decisive drop; the largest observed drop is
0.5 points, inside its own interval. The correlation is a marker: a game with a chain
is a capture-rich game in which the beast survives long enough to strike twice, and the
fresh control still shows such games at 88.07% decisive against 77.60% without a chain.
The feature itself contributes extra captures inside one move (S capture moves rise
from 1.134 to 1.339 per game when chains are off), not decisiveness.

The depth-3 white-score move (-0.035 ± 0.026) does not confirm at depth 4
(+0.005 ± 0.040). Read it as noise. Interest is flat at both depths: +0.003 ± 0.005 and
-0.001 ± 0.005.
