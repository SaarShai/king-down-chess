The seven lanes find most of the feature gaps. This report adds nine items, checks ten large or high-risk items, and corrects five more claims. The main missed fault is the web service worker: it can cache private API replies when the web starts to use that API. The lanes also miss the card-hand data needed by local game links and the missing reader for account notices. Direct card use and Collection costs have code on a separate branch. They are absent from PR 61, but they do not need a full new build. The quick-start records disagree; they do not prove a fault with one right fix. This report checks source only. It makes no claim about the live service, device results, or current test results.

## Scope and method

- **M** is main at `38a6bbffb3b85f10bb9e6d23e8e1f394b781b4f4`.
- **R** is the requested PR head, `682e58bd47e38aa1e571deb17afb64f3183149a1`.
- File references give the line numbers in that Git version. Paths start at the repo root unless stated otherwise.
- The release ref now points to `442c5eb3`. Its three-file delta changes the queued name-screen return, its test, and its ticket. The feature findings below use R. No later web feature appears in that delta.
- **S** means a bounded change. **M** means a connected screen or several modules. **L** means several flows or a complete client connection. For inherited code, S can mean review with no web edit.
- The check plan is: read all seven inventories; scan the diff by directory; trace the important callers; compare conflicting claims.
- The pass criteria are source references for each finding, ten explicit item checks, and a clear split between code, plans, and unknown runtime results.
- The survey changes no repo file or worktree. It runs no test, browser check, game, build, install, or network request. The named scratch report is the only output file.

The directory scan covers these areas. An area with broad coverage can still have a missing contract or release condition.

| Area | Result of the source read |
| --- | --- |
| `src/account`, `src/api`, `src/online` | The session, route, safety, rating, mail, and settings gaps mostly have coverage. Account notice delivery does not. |
| `src/match`, `engines` | Setup, receipts, results, and the archive have coverage. The old-engine adapter contract needs an explicit item. |
| `src/plugin`, its screens, CSS, and assets | The main screen and host features have coverage. Some claims confuse absent release code with absent code on all branches. |
| `src/rules`, `src/ai`, shared readers, renderer, and table | The main inherited changes have coverage. Local card links need more than the Classic-only link item. |
| `src/balance` | The new Classic exclusion has no inventory item. It is a tool limit, not a web rule. |
| `public`, `vite.config.ts` | The shipped policy/support pages and discovery precache exclusion need items. Runtime API caching needs a fix before API use. |
| `tools`, `.github` | The main checks have coverage. The moderation command and first-fault parser need explicit entries. |
| `supabase`, `plugin-deploy` | The service and role work has coverage. A source merge does not install it. No secret file forms part of this read. |
| `docs`, `art-src` | The specs, tickets, reports, and asset records mainly support existing items. Research and drafts do not prove a built feature or approval. |

## Missed items, grouped by kind

### Kind (a): shared code at merge

### CRIT-01 — Public support and policy pages ship with the site

- **Kind:** (a). The site build copies these files. Existing Account links already open Privacy and Terms.
- **Evidence:** R `public/support.html:28–54`; `public/privacy.html:34–85`; `public/delete-data.html:35–53`; `public/terms.html:32`; `vite.config.ts:46–55`. M `src/account/account.ts:37–54` links the policy pages.
- **Web today:** It has Privacy, Terms, and deletion instructions. It has no `public/support.html`. Its policy pages have the older account and feature text.
- **Change:** **S**, no copy or new policy-page build. Separate the inherited pages from the future policy work in DEC-40. Add a visible Support entry only if the owner approves its place.
- **Dependencies:** The shared deletion schema and job for the new deletion claims. New web online features need their own scope text.
- **Risks:** The new privacy page says that the website has sign-in and cloud saves. It assigns people games and badges to the plugin. Change that text when the web adds those features. The Support file does not add a Support button to the web menu.
- **Owner taste call:** No for reporting the existing files. Yes for a new entry or policy change. Live support delivery and hosted retention settings are **unverified**.
- **Inventory gap:** DEC-40 covers future support and data work. It does not list this shipped web change as kind (a).

