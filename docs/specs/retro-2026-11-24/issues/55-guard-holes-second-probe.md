# Change guards: 17 places that a second probe could forget with no red

Status: needs-triage
Source: three independent probes of the guards of PR 477 on `origin/main` 672c2a6aa, 2026-11-25 ([ticket 10](10-change-rehearsals.md)). The lead started them; no prober built a guard.

## Problem

Ticket 10 says: when an agent adds a new instance of a kind and forgets one place, the type check or one fast test names that place. Each prober made half-done changes that the builders and the reviewers of PR 477 did not use. Result: 28 faults, 11 caught, 17 not caught by `npm run typecheck`, the guard test files or `npm run test:docs`. The claim holds for the rehearsed places and for the error codes. It does not hold for the places below.

## Places with no red

A new piece or account screen:

1. `ICON_PIECES` in `src/piece-icons.ts`: a piece in the pool with no entry gets no round icon on the web.
2. The two `enterRead` conditions in `src/account-game/runtime.ts` (lines 401 and 585) for a new read screen. The type guard `ReadScreensListed` goes quiet when the builder adds the screen to the list of the guard itself.
3. The `publish()` branch in `src/online/runtime.ts:164`, `src/interface/play/main.ts:284` and `src/online/sign-in.ts:40` for a new entry-only screen. `publish()` sends `route.screen` with no type check against `Screen`.

A new API route or tool:

4. A reply field that the client declares and the route does not send, for a method that `tools/api-route-replies.test.ts` does not list (ticket [30](30-api-route-typed-route-table.md) holds this).
5. A route key in `src/api/http.ts` in double quotes, or with other indentation: each scan needs two spaces and single quotes, so no list asks for the route.
6. `READ_TOOLS` in `src/account-game/types.ts` (an untyped string list): a new read tool with no entry is queued as a write.
7. The row in `tools/plugin-protocol-check.ts`: only CI finds it (by design).
8. A stale tool name in a tool reply text: `tools/tool-names-in-text.docs.test.ts` reads descriptions and input schemas only.
9. A Muse tool with a `COUNTERS` entry whose body does not call `games.toolTry`: the docs give a limit, and the tool counts no call (ticket [33](33-tools-plugin-counter-behaviour.md) covers the plugin only).

A new build flag, check or migration:

10. A define in one plugin build only: the test reads the whole of `tools/plugin-server-build.mjs`, so one define hides a missing one in the consent build.
11. A flag read in a `.js` or `.mts` file: the scan of `tools/build-flags.mjs` opens `.ts`, `.mjs`, `.sh` and `.py` only.
12. A non-VITE flag that the web bundle reads: no test reads the define block of `vite.config.ts`.
13. A registry entry with `byName: true` and no `ci` group: nothing asks the builder to choose "local only".
14. A check script in a subfolder of `tools/` with no registry entry: the orphan test reads the top level only.
15. A registry entry whose script file does not exist: the only red is a baseline count, and it goes green when the builder adds the name.
16. A migration with a new table and no grant block in `plugin-deploy/runtime-role.sql`.
17. A migration file with a hyphen after the number (`0027-name.sql`): both docs tests filter on `NNNN_`, so no guard sees the file.

## Failure texts that do not name the place

- A missing card fixture in `SHARED_MECHANICS` gives only `TypeError` lines.
- `src/diagnostics/data.test.ts` names the path, not `src/diagnostics/data.ts`.
- `tools/api-route-client.test.ts` says "add the route" when the route exists in double quotes.
- `tools/plugin-db/release-order.docs.test.ts` fails with no message for a stale README range.

## Record

The full probe results (each fault and its evidence) are in the lead's run folder: `runs/guard-probes-2026-11-25.json`.

## Next

Triage by cost: items 5, 11, 14, 15 and 17 are scan limits with a one-line repair each. Items 2, 3 and 6 need a type. Items 9, 10, 12 and 16 need a behaviour test.
