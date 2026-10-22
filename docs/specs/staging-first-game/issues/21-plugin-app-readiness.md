# Diagnose three source-board interaction readiness failures

Status: three selected cases pass; independent final review clear. Root owns the full-suite gate.

## Plan and scope

1. Reuse the clean Profile worktree and apply accepted bootstrap/integration fixture commit `52c16b1acb23ec8fd839276e4d94b19c349d9754` first. Own only `tools/plugin-app.test.ts` and this ticket. Do not change product code or the shared harness without coordination.
2. Keep the full-suite red evidence: failed-polls choices `0` versus `2`, different-solo resume choices `0` versus `2`, and initial power focus `false` versus `true` before the presence update. Add bounded test diagnostics for the current view, transport/store state, disabled coin and choices/focus at those assertions. Do not assume one cause for all three.
3. Wait for the CPU grant, then run only these three cases through `npm test` using the supported file/name filters. Fix the established readiness or fixture cause while preserving poll thresholds, resumed-game identity, exact choices and before/after presence focus assertions. Add no sleeps or wider timeouts.
4. Obtain independent read review and run the selected checks plus normal hooks in the granted lane. Root owns the cumulative full-suite gate. Do not repeat the whole 136-case browser suite without a new need.

## Source observation

`board[aria-busy="false"]` is set by `src/plugin/board-view.ts` when artwork is ready. It does not describe the separate server draft request. With no source-page engine identity, account games use server preview; `board.ts` blocks move selection while preview is absent or pending. The power coin remains readable: the initial disabled-coin hypothesis is incorrect and is withdrawn. The three failures happen before the tested poll sequence, resumed selection or presence update has begun. Diagnostics must distinguish a pending valid preview from a failed preview, wrong identity or actual focus defect.

No test, build or hook runs during preparation. Product rules, UI controls, shared harness, archives, schema and deployment are outside this task.

## Diagnostics and correction

The accepted prerequisite commits apply without conflicts: bootstrap/test integration `52c16b1a` as `d1ef5ab1`, then remote draft cleanup `5df2b4e5` as `3b38465b`. These are existing parent fixes, not changes made by this task.

The first diagnostic run keeps the original assertions and passes all three selected cases. The full-suite failures are therefore timing-sensitive; this run is not red evidence. A second bounded probe uses the existing host's one-reply `kingdown_preview` hold in each affected case. It reproduces both missing-choice failures: zero choices, one transport call still in flight, current ready view, connected page, no mount/write/pending command, no error and artwork/animation already ready. Selection ran before the valid draft response. The focus case passes with its preview held. That disproves a general disabled-coin cause and does not reproduce the full-suite initial-focus failure.

The final test diff is three calls to the existing `settled(page)` helper, plus one explanation: after artwork on the two keyboard cases, and after the seeded power coin mounts but before identity capture, presence injection and focus. This establishes a settled source-board precondition. It does not claim a product startup-focus bug is repaired. The original two-choice, poll threshold, stale/error/retry, game identity, privacy and immediate initial/post-presence focus assertions remain unchanged. There is no focus polling/refocus, passive snapshot helper, permanent held-preview fixture, sleep, timeout increase, product or shared-harness change.

All three runs use this bounded selection:

```
KINGDOWN_TEST_LOCK_WAIT=60 KINGDOWN_TEST_FILE=tools/plugin-app.test.ts KINGDOWN_TEST_NAME='keeps two failed polls silent|clears a failed read when Your games resumes a different solo board|keeps focus on a power coin through a presence update' npm test
```

Logs are under outer `evidence/staging-next-ticket-candidates/u09-plugin-app-readiness/`: `diagnostic.log` passes 3; `held-preview-red.log` fails 2 and passes the focus case; `focused-green.log` passes 3 after the final waits. Each run filters out 133 unrelated cases. Both green runs include full typecheck and 54 art checks. The final Vitest selection takes 8.35 seconds. No 136-case file or full suite is repeated here.

The parent's independent final read confirms the four-line test diff preserves the assertions and immediate focus checks. Normal hooks follow the focused green in the granted lane.
