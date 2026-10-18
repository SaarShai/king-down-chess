# Server, sign-in and hosting survey

The release has most of the server work that the web app needs. Main already has web sign-in and cloud saves. The main gaps are a token connection from that sign-in, a same-site API route, missing HTTP methods for the newer services, and web controls that use those methods. The browser API and client exist, but the production entry does not use them. The web API also lacks the plugin call limits. The browser poll has a code fault: it stops during seat setup. The release packet also has stale retention text. Cleanup removes unsent outbox rows after 30 days, as the public privacy page and the database test specify; the packet says they stay. This survey compares main `38a6bbff` with release `682e58bd`. All source references below use that release commit unless they say **main**. The branch advances to `442c5eb3` during the survey; its new change does not change the server files in this lane. Code checks use local Git reads only. Live settings, database state, deploy state and runtime results are **unverified**. No test, sign-in, run or network check occurs.

## Kind (a): Shared changes that need no web code change

### SRV-01 — Account deletion uses the seven-day grace

- **Kind:** (a). The web app uses this code now.
- **Evidence:** `src/account/account.ts:128–136`; `src/account/client.ts:34–38`; `supabase/migrations/0008_accounts_safety.sql:44–67`; `src/online/jobs.ts:121–139`; **main** `src/main.ts:196–197`.
- **Web today:** Settings calls `delete_my_account`, then signs out. Main says the account is deleted. The release changes the message to the seven-day grace. Migration 0008 changes the same RPC to a request. A new Auth session cancels the request; a token refresh does not.
- **Change and size:** **S.** No new web call is needed. Ship the text, SQL and deletion job as one release. A Git merge alone does not install SQL or cron.
- **Dependencies:** SRV-11 and SRV-15.
- **Risks:** Text and database behavior can disagree if only one ships. Without the daily job, due requests do not complete. A sign-in that cancels a request during deletion can keep the account after the job ends its games.
- **Owner:** No new taste call for the existing contract. Live database and deploy steps still need the owner's go.

### SRV-02 — One deploy tree holds the site and server

- **Kind:** (a). The web deploy path gets this change. The web page does not call MCP.
- **Evidence:** **main** `tools/deploy.sh:178–185` and `vercel.json:1–9`; release `tools/deploy.sh:137–143,172–205,213–225`; `tools/plugin-server-build.mjs:61–75`; `tools/plugin-server.mjs:52–60`; `docs/HOSTING.md:14–23`.
- **Web today:** Main publishes the static site. Its `/authorize` rule redirects to the separate plugin host. The release builds static files and the server function for project `kingdown`. It removes that redirect. It serves MCP, consent, discovery and internal jobs at the site origin.
- **Change and size:** **S** for web adoption of the existing build path. Keep the single deploy path. Add browser API dispatch under SRV-17. No DNS change appears necessary in this code.
- **Dependencies:** SRV-15; the release packet's Auth, OAuth and production configuration steps.
- **Risks:** The server needs the full schema and OAuth setup at startup. It can return 503 during the SQL window. The static site is a separate part of the output. Combined hosting does not mean that `/api` is present. The engine-in-use check is skipped if its local release input is absent.
- **Owner:** The one-project choice exists in the release packet. Publication still needs a go. Actual host readiness is unverified.

## Kind (b): Work built for the plugin that the web app can reuse

These items include services outside `src/plugin`. They serve the plugin now. The web entry has no caller for them. Their code has no direct ChatGPT host dependency unless the item says so. Sizes cover this lane's server and account work; they do not include a full board or page design.

### SRV-03 — One server record for a game on both surfaces

- **Kind:** (b).
- **Evidence:** `src/match/service.ts:38–68,95–114,294–351,433–463`; `src/match/store.ts:35–83`; `src/match/protocol.ts:16,22–55,71–115`; `src/match/index.ts:19–26,59–90`; `src/match/worker.ts:98–127`.
- **Web today:** **Main** `src/main.ts:78–109` creates the local engine and play controller. `src/screen/play.ts:377–393` runs computer turns on the device. No production web import of the online client appears in the checked entry, account, screen or UI modules.
- **Change and size:** **M.** Use `GameService` and `PostgresMatchStore` through HTTP. Reuse the revision, seat and command contract. Keep the server worker on the server. The browser uses the public view and legal move list. It sends a complete turn with one command ID.
- **Dependencies:** SRV-09, SRV-15, SRV-16 and SRV-17. Web board work belongs to the game lane.
- **Risks:** A local save is not a server game record. A retry must keep its ID and input. A stale revision needs a fresh view. The engine archive must keep old bundles for games in play. The service limits a turn to four actions and normal play to the revision budget. Do not treat the worker's Node interface as browser code.
- **Owner:** Yes for the scope of server-backed web play and local-game behavior. The existing seat and revision checks need no new taste choice.

### SRV-04 — Setup, public cards and server computer levels

