# 34 Merge 4

Status: claimed
Branch: claude/release-candidate
Base: 4692477c

## Plan and checks

1. Merge 38342ac1, a761dd3e, 6777221e and bdaaa50d, in that order. Use merge commits. Record each conflict and how both inputs remain in use.
2. Keep the S5 store, command queue, job gate and single poll. Keep the release changes on those paths. Keep the held-Choose test in plugin-races with the single-read wait.
3. Add M1 source order and control tests. Check M2 page width during the win text motion at 360 x 640 and 400 x 800. Clip at the end card if needed, with the full words in view. Check M3 on Board and Play. Keep the B3 last board, with actions off and Try again.
4. Run npx tsc --noEmit and npm test with the local test database. Commit before the approved browser runner. Run plugin-ui on the M1, plugin-ui-http on this Mac, and WebKit plugin-ui on this Mac.
5. Get read-only reviews of the merged head. Review the merge choices, the S5 recheck fixes from 4e8c1be7 through 38342ac1, and M1 to M3. Use a scratch archive for probes. Fix each confirmed fault and run the checks needed for the fix.
6. Record the head, changes, conflicts, tests, reviews, omissions and taste choices. Write the full report to the required merge-4-build.md file.

Each command must end with exit 0. Each browser log must name the head and show the final runner exit line. Keep all time limits. Do not merge tickets 32 or 33. Do not edit their paths.

## Progress

- The worktree is clean at 4692477c. The branch is correct.
- B3 is option b: keep the last board, mark it Not current, turn moves and actions off, and show Try again.

### Merge 1: owner-decisions

- Source: 38342ac1. Three files conflict.
- app.ts: keep state.pending, the queue, job gate and start continuation. Keep the block notice and the return-screen clear. Read rules through the S5 transport. Gate the block reply before it changes the page. Keep rematch_allowed in equal-revision polls.
- board.ts: Undo clears the held preview and saves the draft. Keep the armed rule text, held preview, block notice and source focus rules. Keep the S5 refused-turn line and its draw-offer note. Hide All rules for an empty board. Restore the saved draft before the move list is built.
- setup.ts: keep the S5 start origin, saved king and continuation. Keep the leave guard and remove its listeners on exit. Do not render after teardown.
- client.ts merges without a conflict. It uses the S5 receipt with no wall-clock retry test.
- The new app unit fixture uses the current online visibility field and the click listener stub.

### Merge 2: webkit-rc

- Source: a761dd3e. tools/plugin-ui-check.mjs conflicts.
- Keep the data-toppling wait and the check that its words are gone. Keep the release zoom checks and the 400 px end-word restart. Remove the second animation wait.
- The board tests keep the WebKit focus checks and the corrected win-sequence wait.

### Merge 3: od-q10

- Source: 6777221e. No file conflict.
- Keep the inline recent moves, its phone fit and sheet path. M1 follows this merge and corrects its source order.

### Merge 4: main

- Source: bdaaa50d. tools/plugin-journeys.test.ts conflicts because the race tests moved.
- Keep the move to plugin-races.test.ts. Do not add a second copy of those tests.
- Apply PR 59 to the held-Choose test there: one wait reads all six fields, with a 1000 ms limit and a catch that reports the state. Read in the widget frame because the release host uses a second origin.
- PR 58 is already in the release history. No other main file changes.

### M1 to M3

- M1: move the recent-moves band after its Moves button in source order. Add aria-controls. The named grid cell keeps the layout. The built check reads both the relation and the source order beside the existing list and fit checks.
- M2: clip overflow at the board in the end table. Keep the full text inside that box. The built check samples document scrollWidth and clientWidth in each frame of the live win at 360 x 640 and 400 x 800. It checks full text bounds and confirms that text scales. The 400 px restart now runs while the words exist; the old restart ran after they were removed.
- M3: the S5 message line already shows the error once. Add built checks on Play and Board, each with one enabled Try again. The Board check keeps the last canvas at its size, marks it Not current and removes moves. A good read clears the error.
- No new taste choice. Keep B3 b and the approved words and motion.
- The first test command has bad file-filter arguments and is stopped with its own child processes. It has no valid result. Use KINGDOWN_TEST_FILE for a single file and plain npm test for the full suite.

### Review and first browser check

- Two read-only reviewers check fa67175e as a merge result. Their probe uses a git archive of that head. No reviewer edits this worktree.
- State review: confirm that a late Settings failure can show on the screen opened with Back, and a reply can write after teardown. Use the existing command queue for Settings. Gate generic errors by current job and origin screen. Keep focus listener cleanup in finally.
- State review: confirm that an old Handle save can resend the waiting start after a newer Profile mount. Gate that follow-up by the current job and carry its origin into the resend. Keep the pending receipt and error intact when the old job is no longer current.
- State review: confirm that a new empty/setup game returns before it drops the old draft. Drop the draft before that return. Extend D13 to playing, setup and waiting target games, then return to the old board and check that Undo stays off.
- Merge and UI review: confirm that a held first Settings save leaves Start timers alive after teardown. Gate both timer bodies by the start origin. Keep exit data cleanup inside the open-queue guard. Keep timer and listener cleanup outside it.
- Add app tests for Settings failure after Back, Settings replies after teardown, Start timers and exit cleanup after teardown, old Handle success after Profile, and a good empty Play read.
- M1 browser run at fa67175e fails in 33.0 s on the M1. The new Play case finds a real fault: a good Get with no view does not clear Try again. Clear that read notice through the store. The failure log is browser-m1-2.txt. The runner ends with check-runner: M1 exit 1 at fa67175e.
- The first detached runner start writes no output and leaves no process. It has no result. The next start uses the same approved runner as a foreground command with a saved log.

- The next M1 run at 3296365c passes the new Play retry. It fails the existing Settings focus case in 58.3 s: the queued save disables Back, so Back cannot take focus while the save waits. Keep Back free on Settings while connected and not mounting. Keep every other lock. Add four lock cases for save, mount, lost connection and Board. This keeps the prior release focus intent on the S5 queue path.

- The M1 run at 979e2a8a passes Settings focus and reaches the new Board read check. Its board remains 568 by 606 px. The error shifts its top from 171 to 126 px. The size check also compares position by mistake. Compare width and height only, as its words and B3 require. Keep the error count, stale mark, locked turn and absent moves checks. Cancel the queued WebKit run before it acquires a runner, so it does not test a changed head.

- The same Back error scope also applies to the first Settings save in Start. If the player leaves after 5 s, a later save failure must not show on Profile. Use the existing leave flag in the catch. Add a held-save test that leaves through the enabled exit, then releases a failure and checks Profile, no error and no Create.
- M1 plugin-ui passes at 4125fcef in 154.1 s. At 360 x 640 it samples 61 frames; at 400 x 800 it samples 65. Both reports show no sideways page overflow, 30 visible scaled-word samples and full words. Both reviewers find no remaining fault in 979e2a8a by source review. The later start-save scope check above follows the same rule.
