# 14 · Submission gaps: E5

Status: resolved

## Scope

Build E5 from ticket 14. Serve a committed token file at
`/.well-known/openai-apps-challenge`. Do not build F8 or B4.
The owner approves this scope on 2026-10-16: "Yes, the cut".

## Plan and checks

1. Keep the file in the site build. Add its plain-text header to the site routes.
2. Check status 200, no redirect, `text/plain`, and the exact file bytes.
   Skip the check when the file is absent.
3. Add tests with temporary files. Add the owner step to checklist row 52.
4. Run `npx tsc --noEmit`, `npm test`, and the local Vercel check.
   Run `plugin-ui` and `plugin-ui-http` on the M1. Keep all time limits.
5. Check the diff and commit on `claude/sub-e5`.

## Progress

- The Vite build copies the public folder with `cpSync`, which keeps dot folders.
- `vercel.json` has no headers or rewrites. The server build writes the site routes.
- This branch has no submission checklist. Use the packet branch's checklist as
  the source. Change row 52 only.
- The M1 identity check passes.

## Checks

- `npx tsc --noEmit`: pass.
- The local Vercel build and check pass without a token file.
- A second Vercel build and check pass with a temporary token file. The static
  file has the same bytes. Its one matching route adds `text/plain` and has no
  destination or redirect. `vercel.json` stays empty.
- `npm test`: pass. 164 files; 2,535 tests pass; 8 tests skip. All 50 artwork
  checks pass. The 14 new E5 tests pass. No time limit changes.
- The M1 has code commit `715571991fc3184f22c9fdf723eafd2d4b85436d`.
  `plugin-ui` passes in 98.4 s. Its run folder is `kd-sub-e5-mMYM8P`.
- The first `plugin-ui-http` check fails at the settings remount assertion in
  `tools/plugin-ui-check.mjs:848` after 80.1 s (`kd-sub-e5-KcoFEB`). The check
  does not wait for the settings write before it remounts. Its code and the
  settings code match the parent commit. The page still shows `Connecting…`
  when the assertion runs. This can be a timing fault; E5 does not change this
  code. The check remains failed.
- Extra HTTP retry: canceled before launch after over an hour in the M1
  queue. At cancellation, it has one sleep child, no browser child, and no
  lock. The settings screen and its check stay outside this E5 build.
- E5 is built and its checks pass. The full browser gate is not clear because
  the HTTP settings assertion fails. Keep this ticket open for that result.
- Local test log: `/tmp/kd-sub-e5-tests.log`. Local Vercel logs:
  `/tmp/kd-sub-e5-vercel.log` (absent file passes; a later temporary runner
  inherits production mode from Vite) and `/tmp/kd-sub-e5-vercel-present.log`
  (present file passes in a fresh test process).
- M1 check logs: `/tmp/kd-sub-e5-plugin-ui.log` and
  `/tmp/kd-sub-e5-plugin-ui-http.log`.

## Choices and limits

- No taste choice is needed. The route and the owner step come from the ticket.
- F8 and B4 stay outside this build, as the owner directs.
- No token or placeholder token is committed. The owner must add the token and
  deploy before the portal can check the live domain.

## Review repair plan

1. Merge `claude/plugin-ui-iphone` into this branch. Keep its checklist and
   support-page checks. Change only the step cell of row 52.
2. Refuse an empty challenge file or a token with white space. Test the route
   function with temporary files. Check that the site build keeps the exact
   bytes and excludes `.well-known/` from the service worker file list.
3. Test the owner step: a branch, a pull request into main, a publish command,
   and a live-check pass line that names the challenge path.
4. Run `npm test` here. Run `plugin-ui` and `plugin-ui-http` on the M1 with
   the shared lock. Keep each time limit. Record all results, then commit.

The code confirms the two merge conflicts, the missing owner steps, the
service worker cache entry, and the missing route test. It also accepts empty
files and tokens with white space. The input check will prevent those files;
it does not claim that the portal rejects a final line end.

## Review findings

- A1: fixed. Merge target `f39fe27b` supplies the current checklist, owner
  steps and support-page check. Only row 52 changes from that checklist.
  The support tests reject missing and stale pages. A document test checks
  rows 29, 31, 32, 37 and 56, plus the summary counts.
- A2: the input gap is confirmed. The build now refuses an empty token or
  white space before it writes the server output. Nine temporary-file tests
  cover empty input, spaces, tabs, LF and CRLF. The portal's treatment of
  final line ends remains unproved.
- A3: fixed. Row 52 names the branch, pull request into main, publish command
  and challenge path in the live-check pass line. A document test checks
  the order. The live-check test checks the named pass line too. The current
  repair request permits this change to the original ticket's short step.
