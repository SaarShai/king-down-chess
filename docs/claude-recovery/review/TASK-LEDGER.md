# Reconciled task ledger — 2026-09-14

This is the current interpretation of the historical tickets and queues, not a request to execute them. See the [takeover review](</Users/za/Documents/king down chess/docs/TAKEOVER-REVIEW-2026-09-14.md>) for evidence and the [unstarted plan](</Users/za/Documents/king down chess/docs/TAKEOVER-PLAN.md>) for acceptance criteria.

## Where work was tracked

| Location | Role / current reliability |
|---|---|
| `TASKS.md` | Main chronological log. Later entries supersede earlier unchecked decisions and subtask handoffs. |
| `docs/QUEUE.md` | Named Q1–Q7 runs, but contains stale launch instructions after completed Q7 and old Q2 wording. Q6 is the surviving active chain. |
| `docs/RUNS.md` | R1–R10, batch 3 and batch 4 ledger; early “proposed” wording is not current status. |
| `docs/SIM-PLAN.md` | Experiment methodology and gates. Old pool/rule examples are historical, not a current baseline. |
| `docs/MATRIX.md` | Ability map, not a reliable implementation checklist: paladin/power cells lag current source. |
| `docs/KINGS-POWERS-PLAN.md` | Detailed prospective scope. Six Tier-1 powers are partly built; later tiers and 24 design recommendations remain proposed. |
| `docs/PIECES-PROPOSED.md` | Five ideas. Ogre/Catapult were selected and built for the lab; “nothing built” and the single Catapult reading are stale. |
| `sim/specs/**/*.json` | 79 stored specs: 32 batch3, 22 root, 13 guard, 7 warden, 5 newpieces. Two old two-guard placement specs have no result files. Full [spec index](</Users/za/Documents/king down chess/docs/claude-recovery/review/SPEC-INDEX.md>). |
| Scratch shell scripts | `queue.sh`, `queue2.sh`, `queue3.sh`, `chain.sh`, `chain2.sh`, `ab.sh`, `analyse.sh`, polling scripts. They contain ad-hoc runs not represented by one JSON ticket per task. `queue3.sh` remains active; `chain2.sh` completed. |
| Claude cron/poll records | Historical cron created then deleted; one-shot shell polling replaced it. No ongoing monitoring service established. |
| Claude task database / separate plan | No matching standalone TaskCreate/TaskUpdate database or extra plan was found. Agent dispatches and shell jobs are indexed in the recovered transcripts. |

## Existing campaigns and decisions

