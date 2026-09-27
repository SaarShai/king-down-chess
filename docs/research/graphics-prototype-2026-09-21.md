# Graphics follow-up: low-resolution pieces and QuietHours

The owner clarified that the original designs need adaptation to their actual pixel footprint, and authorized considering two new low-resolution models. A working five-way comparison now makes that question concrete.

**Preview:** http://localhost:5190/?study&variant=rebuilt
**Saved branch:** `codex/graphics-study`, latest commit `1a5ce28` (initial comparison: `b594f30`)
**Worktree:** `/Users/za/.codex/worktrees/graphics-study/king down chess`

[Study instructions, findings and limits](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/README.md>) · [Editable Blender source](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/rebuilt-pieces.blend>) · [Verification results](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/verification.json>)

## Walking preview on the approved figures

The refined Guard and Archer now have small skeletons and baked in-place walk cycles. The Guard uses nine bones and a deliberate 1.6-second gait; the Archer uses eleven bones and a lighter 1.2-second gait with arm counter-swing and skirt follow-through. Both retain the approved source geometry, feature colours and 0.5 px rendering. **Walk in place / Stop walking** plays both armies and blends back to the rest pose. The existing Move/Ability controls interrupt it; changing models or scenes cancels it. Sprites and QuietHours remain idle-pose comparisons.

The export uses ordinary glTF skinning and one `Walk` clip per asset, played with the existing Three AnimationMixer. The contour mask now skins the moving vertices too. All 42 browser checks pass with no console/page errors; build and Blender reopen pass. Actual boot vertices have no floor penetration, ground-contact error below 1.4e-8, loop seam below 2.5e-12 and exact restoration on stop. Animated contour masks have zero mismatches against a standard Three silhouette. Exported rest positions are identical to `bebe712`; weights, normals and palette data were verified. [Current study notes and limitations](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/README.md>) · [Walk capture](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/captures/walk-pair-halfpx.png>).

This establishes a first articulated motion preview on the current print sculpts. Walking across squares, turns, attacks, richer joint topology, animated sprite baking and physical-device performance remain separate work. The production game is unchanged.

## Latest correction: colour specific features and preserve their edges

The owner specified **Guard shoulder plates** and **Archer hood** as the identifying colour features. The refined pair now uses exactly two material roles, army and accent: blue shoulder plates / green hood, with face, braid, weapons and all other parts in the army family. The shoulder boundary follows the actual arch. The Archer's head faces diagonally in its source, so its hood opening now uses that 45° local frame rather than a straight-ahead face stencil. The asymmetric brow and lower hood edge were checked against neutral source renders.

The previous broad smoothing had softened structural features. This correction starts again from source, pins crease edges, protects the helmet/face and braid, limits relaxation to three light passes and caps movement at 0.3% of height. Weighted normals and more retained geometry make plate edges and small features clearer; the paint cuts preserve custom corner normals. Final figures contain 22,416 / 20,968 triangles. [Before this correction](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/captures/feature-definition-before-halfpx.png>) · [Current pair at unchanged 0.5 px](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/captures/refined-pair-halfpx.png>).

Nine ray checks at source landmarks confirm intended colour placement, and all **34 browser checks pass** with no console/page errors. Build, Blender reopen and exported normals/neutral crease colours/material roles pass. The updated two-material figures use 31 / 60 composer draw calls with contours off/on; geometry is heavier, so no hardware performance conclusion follows. Editable Blender, GLBs, directional atlases and captures are saved. The production game remains unchanged.

## Earlier cleanup: simplify the sculpt features at the approved resolution

The owner approved 0.5 px and requested tidier details, then clarified that selected features themselves need simplification/smoothing. The updated models selectively smooth armour, hood, cloth and small weapon ornament before reduction. The helmet/face, braid, fingers and collar ribs receive less smoothing. Clean continuous material boundaries replace the ragged triangle-based colour patches. Guard shoulder panels are now coherent blue areas; Archer hood and weapon accents are more restrained. The character designs and approved pixel setting remain the basis of the study.

The resulting Guard/Archer contain 13,987 / 15,886 triangles, including extra triangles for the clean material boundaries. Editable Blender sources, GLBs and four directional atlases are saved. Both armies were inspected from front/back and in overlap, including enlarged views. [Before cleanup](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/captures/detail-before-halfpx.png>) · [Cleaned pair at the same 0.5 px setting](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/captures/refined-pair-halfpx.png>).

