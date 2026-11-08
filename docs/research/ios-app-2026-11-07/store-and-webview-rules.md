# App Store rules and WKWebView facts for the King Down iOS app (2026-11-07)

Scope: the store rules, privacy rules, release steps and WKWebView behavior that set the shape of a lean iOS shell around the current web game. Sources are primary: developer.apple.com (Guidelines, documentation JSON, App Store Connect Help), webkit.org and bugs.webkit.org, supabase.com docs, Google's OAuth policy, and the local Xcode 27.2 tools. All web pages were read on 2026-11-07; a page date is given where the page shows one. Code facts cite `path:line` in this worktree (branch `ios-app`, base `c77a67484`).

Labels: **Fact** is what a source says. **Inference** is this report's reading of a source; check it before you rely on it.

## 0. What the code has now (the starting point)

| Topic | Fact | Where |
| --- | --- | --- |
| Email one-time code | `signInWithOtp` with `shouldCreateUser: true`, then `verifyOtp` with `type: 'email'` | `src/account/client.ts:70-79` |
| OAuth providers | Google and GitHub through `signInWithOAuth` (PKCE, `skipBrowserRedirect`); Facebook is also in the type | `src/account/client.ts:47-53`, `src/account/providers.ts:1` |
| Provider list | The client reads the enabled providers from `GET /auth/v1/settings` | `src/account/providers.ts:5-13` |
| Sign in with Apple | Not present: no `'apple'` provider in the code | `src/account/providers.ts:1` |
| PKCE | `flowType: 'pkce'`, session kept in `localStorage` under a storage key | `src/account/client.ts:23-26`, `:31` |
| Password sign-in | Only in staging; production throws | `src/account/client.ts:61-62`, `src/account/public-config.ts:21-23` |
| Review account pattern | An allow list of password accounts (`kingdown_auth.password_accounts`) exists for a review account | `plugin-deploy/review-signup-hook.sql:1-20` |
| Account deletion | `delete_my_account()` starts a deletion; a 7-day grace; a new sign-in cancels it | `src/account/client.ts:86-91`, `supabase/migrations/0008_accounts_safety.sql:51-67`, `public/delete-data.html:38-49` |
| Deletion entry point | "Settings → Account → Delete my account" in the web UI | `src/account/account.ts:68`, `:158`, `public/delete-data.html:38-39` |
| Player text | Handles are filtered (format, titles, blocked stems); chat is five presets only | `src/account/profile.ts:63-70`, `src/match/protocol.ts:23` |
| Report and block | `POST /api/reports` (player, handle, message), `GET/POST /api/blocks` | `src/api/http.ts:170-171`, `:180`, `src/online/safety.ts:21-22` |
| Contact | `hello@kingdown.dev`, a 7-day first-response aim | `public/support.html:32`, `:51` |
| API origin rule | `/api` refuses every cross-origin request and sends no CORS headers | `src/api/http.ts:212-214` |
| Error reports | Kept only when the `Origin` header equals the site origin | `src/api/http.ts:197-200` |
| Service worker | Registers only at path `/` and only when `'serviceWorker' in navigator`; `.well-known` is never cached | `vite.config.ts:56-59`, `public/sw.js:18` |
| `.well-known` in the deploy | The parked (non-ChatGPT) build deletes `static/.well-known` | `tools/plugin-server-build.mjs:88-90` |
| Vercel routes | Built as Build Output API v3 routes, not `vercel.json` (which is `{}`) | `tools/plugin-server-build.mjs:19-33`, `:94`, `vercel.json` |
| Audio | One Web Audio `AudioContext`, resumed at each sound | `src/render/sfx.ts:74-79` |
| WebGL | WebGL2 only in the parked plugin card motion; the game draws with 2D canvas | `src/plugin/card-motion/runtime.ts:25`, `src/ui/motion.ts:153` |
| three.js | Not a dependency now (the brief says three.js; `package.json` has no `three`) | `package.json:44-66` |
| Analytics SDKs | None in `dependencies` | `package.json:44-52` |
| Fault data | First-party fault counts with no account or address data | `supabase/migrations/0019_client_errors.sql:1-17` |

## 1. App Review Guidelines that touch this app

