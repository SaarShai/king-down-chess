The web app can use much of the plugin work, but a merge does not connect the two user interfaces. The shared board, rule text, engine, and account deletion path change with PR 61. Most new screens need a web port. The first-submission cut also has useful work on separate branches: the hall, direct card use, board controls, game previews, and the seat reveal. Some cut work, such as the new end screen and Any rules, is now in the release branch. Later owner answers settle many questions that old tickets still show as open. The web plan must keep these answers, keep local play, and ask for approval on new design choices. This survey reads source and records only. It runs no tests, browser checks, games, or live requests.

Source key: **R** means `claude/release-candidate` at `682e58bd47e38aa1e571deb17afb64f3183149a1`. **M** means `main` at `38a6bbffb3b85f10bb9e6d23e8e1f394b781b4f4`. A path with R or M gives line numbers in that Git version. **P** means `/private/tmp/claude-501/-Users-za-Documents-king-down-chess/b7cd01b9-9824-4854-8a44-29f55a926d5b/scratchpad/`. **Memory** means `/Users/za/.claude/projects/-Users-za-Documents-king-down-chess/memory/`. S means one small port or correction. M means a screen or a connected flow. L means several flows, server work, or a new system. Sizes include the web work; they are estimates from source, not measured build times. For no-gap items, S means a small plan or review check, with no feature build. Dependencies use this lane's DEC ids.

The source order matters. `P/decisions-full.md` and the saved decision rows preserve the first answers. Later answers in `P/tickets/spec.md:191–206,299,309–310` change or complete them. The `pick` field in an approval item is a recommendation; it is not proof of owner approval. The saved approval page reads remote data, so its local HTML does not prove the current open list. Current remote answers are **unverified**. The report marks this limit where it matters. During the survey, the release branch advances to `442c5eb3840164b05d579c03b9fce2a9136d31f9`. The delta changes the queued handle-return path, its test, and ticket 47. The report keeps the requested `682e58bd` snapshot; this delta does not add a surveyed web feature.

## (a) Shared code: PR 61 supplies it

### DEC-01 — One set of piece and turn words

- **Kind:** (a). **Today:** The web uses `readText`, `contextLine`, `describeMove`, and the turn helpers. It says Tap in several places and gives a shortened pawn tip.
- **Decision and evidence:** B4 a says Select. F2 says that rule text must match the game. R `src/read.ts:152–178,208–230,282–290`; `src/context-line.ts:23–49`; `src/turn.ts:58–84`; `src/move-text.ts:85–104`. Web use: M `src/screen/play.ts:18,258`; R `docs/specs/owner-decisions-2026-10-15/issues/02-home.md:27–31`.
- **Work:** S; no web port for these callers. New helpers such as `teachNote` do not run on the web until connected in DEC-20.
- **Dependencies:** PR 61. **Risk:** Changed text can break selectors or exceed short rows. **Taste:** The words have approval. A new wording choice needs the owner.

### DEC-02 — Board load, quiet idle, and reduced motion

- **Kind:** (a). **Today:** The web makes `PaintedView` and uses its shared scene. PR 61 changes that same path.
- **Evidence:** M `src/main.ts:69,188`; R `src/render/PaintedView.ts:1,92–97,137–153,172–184`; R `docs/2d-first-pieces/board/scene.mjs:602–605,720–734,862–883`. The scene ends passive effects five seconds after a change. Reduced motion uses a slide and fade and suppresses shake.
- **Work:** S; no web connection work. **Dependencies:** PR 61. **Risk:** The board first appears later; `ready()` needs a paint frame. Resting effects stop after the idle period. These changes affect the web too. **Taste:** The fault fixes need no new choice. A different idle or motion policy needs approval.

### DEC-03 — Coordinate limits and the drag gate

- **Kind:** (a). **Today:** The web already uses the painted board with `webInk: true`.
- **Evidence:** M `src/main.ts:69`; R `src/render/board-ink.ts:15–19`; `src/render/PaintedView.ts:47–50,202–214,306–310`. Coordinates stay in the frame and hide when their size falls below 8 CSS pixels. `canDrag` defaults to true.
- **Work:** S; no web port for coordinate limits. **Dependencies:** PR 61. **Risk:** Labels disappear on very small web boards. The plugin's scroll policy does not arrive with the drag helper: its `pan-y` rules are in R `src/plugin/app.css:169–170`. **Taste:** A new web drag or zoom policy needs approval; a broken touch path has one right fix.

### DEC-04 — Shared table and coin CSS

- **Kind:** (a). **Today:** The web imports `src/style.css` and `src/ui/table.css`.
- **Evidence:** M `src/main.ts:1,14`; diff M..R in `src/ui/table.css:4–10,106–119` and `src/style.css:184–187,501–505`. The table permits variable strip rows and growing context height. Disabled coins keep their face instead of the general disabled-button fill.
- **Work:** S; no web port. **Dependencies:** PR 61. **Risk:** Short web screens and disabled power coins can look different. The plugin's full stone-control design does not come from these changes. **Taste:** Keep the approved correction. Other layout changes need a sample.

### DEC-05 — Real chess exists in the shared engine

- **Kind:** (a), capability only. **Today:** The web's Chess choice supplies the normal army; it does not set `classicChess`.
- **Evidence:** R `docs/specs/chatgpt-mvp/spec.md:37–38,147`; R `src/rules/setup.ts:71–83,107–111,168–207,241–246`; M `src/main.ts:133`; M `src/new-game.ts:205–210`. R `src/match/setup.ts:87–91` sets the flag for plugin Classic games.
- **Work:** S for the shared capability; the web switch is DEC-08. **Dependencies:** PR 61. **Risk:** FEN, move notation, hashes, and search change in shared code even with the feature off. Old web saves need checks. **Taste:** The Classic rule set has approval. Turning the existing web Chess choice into Classic needs clear web scope approval.

### DEC-06 — Seven-day account deletion notice

- **Kind:** (a), with a service setup dependency. **Today:** Settings has account deletion. Its current text says the account is deleted at once.
- **Evidence:** M `src/account/account.ts:132–136`; diff M..R `src/account/account.ts:135` and `src/account/client.ts:34`. R `src/account/profile.ts:34–35`; `src/online/jobs.ts:117–139`. The new path has a seven-day grace and sign-in cancellation.
- **Work:** S for web code; service and database setup must match. **Dependencies:** DEC-07. **Risk:** A source merge alone cannot prove that the live deletion job or session trigger exists. **Taste:** The established policy carries over; a new retention or deletion policy needs the owner.

### DEC-07 — One account pool and one game write path

- **Kind:** (a), unused by the web game screen today. **Decision:** Q2 keeps one pool for both surfaces. The game service remains the one game write path.
- **Evidence:** R `docs/specs/chatgpt-mvp/spec.md:32,140–154`; `src/api/http.ts:67–94`; `src/match/service.ts:294–340,435`; `src/account/profile.ts:1–4`. The web entry imports the local game flow, not the online client: M `src/main.ts:18,89–92,196`.
- **Work:** S for shared code arrival; L to expose the full feature set through DEC-30. **Dependencies:** Database migrations, runtime grants, engine archive, jobs. **Risk:** A merge gives shared server code, not online web screens or a configured live service. **Taste:** Keep the common account and pool. Do not make a separate web account system.

