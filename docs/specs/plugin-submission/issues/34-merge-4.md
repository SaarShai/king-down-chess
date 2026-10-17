# 34 Merge 4

Status: built
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

### Review fixes

1. Check the four findings at 9f4329c7. Use the shared Start lock and keep the Create receipt. Show its Retry on Wait.
2. Keep the computer start continuation for Create Retry. Carry its job through automatic Choose and the full read.
3. Give each background wait read a queue job. Check its job and watched game before each page change and Resume.
4. Stop delayed name checks on close and teardown. Block both late success and late error replies.
5. Add tests for all four faults. Run npm test with the local test database. Commit, then run the approved browser checks at that head. Keep all limits.

Pass criteria: one Create ID across Retry; automatic Ready reaches Board; an old wait read cannot replace a new game; name checks send and write nothing after close or teardown. Record the head and check results in merge-4-fix.md.

- All four findings are confirmed in the code. Wait now uses the shared Start lock and shows the saved Create Retry. Create and Choose use their computer start continuations with the same origin. The background wait read uses a queue job and checks its watched game. Close and teardown clear the name timer and invalidate its replies.
- The app tests now use the real Wait screen. New cases cover Retry on Wait and Play, old wait success and error replies, Resume with the same origin, and name checks before and after close or teardown. The lobby test now loses Create as well as Choose.
- The type check and diff check pass. After the shared lock opens, the app file passes all 51 cases, including 14 new cases. The same npm test command passes all 51 drawing tests. Log: tests-fix-app-1.txt.
- Freeze the check head with this ticket update. Run the full suite with the local database and two file workers. Run the approved browser checks at HEAD. Record all final results in the required merge-4-fix.md report. Do not change any limit. Add no tracked edit after these checks unless a failure needs a fix.
- The first full suite at 57f2783d has 3,125 passes, eight default skips and one failure. The existing joined-game remount case waits for Opponent found. The new job guard exposes an early watch clear: the list drops its recovered match before its first Get reply returns. Keep that match until a valid current read ends. Add a held-read app case. Keep the existing browser case and its 5 s limit.
- Chromium on the M1 and WebKit on this Mac pass at 57f2783d. The first HTTP check loses the saved test command before Retry; an unchanged repeat passes. The first detached browser launch has no process or output. The foreground approved runner gives the check results.
- Commit the watch lifetime fix and repeat the app file, lobby file and full suite through one outer test lock. Each test command still uses npm test. Use the local database and two file workers. Repeat all three browser checks at the new head. Save the final result in merge-4-fix.md after all commands end.

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

- Final teardown trace: the board's background Profile reply still changes the player strips after close or teardown. The UI reviewer confirms that no other guard stops it. Return before the rating or strip write when tornDown or queue.closed is true. Add two held-reply board cases. They check the same strip nodes and text after teardown and after queue close.

- The merged recent-moves rule uses a raw 14 px font size. The existing type-scale test rejects every raw pixel font size in this file. Use the existing --fs-sm token, which is 14 px. This keeps the approved size and passes the same guard. No new taste choice or extra font scale is needed.

### First full suite

- The full suite at ad1bc6d6 runs after the shared lock opens. It ends with 185 passed files, 4 failed files, 3,104 passed tests, 5 failed tests and 8 skips. Duration: 374.35 s. Log: tests-full-1.txt.
- The Handle test fails before its target step: the unit input stub lacks setCustomValidity. Add that browser method to the stub. The review probe uses the same correction before its baseline run starts.
- Two seed tests hit their unchanged 5 s limit. The database answers a separate short read. One board case times out at Home before it reaches the mating move. One mount-wait case sees a symbols decode error. Keep these failures in the log; check them in single files before the next full run. Do not change a limit.
- M1 plugin-ui passes at ad1bc6d6 in 153.7 s. Log: checks-m1-6.txt. The reviewer finds no fault in the profile guard, its two held-reply cases or the shared font token.

### Mount-read error check