Source: https://developer.apple.com/app-store/review/guidelines/ (read 2026-11-07; the page shows no "last updated" date).

### 4.2 Minimum functionality and web wrappers

- **Fact.** "Your app should include features, content, and UI that elevate it beyond a repackaged website." An app that is not "particularly useful, unique, or 'app-like'" does not belong on the store (4.2).
- **Fact.** 4.2.2: apps "shouldn't primarily be marketing materials, advertisements, web clippings, content aggregators, or a collection of links."
- **Fact.** 4.2.3(ii): if the app must download more resources at first launch, it must disclose the size and ask first.
- **Fact.** 2.5.2: apps "may not download, install, or execute code which introduces or changes features or functionality of the app."
- **Fact.** 2.5.6: apps that browse the web must use WebKit.
- **Inference.** Ship the game files inside the app bundle and load them locally. This answers 4.2 (a full offline game against the computer, not a site in a frame), avoids a first-launch download (4.2.3), and keeps feature changes behind review (2.5.2). A shell that only loads `https://kingdown.dev` is the riskiest shape for 4.2 and 2.5.2. Native touches that help the "app-like" test and are cheap: haptics, Sign in with Apple, universal links for invites, a native share sheet.

### 4.8 Login services

- **Fact.** An app that uses "a third-party or social login service (such as Facebook Login, Google Sign-In, …)" for the primary account "must also offer as an equivalent option another login service" that limits data to name and email, lets the user keep the email private, and does not collect app interactions for ads without consent.
- **Fact.** Exempt: an app that "exclusively uses your company's own account setup and sign-in systems" (and four other cases that do not apply here).
- **Inference.** Email code alone is the company's own sign-in, so an email-only iOS build is exempt. As soon as the iOS build offers Google, GitHub or Facebook, it must also offer an option with private email. Email code does not hide the address, so the practical option is Sign in with Apple.

### 5.1.1(v) Account sign-in and in-app deletion

- **Fact (Guidelines).** "If your app doesn't include significant account-based features, let people use it without a login. If your app supports account creation, you must also offer account deletion within the app." The app must also let the user revoke social credentials from within the app.
- **Fact (support page).** https://developer.apple.com/support/offering-account-deletion-in-your-app/ (no date shown): start deletion in the app; a direct link to a web deletion page is allowed; deactivation alone fails; no phone, email or chat flow for a non-regulated app; confirmation and re-authentication are allowed; deletion need not be instant, but tell people how long it takes and confirm when it is done; delete user-generated content with the account; offer it to all users, not only users under GDPR or CCPA; for Sign in with Apple, revoke the user's tokens with the REST API.
- **Fact (Apple REST API).** https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens: `POST https://appleid.apple.com/auth/revoke` needs `client_id`, a `client_secret` (a JWT signed with a Sign in with Apple key) and a refresh or access token from a code exchange.
- **Inference for King Down.** The game against the computer needs no sign-in, which meets the first sentence. The current deletion (`supabase/migrations/0008_accounts_safety.sql:51-67`, 7-day grace) meets the timing rule if the app says "seven days" and confirms completion. Two gaps: (1) a sign-in during the grace cancels the deletion, so the in-app text must say so (the web page already does, `public/delete-data.html:48`); (2) Sign in with Apple users need a server step that revokes the Apple token. Supabase does not do it (section 6). There is no completion notice to the user today: check the daily job before submission.

### 2.1 Completeness and the demo account

- **Fact.** No placeholder content. "If your app includes a login, … include demo account info" and "turn on your back-end service." A built-in demo mode needs Apple's approval first and must show all features.
- **Inference.** Email codes go to an inbox the reviewer cannot read. Production refuses password sign-in (`src/account/client.ts:61-62`). The review needs one of these: a production password path for one allow-listed review account (the allow list exists: `plugin-deploy/review-signup-hook.sql:4-10`), or a review mailbox that the reviewer can read. Online play also needs a second account, so give two demo accounts or a bot opponent. Owner decision.

### 1.2 User-generated content

