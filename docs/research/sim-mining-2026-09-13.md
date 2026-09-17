# Mining the recorded games — what makes a back rank interesting or unbalanced (2026-09-13)

No games were played for this document except one 100-game pilot (§7). Everything else is the
**40 000 games already on disk**, read again with `tools/mine.ts`.

```
npx tsx tools/mine.ts                                  # sweep-p2.r1 + r2: 9 600 games, 60 back ranks
npx tsx tools/mine.ts --runs sweep-d3.r1,sweep-d3.r2 --min 20   # 4 000 games, 100 ranks, pass-1 engine
npx tsx tools/mine.ts --specs                          # write sim/specs/batch3/*.json
```

The two sweeps ran on **different engines** — `sweep-d3` used the pass-1 piece values, `sweep-p2`
the pass-2 ones — so they are never pooled. `sweep-p2` is the primary sample (60 ranks, 80 or 240
games each). `sweep-d3` is the replication (100 ranks, 20 or 60 games each): noisier per rank, but
an independent engine. **A finding is only reported below if it appears in both.**

Caveat that governs everything: at 240 games a rank's score carries sd 0.027, the real spread
between ranks is about 0.013 (sim-results §15), and 79 features × 8 outcomes produce about 32
starred correlations by chance. So the correlation scan is a **candidate generator**, not a result.
Every number quoted below is read back in game units with an error bar over *ranks*, because the
rank, not the game, is the independent unit.

---

## 1. The strongest finding: pace is army value, not fairy count

`armyValue` is the total measured value of the seven non-king pieces (sim-results §14: P 1.00,
N 3.20, B 3.30, R 5.00, Q 9.00, L 3.06, M 3.28, and A / G / S each at the 1.70 band floor).

| correlate | draw rate | mean plies |
|---|---|---|
| **armyValue** | **−0.69** \* | **−0.79** \* |
| fairyCount | +0.54 \* | +0.66 \* |
| replication (`sweep-d3`), fairyCount | +0.50 \* | +0.57 \* |

Army value beats fairy count on both, and the reason is arithmetic. The pool is
`QLRRBBNNAAGGMMSS`, which holds **exactly seven standard pieces**, so `QRRBBNN` at 32.00 pawns is
the only all-standard army the game can build. Every fairy piece a rank takes on replaces a
standard one, and three of the five fairy pieces are bounded under 1.70 pawns. Across the 60 ranks
the army value runs from **30.48 down to 16.48** — a spread of 14 pawns, nearly half an army.

| fairy count | ranks | draw rate | mean plies | interest |
|---|---|---|---|---|
| 2 | 6 | 0.221 ± 0.023 | 109 ± 5 | 0.416 |
| 3 | 15 | 0.279 ± 0.019 | 127 ± 4 | 0.419 |
| 4 | 19 | 0.338 ± 0.021 | 141 ± 4 | 0.396 |
| 5 | 19 | 0.366 ± 0.018 | 152 ± 4 | 0.377 |
| 6 | 1 | 0.438 | 180 | 0.335 |

Monotone, and it replicates on the pass-1 engine (0.148 → 0.262 → 0.336 → 0.361 → 0.356). Read it
as **"a fairy-heavy arrangement is a materially poorer arrangement, and poor armies grind."** The
design question is therefore not "how many fairy pieces" but "are the fairy pieces worth anything",
which is the §18 buff question by another route.

`b3-val-*` and `b3-iso-*` separate the two: L and M price at a knight, so fairy count can be raised
0 → 3 with the army held inside 0.25 pawns. It cannot be raised past 3 at constant value — and that
impossibility is the finding.

## 2. The queen is the decisiveness knob

| | draw rate | mean plies | White score |
|---|---|---|---|
| queen present (30 ranks) | 0.268 ± 0.015 | 125 ± 3 | 0.527 |
| no queen (30 ranks) | 0.376 ± 0.012 | 152 ± 3 | 0.517 |

**−10.8 draw points and −27 plies.** Replicated (0.257 vs 0.348; 122 vs 141). One queen is worth
about two fairy slots of pace. Whatever else a pool does, dropping the queen makes the game longer
and drawer than any other single change available.

