# Reject revoked provider sessions

Status: resolved

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

## Release and live result

PR 18 merges as `01325117f532eeebe6741323aa8e8dad8c11fe60`. All hosted checks pass. The approved release script repeats the full tests, compiled HTTP/database check, worker/protocol checks and all three browser checks. Deployment `dpl_B7DrSdoXFnA7ZrapTtrLaVZw5qTV` passes unsigned live checks. Log: `/tmp/kingdown-revocation-fix-release.log`.

The existing revoked account's board now fails Reload with ChatGPT's generic `Internal Server Error`. The restricted read-only receipt remains byte-identical to revision 2 and two commands before release. The first test account reloads its friend match normally at move 4 with no error. The signed-token unit and HTTP regressions prove immediate provider-401 enforcement; the live host error alone does not expose its underlying status or prove that an unexpired token reached the new verifier.

Restoring the second account reaches the same account, client, callback and scopes. Approving consent returns `This account is already connected.` ChatGPT disables both accounts' action buttons on its settings and plugin detail pages, so the stale second connection cannot be removed there. A read-only request in the existing second-account chat tests whether the host provides its own reconnect action. Do not delete the whole plugin or affect the working first connection to bypass this host limit. Recovery remains open until a fresh second-account board succeeds.

The second-account chat finishes with `We couldn’t connect your account. Please try again.` It opens no board and offers no reconnect action. The first account opens a fresh released board at revision 7 / White to move at move 4. It has no temporary test control. Keep this ticket claimed for second-account recovery and a fresh-token live revoke cycle once the host exposes account repair. Do not mark that last cycle passed from a generic host error.

## Account recovery

The owner reports that Alicia is reconnected. A fresh request in the existing second-account ChatGPT chat uses only `alicia@wanderland.london` and opens solo match `9aa166ad-f978-487d-b80f-c9a3963b2457`. The real board shows White to move, move 2, with no error and no temporary test control. The tool reports revision 2. No game is created and no move is made. Account recovery now passes. The separate immediate fresh-token live revoke cycle remains open; this successful reconnect does not prove that cycle.

## Fresh-token live verification plan

The owner asks to finish the desktop checks. Restore the temporary provider grant control for the same dedicated second account and approved client. Add one temporary server log after JWT validation, scoped to that user: remaining token seconds and provider HTTP status only. No bearer, key, user profile or response body is logged. First obtain a successful board read and positive remaining lifetime, revoke through the supported provider API, then read immediately and require a positive remaining lifetime with provider rejection. Reconnect the same account and check its saved game. Remove both controls in the clean release.

The fresh-token live cycle passes on `dpl_4YxZrPzn9kZySdsKGwpkkpWMudVS`. A valid signed token returns provider 200 with 1,112 seconds remaining, then provider 403 with 1,109 seconds remaining after the supported grant revoke. The grant list confirms the approved client is absent. King Down rejects the request; ChatGPT shows its generic internal-server error. This proves rejection before expiry, unlike the prior stale-connection check. The scoped solo receipt remains byte-identical at revision 2 and two commands. Evidence: `/tmp/kingdown-fresh-token-revoked.jsonl`, `/tmp/kingdown-live-match-fresh-revoke.json`. The temporary provider control and lifetime/status log are removed after capturing this result.

ChatGPT's enabled Reconnect action restores Alicia through the same client, callback and scopes. A fresh tool call opens the existing solo game at revision 2. Its board then joins and immediately reopens the existing friend game as Black at move 4. No owner account is used. Live revocation and recovery both pass.

## Clean release

PR 20 merges as `4247835f54782bd59b4f24f9f74e8f984838445f` after all hosted checks pass. The approved release script repeats all 1,395 tests, 42 artwork checks, HTTP/database, worker, protocol and three browser checks. It publishes `dpl_HCumPAuwuXWB7K4tKRxSRjDmLBpz`; unsigned live checks pass. Log: `/tmp/kingdown-desktop-final-release.log`. Fresh boards on both dedicated accounts show the same friend match at revision 7 / move 4, with White and Black seats correct and no error. The live consent page has no temporary revoke button, and the released source has no temporary lifetime/status log.
