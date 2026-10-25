# Combined taste preview

Status: resolved

The owner asks for one local preview on `taste/recommended`. The base is
`f1017eea`. The owner decides if this preview can merge. No push or deploy.

## Plan

1. Save a built copy of the base. Merge quick-start, layout-b, stone-b and
   motion-lively, in that order. Keep the base fault fixes.
2. Check the combined screens and flows. Fix faults within the chosen scope.
3. Run the plugin tests, type check and plugin browser check. Keep all test
   time limits. Update old checks to match the chosen options.
4. Capture five journeys on both builds, on iPhone and Android frames.
   Record taps, board widths and faults. Make comparison strips.
5. Write the report and commit this branch with both requested trailers.

## Acceptance checks

- The seven picks work together. The back button has the name Back to Menu.
- The home count is correct for zero, one and more than one game.
- All required tests pass. No old test is removed to pass.
- Both players reach the friend board. New, resume, end and next flows work.
- Text and controls do not overlap. Board widths are measured after load.
- The report states all limits. Other branches stay unchanged.

## Evidence

- `npx vitest run tools/plugin-*.test.ts src/plugin`: 245 pass. The 20 database
  tests skip because this local check has no test database.
- `npm run typecheck`: pass.
- `npm run test:docs`: 113 pass.
- `npm run check:browser plugin-ui`: pass in 263.8 seconds. The run checks
  setup, seats, cards, moves, game ends, recovery, touch and frame limits.
- Five journeys run on both builds and both devices. The report has 130
  numbered frames and five comparison strips. New game drops from seven
  taps to three. Resume and Next game each drop from two taps to one.
- The board grows from 302 to 384 CSS pixels on the iPhone. On Android,
  most boards grow from 347 to 351 CSS pixels. The report lists each screen.
- The report and logs are in the task's scratch folder:
  `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/taste/recommended/README.md`.
- Both local players reach the same friend board in separate seats. Both
  players then return to an empty game list for the owner's preview.
- No push, deploy or main merge. The source branches stay at the requested
  commits. The native app, real phones and a remote database are not checked.

## Merge choices

- Quick start: keep the single hall and home actions. Keep the base count
  grammar, 10-second command limit, offline errors and setup width rule.
  Move the scroll reset and code-field settings into the hall.
- Layout B: use the short portrait rows and the back control in the opponent
  row. Keep the base Moves row height and touch-area stacking.
- Stone B: add stone to choices and main actions. Keep the single hall,
  the base hit areas, and all layout and stone tests.
- Lively motion: add the motion and Sound switch. Keep the base card names,
  full last-turn trail, card-user marks and short name-page text.

## Combined faults

- The top opponent controls have touch areas above the frame. Their touch
  areas now extend down into the frame.
- The end screen restores the page head and makes the board shrink. It now
  uses the same portrait head rule as the board and seat screens.
- A page change can enable Start while a start is pending. The common action
  state now keeps Start disabled. After a long wait, the hall tools give a
  safe way out, and Back returns to the hall.
- Zero now reads "No games need your move." One keeps the singular "game".
- Checks use the single hall and visible controls. Size and hit checks wait
  for the short opening and deal effects to end. No time limit increases.
- A new chat result can arrive during an old foreground read. The old busy
  state skips the new board read and leaves the end screen open. The new
  result now waits for that call to end before it changes the board. A held
  read test checks that the new board opens and the old end card closes.
- A lost Play now reply leaves Retry in a hidden frame. A failed quick start
  now opens the hall with Retry. The test checks that recovery sends no
  second Create and opens the board.
- The browser check expects spent cards to turn grey at once. It now waits
  for the Lively pulse to end, then checks the used state for both card paths.