## (b) Plugin code that the web can reuse

### DEC-08 — Five game switches and private seat setup

- **Kind:** (b). **Today:** The web has computer, powers, and two-player modes, army choices, and a king picker. It has no equivalent five-switch setup or hidden Ready step.
- **Decision and evidence:** Q5–Q8, Q26–Q27: same drawn army, pool of at least seven, opposite-colour bishops, guard beside king, hidden orders, Ready, and a three-day setup limit. R `src/match/setup.ts:20–91`; `src/plugin/screens/setup-model.ts:5–24,32–67`; `src/plugin/screens/seat.ts:38–72`. M `src/new-game.ts:26–61,127–169`.
- **Lift:** Pure setup functions, validation, and seat controls. Replace MCP Choose and widget state with web state or DEC-30. Keep same-device play as its own path.
- **Work:** M locally; L with online setup. **Dependencies:** DEC-05, DEC-09, DEC-30. **Risk:** A hidden order must not reach the other seat. **Taste:** The game choices have approval; their web layout needs a sample.

### DEC-09 — King choice and card compatibility

- **Kind:** (b). **Today:** Each web side can choose No power. The plugin requires a power when the power switch is on.
- **Decision and evidence:** Q9/Q19: six kings, two powers, same king allowed on both sides, Spirit/Mercy and Shadow/Darkness defaults; only always-on powers with cards. R `src/match/setup.ts:52–83`; `src/plugin/screens/setup-model.ts:53–67`; M `src/new-game.ts:28,58–61,134–151`.
- **Lift:** `availablePowers`, `cleanKing`, default choices, and picker rules. Replace host calls with web state.
- **Work:** S after DEC-08. **Dependencies:** DEC-08, DEC-10. **Risk:** Removing No power from all web modes changes an existing owner choice; do not infer that scope from the plugin. **Taste:** Ask for the web rule where it differs. C2 samples are DEC-39.

### DEC-10 — Four-card setup, art, and public names

- **Kind:** (b). **Today:** The web setup has no Cards field: M `src/new-game.ts:30–42`.
- **Decision and evidence:** Q20–Q22, C3 b, D4 a, L1 a, W10 a: 21-card pool; the same four cards for both sides; each side spends its own card; Pick four or Use all cards; validate at Done; 2 × 2 faces with name, rule, and cost; Mirror and Morph as public names. R `src/match/setup.ts:13–16,36–48`; `src/plugin/screens/setup.ts:75,122–155`; `src/powers-ui.ts:13–20`; owner ticket `docs/specs/owner-decisions/issues/07-cards.md:140–150` corrects early build faults.
- **Lift:** Setup card sheet, `card-face`, name and cost helpers. The sheet uses widget save and MCP settings; replace those edges.
- **Work:** M. **Dependencies:** DEC-08, DEC-09. **Risk:** Random-deal examples must not look like the promised hand. Nine faces use plain names. **Taste:** Choices have approval; new art or changed web layout needs approval.

### DEC-11 — Direct card use remains outside the release branch

- **Kind:** (b), separate branch. **Today:** The web has power coins but no four-card game flow.
- **Decision and evidence:** J6 a and L1 a require select coin, then target; show cost, targets, rule, and an effect line. R `src/plugin/screens/board.ts:258–279,305–315` still opens a Use sheet and puts letters on missing faces. The lift exists on `claude/od-board` at `b3b52a47`: `src/plugin/screens/board.ts:240–256,288–294,366–371`. It uses `cardCost`, `cardArt`, and direct arming.
- **Lift:** The small input and face functions, not that branch's old whole board file. Replace MCP turn send and widget state.
- **Work:** M. **Dependencies:** DEC-10, DEC-21, DEC-45. **Risk:** Old branch code predates the new client state. Keep R's later race fixes and G1 target-first text. **Taste:** The input choice has approval. New rule costs remain DEC-38.

### DEC-12 — A fast computer start

- **Kind:** (b), with a spec/code difference. **Today:** The web already has a first Beginner deal; its ordinary New game default is Club.
- **Evidence:** M `src/ui/title.ts:14–18`; `src/new-game.ts:49–53`. D2 a says Beginner first, then the last level; P `decisions-full.md:296–301`. R `src/plugin/screens/setup-model.ts:27–30` always sets Beginner and turns Arrangement off.
- **Lift:** The quick-start path and separate saved custom setup. Replace `kingdown_create` with a local start or DEC-30.
- **Work:** S. **Dependencies:** DEC-08. **Risk:** A direct copy loses the saved level. Preserve the distinction between a quick start and custom choices. **Taste:** Fix the clear spec/code difference; ask only if the desired web default differs.

### DEC-13 — One hall, presets, and word chips

- **Kind:** (b), first-submission cut. **Today:** The web has a home screen and a New game dialog. R has a basic combined Play hall, but not the full later hall.
- **Evidence:** R `src/plugin/index.html:38–43`; M `src/main.ts:80–87,122–147`. `claude/od-home` at `06c746b0`, `src/plugin/screens/setup.ts:55–74,85–100` has presets, chips, and More options. P `tickets/spec.md:191–206` records J1 a, D3 a, W1 a, C1 a and H1/H2/H3/H5/H6 answers.
- **Lift:** The hall structure, King Down/Classic/All features presets, icon-and-word chips, and one options chest. Replace tool calls and widget saves. Keep the current state system.
- **Work:** M. **Dependencies:** DEC-08, DEC-10, DEC-30 for online rows. **Risk:** The old branch stores a draft under an old client contract. **Taste:** These choices have approval. The web sample and the busy pulse still need approval.

### DEC-14 — Pitch, Resume, game counts, and next game

- **Kind:** (b). **Today:** The web offers Continue and New game for one local save.
- **Evidence:** M `index.html:38–39`; `src/ui/home.ts:35–37`. W2 supplies the exact pitch: “Chess, the way it was never meant to be played.” J10 puts Your games (N) beside Resume and prefers a ready human game. R `src/plugin/index.html:34`; `src/plugin/app.ts:585–625`; `docs/specs/owner-decisions-2026-10-15/issues/02-home.md:9–19,53–60`. K2 uses two lines in one accessible Resume button: R `docs/specs/chatgpt-mvp/issues/37-k-picks.md:26–32`.
- **Lift:** Labels, selection helper, empty states, and Next game. Replace host entry and MCP resume.
- **Work:** S for pitch; M for multiple games. **Dependencies:** DEC-17, DEC-30. **Risk:** Do not pick a computer game ahead of a waiting person. Y1 remains a taste question. **Taste:** Existing picks stand; new web home layout needs a sample.

### DEC-15 — Friend invite and join preview

- **Kind:** (b). **Today:** The web shares a URL with the whole local game. It has no server seat invitation.
- **Evidence:** M `src/screen/links.ts:9–23,50–65`. Q28/J5 a now mean Share first, Copy beside it, full invitation with rule names, explicit side before Join, seven-day code, and visible expiry. R `src/plugin/invite.ts:4–20`; `src/plugin/index.html:44–49`; `src/match/service.ts:355–384`; R spec `:60`.
- **Lift:** Share/copy fallback, invite text, preview, expiry, and seat words. Replace the “say this in ChatGPT” route with a web join URL.
- **Work:** M. **Dependencies:** DEC-30, DEC-31. **Risk:** Reopening must not create a new code. A real cancellation of Share returns without copy in current code. **Taste:** Flow has approval; web link wording needs a sample.

