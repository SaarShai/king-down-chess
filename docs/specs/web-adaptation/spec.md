# Web app adaptation spec

Status: ready-for-agent
Approval: approved by delegation (owner, 2026-10-18) on 2026-10-19, at `2837bcc6`, for phases 1 to 8; see [ticket 18](issues/18-approve-spec.md)
Build gate: [Approve the adaptation spec and build order](issues/18-approve-spec.md)

The spec approval is complete; each merge and each publish still needs the owner's word. Tickets 01 to 17 supply the answers below. Ticket 08 stays open only for step 4 and the served commit from the release owner's deploy record. The build follows [the web build tickets](../web-build/README.md). See [the map](map.md).

Code base: the PR 61 merge `cd8fa9f2` replaces `04b7af87` and `442c5eb3` as the adaptation base. The supplied live build stays `04b7af87` until the release owner's deploy. PR 62 is merged (`2837bcc6`). The deploy record closes [ticket 08](issues/08-release-evidence.md) (step 4). Build branches start from main and rebase onto main after that deploy. [The inventory](inventory.md) holds the 81 work units and source evidence; [the comparison](comparison.md) records the two planning inputs. Older source IDs there describe those reads.

## Problem Statement

The website and the ChatGPT app use the same game, but they offer different ways to play. The website has local play, lessons, the Workshop, sign-in and a cloud save. It does not expose the account game flow: setup, friend games, open games, the account board, results, profile and Collection.

The merged plugin code supplies much of this work. A code merge does not connect it to the website. The account screens need a shared client boundary. The server does not serve the web API. The current worker can cache private GET replies if the API opens unchanged. [Ticket 01](issues/01-baseline.md) and [ticket 06](issues/06-hosting-routes.md) record these gaps.

The local app also has offline play, two players on one device, local game links, lessons, Today's army, custom positions, review and the Workshop. Account play must keep these paths and their saves usable. [Ticket 09](issues/09-web-play.md) fixes that boundary.

## Solution

Add a separate account page through the same services and account UI as the plugin. Keep the local app at the root, with one controller per page and links in both directions. Use the existing website sign-in, account IDs, game pool, engine, renderer and rule text. [Tickets 02](issues/02-shared-client.md), [09](issues/09-web-play.md) and [10](issues/10-account-entry.md) hold these decisions.

Account play adds the computer, friends, random opponents, setup, board, results, profile, Collection and settings. New setup, cards, Classic, the hidden arrangement and server computer games need sign-in in this release; current local play needs no account. [Ticket 09](issues/09-web-play.md) holds the accepted scope.

Use browser history and the real account screens with a page host and a game client. The accepted route prototype and rendered sample define browser behavior and fit. [Tickets 13](issues/13-routes.md) and [14](issues/14-visual-sample.md) hold those choices.

## User Stories

### Current web play

1. As a guest, I want to play on this device without an account, so that I can start at once.
2. As a guest, I want to play the computer offline after the current local app has loaded, so that I can continue without a connection.
3. As a local player, I want to keep my saved game when I open account play, so that I can return to it.
4. As a local player, I want to keep two-player play on one device, so that I can play beside a friend.
5. As a local player, I want to keep lessons and the return to my game, so that I can learn without losing the game.
6. As a local player, I want to keep the Workshop and my designs, so that I can use the current design tools.
7. As a local player, I want to keep local game links, custom positions, review, and Today’s army, so that my current ways to play still work.
8. As a player, I want to see the difference between Today’s army and a game with a daily move limit, so that I know which game I start.
9. As a returning player, I want to keep the rules of an old saved game, so that an update does not change that game.

### Account entry and navigation

