# UI review samples

Status: resolved
Type: prototype

## Scope

The owner asks for V1 to V10 as real UI samples on `staging/ui-samples`.
The base is `de2a724b`. The owner reviews the images before the build goes live.
Keep the painted art, stone, parchment, current fonts, and shared colours.
Do not push, rebase, deploy, sign in, or use an external site.

## Plan

1. Capture the base at each size and state in the request.
2. Change the UI code. Render both options where the review gives a choice.
3. Compare the images. Check contrast, text size, spacing, and the local paths.
4. Run the focused tests, the build, and the doc checks. Commit the sample.
5. Write the image list and report. Stop the preview by its PID.

## Pass conditions

- V1: every coordinate has contrast of at least 4.5:1.
- V2: Computer has one name. A friend opens the online setup path. Empty designs are hidden. The phone shows the army and both powers beside Start.
- V3: the first game has a read hint and a lesson link. Later games have no hint.
- V4: the suggested lesson and save note come before the shelf.
- V5: title piece names are at least 11 px at all three sizes.
- V6: notation lines have a measure of at most 80 characters.
- V7: piece text has more space between lines and fits the status area.
- V8: Board help has space before Close at 320 by 568.
- V9: the first lab card offers Load example and shows the test-deck note.
- V10: Moves grows above 48 px with text. Phone lesson text is 16 px. Normal and doubled text fit.
- All requested base and sample images exist. The report names limits and test results.

## Result

All ten items have base and sample images. V1, V2, and V8 also have an option B.
The owner still needs to choose the visual changes. This ticket approves no release.
The patches in `../options/` reproduce the other choices from this sample.

The chosen coordinate colours are ink `#2b2621` on parchment `#f3ead7`.
Their contrast is 12.53:1. The backing covers the stone under each label.
Title labels measure 11 px. Notation has at most 77 characters per line at both sizes.
Piece text has 19.6 px line spacing. The enlarged Moves row is 77.19 px high.
The Guide action and save note fit at 320 by 568. Board help keeps its gap.
The first-game lesson action works. A later game has no read hint.
Load example gives Freeze a target. The test-deck note stays in view.

## Checks

- `npm run build`: pass for the base, the chosen sample, and option B.
- Focused `npm test`: 263 checks pass in 12 source and helper files. The filters select New game, context text, table, Guide, lesson shelf, routes, browser runtime, setup model, Workshop, board ink, and the UI helper.
- Opponent text checks: 11 selected checks pass across six files. The names match F-113, F-114, checked flat choices, source symbols, coins in the frame, a failed start, and Retry of a lost Choose reply. The corrected F-114 check passes on its final run.
- The same test command also runs the 67 painted-board checks. They pass.
- Browser-runner checks: 91 focused checks pass in four files.
- `npm run check:browser new-game`: pass.
- `npm run check:browser ui-review-samples`: pass at all five sizes. It checks the real controls and the text bounds, including doubled text and Load example.
- `npm run test:docs`: 180 checks pass in 15 files.
- The static detector reports three runtime image slots, three existing motion curves, and one source type rule. The browser captures have no page errors or failed image decode.

## Limits

The local friend route shows that account play is unavailable. No sign-in occurs.
The friend route and its return path have focused tests. No live account flow runs.
At doubled text on 320 by 568, the lesson board is small. Its text and controls fit.
The full test suite, physical phones, and screen-reader speech do not run.