### DEC-16 — Match requested rules; keep the computer available

- **Kind:** (b). **Today:** No server opponent search appears in the web start flow.
- **Evidence:** Q4/D1 a: match the five switches; pools can differ; Any rules is explicit; oldest suitable game first; open game lasts 24 hours; computer offer after 25 seconds; online count only from ten. R spec `:34`; `src/match/setup.ts:21–24`; `src/match/service.ts:229–245`; `src/plugin/screens/lobby.ts:19–23`; `src/plugin/index.html:50–51`. Any rules is already in R despite the old cut.
- **Lift:** Lobby, wait, and switch-to-opponent controls. Replace MCP calls and host visibility with web equivalents.
- **Work:** M after API work. **Dependencies:** DEC-30, DEC-32. **Risk:** Duplicate joins, stale waits, and lost computer drafts. H5 later says keep Any rules on until remount or a new chat draft; a web reset point needs definition. **Taste:** Match rule has approval; web persistence needs approval.

### DEC-17 — Record, rating, and ten badges

- **Kind:** (b). **Today:** The web has one saved game and review. It has no account game registry or rating display in its entry flow.
- **Evidence:** Q10–Q12: Glicko-2 starts at 1500; provisional at RD 110 or above; ? in profile, New player on board/end; no rated computer games; open games then finished games, totals, ten fixed badges. R `src/match/results.ts:21–58,63–91`; `src/match/badges.ts`; `src/plugin/index.html:61`; R spec `:46–48`.
- **Lift:** Profile scroll, history rows, totals, badges, and provisional text. Replace MCP profile/history tools; add web HTTP access to the same service queries.
- **Work:** M for screens, plus DEC-30. **Dependencies:** DEC-30, DEC-36. **Risk:** Local computer games do not produce server results by themselves. Do not invent past results or duplicate badge awards. **Taste:** The features have approval for the plugin; local-result policy needs the owner.

### DEC-18 — Collection as a complete guide

- **Kind:** (b). **Today:** The web has piece and power guides, lessons, and Workshop. It has no four-tab Collection page in its entry flow.
- **Evidence:** Q17; R `src/plugin/screens/collection.ts:12–43`; R spec `:53`. It lists Pieces, Kings, Powers, Cards and marks them Unlocked. Q6 b keeps words whole and adds side space: R owner ticket `26-picks.md:90–104`.
- **Lift:** The catalogue and art helpers. Replace widget sheet state with web tab state. Keep rule text tied to the applicable rules.
- **Work:** M. **Dependencies:** DEC-10, DEC-48. **Risk:** The current Cards catalogue uses default rules and omits the board lane's cost line. **Taste:** A new web guide structure needs a rendered sample.

### DEC-19 — Symbols-only setting

- **Kind:** (b). **Today:** The web has Piece letters, which adds letters to figures. This is not symbols-only play.
- **Evidence:** M `index.html:211`; R `src/plugin/index.html:64`; `src/render/PaintedView.ts:130–135,249–270`. The renderer can draw symbols and matching move ghosts, but the web does not call `setSymbols`.
- **Lift:** Symbol loader, setting, and preview. Replace MCP settings storage; decide account versus device scope.
- **Work:** S. **Dependencies:** DEC-02, DEC-32 if synced. **Risk:** Keep symbols in drag/hover ghosts and promotions too. **Taste:** New web setting and its default need approval.

### DEC-20 — Beginner notes at the action that needs them

- **Kind:** (b). **Today:** The web has selected-piece rules and full lessons. It does not connect the new first-enemy-action notes.
- **Evidence:** J8 a; R `src/read.ts:219–230`; `src/plugin/screens/board.ts:356–381`; R `docs/specs/chatgpt-mvp/issues/33-rc-review-faults.md:12–14`. The note records a lesson only when its text appears. It covers shots, shoves, chains, disappearing paladins, and swaps, not every special rule.
- **Lift:** The board note trigger and once-per-game tracking; use shared live-rule words. No host is needed for the pure note function.
- **Work:** S. **Dependencies:** DEC-01, DEC-12. **Risk:** A general intro must not hide the first useful enemy-action note. **Taste:** Approved direction; web placement needs a sample.

### DEC-21 — One pending command and honest recovery

- **Kind:** (b). **Today:** The web plays locally and uses local save/restore; it has no online pending-command flow.
- **Decision and evidence:** B3 b, W3 b, W4 a, W6 a, Q7 a: keep the last board, mark Not current, disable play until a good read, one error, Retry on its game, quiet resend after remount, neutral Start on error, Starting after one second. R `src/plugin/state.ts:1–55`; `src/plugin/client.ts:8–49`; `src/plugin/screens/board.ts:378`; `src/plugin/screens/setup.ts:81–87`; owner board ticket `05-board-actions.md:38–50`.
- **Lift:** Pure notice/lock rules and revision checks. Replace widget persistence, SDK timeout, MCP queue, and host messages with a web API adapter.
- **Work:** M. **Dependencies:** DEC-30. **Risk:** Old replies must not restore an old game; retry must keep the command ID. **Taste:** Fault fixes carry over. New recovery wording or notice placement needs approval.

### DEC-22 — Each game action has one place

- **Kind:** (b). **Today:** Web Resign is in Menu; online draw, abort, and deadline claims have no connected web flow.
- **Evidence:** M `index.html:205,227`; R `src/plugin/screens/board-actions.ts:23–43`. J7 a puts Resign, Offer draw, and Abort in Menu; keeps draw replies on the board; keeps Menu at the right of Undo and the sword button. B1 b keeps the last move and time left on short screens. R owner ticket `05-board-actions.md:8–21,38–50`.
- **Lift:** Availability rules, confirms, last-move text, and deadline display. Replace tool names with service actions.
- **Work:** S after online board work. **Dependencies:** DEC-30, DEC-45. **Risk:** A stale view must lock end actions too. **Taste:** Placement has approval; new web choices need a sample.

### DEC-23 — Preview an own-piece shove or swap

- **Kind:** (b), already in R. **Today:** The web help says select an own piece to swap; its board input does not use this plugin preview function.
- **Evidence:** M `src/ui/table.ts:98–112`; R `src/plugin/screens/board.ts:91–114,222–240,370–383`; R owner ticket `26-picks.md:27–49`. J9 a/G3 a: first target shows the result, second target stages it; another selection ends the preview without playing it. G1 a puts target words first.
- **Lift:** The held-move selection logic, keyboard path, and marks. Keep web turn staging. No host work is needed inside this input rule.
- **Work:** S. **Dependencies:** DEC-45. **Risk:** Drag, Escape, Cancel, Undo, stale views, and changed boards must clear the same preview. **Taste:** Approved input rule. Check the web sample for placement.

### DEC-24 — End actions during the short ceremony

