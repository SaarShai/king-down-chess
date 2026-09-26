# Painted Rook

2026-09-26. A compact painted Rook study with the original tower-and-pillar golem identity. [Character preview](http://127.0.0.1:5192/rook/) · [Board position](http://127.0.0.1:5192/board/?position=rook).

`original-reference.png` preserves the archival Rook source. `rook.png` is new 1536 × 1024 RGBA artwork generated with built-in **image_gen**, using the original Rook for identity and the accepted painted Ogre/Knight studies for style. Each 768 × 1024 cell contains a complete figure with the full tower, pillar arm, clenched fleshy hand and feet; Ivory uses warm bone surfaces and Charcoal is slate/charcoal across stone and skin. The generated sheet was globally fitted to 1440 × 960 and bottom anchored inside the required 1536 × 1024 canvas to guarantee a transparent cell gutter without cropping. SHA-256: `c1ce7de93404b89ca0a8fc47cf1268af853f74f0d3c3218edc7e7095481691a9`.

The source profile points left like the archival reference. `drawRook` mirrors the complete cell at draw time, so the runtime pose has a canonical +x/right-facing silhouette; do not mirror it again at integration. `ANCHOR` and `HIT` are in the 1152 × 1024 local canvas: the anchor is `{x:576,y:978}`, while `{x:576,y:505}` is a torso/body hit point for incoming attacks. `extension` is in local canvas pixels; the authored shift is `SHIFT = 18` px.

The 1.1-second action is a restrained planted ram: a short anticipation, an 18 px rigid translation with a tiny rotation, a hold, and recovery. The complete painted pose stays rigid, so the tower, pillar and fist do not stretch. It is a weight-shift study, not a walking cycle, independent arm articulation or a new set of facings. The preview includes both armies, Brace/Reset, slow and reduced motion, keyboard activation, and board-scale samples. Physical touch hardware and owner visual acceptance remain outside this pass.

```sh
node --test docs/2d-first-pieces/rook/motion.test.mjs
```

The focused test samples 1,001 poses and verifies bounded anticipation, a fixed scale, rigid point distances, anchor translation and recovery. The imagegen prompt and source paths are preserved in [prompt.json](prompt.json).
