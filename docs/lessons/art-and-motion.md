# Lessons: Art and motion

The lessons on artwork, sculpts, painted pieces, animation and the trailer. [LESSONS.md](../../LESSONS.md) holds the Always rules and the index of all topic files.

## 2026-10-04 — check a vector from a PDF against the PDF's own render
- The rook icon lost its two white bands in the SVG: the rulebook path holds them as two rectangles that open only under the even-odd rule (as MuPDF draws the page), while PyMuPDF reported nonzero; side-by-side thumbnails at 120 px looked right. → Check a vector taken from a PDF against the PDF's own render, pixel by pixel, with the overlapping images removed (`tools/extract-piece-icons.py` does it and stops at 0.5%), not by eye. (2026-10-04)

## 2026-10-04 — measure an effect anchor through the figure's transform
- An effect meant to follow a drawn figure's lean was "checked against the drawn crown" by eye and given the wrong sign; the next fix moved it the wrong way by 24 units, and a later fix keyed per-square state to `animation.done`, so the move's last frame (drawn before the next position arrives) flashed the effect back in. → Compute the anchor through the same transform the figure uses (`getTransform().transformPoint`) and measure it, and test a fix on the exact frames and case the report names (the frame before and after a switch, both armies, the edge files) before calling it done. (2026-10-04)

## 2026-10-04 — record the painted scene with a fake frame clock
- Recording the painted scene with a fake `requestAnimationFrame` clock gave the same frame over and over: the scene asks for its idle frames from a real 33 ms timer, which never fires inside one synchronous `page.evaluate` loop, and the lava mask (loaded on first draw) never arrived either. → Each recorded step asks for its frame (`scene.redraw()`, then step the clock), and the recording waits once on the real clock for an effect's own art before the first frame. (2026-10-04)

## 2026-10-02 — a recolour re-encoded the untouched half of a sheet
- Recolouring one army's half of a painted sheet and saving its lossy WebP re-encoded the untouched half too (mean change 0.6–0.7 of 255), and re-running the figure-cut script then rewrote the other army's title and Guide crops; the strike-sheet tool likewise rewrites all eleven sheets. → Check "untouched" on the PNG master (pixel-identical), restore derived files of the side that did not change, and keep only the regenerated files the change is about. (2026-10-02)

## 2026-09-27 — the trailer sound copied the picture's timing
- The trailer's cue sheet and score copied the intros' timing (ramps, reveal starts). The copies drifted during the motion pass, so the name-reveal sounds played 50–160 ms after their hits, and the "within one frame" check passed because it measured the copies against themselves. → Shot modules export their timing and the sound imports it; never copy a timing value into a second file. A sync check compares against the picture's own values. (2026-09-27)

## 2026-09-27 — motion blur opens the shutter on the frame time
- The trailer's motion blur sampled a shutter centred on each frame time. Every hard cut then blended the last shot into the first frame of the next, and every hit peaked one frame late; shots began to shift their own events half a frame to compensate. → Open the shutter on the frame time (sub-frames at `t + s/N · shutter`), as a film camera does. Fix timing faults in the renderer, not in each shot. (2026-09-27)

## 2026-09-27 — trailer mastering: one linear gain, then a limiter
- Trailer mastering: two-pass `loudnorm` silently fell back to dynamic mode (it lifts quiet passages) because the mix's peak-to-loudness ratio was above what −14 LUFS at −1 dBTP allows; and raising the title hit's level did not make it the loudest, since every big hit reached the limiter. → Master as one linear gain, then a true-peak limiter, and fail when the target is missed. At a peak ceiling, rank hits by density (crest factor), not by level. (2026-09-27)

## 2026-09-27 — parallel renders shared one Python server
- Parallel headless renders shared one `python3 -m http.server` (listen backlog 5) and intermittently failed with "Failed to fetch dynamically imported module". → A render tool serves its own files on a free port (`node:http`, port 0). Build its root with `fileURLToPath(new URL(...))`: `URL.pathname` keeps `%20` for the spaces in this repo's path. (2026-09-27)

## 2026-09-26 — a colour-only revision changed the framing
- A colour-only generated revision can also change framing and clip equipment. → Recheck alpha gutters, complete weapon edges and source registration after every revision, even when the prompt locks geometry. The Paladin required a separate framing correction after recolouring. (2026-09-26)

