# Kit-rich pool vs shipped: does thinning the standards buy more kit pieces and livelier games? (2026-09-17)

The composition mining (`sim-composition-mining-2026-09-17.md`) put the four interaction pieces — archer, paladin, maester, beast, "the kit" (A+L+M+S) — at the centre of event-rich play: every rich mix carries at least three of them, and their presence correlates with decisive share at +4.8 (A), +0.3 (L), −2.9 (M) and +3.0 (S) points. The shipped pool `QLRRBBNNAAGMMSS` draws 7 of 15 letters, so a rank carries **3.25 kit letters on average** in this seed's draw, and **32 of its 40 sampled ranks lack at least one kit piece**. This route tests the designer's composition lever directly: the same pool with one R, one B and one N thinned (`QLRBNAAGMMSS`, 12 letters), so the 7-draw carries more kit. Two 2,000-game arms at depth 3, one seed, 40 ranks each, common opening seeds. **Headline:** the kit-rich pool is measurably more event-rich (**+0.265** of 6 mechanics engaged; paired 95% CI [+0.19, +0.34]) and not measurably more decisive (**+1.75 points**; paired 95% CI [−0.69, +4.19]); White score and game length are flat; the price is composition — the pool holds a third of the shipped pool's distinct mixes and can never field two bishops.

## Method

- **Specs.** `sim/specs/kit-pool-2026-09-17/shipped.json` and `kit.json`. Both carry `games: 2000`, `backRanks: { sample: 40, pool: ... }`, `ai: { depth: 3 }`, `seed: 98`, `commonSeeds: true`. `shipped` uses the shipped pool `QLRRBBNNAAGMMSS` (15 letters: Q1 L1 R2 B2 N2 A2 G1 M2 S2); `kit` uses `QLRBNAAGMMSS` (12 letters: Q1 L1 R1 B1 N1 A2 G1 M2 S2). The only pool difference is one R, one B and one N thinned. `sampleBackRank` (`src/sim/spec.ts:165-174`) draws 7 letters from the pool plus the king.
- **Expected composition.** 7 of the 15 shipped letters are kit letters and 7 of the 12 kit letters are, so the 7-draw carries **3.27** kit letters on average in the shipped pool and **4.08** in the kit pool (the shipped sampler's same-colour-bishop retry makes its accepted value 3.32 when the retry's weighting is counted). The thinned R/B/N cannot be replaced: expected queen presence per rank rises from 46.7% to 58.3%, and the kit pool cannot produce a two-bishop rank at all (max 1 B per draw).
- **Rules.** Neither spec sets `rules` or `values`; both runs logged `rules {}, values {}`, so both arms play today's shipped defaults. `promotionSet` is `anyNonKingNoGuard`, so no pawn promotes to a guard.
- **Runs.** Sequential from the repo root, 4 workers on a shared machine:

  ```
  node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/kit-pool-2026-09-17/shipped.json --workers 4
  node_modules/.bin/tsx src/sim/run.ts --spec sim/specs/kit-pool-2026-09-17/kit.json --workers 4
  ```

  `shipped`: 2,000 games in 798.1 s (2.5 games/s) -> `sim/out/kit-pool-shipped.jsonl` + `.summary.json`. `kit`: 2,000 games in 914.4 s (2.2 games/s) -> `sim/out/kit-pool-kit.jsonl` + `.summary.json`. Each file holds 2,000 complete lines; the recomputed game counts match both summaries.
- **Pairing.** `commonSeeds: true` gives game *i* the same per-game RNG seed in both files (2,000/2,000 match on `gameId` 0–1,999), so each arm plays the same 50 opening streams. The pools differ, so **0 of 2,000 games share a back rank**. Pair correlations are −0.042 (decisive), +0.047 (White score) and −0.011 (plies): game *i* is a same-opening-seed game, not the same opening.
- **Analysis.** Throwaway script `/tmp/kit-pool-analyse.mjs` read both JSONL files. Paired interval: 1.96 · sd(per-game Δ) / √2000 over the 2,000 common `gameId`s. Unpaired interval: 1.96 · √(se₁² + se₂²). Event diversity is the count (0–6) of the six `events` counters that are non-zero in a game: archer shots, beast chain moves (list length), maester swaps, paladin sacrifices, promotions, checks — the mining report's definition.

## The manipulation check

Mean letters per rank over the 40 sampled ranks of each arm (each rank plays 50 games, so the game-weighted and rank-weighted means coincide):

