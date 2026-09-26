# Painted Ogre

2026-09-26. The third painted character, following Pawn and Archer. [Character preview](http://127.0.0.1:5192/ogre/) · [Board encounter](http://127.0.0.1:5192/board/?position=ogre).

## Artwork and provenance

`ogre.png` is a new 1536 × 1024 RGBA sheet generated with the built-in **image_gen** tool. The existing Ogre concept supplies the character identity; the accepted painted Pawn supplies the illustration style. This is derived artwork, not an original King Down archival asset. [prompt.json](prompt.json) preserves the exact prompt, both references and generated source path.

Ivory and charcoal versions have a broad bare-footed stance, small bald head, lower tusks, short knotted skirt, connected arms and open palms. Terracotta cuffs are the limited recognition colour. The source PNG and generated alpha are copied unchanged. SHA-256: `a25948e01802ffe6a5713b475737bfd2114f83a9c5d394d2d0c3ac6b0942a724`.

## Motion and interaction

The one-second shove anticipates, transfers weight forward, holds contact, and recovers. The entire upper body—including both shoulders, elbows, wrists and hands—moves rigidly together; displacement tapers through the legs to fixed toes and heels. It uses the existing Canvas texture drawing helper and native requestAnimationFrame. No extra animation framework, disconnected arm assembly or new pose sheet is involved.

The character preview supports both army colours, Shove/click/Enter, Reset, slow motion and reduced motion. The Ogre does not independently aim his arms at the cursor. His hands stay in the coherent pushing pose; board targets determine his facing and contact position. This is a restrained weight-shift animation, not a full skeletal rig or walking cycle.

On the board, Ogre rules come from the existing engine bundle. He can step one square in any direction, capture an adjacent enemy (except a Guard), or push an adjacent friend/enemy other than a king into the empty square beyond, following into the vacated square. Shoves retain both pieces and do not change army counts. When an enemy square offers both actions, a native keyboard-accessible dialog explicitly asks **Capture** or **Push**. Teal arrows show push direction; sidebar actions also state the landing square.

The board stages contact against the actual target, animates the target and Ogre together, then settles the Ogre on his new square. The picture's feet remain fixed during the weight shift, while the complete board figure glides during travel. As with the Pawn, side-on staging represents vertical/diagonal contact without inventing a rear-view drawing. Fully directional artwork, locomotion and independent arm extension are outside this pass. The playable game on 5189 is unchanged; owner review of the new art is pending.

## Try the encounter

- Ivory Ogre c4 → d4: choose capture or push d4 → e4.
- Ivory Ogre c4 → c5: push a friendly Pawn to c6.
- Charcoal Ogre f5 → e5: capture or push the enemy Pawn to d5.
- Ivory Ogre c4 → d3: capture only; e2 is occupied, so pushing is unavailable.

Undo restores both pieces after a push; Undo/Reset during an action cancels it before the board state changes. Escape or Cancel dismisses the action choice without moving anything.

## Verification

- Viewed both full-colour figures and board-size samples at rest and slow-motion contact. Full head, fingers, toes and skirt retained; connected arms and fixed feet through the shove.
- `motion.test.mjs`: **1,001 motion samples** preserve upper-body coordinates relative to one another, fixed soles, bounded contact points and non-folding leg bands (minimum vertical cell ratio 0.9933). Engine assertions cover both armies' distinct capture/push results, friendly pushes, blocked destinations, king exclusion, counts and immutable original positions.
- Real browser: Ivory enemy push and capture, Charcoal enemy push, vertical friendly push, correct final squares/counts, Undo restoration, interrupted Undo/Reset, reduced-motion push, keyboard movement and Escape cancellation. Slow-motion on-board contact inspected.
- Character and action dialog checked at 390 × 844. Document width equals viewport width (390 px); full figure and controls fit. Temporary viewport restored. Physical touch hardware was not tested.
- Existing Pawn and Archer geometry checks pass (442 / 44,642 Pawn aim/thrust samples; 940 Archer poses). Their animated captures still complete in the board browser. No browser warnings/errors observed.

```sh
node --test docs/2d-first-pieces/ogre/motion.test.mjs docs/2d-first-pieces/lance/aiming.test.mjs docs/2d-first-pieces/wrist-bow/aiming.test.mjs
```

The static server and engine bundle rebuild commands are in [the board notes](../board/README.md). These checks establish behavior and observed rendering, not owner approval.
