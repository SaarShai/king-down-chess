# Keep bounded cache-safety failure evidence

Status: source verified; live classification pending

## Evidence and scope

The first website reload after the accepted `e9b77c79` staging release shows the public-cache safety refusal. Its selected game URL stays intact. No Try again is counted as a fresh-open pass. The earlier observed installation-budget fault is repaired, but this new failure has no classification. Empty application console capture cannot establish a worker cause.

All page-side failures currently become the same error. Worker-side cache verification can reject without sending proof; the page cannot infer that internal cause. Add durable, bounded support evidence at the existing source guard, rather than another speculative behavior change or a browser-internal probe.

## Plan and verification

- Keep all proof, identity, installation-budget, deadline, cache and private-send behavior unchanged.
- Give the existing cache error a finite phase/reason support code and a fixed failure snapshot. Print one serialized warning per refused operation, with only elapsed time, worker state enums and registration/update failure flags.
- Append the short support code to the existing visible error message. Do not log worker IDs, URLs, nonces, cache keys, request data, headers, account/game data or raw errors.
- Prove failure classification and field bounds, no warning on success or downstream send failure, and unchanged cleanup/deadlines through the focused cache tests. Add no negative worker protocol yet.
- Run focused red/green through `npm test`, obtain parent review, and commit with normal hooks. The parent owns staging publication and normal-console/visible-error inspection. No deployment is part of this candidate.

## Outcome

`CachePolicyUnavailable` now carries the fixed failure snapshot and a short `CACHE_<PHASE>_<REASON>` code. The visible refusal includes that code. One `[King Down cache safety]` warning serializes the same allowlisted snapshot. Unexpected worker-state strings become `unknown`; state-read or console failures cannot prevent refusal. Registration and update failures stay boolean flags, including a synchronous update exception. Successful sends and downstream send failures produce no cache warning.

- Focused diagnostic red: five cases fail and one passes, with 48 filtered. The existing refusal lacks the requested snapshot/code. Log: `/tmp/kingdown-cache-failure-evidence-red.log`.
- Cache policy, account access and online client: three files / 106 tests pass without skips, with typecheck and 54 artwork checks. Log: `/tmp/kingdown-cache-failure-evidence-green.log`. An initially named nonexistent worker-test path selects no file; no worker coverage is claimed from this command.
- The actual `tools/service-worker.test.ts` then passes all 131 tests without skips, with typecheck and 54 artwork checks. It retains the real-worker handshake, cache/privacy and slow-update assertions. Log: `/tmp/kingdown-cache-failure-evidence-worker.log`.
- The final full `src/online/cache-policy.test.ts` passes all 56 tests without skips after adding both synchronous and rejected update-error classification checks, with typecheck and 54 artwork checks. Log: `/tmp/kingdown-cache-failure-evidence-final.log`.
- Parent read review finds no should-fix. The tests use `KINGDOWN_TEST_FILE` and `npm test`; no build, browser run or deployment occurs here.

The parent later opens a separate fresh website tab successfully, without Try again; the first failed tab remains untouched. The existing actual ChatGPT game still shows the same six actions. This supports an update/first-load timing boundary but does not establish its cause. Native fresh ChatGPT verification remains blocked by the locked Mac. These diagnostics expose where the next refusal occurs; they do not repair or relax the safety gate.
