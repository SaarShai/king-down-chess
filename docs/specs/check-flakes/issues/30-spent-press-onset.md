# 30 Keep one start time for a spent-card press

Status: resolved
Branch: staging/spent-press-flake
Base: staging/first-game, de2a724b
Scope: the shared motion clock and its tests. No longer limit or retry.

## Plan

1. Read the failed CI check and the poll fixes in PRs #132 and #140.
2. Add a controlled page delay. Reproduce the onset spread before the fix.
3. Check the start time of each animation. Fix the clock or its recorder.
4. Run the motion test file five times and the doc checks. Commit once.

## Checks

- The red check fails at the onset check under a controlled delay.
- The green check keeps one press start time across a row rebuild.
- The 15 ms limit does not increase. The final state and reduced motion checks stay.
- `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test` passes five times.
- `npm run test:docs` passes. The full suite does not run.
- The commit stays on this branch. There is no push, rebase or deploy.

## Review repair plan

1. Add the review probe: hold the timeline at 7000 ms, add 40 ms of setup, then replace the face in the same frame.
2. Remove saved-start reuse for one test run. Require a failure with starts of 7000 and 6960 ms. Restore the fix and require 7000 ms for both faces.
3. Run `plugin-ui` twice on this branch and twice on `origin/staging/first-game`, one command at a time. Check the quiet lock before each run.
4. Trace the Moves sheet scroll path. Run `tools/plugin-board-input.test.ts` twice on each tree.
5. Record the results. Fetch and merge the base before the last commit. Run the affected checks and doc checks. Commit without a push.

Pass conditions: the new test fails without reuse and passes with it; branch and base have two recorded runs of each requested check; any branch fault has a fix and a passing check.

## Evidence

- CI run 40308293426 fails with an 18.6 ms spread at line 339. Run 40307940113 passes at the same commit.
- Ticket 28 covers the coin read and poll budgets of PR #132. PR #140 changes frame-read poll budgets in four other test files. Neither changes the onset recorder.
- The spent-card check compares replacement faces of one coin. It checks that a row rebuild resumes one press. It does not compare separate parts that must start in one frame.
- Red command: `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts KINGDOWN_TEST_NAME='presses a spent card.*false' npm test`.
- Before the fix, the recorder adds 40 ms of page work to every second matched animation. The command fails at the original spread check: `expected 39.80000019073486 to be less than 15`. One case fails; 26 skip. The type check passes.
- With the fix and the same load, `KINGDOWN_TEST_FILE='{src/ui/motion.test.ts,tools/plugin-motion.test.ts}' KINGDOWN_TEST_NAME='original onset|presses a spent card' npm test` passes: 4 cases pass; 37 skip; 67 Node tests pass.

## First onset fault

The recorder estimates the onset with `performance.now() - currentTime`. The app samples the age before it calls `element.animate()`. The recorder then reads computed styles before it sets and records `currentTime`. The estimate includes each setup cost. The added page work changes that cost, so the original 15 ms check fails. Thus, the CI number does not prove that separate parts start in different frames.

There is also a weak point in the product clock. A new native animation is pending. A seek to an age holds that age until the browser starts it. Setup and the wait for a frame can move its resolved start time. A row rebuild can therefore shift the visible press. The product promise is one saved start time across replacement faces, not a new press at each rebuild.

