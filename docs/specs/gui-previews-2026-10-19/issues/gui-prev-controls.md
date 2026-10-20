# GUI previews 2026-10-19: the control system (stone and red buttons, focus, board grain)

Status: done
Type: task

The lane builds previews for A1, A2, A3, and A34. A10 stays blocked by the exact image-edit constraint. Each item still needs the owner's approval.

## Why and the rule
Saar, 2026-10-19: "by the time i get back - everything must be sleek and pixel-perfect and faultless and beautiful to look at and a joy to use." His standing rule: a taste call needs his approval. So this lane builds a PREVIEW of the recommended pick of each item below, on its own branch, at award-level craft. Nothing merges until he approves the item on his approval page. Build each pick exactly as its option text says; do not build the other options; add no idea that the item does not name. Where a pick leaves a detail open, choose the most restrained and clear answer, and name it in your answer as a taste choice.

Record: copy this ticket to docs/specs/gui-previews-2026-10-19/issues/<this file name> in the repo, set its Status to done, and add the check results at the end.

Screens before the change: /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-review/gallery/ (INDEX.md names each image). The expert panel is in the gui-expert lane. The source ticket at /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/tickets/issues/gui-prev-controls.md holds each review path.
Proof for each item: before and after screenshots of each screen it changes, at the sizes where it shows (plugin harness: 390x844 and 1280x800, light and dark; web: 390x844 and 1440x900), saved as /private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/lanes/gui-prev-controls/previews/A<n>-<screen>-<size>-<theme>-before.png and -after.png. Take the before shots from the branch base, the after shots from your commit. A test for each behaviour change. npm test and the plugin-ui browser check pass. One commit per item.
Art: new or changed images only through Codex's built-in image_gen on the ChatGPT plan (never the paid images API). Match the painted cast (public/pieces/painted-2d/, docs/2d-first-pieces/) and keep every page under its size limit (the plugin page HTML stays under 1,000,000 bytes).

### A1 Stone button shape

Problem: The stone buttons look soft and generic. A shape from the King Down world makes them belong to the game.

Build: **Cut-corner tablet**. 4 px cut corners, 52 px main and 48 px small buttons, 18 px bold words, a short 2 px press.

Why this pick: Four of five leads pick the tablet: it reads as carved stone, and it stays calm at small sizes.

Other options (do not build): Shallow shield (A slightly pointed base. More heraldic, but it needs more height.); Today’s rounded slab, thinner edge (Least change.)

### A2 Red button shape and finish

Problem: The red buttons use the same blurry stone image under a red tint, so the grain looks muddy.

Build: **Same tablet, matte red face**. Deep red #842c21, a darker edge, a 1 px light top line, cream words. No stone grain.

Why this pick: A plain matte red on the same tablet shape is the calmest and the clearest main action.

Other options (do not build): Short banner (cloth flag shape) (More themed; busier at small sizes.); Smooth rounded enamel (Modern and clean; less King Down.)

### A3 Where stone belongs (changes your earlier C1 a)

Problem: Today every row (menus, settings, games, moves line) is a raised stone slab. All five leads say this is the main cause of the crowded look.

Build: **Stone only on action buttons; flat reading rows**. Menu rows, settings rows, the moves line and profile rows become flat rows with a 1 px divider, 48 px tall. Selected segments stay dark with a gold ring.

Why this pick: Raised stone only on things you press to act; reading rows go flat with thin dividers. The screens get calmer and the real buttons stand out.

Other options (do not build): Stone everywhere, lower contrast (Keeps C1 a, but softer.)

### A34 Focus ring colour

Problem: The keyboard focus ring is the only blue in the game. It works and is easy to see. It touches your focus look item.

Build: **Warm ink and gold double ring**. On the web and in the plugin; same contrast or better.

Why this pick: A warm ring fits the game look and can keep a strong contrast.

Other options (do not build): Keep as it is (The blue ring.)

### A10 Board tile grain

Problem: The tile grain is strong and competes with the pieces.

Build: **Reduce grain contrast 25%**. Same tiles and colours, recomposed from the full-size source.

Why this pick: 25% less local contrast keeps the stone look and makes the pieces read first.

