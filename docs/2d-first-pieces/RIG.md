# Continuously animated Archer — rejected study

**Owner rejected the anatomy revision as much worse (2026-09-25).** The verification below is historical mechanical evidence, not visual acceptance. Stop refining this implementation; see the [researched replacement workflow](../research/archer-animation-workflow.md).

Run the existing study server and open `http://127.0.0.1:5192/rig.html`.

The owner requested a continuous character rig after finding independently generated frames insufficient. This is an implemented Archer experiment, with the prior sequence retained at `index.html` for comparison. It does not replace the main game renderer.

## Method and assets

Native SVG draws painted body, head, braid, bow and arrow from `archer-parts.png`, with source rectangles in `rig-parts.json`. Arms and separate hands use `archer-arms.png` and `arm-parts.json`. A two-segment solver positions the bow arm; an authored elbow path handles the drawing arm’s foreshortening. Both wrists stay anchored to their hand contact points at the grip and string. `requestAnimationFrame` samples continuous timed pose curves; pointer aim is eased using elapsed time. Both army colours share the same motion. Release hides the nocked arrow and moves a separate projectile. The whole figure remains visible, with feet anchored.

The new parts were generated using the approved Archer as reference with the built-in image generator. Exact prompt: `rig-prompt.json`. This is a painted cutout rig; it does not yet deform cloth or bow limbs with a weighted mesh, turn through arbitrary angles, or run a full walk cycle. The unused cloth attachment is retained in the source atlas but not drawn; the character's robe stays anchored with the body. Head and braid have limited rotation. It is a scoped browser demonstration, not a bespoke general animation engine.

Native SVG and the browser frame clock suffice for this single-character experiment without a dependency or editor requirement. A future production decision can evaluate the resulting art and motion against Spine/PixiJS; no runtime or licence was installed. Sources used for implementation: [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame), [SVG transforms](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/transform).

## Controls

- Pointer motion or a direct tap/click on the stage adjusts aim within anatomical limits.
- Draw & shoot runs raise, draw, hold, release, flight and recovery.
- The slider inspects any continuous point in the shot; Slow motion stretches playback to 5.4 seconds.
- Show joints exposes shoulder, elbow and hand locations.
- Ivory / Charcoal switch costumes without changing the rig.
- The small board view reuses the same animated character.
- Reset and army changes cancel the shot. Hidden tabs stop frame scheduling. System reduced-motion preference suppresses idle sway and timed shot playback.

## Verification — 2026-09-25

`node --check rig.js` passes; `node --test rig-motion.test.mjs` passes all three tests (log: `rig-tests.log`). Tests cover bounded pose samples, phase endpoints, monotonically advancing flight and two-segment length invariants, including finite singular targets.

Browser verification: inspected ivory rest and charcoal full draw, refined bow grip alignment, checked direct stage targeting (observed aim 0.236 radians), aim-high control (-0.203 while converging), joint overlay and scrubbing. A real shot produced 24 distinct sampled bow transforms and all seven phases in a roughly two-second observation, ending at rest with the shoot button enabled. Reset during slow playback immediately returned to progress 0. At a 390px viewport the document measured 390px and stage 360px, without horizontal overflow. Viewport restored after checking. Reduced-motion branch is implemented but was not separately exercised with a changed operating-system preference. No physical phone claim.

Known scope: small manual part alignment and rigid painted segments are suitable for evaluating the method. Further art refinement or mesh deformation may be needed before this is the final production character.

## Anatomy correction — 2026-09-25

Owner feedback: neck too long and arms looked wrong. Lowered the head 24 SVG units to overlap the duplicate neck tabs, moved the braid attachment, and corrected the head rotation pivot. Generated slimmer arm components with separate hands; exact request is in `arm-correction-prompt.json`. The complete generated atlas is preserved in `archer-arms.png`; source windows and rounded SVG clipping trim the assembly tabs without changing the raster. The unused old arm symbols were removed.

Upper-arm/forearm widths are now 32/25 units instead of roughly 40/35. Independent wrist pivots preserve hand shape. The bow follows a reachable aiming arc with a more extended arm at full draw. The drawing elbow starts below the shoulder, turns behind it during draw, and follows a curved transition so the projected upper arm does not collapse midway. This is authored screen-space foreshortening, not a biomechanical simulation or a weighted mesh.

Verification: four tests pass, including 3,003 shot/aim samples checking bow-arm lengths, both hand attachments and minimum projected arm lengths. Updated log: `rig-tests.log`. Browser inspection covered Ivory and Charcoal, rest/full draw and high/low aim, with the shortened neck and complete silhouette visible. Normal shot playback completed and re-enabled the shoot control; reset cancellation was checked. The study remains an art prototype: rigid part joins are still visible at close zoom and require owner assessment.
