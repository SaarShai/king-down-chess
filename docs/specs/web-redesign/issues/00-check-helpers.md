# 00 · Check helpers and sample states

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: PR #24 (decision D1)

## Scope

- No owner choice of its own. It makes every later step smaller and safer: the checks go through helpers, and the samples come from one tool. It changes no app code and needs no owner sample.
- Files: new `tools/app-ui.mjs`; `docs/specs/web-ux/capture.mjs` (a state table); new `docs/specs/web-redesign/samples/` (one state table for each visual step); the checks below.

## Plan

1. [x] Merge `origin/main` into the step branch (plugin and docs commits). Run `npm test` and `npm run check:browser plugin-ui`. Record the plugin page size (`node tools/plugin-ui-build.mjs`) in Comments.
   Done: the merge says "Already up to date" (de299e2). On de299e2, `npm test` passes and `plugin-ui` passes (1 of 1). The page is 4,291,757 bytes (Comments).
2. [x] `tools/app-ui.mjs`: helpers that read today's ids. `menuItem(page, name)` (today: `#new-game-btn`, `#settings-btn`, `#rules-btn`, `#workshop-btn`), `openMenu(page)` (today: nothing to open), `openExtra(page)`, `setPace(page, value)` (today: `#settings-btn` and `#pace`), `endTurn(page)` (today: nothing to press; the computer replies at once), `contextText(page)` (today: `#status`, `#move-help` and `#moment`), `lanMoves(page)` (today: the LAN of the `#moves [data-ply]` rows). Later steps change only the helper bodies.
   Done in 12a2387, with six more helpers and the shared reader `readUi` (Comments) and 11 unit tests in `tools/app-ui.test.ts`.
3. [x] Route every check through the helpers. The files that click the four nav buttons: `docs/visual-design/verify.mjs`, `tools/new-game-ui.mjs`, `tools/ux-defects/open.mjs`, `d2-hint`, `d3-review-readouts`, `d4-start-asks`, `d8-letters-stay`, `d9-copy-feedback`, `d10-enemy-card`, `verify-account`, `verify-cursor-adoption`, `verify-lesson-return`, `verify-new-game`, `verify-painted-game`, `verify-playable-clay`, `verify-workshop`, `verify-workshop-cast`. The files that read `#moves`: `docs/visual-design/verify.mjs`, `tools/measure-load.mjs`, `qa`, the probes `d1`, `d2`, `d3`, `d4`, `d6`, `d7`, `d8`, `d10`, `verify-account`, `verify-cursor-adoption`, `verify-new-game`, `verify-painted-game`, `verify-playable-clay`, `verify-powers`, `verify-special-moves`. Each changed assertion line gets its `Removed-check:` trailer here, once.
   Done in 42eaa94 (the probes, 13 trailers), ebcd5a7 (the verify checks, 49 trailers) and 04d3d46 (`qa`, `measure-load`, `new-game-ui`; no assertion line). 62 changed assertion lines, 62 trailers.
4. [x] Samples: `capture.mjs` takes `SAMPLE=<NN>` and reads `docs/specs/web-redesign/samples/<NN>.mjs` (a query, a seeded save and steps for each state). It renders each state at the sizes of spec rule 3 with Motion Off for stills, and checks no sideways scroll, controls inside the screen and 44 px targets on touch. Copy the renders out of the output folder; never commit them.
   Done in a118cdb and ac24130: `capture.mjs` SAMPLE mode, `samples/README.md` (the format) and `samples/00.mjs`.

## Verification

- [x] Every check passes with no change of behaviour; each changed check runs three times with no failure.
  The 13 changed checks (account, cursor-adoption, lesson-return, new-game, painted-game, playable-clay, powers, special-moves, ux-defects, visual-design, workshop, workshop-cast, qa) ran in the full run and then in 3 more runs: 13 of 13 passed each time (52 of 52). The runs are of a118cdb; ac24130 changes only the sample table. `plugin-ui` passes on the branch too (1 of 1).
- [x] `npm test` and `npm run check:browser` pass.
  `npm test` on the branch: vitest 78 files passed and 1 skipped, 1,426 tests passed and 13 skipped (main: 77 files, 1,415 tests); `node --test` 42 of 42. `npm run check:browser` on the branch: all 15 passed (main: all 15 passed).
- [x] `SAMPLE=00` renders today's game screen at the five sizes, as a test of the tool.
  15 renders (3 states at 5 sizes), all rendered; the checks find 6 renders with a fault of today's layout (Comments). The tool exits 1, as it must when a render has a fault.

## Risks

