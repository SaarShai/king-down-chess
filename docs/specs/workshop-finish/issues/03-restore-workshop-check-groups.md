# 03: Restore the dropped groups of the Workshop check

**What to build:** The `workshop` check measures the Workshop again, as it did before the rewrite. The builder restores each group of the old check at commits `84f9e42` and `8c91940` whose feature still exists, rewritten for the one-screen card. The groups for brushes, tabs, glows, Mix two, the Saved screen and the desktop editor column stay out, because those features are gone. The review-fix groups come in tickets 04 and 05, the motion group in 07 and the landscape group in 08. A player who opens the Workshop at each of the five sizes gets a page with no sideways scroll, 44 px controls, no overlap and no cut text; the doors in and out work; keys stay in the Workshop; the judge reacts to an edit; the shelf, the link and Try it work.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] At 320×568, 390×844, 768×1024 and 1280×900: `noSidewaysScroll`, `minTarget` (44 px), `noOverlap` and `textNotCut` pass on the card, a likely-overpowered design with its chip, and an 18-letter name.
- [ ] The game menu: New game, Guide, Workshop and Settings sit in one row, none cut or on top of another.
- [ ] A tap outside a dialog or sheet closes it, as Esc does; a drag from inside to outside keeps it open.
- [ ] The doors: the title, the menu and a link open the Workshop; Back returns to the caller; Esc closes a sheet first, then the Workshop; a sheet opens with focus on its heading.
- [ ] A key pressed in the Workshop does not reach the game (story 7): the game state is the same before and after.
- [ ] Knight plus "Takes again" takes at most 6 actions; the gauge and the worth line change. Rook plus "Takes again" shows "Possibly overpowered", the chip and one announcement; Undo restores them. The rule book shows the key to its numbers and a small change as ¼, not 0.
- [ ] The shelf: open a design, edit it, make a copy, send the link, delete one after its confirm. A shared link opens read-only; reload keeps the design. Try it and Share keep the edit state and the undo history.
- [ ] Try it: the Knight shows its 8 squares; a chain asks "Take again" or "Finish". A Pawn keeps its own words; a Paladin's warning opens "Why this warning?".
- [ ] Each restored group fails once when the builder breaks its feature on purpose (noted in Comments, not committed).
- [ ] `npm run check:browser workshop` passes; the runner reports no changed tracked file.

**Verify:** `npm run check:browser workshop`; `git show 84f9e42:tools/verify-workshop.mjs` and `git show 8c91940:tools/verify-workshop.mjs` for the old groups

**Owns:** tools/verify-workshop.mjs
