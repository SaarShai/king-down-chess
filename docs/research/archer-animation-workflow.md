# Archer animation: reliable production route

Researched 2026-09-25. Owner rejected revision `1acbaeb` as much worse. This records a recommended method, not a completed replacement animation. Work was performed directly; no delegation, purchases, installs or external uploads.

## Follow-up: a different representation, not another cutout tool

The owner again identified the arms/hands as unacceptable and requested a different method. The earlier Spine recommendation below is retained as research, not an adopted implementation decision.

New proposed experiment: **3D-assisted 2D sprites**. Build or adapt one anatomically sound, properly skinned character with complete arms and poseable hands; author the bow grip, string draw and release in Blender. Render complete character frames from a fixed orthographic camera. The browser plays those frames, so separate painted limbs are never stretched or reassembled at runtime. Army palettes and camera views can be rendered from the same source character. [Orthographic cameras](https://docs.blender.org/manual/en/4.4/render/cameras.html), [rendering image sequences](https://docs.blender.org/manual/de/5.1/render/output/animation.html).

This is a recommendation, not a claimed guarantee: bad topology, skin weights or hand poses can still fail. Matching the original painted style is the main visual uncertainty; 3D-derived sprites can still look too much like rendered models. Use one full-draw render to test anatomy and painted appearance before producing a short shot sequence. Keep a stable camera, fixed output scale and foot position, transparent background and generous weapon bounds. Add directions only after that proof succeeds. This supplies consistent frames from one model, unlike the independently generated pose sheets already tried. The one-pose experiment was subsequently authorised and built on 2026-09-26: [rendered study and findings](../2d-first-pieces/rendered-study/README.md). It uses MakeHuman anatomy with an authored costume and bow. It is not adopted: the render still misses the painted style and needs visual refinement. No replacement animation or purchase has been made.

## Earlier recommendation

Stop developing the custom SVG cutout rig. Use **Spine Professional to author a coherent painted character with weighted meshes, pose-specific attachments and an authored shot**, then evaluate it in the official standalone WebGL runtime. Keep the original King Down artwork and the earlier full-figure study as visual references. The rejected generated arm atlas and hand-tuned elbow curves are not a production foundation.

This recommendation is an engineering/art judgment. Spine documents the needed capabilities, but no tool guarantees anatomical quality. The missing deliverable is carefully prepared artwork and a reviewed animation, not another interpolation library. Skilled drawing and rigging work remains necessary; image generation can supply reference variations, but each must be reconciled to the same character, scale and perspective before use.

## What failed here

Observed in the source and the previous browser review:

- Separately generated body, head and limb assets were fitted by eye, with inconsistent proportions, painted joint end caps and weak shoulder joins. Lowering the head did not repair the overall assembly.
- `rig.js` changes the widths of the drawing-arm images on every frame. That stretches the painted anatomy to fit an invented elbow path; it does not reconstruct perspective or preserve the drawing's volume.
- `armsAt` in `rig-motion.mjs` ties the drawing wrist to the string throughout release. As draw decreases, that hand follows the string forward. A convincing release needs the hand to let go and continue its own follow-through.
- The body and bow remain largely rigid while the arms do almost all the work. This misses shoulder/body participation and bow flex.
- The tests asserted finite positions, segment lengths and uninterrupted attachment. They could pass while the pose looked wrong; continuous string attachment even encoded the release mistake. Mechanical checks are not visual acceptance.

World Archery describes raising/drawing to the face, release, and sustained follow-through. Its coaching material also discusses drawing-hand follow-through backwards rather than a forward jump. Use these as movement references, while keeping our fantasy equipment and character style; do not blindly copy Olympic accessories or one athlete's exact anchor. [Shot phases](https://www.worldarchery.sport/sport/equipment/recurve), [release/follow-through reference](https://www.worldarchery.sport/news/149488/9-common-recurve-archery-mistakes-and-how-fix-them).

## Why this authoring workflow fits

Spine supports deformable meshes bound to bones and manual weight refinement. These allow controlled bends instead of transforming every part as a rigid rectangle. They still require good geometry and careful weights. [Weights documentation](https://eu.esotericsoftware.com/spine-weights).

Its asset-preparation guidance explicitly covers painting hidden regions, overlap joints, and separating front/back layers. We need a layered character that assembles correctly at rest before it moves. [Asset preparation](https://us.esotericsoftware.com/blog/How-to-cut-your-assets-for-animation).

Perspective changes can use additional drawings bound into the same rig. That is the appropriate mechanism for the drawing arm turning behind the shoulder, changes in hand shape, and torso turns. Do not ask one arm bitmap to represent all those views by stretching. [Alternate-pose workflow](https://eu.esotericsoftware.com/blog/Rigging-new-poses-tutorial).

Official browser demos cover meshes, skins, animation layering, interactive aiming and runtime constraints. Their existence establishes capability, not the quality or performance of our future Archer. The demos were reviewed through their documentation; a custom Archer has not been built or benchmarked in this runtime. [Live demos](https://esotericsoftware.com/spine-demos).

## Other options assessed

| Option | Finding | Decision for this Archer |
| --- | --- | --- |
| Rive | Supports raster meshes, bone weights and PSD import; it is not restricted to vector art. | Credible alternative, but still requires the same deliberate art/rig work. Spine's documented game-character and alternate-pose workflows fit this task directly. [Raster workflow](https://www.rive.app/blog/new-features-released-mesh-deformation-and-psd-support) |
| Live2D Cubism | Has a WebGL/TypeScript SDK for authored Cubism models. | Capable, but does not remove the authoring problem or justify another parallel experiment. [Web SDK](https://docs.live2d.com/en/cubism-sdk-manual/cubism-sdk-for-web/) |
| Drawn frame animation | Can preserve every pose exactly when frames are deliberately drawn and registered. Spine also supports attachment swaps and image-sequence export. | Valid route for fixed attacks, or for difficult parts inside a rig; independently generated sheets have not provided consistency here. [Features/export](https://us.esotericsoftware.com/spine-in-depth) |
| More DOM/SVG interpolation | Our current runtime already interpolates continuously. | Smoothness is no longer the missing capability. Do not add a timing library or more elbow formulas to repair the art. |

## Smallest useful production pass

1. **One army, one facing, one Archer.** Start from the accepted painted direction. Establish a consistent resting pose, full draw and release/follow-through as complete drawings at identical scale and ground line. Check neck, shoulders, hands and silhouette while static. Source art is a style reference, not an automatically rig-ready sheet.
2. **Prepare the layered master.** Separate torso/neck, head/hood, near/far arms, hands, braid, robe front/back, bow and arrow as required by the shot. Paint hidden overlap regions. Put the ivory/charcoal variations in matching layers; create the second skin after the first motion works.
3. **Author the shot in Spine.** Use controlled meshes and weights for bends; use alternate drawings where perspective genuinely changes. Keep rigid regions such as hands from stretching. Animate raise, draw, brief hold, release, follow-through and recovery. Bow/string and hand are coupled during draw, then separate at the release event. Add restrained cloth/hair motion last.
4. **Check the animation itself.** Inspect at normal speed, slow speed and intermediate poses, both large and at board size. Only then add a limited aiming adjustment to the authored motion. Large facing changes need additional views, not unlimited pointer rotation of one view.
5. **Export and play.** Preserve the layered art and editable `.spine` project. Export matching-version skeleton data, texture atlas and textures. Use a single shot-release event for the projectile. Reuse the skeleton/animation for the second army skin. Integrate into the game only after the Archer meets visual acceptance.

Proposed first-pass outputs, not files claimed to exist: layered Archer master; editable rig; one idle and one shot; runtime exports; contact sheet and short playback capture from that same rig. No new game rules or whole-renderer rewrite.

## Practical constraints checked

- Spine Professional is listed at **US$379** on the official purchase page on the research date. Essential lacks meshes and IK. Licence eligibility/terms are linked from that page; nothing was purchased. [Official pricing/features](https://esotericsoftware.com/spine-purchase).
- The trial cannot save projects or export new animations. It includes exported examples for runtime evaluation. Do not spend production effort in the trial expecting to recover an authored Archer afterwards. [Trial limitations](https://us.esotericsoftware.com/spine-download).
- No Spine, Rive desktop, Cubism or Moho app was found in the top-level `/Applications` and `~/Applications` inventory. Blender and Krita are installed. This is not a claim about accounts, licences or other installation locations.
- Registry metadata checked on the research date: `@esotericsoftware/spine-threejs` 4.3.13 declares `three >=0.162.0 <0.185.0`; this repo specifies `three ^0.186.0`. Do not assume compatibility or downgrade the working game to accommodate the experiment. [Package metadata](https://registry.npmjs.org/@esotericsoftware%2fspine-threejs/latest).
- `@esotericsoftware/spine-webgl` 4.3.13 depends on matching `spine-core` and declares no peer dependencies. Use this independent browser renderer for the first proof, with editor/export/runtime versions pinned together. This choice avoids the identified Three.js peer-version conflict; it is not yet an integration test. [Package metadata](https://registry.npmjs.org/@esotericsoftware%2fspine-webgl/latest), [official runtimes](https://us.esotericsoftware.com/spine-runtimes).

## Acceptance before calling the replacement successful

- Static rest, full draw and release all look like the same character, with believable proportions and complete feet/weapons.
- Shoulders/elbows remain continuous; no visible cut-end disks, disconnected layers, changing hand size or arm texture stretch used to hide a bad pose.
- The draw hand reaches a believable facial anchor, releases the string and follows through independently; the bow and arrow respond at that release.
- Intermediate frames remain convincing, including every attachment swap. A good pair of endpoints alone is insufficient.
- Both armies read correctly at board size. Playback/reset and interruption behave correctly; motion preference and performance checks follow in the runtime proof.
- Visual quality is explicitly reviewed by the owner. Automated mechanics tests remain supporting evidence only.

Research and method selection are complete. The layered master, professional rig and new animation are outstanding; this document does not label the rejected study repaired.
