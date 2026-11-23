# End Turn commit seal

Status: ready-for-human (the owner approves the rendered frames)

The player's own End turn is one moment of 420 ms. Before, the plate got an edge light and a separate streak went to the opponent's seat while the turn text changed. Now `seal()` (`src/interface/play/fx/canvas.ts`) draws on the effect layer, on the effect clock; `passTurn(true, sealed)` in `main.ts` calls it.

| Time after the tap | What shows |
| --- | --- |
| 0 ms | The turn command goes out, as before. The plate presses (the existing spring) and the turn text changes. |
| 0 to 100 ms | A wax-red seal with a vellum crown drops from 1.6 times its size onto the right end of the brass plate. |
| 100 to 240 ms | A faint wax ring spreads from the seal. |
| 100 to 270 ms | A brass line runs from the seal to the left end of the turn text. |
| 230 to 330 ms | A brass rule sweeps under the turn text, left to right. |
| 300 to 420 ms | All marks fade. The plate goes back to the stone slot (the existing wait shade, now stone at full strength). |

One design for desktop and phone: on both, the turn text is above End turn, so the line always rises to it. The marks are on the effect layer: no element moves, no box changes, no pointer input is taken.

No seal: an End turn after a free action alone (the old edge light stays), a turn that ends the game (the result owns that moment), Undo, a reload, and the opponent's turn. Reduced motion and Motion off draw nothing, and the plate is stone at once.

Frames: `PLAYABLE_OUT=<folder> node docs/specs/gui-commit/capture.mjs` (after `npm run build`), 5 frames at 0, 100, 190, 300 and 430 ms, at 1280x800 and 390x844.