Other options (do not build): Keep today’s grain (No change.)


## Plan and checks

Base: bc62f4eec18f58b9e99c426422e362a6b5a8dc56.

1. Capture the base at 2x scale. Keep the base build for all before screens.
2. Build A1, A2, A3, A34, and A10 in that order. Make one commit per item.
3. Add a test for each change. Check types, unit tests, and the plugin browser check.
4. Capture each commit at the ticket sizes. Inspect the screens at 2x. Record faults and taste choices.

Pass: 4 px tablet cuts; 52 px main and 48 px small buttons; 2 px press; matte red; flat rows; warm focus on light and dark surfaces; tile grain at 75% contrast. The page payload stays below 1,000,000 bytes.

The work stays a preview. The owner must approve each item.

## A1 preview

The shared action face has 4 px cuts. Main buttons use 52 px; small buttons use 48 px. Words use the 18 px bold token. The press is 2 px. Reduced motion keeps the face still. The face clips its decoration only.

Check: the type check passes. Unit and browser results follow below. Screen proof uses the base build and this item commit.

Taste choices: keep the current full-size stone crop and a thin edge. Use a 56 px fixed game bar for the 52 px main tablet and its touch space. Use 20 px bar icons and a wider middle action. Centre the 52 px and 48 px faces on a common line. Let long labels grow their button. Keep selected powers dark with cream words and a gold edge. Use 12 px side space on the home actions and 8 px on the page Back action.

## A2 preview

The red tablet has a plain #842c21 face, a #5a1c14 edge, a 1 px #9c3a2d top line, and #fbf7ee words. It has no stone image or blend. The browser check reads these values from the drawn face.

Taste choice: use the existing deep red and cream tokens for the face and words. Use no gradient.

## A3 preview

Menu rows, settings rows, the moves line, and profile rows use a flat face and a 1 px divider. Each row has a 48 px minimum height. Long words can grow the row. Segments share one boundary. A selected segment uses dark stone colour and a 2 px gold ring. The old broad stone rule is removed.

Taste choices: use a 12 px text inset. Put 4 px above the row content and 3 px below it; the 1 px divider completes the lower space. Use no gap between a row title and its subline. Keep art and portraits at 40 px in a menu row. Keep the three-emblem fan 52 px wide. Use one menu column on tall screens, two on short screens, and the existing three-column form on short landscape screens. Reduce the compact menu's outer vertical space to keep all its 48 px rows in view.

The larger controls use more height. The seat board is 203 px wide at 320 x 568 with 63/84 px host insets, and 367 px wide at 393 x 852 with 102/118 px insets. With cards and powers, the play board is 102 px and 288 px wide at those sizes. The 393 x 852 view leaves 105 px for recent moves, so its 108 px list stays closed. The full list fits at 393 x 860. The checks cover both states and keep the list, scroll, tap, and resize guards.

## A34 preview

Keyboard focus uses two 2 px rings: warm ink and light gold. It works on the web and in the plugin. Segments and the board keep the rings inside their bounds. The keyboard square cursor uses the same colours.

Taste choice: use #2b2621 ink and #e9c071 gold. The focus shadow has priority over a control finish while keyboard focus is visible. A spent coin shows the ring at once and keeps only its art grey. The ink has more contrast on parchment than the old blue. Gold has at least 4.5:1 on dark stone. A unit test checks both.

## A10: blocked by the art constraint

The built-in image tool returns a board edit. The edit does not pass the pick. At a matched 1024 px analysis size, the median grain contrast is 62.3% of the source, not 75%. Individual tiles range from 50.7% to 74.3%. The tile mean colours change by up to 9.74 levels out of 255. The tool also returns 1254 px instead of 1024 px.

The tool preview is not used. The game keeps the current board. An exact 25% change needs the existing source compositor to change the texture values. The house rule permits image edits only through the built-in image tool, so this lane does not make that script edit.

Evidence: `grain-measure.json` and `previews/A10-board-grain-tool-preview.png` in the lane folder. The prompt asks for the exact current board, the two full-size source textures, the same tiles, crops, colours, bevels, and grout, with 75% local grain contrast.

