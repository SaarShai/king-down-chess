# King Down graphics audit — 21 September 2026

**Updated recommendation: keep Three.js and the existing game integration, with deliberately authored low-resolution 3D as the leading candidate. Preserve the character designs while adapting their geometry to the actual pixel footprint.** The owner clarified that preserving the original sculpt geometry is not enough. A [five-option interactive study](graphics-prototype-2026-09-21.md) now compares the current voxels, simplified originals, newly rebuilt Guard/Archer, 16-angle sprites and actual QuietHours Canvas rendering. The new models are rough studies, not adopted production art. The biggest problems remain shape, colour regions, lighting and screen space; engine migration alone would not solve them.

This is an audit and proposed direction, not an adopted art change. The main game source, rules, assets and published build remain unchanged; the follow-up prototype is isolated on `codex/graphics-study` (`b594f30`). Inspected game baseline: `38fde50`; earlier Claude/Codex decisions reconciled through TASKS, LESSONS, source inventories and existing style reports. The earlier B2 Dungeon choice remains the current default.

## 1. What is actually here

| Area | Current implementation | What can be retained |
|---|---|---|
| Engine | Plain TypeScript + Three.js; orthographic camera, OrbitControls, DOM interface | Game/rules integration, camera navigation, picking and move sequencing |
| Main pieces | 11 voxelized sculptures, cached geometry, vertex colours, Lambert or toon shading | Sculpture proportions and designs; original meshes remain available |
| Alternate pieces | Single-image billboard planes, painted PNGs, optional outline | Existing sprite loading and shared movement animations |
| Rendering | Always RenderPixelatedPass, then OutputPass; optional palette pass | Optional pixel treatment, but it should not be mandatory for every style |
| Default Dungeon | Pixel size 2, resolution ratio 1, warm four-point lighting, stone tiles, contact discs | Mood, miniature board, modest effects and elevated camera |
| Motion | Whole-piece hops, swaps, chain lunges, projectiles, pooled debris and camera shake | Most timing/sequencing; new visuals can reuse movement paths |
| Source art | 20 OBJ files, painted/grey PNGs, 14 character colour guides plus army Pantone reference | A strong production starting point; redesign is unnecessary |

The local OBJs contain **36,389–67,402 triangles each**, with UV, normal and material-reference records. They are geometry sources, not complete animated runtime assets: referenced MTL/texture files and a rig/animation bundle are absent locally. The manifest calls them game-ready; that needs qualification for mobile. The polypainted ZBrush masters were left on Drive during an earlier size-limited curation. They might save paint-authoring work, but nothing in this audit depends on downloading them.

The current models are **34–35 cells high after base trimming**, and generate **2,840–9,260 triangles per piece**. Voxel appearance does not automatically mean exceptionally cheap geometry. [Inventory](graphics-audit-2026-09-21/asset-inventory.json), [source manifest](../../art-src/MANIFEST.md).

## 2. Why the current pieces lose their character

### Shape is discarded before the image reaches the screen

The mesh becomes a coarse occupancy grid, then the rendered scene is reduced again. Turning pixel size down to 1 restores screen samples, but cannot recover the bow, facial planes, robe edges or gaps already removed by voxelization. The live comparison supports this: the pixel-size-1 view remains recognizably the same coarse sculpture.

The existing `cel` preset still uses voxel geometry. It is **not** evidence of what the original meshes would look like with clean cel shading.

[Current Dungeon](graphics-audit-2026-09-21/dungeon-desktop.png) · [Same geometry at pixel size 1](graphics-audit-2026-09-21/dungeon-px1.png) · [Existing cel preset](graphics-audit-2026-09-21/cel-desktop.png)

### The paint pipeline does not express the requested colour hierarchy

The model stores arbitrary RGB accents and a shade byte, not semantic regions such as army/body, type/accent 1, type/accent 2. Paint extraction preferentially preserves warm or emissive colours, and can fold cool cloth/armour into the army tint. The paint tool even fills an accent quota with bright voxels when too little warm paint is found.

Measured stored accent shares range from **17.7% to 61.7% of occupied voxels**; Knight is 61.7%, Pawn 33.4%. These are data counts, **not visible surface-area measurements**. There are 194–566 distinct accent RGB values per piece. Shading legitimately needs colour variation, but none of this guarantees one dominant army colour and one or two intentionally chosen secondary colours.

Voxel and sprite modes also default to different army schemes: ivory/slate versus painted blue/red. The sprite examples include different king designs for the two armies. Those can be legitimate choices, but they confound an attempt to compare rendering methods alone.

