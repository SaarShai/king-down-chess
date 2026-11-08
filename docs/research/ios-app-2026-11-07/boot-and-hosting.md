# Boot and hosting for an iOS app (2026-11-07)

Scope: how the web app starts and how it talks to its server, for an iOS app that loads the built files from inside the app at an origin such as `capacitor://localhost`, not from https://kingdown.dev. Source: branch `ios-app` at `c77a67484`. Code facts cite `path:line`. Web facts cite a URL and the date or version read.

## Summary

- The site has one HTML entry, `index.html`. `/play/`, `/g/<id>` and `/j` are rewrites to the same file. `src/entry.ts` picks the local game (`src/main.ts`) or the account game (`src/online/entry.ts`) from the address path.
- The first page a player sees is the local game against the computer: the title on a first visit, or Home when a save exists.
- In the app, the local game works with no server. Three client gates stop account play: the route parser accepts only `http:` and `https:`, every `/api` call is a relative path, and every private call first runs a service-worker cache proof.
- The server refuses every cross-origin call (`src/api/http.ts:212-214`) and has no preflight answer. The smallest safe server change is a fixed allowlist of one native origin, `capacitor://localhost`, with exact CORS headers and a 204 preflight. Everything else stays refused.
- kingdown.dev can serve `/.well-known/apple-app-site-association`. Today the parked build deletes the whole `.well-known` folder and a check asserts that it is absent, so four small changes are necessary. This can wait until universal links are in scope.

## 1. HTML entries, boot and routes

| Entry | What it is | Evidence |
| --- | --- | --- |
| `index.html` | The only Vite entry. It loads `/src/entry.ts`. | `index.html:256`; `vite.config.ts:107-119` (no `rollupOptions.input`) |
| `/play/`, `/play/*`, `/g/<id>`, `/j` | Vercel rewrites to `/index.html`. No separate page. | `tools/plugin-server-build.mjs:31` |
| `src/plugin/index.html` | The account-game body. `src/online/entry.ts` imports it as raw text and puts it into the page after sign-in. | `src/online/entry.ts:10`, `src/online/entry.ts:90-91` |
| `public/support.html`, `privacy.html`, `terms.html`, `delete-data.html` | Static legal and support pages. The build copies them. They use relative links. | `vite.config.ts:63-67`; `public/support.html` (links `./`, `./privacy.html`) |
| `src/plugin/consent.html` | Parked ChatGPT consent page. Not in the site build. | `tools/plugin-server-build.mjs:48-58`; `docs/PARKED.md` |
| `vercel.json` | Empty (`{}`). The deploy uses the Build Output API `config.json` that the build writes. | `vercel.json:1`; `tools/plugin-server-build.mjs:94` |

Boot sequence:

1. `src/entry.ts:3` installs the error recorder.
2. `src/entry.ts:4` calls `parseAccountRoute(new URL(location.href))`. An account path loads `./online/entry`; all other paths load `./main`.
3. `src/main.ts` builds the engine and the painted board (`src/main.ts:71-74`), restores the local save (`src/main.ts:117-126`) and opens the title or Home (`src/main.ts:137-139`, rule in `src/ui/home.ts:47-50`). After the board is ready, it loads the account module on demand for cloud save (`src/main.ts:169-170`).
4. `src/online/entry.ts` reads `/api/status` (`src/online/entry.ts:83`), then the Supabase session, then mounts the account game (`src/online/entry.ts:90-113`).

The first screen: the local game against the computer, with the title once per tab, or Home for a player who has a save (`src/main.ts:137-139`). The "Log in" links go to `/play/` (`index.html:50`, `index.html:129`, `index.html:184`), and "A friend" goes to `/play/friend` (`index.html:140`).

Account routes (`src/online/routes.ts:14-28`): `/play`, `/play/`, `/play/friend`, `/play/profile`, `/play/settings`, any other `/play/*`, `/g/<uuid>`, `/j#<key>`. `src/online/page-host.ts:11-22` and `src/online/runtime.ts:166-188` read and write `location.pathname` and `history` for these routes.

### What this means in the app

