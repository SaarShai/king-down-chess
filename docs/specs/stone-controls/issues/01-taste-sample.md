# Stone controls: option b

Status: resolved
Type: prototype

## Scope

The owner asks for two working samples from `2e7f6295`.
Saar chooses the option after he sees the samples.
This ticket covers option b. The sample has no chest.
Keep the words, layout and menus. Use the board art and colour tokens.

## Plan and checks

1. Read C1, its source reports and the game-feel report.
2. Apply shared CSS selectors. Keep the change in the plugin.
3. Build the current page and both samples. Use a local fixture host.
4. Check phone WebKit at 393 × 852, with host insets 102 / 118.
   Check desktop Chromium at 1280 × 800.
5. Save Home, Play, New game, Board, Resign and Settings images.
   Check the press, reduced motion, target size and text contrast.
6. Run the affected plugin checks and typecheck. Save the results.
7. Commit this sample. Do not push, merge or deploy.

## Acceptance

All visible control targets measure at least 44 × 44 CSS px.
Stone controls move 4 px on press. Reduced motion stops the movement.
Text on each new stone face has at least 4.5:1 contrast.
The README shows the review risk and the comparison paths.

## Result

The working sample is ready. The owner choice stays open.
The change uses 37 CSS lines, three small class changes, and one texture crop.
Option b uses stone on main actions and the game choices.
The crop is 72 × 72 px from the first pale tile in `public/ui/stone-board.webp`.
The words and menu structure stay the same.

## Verification

- The plugin server build passes.
- `npm test` passes all 49 checks in the three affected plugin files:
  `tools/plugin-app.test.ts`, `tools/plugin-ios-size.test.ts`, and
  `tools/plugin-ui-style.test.ts`. `npm run typecheck` also passes.
- The local runner limits the inner test script to these files.
  It keeps the shared test lock and restores `package.json` after the run.
  No test limit changes.
- WebKit checks a 393 × 852 phone with host insets 102 / 118.
  Chromium checks a 1280 × 800 desktop.
- This branch has 17 screen images. The set has nine phone comparisons.
- Across both options, all 232 target measurements are at least 44 × 44 px.
- The stone press is 4 px. Reduced motion stops the press movement.
  A nested button does not also move its parent. Keyboard Space also works.
- Text contrast on the new stone is at least 5.81:1.
- The captures show no horizontal overflow or script errors.
- A code and image review finds no further change necessary for this sample.

The tests use a local host copy, not the native ChatGPT iOS app.
The commit gate uses an empty source for secret-value matching.
The owner forbids reads of secret files. All other gate checks stay on.

[Images, risk and checks](/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/taste/stone/README.md)
