# Screens and flows survey

PR 61 brings shared board changes and words to the web app. It does not connect the new screens to the web app. The main gaps are the Play hall, server games, setup choices, friend codes, Join, Open games, the profile, badges, ratings, Collection, and the new end flow. Most screen code can supply parts for the web build. It needs a web service connection and page state in place of the ChatGPT host. Keep the web app's local play, daily army, lessons, review, Workshop, and sign-in. The owner's approved choices guide the screen work. Some approved parts have no code in the release candidate.

Sources: **W** means `main` at `38a6bbff`; **P** means `claude/release-candidate` at `682e58bd`. Each path below uses that source's line numbers. The survey reads code and tickets. It runs no tests, browser checks, game runs, sign-in, or live-site calls. Runtime and visual results are **unverified**. Ticket check records are past records, not checks from this survey. `git diff main..claude/release-candidate` shows no change in `src/main.ts`, `src/new-game.ts`, `src/game-end.ts`, the ceremony files, lesson shelf files, `src/previously.ts`, `src/review.ts`, or `src/workshop/`.

Size: **S** means one small connection or view change. **M** means one screen or flow with state changes. **L** means a connection across local play, server play, and saved data. For (a), (d), and (e), S means review only; it does not mean a feature build. Sizes for (b) cover the screen change. SC-29 covers the common service work. An approved plugin choice does not by itself approve a new web layout. Each improvement still needs the owner's approval in a web spec. A clear fault with one correct fix does not need a taste decision.

## (a) Shared code: the merge changes the web app

### SC-01 — Board load, touch, motion, and coordinates

- **Kind:** (a). **Size:** S. **Depends on:** none.
- **Evidence:** W `src/main.ts:69`, `src/main.ts:188`; P `src/render/PaintedView.ts:92–112`, `src/render/PaintedView.ts:177–181`, `src/render/PaintedView.ts:209–214`; P `src/render/board-ink.ts:15–19`.
- **Web today:** It uses `PaintedView`, waits for its art, and applies the saved motion and coordinate choices. The merge changes that same class. The first canvas waits for one paint frame. Touch starts on pieces can prevent scroll. Reduced motion changes the scene settings. Small coordinates stay in the frame or disappear below the size limit.
- **Change and risk:** No new web call is needed for those changes. Check the first paint, drag versus page scroll, reduced motion, and a small board in the later build. `ready()` now needs a paint frame, so a hidden page can delay it. New `setSymbols()` and `canDrag` hooks do not add web controls by themselves; see SC-20.
- **Owner taste:** No new choice for a confirmed repair. A different web motion default needs approval.

### SC-02 — Shared rule and turn words

- **Kind:** (a). **Size:** S. **Depends on:** none.
- **Evidence:** P `src/read.ts:152–155`, `src/read.ts:175–178`; P `src/turn.ts:58–84`; P `src/context-line.ts:23–40`; P `src/ui/table.ts:100–114`; W `src/ui/guide.ts:30–43`, `src/ui/table.ts:216`. Owner B4: P `docs/specs/owner-decisions-2026-10-15/issues/02-home.md:27–31`.
- **Web today:** The Guide and board use these readers. Several instructions say Tap. The merge makes these paths say Select. The pawn read also uses the full move rule from `pieceGuide()`; see P `src/read.ts:208–215`.
- **Change and risk:** No web work for the changed calls. Check line length and spoken text later. The new `cardName`, `cardCost`, and `ruleLine` helpers exist at P `src/powers-ui.ts:13–27`, but the web's current card lab has its own names at W `src/workshop/ground.ts:59–72`. Their presence does not change that lab. The new teaching helper also needs a caller; see SC-19.
- **Owner taste:** B4 is approved. New words outside those paths need approval.

### SC-03 — Shared table rows and disabled coins

- **Kind:** (a). **Size:** S. **Depends on:** none.
- **Evidence:** W `src/main.ts:14–16`; P `src/ui/table.css:2–9`, `src/ui/table.css:105–119`; P `src/style.css:184–187`, `src/style.css:504`.
- **Web today:** It imports the table CSS and the common control CSS. The merge adds a strip-row variable and lets the short-phone context row grow. Disabled coins keep their coin face.
- **Change and risk:** No web import is needed. The default strip sizes stay the same, but long context text can use more height. Check the board size with lessons, Previously, and power text. The plugin's later layout rules live in its own CSS; they do not reach the web through this change.
- **Owner taste:** No new choice for the shared repairs. Copying the whole plugin layout is SC-28 and needs approval.

### SC-04 — Account deletion words

- **Kind:** (a). **Size:** S. **Depends on:** none.
- **Evidence:** W and P `index.html:230–236`; W and P `src/account/account.ts:130–136`; P `src/account/client.ts:34–38`. The branch diff changes both the question and the success message to a seven-day delay.
- **Web today:** Account deletion says that deletion is final and reports that the account is deleted. The merge says that deletion occurs after seven days and that a sign-in can cancel it.
- **Change and risk:** The web uses both changed strings. No screen connection is missing. Confirm the server and migration contract in the account lane; this survey does not check a live deletion.
- **Owner taste:** No. Correct words must match the service.

## (b) Plugin screen code that the web can use

All screens in this section call `src/plugin/app.ts` or use its page state. P `src/plugin/client.ts:24–43` sends MCP tool calls. P `src/plugin/app.ts:34–37` reads `window.openai`; P `src/plugin/app.ts:489–518` controls navigation. For the web, give the view a web action function and web page state. Do not import `app.ts` to obtain one helper: that import starts the host app and binds its document controls. SC-29 supplies the service connection. SC-30 supplies web navigation and sign-in return.

### SC-05 — Home actions and the Play hall

- **Kind:** (b). **Size:** M. **Depends on:** SC-15, SC-29, SC-30; keep SC-35.
- **Evidence:** P `src/plugin/index.html:29–43`; P `src/plugin/app.ts:598–624`; P `src/plugin/router.ts:5–11`. Owner J10, W2, and D7: P `docs/specs/owner-decisions-2026-10-15/issues/02-home.md:9–25`.
- **Web today:** Home shows one local game, Continue or Rematch, New game, and today's army. It has no list of server games. W `src/ui/home-view.ts:19–34`, `src/ui/home-view.ts:57–60`.
- **Change and risk:** Use the hall's list, New game area, profile link, and settings link. Use the owner's pitch, hide a zero turn count, show Start for an empty list, and show Your games (N). Resume names the current open flow or a ready game. The current Resume detail uses a second line; owner K2 is P `docs/specs/chatgpt-mvp/issues/37-k-picks.md:26–32`. Remove the fullscreen gate on ordinary web navigation. Keep a clear path to the local saved game. Risk: a new Home can hide local play or choose the wrong server game.
- **Owner taste:** Yes for the web Home and hall structure. The plugin choices are already recorded; do not ask the owner to choose those again for the plugin.

