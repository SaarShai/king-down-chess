# Choose the sign-in methods in the app

Type: grilling
Status: resolved
Blocked by: 01
Parent: [iOS app map](../map.md)
Labels: wayfinder:grilling

## Question

Which sign-in methods does the first app build offer?

## Answer

The email code only (plus the staging password form in staging builds). Decided 2026-11-07.

- Google and GitHub refuse embedded web views, and the OAuth return uses `location.origin`, which is `capacitor://localhost` in the app.
- An app with only its own email sign-in is exempt from App Review 4.8. When Google or GitHub returns, the app needs `ASWebAuthenticationSession` and Sign in with Apple (native ID token, `signInWithIdToken`, and Apple token revocation on account deletion).
- `src/account/client.ts` filters the providers when `inApp` is true. A `shortcut:` comment marks the limit.
