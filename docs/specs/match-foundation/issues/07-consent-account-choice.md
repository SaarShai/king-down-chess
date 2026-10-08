# Let a signed-in player choose another account

Status: claimed

## Reproduction and cause

Connect another account in ChatGPT while the King Down consent page retains the first test login. Supabase returns a redirect for the existing grant. The consent page follows it before showing Use another account. ChatGPT reports that the account is already connected.

## Plan and checks

Show the signed-in account with Continue and Use another account before requesting authorization details. Continue retains the provider's existing-grant redirect; Use another account signs out locally before that redirect can be issued. Keep the full consent review for a new grant. Test the existing-grant continue and switch paths, plus sign-in, approve and deny. Run the named OAuth browser check and required repository checks.

## Local result

The consent page waits for the account choice before it asks Supabase for authorization details. It shows the current email address. Use another account signs out only the consent session and preserves the authorization request. A failed sign-out restores the prior button states, including the block on an unapproved client.

The named `plugin-oauth` browser check passes with the actual SDK and a local provider mock. It covers existing-grant continue, local account switch before any grant request, the social return with PKCE, allow, deny, and a failed sign-out with a blocked client. The first test run reports the deliberately injected HTTP 503 as an unexpected console error; the test permits that exact error only in the failure case and then passes. `npm test` with the disposable database passes all 1,391 unit tests and 42 artwork checks. The document checks pass all 74 cases. Live confirmation waits for publication.
