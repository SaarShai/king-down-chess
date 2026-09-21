# Clay look study

The study now has a `Look` control with three URL-backed values:

- `current` keeps the existing refined material and lighting for comparison.
- `plasticine` uses a warm broad studio rig, a satin wax response, very fine procedural bump, and high contact-shadow opacity.
- `handmade` uses a warmer brown studio rig, a chalkier rough response, stronger low-frequency bump, a stable low-amplitude finger/tool sweep, and softer contact shadows.

The two clay looks are live Three.js materials. They keep the existing colour roles, so the Guard's steel-blue shoulder plates, the Archer's green hood, and the ivory/ink-blue army bodies remain intact. `src/render/prototype/ClayLook.ts` owns the look IDs, labels, procedural surface maps, physical material settings, and lighting presets. `study.ts` uses that module for every loaded study model, so the same look API can cover a larger roster without changing model files.

The URL state is explicit, for example:

```text
?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined&look=plasticine
```

The captures below are the same Guard + Archer scene at the same camera and sample settings:

- [Polished plasticine](captures/clay-plasticine-pair.png)
- [Handmade clay](captures/clay-handmade-pair.png)
- [Handmade clay, stop-motion poke](captures/clay-handmade-poke.png)

The captures were made from the isolated Vite server on port 5191. Browser checks confirmed that each look loads from its URL, the control label follows the selected look, the walk control stays enabled for both articulated figures, and the walk state toggles while the figures animate in place. A fresh stop-motion URL also enabled the poke control. The capture harness reported no page errors or console errors.

The clay materials add two 96×96 procedural maps per look and reuse each pair across all roles. This keeps the runtime cost bounded while making the surface response visibly different from a flat recolour. The existing contour pass remains available and continues to use the same skinned meshes.

The direction takes inspiration from the tactile miniature sets and theatrical lighting documented by the Neverhood production team: [Welcome to Neverhood](https://www.awn.com/animationworld/welcome-neverhood) and [Our Animation Process](https://www.awn.com/animationworld/our-animation-process). The study uses those references as an art direction cue for tool marks, imperfect surfaces, expressive poses and warm diorama light; it does not copy Neverhood assets.

Clay motion has two explicit cadence choices. `Smooth · spring clay` keeps the authored walk continuously fluid and adds a visible overshooting spring driven by animated rotation to the body, arms and cloth/skirt bones. `Stop-motion · 12 fps` advances the same secondary layer in 12 fps steps. A `Poke / squish clay` control adds a stronger short damped impulse while idle or walking, with squash and rebound. These are lightweight, deterministic spring effects with volume-preserving scale on the model root; they are not softbody collision simulation. Thigh, shin and foot bones stay on the authored walk keys, and reset returns the imported pose exactly.

Roster profiles can pass `groundedBones` to exclude a named arm, cloth, tail, or ornament that reaches the board, and `squash: false` when the model's base ornament is already ground-constrained. The spring layer never allocates transient vectors during playback, clamps its integration step for low-FPS resumes, and keeps held weapons joined as children of their authored arm bone.

The motion probe on the current Guard/Archer pair reached about 0.024 radians of arm spring offset and 2.6% squash during a smooth walk; an idle poke reached about 0.042 radians on cloth. After settling, spring offsets were zero and model scale returned to `[1, 1, 1]`.

The profile hook was also checked with dotted bone names: `groundedBones: ['arm.L', /cloth\.L/i]` excluded both bones while leaving the other arm spring active.