## 2026-09-21 — graphics animation export
- Graphics animation export (2026-09-21): Blender's broad action export included the other character's compatible action and kept a nonzero start time. → Export only the selected rig's active action, shift its time to zero, and verify one clip per asset, duration, first/last pose and actual skinned foot contact. A convincing static preview does not establish correct animation playback or contour deformation.

## 2026-09-21 — graphics feature correction
- Graphics feature correction (2026-09-21): identifying colours belong to specific modeled parts (Guard shoulder plates, Archer hood), and broad smoothing can distort those parts. → Fit masks to each feature's actual orientation and outline, inspect neutral source geometry from multiple angles, preserve crease edges/corner normals, and use less smoothing on structural forms. The Archer's diagonal head needs a local-frame hood mask; passing render tests alone does not validate art placement.

## 2026-09-21 — graphics cleanup correction
- Graphics cleanup correction (2026-09-21): tidier detail means simplifying/smoothing selected sculpt features as well as cleaning colour boundaries. → Keep the approved pixel resolution fixed; reduce small surface clutter while protecting the forms that identify the character, and judge both actual play size and a close view.

## 2026-09-21 — graphics detail correction
- Graphics detail correction (2026-09-21): the owner's request for more pixels meant richer figures closer to the source art, not resolution alone. → Treat model/paint detail and rendering resolution as separate changes; increasing samples does not fulfill a request to recover character detail.

## 2026-09-21 — graphics feedback: an authored low-resolution model
- Graphics feedback (2026-09-21): preserving a detailed sculpt by merely changing its renderer can preserve the very detail density that makes it unreadable. → Compare an intentionally authored low-resolution model against the original, using the same recognizable design and judging at actual game size; do not assume higher fidelity is the preferred style.

## 2026-09-16 — voxelized sculpts at 36 voxels
- Voxelized sculpts at 14–20 voxels read as blobs; at 36 voxels with normals taken from the occupancy gradient (not face normals) they shade like the original sculpt and stay legible at pixel size 2. → `tools/voxelize.py --height 36` is the baseline; keep `VOXEL`/`TARGET_HEIGHT` in `src/render/voxels.ts` in step with the pixel size.

## Reconstructed Ogre integration (2026-09-22)
- Blender can bake parent normalization into exported skinned vertex positions. Export the rig in source coordinates, then add the board transform to its parent node; validate against the accepted GLB. Texture-space feature selection and clay relief depend on those bind coordinates.
- A spatial arm mask must exclude spread toes and skirt corners. Preserve short reconstructed knee/hand forms with a restrained motion suited to the mesh; measure actual skinned edges and rigid-hand distances, not bone paths alone.
- A study that replaces renderer-owned figures must disable the renderer's asynchronous model load. Otherwise a late resolved asset draws a second model and looks like broken surface shading. Rebuild/undo must also invalidate pending movement callbacks.

## Clay facing and fixed presentation — 2026-09-22
- The accepted clay sculpts face local +Z. White advances toward world −Z, so its resting parent rotates by π; Black's stays at zero. Do not reuse the legacy voxel orientation. Movement/contact turns are relative to that parent and must reset after movement and undo. Check both armies visually as well as their transforms.
- The owner selected handmade clay at the study's 0.5 px double-detail setting for the playable game, with no rendering choices. Remove obsolete UI and URL/save overrides instead of merely changing the default; keep experimental presentation controls in the separate graphics study. Verify actual render-target dimensions and material state, not just a preset label.

