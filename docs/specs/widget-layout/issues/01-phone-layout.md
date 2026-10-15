# Phone layout B

Status: resolved
Type: task

## Scope

The owner asks for three working samples on 2026-10-15. Each starts at `7adaac11`.
Saar chooses the layout after he sees the samples.
This branch holds option B only.

## Plan

1. Use short rows on portrait phones. Keep all state and rule text.
2. Put Back in the opponent row.
3. Keep Resign and Offer draw one tap from the board.
4. Build the page. Save three screens at four phone sizes. Measure each canvas.
5. Check the size floors, text, controls, landscape and desktop. Commit this branch.

## Checks

- Run the changed plugin size tests through `npm test`. Run `npm run typecheck`.
- Use WebKit for iOS and Chromium for Android. Use fullscreen and touch.
- Keep the desktop and landscape layout. Keep touch targets and all art.
- Compare each sample with a clean detached copy of the base.
- Save images and widths in the task's `scratchpad/taste/layout` folder.

## Result

The sample is ready. Saar's layout choice stays open.

- The server build passes. The type check passes.
- All 16 tests in `tools/plugin-ios-size.test.ts` pass through `npm test`.
- The owner-frame board is 384 px wide. The draw board is 375 px. The seat board is 384 px.
- The four phone sizes have 12 cropped PNGs and measured widths in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/taste/layout/b/`.
- The floors use the smaller seat or board width, rounded down to 5 px. All floors stay at or above the base floors.
- Rule and state text fit in the row and do not cross an action button.
- Back works from both table screens. The action confirmations keep their current send step.
- Back and Menu have 48 px touch areas on Android. All four corners pass the hit check.
- Landscape and desktop box checks use the detached base at `7adaac11`.
- The code changes CSS, two Back buttons and the size test. No art or words change.
- No push, merge or deploy occurs. A native device check stays outside this task.


The commit gate uses empty task sources. It does not read the owner's secret or key files, as the owner requires. The type, path, size and message checks still run.
