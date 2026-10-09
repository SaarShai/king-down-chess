# 08 · Verb marks: the shove arrow, the Beast chain on the board and the key line

Status: ready-for-agent (the owner approved [the spec](../spec.md) on 2026-10-09)
Blocked by: 04, 10

## Scope

- Owner choice: Your move A, verb marks. Decision D12 (a): a bite gets its number after it is made (Advisor S); the demo numbers the planned bites.
- Demo: `feat-your-move` (`shoveArrow` 133, bite badges 155, `drawTargets` 209–235, `drawChain` 237–253, the target sentences 283–298, `keysFor` 300, the landing tap 430–431, the chain 466–539: `biteTo` slides the Beast and dips the victim; a tap on the Beast is Stop here).
- Files: new `src/marks-model.ts` and test; a pure `chainPreview` (in `marks-model.ts`) and its test; `src/render/marks.ts`; `src/render/renderer.ts` (optional `shoveTo` and `bites`); `src/render/PaintedView.ts`; a pure motion module for the bite slide (spec rule 8); `src/main.ts` (`candidates`, `markTargets`, `refresh`, `onSquareClick`; call lines only); new `tools/verify-verb-marks.mjs`; `tools/verify-special-moves.mjs`; `tools/qa.mjs`.

## Plan

1. [ ] `src/marks-model.ts` (pure): from the selected piece's legal moves, the steps, takes, shots, shoves (target and landing), swaps, Leap targets and the bites made. `refresh()` only passes the model to the view.
2. [ ] Shove: a teal arrow on the landing square, in the push direction; the teal ring on the target stays. A hover or focus on the landing square shows a see-through copy of the shoved piece there. A tap on a landing square that belongs to one shove plays it.
3. [ ] The Beast chain on the board (spec §4.5): `chainPreview(pos, moves, path)` gives the shown board after the bites made. Each bite slides the Beast to the victim and takes the victim off the view only: no ply and no save. Nothing is a ply until the last bite or Stop here; the commit does not play the bites again. Undo or Esc puts the board back. A tap on the Beast means Stop here.
4. [ ] Bite marks: before the first bite, the legal bites show the normal take mark with no number. After each bite, the square that the Beast passed gets a grey number (1, 2, …). The line says "Bite again, or stop here." only when a chain of this length is legal, else "Bite again." A tap off the marks during a chain does not cancel it; the line says "Tap a marked piece, or stop here."
5. [ ] Leap: a Leap target shows a small coin mark, and its target sentence says "Leap: 1 of 3".
6. [ ] The key line: when a piece is selected, the second line of the context line shows the glyphs of the verbs on the board now (Step, Take, Shoot, Shove, Swap).
7. [ ] A target sentence for a hovered or focused target, 8 words or fewer ("Shove their guard to c5.", "Shoot their ogre. Your archer stays.").
8. [ ] Keep the swap chase and the shot sight. Each verb has its own shape.

## Verification

- [ ] `src/marks-model.test.ts`: fixed positions for the Ogre (shoves and landings), the Beast (bites), the Maester (swaps), the Archer (shots, for each Archer reading), Leap targets, and a landing square that is also a step square (the step wins). `chainPreview`: the board after one and two bites; "stop here" only for a legal length; a chain never continues onto a king.
- [ ] Node test of the bite slide timing.
- [ ] New check `verb-marks`: the highlights for fixed positions; a tap on a landing plays the shove; after each bite the Beast stands on the victim's square and the victim is gone from the view, with no new ply; the numbers on the squares passed; an off-mark tap keeps the chain; a tap on the Beast stops; Undo and Esc after each bite put the board back; the commit plays once.
- [ ] `special-moves`, `qa`, `npm test`, `npm run check:browser` and `plugin-ui` pass. Record the plugin page size. The plugin session knows before the pull request.
- [ ] Rendered sample, 390×844 and 1440×900: the Ogre shove; the Beast after bites 1 and 2; the Maester swap; the Archer shot with the key line; a Leap target. The owner's yes, with the date, in Comments.

## Risks

- Two shoves can land on one square: then a tap there opens the choice (ticket 09).
- The bite numbers must stay readable at 375 px with 4 bites.
- The shown board during a chain differs from `game.pos`: every reader of the board during a chain (threats, reads, the cursor) must use the shown board.

## Does not do

- No refusal mark and no Take or Shove buttons (09). No fan of tiles at the square.

## Comments

### W4 phase 1

- Build: test Ogre landings, Beast bite numbers, Maester swaps and Archer shots. A step wins on a shared landing.
- Draw: opt-in read rings, shove arrows and grey bite numbers. The default keeps the plugin marks.
- Cut: chain slides, hover copies, the key line and Leap coins.
- Tests and checks: see ticket 04. Phase 2 wires landing taps and the bite path, then adds the flow check and sample.
