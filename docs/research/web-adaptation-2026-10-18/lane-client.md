# Client state and server calls

The web app already has sign-in, a local game, local save, cloud save, and guards against old local work. PR 61 adds a web JSON client and a shared game protocol. The web entry point does not use that client. The release server does not mount the JSON API. The plugin supplies useful notice rules, a command queue, retry records, one poll, and name checks. These parts can support both clients after a small split from tool results, widget storage, and page controls. Keep local play outside the server queue. Connect online play through the web session and JSON API. Do not copy the plugin app entry point into the web app.

Source scope: `W` means `main` at `38a6bbff`. `R` means the release branch at `682e58bd`. All line references use these Git versions. The survey reads source and selected test cases. It runs no tests or checks. Live routes, database state, and device behavior are **unverified**. S means a small, bounded change. M means a change across a few modules. L means a new end-to-end client flow. Size is for the stated item, not for all dependent work. The plan is to compare state, trace calls through each server boundary, then identify the shared parts. Each finding below has source evidence. No repo file changes.

## Kind (a): shared code after the merge

### CLIENT-01 — The web account uses the new deletion rule

- **Kind:** (a). The web app uses this path today. The merge changes its words and the database function that it calls.
- **Evidence:** W and R `src/account/client.ts:34-38` call `delete_my_account`. R `supabase/migrations/0008_accounts_safety.sql:40-67` changes this function to request deletion after seven days. A new sign-in cancels the request. R `index.html:230-236` and `src/account/account.ts:128-136` explain that rule. The diff changes both web messages.
- **Web today:** The client calls the same function, then signs out. W `index.html:232-233` and `src/account/account.ts:135` describe immediate deletion.
- **Change:** S; no further client work for the changed messages. The database change still needs its release steps.
- **Dependencies:** The release database change and deletion job. No other client item.
- **Risk:** New client words with an old database, or an old client with a new database, give a wrong deletion date. This survey does not check deployment state.
- **Owner taste call:** No for keeping the client words equal to the server rule. A change to the seven-day rule is outside this lane.

### CLIENT-02 — Shared protocol and safe server error records

- **Kind:** (a). The merge supplies shared code. The current web page does not import the new protocol or call its JSON API. Thus this is available code, not an active online feature.
- **Evidence:** R `src/match/protocol.ts:16-55` defines the surface, actions, command IDs, revisions, and replies. Lines 71-135 define views, history, and records. R `src/api/http.ts:79` calls the game service with surface `web`. R `src/plugin/service.ts:43` uses surface `chatgpt`. R `src/plugin/diagnostics.ts:1-7` returns fixed error names and codes. R `src/api/http.ts:129,163` uses it. W already has `src/plugin/diagnostics.ts`; its location does not make it a widget feature.
- **Web today:** W `src/main.ts:66-92,195-197` creates local play and loads the account module. It does not create an online client.
- **Change:** S to use type-only protocol imports in new web code. No client change for the server diagnostic helper itself.
- **Dependencies:** CLIENT-10 and CLIENT-11 for active web API use.
- **Risk:** A runtime import of protocol schemas adds server validation code to the browser. R `src/online/client.ts:6-8` shows the type-only import pattern. An error display and a server error record serve different purposes; the fixed diagnostic codes do not supply user recovery.
- **Owner taste call:** No for the common protocol or safe records. New visible online features still need approval.

## Kind (b): plugin code that the web app can reuse

### CLIENT-03 — Notice state and control locks

- **Kind:** (b). Lift the notice reducer and selectors. Supply each page's renderer from outside this module.
- **Evidence:** R `src/plugin/state.ts:6-105` defines notices, scope, the message line, and derived locks. Lines 146-167 define the reducer. A third failed poll marks a view stale; one failed foreground read does so at once. Lines 181-202 create the store. R `src/plugin/app.ts:42-75` still holds view, route, pending state, and account memory outside that store.
- **Web today:** W `src/screen/play.ts:71-119` holds game and page state in closures. It has one local notice string. W `src/account/account.ts:65-76` has its own account note and renderer.
- **Change:** M. Share `Notice`, `Action`, `reduce`, and the state selectors. Let the web shell supply screen scope and render callbacks. The existing store is a notice store over supplied page state; it is not one complete game-state store.
- **Host coupling:** Tool-name checks occur in `state.ts:40-47`. Plugin screen names occur in `Page` and `Pending`. `renderPage` and `applyLocks` at lines 113-142 use plugin element IDs and its frame. `createStore.sync` calls these renderers directly.
- **Dependencies:** CLIENT-04 and CLIENT-05 supply pending and write state. CLIENT-10 supplies the web shell.
- **Risk:** A global connection lock must not disable local play when the server is down. A notice from another game must not lock the current game. Preserve the scope tests in R `src/plugin/state.test.ts:14-177` when this code moves; these tests are read, not run.
- **Owner taste call:** Yes for a common message line, wording, and lock behavior. No for preventing stale commands from changing the wrong game.

