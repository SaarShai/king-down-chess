# Archer × beast four-arm factorial (2026-09-17)

Does the archer's effect change when beasts share the pool, and do the two pieces interact? Four
arms over one pool family answer it: base (neither), A (archers only), B (beasts only), AB (both).
The interaction is `AB − A − B + base`. This runs under today's shipped rules — the archer is
re-priced (`ARCHER_V = 505`) and its shots widened (`archerShots = 'plusDiagFwd2'`, commit
014d824); the beast sits at `BEAST_V = 308`.

## Method

- **Four arms, 1,600 games each at depth 3**, seed 31, 40 sampled back ranks,
  `openingRandomPlies: 4`, `commonSeeds: true`, 7 workers. Specs:
  `sim/specs/factorial-2026-09-17/ab2.{base,A,B,AB}.json`; summaries
  `sim/out/ab2.<arm>.summary.json`.
- **Same arrangements and opening seeds.** Every arm samples 40 ranks with the same seed and the
  same sample count, and `commonSeeds` makes the opening stream follow the repetition index, not
  the configuration (`src/sim/spec.ts:281`). Checked against `buildJobs`: game 0…1599 carries the
  same opening seed in every arm, and each arm draws those 1,600 games from the same 40-seed list.
  The arms differ only in the pool the ranks are sampled from.
- **Interaction interval.** Binomial standard error per arm, se = sqrt(p(1−p)/1600); interval =
  1.96·sqrt(se_base² + se_A² + se_B² + se_AB²). Decisive share and draw rate are one minus the
  other, so their intervals are mirrors. Mean plies is not a proportion, so its se is the per-game
  plies sd / sqrt(1600) instead.
- Raw tables: `sim/out/ab2.base.summary.json`, `sim/out/ab2.A.summary.json`,
  `sim/out/ab2.B.summary.json`, `sim/out/ab2.AB.summary.json`.

## Pools

| arm | pool | letters | content |
|---|---|---|---|
| base | `QLRRBBNNGMM` | 11 | 1 queen, 1 paladin, 2 rooks, 2 bishops, 2 knights, 1 guard, 2 maesters |
| A | `QLRRBBNNAAGMM` | 13 | base + both archers |
| B | `QLRRBBNNGMMSS` | 13 | base + both beasts |
| AB | `QLRRBBNNAAGMMSS` | 15 | base + both archers + both beasts = the shipped `POOL` |

The shipped `POOL` is `QLRRBBNNAAGMMSS` (15 letters, `src/rules/setup.ts:7`). Removing both
archers and both beasts leaves exactly `QLRRBBNNGMM` (11 letters): every remaining letter keeps its
shipped count, so it is the only base that changes nothing else. A 15-letter base cannot exist —
padding would either put a treatment piece back (archer A or beast S) or double a piece past its
shipped count. `sampleBackRank` accepts any pool of ≥7 letters and still enforces opposite-coloured
bishops (`src/sim/spec.ts:165`), so the 11-letter pool is legal. The other three arms add the
treatment letters back at their shipped positions: A and B reach 13, AB reaches the shipped 15. The
AB arm therefore replays the shipped pool and serves as this date's pool baseline.

## Per-arm results

| arm | games | decisive | draw rate | white score | mean plies | capped |
|---|---|---|---|---|---|---|
| base | 1,600 | 74.06% | 25.94% | 55.72% | 109.0 | 10 |
| A | 1,600 | 81.06% | 18.94% | 56.91% | 104.0 | 10 |
| B | 1,600 | 72.75% | 27.25% | 57.31% | 114.8 | 17 |
| AB | 1,600 | 81.50% | 18.50% | 55.31% | 106.6 | 12 |

Main effects against base (percentage points except plies): the archer alone is decisive +7.00,
draw −7.00, score +1.19, plies −5.0; the beast alone is decisive −1.31, draw +1.31, score +1.59,
plies +5.8; both together are decisive +7.44, draw −7.44, score −0.41, plies −2.4. The archer is
the whole decisive-share effect; the beast alone makes games slightly longer and slightly less
decisive.

## Interaction

| metric | base | A | B | AB | interaction (AB − A − B + base) | 95% interval | includes zero |
|---|---|---|---|---|---|---|---|
| decisive | 74.06% | 81.06% | 72.75% | 81.50% | **+1.75 pts** | −2.33 … +5.83 | yes |
| draw rate | 25.94% | 18.94% | 27.25% | 18.50% | **−1.75 pts** | −5.83 … +2.33 | yes |
| white score | 55.72% | 56.91% | 57.31% | 55.31% | **−3.19 pts** | −8.05 … +1.67 | yes |
| mean plies | 109.0 | 104.0 | 114.8 | 106.6 | **−3.20** | −7.96 … +1.56 | yes |

Every interaction interval contains zero. The decisive-share interaction is +1.75 pts against a
binomial interval of ±4.08 pts.

## Verdict

**The combination is additive under this sample; there is no archer+beast synergy.** Adding both
pieces predicts 79.75% decisive from the separate effects (74.06 + 7.00 − 1.31); the AB arm lands
at 81.50%, +1.75 pts above that, and its interval (−2.33 … +5.83) contains zero. The beast adds
nothing measurable on top of the archer: A is 81.06% decisive and AB is 81.50%, a +0.44-pt step
whose interval is ±2.70 pts. The same holds on white score (interaction −3.19 ± 4.86) and mean
plies (−3.20 ± 4.76). The archer's +7.00-pt decisiveness effect is unchanged by the beast's
presence, and the beast's small negative decisive effect (−1.31 pts alone) stays small beside the
archer. With two archers and two beasts per army, the interaction is not needed to explain the
outcomes; re-price and rule changes for the archer can be read without a beast correction at this
depth and sample size.

7 workers per arm, summaries: `ab2.base` 1,365 s, `ab2.A` 645 s, `ab2.B` 729 s, `ab2.AB` 395 s
(other runs shared the machine).