- **Kind:** (b).
- **Evidence:** `src/match/setup.ts:20–38,44–91`; `src/match/setup-schema.ts:1–15`; `src/match/service.ts:160–199,335–339,455–458`; `src/match/worker.ts:51–90`; `src/match/protocol.ts:37–47,99–109`. There is a `levels.test.ts`; the level code is in the worker and `src/ai/skill.ts`, not a `levels.ts` service.
- **Web today:** Main has local New game choices and local skill levels. It does not use the new two-seat setup record, Ready state or hidden choices.
- **Change and size:** **S** to reuse the server methods; **M** if this item includes their HTTP and account connection. Lift the pure setup values and checks. Send `choose` through the existing command route. The service reveals the other choice only when both seats are ready.
- **Dependencies:** SRV-03, SRV-10, SRV-15 and SRV-17. The other lane supplies setup controls.
- **Risks:** Cards permit only the listed always-on powers. Setup expires after three days. Each hand is public. Private piles are refused by the worker. The server uses `skillPlan`, but this does not prove equal play strength with the web evaluator. Match history and engine version also affect play.
- **Owner:** Yes for web setup defaults and the use of server computer games. Reuse of the existing validation rules is not a new taste call.

### SRV-05 — Friend invites and random-player matching

- **Kind:** (b).
- **Evidence:** `src/match/service.ts:213–285,353–407`; `src/match/store.ts:105–118,134–144`; `src/match/setup.ts:21–24`; `supabase/migrations/0009_invite_tries.sql:8–14`; `0011_matchmaking.sql:1–5`; `src/plugin/server.ts:168–197`.
- **Web today:** `src/screen/links.ts:9–23,50–65` shares the position and moves in a URL. It creates no shared server seat. The API can make friend invites and redeem them. It cannot yet call the lobby, Find, Accept, Cancel or preview methods.
- **Change and size:** **M.** Reuse the service methods. Add HTTP methods under SRV-18. Use the existing link token for web links and the short code for typed joins. Reuse the five-switch match rule and the row locks.
- **Dependencies:** SRV-07, SRV-14 to SRV-20.
- **Risks:** Human play needs a handle. Friend codes last seven days. Random open games last 24 hours. Blocks apply to random matching; friend joins also check the host's challenge setting. Preview and join each count a short-code attempt. The shared HMAC secret must stay the same across server instances. A secret change ends current HMAC short codes. The code still has an older hash lookup at `service.ts:373–375`.
- **Owner:** Yes for the web join flow, matching controls and defaults. Do not infer new matching rules from the available settings.

### SRV-06 — Results, rating, history and badges

- **Kind:** (b).
- **Evidence:** `src/match/results.ts:21–59,62–91`; `src/match/badges.ts:4–24`; `src/online/glicko2.ts:6–13,44–73`; `src/match/service.ts:287–292,433–446`; `src/plugin/server.ts:221–225`; `supabase/migrations/0012_results.sql:3–35`.
- **Web today:** The checked web account path saves one local game and settings. It does not read `player_ratings`, rating history or server badges. The old `profiles.rating` default is 1200; the new rating starts at 1500 in a different table.
- **Change and size:** **S** for server reuse and thin HTTP reads. Add record and history methods to the web API. Full game reads already include the end outcome. A command reply does not include that full outcome, so the web flow needs a full read after a result.
- **Dependencies:** SRV-03, SRV-15, SRV-17 and SRV-18.
- **Risks:** Only finished human games with both players present change rating. Solo games can earn badges and count in totals. Local games do not enter this record by cloud save. Result and badge history have no runtime UPDATE grant. Do not display the old profile rating as the new rating.
- **Owner:** Yes for the web profile, result display and any import of local records. Reuse of the current result transaction needs no new taste choice.

### SRV-07 — Handles, icons, privacy, follows and blocks

- **Kind:** (b).
- **Evidence:** `src/online/accounts.ts:12–43,47–95,98–114`; `src/account/profile.ts:29–45,62–69`; `src/plugin/service.ts:53–85`; `src/match/store.ts:27–31,113–118,146–150`; `supabase/migrations/0005_accounts_v2.sql:8–45`; `0008_accounts_safety.sql:13–38`.
- **Web today:** The account menu shows the signed-in player's provider name and picture. It has sign-out and deletion. It does not pick the public handle or icon. The new HTTP API already has profile, handle, relations, deletion and alert-preference methods.
- **Change and size:** **M.** Use `AccountService` through those routes. Reuse `handleProblem` and preset icons. Lift the handle availability check from `PluginService.handle` if the web form needs it. Keep the player's provider details in the private account view.
- **Dependencies:** SRV-15 to SRV-18. Human game starts depend on a handle.
- **Risks:** The database reserves old handles. Renames have a 90-day rule after the first change. A block removes follows both ways; unblock does not restore them. Current games continue. Presence defaults to mutual follows. Some stored settings are broader than the current service checks: `store.lobby` does not filter `accepting_games`, and no leaderboard service appears in this lane. A stored column is not proof of an active feature.
- **Owner:** Yes for web controls and defaults. Keep the current service rules unless the owner changes them.

### SRV-08 — Reports and owner moderation