### SC-06 — Play now without changing the saved setup

- **Kind:** (b). **Size:** S. **Depends on:** SC-05, SC-07; SC-29 for a server game.
- **Evidence:** P `src/plugin/screens/setup-model.ts:27–31`; P `src/plugin/screens/setup.ts:166–194`. Owner D2: P `docs/specs/taste-recommended/issues/06-base-final-review.md:9–11`, `docs/specs/taste-recommended/issues/06-base-final-review.md:28–35`.
- **Web today:** The first deal uses Beginner and a fixed army. Other new games use the remembered level and setup. W `src/ui/title.ts:14–18`, `src/main.ts:122–141`.
- **Change and risk:** Use the pure quick-setup rule: Computer, Beginner, Arrangement off, other saved options kept. Skip the saved-setup write. Keep the first-deal route unless the owner changes it. The plugin's launch path calls MCP and keeps retry state; a local start needs neither. Risk: Play now overwrites a Strong, friend, or custom setup, or a retry starts a second game.
- **Owner taste:** Yes for adding this web action. Its approved plugin behavior is clear.

### SC-07 — One setup with five feature switches

- **Kind:** (b). **Size:** M. **Depends on:** SC-08, SC-09, SC-10; SC-29 for server starts.
- **Evidence:** P `src/plugin/screens/setup.ts:36–87`, `src/plugin/screens/setup.ts:140–164`; P `src/plugin/screens/setup-model.ts:6–25`, `src/plugin/screens/setup-model.ts:32–68`; P `src/match/setup.ts:20–38`. Owner Q5–Q9, Q19, Q26: P `docs/specs/chatgpt-mvp/spec.md:35–43`, `docs/specs/chatgpt-mvp/spec.md:58`.
- **Web today:** Computer, Kings' powers, or two local players; four levels; White or Black; a separate king picker for each side; No power; and an army choice. W `src/new-game.ts:26–61`, `src/new-game.ts:134–158`, `src/new-game.ts:171–208`. It has no playable card deal, piece-pool choice, random side, or separate arrangement phase.
- **Change and risk:** Use the switch rules, pool validation, random-side choice, and king-sheet parts. Defaults are Fairy on, Arrangement on, Classic off, Cards off, powers off. With cards, allow only the five always-on powers. With powers on, the plugin has no No power choice. The web also needs its two-player mode, daily army, custom army, and Workshop design choices. Risk: a direct replacement removes them or changes a saved setup's meaning. The piece lock counts pieces in the weighted pool, not seven distinct kinds.
- **Owner taste:** Yes. The web setup and its defaults change. The plugin rules are approved; how they fit local play needs a web choice.

### SC-08 — Card deal and card choice sheets

- **Kind:** (b). **Size:** M. **Depends on:** SC-07, SC-16 or a local hand connection; SC-28.
- **Evidence:** P `src/plugin/screens/setup.ts:72–76`, `src/plugin/screens/setup.ts:113–135`; P `src/plugin/card-face.ts:7–12`; P `src/match/setup.ts:13–16`, `src/match/setup.ts:44–48`. Owner C3 b, D4 a, L1 a, W10 a: P `docs/specs/owner-decisions/issues/07-cards.md:15–37`.
- **Web today:** The menu labels card mode as coming. Workshop can try lab cards; it does not deal a four-card hand into a normal web game. W `index.html:222`; W `src/workshop/ground.ts:59–72`; W `src/new-game.ts:30–42`.
- **Change and risk:** Use the two-by-two preview, card sheet draft, Pick four, Use all cards, shared names, rule text, and cost words. Done checks a valid pool. Other exits keep the prior valid pool. Use all deals four at random; its preview shows examples. `cardArt()` uses a painting, one of three existing scenes, or a plain name. It has no host call; its art paths and the sheet's app state need changes. Risk: examples look like a fixed deal; lab cards enter the real pool; a sheet close saves an invalid pool.
- **Owner taste:** Yes for adding card mode and its web layout. The stated plugin choices are approved. SC-32 covers the approved card interaction that is still absent.

### SC-09 — A real Classic game

- **Kind:** (b). **Size:** M. **Depends on:** SC-07; engine and save work in the other survey lanes.
- **Evidence:** P `src/plugin/screens/setup.ts:43–45`, `src/plugin/screens/setup.ts:68–70`; P `src/match/setup.ts:45–48`, `src/match/setup.ts:87–91`; P `src/rules/rules.ts:632–637`, `src/rules/rules.ts:764`. W `src/main.ts:133`, `src/screen/play.ts:647–663`, `src/ui/guide.ts:51–57`.
- **Web today:** Chess chooses the chess starting army. It does not set the new `classicChess` flag. The Guide says no castling or en passant. The merge leaves the new flag off by default.
- **Change and risk:** Use the Classic switch and setup builder, then carry Classic into rules, a starting position, save, share, and Guide text. The engine support is shared, but no current web control enables it. Risk: a label promises real chess while the game still uses King Down rules, or an old Chess-army save silently changes rules.
- **Owner taste:** Yes for changing the meaning of the web choice and its old saves. Once that contract is approved, a wrong rule connection is a fault.

### SC-10 — Seat setup, hidden order, and Ready

- **Kind:** (b). **Size:** M. **Depends on:** SC-07; SC-29 for two devices. Local handover also needs SC-31.
- **Evidence:** P `src/plugin/screens/seat.ts:38–66`, `src/plugin/screens/seat.ts:75–116`, `src/plugin/screens/seat.ts:155–169`; P `src/match/setup.ts:59–83`; P `docs/specs/chatgpt-mvp/spec.md:36–40`, `docs/specs/chatgpt-mvp/spec.md:59`.
- **Web today:** It starts both armies at once, with the same back rank. Custom setup is a text prompt. W `src/main.ts:124–128`, `src/screen/play.ts:663`.
- **Change and risk:** Use seat-model helpers, legal swaps, Shuffle, the king sheet, and Ready. The plugin hides the other side, enforces opposite-colour bishops and a guard next to the king, and waits for both seats. It displays the setup deadline. Replace the single plugin board instance and MCP Choose/Get calls with the web board and a local or server setup action. Risk: two local players see the other order; Black's order reverses; Ready opens play before the full rules arrive.
- **Owner taste:** Yes for local arrangement and its hidden handover. The two-device behavior has an approved plugin source.

### SC-11 — Friend game code and Share

