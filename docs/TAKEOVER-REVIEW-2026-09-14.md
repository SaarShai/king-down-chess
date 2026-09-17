# King Down takeover review — 2026-09-14

The playable v0.7 game is the last completed release. The current source also contains unfinished lab work: Ogre/Catapult, six king powers, a procedural board style, setup-liveliness analysis, and preparation for a stronger AI. Some simulations continued after Claude lost access. The right continuation is to validate and finish these existing threads of work, starting with the active AI pipeline and rule consistency.

**This was a review, not implementation.** No application source, assets, existing simulation data, running job, or published build was changed. The work produced review records, this assessment, a reconciled task ledger and an unstarted [takeover plan](</Users/za/Documents/king down chess/docs/TAKEOVER-PLAN.md>). The user’s assumption of **no additional cloud-only documents or records** is the scope; cloud recovery is not an outstanding task.

## Evidence and coverage

The main Claude Desktop task was **Chess960 with fairy pieces web app**. Its original transcript, `af00383a-be3c-43af-8c39-b2e17188dc55`, is 92.18 MB and covers September 13 03:56 through September 14 03:05 PDT. The continuation, `1b13f053-b37e-481e-a963-54b0069234f9`, overlaps it and runs through subscription errors on September 14. A third, short task corrected stale Q4 documentation. Their overlap means their durations should not be added.

The review covered:

| Evidence | Coverage and limitation |
|---|---|
| Main and background conversations | All **88 local JSONL transcripts** parse: 3 main/continuation records and **85 agent transcripts** (74 original, 11 continuation). Prompts, substantive assistant messages, relevant tool results and interruption messages were reviewed. |
| Background jobs | **331 output files**, including **85 symlinks** to agent transcripts. Shell output, failure tails and completion notifications were reconciled with current results. A completion notification is not sufficient evidence of a finished report or a valid experiment. |
| Supporting records | 85 agent metadata files, **66 recursively counted saved tool-result files**, 8 memory files, two Desktop session records and 185 file-history backups were located. The earlier recovery index counted tool results inconsistently; 66 includes five rendered PDF pages. |
| Temporary working material | 379 top-level scratchpad files indexed, plus the previously inventoried source/reference material. The original scratch tree also contains dependencies and generated assets; these are not additional sessions or tickets. Crucial unfinished analysis scripts and output remain there. |
| Tickets and queues | TASKS, QUEUE, RUNS, SIM-PLAN, MATRIX, RULES, PIECES-PROPOSED, KINGS-POWERS-PLAN, research reports, all **79 stored JSON simulation specs**, ad-hoc CLI chains, cron/poll records and current output files. No separate matching Claude TaskCreate/TaskUpdate ticket database or standalone plan file was found. |
| Latest code | Rules, setup/notation, game lifecycle, UI/rendering, AI/search/NNUE, simulation runner, sampling/training, analysis/experiments, tooling and tests. Independent Standards and Spec reviews were performed as required by the code-review skill. |

Useful indexes: [background agents](</Users/za/Documents/king down chess/docs/claude-recovery/review/BACKGROUND-INDEX.md>), [stored specs](</Users/za/Documents/king down chess/docs/claude-recovery/review/SPEC-INDEX.md>), [full extracted agent messages](</Users/za/Documents/king down chess/docs/claude-recovery/review/agent-messages.md>), [background outputs](</Users/za/Documents/king down chess/docs/claude-recovery/review/background-tasks.json>), [957-file record inventory](</Users/za/Documents/king down chess/docs/claude-recovery/review/record-inventory.json>), and [original recovery index](</Users/za/Documents/king down chess/docs/claude-recovery/README.md>).

Inventories are dated snapshots, not live monitors or complete backups. In particular, the 199-file code snapshot contains hashes, not file contents. Original transcripts and much scratch material remain at their indexed source paths. An agent’s structured Write/Edit list omits edits made through shell commands; the raw transcript remains authoritative for those.

## Decisions already settled

The latest explicit owner decisions take precedence over earlier recommendations and stale checkboxes.

