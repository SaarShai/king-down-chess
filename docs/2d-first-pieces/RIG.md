# Continuously animated Archer

Run the existing study server and open `http://127.0.0.1:5192/rig.html`.

The owner requested a continuous character rig after finding independently generated frames insufficient. This is an implemented Archer experiment, with the prior sequence retained at `index.html` for comparison. It does not replace the main game renderer.

## Method and assets

Native SVG draws independently painted body, head, braid, upper arms, forearms, bow and arrow from `archer-parts.png`. `rig-parts.json` records the source rectangles. A two-segment arm solver keeps the hands attached to the bow grip and string. `requestAnimationFrame` samples continuous timed pose curves; pointer aim is eased using elapsed time. Both army colours share the same motion. Release hides the nocked arrow and moves a separate projectile. The whole figure remains visible, with feet anchored.

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