- **Kind:** (b).
- **Evidence:** `src/online/safety.ts:19–48,50–66,71–103,107–129`; `src/online/accounts.ts:24–30`; `src/api/http.ts:91–94`; `src/plugin/server.ts:207–211`; `plugin-deploy/runtime-role.sql:90–115,156–164`; `docs/specs/chatgpt-mvp/release/LIVE-CHECKS.md:28`.
- **Web today:** The local game has no call to `SafetyService`. The release API has `POST /api/reports`. The release packet keeps reporting off the plugin's visible controls; the server tool remains app-only.
- **Change and size:** **S** for server reuse; **M** with web report and block controls. Call `report` with the verified actor. Keep the owner queue, action, appeal and hold methods on the admin path. Do not publish those methods as player routes.
- **Dependencies:** SRV-07, SRV-14 to SRV-17 and SRV-20.
- **Risks:** `safety.ts` bounds text, validates categories and checks message evidence. It has no per-user report rate limit. Its queue limit of 200 is a read limit, not an abuse limit. `who` checks shared seats for a game target; a handle or user-ID target need not share a game. Suspension writes `auth.users.banned_until`. The web token verifier does not check that field on each request. See SRV-17 for the token limit.
- **Owner:** Yes for visible reporting, the report scope and owner support flow. The admin access boundary is a fixed requirement.

### SRV-09 — Existing HTTP handler and browser client

- **Kind:** (b). This is web support code already built in the release, with no production web caller.
- **Evidence:** `src/api/http.ts:18–39,47–58,67–131`; `src/online/client.ts:17–68`; `src/api/http.test.ts:37–126`; `tools/plugin-server.mjs:17,52–60`.
- **Web today:** Main has no `src/api/http.ts` or `src/online/client.ts`. On the release, the production entry imports only the internal job handler from that API module. It never creates the web API handler.
- **Change and size:** **S** to reuse the handler and typed client. Wire them with SRV-16 and SRV-17. Use bearer session tokens. Keep the command retry ID. The client already converts protocol errors and retries network or server faults.
- **Dependencies:** SRV-03, SRV-15, SRV-16 and SRV-17.
- **Risks:** This handler is an early API, not full parity with the current tools. It has a 16 KiB request body bound. Create and command requests share four engine slots per handler instance. The limits do not reserve a slot for another user. Tests exist for these rules; this survey does not run them.
- **Owner:** No taste choice for the transport connection itself. New visible online features still need an approved spec.

### SRV-10 — Browser polling needs the setup-state fix

- **Kind:** (b), with a code fault in the reusable browser client.
- **Evidence:** `src/online/client.ts:77–126`; `src/match/protocol.ts:57,99–106`; `src/match/service.ts:195–199`; `src/online/client.test.ts:37–60`.
- **Web today:** It has no server-game poll. The release client merges revisions, fills gaps, pauses when the page is hidden and reads again when the page returns.
- **Change and size:** **S.** Reuse `watch`, but keep polling for `setup`. At `client.ts:104`, it stops for every state other than `waiting` and `playing`. A human game can stay in `setup` while the other player chooses Ready. Add a focused test for that state before adoption.
- **Dependencies:** SRV-04, SRV-09, SRV-16 and SRV-17.
- **Risks:** The board can remain in setup until a manual refresh or page event. The existing tests shown here cover revision merge and gaps, not this setup stop. The merge also drops equal revisions. Account privacy and presence can change without a game revision; check how the web page refreshes those fields. The poll hides read errors, so the page needs its own clear stale-state behavior.
- **Owner:** No taste call for continued polling during setup. Poll speed and stale-state words are owner choices.

### SRV-11 — Deadlines, deletion jobs and cleanup

- **Kind:** (b), with stale release instructions to correct.
- **Evidence:** `src/online/jobs.ts:16–20,121–155`; `src/match/service.ts:75–87,410–436`; `src/api/http.ts:136–164`; `docs/specs/chatgpt-mvp/release/cron-mvp.sql:19–36`; `release/RUNBOOK.md:120–131` in the same release folder; `public/privacy.html:82`; `src/online/jobs.db.test.ts:95–99`; `src/online/deadline.ts:1–4,44–77`; `src/match/protocol.ts:46–47`.
- **Web today:** It has no shared daily-game deadline or job connection. Local play does not need these jobs. The release has the internal job adapter and SQL schedules.
- **Change and size:** **S** to reuse the jobs after SRV-15. Use the existing minute tick and daily cleanup/deletion job. Keep internal calls separate from browser authentication. They need a secret header of at least 32 characters.
- **Dependencies:** SRV-03, SRV-15 and the approved production job setup. SRV-01 needs the daily job.
- **Risks:** `jobs.ts:152` deletes outbox rows when `created_at` is over 30 days old, even if `done_at` is null. `cron-mvp.sql:8` and `RUNBOOK.md:122` say unsent rows stay and only finished rows are removed. The public privacy page and the database test both specify removal after 30 days. Keep that code behavior and correct the packet. This is a checked document fault, not a live-data claim. Live-clock calculations exist in `deadline.ts`, but only the reminder job calls the helper. The Create schema refuses human live games. Working human clocks are not a complete plugin feature that the web can adopt. Tick and daily work need an HTTP outcome check; a cron launch alone proves no service result. The function has a 30-second build limit. Large job batches need a later load check.
- **Owner:** No taste call to correct the packet to match the public policy, code and test. A change to the retention rule needs the owner. Installing schedules is a live step.

