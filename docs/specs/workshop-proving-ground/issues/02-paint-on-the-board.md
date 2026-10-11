# 02 · Paint on the board

Status: ready-for-agent
Size: M
Blocked by: 01

## Scope

- The board is the editor: brush mode with Move, Take and Both, the Shot tool, the Eraser, Mirror (Mirror, All 8, One) and Done; 8 line nubs round d4; the reach lock at 3 squares.
- The first edit on a pool piece makes the private copy "My Pawn" (decision 7). The name band shows "Yours · from Pawn"; the copy joins "Yours" on the ledge.
- Each change saves. The save alerts, Undo with its scope, Ctrl/Cmd+Z, the paint diff, Weigh, and Share as a copied link.
- Mockup states `paint`, `painted` (`proving-ground.html:2107`); functions `enterBrush` (`:1742`), `toggleLine` (`:1803`), `makeCopyIfNeeded` (`:1788`), `paintDiff` (`:875`), Weigh (`:1094-1098`).

## Plan

1. [x] **`src/workshop/model.ts`: `brushMark(mark, brush): Mark | null`**, pure, beside `setMark` (`:236-241`). `brush` is `move | take | both | shot | erase`. Move, Take and Both give the whole mark. Shot is `setMark(mark, 'shoot', true)`, so there is no second channel table: none or take → `shoot`; move or both → `moveShoot` (spec decision 34; the mockup gives `shot` on Both, `proving-ground.html:1779`). Erase gives null (the square goes). `ground.ts` applies it to each square of `orbit` (`:77`). Unit tests in `model.test.ts`.
2. [x] **`src/workshop/ground.ts`: brush mode.**
   - A brush tile (or the keys 1, 2, 3; B for brush mode) arms a brush; the armed tile has a gold ring. Done or Esc leaves brush mode.
   - In brush mode the board shows the design alone on d4 (`designScene`, `:781`: `sceneOf` on an empty board); lines show 3 squares out, then an arrow.
   - A tap paints with the mirror set (`orbit`). The same paint again changes nothing; the tile pulses.
   - A tap more than 3 squares out: a lock and the toast "Reach ends 3 squares out." (`:1768`). A tap on a mark that only a rule makes: "A rule makes this mark. Tap its seal." (`:1770`).
   - Nubs: 8 buttons round d4, hit area 24 × 24 px or more (decision 9); a tap switches that line and its Mirror partners through `lineOrbit` (`model.ts:83`; spec decision 35: the mockup switches one line, `proving-ground.html:1803`).
   - Mirror starts at the preset's `paintOn` (`Preset.paintOn`, `model.ts:97`; the type is `PaintOn`, `:63`); a new piece starts at `BLANK`'s `all`.
   - Desktop: the tools under the brushes (`#tools`, `:1299-1312`) and the hint line. Phone: the brush row (40 px tiles on 48 px buttons) and the tools in a popover over it.
3. [x] **The first edit makes the copy.** A pool piece opens as `fromPreset(p)` (`model.ts:128`) and is not saved. The first change gives `name` "My <Name>" ("My <Name> 2" and on when the shelf holds that name), `named: true`, a letter from `letterOf` (`names.ts:45`), and saves it.
4. [x] **Change, save and undo in `ground.ts`** (decision 33: its own copy until ticket 11).
   - `change(label, f)` and `undo()` as `dialog.ts:315-331`: at most 50 steps; the label is the scope ("paint", "line", "rule", "look", "name").
   - Each change calls `saveDesign` (`store.ts:27`). A full shelf: "Not saved: your shelf is full (50 designs). Delete one to keep this piece." with "Choose one to delete"; a refusal: "Try again". Both offer "Copy link". The words are those of `dialog.ts:140-167`.
   - Top bar: "Undo <scope>" and Share show only after the first edit (`renderTop`, `:952-969`; a new player has nothing to undo or share); Ctrl/Cmd+Z (not in a text field, not under a sheet). After an undo, the toast "Undone: <scope>." (`:1981`).
