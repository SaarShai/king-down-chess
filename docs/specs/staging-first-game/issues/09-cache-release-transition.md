# Cache proof through a release transition

Status: implemented; native staging verification remains with the main task.

## Plan and checks

1. Reproduce startup's successful entry proof followed by a failed private-send proof with the real service-worker source and existing cache harness. Keep the active-worker eight-second deadline and all fail-closed privacy checks.
2. Distinguish replacement lifecycle events from slow installation, invalid proof and missing cache. Change the cause only after a deterministic failure is established.
3. Reproduce a confirmed replacement installation that takes 12 seconds with the actual worker source, both with an existing controller and after an uncontrolled reload. Reuse one bounded installation wait, then require fresh eight-second proof. Failed and repeated updates must stay bounded and private sends must stay closed.
4. Run focused cache, worker, access and client checks through `npm test` after the shared test lane is free. Obtain independent review. Root owns native staging diagnostics and deployment.

## Native report

Staging deployment `dpl_DsfT4jDR54iCpRWqeoPKQQtD4xi9` passes account entry after native reload of a game link, then the next private boundary shows Connecting and `Online play is unavailable until the public cache is safe`. The native lifecycle state is not captured; the desktop locks before further diagnosis. The exact native cause remains unproved.

## Reproduction and cause

The existing worker VM/cache harness runs the actual `public/sw.js` source. Entry first receives valid proof. The reloaded page remains uncontrolled. Its next private-send proof reaches the retiring active registration while a release installs. The old worker correctly refuses to purge during that installation. The new worker completes installation and activation after one second, but no page `controllerchange` occurs. The page only watches `controllerchange` and misses the old worker's `statechange`; it keeps the silent old proof until its eight-second deadline.

The deterministic red command is `KINGDOWN_TEST_FILE='{src/online/cache-policy.test.ts,tools/service-worker.test.ts}' npm test`. It reports 168 passed / 1 failed. The failure is the exact unavailable-cache message instead of the private game-read send. Log: `/tmp/kingdown-cache-transition-red.log`.

Ranked alternatives: a missed active-worker retirement explains the local event trace; a slow install does not explain this one-second completed installation; unsafe cache/proof does not explain successful real installation, activation and a separate fresh replacement-policy response. This establishes the local lifecycle defect, not the exact native staging cause.

## Fix and evidence

- Observe the proved worker's state as well as the container's controller. Invalidate an obsolete proof on lifecycle changes and obtain a fresh request/port from the replacement.
- Observe activation of the exact active registration when the page stays uncontrolled. Recheck its identity and activated state immediately before the synchronous send. A redundant controlling worker cannot authorize a send while its `controllerchange` is still pending.
- For the completed one-second replacement, retain the eight-second proof deadline, invalid-proof refusal, cache purge and private path rules. The slow-install case below extends the separate installation stage to confirmed updates. Neither fix changes service-worker source or adds polling or private-request retries.
- Tests cover real-worker rollout, retirement just after a reply, a redundant controller, the uncontrolled activation deadline and ignored late events. Existing client/access doubles now implement the real worker's EventTarget interface.
- Focused `npm test` passes typecheck, seven files / 269 tests, and 54 art checks. Include: `{src/online/{cache-policy,account-access,client,entry}.test.ts,tools/{service-worker,offline-build,web-online-check}.test.ts}`. Log: `/tmp/kingdown-cache-transition-green.log`.
- Independent read review finds no confirmed should-fix. It checks listener/port cleanup, stale proof identity, fresh replacement proof, activation wait and unchanged deadlines.

No native browser or deployment runs in this slice. The main task must verify the served artifact and native release transition when the desktop is available.

## Slow confirmed update

The later staging trace on `e0312cf7` records a cache gate deadline after 8,002 ms while the controller and active worker are activated and a replacement is still installing. The status fetch does not start. A later fresh open of the same build succeeds. This is a separate installation-budget gap from the completed one-second lifecycle case above.

The checkable plan is to extend the real-worker loop to a 12-second update, retain fresh proof for every private send, and share the existing 60-second installation bound across replacement identities. No update may restart that installation budget. A failed installation, an activation that never finishes, a silent or invalid proof, and late events must all fail closed. The private request itself must run at most once.

The new red command is `KINGDOWN_TEST_LOCK_WAIT=60 KINGDOWN_TEST_FILE='{src/online/cache-policy.test.ts,tools/service-worker.test.ts}' KINGDOWN_TEST_NAME='proves a replacement after entry|waits for an update found during proof' npm test`. It fails three cases and passes the one-second case; 175 unrelated cases are filtered out. Both controlled and uncontrolled 12-second replacements return the exact cache-unavailable error before the replacement is ready. A separate updatefound-during-proof case shows an old reply can start the send after a new installation begins. Log: `/tmp/kingdown-slow-update-red.log`.

These results distinguish the missing known-install wait from an invalid replacement policy: the real worker later installs, activates and supplies valid fresh proof. The updatefound case also distinguishes an event that starts after registration from the existing worker-retirement fix.

The gate now observes registration `updatefound` during proof and lifecycle waits. It waits for the exact installing or waiting worker through activation, or refuses a failed installation. Successive replacement identities share one monotonic 60-second installation deadline. Completion requires a fresh proof within eight seconds; a second installation during that proof uses only the remaining installation time. The final synchronous send check rejects any newly pending installation. Existing proof validation, cache deletion rules and controller/active identity checks stay in place.

Final focused verification uses `KINGDOWN_TEST_LOCK_WAIT=60 KINGDOWN_TEST_FILE='{src/online/{cache-policy,account-access,client}.test.ts,tools/service-worker.test.ts}' npm test`. It passes four files / 228 tests with no skips, full typecheck and 54 art checks. Coverage includes controlled and uncontrolled real-worker updates, updatefound during proof, failed and stalled installations, successive updates both during installation and proof, a backward wall-clock correction, late activation, and the fresh eight-second proof deadline. Registration doubles in client and account-access tests now expose the platform EventTarget interface. Log: `/tmp/kingdown-slow-update-green.log`.

Independent read review finds no confirmed should-fix. It checks the final synchronous controller/activation/no-install gate, at-most-once send, updatefound invalidation in every wait, the shared monotonic deadline, exact worker retirement, fresh proof, and listener/port/timer cleanup. The reader inspects the 228-test green evidence without rerunning checks.

This worktree starts at accepted source `0ace4ecb`; it contains no temporary staging trace. No service-worker source, engine archive, auth policy, build, browser or deployment changes belong to this follow-up. Served-artifact and native verification remain with the main task.
