# Capital C2 at depth 4: the draw reduction holds (2026-09-17)

The 400-game depth-4 arm could not resolve the draw-down signal from depth 3 (draw rate
−0.058 ± 0.064). This report runs the larger sample that arm deferred: 1,600 games per arm at
depth 4, seed 72.

- **Run:** `node_modules/.bin/tsx src/sim/run.ts --id pb-ab-cap-sanct-d4b --experiment ab --games
  1600 --sample 40 --depth 4 --seed 72 --workers 4 --rule "capitalSanctuary=true"`. Control arm
  `pb-ab-cap-sanct-d4b.base` with `rules {}` (today's defaults); the same 40 arrangements and the
  same opening seeds in both arms (common random numbers). Raw table:
  `sim/out/pb-ab-cap-sanct-d4b.experiment.md`.
- The difference column is the mean of (rule − base) over the 40 shared arrangements with a 95%
  normal interval. Seed 72 is independent of the depth-3 seed 71, so agreement in sign across the
  two runs is a genuine replication, not a re-read of the same games.

## Depth 3 for context (1,600 games per arm, seed 71)

From `sim/out/pb-ab-cap-sanct.experiment.md`:

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.561 | 0.527 | −0.034 ± 0.030 | yes |
| decisive | 0.792 | 0.823 | +0.031 ± 0.033 | no |
| draw rate | 0.198 | 0.160 | −0.038 ± 0.031 | yes |
| capped | 0.010 | 0.018 | +0.008 ± 0.009 | no |
| mean plies | 110.3 | 105.7 | −4.6 ± 4.6 | yes |
| interest | 0.483 | 0.490 | +0.007 ± 0.005 | yes |
| interest (min-use) | 0.483 | 0.490 | +0.011 ± 0.008 | yes |
| branching factor | 32.7 | 34.3 | +1.6 ± 0.5 | yes |
| killer move | 0.331 | 0.369 | +0.038 ± 0.019 | yes |

## Depth 4 (1,600 games per arm, seed 72)

From `sim/out/pb-ab-cap-sanct-d4b.experiment.md`:

| metric | base (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.541 | 0.542 | +0.001 ± 0.028 | no |
| decisive | 0.756 | 0.769 | +0.013 ± 0.026 | no |
| draw rate | 0.227 | 0.200 | −0.027 ± 0.026 | yes |
| capped | 0.017 | 0.031 | +0.014 ± 0.011 | yes |
| mean plies | 116.3 | 112.5 | −3.9 ± 4.8 | no |
| interest | 0.464 | 0.466 | +0.002 ± 0.004 | no |
| interest (min-use) | 0.464 | 0.466 | +0.012 ± 0.014 | no |
| branching factor | 30.5 | 32.1 | +1.6 ± 0.4 | yes |
| killer move | 0.223 | 0.246 | +0.023 ± 0.013 | yes |

Two further depth-4 rows agree with the rule's floor on captures: excessDecisiveness (resid.)
0.020 → −0.013, −0.026 ± 0.012 (yes); permanence 0.967 → 0.964, −0.003 ± 0.001 (yes). Drama
0.145 → 0.136, −0.009 ± 0.010 (no).

Piece context at depth 4, pooled: survival rises for every piece (pawn 34.7% → 43.7%, maester
36.2% → 47.6%, rook 29.5% → 44.4%, archer 51.1% → 63.5%, knight 14.4% → 28.0%, paladin 7.4% →
13.9%). Captures fall for eight of the ten capturing pieces (pawn 3.59 → 2.98, rook 1.67 → 1.15,
archer 4.30 → 3.74, bishop 1.52 → 1.04) and rise slightly for the knight 1.55 → 1.57 and beast
1.21 → 1.34. Maester swaps rise 5.50 → 6.86, the substitute for the lost captures.

Degeneracy counters at depth 4: dead-material endings 71 (4.4%) → 47 (2.9%); kings that never
moved 409 (25.6%) → 550 (34.4%); guard captures 0.000 per game in both arms, no guard rampage
(0.0% both).

## Verdict: confirmed — the draw reduction survives, at the cost of branching and capped games

The deciding metric clears both bars. **Draw rate −0.027 ± 0.026: the interval excludes zero, and
the sign matches depth 3 (−0.038 ± 0.031).** Pooled draws fall 0.227 → 0.200. The 400-game arm saw
the same sign (−0.058) but with ±0.064 could not exclude zero; 4× the games halves the interval
and keeps the signal. The draw reduction is **confirmed** at depth 4.

What it costs:

- **White score: nothing.** +0.001 ± 0.028 (0.541 → 0.542). The depth-3 white-score move
  (−0.034 ± 0.030, then read as movement toward fairness) does not reproduce on the independent
  seed. Fairness is unchanged at depth 4.
- **Branching: +1.6 ± 0.4** (30.5 → 32.1), confirmed and identical to depth 3 (+1.6 ± 0.5). This
  is the one cost that repeats at full size.
- **Plies: −3.9 ± 4.8** (116.3 → 112.5), not confirmed — the interval includes zero. The point
  estimate has the same direction and similar size as depth 3 (−4.6 ± 4.6), but shorter games are
  not established at depth 4.
- **Capped games: +0.014 ± 0.011** (1.7% → 3.1%), confirmed. More games run into the ply cap; the
  depth-3 rise (+0.008 ± 0.009) was inside its interval, this one is not.
- **Interest: unchanged.** +0.002 ± 0.004 (0.464 → 0.466); min-use +0.012 ± 0.014. The depth-3
  interest rise (+0.007 ± 0.005) does not reproduce.

Decisive rises +0.013 ± 0.026 and stays inside its interval, as at depth 3 (+0.031 ± 0.033); only
the draw half of the depth-3 outcome shift is confirmed. The rest of the depth-3 context repeats
in direction: kings that never moved 25.6% → 34.4% (depth 3: 26.4% → 35.9%), dead-material
endings fall 4.4% → 2.9% (depth 3: 0.9% → 0.9%), and captures fall with survival up for every
piece.

Net: the rule is not a draw engine. It cuts draws by ~2.7 points at depth 4, holds white score
flat, and pays in branching (+1.6 moves) and capped games (1.7% → 3.1%). The depth-3 plies and
interest gains are not confirmed.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
