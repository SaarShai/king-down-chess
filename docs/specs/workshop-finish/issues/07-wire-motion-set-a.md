# 07: Play an approved reaction on each edit

**What to build:** The player sees the card react to each edit, Undo or rename: the gait and cross-fade when the figure changes (A1), a shake when the design becomes overpowered (A4), and a gold ring (A5). A reaction ends within 600 ms (300 ms at Fast), stops at the next action, and ends at the still size, so nothing jumps. With reduced motion or Animations Off, no reaction plays, and a running one stops. Today the reaction code has no caller and would throw on the thermometer. The builder trims the motion module to A1, A4 and A5, whose targets the card renders; makes each keyframe end at the still transform with no worth scale; gives the model element a position so the fading copy lies over it and the ring anchors to it; keeps the last look and verdict in the dialog; ends the render with the reaction, except on a first render; and makes a rename render one time. The review's fix 26 is then "superseded" for its gradients and seams.

The builder first probes happy-dom for `Element.animate` and `document.getAnimations`, in a scratch folder outside the checkout. If the probe passes, this ticket adds a dependency: happy-dom joins the dev dependencies (the builder installs a real copy first, never `npm ci` through the linked folder), and a DOM test under happy-dom asserts stories 1 to 3. If it fails, the `workshop` check asserts them from the animation end times.

**Blocked by:** 06; checks-and-hooks/01 (the package file and its dev dependencies, so that the happy-dom line can join them when the probe passes)

**Status:** ready-for-agent

- [ ] The probe result (pass or fail, with the happy-dom version) is in Comments, and the test sits at the matching seam.
- [ ] An edit, an Undo and a rename each start one reaction; the first render of a design starts none.
- [ ] A second edit during a reaction stops the first; no animation of the first remains.
- [ ] Every animation ends by 600 ms at normal pace and by 300 ms at Fast, and the figure's transform at the end equals its still transform.
- [ ] With `prefers-reduced-motion: reduce`, and with Animations Off, an edit starts no animation; a switch to either during a reaction stops it (`noRunningAnimations` passes).
- [ ] The motion module holds only A1, A4 and A5 and reads no selector that the card does not render; an edit with motion on throws no error (`assertNoErrors`).
- [ ] `npm test` and `npm run check:browser workshop` pass.

**Verify:** `npm test`; `npm run check:browser workshop`

**Owns:** src/workshop/motion.ts, src/workshop/dialog.ts, src/workshop/workshop.css, src/workshop/motion.test.ts (new, if the probe passes), tools/verify-workshop.mjs; package.json and package-lock.json (the happy-dom line only, if the probe passes). Shared files: checks-and-hooks/01 owns the dev dependencies and runs the same probe first; this ticket blocks on it and edits the happy-dom line only when that ticket did not keep it
