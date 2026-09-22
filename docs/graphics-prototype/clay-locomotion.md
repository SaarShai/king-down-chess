# Clay locomotion correction

The owner rejected the repeated squash and clumsy deformation. The replacement gives movement to the intact sculpt through weight shift, a small clay contact wave and actual forward travel. Materials, identifying feature colours and approved source geometry remain unchanged.

| Characters | Default motion |
| --- | --- |
| Guard, Archer | Existing articulated steps with the extra clay spring/squash layer removed |
| Pawn, Knight, Rook, Paladin, Maester, Beast | Weighted shuffle: gentle rigid rocking, contact-edge compensation and a subdued clay scuff |
| Bishop, Queen, six Kings | Clay flow: restrained lean/sway over a travelling low contact wave with a tapered heel |

The new **Movement** selector offers character defaults, clay flow or weighted shuffle. **Preview motion in place** loops; **Preview travel** turns toward the destination, advances, then stops there. The compact character stage advances 0.65 square; other scenes advance one square. Both armies move toward the vacant ranks. Travel and character playback share the same elapsed-time cap, keeping them synchronized on slow frames. **Reset view** restores their original squares. Smooth and 12 fps cadence share the same motion. An explicit poke may squash the figure; ordinary movement never does.

## Beast diagnosis

A deterministic 24-phase probe measures edges longer than 0.005 model units on the actual loaded Beast. The original clay playback reached a 23.59× maximum edge stretch, about 0.043× minimum edge ratio and 0.943 minimum whole-body height scale. Removing the clay layer retained the 23.59× stretch; suppressing tail tracks also retained it. Suppressing leg tracks reduced the maximum to 2.03×. The dominant fault is the broad source mesh being pulled by the authored leg regions, with additional body/tail transitions still unsuitable for that sculpt. [Isolation probes](beast-deformation-diagnosis.json).

The live Beast now uses no limb animation tracks. Its original imported shape rocks as a whole with its lowest supporting edge kept at the original floor height. This removes the deformation rather than masking stretched surfaces with texture. The rejected baked clip remains in the source asset, and the verification harness deliberately replays it as a negative control. Guard/Archer keep their previously verified foot-contact clips.

## Implementation and limits

`WalkPreview.ts` owns playback, cadence, start/stop and the explicit poke. It uses Three's existing animation clock for both keyed and procedural motion. `ClayLocomotion.ts` owns rigid movement and a 129-vertex, 224-triangle contact patch, disposed with the figure. The patch uses the army colour, has no collision role, and is ignored by the piece-ID pass. Positions/weights in the source GLBs are untouched. No new dependency, skin-weight rebuild, fluid solver or simulation worker is introduced.

The surface wave stays beneath the figure; it does not leave permanent clay trails. The sculpt itself does not melt, and the heavier pieces do not attempt a new anatomical gait. Actual phone GPU performance remains unmeasured. Character motion and its exaggeration still need the owner's visual judgment.

## Verification

Run `node tools/graphics-prototype/verify_locomotion.mjs` against the study server. It checks the rejected Beast clip as a negative control, replacement edge lengths, constant body scale, actual rendered mesh floor contact, contact-patch placement for both armies, stop/reset, flow animation, forward travel, saved motion choice, 12 fps cadence and phone layout. [Machine-readable evidence](locomotion-verification.json).

- [Beast shuffle](captures/motion-beast-shuffle.png)
- [Queen clay flow](captures/motion-queen-flow.png)
- [Queen arrival](captures/motion-queen-arrival.png)
- [Complete cast](captures/motion-cast.png)
- [Phone view](captures/motion-mobile.png)

Existing renderer and cast checks are updated for the intended destination-settle behaviour and constant locomotion scale. Their skeletal, contour and explicit-poke checks remain active.

The TypeScript/Vite build and 93 browser checks pass (42 renderer, 37 cast, 14 locomotion), with zero browser errors. The replacement Beast edge ratios remain within roughly 3×10⁻⁷ of one, versus more than 23× for the rejected clip.
