# Runtime movement banks

Type: task
Status: claimed

## Plan

1. Inspect the runtime, scene move and Undo paths, and the pinned asset manifest.
2. Add an opt-in authored movement bank path with the existing fallback.
3. Test timing, registration, load failures, both armies and real game Undo with synthetic assets.
4. Check the baseline asset hashes and record the result and any limits.
5. Limit movement banks to one-square quiet moves using scene coordinates. Test a longer move and its fallback in the runtime and browser.

## Verification

- Focused repository tests cover selection, frame edges, pivots and failures.
- A browser check drives both armies through a move and Undo with intercepted synthetic banks.
- The pinned manifest and runtime assets retain their original hashes.
- No trial art is selected, and no dependency or baseline asset changes.

## Contract and limits

A bank opts in with `kind: "movement"`, a `character`, an `army`, and the screen `facing`. It uses the existing frame, duration, pivot and registration fields. The scene measures the start and target foot coordinates in board tiles. Only a quiet move whose largest horizontal or vertical distance is exactly one tile can use a movement bank. The runtime picks an exact match and loads every frame within the existing move preparation deadline. A failed or late load uses the existing turn pose. Longer moves use that same turn-pose fallback and do not load movement frames. The bank plays once across the scene's action duration, including the first and last frame. The scene still controls the root path and its duration. Undo is a new move in the opposite screen direction and uses the same one-square limit.

Movement banks do not run on captures, shoves, swaps, or with reduced motion. Undo of a capture uses the quiet reverse path when the existing Undo code can move the figure, subject to the same distance limit. A cancellation keeps the existing scene guard against late preparation. A bank is not a foot-contact model: the clip is stretched over the one-square action duration, and the scene retains its existing travel and lift curve. Endpoint art, pivots and registration must be checked against the turn banks before any art is selected. The runtime does not validate visual joins. Cache pressure during playback can evict frames; the existing sampler holds an available earlier frame or falls back to the turn pose. Large banks can fail preparation under the existing decoded-pixel budget.

## Verification

- `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test`: 34 focused runtime tests and 67 board tests pass; type checks pass. The focused test checks the one-square bank and the long-move turn fallback, including no movement frame loads for the long move.
- `MOVEMENT_BASELINE_DIR='/Users/za/Documents/king down chess (new)/app/public/character-runtime' npm run check:browser movement-runtime`: both armies pass one-square and three-square Paladin moves and Undo in normal and flipped views. The one-square moves use synthetic banks; the three-square moves use the baseline fallback. The check intercepts the manifest and uses existing pixels, not candidate art. Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/animation-movement-integration-20261029-G39cdB/movement-runtime.log`.
- The baseline manifest has 468 banks and no movement banks. Its SHA-256 is `05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e`.
- In the prior implementation check, the runtime package tree had 5,256 files. A sorted path-and-bytes SHA-256 was `06f26c6424f3966932764f201455cab1ecff9409a471256d20d9d70bbfcc0eea` before and after that check.

The browser check does not prove art quality, exact real-time frame boundaries, captures, interruption, or reduced motion. The unit tests check the exact frame boundaries and image failure fallback. No full test suite or art review ran.
