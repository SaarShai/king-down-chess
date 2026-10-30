# UI review samples

Status: resolved
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


## PR 154 repair plan

The two reviews request changes. The owner asks for these repairs on 2026-10-26.

1. Run End twice on this branch and twice on the base, one run at a time.
2. Capture each enlarged-text fault on the base and this branch at all five sizes.
3. Restore Learn focus. Fix R1 to R7. Keep the approved normal-size views.
4. Add browser checks for focus, enlarged text, coordinates, and hit areas.
5. Fetch and merge the base. Run the requested source, doc, build, browser, and full checks.
6. Compare all 34 sample pairs. Record evidence and commit. Do not push.

Pass: Learn accepts arrow keys after Enter. Enlarged text stays clear of controls.
Lab labels reach 4.5:1. Both small targets reach 24 px. The approved views match,
except for the allowed Lab backing and invisible hit areas. Run all requested checks.
Record each failure and its cause.

## PR 154 repair findings

- Learn hides the button that has focus. Start each lesson with focus on the board.
  The browser check presses Enter on Learn, then ArrowRight. The cursor moves to f2.
- End fails the same focus check on the base in both runs. This branch fails once
  and passes once before the repair. The result is not specific to this PR.
  Keep this old fault out of the UI repair. The base is `f306d452`.
- R1: Guide names overlap on the base. Let the grid use fewer columns as text grows.
  Keep the approved figure height.
- R2: Title names overlap on the base. Let names wrap and use fewer columns.
  Let the title page scroll when the content is taller than the screen.
- R3: Landscape text and actions overlap on the base. Give the text its own scroll
  area. Size the action row from its content. Keep Moves and all actions in view.
- R4: Board help runs under Close on the base. Let its title wrap inside the header.
- R5: Workshop headings and the shelf clip on the base. Let headings, card names,
  and shelf rows grow. The test-deck note and Load example are new in this PR.
  Give their rows enough space at 200% text. Keep the normal shelf position.
- R6: Pale-square Lab labels have low contrast on the base. Use the approved ink
  and plain parchment pair. The contrast is 12.53:1.
- R7: The friend return link is too short on the base. Load example is new in this
  PR. Add clear hit areas around both labels. Each area is at least 24 px high.

Fetch and merge `origin/staging/first-game` before the final repair commit.
The merges have no conflict. They keep the clip-load fix and the button-motion fix.
The final base is `b07d7f74`. The two End base runs use `f306d452`.
The repair does not change `src/new-game.ts`, dependencies, or game rules.

## PR 154 repair checks

- The six requested files pass: 138 source checks and 67 painted-board checks.
  Files: `src/new-game.test.ts`, `src/ui/home.test.ts`, `src/ui/table.test.ts`,
  `src/screen/play.test.ts`, `src/screen/save.test.ts`, and `tools/ui-text.test.ts`.
- The doc check passes: 180 checks in 15 files. The build passes.
- All eight requested browser checks pass again after the last base merge:
  `ui-review-samples`, `new-game`, `game-screen`, `end`, `home`, `visual-design`,
  `lessons`, and `workshop`. End passes on this final run.
  The sample check covers five sizes, Learn with Enter and ArrowRight, 200% text,
  Lab colours, and both hit areas. It also checks each card name inside its card
  and each card inside the shelf.
- The first browser batch finds two Workshop faults in the repair. The shelf
  keeps its old fixed height, and Undo plus More extends beyond the header.
  Use the shelf content height and align the header actions to the right.
  Both checks then pass. Keep the old 198 px shelf floor in short landscape.
- Run the full suite once after the final base merge: 283 files pass, one fails;
  5,454 checks pass, one fails, and eight skip. The failure is test setup:
  the new branch database has no `public.profiles` for the role cleanup check.
  Run `npm run plugin:db:init-test` on `kingdown_ui154_test` after the create helper.
  The failed Daily friend runtime-role case then passes by itself: one passes and
  26 unselected cases skip. The 67 painted-board checks also pass. No second full run occurs. The shared test database stays intact.
- Capture 40 base views, 40 before views, and 45 after views at all five sizes.
  The after set includes five lower-shelf views. No capture has a page error or
  an external request. The output has nine contact sheets.
- Compare all 34 approved sample pairs: 26 are exact and six have edge changes of
  one to three colour levels. The two Lab pairs show the allowed coordinate
  backing. Outside those labels, one pair has at most two levels of difference;
  the loaded pair also has four edge pixels with a maximum change of nine levels.
  No text or layout differs. The comparison files keep these measured limits.
- The final design scan has five existing reports: two runtime image slots,
  one source type-size report, and two motion reports. No new design change is made
  for those reports. The owner-approved look stays in place.

The repair needs review on PR 154. No push, deploy, or sign-in runs.
The output folder holds the check logs, views, contact sheets, and final report.


## Lean build plan for PR 154

The owner asks to finish PR 154 on `ui154-work`. The lean base is
`origin/staging/first-game` at `42336dbb`. The parked list takes precedence
over the old sample paths. The owner approves all V picks on 2026-10-26.

1. Merge the lean base. Keep its parked entry points closed.
2. Keep each V fix with a visible screen. Remove the lesson and Lab parts
   that have no visible screen. Record each choice below.
3. Update the sample check and each affected test or check. Capture the kept
   views at the five approved sizes. Check normal and doubled text.
4. Run `npm test`, `npm run test:docs`, `npm run build`,
   `npm run check:browser ui-review-samples`, and each changed browser check.
5. Review the final diff. Commit with the unchanged hooks. Push to
   `staging/ui-approved`, mark PR 154 ready, and update its body.

Pass: the merge has no conflict marker; parked features have no visible
entry point; each kept V item passes its check; all requested commands pass.
No deploy or production command runs.


