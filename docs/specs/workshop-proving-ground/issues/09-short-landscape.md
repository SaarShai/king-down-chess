# 09 · Short landscape

Status: ready-for-agent
Size: S
Blocked by: 03, 06, 07 (the side sheets hold 03's shelf and sentence card, 05's Why tag and 06's tray)

## Scope

- A layout for a phone held sideways: landscape and at most 500 px high (decision 23). Mockup A has none; today's Workshop has an approved one (`docs/specs/workshop-finish/issues/08-landscape-phone-layout.md`).
- Decided by delegation (owner, 2026-10-09): the board on the left at full height; one column on the right with the plinth strip (seals as buttons), the brush row and the tray; the ledge opens as a sheet from a "Pieces" button; the Why tag, the shelf and the sentence card open as side sheets.

## Plan

1. [x] **`src/workshop/ground.css`:** `@media (orientation: landscape) and (max-height: 500px)` with the grid above. The board side is the screen height minus the top bar; squares stay 24 px or more.
2. [x] **`src/workshop/ground.ts`:** the "Pieces" button opens the ledge sheet in this layout; the layout follows a turn of the device with no loss of state.
3. [x] **Check groups:** `layouts` adds 568 × 320 and 844 × 390 (`noSidewaysScroll`, `insideViewport`, `textNotCut`, `minTarget`: 44 px, and 24 px for squares, nubs and knots); `turnRefits` (portrait to landscape and back keeps the open design, the brush, an open tag and an open shelf).
4. [x] **W14:** the states `open-pawn`, `paint`, `stamp-preview` (the shelf as a side sheet), `why-d7` and `tray` also at `landscape` (844 × 390).

## Verification

- [x] `npm test` passes.
- [x] `npm run check:browser proving-ground` passes three times.
- [x] W14 renders at 844 × 390, 1440 × 900 and 390 × 844.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- At 568 × 320 the board is about 270 px; the nubs need their 24 px hit areas.

## Does not do

- No change to the wide and narrow layouts.

## Comments

### 2026-10-10 · built on `claude/proving-ground`

Evidence (the logs and the renders are outside Git, in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/09-landscape/`):

- `npm test`: exit 0. 115 test files pass (1 skipped); 1,895 tests pass (21 skipped). Log: `npm-test-2.log`, the run with this ticket text; `npm-test-1.log` is the run before the text (exit 0).
- `npm run check:browser proving-ground`: passes three times (59.3 s, 59.0 s, 59.1 s). Logs: `logs/pg-1.log` to `logs/pg-3.log`, and each run's `logs/check-N.proving-ground.log` ("proving-ground: all groups pass"). Three runs before the last change also pass (`logs/first/`). That change removed a `100vh` value of `--board` that did nothing: a custom property keeps its last value, with no test of it. The check's own renders of run 1: `check-1/` (for example `pawn-844x390.png`, `paladin-568x320.png`, `ledge-568x320.png`, `why-844x390.png`, `shelf-568x320.png`, `paint-568x320.png` and `turn-the-shelf-844x390.png`).
- `layouts` has eight sizes. At 844 × 390 and 568 × 320 it also checks that Pieces shows (and at the six other sizes that it does not), that a choice closes the ledge's sheet, that the board is as high as the screen less 56 px and on the left of the column, that the plinth strip, the brush row, Pieces and (on the second open) the tray are in the screen, and that no text in the column is cut. Then, on the Paladin: the ledge's sheet (in the screen, 44 px buttons, the focus on the open slot, `aria-expanded`; S does nothing; Esc closes the sheet and not the Workshop, and the focus goes back to Pieces; a tap outside closes it and does nothing else); the Why tag of d7 as a side sheet (in the screen, no cut text, 44 px buttons, the plinth strip and the tray inert; Pieces opens its sheet over the tag, and Esc closes only the sheet); the Pawn's shelf with Moves like picked as a side sheet (the preview, the sentence card and Stamp in the screen, 44 px buttons); brush mode (24 px nubs; each nub takes a tap on 60% or more of its 24 px circle; no nub covers the centre of a square round d4; the tools in the screen; 44 px buttons).
- Knots: short landscape has none, as on the phone (the knots stand in the wide plinth only), so the 24 px test of the knots stays at the three wide sizes. `probe/knots.mjs` counts 0 knots on the Paladin at 844 × 390 and 568 × 320, and 1 at 1440 × 900.
- `turnRefits` starts at 390 × 844 and turns to 844 × 390 and back four times: with the brush armed and c5 painted, with the Why tag of d6 open, with the shelf open and Moves like picked, and with the Board tab open. At each size the board has its new size and draws its squares for that size, it is in the screen with no sideways scroll, and the ledge shows only upright. The name, the brush, the nubs, the marks, the tag, the seal, the preview, the tray and the Board tab stay the same.
- A check that fails without its fix: with the old line in `renderWhy` (the ledge inert under a side sheet), `layouts` fails with "844x390: the sheet over the tag takes the focus and taps" (`only-neg.log`). With the fix, `layouts` and `turnRefits` pass (`only-3.log`).
- W14: `SAMPLE=W14 node docs/specs/web-ux/capture.mjs http://127.0.0.1:5183/ /private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/09-landscape/w14` makes 89 renders with 0 faults (`w14.log`): the five states of step 4 also at `landscape` (`w14/open-pawn-landscape.png`, `paint-landscape.png`, `stamp-preview-landscape.png`, `why-d7-landscape.png` and `tray-landscape.png`; all five on one sheet: `w14-landscape-sheet.png`), and each state at 1440 × 900 and 390 × 844 as before.
- The wide and narrow layouts do not change. The five states at 1440 × 900 and 390 × 844 on the last commit (`before/`) and on this change (`final/`) differ by 0 pixels at a fuzz of 2%, less 37 pixels in `tray-390x844` (`final/compare.txt`). These pixels are noise at line edges: a second render of the last commit (`before2/`) has the same 37 pixels and is equal to this change, and `why-d7-390x844` changes by 5 pixels from one render of the same code to the next (`final/noise.txt`).
- Beside the mockup: mockup A has no landscape form (at 844 px wide it shows its desktop, made smaller). The pairs at 1440 × 900 and 390 × 844 (`pairs/side-*.png`) do not change, so the comparisons of tickets 05, 06 and 18 stay true. `pairs/*-844x390-build.png` are the landscape renders of the build.
- The changed CSS rules select only classes of the Proving Ground, so this ticket does not run the check of the old Workshop.

Changes from the ticket, each with its reason:

1. The narrow media query (`ground.css` and `ground.ts`) also takes short landscape: `(max-width: 999px), (orientation: landscape) and (max-height: 500px)`. Short landscape keeps the parts of the phone form (the top bar, the plinth, the brush row, the sheets) and puts its own grid on them. So a window 1000 px or wider and at most 500 px high also gets the short landscape layout, as decision 23 says (landscape and the height only).
2. Pieces is in the top bar, after ‹ Menu, because at 568 × 320 the column has no space for it. It shows only in short landscape. It has `aria-expanded` and `aria-controls`.
3. The ledge's sheet is a bottom sheet over the screen, 198 px high, with the Pieces tab only. A choice, Pieces, Esc and a tap outside it close it; that tap does nothing else. While it shows, the board and the column are inert, and of the keys only Esc acts. The focus goes to the open slot when it opens, and back to Pieces when it closes. It goes over an open side sheet, which stays open under it.
4. The tray stands at the foot of the column with the desktop rule: it waits on the first open of a pool piece until a change (ticket 06). It has no "Try with" heading, as on the phone, because at 568 × 320 the column has no space for it.
5. The Why tag, the shelf and the rule card are side sheets from the top bar to the foot of the screen, and from the right edge of the board to the right edge of the screen. They cover the plinth strip and the column, so the plinth strip is inert under them, and the tag also makes the tray inert. They have no grab bar.
6. The board side is `min(100dvh - 56px, 100vw - 300px)`: the top bar stays 48 px, with a 4 px gutter above and below the board, and the column keeps 264 px or more. At 844 × 390 the board is 334 px (squares of 41.75 px); at 568 × 320 it is 264 px (squares of 33 px). The Risk said "about 270 px".
7. The nubs: on a square under 45 px, the ring of nubs keeps the size of the 390 px phone (`max(12.5%, 45px)`). With a ring of 12.5% the nubs touched at 568 × 320, and the n nub took a tap on 11% of its circle only. Now each nub takes a tap on 64% or more of its circle at 844 × 390 and at 568 × 320, as at 390 × 844. The place of a nub moved from the inline style to CSS (`--x` and `--y`), so that the media query can change it; the wide and narrow places do not change.
8. The brush row (54 px), the tray tokens (56 px) and two gaps are a little smaller than on the phone, so that the plinth strip of a design ("Yours · from Pawn"), the brush row and the tray fit the column at 568 × 320 with no scroll (173 of 173 px).
9. A turn closes only the ledge's sheet. The design, the brush, the tag, the shelf, the tray tokens and the Board tab stay; back upright, the Board tab is still open.
10. `capture.mjs` also reads `sizes` on a state (the table's `sizes` stay the default), so the five W14 states render at `landscape` and the others do not. The README of the samples gives the new field. W14's `piece()` opens the sheet from Pieces when the ledge is hidden.

Open problems:

- The owner has not seen the renders (the last Verification box).
- At 568 × 320 an 18-letter name takes two lines, and the column is 4 px too high (158 of 154 px), so it scrolls 4 px.
- At 568 × 320 the shelf with a picked seal has about 37 px for the seal groups above the sentence card, and the groups scroll; at 844 × 390 they have about 110 px.
- At 320 × 568 (the narrow layout, which this ticket does not change) the n nub takes a tap on 22% of its circle only.
- Mockup A has no landscape form, so the landscape renders have no mockup pair.

### Reviews

One independent reader (read only) gave one should-fix finding. The probe, the logs and the renders are in `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/09-review/`. `probe/only.sh <group ...>` runs only the named groups of a copy of the check against a dev server on port 5183.

1. **Should-fix, confirmed, fixed: in short landscape, ‹ Menu closed the Workshop while the ledge's sheet was open (`ground.ts`).** ‹ Menu stands in the top bar, which is not inert under the sheet. Its own `onclick` closed the dialog before the tap-outside guard of the dialog's click listener ran. Fix: with the sheet open, ‹ Menu calls `closeLedge()` (the sheet closes and the focus goes back to Pieces); with the sheet closed, it closes the Workshop as before. Browser check: `layouts` (in `landscape()`, at 844 × 390 and 568 × 320) opens the sheet, taps ‹ Menu, and finds the sheet closed and the Workshop open. Before the fix this step fails: "844x390: a tap on ‹ Menu closes the sheet, not the Workshop" (the Workshop count is 0; `only-neg.log`). After the fix, `layouts`, `opens` (‹ Menu still closes the Workshop) and `turnRefits` pass (`only-fix.log`). The other buttons of the top bar go through the guard, and the board and the column are inert, so ‹ Menu was the only path.

Evidence after the fix (in the same `09-review/` folder):

- `npm test`: exit 0. 115 test files pass (1 skipped); 1,895 tests pass (21 skipped). Log: `npm-test.log`; `npm-test-2.log` is the run after this text.
- `npm run check:browser proving-ground`: passes three times (59.4 s, 59.2 s, 59.7 s). Logs: `logs/pg-1.log` to `logs/pg-3.log`, and each run's `logs/check-N.proving-ground.log` ("proving-ground: all groups pass"). The check's own renders of run 1: `check-1/`.
- The fix changes no render: it changes only what a tap on ‹ Menu does, and no W14 state taps ‹ Menu. So the W14 renders and the pairs beside the mockup stay as above.