10. As a player, I want to use the existing website sign-in, so that I do not create another game account.
11. As a player, I want to use the same account record in the web app and ChatGPT, so that my games and results stay together.
12. As a player, I want to return to my game or join preview after sign-in, so that I do not repeat the flow.
13. As a player, I want to cancel sign-in and return to local play, so that I still have a complete way to play.
14. As a player, I want to see a clear session-expired state and sign in again, so that I can recover without sending a turn twice.
15. As a player, I want to sign out without deleting my local game, so that I can use a shared device safely.
16. As a player, I want to change accounts without seeing the prior account’s game data, so that each account stays separate.
17. As a player, I want to open an account game by its own link, so that I can resume it directly.
18. As a player, I want to use Back, Forward, and Reload, so that the app works like a normal website.
19. As a player, I want to leave the board without aborting its game, so that I can read my profile and return.
20. As a player, I want to get a clear exit for a missing game or a seat I do not own, so that I do not get stuck.

### New game and setup

21. As a player, I want to see my active games and which need my move, so that I can choose the next game.
22. As a player, I want to resume a ready human game before a computer game, so that I can answer another player first.
23. As a player, I want to start a quick Beginner game without changing my saved setup, so that I can play with few steps.
24. As a initiator, I want to choose the computer, a friend, or a random player, so that I can choose an opponent type.
25. As a initiator, I want to choose Beginner, Casual, Club, or Strong for a computer game, so that I can choose its level.
26. As a initiator, I want to choose White, Black, or Random, so that I can choose my side.
27. As a initiator, I want to set Fairy pieces, Arrangement, Classic chess, Cards, and King powers, so that I can choose the supported game.
28. As a initiator, I want to select a valid piece pool, so that the drawn army uses the pieces I choose.
29. As a initiator, I want to see why a piece choice cannot turn off, so that I can keep a valid pool.
30. As a initiator, I want to choose Classic chess explicitly, so that I can play with castling and en passant.
31. As a initiator, I want to choose Pick four or a valid card pool, so that both sides get the intended four cards.
32. As a initiator, I want to see the card names, rules, costs, and available art, so that I can understand the deal.
33. As a player, I want to select my king and a valid power, so that the choice belongs to me.
34. As a player, I want to see only legal card and power combinations, so that I do not start an invalid game.
35. As a player, I want to keep my last valid setup, so that I can use it again.
36. As a player, I want to arrange the drawn pieces and use Shuffle, so that I can choose a legal starting order.
37. As a player, I want to keep my arrangement hidden until both sides are ready, so that neither side can react to the other’s hidden order.
38. As a player, I want to see my Ready state and the setup time limit, so that I know what must happen next.

### Friends and open games

39. As a initiator, I want to share a full invite with its code, link, rules, and expiry, so that my friend can open the right game.
40. As a initiator, I want to copy the same invite or select its text if copy fails, so that I can still send it.
41. As a initiator, I want to cancel the native share sheet without a clipboard change, so that Cancel has no extra effect.
42. As a joiner, I want to preview the rules and open side before I join, so that I can accept or decline with enough information.
43. As a joiner, I want to use a code or web invite link, so that I can enter from either source.
44. As a joiner, I want to receive a clear refusal for an expired or taken invite, so that I can choose another game.
45. As a player, I want to play a friend whose other seat uses ChatGPT, so that both surfaces use the same game.
46. As a player, I want to see open games with their rules, so that I can choose an offered game.
47. As a player, I want to find the oldest game with matching feature switches, so that I can find a suitable opponent.
48. As a player, I want to choose Any rules explicitly, so that I can accept a wider choice without an unexpected default.
49. As a player, I want to cancel my open game, so that I can stop looking.
50. As a waiting player, I want to play the computer after the waiting offer appears, so that I have something to do while my human game stays open.
51. As a waiting player, I want to choose whether to switch when an opponent arrives, so that the app does not replace my board without my choice.
52. As a waiting player, I want to find the open game after I return, so that closing a page does not silently cancel it.

### Board and recovery

