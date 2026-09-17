# King Down takeover plan

**Status: planned, not started.** Prepared September 14, 2026 from the [deep review](</Users/za/Documents/king down chess/docs/TAKEOVER-REVIEW-2026-09-14.md>), [reconciled task ledger](</Users/za/Documents/king down chess/docs/claude-recovery/review/TASK-LEDGER.md>) and current code. The user requested review and planning only. No phase below has been executed.

The objective is to take over the working v0.7 game and finish the interrupted development with trustworthy evidence. Preserve the selected B2 direction, one-guard Wall, current archer/beast and paladin rules. Keep the linear evaluator, powers off and the existing random pool until each candidate clears its own acceptance criteria. Do not reopen settled design decisions or rebuild the stack.

## 1. Establish a recoverable baseline and control the inherited pipeline

- [ ] Recheck processes, Q6 logs, completion markers, generated weights and all source/build hashes; the surviving chain can advance after this document is written.
- [ ] Retain completed generation, but stop automatic progression into unvalidated sampling/training at a safe boundary. If it already progressed, preserve and label those outputs as unvalidated rather than treating its done marker as success.
- [ ] Preserve the exact working source, v0.7 `dist`, simulation specs/results and necessary scratch transcripts/scripts. Include the unfinished liveliness scripts, QA harnesses and chain scripts; record hashes and original paths. The existing hash indexes alone are not backups.
- [ ] Correct the ignore rules so simulation **source and specs** can be versioned while bulk generated data remain deliberately managed. Establish a reviewed source baseline; do not bulk-add private transcripts or gigabytes of generated data to a remote repository.

**Acceptance:** a recoverable source/build snapshot; a complete list of surviving jobs and their stage; documented ownership of all run/model outputs; simulation source/specs visible to version control. Existing gameplay remains the v0.7 baseline.

## 2. Make rule identity consistent across execution and replay

- [ ] Pass the active rule snapshot into browser AI workers, including newly spawned workers after cancellation. Persist the rule configuration with saved games and restore it before replaying moves. Test default and historical presets plus a king-power case in a real worker.
- [ ] Give every new simulation an immutable identity covering resolved rules, pool/arrangements, seed, search/evaluation settings and source/model version. Validate all records on resume; reject mixed, unstamped or partial records as inputs to a new run. Use new run IDs instead of silently continuing ambiguous history.
- [ ] Make sampling use the recorded rules and matching replay implementation, validate legal moves and resulting state, and preserve input fingerprints in the dataset/model manifest. Do not let current defaults reinterpret a past paladin capture.
- [ ] Replace the fail-open stage chain with the smallest sequential process that stops on failure, marks success only after validation, and keeps candidate model output separate from the source used by active workers.
- [ ] Qualify Q4’s existing double-turn evidence and retire its commands from the active queue. Do not rerun this rejected feature. Actual-mover search, score sign, hashing, repetition and exact state serialization become prerequisites only if a later feature such as Haste needs extra turns.
- [ ] Enforce the documented rejection gates before any new arrangement sweep selects survivors, or explicitly keep that tool exploratory until a sweep is needed.

**Acceptance:** focused regressions reproduce and fix worker/rule disagreement, save/replay disagreement and mixed/truncated run handling; a replay audit passes under a pinned configuration; a deliberately failed stage cannot start training or produce a success marker. TypeScript and the existing suite still pass. No speculative compatibility layer or framework change is needed.

## 3. Finish Q6 using a defensible dataset

- [ ] Classify the existing 686-record prefix separately from the later cohort using launch records, file history and move replay. Audit the cohort’s old-paladin semantics and teacher evaluation. If a subset cannot be established confidently, exclude it; preserve it as historical evidence. Generate replacement data only for a demonstrated gap.
- [ ] Freeze the accepted dataset and linear teacher/base evaluation. Sample under its actual rules. Decide explicitly whether the model is trained on old-paladin positions or whether current-rule data are required; assess the candidate only in the intended current game.
- [ ] Train one residual candidate using the prepared bounded-residual approach. Keep the default linear. Record source, dataset and model hashes, training parameters and validation results together.
- [ ] Apply the documented staged acceptance: 400-game rejection gate; then 1,600-game depth-3 decision with positive 95% lower Elo bound; depth-4 confirmation without a sign reversal; speed check against the browser’s one-second target. Pin both arms and use the intended independent seeds. Stop on a failed gate.
- [ ] Write a short accept/reject report. Adopt only a candidate that passes; a failed model is a completed experiment, not permission for an unlimited tuning campaign. Defer incremental accumulators until a useful model demonstrates a speed need.

