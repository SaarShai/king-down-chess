# Piece-balance status map — five fairy pieces, 2026-09-17

## Method

A result here needs three things: a **fresh control** (the base arm is the current rule set, played
over the same 40 arrangements and the same opening seeds as the variant), a **paired difference**
(the paired-difference column of each `sim/out/pb-ab-*.experiment.md`; a cleared 95% interval at depth 3 only
means "worth a second run"), and — for a rule change — a **depth-4 confirmation** with no draw drag
(`QUEUE.md`, piece-balance queue; `pb-ab-A-shots.experiment.md` preamble). `pb-ab-base` and
`pb-ab-base24` are void as current baselines: the first mixed two pools in one file, the second is
the old-paladin control (`sim-queue-2026-09-14 §3.1`; `sim-piece-balance-2026-09-17`). **Older
batch-3 guard results are void**: every `b3-*` run wrote an empty rule diff but its guards captured
1.1–2.6 pawns a game, so batch 3 measured the lab's capturing guard (`guardCaptures=pawns`,
`guardStep=2`), not the shipped immortal wall, and the `sim-configs`/`sim-mining` guard draw prices
measured the 2017 archer and beast (`guard-study-2026-09-13 §1, §5.1`). The placement numbers below
are **unpaired** families of 40 hand-built back ranks, 1,600 games each, depth 3, seed 81
(`sim/specs/pl-*.json`); each difference is binomial 95% by normal approximation over two
independent proportions, so rank composition is not controlled. Citations give the file stem under
`docs/research/` unless a path is shown.

## At a glance

| Piece | Shipped rule | Value (pawns) | Best lever | Worst lever |
|---|---|---|---|---|
| A archer | shoots `plusDiagFwd2` | 5.05 ± 0.44 (vs rook) | shots widened: +8.2 decisive (d3; plusDiag2 +8.8 at d4) | `archerMove=fwdBack`: −4.0 decisive |
| L paladin | `paladinKamikaze: nonPawn` | 2.87 ± 0.57 | pawn survival: +0.66 pawns, game unchanged | `paladinReturn`: degenerate (> 4.46) |
| G guard | immortal wall, captures nothing | not measured (bound < 1.70) | `guardImmune=false`: +4.2 decisive | double step: drag 51.5–51.9% of draws |
| M maester | one-step, friend swap | 2.18 ± 0.53 | `maesterSwapAny`: +0.94 pawns, game unchanged | `maesterSwapEnemy`: inert |
| S beast | 7-neighbour capture, chains | 2.67 ± 0.54 (2.17 ± 0.41 buffed pass) | `beastMove=any`: 3.6 → 10.8 moves/game | `beastMove=forward`: use −0.060 |

---

## A — archer

| | |
|---|---|
| Shipped rule | Steps 1 square in any direction (`archerMove: any`); takes by **shooting without moving** — diagonal-adjacent, exactly 2 straight, plus the two forward diagonal-2 squares (`archerShots: plusDiagFwd2`, adopted 2026-09-17, mirrored for Black), blockers ignored; may shoot the king (`archerChecks: true`) (`MATRIX.md A.0`; `RULES.md §3, §6.16`). |
| Value | **5.05 ± 0.44** pawns — odds match vs a **rook**, 500 games (250 colour-reversed pairs), depth 3, 64 Elo per pawn; `ARCHER_V` 337 → 505 (`pb-A-fwd2-vsR2.log`; `sim-piece-balance-2026-09-17`; `src/ai/eval.ts:63`). The vs-knight pass left the band ("> 4.66") (`pb-A-fwd2.log`). Classic shots read 3.73 ± 0.42 (`pb-A-classic-value.log`). |
| Engine seed | `ARCHER_V = 505` (`src/ai/eval.ts:63`). |