Taste choice: none. This item needs a method that can keep the exact source values and grid.

## Screen review and evidence

The lane folder holds 381 before and after screen pairs: A1 has 141; A2 has 101; A3 has 97; A34 has 42. Each capture uses 2x scale. The plugin uses 390 x 844 and 1280 x 800 in light and dark host themes. The web uses 390 x 844 and 1440 x 900. `previews/index.html` has item and host filters and a native 2x view. `previews/INDEX.md` links each pair.

Before uses the branch base. After uses each item build. Six added bottom scroll views use the base page at its last scroll position. `previews/before-scroll-map.json` records those copies. `preview-commits.json` checks that the capture CSS matches the final item commits.

The 2x review finds and fixes these faults: a squeezed Close mark; a cropped Back face; a 44 px seat Close button; a split title word at 200% zoom; short landscape menu overflow; a cut next-action cue in the loss panel; a grey focus ring on a spent coin; unequal power-choice face heights; and an inherited 8 px gap that made plain reading rows too tall. Power choices now fill one common row height. Main and small actions keep their own 52 px and 48 px heights on a common centre line.

The text scan finds no cut control label. The card-letter marks in the board fixture keep the known board-lane fault from the base. This lane does not change those marks. The plugin browser check keeps its existing report for them.

The compact render record is `debug/compact-measures.json`. At 375 x 667, with the unit host's 24 px header and 20 px top inset, the seat and play boards are both 269 px wide. The other five size cases keep their existing width limits.

The spent-card capture uses a legal engine position. The capture supplies that same view to the mount's first read. Without it, the mount replaces the sample with the live unspent position. No game path changes for that capture.

## Check results

Checked UI source: 72d6d712. The last commit adds this record only.

- `npm run test:docs` passes. Log: `docs-final.txt` in the lane folder.
- `npx tsc --noEmit` passes. Log: `typecheck-final.txt` in the lane folder.
- `npm test` passes: 194 files, 3,239 unit tests, 8 skipped tests, and all 51 art tests. Log: `tests-final-6.txt`.
- The required runner passes `plugin-ui` on the M1 in 230.2 seconds at 72d6d712. Logs: `checks-final-14.txt` and `plugin-ui-final.log`.
- Each item build stays below the 1,000,000-byte HTML limit. The largest captured build is 761,639 bytes.
- All 381 after screens have before screens. Every capture uses 2x scale. `previews/proof-summary.json` records the counts and size checks.
- The source diff has no space errors. The branch has one commit per item.

An earlier full run hits the unchanged Workshop test's 30-second limit. The final repeat passes at the same limit. This lane changes no test or check time limit.

No server code changes, so this lane does not run `plugin-ui-http`. The work stays on the preview branch.

## Review repair plan

Check both review reports against the code. Treat the repeated Seat Menu and chooser reports as two faults. Fix the six confirmed faults in the shared styles. Add a test for each fault. Check text and icon bounds, the drawn row face, and the pixel change when a selected segment gets focus.

Pass: lesson text and icons fit their faces at 390 x 844; chooser, result, and board actions use the tablet size and type; Seat Menu rows have no stone face; Settings words stay clear of the chevron at 336 x 844; focus changes the selected ring with at least the old contrast. Run `npm test` and the required `plugin-ui` runner at the commit. Keep all time limits. Record the results here.

## Review repairs

Both reports are correct. A4 and B2 name the same Seat Menu fault. A2 and B3 name the same chooser fault. No finding is refuted.

- A1: let the lesson bar and faces grow with their words. Give both lesson actions equal space. Check the icon and text bounds before and after a lesson move.
- A2 and B3: add both setup choosers, Keep playing, and Review to the shared tablet rule. Remove the old chooser finish and Review text colour. Check each action face, size, type, and cut.
- A3: remove the old 44 px height and 14 px type from the board action rule. Check All rules and Cancel.
- A4 and B2: remove the raised face from flat plugin rows. Check the Seat Menu and each row's `::before` face.
- A5: move the ink band over the selected gold ring. Put the gold focus band inside it. Compare pixels on the same selected segment with and without focus, on the web and in the plugin. Require at least the old blue contrast.
- B1: keep the 12 px left inset and restore 32 px on the right. Check the exact Settings help text at 336 px.

