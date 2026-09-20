# Archer placement: paired 5,000-game near/far comparison (2026-09-17)

A 1,600-game unpaired comparison of 40 near ranks against 40 far ranks found far-apart archers
more decisive: near 0.7794, far 0.8163, far − near **+0.0369 ± 0.0278**
(`docs/research/piece-balance-status-2026-09-17.md`). That interval almost spans zero, so this
report settles the question with 100 ranks and 5,000 games per family, paired by opening seed.

## Method

- **Ranks.** 100 base back ranks from the shipped pool through `randomBackRank`
  (`src/rules/setup.ts`), RNG `mulberry32(929)`. A base is kept only when it holds exactly two
  `A`, one `G` and two `B` on opposite colours. 29,476 draws gave 100 bases: 27,092 draws were
  rejected for missing two `A` plus one `G`, 2,250 for the bishops, 34 because a derivation would
  have broken the bishops' opposite colours.
- **Derived ranks.** For each base, `near` moves only the two `A` so they are adjacent, and `far`
  moves only the two `A` so they are 4+ files apart; each `A` swaps with the piece on its target
  file, so every other letter is untouched. All 100 near ranks hold the `A` at distance 1. The far
  ranks hold them at distance 4 (68 ranks), 5 (17), 6 (9) and 7 (6). The base is already near in 20
  ranks and already far in 44. Both derived ranks stay valid: one `K`, two `B` on opposite colours.
- **Specs.** `sim/specs/arch-2026-09-17/near.json` and `far.json`: 100 ranks each, `games: 5000`,
  `ai: { depth: 3 }`, `seed: 82`, `commonSeeds: true`. Game *i* plays rank *i* mod 100. Game *i* in
  the two files carries the same opening seed (0 mismatches over 5,000 pairs), and each rank played
  exactly 50 games.
- **Runs.** Sequential from the repo root with 4 workers. Near: 5,000 games in 2,347.4 s
  (`sim/out/near.jsonl`, `sim/out/near.summary.json`). Far: 5,000 games in 1,840.2 s
  (`sim/out/far.jsonl`, `sim/out/far.summary.json`). No line is torn or unreadable.
- **Analysis.** Games pair on `gameId`/`seed`. The interval is the sd of the per-game differences:
  1.96 · sd / √5000.

## Pooled result (unpaired, for reference)

| family | games | decisive | draw rate | white score | mean plies |
|---|---|---|---|---|---|
| near (`AA` adjacent) | 5,000 | 0.8046 (4,023) | 0.1954 (977) | 0.5367 | 110.3 |
| far (4+ files apart) | 5,000 | 0.8100 (4,050) | 0.1900 (950) | 0.5256 | 107.7 |
| far − near | | +0.0054 ± 0.0155 | −0.0054 ± 0.0155 | −0.0111 ± 0.0176 | −2.6 |

The pooled gaps are small: +0.54 points of decisive share, −0.54 points of draw rate and −1.1
points of white score. Every interval contains zero. Draw rate is the mirror of decisive share by
construction, so the two intervals are equal.

## Paired result

| metric | mean Δ far − near | paired 95% interval | paired sd | far / near / same pairs |
|---|---|---|---|---|
| decisive | +0.0054 | ± 0.0155 | 0.5584 | 793 / 766 / 3,441 |
| draw rate | −0.0054 | ± 0.0155 | 0.5584 | 766 / 793 / 3,441 |
| white score | −0.0111 | ± 0.0172 | 0.6204 | 1,504 / 1,590 / 1,906 |

Pairing did not shrink the interval. The near and far outcomes correlate −0.011 (decisive) and
−0.005 (white score), because a pair plays two different ranks and shares only the opening seed.
The paired sd (0.5584) is the sd of a difference of two near-independent binary games
(√(2 × 0.16) ≈ 0.566), and the paired interval (± 0.0155) is the same as the unpaired one
(± 0.0155). Across the 100 ranks, far has the higher decisive share on 43 ranks and near on 45
(12 ranks tie); the per-rank difference has sd 0.0842 and ranges from −0.160 to +0.260. No sign is
consistent.

## Verdict

**The "archers apart" effect does not survive the paired 5,000-game sample.** The 1,600-game gap
was +0.0369 ± 0.0278; the 10,000-game paired gap is **+0.0054 ± 0.0155**, one seventh of the size.
The interval excludes the old point estimate. Draw rate moves −0.0054 ± 0.0155 and white score
−0.0111 ± 0.0172, both inside noise. At this sample the half-width is 0.0155, so a true effect of
3.7 points would have shown; the near/far placement of the two archers does not move decisiveness,
draw rate or white score in this design. The earlier reading was sampling noise from 1,600 unpaired
games on 40 hand-built ranks. Both families are also more decisive here (0.8046 and 0.8100) than in
that sample (0.7794 and 0.8163), which points to the rank pool and the sample, not to placement.

Data: `sim/out/near.jsonl`, `sim/out/far.jsonl`, `sim/out/near.summary.json`,
`sim/out/far.summary.json`. Specs: `sim/specs/arch-2026-09-17/near.json`, `far.json`.
