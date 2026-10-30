# King capture facing

Status: ready-for-review

## Plan and checks

1. Use the ready turn route around the existing capture clock. Keep the legacy capture if preparation fails.
2. Match the Stratus outline and Spirit glow to the body drawn. Use the legacy capture for Flame unless its crack mask can follow the body. Return Stratus from idle before a capture.
3. Test both armies, all six kings, diagonal captures, Undo, cancel and reduced motion. Run the relevant browser checks. Inspect game-size video at normal speed.

## Findings

Commit `c37514df` added the gate with the character runtime. The integration ticket kept king attacks at their existing boundary. The current package has eight turns per king and army, but no king attack bank or separate king effect asset.

Before this change, the capture used the legacy body and its rest-facing outline. Stratus uses that outline to route and clip the thrown victim. Flame and Spirit also use masks made from the rest-facing figure. The existing turn body has its own pivot and scale. Moving a rest-facing mask to that pivot does not make its painted details match a different facing. A selected Stratus can also be in a raised idle frame when the capture begins.

The smallest safe candidate uses the existing turn route, holds the target-facing body through the unchanged capture clock, then returns along the reverse route. It must use the actual drawn body for its outline and figure-bound effects, and handle the selected-idle exit. Keep the legacy path when the required body cannot load. Verify the result before removing the gate.

The candidate uses the drawn frame for the Stratus bounds and Spirit glow. Shadow turn frames carry their own painted smoke. Flame keeps the legacy capture because its crack mask fits only the rest-facing armour. No art changes.

## Evidence

- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts npm test`: 34 cases pass; the 68 board tests pass.
- `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test`: 53 cases pass; the 68 board tests pass.
- `npm run check:browser king-capture-facing`: six kings, both armies, diagonal captures and Undo pass.
- `npm run check:browser king-capture-facing character-prepare character-runtime king-effects stratus-idle-exit`: capture, runtime and idle checks pass. Preparation and king-effects pass on their separate reruns.
- All 664 king turn frames are RGBA and have transparent corners.
- Six normal-speed WebM recordings cover both armies. Game-size frames have been inspected.

Flame keeps its legacy capture. A full visual review of every recording at normal speed and an independent code review remain open. The PR must not merge until the required reviews pass.

## Merge and review fixes

Plan: keep the Stratus rewind and the capture turn in the merge. Restore the strike lean and the Spirit fan anchor. Fix the response wait and capture clock bounds. Check the scene, runtime, effects and Stratus Undo, then run the browser checks and CI.

Shadow turn frames include painted smoke. Moving it needs a mask for each frame, so this change keeps the painted smoke through the capture.
