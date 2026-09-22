# Clay look study

The study now has a `Look` control with three URL-backed values:

- `current` keeps the existing refined material and lighting for comparison.
- `plasticine` uses a warm broad studio rig, a satin wax response, very fine procedural bump, and high contact-shadow opacity.
- `handmade` uses broad pressed thumb impressions, fingerprint arcs, shallow dragging traces, softened shading across hard sculpt seams, and a dry matte response. A lower side light reveals these forms. Fine curved features receive less relief so faces, fingers and small ornaments stay legible.

The two clay looks are live Three.js materials. They keep the existing colour roles, so the Guard's steel-blue shoulder plates, the Archer's green hood, and the ivory/ink-blue army bodies remain intact. `src/render/prototype/ClayLook.ts` owns the look IDs, labels, procedural surface maps, physical material settings, and lighting presets. `study.ts` applies the looks to all sixteen refined designs. The other rendering comparisons retain their original materials and lighting.

The URL state is explicit, for example:

```text
?study&variant=rebuilt&scene=pair&pixels=0.5&contours=adaptive&detail=refined&look=plasticine
```

## Handmade surface correction — 2026-09-21

The owner correctly found the first handmade look almost indistinguishable from polished plasticine. Both used subtle noise and similar broad lighting; multiplying the handmade roughness by a darker map also made it smoother than intended. The updated handmade treatment replaces that surface path, while the polished option remains the comparison.

Fixed-camera Guard comparisons at 0.5 px:

- [Previous handmade treatment](captures/clay-surface-before-guard.png)
- [Polished plasticine](captures/clay-surface-polished-guard.png)
- [New pressed handmade surface](captures/clay-surface-handmade-guard.png)
- [New surface while walking](captures/clay-surface-handmade-walk.png)
- [Archer](captures/clay-surface-handmade-archer.png) · [complete cast](captures/clay-surface-handmade-cast.png) · [phone layout](captures/clay-surface-mobile-cast.png)

Handmade uses two shared 256×256 maps. The relief is projected across bind-space XYZ, including paint boundaries, so impressions follow the rig. Physical surface gradients keep their strength under zoom. The shader reduces relief on highly curved areas, keeps effective roughness near 0.99, and removes clearcoat and sheen. Cached normal buffers soften shading across coincident sculpt vertices; positions, skin weights, silhouettes, paint roles and authored movement are unchanged. Polished retains its two shared 96×96 maps. Handmade adds roughly 0.5 MiB of base texture storage (0.67 MiB with mipmaps), plus its cached normal buffers; triplanar relief also adds fragment sampling cost. This is not a device-performance benchmark.

`node tools/graphics-prototype/verify_clay_surface.mjs` checks material changes, actual relief contribution with identical lighting, source-buffer preservation, walking, all 32 figures, phone layout and switching back to polished. [Saved evidence](clay-surface-verification.json). The relief ablation also exposed ground-shadow decals erasing boot pixels from the ID pass; transparent non-depth-writing scenery now discards in that pass. Beauty and ID coverage agree at the feet, with no changed raw background pixels in the relief comparison. The TypeScript/Vite build and all 87 browser checks passed after this correction (42 rendering, 37 cast, 8 surface), with zero browser errors. These checks establish rendering behaviour, not the owner's visual acceptance.

The earlier pair and poke captures remain historical evidence of the initial motion implementation, not the current surface treatment.

The direction takes inspiration from the tactile miniature sets and theatrical lighting documented by the Neverhood production team: [Welcome to Neverhood](https://www.awn.com/animationworld/welcome-neverhood) and [Our Animation Process](https://www.awn.com/animationworld/our-animation-process). The study uses those references as an art direction cue for tool marks, imperfect surfaces, expressive poses and warm diorama light; it does not copy Neverhood assets.

Clay motion has two explicit cadence choices. `Smooth · spring clay` keeps the authored walk continuously fluid and adds a visible overshooting spring driven by animated rotation to the body, arms and cloth/skirt bones. `Stop-motion · 12 fps` advances the same secondary layer in 12 fps steps. A `Poke / squish clay` control adds a stronger short damped impulse while idle or walking, with squash and rebound. These are lightweight, deterministic spring effects with volume-preserving scale on the model root; they are not softbody collision simulation. Thigh, shin and foot bones stay on the authored walk keys, and reset returns the imported pose exactly.

Roster profiles can pass `groundedBones` to exclude a named arm, cloth, tail, or ornament that reaches the board, and `squash: false` when the model's base ornament is already ground-constrained. The spring layer never allocates transient vectors during playback, clamps its integration step for low-FPS resumes, and keeps held weapons joined as children of their authored arm bone.

The final deterministic poke probe on the actual Guard model compressed height to 94.23%, rebounded to 101.30%, then returned to exactly 100%. The same check passed at 120 and 15 updates per second. A separate probe verified that a poke also changes an actively walking figure. The idle impulse uses small integration steps and a restoring spring, so it crosses rest instead of only easing back. [Final integration evidence](cast-verification.json).

The profile hook was also checked with dotted bone names: `groundedBones: ['arm.L', /cloth\.L/i]` excluded both bones while leaving the other arm spring active.

The complete-cast integration protects floor-length `cloth` and `tail` bones, the Rook’s supporting fist, and the Pawn/Knight’s carried polearms from additional angular spring offsets. Their authored animation still plays. Root squash preserves volume around the board origin. [Handmade walking pair](captures/clay-handmade-walk.png) · [Plasticine walking pair](captures/clay-plasticine-walk.png).
