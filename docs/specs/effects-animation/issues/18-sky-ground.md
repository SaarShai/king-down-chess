# Original Sky King and cloud floor

Status: preview ready

## Scope

Restore the original Sky King from the owner's King Down Drive folder. Add clouds that form and fade below him, like the existing Shadow and Mud floor effects. Do not change character actions, game rules, or other kings.

## Plan and verification

1. Retrieve and inspect the original Celestial artwork; retain its source and record Drive provenance. Replace the generated Sky figure in board and interface consumers.
2. Replace the old Stratus floor arcs with a soft cloud layer below the figure. Reuse the current king clock, movement fade, Off/reduced settings and scene draw order.
3. Check the loop, fade bounds, real board and enlarged preview. Show the original art and moving clouds for owner feedback.

## Result

Retrieved the original `King_Celestial_colored no-shadow.png` from King Down → final art → colored pieces. Drive file: `13q-SvTDMgzE2spUFTFQpux0W4ALHxAoK`. The original bytes are stored as `docs/2d-first-pieces/king-stratus/original.png`; provenance records their SHA-256. `prepare.mjs` makes the board sheet and both UI portraits with proportional scaling. It does not redraw or recolour the figure. Both armies retain the original colours and use the board's existing side treatment. Removed the obsolete generation prompt.

The old floor arcs are replaced by eleven soft cloud lobes. Their staggered four-second lives form, drift and dissolve beneath the figure. The existing ground clock, move fade, king fade and back-layer draw order remain in use. Hover and character actions are unchanged. Never substitute generated art for this original without an explicit owner request.

## Checks

- `KINGDOWN_TEST_FILE='src/ui/motion.test.ts' npm test`: typecheck, 12 selected helper cases and all 51 scene cases pass. The added cloud case checks a seamless loop, bounded opacity and floor extent. Log: `/tmp/sky-cloud-tests.log`.
- `PLAYABLE_BROWSER=chromium npm run check:browser king-effects`: passes in 106.7 seconds. Covers real board effects, movement, settings, reduced motion, hidden tabs and phone rendering. Mud + Sky on a 390×844 @3x phone averages 1.36 ms/frame (1.60 ms p95). Log: `/tmp/sky-cloud-browser.log`; run `effects-integration-66SWXk`.
- Visually checked the actual scene at desktop, 390 px phone scale and 2× close-up. The figure stays above the clouds. The source colours are intact.
- Preview: `/docs/king-effects/preview.html?record#idle-stratus`. The `record` query prevents capture samples from autoplaying. Screenshot: `/Users/za/.codex/visualizations/2026/10/23/01a168fe-8505-7842-89a3-dd078bd311a1/sky-clouds.png`.

This is ready for owner feedback. No deployment or full-suite rerun is claimed.