- **Kind:** (b). **Cut status:** Ticket 06 was deferred, but R now contains it.
- **Today and evidence:** M `src/game-end.ts:51–83` opens the result after the ceremony. R `src/plugin/screens/end.ts:91–148` shows plain reasons, Play again with the same computer colour, New game with the current options, See the board, Game result, and Skip. Live game actions have a one-second guard; Skip and See the board remain active. R owner end ticket `06-end.md:128–162` records J4 c, W9 a, C4 c, Q4 a.
- **Lift:** End model, action timing, error placement, and calm draw/loss policy. Replace tools and routing. Keep web Review.
- **Work:** M. **Dependencies:** DEC-17 for ratings/badges. **Risk:** Do not cancel the final move or let a late rematch leave a newer screen. **Taste:** Picks have approval. Removing the web's review features does not.

### DEC-25 — Lively moments and sound policy

- **Kind:** (b), partly already shared. **Today:** Web motion and sound already exist; the plugin adds deal, check, ready, and emblem moments.
- **Evidence:** L3 a; R `docs/specs/plugin-submission/issues/07-taste-options.md:15–17`; `src/plugin/screens/board.ts:285–294,307–313`; `src/plugin/index.html:64`. Plugin Sound starts off and stays on the device. M `index.html:202` has Sound checked and Normal/Fast/Off motion.
- **Lift:** Brief, one-time state cues and reduced-motion final states. Do not copy the plugin's sound default without a web decision.
- **Work:** S after the relevant features. **Dependencies:** DEC-10, DEC-24, DEC-28. **Risk:** Repeated polls must not replay effects. **Taste:** New web moments and sound default need a sample; do not change the game's art style.

### DEC-26 — Board space, readable rows, and no zoom tool

- **Kind:** (b), partly on a separate branch. **Today:** The web uses its own table layout. R includes layout B, phone rows, Q3 draw-offer scrolling, K1 two-row card strips through 440 px, Q9 piece portrait, and Q10 automatic move list when 108 px fits.
- **Evidence:** R `src/plugin/app.css:222–294`; `src/plugin/screens/board.ts:388–409,436–448`; `docs/specs/chatgpt-mvp/issues/37-k-picks.md:26–32`; owner `26-picks.md:85–104`. `claude/od-look` at `c382f95b` has the broader L2 move chooser. P `tickets/spec.md:192–196` selects Q5 c: omit Zoom in.
- **Lift:** Board-first rows, full legal-move chooser, scroll, and move-band policy. Remove composer and frame assumptions. Do not port that branch's Zoom in control.
- **Work:** M. **Dependencies:** DEC-10, DEC-22. **Risk:** Shared CSS alone does not give this layout; all buttons must remain reachable with zoom and touch. **Taste:** Choices have approval; web samples still need review.

### DEC-27 — Game-row board preview

- **Kind:** (b), first-submission cut. **Today:** The web has no server game list. R rows show portrait, state, colour, and date, not a board: `src/plugin/games-list.ts:18–39`.
- **Decision and evidence:** P `tickets/spec.md:191–194` selects S2 b and preserves the owner's request for a close-up last-move preview on repeat. `taste/b2-row-preview` at `3bf795e7`, `src/plugin/games-list.ts:23–56` has still-board and one-play/replay controls. P `tickets/issues/13-samples.md`, B2, explains the missing position/last-move data and the no-loop concern.
- **Lift:** Row preview renderer and replay button; expose position and last move through the web API. Replace MCP `_meta` delivery.
- **Work:** M. **Dependencies:** DEC-17, DEC-30. **Risk:** The owner's repeat note and the sample's one-play rule differ. Do not claim that sample fully implements the answer. **Taste:** Resolve repeat versus replay before the web build.

### DEC-28 — Dealt cards and the seat reveal

- **Kind:** (b), first-submission cut. **Today:** No web seat screen. R shows a veil; it does not show the four cards before Ready in that screen.
- **Evidence:** R `src/plugin/screens/seat.ts:51–59,68–72`; `taste/c5-seat-reveal` at `97e0dca1`, `src/plugin/screens/seat.ts:57–64,94` adds seat cards. P approval item S1 describes the VS banner and stone slab. P `tickets/spec.md:191–194` accepts S1 a for the later update.
- **Lift:** Seat-card read controls, banner, and reduced-motion reveal. Replace host routing and tools; keep hidden enemy choices on the server.
- **Work:** M. **Dependencies:** DEC-08, DEC-10. **Risk:** Sample imports older board helpers and needs a selective port. **Taste:** The sample choice has approval; a web sample must show the same states.

### DEC-29 — Plain dim behind sheets

- **Kind:** (b), absent from R's current scrim. **Today:** Both web and plugin use blur in sheet treatments.
- **Evidence:** L4 a, P `decisions-full.md:242–247`; M `src/style.css:288` has the web blur. R `src/plugin/app.css:38` still has `backdrop-filter: blur(2px)`. P `tickets/issues/10-look.md:11–15` identifies the separate look work.
- **Lift:** The scoped no-blur style from the later look work, or the same small CSS change in the web sheet.
- **Work:** S. **Dependencies:** None. **Risk:** Do not remove blur from unrelated artwork or overlays by a broad selector. **Taste:** The plain-dim choice has approval; confirm its web sample with other sheet changes.

## (c) Web work with no complete plugin equivalent

### DEC-30 — Connect the current web account to the full game service

- **Kind:** (c). **Today:** The web account syncs a local game; the game screen does not use `onlineClient`.
- **Evidence:** M `src/main.ts:74–75,89–92,196`; R `src/online/client.ts:30–68`; `src/api/http.ts:70–95`. The HTTP surface covers core games, commands, profiles, relations, and reports. It lacks dedicated routes for the plugin's lobby/find/preview, result record/history, and player-settings queries. `watch` stops outside waiting/playing, so it does not cover the new setup phase: R client `:102–105`.
- **Work:** L. Add the missing typed HTTP routes and web transport, setup polling, saved selection, and pending-turn storage. Keep local play available.
- **Dependencies:** DEC-07, DEC-55. **Risk:** API parity, stale replies, auth, and two-client races. **Taste:** The web online spec needs approval; clear faults do not need a separate choice.

### DEC-31 — Web join and game URLs

- **Kind:** (c). **Today:** Existing links carry a local game's data. A server invite points to `/j/<token>`; email points to `/g/<id>`, but the web entry has no such game route.
- **Evidence:** M `src/main.ts:28–42,177–187`; `src/screen/links.ts:9–23`; R `src/api/http.ts:69`; `src/online/mail.ts:13–18`. Q2 explicitly leaves the website join page out: R spec `:189`.
- **Work:** M. Add join preview, sign-in return, seat acceptance, game opening, and useful expired/used states. Preserve existing link games.
- **Dependencies:** DEC-15, DEC-30, DEC-55. **Risk:** A sign-in return must retain the invite and must not consume it before consent. **Taste:** Public entry and join-page layout need approval.

### DEC-32 — Public identity, privacy, and follows

- **Kind:** (c), with server and plugin parts to reuse. **Today:** The web Account panel displays provider name/photo. It has no online handle or follow controls.
- **Evidence:** M `src/account/account.ts:28–31,43–50`; R `src/account/profile.ts:6–35,53–69`; `src/plugin/index.html:64–65`; `src/online/accounts.ts:50–79`. Q13 requires a unique handle and 17 preset icons. The later D14 answer has Everyone/Friends only/Nobody, mutual default. The current plugin text admits that it has no follow UI.
- **Work:** M. Add online identity and relation controls to the web account flow; reuse current social sign-in. Do not publish provider photos as opponent identity.
- **Dependencies:** DEC-30. **Risk:** Friends only means nobody until mutual follows exist. **Taste:** Identity/privacy direction has approval; new follow UI and public profile scope need approval.