### SRV-12 — Email and reminders are built, but off for this release

- **Kind:** (b).
- **Evidence:** `src/online/jobs.ts:27–49,60–111`; `src/online/mail.ts:13–32`; `src/online/accounts.ts:98–114`; `src/api/http.ts:89–90,141–146`; `docs/specs/chatgpt-mvp/release/RUNBOOK.md:26,48,68–70,120–131`.
- **Web today:** Account cloud save sends no turn mail. The release packet schedules no outbox or reminder job. It keeps mail configuration absent. The server stores turn events and can send mail through the existing sender if later enabled.
- **Change and size:** **M** if approved. Reuse the sender, preference methods, activity check, queue and reminder calculation. Add the production mail setup through the approved deploy configuration path; its current validator refuses mail keys. Add web game links and Alerts controls first.
- **Dependencies:** SRV-07, SRV-11, SRV-15, SRV-17 and SRV-19.
- **Risks:** Email links target `/g/<id>`, which has no web game flow yet. Retries use an outbox key, but the sender's stated duplicate window is 24 hours. The queue marks unsupported event kinds such as `game_finished` done without a sender. Stored push preferences do not supply a push service. Do not promise push, or finished-game mail, from this code.
- **Owner:** Yes. Enabling alerts changes the release scope and sends messages to players. Keep mail off until that choice and setup are complete.

### SRV-13 — Shared board settings need one storage rule

- **Kind:** (b).
- **Evidence:** `src/plugin/settings.ts:8–23`; `src/plugin/service.ts:67–71`; `supabase/migrations/0013_player_settings.sql:5–12`; `src/account/sync.ts:21–28,47–57`; `src/api/http.ts:83–90`; `src/online/accounts.ts:12–16`.
- **Web today:** It syncs skill, coordinates, sound, promotion, pace, threats and labels in `user_data.settings`. The plugin stores `symbols_only`, `show_threats` and `last_setup` in `player_settings`. The current profile PATCH does not accept these board fields.
- **Change and size:** **M.** Lift `SettingsService` and its checks out of the plugin boundary for shared use. Add an HTTP read/write method. Map only settings with the same meaning. Choose where a common setting lives and how its first value is selected.
- **Dependencies:** SRV-07, SRV-15 to SRV-18 and the settings UI lane.
- **Risks:** Two independent stores can overwrite or disagree about the player's choices. Web labels and plugin symbols are not proved to mean the same thing. `show_threats` has a closer web match. A database row does not update the local web controls by itself.
- **Owner:** Yes for which settings are shared and which stay per device or surface. The storage connection then follows that choice.

### SRV-14 — Durable per-player attempt counters

- **Kind:** (b).
- **Evidence:** `src/plugin/service.ts:15–31`; `src/plugin/server.ts:65–74`; `supabase/migrations/0014_plugin_tool_tries.sql:4–12`; `plugin-deploy/runtime-role.sql:166–170`; `src/match/store.ts:105–111`.
- **Web today:** No web game calls use these counters. The short invite-code counter is in the shared store, so browser redeems through the current API do use it.
- **Change and size:** **S** to lift the durable counter from `PluginService` into a shared server service. Retain the database upsert and count before service work, in its own commit. Find uses the Create budget. Keep the per-user total common to web and ChatGPT if the owner picks that rule.
- **Dependencies:** SRV-15 and SRV-20.
- **Risks:** The SQL permits only four tool names. A web call must either use the corresponding action bucket or use an approved schema change. Do not count one call twice through two adapters. Current budgets are 120 Computer/minute, 60 Create/minute, 60 Open/minute and 30 reports/hour. Failed service calls count. These are attempt limits, not lifetime storage limits.
- **Owner:** No new taste call to reuse the existing counter method. Yes for new budget values or a rule that splits budgets by surface.

### SRV-15 — Database and restricted server role

