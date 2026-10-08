# Allow the consent page origin

Status: resolved

## Plan and checks

1. Reproduce the error on a fresh ChatGPT connection with the owner's test account. Read only the failed response, without credentials.
2. Check Supabase's origin rule and the live return URL list. Add only the approved service origin if it is missing.
3. Restart the connection and verify that the actual account consent screen appears. Record the setup rule in the plugin guide.

## Evidence

- The owner confirms use of a new test account. Both the old request and a fresh request show the generic unavailable-or-expired page.
- The browser Network panel shows HTTP 400 from the authorization-details endpoint with `validation_failed` and `unauthorized request origin`.
- Supabase's `validateRequestOrigin` checks the browser Origin through `IsRedirectURLValid`. The existing return URL covers `/authorize?authorization_id=*`, but the browser Origin has no path or query. [Provider source](https://github.com/supabase/auth/blob/master/internal/api/oauthserver/authorize.go)
- Prediction: adding the exact approved service origin to the return URL list permits the consent-details request without changing the Site URL or client callback.

## Verified result

- Add `https://kingdown-plugin.vercel.app` as the sixth Redirect URL. Keep the five existing entries and Site URL.
- Start a fresh request through the existing private plugin. The same test account now reaches "Review this application before connecting." The client and ChatGPT callback match the approved registration.
- Approve the connection. ChatGPT returns to its plugin page and shows the test account as connected and primary. No password or token is read or printed.
- The setup guide now requires both the exact browser origin and the social return path. This is a provider configuration fix; no code or deployment changes are needed. The live before/after test covers the actual origin check; local provider mocks do not prove it.