- A4: fixed. The service worker file list excludes `.well-known/` from its
  cache and version hash. The site build test checks the exact token bytes
  and the cache list.
- A5: fixed. The server build uses `vercelRoutes`. Tests check its exact
  plain-text route, no rewrite or redirect, exact path match, and absent-file
  behavior. CI can test this route without a portal token.
- Review B has no E5 findings. The new browser checks on the merged code
  fail as recorded below. The old pass for `plugin-ui` does not carry over.

## Repair checks

- `git diff --check`: pass.
- The M1 identity matches the required user, host, hardware and fingerprint.
- The repair code commit is `eeeffc30`. Its type check and commit hooks pass.
- `npm test`: 167 files pass; one file fails. 2,610 tests pass; one test
  fails; eight tests skip. The failure is the random-board Darkness test in
  `src/rules/power-fixes.test.ts:470`, at the 5,000 ms limit. That file,
  `src/rules.ts`, and `src/engine.ts` have no change from `1dbe05dc`.
  All E5 tests pass. The artwork checks do not start because Vitest fails.
- Full test log: `/tmp/kd-sub-e5-repair-tests.log`. Exit status file:
  `/tmp/kd-sub-e5-repair-tests.status` (1).
- The single-file retry uses `KINGDOWN_TEST_FILE=src/rules/power-fixes.test.ts`
  with `npm test`. All 35 tests pass in 8.13 s with the same time limits.
  All 50 artwork checks pass too. Its log is
  `/tmp/kd-sub-e5-repair-power-tests.log`; its exit status file is
  `/tmp/kd-sub-e5-repair-power-tests.status` (0). The full-suite result stays
  failed; this retry proves the file passes alone.
- M1 `plugin-ui`: fail, 32.1 s. At `tools/plugin-ui-check.mjs:499`, the
  setup retry waits 5 s for the board. The screen stays on setup with
  `pending: kingdown_create` and `Harness lost reply after commit`.
  Run folder: `kd-sub-e5-hFmVOW`.
- M1 `plugin-ui-http`: fail, 105.0 s. At
  `tools/plugin-ui-check.mjs:933`, the Join button stays hidden for 30 s
  after a remount. Run folder: `kd-sub-e5-7loDih`.
- Both M1 checks use code commit `eeeffc30`. The launcher exits and removes
  its lock. The M1 checkout is clean. The UI, fixture, runtime and check
  source files match target `f39fe27b`; E5 changes none of those files.
  The standalone build does not take the site routes path.
- M1 logs: `~/projects/kd-sub-e5-repair-plugin-ui.log` and
  `~/projects/kd-sub-e5-repair-plugin-ui-http.log`. Copies of the full
  failure logs are `/tmp/kd-sub-e5-repair-plugin-ui-detail.log` and
  `/tmp/kd-sub-e5-repair-plugin-ui-http-detail.log` on this Mac.
- A second full-suite run is canceled before launch while it waits for
  the test lock. Its log is `/tmp/kd-sub-e5-repair-tests-retry.log`.
  The first full-suite failure and the passing single-file retry are the
  unit check results.
- The merge check against `claude/plugin-ui-iphone` has no conflict.
- No check time limit changes.


The five review repairs are complete. Each has a test. The check gate stays
failed because of the full-suite timeout and the two browser results above.
Keep this ticket open for those results. The final commit changes this check
record only; all code checks use `eeeffc30`.

## Gate result after the PR 57 batch

- The three failed results above have fixes on `claude/plugin-ui-iphone`:
  - The Darkness timeout: each reading is its own test, and the boards are
    built once (`7d9cccf8`, from `claude/darkness-test-speed`).
  - `plugin-ui` at line 499: Retry finds the timed-out Create on the server
    clock (`a1cc8a29`, from `claude/retry-held-create`).
  - `plugin-ui-http` at line 933: the Join code field waits for the mount
    (`a268add2`).
- At `a268add2`, `npm test` and the browser checks `plugin-oauth`,
  `plugin-ui`, `plugin-ui-http` and `account` pass. Ticket 20
  (`docs/specs/chatgpt-mvp/issues/20-pr57-ci.md`) records the counts and times.
  The check gate is clear. No time limit changes.
- The batch does not run `npm run build:vercel` and `npm run check:vercel`
  after `21e1dbbb`. GitHub CI runs both. With no token file, `vercelRoutes`
  gives the same routes, in the same order, as the code before E5.
- The owner step stays open: paste the token, then deploy (checklist row 52).
