# Playable clay edition — 2026-09-22

> Historical accepted baseline. The current adopted build, rules and verification are recorded in [PLAYABLE-CLAY.md](../PLAYABLE-CLAY.md). Screenshots and check counts in this folder remain evidence for the September 22 version.

Open the production preview at **http://127.0.0.1:5188/**. Play against the computer or choose Human for both sides. Drag to orbit; scroll/pinch to zoom. The playable checkout is `/Users/za/.codex/worktrees/playable-clay/king down chess`, branch `codex/playable-clay`.

To restart locally: run `npm run build`, then `npm run preview -- --host 127.0.0.1 --port 5188` from this checkout. The built static app is in `dist/`. Serve it over HTTP; opening its HTML through `file://` cannot run the module/worker game correctly. No cloud service, model delegation or keys are needed to play.

## What changed in the actual game

The completed studies did **not** establish a better standard ruleset or arrangement. All gameplay rules and the random draw pool remain unchanged. Random games draw seven pieces from `QLRRBBNNAAGMMSS` plus the king, mirrored for both armies; two drawn bishops occupy opposite colours. Guard remains in the back rank. No new abilities or king powers were adopted.

The five historical arrangement finalists are available as optional examples, explicitly not a ranking: `MMSSNBNK`, `KGBMSSMB`, `NKBBMGQS`, `QNKMNRSG`, `SQBKRSML`. Their planned new controlled comparison was cancelled during research wrap-up. Ogre practice is a separate small experimental position using the existing repel rule, with two human players selected. Ogre is absent from the default pool. The chess starting-army button changes the army only; the guide explicitly states that castling and en passant are absent.

The AI includes the tested fairy-pawn repetition repair from research commit `2d7e7b0` (integrated as `413fa3d`). Browser searches now also receive the actual prior positions, so the repair can recognize game history. This changes search reliability and decisions, not the legal rules. The existing residual evaluator remains selected; no training or rule-study runs were launched for this build.

The piece guide now matches the existing current rules: Archer can also shoot two squares diagonally forward; Beast can capture straight ahead. These abilities were already present in the engine. The custom-setup prompt now names the actual one-Guard pool instead of the stale two-Guard pool.

## Graphics integration

Based on graphics-session commit `af30711` from “Audit chess graphic engine”. All accepted model files remain byte-identical. The full standard cast uses the board-detail rigged models in actual play, with alabaster/ink-blue armies, feature-specific accents, softened handmade surfaces, clay-layer relief and articulated walking. Per the owner's correction, the game is fixed to handmade clay at the study's **0.5 px · double detail** setting: the clay pass renders at twice the canvas width and height. Rendering controls and saved/URL style overrides are removed; camera, labels and coordinates remain available. The accepted Ogre retains its repaired sculpt and texture-defined cuff colours. Its shove gesture moves the displaced piece at the authored contact timing.

The existing shared Ogre loader was generalized into `ClayFigure`; geometry/materials are shared, skeletons and mixers are per piece, and only needed models load. Piece contours use the study's tested skin/morph-aware pass. Uniform board sizing preserves model proportions while fitting the playable squares. Both armies face toward the opposing side at rest (White toward world −Z, Black toward +Z); travel/contact facing is temporary and resets after movement and undo. Knights retain their leap; walking, capturing, undo and new-game reset preserve the game state.

The owner's relative size adjustments apply after that board fit: **Maester ×0.5, Paladin ×1.3, every king design ×0.8**, uniformly on all three axes for both armies. Labels follow the new height and ground shadows scale with each figure. The 0.5 px setting is the finest existing study preset, not the maximum possible model detail: this game still loads the lighter `board-*.glb` assets; the original `rebuilt-*.glb` sculpts retain more geometry for close-ups.

Two integration issues were caught during browser verification: invisible letter sprites intercepted clicks on pawns (Three.js raycasts invisible sprites), and the desktop HUD covered the mobile back rank. Picking now excludes invisible hits; the mobile header has its own row above the board. The existing lightweight capture debris remains the game effect. The five elaborate capture sequences remain standalone study previews; their synchronous fragment construction is not put on the gameplay path. Physical-phone/older-device frame rates remain unmeasured.

## Verification

- `npm test`: **210/210 tests, seven files** from the playable integration; includes the five imported search regressions. `engine-tests.log`. Subsequent facing, presentation and proportion changes do not touch rules or search code; they were verified by build and browser checks below.
- `npm run build`: passes TypeScript and production bundling. Vite retains a non-failing large-chunk notice. `build.log`.
- `node tools/verify-playable-clay.mjs`: **15 browser checks pass** against the production preview, zero page/console errors. Includes opponent-facing armies after movement/undo, fixed handmade material and 0.5 px render targets, absent rendering controls, ignored legacy saved/URL style preferences, real clicks on every initial pawn-square centre, knight leap, human/computer play, save/reload, optional setup, current rule text, capture/undo, Ogre shove and mid-animation undo, new-game recovery and 390×844 mobile layout. `browser-checks.json`.
- Desktop and mobile screenshots were inspected: `desktop.png`, `mobile.png`. The header does not cover the mobile board. These are software checks, not participant play-test feedback.
- `piece-sizes.json`: six actual before/after figure comparisons against `a4d6491` confirm uniform Maester ×0.5, Paladin ×1.3 and king ×0.8 scaling in both armies, including corresponding label heights and shadow scales. Browser checks also verify that both pawn ranks remain selectable beside these resized pieces.

Research findings remain in the main project's `docs/research/direct-campaign-2026-09-22.md`. No research queue or delegation was restarted. This playable branch combines the accepted graphics and search repair without merging the separate experimental campaign into the owner's main checkout.
