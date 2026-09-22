# Paladin presence: controlled pool fairness test (2026-09-17)

The composition mining of 56,000 stored games found a fairness flag: White scored 0.556 when the
drawn rank held a paladin against 0.510 when it did not (+4.6 points), with no decisiveness effect.
That finding was observational: ranks that hold a paladin differ in other letters too. This note
tests the flag with a controlled pool A/B. The answer: **the flag reproduces, and the controlled
effect is larger than the mining estimate, not smaller.**

## Method

Two specs, `sim/specs/paladin-pool-2026-09-17/with.json` and `without.json`. Both play 2,000 games
from a 40-rank sample at depth 3, seed 96, `commonSeeds: true`, with 4 workers. The only change
between the arms is the pool. Both armies in a game carry the same back rank (pairs are off for one
identical engine), so "the paladin is present" always means both sides own one. Depth-4 arms
(800 games per side, seed 97) follow because the depth-3 paired White-score interval excludes zero.

Commands (run from the repo root, sequential, 4 workers):

```
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/paladin-pool-2026-09-17/with.json --workers 4
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/paladin-pool-2026-09-17/without.json --workers 4
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/paladin-pool-2026-09-17/without.json --id pal-without-d4 --games 800 --depth 4 --seed 97 --workers 4
node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/paladin-pool-2026-09-17/with.json --id pal-with-d4 --games 800 --depth 4 --seed 97 --workers 4
```

| arm | id | pool | letters | sample | games | depth | seed |
|---|---|---|---|---|---|---|---|
| with | `pal-with` | `QLRRBBNNAAGMMSS` | 15 | 40 | 2000 | 3 | 96 |
| without | `pal-without` | `QRRBBNNAAGMMSS` | 14 | 40 | 2000 | 3 | 96 |
| with, d4 | `pal-with-d4` | `QLRRBBNNAAGMMSS` | 15 | 40 | 800 | 4 | 97 |
| without, d4 | `pal-without-d4` | `QRRBBNNAAGMMSS` | 14 | 40 | 800 | 4 | 97 |

Records: `sim/out/pal-with.jsonl`, `pal-without.jsonl`, `pal-with-d4.jsonl`,
`pal-without-d4.jsonl` with `.summary.json` beside each. Throwaway analysis scripts lived in
`/tmp` and are not committed.

## Presence and engagement

The paladin sits in `backRankWhite` in **1,000 of 2,000 games (50.00%)** in the with arm and
**0 of 2,000 (0.00%)** in the without arm. The draw picks 7 letters from the pool, so the shipped
pool puts the single paladin in a rank with probability 7/15 = 46.7%; the 40-rank sample realized
20 ranks with it (50%). Treatment engagement is visible in the records: paladin sacrifices occur in
862 of 2,000 with-arm games (0.616 per game) and in 0 without-arm games.

## Pooled results, depth 3

White score is wins + half the draws. The difference is with − without.

| arm | White | W / D / L | decisive | draws | mean plies |
|---|---|---|---|---|---|
| with | **0.5705** | 977 / 328 / 695 | 83.60% | 16.40% | 98.7 |
| without | 0.5082 | 845 / 343 / 812 | 82.85% | 17.15% | 97.5 |
| pooled diff (95% CI) | **+0.0623 [0.0341, 0.0904]** | | +0.0075 [−0.0157, 0.0307] | −0.0075 | +1.27 [−1.85, 4.39] |

In approximate Elo terms White's edge moves from ≈ +6 to ≈ +49, a ≈ +43 swing (the score interval
maps to roughly ±20 Elo). The paladin does not move decisiveness or pace; the whole effect is on
White's score.

The with sample holds slightly fewer knights, rooks and beasts per rank than the without sample
(0.85 / 0.93 / 0.97 against 1.10 / 1.07 / 1.18) and more bishops (0.88 against 0.68). The mining
note's presence coefficients for those pieces predict at most ≈ +0.6 points of the White difference,
so that imbalance cannot explain the +6.2 points.

## Paired by gameId, depth 3

Both files hold all 2,000 gameIds and the seed aligns on every common id. Games pair by index with
the same opening stream (`commonSeeds: true`). The ranks do not pair: the two arms share **0 of 40**
sampled ranks, because the pools differ. The pairing therefore removes opening luck, not rank luck.
The last column clusters the interval by the 40 with-arm ranks (50 games each), which lets the rank
sample carry the variance.

