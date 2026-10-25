# 01 — Main menu in the game menu

Type: task
Status: resolved
Finding: F-107
Branch: staging/playtest-game-menu
Base: origin/staging/first-game, a89a9381a73c0744574bdd27bb2b8c96a6e773c6

## Request and approval

Saar approves the desktop and phone samples. Menu has Main menu as its first row. The game screen has no separate Menu return button. The return keeps the game. It does not send a turn or a game action.

The approved samples are `F-107-menu-sample-1280.png` and `F-107-menu-sample-390.png` in `playtest/reports/owner-playtest/F-106-F-108/run-02/`. The before images and both samples are viewed. The sample changes only the page. This ticket replaces the old draft's pending approval with the owner's current build approval.

## Plan

1. Check each return control and its callers. Keep the return paths on other screens.
2. Add a test. Show that it fails on the base code. Add Main menu with the current return path. Remove the separate return on the game screen.
3. Run the type check, focused tests, full tests and affected browser checks. Check keyboard focus and a staged turn.
4. Capture the local build at 1280 by 800 and 390 by 844. Compare each image with its approved sample.
5. Record the evidence and commit on this branch. Write the report and PR body. Do not push, open a PR or merge.

## Acceptance checks

- Main menu is the first Menu row on phone and desktop.
- The separate Menu return is absent on the game screen.
- Other screens keep their return path.
- Main menu uses the current navigation path to Menu.
- The return does not resign, abort, offer a draw or send a turn.
- The game and its staged turn remain available on return.
- The row uses the role, focus order and visible focus of the other rows.
- Close and Escape return focus to Menu.
- Tap and move preview input do not change. Ticket 87 owns that code.

## Review fix plan

The independent review of PR #117 confirms one P2 fault. After See the board, the result page head covers the upper 18 px of the opponent power coin at 1280 by 800 and 852 by 393. A click in that area does not open the power details.

1. Add an upper-edge hit check to the current result-board test. Show that it fails with the current CSS.
2. Keep the absolute head position. Let clicks pass through the head. Keep its one control, `#page-back`, active.
3. Show that the edge click opens the power details at both landscape sizes. Use a real return click. Save both board images.
4. Run the required type check, selected tests, three browser checks and doc checks. Record the results and commit the three changed files.

The check uses a point 4 px below the top of the opponent power coin. The point must stay inside the old 52 px head band. The coin must receive the click, its details must open, and the return must open Menu.

## Caption fix plan

The owner reports that the result return covers the move caption at 852 by 393.

1. Find the caption and compare the same view with base `a89a9381` in a temporary worktree.
2. Add a caption check to the final-move test. Show that the check fails before the CSS fix.
3. Reserve space for the return with the smallest CSS change. Keep the board size, 48 px return target and power coin edge input.
4. Check the result board at 1280 by 800, 852 by 393, 390 by 844, 375 by 667 and 320 by 568. Save and view each image.
5. Run the required type, selected test, browser and doc checks. Record the results and commit the three changed files.

The caption and return boxes must not intersect. The full caption must stay visible when present. An absent caption must have an explicit test result. The return must take real input. The power coin edge check must pass. The temporary worktree and all processes from this run must end before the report.

## Caption fix evidence

`#short-last-move` holds the short caption. `#short-move-words` holds its words. `moveLine()` in `src/plugin/screens/board.ts` sets the text. The short-table rule in `src/plugin/app.css` shows the caption. The short-landscape rule puts it at `top: 0; left: 8px` in the table.

The base capture uses `a89a9381` in a temporary detached worktree. At 852 by 393, the base result head takes a 52 px row. The caption starts at `(8, 52)`. The return ends at y=50. The boxes do not intersect. At the current head before this fix, the absolute result head takes no row. The caption starts at `(8, 0)` under the return. This confirms the new fault from `5ef80636`. The caption is absent at 1280 by 800 in both captures. The temporary worktree is removed.