### DEC-33 — Report, Block, and fixed messages

- **Kind:** (c) for the complete public web flow. **Today:** No connected web opponent/report flow. R adds plugin Block and Unblock, but still no Report control.
- **Evidence:** Later owner answer replaces D11's old “both later”: P `tickets/spec.md:68–73`. R `src/plugin/screens/board-actions.ts:48–70`; `src/plugin/index.html:61`; `src/online/client.ts:64–67`; `src/account/profile.ts:47–51`; R spec `:175,191`.
- **Work:** M. Lift Block confirms; build web Report, relation management, and any fixed-message controls through existing services. No free chat is approved.
- **Dependencies:** DEC-30, DEC-32, DEC-40. **Risk:** Block leaves the current game running; messages and matchmaking must follow the same saved block. **Taste:** Block has approval. Report's public release scope, presets, and screen need owner approval. The old private cut is not a public-web waiver.

### DEC-34 — Turn alerts and their destination

- **Kind:** (c). **Today:** Web local/link play has no account turn-alert flow. The plugin MVP excludes email and push.
- **Evidence:** R spec `:33,190`; `src/online/jobs.ts:62–115`; `src/online/mail.ts:12–32`; `src/online/client.ts:62–63`; multiplayer spec `:39,56`. Server outbox, email adapter, and preferences exist. A complete push client and working `/g` destination are not supplied by plugin screens.
- **Work:** M for email opt-in/settings and game links; L for push.
- **Dependencies:** DEC-30, DEC-31, owner choice of channels. **Risk:** A mail template is not proof that live mail or schedules run. Current footer names an Alerts screen the web does not have. **Taste:** Channels, defaults, and timing need approval.

### DEC-35 — Live clocks, guests, and web connection policy

- **Kind:** (c). **Today:** Web play is local or link-based. The plugin MVP has no clocks; its poll serves slow games.
- **Evidence:** R spec `:33,190`; multiplayer spec `:34–39`; research README `:48,120–137,188–195`; R `src/online/client.ts:85–128`; `src/online/deadline.ts`. The pure deadline module and a poll exist; they do not prove a complete live clock, reconnect, guest, or Realtime flow.
- **Work:** L. **Dependencies:** DEC-30, DEC-31, DEC-32. **Risk:** Clocks, disconnect claims, and Haste must use complete turns. Host timing settings must not become browser rules by accident. **Taste:** Release pace, guest access, alert channels, and live timing need an approved web spec.

### DEC-36 — Decide which online games count for rating

- **Kind:** (c), policy gap. **Today:** No web rating flow. Plugin Q10 rates all games between people. The older research proposes casual friend games, a fixed rated pool, and rating categories later.
- **Evidence:** R `docs/specs/chatgpt-mvp/spec.md:46`; `src/match/results.ts:26–34` rates every eligible non-solo finish. Research README `:139–176` proposes other rules. Multiplayer spec `:14` says these are agent picks built at the owner's request, not separate owner approvals.
- **Work:** S to choose and document; M if filters/categories change.
- **Dependencies:** DEC-17, DEC-30. **Risk:** Do not present the research as the owner's rule. Friend boosting and different feature sets share one rating today. **Taste:** Owner decision required. Pick the existing plugin rule for the first shared pool unless the owner chooses a rated/casual split.

### DEC-37 — Progress, leaderboards, and later social features

- **Kind:** (c). **Today:** No crown/unlock gate or leaderboard connects to the web start flow. The plugin shows all items unlocked and ten badges.
- **Evidence:** M `src/new-game.ts:44–53,134–151`; R `src/plugin/screens/collection.ts:12–15`; R spec `:193–196`. Research README `:49–51,149–195` proposes bands, leaderboards, online crowns, a Paladin unlock, seasons, leagues, and power records. It labels itself Research at `:3`.
- **Work:** L as a group; each needs a separate scope.
- **Dependencies:** DEC-17, DEC-36. **Risk:** A roadmap is not code or approval. Do not add XP, streaks, or login rewards from inference. **Taste:** Owner chooses each addition. Pick badges and all-unlocked access first; defer a new economy and divided player pools.

### DEC-38 — Deferred rule, card-art, and help choices

- **Kind:** (c). **Today:** The web has No power, Undo, Review, and guides. There is no web card setup to repair with a new rule.
- **Evidence:** D6 is explicitly later: P decision `approvals-db/decisions/D6.json`; P `decisions-full.md:328–333`. R `src/powers-ui.ts:16–20` keeps cost tied to `markFree`. R spec `:194–196` excludes rarity, cards with limited-use powers, full card art, replay, hints, and undo from the plugin MVP. Web Undo/Review exist at M `index.html:58,276`.
- **Work:** S for a decision; M/L for rule or art extensions.
- **Dependencies:** DEC-10, DEC-11. **Risk:** A text problem is not grounds to change a card rule. The plugin's exclusions must not delete working web features. **Taste:** Rule changes, rarity, missing paintings, hints, and progression need owner approval. Keep current rules and show their real costs.

### DEC-39 — King-choice sample and busy-button sample

- **Kind:** (c), unfinished design work. **Today:** Web has the current king/power picker and local start. R has its present sheets and grey busy state.
- **Evidence:** P `tickets/spec.md:191–196,205–206` requests C2 a samples and H4 a soft-pulse samples before build. C2 describes the large king, six emblems, two powers, unavailable reasons, and one king choice at the seat: P approval item C2. R `src/plugin/screens/setup.ts:81–87` changes Start words but does not establish an approved pulse sample.
- **Work:** S/M for samples, then scoped ports.
- **Dependencies:** DEC-09, DEC-13, DEC-21. **Risk:** A request to build samples is not approval of their final design. Completion of later samples is **unverified**.
- **Taste:** Owner must approve each rendered sample. Pick reuse of current king art and a short pulse with no reduced-motion pulse.

### DEC-40 — Public web data and support scope

- **Kind:** (c), with existing documents and services. **Today:** Optional web accounts have their own account panel. Online games add retained records, handles, presence, relations, and reports.
- **Evidence:** D9 a selects account-life games, 12-month reports, host-default logs. R `src/online/jobs.ts:143–154` removes old boards after seven days, outbox rows after 30 days, and eligible reports after 12 months. R `docs/plugin-beta-support.md:47–53` is an older packet and describes earlier deletion; later account grace code is DEC-06. Multiplayer spec `:57` keeps the opponent's record after deletion.
- **Work:** M. Align web notices, account controls, support details, jobs, and actual service policy.
- **Dependencies:** DEC-06, DEC-30, DEC-33. **Risk:** Do not copy stale packet claims or infer live retention settings. Responsible entity, contact, and jurisdiction choices remain **unverified** in this read-only survey. **Taste:** Owner supplies these choices. This item records source gaps, not legal conclusions.

## (d) Plugin-only: do not carry the host contract to the web

### DEC-41 — Frame, fullscreen entry, and host state

