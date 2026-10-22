# Remove the remaining presentation dependency

Status: resolved; source boundary complete; parent staging archive checks remain separate

## Plan and verification

Base: `e92871fd7ef8aed2c2c14cc6e15cc7dfc4fc851f`. Work stays in this isolated branch.

1. Remove the five presentation imports and 16 wrappers from GameRules. Keep the existing read, move-text, marks-model, cursor-text and render/frost modules. Give each helper explicit owned inputs where needed. Preserve method receivers and exact words.
2. Change local and shared board, Guide, Collection, table, keyboard and painted view callers. Remove obsolete ambient classifications only when the imports are pure or owned. Keep gameplay, artwork and stored rule fields unchanged.
3. Keep all real worker-builder controls. Add the three wording controls from ticket 19. Run affected helper tests, owner-conflict cases, ownership checks and typecheck. Record selected cases and logs. Send the patch for independent review.

Affected source: `src/game-rules.ts`, the five helper modules above, `src/screen/{play,keys,moments}.ts`, `src/ui/{guide,table,home}.ts`, `src/plugin/screens/{board,board-model,collection}.ts`, `src/render/PaintedView.ts`, direct helper tests, `tools/game-boundary.test.ts`, and `tools/plugin-worker-boundary.test.ts`.

Pass criteria: cosmetic wording edits preserve exact worker bytes and engine identity; the mechanical control changes both. Conflicting owners preserve names, mark semantics, attack generation and designed rails. Existing helper assertions preserve refusal precedence, Beginner words, speech and overlay shapes. No archive or deployment in this branch.

## Evidence

The coherent cut removes all five presentation imports and all 16 wrappers. The existing `pseudoMoves` operation now forwards its concrete generation mode. Read and move-text use type-only owned inputs; cursor and frost use their one owned operation; rails uses the owned design. No public scope, callback, new runtime class or fallback is added.

`KINGDOWN_TEST_FILE='{src/{read,move-text,marks-model,cursor-text,game-rules,previously,presentation-ownership}.test.ts,src/render/frost.test.ts,src/rules/{classic-chess,morph-soft,morph,spawn}.test.ts,tools/{game-boundary,plugin-worker-boundary}.test.ts}' npm test` passes 14 files / 244 selected tests, plus 54 art checks. The command includes typecheck. Log: `/tmp/kingdown-u08-presentation-focused.log`. This is a focused pass, not a full-suite result.

The real-builder test preserves its existing cosmetic/evaluator controls, mechanical negative control and compiled helper load/apply/reload probe. Its three added wording controls pass. The Guard control targets the complete refusal return statement; ticket 19's original red target was the first matching guide sentence. No new baseline red is claimed for the corrected refusal target.

Four two-owner tests alternate owners while ambient rules differ. They cover custom design names in titles, reads, refusals, cursor speech and move descriptions; mark meanings, legal reach and frost; generated check and capture paths; and rails from two designs. Each asserts that ambient state stays unchanged.

Independent read-only review finds no confirmed should-fix. It traces the five helper dependency chains and all direct UI callers; confirms owned receivers, refusal precedence, exact words, enemy-side threat reset and capture mode, mark/design rails and frost; and finds no remaining calls to the 16 removed methods. The review runs no extra tests.

`npm run check:browser read-piece verb-marks cursor-adoption` passes read-piece (1.788 s) and verb-marks (2.196 s). Cursor-adoption completes its first two cases, then fails at `verify-cursor-adoption.mjs:95` while `pressMenu` waits 30 seconds for the hidden `[data-go="new"]` button. No browser errors are reported. Run: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u08-presentation-cut-SeSlLC/run.json`. Batch log/receipt: `/tmp/kingdown-u08-presentation-browser.{log,receipt}`.

The same single check on exact base `e92871fd7ef8aed2c2c14cc6e15cc7dfc4fc851f` in the existing audit worktree fails at the same hidden button and tool line after the same two cases, with no browser errors. This establishes a pre-existing check failure; no browser tool is changed here. Baseline run: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/u08-presentation-boundary-audit-00uutU/run.json`. Log/receipt: `/tmp/kingdown-u08-cursor-baseline.{log,receipt}`. Both browser batches run detached with PID files and end receipts. The checked trees stay fixed while their checks run.

The final cut reuses existing helpers and removes the obsolete wrappers and exemptions. No simpler complete boundary avoids these explicit owned inputs. Engine rules, design mechanics, artwork, canonical names and stored fields remain unchanged. No full suite, simulation, archive publication or deployment runs. Parent staging checks and the one archive publication/recovery cycle remain separate.
