# Card loss analysis and native search repair

Status: claimed

Owner approval (2026-10-12): "go ahead. analyze the card-game losses, build the held-out test set, and fix the confirmed search or evaluation issues. verify the improvements against both AIs. only check runs at expected completion times, and don't merge yet."

## Plan and checks

1. Pin the two completed match cohorts and split whole army blocks before loss inspection. Use even blocks for development and odd blocks for held-out evaluation. Keep both colours and all positions from each army together. Earlier published aggregate outcomes are known; the held-out label means no repair selection from its positions, not a previously unseen cohort.
2. Replay the development card games. Record legal card choices, spent cards, material changes, search depth and terminal outcomes. Save held-out positions with exact rules and full atomic history; never label the winner's moves as best moves.
3. Trace confirmed defects to native search or evaluation. Add small deterministic regression controls. Keep rule generation and the shipped AI unchanged. Test native rebuild and full conformance.
4. Freeze a bounded comparison against the unchanged native build and current residual AI. Use fresh armies and paired colours, same hands and nominal time. Pilot each runner, then schedule checks from measured durations. Report actual latency, caps and army-block uncertainty. No automatic sample extension or merge.
5. Preserve raw data, source, patch, binary, seeds, analysis and receipts. Back up final reports and check cloud hashes.

Acceptance: source/input hashes agree; held-out blocks stay outside repair decisions; all replay and negative controls pass; changes have a demonstrated regression; comparison passes exact legal traces against both opponents. Improvement claims need intervals and no material legality or latency regression.

## Confirmed defect and candidate

The ordinary move-count shortcut discards all quiet card turns. The old move picker fails the Spawn2 regression. The repair retains quiet card turns under that shortcut and exempts card turns from shallow per-move pruning. It preserves ordinary quiet pruning. Native controls pass for Spawn2, Control and Freeze, including complete held turns and an ordinary-quiet negative control. An initial sparse Control fixture has no legal Control effect; its empty-positive control rejects the test. Replace it with the existing directed corpus fixture; preserve the failed control output.

Development replays contain 33 native losses, 13 wins and two draws. In losses native leaves fewer unused cards than current AI. This is descriptive, not proof that early spending causes loss. No arbitrary card prices or evaluation weights are added. All 96 old card games replay exactly. Whole-block split hashes and 113 development / 122 held-out chronological positions are saved before repair. Held-out positions have legal choices and history, not best-move labels.

The candidate passes the full 2,391-position conformance corpus and existing native controls. The final full project tests must pass after the comparison support and new fixture tests are complete. Fresh comparison: 96 card games, 24 new armies, seed184211, one second, paired colours against each of unchanged native and current residual AI. The pilot has four games covering both opponents/colours. Only the pilot evaluates the 122 held-out diagnostics. No tuning from those diagnostics in this candidate. Later waves wait for pilot timing and validation.

## Launch checkpoint

Candidate `511941bd` is pushed after 1,942 project tests and 50 artwork checks pass. The full conformance corpus and native controls pass. The frozen analysis archive verifies all 451 files after removal of generated AppleDouble sidecars; positive replay and two corrupt-output controls pass. The kernel process-group deadline self-check passes. A fresh account audit finds zero active notebooks. Pilot accepted at 05:27:43 Pacific on 2026-10-12, ref `saarshai/kd-card-repair-20261012-pilot`. Initial finish estimate is 06:02:43; monitor checks 06:10. Later five waves stay unlaunched until pilot validation and timing pass. Strength improvement remains pending. The M1 job and its 05:40 monitor stay unchanged. No merge.

## First dispatch failure

The first pilot stops before compilation or games on a Makefile input hash mismatch. The patch export uses an ad hoc Git baseline; upstream gitignore excludes tracked Makefiles from ordinary add. Restore the exact original tracked index entries, then export the patch. A clean application now reproduces all 75 existing candidate compiler-input hashes; expected hashes are unchanged. Preserve the first kernel and output. A new campaign `fairy-card-repair-r2-20261012` uses the same unplayed schedule and sealed held-out set. No game or held-out search was attempted. Pre-dispatch clean patch reconstruction is now required in the native build instructions.
