# Haste living card art

Status: accepted by owner. Preview only.

## Result

Source-textured gold grains race along the uneven painted sweep. They pass behind the solid rook. A moving light pass follows the source dust pixels. No line, ring or broad glow is drawn. The main red banner flexes slightly from its fixed pole. Its source-color mask keeps the torn contour in one layer, without strip seams. The rook, board and buildings stay fixed.

The source is 800 × 800 px. Effect creation normalizes it to 512 × 512 px before all mask and texture work. Frames use cached layers and grains. The eight-second loop uses one repeatable clock. The 3.2-second Awakening starts and ends at the original. Reduced motion draws the exact original.

## Plan and verification

1. Inspect and normalize the source: complete. The source remains byte-identical to HEAD. SHA-256: `2bd732102bd12823889db66996f9d61f15a446e34864e57b76b3c69bb3bce6d8`.
2. Build the dust flow and banner response: complete. Keep the banner mask connected to its own cloth; color bounds alone also select distant flags. The enlarged frame comparison finds this fault, and the connected mask removes it.
3. Inspect the full painting, center crop and 34/44 px hand coins: complete. Desktop and phone frames show the gold in the crop. No duplicate stone, long streaks or banner strip seams are visible. The final difference image confines changes to the main cloth and dust sweep.
4. Run the registered check: complete. `npm run check:browser card-art` passes after the mask fix in run `effects-card-art-haste-cC2W8w`. All four cards pass repeatable seeking, distinct frames, exact loop endpoints, finite drawing, bounded opacity, canvas state restoration, stable reduced motion and shared controls. There are 32 captures at 1280 × 720 and 390 × 844, with no browser errors or horizontal overflow. Syntax also passes.

Final evidence is in the external session output at `card-art-second/haste/verified/`. The first usable preview is recorded in `READY.md`. The early and peak Awakening frames, settled frame and loop frames are inspected with `view_image`. The one-shot endpoint branch draws the original before it returns.

## Scope and limits

Only `effect.js` and this file change in the repo. Shared controls and checks stay unchanged. No source replacement, production change, dependencies, commit or deployment. No broad test suite or physical-device performance test is run. Hand-size motion is subtle. The owner has not approved this sample. The local preview server stops at handoff.

Owner feedback: “haste is fine.” Preserve this animation. No game integration requested.
