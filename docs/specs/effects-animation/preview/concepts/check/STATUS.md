# Check proposal

Status: ready for owner feedback. Preview only. No game integration.

Scope: this folder only. Reuse the painted scene, king art, piece icon and cause line. Add no game rule or combat motion.

Plan:
1. Generate a legal rook check and king evasion with GameRules. Keep the existing e3 → e1 cause. Include a dense board.
2. Build one 440 ms onset: warm checker edge, inward rust wash, then a king seal impression. Hold still. Withdraw in 220 ms on a legal evasion.
3. Check exact frames, result identity, all controls, reduced motion, both orientations, 390 px and 1440 px.

Motion: the seal is the focal moment. The full cause path stays still. Brush texture and source masks are cached. The scene does no idle motion. The clock runs only on demand and stops when hidden or offscreen.

Fixture correction: the old sparse check fixture also puts the Black king in check from h1. Local inputs add a pawn on h7. Both new inputs start with neither king in check. A legal Rd3-e3 enters check; legal Ke1-f1 resolves it. No shared fixture changes.

Acceptance: real checkers match e3/e1; no king remains in check after evasion; result status is playing. The preview starts settled. Seeking is deterministic. Reduced motion shows the selected final state directly. No horizontal overflow or clipped stage on a laptop.

Checks: the local verification script passes. It checks legal positions, result identity, both sizes, both orientations, replay/pause/resume, keyboard scrub, exact repeated canvas pixels, speed, reduced motion on load/change, offscreen stop and a simulated hidden-page signal. No browser errors or failed assets. Narrow type check passes for main.ts and fixtures.ts. No full test suite runs.

Rendered frames: checker edge, seal impression, held check, withdrawal, resolved, phone, flipped phone and reduced resolved. No overflow at 390 × 844, 1440 × 800 or 1440 × 900. The desktop stage fits the viewport.

Limits: one rook cause, two board densities. The legal king reply uses direct artwork replacement; only check material withdraws. No baseline switch, sound, actual phone hardware test or game integration. Owner judgment of the proposed art and timing remains open.

Server: http://127.0.0.1:5293/docs/specs/effects-animation/preview/concepts/check/ . Listener PID 93919; launcher PID 93892. The server stays on for the parent.