- **Kind:** (b). **Size:** M. **Depends on:** SC-07, SC-12, SC-15, SC-29, SC-30.
- **Evidence:** P `src/plugin/screens/friend.ts:40–73`; P `src/plugin/invite.ts:4–21`; P `src/plugin/games-list.ts:40–48`. Owner J5 a: P `docs/specs/owner-decisions/issues/04-friend.md:7–18`, `docs/specs/owner-decisions/issues/04-friend.md:26–36`.
- **Web today:** Share sends a full game URL with moves. It has no server friend-code screen. W `src/screen/links.ts:9–23`, `src/screen/links.ts:50–65`.
- **Change and risk:** Use the code tiles, Ends line, rule names, Share first, Copy full text, selectable-text fallback, Cancel, and explicit Make a new code. A known code also appears in its game row. Replace the sentence about a ChatGPT connection with web join steps. Do not renew a code on reload: the plugin keeps known codes only in page memory. Risk: remount replaces a code already sent to a friend; Share cancellation writes the clipboard; old web links get confused with new codes.
- **Owner taste:** Yes for web invite words and link format. Share and Copy behavior is already approved.

### SC-12 — Join preview and seat choice

- **Kind:** (b). **Size:** M. **Depends on:** SC-11, SC-24, SC-29, SC-30.
- **Evidence:** P `src/plugin/screens/join.ts:7–34`, `src/plugin/screens/join.ts:36–69`; P `src/plugin/screens/friend.ts:34–35`; P `src/plugin/index.html:49`. Owner J5 a: P `docs/specs/owner-decisions/issues/04-friend.md:10–19`. Join repair: P `docs/specs/taste-recommended/issues/06-fix-join.md:81–88`.
- **Web today:** A game URL offers to replace the current save and then opens local play. It does not preview a server opponent, features, or a free seat. W `src/main.ts:178–187`.
- **Change and risk:** Use code normalization, preview, opponent and features, Decline, and Join and take White/Black. Preserve the preview through the name step. Bind the form before it accepts text. Replace `kingdown_join` with web preview and redeem actions. The current web API has redeem but no preview route; see SC-29. Risk: reading a code also takes a seat; sign-in loses the code; a slow load clears typed text.
- **Owner taste:** Yes for web entry and sign-in order. A read-only preview and an explicit join are the approved behavior.

### SC-13 — Open games lobby and Find

- **Kind:** (b). **Size:** M. **Depends on:** SC-07, SC-14, SC-24, SC-29.
- **Evidence:** P `src/plugin/screens/lobby.ts:11–46`, `src/plugin/screens/lobby.ts:48–70`; P `src/plugin/screens/setup.ts:19`, `src/plugin/screens/setup.ts:38–40`; P `src/match/setup.ts:21–24`; P `docs/specs/chatgpt-mvp/spec.md:34`.
- **Web today:** It has no open-game list, Accept, or matching UI. Its modes are in W `src/new-game.ts:26–27`.
- **Change and risk:** Use feature marks, age, Accept, Find, and the empty state. Normal Find matches the five switches; Any rules takes the oldest game regardless of them. Counts appear only at ten or more players. Reuse an eligible own open game. Keep a Join/Accept name return and the message when another player takes the seat. Replace MCP calls and the app poll target. Risk: accepting a game with different rules without clear words, duplicate open games, or an old list reply replacing the current screen.
- **Owner taste:** Yes for adding online matching. D1 a and the matching words are approved for the plugin.

### SC-14 — Wait, play the computer, and switch back

- **Kind:** (b). **Size:** M. **Depends on:** SC-13, SC-15, SC-16, SC-29.
- **Evidence:** P `src/plugin/screens/wait.ts:13–65`, `src/plugin/screens/wait.ts:86–142`; P `src/plugin/index.html:50`; P `src/plugin/poll.ts:3–16`; P `docs/specs/chatgpt-mvp/spec.md:34`.
- **Web today:** The computer starts locally. There is no waiting human game beside it. W `src/screen/play.ts:642–669`.
- **Change and risk:** Use the elapsed wait, Cancel, 25-second computer offer, background human-game watch, and Opponent found dialog. Switch now ends the temporary computer game with no result. Not now leaves the human game in Your games. The open game lasts 24 hours. Replace the host teardown message and app poll with page lifecycle and one web poll. Risk: a failed switch starts another computer game, loses the human game, or records an unwanted loss.
- **Owner taste:** Yes for the web handoff. The plugin behavior is specified.

### SC-15 — Your games, Resume, and Next game

- **Kind:** (b). **Size:** M. **Depends on:** SC-29, SC-30; use SC-11 for known invite rows.
- **Evidence:** P `src/plugin/games-list.ts:7–52`; P `src/plugin/next-game.ts:3–6`; P `src/plugin/app.ts:318–326`, `src/plugin/app.ts:598–621`; P `src/plugin/screens/board.ts:400–402`. Owner J3/J10: P `docs/specs/taste-recommended/issues/06-fix-join.md:44–47`, `docs/specs/owner-decisions-2026-10-15/issues/02-home.md:11–13`.
- **Web today:** One autosave supplies Home. There is no active-game inbox. W `src/screen/save.ts:11–26`, `src/ui/home.ts:19–40`.
- **Change and risk:** Use `gamesList()`, date helpers, waiting and turn labels, and pure `nextGame()`. A ready person game comes before a computer game. On a human board, Next game appears after the player's turn when another game needs that player. It is a board action, not an automatic end-card action. Replace resume tools with web actions and refresh the inbox after a sent turn. Risk: local and server games share one save slot, or Resume names a different game from the one it opens.
- **Owner taste:** Yes for the web list and next-game placement. Preserve person-first order if the approved plugin flow is used.

### SC-16 — Server board, staged turn, and recovery

- **Kind:** (b). **Size:** M for the view connection; SC-29 is L. **Depends on:** SC-07, SC-29, SC-30.
- **Evidence:** P `src/plugin/screens/board.ts:68–92`, `src/plugin/screens/board.ts:173–209`, `src/plugin/screens/board.ts:321–329`, `src/plugin/screens/board.ts:460–520`; P `src/plugin/screens/board-model.ts:26–92`; P `src/plugin/client.ts:8–12`, `src/plugin/client.ts:31–43`. Owner W7/T1–T7: P `docs/specs/send-turn/issues/03-board-draft-play.md:23–29`.
- **Web today:** It already stages a turn, permits Undo, and commits at End turn or sends a game link. It owns a local `Game`. W `src/screen/play.ts:160–174`, `src/screen/play.ts:672–674`.
- **Change and risk:** Use the server view reader, legal move list, replay helpers, unsent LAN draft, base-FEN check, and one command ID per retry. Keep Undo, sword, Menu; name the sword End turn against the computer and Send your turn against a person. Copy the state rules, not the global plugin board controller. Replace widget private state with web state. Risk: stale replies restore another game; moves send twice; a valid draft disappears; local rules leak between two games. SC-01 supplies the same renderer, but not this server flow.
- **Owner taste:** The turn choices are approved. The web server-game entry and save contract need approval. Duplicate sends and stale-state faults have one correct fix.

### SC-17 — Abort, draw, resign, and deadline claims

