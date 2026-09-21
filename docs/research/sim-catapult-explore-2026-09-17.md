# Catapult exploration: `stay` vs `land`, firing rate and pricing (2026-09-17)

**Method.** The Catapult (`C`) is a lab piece, outside `POOL` and `PROMOTIONS`: it moves like a rook onto
empty squares and captures only by lobbing over exactly one screen. This pass re-measured its two
readings under today's rules: a paired two-population A/B of `catapultCapture=land` against the shipped
`stay` on the campaign's 40 C-ranks (`sim/specs/newpieces/ab-C-land.json`), 1 600 games per arm, depth 3,
seed 71, common opening seeds, 4 workers; and two 500-game value passes (`--pieces C`, `--eloPerPawn 64`,
depth 3, seed 79, engine seed 400) that price each reading against a knight. Lobs were counted from the
stored JSONL by LAN — `C<from>*<victim>` under `stay`, `C<from>x<victim>` under `land`; the catapult has
no other way of capturing, so every `C` capture is a lob.

**One route correction, stated up front.** The literal command as briefed (`--sample 40` on the shipped
pool) cannot measure this piece: `QLRRBBNNAAGMMSS` contains no catapult. That invocation ran first and
produced two bit-identical arms — every interval `±0.000`, no `C` row, 0 lobs — and is kept as
`sim/out/pb-ab-C-land2-badpool.*`, not as evidence. The arms below replace `--sample 40` with the
campaign's 40 explicit C-ranks; games, depth, seed and rule are as briefed. A depth-4 arm was **not run**:
no balance interval was exceeded (`|−0.002| < 0.023`, `0.016 < 0.031`, `0.015 < 0.031`).

---

## 1. The A/B at depth 3 (`pb-ab-C-land2`)

`land` against today's default `stay`, 1 600 games per population, the same 40 arrangements and opening
seeds in both. Both readings put one catapult on each back rank. The paired difference is the mean over
the 40 shared arrangements.

| metric | `stay` (base) | `land` (rule) | mean paired difference ±95% | significant |
|---|---|---|---|---|
| white score | 0.550 | 0.549 | −0.002 ± 0.023 | no |
| decisive | 0.801 | 0.816 | +0.016 ± 0.031 | no |
| draw rate | 0.189 | 0.174 | −0.015 ± 0.031 | no |
| capped | 0.010 | 0.009 | −0.001 ± 0.008 | no |
| mean plies | 104.2 | 107.1 | +2.8 ± 3.6 | no |
| branching factor | 31.1 | 31.0 | −0.2 ± 0.3 | no |
| interest (min-use) | 0.448 | 0.471 | +0.007 ± 0.010 | no |
| permanence | 0.955 | 0.957 | +0.002 ± 0.001 | yes |
| uncertainty late (resid.) | −0.003 | +0.003 | +0.007 ± 0.003 | yes |
| excess decisiveness (resid.) | +0.012 | −0.007 | −0.014 ± 0.008 | yes |

Balance and fairness do not move: white score differs by 0.001, and the decisive (`+1.6` points) and draw
(`−1.5` points) differences are inside their intervals. The only significant rows are secondary interest
terms of small size; `land` trades a little "excess decisiveness" (−0.014) for a little permanence and
late uncertainty. The per-piece table shows what the rule does to the piece itself: `C` moves fall from
**10.01 to 7.11** per game, `C` captures (lobs) from **1.16 to 0.59**, catapult survival from **61.2% to
49.7%**, and catapult checks from **0.59 to 0.38**. The lob counts from the JSONL below match those
capture counts to the hundredth, so the two readings of the same file agree.

## 2. Implied values (`pb-C-value`, `pb-C-land-value`)

Muller's asymmetric-material method: one knight of `RNBQKBNR` replaced by a catapult on one side only,
colour-reversed pairs, 500 games an arm, depth 3, seed 79, one pawn = 64 Elo. The engine seed is the
shipped `CATAPULT_V = 400`; the calibration is carried over, not replayed.