- **Fact.** Apps with user-generated content need a filter for objectionable material, a way to report offensive content with timely responses, a way to block abusive users, and published contact information.
- **Fact (code).** Handles pass a filter (`src/account/profile.ts:63-70`); chat is five fixed presets (`src/match/protocol.ts:23`); report (`src/api/http.ts:180`) and block (`src/api/http.ts:170-171`) exist; contact is published (`public/support.html:32`, `:51`).
- **Inference.** The server side meets 1.2. The iOS UI must expose report and block from the opponent's handle and from a game, and link the support page in the app.

## 2. Privacy

### Privacy manifest (`PrivacyInfo.xcprivacy`)

- **Fact.** https://developer.apple.com/documentation/bundleresources/privacy-manifest-files: the manifest is a property list named `PrivacyInfo.xcprivacy` in the target's resources. Top-level keys: `NSPrivacyTracking` (Boolean), `NSPrivacyTrackingDomains` (array; requests to them fail without ATT permission), `NSPrivacyCollectedDataTypes`, `NSPrivacyAccessedAPITypes`. Create it with File > New File > App Privacy File.
- **Fact.** https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api: since May 1, 2024, App Store Connect does not accept an app that uses a required-reason API without a reason in its manifest. Each executable or dynamic library that uses one needs its bundle's own manifest.
- **Fact.** The categories are `NSPrivacyAccessedAPICategoryUserDefaults`, `…FileTimestamp`, `…SystemBootTime`, `…DiskSpace`, `…ActiveKeyboards` (https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype). `CA92.1` is "user defaults to read and write information that is only accessible to the app itself."
- **Inference.** A Swift shell with no third-party SDK needs a manifest with `NSPrivacyTracking` false, the collected data types (below), and `UserDefaults`/`CA92.1` only if the shell uses `UserDefaults`. Apple's pages do not say that JavaScript inside WKWebView counts as a required-reason API use; no source found either way.

### App Privacy label (App Store Connect)

- **Fact.** https://developer.apple.com/app-store/app-privacy-details/: "collect" means data leaves the device and stays readable longer than needed to serve the request. Third-party code counts. Data types that fit King Down: Contact Info > Email Address, Identifiers > User ID (includes handles), User Content > Gameplay Content (saved games, multiplayer play), Diagnostics > Crash Data / Other Diagnostic Data.
- **Inference.** Likely label: Email Address, User ID, Gameplay Content, all "linked to the user", purpose App Functionality; Other Diagnostic Data "not linked" (the fault table holds no account data, `supabase/migrations/0019_client_errors.sql:1`). Check what Supabase Auth keeps (IP addresses in auth logs) before you answer.

### App Tracking Transparency

- **Fact.** https://developer.apple.com/documentation/apptrackingtransparency: use the framework "if it collects data about people and shares it with other companies to track them across apps and websites." Guideline 5.1.2 says the same and forbids gating features on tracking permission.
- **Inference.** King Down has no ad or analytics SDK (`package.json:44-52`), so it needs no ATT prompt and no `NSUserTrackingUsageDescription`. Set `NSPrivacyTracking` to false.

### Privacy policy

- **Fact.** 5.1.1(i): a privacy policy link in App Store Connect and in the app, covering what is collected, third parties, retention and deletion. `public/privacy.html` exists; link it from the app's settings.

## 3. Export compliance, age rating, toolchain

### Export compliance (`ITSAppUsesNonExemptEncryption`)

