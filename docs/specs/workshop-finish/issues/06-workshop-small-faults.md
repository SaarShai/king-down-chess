# 06: Fix the small Workshop faults: Esc in a panel, gauge words, Surprise me glow

**What to build:** Three small faults go. In a choices panel (the + picker, a pill or a When), Esc closes only the panel and puts focus back on the button that opened it; the Workshop stays open. The thermometer's screen-reader text agrees with the summary, for example "about 1 pawn, the unit of worth". Surprise me adds no glow, so a save holds nothing the player cannot see. The glow field stays in the design, so old saves and links that hold a glow still load.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] The dialog's keydown listener handles Escape while a choices panel is open: the panel closes, the Workshop stays open, and focus is on the opener (the + tile, the pill or the When button).
- [ ] The `workshop` check presses Esc in each of the three panels and asserts the above; a second Esc then closes the Workshop.
- [ ] The art test asserts the gauge value text: a Pawn gives "about 1 pawn, the unit of worth"; a Knight gives "about 3½ pawns, fair".
- [ ] The `workshop` check presses Surprise me five times and asserts that no saved design holds a glow.
- [ ] A model test asserts that a stored design and a share code with a glow still load.
- [ ] `npm test` and `npm run check:browser workshop` pass.

**Verify:** `npm test`; `npm run check:browser workshop`

**Owns:** src/workshop/dialog.ts, src/workshop/art.ts, src/workshop/ui.test.ts, src/workshop/model.test.ts, tools/verify-workshop.mjs