Build and all 33 browser checks pass with no console/page errors; Blender reopen and exported normals/neutral crease colours were checked. Nearest filtering in the study's final compositor buffers prevents a one-level colour spill into an adjacent background pixel; the existing strict contour test now reports 3,540 changed piece pixels and zero background changes. Source-feature simplification is bounded and reproducible, not a claim of finished hand retopology or rigging. The production game remains unchanged.

## Earlier correction: richer models, not resolution alone

The owner clarified that more pixels also meant more actual character detail and a closer likeness to the original art. That pass derived Guard and Archer from their **original sculpt surfaces**, reduced to 12,000 and 13,999 triangles, with the original proportions, face, armour layers, braid, cloth folds, fingers and dual wrist-crossbow detail retained. The earlier primitive blockouts removed too much of that identity.

[Open the refined pair](http://localhost:5190/?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined). **Figure detail → Earlier blockout / Refined from source** compares the actual geometry at the same resolution. The previous blockouts remain available; the default refined models use soft surface shading and neutral baked crease occlusion alongside the army/type palette. The provisional colour boundaries from this pass were cleaned up above. Original texture paint and an animation rig have not been recovered.

Both editable Blender versions, GLBs and updated sixteen-view sprite atlases are saved. The refined pair uses four 1024×1024 atlases (16 MiB of base RGBA texels before animation/mipmaps/overhead); QuietHours retains its small original blockout pair. Build and **33 browser checks pass**, and the Blender source reopens. Model geometry and real COLOR_0 shading values were verified. The main game is unchanged; hardware performance remains unmeasured. [Current study notes](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/README.md>) supersede the initial geometry counts and art recommendation below.

## Earlier follow-up: more detail and dynamic contours

The study now includes **1 / 1.5 / 2 px** comparison and an **Overlap close-up** scene. [Open the finer, outlined version](http://localhost:5190/?study&variant=rebuilt&scene=overlap&pixels=1&contours=adaptive). Changing from 2 px blocks to 1 px gives four times as many screen samples at the same view, with no geometry change. The new 1.5 px default is a middle option; 1 or 2 px provides a more regular pixel grid than fractional scaling.

Contours can be off, even, or overlap-aware. The adaptive contour is one render texel wide, strengthens where visible figures overlap, and shifts between lighter and darker ink according to surface brightness. It identifies a whole figure, so it does not trace each mesh component or material seam. It never reveals fully hidden parts. The feature works on original meshes, rebuilt meshes and alpha-cutout directional sprites; Dungeon and QuietHours retain their earlier treatments.

My preference is **1 px with thin overlap-aware contours**, followed by an art pass for detail actually worth showing. More pixels improve existing shapes; they do not create missing facial/costume detail. On a full phone board, figure size still limits recognition, making zoom and silhouette decisions important.

Verification increased to **30 passing checks with no console/page errors**. In the fixed overlap view, contour changes affected 3,406 piece pixels and zero board/background pixels, and increased measured boundary contrast; this is a rendering check, not a human recognition score. Sprite masks retained their transparent silhouettes. Build passes. The candidate renderer uses one scene render with contours off and two with them on; finer pixels increase image-processing work. No real-device FPS conclusion is claimed. [Updated study notes and comparison images](</Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/README.md>).

## What was built

1. The existing Dungeon voxel treatment, as a control.
2. Six original sculptures simplified to about 6,500 triangles, with provisional colour regions.
3. New Guard (**888 triangles**) and Archer (**970 triangles**) meshes explicitly designed around broad planes, clear gaps and large colour regions. The existing colour guides and 3D models informed the rebuilds. Guard retains raised shoulder wings/recessed visor/heavy fists; Archer retains pointed hood/split skirt/**two wrist crossbows**.
4. Sixteen-angle sprites baked from these assets, with fixed camera elevation, stepped view changes, movement and world-space effects. Four pair/army atlases use 6.25 MiB of base RGBA texels before animation, mipmaps and runtime overhead.
5. A fixed isometric Canvas version using actual QuietHours projection, drawing, shading, glow and quantization code. The upstream MIT license and exact commit are bundled.

All are reachable through the same preview route and bottom switcher. Controls cover pixel size, grayscale, rotation, movement and an ability illustration. The Three.js variants support a both-army pair, six-type lineup and 32-piece visual stress board. The QuietHours experiment covers the pair only.

The main game's renderer and assets were not replaced. The experiment is saved on its own branch. Run `npm run graphics:study` there to restart the preview; no additional dependency is required beyond the existing package manifest.

## What the comparison tells us

**Keep Three.js, with deliberately authored low-resolution 3D as the leading direction.** The new pair has clearer broad forms, but looks more toy-like than the originals and needs a further art pass to recover the best of their personality. These are geometry studies, not finished character art or a selected style. This updates the initial audit's assumption that preserving the sculpt geometry and improving its rendering should lead the work.

Use warm alabaster and ink-blue army families; add steel-blue/mint to Guard and green/ochre to Archer. Pawn controls use only their army material. The material-role approach allows recolouring independently of geometry and can feed both live 3D and offline sprite bakes. Do not author separate unrelated paint schemes for each rendering mode.

Live 3D provides the best fit for continuous camera rotation, articulated animation, responsive light and expressive effects. The sprite option is credible if stepped rotation becomes an intentional visual feature. Its animation/view/army combinations multiply texture needs; triangle savings are not a measured performance win. The current sprite study has one idle pose per angle and is not a skeletal animation demo.

QuietHours is a valuable visual reference and small fixed-view renderer. Its [camera source](https://github.com/achrefelouafi/QuietHours/blob/73db46c2d1f26a5494a97c87097295865f9c8a2a/src/engine/camera.js) implements pan/zoom and fixed 2:1 projection, not free orbit. Much of its appeal comes from composition and deliberately authored shapes. Our mesh adapter has painter-order limitations and the surrounding study still starts WebGL, so it does not establish an older-device Canvas fallback.

The [open-source shortlist](graphics-alternatives-2026-09-21.md) includes Three.js's official pixel example, a Godot pixel-art shader demo, Isomer and Zdog. The most useful next borrowing is the Three.js example's pixel snapping, which this prototype has not implemented. The Godot demo is useful shader research; none of these alternatives currently justifies migrating the chess game.

## Verification and remaining decisions

- **22 browser checks pass; zero console/page errors.** Checks cover mode switching, directional view changes, Canvas pan, basic animation/return, both-army layouts, 32 pieces, desktop and 390×844 framing, pixel/grayscale controls, reference links and normal game boot.
- TypeScript and production build pass; Vite retains the existing large-bundle advisory.
- Both rebuilt roots reopen in the saved Blender source. The GLBs and four sample sprite atlases are committed with the study. Upstream QuietHours JS copies were verified unchanged; palette extensions are in our adapter.
- Screenshots were visually inspected on desktop and phone layouts. This uses software-rendered Chromium: **no physical-device FPS or battery claim**.

Next art decision: which of the five treatments feels right, and whether the rebuilt forms preserve enough of the original identity. Next engineering proof: finish two assets and their characteristic motions, implement the selected pixel treatment, then profile on an agreed older phone. The audit's duplicated render pass, idle particles, projectile-resource disposal and other production renderer findings remain separate unfinished implementation work.

![Rebuilt pair, both armies](/Users/za/.codex/worktrees/graphics-study/king down chess/docs/graphics-prototype/captures/rebuilt-desktop.png)

## Complete cast and fluid clay — 2026-09-21

Saved on `codex/graphics-study`, final commit `fbad268`. All sixteen existing designs now have refined source-derived 3D models and articulated movement, including the Queen and all six Kings. The new full-cast scene shows both armies; Character close-up inspects each model. Guard and Archer preserve the approved GLBs. Fourteen new rigs are editable in `docs/graphics-prototype/complete-cast.blend` in the graphics-study worktree.

The Look selector compares current rendering, polished plasticine and warmer handmade clay, inspired by Neverhood's tactile sets. Procedural surface variation, warm lighting, smooth spring motion or 12 fps cadence, compression/rebound and a poke action are live. Springs supplement the authored rig; this is not full soft-body collision simulation. Older rendering comparisons retain their own materials/lighting.

- [Complete cast](http://localhost:5190/?study&variant=rebuilt&scene=cast&pixels=1.5&contours=adaptive&detail=refined)
- [Handmade clay](http://localhost:5190/?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined&look=handmade&cadence=smooth)
- [Polished plasticine](http://localhost:5190/?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined&look=plasticine&cadence=stopmotion)

Build and 79 browser checks pass with zero page/console errors. All sixteen exported assets passed finite-position/unit-normal/normalized-skin checks and seamless clip endpoints. The seven royal/Paladin meshes were evaluated at 97 phases per clip; the largest floor penetration is 0.000257 world units, with no visible breach. Final poke tests compress to 94.23%, rebound to 101.30% and return exactly to rest at 120 or 15 updates/second. Evidence is in the worktree's `cast-verification.json`, `royal-verification.json`, README and clay-look notes. Model downloads total about 19.8 MiB; the full 32-figure cast is 761,446 triangles. Extra models load on demand; actual older-device performance still needs profiling.