- **Kind:** (b). **Size:** M. **Depends on:** SC-16, SC-29.
- **Evidence:** P `src/plugin/screens/board-actions.ts:8–44`; P `src/plugin/screens/board-model.ts:13–18`, `src/plugin/screens/board-model.ts:95–100`; P `src/plugin/screens/board.ts:166–171`, `src/plugin/screens/board.ts:427–434`. Owner J7, W8, B1, B3: P `docs/specs/owner-decisions/issues/05-board-actions.md:8–20`.
- **Web today:** Resign is in Menu with confirmation. The local game has no human-server draw reply, abort window, or deadline claim. W `index.html:205`, `index.html:227`; W `src/ui/menu.ts:47–50`.
- **Change and risk:** Use the pure action availability and confirmation views. Put Resign, Offer draw, and Abort in Menu. Keep draw replies by the board. Name the abort's no-result limit. Show time left and Claim the win or End game when the server view allows it. Keep the short last-move line at short heights. Replace tool commands with web commands. Risk: local play gets a false deadline, or the UI offers an action that the fresh server state forbids.
- **Owner taste:** Yes for adding actions to web server play; their plugin placement is approved. Do not add deadlines to local games without a new rule choice.

### SC-18 — Stale board, Retry, and player block

- **Kind:** (b). **Size:** M. **Depends on:** SC-16, SC-21, SC-29.
- **Evidence:** P `src/plugin/app.ts:282–313`; P `src/plugin/screens/board.ts:71–79`, `src/plugin/screens/board.ts:378–403`; P `src/plugin/screens/board-actions.ts:47–70`; P `src/plugin/screens/profile.ts:56–81`, `src/plugin/screens/profile.ts:134–139`.
- **Web today:** Local play needs no server read. Account failures can leave local play available. W `src/main.ts:196–197`.
- **Change and risk:** Use the server-board rule: keep the last view, mark it Not current, and lock writes until a good read. Quiet connection failures show an error after three failed polls. Retry keeps the command ID. Use the block read, confirmation, status, and paged unblock list. These views use app notices, MCP tools, and the shared overlay. Replace those connections. Risk: a poll hides a refused action, Retry repeats a successful write, or a block is presented as an end to the current game. The code says the current game continues.
- **Owner taste:** No for correct stale-state and retry behavior. Yes for new web block placement and words. The report flow has no plugin screen to lift; see SC-34.

### SC-19 — Beginner notes on the board

- **Kind:** (b). **Size:** S. **Depends on:** SC-02.
- **Evidence:** P `src/plugin/screens/board.ts:355–366`, `src/plugin/screens/board.ts:381`; P `src/read.ts:216–225`; W `src/ui/table.ts:216–220`; W `src/screen/play.ts:175–184`. Owner J8 and W2: P `docs/specs/taste-recommended/issues/04-owner-decisions.md:8–10`; P `docs/specs/owner-decisions-2026-10-15/issues/02-home.md:17–19`.
- **Web today:** It has piece rules, moment captions, a lesson shelf, and Previously. It does not pass the plugin's Beginner teaching state into the table.
- **Change and risk:** Use `teachNote()` after an enemy fairy move, once per action kind in a game. Use the selected piece's lesson text and the first new-piece note. These helpers have no host dependency; their state currently sits in the plugin board. Add them to the web context state with its existing priority rules. Risk: a note covers check, a refusal, or Previously; a long note reduces board space.
- **Owner taste:** Yes for the web teaching layer and how it shares space with existing lessons.

### SC-20 — Symbols-only look and online visibility settings

- **Kind:** (b). **Size:** M. **Depends on:** SC-01, SC-28, SC-29, SC-31.
- **Evidence:** P `src/plugin/board-view.ts:11–27`; P `src/plugin/app.ts:628–662`; P `src/plugin/settings.ts:8–23`; P `src/plugin/index.html:64`. W `src/screen/settings.ts:9–20`, `src/screen/settings.ts:33–48`.
- **Web today:** It has piece letters, threats, coordinates, sound, auto-queen, and motion pace. It has no symbols-only control or online-visibility control.
- **Change and risk:** Use symbol loading and `setSymbols()` on the web's existing board. Do not create a second `PaintedView` from the plugin module. Connect online visibility to the account. Keep its three states and accurate friends-only help: the plugin has no follow UI, so friends-only currently shows presence to nobody through that UI. Keep the web's other controls. The plugin makes sound device-only and off by default; the web has another default. Risk: importing all settings changes sound or motion without approval, or settings stored in two places disagree.
- **Owner taste:** Yes for the new look, online settings, and any changed default.

### SC-21 — Profile scroll and game record

- **Kind:** (b). **Size:** M. **Depends on:** SC-15, SC-22, SC-23, SC-24, SC-29.
- **Evidence:** P `src/plugin/screens/profile.ts:13–54`, `src/plugin/screens/profile.ts:108–131`; P `src/plugin/index.html:61`; P `docs/specs/chatgpt-mvp/issues/16-profile-and-collection.md:8–13`, `docs/specs/chatgpt-mvp/issues/16-profile-and-collection.md:50–55`.
- **Web today:** Account shows the provider name and picture, sign-out, and deletion. It has no game registry or totals. W `src/account/account.ts:37–54`.
- **Change and risk:** Use the profile reader/view split, totals, open-game rows, finished-game rows, date and feature marks, More cursor, and request guard. The approved scroll uses matte wood rollers. Finished rows are list items; they do not open replays. The data comes through `_meta` on `kingdown_profile`, not through the current web profile route. Replace the service and overlay connections. Risk: a late More reply appends to a different account or a fresh profile; a new scroll loses the web's existing review path.
- **Owner taste:** Yes for the web profile design. Its plugin content and scroll treatment are approved.

### SC-22 — Ratings in profile, board strips, and end card

- **Kind:** (b). **Size:** S for display. **Depends on:** SC-16, SC-21, SC-26, SC-29.
- **Evidence:** P `src/plugin/screens/profile.ts:38–40`; P `src/plugin/screens/board-model.ts:8–12`; P `src/plugin/screens/board.ts:294–297`, `src/plugin/screens/board.ts:520`; P `src/plugin/screens/end.ts:103–110`; P `src/match/results.ts:22–34`. Owner Q10/W8: P `docs/specs/chatgpt-mvp/spec.md:46`.
- **Web today:** Player strips show You, a colour, Your friend, or Computer and its level. W `src/ui/table.ts:192–200`. There is no visible game rating.
- **Change and risk:** Use rating display helpers. Profile shows a number with ? while provisional. Board and end show New player and no rating change while provisional. Human server games change ratings; computer games do not. Do not treat a local computer level as a rating. Risk: a client calculates a rating from unsent or local results, or shows a delta that the service does not supply.
- **Owner taste:** Yes for adding rated server play to the web. Rating math and result rules belong to the account/game lanes.

### SC-23 — Ten badges and earned dates