53. As a player, I want to see the painted board and shared move legend, so that the game looks and reads the same on each surface.
54. As a player, I want to stage my complete turn before I send it, so that I can inspect the result first.
55. As a player, I want to undo an unsent step, so that I can correct a local choice.
56. As a player, I want to send one complete turn with one press, so that the server applies it all or nothing.
57. As a player, I want to keep piece information available while a send waits, so that I can still read the board.
58. As a player, I want to see a preview before a shove or swap onto my own piece, so that I know what the action does.
59. As a player, I want to select card or power targets with clear rule and cost text, so that I can use the effect correctly.
60. As a player, I want to read both hands and spent cards, so that I know what each side can still use.
61. As a player, I want to use a mouse, touch, or keyboard on the board, so that I can play with my input device.
62. As a player, I want to read named legal moves when a board target is ambiguous, so that I can select the intended action.
63. As a player, I want to see new opponent moves without reloading, so that I can continue the game.
64. As a player, I want to return from a hidden tab or sleep to a fresh view, so that I do not act on an old board.
65. As a player, I want to retry a failed send with the same command, so that a lost reply does not create another move or game.
66. As a player, I want to reload the same tab and recover a valid draft, so that I do not repeat unsent steps.
67. As a player, I want to receive a clear notice if a draft no longer matches the game, so that I can make a new choice safely.
68. As a player, I want to keep the screen I select when an old reply arrives, so that a slow call does not move me to another game.
69. As a player, I want to see a precise offline or stale-view state, so that I know when account moves cannot be sent.

### Game end and account record

70. As a player, I want to resign or offer, accept, or decline a draw with confirmation, so that I control how a game ends.
71. As a player, I want to abort before each side completes its first turn, so that an unwanted start has no result.
72. As a player, I want to see the server-based deadline and the allowed claim action, so that I know what to do when an opponent is late.
73. As a player, I want to see a plain game-end reason, so that I understand the result.
74. As a player, I want to skip the win motion or see the final board, so that I can inspect the result at once.
75. As a player, I want to offer a human rematch with colours swapped, so that we can play each side.
76. As a player, I want to play the computer again with the same rules and colour, so that I can repeat my practice.
77. As a player, I want to see totals, rating, and active and finished games, so that I can read my record.
78. As a new player, I want to see a provisional rating label, so that I do not mistake an early estimate for a settled rating.
79. As a player, I want to see earned badges, their goals, and dates, so that I can track my progress.
80. As a player, I want to read every piece, king, power, and card in Collection, so that I can learn all supported content.
81. As a player, I want to use all supported content without an unlock gate, so that the adaptation keeps the approved MVP scope.

### Identity, safety, and settings

82. As a player, I want to pick a unique handle and preset picture before a human game, so that other players see my game identity.
83. As a player, I want to see handle errors and availability without losing my setup, so that I can finish the start flow.
84. As a player, I want to choose Symbols only and Show threats, so that I can read the board in my preferred way.
85. As a player, I want to control sound and reduced motion, so that the game suits my device and needs.
86. As a player, I want to choose who can see my online status, so that I control that part of my visibility.
87. As a player, I want to block an opponent and later unblock them, so that I can control future matching.
88. As a player, I want to reach the accepted report or support path, so that I can raise a problem.
89. As a player, I want to request account deletion and understand the seven-day grace, so that I know what happens to my account.
90. As a player, I want to keep private account responses out of offline caches, so that another account on the device does not receive them.

### Devices and release quality

91. As a phone player, I want to scroll from the board without losing square taps or piece drags, so that I can reach the controls on a short screen.
92. As a phone player, I want to reach every card, turn action, and end action at large zoom, so that I can finish the game.
93. As a keyboard player, I want to keep visible focus and return from each sheet, so that I can complete every flow without a pointer.
94. As a screen-reader user, I want to hear useful names for pieces, moves, features, and results, so that I can understand each action and state.
95. As a returning player, I want to receive a safe update of the offline worker, so that an old cache does not break account play.
96. As a owner, I want to verify the web and plugin against the same service, so that a shared change does not break either surface.
97. As a owner, I want to publish small complete slices with a recovery path, so that I can review the exact change before it goes online.
98. As a owner, I want direct web calls to meet the same per-account limits as the plugin, so that the website is not a way around them.
99. As a owner, I want to see each visible change that the plugin merge brings to the live web app, so that I approve it before a deploy.
100. As a signed-out visitor, I want to see what an account adds and how to get it, so that I know where cards, Classic and friend games are.
101. As a player, I want to read a moderation notice about my account, so that I know what happened and how to appeal.
102. As a player, I want my open human game to stay open when I leave the page, so that only my own Cancel stops it.
103. As a player who uses the web account page and the plugin, I want the same account board settings, so that symbols and threats do not change between them.

