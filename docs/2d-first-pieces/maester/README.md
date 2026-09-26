# Painted Maester — 2026-09-26

Open [the character preview](http://127.0.0.1:5192/maester/) or [its board position](http://127.0.0.1:5192/board/?position=maester).

Swept white hair, round/rectangular turquoise goggles, wrench and gear pack; short stocky silhouette. Coat and trousers carry the army palette.

## Source and method

The built-in image generation tool used the original King Down reference and accepted painted Knight as style/palette input. Exact prompts, original reference, final transparent 1536×1024 PNG and hash/provenance are saved in this directory. [Provenance](provenance.json); [initial prompt](prompt.txt). 
Small rigid whole-figure lean, preserving wrench, goggles and fingers together. One foot can lift slightly; this is not a planted two-foot rig or independent goggle-hand movement. Source faces left, mirrored in the renderer into the common right-facing orientation.

The shared renderer is `../court-motion.mjs`; the preview controls live in `../court-study.mjs`. Source origins are registered separately for the two armies without editing their bitmaps. Hold pose exposes the maximum deformation for inspection. Reset and army changes cancel the current action; keyboard, slow motion and reduced motion are supported.

## Verification

Artwork inspected at full/portrait scale and in the ten-piece board: complete silhouettes, hands and equipment, army palettes, source-cell gutter, both armies and full-pose extremes. Geometry tests cover 1,001 curve samples, upper-body rigidity, positive mesh orientation and fixed Queen hems/Paladin soles, plus rigid Maester distances. The board reuses unchanged production rules.

See [board integration evidence](../board/README.md#queen-paladin-and-maester) for special actions and browser checks. These are coherent pose studies with bounded motion; full walking, extra facings and owner acceptance remain outstanding. Production game unchanged.
