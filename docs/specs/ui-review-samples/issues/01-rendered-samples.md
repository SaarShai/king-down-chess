# UI review samples

Status: needs-triage
Type: task

## Scope

The owner asks for V1 to V10 as real UI samples on `staging/ui-samples`.
The sample base is `de2a724b`. The release build uses `staging/ui-approved`.
The owner approves the picks below. The branch needs a PR review before main.
Keep the painted art, stone, parchment, current fonts, and shared colours.
Do not push, rebase, deploy, sign in, or use an external site.

## Owner approval

On 2026-10-26, the owner says: "Fix plan: yes to all picks."
This approves the V1 to V10 picks in the sample report.
Keep the full-size Guide figures. Remove all unused option patches.
The owner also says: "remove the option of 'same device' match. we don't need this."
Old two-human saves still load and finish. The URL fixture stays.

## Release plan

1. Review the sample code and all local start paths. Fix clear faults.
2. Keep a deterministic check of the picks. Remove the option patches.
3. Fetch and merge `origin/staging/first-game`. Keep both lanes' work.
4. After the quiet lock clears, run the full tests, docs, build, and screen checks.
5. Capture each approved state. Compare it with the sample. Commit on this branch.

The change passes when each approved state fits all five screen sizes,
keyboard and accessible names work, reduced motion works, and old saves finish.
No visible control starts a two-human local match. All required checks pass.

## Sample plan

1. Capture the base at each size and state in the request.
2. Change the UI code. Render both options where the review gives a choice.
3. Compare the images. Check contrast, text size, spacing, and the local paths.
4. Run the focused tests, the build, and the doc checks. Commit the sample.
5. Write the image list and report. Stop the preview by its PID.

## Pass conditions

- V1: every coordinate has contrast of at least 4.5:1.
- V2: Computer has one name. A friend opens the online setup path. Empty designs are hidden. The phone shows the army and both powers beside Start.
- V3: the first game has a read hint and a lesson link. Later games have no hint.
- V4: the suggested lesson and save note come before the shelf. Keep full-size figures.
- V5: title piece names are at least 11 px at all five sizes. Names do not overlap.
- V6: notation uses a 55ch measure. Each rendered line has at most 80 characters.
- V7: piece text has more space between lines and fits the status area.
- V8: Board help has space before Close at 320 by 568. Back shows only its arrow and keeps the name "Back to Menu".
- V9: the first lab card offers Load example and shows the test-deck note.
- V10: Moves grows above 48 px with text. Phone lesson text is 16 px. Normal and doubled text fit.
- All requested base and sample images exist. The report names limits and test results.

## Sample result

All ten items have base and sample images. V1, V2, and V8 also have an option B.
The owner approves all picks on 2026-10-26. The release work uses these picks.

The chosen coordinate colours are ink `#2b2621` on parchment `#f3ead7`.
Their contrast is 12.53:1. The backing covers the stone under each label.
Title labels measure 11 px. Notation has at most 77 characters per line at both sizes.
Piece text has 19.6 px line spacing. The enlarged Moves row is 77.19 px high.
The Guide action and save note fit at 320 by 568. Board help keeps its gap.
The first-game lesson action works. A later game has no read hint.
Load example gives Freeze a target. The test-deck note stays in view.

## Sample checks

- `npm run build`: pass for the base, the chosen sample, and option B.
- Focused `npm test`: 263 checks pass in 12 source and helper files. The filters select New game, context text, table, Guide, lesson shelf, routes, browser runtime, setup model, Workshop, board ink, and the UI helper.
- Opponent text checks: 11 selected checks pass across six files. The names match F-113, F-114, checked flat choices, source symbols, coins in the frame, a failed start, and Retry of a lost Choose reply. The corrected F-114 check passes on its final run.
- The same test command also runs the 67 painted-board checks. They pass.
- Browser-runner checks: 91 focused checks pass in four files.
- `npm run check:browser new-game`: pass.
- `npm run check:browser ui-review-samples`: pass at all five sizes. It checks the real controls and the text bounds, including doubled text and Load example.
- `npm run test:docs`: 180 checks pass in 15 files.
- The static detector reports three runtime image slots, three existing motion curves, and one source type rule. The browser captures have no page errors or failed image decode.

