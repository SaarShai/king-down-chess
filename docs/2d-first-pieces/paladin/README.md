# Painted Paladin — 2026-09-26

Open [the character preview](http://127.0.0.1:5192/paladin/) or [its board position](http://127.0.0.1:5192/board/?position=paladin).

Grey beard, square pauldrons, gold chest cross and complete two-handed hammer. Ivory/charcoal armour AND tabard dominate; narrow red stripe.

## Source and method

The built-in image generation tool used the original King Down reference and accepted painted Knight as style/palette input. Exact prompts, original reference, final transparent 1536×1024 PNG and hash/provenance are saved in this directory. [Provenance](provenance.json); [initial prompt](prompt.txt). 
The initial Paladin had a pale tabard on the charcoal army. A targeted colour edit corrected that but clipped the right hammer. The final framing edit restored complete equipment with a clear gutter. Those two intermediate images were not adopted; all three exact prompts are retained.

Hands, head and entire hammer translate rigidly during the brace; a short lower-leg transition keeps actual boots fixed. Board travel uses anticipation and a shallow bound, then capture/recovery or self-removal. This is not an articulated hammer swing.

The shared renderer is `../court-motion.mjs`; the preview controls live in `../court-study.mjs`. Source origins are registered separately for the two armies without editing their bitmaps. Hold pose exposes the maximum deformation for inspection. Reset and army changes cancel the current action; keyboard, slow motion and reduced motion are supported.

## Verification

Artwork inspected at full/portrait scale and in the ten-piece board: complete silhouettes, hands and equipment, army palettes, source-cell gutter, both armies and full-pose extremes. Geometry tests cover 1,001 curve samples, upper-body rigidity, positive mesh orientation and fixed Queen hems/Paladin soles, plus rigid Maester distances. The board reuses unchanged production rules.

See [board integration evidence](../board/README.md#queen-paladin-and-maester) for special actions and browser checks. These are coherent pose studies with bounded motion; full walking, extra facings and owner acceptance remain outstanding. Production game unchanged.
