# Bring the approved effects (PR #92) into staging

Status: in review; branch `staging/lane-effects` (from `origin/staging/first-game` `0d9146b0`, merged with `origin/codex/effects-integration` `5c53d450`); not merged into `staging/first-game`, not deployed.

## What

PR #92 (`codex/effects-integration`) holds the approved effects system: move and card playback, state effects, the board sheet and dialog motion, the end ceremony and the king effects. `staging/first-game` now holds the six playtest board fixes of PR #99 (ticket 79) and the removed speed choice (F-031, ticket 83). This ticket puts both sets of behaviour on one branch, so that staging can show the effects.

## Scope

- One merge commit of `origin/codex/effects-integration` into `staging/lane-effects`.
- Test changes only where PR #92's approved motion changes when a test can read the page. One product fix after the merge: the F-008 sheet body fit (below).
- Keep: F-032 (the touch tap opens the promotion sheet), F-008 (the sheet body is a named region with its ring inside), F-009 (focus returns to Menu), F-011, F-103, F-038, and F-031 (no speed choice).

## Acceptance

- `npx tsc --noEmit -p .` passes.
- The full `npm test` passes.
- The board tests pass in Chromium, WebKit and Firefox.
- `npm run check:browser` passes for `plugin-ui` and for the checks that PR #92 touches: `effects-animation`, `effects-game`, `effects-states`, `end`, `cursor-adoption`, `menu-extra`, `new-game`, `visual-design`, `king-effects`.
- Each failure has a known cause. A failure that `origin/staging/first-game` also has is named as an old failure.

## Result

### Merge

Conflicts and their resolution (`17f89c25`):

- `src/plugin/screens/board.ts`: the board sheet keeps the F-032 scrim press guard (the scrim closes the sheet only for a press that starts on the scrim) and gets PR #92's `ui-dialog-motion` class.
- `tools/plugin-app.test.ts`: the remount keeps the staging wait for the old frame and the canvas-click draft, and gets PR #92's wait for an enabled Play.
- `tools/plugin-board.test.ts`: staging split this file into `plugin-board.test.ts`, `plugin-board-input.test.ts` and `plugin-board-drafts.test.ts`. PR #92's five changes to the old file go to the new file that holds each test.

### Test changes for the approved dialog motion

PR #92 gives each dialog and sheet a 175 ms open and close transition (`ui-dialog-motion`, with `display` `allow-discrete`). A closed sheet is `open === false` at once, and stays visible until its close transition ends. The sheet also scales in as it opens.

- `1741850d`: `sheetClosed()` (`tools/lib/plugin-board-fixture.ts`) checks that the sheet is closed and then waits until it is hidden. The F-032, F-038, F-009 and Escape tests use it in place of an `isVisible()` read just after the close. The F-008 ring check reads the sheet's colours after the fade in. The checked portrait in the plugin is now a still class in every motion setting; only its `.ui-check-frame` pulse depends on reduced motion, so the check pulse test counts one pulse and reads its running state.
- `24c517a9`: `sheetAtRest()` waits for the sheet's animations to finish. WebKit measured a 47 px button during the open scale; the tablet-face test and the F-008 ring test now measure after the sheet is at rest.

These failures do not occur on `origin/staging/first-game`, because staging has no dialog motion. No product behaviour changed.

### Staging moved twice

