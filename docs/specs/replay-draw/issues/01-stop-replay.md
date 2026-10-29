# Stop saved replay at the end of the game

Type: task
Status: resolved

## Scope

Fix audit finding 3 on `staging/fix-replay-draw`, from release 3 at `f8fcec0a`.
The owner asks for this fix, tests, a commit, a push, and a PR into main.

## Plan

1. Add tests for extra moves after repetition and move-count draws. Show the failures before the fix.
2. Stop `Game.playLan()` before a move if the game has ended. Keep the valid part and its result.
   Add the engine archive pair that the compiled match worker requires.
3. Run the affected tests, the full suite, doc checks, and the local New game browser check with the shared locks.
4. Record the evidence. Commit with the normal hooks, push, and open a PR into main.

## Acceptance

- Replay ends at the draw. Its count, position, history, and status describe the valid part.
- A later replay call adds no move to the ended game.
- Save recovery reports a partial save and keeps the full stored source.
- The compiled match worker has its new archive pair. Existing engine archives stay in place.
- Repetition and move-count cases fail before the fix and pass after it.
- Required checks pass. The PR gives the before and after evidence.

## PR review repair

The review finds one fault: `finishLinkedTurn()` adds a pass after a draw.
Save recovery and game-link loading both call this helper after replay stops.
An accepted recovery then holds an extra pass and reads as partial again.

1. Add tests through both callers. Check the loaded position, full source,
   accepted history, and reload. Show the failures before the fix.
2. Make the shared helper stop when the game has ended. Keep the old-link pass
   for a game that is still in play.
3. Run the affected tests and doc checks with the shared test lock. Record the
   results, commit with the normal hooks, and push to the same branch.

The repair passes when both callers keep the draw position and its one-move
history, and the accepted save reads in full after reload.

### Review evidence

- The independent review of PR #177 finds one P2 fault at `7e6eb345`.
  With FEN `7k/p7/8/8/8/8/8/R5K1 w - - 99 1`, Flame/Haste, and
  `Ra1-a4!H`, `Ra4-a5`, both callers add `--` after the draw.
- Before the fix, all 4 new cases fail. Both load paths add the pass. Recovery
  acceptance writes that pass, so `readSave()` reports a partial save again.
  Command: `KINGDOWN_TEST_FILE='src/{screen/play,ui/previously}.test.ts' KINGDOWN_TEST_NAME='keeps the draw position and source|accepts Haste draw recovery|keeps a Haste draw without a pass' npm test`.
  Log: `/private/tmp/kingdown-fix2-177/before.log`.
- `finishLinkedTurn()` now returns if the game has ended. The tests call save
  recovery and the game-link loader. They check the full position, the one-move
  history, `draw50`, White to move, and a halfmove count of 100. They also check
  source retention, recovery acceptance, reload, and both full and partial links.
- After the fix, all 342 selected tests pass in 6 files. Both type checks and
  all 67 art checks pass. The existing old Haste link test still adds its pass
  while the game is in play.
  Command: `KINGDOWN_TEST_FILE='src/{game,previously,turn,turn-controls,screen/{save,play},ui/previously}.test.ts' npm test`.
  Log: `/private/tmp/kingdown-fix2-177/affected.log`.
- `bash tools/test-lock.sh npm run test:docs`: all 183 tests pass in 16 files.
  Log: `/private/tmp/kingdown-fix2-177/docs.log`. All checks use the shared test
  lock and run in the foreground. The first run waits for the shared lock.
- The repair changes no hook, gate input, dependency, or engine archive.
  The full suite, browser checks, and database tests do not run in this repair.

## Evidence

