# QuietHours provenance

Upstream: https://github.com/achrefelouafi/QuietHours

Inspected/copied commit: `73db46c2d1f26a5494a97c87097295865f9c8a2a` (21 September 2026).

The six files `core.js`, `palette.js`, `camera.js`, `draw.js`, `light.js`, and `inks.js` are unchanged copies from upstream `src/engine/`. `LICENSE` is the upstream MIT license, copyright (c) 2026 mohamedachrefelouafi. Retain it with these files.

The King Down adapter is in `src/render/prototype/study.ts`. It extends the palette at runtime before constructing the ink lookup, projects King Down model triangles through the fixed isometric camera, and uses the drawing/shading/glow/quantization routines. It does not copy QuietHours rooms or character assets. Its mesh painter sorting, camera restrictions and WebGL shell limitations are documented in `docs/graphics-prototype/README.md`.