5. [x] **Paint diff: `diffOf(d, presetOf(d.from[0]))` in `src/workshop/scene.ts`** (pure), only when `d.from[0]` is set (a copy); a new piece has no diff (`presetOf` gives `BLANK` for any other key, `model.ts:122`). Marks that are new or changed get a quill pip; original marks that are gone show as dashed outlines (scene `diff: '+' | '-'`, `paintDiff`, `proving-ground.html:875`). Port the diff drawing of `marks.js` into `src/workshop/marks.ts`, over the legend tiles: the dashed outline and the quill pip of `tileWash` (`marks.js:310`, `:340-347`) and the `kdm-ghost` class (`:1025`).
6. [x] **Weigh.** After the first edit, a Weigh button in the name band opens a popover: "About N pawns (estimate). <Band word>." and the like line, from `judge(d, false)` (`judge.ts:286`; `false` skips the Why parts, the fixes and the rule deltas that A does not show), `bandOf` (`:178`) and the verdict's `like` (`likeLine`, `:260-271`) (decision 13). On the phone, Weigh is in the ⋯ menu and the result is a toast (`proving-ground.html:968`, `:1993`).
7. [x] **Share as a link.** The top bar's Share copies `${location.origin}${location.pathname}?design=${designCode(d)}` (`model.ts:191`) with the toast "Link copied."; where the clipboard refuses, a sheet to copy by hand (the words of `dialog.ts:170-178`). The share card comes in ticket 08. On the phone, Share is in the ⋯ menu.
8. [x] **Check groups in `tools/verify-proving-ground.mjs`:**
   - `paint`: each brush, Shot on a move gives `moveshot`, Eraser, Mirror in its three modes, the same paint twice, the reach toast, a nub switches a line.
   - `firstCopy`: the first paint on the Pawn makes "My Pawn" in "Yours"; a reload keeps it; the pool Pawn stays the same.
   - `undo`: the Undo button names its scope; Ctrl/Cmd+Z undoes; it does nothing under a sheet.
   - `saveAlerts`: 50 seeded designs → the full-shelf alert → delete one → saved; a storage that throws → "Try again"; Copy link.
   - `shareLink`: the clipboard holds a `?design=` link that opens the same design; a refused clipboard opens the copy sheet.
   - `weigh`: the popover words.
9. [x] **W14 states:** `paint` (Both armed), `painted` (My Pawn with the diff), `weigh`, `phone-tools`.

## Verification

- [x] `npm test` passes, with the `brushMark` tests in `model.test.ts` and the golden fixtures of ticket 01.
- [x] `npm run check:browser proving-ground` passes three times; `workshop` and `workshop-cast` still pass.
- [x] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `paint` and `painted` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The first-copy rule changes when a design is saved: today each new design saves at once. A pool piece that is only looked at must not fill the shelf.
- Two copies of the save plumbing live until ticket 11; keep the words the same.

## Does not do

- No drag strokes (decision 8). No rule edits (03). No Why tag (05). No Try with (06). No rename, look or design menu (07). No share card (08).

## Comments

### 2026-10-10: built (branch `claude/proving-ground`)

- Step 1: `brushMark` in `src/workshop/model.ts`, with a test of each brush on each mark in `model.test.ts`.
- Steps 2 to 4, 6 and 7: `src/workshop/ground.ts` and `src/workshop/ground.css`.
- Step 5: `diffOf` in `src/workshop/scene.ts` (test in `scene.test.ts`). In `src/workshop/marks.ts`: the quill pip on a new or changed mark, the dashed outline of a mark that is gone, the `kdm-ghost` class, and the `lock`, `lockOpen`, `eraser` and `scale` sigils, `mirrorIcon` and `nub`.
- Step 8: the groups `paint`, `firstCopy`, `undo`, `saveAlerts`, `shareLink` and `weigh` in `tools/verify-proving-ground.mjs`.
- Step 9: the states `paint`, `painted`, `weigh` and `phone-tools` in `docs/specs/web-redesign/samples/W14.mjs`.

Changes from the ticket, with the reasons:

- A design from a link stays read only, as in ticket 01: its brushes are not buttons, and the keys 1, 2, 3 and B do nothing. The `link` group holds this.
- An undo back before the first edit deletes the copy from the shelf and opens the pool piece again. Without this, a copy with no edit stays on the shelf.
- A nub step has the scope "line", from the list of step 4. The mockup calls it "paint".
- On the phone, the ⋯ menu of the top bar shows after the first edit only. It holds Share and Weigh, and both wait for the first edit. The mockup's "Words on" item is not in this ticket.
- On the phone, a square is about 45 px. The nubs are 24 px, 0.4 square from the centre of d4 (the mockup's places), so two nubs side by side overlap by about 5 px. Each nub keeps a 24 px hit area.
- The board has the class `armed` in brush mode, not the mockup's `brush`, because `.brush` styles the brush tiles.
- The name row wraps: a long name keeps its line, and the Yours tag and Weigh go under it. "My Pawn" keeps one line with both.
- The bold line of Weigh holds the words of step 6, so it is longer than the mockup's line (three lines at 18 px).
- The pulse of a painted tile skips a dashed outline: the end of the pulse would show the outline at full strength.
- The check's `marks()` helper skips the dashed outlines (a mark that is gone). No old result changes: a pool piece and the two stored designs have no outline.

Evidence (S = `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/02-paint`):

- `npm test` through the shared lock: 113 test files passed and 1 skipped, 1,859 tests passed and 21 skipped, the node tests 50 of 50, `exit 0`, two runs (the second after the ticket text). Logs: `S/npm-test-1.log` and `S/npm-test-2.log`.
- `npm run check:browser proving-ground workshop workshop-cast`: all 3 passed (18.5, 79.5 and 12.4 s). Logs: `S/check-1.log` (the runner), `S/pg-run-1.log`, `S/old-workshop.log` and `S/old-workshop-cast.log`.
- `npm run check:browser proving-ground`, two more runs: each "ok proving-ground" (24.8 and 22.3 s), "proving-ground: all groups pass". Logs: `S/check-2.log`, `S/check-3.log`, `S/pg-run-2.log` and `S/pg-run-3.log`.
- The check's own screens: `S/check/` (`paint-1440x900.png`, `painted-1440x900.png`, `weigh-1440x900.png`, `phone-tools-390x844.png` and the layouts).
- `SAMPLE=W14 node docs/specs/web-ux/capture.mjs` on a Vite dev server of this worktree (port 5183, stopped by its PIDs after): 24 renders, 0 with a fault. Renders: `S/w14/<state>-desktop.png` and `S/w14/<state>-phone.png`; log `S/w14.log`.
- The build beside the mockup, both from the same server, with reduced motion: `S/build-<state>-<size>.png` beside `S/mock-<state>-<size>.png` for `paint` and `painted` at 1440 and 390, `weigh` at 1440 and `phone-tools` at 390. The differences that stay are in the list above, or they are parts of later tickets: the rule tag on the asleep d6 tile and the short rule lines (ticket 01's list), "Add a rule" and the "+" seal (03), the "Try board" tag and the Try with tray (06), NEW and the Kings, Cards and Rules tabs (07, 12 to 14), and the lock next to the name on the phone.

### 2026-10-10: the review

**Reviews** (one reader that did not write the diff, on the source; R = `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/08f2956c-63a7-4276-8738-a657bdb42b06/scratchpad/build/02-review`). Each finding was checked in the browser before the fix with `R/repro.mjs` (log `R/repro-before.log`) and after it (log `R/repro-after.log`):

1. Should-fix, `ground.ts` `undo()`: Undo did not look at the result of `deleteDesign()`. **Confirmed**: with "My Pawn" saved and a storage that refuses each write, Undo showed "Undone: paint." and the pool Pawn, but the shelf and the ledge still held "My Pawn" (case 1). **Fix**: Undo deletes the copy before the step goes. Where the device refuses, the copy stays open, its step stays, and the toast says "Could not undo: this device refused." A copy that is not on the shelf (its first save failed) needs no delete, so its undo still works. The `undo` group holds the case.
2. Should-fix, `ground.ts` click handler: Share and the phone's Weigh called `renderTop()`, which replaced the button with the focus. **Confirmed**: after Enter on Share, and after Enter on Weigh or Share in the phone's ⋯ menu, the focus was on the page body (cases 2a to 2c). **Fix**: Share and Weigh do not draw the top bar again; a choice in the ⋯ menu closes it and gives the focus back to ⋯. The `shareLink` group presses Enter on Share; the `weigh` group uses Weigh and Share in ⋯ with the keys only.
3. Should-fix, `verify-proving-ground.mjs` `shareLink`: the check opened `?workshop=a&design=<code>`, not the copied link. **Confirmed**: the copied link has no `workshop=a`, so it opens the old Workshop, which the check did not look at (case 3). **Fix**: the check opens the copied link unchanged and finds "My Pawn" on the old Workshop's card, with c5, d5 and e5 as moves (a pool Pawn has d5 only). The Proving Ground step with the same code stays and compares the marks.

Evidence:

- `npm test` through the shared lock. Run 1: 1 test failed, a time-out (5.4 s of 5 s) in `src/rules/power-fixes.test.ts`, which this change does not touch, with a load average of 24 on this Mac (`R/npm-test-1.log`). Run 2: 113 test files passed and 1 skipped, 1,859 tests passed and 21 skipped, the node tests 50 of 50, `exit 0` (`R/npm-test-2.log`). Run 3, with this review text: the same counts, `exit 0` (`R/npm-test-3.log`).
- `npm run check:browser proving-ground workshop workshop-cast`: `workshop` and `workshop-cast` passed (77.7 and 8.6 s); `proving-ground` failed on a wrong selector in the new share step: the old Workshop's read card has `.ws-grid`, not `.ws-board` (`R/check-1.log`, `R/pg-run-1.log`, `R/old-workshop.log`, `R/old-workshop-cast.log`).
- After the selector fix, `npm run check:browser proving-ground` three times: each "ok" (18.0, 18.0 and 18.1 s) and "proving-ground: all groups pass" (`R/check-2.log` to `R/check-4.log`, `R/pg-run-2.log` to `R/pg-run-4.log`).
- No render changes: the fixes change a failure toast and the focus only. The check's screens of the last run: `R/check/`.
