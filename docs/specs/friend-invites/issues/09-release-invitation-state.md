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

## PR 164 review correction

The review found that a Create retry can return a game without its raw code.
Screen entry then made a new invitation and could exceed the request limit.
The screen now offers Make a new code without sending a request. The button
still makes a new invitation.

The Create retry test fails before the fix: screen entry sends one invitation
request. After the fix, the plugin source selection passes 424 tests; 51
database tests skip. Both type checks and 67 art checks pass. The selection is
`KINGDOWN_TEST_FILE=src/plugin/**/*.test.ts`, with no test-name filter. The
protocol check passes for 29 tools and the doc checks pass 180 tests. The logs
are in `/private/tmp/kd-rel3-invite-evidence/retry-*.log`.

## PR 164 CI repair

Status: resolved

1. Read each failed check and find each test that expects a code on entry.
2. Keep the cached Create code visible at once. Where no code is cached,
   check Make a new code and click it before a test uses the code.
3. Run the full `npm test`, `npm run test:docs` and
   `npm run check:browser plugin-ui` with the quiet and shared browser locks.
4. Check the diff, commit with the normal hook inputs and push this branch.

The checks must pass without an automatic invitation call on screen entry.
No deploy, sign-in or remote database access is in scope.

### Result and checks

The CI log has 14 test failures. Each uses the old friend-code flow. The
browser tests now click Make a new code when Create returns no code. The
shared browser check uses a returned Create code at once. It checks that
the shown code matches the reply, including on the four mobile hosts.
No product source changes are needed.

The friend test checks zero invitation calls on entry, one call after the
first click, no call on remount and one call after the next click. The
existing source tests still check cached board and chat Create replies,
and a Create retry with no code. The Android test checks the new-code
button's tap area before it makes a code.

- The full `npm test` passes 5,354 tests, both type checks and 67 art checks.
  There is no file, name or skip filter. There are 342 skipped tests.
- `npm run test:docs` passes 180 tests in 15 files.
- `npm run check:browser plugin-ui` passes in WebKit in 521.7 seconds with
  `CI=1 PLAYABLE_BROWSER=webkit PLAYABLE_CPU_CANVAS=1`, as in the CI job.
  The first WebKit run reaches the local 480-second limit in a later card
  check. The CI limit is 1,440 seconds. No limit changes are needed.
- The first local suite run stops because this worktree has no local
  package install. `npm ci` installs the locked packages here. The full
  rerun passes. No dependency file changes.
- Evidence: `/private/tmp/kd-pr164-full-test-final.log`,
  `/private/tmp/kd-pr164-docs.log` and
  `/private/tmp/kd-pr164-browser-webkit-ci.log`. The browser detail is in
  `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/rel3-invite-HT8hfi/plugin-ui.log`.

The diff review compares this change with `832470d7`. The tests cover each
failed code wait and keep the explicit code action. The hook files and
their inputs stay unchanged. The checks use the quiet and shared browser
locks. No deploy, sign-in or remote database access occurs.