### CLIENT-04 — One write queue and one gate for old replies

- **Kind:** (b). Lift the queue mechanism and the job gate. Describe command policy outside the queue.
- **Evidence:** R `src/plugin/queue.ts:69-181` puts writes in order, allows reads beside them, and makes board reads wait for writes. User commands advance an epoch. A new mount detaches old reads and selected writes. `current()` checks that epoch. R `src/plugin/app.ts:157-176,188-211,237-239,275-276` uses the gate before page writes and routes. Lines 535-555 add a separate sequence check for list reads within one epoch.
- **Web today:** W local play uses `gen`, `busy`, and `navGen` in `src/screen/play.ts:87-113`. Cloud save has its own promise queue in W `src/account/sync.ts:170-176`. Neither is an online game command queue.
- **Change:** M. Keep the queue in a module with no host imports. Pass command traits such as read, write, board read, and detachable. Expose `command`, `run`, `current`, `close`, and write state. Keep each continuation under its original job. Keep the list sequence gate where two reads can share one epoch.
- **Host coupling:** `DETACHABLE` at `queue.ts:59` names MCP tools. `chatResult()` at lines 113-123 names a host event. `ToolResult`, screen fields, and start-specific fields also belong outside the basic queue. No queue code reads `window.openai` directly.
- **Dependencies:** CLIENT-10 connects this queue to web actions. CLIENT-05 defines retained commands.
- **Risk:** Detach does not undo a server write. A non-detachable write can finish after its page is old. Preserve its own receipt without routing the page. The queue alone does not enforce every rule; `app.ts` contains these checks. Queue source tests cover lane order, stale reads, and close at R `src/plugin/queue.test.ts:11-236`.
- **Owner taste call:** Yes for the shared architecture. No for late replies changing the wrong screen.

### CLIENT-05 — Retained commands, Retry, and route continuation

- **Kind:** (b). Lift the retained-command controller and status-to-screen choice. Use a web storage adapter and typed results.
- **Evidence:** R `src/plugin/router.ts:5-18` maps status to screen and makes one ID for Start. R `src/plugin/app.ts:132-149,217-259,278-303,308-313` restores pending input, keeps failures, clears definitive refusals, and runs the right continuation after Retry. Lines 391-425 restore pending work without resending a call that still runs. R `src/plugin/client.ts:24-35` stores pending work. R `src/match/service.ts:295-305` checks command receipts before applying work.
- **Web today:** W saves local game moves, not an online pending request. R adds `onlineClient.command` with four attempts by default and the same ID during those attempts (`src/online/client.ts:23-49`). The web page does not use it. That retry loop does not keep a failed command across a reload.
- **Change:** M. Share a retained command with fixed ID, game, expected revision, input, scope, and failure state. Retry keeps all command input. Convert the API reply or tool result to one typed outcome at the transport boundary. Split `routeView` from the Start call that uses tool names. Keep the start and setup continuation under one job.
- **Host coupling:** Plugin replies use `_meta`, `structuredContent`, and tool names. Widget storage removes `game_id`, code, and handle, then keeps a short game tag. `resend()` must recover a full game ID. This storage rule is specific to the host boundary; a web tab can keep a full game ID.
- **Dependencies:** CLIENT-04, CLIENT-10, CLIENT-13. CLIENT-12 supplies missing server operations.
- **Risk:** A retry with a new ID can make a second game or action. A retry with changed input can conflict with a receipt. The plugin holds one pending command slot. Do not assume it supports several unsent game commands in several tabs. Distinguish refusal, transport failure, and superseded work.
- **Owner taste call:** Yes for Retry presentation and reload recovery. No for keeping one ID and one input for one command.