- **Kind:** (b). **Size:** M. **Depends on:** SC-21, SC-26, SC-28, SC-29; SC-31 for local records.
- **Evidence:** P `src/match/badges.ts:4–24`; P `src/plugin/screens/profile.ts:19–20`, `src/plugin/screens/profile.ts:83–106`; P `src/plugin/screens/end.ts:112–116`; W `src/ui/tricks.ts:14–29`, `src/ui/tricks.ts:38–42`.
- **Web today:** It awards local trick seals. It has no ten-badge profile.
- **Change and risk:** Use the badge definitions, goal text, art, earned dates, and detail sheet. The set is First Win, Friend Match, Stranger Match, Purist, Fairy Tale, Architect, Card Sharp, Crowned, Royal Collection, and Giant Slayer. The end card shows the first new badge; Profile shows the full set. Replace widget sheet memory and profile calls. Risk: calling seals badges changes their meaning; local wins never reach the server; several new badges are hidden by a one-badge end view.
- **Owner taste:** Yes for the new rewards and for how they sit beside seals. Do not replace seals without approval.

### SC-24 — Public name and preset picture

- **Kind:** (b). **Size:** M. **Depends on:** SC-29, SC-30; keep SC-43.
- **Evidence:** P `src/plugin/app.ts:557–596`, `src/plugin/app.ts:247–250`, `src/plugin/app.ts:273–274`; P `src/plugin/index.html:65`; P `src/plugin/screens/join.ts:54–55`; P `src/plugin/screens/lobby.ts:55–57`; P `src/plugin/service.ts:73–85`.
- **Web today:** Its account display reads the provider's name and picture. It has no public handle picker. W `src/account/account.ts:25–33`, `src/account/account.ts:48–50`.
- **Change and risk:** Use the name form, preset pictures, validation, one-at-a-time availability checks, and return to the interrupted Join/Accept/start. Keep login identity separate from the public game identity. Remove the host resume logic. The web service needs handle check and picture updates, not just the current set-handle call. Risk: a provider picture becomes the public picture, or saving a name sends the wrong pending action.
- **Owner taste:** Yes for public identity on the web. Name validation and correct return flow are faults when they fail the approved contract.

### SC-25 — Collection of pieces, kings, powers, and cards

- **Kind:** (b). **Size:** S. **Depends on:** SC-08, SC-28; no account is needed for the content itself.
- **Evidence:** P `src/plugin/screens/collection.ts:13–43`; P `src/plugin/index.html:62`; W `src/ui/guide.ts:26–70`; W `src/workshop/ground.ts:6–10`, `src/workshop/ground.ts:59–72`.
- **Web today:** Guide has piece and king-power rules. Workshop has kings and lab cards. It has no four-tab Collection for the playable set.
- **Change and risk:** Use the four tabs, complete rule rows, six kings, twelve powers, and 21 deal cards. All are unlocked. Replace `client.state.sheet` with a local tab state. Use the selected rules when a view promises current-game rules; the plugin uses `kingRules` for powers and `DEFAULT_RULES` for card text. Risk: the Collection suggests a locked reward system, or lab cards and match cards look like one supported set. Cost words requested by J6 are absent from its card rows; see SC-32.
- **Owner taste:** Yes for a separate Collection and its entry point. The content does not need a sign-in gate.

### SC-26 — End card, plain result, and immediate actions

- **Kind:** (b). **Size:** M. **Depends on:** SC-22, SC-23, SC-27; SC-29 for server results.
- **Evidence:** P `src/plugin/screens/end.ts:19–29`, `src/plugin/screens/end.ts:76–149`; P `src/plugin/ending.ts:4–29`; P `src/plugin/screens/board.ts:418–424`; P `src/plugin/screens/end.css:1–6`, `src/plugin/screens/end.css:19–59`. Owner J4 c, W9 a, C4 c: P `docs/specs/owner-decisions-2026-10-15/issues/06-end.md:7–24`, `docs/specs/owner-decisions-2026-10-15/issues/06-end.md:36–55`.
- **Web today:** It replays the final blow, then opens the result dialog. It offers move tiles, Review, Rematch, New game, Close, and a daily-result copy. Result detail includes the last move. W `src/game-end.ts:51–83`; W `src/ceremony.ts:126–150`; W `src/screen/moments.ts:114–128`; W `index.html:266–282`.
- **Change and risk:** Use plain seat-based results, server end reasons, immediate actions, See the board, Game result, Skip, the one-second live-result action guard, and scroll rules for small screens. Keep calm draws/losses and no abort ceremony. Only a checkmate win gets the short fall and card rise. The plugin shares ceremony CSS, but does not call the web's `startCeremony()`; it uses its own short timer flow. Replace app notices, host teardown, and table moves. Risk: losing Review or daily share, an old board press starts a new game, or an end poll closes Moves.
- **Owner taste:** Yes. Applying the plugin result treatment to the web changes an existing approved web experience.

### SC-27 — Rematch, Play again, and next setup

- **Kind:** (b). **Size:** M. **Depends on:** SC-05, SC-07, SC-16, SC-26, SC-29.
- **Evidence:** P `src/plugin/screens/end-model.ts:2–5`; P `src/plugin/screens/end.ts:32–74`, `src/plugin/screens/end.ts:119–140`; P `src/plugin/screens/setup.ts:209–211`; P `src/plugin/router.ts:6–9`. W `src/screen/play.ts:638–663`, `src/screen/play.ts:678–683`.
- **Web today:** Rematch keeps the army and swaps sides. New game starts a fresh random army directly from the result close handler. It has no rematch offer/accept/decline watch.
- **Change and risk:** Use human rematch negotiation and the watch for the agreed game. Keep its features and swap colours. For a computer, Play again keeps rules and colour. New game opens setup with the ended game's choices. An explicit computer abort returns to that setup, without an end ceremony. The plugin routes through app state and polls; local play can use callbacks. Risk: changing the web's existing colour-swap rule without approval, creating two rematches, or losing the setup after Abort.
- **Owner taste:** Yes for these web behavior changes. The plugin choices are approved; the local rematch difference needs a web decision.

### SC-28 — Art, stone controls, and screen-size rules