- Capacitor's iOS router serves `index.html` for every path without a file extension ("the path is empty or a SPA route"). So `capacitor://localhost/play/` loads `index.html`. Source: https://github.com/ionic-team/capacitor/blob/main/ios/Capacitor/Capacitor/Router.swift (main branch, read 2026-11-07).
- `parseAccountRoute` refuses every protocol other than `http:` and `https:` (`src/online/routes.ts:15`). At `capacitor://localhost/play/`, `src/entry.ts:4` gets `undefined` and loads the local game again. **Account play cannot open in the app until this gate accepts the app scheme.**
- For a non-special scheme, `new URL('capacitor://localhost/play/').origin` is the string `"null"` (checked in Node 26, 2026-11-07). `src/online/sign-in.ts:29` and `src/online/sign-in.ts:59` build `new URL(target, origin)` from that value, which throws. The OAuth start therefore fails in the app. This does not block the email-code sign-in (see section 3).

## 2. Build output, offline plugin and service worker

Build facts:

- `base: '/'` (`vite.config.ts:109`). Built assets use root paths such as `/assets/...`. At `capacitor://localhost/` the root is the app's web folder, so root paths resolve. No `base` change is necessary for Capacitor.
- `build.copyPublicDir: false` (`vite.config.ts:115`). The offline plugin copies `public/` itself and filters private character-runtime files (`vite.config.ts:63-67`).
- The offline plugin computes a content version and two file lists (allowlist and precache) and writes them into `dist/sw.js` (`vite.config.ts:77-95`, `vite.config.ts:22-45`). It skips `sw.js` and `.well-known/` from those lists (`vite.config.ts:77`).
- It injects an inline script into `<head>` that registers `/sw.js` only when `location.pathname === '/'` and `'serviceWorker' in navigator` (`vite.config.ts:54-60`).
- `__KINGDOWN_BUILD__` is the git commit (`vite.config.ts:110`). `__KINGDOWN_PAGE_ENGINE__` comes from the runtime build (`vite.config.ts:117-119`).
- `npm run build` is `tsc --noEmit && vite build` (`package.json:8`). The deploy tree is `npm run build:vercel`, which adds the API function (`package.json:41`). An app needs only `dist/` from `npm run build`.

WKWebView and service workers: WKWebView exposes service workers only for App-Bound Domains over http(s), and not for custom schemes. Sources: https://bugs.webkit.org/show_bug.cgi?id=206741 (status NEW, read 2026-11-07); https://developer.apple.com/forums/thread/773539 (read 2026-11-07). Treat this as "no service worker in the app" and verify on the iOS 27 simulator.

What breaks or is useless without a service worker:

| Item | Effect in the app | Evidence |
| --- | --- | --- |
| Inline registration script | Does nothing (`'serviceWorker' in navigator` is false). Harmless. | `vite.config.ts:56-59` |
| `dist/sw.js`, its precache and allowlist | Dead weight. The app bundle already holds every file, so offline play is native. | `public/sw.js:1-183` |
| `manifest.webmanifest`, `apple-touch-icon` | Useless inside the app. Harmless. | `index.html:21-22` |
| `withPrivateCachePolicy` | **Can block all account calls.** With no `navigator.serviceWorker`, it goes to the "empty-cache" branch and calls `caches.keys()` (`src/online/cache-policy.ts:166-185`). If `caches` is absent at the app origin, the call throws, `fail` rejects with `CachePolicyUnavailable`, and the API client maps it to 503 `UNAVAILABLE` (`src/online/client.ts:39-45`). `/api/status` uses the same gate (`src/online/account-access.ts:20-23`), so `readWebAccountAccess` returns "closed". If `caches` exists and holds no `kingdown-*` cache, the send goes ahead (`src/online/cache-policy.ts:185`). | `src/online/cache-policy.ts:22-25`, `:166-188` |
| Cache-safety purpose | The proof exists so that a service worker cannot cache a private response. In an app with no service worker, there is nothing to prove. | `src/online/cache-policy.ts:1`; `public/sw.js:18-40` |

Code that reads the location or uses root paths (client code only):