### CLIENT-06 — One active poll and current view rules

- **Kind:** (b). Lift poll timing and target selection. Keep one active poll for the online screen.
- **Evidence:** R `src/plugin/poll.ts:3-17` selects the delay. Lines 25-55 prevent overlapping reads, stop timers on hide, and supply `stop()`. R `src/plugin/app.ts:433-455` selects a board, lobby, end, or waiting-game target and gates polling during writes and mount. `app.ts:102-124,241-266` rejects older views, retains rules separately, and updates presence data even at the same revision.
- **Web today:** W has no online game poll. R adds `src/online/client.ts:77-126`, with view merge, gap recovery, and `watch()`. It is not used by the web page. Its schedule stops after `setup`, since line 104 permits only `waiting` and `playing`. It drops all equal revisions at line 79, including new presence data. Its `stop()` does not guard `take()` after an in-flight read returns.
- **Change:** M. Use one poll driver, then share game-ID, revision, full-rules, and current-job checks. Retain HTTP gap recovery where needed. Do not run `watch()` and `runPoll()` together. Refresh same-revision presence data without replacing game state.
- **Host coupling:** `pollDelay` has no host API. The target functions call plugin screens and tools. `runPoll` binds both wake events to its supplied `page`, which defaults to `document`. The HTTP watcher binds `pageshow` and `online` to `window` (`online/client.ts:114-119`). A web adapter must preserve these event targets.
- **Dependencies:** CLIENT-03, CLIENT-04, CLIENT-10, CLIENT-11. CLIENT-12 supplies lobby and related reads.
- **Risk:** A copied watcher can stop during setup or update a page after stop. A copied plugin poll can omit the web `online` wake event. Poll timing uses server time and may affect server load. The runtime effect on devices is unverified.
- **Owner taste call:** Yes for the poll intervals and visible stale state. No for overlapping polls or old replies changing a closed page.

### CLIENT-07 — Abort old mounts and close client work

- **Kind:** (b). Reuse the mount-abort pattern for web game switches and view teardown.
- **Evidence:** R `src/plugin/app.ts:341-351` makes an `AbortController` for a mount. A superseded outcome aborts its calls. `mountBody` passes the signal to settings, board, and list reads at lines 364,386,397,405. R `src/plugin/client.ts:37-49` passes the signal to the SDK. `app.ts:447-448` closes the queue and stops the poll and name timer. Commit `cf6acd5d` adds mount abort. R `src/plugin/app.test.ts:612-626` asserts that a superseded mount aborts its signal.
- **Web today:** Local game reset cancels local work; see CLIENT-18. R `src/online/client.ts:17-38,90-126` has no request signal or timeout option. A watch stop removes timers and events but does not abort an in-flight request.
- **Change:** M. Add signal support to the web transport. The web shell owns the controller for each online view. Abort obsolete reads, close their queue, and ignore late replies. Preserve a pending write receipt when its result is unknown.
- **Host coupling:** The trigger is `app.ontoolresult` and the end events are SDK callbacks. A web tab instead supplies navigation, account-change, and teardown events. The mechanism itself needs no host API.
- **Dependencies:** CLIENT-04, CLIENT-10. CLIENT-11 supplies the HTTP path.
- **Risk:** An abort stops a client call; it does not cancel a committed server action. R `src/plugin/http.ts:105-134` keeps admission slots until service work ends after disconnect. Do not promise immediate server capacity recovery from abort alone.
- **Owner taste call:** No for stopping old reads from changing the new page. Approval still applies to the wider shared-module work.

### CLIENT-08 — Name validation with one check at a time

