# Pawn with a lance — continuous 2D study

2026-09-26. [Open the Pawn preview](http://127.0.0.1:5192/lance/). The owner asked to apply the accepted Archer cursor animation to the Pawn and his lance.

Move the pointer in the preview to aim, then click to thrust. Dragging changes aim without attacking. On touch, drag to aim and use **Thrust lance**; the native Aim height slider is an alternative. Keyboard: Up/Down adjust elevation, Home returns to level, Enter/Space thrust. Slow motion shows anticipation, contact and recovery. Reduce motion defaults to the system preference and skips the moving attack while preserving aim and hit feedback.

## Artwork and motion

- `pawn.png`: new 1536 × 1024 RGBA sheet, generated with built-in **image_gen** using the earlier Pawn sheet as its design reference. `prompt.json` preserves the exact prompt, reference and generated source path. The original PNG and alpha are copied without postprocessing.
- One coherent ready pose per army: pointed rounded helmet, slit eyes, plate boots, ochre shield mark, a closed one-handed lance grip and the other hand on the shield. Armour colours remain ivory and charcoal. This is derived artwork, not an original archival asset.
- The actual transparent gutter is at x=762. Source windows are `[0,0,762,1024]` and `[762,0,774,1024]`, preserving the complete lance tips and shields. Each army has calibrated shoulder/weapon coordinates and display offsets so army changes keep the figure in approximately the same place.
- A small shoulder mesh provides **20° up / 24° down** aiming. The gauntlet and straight lance move together. Smoothing follows the same approach as the accepted Archer. An attack requested while aiming waits briefly for that aim.
- The 800 ms thrust has a short wind-up, 46 px forward jab, contact and recovery. The upper body shifts into the jab; the stance tapers to fixed boot soles. The aimed arm receives one rigid translation separately from the body deformation, so a low lance cannot bend as it crosses the leg-height region. Slow motion takes 2.4 seconds.
- Canvas 2D drawing and native pointer/keyboard controls; no new dependency. `../painted-mesh.mjs` contains the affine texture routine shared with the Archer, and `../aim-study.css` contains the common preview styling. Each piece retains its own pose geometry and action timing.

The focused study does not add walking, alternate facings, a full-body turn, or new game rules. The existing two-piece board keeps its earlier Pawn animation; the playable game is unchanged. Acceptance of the new Pawn artwork remains with the owner.

## Verification

- Viewed both army colours at neutral and raised/lowered aim, including their board-size samples. Complete helmet tips, boots, shields and lance points; connected shoulder, closed grip and readable weapon.
- Inspected actual contact in slow motion for ivory and charcoal, including a low jab: straight shaft, point at target, planted soles, then recovery to guard.
- Real pointer drag changes aim without attacking. Mouse attack, keyboard Enter, Reset during action, army-switch cancellation and the local Reduce motion control checked in the browser.
- At 390 × 844, the full silhouette and controls fit; document width and scroll width both 390 px. Normal viewport restored. Physical touchscreen input remains untested.
- Geometry check: **442 aim poses / 44,642 thrust samples** across both armies. No reversed/collapsed shoulder triangles (minimum signed area ratio 0.223), rigid weapon-region edges, pointer/axis agreement, bounded target, straight jab, fixed soles and return to guard. These are mechanical checks, not proof of visual acceptance.
- Archer regression: all **940** existing geometry poses pass; browser ivory neutral and charcoal upper-limit shot checked after the shared-drawing extraction.
- Both page modules and the drawing modules pass JavaScript syntax checks. Browser logs reported no warnings/errors. No engine tests were needed because engine/game code did not change.

Run the focused checks from the project root:

```sh
node --test docs/2d-first-pieces/lance/aiming.test.mjs docs/2d-first-pieces/wrist-bow/aiming.test.mjs
```

Serve the studies with:

```sh
python3 -m http.server 5192 --bind 127.0.0.1 --directory docs/2d-first-pieces
```