- The app browser file fails again on its own: 130 cases pass; the held mount Get case sees the symbols load error. Duration: 254.25 s. Log: tests-focus-app-browser.txt. The board file passes all 127 cases in 104.75 s. The seed file passes both cases in 2.58 s with the same 5 s limit.
- Use the diagnosing-bugs workflow for the repeated app failure. There is no GLOSSARY.md or matching ADR in this tree.
- Make a small two-case test file for a held mount Get, with symbols off and on. Keep the real source page, saved game, remount, held read, 20 s clock step and game/revision checks. Check for the error before the clock step too. Run it with KINGDOWN_TEST_FILE=tools/plugin-mount-wait.test.ts npm test.
- First get the small loop's result. Then remove any step that does not cause the failure, rank the causes and check one at a time. Keep every existing assertion and time limit.
- The archive probe completes: all 29 old app cases pass and all four new cases fail at their intended checks. The current result at 80a330b2 has no confirmed source finding from either reviewer. No reviewer command remains active.
- The small loop fails with symbols on and passes with symbols off in 3.39 s. It still fails with no game and no clock. A first mount alone passes; the held remount read keeps the error in view. Logs: tests-mount-probe-1.txt through tests-mount-probe-4.txt.
- Rank three causes before the probe: missing symbol transform, failed image URL or decode, and an old-page error during remount. The value probe confirms strings in place of two-image arrays. Log: tests-mount-shape-3.txt. Two earlier probe forms fail in the probe itself; they give no product evidence.
- The build owns the symbol loader, but the source-page harness has no such loader. Move that loader into one shared plugin. Keep emitted asset URLs for the build; serve data URLs in the source harness. Keep the two army colours in that one loader. The small regression test waits for the real settings image load, holds a remount read, and checks the error before and after release. Remove the debug probe.
- Stop only the queued HTTP and WebKit runners before they get a browser slot. The HTTP wrapper holds the test lock while it waits for the Mac; remove that wrapper from the next browser run. Neither stopped run has a browser result. Re-run both checks at the final head.
- The small regression file passes both cases with the shared loader. Its npm test call also passes the 51 drawing tests and the type check. Log: tests-mount-fixed-1.txt. The full suite must now repeat the original mount case.
- The read-only UI reviewer finds no fault at 25e966ff. The build keeps the asset names, SVG content and URL markers. The source path returns two data URLs. The held-read test checks the error before a later render can hide it. The reviewer runs no command or check for this last source review.

### Final verification

- The first fixed-head checks at 3e1e7b1a pass: type check; M1 plugin-ui in 156.6 s; Mac plugin-ui-http in 154.0 s; Mac WebKit plugin-ui in 188.6 s. M1 samples 60 and 65 frames at the two M2 sizes, with full words and no overflow. WebKit samples 59 and 65 frames with the same result.
- The full suite at that head has 3,110 passes, eight default balance drift skips and one failed case. The case reads the hidden Home button just after a context notification and gets Play now before Home updates. Log: tests-final.txt. The original symbols failure is gone.
- The UI reviewer confirms the wait gap from the installed SDK: setHostContext returns void and sends the context notification without a frame acknowledgement. Wait for the Home card to be visible before each of the three immediate label reads in plugin-join-review.test.ts. Keep each label assertion and each time limit. No product fault is confirmed.
- All four merges and M1 to M3 are built. Both reviewers have no confirmed finding left. No part is omitted. No new taste choice is needed.
- Freeze the check head with this ticket commit. Run npx tsc --noEmit, then the full npm test suite with the local database and VITEST_MAX_WORKERS=2. This reduces file concurrency; it changes no test or check limit.
- Run plugin-ui on the M1. Run plugin-ui-http and WebKit plugin-ui on this Mac through the approved runner. All final results must name this ticket commit. Add no tracked edit after these checks.
- The final head, test counts, runner exit lines and full results go in the owner's required report: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/merge-4/merge-4-build.md. The report is written only after all commands end. This section records the check plan, not a pass result.
