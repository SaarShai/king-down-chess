# Painted Knight

2026-09-26. Fourth piece, after Pawn, Archer and Ogre. [Character preview](http://127.0.0.1:5192/knight/) · [Board position](http://127.0.0.1:5192/board/?position=knight).

## Artwork

King Down's original Knight is a human foot soldier with a horse-head helmet, double-ended spear and cape. `original-reference.png` preserves the Drive-derived source from `art-src/pieces/final-ivory/Knight_colore3_no_shadow.png` unchanged.

`knight.png` is new 1536 × 1024 RGBA artwork made with built-in **image_gen**, using the original for identity and the painted Pawn for style. [prompt.json](prompt.json) records both prompts, references and generated source paths. A refinement replaced the initial large burgundy cape with the army colour. Ivory/charcoal now dominate; burgundy remains on the crest and narrow cape edge, with small brass fittings. Complete spear tips, hands, cape hems and boots are retained.

Generated PNG and alpha are copied unchanged. SHA-256: `5276928ef44bf43a18691387879a2f62a68bfa54bc414f202aed5effdc54ff2e`. Original reference: `144d619691bd0d65ba2b77b0bbd7904b444d5dc3adee94b56492ac85b8fb59d0`. Per-army rendering offsets align the two source cells to a shared ground anchor without editing the image.

## Motion and rules

Native Canvas moves one coherent pose through a preparatory tilt, an eased airborne arc, landing and a small settling bounce. Hands, spear and body keep their proportions. The shadow stays on the board plane; the arc lowers near the top edge to preserve the full spear. This is whole-figure motion, not a newly drawn leg cycle, independent spear strike or skeletal rig.

The preview supports both armies, back-and-forth leaps over a stationary Pawn, click/Enter, Reset, slow and reduced motion. It demonstrates motion at approximately the figures' relative board sizes; the board demonstrates the actual L-shaped destinations. The board uses the production engine: two squares along one axis and one along the other, no obstruction by intervening pieces, no friendly landing. Captures occur at the landing square. Production game and rules remain unchanged.

Try Ivory c4 → e5 (Pawn capture), c4 → d6 (Ogre capture), or Charcoal f5 → d4. Friendly b2/a5 are not offered to the Ivory Knight. Undo restores the source and captured piece; active Undo/Reset cancels before committing.

## Verification

- Both colours inspected in the character preview, including airborne Ivory, landed Charcoal, reverse travel, complete silhouettes and small samples.
- Browser captures for both armies leave intervening Pawns intact and produce correct source/destination/counts. Undo restoration, interrupted Undo/Reset, reduced motion and keyboard arrows/Enter checked.
- Quiet travel through f7/h8 and slow h8 → f7 inspected for top-edge spear visibility. Character Reset and army changes interrupt playback; reduced motion skips flight.
- Character and board layouts checked at 390 × 844; document width equals viewport width. Temporary viewport restored. Physical touchscreen hardware was not tested.
- Six focused tests pass: 1,101 Knight curve samples; exact L destinations, occupied-neighbour jumping, friendly landing exclusion, both-colour captures, retained bystanders and edge moves; existing Ogre/Pawn/Archer checks. Ogre shove and Archer capture also regression-checked in the browser.
- Syntax checks pass and no browser warnings/errors observed. Owner review of the artwork remains pending.

```sh
node --test docs/2d-first-pieces/knight/motion.test.mjs docs/2d-first-pieces/ogre/motion.test.mjs docs/2d-first-pieces/lance/aiming.test.mjs docs/2d-first-pieces/wrist-bow/aiming.test.mjs
```

Server and rule-bundle rebuild commands are in [the board notes](../board/README.md).