- A helper that hides a real failure: each helper fails with the id it looked for.

## Does not do

- No app change, no owner sample.

## Comments

### 2026-10-09 · Build notes (branch `claude/wr-00-check-helpers`)

- **Merge.** `git merge origin/main` says "Already up to date". Main (de299e2) holds PR #24 (57b8792), so decision D1 is closed.
- **Plugin page (spec rule 5).** `node tools/plugin-ui-build.mjs` gives 4,291,757 bytes before (de299e2) and after (ac24130) this ticket. The spec says 4,291,318 bytes: the 439 more bytes come from main before this ticket. This ticket changes no module of the plugin page. The page is below the 4,350,000-byte line.
- **Helpers in addition to the Plan list, and why:**
  - `pressMenu(page, name)`: `openMenu`, then a click on `menuItem`. Most checks open a menu item for its dialog, so the call stays one line.
  - `lanTurns(page)`: the plies in groups, one group for each move number. `verify-powers` checks that a Haste turn is one row.
  - `moveMarks(page)`: the key-moment mark of each ply (`?`, `??` or empty). `lanMoves` removes the mark; `verify-painted-game` waits for the blunder mark.
  - `openMoves(page)` and `moveRow(page, ply)`: a click on a move row opens its review. When ticket 03 or 05 moves the list, only these bodies change.
  - `waitForUi(page, test, arg, options)`: a wait on the readouts in the page (`page.waitForFunction` with the reader `readUi`). A timeout adds the ids that it read and what they show at that time.
  - `readUi`: the in-page reader that `contextText`, `lanMoves`, `lanTurns`, `moveMarks` and `waitForUi` share. A missing id fails with "app-ui: the page has no #<id>".
- **`endTurn(page)`** has no caller yet: today the turn ends with the move. Ticket 02b gives it its body and adds the calls (Plan items 15 and 16).
- **`openExtra(page)`** opens Settings today. `verify-account`, `d8` and `d9` use it for Account, Look and Copy moves.
- **What stays direct, and why:**
  - `verify-account` reads `#pace` in Settings (it checks the value that the account sync gives). It does not set the pace.
  - `docs/visual-design/shots.mjs` is not a registered check, and it renders "before" builds of the older app. Helpers that follow the new ids would break those renders, so it keeps today's ids.
  - `tools/plugin-ui-check.mjs` and `docs/2d-first-pieces/board/capture-strikes.mjs` read a `#status` of a different page (the plugin board, the 2D board).
- **Checks that are not one-for-one** (each has its `Removed-check:` trailer):
  - "`#move-help` is empty" (`d10` two times, `docs/visual-design/verify.mjs` one time) is now "no line of the context is a refusal". The refusal pattern holds the first words of each refusal in `src/main.ts` (`whyNot` and `onSquare`). After ticket 03 the context line holds more words, so "empty" would not stay true.
  - "`#moment` is empty" after Undo (`verify-cursor-adoption`) is now "the archer-shot words are gone".
  - A word count of a move row is now a ply count: "3 words in row 1" is "2 plies in move 1", and `verify-powers` "4 words" is "3 plies" (a row has no space between its plies).
  - The wait for the `??` text is now a wait on `moveMarks`.
  - `verify-painted-game` reads the viewed row from `aria-current` on `moveRow(page, 1)`. `src/main.ts` sets it with the `viewing` class.
  - A match on one line of the context uses the `m` flag (`/^Well done/m`), so it keeps working when the readouts become one line.
- **Sample tool.** `SAMPLE=00 node docs/specs/web-ux/capture.mjs <url>` against a build of ac24130: 15 renders (rest, selected, settings; at phone, desktop, laptop, tablet and landscape), all rendered, no page error. The checks find 6 renders with a fault. These are faults of today's layout, for the layout steps:
  - tablet (820×1180) and landscape (844×390), states rest and selected: a move-list row button is 41×22 px on a touch screen (below 44 px). The phone size passes.
  - landscape, state selected: the action row (Hint, Undo, Resign) goes below the screen (y 337 + 58 > 390).
  - tablet and landscape, state settings: a row of the Settings dialog is 370×36 px (below 44 px high).
  The tool gives the first small target of a render only (`minTarget` of `tools/lib/checks.mjs` stops at the first one).
- **Sample 00 save.** The first table copied the review save (moves `e2-e4 e7-e5 g1-f3 b8-c6`). With the army SQBKRSML, `g1-f3` and `b8-c6` are not legal, so the app drops them. Sample 00 now seeds the two legal plies. The UX review mode of `capture.mjs` keeps its old save, so its renders show two plies, not four.