- **Kind:** (b). Lift the delayed name-check controller and shared validation. Supply the request and rendering functions.
- **Evidence:** R `src/plugin/app.ts:564-597` waits 250 ms, serializes checks, skips old input, and invalidates replies on navigation or close. Save runs the local `handleProblem` check, then sends handle and icon. R `src/account/profile.ts:63-69` supplies validation. R `src/plugin/service.ts:73-85` checks both current and reserved names, then saves through the account service. R `src/plugin/app.test.ts:193-206` checks one active request and then only the newest name. Commit `682e58bd` adds this limit.
- **Web today:** W `src/account/account.ts:25-54` shows the provider name and picture. There is no game-name form. R `src/online/client.ts:59` can save a handle, but has no availability check.
- **Change:** S for the controller; M with the web form and API route. Use an injected `check(handle)` and a current-input token. Keep Save authoritative because another player can take a free name after a check.
- **Host coupling:** The request is `kingdown_handle`; success uses `structuredContent.available`. The controller uses plugin element IDs and queue close state. Its delay and stale-input guard do not need ChatGPT.
- **Dependencies:** CLIENT-10, CLIENT-12. CLIENT-03 supplies display and locks if the owner adopts them.
- **Risk:** Checks must leave capacity for Save. A successful check is not a reservation. A delayed result must not show that an edited name is free.
- **Owner taste call:** Yes for the name form, check delay, and feedback. No for validation or stale-input guards.

## Kind (c): web work with no matching plugin client path

### CLIENT-09 — Keep local and server games as separate state sources

- **Kind:** (c). The web app needs a choice between its existing local game and an online server view. The plugin has no equivalent local-play shell.
- **Evidence:** W `src/main.ts:66-92` makes an engine and local play controller. W `src/screen/play.ts:279-313,377-393` applies local moves and computer moves. R `src/match/protocol.ts:71-114` gives the server view, legal moves, and fixed rules. R `src/plugin/screens/board.ts:118-148,199-209` sends server commands and recovers the view after failures. R `src/plugin/screens/board-model.ts:51-61` restores only a legal draft for the same base position.
- **Web today:** The local game owns moves, rules, history, undo, lessons, and save. Cloud save can replace that game through W `src/screen/play.ts:739-777`.
- **Change:** L for the complete web online-play flow. Keep a small boundary between local play and online play. Use the common online controller for server games. Keep server views, pending commands, and drafts outside `kingdown.save`. Do not convert all local games to server games as part of the client split.
- **Dependencies:** CLIENT-03 through CLIENT-08, CLIENT-10 through CLIENT-13. Feature screens need their own survey items in the other lanes.
- **Risk:** Cloud save can replace an active online board if both paths share the current local restore callback. Local `setRules` and online rules also need clear ownership. Local undo and local computer play must not mutate an online game. The plugin draft path supplies useful code, but importing its board module also imports `../app` and its host shell.
- **Owner taste call:** Yes. Pick local play as the default and add online play as an explicit mode. The owner must approve the flow before build.

### CLIENT-10 — Connect the existing web session to the new client

- **Kind:** (c). The missing work is the session and shell connection. A second web sign-in is not needed.
- **Evidence:** W `src/account/client.ts:14-31,40-54` exposes session callbacks and cloud-save calls, but no token getter. W `src/account/account.ts:78-90` keeps its client private. R `src/online/client.ts:17-38` requires an asynchronous token supplier and calls `/api`. R `src/api/http.ts:24-38` accepts a website session and rejects an MCP OAuth access token.
- **Web today:** W `src/main.ts:195-197` loads the account module after local play starts. No web entry point constructs `onlineClient`. A source reference search on R finds its use in its tests, not the web shell.
- **Change:** M. Expose a narrow session-token function through the account module. Use the account library's current session, not raw storage parsing. Construct one online controller for the signed-in account. Re-read on account change, and close old work on sign-out. Keep the current delayed account load.
- **Dependencies:** CLIENT-11. CLIENT-04, CLIENT-05, and CLIENT-07 supply request ownership and recovery.
- **Risk:** A cached token can expire. A reply for the previous account must not update the next account's view. Do not pass MCP tokens to the web API or web session tokens to `/mcp` as an assumed substitute.
- **Owner taste call:** Yes for the online entry and sign-in prompt. No for token refresh and account isolation.

### CLIENT-11 — Mount the JSON API in the web server

