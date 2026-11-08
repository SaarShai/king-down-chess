# Build the connector foundation

Type: task
Status: resolved
Blocked by: 04, 05, 06, 07, 08
Parent: [Muse connector map](../map.md)
Labels: wayfinder:task

## Question

Can the six tools run end to end on this repo's engine and match service, behind a switch that keeps them out of the live build?

## Answer

Yes, built 2026-11-08 on branch `muse-connector`.

- `src/muse/`: the tools over a `MuseGames` port, the word matcher, the board text, and the HTTP edge on the v2 MCP SDK (`@modelcontextprotocol/server`). The ChatGPT plugin stays on the v1 SDK.
- `tools/plugin-server.mjs`: routes `/muse/*` when `MUSE_CONNECTOR` is on, adapts `GameService` with surface `muse`, and counts `kingdown_new_game` as a create and `kingdown_move` as a computer turn for the tool limits.
- Migration 0023 adds the `muse` surface. The audience hook template accepts `/muse/mcp`.
- `npm run muse:dev`: a loopback endpoint on the in-memory fixture, for the MCP Inspector.

Checks: the focused tests for `src/muse/`, the plugin HTTP and auth code and the server build (184 passed); both type checks; migrations 0001–0023 and the hook template run twice on the local test Postgres; an HTTP smoke against `npm run muse:dev` (tools list, a game, choices, a stale write, a 2025-era `initialize`).

Review: one independent review agent read the whole change and reported ten faults. All ten are fixed. Must-fix: a type clash between the two MCP SDK versions; a misheard target square could play the piece on it; the write tools did not need `game_id`. Should-fix: refusals repeated the said words; choices hid the total count; a stale write named only one turn; the computer branch did not check that the game was in play; a stale test; an unused option; the parked-build check did not cover Muse. The automated PR review (PR 322) found nothing. After the fixes, CI passed (12 checks), and the parked server check (`npm run plugin:server:check`, which `tools/deploy.sh` runs on each release) passed on a fresh test database: 20 parked paths answer 404 and the build has no Muse code.

Rules that review added: a misheard target square never plays the piece on it (it gives choices); refusals never repeat the said words; the write tools need `game_id`; a stale write names both sides' last turns. Run and deploy notes: [docs/MUSE.md](../../../MUSE.md).
