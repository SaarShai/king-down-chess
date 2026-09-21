# King Down graphics study — 21 September 2026

**Question:** can the existing Guard and Archer designs become clearer at small pixel sizes through deliberate low-resolution modelling, and which rendering approach preserves their character, camera freedom and animation potential?

This is an isolated candidate study on `codex/graphics-study`, based on `38fde50`. Nothing here selects a new production art style. The two rebuilt figures are rough geometry studies, not finished character art.

## Run and compare

Run `npm install` in a fresh checkout, then `npm run graphics:study`. Open **http://localhost:5190/?study&variant=rebuilt**. No new dependencies were added. The normal `/` route still opens the game. The study is gated to Vite development mode; production builds open the game. Public study assets are still copied by Vite on this experimental branch.

The bottom buttons or left/right arrow keys switch five candidates. Pixel size, scene, grayscale, rotation, movement and ability controls make the tradeoffs inspectable. QuietHours uses pan/zoom with a fixed angle; sprites lock elevation to the baked camera.

| Variant | What is real in the study | What it answers |
|---|---|---|
| `baseline` | Existing voxel models and Dungeon style on the comparison board | Reference for the current density and lost shape |
| `sculpt` | Six source OBJ sculptures simplified to about 6,500 triangles each; provisional paint zones | How much existing geometry survives a cleaner presentation |
| `rebuilt` | Newly authored Guard and Archer meshes, other types remain original sculpt controls | Whether broad planes and intentional gaps survive small pixels |
| `sprites` | Sixteen camera-angle bakes of each model/army used in the scene | Appearance and discontinuity of view switching while the world moves smoothly |
| `quiet` | Actual QuietHours Canvas projection/drawing/shading/ink quantizer, with a small mesh adapter | Fixed isometric presentation and the cost of losing free orbit |

The pair scene has both armies. The six-type lineup adds Pawn, Knight, Bishop and King. The 32-piece board is a visual stress arrangement, **not a legal starting army**. QuietHours is limited to the pair.

## Detail and overlap follow-up

The owner's next question was whether more pixels and dynamic outlines would improve detail and distinguish overlapping figures. Open [the overlap comparison](http://localhost:5190/?study&variant=rebuilt&scene=overlap&pixels=1&contours=adaptive). The settings are saved in the URL; no local storage is involved.

- **Pixel size:** 1 px gives twice the samples along each dimension, four times the sample area, compared with 2 px at the same camera/viewport. A new 1.5 px option is the default compromise, with approximately 1.78 times the sample area of 2 px. Fractional scaling is a compromise with uneven physical pixel blocks; 1 or 2 px gives a more regular grid. Geometry and sprite source detail are unchanged.
- **Contours:** Off / Even silhouette / Overlap aware. A visible-piece identity mask gives every component of one figure the same ID, so internal mesh joints and material seams do not receive outlines. The contour is one render texel wide, drawn inside the visible foreground figure. The adaptive option is subtle against the board and stronger where different figures meet, especially at low contrast; it uses lighter blue-grey ink on dark surfaces and dark ink on bright ones. It responds to the current camera and pose each frame. It does not reveal fully hidden figures.
- **Coverage:** Original sculpts, Rebuilt and directional Sprites. Sprite masks respect atlas alpha and the current view. Current Dungeon and QuietHours keep their original treatments; the contour control is disabled there. The new overlap scene lowers the camera for live 3D; sprites retain the elevation fixed by their bake.
- **Cost:** The candidate renderer now uses one scene render with contours off and two with contours on (beauty plus unlit IDs), replacing the candidate's former beauty/normal pass. The measured four-figure overlap view submitted 141 versus 280 draw calls across the composer; these are workload counts, not GPU timings. Finer resolution increases render-target and fragment work. The production game's renderer is unchanged.

My visual preference is **1 px with Overlap aware**, keeping broader shapes and restrained colour rather than adding tiny painted noise. This reveals more existing detail; it does not recover facial/costume detail that has not yet been modelled. Full-board phone figures remain small, so zoom/inspection and carefully chosen proportions still matter.

[2 px, contours off](captures/overlap-2px-off.png) · [1 px, contours off](captures/overlap-1px-off.png) · [1 px, adaptive contours](captures/overlap-1px-adaptive.png) · [Even contours](captures/overlap-1px-silhouette.png) · [Phone](captures/overlap-mobile-adaptive.png) · [Phone full board](captures/board-mobile-fine-adaptive.png)

The GPU mask contained exactly four figure IDs despite their many mesh components. In the fixed test view, mean absolute luminance difference across 875 horizontal piece boundaries rose from 47.3 to 59.7 on an 8-bit display-value scale. This is a local edge-contrast check, **not a human recognition score**. Of 3,406 changed image pixels, none lay on the board/background. Sprite masks occupied 49–63% of their bounding rectangles, confirming transparent cutouts were retained. [Evidence](verification.json).