### CRIT-02 — Discovery files leave the static precache list

- **Kind:** (a). The normal web build uses this change.
- **Evidence:** M and R `vite.config.ts:46–55`. R line 48 excludes `.well-known/` from the file list. R `tools/plugin-server-build.mjs:15–25` serves the domain challenge separately.
- **Web today:** The old build includes public files in the precache list without this exclusion.
- **Change:** **S**, merge only. Keep this exclusion when the API work changes the build.
- **Dependencies:** None for the build change. Domain proof remains a plugin release step.
- **Risks:** This is only a precache exclusion. It does not change the runtime fetch handler. CRIT-06 covers that separate problem. A challenge value must not become ordinary cached game content.
- **Owner taste call:** No. This preserves a service boundary.
- **Inventory gap:** CHECKS-16 and CHECKS-23 discuss updates. Neither identifies this actual shared build change.

### CRIT-03 — The common check runner finds browser fault lines

- **Kind:** (a). The web check runner imports the changed parser.
- **Evidence:** R `tools/lib/first-fault.mjs:6–18`; `tools/check.mjs:11,134,177`. The diff adds browser-style `name.method: Timeout` and error prefixes.
- **Web today:** Its runner can select a less useful line from a browser failure log.
- **Change:** **S**, merge only. Keep this parser with the existing runner. R `tools/lib/layout-message.mjs:1–9` also supplies reusable box text, but only the plugin check calls it today.
- **Dependencies:** None.
- **Risks:** Better fault text does not fix a failed check or establish a pass. Do not count this as a player feature.
- **Owner taste call:** No.
- **Inventory gap:** The checks lane covers timing and runner controls, but not this inherited reporting fix.

### Kind (b): reusable plugin work

### CRIT-04 — The owner already has a moderation command

- **Kind:** (b). Reuse the existing server command for web reports. It has no ChatGPT host dependency.
- **Evidence:** R `tools/mod.ts:1–10,17–38`; `package.json:33`; `src/online/safety.ts:50–129`. The command exposes list, show, action, appeal, and hold operations.
- **Web today:** It has no player report control. Once reports enter the common service, the existing command can read them.
- **Change:** **S** for reuse and a checked support procedure. Do not add an admin web page as a required part of the first port. SRV-08 supplies the player report work.
- **Dependencies:** SRV-08, SRV-15, and the approved admin setup. CRIT-08 covers the player's receipt of an action notice.
- **Host coupling:** None. The command calls `SafetyService` directly. The admin connection and command arguments replace any browser or MCP caller.
- **Risks:** This command needs admin rights. The player API must not expose these operations. It also escapes control characters before it prints report text.
- **Owner taste call:** Yes for the support procedure and staffing. No new taste choice for keeping admin methods outside player routes.
- **Inventory gap:** SRV-08 names the owner service methods, but gives no command entry or evidence that this operator tool already exists.

### CRIT-05 — Old server engines keep one built-in strength

- **Kind:** (b). Reuse the existing archive adapter through the web service. No host code is needed.
- **Evidence:** R `src/match/index.ts:19–26,42–46,74–90`; `tools/engines.test.ts:36–60`; `docs/match-foundation.md:50–54`. The adapter detects old snapshots without hands, adds empty hands, and removes the level option for those engines.
- **Web today:** Local saves use the web engine. The web has no server-game caller. This adapter applies only when it opens an old server game.
- **Change:** **S** for service reuse and accurate acceptance criteria. Keep the archived bundle and its fixture. Do not rebuild an old game on the current worker to add a level.
- **Dependencies:** SRV-03, SRV-15, and the archive in the deployed runtime.
- **Host coupling:** None. This is a Node worker adapter. The browser uses HTTP views.
- **Risks:** Four level labels do not mean four distinct strengths in these old games. `maxTimeMs` and `maxDepth` still apply. The archive tests express that contract; this survey does not run them. The deploy can skip the engines-in-use query when its database input is absent (`tools/deploy.sh:190–195`).
- **Owner taste call:** No for preserving existing saves and reporting their limit. Yes for any new user message about that limit.
- **Inventory gap:** SRV-03 and DEC-56 mention the archive. SRV-28 warns about strength differences. None states this exact supported adapter behavior.