| Topic | Current decision |
|---|---|
| Game | Chess960-style mirrored random armies, K plus seven pieces drawn from `QLRRBBNNAAGMMSS`; opposite-colour bishops when two occur. No castling, en passant, action points or tokens. |
| Appearance | B2 Dungeon voxel: real 3D, painted voxel pieces, warm lighting, bright paper/ink pixel interface. Earlier style selection requests are closed. |
| Guard | Immortal one-step Wall, no captures; only a king can capture it. **At most one**, not exactly one, per army. No promotion to a guard. |
| Rejected guard changes | Pawn capture/lifetime bookkeeping, two-square Warden and its second-rank restriction; home-rank double-step follow-ups also rejected after Q1. |
| Archer and beast | Retain the adopted movement in any direction. |
| Paladin | Survives capturing pawns; removes itself after other captures; retains friend-jumping and cannot capture/check the king. Approved and published in v0.7. |
| Double opening turn | Rejected. The implementation problems below qualify its numerical evidence; they do not reopen the owner’s decision. |
| Maester | Existing default remains. `swapAny` was measured but not adopted. It is a later design choice, not a blocker. |
| New pieces | Build and compare Ogre repel/push and Catapult stay/land. They remain lab-only; neither is in the random pool or promotion list. |
| King powers | Planning and initial lab development were underway. The 24 recommended choices in the kings plan are proposals, not 24 recorded owner approvals. Powers remain off by default. |
| Priorities | Avoid draws/stuck games; improve AI and validate measurements before adopting more rules. Cards, capital mechanics, reserves and online play remain later scope. |

The original broad “continue developing” instruction does not authorize execution in this review: the latest request expressly stops at a takeover plan.

## What the long session completed

| Workstream | Completed work and evidence |
|---|---|
| Source and design reconstruction | Reviewed the original rulebooks, concept/production assets, piece identities and visual references. Curated `art-src` contains 137 files, roughly 788 MB; its manifest explains the selections. The 51 GB raw Drive download was deliberately discarded after curation. |
| Playable game | Custom TypeScript rules for rifle shots, paladin removal, guard immunity, maester swaps and beast chains; random setup, legal move display, AI play, undo, resignation, autosave/restore, captured pieces and rule guide. |
| Art/UI | Multiple candidate boards and sprite/voxel approaches were compared; B2 was selected and integrated. Camera orbit, touch/mobile layout, piece readability and painted voxel assets landed. |
| Browser lifecycle fixes | Full-game QA found and fixed five issues involving cancellation, stale async work, AI fallback, promotion and orientation/layout. See [full-game QA](</Users/za/Documents/king down chess/docs/research/qa-full-games-2026-09-13.md>). These are completed fixes, not abandoned bug tickets. |
| Balance lab | Seeded, paired self-play, odds matches, confidence intervals, activity/degeneracy metrics, configuration sweeps, reports and dashboard. Research supported the existing custom engine rather than a framework replacement. |
| Earlier campaigns | R1 strength ladder; R2/R3 composition and placement; R4 rules; R5 tuning; R6 buffs; R7 historical definitions; guard studies, paladin/maester exploration and batch 3. Batch 3 produced 32 runs/76,100 games. These are historical regimes, often with different guards/pools. |
| Stronger evaluation | Linear/Texel tuning and the later refit shipped. The first full NNUE experiment lost to linear and stayed disabled. Material-plus-bounded-residual NNUE preparation is implemented and tested; a successful residual model has not yet been established. |
| Latest completed decisions | Q1–Q5 finished 41,600 games. The mixed `pb-ab-base` control was identified and replaced by `pb-ab-base24`. Q7 was extended to 800 games per arm at depth 4, then the paladin rule shipped. |
| Release | v0.7 artifact publication is recorded in the parent transcript, after the build agent’s “not published” handoff. Local `dist` preserves the matching release assets. Historical browser QA: 6/6, including default versus 2017 paladin behavior, undo, and two complete AI games. Remote publication was not rechecked during this review. |

