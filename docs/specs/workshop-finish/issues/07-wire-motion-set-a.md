# 07: Play an approved reaction on each edit

**What to build:** The player sees the card react to each edit, Undo or rename: the gait and cross-fade when the figure changes (A1), a shake when the design becomes overpowered (A4), and a gold ring (A5). A reaction ends within 600 ms (300 ms at Fast), stops at the next action, and ends at the still size, so nothing jumps. With reduced motion or Animations Off, no reaction plays, and a running one stops. Today the reaction code has no caller and would throw on the thermometer. The builder trims the motion module to A1, A4 and A5, whose targets the card renders; makes each keyframe end at the still transform with no worth scale; gives the model element a position so the fading copy lies over it and the ring anchors to it; keeps the last look and verdict in the dialog; ends the render with the reaction, except on a first render; and makes a rename render one time. The review's fix 26 is then "superseded" for its gradients and seams.

The builder first probes happy-dom for `Element.animate` and `document.getAnimations`, in a scratch folder outside the checkout. If the probe passes, this ticket adds a dependency: happy-dom joins the dev dependencies (the builder installs a real copy first, never `npm ci` through the linked folder), and a DOM test under happy-dom asserts stories 1 to 3. If it fails, the `workshop` check asserts them from the animation end times.

**Blocked by:** 06; checks-and-hooks/01 (the package file and its dev dependencies, so that the happy-dom line can join them when the probe passes)

**Status:** resolved

- [x] The probe result (pass or fail, with the happy-dom version) is in Comments, and the test sits at the matching seam.
- [x] An edit, an Undo and a rename each start one reaction; the first render of a design starts none.
- [x] A second edit during a reaction stops the first; no animation of the first remains.
- [x] Every animation ends by 600 ms at normal pace and by 300 ms at Fast, and the figure's transform at the end equals its still transform.
- [x] With `prefers-reduced-motion: reduce`, and with Animations Off, an edit starts no animation; a switch to either during a reaction stops it (`noRunningAnimations` passes).
- [x] The motion module holds only A1, A4 and A5 and reads no selector that the card does not render; an edit with motion on throws no error (`assertNoErrors`).
- [x] `npm test` and `npm run check:browser workshop` pass.

**Verify:** `npm test`; `npm run check:browser workshop`

**Owns:** src/workshop/motion.ts, src/workshop/dialog.ts, src/workshop/workshop.css, src/workshop/motion.test.ts (new, if the probe passes), tools/verify-workshop.mjs; package.json and package-lock.json (the happy-dom line only, if the probe passes). Shared files: checks-and-hooks/01 owns the dev dependencies and runs the same probe first; this ticket blocks on it and edits the happy-dom line only when that ticket did not keep it

## Comments

Build 2026-10-07, branch `build/workshop-finish-07`. The spec and the code agree; no change to the spec.

- **Probe: fail.** happy-dom 20.14.5, in a scratch folder outside the checkout: `Element.prototype.animate` is a function and `finished` settles, but `document.getAnimations` is `undefined`. This agrees with checks-and-hooks/01. Thus no dependency changes: `package.json`, `package-lock.json` and `src/workshop/motion.test.ts` stay as they are. The seam is the `workshop` browser check.
- **The test:** the group `motionSetA` in `tools/verify-workshop.mjs` (the last group; it prints "ok motion Set A: ..."). An init script records each `animate()` call in `#workshop`, one list for each reaction (the calls of one task). The group asserts, at 1280x900:
  - the first render of a new design starts no reaction; an edit, a second edit, Undo, a rename, a new figure, a new "moves like" and the Rook plus "Takes again" each start exactly one reaction, which runs (nothing stops it at once);
  - a second edit during a reaction leaves each animation of the first `idle` and out of `document.getAnimations()`;
  - each animation ends by 600 ms (by 300 ms at `data-pace="fast"`), each animation of `.ws-fig` has a last frame whose `DOMMatrix` is the identity, and 650 ms later `noRunningAnimations('#workshop .ws-model-box')` passes, no temporary element stays, and the figure's computed transform is `none`;
  - the fading copy has the same box as `.ws-model`; the gold ring's `offsetParent` is `.ws-model`; the overpowered reaction holds a shake;
  - with `reducedMotion: 'reduce'` and with `data-pace="off"`, an edit starts no reaction; a switch to either during a reaction stops it (each animation `idle` within 300 ms) and `noRunningAnimations('#workshop')` passes.
- **Red, then green:** the group failed first with "an edit starts one reaction" (all other groups passed). Two hand mutations, each reverted: a rename that renders twice fails with "a rename: the reaction runs (nothing stops it at once)"; the worth scale put back in the gait fails with "an edit: an animation of the figure does not end at the still transform".
- **Code:** `motion.ts` keeps A1 (gait; cross-fade when the picture, that is the figure or the army, changes), A4 (shake) and A5 (gold ring), and reads only `.ws-model` and `.ws-fig`. The A1 rim, A2, A3, the A4 cracks and the A5 ghost, zone, partner, hourglass and card back are gone (the card renders none of them). No frame has a worth scale; the gait's last frame is its rest pose. `workshop.css`: `.ws-model` has `position: relative`; the fading copy (`.ws-fig-was`) lies absolute over it; the ring (`.ws-ring`) anchors to it; both rest at opacity 0. `dialog.ts`: `shown` keeps the last look and verdict; `update()` ends with `react()` except on a first render; a rename calls `update(true)` only when no change ran.
- **Commands:** `npm test` (exit 0: vitest 64 files, 1249 tests; node tests 42 of 42), `npm run check:browser workshop` (ok, 50.9 s), and `npm run check:browser workshop-cast` (ok, 8.6 s; the copy's class keeps `imageIs` on `.ws-fig` to one image). All after the merge of the integration tip `0c06e96`, except the cast check (before the merge; the merge touched no Workshop file).
- **Not here:** the "superseded" mark of fix 26 in the review's fix table is ticket 09 (it blocks on this ticket); it can name the group `motionSetA`. `docs/WORKSHOP.md` §5.5 still names the rim, floor marks, gauge and cracks; ticket 12 rewrites that doc.
- Review fix F8: `StageLook` holds only `figure`, `body`, `army` and `ghost`, the fields that art.ts and motion.ts read; `lookOf(design)` no longer takes the verdict, and `GLOW`, `GOLD` and `CRIMSON` are gone. The look.ts header says who reads what. In ui.test.ts, "dresses the model from the verdict (lookOf)" became "shows the bare figure on the card, whatever the verdict or the rules say", which asserts the rendered card HTML for five designs.
