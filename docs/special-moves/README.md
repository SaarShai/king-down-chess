# Special-move usability — 2026-09-25

Implemented on `codex/cursor-adoption`, following adoption commit `0a00f3d`.

- Tapping or dragging an Ogre onto a target that allows both actions opens Capture / Push, with destinations explained. Cancel or Escape leaves the position unchanged. Shift-click remains a push shortcut; unambiguous pushes happen directly.
- Selecting a piece brings its instructions and Cancel selection to the top of the panel. Beast chains have a visible Finish chain button with the capture count. Reaver lab captures have a finish control too.
- The piece guide describes the new controls. Rules, clay rendering and saved-game format are unchanged.

## Verification

Production build and 25 targeted game/play tests passed. All 36 browser scenarios passed without errors: 10 special-move scenarios, 11 adoption regressions and 15 clay regressions. Mouse and emulated touch cover both Ogre outcomes, cancellation, undo, Beast finishing/continuation and Maester swaps. Keyboard checks cover Escape, Shift-click and stale-choice cancellation after undo. Touch tests use Chrome touch events, not a physical phone. The mobile chooser screenshot was visually inspected.

```sh
npm run build
npx vitest run src/play.test.ts src/game.test.ts
node tools/verify-special-moves.mjs
PLAYABLE_BROWSER=chrome PLAYABLE_OUT=docs/special-moves/adoption node tools/verify-cursor-adoption.mjs
PLAYABLE_BROWSER=chrome PLAYABLE_URL=http://127.0.0.1:5189/ PLAYABLE_OUT=docs/special-moves/clay node tools/verify-playable-clay.mjs
```

Evidence: [build](build.log), [tests](tests.log), [special moves](browser-checks.json), [adoption](adoption/adoption-browser.json), [clay](clay/browser-checks.json), [desktop chooser](desktop-choice.png), [mobile chooser](mobile-choice.png).

The existing local preview was refreshed and its updated guide verified. Setup QNKMNRSG, White to move, no played moves and existing player settings were preserved. No publication or research runs.