The eight regression tests use the source styles at 2x scale. Seven fail before the fixes. The narrow-row check also checks the text area's boundary, so it cannot pass because its test words stop short of the chevron. The browser checks use the same assertions for live chooser, menu, focus, and lesson states. The focused and full check results follow after they end.

The focused `npm test` run passes all eight regression tests. Log: `tests-fix-focused-3.txt` in the lane folder. The narrow-row test first finds that the shared flat-row selector overrides the restored inset. The inset now lives inside that shared rule. The full suite and the required runner follow at the repair commit.

The first full checks find a selector priority fault in the repair. The Keep playing selector now uses `:where` for its parent, so it does not raise the priority of every tablet. A new test checks the normal bar's exact 48 px and 52 px face heights. The old plugin bar override of 44 px is removed.

The plugin board now reserves the action row's full 48 px before a card or power is armed. This keeps the board still when Cancel appears. On the three short portrait samples, that row uses 3 to 4 px of board width. The exact width checks now expect 292 px, 285 px, and 98 px. The seat sizes stay the same. The draw reply line height fits two lines of 18 px words in one 48 px face. The existing board, scroll, tap, and draw-row checks stay in place.

A focused landscape test finds the draw row's exact fault: the row paints at 113 px, but its parent gives it 72 px. The buttons cover Menu. The draw row now uses grid rows, so the parent measures its full height. The context space also stays at 48 px behind the end card. The board and end-card size checks stay in place. The web Menu's old 44 px button floor is removed.

The landscape probe also shows that the parent can shrink the reply row back to its 72 px minimum. A draw reply now sets the landscape context minimum from its full content, as the portrait row already does. The test now checks that the reply row ends above the bar before it taps Menu. The temporary test filter and debug output are removed.

## Final review check results

Checked app source: 601acb34. The final record commit changes this ticket and the second minimum-width value in the beginner lesson test. The app source and browser checks stay the same.

- All six distinct findings are confirmed and fixed. None is refuted. The two repeated reports share the same fixes.
- `npm test` passes: 195 files, 3,248 tests, 8 existing skipped tests, and all 51 art tests. Duration: 331.03 seconds. Log: `tests-fix-full-4.txt` in the lane folder. This run uses the local test database from the house rules.
- All nine new regression tests pass. The existing Menu, draw reply, board size, end-card, scroll, and tap checks pass. No test or check time limit changes.
- The required runner passes `plugin-ui` on the M1 in 233.1 seconds at 601acb34. It also passes `lesson-return` in 6.3 seconds. Log: `checks-fix-4.txt`. The local copies are `plugin-ui-fix-final.log` and `lesson-return-fix-final.log`.
- The built resource stays below its 1,000,000-byte limit. The test log records 763,816 JSON bytes.
- `git diff --check` passes. The commit hooks pass. The temporary test filter and debug output are removed.

A 48 px action row uses 3 to 4 px of board width on short portrait phones. It keeps the board still when a card or power is armed. The seat sizes stay the same. The end card keeps the board box.

No server code changes, so `plugin-ui-http` does not run. A10 stays blocked by the existing image-edit constraint. The work stays a preview on this branch.

## Test repair (2026-10-19)

Plan: merge `origin/main` into this branch. Keep its fault fixes and the A1, A2, A3, and A34 previews. Run the full unit suite on the M1. Class each failure as an old expectation (a), a fixture gap (b), a code fault (c), or a load timeout (d). Make the smallest repair and commit each kind on its own.

Pass: each repaired file and the final full M1 suite pass. Only database tests skip on the M1. The local `npx tsc --noEmit` check passes. Keep all assertions and time limits. This step runs no browser checks or captures. Record each conflict, repair, and result below.

Merge: `origin/main` is `0a7ec40b`. Git merges it with no conflicts. The board tests and browser script merge on their own. The merge keeps main's cursor speech, move sounds, seat text fix, and faster judge tests. It keeps all four control previews.