## 2D artwork direction — 2026-09-25
- Swarms use the same slightly elevated three-quarter camera and facing direction as the standing pieces. Arrange members as one compact group with depth over a shared board footprint; avoid overhead specimen views, flat grids or vertically stacked individual views.
- Draft approval rounds end after generation, one brief visual review, saving the original images and prompts, recording any new owner rule, and showing the result in chat. Skip technical transparency, dimensions, clipping and file-hash checks for drafts. Create HTML review pages, thumbnails or face close-ups only when the owner asks for them. Browser loading/layout checks and screenshots belong to requested web deliverables, not an image-only approval round. Once the draft is shown and saved, stop; production preparation waits for an approved production task.
- Use face covers only when they suit the character's theme; do not force them. Explore distinctive head and face equipment, as with the original Maester's unusual goggles. Exposed faces use the original Archer and Paladin's dominant geometric brow, nose and cheek shapes and natural eye-socket shadows, with little surface detail. Simplify the whole figure to a few large masses, quiet surfaces and distinctive equipment; avoid many folds, straps, buckles and small ornaments. The Workshop Iron Warden is the closest current style reference.
- Owner wants army colour dominant across each figure's clothing and armour, with limited recognition-colour accents. A human character's skin colour stays the same in every army version; never tint or darken skin to match the army. Coloured bases alone do not satisfy army identity. Keep full feet, hems and equipment; no portrait-style bottom cutoff. Original King Down art is reference input for derived poses, variations and new pieces.
- Display sprite-sheet frames with preserved aspect ratio when both width and height are constrained. Check actual phone layout; a fixed-height portrait with a clamped width can silently squeeze the figure.

## Continuous 2D character motion — 2026-09-25
- Additional independently generated poses do not solve proportion and registration drift. For smooth character motion, use one consistent set of painted parts and interpolate joint transforms; keep frame drawings for changes the rig cannot represent. Ground contacts and hand-to-prop attachments must remain fixed through the action.

## Archer anatomy correction — 2026-09-25
- Connected joints are not enough for a convincing painted rig. Check rest, full draw and intermediate poses for anatomy; overlapping neck tabs can double the visible neck, and a mathematically connected arm can still bend in the wrong plane. Separate hands from forearms so wrist rotation and projected arm length do not stretch the fingers.
- For an authored elbow path, verify that its projected segments cannot collapse while crossing the shoulder. Aim should rotate the arm targets together, preserving prop attachments and reach.

## Rejected Archer rig — 2026-09-25
- Owner found the anatomy correction much worse. Do not treat finite joint coordinates, attached hands or passing motion tests as visual success. Compare intermediate silhouettes with coherent source drawings; stop patching a failed art/rig approach.
- Stretching separately generated arm bitmaps to fit hand-authored elbow paths is not a substitute for correct perspective, layered artwork, mesh weights and alternate pose drawings. A professional runtime does not make poor source art anatomically correct.
- Attachment constraints have phases: the drawing hand follows the string during draw, then releases it and follows through independently. The prior test asserting attachment throughout release encoded an animation error.

## 2026-09-26 — coherent geometry is not finished character art
- The original static Archer sculpt has body, costume and weapons fused into one surface. Spatial arm masks tore neighbouring geometry during a large pose change. → Do not promote static/scanned sculpts to an animation rig by region heuristics; start with suitable topology and authored weights or retopologize deliberately.
- A height-based crop of an unposed human removed fingertips that happened to sit below the cutoff. → Preserve complete limbs using semantic mesh/weight membership, and inspect the rendered hands close up. Valid bones alone cannot catch missing surfaces.
- A body rendered successfully from Blender still looked stiff and unlike the preferred painted artwork. → Treat source validity, anatomical/pose quality, style match and owner acceptance as separate gates. Do not launch frame production just because a still renders.

## 2026-09-26 — preserve the Archer's original weapon and 2D direction
- The owner rejected the 3D test and replaced the introduced longbow with the original wrist bow. → Preserve meaningful source equipment before designing movement: the wrist bow removes the unnecessary string-drawing pose and its difficult arm assembly. Current direction is illustrated 2D, with natural shoulder/elbow/wrist proportions.
- A coherent complete pose plus restrained projectile/recoil effects can serve this shot study without rebuilding limbs. → Keep the illustration's aspect ratio and anatomy fixed; describe this accurately as one pose with effects, not a full articulated animation or multiple drawn frames.

## 2026-09-26 — preserve the animation goal when simplifying the weapon
- Replacing the longbow with a wrist bow did not remove the requested cursor-following arm movement. Whole-sprite recoil and a projectile were insufficient. → Recheck the original interaction requirement after changing the visual method; report which part actually moves.
- A small shoulder mesh can preserve a coherent painted figure while the forearm, hand and attached weapon rotate together. Keep the aim arc within the drawing's usable projection, check the shoulder at both limits, and test mesh orientation across the full arc including recoil. Do not infer visual acceptance from geometric invariants.