One rule in `src/plugin/screens/end.css` adds a 72 px left margin and a maximum width of `calc(100% - 88px)` to the result caption. It keeps the full words clear of both return controls. At 852 by 393, the caption starts at x=80. The return ends at x=70.39. The board keeps its size. The head keeps its click settings from the power coin fix.

The final-move test adds 390 by 844, 375 by 667 and 320 by 568. It checks the board size, a return target of at least 48 by 48 px, the caption box and the full text bounds. It reports an absent caption and passes that case. The phone cases use the current safe-area fixture. The test sends real return input at each size. Both landscape cases keep the upper-edge coin hit check and its real click.

Before the CSS fix, the caption check fails at 852 by 393, 375 by 667 and 320 by 568. Four cases pass. The two short phone cases expose a caption box that meets the 48 px table return. After the fix, all seven cases and all 57 Node tests pass. The selected test set passes all 350 tests and all 57 Node tests. Both coin edge points still hit `power-b` at y=38. Both clicks open Freeze details.

All logs below use `/private/tmp/claude-501/ci87/run38/menu-caption-files/`. The test and browser commands use `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_plugin_test`.

| Command | Result | Log |
| --- | --- | --- |
| `git worktree add --detach /private/tmp/claude-501/ci87/run38/menu-caption-files/base a89a9381` | Pass | `base-add.log` |
| `node /private/tmp/claude-501/ci87/run38/menu-caption-files/capture.mjs base`, in the base worktree | Pass; both base images are viewed | `base-capture.log`, `base-geometry.json` |
| `node /private/tmp/claude-501/ci87/run38/menu-caption-files/capture.mjs before` | Pass; records the overlap before the fix | `before-capture.log`, `before-geometry.json` |
| `git worktree remove /private/tmp/claude-501/ci87/run38/menu-caption-files/base` | Pass | `base-remove.log` |
| `npx tsc --noEmit -p .` | Pass | `typecheck.log` |
| `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts KINGDOWN_TEST_NAME='cancels a pending ceremony' npm test`, before the CSS fix | Three expected failures; four pass; 97 skip | `regression-before.log` |
| The same selected command, after the CSS fix | Seven pass; 97 skip; 57 Node tests pass | `regression-after.log` |
| `KINGDOWN_TEST_FILE='{tools/plugin-board*.test.ts,tools/plugin-app.test.ts}' npm test` | 350 tests and 57 Node tests pass | `focused.log` |
| `bash tools/test-lock.sh node /private/tmp/claude-501/ci87/run38/menu-caption-files/capture.mjs after` | Pass at all five sizes; all images are viewed | `after-capture.log`, `after-geometry.json` |
| `pgrep -f '[t]ools/deploy[.]sh|[d]eploy-staging[.]mjs'` | No PID; no publish wait is necessary | `publish-check.log` |
| `bash tools/test-lock.sh npm run check:browser plugin-ui game-screen web-game` | All three pass in 312.0 s, 9.3 s and 69.1 s | `browser.log` |
| `npm run test:docs` | 176 tests pass; the final repeat checks this evidence text | `docs.log`, `docs-final.log` |
| `git diff --check` | Pass | `diff-check.log` |

The browser command uses this log folder as `TMPDIR`. Its full logs are in `kingdown-check-runs/playtest-game-menu-E9nejl/`. The checkout stays fixed for the complete browser command. The shared test lock waits end without process changes.

The base images are `F-107-result-base-1280.png` and `F-107-result-base-852.png` in the log folder. The after images are `/private/tmp/claude-501/ci87/run38/shots/F-107-result-after-{1280,852,390,375,320}.png`. Each image shows the result board after See the board. The captures use fullscreen with zero safe-area insets. The caption is absent at 1280, 390 and 375. It is fully visible at 852 and 320. No visible control covers the caption or return. The board size before the result equals its size after the result at all five sizes.

