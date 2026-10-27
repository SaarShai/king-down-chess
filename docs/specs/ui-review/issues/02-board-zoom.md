# Board at strong zoom

Status: resolved

## Finding

Review 2, F1: At 320×200 CSS px, the 340 px side panel leaves no board. Hidden page overflow hides End turn and Menu.

## Plan and checks

1. Add a browser check at 320×200 and the five normal sizes. Save the board and action bar before the fix.
2. Show that the check fails. Use one column with page scroll when the side panel and board cannot fit.
3. Check the board size, wheel scroll, and action access. Run focused tests, docs checks, and the layout and game screen checks. Compare the images. Commit this fix.

The board must stay at least 280 px wide. Page scroll must reach End turn and Menu. The five normal sizes must stay the same.

## Fix and proof

- The landscape side panel needs at least 600 px of width. Below that width, short screens use the column layout, a full board row, and page scroll.
- Red: `npm run check:browser layout-zoom` fails. At 320×200, the canvas width is zero and the page has no scroll.
- Green: `KINGDOWN_TEST_FILE='src/context-line.test.ts' npm test` passes 23 cases. `npm run test:docs` passes 180 cases. `npm run check:browser layout-zoom game-screen` passes both checks.
- The 320×200 board has a 311 px canvas. Wheel scroll reaches both actions. Menu opens and closes.
- All five normal board images have zero changed pixels. Their measured positions also match.
- The browser fixture includes a full FEN. This keeps the army fixed for image checks. No UI text or selector changes.
