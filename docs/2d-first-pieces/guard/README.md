# Painted Guard

2026-09-26. A bounded painted 2D Guard study following the Knight and Ogre sheets. [Character preview](index.html) · [Board position](../board/?position=guard).

## Artwork and provenance

`original-reference.png` is an unchanged copy of the supplied identity source, `/Users/za/Documents/king down chess/art-src/pieces/final-ivory/Guard.colored2_no_shadow.png`. It shows the enclosed, stocky living armour with broad rounded pauldrons, inset face, gauntlets and short boots.

`guard.png` is a new 1536 × 1024 RGBA sheet generated with the built-in `image_gen` tool. The left 768 × 1024 cell is warm ivory and the right cell is charcoal/slate. The original Guard silhouette is translated into the accepted painted 2D finish from the Knight and Ogre studies. Dominant army colours carry the armor; tiny cold-blue slit accents are the only recognition colour. Both figures retain full pauldrons, hands, lower armour and boots with transparent padding. `exactprompt.json` records both exact prompts, reference paths and output provenance.

SHA-256: `49a1216a3fdb84552452906a6eca682f141044861e855306b355c9229982dc6e` (`guard.png`); `3032b858ba5362c022516321c70de18c3b4cbbcbe97c2aa07f2ecd1913eef7ec` (`original-reference.png`).

## Motion and rules

The preview is a short defensive brace: a small preparation, a shallow +x shift into the ward line, a hold, and recovery. `drawGuard` uses a single coherent painted pose. The upper armour, gauntlets and hands move rigidly; the horizontal shift tapers through the greaves to zero at the soles so the Guard remains planted. No attack, arm stretch, skeletal rig or added equipment is implied.

`motion.mjs` uses an 1152 × 1152 local canvas. `ANCHOR` is `{x:576,y:1024}` at the shared sole line and `HIT` is `{x:576,y:540}` at the torso centre for board contact. The brace is a normalized `actionAt(t)` amount, with a 15 px maximum upper-body shift and `DURATION = 1050` ms. Positive x is right; the sheet keeps the authored forward-facing pose for both armies.

The standalone preview supports Ivory and Charcoal, Brace, Reset, click/Enter activation, slow motion and reduced motion. It links to the existing board position where the Guard moves one square in any direction to an empty square, cannot capture, can be captured only by the King, and can be pushed by an Ogre. The production game and renderer are outside this bounded artifact.

## Verification and limits

- `guard.png` is 1536 × 1024 RGBA. Each 768 px cell has transparent padding: Ivory alpha bbox `[28,17,754,1000]`; Charcoal `[13,24,739,964]`. The opaque figure pixels stop around y=960, leaving the sole blend room.
- `node --test docs/2d-first-pieces/guard/motion.test.mjs` passes 1,153 bounded action samples with preparation, +x brace, hold and recovery.
- The browser preview is intentionally standalone and uses no new dependencies. Root will inspect the rendered motion and board registration before adoption. Physical touch hardware, full directional facings and production renderer integration are outside this pass.