- **Kind:** (b). **Size:** M. **Depends on:** the screens that adopt these parts.
- **Evidence:** P `src/plugin/art.ts:1–3`; P `src/plugin/card-face.ts:7–12`; P `src/plugin/app.css:128–138`, `src/plugin/app.css:154–164`; P `src/plugin/screens/board.css:17–19`, `src/plugin/screens/board.css:39–62`. Owner C1/L0/L3: P `docs/specs/taste-recommended/issues/04-owner-decisions.md:8–16`; owner G1/G2/G3/Q3/Q6: P `docs/specs/owner-decisions/issues/26-picks.md:27–39`, `docs/specs/owner-decisions/issues/26-picks.md:79–113`; K1/K2: P `docs/specs/chatgpt-mvp/issues/37-k-picks.md:26–32`.
- **Web today:** It has painted art, parchment, stone, game fonts, round power coins, and the table. W `src/main.ts:67–69`; W `src/ui/guide.ts:16–24`; W `src/style.css:4–20`.
- **Change and risk:** Lift the new badge and scroll assets, card faces, scoped control styles, and needed small-screen rules. Keep round coins. Spent card coins dim to 0.85. Own-piece shove/swap uses a second target press. Armed target words come first. Draw replies keep board size and permit page scroll. Collection tabs keep whole words. Card strips use two rows through 440 px; Resume uses two lines. Most rules are plugin-scoped and do not arrive through the shared table CSS. `art()` uses build-time URLs for a frame; web paths can use the existing public assets. Do not copy composer spacing or fullscreen frame rules.
- **Owner taste:** Yes for a web sample. D5 system-font work and D3 hall presets/chest are not proved present by these sources. The Q6 ticket says it takes only two CSS parts from the separate look branch. Treat the rest as **unverified**, not as merged features.

## (c) Web work with no complete plugin equivalent

### SC-29 — Web service and session connection

- **Kind:** (c). **Size:** L. **Depends on:** account, API, and hosting survey results; keep SC-43.
- **Evidence:** W `src/main.ts:75–92`, `src/main.ts:196–197`; P `src/plugin/client.ts:24–43`; P `src/plugin/service.ts:33–49`, `src/plugin/service.ts:65–85`; P `src/online/client.ts:17–34`, `src/online/client.ts:40–67`; P `src/api/http.ts:61–94`. P `docs/specs/chatgpt-mvp/issues/19-release.md:37` says the combined release exposes no website API.
- **Web today:** Account code supplies cloud save. The game screen does not use `onlineClient`. A targeted search in the web entry, screen, UI, account, new-game, game-end, and Workshop files finds no `onlineClient` or plugin tool calls. The existing web client has useful calls for create, get, commands, invite/redeem, inbox, and account operations.
- **Change and risk:** Supply the browser's session token to a web game service. Expose the needed routes and return typed views to the screens. Add the missing equivalents of plugin preview, lobby, Find/Accept/Cancel, settings/last setup, handle availability, and game record/history. The current `/api/me/profile` calls the account profile; it is not the plugin's record/history response. Keep this work with the API lane. Risk: assuming `/mcp` is a browser API, importing server code into the web bundle, or sending an action without the proper session and revision. Live route availability is **unverified**; no live call runs.
- **Owner taste:** The service connection has no taste choice. Which online features the web exposes and when it asks for sign-in need the approved web spec.

### SC-30 — Web addresses, Back, reload, and sign-in return

- **Kind:** (c). **Size:** M. **Depends on:** SC-29, SC-43.
- **Evidence:** P `src/api/http.ts:69–81` creates `/j/<token>` links. P `src/plugin/app.ts:458–533` uses host fullscreen, queued routes, and private state instead. W `src/main.ts:28–61`, `src/main.ts:178–204` handles query-based game/design links; W `src/account/client.ts:29–31` returns sign-in to the current origin and path.
- **Web today:** It parses army, FEN, moves, rules, kings, and design parameters. There is no Join route in that parser. Its modals are not the plugin's routed pages.
- **Change and risk:** Add a web entry for a code/token and server game, preserve it through sign-in, load the preview, and restore the correct page after Back or reload. Keep old game/design links readable. Replace widget `queued`, fullscreen requests, and board selection IDs with web navigation. The exact host rewrite for `/j/` is **unverified** in this lane. Risk: a link opens a local random game, login loses the invite, or Back returns to another player's last visible game.
- **Owner taste:** Yes for URL form and browser Back behavior. Correct return to the chosen game is a fault requirement after approval.

### SC-31 — Local play beside the account record and settings

- **Kind:** (c). **Size:** L. **Depends on:** SC-07, SC-10, SC-20–SC-24, SC-29.
- **Evidence:** W `src/screen/save.ts:11–19`; W `src/account/account.ts:78–87`; W `src/main.ts:109–112`, `src/main.ts:130–131`; P `src/plugin/settings.ts:8–23`; P `src/match/results.ts:22–58`; P `src/plugin/screens/setup-model.ts:5–7`.
- **Web today:** One local save holds a game and board settings. Account sync copies saved sections. The next setup has its own local key. Local games, daily results, lesson progress, and trick seals do not enter the plugin's server game record through this path.
- **Change and risk:** Define what Profile counts for local play. Connect web settings names to account settings without overwriting the local save or saved custom setup. Preserve a local game while server games exist. Define hidden arrangement for two players on one device; the plugin assumes one seat per signed-in view. No plugin screen settles these web-only cases. Do not count an imported local win as a rated human result. Risk: false rating or badge claims, loss of offline play, or sync replacing a live server game.
- **Owner taste:** Yes. Pick the local-versus-server record rule, setup defaults, and local handover in the web spec. Preserve existing local saves while that work is planned.

### SC-32 — Approved card actions that have no implementation to lift

- **Kind:** (c). **Size:** M. **Depends on:** SC-08, SC-16, SC-25, SC-28.
- **Evidence:** Owner J6/L1/F38: P `docs/specs/owner-decisions/issues/07-cards.md:9–13`, `docs/specs/owner-decisions/issues/07-cards.md:21–25`, `docs/specs/owner-decisions/issues/07-cards.md:39–49`, `docs/specs/owner-decisions/issues/07-cards.md:62–64`. Actual code: P `src/plugin/screens/board.ts:258–279`, `src/plugin/screens/board.ts:305–315`; P `src/plugin/screens/collection.ts:39–41`.
- **Web today:** There is no match card UI. Its power coin opens a read state and a separate Use action. W `src/ui/powers.ts:11–25`.
- **Change and risk:** J6 asks for a press on an own usable card/power to arm it at once, with cost/target words and a result line after use. The current plugin still opens a read sheet with Use. Missing board card art still uses a card back and short letters; `cardArt()` is not called in that loop. Collection card rows show rules and Unlocked, but no cost. These approved improvements need new web work if they enter the web spec. Do not report them as implemented reuse. Risk: rebuilding the old extra-step flow and claiming the approved flow, or copying the known weak card-letter treatment.
- **Owner taste:** The plugin intent is approved. Inclusion in the web build needs approval. The full web version and its sample are still open; no implementation result is claimed.

## (d) Plugin-only parts that the web does not need

### SC-33 — Inline card, host expansion, widget messages, and frame