| letter | shipped pool | kit pool | Δ | | letter | shipped pool | kit pool | Δ |
|---|---|---|---|---|---|---|---|---|
| Q | 0.375 | 0.725 | **+0.350** | | A | 0.850 | 1.125 | **+0.275** |
| L | 0.600 | 0.675 | +0.075 | | G | 0.550 | 0.500 | −0.050 |
| R | 1.025 | 0.500 | **−0.525** | | M | 0.875 | 1.150 | **+0.275** |
| B | 0.775 | 0.625 | −0.150 | | S | 0.925 | 1.125 | **+0.200** |
| N | 1.025 | 0.575 | **−0.450** | | **A+L+M+S** | **3.250** | **4.075** | **+0.825** |

The manipulation worked: **the kit draw rises from 3.25 to 4.075 kit letters per rank (+0.825)**, against pool expectations of 3.27 and 4.08. The two arms' kit-count distributions overlap only partly:

| kit letters in rank | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| shipped games | 100 | 450 | 650 | 550 | 150 | 100 |
| kit games | 0 | 0 | 500 | 900 | 550 | 50 |

Presence shares move with the counts: A 65.0% → 85.0%, L 60.0% → 67.5%, M 70.0% → 82.5%, S 77.5% → 82.5%. Ranks holding all four kit pieces rise from 8 of 40 (400 games) to 13 of 40 (650 games).

**The arm is a bundle, not a kit dose.** Thinning duplicates moves every remaining letter's share, and the bishop effect is a rule-scale one: the kit pool cannot draw two bishops, so it never fields a bishop pair; 15 of its 40 realized ranks (37.5%) hold no bishop at all, against 13 (32.5%) in the shipped arm. Realized presence also moves hard on non-kit letters: Q 37.5% → 72.5%, R 85.0% → 50.0%, N 80.0% → 57.5%, G 55.0% → 50.0%. Any result below is the effect of that whole bundle.

## Pooled result

| arm | pool | games | decisive | draw rate | White score | mean plies |
|---|---|---|---|---|---|---|
| shipped | `QLRRBBNNAAGMMSS` | 2,000 | 0.8100 (1,620) | 0.1900 (380) | 0.55250 (915 W / 380 D / 705 B) | 98.62 |
| kit | `QLRBNAAGMMSS` | 2,000 | 0.8275 (1,655) | 0.1725 (345) | 0.54825 (924 W / 345 D / 731 B) | 96.94 |
| kit − shipped | | | +0.0175 ± 0.0239 | −0.0175 ± 0.0239 | −0.00425 ± 0.0279 | −1.68 ± 3.02 |

Draw rate is the exact mirror of decisive share (0.1725 = 1 − 0.8275), so their intervals are equal. The point estimates say the kit-rich pool decides 1.75 more points of games, scores 0.4 points less White and runs 1.7 plies shorter; every unpaired interval contains zero. Draw reasons: `adjudicatedDraw` 290 → 258, `drawRepetition` 50 → 53, `drawMaterial` 16 → 11, `draw50` 10 → 12, `plyCap` 13 → 10, `stalemate` 1 → 1.

## Paired-by-gameId result

| metric | mean Δ kit − shipped | paired 95% interval | paired sd | kit>shipped / kit<shipped / tie |
|---|---|---|---|---|
| decisive | +0.0175 | ± 0.0244 [−0.0069, +0.0419] | 0.5562 | 327 / 292 / 1,381 |
| draw rate | −0.0175 | ± 0.0244 [−0.0419, +0.0069] | 0.5562 | 292 / 327 / 1,381 |
| white score | −0.00425 | ± 0.0272 [−0.0315, +0.0230] | 0.6209 | 602 / 633 / 765 |
| mean plies | −1.68 | ± 3.04 [−4.72, +1.36] | 69.36 | 960 / 1,017 / 23 |
| event diversity | +0.265 | ± 0.0705 [+0.1945, +0.3355] | 1.6091 | — |

Pairing does not shrink the intervals: the paired half-width for decisive (0.0244) is marginally larger than the unpaired one (0.0239), exactly as in the guard pool test, because the two games of a pair share only the opening seed and 0 ranks. The decisive discordance is 327 kit-only decisive games against 292 shipped-only (McNemar z = +1.41); 53 games drew in both arms. Event diversity is the one metric whose interval excludes zero: the same opening seed produces 0.265 more engaged mechanics under the kit-rich pool.

## Event diversity

