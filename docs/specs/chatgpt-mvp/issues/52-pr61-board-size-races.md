# PR 61: board and iOS size test races

Status: done
Type: task

## Scope

Check audit findings 2, 3, 7 and 8 at base `d51f954c`.
Change only `tools/plugin-board.test.ts`, `tools/plugin-ios-size.test.ts`
and this ticket. Keep all assertions, size floors, expected values and
time limits. Do not change the STEP factor or product code.

## Plan and checks

1. Compare each finding with the code and tickets 45, 48, 49 and 50.
2. Wait for board paint before the exact geometry read. Pause the page
   clock before the result view. Use checked mouse input for the named
   Ready and Send presses. Keep the wait for each enabled button.
3. Run each changed case three times in WebKit and once in Chromium.
   Run both full files once in each browser. Use the test lock and one
   browser run at a time. Keep the known Mac WebKit Tab-focus failure.
4. Check types and the diff. Record results. Commit one fix with the
   required trailers. Do not push or merge.

## Cause and change

All four findings match the code.

- Finding 2: `aria-busy="false"` reports that board art is ready.
  Board entry still scales for 320 ms. Call `waitForBoardPaint` before
  the unscrolled-board case reads its geometry. The helper waits for a
  visible canvas, current animations and one animation frame. Keep the
  exact 192 px floor and all control-position checks.
- Finding 3: the page clock runs after installation. The king fall ends
  after 1130 ms, so browser calls can miss it. Use the existing fixed-time
  and paused-clock pattern before `routeView`. Keep it paused for the
  live reads and Skip press. First run the queued result timers and frame
  with `runFor(50)`. Finish then keeps its original 1130 ms advance.
- Finding 7: ten Send presses still use locator clicks. Tickets 45 and 49
  record a WebKit stall in that input path. Wait for each enabled button,
  scroll it into view, then use the existing `clickButton` helper. Keep
  the separate synthetic second press that checks duplicate prevention.
- Finding 8: ten Ready presses and one Send press use that same input
  path. Copy the board file's checked mouse helper into the size test.
  Use the same enabled wait, scroll and real mouse input at each site.
  A helper import from the board test would register its tests here.

These changes fix test timing and input faults. They show no product
fault. They add no retry or fixed sleep to a test.

The first WebKit check with only a paused clock cannot open the result
card. The route queues `setTimeout(..., 0)`, and the card queues an
animation frame. Step that work with `runFor(50)`, as the paused-result
pattern in `plugin-motion.test.ts` does. The clock then stays paused.
This is a clock step, not a larger wait limit. The initial log keeps
both ceremony failures and the known Tab-focus failure.

## Changed lines

- `tools/plugin-board.test.ts:133`: pause the clock before the result route.
  Line 136 runs the queued result work.
- `tools/plugin-board.test.ts`: checked Send presses at lines 1198, 1232,
  1275, 1302, 1366, 1400, 1453, 1474, 1574 and 1593. Each press has an
  enabled-state wait and a scroll step before it.
- `tools/plugin-ios-size.test.ts:6`: add the locator type for the copied
  mouse helper at line 30.
- `tools/plugin-ios-size.test.ts`: checked Ready presses at lines 95, 147,
  176, 207, 255, 298, 333, 520, 565 and 608. The checked Send press is at
  line 539. Each press keeps the enabled-state wait and scroll step.
- `tools/plugin-ios-size.test.ts:567`: wait for board paint before the
  unscrolled-board case reads geometry.

## Validation

All commands run on this Mac in this worktree. One browser runs at a
time. Each command uses `tools/test-lock.sh`. The remaining batch also
holds the same lock between commands. Queued commands wait for the lock.
No test retry option is set.

The two name filters select all changed cases. They select 12 board cases
from 11 test templates, and 18 size cases from 10 templates. The filters,
full command records, case names and logs are in the supplied folder:

`/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/` (its review subfolder)

