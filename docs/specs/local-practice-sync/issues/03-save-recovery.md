# Offer the legal part of a saved game

Type: task
Status: resolved

## Owner decision

The owner selects option 3 for local saves on 2026-10-26. Offer the legal part after a rules change. Keep the full source until the player accepts the recovered game or starts a New game.

## Plan and checks

1. Add replay, recovery, save-gate, and cloud-order tests. Show each fault before its fix.
2. Keep the legal part on the board. Offer Use recovered game and New game. Keep the full source until acceptance. Check the source again on acceptance.
3. Fix all four findings from the independent review of PR #158. Move its probes into the page and sync tests. Check each choice by keyboard.
4. Fix all three round 2 findings. Add the reload and FEN probes and the passing controls to the repo tests. Show the failures before each fix. Keep the equal-reply and focus fixes.
5. Run the requested three-file tests, doc checks, and three browser checks, one command at a time. Obey the quiet lock. Fetch and merge the base before the last commit. Commit on this branch. Do not push.

## Change and review findings

The save reader returns the legal part and keeps the full source. The page notice and live region give the action count. Acceptance clears the old result and staged count. A partial Haste turn uses the existing legal pass. Failed writes keep the full source. Tests also cover zero legal actions, powers, another tab, cloud order, and a reload.

- P1: The account callback can be absent, and a sync-record write can fail. The recovery source time now saves with the accepted game in one `kingdown.save` write. A normal stamp reads that time. The optional account callback cannot lose it. Settings and unchanged startup saves keep the marker; a new game change clears it. The cloud does not receive this local field.
- P2: An equal upload reply is confirmation. Sync keeps the local time and clears the local marker. It does not reload the game or cancel a move in motion. A different newer cloud copy still wins, including a tie after a reload.
- P2: A newer partial cloud save on a plain `?fen=` page now opens the legal part and both recovery choices.
- P3: Native dialog close restores the opener. The late close handler moves focus only when BODY has focus. Acceptance and a new game focus the board. Cancel restores the recovery New game button. A failed read focuses Menu or the visible recovery button.

The recovery source time must share the accepted game's write. It must not depend on an account callback or a second write. An unchanged startup save must keep that time until the game changes or the cloud confirms it. A recovery offer takes priority over a plain FEN position. An opened account game ends that FEN override in both the page state and URL. The save and sync tests enforce this rule. No game rule, server, migration, dependency, or save-version change is made.

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

## Round 2 repair plan

- Keep the recovery time through an unchanged startup save, with a late account load or a failed sync-record write. Check that a newer cloud game wins after reload. Check that a move clears the time.
- End the FEN override when an account game opens for recovery. Check the board and storage after a newer complete game wins, then try the old line's next move.
- Restore the recovery offer on a FEN reload. Keep the full source and both choices. Add this case to the New game browser check.
- Keep the failed-upload, account-switch, and sign-out controls. Record red and green counts and the final checks here.

## Round 2 findings and fixes

- P1, recovery time: The startup save builds a new save object and drops the local recovery time. A later stamp makes the old game newer than the account game. The save now keeps the stored recovery time when the game fields match. An explicit New game or changed game does not keep it. Cloud confirmation still clears it. The tests cover both a late account load and a failed sync-record write, then reload and the startup save. They also check repeated saves, settings, and a new move.
- P1, FEN board: Recovery loads an account game, but the old FEN flag stops a later complete account game from reaching the board. Opening an account game now clears the flag and removes `fen` from the URL. The test checks board and storage, then tries the old line's next move. The newer account game stays.
- P2, FEN reload: Startup skips the stored partial save on a plain FEN page. A later write blocks play but loses the recovery choice. Startup now reads a partial save and restores its settings and recovery offer. The restore path also finds that partial save if its caller passes no save. The New game browser check covers both choices and full source retention before and after reload.
- The passing failed-upload and sign-out probes are now sync tests. The account-switch probe is a page test. Existing equal-reply and focus tests stay in place.

### Round 2 red and green evidence

- Red: `KINGDOWN_TEST_FILE='src/{screen/play,account/sync}.test.ts' KINGDOWN_TEST_NAME='round 2' npm test`: 4 failures, 3 passes, 144 skips in 2 files. Both type checks pass. Both startup cases, the FEN board case, and the FEN reload case fail.
- Browser red, after only the recovery-time fix: New game passes the source-time reload checks at all 3 sizes, then fails because the FEN recovery button is hidden. Evidence: `save-recovery-p0vjmR/new-game.log` under the browser output root.
- Green: `KINGDOWN_TEST_FILE='src/{screen/play,account/sync}.test.ts' KINGDOWN_TEST_NAME='round 2|recovery confirmation' npm test`: 10 passes, 142 skips in 2 files. Both type checks and all 67 art checks pass.
- `git fetch origin` finds the base at `b07d7f74`. `git merge origin/staging/first-game` reports that the branch is up to date. No merge commit is needed.

### Round 2 final checks

- Required focused command: 173 passes in 3 files. Both type checks and all 67 art checks pass.
- `npm run test:docs`: 180 passes in 15 files.
- `npm run check:browser new-game visual-design web-game`: build and all 3 checks pass. Times: 35.9, 33.6, and 89.6 seconds. New game reports 27 case groups; visual design reports 14. Recovery checks include source time after reload at 3 screen sizes, both choices on FEN reload, source retention, and the existing focus cases.
- Web game uses a separate localhost database made with the repo helper. The database is removed after the check. No live sign-in or external site is used.
- `git diff --check` passes. The tests and browser checks run one command at a time. The quiet lock is absent before both browser commands. The repo test and browser locks delay the runs; no lock is bypassed.

The round 2 repair changes only the page, startup selection, tests, browser check, and this ticket. The equal-upload reply and focus code stay unchanged. No game rule, server, migration, or dependency changes. No full suite or live-account test runs for this repair. No push or deploy runs.

Round 2 logs: `recovery3-*.log` in the task output folder. Browser evidence: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/save-recovery-9ivxwk/`.
