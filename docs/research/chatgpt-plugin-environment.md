# King Down: next preparation and ChatGPT environment research

Research baseline checked October 7, 2026 against official documentation and the local foundation at `43941dd`. The owner subsequently authorized the recommended preparation. Current implementation, runnable checks and remaining host/account gates are in [private plugin setup](../plugin-preparation.md) and [the beta/support packet](../plugin-beta-support.md). The [preparation architecture](chatgpt-plugin-preparation.md) remains the overall plan; the [market register](chatgpt-chess-market.md) remains the competitor record.

## Recommended next work

**Prove one playable board in the real host early, while preparing durable storage alongside it.** The local engine boundary is now tested. A full multiplayer backend should not be a prerequisite for discovering whether the actual ChatGPT client can load and operate our board.

| Order | Deliverable | Evidence that makes it useful |
|---|---|---|
| 1 | Integrate the match branch against current main and add a validation-only CI workflow. | Match, game, typecheck and build checks run together when game code changes; the workflow never deploys. Existing [Pages CI](../../.github/workflows/pages.yml) is manual publishing, not this gate. |
| 2 | A small private MCP Apps board experiment, using existing renderer/art and match commands. | Open the board, play directly, exercise a special move, change display mode, close/reopen and recover a known revision. Capture host/CSP/worker failures. Development diagnostics stay outside the player-facing design. |
| 3 | One durable authenticated match operation, then friend joining. | A server commits player permission, command ID, revision and saved state atomically. Two independent clients racing one revision yield one commit; a retry after server restart cannot duplicate it. |
| 4 | A deployable engine artifact and bounded computer opponent. | Run the compiled worker from the actual deployment artifact, with a build-generated engine identity; AI uses the same accepted-command path, has a budget and cannot commit against a stale revision. |
| 5 | Private beta installation, support and release materials. | Testers can install, link an account, start/resume a game and provide a reproducible issue. Review evidence is collected from that working experience. |

Work 2 can begin before 3–4 are complete, using controlled disposable games. It must state its save/lifetime limits. Before inviting external testers or promising saved matches, finish account authorization and durable commits. Keep the game primary; optional explanation tools can follow ordinary play. PiP, ratings, public matchmaking, clocks, card purchases and new coaching infrastructure are not prerequisites.

The next module work should stay concrete: a permitted public board view, server command handling, authoritative match/seat/command tables and one atomic commit operation. The implemented snapshot now includes public effective rules and structured legal moves, while excluding private hands/piles. Existing [account saves](../../src/account/client.ts) and [migration](../../supabase/migrations/0001_accounts.sql) are user-editable personal data, not shared authority. The source-free worker and HTTP server are now built and locally exercised against real PostgreSQL. Current account observations and remaining production configuration are recorded in the setup guide.

## Current documentation that affects our design