Relevant implementation: [voxel colours](../../src/render/voxels.ts), [paint extraction](../../tools/paint-voxels.py), [sprite tinting](../../tools/sprites-painted.py). **The default Dungeon palette pass is off**; DB32 quantization is not the cause of its current muddiness. The dither setting likewise has no visible effect while that pass is disabled.

### Lighting and board detail compete with identity

The dark army sinks into dark tiles in the observed Dungeon view. Warm light also pulls both armies toward brown. The high-detail stone and border occupy some of the same visual frequencies as the tiny figures. A hero material needs a guaranteed readable shadow floor; torch pools should supply atmosphere without deciding whether a piece is identifiable.

At 390 × 844, the visible board is only 390 CSS pixels wide: individual squares are roughly 41 pixels across. Thin type accents disappear quickly. The fixed title/status panel visibly covers the upper-left part of the board. That layout issue must be solved alongside the rendering; extra geometry cannot recover covered screen space.

[Mobile evidence](graphics-audit-2026-09-21/dungeon-mobile.png)

### Sprites improve detail, but the current implementation has its own limitations

The current sprite mode preserves many details from the colour guides. However, it shows one view from every orbit angle, uses an unlit material, uses nearest sampling without mipmaps, and makes pieces much taller on screen. Foreground sprites cover pieces behind them. Its baked light cannot respond to the torches. Enlarging these sprites is not a complete solution.

[Existing sprites](graphics-audit-2026-09-21/sprites-desktop.png) · [Sprites in Dungeon lighting](graphics-audit-2026-09-21/dungeon-sprites.png) · [implementation](../../src/render/sprites.ts)

## 3. Recommended art direction: enchanted painted miniatures

Preserve the existing anatomy, poses, clothes, props and broad proportions. Give the set a deliberate material language: painted stone or enamel, restrained metallic trim, soft directional modelling, readable contact shadows and occasional luminous inscriptions. Aim for the charm of a beautifully made physical set that briefly comes alive.

This keeps the Dungeon atmosphere while letting the character art lead. Use clean silhouettes, broad areas of colour and a quiet board. Test smooth modelling with three or four broad tonal levels; avoid forcing every small sculpt detail into a black outline. At play distance, suppress fine surface noise. On inspection/zoom, allow the original detail to emerge.

A thin controlled rim or outline can separate pieces, but should be evaluated on both armies and both square colours. A dark outline alone cannot rescue a dark figure on a dark tile. Keep tactical markers distinct in shape from decorative light.

### Army and piece colour rules

A useful first pairing is **warm alabaster** (`#DCCDA8`) against **ink slate** (`#343B55`). These are starting swatches, not approved colours or final lit pixel values. Each has lighter and darker shades within the same colour family. Another pair can be chosen later without repainting the whole set.

Proposed visible-area allocation at normal play scale: roughly **75–85% army family, 15–25% type accents combined**. Judge this in rendered front, rear and oblique views, not by mesh vertex count. Pawns get the army family and its shading only. Neutral-looking props should not quietly introduce several extra material colours.

Use the same type accent families on both sides, adjusted in brightness to survive their different body colours. Accent placement should wrap onto a visible upper/rear surface where possible, so viewing the back of the opposing army does not erase all identity. The existing silhouettes remain the first cue; colour reinforces them.

| Piece | Proposed secondary colour family/families | Existing feature to carry it |
|---|---|---|
| Pawn | None | Body, helmet and weapon stay within army tones |
| Knight | Vermilion, muted brass | Helmet crest and existing cape/trim |
| Bishop | Mulberry, pale gold | Tall headpiece and robe panel |
| Rook | Moss, sandstone | Existing stone arm/crown details; leave most mass army-coloured |
| Queen | Carmine, rose gold | Existing dress piping and crown |
| King | Antique gold, ice turquoise | Crown and existing upper-body ornament |
| Archer | Leaf green, ochre | Hood/cloth panel and two wrist-crossbow details |
| Paladin | Cobalt, gold | Shield panel and existing cross |
| Guard | Steel blue, pale mint | Upper armour rim and visor detail |
| Maester | Copper, turquoise | Existing mechanism and goggles |
| Beast | Burnt orange, bone | Mouth/eye region and teeth/horns |

This is a palette proposal derived from existing motifs, not a request to repaint every surface with the original naturalistic materials. Ten types cannot be made universally distinguishable by hue alone. Validate their silhouettes, accent placement, value and optional matching UI icon together, including grayscale and colour-vision simulations. New elemental king variants should remain readable as kings without consuming the entire army palette.