## Implementation Decisions

These lines state the resolved choices. The linked answers hold the detail. No new choice follows from this refresh.

### Product boundary

- Keep local play and its save contract on the root page; put account play in a separate page lifetime. [Ticket 09](issues/09-web-play.md).
- Share the account state and screens through two small boundaries, game client and page host; remove each old definition when it moves. [Ticket 02](issues/02-shared-client.md).
- Keep local tools, local No power and old saved rules; new account Classic uses its explicit rule flag. [Tickets 09](issues/09-web-play.md) and [12](issues/12-scope-picks.md).

### Common UI and host boundary

- The common client owns account state, notices, locks, queue, accepted views, drafts and rendering; transport and host duties stay in the two adapters. [Ticket 02](issues/02-shared-client.md).
- PR 61 is merged and the five later branches are parked; shared moves still wait for the plugin session's handover of `src/plugin/`, with one writer and plugin checks for each move. [Tickets 08](issues/08-release-evidence.md) and [17](issues/17-release-route.md).
- Keep plugin board pointers, widget state, resource URIs and host messages in the plugin adapter; use a top-level page in the browser. [Ticket 02](issues/02-shared-client.md).
- Reuse the shared art and symbol transform, with root asset paths in the combined build and no server code in the browser bundle. [Ticket 06](issues/06-hosting-routes.md) and [release route](release-route.md).

### API and identity

- Mount the existing API before MCP in the same function, initially closed to service work; open only the operations of each complete slice. [Tickets 06](issues/06-hosting-routes.md) and [17](issues/17-release-route.md).
- Extend the existing HTTP contract and shared account queries; keep the same store, services, validation and seat privacy, without MCP calls from the API. [Ticket 03](issues/03-http-contract.md).
- Reuse the website session and service user ID; keep MCP and website tokens distinct and never merge users by email. The actor comes only from the verified session, never from an account or seat ID in the request data. [Tickets 05](issues/05-one-account.md) and [10](issues/10-account-entry.md).
- Use only `/play/` as the sign-in callback, with the checked, single-use per-tab flow record and Retry for missing, stale or crossed flows. [Tickets 10](issues/10-account-entry.md) and [13](issues/13-routes.md).
- Bind jobs, commands and retries to their starting user ID; clear private state and reject late replies after an account change. [Ticket 10](issues/10-account-entry.md).
- Follow the accepted API write order, current-user checks and shared admission/counter budgets from the first served write; reads accept valid tokens until expiry. [Tickets 10](issues/10-account-entry.md) and [15](issues/15-public-safety.md).
- Make game GET read-only before the first account publish; seat activity is a separate protected write. [Tickets 03](issues/03-http-contract.md) and [17](issues/17-release-route.md).
- Enforce pending deletion and suspension at shared game admission, rematches included, with the accepted refusal and Support paths. [Ticket 10](issues/10-account-entry.md).

### State, commands and recovery

