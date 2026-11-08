# iOS shell choice for King Down (2026-11-07)

Question: which shell do we use to put the existing Vite and TypeScript game on iOS? The UI and UX will change a lot later. The aim is a lean and robust foundation: the shell, the build path and the platform seams.

## Answer

Use **Capacitor 8.6.0** with Swift Package Manager (SPM), the bundled web build and the default `capacitor://localhost` origin. Do not load the live site (`server.url`) in release builds. Move to Capacitor 9 when it reaches general availability (GA), with `npx cap migrate`.

Reasons, short:

- The game is already a web page. Capacitor ships that page with no rewrite, so a UI redesign is done once, in the web code, for the site and the app.
- Capacitor adds three npm packages and one Swift package. It needs no Rust, no CocoaPods and no hand-written WebKit glue.
- The official plugins cover the native features that make the app more than a website (guideline 4.2).
- `xcodebuild` builds the generated project with no GUI.

Two seams in our code must change before online play works in any bundled shell (all four options have them):

1. The online client calls `/api/...` with a relative path. In the app, the page origin is `capacitor://localhost`, so the call must go to `https://kingdown.dev` instead.
2. The API refuses every cross-origin call. It must accept the app origin, or the app must send its API calls from native code.

## What the codebase has now (code facts)

| Fact | Evidence |
| --- | --- |
| The build is Vite 8 and TypeScript 7. | `package.json:63`, `package.json:64` |
| There is **no three.js** dependency. The render path is Canvas 2D, with one WebGL2 surface for card motion. The task brief says "three.js"; the code does not agree. | `package.json:44-66` (no `three`); `src/plugin/card-motion/runtime.ts:25` (`getContext('webgl2', ...)`); `src/ui/motion.ts:153`, `src/render/effects/hero-burn.ts:25` (2D) |
| The asset base is the site root `/`. This works unchanged at `capacitor://localhost/`. | `vite.config.ts:109` |
| The dev server listens on 127.0.0.1 only. Live reload on a real device needs `--host 0.0.0.0` or the LAN address. | `vite.config.ts:112` |
| The build writes a service worker (`sw.js`) with a version hash and a precache list. | `vite.config.ts:84-95` |
| The site sends `/play`, `/g/<id>` and `/j` to `/index.html` (single-page routes). | `tools/plugin-server-build.mjs:31` |
| The online client takes an `origin` option, but the app entry does not set it, so calls are relative. | `src/online/client.ts:24`, `src/online/client.ts:33`, `src/online/entry.ts:92` |
| Other relative API calls: `/api/status` and `/api/client-errors`. | `src/online/account-access.ts:22`, `src/diagnostics/browser.ts:32-34` |
| API calls use a Bearer token, not cookies. This is good for a cross-origin shell. | `src/online/client.ts:41` |
| The API refuses any request whose `Origin` is not the site origin, or whose `Sec-Fetch-Site` is not `same-origin` or `none`. It sends no CORS headers. | `src/api/http.ts:212-214` |
| Each private API send first proves the cache is safe through the service worker. If the worker does not register, the code falls back to an "empty cache" proof with `caches.keys()`. | `src/online/client.ts:39`, `src/online/cache-policy.ts:88`, `src/online/cache-policy.ts:92`, `src/online/cache-policy.ts:166-184` |
| Google and GitHub sign-in use a web redirect to `location.origin + '/play/'`. Email sign-in uses a one-time code and has no redirect. | `src/account/client.ts:49`, `src/account/client.ts:70-79`, `src/account/client.ts:82` |
| The computer player runs in a module Web Worker. | `src/game.ts:125` |
| The built page is about 271 MB; the character runtime is 247 MB of it. | `du -sh dist dist/character-runtime` on this worktree, 2026-11-07 (local build output; it can be stale) |
| CI runs on `ubuntu-latest` only. There is no macOS job. | `.github/workflows/plugin-checks.yml:25` and the other `runs-on` lines |

