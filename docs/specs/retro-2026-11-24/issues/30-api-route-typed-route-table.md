# Type the /api route table and its per-route policy

Status: ready-for-agent
Source: the change rehearsals and guard checks of 2026-11-25 ([ticket 10](10-change-rehearsals.md), [ticket 11](11-guards-that-cannot-fail.md), [ticket 12](12-lessons-and-checks.md))

## Problem
- `src/api/http.ts:140`: the type of `routes` is `Record<string, Route>`. A new or renamed key compiles. Only source-text scans find it (tools/plugin-server-build.test.ts:48, tools/api-route-lists.test.ts).
- `src/api/http.ts:207` (`created`), `:249` (`engine`), `:252` and `:289` (`route.key === '...'`): plain strings. tools/api-route-lists.test.ts finds a stale key, but nothing makes a person decide these values for a NEW route. A new route that creates a row gets status 200, and a new route that plays a match is not under the MAX_ACTIVE_ENGINE bound.
- `src/api/http.ts:156,160,169,174,205`: each write handler calls `toolTry` (rate limit) by hand. A new write route without `toolTry` has no rate limit, and no check finds it.
- `src/api/ios-build-8-replies.test.ts:13`: the kept table has no key set over the routes. A new reply type that iOS reads has no entry. Low value: a new route has no old iOS reader.
- `src/api/http.ts:90-98` and `src/online/client.ts:54-114`: the client declares its reply types inline. tools/api-route-replies.test.ts checks 8 of them in one direction. The other client methods (View, MyProfile, InviteLink and the other protocol types) have no route reply type to compare with, because `Route` gives `Promise<unknown>`.

## Change
This is class C code. It needs the class C review.
1. Add `type ApiRouteKey = 'GET /api/status' | ...` (or derive it from a `const` key list) and write `const routes = { ... } satisfies Record<ApiRouteKey, Route>`.
2. Add one policy record: `const policy: Record<ApiRouteKey, { engine: boolean; created: boolean; limit: ToolKey | null }>`. Make `created`, `engine` and the `toolTry` calls read this record. Type `route.key` as ApiRouteKey, so the special cases at :252 and :289 must name a real key.
3. Export the key list. Then tools/plugin-server.mjs ENABLED_WEB_OPERATIONS and the operation sets of src/api/http.test.ts and src/api/http.db.test.ts can come from it, and the source-text scans can go.
4. Optional: give each route a typed reply (`Route<Reply>`) so the client reply types can be `Awaited<ReturnType<...>>` of the route. Then tools/api-route-replies.test.ts covers every method.
5. Optional, low: a key set over the reply types that iOS build 8 reads in src/api/ios-build-8-replies.test.ts.

## Test that fails first
- Add a key `'GET /api/me/fake'` to `routes` without a policy entry: `npm run typecheck` must fail at the policy record.
- Change `'GET /api/status'` at :252 to `'GET /api/statuz'`: `npm run typecheck` must fail.
- Revert both: typecheck green; focused run of src/api/http.test.ts, src/api/http.db.test.ts, tools/plugin-server-build.test.ts, tools/plugin-server-config.test.ts green.

## Known limits
- The policy record makes a person decide the rate limit. It does not prove that the limit value is correct.
- tools/plugin-server.mjs imports pg and the services. Importing the key list from src/api/http.ts there needs a check that the plugin bundle stays the same size and has no new server code.
- tools/plugin-server-config.test.ts:76 keeps a literal count (31). It can use the key list length after step 3.

## Work record
Not started.
