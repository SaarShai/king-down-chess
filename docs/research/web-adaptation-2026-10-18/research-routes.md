# Research: Map the hosting routes and the worker scope

Date: 2026-10-18. Source: `claude/release-candidate` at `442c5eb3` and main at `38a6bbff`. A reviewer checked the main claims against the code.

> Plan references marked `P:` or `web-adaptation/issues/NN` use the independent plan's ticket numbers. In the final plan: 06 → 10 (account entry), 08 → 13 (routes), 10 → 15 (public safety), 11 → 07 (engines), 12 → 08 (release evidence), 13 → 16 (test gate), 15 → 17 (release route).

## Question

What is the smallest correct change to serve the website API and the account-play page routes from the one deploy output, and to keep private replies out of the offline service worker?

## Answer

Keep the static site and current server function in one build output (`R:tools/plugin-server-build.mjs:29–75`).
Send `/api` and its child paths to that function, then add API dispatch (`R:tools/plugin-server.mjs:52–60`; finding 2).
Serve one separate account HTML entry at the four requested page routes, with asset URLs from the site root (`R:vite.config.ts:63–70`; findings 2–3).
Use the website verifier and current store, game, account, and safety services (`R:src/api/http.ts:28–39,61–67`).
Share request slots and account budgets across MCP and the API (`R:src/plugin/http.ts:80–84`; `R:src/plugin/service.ts:15–31`; findings 5–6).
Let the worker cache only known public files, and delete old cache generations (`R:public/sw.js:26–29,49–68`; finding 7).
Hold private requests until the current worker confirms the safe cache policy after activation (`R:vite.config.ts:22–29`; proposed gate in finding 8).
Extend the deploy probes; production request-path behavior and live account settings remain **unverified** (`R:tools/vercel-check.mjs:111–114`; finding 9 and the live-check list).

## Findings