| Lever | Measured effect | Verdict |
|---|---|---|
| `archerShots=plusDiag2` | depth 3: decisive +7.7 ± 2.9, draws −6.9 ± 2.8 (`sim/out/pb-ab-A-shots.experiment.md`); depth 4, 1,600/arm: decisive **+8.8 ± 3.8**, draws **−8.2 ± 3.7**, plies −14.2 ± 4.8, white +2.6 ± 2.6 (`sim/out/pb-ab-A-shots-d4b.experiment.md`) | confirmed; superseded by `plusDiagFwd2` |
| `archerShots=plusDiagFwd2` | depth 3: decisive **+8.2 ± 2.7**, draws −7.3 ± 2.6, plies −7.8 ± 3.5, white −0.2 ± 1.9 (`sim/out/pb-ab-A-fwd2.experiment.md`) | **adopted 2026-09-17** with the re-price (`RULES.md §6.16`) |
| `archerShots=ring2` | depth 3: decisive +7.7 ± 2.6, draws −7.6 ± 2.6, plies −17.1 ± 4.6, interest −0.005 ± 0.004 (`sim/out/pb-ab-A-ring2.experiment.md`) | not adopted; no depth-4 run |
| `archerMove=fwdBack` (2021) | depth 3: decisive −4.0 ± 2.8, draws +2.8 ± 2.6, capped +1.2 ± 1.1, plies +5.7 ± 4.1, interest min-use −2.6 ± 1.0 (`sim/out/pb-ab-A-move.experiment.md`) | rejected |
| `archerChecks=false` ("cannot shoot a king") | depth 3: decisive −2.7 ± 1.8 (inside), plies +5.5 ± 2.6 (`sim-rules-2026-09-13 §3`); batch 3: nothing flags (`sim-batch3-2026-09-13 §8`) | trim kept, not adopted |
| `archerMove=fwdBack` + `archerShots=forward3` (2021 preset) | 2021 archer −244 ± 29 Elo, below the 2017 archer's −160 ± 34; moves and shots under half (`sim-rules-2026-09-13 §4`) | not adopted; pinned by `?rules=2021` |
| Placement: corner vs centre | corner costs 6–7 plies and nothing else; shots 3.70/game vs 4.11 (`sim-batch3-2026-09-13 §7`) | null (the old corner penalty is gone) |

**Placement — two archers adjacent vs 4+ files apart** (all 40 near ranks hold `AA`; all 40 far
ranks hold the two A's 4–7 files apart; verified in `sim/specs/pl-arch-near.json`,
`pl-arch-far.json`):

| family | decisive | draws | white score |
|---|---|---|---|
| near (`AA` adjacent) | 0.7794 | 0.2206 | 0.5359 |
| far (4–7 files apart) | 0.8163 | 0.1837 | 0.5200 |
| Δ near − far (±95%) | **−0.0369 ± 0.0278** | **+0.0369 ± 0.0278** | +0.0159 ± 0.0346 |

Computed from `sim/out/pl-arch-near.summary.json`, `pl-arch-far.summary.json`. Far-apart archers
are more decisive and less drawish. The older adjusted reading agrees (adjacent: decisive −3.2,
draws +3.1 at a fixed archer count, `sim-configs-2026-09-13 §4`). The families are unpaired, so the
direction is a replication, not a controlled placement test.

**Open:** the 505 value is one pass — a second value pass has not run; `ring2` lacks a depth-4
confirmation; a decoupled reading ("shots blocked by the first piece on the ray") is proposed but
unbuilt (`sim-piece-balance-2026-09-17`, closing note).

---

## L — paladin

| | |
|---|---|
| Shipped rule | Queen lines, **jumps friendly pieces**, blocked by enemies; capture is a displacement; **cannot capture a king** (never checks); **removes itself** after capturing anything but a pawn (`paladinKamikaze: nonPawn`, shipped v0.7.0) (`MATRIX.md A.0`; `RULES.md §3, §6.15`). |
| Value | **2.87 ± 0.57** pawns — odds match vs a knight, 300 games (150 colour-reversed pairs), depth 3, tuned engine, 64 Elo per pawn (`sim-lm-buffs-2026-09-13 §2.1`; `RULES.md §6.10`). Before `nonPawn`: 2.21 ± 0.52 (same). |
| Engine seed | `PALADIN_V = 326` (`src/ai/eval.ts:63`). |