### Kind (c): web work with no plugin equivalent

### CRIT-06 — Keep private API replies outside the service worker cache

- **Kind:** (c). This is a concrete web prerequisite. The plugin has no equivalent top-level site service worker.
- **Evidence:** M and R `public/sw.js:49–58,61–68` are unchanged. Every same-origin non-navigation GET reaches `asset()`. That function reads the cache first, ignores the query during lookup, and stores a successful basic response. R `src/api/http.ts:49` sends `Cache-Control: no-store`; `src/online/client.ts:34` also requests `no-store`. Neither changes this explicit Cache Storage code.
- **Web today:** It does not call the game API, so this read does not establish a current live exposure of game API data. The unsafe routing exists before that API connection.
- **Change:** **M** with the cache/update check. Restrict asset caching to public static resources. Bypass private API and service paths. Include the removal of any old private cache entries in the update design.
- **Dependencies:** CLIENT-11 or SRV-17. This must precede real web API use. Extend CHECKS-16 with the exact failure case.
- **Risks:** `/api/me/profile` has the same URL for every account. The cache path has no account key. It can return an earlier account's reply without a server request. Ignoring the query can also discard `since` on a game read. These are source findings. The runtime result is **unverified**.
- **Owner taste call:** No for preventing private data reuse and stale API replies. New offline online-game behavior still needs approval.
- **Inventory gap:** CHECKS-16 says to keep private data out of the cache. It does not trace the existing handler or identify this required production fix.

### CRIT-07 — Local card links must carry the dealt hands

- **Kind:** (c). The plugin addresses a server game. It does not serialize a whole local game into a URL.
- **Evidence:** M `src/screen/links.ts:13–23,51–54`; `src/main.ts:45–57`; `src/screen/play.ts:711–733`. R `src/match/setup.ts:44–48,87–91` puts the deal into the setup. R `src/rules/setup.ts:115–133` writes spent-card state, marks, and last-card state, but not the dealt hands.
- **Web today:** A link carries an army or FEN, moves, kings, an optional preset, and a design. It carries no hands. Local saves already carry the complete rules object.
- **Change:** **M**, as an extension of SH-17. Define one bounded, validated local link contract for Classic and cards. Restore the hands and rule choices before replay. Preserve old links and the existing local save.
- **Dependencies:** SC-08, the local card controller, and SH-17. This work is separate from `/j/` and `/g/` server URLs.
- **Risks:** Spent bit positions need the same hand order at both ends. A receiver with empty or reordered hands cannot correctly replay a card turn. A FEN alone does not solve this. The exact failed replay is **unverified** because no test runs.
- **Owner taste call:** No for a correct link after local cards enter the approved scope. Yes if the owner instead chooses to retire local card links.
- **Inventory gap:** SH-17 explicitly handles Classic links. No lane adds the corresponding card-hand contract.

### CRIT-08 — Stored account notices have no player reader

- **Kind:** (c), for the full web safety flow. The plugin has no player notice view to lift.
- **Evidence:** R `src/online/safety.ts:100–103,119–120` inserts moderation and appeal notices into `public.notifications`. R `src/api/http.ts:89–90` returns notification preferences, not notice rows. R `src/online/client.ts:62–63` has the same preference-only contract. A source search finds production notice writes and reminder checks, but no player notice-list reader.
- **Web today:** It has no account notice inbox or moderation notice display.
- **Change:** **M** if the web safety scope uses these stored notices. Add an actor-scoped read and a player view, or approve another complete delivery path. Keep that path distinct from email preference controls.
- **Dependencies:** SRV-08, SRV-17, and the owner's support scope. CRIT-04 supplies the owner tool.
- **Risks:** A saved warning or appeal decision is not proof that the player receives it. Turning on turn mail does not supply this missing reader. Delivery through manual support is **unverified**.
- **Owner taste call:** Yes for the delivery channel and view. No for claiming that a database write alone is delivered notice.
- **Inventory gap:** SRV-08 and DEC-40 discuss support. SRV-12 discusses alerts. None identifies this missing end of the notice path.

