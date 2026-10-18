# Web app adaptation spec

Status: ready-for-agent
Approval: pending; the owner delegated it to the agent on 2026-10-18, after the open tickets and the browser sample
Build gate: [Approve the adaptation spec and build order](issues/18-approve-spec.md)

This status makes the plan ready for decision work. It is not approval to build. Tickets 09, 10, 11, 12 and 15 are decided by delegation (owner, 2026-10-18), each after three independent reviews; this spec includes their answers. The other picks stay recommendations until their tickets resolve.

Source date: 2026-10-18. Main is `origin/main` at `04b7af87`; the plan's first reads used the stale local ref `38a6bbff` (see the base correction in the inventory). The release candidate is `442c5eb3` (PR 61, open). The final PR merge and its checks replace this provisional base before the build. [The inventory](inventory.md) holds paths and evidence. [The map](map.md) holds the decision index. [The comparison](comparison.md) records what this spec adopted, rejected and merged from two independent plans.

## Problem Statement

The website and the ChatGPT app use the same game, but they offer different ways to play. The website has local play, lessons, the Workshop, sign-in, and a cloud save. It does not expose the newer account game flow. A player cannot use its new setup, friend games, open games, account board, record, or Collection through the normal website.

The plugin build supplies much of this work. It also supplies stronger state recovery, phone fit, input checks, and release tools. A merge alone does not connect these parts to the website. Several screens depend on plugin app state. Several server methods have no web route. The deploy does not serve the API. The current offline worker can cache private GET responses if those routes open unchanged.

A direct replacement also risks the working web product. The plugin does not replace offline play, two players on one device, local game links, lessons, Today’s army, custom positions, review, or the Workshop. The plan must retain these features and their saves.

## Solution

Add account play to the website through the same game service and the same account-play UI as the plugin. Keep the local web app complete. Use the existing website sign-in, account IDs, game pool, database, engine, painted renderer, and rule text.

The proposed web entry has two clear destinations. Local play stays at the current root. Account play opens its own page. Both have a link to the other. Account play includes the computer, friends, random opponents, setup, the board, results, profile, Collection, and settings. Its pages support normal browser links, Back, Forward, and reload.

Share the account screens and state. Keep transport, sign-in, browser navigation, and host dimensions at small explicit boundaries. Carry the actual owner picks and tested fixes. Do not make a new theme or a third version of the game.

The result is one service and one account game UI for two surfaces. The local app remains a separate, useful play context. An account is not required for current local play.

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
101. As a player, I want to read a moderation notice about my account, so that I know what happened and how to appeal (if the owner picks an in-app notice view).
102. As a player, I want my open human game to stay open when I leave the page, so that only my own Cancel stops it.
103. As a player who uses both surfaces, I want the same board settings where the meaning is the same, so that symbols and threats do not change between them (once the owner picks a shared value).

## Implementation Decisions

These are proposed implementation decisions. The open tickets record the owner choices and unresolved evidence. File paths stay in the inventory and tickets so this section describes durable boundaries.

### Product boundary

- Keep the current local app and its save contract. Add a separate account-play page. A full page change stops one controller before another starts. Do not run two owners of the engine’s global rules in one page.
- Use the same account-play screens in the browser and plugin. Move code as a slice needs it. Remove the old definition after the move. Do not leave two copies of the state machine, board, or setup rules.
- Keep the local app’s special tools on its existing path. Do not make Workshop designs legal in account matches. Do not turn old local games into rated games.
- The local Chess army remains an army choice under the saved rules. New account Classic chess explicitly enables its rule flag. Never infer the flag from the army alone.
- Under the recommended web play boundary, the five-switch setup, cards, Classic, the hidden arrangement and server computer games need sign-in in the first release. Local play does not change. A later local game-client adapter for the shared UI is fog on the map, not part of this build.

### Common UI and host boundary