## Sample limits

The local friend route shows that account play is unavailable. No sign-in occurs.
The friend route and its return path have focused tests. No live account flow runs.
At doubled text on 320 by 568, the lesson board is small. Its text and controls fit.
The full test suite, physical phones, and screen-reader speech do not run.


## Release changes

- Remove the unused V1, V2, and V8 option patches. Do not add the compact Guide.
- Keep `verify.mjs` as `ui-review-samples`. It checks the approved states at all five sizes.
  Add checks for the opponent group, keyboard choice, focus, full-size figures, and reduced motion.
- Add `role="group"` to the opponent choices. Keep the approved look.
- After Load example, focus the new target square. The removed button cannot keep focus.
- Keep the first lesson action with the local save notice. A focused test checks both.
- Guard all new local game starts against an old two-human setup.
  An old two-human result opens New game from Home, the result, and the turn bar.
  Ogre practice uses the selected computer opponent. Old saves and the URL fixture stay valid.
  Convert only the player seats at start. Keep a remembered Strong level.
- At 320 px, reduce the title edge gaps so names do not touch.
  In short landscape, size cells from their names. Keep the 11 px floor.
  The approved V5 captures at 375, 768, and 852 px keep their layout.
- Keep `src/new-game.ts` unchanged so the friend invite work can build on it.
- Fetch and merge `origin/staging/first-game`: keep the save work and the CI install retry work. No conflict occurs.

## Release checks

- Focused test: 130 source checks and 67 painted-board checks pass.
  Files: `src/new-game.test.ts`, `src/ui/home.test.ts`, `src/ui/table.test.ts`,
  `src/screen/play.test.ts`, and `src/screen/moments.test.ts`.
- Route and setup test: 125 source checks and 67 painted-board checks pass.
  Files: `src/online/routes.test.ts`, `src/online/runtime.test.ts`, and `src/plugin/screens/setup-model.test.ts`.
- The first quiet lock clears before the full and browser runs.
  It returns during the final browser batch. The monitor misses its return on earlier polls.
  Stop heavy work. Repeat the final checks after the lock clears.
- Full test: 282 files pass. 5,437 checks pass; 8 skip. The 67 painted-board checks pass.
  The first run finds a newer invite constraint in the disposable database copies.
  No session uses them. Restore the three test copies with this branch's existing schema. The full run then passes.
- Doc check: 180 pass. Build: pass.
- After the CI merge, `KINGDOWN_TEST_FILE=tools/workflow.lint.test.ts npm test`: 23 checks and 67 painted-board checks pass.
- Browser checks find three old assertions and one layout fault.
  The Guide now puts its action and save note first. The phone card now has its test-deck note.
  A FEN preview needs a kept save to check that a setting is saved.
  Keep the short-phone Previously note at line height 1.25 so its long turn text fits.
  Piece descriptions keep the approved 1.4 spacing.


## Release result

The build is complete. This ticket needs the PR review before main.
The branch stays local. No push or deploy runs.

- Final focused test: 115 source checks and 67 painted-board checks pass.
  `KINGDOWN_TEST_FILE='{src/screen/play.test.ts,src/new-game.test.ts,src/ui/table.test.ts,src/ui/home.test.ts}' npm test`.
- All 32 selected browser checks pass. These cover New game, the game screen, End, Home,
  Guide, menu, title, lessons, Workshop, the plugin UI, and local web play in both stages.
  The title check keeps the 11 px floor across ten screen sizes.
- The final build passes. Account play stays off for the local captures, as in the approved sample.
- The task output holds 36 after images: the 34 approved states and two extra title views.
  Of the 34 sample pairs, 30 match exactly. Four have only 1 to 3 colour levels of difference
  at soft edges. The layout and text match. The captures have no page error or external request.
- The extra title views show the spacing fix at 320 by 568 and 568 by 320.
  The approved V5 views at 375, 768, and 852 px match exactly.
- The design scan has six existing reports: two runtime image slots, one type-size warning,
  and three motion notes. The rendered image and motion checks pass.

The full friend invite feature stays in its own work. This build adds no invite name or limit.
Physical phones and screen-reader speech do not run. Role and name checks pass in the browser.