**Acceptance:** no ambiguous source games in the training corpus; reproducible model and matches; explicit strength and speed verdict. Publishing or changing the default is a later release step, never an automatic consequence of `train` completing.

## 4. Close the Ogre/Catapult campaign

- [ ] Audit existing 13,600-game outputs and the replacement `np-N` control against frozen engine/rule identities. Check that all compared arms used compatible conditions and that reports account for every expected game. Do not replay the entire chain merely because the authoring agent failed.
- [ ] Complete the missing report sections: matched comparisons, activity/guard-shove frequency, uncertainty, limitations and a concrete recommendation for each variant.
- [ ] Verify the browser path for the lab pieces: selection, shove/lob targeting, animation, undo, AI and save/restore. Existing 19 unit tests are useful but do not establish this integration.
- [ ] If the current findings survive validation, run only the needed valuation refinement and second-depth confirmation. Ogre push is the promising candidate; Catapult land/stay is presently unresolved. Keep both outside the normal pool and promotions until a separate adoption decision.

**Acceptance:** finished evidence-backed report, valid matched arms, working lab UI and a bounded next decision. Do not present the rare guard shoves as proof of solving blockades.

## 5. Finish the first six king powers as a coherent lab feature

- [ ] Reconcile implemented semantics against the owner’s rules and the proposal. Identify only material unresolved choices—especially Mercy versus guard immunity, Death Touch captures, and always-on versus charged March/Leap. Do not treat the proposal’s 24 defaults as already approved.
- [ ] Add generation, king-safety and attack-agreement coverage for Holy Light, Mercy, Death Touch, Darkness, March and Leap, including asymmetric choices and powers-off equivalence. Exercise undo, worker search and saved-game restore under active powers.
- [ ] Complete concise variant-aware guide text. Keep the default powers off. Add a chooser/army-colour integration only when the measured variants and remaining decisions warrant exposing it.
- [ ] First run small correctness/activity pilots with fresh controls on the chosen baseline; then price and compare only the valid candidates in paired tests. Confirm consequential effects at a second depth. Do not reuse old-paladin `pb-ab-base24` as a current control.

**Acceptance:** all six rule definitions are explicit, targeted tests pass, browser and worker agree, and there is a report on actual use, decisive share, draws, caps and length. No Tier-2 or reserve work starts as a substitute for finishing this layer.

## 6. Finish the supporting analysis, art and documentation

- [ ] **Liveliness:** freeze one consistently classified dataset; split by arrangement before fitting/selecting an integer score; evaluate decisive share, White advantage and piece diversity on untouched data. Finish the missing Markdown report. Adopt no filter if the gain is weak or it mostly removes the game’s defining pieces.
- [ ] **Tiles:** finish the procedural before/after report and browser visual/performance QA. Present the existing B4 option for the default-style decision. Verify the flagged asset terms before release; if replacing them, remove the relevant stock-derived files from the published package as well as changing the style selection.
- [ ] **Docs/queues:** reconcile TASKS, QUEUE, RUNS, MATRIX, RULES, proposal/status pages and dashboard with the completed findings. Remove stale “waiting”, “not published” and already-run commands; distinguish shipped, lab-only, rejected and deferred work. Repair the batch-2 report reference.

**Acceptance:** one coherent current status; no missing report sections; data tables share a snapshot; art provenance/default choice is resolved; no stale queue entry would launch a completed or rejected campaign.

## 7. Prepare the next release only after its contents are settled

- [ ] Choose the smallest validated set of changes. Keep unvalidated candidates disabled and preserve the recorded v0.7 baseline.
- [ ] Type-check, run appropriate tests, build to a separate review location, and run browser QA covering a full game, cancellation, promotion, undo, save/restore, mobile layout and any included variants. Verify the worker bundle and asset manifest.
- [ ] Produce a concrete release summary with tested behavior and any remaining limitations. Handle publication only when requested; this takeover plan does not publish anything.

**Acceptance:** a reviewable build whose behavior, assets and documented rules agree; explicit candidate decisions backed by the preceding evidence.

## Deferred scope

Freeze/Ice Wall/Strike/Haste/Flight, Sacrifice/reserves, Squire/Templar/Reaver, cards/spells, capital zones, signature-piece armies and online multiplayer remain later work. Maester `swapAny` remains an optional design choice. The deleted/inaccessible Google Doc and missing card images do not block the current plan. No cloud-record search is scheduled.

Sequence work so long-running jobs consume immutable source/configuration. Avoid editing code underneath live campaigns. Recheck each phase’s evidence before advancing; do not rerun successful checks without a new change or unresolved concern. CPU-heavy experiments should share an explicit schedule rather than competing unknowingly.