- **Kind:** (c). The JSON handler exists, but the release server does not connect it. The plugin only needs `/mcp`.
- **Evidence:** R `src/api/http.ts:61-134` exports `createApiHandler` and checks the website session. R `tools/plugin-server.mjs:52-60` mounts internal jobs and art, then sends other paths to the MCP handler. It does not construct the JSON handler. R `src/plugin/http.ts:73` refuses paths other than `/mcp` after its own metadata and consent routes. R `tools/plugin-server-build.mjs:15-26,61-75` creates the function routes for MCP, consent, discovery, and internal jobs. It adds no `/api/*` route.
- **Web today:** Account sync talks directly to the account data service. There is no active game API caller in the web shell.
- **Change:** M. Construct the API handler with the game, account, and safety services and website-session verifier. Dispatch `/api/*` to it. Add the matching function route to the build. Keep the handler's same-origin rule (`src/api/http.ts:100-116`).
- **Dependencies:** Shared services and database release. CLIENT-10 consumes this route. This item precedes any active web online feature.
- **Risk:** Source presence does not prove a public route works. The live route remains unverified. A browser cannot solve the missing route with a cross-origin API URL: the handler refuses cross-origin requests. Server limits and database grants need review with the new path.
- **Owner taste call:** Yes for enabling online play on the web. No for connecting an approved feature to its required route. This survey authorizes no deploy.

### CLIENT-12 — Add the missing web API operations

- **Kind:** (c). The services have plugin equivalents. Their web HTTP routes and client methods do not exist yet.
- **Evidence:** R `src/api/http.ts:70-95` is the full public route table. R `src/online/client.ts:40-68` is the client method set. Compare R `src/plugin/service.ts:33-85` and `src/plugin/server.ts:168-225`.
- **Web today:** W has none of these online screens. R supplies a partial JSON API that the web shell does not use.
- **Change:** M for the thin routes and typed client calls, apart from their screens. Reuse the service methods. Keep validation and the verified actor at the server boundary. The following table identifies the missing surface; it does not prescribe final URL names.

| Operation | Existing web JSON surface in R | Work to reach plugin behavior |
|---|---|---|
| Read a game; list active games | `GET /api/games/:id`; `GET /api/me/games` | Already defined. Game read also records activity at `http.ts:73-77`; no separate Seen route is needed for this path. |
| Turn; computer; Choose; rematch; draw; resign; abort; timeout claim; preset message | `POST /api/games/:id/commands` | Already defined through `Action` at `protocol.ts:22-36`. Map client actions to this one route. |
| Create; invite; redeem a code or token | `POST /api/games`; `/api/games/:id/invite`; `/api/invites/redeem` | Already defined. Add Start receipt support as CLIENT-13 states. |
| Find; lobby; accept an open game; cancel a waiting search | None | Expose `GameService.find/lobby/accept/cancel`; plugin wrappers are at `service.ts:47-50`. Cancel search is a service operation separate from the generic game command path. |
| Preview an invitation before join | None | Expose `GameService.preview`; plugin wrapper is at `service.ts:46`. Keep redeem as the explicit join. |
| Name availability | None | Expose the check in `PluginService.handle`, `service.ts:73-80`, through shared account code. Save handle and icon already have web routes. |
| Board choices and last setup | None for these fields | Expose the settings service used at `service.ts:66-71`. `src/plugin/settings.ts:8-23` stores `symbols_only`, `show_threats`, and `last_setup`. The profile PATCH has different fields. |
| Rating, badges, finished-game history | No record or history route | Expose `GameService.record/history`; wrappers are at `service.ts:40-42`. `GET /api/me/profile` returns the account profile, not the full plugin record response. |
| Profile, icon, handle save, block relations, report, deletion, notification preferences | Routes exist | Use the existing web calls. The plugin packages some results differently; map values in the adapter. |

- **Dependencies:** CLIENT-11 first; CLIENT-10 for callers. CLIENT-08 consumes the name check. Other lanes own feature scope and screen detail.
- **Risk:** The plugin settings path also writes online visibility to the profile. Keep that behavior. Reusing a tool reply as a JSON contract can expose unnecessary fields or couple the web to `_meta`. A missing HTTP route does not require a new game service.
- **Owner taste call:** Yes for which features the web exposes. No for reusing the same approved server rules.

### CLIENT-13 — Give web Start the same receipt as plugin Start

