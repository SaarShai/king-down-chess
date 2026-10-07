# King Down in ChatGPT: feasibility and product direction

Research date: **October 7, 2026**. Recommendation, not an approved implementation or release plan. The investigation read the `project GPT` project and its [main chat](codex://threads/01a0fc0b-78ed-7160-bd47-c9496604b18d), current primary platform sources, public chess listings, and King Down code at `main` **dd34fa5**. Three Sol 6.1 helpers investigated platform requirements, competitors, and code reuse. No plugins were installed, games run, models benchmarked, or services deployed.

## Recommendation

Develop **King Down** as a playable native ChatGPT plugin, sharing the website's game engine and artwork. **Owner direction: the game itself is the main feature.** Teaching, hints and review are optional supporting features. The product does not need to interact with, monitor or animate the surrounding chat; project GPT's companion requirements must not drive its scope. Picture-in-picture may be useful where supported, but is not a prerequisite.

The product promise is: **“Play King Down inside ChatGPT.”** Its distinctiveness is the game: its pieces, powers, art and interactions. Prioritize a complete, enjoyable match with direct board controls, the existing computer opponent, save/resume and a path to friend multiplayer. Optional explanations can make unfamiliar rules approachable without requiring conversation to play.

A first experience should be opening the game, choosing an army/king and opponent, and playing. A player may ask about a piece or review a turning point when useful. Fullscreen/expanded presentation should be judged for board usability; side-by-side chat, inline cards and PiP are presentation options rather than requirements defining what we build.

## What project GPT actually established

The latest experiment reports are more informative than the earlier recommendations in the chat. They provide reusable implementation evidence, not King Down's product requirements. Persistent companionship and automatic activity classification were specific to that project. Older browser-overlay experiments were subsequently excluded by the owner.

| Finding | Evidence and scope | Implication for King Down |
|---|---|---|
| A native interactive viewer can remain beside ongoing chat. | Work web at 1728px and 820px: companion remained visible/clickable after the opening message scrolled away, ordinary replies completed, and tool updates arrived. | A board beside teaching/discussion has real local precedent. This is not yet a test of our board. |
| Narrow layout needs special handling. | At 390px, side-viewer chat had zero usable width. The host's **Enter full screen** control restored a floating composer; it could obscure lower app controls. | Test board controls with the floating chat and keyboard. Responsive browser evidence does not establish native mobile support. |
| Persistent data and live UI can cooperate. | Explicit tool reports updated the same viewer; reload restored stored state. Version checks rejected stale results. | Store games independently of the iframe and render authoritative snapshots. Suppress stale cached opening state until refresh. |
| Launch mechanisms differ in reliability. | The conversation menu displayed the entrypoint, but three clicks did not launch it. A model-invoked tool and **Open app in tab** did. PiP was unavailable in the tested session. | Start with a verified launch path. Menu launch and PiP must not be release assumptions. |
| Explicit app context works. | Selected task identifiers reached chat through `updateModelContext` and `sendMessage`. | Share selected piece, current position and revision deliberately; do not infer a passive feed of the whole conversation. |
| Installed skills can guide normal tool use, but are not an execution guarantee. | Server instructions/tool metadata alone produced **0/8 applied reports**. A later installed-skill run after opt-in changed all eight workflows, with **7/8 expected outcomes**. | Package coaching instructions, but let explicit user requests and UI actions drive gameplay. Never depend on the assistant noticing every turn. |

Sources: [native gap audit](</Users/za/Documents/project GPT/.scratch/gamified-chat-mvp/experiments/native-gap-report.md>), [native classifier report](</Users/za/Documents/project GPT/.scratch/gamified-chat-mvp/experiments/native-classifier-report.md>), [current project decision map](</Users/za/Documents/project GPT/.scratch/gamified-chat-mvp/map.md>). Sampled underlying receipts confirm the menu failure and separate restored task states. The classifier run was small, synthetic, and used a different visible host/model setting; its result does not establish Sol 6.1 coaching performance. Package installation and successful behavior occurred together, without proving causality or repeat reliability.

Reusable lessons are the native UI bridge, explicit context, durable state, request deduplication, revision checks and separation of human/model authority. Do not copy the old manifest unchanged, assume its private identity covers our users, or treat its Worker deployment as a proven host for King Down search. No browser extension is needed for the recommended design.

## Current platform: possible and required

This is the current **Plugins** system, combining skills, MCP tools and optional interactive UI. It is distinct from historical 2023 plugin manifests and from a custom GPT with instructions alone. A skill explains when/how to use a capability; tools and game code implement it. [Plugin architecture](https://developers.openai.com/plugins/concepts/plugins)

| Capability | Current documented support | Our use / qualification |
|---|---|---|
| Board presentation | Native conversation-panel entrypoint, with `{type: "thread"}` metadata. Global sidebar entrypoints and fullscreen are also documented. | Choose the mode that makes the game easiest to play. Simultaneous chat is optional; continuous mounting/background execution is not guaranteed. |
| Other product surfaces | Deep links, file viewers/editors, settings, model-app context, rich forms and desktop composer mentions. | Later, a saved-game viewer or position reference could be useful. Extra surfaces are not prerequisites for a playable game. |
| Availability | Web extensions for Free/Go are still described as coming soon; composer mentions are desktop-only. | Verify the intended account/client. Do not promise universal access. |

Source: [Plugin Extensions](https://developers.openai.com/plugins/build/extensions). The current [UI reference](https://developers.openai.com/plugins/reference) documents inline, fullscreen and PiP, including fullscreen-only initial launch. The earlier local test denied PiP; actual client/version behavior still needs testing, and PiP remains optional. The [environment research plan](chatgpt-plugin-environment.md) records the host checks and remaining support questions.

**Direct interaction need not generate a model reply.** The MCP Apps bridge lets UI controls call tools. A tool can be visible to the app, model or both. `content` and `structuredContent` can reach the model; result `_meta` can carry component-only data. Share compact current context and request an explanation when it helps. These mechanisms support click-to-move plus optional conversational control without making the user wait for prose on every move. [UI reference](https://developers.openai.com/plugins/reference)

**The service owns the game.** OpenAI distinguishes authoritative server data, temporary UI state and durable cross-session storage. Keep game identity, rules/version, verified history and revision in storage we control. An iframe's local state is not a save system. A proposed “what if” line needs its own analysis branch; it must not silently change the live game. [State guidance](https://developers.openai.com/plugins/build/chatgpt-ui#manage-state)

**Hosting and accounts are real work.** Public MCP needs stable HTTPS and supported HTTP transport; private tests can use HTTPS or Secure MCP Tunnel. Our existing Vercel static build does not itself provide a game service. Authenticated private data requires a supported OAuth flow and server-side authorization. Existing Supabase sign-in is useful infrastructure, but not proof of a compatible MCP OAuth integration. [Server deployment](https://developers.openai.com/plugins/build/mcp-server#deploy-the-endpoint), [private connection/testing](https://developers.openai.com/plugins/deploy/connect-chatgpt), [authentication](https://developers.openai.com/plugins/build/auth)

**A full existing web UI can potentially be embedded.** Current rules permit pages under the MCP server's own registrable domain, with declared iframe origins and submission justification. Same hosting provider is insufficient; review is still required. Compare reuse of the existing game UI with a native board shell based on playability and integration effort; do not assume a teaching-specific UI is preferable. Both approaches need actual CSP, assets, worker and narrow-screen checks. [Iframe requirements](https://developers.openai.com/plugins/plugin-guidelines#iframes-and-embedded-pages), [security and privacy](https://developers.openai.com/plugins/guides/security-privacy)

**No extra model API is inherently required.** ChatGPT already supplies the conversational model, and King Down already supplies a computer opponent. This is an architectural inference, not a free-hosting guarantee. We still need hosting/storage/search capacity; host usage and access depend on the user's plan. Do not import project GPT's external classifier or a separate LLM service without a demonstrated need.

**Events are optional notification infrastructure.** Documented MCP Events use explicit webhook subscriptions for supported Work/dot surfaces. They do not provide a passive full-chat feed, native matchmaking or a guaranteed low-latency chess clock. Multiplayer can instead use direct client connections to our match service; see the concrete precedent below. [MCP Events](https://developers.openai.com/plugins/build/mcp-events)

### Multiplayer: a concrete implementation path

**Yes, real-time human multiplayer is possible inside a ChatGPT plugin.** Cloudflare's official tutorial specifically builds multiplayer chess: a player creates a game and shares its ID, and a friend joins from their own ChatGPT conversation. Help from ChatGPT is optional. This is a published implementation precedent, not a newly run King Down test. Its older connector setup and Skybridge metadata must be updated using current OpenAI documentation. [Cloudflare tutorial](https://developers.cloudflare.com/workers/demos/chatgpt-app/)

The example's board uses `useAgent` to open a direct WebSocket to a named game service; both clients use the same game ID. Server methods apply moves and broadcast state. MCP opens the board, while ordinary gameplay proceeds through the direct connection without model generation. [Board source](https://github.com/cloudflare/agents/blob/main/openai-sdk/chess-app/src/app.tsx), [server source](https://github.com/cloudflare/agents/blob/main/openai-sdk/chess-app/src/index.ts), [Agents connection documentation](https://developers.cloudflare.com/agents/getting-started/quick-start/)

For King Down, the proposed flow is:

1. Player A creates a match and receives an invitation/code.
2. Player B joins from their own ChatGPT, taking the other seat. Their private conversations need not be shared.
3. Both boards send moves to our shared match service. It verifies player identity, seat, turn, current revision and legality with the King Down engine.
4. The service saves each accepted change and updates both boards. Reopening retrieves the current match.

This also makes **ChatGPT–website crossplay** a reasonable architectural option: kingdown.dev can connect to the same service. Crossplay is a proposed extension, not tested here. Existing game-by-link sharing is not already a live match service. Cloudflare is one possible host, not a platform requirement.

Friend invitations, a public matchmaking queue, asynchronous games and timed games are different features on top of that service. Start with friend invitations. Async play needs durable ownership/history and resume; optional turn notifications are separate. Timed games need server-owned clocks and explicit disconnect behavior because the host can suspend/close the board. A public queue also needs enough simultaneous players to be useful.

The tutorial is not production-ready authorization: its sample accepts client-generated player identities, and it needs stronger protection of authoritative state. Authenticate direct game connections separately from MCP and do not copy shared player IDs as proof of identity. Keep hidden cards out of opponents' state. These are implementation requirements, not reasons multiplayer is unavailable. [Game implementation](https://github.com/cloudflare/agents/blob/main/openai-sdk/chess-app/src/chess.tsx), [state validation](https://developers.cloudflare.com/agents/runtime/lifecycle/state/#validating-state-updates), [cross-domain authentication](https://developers.cloudflare.com/agents/runtime/operations/cross-domain-authentication/)

### Packaging, publication and business constraints

Current portable packaging uses root `plugin.json`, optional `mcp.json`, `skills/` and assets, with OpenAI settings in `extensions.com.openai`. This differs from the older private `.codex-plugin/plugin.json`/`.app.json` package used in project GPT. Local/personal/workspace distribution and public review are separate routes. [Packaging](https://developers.openai.com/plugins/build/plugins)

Public submission requires verified publishing identity, appropriate organization permissions, package/tool scans, MCP domain verification and review. Prepare support/privacy information, five positive and three negative test cases, a walkthrough video and usable reviewer credentials when authenticated. Approval and explicit publication are separate steps. Currently only one connected MCP server is supported per submitted plugin. A stable public endpoint is needed; a private tunnel is not the public distribution path. Public ZIPs containing app references or lifecycle hooks are currently ineligible, so a successful private Sites package is not automatically a public submission package. [Submission requirements](https://developers.openai.com/plugins/deploy/submission)

Current monetization rules prohibit selling digital products/services, subscriptions, credits and freemium upgrades through plugins. Existing paid-account entitlements can be used, subject to restrictions on checkout/upgrade promotion and ChatGPT-specific surcharges. Published UI must also function reliably on desktop and mobile. This favors an initial role in discovery, learning and continued use; do not build the business case around selling card packs inside ChatGPT. No revenue-share, install-volume or commercial-success assumption was established. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines#commerce-and-monetization)

## What already exists for chess

The canonical [chess-in-ChatGPT market register](chatgpt-chess-market.md) now holds all competitors, custom GPTs, open-source implementations, historical products, unverified leads, source dates and adoption evidence. Update that register when new market information arrives rather than maintaining parallel tables here.

Current native listings establish that generic chess play/coaching already exists; developer documentation also advertises human multiplayer. King Down's distinctive product is its own fantasy game. The available evidence does not establish market size, retention or a large paying audience. Unknown user counts must remain unknown.

## What we already have, and what needs adaptation

The current checkout is later than the recorded October 5 live release; do not equate every `main` feature with production. The existing release's tests are evidence for the website, not a plugin adapter. The [tracker](../../TASKS.md) and [ability matrix](../MATRIX.md) also distinguish current owner decisions, lab mechanics and unfinished UI; some old matrix prose predates later implementations.

| Existing capability | Reuse and boundary |
|---|---|
| Rules and legal moves | [engine.ts](../../src/rules/engine.ts), [game.ts](../../src/game.ts). Rendering-independent core. **`Game.play` trusts its caller**: tool inputs must match the current legal moves before calling it. |
| Five official fairy-piece lessons | [lessons.ts](../../src/lessons.ts) has Archer, Guard, Maester, Beast and Ogre, with deterministic goals. It also has Paladin, which is paused/outside the official pool; exclude that lesson from the initial official curriculum. |
| Serialization and replay | [setup.ts](../../src/rules/setup.ts), [game.ts](../../src/game.ts), saves in [main.ts](../../src/main.ts). Retain initial position, rule snapshot and validated move history. Plain FEN alone does not preserve full rules/repetition history. |
| Computer opponent | [search.ts](../../src/ai/search.ts), worker wrapper in [game.ts](../../src/game.ts). Existing time/depth-bounded search; server adaptation and resource limits remain to be tested. No LLM opponent is necessary. |
| Finished-game review | [main.ts](../../src/main.ts) `listMoments` searches positions, presents key losses/mates, reopens the prior position and marks an alternative. [moment.ts](../../src/moment.ts) supplies deterministic captions and selects moments. Expose these facts to conversation; a general coaching endpoint does not yet exist. |
| Accounts and cloud save | [account/sync.ts](../../src/account/sync.ts) and Supabase store personal saves/settings. Useful reuse, but not shared authoritative match rooms. |
| Remote friend play | [main.ts](../../src/main.ts) passes the serialized game by link, explicitly without a server. Live shared matches/matchmaking are new work. |
| Kings, powers, cards, Workshop | Kings/powers exist. Card engine machinery is ahead of browser card UI; Workshop remains on an unmerged branch undergoing redesign. Do not promise a finished deck/draft/Workshop product. |

Two adaptation details deserve explicit engineering gates:

1. **Isolate game rules and search state.** [rules.ts](../../src/rules/rules.ts) exposes mutable module-global `RULES`; `Game` caches legality/status. Search is synchronous in one JavaScript thread, so simultaneous search execution there is not the issue. Interleaved requests for different rule sets, stale game caches and reused search tables can contaminate sessions. Start with a clearly versioned official mode and isolate execution across games. Merely setting globals before each request is not a proven solution; search has an explicit `resetSearchState` helper.
2. **Keep hidden information out of player/model views.** Hands and draw piles currently live in rules and the search can access both sides. Hiding data in result `_meta` only hides it from the model, not the receiving user. Future card games require per-player projections and an appropriate imperfect-information opponent. Leave them outside the first integration.

Also, “Chess starting army” remains King Down rules, without orthodox castling/en passant. Do not market that setting as complete standard chess. Uploaded histories must be replayed through legality checks: the simulator's replay helper explicitly does not validate every ordinary move.

Before exposing review, verify **Haste continuation scoring and move labels**. Current `listMoments`/`keyMoments` code assumes alternating turns in its score comparison and move-number formatting, while Haste can keep the same side moving. This is a concrete code-inspection finding, not a reproduced test failure; the adapter should not inherit it unchecked.

## Product options and order

| Option | Why it might be worthwhile | Recommendation |
|---|---|---|
| **Play King Down** | The distinct fantasy game and artwork are the product. The existing engine supports actual matches. | Main feature: complete solo play, followed by friend multiplayer on shared game infrastructure. |
| **Learn while playing** | Contextual rules, hints and existing lessons can remove confusion. | Optional support; never require a lesson or chat turn before a player can play. |
| **Review my King Down game** | Existing moments, alternatives and replay give chat concrete evidence. Useful to players who prefer playing on the website. | Supporting capability once review correctness is checked. |
| **Meet the six kings** | Let each king introduce its real powers through interactive positions and a distinct voice. | Strong follow-on creative direction. New lesson content requires review; personality must not invent mechanics or strategy. |
| **King Down Workshop** | Natural language can help arrange positions and explore approved armies/powers. | Later, after the underlying Workshop design settles. Branch experiments explicitly; do not let chat silently invent official rules or certify balance. |
| **Broader game modes** | Cards, drafting and public ranked matchmaking extend the core game. | Scope individually after the playable foundation; distinguish unbuilt browser features from plugin adaptation. Retain the website as a first-class surface. |
| **Generic orthodox chess coach** | Larger familiar category. | Weak initial fit: direct competitors and no complete orthodox engine in this codebase. |

A small curated challenge collection could follow the lessons. Unlimited AI-generated puzzles are a separate validation problem: legal positions alone do not establish a unique solution, pedagogical value or correct difficulty. Existing lesson success checks and deterministic move explanations are a better starting point. [King Down lessons on failed narrative/fairness classification](../../LESSONS.md) also argue against asking a model to pronounce new mechanics balanced.

## Smallest credible experiment — proposed, not launched

The [preparation architecture](chatgpt-plugin-preparation.md) identifies work that can precede this experiment while the website evolves: shared match commands, isolated engine execution, versioned saves, transactional persistence and thin client adapters.

Prove **a complete game against the existing computer opponent** inside ChatGPT: new game, direct board controls, special moves, correct ending, save/resume and rematch. Reuse rendering, artwork and engine logic rather than rebuilding a separate game. Then prove a friend can join the same server-owned match from a separate client, with both boards updating and reconnecting correctly. This gives multiplayer an explicit early proof instead of excluding it because of unrelated chat-companion constraints.

The engine decides legality and outcomes; the server decides ownership and revision for shared matches. Save the session and deduplicate mutations. ChatGPT may receive permitted position context when the player asks for explanations or control, but ordinary gameplay must work without generating assistant turns or observing chat activity. Reuse project GPT's integration patterns where relevant. PiP can be explored independently after the main board works.

### Technical acceptance checks

- Open and play the board in the intended ChatGPT host without needing chat interaction. Verify tool launch separately from menu launch and assess fullscreen/expanded controls.
- Complete games by direct moves, including special moves and endings. Reject illegal, stale and post-game mutations; deduplicate retries without changing the position twice. Test natural-language control only if offered.
- For optional help, ask about a selected piece after a board change: explanation and highlighted squares must describe the latest state. Rule explanations should agree with engine behavior; strategic suggestions must be labeled as bounded analysis.
- Reload, close/reopen and resume the same game without an actionable stale initial board. Prove two-player ownership, opponent updates, turn enforcement and reconnect; keep unrelated matches separate.
- Test narrow/fullscreen layout, keyboard/touch, motion preferences, unavailable networking and asset/worker loading with CSP enforced. Native clients remain separate tests.
- Keep the existing website's engine and lesson checks passing. Any later server search must stay within a measured resource budget and preserve rule isolation.

### Product acceptance, beyond “the board works”

The central proposition is that **King Down is enjoyable and convenient to play inside ChatGPT**. A small formative pilot should observe people starting, completing and returning to actual games, plus inviting a friend where multiplayer is available. Compare the experience with the website for controls, visual clarity, loading, interruptions and save/resume. Optional explanations can be evaluated for whether they resolve confusion, without making tutoring success the product's main gate.

Signals for continuing include matches completed without integration-related obstacles, voluntary rematches/return play and successful friend invitations. Numerical targets require a product decision; no statistically meaningful adoption baseline exists yet. No participants were recruited or contacted.

The main risks are lack of interest in the variant, a worse playing experience in the host, and insufficient players for open matchmaking. Private friend invitations can be useful before a public lobby has enough simultaneous players. Unreliable optional coaching is a separate risk and should not obstruct the core game.

## Research verification and limits

Reviewed recent and earlier turns of the named chat, its current decision map, native/classifier reports and sampled receipts; inspected exact engine, lesson, review and global-state code; fetched current official documentation and both named current plugin listings. Follow-up checked Cloudflare's multiplayer tutorial/source, competitor multiplayer claims and public adoption numbers. The code explorer's initial review description was corrected after checking the existing key-moment UI. The owner's game-first direction is merged into the recommendation and acceptance criteria. No existing app tests were rerun for this documentation-only task, and no plugin behavior is claimed from a new runtime test.

Public-directory acceptance, account-specific extensions, real mobile behavior, engine hosting capacity, demand and commercial returns remain unproven. The next implementation decision concerns a complete playable game and a bounded two-player proof; research alone does not authorize implementation, deployment, publication or compute runs.
