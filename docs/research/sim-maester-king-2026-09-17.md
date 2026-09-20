# Maester king-swap-anywhere under current rules — 2026-09-17

The shipped long swap fires only when maester and king both stand on the home rank
(`maesterKingSwapAnywhere: false`, `src/rules/engine.ts:407`). The anywhere reading was valued
at 2.5 pawns by an old odds match and never A/B-tested under today's rules. This report measures
what the rule does to the game.

## Method

```
node_modules/.bin/tsx src/sim/run.ts --id pb-ab-M-king --experiment ab --games 1600 \
  --sample 40 --depth 3 --seed 71 --workers 4 --rule "maesterKingSwapAnywhere=true"
node_modules/.bin/tsx src/sim/run.ts --id pb-ab-M-king-d4 --experiment ab --games 400 \
  --sample 40 --depth 4 --seed 72 --workers 4 --rule "maesterKingSwapAnywhere=true"
```

Two self-play populations, 40 shared arrangements, common random numbers; the difference column
is the mean paired difference (rule − base) over the arrangements, 95% normal approximation.
The depth-4 arm was triggered because the depth-3 white score moved past its interval.
Source reports: `sim/out/pb-ab-M-king.experiment.md`, `sim/out/pb-ab-M-king-d4.experiment.md`.

## Depth 3 — 1600 games, seed 71

| metric | base | with the rule | mean paired difference ±95% | consequential |
|---|---|---|---|---|
| white score | 0.561 | 0.573 | **+0.012 ± 0.011** | yes |
| decisive | 0.792 | 0.792 | +0.001 ± 0.014 | no |
| draw rate | 0.198 | 0.199 | +0.001 ± 0.015 | no |
| capped | 0.010 | 0.008 | -0.002 ± 0.003 | no |
| mean plies | 110.3 | 110.9 | +0.7 ± 1.4 | no |
| interest | 0.483 | 0.483 | -0.000 ± 0.002 | no |
| interest (min-use) | 0.483 | 0.477 | -0.001 ± 0.004 | no |

White scored 1.2 ± 1.1 points more with the rule: the only consequential row in the screen, and
the reason for the depth-4 arm. Decisive share, draws, cap rate, plies and both interest readings
stayed inside their intervals.

## Depth 4 — 400 games, seed 72

| metric | base | with the rule | mean paired difference ±95% | consequential |
|---|---|---|---|---|
| white score | 0.540 | 0.516 | -0.024 ± 0.041 | no |
| decisive | 0.760 | 0.757 | -0.003 ± 0.046 | no |
| draw rate | 0.212 | 0.215 | +0.003 ± 0.044 | no |
| capped | 0.028 | 0.028 | +0.000 ± 0.016 | no |
| mean plies | 117.2 | 121.7 | +4.6 ± 4.6 | no |
| interest | 0.466 | 0.467 | +0.001 ± 0.006 | no |
| interest (min-use) | 0.466 | 0.453 | -0.005 ± 0.013 | no |

The depth-3 white-score shift did not replicate: at depth 4 it reversed to -0.024 ± 0.041 and no
outcome metric left its interval. The one depth-4 row outside its interval is
uncertainty late, 0.619 → 0.614, -0.005 ± 0.003 (residual -0.005 ± 0.004) — slightly less
late-game uncertainty, not more, at a magnitude of half a percentage point.

## King mobility and maester swap counters

| counter | d3 base | d3 rule | d4 base | d4 rule |
|---|---|---|---|---|
| king moves per game (both sides) | 10.95 | 11.11 | 15.41 | 17.82 |
| games where a king never moved | 423 (26.4%) | 411 (25.7%) | 106 (26.5%) | 101 (25.3%) |
| maester swaps per game | 6.38 | 6.57 | 5.17 | 5.61 |
| maester long swaps per game | 0.76 | 0.97 | 0.77 | 1.07 |
| checks per game | 3.89 | 3.92 | 6.20 | 7.17 |

`maesterLongSwaps` counts swaps whose destination holds a king (`src/sim/replay.ts:29`). The rule
raises them +0.21 per game at depth 3 (+28%) and +0.30 at depth 4 (+39%). King traffic follows:
king moves rise +0.16 at depth 3 and +2.41 at depth 4, and the share of games where a king never
moved falls 0.7 points (12 games) at depth 3 and 1.2 points (5 games) at depth 4.

## Verdict

- The rule loosens the king but does not sharpen the game. Interest is flat at both depths
  (-0.000 ± 0.002; +0.001 ± 0.006; min-use -0.001 ± 0.004 and -0.005 ± 0.013), and decisive share
  stays inside its interval (+0.001 ± 0.014; -0.003 ± 0.046).
- It does not drag the game either. Draws (+0.001 ± 0.015; +0.003 ± 0.044) and plies
  (+0.7 ± 1.4; +4.6 ± 4.6) drift toward longer games at both depths but never leave their
  intervals; the cap rate does not move (-0.002 ± 0.003; +0.000 ± 0.016).
- Its fairness cost is not established. The one consequential signal was depth-3 white
  +0.012 ± 0.011; depth 4 reversed it to -0.024 ± 0.041. A ~1-point white tilt cannot be ruled
  in or out at 400 games, but it does not survive the deeper arm.
- The rule does exactly one visible thing: it multiplies king traffic through the maester. Long
  swaps onto the own king rise by roughly a third, and depth-4 kings make 2.4 more moves per game
  while the king-never-moved share falls about a point. Nothing downstream — sharpness, fairness,
  length — moves beyond its interval at depth 4, so these numbers give no case to ship the
  anywhere reading and no case that it damages the game. The 2.5-pawn old reading is consistent
  with a near-neutral rule; it is not evidence of a game-sharpening effect at today's rules.
