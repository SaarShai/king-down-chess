# Beast deformation repair — 2026-09-21

The restored walk assigned every low vertex to the nearest leg. The Beast's
hanging hands and lower belly cross that dividing plane, so adjacent vertices
were pulled by opposing thighs. The old asset stretched some edges 23.59×.

The Beast now has continuous leg volumes, a protected hand region, broader ankle
blending and a smooth tail attachment. Its stride span is 0.12 instead of 0.17,
with 0.024 foot lift instead of 0.05, to limit folding in the thick lower legs.
The original 1.467-second timing and articulated foot cycle remain.

No renderer, shared playback, other character model or other character profile
changed. POSITION, NORMAL and COLOR_0 buffers in both Beast material primitives
are byte-identical to the accepted sculpture. Its paint and sculpt are preserved.
The corrected rig is also saved in `../complete-cast.blend`.

Verification:

- `node tools/graphics-prototype/verify_beast.mjs`: all 15 assertions pass across
  plain, handmade smooth and handmade stop-motion playback. Each condition samples
  48 phases after fade-in (2,432,832 triangle-edge measurements). The head and low
  hands retain their edge lengths within numerical precision; the original asset
  fails both the surface-deformation and feature-preservation checks.
- Whole-surface edge ratios: original 0.025–23.595; repaired 0.405–2.231. The 99th
  percentile is 1.108 in the repaired walk. Remaining changes are joint bending;
  these measurements guard against tearing, not a claim of rigid limbs.
- Feet still travel over 0.06 model units. Clip endpoints and reset match exactly.
- Front, side and rear captures at four phases inspected, plus live browser walk.
- `npm run graphics:check:cast`: 37/37; `npm run build`: passes (existing bundle-size
  advisory). Other model reports and GLBs unchanged.
- Focused source rebuild (`Blender --background --python
  tools/graphics-prototype/build_roster.py -- beast`) reproduces the repaired GLB
  byte for byte. It does not overwrite the editable whole-cast file.

`results.json` contains the repaired measurements; `before.json` is the negative
control from the original GLB. This fixes the Beast's deformation; the rejected
cast-wide locomotion experiment remains rolled back.
