# Simulation queue

Runs that are ready but **not launched**. Saar launches by name; nothing here starts on its own
(Saar, 2026-09-14). Each entry: why, the exact commands, machine time on 16 cores at depth 3, and
the rule that decides. Move an entry to `Ran` below, and to `RUNS.md`, when it has run.

## Ran (2026-09-14)

Q1–Q5 ran as one sequential chain on Saar's go, 16 workers, **41 600 games**, all depth 3.
Log `sim/out/queue-2026-09-14.log`, marker `sim/out/queue-2026-09-14.done`.
Report: **`docs/research/sim-queue-2026-09-14.md`**. Ledger: `docs/RUNS.md`, batch 4.

- **Q1 — guard double step from the home rank** (`ab-guard-dbl-slide`, `ab-guard-dbl-leap` vs `ab-warden-wall`): **rejected, keep the Wall.** `slide` clears nothing but branching; `leap` costs capped +0.017 ± 0.010 and +5.2 plies; both drag drawn games to 51.5% / 51.9% against the Wall's 40.5% — the same drag as the rejected Warden. `guardDoubleFirst` stays a lab toggle.
- **Q2 — `paladinKamikaze=nonPawn`** (`pb-ab-L-nonPawn` vs `pb-ab-base24`): **nothing measurable** (score −0.003 ± 0.018, decisive −0.008 ± 0.022, draws +0.009 ± 0.022, plies −0.3 ± 1.3). A free buff: value 2.21 → 2.87 pawns, no cost. **Saar's call, on taste.**
- **Q3 — `maesterSwapAny`** (`pb-ab-M-swapAny` vs `pb-ab-base24`): **balance and draws unchanged**; plies −4.3 ± 3.4, branching 33.1 → 39.1, kings never move in 25.4% of games against 16.6%. Free buff: value 2.18 → 3.12 pawns. **Saar's call, on taste.**
- **Q4 — `secondPlayerDoubleFirstTurn`** (`dt-full`, `dt-nopal`): **do not adopt.** Full pool White 0.533 → 0.472 (−0.062 ± 0.026) — it hands Black an edge the size of White's; no-paladin pool 0.526 → 0.490. `RUNS.md` R9 answered. **Retired and qualified (2026-09-16):** the search assumed alternating movers (side derived from ply parity, unconditional score negation, turn-bit hashing, alternating repetition walks), so the numbers are directional only. That does not reopen the rejection; the commands are out of the active queue. A later extra-turn feature (Haste) must fix mover tracking, the score sign, hashing, repetition and exact state serialization first.
- **Q5 — `paladinKamikaze=never` half of the White-edge diagnostic** (`pb-lp-never` vs `pb-lp-base`): White 0.554 → **0.586**, decisive 0.846 → 0.907, plies 90.8 → 82.8. With the jump half already run, **the paladin's White edge is neither the jump nor the sacrifice — it is the piece's reach on an open board.** Limit: ±0.035 paired, ±0.045 on the paladin subset.

**Note for every future A/B:** `pb-ab-base` is **void** as a control (it mixes the two-guard and
one-guard pools — `RUNS.md`, "Void run"). `pb-ab-base24` is clean for the old-paladin comparison it
recorded, **not a timeless current baseline**: after the 2026-09-14 paladin change it names the wrong
rule set, so a new comparison needs a fresh control (a new id, one-guard pool, current rules).

## Q6 — AI: 10× training data from the shipped engine, then a material + residual net — **RESOLVED 2026-09-17: candidate ACCEPTED, adoption pending**

Started 2026-09-14. The inherited chain **completed** after the takeover review was written, but its
80 000 records are **unvalidated and excluded**: no rule/source stamp, old-paladin semantics, gates
skipped (`docs/research/ai-q6-audit-2026-09-16.md`; labels in `sim/out/UNVALIDATED-Q6.md`).

The replacement chain `tools/q6-chain.sh` ran in a pinned worktree and **passed every stage**:
generation 80 000 games under the shipped rules with full stamps, sampled 7 820 736 positions,
trained a residual candidate (best validation 0.000674), then gate **+167 ± 26 Elo** (0.724, 400
games), decision **+139 ± 14 Elo** (1 600 games), depth-4 **+149 ± 37** (200 games, no sign reversal)
and speed **1 s depth 5.92** against the linear 6.08. Dataset and model hashes verified by
`tools/q6-validate.mjs final`; claims checked with `tools/verify-claims.mjs`. Report:
`docs/research/ai-q6-acceptance-2026-09-16.md`; evidence copied to `sim/q6-g2/`.

