# Runtime movement banks

Type: task
Status: claimed

## Scope and checks

- Play an opt-in movement bank for a one-square quiet move. Keep the pinned runtime behavior for moves without a bank, captures and longer moves.
- Select by character, army and screen direction. Draw the first and last frames before the adjoining turn. Undo uses its own reverse-facing bank.
- Keep ready fallback frames during an optional bank load. A failed or late bank uses that fallback. Cancellation must free unshared queued and active loads without cancelling shared loads or accepting late results.
- Test frame boundaries, cache pressure, cancellation, replacement, capture and Undo for both armies. Keep approved art and the pinned runtime package unchanged.
- Final review plan: give each preparation ownership of its initial and optional frame loads; verify shared consumers, timeout, replacement and late callbacks; record the real capture Undo frames in both views.

## Contract and limits

A bank opts in with `kind: "movement"`, `character`, `army` and screen `facing`, using the existing frame, duration, pivot and registration fields. The scene uses it only when the move is quiet and its largest board-coordinate displacement is one tile. The runtime preloads the bank within the existing deadline and samples it once over the scene's action duration. The scene controls root travel and draws the exact first and last bank frames at the boundaries, including when a refresh skips a boundary. A late refresh can extend the move until the boundary is drawn.

For a requested movement bank, the runtime reserves the prepared rest and turn endpoints through completion or cancellation, including when the bank fails or is late. It reserves the first and last movement frames until they are drawn or the move is cancelled. A missing bank keeps the base runtime's existing unreserved fallback behavior. A cancelled or expired preparation retires its unshared initial and movement requests; shared requests continue for their other consumers.

Movement banks do not run on captures, shoves, swaps, reduced motion or longer moves. A one-square Undo can use a separately authored bank for its reverse screen direction. The runtime does not solve foot contact: art, pivots, root travel, visual joins and genuine RGBA visibility must pass separate review before a bank is selected. The 64 MiB limit covers retained decoded-image accounting, not transient browser decoder memory. Intermediate frames can be evicted under pressure.

## Verification

- `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test`: 48 runtime tests and 67 board tests pass; both type checks pass. The runtime tests cover boundary selection, fallback, cache pressure, cancellation, shared loads, timeouts, replacement and late callbacks.
- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts npm test`: 28 scene tests and 67 board tests pass; both type checks pass. The scene tests cover boundary draws, delayed refreshes, cancellation and replacement.
- `MOVEMENT_BASELINE_DIR='<pinned package>' npm run check:browser movement-runtime`: both armies and orientations pass one-square moves, Undo, longer-move fallback, captures and capture Undo. The capture check confirms the Paladin survives the pawn capture and records the first, middle and last reverse-facing movement frames during Undo. The check uses synthetic metadata and existing static image bytes.
- `npm run test:docs`: 17 files and 187 tests pass. The pinned manifest remains `05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e` and contains no movement banks.

The full suite and visual art review are separate checks. No movement art or synthetic bank is selected for production.
