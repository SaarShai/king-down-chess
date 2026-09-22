# Playable clay edition

Open **http://127.0.0.1:5188/**. This is the actual game with the accepted graphics from “Audit chess graphic engine”: the full standard clay cast, both armies, walking, contours and the repaired Ogre with its shove gesture. Human/computer and two-human games work. Both armies now face one another. The game is fixed to handmade clay at **0.5 px · double detail**; rendering controls and legacy saved/URL style overrides are removed. Camera, labels and coordinates remain available.

Source: `/Users/za/.codex/worktrees/playable-clay/king down chess`, branch `codex/playable-clay`. Implementation commits `17babd1` and `a4d6491` (facing/fidelity correction), based on accepted graphics `af30711` plus search repair `413fa3d` (original research `2d7e7b0`). The main checkout and unrelated graphics edits were preserved.

Standard rules and random setup generation are unchanged: seven pieces from `QLRRBBNNAAGMMSS` plus king, mirrored armies, opposite-colour bishops when two are drawn. The five historical arrangements are optional examples, not newly proven best setups. Ogre remains an experimental practice option outside the standard pool. The piece guide was corrected to match existing Archer/Beast rules. The AI now uses the repaired repetition handling and actual game history.

Verified: 210 engine tests from the integration, plus a fresh production build/TypeScript and 15 production-browser checks for the facing/fidelity correction, with no browser errors. Checks cover both army orientations, fixed materials and double-resolution render targets, and ignored legacy style preferences. Save/reload, captures, knight leap, Ogre shove, mid-animation undo/reset and mobile layout were exercised. Approved model bytes and rules files were unchanged. Rich capture-effect prototypes remain study-only; physical-device frame rates remain unmeasured.

Detailed handoff, screenshots and checks: `/Users/za/.codex/worktrees/playable-clay/king down chess/docs/playable-clay/README.md`. Built files are in that checkout's `dist/`. To restart, run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 5188` there. Use HTTP rather than opening the HTML file directly.

No research runs, remote models, subagents or supervision automation were restarted. The former campaign remains closed; this playable integration is a separate owner-authorized task.