### Kind (d): plugin-related work with no web runtime port

### CRIT-09 — The balance tool refuses the new Classic flag

- **Kind:** (d) for the web adaptation. This is an analysis-tool guard that accompanies the plugin's new rules.
- **Evidence:** R `src/balance/schema.ts:189–190`; `src/balance/schema.test.ts:56–59`. The axis permits only `classicChess: false`. The source explains that simulation replay cannot yet rebuild these chess moves from text alone.
- **Web today:** New game does not enable Classic. The browser game does not use this balance schema as its setup validator.
- **Change:** **S**, no web port. Keep the tool restriction. Do not copy it into the web setup and thereby disable a supported engine option.
- **Dependencies:** SH-11 only if a later task asks for Classic balance work.
- **Risks:** Engine support is not proof of support in every analysis tool. This survey authorizes no balance run or replay extension.
- **Owner taste call:** No. Any new analysis work needs its own scope and run permission.
- **Inventory gap:** The shared lane lists the engine and search changes, but not this separate tool limit.

### Kind (e)

No further no-gap feature needs a new item. The lanes already identify web sign-in, local saves, lessons, review, Workshop, and local two-player play.

## Checks of ten large or high-risk items

These ten checks prioritize state loss, private data, server access, engine state, and work across several flows. A dependency estimate does not add a second feature estimate.

### CRIT-10 — CLIENT-09 and SC-31: local and server state

- **Verdict:** Correct kind **(c)** and **L** scope. There is no plugin local-game shell to copy.
- **Evidence:** M `src/main.ts:66–92`; `src/screen/play.ts:739–777`. R `src/plugin/screens/board-model.ts:26–61` uses server views and draft steps.
- **Web today:** Cloud save can call `openSaved()` and replace the shown local game. Local play owns lessons, computer work, and undo.
- **Change:** Preserve the local controller. Add a distinct online controller and selected-game state. Gate account restore by the active state source.
- **Dependencies:** The HTTP route, session connection, queue, and draft work. CRIT-06 is also required before API use.
- **Risks:** A shared board element does not imply one shared game authority. Separate controllers must also set the correct global rules before their engine and render work.
- **Owner taste call:** Yes for the combined entry and local-record policy. No for preventing a cloud restore from replacing an online game.

### CRIT-11 — SC-29 and SRV-17: the public HTTP connection

- **Verdict:** Correct kind **(c)**. **L** is fair for the full feature connection; **M** is fair for dispatch alone.
- **Evidence:** R `tools/plugin-server.mjs:52–60`; `tools/plugin-server-build.mjs:61–75`; `src/api/http.ts:67–95`. R `tools/vercel-check.mjs:31–32,111–114` expressly requires the website API to be absent.
- **Web today:** It has sign-in and cloud save. It has no active game API caller or mounted game API.
- **Change:** Add both server dispatch and build routes. Update the output assertions when the approved web API opens. Connect the existing browser session.
- **Dependencies:** SRV-15, CLIENT-10, CLIENT-12, CLIENT-13, CRIT-06.
- **Risks:** The new route must preserve Host, origin, and token checks. Merely changing the client origin cannot supply the route. Live route state is **unverified**.
- **Owner taste call:** Yes for the online feature scope. No separate taste choice for the required route or session connection.

### CRIT-12 — SRV-20: web abuse controls

- **Verdict:** Correct kind **(c)** and **M** estimate. The bypass exists in source if this API opens unchanged.
- **Evidence:** R `src/api/http.ts:98–125` has one engine counter. It has no actor counter or `toolTry` call. R `src/plugin/http.ts:78–84` has total and per-user admission. R `src/plugin/service.ts:15–31` supplies durable attempts.
- **Web today:** It does not use the API. Its local game does not consume these service slots.
- **Change:** Reuse shared action attempts and one agreed worker budget across the adapters. Preserve the separate invite-code limit.
- **Dependencies:** SRV-14, SRV-15, SRV-17.
- **Risks:** The two adapters otherwise have independent counters. Per-instance limits do not bound all deployed instances. A list limit is not a creation limit.
- **Owner taste call:** No for closing the bypass. Yes for new numeric limits. Existing plugin numbers are a proposed starting point, not a measured web capacity claim.

