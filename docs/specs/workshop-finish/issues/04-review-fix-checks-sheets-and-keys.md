# 04: Checks for the review fixes: sheets, keys, sharing and toasts

**What to build:** Six review fixes of 2026-10-06 get a browser check again, so that a later change cannot undo them in silence. A full shelf asks the player which design to delete and drops nothing (fix 2). Ctrl/Cmd+Z under a sheet does nothing (fix 4). When the clipboard refuses, a sheet shows the text, selected, to copy by hand (fix 20). In a choices panel, the arrow keys move the choice and Enter commits it (fix 23). A press on a dialog's padding that ends on the backdrop keeps the dialog (fix 27). Toasts clear on a screen change (fix 29). Where a check finds a fix broken, this ticket repairs the code.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [ ] The `workshop` check has one named group per fix, each naming its fix number: 2, 4, 20, 23, 27 and 29.
- [ ] Fix 2: with a full shelf, a new design asks "choose one to delete"; after the choice, the shelf holds the new design and every other design.
- [ ] Fix 4: Ctrl+Z and Cmd+Z with a sheet open leave the saved design unchanged.
- [ ] Fix 20: with the clipboard refused, Copy opens a sheet whose text is selected and holds the link.
- [ ] Fix 23: in the + picker, a pill choice and a When choice, ArrowDown then Enter commits the next choice, with no mouse.
- [ ] Fix 27: a press on a sheet's padding released on its backdrop keeps the sheet open.
- [ ] Fix 29: a toast shown on the editor is gone after Back to home.
- [ ] Each group fails once when the builder reverts its fix locally (noted in Comments, not committed).
- [ ] `npm run check:browser workshop` passes; `npm test` passes.

**Verify:** `npm test`; `npm run check:browser workshop`

**Owns:** tools/verify-workshop.mjs; src/workshop/dialog.ts and src/workshop/store.ts only where a check finds a fix broken