- `1f3e80de`: `origin/staging/first-game` `af8e8c06` (PR #96, Knight and Rook clips). No conflict.
- `c37aad2b`: `origin/staging/first-game` `d33fb94c` (PR #98, a staged turn over a reload). No conflict.

### F-008: the sheet body fits the placed sheet (`b7f565e9`)

After the PR #98 merge, the full `npm test` failed once: `F-008: a sheet body that overflows only into its bottom padding is not a Tab stop` read `tabindex` `null`, not `-1`, with an overflow of 8 px into 16 px of padding. Eight separate runs passed.

Cause: `boardSheet()` called `fitSheetBody()` before it added `move-choice` and placed the sheet (`place()`). That fit measured the unplaced sheet, with no overflow, and removed `tabindex`. A resize observer then fitted the placed sheet in a later frame. A loaded page reached that frame after the test read the body. Staging has the same order.

Fix: `boardSheet()` fits the body after the placement. The test now opens the sheet and reads the body in one task (a dispatched Enter), so it does not depend on frame timing: without the fix it fails each time (`expected null to be '-1'`, 2 of 2 runs); with the fix both F-008 tests pass (3 of 3 runs).

### WebKit faults on Linux CI (PR #101 head `7ed05cb5`)

- **ResizeObserver loop** (board drafts job: "ResizeObserver loop completed with undelivered notifications"). The board sheet's `place()` (`src/plugin/screens/board.ts`) and the promotion dialog's `place()` (`src/screen/play.ts`) read the dialog's drawn box (`getBoundingClientRect`). PR #92's opening motion scales the dialog (.98), so the drawn height changes during the opening, the board's `max-height` changes inside its own observer, and the observer runs again. Both now read the layout size (`offsetWidth`, `offsetHeight`), which the scale does not change.
- **Spent power coin focus** (`#power-w` bottom 2.99:1, right 3.01:1). The focus ring sits on `::before` at `inset: -1px`, so the outer ink band lies on the spent coin's grey rim; PR #92's smaller spent notch (`scale: .9`) uncovers more of that rim, and Linux WebKit fell under 3:1. The spent card coin already draws its ring at `inset: 0` for the same reason; the rule (`src/plugin/screens/board.css`) now covers every spent coin. Local WebKit: the power sides go from [12.7, 4.2, 12.4, 3.3] to [12.2, 11.8, 11.9, 12.0].
- **Card image in the 44 px coin** (plugin-ui: `image: 34.56` on `strip-them`). The computer cast a card before the measure. A spent card's paint is `scale(.96)` (PR #92, approved), so its image is 36 x .96. Not a product fault: `cardFaces` now returns the coin state and the check expects the .96 size on a spent coin.
- **Tablet button face** (plugin-ui, after the faces step; local WebKit): `checkTabletButtons` measured a move choice at 47 px during the sheet's opening scale. It now measures after the finite animations end.
- **F-032 old scrim press** (PR #100's test, after the staging merge): it read the sheet box during the opening motion (translate 22 px), so its press near the edge hit the sheet head. It now waits for the sheet at rest.
- Local WebKit after the fixes: board and app tests 342 pass; `check:browser plugin-ui` ok.

### Runs

- `npx tsc --noEmit -p .`: pass (after each merge and fix).
- Full `npm test` on `24c517a9`: 264 files, 4961 tests pass. On `c37aad2b`: 4972 pass, 1 fail (the F-008 fault above). On `b7f565e9`: 264 files, 4973 tests pass.
- Board tests (`tools/plugin-board*.test.ts`):
  - Chromium: in the full run.
  - WebKit on `24c517a9`: 206 pass. On `b7f565e9`: 206 pass.
  - Firefox on `24c517a9`: 45 fail, 161 pass. The same 45 tests fail on `origin/staging/first-game` `af8e8c06` (a separate worktree, same command): old faults, not from this merge (for example the A8 mouse skip tests and a `getByRole('button', { name: 'All rules' })` wait). On `b7f565e9`: the same 45 fail, 161 pass.
- `npm run check:browser` on `1f3e80de`: `plugin-ui`, `effects-animation`, `effects-game`, `effects-states`, `end`, `cursor-adoption`, `menu-extra`, `new-game`, `visual-design`, `king-effects`: all ok. (A first `plugin-ui` run stopped because this ticket changed during the run; the rerun is ok.)
- `npm run check:browser` on `c37aad2b` (PR #98's checks and the web effects): `turn`, `home`, `lesson-return`, `account`, `web-game`, `effects-game`, `end`, `new-game`: all ok.
- Independent review (a Sol run) of `1f3e80de`: no findings, Ready. A second run of the delta (`c37aad2b`, `b7f565e9`): no findings, Ready.
