# Capture impact beat

Status: ready-for-human (the owner approves the rendered frames)

At a capture contact, `strike()` (`src/interface/play/fx/canvas.ts`) draws on the effect layer, on the effect clock. `main.ts` calls it from `onCaptureContact` when the contact is animated; `onCaptureVictim` gives the struck figure's height.

| Time after contact | What shows |
| --- | --- |
| 0 to 45 ms | The scene's contact hold (was 55 ms). The effect clock stops too, so the beat shows `beatAt(0)`: an ivory-gold rim light on the struck figure's flank. |
| 45 to 115 ms | The rim fades out. |
| 45 to 255 ms | A dry-brush slash: umber `#433022` body, broken gold edge `#ffdf85`, two bristle splits, tilted 40 degrees off the strike. The head cuts by 75 ms; the tail clears by 210 ms. |
| 65 to 305 ms | Four angular limestone chips with an umber edge cross the tile and fade. |

The whole beat ends at 305 ms. A ranged capture (the attacker stays on its square: Archer, Catapult) gets the rim and the chips, no slash. Reduced motion and Motion off draw nothing. The layer takes no pointer input. The turn is 10 ms shorter than before; the move order does not change.

Frames: `node docs/specs/gui-fx/capture.mjs capture` (after `npm run build`), 6 frames at 0, 30, 75, 125, 195 and 275 ms.