| Lever | Measured effect | Verdict |
|---|---|---|
| `paladinKamikaze=nonPawn` | value 2.21 → **2.87 ± 0.57**; depth-3 A/B all intervals cover zero: white −0.3 ± 1.8, decisive −0.8 ± 2.2, draws +0.9 ± 2.2, plies −0.3 ± 1.3 (`sim/out/pb-ab-L-nonPawn.experiment.md`); depth 4, 800/arm: white +2.7 ± 2.5, decisive −1.5 ± 3.6, draws +1.8 ± 3.4 (`sim/out/pb-ab-L-nonPawn-d4.experiment.md`; `sim-queue-2026-09-14 §9`) | **adopted v0.7.0**; a White gain of up to 2 points is possible but not shown |
| `paladinKamikaze=never` | value 3.40 ± 0.52 (`sim-lm-buffs §2.1`); diagnostic: decisive +6.1 ± 3.0, draws −5.6 ± 2.9, plies −8.0 ± 2.4, white +3.2 ± 3.5 (`sim-queue §4`) | not adopted — identity change (a second queen) |
| `paladinChecks=true` | value 3.21 ± 0.60, +64 ± 51 Elo; adds mate by paladin (`sim-lm-buffs §2.1`) | not adopted — deletes a printed rule |
| `paladinJumpsFriends=false` | value 3.73 ± 0.51 — blocking makes it **stronger**, not weaker (`sim-lm-buffs §2.1, §2A`); depth-3 A/B: decisive −3.9 ± 2.6, draws +3.8 ± 2.5, white −1.8 ± 2.0, survival 6.1% → 17.8% (`sim/out/pb-ab-L-block.experiment.md`) | rejected — the reach is load-bearing |
| `paladinReturn=true` (the charge) | value > 4.46 (out of band), 2.80 captures a game, 51.3% survival (`sim-lm-buffs §2.1, §3`); depth 3: white +2.3 ± 2.0, plies −24.3 ± 8.0, killer −7.5 ± 2.6, interest −2.0 ± 0.7, dead endings 1.1% → 5.6%, kings never move 23.8% → 42.3% (`sim/out/pb-ab-L-return.experiment.md`) | rejected — degenerate |
| `paladinBlockedByEnemies=false` | value > 4.46; a paladin-for-queen trade from the opening (`sim-lm-buffs §2.1, §3`) | rejected — degenerate |
| White-edge diagnostics (not levers) | removing the jump leaves the edge (paired −0.4 ± 4.5 on paladin ranks, `sim-lm-buffs §4.1`); removing the sacrifice raises it (0.554 → 0.586, `sim-queue §4`) | the edge is the piece's reach plus the first move |

**Open:** every identity candidate above (`checks`, `never`, `blocked`) is measured but unshipped —
owner calls; the paladin has no other built, unmeasured lever.

---

## G — guard

| | |
|---|---|
| Shipped rule | Steps 1 square in any direction, empty squares only; **captures nothing**; can only be captured by a king; one guard per army at most; a pawn never promotes to a guard. `guardDoubleFirst`, `guardCaptures`, `guardStep=2`, `guardCaptureLimit` are lab-only (`MATRIX.md A.0`; `RULES.md §3, §6.9, §6.11, §6.13`). |
| Value | **not measured as a number.** Every guard odds arm sits outside Muller's ±1.5-pawn band: base −207 ± 32 Elo vs a knight (knight = 3.20), i.e. a bound "< 1.70 pawns" (`sim-rules-2026-09-13 §2.1`; `RULES.md §6.9`); seed-blind (seed 170 cp: −207 ± 32 vs 185 cp: −200 ± 33, `sim-rules §2.1`); tuned-engine re-read < 1.46 (`src/ai/eval.ts:27`). |
| Engine seed | `GUARD_V = 96` (`src/ai/eval.ts:63`). |

