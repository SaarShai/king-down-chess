# Bishop hem clearance and standalone capture studies

Study branch only; no chess rules or gameplay capture wiring changed.

## Bishop

The previous boot repair exposed two separate problems: the source hem intersects the shoes even at rest, and independently swaying cloth fails to follow a stepping foot. Lift the lower robe by up to 0.070 board units, smoothly tapering to zero between heights 0.15 and 0.55. Move each cloth panel with 65% of its foot's fore/aft travel and its lift. The original boot, leg and upper-body motion remains.

- `verify_bishop_clearance.py`: exact segment/triangle intersection tests after BVH candidate filtering. Checks the 677 actual boot triangles against nearby cloth, at 97 full-cycle poses plus 196 partial-weight poses and the initial rest pose. **0 intersections in all 294 samples.** Before (`49a41e3`): maximum 165 intersecting pairs; 290/294 samples affected, including 59 pairs in the source rest pose. The baseline fails the same assertion.
- `verify_cleric_walk.mjs`: **42/42** assertions on native browser geometry, current/handmade, smooth/12 fps, Bishop and Paladin. Bishop 99th-percentile edge ratio 1.149; minimum 0.430 in smooth playback. Boots still travel about 0.149 units and lift 0.040, remain rigid, and reset exactly. Front/side captures at four phases are in `clerics/`.
- `hem-preservation.json`: exactly 1,517 lower-cloth vertices changed; maximum lift 0.070. Authored face topology, paint assignments, vertex colours and clay relief are unchanged. The lift matches the stated taper within 3e-8. glTF vertex packing/normals can change after altering geometry; do not claim byte-identical Bishop buffers.
- `other-models-preserved.json`: the other **15 complete GLBs are byte-identical** to `49a41e3`.

The more restrained cloth movement and broad hem taper avoid both shoe collisions and the waist compression introduced by lifting the entire cloth-weighted region.

## Capture options

Choose **Character close-up → Capture finish → Preview capture**. Both armies perform the effect; **Restore pieces** returns the original figures. Walk, Move, Poke, character/scene/look changes also restore and clean up the preview. The chosen finish persists in the URL.

| Finish | Sequence | Design use |
| --- | --- | --- |
| Clay burst | Brief hold, fast outward rupture, tumbling chunks, shrink away | Energetic, emphatic capture |
| Melt into a puddle | Lower-body slump, spreading coloured clay, rounded puddle, receding finish | Strongest clay identity |
| Implode to a bead | Inward twist/compression, tiny bead, sink away | Compact, magical capture |
| Fly off the board | Small wind-up, ballistic arc and tumbling whole figure | Comedic, theatrical capture |
| Crack and crumble | Seams open, chunks fall locally, shrink away | Dry, tactile clay break |

`CapturePreview.ts` bakes the actual skinned/morphed surface without modifying shared assets, preserving the army/type materials and handmade shader. Burst/crumble clip triangles at shared planes into at most 12 fragments, with flat clay caps on exposed sections. Caps simplify cross-sections to convex shapes; this is a visual fracture study, not a general solid modeller. Melt uses a smooth, finite deformation and a rounded opaque puddle to avoid a pile of overlapping flattened surfaces. All motion is deterministic, with optional 12 fps sampling and explicit resource disposal. No new dependency or physics engine.

`verify_capture.mjs`: **30 grouped checks pass**, covering all five options, both armies, all 16 source snapshots and burst/melt geometry, finite motion, colour/shader preservation, deterministic sampling, completion, replay/restore, disposal, mode switches, stop-motion, mobile controls and URL state. Native-render versus piece-ID silhouettes have **0 mismatched pixels** for burst, melt, implode and crack. Key frames and a mobile view are saved alongside the reports.

Existing checks: **42/42 renderer**, **37/37 cast**, **8/8 applied-clay/outline**. TypeScript and production build pass (existing bundle-size advisory). No browser/shader errors. Broad renderer/cast checks preceded the last Bishop-only hem-taper refinement; the final Bishop was rechecked with the full collision and cleric-walk suites.

Artistic preference still needs the owner's review. These are standalone effects on the study route, not production animation assets or a measured mobile-performance budget.

## Reproduce

With the study running at port 5190:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python-exit-code 1 --python tools/graphics-prototype/verify_bishop_clearance.py
CLERIC_CHECK_OUT=docs/graphics-prototype/capture-verification/clerics node tools/graphics-prototype/verify_cleric_walk.mjs
node tools/graphics-prototype/verify_capture.mjs
npm run build
```

For the negative control, export `49a41e3:docs/graphics-prototype/complete-cast.blend` to a temporary file and set `BISHOP_CLEARANCE_BLEND` to it, with `BISHOP_CLEARANCE_OUT` pointing at a separate report. The same collision assertion must fail.
