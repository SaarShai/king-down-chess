# Chess in ChatGPT — market register

**Canonical working list. Last researched: October 7, 2026.** Keep future findings about this market here rather than growing competing lists in feasibility reports. This is an evidence register, not an exhaustive census or a ranking. No products were installed or gameplay-tested during this research.

King Down direction: **the game is the main feature**. Learning, hints and review are optional. Features that interact with the surrounding chat are not required. Optional PiP is a presentation question. Broader chess-variant/game-market context is in the [September market review](market-review-2026-09-27.md); our own platform assessment is in the [plugin feasibility report](chatgpt-plugin-feasibility-2026-10-07.md).

## Current ChatGPT plugin listings

| Product / publisher | Evidence | Advertised play and features | Human multiplayer | Public adoption |
|---|---|---|---|---|
| **Chessy — Altmatter LLC** | [Official listing](https://chatgpt.com/plugins/plugin_asdk_app_69a0e374670c819190761772d2092135), v1.0.0; [developer site](https://chess.altmatter.com/). Listing verified. | Human plays White against ChatGPT as Black; inline board and optional advice. Developer advertises free use/no account. | Not advertised in checked primary sources. Advertised solo; runtime absence not established. | No public users, active users, installs or game count found. |
| **Smart Chess:Train+Learn to win — Spheric Admin Ltd** | [Official listing](https://chatgpt.com/plugins/plugin_asdk_app_69c28d6aedac81919502a88c2179e20c), v3.0.0. Listing verified. [Publisher site](https://www.widget.olutely.com/) contains general widget material. | Play, conversational coaching, hint ladder, move/result explanation, adaptive rematch, opening debrief, export and post-game review. | Not advertised in checked primary sources; unverified. | No public users, active users, installs or game count found. |

An Install button establishes a public listing, not universal account/client eligibility, tested reliability or commercial success. Versions are observations from the check date, not commitments that these remain the latest.

## Developer-advertised ChatGPT integrations

| Product / publisher | Primary evidence | Advertised capabilities | Adoption and limits |
|---|---|---|---|
| **Chess by Max Health — Max Health Inc.** | [Developer site and FAQ](https://chess.maxhealth.tech/), page footer v0.4.0. Its Add to ChatGPT link and directory search presence were observed; the linked install URL redirected to the directory, so current installation was not established. | Board play against the host model or six-level Stockfish; **real-time human multiplayer lobby**; guest access; signed-in handle/rating/history; external game analysis. Supports ChatGPT, Claude and other connector clients. | Site reports **105 players have joined the multiplayer lobby**. Developer-reported, unverified; no period/counting method. Not active, concurrent, installed or ChatGPT-only users. Gameplay untested. |
| **Chess Position Analyzer — Avishay Matayev** | [Developer site](https://chess.avishay.dev/); later appeared in an [official entertainment-directory search result](https://chatgpt.com/plugins?c=lifestyle&category=entertainment), strengthening the initial developer-only evidence. An individual install page was not verified. | Editable inline board, position/FEN setup, flip/fullscreen and edited-position context for ChatGPT; advertised free. | No public adoption number established. Board editing/context does not establish engine-analysis strength. Developer states no OpenAI/Lichess affiliation. |

## Custom GPTs

| Product | Primary evidence | What is established / missing |
|---|---|---|
| **Chess Coach Buddy** | [Public GPT page](https://chatgpt.com/g/g-X7gWZvcVU-chess-coach-buddy?locale=sv-SE). | Community-built tutor listing advertising chess advice, exercises and analysis. This does not establish a deterministic engine, a playable board, native plugin installation or a public user count. |

Other GPT search hits sometimes returned only login shells; they were not promoted to verified competitor entries. A GPT conversation count, if later found, must be recorded under that metric and product rather than treated as users of a similarly named plugin.

## Open-source implementations and adjacent tools

| Project | Source | Relevance and distinction |
|---|---|---|
| **ChessMCP — jerelvelarde** | [Author repository](https://github.com/jerelvelarde/ChessMCP). | Apps SDK chess UI, legal moves/state/history, optional Stockfish, mate-in-one puzzles and OAuth advertised in source docs. Self-hosting precedent; no public-store deployment or successful run established here. |
| **chess-mcp — CSSLab** | [Author repository](https://github.com/CSSLab/chess-mcp). | Stockfish analysis, Maia2 human move prediction, FEN/PGN utilities, diagrams/tactics. General MCP, described primarily for Claude; no ChatGPT directory installation verified. |
| **chess-mcp — pab1it0** | [Author repository](https://github.com/pab1it0/chess-mcp). | Independent wrapper for Chess.com's public data API: profiles, statistics and historical games. Not an official Chess.com-operated ChatGPT plugin or proof of a playable board. |

Repository existence, stars or example code are not measures of installed ChatGPT users. No repository adoption counts were collected.

Additional author-source examples surfaced in the research, all unrun and with no verified native directory deployment or adoption:

| Project | Advertised/source-described purpose |
|---|---|
| [fritzprix/chess-mcp-server](https://github.com/fritzprix/chess-mcp-server) | MCP chess play with dashboard, creation/joining of games, agent turns and Stockfish. |
| [Chess-analysis-mcp/tintins-chess-analysis](https://github.com/Chess-analysis-mcp/tintins-chess-analysis) | Stockfish/LLM coaching with shared MCP/web-board session and PGN/public-user import. |
| [chessceo/chessceo-mcp](https://github.com/chessceo/chessceo-mcp) | chess.ceo player search/preparation, position statistics and tournament tools. |
| [loocookie/ChessGPT](https://github.com/loocookie/ChessGPT) | Stockfish evidence/explanation pipeline before LLM prose; another distinct ChessGPT name. |
| [shreyas-makes/chesscoach](https://github.com/shreyas-makes/chesscoach) | Separate conversational board with why/why-not/what-if interactions. |
| [sudoStacks/chess-coach](https://github.com/sudoStacks/chess-coach) | Completed Chess.com game polling and coach-style review. |

## Historical offerings and name collisions

| Offering | Primary source | Correct interpretation |
|---|---|---|
| **ChessGPT — atomic14** | [Author repository](https://github.com/atomic14/ChessGPT). | Historical ChatGPT plugin-system implementation and related browser interface. Not evidence of a current native plugin listing; distinct from research models also called ChessGPT. |
| **chess-plugin — falsidge** | [Author repository](https://github.com/falsidge/chess-plugin). | Old plugin manifest/OpenAPI integration using Lichess/chess libraries. Historical setup, no current installation verified. |
| **chess-gpt — miedzinski** | [Author repository](https://github.com/miedzinski/chess-gpt). | Browser extension forwarding Lichess game records for analysis, requiring an OpenAI API key. Different distribution/runtime from a native ChatGPT plugin. |
| **ChessGPT — Chess.com** | [Chess.com staff announcement, February 2023](https://www.chess.com/news/view/chesscom-ai-bots). | A themed bot on Chess.com, announced at strength 249. Historical first-party product evidence, not an official ChatGPT integration or evidence its moves use ChatGPT. Current availability was not established. |
| **ChessGPT — waterhorse1** | [Research repository](https://github.com/waterhorse1/ChessGPT), [research paper](https://arxiv.org/abs/2306.09200). | Research model/code/data rather than a consumer ChatGPT plugin. Distinct from atomic14, Chess.com and loocookie names above. |

No primary announcement establishing a current **official Chess.com- or Lichess-operated ChatGPT plugin** was found in this sample. This is not a finding that none exists. Independent wrappers, platform user blogs, themed bots and official products must remain distinguishable.

## Unverified leads to retain

These surfaced during searches but need stronger primary evidence before moving into the tables above. Feature claims from aggregators are not adopted as facts.

- [jalpp/chessagine-mcp](https://github.com/jalpp/chessagine-mcp), surfaced through an [MCP app directory](https://mcpapp-store.com/apps/chessagine-mcp); repository not inspected in this research.
- [fuzzylabs/chess-agent](https://github.com/fuzzylabs/chess-agent) and [rutvij26/chess-context](https://github.com/rutvij26/chess-context), surfaced in author discussions; source not inspected.
- **Chessvia Openings, PlyMove, Xiangqi, Go Game by BlueMoon**, named by a [third-party tracker](https://agentdiscoverability.com/track/chatgpt/chessy). Official identities/capabilities unverified. Xiangqi/Go are adjacent board-game leads. Chessvia's Chessy persona is not Altmatter's Chessy plugin.
- [Chess Mentor](https://chatgpt.com/g/g-x5YU3adHk-chess-mentor), [Chess Coach](https://chatgpt.com/g/g-Xx80bxAca-chess-coach), [Chess Game Assistant](https://chatgpt.com/g/g-ga7YMCVYv-chess-game-assistant): direct GPT URLs returned login shells; capabilities, continued availability and usage are unknown.
- A [third-party Smart Chess entry](https://tedix.dev/apps/accelerator-chess/) uses an **Accelerator Chess** slug. No primary rename confirmation found; do not count it as another product without an identity check.

## Infrastructure and platform references

These are useful technical precedents or market conditions, not additional consumer competitors.

| Reference | Finding and relevance |
|---|---|
| [Cloudflare multiplayer chess tutorial](https://developers.cloudflare.com/workers/demos/chatgpt-app/) and [source](https://github.com/cloudflare/agents/tree/main/openai-sdk/chess-app) | Published real-time multiplayer chess architecture inside ChatGPT: two separate conversations join one named game; direct WebSocket gameplay and server state; chat help optional. Feasibility precedent, not production-ready authentication or a tested King Down deployment. |
| [Lichess API](https://lichess-org.github.io/api/) | Official game/puzzle/analysis and Board/Bot APIs enable third-party integrations. They do not establish a ChatGPT product. Follow each API's intended play/assistance rules if integrating later. |
| [Current OpenAI plugin architecture](https://developers.openai.com/plugins/concepts/plugins) | Current packages combine skills, MCP tools and optional UI. Custom GPTs, old 2023 plugins and general MCP projects are separate categories. |
| [Plugin extensions](https://developers.openai.com/plugins/build/extensions) | Native game surfaces are possible; plan/client availability varies. Directory presence does not mean identical reach on every device. |
| [Plugin commerce rules](https://developers.openai.com/plugins/plugin-guidelines#commerce-and-monetization) | Current rules restrict selling digital products/services, subscriptions, credits and freemium upgrades through plugins. Existing paid-account access is allowed subject to stated limits. No revenue-share or automatic monetization assumption established. Recheck before commercial decisions. |

## Market conclusions — inferences, not measured demand

- Generic “play chess with ChatGPT,” coaching and review already have direct competitors. Human multiplayer is also advertised by at least one developer. These are not empty feature categories.
- King Down's primary distinction is its own fantasy game, mechanics and artwork. Optional teaching can help people access it, but the owner wants playing to remain central.
- The research does not establish a competing King Down-like ruleset, an uncontested fantasy-chess market, a large chess-plugin audience, or strong competitor retention. Those remain open.
- Friend invitations can be valuable before a public matchmaking pool has enough simultaneous players. Crossplay with kingdown.dev is an architectural option that could broaden access, not an observed market advantage yet.
- No defensible estimate of Chessy's or Smart Chess's adoption was found. Max Health's narrowly defined lobby figure cannot be generalized to this market.
- Third-party directory discoverability scores, search position, uptime and successful tool-test counts were encountered and **excluded as adoption evidence**. No reliable traffic-to-users conversion was established.

## How to maintain this register

When new evidence arrives, update the relevant entry in place and give its check date if different from this file's research date. Retain the primary URL, publisher identity, distribution category and whether evidence is a listing, developer claim, inspected source or runtime test. Record a metric only with its exact name, date/window, scope and attribution; use **unknown** when not disclosed. Do not convert marketing claims into tested capabilities or missing documentation into confirmed absence.

Recheck current listings, multiplayer and monetization before making a build/release/business decision. Add newly found competitors here and link this register from decision documents. This is a maintained project document; no recurring monitoring, installation, outreach or test games have been scheduled or performed.
