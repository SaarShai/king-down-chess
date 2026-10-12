# King powers, cards and controlled AI comparison

Status: claimed
Type: prototype

Owner approval (2026-10-11): "go ahead and port the king powers and cards, verify them against our rules engine, and then compare Fairy-Stockfish against our current AI. don't merge yet."

Plan: preserve the verified base snapshot and its backup. Port all twelve king powers and all 36 supported card names under explicit current/default and balanced profiles. Add complete state, FEN, keys, reserve, spent-card and mark handling. Reject unsupported workshop/lab signatures. Keep action-by-action parity separate from the search adapter. Compile a held turn (mark/Haste/Rage/Rally/GrowthB plus its ordinary follow-up or pass) into one complete search turn, so Fairy-Stockfish retains its alternating search; return both actions for reference-engine validation. Check that compilation covers exactly the legal continuations and that terminal results after the first action stop the turn. Do not change the shipped engine or AI.

Verification: directed two-sided fixtures for every power/card and state feature; both default and balanced readings; all legal effects and child states, attacks, FEN round trips, keys, undo, TT, marks, delayed availability, duplicate cards, Mirrors, reserves, draw/history and negative controls. Add a seeded interaction corpus and legal action traces. Rebuild from the saved patch; rerun base/upstream regressions and project checks. Freeze a paired, equal-time comparison against the browser's current residual AI, with explicit source/rules, complete starts/deals, side swaps, termination and time limits. Use a small local smoke only; larger work uses approved remote compute. Preserve partials/failures and check only at expected completion. Report score, caps, illegal moves, latency, and uncertainty. No training, rule adoption, merge or deployment.

## Progress

The independent native module and whole-turn search adapter are implemented.
Both the working and fresh patch builds pass 2,391 positions, 139,014 atomic
effects and 161,506 complete turns; every recorded check hash agrees. The corpus
includes all fixed pieces, all twelve king powers, all 36 card names, mixed
powers, both profiles/colours, copies, draws/reserves, delays and held turns.

Two baseline failures are preserved and repaired: whole-history repetition after
a reversed pawn move, and the borrowed Paladin plain-capture exclusion in
Control. The latter appears during the first game smoke. A direct and copied
Control regression fails before the repair and passes after it. No failed or
partial sample enters the match.

The corrected eight-game local smoke completes with 874 legal actions, 882
state/legal-set checks, zero caps and zero illegal actions. Current AI wins six;
native wins two. The exact smoke source archive remains on the card. This is
preliminary, with one army. Native classical evaluation remains approximate.

The paired match plan is recorded on main before launch: 192 games, 24 armies,
four groups, both engine colours, 80 ms per action and a 400-action cap. The
pilot is one base pair; five later parts have 38 games each. All sources, starts,
rules, deals and part memberships must be frozen before launch. M1 is busy with
another owner's job; use Kaggle and preserve M1. The match and final backup are
pending. No merge.

The support and frozen match are committed and pushed as `5f376872`. The
Kaggle pilot is accepted at 00:07 Pacific on 2026-10-12, after a zero-active
account audit. The expected first check is 00:27 Pacific, with a scheduled
wake at 00:32 for delivery margin. Later parts remain unlaunched until Linux
conformance, exact game replay and timing checks pass. Each runner has a tested
eight-hour process-group deadline. Campaign state, launch receipts and all
saved kernel hashes are on the mounted results card.

The Linux pilot passes: all 2,391 corpus checks match the fresh Mac build,
all 201 controls pass, and both games replay. There are 197 actions and no caps;
current AI wins both games. Notebook time is 212.07 seconds; game time is 20.112
seconds. All five remaining parts are accepted at 00:32 Pacific on October 12
after a fresh zero-active account audit. All 192 games are launched; none may
repeat. The conservative cap-length timing estimate is 34.06 minutes, with the
next scheduled check at 01:15 Pacific. Full match results stay pending.

The initial cloud backup completes at 00:22 Pacific. Receipt:
`drive:King Down/results-backups/20261012-001548-537219000`; 18,019 files.
The cloud manifest and required source/settings/check hashes agree. The external
receipt is `state/fairy-stockfish-full-backup/verified-initial.json`. A new snapshot
follows pilot collection and launch receipts. This is not the final data backup.
