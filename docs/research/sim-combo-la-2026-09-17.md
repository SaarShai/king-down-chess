# Paladin × archer four-arm factorial (2026-09-17)

Do the archer's new forward shots and the paladin's jumps feed each other, or do the two "reach"
pieces combine additively? Four arms over one pool family answer it: base (neither), L (paladin
only), A (archers only), LA (both). The interaction is `LA − L − A + base`. This runs under today's
shipped rules: the archer is re-priced (`ARCHER_V = 505`, 5.05 pawns) with widened shots
(`archerShots: 'plusDiagFwd2'`); the paladin sits at `PALADIN_V = 408` (4.08 pawns)
(`src/ai/eval.ts:68`).

## Method

- **Four arms, 1,600 games each at depth 3**, seed 31, 40 sampled back ranks,
  `openingRandomPlies: 4`, `commonSeeds: true`, 4 workers. Specs:
  `sim/specs/factorial-2026-09-17-la/la.{base,L,A,LA}.json`; summaries
  `sim/out/la.<arm>.summary.json`.
- **Same arrangements and opening seeds.** Every arm samples 40 ranks with the same seed and the
  same sample count, and `commonSeeds` makes the opening stream follow the repetition index, not
  the configuration (`src/sim/spec.ts:281`). Each arm draws its 1,600 games from the same 40-seed
  list (streams 0…39, 40 games each); the arms differ only in the pool the ranks are sampled from.
- **Interaction interval.** Binomial standard error per arm, se = sqrt(p(1−p)/1600); interval =
  1.96·sqrt(se_base² + se_L² + se_A² + se_LA²). Decisive share and draw rate are one minus the
  other, so their intervals are mirrors. The summary stores no per-game plies sd, so the plies se
  was computed from the stored JSONL (per-game sd / sqrt(1600)); that interval is **approximate**
  — it treats the four arms as independent and normal-approximates a right-skewed plies
  distribution with ply caps.
- Raw tables: `sim/out/la.base.summary.json`, `sim/out/la.L.summary.json`,
  `sim/out/la.A.summary.json`, `sim/out/la.LA.summary.json`.

## Pools

The shipped `POOL` is `QLRRBBNNAAGMMSS` (15 letters, `src/rules/setup.ts:7`); it holds exactly one
paladin (L) and two archers (A).

| arm | pool | letters | content |
|---|---|---|---|
| base | `QRRBBNNGMMSS` | 12 | shipped pool minus the paladin (L) and both archers (A); every other letter keeps its shipped count |
| L | `QLRRBBNNGMMSS` | 13 | base + the one paladin |
| A | `QRRBBNNAAGMMSS` | 14 | base + both archers |
| LA | `QLRRBBNNAAGMMSS` | 15 | base + the paladin + both archers = the shipped `POOL` |

A 15-letter base cannot exist: the shipped pool minus the three treatment letters is exactly these
12, and padding would either put a treatment piece back or double a non-treatment piece past its
shipped count. `sampleBackRank` accepts any pool of ≥7 letters and still enforces opposite-coloured
bishops (`src/sim/spec.ts:165`), so the 12-letter base is legal. The LA arm replays the shipped
pool and serves as this date's pool baseline.

## Per-arm results

| arm | games | decisive | draw rate | white score | mean plies | capped |
|---|---|---|---|---|---|---|
| base | 1,600 | 71.88% | 28.13% | 53.87% | 116.8 | 16 |
| L | 1,600 | 72.81% | 27.19% | 56.59% | 118.9 | 27 |
| A | 1,600 | 80.38% | 19.63% | 50.06% | 108.6 | 7 |
| LA | 1,600 | 80.50% | 19.50% | 54.63% | 105.4 | 4 |

"capped" counts games ended by the ply cap (300). Main effects against base (percentage points
except plies): the paladin alone is decisive +0.94, draw −0.94, score +2.72, plies +2.1; the
archers alone are decisive +8.50, draw −8.50, score −3.81, plies −8.2; both together are decisive
+8.63, draw −8.63, score +0.76, plies −11.4. The archers carry nearly all of the decisive-share
effect. The paladin alone raises white score; the archers alone lower it; together the score is
near base.

## Interaction

| metric | base | L | A | LA | interaction (LA − L − A + base) | 95% interval | includes zero |
|---|---|---|---|---|---|---|---|
| decisive | 71.88% | 72.81% | 80.38% | 80.50% | **−0.81 pts** | −4.96 … +3.33 | yes |
| draw rate | 28.13% | 27.19% | 19.63% | 19.50% | **+0.81 pts** | −3.33 … +4.96 | yes |
| white score | 53.87% | 56.59% | 50.06% | 54.63% | **+1.85 pts** | −3.03 … +6.73 | yes |
| mean plies | 116.8 | 118.9 | 108.6 | 105.4 | **−5.25 plies** | −10.17 … −0.33 (approx.) | no |

The decisive-share interaction interval contains zero: **no synergy and no anti-synergy on the
outcome** — adding the paladin on top of the archers moves decisiveness by +0.13 pts (A 80.38% →
LA 80.50%), well inside the ±2.75-pt noise of that step. The white-score interaction is likewise
consistent with zero. The plies interaction is the one term whose approximate interval excludes
zero (both pieces shorten games; together they shorten by about 5 plies more than the sum of their
separate effects), so the combination is mildly super-additive on game length only.

## Verdict

**Additive on decisive share; the paladin and the archer do not measurably feed each other.** From
the separate effects, the LA arm would land at 81.31% decisive (71.88 + 0.94 + 8.50); it lands at
80.50%, −0.81 pts below the additive prediction with a 95% interval of −4.96 … +3.33. The archer's
+8.50-pt decisiveness effect is essentially unchanged by the paladin (+8.63 pts to both against
base), and the paladin's small +0.94-pt effect is unchanged by the archers (+0.13 pts on top of
them). White score (+1.85 ± 4.88 pts) agrees. The only non-additive term is mean plies
(−5.25, approximate interval −10.17 … −0.33), i.e. games get shorter slightly faster than the two
main effects predict; that does not convert into a decisive-share or score synergy. At this depth
and sample size, archer and paladin re-pricing can be read without a combination correction, and
the shipped pool (`LA`) measures 80.50% decisive, 54.63% white score, 105.4 mean plies.

4 workers per arm, summaries: `la.base` 1,029 s, `la.L` 1,169 s, `la.A` 719 s, `la.LA` 888 s
(other runs shared the machine).