- **Kind:** (c). The plugin has the receipt behavior. The current web Create route cannot request it.
- **Evidence:** R `src/plugin/router.ts:13-17` creates a Start ID. R `src/plugin/server.ts:135-140,173` passes it separately to Create or Find. R `src/match/service.ts:124-137` uses that ID to return the first game and reject changed input. R `src/api/http.ts:72` calls `games.create(actor, body)` without the ID. R `src/match/protocol.ts:37-47` uses a strict Create schema with no `command_id`. R `src/online/client.ts:42` makes one Create call with `CreateOptions` only.
- **Web today:** W starts only local games. The unused release JSON client has no durable Start ID. Its command retry support does not cover Create.
- **Change:** S for a validated HTTP Start envelope and a client ID field; M with retained Start and Find. Pass the ID separately to the service. Keep it when a reply is lost, including after a reload.
- **Dependencies:** CLIENT-05, CLIENT-11. Find also needs CLIENT-12.
- **Risk:** Adding `command_id` to the existing request body alone fails the strict Create schema. Retrying the present Create route can make a second game. Invitation creation after Create also needs care because a new invitation ends the old one; the API creates an invite after each friend-game Create response.
- **Owner taste call:** No for one Start producing one game. Approval still applies to the new online feature.

## Kind (d): plugin host code to keep outside the web client

### CLIENT-14 — Host connection, messages, and frame controls

- **Kind:** (d). A normal web page has no ChatGPT host or tool-result mount event.
- **Evidence:** R `src/plugin/app.ts:34-37` reads `window.openai` and creates the SDK App. Lines 127-128 update host context when widget state is absent. Lines 341-428 process tool results. Lines 449-456 connect to the host. Lines 463-533 request fullscreen, queue routes behind the inline card, apply host safe areas, and handle collapse. Line 625 handles host-context changes. R `src/plugin/client.ts:37-43` uses `callServerTool`.
- **Web today:** W `src/main.ts:28-60,163-187` reads web URLs and uses the web home and title flow. It does not wait for a host connection.
- **Change:** S to keep these calls in the plugin adapter during the split. Do not import the plugin app entry into the web bundle. General device layout may be reused separately; host display modes are not web navigation.
- **Dependencies:** CLIENT-03 through CLIENT-07 take only the shared mechanisms. CLIENT-10 supplies the web adapter.
- **Risk:** A copied host connection leaves the web page blocked. Copied inline routing hides screens behind a frame that does not exist. A plugin resource's CSP also has no connect domains (`src/plugin/server.ts:46`); direct fetch is not a drop-in replacement inside that frame.
- **Owner taste call:** No for excluding host-only plumbing. Yes if the owner wants a similar visible home-card flow on the web.

### CLIENT-15 — Widget state and server board selection records

- **Kind:** (d) for the host storage format and `plugin_boards`. Retained commands and draft validation are reusable under CLIENT-05 and CLIENT-09.
- **Evidence:** R `src/plugin/client.ts:17,24-35` loads and writes private widget content. It omits full game IDs, join codes, and handles from pending arguments and keeps short tags. R `src/plugin/service.ts:87-104` owns server board records. R `src/plugin/app.ts:360-399` restores or opens these records after a tool result. R `src/plugin/server.ts:158-164` resolves a board ID to its selected game.
- **Web today:** W `src/screen/save.ts:18-34` uses browser storage for the local game. There is no host replay that requires a server board record.
- **Change:** S to define a storage adapter for shared pending and draft state. Keep widget filtering and server board selection in the plugin adapter. Let the web page address a game directly. Do not copy widget state as the online game authority.
- **Dependencies:** CLIENT-05 and CLIENT-10. CLIENT-09 keeps local save separate.
- **Risk:** Sharing one browser storage key across tabs can make two tabs overwrite one pending command. Storage must be scoped to the signed-in account and selected game. Short game tags require server-backed recovery; they are not an access check.
- **Owner taste call:** No for keeping the widget format out of the web. Yes for any new web resume or multi-tab behavior.

## Kind (e): the web app already has it

### CLIENT-16 — Web sign-in and account controls

- **Kind:** (e). No sign-in gap.
- **Evidence:** W `src/account/client.ts:14-38` creates the browser account client, listens for sessions, signs in, signs out, and requests account deletion. W `src/account/account.ts:37-54,78-90,107-136` renders and connects the controls. W `src/main.ts:195-197` loads them after local play.
- **Web today:** The account menu supports Google and GitHub. Facebook is available only with the URL switch (`account.ts:68-69`). The page can play without an account.
- **Change:** S; reuse the existing sign-in path. CLIENT-10 is the missing token connection, not a new sign-in build.
- **Dependencies:** None for current sign-in. CLIENT-01 changes deletion wording after merge.
- **Risk:** The displayed provider name and picture are not the game's handle and preset icon. Do not treat the account menu as proof that the online identity form exists. Live provider setup is unverified.
- **Owner taste call:** No to retain the current path. Yes for moving the controls or changing the entry flow.