Mean mechanics engaged per game: **3.300 of 6 (shipped) vs 3.565 of 6 (kit)**, a paired difference of +0.265 [+0.194, +0.336]. Distribution:

| mechanics engaged | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| shipped games | 20 | 118 | 344 | 638 | 577 | 246 | 57 |
| kit games | 12 | 79 | 281 | 521 | 673 | 370 | 64 |

Per-counter means per game, both colours summed:

| counter | shipped | kit | Δ |
|---|---|---|---|
| archer shots | 2.872 | 3.683 | **+0.811** |
| beast chain moves | 1.106 | 1.131 | +0.025 |
| maester swaps | 4.803 | 6.281 | **+1.478** |
| paladin sacrifices | 0.767 | 0.853 | +0.086 |
| promotions | 0.225 | 0.180 | −0.045 |
| checks | 3.378 | 3.274 | −0.104 |

The diversity gain is the archer and the maester, the two kit pieces whose per-rank counts rose most (A 0.850 → 1.125, M 0.875 → 1.150): archer shots +0.81 and maester swaps +1.48 per game. Beast chain moves are flat, paladin sacrifices barely move, and promotions and checks fall slightly. Within each arm the decisive share does **not** rise monotonically with the kit count: shipped ranks with 3 kit letters are 81.2% decisive and with 4 are 78.9%; kit ranks with 3 are 82.0% and with 4 are 80.9% (the 5- and 6-letter kit ranks, 550 and 50 games, sit at 85.8% and 90.0%). That is rank-level selection on 40 ranks, not a dose-response.

## Verdict

**The kit-rich pool makes games more event-rich, and the evidence does not show that it makes them more decisive at depth 3.**

- **Event richness: supported.** +0.265 of 6 mechanics engaged per game, paired 95% CI [+0.194, +0.336] — about one extra mechanic every four games, carried by archer shots (+0.81) and maester swaps (+1.48). This is the "most interesting arrangement" reading the designer asked about, and it survives this controlled pool change.
- **Decisiveness: not established.** +1.75 points of decisive share, paired 95% CI [−0.69, +4.19], McNemar z = +1.41. At 2,000 games per arm the design bounds a rate effect near ±2.4 points, so any true gain above ~4.2 points is ruled out, and the point estimate is compatible with zero. For comparison, applying the mining report's observational per-presence deltas to the realized presence shifts in *this* arm predicts +0.77 points from the four kit pieces alone and +1.95 points from the whole presence bundle (kit + queen + knight + guard + thinned standards). The measured +1.75 sits inside that bundle arithmetic, but about three-fifths of it comes from non-kit letters (queen +0.63, knight +0.41, guard +0.22, thinned rook −0.07), so the test cannot credit the decisive movement — such as it is — to the kit.
- **Fairness and pace: no visible cost.** White score −0.43 points, paired 95% CI [−3.15, +2.30]; mean plies −1.68, paired 95% CI [−4.72, +1.36]. The mining report's concerning paladin-White signal (+4.6 points) does not appear despite L presence rising 7.5 points.
- **Variety: the real price.** The kit pool can produce **315 distinct 7-letter mixes against 1,017** for the shipped pool, and 5,927,040 distinct back-rank strings against 12,752,640 (both counted with the opposite-colour-bishop rule). In a 40-rank sample both arms still realize similar variety (38 distinct ranks shipped, 37 kit), but the pool's ceiling is a third of the shipped pool's. It also **cannot field two bishops at all** (0 of 40 realized kit ranks; 15 hold no bishop), and the queen's rank presence nearly doubles while rook and knight presences fall to half or less.

**Plain reading for the owner.** This is a composition change, not a rule addition, but it is not a free one: the evidence supports the kit-rich pool as an event-richness lever (roughly one extra mechanic engaged every four games) and does not support it as a decisiveness lever, and the pool as specified pays for the kit with the bishop pair and two-thirds of the arrangement variety. If the owner wants the event-richness direction, the two things the route still needs are a depth-4 confirmation and a kit-rich pool that keeps two bishops (e.g. `QLRBBNAAGMMSS`, 13 letters) so the bundle is not the thinned standards. Nothing here changes a shipped rule; the measurement stands alone.

Data: `sim/out/kit-pool-shipped.jsonl`, `sim/out/kit-pool-kit.jsonl`, both `.summary.json` files, log `/tmp/kit-pool-run.log`. Specs: `sim/specs/kit-pool-2026-09-17/`. Script: `/tmp/kit-pool-analyse.mjs` (throwaway, not committed).
