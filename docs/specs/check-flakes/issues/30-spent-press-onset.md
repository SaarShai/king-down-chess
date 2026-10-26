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