| Lever | Measured effect | Verdict |
|---|---|---|
| `guardCaptures=pawns` | +49 ± 45 Elo vs base; 21.5% of games reach 3+ guard captures (`sim-rules §2.1, §2.2`) | rejected — identity (`RULES.md §6.9`) |
| `guardCaptures=pawns` + `guardStep=2` | +98 ± 47 Elo; 44.4% of games reach 3+ captures (`sim-rules §2.2`) | rejected |
| the pair + `guardCaptureLimit=1` (per-guard) | +60 ± 47 Elo; rampage 0.1%; draws +4.8 ± 2.1 (`sim-rules §2.3, §6`) | rejected with the rest |
| `guardStep=2` alone | −10 ± 45 Elo (`sim-rules §2.1`); replay: capped 1.65% → 3.25%, dead endings 1.75% → 3.30%, ~10 plies longer (`guard-study §4, §5.4`) | rejected (`RULES.md §6.9`; `sim-queue` Q1) |
| `guardDoubleFirst=slide` | depth 3, 60 ranks: decisive −1.9 ± 2.3, draws +1.3 ± 2.2, capped +0.5 ± 0.9, plies +2.7 ± 2.8; guard drag 51.5% of drawn side-games vs Wall 40.5% (`sim-queue §2`) | rejected |
| `guardDoubleFirst=leap` | white −3.6 ± 2.5, decisive −2.3 ± 3.3, capped +1.7 ± 1.0, plies +5.2 ± 3.9; drag 51.9% (`sim-queue §2`) | rejected |
| `guardImmune=false` | decisive +4.2 ± 1.8, draws −2.8 ± 1.6, capped −1.5 ± 0.7, plies −7.6 ± 2.6 (`sim-rules §3`) | not adopted — identity |
| `guardNoSecondRank` | rejected because it made the guard inert; no numbers given (`MATRIX.md B.1`) | rejected |
| Escort (guard walks with a passer) | score −2.9 ± 3.5; dead endings 4.8% → 8.2% (`guard-study §4`) | rejected |
| Two guards vs none (lab arm) | decisive −8.8 points, draws +8.8, capped +2.9 (to 3.1%, inside the 5% gate), dead +3.0, plies +11 (`guard-study §5.1`) | two-guard arms are lab-only (`RULES.md §6.11`) |
| Placement: beside the king vs 4+ files away | older paired test: far **+9.7 decisive**, capped 4.5% → 1.5%, −17.3 plies, balance +1.1 ± 2.4 (`guard-study §4`) | contradicted by the fresh family below |

**Placement — guard near vs far from the king** (all 40 near ranks hold G adjacent to K; all 40 far
ranks hold G 4–7 files from K; verified in `sim/specs/pl-guard-near.json`, `pl-guard-far.json`):

| family | decisive | draws | white score |
|---|---|---|---|
| near (G next to K) | 0.7475 | 0.2525 | 0.5544 |
| far (G 4–7 files off) | 0.7350 | 0.2650 | 0.5275 |
| Δ near − far (±95%) | +0.0125 ± 0.0303 | −0.0125 ± 0.0303 | +0.0269 ± 0.0345 |

Computed from `sim/out/pl-guard-near.summary.json`, `pl-guard-far.summary.json`. The fresh unpaired
family shows **no decisive effect**: the older depth-3 +9.7-point far-from-king result does not
reproduce. Treat the arrangement as unconfirmed; a paired re-run on one rank set is needed to
separate the square from composition.

**Open:** `guardNoCapital` is built and unmeasured (`src/rules/rules.ts:146`); `guardNoKingShield`
("a guard may not stand beside its own king") is proposed, not built (`guard-study §5.5`); a
guard-capture run started after these runs (`G-cap-pawns`) has no paired table yet
(`sim/out/pb-ab-G-cap-pawns.base.jsonl`).

---

## M — maester