- The common client owns screen state, notice state, scoped locks, one write queue, accepted views, turn drafts, and screen rendering.
- The game-client boundary returns typed views, lists, records, and settings. The browser uses HTTP JSON. The plugin maps MCP results to the same values. Keep tool envelopes and chat-visible metadata in the plugin adapter.
- The shared-seam moves start after the PR 61 merge and after the approved later-update branches land or are parked. One writer edits the plugin app, client and screens at a time. Each move keeps the plugin checks green before the web uses it.
- The page-host boundary owns initial navigation, saved page state, viewport data, page close, and route changes. It has two concrete callers. Do not add a provider framework, generic event bus, dependency container, or new UI package.
- The plugin retains its board pointer, widget state, resource URI, fullscreen request, and host messages. The browser has no fake host and no iframe around the game.
- Reuse the shared assets and the existing symbol transform in both builds. Relative asset URLs must work on a direct game route. A browser bundle must not contain server modules or a service credential.

### API and identity

- Construct the website API handler in the existing server, from the same store and game service, and dispatch `/api` before MCP. Add its deploy route before the browser calls it. Keep the plugin and internal routes intact. One admission gate per server instance serves both transports, and both call the same per-account counter rows.
- Use the existing website session and verified user ID. Reject an MCP OAuth token at the web API. Never trust an account or seat ID from request data as the actor.
- Sign-in redirects to one fixed callback (`/play/`). A per-tab flow record holds the SDK flow ID, the return target (checked against the account route patterns) and a creation time; the page consumes it once. The invite token never goes to the auth provider in a redirect URL.
- The account client gives the token with its user ID. Each queued job, pending command and retry is bound to the user ID at its start and is never sent with another account's token.
- API writes run in this order: local token checks, the shared admission slot, the current-user check, bounded input, the operation budget, service work. Reads accept a valid token until it expires. The game GET is read-only; seat activity is its own write.
- A pending deletion blocks entry to any new game (Create, Find, Accept, Join, invite renewal, rematch) in the shared game service; a suspended or deleting host drops out of the lobby. Refusals tell a verified suspension, an expired session and a temporary failure apart, and each links Support.
- Complete the explicit contract in [Complete the web API contract](issues/03-http-contract.md). Reuse game commands for seat choices, complete turns, computer play, draw actions, abort, resign, claims, and rematches. Add only the missing reads and start/matching operations.
- Move the shared settings, handle checks, and block queries to their account modules. The API does not call MCP or use plugin board storage.
- Retain same-origin checks, bounded input, no-store responses, seat checks, hidden choices, invite expiry, and short-code attempt limits. Apply the accepted per-account budgets to direct API calls from the first served write route; the MCP limits do not protect the API.
- Confirm account status on sensitive operations. The existing website verifier can accept a signed token until expiry. Decide and test the effective ban, deletion, and sign-out behavior before public exposure.
- Use the same service user ID in both clients. Do not link different users by matching email addresses. Confirm any production identity gap with test accounts before a schema or sign-in change.

### State, commands, and recovery

- Keep four facts separate: server View, unsent draft, pending command, and selected route. A draft never writes into the server View.
- Serialize writes through one queue. Advance the current job epoch when the user selects a newer route or command. Cancel obsolete reads. A stale reply can finish its own receipt but cannot repaint another game or route.
- Give Create, Find, and a submitted turn stable command IDs. Save the ID and unchanged input before send. Retry the same action with the same ID. A changed input under that ID is a conflict.
- Make a new invite an explicit operation. Do not rotate an invite as a side effect of reading or retrying Create. If an invite response is lost, an explicit retry may make a new code and says so.
- Restore a draft only after a fresh account and game read. It must match the full game ID, account, turn base, and rules. Validate each move against the shared engine and the server’s first-step legal list. The server validates the whole submitted turn again.
- Keep a draft across a non-move revision when its turn base stays valid. Drop it on an incompatible move or game change with a clear notice. Keep Undo local. A successful submit locks play but permits piece reads.
- Use browser session storage for per-tab account drafts and receipts. Reload can recover them. Closing a tab can discard an unsent draft. The account game itself remains on the server. State this limit; do not promise cross-device unsent turns.
- If storage fails, keep play available and report the recovery limit. Sign-out and account switch clear private state and stop old calls. A new tab loads the current server list before it offers a new start.
- Use the mature polling rules for waiting, setup, playing, and rematch states. Stop hidden polling. A visible return, browser back/forward restore, or network return triggers one current read. Delete the older watcher in the old online client (it stops at setup and drops equal revisions) when the shared poll takes over.
- Do not drop useful equal-revision display data. Game revision orders moves; it does not necessarily order presence or every account field. Use the accepted-view rule for each value.
- Preserve server error codes. A refusal, a failed read, and an unknown write outcome need different recovery. A poll does not erase a command refusal. A failed game does not block an unrelated start.

