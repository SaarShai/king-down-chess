# Map the hosting routes and the worker scope

Type: research
Status: resolved
Blocked by: none
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:research

## Question

What is the smallest correct change to serve the website API and the account-play routes (`/play/`, `/play/<screen>`, `/g/<id>`, `/j/<token>`) from the one deploy output, and to keep private replies out of the offline service worker?

Answer: the dispatch and route entries for each path, with direct-route reload and asset paths; whether the API handler needs any change to run in the same function as `/mcp`; the worker change (which requests bypass it, how old cache entries go, how an old worker upgrades before the first private request); which per-account limits protect `/mcp` today and do not protect `/api`, and the smallest way to share them; which probes the deploy checks need.

## Evidence to start from

`tools/plugin-server-build.mjs`, `tools/plugin-server.mjs`, `vercel.json`, `tools/vercel-check.mjs` (it asserts that `/api` gives 404 today), `tools/deploy.sh`, `tools/deploy-live-check.mjs`, `docs/HOSTING.md`, `vite.config.ts`, `public/sw.js`, `src/api/http.ts`, `src/plugin/http.ts`, migration `0014_plugin_tool_tries.sql`. Vercel documentation for routes and functions.

## Why it matters

Phase 1 (the worker fix) and phase 2 (the first served route) depend on these facts. [Choose the web release route and stop conditions](17-release-route.md) uses the probe list.

## Answer

Research: [research-routes.md](../../../research/web-adaptation-2026-10-18/research-routes.md) (reviewed: sound).

- **Output.** Keep the one build output (static files plus the one server function). Add route rules in the site build: `^/api(?:/.*)?$` to the function (all methods); `^/play(?:/.*)?$`, `^/g/[^/]+/?$` and `^/j/?$` to a new `play.html` (GET, HEAD), with `Cache-Control: no-store` and `Referrer-Policy: no-referrer` on the account shell. No site-wide HTML catch-all. Amended at [ticket 18](18-approve-spec.md) approval, from [ticket 13](13-routes.md): the invite is in the fragment (`/j#<token>` or `/j#<CODE>`), and `/j/<token>` returns 404.
- **Dispatch.** In the server entry, build the API handler from the same store and game service, with the account service, the safety service, the public origin and the website verifier. Dispatch `/api` (with a path boundary) before MCP. The handler needs no signature change to mount.
- **Assets.** The current Vite base `./` breaks on deep routes. The combined deploy build uses base `/`; the account page uses root paths for fonts, icons and `/sw.js`.
- **Limits.** The API and MCP have separate engine counters, and the API shares none of the per-account tool budgets (computer, create/find, report). Share one admission gate per server instance (4 total, 3 per account) and call the existing counter rows from both transports, with the same keys. No migration change is needed for the same keys.
- **Worker.** Bypass the cache for any request with an `Authorization` header, any non-GET, other origins, `/api`, `/mcp`, auth and consent paths, metadata, `/internal`, `/play`, `/g` and `/j`. Cache only an allowlist of public build files. Precache the local entry only. Activation already deletes old `kingdown-` caches; keep it.
- **Privacy gate.** The account page holds private calls until the controlling worker answers a cache-policy message after activation. An old worker cannot answer, so the page never mistakes it for the new one. The gate also sits at the browser API call boundary. The reply waits for a successful, repeatable purge of old application caches; after a worker restart with no completed purge, the worker purges again before it answers; on a purge failure, private calls stay closed (decision review: activation can complete before its handler ends). The upgrade checks include an interrupted activation and a failed cache deletion.
- **Probes.** Replace the "no API" checks in `tools/vercel-check.mjs` with route, reload, asset and unsigned-401 probes; add an old-worker browser journey (`web-online`) before publication; extend the live check with the account shell, assets, worker bytes and a known-path 401.