The full test suite does not run for this fix. CI runs it.

## Review fix evidence

The page head keeps its absolute position and board size. It uses `pointer-events: none`. Its only control, `#page-back`, uses `pointer-events: auto`.

The current final-move test now includes 1280 by 800 and 852 by 393. Each case opens See the board with king powers. It checks the point 4 px below the top of the opponent coin. Both points have y=38, inside the old head band. The test checks the hit target and sends a real mouse click. It checks that the Freeze details open. It then closes the details, clicks the page return with real input, and checks that Menu opens.

The first run uses the CSS from the review commit. Both landscape cases fail. The hit target is `page-head` at `(970, 38)` and `(578, 38)`. The real clicks do not open the details. The two portrait cases pass.

The selected run with the fix passes all 347 tests and 57 Node tests. It includes both edge cases and the real return clicks. The type check also passes. The logs are in `/private/tmp/claude-501/ci87/run38/menu-fix-files/`: `regression-before.log`, `focused.log` and `typecheck.log`.

The result-board images are `/private/tmp/claude-501/ci87/run38/shots/F-107-coin-edge-1280.png` and `F-107-coin-edge-852.png`. Both images are viewed. They show the board after See the board, with the return and both power coins visible.

The checks below use `/private/tmp/claude-501/ci87/run38/menu-fix-files/`. The selected tests and browser checks use `PLUGIN_TEST_DATABASE_URL=postgresql://kingdown_test@127.0.0.1:55432/kingdown_plugin_test`. The local database port is already open. No database start is necessary.

| Command | Result | Log |
| --- | --- | --- |
| `npx tsc --noEmit -p .` | Pass | `typecheck.log` |
| `KINGDOWN_TEST_FILE=tools/plugin-board.test.ts KINGDOWN_TEST_NAME='cancels a pending ceremony' npm test`, before the CSS fix | Two expected landscape failures; two portrait cases pass | `regression-before.log` |
| `KINGDOWN_TEST_FILE='{tools/plugin-board*.test.ts,tools/plugin-app.test.ts}' npm test` | 347 tests and 57 Node tests pass | `focused.log` |
| `pgrep -f '[t]ools/deploy[.]sh|[d]eploy-staging[.]mjs'`; `ps -o pid=,command= -p 90319` | The first PID is absent at the command check. Both later searches find no PID. No deploy wait is necessary. | `publish-check.log`, `publish-command.log`, `publish-recheck.log`, `publish-plugin-ui.log` |
| `bash tools/test-lock.sh npm run check:browser plugin-ui game-screen web-game` | The runner refuses plugin-ui because the ticket changes during its run. Game screen and website pass in 8.5 s and 67.0 s. | `browser.log` |
| `bash tools/test-lock.sh npm run check:browser plugin-ui` | Pass in 291.8 s with a fixed checkout | `browser-plugin-ui.log` |
| `npm run test:docs` | 176 tests pass; the final doc check verifies this ticket | `docs.log`, `docs-final.log` |
| `git diff --check` | Pass | `final-check.log` |

The first browser run completes its UI checks. Its file-change check refuses the run because this ticket changes while plugin-ui is active. The repeat keeps the checkout fixed and passes. No source fix follows that first browser run. The other two browser checks pass in the first run.

The full test suite does not run for this fix. CI runs it. No push, pull request, merge or deploy occurs.

## Evidence

Main menu is the first Menu row. It closes Menu and uses `navigate('play')`. The return does not call a game command. The test stages e2-e4, returns to Menu and opens the same game. The saved turn, shown position, game ID, revision and game status stay the same. No move, resign, abort or draw call occurs.

The row uses the same native button helper and CSS as the other rows. Keyboard checks pass at both sizes. Tab reaches Main menu, then Moves. Escape and Close return focus to Menu.

The shared return buttons stay in `src/plugin/index.html`. The board screen hides the page head and table return. The seat and result screens keep their return. The result header sits over the table, so the board keeps its size when the result card opens.

