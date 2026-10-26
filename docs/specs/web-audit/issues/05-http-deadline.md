# F5: Stop web calls at their deadline

Type: task
Status: resolved

## Scope

The owner requests the F5 fix from the website audit at `dab2cc41`.
The page supplies a 10-second limit. The web transport drops that limit.
A stalled request or body read can hold the write lane until reload.

## Plan and checks

1. Add tests for a stalled request and a stalled body. Run them on the old code.
2. Pass one abort signal through each web call. Stop at the supplied deadline.
3. Keep an uncertain command receipt. Check that Retry sends the same ID and input.
4. Check caller signals, reads without a page limit, retries, and deadline cleanup.
5. Run focused tests, type checks, and doc checks. Review the diff and commit F5.

The tests must fail on the old code and pass after the fix. They must prove that
the write lane is free after timeout and that a successful retry clears the receipt.
The quiet lock permits one test command at a time. Full tests, browser checks,
builds, remote services, database changes, and publication are outside this run.

## Evidence

### Cause and change

`createPageClient` supplies a 10-second timeout. `createWebTransport` drops it.
Most HTTP methods, including `command`, also have no signal parameter.

The transport now uses one deadline signal for each call. The HTTP client passes
that signal to fetch. It stays active through the body read. The deadline also
releases a call that waits for a token, cache proof, or retry delay. The client
checks the signal before a later send and stops command retries after an abort.

A timeout uses the existing connection-failure text. It frees the write lane and
keeps the command receipt. A late success or refusal cannot clear that receipt.
Retry sends the same command ID, game, revision, and action. An on-time success
or definitive refusal still clears the receipt. The transport clears its timer
and abort listener when the call ends.

### Red and green runs

All logs use the prefix `web-http-` in the audit run's scratch folder.

- Red: `KINGDOWN_TEST_FILE=src/online/runtime.test.ts KINGDOWN_TEST_NAME='ends a stalled HTTP' npm test`.
  Exit 1. Both selected tests fail on the old code. The request and body cases
  still hold the write lane at 10 seconds. The type checks pass. Log: `red.log`.
- Green: `KINGDOWN_TEST_FILE=src/online/runtime.test.ts npm test`.
  Exit 0. All 57 cases pass. They include the two red cases, all 20 HTTP dispatch
  paths, caller aborts, token and retry waits, late replies, and timer cleanup.
  Log: `runtime.log`.
- `KINGDOWN_TEST_FILE=src/online/client.test.ts npm test`: exit 0; 16 cases pass.
  Log: `client.log`.
- `KINGDOWN_TEST_FILE=src/plugin/client.test.ts npm test`: exit 0; 30 cases pass.
  Log: `page-client.log`.
- `KINGDOWN_TEST_FILE=src/plugin/queue.test.ts npm test`: exit 0; 18 cases pass.
  Log: `queue.log`.
- `KINGDOWN_TEST_FILE=src/online/cache-policy.test.ts npm test`: exit 0; 67 cases pass.
  Log: `cache.log`.
- `KINGDOWN_TEST_FILE=src/account-game/state.test.ts npm test`: exit 0; 31 cases pass.
  Log: `state.log`.
- `npm run test:docs`: exit 0; 178 cases pass. Log: `docs.log`.

Each green command also passes both type checks and the 57 standard drawing
checks that `npm test` runs after the selected file. These are focused runs.
They are not a full-suite pass.

### Caller and diff review

The source callers are the web entry, browser runtime, page client, and web-worker
fixture. The new signal parameters are optional. The route's direct invitation
preview and the fixture still use their current calls. All transport dispatch
paths now pass the signal. Initial reads with `limit: false` keep no page deadline.
The plugin still uses its SDK timeout and its existing receipt and queue paths.

The diff keeps the current HTTP methods, errors, cache boundary, and retry IDs.
It adds no dependency, database change, or game rule. Self-review finds no further
fault. An independent review and the full CI checks remain due before merge.

### Limits

The quiet lock is present. No full suite, browser check, build, database test,
remote request, push, or deploy runs. The HTTP tests use controlled fetch and body
substitutes. CI must run the full suite and browser checks later.
