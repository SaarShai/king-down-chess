# Painted motion: quiet moves, the selected piece, the board — 2026-10-02

In the painted look, every move now has some character, not only captures, and the board looks like a real object in warm light.

## What changed (game only)

- **Quiet moves.** Each figure moves in its own way instead of a flat slide. All of them stay under half a second at Normal speed.
  - **Walk** (King, Guard, Maester, Ogre, Beast, Archer): a small dip, two quick footfalls with a forward lean, then the weight settles with a little squash. 440 ms.
  - **Glide** (Rook, Bishop, Queen): lean back, glide low over the stone leaning into the run, then lean back against the stop and settle. 378 ms for one square, 28 ms more per square, at most 480 ms.
  - **Hop** (Pawn): crouch, hop (higher for a two-square move), land with a squash and spring upright. 420 ms.
  - The Knight keeps his leap and the Paladin his charge; lab pieces (tokens) keep the plain slide.
  - The pictures are single painted images, so this is all done by moving, squashing and tilting the image about its feet, with the shadow staying on the ground.
- **Selected piece.** It breathes slowly (stretches up a little, its shadow pulses) until it moves or is deselected. Off when Animations is Off or the system asks for reduced motion. It redraws at about 30 frames a second, only while a piece is selected.
- **Board.** A frame cut from the board's own dark stone (lit from the top left, with a light edge), soft contact shadows under every figure, and warm light from the top left with a gentle fall-off to the far corners. Coordinates sit on the frame in light lettering.
- **Settings still work.** Fast plays every quiet move at double speed, Off shows only the result, and a tap on the board (or Escape) skips a move.

## Frame sheets and screenshots

- Quiet moves, both armies, one sheet per figure: [quiet/](quiet/) — [king](quiet/king.webp), [guard](quiet/guard.webp), [maester](quiet/maester.webp), [ogre](quiet/ogre.webp), [beast](quiet/beast.webp), [archer](quiet/archer.webp), [rook](quiet/rook.webp), [bishop](quiet/bishop.webp), [queen](quiet/queen.webp), [pawn](quiet/pawn.webp), [knight](quiet/knight.webp) (unchanged leap), [paladin](quiet/paladin.webp) (unchanged charge). Timings in [quiet-moves.json](quiet-moves.json).
- Selected idle over one breath: [idle.webp](idle.webp).
- Board before and after: [plain](board-plain.webp) / [atmosphere](board-atmosphere.webp); from Black's side [plain](board-plain-black.webp) / [atmosphere](board-atmosphere-black.webp).
- In the game: [desktop](game-desktop.jpg), [390 px phone](game-phone.jpg), [phone as Black](game-phone-black.jpg).

Regenerate: `PLAYABLE_URL=http://127.0.0.1:5189/ PLAYABLE_BROWSER=chromium node tools/painted-motion-sheets.mjs` (the game screenshots need a build on that URL; the sheets do not). The tool drives a fake clock, so frames are exact, and it checks that every quiet move ends pixel-identical to the still position, that each gait is under 500 ms, that with liveliness off the scene still plays the plain slide, and that the idle moves only when on.

## How it works

- `docs/2d-first-pieces/board/gait.mjs`: the gaits as data. `GAITS[name] = {duration(squares), at(progress, squares)}` returns where the feet are along the move (`travel`), how high the figure is (`lift`), squash (`sx`, `sy`), lean (`tilt`) and shadow size. `GAIT_OF` names each figure's gait. `idleAt(ms)` is the selected breath.
- `scene.setLively({moves, idle, atmosphere})` turns the three parts on. **All are off by default**, so the board trial and the trailer, which share the scene, are unchanged. `src/render/PaintedView.ts` turns them on for the game.
- `scene.playing` names what is playing (`'walk'`, `'glide'`, `'hop'`, or the capture kind), for checks.
- **Adding a move kind** (for example the kings' powers in PR #1): add an entry to `GAITS` (a function of progress returning the same fields) and either name it in `GAIT_OF` or play it directly with `scene.play(move, {gait: 'name'})`. A power that needs effects beyond the figure (ice, wings) belongs in `scene.mjs` beside the capture effects, as a new animation type in `plan()` and `render()`.

## Proof the trailer and trial did not change

- `capture-strikes.mjs`: 15/15, and all 11 strike sheets byte-identical to the same tool's run on `main` in this session. (The sheets committed in `strikes/` differ from both runs byte for byte, because this cloud browser is a different Chromium build from the one that made them; that is why they are not recommitted.)
- Trailer stills (`node tools/render-trailer.mjs still 2.2 … --shot montage` and `--shot wake`) are byte-identical before and after. A full-timeline still cannot be rendered in this cloud clone: the kings shot needs git-ignored art (`docs/trailer/assets/`).

## Limits

- One painted pose per figure: no legs move. The walk is a bob and lean, not a walk cycle.
- The lean reads best on sideways moves; on moves straight up or down the board it is a third as strong, because a side-on drawing cannot lean "into" the screen.
- The idle redraws the whole board about 30 times a second while a piece is selected; on a slow phone that costs some battery while the player thinks.
- Not seen on a real phone, only in headless Chromium at 390 px.
