# Complete the web API contract

Type: research
Status: resolved
Blocked by: 01, 02
Parent: [Web adaptation map](../map.md)
Labels: wayfinder:research

## Question

Which HTTP operations are missing, and what is the smallest contract that reuses the game service?

## Evidence

`src/api/http.ts` has game create/read/command/invite/redeem, profile, handle, deletion, relations, notifications, and report routes. `src/online/client.ts` mirrors this older contract. `src/plugin/service.ts` and `src/plugin/server.ts` expose the newer game and record methods. `tools/plugin-server.mjs` does not construct the API handler.

## Answer

The table is the proposed contract for the web build. Paths are proposals, not claims that routes exist. Use the existing handlers and schemas. No browser imports server code or zod.

| Operation | HTTP contract | Shared behavior |
|---|---|---|
| Create | `POST /api/games`, options plus `command_id`; return View | Pass the stable ID to `GameService.create`. Stop automatic invite rotation in this route. |
| Read game | Existing `GET /api/games/:id?since=` | Return the seat view. Preserve no-store and hidden choices. |
| Game action | Existing `POST /api/games/:id/commands` | Choose, complete turn, computer, draw, abort, resign, claim, and rematch already fit Action. |
| Open games | `GET /api/lobby` | Call `lobby`. |
| Find | `POST /api/games/find`, options, colour, `any_rules`, `command_id` | Call `find` with the same ID on retry. |
| Accept / cancel | `POST /api/games/:id/accept`, `POST /api/games/:id/cancel` | Call the existing seat-lock and cancellation methods. A repeat must return the current result or a precise refusal. |
| Preview | `POST /api/invites/preview`, code or token | Call `preview`. A read never takes a seat. Preserve short-code attempt limits. |
| Join | Existing `POST /api/invites/redeem` | Call `join`. A repeated join by the same account resumes its seat. |
| Invite | Existing `POST /api/games/:id/invite` | An explicit new-code action may rotate the invite. Do not retry it silently. After a lost reply, explain that Retry makes a new code. |
| Own games | Existing `GET /api/me/games` | Use inbox order. |
| Record / history | `GET /api/me/record`, `GET /api/me/history?before=` | Call `record` and `history`. Keep cursor bounds. |
| Board settings | `GET /api/me/settings`, `PATCH /api/me/settings` | Use the existing player-settings schema and service after moving them out of the plugin boundary. |
| Handle availability | `POST /api/me/handle/check` | Reuse the existing check, normalization, reservation rules, and one-at-a-time client request rule. |
| Identity save | Extend existing `POST /api/me/handle` for the handle and optional preset icon | Reuse account validation. Verify that a partial failure cannot strand the first-game flow or cause another rename. |
| Visibility / relations | Existing profile and relations routes | Reuse the account service. Add pagination for a large block list through the same query used by the plugin. |
| Report / deletion | Existing routes | Expose only the controls approved for web release. |

The API is not public in the pinned deployment. Update its unused client and tests together. Do not keep an unused old create response as a compatibility layer.

Move common handle checks, board settings, and block-list queries to the responsible account modules. Do not make the web API call MCP or use the whole PluginService. Retain service validation, request-size limits, same-origin checks, and seat authorization.

Equal revisions need care. A poll can change presence or other display data without a game revision. Keep the plugin accepted-view rules for those fields. Do not use the old web watcher unchanged: it drops equal revisions and stops at setup.

## Additions (merged from the session survey)

- The picture update already exists: the profile PATCH takes the icon (CRIT-22). Add only the handle availability route.
- Per-account budgets apply from the first served write route (phase 3). A signed-in website user can call any served route, so the MCP limits (`toolTry`, the per-user slot cap) do not protect `/api` (SRV-20, CRIT-12).
- The shared poll replaces `watch()` in the old online client. Delete `watch()` when the web uses the shared poll; do not repair it.
- Every View carries the game's engine stamp (`engine`, or null before an engine starts), for both transports ([ticket 07](07-engine-compatibility.md)).
- Both transports share one admission gate per server instance and the same per-account counter rows ([ticket 06](06-hosting-routes.md)).
- The game GET becomes read-only. Today it also writes seat activity (`games.seen`), so a revoked token could still write; seat activity becomes its own protected write, as in the plugin (decided in [ticket 10](10-account-entry.md)).
- Rematch offers and acceptance charge the create budget; the pending-deletion rule lives in the shared game service and covers rematches ([ticket 10](10-account-entry.md), [ticket 15](15-public-safety.md)).
- Stored moderation notices have no player read (CRIT-08). [The public safety choice](15-public-safety.md) adds an actor-scoped, dated notice read on both transports, with the needed server-role column grants.

## Acceptance for the build

HTTP tests use real services and a disposable database. A lost Create or Find reply produces one game. A retry with changed input is refused. A preview never joins. An unauthorized account gets no seat data. Web and plugin turns update the same record once.