The preserved release assets are `index-eaHeYinC.js`, `worker-CMvLmNQ1.js` and `index-DQoaMBkc.css`, with a 143-file manifest. Current source is newer than this build. A fresh build was deliberately not run because it would overwrite that baseline.

## What was happening when access stopped

Continuation agent IDs map to full transcripts in the background index. Times below are September 14 PDT.

| Assignment / agent | Actual state |
|---|---|
| Q6 residual preparation — `ae82379e5291e5d1e` | Completed around 04:15. Residual evaluator, trainer mode, net-kind validation and tests landed; no winning model or adoption decision. |
| Queue report — `a4731bf2c88633007` | Completed around 05:00. Q1–Q5 results and void-control correction recorded. Some later owner decisions supersede its wording. |
| Resume protection — `ab0b75c893ca36da4` | Completed around 05:05 with a test. Checks arrangement/rule mismatches on resume, but does not fully establish provenance; see Standards findings. |
| v0.7 build/QA — `a4f318320c371c20d` | Completed around 05:57. Parent subsequently published it. “Built, NOT published” is a stale subtask heading. |
| Mover-parity metrics — `a6fa42cb17ba7fc39` | Completed around 05:37. `moverAt` and report callers were corrected and reports regenerated. This fixed analysis attribution, not the separate search alternation defect. |
| Ogre/Catapult — `aa8efb8489e2980c5` | Interrupted at 07:03. Both pieces and 19 tests landed. The report has a `PLACEHOLDER-SHORT` and stops before completing comparisons/verdicts. Shell simulations survived. |
| Setup liveliness — `a2253389ab1543426` | Interrupted at 06:56. Saved per-arrangement JSON plus modeling scripts and `FINAL.txt`; no finished Markdown report or browser filter. |
| Kings plan — `a68b4dce401b3c979` | Completed at 06:42: 708-line, three-tier plan, 12 powers and 24 proposed design choices. |
| Licensing review — `a96359388934a8aaf` | Completed at 06:41. Historical report flags three board JPEGs derived from stock textures and recommends a procedural alternative. No asset replacement or new legal verification in this review. |
| Procedural tiles — `a3e6bec95e4577837` | Interrupted at 06:56. Seeded canvas texture generator, selectable B4 style, capture tool, before/after images and brightness measurements exist. Final README, QA and default-style decision are unfinished. |
| Tier-1 king powers — `a6d1ee0c75c14e171` | Interrupted at 06:59. Six powers and CLI/URL rule parsing exist. Its last work was moving from the 149 powers-off tests to writing powers-on tests. Those tests and power simulations do not exist. |

Older research children that hit limits were sometimes superseded by completed parent reports—for example, the AI-players researcher redid three failed child topics. They should not become new tickets merely because their last transcript line is an error.

### Background jobs that outlived the conversation

**New pieces:** replacement `chain2.sh` completed successfully at approximately **07:34**, with `CHAIN2 EXIT 0` in task `bnykxd0da.output`. Its 13,600-game campaign comprises four 300-game odds arms, three 2,000-game comparison runs and two A/Bs with 1,600 games per arm. The original chain was intentionally stopped after a faulty live engine edit affected the first `np-N` run. The control was discarded and replayed; the replacement completion must not be confused with the earlier exit 143.

**Q6:** `queue3.sh` is still active in game generation. The latest numeric checkpoint is in [verification](</Users/za/Documents/king down chess/docs/claude-recovery/review/VERIFICATION.md>). Its target is 80,000 total games, including 686 pre-existing records. Its later steps automatically sample, train, generate arms, run depth-3/depth-4 matches and benchmark. Training itself writes `src/ai/nnue/weights.ts`, although linear remains the default. Thus the inherited process can change the working tree even while this review makes no code changes.

The Claude cron was created, later deleted because the intended monitoring was not firing, and replaced by one-shot shell polling. The last observed poll completed around 06:59. There is no established ongoing Claude/Codex monitoring service to inherit. No new monitor was created here.