- **Kind:** (d). **Today:** The web owns its document and viewport.
- **Evidence:** Q25/D7 a, Q25b: fullscreen preferred, no untapped fullscreen request, at most two inline actions, optional side-panel/sidebar routes. R spec `:25,57,155–156`; `src/plugin/app.ts:36`; `src/plugin/client.ts:17–35`. K3/K4 are P `decisions-full.md:669–672`.
- **Work:** S to exclude these edges. **Dependencies:** None. **Risk:** Copying composer gaps, `window.openai` widget state, widget messages, frame teardown, or fullscreen entry would waste web space or break navigation. **Taste:** No new choice is needed to omit the host plumbing. The real-host K3/K4 checks remain plugin work.

### DEC-42 — System fonts are a host exception

- **Kind:** (d). **Today:** The web uses the game's fonts and light parchment.
- **Evidence:** D5 b follows the host font limit: P `decisions-full.md:320–325`. D13 a keeps light parchment: `:379–384`. R `src/plugin/app.css:86,106,136` still refers to game font tokens; do not claim the full separate system-font branch is in R. The game-design rule is Memory `feedback-plugin-ui-uses-game-design.md:11–15`.
- **Work:** S; keep web type unless the owner changes it. **Dependencies:** DEC-49. **Risk:** Treating host advice as the product design repeats the first sample error. **Taste:** A new web type or dark theme needs approval; the plugin font exception does not authorize it.

### DEC-43 — Submission, reviewer login, consent, and tool metadata

- **Kind:** (d). **Today:** The web player sign-in is separate from plugin OAuth consent.
- **Evidence:** Q1/Q24, D8, D10, D15, O1, E5 and consent B4 concern the public host package, `/mcp`, reviewer access, scan, domain proof, and tools. R spec `:31,56–57,200`; R `docs/specs/plugin-submission/issues/18-server-followups.md:13–22,53–74`; `docs/plugin-preparation.md:75–91`. The later first-submission decision replaces the original private-only Q1 scope: Memory `project-first-submission-scope.md:11–20`.
- **Work:** S to keep release tracks separate. **Dependencies:** Shared identity/service releases still require coordination with DEC-07.
- **Risk:** A reviewer password path must not become ordinary web sign-in by accident. Changing tool hints, cached resource URIs, or package tests does not add a web feature. **Taste:** These release choices have their own owner gates.

### DEC-44 — Chat privacy and chat drafts

- **Kind:** (d) for host mechanics. **Today:** The web has no surrounding chat or model context.
- **Evidence:** Q13 has no chat; Q14 has no hints; R spec `:49–50,61,155,175`. `src/plugin/client.ts:31–35` writes empty model content. The J1 chat request that fills a draft is in `claude/od-home:src/plugin/app.ts:238–239,424–432`; Memory `project-first-submission-scope.md:15` defers its review.
- **Work:** S to omit chat transport. **Dependencies:** DEC-13 can still reuse the visible draft controls.
- **Risk:** Do not port MCP `_meta`, chat summaries, or host message routing into the browser. Keep game authority and opponent privacy in DEC-30. **Taste:** A new chat tutor or chat-driven web start is a new feature; do not infer approval.

## (e) Already present, or already a standing build rule

### DEC-45 — Explicit turn submission and draft Undo

- **Kind:** (e). **Today:** The web already stages a turn and hands it over with End turn or Send your turn. Undo changes the unsent turn.
- **Evidence:** M `src/turn.ts:2–4,58–119,132`; `src/turn-controls.ts:26–58`; `index.html:58–59`. W7 and later T1/T2/T4 picks follow the web rule: P `tickets/issues/26-picks.md:15–19`; `tickets/spec.md:192–196`. R `src/match/service.ts:108` also rejects a partial player turn.
- **Work:** S, no local-game gap. **Dependencies:** DEC-30 for server send/retry. **Risk:** Do not remove web Undo because the original plugin MVP said no undo. Reading a piece must stay possible after send. **Taste:** Keep the approved sword-button names and quiet draft cues; no new decision is needed.

### DEC-46 — Four computer levels, threats, painted look, and motion controls

- **Kind:** (e). **Today:** These web features already exist.
- **Evidence:** M `src/new-game.ts:44,49–53`; `src/main.ts:67–69`; `index.html:140–145,202,209–211`; `src/screen/settings.ts:24–35,54–78`; `src/screen/play.ts:232–233`. Q15 reuses the web levels. Clay stays parked; light parchment stays. Symbols-only and the new cue timings are separate gaps in DEC-19/25.
- **Work:** S to preserve them. **Dependencies:** DEC-02 for shared renderer effects. **Risk:** Plugin Sound-off, fewer settings, or host layout must not replace existing web controls without a choice. **Taste:** New defaults need owner approval.

### DEC-47 — Review, lessons, Workshop, and design games

- **Kind:** (e). **Today:** The web already has these features. The plugin cut excludes design games, full replay, and hints.
- **Evidence:** M `src/main.ts:9,94–106,198–203`; `src/new-game.ts:40–41,91–101`; `src/screen/play.ts:574–597`; `index.html:276`. R spec `:61,195–196` keeps plugin `design` empty. The existing web result ceremony is M `src/game-end.ts:63–83`.
- **Work:** S; keep these paths in the web plan. **Dependencies:** DEC-08, DEC-24. **Risk:** Replacing the web shell wholesale can remove them. **Taste:** No approval is needed to retain working scope. Any deletion or new help feature needs approval.

### DEC-48 — All items available; no new unlock gate

- **Kind:** (e) for current access. **Today:** The web picker enumerates all six kings and powers, and draws from its full pool. No crown gate connects to this setup.
- **Evidence:** M `src/new-game.ts:44–53,134–151`; `src/main.ts:140`; R spec `:5,53`; `src/plugin/screens/collection.ts:12–15`. Research crown/unlock recommendations are not proof of a built web gate.
- **Work:** S, no access gap; Collection itself is DEC-18. **Dependencies:** None. **Risk:** Do not turn a future progression document into a new restriction. The plugin's all-unlocked build scope is not approval of an economy. **Taste:** Add unlocks only after an owner decision.

### DEC-49 — Product design first; real board in every sample

- **Kind:** (e), standing process rule. **Today:** The web supplies the product design and the actual board renderer.
- **Evidence:** R `docs/lessons/browser-checks-and-ui.md:5–9`; Memory `feedback-plugin-ui-uses-game-design.md:11–15`; R spec `:54,158`. First sample errors include missing selection glow, wrong threat marks, a missing take badge, and an illegal last move.
- **Work:** S. Capture the current web first. Make board samples from engine positions, legal moves, real last moves, threats, and shared drawing code. Compare the same position.
- **Dependencies:** All visual ports. **Risk:** Hand-drawn board marks can approve a state the game cannot produce. **Taste:** Owner approves the sample. The host font exception in DEC-42 does not change this rule.

### DEC-50 — Separate faults from taste; keep only open questions

