# PR 61: misc checks under load

Status: done

Scope: the seed-review game count, lobby poll handoff, and 120-game Profile contrast checks from ticket 43.

## Plan

1. Run the three checks with the 4x CPU slow-down. Save each failure where possible.
2. Find the cause. Replace waits with waits for the required event. Fix product code if the product fails.
3. Run each fixed check three times with the slow-down and once at full speed. Use the test lock. Keep all time limits and coverage.
4. Review the diff, record the results, and commit on this branch. Do not push.

## Checks

The three checks pass with their original assertions and time limits. The work changes only the misc group.

## Causes and changes

- The shared local test database can lack the per-tool counter table. The first MCP Open call then fails with PostgreSQL code `42P01`. The seed suite now uses `ownTestDatabase('seedreview')`, which applies all current migrations before the suite starts. The seed and the MCP assertions stay the same.
- The computer handoff reads the solo board, then reads the waiting human game in the background. The old wait accepts the first read. A late watch reply then adds a read during the next five-second step. The two replies can arrive in either order. The test now waits for the board and for all transport calls to finish.
- The Profile check captures the full viewport, although its pixel check uses only the mark and date boxes. The supplied sweep times out in screenshot capture after fonts load. The test now captures the rectangle that contains every sampled mark and date box. Each size keeps all 120 mark checks and all 120 date checks on the real parchment.

## Baseline

A 4x run uses the supplied CPU throttle, with its Playwright import set to this worktree's installation. The test lock protects the run. A disposable local database has migrations 0001–0014, then loses only `public.plugin_tool_tries` for this check. The seed test fails with the same Open error and PostgreSQL code as the sweep. The lobby case and all three Profile cases pass in this local baseline. Their earlier failures are in the supplied sweep logs; they do not recur in this baseline.

A second 4x probe holds the human-watch call. The old read-count wait still finishes. An added assertion detects this early finish and fails. The probe is temporary.

## Verification

- Each target passes 3/3 runs at 4x and 1/1 at full speed. The five targets are the seed count, the lobby budget, and the three Profile sizes.
- Each filtered slow run passes 5 target tests and 51 document tests. The full-speed run passes all 55 tests in the three files and 51 document tests. The full file run has no skipped tests.
- Nine pairs of full and cropped captures have no differences in the sampled pixels. The 899 × 900 case checks all 120 marks and dates in this comparison.
- At 4x, paired capture times have medians of 65 ms for the full viewport and 39 ms for the crop. Median capture area falls from 809,100 to 538,158 pixels.
- Every test command uses `npm test` through the project test lock. The temporary config selects the three files, sets the name filter, and loads the supplied throttle. Its Playwright import uses this worktree's installation. A temporary trace confirms CDP rate 4.
- All poll-interval and contrast assertions stay in place. All time limits and WebKit checks stay in place. These checks run on macOS with Chromium. Linux and WebKit are not rerun here.

## Review

The change uses the existing database helper and the transport's active-call count. The capture uses the measured boxes. It adds no product code or dependency. The Profile timeout does not recur in the local baseline. Its supplied sweep failure and the pixel comparison support the bounded capture change.