## Standards review

The review has no Git diff baseline: Git has **no commits**, and the working files are untracked. These findings concern the current tree and recorded execution discipline.

1. **Recovery/versioning gap.** `.gitignore:4` contains unanchored `sim/`. `git check-ignore -v` confirms it excludes **`src/sim/run.ts` as well as specs and outputs**. A future ordinary commit would omit the simulation source. The code hash inventory detects changes but cannot restore their contents.
2. **Q6 provenance is insufficient.** An inspection found 50,684 complete records with zero rule/pool stamps; the file continues growing, while its saved summary still reports 686. Current [run.ts](</Users/za/Documents/king down chess/src/sim/run.ts:99>) writes stamps; the absence is consistent with the surviving writer having loaded earlier code. [Resume validation](</Users/za/Documents/king down chess/src/sim/run.ts:37>) checks the first stored stamp only and permits unstamped data with a warning. It does not establish an immutable full experiment/engine/evaluation identity.
3. **Sampling can change historical positions.** [gen.ts](</Users/za/Documents/king down chess/src/sim/gen.ts:78>) resets to current defaults, validates no source rule stamp and records only run IDs in the positions manifest. The Q6 launch omits paladin semantics; contemporaneous analysis identifies its large cohort as `paladinKamikaze=always`, whereas current defaults are `nonPawn`. A direct reproduction shows identical `Ld4xd5` notation producing different resulting boards under those rules. Matching notation is insufficient validation.
4. **The live chain does not stop on failure.** [queue3.sh](</Users/za/Documents/king down chess/docs/claude-recovery/scratchpad-recovered/1b13f053-b37e-481e-a963-54b0069234f9/queue3.sh:6>) logs failed stages and continues, skips the documented 400-game rejection gate, and creates its done marker unconditionally. A marker would not prove success.
5. **Research selection can ignore rejection gates.** [Arrangement sweeps](</Users/za/Documents/king down chess/src/sim/experiments.ts:215>) display failed gates but select survivors by balance/interest anyway. They cannot be treated as approved setup filters. Double-turn search defects also qualify that experiment’s evidence, as detailed separately below; no automatic rerun is warranted.

## Spec review

1. **P1 — Browser AI does not receive active rules.** [main.ts](</Users/za/Documents/king down chess/src/main.ts:17>) enables URL variants, but [Engine.think](</Users/za/Documents/king down chess/src/game.ts:101>) sends only position/options and [worker.ts](</Users/za/Documents/king down chess/src/ai/worker.ts:1>) uses its own default rules. This affects king powers and `?rules=2017|2021`. Variant searches and the board can disagree.
2. **P1 — Double-turn search assumes alternation.** [makeMove](</Users/za/Documents/king down chess/src/rules/engine.ts:470>) retains Black for the extra opening move. Search assumes alternating movers, negates each child score, toggles the turn hash each move and uses alternating repetition paths ([search.ts](</Users/za/Documents/king down chess/src/ai/search.ts:237>)). Fixing the old `moverAt` reporting bug did not fix this. Q4’s measurements are untrustworthy as evidence for that toggle. Keep the owner’s rejection; do not spend on reruns unless the mechanism is deliberately revisited.
3. **P2 — FEN loses physical-ply numbering under the lab double turn.** [setup.ts](</Users/za/Documents/king down chess/src/rules/setup.ts:48>) round-trips Black/ply 2 as Black/ply 3. **Black still receives its next move**; the defect is non-exact move numbering/provenance, not losing the second move. This was reproduced directly.
4. **P1 — Six king powers remain unverified.** Engine and attack branches exist, but none of the 149 tests exercise king powers. The [plan](</Users/za/Documents/king down chess/docs/KINGS-POWERS-PLAN.md:533>) specifically requires move-generation, attack-agreement and no-king-capture checks. Passing the powers-off suite does not make this lab feature ready.
5. **P2 — Power persistence and presentation are partial.** [Autosave](</Users/za/Documents/king down chess/src/main.ts:299>) omits active rules, so opening a variant save without its URL can replay differently. The guide lacks power descriptions. A URL info line is present; the measured-power picker/army colours have not been completed.

