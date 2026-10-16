# Private release live checks

Run only after the owner gives the word and ticket 18 passes. Use test accounts A and B, each on ChatGPT web and the iPhone app. Use no owner account. Record the release commit, device versions, time, and evidence with each result. All result cells start empty; preparation gives no live pass.

Each required row must pass before testers start. For the side-panel and sidebar only, record “not shown” and release without that entry. Record the observed “Always ask” behavior; the owner decides if repeated prompts block the private release. Stop on a required failure and use RUNBOOK.md.

| Check | Action and expected result | Result |
|---|---|---|
| Release identity | Record the release commit and UI resource hash. In a new chat, confirm the new setup controls. | |
| Account A · web | Add the new MCP connection. Sign in, approve, and open Play. | |
| Account B · web | Add the connection with a separate account. Confirm its own name, record, and games. | |
| Account A · iPhone | Use the same account as A web. Open the connection and Play. Record the actual app selector path. | |
| Account B · iPhone | Use the same account as B web. Open the connection and Play. | |
| Consent and isolation | Deny consent once. Reconnect. Switch accounts. Neither account sees the other's private games or settings. Old-resource tokens fail at the new MCP resource. | |
| Inline · web | “play King Down” shows Play and Your games. Both open the right fullscreen screen. | |
| Inline · iPhone | Repeat both inline actions. Board and controls fit; the composer does not cover them. | |
| Side-panel · web | Open the declared entry. Confirm the same home, Play, and saved account; or record not shown. | |
| Side-panel · iPhone | Repeat, or record not shown. | |
| Sidebar · web | Open the declared entry. Confirm the same home, Play, and saved account; or record not shown. | |
| Sidebar · iPhone | Repeat, or record not shown. | |
| Computer · web | Play each of Beginner, Casual, Club, Strong. Check White, Black, and Random across these games. The reply runs on its own. | |
| Computer · iPhone | Repeat all four levels. Tap a piece and destination; reopen and confirm the saved move. | |
| Friend · web | A uses Share first, then Copy. Both send the full invite with the code and rule names. Check the Ends line. Your games shows the code with Share. If Share is absent or refuses, it copies the invite. If Copy fails, the page says "Select the invite and copy it" and selects the full text. B joins by chat. Repeat with Join with a code. Check the preview rules and "Join and take White" or "Join and take Black" for the open side. Decline once, join, and finish a game. | |
| Friend · iPhone | Repeat with A and B on phones. Both pick their own king and order, then Ready. Orders stay hidden until both are ready. | |
| Random · web | A opens a game. B sees its features and Accept. Repeat with Find an opponent taking the oldest game. | |
| Random request twice · both devices | A starts a random game, then repeats the request before anyone joins. Your games shows one open random game. Cancel it once; no second open game remains. | |
| Create options · both devices | Friend and random chat requests with no options ask for game features or return a clear error. Open Play, choose features and Start game; the new game uses those features. No silent fixed setup starts. | |
| Report boundary · both devices | Chat does not list or call kingdown_report. The app has no Report or Block control. The report tool stays app-only on the server. Use the private test report channel. | |
| Random · iPhone | Repeat acceptance and Find. With no open opponent, wait 25 seconds, then play the computer. The open game stays. | |
| Opponent found · both devices | B joins while A plays the computer. Not now keeps the computer. Switch now opens the human game and ends the computer game with no result. | |
| Waiting game · both devices | Close ChatGPT and reopen Your games. The waiting game stays. Cancel my open game removes it. Confirm the 24-hour expiry with a due test game. | |
| Setup and code expiry | Confirm due test setups end with no result after three days. Confirm a due seven-day friend code fails. Do not change live data to shorten a deadline. | |
| Piece pool · both devices | Change the kinds. Locks prevent too small a pool. Arrangement keeps opposite-colour bishops and a guard next to the king. Shuffle gives a legal order. | |
| Card pool · both devices | Keep four checked; the last boxes lock. Both players get the same four. A played card leaves only that player's hand. | |
| King picker · both devices | Pick both powers where allowed. With Cards on, powers with uses stay unavailable. With powers off, White is Spirit and Black is Shadow. | |
| Actions · both devices | Offer draw and confirm; Accept draw or Decline draw and confirm. Resign opens Lay your king down? with Resign and Keep playing. Menu offers Abort before both first moves, End game for a missed first move, and Claim the win for a later missed deadline. Accept and decline a Rematch. Results and swapped colours are correct. | |
| End card · both devices | You win, You lose or Draw agrees with the result. Check the end reason, human Rating and change, ? while new, New badge where earned, Rematch or Accept/Decline and Your games. Your games opens the profile scroll. | |
| Resume and retry · both devices | Close a chat after a move. Resume in a new chat on the other device. One accepted move stays one move after Retry. | |
| Profile · web | Check open games first, turn marks, totals, history date, opponent, colour, result, end reason, feature icons, More, rating, and ten badge goals. Only human games change rating. | |
| Profile · iPhone | Repeat. Tap an open game to resume. Tap earned and unearned badges. | |
| Collection · both devices | Pieces, Kings, Powers, Cards all show rules and Unlocked. | |
| Settings · web to iPhone | Set Symbols only and Show threats through all four on/off pairs. Reopen on iPhone. The correct look and red threat arrows show. Last setup choices stay. | |
| Settings · iPhone to web | Repeat changes on iPhone. Web shows the saved settings and the correct profile. | |
| Art CSP · web | Open setup, board, profile, all badge details, and all Collection tabs. Art loads from the app origin. Check resourceDomains and resource_domains include that origin. No blocked art request appears. | |
| Art CSP · iPhone | Repeat screens. No missing painted piece, coin, scroll, badge, or card art. Record host CSP errors if available. | |
| Always ask · web | Set the connection to Always ask. Wait for B's move with the board visible for 15 seconds. Record approval prompts, count, and times for the three-second check. B moves; A's board updates. | |
| Always ask · iPhone | Repeat the same 15-second check and opponent move. Record prompt count and times. | |
| Poll stops · both devices | Hide the board, disconnect, and return to your own turn. The waiting check stops in those states. Reopen; the board reads current state. | |
| MVP jobs | The only active King Down schedules are tick, daily, and cron-history. No email or push arrives. Unsent outbox rows keep done_at null. | |

## Feature switch mixes

Run every row once on the web and once on the iPhone. Start a game, finish any seat setup, and make a legal move. Use computer mode for this matrix; the human mode rows above cover two-seat setup. Cards and powers remain legal together. “Off” in a hidden control means its stored value is off.

| Mix | Fairy pieces | Arrangement | Classic chess | Cards | King powers | Web result | iPhone result |
|---|---|---|---|---|---|---|---|
| 01 | On | Off | Off | Off | Off | | |
| 02 | On | Off | Off | Off | On | | |
| 03 | On | Off | Off | On | Off | | |
| 04 | On | Off | Off | On | On | | |
| 05 | On | On | Off | Off | Off | | |
| 06 | On | On | Off | Off | On | | |
| 07 | On | On | Off | On | Off | | |
| 08 | On | On | Off | On | On | | |
| 09 | Off | Off | Off | Off | Off | | |
| 10 | Off | Off | Off | Off | On | | |
| 11 | Off | Off | Off | On | Off | | |
| 12 | Off | Off | Off | On | On | | |
| 13 | Off | Off | On | Off | Off | | |
| 14 | Off | Off | On | Off | On | | |
| 15 | Off | Off | On | On | Off | | |
| 16 | Off | Off | On | On | On | | |