### Game setup and play

- Use the common setup validator and builder. Keep the weighted piece pool, a matching army for both sides, and a public four-card deal. Do not reimplement these rules in a page.
- Keep the five feature switches and their constraints. Classic needs Fairy pieces off. Arrangement applies to Fairy pieces. Cards permit only powers that are always on. Pick four deals those four; Use all deals four from a valid pool.
- Keep the approved default options. Quick play uses the existing Beginner shortcut and does not overwrite the saved setup. The human initiator chooses the colour; a joiner controls only its seat choices.
- Hide seat choices until both seats are ready. Validate the order, bishop colours, and guard position. Keep the three-day setup deadline and the existing no-result expiry.
- The account board uses the server’s seat view. It does not allow a browser to choose another side’s legal moves, alter a hidden setup, write a score, or set a deadline.
- Use the shared staged-turn rule. One send carries the complete turn, including an explicit pass when needed. End detection comes from the engine, not a fixed number of actions.
- Keep the actual shipped card/power flow. The current board has a read sheet and Use. Approved direct card use (arm a coin on tap) and Collection costs exist on a separate branch; they enter through the plugin and the shared UI if the owner includes them in the scope picks.
- Keep the own-piece shove/swap preview, target-first words, card cost text, both public hands, spent-card reading, keyboard board access, named moves, and piece reading during a wait.
- The server computer uses the same four level definitions as local play. Account computer games use the server worker. Offline computer games keep the local engine.
- Preserve recorded engine versions for stored account games. Do not convert games or remove referenced engine bundles. Every View carries the game's engine stamp. The browser keeps a list of supported stamps with evidence; an unsupported stamp gets no local draft or rebuilt history, only the server facts. Each engine that an unfinished game uses needs a tested continuation path before release. Server results are final; draft results are previews. The two oldest engines keep one built-in computer strength under any level name.

### Friends and matching

- Share an invite with code, web destination, rule names, and expiry. Keep Share first and Copy beside it. A cancelled native share does not copy. Manual selection remains the final copy path.
- A join route is a preview. Opening it or returning from sign-in does not take a seat. The Join button names the open colour. The server decides whether the invite is still valid at acceptance.
- Find selects the oldest eligible game with the same five switches. Exact piece/card pools need not match. Any rules is explicit. Blocks apply in both directions through the service rules.
- Keep the 24-hour open-game period and the existing seven-day friend invite period. Do not add live clocks or a new deadline option UI.
- Keep the computer-while-waiting flow. It tracks a waiting human game separately from the shown computer game. Switch now ends that temporary computer game with no result. Not now keeps the human game in the list.
- A browser Back, close, or background event does not cancel a game. Cancellation requires its explicit action.

### Account record, settings, and safety

