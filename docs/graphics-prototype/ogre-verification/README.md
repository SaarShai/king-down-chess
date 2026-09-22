# Ogre / The Shover — implemented 2026-09-22

**Historical, rejected sculpt.** The owner-approved reconstruction replaces this asset and recipe. See [current integration and verification](../ogre-integration/README.md). The measurements below describe the earlier procedural model at commit `914ec07`.

The approved concept is now an editable 3D clay character in the graphics study. Open `?study&variant=rebuilt&scene=character&character=ogre&pixels=.5&look=handmade` and use **Walk in place**, **Shove** or any capture finish. The complete cast now contains 17 designs, in both armies.

The sculpture has a broad belly, small heavy-jawed head, blunt brows/tusks, four-digit hands, a short tunic and exposed legs. Separate rounded clay palm pads carry the terracotta accent; the body and fingers use the army material. Face recesses use neutral baked shading, not another identity colour. Clay relief, smooth/12 fps walking, independent army rigs and all five capture previews use the existing renderer. The Ogre's walking disables the per-step root squash; the other accepted characters are unchanged.

- Editable asset: `../ogre.blend`; reproducible authored recipe: `../../../tools/graphics-prototype/build_ogre.py`.
- Close-up GLB: 27,998 triangles, 14 bones, `Walk` (1.8 s) and `Shove` (1.6 s). A separately derived compressed board GLB shares exactly the same skeleton and clips.
- Weights follow authored body/limb/hand parts. Both feet have independent targets; the body keeps stable volume. The shove braces, raises the palms, extends within a two-link reach and recovers. It is an in-place ability preview, not a gameplay rule or an attacker/victim interaction.

## Verification

`node tools/graphics-prototype/verify_ogre.mjs` passes all nine grouped checks. Each clip at both detail levels is sampled across 49 poses. All accent vertices belong only to hand bones. Head/pad shape error is below 0.001, foot contact stays within 0.0081 board units, walk toe travel exceeds 0.06, loop endpoints match and reset returns exactly to the imported pose. Independent standard Three silhouettes have **zero disagreement** with the adaptive-contour mask for the sampled animated poses, including the clay morph.

The initial version failed: compressed knee folds reached an edge-length ratio of 0.078 and the translated shove wrist stretched edges 3.36×. `before-joint-repair.json` preserves that failure. The fix was a forward knee rest position, broader knee/ankle blends, lower but visible foot lift, a proper two-link arm reach and broader wrist blending. Final Walk edge ratios are 0.578–1.277; Shove 0.445–1.571. Thresholds were not loosened. Captures show both armies from front and side at three phases per clip.

The Ability preview completes/reset cleanly; starting walking interrupts it. All five capture effects render and restore at both detail levels. The 390×844 layout fits. Full-cast integration passes 38 checks; renderer passes 42; engine resource checks and the TypeScript/Vite build pass. These are visual/structural browser checks, not physical-phone frame-rate measurements.

This is the first in-engine interpretation of the concept, with an editable source for further art-direction adjustments. It adds no Ogre rule to the shipped game pool.
