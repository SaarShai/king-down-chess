# King Down graphics study — 21 September 2026

**Current question:** how much of the original characters' detail can we retain while keeping a coherent army palette and readable silhouettes? The owner's correction was explicit: richer figures closer to the artwork, not only more screen pixels.

The current pair uses the **original Guard and Archer sculpt surfaces**, reduced and recoloured for the study. The first primitive blockouts remain switchable. This is an isolated art/rendering study on `codex/graphics-study`; it does not select or replace the main game's production style.

## Run and compare

Run `npm install` in a fresh checkout, then `npm run graphics:study`. Open **http://localhost:5190/?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined**.

Use **Figure detail → Earlier blockout / Refined from source** to compare geometry at the same resolution and scene. Pixel size, scene and contour settings are separate controls and survive reload through the URL. Both armies are shown. The normal `/` route still opens the game. The study is restricted to Vite development mode; public study assets are copied by Vite on this experimental branch. No dependency was added.

| Variant | Current content |
|---|---|
| `baseline` | Existing voxel models and Dungeon treatment |
| `sculpt` | Six original sculpts reduced to about 6,500 triangles with provisional colour zones |
| `rebuilt` | Refined Guard/Archer, switchable to the earlier primitive blockouts; other types remain original controls |
| `sprites` | Sixteen-angle bakes of the selected figure detail; fixed elevation, world-space motion |
| `quiet` | Actual QuietHours Canvas projection/drawing/shading/quantizer, using the earlier blockout pair only |

Scenes include a separated pair, a lower-angle overlap close-up, six types and a 32-piece visual stress board. The full board is not a legal starting army. QuietHours stays fixed-angle and pair-only.

## Richer models and source fidelity

| Asset | Earlier blockout | Current refined model | Preserved source features |
|---|---:|---:|---|
| Guard | 888 triangles | **12,000 triangles** | Curved shoulder wings, recessed helmet/face, layered chest and belly armour, collar/back ribs, gauntlets, individual fingers and boots |
| Archer | 970 triangles | **13,999 triangles** | Original slender proportions and pose, face and nose, braid, bodice, draped/split skirt, boots, two wrist crossbows and their small construction details |

These are source-derived refinements, not new designs and not a claim of hand-retopologized animation meshes. The sources contain 60,180 Guard and 36,502 Archer figure triangles. The separate `Texture` pedestal is excluded by material identity. This preserves the actual feet instead of clipping a fixed band off the bottom.

Local crease occlusion is baked into **COLOR_0** as a neutral multiplier. Smooth normals and a rough diffuse material let the sculpture's shallow detail read without drawing black lines around every face. Army/type colours remain assigned through material roles. The palette zones are still provisional spatial assignments; they need a cleaner art pass around small helmet/hood/weapon regions before production. No recovered original texture paint is claimed.

- [Current editable Blender source](rebuilt-pieces.blend): source-derived pair with material regions and crease-shading attributes.
- [Earlier editable blockouts](blockout-pieces.blend): original named primitive components.
- [Guard GLB](../../public/prototype/models/rebuilt-guard.glb) · [Archer GLB](../../public/prototype/models/rebuilt-archer.glb) · [Manifest](../../public/prototype/models/manifest.json).
- [Complete build recipe](../../tools/graphics-prototype/build_models.py) · [Refinement recipe](../../tools/graphics-prototype/refine_models.py).
- [Guard colour guide](../../public/prototype/source-guides/guard_color_ref.jpg) · [Archer colour guide](../../public/prototype/source-guides/Archer_color_ref.jpg).

The recipes require the curated `art-src/pieces/obj` source files; running the preview does not. Rebuild with:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python tools/graphics-prototype/build_models.py
```

## Colour, resolution and contours

Alabaster (`#DCC9A2`) and ink blue (`#485875`) remain the dominant army families. Guard has steel-blue/mint accents; Archer has green/ochre. Faces and clothing use shades of the army colour, so adding anatomy does not introduce unrelated skin/leather colours. Pawn controls use their army material only.

Measured total mesh surface area in army-family roles is about 96.5% for Guard and 86.7% for Archer. These include hidden/inside surfaces; they are not visible-area or recognition measurements. The material vocabulary is army, shade, light, ink, accent 1 and accent 2.