- Keep server View, unsent draft, pending receipt and route separate; use the shared queue, epoch and accepted-view rules. [Tickets 02](issues/02-shared-client.md) and [11](issues/11-save-ownership.md).
- Save stable start/turn IDs and unchanged input before send; retries keep them, and invite renewal is an explicit action. [Tickets 03](issues/03-http-contract.md) and [11](issues/11-save-ownership.md).
- Restore a draft only after a fresh account and game read. Validate each move against the shared engine and the server's first-step legal list; the server validates the whole submitted turn again. [Ticket 11](issues/11-save-ownership.md).
- Store per-tab drafts by user, full game ID, turn base and engine stamp; reconcile copied receipts after a fresh read and keep unknown receipts even when drafting is unsupported. [Ticket 11](issues/11-save-ownership.md).
- Cancel obsolete reads; a stale reply can finish only its own receipt and cannot repaint another game or route. Preserve the server error codes: a refusal, a failed read and an unknown write outcome need different recovery; a poll does not erase a command refusal; a failed game does not block an unrelated start. [Ticket 02](issues/02-shared-client.md).
- State the storage-failure and tab-close limits; sign-out and account changes clear private state while the local save stays intact. [Ticket 11](issues/11-save-ownership.md).
- Replace the unused old watcher with the shared poll, including equal-revision display data, hidden-page stops and one fresh read on return. [Tickets 02](issues/02-shared-client.md) and [03](issues/03-http-contract.md).

### Game setup and play

- Reuse the common setup builder and the five switches with their constraints: Classic needs Fairy pieces off; the arrangement applies to Fairy pieces; cards permit only powers that are always on; Pick four deals those four, and Use all deals four from a valid pool. The human initiator chooses the colour; a joiner controls only its seat choices. Keep the seat validation (order, bishop colours, guard position), the hidden Ready flow, the three-day setup deadline and the existing no-result expiry. [Tickets 03](issues/03-http-contract.md) and [12](issues/12-scope-picks.md).
- Play now always uses Beginner and keeps saved setup unchanged; New game keeps the saved level and the current defaults. [Ticket 12](issues/12-scope-picks.md).
- Share the seat-view board, staged whole turns, local Undo, own-piece preview, target-first words, piece reads and result handling. [Tickets 02](issues/02-shared-client.md), [03](issues/03-http-contract.md) and [14](issues/14-visual-sample.md).
- The account board uses the server's seat view: a browser cannot choose another side's legal moves, alter a hidden setup, write a score or set a deadline. One send carries the complete turn, with an explicit pass when needed; end detection comes from the engine, not from a fixed number of actions. [Ticket 03](issues/03-http-contract.md).
- Keep the merged card/power read sheet and Use flow, card-back art fallback and game fonts; the parked direct-use, face and cost features stay later work. [Tickets 12](issues/12-scope-picks.md), [14](issues/14-visual-sample.md) and [shared screens later](../shared-screens-later/README.md).
- Account computer play uses the server and its existing levels; offline play keeps its local engine. [Tickets 07](issues/07-engine-compatibility.md) and [09](issues/09-web-play.md).
- Stamp every View and gate local draft/history by proved engine support, with each alias treated as its base; every active engine needs a tested continuation, and server outcomes stay final. [Ticket 07](issues/07-engine-compatibility.md).

### Friends and matching

- Share full invites with Share, Copy and manual selection; a cancelled share leaves the clipboard unchanged. [Tickets 12](issues/12-scope-picks.md) and [13](issues/13-routes.md).
- An invite URL only previews; Join is explicit, and a creator reload offers Make a new invite instead of rotating a code on read. [Tickets 03](issues/03-http-contract.md) and [13](issues/13-routes.md).
- Keep the existing exact-switch/Any rules matching, the 24-hour open-game period, the seven-day friend invite period, both-way blocks, deadlines and explicit cancellation. [Tickets 03](issues/03-http-contract.md), [12](issues/12-scope-picks.md) and [15](issues/15-public-safety.md).
- Keep waiting human and temporary computer games separate; only Switch now changes the shown game, and Back or close cancels neither. [Tickets 11](issues/11-save-ownership.md) and [13](issues/13-routes.md), with the phase 6 checks in [the test gate](test-gate.md).

### Account record, settings and safety

