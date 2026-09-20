# Maester × guard four-arm factorial (2026-09-17)

Does the maester's effect change when a guard shares the pool, and do the two pieces interact? Four
arms over one pool family answer it: base (neither), M (maesters only), G (guard only), MG (both).
The interaction is `MG − M − G + base`. This runs under today's shipped rules: the guard is the
immortal wall (`guardCaptures: 'none'`, `guardImmune: true`) and the maester keeps the long swap
(`maesterLongSwap: true`); values `GUARD_V = 96`, `MAESTER_V = 318` (`src/ai/eval.ts:68`).

## Method

- **Four arms, 1,600 games each at depth 3**, seed 31, 40 sampled back ranks,
  `openingRandomPlies: 4`, `commonSeeds: true`, 4 workers (the machine is shared). Specs:
  `sim/specs/factorial-2026-09-17-mg/mg.{base,M,G,MG}.json`; summaries
  `sim/out/mg.<arm>.summary.json`.
- **Same sampling and opening seeds.** Every arm samples 40 ranks with the same seed and the same
  sample count (40 distinct arrangements per arm), and `commonSeeds` makes the opening stream follow
  the repetition index, not the configuration (`src/sim/spec.ts:281`). Checked against `buildJobs`:
  game 0…1599 carries the same opening seed in every arm (0 of 1,600 differ). The arms differ only
  in the pool the ranks are sampled from — the sampled arrangements follow the pool, and that is the
  treatment.
- **Interaction interval.** Binomial standard error per arm, se = sqrt(p(1−p)/1,600); interval =
  1.96·sqrt(se_base² + se_M² + se_G² + se_MG²). Decisive share and draw rate are one minus the
  other, so their intervals are mirrors. Mean plies is not a proportion: its se is the per-game
  plies sd / sqrt(1,600), read from the raw JSONL (the summary carries no sd). The intervals assume
  independent arms, which is conservative because the common opening seeds make the arms positively
  correlated.
- Raw tables: `sim/out/mg.base.summary.json`, `sim/out/mg.M.summary.json`,
  `sim/out/mg.G.summary.json`, `sim/out/mg.MG.summary.json`.

## Pools

| arm | pool | letters | content |
|---|---|---|---|
| base | `QLRRBBNNAASS` | 12 | 1 queen, 1 paladin, 2 rooks, 2 bishops, 2 knights, 2 archers, 2 beasts |
| M | `QLRRBBNNAASSMM` | 14 | base + both maesters |
| G | `QLRRBBNNAASSG` | 13 | base + the guard |
| MG | `QLRRBBNNAAGMMSS` | 15 | base + both maesters + the guard = the shipped `POOL` |

The shipped `POOL` is `QLRRBBNNAAGMMSS` (15 letters, `src/rules/setup.ts:7`). Removing both maesters
and the guard leaves exactly `QLRRBBNNAASS` (12 letters): every remaining letter keeps its shipped
count, so it is the only base that changes nothing else. A 15-letter base cannot exist — padding
would either put a treatment piece back (maester M or guard G) or double a piece past its shipped
count. `sampleBackRank` accepts any pool of ≥7 letters and still enforces opposite-coloured bishops
(`src/sim/spec.ts:167`), so the 12-letter pool is legal (the archer+beast base used 11). The other
three arms add the treatment letters back at their shipped counts: M and G reach 14 and 13, MG
reaches the shipped 15. The MG arm therefore replays the shipped pool and serves as this date's pool
baseline.

## Per-arm results

| arm | games | decisive | draw rate | white score | mean plies | capped |
|---|---|---|---|---|---|---|
| base | 1,600 | 84.50% | 15.50% | 53.25% | 99.3 | 11 |
| M | 1,600 | 79.38% | 20.63% | 54.13% | 106.4 | 7 |
| G | 1,600 | 83.50% | 16.50% | 55.69% | 103.3 | 10 |
| MG | 1,600 | 80.50% | 19.50% | 54.63% | 105.4 | 4 |

Main effects against base (percentage points except plies): the maesters alone are decisive −5.13,
draw +5.13, score +0.88, plies +7.1; the guard alone is decisive −1.00, draw +1.00, score +2.44,
plies +4.0; both together are decisive −4.00, draw +4.00, score +1.38, plies +6.1. Both pieces make
games longer and less decisive on their own; two maesters cost five times the guard's decisive
share.

## Interaction

| metric | base | M | G | MG | interaction (MG − M − G + base) | 95% interval | includes zero |
|---|---|---|---|---|---|---|---|
| decisive | 84.50% | 79.38% | 83.50% | 80.50% | **+2.13 pts** | −1.64 … +5.89 | yes |
| draw rate | 15.50% | 20.63% | 16.50% | 19.50% | **−2.13 pts** | −5.89 … +1.64 | yes |
| white score | 53.25% | 54.13% | 55.69% | 54.63% | **−1.94 pts** | −6.82 … +2.94 | yes |
| mean plies | 99.3 | 106.4 | 103.3 | 105.4 | **−5.00 plies** | −9.55 … −0.45 | no |

The decisive-share interaction interval contains zero, so there is no synergy to report there. The
mean-plies interval is the only one that excludes zero, on the anti-synergy side.

## Verdict

**The combination is additive on the outcome measures; the only non-additive effect is a small
anti-synergy on game length.** Adding both maesters and the guard predicts 78.38% decisive from the
separate effects (84.50 − 5.13 − 1.00); the MG arm lands at 80.50%, +2.13 pts above that, and its
interval (−1.64 … +5.89) contains zero. The swap engine does not feed the wall: the guard's presence
does not raise decisiveness beyond the sum of the parts (80.50% with the guard vs 79.38% maesters
alone, a +1.13-pt step whose interval is ±2.77 pts). White score is likewise additive (interaction
−1.94 ± 4.88). Mean plies is the exception: the maesters (+7.1 plies alone) and the guard (+4.0
alone) together lengthen games by 6.1 plies, 5.00 fewer than the additive 110.4, and the interval
(−9.55 … −0.45) excludes zero. Games with both pieces are therefore slightly shorter than the
separate effects predict, not longer — a small anti-synergy in length with no matching synergy in
decisiveness. The maesters' −5.13-pt decisive-share cost is not amplified by the guard, and the
guard's own −1.00-pt cost stays small beside them.

4 workers per arm, summaries: `mg.base` 849 s, `mg.M` 1,134 s, `mg.G` 691 s, `mg.MG` 750 s (other
runs shared the machine).
