# Cache proof through a release transition

Status: implemented; native staging causality and verification remain with the main task.

## Plan and checks

1. Reproduce startup's successful entry proof followed by a failed private-send proof with the real service-worker source and existing cache harness. Keep the active-worker eight-second deadline and all fail-closed privacy checks.
2. Distinguish replacement lifecycle events from slow installation, invalid proof and missing cache. Change the cause only after a deterministic failure is established.
3. Add a minimal regression and run focused cache, worker, access and client checks through `npm test`. Obtain independent review. Root owns native staging diagnostics and deployment.

## Native report

Staging deployment `dpl_DsfT4jDR54iCpRWqeoPKQQtD4xi9` passes account entry after native reload of a game link, then the next private boundary shows Connecting and `Online play is unavailable until the public cache is safe`. The native lifecycle state is not captured; the desktop locks before further diagnosis. The exact native cause remains unproved.

## Reproduction and cause

The existing worker VM/cache harness runs the actual `public/sw.js` source. Entry first receives valid proof. The reloaded page remains uncontrolled. Its next private-send proof reaches the retiring active registration while a release installs. The old worker correctly refuses to purge during that installation. The new worker completes installation and activation after one second, but no page `controllerchange` occurs. The page only watches `controllerchange` and misses the old worker's `statechange`; it keeps the silent old proof until its eight-second deadline.

The deterministic red command is `KINGDOWN_TEST_FILE='{src/online/cache-policy.test.ts,tools/service-worker.test.ts}' npm test`. It reports 168 passed / 1 failed. The failure is the exact unavailable-cache message instead of the private game-read send. Log: `/tmp/kingdown-cache-transition-red.log`.

Ranked alternatives: a missed active-worker retirement explains the local event trace; a slow install does not explain this one-second completed installation; unsafe cache/proof does not explain successful real installation, activation and a separate fresh replacement-policy response. This establishes the local lifecycle defect, not the exact native staging cause.

## Fix and evidence

- Observe the proved worker's state as well as the container's controller. Invalidate an obsolete proof on lifecycle changes and obtain a fresh request/port from the replacement.
- Observe activation of the exact active registration when the page stays uncontrolled. Recheck its identity and activated state immediately before the synchronous send. A redundant controlling worker cannot authorize a send while its `controllerchange` is still pending.
- Keep the original eight-second deadline, separate first-install budget, invalid-proof refusal, cache purge and private path rules. No service-worker source change, polling, blind retry or timeout extension is needed.
- Tests cover real-worker rollout, retirement just after a reply, a redundant controller, the uncontrolled activation deadline and ignored late events. Existing client/access doubles now implement the real worker's EventTarget interface.
- Focused `npm test` passes typecheck, seven files / 269 tests, and 54 art checks. Include: `{src/online/{cache-policy,account-access,client,entry}.test.ts,tools/{service-worker,offline-build,web-online-check}.test.ts}`. Log: `/tmp/kingdown-cache-transition-green.log`.
- Independent read review finds no confirmed should-fix. It checks listener/port cleanup, stale proof identity, fresh replacement proof, activation wait and unchanged deadlines.

No native browser or deployment runs in this slice. The main task must verify the served artifact and native release transition when the desktop is available.