- **Kind:** (e), standing owner rule. **Today:** AGENTS.md already requires spec and rendered-sample approval.
- **Evidence:** Memory `feedback-ux-choices-delegated.md:11–15` replaces the older broad design delegation. P `tickets/spec.md:195–206` clears answered questions and keeps decision records. R `docs/specs/plugin-submission/map.md:12` states the same split.
- **Work:** S. Fix a fault with one right fix. Batch improvements, words, motion, layout, and structure as options with a pick. Remove answered questions from the active page; retain their record.
- **Dependencies:** All items. **Risk:** A recommendation or reversible default is not the owner's yes. **Taste:** The process rule itself is settled; new product choices still need approval.

### DEC-51 — Verify the actual build and the action

- **Kind:** (e), standing process rule with plugin evidence. **Today:** The repo has browser checks and fixture paths.
- **Evidence:** R `docs/lessons/browser-checks-and-ui.md:17–27,38–45`; `docs/plugin-preparation.md:25–29,33–44`; `docs/specs/plugin-submission/issues/10-retro.md:20–30`; R device ticket `39-device-faults.md:49–52` invalidates a run that overlaps source edits.
- **Work:** S. Use failing-before/passing-after proof for faults. Wait for the new read, fonts, canvas, and actual state. Test destination touches, not only move buttons. Freeze source through a run. Keep assertions and time limits when a test race is fixed.
- **Dependencies:** All builds. **Risk:** A stale frame, late module reload, or passed source-only test can hide the shipped fault. **Taste:** No owner choice is needed for sound evidence. This survey runs none of these checks.

### DEC-52 — Compare main fairly; check all affected screens

- **Kind:** (e), standing process rule. **Today:** Both surfaces share pixels, words, and table rules.
- **Evidence:** R `docs/lessons/browser-checks-and-ui.md:11–12,20–27,32–36`; `docs/lessons/agents-and-tools.md:8–12`. Main-versus-main renders identify unstable states. Moved controls and changed defaults can break unrelated browser selectors.
- **Work:** S. Compare stable states in the same environment. After shared drawing or row changes, run the full browser set in the later build phase. Check old link, local save, Review, lessons, Workshop, and account paths as well as the new flow.
- **Dependencies:** DEC-01–05 and all screen ports. **Risk:** A plugin-only pass cannot prove the web is unchanged. **Taste:** No choice is needed for regression checks.

### DEC-53 — Test serially; integrate small completed steps

- **Kind:** (e), build-process rule. **Today:** The repo has a shared test lock and tickets for evidence.
- **Evidence:** R `docs/lessons/agents-and-tools.md:5–12,23–24,56–59`; Memory `feedback-mvp-speed-over-rounds.md:11–28`; P `tickets/spec.md:68–81,131–136`. The plugin work shows the cost of late integration, repeated unreliable checks, old client branches, and child sessions that resume after a wrapper reports completion.
- **Work:** S. Use one current base and one writer for shared client files. Integrate completed parts early. Give a false test failure its own cause/fix. Use a light review loop for small work and rolling QA on the integrated head. Keep an independent reader and fix confirmed faults before merge under project rules.
- **Dependencies:** All build tickets. **Risk:** The early one-round speed exception is not permission to skip present merge gates or leave a child command running. **Taste:** Do not reopen settled implementation choices; new product improvements still go to the owner.

### DEC-54 — Local evidence is not live-host evidence

- **Kind:** (e), process lesson. **Today:** Local checks can verify web behaviour, but they cannot prove provider state or native host behaviour.
- **Evidence:** R `docs/plugin-beta-support.md:7–23,29,45–53`; `docs/plugin-preparation.md:75–91`; P `tickets/spec.md:296–310`. The iOS pass finds touch and viewport differences that a narrow desktop capture misses. The beta packet requires actual device/build, start route, artifact identity, and observed result.
- **Work:** S. Keep source checks, emulated browsers, native device results, and live service results separate. Use dedicated test accounts later; keep private data out of reports. Check start/play/resume/friend join and negative retry/access/race cases.
- **Dependencies:** DEC-30–35, DEC-40. **Risk:** Do not claim live readiness from this survey or from an old packet. **Taste:** The owner chooses release scope and tester group; objective failures have one right fix.

### DEC-55 — Web social sign-in already exists

- **Kind:** (e). **Today:** Settings → Account offers Google and GitHub sign-in, local sign-out, and optional cloud save. The web does not need a new basic sign-in system.
- **Evidence:** M `src/account/account.ts:2,15,43–50,113–117`; `src/account/client.ts:16–38,40–43`; `src/main.ts:196`. The online client can take the session token: R `src/online/client.ts:17–34`.
- **Work:** S to reuse sign-in; the online identity and return-to-invite work is DEC-31/32.
- **Dependencies:** DEC-30 for online play. **Risk:** Current sign-in returns to the pathname; it does not preserve an arbitrary invite draft by itself. Live provider configuration is unverified. **Taste:** No new password or provider choice is needed to use the existing path.

### DEC-56 — Keep old modes and saves correct

- **Kind:** (e), standing engine and state lesson. **Today:** The web has old rule presets, local saves, lessons, and Workshop designs. The plugin adds new engine modes and archived server games.
- **Evidence:** R `docs/lessons/engine-and-tests.md:5–15,23–32`; `docs/lessons/browser-checks-and-ui.md:29–30`; R spec `:147,179–184,201`; R `docs/plugin-preparation.md:101–106`. A new flag must leave the old path correct. A lesson must not save its position over the live game. A game version needs its own engine bundle.
- **Work:** S as an acceptance rule. Check Classic on/off, two-sided powers, FEN/history, actual mover through Haste, both hands, changed pool evaluation, and old web saves. Keep lesson state separate.
- **Dependencies:** DEC-05/08/10/30. **Risk:** A passing new mode can hide damage to an old mode. **Taste:** Preserve settled rules; a new rule or save migration needs explicit scope.

### DEC-57 — Do not compare device and server clocks as one clock

- **Kind:** (e), reusable plugin lesson. **Today:** Local web play has no server receipt time. Online recovery will introduce one.
- **Evidence:** R `docs/specs/chatgpt-mvp/issues/29-retry-start-clock.md:9–14` proves that a start recovery check can reject its own game when device time leads server time. R `src/online/client.ts:46–49,77–82` uses command IDs and revisions for retries and view order.
- **Work:** S. Carry command identity and revision through web retries; use server time for server deadlines. Test skew and a lost reply.
- **Dependencies:** DEC-21/30/35. **Risk:** A same-machine test can pass while a real phone fails. **Taste:** No owner choice is needed for a correct time comparison.

### DEC-58 — Measure art, focus, contrast, and touch bounds

- **Kind:** (e), process lesson. **Today:** The web uses the same art and board marks that the plugin reuses.
- **Evidence:** R `docs/lessons/art-and-motion.md:5–15,26–30`; `docs/specs/owner-decisions/issues/07-cards.md:140–150`; `docs/specs/owner-decisions/issues/26-picks.md:209–224`; `docs/specs/chatgpt-mvp/issues/37-k-picks.md:19–38`. The card build needs actual ring contrast and final lift measurements. Armed rule text needs keyboard scroll. Narrow Resume needs its full accessible name.
- **Work:** S as build criteria. Measure the final computed style and actual reachable rectangle. Check both hands, final art, long names, fonts, zoom, and reduced motion. Use each render tool's own server and stable asset readiness.
- **Dependencies:** All visual ports. **Risk:** Checking a CSS duration, a colour string, or document overflow alone can pass a broken screen. **Taste:** Objective access faults have one right fix. New shapes, art, or cue treatments need owner approval.