- Before the fix: `KINGDOWN_TEST_FILE='src/{game,screen/save}.test.ts' KINGDOWN_TEST_NAME='stops replay at|keeps the valid part and full source after' npm test` fails all 4 new cases. Both type checks pass. The other 57 cases do not run.
- Repetition replay accepts 9 moves instead of 8. Move-count replay accepts 2 instead of 1. Both save cases return `playing` instead of the draw status.
- The cause is in `Game.playLan()`: move legality does not mean the game can continue. The loop now checks status before each move. Both callers use the returned count to detect an incomplete replay.
- Before log: `/private/tmp/kingdown-fix-replay-draw/before.log`.
- The first affected run has 300 passes and 1 failure. All 4 new cases pass. An old Paladin self-removal fixture starts in a material draw. Add a black pawn so the fixture starts in play, and check the start status for all fairy replay fixtures. This keeps the original capture and undo checks.
- After the fixture repair: `KINGDOWN_TEST_FILE='src/{game,previously,screen/{save,play}}.test.ts' npm test` passes all 301 tests in 4 files, both type checks, and the art checks. Log: `/private/tmp/kingdown-fix-replay-draw/affected-final.log`.
- The first full run has 5,684 passes, 22 failures, and 8 skips in 287 files. The local `node_modules` folder holds only test caches. Child tests cannot find package tools through that folder. Move the caches outside the worktree and run `tools/wt.sh add` on this worktree. It links the packages with the same lock file. No dependency changes.
- The full run also finds the required new engine archive pair. The worker includes `Game.playLan()`, so its compiled fingerprint changes. `npm run plugin:archive:runtime` writes the pair for `631420c297bb1015d0a736ce94c94a0741ecb7a35f171680e6f680e5ce9da56d`. This command writes local files only.
- First full log: `/private/tmp/kingdown-fix-replay-draw/full.log`. Archive log: `/private/tmp/kingdown-fix-replay-draw/archive.log`.

## Final checks

- The repaired selection passes 624 tests in 13 files. It covers both replay callers, all 7 files from the failed full run, the installation guard, and engine continuation. Both type checks and all 67 art checks pass. Selector: `KINGDOWN_TEST_FILE='{src/{game,previously,screen/{save,play},match/match,sim/sim},tools/{check,plugin-db-config,plugin-server-build,plugin-worker-boundary,wt,install-guard,engines}}.test.ts' npm test`.
- Full `npm test`: 5,707 passes and 8 skips in 287 passing files. Both type checks and all 67 art checks pass. Test duration: 447.05 seconds.
- `npm run test:docs`: 183 passes in 16 files.
- `npm run check:browser new-game`: pass in 43.8 seconds. The build passes. The check covers saved-game recovery, source retention, reload, keyboard use, and three screen sizes.
- All final checks share one `tools/test-lock.sh` lock. The browser runner also uses its worktree lock and shared browser slots. Tests use only the disposable local database on port 55432.
- Logs: `/private/tmp/kingdown-fix-replay-draw/affected-repaired.log`, `full-final.log`, `docs.log`, and `browser.log` in the same folder. Browser record: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/fix-replay-draw-OfpYIH/`.
- Remove all 21 disposable databases from this run after the checks. `git diff --check` passes. A final fetch keeps `origin/main` at `f8fcec0a`.

## Merge with main

- Review finding (P1): after a merge with current `origin/main`, the compiled worker changes again. `tools/plugin-runtime-build.mjs` then stops with "needs its archive pair".
- Merge `origin/main` into this branch. The merge has no conflicts.
- `npm run plugin:archive:runtime` writes the pair for `e58d7d379d0dad5ddde1c4e34e984923e856e4b3f702e7beeaee22db62d7a9b4`. After that, `node tools/plugin-runtime-build.mjs` passes.
- Remove the pair for `631420c297bb1015d0a736ce94c94a0741ecb7a35f171680e6f680e5ce9da56d`. Only this branch had it. It was never on `origin/main` and no build makes it now. All archived pairs from `origin/main` stay in place.
- `npm run test:docs`: 183 passes in 16 files.
- Full `npm test`: 5,300 passes, 47 failures and 502 skips in 290 files. All 47 failures are in 23 browser-driven `tools/` test files. Playwright cannot start Chromium because `~/Library/Caches/ms-playwright/` is not on this Mac. The other failures in these files are browser crashes and one browser timeout. No game, engine, save or replay test fails. `tools/engines.test.ts` reloads each archived fixture and passes. The pre-merge full run passed all browser tests, so the browser cache is the cause, not this merge.
- Logs: `merge-full.log` and `merge-docs.log` in `/private/tmp/kingdown-fix-replay-draw/`.

## Review and limits

The shared loop checks status once before each move. Both callers keep their existing recovery path. No new save format or game rule is required. The archive pair is required by the worker build; existing archives stay in place. Independent PR review remains a merge requirement.

No deploy, sign-in, remote database, or animation-bank change.