| Code | Read | App effect |
| --- | --- | --- |
| `src/entry.ts:4`, `src/online/routes.ts:15` | `location.href`, protocol | Blocks account routes (section 1). |
| `src/online/sign-in.ts:29`, `:45-59` | `location.href` origin and `pathname === '/play/'` | Origin is `"null"`; the OAuth start throws. |
| `src/account/client.ts:49` | `location.origin + '/play/'` as OAuth `redirectTo` | Becomes `capacitor://localhost/play/` (or `null/play/`). Not usable as a redirect. |
| `src/account/client.ts:82` | `location.origin + location.pathname` as `redirectTo` | Same problem (local-page sign-in). |
| `src/online/page-host.ts:12-22`, `:61` | `location.pathname`, `history.replaceState` | Works: paths stay `/play/...` at the app origin. |
| `src/online/runtime.ts:127`, `:167`, `:183-187` | `location.href`, `pathname`, `pushState` | Works after the routes gate change. |
| `src/online/runtime.ts:176` | `location.assign(url)` for `openLink` | Navigates the web view away from the app. Needs a native "open in browser" seam later. |
| `src/online/entry.ts:34`, `:56`, `:65`, `:96`, `:109` | `location.assign('/play/')`, `href = '/'`, `location.replace('/play/')` | Works: full reloads of the bundled `index.html`. |
| `src/online/cache-policy.ts:81-88` | `getRegistration('/')`, `register('/sw.js')` | Not reached when `navigator.serviceWorker` is absent. |
| `src/plugin/invite.ts:22-23` | `location.origin` fallback for an invite link | Would build `null/j#...`. The server always sends `url` (`src/api/http.ts:121`, `:136`), so the fallback is not used. |
| `src/account/account.ts:39-40` | `/privacy.html`, `/terms.html` | Opens the bundled copies inside the web view. |
| `src/diagnostics/browser.ts:23` | `location.pathname` for the error route | Works. |
| `src/render/PaintedView.ts:158` | origin, pathname, search of a clicked link | Works. |
| `src/game.ts:125` | `new Worker(new URL('./ai/worker.ts', import.meta.url), { type: 'module' })` | A module worker from the app scheme. Verify on the simulator. |
| `index.html:19-22`, `:94-120`, `:242-243` | `/fonts/...`, `/ui/...`, `/icons/...`, `/manifest.webmanifest` | Resolve against the app root. Work. |
| `src/ui/*.ts` (for example `src/ui/table.ts:183`) | `import.meta.env.BASE_URL` (`/`) | Work. |

## 3. How the client reaches the API

- **Base URL.** Every call is a relative `/api/...` path. `onlineClient` has an `origin` option, "'' on kingdown.dev itself" (`src/online/client.ts:23-24`, `:33`, `:41`), but `src/online/entry.ts:92` does not pass it. `readWebAccountAccess` hard-codes `fetch('/api/status')` (`src/online/account-access.ts:22`). The error recorder hard-codes `/api/client-errors` for `sendBeacon` and `fetch` (`src/diagnostics/browser.ts:32-34`). At `capacitor://localhost`, all of these hit the app's own folder, not the server.
- **Credentials.** No cookies. The API client sends `Authorization: Bearer <Supabase access token>` and `Content-Type: application/json` for a body, with `cache: 'no-store'` (`src/online/client.ts:36-41`). The status call uses `credentials: 'omit'`, `referrerPolicy: 'no-referrer'` and `redirect: 'error'` (`src/online/account-access.ts:22`). The server reads only the bearer token (`src/api/http.ts:225-227`). A cross-origin call therefore needs no `Access-Control-Allow-Credentials`.
- **Preflight.** The `Authorization` header and the JSON content type make every account call a CORS preflight request from the app origin.
- **Supabase.** `src/account/client.ts:22-26` talks to Supabase directly (auth, `user_data` cloud save at `:92-106`). `src/account/providers.ts:7` reads `${url}/auth/v1/settings`. These calls go to `*.supabase.co`, not to `/api`. The session is in `localStorage` under `kingdown.auth` (`src/account/session.ts:2`; `src/account/client.ts:24`, `:31`).
- **Sign-in in the app.** OAuth fails (section 1 and 2). The email-code sign-in uses `signInWithOtp` and `verifyOtp` with no redirect (`src/account/client.ts:70-80`; form at `src/online/entry.ts:32-35`). It is the lean first path for the app.

Endpoints the game client calls (the methods that `src/online/runtime.ts` and `src/online/entry.ts` use, from `src/online/client.ts:54-91`):