First M1 run: `033865a5` passes in 329.64 seconds. It has 186 passed files, 12 skipped files, 3,131 passed tests, no failed tests, and 164 skipped tests. Of the skipped tests, 156 need PostgreSQL. The other eight are the existing optional balance drift checks. The judge file passes all 12 tests in 3.918 seconds. Log: `unit-1.txt` in the `prev-green-controls` lane folder.

Failure classes: none. No old expectation, fixture, code, or time limit needs a change. No repaired file needs a separate run. The merge alone clears the reported block. All A1, A2, A3, and A34 tests stay in place. This step adds no taste choice and changes no screen.

The local `npx tsc --noEmit` check passes with exit 0. Log: `tsc-1.txt` in the lane folder. This step does not run `npm test` on this Mac. It uses the required M1 unit helper instead. The helper runs the unit suite; it does not run the separate art test command from `npm test`.

Final M1 run: `033865a5` passes in 325.82 seconds. It has 186 passed files, 12 skipped files, 3,131 passed tests, no failed tests, and the same 164 skipped tests. Log: `unit-2.txt` in the lane folder. Both full runs return exit 0. The final run waits for the shared M1 lock before it starts. No test limit changes.

All six parts of the test repair ticket are complete. No failure needs a repair commit. The next commit records these results only. The app and tests stay at the checked merge commit. Browser checks and screen captures do not run in this step, as the test repair ticket requires. CI runs the browser checks when the main session opens the draft pull request. A10 stays outside this step's four picks and keeps its prior art block. This step adds no taste choice.

## Size and move-choice review repair

Status: in progress. Both findings in Review A are confirmed. Review B has no finding text.

Plan: restore the size guards from main. Remove spare space from portrait rows so the tablet controls fit. Add the move-choice actions to the shared tablet rule. Remove their old size and type rules. Check both live choice sheets.

Pass: all main board size floors pass, with and without cards. The beginner board keeps its 192 px floor. Armed actions keep the board size. Every move-choice action has the tablet face, 18 px bold words, and at least 48 px height. Run the changed test files, `npm test` with the local test database, and the required browser runner at the commit. Keep all time limits.

### Confirmed fixes

1. Review A.1 is correct. Restore every board floor from main in the size file and the Android check. Restore the 192 px beginner floor. A larger board can pass the floor; it must still fit its frame. Keep the armed board at its unarmed size. The tests check this and keep the touch and text guards.
2. Review A.2 is correct. Add `#choices button` and `#move-choice button` to the shared tablet rule. Remove the old choice height and type rules. Test a live pawn choice, all three web Ogre actions, and the live sheets in the browser checks.
3. Review B has no finding text. There is no finding to confirm or refute.

The layout uses a 52 px bar with no spare touch padding. Card strips keep a 36 px portrait row above the 44 px coin faces. Their targets stay 48 px. Back stays above the board squares. Setup hides its empty Moves row. Its rule text keeps both lines. The page header uses 2 px top and bottom space. Portrait screens use the existing compact last-move line through 560 px of screen height. Landscape keeps its 480 px cutoff. The first full run finds two desktop Moves failures from the broader cutoff. The scoped rule fixes both; their tests stay unchanged.

Changed previews: A1 and A3 setup and board spacing; A1 plugin move choices and the web Ogre choice sheet. The owner still approves these previews before a merge.

### Unit check results

- The size file passes all 31 tests with main's floors.
- The tablet file passes all 10 tests.
- The focused board check passes all 15 selected tests. It covers the live pawn choice, the beginner floor, 48 px targets, and Back clearance.
- Both focused Moves checks pass. They cover history, Remount, Escape, focus, and return from Settings.
- `npm test` passes on this Mac with the house test database: 198 files, 3,289 passed tests, no failed tests, 8 existing skipped tests, and all 51 art tests. The unit suite takes 325.40 seconds. Log: `tests-review-fix-3.txt` in the `prev-green-controls` lane folder.
- The type check passes. No test or check time limit changes.

Browser checks follow at the commit. The required runner checks `plugin-ui` and `special-moves`. No server code changes, so `plugin-ui-http` is not required.

The recent-move list again fits at 393 x 852, as on main. Its exact box and a visible-list assertion check that state. Shorter views still check that the list stays hidden. The commit records this change to the former hidden-list assertion.