| | |
|---|---|
| Shipped rule | Steps 1 square in any direction; captures adjacent; **swaps with an adjacent friend**; when both maester and own king stand on their first rank they swap at any distance (`MATRIX.md A.0`; `RULES.md §3`). |
| Value | **2.18 ± 0.53** pawns — odds match vs a knight, 300 games (150 colour-reversed pairs), depth 3, tuned engine, 64 Elo per pawn (`sim-lm-buffs-2026-09-13 §2.2`). Other readings: `maesterSwapAny` 3.12 ± 0.57; `maesterStep=2` 3.80 ± 0.58; `maesterKingSwapAnywhere` 2.49 ± 0.56; `maesterSwapEnemy` 2.14 ± 0.54 (all `sim-lm-buffs §2.2`). |
| Engine seed | `MAESTER_V = 320` (`src/ai/eval.ts:63`). |

| Lever | Measured effect | Verdict |
|---|---|---|
| `maesterStep=2` | depth 3: decisive +2.1 ± 2.7, draws −1.8 ± 2.5, plies −2.8 ± 2.9, branching +1.0 ± 0.3, white +0.6 ± 1.9 (`sim/out/pb-ab-M-step.experiment.md`); value 3.80 ± 0.58 (+104 ± 50 Elo) (`sim-lm-buffs §2.2`) | null — free buff on the owner's taste (`sim-piece-balance-2026-09-17`) |
| `maesterSwapAny` | depth 3: decisive −0.4 ± 3.1, draws +0.3 ± 3.1, plies −5.7 ± 3.6, branching +6.4 ± 1.3, swaps 6.64 → 12.49, kings never move 23.8% → 32.7% (`sim/out/pb-ab-M-any.experiment.md`); the 2026-09-14 clean control read the same: plies −4.3 ± 3.4, kings 16.6% → 25.4%, swaps 7.07 → 13.05 (`sim/out/pb-ab-M-swapAny.experiment.md`; `sim-queue §3.2`) | measured free, **not adopted** (Q3; `RULES.md §6.10`) |
| `maesterSwapEnemy` | depth 3: all balance intervals cover zero (white −0.5 ± 0.7, decisive +0.3 ± 0.7, swaps 6.64 → 6.67) (`sim/out/pb-ab-M-enemy.experiment.md`); 300-game pass: one enemy swap in 300 games, value 2.14 ± 0.54 (`sim-lm-buffs §2.2, §3`) | inert — reject |
| `maesterKingSwapAnywhere` | +20 ± 49 Elo; value 2.49 ± 0.56 (`sim-lm-buffs §2.2`) | null |
| `maesterLongSwap=false` | decisive +0.1 ± 1.3, plies −0.9 ± 2.3; long swaps 1.27 → 0.91 (`sim-rules §3`) | null |
| Placement: beside the king | +0.021 White score, +15 Elo (pool `QRRBBMM`, no guard in the pair) (`sim-batch3-2026-09-13 §7`) | tie-break note only |

**Open:** `maesterStep=2` and `maesterSwapAny` are free buffs the owner has not taken
(`sim-piece-balance-2026-09-17` follow-ups; `QUEUE.md`); the beside-the-king placement has no fresh
family.

---

## S — beast

| | |
|---|---|
| Shipped rule | Steps 1 square in any direction, empty squares only; captures on the **7 adjacent squares that are not straight ahead**; after a capture it may keep capturing, but never a king as a chain step (`MATRIX.md A.0`; `RULES.md §3, §6.3`). |
| Value | **2.67 ± 0.54** pawns under the tuned engine (odds match vs a knight; `src/ai/eval.ts:27-28`, citing `sim-tuning-2026-09-13 §6`); 2.17 ± 0.41 in the buffed pass (`sim-buffed-2026-09-13 §2`; `RULES.md §6.8`). The fixed point is not converged (`src/ai/eval.ts:30`). |
| Engine seed | `BEAST_V = 308` (`src/ai/eval.ts:63`). |

