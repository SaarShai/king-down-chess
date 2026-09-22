# Bishop and Paladin: visible leg movement

Their visible boots were mostly weighted to cloth. Moving foot bones therefore
produced a small robe-like sway, while mixed weights stretched the Paladin's
shoes. The original Bishop toes travelled only 0.018 board units; Paladin's
boots travelled 0.040–0.049 despite authored strides of 0.15 and 0.17.

The repair assigns the actual connected boot/shin surfaces to their legs.
Bishop has four separate source islands. Paladin's boots and calves are
connected to the torso above the knees, so its two lower islands are selected
below the kilt and blend into cloth before reaching their upper boundary.
The exterior cloth and hanging ornaments stay out of those leg selections.
Joint landmarks now follow the actual sculpts. Shoes stay rigid, with broader
ankle blends; Paladin uses a lower 0.036 foot lift to avoid compressing its short
calves into the hem. Existing stride lengths and timings are preserved.

Validation against `01a4595`:

- `node tools/graphics-prototype/verify_cleric_walk.mjs`: **42/42** checks,
  across current, handmade smooth and handmade stop-motion looks. The same
  checks on the old GLBs fail visible stepping, calf movement, boot rigidity,
  contact and deformation (`before.json`).
- Smooth Bishop toe travel is now **0.149**, with **0.040** lift; Paladin boot
  travel is **0.170**, with **0.036** lift. Both calves follow their legs.
  One foot remains planted, shoes retain shape to floating-point precision,
  and loop/reset errors are zero. Edge stretch peaks fall from 4.82×/4.51×
  to 1.31×/1.60× for Bishop/Paladin; no collapsed edges under the test's limit.
- Front/side views at four phases, both army colours and 0.5 px are saved here.
  Both live close-ups were inspected and left playing for owner review.
- All 16 models' position, normal, colour, index and clay-morph buffers are
  byte-identical to the baseline. The other 14 complete GLBs are byte-identical
  (`preservation.json`); the accepted Beast and shared runtime are unchanged.
- Full cast checks: **37/37**. Applied-clay/animated-outline checks: **8/8**,
  including exact silhouette agreement with the native skinned render.
  No browser/shader errors. `npm run build` passes with the existing size advisory.

The complete editable cast was rebuilt in `../complete-cast.blend`.
To rebuild only the two exported models:

```sh
Blender --background --python tools/graphics-prototype/build_roster.py -- bishop paladin
```

Omit the selection to also save the complete editable cast. To reproduce the
negative control without replacing current assets:

```sh
CLERIC_BASELINE=01a4595 CLERIC_CHECK_OUT=/tmp/cleric-before node tools/graphics-prototype/verify_cleric_walk.mjs
```