- Profile totals and badges count server games only; keep the built human-rating rule and all content unlocked. [Tickets 11](issues/11-save-ownership.md) and [12](issues/12-scope-picks.md).
- Keep account settings in their existing services, local settings separate and sound on the device; public identity uses handles and preset pictures. [Tickets 10](issues/10-account-entry.md) and [11](issues/11-save-ownership.md).
- Carry Block, Unblock, visibility and the deletion grace, with no new in-app Report, email, push or chat. [Tickets 10](issues/10-account-entry.md) and [15](issues/15-public-safety.md).
- Before public matching, complete support intake, shared actor-scoped notices on both transports and appeal steps, with the owner as handler and the 7-day first-response target. [Ticket 15](issues/15-public-safety.md).
- Keep only the accepted tick, daily and cron-history schedules; record HTTP job outcomes separately from the SQL cleanup result. [Release route](release-route.md).

### Visible shared changes on merge

- Carry the reviewed Select words, first-frame board fix and public text; the coordinate limit, idle stop and context-row growth are already live at the supplied base, and disabled-coin faces have no local trigger. [Ticket 08](issues/08-release-evidence.md).
- Keep the balance tool's Classic refusal as a tool limit. [Ticket 12](issues/12-scope-picks.md).

### Browser cache, routes and layout

- Use a public-build-file worker allowlist; private calls wait for the controlling worker's policy reply after a successful, repeatable purge, including restart and failure cases. [Ticket 06](issues/06-hosting-routes.md) and [release route](release-route.md).
- Serve the account shell at `/play/`, the accepted account subroutes, `/g/<id>` and `/j`, with no-store/no-referrer; use `/j#<token>` or `/j#<CODE>`, refuse the path-token form and keep unrelated paths at 404. [Ticket 13](issues/13-routes.md).
- A URL only reads; Join, sign-in return and canonical fixes replace history as specified, with token and sign-in-code redaction. [Ticket 13](issues/13-routes.md).
- Use the sample's sheets, columns, browser safe areas, page scroll, full target words and 48 px DOM controls, with its accepted board-square exception. [Ticket 14](issues/14-visual-sample.md).
- Preserve WebKit scroll by avoiding needless DOM moves. Keep board pan and piece drag distinct, and verify the actual hit target after scroll, zoom and orientation change. [The test gate](test-gate.md).
- Use Play online on the local home and Play on this device in signed-in account play; keep the signed-out local exit. [Ticket 14](issues/14-visual-sample.md).
- Carry the measured spent-coin and focus fixes in shared CSS; keep the sample's narrow player strips, coin-scroll cue, input and reduced-motion behavior. [Ticket 14](issues/14-visual-sample.md).

### Release and recovery

- Use `codex/web-*` branches and the one deploy path: worker publish, closed dispatch with no publish of its own, account reads after handover, then complete game slices. [Ticket 17](issues/17-release-route.md).
- Before the first account publish, prove the server account-off switch closes API operations and page private calls without a code change, with local play usable. [Ticket 17](issues/17-release-route.md).
- Each publish needs a packet, an independent reader, the owner's merge word and a separate publish go; recovery keeps current data, add-only migrations, engine archives/aliases and the safe worker. [Release route](release-route.md).
- Require fresh engine reports against exact release and recovery files, save/column agreement and each used stamp's continuation; a skipped query stops publish, and no `tsx` path writes to the live database. [Tickets 07](issues/07-engine-compatibility.md) and [17](issues/17-release-route.md).

## Testing Decisions

[The test gate](test-gate.md), accepted in [ticket 16](issues/16-test-gate.md), holds the checks, commands, phase rows, device matrix and stop rules. These are build requirements, not results of this refresh.

### What a good test proves

Check behavior at the highest useful boundary: a stored effect, returned seat view, visible state, focus or actual hit point. A screenshot or a CSS value alone does not prove input. [Tickets 04](issues/04-test-reuse.md) and [16](issues/16-test-gate.md).

### Seams

| Seam | Decision |
|---|---|
| T1: HTTP with real services and disposable PostgreSQL | Main correctness seam; add HTTP/MCP scenarios on the same stored game. |
| T2: pure client and game logic | Keep tests with moved modules; add only new route, storage and account-change cases. |
| T3: built top-level page | Add one registered `web-online` driver, with real HTTP/database journeys and reused fault/input assertions. |
| T4: current local app | Keep affected named checks; run the full default set at the base and final release. |
| T5: built output and worker | Extend probes in place for closed/enabled API, deep routes, public assets, safe upgrade and recovery. |

