# Board-distance meshes and asset delivery — 2026-09-22

The refined study now has **Automatic**, **Original sculpt** and **Lighter board model** choices under Mesh detail. Automatic starts full-board/cast views on the lighter assets and switches with projected figure height (115 / 155 CSS-pixel hysteresis). It retains the camera, piece roots, army materials and walk phase; captures and active abilities finish before an automatic switch. The chosen 0.5 px canvas resolution is preserved.

Each of the 17 designs has a separate `board-*.glb`. All 16 previously accepted close-up GLBs are byte-identical to `c5c2de3`. The Ogre has its own new source asset. Only the models required by the selected scene/detail are fetched and cached. Earlier voxel and QuietHours comparison assets load on demand. A fresh Ogre close-up requests one GLB, with no other character GLBs or QuietHours scripts.

## Measured result

| Measure | Original sculpts | Board assets |
| --- | ---: | ---: |
| Full 17-design library triangles | 408,766 | 265,180 |
| Full library GLB bytes | 23,556,096 | 9,171,856 |
| Full-board composer triangles/frame | 1,182,682 | 743,210 |

This removes **35% of source triangles, 61% of GLB bytes, and 37% of full-board submitted triangles**. The byte counts describe GLB files, not total page traffic or HTTP-compressed transfer. Draw-call reduction is not claimed. Counters include colour and piece-ID passes.

Six same-camera silhouette comparisons cover full board and all 34 cast figures, at rest and two walking phases, in handmade clay at 0.5 px. Piece-ID differences remain below **0.5%** of the figure union. This measures silhouette/occlusion agreement, not equality of all interior shading pixels. Original/lighter screenshots are saved alongside `checks.json` and were visually inspected.

## Pipeline and constraints

`node tools/graphics-prototype/build_board_models.mjs` derives the assets using the established [glTF Transform simplifier](https://gltf-transform.dev/modules/functions/functions/simplify) and Meshoptimizer. It targets 28% of triangles with a 0.15% geometric-error cap and locks primitive borders to retain the authored paint cuts. The cap and seams take precedence over the ratio, so detailed pieces such as the Paladin reduce less aggressively. No custom mesh reducer or new runtime engine was added.

Vertex streams are reordered and then encoded using [EXT_meshopt_compression](https://gltf-transform.dev/modules/extensions/classes/EXTMeshoptCompression), without the separate quantization transform. Surviving vertex data, clay morphs, skin weights and animation samples keep their precision. The runtime uses the Meshopt decoder already distributed with Three.js. glTF Transform and Meshoptimizer are pinned build-time dependencies. Source files are never overwritten; `board-manifest.json` records source hashes, counts, sizes and clip names.

## Verification and limits

- `node tools/graphics-prototype/verify_board_models.mjs`: 63 checks pass, including all source hashes, normalized weights, semantic paint/morph retention, exact skeleton/clip equality, lazy requests, silhouette comparisons, automatic zoom switching and stable GPU resource counts across repeated detail changes.
- Existing renderer: 42/42; full cast: 38/38; focused Ogre: 9/9 grouped checks; engine reliability: 6/6; TypeScript/Vite build passes. The existing bundle-size advisory remains.
- 390×844 responsive layouts fit. No physical phone or older-device FPS/battery result is claimed. Device profiling remains the next measurement step, followed by idle-render scheduling and production gameplay animation integration.

The current integration is in the graphics-study route. It provides real load/workload savings there; the shipped game's voxel renderer has not been replaced or silently restyled.