| Method and path | Client method |
| --- | --- |
| `GET /api/status` | `readWebAccountAccess` (`src/online/account-access.ts:22`) |
| `POST /api/client-errors` | error recorder (`src/diagnostics/browser.ts:32-34`) |
| `POST /api/games` | `create` |
| `POST /api/games/find` | `find` |
| `GET /api/games/:id[?since=n]` | `game` |
| `POST /api/games/:id/accept` | `accept` |
| `POST /api/games/:id/cancel` | `cancel` |
| `POST /api/games/:id/commands` | `command` (retries with the same `command_id`, `src/online/client.ts:70-75`) |
| `POST /api/games/:id/preview` | `previewDraft` |
| `POST /api/games/:id/seen` | `seen` |
| `POST /api/games/:id/invite` | `invite` |
| `POST /api/invites/preview` | `preview` |
| `POST /api/invites/redeem` | `redeem` |
| `GET /api/lobby` | `lobby` |
| `GET /api/me/games` | `games` |
| `GET` or `PATCH /api/me/settings` | `settings` |
| `POST /api/me/handle` | `handle` |
| `GET /api/me/record` | `record` |
| `POST /api/blocks` | `block` |
| `POST /api/reports` | `report` |

The client defines but the web does not call: `GET`/`PATCH /api/me/profile`, `POST`/`DELETE /api/me/deletion`, `GET`/`PUT /api/me/notifications`, `GET`/`POST`/`DELETE /api/relations` (`src/online/client.ts:81-90`). The server allows the full list in `tools/plugin-server.mjs:37-68`.

Engine versions: a page whose engine differs from a game's engine asks the server for previews (`src/account-game/engine-identity.ts:4`). An app build that is older than the server engine therefore still plays, with server previews. The API contract must stay backward compatible for app builds that wait in App Store review.

## 4. Server gates

The function entry sends `/internal/*` to the job handler and `/api/*` to the API handler (`tools/plugin-server.mjs:132-135`). Its public origin is `KINGDOWN_PLUGIN_ORIGIN` (`tools/plugin-server.mjs:77`), that is `https://kingdown.dev` in production and `https://kingdown-staging.vercel.app` in staging (`tools/staging-config.mjs:2`).

| Gate | What it does | Evidence |
| --- | --- | --- |
| Host check ("Untrusted host") | Refuses with 403 unless the `Host` header equals the public origin host. It checks `Host`, not `Origin`, so a call from `capacitor://localhost` to `https://kingdown.dev` passes. A call to `kingdown.vercel.app/api` fails. | `src/api/http.ts:55-58` |
| Cross-origin refusal | Refuses with 403 when `Origin` is present and is not the public origin, or when `Sec-Fetch-Site` is present and is not `same-origin` or `none`. The comment says "no CORS headers ever". | `src/api/http.ts:212-214` |
| No preflight answer | An `OPTIONS` request matches no route, passes the host check, then fails the origin check with 403. | `src/api/http.ts:206-214` |
| Error reports | Accepted only when `Origin` equals the public origin and `Sec-Fetch-Site` is absent or `same-origin`. Otherwise dropped with the same 204. | `src/api/http.ts:194-204` |
| Response headers | `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`; no CORS headers. | `src/api/http.ts:56`, `:190` |
| Parked MCP handler | Has the CORS pattern to copy: a fixed `allowedOrigins` set, echo of the exact origin, `Vary: Origin`, and a 204 `OPTIONS` answer with fixed methods, headers and `Max-Age: 600`. It is parked and does not serve `/api`. | `src/plugin/http.ts:45`, `:52-58`, `:74-76` |
| Vercel routes | Cache header for runtime frames; `/internal/*` and `/api/*` to the function; app routes to `/index.html`. No other headers. | `tools/plugin-server-build.mjs:22-31` |
| CSP | The site sends no Content-Security-Policy, in a header or a meta tag. Only the parked consent page has one. | `tools/plugin-server-build.mjs:22-31`; `index.html:1-16`; `src/plugin/http.ts:63` |

Fetch Metadata: Safari 16.4 and later send `Sec-Fetch-Site`, with partial support. Source: https://web-platform-dx.github.io/web-features-explorer/features/fetch-metadata.json and https://github.com/mdn/browser-compat-data/pull/19301 (read 2026-11-07). Expect `Sec-Fetch-Site: cross-site` from the app page, and verify it on the simulator.