1. **The release build already has the required output shape.**

   Source key: `R` means commit `442c5eb3840164b05d579c03b9fce2a9136d31f9` on `claude/release-candidate`. `M` means commit `38a6bbffb3b85f10bb9e6d23e8e1f394b781b4f4` on `main`. Each code citation below names one of these commits. Plan citations name files in the supplied `web-adaptation/` folder. Proposals below describe changes; they do not claim a build pass.

   The builder writes `static/`, `functions/mcp.func/`, and `config.json` under `.vercel/output`. It copies the site into `static/`. The function contains the server, consent files, board resource, and engine runtime. Existing function aliases serve consent, metadata, and internal jobs. The function config sets a 30-second maximum duration. Keep this structure. Add no second API bundle or deploy project. Sources: `R:tools/plugin-server-build.mjs:29–75`; [Vercel static files and functions](https://vercel.com/docs/build-output-api/primitives).

   `R:vercel.json:1` contains `{}`. The output builder owns the route table. The deploy path publishes that prebuilt tree. Thus a change only to `vercel.json` does not implement the required output routes. Main still has the older `/authorize` redirect to the separate plugin origin. Use the final reviewed release merge as the base. Sources: `M:vercel.json:1–9`; `R:tools/deploy.sh:172–186,213–225`; `R:package.json:37`; `web-adaptation/issues/12-release-evidence.md:15–33`.

   The hosting document contains two different records. Its Site section still names the separate plugin project. Its Deploy section describes the combined output and says it serves no website API. Treat these as source records, not proof of current live settings. Update both sections with the accepted release state. Sources: `R:docs/HOSTING.md:7–15`.

2. **Add four bounded route rules, and add API dispatch before MCP.**

   Change points: `R:tools/plugin-server-build.mjs:15–26,70–75` and `R:tools/plugin-server.mjs:52–60`. Add these rules in the `site` build only. Keep the existing art headers, challenge header, internal route, and function aliases.

   | Incoming pathname: exact `src` pattern | `dest` | Methods | Result |
   |---|---|---|---|
   | `^/api(?:/.*)?$` | `/mcp` | All methods | Run the API handler with the original API path and query. Let that handler decide 401, 403, 404, 405, or a valid reply. |
   | `^/play(?:/.*)?$` | `/play.html` | GET, HEAD | Serve the account shell for `/play`, `/play/`, and child screens. |
   | `^/g/[^/]+/?$` | `/play.html` | GET, HEAD | Serve the same shell for one game ID segment. |
   | `^/j/[^/]+/?$` | `/play.html` | GET, HEAD | Serve the same shell for one invite token segment. |

   Here `play.html` is the proposed new root-level HTML input and output file. Add `Cache-Control: no-store` to the three account-shell rules. Apply it to direct `/play.html` access too. Add `Referrer-Policy: no-referrer` to the account shell, so an invite page does not send its token URL as a referrer. These are proposed response policies. The current consent handler supplies the same referrer policy at its own boundary. Sources: `R:src/plugin/http.ts:61–66`; `web-adaptation/issues/08-routes.md:27–35`; [Vercel route fields](https://vercel.com/docs/build-output-api/configuration#routes).

   Match `/api` with a path boundary in the server dispatch. Run `api(req, res)` before the final `mcp(req, res)` call. Keep `/internal` and art dispatch. Do not send page routes through MCP. Do not send unknown API paths to the HTML shell. The API has no bare `/api` route, so bare `/api` still returns a JSON 404. A known API route with no token instead returns 401 when website verification is configured. Sources: `R:tools/plugin-server.mjs:56–60`; `R:src/api/http.ts:70–95,104–116`.

   The proposed rules reserve only the named route families. They leave `/assets/`, `/fonts/`, `/plugin-art/`, legal pages, `/sw.js`, and `/` to the current file/function lookup. They need no site-wide HTML catch-all. If a later design puts static files under `/play/`, put a filesystem phase before its page fallback, or move those files to a public asset path. Vercel defines a filesystem phase for rules after a file miss. Source: [Vercel handler routes](https://vercel.com/docs/build-output-api/configuration#handler-route).

   A rewrite keeps the browser URL. It does not by itself prove the function's `req.url`. The project check expects the original path after a rewrite. Official CLI source also keeps the original pathname for a function call. Current platform docs describe an explicit request-path transform as the way to override `req.url`. Production preservation for this exact output remains **unverified** here. Use no request-path transform and no token-bearing query rewrite. Require the unsigned live API probe in finding 9. Sources: `R:tools/vercel-check.mjs:54–62`; [Vercel rewrites](https://vercel.com/docs/routing/rewrites); [official CLI source](https://github.com/vercel/vercel/blob/main/packages/cli/src/util/dev/server.ts#L3182-L3199); [request-path transforms](https://vercel.com/docs/build-output-api/configuration#source-route-transform).

3. **Build a separate account page, and fix its asset base.**

   The current HTML starts `/src/entry.ts`. It is the local app entry, not an account route shell. Keep it at `/`. Add the proposed `play.html` and a separate account entry module. Add both HTML inputs to the Vite build at `R:vite.config.ts:70`. The installed package range is Vite 8; use its supported multiple-input setting. Sources: `R:index.html:284`; `R:vite.config.ts:62–71`; `R:package.json:61`; [Vite multiple HTML inputs](https://vite.dev/guide/build#multi-page-app).

   The current `base` is `./`. A rewrite to a root HTML file leaves the document at its original deep URL. Thus a generated `./assets/...` URL can resolve under `/play/`, `/g/`, or `/j/`. The smallest site-build fix uses base `/` for the combined deploy build at `R:package.json:37`. Keep the ordinary relative build if its sub-path use is still required. Vite accepts a build base option and applies it to HTML, imported assets, and CSS URLs. Sources: `R:vite.config.ts:63–65`; [Vite public base path](https://vite.dev/guide/build#public-base-path).

   Give the new HTML root-based public URLs, such as `/fonts/...`, and use `/sw.js` for worker registration. Do not copy the local HTML's `./fonts/`, `./manifest.webmanifest`, or `./icons/` paths into a deep-route page unchanged. Check generated scripts, styles, module preloads, lazy chunks, fonts, art, and engine worker URLs from each direct route. Sources: `R:index.html:12–15`; `R:vite.config.ts:25–28,65`; `web-adaptation/inventory.md:103–114`.

   The account shell reads the browser path and checks the account and seat through the API. Opening `/j/<token>` shows a preview; it does not join. After an explicit successful Join, replace the token URL with `/g/<id>`. Unknown account screens need a complete error exit. The route patterns are shell selection, not ID, token, or seat validation. Sources: `web-adaptation/issues/08-routes.md:15–35`; `R:src/match/service.ts:204–209,378–389`.

4. **Mount the existing API with its required services and website verifier.**

   At `R:tools/plugin-server.mjs:17`, extend the API import to include `createApiHandler` and `sessionVerifier`. At lines 52–54, use the same `PostgresMatchStore` and `GameService` to make the API handler. Supply `new AccountService(store)`, `new SafetyService(store)`, `publicOrigin`, and the website verifier made from the configured Supabase origin. These are the exact required API options. Sources: `R:src/api/http.ts:28–39,61,67`; `R:src/online/accounts.ts:33–34`; `R:src/online/safety.ts:32–33`.

   The website verifier accepts signed, unexpired website tokens with audience and role `authenticated`, a non-anonymous claim, and a UUID subject. It refuses tokens with an OAuth `client_id`, including MCP tokens. Do not reuse the MCP resource verifier or accept an actor from request data. No new package is required for this wiring: the project already lists `jose`, `pg`, and `zod`. Sources: `R:src/api/http.ts:24–39,110–117`; `R:package.json:44–47`.

   No API signature change is required merely to mount it. The server build already bundles imports and provides the isolated match runtime. Shared limits require the small boundary change in findings 5–6. Sources: `R:tools/plugin-server-build.mjs:47–59`; `R:src/api/http.ts:61–67`.

   Keep the single fixed public origin equal to the site origin. The API compares the incoming Host and Origin with it. A separate plugin origin does not work for same-origin website calls. The current shared startup also requires MCP readiness, provider discovery, consent files, board files, and database checks. An error there returns 503 for the API too. Mounting the handler does not remove those dependencies. Sources: `R:src/api/http.ts:48–51,101–103`; `R:tools/plugin-server.mjs:22–50,73–75`.

   The website verifier checks the token locally against public signing keys. Its source documents a validity window after sign-out or ban, up to token expiry. Mounting it does not add current account-status checks. Resolve the sensitive-operation status policy before exposure. Sources: `R:src/api/http.ts:24–38`; `web-adaptation/spec.md:174–179`.

5. **Keep the API guards, but share its engine capacity with MCP.**

   The API sets `Cache-Control: no-store` and `nosniff` before its route or identity checks. It refuses a foreign Host, a foreign Origin, and `Sec-Fetch-Site` values other than `same-origin` or `none`. It sends no API CORS permission. It limits declared and streamed request bodies to 16 KiB. Keep these guards. They do not prevent a direct non-browser caller with a valid token. Sources: `R:src/api/http.ts:18,48–58,99–119`.

   Its current engine counter permits four simultaneous create/command calls per handler instance. Reads have no such slot. MCP has a different counter with four total slots and three slots per account. One function does not merge these closures. Without a change, one process can admit four MCP requests plus four API engine requests. Sources: `R:src/api/http.ts:19–20,98,107–125`; `R:src/plugin/http.ts:7–10,47–48,80–84`.

   The smallest common bound is one admission gate per configured server instance. Make it at `R:tools/plugin-server.mjs:52–54` and supply it to both handlers. Keep four total authenticated request slots and three per account across both surfaces. Take an API slot after verified identity and before body/service work. Keep the MCP admission callback before its slow provider check. Release each slot in `finally` after service work settles, including disconnects. Replace the API-only engine counter with this common gate; do not keep two independent four-worker allowances. This also bounds new API operations that can start an engine. Change points: `R:src/api/http.ts:61,98–125`; `R:src/plugin/http.ts:11–18,47–48,78–105,106–135`.

   This is a proposed shared instance bound. It is not an account-wide concurrency guarantee across all Vercel instances. Use the database budgets below for limits across instances. The function's 30-second duration setting is separate from request admission. Sources: `R:tools/plugin-server-build.mjs:62`; [Vercel function configuration](https://vercel.com/docs/build-output-api/primitives#serverless-function-configuration).

6. **Share operation budgets, without a second store or an MCP call from the API.**

   | Protection in the current MCP path | Current bound | Does the API share it? |
   |---|---|---|
   | Active requests in one instance | 4 total; 3 per account | No. Finding 5 describes the separate API cap. |
   | Computer tool attempts | 120 per 60 seconds per account | No. API computer actions call the game service directly. |
   | Create and Find tool attempts | One shared 60-per-60-second budget per account | No. API Create calls the game service directly. |
   | Open-board tool attempts | 60 per 60 seconds per account | No. This budget concerns plugin board creation. |
   | Report tool attempts | 30 per 3,600 seconds per account | No. API reports call the safety service directly. |
   | Short-code preview/join attempts | 10 per hour per account | Yes, when both call the shared invitation methods. Token links do not use this short-code budget. |

   Sources: `R:src/plugin/http.ts:7–10,80–84`; `R:src/plugin/service.ts:15–31`; `R:src/plugin/server.ts:70–74`; `R:src/api/http.ts:72–94`; `R:src/match/service.ts:369–389`; `R:src/match/store.ts:105–111`.

   The tool counter uses one database row per account and tool key. Its atomic upsert counts attempts before service work. A separate commit keeps the count when the later action fails. Find maps to the Create key. The migration permits only four named keys. RLS and revoked client grants keep browser clients from updating the counters. Sources: `R:src/plugin/service.ts:15–31`; `R:src/plugin/server.ts:71–74`; `R:supabase/migrations/0014_plugin_tool_tries.sql:4–12`.

   Move the existing constants and counter operation to one shared server limits module. Call it at both transport boundaries after identity and bounded input handling, before the selected service operation. Map API Create and future Find to `kingdown_create`; map a validated command with action `computer` to `kingdown_computer`; map reports to `kingdown_report`. Keep `kingdown_open` at the plugin boundary. Do not charge a browser page load, game poll, or profile read as a new plugin board. Use the same account ID and current database keys. Do not make the API use the whole `PluginService`, and do not charge twice through nested calls. Change points: `R:src/plugin/service.ts:15–32`; `R:src/plugin/server.ts:70–74`; `R:src/api/http.ts:72,79,94,112–123`; command shape: `R:src/match/protocol.ts:36`.

   Reusing the keys needs no migration change. A renamed or extra key does need a change to the migration constraint and release checks. The current startup checks counter access and write grants. Keep those checks. Sources: `R:supabase/migrations/0014_plugin_tool_tries.sql:6,9`; `R:tools/plugin-db-check.mjs:10,16–19,34–38`.

7. **Replace the worker's open asset cache with a public-file allowlist.**

   The worker sends every same-origin GET that is not a navigation to `asset()`. That function looks up by URL with both query and Vary checks disabled. It then stores each successful basic response. Thus an API GET can persist a private reply, and a later request can receive it from Cache Storage without a network identity check. The online client already sends request `cache: 'no-store'`; this does not fix the explicit Cache API path. Sources: `R:public/sw.js:49–64`; `R:src/online/client.ts:31–37`; [Cache API and HTTP cache headers](https://developer.mozilla.org/en-US/docs/Web/API/Cache); [request cache mode](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache).

   At `R:public/sw.js:61–68`, bypass these requests before either cache lookup or write. Let the browser use the network path without `respondWith`:

   - Any request with an `Authorization` header.
   - Any non-GET request, and any request to another origin.
   - `/api` and `/mcp`, with their child paths.
   - `/authorize`, `/consent.mjs`, reserved `/auth` and its child paths, and any selected sign-in callback URL.
   - The OAuth resource metadata paths and `/internal` paths.
   - `/j`, `/g`, and `/play`, with their child paths and queries; also direct `/play.html` access.

   Use path boundaries, so `/api` does not mean an unrelated name such as `/apiculture`. If sign-in returns at the local root, exclude its callback request from the offline page path too. Some listed paths are public metadata or static shells. Bypassing the complete account route family gives it one clear cache rule. Sources for current special routes: `R:src/plugin/http.ts:60–77`; `R:src/api/http.ts:69–95,140–148`; plan route policy: `web-adaptation/spec.md:227–231`.

   After these exclusions, cache only exact public file paths from the build. Generate the allowlist with the offline build. Exclude account HTML, API/data paths, auth output, the worker script, and metadata. Keep the local root/index offline page as a separate case. An extension check alone is not a public-file test. Keep query/Vary relaxation only inside this known public-file set, if offline assets still need it. At `asset()` and `page()` writes, also refuse a response with `no-store`; this is a second guard, not the cache boundary. Change points: `R:public/sw.js:33–58,61–69`; `R:vite.config.ts:46–57`.

   Keep the local offline graph separate from the account entry. The build currently walks every entry chunk and then precaches almost every output file. With two entries, start that walk from the local entry only. Exclude `play.html` from precache. Account-only chunks can load as ordinary public assets when needed. Keep the account client exclusion. Change points: `R:vite.config.ts:11–12,31–44,48–55`.

   A worker-template change already changes the content version. Installation uses the new cache name. Activation already deletes every older `kingdown-` cache before it claims clients. Keep that sequence. It retires old private entries along with old public entries. Do not delete local game saves or unrelated origin storage. A purge from the page while the old worker still runs is not a replacement: the old worker can open the old cache name again. Sources: `R:vite.config.ts:49–55`; `R:public/sw.js:13,16–30`; [CacheStorage.open](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage/open); [cache deletion semantics](https://w3c.github.io/ServiceWorker/v1/#cache-storage-delete).

8. **Prove that the safe worker controls the page before the first private API call.**

   The present registration waits for page load and board readiness. It can wait about a minute before registration, then wait again for board readiness. It registers `./sw.js`. That is too late for a new account boot and gives the wrong worker URL on a deep route. Change point: `R:vite.config.ts:22–29`. Keep delayed registration only for local play. Give the account entry an early privacy gate. Also put the gate at the common browser API call boundary, so a new caller cannot omit it. Change point: `R:src/online/client.ts:30–34`.

   Use this sequence as the proposed gate:

   - Register `/sw.js` with scope `/` and update-cache policy `none`. Ask the registration to update. Observe worker and controller changes from the start.
   - Hold private calls while an old worker controls the page. An active registration, a resolved `update()`, or `navigator.serviceWorker.ready` alone does not identify a safe controller.
   - The new worker keeps `skipWaiting()`. During activation, it finishes old-cache deletion, then calls `clients.claim()`.
   - Ask the current controller for a cache-policy capability through a message port. Add the worker reply at `R:public/sw.js:26–31`, after its activation work can complete. Require the expected policy reply and confirm that the controller still matches. Repeat this check on a controller change.
   - Open the private-request gate only after that reply. On offline update failure, timeout, or an unknown controller, show a retry/update state and send no private API request. Keep local offline play available. A browser with no service-worker support has no worker to clear.

   This capability exchange is a proposed application protocol. The platform supplies the update, activation, control-change, and messaging APIs. An old worker has no such reply, so the page cannot mistake it for the new policy. Sources: `R:public/sw.js:16–30`; [registration update](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update); [ready](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/ready); [controller](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controller); [worker message ports](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/postMessage).

   Do not use a fixed delay, only `ready`, only a cache purge, or only request `no-store` as proof. Do not claim a worker-first release reaches every dormant browser. The gate remains necessary when the account page later opens. The new worker's public-file rule also protects stale tabs after takeover. The activation algorithm terminates the old active worker; this report does not assume every old fetch survives activation. Sources: [worker activation](https://www.w3.org/TR/service-workers/#activation-algorithm); `web-adaptation/spec.md:229–230,269`.

9. **Replace the current API-refusal probes and add route, cache, and shared-limit probes.**

   `tools/vercel-check.mjs` currently requires no API function or route and asserts 404 for API requests. Its HTTP shim models only a small part of platform routing. Keep the assertion that no separate `api.func` exists. Replace the no-API-route assertion with the rewrite check. Its final served-path set and success text also require the old shape. Change points: `R:tools/vercel-check.mjs:1–2,30–32,54–63,111–114,121–122`.

   | Check boundary | Required probes | Change point or source |
   |---|---|---|
   | Built output and HTTP dispatch | Require the API rewrite to the existing function. Require `static/play.html` and its account entry. Check `/`, `/play/`, `/play/profile`, `/play/settings`, `/g/<fixture-id>`, and `/j/<fixture-token>` on direct load and reload. Verify the account shell, not just status 200. Keep a JSON 404 for bare/unknown API paths, a 405 for a wrong method on a known API path, and a 404 for a missing asset. | `R:tools/vercel-check.mjs:26–32,54–68,111–122`; route cases: `web-adaptation/issues/08-routes.md:25–35`. |
   | Unsigned API | Require 401 and `no-store` at `GET /api/me/games` and `POST /api/games`; require JSON and the API Bearer challenge. Require 403 for cross-origin or wrong-host calls. A startup 503 does not pass. | `R:src/api/http.ts:48–51,103–116`; existing source assertions: `R:src/api/http.test.ts:41–76`. |
   | Signed local API and cross-surface service | Use local signing keys and a disposable database. Check one website read and command, seat refusal, MCP-token refusal, body limits, shared slots, shared Create/Find/computer/report counters, and short-code limits. Include a disconnect while service work continues. The compiled server path must also receive coverage. Use no production verifier fallback or dev actor header at the website API. | `R:src/api/http.db.test.ts:45–60`; `R:src/api/http.test.ts:14–25,41–76`; `R:src/plugin/http.ts:106–135`. |
   | Asset resolution | Resolve module, style, preload, lazy-chunk, font, art, and worker URLs against each deep route. Require real file bytes and correct types. Keep root local links and offline assets working. | `R:tools/vercel-check.mjs:67–89`; `R:vite.config.ts:63–70`; `web-adaptation/spec.md:298–305`. |
   | Real browser worker | Start with the old worker and old cache. Seed private-looking entries and a query variant. Navigate directly to each account route. Prove zero private fetches before the capability reply. Prove old-cache deletion, network reads after account switch, no new private entries, and local offline play. Include update failure and two tabs. Do not substitute an HTTP-only check. | `R:public/sw.js:26–29,49–68`; `web-adaptation/spec.md:269`; `web-adaptation/issues/13-test-gate.md:23–33`. |
   | Existing plugin paths | Retain MCP, consent, both resource metadata paths, domain challenge, art headers/bytes, internal job authorization, and engine archive probes. | `R:tools/vercel-check.mjs:33–40,69–109,116–121`; `R:tools/deploy.sh:190–206,225`. |

   The HTTP shim needs to honor the new page-method restrictions. If the implementation adds routing phases, the shim must handle them or stop claiming to model them. Current code assumes each route has `src` and ignores `methods`. A passing shim does not prove production routing. Source: `R:tools/vercel-check.mjs:54–62`; [Vercel route methods and phases](https://vercel.com/docs/build-output-api/configuration#routes).

   Extend the unsigned site live check to compare the account entry and its files from every route above. Check HTML content type, shell identity, asset bytes, and `no-store` where required. Add the unsigned known-API 401 probe to prove that the deployed rewrite reaches the API with the original path. Check `/sw.js` bytes against the build, as well as a policy identifier. Keep redirects explicit where their behavior matters. Current live code checks only the local entry bundle, legal pages, and optional challenge. It follows most redirects and does not inspect these new route or worker properties. Change points: `R:tools/deploy-live-check.mjs:18–37,43–69`.

   Add the future `web-online` browser check to the deploy path before publication. It needs the worker cases above; the unsigned live checker cannot prove them. Preserve `build:vercel`, the prebuilt artifact copy, the existing plugin checks, and the one publish command. Update release descriptions that still say no website API. Change points: `R:tools/deploy.sh:184–204,213–225`; `R:docs/HOSTING.md:14–15`; planned check name: `web-adaptation/issues/13-test-gate.md:23`.

## Facts that need a live check

All items below remain **unverified** in this source-only review. This list describes later approved work. It authorizes no call now.

- **The deployed source and route output.** The release owner identifies the deployed commit and artifact from the approved release record. After an approved publish, the unsigned deploy checker probes known API paths, direct account routes, static assets, and worker bytes. A JSON API 401 confirms dispatch; a shell 200 or startup 503 does not. Sources: `R:tools/deploy.sh:172–186,213–225`; `R:tools/deploy-live-check.mjs:43–69`.
- **Production request-path preservation.** The release owner runs the known-path API probe on the approved build. A later approved test-account request also checks a game ID path and its `since` query. This closes the production gap in finding 2. Sources: `R:src/api/http.ts:73–77,123`; official CLI source cited in finding 2.
- **Website identity and token settings.** An approved tester uses Google and GitHub test accounts. The tester checks return paths, refresh, expiry, account switch, sign-out, and the same user/game across website and plugin. The account owner checks allowed callback URLs, signing-key settings, and effective revocation behavior in the provider settings. Local token rules do not prove those settings. Sources: `R:src/api/http.ts:24–39`; `web-adaptation/issues/06-account-entry.md:23–31`.
- **Schema, runtime grants, and effective counters.** The database owner supplies an approved read-only report for migration 0014, runtime grants, and the counter constraint. Do not include account IDs or secret values in this report. Local tests prove counter behavior on a disposable database; a read-only production report proves installed structure, not successful future writes. Sources: `R:supabase/migrations/0014_plugin_tool_tries.sql:4–12`; `R:tools/plugin-db-check.mjs:10,16–19,34–38`.
- **Installed-browser worker state.** An approved tester checks an existing installation and a controlled old-worker fixture on the supported browsers. The tester records the controlling worker policy, update result, cache names/paths without private payloads, and first-private-request order. An unsigned Node fetch cannot show these facts. Sources: `R:tools/deploy-live-check.mjs:43–50`; `web-adaptation/spec.md:269,274–276`.
- **CDN and project cache overrides.** The hosting owner checks live settings and unsigned response headers. Confirm that no higher-priority CDN cache header enables private storage. Source: [Vercel cache header precedence](https://vercel.com/docs/caching/cache-control-headers).
- **Active-engine support and recovery build.** The release owner obtains the approved read-only engine report and names a compatible recovery build. The current deploy path can skip the engines-in-use check when its input is absent. Source: `R:tools/deploy.sh:190–194`; `web-adaptation/issues/12-release-evidence.md:25–33`; `web-adaptation/issues/15-release-route.md:25–31`.

## Effect on the plan

- **Ticket 01 and ticket 12:** keep this report pinned to `R` and `M`. Recheck the final release merge before implementation. The plan map still names an earlier candidate; the baseline ticket records the later head. Sources: `web-adaptation/map.md:17`; `web-adaptation/issues/01-baseline.md:31–35`; `web-adaptation/issues/12-release-evidence.md:15–33`.
- **Phase 1:** make the positive public-file cache boundary, old-cache retirement, and worker capability reply part of the common base. A worker-first release alone does not close the private-request gate. Sources: `web-adaptation/spec.md:229–230,298`; findings 7–8.
- **Phase 2 and ticket 08:** add the separate HTML input, site-root asset base, exact output routes, API service construction, dispatch, and browser privacy gate. Do not expose all current API writes merely because the handler mounts. Keep only the phase's complete operations available. Sources: `web-adaptation/spec.md:299`; `web-adaptation/issues/08-routes.md:25–39`; findings 2–5 and 8.
- **Ticket 03 and phases 3–6:** make shared account admission and budgets a condition of API exposure. Keep the existing short-code counter. Add the missing HTTP operations through the same services as each slice arrives. Route wiring alone does not provide lobby, Find, preview, or the newer account queries. Sources: `web-adaptation/issues/03-http-contract.md:21–42`; `web-adaptation/spec.md:300–303`; finding 6.
- **Ticket 06:** retain the website verifier, but resolve and check current account-status behavior separately. A valid signature does not prove a current provider session. Sources: `web-adaptation/issues/06-account-entry.md:23–31`; `web-adaptation/spec.md:178`; finding 4.
- **Tickets 13 and 15, and phase 8:** require built-route reloads, actual asset fetches, mixed-surface limits, and an old-worker browser journey before publication. Keep the unsigned live checks free of player sessions. Put approved account and database evidence in the release packet. The one deploy path remains sufficient. Sources: `web-adaptation/issues/13-test-gate.md:15–37`; `web-adaptation/issues/15-release-route.md:23–35`; `web-adaptation/spec.md:305`; finding 9.

This report uses code, supplied plans, and public documentation only. I run no tests, browser checks, game runs, deploys, sign-ins, or project-service calls. I write only this answer file.
