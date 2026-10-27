# Drain the old server before the new server starts

Status: resolved
Type: task

## Scope and checks

Stop incoming game requests, let all old-server requests finish, then enable the new server. Use this order for the first release and for restore. Keep the SQL text unchanged.

Add order tests that fail before the fix and pass after it. Run the full `npm test` and `npm run test:docs`.

## Evidence

The release re-review found that the old preview can show a named invitation to a third account. The two new order cases fail on the old guide and pass with the fix. All inline SQL and code text matches the prior guide.

The first full test run failed because this worktree had no local packages. After `npm ci`, `npm test` passed 5,362 tests and 67 artwork checks. It skipped 342 tests. `npm run test:docs` passed 183 tests. The full test used the shared test and browser locks; the quiet lock was absent.