## Lean build choices

The current request permits the push and PR update. It replaces the old
no-push limit in this ticket. The parked list at `42336dbb` stays in force.

| Item | Choice | Result and reason |
| --- | --- | --- |
| V1 | Keep | All 16 board coordinates use plain parchment and dark ink. Contrast is 12.53:1. |
| V2 | Change in part | Keep Computer and A friend Online, No powers and Kings' powers, and the army and power summary by Start. Army offers Random or Chess. Remove the design field because Workshop is parked. No same-device or code-entry choice returns. |
| V3 | Change in part | Keep Tap a piece to read on the first board. Remove Learn because lessons are parked. Later games have no hint. |
| V4 | Change in part | Keep the full-size figures on visible Guide piece cards. Drop lesson order and its save note because the lesson shelf is parked. |
| V5 | Keep | Title names have an 11 px floor. Names wrap and the page scrolls with large text. |
| V6 | Keep | Guide notation uses 55ch. Its style lives in the active sheet, not the parked lesson sheet. |
| V7 | Keep | Piece descriptions use line height 1.4. They fit the status area. |
| V8 | Keep | At 320 px, Back shows its arrow. Its name stays Back to Menu. Board help stays clear of Close. |
| V9 | Drop | The Lab card and Workshop have no entry point. Remove Load example and its related changes from this PR. |
| V10 | Change in part | Keep the growing Moves row and large-text layout. Drop lesson text changes because lessons are parked. |

The sample check now covers these kept states at 320 by 568, 375 by 812,
852 by 393, 768 by 1024 and 1280 by 800. It writes normal and large-text
captures. It checks that parked controls stay absent. Its Guide expectations
use the visible piece cards; its lesson and Lab expectations are removed.

## Lean merge resolutions

The merge has 15 conflicting files.

- `index.html`: keep the lean cuts, the opponent group, both rule choices,
  the Start summary, the context scroll area and the Back label. Remove Learn.
- `src/main.ts`: keep lean game starts and imports. Keep the first-board hint.
- `src/new-game.ts` and its tests: keep lean saved-setup parsing, parked-army
  handling and live preset access. Add only the visible summary. Remove
  handlers for the removed two-person and design controls.
- `src/screen/play.ts`, `src/ui/home.ts` and its tests: keep the lean rematch
  and game-link behavior. Old two-person saves finish; rematches seat the
  computer. Restore the base game-end, moments and play tests for this path.
- `src/ui/table.test.ts`: keep the read-hint test with the save notice. Remove
  the lesson action from its expectation.
- `src/lesson-shelf.css`: keep the parked source from the lean base. Move the
  notation width into `src/style.css`.
- `tools/lib/registry.mjs`: keep all lean checks and the UI sample check.
- `tools/new-game-ui.mjs`: keep the lean hidden two-person URL fixture.
- `tools/plugin-setup-owner.test.ts`: keep the Computer and online friend
  symbols. The friend link opens online setup; it cannot start pass-and-play.
- `tools/verify-game-screen.mjs`: keep growing status rows and remove lesson
  steps. `docs/visual-design/verify.mjs` keeps the 11 px title check.
- `tools/verify-new-game.mjs`: keep parked-link and saved-setup cases. Check
  No powers, the online friend link, the summary and absent parked fields.

The parked Workshop and lesson source changes are removed from the PR diff.
No parked entry point, page or option returns.


## Lean build check findings

- The first sample run finds Guide headings outside the cards at doubled
  text on 320 px. Let those headings wrap inside the text column. The
  full-size figures stay unchanged. All five browser checks then pass.
- The first full test run has two failures. The worktree has no local
  package link, so the simulation smoke test cannot start its local runner.
  `tools/wt.sh add "$PWD"` restores the normal link. No dependency changes.
  The other failure is an old output-folder label in ticket 02. Remove that
  label to meet the existing model-name rule. The run has 5,575 passes and
  364 skips. It is not a full-suite pass.
- The design scan reports five existing items: three runtime image slots,
  one source type-size report and one motion note. The browser image,
  text-size and reduced-motion checks pass.


## Lean build result

The work is complete for PR review. All requested checks pass.

| Command | Result |
| --- | --- |
| `npm test` | Exit 0. Both type checks pass. 286 files pass; 17 files skip. 5,577 tests pass; 364 skip. The 67 painted-board tests pass. Source test time: 354.99 s. |
| `npm run test:docs` | Exit 0. 187 tests pass in 17 files. |
| `npm run build` | Exit 0. Type check and build pass. |
| `npm run check:browser ui-review-samples new-game game-screen visual-design plugin-ui` | Exit 0. All five pass. Times: 18.2 s, 46.8 s, 8.2 s, 22.4 s and 276.7 s. |

The sample check writes 47 captures. The rendered review covers the narrow
title, Guide, New game, Back, piece text and enlarged Moves. No page error
or external request occurs. The five approved sizes pass.

Final diff review: each kept fix uses the existing UI code and styles.
The parked lesson and Workshop files, local rematch behavior and hidden
two-person fixture match the lean base. No dependency or hook input changes.
The diff has no whitespace fault or conflict marker.

Logs are in `/private/tmp/ui154-checks/`: `test.log` is the first failed run;
`test-final.log`, `docs.log`, `build.log` and `browser.log` hold the final
results. The browser run folder is `ui154-15sjKv` in the local
`kingdown-check-runs` folder. It holds `run.json`, each check log and the
47 sample captures. The scan and contact sheet are in the task log folder.

The source suite uses its normal skip rules. CI runs the full browser matrix.
Physical phones, screen-reader speech and a live account sign-in do not run.
No deploy, publish or production command runs.
