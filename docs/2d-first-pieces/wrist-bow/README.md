# Painted 2D wrist-bow Archer

2026-09-26. Owner direction: return to 2D, replace the longbow with her original wrist bow, and correct arm proportions.

[Open the focused preview](http://127.0.0.1:5192/wrist-bow/) or the [two-piece board study](http://127.0.0.1:5192/). The board now uses this Archer; Pawn retains its existing artwork and five-frame animation. The playable game on port 5189 is unchanged.

## Artwork

`archer.png` is an unmodified 1536 × 1024 RGBA image generated with the built-in `image_gen` tool. Left 768 × 1024 cell: ivory. Right cell: charcoal. The original generated alpha is preserved; no background removal, cropping, limb stretching or recolouring was applied afterward. The board displays the cells through SVG view windows; the focused aiming preview reads the same cells into Canvas. Both preserve the original aspect ratio.

`prompt.json` records the exact prompt and reference paths. The original King Down Archer supplied the face, hood, braid and wrist-bow concept; the earlier painted sheet supplied the illustration style and army palettes. This is new derivative artwork, not an original archival asset or a painted-over 3D render.

Both figures have a complete hood-to-boots silhouette. The aiming arm has a natural shoulder, elbow and neutral wrist; the other arm rests beside the body. The compact weapon sits on the bracer. The pose was reviewed as a whole for upper-arm/forearm balance, hand scale and joint continuity, then viewed at board scale. These are visual checks, not a claim of anatomical measurement or owner acceptance.

## Continuous cursor aiming

Move the pointer within the preview to aim; click to fire. Dragging aims without firing. On touch, drag to aim and use the Fire button; the native Aim height slider is an alternative. With the stage focused, Up/Down change elevation, Home returns to level, and Enter/Space fires. Both board-size samples follow the same pose.

The arm now follows continuously through **22° up to 30° down**. The target stays ahead of the wrist bow inside that arc; points behind her or outside her reach are projected into the reachable range. Exponential smoothing provides a short, steady response without an overshooting spring. A shot requested during movement waits briefly for the selected aim, then fires along the painted weapon's axis. The arm recoils by 1.8° and recovers; the torso stays planted.

`aiming.mjs` draws the unchanged source image through a small Canvas 2D shoulder mesh. The stationary edge follows the hood, braid and bodice. The skin around the shoulder flexes locally, while the forearm, hand and bow rotate together. This preserves the coherent source drawing without exposing a cutout shoulder edge or independently stretching the fingers to a target. The neutral pose draws the original image directly. No new generated art, animation framework or dependency was added.

The same geometry positions the muzzle, guide and target. SVG/Web Animations supplies the bolt and hit effects. Reset, army changes and motion-preference changes cancel queued and active shots. The animation loop stops when the pose settles. The Reduce motion control defaults to the system preference and makes aiming immediate, omitting recoil, bolt flight and hit-pulse motion.

This is one plane of aiming from one painted pose, not a full raise/reload/turn animation. The loaded bolt remains part of the illustration. The two-piece board at `/` still uses its previous static pose/recoil shot; cursor aiming is currently demonstrated in this focused preview. The playable game remains unchanged.

## Verification

- Visually inspected neutral, raised and lowered poses for ivory and charcoal, plus their moving board-size samples: shoulder attachment, hand/weapon shape, hood/braid stability and complete feet.
- Used real pointer dragging in the browser to change elevation without firing. Checked aimed shot completion, charcoal keyboard firing with an initial aiming phase, and cancellation through Reset and army switching.
- Used the local Reduce motion checkbox to exercise immediate aiming and keyboard firing without animated effects. The system-preference listener was inspected, without changing the user's system settings.
- Checked the narrow layout at **390 × 844**: full figure visible, native slider works, document width and scroll width both 390 px. Restored the normal viewport afterward. Physical touchscreen input has not been tested.
- `node --test docs/2d-first-pieces/wrist-bow/aiming.test.mjs`: **940 sampled poses**, including recoil, across both armies. No inverted or collapsed mesh triangles (minimum signed area ratio 0.161); rigid hand/weapon geometry, pointer-to-bow alignment, target bounds and bolt distance checked. These establish geometry, not owner acceptance of the art.
- Page module and `aiming.mjs` pass `node --check`. Browser checks produced no application warnings/errors. The PNG hash remains unchanged.
- Previous board-shot/Pawn verification is retained in `verification.json`; those paths were not edited in the cursor-aiming pass. No game/engine files changed, so engine tests were not rerun.

Serve from the project root with `python3 -m http.server 5192 --bind 127.0.0.1 --directory docs/2d-first-pieces`.