[The test gate](test-gate.md) defines each seam and its present gaps; existing plugin checks alone do not prove the web page.

### Required correctness cases

Use the phase rows in [the test gate](test-gate.md) for identity, seat privacy, stored effects, retries, shared budgets, drafts, equal revisions, copied tabs, cross-surface play and engine continuation. Each feature carries its own failure and input cases.

Phase 2 includes crossed/stale callbacks, local-save isolation and log/Referer redaction; phase 5 extends redaction to invites; phase 3 proves the same create budget across MCP and API. [Ticket 16](issues/16-test-gate.md).

### Browser and device acceptance

Use the complete person/device matrix in [the test gate](test-gate.md), including Chromium, Firefox, WebKit, the sample sizes and hit/contrast values, native input, real zoom/text and screen readers. Real Android has no named person/device yet and blocks the complete release. Simulator and real-phone results stay distinct.

The speed numbers stay proposed until the main session accepts the recorded main/plugin baselines and fixes the budget. Stable render comparisons need two main captures in the same environment. [Ticket 16](issues/16-test-gate.md).

### Commands and evidence

Put the web gate in `plugin-checks.yml` only; keep its database jobs, add the database-backed Firefox path and `web-online` on all three engines, and fail required jobs before launch if the test database is absent. [Ticket 16](issues/16-test-gate.md).

Use only the commands and machine placement in [the test gate](test-gate.md). Keep `plugin-ui` and `plugin-ui-http` for shared changes. Record exact source, exits, counts, skips, devices and limits per slice. No code test, browser check or live action runs for this refresh; its doc-check result belongs in the preparation report.

## Phased Build Order

[The release route](release-route.md) holds slice exposure and release detail. [The build tickets](../web-build/README.md) split these phases into work for one fresh session each. [Ticket 18](issues/18-approve-spec.md) approves the spec; each merge and each publish still needs the owner's word. Each feature includes its input and recovery checks when it arrives.

| Phase | Small slices and result | Exit checks | Depends on |
|---|---|---|---|
| 1. Accept the common base | Prepare the web driver and the worker code on codex/web-* branches from main. Carry the reviewed baseline and keep account routes closed. | Phase 1 of [the test gate](test-gate.md): T1–T5 as applicable, full local set, stable comparison, old-worker/offline cases and required engine evidence; worker publish also enforces the engine-query stop. | Ticket 18 approval. The worker publish also needs the ticket 08 deploy record. |
| 2. Open a safe account page | Add the closed API dispatch with no publish of its own; make game GET read-only and add the account-off switch; after handover, share the host/client seam, prove stored-engine continuation on both surfaces, and ship only protected identity/reads with complete route exits. | Phase 2 of [the test gate](test-gate.md): sign-in/history, redaction, local-save and account isolation, T1/T5 GET/switch proof, engine continuation evidence, sample fit and shared plugin checks. | Phase 1; plugin handover of `src/plugin/`; accepted route and visual samples. |
| 3. Finish one account computer game | Share board, queue, stamped drafts, poll and results; Create, stage, Undo, send, recover a lost reply, finish and play again with current-user checks and shared budgets. | Phase 3 of [the test gate](test-gate.md): saved whole turn/result once, one cross-surface budget, storage/account-change cases and affected input checks. | Phase 2; proved engine support. |
| 4. Add the full setup | Three complete slices: Classic/piece pool; cards/legal powers; hidden arrangement/Ready, using the shared builder and existing defaults. | Phase 4 of [the test gate](test-gate.md): 16 mixes, hidden views, each option through a turn, saved-rule/engine evidence and phone/zoom input. | Phase 3. |
| 5. Finish a friend game across surfaces | Ship fragment invites, Share/Copy, explicit Join, identity, Block, deadlines, end actions and rematch through one browser/plugin game. | Phase 5 of [the test gate](test-gate.md): seat race, retry/result once, fragment/path refusal, redaction and native sharing. | Phase 4; shared identity and safety checks. |
| 6. Add open matching and the wait flow | Complete support intake and shared notices before public matching; then lobby/Find/Accept/Cancel and the explicit temporary-computer handoff. | Phase 6 of [the test gate](test-gate.md): support-to-appeal path, blocks/budgets, seat races, lost Find, delayed replies and both handoff choices. | Phase 5; public-safety and operator gates. |
| 7. Complete profile and Collection | Small slices for record/history/badges, all Collection tabs, and paged blocks/identity/settings, through the same services and art. | Phase 7 of [the test gate](test-gate.md): paging, private data, empty/long states, keyboard, zoom and screen readers. | Phase 5; may precede phase 6, with matching added to integrated checks later. |
| 8. Verify and publish the complete adaptation | Complete the integrated, device, speed, public-help, engine and compatible-recovery records; publish only the exact approved scope. | Phase 8 of [the test gate](test-gate.md) and every applicable stop/packet row in [the release route](release-route.md), including live probes and job outcomes after an authorized publish. | Phases 1–7; reviewed packet; owner's merge word and separate publish go. |

