# Rule A/B — ab-buff

`archerMove=any guardCaptures=pawns guardStep=2 beastMove=any` against today's defaults.
300 games per population, depth 3, the same 30 arrangements and the same
opening seeds in both (common random numbers).

A symmetric rule changes both sides at once, so there is no match to run and no SPRT: this is a
paired two-population comparison. The interval is a 95% normal approximation on the mean paired
difference over arrangements; with few arrangements, and with one interval per metric, read
"significant" as "worth a second run", not as a test.

| metric | defaults (pooled) | with the rule (pooled) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.560 | 0.485 | -0.075 ± 0.037 | yes |
| decisive | 0.547 | 0.583 | +0.037 ± 0.092 | no |
| draw rate | 0.357 | 0.373 | +0.017 ± 0.078 | no |
| capped | 0.097 | 0.043 | -0.053 ± 0.049 | yes |
| mean plies | 151.8 | 141.5 | -10.4 ± 9.3 | yes |
| branching factor | 27.4 | 33.6 | +6.2 ± 1.0 | yes |
| killer move | 0.293 | 0.283 | -0.010 ± 0.034 | no |
| lead change | 0.031 | 0.030 | -0.002 ± 0.007 | no |
| uncertainty late | 0.637 | 0.631 | -0.006 ± 0.007 | no |
| drama | 0.097 | 0.123 | +0.026 ± 0.029 | no |
| permanence | 0.969 | 0.969 | +0.001 ± 0.001 | no |
| min utilisation | 0.40 | 0.35 | -0.04 ± 0.03 | yes |
| interest | 0.374 | 0.425 | +0.066 ± 0.025 | yes |

The pooled columns describe each whole population; the difference column is the mean over the
30 arrangements of (rule − default) on the same openings. The two can disagree in sign when the
pooled value is not a mean of the per-arrangement values (minimum utilisation is one). Trust the
paired column.

Elo of the variant population is not reported: both populations play themselves, so their scores
are not comparable as a match. Read the white score as a fairness check, not as a strength delta.
