# 36 Return a temporary error when signing keys do not load

Status: resolved
Branch: staging/fix-plugin-jwks
Base: origin/main, f8fcec0a
Scope: audit finding 6; plugin token checks and HTTP tests.

## Plan

1. Add tests for a signing-key timeout and other key-fetch failures.
2. Run the tests on the current code. Record the failure before the fix.
3. Use the website error rules in the plugin verifier. Keep the existing HTTP retry reply.
4. Run the affected tests, the full suite and the doc checks with the shared test lock. Use a separate local test database. Run `plugin-ui` and `plugin-ui-http` one at a time.
5. Commit with the unchanged hooks, push the branch and open a PR into main.

## Acceptance

- A key-fetch timeout returns HTTP 503, `Retry-After: 5` and the existing retry text.
- A temporary failure sends no `WWW-Authenticate` header and calls no game service.
- The same token works when the key service recovers.
- Invalid tokens still return HTTP 401. The provider and token checks stay in place.
- The new tests fail before the fix and pass after it.
- The affected tests, full `npm test` and `npm run test:docs` pass.

## Evidence

- Before the fix: `KINGDOWN_TEST_FILE='src/plugin/{auth,http}.test.ts' KINGDOWN_TEST_NAME='signing-key' npm test` fails: 5 fail, 44 skip. Type checks pass. The HTTP case reports `expected 401 to be 503`. The four verifier cases get `AuthenticationError` instead of `AuthenticationUnavailable`.
- Before log: `/private/tmp/fix-plugin-jwks-before.log`.
- The fix uses the website's key-fetch error codes. It keeps token refusals as `AuthenticationError`. The existing HTTP handler returns 503, retry text and `Retry-After: 5` for `AuthenticationUnavailable`.
- After the fix: `KINGDOWN_TEST_FILE='{src/plugin/auth.test.ts,src/plugin/http.test.ts,src/api/http.test.ts,src/api/current-user.test.ts}' npm test` passes: 143 cases in 4 files, plus 67 art checks. Type checks pass. All five new cases pass.
- Affected-test log: `/private/tmp/fix-plugin-jwks-affected.log`.
- Full suite: 5,707 cases pass, 8 skip; all 287 files pass. The type checks and 67 art checks pass. Vitest time: 395.66 seconds. Log: `/private/tmp/fix-plugin-jwks-full.log`.
- The full run uses Node 24, the shared test lock and `kingdown_jwks_test` on `127.0.0.1:55432`. Migrations 0001-0022 pass twice before the run. No remote database is part of the checks.
- `npm run test:docs`: 183 cases pass in 16 files.
- `npm run check:browser plugin-ui plugin-ui-http`: both pass, one at a time, under the shared test lock. `plugin-ui` takes 304.1 seconds. `plugin-ui-http` takes 315.7 seconds and uses the separate local database.
- Check log: `/private/tmp/fix-plugin-jwks-checks.log`. Browser logs: `/var/folders/0j/0fv2szdj15xg_wbgl96cbf_r0000gn/T/kingdown-check-runs/fix-plugin-jwks-ftS7BN/`.
- The first doc start fails with `ENOSPC` before it collects cases. A later disk write check passes. The retry passes with no source change. The first log is `/private/tmp/fix-plugin-jwks-checks-enospc.log`.
- The outage tests use local signing keys and a mock provider. No deploy or sign-in is part of this task.

## Review

The source check confirms that the HTTP handler already has the required 503 reply. The fix stays in the verifier. The new tests check the error type, reply, retry header and recovery with the same token.

An independent review must pass before merge.