### Local probe: WebKit on a custom scheme

I built a 30-line Swift probe (scratchpad only, not in the repo). It loads a page through a `WKURLSchemeHandler` at `capacitor://localhost` in WKWebView on macOS 27.0 (the same WebKit family as iOS 27). Result:

- `location.origin` is `capacitor://localhost`; `isSecureContext` is `true`.
- `crypto.randomUUID`, `crypto.subtle`, `indexedDB`, `localStorage`, `caches`, `Worker` and WebGL2 are all present.
- `navigator.serviceWorker.register('/sw.js')` fails: "serviceWorker.register() must be called with a script URL whose protocol is either HTTP or HTTPS".

So, in any bundled shell the service worker does not run. The cache proof then goes to its "empty cache" branch (`src/online/cache-policy.ts:92`, `:166-184`). That branch can work, because `caches` exists. A test in the iOS simulator must confirm it. This applies to options 1, 2 and 3.

## The four options

### 1. Capacitor

**Versions (npm registry, `npm view`, 2026-11-07):**

| Package | Latest | Date |
| --- | --- | --- |
| `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` | 8.6.0 | 2026-10-28 |
| Capacitor 8.0.0 (the current major) | 8.0.0 | 2025-12-08 |
| Capacitor 9 (`next` tag) | 9.0.0-beta.0 | 2026-10-28 |
| `@capacitor/app` | 8.1.2 | |
| `@capacitor/haptics` | 8.0.2 | |
| `@capacitor/status-bar` | 8.0.4 | |
| `@capacitor/splash-screen` | 8.0.2 | |
| `@capacitor/preferences` | 8.0.1 | |
| `@capacitor/share` | 8.0.3 | |
| `@capacitor/browser` | 8.0.5 | |
| `@capacitor/keyboard` | 8.0.6 | |
| `@capacitor/push-notifications` | 8.1.3 | |
| `@capacitor/assets` (icon and splash generator) | 4.0.0 | |

`@capacitor/cli` 8.6.0 needs Node 22 or later (`engines.node: ">=22.0.0"`). This Mac has Node 26.

