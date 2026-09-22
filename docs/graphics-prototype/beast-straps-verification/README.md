# Beast: feature-aligned strap colour

The former rectangular mask coloured the muzzle frame, missing the actual
leather harness. The accent now follows the crown strap, temple/rear head band,
diagonal straps and wrist bands. The metal muzzle, chains, buckle rims, teeth and
skin stay in the army colour. The reference is
`art-src/pieces/colour-guides/Beast_color_guide.jpg`.

The source sculpture is a single fused mesh, without separate strap objects.
`tools/graphics-prototype/paint-masks/beast-straps.json` stores an authored face
selection on its reduced surface, with local boundary cuts for the back band,
wrist and buckle rims. The selection was inspected in front, back, both side and
top orthographic views. This follows surface features rather than applying a
height band across the figure. A geometry fingerprint rejects the selection if
the underlying reduced mesh changes; it must then be reviewed and repainted.

The mask is baked into the two existing material groups. It adds no runtime
textures, shaders or draw calls. The army colour covers 91.09% of the surface;
the strap accent covers 8.91%. Paint cuts preserve surface area within 5e-9,
and the same sculpt smoothing, normals and crease shading are retained.

Validation:

- `Blender --background --python tools/graphics-prototype/build_roster.py -- beast`
  rebuilds the GLB from the source sculpture and saved selection. The revised mesh
  and original rig are also saved in `../complete-cast.blend`.
- `Blender --background --python tools/graphics-prototype/verify_beast_paint.py`:
  19/19 surface probes cover straps on both sides/back/wrists and excluded skin,
  muzzle, teeth, chains and buckle rims (`paint-probes.json`).
- `BEAST_CHECK_OUT=docs/graphics-prototype/beast-straps-verification node
  tools/graphics-prototype/verify_beast.mjs`: 15/15; the repaired walk's surface
  bounds, rigid hands/head, loop and reset still pass in all three render/cadence
  conditions. Animation sample buffers are byte-identical to `2d5d849`.
- `npm run graphics:check:cast`: 37/37; `npm run build`: passes, with the existing
  bundle-size advisory. Other character exports/profiles remain unchanged.
- Inspected the browser at 0.5 px while walking and in front/side/back captures.

This pass applies the feature-boundary approach to the Beast. Other characters'
accent selections have not been repainted in this pass.