## 2026-09-26 — rigid weapons and source-sheet registration
- Deforming a complete already-aimed figure by image height can bend a long weapon when its lowered tip enters the stance region. → Apply weight shift to the body, then draw the aimed arm/weapon with one rigid thrust translation. Check actual low-angle contact as well as neutral motion.
- Generated army pairs can drift from equal cell boundaries. → Inspect the alpha gutter and calibrate each army's source window, pivot and display origin; preserve complete shield edges and tips without destructive recropping.

## 2026-09-26 — aiming drawings on a real board
- A convincing sideways aiming study does not supply every facing a top-down board needs. → Keep the authored angle limits explicit. Test actual opponents and contact coordinates; use additional facing art before claiming fully directional motion. The board trial's steep-shot encounter panel is an experiment, not owner approval of that presentation.
- Equipment can extend beyond a figure's occupied square. → Keep input tied to square occupancy, with visual selection/target markers, rather than letting overlapping sprite bounds capture a neighbouring piece's clicks.

## 2026-09-26 — adding the painted Ogre
- A destination square does not uniquely identify an Ogre action: the same enemy can be captured or pushed. → Preserve both engine moves in the presentation, show an explicit choice, and verify different piece counts and final squares. Do not collapse actions into a map that keeps only one move per target.
- A coherent braced pose can carry a restrained shove with one rigid upper-body weight shift and planted feet. → Describe it as that; it does not provide independent arm articulation or a walking cycle. Preserve the hands rather than stretching them to exaggerate the action.

## 2026-09-26 — painted Knight identity and airborne presentation
- Inspect the original character before interpreting a chess name: King Down's Knight is a foot soldier with a horse-head helmet, spear and cape, not a horse or mounted rider.
- Recognition colour must not take over a large costume surface. The first Knight generation's burgundy cape violated the army-colour direction; recolour its main area to the army and retain only a narrow accent.
- Separate an airborne figure's lift from its board position so its shadow stays on the ground: in `scene.mjs` every pose that raises a figure, a capture's victim too, sets `pose.ground` to the floor point (2026-10-05: the Queen-spin and Rook-pound victims did not, and their contact shadows floated up with them). Check the entire weapon at board edges, and maintain relative character scale in motion previews. Whole-figure travel is not an articulated leg cycle.

## 2026-09-26 — Knight anticipation
- Owner asked for knees to bend before jumping. A whole-sprite tilt was not enough. → Add an actual planted crouch in the shared character renderer, used by both the study and board; make the preparatory phase visible before travel begins and flex again at landing.
- Keep a long grounded spear and its grip out of the leg deformation. Use bounded leg guides and inspect both army registrations; mathematical bone lengths and positive triangles supplement, not replace, visual review.

## 2026-09-26 — reviewing parallel painted pieces
- Equal-cell generation instructions do not prove the figures fit equal cells. The Rook’s fist crossed x=768; resizing the entire sheet did not repair that boundary. → Preserve the generated PNG and register actual complete source windows (the accepted Rook gutter is x=780).
- A planted-motion test must assert actual opaque boot/contact points, not just a bounded curve or a translated anchor. The Guard’s soles ended above the original deformation cutoff; parent review moved the cutoff above the boots. A rigid Rook rock keeps one stone contact fixed and honestly lifts the rear foot.
- Canvas aspect ratio and overlays are part of artwork quality. Preserve source proportions and draw board selection borders behind tall figures so they cannot appear to sever a neck or helmet.

## Full-cast sculpt and animation work (2026-09-21)
- Label coordinate units at the profile boundary. Joint landmarks are world units after scaling to the target figure height; paint volumes use a height fraction only on their vertical axis. A unit-height sketch is not a world-space rig.
- Triangulate non-planar source faces before cutting paint boundaries. Keep the surface-area assertion; do not loosen it to hide incorrect tessellation. Check silhouette bounds after reduction: the Paladin lost extremities under collapse reduction and needs its usable source density preserved.
- No-UV sculpt exports need deliberate texture coordinates before assigning bump/roughness maps. Keep material experiments scoped to the intended comparison.
- Test a brief animation impulse by advancing known timesteps on the actual model; wall-clock screenshot delays can miss the entire transient under software-renderer load. Verify compression, rebound across rest and exact reset, and keep floor-contact appendages out of generic angular spring motion.
