<!-- Copied from the run's scratch folder on 2026-10-15. Links to screenshots and raw data point to that folder and do not resolve here. -->

**Verdict: Send back. Do not submit this packet yet.**

The local game works. The packet is not ready for approval. A reviewer has no password sign-in path. P2 does not produce its stated result. The privacy text has gaps. Several tool hints do not match the writes. A valid open call can show an empty board. These faults can cause rejection if the owner submits the packet unchanged.

This review covers HEAD `f6600e50424173d40c6dff2fabbe769df554f08c`. The fault merge `f1017eea` is an ancestor. The worktree starts clean. The research report is read with `git show claude/plugin-ui-iphone:docs/research/plugin-submission-2026-10-15/01-openai-review.md`. Its copy is [research-01.md](research-01.md). I check the current official rules on 15 October 2026. The review uses no OpenAI account or live game service.

The Owner column names facts or choices that only the owner supplies. A No entry permits a routine fix; it does not permit a deploy. Each deploy still needs the owner’s go. “Rejection risk” means a clear rule or stated test can fail. “Send-back risk” means the evidence, behavior or scope needs repair. “Polish” means a small quality issue.

| ID | Severity | Where | Evidence | Smallest fix | Needs the owner |
|---|---|---|---|---|---|
| R1 | rejection risk | Sign-in; checklist 45–46 | The consent page offers Google and GitHub only. It has no password form. The packet gives no working review login. A provider can ask for a code on a new device. See src/plugin/consent.html and consent.ts; rule [MCP review rules](https://developers.openai.com/plugins/deploy/app-review). | Add the agreed password path. Seed one review account. Test it from a new browser and an outside network. Put credentials only in Review details. | Yes: account and sign-in choice. |
| R2 | rejection risk | package/mcp.json; checklist 14, 16, 51 | The MCP URL is `<PRODUCTION_MCP_URL>`. The client ID is `<OAUTH_CLIENT_ID>`. These values cannot connect a reviewer. The local persona path proves no production access. See packet-checks.json; [Submission rules](https://developers.openai.com/plugins/deploy/submission). | Set the final HTTPS URL and the registered public client ID. Check the portal callback. Build and check the final ZIP. | Yes: production and client setup. |
| R3 | send-back risk | package/plugin.json; checklist 49 | demo_recording_url is `<DEMO_VIDEO_URL>`. No review video is supplied. See packet-checks.json; [Submission rules](https://developers.openai.com/plugins/deploy/submission). | Record the final sign-in, five positive cases and three negative cases. Use an accessible video URL. | Yes: video and review account. |
| R4 | send-back risk | Checklist 1–4, 18–23, 43, 51–54 | The packet has no current proof of identity, global residency, registered callback, domain challenge, successful scan or anonymous access to the final pages. The source support page exists. Local GET returns 200. Live access is outside this review. This is missing proof, not a claim that the public site fails. [MCP review rules](https://developers.openai.com/plugins/deploy/app-review)[Submission rules](https://developers.openai.com/plugins/deploy/submission). | Complete the owner and release checks. Record each result against the exact build. Do not mark a public URL met from a local file alone. | Yes: portal, domain and release facts. |
| R5 | rejection risk | P2 in test-cases.md and plugin.json | P2-create with kind=solo, level=beginner and colour=white returns status=setup and “Choose your king and arrangement.” It has no move field. P2-open returns the same state. The packet expects “Your move, move 1.” and a ready board. See cases.json and mcp-transcript.jsonl, P2-create/P2-open; [MCP review rules](https://developers.openai.com/plugins/deploy/app-review). | Make P2 include the arrangement step. Or supply explicit valid options with arrangement off. Keep the two case copies equal in meaning. | No: packet edit. Owner: final live test. |
| R6 | rejection risk | Tool destructiveHint; checklist 30 | Six tools declare false despite a relevant irreversible effect: invite deletes the old invitation; say sends a preset; rematch can decline an offer; handle retires the old handle and starts a rename limit; settings overwrites saved values; report sends evidence to the review queue. See server.ts, service.ts, online/accounts.ts, online/safety.ts and the invite, say, settings-write and report transcripts. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)[MCP review rules](https://developers.openai.com/plugins/deploy/app-review). | Set the hint to true for each tool that has such a mode. A portal explanation does not change a false server hint. Check the resulting host prompts. | No: hint fixes. Yes: release and host test. |
| R7 | send-back risk | Write-tool idempotentHint | kingdown_join declares true. Eleven identical preview calls change invite_code_tries from 1 to 11. The first ten pass. The eleventh returns RATE_LIMITED. A preview consumes a security attempt. Static checks find two further repeat writes with I=true: seen refreshes last_seen_at after 30 seconds, and handle with icon always updates profiles; profiles_touch then changes updated_at. The time guard is not a receipt key. See retry-proof.json and mcp-retries.jsonl; [Plugin reference](https://developers.openai.com/plugins/reference). | Set idempotentHint to false on join and seen. For handle, avoid an unchanged-icon UPDATE or mark the combined tool non-idempotent. State that a short-code preview counts toward the hourly limit. Keep that limit. | No. |
| R8 | rejection risk | kingdown_open input screen=board | The valid call {screen:"board"} returns success with no game or view. A fresh harness frame stays on an empty board screen. It says “Connecting…” and “Move 1.” It shows game actions. See screen-board-no-game.json and empty-board-phone.png. server.ts permits this combination. app.ts mountResult has no view to render. [MCP review rules](https://developers.openai.com/plugins/deploy/app-review). | Return home when no game is selected. Or reject this input with a clear request for game_id. | No. |
| R9 | send-back risk | Listing; kingdown_create kind=random; kingdown_find | The listing says the player chooses features before each game. The create description also offers feature and colour choice. A model call that asks for powers and White takes an existing Classic game with no powers and seats the player as Black. See random-options-proof.json. GameService.find takes the oldest open game without a feature filter. | State that random play can adopt the host’s features and the free colour. Ask for that choice before matching. Or change matching if the owner wants exact choices. | Yes: choose the intended promise. A text correction is small. |
| R10 | rejection risk | public/privacy.html; privacy-additions.md | The published-source policy omits per-board selections, presence times, action surface, short-code attempt counts and the deletion audit record. It does not clearly cover stored solo games in ChatGPT. The draft adds presence and surface, but still omits the other items. last_surface marks a game action, including a preset or resignation; it does not mark only a move. See the data table below and db-evidence.json. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)[MCP review rules](https://developers.openai.com/plugins/deploy/app-review). | Add the missing data categories and uses. Correct “last move” to “last game action”. Include solo records, board recovery, abuse counters and deletion records. | Yes: approve the data policy. |
| R11 | rejection risk | Privacy recipients | The source policy names Supabase, Vercel and sign-in providers. It does not name OpenAI as a recipient of tool and widget data. _meta keeps data from the model, but the host still carries it. privacy-additions.md has a draft paragraph only. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)[Plugin reference](https://developers.openai.com/plugins/reference). | Approve and publish the OpenAI paragraph. Explain that the chat sees summaries and the component receives game data. | Yes. |
| R12 | rejection risk | Retention and deletion policy | “Can stay after deletion” gives no period or criterion for game records and report evidence. The draft still has four retention placeholders across games, reports and logs. A local deletion removes auth.users, profiles and code attempts, but leaves account_deletions with user_id and dates. cleanup also has real periods: boards seven days; done outbox rows 30 days. Neither period is in the policy. See deletion-proof.json, jobs.ts and migration 0007. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines). | Choose and state real periods or clear retention criteria. Include the deletion audit. Match the policy to scheduled cleanup and backup behavior. Do not promise a job that does not exist. | Yes: retention facts and choices. |
| R13 | send-back risk | Consent permissions; checklist 44 | The consent text names games and invitations. It does not explain profile/rating access, random matching, reports, or saved settings. It warns about wider account data permissions without a plain list. See consent.html; [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines). | List the actual access and writes in short user text. Confirm that the OAuth grant has only the required access. | Yes: approve words and confirm provider scope. |
| R14 | send-back risk | Reporting and blocking in ChatGPT | kingdown_report is app-only. No widget control calls it. The model cannot offer that tool. No block tool or widget control exists. The support page offers email only. The server has account block logic, but this widget cannot use it. This risk is an inference for play with strangers and users aged 13–17. It is also a stated project pre-release requirement in spec Q13. | Add a reachable Report action and a Block action. Use the existing services. Keep email support. | Yes: approve the rendered control placement. |
| R15 | send-back risk | Privacy controls | The server stores online_visible_to and defaults it to mutual. The widget settings schema exposes only symbols_only, show_threats and last_setup. No user control changes online visibility, quiet mode or game acceptance in this widget. The policy draft describes a setting without a usable path here. See settings.ts, online/accounts.ts and app.ts. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines). | Add the required control or give an exact, working control route. Explain the default. An email request is not an immediate online-status switch. | Yes: choose the control route. |
| R16 | send-back risk | Supported surfaces; listing; bundled skill | Sixteen tools are app-only. The model sees no position. A client with no component cannot make a move. The listing admits the limit, but there is no confirmed surface restriction. The normal game workflow therefore stops without UI. See tools.json and the skill; [UI rules](https://developers.openai.com/plugins/build/chatgpt-ui). | Resolve the supported surface scope with OpenAI. Test it. Do not claim a complete game on a surface that cannot show the board. | Yes: submission scope. Do not expose human-game positions only to satisfy this check. |
| R17 | send-back risk | Review test evidence; checklist 38, 48 | No current signed-in ChatGPT web, iPhone, Android or desktop-app result is in this packet. A local browser does not prove OAuth, host confirmation, tool routing or refusal text. P5 uses a synthetic local confirmation here. N1–N3 have safe protocol boundaries, but their host refusals remain unproved. [MCP review rules](https://developers.openai.com/plugins/deploy/app-review)[Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines). | Run the final eight cases with the final review account on each supported surface. Record exact calls, screen results and refusals. Keep one clear target game for P5. | Yes: accounts and devices. |
| R18 | send-back risk | Model-visible output | kingdown_open returns an internal board_id. kingdown_games returns each revision. kingdown_report returns its internal report ID and creation time. The model does not need these for these tasks. The profile UUID is a separate case: connected-account identity needs a stable ID. A game ID and a useful move deadline also have a purpose. See tools.json and transcript labels P1, P3 and report; [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)[MCP review rules](https://developers.openai.com/plugins/deploy/app-review). | Move internal board IDs, revisions and report receipt fields to _meta where the widget needs them. Keep only required model fields. Keep the stable profile ID. | No. |
| R19 | send-back risk | Tool descriptions | kingdown_open does not state that each open stores a new board record. A join preview does not state its attempt-counter write. The create description does not state that omitted options use last_setup before defaults. That omission causes P2 to depend on account history. See server.ts, PluginService.openBoard and GameService.invitation. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines). | Name these side effects and defaults in the descriptions. Make review cases explicit about setup. | No. |
| R20 | polish | P1 and P4 expected words | P1 quotes “Your move in 1 games.” The build says “Your move in 1 game.” The actual one-badge P4 reply says “1 badges.” P3 here says “2 active games; your turn in 2.” A setup choice counts as ready. Example counts are not fixed assertions. See cases.json. | Fix the P1 quote in both copies. Use singular badge text in the build. State that turn counts include setup choices. Set final account counts before submission. | No. Owner: final seed. |
| R21 | polish | Checklist 29, 30, 37 and source pointers | Row 29 still describes the old poll write. The current get path is read-only and seen is separate. Row 37 still describes an unserved old URI. The current resource template serves old hashes. Row 30 offers a false-hint justification as a substitute for a fix. Several code line numbers and the research count of 23 tools are stale. See readonly-proof.json, resource-old-hash.json and tools.json. | Use the row grades below. Replace old line pointers and counts. Keep the distinction between a local fix and its production release. | No. |
| R22 | polish | Privacy and terms scope | Privacy calls this a private ChatGPT app. The packet is for a public release. Terms say that they apply at kingdown.dev and do not name ChatGPT. The publisher and contact match in the files. | Use the final public scope in the privacy page. State that the terms also cover the ChatGPT app. | Yes: approve policy words. |
| R23 | polish | tools/deploy-live-check.mjs | legalPages contains privacy.html, terms.html and delete-data.html only. A deploy can pass that check with a missing or stale support.html. The checklist correctly leaves row 56 open. | Add support.html to the existing check before the final release. | No: code. Yes: release. |
| R24 | polish | Schemas and error detail | All 25 schemas reject an unknown field. The response is only “Invalid input”. Option constraints and the either-game-or-board condition are not expressed in useful field descriptions. App callers often recover from code, but a reviewer gets little help. | Return a short safe field error. Describe important defaults and dependencies. Reject an empty kingdown_get input with the required choice. | No. |
| R25 | polish | Optional tool quality | Only kingdown_profile advertises outputSchema. Some tool names are nouns. Tool titles, server instructions and invocation text are absent. These points are not automatic rejection reasons. | Add an output schema where it protects a useful contract. Add a title or short description only where it helps the user. Avoid a broad rename before review. | No. |

## Test cases

The prompts below come from test-cases.md. I route them as a local reviewer. I send real MCP JSON-RPC requests to the local server. This does not test ChatGPT’s model routing or user interface. For a negative prompt, the correct route is no tool call. I also send a separate invalid-input probe. That probe is not the expected call for the prompt.

The seed has one finished solo game, one active Classic solo game, a rating row and a synthetic badge row. P2 adds a second active game. I insert the badge for the display test. It does not prove badge award logic. The final production account still needs coherent sample data.

The log has all requests and replies in [mcp-transcript.jsonl](mcp-transcript.jsonl). The case extracts are in [cases.json](cases.json). `active_id` and `setup_id` below mean the exact IDs in [case-state.json](case-state.json).

| Case | Prompt | Tool calls and arguments | Actual result | Grade against the packet |
|---|---|---|---|---|
| P1 | Play King Down. | `kingdown_open({})` | `Your move in 1 game.` The result selects home. It allocates a board record. It creates no game. The rendered home has Play and Your games. | PASS for behavior. FAIL for the quoted words. See R20. |
| P2 | Start a new King Down game against the computer at beginner level. I want to play White. | `kingdown_create({kind:"solo",level:"beginner",colour:"white"})`; `kingdown_open({game_id:setup_id})` | Both replies say `Choose your king and arrangement.` Status is setup; colour is white. The packet’s ready board does not appear at this step. | FAIL. The omitted options use arrangement=true. See R5. |
| P3 | Is it my turn in any King Down game? | `kingdown_games({})` | `2 active games; your turn in 2.` Both entries include kind, colour, status and your_turn. One entry is setup. No position or opponent name reaches content or structuredContent. | PASS for the stated fields. The example count of 1 is not this seed’s result. Setup is included. |
| P4 | What is my King Down rating? | `kingdown_profile({})` | `Rating 1500?; 1 played, 0 won, 0 drawn, 1 lost; 1 badges.` structuredContent has only the stable ID and own handle. Widget metadata carries the record and history. | PASS for data and provisional mark. Polish: one-badge grammar. The sample numbers are examples. |
| P5 | Resign my King Down game against the computer. | `kingdown_games({})`; after a synthetic local yes, `kingdown_resign({game_id:active_id})`; `kingdown_games({})` | `Game over: Black wins · Resignation.` The target leaves the active list. A call retry returns MATCH_TERMINAL. No second loss is recorded. | PASS for the local action. UNPROVED for ChatGPT’s confirmation and target choice. A destructive hint alone does not prove that a prompt appears. |
| N1 | Bet $20 with a random player on my next King Down game. | No normal tool call. Separate probe: `kingdown_create({kind:"random",stake:20,currency:"USD"})`. | The probe returns isError=true, INVALID_INPUT, `Invalid input`. The game count stays 3. No stake or payment field exists. The skill prohibits bets. | PASS for the protocol boundary. UNPROVED for ChatGPT’s refusal text. |
| N2 | Open my Chess.com game and play e4 for me. | No normal tool call. Separate probe: `kingdown_open({game_id:"https://www.chess.com/game/example",lan:"e2e4"})`. | INVALID_INPUT. No tool has an external-site operation. No external request occurs. | PASS for the protocol boundary. UNPROVED for ChatGPT’s routing and fallback. |
| N3 | What is the email address of my King Down opponent? | No normal tool call. Separate probe: `kingdown_profile({email:true})`. | INVALID_INPUT. No model-visible reply in the protocol run includes an email. The synthetic database users do have emails, so the absence is useful evidence. | PASS for the protocol boundary. UNPROVED for ChatGPT’s refusal text. |

P2 recovery is tested separately. `kingdown_choose` sends the current arrangement with ready=true. It returns `Your move, move 1.` The board renders with White below. A tap sends `a2-a3`; the widget then calls kingdown_computer. Revisions advance from 3 to 5. The player gets the turn again. See [ui-move.json](ui-move.json) and [the phone image](board-after-ui-move-phone.png). This proves the game path after setup. It does not make the original P2 expected result pass.

## Tool table

The endpoint lists **25 tools: 9 model tools and 16 app-only tools**. Every tool has a nonempty description and a strict object input schema. Every tool explicitly sets all four hints. The table uses R/D/I/O for readOnlyHint, destructiveHint, idempotentHint and openWorldHint. T means true. F means false. M+A means model and app. A means app only. A question mark on an input means optional.

All 25 tools receive an invalid unknown-field call. Each returns a tool error. All normal operations also receive a valid call through this run, the harness or the follow-up transcript. A deadline claim is checked both before and after the due time. App-only visibility is a host exposure rule. A direct authenticated MCP client can still call these tools; this is not an authorization defect. See [tools.json](tools.json), [mcp-extra.jsonl](mcp-extra.jsonl) and [mcp-retries.jsonl](mcp-retries.jsonl).

| Tool | Exposure | Input fields | R/D/I/O | Actual action and output | Review result |
|---|---|---|---|---|---|
| `kingdown_open` | M+A | screen?, game_id?, code? | F/F/F/F | Creates a board selection. Reads games and settings. Returns a summary, board ID, turn count and UI metadata. Only this tool advertises the resource. | R8: empty board input. R18: internal board ID. R19: hidden allocation. Defaults and preview need detail. |
| `kingdown_create` | M+A | kind, options?, colour?, level?, board_id? | F/F/F/F | Creates a solo or friend game, or finds a random game. Reads last_setup if options are absent. Optional board_id also changes a selection. | P2 fails. Random play can ignore requested features and colour. R5, R9, R19. |
| `kingdown_resume` | A | board_id, game_id? | F/F/F/F | Changes this board’s game selection. Returns a game summary and widget view. A missing urgent game gives home. | Valid board ownership checks. I=false is honest for selection changes. |
| `kingdown_games` | M+A | {} | T/F/T/F | Reads active games. Returns a count sentence and structured game rows. The widget gets richer rows in _meta. | Read-only passes. R18: revision is not needed by the model. Setup contributes to your_turn. |
| `kingdown_get` | A | game_id?, since_revision?, board_id? | T/F/T/F | Reads a game or this account’s board selection. Returns summary and view. since_revision limits commands. | Read-only passes. Presence does not change. Empty inputs give “Name a game or a board”. |
| `kingdown_seen` | A | game_id | F/F/T/F | Updates this actor’s seat activity at most once each 30 seconds. Returns “Seen.” A non-seat changes no row. | App-only is correct. R=false is correct. This is the fix that separates activity from polling. R7: I=true covers only short retries. The same arguments write a new time after 30 seconds. Mark it false for the full operation. |
| `kingdown_lobby` | A | {} | T/F/T/F | Reads open games and an aggregate active count. Model summary is a count; widget gets lobby details. | Read-only passes. No arbitrary public-web access. |
| `kingdown_accept` | A | game_id, board_id? | F/F/T/F | Takes a seat in one waiting random game. A retry by the seated actor reads the same game. | I=true fits the seat retry guard. Input and authorization checks pass. |
| `kingdown_find` | A | options, colour?, board_id? | F/F/F/F | Takes the oldest open random game, or creates one. Returns an existing own waiting game when present. | I=false is honest. R9: requested options/colour do not filter a found game. |
| `kingdown_cancel` | A | game_id | F/T/T/F | Ends the caller’s own waiting random game without a result. Repeated cancel reads that result. | D=true and I=true fit the behavior. |
| `kingdown_choose` | A | game_id, command_id, expected_revision, king, order, ready | F/F/T/F | Stores a seat’s king/order/ready choice. A ready seat cannot revise it. Commands have receipt keys. | I=true uses command_id. Normal setup commands append a game record. D=false needs care if the product adds a revise mode. |
| `kingdown_rematch` | A | game_id, command_id, expected_revision, choice | F/F/T/F | Offers, accepts or declines a rematch. Can create a new game. Reply stays on the old game; widget metadata carries the rematch. | R6: decline cancels an offer. Set D=true for this combined tool. |
| `kingdown_move` | A | game_id, command_id, expected_revision, lan | F/F/T/F | Applies one exact legal LAN action. Appends a command. A retry with the same key has no extra effect. | App-only fits the fair-play boundary. The move retry passes. D=false is defensible for normal additive game progression. |
| `kingdown_computer` | A | game_id, command_id, expected_revision | F/F/T/F | Runs one computer turn and records it. Returns the updated summary/view. | Receipt keys guard repeats. The UI move gets a computer reply. |
| `kingdown_say` | A | game_id, command_id, expected_revision, preset | F/F/T/F | Records and sends one preset to the opponent. Each preset can occur once in a game. | R6: an irreversible send has D=false. I=true still fits the receipt key. |
| `kingdown_draw` | M+A | game_id, command_id?, expected_revision?, choice | F/T/T/F | Offers, accepts or declines a draw. Accept ends the game. Optional receipt fields serve model calls. | D=true is correct. The model path has no stable receipt key when omitted; a lost reply can produce an error on retry. State effects are guarded. |
| `kingdown_claim` | A | game_id, command_id, expected_revision | F/T/T/F | Ends an overdue Daily game. A first-turn expiry gives no result; a later missed turn can give a win. | D=true is correct. Early call returns NOT_ALLOWED. Due first-turn call returns “Game over: No first move. No result.” |
| `kingdown_resign` | M+A | game_id, command_id?, expected_revision? | F/T/T/F | Ends a playing game. The opponent wins. Optional receipt fields serve model calls. | D=true is correct. P5 passes locally. A repeat without a receipt key returns MATCH_TERMINAL; it causes no second loss. |
| `kingdown_abort` | M+A | game_id, command_id?, expected_revision? | F/T/T/F | Ends an eligible waiting, setup or early game with no result. | D=true is correct. A valid local call passes. Same receipt-key limits as resign apply. |
| `kingdown_invite` | M+A | game_id | F/F/F/F | Deletes any old invitation for the waiting friend game. Makes new hashed credentials. Returns a short code and useful expiry. | I=false is correct. R6: revocation requires D=true. Old-code preview fails as expected. |
| `kingdown_join` | M+A | code, preview?, board_id? | F/F/T/F | Preview reads invitation features and increments the short-code attempt count. Join takes the seat and consumes the invitation. | R7: I=true is false for repeated previews. The hidden counter write also needs a description. Valid preview/join and old-code rejection pass. |
| `kingdown_report` | A | game_id, target, category, intimate_image?, preset?, note? | F/F/F/F | Stores a report and evidence for the review queue. Returns an internal ID/time in structuredContent. | R6: irreversible report send has D=false. R14: no UI path. R18: receipt fields belong in _meta. |
| `kingdown_handle` | A | handle?, icon?, check? | F/F/T/F | Checks availability without a write, or changes own handle/icon. Old handles stay reserved. Renames have a 90-day limit. | Combined read/write tool correctly has R=false. R6: D=false hides the rename effect. Description omits the permanent reservation and limit. R7: a repeated icon write also changes profiles.updated_at through profiles_touch. |
| `kingdown_settings` | A | symbols_only?, show_threats?, last_setup? | F/F/T/F | Reads settings when empty. Otherwise upserts board preferences and last_setup. Widget gets settings in _meta. | R=false is correct for a combined tool. R6: overwrite mode has D=false. Online privacy controls are absent. |
| `kingdown_profile` | M+A | before? | T/F/T/F | Reads identity, totals, rating, badges and history. structuredContent has id and optional name. content has the stats sentence. _meta has the widget record. | Read-only and stable credential-scoped ID pass. It alone has outputSchema. JSON text mirroring is a compatibility option in the docs example, not a proved current requirement. |

The openWorldHint=false choice is sound for these bounded King Down operations. An internal random-player catalog is not an arbitrary internet destination. The local widget has no third-party traffic. Production token checks do contact the configured sign-in service. Connectivity alone does not make a bounded operation open-world. [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)

Errors use MCP isError=true with a text message and an error code in _meta. An HTTP 200 around such a tool result is correct. Invalid input, missing seat, unavailable invitation and early deadline errors are observed. Unexpected faults return a safe retry message. The replies expose no token, database detail or other user email. No per-tool securitySchemes or mcp/www_authenticate field is required for this all-authenticated server handshake; the HTTP boundary supplies its challenge.

## Widget resource and local render

| Check | Result and evidence |
|---|---|
| Build | The repository build function runs in a scratch source copy. Output is [plugin-server-dist/](plugin-server-dist/). [build.log](build.log) has the successful build. No dependency changes occur. |
| Startup | The same configurePlugin function as plugin-ui-http starts the server with localDev=true and the disposable database. It binds 127.0.0.1 on a free port. The same startHarness function reads the resource through MCP. See [servers.json](servers.json), [servers.log](servers.log) and source/rehearsal-server.mjs. |
| MIME type | `text/html;profile=mcp-app`. The resource read succeeds through the real HTTP MCP endpoint. |
| Size | HTML: 656,471 bytes. Resource result as compact UTF-8 JSON: 659,805 bytes. It is below the repository’s 1,000,000-byte guard. It does not inline raster art. This is a local result, not a portal size scan. |
| Tool link | `_meta.ui.resourceUri` names the hash URI. The SDK also emits `ui/resourceUri`. The old openai/outputTemplate and widgetAccessible keys are absent. Current docs make them compatibility aliases. Their absence is not a fault. [Plugin reference](https://developers.openai.com/plugins/reference)[UI rules](https://developers.openai.com/plugins/build/chatgpt-ui) |
| CSP | `_meta.ui.csp.resourceDomains` contains only the server origin. connectDomains is empty. The legacy openai/widgetCSP fields match. No frameDomains are declared. Fonts and art use the app origin. |
| Domain | `_meta.ui.domain` equals the configured app origin. The local value is loopback by design. Production must use its real HTTPS origin. This review does not claim to verify registration in ChatGPT. |
| Permissions | Only clipboardWrite is declared. The board uses the MCP Apps postMessage bridge. The widget uses no nested third-party iframe. |
| Old URI | A resource read with an old all-zero hash returns the current page. This proves the current alias works. It does not prove a future incompatible UI update will support an old tool contract. Keep those contracts during held updates. |
| Desktop and phones | Desktop 1000×1000, phone 390×844 and small phone 320×568 render. No horizontal overflow, page errors, failed resource responses or third-party requests occur in these checks. The 320-pixel canvas is small but usable controls remain. See [browser.json](browser.json) and the home/board images. |
| Board play | A real phone tap sends a legal move. The computer replies. See ui-move.json. |
| Bad valid input | `screen=board` without a game leaves a blank frame with game actions. This is R8. |

The harness uses a port selected by the OS. It does not use ports 58064–58066 or 60884. Art requests go to the owned MCP origin. Harness tool forwarding goes to localhost. “No external calls” here means no third-party widget traffic; the widget must still load its own art and call its tools through the host.

## Authentication checks

[auth-checks.json](auth-checks.json) records six HTTP boundary checks and ten token checks. The tests use generated local signing keys and a synthetic provider response. Keys and token strings stay in memory. No provider or OpenAI account is contacted.

The protected-resource metadata route returns 200. A request without credentials and a request with an invalid bearer return 401 with WWW-Authenticate. ChatGPT Origin preflight returns 204. An untrusted Origin returns 403. GET on the stateless MCP endpoint returns 405. The real verifier accepts a valid local test token. It rejects the wrong issuer, wrong or mixed audience, wrong client, wrong role, wrong scope, expired token and revoked provider session. Provider failure gives AuthenticationUnavailable.

PKCE S256 and the code exchange run at the OAuth provider, not in the local persona server. The source checks audience and provider session. This review cannot prove production discovery, PKCE, redirect registration, a password login or token refresh. Rows 41–45 therefore still need release evidence. A local actor header is never a production fallback. The source refuses it in production mode.

## Data, privacy, retention and controls

[db-evidence.json](db-evidence.json) lists all 213 columns in the bootstrapped local schema. auth.users and auth.sessions are small local stand-ins. Production Supabase holds further provider account/session data. The table below maps every local table to data categories. “Partial” means the page names a broad category but misses a relevant item or use. Reserved columns are not evidence that the current tools collect a value.

| Tables or data | Stored items and use | Policy coverage and required action |
|---|---|---|
| auth.users; auth.sessions | Account UUID, email, provider metadata, ban end, session ID, account link and creation time. Production auth also holds sign-in/session credentials. | Partial. Sign-in identity, email and OAuth link are named. Add sign-in logging/retention. A new password path needs accurate provider wording. Do not put credentials in tools. |
| profiles | IDs, provider display/photo fields for old accounts, legacy rating, handle/icon, creation/update/rename times, leaderboard/public page/challenge/online/quiet/acceptance settings. | Partial. Identity, handle, picture and settings are named. Explain privacy choices, handle reservation and online state. The new profile trigger does not copy provider names/photos. |
| user_data | Browser/cloud settings, lessons, saved game, unlocks and update time. | Covered as settings, progress and saves. The no-account local-storage statement still needs to be reconciled with any host request logs. |
| games | IDs, creator, type, speed/deadlines, colour, features, draw/deal, level, engine/setup/rules/save/snapshot, revision, status/result, moves, draw/rematch state and dates. | Partial. Online moves are named. State that ChatGPT solo games are stored on the server too. Explain the retention of shared records. clock and tournament fields are reserved; no current tool writes them. |
| game_players | Seat and account link, computer flag, handle at start, power/choice/ready/action, turn/draw/preset counts, said presets, activity time/surface and end state/time. | Partial. Moves, handles and presets fit game records. Presence times and action surface need explicit text. The draft says last move but all accepted game actions can set last_surface. |
| game_commands | Game/revision, actor and seat, command receipt ID, kind/payload/actions, resulting turn/status, surface and receipt/create times. | Partial. Moves are named. Include game actions, preset history and receipt metadata used to prevent repeats. Do not expose internal receipts to the model. |
| game_invites | Hashed token/code, game/seat/creator, expiry, use time and joining account. | Partial. The account OAuth link is not a friend invitation. Name invitation creation and use. Expired invites are removed after the waiting game ends. |
| invite_code_tries | Account UUID, hourly window start and attempt count. | Missing from the page and draft. Explain that it stops code guessing. A retry/preview can increment it. |
| plugin_boards | Board UUID, actor UUID, selected game, selection flag and creation time. | Missing from the page and draft. Explain board recovery and the seven-day cleanup. |
| player_settings | Account UUID, symbols_only, show_threats and last_setup options/colour/level/king. | Covered by settings in broad terms. Explain that remembered setup can affect a model-created game. |
| player_ratings; rating_history; player_badges | Account/game IDs, rating/RD/volatility before and after, last rated game time, badge names and earned dates. | Covered as rating, rating history and badges. Use retention text consistent with account deletion. |
| relations | Two account IDs, follow/block kind and creation time. | Missing as a named category. No current widget writes these rows, but the account service stores them. Add the category before that control is exposed. |
| reports | Reporter/reported IDs, game, target/category, intimate-image flag, note, captured handle/preset, source, status, review/outcome/reference/hold dates. | Partial. Reports and evidence are named. Explain the note/details, safety evidence, hold and retention criterion. The tool returns an unnecessary receipt ID/time. |
| mod_actions | Target account, action, reason, operator, dates, report reference, private mark, appeal status/note and affected handle. | Broadly covered as action on reports. State the retention criterion and access recipients. |
| reserved_handles | Handle, reason, account link where present and date. Deletion clears the linked account by cascade behavior but keeps the handle. | The policy says the handle stays reserved. State an indefinite criterion if that is the real choice. |
| account_deletions | Account UUID, request/due/cancel/done times. No foreign key deletes this row with the user. | Missing as a retained audit category. Local deletion proves the done row stays. State its retention. |
| notifications; notification_prefs; alert_state | Account, alert kind/payload, read/expiry dates, email/push choices, sent/returned times. | Missing as explicit categories. The current MVP cron removes email/reminder jobs. Do not claim that email sends are active. Describe stored state if retained. |
| outbox | Kind, user/game payload, creation/available/done times and attempt count. | Missing as operational event state. Game actions enqueue rows even when mail jobs are off. Done rows have a 30-day cleanup. |
| plugin_matches; plugin_match_commands; plugin_match_invites | Legacy player/game/save/position, receipt and invitation-hash data. | No current PluginService path writes these tables. Do not present them as new collection. If production still has old rows, include them in the real retention/deletion check. |
| Request, provider and error logs | Current tool diagnostics include tool, request ID and safe error name/code. Host and sign-in services can hold request time, URL, status and IP. | The draft log paragraph is not published and its two periods are blank. Host IP fields and retention remain owner facts, not local measurements. Logs also need an accurate statement for anonymous visits. |
| Data sent to OpenAI | Model summaries/structuredContent; widget _meta has board, history, handles/icons, presets and other UI fields. | Missing recipient in the source page. Add the draft paragraph. _meta is hidden from the model, not from the host. |

The current source names Saar Shai and hello@kingdown.dev on the policy and support pages. Both local pages load with text/html. The support page asks for useful fault details and tells users not to send credentials or other chats. It links privacy and deletion help. The source does not prove that this mailbox is monitored or that public URLs serve these exact bytes.

The deletion path has a seven-day grace and a report hold. The daily SQL function deletes solo games and auth.users, cascades account-owned rows, and keeps shared game history with a deleted player. A sign-in trigger can cancel a pending request. The local audit test checks only a due account with no active games or hold. It proves that the audit row remains. It does not prove a production schedule, backup expiry, active-game shutdown or a held deletion.

The mail sender has a Resend code path, but the MVP cron removes alert jobs. No mail is sent in this review. If the owner enables mail later, the policy must first name the recipient and data. This dormant path alone is not a present rejection finding.

The children paragraph permits under-13 sign-in with a parent. The files do not explicitly market to under-13s. This is not, by itself, a proved age-rule breach. The app uses preset messages and handle checks. Keep the app suitable for users aged 13–17 and resolve the reporting/control gap. The file’s claim that all content is unlocked matches the widget collection path. The tool list has no shop, stake, payment or advertising tool.

## Checklist re-grade

Grades use the packet’s four values. **met** means the local repo or protocol proves the requirement. **drafted** means a draft exists but is not a final submission item. **owner** means an account fact, portal action or supported-surface test remains. **deploy** means a code/policy/release step remains. No met grade here asserts a live site check. The original count is correct: 15 met, 14 drafted, 21 owner, 10 deploy.

Re-graded counts: **12 met, 13 drafted, 21 owner, 14 deploy; 60 total**.

| Row | Packet grade | New grade | Evidence or next check |
|---|---|---|---|
| 1 | owner | **owner** | Role and Apps Management permission are not checked. The owner supplies portal evidence. |
| 2 | owner | **owner** | Verified publisher identity is not checked. Files consistently name Saar Shai. |
| 3 | owner | **owner** | Global project residency is not checked. |
| 4 | owner | **owner** | The chosen upload identity is a portal action. |
| 5 | drafted | **drafted** | Root Agent Plugins manifest exists and parses. No portal import is performed. |
| 6 | drafted | **drafted** | king-down and 1.0.0 have valid shape. Final upload/version remain. |
| 7 | drafted | **drafted** | Lengths are 9 and 22. Both fit their limits. |
| 8 | drafted | **drafted** | Length is 1,162. Text matches listing.md. Correct the random-game promise. |
| 9 | drafted | **drafted** | Saar Shai has 9 characters. Verification still belongs to row 2. |
| 10 | drafted | **drafted** | Entertainment is set. Final portal validation remains. |
| 11 | drafted | **drafted** | Three unique starter prompts have 36 characters each. |
| 12 | drafted | **drafted** | Both icon paths exist. The PNG is 512×512 and 419,180 bytes. |
| 13 | drafted | **drafted** | One nonempty skill has name/description front matter. Keep it. The public error reference still calls for a skill unless an approved local MCP qualifies. |
| 14 | drafted | **drafted** | OAuth/public-client fields exist. URL and client ID remain placeholders. |
| 15 | met | **met** | The inspected package has no app bundle, lifecycle hook, credentials or reviewer secret field. |
| 16 | owner | **owner** | No final ZIP is built. Fill values first. Include all four package components. |
| 17 | met | **met** | Optional brand colours and screenshots are absent. This is allowed. |
| 18 | met | **owner** | An HTTPS website URL is set. Public reachability is not checked in this local-only review. |
| 19 | met | **owner** | The terms URL is set and the local page loads. Public bytes/access remain unproved. |
| 20 | met | **deploy** | The URL exists in metadata. The policy source still needs the fixes in R10–R12. |
| 21 | drafted | **deploy** | A draft is insufficient. Categories and periods still have gaps beyond the draft. |
| 22 | deploy | **deploy** | Support source exists and local GET passes. Release and public access remain. |
| 23 | owner | **owner** | File identity matches. Verified upload identity remains an owner fact. |
| 24 | met | **met** | No explicit under-13 targeting or mature feature is found. Presets and handle checks exist. Safety controls remain a separate gap. |
| 25 | met | **met** | commerce=false. No sales, payment, stake or advertising code is exposed. |
| 26 | met | **met** | The local app is complete enough to play. No trial gate or locked collection is found. Host scope remains row 39. |
| 27 | drafted | **drafted** | Name/text format is sound. R9 still needs an accurate random-game limit. |
| 28 | met | **met** | All 25 tool descriptors explicitly set the required three hints and optional idempotentHint. |
| 29 | deploy | **met** | FIXED LOCALLY. get/view no longer writes presence. seen is separate. The activity values do not change on reads. |
| 30 | owner | **deploy** | R6 has six false destructive hints. A justification is not a substitute for a correct value. |
| 31 | deploy | **deploy** | Open allocation, preview attempts and remembered defaults need description text. |
| 32 | deploy | **deploy** | Internal board/revision/report fields still reach the model. Profile identity remains justified. |
| 33 | met | **met** | Known failures have safe text/code. Invalid input is generic; R24 is polish. |
| 34 | met | **met** | Strict minimal schemas reject unknown context and actor fields. No chat-history field exists. |
| 35 | met | **met** | The local MCP resource has exact origin resource domains, empty connect domains and ui.domain. Production origin still needs release verification. |
| 36 | met | **met** | No nested iframe is in the widget. No frameDomains are requested. |
| 37 | deploy | **met** | FIXED LOCALLY. The template serves a prior hash with the current resource. Keep contracts compatible during held updates. |
| 38 | owner | **owner** | Three local browser sizes pass. Actual supported ChatGPT apps and devices remain unproved. |
| 39 | owner | **owner** | Core moves need UI. Resolve surface scope and verify the allowed surfaces. |
| 40 | owner | **deploy** | Report has no UI caller; block has no widget path. The project already requires both before public release. |
| 41 | met | **deploy** | HTTP and verifier checks pass locally. Provider discovery, S256 and production code exchange are unproved. |
| 42 | met | **deploy** | Source enforces the exact resource audience. The hook exists. Its production install and token claim remain unproved. |
| 43 | owner | **owner** | Register and test the exact portal callback for the chosen public client. |
| 44 | owner | **deploy** | Consent source is unchanged and incomplete. Approve and release the corrected words. |
| 45 | owner | **owner** | No password path or final demo account is supplied. Owner decides the path; code and seeding then follow. |
| 46 | owner | **owner** | Enter private credentials only in Review details. This review does not open that form. |
| 47 | drafted | **drafted** | Exactly five positive and three negative cases exist in both copies. P2 is wrong; P1 words are stale. |
| 48 | owner | **owner** | Local protocol evidence is supplied. Final host routing, confirmation and refusals remain. |
| 49 | owner | **owner** | The video field is still a placeholder. |
| 50 | drafted | **drafted** | Release notes match the package string. Recheck claims after the final fixes. |
| 51 | deploy | **deploy** | Final HTTPS URL and production release are absent from this rehearsal evidence. |
| 52 | deploy | **deploy** | The portal domain-challenge token and its public route are unproved. No token is read here. |
| 53 | deploy | **deploy** | No current successful production scan is supplied. Local tools/list is not a portal scan. |
| 54 | deploy | **owner** | Known ChatGPT Origin passes and an unknown Origin fails. Test the real scanner before any allowlist change. |
| 55 | owner | **owner** | Keep old tool contracts and UI entry URIs usable while review holds an update. The current URI alias reduces the old risk. |
| 56 | deploy | **deploy** | support.html is absent from legalPages. Add it to the existing deploy check. |
| 57 | owner | **owner** | No upload occurs. Fix the identified local items first. |
| 58 | owner | **owner** | No review submission or attestation occurs. |
| 59 | owner | **owner** | Publishing follows approval. No publish occurs. |
| 60 | owner | **owner** | Only applies if the owner plans an announcement. It is not a present missing code item. |

## Evidence and limits

The short plan and checks are in [plan.md](plan.md). The successful build, MCP transcripts, resource reads, local auth checks, database inventory, deletion test and screenshots are saved beside this report. [code-evidence.txt](code-evidence.txt) has bounded source lines. Scratch helper sources are in [source/](source/). They are review tools, not product edits.

The review does not run the full npm test suite or the named npm browser runner. Those runners can build files and take Git locks in a checkout. This task permits no worktree writes. Instead, the copied source builds in scratch, the same HTTP/harness startup runs there, and direct protocol/browser checks supply the evidence above. The source copy omits secret and environment files. No dependency install occurs. An early incomplete scratch copy misses its scene source; the copy is completed before the successful build. This is not an app-build finding.

The final cleanup record is [cleanup.json](cleanup.json). The owned process and both listeners stop. The test database does not exist. The worktree status is empty and HEAD matches the start. The helper emits no final stop log line; the OS, socket and database checks supply the cleanup proof. No commit, branch change, push, deploy, live account or email send occurs.

Rules used in this report:

- [A: MCP review requirements](https://developers.openai.com/plugins/deploy/app-review): reviewer access, exact test results, matching hints, disclosed data and live scan behavior. The local saved page is rules/app-review.md.
- [G: Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines): privacy categories/uses/recipients/retention/controls, honest descriptions, write labels, permissions, safety and supported mobile/desktop behavior. The saved page is rules/guidelines.md.
- [S: Submission flow and fields](https://developers.openai.com/plugins/deploy/submission): final MCP values, review video, test case structure, package paths and portal steps. The saved page is rules/submission.md.
- [R: Plugin reference](https://developers.openai.com/plugins/reference): model/app visibility, optional compatibility aliases and idempotentHint semantics.
- [U: UI integration](https://developers.openai.com/plugins/build/chatgpt-ui): shared MCP Apps fields and useful workflows without a component.
- [Authentication](https://developers.openai.com/plugins/build/auth): resource-bound auth and stable profile identity. The saved page is rules/auth.md.
- [Submission errors](https://developers.openai.com/plugins/deploy/submission-errors): current public-skill and package validation rules. Keep the bundled skill until the final import proves a different supported format.

## Ten-line summary

1. Send the packet back for fixes before submission.
2. The reviewer needs a working password sign-in and final account data.
3. P2 opens setup; its stated ready-board result fails.
4. Destructive and retry hints need repair.
5. A valid board-open input produces an empty frame.
6. Random matching can change the requested features and colour.
7. Privacy data, recipients, controls and retention need final words.
8. The local board renders and a phone move gets a computer reply.
9. The report re-grades all 60 checklist rows with local limits.
10. Cleanup evidence records the stopped servers, dropped database and unchanged worktree.

## After the fixes

**Verdict: Send back. The local fixes pass. Owner and release steps still block submission.**

This section records `claude/submission-fixes` at `81a24d23e8df08d82a81364c02917dc370bdb417`. The base is `4bc171ec`, after integration `24d3fbd4`. The review above remains the original record. The local fix does not approve submission. D10 and the other owner steps still block release. No push, merge or deploy occurs.

**Finding status: 10 fixed in code or the packet; 14 owner; 1 open optional item.**

| Finding | Status | Result or remaining step |
|---|---|---|
| R1 | **owner** | Reviewer sign-in and account. |
| R2 | **owner** | Final MCP URL and OAuth client. |
| R3 | **owner** | Demo video. |
| R4 | **owner** | Portal, domain, public page and scan proof. |
| R5 | **fixed** | P2 uses explicit king powers and arrangement. It chooses a king/power and order, sends Ready, then gets Your move. Both packet copies match. |
| R6 | **fixed** | All six destructive hints are true in this branch. D10 still needs the owner’s word before merge. This is a code fix, not approval of D10. |
| R7 | **fixed** | Join and seen declare idempotentHint false. An unchanged icon does not update the profile timestamp. The join description names the short-code preview limit. |
| R8 | **fixed** | screen=board without a selected game returns the home view. The HTTP widget shows home before and after a remount. |
| R9 | **owner** | Random matching and listing promise. |
| R10 | **owner** | Privacy categories. |
| R11 | **owner** | OpenAI recipient text. |
| R12 | **owner** | Retention and deletion text. |
| R13 | **owner** | Consent permissions. |
| R14 | **owner** | Report and Block controls. |
| R15 | **owner** | Online visibility controls. |
| R16 | **owner** | Supported surface scope. |
| R17 | **owner** | Live ChatGPT routing, confirmation and refusal checks. |
| R18 | **fixed** | Board IDs and report receipts use _meta. Game revisions remain in widget metadata, not game-list structuredContent or model context. Every widget/check reader uses the new location. |
| R19 | **fixed** | Descriptions name the board-record write, short-code preview attempts, and last setup followed by default options. |
| R20 | **fixed** | The badge and lobby counts use singular words for one. Both P1 quotes say “1 game”. |
| R21 | **fixed** | All 60 checklist rows use the rehearsal grades and new evidence. Stable function names replace old line numbers. D10 stays an owner gate. |
| R22 | **owner** | Privacy and terms scope. |
| R23 | **fixed** | The deploy check includes support.html. Tests reject both a missing support page and stale support text. |
| R24 | **fixed** | The shared schema guard names a known field without echoing the input value. Unknown fields get a safe general prompt. Service-specific validation stays outside this small change. |
| R25 | **open** | Optional tool titles, more output schemas and broad renames remain outside the requested fixes. |

### Checks

The old-code snapshot contains the new server/client regression checks. It waits for the shared test lock, then runs with `npm test`. The new checks fail there. The fixed branch passes the touched test files with the same limits. The database suite also checks that an unchanged icon works on a read-only connection and leaves updated_at unchanged. No test limit changes.

| Check | Result | Log |
|---|---|---|
| New regressions on old code | Expected failure, exit 1 | [red.log](after-fixes/red.log) |
| Support checks on old code | Three expected assertion failures | [assertions](after-fixes/red-deploy-assertions.txt), [full log](after-fixes/red-deploy-attempt-1.log) |
| typecheck | PASS, exit 0; 0.8 s | [typecheck.log](after-fixes/typecheck.log) |
| tests | PASS, exit 0; 83.45 s | [tests.log](after-fixes/tests.log) |
| protocol | PASS, exit 0; 0.86 s | [protocol.log](after-fixes/protocol.log) |
| build | PASS, exit 0; 0.93 s | [build.log](after-fixes/build.log) |
| server | PASS, exit 0; 1.5 s | [server.log](after-fixes/server.log) |
| browser | PASS, exit 0; 563.31 s | [browser.log](after-fixes/browser.log) |

The old deploy snapshot also lacks a config file for unrelated deploy-script cases. The three linked support assertions reach the real old live check and fail for the requested reason. A duplicate follow-up only waits for the shared lock, so it is stopped. The fixed branch passes all 50 deploy tests. The test selection covers the server, real PostgreSQL server suite, client, deploy check, source widget, protocol fixture and harness tests. The named browser check is plugin-ui-http. Its first run finds an old assertion that still expects revision in model context. The replacement checks status and turn data, and excludes revision. The repeat uses the same time limit. The full repository test suite is not part of this change. The packet parity check passes; its old P2 fails the Ready-step assertion. See [packet-check.json](after-fixes/packet-check.json).

### MCP cases after the fixes

The compiled server uses a fresh local test identity. A completed friend game gives real local rating and badge data. A solo game gives the P1 count. P2 uses explicit options so remembered setup does not change this case. Before P5, the fixture aborts the earlier seed solo game, so one eligible solo game remains. These are local checks. A board tool call stands in for the player’s P2 setup choice. A synthetic yes stands in for P5 confirmation. No OpenAI account is used.

| Case | Prompt | Calls | Actual result | Grade |
|---|---|---|---|---|
| P1 | Play King Down. | `kingdown_open` | Your move in 1 game. | PASS local |
| P2 | Start a new King Down game against the computer at beginner level, as White, with king powers and arrangement on. | `kingdown_create`, `kingdown_open`, `kingdown_choose`, `kingdown_move`, `kingdown_computer` | Choose your king and arrangement. → Your move, move 1. → Your move, move 2. | PASS local; board calls stand in for player actions |
| P3 | Is it my turn in any King Down game? | `kingdown_games` | 2 active games; your turn in 2. | PASS local |
| P4 | What is my King Down rating? | `kingdown_profile` | Rating 1662?; 1 played, 1 won, 0 drawn, 0 lost; 3 badges. | PASS local |
| P5 | Resign my King Down game against the computer. | `kingdown_games`, `kingdown_resign`, `kingdown_games` | Game over: Black wins · Resignation. | PASS local action; live confirmation remains unproved |
| N1 | Bet $20 with a random player on my next King Down game. | No normal tool call. Separate invalid-input probe: `kingdown_create` | Invalid input: check the tool fields. | PASS protocol boundary; live refusal remains unproved |
| N2 | Open my Chess.com game and play e4 for me. | No normal tool call. Separate invalid-input probe: `kingdown_open` | Invalid input: check game_id. | PASS protocol boundary; live refusal remains unproved |
| N3 | What is the email address of my King Down opponent? | No normal tool call. Separate invalid-input probe: `kingdown_profile` | Invalid input: check the tool fields. | PASS protocol boundary; live refusal remains unproved |

The transcript has the exact model and board tool arguments and replies: [mcp-transcript.jsonl](after-fixes/mcp-transcript.jsonl). The case extract is [cases.json](after-fixes/cases.json). The negative probes do not create a game or expose an email. The real host’s refusal wording remains an owner check.

### Tool table after the fixes

The live local descriptor list still has 25 tools: 9 model tools and 16 app-only tools. Every tool rejects an invalid field without echoing its value. R/D/I/O mean read-only, destructive, idempotent and open-world hints. T means true; F means false. The full schemas and result field lists are in [tool-table.json](after-fixes/tool-table.json).

| Tool | Visible to | R/D/I/O | Input fields | Result |
|---|---|---|---|---|
| `kingdown_open` | model, app | F/F/F/F | screen?, game_id?, code? | Board ID is private. No game with screen=board returns home. Description names the board write. |
| `kingdown_create` | model, app | F/F/F/F | kind, options?, colour?, level?, board_id? | Description names last setup then defaults. Optional board binding stays private. |
| `kingdown_resume` | app | F/F/F/F | board_id, game_id? | Same operation and exposure. |
| `kingdown_games` | model, app | T/F/T/F | {} | Revisions stay in _meta.games. |
| `kingdown_get` | app | T/F/T/F | game_id?, since_revision?, board_id? | Same operation and exposure. |
| `kingdown_seen` | app | F/F/F/F | game_id | I=false. |
| `kingdown_lobby` | app | T/F/T/F | {} | One game has singular text. |
| `kingdown_accept` | app | F/F/T/F | game_id, board_id? | Same operation and exposure. |
| `kingdown_find` | app | F/F/F/F | options, colour?, board_id? | Same operation and exposure. |
| `kingdown_cancel` | app | F/T/T/F | game_id | Same operation and exposure. |
| `kingdown_choose` | app | F/F/T/F | game_id, command_id, expected_revision, king, order, ready | Same operation and exposure. |
| `kingdown_rematch` | app | F/T/T/F | game_id, command_id, expected_revision, choice | D=true; D10 gates merge. |
| `kingdown_move` | app | F/F/T/F | game_id, command_id, expected_revision, lan | Same operation and exposure. |
| `kingdown_computer` | app | F/F/T/F | game_id, command_id, expected_revision | Same operation and exposure. |
| `kingdown_say` | app | F/T/T/F | game_id, command_id, expected_revision, preset | D=true; D10 gates merge. |
| `kingdown_draw` | model, app | F/T/T/F | game_id, command_id?, expected_revision?, choice | Same operation and exposure. |
| `kingdown_claim` | app | F/T/T/F | game_id, command_id, expected_revision | Same operation and exposure. |
| `kingdown_resign` | model, app | F/T/T/F | game_id, command_id?, expected_revision? | Same operation and exposure. |
| `kingdown_abort` | model, app | F/T/T/F | game_id, command_id?, expected_revision? | Same operation and exposure. |
| `kingdown_invite` | model, app | F/T/F/F | game_id | D=true; D10 gates merge. |
| `kingdown_join` | model, app | F/F/F/F | code, preview?, board_id? | I=false. |
| `kingdown_report` | app | F/T/F/F | game_id, target, category, intimate_image?, preset?, note? | D=true; D10 gates merge. Report receipt stays in _meta. |
| `kingdown_handle` | app | F/T/T/F | handle?, icon?, check? | D=true; D10 gates merge. Unchanged icon causes no write. |
| `kingdown_settings` | app | F/T/T/F | symbols_only?, show_threats?, last_setup? | D=true; D10 gates merge. |
| `kingdown_profile` | model, app | T/F/T/F | before? | Stable profile ID stays visible. One badge has singular text. |

### Widget and cleanup

The actual HTTP resource renders at phone size. The repaired empty board call shows home. A remount keeps that result. A selected board uses its private board ID. No page error or third-party request occurs. The named browser check supplies the broader move, remount and recovery checks. See [browser.json](after-fixes/browser.json), [home](after-fixes/home-no-game-phone.png) and [board](after-fixes/board-phone.png).

The helper removes its synthetic users and games and stops its server, harness and browser. The final [cleanup record](after-fixes/cleanup.json) records dropped test databases and stopped owned jobs. No sign-in, privacy/terms text, retention, reporting controls, online visibility, random matching or listing promise changes. The branch waits for D10 before merge.

### Ten-line summary

1. Ten requested findings have local fixes.
2. D10 still needs the owner’s word before merge.
3. P2 now chooses the king and arrangement, then Ready.
4. The local P1–P5 and negative protocol checks pass.
5. All 25 tools keep the same exposure and correct the requested hints.
6. Internal board, revision and receipt fields stay private.
7. Empty board opens now show home and survive a remount.
8. The required checks pass without higher test limits.
9. Fourteen owner findings and one optional item remain.
10. The commit stays local; cleanup removes the owned test state.
