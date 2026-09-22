# Engine reliability checkpoint — 2026-09-22

Three bounded fixes in the shared renderer, without changing accepted clay assets, gait or capture art:

| Issue | Reproduction before | Fix / verified result |
| --- | --- | --- |
| Projectile GPU resources survive removal | Eight rendered shots raised geometry count 25 → 33 | Dispose the arrow's unique geometry/material on completion, including tween flush. Eight shots now leave geometry/textures at 24/5. |
| Ground shadow travels upward with hopping root | Shadow world height 0.37 while the board is at zero | Counteract the piece's vertical offset in the common hop callback. Mid-hop and completion stay at 0.02. Applies to ordinary moves, swaps, chains and shoves that use this path. |
| Empty debris pool still submitted | 400 instances while idle or expired | Hide an empty pool and trim its unused instance tail. A 28-particle first burst submits 29 slots (one initial empty slot); expired count is zero. |

The idle-pair workload drops from 54 to 52 draws and from 63,594 to 53,994 submitted triangles across the complete composer frame: **9,600 useless triangles removed**. The bounded ring can still contain empty holes among live particles; no unnecessary pool-compaction framework was introduced.

`verify_engine_reliability.mjs` goes red on all four symptom checks before the fixes. The final six checks pass, including a warmed cycle through three looks and all five capture types, walking/reset, and four repeated rounds. Every final sample stays at 26 geometries / 23 textures. No browser or shader errors. Existing renderer checks 42/42 and TypeScript/Vite build pass. The build retains the existing bundle-size advisory.

An off-camera arrow does not allocate GPU geometry and gives a false-negative leak test. This regression deliberately shoots through the visible study stage and renders the live projectile before finishing it.

## What should come next

Keep Three.js and the accepted art direction. The highest-value next work is the production asset/runtime path, not an engine replacement:

1. **Board-distance meshes and asset delivery.** The full 16-design library is 22,389,696 bytes of GLB data and 380,768 source triangles. Paladin alone is 63,913 triangles / 4,949,056 bytes. Keep the close-up sculpts; author a second lower-density board representation that protects silhouettes, painted boundaries and deformation. Verify at actual board scale before adopting it. Compress/cache only the assets needed for the match. These byte counts describe the current GLBs, not compressed HTTP transfer size.
2. **Idle rendering and device budgets.** Measure a representative phone and older device, then stop unnecessary idle redraws and expose sensible quality tiers. The preferred 0.5 px setting uses 2× dimensions (4× output pixels) relative to 1 px. Do not silently trade away the owner's chosen quality based on software-renderer timings.
3. **Production animation integration.** The study still owns debug controls and in-place animation. Move accepted walking/capture behaviour through the game's actual move/reset/cancel sequence, with one owner for per-piece resources. Preserve logical state and square picking while a visual effect is in progress.
4. **Asset and WebGL recovery.** Deliberately test missing/corrupt assets, interrupted loads and context loss; add clear recovery where reproduced. No failure has been established for these paths in this bounded pass.

Current complete-frame counters at a 690×630 backing canvas, 1 px, handmade clay with adaptive contours:

| Scene | Figures | Draw calls | Submitted triangles |
| --- | ---: | ---: | ---: |
| Character pair | 2 | 32 | 89,890 |
| Full board | 32 | 292 | 1,182,682 |
| All 16 designs, both armies | 32 | 320 | 1,524,762 |

These include beauty and piece-ID work. They are workload measurements, **not physical-device FPS or battery measurements**. Detailed counters are in `workload.json`.

Reproduce with the study running on port 5190:

```sh
node tools/graphics-prototype/verify_engine_reliability.mjs
npm run graphics:check
npm run build
```

`ENGINE_QUICK=1` skips the longer lifecycle/workload section. `ENGINE_CHECK_OUT` selects a separate evidence directory for negative controls.
