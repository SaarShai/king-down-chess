# Rule A/B — ab-chains

`beastChains=false` against today's defaults.
200 games per population, depth 3, the same 20 arrangements and the same
opening seeds in both (common random numbers).

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is 95% on the mean paired difference over
arrangements.

| metric | defaults (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.510 | 0.547 | +0.037 ± 0.029 | yes |
| decisive | 0.680 | 0.695 | +0.015 ± 0.046 | no |
| draw rate | 0.260 | 0.230 | -0.030 ± 0.053 | no |
| capped | 0.060 | 0.075 | +0.015 ± 0.033 | no |
| mean plies | 133.8 | 140.1 | +6.3 ± 5.9 | yes |
| branching factor | 28.6 | 28.3 | -0.3 ± 0.3 | yes |
| killer move | 0.337 | 0.339 | +0.002 ± 0.022 | no |
| lead change | 0.034 | 0.033 | -0.001 ± 0.002 | no |
| uncertainty late | 0.629 | 0.625 | -0.004 ± 0.003 | yes |
| drama | 0.124 | 0.123 | -0.001 ± 0.015 | no |
| permanence | 0.965 | 0.965 | +0.000 ± 0.001 | no |
| min utilisation | 0.43 | 0.42 | -0.00 ± 0.02 | no |
| interest | 0.383 | 0.394 | +0.003 ± 0.010 | no |

The pooled columns describe each whole population; the difference column is the mean over the
20 arrangements of (rule − default) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
