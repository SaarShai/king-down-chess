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

## Locomotion correction — 2026-09-21

Automatic step squash and the generic body/arm spring layer have been removed. Guard and Archer keep their approved articulated steps. Pawn, Knight, Rook, Paladin, Maester and Beast now shuffle as intact sculpts, rolling gently over their supporting edge. Bishop, Queen and the six Kings use a composed glide over a low clay contact wave. The `Movement` control also lets the owner compare flow and shuffle on any character. The effect moves the contact patch rather than stretching the character's proportions.

`Smooth · fluid clay` and `Stop-motion · 12 fps` control cadence. `Preview motion in place` loops the chosen motion. `Preview travel` turns toward the destination, advances along the board and settles there; `Reset view` returns the pieces to their original squares. The explicit `Poke / squish clay` experiment remains separate from locomotion and returns to exactly the imported scale.

The rejected Beast clip stretches some triangle edges more than 23 times their rest length. This persists without the old clay layer. The replacement leaves the sculpt's local edge lengths unchanged to numerical precision, while whole-figure transforms and the small contact wave supply movement. The imported GLB and editable source are preserved; the distorted clip is no longer used for its live motion.

[Motion details and verification](clay-locomotion.md). This is authored motion and a deforming contact effect, not soft-body or fluid simulation. The older spring/poke captures above remain historical evidence.
