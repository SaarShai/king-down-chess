# Offer the legal part of a saved game

Type: task
Status: resolved

## Owner decision

The owner selects option 3 for local saves on 2026-10-26. Offer the legal part after a rules change. Keep the full source until the player accepts the recovered game or starts a New game.

## Plan and checks

1. Add replay, recovery, save-gate, and cloud-order tests. Show each fault before its fix.
2. Keep the legal part on the board. Offer Use recovered game and New game. Keep the full source until acceptance. Check the source again on acceptance.
3. Fix all four findings from the independent review of PR #158. Move its probes into the page and sync tests. Check each choice by keyboard.
4. Run the focused tests, doc checks, three browser checks, and the full suite once. Fetch and merge the base before the last commit. Check the changed base paths again. Do not push.

## Change and review findings

The save reader returns the legal part and keeps the full source. The page notice and live region give the action count. Acceptance clears the old result and staged count. A partial Haste turn uses the existing legal pass. Failed writes keep the full source. Tests also cover zero legal actions, powers, another tab, cloud order, and a reload.

- P1: The account callback can be absent, and a sync-record write can fail. The recovery source time now saves with the accepted game in one `kingdown.save` write. A normal stamp reads that time. The optional account callback cannot lose it. Settings keep the marker; a new game change clears it. The cloud does not receive this local field.
- P2: An equal upload reply is confirmation. Sync keeps the local time and clears the local marker. It does not reload the game or cancel a move in motion. A different newer cloud copy still wins, including a tie after a reload.
- P2: A newer partial cloud save on a plain `?fen=` page now opens the legal part and both recovery choices.
- P3: Native dialog close restores the opener. The late close handler moves focus only when BODY has focus. Acceptance and a new game focus the board. Cancel restores the recovery New game button. A failed read focuses Menu or the visible recovery button.

The recovery source time must share the accepted game's write. It must not depend on an account callback or a second write. The save and sync tests enforce this rule. No game rule, server, migration, dependency, or save-version change is made.

## Red evidence

- The initial build has 12 failed tests before recovery is added. Its focused green run has 154 passes.
- Review repair: `KINGDOWN_TEST_FILE='src/{screen/play,account/sync}.test.ts' KINGDOWN_TEST_NAME='review recovery faults|recovery read failure|recovery confirmation' npm test` gives 8 failures, 3 passes, and 133 skips. Both type checks pass.
- P1 fails both page probes and the stale sync-record probe. P2 fails the move-in-motion probe, the equal-reply sync probe, and the FEN probe. P3 fails both read-failure focus probes.
- The browser red run fails after acceptance: focus is on Menu instead of the board. Its record is in `save-recovery-uRNnb2` under the browser output root.

## Green evidence

- `KINGDOWN_TEST_FILE='src/{screen/play,screen/save,account/sync}.test.ts' npm test`: 165 passes in 3 files. Both type checks and all 67 art checks pass.
- `npm run test:docs`: 180 passes in 15 files.
- The first three-browser run passes New game and visual design. Web game fails with database constraint `23514`: the shared local database has the later friend-invitation state constraint. A separate database made with `tools/plugin-db/make-test-db.mjs` and the branch bootstrap fixes the test setup. Web game then passes in 71.1 seconds. No source fix is needed.
- The full `npm test` runs once with that separate local database, before the base merge. It passes 5,468 tests in 284 files, with 8 skips. Both type checks and all 67 art checks pass. The test phase takes 436.87 seconds.
- The fetched base adds the spent-card motion fix at `b07d7f74`. The merge has no conflicts. After the merge, `KINGDOWN_TEST_FILE='{src/{screen/play,screen/save,account/sync,ui/motion},tools/plugin-motion}.test.ts' npm test` passes 210 tests in 5 files, both type checks, and all 67 art checks.
- After the merge, `npm run check:browser new-game visual-design web-game` passes all 3 checks: 31.8, 25.1, and 70.5 seconds. The build passes. Web game uses the separate local database.
- The New game check covers recovery at 1280 × 900, 390 × 844, and 844 × 390. It checks source retention, keyboard order, the live notice, reload, Escape, Cancel, Start, failed reads, and a late close event.
- `git diff --check` passes. The temporary databases from this run are removed.

Logs use the `recovery2-` prefix in the task output folder. Final browser evidence is in `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/save-recovery-4CJx6p/`.

## Commits

- `a2c75dd8`: initial recovery build.
- `147a70a9`: base merge before the independent review.
- `87e5ebaf`: merge `origin/staging/first-game` at `b07d7f74` for this repair.
- `cda1ca14`: fix the four findings and add the review tests.

## Limits

No live account or screen reader test runs. Browser checks test live-region attributes and keyboard access. The full suite precedes the final base merge; the affected tests and all three browser checks pass after it. No push or deploy runs. Commit hooks run without changes.
