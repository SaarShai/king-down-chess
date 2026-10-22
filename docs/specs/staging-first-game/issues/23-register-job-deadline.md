# Reproduce a pending native service-worker registration

Status: real-browser red and controls establish the queued-job mechanism. The reviewed minimal fix, source suites and stronger held-before-release browser regression pass. Normal hooks and final compiled cache takeover remain open.

## Observed signal

Staging `fc8670c3` refuses its first reload before Retry. Safe support fields: phase `register`, reason `deadline`, elapsed 8,001 ms, controller `activated`, active/installing/waiting `unknown`, register_failed and update_failed false. No private status fetch starts. Root retains the native screenshot in outer `evidence/staging-shared-mechanics/web-febb-first-update-register-deadline.png`.

## Checkable plan

1. Serve the actual `public/sw.js` and existing compiled web-worker private-client fixture on loopback. Install and prove a safe active controller first.
2. Hold the HTTP response for a native service-worker update job, then call the real private client. Do not mock or delay the registration API. Capture the exact support signal, the old controller state and private-send count. Release the HTTP job within 12 seconds and verify the deadline cannot cause a late private send.
3. Add a narrow `npm test` wrapper and named browser-check entry for the same loop. Keep all cache-purge, proof and private-send guards intact. A failure with the wrong phase does not establish this bug.
4. Report the first real result and ranked, falsifiable alternatives before proposing a product fix. Root owns live verification and deployment. No product fix, timeout increase or bypass belongs to this diagnostic phase.

## Verification

The CPU lane is granted only for this focused diagnosis. Keep the checkout unchanged while a runner is active.

First red: `KINGDOWN_TEST_FILE=tools/cache-registration.test.ts npm test`, log `/tmp/kingdown-register-native-first.log`. Typecheck passes; one real Chromium case fails (11.52 seconds). The real native update fetch blocks a later native registration. The exact safe trace reports phase `register`, reason `deadline`, elapsed 8,003 ms, controller `activated`, registration states `unknown`, both failure flags false. Private sends remain zero after the blocked job is released. The test expects safe eventual continuation and receives status 503 / `UNAVAILABLE` instead.

Ranked predictions before the next probe:

1. A registration job waits behind the native script-fetch job. Releasing that same-byte response before eight seconds should remove the refusal.
2. A replacement installation causes the wait. The same-byte response and no new install distinguish this from replacement activation; the first loop already reproduces with unchanged worker bytes.
3. The active worker cannot prove or purge safely. A fresh private boundary after the held job completes must still fail if that is the cause.
4. The browser job is permanently stuck. Releasing the response and awaiting a fresh explicit native update must fail if the job cannot recover.

Controls: the same command with the 250 ms and 12,000 ms cases produces one pass / one failure; `/tmp/kingdown-register-native-controls.log` (13.92 seconds). The short native script response passes. The held same-byte update reaches the exact trace again at 8,001 ms. After release, a new explicit private boundary proves the same real active worker and succeeds; the failed gate never sends late. Typecheck passes. No fake registration promise or changed worker bytes are used. This proves a local registration-job queue defect; the cause of the native staging network delay remains unproved.

## Proposed fix for review

Read the root registration with native `getRegistration('/')` before awaiting a register job. Compatible existing metadata enters the current installation/proof path with only the existing nonblocking update. Retain awaited registration when no root registration exists or its configuration needs repair. Keep the current eight-second metadata/proof limits, one 60-second confirmed-install budget, proof validation, controller/updatefound invalidation, final synchronous send check and fail-closed empty-cache path. Do not increase a deadline or retry private requests.

Root approves a simpler plan: compatible root scope, newest worker `/sw.js` and `updateViaCache: none` reuse the existing registration directly. Only the existing nonblocking `update()` runs; do not also register on every send. Absent or incompatible metadata uses awaited native registration. Lookup failure uses the same guarded registration fallback. Two ended checks prevent late metadata or registration from starting work after refusal. Worker type is not exposed and is not guessed. The existing installation/proof loop and adjacent send guard are unchanged.

The new lookup units first fail meaningfully (6 failed / 5 passed; 56 filtered out), `/tmp/kingdown-register-lookup-unit-red.log`. An earlier missing test-location setup is corrected before this meaningful red. Coverage includes absence, lookup throw/rejection, late resolution, incompatible scope/script/cache mode, invalid/silent policy proof, pending update and updatefound invalidation. Full focused green then passes 5 files / 251 tests, typecheck and 54 art checks: `KINGDOWN_TEST_FILE='{src/online/{cache-policy,account-access,client}.test.ts,tools/{service-worker,cache-registration}.test.ts}' npm test`, `/tmp/kingdown-register-lookup-green.log`.

The named `npm run check:browser cache-registration` wrapper also reproduces the original exact register-deadline refusal in 11.2 seconds, with an unchanged-checkout guard; `/tmp/kingdown-register-native-wrapper-red.log`. The green loop must additionally show the private send completes in less than eight seconds while the 12-second native script fetch is still held, before the fixture releases it. Do not mistake waiting out the held fetch for this fix.

The stronger native regression passes both cases: `KINGDOWN_TEST_FILE=tools/cache-registration.test.ts npm test`, `/tmp/kingdown-register-held-green.log`; full typecheck and 54 art checks also pass. Root and the independent mechanics reader find no confirmed should-fix in the product change, compatibility/failure tests or held-before-release assertion. Final named checks run only after a normal clean commit, against the exact accepted recovery output. Their source and artifact receipts belong in outer `evidence/staging-next-ticket-candidates/u09-register-deadline`.