Implementation: [PieceContourPass](../../src/render/prototype/PieceContourPass.ts). Existing Three.js pass behavior was checked against the installed r186 code and [official pixel-pass documentation](https://threejs.org/docs/pages/RenderPixelatedPass.html). No dependency was added. Pixel snapping and real-device performance remain untested.

## Actual new assets

- [Editable Blender source](rebuilt-pieces.blend): two roots, with named parts and assigned material roles. Reopened successfully in Blender 5.2.0 LTS: Guard 26 descendants, Archer 33.
- [Guard GLB](../../public/prototype/models/rebuilt-guard.glb): **888 triangles**.
- [Archer GLB](../../public/prototype/models/rebuilt-archer.glb): **970 triangles**.
- [Model recipe](../../tools/graphics-prototype/build_models.py), [model manifest](../../public/prototype/models/manifest.json), and [four saved directional atlases](../../public/prototype/atlases/).

Guard retains the raised shoulder wings, recessed helmet, pointed belly armour, fists and short legs. Archer retains the hood, split skirt, raised/lowered arms and **two wrist crossbows**. The geometry deliberately exaggerates separations and broadens small features. This is reinterpretation for readability, so the owner still needs to judge whether the likeness is close enough.

References: the existing `Guard_22mm.obj` and `Archer_2.obj`, plus [Guard colour guide](../../public/prototype/source-guides/guard_color_ref.jpg) and [Archer colour guide](../../public/prototype/source-guides/Archer_color_ref.jpg). Those original 2D guides are bundled for side-by-side inspection. Rebuilding the GLBs from the script additionally requires the curated `art-src/pieces/obj` source files; running the preview does not.

```sh
/Applications/Blender.app/Contents/MacOS/Blender -b --python tools/graphics-prototype/build_models.py
```

## Colour and motion

Alabaster (`#DCC9A2`) and ink blue (`#485875`) are the dominant army families, each with a small shade/highlight ramp. Guard accents are steel blue and mint; Archer accents are green and ochre. Pawn geometry uses only its army material. These are candidate palettes, not approved colours or measured surface-area allocations.

The material roles—army, shade, light, ink, accent 1, accent 2—separate colour intent from rendering. The six original controls have approximate region assignments rather than recovered source paint. The rebuilt models use deliberate named regions.

Move and Ability demonstrate whole-piece motion, a grounded contact shadow, an expanding Guard ring and an Archer projectile. They are illustrative effects, not changes to chess rules. The new pieces have separated components but **no skeleton or authored skeletal clips**. Sprites have one idle pose per viewing angle, not an animated attack bake. The Canvas study demonstrates translation and a glow; it does not reproduce all of the 3D effects or articulated motion.

## Findings and recommendation

The rebuilt pair has broader, more stable shapes than the voxel conversion. It also looks more toy-like and loses sculptural nuance; the next art pass should refine the Guard's shoulder/body proportions and the Archer's face/cloth before treating this as finished production art. Simply simplifying the source mesh does not automatically select which forms deserve the limited pixels.

**Keep Three.js and develop intentionally authored low-resolution 3D as the leading candidate.** Use the source designs as the identity reference, with the model built around a target on-screen size. That retains continuous rotation, shared world lighting, articulated motion and 3D effects. Test pixel snapping using the official Three.js example after the appearance is chosen; this study does not implement it yet.

Directional sprites are a viable alternative if the stepped view and fixed elevation are welcome stylistic choices. Four 640×640 RGBA atlases for the two pieces and two armies use **6.25 MiB of base texels**, before animation frames, mipmaps, texture copies or driver overhead. Fewer triangles alone is not proof of a faster frame. The saved PNGs are examples; the prototype currently bakes at runtime for comparison. A production implementation should bake offline, pad atlas cells and deliberately choose filtering/compression.

QuietHours has attractive art rules to borrow, but its fixed 2:1 Canvas projection is a different camera contract. Our adapter painter-sorts mesh triangles and can misorder intersecting surfaces; it is not a general mesh renderer. The surrounding study still initializes Three.js/WebGL, so this is **not a proven fallback for devices without WebGL2**. The original QuietHours primitives and scene composition are better suited to its painter renderer than imported arbitrary meshes.

The remaining framework shortlist and primary sources are in [open-source alternatives](open-source-alternatives.md). Three.js's own pixel example is the closest reusable technique. The Godot demo is a shader reference, while Isomer and Zdog require different authoring/camera compromises.

## Verification and limits

`npm run build` passes TypeScript and Vite production compilation; the existing large-chunk advisory remains. `npm run graphics:check` passes **30 checks with zero page/console errors**, exercising five modes, view switching, Canvas pan, animation completion, both-army lineups, 32 pieces, desktop and 390×844 framing, pixel/grayscale controls, source links and the ordinary game route. The follow-up also checks resolution ratios, URL settings, piece masks, actual contour pixel differences, sprite cutouts and skipping the ID draw when off. [Machine-readable results](verification.json) include browser version and observed geometry counts.

[Rebuilt desktop](captures/rebuilt-desktop.png) · [Phone](captures/rebuilt-mobile-pair.png) · [Phone, full board](captures/rebuilt-mobile.png) · [16-angle sprites](captures/sprites-desktop.png) · [QuietHours](captures/quiet-desktop.png) · [Original controls](captures/sculpt-desktop.png) · [Current voxels](captures/baseline-desktop.png)

These checks use Chromium software rendering, not physical mobile hardware. They establish functionality and framing, not FPS, battery life, colour-blind recognition or that an observer can identify every piece at a glance. The production two-scene pixel pass and broader renderer resource findings from the audit remain to be addressed; the candidate pass above is confined to this study. No full game regression, all-piece animation library or production asset pipeline is claimed.

Before adoption, choose the visual direction from this comparison, finish two representative assets, and profile the resulting board on an agreed older phone. Extend the chosen treatment to the full set only after that evidence. Keep effects in the same visual language: army-coloured fragments, restrained type-colour trails, brief contact flashes and clear tactical markers.