### CRIT-13 — SRV-15: schema and server grants

- **Verdict:** Correct kind **(b)** and **M** release estimate. Do not reclassify it as an automatic live feature at merge.
- **Evidence:** R `plugin-deploy/runtime-role.sql:144–170`; `supabase/migrations/0008_accounts_safety.sql:44–67`; `tools/plugin-server.mjs:48–54`.
- **Web today:** It uses browser account access for its own cloud-save row. It does not use the game runtime connection.
- **Change:** Reuse the common schema and restricted role. Confirm installed migrations and grants in a later authorized release step.
- **Dependencies:** The release SQL order, account session trigger, and job setup.
- **Risks:** The server role can read across players, so server actor and seat checks remain required. Startup checks fail if the database is incomplete. Installation state is **unverified**.
- **Owner taste call:** No for preserving the access boundary. Database and release actions remain separate authorized work.

### CRIT-14 — SC-16: server board and whole-turn draft

- **Verdict:** Correct kind **(b)**. **M** covers the view port only. It does not cover the complete online product.
- **Evidence:** R `src/plugin/screens/board.ts:173–209,460–520`; `screens/board-model.ts:26–92`; `src/match/service.ts:95–114,294–349`; `src/match/protocol.ts:22–36`.
- **Web today:** Its local controller stages turns. It has no server receipt, server revision, or server draft storage.
- **Change:** Lift the draft and replay rules behind web callbacks. Keep one ID and the same input for Retry. Keep the complete-turn check at the server.
- **Dependencies:** CRIT-10 through CRIT-13, CLIENT-04 through CLIENT-07, and the web navigation work.
- **Risks:** A player turn has at most four actions. The server rejects a turn that leaves the mover still due to act. Do not send each staged action as a separate player command. The helpers also call `setRules`; they are not isolated from the web's global rules.
- **Owner taste call:** Yes for the new online board flow. No for correct revisions, legal draft restore, or one application of a command.

### CRIT-15 — SC-10: hidden setup and Ready

- **Verdict:** Kind **(b)** and the two-device **M** estimate are sound. Narrow the blanket three-day setup statement in DEC-08 and SRV-04.
- **Evidence:** R `src/match/service.ts:160–199,335–339,452–457`; `src/plugin/screens/seat-model.ts:12–34`; `screens/seat.ts:61–72,155–169`.
- **Web today:** It starts local armies without this hidden seat phase.
- **Change:** Port the seat view and Ready retry rule. Keep the same-device hidden handover under kind (c), as SC-31 already does.
- **Dependencies:** Setup options, fresh views, and the online route. A local two-player port needs a separate handover contract.
- **Risks:** The service hides the other choice until both seats are ready. The three-day deadline is set by `enterSetup()`. A new solo setup starts with `setup_deadline_at: null` and does not pass through that method. Also, the view can hold an invalid temporary order: validation disables Ready. Highlighted legal swaps are not the whole input contract.
- **Owner taste call:** Yes for local handover and its layout. No for preserving server secrecy. No new solo deadline follows from this code.

### CRIT-16 — SH-11: enable Classic on the web

- **Verdict:** Correct kind **(b)** and **M** estimate with SH-17. Shared engine availability alone is kind (a), not a completed web mode.
- **Evidence:** M `src/screen/play.ts:647–663`; `src/main.ts:45–57`. R `src/match/setup.ts:44–48,87–91`; `src/rules/engine.ts:1928–1932`; `docs/RULES.md:15–25`.
- **Web today:** The Chess army does not set the new flag. Existing links do not carry it.
- **Change:** Enable an explicit option before position creation. Keep old saves and links under their recorded rules. Update the Guide with the approved mode.
- **Dependencies:** SH-01, SH-02, SH-17. CRIT-07 extends the same link work for cards.
- **Risks:** The shared lane correctly identifies the en-passant repetition limit. The code keeps the square when an adjacent pawn exists, without testing a legal capture. Do not promise exact chess repetition equivalence. CRIT-09 also limits analysis-tool use.
- **Owner taste call:** Yes for the web mode and wording. Correct restore after that choice needs no separate taste decision.

