# King Down graphics study — 21 September 2026

**Current question:** extend the approved source-derived treatment to the complete cast, then explore tactile clay and fluid or stepped animation without losing the existing designs. The 0.5 px option is retained.

All sixteen designs now use their **original sculpt surfaces**, with feature-specific colour and articulated movement. Guard and Archer retain their approved files. The first primitive blockouts remain switchable. This is an isolated art/rendering study on `codex/graphics-study`; it does not select or replace the main game's production style.

## Run and compare

Run `npm install` in a fresh checkout, then `npm run graphics:study`. Open **http://localhost:5190/?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined**.

Use **Figure detail → Earlier blockout / Refined from source** to compare geometry at the same resolution and scene. Pixel size, scene and contour settings are separate controls and survive reload through the URL. Both armies are shown. The normal `/` route still opens the game. The study is restricted to Vite development mode; public study assets are copied by Vite on this experimental branch. No dependency was added.

| Variant | Current content |
|---|---|
| `baseline` | Existing voxel models and Dungeon treatment |
| `sculpt` | Six original sculpts reduced to about 6,500 triangles with provisional colour zones |
| `rebuilt` | All sixteen refined designs, with current / polished plasticine / handmade clay looks; earlier Guard/Archer blockouts remain switchable |
| `sprites` | Sixteen-angle bakes of the selected figure detail; fixed elevation, world-space motion |
| `quiet` | Actual QuietHours Canvas projection/drawing/shading/quantizer, using the earlier blockout pair only |

Scenes include a separated pair, a lower-angle overlap close-up, six types, a 32-piece visual stress board, **All 16 designs** in both armies and **Character close-up** with a model selector. The full board is not a legal starting army. QuietHours stays fixed-angle and pair-only.

## Complete cast and clay experiments

The cast comprises Pawn, Knight, Bishop, Rook, Queen, Guard, Archer, Paladin, Maester, Beast, and the Ember, Frost, Gaya, Celestial, Shadow and Spirit Kings. Alternate pawn/knight poses are not distinct character designs. Both armies use the same geometry; the Pawn has no type accent. `CastCatalog.ts` lists each accent feature.