- Show active games, paged history, totals, rating, and badges from the existing service. Only human games change ratings. A new rating stays provisional under the existing rule. Keep all content unlocked.
- Use the existing preset icons and handle rules. Availability checks run one at a time and keep only the latest requested name. Save and error paths retain the game-start intent.
- Keep local save/sync settings on the local path. Account symbols, threats, and last setup use the account settings service. Visibility uses the profile. Sound remains a device choice. No two stores compete to write one account setting.
- Carry Block, Unblock, and the three visibility choices. A block prevents future matching but does not erase or auto-end the current game. Keep the current move-time visibility limits clear.
- Keep chat, email, push, and reminder delivery off. Do not enable dormant jobs because their code exists. Keep the existing tick, cleanup, and deletion jobs.
- No in-app Report control in the first web release. Email support is the report path: an operator intake step in the existing moderation command makes a report row from a support case; the owner handles it with a first-response target of 7 days. A shared, actor-scoped notice view serves players who can sign in; a suspended player gets the reason and the appeal reply through support. The Support page carries real appeal steps. These are prerequisites of public random matching.
- Retain the seven-day account deletion grace and cancellation on sign-in. Keep local games as the existing account flow promises.

### Visible shared changes on merge

- The PR 61 merge changes the live web app with no web work: coordinate labels hide below 8 CSS px, passive board effects stop after 5 seconds, shared text says Select, the context row can grow, disabled coins keep their face, and the board stays hidden until its first frame. The post-merge web baseline lists them. A recorded owner pick carries; a new web trade-off goes to the owner before a deploy.
- The balance tool keeps its refusal of the Classic flag. It does not limit the game.

### Browser cache, routes, and layout

- Cache only an allowlist of public build files. Requests with an Authorization header, non-GET requests, `/api`, `/mcp`, auth and consent paths, `/play`, `/g` and `/j` bypass the offline worker. Activation deletes old cache generations. The account page sends no private request until the controlling worker answers a cache-policy message; an old worker cannot answer. Server no-store alone is not sufficient.
- Keep the offline local page working. Do not cache account HTML responses with user data, API payloads, invite secrets, or session-bearing requests. Test a real worker upgrade from the old cache behavior.
- Serve the account page as its own HTML entry at `/play`, `/g/<id>` and `/j/<token>`, with no-store and no-referrer headers. The deploy build uses an absolute asset base so deep routes load their files. Use the account hall and direct game/invite routes from the route ticket. Allowlist sign-in return paths. Replace an accepted invite URL with the game URL. Do not send invite tokens to logs or analytics.
- Use browser viewport and safe-area behavior. Remove the plugin composer gap from the web. Keep controls reachable when browser chrome or the software keyboard changes the visible height.
- Reuse the approved stone controls, painted board, scroll, badges, card faces, shared type scale, and reduced-motion rules. Do not infer that a separate font proposal is already in the product.
- Carry the actual small-screen fixes: card strips, whole-word tabs, scrollable rule text, end-card fit, visible turn controls, and the board floor when a draw reply appears. Preserve WebKit scroll by avoiding needless DOM moves.
- Keep board pan and piece drag distinct. Verify the actual hit target after scroll, zoom, and orientation change. An element’s bounding box alone is not proof that a tap reaches it.

## Testing Decisions

No test runs in this planning task. These are build and release checks.

### What a good test proves

A good test checks an observable result. It uses the highest boundary that can expose the fault. It proves the stored game, returned view, visible state, focus, or effective hit point. It does not mirror an implementation loop or assert only a CSS string. A retry check counts committed games and commands. A hidden-choice check reads the other player’s real response. A phone move check taps a board square and verifies the saved turn.

### Seams

