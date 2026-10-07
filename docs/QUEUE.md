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

## Ran 2026-10-03: K14 (all nine readings) and cards-a2 (the four new cards)

Launched on the owner's go ("test all. let's get all of the information to judge"; new cards: "do
whichever you suggest"), on branch `claude/fixes-and-cards` after an adversarial review.

- **K14 (`kp2-r14`):** the twelve official powers and the plain king, plus `Haste~vh1..vh4`,
  `Mercy~vm1..vm3`, `Darkness~vd1`, `Darkness~vd2` (`--variant h1:hasteApart=true`,
  `h2:hasteNoThreat=true`, `h3:hasteNoForward=true`, `h4:hasteNoCheck=true`,
  `m1:mercyAuraPawnsTake=true`, `m2:mercyAuraPawnsTake=true,mercyTakesPawns=true`,
  `m3:mercyNoJump=true`, `d1:darknessShelter=true`, `d2:darknessShelter=true,darknessShelterPawnsTake=true`);
  the official rules of round 13; seed 1414, 48 pairs, `--armies perPair`, depth 3. 212 matchups
  (a variant does not meet its own base power or a sibling), 20,352 games: 21 shards, 5 on Kaggle.
- **cards-a2:** `card:Mimic`, `card:Vault`, `card:Curse`, `card:SkyLift` against `none`
  (`--anchor none --mirror`), 300 pairs, seed 5454, `--armies perPair`, depth 3, the card rules of
  `cards-a1`; every card plays the no-card baseline's armies. 3,000 games on the Mac.
- **Results:** K14 in `docs/research/kings-powers-balance-2026-10-02.md` (Round 14): H1/H3, M2 and D2 each land near 50, but together leave Death Touch about 54.6 and Shadow about 3.6 ahead of Spirit. cards-a2 in `docs/research/cards-2026-10-03.md` (measurement 3).

## Ran 2026-10-03 night: K15, the rest of cards-b4, cards-b5

Launched on the owner's go ("plan and execute the next runs to use up those 8 hours"), this Mac
(`night.sh`: 16 one-worker shards at a time, `xargs -P 16`) and 5 Kaggle notebooks. The M1 was off
this network.

- **K15 (`kp2-r15`, branch `claude/dt-trims`):** round 14's rules plus the package H1 + M2 + D2
  (`hasteApart`, `mercyAuraPawnsTake`, `mercyTakesPawns`, `darknessShelter`,
  `darknessShelterPawnsTake`) as the round's rules; variants `Haste~vh3`
  (`hasteApart=false,hasteNoForward=true`) and `DeathTouch~vt1..vt5` (no backward reach; no
  sideways reach; the reach takes pieces only; forward reach only; no reach). Seed 1515, 64 pairs,
  `--armies perPair`, depth 3; 155 matchups, 19,840 games, 52 shards. First started at 96 pairs, then
  cut to 64: on its 61 W charger this Mac ran at half speed (93 → 177 ms a ply), so 96 pairs would
  not finish overnight (the 1,501 games of that start are in `sim/out/void-r15-p96/`). Decides: which Death
  Touch trim puts it in 50 ± 4 with Spirit − Shadow near 0, under the package. Each choice
  is put in place from games played (every variant meets every other power), not predicted.
