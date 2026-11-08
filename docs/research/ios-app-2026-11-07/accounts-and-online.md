# Accounts and online play: what an iOS app meets

Date: 2026-11-07. Branch `ios-app` (from `origin/main` c77a67484). Read-only research; no code changed.

Paths are relative to the worktree root. Web facts carry their URL and the date that this report read them (2026-11-07) or the date on the page.

## Summary

- The website has two account surfaces on one origin. The local game (`/`) has **Settings → Account**. The online app (`/play/`, `/g/<id>`, `/j`) has its own sign-in screen. Both use one Supabase session in `localStorage` under the key `kingdown.auth`.
- Sign-in methods today: Google, GitHub and an email code. Facebook shows only with `?facebook=1`. Staging adds a password form. There is **no Sign in with Apple**. App Store guideline 4.8 then asks for one, because Google and GitHub are social logins.
- Online play uses **HTTP polling of `/api`** only. There is no Supabase Realtime, no websocket and no push. A hidden page stops its poll. A page that shows again makes one fresh read.
- The game opens from three URL shapes: `/j#<key>` (invite), `/g/<uuid>` (a game), `/play/...` (the online screens, and the OAuth return `/play/?code=…&sb_flow_id=…`). These become universal links. The site build **deletes** `static/.well-known` today, so an `apple-app-site-association` file would not ship without a build change.
- Account deletion exists in the app: **Settings → Account → Delete my account** on the local page. It starts a 7-day grace. The online app (`/play/`) has no delete control. No confirmation reaches the player when the deletion completes.
- The shipped build has no payments, no ads, no third-party analytics and no push. It has a first-party fault reporter (not linked to the account), email codes through Resend, and server logs.
- The `/api` server refuses every cross-origin request. A wrapper that serves the web files from a local origin (for example `capacitor://localhost`) cannot call `/api` without a server change or a native HTTP bridge.

## 1. The Supabase client and sign-in

### Client setup

- One factory makes the client: `connect(storageKey, { manualCallback })` in `src/account/client.ts:20-26`. It sets `flowType: 'pkce'`, `persistSession: true` and the storage key. It does not set `storage`, so supabase-js uses `localStorage`. It does not set `autoRefreshToken`, so the library default (on) applies.
- Both entries pass the same key, `AUTH_KEY = 'kingdown.auth'` (`src/account/session.ts:2`; `src/account/account.ts:89`; `src/online/entry.ts:71`). So a sign-in on `/` is a sign-in on `/play/`, and the reverse.
- The PKCE verifier is in `localStorage` too, as `kingdown.auth-code-verifier` (`src/account/client.ts:31`).
- The Supabase URL and publishable key come from build values `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Production refuses the staging project, and staging refuses production (`src/account/public-config.ts:1-18`).
- The client loads on demand only. A signed-out player who never opens Account never downloads supabase-js (`src/account/account.ts:88`, `:129`; `vite.config.ts:18-19`).
- The enabled methods come from the live Supabase settings, `GET <supabase>/auth/v1/settings`, not from the build (`src/account/providers.ts:5-14`).

### Methods and their return URLs

| Method | Where | Code | Return URL |
| --- | --- | --- | --- |
| Google, GitHub (local page) | Settings → Account | `signIn(provider)`, `src/account/client.ts:81-84`; buttons `src/account/account.ts:136-138` | `location.origin + location.pathname`, so `https://kingdown.dev/` with `?code=…`. supabase-js reads the code itself (`detectSessionInUrl` default). A refusal or cancel leaves `error*` fields; the page clears them (`src/account/account.ts:116-123`). |
| Google, GitHub (online app) | Sign-in screen of `/play/`, `/g/…`, `/j` | `startAccountSignIn`, `src/account/client.ts:47-53`; `beginAccountSignIn`, `src/online/sign-in.ts:28-37` | Fixed `https://<origin>/play/`, with `?code=…&sb_flow_id=…` (`appendPkceFlowIdToRedirects`, `src/account/client.ts:25`). Before it leaves, the page stores the target route in **sessionStorage** `kingdown.account-signin` (`src/online/sign-in.ts:5`, `:35`; host at `src/online/entry.ts:72`). `consumeSignInReturn` checks the flow ID, a 10-minute age and the route, then exchanges the code and replaces the URL with the target, for example `/j#<key>` (`src/online/sign-in.ts:44-69`). |
| Email code (both surfaces) | Account form; online sign-in screen | `sendEmailCode` / `verifyEmailCode`, `src/account/client.ts:70-80`; form `src/account/email-code.ts:24-68`; online use `src/online/entry.ts:32-35` | No redirect. Supabase sends a numeric code (`signInWithOtp`, `shouldCreateUser: true`). The address waits in **sessionStorage** `kingdown.email-code` for 1 hour, so a phone that drops the tab keeps the step (`src/account/email-code.ts:3-12`). |
| Facebook | Local page only, with `?facebook=1` | `src/account/account.ts:15`, `:70`, `:108` | Same as Google on the local page. The online screen never offers it (`src/online/entry.ts:77`). |
| Password | Staging only | `signInWithPassword`, `src/account/client.ts:62-69`; gate `src/account/public-config.ts:21-23`; form `src/online/entry.ts:39-64` | No redirect. Not a production method. |