The filter files are `race-a-board-filter.txt` and `race-a-ios-filter.txt`.
`race-a-test-manifest.json` lists their name prefixes.
`race-a-case-coverage.json` lists each executed case and its result.
It confirms the same exact 12 and 18 cases in all four focused runs.
`race-a-test-results.json` records the remaining 11 commands and results.
The first corrected board run has its own log.

In these commands, `board_cases` and `size_cases` hold those two filters.
The first two commands run three times each. The other commands run once.

```sh
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts -t "$board_cases" --reporter=verbose
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-ios-size.test.ts tools/test-lock.sh npx vitest run tools/plugin-ios-size.test.ts -t "$size_cases" --reporter=verbose
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts -t "$board_cases" --reporter=verbose
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-ios-size.test.ts tools/test-lock.sh npx vitest run tools/plugin-ios-size.test.ts -t "$size_cases" --reporter=verbose
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts --reporter=verbose
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-board.test.ts tools/test-lock.sh npx vitest run tools/plugin-board.test.ts --reporter=verbose
PLAYABLE_BROWSER=webkit KINGDOWN_TEST_FILE=tools/plugin-ios-size.test.ts tools/test-lock.sh npx vitest run tools/plugin-ios-size.test.ts --reporter=verbose
PLAYABLE_BROWSER=chromium KINGDOWN_TEST_FILE=tools/plugin-ios-size.test.ts tools/test-lock.sh npx vitest run tools/plugin-ios-size.test.ts --reporter=verbose
```

| Check | Result |
| --- | --- |
| Changed board cases, three WebKit runs | Each has 11 passes and the known W7 focus failure; 116 cases are filtered. Times: 18.24, 18.16 and 18.20 s. |
| Changed board cases, Chromium | 12 pass; 116 cases are filtered. 14.83 s. |
| Changed size cases, three WebKit runs | Each has 18 passes; 13 cases are filtered. Times: 36.38, 36.81 and 36.96 s. |
| Changed size cases, Chromium | 18 pass; 13 cases are filtered. 30.37 s. |
| Full board file, WebKit | 127 pass and the known W7 focus failure. 130.87 s. |
| Full board file, Chromium | All 128 pass. 96.99 s. |
| Full size file, WebKit | All 31 pass. 48.04 s. |
| Full size file, Chromium | All 31 pass. 38.73 s. |
| `npm run typecheck` | Pass after the final test edit. |
| Assertion and limit comparison with base | All 397 board and 85 size assertion lines stay verbatim. All 6 board and 14 size limit lines stay verbatim. |
| `git diff --check` | Pass. |

The known case is `W7: stages a move, sends once, and starts the computer
only after the press`. Its unchanged Tab-focus check at line 1240 gets
false in all four final WebKit runs. The likely cause is a Mac WebKit
Tab setting; CI passes it. Tickets 49 and 50 already record the base failure. This task
keeps that assertion and does not repeat the base run.

Final logs use `race-a-board-webkit-1.log` through `-3.log`,
`race-a-board-chromium-1.log`, `race-a-ios-webkit-1.log` through `-3.log`,
`race-a-ios-chromium-1.log`, and each suite/browser's `-full.log`.
The initial failed clock check stays in `race-a-board-webkit-pre-step.log`.
It has two result-card timeouts and the known focus failure. The final
three board WebKit runs follow the clock-step fix.

## Review and limits

The diff uses the existing paint, paused-clock and mouse-input patterns.
The size file needs a local copy of the mouse helper because the task
limits changes to these two tests and this ticket. No shared helper file
or product file changes. All original assertions, floors and expected
values stay. No time limit, STEP factor, workflow, dependency or retry
changes. The separate synthetic duplicate press stays.

Linux CI and the full `npm test` do not run here. No VM starts. No push or
merge is made. The known Mac WebKit focus failure stays. The commit hook
uses its documented empty secret-source overrides, so it reads no real
secret source.