- **cards-b4, shards 0–7** (7 and 8 cards; the M1's half): shards 0–4 on Kaggle, 5–7 here.
- **cards-b5:** `cards6` dealt from all twelve cards (`--cardPool` the eight powers plus Mimic,
  Vault, Curse, SkyLift), `--mirrorOnly`, 800 pairs, seed 5555 (cards-b2's armies, so paired with
  its `cards6` and `none`), the card rules of `cards-b2`. 16 shards, 11–15 on Kaggle when the
  cards-b4 notebooks finish. Decides: whether the four new cards keep White's score, draws and
  game length where the eight-card deal has them.
- **Results** (all done by 18:36): K15 in `docs/research/kings-powers-balance-2026-10-02.md` (Round
  15): Haste H3 + Mercy M2 + Darkness D2 + Death Touch T2 (no sideways reach) puts all twelve powers
  at 47.4–53.1 with Spirit − Shadow −0.7 ± 2.4. Cards in `docs/research/cards-2026-10-03.md`
  (measurement 4): eight cards have fewer draws (4.1%) and shorter games than six, as fair; six
  cards from all twelve play like six from the eight. Kaggle was not needed for cards-b5.

## Ran 2026-10-04: K16

Owner: Darkness "we must find a different change to bring close to 50%". This Mac (shards 0–7, 2
workers each) and 5 Kaggle notebooks (shards 8–12); the M1 was off this network.

- **K16 (`kp2-r16`, branch `claude/powers-r16` at 6640091):** the official set (round 14's readings
  with Mercy M2) as the round's rules; variants `Darkness~vd1` (`darknessShelter`), `~vpa`
  (`darknessPawnArmor`), `~vau` (`darknessAuraPawns`), `~vks` (`darknessKingStep2`). Seed 1616, 64
  pairs, `--armies perPair`, depth 3; 126 matchups, 16,128 games, 13 shards. Decides: which second
  part brings Darkness near 50 with Spirit − Shadow near 0.
- **Results** (Mac 95 min, Kaggle 150–165 min): in `docs/research/kings-powers-balance-2026-10-02.md`
  (Round 16): the king step puts Darkness at 46.9 with Spirit − Shadow −0.7 ± 2.4; D1 and the pawn
  armour overshoot (53.5, 52.7) with Shadow ahead; the pawn aura does nothing.

## Ran 2026-10-04: the guard reserve; cards-a3 replaced by cards-m5 (branch `claude/salvation`)

Built on the owner's go ("'Salvation (a 2014 card)' - yes, build"; "guard - do the testing"). The
guard reserve runs ran on 2026-10-04. `cards-a3` did not run: cards-m5 (below) played Salvation.

- **cards-a3:** `card:Salvation` against `none` (`--anchor none --mirror`), 300 pairs, seed 5656,
  `--armies perPair`, depth 3, the card rules of `cards-a2`; 1,200 games, about 5–6 min. Command and
  rules: `docs/research/cards-2026-10-03.md`, "Salvation". Decides: Salvation's value and draws
  against no card (measurement 1).
- **pa-grs1, pa-grs12, pv-G-grs1, pv-G-grs12:** activity on `pa-a14`'s armies (9,000 games each) and
  the Guard's worth (1,000 games each) under `guardReserve=rank1` and `rank12`; about 52 min. One
  detached chain: `docs/research/piece-balance-criteria-2026-10-03.md`, "Guard reserve". Decides:
  whether a guard that enters from beside the board passes criteria 1 and 5.
- **Results:** `docs/research/piece-balance-criteria-2026-10-03.md`, "The Guard readings
  (2026-10-04)", on `claude/archer-far`. Only the reserve passes criterion 5 (89.6% and 95.4% moved),
  partly because the entry counts as a move. The Guard's worth does not change (−186 ± 17 and
  −181 ± 18 Elo against the Knight); draws do not change. Salvation, in cards-m5: +0.71 ± 0.40 pawns.
  Raw games: `origin/claude/kp2-results` (4567479).

## Ran 2026-10-04: cards-m5, every card against no card (branch `claude/cards-all`)

Built on the owner's go ("cards - let's add all and test variations for whatever might not work in
our version or might be overpowered"). Ran 2026-10-04.

- **cards-m5:** the 13 new cards that can act against no card (Rescue and MirrorB each with a
  Freeze), the Freeze alone, and Salvation, each against `none` with the no-card mirror games, 300
  pairs, seed 5858, depth 3, the card rules of `cards-a2`: 9,600 games, about 42 min on the Mac, about
  30–37 min in 23 shards with the M1 and 5 Kaggle notebooks. **cards-m5-mirror:** Mirror against a
  Freeze, 1,800 games, about 8 min. Replaces `cards-a3` (Salvation is in it). Commands:
  `docs/research/cards-2026-10-03.md`, "Measurement 5". Decides: each card's value and draws against
  no card, and whether each softer `B` reading is needed.
- **Results:** `docs/research/cards-2026-10-03.md`, "Measurement 5", Results (2026-10-04). Rage
  +4.06 and RageB +3.97 pawns: about 1.7 Hastes, the one overpowered card, and RageB is not softer.
  MirrorB +2.22; Mirror about 0. Rescue +0.40, nothing measurable. Raw games:
  `origin/claude/kp2-results` (4567479).

## Ran 2026-10-05: K18, the released set on fresh armies

