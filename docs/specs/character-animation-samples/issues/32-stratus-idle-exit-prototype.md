# Stratus selected-idle exit prototype

Status: ready for merge; quiet moves only

## Plan

1. Trace the painted pose, asset cache, selection and move lifecycle on the bounded-preparation branch.
2. Implement a source-only quiet-move exit only if the exact painted body and its complete path can be held safely within the cache budget.
3. Check both armies, idle banks, timing, asset states and cancellation in focused tests and a registered game check. Keep captures and missing-art fallback open.

## Candidate

When a Stratus king is selected, the runtime loads both idle banks. It permits a raised pose only when every source image is resident and pinned within the decoded cache budget. A cold, missing, slow or oversized bank stays at rest. The last body actually sent to the draw call is retained when selection clears. A matching quiet move holds that body while its turn prepares. If preparation succeeds and its first frame joins the pinned rest image, the scene follows the shortest existing idle-frame path to rest over 200 ms and starts the turn. A king already at rest does not wait for an exit. The body uses the original image, pivot and scale; the existing hover effect keeps its own clock. No crossfade or deformation is added.

The scene checks square, piece, registration and untransformed base pose before using the retained body. A lifted, fallen or otherwise transformed pose takes the existing path. Selection or position changes that remove or replace the selected king, Undo, reduced motion and disposal release the pins and invalidate pending work. A refresh that keeps the same selected Stratus retains the painted body and its reservation, including before the next frame. A selection or design change during an exit cancels that exit before it releases the pins. A late image cannot reserve a former selection. The cache keeps the pinned images while other images load; effect and smoke allocations must also fit. A smoke load delayed by the pins retries on release. The memory figure below is the runtime's decoded-cache accounting, not a measurement of browser process memory or transient decoder allocations.

King captures continue to use the legacy king body. If turn preparation times out or fails, the existing bounded legacy fallback is used; its body join remains open. A bank that has not finished loading within the selection's bounded reservation stays at rest for that selection and can retry on a new selection. A busy or throttled browser can delay animation frames. This prototype does not solve those cases or establish owner acceptance.

## Checks

- `KINGDOWN_TEST_FILE=src/render/character-runtime.test.ts npm test`: 30 runtime cases, type checks and 67 existing node checks passed. Added cases check source frames under cache pressure, stale reservation, disposal and smoke retry.
- `KINGDOWN_TEST_FILE=src/render/scene-load.test.ts npm test`: 17 scene cases, type checks and 67 existing node checks passed. Neither focused run is a full-suite pass.
- `npm run check:browser stratus-idle-exit`: 25 Chromium game cases passed. Twelve cover early, raised-middle and late poses in each idle bank for both armies, checking the drawn-body metadata, original frame order, exact rest join, pivot, scale, base foot and Undo. The observed exit-clock-to-turn intervals were 201.3–218.9 ms. Four cases cover a refreshed position or other king design followed by a newly painted idle for both armies. Four more call the game move handler in the same task as those refreshes, before another paint, and check that the exit starts from the visible body. Five other cases cover a cold idle and late image, Undo during exit, Undo during held turn preparation and a selection change, an already-resting king, and reduced motion. Maximum accounted decoded cache was 26,738,688 bytes. Report: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/stratus-idle-exit-Y7lITl/`.
- `npm run test:docs`: 183 cases passed.
- `npm run check:browser character-prepare`: passed the existing bounded-fallback and late-image regression. Report: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/stratus-idle-exit-T7XnLt/`.
- On the integration branch, the 25-case `stratus-idle-exit` check passed again. The `character-prepare`, `character-runtime`, `effects-states` and `stratus-registration` browser checks also passed together. An independent reader reviewed the integrated change and found no outstanding should-fix issue.

The game check uses the read-only 468-bank candidate manifest, SHA-256 `05ff4c215cd601486863cc00efbf6c080e6fa8fcb29c410380da6d8e98807f9e`, via a temporary link in the worktree. It measures reported game frames, not continuous perceptual playback. No source artwork, catalog, runtime bundle or deployment changed. The owner gave advance approval for this work. A continuous visual review at normal and quarter speed remains unverified; these checks do not establish perceptual smoothness or that the owner personally viewed it.

## Selection lifecycle correction

Independent review found that a position sync or king-design update released a selected Stratus reservation without starting a new one. The scene test reproduced the frozen idle for both updates before the fix. A second test found that releasing the reservation also lost the visible raised body when a move followed an unchanged refresh before the next paint. The scene now retains the reservation when the selected Stratus and its design stay unchanged, and starts a fresh reservation only for a valid current Stratus when they change. A generation check rejects late results from a former selection. Focused tests cover changed and removed pieces, cancellation and late images. The game check covers both refreshes, both armies and a move before the next paint.
