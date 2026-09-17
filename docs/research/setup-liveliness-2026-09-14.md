# Setup liveliness — completed 2026-09-16

The 2026-09-14 pass saved per-arrangement aggregates (`docs/research/setup-liveliness-2026-09-14.json`,
45577 games over 4120 arrangements) and proposed an integer setup score, but
chose that score on the full data and then evaluated it on the same games — so its "gain" was a
hypothesis, not a held-out result. This pass redoes it: **the score is fitted on 70% of the
arrangements and everything below is measured on the 30% the fit never saw.**

## Dataset and split

- All arrangements from the six depth-3 runs, each with at least one game; arrangements whose capped
  share exceeds 20% are dropped as timeout artefacts (4082 arrangements kept).
- Paladin semantics are the one classification that matters here: the nonPawn runs are tagged and reported separately.
  The corpus is mostly old-paladin (`paladinKamakaze=always`) because it is mostly `nnue-g1`; the
  fit therefore describes the old-paladin game, and the nonPawn subset (40 arrangements, 1 600 games)
  is a small independent check, not the target.
- Split: deterministic FNV-1a hash of the setup string, 70% train / 30% test, **by arrangement**.

## The fitted integer score

Weighted ridge (λ = 1e-3 of the weight total) on `decisive`, coefficients rounded to integers at
scale 1000 (chosen on the **training** half only, rank agreement ρ = 1.000):

```
score = +38·Q +20·N +2·B +6·R +12·A +21·L -37·G -35·M -3·S +0·kingFile +15·guardNextToKing -20·archerEdge +9·beastEdge +2·maesterNearKing
```

Positive terms make a deal **more** decisive (the filter drops the bottom of this score). For
comparison, the inherited `setupScore` (fitted on all data, so optimistic) is evaluated on the same
held-out arrangements.

## Held-out result (test arrangements only)

| filter | kept | decisive | change vs all | White score | plies | dead endings |
|---|---|---|---|---|---|---|
| drop 25% | 880 of 1198 | 73.8% | +1.9 pts (95% 1.4…2.3) | 52.5% | 115 | 1.7% |
| drop 50% | 600 of 1198 | 75.7% | +3.8 pts (95% 3.1…4.5) | 52.1% | 113 | 1.4% |

Inherited `setupScore`, same held-out rows:

| filter | kept | decisive | change vs all | White score | plies | dead endings |
|---|---|---|---|---|---|---|
| drop 25% | 890 of 1198 | 73.8% | +1.9 pts (95% 1.6…2.4) | 52.3% | 115 | 1.7% |
| drop 50% | 596 of 1198 | 76.0% | +4.1 pts (95% 3.2…4.7) | 52.2% | 113 | 1.5% |

**Piece diversity** — share of games whose (both-army) setup contains the piece, all depth-3 games
vs the half the fitted score keeps:

| piece | all | kept half |
|---|---|---|
| A | 73.2% | 78.2% |
| L | 49.8% | 60.6% |
| G | 45.7% | 27.4% |
| M | 74.9% | 55.9% |
| S | 74.8% | 72.3% |

## Reading

Filtering the bottom half by the fitted score gains **3.8 decisive points** on held-out deals (95% bootstrap 3.1…4.5). The effect is real, small, and about the size the 2026-09-14 pass claimed — but that pass could not show it. The inherited `setupScore`, chosen with every arrangement in view, scores 4.1 points on the same held-out rows (95% 3.2…4.7): 0.3 points more than the honestly-fitted score, inside either interval. The **decisive objection is diversity**, not the size of the gain: the filter thins the guard (45.7% → 27.4% of games) and the maester (74.9% → 55.9%) — two of the game's defining pieces — while paladins rise. The proposal's own condition applies: *"Adopt no filter if the gain is weak or it mostly removes the game's defining pieces."* **No filter is adopted**; `New game` keeps drawing from the full pool.

## Limits

- Per-arrangement aggregates, not games: a 9-game arrangement carries a decisive share with a
  standard error around 15 points, and the weighting only partly compensates.
- The corpus is old-paladin; today's game differs in about 8% of games (paladin pawn captures).
- Composition dominates the fit; the placement terms are small and the split leaves them thin.
- A future filter should be fitted on a fresh, single-rule, 100-games-per-arrangement corpus —
  exactly the kind of data the balance lab already knows how to generate.