- The Supabase redirect allowlist and Site URL are set in the Supabase dashboard, not in this repository. `docs/plugin-preparation.md:85` and `:90` record Site URL `https://kingdown.dev`.
- Sign-out is local scope only (`src/account/client.ts:27-32`). The online app has a Log out row (`src/online/entry.ts:99-112`).

### What this means for iOS

- **Google sign-in cannot run inside a `WKWebView` that the app controls.** Google's policy: "A developer must not direct a Google OAuth 2.0 authorization request to an embedded user-agent under the developer's control" (https://developers.google.com/identity/protocols/oauth2/policies, read 2026-11-07). The app must open the provider page in `ASWebAuthenticationSession` (or the system browser) and give the return URL back to the web view.
- `ASWebAuthenticationSession.Callback.https(host:path:)` accepts an HTTPS return on an associated domain from iOS 17.4 (https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession/callback/https(host:path:), read 2026-11-07). The current fixed return `https://kingdown.dev/play/` can then stay. Sources disagree on whether the entitlement needs `webcredentials:` as well as `applinks:` (https://support.auth0.com/center/s/article/auth0-https-scheme-does-not-work-for-ios-universal-link, read 2026-11-07). One Apple forum report says the HTTPS callback fails in the simulator and works on a device (https://developer.apple.com/forums/thread/763621, read 2026-11-07).
- The PKCE verifier and the online return target stay in the web view's storage while the sheet is open. So the app must load the returned URL into the **same** web view and data store, and the online path's 10-minute limit applies.
- The email code needs no redirect. It works in a web view today, with no native code.
- **Guideline 4.8 asks for an equivalent login.** An app that uses a social login for the primary account "must also offer as an equivalent option another login service" that limits data to name and email, lets the user keep the email private, and does not collect interactions for advertising without consent (https://developer.apple.com/app-store/review/guidelines/, read 2026-11-07). The email code does not let the user hide the address. So the lean answer is **Sign in with Apple**. Supabase takes a native Apple identity token through `signInWithIdToken({ provider: 'apple' })`. Apple gives the full name only at the first sign-in, so the app must save it then (https://supabase.com/docs/guides/auth/social-login/auth-apple, read 2026-11-07). An alternative is to remove Google and GitHub from the iOS build and keep only the email code; that is an owner decision.

## 2. What needs sign-in and what works signed out

Signed out:
- The whole game against the computer, on `/`. `src/account/account.ts:1-6` says "Without a network, or without an account, the game plays exactly as before."
- The local save, settings and the New game setup (section 7). The home card says "Local play remains available offline" (`index.html:50`).
- The offline cache: a service worker at `/sw.js`, registered only on `/` after the board is ready (`vite.config.ts:51-56`).

Needs sign-in:
- The cloud copy of settings, lessons and the saved game (`src/account/sync.ts:4-9`; table `public.user_data`, `src/account/client.ts:92-106`).
- All online play: `/play/`, `/g/<id>`, `/j`. `src/online/entry.ts:86-88` shows the sign-in screen when no session exists. Every `/api` call sends `Authorization: Bearer <Supabase access token>` and fails with `UNAUTHENTICATED` without one (`src/online/client.ts:34-41`).
- The online app also needs the server switch open: `GET /api/status` must answer `account_access: 'open'` (`src/online/account-access.ts:17-29`; `src/online/entry.ts:83-84`).
- Account deletion (section 5).

The entry points: "Log in" links go to `/play/` (`index.html:50`, `:129`, `:184`); "A friend" in New game goes to `/play/friend` (`index.html:140`); "Account" is a menu row (`index.html:189`) with its section at `index.html:199`.

## 3. Online play transport

- **Transport: HTTP polling of the same-origin `/api`.** A search of `src/**/*.ts` (tests left out) for `realtime`, `.channel(`, `WebSocket`, `EventSource` and `BroadcastChannel` finds nothing. `src/online/client.ts:1-5` names the shared poll in `src/plugin/poll.ts` as the source of fresh views.
- **A move:** the board sends `POST /api/games/:id/commands` with `command_id`, `expected_revision` and `action` (`src/online/client.ts:69-75`; route `src/api/http.ts:149`). A lost reply makes the client send the same `command_id` again, up to 4 tries with back-off; the server applies it once (`src/online/client.ts:26`, `:30-31`, `:70-74`).
- **Durable receipt:** before the send, the page writes the command to `localStorage` `kingdown.account-command.<userId>`. After a crash or reload, the page sends it again (`src/online/runtime.ts:19-40`, `:131-142`). It uses the Web Locks API (`navigator.locks`, `src/online/runtime.ts:30-32`).
- **The other player sees the move at their next poll:** `GET /api/games/:id?since=<seq>` (`src/online/client.ts:64-65`; `pollSince`, `src/plugin/poll.ts:4`).
- **Poll delay** (`pollDelay`, `src/plugin/poll.ts:6-26`): 3 s while a draw offer is open, for 2 minutes after your own move, or while the opponent was seen in the last 2 minutes and it is their turn; else 15 s (30 s for a daily game). A wait for a join reads every 5 s for 2 minutes, then every 15 s. No poll after the game ends.
- **Presence:** while a person-vs-person board shows, the page posts `seen` at most each 30 s (`src/account-game/runtime.ts:494`; `src/online/runtime.ts:72`). The opponent's `last_seen_ms` drives the 3 s delay.
- **Sleep and wake** (`runPoll`, `src/plugin/poll.ts:30-64`): a tick does not run while `document.hidden`. `visibilitychange` and `pageshow` start **one** fresh read; missed ticks do not run; two wake events within 1 s count as one. The poll starts at `src/account-game/runtime.ts:515`.
- **Cloud save on sleep:** on `visibilitychange` to hidden, the account sync flushes; on show, it pulls if the last pull is older than 30 s; on `online`, it flushes (`src/account/account.ts:164-169`).
- **Cache gate before each private send:** `withPrivateCachePolicy` proves that the service worker caches no private data, or that no `kingdown-*` cache remains (`src/online/cache-policy.ts:1`, `:22-175`). Each `/api` call goes through it (`src/online/client.ts:39`). If the proof fails, online play shows "Online play is unavailable until the public cache is safe".

What this means for iOS:
- Polling fits an app that goes to the background often: no socket to rebuild, and one read on return. The `pageshow`/`visibilitychange` events must fire in `WKWebView` when the app returns; check on a device.
- A backgrounded app learns nothing about the opponent's move until it opens. Turn alerts need push (APNs), and no push sender exists (section 6). This can wait for the first build.
- The service-worker gate needs a device check. Reports say service workers in `WKWebView` need App-Bound Domains (`WKAppBoundDomains`) and that this setting limits other web views (https://developer.apple.com/forums/thread/770366, read 2026-11-07). With no worker, the gate takes its empty-cache path and needs `window.caches` (`src/online/cache-policy.ts:165-175`).
- Web Locks (`navigator.locks`) must exist in the target `WKWebView`; check on a device.
- The access token refresh relies on supabase-js timers. After a long sleep, the first call can carry an expired token; the server answers 401, and the client does not retry a 4xx (`src/online/client.ts:31`). Check the wake path on a device.

## 4. Links that open the game

The site sends these paths to `index.html` (`tools/plugin-server-build.mjs:31`): `^/(?:play(?:/.*)?|g/[^/]+/?|j/?)$`. `src/entry.ts:4` then loads the online app when `parseAccountRoute` matches; else the local game.

| Link | Shape | Made by | Read by |
| --- | --- | --- | --- |
| Invite | `https://kingdown.dev/j#<key>`. The key is a 43-character token `[A-Za-z0-9_-]{43}` or a 6-character code `[A-HJKMNP-Z2-9]{6}` (`src/online/routes.ts:7-11`). | Server: `url: \`${origin}/j#${invite.token}\`` (`src/api/http.ts:121`, `:136`). Client fallback `inviteLink` (`src/plugin/invite.ts:22-23`). Share sheet or copy (`src/plugin/invite.ts:26-40`). | `parseAccountRoute` (`src/online/routes.ts:24-27`). The key is in the fragment, so it never reaches a server log or the OAuth provider (`docs/research/web-adaptation-2026-10-18/decisions-draft.md:16`). |
| A game | `https://kingdown.dev/g/<uuid>` | `accountPath` (`src/online/routes.ts:37-39`); also the receipt recovery (`src/online/runtime.ts:138-140`) | `src/online/routes.ts:22-23`; page host `src/online/page-host.ts:12-21`. Only a player of the game can open it; other accounts see "This game is not available to this account" (`src/online/entry.ts:94-97`). |
| Online screens | `/play/`, `/play/friend`, `/play/profile`, `/play/settings` | `accountPath` (`src/online/routes.ts:31-36`) | `src/online/routes.ts:17-21` |
| OAuth return | `https://kingdown.dev/play/?code=…&sb_flow_id=…` (online); `https://kingdown.dev/?code=…` (local page) | Supabase, from `redirectTo` (`src/account/client.ts:49`, `:82`) | `consumeSignInReturn` (`src/online/sign-in.ts:44-69`); supabase-js on `/` |
| Serverless game link (parked) | `/?moves=…` | Parked (`docs/PARKED.md`, round 3) | Opens as a plain visit. No iOS work. |

What this means for iOS:
- Universal links need `https://kingdown.dev/.well-known/apple-app-site-association` with `applinks` for `/j`, `/g/*` and `/play/*` and the app ID `6M9C2YSWT4.<bundle id>`.
- **Build blocker:** while the ChatGPT plugin is parked, the deploy tree removes the whole `static/.well-known` folder: `if (!chatgpt) await rm(resolve(output, 'static/.well-known'), …)` (`tools/plugin-server-build.mjs:90`). The vite build also leaves `.well-known/` out of its file list (`vite.config.ts:77`). A change must keep the Apple file and serve it as `application/json`. The live check `tools/vercel-check.mjs:39-40` asserts that the parked tree has no `static/.well-known`, so it changes too.
- The invite key is in the fragment. The app gets the full URL from `NSUserActivity.webpageURL`; check on a device that the fragment arrives, then load that URL into the web view as it is.
- The OAuth return `/play/` is also a universal-link path. If the app owns `/play/*`, a sign-in that the user starts in Safari can open the app with a code that the app's web view cannot exchange (no verifier there). `consumeSignInReturn` then shows "Sign-in did not finish" (`src/online/sign-in.ts:54`). Exclude the query form of the return from `applinks`, or accept that retry.

## 5. Account deletion (guideline 5.1.1(v))

- **Present in the app.** Settings → Account shows "Delete my account" when signed in (`src/account/account.ts:54`). A dialog explains the 7-day grace (`index.html:203-211`). On confirm, the page calls the RPC `public.delete_my_account()` and signs out (`src/account/client.ts:86-91`; `src/account/account.ts:154-163`).
- The RPC asks for the deletion; a daily job runs it after 7 days; a new sign-in cancels it (`supabase/migrations/0008_accounts_safety.sql:40-67`; `supabase/migrations/0020_deletion_utc.sql:5-6`). The public steps are on `public/delete-data.html:25-50`.
- Inside a frame, the page refuses the delete (clickjacking guard, `src/account/account.ts:149`). A `WKWebView` that loads the page as the top document is not a frame, so the guard does not block it.
- **Gaps:**
  - The online app (`/play/`) has no delete control. `requestDeletion` exists in its client but no screen calls it (`src/online/client.ts:84`; route `src/api/http.ts:172`). A player who uses only the online screens must find the local page's menu. If the iOS UI moves Account into the online screens, it must take the delete with it.
  - Apple's page asks the app to "Inform the person how long it will take to delete the account and provide a confirmation when the deletion is complete" (https://developer.apple.com/support/offering-account-deletion-in-your-app/, read 2026-11-07). The dialog states the time. No confirmation reaches the player at completion; the server sends no email (`src/online/jobs.ts:48`).
  - A sign-in in the grace cancels the deletion (`supabase/migrations/0008_accounts_safety.sql:57-67`). Apple allows a delay but says that deactivation alone "is insufficient". The current text explains this; the reviewer may ask about it.
  - With Sign in with Apple, Apple says apps "should use the Sign in with Apple REST API to revoke user tokens" on deletion (same Apple page). The deletion job has no such step yet.

## 6. Payments, ads, analytics, faults, push and email

| Item | In the shipped build? | Evidence |
| --- | --- | --- |
| Payments or purchases | No | No payment package in `package.json` dependencies; a search of `src`, `index.html` and `public` for Stripe and similar names finds none. |
| Ads | No | `public/privacy.html:70`: "We show no ads, we do not sell or rent your data, and we use no third-party tracking or advertising tools." |
| Third-party analytics | No | Same line; no analytics package in `package.json`. |
| Fault reports (first party) | Yes | `installErrorRecorder` runs at start (`src/entry.ts:1-3`). It sends at most 5 reports per page to `/api/client-errors` with fault name, a cleaned message, the route without IDs, the build, the browser family and a phone/desktop size class (`src/diagnostics/browser.ts:8-40`). Not linked to the account; kept 30 days (`public/privacy.html:75`). |
| Server and sign-in logs | Yes | IP address and request data at Vercel (1 day) and Supabase (up to 90 days) (`public/privacy.html:74`). |
| Online presence time | Yes | `seen` (section 3); described at `public/privacy.html:65`. |
| Email | Sign-in codes only | Resend delivers the codes (`public/privacy.html:73`). Turn alerts are stored as preferences (`src/account/profile.ts:38-45`; `src/online/accounts.ts:128-142`; routes `src/api/http.ts:175-176`), but "the MVP sends no email" (`src/online/jobs.ts:48`). |
| Push | No | Preferences have a `push` field, default off (`src/account/profile.ts:39-43`). No push sender or `PushManager` use exists. |

App Store privacy label inputs (a draft for the owner): Contact info (email address); Identifiers (user ID); User content (gameplay, preset messages, reports); Usage data (presence time); Diagnostics (fault reports, not linked). Name and photo come from Google or GitHub and show only to the player (`src/account/account.ts:25-35`; `public/privacy.html:67`). Tracking: none.

## 7. Local data and what a player loses

`localStorage` keys (one origin, shared by `/` and `/play/`):

| Key | Content | Written at | Lost if storage clears |
| --- | --- | --- | --- |
| `kingdown.save` | The saved game against the computer and the settings (`Save`) | `src/screen/save.ts:12-28`, `:86` | The game in progress and settings. A signed-in player gets the cloud copy back. |
| `kingdown.lessons` | Lesson progress (lessons are parked) | `src/lesson-store.ts:22-30` | Progress; cloud copy if signed in |
| `kingdown.sync` | Sync stamps per section | `src/account/sync.ts:32` | Sync history; the next pull decides |
| `kingdown.sync-owner`, `kingdown.local.<userId>` | Which account owns the local data; up to 3 confirmed copies of other accounts' local data | `src/account/local.ts:5-6`, `:88-121` | Copies kept for an account switch |
| `kingdown.new-game` | The last New game setup | `src/main.ts:99-104` | The remembered choices |
| `kingdown.first-deal` | First deal shown | `src/ui/title.ts:5-17` | The first deal shows again |
| `kingdown-sound` | Online sound switch | `src/account-game/runtime.ts:682-686` | The switch |
| `kingdown.auth`, `kingdown.auth-code-verifier` | Supabase session; PKCE verifier | `src/account/session.ts:2`; `src/account/client.ts:31` | The session: the player must sign in again |
| `kingdown.account-command.<userId>` | An unsent online command | `src/online/runtime.ts:20-40` | A move that did not reach the server; the server stays the record |
| `kingdown.account-game.<userId>` | The online app's page state | `src/online/runtime.ts:123`, `:149` | The last screen |
| `kingdown.tricks`, `kingdown.workshop` | Parked features | `src/trick-store.ts:3`; `src/workshop/store.ts:9` | Nothing in the lean build |

`sessionStorage` keys: `kingdown.title-seen` (`src/main.ts:135`), `kingdown.email-code` (`src/account/email-code.ts:3`), `kingdown.account-signin` (`src/online/sign-in.ts:5`), `kingdown.account-page.<userId>` (`src/online/page-host.ts:25`).

Other storage: Cache Storage `kingdown-<version>` from the service worker (`public/sw.js:10`). No IndexedDB use by the game; supabase-js uses `localStorage` here.

What a player loses if iOS clears the web data: a **signed-out** player loses the game in progress, the settings and the setup, with no way back. A **signed-in** player loses only the session and any unsent move; after sign-in, the cloud gives back settings, lessons and the saved game. WebKit can evict an origin's data under storage pressure or when it "has not been used for some time"; non-browser apps get a 15% origin quota; `navigator.storage.persist()` asks for persistent mode (https://webkit.org/blog/14403/updates-to-storage-policy/, 2023-08-10). The Safari 7-day cap on script-written storage is a Safari rule; the post does not say that it applies to other apps (https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/, 2020-03-24).

## iOS implications, most important first

1. Decide the shell: load `https://kingdown.dev` in `WKWebView` (same origin, everything above works), or bundle files locally. Local files need a change, because `/api` refuses any other origin: "Same origin only, so no CORS headers ever" (`src/api/http.ts:212-214`), and the fault reporter checks the origin too (`src/api/http.ts:197-198`).
2. Run Google and GitHub sign-in in `ASWebAuthenticationSession` with the HTTPS callback `kingdown.dev/play/` (iOS 17.4+), and load the returned URL into the same web view.
3. Add Sign in with Apple (guideline 4.8), through a native token and `signInWithIdToken`. Enable the Apple provider in Supabase. Add Apple token revocation to the deletion job.
4. Ship `/.well-known/apple-app-site-association`: change `tools/plugin-server-build.mjs:90` and `tools/vercel-check.mjs:39-40` so the Apple file survives the parked-plugin cleanup. Cover `/j`, `/g/*`, `/play/*`.
5. Keep Delete my account reachable in the new UI; add a completion notice when the job runs.
6. Test on a device: the service-worker cache gate, `navigator.locks`, `visibilitychange`/`pageshow` on app return, the fragment in a universal link, and the token refresh after a long sleep.
7. Can wait: push turn alerts (APNs and a server sender), email turn alerts, Facebook, a native HTTP layer.