- **Fact.** https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption: set `NO` when the app "either uses no encryption, or only uses encryption that's exempt." Without the key, App Store Connect asks the questionnaire at every upload.
- **Fact.** https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations: "Typically, the use of encryption that's built into the operating system—for example, when your app makes HTTPS connections using URLSession—is exempt." It also warns that an exempt app "might alternatively be required to submit a year-end self-classification report."
- **Fact.** https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance: the developer carries the liability for a wrong exemption claim.
- **Inference.** HTTPS through WebKit and URLSession only, and no own crypto: set `ITSAppUsesNonExemptEncryption = NO`. Whether a year-end self-classification report applies is a legal question for the owner (Apple's page says "might").

### Age rating

- **Fact.** https://developer.apple.com/news/upcoming-requirements/: new age-rating questions; ratings changed automatically; answer the new questions by January 31, 2026, to avoid interruptions.
- **Fact.** https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions: the levels are 4+, 9+, 13+, 16+, 18+. The questions cover In-App Controls (parental controls, age assurance), Capabilities (unrestricted web access, user-generated content, social media, messaging and chat, advertising), Mature Themes, Medical or Wellness, Sexuality or Nudity, Violence (cartoon or fantasy, realistic, weapons), Chance-Based Activities (gambling, contests, loot boxes). "Unrestricted web access" sets 16+. Cartoon or fantasy violence: infrequent 9+, frequent 13+.
- **Inference.** Answers that matter: Messaging and chat (presets: yes), User-generated content (handles: likely yes), Cartoon or fantasy violence (captures), Contests (rated online play). Keep the web view on the game's own pages; a web view that can open any site may count as unrestricted web access (16+). Likely 9+ or 13+.

### Minimum Xcode and SDK

- **Fact.** https://developer.apple.com/news/upcoming-requirements/ (latest entry 2026-09-09): since April 28, 2026, uploads must be built with Xcode 26 or later and an iOS 26 SDK; since September 9, 2026, iOS apps must target iOS 13 or later.
- **Fact.** https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds: iOS apps built with Xcode 26 or later.
- **Fact (local).** `xcodebuild -version` prints Xcode 27.2 (27B52). It meets the rule.

## 4. TestFlight: from a new bundle ID to an internal build

### Steps

1. **Agreements (web, Account Holder).** The Account Holder signs the latest agreement in Business before an app record can exist (https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app).
2. **Bundle ID (CLI possible).** Register an explicit App ID such as `dev.kingdown.app`. Options: Xcode automatic signing with `-allowProvisioningUpdates`, or `POST /v1/bundleIds` (https://developer.apple.com/documentation/appstoreconnectapi/post-v1-bundleids). Enable Sign in with Apple and Associated Domains on it when they are used.
3. **App record (web only).** "Don't use this API to create new apps; instead, create new apps on the App Store Connect website" (https://developer.apple.com/documentation/appstoreconnectapi/apps). Fields: platform, name, primary language, bundle ID, SKU, user access. Roles: Account Holder, Admin or App Manager.
4. **API key (web, once).** Users and Access > Integrations > App Store Connect API > Team Keys. An Admin makes it; the `.p8` downloads once. Individual keys cannot use Provisioning endpoints (https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api). Store it outside the repo (the house rule on secrets applies).
5. **Archive (CLI).** `xcodebuild -scheme … -configuration Release -destination 'generic/platform=iOS' archive -archivePath …` with `-allowProvisioningUpdates -authenticationKeyPath … -authenticationKeyID … -authenticationKeyIssuerID …` (local `xcodebuild -help`, Xcode 27.2).
6. **Export and upload (CLI).** `xcodebuild -exportArchive` with an export options plist: `method` = `app-store-connect`, `destination` = `upload`, optional `testFlightInternalTestingOnly` = YES ("this build cannot be distributed via external TestFlight or the App Store"), `manageAppVersionAndBuildNumber` defaults to YES (local `xcodebuild -help`). Other upload paths: `xcrun altool --upload-package` or `--upload-app` with `--api-key`/`--api-issuer` (local `xcrun altool --help`; the key file is found in `~/.appstoreconnect/private_keys` and others), Transporter, or `POST /v1/buildUploads` (API 4.1). `notarytool` is for Mac notarization, not for iOS uploads; `altool` notarization ended November 1, 2023 (upcoming-requirements page), but `altool` uploads still work.
7. **Processing.** The build must finish processing; Apple sends an email. The bundle ID and version link the build to the app record (upload-builds page).
8. **Export compliance.** With `ITSAppUsesNonExemptEncryption = NO` in Info.plist, the build skips the questions. `PATCH /v1/builds/{id}` can also set the exemption (https://developer.apple.com/documentation/appstoreconnectapi/patch-v1-builds-_id_).
9. **Internal group (web or API).** Internal testers are App Store Connect users with an eligible role, up to 100. "Enable automatic distribution" gives each new build to the group. Builds last 90 days (https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers, https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview). API: `POST /v1/betaGroups`, `POST /v1/betaGroups/{id}/relationships/builds`. Beta App Review applies to the first external build only; the overview page names review for external testers only.

### What needs the owner in the web portal

Sign agreements; create the app record; make the Team API key (Admin) and keep the `.p8` safe; accept testers' invitations (each tester); and, later, the App Privacy answers, age rating, screenshots, review notes and the "Submit for Review" action. A store submission also needs the owner's word under `AGENTS.md` ("Deploys and store submission need the owner's word").

## 5. WKWebView facts

### Service workers, custom schemes and App-Bound Domains

- **Fact.** App-Bound Domains: up to 10 domains in Info.plist key `WKAppBoundDomains`; with `limitsNavigationsToAppBoundDomains`, the web view goes only to those domains. With the key present, a web view loses script injection, user style sheets, cookie access and message handlers on other domains (https://webkit.org/blog/10882/app-bound-domains/, 2020-06-26; `limitsNavigationsToAppBoundDomains` is iOS 14.0+ per its doc JSON).
- **Fact.** WebKit bug 206741, "WKWebView support for Service Workers", is still NEW (https://bugs.webkit.org/show_bug.cgi?id=206741, last comment 2025-02-07). Commenters there report that with App-Bound Domains `navigator.serviceWorker` exists, but workers load only over HTTP or HTTPS, not from a `setURLSchemeHandler` custom scheme. No WebKit engineer answer confirms or denies this. No Apple page documents service workers in WKWebView.
- **Fact.** `WKURLSchemeHandler` (iOS 11+) loads resources for schemes WebKit does not handle; Apple asks you to put the app or company name in the scheme name (https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/seturlschemehandler(_:forurlscheme:)).
- **Inference.** Do not plan on a service worker in the app. With bundled files served by a scheme handler, the app needs no offline cache. The current registration is safe there: it runs only at path `/` and only when `'serviceWorker' in navigator` (`vite.config.ts:56-59`). Avoid `WKAppBoundDomains` unless a later feature needs it, because it removes message handlers from other domains.

### localStorage and IndexedDB: persistence and eviction

- **Fact.** `WKWebsiteDataStore.default()` "saves website data persistently to disk" (https://developer.apple.com/documentation/webkit/wkwebsitedatastore).
- **Fact.** https://webkit.org/blog/14403/updates-to-storage-policy/ (2023-08-10): for non-browser apps an origin may use up to 15% of disk and all origins up to 20%; eviction is per origin, least recently used, under quota or storage pressure "or after a period without user interaction"; it covers localStorage, IndexedDB, Cache API, service workers. `navigator.storage.persist()` is granted by heuristics.
- **Fact.** https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ (2020-03-24): the seven-day cap on script-writable storage counts days of Safari use; it does not speak about WKWebView apps.
- **Inference.** The Supabase session and local saves live in localStorage (`src/account/client.ts:23-31`). Eviction of an origin that the user opens every day is unlikely, but not ruled out by any source. Lean plan: keep localStorage for now; cloud saves already sync (`src/account/client.ts:93-108`). Later seam: a small native bridge that keeps the Supabase refresh token in the Keychain.

### WebGL2

- **Fact.** WebKit supports WebGL2 since Safari 15, on Metal (https://webkit.org/blog/11989/new-webkit-features-in-safari-15/). The default-on change is WebKit bug 216464, RESOLVED FIXED.
- **Fact (code).** The game draws with 2D canvas (`src/ui/motion.ts:153`); WebGL2 is only in parked plugin code (`src/plugin/card-motion/runtime.ts:25`).

### Audio

- **Fact.** `mediaTypesRequiringUserActionForPlayback` sets which media types need a user gesture; `.none` (`WKAudiovisualMediaTypeNone`) needs none (iOS 10+, https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/mediatypesrequiringuseractionforplayback). `allowsInlineMediaPlayback` defaults to false on iPhone (https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/allowsinlinemediaplayback).
- **Fact.** W3C Audio Session draft (https://w3c.github.io/audio-session/) defines `navigator.audioSession.type` values such as `ambient` and `playback`. A WebKit report says the default acts as ambient, which the silent switch mutes (https://bugs.webkit.org/show_bug.cgi?id=261554, community report).
- **Inference.** The game's Web Audio sounds (`src/render/sfx.ts:74-79`) should respect the silent switch, which is the ambient default. Set `mediaTypesRequiringUserActionForPlayback = []` in the shell so the first sound is not blocked; keep the `resume()` call.

### Memory limits and process termination

- **Fact.** WebKit renders in a separate process and calls `webViewWebContentProcessDidTerminate(_:)` "when the process for the specified web view terminates for any reason" (iOS 9+, https://developer.apple.com/documentation/webkit/wknavigationdelegate/webviewwebcontentprocessdidterminate(_:)).
- **Fact.** No Apple or WebKit page found gives a memory limit for the web content process.
- **Inference.** The shell must reload the page in that callback, and the web side must restore the game from its save. Measure memory on the smallest supported device.

### Safari Web Inspector

- **Fact.** `WKWebView.isInspectable` defaults to false; set it to true to inspect the view from Safari's Develop menu (iOS 16.4+, https://developer.apple.com/documentation/webkit/wkwebview/isinspectable).
- **Inference.** Set it true in Debug builds only.

## 6. Supabase auth inside an iOS web-view app

### Email one-time codes

- **Fact.** `signInWithOtp` then `verifyOtp` with `type: 'email'`. To send a code, not a link, put `{{ .Token }}` in the Magic Link email template. Codes expire after 1 hour by default; one new request per 60 seconds; `shouldCreateUser` defaults to true (https://supabase.com/docs/guides/auth/auth-email-passwordless).
- **Inference.** This works unchanged in WKWebView: no redirect, no browser. The code field already has `autocomplete = 'one-time-code'` (`src/account/email-code.ts:29`), so iOS can offer the code. This is the lean first sign-in for TestFlight, and it needs no 4.8 work.

### Sign in with Apple through a native ID token

- **Fact.** https://supabase.com/docs/guides/auth/social-login/auth-apple: for a native-only app, enable Sign in with Apple on the App ID and add the bundle ID under Client IDs in the Apple provider; "If you're building a native app only, you do not need to configure the OAuth settings" (no Services ID, no key, no 6-month secret rotation). Apple sends the full name only at the first sign-in; save it with `updateUser`. Supabase does not support Apple's server-to-server notification endpoint.
- **Fact (library source).** `signInWithIdToken({ provider: 'apple', token, nonce })`: "If the ID token contains a `nonce` claim, then the hash of this value is compared to the value in the ID token" (`node_modules/@supabase/auth-js/dist/module/lib/types.d.ts:633-640`, auth-js 2.117.2). So pass the raw nonce to Supabase and its SHA-256 hash to Apple's request.
- **Inference.** The native side runs `ASAuthorizationAppleIDProvider`, then hands the identity token and raw nonce to the page through a message handler; the page calls `signInWithIdToken`. The deletion rule (section 1) then needs a Sign in with Apple key and a server step for token revocation, which is the part that native-only setup skips.

### Google sign-in

- **Fact.** Google: "A developer must not direct a Google OAuth 2.0 authorization request to an embedded user-agent" (https://developers.google.com/identity/protocols/oauth2/policies, modified 2026-08-05). So the Google page cannot open inside the game's WKWebView.
- **Fact.** Supabase lists two iOS paths: the Google Sign-In SDK plus `signInWithIdToken` (iOS and web client IDs in Client IDs; "Skip nonce check" for the Swift SDK), or browser OAuth with a deep link back (https://supabase.com/docs/guides/auth/social-login/auth-google).
- **Fact.** `ASWebAuthenticationSession` shows the provider's page in a system browser sheet and returns the callback URL to the app (iOS 12+); a callback that matches an `https` host and path is iOS 17.4+ (https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession).
- **Inference.** Lean path when Google returns: `ASWebAuthenticationSession` with the existing PKCE start (`src/account/client.ts:47-53` already returns the URL and `flowId` without a redirect) and the existing `finishAccountSignIn` (`src/account/client.ts:55-60`). It adds no SDK and no privacy-manifest entry. Google on iOS turns on rule 4.8, so it waits for Sign in with Apple.

### Redirect URLs

- **Fact.** `redirectTo` must match the project's Redirect URLs allow list; the Site URL is the fallback. Mobile deep links use a custom scheme such as `com.supabase://login-callback/`, with a separate scheme per environment. In production, use exact paths, not `**` (https://supabase.com/docs/guides/auth/redirect-urls).
- **Inference.** Add one callback per environment (for example `dev.kingdown.app://auth-callback` and a staging scheme), or an `https://kingdown.dev/...` callback when the app has universal links and iOS 17.4+.

### Universal links (`apple-app-site-association`)

- **Fact.** File name `apple-app-site-association`, no extension, at `https://<domain>/.well-known/apple-app-site-association`, over HTTPS "with a valid certificate and with no redirects." Content: `applinks.details[].appIDs` as `<Team ID>.<bundle ID>` and `components` patterns. Each subdomain needs its own file (https://developer.apple.com/documentation/xcode/supporting-associated-domains).
- **Fact.** Apple's CDN fetches the file within 24 hours; devices check about once a week. The host must answer all IP addresses and user agents (same page; https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links).
- **Fact.** The entitlement is `com.apple.developer.associated-domains`, entries `applinks:<domain>`, set by the Associated Domains capability in Xcode; `?mode=developer` bypasses the CDN in development and must go before submission (https://developer.apple.com/documentation/xcode/configuring-an-associated-domain, https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.associated-domains).
- **Fact (content type).** Current Apple pages do not state a content type. The archived guide says to serve it as `application/json` (https://developer.apple.com/library/archive/documentation/General/Conceptual/AppSearch/UniversalLinks.html, archived).
- **Inference for this deploy.** Today the parked build deletes `static/.well-known` (`tools/plugin-server-build.mjs:88-90`), so a file put in `public/.well-known/` would not ship. The AASA needs (1) a change to that step, (2) a route with `Content-Type: application/json` in `vercelRoutes` (`tools/plugin-server-build.mjs:19-33`), and (3) a check that the deploy's live-file gate knows the type (`docs/HOSTING.md:17`). Invite links are `/j#<key>` (`docs/PARKED.md`); the `/j` path can match, and the app reads the fragment. Staging (`kingdown-staging.vercel.app`) needs its own file. This is a deploy change, so it needs the owner's go.

### Calls from a custom-scheme origin

- **Fact (code).** `/api` refuses any request whose `Origin` is not the site origin and sends no CORS headers (`src/api/http.ts:212-214`); error reports need the same origin (`src/api/http.ts:197-200`).
- **Inference.** Pages served from `kingdown-app://…` cannot call `https://kingdown.dev/api` as they are. Lean options: (a) a narrow CORS allow for the one app origin, (b) route API calls through the native side (`URLSession`, no CORS), or (c) serve the bundled files under an `https` host name through the scheme handler. Supabase calls go straight to Supabase; Supabase's CORS for a custom-scheme origin was not checked here.

## 7. What can wait (lean)

Service worker in the app; App-Bound Domains; Keychain token bridge; Google, GitHub and Facebook on iOS; Sign in with Apple (needed only when a social login returns, or by choice); universal links (needed for invite links and an https auth callback, not for a first internal build); push notifications; Game Center; in-app purchase.

## 8. Checklist: before the first TestFlight build

- [ ] Account Holder signs the current agreements in App Store Connect (web).
- [ ] Register the explicit bundle ID (Xcode automatic signing or `POST /v1/bundleIds`).
- [ ] Create the app record: name, primary language, bundle ID, SKU (web only).
- [ ] Make a Team App Store Connect API key (Admin, web); keep the `.p8` outside the repo.
- [ ] Xcode project: deployment target iOS 13 or later (Apple's floor; pick higher for WebKit features), built with Xcode 26+ (Xcode 27.2 here).
- [ ] Info.plist: `ITSAppUsesNonExemptEncryption = NO`.
- [ ] `PrivacyInfo.xcprivacy` in the app target: `NSPrivacyTracking` false, collected data types, required-reason entries only for APIs the shell uses.
- [ ] App icon (1024 px) in the asset catalog; a version and a build number.
- [ ] Shell: bundled game files through a `WKURLSchemeHandler`; `isInspectable` true in Debug only; reload on `webViewWebContentProcessDidTerminate`; `mediaTypesRequiringUserActionForPlayback = []`; navigation kept to the game's own pages (open other links in Safari).
- [ ] Decide the API-origin seam (section 6) before online play works in the app; play against the computer works without it.
- [ ] Sign-in for testers: email code only (no 4.8 work).
- [ ] Archive, export with `method = app-store-connect`, `destination = upload`, `testFlightInternalTestingOnly = YES`.
- [ ] Internal group with automatic distribution; invite testers (App Store Connect users).

## 9. Checklist: before App Store submission

- [ ] Owner's word to submit (`AGENTS.md`, Runs and compute).
- [ ] 4.2: offline play against the computer from bundled files; native touches; no "website in a frame" feel.
- [ ] 4.8: email only, or Sign in with Apple beside any Google, GitHub or Facebook button.
- [ ] 5.1.1(v): "Delete my account" in the app's account settings; text says seven days, says a sign-in cancels it, and the user gets a notice when the deletion is done; Sign in with Apple token revocation on the server if Sign in with Apple ships.
- [ ] 5.1.1(i): privacy policy link in the app and in App Store Connect (`public/privacy.html`).
- [ ] 1.2: report and block in the iOS UI; support contact in the app (`public/support.html`).
- [ ] 2.1: no placeholders; production back end on; demo account details (two accounts, or a bot opponent, for online play) in the review notes; a review sign-in path that works without the reviewer's inbox.
- [ ] App Privacy answers: Email Address, User ID, Gameplay Content (linked, App Functionality); diagnostics as collected; no tracking.
- [ ] Age-rating questionnaire answered (presets = messaging and chat; handles; cartoon or fantasy violence; contests).
- [ ] Universal links, if shipped: AASA served from `/.well-known/` with `application/json`, no redirect, deploy step fixed; `?mode=developer` removed from the entitlement.
- [ ] Screenshots, description, keywords, support URL, category, price, territories (web).
- [ ] Export compliance: owner decides on the year-end self-classification report.

## Sources

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- Account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Sign in with Apple revoke: https://developer.apple.com/documentation/signinwithapplerestapi/revoke-tokens
- Privacy manifest: https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
- Required-reason API: https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api
- App privacy details: https://developer.apple.com/app-store/app-privacy-details/
- ATT: https://developer.apple.com/documentation/apptrackingtransparency
- Encryption key: https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption
- Export regulations: https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations
- Export compliance overview: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance
- Upcoming requirements: https://developer.apple.com/news/upcoming-requirements/
- Age ratings: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
- Upload builds: https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds
- Add a new app: https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app
- Internal testers: https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers
- TestFlight overview: https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview
- App Store Connect API (apps, bundle IDs, keys, beta groups, builds): https://developer.apple.com/documentation/appstoreconnectapi
- WKWebView docs: https://developer.apple.com/documentation/webkit
- App-Bound Domains: https://webkit.org/blog/10882/app-bound-domains/
- Storage policy: https://webkit.org/blog/14403/updates-to-storage-policy/
- Seven-day cap: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
- WebGL2: https://webkit.org/blog/11989/new-webkit-features-in-safari-15/
- Service worker bug: https://bugs.webkit.org/show_bug.cgi?id=206741
- Audio Session draft: https://w3c.github.io/audio-session/
- Associated domains: https://developer.apple.com/documentation/xcode/supporting-associated-domains, https://developer.apple.com/documentation/xcode/configuring-an-associated-domain
- TN3155: https://developer.apple.com/documentation/technotes/tn3155-debugging-universal-links
- ASWebAuthenticationSession: https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession
- Supabase: https://supabase.com/docs/guides/auth/auth-email-passwordless, https://supabase.com/docs/guides/auth/social-login/auth-apple, https://supabase.com/docs/guides/auth/social-login/auth-google, https://supabase.com/docs/guides/auth/redirect-urls
- Google OAuth policies: https://developers.google.com/identity/protocols/oauth2/policies
- Local tools: `xcodebuild -help` and `xcrun altool --help`, Xcode 27.2 (27B52)
