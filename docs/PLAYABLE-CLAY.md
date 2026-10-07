# Current playable build — selective Cursor adoption

The integrated checkout is the main repository, `/Users/za/Documents/king down chess`, branch **`main`** (consolidated 2026-09-26 from `codex/cursor-adoption`, the painted 2D trial and `takeover`). It builds on accepted clay commit `c8f4ca7`. The former dirty `takeover` state is preserved as tag `archive/takeover-donor-worktree` and in the private recovery archive; superseded study branches are tags under `archive/`.

Local production preview: **http://127.0.0.1:5189/**. The same game in the painted 2D look: **http://127.0.0.1:5189/?look=painted** ([notes](painted-game/README.md)). Restart from this checkout with `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 5189 --strictPort`. The resulting static build is in `dist/`; serve it over HTTP. This adoption was not published.

Latest follow-up: [special-move usability](special-moves/README.md). Ogre targets offer Capture / Push when both are legal; selection instructions and chain finish/cancel controls are reachable at the top of the panel.

## Current game

- Random pool: **`QORRBBNNAAGMMSS`**. Seven drawn pieces plus the king; mirrored armies and opposite-colour bishops. Ogre uses **push**, following the displaced neighbour. Paladin remains available in custom setups and appropriate historical promotion sets.
- Standard promotions remain Q/R/B/N. Archer's forward diagonal-2 shots, Beast's eight adjacent captures and the one-step immortal Guard remain as previously adopted. Castling, en passant and king powers remain off in a normal game. [RULES.md](RULES.md) is the current rule reference.
- Fixed handmade clay at 0.5 px, the accepted facing and Maester/Paladin/king proportions are preserved. Click to select/move, or drag an own piece. Drag elsewhere to orbit; scroll/pinch to zoom; R resets the view. Z undoes.
- Hint marks a legal suggestion without playing it. Beginner/Casual vary choices; Club caps thinking at 800 ms; Strong uses the full Think setting. Club and Strong use the same policy at 800 ms. These labels are not measured ratings.
- Optional auto-queen applies only when the legal promotion choices are the orthodox set. Sound and mute persist. Piece guidance and move explanations use the live rules/history and sit in the scrolling panel, keeping the mobile board steady during selection.
- Existing ordinary saves keep their rules; old saves without a skill stay Strong. A new game uses the URL preset or current defaults. Rematch retains the saved game's rules. Experimental reserve/clock saves are not a supported compatibility contract.
- Historical setup examples remain optional. Four recovered practice rows reuse the same selector; three are labelled Catapult lab. Catapult, Reaver and Templar remain outside the random pool and standard promotion set.

## Values and scope

| Piece | Evaluation value |
|---|---:|
| Pawn / Knight / Bishop / Rook / Queen | 100 / 316 / 322 / 449 / 933 |
| Archer / Paladin / Guard / Maester / Beast | 505 / 408 / 96 / 318 / 434 |
| Ogre | 318 |
| Lab Catapult / Reaver / Templar | 400 / 400 / 350 |

Only Ogre's value changes from the accepted clay base (300 → 318); no new evaluator fit or strength measurement was performed. The recovered arrangement sketch used Catapult 156, so choosing a practice row here does not replay that study.

Missing-king, root draw and capture-horizon terminal handling now agree with the adopted rule switches and live-Strike exception. The accepted whole-history repetition repair remains in place, and both AI and Hint receive actual prior positions.

Clock and Squire/reserve machinery remain archived. The arbitrary five-way capture-style selector was not imported. Legacy Dungeon presets use procedural stone; three unused stock-derived JPEGs and their loader are removed. The approved clay assets remain unchanged.

## Verification and records

**267 tests in 10 files**, TypeScript/production build, **15 clay browser checks plus 11 adoption scenarios** pass. The browser scenarios use real pointer/touch input in isolated Chrome, with no page/console errors. Desktop/mobile screenshots were inspected. Physical-phone frame rates and human strength ratings were not measured; Vite retains its existing non-failing large-chunk notice.

The execution record (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/EXECUTED.md`) maps kept, consolidated and held work to its implementation and evidence. The research catalog (`dd34fa5:docs/cursor-recovery/2026-09-24-0213b442/RESEARCH.md`) qualifies the 21 recovered reports and 880 historical game records. The [September 22 record](playable-clay/README.md) remains historical evidence for the accepted base.
