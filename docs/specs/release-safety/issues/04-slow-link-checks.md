# Release safety: check files over a slow link

Type: task
Status: resolved

The owner asks for this change on `staging/deploy-slow-link`. The release checks use a 15 s request limit. The live check starts all requests at once. A slow link can stop a correct release.

## Plan

1. Read the release callers and the deploy tests. Keep their arguments and checks.
2. Use `DEPLOY_REQUEST_TIMEOUT_MS` in both tools, with a 60000 ms default. Use at most 8 requests at once. On a timeout or network fault, repeat at most twice after a short pause. Log each repeat. Keep HTTP and byte checks outside the request retry.
3. Extend `tools/deploy.test.ts` with local server cases. Check a slow response, a dropped connection, an HTTP fault, the retry limit, and the 8-request limit. Keep the live propagation limit. Apply it to active requests and queued probes. Zero keeps the single-pass mode.
4. Run `KINGDOWN_TEST_FILE='tools/deploy.test.ts' npm test` and `npm run typecheck`. Review the diff and commit with the hooks unchanged. Do not push or publish.

## Pass criteria

- The local slow response passes within the request limit.
- A network fault passes on a repeat. Three faults stop the tool. Each repeat has a log line.
- An HTTP fault has no request retry and keeps its failure message.
- At most 8 requests are open at once in each tool.
- The selected test file and type checks pass. The report gives each time bound.

## Evidence

- `KINGDOWN_TEST_FILE='tools/deploy.test.ts' npm test`: exit 0. The selected file passes all 189 tests in 196.60 s. The runner also passes its 70 standard artwork tests. The full test suite does not run.
- `npm run typecheck`: exit 0. Both TypeScript checks pass.
- `git diff --check`: exit 0.
- Both tools pass a response that takes 16 s with the default request limit. Both pass after a dropped connection. Both stop after three network faults or timeouts. Each repeat has one log line.
- The HTTP 503 case has one request and keeps the old failure message. Each tool reaches a peak of 8 open requests with 24 test assets. Each test server uses `127.0.0.1`.
- The live check stops at a 250 ms whole-check limit while requests are slow and more probes are in the queue. It starts at most 8 requests. The propagation test uses 7 s so that its 5 s pause stays inside the limit.

## Time bounds and limits

`DEPLOY_REQUEST_TIMEOUT_MS` defaults to 60000 ms in both tools. The value must be a whole number from 1 to 2147483647. Each request has at most three attempts and pauses of 1 s and 2 s. The request limit covers the headers and the body.

When the server gives no answer from the first read, the asset tool stops within `3 * 60 + 1 + 2 = 183 s` of network wait. The live check stops at `DEPLOY_LIVE_TIMEOUT_MS`, which still defaults to 180000 ms. This limit includes active requests, queued probes and pauses. Add small local start and report time to these bounds. With a zero whole-check limit, the live check runs one pass; its network wait is at most `ceil(probe count / 8) * 183 s` with the default request limit.

The byte, type, route and API checks stay outside the request retry. HTTP faults have no request retry. The live check still waits for propagation within its whole limit. A slower link can still exceed either limit. The owner can increase the request limit and the existing whole-check limit when needed.

## Review and scope

The final diff keeps both tools as separate scripts. A shared helper needs more imports and test fixture changes. The worker pool stores results by probe index, so each old check still reads its own result. No dependency or caller changes. No real deploy, live or staging request, branch push, or pull request.

## Port to main

PR 262 merges this change into `staging/first-game` only. A later PR applies the same two tools, `tools/deploy.test.ts` and this ticket to main, with no other change. On base eb5cacac: `KINGDOWN_TEST_FILE='tools/deploy.test.ts' npm test` exits 0 with all 189 selected tests; `npm run typecheck` exits 0. No independent review runs, as the owner directs.
