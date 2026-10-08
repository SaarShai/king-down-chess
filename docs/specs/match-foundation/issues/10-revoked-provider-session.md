# Reject revoked provider sessions

Status: claimed

## Failure and scope

The owner asks to verify provider revocation. The supported Supabase `revokeGrant` call succeeds for the second dedicated test user and approved ChatGPT client. `listGrants` confirms the grant is absent. The existing ChatGPT board then reloads successfully and makes a computer move. The restricted database read confirms the test match advances from revision 1 to revision 2. Revocation does not stop current access.

The verifier checks the JWT signature, resource audience, issuer, expiry, role, actor and client. It does not check the live provider session. An unexpired JWT therefore outlives its revoked session. Supabase's [server-side guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) explains that a user lookup is needed to detect server-side session termination.

## Plan and verification

Retain every existing JWT check, then verify the same token against the fixed Supabase user endpoint. Require the returned user ID to match the verified subject. Fail closed on missing users, revoked sessions, mismatched users, redirects and provider failure. Send the public project key and bearer only to the configured HTTPS issuer, with a bounded timeout. Do not log tokens or response bodies and do not cache positive session checks.

First add a failing test for a signed, unexpired token whose provider session is revoked. Add focused coverage for valid sessions, subject mismatch and provider failure. Confirm malformed and wrong-resource tokens never reach the provider. Run the required tests and browser checks, then publish through the approved plugin path together with removal of temporary live controls. Keep the existing revoked ChatGPT connection in place until a real request is rejected. Confirm the other test account still works; then reconnect the second account and check its saved game.

## Verification evidence

The regression first fails against the old verifier: the signed, unexpired token is accepted despite a provider 401. The other 1,391 tests pass. Log: `/tmp/kingdown-revoked-session-red.log`.

The fix calls the fixed provider user endpoint only after all JWT checks pass. It requires the matching user, rejects redirects, uses a five-second timeout and checks on every request. Tests cover revoked sessions, missing and mismatched users, provider failure, and no provider call for invalid JWT claims. An HTTP test uses the same signed token before and after revocation and confirms that the second request returns 401 without another match-service call. The temporary live controls are removed.

All 1,394 tests and 42 artwork checks pass with two workers and the disposable PostgreSQL database. All three named plugin browser checks pass. The first browser command omits the database setting and correctly stops two checks; both pass when rerun with the required setting. Doc checks pass. Logs: `/tmp/kingdown-revocation-green.log`, `/tmp/kingdown-revocation-browser.log`, `/tmp/kingdown-revocation-browser-db.log`, `/tmp/kingdown-revocation-docs.log`. Live retest follows the clean release.
