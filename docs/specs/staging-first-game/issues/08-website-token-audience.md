# Website session audience

Status: implemented; staging verification remains with the main task.

## Plan and checks

1. Add a signed-token regression for the `authenticated` string and one-element array on `GET /api/me/settings`.
2. Accept exactly those two audience forms in the shared website verifier. Keep signature, issuer, expiry, role, anonymous-user and OAuth-client checks.
3. Refuse empty, mixed and repeated audiences, including an OAuth client token with the one-element array.
4. Run focused `npm test` with `KINGDOWN_TEST_FILE=src/api/http.test.ts`. Record the failing regression, then the passing checks. The main task owns staging and browser checks.

## Evidence

- The website request reaches `GET /api/me/settings` with a token but gets 401. The local harness signs only a string audience. `jose` accepts the one-element array, but the next strict string check refuses it.
- Supabase Auth uses JWT audience claims that can encode one audience as an array: [token service](https://raw.githubusercontent.com/supabase/auth/master/internal/tokens/service.go). The verifier must keep the audience restricted to exactly `authenticated` in either form.
- Before the fix, focused `npm test` passes 55 of 56 API tests. Only the signed one-element audience regression fails: settings returns 401 instead of 200. The scalar session and all refusal cases pass.
- The verifier now reads a one-element audience array as its one value before the same exact audience check. Empty and multiple audiences remain arrays and fail the check. The other claim checks do not change.
- After the fix, `KINGDOWN_TEST_FILE=src/api/http.test.ts npm test` passes typecheck, all 56 API tests and all 53 artwork checks; zero skips. The negative cases cover a wrong audience, an empty array, a mixed array, a repeated `authenticated` array and OAuth client tokens with either audience form.
- The change adds no dependency or new auth path. Hosted login, staging deployment and the browser check remain with the main task.
