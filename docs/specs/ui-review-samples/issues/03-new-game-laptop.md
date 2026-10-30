# New game at laptop sizes

Status: ready-for-review

The New game dialog has clipped choices at 1024 by 768 after PR #154.

## Plan and checks

1. Add 1024 by 768 and 1366 by 768 to the sample check. Check the width and text of the New game choices. Record a failure before the fix.
2. Fix the layout at its cause. Keep the approved choices and summary.
3. Run the New game browser checks, the full test suite, and the build. Record the results before the PR.

## Cause and red check

The exit transition keeps the dialog visible after it removes `open`. The column rule also needs `open`, so the visible dialog falls back to a row until the transition ends. This can show the narrow three-column layout in the screenshot. A fresh, open dialog stays in one column.

At 1024 by 768, with a saved game and normal motion, the new check fails on the base: `New game stays in one column during exit`. Chromium reports `row` after close. Keep the column direction while the exit is visible.

## Results

- `npm run check:browser ui-review-samples new-game`: pass. The sample check covers 1024 by 768 and 1366 by 768 at device scale 2, with a saved game and normal motion. It checks the open and closing dialog. It writes captures; it does not compare approved images.
- `npm test`: 286 test files pass, 17 skip; 5,577 tests pass, 364 skip. The additional 67 checks pass.
- `npm run build`: pass. Vite reports that `/character-runtime/manifest.json` resolves at runtime.
