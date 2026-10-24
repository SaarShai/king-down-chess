# State effects in the real game

The real-game result is ready for local review. This applies the reviewed materials. It does not claim new owner approval.

- Early result: `/tmp/effects-state-game/early-freeze-430-white.png`. A real power tap freezes the knight on d5. The approved ice volume builds around the figure. The turn pip stays below it.
- Moved ward: `/tmp/effects-state-game/firewall-moved-390-white.png`. The rook moves from a2 to d2 and keeps its Firewall ward at d2.
- Symbols: `/tmp/effects-state-game/guard-symbols-390-white.png`. The approved steel material stays behind the icon. The piece identity remains clear.
- Real Hint: `/tmp/effects-state-game/hint-390-white.png`. Show me runs the lesson search and returns the Beast's legal path.
- Full set: `/tmp/effects-state-game/`. `capture.json` lists 57 images and no page errors. It includes 430 and 390 px, both directions, and the two workshops after the shared material move.
- Log: `/tmp/effects-state-capture.log`.

Run `node docs/specs/effects-animation/evidence/14-state-integration/capture.mjs` from this worktree to make the captures again. The script starts its own free-port Vite server and separate browser. It closes both. It does not use preview port 5198 or the owner's tabs.

The final focused check passes 51 tests plus the 50 scene tests that `npm test` runs. Four existing browser checks pass: verb-marks, powers, lessons and special-moves. This is not a full-suite or combined integration pass. Ticket 14 has the exact hooks, limits and root merge notes.
