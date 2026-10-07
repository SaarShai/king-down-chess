# 04: Checks for the review fixes: sheets, keys, sharing and toasts

**What to build:** Six review fixes of 2026-10-06 get a browser check again, so that a later change cannot undo them in silence. A full shelf asks the player which design to delete and drops nothing (fix 2). Ctrl/Cmd+Z under a sheet does nothing (fix 4). When the clipboard refuses, a sheet shows the text, selected, to copy by hand (fix 20). In a choices panel, the arrow keys move the choice and Enter commits it (fix 23). A press on a dialog's padding that ends on the backdrop keeps the dialog (fix 27). Toasts clear on a screen change (fix 29). Where a check finds a fix broken, this ticket repairs the code.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [x] The `workshop` check has one named group per fix, each naming its fix number: 2, 4, 20, 23, 27 and 29.
- [x] Fix 2: with a full shelf, a new design asks "choose one to delete"; after the choice, the shelf holds the new design and every other design.
- [x] Fix 4: Ctrl+Z and Cmd+Z with a sheet open leave the saved design unchanged.
- [x] Fix 20: with the clipboard refused, Copy opens a sheet whose text is selected and holds the link.
- [x] Fix 23: in the + picker, a pill choice and a When choice, ArrowDown then Enter commits the next choice, with no mouse.
- [x] Fix 27: a press on a sheet's padding released on its backdrop keeps the sheet open.
- [x] Fix 29: a toast shown on the editor is gone after Back to home.
- [x] Each group fails once when the builder reverts its fix locally (noted in Comments, not committed).
- [x] `npm run check:browser workshop` passes; `npm test` passes.

**Verify:** `npm test`; `npm run check:browser workshop`

**Owns:** tools/verify-workshop.mjs; src/workshop/dialog.ts and src/workshop/store.ts only where a check finds a fix broken

## Comments

Builder, 2026-10-07, branch `build/workshop-finish-04`.

**What changed.** `tools/verify-workshop.mjs` gets six groups after the groups of ticket 03, one per fix, each named by its number. Each assertion message starts with "fix N:".

| Group | What it asserts |
|---|---|
| `fix2FullShelf` | 50 designs on the shelf; a new design shows "your shelf is full (50 designs)" and "Choose one to delete", and no design goes; the sheet lists 50; after Delete on `seed-7` the shelf holds the new design and the other 49 in order; the alert goes; the card says "Saved on this device" |
| `fix4UndoKeysUnderSheet` | Control+z and Meta+z under the Share sheet, the Why? sheet, the + picker and the When choices leave the saved design the same; with no sheet open, Control+z and Meta+z undo (so the keys are live) |
| `fix20CopyByHand` | with `Clipboard.writeText` refused (and no share function): Copy link, Copy as text and Send link each open "Copy this"; the text box has the focus, all its text is selected, and it holds the link (Copy as text ends with it) |
| `fix23KeyboardChoices` | the + picker: Enter opens it, ArrowDown goes to the first rule, ArrowDown again to the next, Enter adds that rule; the "also moves like" pill and its When: ArrowDown keeps the panel and the design, Enter commits, and the reopened panel shows the next choice checked |
| `fix27PressOnPadding` | a press on a point where the dialog itself is the target (the 16 px padding of Settings; the edge of the Share sheet, which has no padding) and a release on the backdrop keep each one open |
| `fix29ToastsClear` | "Link copied." shows on the editor; after Back the home shows no toast |

**A fix found broken (repaired).** Fix 23 in the + picker: the arrow keys did nothing (red: "ArrowDown goes to the first rule of the + picker", `undefined` against `step2`). The pill and When panels worked. `src/workshop/dialog.ts` `propertySheet` now moves the focus along the enabled `.ws-book-row` buttons on ArrowDown and ArrowUp (it wraps, as radio buttons do); Enter on a row is the button's own click. Commit `84d838a`.

**Each group fails once when its fix is reverted** (a local edit, `npx vite build`, the group alone against `vite preview` on 127.0.0.1, then `git checkout` of the file; nothing committed):

| Group | Local revert | Failure |
|---|---|---|
| `fix2FullShelf` | `store.ts`: a full shelf drops the oldest (`others.pop()` in place of `return 'full'`) | wait for `.ws-alert-del` timed out |
| `fix4UndoKeysUnderSheet` | `dialog.ts`: the keydown guard without the sheet and panel tests | "fix 4: Control+z under the Share sheet leaves the saved design" |
| `fix20CopyByHand` | `dialog.ts`: `copyText` shows a toast only when the clipboard refuses | wait for `.ws-copy-box` timed out |
| `fix23KeyboardChoices` | `dialog.ts`: a radio change commits with no pointer test; and before the repair, the + picker | "fix 23: a pill choice: ArrowDown keeps the panel open"; "ArrowDown goes to the first rule of the + picker" |
| `fix27PressOnPadding` | `src/dialog-dismiss.ts` without the `inside()` line | "a press on Settings's padding ..."; with the Settings part left out, "a press on the Share sheet's padding ..." |
| `fix29ToastsClear` | `dialog.ts`: `show()` without the two toast lines | "fix 29: Back to home clears the toast" 1 !== 0 |

**Runs.** Before the merge: `npm test` green (vitest 62 files, 1202 tests; node tests 42 of 42); `npm run check:browser workshop`: ok 39.6 s, all 1 passed, no changed tracked file. After the merge of the integration tip `743d3cd` (merge `7ce8ff2`): `npm run check:browser workshop` ok 43.0 s, all 1 passed; `npm test` green on the second run (vitest 62 files, 1210 tests; node tests 42 of 42). The first run after the merge failed only the known judge time-out ("keeps the line within 90 characters", 5 s) at a load average near 28.

**For ticket 06.** Esc in the + picker still closes the Workshop; the fix 4 and fix 23 groups close a panel with its × button, not Esc.
