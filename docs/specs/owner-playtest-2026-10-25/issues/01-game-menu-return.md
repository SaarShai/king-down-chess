# 01 — Main menu in the game menu

Type: task
Status: resolved
Finding: F-107
Branch: staging/playtest-game-menu
Base: origin/staging/first-game, a89a9381a73c0744574bdd27bb2b8c96a6e773c6

## Request and approval

Saar approves the desktop and phone samples. Menu has Main menu as its first row. The game screen has no separate Play return button. The return keeps the game. It does not send a turn or a game action.

The approved samples are `F-107-menu-sample-1280.png` and `F-107-menu-sample-390.png` in `playtest/reports/owner-playtest/F-106-F-108/run-02/`. The before images and both samples are viewed. The sample changes only the page. This ticket replaces the old draft's pending approval with the owner's current build approval.

## Plan

1. Check each return control and its callers. Keep the return paths on other screens.
2. Add a test. Show that it fails on the base code. Add Main menu with the current return path. Remove the separate return on the game screen.
3. Run the type check, focused tests, full tests and affected browser checks. Check keyboard focus and a staged turn.
4. Capture the local build at 1280 by 800 and 390 by 844. Compare each image with its approved sample.
5. Record the evidence and commit on this branch. Write the report and PR body. Do not push, open a PR or merge.

## Acceptance checks

- Main menu is the first Menu row on phone and desktop.
- The separate Play return is absent on the game screen.
- Other screens keep their return path.
- Main menu uses the current navigation path to Play.
- The return does not resign, abort, offer a draw or send a turn.
- The game and its staged turn remain available on return.
- The row uses the role, focus order and visible focus of the other rows.
- Close and Escape return focus to Menu.
- Tap and move preview input do not change. Ticket 87 owns that code.

## Evidence

Main menu is the first Menu row. It closes Menu and uses `navigate('play')`. The return does not call a game command. The test stages e2-e4, returns to Play and opens the same game. The saved turn, shown position, game ID, revision and game status stay the same. No move, resign, abort or draw call occurs.

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