The [browser timing rules](https://www.w3.org/TR/web-animations-1/#waiting-for-the-associated-effect) describe this pending start and the use of an explicit start time.

## First fix

- The first fix sets `animation.startTime = at` in `UiMotion.play()`. Each replacement uses the same event time. Setup work and a late frame do not move that time.
- The recorder reads the native start time when the page sets it. It does not estimate that time from a later wall-clock read. A missing start time records `NaN`, so a missing clock assignment cannot pass the spread check.
- The spent-card test keeps the uneven 40 ms setup load. The clock unit test covers setup costs of 0 ms and 40 ms, a row rebuild, cancellation, and the end of the event window.
- The 15 ms limit stays. The duration, end style, coin size, single press and reduced motion checks stay.

## First verification

- `KINGDOWN_TEST_FILE=src/ui/motion.test.ts npm test`: 14 cases and 67 Node tests pass.
- `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test` passes five times in order. Each run passes all 27 cases and 67 Node tests. The type check passes in each run.

| Run | Motion file time |
| --- | --- |
| 1 | 68.67 s |
| 2 | 67.69 s |
| 3 | 67.73 s |
| 4 | 67.30 s |
| 5 | 66.64 s |

- `npm run test:docs`: 15 files and 180 cases pass. The full suite does not run.

## Change check

The shared helper changes one clock assignment. Its event window, cancellation, focus and motion guards stay. The test reads the browser's start time. There is no new runtime path or dependency.

## Browser hang repair plan

1. Reproduce the failed finish with a large gap between the two clocks.
2. Add a unit case that fails before the repair. Convert the event time to the animation timeline.
3. Check the 15 ms limit with the 40 ms setup load. Run the motion file five times in order.
4. Run the doc checks, both plugin browser checks, the three site checks, and the WebKit plugin check.
5. Fetch and merge `origin/staging/first-game`. Check the result and commit on this branch.

Pass conditions: each finite animation ends; one spent press keeps its start across row rebuilds; all requested checks pass. No limit, case or dependency changes.

## Browser hang cause and repair

- PR #150, CI run 40329308653, head `1845cc83`: Chromium `plugin-ui` and `plugin-ui-http` reach the 960 s limit. Three WebKit jobs reach the 45-minute job limit. The staging tip `300b3179` passes. Both Chromium logs stop in `checkTabletButtons` after `board-cards-armed`.
- The page clock changes `performance.now()`, but it does not change `document.timeline.currentTime`. The direct `startTime = at` assignment puts an animation far in the future. The tablet check then cannot finish its wait for finite animations.
- A local Chromium probe loads the current `UiMotion` class. After `page.clock.fastForward(60_001)`, wall time is 60015 ms and timeline time is 62.798 ms. The animation starts at 60014 ms. Its current time is -59951.202 ms. After 350 ms, it still runs and its finish promise does not resolve.
- Red: the new unit cases use clock offsets of -60000 ms and 60000 ms. Both fail on the old code: the expected age is 165 ms; the measured ages are 60165 ms and -59835 ms.
- The simple conversion after setup passes the unit cases, but fails four motion cases. The spent press spread is 42.2 ms under the 40 ms load. The timeline holds its frame time while wall time advances through setup.
- `UiMotion` now converts each event time once, before animation setup. It saves the timeline start for all parts and replacement faces of that event. It drops expired entries and clears them on cancel. Different clocks and uneven setup costs cannot move that saved start.
- The unit tests cover both clock offsets, the correct age and finish, a frozen frame during setup, another event, and a row rebuild. The 15 ms check and all 27 motion cases stay.
- `KINGDOWN_TEST_FILE=src/ui/motion.test.ts npm test`: 17 cases and 67 Node tests pass. The type check passes.
- `KINGDOWN_TEST_FILE=tools/plugin-motion.test.ts npm test`: five passes in order. Each run passes 27 cases and 67 Node tests, with the type check. File times: 72.34 s, 68.39 s, 67.96 s, 72.86 s, 72.57 s.
- `npm run test:docs`: 15 files and 180 cases pass in 2.07 s.
- `git fetch origin` completes. The merge of `origin/staging/first-game` at `0d0cf202` has no conflict. The browser checks run on that merged tree.

## Browser results after the repair

The browser checks run one command at a time. The times below exclude time in the shared machine queue. No check, case or time limit changes in this repair.

| Command | Result | Check time |
| --- | --- | --- |
| `npm run check:browser plugin-ui plugin-ui-http` | Chromium fixture passes; HTTP fails on the shared test schema | 311.557 s; 30.641 s |
| `npm run check:browser plugin-ui-http` | Passes with this branch's schema in an isolated local database | 330.541 s |
| `npm run check:browser motion-concepts king-effects character-clips` | The first two pass; the old clip check fails at the Charcoal Knight pixel sample | 91.566 s; 124.235 s; 29.387 s |
| `npm run check:browser character-clips` | Passes after the staging merge brings the clip-check fix | 79.868 s |
| `PLAYABLE_BROWSER=webkit PLAYABLE_CPU_CANVAS=1 npm run check:browser plugin-ui` | First run: an open board menu blocks a setup-recovery click | 140.521 s |
| Same WebKit command | Second run: reaches the 480 s limit during setup | 480.279 s |
| Same WebKit command, with the staging motion file | Also reaches the 480 s limit during setup | 480.392 s |

- The shared local database has `game_invites_state`, a constraint absent from this branch. The failed HTTP join reports PostgreSQL code `23514`. `ownTestDatabase('spentpressfix2')` creates `kingdown_plugin_spentpressfix2_test` on the same local server from this branch's existing migrations. The HTTP repeat uses that database. No migration file changes.
- A second fetch and a clean merge bring staging tip `f306d452`, including the clip-check fix. The motion repair files stay intact. The earlier merge at `0d0cf202` is replaced by this merge before the commit.
- The full WebKit comparison changes only `src/ui/motion.ts` to the file from `f306d452`. It uses the same merged tree, cases, canvas setting and 480 s limit. It fails in setup, before the tablet animation wait. The wrapper restores the repair file after the command ends. This is a full-run limit; no full WebKit pass is claimed.
- A direct local probe loads the real `UiMotion` class in Chromium and WebKit. It installs the page clock, advances it by 60001 ms, and starts a 100 ms animation. With PR head `1845cc83`, both engines still run after a 350 ms finish bound. With the repair, both start at age zero and their native finish promises resolve. The probe does not change a check limit.
- Probe values: Chromium red age -59896.31 ms; WebKit red age -59691 ms. Both green ages are 0 ms. Chromium ends after 116.602 ms of timeline time; WebKit ends after 113 ms. Log: `spent-fix2-native-clocks.log` in the output folder.
- Change review: the saved event start is needed because the simple conversion fails under the setup load. The shared helper owns that conversion. It removes expired entries and clears them on cancel. The event window, motion guards and recorder stay. No dependency or game rule changes.

## Review repair results

- The independent review returns CHANGES. All 17 old unit cases pass when saved-start reuse is removed. The old row-rebuild case advances both clocks, so it cannot prove reuse within one frame.
- The new case in `src/ui/motion.test.ts` starts from the review probe. It holds the timeline at 7000 ms. Setup advances wall time from 100000 to 100040 ms. The first face disconnects, and its replacement starts at once with the same event time.
- Red: remove only `this.onsets.get(at) ??` from `UiMotion.play()`. `KINGDOWN_TEST_FILE=src/ui/motion.test.ts npm test` fails only the new case: actual starts are `[7000, 6960]`; expected starts are `[7000, 7000]`. The other 17 cases and the type check pass. The source is then restored.
- Green: the same command passes all 18 cases, 67 Node tests and the type check. Both faces use 7000 ms. The test also checks the 40 ms setup and cancellation of the old face. No product code changes in this review repair.

### Full browser comparison

Branch: `3bbc64e4`. Base: `origin/staging/first-game` at `f306d452`, in a clean worktree. Each row below uses `npm run check:browser plugin-ui`. Times exclude the shared scheduler queue.

| Tree | First run | Second run | All browser slots reserved |
| --- | --- | --- | --- |
| Branch | Pass, 467.776 s | Whole-run limit, 480.407 s | Pass, 413.654 s |
| Base | Pass, 443.652 s | Pass, 431.718 s | Pass, 414.020 s |

- The commands above run one at a time. The quiet lock is clear at each start. Other worktrees use the shared scheduler, so some commands queue before the check starts.
- The failed branch run passes touch input and the tablet step. It reaches the whole-run limit in `idleBoard()` through `sendTurn()`, at `tools/plugin-ui-check.mjs:3482`. It does not repeat the review failure in `touchStroke()` at line 2052. Its browser log also reports macOS display-link errors; these errors alone do not prove the cause.
- The extra pair changes only the `plugin-ui` registry entry to `exclusive: true`, once in each tree. This reserves all browser slots. The same cases, code and 480 s limit run. Both registry files are restored after their commands end. The two check times differ by 0.366 s.
- The evidence points to shared machine load in the late timeout. It shows no branch slowdown with browser slots reserved. The exact cause of the reviewer's touch timeout remains unproved. No runtime fix or limit change is supported by these results.
- An earlier branch run passes in 437.998 s, but a base runner starts before it ends. That base runner is stopped by PID after 17.482 s. Both runs are excluded from the table. A local runner lock then prevents overlap within this task.

### F-008 comparison

- Command: `KINGDOWN_TEST_FILE=tools/plugin-board-input.test.ts npm test`, twice on each tree, without a name filter.
- Each run passes all 45 file cases, including both F-008 cases, 67 Node tests and the type check.
- Branch command times: 128.069 s and 145.991 s. Base command times: 131.398 s and 138.318 s. These times include the type check and Node tests.
- `boardSheet()` opens the Moves sheet and sets focus. `fitSheetBody()` puts its scroll region in the Tab order. PageDown and End use native browser scroll. The open transition comes from `src/style.css` and takes 175 ms. The sheet open and scroll paths do not call `UiMotion.play()`.
- The board, sheet styles and board-input test are identical on branch and base. The motion change does not set the sheet's scroll position or replace its rows. No F-008 failure repeats, so no scroll fix is made.

### Review evidence

- Logs use the `spent-fix3-` prefix in the output folder. `spent-fix3-results.json` lists the results. `spent-fix3-evidence/` keeps the browser logs and run records. The two scheduling patches also stay in the output folder.
- Change review: the 13-line test uses the existing clock and control stubs. It tests the missing behavior directly. No new helper, dependency, game rule, retry or time limit is needed.
- The full suite and WebKit checks do not run in this review repair. No push or deploy occurs.

### Review repair commit and final checks

- Test commit: `b46d94f2fd84c37fe69c491c89d2410132f04a22`.
- Before the final ticket commit, `git fetch origin` completes. `git merge --no-edit origin/staging/first-game` reports that the branch is up to date with `f306d45267f5ce58f983c09a1ecc106c48c776ba`. The measured product code does not change.
- `npm run test:docs` passes all 180 cases in 15 files. `git diff --check` passes.
- The normal commit hooks run without input overrides. The test change is 13 lines; this ticket holds the review evidence.
