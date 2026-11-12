# Muse connector map

Type: map
Status: open
Labels: wayfinder:map

## Destination

King Down as a Meta Muse connector that Meta can review: a user links a kingdown.dev account in Muse, then starts, plays and finishes games against the computer by text or voice, and sees the turn status of every game, all in chat. The code is a tested part of this repo, deployable to staging with one switch, and every decision that the first Muse submission needs is in this map. The map ends when [Approve and submit the connector](issues/17-submit.md) is resolved.

## Notes

- Owner request, 2026-11-08: "i'd like you to own the development of a "port" of the game as a meta muse connector version. ready everything you need. set up whatever you can and keeping everything as lean as possible. ... note that the UI/UX will have significant changes. focus on a robust codebase and framework to work with. choose the best environments and engines and implementation decisions based on our requirements and the requirements and recommendations and guidelines for meta muse connectors." So this map carries execution: its first session built the foundation on branch `muse-connector` and settled the decisions that the foundation needed. Later sessions resolve one ticket each.
- Skills for each session: wayfinder (this map), ponytail (the smallest complete change), codebase-design (seams), research (research tickets), prototype (wording and flow questions). Write in ASD-STE100.
- The tool contract and the module map: [spec.md](spec.md). Run, test and deploy: [docs/MUSE.md](../../MUSE.md). Research reports: [docs/research/muse-connector-2026-11-08](../../research/muse-connector-2026-11-08/).
- Primary sources: the [Muse connector guidelines](https://muse.ai/platform/docs) and [terms](https://muse.ai/platform/terms). Meta changes them without notice; check them again before the submission.
- Agents decide and report under the owner's standing rule. Deploys (staging and live), the Muse portal (it needs the owner's identity and business verification), Supabase dashboard steps and spending need his word.
- Ticket lines: `Type:`, `Status:` (`open`, `claimed`, `resolved`) and `Blocked by:`. The frontier is the open, unclaimed tickets whose blockers are all resolved; scan `issues/` by number.

## Decisions so far

- [Research the Muse connector contract](issues/01-muse-contract.md): Muse calls a remote MCP server (Streamable HTTP) or a raw API; OAuth by a static client, CIMD or DCR; two test accounts with passwords; no public proof that Muse shows widgets or images.
- [Research MCP standards and hosting](issues/02-mcp-hosting.md): MCP 2026-07-28 with the v2 TypeScript SDK; Vercel in the existing project; Supabase stays the authorization server.
- [Research the conversational experience](issues/03-voice-ux.md): match words against legal moves only; few tools with rich results; layered board text.
- [Choose the transport and the SDK](issues/04-transport.md): one stateless endpoint, `https://kingdown.dev/muse/mcp`, on the v2 SDK with 2025-era fallback; no REST adapter yet.
- [Choose the account link](issues/05-account-link.md): Supabase OAuth 2.1, one pre-registered public PKCE client for Muse, audience bound to `/muse/mcp`.
- [Choose the game backend](issues/06-game-backend.md): `GameService` and Postgres, so the same games show on kingdown.dev; the computer replies inside the move call.
- [Choose the tools and their classes](issues/07-tools.md): six tools, three reads and three writes; derived command IDs make writes safe to retry.
- [Choose how the board shows without a widget](issues/08-board-text.md): a spoken status line, piece lists, a letter grid and a link; no picture or widget in version 1.
- [Build the connector foundation](issues/09-foundation.md): `src/muse/`, the server wiring behind `MUSE_CONNECTOR`, migration 0023, `npm run muse:dev`.
- [Delete the Muse games on a disconnect](issues/18-disconnect-deletion.md): Settings → Disconnect Muse revokes the grant and deletes the games started in Muse at once; a daily sweep deletes them 30 days after the last use of the link (owner, 2026-11-12).

## Not yet specified

- **A board picture or widget.** If the custom-connector test shows that Muse displays images or MCP Apps, a painted board image (or the parked `ui://` board) can join the view and move results. Waits for [Test with a Muse custom connector](issues/12-custom-test.md).
- **Meta AI Connectors and glasses.** The separate Meta AI developer preview (glasses, Meta AI app) asks for a REST/OpenAPI service. Whether one connector serves both programs, and whether a REST face over the same tool table is worth it, waits for Meta's answer. Meta Ray-Ban Display web apps and WebMCP are a separate product.
- **"Your turn" alerts.** Muse can run scheduled checks that call `kingdown_games`; push from a third-party connector is unknown.
- **Online play by voice.** Invites, joins and moves in games against a person wait for [Decide voice play against a person](issues/14-person-games.md).
- **Server computer strength.** The Node search uses the linear evaluation, the website the residual one, so the same level plays a little differently. Measure before a change.
- **Cards and king-power choices by voice.** Version 1 offers king powers on or off with the default choice and no cards; a spoken setup step comes when testers ask.

## Out of scope

- The ChatGPT app: parked ([docs/HOSTING.md](../../HOSTING.md)); this effort reuses its OAuth parts only.
- Ranked play through Muse: the agent can advise moves, and ranked rules forbid outside advice.
- Payments, purchases and Link by Stripe: King Down sells nothing in chat.
- Parked game features ([docs/PARKED.md](../../PARKED.md)).
- The UI/UX redesign of the website and app: its own effort. The connector shares only the engine, the match service and the account.
