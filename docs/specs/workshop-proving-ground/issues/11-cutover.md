# 11 · Cut over: A becomes the Workshop

Status: ready-for-agent
Size: L
Blocked by: 02, 03, 04, 05, 06, 07, 08, 09, 10

## Scope

- The Workshop doors open A for every player. The preview switch goes.
- Delete what A makes dead (spec, "What goes").
- The checks, the docs and the samples tell only A.

## Plan

1. [x] **`src/main.ts:90-97`:** `openWorkshop` imports `./workshop/ground` always; remove the `?workshop=a` test. The `workshop` promise type (`:90`) names `groundDialog`, because `dialog.ts` goes.
2. [x] **Delete:** `src/workshop/dialog.ts`, `card.ts`, `sandbox.ts`, `motion.ts`, `workshop.css`; `art.ts` (`gaugeHtml`, and `figureHtml` and `modelHtml` if A does not use them); `look.ts` `ghost`; `text.ts` `dirWords`; `tools/workshop-motion.mts`. In `judge.ts`: the exports that only the old screens read, `whyHead` (`:377`), `whyTitle` (`:180`) and `badgeText` (`:339`), with their cases in `judge.test.ts` and `ui.test.ts`. The `Verdict` fields stay (spec, "What goes"): `memory` feeds `warn` and `line`, and `judge.test.ts:102` reads `metal`. Any `vocab.ts` field that only the old UI read. Then search `src/` and `tools/` for each removed name; nothing is left.
3. [x] **Checks** (`tools/lib/registry.mjs:32-33`): `git mv tools/verify-proving-ground.mjs tools/verify-workshop.mjs` over the old file, so the `workshop` entry keeps its name and its script path, and `src/workshop/review.docs.test.ts:17` (`CHECK`) still reads the right file; the `proving-ground` entry goes. From now on the docs lint covers the file (`tools/*workshop*`, `workshop.docs.test.ts:80`): no bare `§`; `tools/verify-workshop-cast.mjs` keeps its cast groups on A's selectors (one New-piece choice per cast figure through "More", every army file loads). The commit lists one `Removed-check:` trailer for each removed assertion line, each naming the A group that covers it or "superseded: <feature> left with A". Make the list from the diff with a script, then read each reason.
4. [x] **Fix table:** each of the 29 rows (`FIXES`, `review.docs.test.ts:20`) of `docs/visual-design/workshop/REVIEW-2026-10-06.md` names an A group of the `workshop` check, a test title, "superseded" or "not checked: <reason>".
5. [x] **Helpers:** `tools/app-ui.mjs:229-239` (`keepWorkshopCopy`, `workshopCopyLink`, `workshopCardText`) and `tools/app-ui.test.ts:90-92` use A's selectors. `tools/verify-home.mjs:110-116` (a `?design=` link skips Home), `tools/verify-menu-extra.mjs:192` and `docs/visual-design/verify.mjs:313-314` (`#workshop` and its backdrop) pass with no change.
6. [x] **`docs/WORKSHOP.md`:** rewrite it for A with the 8 sections (Screens, Layouts, Model, Judge, Motion, Art, Accessibility, Checks). In the same commit, `src/workshop/workshop.docs.test.ts:29-43`: take `brush(es)`, `plinth`, `rim`, `halo` and `glow` off the deny list (A's own words); add Surprise me, the thermometer, the Why-estimate sheet and the Try it screen; `gauge` stays on it. The revision 3 file stays byte-equal.
7. [x] **Samples:** `docs/specs/web-redesign/samples/W12.mjs` goes (W14 holds the card); `01.mjs` and any other table that opens the Workshop use A's selectors.
8. [x] **Records:** `docs/specs/workshop-finish/spec.md` says "superseded by `docs/specs/workshop-proving-ground/`"; the `TASKS.md` line changes on main.
9. [x] **Size:** the Workshop chunk before and after (`npm run build` output) in this ticket.

## Verification

- [x] `npm test` passes (with the golden fixtures, the doc lints and the fix table).
- [x] `npm run check:browser` (all checks) passes; `workshop` three times.
- [x] `node docs/specs/web-ux/render-compare.mjs --against main`, detached: only Workshop states change.
- [x] A save and a link made on main before this ticket load after it (the golden fixtures, and one live save in the check).
- [x] The full W14 table renders at 1440 × 900, 390 × 844 and 844 × 390.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The trailer list is long (about 247 assertion lines in `verify-workshop.mjs`). Do not route around the hook by an unregister first.
- A removed `vocab.ts` field that an old link or save holds: none does today (the share keys and look keys are fixed), but check `validParts` (`model.ts:201-213`) before each removal.

## Does not do

- No new feature.

## Comments

### 2026-10-11 · built on `claude/proving-ground`

A first builder made most of the change and was stopped. A second builder read its diff and its logs, kept the diff, fixed the W14 recipes for 844 × 390, and ran the checks again. Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/11/`):

- `npm test`: exit 0. 115 test files pass (1 skipped); 1,881 tests pass (21 skipped); the 50 node tests pass (`test3.log`; again on the final tree, `test4.log`). The run includes `compat.test.ts` (the golden fixtures), the two doc lints and the fix table.
- `npm run check:browser` (all 25 checks): 23 pass in `check-all2.log`, `workshop` among them (98.2 s). `turn` and `workshop-cast` pass all their steps, but the runner marks them FAIL because files changed in the checkout during the run (the builder staged the files and edited this ticket). Two runs of `turn workshop-cast workshop` with no edits: both exit 0, all three checks pass (`check-ws2.log`: 10.5 s, 8.4 s, 97.4 s; `check-ws3.log`: 12.0 s, 8.6 s, 95.1 s).
- `workshop` passes three times: `check-all2.log`, `check-ws2.log`, `check-ws3.log` (each "workshop: all groups pass").
- Render compare: `node docs/specs/web-ux/render-compare.mjs --against HEAD` (the last commit, `38cb6f96`, so that only this ticket shows; `rc-head.log`), detached: 15 samples, 323 pairs, 10 stable changes. 8 are Workshop states: the 4 W13 Workshop renders cannot render on HEAD, whose Workshop is the old one. 2 are outside the Workshop: `00 move-laptop` (2 pixels in a 3 × 3 px spot) and `W4 shot-desktop` (522 pixels spread over the painted board, 173 to 853 px). Beside each other the two renders look the same, and the two renders of each build are equal. This ticket changes no game screen code (in `main.ts` only `openWorkshop`), so the two are noise of the painted board. W14 is not compared: the HEAD build cannot render this table without `?workshop=a` (`rc-head/rev/W14.log`). A first run against main (`rc.log`, stopped at W14 by the first builder) also shows the game-screen changes of the move legend, which is on this branch and not on main (00 `selected-*`, W1 `haste-*`, W4 `read-*` and `shot-*`).
- Old saves and links: `compat.test.ts` loads the golden shelf and the golden share codes of main (pass). The check loads a live save: `SHELF` in `tools/verify-workshop.mjs` is the shelf as main's `saveDesign` writes it (the `golden-a` and `golden-b` designs of `compat.test.ts`); the groups `yours`, `threeOfThree` and `designMenu` open it. The Rook Rider link of the old W12 sample opens in the groups `link`, `linkCard` and `designMenu`.
- W14: `w14.log` (the first builder, 1440 × 900 and 390 × 844, with the 5 landscape states of ticket 09): 92 renders, 0 faults. All 42 states at 844 × 390 (a scratch table W99 that maps W14 to `landscape`, removed after the run): `w14-landscape2.log`, 41 renders and 0 faults, then `w14-landscape2-bc.log`, beast-cancel, 0 faults. Before the recipe fix, 11 of 42 failed (`w14-landscape.log`).
- Size (`npm run build`; `size-before.txt` at `38cb6f96`, `size-after2.txt` with this change). The chunk split changes, so the sums count each chunk that only the Workshop loads:

  | | Before | After |
  |---|---|---|
  | Workshop JS | `dialog` 40.90 + `ground` 76.99 + `scene` 59.41 + `engine` 35.00 + `legend` 5.38 = 217.68 kB (gzip 80.18) | `ground` 133.74 + `legend` 40.44 = 174.18 kB (gzip 63.40) |
  | Workshop CSS | `dialog` 28.26 + `ground` 42.54 = 70.80 kB (gzip 15.83) | `ground` 42.57 kB (gzip 9.48) |
  | `main` JS | 358.38 kB (gzip 181.23) | 359.72 kB (gzip 181.81) |
  | `guide` JS | 29.54 kB | 32.68 kB |

  Rollup puts the shared code of the old `engine` and `scene` chunks into `ground`, `legend`, `guide` and `main` now that one Workshop loads it.

Changes from the ticket, each with its reason:

1. `look.ts`, `card.ts` and `art.ts` go as whole files, not only `ghost`, the old parts and `gaugeHtml`: after the cutover nothing imports the rest of them (`figureHtml`, `modelHtml`, `lookOf`). `figures.test.ts` checks the figure URL with `figureUrl` in place of `modelHtml(lookOf(…))`.
2. `names.ts` `rollName` (the die of the old name field) and the `vocab.ts` fields `seenOn`, `tryIt` and `icon` go: only the old UI read them. No share key and no look key holds them (`validParts`, `model.ts`), so no save or link changes.
3. `tools/app-ui.mjs` `workshopCardText` goes (only the old check read it); `keepWorkshopCopy` and `workshopCopyLink` take A's selectors. `tools/app-ui.test.ts:90-92` tests the menu items, not these helpers, so it needs no change.
4. `css.test.ts` reads `ground.css` only, and its test of the made class families (`ln-`, `mk-`, `f-`) goes with `workshop.css`.
5. `ground.css`: the backdrop takes the floor image too (`background-image: var(--floor, none)`), as the old `workshop.css` did, so `visual-design` (`docs/visual-design/verify.mjs:313-314`) passes with no change.
6. W13: the Workshop states open A (a link opens the card face; Keep a copy; each legend mark on the board). `workshop-try` goes with Try it. The board squares leave the touch test, as in W14.
7. W14: the recipes use the narrow controls (⋯, the rule cards, no hover) at every size but the desktop, and open the ledge's sheet from Pieces where the ledge hides. At 844 × 390 the Workshop has the narrow controls; before, 11 states clicked controls of the wide layout there.
8. The fix table: fix 27 (dialog dismissal) is "not checked": A's sheets use the game's shared `src/dialog-dismiss.ts`, which has no Workshop test. Fixes 5, 17, 28 and 29 are "superseded" (no strokes, no Try it screen, no 7 × 7 grids, one screen).
9. Plan step 8: `TASKS.md` is a tracker file and changes on main only (AGENTS.md), so its line changes at the merge.
10. The `Removed-check:` trailers: 262, one for each removed assertion line, made by `tools/trailers.mjs` in the build folder from the staged diff (`tools/lib/removed-checks.mjs`). Each names the old group and the A group that covers it, or "superseded: <feature> left with A". Each A group that a trailer names is a function of `tools/verify-workshop.mjs` (checked by a script).

### 2026-10-11 · Reviews

The review of the cutover (`review-11.md` in the build folder). Each finding, checked against the code:

1. **should-fix, confirmed: the damaged-entry note is gone.** Main's `home()` (`dialog.ts`) shows "1 saved entry could not be read…"; on this branch no code reads `loadShelf().bad` (grep: only `compat.test.ts` and `ui.test.ts`), so a shelf with a damaged entry opens with no word. Fix: the Workshop's `open` shows the same words as a toast (`role="status"`); the group `yours` seeds the shelf with a damaged entry (`y: 4`) and asserts the toast. Fix 19 of the fix table names `workshop` `yours` (the note, a toast) in place of "superseded". `docs/WORKSHOP.md` (Doors) tells the toast.
2. **should-fix, confirmed: fix 27 has no check.** Grep finds no test or check that presses in a dialog and releases on its backdrop (the drag tests of `tools/` are board drags). Fix: `shareLink`, with the copy sheet open, presses in the sheet, releases on the backdrop and asserts that the sheet stays; then a tap on the backdrop closes it. Fix 27 names `workshop` `shareLink`. `docs/WORKSHOP.md` (Accessibility) tells the rule.
3. **nit, confirmed: `loadDesigns` is dead outside the tests.** Fixed, although it costs more than one line: the owner's rule is "delete what becomes dead". `store.ts` loses the line; `model.test.ts` and `ui.test.ts` read `loadShelf(…).designs`.
4. **nit, confirmed, not fixed: the touch-target selector has three copies** (`01.mjs`, `W13.mjs`, `W14.mjs`). One shared export costs more than one line in four files; no failure today.

Evidence (build folder `11/`): `npm test` through the lock, `test-review.log` (exit 0; the 50 node tests pass). `npm run check:browser workshop`: `check-review1.log` has "workshop: all groups pass", but the runner marks it FAIL because this ticket changed during the run; `check-review2.log` and `check-review3.log`, with no edits, pass (97.9 s, 97.6 s).
