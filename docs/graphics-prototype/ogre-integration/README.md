# Approved Ogre in the game — 2026-09-22

The owner-approved repaired reconstruction replaces the rejected procedural Ogre. Its face, enlarged shoulders/arms, clothing, cuffs and repaired fingers are preserved. The raw reconstruction and repaired review assets are unchanged.

- **Playable game:** `/?fen=7k/8/6o1/8/2OP4/8/8/K7%20w%20-%20-%200%201&style=voxel&px=1`. Select the ivory Ogre at c4, then its pawn at d4 to shove. The Ogre remains a custom-position/lab piece; no rules or starting rosters changed.
- **Character study:** `/?study&variant=rebuilt&scene=character&character=ogre&pixels=0.5&look=handmade&detail=refined&contours=adaptive&mesh=auto`. Walking, Move, Shove, both armies, all looks and capture previews use the replacement.
- **Source:** `../ogre-reconstruction/clay-refinement/ogre-repaired.glb`; editable rig: `../ogre.blend`; reproducible build: `tools/graphics-prototype/build_ogre.py`.

## Implementation

14-bone baked rig, 2-second Walk and 1.6-second Shove. The short legs take small planted steps; massive arms make a restrained forward shove. Hands and head preserve their shape. The Ogre has no step squash or extra spring deformation. The board move faces its destination, walks without hopping and settles at rest. Shoves time the displaced piece to the gesture; undo/rebuild invalidates old animation continuations. Per-instance mixers/skeletons are disposed when pieces leave the board; cached geometry/materials are shared. Boards without Ogres do not request the Ogre GLB.

`OgreMaterial.ts` is shared by the approved review, study and game. Ivory or ink-blue clay retains terracotta cuffs and dark facial detail. The original texture defines the pigment edges; bind-position attributes keep those selections attached during capture baking/clipping. The study explicitly owns its Ogre rendering, preventing a late game-model load from drawing a second overlapping figure.

Close-up: **36,888 triangles / 2,812,896 bytes**. Board: **14,312 triangles / 1,680,556 bytes**, a 61.2% triangle reduction. Board positions remain a subset of accepted source positions; no vertex quantization. The other sixteen close-up and board GLBs are untouched. Parent-only board normalization preserves bind-space pigment coordinates; Blender otherwise bakes that transform into skinned positions.

## Verification

- `node tools/graphics-prototype/verify_ogre.mjs`: 4/4 grouped checks, both clips at both tiers over 61 samples. `asset-checks.json` contains actual Three.js skinned-surface measurements, not just bone paths.
- Source vertex edits during rigging: **zero**. Exported close-up positions match the approved mesh. Normal comparisons at 18,444 shared positions: minimum dot 0.9999998. Weight-sum error < 4.5e-8; no nonfinite weights. Fingers remain rigid within 3.2e-7 relative length error; exact animation reset, loop agreement < 1e-4.
- Ground contact: no penetration beyond floating-point noise; at least one sole stays within 0.0011 board units of its rest contact. Walk toe displacement reaches 0.0403 units from rest. Edge ratios remain within 0.425–2.359; 99th percentile below 1.157, with no threshold relaxation from the prior Ogre strain checks.
- Existing board-asset checks: **51/51** across all 17 designs (geometry, colour/relief or Ogre texture, exact skeleton/clip preservation, source hashes); `board-asset-checks.json`.
- `npm run build`: pass. `npm test`: **205/205**, six files.
- UI inspection: both armies; walking/Shove; board/sculpt/automatic detail; handmade/plasticine/current switching; five capture buttons and restore; legal `Oc4-c3`, `Oc4>d4-e4`, undo both during and after the shove; all 34 cast figures load together. No shader/browser errors during these checks. Removed an undefined gradient-map warning from the current-look material.

The game retains its existing lightweight capture debris. The five richer capture sequences are still study previews. Close-up burst/crack constructs clipped fragments synchronously and can briefly block the study UI; pre-baking those fragments remains a graphics-engine follow-up. Physical mobile/older-device FPS has not been measured.