- [Complete cast](http://localhost:5190/?study&variant=rebuilt&scene=cast&pixels=1&contours=adaptive&detail=refined)
- [Queen close-up](http://localhost:5190/?study&variant=rebuilt&scene=character&character=queen&pixels=0.5&contours=adaptive&detail=refined&look=handmade)
- [Handmade clay pair](http://localhost:5190/?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined&look=handmade&cadence=smooth)
- [Polished plasticine pair](http://localhost:5190/?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined&look=plasticine&cadence=stopmotion)

New pieces use 9–11 deform bones with baked `Walk` clips. Gaits respect the posed sculpts: braced two-hand weapons, smaller armoured steps, concealed steps under closed robes, separate cloth/cape motion and a Beast tail. These are source-sculpt deformation rigs, not hand-retopologized production characters. The Queen and the closed robes of Shadow/Spirit keep their original lower silhouettes.

Fourteen additional exports and their editable rigs are in `complete-cast.blend`; the approved Guard/Archer remain in `rebuilt-pieces.blend`. Rebuild the new cast with Blender `--background --python tools/graphics-prototype/build_roster.py`. `sculpt_surface.py` shares the original surface-cleanup code; authored landmarks/paint volumes live in `roster_profiles.py`. Source quads are triangulated before paint cuts so boundaries preserve the surface. The Paladin retains its full usable source detail: reduction destroyed its extremities, and a height-preservation assertion now catches that failure.

The sixteen models total about **19.8 MiB** of uncompressed GLB files. The 32-figure cast scene draws **761,446 figure triangles**, plus board/effects; the pair route loads the extra cast only when needed. Two shared 96×96 procedural maps per clay look provide stable surface variation. Existing comparison modes retain their original materials and lighting. This does not establish performance on older phones; device profiling and appropriate LODs are still needed before production adoption.

[Clay appearances and movement](clay-looks.md) document the Neverhood reference, material options and lightweight spring motion. `Poke / squish clay` provides an interactive deformation experiment. The clay effect is spring-driven secondary animation, not soft-body collision simulation.

`npm run graphics:check:cast` passes **37 checks with zero browser errors**, covering complete-cast loading, independent army rigs, sixteen character selectors, movement, clay materials/UVs, compression/reset, cadence, URL state, phone layout and returning to older comparisons. [Integration evidence](cast-verification.json) supplements the existing 42 graphics checks. All sixteen assets have finite positions, unit normals, valid normalized skin weights and matching animation endpoints. [Evaluated royal/Paladin geometry](royal-verification.json) was also sampled at 97 phases per clip: no visible floor breach, maximum numerical penetration 0.000257 world units, and matching evaluated mesh endpoints. The Gaya robe has 0.001297 world units of minimum clearance. These small sculpt/weight tolerances are recorded rather than claimed as a collision solver. [Complete-cast capture](captures/complete-cast-current.png).

## Richer models and source fidelity

| Asset | Earlier blockout | Current refined model | Preserved source features |
|---|---:|---:|---|
| Guard | 888 triangles | **22,416 triangles** | Curved shoulder wings, recessed helmet/face, layered chest and belly armour, collar/back ribs, gauntlets, individual fingers and boots |
| Archer | 970 triangles | **20,968 triangles** | Original slender proportions and pose, face and nose, braid, bodice, draped/split skirt, boots and two wrist crossbows |

These are source-derived refinements, not new designs and not a claim of hand-retopologized animation meshes. The sources contain 60,180 Guard and 36,502 Archer figure triangles. The separate `Texture` pedestal is excluded by material identity. This preserves the actual feet instead of clipping a fixed band off the bottom.

The preceding smoothing pass softened some structural edges. This revision starts again from the original source, pins vertices on sharp creases, protects the helmet/face and braid, and uses just three light relaxation passes. Maximum vertex movement is capped at **0.3% of figure height** (previous shoulder pass: 2%). The reduction keeps more of the source shape: about 18,000 / 20,000 triangles before paint cuts. Weighted surface normals preserve clear plate edges; their per-corner values are retained through the paint cuts instead of being averaged away. This is a targeted geometry/shading correction, not a resolution change or hand-retopology claim.

The shoulder accent follows a traced arch and wraps around the plates. The Archer's head faces diagonally in the source mesh: the hood opening is now authored in that 45° local frame, including its asymmetric brow and tapered lower edge. A world-aligned face stencil was colouring parts of the wrong surfaces. The refined models now have only **army** and **accent1** materials. Mint eyes, ochre weapons and other coloured fragments are removed; faces, braid, torso, skirt and weapons use the army colour.

Source geometry inspection: [Guard frontal surfaces](captures/guard-source-front.png) · [Archer head in its own facing direction](captures/archer-source-head-aligned.png). These are neutral renders of the original OBJ geometry, used to locate actual feature boundaries.

Colour boundaries are cut into the mesh rather than assigned to whole triangles by their centres. The cuts subdivide existing surfaces and interpolate corner normals and crease shading. Surface-area preservation is asserted in the build (current relative error below 1.3×10⁻⁸). Nine rays into named source landmarks verify coloured shoulders/hood and army-coloured helmet, chest, face, chin and braid. The source recipe and manifest record those checks.

Local crease occlusion is baked into **COLOR_0** as a neutral multiplier. Smooth normals and a rough diffuse material let the sculpture read without drawing black lines around every face. Army/type colours remain regular material roles, including in sprite bakes and editable Blender files. These are authored spatial paint regions, not recovered original texture paint.

- [Current editable Blender source](rebuilt-pieces.blend): source-derived pair with material regions and crease-shading attributes.
- [Earlier editable blockouts](blockout-pieces.blend): original named primitive components.
- [Guard GLB](../../public/prototype/models/rebuilt-guard.glb) · [Archer GLB](../../public/prototype/models/rebuilt-archer.glb) · [Manifest](../../public/prototype/models/manifest.json).
- [Complete build recipe](../../tools/graphics-prototype/build_models.py) · [Refinement recipe](../../tools/graphics-prototype/refine_models.py) · [Paint outlines and surface cuts](../../tools/graphics-prototype/paint_regions.py).
- [Guard colour guide](../../public/prototype/source-guides/guard_color_ref.jpg) · [Archer colour guide](../../public/prototype/source-guides/Archer_color_ref.jpg).

The recipes require the curated `art-src/pieces/obj` source files; running the preview does not. Rebuild with:

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python tools/graphics-prototype/build_models.py
```

## Colour, resolution and contours

Alabaster (`#DCC9A2`) and ink blue (`#485875`) remain the dominant army families. Guard uses steel blue only on shoulder plates; Archer uses green only on the hood. Faces and clothing use shades of the army colour, so adding anatomy does not introduce unrelated skin/leather colours. Pawn controls use their army material only.

Measured total mesh surface area in army-family roles is about 81.8% for Guard and 94.3% for Archer. These include hidden/inside surfaces; they are not visible-area or recognition measurements. The refined pair uses only army and accent 1. The earlier blockouts and original-sculpt controls retain their historical palette assignments.

Pixel size 1 gives four times the screen sample area of 2 at the same camera. The 1.5 option is a compromise with uneven physical pixel blocks. The 0.5 option doubles both internal and output dimensions relative to 1, preserving the extra samples on high-density displays. It does not itself add geometry; the **Figure detail** control does that. The current build verifies that the 0.5 canvas has twice the CSS dimensions.

Contours offer Off / Even silhouette / Overlap aware. An ID mask identifies each entire figure, not its separate material/mesh parts. A one-render-texel contour follows only the visible foreground boundary; the adaptive mode strengthens low-contrast piece overlaps and adjusts light/dark ink to the surface. It does not expose completely hidden pieces. Sprite masks respect alpha and the current atlas view. The old Dungeon and QuietHours treatments remain separate.

The candidate pass performs one scene render with contours off and two with them on (beauty plus unlit piece IDs). The refined overlap scene measured **31 / 60 total composer draw calls**, down from 43 / 84 in the previous five-material refined pair (blockouts: 141 / 280). There are more triangles but fewer part/material draws: neither figure alone is a hardware speed result. Higher pixel density increases render-target and fragment work.

## Animation and representation limits

**Walk in place** plays articulated cycles on both armies: a 1.6-second, nine-bone Guard walk and a 1.2-second, eleven-bone Archer walk. The Guard takes short steps with a restrained weight shift; the Archer has longer steps, an opposing arm swing and two gently trailing skirt regions. Hip/knee/ankle motion is baked from foot targets with 60% stance timing, so at least one foot remains grounded. The boot soles stay level. The identifying shoulder plates, hood and face retain their shapes and colours.

The skeletons and ordinary `Walk` clips are embedded in the GLBs and saved in the editable Blender file. `tools/graphics-prototype/rig_walk.py` authors the weights and bakes the cycles; `refine_models.py` exports only the selected rig's active action, starting at time zero. In Blender, switch the armature from Rest Position to Pose Position to play it. Three's existing AnimationMixer handles playback independently per figure, with a short blend into/out of the rest pose. No animation library was added. The piece-ID shader now applies the same skinning as the visible figure, keeping contours attached to moving limbs.

This is an **in-place motion study**, not movement across chess squares. Move and Ability retain their earlier whole-piece presentation, Guard ring and Archer projectile. Those controls interrupt walking cleanly; changing models/scenes stops it. There is no automatic walking on page load. Original-sculpt controls, blockouts, sprites and QuietHours do not have articulated cycles. The source remains a print sculpt with authored skin weights, not a production animation retopology; larger poses, turns, attacks and joint deformation still need their own art pass.

The refined sprite bake uses 256×256 cells at sixteen angles. Four 1024×1024 RGBA atlases for two figures/two armies use **16 MiB of base texels** before mipmaps, animation frames and runtime overhead. Earlier blockouts use 160×160 cells. The [saved refined atlases](../../public/prototype/atlases/) are reproducible samples; the study currently bakes at runtime. A production path should bake offline and pad/compress the atlas deliberately. A higher-resolution output cannot add detail absent from a sprite cell.

QuietHours remains a useful fixed-isometric reference. Its adapter uses the earlier low-triangle blockouts; feeding the refined meshes into this painter renderer would add a different performance/depth-sorting problem. The shell still starts WebGL, so it is not a fallback for devices without WebGL2. [Upstream provenance and MIT license](../../public/prototype/quiet-hours/README.md).

## Evidence and next art decision

[Before this correction at 0.5 px](captures/feature-definition-before-halfpx.png) · [Before the earlier cleanup](captures/detail-before-halfpx.png) · [Cleaned pair at the same setting](captures/refined-pair-halfpx.png) · [Earlier blockouts](captures/blockout-pair-halfpx.png) · [Overlap](captures/overlap-1px-adaptive.png) · [Phone full board](captures/board-mobile-fine-adaptive.png) · [Directional sprites](captures/sprites-desktop.png)

`npm run build` passes TypeScript and Vite compilation, with the existing large-chunk advisory. `npm run graphics:check` passes **42 checks with zero console/page errors**. It covers five representations, camera/view switching, Canvas pan, motion completion, both armies, 32 pieces, desktop/390×844 framing, pixel/grayscale controls, references, normal game boot, per-figure masks, real contour pixel changes, sprite cutouts, richer geometry/vertex colour, blockout comparison, double-density output the restricted two-material palette, walk deformation/contact/loop continuity, independent rigs, animated silhouette parity and playback cancellation. [Machine-readable record](verification.json).

The latest fixed overlap test changed 3,641 piece pixels and no board/background pixels; average display-value contrast across 871 horizontal figure boundaries rose from 43.9 to 53.5. Sprite masks filled 43–65% of their bounding rectangles, preserving transparent shapes. The final compositor buffers now use nearest filtering: the default linear filtering introduced a one-channel, one-level change in one adjacent background pixel. The existing strict zero-background-change check caught it and now passes unchanged. These are rendering checks, not human recognition scores. Blender source was reopened, and exported normals and neutral COLOR_0 data were verified.

[Exported asset checks](asset-verification.json) confirm finite positions, unit normals, normalized skin weights, neutral crease colours and exactly the army/accent material pair. Exported rest positions are identical to the approved `bebe712` models. Each GLB contains exactly one seamless `Walk` clip; files are about 1.35 MB / 0.94 MB. Browser checks sample actual deformed boot vertices throughout a cycle, verify independent skeleton instances and compare animated contour masks against a standard Three material. [Walking pair](captures/walk-pair-halfpx.png).

All browser QA used software-rendered Chromium. Real-device FPS, battery use, colour-vision recognition and full game regression are not established. The main game and its previously audited renderer issues remain unchanged.

The current visual direction is **source-faithful painted miniatures with controlled pixels and restrained contours**. The first blockouts removed too much identity. The refined source surfaces recover that identity; this correction keeps structural edges crisp and places each accent on one identifying feature. The amount of simplification and actual play-size readability still need the owner's visual judgment. The entire available sculpt set is now included; remaining art decisions concern the clay treatment, accent refinement and motion character. The [open-source comparison](open-source-alternatives.md) remains relevant; no engine migration is required for this refinement.
