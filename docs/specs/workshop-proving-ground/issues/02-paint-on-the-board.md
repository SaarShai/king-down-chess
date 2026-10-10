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

1. [ ] **`src/workshop/model.ts`: `brushMark(mark, brush): Mark | null`**, pure, beside `setMark` (`:236-241`). `brush` is `move | take | both | shot | erase`. Move, Take and Both give the whole mark. Shot is `setMark(mark, 'shoot', true)`, so there is no second channel table: none or take → `shoot`; move or both → `moveShoot` (spec decision 34; the mockup gives `shot` on Both, `proving-ground.html:1779`). Erase gives null (the square goes). `ground.ts` applies it to each square of `orbit` (`:77`). Unit tests in `model.test.ts`.
2. [ ] **`src/workshop/ground.ts`: brush mode.**
   - A brush tile (or the keys 1, 2, 3; B for brush mode) arms a brush; the armed tile has a gold ring. Done or Esc leaves brush mode.
   - In brush mode the board shows the design alone on d4 (`designScene`, `:781`: `sceneOf` on an empty board); lines show 3 squares out, then an arrow.
   - A tap paints with the mirror set (`orbit`). The same paint again changes nothing; the tile pulses.
   - A tap more than 3 squares out: a lock and the toast "Reach ends 3 squares out." (`:1768`). A tap on a mark that only a rule makes: "A rule makes this mark. Tap its seal." (`:1770`).
   - Nubs: 8 buttons round d4, hit area 24 × 24 px or more (decision 9); a tap switches that line and its Mirror partners through `lineOrbit` (`model.ts:83`; spec decision 35: the mockup switches one line, `proving-ground.html:1803`).
   - Mirror starts at the preset's `paintOn` (`Preset.paintOn`, `model.ts:97`; the type is `PaintOn`, `:63`); a new piece starts at `BLANK`'s `all`.
   - Desktop: the tools under the brushes (`#tools`, `:1299-1312`) and the hint line. Phone: the brush row (40 px tiles on 48 px buttons) and the tools in a popover over it.
3. [ ] **The first edit makes the copy.** A pool piece opens as `fromPreset(p)` (`model.ts:128`) and is not saved. The first change gives `name` "My <Name>" ("My <Name> 2" and on when the shelf holds that name), `named: true`, a letter from `letterOf` (`names.ts:45`), and saves it.
4. [ ] **Change, save and undo in `ground.ts`** (decision 33: its own copy until ticket 11).
   - `change(label, f)` and `undo()` as `dialog.ts:315-331`: at most 50 steps; the label is the scope ("paint", "line", "rule", "look", "name").
   - Each change calls `saveDesign` (`store.ts:27`). A full shelf: "Not saved: your shelf is full (50 designs). Delete one to keep this piece." with "Choose one to delete"; a refusal: "Try again". Both offer "Copy link". The words are those of `dialog.ts:140-167`.
   - Top bar: "Undo <scope>" and Share show only after the first edit (`renderTop`, `:952-969`; a new player has nothing to undo or share); Ctrl/Cmd+Z (not in a text field, not under a sheet). After an undo, the toast "Undone: <scope>." (`:1981`).
5. [ ] **Paint diff: `diffOf(d, presetOf(d.from[0]))` in `src/workshop/scene.ts`** (pure), only when `d.from[0]` is set (a copy); a new piece has no diff (`presetOf` gives `BLANK` for any other key, `model.ts:122`). Marks that are new or changed get a quill pip; original marks that are gone show as dashed outlines (scene `diff: '+' | '-'`, `paintDiff`, `proving-ground.html:875`). Port the diff drawing of `marks.js` into `src/workshop/marks.ts`, over the legend tiles: the dashed outline and the quill pip of `tileWash` (`marks.js:310`, `:340-347`) and the `kdm-ghost` class (`:1025`).
6. [ ] **Weigh.** After the first edit, a Weigh button in the name band opens a popover: "About N pawns (estimate). <Band word>." and the like line, from `judge(d, false)` (`judge.ts:286`; `false` skips the Why parts, the fixes and the rule deltas that A does not show), `bandOf` (`:178`) and the verdict's `like` (`likeLine`, `:260-271`) (decision 13). On the phone, Weigh is in the ⋯ menu and the result is a toast (`proving-ground.html:968`, `:1993`).
7. [ ] **Share as a link.** The top bar's Share copies `${location.origin}${location.pathname}?design=${designCode(d)}` (`model.ts:191`) with the toast "Link copied."; where the clipboard refuses, a sheet to copy by hand (the words of `dialog.ts:170-178`). The share card comes in ticket 08. On the phone, Share is in the ⋯ menu.
8. [ ] **Check groups in `tools/verify-proving-ground.mjs`:**
   - `paint`: each brush, Shot on a move gives `moveshot`, Eraser, Mirror in its three modes, the same paint twice, the reach toast, a nub switches a line.
   - `firstCopy`: the first paint on the Pawn makes "My Pawn" in "Yours"; a reload keeps it; the pool Pawn stays the same.
   - `undo`: the Undo button names its scope; Ctrl/Cmd+Z undoes; it does nothing under a sheet.
   - `saveAlerts`: 50 seeded designs → the full-shelf alert → delete one → saved; a storage that throws → "Try again"; Copy link.
   - `shareLink`: the clipboard holds a `?design=` link that opens the same design; a refused clipboard opens the copy sheet.
   - `weigh`: the popover words.
9. [ ] **W14 states:** `paint` (Both armed), `painted` (My Pawn with the diff), `weigh`, `phone-tools`.

## Verification

- [ ] `npm test` passes, with the `brushMark` tests in `model.test.ts` and the golden fixtures of ticket 01.
- [ ] `npm run check:browser proving-ground` passes three times; `workshop` and `workshop-cast` still pass.
- [ ] W14 renders at 1440 × 900 and 390 × 844, beside the mockup's `paint` and `painted` states.
- [ ] The owner sees the renders before the merge; the ticket records his words and the date.

## Risks

- The first-copy rule changes when a design is saved: today each new design saves at once. A pool piece that is only looked at must not fill the shelf.
- Two copies of the save plumbing live until ticket 11; keep the words the same.

## Does not do

- No drag strokes (decision 8). No rule edits (03). No Why tag (05). No Try with (06). No rename, look or design menu (07). No share card (08).