## 4. Rendering alternatives

| Approach | Clarity and style | Camera and animation | Assessment |
|---|---|---|---|
| Refined current voxels | Can improve with paint masks, brighter form light and quieter ground; fine silhouette details remain lost | Free orbit and current whole-piece animation work | Lowest-cost comparison/control; acceptable if the owner prefers its tactile pixel quality |
| Optimized sculpt meshes in stylized 3D | Best chance of preserving the existing designs and keeping a coherent lit world | Free orbit, zoom, shadows, whole-piece motion; optional joints/rigs later | **Leading recommendation** |
| One-view illustrated billboards | Strong control of each illustration; clear at its intended scale | Best with fixed camera; orbit reveals cardboard behaviour; articulation needs extra art | Good for a deliberately fixed-camera game, less aligned with current camera freedom |
| Multi-angle rendered sprites in 3D | Carefully art-directed, potentially distinctive miniature theatre | Discrete views; camera elevation must be designed; pose frames multiply assets | **Strong second candidate**, particularly for a more authored or stop-motion feel |

### How the multi-angle version should work

Start by comparing **8, 12 and 16 azimuth views** for a few pieces. They correspond to 45°, 30° and 22.5° steps. Select the view from camera azimuth **relative to piece facing**, including black's orientation. Use a consistent foot pivot, scale, camera projection, crop and shared atlas bounds across every view and pose. Add hysteresis so a stationary camera near a sector border does not flicker between views.

A single elevation ring cannot represent the existing OrbitControls range of approximately 18–76° elevation. Either constrain play to a comfortable elevated band, add a small number of elevation rings, or offer deliberately snapped viewpoints. Full unrestricted orbit is where real 3D earns its keep. A subtle hard switch can be a stylistic choice; cross-fading may produce double silhouettes and is not automatically better.

Keep movement in world space, with a separate ground shadow and 3D projectiles/effects. A sprite is still a plane in the depth buffer: multi-angle pictures do not give it true internal depth. Normal/depth textures can improve relighting and intersection, but add assets and shader work. Begin with restrained baked diffuse light plus ambient tint, not highly directional baked highlights that visibly turn with the selected frame. Add such maps only if a demonstrated issue justifies them.

Use texture filtering, mipmaps and atlas padding appropriate to the chosen look. Nearest filtering is a deliberate pixel-art choice, not a universal way to make illustrated sprites sharper. Alpha-tested cards help avoid sorting, but their edges and transparent-region picking need explicit checks. The current picking code raycasts the entire billboard rectangle; it does not inspect the PNG's alpha.

**Texture cost is the principal trap.** For 11 types × 2 separately baked armies × 16 angles × 256 × 256 RGBA frames, one idle pose is **88 MiB uncompressed**, or about **117 MiB with a full mip chain**, before atlas padding and other maps. Eight pose frames become approximately **939 MiB with mips**. A colour-mask recolouring scheme can avoid duplicating the entire image for armies, but masks and shading channels also occupy memory. GPU texture compression and smaller/tightly packed frames can help; small PNG/WebP download size does not imply small GPU residency.

Therefore, do not bake a walking animation for every direction by default. Whole-piece movement plus a few shared reaction/attack poses can deliver most of the character with much less content. Two-dimensional sprites are not inherently the best route for old phones.

## 5. Animation and signature effects

The first pass should make the pieces feel like enchanted objects. Preserve their sculpted poses and give them weight through anticipation, a short purposeful movement, impact and settle. Pawns should feel small and quick, the Guard heavy, the Knight springy, and the Queen controlled. Continuous full-body idle movement across 32 figures would make the board harder to read.

Existing meshes are static. True arm motion, a pulled bowstring, jaw articulation or cloth motion require separated geometry, a rig, morphs, or newly baked poses. Exporting an OBJ as GLB does not create these. Start with whole-piece transforms and selective prop animation; author more only where the action benefits.

A coherent effects vocabulary could use the game's existing symbols and material language:

