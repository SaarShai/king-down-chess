# Promotion preview

Status: ready for owner feedback. Standalone sample. No integration.

Scope: this folder only. Use the shared painted scene and engine. No game integration, rule, asset or shared preview changes.

Plan:
1. Build legal quiet d7–d8 promotions to queen and knight. Keep the full neighborhood.
2. Add a 100 ms arrival and a 740 ms gold-dust reveal. Keep the foot fixed during the reveal. Show the selected identity before its midpoint.
3. Add replay, pause, seek, speed, reduced motion and board flip. Start at the settled result.
4. Check exact frames, both choices and orientations, phone and laptop layout, keyboard input and motion preferences.

Motion: one local rising veil, then three broad falling flakes. Preserve the painted figure. Use the scene's row layers for overlap. Cache painted texture and render only on request or during playback.

Pass criteria: legal engine outcomes; no empty destination during transformation; no art scaling; correct selected identity at midpoint and end; deterministic seek; no overflow at 390 or 1440 px; motion stops when hidden or offscreen; reduced motion shows the final identity.

Evidence: `verify.mjs` passes 89 checks in headless Chromium. It covers both choices, both orientations, exact render pixels, pause/replay, keyboard seek and choice, 390 × 844, 1280 × 800 and 1440 × 900 layouts, offscreen stopping, a simulated hidden event, system reduced motion on load/change, and direct reduced-motion results. Representative frames are inspected. No resource or browser errors occur. The mechanical design check has one warning for the cream background; the owner's required game palette takes precedence.

Preview: <http://127.0.0.1:5292/docs/specs/effects-animation/preview/concepts/promotion/>. Server PID 94099, port 5292. API: `window.motionConcept.ready`, async `seek(0..1)`, async `select('queen'|'knight')`, and `getState()`.

Limits: one quiet White promotion fixture. No capturing promotion, game integration, full test suite or physical-phone performance check. The parent runs consolidated checks. Owner approval remains open.
