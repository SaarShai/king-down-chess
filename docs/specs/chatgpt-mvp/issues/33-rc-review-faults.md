# 33 Release candidate review faults

Status: resolved
Branch: claude/rc-fixes
Base: 4692477c1669db14782e0058126ad291e1664ba8

The owner asks for R1, R2 and R3 in the source ticket at
`/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/tickets/issues/33-rc-review-faults.md`.

## Plan and checks

1. Add tests with no product change. Show each fault on the base code.
2. R1: show the first enemy lesson before the general note. Record a lesson only when its text shows. Check Black's first turn, a later swap, a hidden lesson and White's first note on the board.
3. R2: keep a long token in the invitation preview. Check Open, preview and Join with a fixed long token. Keep the short-code check.
4. R3: correct the P5 review note. Check the other prompts against both packet copies. Keep the other words.
5. Run `npx tsc --noEmit` and `npm test` with the local test database. Commit before both browser checks. Run `plugin-ui` and `plugin-ui-http` through the owner's check runner. Record the results here.

Do not change `src/plugin/app.css` or the zoom checks. Do not push, merge or deploy.

## Evidence

The tests-only commit is `c6771fd3`. Its board, service and review note match the base `4692477c`.

- R1 fails in `plugin-ui` on the M1 with Chrome: Black sees the general note instead of the swap lesson. The run ends with `check-runner: M1 exit 1 at c6771fd3`. Log: `scratchpad/lanes/rc-fixes/checks-red-r1-2.txt` under the source ticket root.
- R2 fails in `npm test` with `KINGDOWN_TEST_FILE=src/plugin/server.db.test.ts` and the local test database. The preview changes the token. The other 37 tests pass. Log: `scratchpad/lanes/rc-fixes/red-r2.txt`.
- R3 fails in `npm test` with `KINGDOWN_TEST_FILE=tools/submission-packet.docs.test.ts`. The note lacks the correct P5 sentence. The other 12 tests pass. Log: `scratchpad/lanes/rc-fixes/red-r3.txt`.
- The first R1 run stops before the tests: this Mac has no Playwright Chromium file. The next run uses installed Chrome through `PLAYABLE_BROWSER=chrome`. No time limit changes.

## Changes

- R1: a fresh enemy lesson comes first. The board records it after it puts the lesson text in the visible note. A later swap does not repeat it. A lesson hidden by check stays available.
- R2: token lookup returns the trimmed token as given. Short-code lookup still returns the normal upper-case code. The test covers Open, preview and Join with a fixed token that has mixed case, hyphens and underscores.
- R3: P5 resigns a computer game. The active friend game stays for the Block check. The other review-note instructions do not conflict with the eight prompt cases in either packet copy. No other packet words change.

## Final checks

The code checks run at `f57722b5`. The later ticket commit changes only this record.

- `npx tsc --noEmit`: pass.
- Full `npm test`, with the local test database and two workers: exit 0. All 188 test files pass. The totals are 3,053 passing tests, one expected failure and eight skipped tests. The 51 art tests also pass. Log: `scratchpad/lanes/rc-fixes/tests-green-3.txt`.
- `plugin-ui`: pass in 132.1 seconds on this Mac with Chrome.
- `plugin-ui-http`: pass in 144.7 seconds on this Mac with Chrome and the local test database.
- The browser run ends with `check-runner: mac exit 0 at f57722b5`. Log: `scratchpad/lanes/rc-fixes/checks-green-1.txt`. Both logs include the four R1 board cases.
- `git diff --check`: pass. The diff leaves `src/plugin/app.css` and the zoom checks unchanged.

## Test setup and failed checks

The first full test run reports a missing WebKit file and a search test that exceeds its five-second limit. The test browser install supplies WebKit. A single-file search check then passes all 18 tests with the same limits. Logs: `tests-green-1.txt` and `search-recheck.txt` in the lane folder.

The next full run uses one worker. It reports the simulation child-process limit and a clipboard test limit. A results-card query also fails to return within five seconds. The configured results folder is present. A file-system volume check (`getattrlist`, `ATTR_VOL_UUID`) confirms that its volume identity matches the card configuration. I stop only my failed test run with SIGINT; it exits 130. Log: `tests-green-2.txt`.

The final run uses `VITEST_MAX_WORKERS=2` and sets the existing `KING_DOWN_RESULTS_DIR` option to that same verified card folder. Results stay on the card through `tools/lib/results-root.mjs`. This avoids repeated slow disk queries. The local test database URL stays as the owner gives it. No test or check time limit changes. No source change is needed for this setup.

## Review

Each fix stays in its current code path. No new dependency or extra product choice is needed. R3 keeps all other packet words. All three parts are built. No taste choice is needed.