- **Kind:** (d). **Size:** S. **Depends on:** none; SC-30 replaces the navigation need.
- **Evidence:** P `src/plugin/app.ts:34–37`, `src/plugin/app.ts:127–128`, `src/plugin/app.ts:339–352`, `src/plugin/app.ts:447–478`, `src/plugin/app.ts:520–533`; P `src/plugin/client.ts:17`, `src/plugin/client.ts:24–43`; P `src/plugin/screens/friend.ts:75–81`.
- **Web today:** It is a top-level page with its own controls and saves. W `src/main.ts:28`, `src/main.ts:152–197`.
- **Change and risk:** Exclude `window.openai`, `setWidgetState`, host model context, tool-result mount, resource-teardown messages, fullscreen request/decline, inline queued Resume, safe-area host events, and composer frame gaps. They serve ChatGPT's embedded page. Keep the useful stale-call and retry rules through SC-16/SC-29. Risk: copying the host shell leaves web actions behind an inline card or reserves space for a nonexistent composer.
- **Owner taste:** No. These are host requirements. A web design choice does not require this host code.

### SC-34 — Chat entry and tool-only flows

- **Kind:** (d). **Size:** S. **Depends on:** SC-11/SC-12 for web invite entry.
- **Evidence:** P `src/plugin/screens/friend.ts:53`; P `src/plugin/app.ts:381–403`; P `src/plugin/client.ts:37–43`; P `src/plugin/service.ts:51`; P `src/plugin/screens/board-actions.ts:23–44`, `src/plugin/screens/board-actions.ts:47–70`; P `docs/specs/taste-recommended/issues/06-fix-join.md:59–67`.
- **Web today:** Web players use page controls and links. There is no chat command surface.
- **Change and risk:** Do not port instructions to say a code in ChatGPT, MCP tool summaries, or chat-driven screen selection. A report service method is not a Report screen: the inspected board menu offers block, not report. There is also no implemented hall chest/preset screen in the current hall markup at P `src/plugin/index.html:38–43`; the ticket assigns it to a later hall part. Exact J1 chat-draft and D3 preset details remain **unverified** here. Risk: treating an approved plan or service method as a shipped screen.
- **Owner taste:** No for excluding host-only entry. A future web report or preset UI needs its own approved scope; no finished plugin view is available to lift.

## (e) The web already has this part

### SC-35 — Local Home and first visit

- **Kind:** (e). **Size:** S, no gap. **Depends on:** none.
- **Evidence:** W `src/main.ts:80–87`, `src/main.ts:164–171`, `src/main.ts:194`; W `src/ui/home.ts:19–46`; W `src/ui/home-view.ts:19–62`; W `src/ui/title.ts:14–41`.
- **Web today:** It has a title, a first Beginner deal, a returning Home, Continue, Rematch, Review, New game, and today's army. The plugin's Home does not supply these local flows.
- **Change and risk:** Keep these paths when adding SC-05. No duplicate Home is needed for local play. Risk: a server-first hall makes a signed-out visitor wait for account settings.
- **Owner taste:** No for keeping working paths. Replacing or moving them needs approval.

### SC-36 — Four computer levels

- **Kind:** (e). **Size:** S, no level-menu gap. **Depends on:** none.
- **Evidence:** W `src/new-game.ts:44–45`, `src/new-game.ts:155–178`; W `src/ai/skill.ts:19–24`; P `src/plugin/screens/setup.ts:20`, `src/plugin/screens/setup.ts:41`; P `docs/specs/chatgpt-mvp/spec.md:51`.
- **Web today:** Beginner, Casual, Club, and Strong already exist. New-game default is Club. Each level uses the shared skill plan.
- **Change and risk:** Reuse the current levels and explanations. The plugin does not add another difficulty ladder. SC-06 adds quick-start behavior and SC-19 adds Beginner notes. Risk: mistaking server computer play or a rating for a new level system.
- **Owner taste:** No, unless defaults or level behavior change.

### SC-37 — Today's army and its result share

- **Kind:** (e). **Size:** S, no daily-army gap. **Depends on:** none; SC-31 applies if its result enters Profile.
- **Evidence:** W `src/main.ts:111–112`, `src/main.ts:132`, `src/main.ts:145`; W `src/ui/home.ts:49–53`; W `src/screen/moments.ts:38–50`, `src/screen/moments.ts:126–127`, `src/screen/moments.ts:175–180`. P `src/match/protocol.ts:37–47`; P `src/plugin/screens/setup.ts:36–50`.
- **Web today:** The local date seeds the same army for everyone on that date. The result can be copied. The plugin setup has no today's-army control. Its daily game speed means a delayed human reply, normally three days per move. It is a different flow.
- **Change and risk:** Keep the web daily army and result action. Add human daily games through SC-13–SC-17. Risk: the same word Daily makes users expect the wrong army or deadline. Cross-device dates can differ near midnight; that follows the current local-date code.
- **Owner taste:** No for keeping today's army. Shared daily records or a UTC-date change need approval.

### SC-38 — Lessons, review, key moments, and Previously

- **Kind:** (e). **Size:** S, no local learning/review gap. **Depends on:** none.
- **Evidence:** W `src/lesson-shelf-ui.ts:6–21`, `src/lesson-shelf-ui.ts:41–49`; W `src/lesson-shelf.ts:26–38`; W `src/screen/play.ts:324–356`; W `src/review.ts:1–4`; W `src/screen/moments.ts:131–170`; W `src/previously.ts:18–55`; W `src/ui/previously.ts:23–64`. P `src/plugin/screens/profile.ts:122–131`; P `src/plugin/screens/board.ts:162`, `src/plugin/screens/board.ts:434`.
- **Web today:** It teaches six pieces, stores progress, keeps the game separate from a lesson, reviews positions, finds key moments, and replays the friend's last linked turn. The plugin has move text and live reply animation, but its finished profile rows do not open a replay. Its Beginner snippets are SC-19.
- **Change and risk:** Keep the richer local flows. If server history enters the same Review screen, connect it deliberately through SC-16; do not call a text Moves sheet a review replacement. Risk: a new result flow removes Review, or a lesson saves over the match.
- **Owner taste:** No for keeping these flows. New entry points and server-game review need approval.

### SC-39 — Workshop, designs, and the card lab

- **Kind:** (e). **Size:** S, no Workshop gap. **Depends on:** none.
- **Evidence:** W `src/main.ts:96–106`, `src/main.ts:198–203`; W `src/workshop/ground.ts:1–11`, `src/workshop/ground.ts:59–72`; W `src/new-game.ts:91–101`, `src/new-game.ts:165–167`, `src/new-game.ts:220–229`; P `src/plugin/screens/collection.ts:25–41`.
- **Web today:** It makes and tests pieces, saves designs, opens design links, and brings a design into a game. Kings and lab cards have test views. Plugin Collection is a rule catalogue, not a design editor.
- **Change and risk:** Keep Workshop and Bring a design when SC-07 adds setup choices. Use Collection for the playable catalogue without presenting all lab cards as dealt cards. Risk: plugin setup removes the design path or lists unsupported designs in a server game.
- **Owner taste:** No for keeping current local tools. Server support for custom designs needs a separate approved scope.

### SC-40 — Local friend links and explicit turn handover