- **Kind:** (b). The plugin supplies the schema and grants; the web can use the same server data.
- **Evidence:** `supabase/migrations/0005_accounts_v2.sql:8–69`; `0006_games.sql:10–206`; `0007_jobs.sql:7–39`; `0008_accounts_safety.sql:44–77`; `0009_invite_tries.sql:8–14`; `0010_game_setup.sql:3–27`; `0011_matchmaking.sql:3–4`; `0012_results.sql:3–35`; `0013_player_settings.sql:3–12`; `0014_plugin_tool_tries.sql:4–12`; `plugin-deploy/runtime-role.sql:38–170`; `tools/plugin-db-check.mjs:3–44`.
- **Web today:** It reads and writes its own `user_data` row through Supabase RLS. It does not read the new game tables. Their migrations revoke browser-role access.
- **Change and size:** **M** for the database release step; **S** additional work if that step is already complete for PR 61. Reuse migrations 0001–0014 and the role blocks. No separate web player or game schema is needed for the checked API. The guarded `docs/specs/chatgpt-mvp/release/apply-0010-0013.sql:231–247` includes 0014 and its grant despite its older filename.
- **Dependencies:** The release packet's foundation, backup, Auth trigger and SQL window. SRV-02, SRV-03 and all online services depend on this item.
- **Risks:** Actual installation is unverified. The startup probe refuses missing schema or grants. The runtime role has cross-player table policies, so server actor and seat checks protect each player; do not send its connection to the browser. It cannot directly read or delete `auth.users`, or edit badge/result history. Jobs use narrow security-definer helpers. Production TLS verifies the certificate and host (`tools/plugin-db-config.mjs:3–9`). Preserve browser RLS on cloud saves. Use existing role blocks, not a second `create role` on an installed role.
- **Owner:** No taste choice to retain the server/browser access boundary. Database writes and the release window need a go. New web-only tables need a separate approved spec only if a chosen feature needs them.

## Kind (c): Web work with no complete plugin equivalent

### SRV-16 — Connect the existing web session to the API

- **Kind:** (c). The missing part is a session-to-client connection, not a new sign-in service.
- **Evidence:** `src/account/client.ts:14–55`; `src/account/account.ts:78–89`; `src/online/client.ts:17–34`; `src/api/http.ts:24–39`; `src/plugin/consent.ts:18–26`.
- **Web today:** The Supabase client stays inside `connect`. It exposes session callbacks, provider sign-in, sign-out, deletion and cloud save. It exposes no token getter to `onlineClient`. The plugin receives its access token from the host connection instead.
- **Change and size:** **S.** Expose a small token getter from the existing account client. Use the SDK's current session, with refresh handling. Pass it to `onlineClient`. On account change or sign-out, stop polls and clear the previous player's private view. Keep local play available without a session.
- **Dependencies:** SRV-09, SRV-17, SRV-25 and SRV-26.
- **Risks:** Reading a stored name is not proof of a valid server session. Do not copy the consent storage key or an MCP token into the web session. The issuers must use the same Supabase project for shared player IDs. Production project and signing-key settings are unverified.
- **Owner:** No taste choice for this narrow connection. Yes if the web sign-in location or account flow changes.

### SRV-17 — Mount a same-site browser API with the existing access checks

- **Kind:** (c).
- **Evidence:** `tools/plugin-server.mjs:21–54,55–60`; `tools/plugin-server-build.mjs:15–26,61–75`; `src/api/http.ts:24–39,47–51,99–131`; `src/plugin/http.ts:45–57,73–77`; `docs/HOSTING.md:15`.
- **Web today:** `/api` is absent from the production dispatch and build routes. Requests fall into the MCP handler, which refuses non-MCP paths. Setting `onlineClient.origin` to the other plugin origin does not solve this.
- **Change and size:** **M.** Create `AccountService`, `SafetyService`, `sessionVerifier` and `createApiHandler` at server setup. Dispatch `/api/*` to it. Add the Vercel route/function entry while preserving the path and expected Host. Use the site origin for the API. Include that route in the approved deploy's local checks after the build spec passes.
- **Dependencies:** SRV-02, SRV-09, SRV-15, SRV-16 and SRV-20.
- **Risks:** The API allows only the exact site origin and Host. It sends no CORS permission. It refuses cross-site and even `same-site` fetch metadata. A subdomain therefore needs a different explicit design. It accepts a bearer token in the Authorization header, not a cookie. Cross-site form requests cannot provide that token, and the origin check adds a guard against CSRF. Do not add cookie authentication without its own CSRF design. The verifier checks issuer, signature, expiry, role, non-guest status and exact `authenticated` audience; it refuses tokens with `client_id`. It allows ES256/RS256 only. It does not bound token age to one hour itself or recheck the provider session. The stated one-hour revocation/ban delay depends on the issued expiry. Actual expiry is unverified. Production startup also depends on the plugin OAuth and database checks before any function route serves.
- **Owner:** Pick the existing same-site bearer design. That is a host design choice for approval. Token validation and route wiring then have one fixed contract. If immediate ban/session removal is required, approve that requirement before adding a provider or database check.

### SRV-18 — Add HTTP parity for the newer services