- **K18 (`kp2-r18`, at 45ec461):** the twelve official powers as released (Mercy M2, the Darkness king
  step), seed 1818, 40 pairs, `--armies perPair` (2,640 armies), depth 3; 66 matchups, 5,280 games on 5
  Kaggle notebooks (97–165 min each). Spec: `sim/out/kp2-r18.kaggle.json`. Decides: whether the released
  set holds 50 ± 4 on fresh armies.
- **Results:** 10 of 12 inside 50 ± 4. Haste 58.3% ± 3.3 and Death Touch 55.1% ± 2.9 are off centre
  with all twelve tested together; Flight 46.6 ± 3.1 is low on its own interval only. Flame king 54.9 ±
  2.1; Spirit − Shadow −3.3 ± 3.2. Draws 14.0% (10.1% adjudicated). **Owner (2026-10-06): Haste stays
  as it is.** Report, games and specs: `origin/claude/kp2-results` (101130c), `sim/out/kp2-r18.*`.

## Ran 2026-10-05/06 on the M1: the Archer `over23` (branch `claude/archer-reach`, d664ec7)

- **pa-ao3:** activity, 9,000 games (`--mirrorOnly`), seed 7001, the one-Beast pool,
  `--rule archerShots=over23`; 37.6 min on 8 workers. **pv-A-ao3-n1, -n2:** worth against the Knight,
  1,000 games a pass, seed 1036, 77 Elo a pawn, A = 505 then 320; about 3 min a pass. **pv-A-ao3na-n1, -n2:** the same played
  to the end (`--noadjudicate`), A = 299 then 283; about 4 min a pass. Chains `m1-reach.sh`,
  `m1-noadj.sh` in `~/projects/king-down-runs` on the M1.
- **Results:** captures 1.30× the average piece, moved 96.3%, draws 17.0% (−8.3 points with an
  Archer). Worth 3.0 ± 0.27 pawns with adjudication, 2.70 ± 0.26 without (both converged). **Owner
  (2026-10-06): too cumbersome.** Games, specs, reports and the two chain logs: `origin/claude/kp2-results`
  (f086c93).

## Running and queued, 2026-10-06