### The smallest safe server change

Change one file, `src/api/http.ts`, in the request handler after `guard` (line 211):

```ts
// The iOS app's bundled page. Bearer tokens only: no cookies, so no credentials header.
const NATIVE_ORIGINS = new Set(['capacitor://localhost']);
const native = typeof req.headers.origin === 'string' && NATIVE_ORIGINS.has(req.headers.origin);
if (native) { res.setHeader('Access-Control-Allow-Origin', req.headers.origin!); res.setHeader('Vary', 'Origin'); }
if (native && req.method === 'OPTIONS') {
  req.resume();
  res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Max-Age': '600' });
  res.end(); return;
}
if (!native && (/* the existing origin and Sec-Fetch-Site test at line 214 */)) { /* 403 as today */ }
```

Rules for the change:

- The `OPTIONS` answer comes after the `operations` and route lookup (`src/api/http.ts:206-210`), so a preflight for an unknown path still gets 404.
- The host check (`src/api/http.ts:57`) stays as it is. The app must call `https://kingdown.dev/api` exactly (staging: `https://kingdown-staging.vercel.app/api`).
- The bearer check, the account switch, the current-user check and the admission limits stay as they are (`src/api/http.ts:223-243`).
- Add tests beside the current `src/api/http.ts` tests: the native origin gets the exact ACAO and a 204 preflight; every other origin still gets 403.

What must stay refused:

- Every other `Origin`: any https site, `http://localhost`, `null`, `ionic://localhost`, `file://`, and `https://kingdown.vercel.app` as an origin.
- A wildcard `Access-Control-Allow-Origin: *`, and any `Access-Control-Allow-Credentials` header.
- CORS on `/internal/*` (`src/api/http.ts:265-291`).
- Cross-origin error reports (`src/api/http.ts:197-198`), until the owner decides that app error reports are wanted. Then add the same native-origin test there.

Security note: every Capacitor app on iOS uses the origin `capacitor://localhost`. The allowlist does not prove that the caller is King Down. It adds no new power: a native client can already call the API with no `Origin` header, and the server accepts that today (`src/api/http.ts:214`). The bearer token is the real control. The allowlist only lets the bundled page read the answers.

Zero-server-change option: Capacitor's `CapacitorHttp` plugin with `enabled: true` patches `fetch` and `XMLHttpRequest` to use native HTTP (https://capacitorjs.com/docs/apis/http, Capacitor v8, read 2026-11-07). Native requests carry no `Origin`, so line 214 passes them. It also changes the transport of every `fetch`, Supabase included, and its support of `AbortSignal` and `cache: 'no-store'` is not confirmed. The CORS allowlist is the smaller and more standard change.

## 5. Build-time environment