| Seam | Coverage | Existing basis | New work |
|---|---|---|---|
| T1: website HTTP boundary with real services and disposable PostgreSQL | Identity, input, permissions, hidden choices, start IDs, whole turns, matching, results, blocks, settings | `src/api/http.db.test.ts`, `src/match/*.db.test.ts`, `src/plugin/server.db.test.ts` | Complete the route contract and cross-surface scenarios. Use test website sessions, not production credentials. |
| T2: existing pure client and game modules | Draft restore, turn completion, queue epochs, scoped notices, polls, setup constraints, Classic rules | `src/plugin/state.test.ts`, `queue.test.ts`, `poll.test.ts`, `screens/board-model.test.ts`, `src/rules/classic-chess.test.ts` | Keep these tests with moved modules. Add only new browser-store or route state branches. |
| T3: built browser page | Full user journeys, Back/reload, failed writes, sign-in return, touch, focus, layout, motion | `tools/plugin-ui-harness.ts`, `tools/plugin-protocol-fixture.ts`, `tools/plugin-*.test.ts`, `tools/plugin-ui-check.mjs` | A top-level-page driver and one registered `web-online` check. This name is proposed, not present. |
| T4: current web behavior | Local saves, links, lessons, settings, Workshop, local turns, art | Existing named web browser checks and save/sync tests | Extend only where a shared change reaches these paths. |
| T5: deploy output and worker boundary | Direct routes, API dispatch, cache privacy, asset paths, old worker upgrade, compatible rollback | `tools/vercel-check.mjs`, deploy tests, worker/build code | Probe the actual built static/function tree and a worker-controlled browser. |

T1 is the main new seam. T2 preserves existing focused evidence. T3 covers behavior that a service test cannot see. Do not duplicate T1 behind each screen.

### Required correctness cases

- Missing, expired, wrong-audience, anonymous, wrong-role, and wrong-seat requests fail with no private data. A cross-origin caller gets no accepted browser API response. Test bans and deletion state under the chosen policy.
- Two clients race to accept one seat. One wins. The loser receives a stable refusal. A blocked pair cannot match through either surface.
- A lost Create, Find, Choose, move, computer, or rematch reply does not create a second effect. Retry carries the original ID and input. A changed payload under the same ID fails.
- A Haste, free-card, chain, or terminal turn commits in full or not at all. An unfinished turn is refused. Undo and inspection never send a command.
- A stale poll, old list, failed mount, delayed profile, and superseded computer reply cannot replace the current game, route, notice, or receipt. Test reversed reply order.
- A setup View and an equal-revision display update still refresh. A revision gap causes a full read. A hidden page stops work; wake makes one current read.
- Hidden seat choices stay hidden. Profile data omits email and provider photos. Invite preview does not join. Code guessing meets the existing limit.
- Result, rating, and badge writes happen once across retries and both clients. Computer games do not change the human rating.
- Browser A and the plugin can take alternate turns in one game. One user can resume the same game from both clients. Shared settings and history reflect the accepted source of truth.
- An old local save, old local game link, and each retained active-engine fixture remain usable under their recorded rules. New Classic does not change old default play.
- An active old service worker upgrades before private requests. Two different accounts on the same browser do not receive a cached profile, view, or invite. Public local assets still work offline.
- A failed or denied storage write gives the stated recovery limit. Reload recovers only a matching draft. Closing a tab does not falsely claim a server save of unsent actions.

### Browser and device acceptance

Use desktop Chromium, Firefox, and WebKit. Cover phone portrait at 320 × 568, 390/393 × 844/852, and 412/440 px widths; short landscape; a tablet in both orientations; and desktop at 1280 × 800 and 1440 × 900. Include 200% zoom and the 197 × 426 fit case. Check larger browser text separately from CSS viewport emulation.

Check actual iOS Safari and Android Chrome for board pan, piece drag, software keyboard, safe areas, Share, Back, and turn-button input. Desktop WebKit is useful evidence, but it does not prove native iOS pan. Record the exact device and browser for each result.

Keyboard and screen-reader journeys cover the hall, identity form, setup sheets, seat, board, card/power action, draw confirmation, result, profile, and block list. Check accessible names, state announcements, focus order, focus return, readable contrast, and reduced motion. Do not certify the whole app from a handful of aria attributes.

