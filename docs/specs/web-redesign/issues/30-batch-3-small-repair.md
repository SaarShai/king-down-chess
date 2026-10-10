# Batch 3 small repair

Status: resolved

Decision: decided by delegation (2026-10-09).

## Plan and checks

1. Check the report claims in code and final4 renders.
2. Fix phone Menu height and overflow. Check the sheet against each page's content. Check desktop placement.
3. Test Previously at its existing public interface before each logic change. Use player names, correct articles, short sentences and full take details.
4. Add a long turn that hides whole rows at 320 by 568. Check the height limit and visible glyph bounds.
5. Move bite badges to the corner. Correct tickets 05, 10 and 29. Clear the W9 sample pointer.
6. Run npm test, typecheck, all browser checks and both plugin checks. Record plugin bytes.
7. Build and render W1 to W12 in final5. Extract video frames at 2 fps. Compare every still with final4. Inspect Menu pages, bites and W11.
8. Commit each topic and push with the test hook.

Pass criteria: items 1 to 7 pass; all tests and checks pass; each sample report has zero faults; every changed still has an item; the push succeeds. Workshop paths stay fixed.

## Evidence

The first code and render check confirms the fixed phone height, blank Resign area, missing scroll cue, two-line long turn and bite overlap. The text forms match the report claims. No claim is rejected at this stage.

The requested renewed-mark sentence has nine words with Previously. The exact requested sentence stays; its test permits nine words for that one form. All other new summaries keep the eight-word cap.

The phone height guard rejects both auto and fixed height. The first auto probe gives the same bounds under the repaired bottom anchor, so the guard also checks the declared content height. A fixed-height probe fails the whole-sheet content bound.

## Answer

All seven repairs are checked in code and samples. The verification report claims are correct. The brief's exact renewed-mark form has nine words with Previously, so that exact form is the one word-count exception. No other new summary exceeds eight words.

| Item | Change and evidence |
| --- | --- |
| 1 | Phone pages use content height and keep the screen bottom. The head moves with the page. Short Tricks views end between rows and show a shade. Menu checks cover all pages at 320 by 568, 390 by 844 and 844 by 390, plus desktop placement. Both auto and fixed-height probes fail the new guard. A generated-content assertion also fails before the missing shade content is repaired. |
| 2 | A shared article helper handles archer and ogre. Sacrifice uses traded. Rescue and Growth use the requested plain sentences. Power and card names use player words. Tests first fail, then pass. |
| 3 | Stationary Archer takes keep Rage and Haste. Reaver takes name a separate landing square. Both tests first fail, then pass. |
| 4 | W11 adds a legal Haste turn with two Beast chains. Its full text needs at least four lines. The short phone hides the whole detail row and keeps full summary glyphs above Moves. Removing fitPreviously or the height limit fails the browser check. |
| 5 | Phone badges use radius 7 CSS px and move 2 CSS px toward the corner. W4 two-bite and four-bite crops clear the boots against final3 and final4. Digits retain their bold size. |
| 6 | Ticket 10 limits lift removal to short portrait phones and records removal of the armed outer gold glow. Its armed ring note now says inset. Ticket 29 lists all three missing prior changes. |
| 7 | W9 moves the pointer to 0, 0 after each Guide click. Three desktop shelf stills lose the Ogre hover wash. |

The final shade check catches an omitted pseudo-element content property. The property is added, and the browser check now requires generated content as well as display. The source is rebuilt, all samples are captured again, and the full suite runs again.

The repairs stay in the existing text, canvas mark and Menu paths. They add no dependency, rule, saved field or new product path. The plugin keeps its old default drawing branch. No Workshop source or W12 sample source changes.

Commit 7246c2b includes the text and badge files together after an index lock stops the text commit. The history stays intact. Each later commit checks its staged file list.

## Verification

- npm test: Test Files 95 passed, 1 skipped (96). Tests 1733 passed, 13 skipped (1746). Scene tests: 50 pass, 0 fail.
- npm run typecheck: pass. The build also passes.
- npm run check:browser: all 25 passed on the complete rerun. The first run stops after a known failed painted-game probe: its random reply takes the d2 pawn before the probe tries d2-d3. The same source passes painted-game on the full rerun. No unrelated check or game code changes.
- npm run check:browser plugin-ui plugin-ui-http: all 2 passed. plugin-ui: 14.7 s. plugin-ui-http: 15.1 s.
- Plugin page: 4,296,055 bytes before; 4,296,101 after, 46 bytes more.
- Mutation checks: auto height, fixed height, no fitPreviously and no short-phone max-height all fail as intended.
- git diff --check against 1b872be: pass. Workshop and W12 source diff: empty.
- Preview PIDs 62303, 26564 and 49270 are stopped.

## Renders and comparison

All reports show zero faults. Total: 279 renders; 277 stills, two videos and 31 frames extracted at 2 fps.

| Unit | Renders | Faults | Frames |
| --- | ---: | ---: | ---: |
| W1 | 14 | 0 | 0 |
| W2 | 68 | 0 | 0 |
| W3 | 27 | 0 | 0 |
| W4 | 48 | 0 | 0 |
| W5 | 14 | 0 | 0 |
| W6 | 16 | 0 | 31 |
| W7 | 24 | 0 | 0 |
| W8 | 10 | 0 | 0 |
| W9 | 8 | 0 | 0 |
| W10 | 8 | 0 | 0 |
| W11 | 18 | 0 | 0 |
| W12 | 24 | 0 | 0 |

Every final4 still has a final5 peer. Three new stills show the long Haste turn. The decoded RGB diff uses a channel delta above 8, about 3 percent. Its 308 PNG records include all stills and both sets of extracted frames. The report lists 24 changed or new product stills and 52 capture differences. Each record has an item. Capture differences under item 9 are figure-edge raster pixels, motion phase or video timing, with no changed product path. Before and after pairs confirm the same words, marks, geometry, controls and final board. All old video frames have a new peer.

Every W2 and W10 Menu page is inspected at every size. W4 bite crops are inspected against final3 and final4. All W11 stills and all 31 video frames are inspected.

Renders: `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/f713c296-a557-4c06-99e1-90ecc1f52371/scratchpad/build/samples/final5/`.

Each changed file and its item: `b3-fix4-render-comparison.md` and `b3-fix4-render-comparison.json` in the same scratchpad root. Raw pixel records: `b3-fix4-pixel-diff.json`.

Logs: `/private/tmp/b3-fix4-tests-shade-final.log`, `/private/tmp/b3-fix4-browser-shade-final.log`, `/private/tmp/b3-fix4-plugin-shade-final.log`, and the per-unit `/private/tmp/b3-fix4-capture-W*.log` files.

The final RESULT records the pushed head. The normal push runs the test hook.