**Adoption is a separate release decision** (switch `src/ai/eval.ts` to `residual`, rebuild, republish);
the default stays `linear` until the owner asks for that. The candidate blob is in
`sim/q6-g2/nnue/weights-candidate.ts`, never in `src/`.

## Q7 — Paladin `nonPawn` at depth 4 (confirmation before it ships; SIM-PLAN §9)

**Ran 2026-09-14, superseded — do not run again.** 400 games an arm, both arms pinned with
`--baseRule paladinKamikaze=always`: white score +0.035 ± 0.034 (edge of its interval; the depth-3
A/B on 1 600 games read −0.003 ± 0.018), decisive −0.025 ± 0.056, draws +0.020 ± 0.054, capped
+0.005 ± 0.014 — nothing resolved at this size. Extended to 800 games an arm (`q7b-2026-09-14.log`):
white score +0.027 ± 0.025, decisive −0.015 ± 0.036, draws +0.018 ± 0.034, capped −0.003 ± 0.005,
plies +0.8 ± 3.7. Pooled with depth 3 (inverse-variance): white +0.007 ± 0.015. Verdict: no change in
decisiveness, draws, stuck endings or length at either depth; a White gain of at most ~2 points cannot
be excluded. **Shipped in v0.7.0.** The earlier "run another 400-game confirmation after Q6" note is
deleted: the extension already answered it with the recorded old-paladin control.

## Piece-balance queue (2026-09-17, new focus: fairy pieces only)

Rules: fresh control per experiment (the `ab` experiment's base arm is today's rules — `pb-ab-base24`
is void as a baseline). Same seed for every variant so arrangements and opening seeds are shared.
Adopt only on a depth-4 confirmation with no draw drag; depth-3-only differences are not results.