All at depth 3 with `--armies perPair`. The card runs use cards-m5's card rules (`--rule markFree=true
--rule hasteCaptures=false --rule strikeCaptures=false --rule strikePawns=false`).

| id | where, code | entrants and flags | games | state |
|---|---|---|---|---|
| rage-q | Kaggle, 2 notebooks; df8c880 (`claude/rage-trim`) | `card:Rage,card:Haste,none --anchor none --mirror --pairs 300 --seed 5858 --rule rageSecond=quiet` | 1,800 | done: +4.01 ± 0.51 pawns, draws 6.5% |
| rage-s | Kaggle, 2 notebooks; df8c880 | the same with `--rule rageSecond=stopOnTake` | 1,800 | done: +4.47 ± 0.54, draws 6.0% |
| rally-r1 | M1, 8 workers; e2c009b (`claude/power-schema`), `~/projects/king-down-rally/m1-rally.sh` | `card:Rally,card:Haste,none --anchor none --mirror --pairs 300 --seed 5858` | 1,800 | done: +2.60 ± 0.46 pawns, draws 9.8% |
| haste-from10 | M1, after rally-r1; 006de4f, `~/projects/king-down-r2/m1-r2.sh` | kp2-r18's powers, flags and armies (seed 1818, 40 pairs) with `--anchor Haste --rule fromMove=Haste:10` | 880 | done: 58.4% ± 3.1 (58.3% without), no effect |
| morph-a1 | Kaggle, 5 notebooks, after the Rage runs; ab14413 (`claude/morph-card`), watcher `kaggle-morph-queue.sh` in the session scratchpad | `card:Morph,card:MorphB,card:Haste,none --mirror --pairs 150 --seed 6161` (10 matchups) | 3,000 | done: Morph 86.2% ± 2.3 against the field (98% against no card: a free queen on move 3), MorphB +3.3 pawns (77%), the Haste card 70% against no card; draws 7.3–9.6% (no rise); report `.claude/worktrees/agent-a6a67079b28e16f6c/sim/out/morph-a1.report.md` (git-ignored, this Mac) |
| spawn-r1 | M1; ed23ea1 (`claude/spawn-card`) | `card:Spawn,card:SpawnK,card:Spawn2,card:SpawnK2,none --mirror --pairs 300 --seed 5858` (the four Spawn cards against no card) | 3,000 | done: SpawnK2 +1.55 ± 0.40 pawns, SpawnK +0.80 ± 0.36, Spawn2 +0.50 ± 0.40, Spawn +0.36 ± 0.38; draws unchanged (mirror 15.3% ± 4.1; Δ −1.5 to +2.0, each ± 5); report `~/projects/king-down-spawn/sim/out/spawn-r1.report.md` on the M1 |
| morph-b1 | Kaggle; 5a3c71a (`claude/morph-soft`) | `card:MorphP,card:MorphS,card:Haste,none --mirror --pairs 150 --depth 3 --seed 6262 --armies perPair --rule markFree=true --rule hasteCaptures=false --rule strikeCaptures=false --rule strikePawns=false` (10 matchups, as `morph-a1`) | 3,000 | done: read 2026-10-06. MorphP 70% against no card (+2.3 pawns; 50% against the Haste card; first use median ply 5, used in 99.7% of games), MorphS 59% (+1.0 pawn; 43% against Haste; median ply 34), Haste 68% (+2.0); draws 13.7–15.3% (no rise); both inside the fair band 0.7–3; report `sim/out/morph-b1.report.md` (git-ignored; Kaggle commit 69a85c1) |
| pv-A-af2na | M1, 8 workers; d664ec7, `~/projects/king-down-runs/m1-noadj-far2.sh` (owner's go 2026-10-06: "put m1 and kaggle to work on pieces and cards") | the far2 Archer's worth played to the end: `m1-noadj.sh` with `--rule archerShots=far2`, from A = 283, at most 4 Muller passes of 1,000 games | 2,000 | done: n1 3.35 ± 0.27, n2 **3.39 ± 0.27 pawns** (converged; Elo +17 ± 20 against the Knight). Played to the end, far2 stays above 2.5 pawns. pv-A-af2 (2.83 ± 0.28) was one pass against the Rook, so the two numbers are not a strict pair |
| cards-d1 | Kaggle shards 0–4 of 9 + M1 shards 5–8 (`~/projects/king-down-cards/m1-cards-d1.sh`, after pv-A-af2na); main 8902567 | every deal candidate against no card on fresh armies: the eight one-use powers, Mimic, Vault, Curse, SkyLift, Salvation, Firewall(B), EarthQuake(B), Burn, FireStarter, Control, Growth(B), Rally, Spawn2, SpawnK, SpawnK2, MorphP, MorphS, none; `--anchor none --mirror --pairs 300 --depth 3 --seed 7070 --armies perPair` and the card rules above. Left out: Rage, RageB (rage-trim), Morph, MorphB (over the ceiling), Spawn (set aside), Mirror, MirrorB, Rescue (need a second card) | 17,400 | done 2026-10-06 (Kaggle 178–187 min a shard, M1 70 min): against no card, Rally +2.90 ± 0.45 pawns, MorphP +2.65, Haste +2.59, Control +2.22, Firewall +2.21, Burn +1.86, Strike +1.55, Growth +1.53, Flight, SkyLift = MorphS (identical games), Vault +1.45, Sacrifice +1.37, Mimic +1.29, SpawnK2 +1.18, Freeze +1.15, Salvation +1.10, GrowthB +1.09, FireStarter +1.08, FirewallB +1.07, Spawn2 +0.88, EarthQuakeB +0.85, Leap +0.79, EarthQuake +0.77, SpawnK +0.66, March +0.56, IceWall +0.55, Curse +0.31 (each ± 0.35–0.46). None above the fair-card ceiling of 3; Curse, IceWall, March and SpawnK below or at the floor of 0.7. Draws: no-card mirror 19.7% ± 4.5; every card's games 9.8–18.2%. Report `sim/out/cards-d1.report.md` (git-ignored, this Mac) |
| deal-d1 | Kaggle shards 0–4, M1 5–12 (`~/projects/king-down-cards/m1-deal-d1.sh`), this Mac 13–24 (worktree `.claude/worktrees/deal-d1`, 12 workers; owner: "also on this mac", 140 W charger); main 7c44946 (owner's go 2026-10-06: "do another multi-hour run on both m1 and kaggle") | the six-card deal as played: `cards6,none --mirrorOnly --mirror --cardPool` the 27 cards of cards-d1 (MorphS left out: it is SkyLift) `--pairs 3000 --depth 3 --seed 7171 --armies perPair` and the card rules above | 6,000 | done 2026-10-06 (about 2 h): White 50.2% ± 1.7 with six cards, 50.4% without (Δ −0.2 ± 2.4); draws 8.3% against 18.9% (**−10.6 ± 1.7**); 17 turns shorter; 4.77 cards played a side. No card moves White's edge measurably; GrowthB raises draws (+3.6 ± 2.6). `docs/research/cards-2026-10-03.md`, Measurement 6 |
| deal-d2 | Kaggle, 5 notebooks; main 407011a (owner's go 2026-10-06: "yes") | deal-d1 with Mirror, MirrorB, Rescue, Rage and RageB added to the pool (32 cards): `cards6,none --mirrorOnly --mirror --cardPool … --pairs 1200 --depth 3 --seed 7272 --armies perPair` and the card rules above | 2,400 | done 2026-10-07: White 49.3% ± 2.7 (Δ against no card −4.2 ± 3.7), draws 7.2% (Δ **−13.2 ± 2.7**), 20 turns shorter, 4.62 cards a side. Per card (`tools/deal-cards.ts deal-d2`): no card moves White's score or draws outside its ±7 / ±4 interval; Mirror −0.9, MirrorB −2.3, Rescue −3.9, Rage −0.1, RageB −2.3 points of White's score |
| pv-A-af2-vsR-d4, pa-af2-d4 | M1, `~/projects/king-down-runs/m1-night.sh`; d664ec7 | the far2 Archer at depth 4: worth against the Rook (as pv-A-vsR-d4: 600 + 1,800 games, seed 1005) and activity on pa-d4's 1,600 armies (seed 7001, `--rule archerShots=far2`), then `tools/piece-activity.ts` | 4,000 | done 2026-10-07: worth **3.22 ± 0.34 pawns** (one pass, Elo −89 ± 24 against the Rook, one pawn = 70 ± 14 Elo); captures 1.55× the average [1.51, 1.60] (today's Archer at depth 4: 2.15×), moves 1.57×; moved in 99.4% of games. Reports `~/projects/king-down-runs/sim/out/pv-A-af2-vsR-d4.experiment.md`, `pa-af2-d4.activity.md` on the M1 |
| deal-d1d4 | M1, after the far2 runs; main 407011a (`~/projects/king-down-cards`) | deal-d1 at depth 4 on its first 500 armies (seed 7171) | 1,000 | done 2026-10-07: White 50.9% ± 4.2 (Δ +2.8 ± 5.7), draws 10.2% (Δ **−12.8 ± 4.6**), 27 turns shorter: depth 3's result holds |
| gs-probe | Kaggle, 5 notebooks, after deal-d2; code to build (owner's go 2026-10-06: "queue them to run next") | Guard probes E1–E7 × weights 30/80 cp, bonus side against the plain engine, Guard on b1; 400 pairs each, depth 3 (`docs/research/guard-strategies-2026-10-06.md`, Part 1) | 10,400 | done 2026-10-07: no probe helps; best E2-30 +0.06 ± 0.24 pawns; worst E5-80 −0.63 ± 0.26, E2-80 −0.46, E1-80 −0.37 |
| kd-rand | Kaggle, 5 notebooks, after gs-probe | king defence from random threat positions: 3,000 positions × 4 arms (Guard in, Guard out, Pawn, None) × 2, depth 3, max 120 plies (Part 2) | 24,000 | done 2026-10-07: defender 27.8% with the Guard next to the king, 12.0% with none: **Guard in defence +2.82 ± 0.19 pawns**; against the Guard far away +1.86 ± 0.20, against a pawn there +1.13 ± 0.20; interpose square +3.59 ± 0.40; the king lives 34 plies against 18 |
| gs-probe-k | M1, after deal-d1d4 | E1, E3, E6 × 30/80 cp with the Guard next to the king; 400 pairs each | 4,800 | done 2026-10-07 (22 min): no probe helps. E1 escort −0.24 ± 0.32 pawns at 30 cp, **−0.88 ± 0.34 at 80 cp**; E3 interpose +0.19 ± 0.27 / −0.16 ± 0.29; E6 king net −0.04 / −0.17 (fires in 2–5% of positions) |
| kd-real | M1, after gs-probe-k | king defence from positions of pa-r1 and far2 games (ply 30–60, 2+ attackers near the king): 1,500 × 4 × 2; positions from pa-kd, 1,600 new games under the shipped rules (`m1-kdreal.sh`; the far2 records do not replay on main) | 12,000 | done but weak: the filter kept only 38 positions from 1,600 games, so 12,000 games replay 38 positions; not read |
| kd-real2 | M1, 8 workers; main 7d4370f, `~/projects/king-down-guard/m1-kdreal2.sh` (owner's go 2026-10-07) | kd-real with a looser filter: `king-threat-fens.ts real --plies 20-80 --attack 1@3,2@4 --allPlies` (eval window kept) on pa-kd + pa-kd2 (3,200 new source games, seed 7003); 1,500 positions × 4 × 2, `--openingRandomPlies 0 --maxPlies 120`, seed 6364 | 12,000 | done 2026-10-07 (17 min): Guard next to the king against none **+1.05 ± 0.24 pawns**; against the Guard far away +0.37 ± 0.24, against a pawn +0.38 ± 0.24; interpose only +2.01 ± 0.80 (145 positions) |
| guard-king, guard-king-p | M1, after kd-real2; main 7d4370f | `none --mirror --fens`, normal start, 4 random opening plies, 2,000 pairs per arm. place: RNBQKGNR against RGBQKNNR (guard-king-p, seed 6366); worth: RNBQKGNR against RNBQKNNR (Knight on f1; guard-king, seed 6365). Report `tools/guard-probes.ts gk` | 12,000 | done 2026-10-07: place **+0.53 ± 0.14 pawns** (54.9% ± 1.3) for the Guard next to the king; worth on f1 **−2.52 ± 0.17 pawns** against a Knight (28.3% ± 1.3, outside the linear band); the f1 Guard moves in 88–91% of games, 3–4 times a game. guard-king's own place arm used RGBQKBNR by mistake (not the same army): 56.7%, not read |
| gs-probe-d4 | Kaggle, 5 notebooks; 87b42b7 (owner 2026-10-07: "do guard for kaggle") | E1–E5 at 30 cp and E7 against the plain engine, Guard on b1, 300 pairs, **depth 4**, seed 6464 | 3,600 | done 2026-10-07: no plan helps at depth 4 either; best E3-30 +0.24 ± 0.25 pawns, E7 +0.21 ± 0.33, worst E5-30 −0.21 ± 0.26 |
| kd-rand-d4 | Kaggle, after gs-probe-d4 | kd-rand's positions × 4 arms, `--mirrorOnly`, **depth 4**, seed 6565 (6,000 pairs = 1,500 positions) | 6,000 | done 2026-10-07: Guard next to the king **+2.86 ± 0.27 pawns** against none (depth 3: +2.82), +1.49 against far, +1.04 against a pawn; interpose +3.41 ± 0.58; the king lives 43 plies, not 21 |
| guard-king-p-d4 | Kaggle, 5 notebooks; 466089d (owner 2026-10-07: "if m1 and kaggle finished - launch next run per your recommendation") | guard-king-p at **depth 4**: RNBQKGNR against RGBQKNNR, `none --mirror --fens`, 4 random opening plies, 2,000 pairs, seed 6367 | 4,000 | running |
| deal-d3 | Kaggle, 5 notebooks, after guard-king-p-d4; main bc1bb04 (owner 2026-10-07: "set up a 6 hour run for kaggle, m1 and this mac to queue in when they finish") | the deal after the owner's card decisions: deal-d1's 27 cards plus MirrorB (Mirror, Rescue and Rage out), `cards6,none --mirrorOnly --mirror`, 7,000 pairs, depth 3, seed 7575, card rules | 14,000 | queued |
| hand-size-d4 | M1, after dt-*; `~/projects/king-down-guard/m1-hs4.sh` (owner 2026-10-07: "set up a 6 hour run for kaggle, m1 and this mac to queue in when they finish") | hand-size at **depth 4**: cards2, cards3, cards4, cards6 and none, 600 pairs, seed 7474 | 3,000 | queued |
| dt-r0-d4, dt-t2-d4, dt-t3-d4 | this Mac, 12 workers; worktree `.claude/worktrees/mac-runs` at bc1bb04, `mac-dt-d4.sh` (owner 2026-10-07: "set up a 6 hour run for kaggle, m1 and this mac to queue in when they finish") | dt-r0, dt-t2, dt-t3 at **depth 4** (80 pairs, seed 1919) | 3 × 1,760 | running |
| hand-size | M1, after guard-king; 87b42b7, `~/projects/king-down-guard/m1-next.sh` (owner 2026-10-07: "do what you recommend") | `cards2,cards3,cards4,cards6,none --mirrorOnly --mirror --cardPool` deal-d1's 27 cards, 1,500 pairs, depth 3, seed 7373, card rules | 15,000 | running |
| dt-r0, dt-t2, dt-t3 | M1, after hand-size | the twelve powers `--anchor DeathTouch`, 80 pairs, seed 1919, depth 3: as released; `deathTouchReachForwardBack`; `deathTouchReachPieces` | 3 × 1,760 | queued |

Decides: rage-q, rage-s: whether a trim brings Rage (cards-m5: +4.06 pawns, about 1.7 Hastes) near the
Haste card. rally-r1: Rally's worth against no card and beside the Haste card. haste-from10: whether
"not before move 10" brings Haste (58.3% in K18) into 50 ± 4 on the same armies. morph-a1: each Morph
card's worth and draws against no card and the Haste card; read 2026-10-06 (Morph is a free queen on move 3, MorphB +3.3 pawns; the owner has not chosen). spawn-r1: each Spawn card's worth and draws against no card; read 2026-10-06 (owner: Spawn2 is the start-rank card, Spawn set aside, SpawnK stays, SpawnK2 stays in the lab). pv-A-af2na: whether far2's worth stays at 2.5 pawns or more with no adjudication. deal-d2: whether Mirror, MirrorB, Rescue and Rage fit the deal when both sides hold them (the per-card table, `tools/deal-cards.ts`). pv-A-af2-vsR-d4, pa-af2-d4: whether far2's worth and captures hold at depth 4 (today's Archer: pa-d4 2.15× captures). deal-d1d4: whether deal-d1's result (no change in White's edge, draws halved) holds at depth 4. deal-d1: White's edge, draws and length with the same six cards for both sides from the full pool, against no card on the same armies, and (by a script on the games) each card's effect on White's score and draws when it is in the hand. cards-d1: one table of every deal candidate's worth and draws, on one code base and one set of armies, for the six-card deal. morph-b1: the softer Morph cards' worth and draws against no card and the Haste card, as `morph-a1` (MorphS plays Sky Lift's moves: `cards-a2` measured Sky Lift at +1.2 ± 0.4 pawns on other armies).
 gs-probe, gs-probe-k: whether a lab bonus for a Guard plan (queen escort, interpose, blockade, king net and more) beats the plain engine; a winning plan gets a new worth run with the bonus on. gs-probe-d4, kd-rand-d4: whether the depth-3 Guard results hold at depth 4. hand-size: the smallest hand that keeps most of the deal's draw cut. dt-*: whether a Death Touch trim brings it from 55% into 50 ± 4. kd-rand, kd-real: the Guard's worth in defence of a king under attack, against the same position with the Guard far away, a pawn, or nothing.

## Proposed, not approved: the far2 Archer played to the end

- **pv-A-af2na-n1..n4** (M1, d664ec7): `m1-noadj.sh` with `--rule archerShots=far2`, starting at A = 283
  (far2's next seed), at most 4 Muller passes of 1,000 games; about 4 min a pass. Decides: whether far2's
  worth (2.83 ± 0.28, one pass against the Rook, `pv-A-af2`) stays at 2.5 pawns or more when no game is
  adjudicated (`over23` lost 0.3 pawns that way). Owner (2026-10-06): leaning to far2; this check needs
  the owner's go.

## Dropped

- Warden extension pass (`sim/specs/warden/*` at 3 000 games): Saar rejected the two-square guard
  on draw grounds (2026-09-14).
- `guardDoubleFirst` follow-ups: Q1 answered it. Nothing queued.
- `gs-wall-front`, `gs-wall-split` (`sim/specs/guard/*`): never run, both written for the
  two-guard pool. **Superseded by at-most-one guard** — do not promote them to active tickets
  (takeover ledger, 2026-09-14). `gs-shield-far` completed its outputs later; the earlier
  "missing summary" was a timing artefact.
