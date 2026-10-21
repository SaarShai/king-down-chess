# Account status lease at page startup

Status: resolved
Type: task

## Problem

The shared mechanics check reaches `mark-firewall-expiry/web`, then reload shows
`Account play is temporarily unavailable. Try again later.` The document and
`/api/status` return 200. The page sends no private game read. The log has no
public status body, so the cause is not yet proved.

Base: `87e31ff4`. Worktree: `u05-status-lease`.
Evidence: `app-sOwSin/shared-mechanics.log` in the temporary check run folder.

## Plan and checks

1. Read the switch cache, public HTTP status and page startup path. Build a
   deterministic check through these real boundaries. Keep time under test
   control. The check must catch startup refusal while the database stays open.
2. Capture the public status body and elapsed time on the real reload failure.
   Use only bounded public data. Distinguish a closed switch, failed database
   proof and an open lease that expires in transit.
3. Apply the smallest fix only after proof. Keep all private cache and identity
   checks. Renew a proof only after a fresh database read.
4. Run the focused regression and relevant access/HTTP checks after the root
   agent grants CPU. Get an independent review. Record results before commit.

No test, build or hook starts during the root agent's exclusive check batch.
No deployment, production query or runtime archive belongs to this ticket.

## Proven mechanism and change

The deterministic check uses the real switch cache, HTTP handler and browser
status reader. It primes an open proof at time 100 ms. Status starts at 5099 ms,
one millisecond before that proof ends. A two-millisecond response delay makes
the browser reader refuse account startup, although the database stays open.
Before the fix, the check fails with `expected false to be true`.

Public status now requests a fresh database proof. Concurrent fresh requests
share the active query. Private API calls keep their five-second cache and share
the new proof. Each proof still ends five seconds after its query starts. A late
query, failed query, invalid row or late status body still closes access.

The reload diagnostic records only the two allowed public status fields and
request elapsed time. It records no headers, identity or private response body.
The original failure log has no status body. This mechanism is proved; the cause
of that specific matrix failure remains unclassified. The next required matrix
can use the diagnostic. Do not repeat the matrix only to search for this fault.

## Verification

The root agent grants exclusive CPU after its compiled check batch completes.

- Red: `KINGDOWN_TEST_FILE=src/api/http.test.ts KINGDOWN_TEST_NAME='keeps page startup open' npm test`.
  The new case fails on base code. Log: `/tmp/kingdown-u05-status-red.log`.
- Green: `KINGDOWN_TEST_FILE='{src/api/{account-access,http},src/online/{account-access,cache-policy,entry},tools/web-online-check}.test.ts' npm test`.
  Six files and 218 tests pass. Type check and 54 document tests also pass.
  Log: `/tmp/kingdown-u05-status-focused.log`.
- Database: `KINGDOWN_TEST_FILE=src/api/http.db.test.ts KINGDOWN_TEST_NAME='refreshes public status' npm test`
  with the approved disposable loopback database. One case passes; 14 cases are
  not selected. Type check and 54 document tests also pass.
  Log: `/tmp/kingdown-u05-status-db.log`.
- `git diff --check` passes.

An independent reader reviews all changed files and finds no confirmed issue
that needs a fix. The commit uses the normal type check and staged-file gate.
The root agent owns the compiled release checks and the complete mechanics
matrix.