## 3. Guards wall the game — H10 confirmed, at fixed value

The archer and the guard are both bounded at 1.70 pawns, so A → G is the one swap in this game that
changes the piece and nothing else. Holding the army at `QRRB?ᵍN` (28.90 pawns, fairy count 2):

| guards | ranks | draw rate | mean plies |
|---|---|---|---|
| 0 | 18 | 0.272 ± 0.021 | 128 ± 5 |
| 1 | 29 | 0.331 ± 0.015 | 143 ± 4 |
| 2 | 13 | 0.372 ± 0.026 | 141 ± 5 |

**+10.0 draw points from 0 to 2 guards.** fairy-values H10 predicted "a monotone rise of at least 10
points"; it lands on the number. The replication is stronger still (0.229 → 0.319 → 0.369, +14.0).
Guard survival is **0.966 ± 0.024** — H10's "near 100%" as well.

The guard-versus-*balance* reading does not replicate (score rises with guards in `sweep-p2`, falls
in `sweep-d3`), so guards affect pace, not fairness.

## 4. The paladin is the only fairy piece that sharpens the game

| | draw rate | mean plies | White score |
|---|---|---|---|
| paladin present (29 ranks) | 0.290 ± 0.015 | 134 ± 4 | 0.533 |
| none (31 ranks) | 0.352 ± 0.016 | 143 ± 4 | 0.511 |

Replicated (0.268 vs 0.324). It is also the piece that dies: **paladin survival 0.070** — a paladin
is off the board at the end of 93 % of the games it starts — and it captures in 89 % of them, at
0.63 kamikaze sacrifices per game. fairy-values H5 predicted "over 30 % never capture"; the measured
figure is 11 %. **The paladin is not a one-shot that often misses. It is a one-shot that almost
always fires.**

## 5. Dead weight

| piece | utilisation | survival | ever captures, per game held | never leaves its square |
|---|---|---|---|---|
| M maester | **2.45** | 0.537 | 0.716 | 0.02 |
| G guard | 2.09 | **0.966** | **0.000** | 0.08 |
| A archer | 1.60 | 0.710 | 0.855 | 0.10 |
| L paladin | 0.87 | **0.070** | 0.892 | 0.01 |
| S beast | **0.45** | 0.661 | 0.452 | **0.20** |
| Q / R / B / N | 1.26–1.71 | 0.15–0.31 | 0.89–0.94 | 0.00–0.06 |

Two pieces are dead weight, in opposite ways.

**The beast is ornamental.** It moves least (utilisation 0.45, against 0.43 for a pawn), it survives
because nobody troubles to take it, it never leaves its start square in **20 %** of games, and it
captures in fewer than half the games it appears in. Its chain — the mechanic it was built around —
fires 341 times in 4 119 chain moves (**8.3 %** of length ≥ 2), confirming fairy-values H7.

**The guard captures nothing, ever: 0 of 13 120 games.** That is `guardCaptures: 'none'` working as
written, and it makes the guard a permanent, immortal, inert wall — 96.6 % survival and zero
offence. It is not dead in the utilisation sense (2.09, it shuffles constantly); it is dead in the
*board-state* sense, because nothing it does can ever change the material count.

One degeneracy worth the designer's eye: of 3 357 promotions, **260 (7.6 %) choose a guard**, not a
queen. The engine is paying nine pawns' worth of promotion to buy an uncapturable blocker.

## 6. Placement matters for the one-square pieces, and only for them

Archer shots, by the file the shooting archer stands on:

| a | b | c | d | e | f | g | h |
|---|---|---|---|---|---|---|---|
| 1 427 | 2 541 | 3 915 | 4 303 | **4 431** | 3 266 | 1 913 | **827** |

A centre archer shoots **5.4×** as often as an h-file archer. Share of games in which a piece never
leaves its start square, by start file:

| piece | a | b | c | d | e | f | g | h |
|---|---|---|---|---|---|---|---|---|
| S beast | **0.31** | 0.21 | 0.15 | 0.20 | 0.15 | 0.19 | 0.14 | **0.30** |
| A archer | 0.13 | 0.13 | **0.02** | 0.06 | 0.05 | 0.08 | 0.15 | 0.16 |
| G guard | 0.13 | 0.03 | 0.07 | 0.06 | 0.07 | 0.04 | 0.07 | 0.14 |
| N / B / L / M / Q | 0.00–0.03 everywhere | | | | | | | |

This is chess960.md §7.10 ("short-range fairy pieces suffer most in a corner") measured: a corner
beast is twice as likely to be furniture as a centre beast, and a corner archer up to eight times.
The sliders and the knight do not care where they start.

Captures cluster, as expected, on ranks 4–5 of the centre files (10 024 on d5, 10 011 on e5, from
the capturing side's view) and are 15× rarer on the back ranks.

## 7. The maester is castling, and it is the busiest piece on the board

Per game: **7.44 maester swaps, 1.38 of them long**. A long swap happens in **43.3 %** of games, at a
**median ply of 11**. fairy-values H9 predicted "over 40 % before ply 30" — confirmed with room to
spare. Combined with the highest utilisation in the game (2.45), the maester is the piece the engine
actually plays. Other events per game: 2.36 archer shots, 6.76 checks, 0.63 paladin sacrifices,
0.43 beast chain moves, 0.35 promotions.

## 8. Balance is not a property of the back rank at this budget

No feature correlates with `|score − 0.5|` or `|score − 0.519|` above the noise in both samples. The
largest candidates (`adj_KL` +0.30, `adj_MQ` +0.31, `adj_NS` +0.31, `adj_KN` −0.30) sit inside the
32 stars the scan is expected to produce by chance, and none replicates. King file, queen corner and
bishops-in-corners — the Chess960 features — all read zero. That matches the measured between-rank
spread of 0.013, about **9 Elo**: the game is far more forgiving of its own arrangement than
Chess960 is. The extremes need 500 games each before they can be called extremes (`b3-deep5`).

## 9. The interest axis is currently a beast detector

`nS` correlates **−0.77** with the interest score; `sweep-d3` replicates at −0.75. All ten
top-interest ranks contain **no beast**; the bottom ten average 1.3 beasts. This is not a discovery
about fun — it is mechanical. Interest puts +0.20 on the **minimum** fairy utilisation, one beast
drags that minimum to 0.45, and the whole rank loses 0.11 of interest for it.

Take the utilisation term out and residualise on draw rate, and the spread across ranks collapses
from ±0.10 to **±0.019**, against a sampling noise of about 0.008. **No back rank is distinguishable
from another on interest once the beast is accounted for.** Until the beast is fixed or the gate is
changed, the interest ranking should not be used to choose arrangements.

## 10. Pilot: the measured values do not add up into armies

The one run played for this document — 100 games, `sim/specs/batch3/b3-armies.json`, 20 placements,
colour-reversed pairs:

- **court** `AAGMMQN` = 23.86 measured pawns
- **horde** `SSLQBBG` = 23.76 measured pawns

The court scored **0.790 ± 0.041** — about +225 Elo where matched values predict zero. The horde
holds *more* conventional material (Q + B + B + L = 20.36 against Q + N + M + M = 18.68) and still
loses badly. The reading that fits §5: **two beasts are close to a two-piece handicap**, so the
1.70-pawn band floor overprices them badly in company. 100 games is a pilot, not a result; the
2 000-game arm is `b3-armies`.

---

## 11. Batch 3 — 29 specs, 69 300 games, about 3.9 h at 5 games/s

`npx tsx tools/mine.ts --specs` regenerates every file in `sim/specs/batch3/` from its seed, so the
lists are reproducible. Each carries its hypothesis in a `note` field the runner ignores. Ordered by
expected information gain; the first four are the 50-minute set if the budget is short.

| # | specs | hypothesis | games | min |
|---|---|---|---|---|
| 1 | `b3-val-f0…f3` | Hold the army at 31.9 ± 0.1 pawns and raise fairy count 0 → 3. If draws and length stop rising, §1's whole effect is material, not fairy pieces. | 8 000 | 27 |
| 2 | `b3-iso-v32/27/22` | The mirror image: fairy count fixed at 3, army stepped 31.92 → 27.40 → 21.70. Pace should track the value column, not the fairy column. | 6 000 | 20 |
| 3 | `b3-guard0/1/2` | A → G at 28.90 pawns and fairy 2 — the only swap that isolates a piece. H10 predicts +10 draw points and guard survival near 1. | 6 000 | 20 |
| 4 | `b3-deep5` | 500 games each on `SKANSGGR` (0.475) and `BKMLQRGA` (0.558), the two lopsided ends; `NAGQKGBM` and `GRMGKNBB`, the two most interesting; `ARNAKSNG` (0.375 at n = 80), the biggest raw outlier. sd falls 0.027 → 0.018. | 2 500 | 8 |
| 5 | `b3-armies` | Court 23.86 vs horde 23.76, matched on the measured values. The pilot read 0.790; 2 000 games gives ±0.018. If it holds, the band floor overprices the beast and the guard in bulk. | 2 000 | 7 |
| 6 | `b3-beast-corner/centre` | Both beasts on a/h against both on d/e, army fixed at 29.00. A corner beast never moves in 31 % of games; does the centre recover it, or is the piece dead wherever it stands? | 6 400 | 21 |
| 7 | `b3-archer-corner/centre` | Same shape for archers, which shoot 5.4× as often from e as from h. Expect the corner arm to fail the utilisation gate and to play longer. | 6 400 | 21 |
| 8 | `b3-rule-base` + `noArcherCheck` / `noGuardImmune` / `noLongSwap` | The §18.4 buff set as the base, then one removal each, paired on one set of 20 ranks and seeds. Can a buffed archer give up the check? Is the wall still a wall once it is takeable? Does removing the swap cost the 15–40 Elo H9 predicts? | 8 000 | 27 |
| 9 | `b3-mirror-same` / `-indep` | The same army, mirrored against drawn independently per side. Mirroring may be hiding the imbalance that §8 cannot find. | 4 000 | 13 |
| 10 | `b3-nobeast` | A sampler with no beast in it. Every term except `minFairyUse` should be unchanged; if anything else moves, §9 is wrong about the artefact. | 3 200 | 11 |
| 11 | `b3-archer-beside-G` / `-far-G` | fairy-values H4: guards wall the archer in while archers shoot through the wall. The sweep read +0.20 (n.s.); this asks it directly. | 6 400 | 21 |
| 12 | `b3-maester-beside-K` / `-far-K` | King flanked by a maester against every maester ≥ 3 files away, army fixed at 32.16. The long swap needs neither, so any difference is the short swap and king safety. | 6 400 | 21 |
| 13 | `b3-paladin2` / `-paladin0` | Two paladins (29.92) against two knights (30.28). A piece that dies in 93 % of games may not be linear in its own count. | 4 000 | 13 |

Every spec runs at depth 3 with `commonSeeds: true`, so arms of one experiment share their openings
and the comparison is paired. Read every arm against its own base, never across experiments.

Three things this batch deliberately does not do. It does not re-measure White's edge (stable at
+30 Elo across two depths). It does not touch the interest weights (SIM-PLAN §4: refit only against
human rankings). And it confirms nothing at a second depth — every headline that survives should be
replayed at depth 4 or 5 before it is acted on, which is SIM-PLAN §9 and is a batch of its own.

## 12. Files

| What | Where |
|---|---|
| Mining script | `tools/mine.ts` (`npx tsx`) |
| Batch-3 specs | `sim/specs/batch3/*.json`, 29 files |
| Run ledger entry | `docs/RUNS.md`, "Batch 3 (proposed)" |
| Source runs | `sim/out/sweep-p2.r{1,2}.jsonl`, `sim/out/sweep-d3.r{1,2}.jsonl` |

`tools/mine.ts` carries a copied port of `trajectory` and `leadMetrics` from `src/sim/analyze.ts`
rather than importing them, because `src/` was being rewritten by other agents while this ran and a
half-written analyser breaks the mine. The weights still come from `src/sim/weights.ts`, so the two
cannot drift on a weight — but if the analyser's metric definitions change, re-copy them.