- **Kind:** (c). The service equivalent exists; the browser route equivalent does not.
- **Evidence:** The complete route table is `src/api/http.ts:70–95`. The client methods are `src/online/client.ts:40–68`. Compare `src/match/service.ts:213–292,378–384`, `src/plugin/service.ts:61–85`, `src/plugin/server.ts:168–176,213–225`, and `src/plugin/settings.ts:16–23`.
- **Web today:** The release API covers game create/read/commands/invite/redeem, active games, basic profile, handle set, deletion, alert preferences, follows/blocks and reports.
- **Change and size:** **M.** Add thin HTTP and client methods for lobby, Find, Accept, Cancel, invitation preview, player record, finished history, board settings and handle availability. Return the same checked service types. `choose`, rematch, preset messages, claims, draws and resignation already fit the commands route; they need no separate server logic.
- **Dependencies:** SRV-04 to SRV-09, SRV-13, SRV-16, SRV-17 and SRV-20.
- **Risks:** `POST /api/games` calls `games.create(actor, body)` with no start command ID. The create schema rejects extra fields. The plugin passes a separate start ID and uses stored receipts. A lost web create reply can therefore leave a game that a new create repeats. Add a checked start receipt field or header, and pass it to Create/Find. Also, `kind: random` on Create only opens a table; it does not call Find. Do not promise matching from the current Create endpoint.
- **Owner:** No taste call for missing method wiring or safe create retries. Yes for which methods and features the first web release exposes.

### SRV-19 — Web game and invite URLs that survive sign-in

- **Kind:** (c).
- **Evidence:** `src/api/http.ts:63–81`; `src/online/mail.ts:13–18`; `src/account/client.ts:29–31`; **main** `src/main.ts:30–66,174–186`; `src/screen/links.ts:13–23`; `tools/plugin-server-build.mjs:15–26,64–74`.
- **Web today:** The web entry reads position and move query fields. It does not read `/g/<id>` or `/j/<token>`. The release API creates `/j/<token>` links and mail creates `/g/<id>` links. The build has no explicit page routes for them. A static fallback alone would not add the missing app behavior.
- **Change and size:** **M.** Add page routing for game and join URLs. Preserve only a checked local return target through provider sign-in. Load the game or invite preview after sign-in, then let the player join. Add exact return URLs to the existing Auth configuration when required. Keep the existing position-share links working.
- **Dependencies:** SRV-05, SRV-07, SRV-16 to SRV-18 and the web navigation lane. SRV-12 needs this before mail is enabled.
- **Risks:** The current provider redirect uses origin plus pathname; it omits the query. That works for the present root login, but can lose a query-based pending invite. Path links also need root-based assets or another checked route design. Never let a return field choose an external redirect. Keep invite tokens out of unnecessary logs and third-party page requests.
- **Owner:** Yes for URL form, join preview and the sign-in return flow. The need to resume the intended action after sign-in is a functional requirement.

### SRV-20 — Apply web abuse limits before opening the API

- **Kind:** (c).
- **Evidence:** `src/api/http.ts:107–125`; `src/plugin/http.ts:7–10,78–84`; `src/plugin/server.ts:71–74`; `src/plugin/service.ts:15–31`; `src/online/safety.ts:36–48`; `src/match/store.ts:49–56,105–111,123–140`.
- **Web today:** The API has four engine-request slots per instance and a body bound. It does not call `toolTry`. It has no per-user slot cap. The MCP adapter gives one user at most three of its four active slots. Invite short-code attempts already share the durable ten-per-hour limit.
- **Change and size:** **M.** Reuse SRV-14 before Create, Find, Computer and report work. Apply an account slot cap at the HTTP boundary. Check the total worker budget across API and MCP, since each handler has its own counter. If both keep four slots, the shared process can admit four through each adapter. Add tests for refused calls and shared budgets under the later build task.
- **Dependencies:** SRV-08, SRV-14, SRV-15, SRV-17 and SRV-18.
- **Risks:** `safety.ts` supplies no hidden quota. A list limit of 100 games does not cap the number created. The checked Create path has no active-game count check. Per-instance slots do not cap total work across server instances. The checked adapters have no IP request-rate limiter. Host-level firewall limits are unverified. A shared signed-in API must not become a way around the plugin limits.
- **Owner:** No taste choice to close that bypass. Yes for any new numeric budget, active-game cap, IP rule or provider cost limit. Pick the existing per-player action budgets first.

## Kind (d): Plugin parts that the web app does not need

### SRV-21 — MCP tools, widget messages and frame recovery

- **Kind:** (d).
- **Evidence:** `src/plugin/server.ts:40–76,120–176,221–225`; `src/plugin/http.ts:115–127`; `src/plugin/service.ts:87–104`; `src/plugin/client.ts:17–43`; `src/plugin/app.ts:34–37`; `supabase/migrations/0013_player_settings.sql:3–4`.
- **Web today:** It owns its top-level page and local state. It has no `window.openai` or MCP caller in the checked web path.
- **Change and size:** **S; no web lift.** Leave tool registration, resource hashes, host visibility hints, `_meta`, widget messages, frame state and `plugin_boards` selection behind the plugin boundary. Reuse the underlying services through HTTP.
- **Dependencies:** None for a web lift. The combined plugin deployment still needs these parts.
- **Risks:** Copying the plugin client carries `callServerTool`, board IDs, host timeouts and remount recovery into a page that has no host. MCP resource CSP currently has no connect domains. That does not define the web page's HTTP permissions.
- **Owner:** No taste call to exclude this host transport from the web client.

### SRV-22 — OAuth consent and MCP resource tokens