| metric | mean Δ (with − without) | 95% CI | rank-clustered 95% CI |
|---|---|---|---|
| White score | **+0.0622** | [0.0338, 0.0907] | [0.0326, 0.0919] |
| decisive share | +0.0075 | [−0.0158, 0.0308] | — |
| draw rate | −0.0075 | [−0.0308, 0.0158] | — |
| mean plies | +1.27 | [−1.81, 4.35] | — |

The paired White interval **excludes zero** in both the per-game and the rank-clustered form.

Split by the with-arm rank: games whose rank holds the paladin (1,000) show ΔWhite **+0.1045
[0.0653, 0.1437]**; games whose rank does not (1,000) show +0.0200 [−0.0210, 0.0610]. Inside the
with arm alone, the paladin ranks score **0.5990** against **0.5420** for the non-paladin ranks
(20 against 20 rank means, Δ **+0.0570 [0.0225, 0.0915]**). The split is not a clean presence split
(the without arm's ranks for those gameIds are unrelated draws), and the within-arm contrast carries
a small displacement confound: a rank with the paladin holds six other pieces, a rank without holds
seven. Both point the same way as the arm comparison.

## Depth 4 (800 games per side, seed 97)

| arm | White | W / D / L | decisive | draws | mean plies |
|---|---|---|---|---|---|
| with | 0.5506 | 339 / 203 / 258 | 74.63% | 25.37% | 107.5 |
| without | 0.5125 | 310 / 200 / 290 | 75.00% | 25.00% | 115.0 |
| paired Δ (95% CI) | **+0.0381 [−0.0034, 0.0797]** | | −0.0037 [−0.0467, 0.0392] | +0.0037 | −7.53 [−13.16, −1.90] |
| paired Δ, paladin ranks (400 games) | **+0.0663 [0.0075, 0.1250]** | | | | |

The pooled, rank-clustered interval for White at depth 4 is [−0.0022, 0.0784]: it just includes zero
at 800 games, while the paladin-rank subset stays positive and excludes zero. The direction and
roughly the size survive the depth increase; the depth-4 arms also show the with-pool shorter by
7.5 plies (95% CI [−13.2, −1.9]), which the depth-3 arms did not resolve.

## Verdict

**Yes, the paladin's presence shifts the game toward White, and the controlled test makes the flag
bigger, not smaller.** The shipped pool scores White 0.5705 against 0.5082 for the same pool minus
the paladin: **+6.2 points, 95% CI [+3.4, +9.1] paired**, [3.3, 9.2] after clustering by rank.
Inside the shipped pool a rank with the paladin averages +5.7 points of White score against a rank
without ([+2.3, +9.2] on 20 against 20 rank means). The decomposition is consistent: the paladin
ranks alone predict 0.5082 + 0.5 × (0.5990 − 0.5082) = 0.5536 pooled, and the remaining +1.7 points
of the observed 0.5705 comes from the non-paladin ranks of this particular sample scoring above the
without arm (0.5420 against 0.5082; the paired absent-rank interval, [−2.1, +6.1], includes zero).
The effect is present at depth 3 and in the paladin-rank subset at depth 4 (+6.6 points, [0.8,
12.5]); the depth-4 arm average is +3.8 points with an interval that just crosses zero at 800 games.

What this implies for the pool: the draw gives the paladin to **7/15 = 46.7%** of ranks, so about
half of all games carry one per side. Every 10 points of games that carry the paladin adds ≈ +0.57
points to the pooled White score (5.7 points per paladin rank × 0.1). Removing the paladin from the
pool returns White's edge to ≈ 0.51 and deletes 0.616 paladin sacrifices per game.

Candidate fixes, all touching no rule first:

- **Thinner draw.** Drop the paladin (the without arm, measured here: 0.5082), or lower its share of
  the draw (a larger pool, or a pool with two copies of another letter); the White shift scales with
  the share of games that carry it.
- **Price.** Not a lever for this effect. Both armies carry the same rank and the same paladin, so no
  side is mispriced against the other. An eval re-fit cannot equalise a first-move interaction, and
  the earlier rule variants agree: removing the jump left the edge (0.556 against 0.561) and
  `paladinKamikaze=never` still scored White 0.586.
- **A rule.** Not supported by this experiment, which ran no rule arm. The rule family already
  measured (jump removal, never-kamikaze) did not remove the edge, so a new rule is a weaker bet
  than thinning the draw.

Caveats: the engine is fixed-depth (3 and 4) with the shipped evaluation; 40 ranks per arm, none
shared, so pool-level statements rest on the 20-against-20 rank contrast; the analysis scripts were
throwaway and the numbers above come from the stored records and summaries.