- **Use MCP Apps for the new UI boundary.** The standard bridge supports direct UI tool calls and updates without a new model turn. Separate launch/render from move updates; retain ChatGPT-specific helpers only where useful. This supports normal click-to-move play. [UI construction](https://developers.openai.com/plugins/build/chatgpt-ui)
- **A game-first launch is documented.** The UI reference allows a fullscreen-only initial display. Sidebar and conversation-panel entrypoints are also documented, with availability caveats. Test each intended route; do not depend on menu launch merely because tool launch works. [UI reference](https://developers.openai.com/plugins/reference), [extensions](https://developers.openai.com/plugins/build/extensions)
- **General product support is not a feature matrix.** Official user docs cover plugins in Chat and Work across web, desktop and mobile, while noting account-dependent and desktop-only exceptions. They do not establish that every board capability or custom-server connection works on every account. [Plugins](https://learn.chatgpt.com/docs/plugins), [workspace controls](https://learn.chatgpt.com/docs/enterprise/apps-and-connectors)
- **The iframe is replaceable.** Treat widget state as presentation state and our database as match authority. Do not use localStorage or a mounted widget's lifetime as the save contract. CSP declarations must cover actual resources/connections; subframes are restricted. [State and CSP](https://developers.openai.com/plugins/build/chatgpt-ui)
- **Private testing has several routes.** Inspector can exercise tools before ChatGPT. A supported custom connection uses public HTTPS or Secure MCP Tunnel; complete package testing follows. Tunnel/workspace access is a separate entitlement check, and a tunnel does not satisfy public submission hosting. [Connect and test](https://developers.openai.com/plugins/deploy/connect-chatgpt), [Secure MCP Tunnel](https://developers.openai.com/api/docs/guides/secure-mcp-tunnels)

These are documented capabilities, not King Down host-test passes. The existing project GPT evidence remains useful background, but its previous package, clients and companion behavior are not our product contract.

## Host experiment matrix

Record the client, OS, version/build, account/workspace, launch route, advertised bridge capabilities and time for every receipt. Start with the owner's intended desktop/web environment, then test actual iOS/Android clients before claiming mobile support. A narrow browser viewport is not a native-mobile test.

| Priority | Question to resolve | Passing evidence |
|---|---|---|
| P0 | Can the intended account install/connect and launch this MCP UI? | Both tool launch and any selected entrypoint produce the board; missing permission or capability is explicit. |
| P0 | Do moves require a chat reply, approval prompt or iframe remount? | A short scripted sequence updates the board directly, commits each command once and records latency/confirmation behavior. |
| P0 | Can the real board load its art, styles and engine/search worker under CSP? | Test the actual modules/assets with system typography for UI controls. Capture console and network errors, worker startup and search completion; ordinary-browser success is insufficient. |
| P0 | What survives close/reopen, mode changes, chat switches and reload? | Recreated UI restores the same authoritative match and revision; UI-only selections may reset. |
| P0 | What happens during a lost reply or duplicate gesture? | Pending moves remain identifiable; retrying the same command converges on the committed state. |
| P1 | Does account linking survive expiry, revocation and account switching? | Correct user/seat is resolved after each transition; another account cannot load or move that match. |
| P1 | Are touch, keyboard, safe areas and the floating composer usable? | Real-device play includes promotion, power selection, special moves and ending a game, in both orientations where applicable. |
| P1 | What happens on backgrounding, sleep and resume during AI search? | No duplicate AI reply; stale results are discarded and current state is recovered. |
| P2 | Are sound and optional PiP useful and supported? | Test user-initiated audio and actual mode behavior; neither is required to finish the game. |

The fetched docs do not provide a complete guarantee for module/Blob workers, OffscreenCanvas, autoplay, background execution, storage partitioning, iframe lifetime or numeric CPU/memory limits. Test the capabilities we actually use rather than build a generic browser benchmark. Start by measuring existing website behavior as a comparison. If a host failure persists, record it as an observed client/version limitation and prepare a minimal reproduction. The [UI guidelines](https://developers.openai.com/plugins/concepts/ui-guidelines) specify system fonts, including fullscreen; reusing artwork does not imply copying every website UI styling decision.

## Account and hosting research

**Reuse Supabase identity first.** Its current documentation supports MCP authentication as existing users through its OAuth server. That requires configuration and a consent flow; the website's login does not establish that either exists. Verify discovery, client registration, refresh/revocation and row/seat authorization with two test users. [Supabase MCP authentication](https://supabase.com/docs/guides/auth/oauth-server/mcp-authentication)

ChatGPT prefers CIMD client registration when supported and still documents dynamic registration. Our proof must test the provider's actual chosen method plus token issuer, audience/resource, expiry and scopes. A token for the wrong resource must fail. Authentication of the MCP request does not automatically authorize a widget's separate database or realtime connection. [OpenAI authentication](https://developers.openai.com/plugins/build/auth)

**Do not make Sign in with ChatGPT a prerequisite.** The current plugin guide calls it a limited trial for selected commercial partners. It also describes two distinct OAuth transactions; it does not eliminate our account/authorization work. Keep it as a later opportunity if access is confirmed. [Sign in with ChatGPT](https://developers.openai.com/siwc/chatgpt-plugin)

For hosting, test the compiled Node worker, startup/replay cost, bounded AI search, connection behavior and runtime limits on the intended provider. The current static Vercel release does not deploy the new service. Reuse Vercel/Supabase where these checks pass; there is no measured reason yet to add another provider. Measure server CPU, database/realtime usage and any optional model costs separately. Legal moves and the existing computer opponent do not require a new paid LLM call per move.

## Release, compatibility and support

Choose stable MCP and UI origins before public submission. Review rules constrain origin changes, require a unique UI origin, and allow older reviewed tool definitions to remain active while a changed definition is awaiting approval. Keep published tool contracts usable during updates and version breaking UI resources. [MCP review](https://developers.openai.com/plugins/deploy/app-review), [UI reference](https://developers.openai.com/plugins/reference)

Prepare the release evidence while running the beta: five positive and three negative scenarios, a demonstration video, release notes and a dedicated sample-data reviewer account when sign-in is required. Prepare website, support, privacy and terms URLs. Reviewer access must work without MFA approval, email/SMS codes, magic links or private-network access. [Submission](https://developers.openai.com/plugins/deploy/submission), [submission validation](https://developers.openai.com/plugins/deploy/submission-errors)

Public release is a separate gate: a complete playable experience, production HTTPS, domain verification, a current successful tool scan and verified desktop/mobile behavior. A private disposable experiment is appropriate for development; public trial/demo plugins are not accepted. [Publication requirements](https://developers.openai.com/plugins/deploy/app-review), [plugin quality requirements](https://developers.openai.com/plugins/plugin-guidelines)

Our support preparation should include a contact channel, sanitized diagnostic bundle, retention/deletion behavior and a rollback procedure. Useful diagnostics are match/command IDs, revisions, engine/UI build identities, client details, timing and errors; surrounding chat is unnecessary. OpenAI documents escalation with the plugin ID and review-email replies. No guaranteed review deadline or support-response SLA was established. [Troubleshooting](https://developers.openai.com/plugins/deploy/troubleshooting), [review support](https://developers.openai.com/plugins/deploy/app-review)

Current directory policy restricts digital sales, subscriptions, credits and indirect upgrade promotion; do not build an in-plugin card shop or assume a revenue share. Check the policy again before a business-model decision. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)

Track relevant [plugin changes](https://developers.openai.com/plugins/changelog) and [client releases](https://learn.chatgpt.com/docs/changelog), then rerun the affected recorded flows. No recurring monitor was created by this research.

## Remaining research, in priority order

1. **Observed support matrix:** actual owner/tester access and the P0 host checks above. Highest value because they can change the UI and hosting choices.
2. **Authentication and durable recovery:** Supabase OAuth interoperability, two-user permissions, actual PostgreSQL races and crash/retry tests. Mocks alone cannot establish these.
3. **Support clarification where docs disagree:** the general UI guide still describes an inline start while the reference permits fullscreen-only launch; submission guidance says contact support for MCP URL changes while the review guide distinguishes origin from path changes. Confirm the intended route before relying on either ambiguous behavior. No support inquiry has been sent.
4. **Operating cost and latency:** representative full-game requests/searches, cold starts and recovery on the selected staging runtime. Size concurrency from measurements, not unlimited live local workers.
5. **Hands-on competitor and player research:** compare launch-to-first-move, readability, resume and friend joining for accessible products in the existing market register; then observe a small invited group trying King Down. Record observed use, not inferred user counts or store claims. No user recruitment or product accounts were created.

Local implementation and validation now cover the board, durable match authority, bounded AI and compiled server. The next external gate is a working private connection with provider OAuth, followed by the real-client experiment above.