| Lever | Measured effect | Verdict |
|---|---|---|
| `beastMove=forward` | depth 3: decisive +2.2 ± 2.5 (inside), draws −2.2 ± 2.5, branching −2.8 ± 0.6, interest min-use **−6.0 ± 1.2**, white +1.4 ± 1.9 (`sim/out/pb-ab-S-move.experiment.md`) | rejected |
| `beastMove=diagFwdBack` (2021) | depth 3: white +2.4 ± 2.3, decisive +0.9 ± 1.8 (inside), capped +0.6 ± 0.4, branching −1.1 ± 0.4, moves 9.51 → 7.56 (`sim/out/pb-ab-S-diag.experiment.md`); 2021 beast 0 ± 42 Elo vs 2017 (`sim-rules §4`) | sideways — not adopted |
| `beastCapture=diagForward` (2021) | depth 3: decisive −0.2 ± 2.2, draws +0.5 ± 2.2, chain captures 1.25 → 0.77 (`sim/out/pb-ab-S-cap.experiment.md`) | null — keep the 7-neighbour capture (`sim-piece-balance-2026-09-17`) |
| `beastCaptureForward=true` | depth 3: decisive +1.8 ± 2.1 (inside), draws −1.9 ± 2.1, plies −10.7 ± 3.5, killer +3.2 ± 1.8, chain captures 1.22 → 1.84 (`sim/out/pb-ab-S-fwd.experiment.md`) | not confirmed; depth-4 arm has no table yet (`sim/out/pb-ab-S-fwd-d4.base.jsonl`) |
| `beastMove=any` (2026-09-13 buff) | value 2.17 ± 0.41; moves 3.63 → 10.80 per game, survival 69.7% → 50.6%; chains of 4+ in 0.8% of games (`sim-buffed §2`; `src/ai/eval.ts:55-58`) | **adopted** (`RULES.md §6.8`) |
| Chains (shipped rule, not a lever yet) | ~1 capture move in 10 continues (113 capture moves carried 124 captures in 200 games, `RULES.md §6` early evidence); chain moves/captures ≈ 1.0/1.25 a game under today's rules (`sim/out/pb-ab-S-move.experiment.md` base column) | flavour, not a balance knob |
| Placement: beasts on a/h | capped −2.1 points, killer −2.9 (`sim-configs-2026-09-13 §4`); cornered beast 5.3 moves vs 5.0 centre, decisive −1.9 (flagged), draws +1.9 (flagged), plies +7 (flagged) (`sim-batch3-2026-09-13 §7`) | small; no rule |

**Open:** `beastChains=false` (one capture per turn) is built and never A/B-tested
(`src/rules/rules.ts:119-120`); `beastCaptureForward` awaits depth 4; chain length is not a lever.

---

## What is left (untested levers visible in the MATRIX)

- **All five pieces — capital rules C1–C5** (cannot enter / cannot be taken while there / moves
  differently / captures differently / cannot capture *from* there): every cell is `?`
  (`MATRIX.md §B.2`). One cell is built: `guardNoCapital` (a guard may not end a move on
  d4/e4/d5/e5), off by default and unmeasured (`src/rules/rules.ts:146`).
- **A archer:** a shots-blocked-by-the-first-piece reading (new rule, `sim-piece-balance`); depth-4
  for `ring2`; a second value pass to confirm 505.
- **L paladin:** the measured identity candidates (`paladinChecks`, `paladinKamikaze=never`,
  `paladinJumpsFriends=false`) remain owner calls (`sim-lm-buffs §2.1`).
- **G guard:** guard arrangement on a paired rank set (the fresh family is unpaired);
  `guardNoKingShield` needs one rules field and one `genPiece` line (`guard-study §5.5`);
  `guardNoSecondRank` has a verdict but no published numbers (`MATRIX.md B.1`); the running
  guard-capture arm has no table yet (`sim/out/pb-ab-G-cap-pawns.base.jsonl`).
- **M maester:** `maesterStep=2` and `maesterSwapAny` are free buffs on the owner's taste
  (`sim-piece-balance`); a fresh beside-the-king placement family.
- **S beast:** `beastChains=false` (one capture per turn) never A/B-tested
  (`src/rules/rules.ts:119-120`); `beastCaptureForward` depth-4 in flight
  (`sim/out/pb-ab-S-fwd-d4.base.jsonl`); a chain-length cap is not a built lever.
