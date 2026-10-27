# Keep invitation state through Create and Join

Status: resolved
Type: task
Spec: [Online friend invitations](../README.md)

## Scope

Fix release-review findings 3 and 4. Keep the invitation from Create before
the friend screen opens. Use the invitation ID when a Join preview has no code.
Keep the shared web transport and protocol check in step.

## Plan

1. Add regression tests. Show that each fault fails on the branch base.
2. Keep the returned invitation in page memory before routing. Send the ID
   from a preview with no code through the existing Join tool.
3. Run the relevant tests, protocol check and doc checks with the shared locks.
4. Check the diff, commit, push and open a PR into `staging/first-game`.

## Acceptance checks

- Create shows its returned code with no second invitation write, including
  when a second write would exceed the shared request limit.
- A host preview with an invitation ID and no code can finish Join.
- Code joins keep their current request. Web joins accept the same ID input.
- The tests fail before the fix and pass after it.
- The commit and push hooks run with their normal inputs.
- No deploy, sign-in or remote database access occurs.

## Result

The page keeps the invitation from a current Create result before it routes
to the friend screen. Board and chat results use the same cache step.
The friend screen shows that code without a second invitation write.

Join sends the preview's invitation ID when its code is empty. A preview
with a code keeps the code request. The web transport and client types
also accept an invitation ID. The server already accepts this input, so
the tool schema and `tools/plugin-protocol-check.ts` need no change.

## Verification

- Before the fix, both Create cases fail with no cached invitation.
  Both web ID cases send `code: "undefined"`. The Join screen sends
  `code: ""` for an ID preview. The code Join control passes.
- After the fix, `npm test` passes 268 tests in six selected files and
  67 art checks. Both TypeScript checks pass. Selection:
  `KINGDOWN_TEST_FILE='{src/plugin/{app,server,invite}.test.ts,src/plugin/screens/lifecycle.test.ts,src/online/{runtime,client}.test.ts}'`.
  No test-name filter applies to this pass.
- `npm run plugin:check:protocol` passes for all 29 tools.
- `npm run test:docs` passes 180 tests in 15 files.
- Logs are in `/private/tmp/kd-rel3-invite-evidence/`:
  `regressions-before.log`, `join-before.log`, `relevant-tests-final.log`,
  `protocol.log` and `docs.log`.
- Each command checks the quiet lock and holds the shared browser slots
  and test lock. The hooks and their inputs remain unchanged.

## Review

Release-review findings 3 and 4 define this fix. The diff review checks
that the cache write follows the current-job check and precedes routing.
The existing code request stays in place to keep its attempt counting.
No new tool field, database change or dependency is needed.

This is a selected test pass. The full test suite and browser checks do
not run for this patch. No deploy, sign-in or remote database access occurs.
