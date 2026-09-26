# Painted 2D wrist-bow Archer

2026-09-26. Owner direction: return to 2D, replace the longbow with her original wrist bow, and correct arm proportions.

[Open the focused preview](http://127.0.0.1:5192/wrist-bow/) or the [two-piece board study](http://127.0.0.1:5192/). The board now uses this Archer; Pawn retains its existing artwork and five-frame animation. The playable game on port 5189 is unchanged.

## Artwork

`archer.png` is an unmodified 1536 × 1024 RGBA image generated with the built-in `image_gen` tool. Left 768 × 1024 cell: ivory. Right cell: charcoal. The original generated alpha is preserved; no background removal, cropping, limb stretching or recolouring was applied afterward. SVG view windows display the two cells at their original aspect ratio.

`prompt.json` records the exact prompt and reference paths. The original King Down Archer supplied the face, hood, braid and wrist-bow concept; the earlier painted sheet supplied the illustration style and army palettes. This is new derivative artwork, not an original archival asset or a painted-over 3D render.

Both figures have a complete hood-to-boots silhouette. The aiming arm has a natural shoulder, elbow and neutral wrist; the other arm rests beside the body. The compact weapon sits on the bracer. The pose was reviewed as a whole for upper-arm/forearm balance, hand scale and joint continuity, then viewed at board scale. These are visual checks, not a claim of anatomical measurement or owner acceptance.

## Shot behavior

One firing-ready pose per army. The shot adds a short bolt flight, restrained whole-sprite recoil and a target-hit cue using the browser's Web Animations API. It never scales or stretches an arm or hand. Reset and army changes cancel pending motion, and the target accepts click, Enter or Space. Reduced-motion mode bypasses moving effects; that branch was inspected in code but not exercised by changing the user's system setting.

This pass does **not** supply new raise/lower/reload drawings, a skeletal rig, or continuous cursor-driven arm aiming. The loaded bolt remains part of the ready illustration. The board preview redirects the effect toward its scripted target; it does not change the figure's painted facing.

## Verification

- Inspected the generated sheet and browser views of both armies: complete silhouettes, compact wrist device, arm/hand proportions, palette and small-scale readability.
- Verified ivory and charcoal shot completion, keyboard target firing, army-switch reset and resetting during a shot in the focused preview.
- Verified both Archer board shots, canceling a slow board shot and the existing Pawn advance with its five frames.
- Both page scripts pass `node --check`. Browser logs contained no warnings/errors during these checks.
- The large preview is constrained to viewport height so its boots remain visible. The current desktop layout was inspected; a separate phone breakpoint was not tested in this pass.
- `verification.json` records dimensions, source hash, alpha bounds and the performed checks. No game/engine files were changed, so engine tests were not rerun.

Serve from the project root with `python3 -m http.server 5192 --bind 127.0.0.1 --directory docs/2d-first-pieces`.
