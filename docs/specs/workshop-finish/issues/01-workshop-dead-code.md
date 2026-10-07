# 01: Remove the dead Workshop code and stale CSS

**What to build:** The Workshop holds only code that runs. The builder removes the dead functions, imports and unreachable branches that the retro lists, with their tests: the saved-card pictures, the floor, zone and crack drawings, the unused gauge argument, the token and crop branches of the figure, the never-made edit-sheet selector, the unread layout attribute, and the "gold plinth" words in the screen-reader summary. The builder also removes each stylesheet rule that matches no Workshop markup. A new CSS test keeps it so. This is a prefactor: the player sees no change. It also removes the five unused names that the checks-and-hooks spec needs before it turns on `noUnusedLocals`: `presetWorths`, `LEARN_LINE`, `MARK_WORDS`, `squareList` (the import) and `pats`.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `npx tsc --noEmit --noUnusedLocals` reports no name in the Workshop folder.
- [x] The dead SVG drawings and their tests are gone; the art test still asserts the model, the figure and the gauge that the card renders.
- [x] The screen-reader summary names no plinth, floor, rim or glow.
- [x] A new CSS test reads the Workshop stylesheet and asserts that each class it names occurs in the Workshop source. It fails when the builder adds a rule for an unused class (checked once by hand, then removed).
- [x] The motion module stays as it is here; ticket 07 trims it.
- [x] `npm test` passes.

**Verify:** `npx tsc --noEmit --noUnusedLocals`; `npm test`

**Owns:** src/workshop/dialog.ts, src/workshop/art.ts, src/workshop/look.ts, src/workshop/workshop.css, src/workshop/ui.test.ts, src/workshop/css.test.ts (new)

## Comments

Build 2026-10-07, branch `build/workshop-finish-01` (commits 99e429b, d2c2b8e, e94a3a4, then a merge of the integration tip).

- Removed: `floorSvg`, `zoneSvg`, `cracksSvg`, `patternSvg`, `cropOf`, the token and crop branches of `figureHtml`, the `_landmarks` argument of `gaugeHtml`, `pats()`, the `.ws-edit-sheet` selector, `data-h` in `fit()`, and the imports `presetWorths`, `LEARN_LINE`, `MARK_WORDS`, `squareList`. `StageLook.figure` is now required, because `lookOf` always sets it.
- The hidden summary now starts "<figure> look, <army>." (`lookWords`). It names no plinth, floor, rim, glow or crack.
- Removed CSS: `.ws-panel`, `.ws-tools` (4 rules), `.ws-grid-wrap`, `.ws-cell.rim`, both `.ws-token` rules, `.c-both` and `.c-moveShoot`, `.ws-count`, `.ws-rule-foot`, `.ws-badge`, the glow and letter-row rules, `.ws-pats`, `.ws-pat`, `.ws-every`, `.ws-look-note`, and the tile background that line 112 cleared.
- The retro lists `workshop.css:238-243` as stale, but `.ws-key` is live (the + picker writes `details.ws-key`). It stays.
- The removed diagram rule `.ws-pattern { display:block; width:100% }` also styled the board sections. Without it the sections turned to flex and moved the boards down by 24 px. Its two properties now sit in the boards rule. Evidence: a script dumped the box and main styles of each `#workshop` element on 7 screens at 390x844, 568x320 and 1280x900, for builds of the base and the branch. After the fix, base against branch differs only in hover-transition colours and lazy images, less than base against itself (8 lines against 23).
- Outside the owned files: `motion.ts` drops the `false` from its one `gaugeHtml` call, so it compiles. Nothing else in the motion module changed. `tools/workshop-motion.mts` still passes `true`; tsc does not check `tools/`, and the extra argument does no harm. `judge.ts` keeps the exports `presetWorths` and `LEARN_LINE`, and `text.ts` keeps `MARK_WORDS` and `squareList`; `noUnusedLocals` does not flag exports.
- Tests: `ui.test.ts` art block now has "draws the card: the bare figure and the thermometer", "dresses the model from the verdict (lookOf)" and "names in the hidden summary only what the card shows". New `css.test.ts`: "styles only classes that the Workshop source uses" and "styles each made class family that the source makes". Checked by hand: a `.ws-unused-probe` rule made the first test fail with that name; then the probe was removed.
- Commands: `npx tsc --noEmit --noUnusedLocals` gives no line for `src/workshop`. `npm test` after the merge: tsc clean, vitest 39 files and 675 tests pass, node tests 42 pass. `PLAYABLE_URL=http://127.0.0.1:5291/ node tools/verify-workshop.mjs` on a preview of the branch build: ok at all 5 sizes. One earlier `npm test` run timed out the judge case "never lowers W" (5.5 s against the 5 s limit) under load; it passed alone and in the later full runs.

