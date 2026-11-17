# Round 2: game screen

Status: resolved

The owner approves this build in decision 124, items 5 to 7. The lane brief adds the replay states and the size checks.

Use the top line, board, two-record scroll, text, hand and finish row in that order. In the rail, keep the board at the left. Remove the Effects opener. Use one button for Undo and Replay. Keep the old save format.

## Work

- WebKit reproduces the name fault at 430x932 and 390x844 with Focused, March and four cards. Its name box is 35.5 px wide and 81 px high in a 72 px header. The group does not grow. The name can break at any letter.
- Give the group the free width. Put the name and level in separate single-line boxes with ellipsis.
- Move the board above the scroll and reader. Keep two records in the paper scroll. Keep the full list and the ink wipe.
- Reuse the board replay controller. Reduce Motion restores the last-turn square shadows. The save does not change.
- At 360x640: top 44, clearance 12, board 352, scroll 44, text 64, hand 72, finish 52 px. Total 640 px. Squares are 44 px.

## Checks

- Full `npm test`: 7,336 tests pass; 387 existing tests skip. The 114 rendering tests pass. No failure.
- Focused `npm test`: 51 tests pass in layout, history, replay, reading-b and menus.
- `npm run test:docs`: 197 tests pass; one existing test skips. Type check and build pass.
- The six sizes pass in Chromium and WebKit: 54 cases and 940 assertions. The older repair check passes 24 cases. The stale-save check passes all four game types at 360x640 and 844x390 in both browsers.
- The built site passes 12 history and reduced Replay cases. The lead's four-games script passes 144 checks with no failure or changed script.
- Static reviews find four faults: short choices, Manual warnings, online name updates and the long stale-save warning. The repairs keep each required line and 44 px action in view. Browser checks verify them.
- The old checks use the new order and no Effects opener. The commit messages give a Removed-check reason for each removed assertion.
- No physical phone check. No push, pull request or deploy. No change is required in another lane.