- **Kind:** (d).
- **Evidence:** `src/plugin/consent.ts:17–26,45–66`; `src/plugin/consent-config.ts:4–15`; `src/plugin/auth.ts:20–53`; `src/plugin/http.ts:61–75`; `plugin-deploy/oauth-audience-hook.sql:48–57`; `src/api/http.ts:24–39`.
- **Web today:** It signs in directly with the provider through Supabase. The consent page signs a player into King Down, then lets ChatGPT connect to that King Down account. It does not sign the browser into ChatGPT.
- **Change and size:** **S; no web lift.** Keep `/authorize`, `authorization_id`, allowlisted OAuth clients, exact `/mcp` audience and discovery metadata for the plugin. The browser API uses its normal web session token.
- **Dependencies:** SRV-25 and SRV-26 explain the account already shared by these paths.
- **Risks:** A web session is refused at `/mcp`. An MCP token is refused at `/api`. The audience hook changes audience only for a mapped OAuth client and preserves other claims. Do not replace the web login screen with the consent page: it needs a pending authorization request and uses a separate storage key. The MCP verifier also asks Supabase to confirm the token's user on each request; the web verifier does not.
- **Owner:** No taste call to keep these token types separate. The plugin's live client setup still needs the release go.

### SRV-23 — Review-account password exception

- **Kind:** (d).
- **Evidence:** `src/plugin/consent.ts:30–36`; `src/plugin/consent.html:3`; `plugin-deploy/review-signup-hook.sql:3–12,25–46`; `plugin-deploy/oauth-audience-hook.sql:30–46`; `supabase/README.md:19–26`.
- **Web today:** It offers Google and GitHub. Facebook is behind a query switch. It has no general password account screen.
- **Change and size:** **S; no web lift.** Keep the review password exception for its stated review use. Keep the Auth hooks that protect the shared Supabase project when Email is enabled.
- **Dependencies:** The plugin submission's approved Auth setup. No dependency for normal web provider sign-in.
- **Risks:** Enabling Email without those hooks opens more than a hidden form. The hooks also affect token issue for existing accounts that add a password. Actual hook installation and allowlist contents are unverified. This survey does not read credentials or account files.
- **Owner:** No new web password feature follows from this exception. A public password flow is a separate owner choice and build.

### SRV-24 — Old plugin test tables and board selections

- **Kind:** (d).
- **Evidence:** `supabase/migrations/0006_games.sql:5–6,105–110`; `plugin-deploy/runtime-role.sql:10–24,29–35`; `plugin-deploy/board-grants.sql:1–8`; `src/plugin/service.ts:87–104`; `src/online/jobs.ts:153`; `supabase/README.md:67–94`.
- **Web today:** It uses none of the old `plugin_matches`, command or invite tables, or `plugin_boards` selections.
- **Change and size:** **S; no web lift.** Use `games` and its current service. Keep board records for plugin remounts only. Do not use old plugin test rows as a web migration source.
- **Dependencies:** SRV-15 still includes the old foundation because the release migration order needs it.
- **Risks:** Migration 0006 repoints board links to the new games and clears old test links. Old plugin code cannot continue unchanged after that step. The release packet calls for a short outage. Dropping old tables or grants is outside this survey and needs its own checked task.
- **Owner:** No taste call to omit obsolete test storage from new web features. Retirement is a separate state change.

## Kind (e): The web app already has it

### SRV-25 — Web provider sign-in and sign-out

- **Kind:** (e). No base sign-in gap.
- **Evidence:** **main** `src/main.ts:196–197`; **main** `src/account/client.ts:14–38`; `src/account/account.ts:2–5,40–54,78–89,105–120`. The release diff changes deletion text and its comment, not the provider flow.
- **Web today:** Settings offers Google and GitHub. Facebook requires `?facebook=1`. It uses PKCE and a persistent Supabase session under `kingdown.auth`. It loads the client after the board or on sign-in. Sign-out keeps device saves.
- **Change and size:** **S; no replacement needed.** Add only SRV-16 and any approved navigation changes.
- **Dependencies:** The existing provider and Supabase setup. Actual provider enablement and redirect configuration are unverified.
- **Risks:** Sign-out is local. It does not revoke another device's session or the plugin connection. Do not promise global sign-out. The account UI can draw stored provider details before token validation.
- **Owner:** No new taste call to keep current sign-in. A different provider list or account-page design needs approval.

### SRV-26 — One Supabase user ID maps to one player

- **Kind:** (e), for the shared ID design. Account linking across different IDs remains unverified.
- **Evidence:** `src/account/client.ts:9,40–49`; `src/account/account.ts:80–87`; `src/plugin/consent.ts:18–19,50–55`; `src/plugin/auth.ts:33–40,45–53`; `src/api/http.ts:34–38`; `supabase/migrations/0001_accounts.sql:10–22`; `0006_games.sql:49–65`.
- **Web today:** Cloud save keys on the Supabase user ID. The web API returns that token's `sub` as its actor. MCP returns the resource token's `sub` as its actor. Profiles and game seats refer to that same Auth ID. There is no separate ChatGPT-player table in the checked schema.
- **Change and size:** **S; no new identity table needed.** Use the same Supabase project and the same King Down account in both sign-in paths. Keep the two session stores separate. Make the account choice clear when a player connects ChatGPT.
- **Dependencies:** SRV-16 and SRV-17 for browser service use; SRV-22 for plugin consent.
- **Risks:** Equal email text is not checked here as proof of equal player ID. No `linkIdentity`, `unlinkIdentity` or account-merge call appears in the checked production source. How the live project links different social providers is unverified. If a player signs in with two distinct Auth IDs, these services keep two players. A ChatGPT account does not itself become the King Down player ID.
- **Owner:** Pick the same-account path for the first web release. A self-service account merge or provider-link feature needs a separate owner choice and spec.

