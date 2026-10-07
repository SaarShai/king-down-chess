# 08: Both boards and Try it in view on a landscape phone

**What to build:** On a 568×320 phone the player sees both boards and Try it without a scroll, so they can edit and test at once. One media query, for landscape screens at most 500 px high, holds the numbers of the approved mockup: a 44 px header and a 49 px footer; a 120 px card column with an 84 px figure and no thermometer; the two boards side by side with 27 px cells (197 px boards), 14 px titles and no mode or forward line; the Apply-to select and the rest below, in the scroll. The fit function also caps the cell by height in short landscape and runs on an orientation change; its 24 px floor replaces the 28 px minimum of revision 3. Other layouts do not change.

**Blocked by:** 07

**Status:** ready-for-agent

Owner-approved: 2026-10-07 docs/specs/retro-2026-10-06/mockups/landscape-568x320-mockup.png (the thermometer hidden; 36 px header buttons and 28 px pen, eye and Take-by select, as in the mockup).

- [ ] At 568×320: both boards and Try it pass `insideViewport` with the scroll at the top; cells are 27 px; the thermometer, the mode lines and the forward lines are hidden.
- [ ] At 568×320, `minTarget` passes at 36 px for the header buttons, 28 px for the pen, the eye and the Take-by select, and 44 px for every other control.
- [ ] At 320×568, 390×844, 768×1024 and 1280×900: after a scroll to each board, the whole board passes `insideViewport`; Try it passes `insideViewport`; there is no sideways scroll.
- [ ] At all five sizes, each cell is 24 px or more.
- [ ] A turn from 320×568 to 568×320 and back refits the cells without a reload.
- [ ] At the four other sizes, the card and board boxes equal their boxes before this ticket (the builder records them first).
- [ ] The review's fix 11 (full grid at 568×320) now has a check.
- [ ] A 568×320 screenshot from the runner folder is in Comments, beside the mockup.
- [ ] `npm test` and `npm run check:browser workshop` pass.

**Verify:** `npm test`; `npm run check:browser workshop`

**Owns:** src/workshop/workshop.css, src/workshop/dialog.ts, tools/verify-workshop.mjs
