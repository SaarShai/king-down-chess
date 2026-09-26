# Painted Bishop

2026-09-26. A standalone painted 2D Bishop study. [Character preview](index.html) · [Board position](../board/?position=bishop).

## Artwork

`original-reference.png` is the unchanged source image from `art-src/pieces/final-ivory/Bishop_colored_dagger.png`. `bishop.png` is a 1536 × 1024 RGBA paired sheet generated with the built-in `image_gen` tool. The original supplies the identity: tall split hat, masked face, black-and-gold book, dagger and long robe. The accepted Knight and wrist-bow Archer sheets supplied the painted 2D treatment and sheet layout. The generated alpha is preserved unchanged; the four corners are fully transparent. SHA-256: `b51723fbed891fc9cc109def1b76c22a875039a927f37b9544995f58d412ad61`. Original-reference SHA-256: `c312a3cdfb09c0610511323829797ca3f09755a48dc1731e1b3082573cb5dc63`.

The two equal 768 × 1024 cells contain matched complete figures. The generated image places the ivory figure at source x≈275..646 and the charcoal figure at source x≈179..552. The source render reads left-facing, so `motion.mjs` mirrors each cell into the canonical +x/right-facing output, then registers the charcoal destination 95 px left of ivory. Use a 1152 × 1152 local canvas, draw the source cell at 768 × 1024, and keep the existing relative scale. The shared ground anchor is `ANCHOR={x:576,y:1018}`; the incoming-action torso target is `HIT={x:576,y:500}`. A board renderer can flip or orient the complete sprite at its square anchor, but should not independently bend the hands, book or dagger.

## Motion and limits

`motion.mjs` exports `DURATION`, `ANCHOR`, `HIT`, `actionAt(t)` and `drawBishop(canvas,image,side,extension=0)`. The preview uses a short negative anticipation, rigid forward presentation, hold and recovery. `actionAt` returns a normalized extension in `[−0.16,1]`; the renderer turns it into a 22 px translation, 3 px lift and 0.018 rad whole-pose rotation. Hands, book, dagger, robe hem and feet remain one painted image. This is a restrained casting/book action, not a skeletal rig, independent hand articulation, walking cycle, or set of alternate facings.

The preview includes Ivory and Charcoal, action/reset, keyboard activation, slow motion, reduced motion and 1152 px board-size samples. The parent task integrated the study with production Bishop rules in the board trial. Physical touchscreen behavior and owner acceptance of the artwork remain outside this pass.

## Verification

The focused motion test samples 1,001 points, checks the bounded anticipation/presentation/recovery curve, confirms the hold peak and checks the exported registration constants.

```sh
node --test docs/2d-first-pieces/bishop/motion.test.mjs
```

Binary inspection confirms both assets are RGBA PNGs at the requested dimensions, and the generated sheet retains transparent corners and complete feet/hat/dagger silhouettes. Parent review checked both armies, book presentation, Reset, slow/reduced motion, keyboard and 390 px layout. Both Bishops capture on the board; Undo restores the victim. The parent removed an overlapping label and corrected the main canvas aspect ratio. See [shared verification](../board/README.md#parallel-cast-review).