| reading | pentanomial | score | Elo vs knight | Δ pawns | implied value | next seed (cp) | draws | plies |
|---|---|---|---|---|---|---|---|---|
| `stay` | [86, 39, 83, 16, 26] | 0.357 | −102 ± 28 | −1.60 ± 0.44 \*\* | **< 1.66** \*\* | 156 | 10.6% | 87 |
| `land` | [110, 27, 76, 18, 19] | 0.309 | −140 ± 28 | −2.18 ± 0.43 \*\* | **< 1.66** \*\* | 98 | 10.0% | 89 |

\*\* Both swaps fall outside the ±1.5-pawn band Muller's linear conversion needs (the knight is 3.16), so
these are bounds, not numbers: the catapult is **more than 1.6 pawns below a knight** under `stay` and
**more than 2.1 below** under `land`. The shipped 400 cp is roughly 2.5 times the `stay` bound; `land`
prices a further 0.58 pawns lower. Neither arm converges; a second pass at 156 (stay) or 98 (land) would
still read below a knight unless the bound is an artefact of the saturated band.

## 3. Lob counters

A lob fires when a catapult has an enemy first on a rank or file and a legal victim beyond it. Counted
from `moves[].lan` in the stored JSONL:

| arm | games | lobs | lobs/game | games with ≥1 lob | never fired | first lob (mean ply) | lob checks/game |
|---|---|---|---|---|---|---|---|
| A/B `stay` | 1 600 | 1 856 | 1.160 | **61.8%** | **612 (38.3%)** | 49.8 | 0.594 |
| A/B `land` | 1 600 | 939 | 0.587 | **48.1%** | **830 (51.9%)** | 60.2 | 0.384 |
| value `stay` (one catapult, White only) | 500 | 210 | 0.42 | 30.8% | 346 (69.2%) | 48.9 | 0.198 |
| value `land` (one catapult, White only) | 500 | 70 | 0.14 | 12.6% | 437 (87.4%) | 64.2 | 0.136 |

The 2026-09-14 A/B on the same ranks read 1.149 lobs/game and 62.3% of games firing under `stay`, and
0.573 and 45.3% under `land`. **The finding replicates under today's rules**: `stay` fires in 61.8% of
games, so **38.3% of games never fire a lob at all** — slightly more than the "a third" of the earlier
evidence, not less. **`land` does change the firing rate, downward**: it halves lobs per game
(1.160 → 0.587), pushes the first lob ten plies later (49.8 → 60.2) and raises the share of games that
never fire from 38.3% to 51.9%. With one catapult instead of two, `stay` already goes silent in 69.2% of
games, and `land` in 87.4%.

## 4. Verdict

**Which reading is better: `stay`.** `land` buys no balance or fairness (white 0.550 vs 0.549; decisive
and draw intervals cover zero), and it costs the piece its identity: half the lobs, ten plies later, and
a catapult that survives 49.7% of games instead of 61.2%. Its only significant effects are small
residual interest terms (±0.002–0.014), while it prices 0.58 pawns below `stay` (−1.60 vs −2.18 pawns
against a knight). The shipped default is the better reading on every measured axis.

**Is the catapult worth a roster slot: no, not on this evidence.** It is at least 1.6 pawns below a
knight (implied < 1.66 vs 3.16), and the shipped `CATAPULT_V = 400` over-prices it about 2.5-fold; even
the next seed, 156, leaves it below a knight. It is a lab piece with a niche geometry, and the A/B shows
its rule reading does not move the game while it is present.

**The firing rate is a design flag.** The shipped reading does nothing in **38.3% of games** (612 of
1 600), and the one-catapult value arm does nothing in **69.2%**; under `land` the silent share is
51.9%. The mean first lob arrives at ply 49.8. A piece that needs an enemy screen and a victim beyond it
on the same ray is conditional by construction, and the numbers say the condition is absent in more than
a third of games — under a lab rank that seats a catapult every game. That is a design warning, not a
tuning target: no price fixes a piece that never gets to fire.

---

### Limits

- Depth 3 only; the depth-4 arm was skipped because no balance interval was exceeded.
- Both value arms are outside Muller's linear band: "far below a knight" is the reading, not a number.
- The A/B is self-play and is read as a balance/fairness check, not as a strength delta; 40 arrangements
  and one interval per metric mean "significant" is "worth a second run", not a test.
- The campaign ranks seat a catapult on every back rank, so these firing rates are an upper bound for a
  roster that carries one occasionally.
