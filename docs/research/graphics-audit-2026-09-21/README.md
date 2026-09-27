# Graphics audit evidence — 2026-09-21

See [the audit](../graphics-engine-audit-2026-09-21.md) for interpretation. These are current-code captures, not mockups of the proposed treatment.

- `asset-inventory.json`: parsed every OBJ under `art-src/pieces/obj` and every JSON under `public/models`. Triangles count polygon vertices minus two per OBJ face; voxel triangles count exposed grid faces × two. Accent share is occupied voxels with an accent value, not projected visible area. Source directory availability is recorded separately.
- `live-observations.json`: five desktop cases at viewport 1440×1000, DPR 1, plus 390×844 mobile layout at DPR 1. Browser version, graphics renderer, exact FEN and console/page errors are recorded. This uses software SwiftShader; it cannot establish physical-device performance.
- PNG names match those cases. Desktop files capture `#board`; mobile captures the viewport. Each fresh page used `?style=...&fen=...`; `dungeon-px1` additionally used `&px=1`; sprite cases used `&army=painted-ivory-charcoal`. After models loaded, both sides were set to Human on desktop. Mobile stayed White-to-move, so no AI turn was launched.
- The 36-piece FEN is an intentionally artificial visual inventory, with all 11 piece types for both sides. Do not interpret it as a shipped starting configuration.
- Composer counters were collected by setting `window.view.renderer.info.autoReset=false`, resetting its counters, rendering the complete composer once, reading `info.render`, and restoring auto-reset. Counts include both beauty and normals, full-screen passes and the idle particle pool.
- `runtime-probes.json`: separate 32-piece board (`rlgqkmab/pppppppp/8/8/8/8/PPPPPPPP/RLGQKMAB w - - 0 1`) at 1280×900. Same complete-frame counter method. Called the existing hop on the a2 piece with height 0.35 and observed the child shadow's world height. Called the existing arrow five times and compared renderer geometry counts after completion. These are isolated visual probes in a disposable browser, not recorded game moves.

No production assets were regenerated and no simulations or hardware timing benchmarks were run. These files were produced from working-tree code at commit `38fde50`, with pre-existing unrelated simulation/report changes left intact.