### CRIT-17 — CHECKS-15: built web page with real website sessions

- **Verdict:** Correct kind **(c)**. **M** covers the check after the feature exists. **L** includes the feature itself.
- **Evidence:** R `src/api/http.db.test.ts:37–86`; `tools/vercel-check.mjs:31–32,111–114`; `.github/workflows/plugin-checks.yml:80,102–105`.
- **Web today:** Its account browser check uses controlled provider replies. It has no built online web page connected to this HTTP fixture.
- **Change:** Add the built-page layer to the existing local HTTP/database setup. Test website sessions through the web UI. Keep plugin development actors outside that trust-boundary test.
- **Dependencies:** CRIT-11 through CRIT-14 and CRIT-06. Do not charge the feature build again under a test ticket.
- **Risks:** A passing MCP test does not prove website token use, browser navigation, or the service worker. Current test results are **unverified**.
- **Owner taste call:** Yes for the approved feature and release gate scope. No for correct account isolation or duplicate-send checks.

### CRIT-18 — LOOK-34: web phone and zoom reflow

- **Verdict:** Correct kind **(c)** for the full local web path. **L** is a possible scope estimate, not evidence of L-sized faults.
- **Evidence:** M `src/ui/table.css:2–15,41–49,62–65,105–118`; `src/ui/menu.ts:18–35,58–68`. The source uses a top-level table and native dialogs. R plugin reflow targets its own page sections.
- **Web today:** It already has scrollable native sheets and local Home, lesson, and review controls. It has no plugin frame wrapper.
- **Change:** Define web acceptance states first. Port only the useful layout rules. Keep the existing native sheet and focus paths where they meet the requirement.
- **Dependencies:** The approved web phone sample, touch rules, and selected new screens.
- **Risks:** Source restrictions show what to inspect. They do not prove every web state fails at 200%. Copying the plugin selectors cannot prove a repair. Actual dimensions remain **unverified**.
- **Owner taste call:** Yes for a new board floor, scroll layout, and hidden art. A confirmed unreachable control has one right fix.

### CRIT-19 — DEC-35: clocks, guests, and connection policy

- **Verdict:** **Conditional kind (c)** only. The **L** estimate is reasonable if the owner requests it. The present adoption task does not make it required.
- **Evidence:** R `src/match/protocol.ts:37–47` refuses live human starts. R `docs/specs/chatgpt-mvp/spec.md:187–193` excludes clocks. R `docs/specs/accounts-multiplayer/spec.md:34–39` leaves guests and clocks to a later phase.
- **Web today:** It has local and link play. It has no complete live human service.
- **Change:** Keep this outside the plugin-to-web port total. Make a separate spec only if the owner selects live games or guests.
- **Dependencies:** The basic web online flow if that later feature proceeds.
- **Risks:** A pure deadline helper is not a live clock system. Calling this required adoption adds a large new product scope that the plugin does not supply.
- **Owner taste call:** Yes. This is a feature choice, not a fault or a missing port.

## Further corrections

### CRIT-20 — SC-32 has code to lift outside PR 61

- **Kind:** **(b)** for the existing branch code. The claim that all of this needs new implementation is wrong.
- **Evidence:** At `b3b52a47`, `src/plugin/screens/board.ts:239–256` directly arms usable coins. Lines 278–294 connect that action and card faces. Lines 366–374 add cost, targets, and effect text. At the same commit, `src/plugin/screens/collection.ts:39–41` adds `cardCost`. R `src/plugin/screens/collection.ts:39–41` lacks that cost.
- **Web today:** It has no normal four-card game UI. R also lacks these selected improvements.
- **Change:** **M**, selective port. Use DEC-11's separate-branch status. Lift the input, face, and Collection cost changes. Keep the newer release queue and recovery code.
- **Dependencies:** The card setup, online or local board connection, and a web sample.
- **Risks:** The older branch is not a safe replacement for the current board file. Source availability does not prove a current merged build or runtime pass.
- **Owner taste call:** The plugin intent has recorded approval. Web inclusion and its rendered sample still need approval.

