# Runtime movement banks

Type: task
Status: claimed

## Plan

First-frame review fix: reserve both movement endpoints; draw the first at the movement boundary, including after an incoming turn; release reservations on draw or interruption. Check delayed refreshes, cache pressure, existing endpoint and fallback cases, and the pinned browser flow.

Review fixes: protect ready fallback frames during optional loading; hold the movement endpoint until the scene draws it or cancels; test boundary timing, cache pressure, capture and interruption; run the focused tests and pinned browser check.

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

Movement banks do not run on captures, shoves, swaps, or with reduced motion. Undo of a capture uses the quiet reverse path when the existing Undo code can move the figure, subject to the same distance limit. A cancellation keeps the scene guard against late preparation. A bank is not a foot-contact model: the clip is stretched over the one-square action duration, and the scene retains its existing travel and lift curve. Endpoint art, pivots and registration must be checked against the turn banks before any art is selected. The runtime does not validate visual joins. During playback, cache pressure can evict intermediate frames; the sampler holds an available earlier frame or falls back to the turn pose. The first and final movement frames remain reserved until the scene draws or cancels them. The prepared turn and rest endpoints stay reserved through completion or cancellation. Large banks can fail preparation under the existing decoded-pixel budget and use the ready fallback.

## Verification

- `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test`: 34 focused runtime tests and 67 board tests pass; type checks pass. The focused test checks the one-square bank and the long-move turn fallback, including no movement frame loads for the long move.
- `MOVEMENT_BASELINE_DIR='/Users/za/Documents/king down chess (new)/app/public/character-runtime' npm run check:browser movement-runtime`: both armies pass one-square and three-square Paladin moves and Undo in normal and flipped views. The one-square moves use synthetic banks; the three-square moves use the baseline fallback. The check intercepts the manifest and uses existing pixels, not candidate art. Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/animation-movement-integration-20261029-G39cdB/movement-runtime.log`.
- The baseline manifest has 468 banks and no movement banks. Its SHA-256 is `05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e`.
- In the prior implementation check, the runtime package tree had 5,256 files. A sorted path-and-bytes SHA-256 was `06f26c6424f3966932764f201455cab1ecff9409a471256d20d9d70bbfcc0eea` before and after that check.

### Independent review fixes

- `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test`: 36 runtime tests and 67 board tests pass, with both type checks. The new test loads 16 MiB frames until the 64 MiB cache is under pressure, holds a seventh movement frame past the deadline, checks the ready turn and rest fallback, releases the late frame, and checks the fallback again. A separate cancellation test proves four new 16 MiB frames fit after the pending movement reservation is released. Both checks keep reported peak cache use at or below 64 MiB.
- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts npm test`: 20 scene tests and 67 board tests pass, with both type checks. The movement scene test straddles the action boundary with 16 ms refreshes: it sees the last frame before completion when no return turn exists, then sees the last frame and return turn on the reverse move. The interruption cases cancel or replace a move while its movement image is held, release the image, and check that the old action does not take over.
- `MOVEMENT_BASELINE_DIR='/Users/za/Documents/king down chess (new)/app/public/character-runtime' npm run check:browser movement-runtime`: both armies and orientations pass real one-square moves and Undo, including first, middle and final synthetic movement frames; three-square moves and Undo use the baseline fallback; real captures use the attack bank and never use a movement bank. The browser uses the pinned manifest and existing image bytes. Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/movement-bank-quiet-20261029-IYLFhj/movement-runtime.log`. The initial capture check assumed the Paladin always leaves the board and timed out; the corrected check accepts either legal result.
- `npm run test:docs`: 17 files and 186 tests pass.

The checks do not prove art quality or visual joins, and no full test suite or art review ran. The browser check samples real refreshes; the deliberately straddled boundary and interruption use the real scene with a controlled test clock. The cache budget covers retained decoded-image accounting, not a measurement of transient browser decoder memory.

### First-frame review fix

- Both independent reviews found that a refresh could cross the start of movement and sample a later frame. Cache pressure could also evict the first frame after preparation. The scene now holds the start boundary for one draw, before travel begins, and releases the first-frame reservation after that draw. The final frame stays reserved until its own draw. Cancellation, replacement and stale preparation release both reservations.
- `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test`: 37 runtime tests and 67 board tests pass; both type checks pass. A pressure test uses 16 MiB in-memory images to check both reserved endpoints and their release; peak retained decoded-image accounting stays at or below 64 MiB.
- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts npm test`: 26 scene tests and 67 board tests pass; both type checks pass. Controlled clocks check a frame change before the first refresh, with and without an incoming turn. A 600 ms refresh skips the full nominal action and still draws the first and final frames in order. Cancellation and replacement before the first draw release reservations under pressure. The existing late-load, final-frame, capture and Undo coverage remains in the focused and browser checks.
- `MOVEMENT_BASELINE_DIR='/Users/za/Documents/king down chess (new)/app/public/character-runtime' npm run check:browser movement-runtime`: pass for both armies and orientations, including quiet moves and Undo, long-move fallback and captures. The browser uses existing image bytes and synthetic metadata. Log: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/movement-bank-quiet-20261029-0AXguu/movement-runtime.log`. Vite reports dynamic-import, Node externalization and public-asset warnings.
- `npm run test:docs`: 17 files and 186 tests pass. `git diff --check` passes.
- The first pressure-test run failed because the last sampled image kept the cache's active-frame preference after its reservation was released. The corrected test moves that preference to another image before it checks release. The first scene-test run failed on two expected timestamps because the new start hold extends the move; the corrected checks pass.

No full test suite, art review, or capture-Undo browser check ran. No image or sequence files were made. A delayed refresh can extend the move by the delay to its first draw; this preserves the start frame and the full action interval.
