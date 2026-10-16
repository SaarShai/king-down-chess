# Board: recovery handoff and review

Status: in-progress

Source: owner ticket 12-submit-turn, part w7-04-recovery.

Recovery moves to ticket 19 S5. This ticket records the handoff and the review checks. It does not build recovery in this lane.

## Plan

1. Check both reviews against the ticket, design, source and Git state.
2. Fix each confirmed fault with a test. If no fault exists, keep the source and tests as they are.
3. Run unit tests and the single board test file with npm test on this Mac and the supplied local test database. Run plugin-ui and plugin-ui-http on the M1 with the shared lock. These checks replace the prior queued board checks.
4. Record the results and commit on claude/od-board.

## Checks

- The starting head is eba18a62cb73910d6afb86152354431ea5979682. No source or test change exists at the start.
- Ticket 19 S5 covers all six recovery parts and their test cases.
- Each confirmed fault has a test. All required checks have a recorded result.

## Review results

- Review A reports no findings. The clean worktree and starting head agree. The latest commit belongs to ticket 03. The scratch ticket moves recovery to ticket 19 S5.
- Review B reports no findings. The same checks confirm its scope and result.
- The code has no private draft field in PageState. rollbackBoardMove takes no refusal code and clears the draft. Recovery is still unbuilt.
- Design section 5.1 covers private state with a game tag, restore at mount and the keep-or-drop rule. It covers refusal outcomes, the T6 line and Undo off while a command waits. D9 to D12 cover journeys 5 to 8. D13 covers draft retention across navigation. S5 lists D1 to D13 and the client draft tests.
- Neither review has a finding that needs a source change or a new test. The later fixture failure belongs to ticket 03.

## Check results

- The local unit suite passes with npm test, the supplied test database and two workers. It passes 156 files and 2,400 tests, with 8 skips. All 50 figure checks and the type check pass. It takes 218.79 seconds after the lock wait. Log: /tmp/kd-od-board-recovery-unit.log.
- The unit selector leaves the nine browser test files out of that suite. The single board test file passes with npm test on this Mac. All 56 board tests, all 50 figure checks and the type check pass. It takes 138.26 seconds after the lock wait. Log: /tmp/kd-od-board-recovery-board.log.
- The document checks pass: 8 files and 114 tests in 1.93 seconds. No test limit, check limit or dependency changes.
- The prior M1 job, PID 82165, waits for the shared lock. It stops before any browser check starts. A new bundle sets the lane folder to eba18a62. The package lock is the same, so no package install runs.
- M1 job PID 99495 takes the shared lock after about 65 minutes. The M1 worktree is clean at eba18a62 when plugin-ui starts. Results: /tmp/kd-od-board-recovery-m1.results. Logs: /tmp/kd-od-board-recovery-ui.log and /tmp/kd-od-board-recovery-http.log. Its exit trap releases the lock after success or failure.
- The first plugin-ui check fails in 228.3 seconds at tools/plugin-ui-check.mjs:1669. A draw offer changes the board or row size at 320 px in the start position. The [ticket 03 follow-up](03-board-draft-play.md) records this case and the fix plan.
- The first HTTP attempt stops in 0.1 seconds because the launcher omits PLUGIN_TEST_DATABASE_URL. It runs no HTTP tests. A separate loopback tunnel now reaches the supplied test database. The corrected run uses that tunnel.
- The local test tunnel is PID 50644 and uses M1 loopback port 57096. Stop this PID after the HTTP check ends. The layout retest stays in the ticket 03 follow-up.
- The ticket 03 layout fix passes all 59 board tests at three viewport sizes. Its full unit retest passes 156 files and 2,400 tests, with 8 skips. The type and figure checks pass. Ticket 03 records both logs and run times.
- Checks are in progress.