| Variable | Read by | Production | Staging |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | `src/account/public-config.ts:4-17` | `https://utqzovjmclfyojedmwok.supabase.co` | `https://puhspsyjyzaghmgtkzqd.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `src/account/public-config.ts:16` | public `sb_publishable_...` value | staging public value |
| `VITE_KINGDOWN_STAGE` | `src/account/public-config.ts:11-15`; `src/account/public-config.ts:21-23`; `src/plugin/screens/setup-model.ts:33`; `src/plugin/screens/profile.ts:18` | unset | `staging` |

Behavior that the stage changes: production refuses the staging project and staging refuses the production project (`src/account/public-config.ts:13-15`); the staging test-account password form appears only in staging (`src/account/public-config.ts:21-23`, `src/online/entry.ts:39`); ranked play is offered only in staging (`src/plugin/screens/setup-model.ts:33`); the appeals link points to the stage's own site (`src/plugin/screens/profile.ts:18`). An offline build needs neither Supabase value (`src/account/public-config.ts:3`); the error throws only when the account client loads.

Where the release tools set them:

- `tools/deploy.sh:75-76` refuses a shell with `KINGDOWN_STAGE` or `VITE_KINGDOWN_STAGE`. `tools/deploy.sh:78-82` requires the production URL and a well-formed publishable key. `tools/deploy.sh:85-86` gives them only to the site build.
- `tools/release/live.sh:21-23` unsets both stage variables, exports the production URL and reads the publishable key from the live bundle with `tools/release/publishable-key.mjs`.
- `tools/release/staging.py:47-48` reads the staging key from the staging bundle and sets `KINGDOWN_STAGE=staging`, `VITE_KINGDOWN_STAGE=staging` and the staging URL.
- `tools/plugin-server-build.mjs:41-42` refuses a staging server build without the matching browser settings, and writes `staging.json` (`tools/plugin-server-build.mjs:95-97`).
- No `.env` file is in the tree; the values come from the shell.

For the app: two build configurations (Staging and Production) that run `vite build` with the same three variables as the matching site build, plus one new public value for the API origin (for example `VITE_KINGDOWN_API_ORIGIN`, empty on the web). A guard in the style of `public-config.ts` must refuse a staging API origin in a production build and the reverse.

## 6. The `.well-known` folder

- Today `public/` has no `.well-known` folder (directory list, 2026-11-07). It held the parked OpenAI domain challenge (`tools/plugin-server-build.mjs:23-28`).
- `vite.config.ts:77` leaves `.well-known/` out of the offline version hash and file lists. `public/sw.js:18` marks `/.well-known` private, so a service worker never caches it.
- A parked build deletes the whole `static/.well-known` folder (`tools/plugin-server-build.mjs:90`). `tools/vercel-check.mjs:39-40` asserts that the parked tree has no `static/.well-known` and no route that matches `well-known`. `PARKED_PATHS` lists only the two OAuth metadata paths and the OpenAI challenge (`tools/chatgpt-plugin.mjs:10`).

Apple's rules: a file named `apple-app-site-association` with no extension, in `.well-known`, over https with a valid certificate "and with no redirects"; the Apple CDN fetches it within 24 hours, and devices check about once a week. Source: https://developer.apple.com/documentation/xcode/supporting-associated-domains (read 2026-11-07 through its JSON form). Serve it as `application/json` as a safe default.

kingdown.dev can serve it. The change has four parts:

1. Add `public/.well-known/apple-app-site-association` with `applinks.details[].appIDs: ["6M9C2YSWT4.<bundle id>"]` and components for `/j`, `/g/*` and `/play/*`.
2. In `tools/plugin-server-build.mjs:90`, delete only `static/.well-known/openai-apps-challenge` in a parked build, not the folder.
3. In `vercelRoutes`, add `{ src: '^/\\.well-known/apple-app-site-association$', headers: { 'Content-Type': 'application/json' }, continue: true }`, in the same form as the parked challenge route (`tools/plugin-server-build.mjs:27`).
4. In `tools/vercel-check.mjs:39-40`, allow that one file and that one route, and keep the refusal of every other `.well-known` file. The live check already compares every public file byte for byte (`tools/deploy.sh:26-27`).

The domain is apex `kingdown.dev` with `www` on the same address (`docs/HOSTING.md`, "Domain and DNS"). The app entitlement must name `applinks:kingdown.dev`. Invite links already use `https://kingdown.dev/j#<token>` (`src/api/http.ts:121`, `:136`), so they become universal links with no client change. This needs a deploy, so it waits for the owner's word.

## Lean change list (client), in order

1. `src/online/routes.ts:15`: accept the app scheme with host `localhost`, and nothing else.
2. One API origin constant: pass it to `onlineClient` (`src/online/entry.ts:92`), and use it in `src/online/account-access.ts:22` and `src/diagnostics/browser.ts:32-34`. Empty on the web.
3. `src/online/cache-policy.ts:22-23`: in the native build only (a build-time flag), send at once. Do not weaken the web gate: a browser with service workers off can still hold old caches.
4. Sign-in in the app: email code only at first. Hide the OAuth buttons in the native build.

## What can wait

- Universal links and the AASA file (section 6).
- OAuth and Sign in with Apple through `ASWebAuthenticationSession`.
- A native storage adapter for the Supabase session (supabase-js accepts a `storage` option; `src/account/client.ts:23-26`).
- A native "open in browser" seam for `openLink` (`src/online/runtime.ts:176`).
- Removal of `sw.js`, the inline registration and the web manifest from the app bundle (they are harmless).
- App error reports through `/api/client-errors`.