The proposed speed gate reuses the existing QA target: under the same test conditions, the median of three cold runs reaches the first account screen within 2.5 seconds, and a local visual response within 300 ms. Separate a local response from a server-confirmed result. Measure against the accepted plugin and main baselines before the owner fixes this gate. Run a cold comparison with service workers blocked, then with the real worker. The two measurements must not hide transferred work in a worker cache.

Render comparisons use the same environment. Capture main twice first. Count a visual change only when the baseline state is stable. Use the engine to draw board states. Review controls after real input, not only the initial page.

### Commands and evidence

Run source tests through `npm test` only. Run doc-only checks through `npm run test:docs` when needed. Run browser checks through `npm run check:browser <name>`. The future web driver registers `web-online`. Reuse `plugin-ui` and `plugin-ui-http` for shared changes.

The relevant existing local web names include `account`, `home`, `new-game`, `turn`, `link-game`, `end`, `their-turn`, `game-screen`, `menu-extra`, `read-piece`, `verb-marks`, `lessons`, `lesson-return`, `powers`, `special-moves`, `painted-game`, `workshop`, and `workshop-cast`. A moved control requires a selector search and each affected check. The final integrated build runs the required full suite, with the test database checks enabled. Record skips and limits.

Each phase records source commit, commands, exit status, counts, device/build identity, and evidence paths. A pass on an earlier code tree is not a pass on a changed tree. Follow the project’s future execution rules for long checks. This planning run starts none of them.

## Phased Build Order

Each slice ends in a complete behavior. It can ship through a PR when its checks pass and the required owner approvals exist. A phase does not imply permission to publish. Visual work uses the accepted sample. Every phase keeps the existing local app usable.

| Phase | Small slices and result | Exit checks | Depends on |
|---|---|---|---|
| 1. Accept the common base | Record the final PR merge and run the web baseline (full web suite, render compare against pre-merge main, list of visible shared changes). Recheck this inventory. Take the common engine, renderer, account copy, schema tools, and tests. Fix the worker cache boundary before any API exposure. No account route is made public in this slice. | T2, T4, T5. Old local saves and links work. The worker still serves public offline assets and cannot cache private requests. Final source and required plugin results are recorded. | Owner spec approval; final release evidence and web baseline; engine decision. |
| 2. Open a safe account page | First add the shared host/client seam with plugin behavior unchanged. Then add the browser entry, existing sign-in, safe return, and read-only Your games. Add direct game/invite route shells with complete sign-in/error exits. Expose only complete, protected read/account operations in this slice. | T1 identity/reads, T3 sign-in return/Back/reload/account switch, T4 account/local continuity, T5 direct routes. No private request goes through an unsafe worker. Shared plugin screens still pass. | Phase 1; the later-update branches landed or parked; route and visual sample; account and storage picks. |
| 3. Finish one account computer game | Share the board, state queue, draft, poll lifecycle, and result handling. Start a simple computer game, stage a turn, Undo, submit, recover a lost reply, finish, and play again. Add stable Create IDs and the command API. Apply the per-account budgets with the first write route. | T1 one start/one turn/result and budget refusals, T2 draft/queue, T3 a full computer game with a lost reply and reload. Check touch, keyboard, symbols, threats, and reduced motion as these controls move. | Phase 2; API contract. |
| 4. Add the full setup | Ship three complete option slices: Classic and piece pool; cards and legal powers; hidden seat arrangement and Ready. Each slice uses the common builder and the same account board. Keep quick play and last setup intact. | T1 setup/private view, T2 Classic and option constraints, T3 each new option through a finished turn. Card, power, and arrangement controls pass phone/zoom checks when they arrive. Old saved rule flags stay unchanged. | Phase 3. |
| 5. Finish a friend game across surfaces | Add Share/Copy, code and token preview, Join, identity prompt, deadlines, draw/abort/claim, and human rematch. Carry Block before the path reaches public use. A browser seat and plugin seat finish a game. | T1 cross-surface identity/seat/turn/result, T3 share cancel/copy failure/expired invite/taken seat/reload, T5 direct invite route. Rating and badges write once. Existing local game links still work. | Phase 4; safety and identity decisions. |
| 6. Add open matching and the wait flow | Ship lobby/Find/Accept/Cancel with exact-switch matching and Any rules. Then add computer-while-waiting and explicit handoff. Before random public access: the support intake step, the shared notice view (both transports), real appeal steps on Support, and the shared limits, with rematches on the create budget. | T1 seat race/block/expiry/limits; T3 lost Find, return after close, delayed match, Not now, Switch now, and temporary computer abort. No late reply selects another game. | Phase 5; public safety gate. |
| 7. Complete profile and Collection | Ship record/history/totals/rating first. Then add badges and all Collection tabs. Finish paged blocks, profile settings, and identity edits. Use the same services and art. | T1 paging/settings/results, T3 long history/empty states/keyboard/zoom/account switch. All content is unlocked. No second rule catalog or private cache appears. | Phase 5; matching paths join the integrated check after Phase 6. |
| 8. Verify and publish the complete adaptation | Check the integrated product, direct route build, old-worker upgrade, actual phones, cold loads, public help, and recovery build. Update the web instructions. Publish only the owner-approved scope through the existing deploy path. | Full required `npm test`, T1–T5, affected named local checks, shared plugin checks, real-device record, no confirmed release fault, and the concrete publish go. Confirm API/asset routes and internal job outcomes after an authorized publish. | Phases 1–7; accepted release packet. |

