# Ogre — stronger shoulders and arms

Owner request, 2026-09-22: continue the recommended multiview reconstruction workflow and enlarge the shoulders and arms to communicate pushing ability.

## Completed

- Revised canonical front reference with a much wider shoulder girdle and larger upper-arm/forearm mass, preserving the established character, small rounded head, heavy jaw, wide belly, short legs, clay palette and orange hand pads. The prompt targeted approximately +25% shoulder width and +35% arm thickness; these are art-direction targets, not measured mesh changes.
- Matching left-profile and back references. No whole-sheet/gesture collage is sent as a reconstruction input. The plain rear tunic has no duplicated front knot; the rounded head remains above the shoulder ridge.
- Corrected tight front framing and oversized side framing. All final files are 1254 × 1254 RGBA with true transparency. Opaque figure heights occupy 79.0%, 79.5% and 80.9% of the canvas respectively. Bounds and alpha checks are saved in [reference-checks.json](reference-checks.json).
- Prepared the live Tripo workspace in its multiple-image input mode with v3.1, Ultra Mesh Quality enabled, textures disabled, triangle topology and a 100,000 polygon target. Confirmed the slider committed to 100,000 and the displayed generation price changed from 55 to **30 credits** when textures were disabled.

These are generated visual references, not geometrically exact projections of a common mesh. They keep the character's main proportions and features broadly consistent; subtle hand, cloth and anatomical differences must be resolved in the exported sculpt. The frontal image is the design authority.

## Inputs

| File | View | Role |
| --- | --- | --- |
| [front.png](front.png) | Front | Authoritative silhouette, face and shoulder/arm size |
| [left.png](left.png) | Left profile; face points left | Body depth, rounded crown, shoulder-to-neck transition, forearm thickness |
| [back.png](back.png) | Back | Shoulder width, back mass, rear tunic and arm stance |

[Download all three](ogre-multiview-inputs.zip). The ZIP contains these exact three PNGs, without drafts or the previous failed reconstruction. [Review page](index.html): `http://localhost:5190/docs/graphics-prototype/ogre-reconstruction/index.html`.

Images were prepared with built-in ImageGen, using the previous approved Shover cutout and then the revised front as references. Prompts are saved in `front-prompt.txt`, `framing-prompt.txt`, `left-prompt.txt`, `side-framing-prompt.txt` and `back-prompt.txt`. No image editing was done with a Python raster pipeline; Python was used only to inspect alpha/bounds and package the original PNG files.

## Current blocker and next action

The [Tripo workspace](https://studio.tripo3d.ai/workspace/generate) is signed out. No Tripo API key is configured in the current process and no Tripo CLI is installed. The owner has been asked to sign in to an existing account. No images have been uploaded to Tripo, no generation credits have been consumed, no account has been created and no purchase has been made.

The signed-out UI defaults to **Public** and puts privacy controls under **Members Only**; private generation access cannot be established until sign-in. Recheck the actual account's privacy mode, credits and price before submitting. The owner's instruction to proceed with the suggested workflow authorizes the reconstruction and its necessary reference preparation; do not use it as authority to buy a subscription, create an account under new terms, or publish the artwork without resolving those concrete requirements.

After access is available:

1. Confirm the multiple-image mode and load `front.png`, `left.png`, `back.png` in that order. If the interface exposes labeled direction slots, use their corresponding front/left/back slots. Do not fill a right-view slot with a mirrored left image as if it were independently established.
2. Use the prepared geometry-only v3.1 settings, subject to the actual displayed price/account. Export the resulting GLB and retain the original response/seed/settings if available.
3. Inspect the exported mesh in Blender with a neutral material. Verify head height, broad continuous shoulders, arm volume and clear short legs against all three references. Check closed/fused fingers, hidden back geometry and tunic/limb intersections. Correct these forms before sculpting extra texture.
4. Apply exact clay hand-pad geometry/material regions and the game's two army palettes. Judge both armies in front, side and game-camera views at the accepted 0.5 pixel setting and at board size.
5. Only after the static sculpt succeeds, build the deformation topology/weights, Walk/Shove clips and close-up/board GLBs. Keep the accepted stable torso volume and planted steps; no whole-body step squash.

No new 3D model or animation has been created in this phase. The game's current Ogre and other pieces remain unchanged. The failed single-image TRELLIS.2 test remains documented separately in [the previous research](../ogre-replacement/README.md).