### CLIENT-17 — Local save and cloud-save retry

- **Kind:** (e). No gap for the current local game.
- **Evidence:** W `src/screen/save.ts:11-34` reads and writes the local save. W `src/screen/play.ts:707-748` saves rules and moves, notifies account sync, and protects the real game during lessons. W `src/account/sync.ts:66-92` stamps and merges sections. Lines 95-176 serialize requests, delay writes, stop old sync, and retry failures from five seconds up to five minutes. W `src/account/account.ts:138-142` flushes on network return and page hide, and pulls after a return.
- **Web today:** Settings, lesson progress, and one local saved game can move between devices. The newer section wins. Lesson completion is combined at `sync.ts:152-159`. Failures do not block local play.
- **Change:** S; retain this module for its current data. Do not replace it with the online command queue. Use CLIENT-09 to stop local saved-game restore from replacing an online view.
- **Dependencies:** None for current behavior.
- **Risk:** Timestamp section merge is not a server game command protocol. It cannot decide whose online move wins or replace expected revisions. Adding fields to the save also requires the settings/game split to stay correct.
- **Owner taste call:** No to retain working save. Yes for any new cross-host settings policy. The plugin uses a separate settings store, so matching preferences do not sync across hosts by default.

### CLIENT-18 — Guards against old local work

- **Kind:** (e). The web app already protects local game switches. The online transport still needs CLIENT-07.
- **Evidence:** W `src/screen/play.ts:92-113` defines game and review generation counters. Lines 279-302 check the generation after animation. Lines 377-384 check it after computer search. Lines 613-629 advance both counters, cancel the engine, close pending move choices, and clear busy state.
- **Web today:** New game, undo, resign, and saved-game restore can invalidate old local work. `openSaved()` calls reset at W `src/screen/play.ts:757-758`.
- **Change:** S; preserve the local guard. Apply the shared job gate to new online work rather than replacing the local controller as a preliminary cleanup.
- **Dependencies:** None for local play. CLIENT-09 decides which controller owns the shown game.
- **Risk:** A local generation guard does not abort HTTP or retain an unknown server write. Conversely, the plugin queue does not replace all local animation and lesson guards.
- **Owner taste call:** No to retain correct local guards.

## Open questions for the owner

1. **What owns computer games on the web?** Options: keep local play as the default and add server games; move all games to the server. **Pick:** Keep local play as the default. This retains play without sign-in or a connection. On yes, CLIENT-09 defines the explicit online entry and keeps each state source separate.
2. **How much client code should the two hosts share?** Options: a shared online controller with two host adapters; two client controllers that copy the same rules. **Pick:** Share the online controller. Start with the queue, notice reducer, current-view checks, poll, and retained commands. Keep SDK calls, frame controls, widget storage, and page DOM outside it. On yes, use CLIENT-03 through CLIENT-08 as one bounded extraction plan.
3. **Should the web use the full plugin feature set in its first online step?** Options: all approved features; core games first, then the other features. **Pick:** Build the core game path first, including sign-in connection, safe Start, setup, moves, recovery, and resume. Add the missing lobby, history, and settings routes when their screens enter scope. On yes, CLIENT-10, CLIENT-11, and CLIENT-13 precede the selected CLIENT-12 routes. No visible feature is removed by this survey.
4. **Which settings should both hosts share?** Options: board choices and last setup only; all settings with one common value. **Pick:** Share only fields with the same meaning. Keep device sound local. Define each mapping before sharing `labels` with `symbols_only`, or local threat settings with `show_threats`. W `src/account/sync.ts:27-28` and R `src/plugin/settings.ts:14-23` have different schemas. On yes, the settings work defines one account source for matching fields and leaves other fields in their current store.
5. **Should pending online work survive a web reload?** Options: keep pending commands and legal drafts; keep only the selected game. **Pick:** Keep pending commands and legal drafts, scoped to the account and game. Re-read server state before resuming them. On yes, CLIENT-05 uses a web storage adapter and preserves the same command ID; CLIENT-09 validates each draft against the server view. The choice of tab storage or account-and-game keys needs a small design before build.