- **Archer:** a brief bow accent, one fine luminous trajectory and a compact impact mark. The actual shot remains easy to follow.
- **Maester:** paired clockwork circles and a travelling thread joining the swap squares; reveal both destinations clearly.
- **Paladin:** a momentary gold cross/impact flash. Use the existing self-removal flag to trigger a distinct dissolution only when the piece actually sacrifices itself; ordinary pawn captures must not suggest it died.
- **Beast:** a short curved trail through the actual chain sequence, with a heavier final settle.
- **Guard:** weight and a restrained glancing rim; avoid a constantly pulsing invulnerability bubble.
- **King/check:** a crisp shape-coded warning under the king, a brief crown-light cue, and room for an optional cinematic finish after the game ends.
- **Capture:** fragments or flecks of the defeated army's painted material, with a little of its type accent. This ties effects to the pieces instead of using unrelated rainbow particles.

Small glows, ribbons, decals and pooled particles can work on the baseline renderer. Bloom, ambient occlusion, dynamic shadows and extra environmental motes should be optional quality additions. Put richer atmosphere around the board edge and keep occupied squares quiet. Sound can sell weight at little graphics cost, but is separate production work. Provide reduced-motion control for WebGL animations and shake, not only CSS transitions.

## 6. Engineering findings worth addressing

| Finding | Evidence | Recommended treatment |
|---|---|---|
| Scene rendered twice even in edge-free sprite modes | Installed RenderPixelatedPass always renders beauty and normals | Add a direct/non-pixel render path; do not pay for unused normals |
| Many draws for a small board | 32-piece diagnostic: 294 draw calls, 301,754 submitted triangles across the complete composer frame | Share/instance the two tile materials/geometries, coordinate glyphs where worthwhile, and batch repeated visuals after profiling |
| Sprite geometry alone does not solve draw overhead | Same 36-piece Dungeon setup: voxels 310 draws / 359,818 triangles; sprites 310 draws / 11,514 triangles | Optimize passes, shadows and batches, not just triangles |
| Idle debris still submitted | Mesh count stays at 400; its boxes account for 9,600 submitted triangles across the two scene draws even at zero scale | Hide when inactive; limit active instance count or compact active particles |
| Contact shadow leaves the ground during a hop | Runtime probe: ground disc world height rose from 0.02 to 0.37 | Keep shadow anchored to ground; vary scale/opacity with piece height |
| Projectile resources accumulate | Five arrow animations increased renderer geometry count from 87 to 92; removal has no disposal | Reuse geometry/material, or dispose unique resources when removed |
| Missing sprite becomes invisible | Texture rejection is swallowed with an empty catch; material stays hidden | Show a visible identified proxy/error state; never imply an occupied square is empty |
| Phone HUD covers playable content | Observed 390 × 844 screenshot | Reserve a compact status area outside the board and test the whole board footprint |
| CSS reduced motion does not affect JS tweens | CSS rule exists; renderer contains no reduced-motion check | Apply the preference in the motion/effects scheduler |
| Source regeneration depends on deleted session paths | Paint script hardcodes a missing Claude scratch directory | Point source tools to curated `art-src/pieces/colour-guides`; keep processing inputs explicit |

The renderer runs continuously, including during quiet thinking time. A demand-driven or capped idle loop could reduce battery use, provided it continues while OrbitControls damping, tweens, particles or animated effects are active. Preserve the existing hidden-tab tween completion safeguard.

These counts come from a local Chromium **SwiftShader software renderer**. They are workload/structure evidence, **not hardware FPS benchmarks or proof of mobile speed**. The 36-piece layout deliberately puts all 11 types on screen and is not a legal starting army; the separate 32-piece diagnostic uses a full board. [Live observations](graphics-audit-2026-09-21/live-observations.json), [targeted probes](graphics-audit-2026-09-21/runtime-probes.json).

## 7. Framework choice and production pipeline

Keep **Three.js + TypeScript + the existing DOM/game code**, with a repeatable offline asset process. Prepare the existing OBJs in a DCC tool such as Blender: inspect scale/axes and bases, preserve silhouette during simplification, define intentional paint regions, and export optimized GLB. A sensible initial experiment is 3–8k triangles for an ordinary piece and more for a silhouette that earns it; these are starting budgets, not guarantees that every piece can reach them without damage.

The source OBJs already have UV data, but usable paint textures are not bundled. Do not plan as though a conversion command will recover missing materials. For an initial palette study, a few shared materials or vertex paint can be enough. Keep the editable painted source as the master so that both GLB and directional sprite bakes can derive from it. This avoids maintaining two independently painted art sets.

Retain the current renderer interface to the game. The meaningful internal seam is between a piece's visual representation and its placement/motion. Existing mesh and sprite branches already demonstrate this variation. Give each representation a foot pivot, bounds, pick shape and resource ownership; let the board handle squares, highlights and camera. No ECS, engine abstraction layer, React migration or new tween dependency is needed for this audit's recommendations.