**Platform floor.** Capacitor 8 needs iOS 15.0 or later and Xcode 26.0 or later ([Updating to 8.0](https://capacitorjs.com/docs/updating/8-0), read 2026-11-07; [iOS docs, v8](https://capacitorjs.com/docs/ios), read 2026-11-07). No Capacitor page names Xcode 27. "Xcode 26.0+" includes Xcode 27.2, but nobody has proved it here yet. The first build step must prove it.

Capacitor 9 (pre-release) needs iOS 16.0, Xcode 27 and Node 24. It boots from a SwiftUI `App` struct, deletes `Main.storyboard`, makes Cordova optional, and merges the live-reload flags into one `--url` flag. `npx cap migrate` applies the changes ([Updating to 9.0, unreleased](https://capacitorjs.com/docs/next/updating/9-0), read 2026-11-07). The same page says CocoaPods Trunk becomes read-only on 2026-12-02.

**SPM or CocoaPods.** "Capacitor CLI now creates iOS SPM projects as default" in Capacitor 8 ([Updating to 8.0](https://capacitorjs.com/docs/updating/8-0)). The older [SPM page](https://capacitorjs.com/docs/ios/spm) still says SPM is a choice; the upgrade guide is newer. With SPM, the CLI writes a local package, `CapApp-SPM`, that lists the plugins; we do not edit it. This Mac has no CocoaPods, and we need none. The Swift package `ionic-team/capacitor-swift-pm` has tag `8.6.0` (GitHub, 2026-11-07).

**Origin and scheme.** The defaults are `server.iosScheme: "capacitor"` and `server.hostname: "localhost"`, so the origin is `capacitor://localhost` ([Config](https://capacitorjs.com/docs/config), read 2026-11-07). WebKit refuses a handler for a scheme it already handles, such as `https` ([setURLSchemeHandler(_:forURLScheme:)](https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/seturlschemehandler(_:forurlscheme:)), Apple, read 2026-11-07). So no shell can give the bundled page the origin `https://kingdown.dev`. The Capacitor router sends any path with no file extension to `/index.html` (`ios/Capacitor/Capacitor/Router.swift:19-27` at tag 8.6.0). This matches our site routes (`tools/plugin-server-build.mjs:31`).

**Network calls from the page.** Two ways:

- Keep `fetch` in the page and let the API accept the exact origin `capacitor://localhost`. This is a server change in `src/api/http.ts:212-214` plus CORS headers for the preflight that the `Authorization` header causes.
- Turn on `CapacitorHttp`. It replaces `fetch` and `XMLHttpRequest` with native `URLSession` calls through `/_capacitor_http_interceptor_` (`ios/Capacitor/Capacitor/WebViewAssetHandler.swift:38-46`, `:143-160` at tag 8.6.0). Body types are limited to string or JSON on native unless patching is on ([Http API](https://capacitorjs.com/docs/apis/http), read 2026-11-07). I did not prove which `Origin` header the proxied request carries; a test must show it.

The first way is smaller and keeps one network path for site and app. It is my pick.

**Live reload.** Set `server.url` to the dev server and `cleartext: true`, or run `npx cap run ios --live-reload --port <port>`. The device must be on the same network and the server must bind to `0.0.0.0`. Do not commit the `server` block ([Live Reload](https://capacitorjs.com/docs/guides/live-reload), read 2026-11-07). For us: `npm run dev -- --host 0.0.0.0` (because of `vite.config.ts:112`) and a `server.url` that only a local, ignored config sets. In the simulator, `http://127.0.0.1:5173` works with no LAN step.

**Build flow.** `npx cap copy` copies the web build and the config into the native project. `npx cap sync` runs `copy` and then `update` (plugins) ([sync](https://capacitorjs.com/docs/cli/commands/sync), [copy](https://capacitorjs.com/docs/cli/commands/copy), read 2026-11-07). So the build is: `npm run build` → `npx cap sync ios` → `xcodebuild`. `npx cap build ios` wraps archive and export with `--xcode-team-id`, `--xcode-export-method` (default `app-store-connect`) and `--xcode-signing-style` ([build](https://capacitorjs.com/docs/cli/commands/build), read 2026-11-07).

**Sign in with Apple plugin.**

- `@capacitor-community/apple-sign-in` 7.1.0 (2025-10-02) is the usual pick, but it is behind. Its `Package.swift` requires `capacitor-swift-pm` `from: "7.0.0"`, which SPM reads as below 8.0.0, so it does not resolve with Capacitor 8 under SPM. Its issue "feat: capacitor 8" (#133, 2025-12-16) and its PR "feat: upgrade to capacitor 8" (2026-02-10) are still open; the last commit is 2025-12-05 (GitHub API, 2026-11-07).
- `@capgo/capacitor-social-login` 8.7.7 (2026-11-06) supports Capacitor 8 and is active (0 open issues), but its `Package.swift` pulls the Facebook and Google iOS SDKs. That is not lean.
- The leanest path is a small local plugin (about 40 lines of Swift with `AuthenticationServices`) that returns Apple's ID token, then `supabase.auth.signInWithIdToken({ provider: 'apple', token })`. Supabase says a native-only app does not need the OAuth settings ([Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple), read 2026-11-07).
- This can wait (see "Sign-in" below).

**Dependencies added.** npm: `@capacitor/core` (runtime, 376 kB, one dependency `tslib`), `@capacitor/cli` and `@capacitor/ios` (dev). Native: `capacitor-swift-pm` through SPM. Plus one plugin package per native feature.

**Maintenance cost.** Low. One major release a year (7.0.0 on 2025-01-20, 8.0.0 on 2025-12-08). The native project is generated; if we do not edit it by hand, a major upgrade is mostly a CLI step. The 8.x line got 8.5.1, 8.5.2, 8.5.3 and 8.6.0 from August to October 2026 ([GitHub releases](https://github.com/ionic-team/capacitor/releases), read 2026-11-07).

**Redesign cost.** Near zero for the shell. The new UI is web code, shared with the site. Native parts (status bar style, safe areas, haptics) are a few calls.

**CI.** No GUI is needed. Example: `xcodebuild -project ios/App/App.xcodeproj -scheme App -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build`. GitHub Actions has an `xcode-27` runner label in public preview, with Xcode 27.0, 27.1 (default) and 27.2 RC ([runner-images #14404](https://github.com/actions/runner-images/issues/14404), created 2026-07-16; [xcode-27-arm64 Readme](https://github.com/actions/runner-images/blob/main/images/macos/xcode-27-arm64-Readme.md), image 20261026). The `macos-26` image has Xcode 26.6 (default), which also meets Capacitor 8.

**Guideline 4.2 risk.** Medium-low. The page is bundled, the game plays offline against the computer, and native features (haptics, share sheet, later push) are cheap to add. The high-risk pattern, `server.url` to the live site, we do not use.

### 2. Tauri 2 mobile

**Versions.** `@tauri-apps/cli` 2.12.4 (2026-10-21); `@tauri-apps/api` 2.12.4; Tauri 2.0.0 was 2024-10-02; `next` is 3.0.0-alpha.6 (npm registry, 2026-11-07). The Rust crate on docs.rs is 2.12.5.

**Needs.** Xcode, Rust with three iOS targets, Homebrew and CocoaPods ([Prerequisites](https://v2.tauri.app/start/prerequisites/), read 2026-11-07). This Mac has no `cargo`, no `rustc` and no `pod`. The default iOS floor is 15.0 (`bundle.iOS.minimumSystemVersion`, [Config](https://v2.tauri.app/reference/config/), read 2026-11-07). On Apple platforms the app URL is `tauri://localhost` (`src/manager/webview.rs`, tauri 2.12.5 on docs.rs), so the same two seams apply.

**Dev mode.** `tauri ios dev` with `devUrl` and `TAURI_DEV_HOST`; a real device needs extra network steps ([Develop](https://v2.tauri.app/develop/), read 2026-11-07).

**Plugins.** Official iOS plugins include haptics and biometric. The plugin list shows no official Sign in with Apple, status bar or keyboard plugin; share is a community plugin; the notification plugin page documents no remote push ([Plugins](https://v2.tauri.app/plugin/), [Notification](https://v2.tauri.app/plugin/notification/), read 2026-11-07).

**Cost.** A Rust toolchain, a Rust core that we do not need (our core is TypeScript), CocoaPods, and native plugins that we write in Swift plus Rust glue. The redesign cost is the same as Capacitor (web UI). CI needs Rust on the macOS runner. 4.2 risk is the same as Capacitor. Net: more parts, fewer iOS plugins, no gain for this game.

### 3. Hand-written Swift WKWebView shell

**Parts.** A `WKWebView`, a `WKURLSchemeHandler` that maps paths to files in the bundle (with the single-page fallback to `/index.html`), MIME types, range requests for media, and a JavaScript bridge (`WKScriptMessageHandler`) for each native feature. The APIs exist since iOS 11 ([WKURLSchemeHandler](https://developer.apple.com/documentation/webkit/wkurlschemehandler), Apple, read 2026-11-07).

**Dependencies.** None.

**Maintenance cost.** Medium. We own the scheme handler, the bridge, the keyboard and safe-area behavior, the splash, deep links and push wiring. Capacitor already has and tests each of these (for example `WebViewAssetHandler.swift` handles media ranges and the HTTP proxy). Each WebKit or iOS change is our work.

**Redesign cost.** Same as Capacitor (web UI).

**CI.** Same `xcodebuild` command; no npm step for the shell.

**4.2 risk.** The same as Capacitor; Apple judges the app, not the shell.

Net: zero dependencies, but more code that we must keep correct. The probe above (30 lines) proves the core works; the rest is the long tail.

### 4. Native SwiftUI or SpriteKit app, TypeScript core in JavaScriptCore

**Parts.** A full native UI in SwiftUI or SpriteKit ([SpriteKit](https://developer.apple.com/documentation/spritekit), Apple). The rules engine and the computer player run in a `JSContext` ([JSContext](https://developer.apple.com/documentation/javascriptcore/jscontext), iOS 7.0+). A `JSContext` has no DOM, no `fetch` and no Web Worker, so the AI worker (`src/game.ts:125`) needs a native thread and a new message layer.

**Dependencies.** None from outside, but a new JavaScript bundle target for the core.

**Maintenance cost.** High. Two UIs (site and app) for one game, and a bridge for every engine call.

**Redesign cost.** Highest. The owner plans large UI changes. Each change is made twice, in web code and in Swift.

**CI.** `xcodebuild` plus a bundle step for the core.

**4.2 risk.** Lowest, because the UI is native.

**Performance note (not proved).** I did not find a primary source on whether an in-app `JSContext` gets a JIT on iOS. If it does not, the computer player is slower than in WKWebView. A benchmark must answer this before anyone picks this option.

## Comparison

| | Capacitor 8 | Tauri 2 | Own WKWebView shell | Native UI + JSC |
| --- | --- | --- | --- | --- |
| New tools on this Mac | none | Rust, CocoaPods | none | none |
| npm packages | 3 + 1 per plugin | 2 + Rust crates | 0 | 0 |
| Native code we own | none at first | Rust glue + Swift plugins | scheme handler + bridge + every feature | all UI + bridge |
| UI redesign | once, in web code | once, in web code | once, in web code | twice |
| Official iOS plugins | yes, all nine listed | some | none | n/a |
| Headless CI | `xcodebuild` | `xcodebuild` + Rust | `xcodebuild` | `xcodebuild` |
| 4.2 risk | medium-low | medium-low | medium-low | low |

## Guideline 4.2 and related rules

The App Review Guidelines are "Last Updated: October 16, 2026" ([guidelines](https://developer.apple.com/app-store/review/guidelines/), read 2026-11-07).

- 4.2: the app should "elevate it beyond a repackaged website". What helps us: bundled files, offline play against the computer, a native feel (haptics, status bar, share sheet), and later push for online turns. What hurts: a thin frame around `kingdown.dev`.
- 2.5.2: the app may not download code that "introduces or changes features or functionality". So ship the JavaScript in the bundle; do not load new game code from the site. Data (character art packs) is not code.
- 4.8: an app that uses a third-party or social login for the primary account must also offer a login that limits data to name and email and lets the user hide the email. Sign in with Apple meets this. The rule has an exemption for apps that use only the company's own account system.
- 5.1.1(v): an app with account creation must offer account deletion in the app. Our account code has `deleteAccount` (`src/account/client.ts:87`).
- Since 2026-04-28, uploads must use Xcode 26 or later with the iOS 26 SDK ([Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/), read 2026-11-07). Xcode 27.2 meets this.
- The app size limit is 4 GB uncompressed ([Maximum build file sizes](https://developer.apple.com/help/app-store-connect/reference/maximum-build-file-sizes/), read 2026-11-07). Our 271 MB page fits; Apple points to Background Assets for large content.

## Sign-in in the app

- Google forbids its OAuth page in an embedded web view: "A developer must not direct a Google OAuth 2.0 authorization request to an embedded user-agent" ([OAuth 2.0 Policies](https://developers.google.com/identity/protocols/oauth2/policies), last modified 2026-08-05). So the web redirect at `src/account/client.ts:49` and `:82` cannot work inside WKWebView as it is.
- The email code path (`src/account/client.ts:70-79`) has no redirect and works in the web view as it is.
- Lean first build: email code only. Then 4.8 does not apply. Add Google, GitHub and Sign in with Apple together later, through `ASWebAuthenticationSession` or a native token flow.

## Recommendation and pins

Pick **Capacitor 8.6.0, SPM, bundled files, origin `capacitor://localhost`**.

Pin exact versions (no `^`) for the native toolchain, because the CLI writes native project files:

| Package | Pin | When |
| --- | --- | --- |
| `@capacitor/core` | `8.6.0` | now (dependency) |
| `@capacitor/cli` | `8.6.0` | now (devDependency) |
| `@capacitor/ios` | `8.6.0` | now (devDependency) |
| `capacitor-swift-pm` (SPM) | `8.6.0` | written by `npx cap sync` |
| `@capacitor/app` | `8.1.2` | now: resume and pause, and invite links (`/j`) through `appUrlOpen` |
| `@capacitor/haptics` | `8.0.2` | when the redesign adds feedback |
| `@capacitor/status-bar` | `8.0.4` | when the redesign sets the bar style |
| `@capacitor/splash-screen` | `8.0.2` | can wait; the template `LaunchScreen.storyboard` is enough |
| `@capacitor/keyboard` | `8.0.6` | can wait; add if the email code field misbehaves |
| `@capacitor/share` | `8.0.3` | can wait; add with the invite share button |
| `@capacitor/preferences` | `8.0.1` | can wait; add if WebKit storage proves unreliable for the session |
| `@capacitor/browser` | `8.0.5` | can wait; only for external links (terms, support) |
| `@capacitor/push-notifications` | `8.1.3` | later; needs APNs and a server sender |
| Sign in with Apple | local plugin | later, with the social logins |

Settings:

- iOS deployment target **16.0**. Capacitor 8 allows 15.0, but 16.0 is the Capacitor 9 floor, so the later upgrade needs no target change.
- Bundle ID and team `6M9C2YSWT4` with automatic signing.
- `webDir: "dist"`. No `server.url` in the committed config; live reload uses a local, ignored override.

Code seams to change in the web app (both small):

1. One API base: set `origin` to `https://kingdown.dev` (or staging) when the page runs on `capacitor:`; use it at `src/online/entry.ts:92`, `src/online/account-access.ts:22` and `src/diagnostics/browser.ts:32-34`.
2. Let `src/api/http.ts:212-214` accept the exact origin `capacitor://localhost` with CORS headers for it only, and test that it still refuses other origins.

Build path: `npm run build` → `npx cap sync ios` → `xcodebuild ... build` (simulator, unsigned) in CI; `npx cap build ios --xcode-team-id 6M9C2YSWT4` for an archive on this Mac. A macOS CI job can wait until the shell exists; it costs runner minutes.

What can wait: Capacitor 9 (until GA), push, Sign in with Apple and the social logins, the asset generator `@capacitor/assets` (icons can be one hand-made 1024 px file), a macOS CI job, and moving the 247 MB character art to Background Assets.

## Open questions

1. Does Capacitor 8.6.0 build and run cleanly with Xcode 27.2 and the iOS 27 simulator? No source says so; the first build must show it.
2. Does the cache proof (`src/online/cache-policy.ts:166-184`) pass in the iOS simulator when the service worker cannot register? The macOS probe says `caches` exists; iOS must confirm.
3. Server change or `CapacitorHttp`? My pick is the exact-origin allowlist in `src/api/http.ts`. The owner (or the API owner) must accept a change to the "same origin only" rule.
4. Start on Capacitor 9.0.0-beta.0 instead? It targets Xcode 27 and the SwiftUI entry, but it is a beta. My pick is 8.6.0 now and `npx cap migrate` at GA.
5. Does iOS ever clear the WKWebView `localStorage` that holds the Supabase session? I found no primary source for apps (not browsers). A device test over days, or `@capacitor/preferences`, answers it.
6. Does an in-app `JSContext` get a JIT on iOS? Only matters for option 4.
7. Is the 247 MB character runtime all needed in the first build, or can part of it come later as data?