## First-submission cut: coverage and current state

This is a scope record, not a new kind. P `tickets/spec.md:31–47` and Memory `project-first-submission-scope.md:13–20` define the cut. Later code and answers give these results:

| Deferred part | Current evidence | Web action |
|---|---|---|
| 03 hall: J1 tools row, D3 presets, W1 chips, chest, name step | Separate `claude/od-home` at `06c746b0`; H1/H2/H3/H5/H6 answers are in P `tickets/spec.md:191–206` | DEC-13/14. Port visible controls. Keep the new client state. |
| J1 chat-filled draft | Same old branch; changes the host skill and test case | DEC-44. Do not make it a web dependency. |
| 06 end: J4, W9, C4, narrow end card | Already in R `src/plugin/screens/end.ts` | DEC-24. A code port is still needed for the web. |
| 07 board: J6, L1 board faces, W10, narrow coins; 08 J9 | Direct use remains on `claude/od-board`; J9 and later G1/G3 are in R | DEC-11/23. Lift functions; do not overwrite R's board. |
| 10-l2: L2 b | Separate `claude/od-look`; later Q5 c omits Zoom in | DEC-26. Keep chooser/layout; omit zoom tool. |
| 09-ui Any rules | Now in R setup and lobby | DEC-16. Needs web API access. |
| 13 B2 game preview | Separate `taste/b2-row-preview`; later S2 b with repeat note | DEC-27. Resolve repeat behaviour first. |
| 13 C5 seat reveal | Separate `taste/c5-seat-reveal`; later S1 a | DEC-28. Port after seat setup. |
| W7 T1–T7 samples/defaults | Later owner keeps website button names, three-cell bar, and quiet draft cues | DEC-45. Web already supplies the base rule. |
| Later D11, D6, C2 | Block moves into the first submission; Report stays later. D6 stays later. C2 requests samples | DEC-33/38/39. Do not use the first D11 row as the latest answer. |
| K3 and K4 | Owner picks exist; host measurement and later Android text-size work remain | DEC-41 and open questions below. |
| Small later faults | P `tickets/issues/40-later-small.md:5–7`: menu label lip at 200%, armed-coin selected state, possible shared scroll cue | Carry the fault checks into DEC-11/22/26. Confirm on the port before changing it. A proven fault needs no taste approval. |

## Open questions for the owner

Each question gives the current evidence and a pick. No answer is requested by a tool in this survey. Current answers on the remote approval page are unverified.

1. **Web scope and release order:** Does the first web step add the full online flow or local features first? Plugin Q2 excludes web work; the older multiplayer report is not an approved web spec. **Pick:** Shared merge checks, local setup/cards and input ports, then account game/join flows. Keep local play available. This approves the scope for DEC-08–40; it does not approve a deploy.
2. **Rating policy:** Do all human games count, as plugin Q10 does, or do friend/custom games become casual? **Pick:** Keep the existing service rule for the first shared pool. Change it only in a separate policy ticket. DEC-36 has the conflict and code evidence.
3. **Local game results and settings:** Do new web badges/history cover local computer games, and which settings sync to the account? **Pick:** Server records cover server games first; retain local saves. Sync deliberate account settings; keep sound on the device. Do not infer historical wins. DEC-17/19/25/30.
4. **Quick-start level:** Does Play now use Beginner each time or Beginner first, then the last level? **Pick:** Follow D2's recorded answer: first Beginner, then the saved level. R's helper always chooses Beginner. Treat that mismatch as a spec correction, unless the owner changes the answer. DEC-12.
5. **No power on the web:** Does the plugin's mandatory power choice apply to every web powers game? **Pick:** Preserve existing No power in current web modes; use the plugin rule in the new five-switch mode. DEC-09. This keeps the old unanswered “king with no power” appearance choice separate.
6. **B2/S2 preview repeat:** Does the last move loop, play once on entry, or replay on a button? The owner selects S2 b and also asks for repeat; the sample plays once and offers replay. **Pick:** One play on entry plus replay; no motion under reduced motion. Show this sample for approval before DEC-27.
7. **C2 king-choice sample:** Which rendered throne-room design gets approval? The owner asks for samples; a final accepted sample is unverified. **Pick:** Current art, six emblems, one seat choice, two explicit powers, and a reason for unavailable kings. DEC-39.
8. **H4 busy pulse sample:** Does the rendered soft pulse get approval? H4 a permits a sample first, not an unseen final pulse. **Pick:** One short shared busy style, with no pulse under reduced motion. H1/H2/H3/H5/H6 are answered; do not ask them again. DEC-13/39.
9. **Y1 Resume with a friend name:** P `tickets/spec.md:309` leaves a new taste item. Its full later option text and current answer are unverified. **Pick:** Keep Resume on line one; use full accessible opponent/turn detail on line two. Show the actual long-name sample. DEC-14.
10. **Y2 scroll cue:** Does a loss-card fade show that more actions are below? The same cue could serve long armed text. P `tickets/spec.md:309–310`; `tickets/issues/40-later-small.md:7`. **Pick:** One quiet edge fade, only when content remains below. Approve the sample before a style change. DEC-24/26.
11. **Y3 seat strip with king powers:** P `tickets/spec.md:309` leaves this layout call. Full options and a later answer are unverified. **Pick:** Keep the king choice and Ready readable; put extra coins on a second row. Show short-phone and landscape samples. DEC-08/28.
12. **D6 card costs:** Keep current costs or give each card one fixed cost? The owner explicitly defers the choice. **Pick:** Keep rules and show real costs. Any rule change gets its own Matrix entry, spec, and approved evidence work. DEC-38.
13. **K3 real-host insets:** What bottom inset does the real iPhone host send at 200% zoom? Owner picks c, but the measurement remains a prerequisite: P `decisions-full.md:671`. **Pick:** Keep the 210 px floor and scroll until measured; do not copy a fixed composer band to the web. DEC-41.
14. **K4 Android font size:** Does the real host pass the system text size to the app? Owner chooses fixed type for first submission, then a test and support if supplied: P `decisions-full.md:672`. **Pick:** Keep this as plugin follow-up. Test browser text enlargement separately for the web. DEC-41/54.
15. **Public online support and safety scope:** Which responsible entity/contact, retention settings, public Report path, guest access, and alert channels does the owner approve? **Pick:** Complete the existing account/safety drafts and web entry flows before broad online release. Use the built common service; do not promise unconfigured jobs or policies. DEC-32–40. The research's eight picks are not eight separate owner approvals.
16. **Older web choices still on TASKS.md:** Card deal membership, March, the four proposed new cards, countdown sample, piece-letter icons, and the appearance of a No power king still have open owner rows. **Pick:** Use the approved plugin 21-card pool only for the proposed shared mode; do not claim it settles each older experiment. Keep countdown and new icon/king appearance out until the owner chooses. M `TASKS.md` § Open items; DEC-09/10/19/38. The frozen-piece mark is a fault row, not a taste question; confirm its current state in the board lane.

The cut does not approve a web release. The present report checks code and decision records only. Live service settings, current remote approval data, and the final web experience remain unverified until their own authorized checks.