- **Kind:** (e). **Size:** S, no local-link gap. **Depends on:** none.
- **Evidence:** W `src/screen/links.ts:9–23`, `src/screen/links.ts:44–65`; W `src/main.ts:178–187`; W `src/screen/play.ts:160–174`; W `src/turn.ts:55–84`.
- **Web today:** A link carries the army/position, moves, kings, and design. The receiver continues locally. End turn or Send your turn controls handover. This needs no account or server inbox.
- **Change and risk:** Keep this route beside server friend games until the owner approves another plan. Server codes, deadlines, record, and rematch are separate gaps above. Risk: calling the current share link an online room, or replacing a local save when opening a server invite.
- **Owner taste:** No for preservation. Retirement or a changed Share action needs approval.

### SC-41 — Threats, sound, motion, and board help

- **Kind:** (e). **Size:** S, no existing-control gap. **Depends on:** none.
- **Evidence:** W `index.html:202`, `index.html:208–212`; W `src/screen/settings.ts:24–48`, `src/screen/settings.ts:61–80`; P `src/plugin/index.html:64`, `src/plugin/app.ts:628–642`.
- **Web today:** Threats, sound, motion pace, coordinates, piece letters, and auto-queen already work through the web controls and save. The plugin repeats threats and sound, adds symbols-only and online visibility, and omits several web controls.
- **Change and risk:** Keep the existing controls. Add only SC-20's missing choices. Risk: importing plugin settings silently makes sound off, motion Fast, or removes board help.
- **Owner taste:** No for keeping controls. A changed default is a taste call.

### SC-42 — Painted board, rules, and king-power reads

- **Kind:** (e). **Size:** S, no basic board/king-picker gap. **Depends on:** none.
- **Evidence:** W `src/main.ts:67–79`; W `src/new-game.ts:134–153`; W `src/ui/powers.ts:11–25`, `src/ui/powers.ts:38–60`; W `src/ui/guide.ts:26–70`; P `src/plugin/board-view.ts:7–10`, `src/plugin/screens/board.ts:1–9`.
- **Web today:** It already uses the painted board, shared legal rules, rule readers, king emblems, power use, and board marks. The plugin builds on those same parts.
- **Change and risk:** Keep the web renderer and controller for local play. Lift the missing card/server parts through SC-08/SC-16, and the chosen interaction changes through SC-28/SC-32. Risk: replacing the whole web board to gain one server screen removes local review, lessons, and custom designs.
- **Owner taste:** No for keeping shared parts. New board interactions need the approved web sample.

### SC-43 — Web sign-in, sign-out, and cloud save

- **Kind:** (e). **Size:** S, no basic sign-in gap. **Depends on:** none; SC-29/SC-30 connect it to new flows.
- **Evidence:** W `src/account/account.ts:1–5`, `src/account/account.ts:37–54`, `src/account/account.ts:78–87`, `src/account/account.ts:111–136`; W `src/account/client.ts:15–38`; W `src/main.ts:196–197`.
- **Web today:** It already signs in with Google or GitHub, signs out, deletes the account, and syncs settings, lessons, and the saved game. Facebook is gated. No account is required for local play.
- **Change and risk:** Use the existing browser session. The plugin's ChatGPT sign-in is not the web sign-in. Remaining gaps are the game API token connection, the public handle, and return to a pending web action. Risk: building a second account path or requiring login for local play. Live provider configuration is **unverified**.
- **Owner taste:** No for the existing sign-in. A new sign-in gate or identity-link flow needs approval.

### SC-44 — Trick seals

- **Kind:** (e). **Size:** S, no local reward gap. **Depends on:** none.
- **Evidence:** W `src/ui/tricks.ts:14–42`; W `src/screen/play.ts:164–168`; W `index.html:215–224`; P `src/match/badges.ts:4–24`.
- **Web today:** A completed turn can earn a local trick seal. Menu marks an unseen seal and opens its riddle or found rule. The plugin's ten result badges use different conditions.
- **Change and risk:** Keep seals. Add Profile badges as SC-23 if approved. No code evidence supports treating one as the other. Risk: merging the counts gives a false earned state or removes discoveries from local play.
- **Owner taste:** No for keeping seals. Their placement beside badges is a new choice.

## Open questions for the owner

Only web choices remain below. The named plugin decisions are records, not questions to answer again.

1. **Where does the new Play hall sit?** Options: (1) keep local Home and add the hall as an online entry; (2) make one hall for local and server games. **Pick: 2**, with a visible local Continue and local Play now. This keeps the new features together without making local play wait for sign-in. A web sample must show first visit, a local save, and server games. Covers SC-05, SC-15, SC-35.
2. **Which plugin setup rules become web defaults?** Options: (1) keep current local defaults and add advanced choices; (2) use the five switches and plugin defaults for new games, while keeping old saves and local two-player/design/daily choices. **Pick: 2**, with an explicit local two-player setup step. Do not change old games in place. Covers SC-07–SC-10, SC-31.
3. **Which local games count in Profile?** Options: (1) Profile counts server games; local progress stays local; (2) add a separate local record; (3) upload local results for badges, but never human ratings. **Pick: 1** for the first web build. Mark the record's scope. Keep seals and lessons as they are. Covers SC-21–SC-23, SC-31, SC-44.
4. **How do friend invites enter the web app?** Options: (1) code entry and a link to the same preview; (2) code entry only. **Pick: 1**. Keep old whole-game links distinct. Ask for sign-in when the server flow needs it, preserve the chosen invite, and require Join after the preview. Covers SC-11, SC-12, SC-24, SC-30, SC-40.
5. **Does the plugin end flow replace the local end flow?** Options: (1) use the new plain end card and immediate actions for both; (2) keep the current local final-blow review and use the new end flow for server games. **Pick: 1**, but retain Review, daily-result copy, and local move history. Use the approved short checkmate-win motion and calm draw/loss treatment. Covers SC-26, SC-38.
6. **Which colour does local Play again use?** Options: (1) keep the web's current swap; (2) keep colour against the computer, and swap it for a human rematch. **Pick: 2**, to match the plugin's approved words. New game opens setup instead of starting a random army without a choice. Covers SC-27.
7. **Do the new look and controls apply across the web?** Options: (1) add needed assets and screen rules; (2) copy the full plugin look. **Pick: 1**. Keep the game fonts and existing web motion/sound controls. Add symbols-only as a choice. Use a rendered web sample for the new card strips, profile, and end card. Do not claim D5 or D3 as complete without their source tickets and code. Covers SC-20, SC-28, SC-41.
8. **Does the first web card build include J6?** Options: (1) build the approved press-then-target action and missing cost/result text now; (2) first use the current read-sheet/Use flow. **Pick: 1**, with one small sample that shows own, opponent, spent, and unavailable cards. This requires new code; it is not a completed plugin feature. Covers SC-08, SC-25, SC-32.
