# Workshop phone card words (F-037, F-104)

Status: resolved on branch `staging/lane-workshop` (started from `staging/first-game` `2f70eab2`, rebased on `02adf61c`); not merged, not deployed.

## What

Two faults from the four-player staging playtest. Both show on the narrow Workshop layout only.

- **F-037 (S3).** At 390 × 844 with touch, the rule card of a stamped "Also moves like another piece" rule keeps the old piece in its italic line. The pill, the seal and the board change to a rook or a bishop, but the line still says "On a center square, it also moves like a queen." The wide layout has no rule card.
- **F-104 (S4).** With a LAB card open, the narrow layout drops the card's words that the wide layout shows: the effect and its turn ("As your move, freeze an enemy piece (not the king): it cannot move on its next turn."), "Test deck. Not in the game.", the king of a power card, the second form, and what to do or why there is no pick ("Freeze has no target on this board.").

## Why

The phone must show the same rule and the same card facts as the desktop. A card that names the wrong piece teaches the wrong rule.

## Scope

- `src/workshop/ground.ts`, `src/workshop/ground.css`: the fixes.
- `tools/verify-workshop.mjs`: the new assertions (groups `removeRule` and `labCards`). No old assertion changes.
- `docs/WORKSHOP.md`: the narrow layout and the Cards (LAB) lines.
- This ticket. No file of another lane.

## Acceptance

- At 390 × 844 with touch: the rule card's line follows each pill choice (queen, rook, bishop). The wide layout has no rule card and its line shows the choice.
- At 390 × 844 with touch: the row under the board says what to do, or why the card has no pick. Details opens the effect, its turn, the LAB note and the king. Esc gives the focus back to Details, or to the Workshop title after a turn to the wide layout. The king's coin closes Details and opens the king.
- The row fits 320 × 568, 768 × 1024 and 844 × 390. The wide layout keeps its words in the column and has no Details.
- `npm run check:browser workshop` fails before each fix and passes after both.

## Result

### F-037: cause and fix

The rule card (`renderShelf` in `ground.ts`) printed `b.example`, the fixed rule-book example of the block. That example tells of the block's default rule: "moves like" defaults to a queen on a center square. The card shows a live rule that a pill or a When choice changes, so the example and the rule can disagree. The fault is in each block with a pill or a When: for example, "It trades squares with a friend." stays after a change to "an enemy", and "It cannot take a king." stays after a change to "pawns".

The card now prints `ruleText(r)`, the rule's whole sentence. The seal's accessible name already uses this sentence, so the card, the seal and the board agree. The shelf's sentence card before Stamp keeps the example, because there the rule is the block's default.

### F-104: cause and fix

`renderRight` wrote nothing into the brush row on the narrow layout when a card was open. The LAB note, the king, the second form and the status line were in the right column only.

Now, on the narrow layout:

- The brush row shows the status line (the same words as the desktop: "Tap a blue ring on the board.", "Freeze has no target on this board.", "Lay it from the card slot.", and so on) and a 44 px Details button.
- Details opens a sheet (the Workshop's `sheet()`), titled with the card's name: the card's words (its effect and its turn), then `cardInfo()`, the same LAB note, king and second form as the desktop column. The new `cardInfo()` makes both layouts use one source.
- The king's coin in the sheet closes the sheet and opens the king. The focus then goes to the Kings tab (in short landscape to Pieces, because the tab is in the closed ledge sheet). Before, the desktop coin left the focus on nothing; it now goes to the Kings tab too.
- A turn to the wide layout while Details is open (for example a tablet turned from 768 to 1024 px) removes the Details button. Esc then left the focus on `<body>`, outside the Workshop. `sheet()` now gives the focus to the Workshop title (`#pg-h`, the fallback of `focusRule` and `choose`) when the opener and its copy are gone and no control in the Workshop has the focus. A caller that moved the focus itself keeps it. This applies to each Workshop sheet.

The board keeps its height. The phone shows the facts with one tap, which is the audit's "detail disclosure".

### Evidence

Runs on this branch, in this order (`npm run check:browser workshop`):

1. Before the fixes: `FAIL workshop 52.2 s AssertionError: the card says the rule: a queen`, actual `'On a center square, it also moves like a queen.'`, expected `'On a center square, it also moves and takes like a queen.'` (`removeRule`, the phone, real taps).
2. With the F-037 fix only: `removeRule` passes; `FAIL workshop 135.2 s locator.textContent: Timeout`, waiting for `.pg-brushes .info-p` (`labCards`, the phone): the row has no words.
3. With both fixes: `ok workshop 158.7 s`, "workshop: all groups pass".
4. After the focus fix for short landscape (the first version of the branch): `ok workshop 156.2 s`.
5. The review's resize case (below), test only: `FAIL workshop 108.7 s AssertionError: a turn to the wide layout under Details: Esc gives the focus to the title`, focus `false`. A probe on the dev server shows the cause: after Esc the focus is on `BODY`, outside `#workshop`. With the `sheet()` fix the same probe shows `H2#pg-h`.
6. With the `sheet()` fix, a first run failed the same assertion: the test read the focus before the sheet's `close` event, which is a later task. The test now waits until the sheet leaves the page. Then: `ok workshop 156.2 s`, "workshop: all groups pass".
7. The integration run found the same assertion failing 3 of 3 on `8a9a7d0f` (actual `[0, false, 'Test deck. Not in the game.']`). Cause: a race in the check, not in the product. `setViewportSize` returns before the page gets the layout change: the media query's `change` event comes in a later task. A probe with a log of each dialog event (8 runs, the same steps) shows the bad order in run 6: `keydown` Esc, `cancel`, then `media-change`, then the sheet's `close` event. So Esc closes the sheet under the narrow layout, and the browser gives the focus back to Details. The layout change then removes Details while it has the focus. At the `close` event a Workshop button has the focus, so `sheet()` correctly keeps it. The check meant the other order: the layout change first, then Esc. The check now waits until Details leaves the page (the end state of the layout change), then presses Esc. No fixed wait. With that wait, the probe gives the focus to `#pg-h` in 6 of 6 runs.
8. On `107f7927` (the check fix, merged with `staging/first-game` `cc0b3ecd`): `KINGDOWN_TEST_FILE='{src/workshop/*.test.ts,tools/checks.lint.test.ts}' npm test` 14 files, 163 tests pass; `npm run check:browser workshop` alone, 3 of 3: `ok workshop 128.2 s`, `127.5 s`, `132.0 s`.

Other checks after the fixes:

- `npm run check:browser workshop-cast visual-design menu-extra`: `ok workshop-cast 15.0 s`, `ok visual-design 38.4 s`. `menu-extra` failed once under the three parallel checks (39.1 s) at `tools/verify-menu-extra.mjs:185`: the wait for the Account sheet's overflow shade, before the Workshop opens. The Workshop code loads only when the Workshop opens. Alone it passes: `ok menu-extra 12.5 s`. This is a timing fault of that check under load, not of this change.
- `KINGDOWN_TEST_FILE='{src/workshop/*.test.ts,tools/checks.lint.test.ts}' npm test`: 14 files, 163 tests pass (with the type check). The same after the review fix.
- `npm run test:docs`: 13 files, 166 tests pass.
- `npx tsc --noEmit -p .`: no errors.

After the rebase on `02adf61c` (the CI fixes of PR #87 and the Earth Quake words):

- `npm run check:browser workshop workshop-cast visual-design menu-extra`: `ok workshop 205.8 s`, `ok workshop-cast 20.3 s`, `ok visual-design 53.4 s`, `FAIL menu-extra 41.8 s` at `tools/verify-menu-extra.mjs:185`.
- `menu-extra` alone on this branch: the same failure at line 185. On the unchanged base `02adf61c`, in a temporary worktree: the same failure at line 185, 2 of 2 runs. So the base has this fault; this branch does not add it. The step waits for the Account sheet's overflow shade (`#menu-sheet.has-overflow`), before the Workshop opens. This is outside the Workshop lane.
- `KINGDOWN_TEST_FILE='{src/workshop/*.test.ts,tools/checks.lint.test.ts}' npm test`: 14 files, 163 tests pass. `npm run test:docs`: 13 files, 166 tests pass. `npx tsc --noEmit -p .`: no errors.

Screenshots of run 3: `cards-390x844.png` (the row with "Tap a blue ring on the board." and Details) and `card-details-390x844.png` (the sheet). The grey box on the sheet's right in `card-details-390x844.png` is the browser's tap highlight of Details under the sheet. A probe proved it: the box is gone 1.5 s after the tap, and it does not show with `-webkit-tap-highlight-color: transparent`.

## Review

An independent review by a second agent (read only, code inspection) of the first version of the branch:

- Medium: after a turn to the wide layout under Details, Esc leaves the focus outside the Workshop. Fixed in `sheet()`, with a test (Evidence 5 and 6).
- No finding on the causes, the CSS specificity, the king view on the phone, short landscape, the test strength, or other fixed examples for a live rule. The other fixed examples (the shelf before Stamp, the Rules tab's seal view) tell of the default rule, which is correct there.

## Owner decisions

1. The rule card's italic line is now the rule's whole sentence, not the rule-book example. Other choices: no line, or the example only while the rule is the default. Pick: the whole sentence (it is always true, and the seal already says it).
2. On the phone the card's words are one tap away (Details), not in the row. Other choice: all the words under the board, which pushes the ledge down by about 150 px. Pick: Details.
3. The button word "Details".

## Follow-ups

- A layout change that removes a narrow-only control while it has the focus (Details, a plinth seal, the + seal) leaves the focus on no useful control. This is a general Workshop behaviour of the `narrow` change listener, older than this branch.
- `menu-extra` fails on `staging/first-game` `02adf61c` at `tools/verify-menu-extra.mjs:185` (the Account sheet's overflow shade). Another lane must look at it.
- The narrow layout drops an open king's power words the same way (`renderRight`, `kingOpen` on the phone). F-104 names the card view only, so this branch does not change it.