Three.js WebGLRenderer requires WebGL2; switching its scene to sprites does not lower that requirement. Keep this as the initial compatibility floor. A device limited to WebGL1/Canvas needs a different rendering path, such as a compact 2D board, if supporting that device becomes a product requirement. WebGPU is a later optional capability, not the compatibility baseline. Three.js's WebGPU renderer and node-based postprocessing are not a drop-in replacement for the current EffectComposer pipeline. [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), [WebGPU migration](https://threejs.org/manual/pages/webgpurenderer).

The separate [framework comparison](graphics-frameworks-2026-09-21.md) checks Babylon.js, PlayCanvas, PixiJS and Godot against primary documentation. None removes the need to repair the asset and colour pipeline. Babylon or PlayCanvas becomes compelling if editor/tooling needs justify a migration; PixiJS if the product commits to predominantly 2D presentation; Godot if native/editor production becomes the priority. Those are product/workflow changes, not prerequisites for a distinctive chess game.

## 8. Visual comparison and production acceptance

**Follow-up:** the bounded comparison now exists, including two actual low-resolution rebuilds. See [prototype results and remaining decisions](graphics-prototype-2026-09-21.md). The broader acceptance checks below remain production targets; the prototype does not claim to complete them all.

1. **Prove the art treatment on six revealing pieces:** Pawn, Knight, Archer, Bishop, Guard and King, on both armies and both tile colours. They expose plain identity, protruding props, fine silhouettes, broad armour and tall details. Use identical camera, size, lighting, palette and board where feasible. Compare improved current voxels, optimized sculpt 3D and 12/16-view sprites. Show any unavoidable sprite-lighting differences explicitly. Judge at phone size first and then zoomed in.
2. **Prove motion and camera behaviour:** one move, shot, capture, swap and chain; orbit through view boundaries, flip sides, zoom, undo/reset mid-animation and background/restore the tab. For sprites, test sector flicker, foot sliding, elevation mismatch and alpha picking.
3. **Choose one presentation and extend it to the full set.** Keep the old style available during comparison; after selection, retire obsolete experiments and broken asset-generation paths instead of maintaining every historic preset forever.
4. **Profile on actual target hardware and choose quality levels.** Start with the same visual assets at reduced effects/resolution on older WebGL2 phones. Only add sprite LOD if measured results justify its additional pipeline and it can switch without changing the art identity.

Acceptance criteria for that comparison:

- Army is identifiable at a glance; types can be identified without relying on labels or hue alone after a short legend. Record actual confusion pairs instead of assuming the palette worked.
- Readable at 390 × 844 and a larger desktop viewport, from both sides, at the permitted camera limits. No occupied square hidden by the HUD. Compare grayscale and colour-vision simulations.
- Colour allocation preserves one dominant army family and at most two secondary families per non-pawn type. Accents remain visible from useful rear/oblique views.
- Silhouettes preserve the owner's existing designs; no new anatomy or unrelated costume redesign.
- Piece roots, shadows, effect origins and picking stay aligned; capture/self-removal remains consistent with the game state.
- Proposed performance targets: stable 60 fps during movement on representative modern devices, stable 30 fps on an agreed older phone; report frame-time percentiles and worst effect bursts. These are goals, not measured achievements.
- Track download size, decoded/GPU texture memory, load/compile stalls, frame time, draw calls and battery/thermal behaviour. Begin with roughly 3–6 MB compressed visual payload and 32–64 MiB resident visual textures as provisional budgets, then revise from the sample and the chosen device floor.
- No increasing resource counts after repeated captures/style changes once caches warm; missing assets and context loss produce a recoverable, intelligible state.

**The distinctive result should come from the existing eccentric sculptures, a strict colour hierarchy and effects that express each piece's actual action.** A restrained, responsive board with a few memorable moments will serve these designs better than making every surface compete for attention.

## Verification record

Inspected all six `src/render` files, relevant game/style integration, voxel/sprite tooling, installed pixel pass, original source inventory and earlier style decisions. Viewed original character artwork, the painted sprite contact sheet and five current desktop style captures plus a mobile capture. Parsed all 20 OBJ files and all 11 voxel JSON models. Captured complete composer-frame workload counters and targeted shadow/projectile resource probes. No page/console errors were recorded in the five-style/mobile capture run. No full game regression or hardware performance claim is made: this task changed documentation/evidence only.