| id | lever (matrix cell) | question | command | decision rule |
|---|---|---|---|---|
| pb-ab-A-shots | archerShots A.0 capture | Does the wider shot set (plusDiag2) sharpen the archer without dragging draws? | `--experiment ab --games 1600 --sample 40 --depth 3 --seed 71 --rule "archerShots=plusDiag2"` | adopt only if depth-4 decisive ≥ +3 with draws flat |
| pb-ab-S-cap | beastCapture A.1 4b/6a | Is the 2021 capture (forward diagonals only) better than 7-neighbour? | `--rule "beastCapture=diagForward"` | as above |
| pb-ab-M-step | maesterStep A.0 move | Is step 2 a free buff (value 2.18 → 3.8) or a drag? | `--rule "maesterStep=2"` | as above |
| pb-ab-L-block | paladinJumpsFriends A.1 4d | Does blocking on friends cap the paladin's White edge (Q5: reach on an open board)? | `--rule "paladinJumpsFriends=false"` | fairness: White score toward 0.50 without a decisive loss |
| pb-ab-A-move | archerMove A.0 move | 2021 `fwdBack` vs `any` under current rules | `--rule "archerMove=fwdBack"` | as above |
| pb-ab-S-move | beastMove A.0 move | `forward` vs `any` (the beast's mobility) | `--rule "beastMove=forward"` | as above |

**Ran 2026-09-17** (all six, depth 3, 1,600 games/arm, seed 71; depth 4 for the one consequential
lever). Report: **`docs/research/sim-piece-balance-2026-09-17.md`**.

- **`archerShots=plusDiag2` — CONFIRMED at depth 4** (1,600/arm): decisive +8.8 ± 3.8, draws
  −8.2 ± 3.7, plies −14.2 ± 4.8, white +2.6 ± 2.6. Recommend adoption + re-pricing (both running).
- `beastCapture=diagForward` — null; `maesterStep=2` — null (free buff on taste);
  `paladinJumpsFriends=false` — rejected (decisive −3.9 ± 2.6, draws +3.8 ± 2.5);
  `archerMove=fwdBack` — rejected (decisive −4.0 ± 2.8, interest min-use −2.6 ± 1.0);
  `beastMove=forward` — rejected (interest min-use −6.0 ± 1.2).
- Follow-ups ran: `ring2` sharpens the same (+7.7 decisive at depth 3, plies −17.1);
  `plusDiag2` value **> 4.66 pawns** (classic is 3.73 ± 0.42 by the same method);
  `plusDiagFwd2` (new forward-only set) A/B +8.2 ± 2.7 decisive and value **> 4.66**.
  **The sharpening and the power are one lever** — owner adopted `plusDiagFwd2` on 2026-09-17;
  `ARCHER_V` 337 → 505 (value 5.05 ± 0.44 vs a rook), RULES.md decision 16, `?rules=2017` pins the
  classic shots so the older preset is unchanged.

## Piece-balance sweep 2 (2026-09-17, after the archer adoption)

Same method: fresh controls (today's rules = `plusDiagFwd2` archer, `ARCHER_V` 505), seed 71,
1,600 games/arm depth 3; depth 4 for anything consequential. Log `sim/out/pb2-2026-09-17.log`.

| id | lever | question |
|---|---|---|
| pb-ab-S-fwd | `beastCaptureForward=true` | **Ran: depth-4 rejects** the depth-3 pace effect (−10.7 ± 3.5 → −1.7 ± 7.2); capture fires 0.48/game. `docs/research/sim-beast-forward-2026-09-17.md` |
| pb-ab-S-diag | `beastMove=diagFwdBack` | **Ran: reject** — white score +2.4 ± 2.3, capped +0.6 ± 0.4. |
| pb-ab-M-any | `maesterSwapAny=true` | **Ran: null** on balance/draws; plies −5.7 ± 3.6 (free buff on taste). |
| pb-ab-M-enemy | `maesterSwapEnemy=true` | **Ran: null** — the toggle is inert in play. |
| pb-ab-L-return | `paladinReturn=true` | **Ran: reject** — white +2.3 ± 2.0, interest min-use −4.6 ± 1.8. |

Second parallel batch (pool composition, game rules, capital): **pool composition is neutral** — two
archers vs one, guard vs none, two beasts vs one are all null on outcomes (weak pace effects only:
guard +3.1 plies, two beasts +4.2 plies; a one-beast pool is a defensible candidate,
`docs/research/sim-pool-*.md`). **Promotion sets** (`standard`, `anyNonKing`) null; **draw rules off**
(`fiftyMove`, `insufficientMaterial`) null — the lab's adjudication reabsorbs them
(`sim-promotion`, `sim-drawrules`). **Same-colour bishops** cosmetic (`sim-bishops`). **Capital C4**
(pawn straight capture in the capital) fails its 1,600-game depth-4 confirmation (all depth-3
directions reverse). **Capital C2 (sanctuary) is CONFIRMED** at 1,600/arm depth 4: draws **−0.027 ±
0.026**, branching +1.6 ± 0.4, capped 1.7% → 3.1% (`sim-capital-c2-d4`); the four-rule package is
outcome-null at depth 4 (`sim-capital-package`). **No-adjudication baseline**: played out, today's
rules give **87.2% decisive vs 79.1%** adjudicated, 12.8% draws, mean 148.9 plies — the lab's
decisive share is its own adjudication (`sim-no-adjudication-2026-09-17.md`). **C2 without
adjudication**: draws −1.3 ± 2.0 (not resolved) while the capped cost doubles (2.75% → 4.75%) →
stays off; **C5 built and null** (`capitalNoCapture`). All five capital rules are now built and
measured.

Beast simplification (designer call, 2026-09-17): three readings measured at 1,600 games/arm depth 4 —
**A all-8 neighbours adopted** (price-neutral, 4.34 ± 0.42 pawns, captures +29%, `BEAST_V` 434); B four
diagonals and C forward diagonals rejected (they halve the piece's value to ~1.8-2.0 pawns). Promotion
reverted to the chess set (fairy promotions 1.3% of all promotions, all metrics null). Threefold off
measured null (46 repetition draws re-absorbed by the lab's adjudication). Lab-piece exploration:
**Ogre** push vs repel under today's rules is not confirmed at depth 3 (value favours push 3.18 ± 0.44
vs repel 2.25 ± 0.43; the old depth-4 +9.0 was under older rules — a fresh depth-4 arm is the open
question); **Catapult** `stay` beats `land` (land halves firing and delays it 10 plies) but both
readings measure below 1.66 pawns and it never fires in 38% of games — not worth a roster slot at its
400 price; **Reaver** ortho neutral at depth 4; **Templar** rejected. Reports `sim-beast-*`, `sim-ogre-explore`,
`sim-catapult-explore`, `sim-threefold-and-beast-c`.

Parallel routes the same evening: guard levers re-measured (`docs/research/sim-guard-2026-09-17.md`:
cap-pawns and step-2 null, `guardImmune=false` rejected — interest −0.015 ± 0.009, guard survival
97% → 73%); capital rule **C1 built** (`guardNoCapital`, off) and measured **null** (decisive
+0.3 ± 0.3 — guards rarely enter the centre); **archer+beast factorial additive**
(`docs/research/sim-combo-ab-2026-09-17.md`); placement: guard near/far flat, archers apart
borderline better (decisive +3.7 ± 2.8, `sim/out/pl-arch-*.summary.json`); **values refreshed**
under the adopted archer: L 3.74, M 2.82, S 3.68 (`ARCHER_V` 505 from the rook bracket).

## Ran 2026-09-17 evening (arrangement + Ogre + composition)

- **Arrangement benchmark** (`docs/research/arrangement-benchmark-2026-09-17.md` pre-registration; reports
  `arrangement-sweep-a`, `-b`, `-finalists`): 110k+ games. Per-arrangement ranking is readable only at the
  extremes (reliability 0.87–0.90 at 1,000 games/rank); the lever is composition. Top finalists: MMSSNBNK,
  KGBMSSMB, NKBBMGQS, QNKMNRSG, SQBKRSML (depth-4 order preserved, rho 1.0); bottom: GAMBRMAK, NBAGKASN,
  AKGBNRMR, SAKMBNNA, RNAAKSBS.
- **Composition mining** (56k games): archer presence +4.8 decisive, beast +3.0, guard −4.3, maester −2.9,
  queen −9.8 plies (pace, decisiveness neutral — matches the controlled test). Event-richest mixes all carry
  A+L+M+S.
- **Paladin pool test**: presence is worth **+6.2 White points** (paired, depth 4 subset +6.6) — a fairness
  flag; removal returns White to 0.508. Owner decision pending (keep / remove / new reach rule).
- **Kit-rich pool**: +0.27 mechanics/game (CI excludes zero), decisiveness +1.75 ± 2.4 (ns), fairness flat;
  costs variety. Depth-4 and a two-bishop variant are the next step.
- **Ogre**: push confirmed at depth 4 and fair at O=318; friends-only confirmed but does not stack; hop/step-2
  null; no-capture neutral. Roster decision pending.

## Ran 2026-10-03: K13 — kings' powers round 13 on 1,872 fresh armies

Launched on the owner's go ("do the measurements you suggest"). 3,744 games in 37 min on the Mac
(1.7 games/s while other work ran; the estimate of 20–30 min was a little short). Result: over
rounds 11–13, Mercy and Haste high and Darkness low, all three clearly; Flight fine; Spirit −
Shadow +3.2 ± 3.1. Report: `docs/research/kings-powers-balance-2026-10-02.md`, Round 13. The
command is kept in git history (this file, 2026-10-03).

## Ran 2026-10-03: card mode, phases A and B

Launched on the owner's go ("do the measurements you suggest"). Phase A (`cards-a1`): each card
against no card, 300 pairs per card on fresh armies, 5,400 games on the Mac and 4 Kaggle notebooks.
Phase B, the same hand for both sides: `cards-b1` (0, 3 and 6 cards) was stopped and voided by the
mark bug; `cards-b2` reran it on the fixed engine (2,400 games), and `cards-b3` adds 4 and 5 cards on
the same armies (owner: "should you also test 4 and 5 cards?"; 1,600 games, 3 of 16 parts on
Kaggle). Report: `docs/research/cards-2026-10-03.md`.

## Dropped

- Warden extension pass (`sim/specs/warden/*` at 3 000 games): Saar rejected the two-square guard
  on draw grounds (2026-09-14).
- `guardDoubleFirst` follow-ups: Q1 answered it. Nothing queued.
- `gs-wall-front`, `gs-wall-split` (`sim/specs/guard/*`): never run, both written for the
  two-guard pool. **Superseded by at-most-one guard** — do not promote them to active tickets
  (takeover ledger, 2026-09-14). `gs-shield-far` completed its outputs later; the earlier
  "missing summary" was a timing artefact.
