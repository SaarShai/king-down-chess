# Choose the web release route and stop conditions

Type: grilling
Status: open
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
