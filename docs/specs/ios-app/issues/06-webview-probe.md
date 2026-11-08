# Check the game in WKWebView

Type: task
Status: resolved
Blocked by: 01
Parent: [iOS app map](../map.md)
Labels: wayfinder:task

## Question

Which web APIs and request headers does the game meet in the app, and does local play work there?

## Answer

Checked on the iPhone 18 Pro simulator (iOS 27.0, Xcode 27.2), 2026-11-07:

- `isSecureContext` is true. `navigator.serviceWorker` is absent. `caches`, module Workers, `navigator.locks` and `crypto.randomUUID` exist.
- The online cache gate (`src/online/cache-policy.ts`) takes its empty-cache branch with no service worker, so it needs no change.
- Cross-origin calls carry `Origin: capacitor://localhost` and `Sec-Fetch-Site: cross-site`; bearer calls send a preflight.
- The staging build opens to the title screen, plays e2-e4, and the computer answers (c7-c6). Settings > Account shows only the email code.
- Supabase answers the app origin (the sign-in options load).
- Staging `/api` answers 403 to the app origin until the server change deploys ([ticket 07](07-staging-online.md)).
