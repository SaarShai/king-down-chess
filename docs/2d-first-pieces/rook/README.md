# Painted Rook

2026-09-26. A compact painted Rook study with the original tower-and-pillar golem identity. [Character preview](http://127.0.0.1:5192/rook/) · [Board position](http://127.0.0.1:5192/board/?position=rook).

`original-reference.png` preserves the archival Rook source. `rook.png` is new 1536 × 1024 RGBA artwork generated with built-in **image_gen**, using the original Rook for identity and the accepted painted Ogre/Knight studies for style. Each source window contains a complete figure with the full tower, pillar arm, clenched fleshy hand and feet; Ivory uses warm bone surfaces and Charcoal is slate/charcoal across stone and skin. The adopted PNG is copied unchanged from imagegen, including its alpha. SHA-256: `ca04ab1009de56bb5320f0346ac5a28be077ff5eaf985098a83e73a39763a5d4`. The requested equal-cell layout drifted; the actual gutter is x=780. Runtime source windows of 780/756 px preserve both complete fists, at the same scale, without editing the image. A fitted derivative with a clipped Ivory fist was rejected during parent review.

The source profile points left like the archival reference. `drawRook` mirrors the complete source window at draw time, so the runtime pose has a canonical +x/right-facing silhouette; normal army-facing mirroring can then face the two sides toward each other. `ANCHOR` and `HIT` are in the 1152 × 1152 local canvas: the anchor is `{x:576,y:964}`, while `{x:576,y:505}` is a torso/body hit point for incoming attacks. `extension` is the normalized `actionAt(t)` amount (−0.14 to 1).

The 1.1-second action rocks the complete painted figure through at most 0.025 radians around the forward stone-ground contact at `{x:928,y:964}`. The rear foot lifts slightly as the weight comes forward, then returns. Tower and fist remain rigid. This is a restrained weight shift, not a walking cycle, independent arm articulation or new directional artwork. Both armies, Brace/Reset, slow/reduced motion, keyboard activation and board-scale samples are available. Physical touch hardware and owner acceptance remain untested.

```sh
node --test docs/2d-first-pieces/rook/motion.test.mjs
```

The focused test samples 1,001 poses and verifies bounded anticipation, rigid point distances, fixed stone contact and recovery. The imagegen prompt and source paths are preserved in [prompt.json](prompt.json).

Parent review: both army silhouettes, rigid forward rock, Reset/army cancellation, keyboard/reduced motion and 390 px layout inspected in browser. Both Rooks capture on the board and Undo restores the victim; interrupted capture leaves the position intact. See [shared verification](../board/README.md#parallel-cast-review).