Only one writer changes the shared client at a time. Each merge needs an independent reader and the owner's word. Each publish needs its own packet and go. [Ticket 17](issues/17-release-route.md).

### Inventory coverage

| Work | Phases |
|---|---|
| A01–A17: common code and records | 1, then the consumer phase |
| B24–B26: state, queue, and polling | 2–3 |
| B01–B06, B11–B16, B21–B22: hall, setup, board, identity, settings | 2–4 |
| B07–B08, B16–B17, B23: friends, actions, result, block | 5 |
| B09–B10: open matching and waiting | 6 |
| B18–B20: profile, badges, Collection | 7 |
| B27–B30: look, phone fit, touch, accessibility | Each screen’s phase, then 8 |
| B31–B34: QA tools, device tools, docs, dormant service scope | Each applicable phase, then 8; alerts remain off |
| C01–C19: web boundaries | 1–8, as assigned in the inventory and tickets |
| D01–D11: host-only and tool-only work | Keep on the plugin path; retain regression coverage |

## Out of Scope

- New rules, pieces, cards, powers, balance runs or computer levels.
- A new engine, backend, account database, UI framework or plugin host simulation.
- Replacement of local play, conversion of old saves, local ports of new setup/cards/Classic, or online Workshop designs.
- New public replay, hints, undo after commit, clocks, turn-length options, guests, chat, email/push, friends directory, leaderboards, seasons or unlock gates.
- The five parked branches and their features in [shared screens later](../shared-screens-later/README.md); no direct card arming, new face/cost display, hall presets or new taste work enters this build from them.
- New art, fonts or themes, other platform plugins, submission work, reviewer-only onboarding, DNS changes or a legal compliance judgment.
- A code build, code test, browser session, sign-in, live query, database write, merge or deploy in this planning task.

These limits follow [the map](map.md), [ticket 09](issues/09-web-play.md), [ticket 12](issues/12-scope-picks.md) and [ticket 15](issues/15-public-safety.md).

## Further Notes

The plan keeps the working local app, shares the account UI and extends the existing handler, renderer, rules and service transactions. [The inventory](inventory.md) covers 81 work units; it is not an effort estimate.

Tickets 01 to 18 hold the resolved answers; ticket 08 waits only for step 4 and the served commit. [Ticket 18](issues/18-approve-spec.md) records the approval.

The PR 61 merge carries the outbox-text repair. Phase 1 removes the unsafe worker cache path; phase 3 removes the unused watcher when the shared poll takes over. [The comparison](comparison.md) records the source faults.

The final deploy record, shared-file handover, exact recovery build, real Android tester/device and accepted speed budget remain explicit gates in [ticket 08](issues/08-release-evidence.md), [the test gate](test-gate.md) and [the release route](release-route.md). Earlier results and prototype samples do not close product release checks.
