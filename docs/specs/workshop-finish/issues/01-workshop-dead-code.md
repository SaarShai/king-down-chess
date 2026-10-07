# 01: Remove the dead Workshop code and stale CSS

**What to build:** The Workshop holds only code that runs. The builder removes the dead functions, imports and unreachable branches that the retro lists, with their tests: the saved-card pictures, the floor, zone and crack drawings, the unused gauge argument, the token and crop branches of the figure, the never-made edit-sheet selector, the unread layout attribute, and the "gold plinth" words in the screen-reader summary. The builder also removes each stylesheet rule that matches no Workshop markup. A new CSS test keeps it so. This is a prefactor: the player sees no change. It also removes the five unused names that the checks-and-hooks spec needs before it turns on `noUnusedLocals`: `presetWorths`, `LEARN_LINE`, `MARK_WORDS`, `squareList` (the import) and `pats`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `npx tsc --noEmit --noUnusedLocals` reports no name in the Workshop folder.
- [ ] The dead SVG drawings and their tests are gone; the art test still asserts the model, the figure and the gauge that the card renders.
- [ ] The screen-reader summary names no plinth, floor, rim or glow.
- [ ] A new CSS test reads the Workshop stylesheet and asserts that each class it names occurs in the Workshop source. It fails when the builder adds a rule for an unused class (checked once by hand, then removed).
- [ ] The motion module stays as it is here; ticket 07 trims it.
- [ ] `npm test` passes.

**Verify:** `npx tsc --noEmit --noUnusedLocals`; `npm test`

**Owns:** src/workshop/dialog.ts, src/workshop/art.ts, src/workshop/look.ts, src/workshop/workshop.css, src/workshop/ui.test.ts, src/workshop/css.test.ts (new)