### CRIT-21 — D2 does not prove one quick-start fix

- **Kind:** **(b)** for the reusable quick-start path. Mark the claimed spec fault **unverified**.
- **Evidence:** R `src/plugin/screens/setup-model.ts:27–30` always selects Beginner. R `docs/specs/taste-recommended/issues/06-base-final-review.md:9–17,30–35` explicitly requires that behavior. The saved decision record outside Git, `b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/decisions-full.md:296–301`, has two different statements: its summary says first Beginner, then the last level; its selected option says Beginner with saved custom options kept.
- **Web today:** It has a first Beginner deal and a separate saved new-game level.
- **Change:** **S** after the owner resolves the conflicting words. Do not apply DEC-12's proposed level change as an automatic fault repair.
- **Dependencies:** The chosen Play now entry.
- **Risks:** SC-06 reports the implemented rule as settled. DEC-12 treats the summary as decisive. Neither removes the conflict in the record.
- **Owner taste call:** Yes. Pick the explicit selected option and current build: Play now always uses Beginner; New game retains the saved level.

### CRIT-22 — SC-24 overstates missing picture API work

- **Kind:** **(b)** for the name/picture screen. The picture update method itself already exists in the release API.
- **Evidence:** R `src/api/http.ts:84`; `src/online/client.ts:58`; `src/online/accounts.ts:12–16,60–64`; `src/account/profile.ts:20–27`.
- **Web today:** It has no public preset-picture form. The unused release client already accepts `{ icon }` through `updateProfile`.
- **Change:** **M** for the form and return flow. Reuse the existing PATCH method for the icon. Add only the missing handle availability route.
- **Dependencies:** The API mount and existing web session.
- **Risks:** A new duplicate picture route adds unnecessary work. Handle and icon writes in the plugin wrapper are separate service calls, not one guaranteed atomic save.
- **Owner taste call:** Yes for the public identity form. No for wiring its approved icon choice to an existing route.

### CRIT-23 — DEC-19 understates symbols-only scope

- **Kind:** **(b)** remains correct. Use **M** for the full web feature, as SH-12 and LOOK-12 do.
- **Evidence:** R `src/plugin/board-view.ts:17–27` loads images and forces pace Off for symbols. R `src/render/PaintedView.ts:119–135` changes scene figures. M `src/screen/save.ts:7–16` requires new setting fields in both save lists.
- **Web today:** It has Piece letters, saved pace, and custom Workshop figures. These are distinct from the plugin's fixed symbol map.
- **Change:** Add the view method, decoded symbols, a design/token case, settings persistence, and a deliberate pace rule. A call to `setSymbols` alone is S.
- **Dependencies:** The settings storage decision and the web asset path.
- **Risks:** The plugin's fixed map does not prove support for a web design token. Copying its pace assignment overwrites the web preference while the setting is active.
- **Owner taste call:** Yes for the look and pace behavior. Keep the same sample scope across the lanes.

### CRIT-24 — DEC-37 is a future feature list

- **Kind:** **Conditional (c)** only. It is not a required gap in a port of built plugin work.
- **Evidence:** R `docs/specs/chatgpt-mvp/spec.md:193–194`; `src/plugin/screens/collection.ts:12–15`. The release keeps content unlocked and excludes leaderboards, seasons, and rating bands.
- **Web today:** It already offers its content without this new economy. No built plugin economy supplies a port.
- **Change:** **L** only if separately approved. Remove that estimate from the required adoption total. Keep the existing badge port as its own item.
- **Dependencies:** New owner scope, then the account/result service.
- **Risks:** Combining research options with built features makes the plan look larger and more complete than the evidence supports.
- **Owner taste call:** Yes for each addition. Pick no new unlock gate in this adaptation.

## Contradictions and differences between lanes

### CRIT-25 — Direct use and Collection costs: absent from R versus absent everywhere

