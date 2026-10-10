# Batch 3 small repair

Status: claimed

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