The shortest phone view can scroll the Menu body. The check scrolls each row into view and checks its full 48 px height. The browser helper opens Menu and clicks Main menu in one frame. A new board reply can close Menu between separate steps. The helper uses the real row; it throws an error if the row is absent. The pointer and keyboard tests remain in place.

All logs below use `/private/tmp/claude-501/ci87/run38/game-menu-files/`.

| Check | Result | Log |
| --- | --- | --- |
| `npx tsc --noEmit -p .` | Pass | `typecheck-final.log` |
| `KINGDOWN_TEST_FILE=tools/plugin-board-drafts.test.ts KINGDOWN_TEST_NAME=F-107 npm test`, with the base Menu handler | Two expected failures: Moves appears first | `regression-before.log` |
| `KINGDOWN_TEST_FILE='{tools/plugin-board*.test.ts,tools/plugin-app.test.ts}' npm test` | 345 tests pass; 57 Node tests pass | `focused-final.log` |
| The 11 other test files that refer to the shared return controls | 318 tests pass; 57 Node tests pass | `control-refs-final.log` |
| Full `npm test`, with the separate local test database | 5,154 pass; 8 skip; one known grace-period failure | `full.log`, `full-assessment.log` |
| `npm run check:browser plugin-ui game-screen plugin-ui-http web-game` | Game screen and website pass. The two plugin checks fail in the return helper. | `browser.log` |
| `npm run check:browser plugin-ui plugin-ui-http`, after the helper fix | Both pass | `browser-confirm.log` |
| `npm run test:docs` | 176 tests pass | `docs.log` |
| Local build and capture | Pass at 1280 by 800 and 390 by 844 | `capture.log`, `capture-geometry.json` |
| Image comparison | All seven row areas have no RGB channel difference above 16 | `compare.log`, `compare.json` |

The full run has only the known failure in `src/online/accounts.db.test.ts:324`. It expects 604,800,000 ms and gets 608,400,000 ms. The interval crosses the end of daylight saving time. The full command stops before its final Node step. Both focused runs pass that step. A separate branch owns the time-zone fix.

The first focused run finds six faults. It finds a result header that moves the board, a short-menu fit assumption and three old test paths. The selected retest passes all 14 cases after the fixes. The first other-caller run finds one more old phone path. Its retest passes. Logs: `focused.log`, `corrections.log` and `control-refs.log`.

The browser trace has a first failed probe: it reads the dialog before the first open creates it. The second probe passes and changes the timing. The final helper removes the gap between open and return. No trace code remains. Logs: `browser-trace.log`, `browser-trace-2.log` and `browser-confirm.log`.

After images: `/private/tmp/claude-501/ci87/run38/shots/F-107-menu-after-1280.png` and `F-107-menu-after-390.png`. Both images are viewed and compared with the approved samples. The rows, type, spacing and removed return match. The background pieces and player name differ. The current Close face is 44 px; the sample face is 48 px. Its touch target remains 48 px. This patch does not change that face. The full menu areas differ at 0.67% and 1.47% of pixels, at a channel threshold of 16.

The source review finds one Menu-line change in `board.ts`. Tap and move preview input do not change. The change adds no state, dependency or game rule.

## Comments

Work stays in this worktree. The code change stays in the menu and return controls. The old ticket and other worktrees are read-only.

## Menu name after the New game merge

F-115 names the main menu Menu. The result page head now says `‹ Menu`.
The old 72 pixel caption margin is too small at 852 by 393 with this label.
The margin is now 88 pixels. The maximum width is `calc(100% - 104px)`.
All seven selected final-move cases and 57 art checks pass. The five required
sizes keep a clear caption, a working return and the same board size.
Both landscape coin edge clicks still open Freeze. Ticket 04 records the
merged checks. Repair logs use `new-game-fix-files/` in the same run folder.