These findings do not imply that the released default game is unusable. The principal gameplay defects concern optional variants; the active data pipeline is the immediate handoff risk.

## What the unfinished measurements actually support

**Ogre/Catapult:** The completed files suggest pushing is the more promising Ogre reading: odds value about 3.02 versus 1.95 pawns; paired decisive share +5.3 ± 2.9 percentage points and draws −5.9 ± 3.0 points. However, guard shoves are rare (about 0.02 versus 0.04 per game), so “solves guard blockades” is not demonstrated. Catapult land versus stay is unresolved: score +1.6 ± 2.8 points and decisive share −0.9 ± 2.8. Both pieces were seeded with guessed values, and only depth 3 was run. These are provisional local results, not adoption decisions. Validate the replacement control and common engine/rule provenance before completing the report or spending on a targeted second-depth check.

**Setup liveliness:** The saved JSON describes **45,577 games / 4,120 arrangements**; the final text uses a different **45,209-game** snapshot. It excludes the first 686 Q6 records, distinguishes old/new paladin and depth, and finds composition more influential than most placement features. A proposed small integer score claims roughly +1.5/+2.9 points in decisiveness when rejecting 25%/50% of deals. But that integer score was chosen using the full data before the purported held-out comparison. Those results are hypotheses, not an honest independent validation of that score. Filtering also changes how often signature pieces appear. A consistent frozen dataset, split by arrangement before fitting, and explicit piece-diversity checks are needed before changing New Game. Doing nothing remains a valid result.

**Procedural tiles:** Both images and the brightness measurements exist. I inspected the cropped before/after images: the procedural version has coarser grain and more pronounced tile borders; approximate light/dark contrast is retained. Recorded linear brightness is light 0.653→0.649, dark 0.03263→0.03264 and frame 0.21191→0.21162. That supports visual comparability, not finished browser QA or permission to switch the default. The historical licensing concern should be resolved before another public package; merely leaving unused images in `public` can still ship them.

**King powers:** Holy Light, Mercy, Death Touch, Darkness, March and Leap are partially integrated, stateless lab rules. Freeze, Ice Wall, Strike, Haste and Flight need state plumbing; Sacrifice needs a reserve. Do not expand into those tiers before the first six have tested semantics and useful measurements. The plan’s suggestion to reuse `pb-ab-base24` also needs correction: that control used the old paladin. New comparisons need a control matching the chosen current baseline.

## Reconciled gaps and verification

The [task ledger](</Users/za/Documents/king down chess/docs/claude-recovery/review/TASK-LEDGER.md>) resolves stale queues and defines what remains. Missing completed deliverables are the liveliness Markdown report, procedural-tiles README/final QA, the new-piece report’s remaining sections, king-power tests/results and a Q6 acceptance report. Their absence matches the interruptions; they are not assumed hidden in the cloud.

The `rules FINAL` Google Doc pointer remains inaccessible (the earlier authenticated metadata check returned 404, which does not prove deletion). Its scratch `rules-final.txt` is an error page. The recovered 2017 Classic PDF, alternate rule drafts, design document and matrices cover the implemented scope; retrieval is not needed to resume. The incomplete website download is seven missing card-image files, not missing website code; it is only potentially relevant to a later card expansion. `sim-batch2-2026-09-13.md` is a dangling reference in RUNS; separate strength/configuration/rules/buffed/tuning reports cover that work. No usable shadow Git history was found.

Fresh verification: TypeScript passes, **149 tests in 6 files pass**, and two bounded reproductions confirm rule-dependent replay and non-exact lab FEN numbering. The 199-file source/tool/build hash snapshot was checked unchanged after verification. This pass did not rerun every historical simulation, rebuild the release, recertify old external research/legal claims or perform fresh full-browser QA of the unfinished features. Those are specific acceptance steps in the unstarted plan, not reasons to restart the project.