Pixel size 1 gives four times the screen sample area of 2 at the same camera. The 1.5 option is a compromise with uneven physical pixel blocks. The 0.5 option doubles both internal and output dimensions relative to 1, preserving the extra samples on high-density displays. It does not itself add geometry; the **Figure detail** control does that. The current build verifies that the 0.5 canvas has twice the CSS dimensions.

Contours offer Off / Even silhouette / Overlap aware. An ID mask identifies each entire figure, not its separate material/mesh parts. A one-render-texel contour follows only the visible foreground boundary; the adaptive mode strengthens low-contrast piece overlaps and adjusts light/dark ink to the surface. It does not expose completely hidden pieces. Sprite masks respect alpha and the current atlas view. The old Dungeon and QuietHours treatments remain separate.

The candidate pass performs one scene render with contours off and two with them on (beauty plus unlit piece IDs). The refined overlap scene measured **43 / 84 total composer draw calls**, versus 141 / 280 in the previous many-part blockout scene. There are more triangles but fewer part/material draws: neither figure alone is a hardware speed result. Higher pixel density increases render-target and fragment work.

## Animation and representation limits

Move and Ability demonstrate whole-piece movement, grounded contact shadows, a Guard ring and an Archer projectile. They illustrate presentation, not chess rules. The refined figures are static surfaces without a skeleton or articulated animation clips; the separate components in the earlier blockouts are not a rig either. Production animation remains an explicit asset step.

The refined sprite bake uses 256×256 cells at sixteen angles. Four 1024×1024 RGBA atlases for two figures/two armies use **16 MiB of base texels** before mipmaps, animation frames and runtime overhead. Earlier blockouts use 160×160 cells. The [saved refined atlases](../../public/prototype/atlases/) are reproducible samples; the study currently bakes at runtime. A production path should bake offline and pad/compress the atlas deliberately. A higher-resolution output cannot add detail absent from a sprite cell.

QuietHours remains a useful fixed-isometric reference. Its adapter uses the earlier low-triangle blockouts; feeding the refined meshes into this painter renderer would add a different performance/depth-sorting problem. The shell still starts WebGL, so it is not a fallback for devices without WebGL2. [Upstream provenance and MIT license](../../public/prototype/quiet-hours/README.md).

## Evidence and next art decision

[Refined pair at 0.5 px](captures/refined-pair-halfpx.png) · [Earlier blockouts at the same setting](captures/blockout-pair-halfpx.png) · [Overlap](captures/overlap-1px-adaptive.png) · [Phone full board](captures/board-mobile-fine-adaptive.png) · [Directional sprites](captures/sprites-desktop.png)

`npm run build` passes TypeScript and Vite compilation, with the existing large-chunk advisory. `npm run graphics:check` passes **33 checks with zero console/page errors**. It covers five representations, camera/view switching, Canvas pan, motion completion, both armies, 32 pieces, desktop/390×844 framing, pixel/grayscale controls, references, normal game boot, per-figure masks, real contour pixel changes, sprite cutouts, richer geometry/vertex colour, blockout comparison and double-density output. [Machine-readable record](verification.json).

The latest fixed overlap test changed 3,631 piece pixels and no board/background pixels; average display-value contrast across 871 horizontal figure boundaries rose from 61.5 to 64.4. Sprite masks filled 43–65% of their bounding rectangles, preserving transparent shapes. These are rendering checks, not human recognition scores. Blender source was reopened, and exported COLOR_0 data was checked to contain the crease shading rather than an unintended white channel.

All browser QA used software-rendered Chromium. Real-device FPS, battery use, colour-vision recognition, skeletal animation and full game regression are not established. The main game and its previously audited renderer issues remain unchanged.

The current visual direction is **source-faithful painted miniatures with controlled pixels and restrained contours**. The first blockouts removed too much identity. The refined source surfaces recover that identity, while the remaining paint placement and actual play-size readability need the owner's visual judgment. Compare these models before extending the treatment to the entire set. The [open-source comparison](open-source-alternatives.md) remains relevant; no engine migration is required for this refinement.
