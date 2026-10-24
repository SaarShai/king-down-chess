# Fix six playtest faults of the game board

Status: resolved on branch `staging/lane-board` (from `origin/staging/first-game` `2f70eab2`, then merged with `4651f6da`); not merged into `staging/first-game`, not deployed. The F-032 and F-008 commits (`224e7ed7`, `b3eb5e83`) and their review fix (`37ddecea`) also go to the focused staging release on `0041783d`.

## What

The four-player playtest on staging found six faults of the game board. The tickets are in the playtest folder (`playtest/reports/tickets/`, `playtest/findings/`), outside the repository.

| Finding | Severity | Fault |
| --- | --- | --- |
| F-032 | S3 | Account game, phone, touch: a tap on a pawn's promotion square opens no choices. |
| F-038 | S3, unverified | Touch: a tap on a Beast target with two bite orders opens no Choose a move sheet. |
| F-011 | S3 | Account game: All rules shows one short line, not the moves and the takes. |
| F-103 | S3 | Web game, Flame Strike armed: a tap on a pawn hides the power line and Cancel. |
| F-008 | S3 | Account game: a long Moves sheet does not scroll by keyboard. |
| F-009 | S4 | Account Menu: Shift+Tab to Refresh the board, then Escape: no visible focus on Menu. |

## Scope

- `src/plugin/screens/board.ts`, `src/plugin/screens/board.css`: F-032, F-038, F-011, F-008, F-009.
- `src/read.ts`, `src/ui/table.ts`, `src/context-line.ts`: F-103, in the web game. `src/context-line.ts` belongs to another lane. The change adds one optional field (`armedRefusal`) and changes no rank.
- Tests: `tools/plugin-board-input.test.ts` (F-032, F-038, F-008, F-009; at `37ddecea` the F-032 and F-008 tests are still in `tools/plugin-board.test.ts`), `tools/plugin-board.test.ts` (F-011), `src/read.test.ts` and `src/context-line.test.ts` (F-103), `tools/verify-powers.mjs` (F-103, `npm run check:browser powers`).
- No change to an existing assertion, guard or time limit.

## Acceptance

- Each fault has a test that fails without its fix and passes with it.
- `npx tsc --noEmit -p .` passes.
- The touched test files pass, and the browser checks `plugin-ui`, `game-screen`, `ux-defects`, `special-moves` and `powers` pass.

## Result

### Causes and fixes

- **F-032 and F-038.** The board handles a tap on `pointerup` (`src/render/PaintedView.ts`). A tap on a target with more than one move (four promotions, or two bite orders) opens the Choose a move sheet and its scrim at once. On touch, the browser sends the tap's `click` after the touch ends, to the element under the finger: the new scrim. `scrim.onclick` closed the sheet in the same frame. A mouse click goes to the canvas, and the keyboard sends no click, so both worked. Now the scrim closes the sheet only for a click whose press starts on the scrim. A capture `pointerdown` listener on the document records this for each press; `pointercancel`, each click and the sheet's open and close reset it, so an old press that ended on the sheet cannot close the sheet later. The tap's compatibility `mousedown` also lands on the scrim and moved focus from Close to the page body, so Escape did not close the sheet; the scrim now stops the default of `mousedown`. A real tap or mouse click on the scrim still closes the sheet. The F-038 test uses a white Beast on c4 with two black pawns on c3 and d4; the playtest position was used up, so the test is not the same position.
- **F-011.** All rules showed only `readText`, the one-line read. It now also shows the piece cards of the web Guide (`pieceGuide`, `guideTypes`): the selected piece first, then each other piece, with Moves, Takes and Special. The cards use text nodes only, so a Workshop design name stays text.
- **F-103.** `unmarkedTap` gave "This pawn has no legal move." for a pawn that the armed Strike cannot move, and `contextLine` ranks a refusal above the armed power. Now the refusal names the power ("Strike cannot move this pawn."). The web table passes it as `armedRefusal` while a power is armed: the armed rank keeps the power line and Cancel, and the refusal leads the note. A server refusal on the account board still outranks an armed power.
- **F-008.** The sheet's Tab trap held only the Close button, so Tab never reached the Moves list, and PageDown on Close scrolls nothing. A sheet body that scrolls is now a named region (`role="region"`, the sheet title as its name) with `tabindex="0"`. A `ResizeObserver` and each Moves update keep this current. A focused body stays a region, so focus does not drop to the page; when it loses focus and no longer scrolls, it leaves the Tab order.
- **F-009.** `closeBoardSheet` moved the parked controls (Refresh the board, the move choices) out of the sheet before it read whether the sheet held focus. A moved control loses focus, so the function did not restore focus. It now reads the focus first. The test opens the board through the fixture endpoint and waits for an enabled Refresh the board (without a board read it is disabled). From Close, Shift+Tab goes first to the game-policy button in the header ("Casual game"), so the test presses Shift+Tab two times to reach Refresh the board.

### Red runs (the tests without their fix)

`2f70eab2` with the new tests (`KINGDOWN_TEST_FILE`, Chromium): 6 failed.

- F-032 and F-038: the Choose a move sheet is not visible after the touch tap.
- F-011: no `.piece-card` in All rules.
- F-008: Tab does not focus the sheet body.
- F-103: `unmarkedTap` gives "This pawn has no legal move."; `contextLine` gives rank `refusal`, not `armed`.
- `npm run check:browser powers` fails: the context is "This pawn has no legal move." and the pawn's rule, with no power line.

F-009, the branch with only the F-009 code change undone: the Refresh the board case fails at the last step (Menu does not have focus after Escape). The Close case passes.

Review fix (`37ddecea`), its tests on `b3eb5e83`: Chromium 3 failed (Close loses focus after the touch tap, in the promotion and Beast cases; the old scrim press closes the sheet; the body keeps `tabindex`, `role` and `aria-label` after blur). WebKit 2 failed (the old-press test is Chromium only).

### Green runs

- `37ddecea` on `b3eb5e83`, `F-032|F-008`: Chromium 4 passed, WebKit 3 passed. The same on `0041783d` with the three commits picked: Chromium 4 passed, WebKit 3 passed.
- Branch tip, the touched files (`tools/plugin-board.test.ts`, `tools/plugin-board-input.test.ts`, `tools/plugin-board-drafts.test.ts`, `src/read.test.ts`, `src/context-line.test.ts`): 299 passed.
- Branch tip, WebKit, the playtest tests (`F-0`): 7 passed.
- `npx tsc --noEmit -p .` passes.
- `npm run check:browser plugin-ui game-screen ux-defects special-moves powers`: all 5 passed.

## Owner decisions

- All rules lists the same pieces as the web Guide (the chess pieces, the fixed fairy set and the draw pool), not only the pieces of this game. Pick: match the web Guide, as F-011 asks.
- The power refusal reads "<Power> cannot move this <piece>." Pick: this sentence.
