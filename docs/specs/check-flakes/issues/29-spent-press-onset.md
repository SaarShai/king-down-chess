# 29 Keep one start time for a spent-card press

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

## Cause

The recorder estimates the onset with `performance.now() - currentTime`. The app samples the age before it calls `element.animate()`. The recorder then reads computed styles before it sets and records `currentTime`. The estimate includes each setup cost. The added page work changes that cost, so the original 15 ms check fails. Thus, the CI number does not prove that separate parts start in different frames.

There is also a weak point in the product clock. A new native animation is pending. A seek to an age holds that age until the browser starts it. Setup and the wait for a frame can move its resolved start time. A row rebuild can therefore shift the visible press. The product promise is one saved start time across replacement faces, not a new press at each rebuild.

The [browser timing rules](https://www.w3.org/TR/web-animations-1/#waiting-for-the-associated-effect) describe this pending start and the use of an explicit start time.

## Fix

- `UiMotion.play()` sets `animation.startTime = at`. Each replacement uses the same event time. Setup work and a late frame do not move that time.
- The recorder reads the native start time when the page sets it. It does not estimate that time from a later wall-clock read. A missing start time records `NaN`, so a missing clock assignment cannot pass the spread check.
- The spent-card test keeps the uneven 40 ms setup load. The clock unit test covers setup costs of 0 ms and 40 ms, a row rebuild, cancellation, and the end of the event window.
- The 15 ms limit stays. The duration, end style, coin size, single press and reduced motion checks stay.

## Verification

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