Phase 7 can proceed before the random-match slice if the shared source is stable. Only one writer edits the common app boundary at a time. The future build uses project worktrees and review rules. This plan does not change any worktree.

Do not save phone, keyboard, or recovery work for Phase 8. Each feature carries its own input and failure checks when it moves. Phase 8 verifies the integrated product; it is not a repair phase for intentionally incomplete slices.

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

- A new ruleset, piece, card, power, balance run, or computer level.
- A new game engine, backend, account database, UI framework, or plugin host simulation.
- A replacement of current offline/local play or a conversion of old local saves into account games.
- Workshop designs in online games, new public replay, hints, or undo after a server commit.
- Live clocks, new turn-length options, guests, chat, email/push delivery, a friends directory, leaderboards, seasons, or unlock gates.
- Local ports of the new setup, cards and Classic into the local New game, unless the owner picks that option in the web play boundary.
- New card paintings, a new visual theme, and plugin taste proposals absent from the accepted merge unless the owner adds them to this spec.
- Other platform plugins, submission portal work, reviewer-only onboarding, or a new domain/DNS change.
- A legal compliance judgment from this source review. Existing public-safety records need the owner’s release decision.
- Any build, test, browser session, account sign-in, live query, merge or deploy as part of this plan.

## Further Notes

The earlier session is right about the large common base. Its conclusion understates the web API gap, browser state work, existing sign-in, cache risk, and plugin-local device fixes. The inventory supplies the evidence and the owner-pick ledger.

The plan uses the smallest complete change: keep the working local app; share the working account UI; extend the existing HTTP client and handler; reuse the existing renderer, rules, setup, and service transactions. It avoids an iframe wrapper, a second server, a second account UI, and a broad client rewrite before a first playable slice.

Open tickets hold recommended picks, not owner answers. Seven research tickets hold resolved source facts. The other tickets wait for the owner, the final release facts or a sample. Nothing here authorizes a build or a publish.

Faults found during planning: the PR 61 release packet says unsent outbox rows stay, but the code, the privacy page and the database test delete them after 30 days (fixed on the PR 61 branch in `5e5b7fd8`); the offline worker cache and the old watcher are latent web faults that phases 1 and 3 remove.

The top risks are private data in a worker cache or the wrong account state; divergent client behavior or duplicate commands after extraction; and a moving release base whose checks, schema, and real-device evidence do not match. The phase order addresses these before public play.

No wall-clock estimate follows from 499 commits or 81 work units. The first shared-client and browser-route slices provide a measured basis for an estimate.