| Ticket / work | Reconciled status | Remaining action |
|---|---|---|
| Framework, UI, B2 art, lifecycle fixes | Completed and released through v0.7 | Preserve baseline; regression QA when changing it. |
| Source/art curation | Completed for current scope | No new Drive retrieval needed. |
| R1 strength ladder | Completed | Historical reference; do not launch again from the old proposal. |
| R2 composition / R3 placement | Completed | Interpret within their original guard/pool regimes. |
| R4 toggles / R7 2021 concepts | Completed | Historical comparisons, not pending implementation requests. |
| R5 tuning and later evaluation refit | Shipped | Keep linear baseline pinned while evaluating Q6. |
| R6 buff campaign | Completed; guard proposal superseded | Archer/beast changes retained; current guard is the Wall. |
| Batch 3 | Completed: 32 runs / 76,100 games | Most data used earlier guard semantics. `b3-nobeast` duplicated its control rather than isolating a no-beast intervention. |
| R8 paladin grid / LM study | Exploratory results exist; selected change finished through Q2/Q7 | No obligation to exhaust every old grid cell. Unselected maester changes remain optional. |
| R9 / Q4 double first turn | Owner rejected; closed | Qualify numerical evidence because search is incorrect for extra turns. No automatic rerun. |
| R10 Warden / one-guard | One guard adopted; Warden rejected | 3,000-game Warden extensions are dropped. |
| Q1 home-rank guard double step | Ran; rejected | No further guard-double-step campaign. |
| Q2 paladin survives pawn captures | Ran; adopted after Q7 | Update stale “Saar’s call” wording. |
| Q3 maester swapAny | Ran; not adopted | Preserve current default; optional later decision. |
| Q5 no-sacrifice diagnostic | Ran; exploratory diagnosis | Keep uncertainty and the limited design inference explicit; no pending rerun. |
| Q6 residual AI | Generation survived interruption; downstream stages unvalidated | First priority: stage control, provenance/replay audit, valid dataset, gated candidate evaluation. |
| Q7 depth-4 paladin confirmation | Completed at 800 games/arm, published v0.7 | Delete stale instructions to run another 400-game confirmation after Q6. |
| `pb-ab-base` | Void mixed control, retained on disk | Never use for new comparisons. `pb-ab-base24` is clean for its recorded old-paladin comparison, not a timeless current baseline. |
| `gs-shield-far` | Completed outputs now exist | Earlier missing-summary errors were timing, not an unfinished campaign. |
| `gs-wall-front`, `gs-wall-split` | Never run; both use two guards | Superseded for current at-most-one-guard design. Do not silently promote them to active tickets. |
| First full NNUE | Completed experiment; lost to linear, disabled | No reason to deploy or restart it. Q6 addresses its failure mode. |
| `np-N`, `np-O`, `np-C` plus O/C odds and A/B arms | Replacement chain completed, 13,600 games total | Verify provenance/control replacement, finish report and integration QA; targeted second-depth/value work only if warranted. |
| Kings Tier 1 | Partial code for six powers; no dedicated tests or simulation results | Finish semantics/tests/integration before measurements or exposure. |
| Kings Tiers 2–3 | Plan only | Deferred; no invented “interrupted implementation” ticket. |
| Setup liveliness | JSON and scratch modeling results exist; final report absent | One frozen dataset, genuine held-out validation and diversity check; possibly conclude no filter. |
| Procedural tiles | Generator/B4 option/screenshots/means exist | Final report, browser QA and default choice; resolve flagged published assets. |
| v0.7 publication | Parent published after worker handoff | “Built, NOT published” heading is stale. Preserve local release bundle. |

## Missing or misleading documentation

- `docs/research/sim-new-pieces-2026-09-14.md` contains `PLACEHOLDER-SHORT`; the measurement description is ahead of the finished prose. The surviving chain’s results are now present.
- `docs/research/setup-liveliness-2026-09-14.md` was never completed. `setup-liveliness-2026-09-14.json` and scratch `FINAL.txt` use different snapshots. The scratch scripts/results are indexed, not an approved filter.
- `docs/research/tiles-proc/README.md` is absent. Before/after screenshots and `means.json` exist.
- No completed Q6 acceptance report or king-power experiment results were found. This matches their execution state.
- `docs/research/sim-batch2-2026-09-13.md` is referenced but absent; the separate strength/configuration/rules/buffed/tuning reports cover those runs.
- `docs/STATUS-2026-09-13.md` and `docs/status/index.html` describe an older guard regime. The recovery status at roughly 07:30 predates completion of the new-piece chain.
- TASKS contains already-resolved “exactly one?”/paladin/Warden/publish questions. QUEUE’s Q7 command is already superseded by the completed extension. MATRIX still marks pawn-surviving paladin as a lab candidate and powers as wholly unbuilt.
- Old Q4 wording about a broken killer-move metric was corrected. The new search finding is a separate defect; do not undo the completed reporting fix.

## Source gaps that do not block takeover

The inaccessible `King Down (rules FINAL)` Google Doc target could not be retrieved in the earlier authenticated check; 404 does not establish deletion. Current rules are supported by the recovered 2017 Classic PDF, draft texts, matrices and explicit owner decisions. The missing seven website-folder items are card pictures, not code. The discarded raw Drive tree was replaced by curated source assets. Under the owner’s assumption, no extra cloud-only records are pending.

Future implementation should use this reconciled status instead of replaying commands from a historical transcript. Those commands record what happened; they are not current instructions.
