# Choose the web release route and stop conditions

Type: grilling
Status: resolved
Blocked by: 03, 06, 07, 08, 15
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:grilling

## Question

How does each approved web slice reach the public site with no damage to the plugin or to stored games?

## Rule

A release uses one tested source tree, one deploy path and a recovery build that reads the live data.

## Options

1. Release small complete slices through the existing one-project deploy path.
2. Make a second backend and deploy project for the web.
3. Replace the whole site in one final release.

Recommended: 1. One account and game pool, the existing release checks, and a publish go for each slice.

On yes: add `/api` and the account-page routes to the existing output builder and server dispatch, with the change points from [Map the hosting routes and the worker scope](06-hosting-routes.md). Check direct-route reload, cache headers and assets in the built tree. Keep `/mcp`, consent, metadata, art and the internal job routes intact. Use `tools/deploy.sh` only for an approved publish.

Before exposure: retire the unsafe worker cache path; confirm the website session settings with test accounts; apply only missing migrations, in order; keep user data and every engine that a game uses; keep email cron off; record each job's HTTP outcome, not only its scheduler status.

Rollback restores a compatible earlier build through the same deploy path. It does not reverse data migrations or delete new games. If an earlier build cannot read new states, account play stays off until a compatible fix is ready; local play stays on.

## Stop conditions

No publish with an unknown source tree, an unsafe cache, missing API authorization, skipped required database checks, unverified engine support for active games, an open public safety choice, or no owner publish go.

## Pass criterion

The packet names the source, the static and server outputs, the migration and grant state, route probes, device results and the recovery build. The owner sees the exact release scope before a publish.

## Answer

Decided by delegation (owner, 2026-10-18: "regarding \"my decisions\" - please use your best judgement. i trust you to make the decisions."). Three independent reviews (facts; risk and recovery; smallest and runnable) checked the draft and gave 5 required changes; all are in. The full route: [release-route.md](../release-route.md).

- **Option 1.** Small complete slices through the one-project deploy path (`tools/deploy.sh --publish` from a fresh `origin/main`). Each slice: a `codex/web-*` branch, a PR, the gate of [the test gate](16-test-gate.md), an independent reader, the owner's merge word, then a separate publish go for its exact scope. The branch takes no parked branch as a base.
- **Order.** Web-only work first, while the plugin session keeps `src/plugin/`: (1) the safe worker (public-file allowlist, purge, policy reply), published first; (2) the `/api` dispatch in the same server function, closed, merged with no publish of its own; (3) the account page, after the handover of the shared screens, with identity and reads only; then one slice per game phase. Account routes and operations stay closed to direct calls until their slice opens them.
- **Gates of the first account publish (slice 3).** The game GET is read-only (seat activity becomes its own protected write). A tested server-side account-off switch closes the web `/api` operations and the account page's private calls without a code change; prefer a database setting read with a short cache, set by the owner through the approved SQL procedure, because a host environment key needs a new deployment. Without the switch, slice 3 does not publish.
- **Recovery.** A compatible earlier build reads the current data: it keeps the engine archive and every alias, the add-only migrations and the safe worker policy. It is tested on post-slice states in a disposable database with exactly the production migration list, in order. It goes out through the same deploy path with the owner's words. If no compatible build exists, the account-off switch closes account play and local play stays on. No down migration, no deleted game.
- **Engines.** Every engine in use, `bab22e94` and its alias `e668782a` included, needs a tested continuation. A deploy log with "skipped the check of engines in use" fails the release; slice 1 makes `--publish` stop when the engines database setting is absent. No `tsx` run writes to the live database.
- **Stops and packet.** The stop table in the route document; each stop has its check or record. A packet per publish names the source, outputs, migrations and grants, engines, probes, devices, the recovery build and the owner's words. This answer gives no merge, run, database write or publish go.