SC-32 assigns kind (c) and says that no implementation is available. DEC-11 assigns kind (b) and points to a separate branch. Both describe R correctly, but their full-code availability claims conflict. CRIT-20 checks the branch and confirms direct arming, faces, and Collection cost code. **Resolution:** kind (b), outside PR 61, with a selective port. Keep a separate field for “included in PR 61.”

### CRIT-26 — Play now: fixed rule versus spec fault

SC-06 says the approved plugin rule is always Beginner. DEC-12 says the code loses the saved level and requires a fix. The chosen option, the decision summary, and the later build ticket do not agree. CRIT-21 gives the evidence. **Resolution:** keep the code as the current implemented contract. Ask one level question before a change. Do not label it a fault with one right fix.

### CRIT-27 — Picture updates: missing route versus existing route

SC-24 says the web service needs picture updates beyond set-handle. CLIENT-12 and SRV-07 say the icon route already exists. The API PATCH and client method confirm the latter. **Resolution:** keep the screen gap; remove duplicate picture-route work. Handle availability remains missing.

### CRIT-28 — Shared words and layout: repair approval versus new approval

SC-02 and DEC-01 treat Select and the shared reader changes as approved corrections. SH-04 asks again about the changed web instructions. Similar differences occur for the growing context row and coordinate hiding. The source behavior is not in dispute: these changes reach the web on merge. **Resolution:** carry the recorded word choice forward. Keep any new web layout tradeoff in the web sample. Do not count a shared export as an unused feature when the web already calls it. Do not use “repair” to approve a different threshold or layout.

### CRIT-29 — One small symbols port versus a complete web option

DEC-19 gives S. SH-12 and LOOK-12 give M and include settings, symbols, previews, and web-specific cases. CRIT-23 confirms the broader scope. **Resolution:** S names the drawing hook only. M names the complete option. These estimates must not appear as separate features in the final plan.

### CRIT-30 — Touch, tests, and other scope differences are not all factual conflicts

SH-16 gives S for pan policy and a drag guard. LOOK-15 gives M with a scroll wrapper and board floor. LOOK-36 calls harness repairs kind (d) as product work; CHECKS-10 calls reusable test methods kind (b). These labels use different deliverables. **Resolution:** split the deliverables before choosing a size or kind. Keep product ports, web-only layout work, and test reuse separate. Do not report these differences as false source claims.

### CRIT-31 — The lanes propose different products

SC's first owner question picks one hall for local and server games. CLIENT's first question keeps local play as the default. SRV's first question adds optional server computer games. LOOK's last questions defer live notes; SH's questions recommend adding them. These are recommendations, not contradictory code findings. **Resolution:** keep one owner scope block. No lane's pick authorizes another lane's UI or defaults. The same rule applies to common settings and local result totals.

## Open questions for the owner

1. **Which web scope enters the first spec?** Choose local features first, core human online play, or the full screen set. **Pick:** shared merge checks and local feature ports first, then core human online play. Keep local play and its save. Keep clocks, guests, and a new economy outside this port. A yes sets the spec order; it does not authorize a deploy.

2. **What does Play now do with the level?** Choose always Beginner, or Beginner first and then the saved level. **Pick:** always Beginner, as the selected D2 option and later build ticket state. New game keeps the saved level. A yes resolves CRIT-21; a different answer gets one explicit setup change.

3. **Does local card play retain whole-game links?** Choose to extend the link contract, or use server invitations for cards. **Pick:** extend the current local link with validated hand and mode data. Keep server game links distinct. A yes includes CRIT-07 with SH-17.

4. **How does a player receive an account action notice?** Choose an account notice view, or a complete support delivery procedure. **Pick:** an account notice view for the public web safety scope. Keep the existing operator command. A yes adds CRIT-08; it does not turn on mail.

5. **Do the separate-branch card improvements enter the web sample?** Choose the implemented direct-use branch parts, or the current release Use-sheet flow. **Pick:** the direct-use parts and Collection costs, with the newer recovery controller. A yes makes CRIT-20 a selective port and sample task.

The cache fault, account isolation, and duplicate-send guards are not owner taste questions. Fix those within the approved online scope. Keep live settings, current test results, and the final device experience marked **unverified** until later authorized checks supply evidence.