### SRV-27 — Local play and cloud save remain available

- **Kind:** (e).
- **Evidence:** **main** `src/main.ts:78–109,174–196`; `src/account/client.ts:40–51`; `src/account/sync.ts:8–16,21–28,104–127,145–175`; `supabase/migrations/0001_accounts.sql:19–27,51–63,135–151`.
- **Web today:** It keeps local game data, lessons and settings. A signed-in player syncs those three sections to their own `user_data` row. Section times settle conflicts. Offline changes retry later.
- **Change and size:** **S; no server-game replacement is required for this feature.** Keep it when adding online play. Decide how an online game appears beside the current local save, rather than treating the local save as a server record.
- **Dependencies:** None for current use. SRV-13 needs the shared-setting decision.
- **Risks:** This is one saved local game, not the server game's inbox, history or result record. Existing cloud save does not upload a game into `games` or earn server badges. The two data paths need clear names in the future web spec.
- **Owner:** No new taste call to retain the feature. Yes for how local and online games appear together.

### SRV-28 — Four computer skill levels

- **Kind:** (e).
- **Evidence:** **main** `src/screen/play.ts:7,79,377–390`; `src/ai/skill.ts:3,20–25`; release `src/match/worker.ts:73–90`; the `main..682e58bd` diff in `src/ai/skill.ts` adds only the explicit `timeMs` interface field.
- **Web today:** It already uses Beginner, Casual, Club and Strong through `skillPlan`. The plugin server reuses the same time, score-range and random-move plan.
- **Change and size:** **S; no new level system needed.** Use the existing names for web or server play. Reuse server level input only for server games.
- **Dependencies:** SRV-03 and SRV-04 only if the web uses server computer games.
- **Risks:** Equal labels and skill plans do not prove equal results across evaluators, hardware or archived engines. This survey runs no strength check. Avoid a new level service just because a test file is named `levels.test.ts`.
- **Owner:** No taste call to reuse current levels. Changes to names, defaults or strength need approval and suitable checks.

## Open questions for the owner

1. **Which web games use the server?** Options: (1) human games only; (2) human games plus opt-in saved computer games; (3) all games after sign-in. **Pick: 2.** Keep local play and its save. Add server records where the player chooses them. This sets the scope of SRV-03, SRV-06 and SRV-27.
2. **Keep the API on the site origin?** Options: (1) `kingdown.dev/api/*`; (2) a separate API origin with an explicit cross-origin design. **Pick: 1.** The handler already requires same-origin dispatch. Use its bearer session design. This sets SRV-17.
3. **How does the player use one account on both surfaces?** Options: (1) use the same existing King Down provider account; (2) add provider linking; (3) add account merging. **Pick: 1.** Explain that choice in the account flow. Check the resulting user IDs with test accounts in the later approved build. Treat 2 and 3 as separate features.
4. **How fast must suspension or session removal stop web access?** Options: (1) on token expiry; (2) on every request through a provider or database check. **Pick: 1 for the first build, with a checked one-hour maximum issued lifetime.** The current verifier implements expiry-based access. It does not impose that lifetime itself. If the owner needs immediate removal, choose 2 before API release.
5. **Which board settings follow the player between surfaces?** Options: (1) only settings with the same meaning; (2) all settings; (3) keep each surface separate. **Pick: 1.** Start with the threat setting. Review symbols and labels before mapping them. Use one common storage rule for each shared setting.
6. **Enable mail in the first web online release?** Options: (1) keep alerts off; (2) add turn and deadline mail. **Pick: 1.** Build working game links and alert controls before 2. Push has no complete sender in the checked code and stays outside that choice.
7. **Which player safety controls ship on the web?** Options: (1) block and report with the existing owner review path; (2) block only, with a stated private report path. **Pick: 1 before broad human play.** This is a scope improvement for approval. Report quotas and admin access checks still apply in either case.
8. **Do web and ChatGPT share action budgets?** Options: (1) one per-player budget across both; (2) separate budgets for each surface. **Pick: 1, using the current action counts first.** This closes the web bypass and avoids a second account allowance. New active-game or IP limits need measured requirements before numeric choices.

These questions set build scope. They do not give a deploy, database or run go. Live readiness remains unverified. The next build spec can reuse the services above, add SRV-16 to SRV-20, and check the polling fault and correct the stale release instructions before the owner reviews a rendered web sample.
